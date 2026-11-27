/// <reference types="node" />
/**
 * [BL-776] First run's first screen shows the existing Recently deleted row while a deleted book waits, and not
 * otherwise. The rule is pure; the screen's wiring is pinned from source (the screen cannot run in node).
 * Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RECENTLY_DELETED_HREF, recentlyDeletedRowShown } from '../src/lib/first-run/recently-deleted-row.logic';

const onboarding = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');

describe('[BL-776] the Recently deleted row on the welcome', () => {
  it('shows on the welcome while a deleted book waits (Asha, the only book, deleted)', () => {
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: 1, deletedLetterCount: 0 })).toBe(true);
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: 2, deletedLetterCount: 0 })).toBe(true);
  });
  it('is not there when nothing waits on the shelf', () => {
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: 0, deletedLetterCount: 0 })).toBe(false);
  });
  it('is only on the first screen', () => {
    for (const step of ['promise', 'child', 'signsAs', 'finish']) expect(recentlyDeletedRowShown({ step, deletedBookCount: 1, deletedLetterCount: 1 })).toBe(false);
  });
  it('opens the shelf', () => {
    expect(RECENTLY_DELETED_HREF).toBe('/settings/recently-deleted');
  });
  it('the screen reads the waiting books, follows changes, uses the existing keys and opens the shelf', () => {
    // CPrivO-56: the shelf is read as books, letters and whether its help line still holds (readShelf).
    expect(onboarding).toMatch(/const books = listDeletedBooks\(\);/);
    expect(onboarding).toMatch(/return \{ books: books\.length, letters: letters\.length, help: shelfHelpShown\(\[\.\.\.books, \.\.\.letters\], Date\.now\(\)\) \};/);
    expect(onboarding).toMatch(/useState\(readShelf\)/);
    expect(onboarding).toMatch(/subscribeTo\(\['children', 'settings', 'entries'\], \(\) => setShelf\(readShelf\(\)\)\)/);
    expect(onboarding).toMatch(/recentlyDeletedRowShown\(\{ step, deletedBookCount: shelf\.books, deletedLetterCount: shelf\.letters \}\)/);
    expect(onboarding).toMatch(/title=\{copy\.settings\.delete\.recentlyDeleted\}/);
    expect(onboarding).toMatch(/subtitle=\{shelf\.help \? copy\.settings\.delete\.shelfHelp : undefined\}/);
    expect(onboarding).toMatch(/router\.push\(RECENTLY_DELETED_HREF as Href\)/);
  });
  it('counts the letters on the shelf with listDeleted(), not as books again (CPrivO-56)', () => {
    // Read as listDeletedBooks(), a shelf that holds only Asha's deleted letters would count no letters and hide the row.
    expect(onboarding).toMatch(/const letters = listDeleted\(\);/);
    expect(onboarding).not.toMatch(/const letters = listDeletedBooks\(\);/);
    expect(onboarding.match(/listDeletedBooks\(\)/g)).toHaveLength(1);
  });
  it('keeps the finish guard intact', () => {
    expect(onboarding).toMatch(/runFinishOnce\(/);
    expect(onboarding).toMatch(/booksMade\.current = true;/);
  });
});
