/**
 * The two secrets-of-the-day of the new-device email: the device hash and the "Not you?" token (file 09 sections 4 and 5).
 *
 * Device hash: HMAC-SHA-256 over a fixed prefix, the profile id and the id, cut to 16 bytes. The key is the Edge Function
 * secret DEVICE_HASH_KEY, read only in this function. DEVICE_HASH_KEY_NEXT (overlap rotation) gives a second hash of the
 * same input; no key, or a short one, throws: nothing is ever hashed with an empty key.
 *
 * Token: 32 bytes from crypto.getRandomValues. Only its SHA-256 goes to the database. The plain token is returned once,
 * for the link, and nowhere else.
 */
export const MIN_KEY_CHARS = 32;
const enc = new TextEncoder();

export const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
/** PostgREST bytea text. */
export const byteaOf = (b: Uint8Array): string => `\\x${toHex(b)}`;
export const b64url = (b: Uint8Array): string => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function hashDevice(key: string, profileId: string, deviceId: string): Promise<Uint8Array> {
  if (typeof key !== 'string' || key.length < MIN_KEY_CHARS) throw Object.assign(new Error('key'), { code: 'config' });
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', k, enc.encode(`earlyletters.device.v1|${profileId}|${deviceId}`));
  return new Uint8Array(mac).slice(0, 16);
}

/** [current, next?] hashes of one id, for overlap rotation. */
export async function hashDeviceAll(keys: { current: string; next?: string }, profileId: string, deviceId: string): Promise<Uint8Array[]> {
  const out = [await hashDevice(keys.current, profileId, deviceId)];
  if (keys.next) out.push(await hashDevice(keys.next, profileId, deviceId));
  return out;
}

export interface MintedToken {
  /** Only for the link. Never logged, never returned from the handler. */
  plain: string;
  hash: Uint8Array;
}

export async function newToken(): Promise<MintedToken> {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', raw));
  return { plain: b64url(raw), hash };
}
