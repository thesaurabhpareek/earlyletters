/// <reference types="node" />
/**
 * BL-727, IAM-R12 (docs/engineering/05-identity-and-access.md): Settings > "Sign out other devices" ends the other
 * sessions with `signOut({ scope: 'others' })` and leaves this phone signed in; and a session lost without asking
 * (revoked elsewhere, or a refresh the server rejected) keeps the upload queue intact (TDD 04 3.2.2, 3.2.3).
 * Through the real SessionProvider on the hook stand-in (test/helpers/mini-react.ts), with the real auth store, state
 * machine, sync engine (startSync) and outbox over node:sqlite, as in session-provider-apple-revocation-wait.test.ts.
 * A lost session reaches the provider as Supabase's SIGNED_OUT event (auth-js 2.117.2 `_removeSession` after a
 * rejected refresh); the reducer's SESSION_LOST action is the same end state, so both are driven here.
 * Stubbed: natives, the network (rpc never answers), the Apple credential read and the consent gate read.
 * Mutants run for the PR (each made, seen to fail, restored): scope 'global' and scope 'local' in signOutOtherDevices;
 * `DELETE FROM sync_outbox` added to the provider's SIGNED_OUT branch; the same added to forgetSignOutLeftovers; the
 * same added to the sync engine's auth subscription on signedOut (fails both lost-session tests).
 * Fictional family "Asha" only. No entry text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { authReducer, type SyncGate } from '../src/lib/auth/machine.logic';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';

type AuthListener = (event: string, session: unknown) => void;

const ASHA = '0192f0aa-0000-7000-8000-0000000000a1';
const NOW = '2026-11-21T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;

const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };

const h = vi.hoisted(() => ({
  gateReads: [] as Array<{ ok: (v: unknown) => void; fail: (e: unknown) => void }>,
  listeners: [] as Array<(event: string, session: unknown) => void>,
  signOut: vi.fn(async (_o?: unknown) => ({ error: null as unknown })),
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
      onAuthStateChange: (cb: AuthListener) => {
        h.listeners.push(cb);
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
  appleCredentialRevoked: async () => false,
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
vi.mock('../src/lib/auth/local-claim', () => ({ bindDeviceOnlyOwners: () => () => {}, adoptDeviceOnlyLocal: async () => true })); // the device-only files (days, moments) need the phone's file system: test/local-claim.test.ts
vi.mock('../src/lib/photos/leaving', () => ({ discardPendingPhotoOnLeaving: async () => {} }));
vi.mock('../src/lib/backup/files', () => ({ deleteBackupFilesExcept: () => {}, endBackupFileFor: () => {} }));
vi.mock('../src/lib/backup/launch-migrate', () => ({ settleBackupTokens: async () => {} }));
vi.mock('../src/lib/backup/token-vault', () => ({ removeBackupTokensFor: async () => {} }));

const store = await import('../src/lib/store');
const caps = await import('../src/lib/capabilities');
const auth = await import('../src/lib/auth/auth-store');
const sync = await import('../src/lib/sync');
const { SessionProvider } = await import('../src/lib/auth/session-provider');
const { renderHook } = await import('./helpers/mini-react');
sync.setSyncKillSourceForTests({ killed: () => false, subscribe: () => () => {} });

let raw: SqlDb;
let closeDb: () => void = () => {};
let stopSync: () => void = () => {};
let unmount: () => void = () => {};

const flush = async () => {
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0);
};
const queued = () => raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n;

function queueLetters(owner: string, count: number): void {
  writeSetting(raw, SYNC_SETTING.owner, owner);
  for (let i = 0; i < count; i++) {
    raw.run("INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at) VALUES (?, 2, 'entry.erase', ?, '{}', ?)", id7(), id7(), NOW);
  }
}

interface ProviderApi {
  signOutOtherDevices(): Promise<{ ok: boolean; error?: string }>;
}

/** Launch with Asha's stored session, the consent gate answers on: signed in and syncing. Returns the provider's api. */
async function launchSignedIn(): Promise<() => ProviderApi> {
  const run = renderHook(() => SessionProvider({ children: null }) as unknown as { props: { value: ProviderApi } });
  unmount = run.unmount;
  await flush();
  expect(h.gateReads).toHaveLength(1);
  h.gateReads[0].ok({ gate: FULL, sensitiveDeclined: false });
  await flush();
  expect(auth.getAuthSnapshot()).toMatchObject({ status: 'ready', userId: ASHA, sync: 'on' });
  return () => run.result.current.props.value;
}

describe('[IAM-R12][BL-727] sign out other devices, and a lost session keeps the upload queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    h.gateReads.length = 0;
    h.listeners.length = 0;
    h.signOut.mockReset();
    h.signOut.mockImplementation(async () => ({ error: null }));
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
    stopSync();
    auth.resetAuthStoreForTests();
    caps.setServerFeaturesForTests(null);
    store.closeStore();
    closeDb();
    vi.useRealTimers();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('[IAM-R12] "Sign out other devices" calls signOut with scope others, once, and this phone stays signed in', async () => {
    queueLetters(ASHA, 2);
    const api = await launchSignedIn();
    await expect(api().signOutOtherDevices()).resolves.toEqual({ ok: true });
    expect(h.signOut).toHaveBeenCalledTimes(1);
    expect(h.signOut).toHaveBeenCalledWith({ scope: 'others' });
    await flush();
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'ready', userId: ASHA });
    expect(queued()).toBe(2);
  });

  it('[IAM-R12] a refused "Sign out other devices" says so and still ends nothing on this phone', async () => {
    const api = await launchSignedIn();
    h.signOut.mockImplementation(async () => ({ error: { status: 500, message: 'boom' } }));
    await expect(api().signOutOtherDevices()).resolves.toEqual({ ok: false, error: 'sign_out_others_failed' });
    expect(h.signOut).toHaveBeenCalledWith({ scope: 'others' });
    await flush();
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'ready', userId: ASHA });
  });

  it('[IAM-R12] a session Supabase removed without asking (revoked or refresh rejected) signs out calmly with 2 letters still queued', async () => {
    queueLetters(ASHA, 2);
    await launchSignedIn();
    expect(h.listeners).toHaveLength(1);
    h.listeners[0]('SIGNED_OUT', null);
    await flush();
    await vi.advanceTimersByTimeAsync(30_000); // past every sign-out poll and sync retry
    expect(auth.getAuthSnapshot()).toEqual({ status: 'signedOut', error: 'session_expired' });
    expect(queued()).toBe(2);
  });

  it('[IAM-R12] SESSION_LOST with 2 letters queued: the state it gives, published to the store the sync engine reads, keeps all 2', async () => {
    queueLetters(ASHA, 2);
    const ready = { status: 'ready', userId: ASHA, sync: 'on' } as const;
    const lost = authReducer(ready, { type: 'SESSION_LOST' });
    expect(lost).toEqual({ status: 'signedOut', error: 'session_expired' });
    auth.publishAuth(ready);
    await flush();
    auth.publishAuth(lost);
    await flush();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(auth.getAuthSnapshot()).toEqual(lost);
    expect(queued()).toBe(2);
  });
});
