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

/** `status` is the HTTP status supabase-js puts beside `error` (401 for a token PostgREST refused). */
type Result = { data: unknown; error: { code?: string; message?: string } | null; status?: number };

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
  /**
   * supabase-js `auth.refreshSession()`, used once after a Cancel deletion refused for auth (CDesO-59). Optional so the
   * fakes in tests that never reach it need not draw it; the app's client always has it. Without it, the refusal stands.
   */
  auth?: { refreshSession(): PromiseLike<{ data: { session: unknown } | null; error: unknown }> };
}

export type ApiOutcome<T> = { ok: true; value: T } | { ok: false; reason: 'offline' | 'failed' };

/**
 * A Cancel deletion press that did not cancel, by what the phone can tell (CDesO-58, CDesO-59):
 *  - `limited`: the server's daily limit (SQLSTATE SCRAT); the call rolled back, so the request is as it was;
 *  - `auth`: refused for auth, and still refused after one refresh of the session (or the refresh itself failed);
 *    nothing ran on the server. If the refresh removed the session, the page shows its signed-out view instead;
 *  - `executing`: nothing was open to cancel because the deletion is being carried out; `status` is the read that said so;
 *  - `offline`, `failed`: anything else, where the outcome may be unknown or a retry may work.
 */
export type CancelFailure = 'offline' | 'failed' | 'limited' | 'auth';
export type CancelOutcome =
  | { ok: true; value: true }
  | { ok: false; reason: CancelFailure }
  | { ok: false; reason: 'executing'; status: Extract<ServerStatus, { state: 'executing' }> };

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

/**
 * One call, with what the server said when it refused: its SQLSTATE or PostgREST code (`code`, null when there was no
 * answer to read) and the HTTP status. Kept so Cancel deletion can tell the daily limit and an auth refusal from the rest
 * (CDesO-58, CDesO-59); every other caller reads only `reason`, through `call`.
 */
type Attempt<T> = { ok: true; value: T } | { ok: false; reason: 'offline' | 'failed'; code: string | null; status?: number };

async function attempt<T>(fn: () => PromiseLike<Result>, read: (data: unknown) => T, timeoutMs?: number): Promise<Attempt<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const pending = Promise.resolve(fn());
    const got = timeoutMs === undefined
      ? await pending
      : await Promise.race([pending, new Promise<typeof TIMED_OUT>((res) => (timer = setTimeout(() => res(TIMED_OUT), timeoutMs)))]);
    if (got === TIMED_OUT) return { ok: false, reason: 'offline', code: null };
    const { data, error, status } = got;
    if (error) {
      const code = typeof error.code === 'string' && error.code ? error.code : null;
      return { ok: false, reason: offline(error) ? 'offline' : 'failed', code, ...(typeof status === 'number' ? { status } : {}) };
    }
    return { ok: true, value: read(data) };
  } catch (e) {
    return { ok: false, reason: offline(e) ? 'offline' : 'failed', code: null };
  } finally {
    clearTimeout(timer);
  }
}

async function call<T>(fn: () => PromiseLike<Result>, read: (data: unknown) => T, timeoutMs?: number): Promise<ApiOutcome<T>> {
  const r = await attempt(fn, read, timeoutMs);
  return r.ok ? r : { ok: false, reason: r.reason };
}

/**
 * The refusals that mean "not signed in as far as the server can tell" (CDesO-59 case 1): `28000` from require_user(),
 * `42501` for a call made with no token (the anon role has no grant), and PostgREST's `PGRST301` to `PGRST303` or HTTP
 * 401 for a token that expired just before supabase-js refreshed it. Nothing ran on the server in any of them.
 */
const CANCEL_AUTH_CODES = new Set(['28000', '42501', 'PGRST301', 'PGRST302', 'PGRST303']);

/** The daily limit on cancellations (5 per person in a rolling 24 h), raised after the call rolled back (CDesO-58). */
export const CANCEL_LIMIT_CODE = 'SCRAT';

function authRefused(r: { code: string | null; status?: number }): boolean {
  return (r.code !== null && CANCEL_AUTH_CODES.has(r.code)) || r.status === 401;
}

/** One refresh of the session with supabase-js's own stored refresh token; true only when a session came back. */
async function refreshed(client: DeletionClient): Promise<boolean> {
  if (!client.auth) return false;
  try {
    const { data, error } = await client.auth.refreshSession();
    return !error && !!data?.session;
  } catch {
    return false;
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
 * executing, so a false answer is checked against the status, read as the screen reads it. Executing is returned with
 * that read, so the page moves to its executing state instead of showing a failure (CDesO-59 case 3).
 *
 * A refusal for auth (CDesO-59 case 1) is not answered at once: the session is refreshed and the cancel sent once more,
 * and that second answer decides as for any press. One retry, never a loop, and never for any other refusal: a dropped
 * connection or a 5xx may have reached the server, and the status check above is what settles those. SCRAT is the daily
 * limit (CDesO-58); the call rolled back, so it is reported as `limited`, never as an unknown outcome.
 */
export async function cancelDeletion(client: DeletionClient): Promise<CancelOutcome> {
  const send = () => attempt(() => client.rpc('cancel_account_deletion'), (d) => d === true);
  let r = await send();
  if (!r.ok && authRefused(r)) {
    if (!(await refreshed(client))) return { ok: false, reason: 'auth' };
    r = await send();
    if (!r.ok && authRefused(r)) return { ok: false, reason: 'auth' };
  }
  if (!r.ok) return { ok: false, reason: r.code === CANCEL_LIMIT_CODE ? 'limited' : r.reason };
  if (r.value) return { ok: true, value: true };
  const s = await readStatus(client);
  if (!s.ok) return { ok: false, reason: s.reason };
  if (s.value.state === 'none') return { ok: true, value: true };
  if (s.value.state === 'executing') return { ok: false, reason: 'executing', status: s.value };
  return { ok: false, reason: 'failed' };
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
