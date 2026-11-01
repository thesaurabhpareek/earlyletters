import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDaysISO, bornPickerStart, checkBirthday, checkDueDate, EARLIEST_BIRTHDAY } from '@scribe/core';
import { clampISO, compactBounds, dateOf, dateRange, sheetBodyMaxHeight, sheetStart } from '../src/components/child/date-field.logic';
import { isoOf } from '../src/lib/dates';

const today = '2026-11-01';
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

// UTC-11 to UTC+14, with daylight saving at midnight (Santiago) and by half an hour (Lord Howe).
const ZONES = ['UTC', 'America/Los_Angeles', 'Europe/London', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/Santiago', 'Australia/Lord_Howe'];

function inZones(run: (tz: string) => void) {
  const before = process.env.TZ;
  try {
    for (const tz of ZONES) {
      process.env.TZ = tz;
      run(tz);
    }
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
}

describe('birthday and due-date picker range (first run, Add a child, child settings)', () => {
  // A normal day, a US clock-change day, a leap day, the last day of a year.
  for (const day of [today, '2026-03-08', '2028-02-29', '2026-12-31']) {
    it(`offers exactly the days the save check accepts, at both ends (today ${day})`, () => {
      const born = dateRange('born', day);
      expect(born).toEqual({ min: EARLIEST_BIRTHDAY, max: day });
      expect(checkBirthday(born.min, day).ok).toBe(true);
      expect(checkBirthday(born.max, day).ok).toBe(true);
      expect(checkBirthday(addDaysISO(born.min, -1), day).ok).toBe(false);
      expect(checkBirthday(addDaysISO(born.max, 1), day).ok).toBe(false);

      const due = dateRange('due', day);
      expect(due.min).toBe(day);
      expect(checkDueDate(due.min, day).ok).toBe(true);
      expect(checkDueDate(due.max, day).ok).toBe(true);
      expect(checkDueDate(addDaysISO(due.min, -1), day).ok).toBe(false);
      expect(checkDueDate(addDaysISO(due.max, 1), day).ok).toBe(false);
    });
  }

  it('clamps a day into the range', () => {
    const { min, max } = dateRange('born', today);
    expect(clampISO('2026-12-25', min, max)).toBe(today);
    expect(clampISO('1899-12-31', min, max)).toBe(EARLIEST_BIRTHDAY);
    expect(clampISO('2026-03-01', min, max)).toBe('2026-03-01');
    expect(clampISO('2026-03-01')).toBe('2026-03-01');
    const due = dateRange('due', '2028-02-29');
    expect(clampISO('2028-02-28', due.min, due.max)).toBe('2028-02-29');
    expect(clampISO('2099-01-01', due.min, due.max)).toBe(due.max);
  });

  it('keeps the same calendar day through the picker in every zone, on clock-change, leap and year-end days', () => {
    const days = ['2026-03-08', '2026-11-01', '2026-03-29', '2026-10-25', '2026-04-05', '2026-09-06', '2026-10-04', '2028-02-29', '2024-02-29', '2026-12-31', '2027-01-01', '2026-01-01'];
    inZones((tz) => {
      for (const iso of days) {
        expect(isoOf(dateOf(iso)), `${tz} ${iso}`).toBe(iso);
        expect(dateOf(iso).getHours(), `${tz} ${iso}: noon, so an hour either way stays on the same day`).toBe(12);
      }
    });
  });
});

describe('the day the sheet opens on, and the day the compact picker shows', () => {
  it('opens on a day the calendar can show, so Done saves the day on screen', () => {
    const born = dateRange('born', today);
    // BornEditor starts on the due date; a due date still ahead opens the birthday calendar on today.
    expect(sheetStart(null, bornPickerStart('2026-12-25', today), born.min, born.max)).toBe(today);
    expect(sheetStart(null, today, born.min, born.max)).toBe(today); // Done with today untouched saves today
    expect(sheetStart('2026-03-01', today, born.min, born.max)).toBe('2026-03-01'); // a stored day wins over the start
    const due = dateRange('due', today);
    expect(sheetStart('2026-10-01', today, due.min, due.max)).toBe(today); // a due date that has gone by opens on today
  });

  it('shows a stored due date that has gone by as it is, not today', () => {
    const due = dateRange('due', today);
    expect(compactBounds('2026-10-01', due.min, due.max)).toEqual({ min: '2026-10-01', max: due.max });
    expect(compactBounds('2026-12-01', due.min, due.max)).toEqual(due);
    expect(compactBounds('2027-12-01', due.min, due.max)).toEqual({ min: due.min, max: '2027-12-01' });
    expect(compactBounds('2026-12-01')).toEqual({ min: undefined, max: undefined });
  });

  it('caps the sheet body so Done and Cancel stay reachable at the largest text size on an iPhone SE', () => {
    // iPhone SE 3: 667 pt tall, 20 pt status bar. AX5 is about 3.1 times the default size.
    const normal = sheetBodyMaxHeight(667, 20, 0, 1);
    const ax5 = sheetBodyMaxHeight(667, 20, 0, 3.1);
    expect(normal).toBeGreaterThanOrEqual(500); // calendar and two buttons fit without scrolling at the default size
    expect(ax5).toBeLessThan(normal);
    expect(ax5 + 24 + 48 + 2 * 28 * 3.1 + 20).toBeLessThanOrEqual(667);
    expect(sheetBodyMaxHeight(300, 50, 50, 5)).toBe(200);
  });
});

describe('the iOS date control', () => {
  const field = src('src/components/child/date-field.tsx');

  it('opens the calendar in one tap from "Choose a date", fresh on each open, and Done saves the day shown', () => {
    expect(field).toMatch(/display="inline"/);
    expect(field).toMatch(/dismissible=\{false\}/); // no pan gesture over the month swipe
    expect(field).toMatch(/const openSheet = \(\) => \{\s*Keyboard\.dismiss\(\);\s*setPending\(sheetStart\(value, startISO, min, max\)\);\s*setOpen\(true\);/);
    expect(field).toMatch(/value=\{dateOf\(pending\)\}/);
    expect(field).toMatch(/onChange\(pending\);\s*closeSheet\(\);/);
    // A calendar tap in the sheet stays local until Done: the screen behind does not re-render on each tap.
    expect(field).toMatch(/setPending\(isoOf\(d\)\)/);
  });

  it('never traps anyone: escape is Cancel, the body scrolls, and focus returns to the control', () => {
    expect(field).toMatch(/<View onAccessibilityEscape=\{closeSheet\}>\s*<ScrollView style=\{\{ maxHeight: sheetBodyMaxHeight\(/);
    expect(field).toMatch(/onClose=\{\(\) => \{\s*setOpen\(false\);\s*focusControl\(\);/);
    expect(field).toMatch(/label=\{copy\.common\.cancelButton\} onPress=\{closeSheet\}/);
  });

  it('shows the stored day in the compact picker, clamping only the sheet start', () => {
    expect(field).toMatch(/value=\{dateOf\(value\)\}\s*mode="date"\s*display="compact"/);
    expect(field).toMatch(/compactBounds\(value, min, max\)/);
  });

  it('follows the app appearance and puts the keyboard away first', () => {
    expect(field.match(/themeVariant=\{scheme\}/g)?.length).toBe(2);
    expect(field).toMatch(/onTouchStart=\{\(\) => Keyboard\.dismiss\(\)\}/);
  });

  it('gets its range from the shared rules at every caller, with the right kind', () => {
    const count = (s: string) => s.match(/\{\.\.\.dateRange\(/g)?.length ?? 0;
    for (const p of ['src/app/onboarding.tsx', 'src/components/child/add-child-form.tsx']) {
      const s = src(p);
      expect(count(s), p).toBe(1);
      expect(s, p).toContain("{...dateRange(expecting ? 'due' : 'born', today)}");
    }
    const editors = src('src/components/child/child-editors.tsx');
    expect(count(editors)).toBe(2);
    // DateEditor: the child's own kind. BornEditor: always a birthday, from EARLIEST_BIRTHDAY to today.
    expect(editors).toMatch(/startISO=\{today\} \{\.\.\.dateRange\(born \? 'born' : 'due', today\)\} \/>/);
    expect(editors).toMatch(/startISO=\{bornPickerStart\(child\.dueDate, today\)\} \{\.\.\.dateRange\('born', today\)\} \/>/);
  });
});
