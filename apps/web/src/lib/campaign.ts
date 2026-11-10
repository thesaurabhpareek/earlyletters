/**
 * Apple campaign links per placement (W3). Owner: E3 (release).
 *
 * A campaign link is the App Store link plus two query parameters, `pt` (the provider token, one per developer
 * account) and `ct` (the campaign token, one per placement). Apple counts impressions, product page views and
 * first-time downloads per `ct` in App Store Connect > App Analytics > Campaigns. That is the whole of the
 * measurement: this site sets no cookie, runs no script, loads no pixel and stores nothing. The link is a plain URL.
 *
 * Each token is 30 characters or fewer, letters, digits and hyphen only. Apple shows a token only after 24 hours or
 * more of data and only once it has at least 5 first-time downloads.
 *
 *   web-hero      the first-screen action, if one is added to the hero (none exists today)
 *   web-end       the end card action, if a placement wants a name other than the existing `web-start`
 *   web-qr        the desktop QR code and its text link
 *   email-launch  the one launch email
 *
 * The badge placements that already exist (header, pill, start, footer) keep their own tokens in `appStoreHref`.
 */
import { appStoreHref, checkAppStoreUrl, withAppleCampaign } from './launch';

export const CAMPAIGN_TOKENS = {
  hero: 'web-hero',
  end: 'web-end',
  qr: 'web-qr',
  email: 'email-launch',
} as const;

export type CampaignPlacement = keyof typeof CAMPAIGN_TOKENS;
export const CAMPAIGN_PLACEMENTS = Object.keys(CAMPAIGN_TOKENS) as CampaignPlacement[];

/** The `ct` value for a placement. */
export function campaignToken(placement: CampaignPlacement): string {
  return CAMPAIGN_TOKENS[placement];
}

/**
 * The full link for a placement, built from any valid App Store link. A `pt` already in the link is reused, and
 * other parameters in it (for example `mt=8`) are kept. Returns the base link unchanged when it carries no usable
 * provider token, and the input untouched when it is not an official App Store link. Pure.
 */
export function campaignHref(baseUrl: string, placement: CampaignPlacement, providerToken?: string): string {
  const base = checkAppStoreUrl(baseUrl);
  if (!base.ok) return baseUrl;
  return withAppleCampaign(base.url, { pt: providerToken, ct: campaignToken(placement) });
}

/** The link for a placement on this deployment: empty before launch. */
export function launchCampaignHref(placement: CampaignPlacement): string {
  const base = appStoreHref();
  if (!base) return '';
  return campaignHref(base, placement, process.env.NEXT_PUBLIC_APPLE_PROVIDER_TOKEN);
}
