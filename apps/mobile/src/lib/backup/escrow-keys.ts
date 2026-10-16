/**
 * Escrow public keys this build trusts (F08 6.5 G1 and G4). Empty until the
 * founder's key ceremony (WP-F08-B8) makes the key pair offline and S07 adds
 * the public key to `packages/api/src/escrow-keys.ts`; this list then
 * re-exports that one (request to S07 in the PR). While it is empty the app
 * fails closed: backup cannot be turned on and the Settings row says it is not
 * available yet. Staging uses the drill-only key pair the ceremony also makes.
 */
import type { EscrowPublicKey } from './contract';

export const BUNDLED_ESCROW_KEYS: readonly EscrowPublicKey[] = [
  // TODO(S07, WP-F08-B8): { version: 1, publicKey: '<base64 of 32 raw X25519 bytes>' },
];
