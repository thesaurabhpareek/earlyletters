/**
 * Apple campaign links per placement (src/lib/campaign.ts). Owner: E3 (release).
 * Pure link building: no analytics, no pixel, no cookie, nothing stored. Also pins the QR token to appStoreHref('qr').
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_PLACEMENTS, CAMPAIGN_TOKENS, campaignHref, campaignToken } from '../src/lib/campaign';
import { CTA_PLACEMENTS } from '../src/lib/analytics/events';

const GOOD = 'https://apps.apple.com/us/app/early-letters-memory-book/id1234567890';

describe('campaign tokens', () => {
  it('are the launch set, and nothing else', () => {
    expect(CAMPAIGN_TOKENS).toEqual({ hero: 'web-hero', end: 'web-end', qr: 'web-qr', email: 'email-launch' });
    expect([...CAMPAIGN_PLACEMENTS].sort()).toEqual(['email', 'end', 'hero', 'qr']);
  });

  it('obey Apple limits: 30 characters or fewer, letters digits hyphen underscore only, all different', () => {
    const tokens = CAMPAIGN_PLACEMENTS.map(campaignToken);
    for (const t of tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{1,30}$/);
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});

describe('campaignHref', () => {
  it('adds pt and ct for each placement', () => {
    expect(campaignHref(GOOD, 'hero', '123456')).toBe(`${GOOD}?pt=123456&ct=web-hero`);
    expect(campaignHref(GOOD, 'end', '123456')).toBe(`${GOOD}?pt=123456&ct=web-end`);
    expect(campaignHref(GOOD, 'qr', '123456')).toBe(`${GOOD}?pt=123456&ct=web-qr`);
    expect(campaignHref(GOOD, 'email', '123456')).toBe(`${GOOD}?pt=123456&ct=email-launch`);
  });

  it('reuses the pt in the link and keeps its other parameters', () => {
    expect(campaignHref(`${GOOD}?pt=987654&ct=old&mt=8`, 'qr')).toBe(`${GOOD}?pt=987654&ct=web-qr&mt=8`);
  });

  it('adds nothing without a usable provider token, because Apple needs both', () => {
    expect(campaignHref(GOOD, 'qr')).toBe(GOOD);
    expect(campaignHref(GOOD, 'qr', 'abc')).toBe(GOOD);
    expect(campaignHref(GOOD, 'qr', '')).toBe(GOOD);
  });

  it('leaves a link that is not an official App Store link exactly as given', () => {
    for (const bad of ['', 'https://evil.com/id1', 'https://testflight.apple.com/join/x', 'javascript:alert(1)']) {
      expect(campaignHref(bad, 'qr', '123456')).toBe(bad);
    }
  });

  it('is a plain string: no tracking parameters of our own, no fragment', () => {
    const href = campaignHref(`${GOOD}#frag`, 'qr', '123456');
    expect([...new URL(href).searchParams.keys()]).toEqual(['pt', 'ct']);
    expect(href).not.toContain('#');
  });
});

describe('on this deployment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load(env: Record<string, string>) {
    vi.resetModules();
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    return { campaign: await import('../src/lib/campaign'), launch: await import('../src/lib/launch') };
  }

  it('the QR link is appStoreHref("qr"), and the placement is on the shared list', async () => {
    const { launch } = await load({ NEXT_PUBLIC_APP_STORE_URL: GOOD, NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: '123456' });
    expect(launch.appStoreHref('qr')).toBe(`${GOOD}?pt=123456&ct=web-qr`);
    expect(CTA_PLACEMENTS).toContain('qr');
  });

  it('launchCampaignHref follows the deployment and is empty before launch', async () => {
    const live = await load({ NEXT_PUBLIC_APP_STORE_URL: GOOD, NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: '123456' });
    expect(live.campaign.launchCampaignHref('email')).toBe(`${GOOD}?pt=123456&ct=email-launch`);
    const off = await load({ NEXT_PUBLIC_APP_STORE_URL: '', NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: '123456' });
    for (const p of CAMPAIGN_PLACEMENTS) expect(off.campaign.launchCampaignHref(p)).toBe('');
  });
});
