/// <reference types="node" />
/**
 * `[X4-R1]` over two accounts on one phone, on the real store facade (BL-961 PR 3; NS-10-R3, NS-10-R5; security.md
 * NSC-03; ADR 0031, the data half). Account A makes a book on this phone and claims it; account B signs in on the same
 * phone. Every list a screen, an export or the reminder planner reads must hold 0 of A's rows for B, nothing of A's may
 * be claimed or queued under B, and nothing on the phone may change. B signs out: the holder has the book again (D1).
 *
 * The leak this was written against: on develop at 20553b18 `listChildren()` and every other list read return A's book
 * whoever is signed in (store.ts:311-313; the visible-books query has no account clause, children.ts:54-56).
 * Real modules over node:sqlite with the app's migrations; only natives are stubbed. Fictional family "Asha" only.
 */
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const ready = (userId: string): AuthState => ({ status: 'ready', userId, sync: 'on' });

type Store = typeof import('../src/lib/store');
type Auth = typeof import('../src/lib/auth/auth-store');
let store: Store;
let auth: Auth;
let asha: string;
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;

/** Every list read that names a book, a letter or a draft, as the screens, export and planner call them. */
const lists = () => ({
  books: store.listChildren(),
  hidden: store.listHiddenChildren(),
  family: store.getFamily(),
  active: store.getActiveChildId(),
  letters: store.listEntriesForChild(asha),
  tonight: store.listEntries(),
  drafts: store.listDrafts(asha),
  waitingWords: store.listWaitingForWords(asha),
  toReview: store.listWordsToReview(asha),
  deleted: store.listDeleted(),
  deletedBooks: store.listDeletedBooks(),
  closed: store.listClosedBooks(),
  deletedLetters: store.listDeletedEntriesForChild(asha),
  forExport: store.listWaitingForExport(),
  conflicts: store.listConflicts(),
  held: store.listHeldDrafts(),
});
const counts = () => store.localSqlDb().get<{ c: number; e: number; d: number; o: number }>(
  'SELECT (SELECT COUNT(*) FROM children) AS c, (SELECT COUNT(*) FROM entries) AS e, (SELECT COUNT(*) FROM drafts) AS d, (SELECT COUNT(*) FROM sync_outbox) AS o',
)!;

/**
 * Rows for every list read the store gates, so that taking any `shown()` wrapper (or the listDeleted guard) away turns
 * the "B: every list is empty" test red: each list holds something for A first (asserted), then nothing for B.
 */
function seedEveryList(): void {
  const db = store.localSqlDb();
  const now = '2026-11-20T09:00:00.000Z';
  store.saveEntry(letter({ id: id7(), childId: asha, transcriptStatus: 'waiting' }));
  const review = id7();
  store.saveEntry(letter({ id: review, childId: asha }));
  db.run("UPDATE entries SET transcript_status = 'unreviewed' WHERE id = ?", review); // entries.ts WORDS_UNREVIEWED
  const gone = id7();
  store.saveEntry(letter({ id: gone, childId: asha }));
  store.deleteEntry(gone);
  const held = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Held words.' });
  store.holdDraft(held.id, { inBookChoice: null });
  db.run(
    'INSERT INTO rejected_writes (op_id, type, entity_id, payload, code, rejected_at) VALUES (?, ?, ?, ?, ?, ?)',
    id7(), 'held.upsert', held.id,
    JSON.stringify({ op: 'x', type: 'held.upsert', id: held.id, data: { id: held.id, typed_text: 'Mine.' }, conflict: { server_v: null } }),
    'conflict', now,
  );
  const hidden = store.addChild({ name: 'Nova', birthday: '2026-04-01', dueDate: null, signsAs: 'Mama' }).id;
  store.hideChild(hidden);
  const closed = store.addChild({ name: 'Kit', birthday: '2026-05-01', dueDate: null, signsAs: 'Mama' }).id;
  db.run("UPDATE children SET server_state = 'deleted' WHERE id = ?", closed);
  const binned = store.addChild({ name: 'Pia', birthday: '2026-06-01', dueDate: null, signsAs: 'Mama' }).id;
  db.run('INSERT INTO settings (key, value) VALUES (?, ?)', `book.deletedAt.${binned}`, now);
}

beforeEach(async () => {
  vi.resetModules();
  store = (await import('../src/lib/store')) as Store;
  auth = (await import('../src/lib/auth/auth-store')) as Auth;
  const { db } = nodeDb();
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-11-20T09:00:00.000Z', newId: () => id7() }).ok).toBe(true);
  // A's book on this phone: a child, a kept letter, a draft in progress, then A's first sign-in claims it.
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  store.saveEntry(letter({ id: id7(), childId: asha }));
  store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha slept.' });
  const { takeOwnership } = await import('../src/lib/sync/ownership');
  takeOwnership(store.localSqlDb(), A, { now: '2026-11-20T09:00:00.000Z', newId: id7 });
  auth.publishAuth(ready(A));
});

describe('[NS-10-R3] a second account never sees the first', () => {
  it('A signed in: A\'s book, letter and draft are listed (the baseline the next test hides)', () => {
    const l = lists();
    expect(l.books.map((c) => c.id)).toEqual([asha]);
    expect(l.family?.childName).toBe('Asha');
    expect(l.letters).toHaveLength(1);
    expect(l.drafts.length).toBeGreaterThan(0);
  });

  it('B signed in: every list is empty, at every step of B\'s session, and nothing on the phone changed', () => {
    seedEveryList();
    // Every list holds something for A, so a list that stops being gated cannot hide behind an empty table.
    const mine = lists();
    for (const [k, v] of Object.entries(mine)) {
      if (k === 'active') continue;
      expect(Array.isArray(v) ? v.length : v, `A ${k}`).toBeTruthy();
    }
    const before = counts();
    const statesOfB: AuthState[] = [
      { status: 'checkingConsent', userId: B, method: 'email' },
      { status: 'needsConsent', userId: B, method: 'email', steps: ['terms'] },
      ready(B),
      { status: 'signingOut', userId: B, reason: 'user', waitingForUploads: false, sync: 'on' },
    ];
    for (const s of statesOfB) {
      auth.publishAuth(s);
      expect(store.bookVisibleNow(), s.status).toBe(false);
      const l = lists();
      for (const [k, v] of Object.entries(l)) expect(Array.isArray(v) ? v.length : v, `${s.status} ${k}`).toSatisfy((x: unknown) => x === 0 || x === null);
    }
    expect(counts()).toEqual(before);
  });

  it('B signs out: the phone holder has the book again (D1); A signs in: it is A\'s', () => {
    auth.publishAuth(ready(B));
    expect(store.listChildren()).toEqual([]);
    auth.publishAuth({ status: 'signedOut' });
    expect(store.listChildren().map((c) => c.id)).toEqual([asha]);
    auth.publishAuth(ready(A));
    expect(store.listEntriesForChild(asha)).toHaveLength(1);
  });

  it('reads by id stay open, so the sweeps never take A\'s rows for gone', () => {
    const id = store.listEntriesForChild(asha)[0]!.id;
    auth.publishAuth(ready(B));
    expect(store.getEntry(id)?.id).toBe(id);
    expect(store.getChild(asha)?.id).toBe(asha);
  });

  it('the readers are told when the answer changes (watchAccountScope), and only then', async () => {
    const { watchAccountScope } = await import('../src/lib/auth/account-scope');
    let told = 0;
    store.subscribe(() => void (told += 1));
    const stop = watchAccountScope();
    auth.publishAuth(ready(A));
    expect(told).toBe(0);
    auth.publishAuth(ready(B));
    expect(told).toBe(1);
    auth.publishAuth({ status: 'signingOut', userId: B, reason: 'user', waitingForUploads: false, sync: 'on' });
    expect(told).toBe(1);
    auth.publishAuth({ status: 'signedOut' });
    expect(told).toBe(2);
    stop();
  });
});

describe('bookVisibleNow() fails closed', () => {
  it('an owner that cannot be read hides the book (the catch answers false, never true)', () => {
    auth.publishAuth(ready(B));
    const db = store.localSqlDb();
    const get = vi.spyOn(db, 'get').mockImplementation(() => {
      throw new Error('settings unreadable');
    });
    expect(store.bookVisibleNow()).toBe(false);
    get.mockRestore();
  });
});

describe('[NS-01-R29][X4-R1] a second account sees no picture', () => {
  it('every list a picture lens or a letter page reads is empty for B (letters, tonight, deleted, waiting), and A has them', () => {
    seedEveryList();
    const read = () => [store.listEntriesForChild(asha), store.listEntries(), store.listDeleted(), store.listWaitingForWords(asha), store.listWordsToReview(asha)];
    for (const rows of read()) expect(rows.length).toBeGreaterThan(0);
    auth.publishAuth(ready(B));
    for (const rows of read()) expect(rows).toEqual([]);
  });
});

describe('[NS-02-R24][X4-R1] a second account finds none of the first account\'s letters', () => {
  it('no letter text of A\'s is in any list B can read (the store side; the search index guard is BRIEF-PR895)', () => {
    seedEveryList();
    const words = ['laughed at the rain', 'Held words'];
    const texts = () => JSON.stringify([
      store.listEntriesForChild(asha), store.listEntries(), store.listDeleted(), store.listDeletedEntriesForChild(asha),
      store.listDrafts(asha), store.listHeldDrafts(), store.listWaitingForExport(), store.listConflicts(),
    ]);
    for (const w of words) expect(texts()).toContain(w);
    auth.publishAuth(ready(B));
    for (const w of words) expect(texts()).not.toContain(w);
  });
});

describe('[X4-R1] partial: the reminder planner\'s inputs (lib/reminders not edited here)', () => {
  it('plannerChildren() and lastOwnSaveAt() hold none of A\'s book while B is signed in, and come back for A', async () => {
    const prefs = await import('../src/lib/reminders/prefs');
    expect(prefs.plannerChildren().map((c) => c.id)).toEqual([asha]);
    auth.publishAuth(ready(B));
    expect(prefs.plannerChildren()).toEqual([]);
    expect(prefs.lastOwnSaveAt()).toBeNull();
    auth.publishAuth(ready(A));
    expect(prefs.plannerChildren().map((c) => c.id)).toEqual([asha]);
  });
});

describe('[NS-10-R5] a second account never claims the first\'s letters', () => {
  it('no claim screen for B, takeOwnership refuses B, and nothing is queued under B', async () => {
    const { needsAccountClaim } = await import('../src/lib/auth/account-claim.logic');
    const { AccountMismatchError, takeOwnership } = await import('../src/lib/sync/ownership');
    expect(needsAccountClaim({ userId: B, owner: store.currentUserId(), hasLocalData: true, confirmed: new Set() })).toBe(false);
    const before = counts();
    auth.publishAuth(ready(B));
    expect(() => takeOwnership(store.localSqlDb(), B, { now: '2026-11-20T09:00:00.000Z', newId: id7 })).toThrow(AccountMismatchError);
    expect(store.currentUserId()).toBe(A);
    expect(counts()).toEqual(before);
  });
});
