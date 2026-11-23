/** ER-A01 (BL-1236): the contract types compile against a fixture row, and the gate shape is usable. */
import { describe, expect, it } from 'vitest';
import type { AnalyticsGate, BasicsPolicy, EventTier, GateDecision, GateDropReason } from '../src/contracts';

const fixture: { event: string; tier: EventTier; policy: BasicsPolicy } = {
  event: 'home:_screen_view',
  tier: 'basics',
  policy: 'ask_first',
};

// A tiny gate that mirrors the ask_first rule, to prove the interface is implementable as written.
const askFirst = (granted: boolean): AnalyticsGate => ({
  decide(_event, _tier): GateDecision {
    return granted ? { allow: true } : { allow: false, reason: 'dropped_no_consent' };
  },
});

describe('contracts', () => {
  it('lets a gate answer allow or a reason code', () => {
    expect(askFirst(false).decide(fixture.event, fixture.tier)).toEqual({ allow: false, reason: 'dropped_no_consent' });
    expect(askFirst(true).decide(fixture.event, fixture.tier)).toEqual({ allow: true });
  });

  it('names the six drop reasons of ER-A01', () => {
    const reasons: GateDropReason[] = [
      'dropped_no_consent',
      'dropped_not_basics',
      'dropped_user_off',
      'dropped_no_key',
      'dropped_profile',
      'dropped_disclosure_pending',
    ];
    expect(new Set(reasons).size).toBe(6);
  });
});
