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
  it('[D-085] has every delete, shelf and erase string, with the exact words the decision names', () => {
    expect(d.keepButton).toBe('Keep it');
    expect(d.shelfHelp).toBe('Letters you delete wait here for 30 days.');
    expect(d.shelfEmpty).toBe('Nothing here. Letters you delete wait here for 30 days.');
    expect(d.erasesOn).toBe('Erased on {date}');
    expect(d.eraseNow).toBe('Erase now');
    expect(d.eraseNowTitle).toBe('Erase this letter now?');
    expect(d.eraseNowBody).toBe('The letter and its recording will be erased from this phone, at once.');
    expect(d.restoredToast).toBe('Letter restored.');
    for (const k of ['entryTitle', 'entryBody', 'entryConfirm', 'recentlyDeleted', 'restoreButton', 'deletedOn']) expect(d[k], k).toBeTruthy();
  });

  it('[D-085] has the last export strings and says "prepared", never "backed up"', () => {
    expect(x.lastExport).toBe('Last export: {date}');
    expect(x.neverExported).toBe('Not exported yet');
    expect(x.exportNudge).toBe('Save a copy of your book in Files or iCloud Drive. It is yours to keep.');
  });

  it('[D-085] says an unplayable take is kept and Export keeps the file', () => {
    expect(r.unplayableOne).toBe('This take may not play. Export keeps the file.');
    expect(r.unplayableMany).toContain('{count}');
  });

  it('screens use only strings that exist', () => {
    const used = (file: string, name: string) => [...src(file).matchAll(new RegExp(`\\b${name}\\.(\\w+)`, 'g'))].map((m) => m[1]);
    for (const k of used('app/settings/recently-deleted.tsx', 'd')) expect(d[k], `recently-deleted d.${k}`).toBeTruthy();
    for (const k of used('app/settings/export.tsx', 'e')) expect(x[k] ?? (en.settings.export as Record<string, unknown>)[k], `export e.${k}`).toBeTruthy();
    for (const k of [...src('app/letter/[id].tsx').matchAll(/copy\.settings\.delete\.(\w+)/g)].map((m) => m[1])) expect(d[k], `letter delete.${k}`).toBeTruthy();
  });

  it('[D-085] the book export reads no deleted letters', () => {
    expect(src('lib/export/device.ts')).not.toMatch(/listDeleted/);
  });
});
