/**
 * Sync for the app (D-023): one call at boot, `startSync()`, wires the engine
 * to the session (lib/auth/auth-store.ts contract), the foreground, saves and
 * accepted invites. Nothing runs in the background, and nothing touches the
 * network before the first frame: the engine starts only when a session with
 * finished consent exists (`syncAllowed()`).
 *
 *   startSync()            boot, once (returns a stop function)
 *   syncNow()              pull to refresh (also checks the digest of every book)
 *   getSyncStatus(), subscribeSyncStatus(fn)
 *                          phase (idle, syncing, offline, paused_consent, auth,
 *                          account_mismatch, paused_server), pending ops, unseen
 *                          refused ops, letters with a word conflict
 *
 * The kill path (D-100): with EXPO_PUBLIC_SERVER_FEATURES off, startSync()
 * returns before wiring anything, so no listener, engine, client or request
 * exists, and the remote kill-switch source is never read
 * (test/sync-switch-off.test.ts). With it on, `killSwitches.sync` in the signed
 * remote config stops every push and pull within one cycle; the outbox keeps.
 *
 * The engine itself (engine.ts) is pure and tested in Node against PGlite.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import {
  currentAuthUserId,
  onInviteAccepted,
  onSignedIn,
  registerUploadQueue,
  subscribeAuth,
  syncAllowed,
} from '../auth/auth-store';
import { serverFeaturesEnabled } from '../capabilities';
import { localSqlDb, notifyStoreChanged, uuidv7 } from '../store';
import { getSupabaseOrNull } from '../supabase/client';
import { createSyncEngine, type SyncEngine } from './engine';
import { SYNC_SETTING, conflictCount, pendingCount, readSetting, rejectedUnseenCount } from './outbox';
import { AccountMismatchError, takeOwnership } from './ownership';
import { onOutboxChange } from './signal';
import type { RpcResult, SupabaseLike, SyncReport, SyncStatus } from './types';

export { createSyncEngine, type SyncEngine, type SyncEngineDeps } from './engine';
export { retryRefusedBook, AccountMismatchError } from './ownership';
export type { SupabaseLike, SyncReport, SyncStatus, SyncPhase, EntrySyncState } from './types';

/** The app's supabase-js client as the engine's SupabaseLike (requests carry the app's request id header). */
export function rpcOf(client: Pick<SupabaseClient, 'rpc'>): SupabaseLike {
  return {
    rpc: (fn, args) => client.rpc(fn, args) as unknown as PromiseLike<RpcResult>,
  };
}

let engine: SyncEngine | null = null;
let mismatchUser: string | null = null;
const statusListeners = new Set<(s: SyncStatus) => void>();
const drainedListeners = new Set<() => void>();
let engineUnsubs: (() => void)[] = [];

/** A status count that never throws (a store that cannot open reads as nothing waiting). */
function countOr0(read: () => number): number {
  try {
    return read();
  } catch {
    return 0;
  }
}

function idleStatus(): SyncStatus {
  const db = localSqlDb();
  return {
    phase: mismatchUser ? 'account_mismatch' : 'idle',
    pending: countOr0(() => pendingCount(db)),
    rejected: countOr0(() => rejectedUnseenCount(db)),
    conflicts: countOr0(() => conflictCount(db)),
    lastSyncedAt: readSetting(db, SYNC_SETTING.lastSyncedAt),
    consent: readSetting(db, SYNC_SETTING.pausedFor),
  };
}

/** `killSwitches.sync`: whether sync must stay paused, and a way to hear when the config changes. */
export interface SyncKillSource {
  killed(): boolean;
  /** Called whenever the signed remote config changes (so a lifted switch resumes sync at once). */
  subscribe(listener: () => void): () => void;
}
let killSource: SyncKillSource | null = null;

/**
 * `killSwitches.sync` from the signed remote config (ADR 0016; F16-REQ-018). Loaded
 * on first use, from inside a running engine only, so a build with the switch off
 * never touches the remote module for sync. Metro resolves the inline require when
 * it bundles the app.
 */
type RemoteModule = Pick<typeof import('../remote'), 'getRemoteConfig' | 'remoteConfigDoc'>;

/** Exported for the test of the real reader (the key it reads and the change wiring); `load` is the module. */
export function remoteKillSource(load: () => RemoteModule = () => require('../remote') as RemoteModule): SyncKillSource {
  const remote = load();
  return {
    killed: () => remote.getRemoteConfig().killSwitches.sync === true,
    subscribe: (listener) => remote.remoteConfigDoc.subscribe(() => listener()),
  };
}

function currentKillSource(): SyncKillSource {
  killSource ??= remoteKillSource();
  return killSource;
}

/**
 * Fails closed: if the switch cannot be read at all (the module did not load, or
 * the read threw), sync stays paused and the outbox keeps every op. A kill switch
 * that silently stops working is worse than a pause someone can see (phase
 * `paused_server`). A stale or unsigned config is not an error: lib/remote serves
 * its cached or bundled copy, so this never fires in a working build.
 */
function syncKilled(): boolean {
  try {
    return currentKillSource().killed();
  } catch {
    return true;
  }
}

/** Wakes the engine when the config changes and sync is no longer killed. Never throws. */
function onKillSwitchChange(listener: () => void): () => void {
  try {
    return currentKillSource().subscribe(() => {
      if (!syncKilled()) listener();
    });
  } catch {
    return () => {};
  }
}

/**
 * Tests only (vitest sets `VITEST`), like the capabilities test override: replace the
 * kill-switch reader, or pass null to go back to the remote config. Throws anywhere else.
 */
export function setSyncKillSourceForTests(source: SyncKillSource | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setSyncKillSourceForTests is for tests only');
  killSource = source;
}

export function getSyncStatus(): SyncStatus {
  return engine ? engine.status() : idleStatus();
}

export function subscribeSyncStatus(listener: (s: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Pull to refresh. Resolves null when sync is not running (local-only, signed out, or consent missing). */
export function syncNow(): Promise<SyncReport | null> {
  return engine ? engine.sync({ verify: true }) : Promise.resolve(null);
}

function stopEngine(): void {
  engine?.stop();
  engine = null;
  engineUnsubs.forEach((u) => u());
  engineUnsubs = [];
  const s = idleStatus();
  statusListeners.forEach((l) => l(s));
}

/** First sign-in: the phone's letters become this account's, in one local transaction (A-REQ-015). */
function claim(userId: string): void {
  try {
    takeOwnership(localSqlDb(), userId, { now: new Date().toISOString(), newId: () => uuidv7() });
    mismatchUser = null;
    notifyStoreChanged();
  } catch (e) {
    if (e instanceof AccountMismatchError) mismatchUser = userId;
    else throw e;
  }
}

function ensureEngine(): void {
  const userId = currentAuthUserId();
  const client = getSupabaseOrNull();
  if (!userId || !client || !syncAllowed() || mismatchUser === userId) {
    if (engine) stopEngine();
    return;
  }
  if (engine?.userId === userId) return;
  stopEngine();
  const e = createSyncEngine({
    db: localSqlDb(),
    supabase: rpcOf(client),
    userId,
    newId: () => uuidv7(),
    onChange: notifyStoreChanged,
    isActive: () => AppState.currentState === 'active',
    paused: syncKilled,
  });
  engine = e;
  engineUnsubs.push(e.subscribe((s) => statusListeners.forEach((l) => l(s))));
  engineUnsubs.push(e.onDrained(() => drainedListeners.forEach((l) => l())));
  engineUnsubs.push(onKillSwitchChange(() => e.requestSync('retry')));
  if (!e.start()) mismatchUser = userId;
}

/**
 * Boot wiring, once, after the first frame (coordinator: call from the root
 * layout next to runLaunchSweep, or from the session provider's mount).
 * Returns a stop function (tests, hot reload).
 */
export function startSync(): () => void {
  // v1.0 is on this phone only (lib/capabilities.ts): nothing to wire, no listener, no network.
  if (!serverFeaturesEnabled()) return () => {};
  const unsubs: (() => void)[] = [];
  unsubs.push(onSignedIn((userId) => {
    claim(userId);
    ensureEngine();
  }));
  unsubs.push(subscribeAuth(() => ensureEngine()));
  unsubs.push(onInviteAccepted(() => engine?.requestSync('invite')));
  unsubs.push(onOutboxChange(() => engine?.requestSync('save')));
  const app = AppState.addEventListener('change', (s) => {
    if (s === 'active') engine?.requestSync('foreground');
    else engine?.pauseTimers();
  });
  unsubs.push(() => app.remove());
  unsubs.push(registerUploadQueue({
    pendingCount: () => pendingCount(localSqlDb()),
    onDrained: (listener) => {
      drainedListeners.add(listener);
      return () => {
        drainedListeners.delete(listener);
      };
    },
  }));
  const user = currentAuthUserId();
  if (user) claim(user);
  ensureEngine();
  return () => {
    unsubs.forEach((u) => u());
    stopEngine();
  };
}
