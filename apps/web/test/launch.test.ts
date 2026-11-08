/**
 * App Store link validation, the launch switch and Apple campaign parameters. Owner: E3 (release).
 * Covers src/lib/launch.ts.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAppStoreUrl, withAppleCampaign } from '../src/lib/launch';

const GOOD = 'https://apps.apple.com/us/app/early-letters-memory-book/id1234567890';

describe('checkAppStoreUrl', () => {
  it('accepts official product links', () => {
    for (const url of [
      GOOD,
      'https://apps.apple.com/app/id1234567890',
      'https://apps.apple.com/gb/app/id1234567890?l=en',
      'https://apps.apple.com/app/apple-store/id123456789?pt=123456&ct=test1234&mt=8',
      `  ${GOOD}  `,
    ]) {
      expect(checkAppStoreUrl(url).ok, url).toBe(true);
    }
  });

  it('keeps the query and drops the fragment', () => {
    const result = checkAppStoreUrl(`${GOOD}?pt=1&ct=a#frag`);
    expect(result).toEqual({ ok: true, url: `${GOOD}?pt=1&ct=a` });
  });

  it('treats an empty or missing value as unset, not as an error', () => {
    for (const value of [undefined, null, '', '   ']) {
      expect(checkAppStoreUrl(value)).toMatchObject({ ok: false, reason: 'unset' });
    }
  });

  it('rejects everything that is not an App Store product link', () => {
    for (const url of [
      'http://apps.apple.com/us/app/x/id1234567890', // not https
      'https://apps.apple.com.evil.com/us/app/x/id1234567890', // look-alike host
      'https://evil.com/apps.apple.com/us/app/x/id1234567890', // host elsewhere
      'https://apps.apple.com@evil.com/us/app/x/id1234567890', // credentials trick
      'https://user:pw@apps.apple.com/us/app/x/id1234567890',
      'https://apps.apple.com:8443/us/app/x/id1234567890',
      'https://apps.apple.com/',
      'https://apps.apple.com/us/app/early-letters', // no id
      'https://testflight.apple.com/join/abcdef',
      'https://itunes.apple.com/us/app/x/id1234567890', // legacy host, not the one we publish
      'apps.apple.com/us/app/x/id1234567890', // no scheme
      'not a url',
      'javascript:alert(1)',
    ]) {
      expect(checkAppStoreUrl(url), url).toMatchObject({ ok: false, reason: 'invalid' });
    }
  });
});

describe('withAppleCampaign', () => {
  it('adds pt and ct together', () => {
    expect(withAppleCampaign(GOOD, { pt: '123456', ct: 'web-header' })).toBe(`${GOOD}?pt=123456&ct=web-header`);
  });

  it('reuses the pt that is already in the link and keeps other parameters', () => {
    const base = `${GOOD}?pt=987654&ct=test1234&mt=8`;
    expect(withAppleCampaign(base, { ct: 'web-pill' })).toBe(`${GOOD}?pt=987654&ct=web-pill&mt=8`);
  });

  it('lets an explicit pt win over the one in the link', () => {
    expect(withAppleCampaign(`${GOOD}?pt=111`, { pt: '222', ct: 'web-start' })).toBe(`${GOOD}?pt=222&ct=web-start`);
  });

  it('adds nothing when pt or ct is missing or malformed (Apple needs both)', () => {
    expect(withAppleCampaign(GOOD, { ct: 'web-header' })).toBe(GOOD);
    expect(withAppleCampaign(GOOD, { pt: '123456' })).toBe(GOOD);
    expect(withAppleCampaign(GOOD, { pt: 'abc', ct: 'web-header' })).toBe(GOOD);
    expect(withAppleCampaign(GOOD, { pt: '123456', ct: 'has space' })).toBe(GOOD);
    expect(withAppleCampaign(GOOD, { pt: '123456', ct: 'x'.repeat(31) })).toBe(GOOD);
    expect(withAppleCampaign(GOOD, { pt: '123456', ct: 'a&b=c' })).toBe(GOOD);
  });

  it('leaves an invalid base untouched', () => {
    expect(withAppleCampaign('', { pt: '1', ct: 'a' })).toBe('');
    expect(withAppleCampaign('https://evil.com/id1', { pt: '1', ct: 'a' })).toBe('https://evil.com/id1');
  });
});

describe('launch and appStoreHref (module reads the environment once)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).__earlyLettersLaunchWarned;
  });

  async function load(env: Record<string, string | undefined>) {
    vi.resetModules();
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) vi.stubEnv(key, '');
      else vi.stubEnv(key, value);
    }
    return import('../src/lib/launch');
  }

  it('is prelaunch with an empty link, silently', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { launch, appStoreHref: href } = await load({ NEXT_PUBLIC_APP_STORE_URL: undefined });
    expect(launch).toEqual({ mode: 'prelaunch', appStoreUrl: '' });
    expect(href('header')).toBe('');
    expect(warn).not.toHaveBeenCalled();
  });

  it('is live with a valid link', async () => {
    const { launch } = await load({ NEXT_PUBLIC_APP_STORE_URL: GOOD });
    expect(launch).toEqual({ mode: 'live', appStoreUrl: GOOD });
  });

  it('stays prelaunch and warns once when the link is wrong', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { launch } = await load({ NEXT_PUBLIC_APP_STORE_URL: 'https://testflight.apple.com/join/abcdef' });
    expect(launch).toEqual({ mode: 'prelaunch', appStoreUrl: '' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('NEXT_PUBLIC_APP_STORE_URL');
    // Loading it again in the same process does not repeat the warning.
    await load({ NEXT_PUBLIC_APP_STORE_URL: 'https://testflight.apple.com/join/abcdef' });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('builds campaign links from NEXT_PUBLIC_APPLE_PROVIDER_TOKEN or from the pt in the link', async () => {
    const withEnv = await load({ NEXT_PUBLIC_APP_STORE_URL: GOOD, NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: '123456' });
    expect(withEnv.appStoreHref('header')).toBe(`${GOOD}?pt=123456&ct=web-header`);
    expect(withEnv.appStoreHref()).toBe(GOOD);

    const fromLink = await load({
      NEXT_PUBLIC_APP_STORE_URL: `${GOOD}?pt=555&ct=base&mt=8`,
      NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: undefined,
    });
    expect(fromLink.appStoreHref('start')).toBe(`${GOOD}?pt=555&ct=web-start&mt=8`);

    const noToken = await load({ NEXT_PUBLIC_APP_STORE_URL: GOOD, NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: undefined });
    expect(noToken.appStoreHref('pill')).toBe(GOOD);
  });
});
