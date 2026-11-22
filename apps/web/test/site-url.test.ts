/** Link-preview URLs must be absolute and must point at the address the page is actually served from. */
import { describe, expect, it } from 'vitest';
import { resolveSiteUrl } from '../src/lib/site-url';

describe('resolveSiteUrl', () => {
  it('uses the production domain on Vercel production, with or without a scheme', () => {
    expect(resolveSiteUrl({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'earlyletters.com' }).href).toBe('https://earlyletters.com/');
    expect(resolveSiteUrl({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'https://earlyletters.vercel.app/' }).href).toBe('https://earlyletters.vercel.app/');
  });
  it('uses the preview address on previews', () => {
    expect(resolveSiteUrl({ VERCEL_ENV: 'preview', VERCEL_URL: 'earlyletters-abc.vercel.app' }).href).toBe('https://earlyletters-abc.vercel.app/');
  });
  it('lets NEXT_PUBLIC_SITE_URL override, and ignores a malformed one', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'x.com' }).href).toBe('https://example.org/');
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'not a url' }).href).toBe('https://earlyletters.com/');
  });
  it('falls back to earlyletters.com locally and when the Vercel values are missing', () => {
    expect(resolveSiteUrl({}).href).toBe('https://earlyletters.com/');
    expect(resolveSiteUrl({ VERCEL_ENV: 'production' }).href).toBe('https://earlyletters.com/');
  });
});
