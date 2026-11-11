/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the picker adapter (C5, C6), the temporary originals
// (C7), the entry_media table (ADR 0028 D1) and the housekeeping sweep. The native parts are device checks in the PR.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { adoptPending } from '../src/lib/photos/adopt';
import { editPhotoWords } from '../src/lib/photos/attach';
import { createOrientationBaker } from '../src/lib/photos/baker';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { clearPhotoNotSaved, photoNotSaved } from '../src/lib/photos/failures';
import { photosPausedNow } from '../src/lib/photos/pause';
import { photos } from '../src/lib/photos/copy';
import { expoBakedFiles, expoPickedFiles, expoPhotoFiles, photosDirectory, withinFolder } from '../src/lib/photos/files';
import { sweepPhotos } from '../src/lib/photos/housekeeping';
import { PendingPhoto } from '../src/lib/photos/pending';
import { createPhotoPicker } from '../src/lib/photos/picker';
import { commitPhoto, PhotoSession } from '../src/lib/photos/session';
import { pictureCovered, PHOTO_BLANK_WITHOUT_APP_LOCK } from '../src/lib/photos/surface';
import type { PickedFiles, StoredPhoto } from '../src/lib/photos/types';
import { androidContainer, createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { deps, makeJpeg, memoryFiles } from './photos-helpers';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-image-picker', () => ({ launchImageLibraryAsync: async () => ({ canceled: true, assets: null }) }));

const SRC = join(__dirname, '..', 'src');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });

// ---- C5: one adapter file, one call, fixed options, no permission or camera or library name anywhere -------------------

const BANNED_NAMES = [
  'launchCameraAsync', 'requestCameraPermissionsAsync', 'getCameraPermissionsAsync', 'requestMediaLibraryPermissionsAsync',
  'getMediaLibraryPermissionsAsync', 'useCameraPermissions', 'useMediaLibraryPermissions', 'requestMediaLibraryWriteOnlyPermissionsAsync',
];
const BANNED_MODULES = /^(expo-media-library|expo-camera)(\/|$)/;

/** Everything the scan reports for one source text: imports of the picker, banned names (aliases included), banned modules. */
export function scanPickerUse(source: string, file = 'x.ts'): { importsPicker: boolean; banned: string[]; calls: { name: string; options: Record<string, string> | null }[] } {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = { importsPicker: false, banned: [] as string[], calls: [] as { name: string; options: Record<string, string> | null }[] };
  const isPicker = (s: string) => s === 'expo-image-picker' || s.startsWith('expo-image-picker/');
  const visit = (n: ts.Node): void => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      const m = n.moduleSpecifier.text;
      if (isPicker(m)) out.importsPicker = true;
      if (BANNED_MODULES.test(m)) out.banned.push(m);
    }
    if (ts.isCallExpression(n) && n.arguments.length > 0 && ts.isStringLiteralLike(n.arguments[0])) {
      const arg = n.arguments[0].text;
      const callee = n.expression.getText(sf);
      if ((callee === 'require' || n.expression.kind === ts.SyntaxKind.ImportKeyword) && isPicker(arg)) out.importsPicker = true;
      if ((callee === 'require' || n.expression.kind === ts.SyntaxKind.ImportKeyword) && BANNED_MODULES.test(arg)) out.banned.push(arg);
    }
    if (ts.isIdentifier(n) && BANNED_NAMES.includes(n.text)) out.banned.push(n.text);
    if (ts.isStringLiteralLike(n) && BANNED_NAMES.includes(n.text)) out.banned.push(n.text); // ImagePicker['launchCameraAsync']
    if (ts.isCallExpression(n)) {
      const callee = ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : ts.isIdentifier(n.expression) ? n.expression.text : '';
      if (callee === 'launchImageLibraryAsync') {
        const a = n.arguments[0];
        out.calls.push({
          name: callee,
          options: a && ts.isObjectLiteralExpression(a) && a.properties.every(ts.isPropertyAssignment) ? Object.fromEntries(a.properties.map((p) => [(p.name as ts.Identifier).text, (p as ts.PropertyAssignment).initializer.getText(sf)])) : null,
        });
      }
    }
    n.forEachChild(visit);
  };
  visit(sf);
  return out;
}

describe('[NS-01-R2][NS-01-R22][C5] the only picker call is the system photo picker with fixed options', () => {
  const files = walk(SRC);
  const scans = files.map((f) => ({ f: relative(SRC, f), s: scanPickerUse(readFileSync(f, 'utf8'), f) }));

  it('[C5] exactly one file imports expo-image-picker', () => {
    expect(scans.filter((x) => x.s.importsPicker).map((x) => x.f)).toEqual(['lib/photos/picker.ts']);
  });
  it('[C5] no file in the app names a camera, permission or media-library call or module', () => {
    expect(scans.flatMap((x) => x.s.banned.map((b) => `${x.f}: ${b}`))).toEqual([]);
  });
  it('[C5] the one call is launchImageLibraryAsync with exactly images, one, no editing, no exif, no base64', () => {
    const calls = scans.flatMap((x) => x.s.calls.map((c) => ({ ...c, f: x.f })));
    expect(calls.length).toBe(1);
    expect(calls[0].f).toBe('lib/photos/picker.ts');
    expect(calls[0].options).toEqual({ mediaTypes: "['images']", allowsMultipleSelection: 'false', allowsEditing: 'false', exif: 'false', base64: 'false' });
  });
  it('[C5] positive control: each banned thing in a fixture makes the scan fail', () => {
    const bad = [
      "import * as P from 'expo-image-picker'; P.launchCameraAsync({});",
      "import { requestMediaLibraryPermissionsAsync as ask } from 'expo-image-picker'; ask();",
      "import { useCameraPermissions } from 'expo-image-picker';",
      "const P = require('expo-image-picker'); P['getMediaLibraryPermissionsAsync']();",
      "import * as M from 'expo-media-library';",
      "const C = await import('expo-camera');",
      "import { getCameraPermissionsAsync } from 'expo-image-picker';",
    ];
    for (const src of bad) expect(scanPickerUse(src).banned.length, src).toBeGreaterThan(0);
    expect(scanPickerUse("const P = require('expo-image-picker');").importsPicker).toBe(true);
    expect(scanPickerUse("const P = await import('expo-image-picker');").importsPicker).toBe(true);
    // an options change shows in the scan: allowsEditing true would switch the package to the old picker
    const opts = scanPickerUse("P.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true });").calls[0].options;
    expect(opts?.allowsEditing).toBe('true');
    expect(scanPickerUse('P.launchImageLibraryAsync(options);').calls[0].options).toBeNull();
  });
});

// ---- C6: the adapter keeps only the uri ---------------------------------------------------------------------------

describe('[NX-39-R50][C6] the picker adapter keeps only the uri', () => {
  const CANARY = 'CANARY-/private/var/mobile/Containers/IMG_4521-Berkeley.HEIC';
  const extra = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`field${i}`, `v${i}`]));
  const asset = {
    uri: 'file:///var/mobile/Containers/Data/Application/A/Library/Caches/ImagePicker/9D2.jpg',
    assetId: 'A1B2/L0/001', fileName: 'IMG_4521.HEIC', exif: { GPSLatitude: 37.8 }, base64: 'AAAA', width: 4032, height: 3024, fileSize: 2_100_000,
    mimeType: 'image/heic', pairedVideoUri: 'file:///x/live.mov', type: 'livePhoto', ...extra,
  };

  it('[C6] a result with 40 fields yields the uri and nothing else; the session and its fields hold only the uri', async () => {
    const seen: unknown[] = [];
    const picker = createPhotoPicker({ launchImageLibraryAsync: async (o: unknown) => (seen.push(o), { canceled: false, assets: [asset] }) } as never);
    const r = await picker.open({}).done;
    expect(r).toEqual({ status: 'picked', asset: { uri: asset.uri } });
    expect(JSON.stringify(r)).not.toMatch(/assetId|IMG_4521|GPS|field\d|livePhoto|live\.mov|base64|AAAA/);
    expect(seen).toEqual([{ mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false, exif: false, base64: false }]);
    const s = new PhotoSession();
    s.pick(r.status === 'picked' ? { ...r.asset, ...(asset as object) } as never : { uri: '' });
    expect(Object.keys(s.source!)).toEqual(['uri']);
  });
  it('[C6] a failure crosses as a closed code with no native text', async () => {
    const log: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => void log.push(a.join(' ')));
    const picker = createPhotoPicker({ launchImageLibraryAsync: async () => { throw new Error(CANARY); } } as never);
    const r = await picker.open({}).done;
    expect(r).toEqual({ status: 'failed' });
    expect(JSON.stringify(r) + log.join('')).not.toContain('CANARY');
    spy.mockRestore();
  });
  it('[C6] cancel, an empty result and a result with no uri are told apart and keep nothing', async () => {
    const run = async (res: unknown) => createPhotoPicker({ launchImageLibraryAsync: async () => res } as never).open({}).done;
    expect(await run({ canceled: true, assets: null })).toEqual({ status: 'cancelled' });
    expect(await run({ canceled: false, assets: [] })).toEqual({ status: 'failed' });
    expect(await run({ canceled: false, assets: [{ fileName: 'x.jpg' }] })).toEqual({ status: 'failed' });
  });
});

// ---- C7: no temporary original survives ----------------------------------------------------------------------------

function pickedMemory(initial: Record<string, Uint8Array>): PickedFiles & { left: () => string[]; sweeps: number } {
  const m = new Map(Object.entries(initial));
  const f = {
    sweeps: 0,
    left: () => [...m.keys()],
    async read(uri: string) {
      const b = m.get(uri);
      if (!b) throw new Error('gone');
      return b;
    },
    async remove(uri: string) {
      m.delete(uri);
    },
    async sweep() {
      f.sweeps++;
      m.clear();
    },
  };
  return f;
}

describe('[NX-39-R53][C7] no temporary original survives an interrupted attach', () => {
  const URI = 'file:///c/ImagePicker/a.jpg';
  const WORDS = 'Asha and the rain boots.';
  it('[C7] after a successful strip the original is gone', async () => {
    const files = pickedMemory({ [URI]: makeJpeg({ exif: true }) });
    const p = new PendingPhoto(files);
    await p.set({ uri: URI });
    const { d, files: stored } = deps();
    expect((await p.commit(d, { entryId: 'e1', finalText: WORDS }))?.status).toBe('stored');
    expect(files.left()).toEqual([]);
    expect(stored.disk.size).toBe(1);
    expect(p.source).toBeNull();
  });
  it('[C7] after a failed strip (not a picture, damaged, or a failing disk) the original is gone and nothing is stored', async () => {
    for (const bytes of [Uint8Array.of(1, 2, 3, 4, 5), makeJpeg().slice(0, 12)]) {
      const files = pickedMemory({ [URI]: bytes });
      const p = new PendingPhoto(files);
      await p.set({ uri: URI });
      const { d, files: stored } = deps();
      expect((await p.commit(d, { entryId: 'e1', finalText: WORDS }))?.status).toBe('unreadable');
      expect(files.left()).toEqual([]);
      expect(stored.disk.size).toBe(0);
    }
    const files = pickedMemory({ [URI]: makeJpeg({ exif: true }) });
    const p = new PendingPhoto(files);
    await p.set({ uri: URI });
    const { d, files: stored } = deps({ files: memoryFiles({ failWrite: true }) });
    expect((await p.commit(d, { entryId: 'e1', finalText: WORDS }))?.status).toBe('failed');
    expect(files.left()).toEqual([]);
    expect(stored.disk.size).toBe(0);
  });
  it('[C7] a read that fails also ends with the original removed', async () => {
    const files = pickedMemory({});
    const p = new PendingPhoto(files);
    await p.set({ uri: URI });
    const { d } = deps();
    expect((await p.commit(d, { entryId: 'e1', finalText: WORDS }))?.status).toBe('failed');
    expect(files.left()).toEqual([]);
  });
  it('[C7] a cancel (discard) removes the original, and so does a replace after the Undo window and a take-off after it', async () => {
    let t = 0;
    const files = pickedMemory({ [URI]: makeJpeg(), 'file:///c/ImagePicker/b.jpg': makeJpeg() });
    const p = new PendingPhoto(files, () => t);
    await p.set({ uri: URI });
    await p.set({ uri: 'file:///c/ImagePicker/b.jpg' }); // replace: the first waits for Undo
    expect(files.left().sort()).toEqual([URI, 'file:///c/ImagePicker/b.jpg']);
    expect(p.canUndo).toBe(true);
    await p.settle();
    expect(files.left()).toEqual(['file:///c/ImagePicker/b.jpg']);
    p.remove();
    t = 11_000;
    expect(p.canUndo).toBe(false);
    expect(await p.undo()).toBe(false);
    await p.discard();
    expect(files.left()).toEqual([]);
  });
  it('[C7] Undo brings the earlier picture back and removes the replacement\'s original', async () => {
    const files = pickedMemory({ [URI]: makeJpeg(), 'file:///c/ImagePicker/b.jpg': makeJpeg() });
    const p = new PendingPhoto(files);
    await p.set({ uri: URI });
    await p.set({ uri: 'file:///c/ImagePicker/b.jpg' });
    expect(await p.undo()).toBe(true);
    expect(p.source?.uri).toBe(URI);
    expect(files.left()).toEqual([URI]);
  });
  it('[C7] a picture with no words is not read into a copy and stays pending', async () => {
    const files = pickedMemory({ [URI]: makeJpeg() });
    const p = new PendingPhoto(files);
    await p.set({ uri: URI });
    const { d, files: stored } = deps();
    expect((await p.commit(d, { entryId: 'e1', finalText: '  ' }))?.status).toBe('needs_words');
    expect(stored.disk.size).toBe(0);
    expect(files.left()).toEqual([URI]);
  });
});

describe('[NX-39-R53][C7] the launch sweep empties Caches/ImagePicker and refuses to touch anything else', () => {
  beforeEach(() => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000001'));
  });
  it('[C7] 0 files remain in the picker folder after the sweep; other folders and files are untouched', async () => {
    const cache = h.disk.caches;
    put(h.disk, `${cache}ImagePicker/a.jpg`, 100);
    put(h.disk, `${cache}ImagePicker/b.heic`, 100);
    put(h.disk, `${cache}other/keep.bin`, 10);
    put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()].filter((u) => u.includes('/ImagePicker/'))).toEqual([]);
    expect([...h.disk.files.keys()].length).toBe(2);
  });
  it('[C7] remove() only removes a file directly inside the picker folder', async () => {
    const cache = h.disk.caches;
    const inside = put(h.disk, `${cache}ImagePicker/a.jpg`, 10);
    const other = put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    const traversal = put(h.disk, `${cache}ImagePicker/../x.bin`, 10);
    const f = expoPickedFiles();
    await f.remove(other);
    await f.remove(traversal);
    expect(h.disk.files.has(other)).toBe(true);
    await f.remove(inside);
    expect(h.disk.files.has(inside)).toBe(false);
    await expect(f.read(other)).rejects.toThrow();
    expect(withinFolder(`${cache}ImagePicker/a.jpg`, `${cache}ImagePicker/`)).toBe(true);
    expect(withinFolder(`${cache}ImagePicker/sub/a.jpg`, `${cache}ImagePicker/`)).toBe(false);
    expect(withinFolder(`${cache}ImagePicker/..%2Fx`, `${cache}ImagePicker/`)).toBe(false);
  });
  it('[C9] the stored copy is <media_id>.jpg in Application Support/photos (not Documents): opaque name, refuses any path with a separator', async () => {
    const files = expoPhotoFiles();
    await files.write('0194-abc.jpg', Uint8Array.of(1, 2, 3));
    const support = h.disk.documents.replace(/Documents\/$/, 'Library/Application%20Support/');
    expect([...h.disk.files.keys()]).toEqual([`${support}photos/0194-abc.jpg`]);
    expect([...h.disk.files.keys()].some((u) => u.startsWith(h.disk.documents))).toBe(false);
    expect(await files.list()).toEqual(['0194-abc.jpg']);
    await expect(files.write('../x.jpg', Uint8Array.of(1))).rejects.toThrow();
    await expect(files.write('e1/m1.jpg', Uint8Array.of(1))).rejects.toThrow();
    await files.remove('0194-abc.jpg');
    expect(await files.list()).toEqual([]);
  });
});

// ---- entry_media (ADR 0028 D1) and the sweep ------------------------------------------------------------------------

const ctx = { now: '2026-11-11T00:00:00.000Z', newId: () => 'id' };
const row = (entryId: string, mediaId: string, over: Partial<StoredPhoto> = {}): StoredPhoto => ({
  entryId, mediaId, ext: 'jpg', bytes: 10, sha256: 'ab', width: 4, height: 4, text: null, place: null, addedAt: '2026-11-11T00:00:00Z', deletedAt: null, ...over,
});
const letter = (db: ReturnType<typeof nodeDb>['db'], id: string, deleted: string | null = null) =>
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text, in_book, updated_at, deleted_at)
     VALUES (?, 'letter', '2026-06-12', '2026-06-12T09:00:00Z', 'typed', 'clean', 1, 'x', '[]', 'She laughed.', 1, '2026-06-12T09:00:00Z', ?)`,
    id, deleted,
  );

describe('[ADR 0028 D1] entry_media: local migration 11', () => {
  it('[D1] the migration adds the table and its three indexes only, and the newest version is 11', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    expect(LATEST_VERSION).toBe(11);
    expect(MIGRATIONS.map((m) => m.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const cols = db.all<{ name: string }>('PRAGMA table_info(entry_media)').map((c) => c.name);
    expect(cols).toEqual(['id', 'entry_id', 'draft_id', 'kind', 'ext', 'bytes', 'sha256', 'width', 'height', 'photo_text', 'place', 'added_at']);
    expect(cols).not.toContain('deleted_at');
    expect(db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='entry_media' AND name NOT LIKE 'sqlite_%'").map((i) => i.name).sort())
      .toEqual(['entry_media_draft_idx', 'entry_media_entry_idx', 'entry_media_one_photo_idx']);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entry_media')?.n).toBe(0);
  });
  it('[D1] it queues nothing for sync and a phone on 10 gains the table without touching a letter', () => {
    const { db } = nodeDb();
    migrate(db, ctx, MIGRATIONS.slice(0, 10));
    letter(db, 'e1');
    const outboxBefore = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE name LIKE '%outbox%'").length;
    const countOutbox = () => (outboxBefore ? db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')?.n ?? 0 : 0);
    const before = countOutbox();
    expect(migrate(db, ctx)).toMatchObject({ from: 10, to: 11 });
    expect(countOutbox()).toBe(before);
    expect(db.get<{ final_text: string }>("SELECT final_text FROM entries WHERE id='e1'")?.final_text).toBe('She laughed.');
  });
  it('[D1] the checks hold: photo only, jpg only, 140 and 60 characters, an owner that is either a letter or a draft, one picture per owner', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const ins = (id: string, entry: string | null, draft: string | null, over: Record<string, string | number | null> = {}) =>
      db.run(
        'INSERT INTO entry_media (id, entry_id, draft_id, kind, ext, bytes, sha256, photo_text, place, added_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        id, entry, draft, (over.kind as string) ?? 'photo', (over.ext as string) ?? 'jpg', 1, 'h', (over.text as string | null) ?? null, (over.place as string | null) ?? null, 't',
      );
    ins('m1', 'e1', null);
    expect(() => ins('m2', 'e1', null)).toThrow(); // one per letter
    expect(() => ins('m3', null, null)).toThrow(); // an owner is required
    expect(() => ins('m4', 'e2', 'd2')).toThrow(); // and only one
    expect(() => ins('m5', 'e3', null, { kind: 'video' })).toThrow();
    expect(() => ins('m6', 'e3', null, { ext: 'png' })).toThrow();
    expect(() => ins('m7', 'e3', null, { text: 'x'.repeat(141) })).toThrow();
    expect(() => ins('m8', 'e3', null, { place: 'x'.repeat(61) })).toThrow();
    ins('m9', 'e4', null, { text: 'x'.repeat(140), place: 'y'.repeat(60) });
  });
  it('[D1] the store: put replaces the letter\'s row, and deletedAt is derived from the letter, never written', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'e1');
    const store = entryMediaStore(db);
    store.put(row('e1', 'm1', { text: 'Rain boots', place: 'the back step' }));
    expect(store.get('e1')).toMatchObject({ mediaId: 'm1', text: 'Rain boots', place: 'the back step', deletedAt: null, ext: 'jpg' });
    store.put(row('e1', 'm2'));
    expect(db.all('SELECT id FROM entry_media')).toEqual([{ id: 'm2' }]);
    db.run("UPDATE entries SET deleted_at = '2026-11-12T00:00:00Z' WHERE id = 'e1'");
    expect(store.get('e1')?.deletedAt).toBe('2026-11-12T00:00:00Z'); // the letter's own deleted_at
    db.run("UPDATE entries SET deleted_at = NULL WHERE id = 'e1'");
    expect(store.get('e1')?.deletedAt).toBeNull(); // restore needed no picture write
    expect(store.all().length).toBe(1);
    store.remove('e1');
    expect(store.get('e1')).toBeNull();
  });
});

describe('[ADR 0028 D1][D5] the sweep keeps files and rows in step and is safe to repeat', () => {
  it('[D5] a stray file, a purged letter\'s picture, a row with no file and the picker\'s originals are all cleaned; a live picture stays', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'live');
    letter(db, 'shelf', '2026-11-12T00:00:00Z'); // in Recently deleted: kept
    const store = entryMediaStore(db);
    store.put(row('live', 'mLive'));
    store.put(row('shelf', 'mShelf'));
    store.put(row('gone', 'mGone')); // its letter was purged
    store.put(row('live2', 'mNoFile')); // no letter and no file
    letter(db, 'live2');
    const files = memoryFiles();
    for (const n of ['mLive.jpg', 'mShelf.jpg', 'mGone.jpg', 'stray.jpg', 'half.jpg.part']) await files.write(n, Uint8Array.of(1));
    const picked = pickedMemory({ 'file:///c/ImagePicker/a.jpg': Uint8Array.of(1) });
    const counts = await sweepPhotos(db, files, picked);
    expect([...files.disk.keys()].sort()).toEqual(['mLive.jpg', 'mShelf.jpg']);
    expect(db.all<{ id: string }>('SELECT id FROM entry_media ORDER BY id').map((r) => r.id)).toEqual(['mLive', 'mShelf']);
    expect(counts).toEqual({ orphanFiles: 2, orphanRows: 1, missingFileRows: 1 });
    expect(picked.left()).toEqual([]);
    expect(await sweepPhotos(db, files, picked)).toEqual({ orphanFiles: 0, orphanRows: 0, missingFileRows: 0 }); // repeat
  });
  it('[D5] an unreadable folder changes nothing; a file that will not go keeps its row for the next launch', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const store = entryMediaStore(db);
    store.put(row('gone', 'mGone'));
    const broken = { ...memoryFiles(), list: async () => { throw new Error('read'); } };
    const rows = () => db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entry_media')!.n;
    expect(await sweepPhotos(db, broken, pickedMemory({}))).toEqual({ orphanFiles: 0, orphanRows: 0, missingFileRows: 0 });
    expect(rows()).toBe(1);
    const stubborn = memoryFiles();
    await stubborn.write('mGone.jpg', Uint8Array.of(1));
    stubborn.remove = async () => { throw new Error('busy'); };
    await sweepPhotos(db, stubborn, pickedMemory({}));
    expect(rows()).toBe(1);
  });
});

describe('[NS-01-R13][NX-39-R36][C10] the switcher snapshot is blank (Karma ruling: with or without App lock)', () => {
  it('[C10] a photo on screen is covered whenever the app is not in front, App lock on or off', () => {
    expect(PHOTO_BLANK_WITHOUT_APP_LOCK).toBe(true);
    for (const lockOn of [true, false]) {
      expect(pictureCovered('inactive', lockOn)).toBe(true);
      expect(pictureCovered('background', lockOn)).toBe(true);
      expect(pictureCovered('active', lockOn)).toBe(false);
    }
    expect(pictureCovered('active', true, false)).toBe(true); // locked cold open
  });
  it('[C10] every component that draws a stored or pending picture goes through PhotoFrame, which asks the cover', () => {
    const dir = join(SRC, 'components', 'photos');
    const drawsImage = walk(dir).filter((f) => /<Image\b/.test(readFileSync(f, 'utf8'))).map((f) => relative(dir, f));
    expect(drawsImage).toEqual(['photo-frame.tsx']);
    expect(readFileSync(join(dir, 'photo-frame.tsx'), 'utf8')).toMatch(/usePictureCovered\(\)[\s\S]*if \(covered \|\| failed\)/);
  });
});

// ---- Application Support folder, the native step's temporary files ------------------------------------------------

describe('[SEC-R15][C9] where the stored copy lives', () => {
  it('[C9] iOS: <container>/Library/Application Support/photos, beside Documents; Android: the files folder', () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000009'));
    expect(photosDirectory().uri).toBe(`${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/photos/`);
    h.disk = createDisk(androidContainer());
    expect(photosDirectory().uri).toBe(`${h.disk.documents}photos/`);
  });
  it('[C9] the erase-everything code removes that same folder and the picker and re-encode caches', () => {
    const src = readFileSync(join(SRC, 'lib', 'erase-everything.ts'), 'utf8');
    expect(src).toMatch(/photosDirectory\(\)/);
    expect(src).not.toMatch(/Paths\.document, 'photos'/);
    expect(src).toMatch(/'ImagePicker', 'ScribePhoto'/);
  });
});

describe('[NX-39-R53][C7] the native step\'s temporary JPEG is read once and removed', () => {
  beforeEach(() => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000002'));
  });
  it('[C7] the baker reads the output, removes it, drops native error text, and refuses a missing uri or module', async () => {
    const out = put(h.disk, `${h.disk.caches}ScribePhoto/x.jpg`, makeJpeg());
    const baker = createOrientationBaker({ reencodeUpright: async () => out }, expoBakedFiles())!;
    const bytes = await baker.bake(Uint8Array.of(1), { uri: 'file:///c/ImagePicker/a.jpg' });
    expect(bytes && bytes.length).toBeGreaterThan(10);
    expect(h.disk.files.has(out)).toBe(false);
    expect(await baker.bake(Uint8Array.of(1))).toBeNull(); // no uri: nothing to re-encode
    expect(createOrientationBaker(null, expoBakedFiles())).toBeUndefined();
    const log: string[] = [];
    const bad = createOrientationBaker({ reencodeUpright: async () => { throw new Error('CANARY /private/var/IMG_1.HEIC'); } }, expoBakedFiles())!;
    expect(await bad.bake(Uint8Array.of(1), { uri: 'u' })).toBeNull();
    expect(log.join('')).not.toContain('CANARY');
    // an output outside Caches/ScribePhoto is never read or deleted
    const other = put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    const sneaky = createOrientationBaker({ reencodeUpright: async () => other }, expoBakedFiles())!;
    expect(await sneaky.bake(Uint8Array.of(1), { uri: 'u' })).toBeNull();
    expect(h.disk.files.has(other)).toBe(true);
  });
  it('[C7] the launch sweep empties Caches/ScribePhoto too', async () => {
    put(h.disk, `${h.disk.caches}ScribePhoto/left.jpg`, 10);
    put(h.disk, `${h.disk.caches}ImagePicker/left.jpg`, 10);
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()].filter((u) => /ScribePhoto|ImagePicker/.test(u))).toEqual([]);
  });
  it('[C8] a baker wired into commit turns a rotated picture upright using the picked file\'s uri', async () => {
    const seen: (string | undefined)[] = [];
    const files = pickedMemory({ 'file:///c/ImagePicker/r.jpg': makeJpeg({ exif: true, orientation: 6 }) });
    const p = new PendingPhoto(files);
    await p.set({ uri: 'file:///c/ImagePicker/r.jpg' });
    const { d, files: stored } = deps();
    d.orientation = { bake: async (_o, s) => (seen.push(s?.uri), makeJpeg({ seed: 4 })) };
    expect((await p.commit(d, { entryId: 'e1', finalText: 'Words.' }))?.status).toBe('stored');
    expect(seen).toEqual(['file:///c/ImagePicker/r.jpg']);
    expect(stored.disk.size).toBe(1);
  });
});

describe('[NS-01-R6][C8] the Swift module is ImageIO only', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  const strip = swift.replace(/\/\/.*$/gm, ''); // code only; the comments name what is absent
  it('[C8] no network, library, camera, location or permission API appears; only ImageIO', () => {
    expect(strip).not.toMatch(/URLSession|URLRequest|NWConnection|CFNetwork|Photos|PHPhoto|PHPicker|UIImagePicker|AVCapture|AVFoundation|CoreLocation|CLLocation|requestAuthorization|UsageDescription|NSURLConnection|WebKit|UIKit/);
    expect([...strip.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort()).toEqual(['ExpoModulesCore', 'Foundation', 'ImageIO', 'UniformTypeIdentifiers']);
  });
  it('[C8] it asks ImageIO for the transformed, from-image-always thumbnail, copies no source properties, and never writes an orientation', () => {
    expect(strip).toMatch(/kCGImageSourceCreateThumbnailWithTransform: true/);
    expect(strip).toMatch(/kCGImageSourceCreateThumbnailFromImageAlways: true/);
    expect(strip).toMatch(/kCGImageMetadataShouldExcludeGPS: true/);
    expect(strip).toMatch(/kCGImageMetadataShouldExcludeXMP: true/);
    expect(strip).not.toMatch(/kCGImagePropertyOrientation|kCGImageDestinationMetadata|CGImageDestinationAddImageFromSource|CGImageDestinationCopyImageSource|kCGImagePropertyExif|kCGImagePropertyGPS/);
    expect(strip.match(/CGImageDestinationAddImage\(/g)?.length).toBe(1);
  });
  it('[C8] errors are one closed code and the pod depends on ExpoModulesCore only', () => {
    expect(strip).toMatch(/"photo_reencode_failed"/);
    expect(strip).not.toMatch(/localizedDescription|\\\(error|description:/);
    const pod = readFileSync(join(dir, 'ios', 'ScribePhoto.podspec'), 'utf8');
    expect([...pod.matchAll(/s\.dependency '([^']+)'/g)].map((m) => m[1])).toEqual(['ExpoModulesCore']);
    expect(JSON.parse(readFileSync(join(dir, 'expo-module.config.json'), 'utf8')).apple.modules).toEqual(['ScribePhotoModule']);
  });
});

// ---- draft-owned pictures, words editing, the not-saved line, the pause ---------------------------------------------

describe('[ADR 0028 D1] a draft owns its picture until Keep', () => {
  it('[D1] the row is draft-owned while only a draft exists, hidden from the lens, and moves to the letter with Keep', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const store = entryMediaStore(db);
    store.put(row('d1', 'mD1')); // no entries row: owned by the draft
    expect(db.get('SELECT entry_id, draft_id FROM entry_media WHERE id = ?', 'mD1')).toEqual({ entry_id: null, draft_id: 'd1' });
    expect(store.get('d1')?.mediaId).toBe('mD1');
    expect(store.all()).toEqual([]); // not a kept letter yet
    letter(db, 'd1'); // Keep: the letter takes the draft's id
    db.run('UPDATE entry_media SET entry_id = draft_id, draft_id = NULL WHERE draft_id = ?', 'd1'); // store.saveLetterFromDraft
    expect(db.get('SELECT entry_id, draft_id FROM entry_media WHERE id = ?', 'mD1')).toEqual({ entry_id: 'd1', draft_id: null });
    expect(store.all().map((p) => p.mediaId)).toEqual(['mD1']);
  });
  it('[D1] store.saveLetterFromDraft makes that move inside the letter\'s own transaction', () => {
    const src = readFileSync(join(SRC, 'lib', 'store.ts'), 'utf8');
    expect(src).toMatch(/UPDATE entry_media SET entry_id = draft_id, draft_id = NULL WHERE draft_id = \?', draftId\);/);
    expect(src.indexOf('UPDATE entry_media SET entry_id = draft_id')).toBeGreaterThan(src.indexOf('letters.saveFromDraft(c, draftId'));
  });
  it('[D1] the sweep hands a draft picture to its letter after a kill, removes it when the draft is let go, and keeps a live draft\'s', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'kept'); // the letter exists, the move did not run
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('live', 'c', 'typed', 't')");
    const store = entryMediaStore(db);
    store.put(row('kept', 'mKept'));
    db.run("UPDATE entry_media SET entry_id = NULL, draft_id = 'kept' WHERE id = 'mKept'");
    store.put(row('live', 'mLive'));
    store.put(row('letgo', 'mGone'));
    const files = memoryFiles();
    for (const n of ['mKept.jpg', 'mLive.jpg', 'mGone.jpg']) await files.write(n, Uint8Array.of(1));
    await sweepPhotos(db, files, pickedMemory({}));
    expect(db.all<{ id: string }>('SELECT id FROM entry_media ORDER BY id').map((r) => r.id)).toEqual(['mKept', 'mLive']);
    expect(db.get('SELECT entry_id FROM entry_media WHERE id = ?', 'mKept')).toEqual({ entry_id: 'kept' });
    expect([...files.disk.keys()].sort()).toEqual(['mKept.jpg', 'mLive.jpg']);
  });
  it('[D1] a draft\'s picture needs no words, a kept letter\'s does', async () => {
    const { d, files } = deps();
    expect((await commitPhoto(d, { entryId: 'd1', finalText: '', bytes: makeJpeg(), text: null, requireWords: false })).status).toBe('stored');
    expect((await commitPhoto(d, { entryId: 'e1', finalText: '', bytes: makeJpeg(), text: null })).status).toBe('needs_words');
    expect(files.disk.size).toBe(1);
  });
});

describe('[NS-01-R21] the parent edits the words and the place of a kept picture', () => {
  it('[R21] only what is typed is stored, trimmed and cut to 140 and 60; empty clears; the other field is left alone', async () => {
    const { d, store } = deps();
    await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', bytes: makeJpeg(), text: 'first', place: 'the park' });
    expect(editPhotoWords(d, 'e1', { text: `  ${'x'.repeat(200)}  ` })).toBe(true);
    expect(store.get('e1')!.text!.length).toBe(140);
    expect(store.get('e1')!.place).toBe('the park');
    editPhotoWords(d, 'e1', { place: 'y'.repeat(90) });
    expect(store.get('e1')!.place!.length).toBe(60);
    editPhotoWords(d, 'e1', { text: '   ', place: '' });
    expect(store.get('e1')).toMatchObject({ text: null, place: null });
    expect(editPhotoWords(d, 'nobody', { text: 'x' })).toBe(false);
  });
  it('[R21] the sqlite store keeps an edit across put (same media id, same file)', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'e1');
    const { d } = deps({ store: entryMediaStore(db) as never });
    d.store.put(row('e1', 'm1'));
    editPhotoWords(d, 'e1', { text: 'Rain boots', place: 'the back step' });
    expect(d.store.get('e1')).toMatchObject({ mediaId: 'm1', text: 'Rain boots', place: 'the back step' });
  });
});

describe('[NS-01-R17] a picture that cannot be stored never un-keeps the letter, and the letter page says so once', () => {
  const WORDS = 'Asha and the rain boots.';
  beforeEach(() => {
    clearPhotoNotSaved('e1');
  });
  it('[R17] a failing disk marks the letter; a later success clears it; a picture with no words marks nothing', async () => {
    const URI = 'file:///c/ImagePicker/a.jpg';
    const run = async (opts: { failWrite?: boolean; text?: string }) => {
      const picked = pickedMemory({ [URI]: makeJpeg({ exif: true }) });
      const p = new PendingPhoto(picked);
      await p.set({ uri: URI });
      const { d } = deps({ files: memoryFiles({ failWrite: opts.failWrite }) });
      await adoptPending(p, () => d, 'e1', opts.text ?? WORDS, true);
      return picked.left();
    };
    expect(await run({ failWrite: true })).toEqual([]);
    expect(photoNotSaved('e1')).toBe(true);
    expect(await run({})).toEqual([]);
    expect(photoNotSaved('e1')).toBe(false);
    clearPhotoNotSaved('e1');
    expect(await run({ text: '' })).toEqual([URI]); // needs words: still pending, nothing marked
    expect(photoNotSaved('e1')).toBe(false);
  });
  it('[R17] a throwing store is caught and marked, never rethrown', async () => {
    const picked = pickedMemory({ 'file:///c/ImagePicker/a.jpg': makeJpeg() });
    const p = new PendingPhoto(picked);
    await p.set({ uri: 'file:///c/ImagePicker/a.jpg' });
    await expect(adoptPending(p, () => { throw new Error('db'); }, 'e1', WORDS, true)).resolves.toBeUndefined();
    expect(photoNotSaved('e1')).toBe(true);
  });
  it('[R17] the letter page draws the line from the content slot, above Add again, for the author only', () => {
    const src = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(src).toMatch(/usePhotoNotSaved\(entryId\)/);
    expect(src).toMatch(/\{notSaved \? <Text[^>]*>\{photos\.book\.letter\.notSaved\}<\/Text> : null\}/);
    expect(src.indexOf('photos.book.letter.notSaved')).toBeLessThan(src.indexOf('photos.book.letter.addPhoto'));
    expect(src).toMatch(/return own && words \?/);
    expect(src).toMatch(/clearPhotoNotSaved\(entryId\)/);
    expect(photos.book.letter.notSaved).toMatch(/words are kept/);
  });
  it('[R17] Review stores a Home pick with the draft and the letter page and Review share the same controls', () => {
    const rv = readFileSync(join(SRC, 'components', 'photos', 'review-photo.tsx'), 'utf8');
    expect(rv).toMatch(/adoptPendingPhoto\(draftId, finalText, false\)/);
    expect(rv).toMatch(/<LetterPhoto entryId=\{draftId\} finalText=\{finalText\} own draft \/>/);
    expect(readFileSync(join(SRC, 'app', 'review.tsx'), 'utf8')).toMatch(/<ReviewPhoto draftId=\{draft\.id\} finalText=\{finalText\} \/>/);
  });
});

describe('[NS-01-R19] the remote pause hides the new surfaces and never turns them on', () => {
  it('[R19] killSwitches.photos true pauses; absent, false, a missing config or an unreadable one do not', () => {
    const at = (cfg: unknown) => photosPausedNow(() => ({ getRemoteConfig: () => cfg as never }));
    expect(at({ killSwitches: { photos: true } })).toBe(true);
    expect(at({ killSwitches: { photos: false } })).toBe(false);
    expect(at({ killSwitches: { sync: true } })).toBe(false);
    expect(at(null)).toBe(false);
    expect(photosPausedNow(() => { throw new Error('no remote'); })).toBe(false);
  });
  it('[R19] every surface asks for it, and the data rights never do', () => {
    for (const f of ['components/photos/letter-photo.tsx', 'app/(tabs)/book.tsx', 'lib/photos/use-photo-start.ts']) expect(readFileSync(join(SRC, f), 'utf8'), f).toMatch(/photosPausedNow\(\)/);
    for (const f of ['lib/photos/lifecycle.ts', 'lib/photos/export.ts', 'lib/photos/housekeeping.ts', 'lib/erase-everything.ts', 'lib/capture/erase.ts']) expect(readFileSync(join(SRC, f), 'utf8'), f).not.toMatch(/photosPausedNow|photosBuildEnabled/);
  });
});
