/**
 * [BL-456] Plaintext-leak scan for the backup tests: what leaves the phone must hold no part of the recording.
 *
 * A bare 4-byte match is no signature (any 4 bytes of ciphertext equal them by chance, about 1 in 2^32 per byte).
 * A 16-byte shingle cannot match by chance (2^-128). The scan takes shingles at a dense stride across the WHOLE
 * take, not only its header or one fixed window, and looks for each at every offset of the haystack.
 *
 * Coverage: a stride of 48 puts at least one whole shingle inside any run of 64 plaintext bytes (64 - 16 + 1 = 49
 * start offsets), so a 64-byte piece planted anywhere in the take is found. The first and the last window are always
 * included. Not covered: a leak shorter than 64 bytes that falls between shingles, and (as before) a leak that
 * straddles two request bodies, because the callers scan one body at a time.
 */
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

/** The first plaintext offset whose shingle appears anywhere in `hay`, or null when the haystack is clean. */
export function firstLeak(hay: Uint8Array, plain: Uint8Array): number | null {
  const h = Buffer.from(hay.buffer, hay.byteOffset, hay.byteLength);
  const p = Buffer.from(plain.buffer, plain.byteOffset, plain.byteLength);
  for (const at of shingleOffsets(p.length)) {
    if (h.includes(p.subarray(at, at + SHINGLE))) return at;
  }
  return null;
}

/** Message for a failed scan: the offset only, never the bytes. */
export const leakNote = (what: string, at: number | null) =>
  at === null ? `${what} carries no part of a recording` : `${what} carries part of a recording (plaintext offset ${at})`;
