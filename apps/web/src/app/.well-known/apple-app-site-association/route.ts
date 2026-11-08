/**
 * Owner: S20 (web). Apple App Site Association: lets iOS open https://earlyletters.com links in the app
 * (PRD V2 F02 A-REQ-022, F21-REQ-024; WP-F02-10).
 *
 * Built from two Vercel environment variables, both needed or the file answers 404 (never a half-made file):
 *   APPLE_TEAM_ID   the 10-character Team ID (Apple Developer > Membership details)
 *   IOS_BUNDLE_ID   the production bundle id, for example com.earlyletters.scribe (never the .preview id)
 * It serves the production app and the `.preview` app (the TestFlight alpha builds,
 * docs/release/TESTFLIGHT.md), and nothing else. Static: the file is made at `next build`, so set both in the
 * Vercel project before the production build. Apple requires application/json, HTTPS and no redirect; Next adds
 * no redirect for this path.
 *
 * Paths, and only these (A-REQ-022). Every token travels in the URL fragment, which is not part of path matching
 * and never reaches a server (B-NFR-002):
 *   /auth/confirm   the sign-in and confirm-your-email link (F02 6.3)
 *   /auth/callback  the same link as the app and email templates on `develop` still write it; remove with the
 *                   page of the same name once they use /auth/confirm
 *   /j              co-parent invites (https://earlyletters.com/j#t=<token>, PRD V2 F11; app/j/page.tsx). The
 *                   earlier /i/<token> form put the token in the path; the app no longer writes or accepts it, so
 *                   it is not listed and no token path ever opens the app.
 * A route file may export only route fields, so the lists stay private; route.test.ts reads them through GET.
 */
export const dynamic = 'force-static';

/** Every path the app opens, in the order the file lists them. */
const APP_LINK_PATHS = ['/auth/confirm', '/auth/confirm/', '/auth/callback', '/auth/callback/', '/j', '/j/'];

/** Suffixes of the app ids served: production, then the TestFlight alpha builds. */
const SERVED_SUFFIXES = ['', '.preview'];

const TEAM_ID = /^[A-Z0-9]{10}$/;
const BUNDLE_ID = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;
/** A suffixed id in IOS_BUNDLE_ID would serve ".preview.preview": refuse it instead. */
const SUFFIXED = /\.(preview|dev)$/;

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const bundleId = process.env.IOS_BUNDLE_ID?.trim();

  if (!teamId || !bundleId) {
    if (teamId || bundleId) {
      console.warn('[aasa] Set both APPLE_TEAM_ID and IOS_BUNDLE_ID. Serving 404 until then.');
    } else if (process.env.VERCEL_ENV === 'production') {
      // A production build that forgot both would otherwise ship a silent 404: links then never open the app.
      console.warn(
        '[aasa] APPLE_TEAM_ID and IOS_BUNDLE_ID are both unset in this production build. Serving 404, so links will not open the app.',
      );
    }
    return new Response(null, { status: 404 });
  }
  if (!TEAM_ID.test(teamId) || !BUNDLE_ID.test(bundleId) || SUFFIXED.test(bundleId)) {
    console.warn(
      '[aasa] APPLE_TEAM_ID must be 10 capital letters or digits and IOS_BUNDLE_ID the production bundle id (no .preview or .dev). Serving 404.',
    );
    return new Response(null, { status: 404 });
  }

  return Response.json({
    applinks: {
      details: [
        {
          appIDs: SERVED_SUFFIXES.map((suffix) => `${teamId}.${bundleId}${suffix}`),
          components: APP_LINK_PATHS.map((path) => ({ '/': path })),
        },
      ],
    },
  });
}
