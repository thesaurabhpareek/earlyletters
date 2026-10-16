# R-17 shared security review: checklist and evidence

Owner: stream S02 (database and access rules) wrote this file for PR #140; S01 owns `docs/security/**` (PRD V2 `08-delivery.md` section 3.3), so S01 reviews it and may move it. Written 15 Oct 2026.

**The gate.** PRD V2 `09-decisions-and-risks.md` R-17 and D-089 (PR #128, founder option B): server features ship in v1.0, but nobody outside the founding family signs in before BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merge and pass **one shared security review**, `npm run test:db` is green, every migration is on staging through `deploy-db.yml` (T16, `08-delivery.md` section 2.1), and counsel has commented on the M14 policies (T17). This file is that review's checklist: one row per check, the evidence each needs, and a first pass.

**How to use it.** A reviewer who did not write the code fills the "Reviewer" column for every row, with a commit and the command or file that proves it. A row passes only with evidence a second person can re-run. The gate passes when every row in sections 1 to 8 says pass for the same set of commits, and section 9 is signed. Status words: **pass** (evidence attached), **pending** (not built or not checked yet), **fail** (checked, wrong), **n/a** (with the reason).

Per-stream detail lives with the stream: S01's items and evidence are in `docs/security/REVIEW_R17_AUTH.md` (PR #139); S02's are below and in PR #140; S04 (BL-322) and S20 (BL-349) add theirs in their PRs and link them here.

## 0. First pass, 15 Oct 2026 (S02, self-assessed; not the shared review)

| Section | Owner | State on 15 Oct |
|---|---|---|
| 1. Gate-wide | founder, S20 | **pending**: nothing merged; staging not created (FT-10, FT-11); `deploy-db.yml` still deploys staging from `main` only |
| 2. BL-347 | S01 | **pending** here; S01 reports built with evidence in PR #139 (`REVIEW_R17_AUTH.md` A1 to A5, A9) |
| 3. BL-330 | S01 | **pending** here; S01 reports built in PR #139 (A6 to A8); deploy needs FT-11 secrets |
| 4. BL-331 with BL-332 | S02 | **pass (self)** for every row in PR #140 at the commit named in the PR; needs the independent reviews (section 9) |
| 5. `peek_invite` with BL-334 | S02 | **pass (self)** in PR #140; the app half is BL-322 |
| 6. BL-322 | S04 | **pending**: not started on origin on 15 Oct; consumes the `peek_invite` contract in PR #140 |
| 7. BL-349 | S20 | **pending**: privacy manifest exists (`cf5a4c4`, #27); the archived `PrivacyInfo.xcprivacy` check before C1 is not recorded |
| 8. Cross-cutting | all | **partly**: 8.1 to 8.6 pass (self) for the database; 8.7 to 8.10 pending |
| 9. Sign-off | founder | **not started** |

**Gate status: NOT PASSED.** Blocking today: sections 1, 6 and 7, the two independent reviews of every fenced PR, and the founder's choices in PR #140 ("Founder questions"). One finding from this pass is new and Critical on `develop` (8.2 below, DB-01): fixed in PR #140, so the gate cannot pass on `develop` without it.

## 1. Gate-wide

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 1.1 | The six items are merged to `develop` at one set of commits, and the review below names those commits | PR numbers and merge commits for BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349 | pending (#139, #140 open as drafts; S04, S20 not opened) | |
| 1.2 | Every migration file 1 to 16 is applied to `scribe-staging` through `deploy-db.yml`, never by hand | The workflow run URL; its "Files to record" summary; a PR adding them to `.github/migrations-applied.txt` | pending: staging does not exist; the workflow deploys staging only from `main` today (S20 moves it to `develop`, 08 section 7) | |
| 1.3 | The APPLY.md checks for every file pass on staging (step 4, step 10, step 18, step 21) | The query output pasted into the PR that records the apply | pending | |
| 1.4 | `npm run test:db` is green at the reviewed commit, and `db-cli.yml` (`supabase db reset` and `db lint` on the real Postgres image) is green | CI run URLs | local PGlite run green (PR #140 body); `db-cli.yml` not run yet | |
| 1.5 | Release profiles keep `EXPO_PUBLIC_SERVER_FEATURES=off` until this file is signed; the M14 switch PR waits | `apps/mobile/eas.json` at the reviewed commit; S20's switch PR still open | pass on `develop` 15 Oct (all four profiles off) | |
| 1.6 | Production (`scribe-prod`) holds no family data before the gate passes | Founder statement with the date; table counts from staging and production | pending | |
| 1.7 | Counsel has commented on the M14 policies (T17); legal pages describing the server product are live as drafts before sign-in | FT-33 record; page URLs | pending | |
| 1.8 | The fence held: every fenced PR (`supabase/**`, auth, `.github/**`) carries two independent review verdicts (one security) and the founder's `approve-migration` label (08 section 7) | Links to the review comments and the label events | pending | |

## 2. BL-347: an email link cannot sign this phone into someone else's account (review H1, S01)

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 2.1 | The H1 proof of concept is a regression test that fails on old code and passes on the branch | Test name and both runs (S01: `auth-h1.test.ts` step 4 on 4183844 fails, passes on `feat/auth-v1-gate`) | pending here (S01 reports pass) | |
| 2.2 | PKCE for email links; a link is accepted only while this phone has a pending request; else "type the code" | `REVIEW_R17_AUTH.md` A1, A2; device check AUTH_SETUP 11.10 | pending (device check owed) | |
| 2.3 | Local letters move to an account only after consent and a tap on a screen with the masked email | A3; `[F02-REQ-019]` | pending | |
| 2.4 | A link is refused while another account is signed in | A4; `[F02-REQ-020]` | pending | |
| 2.5 | The email template and redirect allowlist on staging match AUTH_SETUP (founder steps) | Dashboard screenshots or Management API output, dated | pending | |

## 3. BL-330: Apple token capture so deletion can revoke it (review H3, S01)

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 3.1 | `apple-token` verifies the caller's JWT, exchanges the code, wraps the refresh token under `TOKEN_KEK_V1`, stores it through `ops_apple_token_put` (service role only) and answers 204 with nothing echoed | Deno tests; `REVIEW_R17_AUTH.md` A6 | pending here | |
| 3.2 | Rate limited where it runs: 10 per person per hour in the database through `rate_hit('apple_token')` with the user's JWT | S02: bucket in `20261015000000` section 0, test "the apple_token bucket exists" in `v1_gate_limits_peek_pepper`; S01: Deno "the shared counter" | **pass (self)** for the database half | |
| 3.3 | Logs carry no code, token or user id (log canary) | A7; `_shared/log/canary.test.ts` | pending | |
| 3.4 | Account deletion revokes the token on staging (purge worker, step `apple_token_revoke`) | A staging deletion run with a test Apple account; the receipt says `apple: revoked` | pending (needs FT-11 and a device) | |

## 4. BL-331 with BL-332: membership, sync and rate limits (S02)

Files: `supabase/migrations/20261015000000_v1_gate_membership_sync_hardening.sql` (ported from `auto/2026-10-05-fixes` `d1cbddb`, file `20261005100000_db_fix_privacy_limits.sql`, sections 0 to 4) with `20261005000000` (already on `develop`). Tests: `supabase/tests/v1_gate_hardening.test.mjs`, `v1_gate_limits_peek_pepper.test.mjs`, `v1_gate_search_path.test.mjs`, rows in `access_matrix.test.mjs`.

| # | Check | Evidence needed | First pass (PR #140) | Reviewer |
|---|---|---|---|---|
| 4.1 | H2: at most two parents per book on create and accept, under a row lock | `db_followup_family_cap` (SCCAP cases); `access_matrix` "create_child_invite (parent role)"; `v1_gate_coparent` "[F11-REQ-004]" on both overloads | pass (self) | |
| 4.2 | H2: an invite whose maker is no longer a parent is refused; a parent who leaves takes their open invites | `v1_gate_hardening` "[F2b]"; `db_followup_family_cap` "[H2]" rows | pass (self) | |
| 4.3 | M1 (D-039): no API role reads `children.date_of_birth` or `due_date` from the table, not in `select *`, `where` or `order by`; parents get them from `sync_books` and `sync_pull`, family the month and day | `v1_gate_hardening` "[F1]" rows; `access_matrix` "children: date of birth", "children: due date" | pass (self) | |
| 4.4 | M5: a private write, edit or delete never changes the pull digest or rows; removals still reach the reader. Residual: cursors and row versions are transaction ids (section 10) | `v1_gate_hardening` "[F5]" and "[G-09]" rows (parents and family) | pass (self) | |
| 4.5 | L1: op receipts keyed by (person, op id); clients cannot insert or delete them; another person's op ids never collide | `v1_gate_hardening` "[F4]" rows; `access_matrix` "sync_op_receipts" rows | pass (self) | |
| 4.6 | M3: counters change only through `rate_hit()`; a client cannot reset them | `db_followup_idempotency_rates` "[M3]"; `v1_gate_hardening` "[F3]" | pass (self) | |
| 4.7 | M3 and BL-332: limits on every write RPC and on `sync_books` (books 20 a day; letter delete and restore 300 an hour; membership 120 an hour incl. `peek_invite` and `undo_parent_join`; policy acts 60 an hour and 200 a day; account deletion 5 a day; pull 120 and push 60 a minute); inside `sync_push` a limit stops the batch, never rejects an op | `v1_gate_limits_peek_pepper` "[G-11]", "[BL-332]" rows; `db_followup_idempotency_rates`; ADR 0017 section 4 numbers | pass (self); the numbers differ from PR #142's (founder question) | |
| 4.8 | L2: a photo cannot be moved into another family's folder | `v1_gate_hardening` "[F6]" | pass (self) | |
| 4.9 | DB-01 (PR #32 review): no write through `book_entries` or `my_policy_state` | `v1_gate_hardening` "[F11-REQ-082] the other parent cannot update, delete or insert through book_entries"; `access_matrix` "book_entries: update a letter" | pass (self). **On `develop` today this fails: a co-parent can rewrite the other parent's in-book letter** (8.2) | |
| 4.10 | Idempotency keys (ADR 0017 rule 3) for `create_child_invite` and `record_policy_act` through the `idempotency-key` header, 24 hours | `db_followup_idempotency_rates` | pass (self; built on `develop` in `20261005000000`) | |

## 5. `peek_invite` with BL-334 (S02)

File: `20261015010000_v1_gate_peek_invite_consent_pepper.sql` (ported from `d1cbddb`, sections 5 and 6). Tests: `v1_gate_limits_peek_pepper.test.mjs`, `access_matrix` row `peek_invite`.

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 5.1 | Before consent, `peek_invite` returns only the inviter's sign-off and the role (plus `joined` for a repeat); never the child's name, ids or book data | "[G-13] before consent", "never the child's name or any id", "the answer has exactly the inviter and the role" | pass (self) | |
| 5.2 | Peeking writes nothing but the rate counter: no membership, no audit row, the invite stays open | "peeking does not join or use the invite", "[BL-322] peeking writes no audit row" | pass (self) | |
| 5.3 | Same errors as accept (used, revoked, expired, maker left, full book, deleted book, family invite while off); anonymous SCANO; anon role 42501; membership bucket. After leaving or an undo, the used token answers SCINV, never `joined`; a token outside the app's shape (32 to 128 URL-safe characters) is SCINV at peek and accept | the SCINV, SCCAP, SCANO, 42501, SCRAT rows; `v1_gate_coparent` "[F11-REQ-003] peek and accept ... role_disabled" | pass (self) | |
| 5.4 | BL-334: deleting an account with consent records fails closed (55000) when the pepper is missing, short or blank; hashes keep the old formula; `consent_pepper_ready()` is service only | "[G-12]" rows; `access_matrix` service-only `consent_pepper_ready` | pass (self) | |
| 5.5 | The pepper is set on staging and production before any deletion (APPLY.md step 6) | `select public.consent_pepper_ready()` as the service role on each project, dated | pending (founder) | |

## 6. BL-322: an invite asks before it joins (review H2, app part, S04)

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 6.1 | The invite screen shows "Join {child}'s book as a parent? Invited by {signsAs}" from `peek_invite` and waits for a tap; never accepts on open | S04 test names; Maestro flow F11-join | pending (not started) | |
| 6.2 | Joining never switches the open book without a tap | S04 test | pending | |
| 6.3 | `SCCAP` maps to "parents full" end to end (F11-REQ-026); `SCINV` details `role_disabled`, `code_taken` handled | S04 and S07 tests; `packages/api` `SQLSTATE_RULES` | pending | |
| 6.4 | One idempotency key per user action, reused on every retry (APPLY.md "App changes for file 12") | S04 test of `createCoParentInvite` retries | pending | |

## 7. BL-349: app-level privacy manifest (review L7, S20)

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 7.1 | `ios.privacyManifests` covers React Native's required-reason APIs and `whisper.rn` | `app.config.ts` at the reviewed commit; #100's `preflight-testflight.mjs` output | pending | |
| 7.2 | The archived `.ipa`'s `PrivacyInfo.xcprivacy` is inspected before C1 and its collected types match privacy label 1.4.0 (S17) for the M14 build | Preflight output from a switch-on build; label draft | pending | |

## 8. Cross-cutting

| # | Check | Evidence needed | First pass | Reviewer |
|---|---|---|---|---|
| 8.1 | Every public table has RLS; every column is classified (L1 to L4); content columns are L4 | `classification.test.mjs` | pass (self) | |
| 8.2 | Every table, view and function has an access-matrix row; the anon role executes no public function; every RPC starts with `require_user()` | `access_matrix.test.mjs` structural checks (625 checks, 666 cells in PR #140). **Finding (Critical, `develop` 4183844):** the matrix had no write row for `book_entries`; a probe showed a co-parent can `update book_entries set final_text = ...` on the other parent's in-book letter and the change lands in `entries` (the view runs as its owner). Violates K-10 and the constitution (no one rewrites a person's words). Fixed by `20261015000000` section 6 and pinned by 4.9 | pass (self) after the fix | |
| 8.3 | Every function in `public`, `ops` and `insights` pins `search_path` with `pg_catalog` first and `pg_temp` last; every function an RLS policy calls is in the sweep; a temp table named like ours changes nothing | `v1_gate_search_path.test.mjs` (sweep of 116 functions, the shadowing regression with a negative control) | pass (self) | |
| 8.4 | Whether Supabase grants `TEMP` on the database to `authenticated` and `anon` (the shadowing attack needs a direct SQL session) | `select has_database_privilege('authenticated', current_database(), 'TEMP')` on staging | pending (Unverified since PR #32's review; 8.3 does not depend on the answer) | |
| 8.5 | Author-only working material (raw transcript, machine edits, STT metadata, `language`, and the new `author_edits`, `locked_spans`, `pack_ref`) never leaves through `book_entries` or another member's pull | `v1_wire_contract` "[F06-REQ-033]", "[PRD-REQ-004 Rev]"; `data_governance` K-09 rows | pass (self) | |
| 8.6 | No applied migration is edited; new files sort after the newest applied one | `migration-guard` CI on the PR; `.github/migrations-applied.txt` unchanged | pass (self, guard run locally) | |
| 8.7 | No secret in the repo; service-role keys and the pepper only in Supabase and GitHub Environments | Secret scan on the PR; `docs/ops/SECURITY.md` section 4 settings on staging | pending | |
| 8.8 | Supabase advisors on staging show only the accepted 0029 entries (APPLY.md steps 18 and 21); 0011 (mutable search_path) is empty | Advisor export, dated | pending | |
| 8.9 | Statement logging is off on staging and production, so no row text reaches Postgres logs (FT-10) | Dashboard setting, dated | pending | |
| 8.10 | No content, child name, token or person id in any log, event or push payload (LEGAL-REQ-014); `apple-token` canary | S01's canary tests; S07 `_shared/log` | pending here | |

## 9. Sign-off

| Who | Lens | Verdict | Commits |
|---|---|---|---|
| Review agent (S02 PR #140) | Access rules and RLS correctness | Ready, after the access-review fixes on `feat/db-v1-gate` (15 Oct): DB-01 reproduced on `develop` 4183844 (a co-parent could also hard-delete the other parent's letter through `book_entries`) and closed here; G-08, M5 digest, L1, grants and search_path verified by probe. Residual: transaction-id timing channel (section 10). The fixes were made by the reviewing session, so a second reviewer should read them | the access-review fix commit and its merge on `feat/db-v1-gate` |
| Review agent (S02 PR #140, session `session_0168PaNx5EAx26U99u7pgwX1`) | Migration safety and idempotency | Changes requested at `eace8ea` (the APPLY.md rollback text: 1 major, 6 minor or nit); all seven fixed on `feat/db-v1-gate` (`2e89559`, `a818cfd`); a re-review of the fix commits is owed (PR comment) | eace8ea |
| Review agents (S01 PR #139) | Token and session security; privacy and the kill path | see PR #139 | |
| Review agents (S04, S20 PRs) | per PR | pending | |
| Shared R-17 reviewer (not an author of any of the six) | This whole file, against one set of commits | pending | |
| Founder | Merge and the `approve-migration` label; production stays empty until signed | pending | |

## 10. Open items the review should weigh (not part of the six)

- **Transaction ids as a timing side channel (R-17 access review, 15 Oct 2026, residual of M5).** The digest and rows no longer change with private writes, but `sync_pull` cursors, row `v` values and `sync_push` results are database transaction ids. Their spacing counts every write in the database, so while traffic is near zero (founding family, early beta, nights) a co-parent can time the other parent's private letters, by polling the cursor or by writing their own letters and reading back `v`. Changing only the cursor does not close it. The fix is opaque per-book versions, a sync ADR decision (T15); until then this is an accepted residual risk the founder should sign.
- **Invite fixes from the same review, in files 14 and 15 (unapplied, edited in place).** `accept_child_invite`, `accept_child_invite_by_code` and `peek_invite` treat a repeat by the same person as success only while that person is still a member. `invite_token_well_formed()` applies the app's token shape at peek and accept, because phones now make tokens and a failed call rolls its rate counter back. `undo_parent_join` ignores an invite older than the current membership (support re-add). A primary-key race on the 6-argument `create_child_invite` answers like a replay instead of `token_taken` (no concurrent test: PGlite has one connection). `access_matrix` now fails if any view in `public`, `ops` or `insights` is writable by an API role (DB-01 class).

- **Purged ids and the 60-day ledger (PR #32 DB-02, #51 review finding 2).** `purge_due` on `develop` deletes every `purge_ledger` row after 60 days, so a phone offline past about day 90 could upload a deleted letter again. Keeping letter and book ids for good changes the published retention (DATA-REQ-066): a founder and counsel decision, not changed here.
  - **Update, file 17 (`20261016000000_sync_v1_server.sql`, 16 Oct 2026).** The sync stack's final review (B6, re-check B-R1) needs this closed for Erase now, so file 17 keeps an erasure record (`sync_private.entry_erasures`: letter id, book id, author id, two times; never words) for every letter purged while its book and author exist, and refuses any upload of such an id (`SCDEL` `purged`). It is not trimmed by time; it goes with the book and with the author's account. That is a new operational record with no published clock yet: the founder and counsel either accept "kept until the book or the account is deleted" for Privacy Policy section 10, or name a bound (at least the longest offline window S03 supports), which a forward migration then adds to `sync_housekeeping`.
- **File 17's new surface (not part of the six; for the review that covers sync before it reaches outside the family).** Schema `sync_private` holds definer helpers that signed-in people may execute (so `sync_push` can run as the caller); it is safe only while it is not an exposed schema (supabase/APPLY.md step 15 and File 17). `held_drafts` is author-only while a parent of the book, with no client deletes; `held_drafts_gone` and `entry_erasures` have no client grants. Evidence: `supabase/tests/sync_v1_server.test.mjs`, the `held_drafts` rows in `access_matrix`, and `sync_private` in the `v1_gate_search_path` sweep.
- **A purged letter's photo can be uploaded again (PR #32 finding 2).** No photo upload exists in the v1.0 app; #51's `photo_entry_is_purged` and the path-shape rule are the fix when photos ship.
- **Two S02 pull requests cover the same work.** PR #142 (`fix/db-bl-331-bl-332-membership-integrity`) amends the unapplied `20261005000000` and adds `20261015000000_peek_invite_consent_pepper.sql`; PR #140 adds four new files from `20261015000000`. Both cannot merge (the same migration version, overlapping functions). The founder or coordinator picks one before this review runs.
