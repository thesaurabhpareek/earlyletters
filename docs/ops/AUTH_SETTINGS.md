# Hosted auth settings: the register of what the repo cannot see

Owner: `ops`. Opened 21 Nov 2026 for FP-17 (first-run design FS-26, `docs/tdd/new-scope/12-first-run-2.md` section 6). Steps to set things are in [AUTH_SETUP.md](AUTH_SETUP.md); dashboard field and Management API names are in `supabase/auth-email.md` section 4.1.

## How to read this page

- `supabase/config.toml` is the record of what the hosted projects must hold, and `supabase/tests/auth_config.test.mjs` pins it. CI never runs `supabase config push` (`config.toml:8-10`), and no test can see a hosted project. So the repo can drift from the dashboard without anything turning red. This register is the control.
- **[U] means unverified.** Every "Hosted now" cell below is [U]. No agent has read a hosted project, and nothing here states a hosted value. The only values written are what the repo holds, each with its file and line.
- **Only the founder reads hosted values** (the dashboard, or a Management API read with the founder's own token). `ops` writes the sheet, compares what the founder reads against the repo, and files the differences. No agent opens a dashboard, holds a token or sets a value.
- Never write a secret, key, token or URL with a token in this file. A value is a number, a switch or a public address only.
- Targets come from the card (`docs/product/prd/19-from-download-to-first-letter.md`, O-6, O-7, O-21) and the first-run design. A target is what we want; it is not what is set.

## 1. What the repo assumes

| # | Setting (dashboard name) | Repo value now | Code or test that depends on it | Target |
|---|---|---|---|---|
| 1 | Email OTP length (Sign In / Providers > Email) | 6 (`config.toml:72`) | App field accepts 6 to 10, falls back to 6: `apps/mobile/src/lib/auth/email.ts:28-29`. Pinned: `auth_config.test.mjs:74`. Templates show `{{ .Token }}` | Target code length 8 (O-6, FS-18); repo and hosted value stay 6; the dashboard flips the same day FP-8 ships, never before |
| 2 | Email OTP expiration (same page) | 900 s (`config.toml:75`) | Every template and the app say "15 minutes" (`packages/emails/scripts/export-supabase.ts`); pending note is longer on purpose: `apps/mobile/src/lib/auth/email-link.logic.ts:36` (3600 s). Pinned: `auth_config.test.mjs:75` | 900; the pending note drops to 900 s with O-6 (card section 17 gap) |
| 3 | Minimum interval between emails per address | `max_frequency = "1m"` (`config.toml:71`) | Client wait `RESEND_WAIT_MS = 60_000`: `email.ts:32`. Pinned: `auth_config.test.mjs:78` | 1 minute |
| 4 | Rate limit: token verifications per IP per 5 min (Rate Limits) | 30 (`config.toml:57`) | No code reads it; the app's wrong-code pause is in memory only: `apps/mobile/src/lib/auth/pending.ts:72`. Pinned: `auth_config.test.mjs:83` | 15 (O-6), with row 1 |
| 5 | Rate limit: emails per hour, whole project | `email_sent = 100` (`config.toml:55`) | `auth_config.test.mjs:83`. AUTH_SETUP 4.3 says Supabase starts a custom-SMTP project at 30 an hour and to raise it to about 100 | 100 now; raise at launch |
| 6 | Rate limit: sign-ups and sign-ins per IP per 5 min | 30 (`config.toml:56`) | `auth_config.test.mjs:83` | 30 |
| 7 | Rate limit: token refresh per IP per 5 min | 150 (`config.toml:58`) | `autoRefreshToken: true`: `apps/mobile/src/lib/supabase/client.ts:106`. `auth_config.test.mjs:83` | 150 |
| 8 | JWT expiry (Sessions / JWT settings) | 900 s (`config.toml:42`, key `jwt_expiry`) | App refreshes in the foreground (`client.ts:106`). `auth_config.test.mjs:87` | 900 |
| 9 | Refresh token rotation, reuse interval | on, 10 s (`config.toml:43-44`, keys `enable_refresh_token_rotation`, `refresh_token_reuse_interval`) | `auth_config.test.mjs:90` and `:92` (rotation and the 10 s) | on, 10 s |
| 10 | Session time-box and inactivity timeout | not in `config.toml` | A forced sign-out would break local-first use and NS-41-R15; AUTH_SETUP section 1 item 3 says leave both off | off |
| 11 | Allow anonymous sign-ins | false (`config.toml:47`) | The database refuses anonymous sessions (SQLSTATE SCANO). `auth_config.test.mjs:88` | off |
| 12 | Allow manual linking | false (`config.toml:48`) | `auth_config.test.mjs:89`; card O-21 list | off (AUTH_SETUP said on until this change) |
| 13 | Allow new users to sign up | true (`config.toml:45`, `:65`) | `shouldCreateUser: true`: `email.ts:36`. `auth_config.test.mjs:79` | on |
| 14 | Confirm email; secure email change | true; true (`config.toml:67-69`) | `auth_config.test.mjs:76-77` | on; on |
| 15 | Site URL and redirect allowlist (URL Configuration) | `https://earlyletters.com` and exactly `https://earlyletters.com/auth/callback`, no wildcard (`config.toml:33,40`) | The app sends only this redirect: `email.ts:37`, `links.logic.ts:24`. `auth_config.test.mjs:60-71` | exact, one entry |
| 16 | Custom SMTP through Resend (Emails > SMTP Settings) | none; `[auth.email.smtp]` is commented out locally (`config.toml:78`); `auth_config.test.mjs:94` | Sender `hello@earlyletters.com`, port 465: AUTH_SETUP 4.2. Without it Supabase's own sender caps and brands the mail | on, sender domain verified in Resend |
| 17 | Bot check on email send (Attack Protection, Cloudflare Turnstile) | not in `config.toml` | Nothing sends a `captchaToken` today (grep of `apps`, `packages`, `supabase`: no Turnstile code). With the check on, the server refuses a send without a token, so turning it on before FP-20 ships breaks every email sign-in | on before the public TestFlight link (O-7, CL-070), with FP-20; the Turnstile subprocessor row does not exist yet (`docs/legal/subprocessors.md` has only Cloudflare R2) and is owed by `legal` (FP-20 dependency) |
| 18 | Hook: before user created | not in `config.toml` | `compliance_gates.test.mjs` (PR #424) | on (O-4) |
| 19 | Apple provider client ids (every bundle id) | `enabled = false` locally (`config.toml:145`) | `com.earlyletters.scribe` and `.preview`, `.dev`: AUTH_SETUP 2.6 | on, ids listed |
| 20 | Password sign-in path | no key exists (`config.toml:61-62`) | The app never offers it; card O-21 | cannot be turned off; staging probe (OQ-F8, owner `security`) |
| 21 | Email templates (Confirm signup, Magic link, Email change, Reauthentication) | `supabase/templates/` via `config.toml:95-109` | Link `https://earlyletters.com/auth/callback#token_hash=...&type=email`; `auth_config.test.mjs:107` | loaded, same body in the first two |

Rows 1 to 19 follow the design's table (its 14 rows, the three added in round 2, and the rate-limit split into 4 to 7). Rows 20 and 21 are added here because a wrong value breaks sign-in or changes what a person receives.

## 2. What the founder reads (one sitting, staging first)

Copy this table into the PR that records the read, one line per row, never a secret. Until a row has a date and a name, it is **[U]**.

| # | Hosted now | Read by, on | Matches the repo value? | Way back if changed |
|---|---|---|---|---|
| 1 | [U] | not read | not known | Set back to 6 in the dashboard; the field still takes 6 to 10 (`email.ts:29`), and the previous build still types 6 |
| 2 | [U] (AUTH_SETUP 4.4 says "set 900"; no file sets the hosted value) | not read | not known | Set the old value back; re-export templates if the wording changes (`supabase/templates/README.md`) |
| 3 | [U] | not read | not known | Previous value |
| 4 | [U] | not read | not known | Previous value (30) |
| 5 | [U] | not read | not known | Previous value |
| 6 | [U] | not read | not known | Previous value |
| 7 | [U] | not read | not known | Previous value |
| 8 | [U] | not read | not known | Previous value |
| 9 | [U] | not read | not known | Previous value |
| 10 | [U] | not read | not known | Previous value |
| 11 | [U] | not read | not known | Off |
| 12 | [U] | not read | not known | Off |
| 13 | [U] | not read | not known | On |
| 14 | [U] | not read | not known | On |
| 15 | [U] | not read | not known | Restore the one entry; remove any extra |
| 16 | [U] | not read | not known | Turn off custom SMTP only with a replacement sender ready |
| 17 | [U] (not set) | not read | not known | Turn the check off in Supabase; the app then needs no token |
| 18 | [U] (not set) | not read | not known | Turn the hook off |
| 19 | [U] | not read | not known | Previous client id list |
| 20 | [U] | not read | not known | Not applicable |
| 21 | [U] | not read | not known | Paste the previous template body |

## 3. How a mismatch is found

No test sees the hosted project. Three things can: a founder read-back, a content-free smoke check after each staging deploy (`docs/ops/runbooks/staging-smoke.md`), and the symptom a person meets. This is the list of symptoms, so a support question can be traced to a row.

| Row | What a person or a check sees if the hosted value differs from the code |
|---|---|
| 1 | Code length differs from the app: every typed code is refused, or the field asks for the wrong number of digits. Links still work. This is the only row that breaks sign-in for a new person when build and dashboard are flipped on different days |
| 2 | Mail says "15 minutes" and the link dies earlier or later. A link tapped after 15 minutes should say it has expired |
| 3 | The app lets a second send through after 60 s and the server answers 429, or the wait is longer than the app says |
| 4 | Not visible in the app. Lower than the app expects: families behind one network see refusals. Higher: guessing is easier. Read in the dashboard only |
| 5 | A busy hour: sends answer 429, shown as the sign-in outage screen on first run. Sign in with Apple still works |
| 6, 7 | 429 answers during sign-in or while a phone is open. Read in the dashboard only |
| 8, 9 | Sessions end sooner or later than the code expects. Read in the dashboard only |
| 10 | People are signed out without asking |
| 11 | The database still refuses anonymous sessions (SCANO), so the harm is a broken first run, not an open door |
| 12 | A person could link a second identity to an account. No app screen offers it |
| 13 | New people cannot start an account, or an address that should have been refused is accepted |
| 14 | An address becomes an account before its owner proves it |
| 15 | A link opens the wrong place, or an extra entry accepts a redirect the app never sends |
| 16 | Mail comes from Supabase's own sender, is rate limited far lower, or lands in spam. Read the Resend domain status |
| 17 | On before FP-20: every email send is refused. Off after FP-20: bots can send mail to anyone |
| 18 | A person from a refused region can create an account |
| 19 | Apple sign-in fails with an audience error for one bundle id |
| 20 | Staging probe only (OQ-F8) |
| 21 | Link or code missing from the mail; the wrong wording |

The founder's sheet is the control: a hosted value counts as known only when section 2 carries a date and a name for it. `ops` re-checks the sheet against `config.toml` at every release-readiness pass and files a task for any row that is not read, or that differs.

## 4. Flip order for the changes in this register

1. Rows 1 and 4 (code length 8, verifications 15): ship the build that reads `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8` in the EAS environment of every build that talks to the project (FP-8), then set the dashboard the same day, then edit `config.toml` and `auth_config.test.mjs:74` in one PR. The order is the card's and OQ-F6's (build then dashboard, same day). Between the two steps a code of the wrong length is refused, so keep the gap short and do it when no one is signing in. A build that is out before the dashboard changes keeps working for links.
2. Row 17 (Turnstile): only after `legal` adds the Turnstile row to `docs/legal/subprocessors.md` (not there yet), FP-20 is in a build, and the founder has set up Cloudflare. Never before.
3. Rows 12, 11, 15, 2: set to the repo value on the first read if they differ.
