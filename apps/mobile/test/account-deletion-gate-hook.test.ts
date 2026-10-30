/// <reference types="node" />
/**
 * useFirstRunGate itself, run in Node (lens A and lens B of the third review of PR #393). The pure decisions are in
 * account-deletion-gate.test.ts (decideGate, chooseScreen); this file is the thin layer around them that the source
 * pins could not see: the effects, the timers, the order of things and the account a read is asked as. The hook runs
 * on a small stand-in for React's hooks (test/helpers/mini-react.ts) with the store, the router, the session and the
 * server replaced by a few lines each; the note-store is the real one over a fake settings table.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  books: [] as unknown[],
  closedBook: false,
  listeners: new Set<() => void>(),
  pathname: '/onboarding',
  replace: vi.fn(),
  /** What useAuth() returns now. */
  auth: { state: { status: 'signedOut' }, signedIn: false, client: null } as Record<string, unknown>,
  /** The auth store's snapshot, which the provider publishes from an effect after this screen's. */
  snapshot: { status: 'signedOut' } as Record<string, unknown>,
  loadStatus: vi.fn(),
  recordStatusCalls: [] as unknown[][],
  recordStatusThrows: false,
  bookBackCalls: 0,
  clearCalls: [] as Array<string | null>,
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('expo-router', () => ({ router: { replace: (...a: unknown[]) => h.replace(...a) }, usePathname: () => h.pathname }));
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/auth/auth-store', () => ({ getAuthSnapshot: () => h.snapshot, currentAuthUserId: () => null }));
vi.mock('@/lib/sync', () => ({ syncNow: () => Promise.resolve(null) }));
vi.mock('@/lib/store', () => {
  const notify = () => h.listeners.forEach((l) => l());
  return {
    getSetting: (k: string) => h.settings.get(k) ?? null,
    setSetting: (k: string, v: string) => {
      h.settings.set(k, v);
      notify();
    },
    deleteSetting: (k: string) => {
      h.settings.delete(k);
      notify();
    },
    listChildren: () => h.books,
    localSqlDb: () => ({ get: () => (h.closedBook ? { x: 1 } : null) }),
    subscribeTo: (_tables: unknown, listener: () => void) => {
      h.listeners.add(listener);
      return () => void h.listeners.delete(listener);
    },
  };
});
vi.mock('../src/lib/account-deletion/api', () => ({ loadStatus: (...a: unknown[]) => h.loadStatus(...a) }));
vi.mock('../src/lib/account-deletion/note-store', async (orig) => {
  const real = await orig<typeof import('../src/lib/account-deletion/note-store')>();
  return {
    ...real,
    recordStatus: (...a: Parameters<typeof real.recordStatus>) => {
      h.recordStatusCalls.push(a);
      if (h.recordStatusThrows) throw new Error('database is locked');
      return real.recordStatus(...a);
    },
    recordBookBack: () => {
      h.bookBackCalls += 1;
      return real.recordBookBack();
    },
    clearDeadNote: (judged: string | null) => {
      h.clearCalls.push(judged);
      return real.clearDeadNote(judged);
    },
  };
});

import { CHECK_CAP_MS, useFirstRunGate } from '../src/lib/account-deletion/use-first-run-gate';
import { CANCELLED_WAIT_MS, NOTE_GRACE_MS, OPEN_REQUEST_KEY, parseOpenRequest, type OpenRequest } from '../src/lib/account-deletion/open-request';
import { renderHook } from './helpers/mini-react';

const NOW = '2026-10-30T09:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const DAY = 86_400_000;
const WHEN = new Date(NOW_MS + 29 * DAY).toISOString();
const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const ASHA = { id: 'asha' };
const CLIENT = { rpc: () => undefined };

const mine = (userId: string, over: Partial<{ state: 'scheduled' | 'held'; scheduledFor: string }> = {}): OpenRequest => ({
  state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId, ...over,
});
const put = (n: OpenRequest) => void h.settings.set(OPEN_REQUEST_KEY, JSON.stringify(n));
const note = (): OpenRequest | null => parseOpenRequest(h.settings.get(OPEN_REQUEST_KEY) ?? null);
const notify = () => h.listeners.forEach((l) => l());
const signIn = (userId: string | null, publish = true) => {
  const state = userId ? { status: 'ready', userId, sync: 'on' } : { status: 'signedOut' };
  h.auth = { state, signedIn: userId !== null, client: userId ? CLIENT : null };
  if (publish) h.snapshot = state;
};

/** loadStatus answers when the test says so, in the order the reads were made. */
let reads: Array<(r: unknown) => void> = [];
const answer = async (i: number, value: unknown) => {
  reads[i]({ ok: true, value });
  await vi.advanceTimersByTimeAsync(0);
};
const open = { state: 'scheduled' as const, requestId: 'req-1', scheduledFor: WHEN };
const none = { state: 'none' as const };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  h.settings.clear();
  h.books = [];
  h.closedBook = false;
  h.listeners.clear();
  h.pathname = '/onboarding';
  h.replace.mockClear();
  h.recordStatusCalls = [];
  h.recordStatusThrows = false;
  h.bookBackCalls = 0;
  h.clearCalls = [];
  reads = [];
  h.loadStatus.mockReset();
  h.loadStatus.mockImplementation(() => new Promise((res) => reads.push(res)));
  signIn(null);
});
afterEach(() => vi.useRealTimers());

describe('[A1] the book returns while the deletion screen is up and its first read has already answered', () => {
  it('asks the server again, as the with-book read, once; none clears the note (a plain sync after a cancel elsewhere)', async () => {
    signIn(MAMA);
    put(mine(MAMA));
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('deletion');
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    await answer(0, open);
    expect(note()).toMatchObject({ state: 'scheduled' });

    h.books = [ASHA]; // the book comes back by a plain sync
    notify();
    expect(h.loadStatus).toHaveBeenCalledTimes(2);
    expect(h.replace).toHaveBeenCalledWith('/book'); // it also leaves
    await answer(1, none);
    expect(note()).toBeNull(); // not "cancelled": nothing is on its way back

    notify();
    run.rerender();
    expect(h.loadStatus).toHaveBeenCalledTimes(2); // once per mount
    run.unmount();
  });

  it('a phone that never showed the deletion screen but lists a book with an open note asks once too, and a signed-out one asks nothing', async () => {
    signIn(MAMA);
    h.books = [ASHA];
    put(mine(MAMA));
    const run = renderHook(() => useFirstRunGate());
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    run.unmount();
    h.loadStatus.mockClear();
    signIn(null);
    renderHook(() => useFirstRunGate()).unmount();
    expect(h.loadStatus).not.toHaveBeenCalled();
  });
});

describe('[A1] the with-book read is once per account per mount', () => {
  it('a note that goes and comes back while a book is listed does not ask again; another account does', async () => {
    signIn(MAMA);
    h.books = [ASHA];
    put(mine(MAMA));
    const run = renderHook(() => useFirstRunGate());
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    await answer(0, open);
    h.settings.delete(OPEN_REQUEST_KEY);
    notify();
    put(mine(MAMA));
    notify();
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    signIn(PAPA);
    put(mine(PAPA));
    run.rerender();
    notify();
    expect(h.loadStatus).toHaveBeenCalledTimes(2);
    run.unmount();
  });
});

describe('[A2] the deletion screen is forgotten when the note ends, so a book the person makes is not followed to the Book', () => {
  it('the read says none, the welcome shows, "Begin the book" lists a book: no replace', async () => {
    signIn(MAMA);
    put(mine(MAMA));
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('deletion');
    await answer(0, none);
    expect(note()).toBeNull();
    expect(run.result.current.screen).toBe('welcome');

    h.books = [ASHA]; // addChild
    notify();
    expect(run.result.current.screen).toBe('app');
    expect(h.replace).not.toHaveBeenCalled();
    run.unmount();
  });

  it('a cancelled wait that ran out ends it too: a book that arrives at minute 16 is the welcome\'s to follow', async () => {
    put({ state: 'cancelled', at: NOW, userId: MAMA });
    signIn(null);
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('deletion');
    await vi.advanceTimersByTimeAsync(CANCELLED_WAIT_MS + 5);
    expect(run.result.current.screen).toBe('welcome');
    h.books = [ASHA];
    notify();
    expect(h.replace).not.toHaveBeenCalled();
    run.unmount();
  });

  it('another account signing in on a shared phone, who finds nothing open, is not followed either', async () => {
    signIn(MAMA);
    put(mine(MAMA));
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('deletion');
    signIn(PAPA);
    run.rerender();
    expect(run.result.current.screen).toBe('welcome'); // the note is Mama's
    h.books = [ASHA];
    notify();
    expect(h.replace).not.toHaveBeenCalled();
    run.unmount();
  });

  it('the real leave still happens: deletion screen, a cancel, the book arrives, one replace to the Book', async () => {
    signIn(MAMA);
    put({ state: 'cancelled', at: NOW, userId: MAMA });
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current).toMatchObject({ screen: 'deletion', request: { state: 'cancelled' } });
    h.books = [ASHA];
    notify();
    expect(h.replace).toHaveBeenCalledTimes(1);
    expect(h.replace).toHaveBeenCalledWith('/book');
    expect(run.result.current.screen).toBe('deletion'); // held until the route has gone
    run.unmount();
  });

  it('[S-C] with the invite or join sheet on top it waits, and goes when the sheet has closed onto the screen', async () => {
    signIn(MAMA);
    put({ state: 'cancelled', at: NOW, userId: MAMA });
    h.pathname = '/invite';
    const run = renderHook(() => useFirstRunGate());
    h.books = [ASHA];
    notify();
    expect(h.replace).not.toHaveBeenCalled();
    h.pathname = '/onboarding';
    run.rerender();
    expect(h.replace).toHaveBeenCalledTimes(1);
    run.unmount();
  });
});

describe('[A3] a read is asked as the account signed in at render time', () => {
  it('on the first read of a sign-in, when the auth snapshot has not been published yet', async () => {
    h.closedBook = true;
    signIn(PAPA, false); // useAuth() has the user; the provider\'s effect has not published it
    expect(h.snapshot).toEqual({ status: 'signedOut' });
    const run = renderHook(() => useFirstRunGate());
    h.snapshot = h.auth.state as Record<string, unknown>; // published before the answer comes
    await answer(0, none);
    expect(h.recordStatusCalls).toHaveLength(1);
    expect(h.recordStatusCalls[0][1]).toBe(PAPA);
    run.unmount();
  });
});

describe('[A4] what the server said belongs to the account that was asked', () => {
  it('a second account in the same mount is read for itself, and its answer is recorded as its own', async () => {
    h.closedBook = true;
    signIn(MAMA);
    const run = renderHook(() => useFirstRunGate());
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    await answer(0, none);
    signIn(PAPA);
    run.rerender();
    expect(h.loadStatus).toHaveBeenCalledTimes(2);
    await answer(1, none);
    expect(h.recordStatusCalls.map((c) => c[1])).toEqual([MAMA, PAPA]);
    run.unmount();
  });

  it('the account that signs in next waits on paper for its own answer, not on the last account\'s', async () => {
    h.closedBook = true;
    signIn(MAMA);
    const run = renderHook(() => useFirstRunGate());
    await answer(0, none);
    expect(run.result.current.screen).toBe('welcome');
    signIn(PAPA);
    put(mine(PAPA, { scheduledFor: new Date(NOW_MS - NOTE_GRACE_MS - 1000).toISOString() }));
    run.rerender();
    expect(run.result.current.screen).toBe('checking'); // Mama having been answered says nothing about Papa
    await answer(1, none);
    expect(run.result.current.screen).toBe('welcome');
    run.unmount();
  });

  it('a late sign-out does not leave "the server said it is open" standing: a held request past its date, confirmed, then signed out, is the welcome', async () => {
    h.closedBook = true;
    signIn(MAMA);
    const longAgo = new Date(NOW_MS - 3 * DAY).toISOString();
    put(mine(MAMA, { state: 'held', scheduledFor: longAgo }));
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('checking');
    await answer(0, { state: 'held', requestId: 'req-1', scheduledFor: longAgo });
    expect(run.result.current.screen).toBe('deletion'); // confirmed by the server
    signIn(null);
    run.rerender();
    expect(run.result.current.screen).toBe('welcome');
    expect(h.clearCalls.length).toBeGreaterThan(0);
    run.unmount();
  });

  it('a stale note is dead once the server has been asked and did not confirm (signed in, the answer is none)', async () => {
    h.closedBook = true;
    signIn(MAMA);
    put(mine(MAMA, { scheduledFor: new Date(NOW_MS - NOTE_GRACE_MS - 1000).toISOString() }));
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('checking');
    await answer(0, none);
    expect(run.result.current.screen).toBe('welcome');
    expect(note()).toBeNull();
    run.unmount();
  });

  it('with no book, a read is made when the book is lost while the screen is up, not before', async () => {
    signIn(MAMA);
    h.books = [ASHA];
    const run = renderHook(() => useFirstRunGate());
    expect(h.loadStatus).not.toHaveBeenCalled();
    h.books = [];
    notify();
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    run.unmount();
  });
});

describe('[A5] the paper never stays up', () => {
  it('a local write that throws still ends the wait', async () => {
    h.closedBook = true;
    h.recordStatusThrows = true;
    signIn(MAMA);
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('checking');
    await answer(0, none);
    expect(run.result.current.screen).toBe('welcome');
    run.unmount();
  });

  it('a read that never answers is given up on after CHECK_CAP_MS, not before', async () => {
    h.closedBook = true;
    signIn(MAMA);
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('checking');
    await vi.advanceTimersByTimeAsync(CHECK_CAP_MS - 1);
    expect(run.result.current.screen).toBe('checking');
    await vi.advanceTimersByTimeAsync(1);
    expect(run.result.current.screen).toBe('welcome');
    run.unmount();
  });
});

describe('the note ends by itself when its time is up', () => {
  it('a cancelled wait stops holding the welcome back at 15 minutes, with no other change to wake the screen', async () => {
    signIn(MAMA);
    put({ state: 'cancelled', at: new Date(NOW_MS - CANCELLED_WAIT_MS + 60_000).toISOString(), userId: MAMA });
    h.books = [];
    const run = renderHook(() => useFirstRunGate());
    const rendersBefore = run.renders;
    expect(run.result.current.screen).toBe('deletion');
    await vi.advanceTimersByTimeAsync(59_000);
    expect(run.result.current.screen).toBe('deletion');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run.renders).toBeGreaterThan(rendersBefore);
    expect(run.result.current.screen).toBe('welcome');
    expect(note()).toBeNull(); // and the dead note is removed
    run.unmount();
  });

  it('a dated note signed out ends when the grace after its date runs out', async () => {
    signIn(null);
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: new Date(NOW_MS - NOTE_GRACE_MS + 3_600_000).toISOString(), userId: MAMA });
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('deletion');
    await vi.advanceTimersByTimeAsync(3_600_000 - 1000);
    expect(run.result.current.screen).toBe('deletion');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run.result.current.screen).toBe('welcome');
    run.unmount();
  });
});

describe('the answer of the server is taken as it is', () => {
  it('an open request found with no note makes the note and the deletion screen; the read is the gate\'s own, quiet at launch', async () => {
    h.closedBook = true;
    signIn(MAMA);
    const run = renderHook(() => useFirstRunGate());
    expect(run.result.current.screen).toBe('checking');
    await answer(0, open);
    expect(note()).toMatchObject({ state: 'scheduled', userId: MAMA });
    expect(run.result.current.screen).toBe('deletion');
    run.unmount();
  });

  it('a book arriving ends a cancelled wait through recordBookBack, and only then', async () => {
    signIn(MAMA);
    put({ state: 'cancelled', at: NOW, userId: MAMA });
    const run = renderHook(() => useFirstRunGate());
    expect(h.bookBackCalls).toBe(0); // no book yet
    h.books = [ASHA];
    notify();
    expect(h.bookBackCalls).toBeGreaterThan(0);
    expect(note()).toBeNull();
    run.unmount();

    h.bookBackCalls = 0;
    put(mine(MAMA)); // an open request with a book listed is not a wait
    const again = renderHook(() => useFirstRunGate());
    expect(h.bookBackCalls).toBe(0);
    again.unmount();
  });
});
