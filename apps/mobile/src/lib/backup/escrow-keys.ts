/**
 * Escrow public keys this build trusts (F08 6.5 G1 and G4). Empty until the
 * founder's key ceremony (WP-F08-B8) makes the key pair offline and S07 adds
 * the public key to `packages/api/src/escrow-keys.ts`; this list then
 * re-exports that one (request to S07 in the PR). While it is empty the app
 * fails closed: backup cannot be turned on and the Settings row says it is not
 * available yet. Staging uses the drill-only key pair the ceremony also makes.
 */
import { currentEscrowKey, parseEscrowKeys } from '@scribe/api/server';
import type { EscrowPublicKey } from './contract';

export const BUNDLED_ESCROW_KEYS: readonly EscrowPublicKey[] = [
  // TODO(S07, WP-F08-B8): { version: 1, publicKey: '<base64 of 32 raw X25519 bytes>' },
];

/** The highest escrow key version a build takes from the variable (one to three digits, as #150 read it). */
export const MAX_ENV_ESCROW_KEY_VERSION = 999;

/**
 * The keys a build trusts: the bundled ones, plus the current key of `EXPO_PUBLIC_ESCROW_KEYS` (the
 * staging drill key) only in a development-profile build (`APP_ENV === 'development'`: internal
 * distribution, the `.dev` bundle id). Preview, TestFlight (store-distributed, also `preview`) and
 * production builds ignore it, so a drill key can never seal families' book keys.
 *
 * The variable is the JSON list keygen prints, in the server's format: packages/api's
 * `parseEscrowKeys` reads it (one environment, exactly one current key, versions unique), and a list
 * it refuses is ignored whole. Only the current key is taken, since new wraps use it and the phone
 * wraps to the highest version it trusts: a next key listed beside it (`current: false`, runbook R2)
 * waits for the release that makes it current. It never shadows a bundled version, and a version
 * above MAX_ENV_ESCROW_KEY_VERSION is ignored.
 */
export function escrowKeysFor(appEnv: string, raw: string | undefined, bundled: readonly EscrowPublicKey[] = BUNDLED_ESCROW_KEYS): readonly EscrowPublicKey[] {
  if (appEnv !== 'development') return bundled;
  const k = currentEscrowKey(parseEscrowKeys(raw?.trim()));
  if (!k || k.version > MAX_ENV_ESCROW_KEY_VERSION || bundled.some((b) => b.version === k.version)) return bundled;
  return [...bundled, { version: k.version, publicKey: k.publicKey }];
}
