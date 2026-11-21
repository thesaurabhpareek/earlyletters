/**
 * App lock state machine (F1; CPO-2, CISO-1; proposals/account-security/security.md section 2; design.md 2.3 to 2.5;
 * SETTINGS_AND_ACCOUNT.md sections 3 to 5). Every rule the lock promises a parent, one test each, against the pure
 * reducer in src/lib/app-lock/machine.ts. Each would fail if its piece went missing.
 */
import { describe, expect, it } from 'vitest';
import {
  authOutcome,
  coverShown,
  DEFAULT_GRACE,
  GRACE_CHOICES,
  GRACE_MS,
  INITIAL,
  lockAbility,
  parseGrace,
  reduce,
  shouldAutoPrompt,
  type LockEvent,
  type LockState,
} from '../src/lib/app-lock/machine';

const run = (s: LockState, ...events: LockEvent[]) => events.reduce(reduce, s);
const T0 = 1_000_000;
const away = (ms: number): LockEvent[] => [
  { type: 'appState', phase: 'inactive', at: T0 },
  { type: 'appState', phase: 'background', at: T0 },
  { type: 'appState', phase: 'active', at: T0 + ms },
];
/** On, unlocked, in front: the usual state after the parent opened the book. */
const open = (grace = DEFAULT_GRACE) => run(INITIAL, { type: 'launch', enabled: true, grace }, { type: 'unlocked' });

describe('off by default (CPO-2)', () => {
  it('a fresh install has the lock off', () => {
    expect(INITIAL.enabled).toBe(false);
    expect(INITIAL.locked).toBe(false);
  });

  it('off, it never locks, never covers and never asks', () => {
    let s = run(INITIAL, { type: 'launch', enabled: false, grace: 'immediately' });
    expect(s.locked).toBe(false);
    s = run(s, { type: 'appState', phase: 'inactive', at: T0 });
    expect(coverShown(s)).toBe(false);
    s = run(s, { type: 'appState', phase: 'background', at: T0 }, { type: 'appState', phase: 'active', at: T0 + 3_600_000 });
    expect(s.locked).toBe(false);
    expect(shouldAutoPrompt(s)).toBe(false);
  });
});

describe('when it locks', () => {
  it('locks on a cold start, covered from the first frame, and asks once on its own', () => {
    const s = run(INITIAL, { type: 'launch', enabled: true, grace: 'oneMinute' });
    expect(s.locked).toBe(true);
    expect(coverShown(s)).toBe(true);
    expect(shouldAutoPrompt(s)).toBe(true);
  });

  it('the default grace is one minute, and the choices are Immediately, 1 minute, 5 minutes', () => {
    expect(DEFAULT_GRACE).toBe('oneMinute');
    expect(GRACE_CHOICES).toEqual(['immediately', 'oneMinute', 'fiveMinutes']);
    expect(GRACE_MS).toEqual({ immediately: 0, oneMinute: 60_000, fiveMinutes: 300_000 });
    expect(parseGrace(null)).toBe('oneMinute');
    expect(parseGrace('fifteenMinutes')).toBe('oneMinute');
    expect(parseGrace('fiveMinutes')).toBe('fiveMinutes');
  });

  it('within the grace it stays open; at the grace it locks', () => {
    expect(run(open(), ...away(59_999)).locked).toBe(false);
    expect(run(open(), ...away(60_000)).locked).toBe(true);
    expect(run(open('fiveMinutes'), ...away(299_000)).locked).toBe(false);
    expect(run(open('fiveMinutes'), ...away(300_000)).locked).toBe(true);
  });

  it('Immediately locks after any time in the background', () => {
    expect(run(open('immediately'), ...away(0)).locked).toBe(true);
  });

  it('inactive alone never locks (the Face ID sheet, a call, Control Center), however long', () => {
    const s = run(open('immediately'), { type: 'appState', phase: 'inactive', at: T0 }, { type: 'appState', phase: 'active', at: T0 + 3_600_000 });
    expect(s.locked).toBe(false);
    expect(coverShown(s)).toBe(false);
  });

  it('a changed grace applies to the next time away', () => {
    const s = run(open('fiveMinutes'), { type: 'setGrace', grace: 'immediately' }, ...away(1));
    expect(s.locked).toBe(true);
  });

  it('time away counts from the first background, not a later one', () => {
    const s = run(
      open(),
      { type: 'appState', phase: 'background', at: T0 },
      { type: 'appState', phase: 'inactive', at: T0 + 30_000 },
      { type: 'appState', phase: 'background', at: T0 + 40_000 },
      { type: 'appState', phase: 'active', at: T0 + 60_000 },
    );
    expect(s.locked).toBe(true);
  });
});

describe('the privacy cover (app switcher snapshot)', () => {
  it('is up the moment the app goes inactive while the lock is on, before any background', () => {
    const s = run(open(), { type: 'appState', phase: 'inactive', at: T0 });
    expect(coverShown(s)).toBe(true);
    expect(s.locked).toBe(false);
  });

  it('stays up in the background and comes down in front within the grace', () => {
    let s = run(open(), { type: 'appState', phase: 'inactive', at: T0 }, { type: 'appState', phase: 'background', at: T0 });
    expect(coverShown(s)).toBe(true);
    s = run(s, { type: 'appState', phase: 'active', at: T0 + 5_000 });
    expect(coverShown(s)).toBe(false);
  });

  it('stays up while locked, in front, until the device says it is them', () => {
    let s = run(open(), ...away(120_000));
    expect(coverShown(s)).toBe(true);
    s = run(s, { type: 'unlocked' });
    expect(coverShown(s)).toBe(false);
    expect(s.locked).toBe(false);
  });
});

describe('never during a take (F17-U23): it waits, and never drops audio', () => {
  it('a take live as the grace passes does not lock; the lock applies once the take is kept', () => {
    let s = run(open('immediately'), { type: 'take', live: true }, ...away(120_000));
    expect(s.locked).toBe(false);
    expect(s.due).toBe(true);
    s = run(s, { type: 'take', live: false });
    expect(s.locked).toBe(true);
    expect(s.due).toBe(false);
    expect(shouldAutoPrompt(s)).toBe(true);
  });

  it('a take that ends with no lock due does not lock', () => {
    const s = run(open('immediately'), { type: 'take', live: true }, { type: 'take', live: false });
    expect(s.locked).toBe(false);
  });

  it('the cover still hides a take in the app switcher (it only covers; the take goes on underneath)', () => {
    const s = run(open(), { type: 'take', live: true }, { type: 'appState', phase: 'inactive', at: T0 });
    expect(coverShown(s)).toBe(true);
    expect(s.recording).toBe(true);
  });

  it('a take ending after the lock was turned off does not lock', () => {
    const s = run(open('immediately'), { type: 'take', live: true }, ...away(120_000), { type: 'disable' }, { type: 'take', live: false });
    expect(s.locked).toBe(false);
  });
});

describe('the share sheet and the app asking the device (Export)', () => {
  it('no lock while the share sheet is open; it applies when the sheet closes', () => {
    let s = run(open('immediately'), { type: 'hold', open: true }, ...away(120_000));
    expect(s.locked).toBe(false);
    s = run(s, { type: 'hold', open: false });
    expect(s.locked).toBe(true);
  });
});

describe('the lock screen asks once, never in a loop', () => {
  it('after the automatic ask, a cancel leaves Unlock and no second automatic ask', () => {
    let s = run(INITIAL, { type: 'launch', enabled: true, grace: 'oneMinute' });
    expect(shouldAutoPrompt(s)).toBe(true);
    s = run(s, { type: 'prompted' });
    expect(shouldAutoPrompt(s)).toBe(false);
    // The system sheet made the app inactive and active again: still no second ask.
    s = run(s, { type: 'appState', phase: 'inactive', at: T0 }, { type: 'appState', phase: 'active', at: T0 + 1 });
    expect(s.locked).toBe(true);
    expect(shouldAutoPrompt(s)).toBe(false);
  });

  it('does not ask while the app is not in front', () => {
    const s = run(INITIAL, { type: 'launch', enabled: true, grace: 'oneMinute' }, { type: 'appState', phase: 'inactive', at: T0 });
    expect(shouldAutoPrompt(s)).toBe(false);
  });

  it('the next lock arms one new automatic ask', () => {
    const s = run(open(), ...away(120_000));
    expect(shouldAutoPrompt(s)).toBe(true);
  });
});

describe('turning it on and off', () => {
  it('turning on (after authenticating there) keeps the book open now and locks next time', () => {
    let s = run(INITIAL, { type: 'launch', enabled: false, grace: 'oneMinute' }, { type: 'enable' });
    expect(s.enabled).toBe(true);
    expect(s.locked).toBe(false);
    s = run(s, ...away(60_000));
    expect(s.locked).toBe(true);
  });

  it('turning off clears a lock and anything due', () => {
    const s = run(open(), { type: 'take', live: true }, ...away(120_000), { type: 'disable' });
    expect(s).toMatchObject({ enabled: false, locked: false, due: false });
    expect(coverShown(s)).toBe(false);
  });
});

describe('the device passcode is removed (F17-U21)', () => {
  it('the lock turns off, opens, and says so once', () => {
    let s = run(INITIAL, { type: 'launch', enabled: true, grace: 'oneMinute' }, { type: 'passcodeGone' });
    expect(s).toMatchObject({ enabled: false, locked: false, notice: 'passcodeRemoved' });
    expect(coverShown(s)).toBe(false);
    s = run(s, { type: 'noticeShown' });
    expect(s.notice).toBeNull();
    // Already off: nothing to say.
    expect(run(s, { type: 'passcodeGone' }).notice).toBeNull();
  });
});

describe('what the device can do (lockAbility)', () => {
  it('no passcode: no lock, so the offer is hidden and the switch cannot turn on', () => {
    expect(lockAbility({ level: 0, types: [2], hasHardware: true })).toEqual({ available: false });
    expect(lockAbility({ level: Number.NaN, types: [], hasHardware: false })).toEqual({ available: false });
  });

  it('Face ID and Touch ID name themselves', () => {
    expect(lockAbility({ level: 3, types: [2], hasHardware: true })).toEqual({ available: true, method: 'faceId', faceIdDenied: false });
    expect(lockAbility({ level: 3, types: [1], hasHardware: true })).toEqual({ available: true, method: 'touchId', faceIdDenied: false });
  });

  it('biometrics unavailable (not set up, or no hardware) fall back to the passcode', () => {
    expect(lockAbility({ level: 1, types: [2], hasHardware: true })).toEqual({ available: true, method: 'passcode', faceIdDenied: false });
    expect(lockAbility({ level: 1, types: [], hasHardware: false })).toEqual({ available: true, method: 'passcode', faceIdDenied: false });
  });

  it('Face ID turned off for this app: the passcode opens the book, and the screen says why', () => {
    expect(lockAbility({ level: 1, types: [2], hasHardware: false })).toEqual({ available: true, method: 'passcode', faceIdDenied: true });
  });
});

describe('authentication results', () => {
  it('maps the library result to what the screens do', () => {
    expect(authOutcome({ success: true })).toBe('ok');
    expect(authOutcome({ success: false, error: 'user_cancel' })).toBe('cancelled');
    expect(authOutcome({ success: false, error: 'system_cancel' })).toBe('cancelled');
    expect(authOutcome({ success: false, error: 'passcode_not_set' })).toBe('noPasscode');
    expect(authOutcome({ success: false, error: 'lockout' })).toBe('failed');
    expect(authOutcome({ success: false, error: 'not_enrolled' })).toBe('failed');
  });
});
