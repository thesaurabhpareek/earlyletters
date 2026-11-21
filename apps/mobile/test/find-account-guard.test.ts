/// <reference types="node" />
/**
 * [X4-R1] Find and the second account: with another account signed in over this owner's book, the store's Find calls
 * index nothing, search nothing and drop nothing; and with the build flag not 'on', findLetters finds nothing.
 * Fictional family "Asha" only.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { entries } from '../src/lib/db/repos';
import { setFindForTest } from '../src/lib/find/flag';
import { SEARCH_ROWS_TABLE, SEARCH_TABLE } from '../src/lib/find/lifecycle';
import { rebuildSearchIndex } from '../src/lib/find/rebuild';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { insertBook, letter } from './helpers/store-fixture';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/find/rebuild', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/find/rebuild')>();
  return { ...real, rebuildSearchIndex: vi.fn(real.rebuildSearchIndex) };
});

const store = await import('../src/lib/store');
const auth = await import('../src/lib/auth/auth-store');
const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-20T09:00:00.000Z';
let n = 0;
const newId = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ready = (userId: string) => auth.publishAuth({ status: 'ready', userId, sync: 'on' });

function open() {
  store.closeStore();
  const h = nodeDb();
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId }).ok).toBe(true);
  const db = store.localSqlDb();
  insertBook(db, { id: 'child-asha', name: 'Asha', birthday: '2026-03-01', at: NOW });
  entries.upsert(
    { db, now: () => NOW, newId },
    letter({ id: newId(), finalText: 'Asha, you laughed at the rain today.', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, captureMode: 'typed', inBook: true }),
    { childId: null, authorSignsAs: null },
  );
  writeSetting(db, SYNC_SETTING.owner, A);
  return { h, db };
}
const hasIndex = (db: ReturnType<typeof store.localSqlDb>) => db.get(`SELECT 1 FROM sqlite_master WHERE name = '${SEARCH_TABLE}'`) !== null;

afterEach(() => {
  setFindForTest(null);
  auth.resetAuthStoreForTests();
  store.closeStore();
  vi.useRealTimers();
});

describe('[X4-R1] the second-account guard on Find', () => {
  it('ensureFindIndex: B signed in over A\'s book builds no index and drops none; A\'s own session builds it', async () => {
    const { h, db } = open();
    try {
      setFindForTest(true);
      ready(B);
      vi.mocked(rebuildSearchIndex).mockClear();
      expect(await store.ensureFindIndex()).toBe('unavailable');
      expect(hasIndex(db)).toBe(false);
      expect(rebuildSearchIndex).not.toHaveBeenCalled();
      ready(A);
      expect(await store.ensureFindIndex()).toBe('ready');
      expect(hasIndex(db)).toBe(true);
      ready(B);
      setFindForTest(false); // build now off: the drop of an old index must also wait while B is signed in
      expect(await store.ensureFindIndex()).toBe('unavailable');
      expect(hasIndex(db)).toBe(true);
    } finally {
      h.close();
    }
  });

  it('startFindCatchUp: with B signed in nothing is built; once A is back the same open store still catches up', async () => {
    vi.useFakeTimers();
    const { h, db } = open();
    try {
      setFindForTest(true);
      ready(B);
      vi.mocked(rebuildSearchIndex).mockClear();
      store.startFindCatchUp();
      await vi.advanceTimersByTimeAsync(5_000);
      expect([vi.mocked(rebuildSearchIndex).mock.calls.length, hasIndex(db)]).toEqual([0, false]);
      ready(A);
      store.startFindCatchUp();
      await vi.advanceTimersByTimeAsync(5_000);
      expect([vi.mocked(rebuildSearchIndex).mock.calls.length, hasIndex(db)]).toEqual([1, true]);
    } finally {
      h.close();
    }
  });

  it('findLetters: B signed in over A\'s book finds nothing, even with a built index; A finds the letter', async () => {
    const { h } = open();
    try {
      setFindForTest(true);
      ready(A);
      await store.ensureFindIndex();
      const mine = store.findLetters('rain', 'child-asha');
      expect(mine.status === 'done' ? mine.hits.length : -1).toBe(1);
      ready(B);
      expect(store.findLetters('rain', 'child-asha')).toEqual({ status: 'idle' });
    } finally {
      h.close();
    }
  });

  it('the seam: a letter written while B is signed in over A\'s book does not enter the index', async () => {
    const { h, db } = open();
    try {
      setFindForTest(true);
      ready(A);
      await store.ensureFindIndex();
      ready(B);
      entries.upsert(
        { db, now: () => NOW, newId },
        letter({ id: newId(), finalText: 'The harbour walk.', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, captureMode: 'typed', inBook: true }),
        { childId: null, authorSignsAs: null },
      );
      expect(db.all(`SELECT 1 FROM ${SEARCH_ROWS_TABLE}`)).toHaveLength(1); // A's first letter only
    } finally {
      h.close();
    }
  });

  it('findLetters: unless the build flag is on, it returns nothing', async () => {
    const { h } = open();
    try {
      setFindForTest(false);
      expect(store.findLetters('rain', 'child-asha')).toEqual({ status: 'idle' });
      setFindForTest(true);
      const r = store.findLetters('rain', 'child-asha');
      expect(r.status === 'done' ? r.hits.length : -1).toBe(1);
    } finally {
      h.close();
    }
  });
});
