/**
 * Email sign-in links that work only on the phone that asked for them
 * (BL-347, security review H1; F02-REQ-018, F02-REQ-020; ADR 0023). Pure,
 * tested in test/auth-email-link.test.ts.
 *
 * The attack (review H1): someone requests a sign-in email for their own
 * address and sends the link to a parent who uses the app without an account.
 * Before this change, one tap signed the parent's phone into the sender's
 * account and the phone's letters were claimed and uploaded there.
 *
 * Three layers, each enough on its own to stop that; the first two live here:
 *  1. Pending request. Asking for an email from this phone writes a small
 *     record (only a time, never the address) to the Keychain. A link opened
 *     while no unexpired record exists is never verified: the person is
 *     offered the code from the email instead, or a new email when this
 *     phone's own record is over an hour old. The record lives for the
 *     longest code life a Supabase project can set (1 hour).
 *  2. PKCE. The client runs Supabase Auth with `flowType: 'pkce'`, so the
 *     email request stores a code verifier on this phone and sends only its
 *     challenge. The app opens the link with GET /auth/v1/verify (redirects
 *     not followed) and gets back an auth code bound to the phone that
 *     requested the email; `exchangeCodeForSession` then needs that phone's
 *     verifier. A link requested anywhere else cannot finish here. A redirect
 *     carrying tokens directly (implicit flow) is refused: that is exactly the
 *     shape the attack relied on.
 *  3. The claim screen before any letters move (account-claim.logic.ts).
 *
 * Typed codes still work across devices on purpose (the person types the code
 * from their own email into the phone they hold), and they pass layer 3 too.
 * A link is also refused while any account is signed in on this phone: a link
 * never replaces a session (F02-U27).
 */
import type { EmailLinkType } from './links.logic';

/** How long this phone remembers that it asked for an email: one hour, longer than the 900 s link and code life (docs/ops/AUTH_SETUP.md 4.4). */
export const PENDING_REQUEST_TTL_MS = 60 * 60 * 1000;

/** The clock may move back a little (NTP); anything further in the future is damaged. */
const FUTURE_TOLERANCE_MS = 60_000;

export interface PendingEmailRequest {
  /** Epoch ms when this phone asked for the email. Nothing else is stored. */
  at: number;
}

export function encodePendingRequest(p: PendingEmailRequest): string {
  return JSON.stringify({ at: p.at });
}

/**
 * Null when absent, damaged, or from the future (clock moved back by more than a minute).
 * 'expired' when this phone did ask, more than an hour ago: never verified either, but the
 * person is told the link expired rather than that it came from another phone.
 */
export function decodePendingRequest(raw: string | null | undefined, now: number): PendingEmailRequest | 'expired' | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { at?: unknown };
    if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
    if (v.at - now > FUTURE_TOLERANCE_MS) return null;
    if (now - v.at > PENDING_REQUEST_TTL_MS) return 'expired';
    return { at: v.at };
  } catch {
    return null;
  }
}

export type LinkDecision =
  /** This phone asked for an email recently and nobody is signed in: open the link. */
  | 'verify'
  /** No request from this phone: never verify; offer the code instead. */
  | 'not_this_phone'
  /** This phone's request is over an hour old, so is any link it got: never verify; offer a new email. */
  | 'expired'
  /** Someone is already signed in here: a link never replaces the session. */
  | 'signed_in';

/** Layer 1 (and the signed-in refusal). The signed-in check wins: it holds whatever the pending record says. */
export function decideEmailLink(input: { pending: PendingEmailRequest | 'expired' | null; signedIn: boolean }): LinkDecision {
  if (input.signedIn) return 'signed_in';
  if (input.pending === 'expired') return 'expired';
  return input.pending ? 'verify' : 'not_this_phone';
}

/**
 * GET /auth/v1/verify accepts `magiclink` (a known address, the Magic Link
 * template) and `signup` (a new address, the Confirm signup template); only
 * POST /verify accepts the umbrella `email`. Our templates put `type=email` in
 * the link so the two emails look the same, so a link that says `email` is
 * tried as a magic link first and, if Supabase does not know the token under
 * that type, as a signup. A miss under the wrong type consumes nothing: the
 * token is only looked up, not used.
 */
export function verifyTypesFor(type: EmailLinkType): readonly ('magiclink' | 'signup')[] {
  if (type === 'signup') return ['signup'];
  if (type === 'magiclink') return ['magiclink'];
  return ['magiclink', 'signup'];
}

/** The GET /verify URL. The token hash travels to Supabase only, never to our website. */
export function verifyUrl(supabaseUrl: string, tokenHash: string, type: 'magiclink' | 'signup', redirectTo: string): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  return `${base}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export type OpenLinkOutcome =
  | { ok: true; userId: string }
  | { ok: false; error: 'other_phone' | 'already_signed_in' | 'expired' };

export interface OpenLinkDeps {
  /** The Keychain note this phone wrote when it asked for an email (pending.ts). */
  readPending(): Promise<PendingEmailRequest | 'expired' | null>;
  /** A session exists on this phone right now. */
  signedIn(): boolean;
  /** Layer 2: GET /verify and the PKCE exchange (email.ts verifyEmailLinkPkce). Throws on failure. */
  exchange(tokenHash: string, type: EmailLinkType): Promise<string>;
  /** The note is spent once a link or code signed in. */
  clearPending(): Promise<void>;
}

/**
 * Opens an email link the way the session provider does: refuse while signed
 * in, refuse without a pending request from this phone, otherwise exchange
 * through PKCE. Errors from the exchange propagate (errors.logic maps them).
 * No request reaches Supabase on a refusal.
 */
export async function openEmailLink(link: { tokenHash: string; type: EmailLinkType }, deps: OpenLinkDeps): Promise<OpenLinkOutcome> {
  const decision = decideEmailLink({ pending: await deps.readPending(), signedIn: deps.signedIn() });
  if (decision === 'signed_in') return { ok: false, error: 'already_signed_in' };
  if (decision === 'not_this_phone') return { ok: false, error: 'other_phone' };
  if (decision === 'expired') return { ok: false, error: 'expired' };
  const userId = await deps.exchange(link.tokenHash, link.type);
  await deps.clearPending();
  return { ok: true, userId };
}

export type VerifyRedirect =
  /** PKCE: an auth code bound to the phone that asked for the email. */
  | { kind: 'code'; code: string }
  /** The token is unknown or used under this type, or the flow is gone. */
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

/**
 * Reads the Location header of the GET /verify answer. Supabase puts the auth
 * code in the query (`?code=`) and an error in the query or the fragment
 * (`error_code=otp_expired` for an unknown, used or expired token).
 */
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
    return {
      kind: 'error',
      error: code === 'otp_expired' || code === 'flow_state_expired' || code === 'access_denied' ? 'expired' : 'unknown',
    };
  }
  const authCode = query.code ?? '';
  return AUTH_CODE.test(authCode) ? { kind: 'code', code: authCode } : { kind: 'error', error: 'unknown' };
}
