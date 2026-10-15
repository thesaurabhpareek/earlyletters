---
title: Backend (parked for v1.1)
owner: reference-docs
covers: [supabase/**, packages/api/src/**, .github/workflows/deploy-db.yml, apps/mobile/src/lib/sync/**, apps/mobile/src/lib/supabase/**]
verified_at: 56ec5b5
verified_on: 2026-10-15
---

# Backend (Supabase)

**Nothing on this page is used by the v1.0 app.** v1.0 is on-device only; sign-in, sync, co-parent sharing and backup are parked for v1.1 (issue #127, 14 Oct 2026). With `EXPO_PUBLIC_SERVER_FEATURES` off, `apps/mobile/src/lib/supabase/client.ts` returns no client and `startSync()` returns at once (`apps/mobile/src/lib/capabilities.ts`). Of the 12 migrations on `develop`, only the 2 in `.github/migrations-applied.txt` are applied to the live project. Whether any Edge Function is deployed is **unverified**: no record of a deploy was found in the repo.

The pieces below are built and tested so v1.1 can switch them on. Reasons: ADR 0004 (sync, amended by D-023), ADR 0016 (signed documents), ADR 0017 (API standards), D-041 (two projects, CI-only migrations).

## Layout

| Path | What |
|---|---|
| `supabase/config.toml` | Local CLI stack only (`project_id = "scribe"`, Postgres 17, auth with email on, Apple and Google off until credentials exist, anonymous sign-in off). No secret values: every credential is an `env()` reference. Hosted settings are set in each dashboard (`docs/ops/DEPLOY.md`) |
| `supabase/migrations/` | Schema, row-level security, RPCs. Listed in [data-and-storage.md](data-and-storage.md#the-server-schema-parked) |
| `supabase/functions/` | Deno Edge Functions, listed below; `_shared/log` is the content-free logger and its canary test |
| `supabase/cron/purge-worker.sql` | Not a migration: run by hand once per project to schedule the purge worker with pg_cron and pg_net, secrets in Vault |
| `supabase/templates/` | Generated Supabase Auth email HTML; source is `packages/emails` and `packages/content/src/emails/auth.en.ts` |
| `supabase/auth-email.md` | Runbook: Auth email through Resend custom SMTP |
| `supabase/APPLY.md` | Manual steps to apply pending migrations to the current live project |
| `supabase/tests/` | Access-rule and behaviour tests on embedded Postgres (PGlite), run by `npm run test:db` |

## Edge Functions

<!-- facts:edge-functions -->
- `supabase/functions/analytics-forget`
- `supabase/functions/config`
- `supabase/functions/content`
- `supabase/functions/purge-worker`
<!-- /facts:edge-functions -->

| Function | Routes | Auth | What it does |
|---|---|---|---|
| `config` | `GET /config/v1/remote-config`, `GET /config/v1/packs` | Public (`--no-verify-jwt`) | Serves the signed remote config and pack manifest held in `published.ts` |
| `content` | `GET /content/v1/bundle?locale=en` | Public | Serves the signed content bundle (prompts, tips, story cards) |
| `purge-worker` | Body `{"task": "run" \| "daily"}` | Bearer `PURGE_WORKER_SECRET`, compared in constant time | Every 15 minutes: `purge_due` in batches, drains the Storage purge queue, deletion emails, due account deletions, SLA alert. Daily: ledger copy and ops retention (`worker.ts`, `daily.ts`) |
| `analytics-forget` | `POST /functions/v1/analytics-forget/v1` | Signed-in user's token | Deletes PostHog persons for random analytics ids at deletion time; ids are never stored or logged (`handler.ts`) |

`config` and `content` hold no user data. Their documents are signed offline by `scripts/packs/publish.ts`, which writes `published.ts` and prints the deploy commands; it runs none of them. The app fetches these documents only from `EXPO_PUBLIC_DOCS_BASE_URL` while server features are off (`apps/mobile/src/lib/remote/base.logic.ts`), so in v1.0 these two functions would be reached only if that URL pointed at them.

Functions import shared code from outside `supabase/` (deployed with `--use-api`): `packages/api` (response envelope, standards), `packages/brand` and `packages/content` (purge-worker emails).

## Main RPCs by area

All in `public` unless noted; names from `create function` in `supabase/migrations/*.sql`. Later files replace earlier versions of the same function.

| Area | Functions | File(s) |
|---|---|---|
| Books and members | `create_child`, `create_first_run_children`, `is_child_member`, `is_child_parent`, `my_role_in`, `leave_child`, `remove_child_member`, `max_parents_per_book` | `scribe_core`, `children_and_entitlements`, `plus_on_device_only`, `family_cap_language_idempotency` |
| Invites | `create_child_invite`, `accept_child_invite`, `revoke_invite` | `scribe_core`, `security_and_family`, `family_cap_language_idempotency` |
| Family letters | `review_family_letter`, `withdraw_family_letter`, `set_member_auto_add`, `my_auto_add_in` | `data_governance`, `security_and_family` |
| Consent | `record_policy_act`, `policy_actions_needed`, `my_sync_gate`, `has_active_consent`, `require_content_consent`, `content_gate_state` | `data_governance`, `security_and_family` |
| Letters and deletion | `delete_entry`, `restore_entry`, `request_book_deletion`, `cancel_book_deletion`, `request_account_deletion`, `cancel_account_deletion`, `finalize_account_deletion`, `purge_due` | `data_governance`, `purge_batching`, `family_cap_language_idempotency` |
| Sync | `sync_pull`, `sync_push`, `sync_books`, `sync_begin_epoch`, `sync_housekeeping` | `sync_engine`, `family_cap_language_idempotency` |
| Requests | `idempotency_claim`, `idempotency_store`, `request_idempotency_key`, `rate_hit` | `family_cap_language_idempotency` |
| Operations (service role) | `ops_*` (deletion work, residue, SLA, ledger, retention, Apple tokens, schema health) | `ops_deletion_worker` |
| Insights (service role and `insights_reader`) | `insights_aggregates` | `insights_aggregates` |

Plus is not on the server: the entitlement functions and tables created in `children_and_entitlements` are dropped in `plus_on_device_only` ([plus-and-billing.md](plus-and-billing.md)). Error codes the app must handle are listed in `supabase/APPLY.md`.

## The app side (parked)

| Module | What it would do |
|---|---|
| `apps/mobile/src/lib/supabase/` | The one client, configured from `EXPO_PUBLIC_SUPABASE_URL` and its key; session in the Keychain |
| `apps/mobile/src/lib/sync/` | Outbox push then cursor pull (D-023): ordered upload queue in `sync_outbox`, refused writes in `rejected_writes`, per-book cursors in `sync_books`. Store writes enqueue in the same transaction; with sync off the outbox stays empty |
| `apps/mobile/src/lib/auth/`, `lib/family/`, `lib/account-deletion/` | Sign-in (Apple, Google, email), invites, account deletion |

## Contracts (`packages/api`)

Shared by the app, Edge Functions and scripts: the pack manifest, remote config, content bundle, the response envelope and errors, and integrity helpers (canonical JSON, Ed25519, SHA-256). Remote config has a closed vocabulary: kill switches only stop server-dependent features (`sync`, `invites`, `photos`, `packDownloads`, `serverContent`), and there is no key for analytics, consent, prices or the server-features switch (`packages/api/src/remote-config.ts`). Trusted signing keys: `packages/api/src/keys.ts`, empty on `develop`.

## How deploys work

Two paths exist, for two different targets:

| Target | How | State |
|---|---|---|
| The current live project `early-letters` | By hand in the SQL editor, following `supabase/APPLY.md`, then a line added to `.github/migrations-applied.txt` in a PR | 2 files applied (`scribe_core`, `scribe_hardening`); the rest pending. `docs/ops/DEPLOY.md` says this project is slated for retirement, pending the founder |
| New projects `scribe-staging` and `scribe-prod` | `.github/workflows/deploy-db.yml`: staging on a push to `main` that changes `supabase/migrations/**`; production on a `db-v*` tag on `main`, behind the `production` GitHub Environment. Dry run, then `supabase db push`. One Postgres URL secret per environment; no account access token | `docs/ops/DEPLOY.md`: the projects, environments and secrets do not exist yet and the workflow has not run |

Guards: `.github/workflows/migration-guard.yml` fails a change that edits, renames or deletes an applied migration, or adds one that sorts before the newest applied. `db-cli.yml` rebuilds the local stack from every migration and lints it on PRs that touch `supabase/**`. Edge Functions are deployed by hand with the Supabase CLI (commands in each function's `index.ts`). Secrets by name: [operations.md](operations.md#environments-and-secrets).
