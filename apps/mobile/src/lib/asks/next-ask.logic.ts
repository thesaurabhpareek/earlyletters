/**
 * The ask order after a saved letter (F02 6.1 "every ask in the first 14 days", DR-12 B,
 * F13-REQ-023, C-REQ-001 Rev). Pure and tested (test/next-ask.test.ts); `lib/asks/index.ts`
 * feeds it what the phone knows, and Review acts on its answer once the Book is on screen.
 *
 * The order at launch (DR-12 B, the spec default in `docs/prd/v2/09-decisions-and-risks.md`):
 *   1. `reminder_prime`: the first ask slot after the first saved letter. At most 2 primes ever
 *      (C-REQ-001 Rev); the second one (after the first month chapter, F13 6.2 B row 4c) is not built.
 *   2. `keep_book`: the account sheet, on the first save in session 2 or the second saved letter,
 *      whichever comes first; offered once here (the "after the third letter if Later" re-offer is not built).
 *   3. Analytics consent stays with its own sequencer (lib/analytics/ask.ts) and is off in the 1.0 line (D-124 item 3).
 *
 * At most one ask per session and one per calendar day (F02 6.1), so a second letter in the same session as the
 * prime waits for the next session's first save. If the founder picks A after the C1 cohorts, only this table changes.
 */

export type NextAsk = 'reminder_prime' | 'keep_book' | null;

/** C-REQ-001 Rev: "Given No reminders twice, Then the card never shows a third time". */
export const MAX_REMINDER_PRIMES = 2;

/** A session starts at a cold start or at a return after 30 minutes or more away (F02 6.1, the analytics lifecycle). */
export const ASK_SESSION_GAP_MS = 30 * 60 * 1000;

export interface AskFacts {
  /** Letters on this phone after this save, any book ("Not much today" notes excluded). */
  lettersSaved: number;
  /** True when this save made the phone's first letter. */
  firstLetter: boolean;
  /** Times the reminder prime has been shown, from any source. */
  primesShown: number;
  /** Reminders already on (the person turned them on in Settings): nothing to prime. */
  remindersOn: boolean;
  /** Build 2 and signed out: the account sheet can be offered at all. */
  signInOffered: boolean;
  /** The Keep the book sheet was offered before on this phone. */
  keepBookOffered: boolean;
  /** Key of the session in which the first letter was saved; null when unknown (letters from before this sequencer). */
  firstLetterSession: number | null;
  /** Key of the current session. */
  session: number;
  /** An ask (any) already appeared in this session. */
  askShownThisSession: boolean;
  /** An ask (any) already appeared on this local calendar day. */
  askShownToday: boolean;
}

/** Whether another prime may ever show (the cap alone; the slot rule is in `nextAsk`). */
export function primeAllowed(primesShown: number): boolean {
  return primesShown < MAX_REMINDER_PRIMES;
}

/** The one ask due right after this save, or null. */
export function nextAsk(f: AskFacts): NextAsk {
  if (f.lettersSaved < 1) return null;
  if (f.askShownThisSession || f.askShownToday) return null;
  // 1. The first ask slot after the first letter goes to the reminder prime.
  if (f.firstLetter && f.primesShown === 0 && primeAllowed(f.primesShown) && !f.remindersOn) return 'reminder_prime';
  // 2. Keep the book: never on the first letter's save; on the second letter, or the first save of a later session.
  if (f.signInOffered && !f.keepBookOffered && !f.firstLetter) {
    const laterSession = f.firstLetterSession === null || f.session !== f.firstLetterSession;
    if (f.lettersSaved >= 2 || laterSession) return 'keep_book';
  }
  return null;
}

/**
 * Session keys from foreground and background times. `startedAt` is the key; a return after
 * ASK_SESSION_GAP_MS or more away starts a new session.
 */
export function sessionAfterForeground(current: number, backgroundedAt: number | null, now: number): number {
  if (backgroundedAt === null) return current;
  return now - backgroundedAt >= ASK_SESSION_GAP_MS ? now : current;
}

/** Local calendar day, YYYY-MM-DD, for the one-ask-per-day rule. */
export function localDay(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
