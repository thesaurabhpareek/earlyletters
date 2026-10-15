/**
 * Email sign-in: one message with a link and a code (PRD A-REQ-018, TDD 04
 * 3.1.3). Supabase sends it through Resend SMTP from the brand domain
 * (docs/ops/AUTH_SETUP.md sections 4 and 6 hold the template).
 *
 * - Send records a pending request on this phone first (BL-347,
 *   link-guard.logic.ts) and puts its id in the redirect, so the email's link
 *   carries it back as `rid`. The client runs the PKCE flow
 *   (lib/supabase/client.ts), so Supabase also holds a code challenge whose
 *   verifier only this install has.
 * - An opened link is used only while this phone holds that pending request,
 *   only when its `rid` matches, and never while an account is signed in here
 *   (F02-REQ-018, F02-REQ-020). Otherwise it is refused before any request
 *   reaches Supabase, and the screen offers "type the code".
 * - A token-hash link is verified with verifyOtp({ token_hash, type }); a
 *   PKCE code link with exchangeCodeForSession. The website page never
 *   verifies on load, so mail scanners cannot use a link up (A-REQ-023).
 * - The code works anywhere: typed here, or on another phone.
 * - shouldCreateUser stays true: "new" and "returning" look the same, so the
 *   response never reveals whether an address has an account.
 * - Code length follows the project setting (6 by default; set 6 to 10 in
 *   the dashboard and EXPO_PUBLIC_EMAIL_OTP_LENGTH together).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { getAuthSnapshot } from './auth-store';
import { decideEmailLink, LinkRefusedError } from './link-guard.logic';
import { authCallbackUrl, type AuthLink, type EmailLinkType } from './links.logic';
import { authUserId } from './machine.logic';
import { beginLinkRequest, clearLinkRequest, getLinkRequest } from './pending';

const parsed = Number(process.env.EXPO_PUBLIC_EMAIL_OTP_LENGTH);
export const EMAIL_CODE_LENGTH = Number.isInteger(parsed) && parsed >= 6 && parsed <= 10 ? parsed : 6;

/** Client wait before another email to the same address (A-REQ-025). */
export const RESEND_WAIT_MS = 60_000;

export interface SendOptions {
  /** 32 hex characters (link-guard.logic linkRequestIdFrom). Without one, links from this email are refused and the code is the way in. */
  requestId?: string;
  now?: number;
}

export async function sendEmailLink(sb: SupabaseClient, email: string, opts: SendOptions = {}): Promise<void> {
  if (opts.requestId) await beginLinkRequest({ id: opts.requestId, at: opts.now ?? Date.now() });
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true, emailRedirectTo: authCallbackUrl(brand.web.origin, opts.requestId) },
  });
  if (error) {
    if (opts.requestId) await clearLinkRequest();
    throw error;
  }
}

export async function verifyEmailCode(sb: SupabaseClient, email: string, code: string): Promise<string> {
  const { data, error } = await sb.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' });
  if (error) throw error;
  const id = data.user?.id ?? data.session?.user.id;
  if (!id) throw Object.assign(new Error('email_no_user'), { code: 'otp_expired' });
  await clearLinkRequest();
  return id;
}

export interface LinkContext {
  /** `rid` from the opened link. */
  requestId?: string;
  /**
   * The account signed in on this phone. Defaults to the published auth
   * state; the session provider also passes the Keychain's stored session at
   * launch, before that state is known.
   */
  signedInUserId?: string | null;
  now?: number;
}

/** Throws LinkRefusedError unless this phone asked for this link and nobody is signed in here. */
async function guard(ctx: LinkContext): Promise<void> {
  const signedInUserId = ctx.signedInUserId !== undefined ? ctx.signedInUserId : authUserId(getAuthSnapshot());
  const decision = decideEmailLink({
    linkRequestId: ctx.requestId,
    pending: await getLinkRequest(),
    signedInUserId,
    now: ctx.now ?? Date.now(),
  });
  if (!decision.ok) throw new LinkRefusedError(decision.reason);
}

/** A token-hash link. Rejects with LinkRefusedError before any network call when the guard says no. */
export async function verifyEmailLink(sb: SupabaseClient, tokenHash: string, type: EmailLinkType, ctx: LinkContext = {}): Promise<string> {
  await guard(ctx);
  const { data, error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) throw error;
  const id = data.user?.id ?? data.session?.user.id;
  if (!id) throw Object.assign(new Error('email_no_user'), { code: 'otp_expired' });
  await clearLinkRequest();
  return id;
}

/** A PKCE code link: only the install holding the code verifier can exchange it. */
export async function exchangeEmailLinkCode(sb: SupabaseClient, code: string, ctx: LinkContext = {}): Promise<string> {
  await guard(ctx);
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error) throw error;
  const id = data.user?.id ?? data.session?.user.id;
  if (!id) throw Object.assign(new Error('email_no_user'), { code: 'otp_expired' });
  await clearLinkRequest();
  return id;
}

/** Either link shape. */
export function openEmailLink(sb: SupabaseClient, link: AuthLink, ctx: Omit<LinkContext, 'requestId'> = {}): Promise<string> {
  const full = { ...ctx, requestId: link.requestId };
  if (link.code) return exchangeEmailLinkCode(sb, link.code, full);
  if (link.tokenHash) return verifyEmailLink(sb, link.tokenHash, link.type, full);
  return Promise.reject(new LinkRefusedError('not_requested'));
}
