/**
 * BL-330, security review H3, F02-REQ-004, F02-REQ-022: after native Sign in
 * with Apple, the one-time authorization code goes to the `apple-token` Edge
 * Function (supabase/functions/apple-token), which exchanges it with Apple
 * and keeps the refresh token encrypted, so account deletion can revoke it
 * (Apple guideline 5.1.1(v), A-NFR-011).
 *
 * - Sent once per sign-in, in the request body over HTTPS with the new
 *   session's JWT; never stored on the phone, never logged.
 * - Apple codes are single use and short lived (Apple documents 5 minutes),
 *   so a failure is not queued for later. One retry for a network or server
 *   failure; then the next Apple sign-in captures it. Until then deletion
 *   finishes with the `apple_no_token` alert the purge worker already raises.
 * - Never blocks or fails the sign-in.
 *
 * Pure apart from the injected invoke; tested in test/auth-apple-token.test.ts.
 */

export const APPLE_TOKEN_FUNCTION = 'apple-token/v1';
const CODE_RE = /^[A-Za-z0-9._-]{8,1024}$/;

/** The part of supabase-js `functions.invoke` this needs. */
export type InvokeFn = (name: string, options: { body: { code: string } }) => Promise<{ error: unknown }>;

export type CaptureOutcome = 'stored' | 'skipped' | 'refused' | 'failed';

/** Retry only what might succeed a moment later: no HTTP status (network), 429 or 5xx. */
function retryable(error: unknown): boolean {
  const status = (error as { context?: { status?: unknown } } | null)?.context?.status;
  if (typeof status !== 'number') return true;
  return status === 429 || status >= 500;
}

export async function captureAppleRefreshToken(
  invoke: InvokeFn,
  authorizationCode: string | null | undefined,
  opts: { retryDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<CaptureOutcome> {
  if (!authorizationCode || !CODE_RE.test(authorizationCode)) return 'skipped';
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { error } = await invoke(APPLE_TOKEN_FUNCTION, { body: { code: authorizationCode } });
      if (!error) return 'stored';
      if (!retryable(error)) return 'refused';
    } catch {
      // network: retry once
    }
    if (attempt === 0) await sleep(opts.retryDelayMs ?? 2_000);
  }
  return 'failed';
}
