import { describe, expect, it } from 'vitest';
import { plural } from '../src/lib/copy';
import { dateLocale, dayDate, letterDateline, longDate } from '../src/lib/dates';

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
    expect(letterDateline({ name: 'Asha', birthday: null, dueDate: null }, '2026-09-29', 'en-US')).toBe('Tuesday, September 29, 2026.');
  });

  it('"1 small fix", not "1 small fixes"', () => {
    expect(plural(1, 'one', 'other')).toBe('one');
    expect(plural(2, 'one', 'other')).toBe('other');
    expect(plural(0, 'one', 'other')).toBe('other');
  });
});
