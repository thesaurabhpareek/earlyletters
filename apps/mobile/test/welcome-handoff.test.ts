/// <reference types="node" />
/**
 * First run's welcome hands over to the Book once a book is on this phone (EXPERIENCE_PASS_2026-10 5.8 rows 12 and
 * 13), but never from under the join sheet (S59): a first-time joiner sees the cover open, signs, and lands on the
 * Book from "Open the book" (components/family/welcome-handoff.logic.ts, read by P2's app/onboarding.tsx).
 * Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { welcomeMayLeave } from '../src/components/family/welcome-handoff.logic';

const code = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

describe('[S59, 5.8 row 12] the welcome waits while the join sheet is in front', () => {
  it('welcome with /invite in front: no hand-off, whatever the store holds', () => {
    expect(welcomeMayLeave('welcome', '/invite')).toBe(false);
    expect(welcomeMayLeave('welcome', '/invite/new')).toBe(false);
  });

  it('welcome in front, or the joiner closed the sheet: the hand-off runs, and goes to the Book once a book is here', () => {
    expect(welcomeMayLeave('welcome', '/onboarding')).toBe(true);
    const effect = code('app/onboarding.tsx');
    expect(effect).toMatch(/const pathname = usePathname\(\);\s*useEffect\(\(\) => \{\s*if \(!welcomeMayLeave\(step, pathname\)\) return;\s*const done = \(\) => \{\s*if \(listChildren\(\)\.length > 0\) router\.replace\('\/book'\);\s*\};\s*done\(\);\s*return subscribe\(done\);\s*\}, \[step, pathname\]\);/);
  });

  it('"Open the book" already landed on the Book: it is never replaced a second time (the joined mark and its light stay)', () => {
    expect(welcomeMayLeave('welcome', '/book')).toBe(false);
  });

  it('any step after the welcome: none (first run makes its own book)', () => {
    for (const step of ['promise', 'child', 'signsAs', 'finish']) {
      expect(welcomeMayLeave(step, '/onboarding'), step).toBe(false);
      expect(welcomeMayLeave(step, '/invite'), step).toBe(false);
    }
  });
});

describe('[5.8 row 13] "I already have a book" still hands over from under the sign-in sheet', () => {
  it('the sign-in sheet and its steps in front: the hand-off runs, so a returning parent lands on the Book', () => {
    for (const path of ['/sign-in', '/sign-in/email', '/sign-in/code', '/sign-in/verify', '/sign-in/consent']) expect(welcomeMayLeave('welcome', path), path).toBe(true);
  });
});
