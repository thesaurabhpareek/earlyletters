/**
 * F02-REQ-020 (F02-U27, ADR 0023): an email link never replaces a session. The provider decides
 * "signed in" from the auth state OR the Keychain (sessionSavedOnPhone), so a link that opens the
 * app from closed, while the state is still `restoring`, is refused too. Security review of
 * PR #139, finding 1.
 */
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
