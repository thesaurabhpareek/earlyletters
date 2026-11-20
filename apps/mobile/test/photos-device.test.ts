/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the picker adapter (C5, C6), the temporary originals
// (C7), the entry_media table (ADR 0028 D1) and the housekeeping sweep. The native parts are device checks in the PR.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { BAKE_TIMEOUT_MS, createOrientationBaker, type BakedFiles } from '../src/lib/photos/baker';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { expoBakedFiles, expoPickedFiles, expoPhotoFiles, photosDirectory, withinFolder } from '../src/lib/photos/files';
import { sweepPhotos } from '../src/lib/photos/housekeeping';
import { commitPhoto } from '../src/lib/photos/session';
import type { PickedFiles, StoredPhoto } from '../src/lib/photos/types';
import { androidContainer, createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { deps, makeJpeg, memoryFiles } from './photos-helpers';

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
  it('[NS-01-R16][NX-39-R31][C9] the erase-everything code removes that same folder and the picker and re-encode caches', () => {
    const src = readFileSync(join(SRC, 'lib', 'erase-everything.ts'), 'utf8');
    expect(src).toMatch(/photosDirectory\(\)/);
    expect(src).not.toMatch(/Paths\.document, 'photos'/);
    expect(src).toMatch(/'ImagePicker', 'ScribePhoto'/);
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
  it('[C7] only a picked original is handed over, and an answer naming another file is never read (review N4)', async () => {
    const files = memoryBaked();
    const calls: string[] = [];
    const baker = createOrientationBaker({ reencodeUpright: async (s: string, d: string) => (calls.push(s), d) }, files)!;
    const other = 'file:///c/Documents/ExpoAudio/take.m4a';
    for (const uri of [other, 'file:///c/ScribePhoto/0194-a.jpg', 'file:///c/ImagePicker/../x.img', 'u']) expect(await baker.bake(Uint8Array.of(1), { uri }), uri).toBeNull();
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
});

// ---- the Swift module, read as source: what it may call, and exactly what it writes --------------------------------

/** Every problem the scan finds in ScribePhotoModule.swift; empty when the module is what the reviews accepted. */
export function swiftProblems(swift: string): string[] {
  const code = swift.replace(/\/\/.*$/gm, ''); // code only; the comments name what is absent
  const out: string[] = [];
  const need = (re: RegExp, why: string) => void (re.test(code) || out.push(`missing: ${why}`));
  const never = (re: RegExp, why: string) => void (re.test(code) && out.push(`forbidden: ${why}`));
  const imports = [...code.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort();
  if (imports.join() !== 'ExpoModulesCore,Foundation,ImageIO,PhotosUI,UIKit,UniformTypeIdentifiers') out.push(`imports: ${imports.join()}`);
  // No permission, camera, library, location, network or logging, anywhere (NS-01-R2, R22; ITMS-90683; review N8).
  never(/requestAuthorization|requestAccess|authorizationStatus|AVCapture|AVFoundation|UIImagePickerController|PHPhotoLibrary|PHAsset|PHImageManager|PHFetch|photoLibrary:|CoreLocation|CLLocation|UsageDescription/, 'a permission, camera, library or location API');
  never(/URLSession|URLRequest|NWConnection|CFNetwork|NSURLConnection|WebKit/, 'a network API');
  never(/\bprint\(|debugPrint|NSLog|os_log|Logger\(/, 'logging');
  // The picker: Apple's out-of-process picker with no library, images only, one, the file as it is.
  if ((code.match(/PHPickerConfiguration\(/g) ?? []).length !== 1 || !/var configuration = PHPickerConfiguration\(\)\n/.test(code)) out.push('the picker configuration is not PHPickerConfiguration() with no library');
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
  const decodeAt = code.indexOf('CGImageSourceCreateThumbnailAtIndex(');
  for (const [re, why] of [[/allowedTypes\.contains\(type\)/, 'the format allowlist'], [/width \* height <= maxPixels/, 'the pixel cap']] as const) {
    const at = code.search(re);
    if (at < 0 || at > decodeAt) out.push(`missing before the decode: ${why}`);
  }
  // Source properties are read for the width and the height only.
  const props = [...code.matchAll(/\bprops\b(\?\[(\w+)\])?/g)];
  const reads = props.filter((m) => m[2]).map((m) => m[2]).sort();
  if (reads.join() !== 'kCGImagePropertyPixelHeight,kCGImagePropertyPixelWidth' || props.length !== 3) out.push(`source properties used beyond width and height: ${props.map((m) => m[0]).join(' ')}`);
  // The decode: from the full image, turned, not cached.
  const decode = /let decode: \[CFString: Any\] = \[([\s\S]*?)\n    \]/.exec(code)?.[1] ?? '';
  if (decode.replace(/\s+/g, ' ').trim() !== 'kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceShouldCache: false, kCGImageSourceThumbnailMaxPixelSize: min(max(width, height), longestSide),') out.push(`decode options: ${decode.trim()}`);
  // The write: exactly one AddImage, of the decoded pixels, with exactly our three options and nothing else.
  const adds = code.match(/CGImageDestinationAdd\w*\([^)]*\)/g) ?? [];
  if (adds.join() !== 'CGImageDestinationAddImage(dest, image, write as CFDictionary)') out.push(`the image is added as: ${adds.join(' ; ')}`);
  const write = /let write: \[CFString: Any\] = \[([\s\S]*?)\n    \]/.exec(code)?.[1] ?? '';
  if (write.replace(/\s+/g, ' ').trim() !== 'kCGImageDestinationLossyCompressionQuality: quality, kCGImageMetadataShouldExcludeGPS: true, kCGImageMetadataShouldExcludeXMP: true,') out.push(`write options: ${write.trim()}`);
  never(/\bwrite\[|var write\b/, 'a changed write dictionary');
  never(/AddImageAndMetadata|AddImageFromSource|CopyImageSource|CGImageDestinationSetProperties|AuxiliaryData|kCGImageAuxiliary|EmbedThumbnail|PreserveGainMap|MergeMetadata|kCGImageDestinationMetadata|CopyMetadataAtIndex|ShouldCacheImmediately/, 'a metadata, auxiliary-data or thumbnail path');
  never(/kCGImageProperty(?!PixelWidth\]|PixelHeight\])\w+/, 'a source property other than the pixel size');
  // Errors: each exported function maps every failure to its one closed code (N3); the codes are fixed strings.
  const codes = [...code.matchAll(/ScribePhotoException\("([^"]+)"\)/g)].map((m) => m[1]).sort();
  if (codes.join() !== 'photo_pick_failed,photo_reencode_failed') out.push(`codes: ${codes.join()}`);
  need(/final class ScribePhotoException: Exception, @unchecked Sendable \{/, 'a Sendable exception with an explicit code');
  need(/override var code: String \{ codeValue \}/, 'the explicit code');
  never(/localizedDescription|\\\(error|description:/, 'error text in a message');
  const fns = [...code.matchAll(/AsyncFunction\("(\w+)"\) \{[^\n]* in\n/g)];
  if (fns.map((m) => m[1]).join() !== 'pickOne,reencodeUpright') out.push(`functions: ${fns.map((m) => m[1]).join()}`);
  for (const m of fns) {
    const body = code.slice(m.index! + m[0].length, code.indexOf('\n    }\n', m.index!));
    if (!/^ {6}do \{\n[\s\S]*\n {6}\} catch \{\n {8}throw ScribePhotoException\.(pick|reencode)\n {6}\}$/.test(body)) out.push(`${m[1]}: a failure can leave without its closed code`);
  }
  return out;
}

describe('[C8] the Swift module: Apple\'s picker and ImageIO, nothing else', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  it('[NS-01-R2][NS-01-R22][C8] the module passes the scan: no permission request, camera, library, network or log; the picker has no library; the write carries only our three options', () => {
    expect(swiftProblems(swift)).toEqual([]);
  });
  it('[C8] positive control: each mutation the reviews tried, and each banned call, makes the scan fail', () => {
    const swap = (a: string, b: string) => {
      expect(swift, a).toContain(a);
      return swift.replace(a, b);
    };
    const writeDict = 'kCGImageMetadataShouldExcludeXMP: true,\n';
    const mutants: Record<string, string> = {
      'source properties into AddImage': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImage(dest, image, props as CFDictionary?)'),
      'Exif in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyExifDictionary: [:],\n`),
      'GPS in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyGPSDictionary: [:],\n`),
      'TIFF in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyTIFFDictionary: [:],\n`),
      'an embedded thumbnail': swap(writeDict, `${writeDict}      kCGImageDestinationEmbedThumbnail: true,\n`),
      'the gain map kept': swap(writeDict, `${writeDict}      kCGImageDestinationPreserveGainMap: true,\n`),
      'auxiliary data': swap('    guard CGImageDestinationFinalize(dest)', '    CGImageDestinationAddAuxiliaryDataInfo(dest, kCGImageAuxiliaryDataTypeDepth, [:] as CFDictionary)\n    guard CGImageDestinationFinalize(dest)'),
      'image and metadata': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImageAndMetadata(dest, image, nil, write as CFDictionary)'),
      'another source property read': swap('    let height = (props?', '    let gps = props?[kCGImagePropertyGPSDictionary]\n    let height = (props?'),
      'image index 0': swap('let index = CGImageSourceGetPrimaryImageIndex(source)', 'let index = 0'),
      'no format allowlist': swap(', allowedTypes.contains(type)', ''),
      'no pixel cap': swap(', width * height <= maxPixels', ''),
      'cached decode': swap('kCGImageSourceShouldCache: false,\n      kCGImageSourceThumbnailMaxPixelSize', 'kCGImageSourceShouldCacheImmediately: true,\n      kCGImageSourceThumbnailMaxPixelSize'),
      'a picker over the photo library': swap('var configuration = PHPickerConfiguration()', 'var configuration = PHPickerConfiguration(photoLibrary: .shared())'),
      'a library authorization': swap('    let picker = PHPickerViewController', '    PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }\n    let picker = PHPickerViewController'),
      'a camera request': swap('    let picker = PHPickerViewController', '    AVCaptureDevice.requestAccess(for: .video) { _ in }\n    let picker = PHPickerViewController'),
      'a log line': swap('    let index = CGImageSourceGetPrimaryImageIndex', '    print(sourceUri)\n    let index = CGImageSourceGetPrimaryImageIndex'),
      'a raw error out of reencodeUpright': swap('      } catch {\n        throw ScribePhotoException.reencode\n      }', '      } catch {\n        throw error\n      }'),
      'a third code': swap('ScribePhotoException("photo_pick_failed")', 'ScribePhotoException("photo_pick_cancelled")'),
    };
    for (const [name, text] of Object.entries(mutants)) expect(swiftProblems(text).length, name).toBeGreaterThan(0);
  });
  it('[C8] the pod declares the frameworks the module imports and depends on ExpoModulesCore only; the config names one module', () => {
    const pod = readFileSync(join(dir, 'ios', 'ScribePhoto.podspec'), 'utf8');
    expect([...pod.matchAll(/s\.dependency '([^']+)'/g)].map((m) => m[1])).toEqual(['ExpoModulesCore']);
    expect(/s\.frameworks = (.*)/.exec(pod)?.[1]).toBe("'CoreGraphics', 'ImageIO', 'PhotosUI', 'UIKit', 'UniformTypeIdentifiers'");
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
