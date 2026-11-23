/**
 * NS-10-R13 (BL-1865): a new phone with backup off shows one line at the top of the Book until it is dismissed, and no
 * per-letter warning. Logic is pure; the wiring is read from source like the other first-run tests.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authCopy } from '@scribe/content';
import { backupLineEnabled, parseBackupLineFlag, setBackupLineForTest } from '../src/lib/first-run/backup-line-flag';
import { BACKUP_LINE_DONE, backupLineOwed, backupLineToWrite } from '../src/lib/first-run/new-phone.logic';

const read = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');

describe('[NS-10-R13] one book-level line for absent recordings', () => {
  it('[NS-10-R13] owed on an arrival with backup off and the switch on, once decided never again', () => {
    expect(backupLineToWrite(null, false, true)).toBe('pending');
    expect(backupLineToWrite('pending', false, true)).toBeNull();
    expect(backupLineToWrite(BACKUP_LINE_DONE, false, true)).toBeNull();
  });
  it('[NS-10-R13] not owed when backup is on', () => {
    expect(backupLineToWrite(null, true, true)).toBeNull();
  });
  it('[NS-10-R13] shown until dismissed, then gone', () => {
    expect(backupLineOwed('pending', false, true)).toBe(true);
    expect(backupLineOwed(BACKUP_LINE_DONE, false, true)).toBe(false);
    expect(backupLineOwed(null, false, true)).toBe(false);
  });
  it('[NS-10-R13] a stored pending never draws once backup is on (it would say the recordings stay on the phone beside a backup)', () => {
    // Failed on the first version of backupLineOwed(current), which read only the stored value.
    expect(backupLineOwed('pending', true, true)).toBe(false);
  });
  it('[NS-10-R13] switch off: the line never renders and nothing is written', () => {
    expect(backupLineEnabled()).toBe(false);
    expect(backupLineOwed('pending', false, false)).toBe(false);
    expect(backupLineToWrite(null, false, false)).toBeNull();
  });
  it('[NS-10-R13] switch on: the line renders and is written', () => {
    setBackupLineForTest(true);
    try {
      expect(backupLineEnabled()).toBe(true);
      expect(backupLineOwed('pending', false, backupLineEnabled())).toBe(true);
      expect(backupLineToWrite(null, false, backupLineEnabled())).toBe('pending');
    } finally {
      setBackupLineForTest(null);
    }
  });
  it('[NS-10-R13] only the word on turns the switch on, read from EXPO_PUBLIC_BACKUP_LINE, and no eas.json profile sets it', () => {
    expect(parseBackupLineFlag('on')).toBe(true);
    expect(parseBackupLineFlag(' ON ')).toBe(true);
    for (const v of ['off', '1', 'true', '', undefined, null]) expect(parseBackupLineFlag(v)).toBe(false);
    expect(read('lib', 'first-run', 'backup-line-flag.ts')).toMatch(/process\.env\.EXPO_PUBLIC_BACKUP_LINE/);
    expect(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')).not.toContain('EXPO_PUBLIC_BACKUP_LINE');
  });
  it('[NS-10-R13] the Book draws the line once at the top, from the content key, with a dismiss, and cards carry no warning', () => {
    const book = read('app', '(tabs)', 'book.tsx');
    expect(authCopy.newPhone.recordingsElsewhere.length).toBeGreaterThan(0);
    expect(book.match(/authCopy\.newPhone\.recordingsElsewhere\b/g)).toHaveLength(1);
    expect(book).toContain('backupLineOwed(getSetting(BACKUP_LINE_SETTING), backupInBuild(), backupLineEnabled())');
    expect(book).toContain('setSetting(BACKUP_LINE_SETTING, BACKUP_LINE_DONE)');
    // Drawn only while owed, above the lens switch and the chapters.
    expect(book).toMatch(/\{backupLine \? \([\s\S]*?authCopy\.newPhone\.recordingsElsewhere\b[\s\S]*?\) : null\}[\s\S]*?\{lensOn \?/);
    // No per-letter warning: the card and the row never name it.
    for (const f of ['letter-card.tsx']) expect(read('components', 'book', f)).not.toMatch(/recordingsElsewhere|backupLine/);
  });
  it('[NS-10-R13] onboarding owes the line when the book arrives, with the build backup flag', () => {
    const o = read('app', 'onboarding.tsx');
    expect(o).toMatch(/backupLineToWrite\(getSetting\(BACKUP_LINE_SETTING\), backupInBuild\(\), backupLineEnabled\(\)\)/);
  });
});
