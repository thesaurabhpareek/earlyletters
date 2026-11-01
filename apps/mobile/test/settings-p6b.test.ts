/// <reference types="node" />
/**
 * Plan (S41), Reminders (S34), Recordings (S42), Export (S43), Privacy (S44) and Appearance (S45): EXPERIENCE_PASS_2026-10
 * package P6. The rules are pure (components/settings/*.logic.ts) and run here; the screens are React Native, so their
 * use of the rules is pinned in their source. Registered words are pinned word for word in
 * packages/content/test/experience-pass.test.ts; here they are read as they are. Fixtures: the fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { billingCopy, en, exportCopy, reminderCopy, speechSettingsCopy } from '@scribe/content';
import { fill } from '../src/lib/copy';
import { appearanceSample, type SampleEntry } from '../src/components/settings/appearance.logic';
import { exportEmpty, exportFailure, INSIDE } from '../src/components/settings/export.logic';
import { HELD, planName, planScreen, restoreResult, statusSentences, subscriptionExists } from '../src/components/settings/plan.logic';
import { C7_CLEARED, recordingsCard, speechRow } from '../src/components/settings/recordings.logic';
import { remindersSwitchOn, remindersTurnedOnInSettings, showNotificationsOff } from '../src/components/settings/reminders.logic';
import type { PlanLine } from '../src/lib/billing/plan.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const p = billingCopy.plan;
const longDate = (ymd: string) => ({ '2026-11-13': 'November 13, 2026', '2026-11-12': 'November 12, 2026' })[ymd] ?? ymd;
const off: PlanLine = { kind: 'off' };
const none = { status: 'none' as const, period: null, ownership: null };
const monthly = { status: 'active' as const, period: 'month' as const, ownership: 'purchased' as const };
const screen = (over: Partial<Parameters<typeof planScreen>[0]> = {}) =>
  planScreen({ line: off, details: none, plusOn: false, storeSupport: 'available', noteLines: [], longDate, ...over });

describe('[S41] Plan', () => {
  it('Plus off: no status card, "See what Plus adds" first, the registered promise as the footer once, no Manage', () => {
    const s = screen();
    expect(s.status).toBeNull();
    expect(s.seePlans).toEqual({ kind: 'open', title: 'See what Plus adds' });
    expect(s.promise).toBe(billingCopy.store.promise);
    expect(s.manage).toBe(false);
    expect(s.redeem).toBe(true);
    // No StoreKit on this device (the web preview, an old iOS): the line that says why, and no Redeem.
    expect(screen({ storeSupport: 'unsupported' }).seePlans).toEqual({ kind: 'unavailable', title: p.unavailable });
    expect(screen({ storeSupport: 'needs_ios_17' }).seePlans).toEqual({ kind: 'unavailable', title: p.needsNewerIos });
    expect(screen({ storeSupport: 'unsupported' }).redeem).toBe(false);
  });

  it('Plus on: "Plus", its dates from StoreKit and the plan name; Manage only while a subscription exists', () => {
    const on = screen({ line: { kind: 'renews', on: '2026-11-13' }, details: monthly, plusOn: true });
    expect(on.status).toEqual({ title: 'Plus', subtitle: 'Plus renews on November 13, 2026.', value: HELD.monthly });
    expect(on.seePlans).toBeNull();
    expect(on.manage).toBe(true);
    expect(on.redeem).toBe(false);
    const shared = screen({ line: { kind: 'on' }, details: { ...monthly, ownership: 'familyShared' }, plusOn: true });
    expect(shared.status?.subtitle).toBe(`${p.on} ${p.shared}`);
    // Apple retrying a payment: Plus is off, the row says so, Manage is there, and Plus is not sold again.
    const retry = screen({ line: { kind: 'retry' }, details: { ...monthly, status: 'billing_retry' } });
    expect(retry.status).toEqual({ title: 'Plus', subtitle: p.retry, value: null });
    expect(retry.manage).toBe(true);
    expect(retry.seePlans).toBeNull();
    for (const st of ['trial', 'active', 'grace', 'billing_retry'] as const) expect(subscriptionExists(st), st).toBe(true);
    for (const st of ['none', 'expired', 'refunded', 'revoked'] as const) expect(subscriptionExists(st), st).toBe(false);
  });

  it('never says a sentence twice: a date the open plan note already says is left out of the row', () => {
    const renews = screen({ line: { kind: 'renews', on: '2026-11-13' }, details: monthly, plusOn: true, noteLines: ['Plus renews on November 13, 2026.', 'To avoid the next charge, cancel by November 12, 2026.'] });
    expect(renews.status?.subtitle).toBeNull();
    const trial: PlanLine = { kind: 'trial', until: '2026-11-13', cancelBy: '2026-11-12' };
    expect(statusSentences(trial, longDate)).toEqual(['Plus is on, free until November 13, 2026.', 'Cancel by November 12, 2026 and you pay nothing.']);
    // With the plan note open the note carries the trial date, so the row says only that Plus is on: the date once
    // (lens A f1 on #313: "Plus is on, free until {date}." and "Plus is free until {date}." both showed).
    const trialNote = ['Plus is free until November 13, 2026.', 'Cancel by November 12, 2026 and you pay nothing.'];
    const t = screen({ line: trial, details: { ...monthly, status: 'trial' }, plusOn: true, noteLines: trialNote });
    expect(t.status?.subtitle).toBe(p.on);
    // No note open: the row carries the date and the cancel-by line itself.
    expect(screen({ line: trial, details: { ...monthly, status: 'trial' }, plusOn: true }).status?.subtitle).toBe('Plus is on, free until November 13, 2026. Cancel by November 12, 2026 and you pay nothing.');
    // "Plus is on." and the restore result "Plus is on." are one sentence, said once (lens A f2): StoreKit gave no
    // period end, and a restore just worked.
    expect(screen({ line: { kind: 'on' }, details: monthly, plusOn: true, restored: p.restored }).status?.subtitle).toBeNull();
    expect(screen({ line: { kind: 'on' }, details: monthly, plusOn: true, restored: HELD.restoreNothing }).status?.subtitle).toBe(p.on);
    expect(code('app/settings/plus.tsx')).toMatch(/restored: restored\?\.text \?\? null,/);
    // Everything a state can put on the screen, once each, with the note and the restore result it can show; and
    // every date at most once.
    const states = [
      { s: screen(), note: [] as string[], restore: null as string | null },
      { s: screen({ line: trial, details: { ...monthly, status: 'trial' }, plusOn: true }), note: [], restore: null },
      { s: screen({ line: trial, details: { ...monthly, status: 'trial' }, plusOn: true, noteLines: trialNote }), note: trialNote, restore: null },
      { s: screen({ line: { kind: 'grace' }, details: { ...monthly, status: 'grace' }, plusOn: true }), note: [], restore: null },
      { s: screen({ line: { kind: 'on' }, details: monthly, plusOn: true, restored: p.restored }), note: [], restore: p.restored },
      { s: screen({ restored: HELD.restoreNothing }), note: [], restore: HELD.restoreNothing },
    ];
    for (const { s, note, restore } of states) {
      const said = [s.status?.subtitle, s.seePlans?.title, s.promise, p.payment, s.manage ? p.manageHelp : null, p.restoreHelp, s.redeem ? p.redeemHelp : null, ...note, restore]
        .filter((x): x is string => !!x)
        .flatMap((x) => x.split(/(?<=[.!?])\s+/));
      expect(said.length, said.join(' | ')).toBe(new Set(said).size);
      for (const date of ['November 13, 2026', 'November 12, 2026']) expect(said.filter((x) => x.includes(date)).length, date).toBeLessThanOrEqual(1);
    }
    // The promise sits where plan.off and the old plus.promise (deleted, P7) once both said "Your first two letters are free.".
    const plan = code('app/settings/plus.tsx');
    expect(plan).toMatch(/<ListSection title=\{p\.statusTitle\} footer=\{screen\.promise\}>/);
    expect(plan).not.toMatch(/p\.off\b/);
    expect(plan).toMatch(/\{screen\.manage \? \(/);
  });

  it('each status says its own sentence: ends is not renews, grace and retry are their own, shared only with Plus on', () => {
    // Cancelled: "stays on until", never "renews" (a swap fails here).
    const ends = screen({ line: { kind: 'ends', on: '2026-11-13' }, details: monthly, plusOn: true });
    expect(ends.status?.subtitle).toBe('Plus stays on until November 13, 2026. It will not renew.');
    expect(ends.status?.subtitle).not.toMatch(/renews/);
    expect(statusSentences({ kind: 'ends', on: '2026-11-13' }, longDate)).toEqual([fill(p.ends, { date: 'November 13, 2026' })]);
    expect(statusSentences({ kind: 'renews', on: '2026-11-13' }, longDate)).toEqual([fill(p.renews, { date: 'November 13, 2026' })]);
    // Grace: Apple is retrying while Plus stays on; the registered sentence word for word.
    const grace = screen({ line: { kind: 'grace' }, details: { ...monthly, status: 'grace' }, plusOn: true });
    expect(grace.status).toEqual({ title: 'Plus', subtitle: p.grace, value: HELD.monthly });
    expect(p.grace).not.toBe(p.retry);
    // Family Sharing is said only while Plus is on: a shared subscription Apple is retrying says only the retry.
    const sharedRetry = screen({ line: { kind: 'retry' }, details: { ...monthly, status: 'billing_retry', ownership: 'familyShared' }, plusOn: false });
    expect(sharedRetry.status?.subtitle).toBe(p.retry);
    expect(sharedRetry.status?.subtitle).not.toContain(p.shared);
    expect(screen({ line: { kind: 'on' }, details: { ...monthly, ownership: 'purchased' }, plusOn: true }).status?.subtitle).toBe(p.on);
    expect(statusSentences({ kind: 'off' }, longDate)).toEqual([]);
  });

  it('the restore result shows inline under its row, a failure with the warning mark; cancelled says nothing', () => {
    expect(restoreResult('restored')).toEqual({ text: p.restored, failed: false });
    expect(restoreResult('nothing')).toEqual({ text: HELD.restoreNothing, failed: false });
    expect(restoreResult('failed')).toEqual({ text: p.restoreFailed, failed: true });
    expect(restoreResult('unavailable')).toEqual({ text: p.restoreFailed, failed: true });
    expect(restoreResult('cancelled')).toBeNull();
    const plan = code('app/settings/plus.tsx');
    expect(plan).toMatch(/subtitle=\{busy === 'restore' \? p\.restoring : p\.restoreHelp\}/);
    expect(plan).toMatch(/\{restored\.failed \? <WarningCircleIcon/);
  });

  it('keeps the held registered words until counsel: Monthly and Yearly today, the switch one line each (HELD)', () => {
    expect(HELD).toEqual({ monthly: 'Monthly', annual: 'Yearly', restoreNothing: 'No Plus was found for this Apple Account.' });
    expect(planName('month')).toBe('Monthly');
    expect(planName('year')).toBe('Yearly');
    expect(planName(null)).toBeNull();
    // The new words wait in content, shown by nothing.
    expect(p.annual).toBe('Plus Annual');
    expect(p.restoreNone).toBe('This Apple Account has no Plus to restore.');
    expect(code('app/settings/plus.tsx')).not.toMatch(/p\.annual|p\.restoreNone|p\.yearly|p\.monthly/);
  });

  it('types no price, trial length or countdown anywhere it can show (D-083)', () => {
    const lines = [screen(), screen({ line: { kind: 'renews', on: '2026-11-13' }, details: monthly, plusOn: true }), screen({ storeSupport: 'unsupported' })].flatMap((s) => [s.status?.subtitle ?? '', s.seePlans?.title ?? '', s.promise]);
    for (const l of [...lines, p.payment, p.restoreHelp, p.manageHelp, p.redeemHelp]) expect(l, l).not.toMatch(/\$|\bprice\b|\d+\s*(days?|months?) (free|left)/i);
  });
});

describe('[S34] Reminders', () => {
  const prefs = (enabled: boolean, paused = false) => ({ enabled, paused });

  it('one switch per decision: the master switch is the only on and off; the Pause row is gone', () => {
    expect(remindersSwitchOn(prefs(true))).toBe(true);
    expect(remindersSwitchOn(prefs(false))).toBe(false);
    // A pause from before reads as off; turning the switch on starts reminders again (enableReminders clears it).
    expect(remindersSwitchOn(prefs(true, true))).toBe(false);
    const screen = code('app/settings/reminders.tsx');
    expect(screen).not.toMatch(/pauseLabel|pausedHelp|paused: v/);
    expect(screen).toMatch(/<ToggleRow title=\{s\.enabledLabel\} value=\{on\}/);
    // The master switch keeps every choice when off, and on clears a pause: run through lib/reminders' public API
    // in test/reminders-switch.test.ts (lens A f6 on #313 asked for behaviour, not another stream's source).
  });

  it('the notifications-off card shows only while reminders are on and iOS says no; back from Settings it collapses with "Reminders are on."', () => {
    expect(showNotificationsOff(prefs(true), 'denied')).toBe(true);
    expect(showNotificationsOff(prefs(true), 'granted')).toBe(false);
    expect(showNotificationsOff(prefs(false), 'denied')).toBe(false);
    // Only a real "no": not yet asked, or not known yet, is not denied (no card).
    expect(showNotificationsOff(prefs(true), 'undetermined')).toBe(false);
    expect(showNotificationsOff(prefs(true), null)).toBe(false);
    expect(showNotificationsOff(prefs(true, true), 'denied')).toBe(false);
    // Back from Settings still denied, or from not asked to granted: no "Reminders are on.".
    expect(remindersTurnedOnInSettings('denied', 'denied', prefs(true))).toBe(false);
    expect(remindersTurnedOnInSettings('undetermined', 'granted', prefs(true))).toBe(false);
    expect(remindersTurnedOnInSettings('denied', 'undetermined', prefs(true))).toBe(false);
    expect(remindersTurnedOnInSettings('denied', 'granted', prefs(true, true))).toBe(false);
    expect(remindersTurnedOnInSettings('denied', 'granted', prefs(true))).toBe(true);
    expect(remindersTurnedOnInSettings('granted', 'granted', prefs(true))).toBe(false);
    expect(remindersTurnedOnInSettings(null, 'granted', prefs(true))).toBe(false);
    expect(remindersTurnedOnInSettings('denied', 'granted', prefs(false))).toBe(false);
    const screen = code('app/settings/reminders.tsx');
    expect(screen).toMatch(/toast\.show\(\{ message: s\.onToast \}\)/);
    expect(screen).toMatch(/LinearTransition\.duration\(tokens\.motion\.enter\.durationMs\)/);
    expect(screen).toMatch(/motion\.reduced \? undefined : LinearTransition/);
    expect(screen).toMatch(/<WarningCircleIcon size=\{20\} color=\{c\.caution\}/);
    expect(reminderCopy.settings.onToast).toBe('Reminders are on.');
  });

  it('says "message", never "note", for what the app sends, and counts no days or runs', () => {
    const s = reminderCopy.settings;
    const shown = [s.enabledLabel, s.howOftenTitle, s.eveningsTitle, s.timeTitle, s.quietHelp, s.lateNightClamp, s.monthNotesLabel, s.monthNotesHelp, s.namesHelpOn, s.namesHelpOff, s.deniedTitle, s.deniedBody, s.openSettingsButton, s.onToast, en.settings.reminders.help];
    for (const l of shown) expect(l, l).not.toMatch(/\bnotes?\b/i);
    const sent = [...reminderCopy.neutral.evening.flatMap((v) => [v.title, v.body]), reminderCopy.neutral.monthOpen.title, reminderCopy.neutral.monthOpen.body, reminderCopy.together.monthTitle];
    for (const l of [...shown, ...sent]) expect(l, l).not.toMatch(/\b\d+\s*(?:days?|evenings?|nights?|in a row|times?)\b|\bstreak|\bmissed\b/i);
    expect(code('app/settings/reminders.tsx')).not.toMatch(/eveningsHelp|eveningHelp/);
  });
});

describe('[S42] Recordings', () => {
  const r = en.settings.recordings;

  it('a build without backup: today\'s card, which already says Export, so no footer', () => {
    expect(recordingsCard({ inBuild: false, status: null })).toEqual({ title: r.onPhoneTitle, body: r.onPhoneBody, footer: null, backupRow: null });
  });

  it('with backup in the build, the option-B card waits for counsel (C7); cleared, it follows backup\'s state', () => {
    expect(C7_CLEARED).toBe(false);
    expect(recordingsCard({ inBuild: true, status: 'current' })).toEqual({ title: r.onPhoneTitle, body: r.onPhoneBody, footer: null, backupRow: null });
    for (const status of [null, 'off', 'needs_consent', 'unavailable']) {
      expect(recordingsCard({ inBuild: true, status, c7Cleared: true }), String(status)).toEqual({ title: r.onPhoneTitle, body: r.onPhoneBodyBackupOff, footer: r.exportFooter, backupRow: null });
    }
    for (const status of ['current', 'backing_up', 'waiting_wifi', 'some_kept_here', 'paused', 'quota', 'waiting_key']) {
      expect(recordingsCard({ inBuild: true, status, c7Cleared: true }), status).toEqual({ title: r.backedUpTitle, body: r.backedUpBody, footer: r.exportFooter, backupRow: 'Back up my recordings' });
    }
  });

  it('no fact twice, and never "only on this phone"', () => {
    const cards = [false, true].flatMap((c7Cleared) => [null, 'off', 'current'].map((status) => recordingsCard({ inBuild: true, status, c7Cleared }))).concat([recordingsCard({ inBuild: false, status: null })]);
    for (const c of cards) {
      expect(`${c.title} ${c.body} ${c.footer ?? ''}`).not.toMatch(/only on (?:this|your) phone|stays? on this phone/i);
      const sentences = [c.body, c.footer].filter((x): x is string => !!x).flatMap((x) => x.split(/(?<=[.!?])\s+/));
      expect(sentences.length).toBe(new Set(sentences).size);
    }
    const screen = code('app/settings/recordings.tsx');
    expect(screen).not.toMatch(/r\.keepHelp/);
    expect(screen).toMatch(/<ListSection title=\{r\.title\} footer=\{card\.footer \?\? undefined\}>/);
  });

  it('the language row is actionable when the model is missing, and shows its progress while it downloads', () => {
    expect(speechRow({ kind: 'absent', mb: 575 })).toEqual({ subtitle: 'Not on this phone, 575 MB', action: 'download', trailing: 'Download', percent: null, hint: speechSettingsCopy.downloadHint });
    expect(speechRow({ kind: 'downloading', fraction: 0.4 })).toMatchObject({ subtitle: 'Getting ready, 40%', action: null, percent: 40 });
    expect(speechRow({ kind: 'here', mb: 575 })).toMatchObject({ subtitle: 'On this phone, 575 MB', action: 'remove', trailing: 'Remove' });
    expect(speechRow({ kind: 'waitingForWifi', mb: 575 }).action).toBeNull();
    expect(speechRow({ kind: 'unknown', mb: 575 }).action).toBeNull();
    // Each state's words and action, in full: Remove says what it frees; the rows that wait offer nothing to tap.
    expect(speechRow({ kind: 'here', mb: 575 })).toEqual({ subtitle: 'On this phone, 575 MB', action: 'remove', trailing: speechSettingsCopy.confirmButton, percent: null, hint: speechSettingsCopy.removeHint });
    expect(speechSettingsCopy.removeHint).toBe('Removes this language from the phone to free space');
    expect(speechRow({ kind: 'noSpace', mb: 575 })).toEqual({ subtitle: 'Needs more free space, 575 MB', action: null, trailing: null, percent: null, hint: undefined });
    expect(speechRow({ kind: 'waitingForWifi', mb: 575 })).toEqual({ subtitle: 'Waits for Wi-Fi, 575 MB', action: null, trailing: null, percent: null, hint: undefined });
    expect(speechRow({ kind: 'unknown', mb: 575 })).toEqual({ subtitle: 'Not on this phone, 575 MB', action: null, trailing: null, percent: null, hint: undefined });
    // The ring and its words stay between 0 and 100, rounded down (never "100%" before it is done).
    expect(speechRow({ kind: 'downloading', fraction: 1.7 })).toMatchObject({ subtitle: 'Getting ready, 100%', percent: 100 });
    expect(speechRow({ kind: 'downloading', fraction: -0.2 })).toMatchObject({ subtitle: 'Getting ready, 0%', percent: 0 });
    expect(speechRow({ kind: 'downloading', fraction: 0.999 })).toMatchObject({ subtitle: 'Getting ready, 99%', percent: 99 });
    expect(code('app/settings/recordings.tsx')).toMatch(/onPress=\{row\.action === 'remove' \? confirmRemove : row\.action === 'download' \? \(\) => void startSpeechDownload\(language\) : undefined\}/);
  });
});

describe('[S43] Export', () => {
  it('every failure names its cause with an action that can work: too big leads to "Write to us"', () => {
    expect(exportFailure('tooBig')).toEqual({ title: 'This book is too big for one file', body: null, action: 'writeToUs', label: 'Write to us' });
    expect(exportFailure('lowSpace')).toEqual({ title: exportCopy.screen.failedTitle, body: 'This phone needs more free space first.', action: 'again', label: 'Export again' });
    expect(exportFailure('other')).toEqual({ title: exportCopy.screen.failedTitle, body: exportCopy.screen.failedBody, action: 'again', label: 'Export again' });
    const screen = code('app/settings/export.tsx');
    // mailTarget wraps supportMailto with the same subject, and falls back to the address to copy (F20-REQ-007).
    expect(screen).toMatch(/mailTarget\(copy\.settingsHome\.helpSubject\)/);
    expect(screen).not.toMatch(/tooBigBody|\be\.body\b/);
  });

  it('stays free and offline: no Plus on the screen, and the line says it is made on this phone', () => {
    const screen = code('app/settings/export.tsx');
    expect(screen).not.toMatch(/usePlan|PlusGate|presentPlusStore|keepGate|billing/);
    expect(screen).not.toMatch(/fetch\(|supabase|lib\/sync/);
    expect(screen).toMatch(/\{s\.offlineNote\}/);
    expect(exportCopy.screen.offlineNote).toBe('The export is made on this phone. It goes only where you send it.');
  });

  it('the cover at the top, a glyph per "What is inside" row, and the waiting button under its line on an empty book', () => {
    expect(INSIDE.map((i) => exportCopy.screen[i.key])).toEqual([exportCopy.screen.includesLetters, exportCopy.screen.includesRecordings, exportCopy.screen.includesBook, exportCopy.screen.includesData]);
    // Each row's own glyph (S43 Visual), and the screen draws the one named, never another.
    expect(INSIDE.map((i) => [i.key, i.icon])).toEqual([
      ['includesLetters', 'FileText'],
      ['includesRecordings', 'Microphone'],
      ['includesBook', 'BookOpen'],
      ['includesData', 'Database'],
    ]);
    expect(code('app/settings/export.tsx')).toMatch(/const INSIDE_ICON = \{ FileText: FileTextIcon, Microphone: MicrophoneIcon, BookOpen: BookOpenIcon, Database: DatabaseIcon \} as const;/);
    expect(code('app/settings/export.tsx')).toMatch(/const Icon = INSIDE_ICON\[icon\];\s*return <ListRow key=\{key\} title=\{s\[key\]\} leading=\{<Icon size=\{20\} color=\{c\.textMuted\} \/>\} \/>;/);
    expect(exportEmpty({ letters: 0 })).toBe(true);
    expect(exportEmpty({ letters: 3 })).toBe(false);
    expect(exportEmpty(null)).toBe(false);
    const screen = code('app/settings/export.tsx');
    expect(screen).toMatch(/<BookCover name=\{cover\.name\} behindName=\{cover\.behind\} size="thumb" animate=\{false\} \/>/);
    expect(screen.indexOf('{s.emptyNote}')).toBeLessThan(screen.indexOf('disabled={empty}'));
  });
});

describe('[S44] Privacy', () => {
  it('the never-lines are a plain list with a glyph each, not rows, with their registered words', () => {
    const list = code('components/consent/never-list.tsx');
    expect(list).not.toMatch(/ListRow|ListSection/);
    expect(list).toMatch(/consentCopy\.never\.map/);
    // LockSimple: the icon section 5.4 lists for S44 (the coordinator's ruling on #313).
    expect(list).toMatch(/import \{ LockSimpleIcon \} from 'phosphor-react-native\/src\/icons\/LockSimple';/);
    expect(list).toMatch(/<LockSimpleIcon size=\{20\} color=\{c\.textMuted\} \/>/);
    expect(list).not.toMatch(/Prohibit/);
    expect(code('app/settings/privacy.tsx')).toMatch(/<NeverList \/>/);
  });
});

describe('[S45] Appearance', () => {
  const letter = (over: Partial<SampleEntry> = {}): SampleEntry => ({ kind: 'letter', inBook: true, finalText: 'Asha, today you held the spoon by yourself.\nYou mostly painted your face with it.', transcriptStatus: null, authorId: undefined, ...over });
  const own = (e: SampleEntry) => e.authorId !== 'papa';

  it('the sample is the first line of the person\'s newest letter in the book, never one the app wrote', () => {
    expect(appearanceSample([letter()], own)).toBe('Asha, today you held the spoon by yourself.');
    // Never a private letter, the other parent's, a quiet-day mark or a letter still waiting for its words.
    expect(appearanceSample([letter({ inBook: false }), letter({ authorId: 'papa' }), letter({ kind: 'not_much', finalText: '' }), letter({ transcriptStatus: 'waiting', finalText: '' }), letter({ finalText: '\n\nYou waved at the dog.' })], own)).toBe('You waved at the dog.');
    expect(appearanceSample([], own)).toBeNull();
    // A quiet-day mark never reaches the letter face, even one an old build stored with a sentence in it.
    expect(appearanceSample([letter({ kind: 'not_much', finalText: 'A quiet day, kept.' }), letter({ finalText: 'You found your toes.' })], own)).toBe('You found your toes.');
    expect(appearanceSample([letter({ kind: 'not_much', finalText: 'A quiet day, kept.' })], own)).toBeNull();
    // The first line is trimmed; a letter with no words (blank or spaces only) is passed over and the search goes on.
    expect(appearanceSample([letter({ finalText: '   You slept all afternoon.   ' })], own)).toBe('You slept all afternoon.');
    expect(appearanceSample([letter({ finalText: '' }), letter({ finalText: '  \n \t ' }), letter({ finalText: 'You clapped.' })], own)).toBe('You clapped.');
    const screen = code('app/settings/appearance.tsx');
    expect(screen).not.toMatch(/reader\.preview\b/);
    expect(screen).toMatch(/copy\.reader\.previewEmpty/);
    expect(en.reader.previewEmpty).toBe('Aa');
    // The Reading size labels in Literata at their own size (as S29).
    expect(screen).toMatch(/<Text variant="letterBody" scale=\{tokens\.readingScale\[s\]\}>\s*\{copy\.reader\.sizes\[s\]\}/);
  });
});
