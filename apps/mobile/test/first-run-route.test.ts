/**
 * What the onboarding route asks the sign-in-first gate (lib/first-run/route.logic.ts; NX-31 R17, R18, R22), tested as
 * behaviour with the real build switch (setServerFeaturesForTests), not as a pattern in the screen's source. Pure, no
 * phone, no network.
 *
 * The things a reviewer mutated on 10 Nov and found unprotected: the switch passed as `true`, the book flag passed as
 * `false`, and the auth state ignored. Each fails a test below. And the Continue button's scope: the gate hides it on
 * the welcome only, never on a later step.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { setServerFeaturesForTests } from '../src/lib/capabilities';
import {
  continueMayShow,
  continueTapIsLocalStart,
  welcomeBeginAllowed,
} from '../src/lib/first-run/route.logic';

afterEach(() => setServerFeaturesForTests(null));

const RESTORING: AuthState = { status: 'restoring' };
const SIGNED_OUT: AuthState = { status: 'signedOut' };
const SESSION_EXPIRED: AuthState = { status: 'signedOut', error: 'session_expired' };
const OUTAGE: AuthState = { status: 'signedOut', error: 'network' };
const SIGNING_IN: AuthState = { status: 'signingIn', method: 'email' };
const AWAITING_CODE: AuthState = { status: 'awaitingCode', sentAt: 1 };
const CHECKING: AuthState = { status: 'checkingConsent', userId: 'u', method: null };
const NEEDS_CONSENT: AuthState = { status: 'needsConsent', userId: 'u', method: null, steps: ['terms'] };
const READY: AuthState = { status: 'ready', userId: 'u', sync: 'on' };
const SIGNING_OUT: AuthState = { status: 'signingOut', userId: 'u', reason: 'user', waitingForUploads: false, sync: 'on' };
const ALL: AuthState[] = [RESTORING, SIGNED_OUT, SESSION_EXPIRED, OUTAGE, SIGNING_IN, AWAITING_CODE, CHECKING, NEEDS_CONSENT, READY, SIGNING_OUT];

const allowed = (authState: AuthState, book: boolean, localStartChosen = false) =>
  welcomeBeginAllowed({ authState, hasLocalBook: () => book, localStartChosen });

describe('[NX-31-R17] servers off: the route asks nothing, and the answer is the one Build 11 gave', () => {
  it('[NX-31-R17] "Begin the book" is allowed in every auth state, with and without a book, with and without the latch', () => {
    setServerFeaturesForTests(false);
    for (const state of ALL) for (const book of [true, false]) for (const chosen of [true, false]) {
      expect(allowed(state, book, chosen), `${state.status} book:${book} chosen:${chosen}`).toBe(true);
    }
  });
  it('[NX-31-R17] Continue is exactly the join wait\'s answer, on every step', () => {
    setServerFeaturesForTests(false);
    for (const state of ALL) for (const begin of [true, false]) for (const onWelcome of [true, false]) {
      const shows = continueMayShow({ begin, onWelcome, authState: state, hasLocalBook: () => false, localStartChosen: false });
      expect(shows, `${state.status} begin:${begin} welcome:${onWelcome}`).toBe(begin);
    }
  });
  it('[NX-31-R17] the book list is not read at all with the switch off', () => {
    setServerFeaturesForTests(false);
    const listed = vi.fn(() => true);
    for (const state of ALL) {
      welcomeBeginAllowed({ authState: state, hasLocalBook: listed, localStartChosen: false });
      continueMayShow({ begin: true, onWelcome: true, authState: state, hasLocalBook: listed, localStartChosen: false });
    }
    expect(listed).not.toHaveBeenCalled();
  });
  it('[NX-31-R18] a tap on Begin never counts as the local start with the switch off', () => {
    setServerFeaturesForTests(false);
    for (const state of ALL) expect(continueTapIsLocalStart({ onWelcome: true, authState: state })).toBe(false);
  });
});

describe('[NX-31-R17] servers on: "Begin the book" on the welcome', () => {
  it('[NX-31-R17] while the session is being read, and with no session, no book and no failure, it waits', () => {
    setServerFeaturesForTests(true);
    for (const state of [RESTORING, SIGNED_OUT, SESSION_EXPIRED, SIGNING_IN, AWAITING_CODE]) {
      expect(allowed(state, false), state.status).toBe(false);
    }
  });
  it('[NX-31-R17] a session shows it, whatever the session is doing', () => {
    setServerFeaturesForTests(true);
    for (const state of [CHECKING, NEEDS_CONSENT, READY, SIGNING_OUT]) {
      expect(allowed(state, false), state.status).toBe(true);
    }
  });
  it('[NX-31-R22] a book on the phone shows it in every auth state, so an ended session never locks a person out', () => {
    setServerFeaturesForTests(true);
    for (const state of ALL) expect(allowed(state, true), state.status).toBe(true);
  });
  it('[NX-31-R18] a failed sign-in (an outage) shows it as the local start; a plain signed-out state does not', () => {
    setServerFeaturesForTests(true);
    expect(allowed(OUTAGE, false)).toBe(true);
    expect(allowed(SIGNED_OUT, false)).toBe(false);
    expect(allowed({ status: 'signedOut', error: 'wrong_code' }, false)).toBe(false);
  });
  it('[NX-31-R18] once the local start was chosen the button stays, whatever sign-in does next', () => {
    setServerFeaturesForTests(true);
    // chosen in an outage; then the service is healthy, or a sign-in link starts: not pulled back to sign-in
    for (const state of [OUTAGE, SIGNED_OUT, SESSION_EXPIRED, SIGNING_IN, AWAITING_CODE]) {
      expect(allowed(state, false, true), state.status).toBe(true);
      // without the latch only the outage itself shows it
      expect(allowed(state, false, false), `${state.status} unlatched`).toBe(state === OUTAGE);
    }
  });
  it('[NX-31-R17] the book list is read once, and only with the switch on', () => {
    setServerFeaturesForTests(true);
    const listed = vi.fn(() => false);
    welcomeBeginAllowed({ authState: SIGNED_OUT, hasLocalBook: listed, localStartChosen: false });
    expect(listed).toHaveBeenCalledTimes(1);
  });
});

describe('[NX-31-R17] the gate hides Continue on the welcome only', () => {
  const show = (over: { begin?: boolean; onWelcome: boolean; authState: AuthState; book?: boolean; chosen?: boolean }) =>
    continueMayShow({
      begin: over.begin ?? true, onWelcome: over.onWelcome, authState: over.authState,
      hasLocalBook: () => over.book ?? false, localStartChosen: over.chosen ?? false,
    });

  it('[NX-31-R17] a signed-in parent on the child step whose session is lost keeps Continue', () => {
    setServerFeaturesForTests(true);
    // SESSION_LOST (token revoked elsewhere) gives signedOut with session_expired; Apple revoke the same.
    expect(show({ onWelcome: true, authState: READY })).toBe(true);
    expect(show({ onWelcome: false, authState: READY })).toBe(true);
    expect(show({ onWelcome: false, authState: SESSION_EXPIRED })).toBe(true);
    // ...and on the welcome, with the session gone, Begin waits, as the sign-in-first rule says
    expect(show({ onWelcome: true, authState: SESSION_EXPIRED })).toBe(false);
  });
  it('[NX-31-R18] a person who took the local start and then opens a sign-in link keeps Continue on a later step', () => {
    setServerFeaturesForTests(true);
    expect(show({ onWelcome: true, authState: OUTAGE })).toBe(true);
    for (const state of [SIGNING_IN, AWAITING_CODE, RESTORING]) {
      expect(show({ onWelcome: false, authState: state }), state.status).toBe(true);
    }
  });
  it('[NX-31-R17] on a later step Continue follows the join wait alone, in every auth state and with or without a book', () => {
    setServerFeaturesForTests(true);
    for (const state of ALL) for (const book of [true, false]) for (const begin of [true, false]) {
      expect(show({ onWelcome: false, authState: state, book, begin }), `${state.status} book:${book} begin:${begin}`).toBe(begin);
    }
  });
  it('[NX-31-R17] a joined book on its way still hides Begin on the welcome, whatever the gate says', () => {
    setServerFeaturesForTests(true);
    for (const state of ALL) expect(show({ onWelcome: true, authState: state, book: true, begin: false }), state.status).toBe(false);
  });
  it('[NX-31-R17] later steps do not read the book list', () => {
    setServerFeaturesForTests(true);
    const listed = vi.fn(() => false);
    for (const state of ALL) continueMayShow({ begin: true, onWelcome: false, authState: state, hasLocalBook: listed, localStartChosen: false });
    expect(listed).not.toHaveBeenCalled();
  });
});

describe('[NX-31-R18] the local start is remembered when "Begin the book" is tapped with no session', () => {
  it('[NX-31-R18] a tap on the welcome with no session latches it; with a session, off the welcome, or with the switch off, it does not', () => {
    setServerFeaturesForTests(true);
    for (const state of [OUTAGE, SIGNED_OUT, SESSION_EXPIRED, SIGNING_IN, AWAITING_CODE, RESTORING]) {
      expect(continueTapIsLocalStart({ onWelcome: true, authState: state }), state.status).toBe(true);
      expect(continueTapIsLocalStart({ onWelcome: false, authState: state }), `${state.status} off the welcome`).toBe(false);
    }
    for (const state of [CHECKING, NEEDS_CONSENT, READY, SIGNING_OUT]) {
      expect(continueTapIsLocalStart({ onWelcome: true, authState: state }), state.status).toBe(false);
    }
    setServerFeaturesForTests(false);
    expect(continueTapIsLocalStart({ onWelcome: true, authState: OUTAGE })).toBe(false);
  });
  it('[NX-31-R18] after the latch, the way back to the welcome still shows Begin', () => {
    setServerFeaturesForTests(true);
    // tapped in an outage (latched), then a sign-in email link opened: signingIn on the welcome
    expect(continueTapIsLocalStart({ onWelcome: true, authState: OUTAGE })).toBe(true);
    expect(allowed(SIGNING_IN, false, true)).toBe(true);
    expect(allowed(SIGNING_IN, false, false)).toBe(false);
  });
});
