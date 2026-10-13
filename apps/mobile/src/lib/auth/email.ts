/**
 * Email sign-in: one message with a link and a code (PRD A-REQ-018, TDD 04
 * 3.1.3). Supabase sends it through Resend SMTP from the brand domain
 * (docs/ops/AUTH_SETUP.md sections 4 and 6 hold the template).
 *
 * - The link is https://earlyletters.com/auth/callback#token_hash=...; the
 *   website page never verifies on load, so mail scanners cannot use it up
 *   (A-REQ-023). The app opens it with PKCE (verifyEmailLinkPkce below): only
 *   the phone that asked for the email holds the code verifier (security
 *   review H1, email-link.logic.ts). It is never verified with
 *   verifyOtp({ token_hash }), which would accept a link from anyone.
 * - The code works anywhere: typed here, or on another phone. Either way the
 *   person confirms the account before any letters join it.
 * - shouldCreateUser stays true: "new" and "returning" look the same, so the
 *   response never reveals whether an address has an account.
 * - Code length follows the project setting: 8 (security review M4; set the
 *   dashboard and EXPO_PUBLIC_EMAIL_OTP_LENGTH together, AUTH_SETUP 4.4).
 *   The code screen also accepts any 6 to 10 digit code with a Continue tap,
 *   so a dashboard that still says 6 keeps working (code-length.logic.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
import { brand } from '@scribe/brand';
import { readSupabaseEnv } from '../supabase/env';
import { emailCodeLength } from './code-length.logic';
import { parseVerifyRedirect, verifyUrl } from './email-link.logic';
import { authCallbackUrl, type EmailLinkType } from './links.logic';

export const EMAIL_CODE_LENGTH = emailCodeLength(process.env.EXPO_PUBLIC_EMAIL_OTP_LENGTH);

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

const fail = (code: string) => Object.assign(new Error(code), { code });

/**
 * Opens an email link with PKCE. GET /auth/v1/verify (redirects not followed:
 * expo/fetch honours `redirect: 'manual'` and hands back the 303 with its
 * Location) returns an auth code for the flow this link belongs to; the code
 * is exchanged with the verifier this phone stored when it asked for the
 * email. A link asked for elsewhere fails at the exchange
 * (`pkce_code_verifier_not_found` or `bad_code_verifier`), and an answer with
 * tokens in it is refused. Resolves with the user id.
 */
export async function verifyEmailLinkPkce(sb: SupabaseClient, tokenHash: string, type: EmailLinkType): Promise<string> {
  const env = readSupabaseEnv();
  if (!env) throw fail('provider_disabled');
  const res = await expoFetch(verifyUrl(env.url, tokenHash, type, authCallbackUrl(brand.web.origin)), {
    method: 'GET',
    redirect: 'manual',
    headers: { apikey: env.key },
  });
  const outcome = parseVerifyRedirect(res.headers.get('location'));
  if (outcome.kind === 'refused') throw fail('pkce_code_verifier_not_found');
  if (outcome.kind === 'error') throw fail(outcome.error === 'expired' ? 'otp_expired' : 'bad_oauth_callback');
  const { data, error } = await sb.auth.exchangeCodeForSession(outcome.code);
  if (error) throw error;
  const id = data.user?.id ?? data.session?.user.id;
  if (!id) throw fail('otp_expired');
  return id;
}
