import { describe, expect, it } from 'vitest';
import {
  CHILD_NAME_MAX,
  DUE_DATE_MAX_DAYS,
  SIGNS_AS_MAX,
  addDaysISO,
  ageOn,
  bornPatch,
  bornPickerStart,
  chapterOf,
  checkBirthday,
  checkChildName,
  checkDueDate,
  checkSignsAs,
  clampText,
  daysBetweenISO,
  dueDatePassed,
  latestDueDate,
  monthOfAgeOn,
  nearLimit,
  textLength,
} from '../src';

const TODAY = '2026-10-04';

describe('child name and signature checks (same rules as first run)', () => {
  it('trims and accepts 1 to 60 characters', () => {
    expect(checkChildName('  Asha  ')).toEqual({ ok: true, value: 'Asha' });
    expect(checkChildName('A')).toEqual({ ok: true, value: 'A' });
    expect(checkChildName('a'.repeat(CHILD_NAME_MAX))).toMatchObject({ ok: true });
  });
  it('rejects empty and whitespace-only', () => {
    expect(checkChildName('')).toEqual({ ok: false, reason: 'empty' });
    expect(checkChildName('   \n ')).toEqual({ ok: false, reason: 'empty' });
  });
  it('reports a 61st character instead of cutting it', () => {
    expect(checkChildName('a'.repeat(CHILD_NAME_MAX + 1))).toEqual({ ok: false, reason: 'tooLong' });
    expect(checkChildName('a'.repeat(90))).toEqual({ ok: false, reason: 'tooLong' });
  });
  it('counts what a person counts: an emoji or a ZWJ pair is not split', () => {
    expect(textLength('Asha 🌙')).toBe(6);
    expect(clampText('a'.repeat(59) + '🌙🌙', 60)).toBe('a'.repeat(59) + '🌙');
    const cut = clampText('x'.repeat(58) + '👩‍👧', 60);
    expect(Array.from(cut).length).toBe(60);
    // no lone surrogate survives
    expect(() => encodeURIComponent(clampText('y'.repeat(59) + '😀😀', 60))).not.toThrow();
  });
  it('stores one form for a name typed two ways (NFC)', () => {
    const decomposed = 'Amélie';
    expect(checkChildName(decomposed)).toEqual({ ok: true, value: 'Amélie' });
  });
  it('keeps Devanagari conjuncts whole', () => {
    expect(checkChildName('क्षत्रिय')).toMatchObject({ ok: true });
  });
  it('signature is 1 to 30', () => {
    expect(checkSignsAs(' Papa ')).toEqual({ ok: true, value: 'Papa' });
    expect(checkSignsAs(' ')).toEqual({ ok: false, reason: 'empty' });
    expect(checkSignsAs('m'.repeat(SIGNS_AS_MAX + 1))).toEqual({ ok: false, reason: 'tooLong' });
  });
  it('says the limit softly only when close', () => {
    expect(nearLimit(10, CHILD_NAME_MAX)).toBe(false);
    expect(nearLimit(50, CHILD_NAME_MAX)).toBe(true);
    expect(nearLimit(25, SIGNS_AS_MAX)).toBe(true);
    expect(nearLimit(5, SIGNS_AS_MAX)).toBe(false);
  });
});

describe('date arithmetic stays in one place', () => {
  it('adds and subtracts calendar days across month and year ends', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2028-03-01', -1)).toBe('2028-02-29');
    expect(daysBetweenISO('2026-10-04', '2026-10-06')).toBe(2);
    expect(daysBetweenISO('2026-10-06', '2026-10-04')).toBe(-2);
  });
  it('rejects impossible dates', () => {
    expect(checkBirthday('2026-02-31', TODAY)).toEqual({ ok: false, reason: 'invalid' });
    expect(checkBirthday('not a date', TODAY)).toEqual({ ok: false, reason: 'invalid' });
    expect(checkBirthday('1899-12-31', TODAY)).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('birthday check', () => {
  it('needs a choice: no date is never silently today', () => {
    expect(checkBirthday(null, TODAY)).toEqual({ ok: false, reason: 'missing' });
  });
  it('today and earlier are fine; tomorrow is not', () => {
    expect(checkBirthday(TODAY, TODAY)).toMatchObject({ ok: true });
    expect(checkBirthday('2026-03-01', TODAY)).toMatchObject({ ok: true });
    expect(checkBirthday('2026-10-05', TODAY)).toEqual({ ok: false, reason: 'future' });
  });
});

describe('due date check (first run range)', () => {
  it('today up to 305 days ahead', () => {
    expect(checkDueDate(TODAY, TODAY)).toMatchObject({ ok: true });
    expect(checkDueDate(latestDueDate(TODAY), TODAY)).toMatchObject({ ok: true });
    expect(daysBetweenISO(TODAY, latestDueDate(TODAY))).toBe(DUE_DATE_MAX_DAYS);
  });
  it('yesterday and 306 days ahead are out', () => {
    expect(checkDueDate('2026-10-03', TODAY)).toEqual({ ok: false, reason: 'past' });
    expect(checkDueDate(addDaysISO(TODAY, DUE_DATE_MAX_DAYS + 1), TODAY)).toEqual({ ok: false, reason: 'tooFar' });
    expect(checkDueDate(null, TODAY)).toEqual({ ok: false, reason: 'missing' });
  });
});

describe('a due date can become a birthday', () => {
  it('is offered only after the due date has gone by', () => {
    expect(dueDatePassed('2026-10-05', TODAY)).toBe(false);
    expect(dueDatePassed(TODAY, TODAY)).toBe(false);
    expect(dueDatePassed('2026-10-03', TODAY)).toBe(true);
    expect(dueDatePassed(null, TODAY)).toBe(false);
  });
  it('the picker starts at the due date, never after today', () => {
    expect(bornPickerStart('2026-09-28', TODAY)).toBe('2026-09-28');
    expect(bornPickerStart('2026-11-01', TODAY)).toBe(TODAY);
    expect(bornPickerStart(null, TODAY)).toBe(TODAY);
  });
  it('sets the birthday and clears the due date together', () => {
    const r = bornPatch({ birthday: null, dueDate: '2026-09-28' }, '2026-09-30', TODAY);
    expect(r).toEqual({ ok: true, patch: { birthday: '2026-09-30', dueDate: null } });
  });
  it('refuses a future birthday, a missing one, or a child already born', () => {
    expect(bornPatch({ birthday: null, dueDate: '2026-09-28' }, '2026-10-09', TODAY)).toEqual({ ok: false, reason: 'future' });
    expect(bornPatch({ birthday: null, dueDate: '2026-09-28' }, '', TODAY)).toMatchObject({ ok: false });
    expect(bornPatch({ birthday: '2026-01-01', dueDate: null }, '2026-01-02', TODAY)).toEqual({ ok: false, reason: 'alreadyBorn' });
  });
  it('re-chapters letters from the new birthday (no letter is written)', () => {
    // Letter written 3 Oct 2026 while expecting: before birth, so Before You.
    expect(monthOfAgeOn(null, '2026-10-03')).toBeNull();
    // Born 30 Sep: that letter is 3 days old, month 0; the Before You letter stays before.
    expect(monthOfAgeOn('2026-09-30', '2026-10-03')).toBe(0);
    expect(monthOfAgeOn('2026-09-30', '2026-09-20')).toBeNull();
    expect(chapterOf('2026-09-30', '2026-12-31')).toBe(3);
  });
});

describe('editing the birthday of an older baby fixes "0 days"', () => {
  it('7 months old instead of 0 days', () => {
    expect(ageOn('2026-03-04', TODAY)).toMatchObject({ months: 7 });
    expect(ageOn(TODAY, TODAY).days).toBe(0);
  });
  it('a corrected birthday moves a letter to a different chapter', () => {
    expect(chapterOf('2026-10-04', '2026-10-04')).toBe(0);
    expect(chapterOf('2026-03-04', '2026-10-04')).toBe(7);
  });
  it('a birthday moved later than a letter puts that letter before birth', () => {
    expect(monthOfAgeOn('2026-10-04', '2026-09-01')).toBeNull();
  });
});
