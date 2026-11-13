/// <reference types="node" />
/**
 * useNewPhone itself, run in Node (NX-36-S17 Tier 0). The pure decisions are in new-phone-route.test.ts (openingView);
 * this file runs the thin layer around them that source-text checks cannot see: the one question asked on every mount
 * and retry, the 10 second clock, and the retry when the connection returns. Runs on the small hook stand-in
 * (test/helpers/mini-react.ts); the sync engine and the server question are replaced by a few lines each.
 * The last test runs "Erase everything" on the real store and checks `newPhone.arrival` goes with it.
 * Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountKind } from '../src/lib/first-run/account-books.logic';

const h = vi.hoisted(() => ({
  asked: [] as Array<(k: 'new' | 'hasBook' | 'returningNoBook' | 'unknown') => void>,
  syncNowCalls: 0,
  status: { phase: 'idle', lastSyncedAt: null as string | null },
  listeners: new Set<(s: unknown) => void>(),
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('../src/lib/first-run/account-books', () => ({
  readAccountBooks: () =>
    new Promise((resolve) => {
      h.asked.push(resolve as never);
    }),
}));
vi.mock('@/lib/sync', () => ({
  getSyncStatus: () => h.status,
  subscribeSyncStatus: (l: (s: unknown) => void) => {
    h.listeners.add(l);
    return () => h.listeners.delete(l);
  },
  syncNow: () => {
    h.syncNowCalls += 1;
    return Promise.resolve(null);
  },
}));

const { renderHook } = await import('./helpers/mini-react');
const { useNewPhone } = await import('../src/lib/first-run/use-new-phone');
const { OPENING_WAIT_MS } = await import('../src/lib/first-run/new-phone.logic');

const client = {} as SupabaseClient;
const base = { enabled: true, client, hasLocalBook: false, online: true };
const flush = () => vi.advanceTimersByTimeAsync(0);
const syncEvent = (s: { phase: string; lastSyncedAt: string | null }) => {
  h.status = s;
  for (const l of [...h.listeners]) l(s);
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T09:00:00.000Z'));
  h.asked.length = 0;
  h.syncNowCalls = 0;
  h.status = { phase: 'idle', lastSyncedAt: null };
  h.listeners.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('[NX-36-S17] useNewPhone, run', () => {
  it('a phone that starts with no book asks once and shows "opening" until the answer, then follows it', async () => {
    const run = renderHook(() => useNewPhone(base));
    expect(h.asked).toHaveLength(1);
    expect(h.syncNowCalls).toBe(1);
    expect(run.result.current.view).toBe('opening');
    h.asked[0]('new');
    await flush();
    expect(run.result.current.view).toBe('new');
    run.unmount();
  });

  it('asks again on every mount: nothing from the first mount is remembered', async () => {
    const first = renderHook(() => useNewPhone(base));
    h.asked[0]('hasBook');
    await flush();
    first.unmount();
    const second = renderHook(() => useNewPhone(base));
    expect(h.asked).toHaveLength(2);
    expect(second.result.current.view).toBe('opening'); // the old answer is not read back
    second.unmount();
  });

  it('a phone that starts with a book (every ordinary launch), or has nothing to ask with, never asks and never follows the engine', () => {
    const withBook = renderHook(() => useNewPhone({ ...base, hasLocalBook: true }));
    expect(withBook.result.current.view).toBeNull();
    const off = renderHook(() => useNewPhone({ ...base, enabled: false }));
    expect(off.result.current.view).toBeNull();
    const noClient = renderHook(() => useNewPhone({ ...base, client: null }));
    expect(noClient.result.current.view).toBeNull();
    expect(h.asked).toHaveLength(0);
    expect(h.syncNowCalls).toBe(0);
    expect(h.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('owns the 10 second clock: the account has a book that has not arrived, "opening" until 10 s, then "slow"', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('hasBook');
    await flush();
    expect(run.result.current.view).toBe('opening');
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS - 1000);
    expect(run.result.current.view).toBe('opening');
    await vi.advanceTimersByTimeAsync(1000 + 100);
    expect(run.result.current.view).toBe('slow');
    run.unmount();
  });

  it('the clock starts when the question goes out, not when the hook was first mounted inactive (no flash of the slow screen)', async () => {
    let enabled = false;
    const run = renderHook(() => useNewPhone({ ...base, enabled }));
    expect(run.result.current.view).toBeNull();
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS * 3); // the consent steps take a while
    enabled = true;
    run.rerender();
    expect(run.result.current.view).toBe('opening');
    h.asked[0]('hasBook');
    await flush();
    expect(run.result.current.view).toBe('opening');
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS - 1000);
    expect(run.result.current.view).toBe('opening');
    run.unmount();
  });

  it('the book lands and the first cycle is done: arrived; an old stamp from before the wait does not count', async () => {
    h.status = { phase: 'idle', lastSyncedAt: '2026-11-09T09:00:00.000Z' };
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    h.asked[0]('hasBook');
    await flush();
    syncEvent({ phase: 'syncing', lastSyncedAt: '2026-11-09T09:00:00.000Z' });
    hasLocalBook = true;
    run.rerender();
    expect(run.result.current.view).toBe('opening'); // the first page landed, the cycle runs
    syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-09T09:00:00.000Z' });
    expect(run.result.current.view).toBe('opening'); // idle, but no cycle has finished since the wait began
    syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
    expect(run.result.current.view).toBe('arrived');
    run.unmount();
  });

  it('the clock stops with the screen: no render after unmount', async () => {
    const run = renderHook(() => useNewPhone(base));
    const before = run.renders;
    run.unmount();
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS + 1000);
    expect(run.renders).toBe(before);
    expect(h.listeners.size).toBe(0);
  });

  it('Try again asks the account again, nudges the pull, and starts the 10 seconds over', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('hasBook');
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS + 100);
    expect(run.result.current.view).toBe('slow');
    run.result.current.retry();
    expect(h.asked).toHaveLength(2);
    expect(h.syncNowCalls).toBe(2);
    expect(run.result.current.view).toBe('opening');
    h.asked[1]('unknown');
    await flush();
    expect(run.result.current.view).toBe('noBook');
    run.unmount();
  });

  it('an answer that arrives after Try again for the old question is ignored', async () => {
    const run = renderHook(() => useNewPhone(base));
    run.result.current.retry();
    expect(h.asked).toHaveLength(2);
    h.asked[0]('new'); // the stale one
    await flush();
    expect(run.result.current.view).toBe('opening');
    h.asked[1]('unknown');
    await flush();
    expect(run.result.current.view).toBe('noBook');
    run.unmount();
  });

  it('retries by itself when the connection returns, and not when it was already there', async () => {
    let online = false;
    const run = renderHook(() => useNewPhone({ ...base, online }));
    expect(h.asked).toHaveLength(1);
    h.asked[0]('unknown' as AccountKind);
    await flush();
    expect(run.result.current.view).toBe('offline');
    run.rerender(); // same connection: no new question
    expect(h.asked).toHaveLength(1);
    online = true;
    run.rerender();
    expect(h.asked).toHaveLength(2);
    expect(run.result.current.view).toBe('opening');
    run.unmount();
  });

  it('a reconnect under the child step, or under No book here yet, asks nothing: those screens are not swapped for the loading screen', async () => {
    for (const kind of ['new', 'returningNoBook'] as const) {
      h.asked.length = 0;
      let online = true;
      const run = renderHook(() => useNewPhone({ ...base, online }));
      h.asked[0](kind);
      await flush();
      const before = run.result.current.view;
      online = false;
      run.rerender();
      online = true;
      run.rerender();
      expect(h.asked, kind).toHaveLength(1);
      expect(run.result.current.view, kind).toBe(before);
      run.unmount();
    }
  });

  it('"Start a book" on No book here yet moves on to the child step', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('unknown');
    await flush();
    expect(run.result.current.view).toBe('noBook');
    run.result.current.startBook();
    expect(run.result.current.view).toBe('new');
    run.unmount();
  });
});

describe('[NX-36-S17] Erase everything clears newPhone.arrival', () => {
  it('the setting is on the phone before, gone after, and the next arrival is owed again', async () => {
    vi.useRealTimers();
    const { nodeDb } = await import('./helpers/node-db');
    vi.doMock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
    vi.doMock('../src/lib/db/repos/open-native', () => ({
      openNativeDb: () => {
        throw new Error('native open must not be used in tests');
      },
    }));
    vi.resetModules();
    const store = await import('../src/lib/store');
    const logic = await import('../src/lib/first-run/new-phone.logic');
    const handle = nodeDb();
    let seq = 0;
    expect(
      store.openStore({
        open: () => ({ db: handle.db, close: () => {} }),
        now: () => '2026-11-10T09:00:00.000Z',
        newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
      }).ok,
    ).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    store.setSetting(logic.ARRIVAL_SETTING, logic.ARRIVAL_SHOWN);
    expect(store.getSetting(logic.ARRIVAL_SETTING)).toBe('shown');
    expect(store.eraseEverythingLocal(() => {}, () => {})).toBe('erased');
    store.finishEraseEverything();
    expect(store.getSetting(logic.ARRIVAL_SETTING)).toBeNull();
    expect(logic.arrivalToWrite(store.getSetting(logic.ARRIVAL_SETTING))).toBe('pending');
    store.closeStore();
    handle.close();
  });
});
