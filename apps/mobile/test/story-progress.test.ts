/** Story progress segments (motion spec section 4): linear fill, restart on the remaining time, static under Reduce Motion. */
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { initialStoryClock, storyClock } from '../src/lib/story/story-clock.logic';
import { progressA11y, remainingMs, segmentFills } from '../src/lib/story/story-progress.logic';

const D = tokens.motion.story.dwellMs;

describe('story progress', () => {
  it('linear bar is on in the tokens: the fill is elapsed over dwell, no easing curve', () => {
    expect(tokens.motion.story.linearBar).toBe(true);
    expect(segmentFills({ index: 1, count: 3, elapsedMs: D / 2, dwellMs: D })).toEqual([1, 0.5, 0]);
    expect(segmentFills({ index: 1, count: 3, elapsedMs: D / 4, dwellMs: D })[1]).toBe(0.25);
  });

  it('completed segments are full, upcoming are empty, card 0 at zero is all empty', () => {
    expect(segmentFills({ index: 0, count: 3, elapsedMs: 0, dwellMs: D })).toEqual([0, 0, 0]);
    expect(segmentFills({ index: 2, count: 3, elapsedMs: 0, dwellMs: D })).toEqual([1, 1, 0]);
  });

  it('the fill is clamped to 0..1 and a bad value is 0', () => {
    expect(segmentFills({ index: 0, count: 2, elapsedMs: D * 9, dwellMs: D })[0]).toBe(1);
    expect(segmentFills({ index: 0, count: 2, elapsedMs: -5, dwellMs: D })[0]).toBe(0);
    expect(segmentFills({ index: 0, count: 2, elapsedMs: Number.NaN, dwellMs: D })[0]).toBe(0);
  });

  it('going back refills the previous segment from empty (a fresh dwell)', () => {
    let s = initialStoryClock(3);
    s = storyClock(s, { type: 'next' }).state;
    s = storyClock(s, { type: 'tick', dtMs: 3000 }).state;
    s = storyClock(s, { type: 'back' }).state;
    expect(segmentFills({ index: s.index, count: s.count, elapsedMs: s.elapsedMs, dwellMs: D })).toEqual([0, 0, 0]);
  });

  it('the last card fills and holds at full, never past it', () => {
    expect(segmentFills({ index: 2, count: 3, elapsedMs: D, dwellMs: D })).toEqual([1, 1, 1]);
  });

  it('[FR-13] Reduce Motion: static segments, no partial fill; seen and current are full', () => {
    expect(segmentFills({ index: 1, count: 3, elapsedMs: 1234, dwellMs: D, reduced: true })).toEqual([1, 1, 0]);
  });

  it('after a pause the animation restarts for the remaining time only', () => {
    expect(remainingMs({ elapsedMs: 0, dwellMs: D })).toBe(D);
    expect(remainingMs({ elapsedMs: 2500, dwellMs: D })).toBe(3500);
    expect(remainingMs({ elapsedMs: D + 10, dwellMs: D })).toBe(0);
  });

  it('one accessibility element: position only, no count of what is left or owed', () => {
    expect(progressA11y(1, 3)).toEqual({ now: 2, max: 3 });
    expect(progressA11y(9, 3)).toEqual({ now: 3, max: 3 });
    expect(progressA11y(0, 0)).toEqual({ now: 0, max: 0 });
  });
});
