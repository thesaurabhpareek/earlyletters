/** Byte helpers with no imports (the escrow folder imports nothing from outside itself). */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeBase64(u: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u.length; i += 3) {
    const n = (u[i] << 16) | ((u[i + 1] ?? 0) << 8) | (u[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < u.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < u.length ? B64[n & 63] : '=');
  }
  return s;
}

export function decodeBase64(s: string): Uint8Array {
  const t = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(t)) throw new Error('bad base64');
  const clean = t.replace(/=+$/, '');
  if (clean.length % 4 === 1) throw new Error('bad base64');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) | ((clean[i + 2] ? B64.indexOf(clean[i + 2]) : 0) << 6)
      | (clean[i + 3] ? B64.indexOf(clean[i + 3]) : 0);
    out[o++] = (n >> 16) & 0xff;
    if (clean[i + 2]) out[o++] = (n >> 8) & 0xff;
    if (clean[i + 3]) out[o++] = n & 0xff;
  }
  return out.subarray(0, o);
}

export const encodeBase64Url = (u: Uint8Array): string => encodeBase64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const toHex = (u: Uint8Array): string => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');

export function fromHex(s: string): Uint8Array {
  if (!/^([0-9a-f]{2})*$/i.test(s)) throw new Error('bad hex');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export const randomBytes = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));

export async function sha256(u: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer));
}

/** Constant-time comparison of two strings of the same expected length. */
export function sameString(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const decodeBase64Url = (s: string): Uint8Array => decodeBase64(s);
