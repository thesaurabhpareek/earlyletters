# 03. Access and authorisation

Owner: `security-architect`. Status: draft for the council review (20 Nov 2026). Pack: data and security foundation (files 01 to 07). Read with `docs/engineering/05-identity-and-access.md` (IAM) and `06-security-engineering.md` (SEC), which stay the rules; this file is the map from those rules to the code on `develop` (base `4d33978f`).

Tags: **[V]** verified by grep or by reading the file named. **[E]** estimate, basis given. **[U]** not verified. **Rec** is my recommendation, not a decision. Data levels use the names in `docs/legal/DATA_CLASSIFICATION.md:44-49`: L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. No new level is made here.

## 0. The five facts to hold

1. The database decides. Anyone with the publishable key and a session can call PostgREST directly, so every control below sits in Postgres, not in the app. [V] IAM principle 1, `access_matrix.test.mjs:94-118` drives every persona through raw SQL as the role.
2. Default deny. Since `20261023060000_explicit_grants.sql:99-100` every table and sequence starts with nothing for `anon`, `authenticated`, `service_role` and `PUBLIC`; each grant is listed in `supabase/tests/grants.mjs:5-16`. [V]
3. `service_role` holds no table privilege at all and 44 function grants: 42 kept by `explicit_grants.sql:116-143` plus `invite_redeem_by_code` (`20261028010000`) and `ops_deletion_consent_records` (`20261108010000:123`) (`grants.mjs:10`, `:18-32`). Edge Functions call RPCs, never tables. [V]
4. No secret is in the app. The app holds the Supabase URL and the publishable key, which are public (file 04, section 3). [V]
5. **Live state:** none of this is applied to `scribe-staging` or `scribe-prod`. `supabase/APPLY.md:4` says "Nothing here has been run against the live project yet"; 28 of 31 migration files carry "PENDING: not yet applied" in their header (`grep -c`). The old project `early-letters` has files 1 and 2 only (`APPLY.md:48`). So every statement below is true of the repository and its tests, not yet of a running server. [V] for the repo, [U] for any hosted project.

## 1. Who can be a caller

| Caller | How it arrives | Database role | Identity in the database | Reaches |
|---|---|---|---|---|
| Signed-out visitor, app or website | publishable key, no session | `anon` | none | `policy_versions` select only (`grants.mjs:6`); no function (`access_matrix.test.mjs:641-643`) |
| Signed-in person | publishable key plus user JWT | `authenticated` | `auth.uid()`; role per book from `child_members` | the grants in section 3, the RPCs in section 7 |
| Anonymous session (a signed-in-looking JWT with `is_anonymous`) | only if someone turns the setting on | `authenticated` | `auth.uid()` set, `is_anonymous()` true | nothing: restrictive policies and `require_user()` refuse it (SQLSTATE `SCANO`). Off in config (`config.toml`, `enable_anonymous_sign_ins = false`). [V] |
| Edge Function acting as a person | the caller's own JWT forwarded | `authenticated` | the same person | same as the app (`subscription-status`, `apple-token` session check) |
| Edge Function acting as the service | secret key on `apikey` header | `service_role` | none | the 44 functions in `grants.mjs:18-32` over PostgREST; plus the Auth admin and Storage APIs, which grants do not limit (section 6) |
| `escrow` function (separate project) | direct Postgres login | `escrow_svc` | none | EXECUTE on 10 `escrow_*` functions, no table (`BACKUP_RUNBOOK.md:19`, `:71`) |
| Insights reader | JWT with that role claim, or SQL | `insights_reader` | none | k-anonymised views in schema `insights` and `insights_aggregates()` (`20261004300000_insights_aggregates.sql:42-43`, `:274`) |
| Founder in the SQL Editor or CI deploy | dashboard or `SUPABASE_DB_URL_*` | owner (`postgres`) | none | everything; this is the break-glass path (section 9) |
| AI agents | GitHub App token | none | none | the repository only. `agents.yml` and `claude.yml` read no `SUPABASE_*` secret (grep of `secrets\.` in those two files only: no `SUPABASE_*`; other workflows read `SUPABASE_DB_URL_*` and `SUPABASE_ACCESS_TOKEN_STAGING` for deploys) [V] |

Roles inside a book: `parent` and `contributor` only (`20260930000000_scribe_core.sql:51`). The UI says Co-parent (a second `parent`) and Family (`contributor`). One person can hold different roles in different books (IAM-R01). A book has at most two parents (`max_parents_per_book`, D-069). [V]

## 2. The rules this file asks every change to keep

AX-01. A table or view a client may touch has row security on, a restrictive `*_no_anonymous` policy, and its grants listed in `grants.mjs`. Test: `access_matrix.test.mjs:610-618` (every table is in the matrix), `:671-676` (every client table has the restrictive policy). [V]
AX-02. Every RPC `authenticated` may call starts with `require_user()` or checks `is_anonymous()` (IAM-R14). Test: `access_matrix.test.mjs:647-649`. [V]
AX-03. No function is executable by `anon` (`:641-643`), and no definer function lacks a pinned `search_path` ending in `pg_temp` (`pg_temp_search_path.test.mjs:13-40`, `access_matrix.test.mjs:644-646`). [V]
AX-04. Content writes pass `require_content_consent()` (`security_and_family.sql:190`): current terms, `age_attested`, sensitive-data consent, else SQLSTATE `SCCON`. [V]
AX-05. A view is never wider than its base tables for the caller. `book_entries` is read by nobody directly (matrix row `book_entries`, all six personas `42501`); `sync_pull` reads it as owner. [V]
AX-06. New objects start with nothing. `alter default privileges ... revoke all` (`explicit_grants.sql:146-148`) means a new table, sequence or function gets no grant until its own migration adds one and `grants.mjs` lists it. [V]
AX-07. A person never sees another person's L4 data except through a path in section 7 that names it. A letter's `raw_transcript`, `raw_sha256`, `machine_edits`, `stt_meta` and `deleted_reason` are author-only (`data_governance.sql:200-203`, matrix `entries` and `book_entries` rows). [V]
AX-08. Role changes and removals are explicit RPCs that write an audit row; nothing else writes `child_members.role` or deletes another member's row. [V] `child_members` has select only (`grants.mjs:7`); the old `child_members_leave` delete policy was dropped (`v1_gate_coparent_invites_undo.sql:446`).

## 3. Grants: what each role holds

Source of truth: `supabase/tests/grants.mjs`; the migration `20261023060000_explicit_grants.sql:98-148` makes both default-grant worlds end the same; `explicit_grants.test.mjs` and `access_matrix.test.mjs:525-560` compare the live catalog to the list. [V]

| Relation | `anon` | `authenticated` | `service_role` | Used by (header of the migration names the path) |
|---|---|---|---|---|
| `policy_versions` | S | S | none | deploy smoke (anon); consent sheets |
| `entries` | none | S I U | none | `sync_push` runs as the caller; author-only rows |
| `held_drafts` | none | S I U | none | held drafts (author, parent of the book) |
| `child_member_prefs` | none | S I U | none | `sync_push` prefs |
| `profiles` | none | S U | none | sign-off name |
| `child_members` | none | S | none | book count |
| `deletion_requests`, `audio_blobs`, `policy_acceptances`, `my_policy_state` (view), `sync_epochs`, `sync_op_receipts` | none | S | none | own rows through RLS |
| `children` | none | S on 12 columns (no date of birth, no due date) | none | `grants.mjs:15`; `explicit_grants.sql:111-114` |
| `child_keys` | none | S on 7 columns (never `escrow_wrap`) | none | `grants.mjs:14` |
| every other table and view, every sequence | none | none | none | only definer code reads or writes them |

S select, I insert, U update, D delete. No role holds TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on anything (`explicit_grants.sql:57`). No DELETE is granted to anyone: erasing a letter, leaving a book and purging are definer code. [V]

Service-role functions (`grants.mjs:18-32`), grouped by the job that calls them [V by list, group by function name]:
- Deletion and purge worker: `purge_due`, `prepare_account_purge`, `finalize_account_deletion`, `record_deletion_step`, `record_purge_attempt`, `ops_deletion_*`, `ops_storage_*`, `ops_merge_deletion_receipt`, `ops_set_child_photo_path`, `ops_ledger_between`, `ops_retention`, `ops_alert_claim`, `ops_alert_reset`.
- Sign in with Apple token store: `ops_apple_token_put`, `ops_apple_token_get`, `ops_apple_token_delete`.
- Analytics forget quota: `ops_consume_forget_quota`.
- Invite codes: `invite_redeem_by_code`, `accept_child_invite_by_code`.
- Backup sweep and stop: `backup_svc_sweep`, `backup_svc_unwraps_between`, `backup_svc_stop`.
- Reads for checks and reporting: `has_active_consent`, `content_gate_state`, `consent_pepper_ready`, `is_anonymous`, `dictionary_forms_valid`, `insights_aggregates`, `ops_row_counts`, `ops_schema_health`, `ops_raw_sha`, `ops_incident_scope`, `ops_replay_ledger`, `ops_audit_write`, `subscription_retention_purge`, `sync_begin_epoch`, `sync_housekeeping`.

Rule for a new grant: write it in the migration that adds the object, add a line to `grants.mjs`, name the code path that uses it in the migration header. A grant with no path is refused in review. Test that fails if forgotten: `explicit_grants.test.mjs` (exact comparison of `grantRows()`). [V]

## 4. Row-level security, table by table

Every policy below is `to authenticated` and is ANDed with a restrictive `*_no_anonymous` policy (`security_and_family.sql:80-103`, and the same pattern in later files). Tables with row security on and no policy are reachable only by definer code; they are marked "none".

| Table | Policy (permissive) | Who sees which rows | Writes |
|---|---|---|---|
| `profiles` | `profiles_self_or_co_guardian` (`scribe_core.sql:237`) | own row, and rows of people who share a book | own row only; `profiles_guard` locks server-owned columns |
| `children` | `children_member_select` (`:248`) | members of the book; column list limits what | none direct; `book_update()` (`20261015000000_v1_gate_membership_sync_hardening.sql:136`) is definer and checks parent |
| `child_members` | `child_members_select` (`:253`) | members of the same book | none direct; invite, leave, remove RPCs |
| `entries` | `entries_select` (`data_governance.sql:203`) | **author only**, all columns | author insert/update; guard triggers keep `raw_transcript` immutable and book fields parent-only |
| `held_drafts` | `held_drafts_author_*` (`sync_v1_server.sql:338-345`) | author | author |
| `child_member_prefs` | `child_member_prefs_own` (`data_governance.sql:991`) | the person's own | the person's own |
| `audit_events` | `audit_events_own` (`:985`) | rows where the person is the actor | none; append-only (`audit_append_only.sql:23`) |
| `deletion_requests` | `deletion_requests_own` (`:987`) | own | none; RPCs |
| `policy_acceptances` | `policy_acceptances_own_read` (`:997`) | own | none; `record_policy_act()` |
| `policy_documents`, `policy_versions` | `*_read` `to anon, authenticated` (`:995-996`) | everyone; L1 | none; founder publishes in the SQL Editor |
| `sync_epochs` | `sync_epochs_read` (`sync_engine.sql:138`) | all signed-in (two values, L2) | none |
| `sync_op_receipts`, `sync_rate_windows` | `*_own` (`sync_engine.sql:168-189`) | own | definer |
| `backup_devices`, `child_keys`, `audio_blobs`, `backup_usage`, `restore_requests`, `restore_approvals`, `escrow_unwraps` | `*_own` (`backup_server.sql:481-489`) | the owner only (`profile_id` or `author_id`) | none; `backup_*` RPCs |
| `child_invites`, `entry_versions`, `dictionary_terms`, `held_drafts_gone`, `idempotency_keys`, `invite_redeem_failures`, `subscription_*`, `legal_holds`, `purge_ledger`, `storage_purge_queue`, `deletion_request_steps`, `escrow_rotation_notices`, `app_account_tokens`, `store_*`, `sync_private.entry_erasures` | none | nobody through the API | definer code only |
| `ops.*` (4 tables) | none; schema revoked (`ops_deletion_worker.sql:30-31`) | service role via `ops_*` functions | same |

Matrix proof: the rows of `READS` (`access_matrix.test.mjs:120-185`) run each table as parent, co-parent, contributor, outsider, anonymous and `anon`. A deny is on every row. [V]

Note on `entries` for the family: a co-parent reads 0 rows of `entries` directly (matrix `entries` row: `[2, 0, 2, 0, 0, 42501]`). Everyone but the author reads book letters only through `sync_pull` (section 7). [V]

### Storage buckets (RLS on `storage.objects`)

| Bucket | Public | Read | Write | Limits | Cite |
|---|---|---|---|---|---|
| `entry-photos` | no | own folder, or `can_read_entry_photo()` (in-book, live letter, live book, member) | insert: own folder, member, live book, consent, not an erased letter's path; update: own folder with the same checks; delete: own folder | 10 MiB; JPEG, HEIC, PNG | `scribe_core.sql:290-306`, `data_governance.sql:228-239`, `pg_temp_last_and_purged_photos.sql:88-106` [V] |
| `entry-audio` | no | `backup_object_readable()`: own object, never switched off | `backup_object_writable()`: own pending row, backup on, backup consent active | 20 MiB; octet-stream (encrypted) | `backup_server.sql:677-711` [V] |
| `ops-ledger` | no | none (no policy, service role only) | none | n/a | `ops_deletion_worker.sql:611` [V] |

Anonymous sessions are refused on the first two by restrictive policies (`security_and_family.sql:103`, `backup_server.sql:711`). A signed URL passes the same policy. [V]

## 5. Security definer rules (what a definer function may do)

A definer function runs as the owner and skips RLS, so it is the highest-risk object in the schema. Rules, each with its proof:

DF-01. `set search_path = pg_catalog, public, pg_temp` (pg_catalog first, pg_temp last), or empty. Test: `pg_temp_search_path.test.mjs:13-40` sweeps every definer and every function a policy calls; `v1_gate_search_path.test.mjs` probes a shadowing temp table. [V]
DF-02. First statement `v_uid uuid := public.require_user();` (example `sync_pull`, `sync_v1_server.sql:1305-1306`). The caller id is never a parameter, except helpers that answer only for the caller. [V]
DF-03. Role check for the specific book, then a named SQLSTATE: `SCPAR` not a parent, `SCANO` anonymous, `SCCON` consent, `SCRAT` rate limit, `SCDEL` deletion rule, `SCLPG` last parent, `SCIMM` immutable, `SCSTP` step-up needed, `SCKIL` kill switch. A bare `P0001` is refused in review. [V] codes seen in `access_matrix.test.mjs:257-314`.
DF-04. `revoke execute ... from public, anon` in the same file, then grant to `authenticated` only if a client calls it; internal helpers go to nobody. The matrix lists every function `authenticated` can run and fails on an unlisted one (`:638-640`); `SERVICE_ONLY` (`:337-378`) proves internal helpers answer `42501` to clients. [V]
DF-05. Return only what the caller's role may see. A function that returns jsonb names its keys; the contributor branch of `sync_pull` returns `date_of_birth` and `due_date` as null and only `birthday_md` (`sync_v1_server.sql:1436-1438`). [V]
DF-06. Membership, invite, deletion and release acts write `audit(...)`; `audit()` itself is executable by nobody but definer code (`data_governance.sql:1009`). Content never enters `detail` (check: `octet_length <= 512`, `:318`). [V]
DF-07. Rate-limited acts call `rate_hit(bucket)`: `pull` 120 per minute, `push` 60 per minute, `policy_actions` 60 per hour, `membership` 120 per hour, `entry_state` 300 per hour, `apple_token` 10 per hour, per person (`20261015000000:88-110`). [V]
DF-08. Views that read as owner (`book_entries`) use `security_barrier`, filter on `auth.uid()` inside the view, and are granted to nobody for direct select. The Supabase advisor flags them; the exception is recorded in `APPLY.md`. [V]

## 6. Service role scope

What it is: the key that skips RLS. Holder: Edge Functions on the main project, the founder's shell for `scripts/ops` (file 04, section 2). Never the app, never CI, never an agent, never the website. [V] grep of `service_role|SERVICE_ROLE|sb_secret` in `apps/mobile/src` returns nothing; in `apps/web/src` and `packages` returns nothing (run 20 Nov).

What it may do through PostgREST: call the 44 functions in section 3. No table grant, so a stolen key cannot `select * from entries` over the Data API; it can call the deletion and purge RPCs, read `ops_deletion_*` status, and write an audit row. **But the same key also opens two other APIs that these grants do not limit:** the Auth admin API (list, read, change or delete users and their email addresses, L3; used at `supabase/functions/purge-worker/lib/service.ts:232,244`) and the Storage API (read or delete every object in `entry-photos`, `entry-audio` and `ops-ledger`, L4 and ciphertext; the purge worker deletes objects with it). So a leak is an L3 and L4 incident, not only a destructive-RPC one. [V] code use; the platform rule that a secret key bypasses RLS is from Supabase's API-keys page (chapter 06, checked 3 Oct 2026). The header of `explicit_grants.sql:59-62` says the file revokes the other 86 function grants it used to hold (count taken from the header, not re-counted).

Per function, which key it uses [V]:

| Function | Key | Why |
|---|---|---|
| `purge-worker` | secret key | runs the purge and deletion RPCs, Storage deletes (`purge-worker/config.ts:46`) |
| `apple-token` | the caller's JWT for the session check, then secret key for `ops_apple_token_put` | only the store of the wrapped token needs the service role |
| `invite-redeem` | the caller's JWT, then secret key for `invite_redeem_by_code` | one RPC does gate, lookup and count in one transaction (`invite-redeem/handler.ts:14-24`) |
| `analytics-forget` | secret key for `ops_consume_forget_quota` only | counts calls; ids are never stored |
| `subscription-status` | none: publishable key plus the caller's JWT | RPCs act for `auth.uid()` (`handler.ts:28-33`) |
| `config`, `content` | none | public signed documents |
| `escrow` | none for the main API; a Postgres login `escrow_svc` | table-less role, 10 functions, `connection limit 5`, `statement_timeout 5s` (`backup_server.sql:148-154`) |

Rec: one secret key per function, not one shared key (SEC-R04, Supabase "one per backend component"). Today `SUPABASE_SECRET_KEYS` is injected by the platform and is the same for all functions of a project. [U] whether the dashboard can mint a distinct key per function; file 04, gap G-04-06.

## 7. Retrieval paths: how each read works and what it may return

Rule: a client reads through exactly one of these paths. Any other path is a bug.

| # | Path | Caller | Gate | May return | Must never return |
|---|---|---|---|---|---|
| R1 | `sync_pull(p_since, p_limit)` (`sync_v1_server.sql:1302`) | any signed-in person | `require_user`, `rate_hit('pull')`, one book at a time by `child_members` | Parent: all live letters incl. pending family letters, the child record with `date_of_birth`, `due_date`. Contributor `reads`: own letters plus in-book letters; contributor `own`: own letters only. Never `raw_transcript` of someone else. Held-draft section for the author only. | another author's `raw_transcript`, `raw_sha256`, `machine_edits`, `stt_meta`; a contributor's date of birth or due date; a book the caller left or was removed from; a deleted book |
| R2 | `sync_books()` (`20261015000000:866`) | any signed-in person | `require_user`, rate bucket `pull` | book ids, role, `family_can_read`, names the grants allow | dates for contributors |
| R3 | `entries` select | author | `entries_select` | own rows, all columns (the author's own working material) | anything with another `author_id` |
| R4 | `children` select (12 columns) | member | `children_member_select`, column grant | name, nickname, look, photo path, flags | `date_of_birth`, `due_date` for anyone (`access_matrix.test.mjs:129-130`) |
| R5 | `entry-photos` signed URL | member | `entry_photos_read` | the photo of a live, in-book letter, or the caller's own | a photo of a deleted letter, of a private letter, of a book the caller left |
| R6 | `entry-audio` signed URL | owner | `backup_object_readable` | the owner's encrypted blob | anyone else's; plaintext (it is client-encrypted, file 04) |
| R7 | own-row tables (`policy_acceptances`, `deletion_requests`, `audio_blobs`, `child_keys` 7 columns, `sync_op_receipts`) | owner | `*_own` policies | owner's rows | other people's rows; `child_keys.escrow_wrap` |
| R8 | `peek_invite`, `accept_child_invite` (token), `invite-redeem` (code) | signed-in, full account | token hash match or code HMAC; `rate_hit('membership')`; 10/10/30 failed codes per hour, 1,000 service-wide, then `codes_paused` | inviter display name, role | whether any other code exists; the book's content before joining |
| R9 | `policy_versions` | anyone | `anon` select | public legal text versions (L1) | n/a |
| R10 | `insights_aggregates()` and `insights.*` views | `service_role`, `insights_reader` | k-anonymity: a count below 10 is withheld (`20261004300000_insights_aggregates.sql:46-52`, `k_min()` returns 10) | counts, never a per-family row | any id, any text |
| R11 | Edge Function `config`, `content` | anyone | public, GET only, signed documents | signed remote config, pack manifest, content bundles | any user data |
| R12 | Export and legal-hold reads | data-rights process (file 06) | founder runbook, audit row | per request | n/a here; `export_created` has no writer in code (G-03-07) |

Tests that prove R1 to R9: `sync_v1_server.test.mjs`, `v1_gate_hardening.test.mjs`, `access_matrix.test.mjs`, `invite_redeem_by_code.test.mjs`, `export_reads.test.mjs`. [V] names exist; I did not re-run them (no database in the sandbox).

## 8. Role by data class (what each caller may read)

R read, W write, "own" own rows, "-" nothing. Levels per `DATA_CLASSIFICATION.md`.

| Data | Parent | Contributor | Outsider | `anon` | service role | Founder at the SQL Editor |
|---|---|---|---|---|---|---|
| Letter text, `final_text` (L4) | R book, W own | R own, R book if `family_can_read`, W own | - | - | - (no table grant) | R, break-glass only |
| `raw_transcript`, machine edits (L4) | own | own | - | - | - | break-glass only |
| Child name, nickname, birthday, due date (L4) | R name and dates | R name, nickname, month and day | - | - | - | break-glass only |
| Photos, audio (L4) | R book photos, own audio | R book photos if allowed, own audio | - | - | Storage delete only | break-glass only |
| Display name, sign-off, role (L3) | R members | R members | own | - | - | R |
| Email (L3) | not in `public` (it is in `auth.users`) | same | same | - | via Auth admin only | R |
| Audit rows (L2/L3) | own as actor | own as actor | own | - | write via `ops_audit_write` | R |
| Consent and policy acts (L3) | own | own | own | - | read through `has_active_consent` | R |
| Counts, insights (L2) | - | - | - | - | R via `insights_aggregates` | R |
| Legal text (L1) | R | R | R | R | R | R |

## 9. Support, admin, agent and break-glass access

**There is no admin console and no support view of customer content.** [V] `docs/tdd/04-security-identity.md:574` ("No staff tool shows L4. No admin UI is built"). Support answers from what a person tells us and from content-free facts: policy state, deletion state, counts. Keep it so.

Support. Today a support request has no tool that looks up an account. A lookup by email needs Supabase Auth admin in the dashboard (L3). Any look at a person's data is a break-glass act. [V] `back-office.md:113` says the closed runbook list "has no value for a lookup, a suspension, a kill switch, a key change or an abuse report". `audit_events.actor_kind = 'support'` and action `support_access` exist in the schema (`data_governance.sql:320`) but no code writes them (grep `support_access` in `supabase/functions`, `scripts`: none). Gap G-03-03.

Admin. Founder only. Console accounts have two-factor and recovery codes offline (`docs/ops/SECURITY.md:117`). Organization MFA enforced, members founder only (`SECURITY.md:139`). Deploys reach the database through `SUPABASE_DB_URL_STAGING` and `_PROD` in GitHub Environments, intended to require approval (`deploy-db.yml:120`, `:240` name the environments; that they require an approver is a repository setting) [U]

Agents. Agents are untrusted users with a job (SEC principle 4). They work in the repository through a GitHub App token and hold no Supabase, Vercel, Resend or Apple credential. Evidence: the only secrets `agents.yml` and `claude.yml` read are `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `AGENTS_APP_PRIVATE_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` (grep `secrets\.`). [V] Agents read fixtures with the fictional family "Asha" only. An agent may propose a migration; it never applies one (`approve-migration` label is the founder's, D-041). Tools in an interactive session (a Supabase MCP connector) are the founder's own session and outside this rule; **Rec** the founder removes write connectors from agent sessions (SEC-R19). [U] whether any are attached in the harness.

Break-glass. The only audited path is `scripts/ops` (`scripts/ops/lib/runbook.ts:25`): one action per run, a named operator, `--project-ref`, `--ticket`, and a row in `ops.audit_log` before the act (`ops_deletion_worker.sql:33-50`). The row holds operator, runbook, `reason_code`, ticket, target ids and at most 512 bytes of enum detail; it is append-only (`audit_log_guard`, retention 12 months). The runbook enum is closed: deletion, dsar, legal_process, preservation, safety_removal, under_13, third_party_health, restore_replay, restore_drill, incident_scope, verify_deletion, break_glass (`:36-38`). [V]

Break-glass rules (Rec, for the council; the first four already hold in code or runbooks):
1. No look at L4 content. A support case about one letter is answered by the author's own export or by asking the parent.
2. Every break-glass act has a ticket and a row in `ops.audit_log` first; no row, no act.
3. Use the narrowest key: the ops script with the service key from the founder's shell, never the dashboard Table Editor on a content table.
4. A second named person with sealed recovery only; none exists (open question 4 of SEC chapter, PINF-06; `back-office.md:189`). Decision for the founder.
5. Review the log quarterly (`SECURITY.md:100`), and say in the review how many `break_glass` rows exist.
6. A break-glass look at a family's data is told to the family unless counsel says not to (**question for counsel**).

Sign people out. There is no admin lever by user id: Supabase's admin `signOut` needs the person's own JWT (`docs/ops/runbooks/sign-everyone-out.md`, section 1, written 8 Nov, **not run**). What exists: the person's own "sign out other devices" scope, and the signed `forceReauthEpoch` that signs phones out locally (`reauth.logic.ts`). So "we will sign that device out" in the new-device email (`packages/content/src/emails/auth.en.ts:199`) is a promise with no support lever behind it. Gap G-03-05, routed to file 07.

## 10. Gaps found (real, with file and line)

| Id | Gap | Where | Severity | Fix owner |
|---|---|---|---|---|
| G-03-01 | Photo UPDATE is allowed; DELETE needs only the own folder, not current membership. SEC-R18 says no UPDATE and DELETE only for a current member of a live book. Chapter says "pending PR #32"; the policies are on `develop` and still allow it. | `20261028000000_pg_temp_last_and_purged_photos.sql:99-106`, `20260930000000_scribe_core.sql:299-302` | Medium: a removed member can still delete objects in their own folder; UPDATE cannot overwrite or move, because its WITH CHECK needs membership, a live book and consent (own content only, so no cross-person harm) | data-architect |
| G-03-02 | `request_account_deletion` has no step-up. A stolen session can start a 30-day deletion that tombstones every letter and book at once. The backup RPCs do require a sign-in in the last 10 minutes (`SCSTP`). The reauthentication email template exists (`config.toml:106`) but the app never calls `reauthenticate` (grep in `apps/mobile/src`: none). The owner is emailed and can cancel, so it is recoverable. | `20261005000000_family_cap_language_idempotency.sql:408-440` vs `20261023000000_backup_server.sql:221,1022` | Medium | data-architect, mobile |
| G-03-03 | Support and break-glass have no audit path in `audit_events`; `support_access` and `actor_kind = 'support'` are unused. The runbook enum lacks lookup, suspension, key change, abuse report. | `data_governance.sql:320`; `back-office.md:113` | Medium | ops, data-architect |
| G-03-04 | Chapter 05 is stale in four places: IAM-R05, R08, R10 say the auth code, `apple-token` and `expo-secure-store` do not exist, and they do (`apps/mobile/src/lib/supabase/secure-storage.ts:24`, `supabase/functions/apple-token/handler.ts`). IAM-R17 names a `book_children` view that exists nowhere (grep); the real control is the 12-column grant plus `sync_pull`. IAM-R20 says `remove_member` and `set_member_role` do not exist; `remove_child_member` does (`20261005000000:362`). | `docs/engineering/05-identity-and-access.md:39,45,51,67,75` | Low (a rule that no longer matches the code is a bug) | security-architect, next chapter PR |
| G-03-05 | "We will sign that device out" has no lever (see section 9). | `auth.en.ts:199`; `sign-everyone-out.md:7-14` | Medium | sync, ops |
| G-03-06 | All of section 0 point 5: no hosted project runs this model yet; the first `deploy-db.yml` run applies every pending file in filename order in one go. Unproven live. | `supabase/APPLY.md:4,34,48` | Info, gates the launch | ops |
| G-03-07 | `audit_events` allows `export_created`, `legal_hold_placed`, `legal_hold_released` and `support_access`, but no migration or function writes them (grep for each name outside the check list: none). A data export or a legal hold leaves no row in `audit_events`; `ops.audit_log` (runbook) may, but is a different log. `account_deletion_completed` is written by a direct insert (`data_governance.sql:969`). | `data_governance.sql:316-320`; grep | Medium | data-architect, privacy |
| G-03-08 | `insights_reader` is granted to `authenticator` (`20261004300000_insights_aggregates.sql:36`), so a JWT with that role claim becomes that role. It holds only usage on `public` and `insights` and execute on one function, but it is a role a Data API caller could be mapped to if a token with the claim were ever signed. Accept and document, or drop the grant. | `20261004300000_insights_aggregates.sql:34-37` | Low | data-architect |

## 11. How to add something (checklist)

1. Threat-model entry (SEC-R01). 2. Table: RLS on, own and restrictive policies, grants in the migration and in `grants.mjs`, column comment with the level. 3. RPC: section 5, DF-01 to DF-08. 4. Matrix cells for six personas including a deny (IAM-R24). 5. Storage policy: the same helper as the table read path (IAM-R16). 6. Run `npm run test:db`. 7. Founder label `approve-migration` (D-041); agents never add it.

## 12. Conflicts

- **Conflict (chapter 05 vs code):** IAM-R17 says contributors read through a `book_children` view; code has none. Route: security-architect fixes the chapter in a standards PR (RFC to principal-architect, data-steward, compliance-engineer, ai-eng-lead; a MUST changes only with founder approval on the PR).
- **Conflict (ruling vs product):** D-054 in `config.toml` has Google sign-in in v1.0; IAM-R05 follows D-044 (Google v1.1). Route: product and the founder confirm; I follow the code (`google.ts` exists, provider off in config until credentials).
- **Conflict (function file vs code):** `back-office.md:113` says `break_glass` is a catch-all with no audit value for lookup; `data_governance.sql:320` already has `support_access`. Route: product (back-office) and data-architect choose one.

## 13. Questions for the council (each with a default)

1. CISO: add a step-up (recent sign-in, same rule as backup) to `request_account_deletion` and `request_book_deletion`? Default: yes, for account deletion, using the reauthentication email code already templated.
2. CISO and founder: is a second break-glass person named, and how is recovery of founder accounts held if the founder cannot act? Open (Q-BKO-6, `back-office.md:296`; PINF-06). Default: none named and no custody arrangement assumed until the founder answers; nothing in the repository says how recovery is held.
3. CPO and counsel: tell a family when staff looked at their data? Default: yes, within the law's notice rules, via the incident runbook. Counsel decides.
4. CDO: should `support_access` be written by the ops script as well as `ops.audit_log`? Default: yes, one row in each, content-free.
5. CISO: drop the `insights_reader` grant to `authenticator`? Default: keep, since only `service_role` runs the weekly report today; revisit when a dashboard exists.
6. CTO: per-function service keys? Default: one key per project until Supabase makes per-function keys possible [U].

## 14. What I could not verify

- Any hosted project state (grants, settings, secrets): no console access, by rule. All "live" claims are [U].
- That the tests pass today: `npm run test:db` needs the embedded Postgres harness, which I did not run; I checked the test files for the assertions named, not their result.
- Whether Supabase Auth keeps user-agent or IP in its own logs: [U], `SECURITY.md:136` already asks.
- The size of the Supabase `service_role` blast radius beyond the 44 functions: Storage API and Auth admin API are reachable with the same key and are not limited by these grants. [V] by Supabase design (secret keys bypass RLS), [U] for each hosted setting.

## 15. Sources checked

Repo files named inline, read 20 Nov 2026. External: Supabase API keys and Row Level Security pages as cited in `05-identity-and-access.md` (checked 3 Oct 2026; not re-fetched today).
