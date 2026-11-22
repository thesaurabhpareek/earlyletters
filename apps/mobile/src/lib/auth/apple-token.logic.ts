/**
 * The phone's half of Apple token capture (BL-330, security review H3,
 * F02-REQ-004, F02-REQ-022). Pure, tested in test/auth-apple-token.test.ts;
 * apple.ts makes the call, supabase/functions/apple-token answers it.
 *
 * Request: POST /functions/v1/apple-token/v1 with the signed-in user's JWT and
 * `{ code, clientId }`. The function answers 204 with no body when the refresh
 * token is stored (nothing is echoed), or an ADR 0017 error envelope.
 *
 * Retry rule: Apple's authorization code works once and lives five minutes,
 * so an answer from the function is final (4xx: the code is used, expired,
 * not ours, or the caller is not an Apple account; 5xx: the function already
 * tried Apple, or is not configured). Only a request that never reached the
 * function (no connection, or Supabase's relay failed) is tried again.
 */

/** Edge Function name plus the route major (ADR 0017 5: versioned paths). */
export const APPLE_TOKEN_FUNCTION = 'apple-token/v1';
/** One try, and one more after a lost connection. */
export const CAPTURE_ATTEMPTS = 2;
export const CAPTURE_RETRY_MS = 3_000;

/** Same shape the function accepts: Apple codes are opaque; this bounds them without assuming more. */
const CODE_RE = /^[A-Za-z0-9._-]{16,512}$/;
const CLIENT_RE = /^[A-Za-z0-9.-]{3,155}$/;

export type CaptureResult = 'stored' | 'failed' | 'skipped';

/** The request body, or null when there is nothing sensible to send (no code, or no bundle id in this build). */
export function appleCaptureBody(code: string | null | undefined, clientId: string | null | undefined): { code: string; clientId: string } | null {
  if (typeof code !== 'string' || !CODE_RE.test(code)) return null;
  if (typeof clientId !== 'string' || !CLIENT_RE.test(clientId)) return null;
  return { code, clientId };
}

/** What one attempt's outcome means: `error` is what functions.invoke returned (or threw), null on success. */
export function captureVerdict(error: unknown): CaptureResult | 'retry' {
  if (error === null || error === undefined) return 'stored';
  const name = (error as { name?: unknown })?.name;
  // supabase-js functions-js: the function answered (any status) -> final.
  if (name === 'FunctionsHttpError') return 'failed';
  // The request did not reach the function -> one more try.
  if (name === 'FunctionsFetchError' || name === 'FunctionsRelayError' || name === 'TypeError' || name === 'AbortError') return 'retry';
  return 'failed';
}
