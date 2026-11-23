/**
 * What is kept when a phone with a local-start book later signs in (NX-36 4.2, F02-REQ-019). Data model only, no screen.
 * The rule is PROPOSED (`product` and counsel to confirm): these tests pin the proposal so a change is a visible diff.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeBack, UNSHIPPED_PHASES, type MergeBackInput } from '../src/lib/first-run/merge-back.logic';

const base: MergeBackInput = { consent: 'accepted', claim: 'keep', accountHasBook: false, destination: null };
const run = (over: Partial<MergeBackInput>) => mergeBack({ ...base, ...over });

const CONSENTS = ['pending', 'declined', 'accepted'] as const;
const CLAIMS = ['pending', 'notMine', 'keep'] as const;
const DESTINATIONS = [null, 'existing', 'new'] as const;
/** Every input the rule can be asked: 3 x 3 x 2 x 3 = 54. */
const EVERY_INPUT: MergeBackInput[] = CONSENTS.flatMap((consent) => CLAIMS.flatMap((claim) =>
  [true, false].flatMap((accountHasBook) => DESTINATIONS.map((destination) => ({ consent, claim, accountHasBook, destination })))));

describe('[NX-31-R18] the merge-back rule after a local start', () => {
  it('[NX-31-R18] at sign-in nothing moves: consent comes first', () => {
    const r = run({ consent: 'pending', claim: 'pending' });
    expect(r).toMatchObject({ phase: 'askConsent', uploads: false });
  });
  it('[NX-31-R18] declining the sensitive-data consent keeps the local book as it is, signed in, sync off', () => {
    expect(run({ consent: 'declined', claim: 'pending' })).toMatchObject({ phase: 'keepOnPhone', syncOn: false, uploads: false });
  });
  it('[NX-31-R18] after consent the claim screen is asked before anything is uploaded', () => {
    expect(run({ claim: 'pending' })).toMatchObject({ phase: 'askClaim', uploads: false });
  });
  it('[NX-31-R18] "Not my account" ends the session and leaves the phone as it was', () => {
    expect(run({ claim: 'notMine' })).toMatchObject({ phase: 'endSession', endsSession: true, uploads: false, syncOn: false });
  });
  it('[NX-31-R18] no account book: the local book becomes the account book', () => {
    expect(run({})).toMatchObject({ phase: 'becomeAccountBook', uploads: true });
  });
  it('[NX-31-R18] an account book: the person chooses, nothing moves until they do, whatever the local book holds', () => {
    expect(run({ accountHasBook: true })).toMatchObject({ phase: 'askDestination', uploads: false });
  });
  it('[NX-31-R18] the choice "In the existing book" or "As a second book" moves the letters', () => {
    expect(run({ accountHasBook: true, destination: 'existing' })).toMatchObject({ phase: 'moveLetters', destination: 'existing', uploads: true });
    expect(run({ accountHasBook: true, destination: 'new' })).toMatchObject({ phase: 'moveLetters', destination: 'new', uploads: true });
  });
  it('[NX-31-R18] a letter already in the account book is not added twice', () => {
    expect(run({ accountHasBook: true, destination: 'existing' }).dedupeByLetterId).toBe(true);
  });
  it('[NX-31-R18] no outcome can remove a book, however few kept letters the phone shows (a count is not emptiness)', () => {
    // The shape is the guard: a result with a field that could say "remove" or "delete" would be a visible diff here.
    // The input has no kept-letter count either, so a count cannot decide anything.
    const shape = Object.keys(mergeBack(base)).sort();
    expect(shape).toEqual(['dedupeByLetterId', 'destination', 'endsSession', 'phase', 'syncOn', 'uploads']);
    expect(Object.keys(base).sort()).toEqual(['accountHasBook', 'claim', 'consent', 'destination']);
    for (const input of EVERY_INPUT) {
      expect(Object.keys(mergeBack(input)).sort()).toEqual(shape);
      expect(mergeBack(input).phase).not.toBe('openAccountBook');
    }
  });
  it('[NX-31-R18] nothing is ever uploaded before consent accepted and the claim kept, in any input', () => {
    let uploading = 0;
    for (const input of EVERY_INPUT) {
      const r = mergeBack(input);
      if (r.uploads) {
        uploading += 1;
        expect(input.consent).toBe('accepted');
        expect(input.claim).toBe('keep');
      }
    }
    // The loop reaches the uploading outcomes (kept, account with or without a book), so the guard above can fail.
    expect(uploading).toBeGreaterThan(0);
  });
  // `deletesLetters` and `recordingsLeavePhone` used to be literal-false fields, asserted false. A constant cannot fail,
  // so they are gone: this rule is a data model, and an app that uploads audio or deletes a letter would not be caught by
  // it. That belongs to the tests of the code that uploads (sync) and deletes (store), not to a flag here.
  it('[NX-31-R18] Build 12 does not ship the existing-book phases, and says so', () => {
    expect([...UNSHIPPED_PHASES].sort()).toEqual(['askDestination', 'moveLetters']);
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'first-run', 'merge-back.logic.ts'), 'utf8');
    expect(src).toMatch(/NOT shipped/);
    expect(src).toMatch(/SECOND book/);
    // No code (comments stripped) names a removal or a deletion.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/remove|delete|openAccountBook|KeptLetters/i);
  });
});
