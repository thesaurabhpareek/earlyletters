/// <reference types="node" />
/**
 * The letter ledger's max rule at its edges (D-082, D-083; debate Q-013 section 3):
 * the in-process floor, a restored database with more letters than its mirror,
 * the recent-id window, and the three sources when one of them is junk or
 * unreadable. Real SQLite (node:sqlite) and a fake Keychain. Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { entries, ledger } from '../src/lib/db/repos';
import {
  clearLedger,
  configureLedgerStorage,
  keychainFloor,
  lettersKept,
  raiseKeychainCount,
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
  raised,
  RECENT_IDS_KEPT,
  serializeKeychain,
  serializeLedger,
} from '../src/lib/billing/letter-ledger.logic';
import { fixture, letter, seedChild, type Fixture } from './helpers/store-fixture';

let f: Fixture;
const defaults = { childId: 'child-asha', authorSignsAs: 'Mama' };
const mirror = () => f.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', LEDGER_SETTING_KEY)?.value ?? null;

function keychain(initial?: number) {
  const items = new Map<string, string>();
  if (initial !== undefined) items.set(LEDGER_KEYCHAIN_KEY, serializeKeychain(initial));
  let readsFail = false;
  let writesFail = false;
  const storage: LedgerStorage = {
    getItem: async (k) => {
      if (readsFail) throw new Error('keychain_unavailable');
      return items.get(k) ?? null;
    },
    setItem: async (k, v) => {
      if (writesFail) throw new Error('keychain_unavailable');
      items.set(k, v);
    },
    removeItem: async (k) => {
      items.delete(k);
    },
  };
  return { storage, items, failReads: () => (readsFail = true), failWrites: () => (writesFail = true), count: () => parseLedger(items.get(LEDGER_KEYCHAIN_KEY) ?? null).n };
}

const dbAdapter = (): LedgerDb => ({
  counts: () => ({ recorded: ledger.readState(f.ctx).n, present: ledger.countPresent(f.ctx) }),
  raiseTo: (n) => void ledger.raiseTo(f.ctx, n),
  clear: () => ledger.clear(f.ctx),
});

beforeEach(() => {
  f = fixture();
  seedChild(f.db);
  configureLedgerStorage(null);
});
afterEach(() => {
  configureLedgerStorage(null);
  f.close();
});

describe('the pure max rule', () => {
  it('[D-082] a junk source counts as 0 for that source only; the others still decide', () => {
    expect(lettersKeptFrom({ keychain: NaN, database: 3, present: 1 })).toBe(3);
    expect(lettersKeptFrom({ keychain: -5, database: Number.POSITIVE_INFINITY, present: 2 })).toBe(2);
    expect(lettersKeptFrom({ keychain: '7' as unknown as number, database: 0, present: 0 })).toBe(0);
    expect(lettersKeptFrom({ keychain: 2.9, database: 2.1, present: 0 })).toBe(2);
  });

  it('applyKept: the count is never below floor + 1 or the letters present, and the window keeps the last RECENT_IDS_KEPT ids', () => {
    expect(applyKept(EMPTY_LEDGER, 'a', { floor: 0, present: 1 })).toEqual({ n: 1, recent: ['a'] });
    expect(applyKept(EMPTY_LEDGER, 'a', { floor: 4, present: 1 })).toEqual({ n: 5, recent: ['a'] });
    expect(applyKept(EMPTY_LEDGER, 'a', { floor: 0, present: 9 })).toEqual({ n: 9, recent: ['a'] });
    let s = EMPTY_LEDGER;
    for (let i = 0; i < RECENT_IDS_KEPT + 1; i++) s = applyKept(s, `id-${i}`, { floor: 0, present: 0 });
    expect(s.n).toBe(RECENT_IDS_KEPT + 1);
    expect(s.recent).toHaveLength(RECENT_IDS_KEPT);
    expect(s.recent[0]).toBe('id-1');
    // Inside the window an id counts once; an id older than the window is no longer remembered.
    expect(applyKept(s, 'id-1', { floor: 0, present: 0 })).toBe(s);
    expect(applyKept(s, 'id-0', { floor: 0, present: 0 }).n).toBe(RECENT_IDS_KEPT + 2);
  });

  it('raised: returns the same object when nothing changes, never lowers', () => {
    const s = { n: 4, recent: ['x'] };
    expect(raised(s, 4)).toBe(s);
    expect(raised(s, 2)).toBe(s);
    expect(raised(s, NaN)).toBe(s);
    expect(raised(s, 6)).toEqual({ n: 6, recent: ['x'] });
  });

  it('serialize never writes a fraction, a negative count or more than the window', () => {
    const many = Array.from({ length: 40 }, (_, i) => `k${i}`);
    expect(parseLedger(serializeLedger({ n: 3.7, recent: many }))).toEqual({ n: 3, recent: many.slice(-RECENT_IDS_KEPT) });
    expect(parseLedger(serializeLedger({ n: -2, recent: [] }))).toEqual(EMPTY_LEDGER);
    expect(JSON.parse(serializeKeychain(2.5))).toEqual({ v: 1, n: 2 });
    expect(parseLedger('{"v":2,"n":9,"recent":[]}')).toEqual(EMPTY_LEDGER);
    expect(parseLedger('{"v":1,"n":"9","recent":[1,"a",null]}')).toEqual({ n: 0, recent: ['a'] });
  });
});

describe('the database side (db/repos/ledger.ts)', () => {
  const keep = (id: string, floor = 0) => {
    entries.upsert(f.ctx, letter({ id, finalText: 'A letter.' }), defaults);
    return ledger.recordKept(f.ctx, id, floor);
  };

  it('[D-083] a restored database with more letters than its mirror says counts the letters', () => {
    for (let i = 1; i <= 5; i++) entries.upsert(f.ctx, letter({ id: `restored-${i}` }), defaults);
    f.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', LEDGER_SETTING_KEY, serializeLedger({ n: 1, recent: [] }));
    expect(keep('new-1').n).toBe(6);
    expect(ledger.readState(f.ctx).recent).toEqual(['new-1']);
  });

  it('[D-083] a Keychain floor ahead of the mirror makes the next letter floor + 1', () => {
    expect(keep('a', 7).n).toBe(8);
    expect(keep('b', 7).n).toBe(9);
    expect(keep('b', 100).n).toBe(9); // counted once, whatever the floor says later
  });

  it('raiseTo writes nothing when the mirror is already at least n', () => {
    keep('a');
    const before = mirror();
    expect(ledger.raiseTo(f.ctx, 1)).toEqual(ledger.readState(f.ctx));
    expect(mirror()).toBe(before);
    ledger.raiseTo(f.ctx, 3);
    expect(parseLedger(mirror()).n).toBe(3);
  });

  it('a quiet-day mark and a draft are not letters present; a deleted letter still is until it is erased', () => {
    keep('a');
    entries.upsert(f.ctx, letter({ id: 'q', kind: 'not_much', rawTranscript: '', finalText: '', inBook: false }), defaults);
    expect(ledger.countPresent(f.ctx)).toBe(1);
    entries.tombstone(f.ctx, 'a');
    expect(ledger.countPresent(f.ctx)).toBe(1);
    entries.eraseRow(f.ctx, 'a');
    expect(ledger.countPresent(f.ctx)).toBe(0);
    expect(ledger.readState(f.ctx).n).toBe(1); // the mirror remembers
  });
});

describe('the Keychain side and the in-process floor', () => {
  it('readKeychainCount raises the floor and never lowers it, even when the item later reads lower', async () => {
    const k = keychain(5);
    configureLedgerStorage(k.storage);
    expect(await readKeychainCount()).toBe(5);
    expect(keychainFloor()).toBe(5);
    k.items.set(LEDGER_KEYCHAIN_KEY, serializeKeychain(2));
    expect(await readKeychainCount()).toBe(2);
    expect(keychainFloor()).toBe(5);
  });

  it('a Keychain that cannot be read answers with the floor; one that cannot be written still raises the floor', async () => {
    const k = keychain(3);
    configureLedgerStorage(k.storage);
    await readKeychainCount();
    k.failReads();
    expect(await readKeychainCount()).toBe(3);
    const w = keychain(1);
    configureLedgerStorage(w.storage);
    w.failWrites();
    await raiseKeychainCount(4);
    expect(keychainFloor()).toBe(4);
    expect(w.count()).toBe(1);
  });

  it('[D-082] the gate reads the largest of the three, and syncLedger heals the other two up to it', async () => {
    const k = keychain(2);
    configureLedgerStorage(k.storage);
    for (let i = 1; i <= 3; i++) entries.upsert(f.ctx, letter({ id: `p${i}` }), defaults);
    f.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', LEDGER_SETTING_KEY, serializeLedger({ n: 1, recent: [] }));
    expect(await lettersKept(dbAdapter())).toBe(3);
    expect(await syncLedger(dbAdapter())).toBe(3);
    expect(k.count()).toBe(3);
    expect(parseLedger(mirror()).n).toBe(3);
  });

  it('a store that throws counts as 0 on its side; the Keychain still counts', async () => {
    const k = keychain(4);
    configureLedgerStorage(k.storage);
    const broken: LedgerDb = {
      counts: () => {
        throw new Error('store_closed');
      },
      raiseTo: () => {
        throw new Error('store_closed');
      },
      clear: () => {
        throw new Error('store_closed');
      },
    };
    expect(await lettersKept(broken)).toBe(4);
    expect(await syncLedger(broken)).toBe(4);
  });

  it('[D-083] clearLedger resets the floor and both copies, even when the store throws', async () => {
    const k = keychain(6);
    configureLedgerStorage(k.storage);
    await readKeychainCount();
    expect(keychainFloor()).toBe(6);
    const broken: LedgerDb = { counts: () => ({ recorded: 0, present: 0 }), raiseTo: () => {}, clear: () => { throw new Error('store_closed'); } };
    await clearLedger(broken);
    expect(keychainFloor()).toBe(0);
    expect(k.items.has(LEDGER_KEYCHAIN_KEY)).toBe(false);
    await clearLedger(dbAdapter());
    expect(mirror()).toBeNull();
  });
});
