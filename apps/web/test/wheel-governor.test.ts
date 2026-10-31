import { describe, expect, it } from 'vitest';
import { makeWheelGovernor } from '../src/film/wheel-governor';

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
    for (let t = 0; t < 100; t += 8) total += g(100, t);
    expect(total).toBeLessThanOrEqual(200);
    expect(total).toBeGreaterThan(150);
  });
  it('recovers after the window passes', () => {
    const g = makeWheelGovernor();
    g(100, 0);
    g(100, 10);
    expect(g(100, 20)).toBe(0);
    expect(g(100, 200)).toBe(100);
  });
});
