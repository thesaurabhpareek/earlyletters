/// <reference types="node" />
/**
 * F02-REQ-020 (F02-U27, ADR 0023): an email link never replaces a session. The provider decides
 * "signed in" from the auth state OR the Keychain (sessionSavedOnPhone), so a link that opens the
 * app from closed, while the state is still `restoring`, is refused too. Security review of
 * PR #139, finding 1. Also what the refusals say (reviews A and B of #139): words that name a
 * path that works, a heading of their own, and an expired note read as an expired link.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setServerFeaturesForTests } from '../src/lib/capabilities';

const store = new Map<string, string>();
let failReads = false;
const secure = {
  getItem: vi.fn(async (k: string) => {
    if (failReads) throw new Error('keychain locked');
    return store.get(k) ?? null;
  }),
  setItem: vi.fn(async (k: string, v: string) => void store.set(k, v)),
  removeItem: vi.fn(async (k: string) => void store.delete(k)),
};
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: secure }));

const KEY = 'sb-test-auth-token';
const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);

describe('[F02-REQ-020] a link is refused when a session is saved on the phone, even before restore finishes', () => {
  beforeEach(() => {
    store.clear();
    failReads = false;
    secure.getItem.mockClear();
    setServerFeaturesForTests(true);
  });
  afterEach(() => setServerFeaturesForTests(null));

  it('cold start: state says nobody (restoring), the Keychain holds a session: refused, no exchange', async () => {
    const { sessionSavedOnPhone } = await import('../src/lib/auth/pending');
    const { openEmailLink } = await import('../src/lib/auth/email-link.logic');
    store.set(KEY, JSON.stringify({ user: { id: 'a' } }));
    const signedIn = false || (await sessionSavedOnPhone(KEY));
    const exchange = vi.fn(async () => 'b');
    const r = await openEmailLink({ tokenHash: 'pkce_x', type: 'email' }, { readPending: async () => ({ at: NOW }), signedIn: () => signedIn, exchange, clearPending: async () => {} });
    expect(r).toEqual({ ok: false, error: 'already_signed_in' });
    expect(exchange).not.toHaveBeenCalled();
  });

  it('nothing saved and a pending request from this phone: the link goes on to the PKCE exchange', async () => {
    const { sessionSavedOnPhone } = await import('../src/lib/auth/pending');
    expect(await sessionSavedOnPhone(KEY)).toBe(false);
  });

  it('an unreadable Keychain counts as signed in (refuse, never guess)', async () => {
    const { sessionSavedOnPhone } = await import('../src/lib/auth/pending');
    failReads = true;
    expect(await sessionSavedOnPhone(KEY)).toBe(true);
  });

  it('server features off: never touches the Keychain', async () => {
    const { sessionSavedOnPhone } = await import('../src/lib/auth/pending');
    setServerFeaturesForTests(false);
    expect(await sessionSavedOnPhone(KEY)).toBe(false);
    expect(secure.getItem).not.toHaveBeenCalled();
  });
});

describe('[F02-REQ-020] what the refusals say (reviews A and B of PR #139)', () => {
  beforeEach(() => {
    store.clear();
    failReads = false;
    setServerFeaturesForTests(true);
  });
  afterEach(() => setServerFeaturesForTests(null));

  it('F02-U27 names the path that works: sign out, then the code (sign-out drops the pending request, so the same link never works after it)', async () => {
    const { authErrorMessage } = await import('../src/lib/auth/messages');
    const words = authErrorMessage('already_signed_in') ?? '';
    expect(words).toMatch(/already signed in on this phone/i);
    expect(words).toMatch(/sign out, then type the code from the email/i);
    expect(words).not.toMatch(/this link/i);
    // Any account is refused, this one included, so the words never say it is another one.
    expect(words).not.toMatch(/signed in as another account/i);
  });

  it('both refusals (F02-U11, F02-U27) sit under a refusal heading, never under "Signing you in"; F02-U27 offers only Close', async () => {
    const { authCopy } = await import('../src/lib/auth/copy');
    expect(authCopy.verify.refusedTitle).not.toBe(authCopy.verify.title);
    expect(authCopy.verify.refusedTitle).not.toMatch(/\.$/);
    const screen = readFileSync(join(__dirname, '..', 'src/app/(auth)/sign-in/verify.tsx'), 'utf8');
    expect(screen).toMatch(/const refused = error === 'other_phone' \|\| error === 'other_phone_spent' \|\| error === 'already_signed_in';/);
    expect(screen).toMatch(/<SheetTitle>\{refused \? v\.refusedTitle : v\.title\}<\/SheetTitle>/);
    expect(screen).toMatch(/error === 'already_signed_in' \? \(\s*<QuietButton label=\{v\.close\} onPress=\{close\} \/>\s*\) :/);
  });

  it('a pending request over an hour old reads as an expired link, not as "another phone"; no exchange', async () => {
    const { PENDING_REQUEST_KEY, readPendingEmailRequest } = await import('../src/lib/auth/pending');
    const { openEmailLink, PENDING_REQUEST_TTL_MS } = await import('../src/lib/auth/email-link.logic');
    store.set(PENDING_REQUEST_KEY, JSON.stringify({ at: NOW - PENDING_REQUEST_TTL_MS - 1 }));
    expect(await readPendingEmailRequest(NOW)).toBe('expired');
    const exchange = vi.fn(async () => 'b');
    const r = await openEmailLink({ tokenHash: 'pkce_x', type: 'email' }, { readPending: () => readPendingEmailRequest(NOW), signedIn: () => false, exchange, clearPending: async () => {} });
    expect(r).toEqual({ ok: false, error: 'expired' });
    expect(exchange).not.toHaveBeenCalled();
    // An unreadable Keychain is still "no request": refuse with the other-phone words, never guess.
    failReads = true;
    expect(await readPendingEmailRequest(NOW)).toBeNull();
  });
});
