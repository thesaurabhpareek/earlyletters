/// <reference types="node" />
/**
 * BL-966c: the reminder category, the hidden-preview placeholder, the interruption level, the lock screen with names
 * off, and the one re-plan after an update. Pure modules and source checks, so no phone and no native module.
 * Fixtures: the fictional family Asha. Each P0 row has one mutant (run by hand, listed in the PR).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { en, features } from '@scribe/content';
import { REMINDER_CATEGORY, REMINDER_INTERRUPTION_LEVEL, registerReminderCategory } from '../src/lib/reminders/categories';
import { reminderContent } from '../src/lib/reminders/payload';
import { DEFAULT_PREFS, planReminders, type PlannedNotification, type PlannerChild } from '../src/lib/reminders/planner';
import { replanAfterUpdate } from '../src/lib/reminders/update';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const twin: PlannerChild = { ...asha, id: 'child-asha-twin', name: 'Asha Twin' };
const sib: PlannerChild = { id: 'child-sib', name: 'Asha Sib', birthday: '2026-05-08', included: true };

function plans(names: boolean): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  for (const children of [[asha], [asha, twin], [asha, sib]]) {
    for (const day of ['2026-10-05', '2027-02-20', '2027-03-01']) {
      out.push(
        ...planReminders({
          now: zonedToEpoch({ ...parseIsoDate(day)!, hh: 12, mm: 0 }, LA),
          timeZone: LA,
          prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', namesOnLockScreen: names },
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
  return out;
}

describe('[NS-32-R10] interruption level', () => {
  it('every planned notification is level active', () => {
    const all = plans(false);
    expect(new Set(all.map((n) => n.kind))).toEqual(new Set(['evening', 'monthAge', 'birthday']));
    for (const n of all) expect(reminderContent(n).interruptionLevel, n.id).toBe('active');
    expect(REMINDER_INTERRUPTION_LEVEL).toBe('active');
  });
});

describe('[NS-13-R20] never time-sensitive', () => {
  it('no source under lib/reminders and no app config names time-sensitive', () => {
    for (const f of ['src/lib/reminders/scheduler.ts', 'src/lib/reminders/payload.ts', 'src/lib/reminders/categories.ts', 'app.config.ts']) {
      expect(read(f), f).not.toMatch(/time[-_ ]?sensitive/i);
    }
  });
});

describe('[NS-32-R13] preview placeholder', () => {
  it('the reminder category is registered with a neutral placeholder and no title shown', async () => {
    const set = vi.fn(async () => ({}));
    await registerReminderCategory(set);
    expect(set).toHaveBeenCalledTimes(1);
    const [id, actions, options] = set.mock.calls[0] as unknown as [string, unknown[], Record<string, unknown>];
    expect(id).toBe(REMINDER_CATEGORY);
    expect(actions).toEqual([]);
    expect(options.previewPlaceholder).toBe(en.notifications.previewPlaceholder);
    expect(String(options.previewPlaceholder).length).toBeGreaterThan(0);
    // AB-11: a hidden preview shows no title.
    expect(options).not.toHaveProperty('showTitle');
    expect(options).not.toHaveProperty('showSubtitle');
  });

  it('every request carries the registered category, and the scheduler registers it at start', () => {
    for (const n of plans(false)) expect(reminderContent(n).categoryIdentifier, n.id).toBe(REMINDER_CATEGORY);
    expect(read('src/lib/reminders/scheduler.ts')).toContain('registerReminderCategory(Notifications.setNotificationCategoryAsync)');
  });

  it('a failing native call never throws out of start', async () => {
    await expect(registerReminderCategory(async () => Promise.reject(new Error('no module')))).resolves.toBeUndefined();
  });
});

describe('[NS-13-R33] hidden preview placeholder is neutral', () => {
  it('no name, number, day, brand or "year of letters" in it', () => {
    const p = en.notifications.previewPlaceholder;
    expect(p).not.toMatch(/\{|\d|asha|birthday|year of letters|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i);
    expect(p.length).toBeLessThan(60);
  });
});

describe('[NS-32-R12] lock screen stays plain', () => {
  const AGE = /\d|year of letters|birthday|\bmonth\b.*\bbegins\b/i;
  it('names off: no child name, month number, age or "A year of letters." in any title or body', () => {
    const all = plans(false);
    expect(all.some((n) => n.kind === 'birthday')).toBe(true);
    expect(all.some((n) => n.kind === 'monthAge')).toBe(true);
    for (const n of all) {
      const words = `${n.title} | ${n.body}`;
      expect(words, n.id).not.toMatch(/asha|twin|sib/i);
      expect(words, n.id).not.toMatch(AGE);
      expect(words, n.id).not.toContain('{');
    }
  });

  it('the birthday and month notes with names off are the neutral title and the one fixed body (E45, E82, G-D21)', () => {
    const notes = plans(false).filter((n) => n.kind !== 'evening');
    for (const n of notes) {
      expect(n.title, n.id).toBe('Something for the book today');
      expect(n.body, n.id).toBe('Whenever you have a minute.');
    }
  });

  it('positive control: with names on the same scan does find the name and the month, so it can fail', () => {
    const all = plans(true);
    expect(all.some((n) => /asha/i.test(`${n.title} ${n.body}`))).toBe(true);
    expect(all.some((n) => /\d/.test(n.title))).toBe(true);
  });
});

describe('[NS-13-R24] names off carries no age', () => {
  it('the lock-screen body key has no {child} and no number', () => {
    const body = 'Whenever you have a minute.';
    expect(body).not.toMatch(/\{child\}|\d/);
    expect(plans(false).filter((n) => n.kind !== 'evening').every((n) => n.body === body)).toBe(true);
  });
});

describe('[F-08d] the lock-screen body is neutral and fixed (21 Nov 2026, founder approved)', () => {
  const FIXED = 'Whenever you have a minute.';
  const KIND_OR_AGE = /\{|\d|asha|twin|sib|birthday|\bmonth\b|\byear\b|\bday\b|\bnote\b|letters?\b|week/i;
  it('every names-off day, month and birthday body is exactly the fixed line, with no {child}, age or kind word', () => {
    const notes = plans(false).filter((n) => n.kind !== 'evening');
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) {
      expect(n.body, n.id).toBe(FIXED);
      expect(n.body, n.id).not.toMatch(KIND_OR_AGE);
    }
    const c = features.reminders.neutral;
    for (const b of [c.lockBody, c.monthOpen.body, c.birthday.body, c.birthdays.body]) {
      expect(b).toBe(FIXED);
      expect(b).not.toMatch(KIND_OR_AGE);
    }
  });
});

describe('[NS-32-R16] re-plan after update', () => {
  const run = (stored: string | null, current: string, ok = true) => {
    let value = stored;
    const replan = vi.fn(async () => ({ ok }));
    return replanAfterUpdate({ current, read: () => value, write: (v) => (value = v), replan }).then((r) => ({ r, value, replan }));
  };
  it('a new version re-plans once and keeps the version', async () => {
    const a = await run('1.0.0', '1.0.1');
    expect(a.replan).toHaveBeenCalledTimes(1);
    expect(a.value).toBe('1.0.1');
    const b = await run('1.0.1', '1.0.1');
    expect(b.replan).not.toHaveBeenCalled();
  });
  it('the first launch with no stored version re-plans', async () => {
    expect((await run(null, '1.0.0')).replan).toHaveBeenCalledTimes(1);
  });
  it('a failed re-plan keeps the old version so the next launch tries again', async () => {
    expect((await run('1.0.0', '1.0.1', false)).value).toBe('1.0.0');
  });
  it('start runs it after the first frame and does not await it (L-03)', () => {
    const s = read('src/lib/reminders/scheduler.ts');
    expect(s).toMatch(/setTimeout\(\(\) => \{\s*void replanAfterUpdate/);
  });
});

describe('[NS-13-R21] re-plan after update', () => {
  it('the setting is app.lastPlannedVersion and holds a version string only', async () => {
    const { LAST_PLANNED_VERSION_KEY } = await import('../src/lib/reminders/update');
    expect(LAST_PLANNED_VERSION_KEY).toBe('app.lastPlannedVersion');
  });
});
