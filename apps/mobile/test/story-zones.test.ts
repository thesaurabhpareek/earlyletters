/** Story tap, hold and swipe decisions (FR-03 to FR-06; motion spec section 5). Pure functions. */
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { classifyPress, swipeDecision, tapDecision, zoneForX } from '../src/lib/story/story-zones.logic';

const W = 400;

describe('story zones', () => {
  it('the token values are the motion spec numbers', () => {
    expect(tokens.motion.story).toEqual({ dwellMs: 6000, holdMs: 200, edgeZone: 0.3, linearBar: true });
  });

  it('[FR-03/04] LTR: left 30 percent is back, the rest is next', () => {
    expect(zoneForX(0, W, false)).toBe('back');
    expect(zoneForX(119.9, W, false)).toBe('back');
    expect(zoneForX(120, W, false)).toBe('next');
    expect(zoneForX(399, W, false)).toBe('next');
  });

  it('RTL: the zones mirror, back is the right 30 percent', () => {
    expect(zoneForX(399, W, true)).toBe('back');
    expect(zoneForX(280.1, W, true)).toBe('back');
    expect(zoneForX(280, W, true)).toBe('next');
    expect(zoneForX(0, W, true)).toBe('next');
  });

  it('a touch outside the card or on a zero-width card is next, never a crash', () => {
    expect(zoneForX(-10, W, false)).toBe('back');
    expect(zoneForX(5000, W, false)).toBe('next');
    expect(zoneForX(10, 0, false)).toBe('next');
    expect(zoneForX(Number.NaN, W, false)).toBe('next');
  });

  it('[FR-05] a press longer than 200 ms is a hold; 200 ms or less is a tap', () => {
    expect(classifyPress(0)).toBe('tap');
    expect(classifyPress(200)).toBe('tap');
    expect(classifyPress(201)).toBe('hold');
  });

  it('a tap in a zone is that zone; a hold is never a tap (no card change on release)', () => {
    expect(tapDecision({ x: 10, width: W, rtl: false, pressMs: 80 })).toBe('back');
    expect(tapDecision({ x: 300, width: W, rtl: false, pressMs: 80 })).toBe('next');
    expect(tapDecision({ x: 300, width: W, rtl: false, pressMs: 900 })).toBe('none');
  });

  describe('swipe (FR-06)', () => {
    it('LTR: left swipe past a quarter width is next, right swipe is back', () => {
      expect(swipeDecision({ dx: -101, dy: 0, width: W, rtl: false })).toBe('next');
      expect(swipeDecision({ dx: 101, dy: 0, width: W, rtl: false })).toBe('back');
    });
    it('RTL: the directions mirror', () => {
      expect(swipeDecision({ dx: 101, dy: 0, width: W, rtl: true })).toBe('next');
      expect(swipeDecision({ dx: -101, dy: 0, width: W, rtl: true })).toBe('back');
    });
    it('a short swipe settles back; exactly a quarter width turns', () => {
      expect(swipeDecision({ dx: -99, dy: 0, width: W, rtl: false })).toBe('settle');
      expect(swipeDecision({ dx: -100, dy: 0, width: W, rtl: false })).toBe('next');
    });
    it('a fling turns even when short', () => {
      expect(swipeDecision({ dx: -30, dy: 0, vx: -900, width: W, rtl: false })).toBe('next');
      expect(swipeDecision({ dx: 30, dy: 0, vx: 900, width: W, rtl: false })).toBe('back');
    });
    it('a mostly vertical drag, and swipe down, are ignored (no dismiss)', () => {
      expect(swipeDecision({ dx: -20, dy: 200, width: W, rtl: false })).toBe('ignore');
      expect(swipeDecision({ dx: 0, dy: 300, width: W, rtl: false })).toBe('ignore');
      expect(swipeDecision({ dx: -150, dy: -400, width: W, rtl: false })).toBe('ignore');
    });
    it('zero width never turns a card', () => {
      expect(swipeDecision({ dx: -50, dy: 0, width: 0, rtl: false })).toBe('ignore');
    });
  });
});
