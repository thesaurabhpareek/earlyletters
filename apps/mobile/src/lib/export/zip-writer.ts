/**
 * A store-only ZIP writer for the export (BL-388), so one export stays one file past 4 GiB (ZIP64, APPNOTE.TXT
 * 4.3.14 to 4.5.3). fflate 0.8.3 reads ZIP64 but writes every offset and size in 4 bytes, so its archives break
 * there. Below 4 GiB this writes the bytes fflate's `Zip` with `ZipPassThrough` wrote (local header with a data
 * descriptor, version 20, UTF-8 flag only for a non-ASCII name, DOS time in local time), so exports made before
 * and after are the same file. ZIP64 goes in only where a value needs it: an entry of 0xFFFFFFFF bytes or more
 * gets a ZIP64 extra in both headers and an 8-byte data descriptor (Python zipfile's layout); an entry that starts
 * at or past 0xFFFFFFFF gets an offset extra in the central directory; the ZIP64 end record and locator are
 * written when the directory starts or runs at or past 0xFFFFFFFF, or there are more than 0xFFFE entries.
 */
import { strToU8 } from 'fflate';

const MAX32 = 0xffffffff;

// CRC-32 (IEEE), sliced by 8: every byte of every recording goes through it as it is written.
const T = new Int32Array(2048);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  T[i] = c;
}
for (let i = 256; i < 2048; i++) T[i] = (T[i - 256] >>> 8) ^ T[T[i - 256] & 255];

/** CRC-32 of `data` continuing from `prev` (zlib's `crc32(data, prev)` convention: 0 to start). */
export function crc32(data: Uint8Array, prev = 0): number {
  let c = ~prev;
  let i = 0;
  for (const n = data.length - 7; i < n; i += 8) {
    const a = c ^ (data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24));
    c = T[1792 + (a & 255)] ^ T[1536 + ((a >>> 8) & 255)] ^ T[1280 + ((a >>> 16) & 255)] ^ T[1024 + (a >>> 24)];
    c ^= T[768 + data[i + 4]] ^ T[512 + data[i + 5]] ^ T[256 + data[i + 6]] ^ T[data[i + 7]];
  }
  for (; i < data.length; i++) c = T[(c ^ data[i]) & 255] ^ (c >>> 8);
  return ~c >>> 0;
}

type Field = [value: number, bytes: 2 | 4 | 8];
/** Little-endian fields from `at`; 8 bytes keep a value up to 2^53 exact (two 32-bit halves). */
function put(b: Uint8Array, at: number, ...fields: Field[]) {
  for (const [v, n] of fields) {
    if (n === 8) put(b, at, [v % 0x1_0000_0000, 4], [Math.floor(v / 0x1_0000_0000), 4]);
    else for (let k = 0; k < n; k++) b[at + k] = (v >>> (8 * k)) & 255;
    at += n;
  }
}

export interface ZipWriterOptions {
  mtime: Date;
  /** Tests only: ZIP64 records for every entry and the end whatever the values, so a reader can be checked on a small file. */
  forceZip64?: boolean;
  /** The CRC function, zlib's convention. Tests pass node's `zlib.crc32` to cross 4 GiB quickly. */
  crc32?: (data: Uint8Array, prev: number) => number;
}

/** `big`: ZIP64 sizes in the local header and the descriptor, decided from the declared size before the data goes out. */
type Entry = { name: Uint8Array; flags: number; size: number; offset: number; crc: number; written: number; big: boolean };

export class ZipWriter {
  private offset = 0;
  private readonly entries: Entry[] = [];
  private open: Entry | null = null;
  private readonly time: number;

  constructor(private readonly sink: (chunk: Uint8Array) => void, private readonly opts: ZipWriterOptions) {
    const d = opts.mtime;
    const y = d.getFullYear() - 1980;
    if (y < 0 || y > 119) throw new Error('zip_bad_mtime');
    this.time = ((y << 25) | ((d.getMonth() + 1) << 21) | (d.getDate() << 16) | (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) >>> 0;
  }

  private emit(chunk: Uint8Array) {
    this.sink(chunk);
    this.offset += chunk.length;
    if (!Number.isSafeInteger(this.offset)) throw new Error('zip_too_large'); // offsets must stay exact in a JS number
  }

  /** Starts an entry of `size` bytes; push exactly that many, then `finish`. */
  begin(path: string, size: number): void {
    if (this.open) throw new Error('zip_entry_open');
    const name = strToU8(path); // fflate's encoder: TextEncoder is not guaranteed in Hermes
    if (name.length > 0xffff) throw new Error('zip_name_too_long');
    const big = this.opts.forceZip64 === true || size >= MAX32;
    // Bit 3: CRC and sizes follow in a data descriptor. Bit 11: the name is UTF-8, set only when it is not ASCII (as fflate did).
    const flags = 0x0008 | (name.length !== path.length ? 0x0800 : 0);
    const h = new Uint8Array(30 + name.length + (big ? 20 : 0));
    put(h, 0, [0x04034b50, 4], [big ? 45 : 20, 2], [flags, 2], [0, 2], [this.time, 4]);
    put(h, 26, [name.length, 2], [big ? 20 : 0, 2]);
    h.set(name, 30);
    // 0xFFFFFFFF in the size fields and zero sizes in the ZIP64 extra: the sizes follow the data.
    if (big) put(h, 18, [MAX32, 4], [MAX32, 4]);
    if (big) put(h, 30 + name.length, [1, 2], [16, 2]);
    this.open = { name, flags, size, offset: this.offset, crc: 0, written: 0, big };
    this.emit(h);
  }

  push(chunk: Uint8Array): void {
    const e = this.open;
    if (!e || (e.written += chunk.length) > e.size) throw new Error('zip_size_mismatch');
    e.crc = (this.opts.crc32 ?? crc32)(chunk, e.crc);
    this.emit(chunk);
  }

  finish(): void {
    const e = this.open;
    if (!e || e.written !== e.size) throw new Error('zip_size_mismatch');
    const n = e.big ? 8 : 4;
    const d = new Uint8Array(8 + 2 * n);
    put(d, 0, [0x08074b50, 4], [e.crc, 4], [e.size, n], [e.size, n]); // stored: the compressed size is the size
    this.open = null;
    this.entries.push(e);
    this.emit(d);
  }

  /** Writes the central directory and the end records. Returns the archive's size. */
  end(): number {
    if (this.open) throw new Error('zip_entry_open');
    const force = this.opts.forceZip64 === true;
    const start = this.offset;
    for (const e of this.entries) {
      const sizes = force || e.size >= MAX32;
      const far = force || e.offset >= MAX32;
      // The ZIP64 extra (4.5.3) holds only the fields set to 0xFFFFFFFF, in the order size, compressed size, offset.
      const wide: Field[] = [...(sizes ? [[e.size, 8], [e.size, 8]] : []), ...(far ? [[e.offset, 8]] : [])] as Field[];
      const extra = wide.length ? 4 + 8 * wide.length : 0;
      const v = extra ? 45 : 20; // made by and needed: 4.5 for ZIP64
      const c = new Uint8Array(46 + e.name.length + extra);
      put(c, 0, [0x02014b50, 4], [v, 2], [v, 2], [e.flags, 2], [0, 2], [this.time, 4], [e.crc, 4]);
      put(c, 20, [sizes ? MAX32 : e.size, 4], [sizes ? MAX32 : e.size, 4], [e.name.length, 2], [extra, 2]);
      put(c, 42, [far ? MAX32 : e.offset, 4]);
      c.set(e.name, 46);
      if (extra) put(c, 46 + e.name.length, [1, 2], [extra - 4, 2], ...wide);
      this.emit(c);
    }
    const size = this.offset - start;
    const count = this.entries.length;
    // An entry with a ZIP64 extra starts or ends past 0xFFFFFFFF, so the directory does too and this record follows.
    if (force || count > 0xfffe || start >= MAX32 || size >= MAX32) {
      // The ZIP64 end record (4.3.14), then its locator (4.3.15), which points back at the record. One disk.
      const r = new Uint8Array(76);
      put(r, 0, [0x06064b50, 4], [44, 8], [45, 2], [45, 2], [0, 4], [0, 4], [count, 8], [count, 8], [size, 8], [start, 8]);
      put(r, 56, [0x07064b50, 4], [0, 4], [this.offset, 8], [1, 4]);
      this.emit(r);
    }
    const many = force || count > 0xfffe;
    const end = new Uint8Array(22);
    put(end, 0, [0x06054b50, 4], [0, 4], [many ? 0xffff : count, 2], [many ? 0xffff : count, 2]);
    put(end, 12, [force || size >= MAX32 ? MAX32 : size, 4], [force || start >= MAX32 ? MAX32 : start, 4]);
    this.emit(end);
    return this.offset;
  }
}
