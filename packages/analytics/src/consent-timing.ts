/**
 * When the analytics consent sheet may appear (PRD-REQ-001, K-01,
 * TRACKING_PLAN section 0 and 2, TDD 01 3.11.3). Pure and tested.
 *
 * The ask sequencer (`nextAsk` in packages/core, BL-023) owns the order of
 * all asks; it calls this for the analytics part. Rules:
 * 1. Only while the choice is still open (`unknown`).
 * 2. Only after the first saved letter, and never in the session in which the
 *    first letter was saved (a later session).
 * 3. Third in line: Keep the book and the reminder prime go first when they
 *    are still pending.
 * 4. At most one ask per session, and never during recording, review or
 *    export.
 * 5. Offered at most twice if it is dismissed without an answer (Decision,
 *    TRACKING_PLAN 0.1): a calm product does not keep asking. Settings >
 *    Privacy stays available.
 */
import type { ConsentStatus } from './consent';

export const MAX_ANALYTICS_CONSENT_OFFERS = 2;
/** Device setting holding `offersSoFar` (a count, L2). */
export const CONSENT_OFFERS_KEY = 'scribe.analytics.consent_offers';

export interface AnalyticsAskState {
  consent: ConsentStatus;
  /** Letters saved on this phone (any book, any destination). */
  lettersSaved: number;
  /** The first letter was saved in the current session. */
  firstLetterThisSession: boolean;
  /** Another ask (or this one) has already been shown this session. */
  askShownThisSession: boolean;
  /** Keep the book (sign-in) has not been answered yet and is still eligible. */
  keepTheBookPending: boolean;
  /** The reminder prime has not been answered yet and is still eligible. */
  reminderPrimePending: boolean;
  /** Recording, review or export is on screen. */
  blockingSurface: boolean;
  /** Times the sheet was shown without an answer (stored by the app). */
  offersSoFar: number;
}

export type AnalyticsAskVerdict =
  | { due: true }
  | {
      due: false;
      reason: 'decided' | 'no_letter_yet' | 'same_session_as_first_letter' | 'ask_already_this_session' | 'earlier_ask_pending' | 'blocking_surface' | 'offered_enough';
    };

export function analyticsConsentDue(s: AnalyticsAskState): AnalyticsAskVerdict {
  if (s.consent !== 'unknown') return { due: false, reason: 'decided' };
  if (s.lettersSaved < 1) return { due: false, reason: 'no_letter_yet' };
  if (s.firstLetterThisSession) return { due: false, reason: 'same_session_as_first_letter' };
  if (s.askShownThisSession) return { due: false, reason: 'ask_already_this_session' };
  if (s.keepTheBookPending || s.reminderPrimePending) return { due: false, reason: 'earlier_ask_pending' };
  if (s.blockingSurface) return { due: false, reason: 'blocking_surface' };
  if (s.offersSoFar >= MAX_ANALYTICS_CONSENT_OFFERS) return { due: false, reason: 'offered_enough' };
  return { due: true };
}
