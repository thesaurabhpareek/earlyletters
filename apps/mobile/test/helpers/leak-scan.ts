/**
 * [BL-456] Plaintext-leak scan for the backup tests: what leaves the phone must hold no part of the recording.
 *
 * A bare 4-byte match is no signature (any 4 bytes of ciphertext equal them by chance, about 1 in 2^32 per byte).
 * A 16-byte shingle cannot match by chance (2^-128). The scan takes shingles at a dense stride across the WHOLE
 * take, not only its header or one fixed window, and looks for each at every offset of the haystack.
 *
 * Coverage: a stride of 48 puts at least one whole shingle inside any run of 64 plaintext bytes (64 - 16 + 1 = 49
 * start offsets), so a 64-byte piece planted anywhere in the take is found. The first and the last window are always
 * included.
 *
 * [BL-1417] Encoded copies: a recording written as base64 (standard or URL-safe, at any of the three byte alignments),
 * hex (either case, either alignment) or a decimal list of bytes (`[1,2,3]`, with or without spaces, as
 * `JSON.stringify(Array.from(bytes))` or a Buffer's JSON writes it) is decoded back to bytes and scanned like the
 * raw bytes; a decoded run is decoded once more, for a copy written twice over (base64 of hex, tus metadata around
 * a base64 value). [BL-1418] The URL, each header and each RPC's arguments of every request are scanned the same way.
 * [BL-1419] Bodies are scanned one by one AND across every join of consecutive bodies (JOIN_WINDOW bytes either side),
 * in recorded order and again per kind.
 *
 * Not covered: a leak shorter than 64 bytes that falls between shingles; a piece that is split over bodies and wider
 * than 2 x JOIN_WINDOW; a leak written in another way (compressed, XOR-ed, split into words, a custom alphabet, a
 * decimal list with other separators, or three or more layers of encoding).
 */
import { createHash } from 'node:crypto';

/** Bytes either side of a join of two consecutive bodies that the join scan reads (a 64-byte piece is at most 256 chars as a decimal list). */
export const JOIN_WINDOW = 512;
export const SHINGLE = 16;
export const STRIDE = 48;

/** Start offsets of the shingles for a take of `length` bytes: 0, every STRIDE, and the last full window. */
export function shingleOffsets(length: number, stride = STRIDE, width = SHINGLE): number[] {
  if (length < width) return [];
  const last = length - width;
  const out: number[] = [];
  for (let at = 0; at < last; at += stride) out.push(at);
  out.push(last);
  return out;
}

/** Every SHINGLE-byte window of `hay`, as latin1 strings: one pass over the haystack, then one lookup per shingle. */
export function windowIndex(hay: Uint8Array): Set<string> {
  const text = Buffer.from(hay.buffer, hay.byteOffset, hay.byteLength).toString('latin1');
  const out = new Set<string>();
  for (let i = 0; i + SHINGLE <= text.length; i++) out.add(text.slice(i, i + SHINGLE));
  return out;
}

const shingleCache = new WeakMap<Uint8Array, Array<[number, string]>>();
/** The shingles of a take as [offset, latin1 text], built once per take. */
function shinglesOf(plain: Uint8Array): Array<[number, string]> {
  let c = shingleCache.get(plain);
  if (!c) {
    const p = Buffer.from(plain.buffer, plain.byteOffset, plain.byteLength);
    c = shingleOffsets(p.length).map((at): [number, string] => [at, p.toString('latin1', at, at + SHINGLE)]);
    shingleCache.set(plain, c);
  }
  return c;
}

/** The first plaintext offset whose shingle is in an index built by `windowIndex`, or null. */
export function firstIndexedLeak(index: Set<string>, plain: Uint8Array): number | null {
  if (index.size === 0) return null;
  for (const [at, text] of shinglesOf(plain)) if (index.has(text)) return at;
  return null;
}

/** The first plaintext offset whose shingle appears raw in `hay`, or null. No decoding. */
export function firstRawLeak(hay: Uint8Array, plain: Uint8Array): number | null {
  return firstIndexedLeak(windowIndex(hay), plain);
}

const B64_RUN = /[A-Za-z0-9+/_-]{22,}/g;
const HEX_RUN = /[0-9a-fA-F]{32,}/g;
const LIST_RUN = /\d{1,3}(?:,\s?\d{1,3}){15,}/g;

/** Every byte string hiding in `hay` as base64, hex or a decimal list (one layer), as bytes. */
export function decodedViews(hay: Uint8Array): Buffer[] {
  const text = Buffer.from(hay.buffer, hay.byteOffset, hay.byteLength).toString('latin1');
  const out: Buffer[] = [];
  for (const m of text.matchAll(B64_RUN)) for (let c = 0; c < 4; c++) out.push(Buffer.from(m[0].slice(c), 'base64'));
  for (const m of text.matchAll(HEX_RUN)) for (let c = 0; c < 2; c++) out.push(Buffer.from(m[0].slice(c), 'hex'));
  for (const m of text.matchAll(LIST_RUN)) {
    let chunk: number[] = [];
    const flush = () => { if (chunk.length) out.push(Buffer.from(chunk)); chunk = []; };
    for (const n of m[0].split(',')) {
      const v = Number(n.trim());
      if (v > 255) flush(); else chunk.push(v);
    }
    flush();
  }
  return out;
}

/** `hay` itself and what it decodes to, up to `depth` layers. */
export function leakViews(hay: Uint8Array, depth = 2): Buffer[] {
  const top = Buffer.from(hay.buffer, hay.byteOffset, hay.byteLength);
  if (depth <= 0) return [top];
  return [top, ...decodedViews(top).flatMap((v) => leakViews(v, depth - 1))];
}

/** The first plaintext offset whose shingle appears in `hay`, raw or as base64, hex or a byte list; null when clean. */
export function firstLeak(hay: Uint8Array, plain: Uint8Array): number | null {
  for (const v of leakViews(hay)) {
    const at = firstRawLeak(v, plain);
    if (at !== null) return at;
  }
  return null;
}

/** Message for a failed scan: the offset only, never the bytes. */
export const leakNote = (what: string, at: number | null) =>
  at === null ? `${what} carries no part of a recording` : `${what} carries part of a recording (plaintext offset ${at})`;

/** What a fake backend records of one request (BL-1418): `body` as before, plus the URL, headers and RPC arguments. */
export interface ScannedRequest {
  kind: string;
  body: Buffer;
  url?: string | null;
  headers?: Record<string, string> | null;
  args?: unknown;
}

/** The parts of one request that are scanned: [label, bytes]. */
export function requestFields(req: ScannedRequest): Array<[string, Buffer]> {
  const out: Array<[string, Buffer]> = [[`${req.kind} body`, req.body]];
  if (req.url) out.push([`${req.kind} url`, Buffer.from(req.url, 'latin1')]);
  for (const [k, v] of Object.entries(req.headers ?? {})) out.push([`${req.kind} header ${k}`, Buffer.from(String(v), 'latin1')]);
  if (req.args !== undefined && req.args !== null) out.push([`${req.kind} arguments`, Buffer.from(JSON.stringify(req.args))]);
  return out;
}

/** The windows across every join of consecutive bodies, ordered by position: [label, bytes]. */
export function joinWindows(bodies: Buffer[], window = JOIN_WINDOW): Array<[string, Buffer]> {
  const total = Buffer.concat(bodies);
  const out: Array<[string, Buffer]> = [];
  let at = 0;
  for (let i = 0; i < bodies.length - 1; i++) {
    at += bodies[i].length;
    out.push([`bodies ${i} and ${i + 1}`, total.subarray(Math.max(0, at - window), at + window)]);
  }
  return out;
}

/**
 * Every failed check over a list of recorded requests, as notes (offsets only, never bytes). Empty means clean.
 * One call for the e2e loop and the queue test, so a scan that narrows (first body only) is one edit, and tested.
 */
export function scanRequests(requests: ScannedRequest[], plains: Uint8Array[]): string[] {
  const notes: string[] = [];
  const check = (label: string, bytes: Buffer) => {
    const views = leakViews(bytes);
    const indexes = views.map(windowIndex);
    for (const plain of plains) {
      for (const ix of indexes) {
        const at = firstIndexedLeak(ix, plain);
        if (at !== null) { notes.push(leakNote(label, at)); break; }
      }
      const hex = createHash('sha256').update(plain).digest('hex');
      if (views.some((v) => v.includes(Buffer.from(hex)) || v.includes(Buffer.from(hex, 'hex')))) notes.push(`${label} carries a recording's hash`);
    }
  };
  for (const req of requests) for (const [label, bytes] of requestFields(req)) check(label, bytes);
  const streams: Array<[string, Buffer[]]> = [['all', requests.map((r) => r.body)]];
  for (const kind of new Set(requests.map((r) => r.kind))) streams.push([kind, requests.filter((r) => r.kind === kind).map((r) => r.body)]);
  for (const [name, bodies] of streams) for (const [label, bytes] of joinWindows(bodies)) check(`${name} ${label}`, bytes);
  return notes;
}
