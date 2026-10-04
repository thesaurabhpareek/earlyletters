/**
 * Analytics part of the one-ask-per-session rule (PRD-REQ-001, K-01). The
 * pure rules are `analyticsConsentDue` (@scribe/analytics) and
 * `consentAskVerdict` (./ask-sequencer.logic); this file feeds them what the
 * phone knows. `components/consent/consent-ask.tsx` shows
 * `<AnalyticsConsentSheet>` when `analyticsAskDueNow(segments)` says so and
 * calls `recordAnalyticsOffer()` once when it appears.
 */
import { analyticsConsentDue, CONSENT_OFFERS_KEY, type AnalyticsAskState, type AnalyticsAskVerdict } from '@scribe/analytics';
import { getSetting, listChildren, listEntriesForChild, listHiddenChildren, setSetting } from '@/lib/store';
import { consentAskVerdict } from './ask-sequencer.logic';
import { analytics, lifecycle } from './index';

export type AnalyticsAskInput = Omit<AnalyticsAskState, 'consent' | 'offersSoFar'>;

function offers(): number {
  const n = Number(getSetting(CONSENT_OFFERS_KEY) ?? '0');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function analyticsAskDue(input: AnalyticsAskInput): AnalyticsAskVerdict {
  return analyticsConsentDue({ ...input, consent: analytics.consent(), offersSoFar: offers() });
}

/** The sheet was shown. An answer ends the asking anyway; this caps unanswered showings at two. */
export function recordAnalyticsOffer(): void {
  setSetting(CONSENT_OFFERS_KEY, String(offers() + 1));
  noteAskShown();
}

// ---------------------------------------------------------------------------
// Session state for the sequencer (memory only; a new process is a new session)
// ---------------------------------------------------------------------------

let askShownInSession: number | null = null;
const lettersAtStart = new Map<number, number>();

/** Any ask (this one, Keep the book, the reminder prime) appeared: no other ask this session. */
export function noteAskShown(): void {
  askShownInSession = lifecycle.session().startedAt;
}

function letterFacts(): { count: number; firstAt: number | null } {
  let count = 0;
  let firstAt: number | null = null;
  for (const child of [...listChildren(), ...listHiddenChildren()]) {
    for (const e of listEntriesForChild(child.id)) {
      if (e.kind === 'not_much') continue;
      count++;
      const at = Date.parse(e.capturedAt);
      if (Number.isFinite(at) && (firstAt === null || at < firstAt)) firstAt = at;
    }
  }
  return { count, firstAt };
}

/**
 * Whether the consent sheet should appear on the screen with these route
 * segments. Cheap when the choice is already made (no store reads).
 */
export function analyticsAskDueNow(segments: readonly string[]): AnalyticsAskVerdict {
  const consent = analytics.consent();
  if (consent !== 'unknown') return { due: false, reason: 'decided' };
  const sessionStartedAt = lifecycle.session().startedAt;
  const { count, firstAt } = letterFacts();
  // First look in this session: remember how many letters it began with.
  if (!lettersAtStart.has(sessionStartedAt)) lettersAtStart.set(sessionStartedAt, count);
  return consentAskVerdict({
    consent,
    offersSoFar: offers(),
    lettersNow: count,
    lettersAtSessionStart: lettersAtStart.get(sessionStartedAt) ?? null,
    firstLetterCapturedAt: firstAt,
    sessionStartedAt,
    askShownInSession,
    segments,
  });
}
