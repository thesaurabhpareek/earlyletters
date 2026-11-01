/**
 * Sign in with Apple nonce (A-NFR-009, TDD 04 3.1.1): Apple gets the SHA-256
 * of a fresh random value; Supabase gets the raw value and checks that the
 * identity token's nonce claim is its hash. A replayed token fails.
 */
import * as Crypto from 'expo-crypto';

export async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = Crypto.getRandomBytes(32);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  // digestStringAsync returns lowercase hex by default, the form Supabase compares.
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}
