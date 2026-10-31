/**
 * Feeds `nextAsk` (./next-ask.logic, tested) what the phone knows, and remembers what was asked.
 * Review calls `askAfterSave()` once per kept letter, then acts on the answer after the Book lands:
 * `keep_book` opens the sign-in sheet, `reminder_prime` asks `<ReminderPrimeAsk>` (mounted in the root
 * layout) to show the reminder card over the Book.
 *
 * Device settings (plain values, no names or text):
 *
 * | Key | Value |
 * |---|---|
 * | `asks.reminderPrimes` | times the reminder prime was shown, from any source (cap MAX_REMINDER_PRIMES) |
 * | `asks.keepBookOffered` | `on` once the Keep the book sheet was offered after a letter |
 * | `asks.firstLetterSession` | session key (ms epoch) in which the first letter was saved |
 * | `asks.lastAskDay` | local day (YYYY-MM-DD) of the last ask, for one ask per calendar day |
 *
 * Sessions are tracked here, not by the analytics lifecycle, because analytics is off in the whole 1.0 line
 * (D-124 item 3) and its lifecycle never starts then. A session is a process start, or a return to the
 * foreground after 30 minutes or more away (F02 6.1).
 */
import { AppState } from 'react-native';
import { noteAskShown } from '@/lib/analytics/ask';
import { getSetting, listChildren, listEntriesForChild, listHiddenChildren, setSetting } from '@/lib/store';
import { readPrefs } from '@/lib/reminders/prefs';
import { localDay, nextAsk, sessionAfterForeground, type NextAsk } from './next-ask.logic';

export { MAX_REMINDER_PRIMES, nextAsk, primeAllowed, type AskFacts, type NextAsk } from './next-ask.logic';

const K = {
  primes: 'asks.reminderPrimes',
  keepBook: 'asks.keepBookOffered',
  firstLetterSession: 'asks.firstLetterSession',
  lastAskDay: 'asks.lastAskDay',
} as const;

let session = Date.now();
let backgroundedAt: number | null = null;
let askSession: number | null = null;
AppState.addEventListener('change', (state) => {
  if (state === 'background') backgroundedAt = Date.now();
  else if (state === 'active') {
    session = sessionAfterForeground(session, backgroundedAt, Date.now());
    backgroundedAt = null;
  }
});

const count = (key: string): number => {
  const n = Number(getSetting(key) ?? '0');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** Letters on this phone, any book; "Not much today" notes do not count (as lib/analytics/ask.ts). */
function lettersOnPhone(): number {
  let n = 0;
  for (const child of [...listChildren(), ...listHiddenChildren()]) {
    for (const e of listEntriesForChild(child.id)) if (e.kind !== 'not_much') n++;
  }
  return n;
}

/** Any ask appeared now: no other ask this session or this calendar day. */
export function noteAsked(now = Date.now()): void {
  askSession = session;
  setSetting(K.lastAskDay, localDay(now));
  noteAskShown(); // the analytics consent sequencer reads the same rule
}

/** The reminder prime appeared (after the first letter, or from Settings): counts toward the cap of 2. */
export function noteReminderPrimeShown(): void {
  setSetting(K.primes, String(count(K.primes) + 1));
  noteAsked();
}

/**
 * Call once right after a letter is kept, with `firstLetter` true when the phone had no letter before it.
 * Returns the one ask due, and records it as shown when it is the account sheet (the card records itself when it appears).
 */
export function askAfterSave(input: { firstLetter: boolean; signInOffered: boolean }, now = Date.now()): NextAsk {
  try {
    if (input.firstLetter && getSetting(K.firstLetterSession) === null) setSetting(K.firstLetterSession, String(session));
    const stored = Number(getSetting(K.firstLetterSession));
    const ask = nextAsk({
      lettersSaved: lettersOnPhone(),
      firstLetter: input.firstLetter,
      primesShown: count(K.primes),
      remindersOn: readPrefs().enabled,
      signInOffered: input.signInOffered,
      keepBookOffered: getSetting(K.keepBook) === 'on',
      firstLetterSession: Number.isFinite(stored) && stored > 0 ? stored : null,
      session,
      askShownThisSession: askSession === session,
      askShownToday: getSetting(K.lastAskDay) === localDay(now),
    });
    if (ask === 'keep_book') {
      setSetting(K.keepBook, 'on');
      noteAsked(now);
    }
    return ask;
  } catch {
    return null; // an ask is never worth an error after a save
  }
}

// ── The reminder card's request, for <ReminderPrimeAsk> ──────────────────
let primeRequested = false;
const listeners = new Set<() => void>();

/** Review: the Book is on screen after the first letter; show the reminder card over it. */
export function requestReminderPrime(): void {
  primeRequested = true;
  for (const l of listeners) l();
}

/** The host took the request (it shows the card once). */
export function takeReminderPrimeRequest(): boolean {
  const was = primeRequested;
  primeRequested = false;
  return was;
}

export function subscribeReminderPrime(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
