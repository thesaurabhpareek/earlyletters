/**
 * Call-level failures of sync_push and sync_pull (per-op SQLSTATEs are decided
 * on the server: transient ones stop the batch, the rest are permanent).
 * Backoff follows packages/api (decision 17): class sync_batch, 1 s doubling
 * to 5 minutes, full jitter.
 */
import { retryDelayMs } from '@scribe/api';
import type { SupabaseErrorLike } from './types';

export type CallFailure =
  /** No response (supabase-js status 0, empty code). */
  | 'network'
  /** JWT expired or revoked, or not signed in: refresh the session; nothing is retried until then. */
  | 'auth'
  /** Anonymous session (never the app's case): stop. */
  | 'anonymous'
  /** SCRAT or HTTP 429: back off. */
  | 'rate_limited'
  /** The request itself was refused (22xxx): split the batch to find the op, then reject only that op. */
  | 'bad_request'
  /** Anything else (5xx, 40001, 57014, PGRST202 while a migration is not applied yet): back off, never drop. */
  | 'server';

const AUTH_CODES = new Set(['28000', 'PGRST301', 'PGRST302', 'PGRST303']);

export function classifyCallError(error: SupabaseErrorLike | null, status?: number): CallFailure {
  const code = error?.code ?? '';
  if (!code && (status === undefined || status === 0)) return 'network';
  if (AUTH_CODES.has(code) || status === 401) return 'auth';
  if (code === 'SCANO') return 'anonymous';
  if (code === 'SCRAT' || status === 429) return 'rate_limited';
  if (/^22[0-9A-Z]{3}$/.test(code) || code === '54000') return 'bad_request';
  return 'server';
}

/** Delay before retry `attempt` (1 = first retry). */
export function backoffMs(attempt: number, random: () => number = Math.random): number {
  return retryDelayMs('sync_batch', attempt, random);
}
