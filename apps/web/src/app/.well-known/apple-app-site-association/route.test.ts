/** Owner: E1 (web platform). The AASA file: 404 unless both ids are set and valid, otherwise the four token-link paths. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllEnvs());

describe('apple-app-site-association', () => {
  it('answers 404 when the ids are not set', async () => {
    vi.stubEnv('APPLE_TEAM_ID', '');
    vi.stubEnv('IOS_BUNDLE_ID', '');
    expect(GET().status).toBe(404);
  });

  it('answers 404 when only one id is set, or one is malformed', () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(GET().status).toBe(404);
    vi.stubEnv('APPLE_TEAM_ID', 'abc');
    vi.stubEnv('IOS_BUNDLE_ID', 'com.example.scribe');
    expect(GET().status).toBe(404);
  });

  it('serves JSON for the app id with the /a /i /j /r paths', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', 'com.example.scribe');
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    const [detail] = body.applinks.details;
    expect(detail.appIDs).toEqual(['ABCDE12345.com.example.scribe']);
    expect(detail.components.map((c: Record<string, string>) => c['/'])).toEqual([
      '/a', '/a/*', '/i', '/i/*', '/j', '/j/*', '/r', '/r/*',
    ]);
  });
});
