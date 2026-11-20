import { readFileSync } from 'node:fs';
import { en, reminderCopy } from '@scribe/content';
import { FLOOR_KEYS, EVENING_FROM_MINUTES, type KeySelector } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFS,
  activeWeekdays,
  planReminders,
  planSignature,
  slotOrdinal,
  type PlanInput,
  type PlannedNotification,
  type PlannerChild,
  type ReminderPrefs,
} from '../src/lib/reminders/planner';
import { REMINDER_SOURCE, reminderContent } from '../src/lib/reminders/payload';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const dev: PlannerChild = { id: 'child-dev', name: 'Dev', birthday: '2024-05-31', included: true };
const EVENING_WORDS = /tonight|evening|before you sleep|house is quiet/i;

function at(iso: string, hh: number, mm: number, tz = LA): number {
  return zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm }, tz);
}

function plan(p: Omit<Partial<PlanInput>, 'prefs'> & { prefs?: Partial<ReminderPrefs> } = {}): PlannedNotification[] {
  return planReminders({
    now: p.now ?? at('2026-10-05', 12, 0),
    timeZone: p.timeZone ?? LA,
    children: p.children ?? [asha],
    horizonDays: p.horizonDays ?? 60,
    select: p.select,
    prefs: { ...DEFAULT_PREFS, enabled: true, monthNotes: false, ...p.prefs },
  });
}

const shape = (list: PlannedNotification[]) => list.map((n) => `${n.id}|${n.kind}|${n.date}|${n.hour}:${n.minute}|${n.fireAt}`);

describe('NS-48 phase 1: the planner seam and the built 8, re-keyed', () => {
  it('[NS-48-R2] volume is unchanged: the set of (id, date, time, class) is the same whichever selector the planner is given', () => {
    const constant: KeySelector = () => FLOOR_KEYS[0];
    for (const cadence of ['weekly', 'fewTimes', 'everyEvening'] as const) {
      for (const timeZone of [LA, 'Asia/Kolkata', 'Pacific/Auckland']) {
        for (const children of [[asha], [asha, dev], []]) {
          for (const monthNotes of [false, true]) {
            const base = { timeZone, children, prefs: { cadence, monthNotes, namesOnLockScreen: true } };
            const on = plan(base);
            expect(on.length).toBeGreaterThan(0);
            const off = plan({ ...base, select: constant });
            expect(shape(off)).toEqual(shape(on));
            // The injected selector is the one the planner asked.
            expect(off.filter((n) => n.kind === 'evening').every((n) => n.key === FLOOR_KEYS[0])).toBe(true);
          }
        }
      }
    }
  });

  it('[NS-48-R1] every planned evening note carries a key, the same inputs give the same key, and the key is a floor key', () => {
    const a = plan({ prefs: { cadence: 'everyEvening' } });
    const b = plan({ prefs: { cadence: 'everyEvening' } });
    const evenings = a.filter((n) => n.kind === 'evening');
    expect(evenings.length).toBeGreaterThan(20);
    for (const n of evenings) expect(FLOOR_KEYS).toContain(n.key);
    expect(b.map((n) => n.key)).toEqual(a.map((n) => n.key));
  });

  it('[NS-48-R23] at the default 20:30 the built 8 keep their built titles and bodies, named and neutral', () => {
    const weekdays = activeWeekdays(DEFAULT_PREFS);
    for (const names of [false, true]) {
      const list = plan({ prefs: { namesOnLockScreen: names } }).filter((n) => n.kind === 'evening');
      expect(list.length).toBeGreaterThan(5);
      for (const n of list) {
        const variant = slotOrdinal(parseIsoDate(n.date)!, weekdays) % 8;
        expect(n.variant).toBe(variant);
        const built = names ? en.notifications.evening[variant] : reminderCopy.neutral.evening[variant];
        const fill = (s: string) => s.replace('{child}', 'Asha').replace('{weekday}', reminderCopy.weekdays[new Date(`${n.date}T12:00:00Z`).getUTCDay()]);
        expect([n.title, n.body]).toEqual([fill(built.title), fill(built.body)]);
      }
    }
  });

  it('[NS-48-R12] a 07:00 reminder never carries evening words, named or neutral, over 60 days and every cadence', () => {
    for (const cadence of ['weekly', 'fewTimes', 'everyEvening'] as const) {
      for (const names of [false, true]) {
        const list = plan({ prefs: { cadence, namesOnLockScreen: names, time: { hour: 7, minute: 0 } } }).filter((n) => n.kind === 'evening');
        expect(list.length).toBeGreaterThan(5);
        for (const n of list) expect(`${n.title} ${n.body}`).not.toMatch(EVENING_WORDS);
      }
    }
  });

  it('[NS-48-R12] the core day-part flags match the words: the evening-worded built variants are exactly 1, 3 and 6', () => {
    const worded = (v: { title: string; body: string }) => EVENING_WORDS.test(`${v.title} ${v.body}`);
    const named = en.notifications.evening.map((v, i) => (worded(v) ? i : -1)).filter((i) => i >= 0);
    const neutral = reminderCopy.neutral.evening.map((v, i) => (worded(v) ? i : -1)).filter((i) => i >= 0);
    expect(named).toEqual([1, 3, 6]);
    expect(neutral).toEqual([1, 3, 6]);
    expect(EVENING_FROM_MINUTES).toBe(17 * 60);
  });

  it('[NS-48-R12] the filter reads the reminder time: 16:45 is a day note, 17:00 may be an evening note', () => {
    const early = plan({ prefs: { cadence: 'everyEvening', time: { hour: 16, minute: 45 } } });
    const late = plan({ prefs: { cadence: 'everyEvening', time: { hour: 17, minute: 0 } } });
    expect(new Set(early.map((n) => n.variant))).toEqual(new Set([0, 2, 4, 5, 7]));
    expect(new Set(late.map((n) => n.variant))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7]));
  });

  it('[NS-48-R14] morning notes rotate without repeats inside the pool of five, and no title shows twice in a row', () => {
    const list = plan({ prefs: { cadence: 'everyEvening', time: { hour: 7, minute: 0 } } }).filter((n) => n.kind === 'evening');
    for (let i = 0; i + 5 <= list.length; i++) expect(new Set(list.slice(i, i + 5).map((n) => n.key)).size).toBe(5);
    for (let i = 1; i < list.length; i++) expect(list[i].title).not.toBe(list[i - 1].title);
  });

  it('[NS-48-R20] two books are named in turn in the morning: they alternate and neither is named more than once more than the other', () => {
    // Proves the built alternation only. R20 as written (ordinal modulo books, whatever the pool) is not what the code does; see namedSlotIndex.
    const list = plan({ children: [asha, dev], prefs: { cadence: 'everyEvening', namesOnLockScreen: true, time: { hour: 7, minute: 0 } } }).filter((n) => n.kind === 'evening');
    const who = list.map((n) => (`${n.title} ${n.body}`.includes('Asha') ? 'Asha' : 'Dev'));
    const asha_ = who.filter((w) => w === 'Asha').length;
    expect(Math.abs(asha_ - (who.length - asha_))).toBeLessThanOrEqual(1);
    for (let i = 1; i < who.length; i++) expect(who[i]).not.toBe(who[i - 1]);
  });

  it('[NS-48-R12] an injected selector that returns an evening-worded key at 07:00 is overruled by the floor', () => {
    for (const index of [1, 3, 6]) {
      const list = plan({ prefs: { cadence: 'everyEvening', time: { hour: 7, minute: 0 } }, select: () => FLOOR_KEYS[index] }).filter((n) => n.kind === 'evening');
      expect(list.length).toBeGreaterThan(5);
      for (const n of list) {
        expect([1, 3, 6]).not.toContain(n.variant);
        expect(`${n.title} ${n.body}`).not.toMatch(EVENING_WORDS);
      }
    }
    // From 17:00 the same selector is honoured.
    const late = plan({ prefs: { cadence: 'everyEvening' }, select: () => FLOOR_KEYS[3] }).filter((n) => n.kind === 'evening');
    expect(late.every((n) => n.key === FLOOR_KEYS[3])).toBe(true);
  });

  it('[NS-48-R15] a selector that returns an unknown key, or throws, never leaves a note without words', () => {
    const bad: KeySelector = () => 'not.a.key';
    const throwing: KeySelector = () => {
      throw new Error('boom');
    };
    const base = plan();
    let asked = 0;
    plan({ select: (i) => (asked++, FLOOR_KEYS[i.slotOrdinal % 8]) });
    expect(asked).toBeGreaterThan(0);
    for (const select of [bad, throwing]) {
      const list = plan({ select });
      expect(list.map((n) => [n.id, n.title, n.body])).toEqual(base.map((n) => [n.id, n.title, n.body]));
    }
  });

  it('[NS-48-R32] a plan made twice with no input change has equal signatures, and the signature ignores which selector produced the same words', () => {
    const once = plan({ prefs: { namesOnLockScreen: true } });
    expect(planSignature(plan({ prefs: { namesOnLockScreen: true } }))).toBe(planSignature(once));
    const same: KeySelector = (i) => FLOOR_KEYS[((Math.floor(i.slotOrdinal) % 8) + 8) % 8];
    expect(planSignature(plan({ prefs: { namesOnLockScreen: true }, select: same }))).toBe(planSignature(once));
    // A different input does change it.
    expect(planSignature(plan({ prefs: { namesOnLockScreen: false } }))).not.toBe(planSignature(once));
  });

  it('[NS-48-R31] the content the scheduler builds holds only source and kind in its payload: no key, variant or day', () => {
    const list = plan({ children: [asha], prefs: { cadence: 'everyEvening', monthNotes: true, namesOnLockScreen: true }, horizonDays: 120 });
    expect(new Set(list.map((n) => n.kind)).size).toBeGreaterThan(1);
    for (const n of list) {
      expect(n.key === undefined || typeof n.key === 'string').toBe(true);
      const content = reminderContent(n);
      expect(content.data).toEqual({ source: REMINDER_SOURCE, kind: n.kind });
      expect(Object.keys(content).sort()).toEqual(['body', 'data', 'sound', 'title']);
      expect(JSON.stringify(content.data)).not.toMatch(/floor|variant|key/);
    }
    // The scheduler schedules exactly this builder's output.
    const scheduler = readFileSync(new URL('../src/lib/reminders/scheduler.ts', import.meta.url), 'utf8');
    expect(scheduler).toMatch(/content: reminderContent\(p\)/);
  });
});
