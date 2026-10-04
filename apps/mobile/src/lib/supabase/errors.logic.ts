/**
 * Reading errors from supabase-js without depending on its classes (pure, so
 * the auth and invite error maps are testable in Node).
 *
 * PostgREST errors carry the Postgres SQLSTATE in `code`; our functions raise
 * custom ones (supabase/APPLY.md "Error codes the app must handle": SCINV,
 * SCPAR, SCRAT, SCCON, SCDEL, SCANO and others). Auth errors carry a string
 * `code` (for example `otp_expired`) and an HTTP `status`.
 *
 * Never forward `message`, `details` or `hint` to analytics or logs: they can
 * quote values (TDD 01 4.2 rule 2).
 */
export interface ErrorLike {
  code?: unknown;
  status?: unknown;
  name?: unknown;
  message?: unknown;
}

function asErrorLike(e: unknown): ErrorLike | null {
  return e && typeof e === 'object' ? (e as ErrorLike) : null;
}

/** The SQLSTATE or Auth error code, or null. */
export function errorCode(e: unknown): string | null {
  const c = asErrorLike(e)?.code;
  return typeof c === 'string' && c.length > 0 ? c : null;
}

export function errorStatus(e: unknown): number | null {
  const s = asErrorLike(e)?.status;
  return typeof s === 'number' ? s : null;
}

export function errorMessage(e: unknown): string {
  const m = asErrorLike(e)?.message;
  return typeof m === 'string' ? m : '';
}

/** fetch failed before any response: offline, DNS, TLS, timeout. */
export function isNetworkError(e: unknown): boolean {
  const x = asErrorLike(e);
  if (!x) return false;
  if (x.name === 'AuthRetryableFetchError') return true;
  const msg = errorMessage(e);
  return /network request failed|failed to fetch|network error|the internet connection appears to be offline|timed out|load failed/i.test(msg);
}
