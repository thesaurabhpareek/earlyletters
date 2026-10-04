/**
 * The sync engine (DECISIONS D-023): outbox push, then cursor pull, behind one
 * small interface. Pure TypeScript: SQLite through SqlDb, the server through
 * SupabaseLike, time and timers injected, so the whole engine runs in Node
 * tests against PGlite (apps/mobile/test/sync-e2e.test.ts).
 *
 * Triggers (no background tasks): start, the app coming to the foreground,
 * after a save (debounced), pull to refresh (`sync({ verify: true })`), an
 * accepted invite, and a foreground-only retry timer for a queue that is
 * backing off. One cycle runs at a time; requests during a cycle merge into
 * one follow-up cycle.
 */
import type { SqlDb } from '../db/sql';
import { backoffMs, classifyCallError, type CallFailure } from './errors';
import {
  applyPullPage,
  applyPushResponse,
  buildPullRequest,
  dropStaleHeld,
  enterRestoreMode,
} from './merge';
import {
  SYNC_SETTING,
  backoff,
  headOp,
  markSent,
  pendingCount,
  readSetting,
  rejectOp,
  rejectedUnseenCount,
  takeBatch,
  writeSetting,
  type EnqueueContext,
} from './outbox';
import { AccountMismatchError, takeOwnership, type OwnershipResult } from './ownership';
import type { PullResponse, PushResponse, SupabaseLike, SyncPhase, SyncReason, SyncReport, SyncStatus } from './types';

export interface SyncEngineDeps {
  db: SqlDb;
  supabase: SupabaseLike;
  /** The signed-in account. */
  userId: string;
  /** UUIDv7 maker (op ids). */
  newId: () => string;
  now?: () => number;
  random?: () => number;
  /** Called after local data changed (the store re-renders its screens). */
  onChange?: () => void;
  /** Rows per pull page, all books together (server max 500). */
  pageSize?: number;
  /** Retry timers only run while this is true (app in the foreground). */
  isActive?: () => boolean;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  /** Delay between a save and its push, so a burst of edits goes in one batch. */
  saveDebounceMs?: number;
}

export interface SyncEngine {
  readonly userId: string;
  /** Claims this phone's local data for the account (first sign-in), then syncs. */
  start(): OwnershipResult | null;
  /** One cycle now (pull to refresh passes verify: true). Never throws. */
  sync(opts?: { verify?: boolean }): Promise<SyncReport>;
  /** Trigger from the app: debounced after a save, immediate otherwise. */
  requestSync(reason: SyncReason): void;
  status(): SyncStatus;
  subscribe(listener: (s: SyncStatus) => void): () => void;
  /** Ops still to reach the server (sign-out waits for 0, A-REQ-033). */
  pendingCount(): number;
  onDrained(listener: () => void): () => void;
  /** The app went to the background: cancel timers (nothing runs there). */
  pauseTimers(): void;
  stop(): void;
}

const VERIFY_EVERY_MS = 24 * 3600_000;
const FOREGROUND_MIN_GAP_MS = 5_000;
const MAX_PUSH_ROUNDS = 40;
const MAX_PULL_PAGES = 100;

const EMPTY: SyncReport = { pushed: 0, rejected: 0, pulled: 0, reset: false, phase: 'idle' };

export function createSyncEngine(deps: SyncEngineDeps): SyncEngine {
  const { db, supabase, userId } = deps;
  const now = deps.now ?? Date.now;
  const random = deps.random ?? Math.random;
  const pageSize = deps.pageSize ?? 200;
  const setTimer = deps.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const isActive = deps.isActive ?? (() => true);
  const iso = () => new Date(now()).toISOString();
  const ctx = (): EnqueueContext => ({ now: iso(), newId: deps.newId });
  const tx = <T>(fn: () => T): T => {
    let out!: T;
    db.transaction(() => {
      out = fn();
    });
    return out;
  };

  let stopped = false;
  let mismatch = false;
  let lastFailure: CallFailure | null = null;
  let running = false;
  let lastCycleEnd = 0;
  let retryTimer: unknown = null;
  let saveTimer: unknown = null;
  let chain: Promise<SyncReport> = Promise.resolve(EMPTY);
  let queued: { verify: boolean; promise: Promise<SyncReport> } | null = null;
  const listeners = new Set<(s: SyncStatus) => void>();
  const drained = new Set<() => void>();

  const phase = (): SyncPhase => {
    if (mismatch) return 'account_mismatch';
    if (running) return 'syncing';
    if (lastFailure === 'auth' || lastFailure === 'anonymous') return 'auth';
    if (lastFailure) return 'offline';
    if (readSetting(db, SYNC_SETTING.pausedFor) !== null) return 'paused_consent';
    return 'idle';
  };
  const status = (): SyncStatus => ({
    phase: phase(),
    pending: pendingCount(db),
    rejected: rejectedUnseenCount(db),
    lastSyncedAt: readSetting(db, SYNC_SETTING.lastSyncedAt),
    consent: readSetting(db, SYNC_SETTING.pausedFor),
  });
  const emit = () => {
    const s = status();
    listeners.forEach((l) => l(s));
  };
  const changed = () => deps.onChange?.();

  async function call<T>(fn: string, args: Record<string, unknown>): Promise<{ data: T } | { failure: CallFailure }> {
    try {
      const res = await supabase.rpc(fn, args);
      if (res.error || res.data === null || res.data === undefined) return { failure: classifyCallError(res.error, res.status) };
      return { data: res.data as T };
    } catch {
      return { failure: 'network' };
    }
  }

  /** Pushes until the queue is empty, blocked by backoff, or the server is unreachable. */
  async function pushAll(report: SyncReport): Promise<'ok' | 'stop'> {
    let onlyDeletes = false;
    let single = false;
    let contentAccepted = false;
    for (let round = 0; round < MAX_PUSH_ROUNDS; round++) {
      const batch = takeBatch(db, { now: iso(), onlyDeletes, maxOps: single ? 1 : 50 });
      if (batch.rows.length === 0) break;
      tx(() => markSent(db, batch.rows, iso()));
      const res = await call<PushResponse>('sync_push', { p_ops: batch.ops });
      if ('failure' in res) {
        if (res.failure === 'bad_request') {
          if (batch.rows.length > 1) {
            single = true; // find the op the server cannot read; only that one is rejected
            continue;
          }
          tx(() => rejectOp(db, batch.rows[0], '22023', iso()));
          report.rejected++;
          changed();
          continue;
        }
        lastFailure = res.failure;
        if (res.failure !== 'auth' && res.failure !== 'anonymous') {
          const head = batch.rows[0];
          tx(() => backoff(db, head, now(), backoffMs(head.attempts + 1, random)));
        }
        return 'stop';
      }
      lastFailure = null;
      const out = tx(() => applyPushResponse(db, batch.rows, res.data, ctx()));
      report.pushed += out.pushed;
      report.rejected += out.rejected;
      if (out.pushed + out.rejected > 0) changed();
      if (!onlyDeletes && !out.paused) contentAccepted = true;
      if (out.paused) {
        // SCCON: letters wait on the phone; deletions still go (LEGAL-REQ-009).
        tx(() => writeSetting(db, SYNC_SETTING.pausedFor, out.consent || 'consent'));
        onlyDeletes = true;
        continue;
      }
      if (out.stoppedAt) {
        const head = out.stoppedAt;
        tx(() => backoff(db, head, now(), backoffMs(head.attempts + 1, random)));
        lastFailure = 'server';
        return 'stop';
      }
    }
    // A pass that wrote content without SCCON (or an empty queue) ends a consent pause.
    if (!onlyDeletes && (contentAccepted || pendingCount(db) === 0)) {
      tx(() => writeSetting(db, SYNC_SETTING.pausedFor, null));
    }
    return 'ok';
  }

  async function pullAll(report: SyncReport, verify: boolean): Promise<void> {
    let resetDone = false;
    let idsRounds = 0;
    for (let page = 0; page < MAX_PULL_PAGES; page++) {
      const since = buildPullRequest(db, { verify });
      const res = await call<PullResponse>('sync_pull', { p_since: since, p_limit: pageSize });
      if ('failure' in res) {
        lastFailure = res.failure;
        return;
      }
      lastFailure = null;
      const data = res.data;
      if (data.reset) {
        if (resetDone) return;
        resetDone = true;
        report.reset = true;
        tx(() => enterRestoreMode(db, data, ctx()));
        changed();
        if ((await pushAll(report)) === 'stop') return;
        continue;
      }
      const out = tx(() => applyPullPage(db, data, iso()));
      report.pulled += out.pulled;
      if (out.pulled > 0 || (data.gone?.length ?? 0) > 0 || (data.books ?? []).some((b) => b.meta)) changed();
      if (data.more) continue;
      if (out.wantIds && idsRounds < 1) {
        idsRounds++;
        continue;
      }
      break;
    }
    const dropped = tx(() => dropStaleHeld(db, now()));
    if (dropped > 0) changed();
    tx(() => {
      writeSetting(db, SYNC_SETTING.lastSyncedAt, iso());
      if (verify) writeSetting(db, SYNC_SETTING.lastVerifyAt, iso());
    });
  }

  async function cycle(verifyAsked: boolean): Promise<SyncReport> {
    if (stopped || mismatch) return { ...EMPTY, phase: phase() };
    running = true;
    emit();
    const report: SyncReport = { ...EMPTY };
    try {
      const lastVerify = readSetting(db, SYNC_SETTING.lastVerifyAt);
      const verify = verifyAsked || !lastVerify || now() - Date.parse(lastVerify) > VERIFY_EVERY_MS;
      if ((await pushAll(report)) === 'ok') await pullAll(report, verify);
    } catch {
      // A local SQLite failure: nothing is lost (every step is one transaction); try again on the next trigger.
      lastFailure = 'server';
    } finally {
      running = false;
      lastCycleEnd = now();
    }
    report.phase = phase();
    scheduleRetry();
    if (pendingCount(db) === 0) drained.forEach((l) => l());
    emit();
    return report;
  }

  function scheduleRetry(): void {
    if (retryTimer !== null) clearTimer(retryTimer);
    retryTimer = null;
    if (stopped || !isActive()) return;
    const head = headOp(db);
    if (!head?.next_attempt_at) return;
    const wait = Math.max(0, Date.parse(head.next_attempt_at) - now());
    retryTimer = setTimer(() => {
      retryTimer = null;
      requestSync('retry');
    }, wait);
  }

  function sync(opts: { verify?: boolean } = {}): Promise<SyncReport> {
    const verify = !!opts.verify;
    if (queued) {
      queued.verify = queued.verify || verify;
      return queued.promise;
    }
    const entry = { verify, promise: Promise.resolve(EMPTY) };
    entry.promise = chain.then(() => {
      queued = null;
      return cycle(entry.verify);
    });
    queued = entry;
    chain = entry.promise.catch(() => EMPTY);
    return entry.promise;
  }

  function requestSync(reason: SyncReason): void {
    if (stopped || mismatch) return;
    if (reason === 'save') {
      if (saveTimer !== null) clearTimer(saveTimer);
      saveTimer = setTimer(() => {
        saveTimer = null;
        void sync();
      }, deps.saveDebounceMs ?? 1_500);
      return;
    }
    if (reason === 'foreground' && !running && now() - lastCycleEnd < FOREGROUND_MIN_GAP_MS) return;
    void sync({ verify: reason === 'refresh' });
  }

  return {
    userId,
    start() {
      if (stopped) return null;
      let result: OwnershipResult | null = null;
      try {
        result = takeOwnership(db, userId, ctx());
        if (result.outcome === 'claimed') changed();
      } catch (e) {
        if (e instanceof AccountMismatchError) {
          mismatch = true;
          emit();
          return null;
        }
        throw e;
      }
      requestSync('start');
      return result;
    },
    sync,
    requestSync,
    status,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    pendingCount: () => pendingCount(db),
    onDrained(listener) {
      drained.add(listener);
      return () => {
        drained.delete(listener);
      };
    },
    pauseTimers() {
      if (retryTimer !== null) clearTimer(retryTimer);
      retryTimer = null;
    },
    stop() {
      stopped = true;
      if (retryTimer !== null) clearTimer(retryTimer);
      if (saveTimer !== null) clearTimer(saveTimer);
      retryTimer = null;
      saveTimer = null;
    },
  };
}
