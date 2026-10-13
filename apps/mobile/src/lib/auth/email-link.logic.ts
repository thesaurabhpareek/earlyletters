/**
 * Email sign-in links that only work on the phone that asked for them
 * (security review H1, gap G-01). Pure, tested in test/auth-email-link.test.ts.
 *
 * The attack: someone requests a sign-in email for their own address and
 * sends the link to a parent. Before this change, opening it signed the
 * parent's phone into the sender's account and uploaded every local letter.
 *
 * Three layers, each enough on its own to stop that:
 *  1. Pending request. Sending an email from this phone writes a small record
 *     (only a time, never the address) to the Keychain. A link opened while no
 *     unexpired record exists is never verified: the person is offered the
 *     code from the email instead. TTL is the longest code life Supabase allows
 *     for this project (1 hour; AUTH_SETUP 4.4 sets 15 minutes).
 *  2. PKCE. The client runs Supabase Auth with `flowType: 'pkce'`, so the
 *     email request stores a code verifier on this phone and sends only its
 *     challenge. The app opens the link with GET /auth/v1/verify (redirects
 *     not followed) and gets back an auth code bound to the challenge of the
 *     phone that requested the email; `exchangeCodeForSession` then needs that
 *     phone's verifier. A link requested anywhere else cannot finish here.
 *     A response carrying tokens directly (implicit flow) is refused: that is
 *     exactly the shape the attack relied on.
 *  3. Confirmation before any letters move (account-confirm.logic.ts).
 *
 * Typed codes still work across devices on purpose (the person types the
 * code from their own email), and they also pass through layer 3.
 */
import type { EmailLinkType } from './links.logic';

/** Longest life of an email link or code that a project can set (Supabase: 3600 s). */
export const PENDING_REQUEST_TTL_MS = 60 * 60 * 1000;

export interface PendingEmailRequest {
  /** Epoch ms when this phone asked for the email. */
  at: number;
}

export function encodePendingRequest(p: PendingEmailRequest): string {
  return JSON.stringify({ at: p.at });
}

/** Null when absent, damaged, expired, or from the future (clock moved back by more than a minute). */
export function decodePendingRequest(raw: string | null, now: number): PendingEmailRequest | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { at?: unknown };
    if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
    if (now - v.at > PENDING_REQUEST_TTL_MS || v.at - now > 60_000) return null;
    return { at: v.at };
  } catch {
    return null;
  }
}

export type LinkDecision =
  /** This phone asked for an email recently: open the link. */
  | 'verify'
  /** No request from this phone: never verify; offer the code instead. */
  | 'not_this_phone'
  /** Someone is already signed in here: a link never replaces the session. */
  | 'signed_in';

export function decideEmailLink(input: { pending: PendingEmailRequest | null; signedIn: boolean }): LinkDecision {
  if (input.signedIn) return 'signed_in';
  return input.pending ? 'verify' : 'not_this_phone';
}

/**
 * GET /auth/v1/verify types. Templates send `magiclink` (known address) or
 * `signup` (new address); links sent before this change say `email`, which
 * GET /verify reads as a magic link (Assumption, device test AUTH_SETUP 11.3).
 */
export function verifyType(type: EmailLinkType): 'magiclink' | 'signup' {
  return type === 'signup' ? 'signup' : 'magiclink';
}

/** The GET /verify URL. The token hash goes to Supabase only, never to our website. */
export function verifyUrl(supabaseUrl: string, tokenHash: string, type: EmailLinkType, redirectTo: string): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  return `${base}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${verifyType(type)}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export type VerifyRedirect =
  | { kind: 'code'; code: string }
  | { kind: 'error'; error: 'expired' | 'unknown' }
  /** Tokens in the redirect (implicit flow): never accepted. */
  | { kind: 'refused' };

const AUTH_CODE = /^[A-Za-z0-9_-]{8,256}$/;

function params(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = i < 0 ? part : part.slice(0, i);
    const v = i < 0 ? '' : part.slice(i + 1);
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      out[k] = v;
    }
  }
  return out;
}

/** Reads the Location header of the GET /verify answer. */
export function parseVerifyRedirect(location: string | null | undefined): VerifyRedirect {
  if (!location) return { kind: 'error', error: 'unknown' };
  const hashAt = location.indexOf('#');
  const beforeHash = hashAt >= 0 ? location.slice(0, hashAt) : location;
  const fragment = params(hashAt >= 0 ? location.slice(hashAt + 1) : '');
  const qAt = beforeHash.indexOf('?');
  const query = params(qAt >= 0 ? beforeHash.slice(qAt + 1) : '');
  const all = { ...query, ...fragment };
  if (all.access_token || all.refresh_token) return { kind: 'refused' };
  if (all.error || all.error_code) {
    const code = all.error_code ?? all.error;
    return { kind: 'error', error: code === 'otp_expired' || code === 'flow_state_expired' || code === 'access_denied' ? 'expired' : 'unknown' };
  }
  const authCode = query.code ?? '';
  return AUTH_CODE.test(authCode) ? { kind: 'code', code: authCode } : { kind: 'error', error: 'unknown' };
}
