/**
 * When the app lock is offered (NX-31-R14, R29; journey A3, A4). Pure, no React Native, tested in Node
 * (test/lock-offer-timing.test.ts). Reads nothing and sends nothing.
 *
 * The rule: not on "The book is open." (the first night is for the letter). The card is offered once, at the end of the
 * save in the third session that ended in a kept letter (`keptLetterSessions()`, lib/asks/kept-sessions.ts, on the phone
 * only). It is due only while the lock is off. "Not now" holds it for 30 days (proposed in R14). Quitting before an answer
 * records nothing, so the next ask shows it again. The requirement says "once" and "holds 30 days": the reading here is
 * that after the hold the card may come back one more time, so it is offered at most twice in all (LOCK_OFFER_MAX). Settings
 * > Privacy > App lock is always there, whatever this says.
 *
 * Face ID is the book lock. It is separate from the account session and signs nobody in.
 */

/** The third session that ended in a kept letter (NX-31-R14). */
export const LOCK_OFFER_SESSION = 3;
/** "Not now" holds the card for 30 days (NX-31-R14, proposed). */
export const LOCK_OFFER_HOLD_MS = 30 * 24 * 60 * 60 * 1000;
/** The most times the card is answered, ever: the first offer and one more after the hold. */
export const LOCK_OFFER_MAX = 2;

export interface LockOfferRecord {
  /** Times the card was answered (Not now, or the lock turned on). */
  answers: number;
  /** When "Not now" was last said (ms epoch); null after the lock was turned on or before any answer. */
  notNowAt: number | null;
}

export const EMPTY_LOCK_OFFER_RECORD: LockOfferRecord = { answers: 0, notNowAt: null };

export interface LockOfferFacts {
  /** `keptLetterSessions()`: sessions that ended in at least one kept letter. */
  keptSessions: number;
  /** The lock is on now (turned on here or in Settings). */
  lockOn: boolean;
  record: LockOfferRecord;
  now: number;
}

export function lockOfferDue(f: LockOfferFacts): boolean {
  if (!Number.isFinite(f.keptSessions) || f.keptSessions < LOCK_OFFER_SESSION) return false;
  if (f.lockOn) return false;
  if (f.record.answers >= LOCK_OFFER_MAX) return false;
  const at = f.record.notNowAt;
  if (at === null) return true;
  // A clock set back since the answer must not hold the card for ever.
  if (at > f.now) return true;
  return f.now - at >= LOCK_OFFER_HOLD_MS;
}

/**
 * `unavailable` is not an answer: the phone cannot hold a lock (no passcode), so the card could not show. It holds the card
 * for the same 30 days and uses up none of the two offers, so the other asks are not starved and the card can come later.
 */
export function afterLockOfferAnswer(record: LockOfferRecord, answer: 'turnedOn' | 'notNow' | 'unavailable', now: number): LockOfferRecord {
  if (answer === 'unavailable') return { answers: record.answers, notNowAt: now };
  return { answers: record.answers + 1, notNowAt: answer === 'notNow' ? now : null };
}

const whole = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

/** From the two stored settings (plain numbers as text). Anything else reads as no record. */
export function parseLockOfferRecord(answers: string | null, notNowAt: string | null): LockOfferRecord {
  return { answers: whole(answers) ?? 0, notNowAt: whole(notNowAt) };
}
