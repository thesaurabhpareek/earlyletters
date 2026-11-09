/**
 * What is kept when a phone with a local-start book later signs in (NX-36 4.2, F02-REQ-019). Data model only, no screen.
 * The rule is PROPOSED (`product` and counsel to confirm): these tests pin the proposal so a change is a visible diff.
 */
import { describe, expect, it } from 'vitest';
import { mergeBack, type MergeBackInput } from '../src/lib/first-run/merge-back.logic';

const base: MergeBackInput = { consent: 'accepted', claim: 'keep', accountHasBook: false, localKeptLetters: 3, destination: null };
const run = (over: Partial<MergeBackInput>) => mergeBack({ ...base, ...over });

describe('[NX-31-R18] the merge-back rule after a local start', () => {
  it('[NX-31-R18] at sign-in nothing moves: consent comes first', () => {
    const r = run({ consent: 'pending', claim: 'pending' });
    expect(r).toMatchObject({ phase: 'askConsent', uploads: false, removesLocalBook: false, deletesLetters: false });
  });
  it('[NX-31-R18] declining the sensitive-data consent keeps the local book as it is, signed in, sync off', () => {
    expect(run({ consent: 'declined', claim: 'pending' })).toMatchObject({ phase: 'keepOnPhone', syncOn: false, uploads: false, removesLocalBook: false });
  });
  it('[NX-31-R18] after consent the claim screen is asked before anything is uploaded', () => {
    expect(run({ claim: 'pending' })).toMatchObject({ phase: 'askClaim', uploads: false, removesLocalBook: false });
  });
  it('[NX-31-R18] "Not my account" ends the session and leaves the phone as it was', () => {
    expect(run({ claim: 'notMine' })).toMatchObject({ phase: 'endSession', endsSession: true, uploads: false, removesLocalBook: false, deletesLetters: false });
  });
  it('[NX-31-R18] no account book: the local book becomes the account book', () => {
    expect(run({})).toMatchObject({ phase: 'becomeAccountBook', uploads: true, removesLocalBook: false });
  });
  it('[NX-31-R18] an account book and an empty local book: the account book opens and the empty local book is removed, with a sentence', () => {
    expect(run({ accountHasBook: true, localKeptLetters: 0 })).toMatchObject({ phase: 'openAccountBook', removesLocalBook: true, saysEmptyBookRemoved: true, uploads: false, deletesLetters: false });
  });
  it('[NX-31-R18] an account book and kept letters: the person chooses, nothing moves until they do', () => {
    expect(run({ accountHasBook: true })).toMatchObject({ phase: 'askDestination', uploads: false, removesLocalBook: false });
  });
  it('[NX-31-R18] the choice "In the existing book" or "As a second book" moves the letters and deletes nothing', () => {
    expect(run({ accountHasBook: true, destination: 'existing' })).toMatchObject({ phase: 'moveLetters', destination: 'existing', uploads: true, deletesLetters: false, removesLocalBook: false });
    expect(run({ accountHasBook: true, destination: 'new' })).toMatchObject({ phase: 'moveLetters', destination: 'new', uploads: true, deletesLetters: false });
  });
  it('[NX-31-R18] a letter already in the account book is not added twice', () => {
    expect(run({ accountHasBook: true, destination: 'existing' }).dedupeByLetterId).toBe(true);
  });
  it('[NX-31-R18] recordings stay on the phone in every outcome while backup is off', () => {
    for (const consent of ['pending', 'declined', 'accepted'] as const) for (const claim of ['pending', 'notMine', 'keep'] as const)
      for (const accountHasBook of [true, false]) for (const localKeptLetters of [0, 4]) for (const destination of [null, 'existing', 'new'] as const) {
        expect(mergeBack({ consent, claim, accountHasBook, localKeptLetters, destination }).recordingsLeavePhone).toBe(false);
      }
  });
  it('[NX-31-R18] nothing is ever uploaded before consent accepted and the claim kept, in any input', () => {
    for (const consent of ['pending', 'declined', 'accepted'] as const) for (const claim of ['pending', 'notMine', 'keep'] as const)
      for (const accountHasBook of [true, false]) for (const localKeptLetters of [0, 4]) for (const destination of [null, 'existing', 'new'] as const) {
        const r = mergeBack({ consent, claim, accountHasBook, localKeptLetters, destination });
        if (r.uploads) { expect(consent).toBe('accepted'); expect(claim).toBe('keep'); }
        expect(r.deletesLetters).toBe(false);
      }
  });
});
