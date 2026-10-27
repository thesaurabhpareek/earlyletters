---
title: Backend
owner: reference-docs
covers: [supabase/**, packages/api/src/**, .github/workflows/deploy-db.yml, apps/mobile/src/lib/sync/**, apps/mobile/src/lib/supabase/**]
verified_at: 1c6795b
verified_on: 2026-10-27
---

# Backend (Supabase)

**Only the `preview` build profile uses anything on this page.** In `apps/mobile/eas.json`, `preview` (alpha build 2, against the staging project; D-106) sets `EXPO_PUBLIC_SERVER_FEATURES=on`; `development`, `testflight` and `production` set it `off`, and `production` stays off until the R-17 security gate passes (D-100; [register](../decisions/INDEX.md); `docs/release/TESTFLIGHT.md`). Every profile sets `EXPO_PUBLIC_BACKUP=off`, `EXPO_PUBLIC_STATUS_REPORT=off` and `EXPO_PUBLIC_ANALYTICS=off`, so recording backup and the subscription status report are server code with no build that calls them (`apps/mobile/src/lib/capabilities.ts`); analytics stays off in v1.0 (D-095). With `EXPO_PUBLIC_SERVER_FEATURES` off, `apps/mobile/src/lib/supabase/client.ts` returns no client and `startSync()` returns at once. Of the 25 migrations on `develop`, only the 2 in `.github/migrations-applied.txt` are applied to the live project `early-letters`; whether the staging project has them, and whether any Edge Function is deployed, is **unverified**: the repo holds no record of either.

The pieces below are built and tested so a build can switch them on. Reasons: ADR 0004 (sync, amended by D-023), ADR 0016 (signed documents), ADR 0017 (API standards), D-041 (two projects, CI-only migrations). Three proposed ADRs describe the newer parts: ADR 0023 (email sign-in links, PKCE), ADR 0024 (owner backup and the recovery key) and ADR 0025 (sync protocol v1).

## Layout

| Path | What |
|---|---|
| `supabase/config.toml` | Local CLI stack only (`project_id = "scribe"`, Postgres 17, auth with email on, Apple and Google off until credentials exist, anonymous sign-in off). No secret values: every credential is an `env()` reference. Hosted settings are set in each dashboard (`docs/ops/DEPLOY.md`) |
| `supabase/migrations/` | Schema, row-level security, RPCs. Listed in [data-and-storage.md](data-and-storage.md#the-server-schema) |
| `supabase/functions/` | Deno Edge Functions, listed below; `_shared/log` is the content-free logger and its canary test |
| `supabase/cron/purge-worker.sql` | Not a migration: run by hand once per project to schedule the purge worker with pg_cron and pg_net, secrets in Vault |
| `supabase/templates/` | Generated Supabase Auth email HTML; source is `packages/emails` and `packages/content/src/emails/auth.en.ts` |
| `supabase/auth-email.md` | Runbook: Auth email through Resend custom SMTP |
| `supabase/APPLY.md` | Manual steps to apply pending migrations to the current live project |
| `supabase/tests/` | Access-rule and behaviour tests on embedded Postgres (PGlite), run by `npm run test:db` |

## Edge Functions

<!-- facts:edge-functions -->
- `supabase/functions/analytics-forget`
- `supabase/functions/apple-token`
- `supabase/functions/config`
- `supabase/functions/content`
- `supabase/functions/escrow`
- `supabase/functions/invite-redeem`
- `supabase/functions/purge-worker`
- `supabase/functions/subscription-status`
<!-- /facts:edge-functions -->

| Function | Routes | Auth | What it does |
|---|---|---|---|
| `config` | `GET /config/v1/remote-config`, `GET /config/v1/packs` | Public (`--no-verify-jwt`) | Serves the signed remote config and pack manifest held in `published.ts` |
| `content` | `GET /content/v1/bundle?locale=en` | Public | Serves the signed content bundle (prompts, tips, story cards) |
| `purge-worker` | Body `{"task": "run" \| "daily"}` | Bearer `PURGE_WORKER_SECRET`, compared in constant time | Every 15 minutes: `purge_due` in batches, drains the Storage purge queue, deletion emails, due account deletions, SLA alert. Daily: ledger copy, the recovery-key access log copied to `escrow/<day>.run-<stamp>.jsonl` (a new file per run, never overwritten), the backup sweep (orphans, stale reservations, old restore requests), and retention including the subscription consent records (`worker.ts`, `daily.ts`). The 15-minute alert also reports a missing consent pepper (`pepper_missing`) |
| `analytics-forget` | `POST /functions/v1/analytics-forget/v1` | Signed-in user's token | Deletes PostHog persons for random analytics ids at deletion time; ids are never stored or logged (`handler.ts`) |
| `apple-token` | `POST /functions/v1/apple-token/v1` | Signed-in full account (gateway JWT check on) | Right after Sign in with Apple, takes Apple's one-time code, exchanges it, and stores the refresh token wrapped under `TOKEN_KEK_V<n>` so the purge worker can revoke it at account deletion. Answers 204 with no body. 10 calls per person per hour (`handler.ts`) |
| `invite-redeem` | `POST /functions/v1/invite-redeem/v1` | Signed-in full account (gateway JWT check on) | Joins a co-parent's book with the 8-character code, `mode` `peek` or `accept`. Throttles guesses (per person, device, client address and service wide) in one service-role RPC. See the gap below |
| `subscription-status` | `POST /functions/v1/subscription-status/v1/report`, `GET .../v1/salt` | Signed-in full account (gateway JWT check on) | Stores the plan status report and the purchase consent record (D-080, D-081). Uses the caller's token, no service key; needs an `Idempotency-Key` header. Never receipts or prices ([plus-and-billing.md](plus-and-billing.md)) |
| `escrow` | `POST /escrow/v1/restore-requests`, `.../<id>/release`, `/escrow/v1/rotate` | The main project's token, checked by the function itself (`--no-verify-jwt`) | Recovery key for recording backup (ADR 0024). Deployed only to a separate project `scribe-escrow`, only by the founder; `deploy-functions.yml` never deploys it. It connects to the main database as the `escrow_svc` role, which can run the `escrow_*` functions and nothing else. Off unless its `ESCROW_SWITCH` is `on` (`handler.ts`) |

`invite-redeem` calls the database function `invite_redeem_by_code`, which is in no migration on `develop` (`supabase/APPLY.md` says so, and the `access_matrix` test guards its grants for when it is added). Until it exists every code redeem answers 503, retryable; invite links are unaffected, they use `accept_child_invite` ([family.ts](../../packages/api/src/server/family.ts) lists what is still requested).

Every function except `invite-redeem` and `escrow` also answers `GET` or `HEAD` `/functions/v1/<name>/health` (#202, `supabase/functions/_shared/health/health.ts`): 200 `ready` when it is deployed with its required settings, 503 `unavailable` otherwise, content-free and never naming a missing setting. Reachable without a session only for the functions deployed without the gateway JWT check (`config`, `content`, `purge-worker`; `NO_VERIFY_JWT` in `.github/scripts/functions-deploy.mjs`); behind the gateway the other health routes need a session, so the deploy smoke checks only those three and confirms the rest in the CLI's function list.

Shared code: the JSON functions `apple-token`, `invite-redeem` and `subscription-status` use the same request handling (`supabase/functions/_shared/http/http.ts`: envelope, body size cap, idempotency key rules, session check, and the server-side `KILL_SWITCHES` secret). `escrow` imports nothing from outside its folder and makes its own request ids.

`config` and `content` hold no user data. Their documents are signed offline by `scripts/packs/publish.ts`, which writes `published.ts` and the same documents for the pack host, and prints the upload and deploy commands; it runs none of them. The app fetches these documents only from `EXPO_PUBLIC_DOCS_BASE_URL` while server features are off (`apps/mobile/src/lib/remote/base.logic.ts`), and every `eas.json` profile now sets that to `https://packs.earlyletters.app` (#126, D-097), so builds from `develop` do not reach these two functions.

Most functions import shared code from outside `supabase/` (deployed with `--use-api`): `packages/api` (response envelope, standards, kill switches), `packages/brand` and `packages/content` (purge-worker emails).

## Main RPCs by area

All in `public` unless noted; names from `create function` in `supabase/migrations/*.sql`. Later files replace earlier versions of the same function.

| Area | Functions | File(s) |
|---|---|---|
| Books and members | `create_child`, `create_first_run_children`, `is_child_member`, `is_child_parent`, `my_role_in`, `leave_child`, `remove_child_member`, `max_parents_per_book` | `scribe_core`, `children_and_entitlements`, `plus_on_device_only`, `family_cap_language_idempotency` |
| Invites | `create_child_invite` (a device-made-id overload beside the older one), `accept_child_invite`, `accept_child_invite_by_code` (service role, for `invite-redeem`), `peek_invite`, `undo_parent_join`, `revoke_invite` | `scribe_core`, `security_and_family`, `family_cap_language_idempotency`, `v1_gate_peek_invite_consent_pepper`, `v1_gate_coparent_invites_undo` |
| Family letters | `review_family_letter`, `withdraw_family_letter`, `set_member_auto_add`, `my_auto_add_in` | `data_governance`, `security_and_family` |
| Consent | `record_policy_act`, `policy_actions_needed`, `my_sync_gate`, `has_active_consent`, `require_content_consent`, `content_gate_state` | `data_governance`, `security_and_family` |
| Letters and deletion | `delete_entry`, `restore_entry`, `request_book_deletion`, `cancel_book_deletion`, `request_account_deletion`, `cancel_account_deletion`, `finalize_account_deletion`, `purge_due`, `prepare_account_purge` | `data_governance`, `purge_batching`, `family_cap_language_idempotency`, `sync_v1_server`, `s02_purge_and_consent_guards`, `purge_legal_holds` |
| Sync | `sync_pull`, `sync_push`, `sync_books`, `sync_begin_epoch`, `sync_housekeeping`, `book_update` | `sync_engine`, `family_cap_language_idempotency`, `v1_gate_membership_sync_hardening`, `v1_wire_contract_columns`, `sync_v1_server` |
| Subscription status | `status_report_store`, `status_salt`, `subscription_retention_purge` | `subscription_status` |
| Recording backup (signed-in) | `backup_register_device`, `backup_revoke_device`, `backup_store_key`, `backup_begin`, `backup_confirm`, `backup_discard`, `backup_delete_all`, `backup_pending_requests`, `backup_approve_request`, `backup_cancel_request` | `backup_server` |
| Recovery key (`escrow_svc` role only) | `escrow_request_context`, `escrow_open_request`, `escrow_load_wraps`, `escrow_record_unwraps`, `escrow_set_request_state`, `escrow_rotation_batch`, `escrow_rewrap_key`, `escrow_rotation_failed`, `escrow_rotation_notices_due`, `escrow_rotation_notice_sent` | `backup_server` |
| Requests | `idempotency_claim`, `idempotency_store`, `request_idempotency_key`, `rate_hit` | `family_cap_language_idempotency` |
| Operations (service role) | `ops_*` (deletion work, residue, SLA, ledger, retention, Apple tokens, schema health), `backup_svc_sweep`, `backup_svc_unwraps_between`, `backup_svc_stop`, `consent_pepper_ready` | `ops_deletion_worker`, `backup_server`, `v1_gate_peek_invite_consent_pepper` |
| Insights (service role and `insights_reader`) | `insights_aggregates` | `insights_aggregates` |

Plus is not on the server: the entitlement functions and tables created in `children_and_entitlements` are dropped in `plus_on_device_only` ([plus-and-billing.md](plus-and-billing.md)). The `subscription_status` migration stores only the status the phone reports (which plan, when a free period ends or renewal happens) for reminder emails, and never decides who has Plus (D-080). Error codes the app must handle are listed in `supabase/APPLY.md`.

## What the 13 newest migrations add

All 13 are pending: none is in `.github/migrations-applied.txt`. Each refuses a second run and never edits an earlier file. Details are in each file's header and in `supabase/APPLY.md`; the access-rule tests for each are in `supabase/tests/`.

| Migration | What it adds |
|---|---|
| `v1_gate_membership_sync_hardening` | Family members no longer read a child's birth or due date directly (column privileges); server rate limits through `rate_hit` (pull 120 a minute, push 60 a minute, entry state 300 an hour); search path pinned on security-definer functions |
| `v1_gate_peek_invite_consent_pepper` | `peek_invite` (the inviter's sign-off name and role, before joining); account deletion fails closed when `app.consent_pepper` is missing or short |
| `v1_gate_coparent_invites_undo` | Device-made invite ids and hashed codes; contributor invites refused unless `app.contributors_enabled`; 72-hour `undo_parent_join`; leaving only through `leave_child` |
| `v1_wire_contract_columns` | The frozen v1 sync columns on `entries` (date precision, text direction, author edits and more), all nullable or defaulted so an older client never clears them |
| `sync_v1_server` | Server half of ADR 0025: words compare and set (`text_xid`), `held_drafts` and the `held.upsert`, `held.discard` and `entry.erase` ops, an erasure record so an erased letter cannot return. `app.held_sync = 'off'` pauses held-draft sync |
| `subscription_status` | `subscription_status`, `subscription_consents` (append-only), per-account salt, `app.status_report_enabled` switch |
| `backup_server` | Tables `backup_devices`, `child_keys`, `audio_blobs`, `backup_usage`, `restore_requests`, `restore_approvals`, `escrow_unwraps`, `escrow_rotation_notices`; private bucket `entry-audio` (ciphertext only); switches `app.backup_enabled` and `app.escrow_enabled`, off by default and failing closed (SCBKO) |
| `s02_purge_and_consent_guards` | Consent tables append-only even for the service role; a former co-parent's letters survive the book purge (D-116) |
| `purge_legal_holds` | Legal holds stop the account and book purge for every row it would touch |
| `held_drafts_write_checks`, `entries_machine_edits_check` | Check constraints so a row the app's parser would refuse cannot be stored |
| `consent_grants_tightening`, `explicit_grants` | Privileges match row security; every table, view and sequence in `public` gets explicit grants so a project without automatic grants works |

Database test budgets: D-114.

## The app side (on only in the `preview` profile)

| Module | What it does when server features are on |
|---|---|
| `apps/mobile/src/lib/supabase/` | The one client, configured from `EXPO_PUBLIC_SUPABASE_URL` and its key; session in the Keychain. Email links use PKCE, so a link finishes only on the phone that asked for it (ADR 0023, proposed) |
| `apps/mobile/src/lib/sync/` | Outbox push then cursor pull (D-023), with the phone side of protocol v1 (ADR 0025, proposed; #146): each upsert carries a `base` version, a push batch carries at most one op per letter, and a words conflict keeps this phone's words as a conflict copy in `rejected_writes` (code `conflict`) until the author picks. Refused writes in `rejected_writes`, per-book cursors in `sync_books`. Store writes enqueue in the same transaction; with sync off the outbox stays empty. With it on, `killSwitches.sync` in the signed remote config pauses push and pull (phase `paused_server`) and an unreadable switch keeps sync paused. The server half of v1 (compare and set in `sync_push`, `held_drafts`, `entry.erase`) is the `sync_v1_server` migration on `develop`, not yet applied anywhere that the repo records. The engine also holds author-only held drafts (`held.upsert`, `held.discard`) and, after each pull, finishes erasing letters the server erased for good |
| `apps/mobile/src/lib/auth/`, `lib/family/`, `lib/account-deletion/` | Sign-in (Apple, Google, email), invites, account deletion |

## Contracts (`packages/api`)

Shared by the app, Edge Functions and scripts: the pack manifest, remote config, content bundle, the response envelope and errors, and integrity helpers (canonical JSON, Ed25519, SHA-256). Remote config has a closed vocabulary: kill switches only stop server-dependent features (`sync`, `invites`, `photos`, `packDownloads`, `serverContent`, and since M14 `backupUploads`, `escrow` and `statusReport`), and there is no key for analytics, consent, prices or the server-features switch (`packages/api/src/remote-config.ts`, `kill-switches.ts`). A config more than 7 days older than the newest server clock the phone has seen cannot clear a switch (F19-REQ-008). The Edge Functions read the same names from a `KILL_SWITCHES` secret. Contracts for server features (sync, family, subscription status, recovery key, push, escrow keys) sit in `packages/api/src/server/`, imported only through `@scribe/api/server` so a build with server features off never loads them. Trusted signing keys: `packages/api/src/keys.ts`, empty on `develop`; its comment says the founder generates two keys (a primary and a cold backup) with `node scripts/packs/keygen.mjs` and pastes the printed public keys there (`docs/ops/PACKS_HOSTING.md`; D-115). While it is empty the app fails closed: no downloaded pack installs and the bundled remote-config defaults stay.

## How deploys work

Two paths exist, for two different targets:

| Target | How | State |
|---|---|---|
| The current live project `early-letters` | By hand in the SQL editor, following `supabase/APPLY.md`, then a line added to `.github/migrations-applied.txt` in a PR | 2 files applied (`scribe_core`, `scribe_hardening`); the other 23 pending. `docs/ops/DEPLOY.md` says this project is slated for retirement, pending the founder |
| New projects `scribe-staging` and `scribe-prod` | `.github/workflows/deploy-db.yml`: staging on a push to `develop` that changes `supabase/migrations/**` (it applies `develop`'s tip; a manual run works on `develop` only), then the content-free staging smoke (`scripts/ops/staging-smoke.ts --db-only`); production on a `db-v*` tag on `main`, behind the `db-production` GitHub Environment (the name `production` belongs to Vercel). A push to `main` deploys nothing to a database (R-019, #205). Dry run, then `supabase db push`. `.github/workflows/deploy-functions.yml`: on a push to `develop` that changes function code, every function at `develop`'s tip goes to staging (never `escrow`, which only the founder deploys, never `--prune`), after staging has every migration, then the function health smoke | `docs/ops/DEPLOY.md`: the projects, environments and secrets do not exist yet and no workflow in it has run. Without `SUPABASE_ACCESS_TOKEN_STAGING` the functions run deploys nothing and says NOT DEPLOYED |

Guards: `.github/workflows/migration-guard.yml` fails a change that edits, renames or deletes an applied migration, or adds one that sorts before the newest applied. `db-cli.yml` rebuilds the local stack from every migration and lints it on PRs that touch `supabase/**`. Edge Functions reach staging through `deploy-functions.yml`; anything else is deployed by hand with the Supabase CLI (commands in each function's `index.ts`). The smoke's runbook: `docs/ops/runbooks/staging-smoke.md`. Secrets by name: [operations.md](operations.md#environments-and-secrets).
