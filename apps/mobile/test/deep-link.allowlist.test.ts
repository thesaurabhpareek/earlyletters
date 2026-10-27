/**
 * The incoming-link allowlist (PRD A F5, F7; TDD 04 3.1.3, 3.1.6; A-NFR-010):
 * which URLs may carry a sign-in token or an invite into the app, and every
 * way a lookalike, a wrong scheme, a bad token or a custom-scheme secret is
 * refused. Pure, over the brand origin and scheme from packages/brand.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { authCallbackUrl, classifyIncomingUrl, type IncomingLink } from '../src/lib/auth/links.logic';
import { originHost, splitUrl } from '../src/lib/auth/url.logic';
import { inviteUrl, parseInviteInput, parseInviteUrl } from '../src/lib/family/invite-link.logic';

const CFG = { origin: brand.web.origin, scheme: brand.scheme };
const HOST = originHost(brand.web.origin);
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';
const classify = (url: string): IncomingLink => classifyIncomingUrl(url, CFG);
const authLink = (host: string, params: string, where: '#' | '?' = '#') => `https://${host}/auth/callback${where}${params}`;

describe('[A-NFR-010] hosts: only the brand origin, exactly', () => {
  it.each([
    [HOST, 'auth-link'],
    [HOST.toUpperCase(), 'auth-link'],
    [`${HOST}:443`, 'auth-link'],
    [`www.${HOST}`, 'other'],
    [`evil.${HOST}`, 'other'],
    [`${HOST}.evil.example`, 'other'],
    [`${HOST.replace(/\.[a-z]+$/, '')}.example`, 'other'],
    [`x${HOST}`, 'other'],
  ])('a sign-in callback on host %s is %s', (host, kind) => {
    expect(classify(authLink(host, `token_hash=${HASH}&type=email`)).kind).toBe(kind);
  });

  it('userinfo in front of the host is refused outright, whatever follows', () => {
    expect(classify(`https://${HOST}@evil.example/auth/callback#token_hash=${HASH}`)).toEqual({ kind: 'other' });
    expect(classify(`https://user:pass@${HOST}/auth/callback#token_hash=${HASH}`)).toEqual({ kind: 'other' });
    expect(splitUrl(`https://a@${HOST}/x`)).toBeNull();
  });

  it('only https carries secrets: http, ftp and javascript on the brand host are other', () => {
    for (const scheme of ['http', 'ftp', 'javascript', 'file']) {
      expect(classify(`${scheme}://${HOST}/auth/callback#token_hash=${HASH}`), scheme).toEqual({ kind: 'other' });
      expect(classify(`${scheme}://${HOST}/j#t=${TOKEN}`), scheme).toEqual({ kind: 'other' });
    }
  });
});

describe('[TDD-04 3.1.3] the sign-in callback', () => {
  it.each([
    ['/auth/callback', 'auth-link'],
    ['/auth/callback/', 'auth-link'],
    ['/auth/callback//', 'auth-link'],
    ['/auth/callbackx', 'other'],
    ['/auth/callback/extra', 'other'],
    ['/Auth/Callback', 'other'],
    ['/auth', 'other'],
    ['/', 'other'],
  ])('path %s is %s', (path, kind) => {
    expect(classify(`https://${HOST}${path}#token_hash=${HASH}&type=email`).kind).toBe(kind);
  });

  it.each([
    [HASH, 'email', 'auth-link'],
    [HASH, 'magiclink', 'auth-link'],
    [HASH, 'signup', 'auth-link'],
    [HASH, 'recovery', 'auth-code'],
    [HASH, 'EMAIL', 'auth-code'],
    ['a'.repeat(16), 'email', 'auth-link'],
    ['a'.repeat(15), 'email', 'auth-code'],
    ['a'.repeat(256), 'email', 'auth-link'],
    ['a'.repeat(257), 'email', 'auth-code'],
    ['has space here and more chars', 'email', 'auth-code'],
    ['has/slash/and/enough/length', 'email', 'auth-code'],
    ['', 'email', 'auth-code'],
  ])('token_hash %j with type %s is %s', (hash, type, kind) => {
    const r = classify(authLink(HOST, `token_hash=${encodeURIComponent(hash)}&type=${type}`));
    expect(r.kind).toBe(kind);
    if (r.kind === 'auth-link') expect(r).toEqual({ kind: 'auth-link', tokenHash: hash, type });
  });

  it('the fragment wins over the query, and a missing type means email', () => {
    const other = 'pkce_other_hash_value_that_is_long_enough_0123456789';
    expect(classify(`https://${HOST}/auth/callback?token_hash=${other}&type=signup#token_hash=${HASH}&type=email`)).toEqual({ kind: 'auth-link', tokenHash: HASH, type: 'email' });
    expect(classify(`https://${HOST}/auth/callback?token_hash=${HASH}`)).toEqual({ kind: 'auth-link', tokenHash: HASH, type: 'email' });
    expect(classify(`https://${HOST}/auth/callback`)).toEqual({ kind: 'auth-code' });
  });

  it('authCallbackUrl never doubles a slash', () => {
    expect(authCallbackUrl(brand.web.origin)).toBe(`${brand.web.origin}/auth/callback`);
    expect(authCallbackUrl(`${brand.web.origin}///`)).toBe(`${brand.web.origin}/auth/callback`);
  });
});

describe('[TDD-04 3.1.6] the custom scheme never carries a usable secret', () => {
  it.each([
    [`${brand.scheme}://auth/callback`, 'auth-code'],
    [`${brand.scheme.toUpperCase()}://auth/callback`, 'auth-code'],
    [`${brand.scheme}:///auth/callback`, 'auth-code'],
    [`${brand.scheme}://auth/callback/`, 'auth-code'],
    [`${brand.scheme}://auth/callback#token_hash=${HASH}&type=email`, 'auth-code'],
    [`${brand.scheme}://auth/callback?token_hash=${HASH}`, 'auth-code'],
    [`${brand.scheme}://j#t=${TOKEN}`, 'other'],
    [`${brand.scheme}:///j#t=${TOKEN}`, 'other'],
    [`${brand.scheme}://i/${TOKEN}`, 'other'],
    [`${brand.scheme}:///i/${TOKEN}`, 'other'],
    [`${brand.scheme}://tonight`, 'other'],
    [`${brand.scheme}://auth`, 'other'],
    [`${brand.scheme}x://auth/callback`, 'other'],
  ])('%s is %s', (url, kind) => {
    const r = classify(url);
    expect(r.kind).toBe(kind);
    expect(JSON.stringify(r)).not.toContain(HASH);
    expect(JSON.stringify(r)).not.toContain(TOKEN);
  });
});

describe('[PRD-A F7] invites', () => {
  it('a universal link on the brand host carries the token in the fragment, /j#t=<token>; everything else is other', () => {
    expect(inviteUrl(TOKEN, brand.web.origin)).toBe(`https://${HOST}/j#t=${TOKEN}`);
    expect(classify(inviteUrl(TOKEN, brand.web.origin))).toEqual({ kind: 'invite', token: TOKEN });
    expect(classify(`https://${HOST}/j/#t=${TOKEN}`)).toEqual({ kind: 'invite', token: TOKEN });
    expect(classify(`https://${HOST}/j?x=1#t=${TOKEN}`)).toEqual({ kind: 'invite', token: TOKEN });
    expect(classify(`https://${HOST}/j/more#t=${TOKEN}`)).toEqual({ kind: 'other' });
    expect(classify(`https://${HOST}/invite#t=${TOKEN}`)).toEqual({ kind: 'other' });
    expect(classify(`https://${HOST}/j`)).toEqual({ kind: 'other' });
    expect(classify(`https://${HOST}/j#t=`)).toEqual({ kind: 'other' });
    expect(classify(`https://${HOST}/j#t=${TOKEN.slice(0, 31)}`)).toEqual({ kind: 'other' });
    expect(classify(`https://${HOST}/j#t=${'a'.repeat(129)}`)).toEqual({ kind: 'other' });
    expect(classify(`https://${HOST}/j#t=${TOKEN.slice(0, 40)}%2F..`)).toEqual({ kind: 'other' });
  });

  it('the old /i/<token> form is refused everywhere: it put the token in the path, where the website and its logs see it (B-NFR-002)', () => {
    for (const url of [`https://${HOST}/i/${TOKEN}`, `https://${HOST}/i/${TOKEN}/`, `https://www.${HOST}/i/${TOKEN}`]) {
      expect(classify(url), url).toEqual({ kind: 'other' });
      expect(parseInviteUrl(url, brand.web.origin), url).toBeNull();
      expect(parseInviteInput(`see ${url} x`, brand.web.origin), url).toBeNull();
    }
  });

  it('the www alias is pasted-text only: iOS never opens the app for it (app.config.ts associates the apex domain alone)', () => {
    const config = readFileSync(join(__dirname, '..', 'app.config.ts'), 'utf8');
    expect(config).toMatch(/associatedDomains: \[`applinks:\$\{brand\.publisher\.domain\}`\]/);
    // So a www link reaching classifyIncomingUrl did not come from the system and is not routed as an invite...
    expect(classify(`https://www.${HOST}/j#t=${TOKEN}`)).toEqual({ kind: 'other' });
    // ...while "I was invited" accepts it when the person pastes it (people retype links).
    expect(parseInviteInput(`see https://www.${HOST}/j#t=${TOKEN} x`, brand.web.origin)).toBe(TOKEN);
    expect(parseInviteUrl(`https://www.${HOST}/j#t=${TOKEN}`, brand.web.origin)).toBe(TOKEN);
  });

  it('parseInviteUrl takes the token from the fragment only: a token in the path or the query is refused', () => {
    expect(parseInviteUrl(`https://${HOST}/j?t=${TOKEN}`, brand.web.origin)).toBeNull();
    expect(classify(`https://${HOST}/j?t=${TOKEN}`)).toEqual({ kind: 'other' });
    expect(parseInviteUrl(`https://${HOST}/j/${TOKEN}`, brand.web.origin)).toBeNull();
    expect(parseInviteUrl(`https://${HOST}/j#${TOKEN}`, brand.web.origin)).toBeNull();
    expect(parseInviteUrl(`https://${HOST}/i/x?token=${TOKEN}`, brand.web.origin)).toBeNull();
    expect(parseInviteUrl(`https://${HOST}/i/#${TOKEN}`, brand.web.origin)).toBeNull();
  });

  it('a provider redirect is left to the provider; an empty or non-URL string is other', () => {
    expect(classify('com.googleusercontent.apps.123-abc:/oauth2redirect?code=x')).toEqual({ kind: 'provider-redirect' });
    for (const s of ['', '   ', 'not a url', '/auth/callback', `${HOST}/auth/callback`]) expect(classify(s), s).toEqual({ kind: 'other' });
  });
});

describe('the splitter keeps every part where a check expects it', () => {
  it('lowercases scheme and host, keeps the path case, decodes parameters, and drops the port', () => {
    const u = splitUrl(`HTTPS://${HOST.toUpperCase()}:8443/Auth/Callback?a=1&b=two%20words&c#x=y+z&empty`);
    expect(u).toEqual({ scheme: 'https', host: HOST, path: '/Auth/Callback', query: { a: '1', b: 'two words', c: '' }, fragment: { x: 'y z', empty: '' } });
  });

  it('a host-only or path-only URL still has a path that starts with a slash', () => {
    expect(splitUrl(`https://${HOST}`)?.path).toBe('/');
    expect(splitUrl(`${brand.scheme}:auth/callback`)).toMatchObject({ scheme: brand.scheme, host: '', path: '/auth/callback' });
  });
});
