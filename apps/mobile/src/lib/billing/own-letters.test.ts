/**
 * The M17 ledger (founder, 13 Oct 2026; WP-F14-20): own letters only, counted at a Keep where the
 * letter's words are on screen, never healed upward from another author's rows.
 *
 * The own-letters query belongs to the local database (S03, in a parallel branch), so it is a fake
 * here, written to the contract in own-letters.ts. The in-transaction count is simulated the way
 * store.ts should call it once S03 passes the own count (`applyKept` with `present` = own letters).
 * Fictional Asha family only.
 */
import { decideKeepLetter, NO_PLAN, type PlanView } from '@scribe/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PLAN } from './plan.logic';

// The gate's store and plan reads, replaced (no SQLite or StoreKit in Node).
const world = vi.hoisted(() => ({
  rows: [] as { id: string; kind: string; authorId: string | null; hasWords: boolean }[],
  mirror: { n: 0, recent: [] as string[] },
  plan: null as unknown,
}));
vi.mock('../store', () => ({
  ledgerDb: () => ({
    counts: () => ({ recorded: world.mirror.n, present: world.rows.filter((r) => r.kind === 'letter').length }),
    raiseTo: (n: number) => {
      if (n > world.mirror.n) world.mirror = { ...world.mirror, n };
    },
    clear: () => {
      world.mirror = { n: 0, recent: [] };
    },
  }),
  listChildren: () => [],
  listHiddenChildren: () => [],
}));
vi.mock('./plan-store', () => ({ getPlan: () => world.plan }));

import { keepLetterGate } from './gates';
import { configureLedgerStorage, configureOwnLetters, keychainFloor, lettersKept, syncLedger, type LedgerDb, type LedgerStorage } from './letter-ledger';
import { applyKept, LEDGER_KEYCHAIN_KEY, parseLedger } from './letter-ledger.logic';
import { countsAtKeep, isOwn, type LedgerViewer, type OwnLettersQuery } from './own-letters';

const ASHA_PARENT: LedgerViewer = { profileId: 'profile-asha-amma' };
const OTHER = 'profile-asha-papa';
const NOW = new Date('2027-01-10T18:00:00Z');
const PLUS: PlanView = { state: 'active', effectiveUntil: '2027-12-01T00:00:00Z', verifiedAt: '2027-01-01T00:00:00Z', environment: 'production', isTester: false };

/** The fake of S03's query, to the contract in own-letters.ts. */
const ownQuery: OwnLettersQuery = {
  countOwnLettersWithWords: (viewer) => world.rows.filter((r) => r.kind === 'letter' && r.hasWords && isOwn(r.authorId, viewer)).length,
};
const db = (): LedgerDb => ({
  counts: () => ({ recorded: world.mirror.n, present: world.rows.filter((r) => r.kind === 'letter').length }),
  raiseTo: (n) => {
    if (n > world.mirror.n) world.mirror = { ...world.mirror, n };
  },
  clear: () => {
    world.mirror = { n: 0, recent: [] };
  },
});

function fakeKeychain() {
  const items = new Map<string, string>();
  const storage: LedgerStorage = {
    getItem: async (k) => items.get(k) ?? null,
    setItem: async (k, v) => void items.set(k, v),
    removeItem: async (k) => void items.delete(k),
  };
  return { storage, count: () => parseLedger(items.get(LEDGER_KEYCHAIN_KEY) ?? null).n };
}

let seq = 0;
/** A letter that arrived by sync from the other parent. */
function syncedFromOther(n: number) {
  for (let i = 0; i < n; i++) world.rows.push({ id: `other-${seq++}`, kind: 'letter', authorId: OTHER, hasWords: true });
}

/**
 * What Review then store.ts should do at a Save (M17): ask the gate with whether the words are on
 * screen; when allowed, write the row, and count it in the same transaction only if it counts.
 */
async function save(opts: { wordsOnScreen: boolean; plan?: PlanView; id?: string }): Promise<'kept' | 'held'> {
  world.plan = { ...EMPTY_PLAN, view: opts.plan ?? NO_PLAN };
  const g = await keepLetterGate(NOW, { wordsOnScreen: opts.wordsOnScreen });
  if (g.decision.kind === 'offer') return 'held';
  const id = opts.id ?? `asha-${seq++}`;
  const existing = world.rows.find((r) => r.id === id);
  if (existing) existing.hasWords = existing.hasWords || opts.wordsOnScreen;
  else world.rows.push({ id, kind: 'letter', authorId: ASHA_PARENT.profileId, hasWords: opts.wordsOnScreen });
  const counts = countsAtKeep({ kind: 'letter', wordsOnScreen: opts.wordsOnScreen, authorId: ASHA_PARENT.profileId, viewer: ASHA_PARENT });
  expect(counts).toBe(g.counts);
  if (counts) world.mirror = applyKept(world.mirror, id, { floor: keychainFloor(), present: ownQuery.countOwnLettersWithWords(ASHA_PARENT) });
  await syncLedger(db());
  return 'kept';
}

beforeEach(() => {
  world.rows = [];
  world.mirror = { n: 0, recent: [] };
  world.plan = EMPTY_PLAN;
  configureLedgerStorage(null);
  configureOwnLetters(ownQuery, () => ASHA_PARENT);
});
afterEach(() => {
  configureOwnLetters(null);
  configureLedgerStorage(null);
});

describe('countsAtKeep: the M17 rule', () => {
  it('only a letter, of your own, with its words on screen', () => {
    const v = ASHA_PARENT;
    expect(countsAtKeep({ kind: 'letter', wordsOnScreen: true, authorId: v.profileId, viewer: v })).toBe(true);
    expect(countsAtKeep({ kind: 'letter', wordsOnScreen: true, authorId: null, viewer: v })).toBe(true); // made here before sign-in
    expect(countsAtKeep({ kind: 'letter', wordsOnScreen: false, authorId: v.profileId, viewer: v })).toBe(false);
    expect(countsAtKeep({ kind: 'letter', wordsOnScreen: true, authorId: OTHER, viewer: v })).toBe(false);
    expect(countsAtKeep({ kind: 'not_much', wordsOnScreen: true, authorId: v.profileId, viewer: v })).toBe(false);
    expect(isOwn(OTHER, { profileId: null })).toBe(false);
  });
});

describe('[F14-REQ-036] own letters only', () => {
  it('a person joins a book holding 30 letters by the other parent: their first own letter is free letter 1 and the mirror reads 1', async () => {
    const kc = fakeKeychain();
    configureLedgerStorage(kc.storage);
    syncedFromOther(30);
    expect(await lettersKept(db())).toBe(0);
    expect(await save({ wordsOnScreen: true })).toBe('kept');
    expect(world.mirror.n).toBe(1);
    expect(kc.count()).toBe(1);
    // A sync pulls 10 more of the other parent's letters: unchanged, and launch healing does not raise it.
    syncedFromOther(10);
    expect(await syncLedger(db())).toBe(1);
    expect(world.mirror.n).toBe(1);
    expect(kc.count()).toBe(1);
    // Their second own letter is free; the third asks for Plus.
    expect(await save({ wordsOnScreen: true })).toBe('kept');
    expect(await save({ wordsOnScreen: true })).toBe('held');
  });

  it('without the M17 query wired, the pre-M17 count of every letter would have used up the free letters (why the adapter exists)', async () => {
    configureOwnLetters(null);
    syncedFromOther(30);
    expect(await lettersKept(db())).toBe(30);
  });

  it('[F14-REQ-023] never decreases, and heals only from own letters: a surviving Keychain count stands', async () => {
    const kc = fakeKeychain();
    await kc.storage.setItem(LEDGER_KEYCHAIN_KEY, JSON.stringify({ v: 1, n: 3 }));
    configureLedgerStorage(kc.storage);
    syncedFromOther(12);
    expect(await syncLedger(db())).toBe(3);
    expect(world.mirror.n).toBe(3);
  });

  it('a query that throws counts as 0 (the safe side), never the raw count', async () => {
    configureOwnLetters({ countOwnLettersWithWords: () => { throw new Error('store_closed'); } }, () => ASHA_PARENT);
    syncedFromOther(30);
    expect(await lettersKept(db())).toBe(0);
  });

  it('signed out: rows made on this phone count, rows with another author do not', async () => {
    configureOwnLetters(ownQuery, () => ({ profileId: null }));
    world.rows.push({ id: 'local-1', kind: 'letter', authorId: null, hasWords: true });
    syncedFromOther(5);
    expect(await lettersKept(db())).toBe(1);
  });
});

describe('[F14-REQ-037] words seen', () => {
  it('3 voice-only saves on a Free phone: 0 Keep sheets and a count of 0; their words arrive and the author saves them: 2 free, the third opens the Keep sheet', async () => {
    const ids = ['asha-v1', 'asha-v2', 'asha-v3'];
    for (const id of ids) expect(await save({ wordsOnScreen: false, id })).toBe('kept');
    expect(world.mirror.n).toBe(0);
    expect(await lettersKept(db())).toBe(0);
    expect(await save({ wordsOnScreen: true, id: ids[0] })).toBe('kept');
    expect(await save({ wordsOnScreen: true, id: ids[1] })).toBe('kept');
    expect(await save({ wordsOnScreen: true, id: ids[2] })).toBe('held');
    expect(world.mirror.n).toBe(2);
  });

  it('a voice-only save never reads the ledger and is never gated, even past the allowance with Plus off', async () => {
    world.mirror = { n: 9, recent: [] };
    const g = await keepLetterGate(NOW, { wordsOnScreen: false });
    expect(g).toEqual({ decision: { kind: 'allow', via: 'free_letters' }, lettersKept: 0, allowance: 2, counts: false });
    world.plan = { ...EMPTY_PLAN, view: PLUS };
    expect((await keepLetterGate(NOW, { wordsOnScreen: false })).decision).toEqual({ kind: 'allow', via: 'plus_own' });
  });

  it('[F14-REQ-038] a fresh install with no speech model and 5 spoken letters: 0 Keep sheets', async () => {
    for (let i = 0; i < 5; i++) expect(await save({ wordsOnScreen: false })).toBe('kept');
    expect(world.mirror.n).toBe(0);
  });

  it('callers that pass nothing keep today\'s behaviour (words on screen)', async () => {
    world.mirror = { n: 2, recent: [] };
    const g = await keepLetterGate(NOW);
    expect(g.counts).toBe(true);
    expect(g.decision.kind).toBe('offer');
  });
});

describe('[PRD-REQ-024] the Keep decision over the M17 count', () => {
  it('0 or 1 counted: free; 2: offer; Plus: allowed at any count; a voice-only save leaves the ledger unchanged', async () => {
    const decide = (n: number, plan: PlanView = NO_PLAN) => decideKeepLetter({ now: NOW.toISOString(), plan, lettersKept: n }).kind;
    expect(decide(0)).toBe('allow');
    expect(decide(1)).toBe('allow');
    expect(decide(2)).toBe('offer');
    expect(decide(40, PLUS)).toBe('allow');
    await save({ wordsOnScreen: true });
    const before = world.mirror.n;
    await save({ wordsOnScreen: false });
    expect(world.mirror.n).toBe(before);
  });

  it('under Plus every own letter with words is still counted (the count keeps rising)', async () => {
    for (let i = 0; i < 4; i++) await save({ wordsOnScreen: true, plan: PLUS });
    expect(world.mirror.n).toBe(4);
    expect(await save({ wordsOnScreen: true })).toBe('held');
  });
});
