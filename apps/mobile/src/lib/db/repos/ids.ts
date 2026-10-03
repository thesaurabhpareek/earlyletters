/**
 * UUIDv7 from 16 random bytes and a millisecond time (RFC 9562 5.7). Pure, so
 * it runs in tests; the app passes expo-crypto bytes (store.ts `uuidv7`).
 * Time-ordered and made on the device, so offline saves sync idempotently.
 */
export function uuidv7From(random: Uint8Array, now: number): string {
  if (random.length < 16) throw new Error('uuidv7_needs_16_bytes');
  const b = Uint8Array.from(random.subarray(0, 16));
  const ts = BigInt(Math.max(0, Math.floor(now)));
  for (let i = 0; i < 6; i++) b[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const UUIDV7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
