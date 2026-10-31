/**
 * Where email links point, and which website pages they need (TPL-06, email validation of 31 Oct 2026).
 *
 * The website (`apps/web`) lives on `main` and is built separately, so this file is the email side of the route
 * contract. `SITE_ROUTES.built` lists the pages that exist on `main` today (read from `apps/web/src/app` at
 * 0082764c). `SITE_ROUTES.needed` lists every page an email links to that is not built yet, with the email that
 * needs it and when. A test (test/links.test.ts) fails when an email or a fixture links to a path in neither list,
 * or when a `needed` entry is no longer used, so this list cannot drift from the templates.
 *
 * Senders take their defaults from `DEFAULT_LINKS` (Node: this module; Deno: `generated/resend.ts` carries the same
 * values), never by typing a URL.
 */
import { brand } from '@scribe/brand';

const origin = brand.web.origin;

export const SITE_ROUTES = {
  /** Pages on earlyletters.com today (`main`). A link to any of these works. */
  built: ['/', '/privacy', '/terms', '/auth/callback', '/auth/confirm', '/j', '/unsubscribe'],
  /**
   * Pages emails link to that the website does not have yet: path, the emails that use it, and when it is needed.
   * Build 1 (D-121) sends no email at all, so "build 2" means the first release with server features.
   */
  needed: {
    '/open': {
      emails: 'appUrl in 14 emails (welcome, deletion receipts, co-parent, book deletion and others)',
      when: 'build 2. A fallback page (open the app, or get it on the App Store) plus `/open` in the AASA paths so the app opens directly',
    },
    '/stop': {
      emails: 'backup-restore-requested (stopUrl, token after #; the page posts it, F21)',
      when: 'before owner backup ships (D-121 step c)',
    },
    '/subscription-terms': {
      emails: 'trial-started, plus-started (subscriptionTermsUrl)',
      when: 'before the reminder emails ship (D-121 step b); or point subscriptionTermsUrl at /terms if the legal lane folds them in (SUB-10)',
    },
    '/delete-account/confirm': {
      emails: 'deletion-confirm (Ops only; not sent until the page exists, CATALOG section 8)',
      when: 'before the D-042 email route takes requests from people who cannot open the app',
    },
    '/open/export': {
      emails: 'export-ready (exportUrl)',
      when: 'v1.1 (server export, BL-309)',
    },
  },
} as const;

export type NeededPath = keyof typeof SITE_ROUTES.needed;

/** Hosts other than ours an email may link to. */
export const EXTERNAL_LINKS = {
  /** Apple's own subscription page: manage or cancel Plus (TPL-03). */
  appleSubscriptions: 'https://apps.apple.com/account/subscriptions',
} as const;

/** The link every sender uses for these placeholders unless it has a reason not to. */
export const DEFAULT_LINKS = {
  /** No /contact page exists, so Help writes to the support mailbox, the same place a reply goes. */
  helpUrl: brand.support.mailto,
  privacyUrl: brand.web.privacy,
  /** Universal link; needs the `/open` page and AASA path (SITE_ROUTES.needed). */
  appUrl: `${brand.web.universalLinkBase}/open`,
  manageUrl: EXTERNAL_LINKS.appleSubscriptions,
  subscriptionTermsUrl: `${origin}/subscription-terms`,
} as const;

export type LinkStatus = 'built' | 'needed' | 'external' | 'mailto' | 'unknown';

/** Classify one URL against the route contract. A path matches a route exactly or as a prefix followed by `/`. */
export function linkStatus(url: string): LinkStatus {
  if (url.startsWith('mailto:')) return 'mailto';
  if ((Object.values(EXTERNAL_LINKS) as string[]).includes(url)) return 'external';
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return 'unknown';
  }
  if (u.origin !== origin) return 'unknown';
  const path = u.pathname.replace(/\/$/, '') || '/';
  const matches = (route: string) => path === route || (route !== '/' && path.startsWith(`${route}/`));
  if ((SITE_ROUTES.built as readonly string[]).some((r) => path === r)) return 'built';
  const needed = Object.keys(SITE_ROUTES.needed).sort((a, b) => b.length - a.length);
  return needed.some(matches) ? 'needed' : 'unknown';
}

/** The `needed` route a URL falls under, if any (longest match). */
export function neededRoute(url: string): NeededPath | undefined {
  let path: string;
  try {
    const u = new URL(url);
    if (u.origin !== origin) return undefined;
    path = u.pathname.replace(/\/$/, '') || '/';
  } catch {
    return undefined;
  }
  return (Object.keys(SITE_ROUTES.needed) as NeededPath[])
    .sort((a, b) => b.length - a.length)
    .find((r) => path === r || path.startsWith(`${r}/`));
}
