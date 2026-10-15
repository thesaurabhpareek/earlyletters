/**
 * Escrow public keys the app seals book keys to (F08 6.5 G, WP-F08-B8).
 *
 * Empty until the founder's offline key ceremony (runbook K1 to K7 in
 * docs/ops/BACKUP_RUNBOOK.md, S05) prints the public keys; while empty,
 * backup fails closed: no book key is ever wrapped, nothing uploads.
 * `production` keys ship only in testflight and production builds, `drill`
 * keys only in development and preview (F16-REQ-030). Current and next
 * version both ship so a rotation needs no release first (F08 6.5 G4).
 */
export interface EscrowPublicKey {
  /** `escrow_key_version` on the server. */
  version: number;
  /** Raw 32-byte X25519 public key, standard base64 (44 characters). */
  publicKey: string;
  environment: 'production' | 'drill';
}

export const ESCROW_PUBLIC_KEYS: readonly EscrowPublicKey[] = [
  // TODO(founder, WP-F08-B8): paste the ceremony output, for example:
  // { version: 1, publicKey: '<44 base64 characters>', environment: 'production' },
];

/** The newest key for an environment, or null (fail closed). */
export function currentEscrowKey(environment: EscrowPublicKey['environment'], keys: readonly EscrowPublicKey[] = ESCROW_PUBLIC_KEYS): EscrowPublicKey | null {
  let best: EscrowPublicKey | null = null;
  for (const k of keys) if (k.environment === environment && /^[A-Za-z0-9+/]{43}=$/.test(k.publicKey) && (!best || k.version > best.version)) best = k;
  return best;
}
