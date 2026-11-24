/// <reference types="node" />
/**
 * [BL-1562] (the phone half of BL-1464) The Keep the book re-offer after the third letter opens the sign-in sheet with
 * `third_letter`, so `auth_deferred` says which of the two offers it was (the sheet being shown is the `sign_in` screen view, BL-2175). The values are enums:
 * no entry text, transcript or child name is in any property. Source tests for the screens (React Native does not
 * render in Node), a real import for the trigger parser. The asks store behaviour is in asks-keep-book-store.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { authCopy } from '@scribe/content';

vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: { getItem: vi.fn(async () => null), setItem: vi.fn(async () => undefined), removeItem: vi.fn(async () => undefined) },
}));

import { asSignInTrigger } from '../src/lib/auth/pending';

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const read = (...p: string[]) => code(readFileSync(join(SRC, ...p), 'utf8'));
const sheet = read('app', '(auth)', 'sign-in', 'index.tsx');
const review = read('app', 'review.tsx');

describe('[BL-1562] the trigger parser knows third_letter', () => {
  it('keeps third_letter, and still turns an unknown value into settings', () => {
    expect(asSignInTrigger('third_letter')).toBe('third_letter');
    expect(asSignInTrigger('first_letter')).toBe('first_letter');
    expect(asSignInTrigger('a child name')).toBe('settings');
    expect(asSignInTrigger(undefined)).toBe('settings');
  });
});

describe('[BL-1562] the sheet treats third_letter as the same ask as first_letter', () => {
  it('has words for it, the same two sentences, so there is no new customer line', () => {
    expect(authCopy.sheet.titles.third_letter).toBe(authCopy.sheet.titles.first_letter);
    expect(authCopy.sheet.bodies.third_letter).toBe(authCopy.sheet.bodies.first_letter);
  });
  it('shows the small cover beside the title, as the first offer does', () => {
    expect(sheet).toMatch(/const ABOUT_THIS_BOOK: readonly SignInTrigger\[\] = \['first_letter', 'third_letter', 'settings', 'invite_create'\]/);
  });
  it("counts as this session's one ask, as the first offer does", () => {
    expect(sheet).toMatch(/if \(trigger === 'first_letter' \|\| trigger === 'third_letter'\) noteAskShown\(\)/);
  });
  it('reports the trigger and nothing else on the one event the sheet sends', () => {
    expect(sheet).not.toMatch(/auth_sheet_shown/);
    expect(sheet).toMatch(/track\('onboarding:sign_in_dismiss', \{ trigger \}\)/);
  });
});

describe('[BL-1562] Review opens the sheet with the trigger lib/asks names', () => {
  it('passes keepBookTrigger() and no longer hard-codes first_letter for both offers', () => {
    expect(review).toMatch(/params: \{ trigger: keepBookTrigger\(\) \}/);
    expect(review).not.toMatch(/trigger: 'first_letter'/);
    expect(review).toMatch(/import \{[^}]*\bkeepBookTrigger\b[^}]*\} from '@\/lib\/asks'/);
  });
});
