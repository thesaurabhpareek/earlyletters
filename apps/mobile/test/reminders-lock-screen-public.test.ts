/// <reference types="node" />
/**
 * What a lock screen may carry (BL-1009; NS-47-R13, NS-46-R36, ADR 0033). Pure modules and source checks, so no phone
 * and no native module.
 * - The `publicTitleOk` allowlist: with names off, every title (and body) a planned note can have is a fixed name-free
 *   one, and the last check before iOS (payload.ts `lockScreenSafe`) turns anything else into the neutral line.
 * - The source check: no day id or day name reaches a notification identifier, `data` or category id built by
 *   payload.ts and scheduler.ts.
 * Fixtures: the fictional family Asha, with Avi and Zoya. The ticked-day ids are the US rows and made-up test ids.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, reminderCopy, US_DAY_ROWS } from '@scribe/content';
import { REMINDER_CATEGORY } from '../src/lib/reminders/categories';
import { lockScreenSafe, PUBLIC_BODIES, PUBLIC_TITLES, publicBodyOk, publicTitleOk, REMINDER_SOURCE, reminderContent } from '../src/lib/reminders/payload';
import { DEFAULT_PREFS, planReminders, type LibraryDayNote, type PlannedNotification, type PlannerChild, type PlanInput } from '../src/lib/reminders/planner';
import { addDays, isoDate, parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const NAMES = ['Asha', 'Avi', 'Zoya'];
const N = reminderCopy.neutral;
/** Value positions only: a type annotation (`identifier: string`) is not a value the code builds. */
const values = (src: string, re: RegExp) => (src.match(re) ?? []).filter((m) => !/\bstring\b|\btypeof\b/.test(m));
const code = (rel: string) =>
  readFileSync(join(__dirname, '..', 'src/lib/reminders', rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const kids: PlannerChild[][] = [
  [{ id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true }],
  [
    { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true },
    { id: 'child-avi', name: 'Avi', birthday: '2026-03-08', included: true },
  ],
  [
    { id: 'child-asha', name: 'Asha', birthday: '2025-03-08', included: true },
    { id: 'child-zoya', name: 'Zoya', birthday: '2026-05-08', included: true },
  ],
];
/** Made-up day ids a careless feed might pass beside the date, plus every US row id and name key. */
const DAY_IDS = ['zz-test-day-a', 'zz-test-day-b', ...US_DAY_ROWS.flatMap((r) => [r.id, r.nameKey])];
/** Words a parent might type for a day, and the weekday names: none may reach an identifier, data or category. */
const DAY_NAMES = ['Diwali with Nani', 'Rakhi with Avi', 'First Christmas', ...reminderCopy.weekdays];

/** Plans over a spread of days, books, switches and typed and ticked days, with names as given. */
function plans(names: boolean): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  for (const children of kids) {
    for (const day of ['2026-10-05', '2027-02-20', '2027-03-01', '2027-03-07']) {
      const today = parseIsoDate(day)!;
      const dates = [3, 9, 15].map((n) => isoDate(addDays(today, n)));
      const libraryDays = dates.map((date, i) => ({ date, id: DAY_IDS[i], key: `days.${DAY_IDS[i]}`, layer: 'tradition' }) as LibraryDayNote);
      for (const dayNamesOn of [false, true]) {
        for (const enabled of [true, false]) {
          const input: PlanInput = {
            now: zonedToEpoch({ ...today, hh: 12, mm: 0 }, LA),
            timeZone: LA,
            prefs: { ...DEFAULT_PREFS, enabled, cadence: 'everyEvening', monthNotes: true, namesOnLockScreen: names },
            children,
            typedDays: [{ date: isoDate(addDays(today, 5)), words: DAY_NAMES[1]! }],
            libraryDays,
            dayNamesOn,
            lastSaveAt: null,
            lastForegroundAt: null,
            horizonDays: 60,
            monthHorizonDays: 540,
            maxNotifications: 1000,
          };
          out.push(...planReminders(input));
        }
      }
    }
  }
  return out;
}

describe('[NS-47-R13] the publicTitleOk allowlist', () => {
  const off = plans(false);

  it('the plans reach every kind, so the checks below are not passing on empty plans', () => {
    expect(new Set(off.map((n) => n.kind))).toEqual(new Set(['evening', 'monthAge', 'birthday', 'typedDay', 'libraryDay']));
  });

  it('with names off, every planned title is on the allowlist, and so is every body', () => {
    expect(off.filter((n) => !publicTitleOk(n.title)).map((n) => `${n.id}: ${n.title}`)).toEqual([]);
    expect(off.filter((n) => !publicBodyOk(n.body)).map((n) => `${n.id}: ${n.body}`)).toEqual([]);
  });

  it('the allowlists are fixed, name-free and hold no blank, number or day name', () => {
    expect(PUBLIC_TITLES.size).toBeGreaterThan(0);
    for (const s of [...PUBLIC_TITLES, ...PUBLIC_BODIES]) {
      expect(s, s).not.toMatch(/\{|\}|\d/);
      for (const name of NAMES) expect(s, s).not.toContain(name);
    }
    // A named title is never on it, nor is the names-on month title (an age on a lock screen, E82).
    expect(publicTitleOk(en.notifications.birthday.title.replace('{child}', 'Asha'))).toBe(false);
    expect(publicTitleOk(en.notifications.monthOpen.title.replace('{month}', '8'))).toBe(false);
    expect(publicTitleOk(N.typedDay.title)).toBe(true);
  });

  it('with names on, the names reach some titles, so the allowlist is not simply every title', () => {
    expect(plans(true).some((n) => !publicTitleOk(n.title))).toBe(true);
  });

  it('the last check before iOS: names off turns any other title or body into the neutral line; names on changes nothing', () => {
    const p = off.find((n) => n.kind === 'birthday')!;
    const leaky = { ...p, title: 'Happy birthday to Asha', body: 'Asha is one today' };
    expect(lockScreenSafe(leaky, false)).toMatchObject({ id: p.id, title: N.libraryDay.title, body: N.lockBody });
    expect(lockScreenSafe({ ...p, body: 'Asha is one today' }, false)).toMatchObject({ title: p.title, body: N.lockBody });
    expect(lockScreenSafe(leaky, true)).toBe(leaky);
    for (const n of off) expect(lockScreenSafe(n, false)).toBe(n); // the planner's names-off words pass untouched
  });

  it('the scheduler puts every planned note through the last check before it schedules it (source)', () => {
    const s = code('scheduler.ts');
    expect(s).toMatch(/\.map\(\(p\) => lockScreenSafe\(p, namesOn\)\)/);
    expect(s).toMatch(/const namesOn = readPrefs\(\)\.namesOnLockScreen;/);
    expect(s.match(/scheduleNotificationAsync\(/g)).toHaveLength(1);
  });
});

describe('[NS-46-R36] no day id or day name in an identifier, data or category', () => {
  const all = [...plans(false), ...plans(true)];

  it('every identifier is our prefix, the kind and the local date, nothing else', () => {
    for (const n of all) expect(n.id, n.id).toMatch(/^el\.(evening|month|birthday|typed|day)\.\d{4}-\d{2}-\d{2}$/);
  });

  it('every payload is source and kind only, and every category is the one reminder category', () => {
    expect(REMINDER_CATEGORY).toBe('reminder');
    for (const n of all) {
      const c = reminderContent(n);
      expect(c.data, n.id).toEqual({ source: REMINDER_SOURCE, kind: n.kind });
      expect(c.categoryIdentifier, n.id).toBe(REMINDER_CATEGORY);
    }
  });

  it('no day id, name key, typed word or weekday name is in any identifier, data or category', () => {
    for (const n of all) {
      const c = reminderContent(n);
      const carried = JSON.stringify([n.id, c.data, c.categoryIdentifier]);
      for (const banned of [...DAY_IDS, ...DAY_NAMES, 'days.', 'tradition']) expect(carried, `${n.id} ${banned}`).not.toContain(banned);
    }
  });

  it('payload.ts builds data from source and kind only, with the one category constant and no thread id (source)', () => {
    const p = code('payload.ts');
    expect(values(p, /\bdata: \{[^}]*\}/g)).toEqual(['data: { source: REMINDER_SOURCE, kind: p.kind }']);
    expect(values(p, /categoryIdentifier: [^,\n]+/g)).toEqual(['categoryIdentifier: REMINDER_CATEGORY']);
    expect(p).not.toMatch(/threadIdentifier|nameKey|US_DAY_ROWS|\.words\b|\.layer\b/);
  });

  it('scheduler.ts schedules with the planned id and the built content only, and names no day (source)', () => {
    const s = code('scheduler.ts');
    expect(values(s, /identifier: [^,\n]+/g)).toEqual(['identifier: p.id']);
    expect(s).toMatch(/content: reminderContent\(p\)/);
    expect(s).not.toMatch(/threadIdentifier|categoryIdentifier|nameKey|US_DAY_ROWS|\.layer\b/);
    // The one category registered is the constant, never one built from a day.
    expect(code('categories.ts')).toMatch(/await set\(REMINDER_CATEGORY, \[\], reminderCategoryOptions\(\)\)/);
  });
});
