/**
 * NS-10-R13 (BL-1865): a new phone with backup off shows one line at the top of the Book until it is dismissed, and no
 * per-letter warning. Logic is pure; the wiring is read from source like the other first-run tests.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authCopy } from '@scribe/content';
import { BACKUP_LINE_DONE, backupLineOwed, backupLineToWrite } from '../src/lib/first-run/new-phone.logic';

const read = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');

describe('[NS-10-R13] one book-level line for absent recordings', () => {
  it('[NS-10-R13] owed on an arrival with backup off, once decided never again', () => {
    expect(backupLineToWrite(null, false)).toBe('pending');
    expect(backupLineToWrite('pending', false)).toBeNull();
    expect(backupLineToWrite(BACKUP_LINE_DONE, false)).toBeNull();
  });
  it('[NS-10-R13] not owed when backup is on', () => {
    expect(backupLineToWrite(null, true)).toBeNull();
  });
  it('[NS-10-R13] shown until dismissed, then gone', () => {
    expect(backupLineOwed('pending')).toBe(true);
    expect(backupLineOwed(BACKUP_LINE_DONE)).toBe(false);
    expect(backupLineOwed(null)).toBe(false);
  });
  it('[NS-10-R13] the Book draws the line once at the top, from the content key, with a dismiss, and cards carry no warning', () => {
    const book = read('app', '(tabs)', 'book.tsx');
    expect(authCopy.newPhone.recordingsElsewhere.length).toBeGreaterThan(0);
    expect(book.match(/authCopy\.newPhone\.recordingsElsewhere\b/g)).toHaveLength(1);
    expect(book).toContain('backupLineOwed(getSetting(BACKUP_LINE_SETTING))');
    expect(book).toContain('setSetting(BACKUP_LINE_SETTING, BACKUP_LINE_DONE)');
    // Drawn only while owed, above the lens switch and the chapters.
    expect(book).toMatch(/\{backupLine \? \([\s\S]*?authCopy\.newPhone\.recordingsElsewhere\b[\s\S]*?\) : null\}[\s\S]*?\{lensOn \?/);
    // No per-letter warning: the card and the row never name it.
    for (const f of ['letter-card.tsx']) expect(read('components', 'book', f)).not.toMatch(/recordingsElsewhere|backupLine/);
  });
  it('[NS-10-R13] onboarding owes the line when the book arrives, with the build backup flag', () => {
    const o = read('app', 'onboarding.tsx');
    expect(o).toMatch(/backupLineToWrite\(getSetting\(BACKUP_LINE_SETTING\), backupInBuild\(\)\)/);
  });
});
