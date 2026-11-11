/**
 * Account-first slice 4a: a new account goes straight to the promise and child steps, a returning one with no book keeps
 * "No book here yet", and a claim into an account that has a book adds a second book and deletes nothing. Pure logic plus
 * source patterns for the screens. Fictional family Asha only.
 * Exec council 9 Nov 2026, A and D; NX-31 R12; NX-38 R6; docs/content/RETURNING-AND-NEW-PHONE-WORDS-9nov.md.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy, en } from '@scribe/content';
import {
  ACCOUNT_BOOKS_WAIT_MS,
  afterConsent,
  claimKeepOutcome,
  claimWords,
  classifyAccountBooks,
  keepEnabled,
  kindFromRpc,
  settleWithin,
  signedInLine,
  spokenMaskedEmail,
  type AccountKind,
  type Scheduler,
} from '../src/lib/first-run/account-books.logic';
import { readAccountBooks } from '../src/lib/first-run/account-books';
import { mergeBack } from '../src/lib/first-run/merge-back.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const BOOK = { id: 'b1', role: 'parent', name: 'Asha' };

/** A scheduler the test drives by hand, so no real timer runs. */
function manual(): Scheduler & { fire: () => void; cleared: number; pending: () => boolean } {
  let fn: (() => void) | null = null;
  let cleared = 0;
  return {
    set: (f) => ((fn = f), 1),
    clear: () => {
      cleared++;
      fn = null;
    },
    fire: () => fn?.(),
    get cleared() {
      return cleared;
    },
    pending: () => fn !== null,
  } as Scheduler & { fire: () => void; cleared: number; pending: () => boolean };
}

describe('[NX-31-R12] new account, or returning with no book (sync_books first_run_open)', () => {
  it('first_run_open true and no books is a new account', () => {
    expect(classifyAccountBooks({ epoch: 1, first_run_open: true, books: [] })).toBe('new');
  });
  it('first_run_open false and no books is a returning account with no book', () => {
    expect(classifyAccountBooks({ epoch: 1, first_run_open: false, books: [] })).toBe('returningNoBook');
  });
  it('any book means the account has a book, whatever first_run_open says', () => {
    expect(classifyAccountBooks({ first_run_open: true, books: [BOOK] })).toBe('hasBook');
    expect(classifyAccountBooks({ first_run_open: false, books: [BOOK] })).toBe('hasBook');
  });
  it('an answer that cannot be read is unknown, never new', () => {
    for (const bad of [null, undefined, 'x', 3, [], {}, { books: [] }, { first_run_open: true }, { first_run_open: 'true', books: [] }, { first_run_open: true, books: 'none' }, { first_run_open: null, books: [] }]) {
      expect(classifyAccountBooks(bad)).toBe('unknown');
    }
  });
  it('after consent only a clear new account or an account with a book closes; every other answer shows No book here yet', () => {
    const table: Record<AccountKind, string> = { new: 'close', hasBook: 'close', returningNoBook: 'noBook', unknown: 'noBook' };
    for (const k of Object.keys(table) as AccountKind[]) expect(afterConsent(k)).toBe(table[k]);
  });
  it('an rpc error is unknown even when it carries data that looks new', () => {
    expect(kindFromRpc({ ok: true, value: { data: { first_run_open: true, books: [] }, error: { message: 'boom' } } })).toBe('unknown');
    expect(kindFromRpc({ ok: true, value: { data: { first_run_open: true, books: [] }, error: null } })).toBe('new');
    expect(kindFromRpc({ ok: true, value: null })).toBe('unknown');
    expect(kindFromRpc({ ok: true, value: undefined })).toBe('unknown');
  });
  it('a timeout and a thrown call are unknown, so the screen is No book here yet', () => {
    expect(kindFromRpc({ ok: false, reason: 'timeout' })).toBe('unknown');
    expect(kindFromRpc({ ok: false, reason: 'error' })).toBe('unknown');
    expect(afterConsent(kindFromRpc({ ok: false, reason: 'timeout' }))).toBe('noBook');
  });
});

describe('[NX-31-R12] the call is bounded and never blocks the first screen', () => {
  it('waits no longer than the session gate timeout (10 seconds)', () => {
    expect(ACCOUNT_BOOKS_WAIT_MS).toBe(10_000);
    expect(src('lib/first-run/account-books.ts')).toContain('ACCOUNT_BOOKS_WAIT_MS');
    expect(src('app/(auth)/sign-in/consent.tsx')).not.toMatch(/accountHasBooks/);
  });
  it('an answer in time is returned and the timer is cleared', async () => {
    const s = manual();
    const r = await settleWithin(() => Promise.resolve(7), 10_000, s);
    expect(r).toEqual({ ok: true, value: 7 });
    expect(s.cleared).toBe(1);
    expect(s.pending()).toBe(false);
  });
  it('no answer when the timer fires is a timeout, and a late answer is ignored', async () => {
    const s = manual();
    let late!: (v: number) => void;
    const p = settleWithin(() => new Promise<number>((res) => (late = res)), 10_000, s);
    s.fire();
    expect(await p).toEqual({ ok: false, reason: 'timeout' });
    late(9);
    expect(await p).toEqual({ ok: false, reason: 'timeout' });
  });
  it('a rejection is an error, not a throw', async () => {
    const s = manual();
    expect(await settleWithin(() => Promise.reject(new Error('network')), 10_000, s)).toEqual({ ok: false, reason: 'error' });
    expect(s.cleared).toBe(1);
  });
  it('a call that throws before it returns a promise is an error, not a throw', async () => {
    const s = manual();
    expect(
      await settleWithin(
        () => {
          throw new Error('sync');
        },
        10_000,
        s,
      ),
    ).toEqual({ ok: false, reason: 'error' });
  });
  it('the real timer path settles a never-answering call within the wait', async () => {
    const r = await settleWithin(() => new Promise<number>(() => {}), 20);
    expect(r).toEqual({ ok: false, reason: 'timeout' });
  });
  it('the call is one sync_books rpc and nothing else is sent', () => {
    const t = src('lib/first-run/account-books.ts');
    expect(t).toContain("rpc('sync_books')");
    expect(t).not.toMatch(/\.from\(|\.insert|\.update|record_policy_act/);
  });
});

/** A fake Supabase client: only `rpc` exists, and it records the names it was asked for. */
function fakeClient(answer: () => unknown) {
  const calls: string[] = [];
  const sb = { rpc: (name: string) => (calls.push(name), answer()) };
  return { sb: sb as never, calls };
}

describe('[NX-31-R12] readAccountBooks against a fake client (fail-safe: only a clear new answer skips No book here yet)', () => {
  it('a new account (no books, first_run_open true) is new, and the one call is sync_books', async () => {
    const { sb, calls } = fakeClient(() => Promise.resolve({ data: { epoch: 1, first_run_open: true, books: [] }, error: null }));
    const kind = await readAccountBooks(sb, 1000);
    expect(kind).toBe('new');
    expect(calls).toEqual(['sync_books']);
    expect(afterConsent(kind)).toBe('close');
  });
  it('an account with a book is hasBook', async () => {
    const { sb } = fakeClient(() => Promise.resolve({ data: { epoch: 1, first_run_open: false, books: [BOOK] }, error: null }));
    expect(await readAccountBooks(sb, 1000)).toBe('hasBook');
  });
  it('a returning account with no book is returningNoBook and still sees No book here yet', async () => {
    const { sb } = fakeClient(() => Promise.resolve({ data: { first_run_open: false, books: [] }, error: null }));
    const kind = await readAccountBooks(sb, 1000);
    expect(kind).toBe('returningNoBook');
    expect(afterConsent(kind)).toBe('noBook');
  });
  it('an rpc error is unknown and shows No book here yet, even when the data looks new', async () => {
    const { sb } = fakeClient(() => Promise.resolve({ data: { first_run_open: true, books: [] }, error: { message: 'rate limited' } }));
    const kind = await readAccountBooks(sb, 1000);
    expect(kind).toBe('unknown');
    expect(afterConsent(kind)).toBe('noBook');
  });
  it('a rejected promise is unknown and does not throw', async () => {
    const { sb } = fakeClient(() => Promise.reject(new Error('network')));
    const kind = await readAccountBooks(sb, 1000);
    expect(kind).toBe('unknown');
    expect(afterConsent(kind)).toBe('noBook');
  });
  it('a call that throws synchronously is unknown and does not throw', async () => {
    const { sb } = fakeClient(() => {
      throw new Error('boom');
    });
    expect(await readAccountBooks(sb, 1000)).toBe('unknown');
  });
  it('no answer within the wait is unknown (timeout) and shows No book here yet', async () => {
    const { sb } = fakeClient(() => new Promise(() => {}));
    const kind = await readAccountBooks(sb, 20);
    expect(kind).toBe('unknown');
    expect(afterConsent(kind)).toBe('noBook');
  });
  it('an unreadable or empty answer is unknown, never new', async () => {
    for (const answer of [null, undefined, { data: null, error: null }, { data: { books: [] }, error: null }, { data: 'x', error: null }]) {
      const { sb } = fakeClient(() => Promise.resolve(answer));
      expect(afterConsent(await readAccountBooks(sb, 1000))).toBe('noBook');
    }
  });
});

describe('the consent sheet decides with the pure rules', () => {
  const t = src('app/(auth)/sign-in/consent.tsx');
  it('closes on a new account and shows No book here yet for the rest, through afterConsent', () => {
    expect(t).toContain('readAccountBooks(auth.client)');
    expect(t).toContain("afterConsent(kind) === 'close'");
    expect(t).toContain('setNoBook(true)');
  });
  it('a failure no longer closes the sheet onto a new-account route', () => {
    expect(t).not.toMatch(/\.catch\(\(\) => alive && close\(\)\)/);
  });
  it('still asks only a person who signed in with no book on the phone', () => {
    expect(t).toContain("getSignInTrigger() !== 'sign_in' || children.length > 0 || !auth.client");
  });
});

describe('the child step identity line and Use another account', () => {
  const words = { signedInAs: en.onboarding.child.signedInAs, signedInAsLabel: en.onboarding.child.signedInAsLabel, apple: authCopy.account.signedInWith.apple };
  it('reads "Signed in as {email}." with the masked address', () => {
    expect(signedInLine({ maskedEmail: 'a***@example.com', provider: 'email' }, words)?.text).toBe('Signed in as a***@example.com.');
  });
  it('is read aloud with the hidden part spoken, never as stars', () => {
    const l = signedInLine({ maskedEmail: 'a***@example.com', provider: 'email' }, words);
    expect(l?.label).toBe('Signed in as a, hidden, at example.com.');
    expect(l?.label).not.toContain('*');
    expect(spokenMaskedEmail('a***@example.com')).toBe('a, hidden, at example.com');
    expect(spokenMaskedEmail(null)).toBeNull();
    expect(spokenMaskedEmail('nonsense')).toBeNull();
  });
  it('Apple with no address reuses "Signed in with Apple"; any other sign-in with no address shows no line', () => {
    expect(signedInLine({ maskedEmail: null, provider: 'apple' }, words)).toEqual({ text: 'Signed in with Apple', label: 'Signed in with Apple' });
    expect(signedInLine({ maskedEmail: null, provider: 'google' }, words)).toBeNull();
    expect(signedInLine({ maskedEmail: null, provider: null }, words)).toBeNull();
  });
  const note = src('components/onboarding/signed-in-note.tsx');
  it('the button is quiet, 44 pt (size sm is min-h-11), hinted, and sits after the fields', () => {
    expect(note).toContain('variant="quiet" size="sm"');
    expect(src('components/ui/button.tsx')).toContain("sm: 'min-h-11 px-4 py-2'");
    expect(note).toContain('accessibilityHint={c.useAnotherHint}');
    const ob = src('app/onboarding.tsx');
    expect(ob.indexOf('<SignedInNote')).toBeGreaterThan(ob.indexOf('o.child.expectingHelp'));
    expect(ob.indexOf('<SignedInNote')).toBeGreaterThan(ob.indexOf('<CoverHeading title={o.child.title}'));
  });
  it('shows only on the account-first route with a session, and signs out', () => {
    const ob = src('app/onboarding.tsx');
    expect(ob).toContain('accountFirst && hasSessionState(authState) ? (');
    expect(ob).toContain('onUseAnother={startAgain}');
  });
  it('lets the text wrap at the largest sizes (no truncation, no fixed height)', () => {
    expect(note).not.toMatch(/numberOfLines|ellipsizeMode|adjustsFontSizeToFit/);
  });
});

describe('[NX-38-R6] claiming into an account that already has a book', () => {
  it('[NX-38-R6] nothing uploads before Keep in this account', () => {
    const asked = mergeBack({ consent: 'accepted', claim: 'pending', accountHasBook: true, destination: null });
    expect(asked.phase).toBe('askClaim');
    expect(asked.uploads).toBe(false);
    const t = src('app/(auth)/sign-in/consent.tsx');
    // The check only reads; the one call that starts a claim is keepLettersHere, behind the button.
    expect(t.match(/keepLettersHere\(\)/g)?.length).toBe(1);
    expect(src('lib/first-run/account-books.ts')).not.toMatch(/takeOwnership|keepLettersHere/);
  });
  it('[NX-38-R6] an account with a book and a local book with kept letters deletes nothing and duplicates nothing', () => {
    for (const kind of ['hasBook', 'unknown', null] as const) {
      const o = claimKeepOutcome(kind);
      expect(o.deletes).toBe(false);
      expect(o.mergesIntoExistingBook).toBe(false);
      expect(o.removesEmptyLocalBook).toBe(false);
      expect(o.asksDestination).toBe(false);
      expect(o.recordingsLeavePhone).toBe(false);
    }
    expect(claimKeepOutcome('hasBook').addsAsSecondBook).toBe(true);
    // takeOwnership claims each local book under its own id (no destination), so a letter keeps its id and is not copied.
    const own = src('lib/sync/ownership.ts');
    expect(own).toContain("SELECT * FROM children WHERE server_state = 'local'");
    expect(own).not.toMatch(/destination/i);
  });
  it('Build 12 does not use the merge-back phases for the existing book, and no outcome removes a book', () => {
    // #722's review fix: the rule has no kept-letter count and no field that could say "remove" (first-run-merge-back.test.ts).
    const five = mergeBack({ consent: 'accepted', claim: 'keep', accountHasBook: true, destination: null });
    expect(five.phase).toBe('askDestination');
    expect(Object.keys(five)).not.toContain('removesLocalBook');
    const t = src('app/(auth)/sign-in/consent.tsx') + src('lib/first-run/handoff.logic.ts');
    expect(t).not.toMatch(/askDestination|removesLocalBook|saysEmptyBookRemoved|local_merge_choice/);
  });
  it('the claim sentence says the account has a book only when the server said so', () => {
    expect(claimWords('hasBook')).toBe('accountHasBook');
    for (const k of ['new', 'returningNoBook', 'unknown', null] as const) expect(claimWords(k)).toBe('plain');
  });
  it('Keep in this account waits for the answer (or the timeout), and Not my account never does', () => {
    expect(keepEnabled(null)).toBe(false);
    for (const k of ['new', 'returningNoBook', 'hasBook', 'unknown'] as const) expect(keepEnabled(k)).toBe(true);
    const t = src('app/(auth)/sign-in/consent.tsx');
    expect(t).toContain('loading={!keepEnabled(claimKind) && !!auth.client}');
    expect(t).not.toMatch(/label=\{c\.notMine\}[\s\S]{0,80}disabled/);
  });
  it('the words are in the order title, account line, recordings line, help, Keep, Not my account', () => {
    const t = src('app/(auth)/sign-in/consent.tsx');
    const at = (s: string) => t.indexOf(s);
    expect(at('c.title')).toBeLessThan(at('c.bodyHasBook'));
    expect(at('c.bodyHasBook')).toBeLessThan(at('signedIn.text'));
    expect(at('signedIn.text')).toBeLessThan(at('c.recordingsNote'));
    expect(at('c.recordingsNote')).toBeLessThan(at('c.help'));
    expect(at('label={c.keep}')).toBeLessThan(at('label={c.notMine}'));
  });
});

describe('the words', () => {
  const k = authCopy.claim;
  const c = en.onboarding.child;
  const all = [k.bodyHasBook, k.recordingsNote, k.keepHint, c.signedInAs, c.signedInAsLabel, c.useAnother, c.useAnotherHint];
  it('say the three true things and no more: second book, nothing deleted, recordings stay on this phone', () => {
    expect(k.bodyHasBook).toBe('This account already has a book. The book on this phone will be added to it as a second book. Nothing is deleted.');
    expect(k.recordingsNote).toBe('The recordings are kept on this phone.');
    expect(c.useAnother).toBe('Use another account');
  });
  it('keep the button to 22 characters or fewer', () => {
    expect(c.useAnother.length).toBeLessThanOrEqual(22);
    expect(k.keep.length).toBeLessThanOrEqual(22);
  });
  it('use none of the forbidden characters and no backup, safe or AI claim', () => {
    for (const s of all) {
      expect(s).not.toMatch(/[—–‘’“”…]|\p{Extended_Pictographic}/u);
      expect(s).not.toMatch(/\bAI\b|backed up|backup|kept safe|\bsafe\b|merge/i);
    }
  });
});
