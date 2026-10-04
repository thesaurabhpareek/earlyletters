# Security operations: secrets, keys, least privilege, Supabase settings

Owner: server and privacy-operations engineer. Written 3 Oct 2026. For the founder, who is today the only person with access to anything.
Companions: [AUTH_SETUP.md](AUTH_SETUP.md) (sign-in providers, SMTP, redirect URLs), [DOMAINS.md](DOMAINS.md), TDD 04 section 3.9 (secrets design), LEGAL-REQ-025, -026, -028. When a vendor dashboard label differs from this page, look for the same setting nearby.

Rules that never bend:
- Secrets live in a platform secret store (Supabase function secrets, Supabase Vault, EAS, Vercel) and the founder's password manager. Never in the repo, the app bundle, a `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` variable, a chat, an email or a ticket.
- The service role key never leaves Supabase except into a runbook script run by the founder on their own machine.
- Nothing secret is logged. Function code goes through `supabase/functions/_shared/log/log.ts`, which has no free-text field; the log canary test fails the build otherwise.

## 1. Every secret and setting the founder sets

### 1.1 Edge Function secrets (Supabase > Edge Functions > Secrets, or `npx supabase secrets set`)

| Name | Used by | Value | Rotate |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | both functions | Injected by Supabase automatically; do not set | With the service key (section 2) |
| `PURGE_WORKER_SECRET` | purge-worker | `openssl rand -hex 32`. Same value goes in Vault as `purge_worker_secret` (1.2) | Yearly, on suspicion (2.1) |
| `RESEND_API_KEY` | purge-worker | Resend > API Keys > Create, permission **Sending access**, domain `earlyletters.com`. A separate key from the Supabase SMTP key, so either can be revoked alone | Yearly, when anyone with access leaves |
| `RESEND_CONTACTS` | purge-worker | Leave unset (off). v1.0 keeps no Resend contacts, so the sending-only key is enough. Set `on` and switch to a full-access key only if marketing lists ever exist | n/a |
| `POSTHOG_PERSONAL_API_KEY` | analytics-forget | PostHog > Settings > Personal API keys > Create: scope **person: write** only, limited to the Early Letters project (Verified: bulk delete needs `person:write`) | Yearly |
| `POSTHOG_PROJECT_ID` | analytics-forget | The numeric project id (Project settings) | n/a |
| `POSTHOG_HOST` | analytics-forget | Optional; default `https://us.posthog.com` (US Cloud private API, Verified) | n/a |
| `APPLE_TEAM_ID` | purge-worker | 10 characters, Apple Developer > Membership | n/a |
| `APPLE_SIGNIN_KEY_ID` | purge-worker | 10 characters, the Sign in with Apple key (section 5) | With the key |
| `APPLE_SIGNIN_PRIVATE_KEY` | purge-worker | Full contents of `AuthKey_<KEYID>.p8`, including the BEGIN and END lines. Literal newlines or `\n` both work | With the key |
| `APPLE_SERVICES_ID` | purge-worker | Only if web or Android Apple sign-in is used (AUTH_SETUP 2.3); otherwise unset | n/a |
| `TOKEN_KEK_V1` | purge-worker, and the future `apple-token` function | `openssl rand -base64 32` (32 random bytes). Wraps stored Apple refresh tokens (AES-256-GCM). Losing it only means stored tokens cannot be revoked; it protects nothing else | Yearly, by adding `TOKEN_KEK_V2` (2.3) |
| `ALERT_EMAIL` | purge-worker | Optional; default `hello@earlyletters.com`. Suggested: `security@earlyletters.com` once it exists (DOMAINS.md 7) | n/a |
| `MAIL_FROM` | purge-worker | Optional; default `Early Letters <hello@earlyletters.com>` (built from `packages/brand`) | n/a |
| `PURGE_WORKER_BUDGET_MS` | purge-worker | Optional; default 110000. Raise toward 380000 only on a paid plan (wall clock limit is an Assumption) | n/a |

The worker refuses to run (HTTP 500, alert in logs as `config`) until the four required values exist. Apple steps retry and raise an `apple_config` alert while a stored Apple token exists and the Apple values are missing.

### 1.2 Supabase Vault (SQL editor; used only by the cron jobs)

| Name | Value |
|---|---|
| `project_url` | `https://<project-ref>.supabase.co` |
| `publishable_key` | The publishable (anon) key; public by design |
| `purge_worker_secret` | Same as `PURGE_WORKER_SECRET` |

Created by `supabase/cron/purge-worker.sql`. Vault values are encrypted at rest and readable by the `postgres` role (Assumption about Supabase's Vault key handling: the root key is not in database backups).

### 1.3 Database setting

| Setting | Where | Notes |
|---|---|---|
| `app.consent_pepper` | `alter database postgres set ...` (APPLY.md step 6) | Never rotate (consent hashes must stay comparable). Copy in the password manager |
| `app.sync_epoch` | `alter database postgres set ...` | Bump only after a database restore (runbooks/restore-drill.md) |

### 1.4 On the founder's machine, for `scripts/ops` only

| Variable | Notes |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | The project the script acts on. Export in the shell for one session; never in a dotfile in the repo |
| `OPS_OPERATOR` | Your staff handle, written to `ops.audit_log` |
| `PROD_SUPABASE_URL`, `PROD_SERVICE_ROLE_KEY` | Restore drill only (read side) |
| `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` | verify-deletion's optional PostHog check |

Every script also needs `--project-ref` equal to the ref in `SUPABASE_URL` and a `--ticket`, and writes one `ops.audit_log` row before it reads anyone's data (LEGAL-REQ-025).

## 2. Key rotation

### 2.1 `PURGE_WORKER_SECRET`
1. `openssl rand -hex 32`.
2. `npx supabase secrets set PURGE_WORKER_SECRET=<new> --project-ref <ref>`.
3. SQL editor: `select vault.update_secret((select id from vault.secrets where name = 'purge_worker_secret'), '<new>');`
4. Within 15 minutes `net._http_response` shows 202 again. Between steps 2 and 3 runs answer 401; nothing is lost, the next run catches up.

### 2.2 Resend and PostHog keys
Create the new key with the same scope, set the secret, watch one worker run (or one analytics-forget call) succeed, then delete the old key in the vendor console.

### 2.3 `TOKEN_KEK` (Apple refresh token wrapping)
1. Add `TOKEN_KEK_V2` (new random value). Keep `TOKEN_KEK_V1`.
2. Point the capture side (`apple-token` function, not built) at version 2 for new tokens.
3. Re-wrap old rows (a one-off script: unwrap with V1, wrap with V2, `ops_apple_token_put(..., 2, ...)`; not built, small) or simply wait: rows leave when people delete their accounts.
4. When `select key_version, count(*) from ops.apple_tokens group by 1;` shows no version 1, remove `TOKEN_KEK_V1`.

### 2.4 Sign in with Apple key (`.p8`)
Create a new key (section 5), set `APPLE_SIGNIN_KEY_ID` and `APPLE_SIGNIN_PRIVATE_KEY`, regenerate the Supabase OAuth secret if the web flow is used (AUTH_SETUP 2.6), then revoke the old key in Apple Developer after a day. Refresh tokens stay valid across key rotation (Assumption; Apple ties them to the client id, not the key).

### 2.5 Supabase service role key and JWT signing keys
- New projects use API keys `sb_secret_...` and asymmetric JWT signing keys; rotate the secret key from Project Settings > API Keys by creating a new one, updating the scripts' environment, then revoking the old. Edge Functions receive the injected value automatically (Assumption: on redeploy).
- Revoking the JWT signing key signs everyone out (it is the "revoke all sessions" kill switch, TDD 04 3.2.3). Local letters, recording and export keep working.

### 2.6 Calendar
| When | What |
|---|---|
| Every 5 months | Apple OAuth client secret, only if the web flow is used (Apple's 6-month limit; the worker builds its own 10-minute secret per call and is unaffected) |
| Yearly | `PURGE_WORKER_SECRET`, Resend and PostHog keys, `TOKEN_KEK` |
| Quarterly | Restore drill (runbooks/restore-drill.md), `ops.audit_log` review, legal hold review |
| Before 2027-09-30 | Renew `security.txt` Expires (DOMAINS.md 8) |

## 3. Least privilege

| Who or what | Can do | Cannot do |
|---|---|---|
| The app (publishable key plus the user's JWT) | RPCs and tables under RLS, its own `deletion_requests` rows, `analytics-forget` with its own session | Anything in `ops`, any `ops_*` function, any other person's rows |
| `anon` (no session) | Read public policy documents | Every function (tested: no public function is executable by `anon`) |
| `purge-worker` | Service role inside the function | It is only reachable with `PURGE_WORKER_SECRET`, which can only start a run |
| cron (`pg_cron`) | Call the worker URL with the trigger secret | It never holds the service role key |
| `analytics-forget` | Check the caller's session, count calls, call PostHog bulk delete | Store or log analytics ids (it has nowhere to put them) |
| Resend key in the worker | Send email from `earlyletters.com` | Read contacts or logs (sending-only key) |
| PostHog key in the function | Delete persons | Read events, change settings (`person:write` only) |
| `ops` schema | Reached only through `ops_*` security-definer functions granted to `service_role` | Not in the Data API; no grants to `anon` or `authenticated`; RLS on anyway |
| Ops scripts | One audited action per run, by a named operator, against a named project | Run without `--project-ref`, `--ticket` and an audit row |

Consoles: every account below has two-factor sign-in (a security key or an authenticator app, never SMS where avoidable), recovery codes stored offline, and only the founder as a member: Apple Developer and App Store Connect, Supabase (organization MFA enforcement on), Vercel, Porkbun, Resend, PostHog, GitHub, Expo, Google Cloud (Google sign-in), the password manager. Add a second named person with break-glass access only when one exists (TDD 06 escrow note).

## 4. Supabase settings checklist (production; staging the same)

| Setting | Value | Why | How to check |
|---|---|---|---|
| Row level security | On for every table in `public` and `ops` | LEGAL-REQ-024 | `npm run test:db` (classification, access matrix, ops tests); live: `select public.ops_schema_health();` all zeros |
| Data API > Exposed schemas | `public` only (plus `graphql_public` if Supabase lists it) | `ops` must never be reachable over REST | Project Settings > Data API |
| GraphQL (`pg_graphql`) | Disable the extension if nothing uses it (nothing does) | Removes an introspection surface for `anon` | Database > Extensions |
| Realtime | Off for every table (the app syncs by pulling RPCs, D-023) | Smaller surface | Database > Publications: `supabase_realtime` has no tables |
| Network restrictions | Database > Network restrictions: allow only the founder's IP range for direct Postgres connections (or none if you only use the dashboard and REST) | Direct database access is the biggest blast radius. Assumption: the dashboard SQL editor is not affected | Settings > Database |
| SSL enforcement | On (reject non-SSL database connections) | LEGAL-REQ-021 | Settings > Database |
| Backups | Pro plan daily backups, 7 days | DATA-REQ-030; the published 38-day deletion promise | Database > Backups shows yesterday's |
| PITR | **Off at launch.** Turn on at 7 days when App Store Connect shows about 1,000 paying subscribers (DELETION spec OQ-3), never longer than 7 days without first updating the Privacy Policy and data-policy section 5 | A longer window keeps deleted data longer than we promise | Database > Backups > PITR |
| Auth rate limits | Emails per hour about 100 for TestFlight (AUTH_SETUP 4.3); token verifications default (about 30 per 5 minutes per IP); sign-ups per hour 30 | Brute force and cost | Authentication > Rate Limits |
| CAPTCHA on email sign-in | Turn on Attack Protection > CAPTCHA (Cloudflare Turnstile or hCaptcha) **after** the app sends a `captchaToken` with `signInWithOtp`; turning it on first breaks email sign-in. Add the provider to the subprocessors page and data map first | TDD 04 3.1.4: stops cheap mass code requests. Whether Supabase also requires it for `signInWithIdToken` (Apple, Google) is Unverified; test on staging | Authentication > Attack Protection |
| JWT expiry | 900 seconds; refresh token rotation on (AUTH_SETUP 1) | Shorter stolen-token window | Authentication > Sessions |
| Anonymous sign-ins | Off | Not used at v1.0 | Authentication > Providers |
| Phone and unused providers | Off | Smaller surface | Authentication > Providers |
| Auth audit logs | Keep the shortest retention offered; do not store IPs in the database if the option exists (DELETION spec OQ-5, Unverified) | Minimisation | Authentication > Audit Logs |
| Edge Functions | `purge-worker` deployed with `--no-verify-jwt`; `analytics-forget` with JWT verification on | Section 3 | Edge Functions > function > Details |
| Storage | Every bucket private (`entry-photos`, `ops-ledger`); size and MIME limits as migrations set | DATA-REQ-047 | Storage |
| Organization | MFA required for members; members: founder only | Section 3 | Organization > Settings |
| Error verbosity | Ask Supabase support whether `log_error_verbosity = terse` can be set, so failing rows never reach Postgres logs (TDD 06 conflict C-2, Unverified) | Letter text in a CHECK failure | Support ticket |
| Advisors | Security Advisor clean except the documented exceptions in APPLY.md | | Advisors |

## 5. Sign in with Apple: the key the worker uses to revoke tokens

Apple requires apps with Sign in with Apple to revoke the user's tokens when they delete their account (Apple 5.1.1(v), A-NFR-011, DATA-REQ-019). Revoking needs a refresh or access token for the user (Verified, Apple "Token revocation"), which Supabase's native sign-in does not keep, so we store one ourselves.

**One-time setup (founder, about 15 minutes):**
1. Apple Developer > Certificates, Identifiers & Profiles > **Keys** > +. Name `Early Letters Sign in with Apple`. Tick **Sign in with Apple** > Configure > Primary App ID `com.earlyletters.scribe` > Save > Continue > Register. If AUTH_SETUP 2.4 already made this key, reuse it: one key serves both purposes.
2. **Download** `AuthKey_<KEYID>.p8` (Apple allows one download). Note the **Key ID**. Team ID: Apple Developer > Membership.
3. Password manager: store the `.p8` file, Key ID and Team ID together. Never commit it (`.gitignore` ignores `*.p8`).
4. Set the function secrets `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY` and `TOKEN_KEK_V1` (section 1.1).

**How revocation works:** the worker unwraps the stored refresh token (AES-256-GCM under `TOKEN_KEK_V<n>`, bound to the profile id), builds a 10-minute ES256 client secret (`iss` Team ID, `sub` the token's client id, which is the bundle id for native sign-in, `aud https://appleid.apple.com`), posts to `https://appleid.apple.com/auth/revoke`, and deletes the stored row. HTTP 200 and Apple's `invalid_grant` (token already unusable) both complete the step; `invalid_client` means our key or ids are wrong: the step retries and alerts `apple_config`.

**What is not built yet (owner: auth engineer):** the capture side, the `apple-token` function that, right after native Apple sign-in, exchanges the one-time authorization code (`POST https://appleid.apple.com/auth/token`, `grant_type=authorization_code`, `client_id` = bundle id) and stores the refresh token with `wrapAppleToken()` from `supabase/functions/purge-worker/lib/apple.ts` and `ops_apple_token_put(profile, ciphertext, key_version, client_id)`. Until it ships, deletions of Apple users complete with the receipt saying `apple: no_token`, and the worker raises an `apple_no_token` alert so the gap stays visible. Ship it before Sign in with Apple reaches anyone outside the family.

**Staging test:** sign in with Apple, delete the account, run the worker after day 30 (or set `scheduled_for` back on staging), then check `apple_token_revoke = done` and receipt `apple = revoked`, and on the iPhone, Settings > Apple Account > Sign in with Apple no longer lists the app (Assumption that revocation removes it).

## 6. Logs

- Function logs hold event names, enums, HTTP statuses, SQLSTATEs, counts, durations and a random `req_id`. Never ids, emails, paths, tokens or text. Correlate by `req_id`; find a person only through an audited script.
- `console.*` is banned in function and ops-script code by a test; the only console call is the logger's sink.
- The log canary (`supabase/functions/_shared/log/canary.test.ts`) runs both functions end to end with the "Asha" fixtures and fails on any fixture, UUID, email or JWT in the output.
