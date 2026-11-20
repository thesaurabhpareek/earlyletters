# 05. Audit, logging and reporting

Owner: `privacy`. Written 20 Nov 2026 for the founder and the engineers who add a log line, an audit row or a metric. Part of the data and security pack (README is written by Karma). Companion: `06-data-use-retention-and-rights.md` (what each data class may be used for, how long it is kept).
Status: draft for the council. It changes no code, no migration, no legal text. I am a Claude role, not a lawyer; every legal reading is marked for counsel.
Tags: [V] verified (file and line read on `origin/develop` at `4d33978f`), [E] estimate with its basis, [U] unverified. Rec = my proposal, not a decision.
Classification ids: this file uses the levels and the table names of `docs/legal/DATA_CLASSIFICATION.md` (DC) 1.5.0: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. DC section numbers (for example "DC 4.1.2") stand in for the data-architect's inventory ids until document 01 lands; one find-and-replace maps them. I invent no level.

## 0. The rule in one paragraph

A log line, audit row, metric or crash report holds L2 values only: closed enums, counts, durations, SQLSTATEs, status codes, a random request id. Person, book and letter ids (L3) live only in two Postgres audit tables behind no API grant. Letter words, transcripts, audio, photos, child names, signatures, dictionary terms, search text, emails, tokens and object paths (L4, and email, path L3) never appear in any log stream, crash report, analytics event, alert, ticket or email subject (LEGAL-REQ-014; CLAUDE.md privacy rules; DC section 2 "Logging" row) [V ENGINEERING_REQUIREMENTS.md:128-133]. Allowlist, never blocklist: a field that is not on a list below does not exist.

## 1. Where things stand today (read this first)

| Fact | State | Source |
|---|---|---|
| Live database has migration files 1 and 2 only. `audit_events`, `ops.audit_log`, `escrow_unwraps`, the guards and every table in section 3.3 and 3.4 exist in the repo and its tests, not in production | [V] | `supabase/APPLY.md:48` ("`early-letters` has files 1 and 2 applied"), `:34` (file 32 not applied) |
| Production Supabase is on the Free plan: platform logs kept 1 day; no Platform Audit Logs (Team and Enterprise only) | [V] as read by the function reviews, 20 Nov; plan facts [U] against the dashboard | `docs/product/prd/functions/operations.md:30`, `reliability.md:28`, `back-office.md` FR-BKO-04 |
| In every 1.0.x build analytics is off: no PostHog or Sentry client constructed, `EXPO_PUBLIC_ANALYTICS` off | [V] | `apps/mobile/src/lib/analytics/index.ts:41`, `apps/mobile/src/lib/capabilities.ts:65,125`, FR-DAT-01, label 2.2.0 |
| The typed analytics catalogue is built and tested (68 events, `SCHEMA_VERSION` 8) and is the only legal shape for a metric when analytics returns | [V] | `packages/analytics/src/catalog.ts:212`; count of top-level keys of `EVENTS` between lines 215 and 935 |
| One server logger exists and is used by every Edge Function except `content` | [V] | `supabase/functions/_shared/log/log.ts:219-262`; import scan of `supabase/functions/*` (escrow has its own, `escrow/log.ts:1-9`) |
| No ESLint config, so the "no `console` in the app" rule is not machine-enforced on the device | [V] none of `.eslintrc*`, `eslint.config*` exist at the root | chapter 10 OBS-R05 |

So the honest sentence for any parent-facing claim today is the one in LEGAL-REQ-025 and FR-BKO-04: we do not say "every access is logged" [V `ENGINEERING_REQUIREMENTS.md:206-212`, FR-BKO-04].

## 2. What is logged where

"Level" is the highest level the record may hold. "Kept" is the period in force or proposed. [V] marks the code or document line; where the vendor window cannot be read from the repo it is [U].

### 2.1 Device (the phone)

| Store | What it holds | Level | Kept | Rule |
|---|---|---|---|---|
| Release console | Nothing. One `console.warn` exists in the global fault handler; what the line holds is not pinned by a test [U] | L2 | Not stored | `apps/mobile/src/lib/resilience/global-errors.ts:49` [V]. FR-PRV-11 and OBS-R05 say the message holds codes only; that is a card row, the scan test is not built [U] |
| Local rejected writes (`rejected_writes`) | op id, SQLSTATE, `req_id` so a parent can quote it | L2 | Until the parent resolves it | chapter 10 OBS-R03, "How to apply" [V]; table exists at `apps/mobile/src/lib/db/migrations.ts:217` [V] |
| PostHog SDK state (only after a yes, only if the build has analytics) | queue, random analytics id, flags; memory only | L2 | Until the app is killed or consent is withdrawn | `packages/analytics/src/posthog.ts:163-196` (`persistence: 'memory'`) [V] |
| Safety tiers | Device only. No server row, no event, no log, no crash field | L4 | Life of the install | LEGAL-REQ-015 [V `ENGINEERING_REQUIREMENTS.md:149-153`]; DC 4.6 |
| Apple crash reports | Apple's own reports reach us through App Store Connect only for people who share diagnostics. Not our SDK | L2 after Apple's own handling [U] | Apple's window [U] | label 2.2.0 Diagnostics row; FR-DAT-16 |

### 2.2 Edge Functions and ops scripts

Every function logs through `createLogger` (`log.ts:248`) except `content`, which has no logger import [V scan] and so logs nothing of ours; its platform request line is in 2.4. `escrow` keeps a separate logger inside its own folder on purpose, so no shared code runs next to the recovery key (`escrow/log.ts:1-9`) [V].

| Function or script | Logger | Allowed `FUNCTIONS` name | What it may emit | Never |
|---|---|---|---|---|
| `purge-worker` | `_shared/log` | `purge-worker` | `worker.*`, `purge_due.*`, `queue.*`, `account.step*`, `emails.*`, `alert.*`, `ledger.*`, `retention.*`, `sla.*`, counts, step names, bucket names | object paths, emails, ids, vendor error text |
| `analytics-forget` | `_shared/log` | `analytics-forget` | `forget.accepted`, `forget.refused`, `forget.failed`, `calls`/`ids` counts | the ids it was sent (canary test pins this, `canary.test.ts:30-48` [V]) |
| `invite-redeem` | `_shared/log` | `invite-redeem` | `redeem.peeked`, `redeem.accepted`, `redeem.refused`, `redeem.brake`, `redeem.degraded` | the code, the book, the person; rate subjects are keyed hashes in a table, not log fields |
| `subscription-status`, `apple-token`, `config` | `_shared/log` | same names | `status.*`, `salt.served`, `request.*`, codes | receipt, transaction id, Apple token, token text |
| `escrow` | `escrow/log.ts` | own list | `request.*`, `restore.*`, `rotation.*`, `email.*`, `alert.*`; counts `keys`, `opened`, `failed`, `devices`, `rows`, `emails` | key bytes, device id, wrapped keys, child id |
| `scripts/ops/*` (`verify-deletion`, `restore-drill`, `enumerate-affected`, `keepalive`, ...) | `_shared/log` through `ops-script` | `ops-script` | `script.start`, `script.done`, `script.failed`, counts | row contents; every run also writes one `ops.audit_log` row first (section 4) |

### 2.3 Database (Postgres)

All rows are append-only or short-lived. None holds content. Columns and levels are the ones in DC 4.1; the migration is the source if they differ (DC 4.1 opening paragraph).

| Table | Purpose | Level of highest column | Written by | Kept | Migration |
|---|---|---|---|---|---|
| `public.audit_events` | product and dispute evidence: who did what to which id | L3 (`actor_id`, `subject_id`, `child_id`) | `public.audit()` and definer triggers only | 24 months; actor and subject nulled at account deletion | `20261002020000_data_governance.sql:310-336`, guard `20261108020000_audit_append_only.sql:51-73` [V] |
| `ops.audit_log` | break-glass: one row per runbook run that touches people's data | L3 (`operator`, `target_*`) | `public.ops_audit_write()` (service role) | 12 months, also after account deletion (security log) | `20261004200000_ops_deletion_worker.sql:33-47, 380-385` [V] |
| `public.escrow_unwraps` | every opening of a book key by the recovery service | L3 | escrow function only | 24 months, pseudonymised at deletion; D-021 says 12: open (COUNSEL_PACKET Q51) | `20261023000000_backup_server.sql:345-361` [V]; DC 4.3.1 |
| `public.deletion_requests`, `deletion_request_steps` | deletion receipts: counts and step outcomes, at most 2 KB | L3 (`profile_id`) | purge worker, definer RPCs | 3 years after completion | `purge_due` `20261108020000:209-210` [V] |
| `public.policy_acceptances` | consent record (what was shown, what was answered) | L3 (`locale` L3 per DC open issue 6) | `record_policy_act` | life of account plus 3 years, pseudonymised at deletion | `20261108020000:213` [V]; PRIV-R21 rows |
| `public.subscription_consents` | D-081 purchase consent fact | L3 | `status_report_store` | 3 years after pseudonymisation | `20261016001000_subscription_status.sql:133-148` [V] |
| `public.invite_redeem_failures`, `sync_rate_windows`, `ops.forget_quota` | abuse brakes: keyed hash of a subject, counts, window start | L3 (subject is a keyed hash) | definer functions | 2 hours; rolling windows; 2 days | DC 4.1.1, 4.1.2; `ops_retention` `20261004200000:363-371` [V] |
| `public.purge_ledger`, bucket `ops-ledger` | ids of purged things so a restore can replay deletions | L3 | purge, worker | 60 days | `purge_due` `20261108020000:217` [V]; DC 4.4 |
| `public.storage_purge_queue` | object paths waiting to be deleted | L3 (`object_path`) | purge | 7 days after done | `20261108020000:218` [V] |

Only SQLSTATE and `req_id` ever leave these tables toward a log. `escrow_unwraps.request_id` is the same random 12 hex id (`backup_server.sql:357`) [V].

### 2.4 Platform logs (Supabase, Vercel, Cloudflare)

| Stream | What it holds | Level | Kept | Rule |
|---|---|---|---|---|
| Supabase API gateway request log | method, path, status, time. PostgREST paths can hold a row id in a filter | L3 possible | 1 day on Free, 7 days on Pro [V plan table, U dashboard] | Reads that name an id go in a POST body or RPC argument, not a URL (LEGAL-REQ-014). Open: TDD 06 C-1 (counsel) [V chapter 10 open question 1] |
| Supabase Postgres log | errors; `DETAIL` can echo a failing row, including letter text | L4 possible | same | Never enable statement logging. Whether `log_error_verbosity = terse` can be set is [U] (chapter 10 open question 3). Never export this log to anyone but the founder; treat an export as L4 |
| Supabase Edge Function log | our `LogLine` JSON, plus the platform's invocation line | L2 | same | section 3.1 |
| Supabase Auth audit log | sign-in events, may hold IP addresses and emails | L3 | [U] (target 90 days; `data-policy.md` 4.2, DELETION spec OQ-5) | We keep none of it in our tables. Written in data-policy 4.2 before any "we do not keep your IP" sentence (FR-PRV-26) |
| Vercel (website) | request log, runtime log: 1 hour Hobby, 1 day Pro [V reliability.md:34, U dashboard] | L3 (IP) | as stated | No invite token in a path (security review M2, `data-policy.md` 4.5). Website forms hold no letter content |
| Cloudflare R2 (packs and config) | IP, user agent, file requested; the file name reveals the language picked | L3 | [U] | disclosed in the privacy policy section on providers; DC 4.8 |

### 2.5 CI, repository and agents

| Place | What it may hold | Never | Source |
|---|---|---|---|
| GitHub Actions logs and artifacts | test output on the fictional family Asha, counts, SQLSTATEs | a secret, a real email, a production row. Workflows echo no secret (`::add-mask::` where one is read) | `.github/workflows/*` (read only; I propose nothing here) |
| Nightly production dump (age-encrypted to a key only the founder holds), 7 days, private repo `earlyletters-backups` | the whole database, encrypted | being opened by an agent or CI job | FR-PRV-08, FR-BKO-21; whether GitHub is a processor is counsel's (PQ-3) |
| Daily counts-only summary in the same repo | auth successes and failures, sync errors by SQLSTATE class, rate-limited calls, rejected writes. No ids, emails or letters | any join key | FR-REL-26 (proposed, not built) [V row text] |
| Agent sessions and PR bodies | fixtures only | production data of any kind; an agent holds no production log or database credential | OBS-R14, FR-BKO-21 |

### 2.6 Vendors

| Vendor | Log it keeps | Level | Kept | What we cannot see or control |
|---|---|---|---|---|
| Resend | each sent email, its address and our text, delivery events | L3 | 30 days (a deletion-complete email, sent at about day 30, is therefore held to about day 60) | `data-policy.md` section 5 [V `:187`]; no letter content in subject or body (LEGAL-REQ-053) |
| PostHog (not in any 1.0.x build) | catalogue events and the random analytics id | L2 | 12 months proposed, set in the console | `delete_events` on forget (`analytics-forget`); host and region [U] |
| Sentry or other crash SDK | not in any build | L2 after scrub | 90 days proposed | not adopted; adding one is a vendor decision (section 12 Q4) |
| Apple (App Store Connect, StoreKit) | crash and session counts for people who share; sales | n/a on our servers | Apple's | We read counts only |
| GitHub | repository, Actions logs, the encrypted dump | L2, encrypted L4 | 7 days for the dump | PQ-3 |
| Hugging Face | file requests for upstream speech models | L3 (IP) | [U] | named in the providers page |
| Support mailbox | what people write; may contain letters | L4 | 2 years after last message (proposed) | handled as L4 (DC 4.8); FR-SUP-09 says what we may ask |

## 3. Event schema

### 3.1 Server log line (`LogLine`, `supabase/functions/_shared/log/log.ts:116-124`)

One JSON object per line. Allowed fields, and nothing else [V `log.ts:141-198`]:

| Field | Type | Allowed values | Level |
|---|---|---|---|
| `ts` | ISO time | system clock | L2 |
| `level` | enum | `info`, `warn`, `error` | L2 |
| `fn` | enum | the `FUNCTIONS` list (`:96`), else `unknown` | L2 |
| `version` | string | `^[0-9][0-9A-Za-z.]{0,15}$` | L2 |
| `req_id` | string | `^[0-9a-f]{12}$`, random per invocation (`:237-242`) | L2 |
| `event` | enum | the `EVENTS` list (`:27-45`, 53 names), else `invalid_event` | L2 |
| `outcome` | enum | `ok`, `client_error`, `server_error`, `refused`, `retry`, `skipped` | L2 |
| `status` | int | 0 to 599 | L2 |
| `sqlstate` | string | `^[0-9A-Z]{5}$` | L2 |
| `code` | enum | `ERROR_CODES` (`:49-56`) or `http_<3 digits>` | L2 |
| `duration_ms` | int | 0 to 3.6 million | L2 |
| `counts` | map | keys in `COUNT_KEYS` (`:60-64`), non-negative integers up to 1e9 | L2 |
| `step`, `bucket`, `provider`, `task`, `alert`, `reason` | enum | `STEP_NAMES`, `LOGGABLE_BUCKETS`, `PROVIDERS`, `TASKS`, `ALERT_KINDS`, `REASONS` | L2 |
| `cold_start` | bool | | L2 |
| `dropped` | int | how many fields the sanitiser refused | L2 |

Forbidden, and why the code already cannot carry them: any id (person, book, letter, device, op), email, name, token, key, path, URL, query string, header, request or response body, SQL text, `error.message`, `details`, `hint`, stack frame, free-text `message`. There is no key for them; an unknown key is dropped and counted (`log.ts:193-195`) [V]. Exceptions are reduced to `{code, sqlstate, status}` (`:209-217`) [V].

Adding a field: (1) the value must be a closed set or a fixed shape; (2) add it to `sanitize`, the type and the canary fixture in the same PR; (3) `privacy` and `security-architect` review; (4) if a value could ever be user-supplied, it is not a field.

Escrow line (`escrow/log.ts:9-45`) [V]: the same rule with its own lists (`EVENTS`, `CODES`, `COUNT_KEYS` = `keys opened failed devices rows emails`, `STEPS`).

### 3.2 `audit_events` row (product evidence)

`public.audit_events` (`20261002020000_data_governance.sql:310-327`) [V]:

| Column | Type | Null | Rule | Level |
|---|---|---|---|---|
| `id` | bigint identity | no | | L2 |
| `at` | timestamptz default now() | no | system time only | L2 |
| `actor_id` | uuid | yes | `auth.uid()`; null for system; nulled at account deletion | L3 |
| `actor_kind` | text | no | `user`, `system`, `support` | L2 |
| `action` | text | no | enum, section 4.2 | L2 |
| `subject_type` | text | yes | `entry`, `child`, `membership`, `profile`, `deletion_request`, `export`, `legal_hold`, `system` | L2 |
| `subject_id` | uuid | yes | nulled at deletion for `profile` and `membership` | L3 |
| `child_id` | uuid | yes | | L3 |
| `detail` | jsonb | no | an object, at most 512 bytes, enums, counts and hashes only | L2 |

Indexes `audit_events_actor_idx (actor_id, at)`, `audit_events_child_idx (child_id, at)` (`:329-330`) [V]. Forbidden in `detail`: text of any kind a person typed or said, a name, an email, a path. `ops_audit_write` callers refuse any string not matching `^[a-z0-9_.:-]{0,40}$` (`scripts/ops/lib/runbook.ts:21-24`) [V]; the SQL function itself only checks size and object shape, so the guard lives in the script [V `20261004200000:380-385`].

### 3.2a Council amendment B8 (20 Nov 2026): allowlist and own-rows export

Cite: DECISIONS-20nov B8 (RULED conditions), CDO seat B8, CPrivO return B8. Ruled: no audit screen; a parent sees their own rows only in Save a copy (`account.json`). Two conditions before that export ships. Gate GF (before the first family outside the founder's signs in) [E: B8 names no gate; C3, the audit writers, is GF].

1. Key allowlist on `audit_events.detail`. Today the table check only tests "object, at most 512 bytes" (`20261002020000_data_governance.sql:327`) [V], and `public.audit` (`:332-336`) inserts whatever it is given [V], so a key such as `email` would pass. Keys the code writes today [V]: `role` (`:374`, `:376`; `20261003000000_security_and_family.sql:344, 389`), `decision` (`:523`), `entries`, `books`, `source` (`:639-640`), `accounts_due` (`20261003020000_purge_batching.sql:150-151`). Rec: a guard in `public.audit` so every key is in a per-action list and every value is a closed enum, a non-negative integer or a 64-hex hash; a new key is a migration plus a test, never a free choice. Proposed lists [E, `data-architect` to confirm]: `member_removed`, `left_book`, `invite_created`, `member_joined`: `role`; `family_letter_reviewed`: `decision`; `account_deletion_requested`: `entries`, `books`, `source`; `purge_run`: `books`, `entries`, `accounts_due`; `export_created`: `files`, `bytes`, `manifest_sha256`; every other action: no keys. Test: insert a row with an unlisted key and expect refusal; fails on `develop` today.
2. Export only the requester's own rows. Removal rows name other people: `member_removed` stores the removed person in `subject_id` and the remover in `actor_id` (`:376`) [V]. The export returns a row only when `actor_id` or `subject_id` is the requester; the other person's id is output as null; fields are `at`, `action`, `subject_type`, allowlisted `detail`, and a book id the requester already belongs to. Needs the definer reader of finding 3; no table grant is added. Test: two accounts, one removes the other; each export holds only its own side and neither holds the other's uuid.
3. `security_events` (C3: its own service-only 12-month store) is never part of an export.

### 3.3 `ops.audit_log` row (break-glass)

Columns (`20261004200000_ops_deletion_worker.sql:33-47`) [V]: `id` bigint identity; `at` timestamptz default now(); `operator` text 1 to 80 (staff handle, L3); `runbook` text in 12 values (`deletion`, `dsar`, `legal_process`, `preservation`, `safety_removal`, `under_13`, `third_party_health`, `restore_replay`, `restore_drill`, `incident_scope`, `verify_deletion`, `break_glass`); `reason_code` `^[a-z][a-z0-9_]{0,39}$`; `ticket` text 1 to 80 (a reference, never content); `target_profile`, `target_child`, `target_entry` uuid, nullable (L3); `detail` jsonb at most 512 bytes. Index `audit_log_at_idx (at)`. Only `service_role` may execute `ops_audit_write` (`:624-631`) [V]; no role holds a table grant (`supabase/migrations/20261023060000_explicit_grants.sql:49-56`) [V].

### 3.4 Analytics event (opt-in, not in any 1.0.x build)

The catalogue is code, not a document: `packages/analytics/src/catalog.ts`; the readable copy is `docs/analytics/TRACKING_PLAN.md` section 3.1 and a test fails when they differ [V DC 4.7]. Shape rules [V `schema.ts:1-60`, `validate.ts:1-50`]:

| Rule | Value |
|---|---|
| Value types | enum of fixed snake_case strings, boolean, bounded integer. No free-text type exists |
| Level | every property L2; L3 and L4 are not representable (`Level = 'L1' | 'L2'`) |
| String cap | 40 characters (`MAX_STRING_LENGTH`, `validate.ts:25`) |
| PII patterns that drop the whole event | email, phone-like run, URL, UUID, ISO date, other dates, JWT, 32+ character token (`validate.ts:71-80`) |
| Unknown event | dropped. Unknown property | stripped. Missing or invalid required property | event dropped (PDATA-03) |
| Violation report | names a catalogue key or `<unlisted>`, never a value |
| Global properties | `schema_version`, optional `child_count_bucket`, optional `sample_pct` (`catalog.ts:190-196`); no person properties ever |
| Identity | one random analytics id, retired on withdrawal; never the account id, email or device id (`consent.ts:1-20`) |
| SDK options pinned | opt-in default off, memory persistence, no replay, no geoip, no autocapture, no surveys, no remote flags, no error tracking, no lifecycle capture (`posthog.ts:163-196`) |
| Never an event | safety tiers, search text or length, seal opening times, typed-day delivery, picture metadata, place, Firsts labels (FR-DAT-27) |

Adding an event: catalogue entry with area, when, requirement ids; `SCHEMA_VERSION` bump and new fingerprint (`catalog.ts:197-211`); TRACKING_PLAN regenerated; `analytics` owns the file, `privacy` reviews the leak question (standing duty 2); label and policy re-checked before any build turns it on (FR-PRV-30, FR-PRV-31).

## 4. Audit trail for access to personal data

### 4.1 Who can reach L3 and L4 data, and what records it

| Path | Who | Reaches | What is recorded today | Gap |
|---|---|---|---|---|
| App, user JWT, RLS and grants | the signed-in person | own rows; book rows per `book_access`; letters of others only through `book_entries` columns | nothing per read (reads are not audited, by design) | none to close; reads by a parent of their own data are not a staff access |
| Edge Function with service role | function code | only through RPCs (service role holds no table grant) | `OpsLog` line; domain tables record their own state | the function is trusted code; a bug is a leak path, hence the canary test |
| `scripts/ops/*` on the founder's machine | founder | counts and ids through RPCs | one `ops.audit_log` row first, or the script stops (`runbook.ts:1-5, 15-29`) [V] | wrapper covers 4 of the 12 `runbook` values: `incident_scope`, `verify_deletion`, `restore_drill`, `restore_replay` (`runbook.ts:10`) [V]. `deletion`, `dsar`, `legal_process`, `preservation`, `safety_removal`, `under_13`, `third_party_health`, `break_glass` have no wrapper |
| Supabase SQL Editor and Table Editor as the owner | founder | everything, including L4 | nothing in our tables; Platform Audit Logs need a paid plan | a human can read a letter with no record. The only controls are FR-BKO-03 (never open L4 tables, run printed statements only) and FR-BKO-04 (never claim every access is logged). Rec: keep as is for 1.0; do not claim otherwise |
| Supabase dashboard user delete | founder | cascades letters | nothing | DB-17 in chapter 08 [V DSR "Never" list]; runbook rule |
| Support mailbox | founder | whatever people paste | mail history | FR-SUP-09: ask only for what they tapped, version, model, iOS |
| Agents | none | nothing in production | n/a | OBS-R14; FR-BKO-21 |
| PostHog and Insights | read-only key held by the insights job | k-anonymised counts (k = 10) | job run | not read in 1.0 unless the founder rules it in (FR-DAT-28) |

### 4.2 Audit action vocabulary: defined, written, never written

`audit_events.action` allows 21 values (`20261015020000_v1_gate_coparent_invites_undo.sql:83-92`) [V]. Written today (grep of `audit(` and the two direct inserts across `supabase/migrations`) [V]: `entry_deleted`, `entry_restored`, `purge_run`, `book_deletion_requested`, `book_deletion_cancelled`, `book_purged`, `left_book`, `member_removed`, `account_deletion_requested`, `account_deletion_cancelled`, `account_deletion_completed`, `restore_replayed`, `invite_created`, `invite_revoked`, `member_joined`, `family_letter_reviewed`, `member_join_undone`.

Never written by any function, trigger or script [V grep, no hit outside the constraint lists]: `export_created`, `legal_hold_placed`, `legal_hold_released`, `support_access`. DSR-R10 already records the hold gap [V chapter 08]. Consequence: data-policy section 7 says held data "is not readable by staff without a logged `support_access` audit event"; nothing writes it. Do not publish that sentence as a fact until it is true.

Proposed new values (Rec, for `data-architect` to turn into a migration; I write none): `ops.audit_log.runbook` gains `support_lookup`, `account_recovery`, `suspension`, `access_limit`, `kill_switch`, `key_change`, `abuse_report` (FR-BKO-05). `audit_events` gains nothing for staff reads; staff acts belong in `ops.audit_log`, user acts in `audit_events`, so the two vocabularies stay separate (OBS-R07).

### 4.3 What an audit row must answer

Who (operator handle or actor id), what (enum), which ids (L3, never content), why (reason code and ticket), when (server clock), outcome (count in `detail`). It must not answer "what did they read". A row with free text, a name, an email or a path is a defect (DATA-REQ-004, DSR "Never").

### 4.4 Quarterly review

The founder reads the quarter's `ops.audit_log` against the request log: every `dsar`, `deletion` and `legal_process` row has a ticket (FR-BKO-06) [V row text]. The read is itself a break-glass read. One dated line is written in the repo with counts only.

## 5. Security events

LEGAL-REQ-037 lists what to log and LEGAL-REQ-038 what to alert on [V `ENGINEERING_REQUIREMENTS.md:318-330`]. Messages to the customer about these events are document 07; this table is the evidence side.

| Event | Where it is recorded | State today | Fields (all L2 unless noted) | Alert |
|---|---|---|---|---|
| Sign-in, failed sign-in, method linking | Supabase Auth audit log (vendor) | Vendor only; our tables hold none. Retention [U] | provider, outcome | [U] daily counts view (FR-REL-26) proposed |
| Repeated wrong sign-in codes | Auth rate limit; app maps to `auth_failed.reason` `wrong_code`, `code_paused`, `rate_limited` (analytics, when on) | Server count only through the vendor | count | none built |
| New-device sign-in | not recorded by us | not built | | LEGAL-REQ-037 asks for it; 07 decides the message |
| Service-role and runbook use | `ops.audit_log` | built in repo, pending apply | section 3.3 | quarterly read |
| Escrow unwraps, restore requests, Stop-link use | `escrow_unwraps`, `restore_requests` | built in repo, pending apply | `reason`, `outcome`, `request_id`, ids L3 | `escrow` alerts (`alert.sent`) |
| Invite code brute force | `invite_redeem_failures` and `redeem.brake` log event | built in repo, pending apply | scope enum, keyed hash L3 | `redeem.brake` count |
| Sync rate limit hits | `sync_rate_windows` | built in repo | bucket, hits | none |
| Deletion stuck, purge silent, residue, tombstones overdue | `ops` alerts (`ALERT_KINDS`, `log.ts:86-90`) and an email to the founder | worker built, not deployed live (D-041) [V chapter 08 DSR-R06] | alert kind, counts | founder email |
| Admin console login, new admin device | each vendor console | no central record | | vendor email only |
| RLS denied spike, mass Storage download, disabled RLS | not recorded | not built | | LEGAL-REQ-038 is P1; Free plan cannot support it [E basis: 1-day logs] |
| Secret scanner hit | CI | [U] | | security-architect, document 04 |

Rules: a security event row or alert holds a kind, a count, a time and a request id. It never holds an email, an IP address, a device name, a token or the text of a failed code. An IP address, if a vendor keeps one, stays in that vendor's log (L3) and is never copied to our tables (FR-PRV-26).

## 6. Reporting and metrics that are allowed

### 6.1 In the 1.0.x line

The app sends us no measurement at all (FR-DAT-01 to -03) [V]. Allowed numbers come from these sources only:

| Source | What | Level | Who reads |
|---|---|---|---|
| App Store Connect | downloads, crash-free sessions (people who share diagnostics only), ratings, subscription starts | n/a | founder |
| Tester rounds | fixed questions, counts, no quotes; raw answers deleted after 90 days (FR-DAT-05, -06) | founder's private sheet | founder |
| Support tally | one category per message, counts only (FR-SUP-08, FR-DAT-17) | L2 | founder |
| Server health (`ops` alerts, `purge_run` audit counts) | counts and ages | L2 | founder |
| Daily counts-only view | auth, sync error classes, rate limits, rejected writes (FR-REL-26) | L2 | founder, through the backup role |
| `insights.*` and `insights_aggregates()` | k = 10 counts of families, letters, invites, language mix | L2 | `service_role` and `insights_reader` only; not read in 1.0 unless ruled (FR-DAT-28); DC 4.9 |

### 6.2 When analytics returns (v1.1 or later, a founder decision)

Only the catalogue in section 3.4, only after a yes on the consent sheet, only with the build flag on. Before any build turns it on: the label moves to Usage Data and Diagnostics for Analytics (label section "A later build with opt-in analytics"), the privacy policy and providers page name the vendor, `preflight-production` stops failing on the SDK, and counsel answers the Linked or Not linked question (COUNSEL_PACKET Q7) [V label 2.2.0 `:85`, FR-PRV-31]. The privacy policy and `docs/legal/subprocessors.md` today say there is no analytics in any build; that is true of the shipped build and the code, and must stay true until all of that happens [V `privacy-policy.md:24`, `subprocessors.md` "The app has no analytics or crash reporting service"].

### 6.3 Never a metric

Safety tier counts joined to any id; per-person letter counts; anything by child name or birthday; "gap" or streak numbers (CLAUDE.md content rules); a count under 10 families in any published cut; a cohort that can be re-identified by a date (FR-DAT-27, DC 4.9 k = 10 rules); a metric built by reading content.

## 7. Retention of logs and audit rows

| Record | Kept | Deleted by | Basis |
|---|---|---|---|
| Edge Function logs, Postgres logs, API logs | platform window: 1 day Free, 7 days Pro [V/U] | platform | an incident needs an export within hours (FR-OPS-04) |
| `audit_events` | 24 months | `purge_due` under `app.retention_purge` (`20261108020000:211-214`) | DATA-REQ-045, -066 |
| `ops.audit_log` | 12 months, kept after account deletion | `ops_retention` (`20261004200000:363-371`) | LEGAL-REQ-033, -037; D-021 |
| `escrow_unwraps` | 24 months, pseudonymised at deletion | purge job | Q51 open |
| Deletion requests and receipts | 3 years after completion | `purge_due` | proof of deletion |
| `purge_ledger`, `ops-ledger` | 60 days | `purge_due`, `ops_retention` | restore replay (DATA-REQ-030) |
| `policy_acceptances` | account life plus 3 years, pseudonymised | `purge_due` | consent proof |
| PostHog (when on) | 12 months proposed | console setting, `analytics-forget` on deletion | `data-policy.md` section 6 |
| Resend sent log | 30 days | vendor | `data-policy.md:187` |
| Request log (non-self-serve requests, founder file) | 3 years after completion | founder, by the weekly card | chapter 08 "Request log" |

Retention is enforced by code or a console setting recorded in a runbook, never by memory (DATA-REQ-006). Changing any period updates `data-policy.md` section 6 first (a `legal` hand-off).

## 8. Who may read

| Record | Reader | Path | Forbidden |
|---|---|---|---|
| `audit_events` | founder (owner) in the SQL Editor; nobody through the API | the table has no grant for any API role (`supabase/migrations/20261023060000_explicit_grants.sql:49-56`) [V] | users cannot read their own rows today: policy `audit_events_own` (`data_governance.sql:985`) is dead because `authenticated` lost SELECT. Relevant to PQ-5 (access request) |
| `ops.audit_log` | founder; scripts through RPC | service role RPC only | any API role; any agent |
| `escrow_unwraps` | the owner of the row, through the policy (DC 4.3.1 "Owner read") | RLS | staff reading by person without a runbook row |
| Function logs | founder, through the dashboard, by `req_id`, time, function or SQLSTATE | audited runbook for any person lookup (OBS-R14) | agents; pasting a log into a ticket or PR |
| Auth audit log | founder, only for an incident or a verified account request | dashboard | export beyond the incident |
| PostHog | founder or insights job read key (Query Read only, never in the app) | `posthog.ts:281` | person lists; any identified view |

## 9. Tamper resistance

| Control | What it stops | Source |
|---|---|---|
| Row guard on `audit_events`: no update except nulling `actor_id` or `subject_id` at account deletion; no delete except under the retention switch | edit or delete of a record by a SQL statement | `20261108020000:51-73` [V] |
| Row guard on `ops.audit_log`: no update, no delete outside `ops_retention` | the same, for staff acts | `20261004200000:50-60` [V] |
| `BEFORE TRUNCATE` guards on `audit_events`, `policy_acceptances`, `ops.audit_log`; same exists on `subscription_consents`, `escrow_unwraps` | wiping a record, even by the owner | `20261108020000:75-101` [V] |
| No API role holds any grant on these tables; trigger functions executable by no API role | a client or function editing the trail | `supabase/migrations/20261023060000_explicit_grants.sql:49-56`, `20261108020000:103-112` [V] |
| Tests | the guards stay on | `supabase/tests/audit_append_only.test.mjs`, `ops_deletion_worker.test.mjs`, `classification.test.mjs` [V file names] |
| Closed log vocabulary | a developer adding content to a log | `log.ts` and the canary test (`canary.test.ts`) fail the build on a hit or a direct `console.*` [V header `log.ts:17-20`] |

What they do not stop: the database owner (dashboard SQL Editor, a migration) can still disable a trigger. There is no external copy of the audit tables except the encrypted nightly dump, which also holds them (FR-PRV-08). Rec (no new vendor, no dependency): the monthly restore drill compares the audit row counts against the previous drill's counts and writes the result in the drill line; a drop in a 24-month table is the tamper signal. Not built [U].

## 10. Findings (gaps and risks, with file and line)

1. Four audit actions exist and nothing writes them: `export_created`, `legal_hold_placed`, `legal_hold_released`, `support_access` (`20261015020000:83-92`; grep of all migrations, scripts and functions) [V]. Policy text that leans on them is not yet true.
2. The break-glass wrapper covers 4 of 12 runbook values (`scripts/ops/lib/runbook.ts:10`; `20261004200000:34-35`) [V]. Deletion, access, legal-process and safety runs have no wrapper, so the audit-first rule is a human step.
3. `audit_events` has no reader at all: the owner policy (`data_governance.sql:985`) is unreachable after `supabase/migrations/20261023060000_explicit_grants.sql:49-56` [V]. A parent's access request (PQ-5) cannot be answered from the API without a new definer function.
4. The owner and the dashboard are unaudited and Free-plan logs last 1 day (`operations.md:30`) [V as read, U live]. No claim of "every access logged" may ship (FR-BKO-04, LEGAL-REQ-025).
5. Only migration files 1 and 2 are applied live (`APPLY.md:48`) [V]. Every guard, table and alert in this file is repo-only until the deploy PRs run; the privacy policy must not describe them as running.
6. No lint rule keeps `console` out of the app (no ESLint config at the root) [V]; one `console.warn` exists in the global fault handler (`global-errors.ts:49`). It logs a code-only line today; nothing enforces that.

## 11. Conflicts (written, not silently resolved)

| Id | Where | Conflict | Sent to |
|---|---|---|---|
| C05-1 | chapter 10 OBS-R03 vs code | Chapter says a request id is 32 lowercase hex (W3C trace id). Code, the escrow table check and the logger use 12 hex (`log.ts:237-246`, `backup_server.sql:357`). Code wins today | `principal-architect` (chapter owner) |
| C05-2 | chapter 10 OBS-R01, R07, OBS-G2 vs code | Chapter says the logger "does not exist" and names `packages/analytics/src/ops-log.ts` and `ops_audit_log`; code has `supabase/functions/_shared/log/log.ts` and `ops.audit_log` | `principal-architect` |
| C05-3 | `data-policy.md` section 7 vs code | Says held data is readable only with a logged `support_access` event; no code writes it (finding 1) | `legal`, `data-architect` |
| C05-4 | `privacy-policy.md:24`, `subprocessors.md` vs `packages/analytics` | Texts say no analytics in any build. True of the build; the code and `docs/analytics/TRACKING_PLAN.md` describe a PostHog path. Keep true by FR-PRV-31 | `legal` (informational) |
| C05-5 | `DATA_CLASSIFICATION.md` 4.8 "Edge Function logs ... `_shared/log`" vs `FUNCTIONS` list | `escrow` and `content` are not in the main list; DC 4.8 does not name the escrow logger | `data-architect` |

## 12. Questions for the council (default in brackets)

| Id | To | Question | Default |
|---|---|---|---|
| Q1 | CISO, founder | Do we pay for Pro (7-day logs, backups) or Team (audit logs) before the first store build? | Free until a founder decision; keep every claim within what is logged (FR-BKO-04) |
| Q2 | CPO, counsel | May a parent see their own audit rows (deletions, leaves) in Me? PQ-5 says counsel decides whether an access request includes them | Screen CLOSED by B8: no screen. Own rows in Save a copy `account.json` under 3.2a; whether an access request must include them stays counsel question CQ4 (`06` appendix A) |
| Q3 | counsel | Is the 12 month period for `ops.audit_log` and the 24 months for `escrow_unwraps` right? D-021 and Q51 disagree | Rec (B7a): build `escrow_unwraps` at 12 months to match D-021 before the first apply; counsel (CQ2) says if longer is needed and the founder then amends D-021 on the record. Periods stay "as built, not approved"; none is published |
| Q4 | founder | Adding a crash SDK or PostHog: a vendor decision, label change, policy change | Not in 1.0.x; Apple's own crash reports only |
| Q5 | CISO | Is a monthly audit-count comparison at the restore drill enough tamper evidence for one operator? | Yes for 1.0; revisit at the first second operator (FR-BKO-11 trigger) |
| Q6 | CDO | Who writes the missing audit actions and the extra runbook values (finding 1, 2, section 4.2)? | `data-architect` as one migration with tests; `ops` the wrappers |

## 13. How I checked this file

Cites sampled: 26 (read this session). Held: 25. One did not hold as written in the chapter: OBS-R03's 32-hex id (code uses 12), recorded as C05-1. Sampled: `log.ts:27-45, 49-56, 60-64, 96, 116-124, 141-198, 209-217, 234-247`; `escrow/log.ts:1-45`; `20261002020000:310-336, 985`; `20261004200000:33-60, 363-385, 624-631`; `20261015020000:83-92`; `20261108020000:51-112, 211-218`; `20261023000000:345-361`; `20261016001000:133-148`; `supabase/migrations/20261023060000_explicit_grants.sql:49-56`; `grants.mjs:5-10`; `runbook.ts:1-29`; `catalog.ts:190-212`; `validate.ts:25, 71-80`; `posthog.ts:163-196`; `consent.ts:1-20`; `APPLY.md:34, 48`; `global-errors.ts:49`; `ENGINEERING_REQUIREMENTS.md:128-153, 206-212, 318-330`; `data-policy.md:147-160, 175-217`; DC sections 1 to 4.9; FR-BKO-02 to -06, FR-DAT-01 to -28, FR-PRV-08, -11, -26, -31, FR-REL-26, FR-OPS-04. Not verified: any live Supabase, Vercel, Cloudflare, Resend or PostHog setting; platform log windows against a dashboard; Deno test results (not run here); the claims-registry flag for LEGAL-REQ-025.

Council addendum (20 Nov 2026): cites added in 3.2a re-read on `origin/develop`: `data_governance.sql:327, 332-336, 374-376`, `security_and_family.sql:344, 389, 523, 639-640`, `purge_batching.sql:150-151`: 9 of 9 held.
