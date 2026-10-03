/**
 * Owner: E1 (web platform). Apple App Site Association: lets iOS open https://earlyletters.com links in the app.
 *
 * Built from APPLE_TEAM_ID and IOS_BUNDLE_ID. Both must be set, or the file answers 404 (never a half-made file).
 * Static: the file is made at `next build`, so set both in the Vercel project before the production build.
 * Apple requires application/json, HTTPS, and no redirect. Next adds no redirect for this path.
 *
 * Paths come from docs/tdd/04-security-identity.md 3.1.6: only /a (email sign-in link), /i (invites),
 * /j (join) and /r (return link). Tokens travel in the URL fragment, which is not part of path matching.
 * Each path is listed bare and with sub-paths, because the PRDs show both /j#t=... and /i/<token>.
 */
export const dynamic = 'force-static';

const paths = ['/a', '/i', '/j', '/r'] as const;

const TEAM_ID = /^[A-Z0-9]{10}$/;
const BUNDLE_ID = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const bundleId = process.env.IOS_BUNDLE_ID?.trim();

  if (!teamId || !bundleId) {
    if (teamId || bundleId) {
      console.warn('[aasa] Set both APPLE_TEAM_ID and IOS_BUNDLE_ID. Serving 404 until then.');
    }
    return new Response(null, { status: 404 });
  }
  if (!TEAM_ID.test(teamId) || !BUNDLE_ID.test(bundleId)) {
    console.warn('[aasa] APPLE_TEAM_ID must be 10 letters or digits and IOS_BUNDLE_ID a bundle id. Serving 404.');
    return new Response(null, { status: 404 });
  }

  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [`${teamId}.${bundleId}`],
          components: paths.flatMap((path) => [{ '/': path }, { '/': `${path}/*` }]),
        },
      ],
    },
  });
}
