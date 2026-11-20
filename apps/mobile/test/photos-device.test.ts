/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the file layer over the expo-file-system stand-in (C7,
// C9), the picker adapter (C5, C6), the entry_media table and the launch sweep (ADR 0028 D1, D5), the orientation baker
// (C7), and the scribe-photo Swift module read as source (C8). What only a phone can show is listed as device checks in
// the PR.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { adoptPending } from '../src/lib/photos/adopt';
import { BAKE_TIMEOUT_MS, createOrientationBaker, type BakedFiles } from '../src/lib/photos/baker';
import { entryMediaStore, PhotoOwnerUnknown } from '../src/lib/photos/entry-media';
import { clearPhotoNotSaved, photoNotSaved } from '../src/lib/photos/failures';
import { photosPausedNow } from '../src/lib/photos/pause';
import { expoBakedFiles, expoPickedFiles, expoPhotoFiles, photosDirectory, pickerDestination, withinFolder } from '../src/lib/photos/files';
import { sweepPhotos } from '../src/lib/photos/housekeeping';
import { PendingPhoto } from '../src/lib/photos/pending';
import { createPhotoPicker } from '../src/lib/photos/picker';
import { commitPhoto, PhotoSession } from '../src/lib/photos/session';
import { pictureCovered, PHOTO_BLANK_WITHOUT_APP_LOCK } from '../src/lib/photos/surface';
import { normalizePhotoPlace, normalizePhotoText } from '../src/lib/photos/text';
import type { PickedFiles, StoredPhoto } from '../src/lib/photos/types';
import { androidContainer, createDisk, iosContainer, layOutApp, namesIn, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { deps, makeJpeg, memoryFiles } from './photos-helpers';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));

const SRC = join(__dirname, '..', 'src');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });

// ---- C5: the system picker is reached only through scribe-photo's pickOne, from one file ----------------------------

const BANNED_NAMES = [
  'launchCameraAsync', 'launchImageLibraryAsync', 'requestCameraPermissionsAsync', 'getCameraPermissionsAsync', 'requestMediaLibraryPermissionsAsync',
  'getMediaLibraryPermissionsAsync', 'useCameraPermissions', 'useMediaLibraryPermissions', 'requestMediaLibraryWriteOnlyPermissionsAsync',
];
const BANNED_MODULES = /^(expo-image-picker|expo-media-library|expo-camera|react-native-image-picker|react-native-vision-camera)(\/|$)/;

/** Everything the scan reports for one source text: banned modules (aliases and dynamic imports included), banned names, pickOne calls. */
export function scanPickerUse(source: string, file = 'x.ts'): { banned: string[]; pickCalls: number } {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = { banned: [] as string[], pickCalls: 0 };
  const visit = (n: ts.Node): void => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier) && BANNED_MODULES.test(n.moduleSpecifier.text)) out.banned.push(n.moduleSpecifier.text);
    if (ts.isCallExpression(n) && n.arguments.length > 0 && ts.isStringLiteralLike(n.arguments[0])) {
      const callee = n.expression.getText(sf);
      if ((callee === 'require' || n.expression.kind === ts.SyntaxKind.ImportKeyword) && BANNED_MODULES.test(n.arguments[0].text)) out.banned.push(n.arguments[0].text);
    }
    if (ts.isIdentifier(n) && BANNED_NAMES.includes(n.text)) out.banned.push(n.text);
    if (ts.isStringLiteralLike(n) && BANNED_NAMES.includes(n.text)) out.banned.push(n.text); // P['launchCameraAsync']
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'pickOne') out.pickCalls++;
    n.forEachChild(visit);
  };
  visit(sf);
  return out;
}

describe('[NS-01-R2][NS-01-R22][C5] the only picker is Apple\'s, through scribe-photo pickOne, called from one file', () => {
  const files = walk(SRC);
  const scans = files.map((f) => ({ f: relative(SRC, f), s: scanPickerUse(readFileSync(f, 'utf8'), f) }));

  it('[NS-01-R2][NS-01-R22][C5] no file imports a picker, camera or media-library package, or names a camera, permission or library call', () => {
    expect(scans.flatMap((x) => x.s.banned.map((b) => `${x.f}: ${b}`))).toEqual([]);
  });
  it('[NS-01-R22][C5] pickOne is called in exactly one place, lib/photos/picker.ts', () => {
    expect(scans.filter((x) => x.s.pickCalls > 0).map((x) => [x.f, x.s.pickCalls])).toEqual([['lib/photos/picker.ts', 1]]);
  });
  it('[NS-01-R22][C5] positive control: each banned thing in a fixture makes the scan fail', () => {
    const bad = [
      "import * as P from 'expo-image-picker';",
      "import { requestMediaLibraryPermissionsAsync as ask } from 'expo-media-library'; ask();",
      "const P = require('expo-image-picker'); P['getMediaLibraryPermissionsAsync']();",
      "const C = await import('expo-camera');",
      'launchCameraAsync({});',
      'P.launchImageLibraryAsync({});',
      "import { useCameraPermissions } from 'react-native-vision-camera';",
    ];
    for (const src of bad) expect(scanPickerUse(src).banned.length, src).toBeGreaterThan(0);
    expect(scanPickerUse('ScribePhoto.pickOne(dest);').pickCalls).toBe(1);
  });
});

// ---- C6: the picker port keeps only the uri of the file it asked for ------------------------------------------------

describe('[NX-39-R50][C6] the picker port keeps only the uri', () => {
  const DEST = 'file:///var/mobile/Containers/Data/Application/ASHA/Library/Caches/ImagePicker/0194-a.img';
  /** The picker's hooks: what it removed, and whether the app lock is up. */
  const hooks = (gone: string[] = [], locked: () => boolean = () => false) => ({ discard: async (u: string) => void gone.push(u), locked });
  it('[C6] a pick yields the destination it asked for and nothing else; the session keeps only the uri', async () => {
    const asked: string[] = [];
    const picker = createPhotoPicker({ pickOne: async (d: string) => (asked.push(d), d) }, () => DEST, hooks());
    const r = await picker.open({}).done;
    expect(asked).toEqual([DEST]);
    expect(r).toEqual({ status: 'picked', asset: { uri: DEST } });
    const s = new PhotoSession();
    s.pick({ ...(r.status === 'picked' ? r.asset : { uri: '' }), pairedVideoUri: 'file:///x/live.mov' });
    expect(Object.keys(s.source!)).toEqual(['uri']);
  });
  it('[C6] a failure crosses as a closed code with no native text', async () => {
    const spies = (['error', 'warn', 'log', 'info', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    try {
      const picker = createPhotoPicker({ pickOne: async () => { throw new Error('CANARY-/private/var/mobile/IMG_4521-Berkeley.HEIC'); } }, () => DEST, hooks());
      const r = await picker.open({}).done;
      expect(r).toEqual({ status: 'failed' });
      expect(JSON.stringify(r) + spies.flatMap((s) => s.mock.calls.map((c) => c.map(String).join(' '))).join('')).not.toContain('CANARY');
    } finally {
      for (const s of spies) s.mockRestore();
    }
  });
  it('[C6] Cancel, an answer naming another file and a cancel by the app are told apart and keep nothing', async () => {
    const run = (answer: string | null) => createPhotoPicker({ pickOne: async () => answer }, () => DEST, hooks()).open({}).done;
    expect(await run(null)).toEqual({ status: 'cancelled' });
    expect(await run('file:///var/mobile/Containers/Data/Application/ASHA/Documents/ExpoAudio/take.m4a')).toEqual({ status: 'failed' });
    const gone: string[] = [];
    const p = createPhotoPicker({ pickOne: async (d: string) => d }, () => DEST, hooks(gone)).open({});
    p.cancel();
    expect(await p.done).toEqual({ status: 'cancelled' });
    await new Promise((r) => setTimeout(r, 0));
    expect(gone).toEqual([DEST]); // the copy that landed after the cancel is removed
  });
  it('[NS-01-R17][C6] one pick at a time, and Cancel ends the wait at once: a copy that lands later is removed', async () => {
    let land!: (uri: string | null) => void;
    const calls: string[] = [];
    const gone: string[] = [];
    const picker = createPhotoPicker({ pickOne: (d: string) => (calls.push(d), new Promise<string | null>((r) => (land = r))) }, () => DEST, hooks(gone));
    const first = picker.open({});
    expect(await picker.open({}).done).toEqual({ status: 'cancelled' }); // a second tap opens nothing
    expect(calls).toEqual([DEST]);
    first.cancel(); // an iCloud download still running natively
    expect(await first.done).toEqual({ status: 'cancelled' });
    land(DEST);
    await new Promise((r) => setTimeout(r, 0));
    expect(gone).toEqual([DEST]);
    picker.open({}); // free again after the cancel
    expect(calls).toEqual([DEST, DEST]);
  });
  it('[C6] a pick that lands while the app lock is up is not taken: the run answers cancelled and the copy is removed (review B N-B7 on #834)', async () => {
    const gone: string[] = [];
    let locked = true;
    const picker = createPhotoPicker({ pickOne: async (d: string) => d }, () => DEST, hooks(gone, () => locked));
    expect(await picker.open({}).done).toEqual({ status: 'cancelled' });
    expect(gone).toEqual([DEST]);
    const broken = createPhotoPicker({ pickOne: async (d: string) => d }, () => DEST, hooks(gone, () => { throw new Error('lock'); }));
    expect(await broken.open({}).done).toEqual({ status: 'cancelled' }); // a lock that cannot be read counts as up
    locked = false;
    expect(await picker.open({}).done).toEqual({ status: 'picked', asset: { uri: DEST } });
    expect(gone).toEqual([DEST, DEST]);
    // The phone's picker reads the real lock state, and discards through the picker folder's remover.
    const device = readFileSync(join(__dirname, '..', 'src', 'lib', 'photos', 'device.ts'), 'utf8');
    expect(device).toContain('{ discard: (uri) => picked.remove(uri), locked: appLocked }');
    expect(device).toContain(".getAppLockState().locked;");
  });
  it('[C6] the destination is a new plain file in Caches/ImagePicker, where the reader, the remover and the launch sweep look', () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000003'));
    const dest = pickerDestination('0194-a');
    expect(dest).toBe(`${h.disk.caches}ImagePicker/0194-a.img`);
    expect(withinFolder(dest, `${h.disk.caches}ImagePicker/`)).toBe(true);
    expect(() => pickerDestination('../x')).toThrow();
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
  it('[C9] on a phone with no picture, listing, removing and sweeping make no file and no folder', async () => {
    const files = [...h.disk.files.keys()];
    const dirs = [...h.disk.dirs].sort();
    expect(await expoPhotoFiles().list()).toEqual([]);
    await expoPhotoFiles().remove('m1.jpg');
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()]).toEqual(files);
    expect([...h.disk.dirs].sort()).toEqual(dirs);
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
    expect(h.disk.files.has(traversal)).toBe(true);
    await f.remove(inside);
    expect(h.disk.files.has(inside)).toBe(false);
    await expect(f.read(other)).rejects.toThrow();
    expect(withinFolder(`${cache}ImagePicker/a.jpg`, `${cache}ImagePicker/`)).toBe(true);
    expect(withinFolder(`${cache}ImagePicker/sub/a.jpg`, `${cache}ImagePicker/`)).toBe(false);
    expect(withinFolder(`${cache}ImagePicker/..%2Fx`, `${cache}ImagePicker/`)).toBe(false);
    // judged on the decoded name (review N5): encoded dots and separators, and a malformed escape, never pass
    for (const rest of ['%2E%2E', '.%2E', '%2e%2e', '%2E', 'a%2Fb.img', 'a%5Cb.img', '%E0%A4%A', '.img', 'a.b.img', '']) {
      expect(withinFolder(`${cache}ImagePicker/${rest}`, `${cache}ImagePicker/`), rest).toBe(false);
    }
    expect(withinFolder(`${cache}ImagePicker/0194-ab.img`, `${cache}ImagePicker/`)).toBe(true);
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
  it('[C9] only the stored shape <id>.jpg is written or removed: ".", "..", ".jpg", a separator or another extension is refused, and the folder and its pictures survive (review M1)', async () => {
    const files = expoPhotoFiles();
    await files.write('0194-abc.jpg', Uint8Array.of(1, 2, 3));
    const folder = photosDirectory();
    // The stand-in joins as expo-file-system 57 does: `.` is the folder itself, and create({ overwrite }) would remove it.
    expect(new (await import('expo-file-system')).File(folder, '.').uri).toBe(folder.uri.replace(/\/$/, ''));
    for (const bad of ['.', '..', '.jpg', 'x.jpg.part', 'x.png', 'x.JPG', 'a/b.jpg', '%2E', '', `${'x'.repeat(65)}.jpg`]) {
      await expect(files.write(bad, Uint8Array.of(9)), bad).rejects.toThrow('photo_path_refused');
      await files.remove(bad);
      expect(folder.exists, bad).toBe(true);
      expect(await files.list(), bad).toEqual(['0194-abc.jpg']);
    }
  });
  it('[C9] remove() refuses every name but <id>.jpg: a name that climbs to the database or a recording, and a stray file of another shape, are all left on the phone (review M1, the remove half)', async () => {
    layOutApp(h.disk);
    const files = expoPhotoFiles();
    await files.write('0194-abc.jpg', Uint8Array.of(1, 2, 3));
    const folder = photosDirectory();
    const db = `${h.disk.documents}SQLite/scribe.db`;
    const take = put(h.disk, `${recorderDir(h.disk)}/recording-0194.m4a`, 10);
    const stray = put(h.disk, `${folder.uri}x.png`, 10);
    // Two .jpg files outside photos/, so a guard weakened to "ends in .jpg" goes red.
    const baked = put(h.disk, `${h.disk.caches}ScribePhoto/b.jpg`, 10);
    const docJpg = put(h.disk, `${h.disk.documents}x.jpg`, 10);
    // From photos/, three levels up is the container: these names would reach Documents if remove() trusted them.
    for (const bad of ['../../../Documents/SQLite/scribe.db', '../../../Documents/ExpoAudio/recording-0194.m4a', '../../Caches/ScribePhoto/b.jpg', '../../../Documents/x.jpg', 'x.png', '.', '..', '']) {
      await files.remove(bad);
    }
    expect(h.disk.files.has(db), 'database').toBe(true);
    expect(h.disk.files.has(take), 'recording').toBe(true);
    expect(h.disk.files.has(stray), 'stray file').toBe(true);
    expect(h.disk.files.has(baked), 'the re-encode JPEG').toBe(true);
    expect(h.disk.files.has(docJpg), 'a JPEG in Documents').toBe(true);
    expect(folder.exists).toBe(true);
    expect(namesIn(h.disk, folder.uri)).toEqual(['0194-abc.jpg', 'x.png']);
  });
  it('[C9] the launch sweep empties the two cache folders and never touches a stored picture (review N2 on #841)', async () => {
    const files = expoPhotoFiles();
    await files.write('0194-abc.jpg', Uint8Array.of(1, 2, 3));
    put(h.disk, `${h.disk.caches}ImagePicker/a.img`, 10);
    put(h.disk, `${h.disk.caches}ScribePhoto/b.jpg`, 10);
    await expoPickedFiles().sweep();
    expect(await files.list()).toEqual(['0194-abc.jpg']);
    expect(namesIn(h.disk, `${h.disk.caches}ImagePicker`)).toEqual([]);
    expect(namesIn(h.disk, `${h.disk.caches}ScribePhoto`)).toEqual([]);
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
    // The CHECKs are ceilings in code points, 8 per character a person sees, never the product limit (BL-957): they
    // admit the longest words and place the app keeps, and refuse one code point more.
    expect(() => ins('m7', 'e3', null, { text: 'x'.repeat(1121) })).toThrow();
    expect(() => ins('m8', 'e3', null, { place: 'x'.repeat(481) })).toThrow();
    ins('m9', 'e4', null, { text: 'x'.repeat(1120), place: 'y'.repeat(480) });
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
  it('[NS-01-R21][BL-957] the caps count characters a person sees: at the limit all is kept, one more is cut, whole characters only, with or without Intl.Segmenter, and every kept value passes the column CHECK through the real store', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'e1');
    const d = { ...deps().d, store: entryMediaStore(db) };
    const kinds: Record<string, string> = {
      'a Devanagari conjunct': '\u0915\u094D\u0937',
      'Devanagari ki': '\u0915\u093F',
      'a decomposed accent': 'e\u0301',
      'an emoji ZWJ family': '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}',
      'a flag': '\u{1F1EE}\u{1F1F3}',
    };
    const intl = Intl as { Segmenter?: unknown };
    const seg = intl.Segmenter;
    for (const engine of ['with Segmenter', 'as on Hermes']) {
      if (engine === 'as on Hermes') delete intl.Segmenter;
      try {
        for (const [kind, g] of Object.entries(kinds)) {
          const at = `${engine}, ${kind}`;
          expect([normalizePhotoText(g.repeat(140)), normalizePhotoText(g.repeat(141))], at).toEqual([g.repeat(140), g.repeat(140)]);
          expect([normalizePhotoPlace(g.repeat(60)), normalizePhotoPlace(g.repeat(61))], at).toEqual([g.repeat(60), g.repeat(60)]);
          expect((await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', bytes: makeJpeg(), text: g.repeat(141), place: g.repeat(61) })).status, at).toBe('stored');
          expect([entryMediaStore(db).get('e1')?.text, entryMediaStore(db).get('e1')?.place], at).toEqual([g.repeat(140), g.repeat(60)]);
        }
        // A character longer than 8 code points (a family with skin tones, 11): the cut stops at the column's ceiling,
        // so the store never refuses what the app kept.
        const big = '\u{1F468}\u{1F3FD}\u200D\u{1F469}\u{1F3FD}\u200D\u{1F467}\u{1F3FD}\u200D\u{1F466}\u{1F3FD}';
        expect((await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', bytes: makeJpeg(), text: big.repeat(140), place: big.repeat(60) })).status, engine).toBe('stored');
        expect([entryMediaStore(db).get('e1')?.text, entryMediaStore(db).get('e1')?.place], engine).toEqual([big.repeat(101), big.repeat(43)]);
      } finally {
        intl.Segmenter = seg;
      }
    }
  });
  it('[NS-01-R17] a failed commit never throws, even when taking its row back fails, and keeps the earlier picture (#836 review A N5)', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'e1');
    const files = memoryFiles();
    const d = { ...deps({ files }).d, store: entryMediaStore(db) };
    expect((await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', bytes: makeJpeg(), text: 'First' })).status).toBe('stored');
    db.run("CREATE TRIGGER full BEFORE INSERT ON entry_media BEGIN SELECT RAISE(ABORT, 'database or disk is full'); END");
    await expect(commitPhoto(d, { entryId: 'e1', finalText: 'Words.', bytes: makeJpeg({ seed: 2 }), text: 'Second' })).resolves.toEqual({ status: 'failed' });
    expect([entryMediaStore(db).get('e1')?.text, [...files.disk.keys()]]).toEqual(['First', ['m1.jpg']]);
    db.run('DROP TRIGGER full');
    // The owner went (a let-go draft) between the write and the row: put and the restore both refuse; still no throw.
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('d1', 'c', 'typed', 't')");
    const store = entryMediaStore(db);
    const racing = { ...d, store: { ...store, put: (p: Parameters<typeof store.put>[0]) => (db.run("DELETE FROM drafts WHERE id = 'd1'"), store.put(p)) } };
    await expect(commitPhoto(racing, { entryId: 'd1', finalText: '', bytes: makeJpeg({ seed: 3 }), text: null, requireWords: false })).resolves.toEqual({ status: 'failed' });
    expect([...files.disk.keys()]).toEqual(['m1.jpg']);
  });
  it('[D1] put refuses an owner that is neither a letter nor a draft, with a typed error, and writes nothing (DQ-R07)', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const store = entryMediaStore(db);
    expect(() => store.put(row('nobody', 'm1'))).toThrow(PhotoOwnerUnknown);
    expect(db.all('SELECT id FROM entry_media')).toEqual([]);
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('d1', 'c', 'typed', 't')");
    store.put(row('d1', 'm2'));
    expect(db.get('SELECT entry_id, draft_id FROM entry_media WHERE id = ?', 'm2')).toEqual({ entry_id: null, draft_id: 'd1' });
  });
});

describe('[ADR 0028 D1][D5] the sweep keeps files and rows in step and is safe to repeat', () => {
  it('[D5] a stray picture, a purged letter\'s picture, a row with no file and the picker\'s originals are all cleaned; a live picture stays, and a name of another shape is neither removed nor counted (review A note 8 on #841)', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    letter(db, 'live');
    letter(db, 'shelf', '2026-11-12T00:00:00Z'); // in Recently deleted: kept
    const store = entryMediaStore(db);
    store.put(row('live', 'mLive'));
    store.put(row('shelf', 'mShelf'));
    letter(db, 'gone');
    store.put(row('gone', 'mGone'));
    db.run("DELETE FROM entries WHERE id = 'gone'"); // its letter was purged
    letter(db, 'live2');
    store.put(row('live2', 'mNoFile')); // a letter whose picture file is gone
    const files = memoryFiles();
    for (const n of ['mLive.jpg', 'mShelf.jpg', 'mGone.jpg', 'stray.jpg', 'half.jpg.part']) await files.write(n, Uint8Array.of(1));
    const picked = pickedMemory({ 'file:///c/ImagePicker/a.jpg': Uint8Array.of(1) });
    const counts = await sweepPhotos(db, files, picked);
    expect([...files.disk.keys()].sort()).toEqual(['half.jpg.part', 'mLive.jpg', 'mShelf.jpg']);
    expect(db.all<{ id: string }>('SELECT id FROM entry_media ORDER BY id').map((r) => r.id)).toEqual(['mLive', 'mShelf']);
    expect(counts).toEqual({ orphanFiles: 1, orphanRows: 1, missingFileRows: 1 });
    expect(picked.left()).toEqual([]);
    expect(await sweepPhotos(db, files, picked)).toEqual({ orphanFiles: 0, orphanRows: 0, missingFileRows: 0 }); // repeat
  });
  it('[D5] an unreadable folder changes nothing; a file that will not go keeps its row for the next launch', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const store = entryMediaStore(db);
    letter(db, 'gone');
    store.put(row('gone', 'mGone'));
    db.run("DELETE FROM entries WHERE id = 'gone'"); // its letter was purged
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
  it('[NS-01-R13][C10] a photo on screen is covered whenever the app is not in front, App lock on or off', () => {
    expect(PHOTO_BLANK_WITHOUT_APP_LOCK).toBe(true);
    for (const lockOn of [true, false]) {
      expect(pictureCovered('inactive', lockOn)).toBe(true);
      expect(pictureCovered('background', lockOn)).toBe(true);
      expect(pictureCovered('active', lockOn)).toBe(false);
    }
    expect(pictureCovered('active', true, false)).toBe(true); // locked cold open
  });
  it('[NS-01-R13][C10] every component that draws a stored or pending picture goes through PhotoFrame, which asks the cover', () => {
    const dir = join(SRC, 'components', 'photos');
    const drawsImage = walk(dir).filter((f) => /<Image\b/.test(readFileSync(f, 'utf8'))).map((f) => relative(dir, f));
    expect(drawsImage).toEqual(['photo-frame.tsx']);
    expect(readFileSync(join(dir, 'photo-frame.tsx'), 'utf8')).toMatch(/usePictureCovered\(\)[\s\S]*if \(covered \|\| failed\)/);
  });
});

// ---- Application Support folder, the native step's temporary files ------------------------------------------------

describe('[C9] where the stored copy lives', () => {
  it('[C9] iOS: <container>/Library/Application Support/photos, beside Documents; Android: the files folder', () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000009'));
    expect(photosDirectory().uri).toBe(`${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/photos/`);
    h.disk = createDisk(androidContainer());
    expect(photosDirectory().uri).toBe(`${h.disk.documents}photos/`);
  });
  it('[C9] any other container layout fails closed: no picture goes to Documents or anywhere unknown (review N10)', () => {
    h.disk = createDisk({ documents: 'file:///var/mobile/Containers/Data/Application/ASHA/Docs/', caches: 'file:///var/mobile/Containers/Data/Application/ASHA/Library/Caches/', os: 'ios' });
    expect(() => photosDirectory()).toThrow('photos_folder_unknown');
  });
});

/** An in-memory BakedFiles: what the baker may hand over and where the native step writes (the phone's folders are tested below). */
function memoryBaked(): BakedFiles & { disk: Map<string, Uint8Array> } {
  const disk = new Map<string, Uint8Array>();
  let n = 0;
  return {
    disk,
    isPicked: (uri) => /^file:\/\/\/c\/ImagePicker\/[\w-]+\.img$/.test(uri),
    destination: () => `file:///c/ScribePhoto/out${++n}.jpg`,
    async read(uri) {
      const b = disk.get(uri);
      if (!b) throw new Error('gone');
      return b;
    },
    remove: async (uri) => void disk.delete(uri),
  };
}

describe('[NX-39-R53][C7] the native step\'s temporary JPEG is read once and removed', () => {
  beforeEach(() => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000002'));
  });
  const PICKED = 'file:///c/ImagePicker/0194-a.img';
  it('[C7] the baker hands a picked original to the native step with a destination it built, reads that file once and removes it', async () => {
    const files = memoryBaked();
    const seen: [string, string][] = [];
    const baker = createOrientationBaker({ reencodeUpright: async (s: string, d: string) => (seen.push([s, d]), files.disk.set(d, makeJpeg()), d) }, files)!;
    const bytes = await baker.bake(Uint8Array.of(1), { uri: PICKED });
    expect(bytes && bytes.length).toBeGreaterThan(10);
    expect(seen).toEqual([[PICKED, 'file:///c/ScribePhoto/out1.jpg']]);
    expect(files.disk.size).toBe(0); // read once, then removed
    expect(await baker.bake(Uint8Array.of(1))).toBeNull(); // no uri: nothing to re-encode
    expect(createOrientationBaker(null, files)).toBeUndefined(); // no native module: no baker
  });
  it('[C7] only a picked original is handed over, a refused destination name is null, and an answer naming another file is never read (review N4)', async () => {
    const files = memoryBaked();
    const calls: string[] = [];
    const native = { reencodeUpright: async (s: string, d: string) => (calls.push(s), d) };
    const baker = createOrientationBaker(native, files)!;
    const other = 'file:///c/Documents/ExpoAudio/take.m4a';
    for (const uri of [other, 'file:///c/ScribePhoto/0194-a.jpg', 'file:///c/ImagePicker/../x.img', 'u']) expect(await baker.bake(Uint8Array.of(1), { uri }), uri).toBeNull();
    const refused = createOrientationBaker(native, { ...files, destination: () => { throw new Error('photo_temp_name_refused'); } })!;
    expect(await refused.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
    expect(calls).toEqual([]);
    files.disk.set(other, Uint8Array.of(1));
    const sneaky = createOrientationBaker({ reencodeUpright: async () => other }, files)!;
    expect(await sneaky.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
    expect(files.disk.has(other)).toBe(true);
  });
  it('[C7] a native failure, or a step that never answers, is null within the time bound, and no native text reaches a log (review N7, N9)', async () => {
    const spies = (['error', 'warn', 'log', 'info', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    try {
      const bad = createOrientationBaker({ reencodeUpright: async () => { throw new Error('CANARY /private/var/IMG_1.HEIC'); } }, memoryBaked())!;
      expect(await bad.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
      const hung = createOrientationBaker({ reencodeUpright: () => new Promise<string>(() => {}) }, memoryBaked(), 20)!;
      const at = Date.now();
      expect(await hung.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
      expect(Date.now() - at).toBeLessThan(2_000);
      expect(BAKE_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
      const logged = spies.flatMap((s) => s.mock.calls.map((c) => c.map(String).join(' ')));
      expect(logged.filter((l) => l.includes('CANARY'))).toEqual([]);
    } finally {
      for (const s of spies) s.mockRestore();
    }
  });
  it('[C7] on the phone: only a plain file in Caches/ImagePicker counts as picked; the destination is a new name in Caches/ScribePhoto, the only folder read or emptied', async () => {
    const cache = h.disk.caches;
    const files = expoBakedFiles(() => '0194-out');
    expect(files.isPicked(`${cache}ImagePicker/0194-a.img`)).toBe(true);
    for (const uri of [`${h.disk.documents}ExpoAudio/take.m4a`, `${cache}ImagePicker/../x.img`, `${cache}ImagePicker/%2E%2E`, `${cache}ScribePhoto/0194-a.jpg`, `${cache}ImagePicker/sub/a.img`]) {
      expect(files.isPicked(uri), uri).toBe(false);
    }
    expect(files.destination()).toBe(`${cache}ScribePhoto/0194-out.jpg`);
    const out = put(h.disk, `${cache}ScribePhoto/0194-out.jpg`, makeJpeg());
    const other = put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    expect((await files.read(out)).length).toBeGreaterThan(10);
    await expect(files.read(other)).rejects.toThrow();
    await files.remove(other);
    await files.remove(out);
    expect([...h.disk.files.keys()]).toEqual([other]);
    expect(() => expoBakedFiles(() => '../x').destination()).toThrow();
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

// ---- the Swift module, read as source: what it may call, and exactly what it writes --------------------------------

/** Every source file the pod compiles (its `source_files` takes every .h, .m and .swift file under ios/), relative to ios/. */
export function compiledSources(iosDir: string): string[] {
  return readdirSync(iosDir, { recursive: true, encoding: 'utf8' }).filter((f) => /\.(h|m|mm|c|cc|cpp|swift)$/.test(f)).sort();
}

/** Lines the module must hold exactly once, each with what it guarantees (reviews N-B1, N-B4, N-B5, N-B7, notes 1-6). */
const PINNED: [string, string][] = [
  ['  private static let longestSide = 4096\n', 'the 4096 px limit'],
  ['  private static let maxPixels = 150_000_000\n', 'the 150 MP cap'],
  ['  private static let allowedTypes: Set<String> = [UTType.jpeg.identifier, UTType.heic.identifier, UTType.heif.identifier, UTType.png.identifier]\n', 'the format allowlist'],
  ['  private static let presentTimeout: TimeInterval = 2.0\n', "the 2 s watchdog (scribe-store's StoreSheet)"],
  ['  static var pick: ScribePhotoException { ScribePhotoException("photo_pick_failed") }\n', 'the pick code'],
  ['  static var reencode: ScribePhotoException { ScribePhotoException("photo_reencode_failed") }\n', 'the re-encode code'],
  // Paths from JavaScript: a plain name directly inside the Caches folder worked out natively, links resolved.
  ['    let caches = try fm.url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)\n', 'the Caches folder'],
  ['    let home = caches.appendingPathComponent(folder, isDirectory: true)\n', 'the folder inside Caches'],
  ['    let file = url.standardizedFileURL\n', 'dot segments resolved'],
  [String.raw`    guard file.lastPathComponent.range(of: "^[0-9A-Za-z-]{1,64}\\.[0-9A-Za-z]{1,8}\\z", options: .regularExpression) != nil,` + '\n', 'a plain file name, to the end of the input'],
  ['          file.deletingLastPathComponent().resolvingSymlinksInPath().path == home.resolvingSymlinksInPath().path else {\n', 'directly inside the folder, links resolved'],
  ['    return file\n', 'the checked file is the one used'],
  ['        let out = try ScribePhotoModule.fileIn("ImagePicker", destination)\n', 'the pick destination inside Caches/ImagePicker'],
  ['        try await ScribePhotoModule.copyPicked(from: provider, to: out)\n', 'the copy goes to the checked destination'],
  ['    let url = try fileIn("ImagePicker", sourceUri)\n    let out = try fileIn("ScribePhoto", destinationUri)\n', 'the re-encode source in Caches/ImagePicker, its destination in Caches/ScribePhoto'],
  // Nothing at the destination but a regular file is ever removed; a folder or a link refuses.
  ['    guard attributes[.type] as? FileAttributeType == .typeRegular else { throw Refused() }\n    try fm.removeItem(at: out)\n', 'only a regular file is made room for'],
  ['    if (try? fm.attributesOfItem(atPath: out.path)[.type] as? FileAttributeType) == .typeRegular { try? fm.removeItem(at: out) }\n', 'only a regular file is cleaned up'],
  ['          try ScribePhotoModule.clear(out)\n          try FileManager.default.copyItem(at: url, to: out)\n', 'the pick copy, never over a folder'],
  ['          ScribePhotoModule.removeIfFile(out)\n          continuation.resume(throwing: ScribePhotoException.pick)\n', 'a partial original removed'],
  ['      try clear(out)\n      guard let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {\n', 'the JPEG, never over a folder'],
  ['      guard CGImageDestinationFinalize(dest) else {\n        removeIfFile(out)\n', 'a failed JPEG removed'],
  // One picker at a time, inside a sheet of ours, and never stuck: not when UIKit refuses to present it, and not when
  // the app dismisses it by code, which tells no delegate (round 3, review A must-fix, review B N-P1).
  ['    if let stale = PickerSession.current, stale.host == nil || (stale.shown && stale.host?.presentingViewController == nil) { stale.cancel() }\n', 'a stale session (sheet freed, or shown and gone) answered as a Cancel'],
  ['    guard PickerSession.current == nil else { throw ScribePhotoException.pick }\n', 'one picker in flight'],
  ['  static var current: PickerSession?\n', 'the session in flight'],
  ['    PickerSession.current = self\n', 'a new session takes the one slot'],
  ['    if PickerSession.current === self { PickerSession.current = nil }\n', 'the session released when it answers'],
  ['    self.continuation = nil\n', 'an answer given once'],
  ['        let host = PickerHost(picker, session)\n        picker.delegate = session\n        session.host = host\n', 'the picker in its sheet, with its delegate'],
  ['        presenter.present(host, animated: true) {\n          session.shown = true\n', 'a presentation of the sheet that reports it happened'],
  ['          if session.answered { host.dismiss(animated: true) }\n', 'a sheet shown after the answer goes away again'],
  ['          try? await Task.sleep(nanoseconds: UInt64(ScribePhotoModule.presentTimeout * 1_000_000_000))\n', 'the watchdog wait'],
  ['          guard let session, PickerSession.current === session, !session.shown, host?.presentingViewController == nil else { return }\n          session.refuse()\n', 'the watchdog'],
  ['    finish(.success(results.first?.itemProvider))\n    host?.dismiss(animated: true)\n', 'a pick or Cancel answers, then closes the sheet'],
  ['  func cancel() {\n    finish(.success(nil))\n  }\n', 'cancel answers null'],
  ['  func refuse() {\n    finish(.failure(ScribePhotoException.pick))\n  }\n', 'refuse fails with its code'],
  ['  var answered: Bool { continuation == nil }\n', 'answered means the call settled'],
  ['  weak var host: PickerHost?\n', 'the session holds its sheet weakly'],
  ['    addChild(picker)\n    picker.view.frame = view.bounds\n    picker.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]\n    view.addSubview(picker.view)\n    picker.didMove(toParent: self)\n', 'the picker embedded in its sheet'],
  ['  override func viewDidDisappear(_ animated: Bool) {\n    super.viewDidDisappear(animated)\n    if isBeingDismissed || presentingViewController == nil { session.cancel() }\n  }\n', 'the sheet leaving, and only leaving, answers a Cancel'],
  // The re-encode runs on a serial queue of its own, not ExpoModulesCore's shared one (review B N-B5r).
  ['  private static let reencodeQueue = DispatchQueue(label: "scribe.photo.reencode", qos: .userInitiated)\n', 'a serial queue of its own'],
  ['    }.runOnQueue(ScribePhotoModule.reencodeQueue)\n', 'the re-encode on that queue'],
  // The decode: an uncached source, a checked multiply, inside an autorelease pool.
  ['      let noCache = [kCGImageSourceShouldCache: false] as CFDictionary\n', 'the cache flag off'],
  ['      guard let source = CGImageSourceCreateWithURL(url as CFURL, noCache),\n', 'an uncached source'],
  ['      let props = CGImageSourceCopyPropertiesAtIndex(source, index, noCache) as? [CFString: Any]\n', 'uncached properties'],
  ['      let (pixels, overflow) = width.multipliedReportingOverflow(by: height)\n', 'a checked multiply'],
  ['      guard width > 0, height > 0, !overflow, pixels <= maxPixels else { throw ScribePhotoException.reencode }\n', 'the pixel cap'],
  ['    try autoreleasepool {\n', 'an autorelease pool'],
];

/** How many times each name may appear in the code, so no second copy, write, removal or path can join (N-B3, note 2). */
const COUNTS: [RegExp, number, string][] = [
  [/CGImageSourceCopyPropertiesAtIndex\(/g, 1, 'one property read'],
  [/\bwrite\b/g, 2, 'one write dictionary, used once'],
  [/\bcopyItem\b/g, 1, 'one copy, of the picked file'],
  [/\bremoveItem\b/g, 2, 'removal only in clear and removeIfFile'],
  [/\bcreateDirectory\b/g, 1, 'only the Caches folder is created'],
  [/\bfileIn\(/g, 4, 'three checked paths'],
  [/\ballowedTypes\b/g, 2, 'the allowlist, unchanged'],
  [/\bmaxPixels\b/g, 2, 'the cap, unchanged'],
  [/\blongestSide\b/g, 2, 'the limit, unchanged'],
  [/\bkCGImageSourceShouldCache\b/g, 2, 'the cache flag'],
  [/\bAsyncFunction\b/g, 2, 'two exports'],
  [/\bpresent\(/g, 1, 'one presentation, of the sheet'],
  [/\.dismiss\(/g, 2, 'the sheet dismissed after an answer only'],
  [/PHPickerViewController\(/g, 1, 'one picker'],
  [/\bPickerHost\(/g, 1, 'one sheet'],
  [/\brunOnQueue\b/g, 1, 'one queue choice'],
  [/\breencodeQueue\b/g, 2, 'the queue, used once'],
  [/"ImagePicker"/g, 2, 'the picker folder, named twice'],
  [/"ScribePhoto"/g, 2, 'the module and its JPEG folder'],
];

/** Every problem the scan finds in ScribePhotoModule.swift; empty when the module is what the reviews accepted. */
export function swiftProblems(swift: string): string[] {
  // Only whole-line comments go (they name what is absent); a "//" inside code, as in "file://", hides nothing.
  const code = swift.replace(/^[ \t]*\/\/.*$/gm, '');
  const out: string[] = [];
  const need = (re: RegExp, why: string) => void (re.test(code) || out.push(`missing: ${why}`));
  const never = (re: RegExp, why: string) => void (re.test(code) && out.push(`forbidden: ${why}`));
  for (const [line, why] of PINNED) if (code.split(line).length !== 2) out.push(`not exactly once: ${why}`);
  for (const [re, n, why] of COUNTS) if ((code.match(re) ?? []).length !== n) out.push(`count: ${why}`);
  const imports = [...code.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort();
  if (imports.join() !== 'ExpoModulesCore,Foundation,ImageIO,PhotosUI,UIKit,UniformTypeIdentifiers') out.push(`imports: ${imports.join()}`);
  // No permission, camera, library, location, network or logging, anywhere (NS-01-R2, R22; ITMS-90683; review N8).
  never(/requestAuthorization|requestAccess|authorizationStatus|AVCapture|AVFoundation|UIImagePickerController|PHPhotoLibrary|PHAsset|PHImageManager|PHFetch|\bphotoLibrary\b|CoreLocation|CLLocation|UsageDescription/, 'a permission, camera, library or location API');
  never(/URLSession|URLRequest|NWConnection|CFNetwork|NSURLConnection|WebKit/, 'a network API');
  never(/\bprint\(|debugPrint|\bdump\(|NSLog|os_log|OSLog|\bLogger\b|\blog\b|os_signpost|fputs|standardError/, 'logging');
  // No other way to copy, write, move or remove a file, and no other image source or destination.
  never(/contentsOf|\.write\(to|write\(toFile|replaceItem|\b(moveItem|linkItem|createSymbolicLink|createFile|trashItem|FileHandle|OutputStream)\b/, 'another file copy, write or removal');
  never(/\b(rename\w*|link|linkat|symlink\w*|unlink\w*|clonefile\w*|copyfile|fcopyfile|exchangedata\w*|open|openat\w*|open_dprotected_np|pread|pwrite|creat|truncate|ftruncate|mkdir\w*|rmdir|remove|fopen|fwrite|AT_FDCWD)\b|\b(Darwin|Glibc|Foundation)\./, 'a POSIX file call, by name or as a value');
  never(/\bcontents\(|UserDefaults|UIPasteboard|NSUbiquitousKeyValueStore|NSKeyedArchiver|SecItem/, 'a read of the original, or a write to preferences, the pasteboard or the keychain');
  never(/setAttributes|protectionKey|FileProtection|fileProtection/, 'a change to file protection');
  never(/viewWillDisappear|isModalInPresentation|modalPresentationStyle/, 'a change to how the sheet leaves');
  never(/\bCI[A-Z]\w*|CoreImage|writeJPEGRepresentation|jpegRepresentation|heifRepresentation|pngRepresentation|\bUIImage\b|jpegData|pngData|heicData/, 'another image writer');
  never(/\b(Function|StaticFunction|StaticAsyncFunction|Property|Constant|Constants|Events|View|Prop|Class|OnCreate|OnDestroy|OnStartObserving|OnStopObserving|OnAppEntersForeground|OnAppEntersBackground|OnAppBecomesActive)\s*\(/, 'another export');
  never(/CGImageSourceCreate(WithData|Incremental|ImageAtIndex)|CGImageDestinationCreateWith(Data|DataConsumer)/, 'another image source or destination');
  never(/width \* height|height \* width/, 'an unchecked multiply');
  // The picker: Apple's out-of-process picker with no library, images only, one, the file as it is.
  if ((code.match(/PHPickerConfiguration\s*\(/g) ?? []).length !== 1 || !/var configuration = PHPickerConfiguration\(\)\n/.test(code)) out.push('the picker configuration is not PHPickerConfiguration() with no library');
  need(/configuration\.filter = \.images\n/, 'images only');
  need(/configuration\.selectionLimit = 1\n/, 'one picture');
  need(/configuration\.preferredAssetRepresentationMode = \.current\n/, 'the current representation');
  need(/appContext\?\.utilities\?\.currentViewController\(\)/, "ExpoModulesCore's presenter");
  need(/loadFileRepresentation\(forTypeIdentifier: UTType\.image\.identifier\)/, 'the still image as a file');
  // Before any decode: the primary image (N2), a complete source, an allowed format and a pixel cap (N1).
  need(/let index = CGImageSourceGetPrimaryImageIndex\(source\)\n/, 'the primary image index');
  never(/AtIndex\(source, 0\b/, 'image index 0');
  need(/CGImageSourceGetStatus\(source\) == \.statusComplete/, 'a complete source');
  need(/CGImageSourceGetStatusAtIndex\(source, index\) == \.statusComplete/, 'a complete image');
  // Order: paths checked before any work, one picker before presenting, caps before the decode, all ImageIO in the pool.
  const at = (s: string) => code.indexOf(s);
  const before = (a: string, b: string, why: string) => void ((at(a) < 0 || at(b) < 0 || at(a) > at(b)) && out.push(`order: ${why}`));
  before('ScribePhotoModule.fileIn("ImagePicker", destination)', 'self.presentPicker()', 'the pick destination is checked first');
  before('fileIn("ScribePhoto", destinationUri)', 'CGImageSourceCreateWithURL(', 'the re-encode paths are checked first');
  before('if let stale = PickerSession.current', 'guard PickerSession.current == nil', 'a stale session is answered before the busy check');
  before('guard PickerSession.current == nil', 'presenter.present(', 'the busy check comes first');
  before('allowedTypes.contains(type)', 'CGImageSourceCreateThumbnailAtIndex(', 'the format allowlist before the decode');
  before('pixels <= maxPixels', 'CGImageSourceCreateThumbnailAtIndex(', 'the pixel cap before the decode');
  const pool = at('    try autoreleasepool {\n');
  const poolEnd = code.indexOf('\n    }\n', pool);
  for (const call of ['CGImageSourceCreateWithURL(', 'CGImageSourceCreateThumbnailAtIndex(', 'CGImageDestinationAddImage(', 'CGImageDestinationFinalize(']) {
    if (pool < 0 || at(call) < pool || at(call) > poolEnd) out.push(`outside the autorelease pool: ${call}`);
  }
  const copyPicked = code.slice(at('private static func copyPicked('), at('private static func reencode('));
  if (!copyPicked.includes('copyItem(')) out.push('the copy is outside copyPicked');
  // Source properties are read for the width and the height only.
  const props = [...code.matchAll(/\bprops\b(\?\[(\w+)\])?/g)];
  const reads = props.filter((m) => m[2]).map((m) => m[2]).sort();
  if (reads.join() !== 'kCGImagePropertyPixelHeight,kCGImagePropertyPixelWidth' || props.length !== 3) out.push(`source properties used beyond width and height: ${props.map((m) => m[0]).join(' ')}`);
  // The decode: from the full image, turned, not cached.
  const decode = /let decode: \[CFString: Any\] = \[([\s\S]*?)\n\s*\]/.exec(code)?.[1] ?? '';
  if (decode.replace(/\s+/g, ' ').trim() !== 'kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceShouldCache: false, kCGImageSourceThumbnailMaxPixelSize: min(max(width, height), longestSide),') out.push(`decode options: ${decode.trim()}`);
  // The write: exactly one AddImage, of the decoded pixels, with exactly our three options and nothing else.
  const adds = code.match(/CGImageDestinationAdd\w*\([^)]*\)/g) ?? [];
  if (adds.join() !== 'CGImageDestinationAddImage(dest, image, write as CFDictionary)') out.push(`the image is added as: ${adds.join(' ; ')}`);
  const write = /let write: \[CFString: Any\] = \[([\s\S]*?)\n\s*\]/.exec(code)?.[1] ?? '';
  if (write.replace(/\s+/g, ' ').trim() !== 'kCGImageDestinationLossyCompressionQuality: quality, kCGImageMetadataShouldExcludeGPS: true, kCGImageMetadataShouldExcludeXMP: true,') out.push(`write options: ${write.trim()}`);
  never(/\bwrite\[|var write\b/, 'a changed write dictionary');
  never(/AddImageAndMetadata|AddImageFromSource|CopyImageSource|CGImageDestinationSetProperties|AuxiliaryData|kCGImageAuxiliary|EmbedThumbnail|PreserveGainMap|MergeMetadata|kCGImageDestinationMetadata|CopyMetadataAtIndex|ShouldCacheImmediately/, 'a metadata, auxiliary-data or thumbnail path');
  never(/kCGImageProperty(?!PixelWidth\]|PixelHeight\])\w+/, 'a source property other than the pixel size');
  // Errors: each exported function maps every failure to its own closed code (N3, note 9); the codes are fixed strings.
  const codes = [...code.matchAll(/ScribePhotoException\("([^"]+)"\)/g)].map((m) => m[1]).sort();
  if (codes.join() !== 'photo_pick_failed,photo_reencode_failed') out.push(`codes: ${codes.join()}`);
  need(/final class ScribePhotoException: Exception, @unchecked Sendable \{/, 'a Sendable exception with an explicit code');
  need(/override var code: String \{ codeValue \}/, 'the explicit code');
  never(/localizedDescription|\\\(error|description:/, 'error text in a message');
  const own: Record<string, string> = { pickOne: 'pick', reencodeUpright: 'reencode' };
  const fns = [...code.matchAll(/AsyncFunction\("(\w+)"\) \{[^\n]* in\n/g)];
  if (fns.map((m) => m[1]).join() !== 'pickOne,reencodeUpright') out.push(`functions: ${fns.map((m) => m[1]).join()}`);
  for (const m of fns) {
    const rest = code.slice(m.index! + m[0].length);
    const body = rest.slice(0, rest.search(/\n {4}\}/));
    if (!new RegExp(String.raw`^ {6}do \{\n[\s\S]*\n {6}\} catch \{\n {8}throw ScribePhotoException\.${own[m[1]]}\n {6}\}$`).test(body)) out.push(`${m[1]}: a failure can leave without its own closed code`);
  }
  return out;
}

describe('[C8] the Swift module: Apple\'s picker and ImageIO, nothing else', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  it('[NS-01-R2][NS-01-R22][C8] every file the pod compiles passes the scan: no permission request, camera, library, network or log; checked paths; one picker; the write carries only our three options', () => {
    const sources = compiledSources(join(dir, 'ios'));
    expect(sources).toEqual(['ScribePhotoModule.swift']);
    for (const f of sources) expect(swiftProblems(readFileSync(join(dir, 'ios', f), 'utf8')), f).toEqual([]);
  });
  it('[C8] positive control: each mutation the reviews tried, and each banned call, makes the scan fail', () => {
    const swap = (a: string, b: string, text = swift) => {
      expect(text, a).toContain(a);
      return text.replace(a, b);
    };
    const writeDict = 'kCGImageMetadataShouldExcludeXMP: true,\n';
    const pickCatch = '} catch {\n        throw ScribePhotoException.pick\n      }';
    const reencodeCatch = '} catch {\n        throw ScribePhotoException.reencode\n      }';
    const mutants: Record<string, string> = {
      'source properties into AddImage': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImage(dest, image, props as CFDictionary?)'),
      'Exif in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyExifDictionary: [:],\n`),
      'GPS in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyGPSDictionary: [:],\n`),
      'TIFF in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyTIFFDictionary: [:],\n`),
      'an embedded thumbnail': swap(writeDict, `${writeDict}      kCGImageDestinationEmbedThumbnail: true,\n`),
      'the gain map kept': swap(writeDict, `${writeDict}      kCGImageDestinationPreserveGainMap: true,\n`),
      'auxiliary data': swap('      guard CGImageDestinationFinalize(dest)', '      CGImageDestinationAddAuxiliaryDataInfo(dest, kCGImageAuxiliaryDataTypeDepth, [:] as CFDictionary)\n      guard CGImageDestinationFinalize(dest)'),
      'image and metadata': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImageAndMetadata(dest, image, nil, write as CFDictionary)'),
      'another source property read': swap('      let height = (props?', '      let gps = props?[kCGImagePropertyGPSDictionary]\n      let height = (props?'),
      'a second property read shadowing write': swap('      CGImageDestinationAddImage(dest, image, write as CFDictionary)', '      if let write = CGImageSourceCopyPropertiesAtIndex(source, index, nil) { CGImageDestinationAddImage(dest, image, write as CFDictionary) }'),
      'the original copied for an upright JPEG': swap('      try clear(out)\n', '      if type == UTType.jpeg.identifier { try FileManager.default.copyItem(at: url, to: out); return }\n      try clear(out)\n'),
      'the original read and written out': swap('      try clear(out)\n', '      try Data(contentsOf: url).write(to: out)\n      try clear(out)\n'),
      'image index 0': swap('let index = CGImageSourceGetPrimaryImageIndex(source)', 'let index = 0'),
      'no format allowlist': swap(', allowedTypes.contains(type)', ''),
      'PDF in the allowlist': swap('UTType.png.identifier]', 'UTType.png.identifier, UTType.pdf.identifier]'),
      'no pixel cap': swap(', pixels <= maxPixels', ''),
      'the cap raised': swap('maxPixels = 150_000_000', 'maxPixels = Int.max'),
      'the limit raised': swap('longestSide = 4096', 'longestSide = 16384'),
      'an unchecked multiply': swap('let (pixels, overflow) = width.multipliedReportingOverflow(by: height)', 'let (pixels, overflow) = (width * height, false)'),
      'the cache flag on': swap('[kCGImageSourceShouldCache: false] as CFDictionary', '[kCGImageSourceShouldCache: true] as CFDictionary'),
      'cached decode': swap('kCGImageSourceShouldCache: false,\n        kCGImageSourceThumbnailMaxPixelSize', 'kCGImageSourceShouldCacheImmediately: true,\n        kCGImageSourceThumbnailMaxPixelSize'),
      'no autorelease pool': swap('    try autoreleasepool {\n', '    do {\n'),
      'a picker over the photo library': swap('var configuration = PHPickerConfiguration()', 'var configuration = PHPickerConfiguration(photoLibrary: .shared())'),
      'a library authorization': swap('    let picker = PHPickerViewController', '    PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }\n    let picker = PHPickerViewController'),
      'a camera request': swap('    let picker = PHPickerViewController', '    AVCaptureDevice.requestAccess(for: .video) { _ in }\n    let picker = PHPickerViewController'),
      'code after "file://" on a line': swap('    let picker = PHPickerViewController', '    let scheme = "file://"; PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }\n    let picker = PHPickerViewController'),
      'a log line': swap('      let index = CGImageSourceGetPrimaryImageIndex', '      print(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      "ExpoModulesCore's log": swap('      let index = CGImageSourceGetPrimaryImageIndex', '      log.info(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      'a raw error out of reencodeUpright': swap(reencodeCatch, '} catch {\n        throw error\n      }'),
      'the two codes swapped between functions': swap('<pick>', reencodeCatch, swap(reencodeCatch, pickCatch, swap(pickCatch, '<pick>'))),
      'the two codes swapped in their names': swap('ScribePhotoException("photo_pick_failed") }\n  static var reencode: ScribePhotoException { ScribePhotoException("photo_reencode_failed")', 'ScribePhotoException("photo_reencode_failed") }\n  static var reencode: ScribePhotoException { ScribePhotoException("photo_pick_failed")'),
      'a third code': swap('ScribePhotoException("photo_pick_failed")', 'ScribePhotoException("photo_pick_cancelled")'),
      'a second picker while one is open': swap('    guard PickerSession.current == nil else { throw ScribePhotoException.pick }\n', ''),
      'a session never released': swap('    if PickerSession.current === self { PickerSession.current = nil }\n', ''),
      'no watchdog': swap('          session.refuse()\n', ''),
      'a longer watchdog': swap('presentTimeout: TimeInterval = 2.0', 'presentTimeout: TimeInterval = 60.0'),
      'a watchdog that never fires': swap('!session.shown, host?.presentingViewController == nil', 'false'),
      'a presentation that never reports': swap('          session.shown = true\n', ''),
      'an unchecked pick destination': swap('let out = try ScribePhotoModule.fileIn("ImagePicker", destination)', 'let out = URL(string: destination)!'),
      'an unchecked re-encode source': swap('let url = try fileIn("ImagePicker", sourceUri)', 'let url = URL(string: sourceUri)!'),
      'the JPEG written into the picker folder': swap('fileIn("ScribePhoto", destinationUri)', 'fileIn("ImagePicker", destinationUri)'),
      'any name': swap('[0-9A-Za-z-]{1,64}', '.{1,200}'),
      'a prefix match': swap('file.deletingLastPathComponent().resolvingSymlinksInPath().path == home.resolvingSymlinksInPath().path', 'file.path.hasPrefix(home.path)'),
      'dot segments kept': swap('let file = url.standardizedFileURL', 'let file = url'),
      "a folder made where JavaScript says": swap('    let file = url.standardizedFileURL\n', '    let file = url.standardizedFileURL\n    try fm.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)\n'),
      'whatever is there removed before the copy': swap('          try ScribePhotoModule.clear(out)\n', '          if FileManager.default.fileExists(atPath: out.path) { try FileManager.default.removeItem(at: out) }\n'),
      'a folder made room for': swap('    guard attributes[.type] as? FileAttributeType == .typeRegular else { throw Refused() }\n', ''),
      'whatever is there removed after a failed JPEG': swap('        removeIfFile(out)\n        throw', '        try? FileManager.default.removeItem(at: out)\n        throw'),
      'a partial original kept': swap('          ScribePhotoModule.removeIfFile(out)\n', ''),
      // Round 3: the sheet, the stale session and the lifecycle lines (review A must-fix and note 3, review B N-P1).
      'the picker presented without its sheet': swap('presenter.present(host, animated: true)', 'presenter.present(picker, animated: true)'),
      'a sheet dismissed by code never answers': swap('    if isBeingDismissed || presentingViewController == nil { session.cancel() }\n', ''),
      'a stale session kept': swap('    if let stale = PickerSession.current, stale.host == nil || (stale.shown && stale.host?.presentingViewController == nil) { stale.cancel() }\n', ''),
      'a stale session refused, not answered': swap('{ stale.cancel() }', '{ stale.refuse() }'),
      'a late sheet left up': swap('          if session.answered { host.dismiss(animated: true) }\n', ''),
      'nothing claims the slot': swap('    PickerSession.current = self\n', ''),
      'no picker delegate': swap('        picker.delegate = session\n', ''),
      'a sheet that does not know its session': swap('        session.host = host\n', ''),
      'the picker not embedded': swap('    view.addSubview(picker.view)\n', ''),
      'the sheet left up after a pick': swap('    host?.dismiss(animated: true)\n', ''),
      'a second resume': swap('    self.continuation = nil\n', ''),
      'the copy to an unchecked uri': swap('copyPicked(from: provider, to: out)', 'copyPicked(from: provider, to: URL(string: destination)!)'),
      'the unchecked url used': swap('    return file\n', '    return url\n'),
      'a name with a trailing line break': swap(String.raw`\\z"`, '$"'),
      'the re-encode on the shared queue': swap('    }.runOnQueue(ScribePhotoModule.reencodeQueue)\n', '    }\n'),
      'the re-encode on the main queue': swap('.runOnQueue(ScribePhotoModule.reencodeQueue)', '.runOnQueue(.main)'),
      'the original moved over the JPEG': swap('      CGImageDestinationAddImage(dest, image, write as CFDictionary)\n', '      CGImageDestinationAddImage(dest, image, write as CFDictionary)\n      _ = try? FileManager.default.replaceItemAt(out, withItemAt: url)\n'),
      'POSIX rename': swap('      try clear(out)\n', '      _ = rename(url.path, out.path)\n      try clear(out)\n'),
      'POSIX link': swap('      try clear(out)\n', '      _ = link(url.path, out.path)\n      try clear(out)\n'),
      'a CoreImage write': swap('      try clear(out)\n', '      try CIContext().writeJPEGRepresentation(of: CIImage(cgImageSource: source, index: index), to: out, colorSpace: CGColorSpaceCreateDeviceRGB())\n      try clear(out)\n'),
      'log on a continuation line': swap('      let index = CGImageSourceGetPrimaryImageIndex', '      log\n        .info(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      'log in parentheses': swap('      let index = CGImageSourceGetPrimaryImageIndex', '      (log).info(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      'a third export': swap('    /// The destination file uri once an upright', '    Function("tidy") { (p: String) in _ = Darwin.remove(p) }\n\n    /// The destination file uri once an upright'),
      'a third async export': swap('    /// The destination file uri once an upright', '    AsyncFunction ("tidy") { (p: String) in try FileManager.default.removeItem(atPath: p) }\n\n    /// The destination file uri once an upright'),
      'a library picker written with spaces': swap('    configuration.filter = .images\n', '    configuration = PHPickerConfiguration (photoLibrary : .shared())\n    configuration.filter = .images\n'),
      // Slice 2c: #834 round-4 notes (review A notes 1, 3 and 4; review B N-B3c and N-P2 a, b).
      'a Cancel on any disappearance, a cover included': swap('    if isBeingDismissed || presentingViewController == nil { session.cancel() }\n', '    session.cancel()\n'),
      'a freed sheet not stale': swap('stale.host == nil || (stale.shown && stale.host?.presentingViewController == nil)', 'stale.shown && stale.host?.presentingViewController == nil'),
      'the sheet dismissed before the pick answers': swap('    finish(.success(results.first?.itemProvider))\n    host?.dismiss(animated: true)\n', '    host?.dismiss(animated: true)\n    finish(.success(results.first?.itemProvider))\n'),
      'renameatx_np over the JPEG': swap('      try clear(out)\n', '      if renameatx_np(AT_FDCWD, url.path, AT_FDCWD, out.path, 0) == 0 { return }\n      try clear(out)\n'),
      'clonefileat over the JPEG': swap('      try clear(out)\n', '      if clonefileat(AT_FDCWD, url.path, AT_FDCWD, out.path, 0) == 0 { return }\n      try clear(out)\n'),
      'openat with pread and pwrite': swap('      try clear(out)\n', '      let fd = openat(AT_FDCWD, url.path, O_RDONLY)\n      _ = pread(fd, nil, 0, 0)\n      _ = pwrite(fd, nil, 0, 0)\n      try clear(out)\n'),
      'unlinkat': swap('      try clear(out)\n', '      _ = unlinkat(AT_FDCWD, out.path, 0)\n      try clear(out)\n'),
      'symlinkat': swap('      try clear(out)\n', '      _ = symlinkat(url.path, AT_FDCWD, out.path)\n      try clear(out)\n'),
      'mkdirat': swap('      try clear(out)\n', '      _ = mkdirat(AT_FDCWD, out.path, 0o700)\n      try clear(out)\n'),
      'rename through a function value': swap('      try clear(out)\n', '      let mv: (UnsafePointer<CChar>?, UnsafePointer<CChar>?) -> Int32 = rename\n      _ = mv(url.path, out.path)\n      try clear(out)\n'),
      'rename through Darwin': swap('      try clear(out)\n', '      let mv = Darwin.rename\n      _ = mv(url.path, out.path)\n      try clear(out)\n'),
      'the original read whole': swap('      try clear(out)\n', '      let raw = FileManager.default.contents(atPath: url.path)\n      try clear(out)\n'),
      'the original into preferences': swap('      try clear(out)\n', '      UserDefaults.standard.set(Data(), forKey: "p")\n      try clear(out)\n'),
      'the pick on the pasteboard': swap('    finish(.success(results.first?.itemProvider))\n    host', '    UIPasteboard.general.itemProviders = results.map(\\.itemProvider)\n    finish(.success(results.first?.itemProvider))\n    host'),
      'file protection turned off': swap('          try FileManager.default.copyItem(at: url, to: out)\n', '          try FileManager.default.copyItem(at: url, to: out)\n          try FileManager.default.setAttributes([.protectionKey: FileProtectionType.none], ofItemAtPath: out.path)\n'),
      'a Cancel in viewWillDisappear': swap('  override func viewDidDisappear', '  override func viewWillDisappear(_ animated: Bool) {\n    super.viewWillDisappear(animated)\n    session.cancel()\n  }\n\n  override func viewDidDisappear'),
      'a sheet that cannot be swiped away': swap('    super.viewDidLoad()\n', '    super.viewDidLoad()\n    isModalInPresentation = true\n'),
      'a full-screen sheet': swap('        session.host = host\n', '        session.host = host\n        host.modalPresentationStyle = .fullScreen\n'),
      'both folders moved out of Caches': swap('    let home = caches.appendingPathComponent(folder, isDirectory: true)', '    let home = caches.deletingLastPathComponent().appendingPathComponent(folder, isDirectory: true)'),
      'the pick into another folder': swap('fileIn("ImagePicker", destination)', 'fileIn("Documents", destination)'),
      'a third folder name': swap('    let out = try fileIn("ScribePhoto", destinationUri)\n', '    let out = try fileIn("ScribePhoto", destinationUri)\n    _ = try fileIn("ScribePhoto", sourceUri)\n'),
      'cancel and refuse swapped': swap('<c>', '  func cancel() {\n    finish(.failure(ScribePhotoException.pick))\n  }', swap('  func refuse() {\n    finish(.failure(ScribePhotoException.pick))\n  }', '  func refuse() {\n    finish(.success(nil))\n  }', swap('  func cancel() {\n    finish(.success(nil))\n  }', '<c>'))),
      'answered never true': swap('  var answered: Bool { continuation == nil }', '  var answered: Bool { false }'),
      'a strong host': swap('  weak var host: PickerHost?', '  var host: PickerHost?'),
    };
    for (const [name, text] of Object.entries(mutants)) expect(swiftProblems(text).length, name).toBeGreaterThan(0);
    // A second source file in ios/ is compiled by the pod, so the list of scanned files must change.
    const extra = mkdtempSync(join(tmpdir(), 'scribe-photo-ios-'));
    try {
      writeFileSync(join(extra, 'ScribePhotoModule.swift'), swift);
      mkdirSync(join(extra, 'More'));
      writeFileSync(join(extra, 'More', 'Extra.swift'), 'import Photos\n');
      expect(compiledSources(extra)).toEqual(['More/Extra.swift', 'ScribePhotoModule.swift']);
    } finally {
      rmSync(extra, { recursive: true, force: true });
    }
  });
  it('[C8] the Swift name rule is files.ts PLAIN_NAME ending in \\z, so the two cannot drift (#841 review)', () => {
    const jsRule = /const PLAIN_NAME = \/(.+)\/;/.exec(readFileSync(join(__dirname, '..', 'src', 'lib', 'photos', 'files.ts'), 'utf8'))?.[1] ?? '';
    expect(/range\(of: "([^"]+)"/.exec(swift)?.[1].replace(/\\\\/g, '\\')).toBe(jsRule.replace(/\$$/, '\\z'));
  });
  it('[C8] the pod declares the frameworks the module imports and depends on ExpoModulesCore only; the config names one module', () => {
    const pod = readFileSync(join(dir, 'ios', 'ScribePhoto.podspec'), 'utf8');
    expect([...pod.matchAll(/s\.dependency '([^']+)'/g)].map((m) => m[1])).toEqual(['ExpoModulesCore']);
    expect(/s\.frameworks = (.*)/.exec(pod)?.[1]).toBe("'CoreGraphics', 'ImageIO', 'PhotosUI', 'UIKit', 'UniformTypeIdentifiers'");
    expect([...pod.matchAll(/s\.(\w*source_files|preserve_paths|resources?|resource_bundles) = (.*)/g)].map((m) => `${m[1]} = ${m[2]}`)).toEqual(['source_files = "**/*.{h,m,swift}"']);
    expect(pod).not.toMatch(/Debug|Release|configuration|vendored|xcframework/i); // nothing that differs by build configuration
    expect(JSON.parse(readFileSync(join(dir, 'expo-module.config.json'), 'utf8'))).toEqual({ platforms: ['apple'], apple: { modules: ['ScribePhotoModule'] } });
  });
  it('[NS-01-R22] no picker, camera or media-library package is a dependency: the system picker comes only through this module', () => {
    const app = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    const lock = readFileSync(join(__dirname, '..', '..', '..', 'package-lock.json'), 'utf8');
    for (const name of ['expo-image-picker', 'expo-image-loader', 'expo-media-library', 'expo-camera', 'react-native-vision-camera', 'react-native-image-picker']) {
      expect(app.dependencies[name], name).toBeUndefined();
      expect(lock, name).not.toContain(`node_modules/${name}"`);
    }
  });
});

// ---- draft-owned pictures, words editing, the not-saved line, the pause ---------------------------------------------

describe('[ADR 0028 D1] a draft owns its picture until Keep', () => {
  it('[D1] the row is draft-owned while only a draft exists, hidden from the lens, and moves to the letter with Keep', async () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const store = entryMediaStore(db);
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('d1', 'c', 'typed', 't')");
    store.put(row('d1', 'mD1')); // no entries row: owned by the draft
    expect(db.get('SELECT entry_id, draft_id FROM entry_media WHERE id = ?', 'mD1')).toEqual({ entry_id: null, draft_id: 'd1' });
    expect(store.get('d1')?.mediaId).toBe('mD1');
    expect(store.all()).toEqual([]); // not a kept letter yet
    letter(db, 'd1'); // Keep: the letter takes the draft's id
    db.run('UPDATE entry_media SET entry_id = draft_id, draft_id = NULL WHERE draft_id = ?', 'd1'); // store.saveLetterFromDraft
    expect(db.get('SELECT entry_id, draft_id FROM entry_media WHERE id = ?', 'mD1')).toEqual({ entry_id: 'd1', draft_id: null });
    expect(store.all().map((p) => p.mediaId)).toEqual(['mD1']);
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
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('letgo', 'c', 'typed', 't')");
    store.put(row('letgo', 'mGone'));
    db.run("DELETE FROM drafts WHERE id = 'letgo'"); // let go
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

describe('[NS-01-R17] a picture that cannot be stored never un-keeps the letter, and the letter page says so once', () => {
  const WORDS = 'Asha and the rain boots.';
  beforeEach(() => {
    clearPhotoNotSaved('e1');
  });
  it('[NS-01-R17] a failing disk marks the letter; a later success clears it; a picture with no words marks nothing', async () => {
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
  it('[NS-01-R17] a throwing store is caught and marked, never rethrown', async () => {
    const picked = pickedMemory({ 'file:///c/ImagePicker/a.jpg': makeJpeg() });
    const p = new PendingPhoto(picked);
    await p.set({ uri: 'file:///c/ImagePicker/a.jpg' });
    await expect(adoptPending(p, () => { throw new Error('db'); }, 'e1', WORDS, true)).resolves.toBeUndefined();
    expect(photoNotSaved('e1')).toBe(true);
  });
});

describe('[NS-01-R19] the remote pause hides the new surfaces and never turns them on', () => {
  it('[NS-01-R19] killSwitches.photos true pauses; absent, false, a missing config or an unreadable one do not', () => {
    const at = (cfg: unknown) => photosPausedNow(() => ({ getRemoteConfig: () => cfg as never }));
    expect(at({ killSwitches: { photos: true } })).toBe(true);
    expect(at({ killSwitches: { photos: false } })).toBe(false);
    expect(at({ killSwitches: { sync: true } })).toBe(false);
    expect(at(null)).toBe(false);
    expect(photosPausedNow(() => { throw new Error('no remote'); })).toBe(false);
  });
  it('[NS-01-R19] the data rights never read the switch or the pause: the store, the sweep and every eraser', () => {
    for (const f of ['lib/photos/housekeeping.ts', 'lib/photos/entry-media.ts', 'lib/erase-everything.ts', 'lib/capture/erase.ts', 'lib/capture/sweep.ts']) expect(readFileSync(join(SRC, f), 'utf8'), f).not.toMatch(/photosPausedNow|photosBuildEnabled/);
    const device = readFileSync(join(SRC, 'lib', 'photos', 'device.ts'), 'utf8');
    for (const fn of ['sweepPhotosAtLaunch', 'erasePictureOf']) {
      const body = device.slice(device.indexOf(`export function ${fn}`), device.indexOf('\n}\n', device.indexOf(`export function ${fn}`)));
      expect(body, fn).not.toMatch(/photosPausedNow|photosBuildEnabled/);
    }
  });
});
