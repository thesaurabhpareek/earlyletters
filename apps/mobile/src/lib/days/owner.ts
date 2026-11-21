/** The owner key of the days file: first 16 hex of SHA-256 of the user id (design 13 section 4.2; OQ-D4), 'local' with no user. */
import * as Crypto from 'expo-crypto';
import { LOCAL_OWNER } from './store.logic';

export async function daysOwnerKey(userId: string | null): Promise<string> {
  if (userId === null) return LOCAL_OWNER;
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new TextEncoder().encode(userId));
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}
