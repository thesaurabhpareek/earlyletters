/**
 * Owner: E3 (release). Decides whether the page shows the pre-launch email form or the App Store badge.
 * Flip to live by setting NEXT_PUBLIC_APP_STORE_URL in Vercel and redeploying (docs/ops/WEBSITE_RUNBOOK.md).
 *
 * NEXT_PUBLIC_* values are inlined into the bundle at BUILD time, so the flip needs a new deployment.
 * The value must be an official App Store product link. Anything else (a typo, a TestFlight link, a
 * look-alike host) is ignored: the site stays in prelaunch mode and the build log says why.
 */
import type { CtaPlacement } from './analytics/events';

const APP_STORE_HOST = 'apps.apple.com';

export type AppStoreUrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: 'unset' | 'invalid'; detail: string };

/**
 * Pure check, no side effects. Accepts `https://apps.apple.com/.../id<digits>` (with or without a storefront
 * and name segment, with or without Apple's pt/ct/mt/l query parameters). The fragment is dropped.
 */
export function checkAppStoreUrl(raw: string | undefined | null): AppStoreUrlCheck {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'unset', detail: 'not set' };

  const invalid = (detail: string): AppStoreUrlCheck => ({ ok: false, reason: 'invalid', detail });

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return invalid('it is not a valid URL');
  }
  if (url.protocol !== 'https:') return invalid('it must start with https://');
  if (url.hostname !== APP_STORE_HOST) return invalid(`the host must be exactly ${APP_STORE_HOST}`);
  if (url.username || url.password || url.port) return invalid('it must not contain credentials or a port');
  if (!/\/id\d+(?:\/|$)/.test(url.pathname)) return invalid('the path must contain the app id (id followed by digits)');

  url.hash = '';
  return { ok: true, url: url.toString() };
}

// Literal access so Next inlines the value into client bundles.
const rawAppStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL;
const checked = checkAppStoreUrl(rawAppStoreUrl);

// Warn once per process, on the server and at build only (never in visitors' consoles).
if (!checked.ok && checked.reason === 'invalid' && typeof window === 'undefined') {
  const flag = '__earlyLettersLaunchWarned';
  const store = globalThis as Record<string, unknown>;
  if (!store[flag]) {
    store[flag] = true;
    console.warn(
      `[launch] NEXT_PUBLIC_APP_STORE_URL is set but ignored (${checked.detail}). ` +
        `Expected https://${APP_STORE_HOST}/<storefront>/app/<name>/id<digits>. ` +
        `The site stays in prelaunch mode. Value: ${String(rawAppStoreUrl).trim().slice(0, 120)}`,
    );
  }
}

export const launch = {
  mode: (checked.ok ? 'live' : 'prelaunch') as 'live' | 'prelaunch',
  appStoreUrl: checked.ok ? checked.url : '',
};

// ---------------------------------------------------------------------------------------------
// Apple campaign parameters (App Store Connect > App Analytics > Acquisition > Campaigns)
//
// Verified in Apple's help page "Campaign links" (developer.apple.com/help/app-store-connect/
// view-app-analytics/manage-campaigns), read 2026-10-03:
//   pt = provider token. Identifies the developer account. Generated the first time a campaign link is
//        created in App Store Connect, the same for every campaign, and cannot be made by hand.
//   ct = campaign token, the campaign name. Apple's help page says up to 30 characters; its glossary says 40.
//        We keep to the stricter 30 and to letters, digits, hyphen and underscore, so it never needs escaping.
//   Example: https://apps.apple.com/app/apple-store/id123456789?pt=123456&ct=test1234&mt=8
//   mt=8 appears in Apple's example but the page does not define it. We never add it; we keep it if present.
// Apple attributes a download only when pt and ct are both present, so we add both or neither.
// ---------------------------------------------------------------------------------------------

const CAMPAIGN_TOKEN = /^[A-Za-z0-9_-]{1,30}$/;
const PROVIDER_TOKEN = /^\d{1,12}$/;

/**
 * Returns the App Store link with `pt` and `ct` set. `pt` comes from `params.pt`, else from the link itself
 * (paste the campaign link from App Store Connect and its pt is reused). Returns the link unchanged when
 * either token is missing or malformed. Pure.
 */
export function withAppleCampaign(baseUrl: string, params: { pt?: string; ct?: string }): string {
  const base = checkAppStoreUrl(baseUrl);
  if (!base.ok) return baseUrl;

  const url = new URL(base.url);
  const pt = (params.pt || url.searchParams.get('pt') || '').trim();
  const ct = (params.ct ?? '').trim();
  if (!PROVIDER_TOKEN.test(pt) || !CAMPAIGN_TOKEN.test(ct)) return base.url;

  url.searchParams.set('pt', pt);
  url.searchParams.set('ct', ct);
  return url.toString();
}

/**
 * The link for an App Store badge or button. Empty string before launch.
 * With a placement it adds the campaign token `web-<placement>` (for example web-header), the same name that
 * `track({ name: 'cta_click', placement })` uses, so App Store Connect and the site analytics line up.
 * The provider token comes from NEXT_PUBLIC_APPLE_PROVIDER_TOKEN (optional) or from the pt in the link.
 */
export function appStoreHref(placement?: CtaPlacement): string {
  if (launch.mode !== 'live') return '';
  if (!placement) return launch.appStoreUrl;
  return withAppleCampaign(launch.appStoreUrl, {
    pt: process.env.NEXT_PUBLIC_APPLE_PROVIDER_TOKEN,
    ct: `web-${placement}`,
  });
}
