/// <reference types="node" />
/**
 * NS-43 (card 19, "Setting up the first book"), the phone half of R1, R2, R3, R4 and R7 (BL-1164): the birthday, the
 * name and the signs-as on the first book, and why Continue waits for each. The rules run here as pure functions
 * (components/onboarding/child-step.logic.ts, packages/core child.ts), the books are made on a real store over
 * node:sqlite, and the screen's use of them is pinned in its source (app/onboarding.tsx).
 *
 * The NX-31-R3 cases in first-run-child-name.test.ts already cover the "your child" fallback wherever a nameless book is
 * shown; R1 here proves the first-run path itself makes one book with an empty stored name.
 *
 * The server half of R3 and R4 is not here: it lives in supabase/tests (see the PR for what exists there).
 * Fictional family "Asha" only.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHILD_NAME_MAX, ENGINE_VERSION, SIGNS_AS_MAX, addDaysISO, clampText, nearLimit, textLength } from '@scribe/core';
import { firstRunBookNames, firstRunChildBlock, firstRunSignsAsBlock } from '../src/components/onboarding/child-step.logic';
import { dateRange } from '../src/components/child/date-field.logic';
import { letterHeader } from '../src/components/capture/review-view.logic';
import { copy, fill } from '../src/lib/copy';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

type Store = typeof import('../src/lib/store');
let store: Store;
let seq = 0;
const id = () => `0199a000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

async function openStore(): Promise<void> {
  vi.resetModules();
  store = (await import('../src/lib/store')) as Store;
  const { db } = nodeDb();
  const r = store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-11-20T09:00:00.000Z', newId: id });
  expect(r.ok).toBe(true);
}

/** What finish() in app/onboarding.tsx hands the store for the rows on screen. */
const firstRunBooks = (names: string[], birthday: string | null, signsAs: string) =>
  firstRunBookNames(names).map((name) => ({ name, birthday, dueDate: null, signsAs: signsAs.trim() }));

/** The screen's source without comments, so a pin is on code, never on a sentence about it. */
const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

const o = copy.onboarding;
const edit = copy.childrenExtra.edit;
const today = '2026-11-20';
const born = { expecting: false, dueDate: null, today };
const due = { expecting: true, birthday: null, today };

describe('[NS-43-R1] only the date is required', () => {
  beforeEach(openStore);

  it('[NS-43-R1] a birthday and no name: Continue is free and the last step makes one book with an empty stored name', () => {
    expect(firstRunChildBlock({ names: [''], birthday: '2026-03-01', ...born })).toBeNull();
    const made = store.addChildren(firstRunBooks(['   '], '2026-03-01', 'Mama'));
    expect(made).toHaveLength(1);
    expect(store.listChildren().map((c) => [c.name, c.birthday])).toEqual([['', '2026-03-01']]);
    expect(store.getActiveChildId()).toBe(made[0].id);
  });

  it('[NS-43-R1] "your child" is what the steps show for that book, and it is never what is stored', () => {
    expect(o.childFallback).toBe('your child');
    expect(screen).toContain('joinNames(names, o.childFallback)');
    expect(fill(o.finish.body, { child: o.childFallback })).toContain('your child');
    expect(firstRunBookNames([''])).toEqual(['']);
  });

  it('[NS-43-R1] nothing on the steps asks for a surname, gender, photo or contacts', () => {
    expect(screen).not.toMatch(/surname|familyName|family-name|gender|photo|image-?picker|contacts/i);
    // The one name field is a given name: the keyboard's suggestions never offer a surname.
    expect(screen).toContain('textContentType="givenName"');
    expect(screen).toContain('autoComplete="given-name"');
    // The only things a first book is made from: a name, the date and the signature.
    expect(screen).toMatch(/name: n,\s*birthday: expecting \? null : birthday,\s*dueDate: expecting \? dueDate : null,\s*signsAs: signsAs\.trim\(\),\s*\}/);
  });
});

describe('[NS-43-R2] a missing date says why', () => {
  beforeEach(openStore);

  it('[NS-43-R2] no birthday, or no due date: Continue waits with the reason in words', () => {
    expect(firstRunChildBlock({ names: [''], birthday: null, ...born })).toBe(fill(o.child.needBirthday, { child: o.childFallback }));
    expect(firstRunChildBlock({ names: ['Asha'], birthday: null, ...born })).toBe(fill(o.child.needBirthday, { child: 'Asha' }));
    expect(firstRunChildBlock({ names: ['Asha'], dueDate: null, ...due })).toBe(o.child.needDueDate);
  });

  it('[NS-43-R2] the reason is announced: a live region above Continue, the hint on Continue, and a spoken nudge', () => {
    expect(screen).toMatch(/block \? <ReasonLine text=\{block\}/);
    expect(screen).toMatch(/function ReasonLine[\s\S]*?accessibilityLiveRegion="polite"/);
    expect(screen).toMatch(/disabled=\{disabled\} label=\{cta\} accessibilityHint=\{block \?\? undefined\}/);
    expect(screen).toMatch(/const nudge = \(\) => \{\s*if \(!block\) return;\s*setNudged\(true\);\s*announce\(block\);/);
  });

  it('[NS-43-R2] no book is made while the date is missing', () => {
    const finish = screen.slice(screen.indexOf('const finish = () => {'), screen.indexOf('const finishOnce'));
    expect(finish.indexOf('if (childBlock) return;')).toBeGreaterThan(-1);
    expect(finish.indexOf('if (childBlock) return;')).toBeLessThan(finish.indexOf('addChildren('));
    expect(screen).toContain('const disabled = block !== null;');
    expect(store.listChildren()).toEqual([]);
  });
});

describe('[NS-43-R3] dates are real and in range on both ends', () => {
  it('[NS-43-R3] a birthday after today is refused with its line; today is accepted', () => {
    expect(firstRunChildBlock({ names: ['Asha'], birthday: addDaysISO(today, 1), ...born })).toBe(edit.birthdayFuture);
    expect(firstRunChildBlock({ names: ['Asha'], birthday: today, ...born })).toBeNull();
  });

  it('[NS-43-R3] a birthday before 1900-01-01, or not a real day, is refused with "That date doesn\'t look right"', () => {
    expect(firstRunChildBlock({ names: ['Asha'], birthday: '1899-12-31', ...born })).toBe(edit.dateInvalid);
    expect(firstRunChildBlock({ names: ['Asha'], birthday: '2026-02-30', ...born })).toBe(edit.dateInvalid);
    expect(firstRunChildBlock({ names: ['Asha'], birthday: '2026-13-01', ...born })).toBe(edit.dateInvalid);
    expect(firstRunChildBlock({ names: ['Asha'], birthday: 'not a day', ...born })).toBe(edit.dateInvalid);
    expect(firstRunChildBlock({ names: ['Asha'], birthday: '1900-01-01', ...born })).toBeNull();
  });

  it('[NS-43-R3] a due date before today, or more than 305 days ahead, is refused; today and 305 days ahead are accepted', () => {
    expect(firstRunChildBlock({ names: ['Asha'], dueDate: addDaysISO(today, -1), ...due })).toBe(edit.dueDateRange);
    expect(firstRunChildBlock({ names: ['Asha'], dueDate: addDaysISO(today, 306), ...due })).toBe(edit.dueDateRange);
    expect(firstRunChildBlock({ names: ['Asha'], dueDate: today, ...due })).toBeNull();
    expect(firstRunChildBlock({ names: ['Asha'], dueDate: addDaysISO(today, 305), ...due })).toBeNull();
  });

  it('[NS-43-R3] the picker never offers a day the step would refuse', () => {
    expect(dateRange('born', today)).toEqual({ min: '1900-01-01', max: today });
    expect(dateRange('due', today)).toEqual({ min: today, max: addDaysISO(today, 305) });
    expect(screen).toMatch(/\{\.\.\.dateRange\(expecting \? 'due' : 'born', today\)\}/);
  });
});

describe('[NS-43-R4] names in any script, never cut', () => {
  beforeEach(openStore);

  // 61 code points once NFC and trimming are done: "é" typed as e plus a combining accent is one code point after NFC.
  const decomposed61 = `  ${'é'.repeat(61)}  `;

  it('[NS-43-R4] 61 code points after NFC and trimming: Continue waits with the limit line, and no book would be made', () => {
    expect(textLength(decomposed61.trim())).toBe(61);
    const limit = fill(edit.nameLimit, { n: CHILD_NAME_MAX });
    expect(limit).toBe('A name can have up to 60 characters.');
    expect(firstRunChildBlock({ names: [decomposed61], birthday: '2026-03-01', ...born })).toBe(limit);
    expect(firstRunChildBlock({ names: ['Asha', 'a'.repeat(61)], birthday: '2026-03-01', ...born })).toBe(limit);
    expect(firstRunBookNames([decomposed61])).toEqual([]);
  });

  it('[NS-43-R4] the field never takes a 61st character silently: the limit line shows under it from near the limit up', () => {
    expect(clampText('a'.repeat(61), CHILD_NAME_MAX)).toBe('a'.repeat(60));
    expect(nearLimit(textLength('a'.repeat(60)), CHILD_NAME_MAX)).toBe(true);
    expect(screen).toMatch(/onChangeText=\{\(v\) => setNameAt\(i, v\)\}/);
    expect(screen).toMatch(/nearLimit\(textLength\(n\), CHILD_NAME_MAX\)\s*\?\s*fill\(o\.child\.nameLimit, \{ n: CHILD_NAME_MAX \}\)/);
  });

  it('[NS-43-R4] a name in any script up to 60 is stored exactly as typed, in NFC', () => {
    const names = [
      'आशा', // Devanagari
      'آشا', // Arabic, right to left
      'Ásha Nkéchi-Ōta', // Latin with diacritics, typed decomposed below
      '아샤', // Hangul
      'Asha 🌙', // with an emoji
      'अ'.repeat(60), // exactly 60 code points
    ];
    for (const typed of names) {
      const decomposed = typed.normalize('NFD');
      expect(clampText(decomposed, CHILD_NAME_MAX)).toBe(typed.normalize('NFC')); // the field keeps the whole name
      expect(firstRunChildBlock({ names: [decomposed], birthday: '2026-03-01', ...born })).toBeNull();
    }
    const made = store.addChildren(firstRunBooks(names.map((n) => n.normalize('NFD')), '2026-03-01', 'Mama'));
    expect(made.map((c) => c.name)).toEqual(names.map((n) => n.normalize('NFC')));
    expect(store.listChildren().map((c) => c.name)).toEqual(names.map((n) => n.normalize('NFC')));
    expect(Array.from(store.listChildren()[5].name)).toHaveLength(60);
  });
});

describe('[NS-43-R7] the signature before the first letter', () => {
  beforeEach(openStore);

  it('[NS-43-R7] an empty signs-as keeps Continue waiting with its reason, in number with the names', () => {
    expect(firstRunSignsAsBlock({ signsAs: '', child: 'Asha', many: false })).toBe(fill(o.signsAs.needSignsAs, { child: 'Asha' }));
    expect(firstRunSignsAsBlock({ signsAs: '   ', child: 'Asha', many: false })).toBe(fill(o.signsAs.needSignsAs, { child: 'Asha' }));
    expect(firstRunSignsAsBlock({ signsAs: '', child: 'Asha and Nila', many: true })).toBe(fill(o.signsAs.needSignsAsMany, { child: 'Asha and Nila' }));
  });

  it('[NS-43-R7] a signs-as over 30 code points keeps Continue waiting with the limit, not with "add what they call you"', () => {
    const limit = fill(edit.signsAsLimit, { n: SIGNS_AS_MAX });
    expect(limit).toBe('Up to 30 characters.');
    expect(firstRunSignsAsBlock({ signsAs: 'M'.repeat(31), child: 'Asha', many: false })).toBe(limit);
    expect(firstRunSignsAsBlock({ signsAs: ` ${'á'.repeat(31)} `, child: 'Asha', many: false })).toBe(limit);
    expect(firstRunSignsAsBlock({ signsAs: 'M'.repeat(30), child: 'Asha', many: false })).toBeNull();
    expect(firstRunSignsAsBlock({ signsAs: 'Mama', child: 'Asha', many: false })).toBeNull();
  });

  it('[NS-43-R7] the screen asks the same rule, and the field shows the limit line near the limit', () => {
    expect(screen).toMatch(/const signsAsBlock = firstRunSignsAsBlock\(\{ signsAs, child, many: namedCount > 1 \}\);/);
    expect(screen).toMatch(/step === 'signsAs' \? signsAsBlock/);
    expect(screen).toMatch(/onChangeText=\{\(v\) => setSignsAs\(clampText\(v, SIGNS_AS_MAX\)\)\}/);
    expect(screen).toMatch(/nearLimit\(textLength\(signsAs\), SIGNS_AS_MAX\) \? fill\(copy\.childrenExtra\.edit\.signsAsLimit, \{ n: SIGNS_AS_MAX \}\)/);
  });

  it('[NS-43-R7] a valid signs-as signs the first letter "From {signsAs}"', () => {
    const [asha] = store.addChildren(firstRunBooks(['Asha'], '2026-03-01', '  Amma  '));
    expect(store.getChild(asha.id)?.signsAs).toBe('Amma');
    store.saveEntry({
      id: '0199a5b0-0000-7000-8000-0000000000aa',
      kind: 'letter',
      occurredOn: '2026-11-20',
      capturedAt: '2026-11-20T19:00:00.000Z',
      captureMode: 'typed',
      editLevel: 'verbatim',
      promptKey: null,
      engineVersion: ENGINE_VERSION,
      rawTranscript: 'Asha, you laughed at the rain today.',
      machineEdits: [],
      finalText: 'Asha, you laughed at the rain today.',
      inBook: true,
      soundsLikeMe: null,
    });
    const [first] = store.listEntriesForChild(asha.id);
    expect(first.authorSignsAs).toBe('Amma');
    expect(letterHeader({ childName: asha.name, signsAs: first.authorSignsAs!, month: 8 }).from).toBe('From Amma');
  });
});
