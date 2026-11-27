/**
 * Letters' pictures in the export (schema 1.7.0, BL-933; ADR 0028 D2; NS-01-R14, NS-01-R6, BL-1410). The export carries
 * the stored copy the app kept, byte for byte, at photos/<entry_id>/<media_id>.jpg, and nothing else: a file that is not
 * that copy, or that carries a location or any other metadata segment, is held back and the letter says `photo: null`.
 * Builds the real ZIP with pack.ts, as the golden test does, from the fictional Asha family.
 */
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { ExportSnapshot } from '../src/lib/export/build.logic';
import { packExport } from '../src/lib/export/pack';
import { type EntriesFile, type Manifest } from '../src/lib/export/schema';
import { verifyExport } from '../src/lib/export/verify';
import { carriesMetadata } from '../src/lib/photos/strip';
import { ASHA_FILES, ASHA_PHOTO, ASHA_PHOTO_URI, ashaSnapshot, sha256Hex } from './helpers/asha-export';
import { makeJpeg } from './photos-helpers';

const PHOTO_PATH = 'photos/e2/m-asha-0001.jpg';

async function pack(snapshot: ExportSnapshot, files: Record<string, Uint8Array> = ASHA_FILES) {
  const chunks: Uint8Array[] = [];
  const result = await packExport(snapshot, {
    readFile: async (uri) => files[uri] ?? Promise.reject(new Error('missing')),
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
  return { zip, result, files: unzipped, entries, manifest, e2: entries.entries.find((e) => e.id === 'e2')! };
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
