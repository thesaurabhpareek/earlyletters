/// <reference types="node" />
/**
 * Where your letters live, Your words and Storage's language rows (settings-ia.md 4; design.md 2.7 to 2.9;
 * SETTINGS_AND_ACCOUNT.md 7 to 9; rulings CCO-8, CPrivO-4). The rules are pure (where-live.logic.ts) and run here;
 * the screens are React Native, so their use of the rules is pinned in their source. Fixtures: the fictional family
 * Asha.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { APPLE_ICLOUD_BACKUP_HELP, LAST_EXPORT_SETTING, whereLive } from '../src/components/settings/where-live.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const w = en.whereLive;
const day = (iso: string) => ({ '2026-10-12T09:00:00.000Z': 'Oct 12, 2026' })[iso] ?? iso;
const build1 = { sync: false, syncStatus: 'signed_out' as const, backupInBuild: false, lastExport: null, dayDate: day };
/** A servers-on build (the `preview` profile). */
const preview = { ...build1, sync: true, backupInBuild: true };

describe('[CCO-8, CPrivO-4] Where your letters live', () => {
  it('build 1: on this iPhone; three recovery lines; the footer says an export is a copy and we hold none', () => {
    expect(whereLive(build1)).toEqual({ onPhone: w.onPhone, exportLine: w.exportEmpty, backup: 'notInThisVersion', footer: w.footer, nudge: en.settings.export.exportNudge });
    expect(w.onPhone).toBe('Your letters and recordings are kept on this iPhone.');
    expect(w.backupLater).toBe('Not in this version');
    expect(w.footer).toBe('An export is a copy to open and keep. We hold no copy.');
  });

  it('after an export: "Last export: {date}" (when a copy was prepared, D-085), and the nudge goes', () => {
    const p = whereLive({ ...build1, lastExport: '2026-10-12T09:00:00.000Z' });
    expect(p.exportLine).toBe('Last export: Oct 12, 2026');
    expect(p.nudge).toBeNull();
    // The same Settings key the export screen writes.
    expect(code('app/settings/export.tsx')).toMatch(new RegExp(`const LAST_EXPORT_SETTING = '${LAST_EXPORT_SETTING}'`));
  });

  it('no line says the iPhone backup or an export brings the book back (CCO-8 until the drill passes; CPrivO-4)', () => {
    const lines = [w.onPhone, w.onPhoneSynced, w.iphoneBackup.title, w.iphoneBackup.body, w.iphoneBackup.howTo, w.exportEmpty, w.backupTitle, w.backupLater, w.footer, en.settings.export.exportNudge];
    for (const l of lines) {
      expect(l, l).not.toMatch(/brings?|restor|come back|comes back|get (it|them) back|new phone needs/i);
      expect(l, l).not.toMatch(/coming|soon|in an update|\byet\b/i);
      expect(l, l).not.toMatch(/\b(lost|lose|stolen|gone)\b/i);
    }
    // Recordings only: the letters database line waits for the drill (content.md 1 item 14).
    expect(w.iphoneBackup.body).toBe('Includes your recordings, if iCloud Backup is on.');
    expect(w.iphoneBackup.body).not.toMatch(/letters/);
  });

  it('"We hold no copy." shows only with no sync in the build, or a sync status of exactly off (CTO ruling, 8 Nov)', () => {
    for (const syncStatus of ['on', 'off', 'unknown', 'signed_out'] as const) expect(whereLive({ ...build1, syncStatus }).footer, syncStatus).toBe(w.footer);
    expect(whereLive({ ...preview, syncStatus: 'off' }).footer).toBe(w.footer);
    expect(whereLive({ ...preview, syncStatus: 'on' }).footer).toBeNull();
    expect(code('app/settings/where-letters-live.tsx')).toMatch(/sync: capabilities\.sync,\s*syncStatus: sensitive\.status,/);
  });

  it('with sync on: the synced line, and the backup row', () => {
    const p = whereLive({ ...preview, syncStatus: 'on' });
    expect(p.onPhone).toBe(w.onPhoneSynced);
    expect(p.backup).toBe('row');
  });

  it('status unknown (not read yet, offline): no "We hold no copy", and never the synced line', () => {
    const p = whereLive({ ...preview, syncStatus: 'unknown' });
    expect(p.footer).toBeNull();
    expect(p.onPhone).toBe(w.onPhone);
  });

  it('signed out in a sync build (a parent may have synced, then signed out): no "We hold no copy"', () => {
    const p = whereLive({ ...preview, syncStatus: 'signed_out' });
    expect(p.footer).toBeNull();
    expect(p.onPhone).toBe(w.onPhone);
  });

  it('the iPhone backup line says the same words on Privacy and here (CTO ruling, 8 Nov)', () => {
    expect(w.iphoneBackup.title).toBe(en.settings.privacy.iphoneBackupTitle);
    expect(w.iphoneBackup.body).toBe(en.settings.privacy.iphoneBackup);
  });

  it('the page: iPhone backup opens Apple\'s help and never says On or Off; orphans and unplayable only above 0; no language rows', () => {
    const page = code('app/settings/where-letters-live.tsx');
    expect(APPLE_ICLOUD_BACKUP_HELP).toBe('https://support.apple.com/108366');
    expect(page).toMatch(/title=\{w\.iphoneBackup\.title\}\s*subtitle=\{w\.iphoneBackup\.body\}\s*value=\{w\.iphoneBackup\.howTo\}/);
    expect(page).toMatch(/openBrowserAsync\(APPLE_ICLOUD_BACKUP_HELP\)/);
    expect(page).toMatch(/\{orphans > 0 && \(/);
    expect(page).toMatch(/\{unplayable > 0 && \(/);
    expect(page).not.toMatch(/SpeechRow|startSpeechDownload|WordForWord|tidyLabel/);
    expect(existsSync(join(SRC, 'app/settings/recordings.tsx'))).toBe(false);
    // Settings home: the row replaces Recordings in Your letters.
    const home = code('app/settings/index.tsx');
    expect(home).toMatch(/<ListRow title=\{h\.whereLive\} trailing="chevron" onPress=\{go\(ROUTES\.whereLive\)\}/);
    expect(home).not.toMatch(/recordingsLabel|ROUTES\.recordings/);
    expect(home.indexOf('h.whereLive')).toBeGreaterThan(home.indexOf('h.sections.letters'));
  });
});

describe('Your words: two named choices replace the Word for word switch', () => {
  const page = code('app/settings/your-words.tsx');

  it('names both choices, each with its line, and keeps the stored setting (review.defaultView, fixes or exact)', () => {
    expect(en.yourWords.marked.label).toBe('Small fixes, marked');
    expect(en.yourWords.exact.label).toBe('Exactly as said');
    expect(en.yourWords.footer).toBe('Either way, we never rewrite your words.');
    expect(page).toMatch(/\{ value: 'fixes', label: w\.marked\.label, description: w\.marked\.line \}/);
    expect(page).toMatch(/\{ value: 'exact', label: w\.exact\.label, description: w\.exact\.line \}/);
    expect(page).toMatch(/layout="list"/);
    expect(page).toMatch(/setSetting\(DEFAULT_VIEW_SETTING, v\)/);
    expect(page).toMatch(/viewFromSetting\(getSetting\(DEFAULT_VIEW_SETTING\)\)/);
    expect(page).not.toMatch(/ToggleRow|Switch/);
  });

  it('the example is the engine-cleaned sample, never a sentence the app wrote', () => {
    expect(page).toMatch(/promiseSample\(p\.sampleRaw\)/);
    expect(page).toMatch(/copy\.settings\.help\.mistakes/);
    const home = code('app/settings/index.tsx');
    expect(home).toMatch(/<ListRow title=\{h\.yourWords\} trailing="chevron" onPress=\{go\(ROUTES\.yourWords\)\}/);
    expect(home.indexOf('h.yourWords')).toBeGreaterThan(home.indexOf('h.sections.writing'));
    expect(home.indexOf('h.yourWords')).toBeLessThan(home.indexOf('h.sections.letters'));
  });
});

describe('Storage: language download lives only here', () => {
  it('draws one row per language in use first, and leaves the packs those rows stand for out of Downloaded and In progress', () => {
    const s = code('app/settings/storage.tsx');
    expect(s).toMatch(/languages\.map\(\(lang\) => \(\s*<SpeechRow key=\{lang\} language=\{lang\} \/>/);
    expect(s).toMatch(/const listed = installed\.filter\(\(p\) => !asLanguages\.has\(p\.id\)\)/);
    expect(s).toMatch(/\.\.\.listed\.map\(/);
    expect(s).toMatch(/!asLanguages\.has\(p\.id\) && ACTIVE\.includes/);
    expect(s.indexOf('<SpeechRow')).toBeLessThan(s.indexOf('t.downloadedTitle'));
    expect(code('components/settings/speech-row.tsx')).toMatch(/new Set\(languages\.flatMap\(\(l\) => planFor\(\[l\]\)\.packs\)\)/);
  });
});
