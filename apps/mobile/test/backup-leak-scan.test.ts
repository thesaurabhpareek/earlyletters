/**
 * [BL-456] The leak scan sees the whole take. Planted-plaintext positive controls (head, middle, tail, past one
 * 64 KiB part), a clean negative control, and one mutant per rule of the scan. Fixture bytes are random and fake.
 */
import { describe, expect, it } from 'vitest';
import { SEGMENT_SIZE } from '../src/lib/backup/format';
import { fakeM4a } from './helpers/backup-node';
import { SHINGLE, STRIDE, firstLeak, shingleOffsets } from './helpers/leak-scan';
import { randomBytes } from 'node:crypto';

const TAKE = 3 * SEGMENT_SIZE + 777;

/** A haystack of random bytes (stands in for ciphertext) with `piece` planted at `at`. */
function plant(piece: Uint8Array, at: number, size = TAKE + 4096): Buffer {
  const hay = randomBytes(size);
  hay.set(piece, at);
  return hay;
}

describe('[BL-456] shingle offsets cover the whole take', () => {
  it('[BL-456] starts at 0, strides across the take and ends on the last full window', () => {
    const o = shingleOffsets(TAKE);
    expect(o[0]).toBe(0);
    expect(o[o.length - 1]).toBe(TAKE - SHINGLE);
    for (let i = 1; i < o.length - 1; i++) expect(o[i] - o[i - 1]).toBe(STRIDE);
    expect(o.some((x) => x > TAKE / 2), 'the tail half is sampled').toBe(true);
  });

  it('[BL-456] every 64-byte run holds at least one whole shingle (so a 64-byte plant cannot slip between them)', () => {
    const o = new Set(shingleOffsets(TAKE));
    for (let start = 0; start + 64 <= TAKE; start += 7) {
      let hit = false;
      for (let at = start; at <= start + 64 - SHINGLE; at++) if (o.has(at)) { hit = true; break; }
      expect(hit, `run at ${start}`).toBe(true);
    }
  });

  it('[BL-456] a take shorter than one shingle gives no offsets', () => {
    expect(shingleOffsets(SHINGLE - 1)).toEqual([]);
    expect(shingleOffsets(SHINGLE)).toEqual([0]);
  });
});

describe('[BL-456] positive controls: planted plaintext is found wherever it sits', () => {
  const plain = fakeM4a(TAKE);
  const cases: Array<[string, number, number]> = [
    ['head (the old check)', 0, 64],
    ['bytes 100..164', 100, 164],
    ['bytes 65536..65600 (a part boundary of the tus size here)', 65536, 65600],
    ['the middle', Math.floor(TAKE / 2), Math.floor(TAKE / 2) + 64],
    ['the last 64 bytes', TAKE - 64, TAKE],
    ['one byte before the end of a segment', SEGMENT_SIZE - 1, SEGMENT_SIZE + 63],
  ];
  for (const [name, from, to] of cases) {
    it(`[BL-456] ${name} is found`, () => {
      expect(firstLeak(plant(plain.subarray(from, to), 1234), plain)).not.toBeNull();
    });
  }

  it('[BL-456] a plant at the very end of the haystack is found (any offset of the haystack, not a fixed one)', () => {
    const piece = plain.subarray(2000, 2064);
    expect(firstLeak(plant(piece, TAKE + 4096 - 64), plain)).not.toBeNull();
  });

  it('[BL-456] the old fixed windows would have missed bytes 100..164 and 65536..65600 (the gap this closes)', () => {
    for (const [from, to] of [[100, 164], [65536, 65600]]) {
      const hay = plant(plain.subarray(from, to), 5000);
      const oldHeader = hay.includes(plain.subarray(0, 16));
      const oldWindow = hay.includes(plain.subarray(2000, 2064)) || hay.includes(plain.subarray(4096, 4160)) || hay.includes(plain.subarray(1000, 1064));
      expect(oldHeader || oldWindow, `old scans blind to ${from}`).toBe(false);
      expect(firstLeak(hay, plain), `new scan sees ${from}`).not.toBeNull();
    }
  });
});

describe('[BL-456] negative control and mutants', () => {
  const plain = fakeM4a(TAKE);

  it('[BL-456] random bytes of the same size are clean', () => {
    expect(firstLeak(randomBytes(TAKE + 4096), plain)).toBeNull();
  });

  it('[BL-456] mutant: a plant with one byte flipped in every shingle-sized run is not a leak of those runs, so a clean scan is not over-eager', () => {
    const piece = Buffer.from(plain.subarray(300, 364));
    for (let i = 7; i < piece.length; i += 8) piece[i] ^= 0xff; // every 16-byte window now holds a changed byte
    expect(firstLeak(plant(piece, 900), plain)).toBeNull();
  });

  it('[BL-456] mutant: a scan that only looks at the header and one fixed window fails the planted middle (the scan under test is not that one)', () => {
    const hay = plant(plain.subarray(40000, 40064), 777);
    const legacy = (h: Buffer) => h.includes(plain.subarray(0, 16)) || h.includes(plain.subarray(4096, 4160));
    expect(legacy(hay)).toBe(false);
    expect(firstLeak(hay, plain)).not.toBeNull();
  });

  it('[BL-456] mutant: a scan with a stride of 64 would miss a 64-byte plant that straddles two shingles, ours does not', () => {
    // A plant at an offset just after a 64-stride shingle start leaves no whole 16-byte shingle at stride 64.
    const from = 64 * 200 + 1;
    const hay = plant(plain.subarray(from, from + 63), 321);
    const coarse = (h: Buffer) => {
      for (let at = 0; at + SHINGLE <= plain.length; at += 64) if (h.includes(plain.subarray(at, at + SHINGLE))) return true;
      return false;
    };
    expect(coarse(hay)).toBe(false);
    expect(firstLeak(hay, plain)).not.toBeNull();
  });

  it('[BL-456] mutant: a scan that checks only the first 16 bytes of the haystack fails a plant deeper in', () => {
    const hay = plant(plain.subarray(50000, 50064), 60000);
    const firstBytesOnly = (h: Buffer) => firstLeak(h.subarray(0, 64), plain) !== null;
    expect(firstBytesOnly(hay)).toBe(false);
    expect(firstLeak(hay, plain)).not.toBeNull();
  });

  it('[BL-456] the failure note names an offset and never the bytes', async () => {
    const { leakNote } = await import('./helpers/leak-scan');
    const at = firstLeak(plant(plain.subarray(100, 164), 10), plain);
    const note = leakNote('tus', at);
    expect(note).toMatch(/plaintext offset \d+/);
    expect(note).not.toContain(plain.subarray(100, 116).toString('latin1'));
  });
});
