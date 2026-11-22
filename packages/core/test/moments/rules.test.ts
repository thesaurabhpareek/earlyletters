import { describe, expect, it } from 'vitest';
import * as rules from '../../src/moments/rules';
import { MOMENTS_RULES } from '../../src/moments';

describe('NS-53 rules as data (7.2a)', () => {
  it('[NS-53-R281] the PROPOSED values of 7.2a, in seconds', () => {
    expect(rules.NEAR_SECONDS).toBe(10);
    expect(rules.NEAR_GROUP_MAX).toBe(60);
    expect(rules.MIN_SPAN).toBe(2 * 3600);
    expect(rules.SESSION_GAP).toBe(3 * 3600);
    expect(rules.BUSY_DAY).toBe(5);
    expect(rules.BUSY_HOURS).toEqual({ count: 4, withinSeconds: 3 * 3600 });
    expect(rules.PLACE_RARE_SHARE).toBe(0.15);
    expect(rules.WINDOW_DAYS).toBe(90);
  });

  it('[NS-53-R281] the junk bars are 3 in 10 before Not this one and 2 in 10 after one use', () => {
    expect(rules.JUNK_BAR.beforeNotThisOne).toBeCloseTo(0.3);
    expect(rules.JUNK_BAR.afterNotThisOne).toBeCloseTo(0.2);
    expect(rules.JUNK_BAR.afterNotThisOne).toBeLessThan(rules.JUNK_BAR.beforeNotThisOne);
  });

  it('[NS-53-R281] both busy-day predicates sit behind one rules field, default the span rule', () => {
    expect(MOMENTS_RULES.spanPredicate).toBe('span');
    expect(MOMENTS_RULES.busyHours.count).toBeGreaterThan(0);
  });

  it('[NS-53-R267] [NS-53-R205] the rules object is versioned, frozen, and each value is defined once', () => {
    expect(rules.MOMENTS_RULES_VERSION).toBe(3);
    expect(MOMENTS_RULES.version).toBe(rules.MOMENTS_RULES_VERSION);
    expect(Object.isFrozen(MOMENTS_RULES)).toBe(true);
    expect(MOMENTS_RULES).toMatchObject({
      windowDays: rules.WINDOW_DAYS, busyDay: rules.BUSY_DAY, minSpan: rules.MIN_SPAN,
      sessionGap: rules.SESSION_GAP, nearSeconds: rules.NEAR_SECONDS, nearGroupMax: rules.NEAR_GROUP_MAX,
      placeRareShare: rules.PLACE_RARE_SHARE,
    });
  });

  it('[NS-53-R281] values are sane against each other: near gap below the chain cap, cap below a session', () => {
    expect(rules.NEAR_SECONDS).toBeLessThan(rules.NEAR_GROUP_MAX);
    expect(rules.NEAR_GROUP_MAX).toBeLessThan(rules.SESSION_GAP);
    expect(rules.MIN_SPAN).toBeLessThan(rules.SESSION_GAP);
    expect(rules.PLACE_RARE_SHARE).toBeGreaterThan(0);
    expect(rules.PLACE_RARE_SHARE).toBeLessThan(0.5);
  });
});
