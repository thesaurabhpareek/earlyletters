import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { EASING_POINTS, ENTER, FADE_MS, enterDelayMs, springParams } from '../src/lib/motion.values';

describe('motion values', () => {
  it('read from tokens', () => {
    expect(FADE_MS).toBe(200);
    expect(EASING_POINTS).toEqual([0.2, 0, 0, 1]);
    expect(ENTER).toEqual({ dy: 8, durationMs: 280, staggerMs: 30, staggerMax: 6 });
    expect(springParams('soft')).toEqual({ stiffness: 260, damping: 40, mass: 0.3 });
    expect(springParams('standard').stiffness).toBe(tokens.motion.standard.stiffness);
  });

  it('caps the entrance stagger at 6 steps (180 ms)', () => {
    expect(enterDelayMs(0)).toBe(0);
    expect(enterDelayMs(3)).toBe(90);
    expect(enterDelayMs(6)).toBe(180);
    expect(enterDelayMs(40)).toBe(180);
    expect(enterDelayMs(-2)).toBe(0);
  });
});
