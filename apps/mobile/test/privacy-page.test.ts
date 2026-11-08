/// <reference types="node" />
/**
 * Settings > Privacy as ruled (CPrivO-5; proposals/privacy-settings.md 3 and 4; SETTINGS_AND_ACCOUNT.md 11): the
 * promise word for word at the top with no icon, then facts, then what a parent can do, then the documents. Which
 * lines show is privacyPage() (pure, run here for every build); the screen's use of it is pinned in its source.
 * Every fact here is checked against the build it shows in, so a line cannot claim more than the code does.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { privacyPage } from '../src/components/settings/privacy.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const screen = code('app/settings/privacy.tsx');
const p = en.settings.privacy;
const build1 = { sync: false, syncStatus: 'signed_out' as const, analytics: false, accountDeletion: false, signIn: false };
/** A servers-on build (the `preview` profile): sync, sign-in and analytics capabilities on. */
const preview = { ...build1, sync: true, signIn: true, analytics: true, accountDeletion: true };

describe('[CPrivO-5] Settings > Privacy', () => {
  it('opens with trust.promise word for word, as plain text before any section, and no lock or shield icon', () => {
    expect(en.trust.promise).toBe('Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.');
    const promise = screen.indexOf('{copy.trust.promise}');
    expect(promise).toBeGreaterThan(-1);
    expect(promise).toBeLessThan(screen.indexOf('<ListSection'));
    expect(screen).not.toMatch(/phosphor|Icon\b|Lock\w*Icon|Shield/);
    // Nothing build 1 shows names photos (v1.0 has none; M13 rule 4). analyticsHelp ("Never ... photos") shows only
    // in a build with the usage switch, none of which exists today.
    const shown = [en.trust.promise, ...privacyPage(build1).facts.map((k) => p[k]), p.whereTitle, p.whoTitle, p.whoLockOff, p.lockScreenLabel, p.notificationsLine, p.canDoTitle, p.noAccount, p.documentsTitle, p.privacyPolicyLink, p.termsLink, en.trust.short];
    for (const l of shown) expect(l, l).not.toMatch(/photo/i);
  });

  it('build 1 (servers and analytics off): on this phone and not sent to us, speech on this phone, no reports, no account', () => {
    expect(privacyPage(build1)).toEqual({ facts: ['keptOnPhone', 'speechOnPhone', 'noReports'], syncRow: false, analyticsSwitch: false, noAccountLine: true, deleteAccountRow: false });
    expect(p.keptOnPhone).toBe('Your letters and recordings are kept on this phone. They are not sent to us.');
    expect(p.speechOnPhone).toBe('Your speech is written down on this phone.');
    expect(p.noReports).toBe('This version collects no usage or crash reports.');
    expect(p.noAccount).toBe('There is no account in this version. Deleting the app removes its letters and recordings from this phone.');
  });

  it('"not sent to us" shows only with no sync in the build, or a sync status of exactly off (CTO ruling, 8 Nov)', () => {
    // No sync in the build: whatever the status reads, nothing can have reached us.
    for (const syncStatus of ['on', 'off', 'unknown', 'signed_out'] as const) expect(privacyPage({ ...build1, syncStatus }).facts[0], syncStatus).toBe('keptOnPhone');
    // Sync in the build, consent declined ('off'): nothing was ever sent.
    expect(privacyPage({ ...preview, syncStatus: 'off' }).facts).toEqual(['keptOnPhone', 'speechOnPhone']);
    // Sync on: the synced line, never "not sent to us".
    expect(privacyPage({ ...preview, syncStatus: 'on' }).facts).toEqual(['keptSynced', 'speechOnPhone']);
    expect(privacyPage({ ...preview, syncStatus: 'on' })).toMatchObject({ syncRow: true, analyticsSwitch: true, noAccountLine: false, deleteAccountRow: true });
    expect(p.keptSynced).toMatch(/on our servers/);
    expect(screen).toMatch(/syncStatus: sensitive\.status,/);
    expect(screen).toMatch(/analytics: capabilities\.analytics/);
  });

  it('status unknown (not read yet, offline): no location line, neither "not sent to us" nor the synced line', () => {
    const page = privacyPage({ ...preview, syncStatus: 'unknown' });
    expect(page.facts).toEqual(['speechOnPhone']);
    expect(page.facts).not.toContain('keptOnPhone');
    expect(page.facts).not.toContain('keptSynced');
  });

  it('signed out in a sync build (a parent may have synced, then signed out): no location line', () => {
    const page = privacyPage({ ...preview, syncStatus: 'signed_out' });
    expect(page.facts).toEqual(['speechOnPhone']);
    expect(page.syncRow).toBe(true);
  });

  it('the iPhone backup line is the CCO-8 recordings-only wording, on every build, and the same words as Where your letters live', () => {
    expect(p.iphoneBackupTitle).toBe('iPhone backup');
    expect(p.iphoneBackup).toBe('Includes your recordings, if iCloud Backup is on.');
    expect(screen).toMatch(/<ListRow title=\{p\.iphoneBackupTitle\} subtitle=\{p\.iphoneBackup\}/);
    // No location line repeats a backup claim of its own.
    for (const l of [p.keptOnPhone, p.keptSynced]) expect(l, l).not.toMatch(/backup/i);
  });

  it('Names in notifications reads its own On and Off words, not the sync status words', () => {
    expect(screen).toMatch(/value=\{names \? p\.namesValueOn : p\.namesValueOff\}/);
    expect(screen).not.toMatch(/copy\.settings\.privacy\.sensitiveOn|reminders\.offLabel/);
  });

  it('who can see it: the plain fact while there is no app lock, never "Only you" (content 7, LEGAL-REQ-044)', () => {
    expect(p.whoLockOff).toBe('Anyone who can unlock this iPhone can open the book.');
    expect(screen).toMatch(/<ListRow title=\{p\.whoLockOff\}/);
    expect((Object.values(p) as unknown[]).filter((v): v is string => typeof v === "string").filter((v) => /only you/i.test(v))).toEqual([]);
    // Names in notifications opens Reminders and reads the real setting; P8 is the section footer.
    expect(screen).toMatch(/<ListSection title=\{p\.whoTitle\} footer=\{p\.notificationsLine\}>/);
    expect(screen).toMatch(/title=\{p\.lockScreenLabel\}[\s\S]*?onPress=\{go\('\/settings\/reminders'\)\}/);
    expect(screen).toMatch(/useState\(lockScreenNamesOn\)/);
    // The slot the app lock lane fills.
    expect(readFileSync(join(SRC, 'app/settings/privacy.tsx'), 'utf8')).toMatch(/APP_LOCK_ROW/);
  });

  it('sections in order: where, who, what you can do, the documents; the short line last', () => {
    const order = ['p.whereTitle', 'p.whoTitle', 'p.canDoTitle', 'p.documentsTitle', 'copy.trust.short'];
    const at = order.map((k) => screen.indexOf(k));
    for (const [i, n] of at.entries()) expect(n, order[i]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(p.whereTitle).toBe('Where your book is kept');
    expect(p.whoTitle).toBe('Who can see it');
    expect(p.canDoTitle).toBe('What you can do');
  });

  it('the sync row footer drops "yet" (CPrivO-5): no line promises a control that does not exist', () => {
    expect(p.sensitiveHelp).not.toMatch(/\byet\b/);
    for (const l of [p.keptOnPhone, p.keptSynced, p.noReports, p.noAccount, p.whoLockOff, p.notificationsLine]) expect(l, l).not.toMatch(/\byet\b|coming|soon|update/i);
  });
});
