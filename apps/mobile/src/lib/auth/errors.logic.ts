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

export type AuthErrorContext = 'code' | 'link' | 'provider' | 'send' | 'passkey';

export function authErrorKind(e: unknown, context: AuthErrorContext): AuthErrorKind {
  if (e && typeof e === 'object') {
    const x = e as { error?: unknown };
    // react-native-passkey rejects with { error, message }.
    if (x.error === 'UserCancelled') return 'cancelled';
    if (x.error === 'NotSupported' || x.error === 'BadConfiguration' || x.error === 'NoCreateOption') return 'not_available';
    if (x.error === 'NoCredentials') return 'cancelled';
  }
  const code = errorCode(e);
  // expo-apple-authentication: the person closed the Apple sheet.
  if (code === 'ERR_REQUEST_CANCELED') return 'cancelled';
  if (isNetworkError(e)) return 'network';
  switch (code) {
    case 'otp_expired':
      // Supabase says "expired or invalid" for both; a typed code is most often a typo.
      return context === 'code' ? 'wrong_code' : 'expired';
    case 'webauthn_challenge_expired':
    case 'flow_state_expired':
      return 'expired';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rate_limited';
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
  if (errorStatus(e) === 429) return 'rate_limited';
  return context === 'provider' || context === 'passkey' ? 'provider' : 'unknown';
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

/** Accept the code as typed or pasted: digits only, any spaces or dashes removed. */
export function normaliseCode(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/[^0-9]/g, '');
}

/** A light shape check before sending; Supabase does the real validation. */
export function looksLikeEmail(input: string): boolean {
  const s = input.trim();
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
