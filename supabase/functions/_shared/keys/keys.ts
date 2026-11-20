/**
 * Which Supabase API key an Edge Function uses (BL-594).
 *
 * Supabase injects the new keys as JSON dictionaries, `SUPABASE_SECRET_KEYS` and `SUPABASE_PUBLISHABLE_KEYS`, read
 * by their `default` entry; `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` carry the legacy keys, which
 * Supabase deprecates by the end of 2026 (supabase.com/docs/guides/functions/secrets and /api/api-keys, read
 * 1 Nov 2026). The new keys are preferred, the legacy ones are the fallback, so a project with either set works.
 *
 * The new keys are not JWTs: they travel on the `apikey` header only, never as `Authorization: Bearer`. A legacy key
 * is a JWT and keeps both headers, as before. Never log a key, never put one in a reply.
 */

export type EnvGetter = (name: string) => string | undefined;

/** The `default` entry of a key dictionary, or null when the variable is missing, malformed or empty. */
function fromDictionary(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const value = (parsed as Record<string, unknown>).default;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

const legacy = (raw: string | undefined): string | null => (raw && raw.trim() ? raw.trim() : null);

/** The key that bypasses row-level security. Server only. */
export function secretKeyOf(env: EnvGetter): string | null {
  return fromDictionary(env('SUPABASE_SECRET_KEYS')) ?? legacy(env('SUPABASE_SERVICE_ROLE_KEY'));
}

/** The key a signed-in person's calls go through (row-level security applies). */
export function publishableKeyOf(env: EnvGetter): string | null {
  return fromDictionary(env('SUPABASE_PUBLISHABLE_KEYS')) ?? legacy(env('SUPABASE_ANON_KEY'));
}

/** A legacy key is a JWT (three base64url parts). The new keys start with `sb_` and are not. */
export function isJwtKey(key: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key) && !key.startsWith('sb_');
}

/**
 * Headers for a call made as the service itself (no person). A legacy key also goes as the bearer token, as it
 * always did; a new secret key goes on `apikey` only.
 */
export function serviceHeaders(key: string): Record<string, string> {
  return isJwtKey(key) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}
