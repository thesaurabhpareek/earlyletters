/**
 * The app's ask sequencer for the analytics consent sheet (PRD-REQ-001, K-01,
 * BL-023, TRACKING_PLAN section 9 "Consent sheet"). Pure and tested
 * (ask-sequencer.logic.test.ts); `components/consent/consent-ask.tsx` feeds it
 * the live facts and shows `<AnalyticsConsentSheet>` when it says so.
 *
 * The rules themselves live in `@scribe/analytics` (`analyticsConsentDue`).
 * This file turns what the phone knows into that function's input:
 *
 * - A session is the analytics lifecycle's (cold start, or back after 30
 *   minutes away): `sessionStartedAt`.
 * - "First letter this session": there were no letters when this session
 *   began and there are now, or the earliest letter was captured after the
 *   session began.
 * - Only on a calm surface: a tab root (Tonight, Book, Family). Recording,
 *   Review, Write, export, sign-in, onboarding, a letter and every sheet route
 *   count as blocking, so the ask never interrupts a task.
 * - Keep the book is offered once, straight after the first letter (Review
 *   hands over to the sign-in sheet in that same session), and the reminder
 *   prime appears only when someone turns reminders on in Settings. Neither
 *   waits for a later session, so neither is ever "pending" here.
 */
import { analyticsConsentDue, type AnalyticsAskVerdict, type ConsentStatus } from '@scribe/analytics';

/** File-route segments of the screens where an ask may appear (expo-router `useSegments`). */
export function isCalmSurface(segments: readonly string[]): boolean {
  return segments[0] === '(tabs)' && segments.length <= 2;
}

export interface SessionAskFacts {
  consent: ConsentStatus;
  /** Times the sheet was shown without an answer (CONSENT_OFFERS_KEY). */
  offersSoFar: number;
  /** Letters on this phone now, any book, any destination ("Not much today" notes excluded). */
  lettersNow: number;
  /** Letters when this session began; null when not sampled yet in this session. */
  lettersAtSessionStart: number | null;
  /** ms epoch the earliest letter was captured; null when there is none. */
  firstLetterCapturedAt: number | null;
  /** ms epoch this session began (analytics lifecycle). */
  sessionStartedAt: number;
  /** ms epoch session start of the session in which an ask was last shown; null when never. */
  askShownInSession: number | null;
  /** Current route segments. */
  segments: readonly string[];
}

export function firstLetterThisSession(f: Pick<SessionAskFacts, 'lettersNow' | 'lettersAtSessionStart' | 'firstLetterCapturedAt' | 'sessionStartedAt'>): boolean {
  if (f.lettersNow < 1) return false;
  if (f.lettersAtSessionStart === 0) return true;
  return f.firstLetterCapturedAt !== null && f.firstLetterCapturedAt >= f.sessionStartedAt;
}

/** Whether the analytics consent sheet should appear now, and if not, why. */
export function consentAskVerdict(f: SessionAskFacts): AnalyticsAskVerdict {
  return analyticsConsentDue({
    consent: f.consent,
    offersSoFar: f.offersSoFar,
    lettersSaved: f.lettersNow,
    firstLetterThisSession: firstLetterThisSession(f),
    askShownThisSession: f.askShownInSession !== null && f.askShownInSession === f.sessionStartedAt,
    keepTheBookPending: false,
    reminderPrimePending: false,
    blockingSurface: !isCalmSurface(f.segments),
  });
}

/**
 * How the sheet's close maps to what is remembered. A yes or a no ends the
 * asking for good (the consent store keeps the answer); closing without a
 * choice is not a no: the offer was already counted when the sheet appeared,
 * so at most two unanswered showings ever happen.
 */
export type ConsentAskOutcome = 'granted' | 'declined' | 'dismissed';
export function askAgainLater(outcome: ConsentAskOutcome, offersSoFar: number, maxOffers: number): boolean {
  return outcome === 'dismissed' && offersSoFar < maxOffers;
}
