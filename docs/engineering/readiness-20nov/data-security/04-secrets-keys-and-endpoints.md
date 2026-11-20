# 04. Secrets, keys and endpoints

Owner: `security-architect`. Status: amended 20 Nov 2026 after the council (CDO and CISO seats; D-20nov = `docs/engineering/readiness-20nov/DECISIONS-20nov.md`, PR #1013). Section 13 lists each change. Pack: data and security foundation (files 01 to 07). Read with `docs/engineering/06-security-engineering.md` (SEC), `docs/ops/SECURITY.md` (the founder's secret list and rotation steps) and `docs/security/SECRETS_REVIEW.md` (CI secrets by environment). This file does not repeat their step lists; it is the single map of what exists, who holds it, what a client may see, and what each endpoint exposes. Base: `develop` at `b1e4cf88`.

Tags: **[V]** verified by grep or by reading the file named. **[E]** estimate, basis given. **[U]** not verified. **Rec** is my recommendation, not a decision. Data levels use `docs/legal/DATA_CLASSIFICATION.md:44-49`: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. No value of any secret appears here or may appear in any PR, test, log or bundle.

## 0. The six facts to hold

1. The app holds no secret. It holds the Supabase URL, the publishable key, public client ids, the signed-document public keys and escrow public keys. Nothing else is read from `process.env` in `apps/mobile/src` except feature switches and ids (section 3). [V]
2. The Supabase secret key (the key that skips row security) lives only in Edge Function secrets, the founder's shell for `scripts/ops`, and nowhere else. [V] `grep -rn "service_role\|SERVICE_ROLE\|sb_secret"` finds nothing in `apps/mobile/src`, `apps/web/src` or `packages` (20 Nov).
3. **There is no remote push today.** No token is requested, no APNs key exists, no push table exists, and the push entitlement is stripped from every build (section 6). [V]
4. Edge Functions: 7 on the main project (`analytics-forget`, `apple-token`, `config`, `content`, `invite-redeem`, `purge-worker`, `subscription-status`), plus `escrow` on its own project. Three run without the gateway's JWT check (`config`, `content`, `purge-worker`); `escrow` too because it verifies a token from another project (section 5). [V]
5. Backup and escrow are off in every build profile and cannot be switched on: the app's bundled escrow public key list is empty and so is the function's pinned list (section 5, G-04-03). [V]
6. As in file 03: no hosted project runs any of this yet (`supabase/APPLY.md:4`). Everything here is the repository state. [U] for hosted settings.

## 1. Rules

SK-01. Name a secret by purpose and holder, never by value, in every document, comment, log, test and PR. A value found anywhere is revoked first, rotated second (SEC-R05).
SK-02. A secret has one holder store, one reader job, one owner and a rotation interval. A new secret adds its row to this file and to `docs/ops/SECURITY.md` in the same PR (SEC-R02). `docs/ops/SECRETS.md`, which SEC-R02 names, does not exist; `SECURITY.md` section 1 plays that role (G-04-08).
SK-03. Public identifiers are listed as public so scanners allow them (SEC-R03): Supabase URL, publishable key, PostHog project key, Sentry DSN, Google client ids, the EAS project id, the signing and escrow **public** keys, the Apple provider token the website uses for store links.
SK-04. Anything in `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` is public by construction: Expo and Next inline it into the bundle at build time. A name that contains KEY, SECRET, TOKEN or PASSWORD in an `EXPO_PUBLIC_*` variable is refused in review unless it is on the public list in section 3.
SK-05. One secret key per backend component and one project per environment; no account-wide token in CI (SEC-R04). Deploys read GitHub Environment secrets, intended to need a required approver [U]: the workflows only name the environments.
SK-06. A secret never crosses to an agent. Agents hold none of the Supabase, Resend, Apple, PostHog or PayPal credentials, and no connector with write access to them (SEC-R19, IAM-R23).
SK-07. Logs carry closed enums and counts, never an id, an address, a code or a key (`supabase/functions/_shared/log/`, file 05 owns the schema).
SK-08. A client-side check is never a security control. Every limit below is also in the database or at the gateway.

## 2. Inventory of secrets and keys, by purpose and holder

Class: **S** secret (revoke on leak), **P** public by design, **I** identifier (not a credential, kept as a secret only so logs mask it), **K** key pair half. "Reads" names the code that reads it. Rotation intervals are from `docs/ops/SECURITY.md:15-37` and `SECRETS_REVIEW.md` section 4 unless marked **Rec**.

### 2.1 Main Supabase project

| Name (purpose) | Class | Holder (store) | Reads | Rotate | Cite |
|---|---|---|---|---|---|
| Secret key `SUPABASE_SECRET_KEYS`, legacy `SUPABASE_SERVICE_ROLE_KEY` (skips row security; calls the 44 service RPCs, and also opens the Auth admin and Storage APIs, which grants do not limit) | S | Edge Function secrets, injected by the platform | `purge-worker`, `apple-token` (one RPC), `invite-redeem` (one RPC), `analytics-forget` (quota RPC) | with the key; delete the old after replacing (SEC-R05) | `_shared/keys/keys.ts:31-33`; `purge-worker/config.ts:46` [V] |
| Publishable key `SUPABASE_PUBLISHABLE_KEYS`, legacy `SUPABASE_ANON_KEY` (public by design) | P | injected; also in the app and in Vault | `invite-redeem`, `subscription-status`, `apple-token`, `analytics-forget` for the session check | with the key | `keys.ts:36-38` [V] |
| Database URL for deploys `SUPABASE_DB_URL_STAGING`, `SUPABASE_DB_URL_PROD` (owner role, full database) | S | GitHub Environments `staging`, `db-production` | `deploy-db.yml` steps only | yearly, on suspicion | `deploy-db.yml:120,240`; `SECRETS_REVIEW.md:179-195` [V] |
| Management token `SUPABASE_ACCESS_TOKEN_STAGING` (function deploy; must be scoped, not a classic token) | S | GitHub Environment `staging` | `deploy-functions.yml` | 90 days **Rec** | `SECRETS_REVIEW.md:179-187` [V]; scope itself [U] |
| JWT signing keys (sign every access token) | K | Supabase, never exported | Supabase Auth | rotating signs nobody out and does not end sessions (`sign-everyone-out.md:11`) | [V] doc |
| Database settings `app.consent_pepper` (hashes consent rows), `app.sync_epoch`, `app.backup_enabled`, `app.escrow_enabled`, `app.status_report_enabled`, `app.held_sync` | S for the pepper, L2 switches otherwise | `alter database postgres set` | SQL | pepper: **never** rotate (hashes must stay comparable); copy in the password manager | `SECURITY.md:57-58`; `sync_v1_server.sql:1315-1316` [V] |
| Vault `project_url`, `publishable_key`, `purge_worker_secret` | S for the last | Supabase Vault | `cron.schedule` jobs only | with `PURGE_WORKER_SECRET` | `supabase/cron/purge-worker.sql:22-24` [V] |
| Auth SMTP key (sends sign-in emails through Resend SMTP) | S | Supabase dashboard only | Supabase Auth | yearly; separate from the function key so each revokes alone | `config.toml` comment `[auth.email.smtp]`; `SECURITY.md:19` [V] |
| Sign in with Apple and Google provider secrets | S | Supabase dashboard (`env()` in config, off locally) | Supabase Auth | with the Apple key (6-month client secret if the web flow is used) | `config.toml` `[auth.external.*]` [V]; enabled = false until credentials exist |

### 2.2 Edge Function secrets (main project)

| Name (purpose) | Class | Reads | Rotate | Notes |
|---|---|---|---|---|
| `PURGE_WORKER_SECRET` (bearer that lets cron start a purge run) | S | `purge-worker/handler.ts:4` | yearly, on suspicion | a leak can start a run, nothing more |
| `RESEND_API_KEY` (send deletion emails and ops alerts; sending-only) | S | `purge-worker/config.ts:46` | yearly | not the SMTP key; `RESEND_CONTACTS` left unset so no list scope is needed |
| `POSTHOG_PERSONAL_API_KEY` (delete persons; scope `person:write` only) and `POSTHOG_PROJECT_ID` (I), `POSTHOG_HOST` | S, I | `analytics-forget/handler.ts:83-86` | yearly | the app's PostHog **project** key is P and absent from v1.0 builds |
| `APPLE_SIGNIN_PRIVATE_KEY` (.p8), `APPLE_SIGNIN_KEY_ID` (I), `APPLE_TEAM_ID` (I), `APPLE_SERVICES_ID` (I, optional) | S, I | `apple-token/handler.ts:106-107`, `purge-worker/config.ts:59-60` | with the key | exchanges the Apple code, revokes tokens on deletion |
| `TOKEN_KEK_V<n>` (wraps stored Apple refresh tokens, AES-256-GCM) | S | `apple-token/handler.ts:112`, `purge-worker/config.ts:54` | yearly, by adding the next version | losing it only means tokens cannot be revoked |
| `INVITE_CODE_PEPPER` (HMAC key for invite codes) | S | `invite-redeem/handler.ts:107` | not while codes are live; on suspicion, let open codes expire (7 days) | never in the database or the app |
| `RATE_SUBJECT_SECRET` (HMAC for rate-limit subjects: person, install, address) | S | `invite-redeem/handler.ts:108` | on suspicion | counters last an hour |
| `CLIENT_IP_HEADER` (name of the one header the platform sets) | I | `invite-redeem/handler.ts:134` | when the platform changes | unset skips the per-address limit; spoof check on first staging deploy is [U] |
| `KILL_SWITCHES` (comma list of remote switches) | L2 | `invite-redeem`, `subscription-status`, `config` | when state changes | |
| `ALERT_EMAIL`, `MAIL_FROM`, `PURGE_WORKER_BUDGET_MS`, `WORKER_VERSION` | L2 | `purge-worker` | n/a | defaults in code |

### 2.3 Escrow project `scribe-escrow` (separate, holds the recovery key)

| Name | Class | Reads | Rotate | Notes |
|---|---|---|---|---|
| `ESCROW_PRIVATE_KEY_V<n>` (X25519, opens recovery wraps) | S, the most sensitive | `escrow/config.ts:72`, decoded only for a release or a rotation, zeroed after | on suspicion, by the runbook rotation | only copy besides the paper bags (`BACKUP_RUNBOOK.md:15,146`); must match the pinned public key or nothing opens |
| `ESCROW_DB_URL` (password of login role `escrow_svc` on the main database) | S | `escrow/config.ts:43` | yearly **Rec** | role: 10 functions, no table, limit 5 connections (`backup_server.sql:148-154`, `BACKUP_RUNBOOK.md:58-71`) |
| `ESCROW_DB_CA` (the main database's CA, public) | P | `escrow/config.ts:81` | n/a | TLS pin |
| `MAIN_SUPABASE_URL` | P | `escrow/config.ts:43` | n/a | where tokens are verified (JWKS) |
| `ESCROW_TASK_SECRET`, `ESCROW_ROTATE_FROM/TO`, `ESCROW_PRIVATE_KEY_V<n+1>` | S | `escrow/config.ts:85-90` | only while a rotation runs; remove after | `BACKUP_RUNBOOK.md:96` |
| `ESCROW_SWITCH` (on, rotation, anything else is off) | L2 | `escrow/config.ts:54` | n/a | second switch beside `app.escrow_enabled` |
| `RESEND_API_KEY` (the "we used your recovery key" emails) | S | `escrow/config.ts:101` | yearly | own key, so it revokes alone |

Escrow design check: the escrow project holds the private key but has no main-database credential beyond the table-less `escrow_svc` login, and the main project holds the sealed wraps but never the private key. Neither alone opens a family's recording keys. [V] by the files above.

### 2.4 Signing and pinned keys

| Key | Class | Private half | Public half | Cite |
|---|---|---|---|---|
| Packs and config signing key `el-2026-11` and cold backup `el-2026-11-backup` (two public keys are on `develop`, added by #512; any text saying the list is empty is stale) | K | founder's password manager and signing shell, never repo, CI or server | `packages/api/src/keys.ts:21-22` (P) | `keys.ts:11-15` [V] |
| Escrow public keys | P | in the escrow project only | `supabase/functions/escrow/public-keys.ts` (empty), `apps/mobile/src/lib/backup/escrow-keys.ts` `BUNDLED_ESCROW_KEYS` (empty, TODO) | [V] both empty |
| Backup (database dump) age key | K | founder's Mac and paper copy | recipient key in the private backup repository | `SECRETS_REVIEW.md:197-205` [V doc] |

### 2.5 Website (Vercel project for `apps/web`)

| Name | Class | Reads | Notes |
|---|---|---|---|
| `RESEND_API_KEY`, `RESEND_SEGMENT_ID` | S, I | `apps/web/src/lib/notify/provider.ts` | stores one address per visitor on the launch list (L3); scope of this key [U] |
| `UNSUBSCRIBE_SECRET` | S | `apps/web/src/lib/notify/unsubscribe.ts:6,24` | HMAC of the contact id; separate from the Resend key so rotating the key does not break old links |
| `NEXT_PUBLIC_*` (site URL, store URL, badge, analytics flag, Apple provider token) | P | `apps/web/src` | the Apple provider token is the campaign token for App Store links, public by design |
| `APPLE_TEAM_ID`, `IOS_BUNDLE_ID` | I | AASA route | `apps/web/src/app/.well-known/apple-app-site-association/route.ts` |

### 2.6 CI, release and agents (names only; steps in `SECRETS_REVIEW.md`)

**Tagging:** only the 12 names in the last sentence were found in `.github/workflows`; every other name in this paragraph comes from `SECRETS_REVIEW.md` section 4 and is [V doc], [U] in the workflows (no workflow on `develop` reads them).
`EXPO_TOKEN` (robot users per lane), App Store Connect keys per lane (`ASC_API_KEY_*`), `ASC_REVIEW_CONTACT_JSON` (personal data, not a credential), `PACKS_S3_*` (R2 token, one bucket), `BACKUP_DB_URL` and the age recipient (private backup repository), `PUBLIC_REPO_ISSUES_TOKEN`. Agents: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `AGENTS_APP_PRIVATE_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`. Names found in `.github/workflows` by `grep secrets\.`: 12 distinct (`SUPABASE_*` 6, `EXPO_TOKEN`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `AGENTS_APP_PRIVATE_KEY`, `ASC_REVIEW_CONTACT_JSON`). [V] No workflow reads a Supabase secret key, a Resend key, an APNs key or a PostHog key.

Founder-shell variables for `scripts/ops` (exported for one session, never in a dotfile in the repo; `SECURITY.md:62-67`). Values never appear anywhere:
| Name | Class | Purpose | Holder and reader | Cite |
|---|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | P, S | the one project an ops script acts on (the secret key, same as 2.1) | founder shell; `scripts/ops/verify-deletion.ts`, `enumerate-affected.ts`, `restore-drill.ts` | `SECURITY.md:64` |
| `PROD_SUPABASE_URL` | P | production project URL, restore drill read side | founder shell; `restore-drill` | `SECURITY.md:66` |
| `PROD_SERVICE_ROLE_KEY` | S | production secret key for the restore drill, read side only | founder shell; `scripts/ops/restore-drill.ts` | `SECURITY.md:66` |
| `LIMITS_DB_URL` | S | session-pooler URL for the least-privilege backup role `scribe_backup` for the free-tier limits check | founder shell, or the private backup repository's CI | `scripts/ops/free-limits.ts:5` |
| `RESTORED_DB_URL` | S | connection to a restored copy (local, `sslmode=disable` is allowed only for localhost) used by the restore check; the copy holds real data, so treat it as L4 | founder's Mac only | `scripts/ops/restore-check.ts:5` |
| `OPS_OPERATOR` | I | staff handle written to `ops.audit_log` for each run | founder shell | `SECURITY.md:65` |
Rules: these point at production data or the production secret key, so they never go in CI, a script default or an agent session; a run without `--project-ref`, `--ticket` and an audit row is refused (`SECURITY.md:115`).

### 2.7 Held only by the founder

Apple Sign in `.p8`; Apple Developer and App Store Connect; Supabase organisation; Vercel, Porkbun, Resend, PostHog, GitHub, Expo, Google Cloud accounts; the password manager; the escrow ceremony paper bags. All with two-factor and offline recovery codes; founder the only member (`SECURITY.md:117,139`). [V doc]. Second-person recovery is open (SEC question 4, `back-office.md:189`).

## 3. What the client bundle may contain

The mobile app (`apps/mobile`) and the website are public: anyone can unpack an `.ipa` or view the page source. Expo and Next inline `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` at build time.

**Allowed in the app** (all P, all found in code):
| Variable or constant | Class | Where read |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (fallback `_ANON_KEY`) | P | `src/lib/supabase/env.ts:38-39` |
| `EXPO_PUBLIC_ESCROW_URL` (the escrow project URL), `EXPO_PUBLIC_ESCROW_KEYS` (public keys, development builds only) | P | `src/lib/backup/runtime.ts:344,356`; `escrow-keys.ts` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `_IOS_CLIENT_ID` | P (OAuth client ids) | `src/lib/auth/google.ts:22-23` |
| `EXPO_PUBLIC_POSTHOG_KEY`, `_HOST` (project key, not the personal key) | P | `src/lib/analytics/index.ts:42,44`; analytics off in every profile (`eas.json:18,36,50,64,80`) |
| `EXPO_PUBLIC_DOCS_BASE_URL` | P | `src/lib/remote/index.ts:54` |
| Feature switches `EXPO_PUBLIC_SERVER_FEATURES`, `_BACKUP`, `_STATUS_REPORT`, `_ANALYTICS`, `_ACCOUNT_DELETION`, `_ENGLISH_ONLY`, `_SPOKEN_LANGUAGES`, `_APP_ENV`, `_PASSKEYS`, `_EMAIL_OTP_LENGTH` | L2 | `src/lib/capabilities.ts:119-153` |
| Test seams `EXPO_PUBLIC_E2E`, `_WEB_PREVIEW` | L2, refused outside development | `app.config.ts:203-204`, `build-env.ts:40-60` |
| Public signing keys `TRUSTED_SIGNING_KEYS` | P | `packages/api/src/keys.ts:21-22` |
| EAS project id | P | `app.config.ts:341` |

**Never in the app, the website bundle, a fixture or a test:** the Supabase secret key or legacy service key; any `SUPABASE_DB_URL`; `PURGE_WORKER_SECRET`; `TOKEN_KEK_V<n>`; `INVITE_CODE_PEPPER`; `RATE_SUBJECT_SECRET`; `APPLE_SIGNIN_PRIVATE_KEY`; `ESCROW_PRIVATE_KEY_V<n>` and `ESCROW_DB_URL`; any Resend or PostHog personal key; `UNSUBSCRIBE_SECRET`; `app.consent_pepper`; the signing key's private half; any APNs key; any real family detail. [V] none appears in `apps/mobile/src` by the grep above and by `packages/content/test/no-real-family-data.test.ts` for fixtures.

Where a secret is stored on the phone: the session is in the Keychain with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (`apps/mobile/src/lib/supabase/secure-storage.ts:24`), so a restored backup on another phone carries no session. Nothing else the app holds is a credential. Per-book recording keys are L4 and handled by file 01 and the backup design, not here. [V]

Checks that stop a leak, and their state:
| Check | State |
|---|---|
| GitHub secret scanning and push protection | founder setting; [U] |
| `gitleaks` full-history job (SEC-R03) | **not on `develop`**: no `security.yml`, `grep -rl gitleaks .github` finds nothing (G-04-01) |
| `.ipa` bundle scan for secret patterns (SEC-R03, TDD 04 8.3) | not yet; release gate |
| `*.p8` ignored | `.gitignore:17` lists `*.p8` [V] |
| Test that no `EXPO_PUBLIC_*` name holds KEY, SECRET or TOKEN outside section 3's list | not yet; **Rec** a 15-line test in `apps/mobile/test` (handoff to `security`) |
| Entitlements test: no `aps-environment`, data protection set | on `develop`, `apps/mobile/test/config.test.ts:475-503` [V] |

## 4. Storage, rotation and compromise

Storage rules. Edge Function secrets: Supabase function secrets only (`supabase secrets set` by the founder). CI: GitHub Environment secrets with a required approver where the plan says so (`SECRETS_REVIEW.md` section 5); the tag `db-v*` gates production. Founder-held keys: password manager plus one paper copy for the escrow and backup keys. Nothing in the repository, a dotfile in the repository, an issue, a PR, a log or a chat. [V] workflows, [U] settings.

Rotation. Yearly for `PURGE_WORKER_SECRET`, Resend, PostHog and `TOKEN_KEK` (`SECURITY.md:99`); 90 days for CI tokens that `SECRETS_REVIEW.md` marks; every 5 months for an Apple web client secret if used. Never rotate: `app.consent_pepper`. Rotate only by letting old data expire: `INVITE_CODE_PEPPER`. Rotate by adding a version: `TOKEN_KEK_V<n>`, `ESCROW_PRIVATE_KEY_V<n>`, signing keys (needs an app release to revoke, `keys.ts:11-15`).

On suspected exposure: revoke first, rotate second, investigate third, write it down (SEC-R05). The order for the three that matter most:
1. Secret key leaked: delete it in the dashboard, redeploy functions (they read the injected key), check `ops.audit_log`, the Auth logs and the Storage logs for use, run `ops_schema_health()`. A leak can call 44 RPCs including purge and deletion, and can use the Auth admin API (list or delete users, read their addresses) and the Storage API (read or delete photos, ciphertext and the ledger), which grants do not limit; it cannot read a table over the Data API. Treat it as an L3 and L4 incident. [V] grants.
2. `ESCROW_PRIVATE_KEY_V<n>` leaked: set `ESCROW_SWITCH` off and `app.escrow_enabled` off, run the runbook rotation, tell owners whose keys were released (`escrow_unwraps` rows). Recordings stay encrypted under the per-book key; the leak matters only together with the sealed wraps in the main database.
3. Signing key leaked: publish with the backup key, ship a release that drops the old one (`keys.ts:11-15`). Until then an attacker with the key can sign remote config and content bundles. This is the largest single trust anchor in the product; see threat T4.

Runbooks that exist: `docs/ops/runbooks/suspected-data-leak.md`, `incident-notification.md`, `sign-everyone-out.md` (not run). `docs/ops/INCIDENT.md` and `SECURITY.md` at the repo root, which SEC-R23 requires, do not exist (G-04-08).

## 5. Exposure map: every endpoint class

Auth column: **none** anonymous; **JWT** the person's access token; **gateway JWT** the platform checks the token before the function runs (`verify_jwt` on); **bearer** a shared secret; **session in code** the function also checks the person itself.

### 5.1 Supabase Data API and Auth (main project)

| Endpoint class | Caller | Auth | Limits | May return | Must never be reachable from a client |
|---|---|---|---|---|---|
| PostgREST tables (`/rest/v1/<table>`) | app, anyone with the publishable key | JWT; `anon` only for `policy_versions` | RLS per file 03; no DELETE or TRUNCATE for any API role | own rows and the columns in `grants.mjs` | every table not in `grants.mjs`; `children.date_of_birth`, `due_date`; `child_keys.escrow_wrap`; `entries` of other authors |
| PostgREST RPC (`/rest/v1/rpc/<fn>`) | app | JWT, `require_user()` | `rate_hit` buckets 60 to 300 per window (`20261015000000:88-110`); per-act limits (5 deletion requests per day, `20261005000000_family_cap_language_idempotency.sql:424-427`) | per file 03 section 7 | the 44 service functions; `audit`, `escrow_*`, `ops_*`, `backup_svc_*` (`access_matrix.test.mjs:337-378`) |
| Auth: email code and link, Apple and Google id token, refresh | app, website pages | none until verified | `email_sent` 100 per hour, `sign_in_sign_ups` 30 and `token_verifications` 30 per IP per 5 minutes, `token_refresh` 150, one email per address per minute, code valid 15 minutes, 6 digits (`config.toml:53-58,70-74`) | a session, or an identical answer whether or not the address has an account (IAM-R09, [U] hosted) | any admin Auth endpoint (secret key only) |
| Realtime, GraphQL | none intended | n/a | off; `pg_graphql` to be disabled (`SECURITY.md:124-126`) | n/a | all; hosted state [U] |
| Storage `/storage/v1` `entry-photos`, `entry-audio` | app | JWT plus object policy | 10 MiB, 20 MiB; MIME lists | file 03 section 4 | any object by guess: buckets are private, no public URL |
| Storage `ops-ledger` | worker only | secret key | no client policy | purge ledger copy (no content) | everything to clients |
| `pg_cron` to `purge-worker` | database | bearer `PURGE_WORKER_SECRET` | every 15 minutes, daily at 03:17 | n/a | n/a (outbound from the database) |

Exposed schemas are `public` only (`SECURITY.md:124`); `ops`, `insights`, `sync_private` must never be in the Data API list. `sync_private` grants usage to `authenticated` (`sync_v1_server.sql:234`), which is safe only while it is not exposed. [V] files, [U] hosted setting (G-04-09).

### 5.2 Edge Functions (main project, `/functions/v1/<name>`)

| Function | Route | Caller | Auth | Limits | Returns | Gateway JWT |
|---|---|---|---|---|---|---|
| `analytics-forget` | `POST /v1`, `GET /health` | app, at deletion | gateway JWT plus session in code | 5 calls per person per day, 1 to 21 ids (`handler.ts:34-35`) | 202 `{accepted: n}`; ids dropped, never stored or logged | on |
| `apple-token` | `POST /v1`, `GET /health` | app, after Sign in with Apple | gateway JWT plus session check (non-anonymous, Apple identity) | 10 per person per hour in memory and in the database (`rate_hit('apple_token')`); body at most 4 KiB | 204, no body, no token echoed | on (never `--no-verify-jwt`, `index.ts:7-10`) |
| `invite-redeem` | `POST /v1` | app, joining by code | gateway JWT plus session in code | body at most 1 KiB; 10 failed codes per person, 10 per install, 30 per address per hour, 1,000 service-wide, then `codes_paused` | peek: inviter name and role; accept: book id and role | on |
| `subscription-status` | `POST /v1/report`, `GET /v1/salt`, `GET /health` | app | gateway JWT plus session in code | 30 reports per person per hour, 2 KiB, kill switch `SCKIL` | `{stored, consent}`, a per-account salt | on |
| `config` | `GET /` | anyone | none, signed documents | cache policy; GET, HEAD, OPTIONS only (`serve.ts:91-97`) | signed remote config and pack manifest | off, by design |
| `content` | `GET` | anyone | none, signed documents | same | signed content bundles | off, by design |
| `purge-worker` | `POST` (`run`, `daily`), `GET /health` | cron only | bearer, constant-time compare (`handler.ts:4`) | body at most 1 KB; answers 202 and works in the background | counts only; health is 200 or 503 and starts nothing | off (the bearer is not a JWT) |
| `escrow` (project `scribe-escrow`) | `POST /escrow/v1/restore-requests`, `.../<id>/release`, `/rotate` | the app, later | the caller's token from the main project, verified against its JWKS (`jwt.ts`); rotate also needs `ESCROW_TASK_SECRET` | switch `ESCROW_SWITCH`, `app.escrow_enabled`, fresh sign-in for a new request, one email per opening | sealed keys, only after the log row exists | off (token comes from another project) |

`NO_VERIFY_JWT = ['config', 'content', 'purge-worker']` in `.github/scripts/functions-deploy.mjs:41`; a test fails if a function's `index.ts` deploy line disagrees (`functions-deploy.test.mjs`). `escrow` is never deployed by CI (`escrow/index.ts:2-5`). [V]

**Never reachable from a client in any function:** the service key; another person's id as input (the caller's id comes from the verified token, never the body); a raw database error (`classifySqlstate` maps to the envelope); a request id chosen by the client in the escrow function (it makes its own, `escrow/handler.ts:16-20`); the health route answering anything but ready or not.

### 5.3 Website `earlyletters.com` (Vercel, Next.js)

Every route under `apps/web/src/app` is listed (checked by `find`, 20 Nov); the lab pages `/lab/*` are in the last row.

| Route | Caller | Auth | Limits | Notes |
|---|---|---|---|---|
| `POST /api/notify` | visitors | none | 5 per client per 10 minutes and 60 provider calls a minute per instance (in memory, a backstop); honeypot; time on page at least 1.5 s; JSON only; same-origin | stores one address in a Resend segment (L3). The real control is a Vercel WAF rule, **not verified** (`rate-limit.ts:1-10`, G-04-07) |
| `/api/unsubscribe`, `/unsubscribe` | anyone with a link | HMAC token | one act only: set that contact to unsubscribed | token holds Resend's contact id, no address |
| `/auth/callback`, `/auth/confirm`, `/j` (and `/a`, `/i`, `/r`, which `next.config.ts:57` lists but `apps/web/src/app` does not contain) | people with a link | the secret is in the URL fragment | `Referrer-Policy: no-referrer` on those paths (`next.config.ts:111-113`) | `additional_redirect_urls` allows exactly one URL, no wildcard (`config.toml:39`) |
| `/.well-known/apple-app-site-association` | Apple, apps | none | primary domain only | public |
| Headers on every page | n/a | n/a | CSP with `frame-ancestors 'none'`, HSTS 2 years, `nosniff`, `X-Frame-Options DENY`, camera, microphone, geolocation off (`next.config.ts:29-52`) | CSP allows `'unsafe-inline'` scripts; documented reason `:20-25` |
| `/` (landing), `/signup/thanks`, `/signup/already`, `/signup/sorry` | visitors | none | static pages; `/signup` disallowed to crawlers (`robots.ts:8`) | marketing copy and the result of the form; no address echoed |
| `/open` | people following an email link | none | no token, no analytics, no request on load, never indexed (`open/page.tsx:1-9`) | fallback page: "Open the app" link, App Store link only in launch mode |
| `/privacy`, `/terms`, `/support` | anyone | none | static, indexable | L1 legal and help text |
| `/legal/[doc]/0.9.0` and `/legal/[doc]/0.9.0.md` | anyone, the app, the deploy smoke | none | `force-static`, `dynamicParams = false` (only known docs and version) | published text; the raw bytes match `policy_versions.content_sha256` (`0.9.0.md/route.ts:1-4`) |
| `/favicon.ico`, `/apple-icon`, `/robots.txt`, `/sitemap.xml` | browsers, crawlers | none | static | L1; robots disallows `/lab`, `/api`, `/unsubscribe`, `/signup` (`robots.ts:8`) |
| `/lab` | founder | none | 404 in production unless `ENABLE_LAB=1` at build | `next.config.ts:18` |

### 5.4 Outbound paths (what leaves our servers, and to whom)

| Path | Sender | Receiver | What it may carry | What it must not |
|---|---|---|---|---|
| Sign-in and Auth notice emails | Supabase Auth through Resend SMTP | the person | link and code, address, "new method added" notice | any child, letter or family detail (templates in `supabase/templates`) |
| Deletion and restore emails | `purge-worker`, `escrow` through Resend REST | the account address | dates, a reference id, device label | content, names; `escrow` refuses an email with an unfilled placeholder (`mail.ts:39`) |
| Ops alerts | `purge-worker` | `ALERT_EMAIL` | alert kind and count | any id; one per kind per day (`alerts.ts:16`) |
| Analytics deletion | `analytics-forget` | PostHog private API | random analytics ids only | any person id |
| Apple token exchange and revoke | `apple-token`, `purge-worker` | `appleid.apple.com` | one-time code, client secret (10-minute ES256) | the user's email |
| **APNs** | **nobody** | **Apple** | **nothing exists** | see section 6 |
| Store notifications (App Store server) | not built on the main project beyond tables `store_notifications` (no policy, definer only) | n/a | n/a | [U] receiver endpoint not found by grep |

## 6. Push and APNs: the claim, verified

Claim: "We have no remote push today." **Verified true** by these checks on `develop` (20 Nov):
1. `app.config.ts:96-107` removes `aps-environment` from the written entitlements with a mod (`withoutRemotePush`, applied at `:212`), and says "nothing in the app asks for a push token". The test `apps/mobile/test/config.test.ts:475-503` evaluates the config and asserts no `aps-environment` in any profile. [V]
2. `grep -rn "getExpoPushTokenAsync\|getDevicePushTokenAsync\|registerForPushNotifications\|addPushTokenListener\|remote-notification" apps/mobile/src apps/mobile/app.config.ts apps/mobile/package.json` returns nothing. `expo-notifications` is used only for local scheduling (`src/lib/reminders/scheduler.ts`, `src/lib/billing/plan-reminders.ts`). [V]
3. No `remote-notification` background mode: the only `UIBackgroundModes` mention in `app.config.ts:304-309` is the comment that keeps `audio` off. [V]
4. Server: no table, column, function or secret for push tokens or APNs keys in `supabase/migrations`, `supabase/functions` or `.github/workflows` (grep -i `apns|push_token|push token|aps-environment` over `supabase`, `.github`, `apps/web/src`, `apps/mobile/src`, `app.config.ts`, `eas.json`, `packages/api`, `packages/emails/src`: only `app.config.ts`, which strips the key, and `packages/api/src/server/push.ts`). [V]
5. `packages/api/src/server/push.ts:1-40` holds payload shapes only ("Shapes only: `push-send` is WP-F11-09f"): a strict object with a kind and two short strings, two kinds (`co_parent_letter`, `restore_request`). No sender exists. [V]
6. Docs agree: `docs/design/NOTIFICATIONS.md:10,36`, `docs/ops/RELEASE.md:165`, `docs/tdd/new-scope/security.md:261`, `data-and-sync.md:148` (NS-26 parked). [V]

So today a notification is local: it is scheduled on the phone, its text is made on the phone, and nothing about it crosses our servers or Apple's push service.

**If remote push is ever decided (founder decision, not mine), this changes.** Minimum design, each item a MUST before launch:
- New secret: an APNs auth key (`.p8`, key id, team id), held only by a new `push-send` function's secrets; never in the app, CI or an agent (SK-06). New row in section 2 and in `SECURITY.md`.
- New data: a device push token per install, **L3** (NS-26, `tdd/new-scope/privacy.md:140`: the store privacy label "Other Data" or none is Q54(d), a counsel and founder question). New table with RLS on, no client select, one `grants.mjs` row, deletion on sign-out and account deletion, 30-day purge of dead tokens (APNs reports them), and a row in file 01.
- New client work: remove `withoutRemotePush` and request the entitlement on purpose (`app.config.ts:100-102`); request permission only after a reason the parent understands; the config test flips to assert the entitlement exists in the right profile only.
- New endpoint: `push-send`, server-to-server only, never callable with a user JWT, triggered by a database event or cron with a service-side bearer; per-person rate and collapse (the shapes say one co-parent push per author per book per 2 hours, `push.ts:25`). It must refuse any payload that does not parse as `PushPayloadSchema`.
- Payload rules (L4 never in a push, `DATA_CLASSIFICATION.md:38`; `DECISIONS.md:178`): kind and fixed words only, no child name, no letter text, no id of any kind. The payload passes through Apple, so treat it as public. A push only wakes the app, which then pulls over the authenticated path.
- New vendor: Apple's push service becomes a subprocessor for tokens. Counsel and the privacy policy first (file 06).
- Abuse: a leaked key lets an attacker push to every token; rotate in Apple's portal, redeploy. A phishing risk follows: a forged "new sign-in" push. Hence no security alert is ever sent as a push (section 7, S-06).
- Security alerts do not need push: email and in-app are enough for v1.0. **Rec** keep it that way.
Founder decision needed: yes or no, and for which kinds (NS-26 only, or also restore requests). Default: no remote push in v1.0.

## 7. Account-security signals the server can emit

What exists today, what a signal may carry, and what it may never carry. "Emits" means a code path sends or records it now. Words are PROPOSED content keys owned by file 07 and `packages/content`; I decide only the data.

| # | Signal | Emits today | Source | May contain | Must never contain | Channel |
|---|---|---|---|---|---|---|
| S-01 | Repeated wrong sign-in codes | **No.** Supabase Auth throttles (`token_verifications` 30 per IP per 5 minutes, `config.toml:56`) and keeps its own log; we store nothing and notify no one | Supabase Auth | if built: a count over a window, never the code | the code, the address in a log line, the IP in our database | in-app line on next sign-in; email only if the person asked for the code |
| S-02 | Wrong invite codes | counters only: `invite_redeem_failures` rows of scope, hashed subject, time (`invite_redeem_by_code.sql:53-59`); a global pause message `codes_paused` | `invite-redeem` | scope, hash, time; counted over a rolling hour (retention of the rows: [U]) | the code, the address, the person's id in clear | none to the person; **Rec** one ops alert when the global scope trips (not built, G-04-05) |
| S-03 | New sign-in on a device | **No** (E76, E78: not built for 1.0; a hard gate before the backup flip, NS-08-R21). Template `new-device-sign-in` exists, no trigger (`supabase/templates/README.md:50`) | Supabase Auth has no per-device hook we use | device label (model family), city-level or none, time | IP, full device id, any letter or child data | email to the account address |
| S-04 | Sign-in method added or removed, email changed | **Yes**, Supabase notifications: `identity_linked`, `identity_unlinked`, `email_changed` enabled (`config.toml:110-121`); email change needs both addresses to confirm (`:68`) | Supabase Auth | provider name, new address in the email to the old one | token, code | email to old and new address |
| S-05 | Account recovery of the book (restore on a new phone) | **Yes, built, off**: `backup-restore-requested` email at request, `backup-key-used` per opening, `backup-key-rotated` (`escrow/restore.ts:116,173`, `rotate.ts:102`) | `escrow` | time, device label "iPhone", a short reference id, the stop link | key material, the other devices' names, the book's name | email, before any key is released (the release waits for the email, `restore.ts:9-12`) |
| S-06 | Deletion requested, cancelled, completed | **Yes**: three emails in `purge-worker/emails.ts:49-61`; audit rows `account_deletion_requested`, `_cancelled`, `_completed` | purge worker, RPCs | scheduled date, a reference id, whether a subscription is active | list of books, names, counts of letters | email, never push |
| S-07 | Co-parent joined, removed, left, invite used | audit rows only (`member_joined`, `member_removed`, `left_book`, `member_join_undone`); `coparent-left` email template exists, trigger not found | RPCs | inviter display name, role | the book's contents | in-app; email **Rec** to the other parent |
| S-08 | Session ended everywhere or forced re-sign-in | partial: `forceReauthEpoch` signs phones out locally, no email; global sign-out is the person's own (`sign-everyone-out.md`, not run) | remote config, app | none | n/a | in-app line |
| S-09 | Step-up required | **Yes** for backup deletion (`SCSTP`, `backup_server.sql:1013-1023`); **not** for account deletion (G-03-02) | RPC | none | n/a | in-app |
| S-10 | Our own ops alerts | yes: deletion SLA kinds (`tombstones_overdue`, `request_stuck`, `step_failed`, `queue_stuck`, `scheduled_overdue`) to `ALERT_EMAIL` | purge worker | kind and count | any id | email to the founder |

Rules for every signal: content-free (no letter, child name, family detail, transcript); the recipient is the account's own verified address only; the email says what happened and what to do, with no link that signs anyone in except the Supabase link they asked for; "we never ask for a code or password" line on every security mail (`auth.en.ts:201`); never sent as push (**Rec**, default no, founder decides, section 6); every send is logged as a closed enum with the template id, never the address; and a person can always see it again in the app. A signal about person A is never sent to person B except S-07 to the other parent. Frequency and quiet hours: file 07.

## 8. Threat model summary (entries for `docs/security/threat-model.md`, which does not exist)

| Id | Asset (level) | Entry point | Abuse case | Control | Test or proof | Residual |
|---|---|---|---|---|---|---|
| T1 | Letters, child details (L4) | PostgREST with the publishable key | read or write another family's rows | RLS, column grants, definer RPCs | `access_matrix.test.mjs` six personas | hosted state [U] |
| T2 | Service key (S) | Edge Function env, founder shell | leak lets caller run purge or deletion RPCs, list or delete users, read or delete Storage objects | no table grants, 44 RPCs, audit; Auth admin and Storage reach NOT limited by grants (residual) | `grants.mjs`, `explicit_grants.test.mjs` | one key for all functions (G-04-06) |
| T3 | Session (S) | stolen phone or token | act as the person for up to a refresh lifetime | Keychain this-device-only, 15-minute JWT, rotation with reuse detection, step-up for backup delete | `config.toml:41-43`, `secure-storage.ts:24` | no step-up for account deletion (G-03-02) |
| T4 | Signing key (K) | founder's machine | forged remote config or content bundle | key only on founder machine, two keys, app verifies | `packages/api` integrity tests | compromise needs an app release |
| T5 | Recovery key (S) | escrow project | open someone's backup | two projects, pinned public key, email before release, stop link | `escrow` tests | stop page not built (G-04-02) |
| T6 | Invite codes (L3) | `invite-redeem` | guess an 8-character code (about 40 bits) | per person, install, address and global limits in one transaction | `invite_redeem_by_code.test.mjs` | address header spoof [U] |
| T7 | Launch list (L3) | `/api/notify` | enumerate addresses, flood Resend | honeypot, per-client limit, answer reveals only "already" for active contacts | `apps/web/test`, `e2e/notify.e2e.ts` | WAF rule unverified (G-04-07) |
| T8 | Repo and agents | PRs, issue text, workflows | prompt injection, mutable action tags, secret exfiltration | no Supabase secret in agent workflows, `approve-migration` label, `pull_request_target` without checkout | `compliance-fence.yml` has no checkout | 17 unpinned actions (G-04-04) |
| T9 | Push (none) | n/a | n/a | not built | `config.test.ts:475-503` | decision pending |
| T10 | Email as phishing channel | forged "security" mail | trick a parent into a link | SPF, DKIM, DMARC, one sender domain, no sign-in links except the one asked for | [U] DNS state, SEC-R22 not yet | founder DNS change |

## 9. Gaps found (file and line)

| Id | Gap | Where | Severity | Owner |
|---|---|---|---|---|
| G-04-01 | **Ruled (D-20nov A5), see section 13.** No secret scanning in CI: SEC-R03 says a gitleaks job is "pending PR #30"; `.github/` has no `security.yml`, no `dependabot.yml`, no `audit-ignore.json` (`ls`; `grep -rl gitleaks .github` finds `CODEOWNERS` only). SEC-R08 and SEC-R09 are therefore also not enforced. | `.github/workflows/` (absent files) | High: the repository is public and agents commit every 30 minutes | security, qa |
| G-04-02 | **Ruled (D-20nov C7, B5), see section 13.** The "Stop this and sign out" link in the restore email goes to `https://earlyletters.com/stop`, which is not built: no `stop` route in `apps/web/src/app`, and nothing calls `backup_svc_stop` (grep). The only control a person has against a hostile recovery request, besides Settings, is a dead link. Dormant while backup is off. | `packages/content/src/emails/backup.en.ts:17,43`; `supabase/functions/escrow/restore.ts:100`; `apps/web/src/app/` | High before backup ships | web, ops |
| G-04-03 | Both public-key lists are empty: `BUNDLED_ESCROW_KEYS` (TODO) and `PINNED_PUBLIC_KEYS`. So backup cannot be turned on until the key ceremony; right and safe, but a release checklist item. | `apps/mobile/src/lib/backup/escrow-keys.ts:12-14`; `escrow/public-keys.ts:19-21` | Info | founder, ops |
| G-04-04 | **Ruled (D-20nov A5): pins first.** 17 workflow steps use mutable tags (`actions/checkout@v4`, `setup-node@v4`, `cache@v4`, `upload-artifact@v4`) in `ci.yml` (7), `web.yml` (3), `web-e2e.yml` (5), `migration-guard.yml` (2). SEC-R10 requires full SHAs; chapter 06 says `agents.yml` is the unpinned one, and it is now pinned (stale). | `.github/workflows/ci.yml:31,32,38,55,70,81,92`; `migration-guard.yml:20,23`; `web.yml:52,54,61`; `web-e2e.yml:43,45,50,61,77` | Medium | qa, ops |
| G-04-05 | **Ruled (D-20nov C3), see section 13.** No security event store or alert: SEC-R24 (`security_events`) is not built; wrong sign-in codes, a tripped global invite pause and new-device sign-ins leave nothing we can see or send. | no table in `supabase/migrations` (grep `security_events`) | Medium | data-architect, sync |
| G-04-06 | **Ruled (D-20nov C2): a database role per function, not a platform key.** One secret key per project, shared by four functions. The most exposed function (`invite-redeem`, internet-facing and doing a service RPC) and the destructive one (`purge-worker`) share it. | `_shared/keys/keys.ts:31-33` | Medium | ops, [U] platform support |
| G-04-07 | The website launch-list form relies on in-memory limits that Vercel instances do not share; the real limit is a WAF rule nobody has confirmed. | `apps/web/src/lib/notify/rate-limit.ts:1-10` | Medium | ops (founder console) |
| G-04-08 | Rules point to files that do not exist: `docs/ops/SECRETS.md` (SEC-R02), `docs/security/threat-model.md` (SEC-R01), `SECURITY.md` at the root and `docs/ops/INCIDENT.md` (SEC-R23). `docs/ops/SECURITY.md` and the runbooks cover part of it. | `docs/engineering/06-security-engineering.md:29,33,85` | Low | security, ops |
| G-04-09 | Hosted Data API exposed-schema list, `pg_graphql` and Realtime state, and Auth rate limits are only checklists in `SECURITY.md:123-136`; `config.toml` has no `[api]` block and applies to the local stack only. | `supabase/config.toml:1-12`; `SECURITY.md:123-136` | Medium until read back in the dashboard | ops |
| G-04-10 | **Ruled (E78, NS-08-R21), see section 14.** The new-device email (P0 in PRD V2, F02-REQ-017) promises "we will sign that device out" and has no sender or lever (see file 03, G-03-05); the signal S-03 does not exist. | `supabase/templates/README.md:50`; `auth.en.ts:199` | Medium | sync |
| G-04-11 | No test forbids a secret-looking name in `EXPO_PUBLIC_*` (section 3). | `apps/mobile/test` (absent) | Low | security |

## 10. Conflicts

- **Conflict (chapter 06 vs code):** SEC-R10 says `agents.yml` is the unpinned workflow; it is pinned and four others are not. Route: security-architect fixes the chapter text through the RFC handoff; the pinning goes to `qa`.
- **Conflict (chapter 06 vs repo):** SEC-R03, R08, R09 cite PR #30 for `security.yml`, `dependabot.yml`, `audit-ignore.json`; none is on `develop`. Route: `qa` and the founder (is PR #30 still wanted, or is the work re-planned).
- **Conflict (function file vs card):** the notification catalogue and function files list co-parent push (F11, NS-26); `NOTIFICATIONS.md:36` and `security.md:261` say not in v1.0. Cards win (CR-66): NS-26 is parked, so no push work is planned. Route: product to confirm in the feedback loop that no v1.0 row depends on push.
- **Conflict (PRD V2 vs templates):** the new-device sign-in email is P0 and "before any escrow release" in PRD V2 (`docs/prd/v2/reviews/DISPOSITION-B.md:72`, F02-REQ-017, F02-U33 at `docs/prd/v2/features/F02-account.md:182`), and "1.0, not launch-blocking" in `supabase/templates/README.md:50`. No sender exists in code either way. Route: product, question `F02-REQ-017` posted on this PR; default engineering builds nothing until answered, and backup stays off. **Superseded by the Conflict in section 14 (E78 and the founder's decision).**
- **Conflict (config vs chapter):** `config.toml` header says Google sign-in in v1.0 (D-054); IAM-R05 follows D-044 (v1.1). Same as file 03; product and founder.

## 11. Questions for the council (each with a default)

1. Founder: remote push, ever? E79: none in 1.0 (no APNs key, token table or push entitlement); if ever, only NS-26 co-parent push, fixed words, never a security alert, and the first PR is a rule file (D-20nov B1).
2. CISO: distinct secret key per function? CLOSED by D-20nov C2: no wait for the platform; a database role per function, `purge-worker` keeps the key alone.
3. CISO: build `security_events`? CLOSED by D-20nov C3: yes, its own service-only store, 12 months, named reader (section 13).
4. CCO and counsel: is a new-device email required or only offered? Whether it is a legal duty stays counsel's. When it is built is settled: section 14 (E78, founder's decision).
5. CPO: S-07 email to the other parent when a co-parent leaves? Default: in-app line only.
6. CTO: `security.yml` and SHA pins? CLOSED by D-20nov A5: two PRs, pins first, then scanning; PR #30 is not revived whole.
7. Founder: the stop page? CLOSED by D-20nov C7: backup stays off, and a preflight check enforces it (section 13).

## 12. What I could not verify

- Any hosted project setting (secrets present, exposed schemas, rate limits as applied, SMTP, DMARC, Vercel WAF, GitHub secret scanning, Environment reviewers). No console access, by rule.
- That the tests named pass today; I read them, I did not run `npm run test:db` or `test:functions`.
- Whether `CLIENT_IP_HEADER` is spoof-proof on the platform; a first staging deploy step.
- The scope of the website's Resend key and of `SUPABASE_ACCESS_TOKEN_STAGING`.
- Whether any receiver exists for App Store server notifications (`store_notifications` table has no writer I found).
- External pages (Apple push, Supabase keys) were not fetched today; the Supabase API-keys claim is as checked 3 Oct 2026 in chapter 06.

## 13. Council amendments (20 Nov 2026)

Gates: G13 before the Build 13 cut, GF before the first outside family signs in, G10 before 1.0. The record gives a gate only for C2 and C3; every other gate below is [E], my proposed placement. Checked on `develop` 20 Nov: `TRUSTED_SIGNING_KEYS` lists two keys, `el-2026-11` and `el-2026-11-backup` (`packages/api/src/keys.ts:21-22`) [V]; four functions read the one secret key through `secretKeyOf` [V]; 17 mutable-tag action steps [V, count taken from G-04-04]; `EXPO_PUBLIC_BACKUP` is checked "off" by `apps/mobile/scripts/preflight-production.mjs:179-186` [V].

| Item | Decision | Change | Gate | Enforced by, status |
|---|---|---|---|---|
| C2 | role per function | Section 2.2 and G-04-06: `invite-redeem` first, then `apple-token`, `analytics-forget`, each on a login role with EXECUTE on one function and a connection-string secret (founder sets each); `purge-worker` keeps the secret key alone. Add the roles to the secrets inventory when built | GF | not yet |
| C3b | `security_events` | Own store, service-only, 12 months, keyed-hash subject, closed kinds (list in file 03 section 16). Reader named: `ops`, one alert email to the founder, threshold in the PR. A new sender function is a new endpoint and needs a threat-model row first (D-20nov D1) | GF | not yet |
| C7, B5 | backup preflight | Extend `preflight-production.mjs` (today it only requires "off") so a build with `EXPO_PUBLIC_BACKUP` on fails unless: `BUNDLED_ESCROW_KEYS` and the function's pinned list are non-empty, `GET /stop` returns 200 (route absent today, G-04-02), and B5 is done: `backup-<id>.db` excluded from device backup, deleted on Erase and on sign-out, `upload_token` moved to the Keychain, with a test that fails if the file is created without the flag | [E] GF; backup stays off until all hold | not yet |
| A5 | pipeline | Two proposals, the founder pastes (workflow writes are his): (1) pins: the same-major SHAs of BRIEF-CI-PIN (resolve `upload-artifact` with `git ls-remote` and paste the output, never from memory) plus a test that fails on any tag-pinned action; (2) scanning: gitleaks over full history, `npm audit` with an `audit-ignore.json` whose every entry has a reason and an expiry, `docs/ops/proposed/dependabot.yml`. Pins first; scanning second. PR #30 is not revived whole | [E] pins G13, scanning GF | not yet |
| A5 deploy | two-job deploy (proposal, the founder pastes) | Keep required approval (GitHub Environment reviewers) on BOTH jobs, as SEC-R04 requires. Job 1 (dry run) additionally runs only from a trusted ref: a `db-v*` tag on a commit on `main`, never a pull request or a fork, so the production owner-role URL (`SUPABASE_DB_URL_PROD`) is out of reach of the pull-request path. The earlier idea of a job 1 with no reviewers (BRIEF-F4) is NOT adopted here; see the Conflict line below | [E] GF | not yet |
| C9 | insights grant | Drop `insights_reader` to `authenticator` (file 03 section 16) | [E] GF | not yet |
| F3 | label guard | A guard is a control only once a PR cannot merge without it passing: needs a required check; the 31 Oct read is stale, ask for a fresh read-back | [E] GF | [U] |

Conflicts (this section):

- **Conflict (D-20nov A5 and BRIEF-F4 vs SEC-R04, `06-security-engineering.md:37`):** SEC-R04 is a MUST: deploy secrets live in a GitHub Environment with required approval. A job 1 with no reviewers would weaken it. This file keeps approval on both jobs. If the founder wants one click instead of two, that is a founder-granted exception (a D-### entry or the PR body, `06-security-engineering.md:111`) or an SEC-R04 amendment by RFC; I do not choose it.
- **Conflict (C2 vs SEC-R04 "one secret key per backend component"):** the ruling replaces a platform key per function with a database role per function. My reading: a login role with EXECUTE on one function and its own connection string is the "component-scoped credential" SEC-R04 asks for, and `purge-worker` holds the one secret key alone. That reading is mine [E]; chapter 06 is not edited here. Confirm in the RFC that amends SEC-R04.
- **Conflict (C3b vs SEC-R24, `06-security-engineering.md:87`):** SEC-R24 says actor, action, target ids and time. The keyed-hash subject (no person id in clear) is a stricter reading of "target ids" and is my design [E], not part of the ruling. SEC-R24 also lists session revocation, kill switches and function deploys, which the minimum kinds in file 03 section 16 do not cover. Founder and RFC decide whether SEC-R24 narrows or the kinds grow.

New gaps:

- **N-1 Which project is production.** `APPLY.md:3` `early-letters`; `DEPLOY.md:35-36` `scribe-staging` and `scribe-prod` (both "does not exist yet"); `PRODUCTION_VARIABLES.md:5` (on develop, status draft) `scribe-prod` for Build 12. The secrets inventory above (2.1, 2.6) names `SUPABASE_DB_URL_PROD` and `PROD_*` by purpose and cannot say which project they open until the founder names it (D-20nov A2, question 2). Founder, one line.
- **N-2 Detection owner.** Proposal as in file 03 N-2: `ops` reads `security_events` on a schedule the founder sets; founder confirms. Also unread, so [U]: Auth rate limits, exposed-schema list, Vercel WAF rule, secret presence. One founder sitting from the `SECURITY.md:123-136` checklist, recorded in the repo (D-20nov D3).
- **N-3 Purged-id guard.** The keyed-hash design [E] needs one more secret, the HMAC key: purpose purged-id fingerprint; holder the founder, set as a database secret, never in the repo, the client or CI. It cannot be rotated in place: once an id is purged only its hash remains, so nothing can be re-hashed. This cuts across SEC-R05 (rotate on exposure). Rotation rule [E]: on exposure add a new key and check each id against both the old and the new hash until the longest offline window of a phone (file 03 N-3) has passed, then retire the old key; hashes made under the old key are not recoverable if that key is destroyed early. Exposure of the key alone gives an attacker a way to test a guessed id, not a list of ids. The retention promise is in file 03 N-3.

Not verified: anything on a hosted project; whether Supabase allows a per-function login role through its pooler [U]; the current GitHub required-check settings [U, last read 31 Oct].

## 14. Re-sync to errata E76 to E81 (20 Nov 2026, develop `df2c3502`)

Ids: E76 to E81 (`docs/product/prd/18-errata-after-lock.md:129-134`), FR-SEC-36 (`docs/product/prd/functions/risk-security.md:316`), NS-08-R21 (`docs/product/prd/08-keeping-and-trust.md:136`). Rows here replace any "proposed" wording above; file 03 section 17 has the access side.

- **No push (E79).** No APNs key, no token table and no push entitlement in 1.0. The `aps-environment` strip (`apps/mobile/app.config.ts:96-107`, `withoutRemotePush`) and its test (`apps/mobile/test/config.test.ts:475-503`) stay. This is section 6, point by point, unchanged [V, both files read 20 Nov]. A security alert is never sent by push in any case (D-20nov B1).
- **No new alert email at 1.0 (E76, E77, FR-SEC-36).** Signals S-04, S-05 and S-10 stand as built; S-03 stays unbuilt. "Sign out other devices" sends no email. No email follows wrong sign-in codes, and no server count or paging job is added for them (the phone's own pause stands). If a server counter is wanted later, it is mine to propose with an owner: proposal [E], owner `ops`, feeds `security_events` only after the founder asks.
- **New-device email (E78, NS-08-R21).** A new sender is a new endpoint: it gets a threat-model row, its own single-function login role (file 03 section 6, C2) and a connection-string secret held by the founder before it ships. Device table: L3, service role only, keyed hash (HMAC, function secret named by purpose "device hash", holder founder as a database secret, never repo or client) [E]. The "Not you?" page is public and acts only on a button press (a GET from a mail scanner must change nothing), signs out that one session only, and writes a `security_events` row. The email carries no action link other than that page and no child or letter data (07.2 rule 3, D-20nov D1). Status: not yet.
- **Alert cap (E81).** Any alert sender, NS-08-R21 first: first 5 an hour one by one, the rest folded into one summary within minutes, 20 alert emails per account per day as a backstop that logs its own breach to `security_events`; never on sign-in codes. The number 20 is a reviewer's number [E, per D-20nov D2], now carried by E81. Test: a cap test is part of the sender's PR.
- **`dictionary_terms` (E80).** Stays built and unreachable; not an endpoint. Nothing to add to section 5.

Conflict (E78 vs the founder's decision): E78 / NS-08-R21 gate the new-device email before the backup flip; the founder decided (DECISIONS-20nov.md section 8 item 7) before the first outside family. The founder's date is earlier and so stricter: building the email before the first outside family satisfies both. Cards win on wording (CR-66), so product records the founder's decision in an erratum; engineering builds to the stricter gate. Backup stays off until the email and B5 and C7 (section 13) hold, as before. File 03 section 17 has the same text.

Not verified: any hosted state; the sender, table and page are unbuilt.
