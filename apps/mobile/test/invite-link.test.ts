import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import {
  PENDING_INVITE_MAX_AGE_MS,
  decodePendingInvite,
  encodePendingInvite,
  inviteUrl,
  isInviteToken,
  parseInviteInput,
  parseInviteUrl,
} from '../src/lib/family/invite-link.logic';
import { inviteErrorKind } from '../src/lib/family/invite-errors.logic';

const ORIGIN = brand.web.origin; // https://earlyletters.com
// What create_child_invite returns today: two v4 UUIDs without dashes, 64 hex characters.
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';

describe('invite links (PRD A F7, B F5)', () => {
  it('builds the shared link on the brand origin', () => {
    expect(inviteUrl(TOKEN, ORIGIN)).toBe(`https://earlyletters.com/i/${TOKEN}`);
    expect(inviteUrl(TOKEN, `${ORIGIN}/`)).toBe(`https://earlyletters.com/i/${TOKEN}`);
    expect(() => inviteUrl('short', ORIGIN)).toThrow('invite_token_invalid');
  });

  it('round-trips: the link it builds is the link it reads', () => {
    expect(parseInviteUrl(inviteUrl(TOKEN, ORIGIN), ORIGIN)).toBe(TOKEN);
  });

  it('accepts a trailing slash, the www host and stray query or fragment', () => {
    expect(parseInviteUrl(`https://earlyletters.com/i/${TOKEN}/`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`https://www.earlyletters.com/i/${TOKEN}`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`https://earlyletters.com/i/${TOKEN}?utm_source=x#y`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`HTTPS://EarlyLetters.com/i/${TOKEN}`, ORIGIN)).toBe(TOKEN);
  });

  it('accepts future base64url tokens (32 random bytes)', () => {
    const b64 = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';
    expect(isInviteToken(b64)).toBe(true);
    expect(parseInviteUrl(`https://earlyletters.com/i/${b64}`, ORIGIN)).toBe(b64);
  });

  it('[TDD 04 3.1.6] refuses anything that is not an https link on the brand host', () => {
    expect(parseInviteUrl(`http://earlyletters.com/i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`scribe://i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.app/i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://evil.example/i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com.evil.example/i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com@evil.example/i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://evil.example@earlyletters.com/i/${TOKEN}`, ORIGIN)).toBeNull();
  });

  it('refuses malformed paths and tokens', () => {
    expect(parseInviteUrl('https://earlyletters.com/i/', ORIGIN)).toBeNull();
    expect(parseInviteUrl('https://earlyletters.com/i/abc', ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/i/${TOKEN}/extra`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/invite/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/i/${TOKEN}%00`, ORIGIN)).toBeNull();
    expect(parseInviteUrl('not a url', ORIGIN)).toBeNull();
  });
});

describe('"I was invited": pasted text (A-REQ-029)', () => {
  it('finds the link inside a whole forwarded message', () => {
    const msg = `Hi, it's Papa. I started a book of letters for Asha. Join me here: https://earlyletters.com/i/${TOKEN} see you soon`;
    expect(parseInviteInput(msg, ORIGIN)).toBe(TOKEN);
  });

  it('accepts the bare link, the token alone and surrounding spaces', () => {
    expect(parseInviteInput(`  https://earlyletters.com/i/${TOKEN}  `, ORIGIN)).toBe(TOKEN);
    expect(parseInviteInput(`\n${TOKEN}\n`, ORIGIN)).toBe(TOKEN);
  });

  it('skips lookalike links and takes the first real one', () => {
    const msg = `https://earlyletters.app/i/${TOKEN.replace('3f', 'aa')} or https://earlyletters.com/i/${TOKEN}.`;
    expect(parseInviteInput(msg, ORIGIN)).toBe(TOKEN);
  });

  it('returns null when nothing usable is there', () => {
    expect(parseInviteInput('', ORIGIN)).toBeNull();
    expect(parseInviteInput('hello', ORIGIN)).toBeNull();
    expect(parseInviteInput(`scribe://i/${TOKEN}`, ORIGIN)).toBeNull();
  });
});

describe('pending invite in the Keychain (A-REQ-028)', () => {
  const now = Date.parse('2026-10-03T09:00:00.000Z');

  it('round-trips and survives an app kill (it is just the stored string)', () => {
    const raw = encodePendingInvite({ token: TOKEN, receivedAt: now });
    expect(decodePendingInvite(raw, now + 60_000)).toEqual({ token: TOKEN, receivedAt: now });
  });

  it('drops damaged, foreign or stale values', () => {
    expect(decodePendingInvite(null, now)).toBeNull();
    expect(decodePendingInvite('{not json', now)).toBeNull();
    expect(decodePendingInvite(JSON.stringify({ t: 'short', at: now }), now)).toBeNull();
    const raw = encodePendingInvite({ token: TOKEN, receivedAt: now });
    expect(decodePendingInvite(raw, now + PENDING_INVITE_MAX_AGE_MS + 1)).toBeNull();
  });
});

describe('invite errors (supabase/APPLY.md SCINV, SCPAR, SCRAT)', () => {
  const pg = (code: string, message: string) => ({ code, message, details: null, hint: null });

  it('tells apart the SCINV reasons from the server message', () => {
    expect(inviteErrorKind(pg('SCINV', 'invite expired'))).toBe('expired');
    expect(inviteErrorKind(pg('SCINV', 'invite already used'))).toBe('used');
    expect(inviteErrorKind(pg('SCINV', 'invite revoked'))).toBe('revoked');
    expect(inviteErrorKind(pg('SCINV', 'already a member of this book'))).toBe('already_member');
    expect(inviteErrorKind(pg('SCINV', 'invite not found'))).toBe('not_found');
  });

  it('maps parent-only, rate limit, consent and deleted book', () => {
    expect(inviteErrorKind(pg('SCPAR', 'only a parent can invite'))).toBe('not_parent');
    expect(inviteErrorKind(pg('SCRAT', 'too many invites today'))).toBe('rate_limited');
    expect(inviteErrorKind(pg('SCCON', 'consent required before content is stored'))).toBe('consent_needed');
    expect(inviteErrorKind(pg('SCDEL', 'book is deleted'))).toBe('book_deleted');
    expect(inviteErrorKind(pg('P0002', 'invite not found'))).toBe('not_found');
  });

  it('maps signed-out and network failures', () => {
    expect(inviteErrorKind(pg('28000', 'not authenticated'))).toBe('signed_out');
    expect(inviteErrorKind(pg('PGRST301', 'JWT expired'))).toBe('signed_out');
    expect(inviteErrorKind({ code: '', message: 'TypeError: Network request failed' })).toBe('network');
    expect(inviteErrorKind(new Error('boom'))).toBe('unknown');
  });
});
