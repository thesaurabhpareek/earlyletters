/// <reference types="node" />
/**
 * NX-38-R5: a servers-on store build has no invite or join screen, so the invite layout sends any way in to Tonight (review of
 * PR #737, lens A: a mutation that disabled the redirect survived, because the earlier test only looked for the text
 * `inviteScreensHidden()`). The layout runs here as a function with the router, the theme and the build switches stubbed, and
 * is asked what it draws in each build. Mutations this was written to catch (each failed a test here when it was made):
 *  M1 the redirect removed or switched off;   M2 the redirect drawn in every build;   M3 it redirecting somewhere but Tonight.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('expo-router');
  vi.doUnmock('@/lib/a11y');
  vi.doUnmock('@/lib/capabilities');
  vi.doUnmock('@/lib/billing/alpha');
});

async function layoutIn(o: { servers: boolean; alpha: boolean }) {
  vi.resetModules();
  vi.doMock('expo-router', () => ({ Redirect: 'Redirect', Stack: 'Stack' }));
  vi.doMock('@/lib/a11y', () => ({ useTheme: () => ({ c: { bg: '#ffffff' } }) }));
  vi.doMock('@/lib/capabilities', () => ({ capabilities: { coParent: o.servers }, serverFeaturesEnabled: () => o.servers }));
  vi.doMock('@/lib/billing/alpha', () => ({ PLUS_ALPHA: o.alpha }));
  const { default: InviteLayout } = await import('../src/app/invite/_layout');
  return InviteLayout() as unknown as { type: string; props: { href?: string } };
}

describe('[NX-38-R5] the invite layout redirects a servers-on store build to Tonight', () => {
  it('[M1, M3] a servers-on store build is sent to Tonight', async () => {
    expect(await layoutIn({ servers: true, alpha: false })).toMatchObject({ type: 'Redirect', props: { href: '/' } });
  });
  it('[M2] every other build keeps its invite screens: a servers-on alpha build, and both servers-off builds', async () => {
    expect((await layoutIn({ servers: true, alpha: true })).type).toBe('Stack');
    expect((await layoutIn({ servers: false, alpha: false })).type).toBe('Stack');
    expect((await layoutIn({ servers: false, alpha: true })).type).toBe('Stack');
  });
});
