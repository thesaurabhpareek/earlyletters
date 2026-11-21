/**
 * The payments half of BL-966 (CR-69 A1; NS-32-R4b; NS-13-R23): the evening scheduler passes the REAL count of pending
 * plan notices (`plan.` ids) to the planner, so the pending total stays at 60 or fewer and a plan notice is never
 * dropped for a memory reminder. The real scheduler runs against a fake phone (what iOS holds); the real planner runs
 * too, wrapped only to read what it was given and to widen its horizons so the 60 limit is reached. Fictional family:
 * Asha. No content is read or logged here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Pending = { identifier: string; content: { data?: unknown } };
const phone = vi.hoisted(() => ({ pending: new Map<string, Pending>(), seen: [] as Array<number | undefined> }));

vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('expo-router', () => ({ router: { navigate: () => {} } }));
vi.mock('expo-notifications', () => {
  const perm = () => ({ granted: true, status: 'granted', canAskAgain: true, ios: { status: 2, alertStyle: 1 } });
  return {
    IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
    getPermissionsAsync: async () => perm(),
    getAllScheduledNotificationsAsync: async () => [...phone.pending.values()].map((p) => ({ ...p })),
    cancelScheduledNotificationAsync: async (id: string) => void phone.pending.delete(id),
    scheduleNotificationAsync: async (r: Pending) => {
      phone.pending.set(r.identifier, { identifier: r.identifier, content: r.content });
      return r.identifier;
    },
  };
});
vi.mock('../src/lib/store', () => ({ subscribe: () => () => {} }));
vi.mock('../src/lib/reminders/prefs', async () => {
  const { DEFAULT_PREFS } = await import('../src/lib/reminders/planner');
  const kids = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, name: i === 0 ? 'Asha' : `Child${i}`, birthday: `2026-0${(i % 6) + 1}-1${i}`, included: true }));
  return {
    readPrefs: () => ({ ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' }),
    plannerChildren: () => kids,
    lastOwnSaveAt: () => null,
    anchorAt: () => null,
    readOnSince: () => 0,
    writeOnSince: () => {},
    writePrefs: () => {},
  };
});
vi.mock('../src/lib/reminders/planner', async (orig) => {
  const real = await orig<typeof import('../src/lib/reminders/planner')>();
  return {
    ...real,
    // Wide horizons so a full book reaches the 60 limit; everything else is the real planner.
    planReminders: (input: Parameters<typeof real.planReminders>[0]) => {
      phone.seen.push(input.planPending);
      return real.planReminders({ ...input, horizonDays: 60, monthHorizonDays: 365 });
    },
  };
});

const { rescheduleReminders } = await import('../src/lib/reminders/scheduler');
const NOW = Date.parse('2026-12-01T12:00:00.000Z');

function addPlanNotices(n: number) {
  for (let i = 0; i < n; i++) {
    const identifier = `plan.trialWeek.2027-01-0${i + 1}`;
    phone.pending.set(identifier, { identifier, content: { data: { source: 'scribe.plan', kind: 'trialWeek' } } });
  }
}
const planIds = () => [...phone.pending.keys()].filter((k) => k.startsWith('plan.'));
const memoryCount = () => phone.pending.size - planIds().length;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  phone.pending.clear();
  phone.seen.length = 0;
});
afterEach(() => vi.useRealTimers());

describe('[BL-966-PP1] the planner gets the real pending plan-notice count', () => {
  it.each([0, 1, 3, 4])('passes the count %i', async (n) => {
    addPlanNotices(n);
    await rescheduleReminders();
    expect(phone.seen.at(-1)).toBe(n);
  });
});

describe('[BL-966-PP2] the total never passes 60', () => {
  it.each([0, 1, 2, 3, 4])('with %i plan notices, plan plus memory is at most 60 and the budget fills', async (n) => {
    addPlanNotices(n);
    await rescheduleReminders();
    expect(phone.pending.size).toBeLessThanOrEqual(60);
    expect(memoryCount()).toBe(60 - n);
  });
});

describe('[BL-966-PP3] a plan notice is never dropped for a memory reminder', () => {
  it('keeps every plan notice through a re-plan, and gives memory slots up when one is added', async () => {
    await rescheduleReminders();
    expect(memoryCount()).toBe(60);
    addPlanNotices(4);
    await rescheduleReminders();
    expect(planIds()).toHaveLength(4);
    expect(memoryCount()).toBe(56);
    expect(phone.pending.size).toBe(60);
  });
  it('gives the slots back when a plan notice is cancelled', async () => {
    addPlanNotices(4);
    await rescheduleReminders();
    phone.pending.delete(planIds()[0]);
    await rescheduleReminders();
    expect(planIds()).toHaveLength(3);
    expect(memoryCount()).toBe(57);
  });
});
