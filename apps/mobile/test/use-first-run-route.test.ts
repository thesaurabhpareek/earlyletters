/// <reference types="node" />
/**
 * useFirstRunRoute and useOnline themselves, run in Node (review of PR #724, lens A). The pure decisions are in
 * first-run-gate.test.ts and first-run-welcome.test.ts; this file is the thin layer around them that source patterns
 * could not see: the build switch, the connection source, the store subscription, the restore wait, the reconnect, Try
 * again and the one spoken line. The hooks run on the small stand-in for React's hooks (test/helpers/mini-react.ts) with
 * the session, the book list, expo-network and the announcer replaced by a few lines each. Fictional family "Asha" only.
 *
 * Mutations these tests were written to catch (each one failed a test here when it was made):
 *  M1 `serverFeatures` passed to the gate as `true`;       M4 the restore wait never expiring;
 *  M2 `useOnline` ignoring `enabled`;                      M5 `hasLocalBook` forced false;
 *  M3 `wasOnline` never updated;                           M6 `listChildren()` called with the switch off.
 */
import { authCopy } from '@scribe/content';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { state: { status: 'signedOut' }, configured: true } as { state: Record<string, unknown>; configured: boolean },
  books: [] as unknown[],
  listChildrenCalls: 0,
  storeListeners: new Set<() => void>(),
  net: { isConnected: true, isInternetReachable: true } as Record<string, unknown>,
  netCalls: 0,
  netThrows: false,
  /** When set, getNetworkStateAsync waits for this to be called before answering (an in-flight read). */
  netGate: null as null | { release: () => void },
  netListeners: new Set<(s: Record<string, unknown>) => void>(),
  spoken: [] as string[],
}));

vi.mock('react', async () => {
  const m = (await import('./helpers/mini-react')).reactStandIn;
  // A faithful useCallback: the same function while the dependencies hold.
  return { ...m, useCallback: <T,>(fn: T, deps: readonly unknown[]) => m.useMemo(() => fn, deps) };
});
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/a11y', () => ({ announce: (m: string) => void h.spoken.push(m) }));
vi.mock('@/lib/store', () => ({
  subscribe: (l: () => void) => {
    h.storeListeners.add(l);
    return () => void h.storeListeners.delete(l);
  },
  listChildren: () => {
    h.listChildrenCalls += 1;
    return h.books;
  },
}));
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => {
    h.netCalls += 1;
    const answer = { ...h.net }; // what the OS says when asked, even if the answer arrives late
    if (h.netGate) await new Promise<void>((r) => (h.netGate = { release: r }));
    if (h.netThrows) throw new Error('no state');
    return answer;
  },
  addNetworkStateListener: (l: (s: Record<string, unknown>) => void) => {
    h.netListeners.add(l);
    return { remove: () => void h.netListeners.delete(l) };
  },
}));

import { setServerFeaturesForTests } from '../src/lib/capabilities';
import { RESTORE_WAIT_MS } from '../src/lib/first-run/gate.logic';
import { useFirstRunRoute } from '../src/lib/first-run/use-first-run-route';
import { renderHook } from './helpers/mini-react';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const OFFLINE = { isConnected: false, isInternetReachable: false };
const ONLINE = { isConnected: true, isInternetReachable: true };
const networkEvent = (s: Record<string, unknown>) => {
  h.net = s;
  for (const l of [...h.netListeners]) l(s);
};
/** A fresh state object each time, as the session provider makes one for every failed attempt. */
const failed = (): { status: string; error: string } => ({ status: 'signedOut', error: 'network' });

beforeEach(() => {
  h.auth = { state: { status: 'signedOut' }, configured: true };
  h.books = [];
  h.listChildrenCalls = 0;
  h.net = { ...ONLINE };
  h.netCalls = 0;
  h.netThrows = false;
  h.netGate = null;
  h.spoken.length = 0;
  h.storeListeners.clear();
  h.netListeners.clear();
  setServerFeaturesForTests(true);
});
afterEach(() => {
  setServerFeaturesForTests(null);
  vi.useRealTimers();
});

describe('[NX-31-R17] servers off: the route is a no-op (route.logic.ts: the switch is read, the book list never)', () => {
  const states = [{ status: 'restoring' }, { status: 'signedOut' }, failed(), { status: 'ready', userId: 'u', sync: 'on' }];

  it('[NX-31-R17] the step is "unchanged" in every auth state, offline or not, configured or not [M1]', async () => {
    setServerFeaturesForTests(false);
    for (const configured of [true, false]) {
      for (const state of states) {
        h.auth = { state, configured };
        h.net = { ...OFFLINE };
        const run = renderHook(() => useFirstRunRoute());
        await flush();
        expect(run.result.current.step, `${String(state.status)} configured:${configured}`).toBe('unchanged');
        expect(run.result.current.localStartOffered).toBe(false);
        run.unmount();
      }
    }
  });

  it('[NX-31-R17] it never lists the books, never subscribes to the store, never reads or watches the network [M2, M6]', async () => {
    setServerFeaturesForTests(false);
    h.books = [{ id: 'asha' }];
    for (const state of states) {
      h.auth = { state, configured: true };
      const run = renderHook(() => useFirstRunRoute());
      await flush();
      run.result.current.tryAgain(); // even a stray tap reads nothing
      await flush();
      const rendered = run.renders;
      run.result.current.markPastWelcome(); // and the steps leaving their welcome step render nothing again
      expect(run.renders, `renders ${String(state.status)}`).toBe(rendered);
      expect(h.listChildrenCalls, `listChildren ${String(state.status)}`).toBe(0);
      expect(h.storeListeners.size, `store listeners ${String(state.status)}`).toBe(0);
      expect(h.netCalls, `network reads ${String(state.status)}`).toBe(0);
      expect(h.netListeners.size, `network listeners ${String(state.status)}`).toBe(0);
      run.unmount();
    }
  });

  it('[NX-31-R17] it starts no restore timer either, so nothing renders the route again 10 seconds later', () => {
    vi.useFakeTimers();
    setServerFeaturesForTests(false);
    h.auth = { state: { status: 'restoring' }, configured: true };
    const run = renderHook(() => useFirstRunRoute());
    expect(vi.getTimerCount()).toBe(0);
    run.unmount();
  });

  it('[NX-31-R17] servers on but no sign-in settings in the build: the same no-op', async () => {
    h.auth = { state: { status: 'signedOut' }, configured: false };
    h.books = [{ id: 'asha' }];
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.step).toBe('unchanged');
    expect(h.listChildrenCalls + h.storeListeners.size + h.netCalls + h.netListeners.size).toBe(0);
  });
});

describe('[NX-31-R17] servers on: where first run starts', () => {
  it('[NX-31-R17] a fresh install with no session and no book is the Welcome', async () => {
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current).toMatchObject({ step: 'signIn', screen: 'welcome', restoring: false, online: true });
    expect(h.listChildrenCalls).toBeGreaterThan(0);
    expect(h.storeListeners.size).toBe(1);
    expect(h.netListeners.size).toBe(1);
  });

  it('[NX-31-R22] a phone that holds a book is not the Welcome, whatever the session [M5]', async () => {
    h.books = [{ id: 'asha' }];
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.step).toBe('openTonight');
    expect(run.result.current.screen).toBe('steps');
  });

  it('[NX-31-R22] a book that arrives with sign-in (a store change) moves the route on [M5, M6]', async () => {
    h.auth = { state: { status: 'ready', userId: 'u1', sync: 'on' }, configured: true };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.step).toBe('childStep');
    h.books = [{ id: 'asha' }];
    for (const l of h.storeListeners) l();
    expect(run.result.current.step).toBe('openTonight');
  });

  it('[NX-31-R17] unmounting stops listening to the store and to the network', async () => {
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    run.unmount();
    expect(h.storeListeners.size).toBe(0);
    expect(h.netListeners.size).toBe(0);
  });

  it('[NX-31-R19] a network read that throws counts as online, so nobody is trapped on the outage screen', async () => {
    h.netThrows = true;
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current).toMatchObject({ step: 'signIn', online: true });
  });
});

describe('[NX-31-R18] the restore wait is bounded', () => {
  it('[NX-31-R17] blank for the wait, then the Welcome; a session that arrives late replaces it [M4]', () => {
    vi.useFakeTimers();
    h.auth = { state: { status: 'restoring' }, configured: true };
    const run = renderHook(() => useFirstRunRoute());
    expect(run.result.current).toMatchObject({ restoring: true, screen: 'blank' });
    vi.advanceTimersByTime(RESTORE_WAIT_MS - 1);
    expect(run.result.current.restoring).toBe(true);
    vi.advanceTimersByTime(1);
    expect(run.result.current).toMatchObject({ restoring: false, step: 'signIn', screen: 'welcome' });
    h.auth.state = { status: 'checkingConsent', userId: 'u1', method: null };
    run.rerender();
    expect(run.result.current).toMatchObject({ step: 'childStep', screen: 'steps' });
  });

  it('[NX-31-R19] offline at launch while the session is still being read: nothing yet, then the session (a returning person) is not told sign-in needs a connection', async () => {
    h.auth = { state: { status: 'restoring' }, configured: true };
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current).toMatchObject({ step: 'outage', outage: 'offline', restoring: true, screen: 'blank' });
    h.auth.state = { status: 'ready', userId: 'u1', sync: 'on' };
    run.rerender();
    expect(run.result.current).toMatchObject({ step: 'childStep', screen: 'steps' });
  });

  it('[NX-31-R17] a restore that finishes in time cancels the timer', () => {
    vi.useFakeTimers();
    h.auth = { state: { status: 'restoring' }, configured: true };
    const run = renderHook(() => useFirstRunRoute());
    h.auth.state = { status: 'signedOut' };
    run.rerender();
    expect(vi.getTimerCount()).toBe(0);
    expect(run.result.current.restoring).toBe(false);
  });
});

describe('[NX-31-R18] sign-in cannot be reached: Try again, the local start and a reconnect', () => {
  it('[NX-31-R18] a network failure is the outage screen with the local start offered', async () => {
    h.auth.state = failed();
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current).toMatchObject({ step: 'outage', outage: 'outage', screen: 'outage', localStartOffered: true });
  });

  it('[NX-31-R18] Try again on a service outage reads the connection once and returns to the Welcome; a NEW failure counts again', async () => {
    h.auth.state = failed();
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    const reads = h.netCalls;
    run.result.current.tryAgain();
    await flush();
    expect(h.netCalls).toBe(reads + 1);
    expect(run.result.current).toMatchObject({ step: 'signIn', screen: 'welcome' });
    h.auth.state = failed();
    run.rerender();
    expect(run.result.current.step).toBe('outage');
  });

  it('[NX-36-S3] "You are back online." is never said because the person tapped Try again on a service outage', async () => {
    h.auth.state = failed();
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    run.result.current.tryAgain();
    await flush();
    expect(run.result.current.step).toBe('signIn');
    expect(h.spoken).not.toContain(authCopy.outage.backOnline);
    expect(h.spoken).toEqual([]);
  });

  it('[NX-31-R19] offline at launch: the Welcome for a first frame, then the offline screen; the connection returning is the Welcome, said once [M3]', async () => {
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    expect(run.result.current.step).toBe('signIn');
    await flush();
    expect(run.result.current).toMatchObject({ step: 'outage', outage: 'offline', localStartOffered: true });
    expect(h.spoken).toEqual([]);
    networkEvent({ ...ONLINE });
    expect(run.result.current).toMatchObject({ step: 'signIn', screen: 'welcome' });
    expect(h.spoken).toEqual([authCopy.outage.backOnline]);
  });

  it('[NX-31-R19] a failed sign-in and no connection: the connection returning is the Welcome without a tap, said once [M3]', async () => {
    h.auth.state = failed();
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current).toMatchObject({ step: 'outage', outage: 'offline' });
    networkEvent({ ...ONLINE });
    expect(run.result.current.step).toBe('signIn');
    expect(h.spoken).toEqual([authCopy.outage.backOnline]);
  });

  it('[NX-31-R19] the connection dropping and returning twice is the Welcome twice, and "back" is said each time [M3]', async () => {
    h.auth.state = failed();
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.step).toBe('outage');
    networkEvent({ ...OFFLINE });
    networkEvent({ ...ONLINE });
    expect(run.result.current.step).toBe('signIn');
    h.auth.state = failed();
    run.rerender();
    expect(run.result.current.step).toBe('outage');
    networkEvent({ ...OFFLINE });
    networkEvent({ ...ONLINE });
    expect(run.result.current.step).toBe('signIn');
    expect(h.spoken).toEqual([authCopy.outage.backOnline, authCopy.outage.backOnline]);
  });

  it('[NX-36-S3] "back" is not said when the connection returns under someone who is not on the outage screen', async () => {
    h.auth.state = { status: 'ready', userId: 'u1', sync: 'on' };
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.step).toBe('childStep');
    networkEvent({ ...ONLINE });
    expect(run.result.current.step).toBe('childStep');
    expect(h.spoken).toEqual([]);
  });

  it('[NX-36-S3] Try again while still offline stays on the offline screen, says so once, and ignores a second tap while it reads', async () => {
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.outage).toBe('offline');
    const reads = h.netCalls;
    h.netGate = { release: () => undefined };
    run.result.current.tryAgain();
    run.result.current.tryAgain();
    expect(h.netCalls).toBe(reads + 1);
    h.netGate.release();
    await flush();
    expect(run.result.current).toMatchObject({ step: 'outage', outage: 'offline' });
    expect(h.spoken).toEqual([authCopy.offline.title]);
    // The read is over, so a later tap reads again.
    h.netGate = null;
    run.result.current.tryAgain();
    await flush();
    expect(h.netCalls).toBe(reads + 2);
  });

  it('[NX-36-S3] Try again when the phone is in fact back online is a real reconnect: the Welcome, said once', async () => {
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    h.net = { ...ONLINE }; // the OS has the connection back; its event has not reached the app yet
    run.result.current.tryAgain();
    await flush();
    expect(run.result.current).toMatchObject({ step: 'signIn', online: true });
    expect(h.spoken).toEqual([authCopy.outage.backOnline]);
  });

  it('[NX-31-R18] the local start, once chosen, stays through a later failure, an offline moment and a reconnect', async () => {
    h.auth.state = failed();
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    run.result.current.chooseLocalStart();
    expect(run.result.current).toMatchObject({ step: 'childStep', screen: 'steps', localStartChosen: true });
    networkEvent({ ...OFFLINE });
    expect(run.result.current.step).toBe('childStep');
    networkEvent({ ...ONLINE });
    expect(run.result.current.step).toBe('childStep');
    expect(h.spoken).toEqual([]);
  });

  it('[NX-31-R19] a late read does not overwrite a newer connection event', async () => {
    h.net = { ...OFFLINE };
    const run = renderHook(() => useFirstRunRoute());
    h.netGate = { release: () => undefined };
    h.net = { ...OFFLINE };
    run.result.current.tryAgain(); // a read of "offline" is now in flight
    networkEvent({ ...ONLINE }); // the OS says online while it is
    h.netGate.release();
    await flush();
    expect(run.result.current.online).toBe(true);
  });
});

describe('[NX-31-R17] a session lost during first run does not take the person back to the Welcome', () => {
  it('[NX-31-R17] past the welcome step the steps stay (the typed name and date are kept); on it, the Welcome is right', async () => {
    h.auth.state = { status: 'ready', userId: 'u1', sync: 'on' };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current).toMatchObject({ step: 'childStep', screen: 'steps' });

    // Still on the welcome step of the steps (nothing typed yet): a lost session is the Welcome.
    h.auth.state = { status: 'signedOut', error: 'session_expired' };
    run.rerender();
    expect(run.result.current).toMatchObject({ step: 'signIn', screen: 'welcome' });

    // The session comes back, the person moves past the welcome step, then the session is lost again.
    h.auth.state = { status: 'ready', userId: 'u1', sync: 'on' };
    run.rerender();
    run.result.current.markPastWelcome();
    for (const lost of [{ status: 'signedOut', error: 'session_expired' }, { status: 'signedOut' }, failed()]) {
      h.auth.state = lost;
      run.rerender();
      expect(run.result.current.screen, JSON.stringify(lost)).toBe('steps');
    }
    // Even offline.
    networkEvent({ ...OFFLINE });
    expect(run.result.current.screen).toBe('steps');
  });

  it('[NX-31-R17] the step the gate answers does not change; only the screen holds the place', async () => {
    h.auth.state = { status: 'ready', userId: 'u1', sync: 'on' };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    run.result.current.markPastWelcome();
    h.auth.state = { status: 'signedOut', error: 'session_expired' };
    run.rerender();
    expect(run.result.current).toMatchObject({ step: 'signIn', screen: 'steps' });
  });
});
