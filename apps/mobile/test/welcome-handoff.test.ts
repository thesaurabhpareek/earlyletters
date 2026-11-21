/// <reference types="node" />
/**
 * First run's welcome hands over to the Book once a book is on this phone (EXPERIENCE_PASS_2026-10 5.8 rows 12 and
 * 13), only while the welcome itself or the sign-in sheet over it is in front (an allow-list,
 * components/family/welcome-handoff.logic.ts, read by P2's app/onboarding.tsx). Never from under the join sheet
 * (S59), and never from any other screen once the person has moved on: a welcome left in the stack must not pull
 * Tonight, the Family tab, Write or Settings back to the Book (lens B on #314). Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { firstRunWelcome, welcomeMayLeave } from '../src/components/family/welcome-handoff.logic';
import { welcomeHandoffStep } from '../src/lib/first-run/handoff.logic';

const code = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

describe('[5.8 rows 12 and 13] the welcome hands over only while it, or the sign-in sheet over it, is in front', () => {
  it('the welcome in front (the joiner closed the sheet, or Open closed it onto the welcome): the hand-off runs', () => {
    expect(welcomeMayLeave('welcome', '/onboarding')).toBe(true);
    const effect = code('app/onboarding.tsx');
    expect(effect).toMatch(/const handoffStep = welcomeHandoffStep\(\{ start, step \}\);\s*const pathname = usePathname\(\);\s*useEffect\(\(\) => \{\s*if \(!welcomeMayLeave\(handoffStep, pathname\)\) return;\s*const done = \(\) => \{\s*if \(listChildren\(\)\.length > 0\) router\.replace\('\/book'\);\s*\};\s*done\(\);\s*return subscribe\(done\);\s*\}, \[handoffStep, pathname\]\);/);
  });

  it('"I already have a book": the sign-in sheet and its steps in front, so a returning parent lands on the Book (row 13)', () => {
    for (const path of ['/sign-in', '/sign-in/email', '/sign-in/code', '/sign-in/verify', '/sign-in/consent']) expect(welcomeMayLeave('welcome', path), path).toBe(true);
  });

  it('the join sheet in front: the welcome waits for Open or Close (S59)', () => {
    for (const path of ['/invite', '/invite/new', '/invite/leave']) expect(welcomeMayLeave('welcome', path), path).toBe(false);
  });

  it('anywhere else, a welcome still under the tabs never pulls the person back to the Book', () => {
    for (const path of ['/', '/book', '/family', '/settings', '/settings/account', '/write', '/listen', '/review', '/letter/x', '/read-together', '/plus', '/sign-inx', '/onboardingx']) {
      expect(welcomeMayLeave('welcome', path), path).toBe(false);
    }
  });

  it('any step after the welcome: none (first run makes its own book)', () => {
    for (const step of ['promise', 'child', 'signsAs', 'finish']) {
      for (const path of ['/onboarding', '/sign-in', '/invite']) expect(welcomeMayLeave(step, path), `${step} ${path}`).toBe(false);
    }
  });
});

describe('[NX-31-R17] a returning account\'s book hands over from the promise step (never a second book)', () => {
  it('signed in on the promise step (not yet moved on), a book arriving hands over, with the sign-in sheet or first run in front', () => {
    const asked = welcomeHandoffStep({ start: 'promise', step: 'promise' });
    expect(asked).toBe('welcome');
    for (const path of ['/onboarding', '/sign-in', '/sign-in/consent']) expect(welcomeMayLeave(asked, path), path).toBe(true);
  });
  it('the mapped step is the signed-in start step only: the child step, the signature and the last step never hand over', () => {
    for (const step of ['child', 'signsAs', 'finish'] as const) {
      for (const path of ['/onboarding', '/sign-in', '/invite']) expect(welcomeMayLeave(welcomeHandoffStep({ start: 'promise', step }), path), `${step} ${path}`).toBe(false);
    }
    // Opened on the Welcome or the local start, the promise step is a step after the welcome as before: none.
    for (const start of ['welcome', 'child'] as const) expect(welcomeMayLeave(welcomeHandoffStep({ start, step: 'promise' }), '/onboarding'), start).toBe(false);
  });
  it('the join sheet and every other screen still wait, even for the signed-in start', () => {
    const asked = welcomeHandoffStep({ start: 'promise', step: 'promise' });
    for (const path of ['/invite', '/invite/new', '/invite/leave', '/', '/book', '/family', '/settings', '/write']) expect(welcomeMayLeave(asked, path), path).toBe(false);
  });
});

describe('[S59] the join sheet knows whether the welcome step is under it (lens A on #314)', () => {
  it('first run says when its welcome step is the one showing, and clears it when it leaves', () => {
    expect(firstRunWelcome.showing()).toBe(false);
    firstRunWelcome.set(true);
    expect(firstRunWelcome.showing()).toBe(true);
    firstRunWelcome.set(false);
    expect(firstRunWelcome.showing()).toBe(false);
    expect(code('app/onboarding.tsx')).toMatch(/useEffect\(\(\) => \{\s*firstRunWelcome\.set\(step === 'welcome'\);\s*return \(\) => firstRunWelcome\.set\(false\);\s*\}, \[step\]\);/);
  });
});
