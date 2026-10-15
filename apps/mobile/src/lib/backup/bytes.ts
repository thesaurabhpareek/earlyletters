/**
 * Byte helpers for the backup format (ADR 0023). Pure TypeScript: runs on
 * Hermes and in Node tests. Base64 and hex come from @scribe/api so the app
 * keeps one implementation of each.
 */
import { base64ToBytes, bytesToBase64, bytesToHex, utf8ToBytes } from '@scribe/api';

export { bytesToBase64, bytesToHex, utf8ToBytes };

/** Base64 to bytes; throws on anything that is not canonical base64 (a wire value we did not write). */
export function b64(s: string): Uint8Array {
  const out = base64ToBytes(s);
  if (!out) throw new Error('backup_bad_base64');
  return out;
}

export function concat(...parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function u32be(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) throw new Error('backup_u32_range');
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

export function readU32be(b: Uint8Array, at: number): number {
  return ((b[at] << 24) >>> 0) + (b[at + 1] << 16) + (b[at + 2] << 8) + b[at + 3];
}

/** Unsigned 64-bit big-endian for lengths up to 2^53 (a recording is at most tens of MB). */
export function u64be(n: number): Uint8Array {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('backup_u64_range');
  const hi = Math.floor(n / 0x100000000);
  return concat(u32be(hi), u32be(n - hi * 0x100000000));
}

export function readU64be(b: Uint8Array, at: number): number {
  return readU32be(b, at) * 0x100000000 + readU32be(b, at + 4);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

/** A UUID string as its 16 bytes (the header carries ids in binary). */
export function uuidToBytes(id: string): Uint8Array {
  if (!UUID_RE.test(id)) throw new Error('backup_bad_uuid');
  return hexToBytes(id.replace(/-/g, ''));
}

export function bytesToUuid(b: Uint8Array): string {
  if (b.length !== 16) throw new Error('backup_bad_uuid');
  const h = bytesToHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function hexToBytes(h: string): Uint8Array {
  if (h.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(h)) throw new Error('backup_bad_hex');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Constant-time for equal lengths. Used for hashes and key checks, never for secrets in a hot loop. */
export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

/** Overwrites a buffer that held key material, as soon as it is no longer needed. */
export function wipe(b: Uint8Array | null | undefined): void {
  if (b) b.fill(0);
}
