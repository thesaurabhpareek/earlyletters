/// <reference types="node" />
/**
 * The reminder never-list (NS-13 PR 1 in the capture design; BL-943): what a reminder may never say. Every notification
 * string in content (`reminderCopy`, `en.notifications`) and every plan the planner makes for the fictional Asha family
 * (born, due date only, twins; every cadence; names on and off) is checked. The letters themselves are checked on the
 * real store (node:sqlite): canary words saved in letters never reach a planned title or body.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { en } from '@scribe/content';
import { ENGINE_VERSION } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { lastOwnSaveAt, plannerChildren } = await import('../src/lib/reminders/prefs');
const { reminderCopy } = await import('../src/lib/reminders/copy');
const { DEFAULT_PREFS, planReminders } = await import('../src/lib/reminders/planner');
const { parseIsoDate, zonedToEpoch } = await import('../src/lib/reminders/tz');
type Cadence = import('../src/lib/reminders/planner').Cadence;
type PlanInput = import('../src/lib/reminders/planner').PlanInput;
type PlannerChild = import('../src/lib/reminders/planner').PlannerChild;
type PlannedNotification = import('../src/lib/reminders/planner').PlannedNotification;

const LA = 'America/Los_Angeles';
const at = (iso: string) => zonedToEpoch({ ...parseIsoDate(iso)!, hh: 12, mm: 0 }, LA);
const CADENCES: Cadence[] = ['off', 'weekly', 'fewTimes', 'everyEvening'];

/** Every string under a value, with its path. */
function strings(v: unknown, path = ''): [string, string][] {
  if (typeof v === 'string') return [[path, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => strings(x, `${path}[${i}]`));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => strings(x, path ? `${path}.${k}` : k));
  return [];
}

/** The notification words: what can reach a lock screen. */
const POOL = [...strings(reminderCopy.neutral, 'neutral'), ...strings(reminderCopy.together, 'together'), ...strings(en.notifications, 'notifications')];

const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const ashaExpected: PlannerChild = { ...asha, birthday: null };
const twin: PlannerChild = { ...asha, id: 'child-asha-twin', name: 'Asha Twin' };
const FAMILIES: PlannerChild[][] = [[asha], [ashaExpected], [asha, twin]];

/** Every plan over a year and a half: each family, cadence, names on and off, and a start near a birthday. */
function everyPlan(namesOnLockScreen: boolean): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  for (const children of FAMILIES) {
    for (const cadence of CADENCES) {
      for (const now of [at('2026-10-05'), at('2027-02-20')]) {
        out.push(
          ...planReminders({
            now,
            timeZone: LA,
            prefs: { ...DEFAULT_PREFS, enabled: true, cadence, namesOnLockScreen },
            children,
            lastSaveAt: null,
            lastForegroundAt: null,
            horizonDays: 60,
            monthHorizonDays: 540,
            maxNotifications: 1000,
          }),
        );
      }
    }
  }
  return out;
}

const GUILT = /\b(miss|missed|missing|behind|forgot|forget|forgotten|streak|streaks|last chance)\b/i;
const DAY_COUNT = /\b\d+\s*(day|days|night|nights|week|weeks)\b/i;

describe('[NS-13-R5] no guilt words', () => {
  it('no notification string in content has a guilt word or any number', () => {
    expect(POOL.length).toBeGreaterThan(20);
    for (const [path, s] of POOL) {
      expect(s, path).not.toMatch(GUILT);
      expect(s, path).not.toMatch(/\d/);
    }
  });

  it('no reminder setting or priming line has a guilt word or counts days', () => {
    for (const [path, s] of [...strings(reminderCopy.settings, 'settings'), ...strings(reminderCopy.priming, 'priming')]) {
      expect(s, path).not.toMatch(GUILT);
      expect(s, path).not.toMatch(DAY_COUNT);
    }
  });

  it('no planned title or body counts anything; the only number is the month a month note names', () => {
    const plans = [...everyPlan(false), ...everyPlan(true)];
    expect(new Set(plans.map((n) => n.kind))).toEqual(new Set(['evening', 'monthAge', 'birthday']));
    for (const n of plans) {
      const words = `${n.title} ${n.body}`;
      expect(words, n.id).not.toMatch(GUILT);
      const rest = n.kind === 'monthAge' ? words.replace(/^Month \d+ begins /, '') : words;
      expect(rest, n.id).not.toMatch(/\d/);
    }
  });
});

describe('[NS-13-R6a] the notification pool is name-free', () => {
  it('the neutral pool has no {child} token', () => {
    const neutral = [...strings(reminderCopy.neutral, 'neutral'), ['together.monthTitle', reminderCopy.together.monthTitle], ['together.monthBodyNeutral', reminderCopy.together.monthBodyNeutral]];
    for (const [path, s] of neutral) expect(s, path).not.toMatch(/\{child\}|\{signsAs\}/);
  });

  it('with names off (the default) every plan for the Asha family names no one and leaves no token', () => {
    expect(DEFAULT_PREFS.namesOnLockScreen).toBe(false);
    const plans = everyPlan(false);
    expect(plans.length).toBeGreaterThan(100);
    const titles = new Set<string>([
      ...reminderCopy.neutral.evening.map((v) => v.title),
      reminderCopy.neutral.birthday.title,
      reminderCopy.neutral.birthdays.title,
      reminderCopy.together.monthTitle,
    ]);
    for (const n of plans) {
      expect(`${n.title} ${n.body}`, n.id).not.toMatch(/Asha|\{|\}/);
      const fromPool = titles.has(n.title) || /^Month \d+ begins$/.test(n.title) || /^A page for [A-Z][a-z]+day$/.test(n.title);
      expect(fromPool, `${n.id}: ${n.title}`).toBe(true);
    }
  });
});

describe('[NS-13-R6b] no letter words on the lock screen', () => {
  it('the planner is never given text: no field of its input can carry a letter', () => {
    type TextLike = 'text' | 'finalText' | 'rawTranscript' | 'transcript' | 'typedText' | 'words' | 'excerpt' | 'title' | 'body';
    expectTypeOf<Extract<keyof PlanInput, TextLike>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof PlannerChild, TextLike>>().toEqualTypeOf<never>();
  });

  describe('on the real store', () => {
    let close: () => void = () => {};
    let seq = 0;
    const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
    beforeEach(() => {
      store.closeStore();
      const h = nodeDb();
      close = h.close;
      expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-05T19:00:00.000Z', newId }).ok).toBe(true);
    });
    afterEach(() => {
      store.closeStore();
      close();
    });

    it('canary words saved in a letter and a draft never reach a planned title or body, whatever the settings', () => {
      const CANARY = 'Quokkalantern';
      const book = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
      const said = `${CANARY} by the window, and you laughed at it.`;
      store.saveEntry({
        id: '0199a5b0-0000-7000-8000-0000000000c1',
        kind: 'letter',
        occurredOn: '2026-10-04',
        capturedAt: '2026-10-04T19:00:00.000Z',
        captureMode: 'typed',
        editLevel: 'verbatim',
        promptKey: null,
        engineVersion: ENGINE_VERSION,
        rawTranscript: said,
        machineEdits: [],
        finalText: said,
        inBook: true,
        soundsLikeMe: null,
        childId: book.id,
        authorSignsAs: 'Mama',
      });
      store.createDraft({ childId: book.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: `${CANARY} again tonight.` });
      for (const cadence of CADENCES) {
        for (const namesOnLockScreen of [false, true]) {
          const plan = planReminders({
            now: at('2026-10-05'),
            timeZone: LA,
            prefs: { ...DEFAULT_PREFS, enabled: true, cadence, namesOnLockScreen },
            children: plannerChildren(),
            lastSaveAt: lastOwnSaveAt(),
            lastForegroundAt: null,
            monthHorizonDays: 400,
            maxNotifications: 500,
          });
          expect(plan.length, `${cadence} ${namesOnLockScreen}`).toBeGreaterThan(0);
          for (const n of plan) {
            const words = `${n.title} ${n.body}`;
            expect(words, n.id).not.toContain(CANARY);
            expect(words, n.id).not.toMatch(/window|laughed/);
          }
        }
      }
    });
  });
});
