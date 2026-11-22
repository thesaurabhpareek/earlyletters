/// <reference types="node" />
/**
 * BL-1460: the Apple revocation wait at launch, proved through the real SessionProvider (A-REQ-033, P0).
 * PR #1332 (BL-450) fixed the reducer, and test/auth-machine.test.ts covers it. The three things the wait then depends
 * on live in session-provider.tsx and had no test of their own:
 *   1. the blind gate read: a wait that starts with the gate never read reads it (waitingBlind, checkGate);
 *   2. the 10 s poll: it re-reads the gate while that is unreadable and re-counts the queue;
 *   3. the recount: the first count is taken while no account is released (counts every row); the count after the wait
 *      is released is the signed-in account's own rows.
 * The provider runs on the hook stand-in (test/helpers/mini-react.ts: there is no React renderer here). Everything else
 * that decides the outcome is real: the auth store, the state machine, the sync probe registered by startSync() and the
 * outbox over node:sqlite. Stubbed: natives, the network, the Apple credential read and the consent gate read (each a
 * promise this file settles by hand).
 *
 * Mutants this file was written to catch, each made (M1 to M3 in session-provider.tsx) and shown to fail (PR body):
 *  M1 the waitingBlind effect removed (the gate is not read when the wait starts);
 *  M2 the 10 s setInterval removed (the poll);
 *  M3 the poll re-counts nothing and reuses the first count (the recount).
 *  M4 (in sync/index.ts, the probe the poll reads) counting every row instead of the signed-in account's.
 * Fictional family "Asha" only. No entry text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import type { SyncGate } from '../src/lib/auth/machine.logic';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';

const ASHA = '0192f0aa-0000-7000-8000-0000000000a1';
const OTHER = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-21T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;

const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const DECLINED: SyncGate = { ...FULL, sensitiveData: false, contentAllowed: false };

const h = vi.hoisted(() => ({
  /** Every my_sync_gate read the provider has started, in order; the test answers them. */
  gateReads: [] as Array<{ ok: (v: unknown) => void; fail: (e: unknown) => void }>,
  /** The one Apple credential read the revocation watch makes at start. */
  credentialReads: [] as Array<(revoked: boolean) => void>,
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
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: { user: { id: '0192f0aa-0000-7000-8000-0000000000a1', app_metadata: { provider: 'apple' } } } } }),
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
  appleCredentialRevoked: () => new Promise<boolean>((r) => h.credentialReads.push(r)),
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

/** Let promises and zero-delay timers run, without moving the clock past the poll. */
const flush = async () => {
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0);
};
const queued = () => raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n;

/** Letters waiting to go up for `owner` (the phone's owner is who the sync engine will upload for). */
function queueLetters(owner: string, count: number): void {
  writeSetting(raw, SYNC_SETTING.owner, owner);
  for (let i = 0; i < count; i++) {
    raw.run("INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at) VALUES (?, 2, 'entry.erase', ?, '{}', ?)", id7(), id7(), NOW);
  }
}

/** Launch with a stored Apple session, then Apple says the credential is revoked before the gate was ever read. */
async function launchAndRevoke(): Promise<void> {
  const run = renderHook(() => SessionProvider({ children: null }));
  unmount = run.unmount;
  await flush();
  expect(auth.getAuthSnapshot()).toMatchObject({ status: 'checkingConsent', userId: ASHA });
  expect(h.gateReads).toHaveLength(1); // the launch read, offline: it has not answered
  expect(h.credentialReads).toHaveLength(1);
  h.credentialReads[0](true);
  await flush();
}

describe('[A-REQ-033][BL-1460] the Apple revocation wait at launch, through the real provider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    h.gateReads.length = 0;
    h.credentialReads.length = 0;
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
    stopSync();
    auth.resetAuthStoreForTests();
    caps.setServerFeaturesForTests(null);
    store.closeStore();
    closeDb();
    vi.useRealTimers();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('the gate is read as soon as the wait starts, and the person stays signed in meanwhile', async () => {
    queueLetters(ASHA, 2);
    await launchAndRevoke();
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'signingOut', userId: ASHA, reason: 'apple_revoked', waitingForUploads: true, sync: 'unknown' });
    expect(h.gateReads).toHaveLength(2); // the wait's own read, on top of the launch read
    expect(h.signOut).not.toHaveBeenCalled();
    expect(queued()).toBe(2);
  });

  it('gate unreadable: still signed in, and the poll reads the gate and counts again at 10 s, not before', async () => {
    queueLetters(ASHA, 2);
    await launchAndRevoke();
    h.gateReads[1].fail(new Error('offline')); // the wait's read fails
    await flush();
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'signingOut', waitingForUploads: true, sync: 'unknown' });
    expect(h.gateReads).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(9_000);
    expect(h.gateReads).toHaveLength(2); // nothing before the poll is due
    await vi.advanceTimersByTimeAsync(1_000 + 1);
    expect(h.gateReads).toHaveLength(3); // the poll tried again
    h.gateReads[2].fail(new Error('offline'));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(h.gateReads).toHaveLength(4); // and keeps trying every 10 s
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'signingOut', userId: ASHA, waitingForUploads: true });
    expect(h.signOut).not.toHaveBeenCalled();
    expect(queued()).toBe(2);
  });

  it('gate answers on: the letters go up, and the sign-out follows only once the poll finds none left', async () => {
    queueLetters(ASHA, 2);
    await launchAndRevoke();
    h.gateReads[1].ok({ gate: FULL, sensitiveDeclined: false });
    await flush();
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'signingOut', waitingForUploads: true, sync: 'on' });
    expect(h.rpc).toHaveBeenCalled(); // the engine is released for Asha and goes to send
    expect(h.signOut).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10_000 + 1); // the poll counts: two still queued
    expect(h.signOut).not.toHaveBeenCalled();

    raw.run('DELETE FROM sync_outbox'); // the letters reached the server
    await vi.advanceTimersByTimeAsync(10_000 + 1);
    expect(h.signOut).toHaveBeenCalledTimes(1);
    expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(auth.getAuthSnapshot()).toEqual({ status: 'signedOut' });
  });

  it('gate answers off: the sign-out follows at once, nothing is sent, and the letters stay on the phone', async () => {
    queueLetters(ASHA, 2);
    await launchAndRevoke();
    h.gateReads[1].ok({ gate: DECLINED, sensitiveDeclined: true });
    await flush();
    expect(h.signOut).toHaveBeenCalledTimes(1);
    expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(auth.getAuthSnapshot()).toEqual({ status: 'signedOut' });
    expect(h.rpc).not.toHaveBeenCalled(); // sync never ran
    expect(queued()).toBe(2);
  });

  it("the recount after the wait counts only the signed-in account's rows: another account's queued letters do not hold the sign-out", async () => {
    queueLetters(OTHER, 2); // this phone's queue belongs to someone else
    await launchAndRevoke();
    // The first count was taken with no account released, so it counted every row: the wait started.
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'signingOut', waitingForUploads: true, sync: 'unknown' });
    h.gateReads[1].ok({ gate: FULL, sensitiveDeclined: false });
    await flush();
    expect(auth.getAuthSnapshot()).toMatchObject({ status: 'signingOut', sync: 'on' });
    await vi.advanceTimersByTimeAsync(10_000 + 1); // the poll counts for Asha: none
    expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(auth.getAuthSnapshot()).toEqual({ status: 'signedOut' });
    expect(queued()).toBe(2); // the other account's letters are still queued for it
  });
});
