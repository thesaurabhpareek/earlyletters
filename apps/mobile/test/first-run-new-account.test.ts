/**
 * Account-first slice 4a: a new account goes straight to the promise and child steps, a returning one with no book keeps
 * "No book here yet", and a claim into an account that has a book adds a second book and deletes nothing. Pure logic plus
 * source patterns for the screens. Fictional family Asha only.
 * Exec council decision, 9 Nov 2026, A and D; NX-31 R12; NX-38 R6.
 *
 * Review of PR #737 at c6baa94f (lenses A and B) added: the claim run for real on a phone database, the default wait, the
 * anchored pin on the call site a mutation got past, the claim reading order, and the registered recordings sentence. The
 * mutation each new test was written to catch is named in its title as [Mn].
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { SYNC_SETTING, readSetting } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

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
  describe('the default wait is 10 seconds, at the real call [M2]', () => {
    afterEach(() => vi.useRealTimers());
    it('called as the sheet calls it (no wait given), a never-answering call is still waiting at 9.999 seconds and unknown at 10', async () => {
      vi.useFakeTimers();
      const { sb } = fakeClient(() => new Promise(() => {}));
      let kind: AccountKind | null = null;
      void readAccountBooks(sb).then((k) => (kind = k));
      await vi.advanceTimersByTimeAsync(ACCOUNT_BOOKS_WAIT_MS - 1);
      expect(kind).toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      expect(kind).toBe('unknown');
    });
    it('the sheet never passes a wait of its own: both of its calls take the default', () => {
      const t = src('app/(auth)/sign-in/consent.tsx');
      expect(t.match(/readAccountBooks\(/g)?.length).toBe(2);
      expect(t.match(/readAccountBooks\(auth\.client\)/g)?.length).toBe(2);
      expect(src('lib/first-run/account-books.ts')).toContain('waitMs: number = ACCOUNT_BOOKS_WAIT_MS');
    });
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
  it('[M1] the two lines are one if and else, exactly: the "No book here yet" path is taken whenever afterConsent says noBook', () => {
    // `afterConsent(kind) === 'close' || true` kept the substrings above and sent everyone on to the child step.
    expect(t).toMatch(/if \(afterConsent\(kind\) === 'close'\) close\(\);\n\s+else setNoBook\(true\);/);
    expect(t.match(/afterConsent\(/g)?.length).toBe(1);
    // And the decision it asks is the table: every kind but a clear new account or an account with a book is noBook.
    expect((['unknown', 'returningNoBook'] as const).map(afterConsent)).toEqual(['noBook', 'noBook']);
    expect((['new', 'hasBook'] as const).map(afterConsent)).toEqual(['close', 'close']);
  });
  it('a failure no longer closes the sheet onto a new-account route', () => {
    expect(t).not.toMatch(/\.catch\(\(\) => alive && close\(\)\)/);
  });
  it('still asks only a person who signed in with no book on the phone', () => {
    expect(t).toContain("getSignInTrigger() !== 'sign_in' || children.length > 0 || !auth.client");
  });
});

describe('the child step identity line and Use another account', () => {
  const words = { signedInAs: en.onboarding.child.signedInAs, signedInAsLabel: en.onboarding.child.signedInAsLabel, spokenAddress: en.onboarding.child.spokenAddress, spokenAddressNoFirst: en.onboarding.child.spokenAddressNoFirst, apple: authCopy.account.signedInWith.apple };
  it('reads "Signed in as {email}." with the masked address', () => {
    expect(signedInLine({ maskedEmail: 'a***@example.com', provider: 'email' }, words)?.text).toBe('Signed in as a***@example.com.');
  });
  it('is read aloud with the hidden part spoken, never as stars', () => {
    const l = signedInLine({ maskedEmail: 'a***@example.com', provider: 'email' }, words);
    expect(l?.label).toBe('Signed in as a, hidden, at example.com.');
    expect(l?.label).not.toContain('*');
    expect(spokenMaskedEmail('a***@example.com', words)).toBe('a, hidden, at example.com');
    expect(spokenMaskedEmail('***@example.com', words)).toBe('hidden, at example.com');
    expect(spokenMaskedEmail(null, words)).toBeNull();
    expect(spokenMaskedEmail('nonsense', words)).toBeNull();
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
  /** The code of a file without its comments, so a word in a comment is not a word in the app. */
  const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  it('[M3] the spoken words for the address are packages/content\'s: no "hidden" and no ", at " is typed in the code that reads it out', () => {
    for (const f of ['lib/first-run/account-books.logic.ts', 'components/onboarding/signed-in-note.tsx', 'app/(auth)/sign-in/consent.tsx']) {
      expect(code(f), f).not.toMatch(/\bhidden\b|, at |at \$\{/);
    }
    expect(en.onboarding.child.spokenAddress).toBe('{first}, hidden, at {domain}');
    expect(en.onboarding.child.spokenAddressNoFirst).toBe('hidden, at {domain}');
  });
});

/** A migrated phone database with Asha's book(s) and letters, as a phone that has never signed in holds them. */
const ACCOUNT = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-10T09:00:00.000Z';
let seq = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
const AUDIO = 'file:///Documents/recording-asha-1.m4a';
function phone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: NOW, newId: id7 });
  return db;
}
function letterWithRecording(db: SqlDb, child: string, text: string): string {
  const id = id7();
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id, audio_uri, audio_duration_ms) VALUES (?, 'letter', '2026-11-09', ?, 'spoken', 'clean', 2, ?, '[]', ?, 1, ?, ?, NULL, ?, 31000)`,
    id, NOW, text, text, NOW, child, AUDIO,
  );
  return id;
}
const rows = (db: SqlDb, sql: string) => db.all<Record<string, unknown>>(sql);
const states = (db: SqlDb) => rows(db, 'SELECT id, server_state FROM children ORDER BY id');

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

  // The words say the book on this phone "will be added to it as a second book. Nothing is deleted." What takeOwnership does
  // on a real phone database is what makes them true (review of PR #737, lens A, note 4: the earlier test only read literals).
  describe('[NX-38-R6] Keep in this account, run for real on a phone database [M7]', () => {
    it('one book and its letters with recordings: nothing is deleted, nothing is copied, the book goes up as its own book', () => {
      const db = phone();
      const book = insertBook(db, { id: id7(), name: 'Asha', birthday: '2026-03-01', at: NOW });
      const l1 = letterWithRecording(db, book, 'Asha laughed at the rain.');
      const l2 = letterWithRecording(db, book, 'Asha found the big puddle.');
      db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at, typed_text, state, held_kind) VALUES (?, ?, 'typed', ?, 'Asha clapped.', 'ready', 'held_letter')", id7(), book, NOW);
      const before = {
        children: rows(db, 'SELECT id, name, birthday FROM children ORDER BY id'),
        entries: rows(db, 'SELECT id, child_id, final_text, raw_transcript, audio_uri, audio_duration_ms FROM entries ORDER BY id'),
        drafts: rows(db, 'SELECT id, child_id, typed_text, held_kind FROM drafts ORDER BY id'),
      };
      const r = takeOwnership(db, ACCOUNT, { now: NOW, newId: id7 });
      expect(r).toMatchObject({ outcome: 'claimed', books: 1, letters: 2, localOnlyBooks: 0 });
      // Nothing deleted: the same rows, the same words, the same recordings (the audio_uri stays, the file is never touched).
      expect(rows(db, 'SELECT id, name, birthday FROM children ORDER BY id')).toEqual(before.children);
      expect(rows(db, 'SELECT id, child_id, final_text, raw_transcript, audio_uri, audio_duration_ms FROM entries ORDER BY id')).toEqual(before.entries);
      expect(rows(db, 'SELECT id, child_id, typed_text, held_kind FROM drafts ORDER BY id')).toEqual(before.drafts);
      expect(rows(db, 'SELECT COUNT(*) AS n FROM children')[0]).toEqual({ n: 1 });
      expect(rows(db, 'SELECT COUNT(*) AS n FROM entries')[0]).toEqual({ n: 2 });
      // The book is pending under its own id: one book.first_run, naming that id once. A second book on the account, not a merge.
      expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', book)?.server_state).toBe('pending');
      const ops = rows(db, 'SELECT type, entity_id, payload FROM sync_outbox ORDER BY seq');
      const firstRun = ops.filter((o) => o.type === 'book.first_run');
      expect(firstRun).toHaveLength(1);
      expect(JSON.parse(String(firstRun[0]!.payload)).data.children.map((c: { id: string }) => c.id)).toEqual([book]);
      expect(ops.some((o) => o.type === 'book.create')).toBe(false);
      // Each letter goes once, under its own id: not copied.
      const uploads = ops.filter((o) => o.type === 'entry.upsert').map((o) => o.entity_id).sort();
      expect(uploads).toEqual([l1, l2].sort());
      // The recordings stay on the phone: no payload carries the recording, only that it is kept on the device.
      for (const o of ops) expect(String(o.payload)).not.toContain(AUDIO);
      expect(ops.filter((o) => o.type === 'entry.upsert').every((o) => JSON.parse(String(o.payload)).data.audio_kept_on_device === true)).toBe(true);
      expect(readSetting(db, SYNC_SETTING.owner)).toBe(ACCOUNT);
    });

    it('a book the server would refuse (an id the phone did not make, or no date) is kept on the phone as it is, not added, not deleted', () => {
      const db = phone();
      const noDate = insertBook(db, { id: id7(), name: 'Asha', birthday: null, dueDate: null, at: NOW });
      const oldId = insertBook(db, { id: 'child-asha', name: 'Asha', birthday: '2026-03-01', at: NOW });
      letterWithRecording(db, noDate, 'Asha laughed at the rain.');
      letterWithRecording(db, oldId, 'Asha found the big puddle.');
      const r = takeOwnership(db, ACCOUNT, { now: NOW, newId: id7 });
      expect(r).toMatchObject({ books: 0, letters: 2, localOnlyBooks: 2 });
      expect(states(db).map((c) => c.server_state)).toEqual(['refused', 'refused']);
      // Both books and both letters are still on the phone, recordings and all.
      expect(rows(db, 'SELECT COUNT(*) AS n FROM children')[0]).toEqual({ n: 2 });
      expect(rows(db, 'SELECT COUNT(*) AS n FROM entries WHERE audio_uri IS NOT NULL')[0]).toEqual({ n: 2 });
      // And nothing about them goes up: no book op, and nothing left that could be sent.
      expect(rows(db, "SELECT COUNT(*) AS n FROM sync_outbox WHERE type IN ('book.first_run', 'book.create')")[0]).toEqual({ n: 0 });
      expect(db.get<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox o WHERE o.sent_at IS NULL AND NOT EXISTS (SELECT 1 FROM children c WHERE c.id = o.book_id AND c.server_state = 'refused')")?.n).toBe(0);
    });

    it('a good book and a refused one together: the good one is added, the other stays, and the count of books on the phone does not change', () => {
      const db = phone();
      const good = insertBook(db, { id: id7(), name: 'Asha', birthday: '2026-03-01', at: NOW });
      const bad = insertBook(db, { id: id7(), name: 'Asha', birthday: null, dueDate: null, at: NOW });
      const r = takeOwnership(db, ACCOUNT, { now: NOW, newId: id7 });
      expect(r).toMatchObject({ books: 1, localOnlyBooks: 1 });
      expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', good)?.server_state).toBe('pending');
      expect(db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', bad)?.server_state).toBe('refused');
      expect(rows(db, 'SELECT COUNT(*) AS n FROM children')[0]).toEqual({ n: 2 });
    });

    it('the phone is claimed once: a second tap or a restart adds and queues nothing more', () => {
      const db = phone();
      const book = insertBook(db, { id: id7(), name: 'Asha', birthday: '2026-03-01', at: NOW });
      letterWithRecording(db, book, 'Asha laughed at the rain.');
      takeOwnership(db, ACCOUNT, { now: NOW, newId: id7 });
      const queued = rows(db, 'SELECT COUNT(*) AS n FROM sync_outbox')[0];
      expect(takeOwnership(db, ACCOUNT, { now: NOW, newId: id7 }).outcome).toBe('already');
      expect(rows(db, 'SELECT COUNT(*) AS n FROM sync_outbox')[0]).toEqual(queued);
    });
  });

  it('[NX-38-R6] the claim has no destination: it takes each local book under its own id (a second book, never a merge)', () => {
    expect(claimKeepOutcome('hasBook').addsAsSecondBook).toBe(true);
    for (const k of ['new', 'returningNoBook', 'unknown', null] as const) expect(claimKeepOutcome(k).addsAsSecondBook).toBe(false);
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
  it('[M4] the words are in the order title, account line, "already has a book" line, recordings line, help, Keep, Not my account', () => {
    // Only the claim screen's own block, so a word elsewhere in the file cannot satisfy the order.
    const whole = src('app/(auth)/sign-in/consent.tsx');
    const t = whole.slice(whole.indexOf('  if (claiming) {'), whole.indexOf('  if (turningOn) {'));
    expect(t.length).toBeGreaterThan(500);
    const at = (x: string) => t.indexOf(x);
    for (const x of ['<SheetTitle>{c.title}', 'signedIn.text', 'c.bodyHasBook', 'c.recordingsNote', 'c.help', 'label={c.keep}', 'label={c.notMine}']) expect(at(x), x).toBeGreaterThan(-1);
    // The "Signed in as" line sits directly under the title, as ONE element, so the body and the recordings line read together.
    expect(at('<SheetTitle>{c.title}')).toBeLessThan(at('signedIn.text'));
    expect(at('signedIn.text')).toBeLessThan(at('c.bodyHasBook'));
    expect(at('c.bodyHasBook')).toBeLessThan(at('c.recordingsNote'));
    expect(at('c.recordingsNote')).toBeLessThan(at('c.help'));
    expect(at('label={c.keep}')).toBeLessThan(at('label={c.notMine}'));
    expect(t.match(/signedIn\.text/g)?.length).toBe(1);
    // Nothing sits between the body and the recordings line.
    const between = t.slice(at('c.bodyHasBook'), at('c.recordingsNote'));
    expect(between).not.toContain('signedIn');
    expect(between).not.toContain('<Text');
  });
});

describe('the words', () => {
  const k = authCopy.claim;
  const c = en.onboarding.child;
  const all = [k.bodyHasBook, k.recordingsNote, k.keepHint, c.signedInAs, c.signedInAsLabel, c.spokenAddress, c.spokenAddressNoFirst, c.useAnother, c.useAnotherHint];
  it('say the three true things and no more: second book, nothing deleted, recordings stay on the phone that made them', () => {
    expect(k.bodyHasBook).toBe('This account already has a book. The book on this phone will be added to it as a second book. Nothing is deleted.');
    expect(c.useAnother).toBe('Use another account');
  });
  it('[M5] the recordings line is the registered sentence, word for word: the second sentence of the Settings sign-in body', () => {
    // docs/legal/in-app-disclosures.md; the same sentence is in sheet.bodies.first_letter and account.signedOutBody.
    const registered = authCopy.sheet.bodies.settings.split('. ')[1];
    expect(registered).toBe('Recordings are kept on the phone that made them.');
    expect(k.recordingsNote).toBe(registered);
    expect(authCopy.sheet.bodies.first_letter.endsWith(k.recordingsNote)).toBe(true);
    expect(authCopy.account.signedOutBody.endsWith(k.recordingsNote)).toBe(true);
  });
  it('keep the button to 22 characters or fewer', () => {
    expect(c.useAnother.length).toBeLessThanOrEqual(22);
    expect(k.keep.length).toBeLessThanOrEqual(22);
  });
  it('use none of the forbidden characters and no backup, safe or AI claim', () => {
    for (const s of all) {
      expect(s).not.toMatch(/[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]|\p{Extended_Pictographic}/u);
      expect(s).not.toMatch(/\bAI\b|backed up|backup|kept safe|\bsafe\b|merge/i);
    }
  });
});
