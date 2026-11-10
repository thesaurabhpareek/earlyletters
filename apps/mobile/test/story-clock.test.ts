/**
 * Story clock (FR-03 to FR-10, FR-13, FR-14; motion spec FIRST-RUN-MOTION-SPEC-10nov section 5).
 * Pure state machine: no timers, no React Native. Fixtures: none needed (no words).
 */
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import {
  initialStoryClock,
  isAutoAdvancing,
  storyClock,
  type StoryClockEvent,
  type StoryClockState,
} from '../src/lib/story/story-clock.logic';

const D = tokens.motion.story.dwellMs;
const run = (s: StoryClockState, ...events: StoryClockEvent[]) => {
  let state = s;
  const done: string[] = [];
  for (const e of events) {
    const r = storyClock(state, e);
    state = r.state;
    if (r.done) done.push(r.done);
  }
  return { state, done };
};
const start = () => initialStoryClock(3);

describe('story clock', () => {
  it('[FR-07] starts on card 0, running, nothing elapsed, dwell is the token (6000 ms)', () => {
    expect(D).toBe(6000);
    const s = start();
    expect(s).toMatchObject({ index: 0, count: 3, elapsedMs: 0, status: 'running' });
    expect(isAutoAdvancing(s)).toBe(true);
  });

  it('[FR-07] a card advances by itself after exactly one dwell, and the next starts from zero', () => {
    const a = run(start(), { type: 'tick', dtMs: D - 1 });
    expect(a.state.index).toBe(0);
    expect(a.state.elapsedMs).toBe(D - 1);
    const b = run(a.state, { type: 'tick', dtMs: 1 });
    expect(b.state).toMatchObject({ index: 1, elapsedMs: 0 });
  });

  it('[FR-07] a late tick moves at most one card and drops the carry-over (a stall never skips a card)', () => {
    const r = run(start(), { type: 'tick', dtMs: D * 5 });
    expect(r.state).toMatchObject({ index: 1, elapsedMs: 0 });
  });

  it('[FR-07] the last card fills and STOPS: no auto-finish into sign-in', () => {
    const r = run(start(), { type: 'next' }, { type: 'next' }, { type: 'tick', dtMs: D * 3 });
    expect(r.state).toMatchObject({ index: 2, elapsedMs: D, status: 'running' });
    expect(r.done).toEqual([]);
    expect(isAutoAdvancing(r.state)).toBe(false);
  });

  it('[FR-03] Next goes forward and resets the timer; on the last card it finishes', () => {
    const r = run(start(), { type: 'tick', dtMs: 3000 }, { type: 'next' });
    expect(r.state).toMatchObject({ index: 1, elapsedMs: 0 });
    const f = run(r.state, { type: 'next' }, { type: 'next' });
    expect(f.done).toEqual(['finished']);
    expect(f.state.status).toBe('done');
  });

  it('[FR-04] Back goes to the previous card from zero; on card 0 it restarts card 0 and never exits', () => {
    const r = run(start(), { type: 'next' }, { type: 'tick', dtMs: 2000 }, { type: 'back' });
    expect(r.state).toMatchObject({ index: 0, elapsedMs: 0 });
    const z = run(start(), { type: 'tick', dtMs: 2500 }, { type: 'back' });
    expect(z.state).toMatchObject({ index: 0, elapsedMs: 0, status: 'running' });
    expect(z.done).toEqual([]);
  });

  it('[FR-08] Skip is valid at once on card 0, with no delay, and ends the story as skipped', () => {
    const r = run(start(), { type: 'skip' });
    expect(r.done).toEqual(['skipped']);
    expect(r.state.status).toBe('done');
  });

  it('after done, every event is a no-op and nothing is emitted twice', () => {
    const r = run(start(), { type: 'skip' }, { type: 'next' }, { type: 'back' }, { type: 'skip' }, { type: 'tick', dtMs: D });
    expect(r.done).toEqual(['skipped']);
    expect(r.state.index).toBe(0);
  });

  describe('pause reasons', () => {
    const reasons = ['hold', 'background', 'voiceOver', 'reduceMotion', 'blur'] as const;
    for (const reason of reasons) {
      it(`[FR-05/10/13/14] ${reason}: elapsed never advances while it is set, and resumes at the same point`, () => {
        const a = run(start(), { type: 'tick', dtMs: 2000 }, { type: 'pause', reason }, { type: 'tick', dtMs: D * 4 });
        expect(a.state).toMatchObject({ index: 0, elapsedMs: 2000 });
        expect(isAutoAdvancing(a.state)).toBe(false);
        const b = run(a.state, { type: 'resume', reason }, { type: 'tick', dtMs: 500 });
        expect(b.state).toMatchObject({ index: 0, elapsedMs: 2500 });
      });

      it(`${reason}: setting it twice is the same as once`, () => {
        const r = run(start(), { type: 'pause', reason }, { type: 'pause', reason }, { type: 'resume', reason });
        expect(isAutoAdvancing(r.state)).toBe(true);
      });
    }

    it('it takes every reason to be cleared before time runs again', () => {
      const a = run(start(), { type: 'pause', reason: 'hold' }, { type: 'pause', reason: 'background' }, { type: 'resume', reason: 'hold' }, { type: 'tick', dtMs: 1000 });
      expect(a.state.elapsedMs).toBe(0);
      const b = run(a.state, { type: 'resume', reason: 'background' }, { type: 'tick', dtMs: 1000 });
      expect(b.state.elapsedMs).toBe(1000);
    });

    it('resuming a reason that was never set changes nothing', () => {
      const r = run(start(), { type: 'resume', reason: 'hold' });
      expect(r.state).toEqual(start());
    });

    it('[FR-10] background then a long wall-clock gap on return: the card does not move, no card is skipped', () => {
      const r = run(
        start(),
        { type: 'next' },
        { type: 'tick', dtMs: 4000 },
        { type: 'pause', reason: 'background' },
        { type: 'tick', dtMs: 60_000 },
        { type: 'resume', reason: 'background' },
      );
      expect(r.state).toMatchObject({ index: 1, elapsedMs: 4000 });
      // The first tick after return is a normal frame, not the time away.
      const n = run(r.state, { type: 'tick', dtMs: 16 });
      expect(n.state).toMatchObject({ index: 1, elapsedMs: 4016 });
    });

    it('[FR-13/14] Reduce Motion or VoiceOver on from the start: no auto-advance, taps still work', () => {
      for (const reason of ['reduceMotion', 'voiceOver'] as const) {
        const r = run(initialStoryClock(3, [reason]), { type: 'tick', dtMs: D * 3 });
        expect(r.state).toMatchObject({ index: 0, elapsedMs: 0 });
        const n = run(r.state, { type: 'next' });
        expect(n.state.index).toBe(1);
      }
    });
  });

  it('Next, Back and Skip are valid under every pause reason', () => {
    const all = ['hold', 'background', 'voiceOver', 'reduceMotion', 'blur'] as const;
    const paused = initialStoryClock(3, all);
    expect(run(paused, { type: 'next' }).state.index).toBe(1);
    expect(run(paused, { type: 'next' }, { type: 'back' }).state.index).toBe(0);
    expect(run(paused, { type: 'skip' }).done).toEqual(['skipped']);
  });

  it('a negative or non-finite tick is ignored', () => {
    expect(run(start(), { type: 'tick', dtMs: -50 }).state.elapsedMs).toBe(0);
    expect(run(start(), { type: 'tick', dtMs: Number.NaN }).state.elapsedMs).toBe(0);
  });

  it('a one-card or empty deck never throws: empty finishes at once on next, one card behaves as last', () => {
    const one = initialStoryClock(1);
    expect(run(one, { type: 'tick', dtMs: D * 2 }).state).toMatchObject({ index: 0, elapsedMs: D });
    expect(run(one, { type: 'next' }).done).toEqual(['finished']);
    expect(run(initialStoryClock(0), { type: 'next' }).done).toEqual(['finished']);
  });

  it('the state is never mutated', () => {
    const s = start();
    const frozen = JSON.stringify(s);
    storyClock(s, { type: 'tick', dtMs: 100 });
    storyClock(s, { type: 'pause', reason: 'hold' });
    expect(JSON.stringify(s)).toBe(frozen);
  });
});
