import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { authCallbackUrl, classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { splitUrl } from '../src/lib/auth/url.logic';
import { allowedLinkRoute, LINK_ROUTE_ALLOWLIST, planIncomingLink } from '../src/lib/family/entry.logic';
import { armListenStart, consumeListenStart, LISTEN_ARM_WINDOW_MS, resetListenStart } from '../src/lib/resilience/start-intent';
import { isCaptureRoute, TONIGHT_HREF } from '../src/lib/resilience/not-found.logic';

const CFG = { origin: brand.web.origin, scheme: brand.scheme };
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';

describe('incoming links: email sign-in (PRD A F5, TDD 04 3.1.3)', () => {
  it('reads the token hash from the fragment, where the email template puts it', () => {
    const url = `${authCallbackUrl(CFG.origin)}#token_hash=${HASH}&type=email`;
    expect(url.startsWith('https://earlyletters.com/auth/callback#')).toBe(true);
    expect(classifyIncomingUrl(url, CFG)).toEqual({ kind: 'auth-link', tokenHash: HASH, type: 'email' });
  });

  it('also reads a query string, and defaults the type to email', () => {
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback?token_hash=${HASH}`, CFG)).toEqual({
      kind: 'auth-link',
      tokenHash: HASH,
      type: 'email',
    });
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback/?token_hash=${HASH}&type=signup`, CFG)).toEqual({
      kind: 'auth-link',
      tokenHash: HASH,
      type: 'signup',
    });
  });

  it('[SIGN-04] /auth/confirm is read exactly as /auth/callback (the AASA file hands both to the app)', () => {
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/confirm#token_hash=${HASH}&type=email`, CFG)).toEqual({ kind: 'auth-link', tokenHash: HASH, type: 'email' });
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/confirm/?token_hash=${HASH}&type=signup`, CFG)).toEqual({ kind: 'auth-link', tokenHash: HASH, type: 'signup' });
    expect(classifyIncomingUrl('https://earlyletters.com/auth/confirm', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl('scribe://auth/confirm', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`scribe://auth/confirm#token_hash=${HASH}&type=email`, CFG)).toEqual({ kind: 'auth-code' });
    // Nothing else under /auth, and no lookalike host.
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/confirmed#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl(`https://evil.example/auth/confirm#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
  });

  it('[TPL-04] an email_change link is read as such, not sent to the sign-in code screen', () => {
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback#token_hash=${HASH}&type=email_change`, CFG)).toEqual({
      kind: 'auth-link',
      tokenHash: HASH,
      type: 'email_change',
    });
  });

  it('a callback without a usable token opens the code screen', () => {
    expect(classifyIncomingUrl('https://earlyletters.com/auth/callback', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl('https://earlyletters.com/auth/callback#token_hash=<script>', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback#token_hash=${HASH}&type=recovery`, CFG)).toEqual({ kind: 'auth-code' });
  });

  it('[TDD 04 3.1.6] the custom scheme opens the code screen and never carries a usable secret', () => {
    expect(classifyIncomingUrl('scribe://auth/callback', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl('scribe:///auth/callback', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`scribe://auth/callback#token_hash=${HASH}&type=email`, CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`scribe://j#t=${TOKEN}`, CFG)).toEqual({ kind: 'other' });
  });

  it('ignores other hosts and lookalikes', () => {
    expect(classifyIncomingUrl(`https://evil.example/auth/callback#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl(`https://earlyletters.app/auth/callback#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl(`https://earlyletters.com@evil.example/auth/callback#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
  });
});

describe('incoming links: invites and everything else', () => {
  it('routes an invite universal link', () => {
    expect(classifyIncomingUrl(`https://earlyletters.com/j#t=${TOKEN}`, CFG)).toEqual({ kind: 'invite', token: TOKEN });
  });

  it("leaves Google's own redirect alone", () => {
    expect(classifyIncomingUrl('com.googleusercontent.apps.123-abc:/oauth2redirect?code=x', CFG)).toEqual({ kind: 'provider-redirect' });
  });

  it('passes ordinary app paths through', () => {
    expect(classifyIncomingUrl('scribe://settings', CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl('https://earlyletters.com/privacy', CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl('/book', CFG)).toEqual({ kind: 'other' });
  });
});

describe('url splitter', () => {
  it('splits scheme, host, path, query and fragment', () => {
    expect(splitUrl('https://Example.com:443/a/b?x=1&y=two%20words#k=v')).toEqual({
      scheme: 'https',
      host: 'example.com',
      path: '/a/b',
      query: { x: '1', y: 'two words' },
      fragment: { k: 'v' },
    });
  });

  it('refuses userinfo (a classic host-check trick) and non-URLs', () => {
    expect(splitUrl('https://user@example.com/')).toBeNull();
    expect(splitUrl('just text')).toBeNull();
  });

  it('keeps malformed escapes instead of throwing', () => {
    expect(splitUrl('https://example.com/?a=%E0%A4%A')?.query.a).toBe('%E0%A4%A');
  });
});

describe('[LEGAL-REQ-011] an external link never auto-starts recording', () => {
  // Every way a link can name a screen that records, drafts or plays audio. /write is a typing screen, but a
  // link must not open a half-made letter either.
  const RECORDER_LINKS = [
    'scribe://listen',
    'scribe://listen?go=1&autostart=true',
    'scribe://listen/',
    'scribe:///listen',
    'scribe://review?draftId=1',
    'scribe://write',
    'scribe://read-together',
    'scribe://read-together/letter-1',
    'https://earlyletters.com/listen',
    'https://earlyletters.com/review?draftId=1',
    'https://earlyletters.com/write',
    'https://earlyletters.com/read-together',
    '/listen',
    '/LISTEN',
    '/review',
    '/write',
    '/read-together',
    '/listen#record',
  ];
  // Every build shape: server features on or off, store or alpha, gate stopped or not.
  const BUILDS = [true, false].flatMap((serverFeatures) =>
    [true, false].flatMap((alpha) => [true, false].map((gateStopped) => ({ serverFeatures, alpha, gateStopped }))),
  );

  it('the plan for a link to /listen, /review, /write or /read-together is Tonight in every build, keeping nothing', () => {
    for (const path of RECORDER_LINKS) {
      const link = classifyIncomingUrl(path, CFG);
      for (const build of BUILDS) {
        const plan = planIncomingLink(link, { ...build, path });
        expect(plan, `${path} ${JSON.stringify(build)}`).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
      }
    }
  });

  it('the screens that record are not on the list of routes a link may open', () => {
    for (const r of ['/listen', '/review', '/write', '/read-together']) {
      expect(LINK_ROUTE_ALLOWLIST as readonly string[], r).not.toContain(r);
      expect(allowedLinkRoute(r), r).toBe('/');
    }
  });

  it('a recorder link still cannot open its screen when it carries an invite or sign-in look-alike', () => {
    for (const path of [`https://earlyletters.com/listen#t=${TOKEN}`, `scribe://listen#token_hash=${HASH}&type=email`, `https://earlyletters.com/listen?next=/auth/callback#token_hash=${HASH}`]) {
      for (const build of BUILDS) {
        const plan = planIncomingLink(classifyIncomingUrl(path, CFG), { ...build, path });
        expect(plan.route, path).not.toBe('/listen');
        expect(plan.route, path).toBe('/');
      }
    }
  });

  it('the first gate in the link hook (isCaptureRoute) catches the recorder screens, whatever the spelling', () => {
    // +native-intent.tsx imports react-native, which vitest cannot load; this is the check it makes first.
    for (const path of RECORDER_LINKS.filter((p) => !/write/.test(p))) {
      expect(isCaptureRoute(path), path).toBe(true);
    }
    expect(TONIGHT_HREF).toBe('/');
  });

  it('Listen reached any way but a tap (a link, a restored screen, a stale route) reads "not tapped"', () => {
    resetListenStart();
    expect(consumeListenStart()).toBe(false);
    armListenStart(1000);
    expect(consumeListenStart(1000 + LISTEN_ARM_WINDOW_MS + 1)).toBe(false);
    armListenStart(1000);
    expect(consumeListenStart(1000)).toBe(true);
    expect(consumeListenStart(1000)).toBe(false);
    resetListenStart();
  });
});
