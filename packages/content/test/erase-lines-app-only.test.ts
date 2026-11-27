/**
 * BL-781 (LEGAL-REQ-044; D-144, CCO-6): the four Erase everything lines are used in the app only for now. Whether
 * they may be used anywhere else is the founder's open question under D-144, so until he decides, no public surface
 * says them: the App Store listing (`store.en.ts`) and the live website copy (`apps/web/src/content/site.ts`, read
 * as text). BL-556 removed the unrendered website copy sources (`site.en.ts`, `pages.en.ts`). Each line is checked whole and sentence by
 * sentence, so "We hold no copy." or "Nothing is sent anywhere." alone is caught too.
 * Claims inventory rows: docs/reviews/2026-10-claims-inventory.md, section 3g (X1 to X4).
 *
 * Read only: this test never writes to any of these files. A failure names the surface and the line's key, never
 * the surface's text.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { en, storeListing } from '../src';
import { leaves } from './support/copy-surfaces';

const e = en.settings.erase;
const LINES = { body: e.body, onThisPhone: e.onThisPhone, freeLetters: e.freeLetters, backups: e.backups } as const;

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
const sentences = (line: string) => line.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);

const WEB_SITE = fileURLToPath(new URL('../../../apps/web/src/content/site.ts', import.meta.url));

const SURFACES: Record<string, string> = {
  'store.en.ts': norm(leaves(storeListing).map((l) => l.text).join('\n')),
  'apps/web/src/content/site.ts': norm(readFileSync(WEB_SITE, 'utf8')),
};

describe('[BL-781][D-144] the four Erase everything lines stay in the app only', () => {
  it('reads every surface (none is empty, so the scan below cannot pass by reading nothing)', () => {
    for (const [name, text] of Object.entries(SURFACES)) expect(text.length, name).toBeGreaterThan(1000);
  });

  it('the four lines are the ones the Erase everything screen shows, and each has a sentence to look for', () => {
    expect(Object.keys(LINES)).toEqual(['body', 'onThisPhone', 'freeLetters', 'backups']);
    for (const [key, line] of Object.entries(LINES)) expect(sentences(line).length, key).toBeGreaterThan(0);
    // The two lines with two sentences each, split as the scan splits them.
    expect(sentences(e.body)).toHaveLength(2);
    expect(sentences(e.onThisPhone)).toHaveLength(2);
  });

  it('no public surface contains any of the four lines, whole or any one sentence of them', () => {
    const hits: string[] = [];
    for (const [surface, text] of Object.entries(SURFACES)) {
      for (const [key, line] of Object.entries(LINES)) {
        for (const needle of [line, ...sentences(line)]) if (text.includes(norm(needle))) hits.push(`${surface}: settings.erase.${key}`);
      }
    }
    expect([...new Set(hits)]).toEqual([]);
  });
});
