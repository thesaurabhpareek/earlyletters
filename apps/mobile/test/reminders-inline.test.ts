/// <reference types="node" />
/**
 * Settings, Reminders without the sheet (reminders-settings.md as ruled: CDesO-3 no pre-sheet, CCO-10 the
 * explanation shows before the switch, LEGAL-REQ-007). Through lib/reminders' public API and the real store, with
 * expo-notifications stubbed so each permission state can be played; the page's rules are pure
 * (components/settings/reminders.logic.ts) and run here; the screen's use of them is pinned in its source.
 * Fixtures: the fictional family Asha.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en, reminderCopy } from '@scribe/content';
import { nodeDb } from './helpers/node-db';

const os = vi.hoisted(() => ({
  status: 'undetermined' as 'undetermined' | 'granted' | 'denied',
  iosStatus: 0,
  canAskAgain: true,
  answer: 'granted' as 'granted' | 'denied',
  enabledWhenAsked: null as boolean | null,
  readEnabled: (() => null) as () => boolean | null,
  asked: 0,
  failSchedule: false,
  scheduled: [] as string[],
  lockScreen: null as boolean | null,
  alertStyle: 1,
}));

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('expo-router', () => ({ router: { navigate: () => {} } }));
vi.mock('expo-notifications', () => {
  const perm = () => ({
    granted: os.status === 'granted',
    status: os.status,
    canAskAgain: os.canAskAgain,
    ios: { status: os.iosStatus, allowsDisplayOnLockScreen: os.lockScreen, alertStyle: os.alertStyle },
  });
  return {
    IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
    IosAlertStyle: { NONE: 0, BANNER: 1, ALERT: 2 },
    SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
    AndroidImportance: { DEFAULT: 3 },
    getPermissionsAsync: async () => perm(),
    requestPermissionsAsync: async () => {
      os.asked++;
      os.enabledWhenAsked = os.readEnabled();
      os.status = os.answer;
      os.iosStatus = os.answer === 'granted' ? 2 : 1;
      return perm();
    },
    getAllScheduledNotificationsAsync: async () => [],
    cancelScheduledNotificationAsync: async () => {},
    scheduleNotificationAsync: async (r: { identifier: string }) => {
      if (os.failSchedule) throw new Error('iOS said no');
      os.scheduled.push(r.identifier);
      return r.identifier;
    },
    setNotificationChannelAsync: async () => {},
    setNotificationHandler: () => {},
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
});

const store = await import('../src/lib/store');
const reminders = await import('../src/lib/reminders');
const logic = await import('../src/components/settings/reminders.logic');

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const s = reminderCopy.settings;
const fmt = (t: { hour: number; minute: number }) => reminders.formatReminderTime(t, 'en-US');

describe('[CDesO-3, CCO-10] Settings, Reminders: the switch goes straight to the iOS alert, explained first', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
    Object.assign(os, { status: 'undetermined', iosStatus: 0, canAskAgain: true, answer: 'granted', enabledWhenAsked: null, asked: 0, failSchedule: false, scheduled: [], lockScreen: null, alertStyle: 1 });
    os.readEnabled = () => reminders.readPrefs().enabled;
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    // Sunday 18 Oct 2026, 12:05 in UTC: the next Tuesday is the 20th.
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-18T12:05:00.000Z', newId }).ok).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
  });
  afterEach(async () => {
    os.failSchedule = false;
    await reminders.rescheduleReminders();
    store.closeStore();
    close();
  });

  it('LEGAL-REQ-007 / CCO-10: the explanation is the footer while the switch is off, on screen before any tap', () => {
    const off = logic.switchFooter(false);
    expect(off).toContain(reminderCopy.priming.quietLine);
    expect(off).toContain(reminderCopy.priming.privacyLine);
    expect(logic.switchFooter(true)).toBe('Changes save as you go.');
    const screen = code('app/settings/reminders.tsx');
    // The footer sits on the switch's own section and is drawn whatever iOS has said, so it is read before the tap.
    expect(screen).toMatch(/<ListSection footer=\{switchFooter\(on\)\}>\s*<ToggleRow title=\{s\.enabledLabel\} value=\{on\}/);
    // And it comes before the switch in the reading order the page has: nothing else is above it.
    expect(screen.indexOf('switchFooter(on)')).toBeLessThan(screen.indexOf('<ToggleRow title={s.enabledLabel}'));
  });

  it('no sheet in front of the alert anywhere: the priming sheet and its "A few evenings a week" title are gone', () => {
    expect(existsSync(join(SRC, 'lib/reminders/priming-sheet.tsx'))).toBe(false);
    const screen = code('app/settings/reminders.tsx');
    expect(screen).not.toMatch(/ReminderPrimingSheet|needsPriming|reminder_prime_shown|setPriming/);
    expect(screen).toMatch(/await turnOnReminders\(\)/);
    expect((en.onboarding.reminder as Record<string, unknown>).permissionTitle).toBeUndefined();
    expect('needsPriming' in reminders).toBe(false);
    // The card after the first letter is the one in-context ask, and shares the same door.
    const card = code('components/asks/reminder-prime-ask.tsx');
    expect(card).toMatch(/turnOnReminders\(\)/);
    expect(card).not.toMatch(/enableReminders/);
  });

  it('turning on writes `enabled` before iOS asks, so the switch never flips back behind the alert', async () => {
    const res = await reminders.turnOnReminders();
    expect(os.asked).toBe(1);
    expect(os.enabledWhenAsked).toBe(true);
    expect(res).toMatchObject({ permission: 'granted', asked: true, scheduled: { ok: true } });
    expect(os.scheduled.length).toBeGreaterThan(0);
  });

  it('denied now: the switch stays on (intent kept), Next reads "Not sending yet.", and iOS is never asked again', async () => {
    os.answer = 'denied';
    const first = await reminders.turnOnReminders();
    expect(first).toMatchObject({ permission: 'denied', asked: true });
    expect(logic.remindersSwitchOn(reminders.readPrefs())).toBe(true);
    expect(logic.showNotificationsOff(reminders.readPrefs(), 'denied')).toBe(true);
    expect(logic.nextLine({ on: true, permission: 'denied', next: reminders.nextReminder(), formatTime: fmt })).toBe('Not sending yet.');
    // Denied before: off, then on again. No alert; the same card.
    await reminders.disableReminders();
    os.canAskAgain = false;
    const again = await reminders.turnOnReminders();
    expect(again).toMatchObject({ permission: 'denied', asked: false });
    expect(os.asked).toBe(1);
    expect(logic.turnOnOutcome(again, null)).toEqual({ message: 'Notifications are off', action: 'openSettings' });
  });

  it('the Next line and the preview come from the planner: real neutral words, recomputed on every change', async () => {
    await reminders.turnOnReminders();
    const next = reminders.nextReminder()!;
    expect(next).not.toBeNull();
    const line = logic.nextLine({ on: true, permission: 'granted', next, formatTime: fmt })!;
    expect(line).toMatch(/^Next: (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) at \d{1,2}:\d{2} (AM|PM)\.$/);
    expect(reminderCopy.weekdays[logic.weekdayOfIso(next.date)]).toBe(line.slice(6, line.indexOf(' at ')));
    // Neutral by default (D-025): no name in the preview.
    const preview = logic.previewOf(next)!;
    expect(`${preview.title} ${preview.body}`).not.toContain('Asha');
    expect([...reminderCopy.neutral.evening.map((v) => v.title), reminderCopy.neutral.monthOpen.title.replace('{month}', String(next.month ?? ''))]).toContain(preview.title);
    // A change moves the line: every evening at 7:00 PM.
    reminders.writePrefs({ cadence: 'everyEvening', time: { hour: 19, minute: 0 } });
    const moved = reminders.nextReminder()!;
    expect(moved.hour).toBe(next.kind === 'birthday' ? 9 : 19);
    expect(logic.savedAnnouncement(logic.nextLine({ on: true, permission: 'granted', next: moved, formatTime: fmt }))).toMatch(/^Saved\. Next: \w+ at 7:00 PM\.$/);
    expect(logic.SAVED_ANNOUNCE_MS).toBe(600);
    // Off: no line at all.
    expect(logic.nextLine({ on: false, permission: 'granted', next: moved, formatTime: fmt })).toBeNull();
  });

  it('a scheduling failure is returned and kept, not swallowed (scheduler.ts rescheduleReminders), and Try again clears it', async () => {
    reminders.writePrefs({ enabled: true });
    os.status = 'granted';
    os.iosStatus = 2;
    const seen: boolean[] = [];
    const stop = reminders.subscribeScheduleResult((r) => seen.push(r.ok));
    os.failSchedule = true;
    reminders.writePrefs({ time: { hour: 19, minute: 30 } });
    const failed = await reminders.rescheduleReminders();
    expect(failed).toEqual({ ok: false });
    expect(reminders.lastScheduleResult()).toEqual({ ok: false });
    expect(logic.turnOnOutcome({ permission: 'granted', scheduled: failed }, null)).toEqual({ message: 'Could not set reminders just now.', action: 'tryAgain' });
    os.failSchedule = false;
    // The signature was not recorded on failure, so the same plan is tried in full again.
    expect(await reminders.rescheduleReminders()).toEqual({ ok: true });
    expect(os.scheduled.length).toBeGreaterThan(0);
    expect(seen).toEqual([false, true]);
    stop();
    expect(code('app/settings/reminders.tsx')).toMatch(/\{s\.scheduleFailed\}[\s\S]*?label=\{copy\.common\.tryAgainButton\} onPress=\{\(\) => void tryAgain\(\)\}/);
  });

  it('Provisional and Deliver Quietly count as allowed, with the quiet note', async () => {
    os.status = 'undetermined';
    os.iosStatus = 3;
    expect(await reminders.getReminderPermissionDetail()).toEqual({ permission: 'granted', quiet: true });
    Object.assign(os, { status: 'granted', iosStatus: 2, lockScreen: false, alertStyle: 0 });
    expect(await reminders.getReminderPermissionDetail()).toEqual({ permission: 'granted', quiet: true });
    Object.assign(os, { lockScreen: true, alertStyle: 1 });
    expect(await reminders.getReminderPermissionDetail()).toEqual({ permission: 'granted', quiet: false });
    expect(code('app/settings/reminders.tsx')).toMatch(/\{quiet && \(/);
  });

  it('back from iPhone Settings, and after "Yes, evenings": "Reminders are on." then the Next line, with Change', () => {
    const line = 'Next: Tuesday at 8:30 PM.';
    expect(logic.turnOnOutcome({ permission: 'granted', scheduled: { ok: true } }, line)).toEqual({ message: 'Reminders are on. Next: Tuesday at 8:30 PM.', action: 'change' });
    expect(logic.turnOnOutcome({ permission: 'granted', scheduled: { ok: true } }, null)).toEqual({ message: 'Reminders are on.', action: 'change' });
    const card = code('components/asks/reminder-prime-ask.tsx');
    expect(card).toMatch(/label: s\.changeButton, onPress: \(\) => router\.push\('\/settings\/reminders'\)/);
    expect(card).toMatch(/label: s\.openSettingsButton, onPress: \(\) => void Linking\.openSettings\(\)/);
  });

  it('no birth date: the month row says it starts once one is added; names forced off while App lock is on', () => {
    expect(logic.monthRowNote([{ birthday: null, included: true }])).toBe('Starts once a birth date is added.');
    expect(logic.monthRowNote([{ birthday: '2026-03-01', included: false }])).toBe(s.birthDateNote);
    expect(logic.monthRowNote([{ birthday: '2026-03-01', included: true }])).toBe(s.monthNotesHelp);
    expect(logic.namesRow(true, true)).toEqual({ value: false, disabled: true, help: 'Names stay hidden while App lock is on.' });
    expect(logic.namesRow(true, false)).toEqual({ value: true, disabled: false, help: s.namesHelpOn });
    expect(logic.namesRow(false, false)).toEqual({ value: false, disabled: false, help: s.namesHelpOff });
  });

  it('Reduce Motion: the Next line swaps with no fade, the choices only fade in; AX5: the time row stacks', () => {
    const screen = code('app/settings/reminders.tsx');
    expect(screen).toMatch(/key=\{line\} entering=\{motion\.reduced \? undefined : FadeIn\.duration\(tokens\.motion\.swapMs\)\}/);
    expect(screen).toMatch(/<Animated\.View entering=\{motion\.enter\(\)\} layout=\{layout\}/);
    expect(screen).toMatch(/className=\{ax \? 'min-h-12 gap-2 px-4 py-2'/);
    // Nothing on the page counts days or truncates its words.
    expect(screen).not.toMatch(/numberOfLines/);
  });
});
