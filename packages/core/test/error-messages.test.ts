/**
 * Error text reaches crash tools and logs, so it must never carry a date or a name.
 * Tests use the fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { addDaysISO, ageOn, daysBetweenISO, InvalidIsoDateError } from '../src';

function caught(fn: () => unknown): Error {
  try {
    fn();
  } catch (e) {
    return e as Error;
  }
  throw new Error('expected a throw');
}

// An impossible date with a name glued on, the shape a bad form value could take.
const BAD_WITH_NAME = 'Asha 2025-04-12';
const BAD_DATE = '2025-13-45';

describe('thrown errors hold a fixed code, never the value', () => {
  const cases: Array<[string, () => unknown]> = [
    ['ageOn parse', () => ageOn(BAD_WITH_NAME, '2026-04-12')],
    ['ageOn on-date', () => ageOn('2025-04-12', 'Asha 2026-04-12')],
    ['addDaysISO shape', () => addDaysISO(BAD_WITH_NAME, 1)],
    ['addDaysISO roll-over', () => addDaysISO('2025-02-31', 1)],
    ['daysBetweenISO', () => daysBetweenISO('2025-04-12', BAD_DATE)],
  ];
  for (const [label, fn] of cases) {
    it(`${label}: no date, no name in message or stack`, () => {
      const e = caught(fn);
      expect(e).toBeInstanceOf(InvalidIsoDateError);
      expect(e.message).toBe('invalid_iso_date');
      expect((e as InvalidIsoDateError).code).toBe('invalid_iso_date');
      const text = `${e.name} ${e.message} ${e.stack ?? ''}`;
      expect(text).not.toMatch(/Asha/);
      expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(text).not.toMatch(/2025/);
    });
  }
});
