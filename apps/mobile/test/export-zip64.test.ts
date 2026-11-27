/// <reference types="node" />
/**
 * [BL-388] An export past 4 GiB stays one file: ZIP64 (APPNOTE 4.3.14 to 4.5.3), written by zip-writer.ts and read
 * by verify.ts. The boundary tests push about 4 GiB through the writer without keeping it: the source yields one
 * zero buffer again and again, and the sink counts bytes and keeps only the rest (the headers). Fictional family Asha.
 */
import { crc32 as zlibCrc32 } from 'node:zlib';
import { strToU8, unzipSync, Zip, ZipPassThrough } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { Manifest } from '../src/lib/export/schema';
import { readCentralDirectory, readEntry, verifyExport, type RandomAccess } from '../src/lib/export/verify';
import { crc32, ZipWriter } from '../src/lib/export/zip-writer';
import { sha256Hex } from './helpers/asha-export';

const MAX32 = 0xffffffff;
const mtime = new Date(2027, 2, 15, 10, 0, 0);
const ZERO = new Uint8Array(1 << 24);
const FILES: [string, Uint8Array][] = [
  ['README.txt', strToU8('Letters to Asha\n')],
  ['letters/Asha/आशा.txt', strToU8('Asha, you clapped today.')],
  ['empty.txt', new Uint8Array(0)],
  ['audio/e1.m4a', Uint8Array.from({ length: 70_000 }, (_, i) => (i * 7919) & 255)],
];

/** Writes `files` (a number is that many zero bytes, from one reused buffer) and keeps every chunk that is not that buffer. */
function write(files: [string, Uint8Array | number][], opts: { forceZip64?: boolean } = {}) {
  const kept: { at: number; bytes: Uint8Array }[] = [];
  let size = 0;
  const sink = (c: Uint8Array) => {
    if (c.buffer !== ZERO.buffer) kept.push({ at: size, bytes: c.slice() });
    size += c.length;
  };
  // node's zlib CRC only where gigabytes of zeros go through; the writer's own CRC everywhere else.
  const fast = files.some(([, d]) => typeof d === 'number') ? (d: Uint8Array, prev: number) => zlibCrc32(d, prev) : undefined;
  const w = new ZipWriter(sink, { mtime, crc32: fast, ...opts });
  for (const [name, data] of files) {
    const n = typeof data === 'number' ? data : data.length;
    w.begin(name, n);
    for (let o = 0; o < n; o += ZERO.length) w.push(typeof data === 'number' ? ZERO.subarray(0, Math.min(n - o, ZERO.length)) : data.subarray(o, o + ZERO.length));
    w.finish();
  }
  expect(w.end()).toBe(size);
  // Reads back as zeros where the zero buffer went.
  const view: RandomAccess = {
    size,
    read(o, l) {
      const out = new Uint8Array(Math.max(0, Math.min(l, size - o)));
      for (const k of kept) if (k.at < o + out.length && k.at + k.bytes.length > o) out.set(k.bytes.subarray(Math.max(0, o - k.at), o + out.length - k.at), Math.max(0, k.at - o));
      return out;
    },
  };
  return { size, view, headers: Uint8Array.from(kept.flatMap((k) => [...k.bytes])), end: view.read(size - 22, 22) as Uint8Array };
}
const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const find = (b: Uint8Array, sig: number) => b.findIndex((_, i) => u32(b, i) === sig);
const access = (zip: Uint8Array): RandomAccess => ({ size: zip.length, read: (o, l) => zip.subarray(o, o + l) });
const manifestOf = (files: [string, Uint8Array][]) =>
  ({ files: files.map(([path, d]) => ({ path, bytes: d.length, sha256: sha256Hex(d), media_type: 'text/plain' })) }) as unknown as Manifest;
const sha = async (d: Uint8Array) => sha256Hex(d);

describe('[BL-388] below 4 GiB the writer writes what fflate wrote', () => {
  it("byte for byte, so exports made before and after ZIP64 are the same file; and its CRC-32 is zlib's", () => {
    const chunks: Uint8Array[] = [];
    const z = new Zip((_e, c) => chunks.push(c));
    for (const [name, data] of FILES) {
      const f = new ZipPassThrough(name);
      f.mtime = mtime;
      z.add(f);
      f.push(data, true);
    }
    z.end();
    expect(write(FILES).headers).toEqual(Uint8Array.from(chunks.flatMap((c) => [...c])));
    const data = FILES[3][1];
    expect([crc32(data), crc32(data.subarray(5), crc32(data.subarray(0, 5)))]).toEqual([zlibCrc32(data), zlibCrc32(data)]);
  });
});

describe('[BL-388] across the 4 GiB boundary', () => {
  const ahead = 30 + 'big.bin'.length + 16; // local header and data descriptor around big.bin

  it('a directory that starts at 0xFFFFFFFE has no ZIP64 record at all', async () => {
    const { view, headers, end } = write([['big.bin', MAX32 - 1 - ahead]]);
    expect([u32(end, 16), find(headers, 0x06064b50), find(headers, 0x07064b50)]).toEqual([MAX32 - 1, -1, -1]);
    expect([u16(headers, find(headers, 0x02014b50) + 6), u16(headers, find(headers, 0x02014b50) + 30)]).toEqual([20, 0]); // version 2.0, no extra
    expect(await readCentralDirectory(view)).toMatchObject([{ name: 'big.bin', size: MAX32 - 1 - ahead, localOffset: 0 }]);
  }, 60_000);

  it('an entry that starts at 0xFFFFFFFF gets a ZIP64 offset, and the end gets the ZIP64 record and locator', async () => {
    const asha = strToU8('Asha');
    const { size, view, headers, end } = write([['big.bin', MAX32 - ahead], ['after.txt', asha]]);
    expect([u16(end, 10), u32(end, 16)]).toEqual([2, MAX32]); // the count fits; the offset says "see ZIP64"
    const locator = headers.subarray(find(headers, 0x07064b50));
    expect([find(headers, 0x06064b50) > 0, u32(locator, 8) + u32(locator, 12) * 2 ** 32]).toEqual([true, size - 22 - 20 - 56]);
    const [big, after] = await readCentralDirectory(view);
    expect([big, after]).toMatchObject([{ size: MAX32 - ahead, localOffset: 0 }, { name: 'after.txt', size: 4, localOffset: MAX32 }]);
    expect(await readEntry(view, after)).toEqual(asha);
    expect([u16(headers, find(headers, 0x02014b50) + 6), u16(headers, find(headers, 0x02014b50) + 30)]).toEqual([20, 0]); // big.bin has none
  }, 60_000);

  it('an entry of 0xFFFFFFFF bytes carries ZIP64 sizes in both headers and an 8-byte data descriptor', async () => {
    const m = strToU8('{}');
    const { view, headers } = write([['big.bin', MAX32], ['manifest.json', m]]);
    expect([u16(headers, 4), u32(headers, 18), u32(headers, 22), u16(headers, 28), u16(headers, 37)]).toEqual([45, MAX32, MAX32, 20, 1]);
    expect([u32(headers, 57), u32(headers, 65), u32(headers, 73)]).toEqual([0x08074b50, MAX32, MAX32]); // the descriptor
    const [big, manifest] = await readCentralDirectory(view);
    expect([big, manifest]).toMatchObject([{ size: MAX32, compressedSize: MAX32, localOffset: 0 }, { localOffset: 57 + MAX32 + 24 }]);
    expect(await readEntry(view, manifest)).toEqual(m);
  }, 60_000);
});

describe('[BL-388] a ZIP64 archive reads back (forced on a small file)', () => {
  const manifest = manifestOf(FILES);
  const manifestBytes = strToU8(JSON.stringify(manifest));
  const mSha = sha256Hex(manifestBytes);
  const CLEAN: [string, Uint8Array][] = [...FILES, ['manifest.json', manifestBytes], ['manifest.sha256', strToU8(`${mSha}  manifest.json\n`)]];
  const zip = write(CLEAN, { forceZip64: true }).headers;

  it('fflate unzips it and verify.ts checks it clean', async () => {
    expect(u16(zip, find(zip, 0x06054b50) + 10)).toBe(0xffff);
    const files = unzipSync(zip);
    for (const [name, data] of CLEAN) expect(files[name], name).toEqual(data);
    expect(await verifyExport(access(zip), manifest, mSha, sha)).toEqual({ ok: true, problems: [], problemCounts: {}, filesChecked: 6 });
  });

  it('still flags missing, extra and duplicate files', async () => {
    const twice = write([...CLEAN, FILES[1]], { forceZip64: true }).headers;
    const r = await verifyExport(access(twice), manifestOf([...FILES.slice(1), ['letters/Asha/gone.txt', strToU8('x')]]), mSha, sha);
    expect(r.problemCounts).toEqual({ extra: 1, duplicate: 1, missing: 1 }); // README.txt, the name twice, gone.txt
  });

  it('rejects a locator that points nowhere, counts that disagree, and a missing ZIP64 record or extra', async () => {
    const broken = async (edit: (b: Uint8Array, locator: number) => void) => {
      const b = zip.slice();
      edit(b, find(b, 0x07064b50));
      return (await verifyExport(access(b), manifest, mSha, sha)).problems;
    };
    expect(await broken((b, l) => (b[l + 8] += 1))).toEqual(['format:bad_zip64']);
    expect(await broken((b, l) => (b[u32(b, l + 8) + 32] += 1))).toEqual(['format:bad_zip64']); // total entries
    expect(await broken((b, l) => b.fill(0, l, l + 4))).toEqual(['format:bad_zip64']);
    expect(await broken((b) => (b[find(b, 0x02014b50) + 46 + 'README.txt'.length] = 2))).toEqual(['format:bad_zip64']);
  });
});
