/**
 * Which of our emails Supabase Auth sends, and how our `{placeholders}` map to
 * Supabase's Go template variables.
 *
 * Verified 2026-10-03 against https://supabase.com/docs/guides/auth/auth-email-templates
 * and https://supabase.com/docs/guides/local-development/customizing-email-templates:
 * template types confirmation, invite, magic_link, email_change, recovery,
 * reauthentication; notifications password_changed, email_changed,
 * phone_changed, identity_linked, identity_unlinked, mfa_factor_enrolled,
 * mfa_factor_unenrolled. Variables: .ConfirmationURL, .Token, .TokenHash,
 * .SiteURL, .RedirectTo, .Email, .NewEmail (email_change only), .OldEmail
 * (email_changed notification only), .Data, .Provider (identity notifications).
 *
 * D-044: email sign-in is a link plus a 6-digit code in the same email, so
 * every link-bearing template carries both .ConfirmationURL and .Token.
 */

/** How the email button URL is built. */
export type LinkMode =
  /**
   * Production (L3, supabase/auth-email.md 3.8): our own universal link with the
   * token hash in the URL fragment, `/auth/confirm#token_hash=...&type=...`. The
   * fragment never reaches a server log, and a mail scanner that fetches the page
   * cannot use it; the app (or the page) calls verifyOtp({ token_hash, type }).
   * Needs the /auth/confirm route and universal link (not built yet).
   */
  | 'token-hash'
  /**
   * Supabase's own /auth/v1/verify URL. Local testing only: it verifies on a
   * plain GET, so link scanners (Microsoft Safe Links) use up the token, and the
   * token sits in a query string.
   */
  | 'confirmation-url';

export type SupabaseKind = 'template' | 'notification';

export type SupabaseMapping = {
  kind: SupabaseKind;
  /** config.toml key: [auth.email.template.<type>] or [auth.email.notification.<type>] */
  type: string;
  /** Our email id (copy id and template file name). */
  id: string;
  /** Other emails picked by a Go template condition, checked in order before `id`. */
  variants?: Array<{ when: string; id: string }>;
  /** verifyOtp type for token-hash links. */
  otpType?: 'email' | 'email_change';
  /** Placeholder to Go expression, on top of the shared ones. */
  vars?: Record<string, string>;
  /** Supabase dashboard name, for the README. */
  dashboardName: string;
};

export const GO = {
  confirmationUrl: '{{ .ConfirmationURL }}',
  token: '{{ .Token }}',
  tokenHash: '{{ .TokenHash }}',
  siteUrl: '{{ .SiteURL }}',
  email: '{{ .Email }}',
  newEmail: '{{ .NewEmail }}',
  oldEmail: '{{ .OldEmail }}',
} as const;

export function linkFor(mode: LinkMode, otpType: 'email' | 'email_change'): string {
  return mode === 'confirmation-url'
    ? GO.confirmationUrl
    : `${GO.siteUrl}/auth/confirm#token_hash=${GO.tokenHash}&type=${otpType}`;
}

export const supabaseMappings: SupabaseMapping[] = [
  {
    kind: 'template',
    type: 'confirmation',
    dashboardName: 'Confirm sign up',
    id: 'verify-email',
    otpType: 'email',
  },
  {
    kind: 'template',
    type: 'magic_link',
    dashboardName: 'Magic link',
    id: 'sign-in-link',
    otpType: 'email',
  },
  {
    kind: 'template',
    type: 'email_change',
    dashboardName: 'Change email address',
    id: 'email-changed-new-address',
    otpType: 'email_change',
    // In the change-email template .Email is the current (old) address.
    vars: { oldEmail: GO.email, newEmail: GO.newEmail },
  },
  {
    kind: 'template',
    type: 'reauthentication',
    dashboardName: 'Reauthentication',
    id: 'reauthenticate-code',
  },
  {
    kind: 'notification',
    type: 'identity_linked',
    dashboardName: 'Sign-in method linked',
    id: 'apple-account-linked',
    // Google arrives in v1.1 (D-044); the branch is ready so nothing changes then.
    variants: [{ when: 'eq .Provider "google"', id: 'google-account-linked' }],
  },
  {
    kind: 'notification',
    type: 'email_changed',
    dashboardName: 'Email address changed',
    id: 'email-changed-old-address',
    // In the email_changed notification .OldEmail is the previous address and .Email the new one.
    vars: { oldEmail: GO.oldEmail, newEmail: GO.email },
  },
];

/** Supabase types we deliberately leave alone, with the reason (README). */
export const supabaseUnused: Array<{ kind: SupabaseKind; type: string; why: string; enabledWithDefault?: boolean }> = [
  { kind: 'template', type: 'invite', why: 'Family invites are our own link or code (D-002), not Supabase admin invites.' },
  { kind: 'template', type: 'recovery', why: 'There are no passwords, so reset password is never sent.' },
  { kind: 'notification', type: 'password_changed', why: 'No passwords.' },
  { kind: 'notification', type: 'phone_changed', why: 'No phone sign-in.' },
  { kind: 'notification', type: 'mfa_factor_enrolled', why: 'No MFA at v1.0.' },
  { kind: 'notification', type: 'mfa_factor_unenrolled', why: 'No MFA at v1.0.' },
  {
    kind: 'notification',
    type: 'identity_unlinked',
    why: 'No copy yet (needs a sign-in-method-removed email from C1). L3 wants it on with Supabase default text until then.',
    enabledWithDefault: true,
  },
];

/**
 * Placeholder values every Supabase export shares. `{expiresIn}` has no Supabase
 * variable: it is fixed text that must match the project's email OTP expiry
 * (Auth > Providers > Email > Email OTP Expiration; L3 sets 900 seconds, so
 * "15 minutes"; Supabase's default is 3600).
 */
export function sharedVars(mode: LinkMode, otpType: 'email' | 'email_change' | undefined, expiresIn: string) {
  const link = otpType ? linkFor(mode, otpType) : GO.confirmationUrl;
  return {
    email: GO.email,
    code: GO.token,
    signInUrl: link,
    verifyUrl: link,
    confirmUrl: link,
    appUrl: GO.siteUrl,
    expiresIn,
  } as Record<string, string>;
}
