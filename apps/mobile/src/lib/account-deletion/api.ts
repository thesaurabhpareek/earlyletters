/**
 * Server calls for account deletion. Everything runs as the signed-in user
 * (JWT and RLS; no service key in the app):
 *  - request_account_deletion(p_source, p_had_active_subscription) and
 *    cancel_account_deletion() (20261003000000_security_and_family.sql);
 *  - the caller's own open request from deletion_requests (RLS: own rows);
 *  - sync_books() for the "What happens" lines;
 *  - analytics-forget/v1 (Edge Function) with this phone's analytics ids, so
 *    PostHog deletes those persons now; the server never stores the ids (TDD 05 X-02).
 * Kept free of React Native so it is tested with a fake client.
 */
import { parseStatus, type ServerStatus, type SyncBook } from './logic';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

/** The slice of the Supabase client this module needs (structurally matches supabase-js). */
export interface DeletionClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<Result>;
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        in(column: string, values: string[]): {
          order(column: string, opts: { ascending: boolean }): { limit(n: number): PromiseLike<Result> };
        };
      };
    };
  };
  functions: { invoke(name: string, opts: { body: unknown; headers?: Record<string, string> }): Promise<{ data: unknown; error: unknown }> };
}

export type ApiOutcome<T> = { ok: true; value: T } | { ok: false; reason: 'offline' | 'failed' };

const offline = (e: unknown): boolean => {
  const m = String((e as { message?: unknown })?.message ?? '');
  return /network|fetch|offline|timed? ?out/i.test(m);
};

/**
 * How long a read waits for the server before it counts as offline (BL-492 point 3). supabase-js retries on its own for
 * several seconds and a hung request never ends, which left a bare spinner. Reads only: a request or a cancel that is
 * given up on may still reach the server, and then "nothing has changed" would be untrue (requestDeletion and
 * cancelDeletion already check the status after a failure, so those keep waiting for their own answer).
 */
export const READ_TIMEOUT_MS = 15_000;

const TIMED_OUT = Symbol('timed out');

async function call<T>(fn: () => PromiseLike<Result>, read: (data: unknown) => T, timeoutMs?: number): Promise<ApiOutcome<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const pending = Promise.resolve(fn());
    const got = timeoutMs === undefined
      ? await pending
      : await Promise.race([pending, new Promise<typeof TIMED_OUT>((res) => (timer = setTimeout(() => res(TIMED_OUT), timeoutMs)))]);
    if (got === TIMED_OUT) return { ok: false, reason: 'offline' };
    const { data, error } = got;
    if (error) return { ok: false, reason: offline(error) ? 'offline' : 'failed' };
    return { ok: true, value: read(data) };
  } catch (e) {
    return { ok: false, reason: offline(e) ? 'offline' : 'failed' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The status read. With a timeout it is the page's load (a hung read ends as offline). Without one it is the check made
 * after a failed write: that check must wait for its own answer, because giving up on it would leave the page saying
 * "nothing has changed" about a request that may be open (BL-492).
 */
function readStatus(client: DeletionClient, timeoutMs?: number): Promise<ApiOutcome<ServerStatus>> {
  return call(
    () => client.from('deletion_requests').select('id,status,scheduled_for').eq('kind', 'account')
      .in('status', ['scheduled', 'held', 'executing']).order('requested_at', { ascending: false }).limit(1),
    parseStatus,
    timeoutMs,
  );
}

export function loadStatus(client: DeletionClient): Promise<ApiOutcome<ServerStatus>> {
  return readStatus(client, READ_TIMEOUT_MS);
}

export function loadBooks(client: DeletionClient): Promise<ApiOutcome<SyncBook[]>> {
  return call(() => client.rpc('sync_books'), (d) => {
    const books = (d as { books?: unknown } | null)?.books;
    return Array.isArray(books) ? (books as SyncBook[]) : [];
  }, READ_TIMEOUT_MS);
}

/**
 * Idempotent on the server: a second call returns the open request.
 *
 * A request that failed here may still have been made: the server can commit and the answer be lost (a dropped
 * connection, a reply that cannot be read). So a failed call is checked against the open request once, as a cancel is
 * (cancelDeletion): the screen must never say that nothing has changed while a request is open. If the check finds the
 * request, this is a success. If it finds none, the failure stands, and it is true. If the check cannot be made either,
 * the failure stands as it was.
 */
export async function requestDeletion(client: DeletionClient, hadActiveSubscription: boolean | null): Promise<ApiOutcome<{ requestId: string; scheduledFor: string }>> {
  const r = await call(
    () => client.rpc('request_account_deletion', { p_source: 'ios', p_had_active_subscription: hadActiveSubscription }),
    (d) => {
      const row = (Array.isArray(d) ? d[0] : d) as { request_id?: unknown; scheduled_for?: unknown } | null;
      if (!row || typeof row.request_id !== 'string' || typeof row.scheduled_for !== 'string') throw new Error('bad_response');
      return { requestId: row.request_id, scheduledFor: row.scheduled_for };
    },
  );
  if (r.ok) return r;
  const s = await readStatus(client);
  if (s.ok && (s.value.state === 'scheduled' || s.value.state === 'held')) {
    return { ok: true, value: { requestId: s.value.requestId, scheduledFor: s.value.scheduledFor } };
  }
  return r;
}

/**
 * Cancels the open request. The server answers false when nothing was open to cancel, which is fine when the request
 * was already cancelled (an earlier try whose answer was lost, or another phone) and not when it is still open or
 * executing, so a false answer is checked against the status, read as the screen reads it.
 */
export async function cancelDeletion(client: DeletionClient): Promise<ApiOutcome<boolean>> {
  const r = await call(() => client.rpc('cancel_account_deletion'), (d) => d === true);
  if (!r.ok || r.value) return r;
  const s = await readStatus(client);
  return s.ok && s.value.state === 'none' ? { ok: true, value: true } : { ok: false, reason: s.ok ? 'failed' : s.reason };
}

/** Where the "forget my analytics ids" retry flag lives (device settings, L2). */
export interface FlagStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const FORGET_PENDING_KEY = 'accountDeletion.forgetPending';

export interface AnalyticsIds {
  ids(): string[];
  forget(): Promise<void>;
  /** Forgets only these ids on the phone (the acknowledged ones). Without it, a partial send forgets nothing. */
  forgetSome?(ids: string[]): Promise<void>;
}

/** The server takes at most this many ids per call (analytics-forget MAX_IDS). */
export const FORGET_BATCH = 21;

/**
 * Sends this phone's analytics ids (current and retired) to analytics-forget in batches of FORGET_BATCH, then forgets
 * on the phone only the ids whose batch was acknowledged. A batch that fails stops the loop: its ids and every later
 * one stay, a flag is kept and `retryForget` tries again on the next open of the screen or launch. Once every batch
 * is acknowledged the whole local record is wiped. The ids never go anywhere else and are never logged.
 */
export async function forgetAnalytics(
  client: DeletionClient,
  analytics: AnalyticsIds,
  flags: FlagStore,
  reason: 'account_deletion' | 'device_after_deletion',
  idempotencyKey: string,
): Promise<'done' | 'nothing' | 'pending'> {
  const ids = analytics.ids();
  if (!ids.length) {
    flags.remove(FORGET_PENDING_KEY);
    return 'nothing';
  }
  const acknowledged: string[] = [];
  try {
    for (let i = 0; i < ids.length; i += FORGET_BATCH) {
      const batch = ids.slice(i, i + FORGET_BATCH);
      const { error } = await client.functions.invoke('analytics-forget/v1', { body: { ids: batch, reason }, headers: { 'idempotency-key': idempotencyKey } });
      if (error) throw error;
      acknowledged.push(...batch);
    }
    await analytics.forget();
    flags.remove(FORGET_PENDING_KEY);
    return 'done';
  } catch {
    flags.set(FORGET_PENDING_KEY, reason);
    if (acknowledged.length && analytics.forgetSome) {
      try {
        await analytics.forgetSome(acknowledged);
      } catch {
        // Kept on the phone: the retry names them again, which is safe (forgetting is idempotent).
      }
    }
    return 'pending';
  }
}

/** For the coordinator to call after sign-in or launch: finishes a forget that failed earlier. */
export async function retryForget(client: DeletionClient, analytics: AnalyticsIds, flags: FlagStore, idempotencyKey: string): Promise<'done' | 'nothing' | 'pending' | 'none_pending'> {
  const reason = flags.get(FORGET_PENDING_KEY);
  if (reason !== 'account_deletion' && reason !== 'device_after_deletion') return 'none_pending';
  return forgetAnalytics(client, analytics, flags, reason, idempotencyKey);
}
