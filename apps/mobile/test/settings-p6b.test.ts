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
    const t = screen({ line: trial, details: { ...monthly, status: 'trial' }, plusOn: true, noteLines: ['Plus is free until November 13, 2026.', 'Cancel by November 12, 2026 and you pay nothing.'] });
    expect(t.status?.subtitle).toBe('Plus is on, free until November 13, 2026.');
    // Everything a state can put on the screen, once each.
    for (const s of [screen(), screen({ line: trial, details: { ...monthly, status: 'trial' }, plusOn: true }), screen({ line: { kind: 'grace' }, details: { ...monthly, status: 'grace' }, plusOn: true })]) {
      const said = [s.status?.subtitle, s.seePlans?.title, s.promise, p.payment, s.manage ? p.manageHelp : null, p.restoreHelp, s.redeem ? p.redeemHelp : null]
        .filter((x): x is string => !!x)
        .flatMap((x) => x.split(/(?<=[.!?])\s+/));
      expect(said.length).toBe(new Set(said).size);
    }
    // The promise sits where plan.off and plus.promise once both said "Your first two letters are free.".
    const plan = code('app/settings/plus.tsx');
    expect(plan).toMatch(/<ListSection title=\{p\.statusTitle\} footer=\{screen\.promise\}>/);
    expect(plan).not.toMatch(/copy\.plus\.promise|p\.off\b/);
    expect(plan).toMatch(/\{screen\.manage \? \(/);
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
    // The master switch keeps every choice when off: disable writes only `enabled`; enable clears `paused`.
    const scheduler = code('lib/reminders/scheduler.ts');
    expect(scheduler).toMatch(/export async function disableReminders\(\): Promise<void> \{\s*writePrefs\(\{ enabled: false \}\);/);
    expect(scheduler).toMatch(/writePrefs\(\{ enabled: true, paused: false, cadence:/);
    expect(en.settings.reminders.pauseLabel).toBe('Pause all reminders'); // retired, kept until P7
  });

  it('the notifications-off card shows only while reminders are on and iOS says no; back from Settings it collapses with "Reminders are on."', () => {
    expect(showNotificationsOff(prefs(true), 'denied')).toBe(true);
    expect(showNotificationsOff(prefs(true), 'granted')).toBe(false);
    expect(showNotificationsOff(prefs(false), 'denied')).toBe(false);
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
    expect(code('app/settings/recordings.tsx')).toMatch(/onPress=\{row\.action === 'remove' \? confirmRemove : row\.action === 'download' \? \(\) => void startSpeechDownload\(language\) : undefined\}/);
  });
});

describe('[S43] Export', () => {
  it('every failure names its cause with an action that can work: too big leads to "Write to us"', () => {
    expect(exportFailure('tooBig')).toEqual({ title: 'This book is too big for one file', body: null, action: 'writeToUs', label: 'Write to us' });
    expect(exportFailure('lowSpace')).toEqual({ title: exportCopy.screen.failedTitle, body: 'This phone needs more free space first.', action: 'again', label: 'Export again' });
    expect(exportFailure('other')).toEqual({ title: exportCopy.screen.failedTitle, body: exportCopy.screen.failedBody, action: 'again', label: 'Export again' });
    const screen = code('app/settings/export.tsx');
    expect(screen).toMatch(/supportMailto\(copy\.settingsHome\.helpSubject\)/);
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
    expect(list).toMatch(/<ProhibitIcon size=\{20\} color=\{c\.textMuted\} \/>/);
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
    const screen = code('app/settings/appearance.tsx');
    expect(screen).not.toMatch(/reader\.preview\b/);
    expect(screen).toMatch(/copy\.reader\.previewEmpty/);
    expect(en.reader.previewEmpty).toBe('Aa');
    // The Reading size labels in Literata at their own size (as S29).
    expect(screen).toMatch(/<Text variant="letterBody" scale=\{tokens\.readingScale\[s\]\}>\s*\{copy\.reader\.sizes\[s\]\}/);
  });
});
