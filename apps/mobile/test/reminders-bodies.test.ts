/**
 * Every notification body is a content key's words (NS-32-R11; P0, the machine never adds words).
 * A planned body must equal one of the templates in packages/content, with only the named blanks filled in. Fixtures:
 * the fictional family "Asha".
 */
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { reminderCopy } from '../src/lib/reminders/copy';
import { reminderContent } from '../src/lib/reminders/payload';
import { DEFAULT_PREFS, planReminders, type PlannedNotification, type PlannerChild, type ReminderPrefs } from '../src/lib/reminders/planner';
import { zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const dev: PlannerChild = { id: 'child-dev', name: 'Dev', birthday: '2025-09-08', included: true };
const nina: PlannerChild = { id: 'child-nina', name: 'Nina', birthday: '2025-09-20', included: true };
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Every body the product may send, as the content words with each {blank} left open. */
const TEMPLATES: string[] = [
  ...en.notifications.evening.map((v) => v.body),
  en.notifications.monthOpen.body,
  en.notifications.birthday.body,
  ...reminderCopy.neutral.evening.map((v) => v.body),
  reminderCopy.neutral.lockBody,
  reminderCopy.neutral.monthOpen.body,
  reminderCopy.neutral.birthday.body,
  reminderCopy.neutral.birthdays.body,
  reminderCopy.together.monthBodyNames,
  reminderCopy.together.monthBodyNeutral,
];
const PATTERNS = TEMPLATES.map((t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\w+\\\}/g, '.+')}$`));
/** The same, for the title, so a title cannot be built in the planner either. */
const TITLES: string[] = [
  ...en.notifications.evening.map((v) => v.title),
  en.notifications.monthOpen.title,
  en.notifications.birthday.title,
  ...reminderCopy.neutral.evening.map((v) => v.title),
  reminderCopy.neutral.monthOpen.title,
  reminderCopy.together.monthTitle,
];
const TITLE_PATTERNS = TITLES.map((t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\w+\\\}/g, '.+')}$`));

function sweep(): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const kids: PlannerChild[][] = [[asha], [dev], [asha, dev], [dev, nina]];
  for (const names of [false, true]) {
    for (const children of kids) {
      for (const cadence of ['everyEvening', 'weekly'] as const) {
        const prefs: ReminderPrefs = { ...DEFAULT_PREFS, enabled: true, cadence, namesOnLockScreen: names };
        out.push(
          ...planReminders({
            now: zonedToEpoch({ y: 2027, m: 3, d: 1, hh: 12, mm: 0 }, LA),
            timeZone: LA,
            prefs,
            children,
            horizonDays: 21,
            monthHorizonDays: 400,
            anchorAt: null,
            lastSaveAt: null,
            lastForegroundAt: null,
          }),
        );
      }
    }
  }
  return out;
}

describe('[NS-32-R11] bodies from content keys', () => {
  const plan = sweep();
  it('the sweep reaches every kind of note, so the check below is not empty', () => {
    expect(new Set(plan.map((n) => n.kind))).toEqual(new Set(['evening', 'monthAge', 'birthday']));
    expect(plan.length).toBeGreaterThan(100);
    expect(plan.some((n) => /Asha|Dev|Nina/.test(n.body + n.title))).toBe(true); // names on reaches the words
  });
  it('every planned body is a content body with only its blanks filled', () => {
    const stray = plan.filter((n) => !PATTERNS.some((p) => p.test(n.body)));
    expect(stray.map((n) => `${n.kind}: ${n.body}`)).toEqual([]);
  });
  it('every planned title is a content title with only its blanks filled', () => {
    const stray = plan.filter((n) => !TITLE_PATTERNS.some((p) => p.test(n.title)));
    expect(stray.map((n) => `${n.kind}: ${n.title}`)).toEqual([]);
  });
  it('the scheduled content carries the planned body and title untouched', () => {
    for (const n of plan.slice(0, 40)) {
      const c = reminderContent(n);
      expect(c.body).toBe(n.body);
      expect(c.title).toBe(n.title);
      expect(own(c.data, 'body')).toBe(false);
    }
  });
  it('the checker itself refuses words that are not in content', () => {
    expect(PATTERNS.some((p) => p.test('Time to write about Asha tonight.'))).toBe(false);
    expect(PATTERNS.some((p) => p.test(en.notifications.evening[0].body.replace('{child}', 'Asha')))).toBe(true);
  });
});
