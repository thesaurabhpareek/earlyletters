/**
 * Maps what Apple, Google, passkeys and Supabase Auth throw to the few kinds
 * the screens have words for (PRD A section 9, A-REQ-031). Pure, tested in
 * test/auth-machine.test.ts. Cancels are silent: the sheet just stays.
 *
 * Also the client-side pause after repeated wrong codes (A-REQ-027): five
 * wrong codes for one address in 15 minutes pause entry for 15 minutes. The
 * server limit is per IP only (TDD 04 3.1.4); this keeps honest people from
 * ever reaching it and is not a security control on its own.
 */
import { errorCode, errorStatus, isNetworkError } from '../supabase/errors.logic';
import type { AuthErrorKind } from './machine.logic';

/**
 * Where the error happened. 'passkey' is signing in with a passkey. 'passkey_add' (Account, Add a passkey) and
 * 'sign_out_others' (Account, Sign out other devices) are signed-in actions, so the sign-in words (email, "link",
 * "try another way") are wrong for them (BL-452 points 1 and 2).
 */
export type AuthErrorContext = 'code' | 'link' | 'provider' | 'send' | 'passkey' | 'passkey_add' | 'sign_out_others';

/** The error carries an HTTP status of 500 or more: a server answered. Status 0 (a failed fetch) or none is not one. */
function isServerError(e: unknown): boolean {
  const status = errorStatus(e);
  return status !== null && status >= 500;
}

export function authErrorKind(e: unknown, context: AuthErrorContext): AuthErrorKind {
  const kind = baseKind(e, context);
  // A signed-in action has no "sign-in" to try again or another way to try: the provider and not-available lines are about
  // signing in, so these two contexts get their own (a cancel stays silent, a network or rate limit keeps its own words).
  if (context === 'passkey_add') {
    // No support, no setup or passkeys switched off: trying again will not help, so it gets its own true line.
    if (kind === 'not_available') return 'passkey_unavailable';
    if (kind === 'provider') return 'passkey_not_added';
  }
  if (context === 'sign_out_others' && (kind === 'provider' || kind === 'not_available')) return 'sign_out_others_failed';
  return kind;
}

function baseKind(e: unknown, context: AuthErrorContext): AuthErrorKind {
  if (e && typeof e === 'object') {
    const x = e as { error?: unknown };
    // react-native-passkey rejects with { error, message }.
    if (x.error === 'UserCancelled') return 'cancelled';
    if (x.error === 'NotSupported' || x.error === 'BadConfiguration' || x.error === 'NoCreateOption') return 'not_available';
    if (x.error === 'NoCredentials') return 'cancelled';
  }
  const code = errorCode(e);
  // FP-6 (NS-40-R9, E47): the sign-up hook's refusal, before the network check so it is never read as an outage. A failed lookup
  // fails open on the server and never arrives here. The hook's code string is [U] until the hosted hook is
  // checked: card 19 (NS-40-R9 notes) names a 403 from the before-user-created hook and the kind, and no spec names a code. Any other
  // code falls through to the ordinary mapping (the inline unknown error), which is safe. req-question FP6-1.
  if (code === 'region_refused') return 'region_refused';
  // expo-apple-authentication: the person closed the Apple sheet.
  if (code === 'ERR_REQUEST_CANCELED') return 'cancelled';
  // "Network" is a request that never got an answer. @supabase/auth-js also throws AuthRetryableFetchError for a
  // 500 to 504 or a 520 to 530 it did get (status carried on the error, node_modules/@supabase/auth-js/src/lib/fetch.ts);
  // for a failed fetch the status is 0. A person who is online and met a server error must not be told to come back
  // online (BL-488): a status of 500 or more falls through to the provider or unknown words ("That did not work this time").
  if (isNetworkError(e) && !isServerError(e)) return 'network';
  switch (code) {
    case 'otp_expired':
      // Supabase says "expired or invalid" for both; a typed code is most often a typo.
      return context === 'code' ? 'wrong_code' : 'expired';
    // PKCE (BL-347, security review H1): the link was asked for on another phone, or its flow is gone.
    case 'pkce_code_verifier_not_found':
    case 'bad_code_verifier':
    case 'flow_state_not_found':
      return 'other_phone';
    // BL-452 point 1: the words for 'expired' are about an email link, so a passkey's timed-out challenge and a provider
    // sign-in's lost state do not use them.
    case 'webauthn_challenge_expired':
      return context === 'passkey' || context === 'passkey_add' ? 'passkey_expired' : 'expired';
    case 'flow_state_expired':
      return context === 'passkey' || context === 'passkey_add' ? 'passkey_expired' : context === 'provider' ? 'provider' : 'expired';
    // SIGN-01: in the send step a 429 is about emails (the per-address wait or the hourly cap); elsewhere it is not.
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return context === 'send' ? 'email_wait' : 'rate_limited';
    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return 'invalid_email';
    case 'validation_failed':
      return context === 'send' ? 'invalid_email' : 'unknown';
    case 'provider_disabled':
    case 'email_provider_disabled':
    case 'signup_disabled':
    case 'anonymous_provider_disabled':
      return 'not_available';
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'user_not_found':
      return 'session_expired';
    case 'bad_jwt':
    case 'unexpected_audience':
    case 'bad_oauth_callback':
      return 'provider';
  }
  if (errorStatus(e) === 429) return context === 'send' ? 'email_wait' : 'rate_limited';
  return context === 'provider' || context === 'passkey' || context === 'passkey_add' || context === 'sign_out_others' ? 'provider' : 'unknown';
}

export const CODE_ATTEMPT_LIMIT = 5;
export const CODE_WINDOW_MS = 15 * 60 * 1000;

/**
 * Given the times of wrong codes for one address, whether a new attempt may
 * go to the server now, and until when entry is paused. Pure.
 */
export function codeEntryPause(wrongAt: readonly number[], now: number): { paused: boolean; until: number | null } {
  const past = wrongAt.filter((t) => t <= now).sort((a, b) => a - b);
  if (past.length < CODE_ATTEMPT_LIMIT) return { paused: false, until: null };
  // Five wrong codes within 15 minutes of the latest one pause entry for 15 minutes after it.
  const last = past[past.length - 1];
  const inWindow = past.filter((t) => t > last - CODE_WINDOW_MS).length;
  const until = last + CODE_WINDOW_MS;
  return inWindow >= CODE_ATTEMPT_LIMIT && now < until ? { paused: true, until } : { paused: false, until: null };
}

/** The pause is said once, as a change from paused to not paused (BL-476, LEGAL-REQ-051), never on arrival at the screen. */
export function shouldAnnouncePauseEnd(wasPaused: boolean, paused: boolean): boolean {
  return wasPaused && !paused;
}

/** Accept the code as typed or pasted: digits only, any spaces or dashes removed. */
export function normaliseCode(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/[^0-9]/g, '');
}

/** A light shape check before sending; Supabase does the real validation. */
export function looksLikeEmail(input: string): boolean {
  const s = input.trim();
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * SIGN-01: the client's own wait before another email to the same address (A-REQ-025, `RESEND_WAIT_MS` in email.ts).
 * Milliseconds left, 0 when another may go. Keyed by address by the caller, so going back with "Use a different
 * email" and sending the same address again inside the minute never reaches Supabase's per-address 429.
 */
export function emailSendWaitMs(lastSentAt: number | null | undefined, now: number, waitMs: number): number {
  if (lastSentAt === null || lastSentAt === undefined || !Number.isFinite(lastSentAt) || lastSentAt > now) return 0;
  return Math.max(0, lastSentAt + waitMs - now);
}

/** The key for that wait: the address as Supabase compares it (trimmed, lower case). Kept in memory only. */
export function emailWaitKey(email: string): string {
  return email.trim().toLowerCase();
}
