// Fixtures and in-memory ports for the photo tests. The fictional family is Asha; no real picture is used.
import type { PhotoDeps, PhotoFiles, PhotoStore, StoredPhoto } from '../src/lib/photos/types';

const seg = (marker: number, payload: number[]): number[] => [0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload];
const text = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0));

export interface JpegOptions {
  orientation?: number;
  exif?: boolean;
  xmp?: boolean;
  iptc?: boolean;
  comment?: boolean;
  jfifThumb?: boolean;
  icc?: boolean;
  mpf?: boolean;
  /** Distinct image bytes so two fixtures differ. */
  seed?: number;
}

/** A structurally valid JPEG (segments only, not a decodable picture) with the chosen metadata. */
export function makeJpeg(o: JpegOptions = {}): Uint8Array {
  const out: number[] = [0xff, 0xd8];
  const tx = o.jfifThumb ? 2 : 0;
  out.push(...seg(0xe0, [...text('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, tx, tx, ...(o.jfifThumb ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [])]));
  if (o.exif) {
    // little-endian TIFF, one IFD with Orientation, then a GPS-looking tag
    const orient = o.orientation ?? 1;
    const tiff = [0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 2, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, orient, 0, 0, 0, 0x25, 0x88, 4, 0, 1, 0, 0, 0, 0x2a, 0, 0, 0, 0, 0, 0, 0];
    out.push(...seg(0xe1, [...text('Exif\0\0'), ...tiff, ...text('GPSLatitudeRef N 37.7749 -122.4194 iPhone 17 Pro 2026:06:12 09:30:00')]));
  }
  if (o.xmp) out.push(...seg(0xe1, [...text('http://ns.adobe.com/xap/1.0/\0'), ...text('<x:xmpmeta><dc:creator>Asha</dc:creator></x:xmpmeta>')]));
  if (o.iptc) out.push(...seg(0xed, [...text('Photoshop 3.0\0'), ...text('8BIM'), 4, 4, 0, 0, 0, 0, 0, 8, 1, 90, 0, 0, 0, 0]));
  if (o.mpf) out.push(...seg(0xe2, [...text('MPF\0'), 1, 2, 3, 4]));
  if (o.icc) out.push(...seg(0xe2, [...text('ICC_PROFILE\0'), 1, 1, 9, 9, 9, 9]));
  if (o.comment) out.push(...seg(0xfe, text('taken at the park')));
  out.push(...seg(0xdb, [0, ...new Array(64).fill(8)]));
  out.push(...seg(0xc0, [8, 0, 4, 0, 4, 1, 1, 0x11, 0]));
  out.push(...seg(0xda, [1, 1, 0, 0, 0x3f, 0]), 0x10 + ((o.seed ?? 0) & 0x0f), 0x20, 0x30, 0x40, 0xff, 0xd9);
  return Uint8Array.from(out);
}

/** Ten pictures that between them carry location, date, device and a thumbnail in every way a phone does. */
export function tenFixtures(): Uint8Array[] {
  return [
    makeJpeg({ exif: true, seed: 1 }),
    makeJpeg({ exif: true, xmp: true, seed: 2 }),
    makeJpeg({ exif: true, iptc: true, seed: 3 }),
    makeJpeg({ xmp: true, seed: 4 }),
    makeJpeg({ iptc: true, comment: true, seed: 5 }),
    makeJpeg({ exif: true, xmp: true, iptc: true, comment: true, jfifThumb: true, seed: 6 }),
    makeJpeg({ mpf: true, icc: true, exif: true, seed: 7 }),
    makeJpeg({ jfifThumb: true, exif: true, seed: 8 }),
    makeJpeg({ exif: true, orientation: 1, xmp: true, icc: true, seed: 9 }),
    makeJpeg({ comment: true, exif: true, iptc: true, seed: 10 }),
  ];
}

export function memoryStore(): PhotoStore & { rows: Map<string, StoredPhoto>; puts: number; removes: number } {
  const rows = new Map<string, StoredPhoto>();
  const s = {
    rows,
    puts: 0,
    removes: 0,
    get: (id: string) => rows.get(id) ?? null,
    put(p: StoredPhoto) {
      s.puts++;
      rows.set(p.entryId, { ...p });
    },
    remove(id: string) {
      s.removes++;
      rows.delete(id);
    },
    all: () => [...rows.values()],
  };
  return s;
}

export function memoryFiles(opts: { free?: number; failWrite?: boolean } = {}): PhotoFiles & { disk: Map<string, Uint8Array>; writes: number } {
  const disk = new Map<string, Uint8Array>();
  const f = {
    disk,
    writes: 0,
    async write(path: string, bytes: Uint8Array) {
      f.writes++;
      disk.set(path, bytes); // a failing disk still leaves a partial file behind
      if (opts.failWrite) throw new Error('disk');
    },
    async remove(path: string) {
      disk.delete(path);
    },
    async list() {
      return [...disk.keys()];
    },
    async freeBytes() {
      return opts.free ?? 1e9;
    },
  };
  return f;
}

export function deps(over: { files?: ReturnType<typeof memoryFiles>; store?: ReturnType<typeof memoryStore>; at?: { t: number } } = {}) {
  const files = over.files ?? memoryFiles();
  const store = over.store ?? memoryStore();
  const clock = over.at ?? { t: Date.UTC(2026, 10, 11) };
  let n = 0;
  const d: PhotoDeps = { store, files, newId: () => `m${++n}`, now: () => new Date(clock.t) };
  return { d, files, store, clock };
}
