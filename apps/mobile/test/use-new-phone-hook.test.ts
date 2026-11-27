/// <reference types="node" />
/**
 * useNewPhone itself, run in Node (NX-36-S17 Tier 0). The pure decisions are in new-phone-route.test.ts (openingView);
 * this file runs the thin layer around them that source-text checks cannot see: the one question asked on every mount
 * and retry, the 10 second clock, and the retry when the connection returns. Runs on the small hook stand-in
 * (test/helpers/mini-react.ts); the sync engine and the server question are replaced by a few lines each.
 * The last test runs the store's erase (`eraseEverythingLocal`, the function behind Erase everything) on the real store and
 * checks `newPhone.arrival` goes with it; the Settings row itself is not offered on a phone that has signed in.
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
const { OPENING_WAIT_MS, accountJoined } = await import('../src/lib/first-run/new-phone.logic');

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
  accountJoined.settled(); // no accept outlives its test (round 2's in-memory flag), even when an expectation failed
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

  it('Try again asks the account again and nudges the pull; the 10 seconds are not started over (R11)', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('hasBook');
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS + 100);
    expect(run.result.current.view).toBe('slow');
    run.result.current.retry();
    expect(h.asked).toHaveLength(2);
    expect(h.syncNowCalls).toBe(2);
    expect(run.result.current.view).toBe('slow'); // the clock ran out before Try again and is not restarted
    h.asked[1]('unknown');
    await flush();
    expect(run.result.current.view).toBe('noBook');
    expect(h.asked).toHaveLength(2); // past the window: no automatic re-ask either
    run.unmount();
  });

  it('an answer that arrives after Try again for the old question is ignored', async () => {
    const run = renderHook(() => useNewPhone(base));
    run.result.current.retry();
    expect(h.asked).toHaveLength(2);
    h.asked[0]('new'); // the stale one
    await flush();
    expect(run.result.current.view).toBe('opening');
    h.asked[1]('returningNoBook');
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

  it('hasBook says the account has answered with a book: false while asking, true after, false again after Try again, false when inactive', async () => {
    const run = renderHook(() => useNewPhone(base));
    expect(run.result.current.hasBook).toBe(false);
    h.asked[0]('hasBook');
    await flush();
    expect(run.result.current.hasBook).toBe(true);
    run.result.current.retry();
    expect(run.result.current.hasBook).toBe(false);
    h.asked[1]('new');
    await flush();
    expect(run.result.current.hasBook).toBe(false);
    run.unmount();
    const off = renderHook(() => useNewPhone({ ...base, enabled: false }));
    expect(off.result.current.hasBook).toBe(false);
    off.unmount();
  });

  it('"Start a book" on No book here yet moves on to the child step', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('returningNoBook');
    await flush();
    expect(run.result.current.view).toBe('noBook');
    run.result.current.startBook();
    expect(run.result.current.view).toBe('new');
    run.unmount();
  });
});

describe('[BL-2159] a join on this phone asks the account again (NX-36-S17 cited, not changed)', () => {
  it('[BL-2159] accept, then close, before the book arrives: the "no book" answer from before the join is asked again, and the route waits for the book instead of showing No book here yet', async () => {
    const run = renderHook(() => useNewPhone(base));
    // Signed in from the join sheet: the account is asked before the invite is accepted, and has no book yet.
    h.asked[0]('returningNoBook');
    await flush();
    expect(run.result.current.view).toBe('noBook');
    // Reading the invite and tapping Join takes longer than the 10 seconds of the first question.
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS * 2);
    accountJoined.joined();
    expect(h.asked).toHaveLength(2);
    expect(h.syncNowCalls).toBe(2);
    expect(run.result.current.view).toBe('opening'); // never "No book here yet" while the new answer is out
    h.asked[1]('hasBook');
    await flush();
    // The sheet is closed and the book has not reached the phone: the wait, not "Start a book".
    expect(run.result.current.view).toBe('opening');
    expect(run.result.current.hasBook).toBe(true);
    // The joined book gets its own 10 seconds, counted from the join, not from the first question.
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS - 1000);
    expect(run.result.current.view).toBe('opening');
    await vi.advanceTimersByTimeAsync(1000 + 100);
    expect(run.result.current.view).toBe('slow');
    run.unmount();
  });

  it('[BL-2159] a join while the first question is still out: the stale "no book" answer is ignored', async () => {
    const run = renderHook(() => useNewPhone(base));
    accountJoined.joined();
    expect(h.asked).toHaveLength(2);
    h.asked[0]('returningNoBook'); // asked before the join
    await flush();
    expect(run.result.current.view).toBe('opening');
    h.asked[1]('hasBook');
    await flush();
    expect(run.result.current.view).toBe('opening');
    run.unmount();
  });

  it('[BL-2159] J21g/J21h: once the joined book is here the route stands aside (no view), never "arrived" under the open join sheet', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    // Unmounted even when an expectation fails, so the join listener never reaches the next test.
    try {
      h.asked[0]('returningNoBook');
      await flush();
      accountJoined.joined();
      h.asked[1]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening'); // the book is not here yet: the wait, as BL-2159 has it
      syncEvent({ phase: 'syncing', lastSyncedAt: null });
      hasLocalBook = true;
      run.rerender();
      expect(run.result.current.view).toBeNull(); // the first page brought the book: the join sheet hands over, not this route
      syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
      expect(run.result.current.view).toBeNull(); // the cycle is done: still not "arrived" (that would leave for Tonight)
      await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS + 100);
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  it('[BL-2159] with no join the arrival is unchanged: the book lands, the cycle is done, "arrived"', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    h.asked[0]('hasBook');
    await flush();
    hasLocalBook = true;
    run.rerender();
    syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
    expect(run.result.current.view).toBe('arrived');
    run.unmount();
  });

  it('[S17 follow-up from #2195] an account that already has its own book joins during "Opening your book": its own book landing is "arrived" (AC-07, AC-08), and it waits for the book first', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('hasBook'); // Asha's own book is on its way
      await flush();
      accountJoined.joined(); // an invite link opened over the opening screen, and accepted
      expect(h.asked).toHaveLength(2); // the join still asks again (BL-2159)
      expect(run.result.current.view).toBe('opening');
      h.asked[1]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening'); // BL-2159's wait: nothing before a book is here
      syncEvent({ phase: 'syncing', lastSyncedAt: null });
      hasLocalBook = true;
      run.rerender();
      expect(run.result.current.view).toBe('opening'); // the latch: the first cycle is not done yet
      syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
      expect(run.result.current.view).toBe('arrived'); // the arrival line and Tonight, not the joiner's hand-over
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195] the join note does not outlive the asking: join, sign-out, a sign-in with no join, the account has a book, it lands: "arrived"', async () => {
    let hasLocalBook = false;
    let enabled = true;
    const run = renderHook(() => useNewPhone({ ...base, enabled, hasLocalBook }));
    try {
      h.asked[0]('returningNoBook');
      await flush();
      accountJoined.joined(); // a joiner, marked to stand aside once the joined book is here
      h.asked[1]('hasBook');
      await flush();
      enabled = false; // signed out before the book came
      run.rerender();
      expect(run.result.current.view).toBeNull();
      enabled = true; // signed in again; no invite this time
      run.rerender();
      expect(h.asked).toHaveLength(3);
      h.asked[2]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      hasLocalBook = true;
      run.rerender();
      syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
      expect(run.result.current.view).toBe('arrived');
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195] the own-book note does not outlive the asking either: has a book, sign-out, a sign-in with no book that joins: the route stands aside (J21g, J21h)', async () => {
    let hasLocalBook = false;
    let enabled = true;
    const run = renderHook(() => useNewPhone({ ...base, enabled, hasLocalBook }));
    try {
      h.asked[0]('hasBook');
      await flush();
      enabled = false;
      run.rerender();
      enabled = true;
      run.rerender();
      h.asked[1]('returningNoBook');
      await flush();
      expect(run.result.current.view).toBe('noBook');
      accountJoined.joined();
      h.asked[2]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      hasLocalBook = true;
      run.rerender();
      syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  // Round 2 (Reviews A and B on #2234). `join()` is the sheet's order for an accept that goes through: joining, the accept,
  // joined, then settled in its finally.
  const join = () => {
    accountJoined.joining();
    accountJoined.joined();
    accountJoined.settled();
  };
  /** The book lands and the first cycle is done. */
  const lands = (run: { rerender: () => void }, setBook: () => void) => {
    syncEvent({ phase: 'syncing', lastSyncedAt: null });
    setBook();
    run.rerender();
    syncEvent({ phase: 'idle', lastSyncedAt: '2026-11-10T09:00:03.000Z' });
  };

  it('[S17 follow-up from #2195, round 2] a joiner whose first answer was "new" (a new account signed in from the sheet): the route stands aside once the joined book is here', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('new');
      await flush();
      expect(run.result.current.view).toBe('new');
      join();
      h.asked[1]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] a joiner whose answers were "unknown" (lost, and lost again on the one re-ask): the route stands aside once the joined book is here', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('unknown');
      await flush();
      expect(h.asked).toHaveLength(2); // R11's one re-ask
      h.asked[1]('unknown');
      await flush();
      join();
      h.asked[2]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] own book, then Try again loses the answer ("unknown" twice), then a join: the own book is still "arrived" (Review A M3)', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('hasBook'); // Asha's own book
      await flush();
      run.result.current.retry();
      h.asked[1]('unknown');
      await flush();
      expect(h.asked).toHaveLength(3); // R11's one re-ask
      h.asked[2]('unknown');
      await flush();
      join();
      h.asked[3]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBe('arrived');
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] a joiner who joins a second time still stands aside (Review A M4, Review B M3)', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('returningNoBook');
      await flush();
      join();
      h.asked[1]('hasBook'); // the first joined book, not on the phone yet
      await flush();
      join(); // a second invite, accepted before the first book lands
      h.asked[2]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] a join while the first question is still out, end state: the stale answer is dropped and the person counts as a joiner, "no book" or own book alike (the stated edge)', async () => {
    for (const stale of ['returningNoBook', 'hasBook'] as const) {
      h.asked.length = 0;
      h.status = { phase: 'idle', lastSyncedAt: null };
      let hasLocalBook = false;
      const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
      try {
        join();
        expect(h.asked).toHaveLength(2);
        h.asked[0](stale); // asked before the join
        await flush();
        expect(run.result.current.view).toBe('opening');
        h.asked[1]('hasBook');
        await flush();
        expect(run.result.current.view).toBe('opening');
        lands(run, () => (hasLocalBook = true));
        expect(run.result.current.view).toBeNull();
      } finally {
        run.unmount();
      }
    }
  });

  it('[S17 follow-up from #2195, round 2] the race: a question out across the accept comes back "hasBook" (the joined book) before the join is told: the route still stands aside, never "arrived" under the join sheet', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('returningNoBook');
      await flush();
      run.result.current.retry(); // Try again: a question is out when Join is tapped
      expect(h.asked).toHaveLength(2);
      accountJoined.joining(); // the sheet sends the accept
      h.asked[1]('hasBook'); // the server read the books after the accept committed: this is the joined book
      await flush();
      accountJoined.joined(); // the accept returned and the pending invite is cleared
      accountJoined.settled();
      expect(h.asked).toHaveLength(3);
      h.asked[2]('hasBook');
      await flush();
      expect(run.result.current.view).toBe('opening');
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] a failed accept leaves nothing behind: an own-book answer that came during it still counts, and a later join is "arrived"', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      accountJoined.joining(); // Join tapped while the first question is out
      h.asked[0]('hasBook'); // held: it might have been the joined book
      await flush();
      accountJoined.settled(); // the accept failed (the sheet's catch, then finally): no join
      expect(accountJoined.inProgress()).toBe(false);
      expect(h.asked).toHaveLength(1); // a failed accept asks nothing
      join(); // Try again on the sheet, and this time it goes through
      h.asked[1]('hasBook');
      await flush();
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBe('arrived'); // the held answer was Asha's own book
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] a failed accept with nothing held leaves no mark either: the answer after it counts as the account\'s own', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      accountJoined.joining();
      accountJoined.settled(); // failed, before any answer
      h.asked[0]('hasBook'); // after the failed accept: the account's own book
      await flush();
      join();
      h.asked[1]('hasBook');
      await flush();
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBe('arrived');
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] an own-book account that joins twice before the re-ask answers is still "arrived" (Review A M6)', async () => {
    let hasLocalBook = false;
    const run = renderHook(() => useNewPhone({ ...base, hasLocalBook }));
    try {
      h.asked[0]('hasBook'); // Asha's own book
      await flush();
      join();
      join(); // a second invite, before the first join's re-ask answers
      h.asked[2]('hasBook');
      await flush();
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBe('arrived');
    } finally {
      run.unmount();
    }
  });

  it('[S17 follow-up from #2195, round 2] a held answer does not outlive the asking: held during an accept, sign-out, a sign-in with no book, the accept ends, a join: the route stands aside', async () => {
    let hasLocalBook = false;
    let enabled = true;
    const run = renderHook(() => useNewPhone({ ...base, enabled, hasLocalBook }));
    try {
      accountJoined.joining();
      h.asked[0]('hasBook'); // held
      await flush();
      enabled = false; // signed out while the accept was out
      run.rerender();
      enabled = true; // another account, with no book
      run.rerender();
      accountJoined.settled(); // the old accept ends with no join
      h.asked[1]('returningNoBook');
      await flush();
      expect(run.result.current.view).toBe('noBook');
      join();
      h.asked[2]('hasBook');
      await flush();
      lands(run, () => (hasLocalBook = true));
      expect(run.result.current.view).toBeNull();
    } finally {
      run.unmount();
    }
  });

  it('[BL-2159] with no invite nothing changes: a phone with no book still sees No book here yet, asked once', async () => {
    const run = renderHook(() => useNewPhone(base));
    h.asked[0]('returningNoBook');
    await flush();
    await vi.advanceTimersByTimeAsync(OPENING_WAIT_MS * 2);
    expect(run.result.current.view).toBe('noBook');
    expect(h.asked).toHaveLength(1);
    run.unmount();
  });

  it('[BL-2159] a join asks nothing where nothing is being asked: switch off, a phone that began with a book, or after the screen is gone', async () => {
    const off = renderHook(() => useNewPhone({ ...base, enabled: false }));
    const withBook = renderHook(() => useNewPhone({ ...base, hasLocalBook: true }));
    accountJoined.joined();
    expect(h.asked).toHaveLength(0);
    expect(off.result.current.view).toBeNull();
    expect(withBook.result.current.view).toBeNull();
    off.unmount();
    withBook.unmount();
    const gone = renderHook(() => useNewPhone(base));
    gone.unmount();
    accountJoined.joined();
    expect(h.asked).toHaveLength(1); // the one question of the mount, none after it
  });
});

describe('[NX-36-S17] the store erase (eraseEverythingLocal) clears newPhone.arrival with every other setting', () => {
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
