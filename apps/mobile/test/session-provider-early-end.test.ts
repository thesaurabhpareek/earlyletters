/// <reference types="node" />
/**
 * [BL-479][CPO-105] Point 1: the early-end line is held by the auth provider, not by the Account page. Run through the
 * real SessionProvider and the page's real hook (components/auth/use-early-end-line.ts), both on the hook stand-in
 * (test/helpers/mini-react.ts). Real: the state machine, the auth store, the sync probe startSync() registers and the
 * outbox over node:sqlite. Stubbed, as in session-provider-apple-revocation-wait.test.ts: natives, the network, the
 * Apple credential read and the consent gate read (each a promise this file settles by hand). The pure steps
 * (nextEndedEarly, heldEndedEarly) are test/account-view.test.ts.
 *
 * The three things the ruling asks for:
 *  1. the person leaves Account during the wait, the wait ends early, and the line shows on the next visit;
 *  2. the line goes at the next sign-in;
 *  3. it is announced once, when it first shows on an open Account page, and not on a later visit.
 *
 * Mutants this file was written to catch, each made and shown to fail (PR body):
 *  M1 session-provider.tsx: the flag never moves (`setEndedEarly((held) => held)`), as when it was the page's own;
 *  M2 account-view.logic.ts heldEndedEarly: a shown flag is kept (`shown: step.shown || held.shown`), so sign-in keeps it;
 *  M3 use-early-end-line.ts: the count found on arrival is not taken as said (`useRef(0)`), so a later visit announces;
 *  M4 use-early-end-line.ts: the effect speaks on any run (`if (held.said === saidAtVisit.current) return;` removed).
 * Fictional family "Asha" only. No entry text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authCopy } from '@scribe/content';
import type { SqlDb } from '../src/lib/db/sql';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import type { SyncGate } from '../src/lib/auth/machine.logic';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';

const ASHA = '0192f0aa-0000-7000-8000-0000000000a1';
const NOW = '2026-11-27T09:00:00.000Z';
const LINE = authCopy.account.signOutEarly;
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;

const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const DECLINED: SyncGate = { ...FULL, sensitiveData: false, contentAllowed: false };

const h = vi.hoisted(() => ({
  /** Every my_sync_gate read the provider has started, in order; the test answers them. */
  gateReads: [] as Array<{ ok: (v: unknown) => void; fail: (e: unknown) => void }>,
  /** Supabase's auth listener, so a test can sign the person in again. */
  onAuth: null as null | ((event: string, session: unknown) => void),
  /** What the page said to VoiceOver. */
  spoken: [] as string[],
  signOut: vi.fn(async () => ({ error: null })),
  rpc: vi.fn(),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
}));

vi.mock('react', async () => {
  const { reactStandIn } = await import('./helpers/mini-react');
  return { ...reactStandIn, createContext: () => ({ Provider: 'AuthContext.Provider' }), useContext: () => null };
});
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: h.addEventListener }, Platform: { OS: 'ios' } }));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('expo-crypto', async () => {
  const { randomBytes } = await import('node:crypto');
  return { getRandomBytes: (k: number) => new Uint8Array(randomBytes(k)) };
});
vi.mock('@/lib/a11y', () => ({ announce: (m: string) => void h.spoken.push(m) }));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/supabase/client', () => ({
  SESSION_STORAGE_KEY: 'session',
  startAutoRefreshWhileActive: () => () => {},
  getSupabaseOrNull: () => ({
    rpc: (...a: unknown[]) => h.rpc(...a),
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        h.onAuth = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: { user: { id: '0192f0aa-0000-7000-8000-0000000000a1', app_metadata: { provider: 'email' } } } } }),
      signOut: h.signOut,
      startAutoRefresh: () => {},
      stopAutoRefresh: () => {},
    },
  }),
}));
vi.mock('../src/lib/auth/stored-session.logic', async (orig) => ({
  ...(await orig<object>()),
  readStoredSession: async () => ({ kind: 'found', userId: '0192f0aa-0000-7000-8000-0000000000a1' }),
}));
vi.mock('../src/lib/auth/consent', () => ({
  loadSyncGate: () => new Promise((ok, fail) => h.gateReads.push({ ok, fail })),
  recordConsent: vi.fn(),
}));
vi.mock('../src/lib/auth/apple', () => ({
  appleCredentialRevoked: () => new Promise<boolean>(() => {}),
  watchAppleRevocation: () => () => {},
  forgetAppleUser: async () => {},
  clearPendingAppleName: () => {},
  signInWithApple: vi.fn(),
}));
vi.mock('../src/lib/auth/pending', () => ({
  clearPendingEmailRequest: async () => {},
  clearWrongCodes: () => {},
  notePendingEmailRequest: async () => {},
  noteWrongCode: () => {},
  readPendingEmailRequest: async () => null,
  sessionSavedOnPhone: async () => false,
  wrongCodeTimes: () => [],
}));
vi.mock('../src/lib/auth/email', () => ({ RESEND_WAIT_MS: 60_000, sendEmailLink: vi.fn(), verifyEmailCode: vi.fn(), verifyEmailLinkPkce: vi.fn() }));
vi.mock('../src/lib/auth/google', () => ({ signInWithGoogle: vi.fn() }));
vi.mock('../src/lib/auth/passkey', () => ({ signInWithPasskey: vi.fn() }));
vi.mock('../src/lib/auth/sensitive-row-hook', () => ({ useRegisterSensitiveDataRow: () => {} }));
vi.mock('../src/lib/auth/new-device/report', () => ({ reportNewDeviceFor: async () => {} }));
vi.mock('../src/lib/remote', () => ({ useRemoteConfig: () => ({ forceReauthEpoch: 0 }) }));
vi.mock('../src/lib/reminders/session', () => ({ settleReminderSession: async () => {} }));
vi.mock('../src/lib/auth/local-claim', () => ({ bindDeviceOnlyOwners: () => () => {}, adoptDeviceOnlyLocal: async () => true }));
vi.mock('../src/lib/photos/leaving', () => ({ discardPendingPhotoOnLeaving: async () => {} }));
vi.mock('../src/lib/backup/files', () => ({ deleteBackupFilesExcept: () => {}, endBackupFileFor: () => {} }));
vi.mock('../src/lib/backup/launch-migrate', () => ({ settleBackupTokens: async () => {} }));
vi.mock('../src/lib/backup/token-vault', () => ({ removeBackupTokensFor: async () => {} }));

const store = await import('../src/lib/store');
const caps = await import('../src/lib/capabilities');
const auth = await import('../src/lib/auth/auth-store');
const sync = await import('../src/lib/sync');
const { SessionProvider } = await import('../src/lib/auth/session-provider');
type AuthApi = import('../src/lib/auth/session-provider').AuthApi;
const { useEarlyEndLine } = await import('../src/components/auth/use-early-end-line');
const { renderHook } = await import('./helpers/mini-react');
type HookRun<T> = import('./helpers/mini-react').HookRun<T>;
sync.setSyncKillSourceForTests({ killed: () => false, subscribe: () => () => {} });

let raw: SqlDb;
let closeDb: () => void = () => {};
let stopSync: () => void = () => {};
let unmount: () => void = () => {};
let providerRun: HookRun<{ props: { value: AuthApi } }> | null = null;

/** Let promises and zero-delay timers run, without moving the clock to the wait's 10 s poll. */
const flush = async () => {
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0);
};
/** What the provider publishes now (its rendered value, as useAuth() would return it). */
const api = (): AuthApi => providerRun!.result.current.props.value;

/** Settings > Account opening: the page's own hook, reading the provider's flag as account.tsx does. */
function openAccount(): HookRun<boolean> {
  return renderHook(() => useEarlyEndLine(api().endedEarly, LINE));
}

/** Launch signed in as Asha with sync on, two letters queued that the (silent) network never takes. */
async function launchSignedIn(): Promise<void> {
  writeSetting(raw, SYNC_SETTING.owner, ASHA);
  for (let i = 0; i < 2; i++) {
    raw.run("INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at) VALUES (?, 2, 'entry.erase', ?, '{}', ?)", id7(), id7(), NOW);
  }
  providerRun = renderHook(() => SessionProvider({ children: null }) as unknown as { props: { value: AuthApi } });
  unmount = providerRun.unmount;
  await flush();
  h.gateReads[0].ok({ gate: FULL, sensitiveDeclined: false });
  await flush();
  expect(api().state).toMatchObject({ status: 'ready', userId: ASHA, sync: 'on' });
  expect(api().endedEarly).toEqual({ shown: false, said: 0 });
}

/** "Sign out" with letters still queued: the wait. */
async function signOutAndWait(): Promise<void> {
  expect(await api().signOut()).toBe('waiting');
  await flush();
  expect(api().state).toMatchObject({ status: 'signingOut', reason: 'user', waitingForUploads: true });
}

/** The wait ends early: a gate read answers that sync is off, so the letters stay and the sign-out finishes. */
async function gateTurnsSyncOff(): Promise<void> {
  void api().refreshGate();
  await flush();
  h.gateReads.at(-1)!.ok({ gate: DECLINED, sensitiveDeclined: true });
  await flush();
  expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(api().state).toEqual({ status: 'signedOut' });
}

describe('[BL-479][CPO-105] the early-end line is held by the auth provider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    h.gateReads.length = 0;
    h.spoken.length = 0;
    h.onAuth = null;
    h.signOut.mockClear();
    h.rpc.mockReset();
    h.rpc.mockImplementation(() => new Promise(() => {})); // the sync network never answers
    auth.resetAuthStoreForTests();
    store.closeStore();
    const d = nodeDb();
    raw = d.db;
    closeDb = d.close;
    expect(store.openStore({ open: () => ({ db: d.db, close: () => {} }), now: () => NOW, newId: id7 }).ok).toBe(true);
    caps.setServerFeaturesForTests(true);
    auth.setClaimReaders({ owner: () => store.currentUserId(), hasLocalData: () => phoneHoldsAnyRow(store.localSqlDb()) });
    stopSync = sync.startSync();
  });
  afterEach(() => {
    unmount();
    unmount = () => {};
    providerRun = null;
    stopSync();
    auth.resetAuthStoreForTests();
    caps.setServerFeaturesForTests(null);
    store.closeStore();
    closeDb();
    vi.useRealTimers();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('Account left during the wait, the wait ends early: the line shows on the next visit, and is not announced then', async () => {
    await launchSignedIn();
    const first = openAccount();
    await signOutAndWait();
    first.rerender();
    expect(first.result.current).toBe(false); // waiting: no line yet
    first.unmount(); // the person leaves Account while the letters wait

    await gateTurnsSyncOff();
    expect(api().endedEarly).toEqual({ shown: true, said: 1 }); // held with Account closed

    const next = openAccount(); // the next visit
    expect(next.result.current).toBe(true);
    next.rerender();
    next.rerender();
    expect(h.spoken).toEqual([]); // read in page order, never announced on a visit
    next.unmount();
  });

  it('the line goes at the next sign-in', async () => {
    await launchSignedIn();
    await signOutAndWait();
    await gateTurnsSyncOff();
    expect(api().endedEarly.shown).toBe(true);

    h.onAuth!('SIGNED_IN', { user: { id: ASHA, email: null, app_metadata: { provider: 'email' } } });
    await flush();
    expect(api().state).toMatchObject({ status: 'checkingConsent', userId: ASHA });
    expect(api().endedEarly.shown).toBe(false);
    const visit = openAccount();
    expect(visit.result.current).toBe(false);
    expect(h.spoken).toEqual([]);
    visit.unmount();
  });

  it('Account open as the wait ends early: announced once there, and a later visit does not announce it again', async () => {
    await launchSignedIn();
    const page = openAccount();
    await signOutAndWait();
    page.rerender();
    await gateTurnsSyncOff();
    page.rerender(); // the page renders with the provider's new value, as a context change would
    expect(page.result.current).toBe(true);
    expect(h.spoken).toEqual([LINE]);
    page.rerender();
    expect(h.spoken).toEqual([LINE]); // once
    page.unmount();

    const later = openAccount();
    expect(later.result.current).toBe(true);
    expect(h.spoken).toEqual([LINE]); // not again
    later.unmount();
  });
});
