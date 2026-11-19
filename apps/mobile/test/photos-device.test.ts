/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the picker adapter (C5, C6), the temporary originals
// (C7), the entry_media table (ADR 0028 D1) and the housekeeping sweep. The native parts are device checks in the PR.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { createOrientationBaker } from '../src/lib/photos/baker';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { expoBakedFiles, expoPickedFiles, expoPhotoFiles, photosDirectory, withinFolder } from '../src/lib/photos/files';
import { sweepPhotos } from '../src/lib/photos/housekeeping';
import type { PickedFiles, StoredPhoto } from '../src/lib/photos/types';
import { androidContainer, createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { makeJpeg, memoryFiles } from './photos-helpers';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));

const SRC = join(__dirname, '..', 'src');
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

// ---- Application Support folder, the native step's temporary files ------------------------------------------------

describe('[SEC-R15][C9] where the stored copy lives', () => {
  it('[C9] iOS: <container>/Library/Application Support/photos, beside Documents; Android: the files folder', () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000009'));
    expect(photosDirectory().uri).toBe(`${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/photos/`);
    h.disk = createDisk(androidContainer());
    expect(photosDirectory().uri).toBe(`${h.disk.documents}photos/`);
  });
  it('[NS-01-R16][NX-39-R31][C9] the erase-everything code removes that same folder and the picker and re-encode caches', () => {
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
});

describe('[NS-01-R6][C8] the Swift module is ImageIO only', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  const strip = swift.replace(/\/\/.*$/gm, ''); // code only; the comments name what is absent
  it('[NS-01-R6][C8] no network, library, camera, location or permission API appears; only ImageIO', () => {
    expect(strip).not.toMatch(/URLSession|URLRequest|NWConnection|CFNetwork|Photos|PHPhoto|PHPicker|UIImagePicker|AVCapture|AVFoundation|CoreLocation|CLLocation|requestAuthorization|UsageDescription|NSURLConnection|WebKit|UIKit/);
    expect([...strip.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort()).toEqual(['ExpoModulesCore', 'Foundation', 'ImageIO', 'UniformTypeIdentifiers']);
  });
  it('[NS-01-R6][C8] it asks ImageIO for the transformed, from-image-always thumbnail, copies no source properties, and never writes an orientation', () => {
    expect(strip).toMatch(/kCGImageSourceCreateThumbnailWithTransform: true/);
    expect(strip).toMatch(/kCGImageSourceCreateThumbnailFromImageAlways: true/);
    expect(strip).toMatch(/kCGImageMetadataShouldExcludeGPS: true/);
    expect(strip).toMatch(/kCGImageMetadataShouldExcludeXMP: true/);
    expect(strip).not.toMatch(/kCGImagePropertyOrientation|kCGImageDestinationMetadata|CGImageDestinationAddImageFromSource|CGImageDestinationCopyImageSource|kCGImagePropertyExif|kCGImagePropertyGPS/);
    expect(strip.match(/CGImageDestinationAddImage\(/g)?.length).toBe(1);
  });
  it('[NS-01-R6][C8] errors are one closed code and the pod depends on ExpoModulesCore only', () => {
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
});
