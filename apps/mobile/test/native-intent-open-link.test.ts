/**
 * BL-510: the universal link https://<brand origin>/open (apple-app-site-association) means "open the app".
 * It lands on home and keeps nothing: no token, no wildcard, no deep state (A-NFR-012, LEGAL-REQ-014).
 * Pure: classifyIncomingUrl then planIncomingLink, the same two steps +native-intent.tsx runs.
 */
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { LINK_ROUTE_ALLOWLIST, planIncomingLink } from '../src/lib/family/entry.logic';

const CFG = { origin: brand.web.origin, scheme: brand.scheme };
const ORIGIN = brand.web.origin.replace(/\/+$/, '');
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';

const plan = (path: string, serverFeatures: boolean, alpha = false) =>
  planIncomingLink(classifyIncomingUrl(path, CFG), { serverFeatures, gateStopped: false, alpha, path });

const OPEN_FORMS = [
  `${ORIGIN}/open`,
  `${ORIGIN}/open/`,
  `${ORIGIN}/open?utm_source=card`,
  `${ORIGIN}/open/?utm_source=card`,
  `${ORIGIN}/open#section`,
  `${ORIGIN}/open/#section`,
  `${ORIGIN}/open?utm_source=card#section`,
  `${ORIGIN}/open?token_hash=${HASH}&type=email#t=${TOKEN}`,
  `${ORIGIN}/OPEN/`,
];

describe('[BL-510] /open and /open/ open the app at home and keep nothing', () => {
  it.each(OPEN_FORMS)('%s routes to the bare home path with no token kept, server features on or off', (url) => {
    for (const serverFeatures of [false, true]) {
      for (const alpha of [false, true]) {
        const p = plan(url, serverFeatures, alpha);
        expect(p.route).toBe('/');
        expect(p.keepAuthLink).toBe(false);
        expect(p.keepInviteToken).toBe(false);
      }
    }
  });

  it.each(OPEN_FORMS)('%s is not an auth link or an invite, so no token can be read from it', (url) => {
    expect(classifyIncomingUrl(url, CFG)).toEqual({ kind: 'other' });
  });

  it('the route carries no query, token or fragment into the app', () => {
    for (const url of OPEN_FORMS) {
      const route = plan(url, true, true).route ?? '';
      expect(route).not.toMatch(/[?#]/);
      expect(route).not.toContain(HASH);
      expect(route).not.toContain(TOKEN);
    }
  });
});

describe('[BL-510] other unknown paths do not gain the /open behavior', () => {
  it('/open is not added to the link route allowlist', () => {
    expect([...LINK_ROUTE_ALLOWLIST]).toEqual(['/', '/invite']);
  });

  it.each([`${ORIGIN}/open/anything`, `${ORIGIN}/opened`, `${ORIGIN}/open-app`, `${ORIGIN}/x/open`, `${ORIGIN}/openx/`])(
    '%s is not a wildcard match: classified other, keeps nothing',
    (url) => {
      expect(classifyIncomingUrl(url, CFG)).toEqual({ kind: 'other' });
      const p = plan(url, true, true);
      expect(p.keepAuthLink).toBe(false);
      expect(p.keepInviteToken).toBe(false);
    },
  );

  it('/open on another host, or over http, is refused the same way as any other unknown link', () => {
    expect(classifyIncomingUrl('https://evil.example/open', CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl(`${ORIGIN.replace('https:', 'http:')}/open`, CFG)).toEqual({ kind: 'other' });
  });

  it('a path that the allowlist does know (/invite) still opens its own route, so /open did not widen or replace it', () => {
    expect(plan(`${ORIGIN}/invite`, false).route).toBe('/invite');
  });
});
