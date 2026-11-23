/**
 * Shared analytics contract types (ER-A01, BL-1236). Types only: no runtime
 * value, no import, no SDK. Stream A owns this file; stream B imports it. It
 * is frozen after Wave 0 (ENGINEERING-REQUIREMENTS-21nov.md section 4).
 *
 * `basicsPolicy` is the one switch from D-163 and erratum E95. Its default is
 * `ask_first`: nothing is sent, queued or written before a yes. See
 * `policy.ts` for how it is resolved.
 */

/** `collect_by_default` sends content-free basics after the disclosure; `ask_first` waits for a yes. */
export type BasicsPolicy = 'collect_by_default' | 'ask_first';

/** `basics` is a screen view, click, impression or closed funnel step; everything else is `consented`. */
export type EventTier = 'basics' | 'consented';

/** Why the gate refused an event. A reason code only, never a value from the event. */
export type GateDropReason =
  | 'dropped_no_consent'
  | 'dropped_not_basics'
  | 'dropped_user_off'
  | 'dropped_no_key'
  | 'dropped_profile'
  | 'dropped_disclosure_pending';

export type GateDecision = { allow: true } | { allow: false; reason: GateDropReason };

/** The single question the send path asks before anything is captured (ER-A03 implements it). */
export interface AnalyticsGate {
  decide(event: string, tier: EventTier): GateDecision;
}
