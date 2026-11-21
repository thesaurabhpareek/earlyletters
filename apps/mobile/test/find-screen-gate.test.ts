/// <reference types="node" />
/**
 * BL-952 slice 8: the gate of Find's screen (build switch, pause, letters, account) and the catch-up when account A
 * returns (reviewer note on #1208). Fictional family "Asha" only.
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
const { watchAccountScope } = await import('../src/lib/auth/account-scope');
const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-20T09:00:00.000Z';
let n = 0;
const newId = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ready = (userId: string) => auth.publishAuth({ status: 'ready', userId, sync: 'on' });
const add = (db: ReturnType<typeof store.localSqlDb>, text: string) =>
  entries.upsert(
    { db, now: () => NOW, newId },
    letter({ id: newId(), finalText: text, audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, captureMode: 'typed', inBook: true }),
    { childId: null, authorSignsAs: null },
  );

function open() {
  store.closeStore();
  const h = nodeDb();
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId }).ok).toBe(true);
  const db = store.localSqlDb();
  insertBook(db, { id: 'child-asha', name: 'Asha', birthday: '2026-03-01', at: NOW });
  add(db, 'Asha, you laughed at the rain today.');
  writeSetting(db, SYNC_SETTING.owner, A);
  return { h, db };
}

afterEach(() => {
  setFindForTest(null);
  auth.resetAuthStoreForTests();
  store.closeStore();
  vi.useRealTimers();
});

describe('findAvailableNow: the screen is reachable only when every part holds', () => {
  const cases: [string, boolean, boolean, boolean, string | null, boolean][] = [
    ['all hold', true, false, true, A, true],
    ['build switch off', false, false, true, A, false],
    ['remote pause on', true, true, true, A, false],
    ['no kept letter', true, false, false, A, false],
    ['another account signed in', true, false, true, B, false],
  ];
  it.each(cases)('%s', (_n, build, paused, hasLetters, user, want) => {
    const { h } = open();
    try {
      setFindForTest(build);
      if (user) ready(user);
      expect(store.findAvailableNow({ paused, hasLetters })).toBe(want);
    } finally {
      h.close();
    }
  });
});

describe('[X4-R1] A returns: Find catches up now, not at the next launch', () => {
  it('a letter written into A\'s book while B was signed in is found once A is back', async () => {
    vi.useFakeTimers();
    const { h, db } = open();
    const stop = watchAccountScope();
    try {
      setFindForTest(true);
      ready(A);
      store.startFindCatchUp();
      await vi.advanceTimersByTimeAsync(5_000);
      ready(B);
      add(db, 'The ducks came by the water.'); // skipped by the seam: not indexed
      vi.mocked(rebuildSearchIndex).mockClear();
      ready(A);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(vi.mocked(rebuildSearchIndex).mock.calls.length).toBe(1);
      const r = store.findLetters('ducks', 'child-asha');
      expect(r.status === 'done' ? [r.hits.length, r.path] : null).toEqual([1, 'index']);
    } finally {
      stop();
      h.close();
    }
  });

  it('B signing in, or A staying signed in, starts nothing', async () => {
    vi.useFakeTimers();
    const { h } = open();
    const stop = watchAccountScope();
    try {
      setFindForTest(true);
      ready(A);
      store.startFindCatchUp();
      await vi.advanceTimersByTimeAsync(5_000);
      vi.mocked(rebuildSearchIndex).mockClear();
      ready(B);
      ready(A);
      ready(A);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(vi.mocked(rebuildSearchIndex).mock.calls.length).toBe(1); // only the one for A's return
    } finally {
      stop();
      h.close();
    }
  });
});
