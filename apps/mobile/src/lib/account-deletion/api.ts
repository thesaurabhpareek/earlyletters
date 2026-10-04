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

async function call<T>(fn: () => PromiseLike<Result>, read: (data: unknown) => T): Promise<ApiOutcome<T>> {
  try {
    const { data, error } = await fn();
    if (error) return { ok: false, reason: offline(error) ? 'offline' : 'failed' };
    return { ok: true, value: read(data) };
  } catch (e) {
    return { ok: false, reason: offline(e) ? 'offline' : 'failed' };
  }
}

export function loadStatus(client: DeletionClient): Promise<ApiOutcome<ServerStatus>> {
  return call(
    () => client.from('deletion_requests').select('id,status,scheduled_for').eq('kind', 'account')
      .in('status', ['scheduled', 'held', 'executing']).order('requested_at', { ascending: false }).limit(1),
    parseStatus,
  );
}

export function loadBooks(client: DeletionClient): Promise<ApiOutcome<SyncBook[]>> {
  return call(() => client.rpc('sync_books'), (d) => {
    const books = (d as { books?: unknown } | null)?.books;
    return Array.isArray(books) ? (books as SyncBook[]) : [];
  });
}

/** Idempotent on the server: a second call returns the open request. */
export function requestDeletion(client: DeletionClient, hadActiveSubscription: boolean | null): Promise<ApiOutcome<{ requestId: string; scheduledFor: string }>> {
  return call(
    () => client.rpc('request_account_deletion', { p_source: 'ios', p_had_active_subscription: hadActiveSubscription }),
    (d) => {
      const row = (Array.isArray(d) ? d[0] : d) as { request_id?: unknown; scheduled_for?: unknown } | null;
      if (!row || typeof row.request_id !== 'string' || typeof row.scheduled_for !== 'string') throw new Error('bad_response');
      return { requestId: row.request_id, scheduledFor: row.scheduled_for };
    },
  );
}

export function cancelDeletion(client: DeletionClient): Promise<ApiOutcome<boolean>> {
  return call(() => client.rpc('cancel_account_deletion'), (d) => d === true);
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
}

/**
 * Sends this phone's analytics ids (current and retired, at most 21) to
 * analytics-forget, then forgets them locally. On failure a flag is kept and
 * `retryForget` tries again on the next open of the screen or launch.
 * The ids never go anywhere else and are never logged.
 */
export async function forgetAnalytics(
  client: DeletionClient,
  analytics: AnalyticsIds,
  flags: FlagStore,
  reason: 'account_deletion' | 'device_after_deletion',
  idempotencyKey: string,
): Promise<'done' | 'nothing' | 'pending'> {
  const ids = analytics.ids().slice(0, 21);
  if (!ids.length) {
    flags.remove(FORGET_PENDING_KEY);
    return 'nothing';
  }
  try {
    const { error } = await client.functions.invoke('analytics-forget/v1', { body: { ids, reason }, headers: { 'idempotency-key': idempotencyKey } });
    if (error) throw error;
    await analytics.forget();
    flags.remove(FORGET_PENDING_KEY);
    return 'done';
  } catch {
    flags.set(FORGET_PENDING_KEY, reason);
    return 'pending';
  }
}

/** For the coordinator to call after sign-in or launch: finishes a forget that failed earlier. */
export async function retryForget(client: DeletionClient, analytics: AnalyticsIds, flags: FlagStore, idempotencyKey: string): Promise<'done' | 'nothing' | 'pending' | 'none_pending'> {
  const reason = flags.get(FORGET_PENDING_KEY);
  if (reason !== 'account_deletion' && reason !== 'device_after_deletion') return 'none_pending';
  return forgetAnalytics(client, analytics, flags, reason, idempotencyKey);
}
