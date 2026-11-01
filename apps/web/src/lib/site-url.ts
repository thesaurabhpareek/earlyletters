/**
 * The public address of this deployment, for link previews (Open Graph and Twitter image URLs must be absolute).
 * NEXT_PUBLIC_SITE_URL wins when set. On Vercel production it is the project's production domain, which becomes
 * earlyletters.com once that domain is attached and the site redeployed; on previews it is the preview address.
 * Anywhere else (local builds) it falls back to https://earlyletters.com.
 */
export const FALLBACK_SITE_URL = 'https://earlyletters.com';

export function resolveSiteUrl(env: Readonly<Record<string, string | undefined>>): URL {
  const host = (value: string | undefined) => value?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      // A malformed value is ignored rather than breaking the build.
    }
  }
  if (env.VERCEL_ENV === 'production' && host(env.VERCEL_PROJECT_PRODUCTION_URL)) return new URL(`https://${host(env.VERCEL_PROJECT_PRODUCTION_URL)}`);
  if (env.VERCEL_ENV === 'preview' && host(env.VERCEL_URL)) return new URL(`https://${host(env.VERCEL_URL)}`);
  return new URL(FALLBACK_SITE_URL);
}
