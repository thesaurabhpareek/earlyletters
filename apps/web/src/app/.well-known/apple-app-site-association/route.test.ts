/**
 * Owner: S20 (web). The AASA file [A-REQ-022] [F21-REQ-024]: 404 unless both ids are set and valid; otherwise the
 * production and .preview app ids with the sign-in and invite paths, and nothing else.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function served(): Promise<{ appIDs: string[]; paths: string[]; body: Record<string, unknown> }> {
  const res = GET();
  expect(res.status).toBe(200);
  const body = await res.json();
  const [detail] = body.applinks.details;
  return { appIDs: detail.appIDs, paths: detail.components.map((c: Record<string, string>) => c['/']), body };
}

describe('apple-app-site-association', () => {
  it('answers 404 when the ids are not set', () => {
    vi.stubEnv('APPLE_TEAM_ID', '');
    vi.stubEnv('IOS_BUNDLE_ID', '');
    expect(GET().status).toBe(404);
  });

  it('answers 404 when only one id is set, or one is malformed', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', '');
    expect(GET().status).toBe(404);
    vi.stubEnv('APPLE_TEAM_ID', 'abc');
    vi.stubEnv('IOS_BUNDLE_ID', 'com.example.scribe');
    expect(GET().status).toBe(404);
    vi.stubEnv('APPLE_TEAM_ID', 'abcde12345');
    expect(GET().status).toBe(404);
  });

  it('refuses a .preview or .dev id in IOS_BUNDLE_ID (it takes the production id and adds .preview itself)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    for (const id of ['com.example.scribe.preview', 'com.example.scribe.dev']) {
      vi.stubEnv('IOS_BUNDLE_ID', id);
      expect(GET().status, id).toBe(404);
    }
  });

  it('serves JSON for the production and .preview app ids, with the sign-in and invite paths only', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', ' com.example.scribe ');
    expect(GET().headers.get('content-type')).toContain('application/json');
    const { appIDs, paths, body } = await served();
    expect(Object.keys(body)).toEqual(['applinks']);
    expect(appIDs).toEqual(['ABCDE12345.com.example.scribe', 'ABCDE12345.com.example.scribe.preview']);
    expect(paths).toEqual(['/auth/confirm', '/auth/confirm/', '/auth/callback', '/auth/callback/', '/i/*']);
  });

  it('does not list /j until the app reads /j links (WP-F11-11): a listed path the app drops opens it to nothing', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', 'com.example.scribe');
    const { paths } = await served();
    expect(paths.filter((p) => p === '/j' || p.startsWith('/j/'))).toEqual([]);
  });

  it('matches paths only, and lists no catch-all, so no other page of the site opens the app', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', 'com.example.scribe');
    const res = GET();
    const [detail] = (await res.json()).applinks.details;
    // A path rule, never a fragment or query rule: the token stays in the fragment and is never matched on.
    for (const c of detail.components) expect(Object.keys(c)).toEqual(['/']);
    const { paths } = await served();
    for (const p of paths) {
      expect(['*', '/*', '/']).not.toContain(p);
      expect(p.startsWith('/auth/') || p.startsWith('/i/'), p).toBe(true);
    }
  });
});
