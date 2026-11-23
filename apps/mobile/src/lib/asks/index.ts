/**
 * Feeds `nextAsk` (./next-ask.logic, tested) what the phone knows, and remembers what was asked.
 * Review calls `askAfterSave()` once per kept letter, then acts on the answer after the Book lands:
 * `keep_book` opens the sign-in sheet, `reminder_prime` asks `<ReminderPrimeAsk>` (mounted in the tabs
 * layout) to show the reminder card over the Book.
 *
 * Device settings (plain values, no names or text):
 *
 * | Key | Value |
 * |---|---|
 * | `asks.reminderPrimes` | times the reminder prime was shown, from any source (cap MAX_REMINDER_PRIMES) |
 * | `asks.reminderPrimeYes` | `on` once the person said Yes to the reminder prime; they are never primed again (BL-1430). Device only, L2, no text or names; the erase-all path clears every settings row |
 * | `asks.keepBookOffered` | `on` once the Keep the book sheet was offered after a letter |
 * | `asks.keepBookReoffered` | `on` once the one re-offer of Keep the book was made (after the third letter, BL-519) |
 * | `asks.firstLetterSession` | session key (ms epoch) in which the first letter was saved |
 * | `asks.firstLetterAt` | time (ms epoch) of the first letter, for the second prime after the first month (BL-518) |
 * | `asks.lastAskDay` | local day (YYYY-MM-DD) the two counts below belong to; a different day means both are 0 (reset at local midnight) |
 * | `asks.asksToday` | setup asks shown on that day (cap MAX_ASKS_PER_DAY, BL-1784) |
 * | `asks.osAsksToday` | OS-alert or consent asks shown on that day (cap MAX_OS_ASKS_PER_DAY, BL-1784) |
 * | `asks.keptLetterSessions`, `asks.lastKeptSession` | sessions that ended in a kept letter (./kept-sessions; stays on the phone) |
 *
 * Sessions are tracked here, not by the analytics lifecycle, because analytics is off in the whole 1.0 line
 * (D-124 item 3) and its lifecycle never starts then. A session is a process start, or a return to the
 * foreground after 30 minutes or more away (F02 6.1).
 */
import { AppState } from 'react-native';
import { noteAskShown } from '@/lib/analytics/ask';
import { getSetting, listChildren, listEntriesForChild, listHiddenChildren, setSetting } from '@/lib/store';
import { readPrefs } from '@/lib/reminders/prefs';
import { createKeptSessionCounter } from './kept-sessions';
import { recordDayAsk, todayCounts } from './day-store';
import { firstMonthDone, nextAsk, reminderPrimeSource, sessionAfterForeground, type AskKind, type NextAsk } from './next-ask.logic';

type ReminderPrimeSource = ReturnType<typeof reminderPrimeSource>;

export { KEPT_SESSIONS_KEY, LAST_KEPT_SESSION_KEY, type KeptSessionCounter } from './kept-sessions';
export { MAX_ASKS_PER_DAY, MAX_OS_ASKS_PER_DAY, MAX_REMINDER_PRIMES, nextAsk, primeAllowed, type AskFacts, type NextAsk } from './next-ask.logic';

const K = {
  primes: 'asks.reminderPrimes',
  primeYes: 'asks.reminderPrimeYes',
  keepBook: 'asks.keepBookOffered',
  keepBookReoffer: 'asks.keepBookReoffered',
  firstLetterSession: 'asks.firstLetterSession',
  firstLetterAt: 'asks.firstLetterAt',
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

const keptSessions = createKeptSessionCounter({ get: getSetting, set: setSetting });

/**
 * Sessions that ended in at least one kept letter, counted on this phone only (NX-31-R14). For the lock and reminder
 * sequencer to come; nothing reads it yet, and nothing about it is sent or tracked.
 */
export function keptLetterSessions(): number {
  try {
    return keptSessions.keptLetterSessions();
  } catch {
    return 0;
  }
}

/** Any ask appeared now: no other ask this session, and it counts toward the day totals (BL-1784). */
export function noteAsked(kind: AskKind, now = Date.now()): void {
  askSession = session;
  recordDayAsk(kind, now);
  noteAskShown(); // the analytics consent sequencer reads the session rule
}

/**
 * The reminder prime appeared: counts toward the cap of 2. Returns the analytics `source` for this showing
 * (`first_letter` for the first, `first_month` for the second), read before the count moves (BL-1429).
 */
export function noteReminderPrimeShown(): ReminderPrimeSource {
  const source = reminderPrimeSource(count(K.primes));
  setSetting(K.primes, String(count(K.primes) + 1));
  noteAsked('reminder_prime');
  return source;
}

/** The person said Yes to the reminder prime (either Yes button): it never shows again, even if they turn reminders off later (BL-1430). */
export function noteReminderPrimeYes(): void {
  setSetting(K.primeYes, 'on');
}

/**
 * Call once right after a letter is kept, with `firstLetter` true when the phone had no letter before it.
 * Returns the one ask due, and records it as shown when it is the account sheet (the card records itself when it appears).
 */
export function askAfterSave(input: { firstLetter: boolean; signInOffered: boolean; surfaceBusy?: boolean }, now = Date.now()): NextAsk {
  try {
    keptSessions.noteLetterKept(session);
  } catch {
    // a count is never worth an error after a save
  }
  try {
    if (input.firstLetter && getSetting(K.firstLetterSession) === null) setSetting(K.firstLetterSession, String(session));
    if (input.firstLetter && getSetting(K.firstLetterAt) === null) setSetting(K.firstLetterAt, String(now));
    const at = Number(getSetting(K.firstLetterAt));
    const stored = Number(getSetting(K.firstLetterSession));
    const today = todayCounts(now);
    const ask = nextAsk({
      lettersSaved: lettersOnPhone(),
      firstLetter: input.firstLetter,
      primesShown: count(K.primes),
      primeAnsweredYes: getSetting(K.primeYes) === 'on',
      remindersOn: readPrefs().enabled,
      signInOffered: input.signInOffered,
      keepBookOffered: getSetting(K.keepBook) === 'on',
      keepBookReoffered: getSetting(K.keepBookReoffer) === 'on',
      firstLetterSession: Number.isFinite(stored) && stored > 0 ? stored : null,
      session,
      askShownThisSession: askSession === session,
      asksShownToday: today.asks,
      osAsksShownToday: today.osAsks,
      surfaceBusy: input.surfaceBusy,
      firstMonthDone: firstMonthDone(Number.isFinite(at) && at > 0 ? at : null, now),
    });
    if (ask === 'keep_book') {
      if (getSetting(K.keepBook) === 'on') setSetting(K.keepBookReoffer, 'on');
      setSetting(K.keepBook, 'on');
      noteAsked('keep_book', now);
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
