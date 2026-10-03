import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { authCallbackUrl, classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { splitUrl } from '../src/lib/auth/url.logic';

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

  it('a callback without a usable token opens the code screen', () => {
    expect(classifyIncomingUrl('https://earlyletters.com/auth/callback', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl('https://earlyletters.com/auth/callback#token_hash=<script>', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback#token_hash=${HASH}&type=recovery`, CFG)).toEqual({ kind: 'auth-code' });
  });

  it('[TDD 04 3.1.6] the custom scheme opens the code screen and never carries a usable secret', () => {
    expect(classifyIncomingUrl('scribe://auth/callback', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl('scribe:///auth/callback', CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`scribe://auth/callback#token_hash=${HASH}&type=email`, CFG)).toEqual({ kind: 'auth-code' });
    expect(classifyIncomingUrl(`scribe://i/${TOKEN}`, CFG)).toEqual({ kind: 'other' });
  });

  it('ignores other hosts and lookalikes', () => {
    expect(classifyIncomingUrl(`https://evil.example/auth/callback#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl(`https://earlyletters.app/auth/callback#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
    expect(classifyIncomingUrl(`https://earlyletters.com@evil.example/auth/callback#token_hash=${HASH}`, CFG)).toEqual({ kind: 'other' });
  });
});

describe('incoming links: invites and everything else', () => {
  it('routes an invite universal link', () => {
    expect(classifyIncomingUrl(`https://earlyletters.com/i/${TOKEN}`, CFG)).toEqual({ kind: 'invite', token: TOKEN });
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
