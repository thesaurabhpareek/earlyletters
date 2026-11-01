import { describe, expect, it } from 'vitest';
import { resolveSiteMode } from './site-mode';

describe('resolveSiteMode', () => {
  it('shows the holding page on Vercel Production when nothing is set', () => {
    expect(resolveSiteMode({ VERCEL_ENV: 'production' })).toBe('coming-soon');
  });
  it('shows the film on previews and locally when nothing is set', () => {
    expect(resolveSiteMode({ VERCEL_ENV: 'preview' })).toBe('film');
    expect(resolveSiteMode({})).toBe('film');
  });
  it('lets SITE_MODE override the default in both directions', () => {
    expect(resolveSiteMode({ SITE_MODE: 'film', VERCEL_ENV: 'production' })).toBe('film');
    expect(resolveSiteMode({ SITE_MODE: 'coming-soon', VERCEL_ENV: 'preview' })).toBe('coming-soon');
  });
  it('ignores unknown values and falls back to the default', () => {
    expect(resolveSiteMode({ SITE_MODE: 'live', VERCEL_ENV: 'production' })).toBe('coming-soon');
    expect(resolveSiteMode({ SITE_MODE: '  ', VERCEL_ENV: 'preview' })).toBe('film');
  });
});
