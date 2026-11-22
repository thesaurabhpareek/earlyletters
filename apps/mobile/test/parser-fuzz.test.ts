/// <reference types="node" />
/**
 * BL-1411: the ADTS reader (lib/capture/adts.ts) and the SCRB header parser
 * (lib/backup/format.ts parseHeader) survive a seeded fuzz run on malformed
 * input. Media threat model P5, gap G-6 (pure TypeScript half), device row D-10.
 *
 * Offline and deterministic: every case comes from a fixed-seed PRNG
 * (mulberry32), so a failure names a seed and a case number and replays
 * byte for byte. No file, no network, no real audio: the "recordings" are
 * synthetic frames of random payload bytes behind well-formed headers, and the
 * ids are the fictional Asha family's.
 *
 * Each case must end in a clean result or one named refusal, never an unnamed
 * error. The decoder half of G-6 (ImageIO, whisper.rn) is BL-1412, on a Mac.
 */
import { describe, expect, it } from 'vitest';
import { ADTS_MAX_FRAME_BYTES, ADTS_SAMPLE_RATES, adtsLengthEvidence, breaksInside, scanAdts, type AdtsScan } from '../src/lib/capture/adts';
import { BackupFormatError, HEADER_LEN, KEY_BLOCK_LEN, SEGMENT_SIZE, STREAM_HEADER_LEN, WRAP_LEN, encodeKeyBlock, encodeStreamHeader, parseHeader, replaceKeyBlock } from '../src/lib/backup/format';

/** Cases per parser. The row's proposal, not a requirement. */
const CASES = 10_000;
const ADTS_SEED = 0xad75_0001;
const SCRB_SEED = 0x5c2b_0001;
const BUDGET_MS = 30_000;

/** mulberry32: a small seeded generator, so a corpus never depends on Math.random. */
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)); // inclusive
  const bytes = (n: number) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = int(0, 255);
    return out;
  };
  return { next, int, bytes, pick: <T>(xs: readonly T[]): T => xs[int(0, xs.length - 1)] };
}
type Rng = ReturnType<typeof rng>;

const join = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

// ---------------------------------------------------------------- ADTS corpus

interface Stream {
  bytes: Uint8Array;
  sri: number;
  channels: number;
  prot: boolean;
  /** Raw data blocks the unmutated stream holds. */
  blocks: number;
}

function adtsFrame(r: Rng, sri: number, channels: number, prot: boolean, length: number, blocks: number): Uint8Array {
  const f = r.bytes(length);
  f[0] = 0xff;
  f[1] = 0xf0 | (r.int(0, 1) << 3) | (prot ? 1 : 0);
  f[2] = (r.int(0, 3) << 6) | (sri << 2) | ((channels >> 2) & 1);
  f[3] = ((channels & 3) << 6) | (r.int(0, 15) << 2) | ((length >> 11) & 3);
  f[4] = (length >> 3) & 0xff;
  f[5] = ((length & 7) << 5) | 0x1f;
  f[6] = 0xfc | (blocks - 1);
  return f;
}

function adtsStream(r: Rng, opts: { frames?: number; sri?: number; channels?: number } = {}): Stream {
  const sri = opts.sri ?? r.int(0, 12);
  const channels = opts.channels ?? r.pick([1, 1, 1, 2, 0, 7]);
  const prot = r.int(0, 3) !== 0;
  const n = opts.frames ?? r.int(1, 24);
  const frames: Uint8Array[] = [];
  let blocks = 0;
  for (let i = 0; i < n; i++) {
    const b = r.int(0, 9) === 0 ? r.int(1, 4) : 1;
    frames.push(adtsFrame(r, sri, channels, prot, r.int(prot ? 7 : 9, 400), b));
    blocks += b;
  }
  return { bytes: join(...frames), sri, channels, prot, blocks };
}

function flipBits(r: Rng, b: Uint8Array, count: number): Uint8Array {
  const out = b.slice();
  if (out.length === 0) return out;
  for (let i = 0; i < count; i++) out[r.int(0, out.length - 1)] ^= 1 << r.int(0, 7);
  return out;
}

/** One mutation, chosen by the generator. Kinds mirror the row: truncated, bit-flipped, oversize-length, trailing bytes. */
function mutateAdts(r: Rng, s: Stream, b: Uint8Array): Uint8Array {
  switch (r.int(0, 9)) {
    case 0: // truncated anywhere
      return b.slice(0, r.int(0, b.length));
    case 1: // truncated inside a header
      return b.slice(0, Math.max(0, b.length - r.int(1, 8)));
    case 2: // a few flipped bits
      return flipBits(r, b, r.int(1, 16));
    case 3: {
      // oversize or random frame_length on a frame header at the start or a random offset
      const out = b.slice();
      const at = r.int(0, 1) === 0 ? 0 : r.int(0, Math.max(0, out.length - 7));
      if (at + 6 < out.length) {
        const len = r.pick([0, 1, 6, 7, 8, 779, 780, ADTS_MAX_FRAME_BYTES, r.int(0, ADTS_MAX_FRAME_BYTES)]);
        out[at + 3] = (out[at + 3] & 0xfc) | ((len >> 11) & 3);
        out[at + 4] = (len >> 3) & 0xff;
        out[at + 5] = (out[at + 5] & 0x1f) | ((len & 7) << 5);
      }
      return out;
    }
    case 4: // short trailing bytes
      return join(b, r.bytes(r.int(1, 200)));
    case 5: // trailing sync-like fragment: a header prefix, as a kill leaves
      return join(b, adtsFrame(r, s.sri, s.channels, s.prot, 9, 1).slice(0, r.int(1, 9)));
    case 6: {
      // more than one frame can hold after the stream, ending in this stream's own whole frames:
      // the outer bound (ADTS_MAX_FRAME_BYTES) must refuse it before the chain search
      const junk = r.int(0, 1) === 0 ? r.bytes(r.int(ADTS_MAX_FRAME_BYTES + 1, ADTS_MAX_FRAME_BYTES + 3000)) : new Uint8Array(r.int(ADTS_MAX_FRAME_BYTES + 1, ADTS_MAX_FRAME_BYTES + 3000)).fill(0xff);
      junk[0] = 0x00; // never start a frame by accident; the planted chain below is the only way in
      const chain = adtsStream(r, { frames: r.int(2, 4), sri: s.sri, channels: s.channels }).bytes;
      return join(b, junk, chain);
    }
    case 7: // a frame of this stream cut in the middle, then more of the stream
      return join(b.slice(0, r.int(0, b.length)), adtsStream(r, { frames: r.int(1, 4), sri: s.sri, channels: s.channels }).bytes);
    case 8: // dense sync words: worst case for the chain search
      return join(b, new Uint8Array(r.int(1, ADTS_MAX_FRAME_BYTES)).fill(0xff));
    default: // zeroed or repeated block
      return join(b, new Uint8Array(r.int(1, 64)));
  }
}

function adtsCase(r: Rng): { bytes: Uint8Array; stream: Stream; mutated: boolean } {
  const kind = r.int(0, 19);
  if (kind === 0) return { bytes: r.bytes(r.int(0, 300)), stream: adtsStream(r), mutated: true }; // not audio at all
  if (kind === 1) {
    // sync-shaped noise
    const b = r.bytes(r.int(2, 300));
    b[0] = 0xff;
    b[1] = 0xf0 | (b[1] & 0x0f);
    return { bytes: b, stream: adtsStream(r), mutated: true };
  }
  const stream = adtsStream(r);
  if (kind <= 3) return { bytes: stream.bytes, stream, mutated: false };
  let bytes = stream.bytes;
  for (let i = r.int(1, 3); i > 0; i--) bytes = mutateAdts(r, stream, bytes);
  return { bytes, stream, mutated: true };
}

function checkScan(scan: AdtsScan, bytes: Uint8Array): void {
  expect(Number.isInteger(scan.frames) && scan.frames >= 0).toBe(true);
  expect(scan.totalBytes).toBe(bytes.length);
  expect(scan.wholeBytes).toBeGreaterThanOrEqual(0);
  expect(scan.wholeBytes + scan.tailBytes).toBe(bytes.length);
  expect(ADTS_SAMPLE_RATES as readonly number[]).toContain(scan.sampleRate);
  expect(scan.channels).toBeGreaterThanOrEqual(0);
  expect(scan.channels).toBeLessThanOrEqual(7);
  expect(['none', 'cut', 'break']).toContain(scan.tail);
  expect(scan.tail === 'none').toBe(scan.tailBytes === 0);
  expect(Number.isInteger(scan.framesAfterBreak) && scan.framesAfterBreak >= 0).toBe(true);
  // frames after a break are only ever reported with a break tail
  if (scan.framesAfterBreak > 0) expect(scan.tail).toBe('break');
  // the outer bound: past one frame's worth of tail nothing is searched and nothing is counted
  if (scan.tailBytes > ADTS_MAX_FRAME_BYTES) {
    expect(scan.framesAfterBreak).toBe(0);
    expect(scan.tail).toBe('break');
  }
  expect(breaksInside(scan)).toBe(scan.tailBytes > ADTS_MAX_FRAME_BYTES);
  // a kill cuts off at most one frame
  if (scan.tail === 'cut') expect(scan.tailBytes).toBeLessThan(ADTS_MAX_FRAME_BYTES);
  const ev = adtsLengthEvidence(scan);
  expect(Number.isFinite(ev.countedMs) && ev.countedMs >= 0).toBe(true);
  expect(Number.isFinite(ev.minDecodedMs) && ev.minDecodedMs >= 0).toBe(true);
  expect(ev.minDecodedMs).toBeLessThanOrEqual(ev.countedMs);
}

describe('BL-1411 ADTS reader: seeded fuzz', () => {
  it(`${CASES} cases return null or a consistent scan and never throw`, { timeout: BUDGET_MS }, () => {
    const r = rng(ADTS_SEED);
    const seen = { nullScan: 0, none: 0, cut: 0, break: 0, afterBreak: 0, overCap: 0 };
    for (let i = 0; i < CASES; i++) {
      const c = adtsCase(r);
      let scan: AdtsScan | null;
      try {
        scan = scanAdts(c.bytes);
      } catch (e) {
        throw new Error(`scanAdts threw on seed ${ADTS_SEED} case ${i} (${c.bytes.length} bytes): ${(e as Error).name}`);
      }
      if (scan === null) {
        seen.nullScan += 1;
        continue;
      }
      try {
        checkScan(scan, c.bytes);
      } catch (e) {
        throw new Error(`scan invariant broke on seed ${ADTS_SEED} case ${i} (${c.bytes.length} bytes): ${(e as Error).message}`);
      }
      seen[scan.tail] += 1;
      if (scan.framesAfterBreak > 0) seen.afterBreak += 1;
      if (scan.tailBytes > ADTS_MAX_FRAME_BYTES) seen.overCap += 1;
    }
    // the corpus is not vacuous: every outcome class, and the over-cap path, is reached
    expect(seen.nullScan).toBeGreaterThan(0);
    expect(seen.none).toBeGreaterThan(0);
    expect(seen.cut).toBeGreaterThan(0);
    expect(seen.break).toBeGreaterThan(0);
    expect(seen.afterBreak).toBeGreaterThan(0);
    expect(seen.overCap).toBeGreaterThan(100);
  });

  it('an unmutated stream is read exactly: every block counted, no tail', () => {
    const r = rng(ADTS_SEED ^ 0xffff);
    for (let i = 0; i < 2000; i++) {
      const s = adtsStream(r);
      const scan = scanAdts(s.bytes);
      expect(scan).not.toBeNull();
      expect(scan!.frames).toBe(s.blocks);
      expect(scan!.tail).toBe('none');
      expect(scan!.wholeBytes).toBe(s.bytes.length);
      expect(scan!.sampleRate).toBe(ADTS_SAMPLE_RATES[s.sri]);
    }
  });

  it('every prefix of a valid stream is a clean result, a kill cut when it ends inside a frame', () => {
    const r = rng(ADTS_SEED ^ 0xaaaa);
    const s = adtsStream(r, { frames: 6, sri: 8, channels: 1 });
    for (let n = 0; n <= s.bytes.length; n++) {
      const scan = scanAdts(s.bytes.subarray(0, n));
      if (n < 7) {
        expect(scan).toBeNull();
        continue;
      }
      expect(scan).not.toBeNull();
      checkScan(scan!, s.bytes.subarray(0, n));
      expect(scan!.tail === 'none' || scan!.tail === 'cut').toBe(true);
    }
  });

  it('the corpus is the same on every run (fixed seed)', () => {
    const digest = () => {
      const r = rng(ADTS_SEED);
      let h = 0;
      for (let i = 0; i < 500; i++) for (const b of adtsCase(r).bytes) h = (Math.imul(h, 31) + b) >>> 0;
      return h;
    };
    expect(digest()).toBe(digest());
  });
});

// ---------------------------------------------------------------- SCRB corpus

/** Fictional ids (the Asha family), never a real account. */
const ASHA_ENTRY = '01928c3e-5a2b-7c3d-8e4f-000000000001';
const ASHA_AUTHOR = 'a5a5a5a5-0000-4000-8000-000000000001';

const REFUSALS = ['bad_magic', 'bad_version', 'bad_header', 'bad_segment', 'truncated', 'trailing', 'length'];

function scrbHeader(r: Rng): Uint8Array {
  const stream = encodeStreamHeader({ entryId: ASHA_ENTRY, authorId: ASHA_AUTHOR, noncePrefix: r.bytes(7), segmentSize: SEGMENT_SIZE });
  const keyBlock = encodeKeyBlock({ keyVersion: r.int(1, 0xffffffff), wrapped: r.bytes(WRAP_LEN) });
  return join(stream, keyBlock);
}

function mutateScrb(r: Rng, b: Uint8Array): Uint8Array {
  switch (r.int(0, 9)) {
    case 0: // truncated anywhere
      return b.slice(0, r.int(0, b.length));
    case 1: // one byte short, the most likely real cut
      return b.slice(0, b.length - 1);
    case 2:
      return flipBits(r, b, r.int(1, 12));
    case 3: {
      // oversize segment size
      const out = b.slice();
      out.set(r.pick([[0xff, 0xff, 0xff, 0xff], [0x7f, 0xff, 0xff, 0xff], [0x80, 0, 0, 0], [0, 0, 0, 0], [0, 1, 0, 1]].map((x) => new Uint8Array(x))), 5);
      return out;
    }
    case 4: {
      // key version at the edges
      const out = b.slice();
      out.set(r.pick([[0, 0, 0, 0], [0, 0, 0, 1], [0xff, 0xff, 0xff, 0xff], [0x80, 0, 0, 0]].map((x) => new Uint8Array(x))), STREAM_HEADER_LEN);
      return out;
    }
    case 5: // trailing bytes (the parser reads the header only; the rest is the body)
      return join(b, r.bytes(r.int(1, 4096)));
    case 6: {
      // magic or version replaced
      const out = b.slice();
      out[r.int(0, 4)] = r.int(0, 255);
      return out;
    }
    case 7: // a header-length buffer of one repeated byte
      return new Uint8Array(r.int(0, 300)).fill(r.pick([0x00, 0xff, 0x53]));
    case 8: // pure noise of header size
      return r.bytes(r.int(HEADER_LEN - 2, HEADER_LEN + 2));
    default: {
      // a view into a larger buffer: byteOffset must never leak into the result
      const pre = r.bytes(r.int(1, 32));
      return join(pre, b, r.bytes(r.int(0, 32))).subarray(pre.length, pre.length + b.length);
    }
  }
}

/** The rule, written independently of the parser: what a header must hold to be accepted. */
function expectedCode(b: Uint8Array): string | null {
  if (b.length < HEADER_LEN) return 'truncated';
  if (b[0] !== 0x53 || b[1] !== 0x43 || b[2] !== 0x52 || b[3] !== 0x42) return 'bad_magic';
  if (b[4] !== 1) return 'bad_version';
  const size = (b[5] * 2 ** 24) + (b[6] << 16) + (b[7] << 8) + b[8];
  if (size !== SEGMENT_SIZE) return 'bad_header';
  const kv = (b[48] * 2 ** 24) + (b[49] << 16) + (b[50] << 8) + b[51];
  if (kv < 1) return 'bad_header';
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('BL-1411 SCRB header parser: seeded fuzz', () => {
  it(`${CASES} cases return a header or one named refusal, and agree with the rule written out`, { timeout: BUDGET_MS }, () => {
    const r = rng(SCRB_SEED);
    const seen: Record<string, number> = { ok: 0 };
    for (let i = 0; i < CASES; i++) {
      const valid = scrbHeader(r);
      const input = r.int(0, 9) === 0 ? valid : mutateScrb(r, valid);
      const want = expectedCode(input);
      let outcome = 'ok';
      try {
        const h = parseHeader(input);
        expect(want, 'parser accepted what the rule refuses').toBeNull();
        expect(h.segmentSize).toBe(SEGMENT_SIZE);
        expect(Number.isInteger(h.keyVersion) && h.keyVersion >= 1 && h.keyVersion <= 0xffffffff).toBe(true);
        expect(h.entryId).toMatch(UUID);
        expect(h.authorId).toMatch(UUID);
        expect(h.noncePrefix.length).toBe(7);
        expect(h.wrapped.length).toBe(WRAP_LEN);
        expect(h.streamBytes.length).toBe(STREAM_HEADER_LEN);
        expect(STREAM_HEADER_LEN + KEY_BLOCK_LEN).toBe(HEADER_LEN);
        // the result holds copies: changing the input afterwards cannot change it
        const before = h.wrapped[0];
        input[STREAM_HEADER_LEN + 4] ^= 0xff;
        expect(h.wrapped[0]).toBe(before);
        // a header that parses can have its key block replaced, and still parses
        const moved = replaceKeyBlock(input.slice(), { keyVersion: 2, wrapped: new Uint8Array(WRAP_LEN) });
        expect(moved.length).toBe(HEADER_LEN);
        expect(parseHeader(moved).keyVersion).toBe(2);
      } catch (e) {
        if (!(e instanceof BackupFormatError)) {
          throw new Error(`parseHeader failed on seed ${SCRB_SEED} case ${i} (${input.length} bytes): ${(e as Error).name}: ${(e as Error).message}`);
        }
        expect(REFUSALS, `unnamed code on case ${i}`).toContain(e.code);
        expect(e.message).toBe(`backup_format_${e.code}`); // code only: no bytes, ids or paths
        expect(e.code, `case ${i}`).toBe(want);
        outcome = e.code;
      }
      seen[outcome] = (seen[outcome] ?? 0) + 1;
    }
    // the corpus reaches every refusal the header can give, and the clean path
    for (const k of ['ok', 'truncated', 'bad_magic', 'bad_version', 'bad_header']) expect(seen[k], k).toBeGreaterThan(0);
  });

  it('every prefix of a valid header shorter than the header is refused as truncated', () => {
    const h = scrbHeader(rng(SCRB_SEED ^ 0xffff));
    for (let n = 0; n < HEADER_LEN; n++) {
      expect(() => parseHeader(h.subarray(0, n))).toThrowError(new BackupFormatError('truncated'));
    }
    expect(parseHeader(h).entryId).toBe(ASHA_ENTRY);
  });

  it('replaceKeyBlock refuses a header that does not parse, with a named code', () => {
    const r = rng(SCRB_SEED ^ 0xaaaa);
    for (let i = 0; i < 1000; i++) {
      const bad = mutateScrb(r, scrbHeader(r));
      if (expectedCode(bad) === null) continue;
      try {
        replaceKeyBlock(bad, { keyVersion: 1, wrapped: new Uint8Array(WRAP_LEN) });
        throw new Error('accepted');
      } catch (e) {
        expect(e).toBeInstanceOf(BackupFormatError);
      }
    }
  });

  it('the corpus is the same on every run (fixed seed)', () => {
    const digest = () => {
      const r = rng(SCRB_SEED);
      let h = 0;
      for (let i = 0; i < 500; i++) for (const b of mutateScrb(r, scrbHeader(r))) h = (Math.imul(h, 31) + b) >>> 0;
      return h;
    };
    expect(digest()).toBe(digest());
  });
});
