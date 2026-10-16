/**
 * Escrow public keys the app seals book keys to (F08 6.5 G, WP-F08-B8).
 *
 * No key lives in source. Each build gets only its own environment's keys
 * from the EAS profile, as `EXPO_PUBLIC_ESCROW_KEYS` (JSON, S20 sets it per
 * profile: production keys in testflight and production, the drill key in
 * development and preview), so a preview bundle can never carry the
 * production key (F16-REQ-030; S20's CI check reads the bundle). Until the
 * founder's offline ceremony (runbook K1 to K7, S05) the variable is unset
 * and backup fails closed: no book key is wrapped, nothing uploads.
 *
 * Exactly one key per build is `current`: new wraps use it, and it must be
 * listed in the server's `app.escrow_key_versions`. The next key ships
 * beside it (not current) so a rotation needs no release first (G4).
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
