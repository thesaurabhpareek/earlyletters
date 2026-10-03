/**
 * Analytics part of the one-ask-per-session rule (PRD-REQ-001, K-01). The ask
 * sequencer (`nextAsk`, BL-023) passes what it knows about the other asks;
 * this adds the stored consent and the unanswered-offer count. When it is
 * due, show `<AnalyticsConsentSheet>` and call `recordAnalyticsOffer()` once
 * when it appears.
 */
import { analyticsConsentDue, CONSENT_OFFERS_KEY, type AnalyticsAskState, type AnalyticsAskVerdict } from '@scribe/analytics';
import { getSetting, setSetting } from '@/lib/store';
import { analytics } from './index';

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
}
