import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDaysISO, checkBirthday, checkDueDate, EARLIEST_BIRTHDAY } from '@scribe/core';
import { clampISO, dateOf, dateRange } from '../src/components/child/date-field.logic';
import { isoOf } from '../src/lib/dates';

const today = '2026-11-01';
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('birthday and due-date picker range (first run, Add a child, child settings)', () => {
  it('offers exactly the days the save check accepts, at both ends', () => {
    const born = dateRange('born', today);
    expect(born).toEqual({ min: EARLIEST_BIRTHDAY, max: today });
    expect(checkBirthday(born.min, today).ok).toBe(true);
    expect(checkBirthday(born.max, today).ok).toBe(true);
    expect(checkBirthday(addDaysISO(born.min, -1), today).ok).toBe(false);
    expect(checkBirthday(addDaysISO(born.max, 1), today).ok).toBe(false);

    const due = dateRange('due', today);
    expect(checkDueDate(due.min, today).ok).toBe(true);
    expect(checkDueDate(due.max, today).ok).toBe(true);
    expect(checkDueDate(addDaysISO(due.min, -1), today).ok).toBe(false);
    expect(checkDueDate(addDaysISO(due.max, 1), today).ok).toBe(false);
  });

  it('starts the calendar on a day inside the range, so Done saves the day on screen', () => {
    const { min, max } = dateRange('born', today);
    expect(clampISO('2026-12-25', min, max)).toBe(today); // a due date still ahead: the birthday calendar opens on today
    expect(clampISO('1899-12-31', min, max)).toBe(EARLIEST_BIRTHDAY);
    expect(clampISO('2026-03-01', min, max)).toBe('2026-03-01');
    expect(clampISO('2026-03-01')).toBe('2026-03-01');
  });

  it('keeps the same calendar day through the picker, including daylight-saving days', () => {
    for (const iso of ['2026-03-08', '2026-03-29', '2026-11-01', '2026-10-25', '2024-02-29', '2026-12-31', '2026-01-01']) {
      expect(isoOf(dateOf(iso))).toBe(iso);
      expect(dateOf(iso).getHours()).toBe(12); // noon: an hour either way stays on the same day
    }
  });
});

describe('the iOS date control', () => {
  const field = src('src/components/child/date-field.tsx');

  it('opens the calendar in one tap from "Choose a date", and Done saves the day shown', () => {
    expect(field).toMatch(/display="inline"/);
    expect(field).toMatch(/<Sheet open=\{open\}.*dismissible=\{false\}/); // no pan gesture over the month swipe
    expect(field).toMatch(/onChange\(pending\)/);
    // A calendar tap in the sheet stays local until Done: the screen behind does not re-render on each tap.
    expect(field).toMatch(/setPending\(isoOf\(d\)\)/);
  });

  it('follows the app appearance and puts the keyboard away first', () => {
    expect(field.match(/themeVariant=\{scheme\}/g)?.length).toBe(2);
    expect(field).toMatch(/Keyboard\.dismiss\(\)/);
  });

  it('gets its range from the shared rules at every caller', () => {
    for (const p of ['src/app/onboarding.tsx', 'src/components/child/add-child-form.tsx', 'src/components/child/child-editors.tsx']) {
      const s = src(p);
      expect(s).toMatch(/dateRange\(/);
      expect(s).not.toMatch(/min=\{(expecting|born) \? (today|undefined)/);
    }
  });
});
