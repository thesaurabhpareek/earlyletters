import { describe, expect, it } from 'vitest';
import { pickTarget } from '../src/film/scroll-nav-map';

const tops = [400, 2000, 4200, 7000];

describe('pickTarget', () => {
  it('goes to the next part below the visitor', () => {
    expect(pickTarget(tops, 0, 1)).toBe(400);
    expect(pickTarget(tops, 400, 1)).toBe(2000);
    expect(pickTarget(tops, 2500, 1)).toBe(4200);
  });
  it('ignores a part the visitor is already resting on', () => {
    expect(pickTarget(tops, 380, 1)).toBe(2000);
  });
  it('goes to the part above, then to the very top', () => {
    expect(pickTarget(tops, 4300, -1)).toBe(4200);
    expect(pickTarget(tops, 4200, -1)).toBe(2000);
    expect(pickTarget(tops, 400, -1)).toBe(0);
  });
  it('has nowhere to go at the ends', () => {
    expect(pickTarget(tops, 7000, 1)).toBeNull();
    expect(pickTarget(tops, 0, -1)).toBeNull();
  });
});
