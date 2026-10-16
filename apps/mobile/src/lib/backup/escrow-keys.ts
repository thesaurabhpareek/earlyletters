/**
 * Escrow public keys this build trusts (F08 6.5 G1 and G4). Empty until the
 * founder's key ceremony (WP-F08-B8) makes the key pair offline and S07 adds
 * the public key to `packages/api/src/escrow-keys.ts`; this list then
 * re-exports that one (request to S07 in the PR). While it is empty the app
 * fails closed: backup cannot be turned on and the Settings row says it is not
 * available yet. Staging uses the drill-only key pair the ceremony also makes.
 */
import { b64 } from './bytes';
import type { EscrowPublicKey } from './contract';

export const BUNDLED_ESCROW_KEYS: readonly EscrowPublicKey[] = [
  // TODO(S07, WP-F08-B8): { version: 1, publicKey: '<base64 of 32 raw X25519 bytes>' },
];

/**
 * The keys a build trusts: the bundled ones, plus `EXPO_PUBLIC_ESCROW_KEY` (`v<version>:<base64>`,
 * the staging drill key) only in a development-profile build (`APP_ENV === 'development'`:
 * internal distribution, the `.dev` bundle id). Preview, TestFlight (store-distributed, also
 * `preview`) and production builds ignore it, so a drill key can never seal families' book keys.
 * It never shadows a bundled version, and anything malformed is ignored.
 */
export function escrowKeysFor(appEnv: string, raw: string | undefined, bundled: readonly EscrowPublicKey[] = BUNDLED_ESCROW_KEYS): readonly EscrowPublicKey[] {
  if (appEnv !== 'development') return bundled;
  const m = /^v([1-9]\d{0,2}):([A-Za-z0-9+/=]{44})$/.exec((raw ?? '').trim());
  if (!m || bundled.some((k) => k.version === Number(m[1]))) return bundled;
  try {
    if (b64(m[2]).length !== 32) return bundled;
  } catch {
    return bundled;
  }
  return [...bundled, { version: Number(m[1]), publicKey: m[2] }];
}
