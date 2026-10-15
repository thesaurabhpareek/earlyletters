/// <reference types="node" />
/**
 * The letter ledger and the Keep gate (D-082, D-083; debate Q-013 sections 3, 4 and 10),
 * against a real SQLite engine and a fake Keychain. Fictional Asha family only.
 *
 * What these pin: the count never goes down (delete, undo, restore, edit, move between the
 * Book and private change nothing), it is the largest of Keychain, database mirror and letters
 * present, it counts once per letter id, it is written in the same transaction as the letter,
 * Erase everything clears it, and a gated Keep writes nothing: the draft stays untouched.
 */
import { decideKeepLetter, NO_PLAN, type PlanView } from '@scribe/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { drafts, entries, ledger, letters } from '../src/lib/db/repos';
import {
  clearLedger,
  configureLedgerStorage,
  keychainFloor,
  lettersKept,
  mirrorLedger,
  readKeychainCount,
  syncLedger,
  type LedgerDb,
  type LedgerStorage,
} from '../src/lib/billing/letter-ledger';
import {
  applyKept,
  EMPTY_LEDGER,
  LEDGER_KEYCHAIN_KEY,
  LEDGER_SETTING_KEY,
  lettersKeptFrom,
  parseLedger,
  RECENT_IDS_KEPT,
  safeCount,
  serializeKeychain,
  serializeLedger,
} from '../src/lib/billing/letter-ledger.logic';
import { fixture, letter, seedChild, type Fixture } from './helpers/store-fixture';

let f: Fixture;
const defaults = { childId: null, authorSignsAs: null };

/** A Keychain in memory. `broken` makes every call throw, like a locked or unavailable Keychain. */
function fakeKeychain(initial?: number) {
  const items = new Map<string, string>();
  if (initial !== undefined) items.set(LEDGER_KEYCHAIN_KEY, serializeKeychain(initial));
  let broken = false;
  const storage: LedgerStorage = {
    getItem: async (k) => {
      if (broken) throw new Error('keychain_unavailable');
      return items.get(k) ?? null;
    },
    setItem: async (k, v) => {
      if (broken) throw new Error('keychain_unavailable');
      items.set(k, v);
    },
    removeItem: async (k) => {
      if (broken) throw new Error('keychain_unavailable');
      items.delete(k);
    },
  };
  return { storage, items, break: () => (broken = true), count: () => parseLedger(items.get(LEDGER_KEYCHAIN_KEY) ?? null).n };
}

/** The same adapter store.ts builds, over the test database. */
const dbAdapter = (): LedgerDb => ({
  counts: () => ({ recorded: ledger.readState(f.ctx).n, present: ledger.countPresent(f.ctx) }),
  raiseTo: (n) => void ledger.raiseTo(f.ctx, n),
  clear: () => ledger.clear(f.ctx),
});

function draft(id?: string) {
  const did = id ?? f.ctx.newId();
  drafts.insert(f.ctx, did, { childId: 'child-asha', captureMode: 'spoken', promptKey: null, audioUri: `file:///Documents/${did}.m4a`, audioDurationMs: 9000, audioSha256: 'c'.repeat(64), audioBytes: 9000 });
  return drafts.get(f.ctx, did)!;
}

/** What store.ts saveLetterFromDraft does: the letter, its draft and its count in one transaction. */
function keep(id: string, over: Parameters<typeof letter>[0] = {}) {
  letters.saveFromDraft(f.ctx, id, letter({ id, ...over }), defaults, true, () => {
    if ((over.kind ?? 'letter') === 'letter') ledger.recordKept(f.ctx, id, keychainFloor());
  });
}

const FREE = NO_PLAN;
const PLUS: PlanView = { state: 'active', effectiveUntil: '2026-12-01T00:00:00Z', verifiedAt: '2026-10-03T00:00:00Z', environment: 'production', isTester: false };
const NOW = '2026-10-03T12:00:00Z';

/**
 * What Review does at Keep (lib/billing/gates.ts keepLetterGate, review.tsx save): decide first, and only
 * when allowed write the letter. Returns whether it was kept.
 */
async function pressKeep(id: string, plan: PlanView, allowance?: unknown): Promise<'kept' | 'held'> {
  const n = await syncLedger(dbAdapter());
  const decision = decideKeepLetter({ now: NOW, plan, lettersKept: n, allowance });
  if (decision.kind === 'offer') return 'held';
  keep(id);
  await mirrorLedger(dbAdapter());
  return 'kept';
}

beforeEach(() => {
  f = fixture();
  seedChild(f.db);
  seedChild(f.db, 'child-ravi', 'Amma');
  configureLedgerStorage(null);
});
afterEach(() => {
  configureLedgerStorage(null);
  f.close();
});

describe('letter-ledger.logic: the pure rules', () => {
  it('reads junk, other versions and null as empty, never throws', () => {
    for (const raw of [null, undefined, '', '{not json', '[]', '"x"', JSON.stringify({ v: 2, n: 9 }), JSON.stringify({ n: 9 })]) {
      expect(parseLedger(raw as string | null)).toEqual(EMPTY_LEDGER);
    }
    expect(parseLedger(JSON.stringify({ v: 1, n: -3, recent: [1, 'a'] }))).toEqual({ n: 0, recent: ['a'] });
    expect(parseLedger(JSON.stringify({ v: 1, n: 2.9 })).n).toBe(2);
  });

  it('round-trips and keeps only the most recent ids', () => {
    const many = Array.from({ length: RECENT_IDS_KEPT + 10 }, (_, i) => `id-${i}`);
    const back = parseLedger(serializeLedger({ n: 40, recent: many }));
    expect(back.n).toBe(40);
    expect(back.recent).toHaveLength(RECENT_IDS_KEPT);
    expect(back.recent.at(-1)).toBe(`id-${RECENT_IDS_KEPT + 9}`);
  });

  it('holds nothing but a version, a count and letter ids: no timestamp, device id or content', () => {
    expect(serializeKeychain(2)).toBe('{"v":1,"n":2}');
    expect(Object.keys(JSON.parse(serializeLedger({ n: 1, recent: ['x'] })))).toEqual(['v', 'n', 'recent']);
  });

  it('safeCount: whole, finite, never negative', () => {
    expect([safeCount(2.9), safeCount(-1), safeCount(NaN), safeCount(Infinity), safeCount('3'), safeCount(undefined)]).toEqual([2, 0, 0, 0, 0, 0]);
  });

  it('lettersKeptFrom is the largest of the three sources', () => {
    expect(lettersKeptFrom({ keychain: 0, database: 0, present: 0 })).toBe(0);
    expect(lettersKeptFrom({ keychain: 2, database: 0, present: 0 })).toBe(2);
    expect(lettersKeptFrom({ keychain: 0, database: 3, present: 1 })).toBe(3);
    expect(lettersKeptFrom({ keychain: 1, database: 1, present: 5 })).toBe(5);
    expect(lettersKeptFrom({ keychain: NaN, database: -4, present: 2 })).toBe(2);
  });

  it('applyKept counts once per id and never below any source', () => {
    const one = applyKept(EMPTY_LEDGER, 'a', { floor: 0, present: 1 });
    expect(one.n).toBe(1);
    expect(applyKept(one, 'a', { floor: 0, present: 1 })).toBe(one); // same object: nothing changed
    expect(applyKept(one, 'b', { floor: 0, present: 2 }).n).toBe(2);
    expect(applyKept(EMPTY_LEDGER, 'x', { floor: 2, present: 1 }).n).toBe(3); // Keychain remembered 2, so this is the third
    expect(applyKept(EMPTY_LEDGER, 'x', { floor: 0, present: 5 }).n).toBe(5); // a restored database showing 5 letters
  });
});

describe('ledger repository: counted inside the save transaction', () => {
  it('[idempotent per letter id] recording the same id twice counts it once', () => {
    keep(draft().id);
    const id = f.db.get<{ id: string }>('SELECT id FROM entries')!.id;
    expect(ledger.readState(f.ctx).n).toBe(1);
    ledger.recordKept(f.ctx, id, 0);
    ledger.recordKept(f.ctx, id, 0);
    expect(ledger.readState(f.ctx).n).toBe(1);
  });

  it('each new letter adds exactly one, spoken or typed, in the Book or private, in any book', () => {
    keep(draft().id, { captureMode: 'spoken', inBook: true });
    keep(draft().id, { captureMode: 'typed', inBook: false, audioUri: null });
    keep(draft().id, { childId: 'child-ravi', inBook: true });
    expect(ledger.readState(f.ctx).n).toBe(3);
    expect(ledger.countPresent(f.ctx)).toBe(3);
  });

  it('a voice letter kept without words counts (it is a letter)', () => {
    keep(draft().id, { rawTranscript: '', finalText: '', transcriptStatus: 'waiting' });
    expect(ledger.readState(f.ctx).n).toBe(1);
  });

  it('a quiet-day mark is not a letter: it never counts', () => {
    keep(draft().id, { kind: 'not_much', audioUri: null });
    expect(ledger.readState(f.ctx).n).toBe(0);
    expect(ledger.countPresent(f.ctx)).toBe(0);
    entries.upsert(f.ctx, letter({ id: 'q1', kind: 'not_much', audioUri: null }), defaults);
    expect(ledger.countPresent(f.ctx)).toBe(0);
  });

  it('a draft never counts', () => {
    draft();
    draft();
    expect(ledger.countPresent(f.ctx)).toBe(0);
    expect(ledger.readState(f.ctx).n).toBe(0);
  });

  it('[atomic] a failure while saving rolls back the letter, the draft removal and the count together', () => {
    const d = draft();
    f.failNextRun(/INSERT OR REPLACE INTO settings/);
    expect(() => keep(d.id)).toThrow('injected_failure');
    expect(entries.get(f.ctx, d.id)).toBeNull();
    expect(drafts.get(f.ctx, d.id)).toEqual(d);
    expect(ledger.readState(f.ctx).n).toBe(0);
  });

  it('delete, undo, restore, edit and moving between the Book and private never change the count', () => {
    const d = draft();
    keep(d.id, { inBook: true });
    expect(ledger.readState(f.ctx).n).toBe(1);
    entries.tombstone(f.ctx, d.id);
    expect(ledger.readState(f.ctx).n).toBe(1);
    expect(ledger.countPresent(f.ctx)).toBe(1); // a deleted letter still counts (D-083)
    entries.undelete(f.ctx, d.id);
    entries.setInBook(f.ctx, d.id, false);
    entries.setInBook(f.ctx, d.id, true);
    entries.upsert(f.ctx, letter({ id: d.id, finalText: 'Asha, you laughed at the rain.', inBook: false }), defaults);
    expect(ledger.readState(f.ctx).n).toBe(1);
  });

  it('deleting a letter and writing another is still two letters kept (no delete-and-rewrite loop)', () => {
    const a = draft();
    keep(a.id);
    entries.tombstone(f.ctx, a.id);
    keep(draft().id);
    expect(ledger.readState(f.ctx).n).toBe(2);
  });

  it('a purged row (Recently deleted, 30 days) cannot lower it: the mirror remembers', () => {
    const a = draft();
    keep(a.id);
    keep(draft().id);
    f.db.run('DELETE FROM entries WHERE id = ?', a.id); // what a purge does to the row
    expect(ledger.countPresent(f.ctx)).toBe(1);
    expect(ledger.readState(f.ctx).n).toBe(2);
  });

  it('raiseTo only raises', () => {
    ledger.raiseTo(f.ctx, 3);
    ledger.raiseTo(f.ctx, 1);
    expect(ledger.readState(f.ctx).n).toBe(3);
  });

  it('is stored under the settings key letters.keptEver', () => {
    keep(draft().id);
    expect(f.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', LEDGER_SETTING_KEY)?.value).toMatch(/"n":1/);
  });
});

describe('the three sources and the max rule', () => {
  it('Keychain missing (not configured, empty, or unreadable): the database alone decides', async () => {
    keep(draft().id);
    expect(await lettersKept(dbAdapter())).toBe(1);
    const kc = fakeKeychain();
    configureLedgerStorage(kc.storage);
    expect(await lettersKept(dbAdapter())).toBe(1);
    kc.break();
    expect(await lettersKept(dbAdapter())).toBe(1);
    await expect(mirrorLedger(dbAdapter())).resolves.toBe(1); // a failed Keychain write never throws
  });

  it('Keychain higher than the database (reinstall on the same phone): the Keychain count stands, and heals the mirror', async () => {
    const kc = fakeKeychain(2);
    configureLedgerStorage(kc.storage);
    expect(await lettersKept(dbAdapter())).toBe(2);
    expect(ledger.readState(f.ctx).n).toBe(0);
    await syncLedger(dbAdapter());
    expect(ledger.readState(f.ctx).n).toBe(2);
    expect(await pressKeep(f.ctx.newId(), FREE)).toBe('held'); // reinstall did not give two more free letters
    expect(ledger.countPresent(f.ctx)).toBe(0);
  });

  it('a letter kept right after a reinstall, before any sync, still counts from the Keychain floor', async () => {
    const kc = fakeKeychain(2);
    configureLedgerStorage(kc.storage);
    await readKeychainCount(); // the app read it at launch
    keep(draft().id); // saved while Plus is on
    expect(ledger.readState(f.ctx).n).toBe(3);
  });

  it('restored database, Keychain gone (iCloud backup to a new phone): the mirror and the letters present decide, and heal the Keychain', async () => {
    keep(draft().id);
    keep(draft().id);
    const kc = fakeKeychain();
    configureLedgerStorage(kc.storage);
    expect(await lettersKept(dbAdapter())).toBe(2);
    await syncLedger(dbAdapter());
    expect(kc.count()).toBe(2);
  });

  it('restored database whose mirror was lost: the letters present still give the count', async () => {
    keep(draft().id);
    keep(draft().id);
    ledger.clear(f.ctx);
    expect(ledger.readState(f.ctx).n).toBe(0);
    expect(await lettersKept(dbAdapter())).toBe(2);
    expect(await pressKeep(f.ctx.newId(), FREE)).toBe('held');
  });

  it('a new phone with no backup starts at 0: both failures err on the safe side (a gift, never a lock-out)', async () => {
    configureLedgerStorage(fakeKeychain().storage);
    expect(await lettersKept(dbAdapter())).toBe(0);
  });

  it('a store that cannot be read counts as 0 (the safe side)', async () => {
    const broken: LedgerDb = { counts: () => { throw new Error('store_closed'); }, raiseTo: () => { throw new Error('store_closed'); }, clear: () => { throw new Error('store_closed'); } };
    expect(await lettersKept(broken)).toBe(0);
    await expect(syncLedger(broken)).resolves.toBe(0);
    await expect(clearLedger(broken)).resolves.toBeUndefined();
  });

  it('mirrorLedger copies the database count to the Keychain after a keep', async () => {
    const kc = fakeKeychain();
    configureLedgerStorage(kc.storage);
    keep(draft().id);
    await mirrorLedger(dbAdapter());
    expect(kc.count()).toBe(1);
    expect(kc.items.get(LEDGER_KEYCHAIN_KEY)).toBe('{"v":1,"n":1}'); // a number and a version, nothing else
  });

  it('the Keychain count never goes down', async () => {
    const kc = fakeKeychain(5);
    configureLedgerStorage(kc.storage);
    await syncLedger(dbAdapter()); // database says 0
    expect(kc.count()).toBe(5);
  });
});

describe('Erase everything clears the ledger (D-083)', () => {
  it('removes the Keychain item and the database mirror, so the free count starts again', async () => {
    const kc = fakeKeychain();
    configureLedgerStorage(kc.storage);
    keep(draft().id);
    keep(draft().id);
    await mirrorLedger(dbAdapter());
    expect(kc.count()).toBe(2);
    f.db.run('DELETE FROM entries'); // the erase removes the letters themselves
    await clearLedger(dbAdapter());
    expect(kc.items.has(LEDGER_KEYCHAIN_KEY)).toBe(false);
    expect(ledger.readState(f.ctx).n).toBe(0);
    expect(keychainFloor()).toBe(0);
    expect(await lettersKept(dbAdapter())).toBe(0);
    expect(await pressKeep(f.ctx.newId(), FREE)).toBe('kept');
  });
});

describe('the Keep gate flow: 2 free letters, then Plus (D-082)', () => {
  it('letters 1 and 2 are kept, letter 3 is held on a Free phone', async () => {
    configureLedgerStorage(fakeKeychain().storage);
    const a = draft().id;
    const b = draft().id;
    const c = draft();
    expect(await pressKeep(a, FREE)).toBe('kept');
    expect(await pressKeep(b, FREE)).toBe('kept');
    expect(await pressKeep(c.id, FREE)).toBe('held');
  });

  it('[never lose a recording] a held letter writes nothing: the draft is exactly as it was, and no letter exists', async () => {
    configureLedgerStorage(fakeKeychain().storage);
    await pressKeep(draft().id, FREE);
    await pressKeep(draft().id, FREE);
    const before = f.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')!.n;
    const third = draft();
    const draftsBefore = f.db.all('SELECT * FROM drafts');
    expect(await pressKeep(third.id, FREE)).toBe('held');
    expect(drafts.get(f.ctx, third.id)).toEqual(third);
    expect(f.db.all('SELECT * FROM drafts')).toEqual(draftsBefore);
    expect(f.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')!.n).toBe(before);
    expect(ledger.readState(f.ctx).n).toBe(2);
    // "Kill and relaunch": a fresh read still finds the waiting draft.
    expect(drafts.listForChild(f.ctx, 'child-asha').map((d) => d.id)).toContain(third.id);
  });

  it('[Keep after Plus starts saves once] the held letter is kept by the person once Plus is on, and a second press does not add another', async () => {
    configureLedgerStorage(fakeKeychain().storage);
    await pressKeep(draft().id, FREE);
    await pressKeep(draft().id, FREE);
    const third = draft();
    expect(await pressKeep(third.id, FREE)).toBe('held');
    expect(await pressKeep(third.id, PLUS)).toBe('kept');
    expect(entries.get(f.ctx, third.id)).not.toBeNull();
    expect(drafts.get(f.ctx, third.id)).toBeNull();
    expect(ledger.readState(f.ctx).n).toBe(3);
    // The same id again (a double tap that raced): the upsert updates the row and the ledger counts it once.
    ledger.recordKept(f.ctx, third.id, 0);
    expect(ledger.readState(f.ctx).n).toBe(3);
    expect(f.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')!.n).toBe(3);
  });

  it('with Plus lapsed the gate returns at the limit, and under Plus every letter is counted', async () => {
    configureLedgerStorage(fakeKeychain().storage);
    for (let i = 0; i < 5; i++) expect(await pressKeep(draft().id, PLUS)).toBe('kept');
    expect(ledger.readState(f.ctx).n).toBe(5);
    expect(await pressKeep(draft().id, FREE)).toBe('held');
  });

  it('a raised remote allowance gives that many; a lowered one changes nothing', async () => {
    configureLedgerStorage(fakeKeychain().storage);
    expect(await pressKeep(draft().id, FREE, 4)).toBe('kept');
    expect(await pressKeep(draft().id, FREE, 4)).toBe('kept');
    expect(await pressKeep(draft().id, FREE, 4)).toBe('kept');
    expect(await pressKeep(draft().id, FREE, 4)).toBe('kept');
    expect(await pressKeep(draft().id, FREE, 4)).toBe('held');
    const fresh = fixture();
    seedChild(fresh.db);
    f.close();
    f = fresh;
    configureLedgerStorage(null);
    await pressKeep(draft().id, FREE, 0);
    await pressKeep(draft().id, FREE, 0);
    expect(await pressKeep(draft().id, FREE, 0)).toBe('held');
  });
});
