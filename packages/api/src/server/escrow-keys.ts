/**
 * Escrow public keys the app seals book keys to (F08 6.5 G, WP-F08-B8).
 *
 * How keys reach a build (apps/mobile/src/lib/backup/escrow-keys.ts, ADR
 * 0024 rule 4): preview, TestFlight and production builds trust only the
 * keys bundled in the app's source, `BUNDLED_ESCROW_KEYS` (public keys are
 * not secrets), and ignore `EXPO_PUBLIC_ESCROW_KEYS`. Only a
 * development-profile build reads that variable (JSON, parsed here), for
 * the staging drill key. Until the founder's offline ceremony (runbook K1 to
 * K7, S05) the bundled list is empty and backup fails closed: no book key
 * is wrapped, nothing uploads.
 *
 * Exactly one key per build is `current`: new wraps use it, and it must be
 * listed in the server's `app.escrow_key_versions`. A rotation needs an app
 * release first (G4, runbook R2): the next key is added to
 * `BUNDLED_ESCROW_KEYS` beside the current one in that release, and new
 * wraps use it once the release is out, since the phone wraps to the highest
 * version it trusts.
 */
import * as v from 'valibot';

export const EscrowPublicKeySchema = v.strictObject({
  /** `escrow_key_version` on the server. */
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  /** Raw 32-byte X25519 public key, standard base64 (44 characters). */
  publicKey: v.pipe(v.string(), v.regex(/^[A-Za-z0-9+/]{43}=$/)),
  environment: v.picklist(['production', 'drill']),
  current: v.boolean(),
});
export type EscrowPublicKey = v.InferOutput<typeof EscrowPublicKeySchema>;

/**
 * Parses the build's key list. Fails closed (empty) on anything malformed,
 * on keys of more than one environment, or unless exactly one is current.
 */
export function parseEscrowKeys(raw: string | null | undefined): EscrowPublicKey[] {
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const r = v.safeParse(v.array(EscrowPublicKeySchema), json);
  if (!r.success || r.output.length === 0) return [];
  if (new Set(r.output.map((k) => k.environment)).size !== 1) return [];
  if (r.output.filter((k) => k.current).length !== 1) return [];
  if (new Set(r.output.map((k) => k.version)).size !== r.output.length) return [];
  return r.output;
}

/** The key new wraps use, or null (fail closed). */
export function currentEscrowKey(keys: readonly EscrowPublicKey[]): EscrowPublicKey | null {
  return keys.find((k) => k.current) ?? null;
}
