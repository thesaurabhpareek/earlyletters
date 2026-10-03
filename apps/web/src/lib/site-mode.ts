/**
 * Which home page a deployment shows.
 *
 * SITE_MODE=coming-soon  holding page
 * SITE_MODE=film         the scroll film
 * unset                  holding page on Vercel Production, the film everywhere else (previews, local)
 *
 * The default keeps the unapproved film off production even when the variable was never set in Vercel.
 * Read at build time (the home page is static); changing SITE_MODE needs a redeploy.
 */
export type SiteMode = 'coming-soon' | 'film';

export function resolveSiteMode(env: Readonly<Record<string, string | undefined>>): SiteMode {
  const mode = env.SITE_MODE?.trim();
  if (mode === 'coming-soon' || mode === 'film') return mode;
  return env.VERCEL_ENV === 'production' ? 'coming-soon' : 'film';
}
