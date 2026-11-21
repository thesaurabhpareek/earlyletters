import { describe, expect, it } from 'vitest';
import { CLIPPED_DELTA, makeWheelGovernor } from '../src/film/wheel-governor';

describe('wheel governor', () => {
  it('leaves a normal scroll alone', () => {
    const g = makeWheelGovernor();
    expect(g(40, 0)).toBe(40);
    expect(g(40, 50)).toBe(40);
    expect(g(-30, 400)).toBe(-30);
  });
  it('caps one huge event', () => {
    expect(makeWheelGovernor()(900, 0)).toBe(100);
    expect(makeWheelGovernor()(-900, 0)).toBe(-100);
  });
  it('caps a burst: a hard flick moves at most the window budget per 100 ms', () => {
    const g = makeWheelGovernor();
    let total = 0;
    let clips = 0;
    for (let t = 0; t < 100; t += 8) {
      const out = g(100, t);
      if (out === CLIPPED_DELTA) clips++;
      else total += out;
    }
    expect(total).toBeLessThanOrEqual(200); // the real movement still stops at the budget exactly
    expect(total).toBeGreaterThan(150);
    expect(clips * CLIPPED_DELTA).toBeLessThan(0.2); // what the clipped events add is invisible
  });
  it('recovers after the window passes', () => {
    const g = makeWheelGovernor();
    g(100, 0);
    g(100, 10);
    expect(g(100, 20)).toBe(CLIPPED_DELTA);
    expect(g(100, 200)).toBe(100);
  });
  it('never reports exactly 0 for a clipped event: Lenis ignores those, so the browser would scroll anyway', () => {
    const g = makeWheelGovernor();
    let clipped = 0;
    for (let t = 0; t < 400; t += 8) {
      const out = g(120, t);
      expect(out).not.toBe(0);
      expect(out).toBeGreaterThan(0);
      if (out === CLIPPED_DELTA) clipped++;
    }
    expect(clipped).toBeGreaterThan(10); // a hard flick does clip a lot of events
  });
  it('keeps the sign of a clipped event, and the clip is too small to move anything', () => {
    const g = makeWheelGovernor();
    g(-100, 0);
    g(-100, 5);
    const out = g(-100, 10);
    expect(out).toBe(-CLIPPED_DELTA);
    expect(Math.abs(out)).toBeLessThan(0.1);
  });
  it('passes an event with no vertical movement through as 0', () => {
    expect(makeWheelGovernor()(0, 0)).toBe(0);
  });
});
