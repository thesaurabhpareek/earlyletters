import { describe, expect, it } from 'vitest';
import { BLOCK_MS, answerGate, decideGate } from '../src/lib/age-gate.logic';

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
});
