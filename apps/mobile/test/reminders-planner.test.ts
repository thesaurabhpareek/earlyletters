import { ageOn } from '@scribe/core';
import { en } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { reminderCopy } from '../src/lib/reminders/copy';
import {
  activeWeekdays,
  clampReminderTime,
  DEFAULT_PREFS,
  DEFAULT_WINDOW,
  normalizeWindow,
  isQuietTime,
  joinNames,
  planReminders,
  planSignature,
  slotOrdinal,
  type PlanInput,
  type PlannedNotification,
  type PlannerChild,
  type ReminderPrefs,
} from '../src/lib/reminders/planner';
import { addDays, monthDay, offsetMinutes, parseIsoDate, zonedParts, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const NY = 'America/New_York';
const HOUR = 3_600_000;

const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const dev: PlannerChild = { id: 'child-dev', name: 'Dev', birthday: '2024-05-31', included: true };

function at(iso: string, hh: number, mm: number, tz = LA): number {
  const d = parseIsoDate(iso)!;
  return zonedToEpoch({ ...d, hh, mm }, tz);
}

function plan(p: Omit<Partial<PlanInput>, 'prefs'> & { prefs?: Partial<ReminderPrefs> } = {}): PlannedNotification[] {
  return planReminders({
    now: p.now ?? at('2026-10-05', 12, 0),
    timeZone: p.timeZone ?? LA,
    children: p.children ?? [asha],
    lastSaveAt: p.lastSaveAt ?? null,
    lastForegroundAt: p.lastForegroundAt ?? null,
    horizonDays: p.horizonDays,
    monthHorizonDays: p.monthHorizonDays,
    maxNotifications: p.maxNotifications,
    window: p.window,
    prefs: { ...DEFAULT_PREFS, enabled: true, ...p.prefs },
  });
}

const local = (n: PlannedNotification, tz = LA) => {
  const p = zonedParts(n.fireAt, tz);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')} ${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
};

describe('wall-clock time in a zone', () => {
  it('converts a local time to the right instant on both sides of daylight saving', () => {
    // Los Angeles: PST is UTC-8, PDT is UTC-7; 2026 changes are 8 March and 1 November.
    expect(new Date(at('2026-03-07', 20, 30)).toISOString()).toBe('2026-03-08T04:30:00.000Z');
    expect(new Date(at('2026-03-08', 20, 30)).toISOString()).toBe('2026-03-09T03:30:00.000Z');
    expect(new Date(at('2026-10-31', 20, 30)).toISOString()).toBe('2026-11-01T03:30:00.000Z');
    expect(new Date(at('2026-11-01', 20, 30)).toISOString()).toBe('2026-11-02T04:30:00.000Z');
    // London: GMT to BST on 29 March, back on 25 October.
    expect(new Date(at('2026-03-29', 20, 30, 'Europe/London')).toISOString()).toBe('2026-03-29T19:30:00.000Z');
    expect(new Date(at('2026-10-25', 20, 30, 'Europe/London')).toISOString()).toBe('2026-10-25T20:30:00.000Z');
  });

  it('handles half-hour and quarter-hour zones with no daylight saving', () => {
    expect(new Date(at('2026-10-05', 20, 30, 'Asia/Kolkata')).toISOString()).toBe('2026-10-05T15:00:00.000Z');
    expect(offsetMinutes(at('2026-10-05', 20, 30, 'Asia/Kathmandu'), 'Asia/Kathmandu')).toBe(345);
  });

  it('round-trips every 15 minutes of a daylight-saving day', () => {
    for (const tz of [LA, NY, 'Europe/London', 'Australia/Sydney', 'Pacific/Chatham']) {
      for (const iso of ['2026-03-08', '2026-03-29', '2026-04-05', '2026-10-04', '2026-10-25', '2026-11-01']) {
        for (let minutes = 7 * 60; minutes <= 21 * 60 + 30; minutes += 15) {
          const hh = Math.floor(minutes / 60);
          const mm = minutes % 60;
          const p = zonedParts(at(iso, hh, mm, tz), tz);
          expect([p.hh, p.mm], `${tz} ${iso} ${hh}:${mm}`).toEqual([hh, mm]);
        }
      }
    }
  });
});

describe('time choice (C-REQ-003)', () => {
  it('clamps late nights to 21:30 and says so', () => {
    expect(clampReminderTime({ hour: 22, minute: 30 })).toEqual({ time: { hour: 21, minute: 30 }, clamped: true });
    expect(clampReminderTime({ hour: 6, minute: 0 })).toEqual({ time: { hour: 7, minute: 0 }, clamped: true });
    expect(clampReminderTime({ hour: 20, minute: 30 })).toEqual({ time: { hour: 20, minute: 30 }, clamped: false });
  });

  it('snaps to 15-minute steps', () => {
    expect(clampReminderTime({ hour: 20, minute: 37 }).time).toEqual({ hour: 20, minute: 30 });
    expect(clampReminderTime({ hour: 20, minute: 38 }).time).toEqual({ hour: 20, minute: 45 });
    expect(clampReminderTime({ hour: 21, minute: 40 })).toEqual({ time: { hour: 21, minute: 30 }, clamped: true });
  });

  it('knows the quiet hours', () => {
    expect(isQuietTime(21, 30)).toBe(false);
    expect(isQuietTime(21, 31)).toBe(true);
    expect(isQuietTime(6, 59)).toBe(true);
    expect(isQuietTime(7, 0)).toBe(false);
  });
});

describe('the quiet window (C-REQ-003, C-NFR-009)', () => {
  const narrow = { earliest: 9 * 60, latest: 20 * 60 }; // 09:00 to 20:00, as remote config might set it

  it('defaults to 07:00 to 21:30 and refuses a window that makes no sense', () => {
    expect(DEFAULT_WINDOW).toEqual({ earliest: 420, latest: 1290 });
    expect(normalizeWindow(undefined)).toEqual(DEFAULT_WINDOW);
    expect(normalizeWindow({ earliest: 1200, latest: 600 })).toEqual(DEFAULT_WINDOW);
    expect(normalizeWindow({ earliest: 600, latest: 630 })).toEqual(DEFAULT_WINDOW);
    expect(normalizeWindow({ earliest: -5, latest: 600 })).toEqual(DEFAULT_WINDOW);
    expect(normalizeWindow({ earliest: 7.5, latest: 600 })).toEqual(DEFAULT_WINDOW);
    expect(normalizeWindow(narrow)).toEqual(narrow);
  });

  it('clamps the chosen time into a narrower window, on a 15-minute step', () => {
    expect(clampReminderTime({ hour: 20, minute: 30 }, narrow)).toEqual({ time: { hour: 20, minute: 0 }, clamped: true });
    expect(clampReminderTime({ hour: 8, minute: 0 }, narrow)).toEqual({ time: { hour: 9, minute: 0 }, clamped: true });
    expect(clampReminderTime({ hour: 21, minute: 0 }, { earliest: 7 * 60 + 10, latest: 20 * 60 + 50 })).toEqual({ time: { hour: 20, minute: 45 }, clamped: true });
    expect(isQuietTime(20, 15, narrow)).toBe(true);
    expect(isQuietTime(20, 0, narrow)).toBe(false);
  });

  it('every nudge, month note and birthday lands inside the window, across daylight saving', () => {
    const p = plan({ now: at('2027-03-01', 6, 0), window: narrow, prefs: { cadence: 'everyEvening', time: { hour: 20, minute: 30 } }, horizonDays: 21, monthHorizonDays: 60 });
    expect(p.length).toBeGreaterThan(10);
    for (const n of p) {
      const l = zonedParts(n.fireAt, LA);
      expect(isQuietTime(l.hh, l.mm, narrow), n.id).toBe(false);
    }
    expect(p.filter((n) => n.kind === 'evening').every((n) => n.hour === 20 && n.minute === 0)).toBe(true);
    expect(p.find((n) => n.kind === 'birthday')).toMatchObject({ date: '2027-03-08', hour: 9, minute: 0 });
  });

  it('a window that starts after 9 AM moves the birthday note to its start', () => {
    const late = { earliest: 10 * 60, latest: 21 * 60 };
    const p = plan({ now: at('2027-03-01', 6, 0), window: late, prefs: { cadence: 'off' }, monthHorizonDays: 10 });
    expect(p.map((n) => [n.kind, local(n)])).toEqual([['birthday', '2027-03-08 10:00']]);
  });
});

describe('default cadence (C-REQ-002)', () => {
  it('a quiet week holds 2 evening nudges plus the month note, at 8:30 PM', () => {
    // Week of Monday 5 Oct 2026. Asha (born 8 March) turns 7 months on Thursday 8 Oct.
    const week = plan().filter((n) => n.date >= '2026-10-05' && n.date <= '2026-10-11');
    expect(week.map((n) => [n.kind, n.date, local(n)])).toEqual([
      ['evening', '2026-10-06', '2026-10-06 20:30'],
      ['monthAge', '2026-10-08', '2026-10-08 20:30'],
      ['evening', '2026-10-10', '2026-10-10 20:30'],
    ]);
    expect(week[1].month).toBe(7);
  });

  it('weekly uses its one evening; every evening uses all seven', () => {
    const weekly = plan({ prefs: { cadence: 'weekly', weeklyDay: 0, monthNotes: false }, horizonDays: 21 });
    expect(weekly.every((n) => new Date(`${n.date}T12:00:00Z`).getUTCDay() === 0)).toBe(true);
    expect(weekly).toHaveLength(3);
    const daily = plan({ prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 7 });
    expect(daily.map((n) => n.date)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  });

  it('"off" keeps month notes but sends no evening nudges', () => {
    const p = plan({ prefs: { cadence: 'off' } });
    expect(p.length).toBeGreaterThan(0);
    expect(p.every((n) => n.kind !== 'evening')).toBe(true);
  });

  it('plans nothing when reminders are off or paused', () => {
    expect(plan({ prefs: { enabled: false } })).toEqual([]);
    expect(plan({ prefs: { paused: true } })).toEqual([]);
  });

  it('falls back to Tuesday and Saturday when no evening is picked', () => {
    expect(activeWeekdays({ cadence: 'fewTimes', days: [], weeklyDay: 0 })).toEqual([2, 6]);
    expect(activeWeekdays({ cadence: 'fewTimes', days: [6, 2, 2, 9], weeklyDay: 0 })).toEqual([2, 6]);
  });
});

describe('daylight saving and time zones', () => {
  it('keeps 8:30 PM local across the spring change (a 23-hour day between nudges)', () => {
    const p = plan({ now: at('2026-03-05', 12, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 6 });
    expect(p.map((n) => local(n))).toEqual([
      '2026-03-05 20:30',
      '2026-03-06 20:30',
      '2026-03-07 20:30',
      '2026-03-08 20:30',
      '2026-03-09 20:30',
      '2026-03-10 20:30',
    ]);
    const gaps = p.slice(1).map((n, i) => (n.fireAt - p[i].fireAt) / HOUR);
    expect(gaps).toEqual([24, 24, 23, 24, 24]);
    expect(p.every((n) => n.hour === 20 && n.minute === 30)).toBe(true);
  });

  it('keeps 8:30 PM local across the autumn change (a 25-hour day)', () => {
    const p = plan({ now: at('2026-10-30', 12, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 4 });
    expect(p.map((n) => local(n))).toEqual(['2026-10-30 20:30', '2026-10-31 20:30', '2026-11-01 20:30', '2026-11-02 20:30']);
    expect(p.slice(1).map((n, i) => (n.fireAt - p[i].fireAt) / HOUR)).toEqual([24, 25, 24]);
  });

  it('[C-REQ-003] after a flight from Los Angeles to New York the nudge is still at 8:30 PM local', () => {
    const now = at('2026-10-05', 12, 0, LA);
    const inLA = plan({ now, timeZone: LA, prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 5 });
    const inNY = plan({ now, timeZone: NY, prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 5 });
    expect(inNY.map((n) => local(n, NY).slice(11))).toEqual(inNY.map(() => '20:30'));
    expect(inLA[1].fireAt - inNY[1].fireAt).toBe(3 * HOUR);
    // An instant fixed in Los Angeles would land at 23:30 in New York, which is why iOS gets wall-clock
    // (calendar) triggers and every foreground re-plans in the current zone (C-REQ-004).
    const p = zonedParts(inLA[1].fireAt, NY);
    expect(isQuietTime(p.hh, p.mm)).toBe(true);
  });

  it('never plans anything inside quiet hours, in any zone, at any allowed time', () => {
    for (const tz of [LA, NY, 'Europe/London', 'Asia/Kolkata', 'Australia/Lord_Howe', 'Pacific/Chatham', 'Pacific/Kiritimati']) {
      for (const [hour, minute] of [
        [7, 0],
        [12, 15],
        [20, 30],
        [21, 30],
        [23, 45],
        [2, 30],
      ]) {
        const p = plan({ now: at('2026-03-01', 6, 0, tz), timeZone: tz, prefs: { cadence: 'everyEvening', time: { hour, minute } }, horizonDays: 60 });
        for (const n of p) {
          const l = zonedParts(n.fireAt, tz);
          expect(isQuietTime(l.hh, l.mm), `${tz} ${hour}:${minute} ${n.id}`).toBe(false);
        }
      }
    }
  });
});

describe('month notes and birthdays (C-REQ-011)', () => {
  it('a birth date on the 31st lands on the last day of shorter months, matching core age math', () => {
    const born = parseIsoDate('2026-01-31')!;
    const days = Array.from({ length: 13 }, (_, i) => monthDay(born, i + 1));
    expect(days.map((d) => `${d.m}-${d.d}`)).toEqual(['2-28', '3-31', '4-30', '5-31', '6-30', '7-31', '8-31', '9-30', '10-31', '11-30', '12-31', '1-31', '2-28']);
    days.forEach((d, i) => {
      const iso = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      const before = addDays(d, -1);
      const isoBefore = `${before.y}-${String(before.m).padStart(2, '0')}-${String(before.d).padStart(2, '0')}`;
      expect(ageOn('2026-01-31', iso).months, iso).toBe(i + 1);
      expect(ageOn('2026-01-31', isoBefore).months, isoBefore).toBe(i);
    });
    expect(monthDay(parseIsoDate('2027-01-31')!, 13)).toEqual({ y: 2028, m: 2, d: 29 }); // leap year
  });

  it('[C-REQ-011] the note fires on the 30th when the month has 30 days', () => {
    const p = plan({ now: at('2026-09-01', 12, 0), children: [{ ...asha, birthday: '2026-01-31' }], prefs: { cadence: 'off' }, monthHorizonDays: 92 });
    expect(p.map((n) => [n.kind, n.date, n.month])).toEqual([
      ['monthAge', '2026-09-30', 8],
      ['monthAge', '2026-10-31', 9],
      ['monthAge', '2026-11-30', 10],
    ]);
  });

  it('the birthday note comes at 9:00 AM and replaces that evening', () => {
    const now = at('2027-03-01', 12, 0);
    const p = plan({ now, prefs: { cadence: 'everyEvening' }, horizonDays: 14 });
    const day = p.filter((n) => n.date === '2027-03-08');
    expect(day.map((n) => [n.kind, local(n), n.month])).toEqual([['birthday', '2027-03-08 09:00', 1]]);
    expect(day[0].title).toBe(reminderCopy.neutral.birthday.title);
  });

  it('a month note replaces that evening, so there is one note a day', () => {
    const p = plan({ prefs: { cadence: 'everyEvening' }, horizonDays: 21 });
    const perDay = new Map<string, number>();
    for (const n of p) perDay.set(n.date, (perDay.get(n.date) ?? 0) + 1);
    expect([...perDay.values()].every((c) => c === 1)).toBe(true);
    expect(p.find((n) => n.date === '2026-10-08')?.kind).toBe('monthAge');
  });

  it('a February 29 baby gets the birthday on February 28 in other years', () => {
    const p = plan({ now: at('2029-02-20', 12, 0), children: [{ ...asha, birthday: '2028-02-29' }], prefs: { cadence: 'off' }, monthHorizonDays: 20 });
    expect(p.map((n) => [n.kind, n.date])).toEqual([['birthday', '2029-02-28']]);
  });

  it('a child with only a due date gets no month notes until born', () => {
    expect(plan({ children: [{ ...asha, birthday: null }], prefs: { cadence: 'off' } })).toEqual([]);
    expect(plan({ children: [{ ...asha, birthday: '2026-12-01' }], prefs: { cadence: 'off' } })).toEqual([]);
  });

  it('a child left out of reminders gets no notes', () => {
    expect(plan({ children: [{ ...asha, included: false }], prefs: { cadence: 'off' } })).toEqual([]);
  });

  it('month notes can be turned off on their own', () => {
    expect(plan({ prefs: { monthNotes: false } }).every((n) => n.kind === 'evening')).toBe(true);
  });

  it('twins share one note, never two at once', () => {
    const twin = { ...asha, id: 'child-twin', name: 'Dev' };
    const p = plan({ children: [asha, twin], prefs: { cadence: 'off' }, monthHorizonDays: 40 });
    expect(p.map((n) => n.date)).toEqual(['2026-10-08', '2026-11-08']);
    expect(p[0].title).toBe('Month 7 begins');
    expect(p[0].body).toBe(reminderCopy.together.monthBodyNeutral);
    const named = plan({ children: [asha, twin], prefs: { cadence: 'off', namesOnLockScreen: true }, monthHorizonDays: 40 });
    expect(named[0].body).toBe('New chapters for Asha and Dev are open.');
  });
});

describe('names on the lock screen (C-REQ-009, D-025)', () => {
  const names = ['Asha', 'Dev'];
  const lots = (namesOnLockScreen: boolean) =>
    plan({ children: [asha, dev], prefs: { cadence: 'everyEvening', namesOnLockScreen }, horizonDays: 21, monthHorizonDays: 400, maxNotifications: 200, now: at('2026-12-20', 12, 0) });

  it('by default no notification names a child', () => {
    const p = lots(false);
    expect(p.some((n) => n.kind === 'birthday')).toBe(true);
    for (const n of p) for (const name of names) expect(`${n.title} ${n.body}`, n.id).not.toContain(name);
  });

  it('with names on, evening nudges name each included child in turn', () => {
    const evenings = plan({ children: [asha, dev], prefs: { cadence: 'everyEvening', namesOnLockScreen: true, monthNotes: false }, horizonDays: 56, maxNotifications: 200 });
    // Every variant but "Tonight's letter" names a child.
    const named = evenings.map((n) => names.find((name) => `${n.title} ${n.body}`.includes(name))).filter(Boolean);
    expect(named.length).toBe(evenings.length - evenings.filter((n) => n.variant === 1).length);
    for (let i = 1; i < named.length; i++) expect(named[i]).not.toBe(named[i - 1]);
    // With month notes taking some evenings, both children are still named about as often.
    const mixed = lots(true).filter((n) => n.kind === 'evening').map((n) => names.find((name) => `${n.title} ${n.body}`.includes(name)));
    expect(Math.abs(mixed.filter((n) => n === 'Asha').length - mixed.filter((n) => n === 'Dev').length)).toBeLessThanOrEqual(2);
  });

  it('never names a child left out of reminders', () => {
    const p = plan({ children: [asha, { ...dev, included: false }], prefs: { cadence: 'everyEvening', namesOnLockScreen: true }, monthHorizonDays: 400, maxNotifications: 200 });
    for (const n of p) expect(`${n.title} ${n.body}`).not.toContain('Dev');
  });

  it('fills every placeholder', () => {
    for (const n of [...lots(true), ...lots(false)]) expect(`${n.title} ${n.body}`).not.toMatch(/[{}]/);
  });
});

describe('copy rotation (C-REQ-006)', () => {
  const patterns: [string, Partial<ReminderPrefs>][] = [
    ['every evening', { cadence: 'everyEvening' }],
    ['default', { cadence: 'fewTimes' }],
    ['Monday and Tuesday', { cadence: 'fewTimes', days: [1, 2] }],
    ['three evenings', { cadence: 'fewTimes', days: [0, 3, 5] }],
    ['weekly', { cadence: 'weekly', weeklyDay: 4 }],
  ];

  for (const [label, prefs] of patterns) {
    it(`no variant repeats within 4 nudges and no title twice in a row (${label})`, () => {
      const p = plan({ prefs: { ...prefs, monthNotes: false }, horizonDays: 120, maxNotifications: 500 });
      const variants = p.map((n) => n.variant!);
      for (let i = 0; i + 4 <= variants.length; i++) expect(new Set(variants.slice(i, i + 4)).size).toBe(4);
      for (let i = 1; i < p.length; i++) expect(p[i].title).not.toBe(p[i - 1].title);
    });
  }

  it('a date keeps its variant when the plan is made again later', () => {
    const early = plan({ prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 21 });
    const later = plan({ now: at('2026-10-12', 9, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 21 });
    for (const n of later) {
      const same = early.find((e) => e.date === n.date);
      if (same) expect(n.variant).toBe(same.variant);
    }
  });

  it('counts nudge days in order', () => {
    const d = parseIsoDate('2026-10-06')!; // a Tuesday
    expect(slotOrdinal(addDays(d, 4), [2, 6]) - slotOrdinal(d, [2, 6])).toBe(1);
    expect(slotOrdinal(addDays(d, 7), [2, 6]) - slotOrdinal(d, [2, 6])).toBe(2);
  });
});

describe('smart quiet (C-REQ-004, F2)', () => {
  it('[C-REQ-004] a save at 19:00 keeps that evening quiet, and the next 20 hours', () => {
    const p = plan({ now: at('2026-10-06', 19, 5), lastSaveAt: at('2026-10-06', 19, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 3 });
    expect(p.map((n) => n.date)).toEqual(['2026-10-07', '2026-10-08']);
  });

  it('a save in the morning still keeps that evening quiet', () => {
    const p = plan({ now: at('2026-10-06', 9, 0), lastSaveAt: at('2026-10-06', 8, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 2 });
    expect(p.map((n) => n.date)).toEqual(['2026-10-07']);
  });

  it('opening the app within 2 hours of a nudge skips it', () => {
    const quiet = plan({ now: at('2026-10-06', 19, 0), lastForegroundAt: at('2026-10-06', 19, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 1 });
    expect(quiet).toEqual([]);
    const kept = plan({ now: at('2026-10-06', 18, 0), lastForegroundAt: at('2026-10-06', 18, 0), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 1 });
    expect(kept.map((n) => n.date)).toEqual(['2026-10-06']);
  });

  it('month notes are not silenced by a recent save', () => {
    const p = plan({ now: at('2026-10-08', 19, 0), lastSaveAt: at('2026-10-08', 18, 0), prefs: { cadence: 'off' }, monthHorizonDays: 2 });
    expect(p.map((n) => [n.kind, n.date])).toEqual([['monthAge', '2026-10-08']]);
  });

  it('never schedules a slot already in the past', () => {
    const p = plan({ now: at('2026-10-06', 20, 45), prefs: { cadence: 'everyEvening', monthNotes: false }, horizonDays: 2 });
    expect(p.map((n) => n.date)).toEqual(['2026-10-07']);
  });
});

describe('limits and stability', () => {
  it('stays under the iOS limit of 64 pending notifications', () => {
    const kids = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, name: `Child${i}`, birthday: `2026-0${(i % 6) + 1}-1${i}`, included: true }));
    const p = plan({ children: kids, prefs: { cadence: 'everyEvening' }, horizonDays: 60, monthHorizonDays: 365 });
    expect(p.length).toBeLessThanOrEqual(60);
    for (let i = 1; i < p.length; i++) expect(p[i].fireAt).toBeGreaterThanOrEqual(p[i - 1].fireAt);
  });

  it('gives the same plan, ids and signature for the same inputs', () => {
    expect(planSignature(plan())).toBe(planSignature(plan()));
    expect(new Set(plan({ horizonDays: 60 }).map((n) => n.id)).size).toBe(plan({ horizonDays: 60 }).length);
  });

  it('joins names the way people say them', () => {
    expect(joinNames(['Asha'])).toBe('Asha');
    expect(joinNames(['Asha', 'Dev'])).toBe('Asha and Dev');
    expect(joinNames(['Asha', 'Dev', 'Nina'])).toBe('Asha, Dev and Nina');
  });
});

describe('reminder copy rules (VOICE.md, C-REQ-005)', () => {
  const leaves = (v: unknown, path = ''): { path: string; text: string }[] =>
    typeof v === 'string'
      ? [{ path, text: v }]
      : Array.isArray(v)
        ? v.flatMap((x, i) => leaves(x, `${path}[${i}]`))
        : v && typeof v === 'object'
          ? Object.entries(v).flatMap(([k, x]) => leaves(x, `${path}.${k}`))
          : [];
  const all = leaves(reminderCopy, 'reminderCopy');

  it('has no dashes, curly quotes, ellipses or emoji', () => {
    expect(all.filter((l) => /[—–‘’“”…]/.test(l.text) || /\p{Extended_Pictographic}/u.test(l.text))).toEqual([]);
  });

  it('never counts gaps, streaks or days', () => {
    const bad = /\b(in a row|missed|miss|since your last|streaks?|days? (ago|left)|\d+ days?|forgot|too late|don'?t miss)\b/i;
    expect(all.filter((l) => bad.test(l.text))).toEqual([]);
  });

  it('neutral variants line up with the named ones', () => {
    expect(reminderCopy.neutral.evening).toHaveLength(en.notifications.evening.length);
  });

  it('fits on a lock screen', () => {
    for (const v of [...reminderCopy.neutral.evening, reminderCopy.neutral.monthOpen, reminderCopy.neutral.birthday, reminderCopy.neutral.birthdays]) {
      expect(v.title.length).toBeLessThanOrEqual(40);
      expect(v.body.length).toBeLessThanOrEqual(110);
    }
  });
});
