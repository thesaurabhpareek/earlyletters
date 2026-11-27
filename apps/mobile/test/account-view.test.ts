/**
 * Settings > Account's rows for each account state (EXPERIENCE_PASS S56, package P8a; components/auth/account-view.logic.ts),
 * driven through the real state machine (lib/auth/machine.logic.ts, S01's), so the states are the ones the app reaches.
 *
 * S56: "Sign out never drops a queued letter: it waits for the outbox (F16) and says so." The waiting itself is the
 * machine's (test/auth-machine.test.ts); "says so" is this: while the outbox drains, the Sign out row is the waiting
 * line, and only then. LEGAL-REQ-006: "Agree and sync" is offered only to a person who declined, and it opens the
 * sensitive-data step (account.tsx); it is never a one-tap consent.
 */
import { describe, expect, it } from 'vitest';
import { accountView, heldEndedEarly, nextEndedEarly, NOT_ENDED_EARLY, waitEndedEarly, type EndedEarly } from '../src/components/auth/account-view.logic';
import { authReducer, initialAuthState, type AuthEvent, type AuthState, type PendingUploads, type SyncGate } from '../src/lib/auth/machine.logic';

const U = '11111111-1111-4111-8111-111111111111';
const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const run = (events: AuthEvent[], from: AuthState = initialAuthState) => events.reduce(authReducer, from);
const ready = () => run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);

describe('[S56] the Sign out row says when it is waiting for queued letters', () => {
  it('signed in with nothing queued: Sign out, ready', () => {
    expect(accountView(ready(), false).signOut).toBe('ready');
  });

  it('a sign-out with letters still queued: the waiting line, and sync still on', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
    expect(waiting.status).toBe('signingOut');
    const view = accountView(waiting, false);
    expect(view.signOut).toBe('waiting');
    expect(view.sync).toBe('on');
  });

  it('once the outbox has drained the row stops saying it is waiting, and the sign-out finishes', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    const drained = authReducer(waiting, { type: 'UPLOADS_DRAINED' });
    expect(accountView(drained, false).signOut).toBe('closing');
    expect(accountView(authReducer(drained, { type: 'SIGNED_OUT' }), false).signOut).toBe('ready');
  });

  it('a sign-out with nothing queued never says it is waiting', () => {
    const now = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 });
    expect(accountView(now, false).signOut).toBe('closing');
  });
});

describe('[S56] [S55] the Sync rows', () => {
  it('consent missing: "Not set up yet" and Finish setting up, never Agree and sync', () => {
    const missing = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: { ...FULL, termsCurrent: false, contentAllowed: false }, sensitiveDeclined: false }]);
    expect(missing.status).toBe('needsConsent');
    expect(accountView(missing, false)).toMatchObject({ sync: 'waiting', finishSetup: true, offerSync: false });
  });

  it('the claim screen never answered (BL-347): "Not set up yet" and Finish setting up', () => {
    expect(accountView(ready(), true)).toMatchObject({ sync: 'waiting', finishSetup: true, offerSync: false });
  });

  it('declined ("Keep on this phone"): Off, and Agree and sync is offered, which opens the sensitive-data step', () => {
    const declined = run(
      [
        { type: 'RESTORED', userId: U },
        { type: 'GATE_LOADED', gate: { ...FULL, sensitiveData: false, contentAllowed: false }, sensitiveDeclined: false },
        { type: 'CONSENT_RECORDED', step: 'sensitive', accepted: false },
      ],
    );
    expect(declined).toMatchObject({ status: 'ready', sync: 'off' });
    expect(accountView(declined, false)).toMatchObject({ sync: 'off', finishSetup: false, offerSync: true });
  });

  it('on: On, and nothing else to do', () => {
    expect(accountView(ready(), false)).toEqual({ sync: 'on', finishSetup: false, offerSync: false, signOut: 'ready', staySignedIn: false });
  });

  it('offline at launch: waiting for a connection', () => {
    const offline = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_UNAVAILABLE' }]);
    expect(accountView(offline, false)).toMatchObject({ sync: 'unknown', offerSync: false, finishSetup: false });
  });
});

const OFFLINE = () => run([{ type: 'RESTORED', userId: U }, { type: 'GATE_UNAVAILABLE' }]);
const DECLINED_GATE = { type: 'GATE_LOADED', gate: { ...FULL, sensitiveData: false, contentAllowed: false }, sensitiveDeclined: true } as const;

describe('[BL-451] the waiting row shows the sign-out\'s real sync state', () => {
  it('a wait that starts with sync not yet known says so, not "On"', () => {
    const waiting = authReducer(OFFLINE(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    expect(waiting).toMatchObject({ status: 'signingOut', waitingForUploads: true, sync: 'unknown' });
    expect(accountView(waiting, false)).toMatchObject({ signOut: 'waiting', sync: 'unknown' });
  });

  it('a gate answer that turns sync off during the wait shows Off, and the wait ends', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    const off = authReducer(waiting, DECLINED_GATE);
    expect(accountView(off, false)).toMatchObject({ sync: 'off', signOut: 'closing' });
  });
});

describe('[BL-451] "Stay signed in"', () => {
  it('is offered while a sign-out the person asked for waits for queued letters', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    expect(accountView(waiting, false).staySignedIn).toBe(true);
    // And it does what it says: back to signed in, with sync as it was.
    expect(authReducer(waiting, { type: 'SIGN_OUT_WAIT_CANCELLED' })).toEqual({ status: 'ready', userId: U, sync: 'on' });
  });

  it('is not offered when the sign-out was not the person\'s own (an Apple revocation signs out once the letters are up)', () => {
    const revoked = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 1 });
    expect(revoked).toMatchObject({ status: 'signingOut', waitingForUploads: true });
    expect(accountView(revoked, false).staySignedIn).toBe(false);
  });

  it('a drain that lands just after "Stay signed in" changes nothing: the person stays signed in', () => {
    // The 10 s poll's in-flight pendingUploads() or the drain listener can answer right after the tap.
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    const stayed = authReducer(waiting, { type: 'SIGN_OUT_WAIT_CANCELLED' });
    const late = authReducer(stayed, { type: 'UPLOADS_DRAINED' });
    expect(late).toEqual({ status: 'ready', userId: U, sync: 'on' });
    expect(accountView(late, false)).toMatchObject({ signOut: 'ready', staySignedIn: false });
    expect(waitEndedEarly(stayed, late)).toBe(false);
  });

  it('is not offered while the sign-out is closing, where cancelling does nothing', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    const drained = authReducer(waiting, { type: 'UPLOADS_DRAINED' });
    expect(accountView(drained, false)).toMatchObject({ signOut: 'closing', staySignedIn: false });
    expect(authReducer(drained, { type: 'SIGN_OUT_WAIT_CANCELLED' })).toBe(drained);
    const now = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 });
    expect(accountView(now, false).staySignedIn).toBe(false);
  });
});

describe('[BL-451] a wait that ends before the letters are sent is said on the signed-out page', () => {
  const waiting = () => authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });

  it('a gate answer that turns sync off ends it early', () => {
    const w = waiting();
    expect(waitEndedEarly(w, authReducer(w, DECLINED_GATE))).toBe(true);
  });

  it('a session lost during the wait ends it early', () => {
    const w = waiting();
    expect(waitEndedEarly(w, authReducer(w, { type: 'SESSION_LOST' }))).toBe(true);
  });

  it('SIGNED_OUT during the wait (what "Sign out other devices" and a lost session give the provider) ends it early, with no error', () => {
    // The provider never dispatches SESSION_LOST; Supabase's SIGNED_OUT event is what arrives.
    const w = waiting();
    const out = authReducer(w, { type: 'SIGNED_OUT' });
    expect(out).toEqual({ status: 'signedOut' });
    expect(waitEndedEarly(w, out)).toBe(true);
  });

  it('a drained outbox is the wait ending as it should, and so is everything after it', () => {
    const w = waiting();
    const drained = authReducer(w, { type: 'UPLOADS_DRAINED' });
    expect(waitEndedEarly(w, drained)).toBe(false);
    expect(waitEndedEarly(drained, authReducer(drained, { type: 'SIGNED_OUT' }))).toBe(false);
  });

  it('"Stay signed in" is not an early end, and nothing before a wait is either', () => {
    const w = waiting();
    expect(waitEndedEarly(w, authReducer(w, { type: 'SIGN_OUT_WAIT_CANCELLED' }))).toBe(false);
    expect(waitEndedEarly(ready(), w)).toBe(false);
    expect(waitEndedEarly(w, w)).toBe(false);
  });
});

describe('[BL-451] the signed-out page\'s early-end line, one state change at a time (nextEndedEarly, as the auth provider calls it)', () => {
  /** Each event through the real machine, then the line's step, as the auth provider takes it: [shown, announced]. */
  const walk = (from: AuthState, events: AuthEvent[], shown = false) => {
    let s = from;
    let on = shown;
    return events.map((e) => {
      const next = authReducer(s, e);
      const step = nextEndedEarly(s, next, on);
      s = next;
      on = step.shown;
      return [step.shown, step.announce] as const;
    });
  };
  const waiting = () => authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
  const LOST: AuthEvent = { type: 'SIGNED_OUT' };

  it.each([
    ['a wait that drains, then signs out: no line', [{ type: 'UPLOADS_DRAINED' }, LOST], [[false, false], [false, false]]],
    ['the session ends during the wait: the line, said once', [LOST], [[true, true]]],
    ['SESSION_LOST during the wait: the same', [{ type: 'SESSION_LOST' }], [[true, true]]],
    [
      'the gate turns sync off during the wait: the line waits for the signed-out page, then is said once',
      [DECLINED_GATE, LOST],
      [[true, false], [true, true]],
    ],
    ['"Stay signed in": no line', [{ type: 'SIGN_OUT_WAIT_CANCELLED' }, { type: 'UPLOADS_DRAINED' }], [[false, false], [false, false]]],
  ] as [string, AuthEvent[], (readonly [boolean, boolean])[]][])('%s', (_name, events, steps) => {
    expect(walk(waiting(), events)).toEqual(steps);
  });

  it('stays while signed out and while signing in, is never said twice, and goes once signed in again', () => {
    const steps = walk(waiting(), [
      LOST,
      { type: 'START', method: 'email' },
      { type: 'CANCELLED' },
      { type: 'START', method: 'email' },
      { type: 'SIGNED_IN', userId: U, method: 'email' },
    ]);
    expect(steps).toEqual([
      [true, true],
      [true, false],
      [true, false],
      [true, false],
      [false, false],
    ]);
  });

  it('a re-run with no change says nothing again, and a visit while signed out shows nothing', () => {
    const out = authReducer(waiting(), LOST);
    expect(nextEndedEarly(out, out, true)).toEqual({ shown: true, announce: false });
    expect(nextEndedEarly(out, out, false)).toEqual({ shown: false, announce: false });
    expect(nextEndedEarly(ready(), ready(), false)).toEqual({ shown: false, announce: false });
  });
});

describe('[BL-479][CPO-105] the line as the auth provider holds it (heldEndedEarly): it outlives the Account page', () => {
  /** Each event through the real machine, then the provider's step; returns every held value in order. */
  const hold = (from: AuthState, events: AuthEvent[], start: EndedEarly = NOT_ENDED_EARLY) => {
    let s = from;
    let held = start;
    return events.map((e) => {
      const next = authReducer(s, e);
      held = heldEndedEarly(s, next, held);
      s = next;
      return held;
    });
  };
  const waiting = () => authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
  const LOST: AuthEvent = { type: 'SIGNED_OUT' };

  it('ends early, then holds through every later change while signed out: `said` moves once, when it first shows signed out', () => {
    expect(hold(waiting(), [DECLINED_GATE, LOST, { type: 'START', method: 'email' }, { type: 'CANCELLED' }])).toEqual([
      { shown: true, said: 0 },
      { shown: true, said: 1 },
      { shown: true, said: 1 },
      { shown: true, said: 1 },
    ]);
  });

  it('goes at the next sign-in, and a second early end later is said again', () => {
    const steps = hold(waiting(), [
      LOST,
      { type: 'SIGNED_IN', userId: U, method: 'email' },
      { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false },
      { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 },
      LOST,
    ]);
    expect(steps.map((h) => h.shown)).toEqual([true, false, false, false, true]);
    expect(steps.map((h) => h.said)).toEqual([1, 1, 1, 1, 2]);
  });

  it('a change that moves nothing gives back the same object (the provider renders nothing more)', () => {
    const out = authReducer(waiting(), LOST);
    const held = { shown: true, said: 1 };
    expect(heldEndedEarly(out, out, held)).toBe(held);
    expect(heldEndedEarly(ready(), ready(), NOT_ENDED_EARLY)).toBe(NOT_ENDED_EARLY);
  });

  it('a wait that drains, or "Stay signed in": nothing held', () => {
    expect(hold(waiting(), [{ type: 'UPLOADS_DRAINED' }, LOST]).at(-1)).toEqual(NOT_ENDED_EARLY);
    expect(hold(waiting(), [{ type: 'SIGN_OUT_WAIT_CANCELLED' }]).at(-1)).toEqual(NOT_ENDED_EARLY);
  });
});

describe('[BL-478] point 2: a gate answer after the queue already emptied is no early end (A-REQ-033)', () => {
  /** The same walk as the auth provider's: each event through the real machine, then the early-end line's step. */
  const walk = (from: AuthState, events: AuthEvent[]) => {
    let s = from;
    let on = false;
    return events.map((e) => {
      const next = authReducer(s, e);
      const step = nextEndedEarly(s, next, on);
      s = next;
      on = step.shown;
      return [step.shown, step.announce] as const;
    });
  };
  const waiting = () => authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
  /** Sync turned off by a gate answer, with the queue as readGateInOrder read it after that answer. */
  const offWith = (pendingUploads: PendingUploads | number): AuthEvent => ({ ...DECLINED_GATE, pendingUploads });
  const LOST: AuthEvent = { type: 'SIGNED_OUT' };

  it('the mutant: the outbox emptied, then a gate answer turned sync off before the drain was noticed: no line, then or signed out', () => {
    expect(walk(waiting(), [offWith(0), LOST])).toEqual([[false, false], [false, false]]);
    expect(walk(waiting(), [offWith({ kind: 'count', n: 0 }), LOST])).toEqual([[false, false], [false, false]]);
  });

  it('the wait still ends at once and nothing more is sent', () => {
    const w = waiting();
    const ended = authReducer(w, offWith(0));
    expect(accountView(ended, false)).toMatchObject({ signOut: 'closing', staySignedIn: false });
    expect(waitEndedEarly(w, ended)).toBe(false);
  });

  it('letters still queued, a queue that could not be read, or no count at all: the line, as before', () => {
    for (const e of [offWith(1), offWith({ kind: 'unknown' }), DECLINED_GATE] as AuthEvent[]) {
      expect(walk(waiting(), [e, LOST])).toEqual([[true, false], [true, true]]);
    }
  });

  it('a wait that began before the gate was read and then drained (sync still unknown) is no early end either', () => {
    const blind = authReducer(OFFLINE(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: { kind: 'unknown' } });
    expect(walk(blind, [{ type: 'UPLOADS_DRAINED' }, LOST])).toEqual([[false, false], [false, false]]);
    expect(walk(blind, [offWith(0), LOST])).toEqual([[false, false], [false, false]]);
    expect(walk(blind, [offWith(3), LOST])).toEqual([[true, false], [true, true]]);
  });
});

describe('[BL-478] point 3: an Apple revocation during the person\'s own wait takes "Stay signed in" away (A-REQ-033)', () => {
  it('the row goes once the revocation is held, and the wait is the revocation\'s', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
    expect(accountView(waiting, false).staySignedIn).toBe(true);
    const revoked = authReducer(waiting, { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 2 });
    expect(revoked).toMatchObject({ status: 'signingOut', reason: 'apple_revoked', waitingForUploads: true, sync: 'on' });
    expect(accountView(revoked, false)).toMatchObject({ signOut: 'waiting', staySignedIn: false });
    expect(waitEndedEarly(waiting, revoked)).toBe(false);
  });
});
