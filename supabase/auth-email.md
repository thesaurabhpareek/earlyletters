# Supabase Auth email through Resend: configuration runbook

Owner: founder (does every dashboard and DNS step). Written by L3 (infosec), 3 Oct 2026, branch `feat/email-brand-library`.
Nothing here has been applied. Threat model and the reasons behind each value: `docs/emails/SECURITY.md`.
Rule from D-041: unattended agent runs do not touch `supabase/` or Auth settings; a person applies this.

Sources opened on 3 Oct 2026 (primary): Supabase docs `auth/auth-smtp`, `auth/auth-hooks`, `auth/auth-hooks/send-email-hook`, `auth/auth-email-templates`, `auth/auth-email-passwordless`, `auth/rate-limits`, `auth/redirect-urls`, `auth/social-login/auth-apple`, `auth/jwt-fields`, `local-development/cli/config`; Resend docs `send-with-smtp`, `send-with-supabase-smtp`, `create-an-api-key`, `dashboard/domains/*`, `knowledge-base/sending-apple-private-relay`; Apple Developer help "Configure private email relay service", Apple `revoke-tokens` and TN3194. The live Resend domain records were read from the Resend API (read-only) and live DNS through dns.google on 3 Oct 2026.

---

## 1. Decision: custom SMTP at v1.0, Send Email Hook later

| | Custom SMTP (Resend SMTP) | Send Email Hook (Edge Function calling Resend API) |
|---|---|---|
| Moving parts in the sign-in path | Supabase Auth to `smtp.resend.com` | Supabase Auth to our Edge Function to Resend API. One more service that must be up for anyone to sign in |
| Time budget | Supabase's SMTP client | Whole hook call, retries included, must finish in 5 s ("We have a time budget of 5s for the entire webhook invocation", Supabase `auth-hooks`) |
| Who holds the one-time token | Supabase only | Our function receives `token` and `token_hash` in the payload; any log line or error report that echoes the payload leaks a live credential |
| Templates | Go templates exported by D2 from our React Email sources (`packages/emails/src/templates/supabase.ts`), loaded through `config.toml` `content_path` or pasted in the dashboard | React Email rendered at send time; full control (plain-text part, headers, per-locale copy) |
| Link we control | Yes: `{{ .TokenHash }}` lets the template build our own scanner-safe link | Yes |
| Security notices (email changed, sign-in method linked) | Native Supabase notification templates | Same, routed through the hook (`email_changed_notification`, `identity_linked_notification` action types) |
| Secret | One Resend API key in the Supabase SMTP password field | Resend API key plus the hook signing secret (`v1,whsec_...`) in Edge Function secrets, plus signature verification code |
| Code to maintain and test | None | A security-critical function, including the reversed `token_hash` / `token_hash_new` pairing for email change |

**Recommendation: custom SMTP for v1.0.** Reasons, in order: (1) fewer things that can break sign-in for a solo founder; (2) the one-time token never passes through code we wrote, so it cannot leak through our logs; (3) everything the security design needs (our own link built from `{{ .TokenHash }}`, the code `{{ .Token }}`, no tracking, native security notices) is available with SMTP. Move to the hook when we need what SMTP cannot do: Hindi or other per-locale templates, a plain-text alternative part (UNVERIFIED whether Supabase's mailer adds one; check a received message's MIME parts in step 6), or headers such as `Resend-Idempotency-Key`. Section 7 has the hook rules for that day.

Both paths send through the same Resend domain, so DNS, DMARC and the Apple relay registration below apply either way.

---

## 2. Resend: key and domain settings

Current state (read from the Resend API, 3 Oct 2026): `earlyletters.com` verified, region us-east-1, open tracking **off**, click tracking **off**, receiving on. `earlyletters.app` added, status `not_started` (no DNS). The account has one API key, named "HelloLumira for claude code", which predates this product.

1. **Create a dedicated key.** Resend dashboard > API Keys > Create API Key.
   - Name: `early-letters-supabase-auth-smtp`.
   - Permission: **Sending access** (not Full access).
   - Domain: **earlyletters.com** only (Resend: "If you selected Sending access, you can further choose the domain you want to restrict access to").
   - Copy it once, straight into step 3. Do not paste it into chat, a terminal history, a note app, `.env` in the repo, or this file.
2. **Do not use the existing "HelloLumira for claude code" key for Early Letters.** It is shared with another product and with an AI tool connection. If it is Full access, consider rotating it to Sending access for its own product. A leaked full-access key can delete domains, read every sent email, and change tracking.
3. **Keep tracking off** on `earlyletters.com` (Domains > earlyletters.com > Configuration). It is off today. The brief forbids open and click tracking; click tracking would also rewrite our sign-in links through a tracking host, which breaks universal links and puts the token hash in a third-party URL.
4. **Enforced TLS:** recommended on. Domains > earlyletters.com > Configuration > Enforced TLS. Effect: Resend refuses to deliver to a receiving server that cannot do TLS instead of falling back to plaintext ("Opportunistic TLS" is the default, Resend `dashboard/domains/tls`). Sign-in links are credentials, so failing closed is right. Watch the Resend logs for failures in the first weeks.
5. **Team access:** Resend account owner uses a passkey or hardware key; no other members at v1.0.

---

## 3. Supabase dashboard settings (production project `early-letters`)

Apply in the dashboard (Authentication section). The `config.toml` block in section 4 is the same thing for local development and for the record.

### 3.1 SMTP (Authentication > Emails > SMTP Settings)
| Field | Value |
|---|---|
| Enable custom SMTP | On |
| Sender email | `hello@earlyletters.com` (brief: no `no-reply@`) |
| Sender name | `Early Letters` |
| Host | `smtp.resend.com` |
| Port | `465` (implicit TLS; Resend lists 465 and 2465 as SMTPS) |
| Username | `resend` |
| Password | the key from step 2.1 |
| Minimum interval between emails per user | 60 seconds (Supabase default; matches PRD A F4 "Send a new email after 60 s") |

### 3.2 Email provider (Authentication > Sign In / Providers > Email)
| Setting | Value | Why |
|---|---|---|
| Enable email provider | On | Email link plus code (D-044) |
| Confirm email | On | No account is usable until the inbox is proven |
| Secure email change | **On** | Both the old and the new address must confirm (Supabase: "users confirm email changes on both old and new addresses") |
| Secure password change | n/a | No passwords |
| Email OTP length | **6** | D-044 and the brief. Supabase allows 6 to 10; see SECURITY.md 3.4 for the 8-digit option |
| Email OTP expiration | **900** seconds | 15 minutes. The same value governs the link (Supabase: "The Email OTP Expiration setting also governs the validity of Magic Links and other email links"). Copy `{expiresIn}` must read "15 minutes". If the founder keeps PRD A's 1 hour, set 3600 and `{expiresIn}` "1 hour"; SECURITY.md 3.4 has the risk numbers |

### 3.3 Other providers and user settings
| Setting | Value |
|---|---|
| Apple provider | On. Client IDs: the iOS bundle id only (`<reversed domain>.scribe` from `packages/brand`, real value after BL-100). No Services ID and no secret key at v1.0: native-only sign-in does not need the 6-monthly secret rotation (Supabase Apple guide: "Native-only implementations don't require secret key rotation") |
| Google provider | Off until v1.1 (D-044) |
| Anonymous sign-ins | **Off** at v1.0. TDD 04 turns them on for the web contribution page, which moved to v1.1 (D-002) |
| Allow new users to sign up | On (needed for `signInWithOtp` with `shouldCreateUser: true` and for first Apple sign-in) |
| Manual linking | Off until "Ways to sign in" (A-REQ-019, P1) ships |

### 3.4 URL configuration (Authentication > URL Configuration)
| Field | Value |
|---|---|
| Site URL | `https://earlyletters.com` |
| Redirect URLs | `https://earlyletters.com/auth/callback` (exact, no wildcard) |

Nothing at v1.0 uses a redirect back into the app: email sign-in verifies in the app with `verifyOtp`, and Apple uses the native sheet plus `signInWithIdToken`. Do not add `scribe://**` or `https://earlyletters.com/**`. When Android Apple OAuth arrives, add one exact callback such as `https://earlyletters.com/auth/callback` (a verified App Link), not the custom scheme: any app can claim `scribe://`.

### 3.5 Sessions (Authentication > Sessions, and JWT settings)
| Setting | Value |
|---|---|
| Access token (JWT) expiry | 900 seconds (TDD 04 3.1) |
| Refresh token rotation | On (default) |
| Refresh token reuse interval | 10 seconds (default) |

### 3.6 Rate limits (Authentication > Rate Limits)
Supabase defaults (Supabase `auth/rate-limits`, opened 3 Oct 2026): sign-in and sign-up requests 30 per 5 minutes per IP; verification requests 30 per 5 minutes per IP; token refresh 150 per 5 minutes per IP; one OTP or link per user per 60 s. With custom SMTP the project-wide email cap starts at 30 per hour.

| Limit | Value | Note |
|---|---|---|
| Emails sent per hour (project) | 100 for beta; raise before any announcement | A cap protects the Resend quota and stops a bombing run, but an attacker who hits it blocks email sign-in for everyone for the hour. Set an alert (SECURITY.md section 7). Check the Resend plan's daily quota first (UNVERIFIED for the founder's plan) |
| Sign-ups and sign-ins per 5 min per IP | 30 (default) | Lower would hurt families behind carrier NAT |
| Token verifications per 5 min per IP | 30 (default) | Lowering does not stop a distributed guesser; expiry and detection do (SECURITY.md 3.4) |
| Token refresh per 5 min per IP | 150 (default) | |
| Anonymous sign-ins per hour per IP | n/a (anonymous off) | |

### 3.7 CAPTCHA (Authentication > Attack Protection)
Supabase supports hCaptcha and Cloudflare Turnstile. It needs a `captchaToken` from the client on `signInWithOtp`, which in a native iOS app means a web view widget. **Founder decision (SECURITY.md open question Q3):** recommended before the public TestFlight link (D-045 C2), not required for the 15 to 25 family C1 cohort. Adding it later is a dashboard switch plus an app release. If turned on, the provider joins `docs/legal/subprocessors.md`.

### 3.8 Templates and notifications (Authentication > Emails)
Load D2's exported Go templates (`supabase/templates/`, generated from `packages/emails`). Requirements L3 places on them:

- Every link-bearing template builds **our** link, never `{{ .ConfirmationURL }}`:
  `{{ .SiteURL }}/auth/callback#token_hash={{ .TokenHash }}&type=email`
  (email change: `type=email_change`). The token hash sits after `#`, so it is never sent to Vercel, never in server logs, and a mail scanner that fetches the page cannot use it (SECURITY.md 3.1). `{{ .ConfirmationURL }}` points at Supabase's `/auth/v1/verify`, which verifies on a plain GET; Supabase's own docs say scanners such as Microsoft Safe Links consume it ("Email prefetching").
  **Change needed in D2's lane:** `packages/emails/src/templates/supabase.ts` `linkFor` builds `?token_hash=...` (query string). That puts an L4 token in a URL query, which LEGAL-REQ-014 and DATA_CLASSIFICATION section 2 forbid. Use `#` instead, and make `token-hash` the only mode used for production export.
- Every sign-in template also shows `{{ .Token }}` (the 6-digit code) for the other-device case.
- No tracking pixels and no images at all: the auth templates use the text wordmark, because SMTP cannot carry the inline logo and nothing in an email loads from a server (docs/brand/EMAIL_IDENTITY.md 4.6); no URL shorteners, no `{{ .Data }}` fields (user metadata is user-controlled text; rendering it in our email is an injection channel).
- Templates to load: Confirm sign up (`verify-email`), Magic link (`sign-in-link`), Change email address (`email-changed-new-address`), Reauthentication (optional, see SECURITY.md 3.7).
- Security notifications to turn **on**: Email address changed, Sign-in method linked, Sign-in method removed (needs copy from C1; until then keep Supabase's default text rather than leaving it off). Leave password, phone and MFA notifications off (none of those exist at v1.0).

---

## 4. `supabase/config.toml` block (local development and record)

The repo has no `supabase/config.toml` yet. When one is added (outside this lane), the auth part should read as below. Locally, mail goes to the CLI's built-in mail catcher, never to Resend: leave `[auth.email.smtp]` disabled in the committed file so no developer machine needs the key.

```toml
[auth]
site_url = "https://earlyletters.com"
additional_redirect_urls = ["https://earlyletters.com/auth/callback"]
jwt_expiry = 900
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false
enable_manual_linking = false

[auth.rate_limit]
email_sent = 100
sign_in_sign_ups = 30
token_verifications = 30
token_refresh = 150

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
max_frequency = "1m"
otp_length = 6
otp_expiry = 900

[auth.email.template.confirmation]
subject = "Confirm your email"   # D2 and C1 own the real subject; placeholder here
content_path = "./supabase/templates/verify-email.html"

[auth.email.template.magic_link]
subject = "Your sign-in link"    # placeholder; C1 owns copy
content_path = "./supabase/templates/sign-in-link.html"

[auth.email.template.email_change]
subject = "Confirm your new email"  # placeholder
content_path = "./supabase/templates/email-changed-new-address.html"

[auth.email.notification.email_changed]
enabled = true
content_path = "./supabase/templates/email-changed-old-address.html"

[auth.email.notification.identity_linked]
enabled = true
content_path = "./supabase/templates/apple-account-linked.html"

[auth.email.notification.identity_unlinked]
enabled = true

# Production only, set in the dashboard, never committed with a value:
# [auth.email.smtp]
# enabled = true
# host = "smtp.resend.com"
# port = 465
# user = "resend"
# pass = "env(RESEND_SMTP_API_KEY)"
# admin_email = "hello@earlyletters.com"
# sender_name = "Early Letters"

[auth.external.apple]
enabled = true
client_id = "<bundle id from packages/brand bundleId()>"
secret = ""   # native-only: no Services ID secret at v1.0
```

Key names were checked against Supabase's CLI config reference on 3 Oct 2026 (`otp_length` "Must be between 6 and 10", `double_confirm_changes`, `max_frequency`, `rate_limit.*`, `email.notification.<type>`). `enable_anonymous_sign_ins`, `enable_manual_linking` and `enable_confirmations` are UNVERIFIED key spellings for the current CLI; check with `supabase init` output before committing. Template subjects come from C1 copy; the placeholders above are not final copy.

---

## 5. Secret handling

| Secret | Lives in | Never in | Rotation |
|---|---|---|---|
| Resend sending key (`early-letters-supabase-auth-smtp`) | Supabase SMTP password field (production project only) | Repo, `.env` files, app bundle, chat, Vercel | Every 6 months and on any suspicion: create a new key, paste it, send a test sign-in, delete the old key in Resend |
| Apple Sign in with Apple key (`.p8`, for the `apple-token` Edge Function in TDD 04) | Edge Function secret `APPLE_P8` plus an offline encrypted backup | Repo, laptops after upload | Named owner: founder (A-NFR-009). The function signs a fresh short-lived client-secret JWT per call, so there is no 6-month expiry to chase |
| Send Email Hook secret (only if section 7 is adopted) | Edge Function secret `SEND_EMAIL_HOOK_SECRETS` | Repo | On adoption and on suspicion; Supabase plans multiple secrets for rotation |

The repo's secret scanner (LEGAL-REQ-026) should match the Resend key prefix `re_`. UNVERIFIED that the current scanner config includes it; add the pattern if not.

---

## 6. Apple private relay ("Hide My Email") registration

Without this, every email to an `@privaterelay.appleid.com` address bounces, so Apple users who hid their email never get a security notice or a sign-in code.

1. developer.apple.com > Certificates, Identifiers & Profiles > Services > **Sign in with Apple for Email Communication** > Configure.
2. Email Sources > (+) > domains: `earlyletters.com, send.earlyletters.com` > Next > Register.
   - `send.earlyletters.com` is Resend's Return-Path (envelope sender) subdomain; Resend's guide says to register both. Apple: "the registered domain and envelope sender domain must match exactly to pass the private relay service SPF check."
   - Apple's DKIM rule: the DKIM `d=` domain is matched against the From domain. Resend signs with `d=earlyletters.com` (record `resend._domainkey.earlyletters.com`), matching `hello@earlyletters.com`.
3. Email Sources > (+) > addresses: `hello@earlyletters.com` > Register.
4. Confirm the table shows the SPF check passed for each source. (`send.earlyletters.com` has `v=spf1 include:amazonses.com ~all`, verified 3 Oct 2026.)
5. Keep "private email relay notifications" on, so Apple tells the Account Holder about failed relay deliveries.
6. Limit: an individual account can register up to 32 email sources (Apple help page). If a marketing subdomain (`news.earlyletters.com`) ever mails Apple users, register it then.
7. Leave the Sign in with Apple **Server-to-Server Notification Endpoint** blank at v1.0 (Supabase does not consume these). If an Edge Function later handles `consent-revoked` and `account-delete` events, register it then (SECURITY.md 4.3).

---

## 7. If we move to the Send Email Hook (v1.1 or later)

1. Authentication > Hooks > Send Email > HTTPS, URL of an Edge Function `send-email`; generate the secret there.
2. `supabase secrets set SEND_EMAIL_HOOK_SECRETS='v1,whsec_...' RESEND_API_KEY='re_...'` from a shell with history off; deploy with `--no-verify-jwt` (Supabase: payload authenticity comes from the Standard Webhooks signature, not a JWT).
3. In the function: verify the signature with the `standardwebhooks` library before reading anything; reject anything older than 5 minutes; never log the request body, `token`, `token_hash`, `token_new`, `token_hash_new` or the recipient address (LEGAL-REQ-014); return 200 with `{}` on success, and a 429 or 503 with `retry-after` only for a retryable Resend error (Supabase retries within the 5 s budget).
4. Email change with Secure email change on: send `token` with `token_hash_new` to the **current** address and `token_new` with `token_hash` to the **new** address. Supabase: "Do not assume the `_new` suffix refers to the new email address." Write a unit test with both pairs before shipping.
5. Use `Resend-Idempotency-Key` derived from a hash of the user id and token hash so a hook retry does not send two emails.
6. The SMTP settings can stay filled in as a fallback; Supabase uses the hook when it is enabled ("Auth Hook handles email sending (SMTP not used)").

---

## 8. Acceptance checks (staging first, then production)

Run against the staging project (D-041) with a test inbox per provider: Gmail, iCloud Mail, Outlook.com, and one Apple relay address from a Sign in with Apple test account.

1. **Headers.** Open the raw message: `dkim=pass header.d=earlyletters.com`, `spf=pass smtp.mailfrom=...@send.earlyletters.com`, `dmarc=pass header.from=earlyletters.com`; TLS used on the last hop.
2. **No tracking.** No `<img>` in Supabase templates (text wordmark; the Resend-sent emails attach the logo inline as `cid:`); every `href` starts with `https://earlyletters.com/` (or `mailto:hello@earlyletters.com`); no redirect hosts.
3. **Scanner simulation.** `curl -sS "https://earlyletters.com/auth/callback#token_hash=<from the email>&type=email"` (curl does not send the fragment), and also open the link in a desktop browser. Then type the 6-digit code in the app: it must still work. Nothing on the page may call Supabase.
4. **Single use.** After a successful sign-in, the same code and the same link fail with the expired copy.
5. **Expiry.** A code older than the configured expiry fails.
6. **MIME.** Note whether a `text/plain` part exists (decides the section 1 UNVERIFIED point).
7. **Enumeration.** The app screen and the API response for `signInWithOtp` are the same for a known and an unknown address (status code and body).
8. **Apple relay.** A code reaches the relay address and lands in the real inbox.
9. **Secure email change.** Changing the email sends one email to each address; the change completes only after both confirm; the old address then gets the "email address changed" notice.
10. **Rate limit.** A second request within 60 s is refused, and the app shows `auth.email.resendWait`.

Record results (no tokens, no addresses) in `docs/legal/evidence/` per release.
