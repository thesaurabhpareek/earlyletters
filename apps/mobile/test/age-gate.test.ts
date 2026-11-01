import { describe, expect, it } from 'vitest';
import { BLOCK_MS, answerGate, confirmGate, continueGate, decideGate } from '../src/lib/age-gate.logic';

const T0 = Date.parse('2026-10-03T09:00:00.000Z');
const HOUR = 3_600_000;

describe('18+ entry gate', () => {
  it('[PRD-REQ-019] a fresh install is asked, with nothing stored', () => {
    expect(decideGate({ passed: false, stoppedAt: null }, T0)).toEqual({ decision: 'ask', stoppedAt: null });
  });

  it('[PRD-REQ-019] Yes is a boolean only and passes forever', () => {
    const s = answerGate('yes', T0);
    expect(s).toEqual({ passed: true, stoppedAt: null });
    expect(Object.values(s).some((v) => typeof v === 'string')).toBe(false); // no age, date or time
    expect(decideGate(s, T0 + 5 * 365 * 24 * HOUR).decision).toBe('pass');
  });

  it('[LEGAL-REQ-002] No stores only the time of the No and stops for 24 hours', () => {
    const s = answerGate('no', T0);
    expect(s).toEqual({ passed: false, stoppedAt: new Date(T0).toISOString() });
    expect(decideGate(s, T0 + 1).decision).toBe('stop');
    expect(decideGate(s, T0 + BLOCK_MS - 1).decision).toBe('stop');
    expect(decideGate(s, T0 + BLOCK_MS).decision).toBe('ask');
  });

  it('[LEGAL-REQ-002] a clock set back never shortens the stop', () => {
    const s = answerGate('no', T0);
    const back = T0 - 10 * 24 * HOUR; // clock moved 10 days back after answering No
    const r = decideGate(s, back);
    expect(r).toEqual({ decision: 'stop', stoppedAt: new Date(back).toISOString() });
    // Stored repair applies: still stopped 23 h after the moved clock, open after 24 h.
    expect(decideGate({ passed: false, stoppedAt: r.stoppedAt }, back + 23 * HOUR).decision).toBe('stop');
    expect(decideGate({ passed: false, stoppedAt: r.stoppedAt }, back + BLOCK_MS).decision).toBe('ask');
  });

  it('a damaged stored value counts as a fresh stop', () => {
    expect(decideGate({ passed: false, stoppedAt: 'not a date' }, T0)).toEqual({ decision: 'stop', stoppedAt: new Date(T0).toISOString() });
  });

  describe('[F01-REQ-002] [SR-C-04] a No is confirmed before anything is stored (F01-U01)', () => {
    it('Continue with nothing chosen does nothing', () => {
      expect(continueGate(null)).toEqual({ view: 'ask', adult: null, write: null });
    });

    it('Yes, Continue stores Yes at once (no confirm step for Yes)', () => {
      expect(continueGate(true)).toEqual({ view: 'pass', adult: true, write: 'yes' });
    });

    it('No, Continue opens the confirm step and stores nothing', () => {
      const step = continueGate(false);
      expect(step.view).toBe('confirm');
      expect(step.write).toBeNull();
    });

    it('"Yes, I am under 18" stores the No, and the stop is the same 24 hours as before', () => {
      const step = confirmGate('under18');
      expect(step).toEqual({ view: 'stop', adult: null, write: 'no' });
      const s = answerGate(step.write!, T0);
      expect(s).toEqual({ passed: false, stoppedAt: new Date(T0).toISOString() });
      expect(decideGate(s, T0 + BLOCK_MS - 1).decision).toBe('stop');
      expect(decideGate(s, T0 + BLOCK_MS).decision).toBe('ask');
    });

    it('Go back stores nothing and returns to the question with nothing selected', () => {
      expect(confirmGate('back')).toEqual({ view: 'ask', adult: null, write: null });
      // With nothing stored, a relaunch asks again rather than stopping.
      expect(decideGate({ passed: false, stoppedAt: null }, T0).decision).toBe('ask');
    });
  });
});
