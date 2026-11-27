/// <reference types="node" />
/**
 * Notification words and the one-a-day slot (BL-1324; NS-48-R9, R21, R26; FR-NTC-08, 09, 11), and the words of a
 * planned note across generated plans (BL-1323; FR-NTC-01 to 05 and 10; the pure key function is proved in
 * packages/core/test/notification-layers.test.ts).
 * The planner is pure and is driven here with generated inputs from a seeded generator, so a failure prints its seed
 * and replays. The quiet-book key rule also runs on a real store (node:sqlite), because the key layers read the newest
 * letter from the store. Library-day notes (NS-46, BL-1012) are not built yet: when they land, they join the
 * enumeration below. Fictional family Asha and Avi only.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { entries } from '../src/lib/db/repos';
import { SYNC_SETTING } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { lastMadeLetter, plannerChildren, readPrefs, dayNamesOn } = await import('../src/lib/reminders/prefs');
const { DEFAULT_PREFS, planReminders } = await import('../src/lib/reminders/planner');
const { budgetedSlots, PLAN_MAX } = await import('../src/lib/reminders/budget');
const { isoDate, parseIsoDate, zonedParts, zonedToEpoch, addDays } = await import('../src/lib/reminders/tz');
const { reminderCopy } = await import('../src/lib/reminders/copy');
const { APP_LOCK_KEYS } = await import('../src/lib/app-lock/prefs');
const { FLOOR_KEYS, floorIndexOfKey, layeredSelector, recencyBand, selectNotificationKey } = await import('@scribe/core');
const { en } = await import('@scribe/content');
const { dayNumber } = await import('../src/lib/reminders/tz');
type PlanInput = import('../src/lib/reminders/planner').PlanInput;
type PlannerChild = import('../src/lib/reminders/planner').PlannerChild;
type PlannedNotification = import('../src/lib/reminders/planner').PlannedNotification;
type Cadence = import('../src/lib/reminders/planner').Cadence;
type KeyInput = import('@scribe/core').KeyInput;

const ZONES = ['America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Kathmandu', 'Australia/Lord_Howe', 'Pacific/Kiritimati', 'UTC'];
const CADENCES: Cadence[] = ['off', 'weekly', 'fewTimes', 'everyEvening'];
/** Names a lock screen must never show by default: each is a distinct word, so a substring check is exact. */
const NAMES = ['Asha', 'Avi', 'Zoya'];
/** Day and faith words a parent might type for a family or tradition day. */
const DAY_WORDS = ['Diwali with Nani', 'Eid at the park', 'First Christmas', 'Rakhi with Avi', 'Shabbat dinner'];
const FIXED = reminderCopy.neutral.typedDay;

/** mulberry32: small, seeded, the same sequence on every machine. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const START = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

/** A generated planner input: any zone, any day of a year (both clock changes included), any settings. */
function generated(seed: number, over: Partial<PlanInput> = {}): PlanInput {
  const r = rng(seed);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
  const timeZone = pick(ZONES);
  const now = START + Math.floor(r() * 365 * DAY);
  const t = zonedParts(now, timeZone);
  const today = { y: t.y, m: t.m, d: t.d };
  const children: PlannerChild[] = NAMES.slice(0, Math.floor(r() * 4)).map((name, i) => ({
    id: `child-${name.toLowerCase()}`,
    name,
    birthday: isoDate(addDays(today, -Math.floor(r() * 900) + (r() < 0.1 ? 30 : 0))),
    included: r() < 0.8,
    quiet: r() < 0.2,
  }));
  const typedDays = Array.from({ length: Math.floor(r() * 6) }, () => ({
    date: isoDate(addDays(today, Math.floor(r() * 70) - 3)),
    words: pick(DAY_WORDS),
  }));
  return {
    now,
    timeZone,
    prefs: {
      ...DEFAULT_PREFS,
      enabled: r() < 0.85,
      paused: r() < 0.1,
      cadence: pick(CADENCES),
      days: [0, 1, 2, 3, 4, 5, 6].filter(() => r() < 0.4),
      weeklyDay: Math.floor(r() * 7),
      time: { hour: 7 + Math.floor(r() * 15), minute: pick([0, 15, 30, 45]) },
      monthNotes: r() < 0.8,
      namesOnLockScreen: r() < 0.5,
    },
    children,
    typedDays,
    dayNamesOn: r() < 0.5,
    lastSaveAt: r() < 0.5 ? now - Math.floor(r() * 40 * DAY) : null,
    lastForegroundAt: r() < 0.5 ? now - Math.floor(r() * 3 * 3_600_000) : null,
    anchorAt: r() < 0.6 ? now - Math.floor(r() * 50 * DAY) : null,
    lastLetter: r() < 0.6 ? { at: now - Math.floor(r() * 60 * DAY), kind: r() < 0.5 ? 'spoke' : 'typed' } : null,
    monthHorizonDays: 120,
    planPending: Math.floor(r() * 5),
    ...over,
  };
}

const SEEDS = Array.from({ length: 400 }, (_, i) => 1324_000 + i);
const strings = (n: PlannedNotification) => [n.title, n.body, n.id];

describe('[NS-48-R26] the one-a-day budget has one enforced place', () => {
  it('no local date holds two budgeted notes, across every source, zone and setting (400 seeded plans)', () => {
    for (const seed of SEEDS) {
      const input = generated(seed);
      const plan = planReminders(input);
      const dates = plan.map((n) => n.date);
      expect(new Set(dates).size, `seed ${seed}`).toBe(dates.length);
      for (const n of plan) {
        const p = zonedParts(n.fireAt, input.timeZone);
        expect(isoDate({ y: p.y, m: p.m, d: p.d }), `seed ${seed} ${n.id}`).toBe(n.date);
      }
      expect(plan.length, `seed ${seed}`).toBeLessThanOrEqual(budgetedSlots(input.planPending ?? PLAN_MAX));
    }
  });

  it('the generated plans reach every source, so the property is not passing on empty plans', () => {
    const kinds = new Set(SEEDS.flatMap((s) => planReminders(generated(s)).map((n) => n.kind)));
    expect([...kinds].sort()).toEqual(['birthday', 'evening', 'monthAge', 'typedDay']);
  });

  // What this proves: the chooser is defined once, in budget.ts, and the planner calls it for the day notes and on the
  // final plan. The days a chosen day note holds (even one later dropped for lead time or quiet hours) are named by
  // budget.ts `heldDays` too (BL-2246): the planner calls it and builds no day set of its own for the note days.
  it('the chooser is defined only in budget.ts, and the planner calls it for day notes and on the final plan', () => {
    const dir = join(__dirname, '../src/lib/reminders');
    const others = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'budget.ts');
    for (const f of others) {
      const code = readFileSync(join(dir, f), 'utf8');
      expect(code, f).not.toMatch(/function\s+\w*(OnePerDay|PerDay|oneADay)\b/);
    }
    const budget = readFileSync(join(dir, 'budget.ts'), 'utf8');
    expect(budget).toMatch(/export function chooseOnePerDay/);
    expect(budget).toMatch(/export function heldDays\(/);
    const planner = readFileSync(join(dir, 'planner.ts'), 'utf8');
    const ret = planner.slice(planner.lastIndexOf('export function planReminders'));
    expect(ret).toMatch(/const chosenNotes = chooseOnePerDay</);
    expect(ret).toMatch(/const oneADay = chooseOnePerDay\(out\.map/);
    expect(ret).toMatch(/const noteDays = heldDays\(chosenNotes\)/);
    expect(ret).toMatch(/noteDays\.has\(/);
    expect(planner).not.toMatch(/new Set<number>\(\)/);
    for (const f of others) expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/function\s+heldDays\b/);
  });
});

describe('[FR-NTC-08] a parent-chosen day takes the slot as a typedDay', () => {
  const LA = 'America/Los_Angeles';
  const NOW = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, LA);
  const avi: PlannerChild = { id: 'child-avi', name: 'Avi', birthday: '2025-10-20', included: true };
  const base = (over: Partial<PlanInput> = {}): PlanInput => ({
    now: NOW,
    timeZone: LA,
    prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', namesOnLockScreen: true },
    children: [avi],
    lastSaveAt: null,
    lastForegroundAt: null,
    monthHorizonDays: 120,
    ...over,
  });

  it('it takes the day from a birthday and from an evening nudge', () => {
    const plan = planReminders(base({ typedDays: [{ date: '2026-10-20', words: 'Party' }, { date: '2026-10-07', words: 'Park' }] }));
    expect(plan.filter((n) => n.date === '2026-10-20').map((n) => n.kind)).toEqual(['typedDay']);
    expect(plan.filter((n) => n.date === '2026-10-07').map((n) => n.kind)).toEqual(['typedDay']);
  });

  it('it ignores recency: no key is chosen for it and the selector is never asked about its day', () => {
    const asked: KeyInput[] = [];
    const select = (k: KeyInput) => (asked.push(k), selectNotificationKey(k));
    const lastLetter = { at: NOW - 3 * DAY, kind: 'spoke' as const };
    const plan = planReminders(base({ typedDays: [{ date: '2026-10-07', words: 'Park' }], lastLetter, select }));
    const t = plan.find((n) => n.kind === 'typedDay')!;
    expect(t.key).toBeUndefined();
    expect(t.variant).toBeUndefined();
    expect(asked.length).toBe(plan.filter((n) => n.kind === 'evening').length);
  });

  it('it survives the back-off: past day 35 every evening is gone and the typed day still comes', () => {
    const plan = planReminders(base({ anchorAt: NOW - 40 * DAY, typedDays: [{ date: '2026-10-09', words: 'Park' }] }));
    expect(plan.filter((n) => n.kind === 'evening')).toEqual([]);
    expect(plan.filter((n) => n.kind === 'typedDay').map((n) => n.date)).toEqual(['2026-10-09']);
  });

  it('the app never infers a day: with no typed day given there is never a typedDay note (400 seeded plans)', () => {
    for (const seed of SEEDS) {
      expect(planReminders(generated(seed, { typedDays: [] })).filter((n) => n.kind === 'typedDay'), `seed ${seed}`).toEqual([]);
      expect(planReminders(generated(seed, { typedDays: undefined })).filter((n) => n.kind === 'typedDay'), `seed ${seed}`).toEqual([]);
    }
  });

  it('every typedDay note is a day that was typed, at most one each', () => {
    for (const seed of SEEDS) {
      const input = generated(seed);
      const typed = new Set((input.typedDays ?? []).map((t) => t.date));
      const notes = planReminders(input).filter((n) => n.kind === 'typedDay');
      for (const n of notes) expect(typed.has(n.date), `seed ${seed} ${n.date}`).toBe(true);
      expect(new Set(notes.map((n) => n.date)).size, `seed ${seed}`).toBe(notes.length);
    }
  });
});

describe('[FR-NTC-11] no child name on a lock screen with names off or App lock on', () => {
  it('names off: no title, body or id of any note holds a child name, with day names off or on (400 seeded plans)', () => {
    // Day names on is the hard case: a typed day's words can name a child ("Rakhi with Avi"), and names off still wins
    // (CPrivO-58). Whole word, any case, so "avi" or "AVI" typed by a parent is caught too.
    const named = NAMES.map((m) => new RegExp(`\\b${m}\\b`, 'i'));
    for (const seed of SEEDS) {
      for (const dayNames of [false, true]) {
        const input = generated(seed);
        const plan = planReminders({ ...input, prefs: { ...input.prefs, namesOnLockScreen: false }, dayNamesOn: dayNames });
        for (const n of plan) for (const s of strings(n)) for (const re of named) expect(s, `seed ${seed} ${n.id}`).not.toMatch(re);
      }
    }
  });

  it('names on and day names on: a typed day with a name in its words shows them, so the check above can fail', () => {
    const shown = SEEDS.some((seed) => {
      const input = generated(seed);
      return planReminders({ ...input, prefs: { ...input.prefs, namesOnLockScreen: true }, dayNamesOn: true }).some(
        (n) => n.kind === 'typedDay' && n.body === 'Rakhi with Avi',
      );
    });
    expect(shown).toBe(true);
  });

  it('the same plans with names on do show names, so the check above can fail', () => {
    const named = SEEDS.some((seed) => {
      const input = generated(seed);
      return planReminders({ ...input, prefs: { ...input.prefs, namesOnLockScreen: true } }).some((n) => NAMES.some((m) => n.title.includes(m) || n.body.includes(m)));
    });
    expect(named).toBe(true);
  });
});

describe('[NS-48-R9] the catalogue honours the lock-screen rules', () => {
  it('a typed family or faith day: the title is the neutral one in every switch state and never holds the words', () => {
    for (const seed of SEEDS) {
      for (const names of [false, true]) {
        for (const dayNames of [false, true]) {
          const input = generated(seed);
          const plan = planReminders({ ...input, prefs: { ...input.prefs, namesOnLockScreen: names }, dayNamesOn: dayNames });
          for (const n of plan.filter((p) => p.kind === 'typedDay')) {
            expect(n.title, `seed ${seed}`).toBe(FIXED.title);
            // The words, unchanged, only with both switches on (NS-18-R3, CPrivO-58); otherwise the fixed line.
            const typed = input.typedDays!.find((t) => t.date === n.date)!;
            expect(n.body, `seed ${seed} ${n.date}`).toBe(names && dayNames ? typed.words : FIXED.body);
            for (const w of DAY_WORDS) expect(n.id).not.toContain(w);
          }
        }
      }
    }
  });

  it('the catalogue never overrides them: a selector that returns an unknown key or another real key changes no typed, month or birthday note', () => {
    const plain = (seed: number) => planReminders(generated(seed));
    const odd = (seed: number) => planReminders(generated(seed, { select: () => 'not-a-key' }));
    const other = (seed: number) => planReminders(generated(seed, { select: () => 'floor.5' }));
    const keep = (p: PlannedNotification[]) => p.filter((n) => n.kind !== 'evening').map((n) => `${n.id}|${n.title}|${n.body}`);
    const evenings = (p: PlannedNotification[]) => JSON.stringify(p.filter((n) => n.kind === 'evening'));
    let eveningsMoved = false;
    for (const seed of SEEDS) {
      const base = plain(seed);
      const changed = other(seed);
      expect(keep(odd(seed)), `seed ${seed}`).toEqual(keep(base));
      expect(keep(changed), `seed ${seed}`).toEqual(keep(base));
      // A real, different key does reach the evenings, so the selector is live in these plans.
      if (evenings(changed) !== evenings(base)) eveningsMoved = true;
    }
    expect(eveningsMoved).toBe(true);
  });

  it('no neutral line holds a day name or a faith word', () => {
    const neutral = JSON.stringify(reminderCopy.neutral);
    for (const w of ['Diwali', 'Eid', 'Christmas', 'Easter', 'Hanukkah', 'Ramadan', 'Passover', 'Rakhi', 'Shabbat', 'holiday', 'festival', 'faith', 'prayer']) {
      expect(neutral.toLowerCase()).not.toContain(w.toLowerCase());
    }
  });
});

describe('[FR-NTC-09] a family or faith day stays neutral on the lock screen unless the day-name switch allows it', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-2222-7000-8000-${String(++seq).padStart(12, '0')}`;
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

  it('the words show only with day names on, names on and App lock off, in all eight switch combinations', () => {
    const LA = 'America/Los_Angeles';
    const now = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, LA);
    const seen: Record<string, string> = {};
    for (const day of ['off', 'on']) {
      for (const lock of ['off', 'on']) {
        for (const names of ['off', 'on']) {
          store.setSetting('notifications.dayNames', day);
          store.setSetting(APP_LOCK_KEYS.enabled, lock);
          store.setSetting('notifications.lockScreenNames', names);
          const plan = planReminders({
            now,
            timeZone: LA,
            prefs: { ...readPrefs(), enabled: true },
            children: [],
            lastSaveAt: null,
            lastForegroundAt: null,
            typedDays: [{ date: '2026-10-07', words: 'Diwali with Nani' }],
            dayNamesOn: dayNamesOn(),
          });
          const t = plan.find((n) => n.kind === 'typedDay')!;
          expect(t.title).toBe(FIXED.title);
          seen[`day ${day}/lock ${lock}/names ${names}`] = t.body;
        }
      }
    }
    expect(Object.keys(seen)).toHaveLength(8);
    expect(Object.entries(seen).filter(([, body]) => body !== FIXED.body)).toEqual([['day on/lock off/names on', 'Diwali with Nani']]);
  });
});

describe('[FR-NTC-11] App lock keeps names off whatever the names switch says', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-4444-7000-8000-${String(++seq).padStart(12, '0')}`;
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

  it('names on and App lock on: the planner is handed names off, and no note names a child; App lock off brings them back', () => {
    const LA = 'America/Los_Angeles';
    const now = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, LA);
    store.setSetting('notifications.lockScreenNames', 'on');
    const plan = () =>
      planReminders({
        now,
        timeZone: LA,
        prefs: { ...readPrefs(), enabled: true, cadence: 'everyEvening' },
        children: [{ id: 'child-avi', name: 'Avi', birthday: '2025-10-20', included: true }],
        lastSaveAt: null,
        lastForegroundAt: null,
        monthHorizonDays: 120,
      });
    expect(plan().some((n) => n.title.includes('Avi') || n.body.includes('Avi'))).toBe(true);
    store.setSetting(APP_LOCK_KEYS.enabled, 'on');
    expect(readPrefs().namesOnLockScreen).toBe(false);
    expect(plan().length).toBeGreaterThan(0);
    for (const n of plan()) expect(`${n.title} ${n.body}`, n.id).not.toContain('Avi');
    expect(store.getSetting('notifications.lockScreenNames')).toBe('on');
  });
});

describe('[NS-48-R21] a quiet book adds nothing to a key', () => {
  let close: () => void = () => {};
  let raw: import('../src/lib/db/sql').SqlDb;
  let seq = 0;
  const ME = 'user-asha-mama';
  const newId = () => `0199a5b0-3333-7000-8000-${String(++seq).padStart(12, '0')}`;
  const eid = (i: number) => `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;
  const put = (i: number, childId: string, over: Parameters<typeof letter>[0]) =>
    entries.upsert({ db: raw, now: () => '2026-10-05T19:00:00.000Z', newId }, letter({ id: eid(i), childId, authorId: ME, ...over }), { childId, authorSignsAs: 'Mama' });

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    raw = h.db;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-05T19:00:00.000Z', newId }).ok).toBe(true);
    store.setSetting(SYNC_SETTING.owner, ME);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  function books() {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    const avi = store.addChild({ name: 'Avi', birthday: '2025-10-20', dueDate: null, signsAs: 'Mama' });
    put(1, asha.id, { capturedAt: '2026-09-01T08:00:00.000Z', captureMode: 'typed' });
    put(2, avi.id, { capturedAt: '2026-10-04T08:00:00.000Z', captureMode: 'spoken' });
    return { asha, avi };
  }

  it('a quieted book: its newer letter gives the key layers neither its date nor its kind', () => {
    const { avi } = books();
    expect(lastMadeLetter()).toEqual({ at: Date.parse('2026-10-04T08:00:00.000Z'), kind: 'spoke' });
    store.setChildQuiet(avi.id, true);
    expect(lastMadeLetter()).toEqual({ at: Date.parse('2026-09-01T08:00:00.000Z'), kind: 'typed' });
  });

  it('a book with "Include in my reminders" off: the same', () => {
    const { avi } = books();
    store.updateChild(avi.id, { remindersOn: false });
    expect(lastMadeLetter()).toEqual({ at: Date.parse('2026-09-01T08:00:00.000Z'), kind: 'typed' });
  });

  it('[T2-068] a hidden book: the same, and it is no planner child, so it adds no name, band or kind', () => {
    const { avi } = books();
    expect(plannerChildren().map((c) => c.name)).toEqual(['Asha', 'Avi']);
    store.hideChild(avi.id);
    expect(lastMadeLetter()).toEqual({ at: Date.parse('2026-09-01T08:00:00.000Z'), kind: 'typed' });
    expect(plannerChildren().map((c) => c.name)).toEqual(['Asha']);
  });

  it('every book quiet: the layers get nothing and the floor runs', () => {
    const { asha, avi } = books();
    store.setChildQuiet(asha.id, true);
    store.setChildQuiet(avi.id, true);
    expect(lastMadeLetter()).toBeNull();
  });

  it('in the pure planner, a quiet or excluded book changes no key input (400 seeded plans)', () => {
    for (const seed of SEEDS) {
      const run = (extra: PlannerChild[]) => {
        const asked: KeyInput[] = [];
        const input = generated(seed);
        planReminders({ ...input, children: [...input.children, ...extra], select: (k) => (asked.push(k), selectNotificationKey(k)) });
        return asked;
      };
      const quiet: PlannerChild = { id: 'child-quiet', name: 'Kiran', birthday: '2025-01-01', included: true, quiet: true };
      const out: PlannerChild = { id: 'child-out', name: 'Neel', birthday: '2025-01-01', included: false };
      const awake = generated(seed).children.filter((c) => !c.quiet);
      // Only a list with an awake book: with none, "every book quiet" (NS-13-R12) decides the evenings, not the keys.
      if (awake.length === 0) continue;
      const before = run([]);
      expect(run([quiet]), `seed ${seed}`).toEqual(before);
      expect(run([out]), `seed ${seed}`).toEqual(before);
    }
  });
});

// BL-1323. The checks below read the words a parent would see, so they run on the planner's output, not on templates.
const evenings = (input: PlanInput) => planReminders(input).filter((n) => n.kind === 'evening');
const words = (n: PlannedNotification) => `${n.title} ${n.body}`;
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A content template as a pattern: its blanks take a name of the fixture family or a weekday, nothing else. */
const asPattern = (t: string) =>
  new RegExp(`^${escape(t).replace(/\\\{child\\\}/g, `(?:${NAMES.join('|')})`).replace(/\\\{weekday\\\}/g, `(?:${reminderCopy.weekdays.join('|')})`)}$`);

describe('[FR-NTC-01] every key the planner is given exists in content, named and neutral', () => {
  it('the floor keys and the built variants are one to one, and every planned evening carries its key words (400 seeded plans)', () => {
    expect(FLOOR_KEYS.length).toBe(en.notifications.evening.length);
    expect(FLOOR_KEYS.length).toBe(reminderCopy.neutral.evening.length);
    let seen = 0;
    for (const seed of SEEDS) {
      for (const n of evenings(generated(seed))) {
        const i = floorIndexOfKey(n.key ?? '');
        expect(i, `seed ${seed} ${n.id}`).not.toBeNull();
        const v = [en.notifications.evening[i!], reminderCopy.neutral.evening[i!]];
        expect(v.some((t) => asPattern(t.title).test(n.title) && asPattern(t.body).test(n.body)), `seed ${seed} ${words(n)}`).toBe(true);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(1000);
  });
});

describe('[FR-NTC-02] the catalogue on or off plans the same (id, date, time, class) set (400 seeded plans)', () => {
  // Floor keys in another order, none evening-worded, so the planner honours them and the words really change.
  const ON = layeredSelector({
    recency: { r1: [{ key: 'floor.5', evening: false }], r2: [{ key: 'floor.2', evening: false }], r3: [{ key: 'floor.7', evening: false }], r4: [{ key: 'floor.4', evening: false }] },
    kind: { spoke: [{ key: 'floor.0', evening: false }], typed: [{ key: 'floor.5', evening: false }] },
  });
  const shape = (l: PlannedNotification[]) => l.map((n) => `${n.id}|${n.kind}|${n.date}|${n.hour}:${n.minute}|${n.fireAt}`);

  it('only the key and the words differ, whatever the zone, cadence, books, anchor and last letter', () => {
    let changed = 0;
    for (const seed of SEEDS) {
      const off = planReminders(generated(seed));
      const on = planReminders({ ...generated(seed), select: ON });
      expect(shape(on), `seed ${seed}`).toEqual(shape(off));
      if (on.some((n, i) => n.key !== off[i].key)) changed++;
    }
    expect(changed).toBeGreaterThan(30); // the catalogue was really on in many plans
  });
});

describe('[FR-NTC-03] a plan reads no clock: every input is the one the plan was given', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('the same input planned under two very different system clocks gives the same notes, keys and words (100 seeded plans)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 0, 1, 3));
    const early = SEEDS.slice(0, 100).map((s) => planReminders(generated(s)));
    vi.setSystemTime(Date.UTC(2031, 6, 15, 22));
    expect(SEEDS.slice(0, 100).map((s) => planReminders(generated(s)))).toEqual(early);
  });
});

describe('[FR-NTC-04] every note from day 1 to day 35 is a question or an invitation and never names the gap', () => {
  const GAP = /\b(in a row|missed|miss(?:es|ing)?|since|streaks?|away|while|lately|been|gone|absent|quiet)\b/i;
  const COUNT = /\d|\b(?:one|two|three|four|five|six|seven|week|weeks|days|nights)\s+(?:days?|nights?|weeks?|letters?|ago)\b/i;
  const COMPARE_OR_JUDGE = /\b(than|again|still|yet|back|longer|more|less|good job|well done|great|proud|should|behind|finally)\b/i;
  const ASKS = (n: PlannedNotification) => /\?/.test(words(n)) || /^(Say|Tell|Talk)\b/.test(n.title);

  it('r1 to r4 words ask or invite, with no gap, count, comparison or judgement (400 seeded plans)', () => {
    const bands = new Set<string>();
    for (const seed of SEEDS) {
      // As generated, and with a letter made today so the next days are r1 and r2.
      for (const input of [generated(seed), generated(seed, { lastLetter: { at: generated(seed).now, kind: 'spoke' } })]) {
        if (!input.lastLetter) continue;
        const last = dayNumber(zonedParts(input.lastLetter.at, input.timeZone));
        for (const n of evenings(input)) {
          const band = recencyBand(dayNumber(parseIsoDate(n.date)!), last);
          if (!band) continue;
          bands.add(band);
          const text = words(n);
          expect(ASKS(n), `seed ${seed} ${band} ${text}`).toBe(true);
          for (const re of [GAP, COUNT, COMPARE_OR_JUDGE]) expect(text, `seed ${seed} ${band}`).not.toMatch(re);
        }
      }
    }
    expect([...bands].sort()).toEqual(['r1', 'r2', 'r3', 'r4']);
  });

  it('with the shipped (empty) catalogue the words cannot grow with the gap: the same slot reads the same at any recency', () => {
    let compared = 0;
    for (const seed of SEEDS.slice(0, 100)) {
      const input = generated(seed, { lastLetter: null });
      const fresh = evenings({ ...input, lastLetter: { at: input.now, kind: 'spoke' } });
      const old = evenings({ ...input, lastLetter: { at: input.now - 30 * DAY, kind: 'typed' } });
      const byId = new Map(old.map((n) => [n.id, words(n)]));
      for (const n of fresh) {
        if (!byId.has(n.id)) continue;
        expect(byId.get(n.id), `seed ${seed} ${n.id}`).toBe(words(n));
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(200);
  });
});

describe('[FR-NTC-10] every planned variant fits the lock screen and the house text rules, named and neutral', () => {
  const MARKS = /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026!]|\p{Extended_Pictographic}/u;
  const DAY_COUNT = /(?:\b\d+|\{\w+\}|\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|thirty))\s+(?:days?|nights?)\b/i;
  const GAP = /\b(in a row|missed|miss(?:es|ing)? (?:a|one|any)|since (?:your|the) last|streaks?|(?:days?|nights?|weeks?) since|(?:days?|nights?) (?:off|away))\b/i;
  const DAILY = /\b(daily|nightly|every (?:single )?(?:day|night)|each (?:day|night)|(?:once|twice|one|words?|minutes?|letters?|notes?|nudges?|reminders?) (?:a|per) (?:day|night))\b/i;
  const MACHINE = /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing)|rewrit\w*)\b/i;

  it('title at most 40, body at most 110, and none of the banned marks or words (400 seeded plans, both renderings)', () => {
    const rendered = new Set<boolean>();
    for (const seed of SEEDS) {
      for (const names of [false, true]) {
        const input = generated(seed);
        for (const n of evenings({ ...input, prefs: { ...input.prefs, namesOnLockScreen: names } })) {
          rendered.add(NAMES.some((name) => words(n).includes(name)));
          expect(n.title.length, `seed ${seed} ${n.title}`).toBeLessThanOrEqual(40);
          expect(n.body.length, `seed ${seed} ${n.body}`).toBeLessThanOrEqual(110);
          for (const re of [MARKS, DAY_COUNT, GAP, DAILY, MACHINE]) expect(words(n), `seed ${seed}`).not.toMatch(re);
        }
      }
    }
    expect([...rendered].sort()).toEqual([false, true]); // named and neutral were both checked
  });
});

describe('[FR-NTC-05] the last letter gives the words its kind and date only, never its text', () => {
  let close: () => void = () => {};
  let raw: import('../src/lib/db/sql').SqlDb;
  let seq = 0;
  const ME = 'user-asha-mama';
  const newId = () => `0199a5b0-5555-7000-8000-${String(++seq).padStart(12, '0')}`;
  const eid = (i: number) => `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    raw = h.db;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-05T19:00:00.000Z', newId }).ok).toBe(true);
    store.setSetting(SYNC_SETTING.owner, ME);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('two letters that differ only in their words give the same last letter, and it holds none of them', () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    const said = [
      ['um Asha splashed in the puddle by the gate', 'Asha splashed in the puddle by the gate.'],
      ['the swing went so high and Asha sang a long long song about the moon', 'The swing went so high, and Asha sang a long song about the moon.'],
    ];
    const seen = said.map(([rawTranscript, finalText], i) => {
      const over = { id: eid(0x51 + i), childId: asha.id, authorId: ME, capturedAt: '2026-10-04T08:00:00.000Z', captureMode: 'spoken' as const, rawTranscript, finalText };
      entries.upsert({ db: raw, now: () => '2026-10-05T19:00:00.000Z', newId }, letter(over), { childId: asha.id, authorSignsAs: 'Mama' });
      return lastMadeLetter();
    });
    expect(seen[0]).toEqual({ at: Date.parse('2026-10-04T08:00:00.000Z'), kind: 'spoke' });
    expect(seen[1]).toEqual(seen[0]);
    for (const word of ['puddle', 'gate', 'swing', 'moon']) expect(JSON.stringify(seen)).not.toContain(word);
  });
});
