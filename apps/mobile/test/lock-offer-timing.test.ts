/**
 * Tier A, the lock offer moves to session 3 (NX-31-R14, R29; QA plan LK-01, LK-16 as changed by the founder's 9 Nov ruling;
 * journey A3, A4; red-first file `test/lock-offer-timing.test.ts`). The count is #702's `keptLetterSessions()`: sessions
 * that ended in a kept letter, on the phone only. The offer is the card, once, equal buttons, at the end of the save in the
 * third such session; "Not now" holds 30 days; Settings > Privacy > App lock is always the fallback. Face ID here is the book
 * lock and never how the account is proved.
 *
 * Proposed and flagged in the PR (the requirement says "once" and "holds 30 days (proposed)"): after the hold the card may
 * come back once more, so it is offered at most twice, ever.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_LOCK_OFFER_RECORD,
  LOCK_OFFER_HOLD_MS,
  LOCK_OFFER_MAX,
  LOCK_OFFER_SESSION,
  afterLockOfferAnswer,
  lockOfferDue,
  parseLockOfferRecord,
  type LockOfferFacts,
} from '../src/lib/app-lock/offer.logic';
import { nextAsk, type AskFacts } from '../src/lib/asks/next-ask.logic';

const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const NOW = 1_800_000_000_000;
const facts = (over: Partial<LockOfferFacts> = {}): LockOfferFacts => ({
  keptSessions: 3,
  lockOn: false,
  record: EMPTY_LOCK_OFFER_RECORD,
  now: NOW,
  ...over,
});

describe('[NX-31-R14, LK-01] due on the third session that ended in a kept letter, and not before', () => {
  it('is session 3 and the hold is 30 days', () => {
    expect(LOCK_OFFER_SESSION).toBe(3);
    expect(LOCK_OFFER_HOLD_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
  it('not due after the first, nor the second kept-letter session (the first night is for the letter)', () => {
    for (const keptSessions of [0, 1, 2]) expect(lockOfferDue(facts({ keptSessions })), String(keptSessions)).toBe(false);
  });
  it('due at session 3, and still due later if it was never answered', () => {
    expect(lockOfferDue(facts({ keptSessions: 3 }))).toBe(true);
    expect(lockOfferDue(facts({ keptSessions: 9 }))).toBe(true);
  });
  it('never due while the lock is on (it was turned on here or in Settings)', () => {
    expect(lockOfferDue(facts({ lockOn: true }))).toBe(false);
  });
  it('a garbage or missing count is not a reason to offer', () => {
    expect(lockOfferDue(facts({ keptSessions: Number.NaN }))).toBe(false);
  });
});

describe('[NX-31-R14, LK-16] answers: Not now holds 30 days; it is asked at most twice; quitting before an answer asks again', () => {
  it('an unanswered card (the app was quit) leaves the record empty, so the next ask shows it once more', () => {
    expect(parseLockOfferRecord(null, null)).toEqual(EMPTY_LOCK_OFFER_RECORD);
    expect(lockOfferDue(facts({ record: parseLockOfferRecord(null, null) }))).toBe(true);
  });
  it('Not now: not due for 30 days, due again after, then never a third time', () => {
    const r1 = afterLockOfferAnswer(EMPTY_LOCK_OFFER_RECORD, 'notNow', NOW);
    expect(r1).toEqual({ answers: 1, notNowAt: NOW });
    expect(lockOfferDue(facts({ record: r1, now: NOW + 1 }))).toBe(false);
    expect(lockOfferDue(facts({ record: r1, now: NOW + LOCK_OFFER_HOLD_MS - 1 }))).toBe(false);
    expect(lockOfferDue(facts({ record: r1, now: NOW + LOCK_OFFER_HOLD_MS }))).toBe(true);
    const r2 = afterLockOfferAnswer(r1, 'notNow', NOW + LOCK_OFFER_HOLD_MS);
    expect(r2.answers).toBe(LOCK_OFFER_MAX);
    expect(lockOfferDue(facts({ record: r2, now: NOW + 10 * LOCK_OFFER_HOLD_MS }))).toBe(false);
  });
  it('turning the lock on counts as an answer and clears the hold', () => {
    const r = afterLockOfferAnswer({ answers: 1, notNowAt: NOW - 5 }, 'turnedOn', NOW);
    expect(r).toEqual({ answers: 2, notNowAt: null });
  });
  it('a phone that cannot hold a lock (no passcode) holds the card 30 days and uses up none of the two offers', () => {
    const r = afterLockOfferAnswer(EMPTY_LOCK_OFFER_RECORD, 'unavailable', NOW);
    expect(r).toEqual({ answers: 0, notNowAt: NOW });
    expect(lockOfferDue(facts({ record: r, now: NOW + 1 }))).toBe(false);
    expect(lockOfferDue(facts({ record: r, now: NOW + LOCK_OFFER_HOLD_MS }))).toBe(true);
  });
  it('a stored record that is not numbers reads as no record', () => {
    expect(parseLockOfferRecord('x', 'y')).toEqual(EMPTY_LOCK_OFFER_RECORD);
    expect(parseLockOfferRecord('-4', '-1')).toEqual(EMPTY_LOCK_OFFER_RECORD);
  });
  it('a clock that went backwards does not hold the card for ever', () => {
    const r = { answers: 1, notNowAt: NOW + 400 * 24 * 60 * 60 * 1000 };
    expect(lockOfferDue(facts({ record: r }))).toBe(true);
  });
});

describe('[NX-31-R29] the sequencer: the lock offer is the one ask, first, and nothing is stacked', () => {
  const ask = (over: Partial<AskFacts> = {}): AskFacts => ({
    lettersSaved: 9,
    firstLetter: false,
    primesShown: 0,
    remindersOn: false,
    signInOffered: false,
    keepBookOffered: false,
    firstLetterSession: 1_000,
    session: 9_000_000,
    askShownThisSession: false,
    askShownToday: false,
    lockOfferDue: true,
    ...over,
  });
  it('lock_offer comes before the reminder prime when both are due', () => {
    expect(nextAsk(ask({ primesShown: 0, remindersOn: false }))).toBe('lock_offer');
  });
  it('one ask per session and per day: nothing when another ask already showed', () => {
    expect(nextAsk(ask({ askShownThisSession: true }))).toBeNull();
    expect(nextAsk(ask({ askShownToday: true }))).toBeNull();
  });
  it('not due means the old order stands', () => {
    expect(nextAsk(ask({ lockOfferDue: false }))).toBeNull();
    expect(nextAsk(ask({ lockOfferDue: undefined }))).toBeNull();
  });
});

describe('[journey A3] the wiring: gone from first run, asked after a kept letter, Settings stays', () => {
  it('onboarding does not mount it; the tabs layout hosts it; Review asks for it after the Book lands', () => {
    expect(src('app', 'onboarding.tsx')).not.toMatch(/LockOffer/);
    expect(src('app', '(tabs)', '_layout.tsx')).toMatch(/<LockOfferAsk \/>/);
    expect(src('app', 'review.tsx')).toMatch(/askAfterLanding\.current === 'lock_offer'/);
    expect(src('app', 'review.tsx')).toMatch(/requestLockOffer/);
  });
  it('the sequencer reads #702\'s counter and the lock state, and records the answer, not the showing', () => {
    const asks = src('lib', 'asks', 'index.ts');
    expect(asks).toMatch(/keptSessions\.keptLetterSessions\(\)/);
    expect(asks).toMatch(/lockOfferDue\(/);
    expect(asks).toMatch(/appLockOn\(\)/);
    const offer = src('components', 'app-lock', 'lock-offer.tsx');
    expect(offer).toMatch(/onAnswered\?\.\('notNow'\)|onAnswered\?\.\('turnedOn'\)/);
  });
  it('Settings > Privacy > App lock is still reachable as the fallback', () => {
    expect(src('app', 'settings', 'privacy.tsx') + src('app', 'settings', 'app-lock.tsx')).toMatch(/appLock|AppLock|app-lock/);
  });
});

describe('[journey 3.1] Face ID is the book lock, never how you sign in', () => {
  it('no line of the offer or the lock screen says Face ID signs you in, or protects or recovers the account', async () => {
    const { appLockCopy } = await import('../src/lib/app-lock/copy');
    const lines = [
      ...Object.values(appLockCopy.offer.body),
      ...Object.values(appLockCopy.offer.turnOn),
      appLockCopy.offer.title,
      appLockCopy.offer.notNow,
      appLockCopy.faceIdDenied,
      ...Object.values(appLockCopy.unlockHint),
      appLockCopy.passcodeRemoved,
    ];
    for (const l of lines) expect(l, l).not.toMatch(/sign(s|ed)? (you )?in\b|log(s|ged)? in|account|recover|protects? your/i);
  });
  it('the passcode fallback stays on: authentication never disables the device passcode', () => {
    const c = src('lib', 'app-lock', 'controller.ts');
    expect(c).toMatch(/disableDeviceFallback: false/);
    expect(c).not.toMatch(/disableDeviceFallback: true/);
  });
});
