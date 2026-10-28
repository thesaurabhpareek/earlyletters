/// <reference types="node" />
/**
 * S01: a sign-out that waits for queued letters can always end (review of PR #310). Offline at
 * launch the consent gate is never read (`sync: 'unknown'`). Sign out with letters queued then
 * waited for an outbox that could not drain (canSync false), GATE_LOADED was ignored while
 * signing out and the foreground re-check ran only in `ready`, so the Account screen waited until
 * the app restarted. Now the gate is read when such a wait starts and on foreground, GATE_LOADED
 * is honoured while waiting, and the person can cancel the wait (back to signed in, nothing
 * deleted, nothing sent). Also: the address typed for an email sign-in is forgotten after a link
 * sign-in and after sign-out, not only by the code screen.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authReducer,
  canSync,
  initialAuthState,
  isSignedIn,
  shouldFinishSignOut,
  shouldRecheckGate,
  type AuthEvent,
  type AuthState,
  type SyncGate,
} from '../src/lib/auth/machine.logic';
import { setServerFeaturesForTests } from '../src/lib/capabilities';

const store = new Map<string, string>();
const secure = {
  getItem: vi.fn(async (k: string) => store.get(k) ?? null),
  setItem: vi.fn(async (k: string, v: string) => void store.set(k, v)),
  removeItem: vi.fn(async (k: string) => void store.delete(k)),
};
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: secure }));

const U = '0192f0aa-0000-7000-8000-000000000001';
const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const NEW_ACCOUNT: SyncGate = { termsCurrent: false, ageAttested: false, sensitiveData: false, contentAllowed: false };
const DECLINED: SyncGate = { ...FULL, sensitiveData: false, contentAllowed: false };
const ASHA_EMAIL = 'asha.parent@example.com';

const run = (events: AuthEvent[], from: AuthState = initialAuthState): AuthState => events.reduce(authReducer, from);
const ask = (pendingUploads: number, reason: 'user' | 'apple_revoked' = 'user'): AuthEvent => ({ type: 'SIGN_OUT_REQUESTED', reason, pendingUploads });
const gate = (g: SyncGate, sensitiveDeclined = false): AuthEvent => ({ type: 'GATE_LOADED', gate: g, sensitiveDeclined });
const CANCEL: AuthEvent = { type: 'SIGN_OUT_WAIT_CANCELLED' };

/** Offline at launch: signed in, the gate never read. */
const blind = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_UNAVAILABLE' }]);
const readyOn = run([{ type: 'RESTORED', userId: U }, gate(FULL)]);

describe('S01: a sign-out wait that began offline can end (A-REQ-033)', () => {
  it('the hang: offline at launch, two letters queued, Sign out; the gate then loads with sync on', () => {
    expect(blind).toEqual({ status: 'ready', userId: U, sync: 'unknown' });
    const waiting = authReducer(blind, ask(2));
    expect(waiting).toEqual({ status: 'signingOut', userId: U, reason: 'user', waitingForUploads: true, sync: 'unknown' });
    // The outbox cannot drain yet, and nothing has finished.
    expect(canSync(waiting)).toBe(false);
    expect(shouldFinishSignOut(waiting)).toBe(false);
    const after = authReducer(waiting, gate(FULL));
    // Before S01 GATE_LOADED was ignored here: neither true, so the wait never ended.
    expect(canSync(after) || shouldFinishSignOut(after)).toBe(true);
    expect(after).toEqual({ status: 'signingOut', userId: U, reason: 'user', waitingForUploads: true, sync: 'on' });
    expect(canSync(after)).toBe(true);
    const drained = authReducer(after, { type: 'UPLOADS_DRAINED' });
    expect(shouldFinishSignOut(drained)).toBe(true);
    expect(authReducer(drained, { type: 'SIGNED_OUT' })).toEqual({ status: 'signedOut' });
  });

  it('sync off on the server (sensitive-data declined): the wait ends at once, exactly like signing out with sync off today', () => {
    const waiting = authReducer(blind, ask(2));
    const off = authReducer(waiting, gate(DECLINED, true));
    expect(off).toEqual({ status: 'signingOut', userId: U, reason: 'user', waitingForUploads: false, sync: 'off' });
    expect(shouldFinishSignOut(off)).toBe(true);
    expect(canSync(off)).toBe(false);
    // Today, with sync already off: no wait, the queued letters stay on this phone (the outbox is not touched).
    expect(authReducer({ status: 'ready', userId: U, sync: 'off' }, ask(2))).toEqual(off);
  });

  it('consent not given (new Terms, age line missing, sensitive-data never answered): the wait ends, nothing uploads', () => {
    const waiting = authReducer(blind, ask(2));
    const notGiven: SyncGate[] = [NEW_ACCOUNT, { ...FULL, termsCurrent: false, contentAllowed: false }, { ...FULL, ageAttested: false, contentAllowed: false }, DECLINED];
    for (const g of notGiven) {
      const s = authReducer(waiting, gate(g, false));
      expect(shouldFinishSignOut(s), JSON.stringify(g)).toBe(true);
      expect(canSync(s), JSON.stringify(g)).toBe(false);
    }
    // The same as asking to sign out while consent is still needed (no wait there either).
    const needs = run([{ type: 'RESTORED', userId: U }, gate(NEW_ACCOUNT)]);
    expect(shouldFinishSignOut(authReducer(needs, ask(2)))).toBe(true);
  });

  it('whatever the gate says, the wait either drains or finishes: never stuck', () => {
    const waiting = authReducer(blind, ask(5));
    for (let bits = 0; bits < 32; bits++) {
      const g: SyncGate = { termsCurrent: !!(bits & 1), ageAttested: !!(bits & 2), sensitiveData: !!(bits & 4), contentAllowed: !!(bits & 8) };
      const s = authReducer(waiting, gate(g, !!(bits & 16)));
      expect(canSync(s) || shouldFinishSignOut(s), `${JSON.stringify(g)} declined=${!!(bits & 16)}`).toBe(true);
    }
  });

  it('still offline: the wait stays as it is, and the provider reads the gate again on foreground', () => {
    const waiting = authReducer(blind, ask(2));
    expect(authReducer(waiting, { type: 'GATE_UNAVAILABLE' })).toBe(waiting);
    expect(shouldRecheckGate(waiting, false)).toBe(true);
  });

  it('a wait with sync on: the same answer changes nothing; consent withdrawn elsewhere ends it', () => {
    const onWait = authReducer(readyOn, ask(3));
    expect(authReducer(onWait, gate(FULL))).toBe(onWait);
    const withdrawn = authReducer(onWait, gate(DECLINED, true));
    expect(shouldFinishSignOut(withdrawn)).toBe(true);
    expect(canSync(withdrawn)).toBe(false);
  });

  it('a gate read that lands while a sign-out is already finishing never turns it back into a wait', () => {
    const finishing = authReducer(blind, ask(0));
    expect(shouldFinishSignOut(finishing)).toBe(true);
    expect(authReducer(finishing, gate(FULL))).toBe(finishing);
    expect(authReducer(finishing, gate(DECLINED, true))).toBe(finishing);
  });
});

describe('S01: when the provider reads the gate again (shouldRecheckGate)', () => {
  it('ready: when never read or stale, as before', () => {
    expect(shouldRecheckGate(blind, false)).toBe(true);
    expect(shouldRecheckGate(readyOn, false)).toBe(false);
    expect(shouldRecheckGate(readyOn, true)).toBe(true);
    expect(shouldRecheckGate({ status: 'ready', userId: U, sync: 'off' }, true)).toBe(true);
  });

  it('a sign-out waiting for uploads: when never read (on entering the wait and on foreground) or stale', () => {
    expect(shouldRecheckGate(authReducer(blind, ask(2)), false)).toBe(true);
    const onWait = authReducer(readyOn, ask(3));
    expect(shouldRecheckGate(onWait, false)).toBe(false);
    expect(shouldRecheckGate(onWait, true)).toBe(true);
  });

  it('nothing else, even when stale (a finishing sign-out, signed out, still consenting)', () => {
    const others: AuthState[] = [
      authReducer(blind, ask(0)),
      { status: 'signedOut' },
      { status: 'restoring' },
      { status: 'checkingConsent', userId: U, method: null },
      { status: 'needsConsent', userId: U, method: null, steps: ['terms'] },
    ];
    for (const s of others) expect(shouldRecheckGate(s, true), s.status).toBe(false);
  });
});

describe('S01: cancelling the wait (cancelSignOutWait)', () => {
  it('[A-REQ-033] back to signed in exactly as before: same account, same sync, nothing finishing, the queue keeps uploading', () => {
    const s = authReducer(authReducer(readyOn, ask(3)), CANCEL);
    expect(s).toEqual(readyOn);
    expect(isSignedIn(s)).toBe(true);
    expect(shouldFinishSignOut(s)).toBe(false);
    expect(canSync(s)).toBe(true);
  });

  it('a wait that began offline goes back to the offline signed-in state; a later gate read works as usual', () => {
    const s = authReducer(authReducer(blind, ask(2)), CANCEL);
    expect(s).toEqual(blind);
    expect(authReducer(s, gate(FULL))).toEqual({ status: 'ready', userId: U, sync: 'on' });
  });

  it('keeps what the gate said during the wait', () => {
    const s = run([ask(2), gate(FULL), CANCEL], blind);
    expect(s).toEqual({ status: 'ready', userId: U, sync: 'on' });
  });

  it('nothing to cancel: a sign-out already finishing, an Apple revocation, or no sign-out at all', () => {
    const finishing = authReducer(readyOn, ask(0));
    expect(authReducer(finishing, CANCEL)).toBe(finishing);
    const revoked = authReducer(readyOn, ask(2, 'apple_revoked'));
    expect(revoked.status === 'signingOut' && revoked.waitingForUploads).toBe(true);
    expect(authReducer(revoked, CANCEL)).toBe(revoked);
    expect(authReducer(readyOn, CANCEL)).toBe(readyOn);
    const out: AuthState = { status: 'signedOut' };
    expect(authReducer(out, CANCEL)).toBe(out);
  });
});

describe('S01: the session provider wiring', () => {
  const provider = () =>
    readFileSync(join(__dirname, '..', 'src/lib/auth/session-provider.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

  it('reads the gate when a sign-out starts waiting without it, and on foreground while waiting', () => {
    const src = provider();
    expect(src).toMatch(/const waitingBlind = state\.status === 'signingOut' && shouldRecheckGate\(state, false\);\s*useEffect\(\(\) => \{\s*if \(waitingBlind\) void checkGate\(\);\s*\}, \[waitingBlind, checkGate\]\);/);
    expect(src).toMatch(/if \(shouldRecheckGate\(stateRef\.current, Date\.now\(\) - lastGateCheck\.current > GATE_RECHECK_MS\)\) void checkGate\(\);/);
  });

  it('cancelSignOutWait only moves the machine: no Supabase call, nothing deleted, nothing sent', () => {
    expect(provider()).toMatch(/cancelSignOutWait\(\) \{\s*dispatch\(\{ type: 'SIGN_OUT_WAIT_CANCELLED' \}\);\s*\},/);
  });
});

describe('S01: the typed address is forgotten after a link sign-in and after sign-out', () => {
  beforeEach(() => {
    store.clear();
    setServerFeaturesForTests(true);
  });
  afterEach(() => setServerFeaturesForTests(null));

  it('a link sign-in spends the pending request, and the address with it', async () => {
    const { clearPendingEmailRequest, getPendingEmail, notePendingEmailRequest, readPendingEmailRequest, setPendingEmail } = await import('../src/lib/auth/pending');
    const { openEmailLink } = await import('../src/lib/auth/email-link.logic');
    await notePendingEmailRequest();
    setPendingEmail(ASHA_EMAIL);
    const r = await openEmailLink(
      { tokenHash: 'pkce_0123456789abcdef', type: 'magiclink' },
      { readPending: () => readPendingEmailRequest(), signedIn: () => false, exchange: async () => U, clearPending: () => clearPendingEmailRequest() },
    );
    expect(r).toEqual({ ok: true, userId: U });
    expect(getPendingEmail()).toBeNull();
    expect(await readPendingEmailRequest()).toBeNull();
  });

  it('a refused link keeps the address, so the person can still type the code', async () => {
    const { clearPendingEmailRequest, getPendingEmail, readPendingEmailRequest, setPendingEmail } = await import('../src/lib/auth/pending');
    const { openEmailLink } = await import('../src/lib/auth/email-link.logic');
    setPendingEmail(ASHA_EMAIL);
    const r = await openEmailLink(
      { tokenHash: 'pkce_0123456789abcdef', type: 'magiclink' },
      { readPending: () => readPendingEmailRequest(), signedIn: () => false, exchange: async () => U, clearPending: () => clearPendingEmailRequest() },
    );
    expect(r).toEqual({ ok: false, error: 'other_phone' });
    expect(getPendingEmail()).toBe(ASHA_EMAIL);
    setPendingEmail(null);
  });

  // Every sign-out path (finishing a sign-out, a sign-out Supabase made, the under-18 stop, "Not my account")
  // calls clearPendingEmailRequest: asserted in auth-email-link.test.ts. That call now forgets the address too.
  it('a sign-out forgets the address, with server features on or off (memory only, no Keychain read)', async () => {
    const { clearPendingEmailRequest, getPendingEmail, setPendingEmail } = await import('../src/lib/auth/pending');
    setPendingEmail(ASHA_EMAIL);
    await clearPendingEmailRequest();
    expect(getPendingEmail()).toBeNull();
    setServerFeaturesForTests(false);
    secure.removeItem.mockClear();
    setPendingEmail(ASHA_EMAIL);
    await clearPendingEmailRequest();
    expect(getPendingEmail()).toBeNull();
    expect(secure.removeItem).not.toHaveBeenCalled();
  });
});
