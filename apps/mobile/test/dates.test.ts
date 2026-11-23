import { describe, expect, it } from 'vitest';
import { plural } from '../src/lib/copy';
import { dateLocale, dayDate, entryLetterDateline, letterDateline, longDate } from '../src/lib/dates';

describe('dates and plurals (TDD 09 L1, L4)', () => {
  it('[B-NFR-007] a US phone gets US date order', () => {
    expect(dayDate('2026-09-29', 'en-US')).toBe('Tuesday, September 29, 2026');
    expect(longDate('2026-09-29', 'en-US')).toBe('September 29, 2026');
  });

  it('a UK phone keeps day-month order', () => {
    expect(dayDate('2026-09-29', 'en-GB')).toBe('Tuesday, 29 September 2026'); // matches the earlier house style
    expect(longDate('2026-09-29', 'en-GB')).toBe('29 September 2026');
  });

  it('a non-English phone falls back to the English house style, never mixed languages', () => {
    expect(dateLocale('fr-FR')).toBe('en-GB');
    expect(dateLocale('hi-IN')).toBe('en-GB');
    expect(dateLocale('en-IN')).toBe('en-IN');
  });

  it('never shifts the calendar day across time zones', () => {
    expect(longDate('2026-01-01', 'en-US')).toBe('January 1, 2026');
    expect(longDate('2026-12-31T23:30:00', 'en-US')).toBe('December 31, 2026');
  });

  it('the letter dateline keeps the age sentence from core', () => {
    const child = { name: 'Asha', birthday: '2026-03-01', dueDate: null };
    expect(letterDateline(child, '2026-09-29', 'en-US')).toMatch(/^Tuesday, September 29, 2026\. Asha is .+ old\.$/);
  });

  // QE-01: the Book files every letter without a birthday in Before You (`isBeforeBirth`), so the dateline says the
  // same. A due date is never an age anchor, even 12 days past it.
  it('with no birthday, the dateline reads before birth, never an age from the due date', () => {
    const expecting = { name: 'Asha', birthday: null, dueDate: '2026-11-11' };
    expect(letterDateline(expecting, '2026-11-23', 'en-US')).toBe('Monday, November 23, 2026. Before Asha was born.');
    expect(letterDateline(expecting, '2026-11-01', 'en-US')).toBe('Sunday, November 1, 2026. Before Asha was born.');
    const neither = { name: 'Asha', birthday: null, dueDate: null }; // a child with neither date
    expect(letterDateline(neither, '2026-09-29', 'en-US')).toBe('Tuesday, September 29, 2026. Before Asha was born.');
    expect(entryLetterDateline(expecting, { occurredOn: '2026-11-23', occurredPrecision: 'day' }, 'en-US')).not.toMatch(/old/);
  });

  it('a day before the birthday reads before birth; the birthday itself starts the age', () => {
    const born = { name: 'Asha', birthday: '2026-11-20', dueDate: '2026-11-11' };
    expect(letterDateline(born, '2026-11-19', 'en-US')).toBe('Thursday, November 19, 2026. Before Asha was born.');
    expect(letterDateline(born, '2026-11-23', 'en-US')).toMatch(/^Monday, November 23, 2026\. Asha is 3 days old\.$/);
  });

  it('"1 small fix", not "1 small fixes"', () => {
    expect(plural(1, 'one', 'other')).toBe('one');
    expect(plural(2, 'one', 'other')).toBe('other');
    expect(plural(0, 'one', 'other')).toBe('other');
  });
});
