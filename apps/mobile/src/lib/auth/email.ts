/**
 * Email sign-in: one message with a link and a code (PRD A-REQ-018, TDD 04
 * 3.1.3). Supabase sends it through Resend SMTP from the brand domain
 * (docs/ops/AUTH_SETUP.md sections 4 and 6 hold the template).
 *
 * - The link is https://earlyletters.com/auth/callback#token_hash=...; the
 *   website page never verifies on load, so mail scanners cannot use it up
 *   (A-REQ-023). The app opens it with PKCE (verifyEmailLinkPkce below): only
 *   the phone that asked for the email holds the code verifier (BL-347,
 *   security review H1, email-link.logic.ts, ADR 0023). It is never opened
 *   with verifyOtp({ token_hash }), which would accept a link from anyone.
 * - The code works anywhere: typed here, or on another phone. Either way the
 *   claim screen comes before any letters join the account.
 * - shouldCreateUser stays true: "new" and "returning" look the same, so the
 *   response never reveals whether an address has an account.
 * - Code length follows the project setting (6 by default; set 6 to 10 in
 *   the dashboard and EXPO_PUBLIC_EMAIL_OTP_LENGTH together). The 8-digit,
 *   15-minute rule (review M4) is its own work package.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
import { brand } from '@scribe/brand';
import { serverFeaturesEnabled } from '../capabilities';
import { readSupabaseEnv } from '../supabase/env';
import { parseVerifyRedirect, verifyTypesFor, verifyUrl } from './email-link.logic';
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

const fail = (code: string) => Object.assign(new Error(code), { code });

/** The part of fetch the link check uses; expo/fetch in the app (it honours `redirect: 'manual'` on iOS). */
export type ManualRedirectFetch = (url: string, init: { method: 'GET'; redirect: 'manual'; headers: Record<string, string> }) => Promise<{
  status: number;
  headers: { get(name: string): string | null };
}>;

const defaultFetch: ManualRedirectFetch = (url, init) => expoFetch(url, init);

/**
 * Opens an email link with PKCE. GET /auth/v1/verify, redirects not followed,
 * answers with a 303 whose Location carries an auth code for the flow this
 * link belongs to; the code is exchanged with the verifier this phone stored
 * when it asked for the email. A link asked for elsewhere fails at the
 * exchange (`pkce_code_verifier_not_found` or `bad_code_verifier`), and an
 * answer with tokens in it (implicit flow) is refused. A link that says
 * `type=email` is tried as a magic link, then as a signup (verifyTypesFor).
 * Resolves with the user id.
 */
export async function verifyEmailLinkPkce(
  sb: Pick<SupabaseClient, 'auth'>,
  tokenHash: string,
  type: EmailLinkType,
  fetchFn: ManualRedirectFetch = defaultFetch,
): Promise<string> {
  if (!serverFeaturesEnabled()) throw fail('provider_disabled');
  const env = readSupabaseEnv();
  if (!env) throw fail('provider_disabled');
  const redirectTo = authCallbackUrl(brand.web.origin);
  let last: 'expired' | 'unknown' = 'unknown';
  for (const t of verifyTypesFor(type)) {
    const res = await fetchFn(verifyUrl(env.url, tokenHash, t, redirectTo), { method: 'GET', redirect: 'manual', headers: { apikey: env.key } });
    if (res.status === 429) throw Object.assign(fail('over_request_rate_limit'), { status: 429 });
    const outcome = parseVerifyRedirect(res.headers.get('location'));
    if (outcome.kind === 'refused') throw fail('pkce_code_verifier_not_found');
    if (outcome.kind === 'error') {
      last = outcome.error;
      continue;
    }
    const { data, error } = await sb.auth.exchangeCodeForSession(outcome.code);
    if (error) throw error;
    const id = data.user?.id ?? data.session?.user.id;
    if (!id) throw fail('otp_expired');
    return id;
  }
  throw fail(last === 'expired' ? 'otp_expired' : 'bad_oauth_callback');
}
