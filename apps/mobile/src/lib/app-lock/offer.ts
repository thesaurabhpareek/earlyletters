/**
 * The lock offer's answers, kept as device settings (src/lib/store.ts). No names, no text, nothing sent.
 *
 * | Key | Value |
 * |---|---|
 * | `appLock.offerAnswers` | times the card was answered |
 * | `appLock.offerNotNowAt` | ms epoch of the last "Not now" |
 *
 * The rule is in ./offer.logic.ts. Imports only the store, so lib/asks can read it without loading the authentication module.
 */
import { getSetting, setSetting } from '../store';
import { EMPTY_LOCK_OFFER_RECORD, afterLockOfferAnswer, parseLockOfferRecord, type LockOfferRecord } from './offer.logic';

export const LOCK_OFFER_KEYS = { answers: 'appLock.offerAnswers', notNowAt: 'appLock.offerNotNowAt' } as const;

/** A store that cannot be read counts as no record. */
export function readLockOfferRecord(): LockOfferRecord {
  try {
    return parseLockOfferRecord(getSetting(LOCK_OFFER_KEYS.answers), getSetting(LOCK_OFFER_KEYS.notNowAt));
  } catch {
    return EMPTY_LOCK_OFFER_RECORD;
  }
}

export function noteLockOfferAnswer(answer: 'turnedOn' | 'notNow' | 'unavailable', now = Date.now()): void {
  try {
    const next = afterLockOfferAnswer(readLockOfferRecord(), answer, now);
    setSetting(LOCK_OFFER_KEYS.answers, String(next.answers));
    setSetting(LOCK_OFFER_KEYS.notNowAt, next.notNowAt === null ? '' : String(next.notNowAt));
  } catch {
    // an answer is never worth an error
  }
}
