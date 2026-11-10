import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens';

/** The first-run story clock (motion spec FIRST-RUN-MOTION-SPEC-10nov section 2, tier B). */
describe('motion.story', () => {
  const s = tokens.motion.story;
  it('has the spec values', () => {
    expect(s).toEqual({ dwellMs: 6000, holdMs: 200, edgeZone: 0.3, linearBar: true });
  });
  it('a hold is shorter than a card rests, and a card rests longer than any one-off move', () => {
    expect(s.holdMs).toBeGreaterThan(0);
    expect(s.holdMs).toBeLessThan(s.dwellMs);
    expect(s.dwellMs).toBeGreaterThan(tokens.motion.hardCeilingMs); // a dwell is a rest, not a transition
  });
  it('the back zone is an edge, never half the card or more', () => {
    expect(s.edgeZone).toBeGreaterThan(0);
    expect(s.edgeZone).toBeLessThan(0.5);
  });
  it('the bar is a clock, so it is linear', () => {
    expect(s.linearBar).toBe(true);
  });
});
