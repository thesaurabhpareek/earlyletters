/**
 * The ask order after a saved letter (DR-12 B; F02 6.1; F13-REQ-023; C-REQ-001 Rev). SET-01 and SET-02 of the
 * first-run review (docs/reviews/2026-10-31/setup.md): the account sheet no longer follows the first letter, and the
 * reminder card takes that slot.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import {
  ASK_SESSION_GAP_MS,
  MAX_REMINDER_PRIMES,
  MAX_ASKS_PER_DAY,
  MAX_OS_ASKS_PER_DAY,
  OS_OR_CONSENT_ASKS,
  countsAfter,
  countsFor,
  dayAllows,
  FIRST_MONTH_MS,
  firstMonthDone,
  localDay,
  nextAsk,
  primeAllowed,
  reminderPrimeSource,
  sessionAfterForeground,
  type AskFacts,
} from '../src/lib/asks/next-ask.logic';

const S1 = 1_000;
const S2 = 9_000_000;
const facts = (over: Partial<AskFacts> = {}): AskFacts => ({
  lettersSaved: 1,
  firstLetter: true,
  primesShown: 0,
  primeAnsweredYes: false,
  remindersOn: false,
  signInOffered: true,
  keepBookOffered: false,
  keepBookReoffered: false,
  firstLetterSession: S1,
  session: S1,
  askShownThisSession: false,
  asksShownToday: 0,
  osAsksShownToday: 0,
  firstMonthDone: false,
  ...over,
});

describe('[F13-REQ-023, C-REQ-001 Rev] the first letter: the reminder card, before the account ask', () => {
  it('Given the first letter saved, Then nextAsk returns reminder_prime, in both builds', () => {
    expect(nextAsk(facts())).toBe('reminder_prime');
    expect(nextAsk(facts({ signInOffered: false }))).toBe('reminder_prime');
  });

  it('never the account sheet on the first letter, whatever else holds (SET-01)', () => {
    for (const over of [{ remindersOn: true }, { primesShown: 1 }, { primesShown: 2 }]) {
      expect(nextAsk(facts(over)), JSON.stringify(over)).toBeNull();
    }
  });

  it('no card when reminders are already on', () => {
    expect(nextAsk(facts({ remindersOn: true, signInOffered: false }))).toBeNull();
  });

  it('only at the first letter: a later save never brings the card back by itself', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 3, signInOffered: false, session: S2 }))).toBeNull();
  });

  it('the cap: at most 2 primes ever; after "No reminders" twice, never a third (C-REQ-001 Rev)', () => {
    expect(MAX_REMINDER_PRIMES).toBe(2);
    expect(primeAllowed(0)).toBe(true);
    expect(primeAllowed(1)).toBe(true);
    expect(primeAllowed(2)).toBe(false);
    expect(primeAllowed(5)).toBe(false);
    expect(nextAsk(facts({ primesShown: 2 }))).toBeNull();
  });
});

describe('[DR-12 B, F02 6.1] Keep the book: the second letter, or the first save of session 2', () => {
  it('the second letter in a later session: keep_book', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, session: S2 }))).toBe('keep_book');
  });

  it('the first save of session 2 opens it even when it is still the second letter or later', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 5, primesShown: 1, session: S2 }))).toBe('keep_book');
  });

  it('the second letter in the same session as the card waits: one ask per session', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, askShownThisSession: true }))).toBeNull();
  });

  it('[BL-1784] no second OS-alert or consent ask in a day', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, session: S2, asksShownToday: 1, osAsksShownToday: 1 }))).toBeNull();
  });

  it('the second letter in session 1 when no card was shown (reminders already on): keep_book', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, remindersOn: true }))).toBe('keep_book');
  });

  it('offered once; never in build 1 (no sign-in) and never when signed in', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, session: S2, keepBookOffered: true }))).toBeNull();
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, session: S2, signInOffered: false }))).toBeNull();
  });

  it('letters from before this sequencer (no first-letter session): the next save counts as a later session', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 4, primesShown: 0, firstLetterSession: null }))).toBe('keep_book');
  });

  it('nothing without a letter', () => {
    expect(nextAsk(facts({ lettersSaved: 0 }))).toBeNull();
  });
});

describe('[C-REQ-001 Rev, F13 6.2 B row 4c, BL-518] the second reminder prime, after the first month chapter', () => {
  const later = (over: Partial<AskFacts> = {}) =>
    facts({ firstLetter: false, lettersSaved: 6, primesShown: 1, keepBookOffered: true, keepBookReoffered: true, session: S2, firstMonthDone: true, ...over });

  it('the first month is done: the second save after it offers reminder_prime again, once', () => {
    expect(nextAsk(later())).toBe('reminder_prime');
  });

  it('not before the first month is done', () => {
    expect(nextAsk(later({ firstMonthDone: false }))).toBeNull();
  });

  it('only a second prime: not when none was shown (the first has its own slot), never a third (the cap of 2)', () => {
    expect(nextAsk(later({ primesShown: 0 }))).toBeNull();
    expect(nextAsk(later({ primesShown: MAX_REMINDER_PRIMES }))).toBeNull();
  });

  it('not when reminders are on, and not on the first letter', () => {
    expect(nextAsk(later({ remindersOn: true }))).toBeNull();
    expect(nextAsk(later({ firstLetter: true, lettersSaved: 1 }))).toBeNull();
  });

  it('one ask per session and per day still hold', () => {
    expect(nextAsk(later({ askShownThisSession: true }))).toBeNull();
    expect(nextAsk(later({ asksShownToday: 1, osAsksShownToday: 1 }))).toBeNull();
  });

  it('[BL-1430] a person who ever said Yes is never primed again, even with reminders turned off later', () => {
    expect(nextAsk(later({ primeAnsweredYes: true, remindersOn: false }))).toBeNull();
    expect(nextAsk(later({ primeAnsweredYes: false, remindersOn: false }))).toBe('reminder_prime');
  });

  it('[BL-1430] the Yes answer is its own device setting, set by the card and read by askAfterSave, not folded into primesShown', () => {
    const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
    expect(src('lib/asks/index.ts')).toMatch(/primeAnsweredYes: getSetting\(K\.primeYes\) === 'on'/);
    expect(src('lib/asks/index.ts')).toMatch(/primeYes: 'asks\.reminderPrimeYes'/);
    const card = src('components/asks/reminder-prime-ask.tsx');
    const yes = card.slice(card.indexOf('const yes ='), card.indexOf('const none ='));
    expect(yes).toMatch(/noteReminderPrimeYes\(\)/);
    expect(card.slice(card.indexOf('const none ='), card.indexOf('return (', card.indexOf('const none =')))).not.toMatch(/noteReminderPrimeYes/);
  });

  it('the account sheet keeps its earlier slot when both are due', () => {
    expect(nextAsk(later({ keepBookOffered: false }))).toBe('keep_book');
  });

  it('the first month is 30 days after the first letter; unknown is not done', () => {
    const t = 1_000_000;
    expect(firstMonthDone(null, t)).toBe(false);
    expect(firstMonthDone(t, t + FIRST_MONTH_MS - 1)).toBe(false);
    expect(firstMonthDone(t, t + FIRST_MONTH_MS)).toBe(true);
  });
});

describe('[C-REQ-034, BL-1429] reminder_prime_shown names which showing it is', () => {
  it('Given no earlier showing, Then the source is first_letter; Given one, Then it is first_month', () => {
    expect(reminderPrimeSource(0)).toBe('first_letter');
    expect(reminderPrimeSource(1)).toBe('first_month');
  });

  it('the source follows the second-prime rule: the showing nextAsk returns at primesShown 1 is the one labelled first_month', () => {
    const first = nextAsk(facts());
    const second = nextAsk(facts({ firstLetter: false, lettersSaved: 3, primesShown: 1, firstMonthDone: true, signInOffered: false, session: S2 }));
    expect([first, second]).toEqual(['reminder_prime', 'reminder_prime']);
    expect([reminderPrimeSource(0), reminderPrimeSource(1)]).toEqual(['first_letter', 'first_month']);
  });

  it('the card sends the source it is given by the counter, never a fixed string', () => {
    const card = readFileSync(join(__dirname, '..', 'src', 'components/asks/reminder-prime-ask.tsx'), 'utf8');
    expect(card).toMatch(/track\('reminder_prime_shown', \{ source: noteReminderPrimeShown\(\) \}\)/);
    expect(card).not.toMatch(/reminder_prime_shown'[^)]*'first_letter'/);
  });
});

describe('[F02 6.1, BL-519] Keep the book comes once more after the third letter when the person chose Later', () => {
  // Offered before (the first offer, Later: still signed out), a later session, no card due.
  const offered = (over: Partial<AskFacts> = {}): AskFacts =>
    facts({ firstLetter: false, lettersSaved: 3, primesShown: 1, keepBookOffered: true, session: S2, ...over });

  it('offer: the second letter is the first offer', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1 }))).toBe('keep_book');
  });

  it('Later: the first offer taken and still signed out, a second letter does not offer again', () => {
    expect(nextAsk(offered({ lettersSaved: 2 }))).toBeNull();
  });

  it('re-offer: the third saved letter offers it once more', () => {
    expect(nextAsk(offered())).toBe('keep_book');
  });

  it('no third offer: once the re-offer is made, no later letter brings it back', () => {
    for (const n of [3, 4, 9]) expect(nextAsk(offered({ lettersSaved: n, keepBookReoffered: true })), String(n)).toBeNull();
  });

  it('a third letter whose slot was taken by another ask offers it on a later save, still once', () => {
    expect(nextAsk(offered({ askShownThisSession: true }))).toBeNull();
    expect(nextAsk(offered({ lettersSaved: 4 }))).toBe('keep_book');
  });

  it('the session and day caps hold for the re-offer', () => {
    expect(nextAsk(offered({ askShownThisSession: true }))).toBeNull();
    expect(nextAsk(offered({ asksShownToday: 1, osAsksShownToday: 1 }))).toBeNull();
  });

  it('never when the person signed in or servers are off (signInOffered false)', () => {
    expect(nextAsk(offered({ signInOffered: false }))).toBeNull();
  });

  it('the second reminder prime keeps its slot ahead of the re-offer (BL-518)', () => {
    expect(nextAsk(offered({ lettersSaved: 6, firstMonthDone: true }))).toBe('reminder_prime');
  });

  it('wiring: the re-offer is remembered on the phone and reuses the same sheet', () => {
    const asks = readFileSync(join(__dirname, '..', 'src', 'lib/asks/index.ts'), 'utf8');
    expect(asks).toMatch(/keepBookReoffered:\s*getSetting\(K\.keepBookReoffer\) === 'on'/);
    expect(asks).toMatch(/setSetting\(K\.keepBookReoffer, 'on'\)/);
  });
});

describe('[BL-1784] two setup asks a day, one OS-alert or consent ask, never during recording, Review or export', () => {
  const second = (over: Partial<AskFacts> = {}) => facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, session: S2, ...over });

  it('the caps are two setup asks and one OS-alert or consent ask', () => {
    expect(MAX_ASKS_PER_DAY).toBe(2);
    expect(MAX_OS_ASKS_PER_DAY).toBe(1);
    expect([...OS_OR_CONSENT_ASKS].sort()).toEqual(['analytics_consent', 'keep_book', 'reminder_prime']);
  });

  it('a second ask the same day, after a session change, when the first was not an OS-alert or consent ask', () => {
    expect(nextAsk(second({ asksShownToday: 1, osAsksShownToday: 0 }))).toBe('keep_book');
  });

  it('no third ask in a day, whatever kind', () => {
    expect(nextAsk(second({ asksShownToday: 2, osAsksShownToday: 0 }))).toBeNull();
    expect(nextAsk(second({ asksShownToday: 3, osAsksShownToday: 0 }))).toBeNull();
  });

  it('no second OS-alert or consent ask in a day', () => {
    expect(nextAsk(second({ asksShownToday: 1, osAsksShownToday: 1 }))).toBeNull();
    expect(dayAllows('analytics_consent', 1, 1)).toBe(false);
    expect(dayAllows('keep_book', 0, 0)).toBe(true);
  });

  it('still none in the same session, even with room in the day', () => {
    expect(nextAsk(second({ askShownThisSession: true }))).toBeNull();
  });

  it('none while the person is recording, in Review or exporting', () => {
    expect(nextAsk(second({ surfaceBusy: true }))).toBeNull();
    expect(nextAsk(second({ surfaceBusy: false }))).toBe('keep_book');
  });

  it('the counts reset at local midnight', () => {
    const late = new Date(2026, 10, 1, 23, 59).getTime();
    const after = new Date(2026, 10, 2, 0, 1).getTime();
    const day1 = countsAfter({ day: null, asks: 0, osAsks: 0 }, 'reminder_prime', late);
    expect(day1).toEqual({ day: '2026-11-01', asks: 1, osAsks: 1 });
    expect(countsFor(day1, late)).toEqual({ asks: 1, osAsks: 1 });
    expect(countsFor(day1, after)).toEqual({ asks: 0, osAsks: 0 });
    expect(countsAfter(day1, 'keep_book', after)).toEqual({ day: '2026-11-02', asks: 1, osAsks: 1 });
  });

  it('every ask counts when shown; analytics consent counts toward both totals', () => {
    const a = countsAfter({ day: '2026-11-01', asks: 0, osAsks: 0 }, 'analytics_consent', new Date(2026, 10, 1, 9).getTime());
    expect(a).toEqual({ day: '2026-11-01', asks: 1, osAsks: 1 });
    const src = readFileSync(join(__dirname, '..', 'src', 'lib/analytics/ask.ts'), 'utf8');
    expect(src).toMatch(/recordDayAsk\('analytics_consent'\)/);
  });
});

describe('sessions and days', () => {
  it('a return after 30 minutes or more away is a new session; sooner is the same one', () => {
    expect(ASK_SESSION_GAP_MS).toBe(30 * 60 * 1000);
    expect(sessionAfterForeground(S1, null, S1 + 10)).toBe(S1);
    expect(sessionAfterForeground(S1, S1 + 100, S1 + 100 + ASK_SESSION_GAP_MS - 1)).toBe(S1);
    expect(sessionAfterForeground(S1, S1 + 100, S1 + 100 + ASK_SESSION_GAP_MS)).toBe(S1 + 100 + ASK_SESSION_GAP_MS);
  });

  it('localDay is the local calendar day', () => {
    expect(localDay(new Date(2026, 9, 31, 23, 59).getTime())).toBe('2026-10-31');
    expect(localDay(new Date(2026, 10, 1, 0, 1).getTime())).toBe('2026-11-01');
  });
});

describe('wiring (source checks; the card and the sheet are on the device list)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
  it('Review asks the sequencer after the save, and acts after the Book lands', () => {
    const review = src('app/review.tsx');
    expect(review).toMatch(/askAfterLanding\.current = askAfterSave\(\{ firstLetter, signInOffered: auth\.configured && auth\.state\.status === 'signedOut' \}\)/);
    expect(review).toMatch(/askAfterLanding\.current === 'keep_book'/);
    expect(review).toMatch(/askAfterLanding\.current === 'reminder_prime'[\s\S]*?setTimeout\(requestReminderPrime, signInAfterLandingMs\(motion\.reduced\)\)/);
    expect(review).not.toMatch(/offerSignIn/);
  });

  it('the card is mounted in the tabs layout, under its toast host, and uses the registered onboarding.reminder words', () => {
    const tabs = src('app/(tabs)/_layout.tsx');
    expect(tabs.indexOf('<ReminderPrimeAsk />')).toBeGreaterThan(tabs.indexOf('<ToastHost bottomOffset={BAR}>'));
    expect(tabs.indexOf('<ReminderPrimeAsk />')).toBeLessThan(tabs.indexOf('</ToastHost>'));
    const card = src('components/asks/reminder-prime-ask.tsx');
    for (const k of ['title', 'body', 'yesEveningsButton', 'pickTimeButton', 'noneOption', 'noneHelp', 'timeLabel', 'cta']) expect(card, k).toMatch(new RegExp(`r\\.${k}\\b`));
    expect(card).toMatch(/noteReminderPrimeShown\(\)/);
    // BL-532: the card says the child's name, in the app only; the words carry {child} and the card fills it.
    expect(en.onboarding.reminder.body).toContain("{child}");
    expect(card).toMatch(/renderTemplate\(r\.body, \{ child: childLabel\(getActiveChild\(\)\?\.name\) \}\)/);
    expect(en.onboarding.reminder.body.replace('{child}', 'Asha')).toMatch(/to add to Asha's book/);
    // "No reminders" never opens the OS alert.
    const none = card.slice(card.indexOf('const none = () =>'), card.indexOf('return (', card.indexOf('const none = () =>')));
    expect(none).not.toMatch(/enableReminders/);
  });
});
