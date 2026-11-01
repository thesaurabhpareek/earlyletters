# Supabase Auth email templates

Generated files. Do not edit the HTML by hand: change the copy in
`packages/content/src/emails/auth.en.ts` or the components in `packages/emails`,
then regenerate:

```bash
npx tsx packages/emails/scripts/export-supabase.ts              # production: token-hash links, "15 minutes"
npx tsx packages/emails/scripts/export-supabase.ts --expires="1 hour"   # only if otp_expiry is 3600
```

The script renders each React Email template with its `{placeholders}` left
literal, swaps them for Supabase Go template variables, and fails if any
placeholder has no Supabase value. Sending setup (custom SMTP through Resend,
OTP expiry, secure email change) is L3's runbook: `supabase/auth-email.md`.

## What is here

| File | Supabase type | Dashboard name | Our email id | Notes |
|---|---|---|---|---|
| `confirmation.html` | `[auth.email.template.confirmation]` | Confirm sign up | `verify-email` | Link plus code (D-044) |
| `magic_link.html` | `[auth.email.template.magic_link]` | Magic link | `sign-in-link` | Link plus code (D-044). Users only ever see "sign-in link" |
| `email_change.html` | `[auth.email.template.email_change]` | Change email address | `email-changed-new-address` | `.Email` is the current address, `.NewEmail` the new one |
| `reauthentication.html` | `[auth.email.template.reauthentication]` | Reauthentication | `reauthenticate-code` | Code only; copy is specific to account deletion |
| `identity_linked.html` | `[auth.email.notification.identity_linked]` | Sign-in method linked | `google-account-linked` if `.Provider` is `google`, else `apple-account-linked` | Go `{{ if }}` in both subject and body |
| `email_changed.html` | `[auth.email.notification.email_changed]` | Email address changed | `email-changed-old-address` | `.OldEmail` previous, `.Email` new |
| `config.toml.snippet` | | | | Source for the template blocks in `supabase/config.toml` (already there; `supabase/tests/auth_config.test.mjs` fails if subjects or files drift). Its notification paths use `./supabase/templates/`; config.toml uses `./templates/` (see Loading them) |
| `management-api.json` | | | | Body for `PATCH /v1/projects/{ref}/config/auth` on the hosted project |

Not used: `invite` (family invites are our own link or code, D-002, CATALOG E-3),
`recovery` (no passwords), notifications `password_changed`, `phone_changed`,
`mfa_factor_enrolled`, `mfa_factor_unenrolled` (none exist at v1.0; left off).
`identity_unlinked` is on with Supabase's default text until C1 writes a
"sign-in method removed" email (L3's requirement).

Not sent by anything today (TPL-07, SIGN-05; 31 Oct 2026). There is no Edge
Function that sends auth email, and none is planned for build 2:

- `account-create-attempt` has no trigger. The app makes one passwordless call
  (`signInWithOtp` with `shouldCreateUser: true`), so a known address gets
  `magic_link` and a new one gets `confirmation`, with the same screen and
  response either way. There is no separate sign-up to detect.
- `sign-in-trouble` carries a live link and code. Only Supabase Auth can mint a
  token bound to the app's PKCE request: an admin-generated link is not PKCE,
  the app refuses it, and it replaces the token the app is waiting for. The one
  correct sender is the Send Email Hook (`supabase/auth-email.md` section 7),
  which v1.0 deliberately does not use, and even the hook cannot tell a
  "trouble" request from a resend. The app's "Send a new email" is the expired
  path today; it sends a fresh `magic_link`.
- `welcome` and `new-device-sign-in` are 1.0 (not launch-blocking) and have no
  sender either.

Supabase Auth mail goes out through custom SMTP, which takes HTML only: these
templates use the text wordmark (no inline logo, no attachments) and carry no
plain-text part unless Supabase's mailer adds one (UNVERIFIED, TPL-10). Only
email sent by our own functions through the Resend API can carry the inline
logo (`renderForResend`).

`email_change.html` links carry `type=email_change`, which the app does not
accept yet (TPL-04, SIGN-10). Harmless while the app has no change-email screen;
the app must accept that type before one ships.

## Variables

Verified on 3 Oct 2026 against
[Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) and
[Customizing email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates).

| Our placeholder | Go variable | Where |
|---|---|---|
| `{signInUrl}`, `{verifyUrl}`, `{confirmUrl}` | `{{ .SiteURL }}/auth/callback#token_hash={{ .TokenHash }}&type=email` (`type=email_change` for change email) | Link templates |
| `{code}` | `{{ .Token }}` (6 digits) | Link templates, reauthentication |
| `{email}` | `{{ .Email }}` | All |
| `{oldEmail}`, `{newEmail}` | `{{ .Email }}`, `{{ .NewEmail }}` in `email_change`; `{{ .OldEmail }}`, `{{ .Email }}` in `email_changed` | |
| `{appUrl}` | `{{ .SiteURL }}` | (not used by the current Supabase set) |
| `{expiresIn}` | fixed text, default "15 minutes" | Must equal `otp_expiry` (L3: 900 s) |

Also available, deliberately unused: `{{ .ConfirmationURL }}` (Supabase's
`/auth/v1/verify` link; verifies on a plain GET, so mail scanners such as
Microsoft Safe Links use it up; `--link=confirmation-url` exists for local
testing only), `{{ .RedirectTo }}`, `{{ .Data }}` (user metadata is
user-controlled text; L3 forbids it), `{{ .Provider }}` (used only in the
`identity_linked` condition), `{{ .FactorType }}`, `{{ .Phone }}`, `{{ .OldPhone }}`.

The link puts the token hash after `#`, so it never reaches a server or log.
The app's universal link reads the fragment and completes the PKCE sign-in
(ADR 0023; `apps/mobile/src/lib/auth/email.ts`). The website page at
`/auth/callback` verifies nothing and tells the person to type the code.

## Loading them

Local (CLI): `supabase/config.toml` loads every template and notification.
Template paths are relative to the repo root (`./supabase/templates/...`), as
in the Supabase docs example; notification paths are relative to `supabase/`
(`./templates/...`) in the CLI's Go loader (checked at tag v2.119.0). The
v2.119.0 binary accepts both forms for notifications, so config.toml uses the
one that works in both.

Hosted project: either paste each HTML file and subject into Authentication >
Emails in the dashboard, or send `management-api.json` with
`PATCH https://api.supabase.com/v1/projects/{ref}/config/auth` (field names
`mailer_subjects_<type>`, `mailer_templates_<type>_content`,
`mailer_notifications_<type>_enabled`, `mailer_subjects_<type>_notification`,
`mailer_templates_<type>_notification_content`, as listed in the Supabase docs
above). Note: since June 2026 free-plan projects on Supabase's default mailer
cannot edit templates; custom SMTP lifts that (third-party report, UNVERIFIED on
supabase.com). We use custom SMTP anyway.

## Known gaps

- **Secure email change** (L3 turns it on) sends `email_change` to both
  addresses. The copy ("Is this your new address?") reads right at the new
  address only. Whether a template variable tells the two sends apart is
  UNVERIFIED; C1 may need wording that works at both.
- **identity_linked for other providers.** Any provider that is not `google`
  gets the Apple copy. If Supabase sends this notice when an `email` identity
  is linked (for example automatic linking after an Apple user signs in by
  email), the text would be wrong. UNVERIFIED; a generic
  `sign-in-method-linked` copy from C1 would close it.
- **Subjects** support Go templates (Supabase's own reauthentication example
  uses `{{ .Token }}`); ours only use the `identity_linked` condition.
- **Plain text part**: Supabase takes HTML only. Whether its mailer adds a text
  alternative is UNVERIFIED (L3 checks a received message).
- **Apple private relay**: mail to `@privaterelay.appleid.com` only arrives if
  `earlyletters.com` and the Resend return-path domain are registered with
  Apple (CATALOG section 11).
