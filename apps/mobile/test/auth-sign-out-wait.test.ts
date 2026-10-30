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
  readGateInOrder,
  shouldFinishSignOut,
  shouldRecheckGate,
  signOutWouldWait,
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
    const notGiven: SyncGate[] = [
      NEW_ACCOUNT,
      { ...FULL, termsCurrent: false, contentAllowed: false },
      { ...FULL, ageAttested: false, contentAllowed: false },
      DECLINED,
      // contentAllowed alone is not enough: a step still needed ends the wait too.
      { ...FULL, termsCurrent: false },
      { ...FULL, ageAttested: false },
    ];
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

describe('S01: overlapping gate reads (readGateInOrder)', () => {
  type Answer = { gate: SyncGate; sensitiveDeclined: boolean };
  /** A gate read the test answers by hand, in any order. */
  const pendingRead = () => {
    let answer!: (a: Answer) => void;
    let fail!: () => void;
    const p = new Promise<Answer>((res, rej) => {
      answer = res;
      fail = () => rej(new Error('offline'));
    });
    return { load: () => p, answer, fail };
  };

  it('an older answer that lands after a newer one is dropped: a late "off" never ends the wait the newer "on" let drain', async () => {
    const seq = { current: 0 };
    let state = authReducer(blind, ask(2));
    const dispatch = (e: AuthEvent) => void (state = authReducer(state, e));
    const older = pendingRead();
    const newer = pendingRead();
    const first = readGateInOrder(seq, older.load, dispatch);
    const second = readGateInOrder(seq, newer.load, dispatch);
    newer.answer({ gate: FULL, sensitiveDeclined: false });
    await second;
    expect(state).toEqual({ status: 'signingOut', userId: U, reason: 'user', waitingForUploads: true, sync: 'on' });
    older.answer({ gate: DECLINED, sensitiveDeclined: true });
    await first;
    expect(state.status === 'signingOut' && state.waitingForUploads && state.sync).toBe('on');
    expect(canSync(state)).toBe(true);
  });

  it('an older failure after a newer answer dispatches nothing; the newest read answers, success or failure', async () => {
    const seq = { current: 0 };
    const seen: AuthEvent[] = [];
    const older = pendingRead();
    const newer = pendingRead();
    const first = readGateInOrder(seq, older.load, (e) => seen.push(e));
    const second = readGateInOrder(seq, newer.load, (e) => seen.push(e));
    newer.answer({ gate: FULL, sensitiveDeclined: false });
    await second;
    older.fail();
    await first;
    expect(seen).toEqual([{ type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);
    const alone = pendingRead();
    const third = readGateInOrder(seq, alone.load, (e) => seen.push(e));
    alone.fail();
    await third;
    expect(seen).toEqual([{ type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }, { type: 'GATE_UNAVAILABLE' }]);
  });
});

describe('S01: what signOut() returns (signOutWouldWait)', () => {
  it('a wait that begins while sync is unknown says "waiting", as the machine does (canSync said no)', () => {
    expect(canSync(blind)).toBe(false);
    expect(signOutWouldWait(blind, 2)).toBe(true);
    expect(authReducer(blind, ask(2))).toMatchObject({ waitingForUploads: true });
  });

  it('the same rule as SIGN_OUT_REQUESTED everywhere else', () => {
    expect(signOutWouldWait(readyOn, 3)).toBe(true);
    expect(signOutWouldWait(readyOn, 0)).toBe(false);
    expect(signOutWouldWait({ status: 'ready', userId: U, sync: 'off' }, 3)).toBe(false);
    expect(signOutWouldWait(run([{ type: 'RESTORED', userId: U }, gate(NEW_ACCOUNT)]), 3)).toBe(false);
    expect(signOutWouldWait({ status: 'signedOut' }, 3)).toBe(false);
    expect(signOutWouldWait(authReducer(readyOn, ask(3)), 3)).toBe(true);
  });
});

describe('S01: the session provider wiring', () => {
  const provider = () =>
    readFileSync(join(__dirname, '..', 'src/lib/auth/session-provider.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

  it('reads the gate when a sign-out starts waiting without it', () => {
    expect(provider()).toMatch(/const waitingBlind = state\.status === 'signingOut' && shouldRecheckGate\(state, false\);\s*useEffect\(\(\) => \{\s*if \(waitingBlind\) void checkGate\(\);\s*\}, \[waitingBlind, checkGate\]\);/);
  });

  it('the whole foreground listener: active only, the shared re-check rule, removed on unmount', () => {
    expect(provider()).toMatch(
      /useEffect\(\(\) => \{\s*const sub = AppState\.addEventListener\('change', \(s\) => \{\s*if \(s !== 'active'\) return;\s*if \(shouldRecheckGate\(stateRef\.current, Date\.now\(\) - lastGateCheck\.current > GATE_RECHECK_MS\)\) void checkGate\(\);\s*\}\);\s*return \(\) => sub\.remove\(\);\s*\}, \[checkGate\]\);/,
    );
  });

  it('the whole wait effect: drained or polled, the poll re-reads a gate never read, both stop with the wait', () => {
    expect(provider()).toMatch(
      /const waiting = state\.status === 'signingOut' && state\.waitingForUploads;\s*useEffect\(\(\) => \{\s*if \(!waiting\) return;\s*const done = \(\) => dispatch\(\{ type: 'UPLOADS_DRAINED' \}\);\s*const off = onUploadsDrained\(done\);\s*const poll = setInterval\(\(\) => \{\s*if \(shouldRecheckGate\(stateRef\.current, false\)\) void checkGate\(\);\s*void pendingUploads\(\)\.then\(\(n\) => n === 0 && done\(\)\);\s*\}, 10_000\);\s*return \(\) => \{\s*off\(\);\s*clearInterval\(poll\);\s*\};\s*\}, \[waiting, checkGate\]\);/,
    );
  });

  it('every gate read goes through readGateInOrder with one sequence for the provider', () => {
    const src = provider();
    expect(src).toMatch(/const gateSeq = useRef\(0\);\s*const checkGate = useCallback\(async \(\) => \{\s*if \(!sb\) return;\s*lastGateCheck\.current = Date\.now\(\);\s*await readGateInOrder\(gateSeq, \(\) => withTimeout\(loadSyncGate\(sb\), GATE_TIMEOUT_MS\), dispatch\);\s*\}, \[sb\]\);/);
    expect(src.match(/loadSyncGate\(/g)).toHaveLength(1);
    expect(src).not.toMatch(/type: 'GATE_(LOADED|UNAVAILABLE)'/);
  });

  it('signOut() answers with the machine rule, read after the queue count', () => {
    expect(provider()).toMatch(
      /async signOut\(\) \{\s*const pending = await pendingUploads\(\);\s*const waits = signOutWouldWait\(stateRef\.current, pending\);\s*dispatch\(\{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: pending \}\);\s*return waits \? 'waiting' : 'done';\s*\},/,
    );
  });

  it('cancelSignOutWait only moves the machine: no Supabase call, nothing deleted, nothing sent', () => {
    expect(provider()).toMatch(/cancelSignOutWait\(\) \{\s*dispatch\(\{ type: 'SIGN_OUT_WAIT_CANCELLED' \}\);\s*\},/);
  });

  it('"Not my account", a code sign-in and a link sign-in spend the pending request (and so the address)', () => {
    const src = provider();
    expect(src).toMatch(/async notMyAccount\(\) \{\s*dispatch\(\{ type: 'SIGN_OUT_REQUESTED', reason: 'switch_account', pendingUploads: 0 \}\);\s*await clearPendingEmailRequest\(\);\s*\},/);
    expect(src).toMatch(/clearWrongCodes\(email\);\s*await clearPendingEmailRequest\(\);/);
    expect(src).toMatch(/clearPending: \(\) => clearPendingEmailRequest\(\),/);
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

  // Every sign-out path calls clearPendingEmailRequest: finishing a sign-out, a sign-out Supabase made and the
  // under-18 stop are pinned in auth-email-link.test.ts, "Not my account" in the wiring block above. That call
  // now forgets the address too.
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
