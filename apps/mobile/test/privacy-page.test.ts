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
const build1 = { sync: false, syncOn: false, analytics: false, accountDeletion: false, signIn: false };

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
    expect(p.keptOnPhone).toBe("Your letters and recordings are kept on this phone and in your iPhone's own backup, if you use one. They are not sent to us.");
    expect(p.speechOnPhone).toBe('Your speech is written down on this phone.');
    expect(p.noReports).toBe('This version collects no usage or crash reports.');
    expect(p.noAccount).toBe('There is no account in this version. Deleting the app removes its letters and recordings from this phone.');
  });

  it('"not sent to us" never shows while sync is on, and "no reports" never shows in a build with the usage switch', () => {
    const on = privacyPage({ ...build1, sync: true, syncOn: true, signIn: true, analytics: true, accountDeletion: true });
    expect(on.facts).toEqual(['keptSynced', 'speechOnPhone']);
    expect(on).toMatchObject({ syncRow: true, analyticsSwitch: true, noAccountLine: false, deleteAccountRow: true });
    // Sync in the build but not on (signed out, declined, unknown): the phone-only line is the true one.
    expect(privacyPage({ ...build1, sync: true, syncOn: false, signIn: true }).facts[0]).toBe('keptOnPhone');
    expect(p.keptSynced).toMatch(/on our servers/);
    expect(screen).toMatch(/syncOn: sensitive\.status === 'on'/);
    expect(screen).toMatch(/analytics: capabilities\.analytics/);
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
