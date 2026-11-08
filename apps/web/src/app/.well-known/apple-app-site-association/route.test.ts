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

  it('warns in a production build with both ids unset, naming the variables, and still answers 404', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('APPLE_TEAM_ID', '');
    vi.stubEnv('IOS_BUNDLE_ID', '');
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(GET().status).toBe(404);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('APPLE_TEAM_ID');
    expect(warn.mock.calls[0][0]).toContain('IOS_BUNDLE_ID');
    // Previews and local builds stay quiet: the ids are set only in the Production environment.
    warn.mockClear();
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(GET().status).toBe(404);
    expect(warn).not.toHaveBeenCalled();
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
    expect(paths).toEqual(['/auth/confirm', '/auth/confirm/', '/auth/callback', '/auth/callback/', '/j', '/j/']);
  });

  it('lists no path that carries a token in the path (B-NFR-002): /i/* stays out, invites are /j#t=<token>', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    vi.stubEnv('IOS_BUNDLE_ID', 'com.example.scribe');
    const { paths } = await served();
    expect(paths.filter((p) => p === '/i' || p.startsWith('/i/'))).toEqual([]);
    for (const p of paths) expect(p.includes('*'), p).toBe(false);
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
      expect(p.startsWith('/auth/') || p === '/j' || p === '/j/', p).toBe(true);
    }
  });
});
