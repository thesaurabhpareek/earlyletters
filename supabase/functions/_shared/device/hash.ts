/**
 * The device hash, in one place (file 09 section 4): HMAC-SHA-256 over a fixed prefix, the profile id and the device id, cut to
 * 16 bytes. Used by new-device-email (the sender) and new-device-fill (the app's call), so the two can never drift apart.
 * The key is the Edge Function secret DEVICE_HASH_KEY. No key, or one under 32 characters, throws: never an unkeyed hash.
 */
export const MIN_KEY_CHARS = 32;
const enc = new TextEncoder();

export const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
/** PostgREST bytea text. */
export const byteaOf = (b: Uint8Array): string => `\\x${toHex(b)}`;

export async function hashDevice(key: string, profileId: string, deviceId: string): Promise<Uint8Array> {
  if (typeof key !== 'string' || key.length < MIN_KEY_CHARS) throw Object.assign(new Error('key'), { code: 'config' });
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', k, enc.encode(`earlyletters.device.v1|${profileId}|${deviceId}`));
  return new Uint8Array(mac).slice(0, 16);
}
