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
 *                          account_mismatch), pending ops, unseen refused ops
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
import { localSqlDb, notifyStoreChanged, uuidv7 } from '../store';
import { getSupabaseOrNull } from '../supabase/client';
import { createSyncEngine, type SyncEngine } from './engine';
import { SYNC_SETTING, pendingCount, readSetting, rejectedUnseenCount } from './outbox';
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

function idleStatus(): SyncStatus {
  const db = localSqlDb();
  return {
    phase: mismatchUser ? 'account_mismatch' : 'idle',
    pending: pendingCount(db),
    rejected: rejectedUnseenCount(db),
    lastSyncedAt: readSetting(db, SYNC_SETTING.lastSyncedAt),
    consent: readSetting(db, SYNC_SETTING.pausedFor),
  };
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
  });
  engine = e;
  engineUnsubs.push(e.subscribe((s) => statusListeners.forEach((l) => l(s))));
  engineUnsubs.push(e.onDrained(() => drainedListeners.forEach((l) => l())));
  if (!e.start()) mismatchUser = userId;
}

/**
 * Boot wiring, once, after the first frame (coordinator: call from the root
 * layout next to runLaunchSweep, or from the session provider's mount).
 * Returns a stop function (tests, hot reload).
 */
export function startSync(): () => void {
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
