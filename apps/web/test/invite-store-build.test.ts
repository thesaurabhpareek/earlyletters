/**
 * BL-558, exec reading CMO-24: the /j invite page's App Store line ("For now, the App Store version of ... doesn't have
 * invites.") is drawn only when the site is in launch mode (`launch.mode === 'live'`, src/lib/launch.ts), the same
 * switch /open uses for its App Store words. Before launch there is no App Store version, so the line would describe a
 * product nobody can find. The e2e suite builds the site in prelaunch mode only (e2e/launch-off.e2e.ts), so this test
 * is where the launch-mode case is proven: the page is rendered on the server, as Next renders it, in both modes.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { site } from '../src/content/site';

const state = vi.hoisted(() => ({ launch: { mode: 'prelaunch' as 'live' | 'prelaunch', appStoreUrl: '' } }));

// The page imports through the app's `@/` alias, which Next resolves and vitest does not; the mocks stand in for it.
vi.mock('@/content/site', async () => import('../src/content/site'));
vi.mock('@/lib/brand/share-card', () => ({ pageShareCard: () => ({}) }));
vi.mock('@/lib/launch', () => ({ launch: state.launch }));

const { default: InvitePage } = await import('../src/app/j/page');

/** The server HTML with the line's apostrophe as React escapes it. */
const LINE = site.invite.storeBuild.replace(/'/g, '&#x27;');
const render = (mode: 'live' | 'prelaunch') => {
  state.launch.mode = mode;
  state.launch.appStoreUrl = mode === 'live' ? 'https://apps.apple.com/app/id1234567890' : '';
  return renderToStaticMarkup(createElement(InvitePage));
};

afterEach(() => {
  state.launch.mode = 'prelaunch';
  state.launch.appStoreUrl = '';
});

describe('[BL-558][CMO-24] the invite page draws the App Store line only in launch mode', () => {
  it('draws it in the server HTML once the site is live', () => {
    const html = render('live');
    expect(html).toContain(LINE);
    // Under the body line, as one paragraph of its own.
    expect(html.indexOf(LINE)).toBeGreaterThan(html.indexOf(site.invite.body));
  });

  it('leaves it out before launch, and the rest of the page is the same', () => {
    const before = render('prelaunch');
    expect(before).not.toContain(LINE);
    expect(before).toContain(site.invite.body);
    expect(before).toContain(site.invite.onComputer.replace(/'/g, '&#x27;'));
    // The one difference between the two modes is that paragraph.
    expect(render('live').replace(/<p[^>]*>[^<]*<\/p>/g, (p) => (p.includes(LINE) ? '' : p))).toBe(before);
  });

  it('keeps the line in the word table in both modes, so the claims test still reads it', () => {
    expect(site.invite.storeBuild).toMatch(/^For now, the App Store version of \S.* doesn't have invites\.$/);
  });
});
