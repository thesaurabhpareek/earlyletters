/**
 * Email sign-in: one message with a link and a code (PRD A-REQ-018, TDD 04
 * 3.1.3). Supabase sends it through Resend SMTP from the brand domain
 * (docs/ops/AUTH_SETUP.md sections 4 and 6 hold the template).
 *
 * - The link is https://earlyletters.com/auth/callback#token_hash=...; the
 *   app verifies it with verifyOtp({ token_hash, type }). The website page
 *   never verifies on load, so mail scanners cannot use it up (A-REQ-023).
 * - The code works anywhere: typed here, or on another phone.
 * - shouldCreateUser stays true: "new" and "returning" look the same, so the
 *   response never reveals whether an address has an account.
 * - Code length follows the project setting (6 by default; set 6 to 10 in
 *   the dashboard and EXPO_PUBLIC_EMAIL_OTP_LENGTH together).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { authCallbackUrl, type EmailLinkType } from './links.logic';

const parsed = Number(process.env.EXPO_PUBLIC_EMAIL_OTP_LENGTH);
export const EMAIL_CODE_LENGTH = Number.isInteger(parsed) && parsed >= 6 && parsed <= 10 ? parsed : 6;

/** Client wait before another email to the same address (A-REQ-025). */
export const RESEND_WAIT_MS = 60_000;

export async function sendEmailLink(sb: SupabaseClient, email: string): Promise<void> {
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true, emailRedirectTo: authCallbackUrl(brand.web.origin) },
  });
  if (error) throw error;
}

export async function verifyEmailCode(sb: SupabaseClient, email: string, code: string): Promise<string> {
  const { data, error } = await sb.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' });
  if (error) throw error;
  const id = data.user?.id ?? data.session?.user.id;
  if (!id) throw Object.assign(new Error('email_no_user'), { code: 'otp_expired' });
  return id;
}

export async function verifyEmailLink(sb: SupabaseClient, tokenHash: string, type: EmailLinkType): Promise<string> {
  const { data, error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) throw error;
  const id = data.user?.id ?? data.session?.user.id;
  if (!id) throw Object.assign(new Error('email_no_user'), { code: 'otp_expired' });
  return id;
}
