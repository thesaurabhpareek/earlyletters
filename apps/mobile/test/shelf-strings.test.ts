/// <reference types="node" />
/**
 * D-085: every string the shelf, the delete confirm, the export row and the
 * unplayable-take row use exists, and the screens use only strings that exist.
 * (The content rules test covers the wording of every string: no dashes, no
 * fear, no counting of gaps.)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';

const src = (f: string) => readFileSync(join(__dirname, '../src', f), 'utf8');
const d = en.settings.delete as Record<string, string>;
const x = en.settings.export as Record<string, string>;
const r = en.settings.recordings as Record<string, string>;

describe('shelf strings', () => {
  // Words from D-085, as the experience pass rewrote them (EXPERIENCE_PASS_2026-10 S38, S39; P0 with option B, D-100).
  // restoredToast took its new words with P5, which fills {child} on this screen.
  it('[D-085] has every delete, shelf and erase string, with the exact words the decision names', () => {
    expect(d.keepButton).toBe('Keep it');
    expect(d.shelfHelp).toBe('Letters you delete wait here for 30 days.');
    expect(d.shelfEmpty).toBe('No deleted letters.');
    expect(d.erasesOn).toBe('Kept here until {date}');
    expect(d.eraseNow).toBe('Erase now');
    expect(d.eraseNowTitle).toBe('Erase this letter now?');
    expect(d.eraseNowBody).toBe('The letter and its recording are erased from this phone. Backups and exports you already saved are not changed.');
    expect(d.restoredToast).toBe("Back in {child}'s book.");
    for (const k of ['entryTitle', 'entryBody', 'entryConfirm', 'recentlyDeleted', 'restoreButton', 'deletedOn']) expect(d[k], k).toBeTruthy();
  });

  it('[D-085] has the last export strings and says "prepared", never "backed up"', () => {
    expect(x.lastExport).toBe('Last export: {date}');
    expect(x.neverExported).toBe('Not exported yet');
    expect(x.exportNudge).toBe('Save a copy of your book in Files or iCloud Drive. It is yours to keep.');
  });

  it('[D-085] says an unplayable recording is kept and Export keeps the file', () => {
    expect(r.unplayableOne).toBe('This recording may not play. Export keeps the file.');
    expect(r.unplayableMany).toContain('{count}');
  });

  it('screens use only strings that exist', () => {
    const used = (file: string, name: string) => [...src(file).matchAll(new RegExp(`\\b${name}\\.(\\w+)`, 'g'))].map((m) => m[1]);
    // BL-442: a name the screens use must resolve to a non-empty string (not 0, a number, an object or a space),
    // and each screen must use some, or the loops below prove nothing.
    const nonEmpty = (v: unknown, label: string) => {
      expect(typeof v, label).toBe('string');
      expect((v as string).trim().length, label).toBeGreaterThan(0);
    };
    const deleted = used('app/settings/recently-deleted.tsx', 'd');
    const exported = used('app/settings/export.tsx', 'e');
    const inLetter = [...src('app/letter/[id].tsx').matchAll(/copy\.settings\.delete\.(\w+)/g)].map((m) => m[1]);
    expect(deleted.length, 'recently-deleted uses d.*').toBeGreaterThan(0);
    expect(exported.length, 'export uses e.*').toBeGreaterThan(0);
    expect(inLetter.length, 'letter uses copy.settings.delete.*').toBeGreaterThan(0);
    for (const k of deleted) nonEmpty(d[k], `recently-deleted d.${k}`);
    for (const k of exported) nonEmpty(x[k] ?? (en.settings.export as Record<string, unknown>)[k], `export e.${k}`);
    for (const k of inLetter) nonEmpty(d[k], `letter delete.${k}`);
  });

  // D-085: deleting moves a letter to Recently deleted for 30 days, and the ordinary book export does not read it.
  // BL-446 / DATA-REQ-053: while an account-deletion request is open (and only then) the export also holds the
  // Recently deleted letters. So device.ts may name the deleted-letter reader in exactly two places: its import and the
  // `deleted:` slot of the exportScope(...) call, and scope.logic.ts must read it only when requestOpen is true. An
  // unconditional read anywhere else in device.ts (or an ungated read in scope.logic.ts) still fails here.
  it('[D-085] the book export reads no deleted letters unless a deletion request is open', () => {
    const device = src('lib/export/device.ts');
    const rest = device
      .replace(/^import[^\n]*\n/gm, '')
      .replace(/exportScope\(\s*\{[^}]*\},\s*requestOpen,?\s*\)/, '');
    expect(rest, 'device.ts reads deleted letters outside exportScope(..., requestOpen)').not.toMatch(/listDeleted/);
    expect(device).toMatch(/exportScope\(\s*\{[^}]*deleted: listDeletedEntriesForChild[^}]*\},\s*requestOpen/);
    expect(src('lib/export/scope.logic.ts')).toMatch(/requestOpen \? \[\.\.\.r\.live\(b\.book\.id\), \.\.\.r\.deleted\(b\.book\.id\)\] : r\.live\(b\.book\.id\)/);
  });
});
