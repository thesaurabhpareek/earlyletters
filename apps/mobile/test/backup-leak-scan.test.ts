/**
 * [BL-456] The leak scan sees the whole take. Planted-plaintext positive controls (head, middle, tail, past one
 * 64 KiB part), a clean negative control, and one mutant per rule of the scan. Fixture bytes are random and fake.
 */
import { describe, expect, it } from 'vitest';
import { SEGMENT_SIZE } from '../src/lib/backup/format';
import { fakeM4a } from './helpers/backup-node';
import { JOIN_WINDOW, SHINGLE, STRIDE, firstLeak, decodedViews, firstRawLeak, joinWindows, leakNote, scanRequests, wrappedBase64Runs, shingleOffsets, type ScannedRequest } from './helpers/leak-scan';
import { createHash, randomBytes } from 'node:crypto';
import vm from 'node:vm';

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

// -- [BL-1417] encoded copies

/** The three written forms of a piece, as the bytes of a haystack. */
const FORMS: Array<[string, (b: Uint8Array) => Buffer]> = [
  ['base64', (b) => Buffer.from(Buffer.from(b).toString('base64'))],
  ['base64url', (b) => Buffer.from(Buffer.from(b).toString('base64url'))],
  ['hex', (b) => Buffer.from(Buffer.from(b).toString('hex'))],
  ['HEX', (b) => Buffer.from(Buffer.from(b).toString('hex').toUpperCase())],
  ['a JSON byte list', (b) => Buffer.from(JSON.stringify(Array.from(b)))],
  ['a JSON byte list with spaces', (b) => Buffer.from(JSON.stringify(Array.from(b)).replace(/,/g, ', '))],
  ['a Buffer written as JSON', (b) => Buffer.from(JSON.stringify(Buffer.from(b)))],
];

/** Random bytes with `text` written at `at`, so the copy sits in the middle of ciphertext. */
const around = (text: Buffer, at = 700, size = 4096) => plant(text, at, size);

describe('[BL-1417] a recording written as base64, hex or a JSON byte list is found', () => {
  const plain = fakeM4a(TAKE);
  const piece = plain.subarray(100, 164);

  for (const [name, enc] of FORMS) {
    it(`[BL-1417] bytes 100..164 as ${name} turn the scan red, the raw-only scan stays blind`, () => {
      const hay = around(enc(piece));
      expect(firstRawLeak(hay, plain), 'the old scan').toBeNull();
      expect(firstLeak(hay, plain)).not.toBeNull();
    });
  }

  for (const off of [0, 1, 2, 3]) {
    it(`[BL-1417] base64 at byte alignment ${off} (the copy starts ${off} byte(s) into a 3-byte group) is found`, () => {
      const wide = Buffer.concat([randomBytes(off), piece]);
      const text = Buffer.from(wide.toString('base64'));
      expect(firstLeak(around(text), plain)).not.toBeNull();
    });
  }

  it('[BL-1417] a copy written twice over (base64 of hex) is found', () => {
    const twice = Buffer.from(Buffer.from(piece).toString('hex')).toString('base64');
    expect(firstLeak(around(Buffer.from(twice)), plain)).not.toBeNull();
  });

  it('[BL-1417] random bytes with ordinary base64, hex and list text in them are clean (decoding is not over-eager)', () => {
    const noise = [randomBytes(64).toString('base64'), randomBytes(32).toString('hex'), JSON.stringify(Array.from(randomBytes(40)))].join(' ');
    expect(firstLeak(around(Buffer.from(noise), 300, 8192), plain)).toBeNull();
  });

  it('[BL-1417] a list with one number above 255 is cut there, and the part that holds the copy is still found', () => {
    const list = `[${Array.from(piece).join(',')},999,1,2]`;
    expect(firstLeak(around(Buffer.from(list)), plain)).not.toBeNull();
  });

  it('[BL-1417] the failure note for an encoded copy prints an offset and never bytes or the encoded text', () => {
    for (const [, enc] of FORMS) {
      const text = enc(piece);
      const notes = scanRequests([{ kind: 'begin', body: around(text) }], [plain]);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatch(/plaintext offset \d+\)$/);
      expect(notes[0]).not.toContain(text.toString('latin1').slice(0, 20));
      expect(notes[0]).not.toContain(piece.subarray(0, 16).toString('latin1'));
    }
  });

  it('[BL-1417] mutant: the scan without the encoded step passes every planted form (this is the gap the row closes)', () => {
    const rawOnly = (b: Buffer) => firstRawLeak(b, plain);
    for (const [name, enc] of FORMS) expect(rawOnly(around(enc(piece))), name).toBeNull();
  });
});

// -- [BL-1476] separated hex, 0x hex, percent-encoding, wrapped base64
const hexPairs = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0'));
const wrap = (text: string, width: number, eol: string) => text.match(new RegExp(`.{1,${width}}`, 'g'))!.join(eol);
const FORMS_1476: Array<[string, (b: Uint8Array) => Buffer]> = [
  ['hex with space separators', (b) => Buffer.from(hexPairs(b).join(' '))],
  ['hex with colon separators (upper case)', (b) => Buffer.from(hexPairs(b).join(':').toUpperCase())],
  ['hex with a 0x prefix on each byte, comma and space', (b) => Buffer.from(hexPairs(b).map((h) => `0x${h}`).join(', '))],
  ['percent-encoded bytes (every byte)', (b) => Buffer.from(hexPairs(b).map((h) => `%${h}`).join(''))],
  ['percent-encoded bytes (plain characters left as they are, as a URL encoder writes them)', (b) => Buffer.from(Array.from(b, (x) => (/[A-Za-z0-9]/.test(String.fromCharCode(x)) ? String.fromCharCode(x) : `%${x.toString(16).padStart(2, '0')}`)).join(''))],
  ['base64 wrapped at 76 characters with CRLF', (b) => Buffer.from(wrap(Buffer.from(b).toString('base64'), 76, '\r\n'))],
  ['base64 wrapped at 64 characters with LF', (b) => Buffer.from(wrap(Buffer.from(b).toString('base64'), 64, '\n'))],
  ['base64 wrapped at 20 characters, line breaks written as JSON escapes', (b) => Buffer.from(JSON.stringify({ blob: wrap(Buffer.from(b).toString('base64'), 20, '\n') }))],
];

describe('[BL-1476] a recording written as separated hex, 0x hex, percent-encoded or wrapped base64 is found', () => {
  const plain = fakeM4a(TAKE);
  const piece = plain.subarray(100, 164);

  for (const [name, enc] of FORMS_1476) {
    it(`[BL-1476] bytes 100..164 as ${name} turn the scan red, the raw-only scan stays blind`, () => {
      const hay = around(enc(piece));
      expect(firstRawLeak(hay, plain), 'the old scan').toBeNull();
      expect(firstLeak(hay, plain)).not.toBeNull();
    });

    it(`[BL-1476] the failure note for ${name} prints an offset and never bytes or the encoded text`, () => {
      const text = enc(piece);
      const notes = scanRequests([{ kind: 'begin', body: around(text) }], [plain]);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatch(/plaintext offset \d+\)$/);
      expect(notes[0]).not.toContain(text.toString('latin1').slice(0, 20));
      expect(notes[0]).not.toContain(piece.subarray(0, 16).toString('latin1'));
    });
  }

  it('[BL-1476] the same forms in a request header and in an RPC argument are found', () => {
    const text = FORMS_1476[0][1](piece).toString();
    expect(scanRequests([{ kind: 'rpc', body: Buffer.alloc(0), headers: { 'x-note': text } }], [plain])).toHaveLength(1);
    const b64 = wrap(piece.toString('base64'), 20, '\n');
    expect(scanRequests([{ kind: 'rpc', body: Buffer.alloc(0), args: { note: b64 } }], [plain])).toHaveLength(1);
  });

  it('[BL-1476] random bytes written in the same forms are clean (decoding is not over-eager)', () => {
    const noise = randomBytes(64);
    const noisy = Buffer.concat(FORMS_1476.map(([, enc]) => Buffer.concat([enc(noise), Buffer.from('\n')])));
    expect(firstLeak(around(noisy, 300, 16384), plain)).toBeNull();
    expect(scanRequests([{ kind: 'begin', body: around(noisy, 300, 16384) }], [plain])).toEqual([]);
  });

  it('[BL-1476] ordinary percent text and line-broken prose are clean', () => {
    const text = Buffer.from('https://example.test/a%20b%2Fc?x=1%262\nplain words on a line\nand another line of words here\n');
    expect(firstLeak(around(text, 200, 4096), plain)).toBeNull();
  });

  it('[BL-1476] what stays open stays open: XOR-ed bytes and a piece under 16 bytes are not found (named in the header)', () => {
    const xored = Buffer.from(piece.map((x) => x ^ 0x5a));
    expect(firstLeak(around(xored), plain), 'XOR-ed').toBeNull();
    expect(firstLeak(around(Buffer.from(plain.subarray(100, 115))), plain), '15 bytes').toBeNull();
  });
});

describe('[BL-1476] wrapped base64 is scanned in linear time', () => {
  const plain = fakeM4a(TAKE);
  const big = randomBytes(192 * 1024); // 256 KB as base64
  const BIG_B64 = big.toString('base64');
  /** The first version of the wrapped-base64 regex, kept only to prove the timing tests can fail. */
  const OLD_WRAPPED = /[A-Za-z0-9+/_-]{20,}(?:(?:\r\n|\n|\r|\\r\\n|\\n|\\r)[A-Za-z0-9+/_-]{4,}={0,2})+/g;
  const timed = <T>(fn: () => T): [T, number] => { const t = performance.now(); const r = fn(); return [r, performance.now() - t]; };

  /** Median of a few runs, so one slow moment on a loaded runner does not decide a test. */
  const medianMs = (fn: () => unknown, runs = 5): number => {
    const all = Array.from({ length: runs }, () => timed(fn)[1]).sort((x, y) => x - y);
    return all[Math.floor(runs / 2)];
  };
  /**
   * Time grows linearly: 16 times the bytes costs about 16 times as long (a quadratic scan costs 256 times). The small side is
   * floored at 1 ms so timer noise on a tiny run cannot inflate the ratio. The factor of 40 sits between 16 and 256.
   */
  const expectLinear = (small: Buffer, large: Buffer, label: string) => {
    expect(large.length / small.length).toBeGreaterThanOrEqual(16);
    const ratio = medianMs(() => decodedViews(large)) / Math.max(medianMs(() => decodedViews(small)), 1);
    expect(ratio, `${label}: time at ${large.length} bytes over time at ${small.length} bytes`).toBeLessThan(40);
  };
  const SMALL = randomBytes(12 * 1024).toString('base64'); // 16 KB as base64

  // The cost of the whole firstLeak scan is the existing windowIndex, not the decoding: no wall-clock is asserted on it.
  it('[BL-1476] a 256 KB single-line base64 body decodes in well under a second, in time linear in its size', () => {
    expect(BIG_B64.length).toBeGreaterThanOrEqual(256 * 1024);
    const body = Buffer.from(BIG_B64);
    expect(medianMs(() => decodedViews(body), 3), 'decoding the views').toBeLessThan(250);
    expectLinear(Buffer.from(SMALL), body, 'single line');
    expect(firstLeak(body, plain)).toBeNull();
  });

  it('[BL-1476] a 256 KB wrapped base64 body decodes in well under a second, and a planted piece in it is still found', () => {
    const planted = Buffer.concat([big.subarray(0, 90000), plain.subarray(100, 164), big.subarray(90000)]);
    const body = Buffer.from(wrap(planted.toString('base64'), 76, '\r\n'));
    expect(medianMs(() => decodedViews(body), 3), 'decoding the views').toBeLessThan(250);
    expectLinear(Buffer.from(wrap(SMALL, 76, '\r\n')), body, 'wrapped');
    expect(firstLeak(body, plain), 'the planted piece').not.toBeNull();
    const clean = Buffer.from(wrap(BIG_B64, 76, '\n'));
    expect(medianMs(() => decodedViews(clean), 3), 'decoding the views').toBeLessThan(250);
    expect(firstLeak(clean, plain)).toBeNull();
  });

  it('[BL-1476] a long single line followed by a short one and a long line of other characters stays fast', () => {
    const text = `${BIG_B64}\nab\n${'x'.repeat(100000)}\n!!!${BIG_B64.slice(0, 100000)}`;
    const [, ms] = timed(() => wrappedBase64Runs(text));
    expect(ms).toBeLessThan(250);
  });

  it('[BL-1476] the line rules: 20+ on the first line, 4+ on the next, one break between, padding at a line end', () => {
    const l20 = 'A'.repeat(20);
    expect(wrappedBase64Runs(`${l20}\nBBBB`)).toEqual([`${l20}BBBB`]);
    expect(wrappedBase64Runs(`${l20}\r\nBBBB==\r\nCCCC`)).toEqual([`${l20}BBBB==CCCC`]);
    expect(wrappedBase64Runs(`${l20}\\nBBBB`)).toEqual([`${l20}BBBB`]);
    expect(wrappedBase64Runs(`${'A'.repeat(19)}\nBBBB`), 'first line 19').toEqual([]);
    expect(wrappedBase64Runs(`${l20}\nBBB`), 'next line 3').toEqual([]);
    expect(wrappedBase64Runs(`${l20}\n\nBBBB`), 'two breaks').toEqual([]);
    expect(wrappedBase64Runs(`${l20} BBBB`), 'a space, not a break').toEqual([]);
    expect(wrappedBase64Runs(`${l20}\n\tBBBB`), 'a tab after the break').toEqual([]);
    expect(wrappedBase64Runs(l20), 'one line').toEqual([]);
  });

  it('[BL-1476] mutant: the first regex does not finish a 256 KB line inside 250 ms, so the timing tests above can fail', () => {
    const text = BIG_B64.slice(0, 120000);
    const run = () => vm.runInNewContext('text.match(re)', { text, re: OLD_WRAPPED }, { timeout: 250 });
    expect(run).toThrow(/timed out/i);
    const [, ms] = timed(() => wrappedBase64Runs(text));
    expect(ms).toBeLessThan(250);
  });

  it('[BL-1476] padding in the middle: a 20+ line, a short padded line, then the leak line is still found (raw and JSON-escaped breaks)', () => {
    const lead = 'A'.repeat(24);
    const leak = plain.subarray(100, 164).toString('base64');
    for (const [name, brk] of [['CRLF', '\r\n'], ['LF', '\n'], ['JSON-escaped', '\\n']] as const) {
      const text = `${lead}${brk}abcd==${brk}${leak}`;
      expect(firstLeak(Buffer.from(text), plain), name).not.toBeNull();
      expect(firstLeak(Buffer.from(JSON.stringify({ k: text })), plain), `${name} in JSON`).not.toBeNull();
    }
    const wrapped = wrap(leak, 22, '\n');
    expect(firstLeak(Buffer.from(`${lead}\nabcd==\n${wrapped}`), plain), 'leak wrapped after padding').not.toBeNull();
    expect(firstLeak(Buffer.from(JSON.stringify(`${lead}\nabcd==\n${leak}`)), plain), 'JSON.stringify escapes').not.toBeNull();
  });

  it('[BL-1476] the named gap stays open: base64 wrapped with spaces or tabs, or broken inside the first 20 characters, is not found', () => {
    const b64 = plain.subarray(100, 164).toString('base64');
    expect(firstLeak(around(Buffer.from(wrap(b64, 20, ' '))), plain), 'spaces').toBeNull();
    expect(firstLeak(around(Buffer.from(wrap(b64, 20, '\t'))), plain), 'tabs').toBeNull();
    expect(firstLeak(around(Buffer.from(wrap(b64, 10, '\n'))), plain), 'break in the first 20').toBeNull();
  });
});

// -- [BL-1418] URL, headers, tus metadata, RPC arguments

describe('[BL-1418] the URL, each header, the tus metadata and an RPC argument are scanned', () => {
  const plain = fakeM4a(TAKE);
  const piece = plain.subarray(100, 164);
  const clean = (over: Partial<ScannedRequest> = {}): ScannedRequest => ({
    kind: 'tus.create',
    body: Buffer.alloc(0),
    url: 'https://fake.storage/storage/v1/upload/resumable',
    headers: { Authorization: 'Bearer asha-mama', 'Tus-Resumable': '1.0.0', 'Upload-Length': '4096', 'Upload-Metadata': `bucketName ${Buffer.from('backups').toString('base64')}` },
    ...over,
  });
  const text = (b: Uint8Array) => Buffer.from(b).toString('latin1');

  it('[BL-1418] the clean request is clean', () => {
    expect(scanRequests([clean()], [plain])).toEqual([]);
  });

  const planted: Array<[string, ScannedRequest, RegExp]> = [
    ['a header (raw bytes)', clean({ headers: { ...clean().headers, 'X-Trace': text(piece) } }), /header X-Trace carries/],
    ['a header (hex)', clean({ headers: { ...clean().headers, 'Tus-Resumable': Buffer.from(piece).toString('hex') } }), /header Tus-Resumable carries/],
    ['the URL (base64url)', clean({ url: `https://fake.storage/storage/v1/upload/resumable/${Buffer.from(piece).toString('base64url')}` }), /url carries/],
    ['the URL (raw bytes in a query)', clean({ url: `https://fake.storage/x?q=${text(piece)}` }), /url carries/],
    ['Upload-Metadata (tus wraps the value in base64)', clean({ headers: { ...clean().headers, 'Upload-Metadata': `bucketName ${Buffer.from('backups').toString('base64')},objectName ${Buffer.from(piece).toString('base64')}` } }), /header Upload-Metadata carries/],
    ['Upload-Metadata (the value is already hex, then wrapped)', clean({ headers: { ...clean().headers, 'Upload-Metadata': `objectName ${Buffer.from(Buffer.from(piece).toString('hex')).toString('base64')}` } }), /header Upload-Metadata carries/],
    ['an RPC argument (base64 string)', { kind: 'begin', body: Buffer.from('{}'), args: { entryId: 'e1', wrappedFileKey: Buffer.from(piece).toString('base64') } }, /begin arguments carries/],
    ['an RPC argument (a byte array)', { kind: 'storeKey', body: Buffer.from('{}'), args: { wrapped: Array.from(piece) } }, /storeKey arguments carries/],
    ['an RPC argument (a Buffer)', { kind: 'registerDevice', body: Buffer.from('{}'), args: { publicKey: Buffer.from(piece) } }, /registerDevice arguments carries/],
  ];
  for (const [name, req, re] of planted) {
    it(`[BL-1418] a piece in ${name} turns the scan red`, () => {
      const notes = scanRequests([clean(), req], [plain]);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.join('\n')).toMatch(re);
      expect(notes.join('\n')).not.toContain(text(piece.subarray(0, 16)));
    });
  }

  it('[BL-1418] mutant: a scan of the body alone passes every one of them (the gap the row closes)', () => {
    for (const [name, req] of planted) expect(scanRequests([{ kind: req.kind, body: req.body }], [plain]), name).toEqual([]);
  });

  it('[BL-1418] a recording hash in a header is found, in hex and raw', () => {
    const h = createHash('sha256').update(plain).digest();
    expect(scanRequests([clean({ headers: { 'X-Hash': h.toString('hex') } })], [plain]).join()).toMatch(/hash/);
    expect(scanRequests([clean({ headers: { 'X-Hash': h.toString('latin1') } })], [plain]).join()).toMatch(/hash/);
  });
});

// -- [BL-1419] a piece split over two bodies, and the loop that scans them

describe('[BL-1419] a piece split over two request bodies is found, and a loop over only the first body is caught', () => {
  const plain = fakeM4a(TAKE);
  const asRequests = (b: Buffer[]): ScannedRequest[] => b.map((body) => ({ kind: 'tus', body }));

  /** One whole shingle of the take, at an offset the stride samples (so a leak of it alone is a leak the scan promises to find). */
  const shingle = () => {
    const at = shingleOffsets(plain.length).find((o) => o >= 100)!;
    return plain.subarray(at, at + SHINGLE);
  };

  it('[BL-1419] a shingle cut 7 and 9 over two bodies is invisible body by body and found across the join', () => {
    const w = shingle();
    const x = Buffer.concat([randomBytes(2000), w.subarray(0, 7)]);
    const y = Buffer.concat([w.subarray(7), randomBytes(2000)]);
    expect(firstLeak(x, plain), 'first half alone').toBeNull();
    expect(firstLeak(y, plain), 'second half alone').toBeNull();
    const notes = scanRequests(asRequests([x, y]), [plain]);
    expect(notes.length, 'across the join').toBeGreaterThan(0);
    expect(notes.join('\n')).toMatch(/bodies 0 and 1 carries part of a recording \(plaintext offset \d+\)/);
  });

  it('[BL-1419] the same split in base64 and hex is found across the join', () => {
    const w = shingle();
    for (const [name, text] of [['base64', Buffer.from(Buffer.from(w).toString('base64'))], ['hex', Buffer.from(Buffer.from(w).toString('hex'))]] as const) {
      const cut = Math.floor(text.length / 2);
      const x = Buffer.concat([randomBytes(2000), text.subarray(0, cut)]);
      const y = Buffer.concat([text.subarray(cut), randomBytes(2000)]);
      expect(scanRequests([{ kind: 'tus', body: x }], [plain]), `${name} first half alone`).toEqual([]);
      expect(scanRequests([{ kind: 'tus', body: y }], [plain]), `${name} second half alone`).toEqual([]);
      expect(scanRequests(asRequests([x, y]), [plain]).length, name).toBeGreaterThan(0);
    }
  });

  it('[BL-1419] a piece split over three bodies, the middle one short, is found', () => {
    const w = shingle();
    const rs = asRequests([Buffer.concat([randomBytes(900), w.subarray(0, 5)]), w.subarray(5, 9), Buffer.concat([w.subarray(9), randomBytes(900)])]);
    expect(scanRequests(rs, [plain]).length).toBeGreaterThan(0);
  });

  it('[BL-1419] a piece that straddles two bodies of different kinds is found by the ordered scan, one that straddles two of one kind by the per-kind scan', () => {
    const w = shingle();
    const x = Buffer.concat([randomBytes(900), w.subarray(0, 8)]);
    const y = Buffer.concat([w.subarray(8), randomBytes(900)]);
    expect(scanRequests([{ kind: 'tus', body: x }, { kind: 'confirm', body: y }], [plain]).length).toBeGreaterThan(0);
    // an RPC between two parts of one upload: only the per-kind stream joins them
    const between: ScannedRequest = { kind: 'begin', body: randomBytes(4000) };
    const far = [{ kind: 'tus', body: x }, between, { kind: 'tus', body: y }];
    expect(scanRequests(far, [plain]).length).toBeGreaterThan(0);
  });

  it('[BL-1419] clean consecutive bodies stay clean across their joins', () => {
    expect(scanRequests(asRequests([randomBytes(3000), randomBytes(3000), randomBytes(3000)]), [plain])).toEqual([]);
  });

  it('[BL-1419] joinWindows cuts a window of JOIN_WINDOW bytes either side of each join and none at the ends', () => {
    const w = joinWindows([Buffer.alloc(2000, 1), Buffer.alloc(10, 2), Buffer.alloc(2000, 3)]);
    expect(w).toHaveLength(2);
    expect(w[0][1]).toHaveLength(2 * JOIN_WINDOW);
    expect(w[0][1][JOIN_WINDOW]).toBe(2);
    expect(w[1][1].subarray(JOIN_WINDOW - 1, JOIN_WINDOW + 1).toString('hex')).toBe('0203');
  });

  it('[BL-1419] the loop that scans only the first body passes a leak in the second: the shared loop does not', () => {
    const start = shingleOffsets(plain.length).find((o) => o >= 100)!;
    const w = plain.subarray(start, start + 64);
    const rs = asRequests([randomBytes(3000), Buffer.concat([randomBytes(500), w, randomBytes(500)]), randomBytes(3000)]);
    const firstOnly = (r: ScannedRequest[]) => scanRequests(r.slice(0, 1), [plain]);
    expect(firstOnly(rs), 'the mutant').toEqual([]);
    expect(scanRequests(rs, [plain]).length, 'the real loop').toBeGreaterThan(0);
    // and a leak in the last body of a long run
    const many = asRequests(Array.from({ length: 20 }, () => randomBytes(1500)));
    many[19] = { kind: 'tus', body: Buffer.concat([randomBytes(100), w, randomBytes(100)]) };
    expect(scanRequests(many, [plain]).length).toBeGreaterThan(0);
  });

  it('[BL-1419] mutant: scanning each body alone misses the split (the gap the row closes)', () => {
    const w = shingle();
    const rs = asRequests([Buffer.concat([randomBytes(900), w.subarray(0, 7)]), Buffer.concat([w.subarray(7), randomBytes(900)])]);
    const oneByOne = rs.flatMap((r) => scanRequests([r], [plain]));
    expect(oneByOne).toEqual([]);
    expect(scanRequests(rs, [plain]).length).toBeGreaterThan(0);
    expect(leakNote('x', null)).toContain('no part');
  });
});
