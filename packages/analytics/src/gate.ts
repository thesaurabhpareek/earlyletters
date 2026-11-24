/**
 * The policy-aware gate (ER-A03, BL-1238). One question, asked before anything is queued, sent, or an id is minted:
 * may this event go? Pure: it reads three values the client already holds and returns a decision or a reason code.
 * A reason code never carries a value from the event.
 *
 * ask_first (the default, and the only value any build resolves to today): as before. A yes allows everything the
 * catalogue allows; anything else is `dropped_no_consent`.
 *
 * collect_by_default (never reached until the founder's flip, D-163 and D-170; `basics-policy-record.json` holds the
 * record): the person's off switch wins (`dropped_user_off`). With no answer yet, nothing passes until the in-app
 * disclosure has been shown and recorded (`dropped_disclosure_pending`), then only tier `basics` passes and
 * everything else is `dropped_not_basics`. A person who said yes may send the consented tier too.
 *
 * `dropped_no_key` and `dropped_profile` are in the contract for the adapter and the build profile (BL-1240, BL-1249).
 * This gate does not produce them.
 */
import type { AnalyticsGate, BasicsPolicy, EventTier, GateDecision } from './contracts';
import type { ConsentStatus } from './consent';

export interface GateInputs {
  policy: BasicsPolicy;
  status: () => ConsentStatus;
  disclosureShown: () => boolean;
}

export function createGate(inputs: GateInputs): AnalyticsGate {
  return {
    decide(_event: string, tier: EventTier): GateDecision {
      const status = inputs.status();
      if (inputs.policy !== 'collect_by_default') {
        // Anything that is not exactly collect_by_default behaves as ask_first.
        return status === 'granted' ? { allow: true } : { allow: false, reason: 'dropped_no_consent' };
      }
      if (status === 'denied') return { allow: false, reason: 'dropped_user_off' };
      if (status === 'granted') return { allow: true };
      if (!inputs.disclosureShown()) return { allow: false, reason: 'dropped_disclosure_pending' };
      return tier === 'basics' ? { allow: true } : { allow: false, reason: 'dropped_not_basics' };
    },
  };
}
