/// <reference types="node" />
/**
 * BL-458 pins (S3-x, S6-g). The refused-Save line clears when the person types again, and the shelf reads itself again
 * after an Erase now, kept or not, so a card that has already left never lingers and says nothing. The screens cannot
 * be mounted here, so they are pinned by source, sliced to the function so a missing anchor fails the test. The Book's
 * first-mount subscribe window (BL-458 part 3) is not covered here: it needs a store change first (mobile owns it).
 * Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = (f: string) => readFileSync(join(__dirname, '../src', f), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const between = (s: string, from: string, to: string) => {
  const a = s.indexOf(from);
  const b = s.indexOf(to, a + 1);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return s.slice(a, b);
};

describe('[BL-458] the refused-Save line clears on typing (S3-x)', () => {
  const sheet = between(code(src('app/letter/[id].tsx')), 'function WordsSheet(', 'function ReadItBackCard(');

  it('the typed-words field stores the text and clears the line in the same handler', () => {
    const field = between(sheet, '<TextField', '/>');
    expect(field).toMatch(/onChangeText=\{\(v\) => \{\s*setText\(v\);\s*setRefused\(false\);\s*\}\}/);
  });

  it('only a refused Save raises the line, and it is shown from that state', () => {
    expect(sheet.match(/setRefused\(true\)/g)).toHaveLength(1);
    expect(sheet.match(/setRefused\(false\)/g)).toHaveLength(1);
    expect(sheet).toMatch(/\{refused \? \(\s*<Text[^>]*testID="letter\.writeWords\.refused">/);
  });
});

describe('[BL-458] the shelf after an Erase now (S6-g)', () => {
  const erase = between(code(src('app/settings/recently-deleted.tsx')), 'const erase = () => {', 'const restoreTheBook');

  it('reads the shelf again and shows it, before the outcome is judged from that read', () => {
    const order = ['const done = eraseDeletedLetter(id);', 'const left = read();', 'setRows(left);', 'const outcome = eraseOutcome(done, left.some('].map((s) => erase.indexOf(s));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(erase.match(/setRows\(/g)).toHaveLength(1);
  });

  it('says nothing when the card has already left: a toast only for erased and kept', () => {
    expect(erase.match(/toast\.show\(/g)).toHaveLength(2);
    expect(erase).not.toMatch(/'gone'/);
    expect(erase).not.toMatch(/else\s*toast|else\s*\{/);
  });
});
