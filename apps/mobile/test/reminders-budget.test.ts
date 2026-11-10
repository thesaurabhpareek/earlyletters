/// <reference types="node" />
/**
 * One shared notification budget, and a registry every notification class joins (NX-39 v2 R26, R27, R61; BL-869).
 *
 * Nothing here changes a number. The planner already ships 60 pending notifications of iOS's 64, a quiet window of
 * 21:30 to 07:00, and four plan reminders; this file names those numbers once (lib/reminders/budget.ts), registers
 * every class that uses them, and fails if a class is added that raises the total or reads the library. The founder's
 * weekly cap (NX-39 F6) is not decided: `SHARED_CAP.weeklyCount` is null (no numeric cap; the default stays the
 * cadence the parent chose) until a decision replaces it.
 *
 * Fixtures use the fictional family "Asha".
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { MAX_PLAN_NOTIFICATIONS } from '../src/lib/billing/plan-reminders.logic';
import {
  addNotificationClass,
  IOS_PENDING_LIMIT,
  NOTIFICATION_CLASSES,
  pendingCeiling,
  QUIET_WINDOW,
  SHARED_CAP,
  SHARED_PENDING_CEILING,
  type NotificationClass,
} from '../src/lib/reminders/budget';
import { DEFAULT_PREFS, DEFAULT_WINDOW, EARLIEST_MINUTES, LATEST_MINUTES, planReminders, type PlannerChild } from '../src/lib/reminders/planner';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const REMINDERS_DIR = fileURLToPath(new URL('../src/lib/reminders/', import.meta.url));
const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };

const sources = () =>
  readdirSync(REMINDERS_DIR)
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => ({ file: f, text: readFileSync(join(REMINDERS_DIR, f), 'utf8') }));

/** Every module specifier a source file imports, requires or dynamically imports. */
function specifiers(file: string, text: string): string[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) out.push(n.moduleSpecifier.text);
    if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(n.expression) && n.expression.text === 'require'))) {
      const a = n.arguments[0];
      out.push(a && ts.isStringLiteral(a) ? a.text : '<dynamic>');
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

const MEDIA_MODULE = /media|library|photo|picker|moment|memory|place|geo|asset|occasion-library/i;

describe('[NX-39-R61] one shared cap covers every notification class', () => {
  it('names the numbers the code already uses, and changes none of them', () => {
    expect(IOS_PENDING_LIMIT).toBe(64);
    expect(SHARED_PENDING_CEILING).toBe(60);
    expect(QUIET_WINDOW).toEqual({ startMinutes: 21 * 60 + 30, endMinutes: 7 * 60 });
    // The planner's own constants are the same numbers, not copies that can drift.
    expect(QUIET_WINDOW.endMinutes).toBe(EARLIEST_MINUTES);
    expect(QUIET_WINDOW.startMinutes).toBe(LATEST_MINUTES);
    expect(DEFAULT_WINDOW).toEqual({ earliest: 7 * 60, latest: 21 * 60 + 30 });
    expect(MAX_PLAN_NOTIFICATIONS).toBe(4);
  });

  it('has no numeric weekly cap until the founder decides one (F6): the default is the cadence the parent chose', () => {
    expect(SHARED_CAP.weeklyCount).toBeNull();
    expect(SHARED_CAP.defaultIs).toBe('parent-cadence');
    // Pinned as the code has it today (NX-39 section 6 says `weekly` is the default; the code's default cadence is fewTimes).
    expect(DEFAULT_PREFS.cadence).toBe('fewTimes');
    expect(SHARED_CAP.decidedBy).toBe('NX-39 F6 (founder)');
  });

  it('registers every class the planners produce, with the group that owns its pending slots', () => {
    const ids = NOTIFICATION_CLASSES.map((c) => c.id);
    expect(ids).toEqual(['evening', 'monthAge', 'birthday', 'plan', 'occasion']);
    expect(NOTIFICATION_CLASSES.filter((c) => c.status === 'live').map((c) => c.id)).toEqual(['evening', 'monthAge', 'birthday', 'plan']);
    // The occasion class is registered and not live: P4a is off.
    expect(NOTIFICATION_CLASSES.find((c) => c.id === 'occasion')).toMatchObject({ status: 'planned', group: 'reminders', phase: 'P4a' });
    // The planner's kinds are exactly the live reminders-group classes.
    const now = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, 'America/Los_Angeles');
    const planned = planReminders({
      now,
      timeZone: 'America/Los_Angeles',
      children: [asha],
      prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', monthNotes: true },
      monthHorizonDays: 400,
      horizonDays: 40,
    });
    const kinds = new Set(planned.map((p) => p.kind));
    expect([...kinds].sort()).toEqual(['birthday', 'evening', 'monthAge']);
    const live = NOTIFICATION_CLASSES.filter((c) => c.status === 'live' && c.group === 'reminders').map((c) => c.id as string);
    for (const k of kinds) expect(live, k).toContain(k);
  });

  it('keeps the total at today\'s: 60 for the reminders group plus the plan group, never above iOS\'s 64', () => {
    expect(pendingCeiling(NOTIFICATION_CLASSES, 'reminders')).toBe(60);
    expect(pendingCeiling(NOTIFICATION_CLASSES, 'plan')).toBe(MAX_PLAN_NOTIFICATIONS);
    expect(pendingCeiling(NOTIFICATION_CLASSES)).toBe(64);
    expect(pendingCeiling(NOTIFICATION_CLASSES)).toBeLessThanOrEqual(IOS_PENDING_LIMIT);
  });

  it('the planner never returns more than the shared ceiling, whatever the input', () => {
    const now = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, 'America/Los_Angeles');
    const many: PlannerChild[] = Array.from({ length: 6 }, (_, i) => ({ id: `asha-${i}`, name: 'Asha', birthday: `2025-0${(i % 9) + 1}-1${i}`, included: true }));
    const out = planReminders({
      now,
      timeZone: 'America/Los_Angeles',
      children: many,
      prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', monthNotes: true },
      monthHorizonDays: 900,
      horizonDays: 200,
    });
    expect(out.length).toBe(SHARED_PENDING_CEILING);
  });

  it('adding a class to a group cannot raise the total: it shares that group\'s slots', () => {
    const extra: NotificationClass = { id: 'weekly-note' as never, group: 'reminders', status: 'planned', phase: 'P4a', derivedFromLibrary: false };
    const next = addNotificationClass(NOTIFICATION_CLASSES, extra);
    expect(next.length).toBe(NOTIFICATION_CLASSES.length + 1);
    expect(pendingCeiling(next)).toBe(pendingCeiling(NOTIFICATION_CLASSES));
    expect(pendingCeiling(next, 'reminders')).toBe(SHARED_PENDING_CEILING);
    // A class that names a group nobody owns would bring its own slots and raise the total: refused.
    expect(() => addNotificationClass(NOTIFICATION_CLASSES, { ...extra, group: 'brand-new' as never })).toThrow(/cannot raise the total/);
    // A class registered twice is refused.
    expect(() => addNotificationClass(NOTIFICATION_CLASSES, { ...extra, id: 'evening' as never })).toThrow(/already registered/);
  });

  it('refuses a class that is derived from the library', () => {
    const fromLibrary = { id: 'moment' as never, group: 'reminders', status: 'planned', phase: 'P2b', derivedFromLibrary: true } as unknown as NotificationClass;
    expect(() => addNotificationClass(NOTIFICATION_CLASSES, fromLibrary)).toThrow(/library/);
    expect(NOTIFICATION_CLASSES.every((c) => c.derivedFromLibrary === false)).toBe(true);
  });
});

describe('[NX-39-R27] no notification is derived from the library', () => {
  it('imports no media, library, photo, picker, moment or place module anywhere in lib/reminders', () => {
    const bad = sources().flatMap(({ file, text }) => specifiers(file, text).filter((s) => MEDIA_MODULE.test(s) && !/^\.\/(planner|prefs|scheduler|copy|tz|index|budget)$/.test(s)).map((s) => `${file}: ${s}`));
    expect(bad).toEqual([]);
    expect(sources().some((s) => s.file === 'planner.ts')).toBe(true);
    expect(sources().some((s) => s.file === 'budget.ts')).toBe(true);
  });

  it('positive control: the import check finds media modules however they are written', () => {
    const bad = [
      "import { getAssetsAsync } from 'expo-media-library';",
      "import x from '../memory-library/index';",
      "const m = require('expo-image-picker');",
      "const p = await import('../moments/store');",
      "const dyn = require(name);",
    ].flatMap((t) => specifiers('fixture.ts', t)).filter((s) => MEDIA_MODULE.test(s) || s === '<dynamic>');
    expect(bad).toEqual(['expo-media-library', '../memory-library/index', 'expo-image-picker', '../moments/store', '<dynamic>']);
  });

  it('the planner takes only prefs, children and times: no input field carries a library, place or media value', () => {
    const planner = readFileSync(join(REMINDERS_DIR, 'planner.ts'), 'utf8');
    const sf = ts.createSourceFile('planner.ts', planner, ts.ScriptTarget.Latest, true);
    const keys: string[] = [];
    sf.forEachChild((n) => {
      if (ts.isInterfaceDeclaration(n) && ['PlanInput', 'PlannerChild', 'ReminderPrefs'].includes(n.name.text)) {
        for (const m of n.members) if (m.name && ts.isIdentifier(m.name)) keys.push(m.name.text);
      }
    });
    expect(keys.length).toBeGreaterThan(8);
    expect(keys.filter((k) => /media|library|asset|photo|place|geo|city|moment|occasion|location|taken/i.test(k))).toEqual([]);
  });

  it('what a scheduled notification carries is enums: a source and a kind, from the registry', () => {
    for (const file of ['scheduler.ts']) {
      const text = readFileSync(join(REMINDERS_DIR, file), 'utf8');
      expect(text).toMatch(/data: \{ source: REMINDER_SOURCE, kind: p\.kind \}/);
      expect(text).not.toMatch(/userInfo|attachments|subtitle|threadIdentifier|content-available|contentAvailable/);
    }
  });
});
