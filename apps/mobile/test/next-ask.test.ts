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
  localDay,
  nextAsk,
  primeAllowed,
  sessionAfterForeground,
  type AskFacts,
} from '../src/lib/asks/next-ask.logic';

const S1 = 1_000;
const S2 = 9_000_000;
const facts = (over: Partial<AskFacts> = {}): AskFacts => ({
  lettersSaved: 1,
  firstLetter: true,
  primesShown: 0,
  remindersOn: false,
  signInOffered: true,
  keepBookOffered: false,
  firstLetterSession: S1,
  session: S1,
  askShownThisSession: false,
  askShownToday: false,
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

  it('one ask per calendar day', () => {
    expect(nextAsk(facts({ firstLetter: false, lettersSaved: 2, primesShown: 1, session: S2, askShownToday: true }))).toBeNull();
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
    expect(card).toMatch(/renderTemplate\(r\.body, \{ child: getActiveChild\(\)\?\.name \|\| 'your little one' \}\)/);
    expect(en.onboarding.reminder.body.replace('{child}', 'Asha')).toMatch(/to add to Asha's book/);
    // "No reminders" never opens the OS alert.
    const none = card.slice(card.indexOf('const none = () =>'), card.indexOf('return (', card.indexOf('const none = () =>')));
    expect(none).not.toMatch(/enableReminders/);
  });
});
