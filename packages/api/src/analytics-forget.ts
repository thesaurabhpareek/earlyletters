/**
 * analytics-forget, contract v1 (TDD 05 X-02 and 7.4; BL-1252 ER-A17). Shapes and limits only: the function is
 * `supabase/functions/analytics-forget`, the callers are the phone's deletion paths and its retired-id cleanup.
 *
 * What it carries: random analytics ids (UUIDs) and a reason code. Never a person id, entry text, transcript, audio or
 * a child name. The ids are used for one PostHog call and dropped by the function, never stored or logged.
 *
 * `retired_id` is the reason a phone sends when it forgets one retired id to stay within its cap of retired ids
 * (ER-A04). The function does not accept it yet: that is the server half of BL-1252, so until it does the phone's call
 * is refused and the id is kept (safe by design: an id leaves the phone only after the server says yes).
 */

export const ANALYTICS_FORGET_PATH = '/functions/v1/analytics-forget/v1';
/** For supabase-js `functions.invoke`. */
export const ANALYTICS_FORGET_FUNCTION = ANALYTICS_FORGET_PATH.replace(/^\/functions\/v1\//, '');

/** At most this many ids in one call (the current id plus the retired list's cap, ER-A04). */
export const ANALYTICS_FORGET_MAX_IDS = 21;

export const ANALYTICS_FORGET_REASONS = ['account_deletion', 'device_after_deletion', 'retired_id'] as const;
export type AnalyticsForgetReason = (typeof ANALYTICS_FORGET_REASONS)[number];

/** Reasons in the contract that the deployed function does not accept yet (the server half). A test pins this list. */
export const ANALYTICS_FORGET_PENDING_REASONS: readonly AnalyticsForgetReason[] = ['retired_id'];

export interface AnalyticsForgetRequest {
  ids: string[];
  reason: AnalyticsForgetReason;
}

/** 202 body: how many ids were accepted. */
export interface AnalyticsForgetAccepted {
  accepted: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The request the function would accept, or null. Same rules as the function: 1 to 21 UUIDs, a known reason. */
export function parseAnalyticsForgetRequest(input: unknown): AnalyticsForgetRequest | null {
  if (typeof input !== 'object' || input === null) return null;
  const { ids, reason } = input as { ids?: unknown; reason?: unknown };
  if (!(ANALYTICS_FORGET_REASONS as readonly unknown[]).includes(reason)) return null;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > ANALYTICS_FORGET_MAX_IDS) return null;
  if (!ids.every((i) => typeof i === 'string' && UUID_RE.test(i))) return null;
  return { ids: [...ids] as string[], reason: reason as AnalyticsForgetReason };
}
