/**
 * Letters' pictures in the export (schema 1.7.0, BL-933; ADR 0028 D2; NS-01-R14, NS-01-R6, BL-1410). The export carries
 * the stored copy the app kept, byte for byte, at photos/<entry_id>/<media_id>.jpg, and nothing else: a file that is not
 * that copy, or that carries a location or any other metadata segment, is held back and the letter says `photo: null`.
 * Builds the real ZIP with pack.ts, as the golden test does, from the fictional Asha family.
 */
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { ExportSnapshot } from '../src/lib/export/build.logic';
import { packExport, type PackProgress } from '../src/lib/export/pack';
import { type EntriesFile, type Manifest } from '../src/lib/export/schema';
import { verifyExport } from '../src/lib/export/verify';
import { carriesMetadata } from '../src/lib/photos/strip';
import { ASHA_FILES, ASHA_PHOTO, ASHA_PHOTO_URI, ashaSnapshot, sha256Hex } from './helpers/asha-export';
import { makeJpeg } from './photos-helpers';

const PHOTO_PATH = 'photos/e2/m-asha-0001.jpg';

async function pack(snapshot: ExportSnapshot, files: Record<string, Uint8Array> = ASHA_FILES, reads: string[] = []) {
  const chunks: Uint8Array[] = [];
  const progress: PackProgress[] = [];
  const result = await packExport(snapshot, {
    onProgress: (p) => progress.push(p),
    readFile: async (uri) => {
      reads.push(uri);
      return files[uri] ?? Promise.reject(new Error('missing'));
    },
    sha256: async (d) => sha256Hex(d),
    renderPdf: async () => new TextEncoder().encode('%PDF-1.4\n%%EOF\n'),
    sink: { write: (c) => chunks.push(c.slice()) },
    mtime: new Date(2027, 2, 15, 10, 0, 0),
  });
  const zip = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of chunks) {
    zip.set(c, o);
    o += c.length;
  }
  const unzipped = unzipSync(zip);
  const entries = JSON.parse(strFromU8(unzipped['data/entries.json'])) as EntriesFile;
  const manifest = JSON.parse(strFromU8(unzipped['manifest.json'])) as Manifest;
  return { zip, result, files: unzipped, entries, manifest, progress, e2: entries.entries.find((e) => e.id === 'e2')! };
}

/** The Asha snapshot with e2's stored copy replaced by `bytes`, its kept hash set to `keptSha` (the store's own record). */
function withStoredCopy(bytes: Uint8Array, keptSha = sha256Hex(bytes)) {
  const snapshot = ashaSnapshot();
  const e2 = snapshot.entries.find((e) => e.id === 'e2')!;
  e2.photo = { ...e2.photo!, sha256: keptSha, bytes: bytes.length };
  return { snapshot, files: { ...ASHA_FILES, [ASHA_PHOTO_URI]: bytes } };
}

function expectHeldBack(out: Awaited<ReturnType<typeof pack>>) {
  expect(out.e2.photo).toBeNull();
  expect(Object.keys(out.files).filter((f) => f.startsWith('photos/'))).toEqual([]);
  expect(out.manifest.files.some((f) => f.path.startsWith('photos/'))).toBe(false);
  expect(out.manifest.counts.photos).toBe(0);
  expect(out.result.photosHeldBack).toEqual(['e2']);
  expect(strFromU8(out.files['index.html'])).not.toContain('<figure>');
  // The README describes photos/ only when a picture is in it.
  expect(strFromU8(out.files['README.txt'])).not.toContain('PICTURES');
}

/** A second picture, on e3, beside the Asha one on e2. */
const SECOND_URI = 'file:///support/photos/m-asha-0002.jpg';
const SECOND = makeJpeg({ icc: true, seed: 5 });
function withSecondPicture() {
  const snapshot = ashaSnapshot();
  const e2 = snapshot.entries.find((e) => e.id === 'e2')!;
  const e3 = snapshot.entries.find((e) => e.id === 'e3')!;
  e3.photo = { ...e2.photo!, mediaId: 'm-asha-0002', uri: SECOND_URI, sha256: sha256Hex(SECOND), bytes: SECOND.length };
  return { snapshot, files: { ...ASHA_FILES, [SECOND_URI]: SECOND } };
}

describe('[BL-933] export 1.7.0 carries letters\' pictures', () => {
  it('[NS-01-R14] writes the stored copy byte for byte at its path, hashed in the manifest, and the check passes', async () => {
    const out = await pack(ashaSnapshot());
    expect(sha256Hex(out.files[PHOTO_PATH])).toBe(sha256Hex(ASHA_PHOTO));
    expect(out.files[PHOTO_PATH].length).toBe(ASHA_PHOTO.length);
    expect(out.e2.photo).toEqual({
      file: PHOTO_PATH,
      bytes: ASHA_PHOTO.length,
      sha256: sha256Hex(ASHA_PHOTO),
      width: 4,
      height: 4,
      text: 'Your first bath, in the kitchen sink.',
      place: 'Home',
    });
    const listed = out.manifest.files.find((f) => f.path === PHOTO_PATH)!;
    expect(listed.sha256).toBe(sha256Hex(ASHA_PHOTO));
    expect(out.manifest.counts.photos).toBe(1);
    expect(out.result.photosHeldBack).toEqual([]);
    expect(carriesMetadata(out.files[PHOTO_PATH])).toBe(false);
    const check = await verifyExport({ size: out.zip.length, read: (o, l) => out.zip.subarray(o, o + l) }, out.result.manifest, out.result.manifestSha256, async (d) => sha256Hex(d));
    expect(check.ok).toBe(true);
    // Every other letter has no picture.
    expect(out.entries.entries.filter((e) => e.photo !== null).map((e) => e.id)).toEqual(['e2']);
  });

  it('[NS-01-R6][BL-1410] a planted located picture is held back, even when the store says it is the kept copy', async () => {
    const located = makeJpeg({ exif: true, seed: 3 });
    expect(carriesMetadata(located)).toBe(true);
    // The kept hash matches the located bytes, so only the metadata scan stands between this file and the ZIP.
    const { snapshot, files } = withStoredCopy(located);
    const out = await pack(snapshot, files);
    expectHeldBack(out);
    // Nothing from the located file's GPS segment is anywhere in the export.
    for (const [path, bytes] of Object.entries(out.files)) expect(strFromU8(bytes, true).includes('GPSLatitude'), path).toBe(false);
  });

  it('holds back XMP, IPTC and comment segments the same way', async () => {
    for (const opts of [{ xmp: true }, { iptc: true }, { comment: true }]) {
      const { snapshot, files } = withStoredCopy(makeJpeg({ ...opts, seed: 3 }));
      expectHeldBack(await pack(snapshot, files));
    }
  });

  it('holds back a clean file that is not the copy the app kept (hash differs)', async () => {
    const other = makeJpeg({ icc: true, seed: 9 });
    expect(carriesMetadata(other)).toBe(false);
    const { snapshot, files } = withStoredCopy(other, sha256Hex(ASHA_PHOTO));
    expectHeldBack(await pack(snapshot, files));
  });

  it('says photo: null when the stored copy is not on this phone, or vanished before packing', async () => {
    const notHere = ashaSnapshot();
    notHere.entries.find((e) => e.id === 'e2')!.photo!.onPhone = false;
    const a = await pack(notHere);
    expect(a.e2.photo).toBeNull();
    expect(a.manifest.counts.photos).toBe(0);
    expect(a.result.photosHeldBack).toEqual([]);

    const { [ASHA_PHOTO_URI]: _gone, ...rest } = ASHA_FILES;
    const b = await pack(ashaSnapshot(), rest);
    expect(b.e2.photo).toBeNull();
    expect(Object.keys(b.files).some((f) => f.startsWith('photos/'))).toBe(false);
    expect(strFromU8(b.files['README.txt'])).not.toContain('PICTURES');
  });

  it('[NS-01-R6] holds back a stored copy with any bytes after the end marker, even plain text', async () => {
    const trailer = new TextEncoder().encode('lat 51.5007 lon -0.1246');
    const tailed = new Uint8Array([...ASHA_PHOTO, ...trailer]);
    expect(carriesMetadata(tailed)).toBe(true);
    expect(carriesMetadata(ASHA_PHOTO)).toBe(false);
    const { snapshot, files } = withStoredCopy(tailed);
    expectHeldBack(await pack(snapshot, files));
  });

  it('[NS-01-R14] FU-13d: two pictures that both pass, each photos/ file the bytes of its own source, the first one kept from the README check included', async () => {
    // Kills the mutant that drops `firstPhoto = null` in step 4c: the kept first picture's bytes would then be written at
    // every later picture's path, so photos/e3 would hold e2's picture.
    const { snapshot, files } = withSecondPicture();
    expect(sha256Hex(SECOND)).not.toBe(sha256Hex(ASHA_PHOTO));
    const out = await pack(snapshot, files);
    expect(out.result.photosHeldBack).toEqual([]);
    const e3Path = 'photos/e3/m-asha-0002.jpg';
    expect(Object.keys(out.files).filter((f) => f.startsWith('photos/')).sort()).toEqual([PHOTO_PATH, e3Path]);
    expect(out.files[PHOTO_PATH]).toEqual(ASHA_PHOTO);
    expect(out.files[e3Path]).toEqual(SECOND);
    for (const [path, source] of [[PHOTO_PATH, ASHA_PHOTO], [e3Path, SECOND]] as const) {
      expect(out.manifest.files.find((f) => f.path === path)).toMatchObject({ bytes: source.length, sha256: sha256Hex(source) });
    }
    expect(out.entries.entries.find((e) => e.id === 'e3')!.photo).toMatchObject({ file: e3Path, bytes: SECOND.length, sha256: sha256Hex(SECOND) });
    expect(out.manifest.counts.photos).toBe(2);
    expect(strFromU8(out.files['README.txt'])).toContain('PICTURES');
  });

  it('[BL-933] FU-13d: picture progress is reported once for each picture, in order, whether the first one is kept or held back', async () => {
    // Distinct planned sizes (entry_media.bytes is the progress size; the files' own sizes are what entries.json says),
    // so each 'pictures' step can be told apart by how far it moves the bar: delta = sizeHint / total.
    const E2_HINT = 40_000;
    const E3_HINT = 120_000;
    const located = makeJpeg({ exif: true, seed: 3 });
    const locatedToo = makeJpeg({ exif: true, seed: 5 });
    const run = async (heldBack: Array<'e2' | 'e3'>) => {
      const { snapshot, files } = withSecondPicture();
      const byId = (id: string) => snapshot.entries.find((e) => e.id === id)!.photo!;
      byId('e2').bytes = E2_HINT;
      byId('e3').bytes = E3_HINT;
      const onPhone: Record<string, Uint8Array> = { ...files };
      if (heldBack.includes('e2')) {
        onPhone[ASHA_PHOTO_URI] = located;
        byId('e2').sha256 = sha256Hex(located);
      }
      if (heldBack.includes('e3')) {
        onPhone[SECOND_URI] = locatedToo;
        byId('e3').sha256 = sha256Hex(locatedToo);
      }
      const out = await pack(snapshot, onPhone);
      expect(out.result.photosHeldBack).toEqual(heldBack);
      return out.progress;
    };
    for (const heldBack of [[], ['e2'], ['e3'], ['e2', 'e3']] as Array<Array<'e2' | 'e3'>>) {
      const progress = await run(heldBack);
      // The bar never goes back.
      for (let i = 1; i < progress.length; i++) expect(progress[i].fraction, `${heldBack.join(',')} at ${i}`).toBeGreaterThanOrEqual(progress[i - 1].fraction);
      const at = progress.flatMap((p, i) => (p.phase === 'pictures' ? [i] : []));
      // One 'pictures' step per picture: a kept first picture is not counted in step 0 and again in step 4c, and a
      // held-back one is counted where it was judged and not again.
      expect(at, `pictures steps with ${heldBack.join(',') || 'none'} held back`).toHaveLength(2);
      const deltas = at.map((i) => progress[i].fraction - progress[i - 1].fraction);
      for (const d of deltas) expect(d).toBeGreaterThan(0);
      // e2's size, then e3's: each picture's own size, once, in plan order.
      expect(deltas[1] / deltas[0]).toBeCloseTo(E3_HINT / E2_HINT, 6);
    }
  });

  it('describes photos/ in the README when a later picture goes in, and reads each picture once', async () => {
    const { snapshot, files } = withSecondPicture();
    const located = makeJpeg({ exif: true, seed: 3 });
    snapshot.entries.find((e) => e.id === 'e2')!.photo!.sha256 = sha256Hex(located);
    const reads: string[] = [];
    const out = await pack(snapshot, { ...files, [ASHA_PHOTO_URI]: located }, reads);
    expect(out.result.photosHeldBack).toEqual(['e2']);
    expect(Object.keys(out.files).filter((f) => f.startsWith('photos/'))).toEqual(['photos/e3/m-asha-0002.jpg']);
    expect(strFromU8(out.files['README.txt'])).toContain('PICTURES');
    expect(reads.filter((u) => u === ASHA_PHOTO_URI)).toHaveLength(1);
    expect(reads.filter((u) => u === SECOND_URI)).toHaveLength(1);
    expect(out.manifest.counts.photos).toBe(1);
    const check = await verifyExport({ size: out.zip.length, read: (o, l) => out.zip.subarray(o, o + l) }, out.result.manifest, out.result.manifestSha256, async (d) => sha256Hex(d));
    expect(check.ok).toBe(true);
  });

  it('[NS-01-R14] the words are the same with or without the picture', async () => {
    const withPicture = await pack(ashaSnapshot());
    const noPicture = ashaSnapshot();
    delete noPicture.entries.find((e) => e.id === 'e2')!.photo;
    const without = await pack(noPicture);
    const words = (e: EntriesFile['entries'][number]) => ({ ...e, photo: null });
    expect(withPicture.entries.entries.map(words)).toEqual(without.entries.entries.map(words));
    expect(strFromU8(without.files['README.txt'])).not.toContain('PICTURES');
    expect(strFromU8(withPicture.files['README.txt'])).toContain('PICTURES');
  });

  it('states an unknown pixel size as null, never 0, and the README still ends on the format line', async () => {
    const snapshot = ashaSnapshot();
    const e2 = snapshot.entries.find((e) => e.id === 'e2')!;
    e2.photo = { ...e2.photo!, width: 0, height: 0 };
    const out = await pack(snapshot);
    expect(out.e2.photo).toMatchObject({ width: null, height: null });
    const readme = strFromU8(out.files['README.txt']).trimEnd().split('\r\n');
    expect(readme.at(-1)).toMatch(/^Format /);
    expect(readme.indexOf('PICTURES')).toBeLessThan(readme.indexOf('KEEPING IT SAFE'));
  });
});
