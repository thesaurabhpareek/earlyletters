/**
 * [BL-385] First run never invents a birthday (D-087): a seven-month-old can not become "0 days" by tapping Continue.
 * Pure rules run in Node; the wiring is read from source so a default put back in the screen fails here.
 * Siblings made together share the one date entered (first run, by design); each is checked against it. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkBirthday } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { firstRunBookNames, firstRunChildBlock } from '../src/components/onboarding/child-step.logic';
import { copy, fill } from '../src/lib/copy';

const read = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const today = '2026-10-07';
const base = { names: ['Asha'], expecting: false, birthday: null as string | null, dueDate: null as string | null, today };

describe('[BL-385] Continue waits until a date is chosen', () => {
  it('no birthday: the child step is blocked, with the reason that names the child', () => {
    expect(firstRunChildBlock(base)).toBe(fill(copy.onboarding.child.needBirthday, { child: 'Asha' }));
  });

  it('today is not assumed: only a date handed in lets the step through, and today itself is a valid pick', () => {
    expect(firstRunChildBlock({ ...base, birthday: today })).toBeNull();
    expect(firstRunChildBlock({ ...base, birthday: '2026-03-14' })).toBeNull();
    expect(checkBirthday(null, today).ok).toBe(false);
  });

  it('a due date does not stand in for a birthday, and a birthday does not stand in for a due date', () => {
    expect(firstRunChildBlock({ ...base, dueDate: '2026-12-01' })).not.toBeNull();
    expect(firstRunChildBlock({ ...base, expecting: true, birthday: '2026-03-14' })).toBe(copy.onboarding.child.needDueDate);
  });

  it('twins: every book waits on the one date, and each name is kept as typed', () => {
    const twins = { ...base, names: ['Asha', 'Nila'] };
    expect(firstRunChildBlock(twins)).not.toBeNull();
    expect(firstRunChildBlock({ ...twins, birthday: '2026-03-14' })).toBeNull();
    expect(firstRunBookNames(twins.names)).toEqual(['Asha', 'Nila']);
  });

  it('a date in the future is refused with its own line', () => {
    expect(firstRunChildBlock({ ...base, birthday: '2026-10-08' })).toBe(copy.childrenExtra.edit.birthdayFuture);
  });
});

describe('[BL-385] wiring: no value is made up on the way to the book', () => {
  const screen = code('app/onboarding.tsx');

  it('the birthday state starts empty, not at today', () => {
    expect(screen).toMatch(/useState<string \| null>\(saved\?\.birthday \?\? null\)/);
    expect(screen).not.toMatch(/useState[^;]*\bbirthday\b[^;]*todayISO/);
    expect(screen).not.toMatch(/setBirthday\(\s*(?:todayISO\(\)|new Date)/);
  });

  it('the only place the screen sets today as the birthday is the "Born today" chip tap', () => {
    const sets = [...screen.matchAll(/setBirthday\(([^)]*)\)/g)].map((m) => m[1]);
    expect(sets.filter((s) => s.includes('today'))).toEqual(['today']);
    expect(screen).toMatch(/<Chip label=\{o\.child\.bornToday\} onPress=\{\(\) => setBirthday\(today\)\} \/>/);
  });

  it('finish stops while the child step is waiting, and writes the date as entered, with no fallback', () => {
    expect(screen).toMatch(/if \(childBlock\) return;/);
    expect(screen).toMatch(/birthday: expecting \? null : birthday,/);
    expect(screen).not.toMatch(/birthday:[^\n]*(\?\?|\|\|)/);
  });

  it('the date control is handed the stored value as is and starts the sheet at today without choosing it', () => {
    expect(screen).toMatch(/value=\{expecting \? dueDate : birthday\}/);
    const field = code('components/child/date-field.tsx');
    // The picker's start day is only where the wheel opens; a value reaches the screen only through onChange.
    expect(field).toMatch(/value === null \? \(/);
    expect(field).not.toMatch(/useEffect\([^)]*onChange/);
  });
});
