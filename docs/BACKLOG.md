# Backlog

The ordered list of work for Early Letters. Format and rules: ADR 0011 (`docs/adr/0011-requirements-and-agent-workflow.md`).
Window: 5 Oct 2026 to App Store submission on Mon 11 Jan 2027 (`docs/ROADMAP.md`, milestones M0 to M13). Last re-planned: 3 Oct 2026 (PRD.md 1.3: founder decisions of 3 Oct, Plus and family contributors at launch, individual publisher; TDD 01 to 10 findings folded in; decisions in `docs/DECISIONS.md`).

Requirements are cited, never copied. Sources: `docs/prd/PRD.md` (PRD-REQ, conflict log K-##; wins over A, B and C where they differ), `docs/prd/A-*.md` (A-REQ, A-NFR), `docs/prd/B-*.md` (B-REQ, B-NFR), `docs/prd/C-*.md` (C-REQ, C-NFR), `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ), `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ; classes C, S, A, T in `docs/legal/data-policy.md` section 2). If a PRD and a LEGAL-REQ disagree, LEGAL-REQ wins until the founder decides. Decisions are cited as D-### (`docs/DECISIONS.md`); design detail as TDD ## section (`docs/tdd/`).

**Numbering.** Existing ids (BL-001 to BL-054) never change. New tasks from 3 Oct 2026 use BL-100 and up, grouped by milestone. **BL-055 to BL-099 are never used**, because TDD 03 and TDD 09 proposed numbers in that range that collide with each other; the appendix maps every TDD proposal (BL-M##, SB-##, BL-060 to BL-090, SEC-##, NEW-##, BL-R##, BL-Q##, BL-P##) to its BL id.

---

## How a scheduled run uses this file

1. Pull `main`. Read `CLAUDE.md`, then this file.
2. Run `gh pr list --state open`. Any task whose `bl-###` appears in an open PR branch is taken.
3. Pick the **first** task in file order with `Status: ready`, `Mode: agent`, and every `Depends on` task `done`. Skip `human`, `pair`, `blocked`, `needs-decision`, `superseded` and `deferred` tasks.
4. One task per run and per PR. Branch: `<type>/<area>-bl-###-<slug>` (for example `fix/db-bl-112-invite-roles`). PR title: `BL-###: <title>`.
5. Meet the Definition of Done below. If a task is bigger than one PR, open a PR that only splits it here (new BL numbers from the next free id in its milestone block, same `Satisfies`), and stop.
6. In the same PR, change only this task's status line to `in-review (PR #n)`. Do not reorder or edit other tasks.
7. If tests fail and the fix is outside the task, open a **draft** PR titled `BL-###: blocked`, say why, and stop.
8. Never: apply a migration to a remote Supabase project, touch secrets or store accounts, edit an applied migration, weaken a test to make it pass, merge a PR, add an analytics, crash or purchase SDK (those tasks are `pair`), or edit a requirement document. Propose requirement changes in the PR body.
9. **Agent fence (D-041).** Until CI and branch protection are on (BL-004, BL-005), unattended runs take only tasks under `packages/*` and `docs/`. After that, any PR touching `supabase/**` or authentication code needs an independent review run and the founder's `approve-migration` label before merge.

Issues: GitHub Issues are an inbox for the founder's bugs and ideas (labels `inbox`, `bug`, `idea`). Agents act on an Issue only after it is copied here as a task. A PR that finishes such a task writes `Closes #n`.

Status values: `ready`, `blocked (reason)`, `needs-decision (D-### or question)`, `in-review (PR #n)`, `done (PR #n)`, `superseded (by BL-###)`, `deferred (v1.1, BL-###)`.
Mode values: `agent` (a scheduled run may do it), `human` (founder, device, store, vendor or secrets), `pair` (interactive session with the founder).
Owner roles: founder, data architect, sync owner, mobile engineer, speech engineer, security engineer, privacy engineer, payments engineer, analytics engineer, QA engineer, design systems, content, legal (counsel-facing drafts). An agent run acts in the named role.
Severity tags in titles: **[Critical]** blocks launch or makes a published statement false; **[High]** must land before the related feature reaches non-founder users. Untagged tasks are needed for v1.0 but lower risk.

---

## Definition of Done (every task)

A PR is done only when all of these hold. The PR template (BL-003) repeats them as a checklist.

1. **Tests.** `npm test`, `npm run typecheck` and `npm run test:db` pass locally and in CI. New behaviour has tests. Every test that proves a requirement starts its title with the ID in brackets, for example `[DATA-REQ-040] raw_sha256 cannot change`. Logic lives in `packages/*` (pure TS, vitest) wherever possible so it can be tested without a phone.
2. **Traceability.** PR body lists `Satisfies:` IDs, matching the task. `scripts/trace.mjs` passes once BL-002 is merged (no unknown IDs).
3. **Constitution.** Nothing writes, rewrites, summarizes or shapes a person's words. Machine edits go through `verifyEdits`. `raw_transcript` stays immutable.
4. **Content rules.** Every user-facing word lives in `packages/content` and passes `packages/content/test/rules.test.ts` (no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never imply AI writes; `{child}` never gendered; no streaks, points, badges or gap counts). The brand name and publisher identity come only from `packages/brand`. If a rule test fails, fix the copy, not the test.
5. **Data classification.** Any new or changed table, column, Storage bucket, device store, SDK or vendor has its row in the data map in the **same PR** (`docs/legal/data-policy.md` section 4 until BL-016 makes `docs/legal/data-map.yaml` canonical), with one class (C, S, A or T) and its level (L1 Public, L2 Internal, L3 Confidential, L4 Restricted; PRD.md 7.10, PRD-REQ-010), owner and retention (DATA-REQ-001, DATA-REQ-002). The PR body states `Data classes touched:`. Content (C) and Sensitive (S) data never reach analytics, logs, crash reports, push payloads, URLs or support prefill (LEGAL-REQ-014, DATA-REQ-004).
6. **Privacy in tests.** Fixtures use only the fictional family "Asha". No real names.
7. **Database.** Schema changes ship as a new file in `supabase/migrations/`; applied migrations are never edited. Every new RLS rule has an access test in `supabase/tests` (LEGAL-REQ-024, B-NFR-003). Migrations reach staging and production only through CI on a tag (D-041).
8. **Performance budgets.** If the task touches a budgeted path, the PR states the budget and how it was checked (unit timing, bundle size, or "needs device check" with a `human` follow-up task). Budgets in play: cold start p50 <= 1.2 s and p90 <= 2.0 s on iPhone SE 3, warm start p50 <= 400 ms, no awaited network or model load on launch (A-NFR-001, A-NFR-002); first-run screens interactive <= 300 ms (B-NFR-008); Settings opens < 300 ms (C-NFR-007); switch child p95 300 ms (PRD 7.1); local save commit p95 200 ms (DATA-REQ-048); Plus sheet under 1 s with cached prices (C-NFR-007); entitlement visible p95 5 s after purchase (C-NFR-002).
9. **Accessibility.** New screens: Dynamic Type to AX5 without truncation (letter text never capped, D-027), VoiceOver labels, 44 pt targets, Reduce Motion honoured (A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051).
10. **Scope.** One concern per PR. Status line updated to `in-review (PR #n)`.

---

## M0. Founder long poles (weeks 1 to 3, then ongoing)

#### BL-100 Domain and support mailbox [Critical]
- Status: ready. Mode: human. Owner: founder. Milestone: M0, week 1. Size: S.
- Satisfies: D-005; prerequisite for A-REQ-022, A-REQ-026, LEGAL-REQ-053, BL-053.
- Scope: choose the domain (earlyletters.com, .app, .co were reported available on 2 Oct; re-check), register it plus defensive redirects, create `support@` and `privacy@` mailboxes, then set `packages/brand` `publisher.domain`, `supportEmail` and `privacyUrl` in one PR (agent may open it; the founder supplies the value). Notes for a later transfer to an organisation account (D-004 point 5) go in `docs/ops/` when written.

#### BL-101 Apple Developer Program, individual enrollment
- Status: ready. Mode: human. Owner: founder. Milestone: M0, week 1. Size: S.
- Satisfies: D-004.
- Scope: enroll as an individual with a 2FA Apple Account; add App Store Connect users only as needed; record who holds which role. The seller name will be the founder's legal name (D-004).

#### BL-102 Paid Applications Agreement, tax and banking
- Status: blocked (BL-101). Mode: human. Owner: founder. Milestone: M0, week 2. Size: S.
- Satisfies: C-REQ-021 (prerequisite for sandbox and production purchases); Small Business Program enrollment.

#### BL-103 App Store Connect setup: app record, bundle ids, subscriptions
- Status: blocked (BL-100, BL-101, BL-102). Mode: human (agent prepares the checklist). Owner: founder, payments engineer. Milestone: M0, week 3. Size: M.
- Satisfies: C-REQ-021, C-REQ-027, LEGAL-REQ-058, D-001, D-048.
- Scope: production bundle id from `bundleId()` after BL-100 (suffixed ids for dev and preview, TDD 01 R-10); app record; subscription group "Plus"; `el_plus_monthly_399` (1-month free intro offer) and `el_plus_annual_2999` (2-month free intro offer); experiment arm products created but not offered (TDD 08 3.1); Billing Grace Period 16 days; Family Sharing off; territories = United States; In-App Purchase key (.p8) into Edge secrets; App Store Server Notifications V2 production and sandbox URLs pointing at `appstore-notifications` once BL-214 deploys to staging. Checklist in `docs/ops/` (product configuration check, TDD 08 F-16). (Source: TDD 08 BL-P02, ADR 0013.)

#### BL-104 Counsel engagement and sign-off
- Status: ready. Mode: human. Owner: founder. Milestone: M0 week 1 (engage), M13 (sign-off). Size: S (founder time), counsel L.
- Satisfies: PRD 2.3 gate 3; LEGAL-REQ-044.
- Scope: send the v1.0 scope (PRD 1.3 section 2) and the questions in Lawyer 1, Lawyer 2 and TDD 05 section 13 by week 1; full package (Terms 1.4.0, Privacy Policy 1.3.0, CHD notice 1.1.0, Subscription terms 1.3.0, in-app disclosures 1.3.0, claims registry) by week 5; sign-off by week 14. Includes the re-tier of web-page LEGAL-REQs (D-002) and D-042, D-021, D-022, D-039, D-049, D-050.

#### BL-105 Perinatal clinician review of safety copy
- Status: ready. Mode: human. Owner: founder. Milestone: M0, answer by 20 Nov. Size: S.
- Satisfies: D-034; LEGAL-REQ-015.

#### BL-106 Vendor evidence and console security
- Status: ready. Mode: human. Owner: founder. Milestone: M0, weeks 1 to 5. Size: S, recurring.
- Satisfies: LEGAL-REQ-022(c), LEGAL-REQ-026, LEGAL-REQ-028, DATA-REQ-062, LEGAL-REQ-020.
- Scope: 2FA on every console (Supabase, Apple, GitHub, PostHog, Sentry, email provider, EAS, model host) with evidence; Supabase encryption at rest in writing; DPAs accepted and archived as dated PDFs (Supabase, PostHog, Sentry, email provider); retention settings (PostHog 12 months, Sentry 90 days) with screenshots. (Source: TDD 04 SEC-01, SEC-02; TDD 05 NEW-20.)

#### BL-107 Staging and production Supabase projects
- Status: ready. Mode: human. Owner: founder. Milestone: M0, weeks 1 to 2. Size: S.
- Satisfies: DATA-REQ-005, DATA-REQ-030, D-041.
- Scope: create `scribe-staging` and `scribe-prod` (US region); production built clean from migrations, never by hand inserts into `schema_migrations` (TDD 02 C20); backups and PITR settings recorded (DATA-REQ-030; TDD 06 OQ-4); CI deploy secrets scoped per environment. (Source: TDD 02 SB-14, TDD 06 BL-R09.)

#### BL-108 EAS account and build credentials
- Status: blocked (BL-101). Mode: human. Owner: founder. Milestone: M0, week 2. Size: S.
- Satisfies: TDD 01 3.10.

#### BL-109 Recruit the C1 beta families
- Status: ready. Mode: human. Owner: founder. Milestone: M12, weeks 6 to 10. Size: S.
- Satisfies: D-045; TDD 07 11.1 coverage list (two co-parent pairs, three grandparents in the app, two Hindi or code-switching speakers, one twins family, two VoiceOver or large-text users).

#### BL-005 Founder setup for the workflow
- Status: ready. Mode: human. Owner: founder. Milestone: M1, week 1.
- Satisfies: none (process; D-041).
- Scope: create Issue labels `inbox`, `bug`, `idea`, `beta`, `S0` to `S3`, `approve-migration`; update the scheduled-run prompt to "follow the protocol at the top of docs/BACKLOG.md"; turn on branch protection for `main` requiring CI; pause unattended runs for `supabase/**` and auth until BL-004 is green. Accept ADR 0011 or send it back.

#### BL-053 Sign-in provider and email setup
- Status: blocked (BL-100). Mode: human. Owner: founder, security engineer. Milestone: M0, weeks 2 to 3.
- Satisfies: A-REQ-016, A-REQ-022, A-REQ-026, A-NFR-009, LEGAL-REQ-026.
- Scope: custom SMTP on the domain with SPF, DKIM, DMARC; Apple Services ID and key with a named owner and rotation date; AASA file for universal links. Google client ids move to v1.1 (D-044). Secrets stay out of the repo. (Was needs-decision on company and domain; company is decided by D-004, the domain is BL-100.)

---

## M1. Guardrails and the security migration pack (weeks 1 to 2)

### E0. Workflow guardrails

#### BL-001 Point CLAUDE.md at the backlog
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1.
- Satisfies: none (process; ADR 0011).
- Scope: add a short "Work selection" section to `CLAUDE.md` that links this file and its run protocol, and adds the `-bl-###-` branch pattern to "Branches and commits". No other edits to `CLAUDE.md`.
- Done when: the section is under 10 lines and `npm test` passes.

#### BL-002 Traceability check
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1.
- Satisfies: none (process; ADR 0011).
- Scope: `scripts/trace.mjs` (Node, no dependencies). Collect IDs defined in the five source files (A/B/C-REQ, A/B/C-NFR, LEGAL-REQ, DATA-REQ) plus PRD-REQ in PRD.md. Collect IDs cited in this file, in test titles across `packages/*/test`, `experiments`, `supabase/tests`, and in `.github/pull_request_template.md`. Fail on any cited ID that is not defined. Write `docs/TRACE.md`: per requirement, its tasks and tests; list P0 IDs with no test as "not yet covered" (report only, never fail). Add `npm run trace` and call it from `npm test`.
- Done when: unit tests for the parser cover each ID family, including numbering gaps (DATA-REQ jumps from 006 to 010); a deliberately wrong ID in a fixture fails.

#### BL-003 Pull request template
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1.
- Satisfies: none (process; ADR 0011).
- Scope: `.github/pull_request_template.md` with `Task: BL-###`, `Satisfies:`, `Data classes touched:`, `Budgets checked:`, `Closes #` (optional), and the Definition of Done as a checklist.

#### BL-004 Continuous integration [Critical]
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1, week 1. Depends on: BL-002.
- Satisfies: LEGAL-REQ-024 (access rules are tested on every change).
- Scope: `.github/workflows/ci.yml` on pull requests and `main`: Node 20, `npm ci`, `npm run typecheck`, `npm test`, `npm run test:db`, parallel jobs, npm and PGlite caches, under 8 minutes. No secrets. Nightly and release workflows follow in BL-275 and BL-283. (Source: TDD 07 BL-Q28.)

#### BL-110 Requirement ids in test titles; database harness sections
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1, week 1. Size: S.
- Satisfies: DoD 1.
- Scope: retitle existing tests with requirement ids; JUnit output and named sections with fresh fixtures in the DB harness; mark `data_governance.test.mjs` line 92 `[KNOWN-DEFECT B-REQ-011]` until BL-175 replaces it. (Source: TDD 07 BL-Q01.)

#### BL-121 Mobile test harness and lint
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M1. Size: M.
- Satisfies: LEGAL-REQ-014 (lint), DoD 1.
- Scope: vitest for `apps/mobile/src/lib/*.logic.ts`, Node SQLite integration tests, a `test` script so root `npm test` covers the app; lint rules (banned imports, no `console` in release); remove unused `expo-symbols` and `expo-glass-effect`. (Source: TDD 01 BL-M01.)

#### BL-117 CI security and platform scans [High]
- Status: blocked (BL-004). Mode: agent. Owner: security engineer. Milestone: M1. Size: M.
- Satisfies: LEGAL-REQ-007, LEGAL-REQ-016, LEGAL-REQ-019, LEGAL-REQ-021, LEGAL-REQ-026, LEGAL-REQ-027, LEGAL-REQ-060, A-NFR-008, A-NFR-010.
- Scope: SDK and import denylist (ads, attribution, tracking, AdSupport, AppTrackingTransparency, HealthKit, face and diarization libraries); manifest lint (permissions, ATS, scheme); gitleaks; Semgrep and SQL lint; OSV and npm audit; placeholder scan (`example.com`, `TODO` publisher values fail release builds only). (Source: TDD 04 SEC-12, TDD 07 BL-Q06, TDD 05 NEW-17.)

#### BL-122 Agent fence and review rule
- Status: blocked (BL-004). Mode: pair. Owner: founder, QA engineer. Milestone: M1. Size: S.
- Satisfies: D-041.
- Scope: path rules so PRs touching `supabase/**` or auth code require the `approve-migration` label and an independent review agent run; limit unattended runs to two a day; document in ADR 0011's consequences (PR body proposes the ADR edit).

### E1. Database integrity, governance and the fix pack

`supabase/migrations/20261002020000_data_governance.sql` fixes findings F1 to F9 in `DELETION_AND_EXPORT_SPEC.md` section 0. It was promoted as **one** migration on 2 Oct 2026 (commit 81d9546), and its cases run in `npm run test:db`. It is written and tested but **not yet applied** to any remote project (BL-015). BL-010 to BL-014 are done in that file; follow-ups are BL-112 to BL-116 below (TDD 02 M5, M7, M8; TDD 05 NEW-01, NEW-02).

#### BL-010 Entry immutability, checksum and version history
- Status: done (commit 81d9546, `20261002020000_data_governance.sql`; remote apply is BL-015). Mode: agent.
- Satisfies: DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-046, DATA-REQ-013 (findings F2, F6, F7, F8).
- Scope: new migration with the immutability guard (including `created_at`), server-set `raw_sha256`, versioning of `machine_edits`, server-clock tombstones via `delete_entry` and `restore_entry`.
- Data classes touched: C (entries), A (versions metadata).

#### BL-011 Members see the book, not the raw transcript
- Status: done (commit 81d9546; remote apply is BL-015). Mode: agent. Depends on: BL-010.
- Satisfies: DATA-REQ-003, DATA-REQ-047, LEGAL-REQ-024 (findings F3, F9).
- Scope: restrict non-author reads of `raw_transcript`, `machine_edits`, `stt_meta`; `photo_path` must start with `{child_id}/{author_id}/`; Storage read policy matches.

#### BL-012 No cascade across authors, no orphaned books
- Status: done (commit 81d9546; remote apply is BL-015). Mode: agent. Depends on: BL-010.
- Satisfies: DATA-REQ-012, DATA-REQ-014, DATA-REQ-015, DATA-REQ-016, B-REQ-016 (findings F1, F4, F5).

#### BL-013 Audit log and deletion state machine
- Status: done (commit 81d9546; remote apply is BL-015). Mode: agent. Depends on: BL-012.
- Satisfies: DATA-REQ-045, DATA-REQ-010, DATA-REQ-011, DATA-REQ-019, DATA-REQ-020, DATA-REQ-026, DATA-REQ-035, DATA-REQ-006, LEGAL-REQ-029, LEGAL-REQ-033.
- Scope: `audit_events` (enum-only detail), `deletion_requests`, `deletion_request_steps`, `legal_holds`, `purge_ledger`, `storage_purge_queue`, `request_account_deletion`, `cancel_account_deletion`, `purge_due`. The worker is BL-234.

#### BL-014 Policy acceptance records
- Status: done (commit 81d9546; remote apply is BL-015). Mode: agent.
- Satisfies: LEGAL-REQ-001, LEGAL-REQ-009, A-REQ-034.

#### BL-112 Fix migration: parent-only invites with explicit role [Critical]
- Status: ready. Mode: agent (pair review; `approve-migration`). Owner: data architect. Milestone: M1, week 1. Depends on: BL-004. Size: M.
- Satisfies: LEGAL-REQ-024, B-REQ-007, B-NFR-002, B-NFR-004, K-18, D-020.
- Scope: replace `create_child_invite(uuid)` with `create_child_invite(p_child, p_role, p_signs_as, p_relation, p_large_print)`: parents only, explicit role, expiry 7 days (co-parent) or 14 days (Family), token plus 8-character code (both hashed), 20 invites per parent per day; `revoked_at`, `code_hash`, `revoke_invite()`; `accept_child_invite` refuses revoked invites and deleted books; purge keyed on `coalesce(revoked_at, accepted_at, expires_at) + 90 days` (D-020); drop the old function. Access tests prove a contributor cannot mint any invite. (Source: TDD 02 M5 / SB-02, TDD 04 task 5, TDD 10 risk 5.)

#### BL-113 Fix migration: client ids for children, due date, live books only [High]
- Status: ready. Mode: agent (`approve-migration`). Owner: data architect. Milestone: M1, week 2. Depends on: BL-004. Size: S.
- Satisfies: A-REQ-015, DATA-REQ-044, B-REQ-005, PRD-REQ-015 (shape only), D-038.
- Scope: `create_child(p_id uuid, p_name, p_date_of_birth, p_due_date, p_first_run_batch boolean, p_client_created_at)` idempotent on `p_id`; check birth date or due date present; `entries_author_insert` also requires `child_is_live(child_id)`. Plus rules arrive in BL-213. (Source: TDD 02 M7 / SB-04, TDD 01 X-7.)

#### BL-114 Fix migration: server consent gates and anonymous guards [Critical]
- Status: ready. Mode: agent (`approve-migration`). Owner: data architect, privacy engineer. Milestone: M1, week 2. Depends on: BL-004. Size: M.
- Satisfies: LEGAL-REQ-001, LEGAL-REQ-002, LEGAL-REQ-006, LEGAL-REQ-008, LEGAL-REQ-009, PRD-REQ-002, K-08 (guards ready for v1.1).
- Scope: `profiles.content_sync_allowed` (L2) maintained by trigger from `policy_acceptances` (terms accepted with `age_attested`, sensitive-data accepted and not withdrawn); RLS `WITH CHECK` on `entries`, `dictionary_terms`, `child_member_prefs` and `create_child` reads it; `my_consent_active(doc)`, `my_feature_gates()`, `my_consents()`; `is_anonymous()` helper and guards on every RPC and policy that an anonymous identity must never reach; `consent.test.mjs`. (Source: TDD 02 M8 / SB-05, TDD 05 X-03 and NEW-02, TDD 07 BL-Q10, TDD 04 task 6.)

#### BL-115 Fix migration: policy versioning and pepper [Critical]
- Status: ready. Mode: agent (`approve-migration`). Owner: privacy engineer. Milestone: M1, week 2. Depends on: BL-004. Size: M.
- Satisfies: LEGAL-REQ-001, LEGAL-REQ-009, LEGAL-REQ-026, DATA-REQ-006, DATA-REQ-064.
- Scope: X-01 (`policy_actions_needed` offers new users the newest version with `new_users_from <= now()`; test "new user during the notice window"); X-11 (clients cannot claim `source='support'`); X-12 (raise if the pepper is empty or short; move the pepper to Supabase Vault or an Edge secret, not a database setting, TDD 04 finding 8); X-15 (replace the stale safety-event retention test). (Source: TDD 05 NEW-01, TDD 04 SEC-05 part.)

#### BL-116 Access-test harness: default grants, RLS matrix, upgrade test [High]
- Status: ready. Mode: agent. Owner: security engineer. Milestone: M1, week 2. Size: L (split if needed).
- Satisfies: LEGAL-REQ-024, B-NFR-003, PRD-REQ-004, PRD-REQ-014.
- Scope: harness mirrors Supabase default grants to `anon` and `authenticated` before migrations, then asserts `anon` reads nothing; generated access matrix from persona fixtures (parent, co-parent, Family, left member, anonymous claims, stranger); migration upgrade-path test; fold `rls.test.mjs` into the matrix. (Source: TDD 02 SB-06 and C18, TDD 04 SEC-04, TDD 07 BL-Q09.)

#### BL-015 Apply the migration pack to staging, then production
- Status: blocked (BL-107, BL-004, BL-112 to BL-115). Mode: human. Owner: founder. Milestone: M1 week 2 (staging); production before the C0 build. Size: S.
- Satisfies: DATA-REQ-006, DATA-REQ-005.
- Scope: CI applies all migrations to `scribe-staging` with `supabase db push` on a tag (D-041), never through the SQL editor; set the consent pepper as a secret before the cron; schedule the hourly `purge_due()` cron; confirm PITR and backup settings against DATA-REQ-030; repeat for production before any non-founder data (C0, week 6).

#### BL-016 Data map is canonical [High]
- Status: ready. Mode: agent. Owner: privacy engineer. Milestone: M1 then M9. Depends on: BL-002. Size: L (split: schema and parser first).
- Satisfies: DATA-REQ-001, DATA-REQ-002, LEGAL-REQ-012, LEGAL-REQ-027, LEGAL-REQ-041, PRD-REQ-010.
- Scope (re-scoped 3 Oct per TDD 05 X-05): `docs/legal/data-map.yaml` with a schema is the single inventory for tables, columns, buckets, device stores, SDKs, log streams, hosts and analytics properties, each with class, L-level, owner, retention and destinations; `scripts/data-map.mjs` checks migrations (`create table`, `add column`), column comments, buckets, dependencies and hosts against it and fails CI on any gap; `data-policy.md` section 4 and DATA_CLASSIFICATION section 4 become generated or checked tables. (Source: TDD 05 NEW-03.)

#### BL-118 Content rule additions and claims registry [High]
- Status: ready. Mode: agent. Owner: content. Milestone: M1. Size: M.
- Satisfies: C-REQ-005, C-REQ-015, K-13, K-32, LEGAL-REQ-044, LEGAL-REQ-045, PRD-REQ-008, PRD-REQ-009.
- Scope: rules for reminder rhythm words ("daily", "every day", "in a row", "missed", day counts), "kids" and child-directed phrases, print and ordering, beta placement (only About strings and, until D-030 is answered, the store beta lines), other platforms' names in iOS copy (App Review 2.3.10), the 90-day pledge wording, gendering outside prompts; `claims.ts` registry with the content rule that every claim string is registered. Scope the exclamation-mark rule per surface (TDD 07 Q-17). (Source: TDD 07 BL-Q05, TDD 05 NEW-19.)

#### BL-119 `child-input` flag in the prompt selector [High]
- Status: ready. Mode: agent. Owner: speech engineer. Milestone: M1. Size: S.
- Satisfies: PRD-REQ-005, LEGAL-REQ-059, B-REQ-013.
- Scope: prompt selection in `packages/core` takes a flag (default off) and never returns `together` prompts while it is off; replace the test that asserts the `together: true` path. (Source: TDD 07 BL-Q04, Q-07.)

#### BL-120 Verifier hardening and property tests [High]
- Status: ready. Mode: agent. Owner: speech engineer. Milestone: M1. Size: M.
- Satisfies: CLAUDE.md constitution, DATA-REQ-040, DATA-REQ-041, DATA-REQ-042.
- Scope: reject the eight meaning-changing edits reproduced in TDD 03 7.1 (negation, tense, `stt_fix` to any dictionary term, contraction, mood); fast-check property suite with the TDD 03 invariants; bump `ENGINE_VERSION` if any rule outcome changes. Required before any model edit pass. (Source: TDD 03 BL-064, TDD 07 BL-Q02.)

#### BL-111 LocalStore interface and schema migrator [High]
- Status: ready. Mode: agent (pair for the interface review). Owner: mobile engineer, sync owner. Milestone: M1 to M2. Depends on: BL-121. Size: L.
- Satisfies: DATA-REQ-040, DATA-REQ-044, DATA-REQ-048 (part), PRD-REQ-011.
- Scope: every SQL call behind a `LocalStore` repository; `PRAGMA user_version` migrations in transactions, tested against fixture DB files from every previous version; `journal_mode=WAL`, `synchronous=FULL`, `foreign_keys=ON`; immutable-after-sync guard (no `child_id` upsert, no direct un-delete; use `restore_entry`); table-filtered `subscribe`. Engine-neutral, so it proceeds before D-023. (Source: TDD 01 BL-M02, TDD 02 finding 5.)

#### BL-032 Local store and atomic save
- Status: superseded (by BL-111 for the store and migrator, BL-130 for the atomic save; the engine choice is D-023).

---

## M2. Capture that cannot lose a word (weeks 2 to 4)

#### BL-030 Day-1 component spike on a real iPhone
- Status: ready. Mode: human (needs a dev build on a phone). Owner: founder, design systems. Milestone: M2.
- Satisfies: none directly (ADR 0101 section 8 gate for all UI tasks).
- Scope: prove Uniwind, Reanimated 4.5.1, Expo Router form sheet and one Expo UI `Host` render together with the React Compiler on. Also check: Uniwind contrast variant, `Uniwind.setTheme` effect on RN `Appearance`, Hermes `Intl.DateTimeFormat` and `PluralRules`, `accessibilityShowsLargeContentViewer` on RN 0.86, RN `Modal` under Reduce Motion (TDD 09). Record results in ADR 0101.

#### BL-031 App identity and build configuration from the brand package [High]
- Status: ready. Mode: agent (EAS secrets: human). Owner: mobile engineer. Milestone: M2. Size: M.
- Satisfies: A-NFR-010, A-REQ-001, LEGAL-REQ-007, LEGAL-REQ-026.
- Scope (extended 3 Oct): `app.config.ts` generated from `packages/brand` and `packages/content` (name, scheme, bundle id with dev and preview suffixes, paper splash, counsel-reviewed microphone purpose string); `eas.json` with development, preview and production profiles; `expo-updates` with fingerprint runtime versions and the OTA policy in TDD 01 3.10 documented in `docs/`. Redirect allowlist and AASA wait for the domain (BL-100). (Source: TDD 01 BL-M10, TDD 10 contradiction 3.)

#### BL-037 18+ root gate and stop screen [Critical]
- Status: ready. Mode: agent (Declared Age Range needs a human sandbox check). Owner: mobile engineer. Milestone: M2. Size: M. The pure gate module and screens start now; moving its storage behind `LocalStore` follows BL-111.
- Satisfies: PRD-REQ-019, LEGAL-REQ-002, A-REQ-012, D-006, D-026.
- Scope: a root-level boot gate (before any first-run screen, welcome action, invite or deep link) asking "Are you 18 or older?" (Yes, No, nothing preselected) with `ageGate.*` copy; iOS Declared Age Range where the API exists, used in memory only. Yes stores `ageGate.passed = 1`; No or an under-18 signal stores only `ageGate.stoppedAt` and shows the stop screen for 24 hours; nothing else is created and no network call happens; remove the "I answered by mistake" instant retry; drop `ageAttestedAt`; VoiceOver announces the stop screen. Gate logic as a pure tested module. Content follow-up for the brand literal in `ageGate.stopBody` and the retired `mistakeButton` goes to the content owner in the same PR. (Source: TDD 01 BL-M03, X-3, X-4; TDD 04 task 9; TDD 09 F18.)

#### BL-040 Boot sequence, launch path and splash
- Status: blocked (BL-030, BL-111, BL-037). Mode: agent, then human device check (BL-044). Owner: mobile engineer. Milestone: M2.
- Satisfies: A-REQ-001, A-REQ-002, A-NFR-001, A-NFR-002.
- Scope (extended 3 Oct): one synchronous `bootstrap()` decides the first route (gate, stop window, pending invite, first run, Tonight) before the splash hides; route groups; root `ErrorBoundary`; content-free diagnostics ring buffer; appearance applied before first render; nothing awaited on launch; analytics initialised only after consent and after first frame. (Source: TDD 01 BL-M04.)

#### BL-137 Welcome screen for v1.0
- Status: blocked (BL-030). Mode: agent. Owner: mobile engineer, content. Milestone: M2. Size: S.
- Satisfies: A-REQ-001, A-REQ-005 (Sign in reachable), D-043.
- Scope: one static welcome screen ("Start a book", "I was invited", "Sign in") before the 18+ gate takes the first action; copy in `packages/content`; works at AX5 and with VoiceOver.

#### BL-041 Story intro
- Status: deferred (v1.1, BL-303; D-043).

#### BL-042 Recording and saving the first letter
- Status: superseded (by BL-130 for capture and save, BL-142 for the voice-only path).

#### BL-130 Recorder session and atomic save [Critical]
- Status: blocked (BL-111). Mode: agent plus human kill test. Owner: mobile engineer. Milestone: M2. Size: L.
- Satisfies: LEGAL-REQ-007, LEGAL-REQ-011, DATA-REQ-046, DATA-REQ-048, A-REQ-012, A-REQ-030, PRD 7.4.
- Scope: draft row written when recording starts; background, interruption and swipe-dismiss stop and keep the take; one-time microphone primer before the OS prompt; low-storage warning below 1 GB; atomic save (letter, audio reference, dictionary updates) in one transaction after the audio is fsynced and SHA-256 hashed; recordings in a backed-up app directory (D-033), never the model; boot recovery sweep for `recording` drafts. Reducer in `packages/core` with tests. (Source: TDD 01 BL-M05, TDD 03 BL-060, TDD 10 risk 2.)

#### BL-134 Launch sweeps and integrity checks
- Status: blocked (BL-111). Mode: agent. Owner: mobile engineer. Milestone: M2. Size: S.
- Satisfies: DATA-REQ-011, DATA-REQ-032, DATA-REQ-046.
- Scope: delete local files of letters tombstoned over 30 days; re-attach or quarantine orphan audio; `PRAGMA integrity_check` after an app update and weekly. (Source: TDD 01 BL-M15.)

#### BL-136 Local schema for per-person settings, dictionary, versions, first-run batch
- Status: blocked (BL-111). Mode: agent. Owner: mobile engineer. Milestone: M2. Size: M.
- Satisfies: PRD-REQ-013, PRD-REQ-015, B-REQ-006, DATA-REQ-041.
- Scope: local `child_member_prefs`, `dictionary_terms`, `entry_versions`, `first_run_batch`; first run creates all children in one transaction and marks the batch for `create_first_run_children`. (Source: TDD 01 BL-M07.)

#### BL-135 Kill-during-save device run (500x)
- Status: blocked (BL-130). Mode: human. Owner: QA engineer, founder. Milestone: M2 then every release candidate. Size: S.
- Satisfies: PRD 7.4, DATA-REQ-048. (Source: TDD 07 BL-Q30.)

#### BL-033 Minimal first-run profile
- Status: blocked (BL-111, BL-037, BL-136). Mode: agent. Owner: mobile engineer. Milestone: M2 to M4.
- Satisfies: B-REQ-001, B-REQ-002, B-REQ-003, B-REQ-006, B-NFR-007, B-NFR-009, LEGAL-REQ-012, A-REQ-035.
- Scope: child name and birthday or due date (required), "What does {child} call you?" signature, languages and Hindi script preference (default per D-031); names and signature seed dictionary terms through `packages/core`. Works offline. Birthdays stored as calendar dates. Copy in `packages/content`. "Add another child" in first run creates one book each, with no Plus sheet, for every child added then (D-007; batch cap 6, D-038).
- Budgets: B-NFR-008 (interactive <= 300 ms).

---

## M3. Transcription in a release build (weeks 2 to 6)

#### BL-043 On-device transcription spike and the 14-recording experiment [Critical]
- Status: ready. Mode: human (dev build, real recordings, `npm run experiment`). Owner: founder, speech engineer. Milestone: M3, weeks 2 to 4.
- Satisfies: none directly (ADR 0001, 0012; D-031).
- Scope: run the 14-recording experiment; measure time to transcript, memory, battery and heat on iPhone SE 3, a 12 and a current iPhone with the BL-140 decoder prototype; decide the default tier (turbo q5_0 or small q5_1) and the Hindi script default by 30 Oct. Results into ADR 0001 and TDD 03 section 5.

#### BL-140 Audio decode module (M4A to 16 kHz PCM in memory) [Critical]
- Status: ready. Mode: agent plus device check. Owner: speech engineer. Milestone: M3. Size: M.
- Satisfies: ADR 0005, LEGAL-REQ-018, DATA-REQ-046.
- Scope: Expo module `scribe-audio-decode` (`probe`, `decodeRange`, `sha256File`, `fsyncFile`) over AVAudioFile and AVAudioConverter; no PCM file ever written; contract test on device. (Source: TDD 03 BL-061.)

#### BL-141 Whisper engine v2 [Critical]
- Status: blocked (BL-140). Mode: agent. Owner: speech engineer. Milestone: M3. Size: L.
- Satisfies: ADR 0001, ADR 0009, B-REQ-003, B-REQ-006, LEGAL-REQ-019.
- Scope: bundled Silero VAD, chunk planner in `packages/core`, per-chunk `transcribeData` with the dictionary prompt, `tokenTimestamps` with `maxLen: 1` merged into words with exact offsets, `SttMeta`, context lifecycle, Core ML off by default, abort cleanup, silence and loop guard. Replaces the `decoder-missing` stub. (Source: TDD 03 BL-062.)

#### BL-142 Transcription queue and voice-only save [Critical]
- Status: blocked (BL-130, BL-141). Mode: agent. Owner: mobile engineer, speech engineer. Milestone: M3. Size: M.
- Satisfies: PRD 7.4, A-REQ-030, LEGAL-REQ-015.
- Scope: one job at a time, persisted status, resume after kill; a spoken letter saves with its audio before text exists and is shown as a voice letter until transcribed (TDD 03 OQ-4: kept local until transcribed, TDD 01 OQ-2); block Save on sample transcripts in release builds; on-device safety tier stored locally behind `safety_card_enabled` (D-034). (Source: TDD 03 BL-063, TDD 01 BL-M06.)

#### BL-143 Model manager [High]
- Status: blocked (BL-022). Mode: agent plus device check. Owner: speech engineer. Milestone: M3. Size: M.
- Satisfies: PRD 7.7, ADR 0001, D-046.
- Scope: manifest with device tiers; resumable Range download to `Application Support/models/*.part` on Wi-Fi by default; SHA-256 verified before rename; excluded from backup (TDD 10 contradiction 2); storage-pressure check; remove and re-download in Settings; versioned URLs on the zero-egress host the founder picks (D-046) with its data-map row. (Source: TDD 03 BL-065.)

#### BL-144 Transcription persistence and alignment column [High]
- Status: blocked (BL-111). Mode: agent (`approve-migration` for the server part). Owner: data architect, speech engineer. Milestone: M3. Size: M.
- Satisfies: PRD-REQ-004, DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-001.
- Scope: draft candidates, `stt_meta`, accepted and rejected `machine_edits`, author edit layer, `audio_sha256`; migration for `entries.alignment` (L4, final text only) and `audio_sha256` with classification comments; `book_entries` exposes `alignment` but never `stt_meta`; access tests. (Source: TDD 03 BL-066, C-1.)

#### BL-145 Word alignment projection and quality gate [High]
- Status: blocked (BL-141, BL-144). Mode: agent. Owner: speech engineer. Milestone: M3. Size: M.
- Satisfies: ADR 0009, PRD-REQ-020.
- Scope: pure projection of word timings through accepted edits onto `final_text` with a quality gate (word, sentence or none); Read together consumes `quality`; no raw transcript leak. (Source: TDD 03 BL-068.)

#### BL-148 Author edits keep the version-replay invariant
- Status: ready. Mode: agent. Owner: speech engineer. Milestone: M3. Size: S.
- Satisfies: DATA-REQ-041.
- Scope: model Review's free-text "Change words" as an author edit layer so `final_text` stays reproducible from `raw_transcript`, machine edits and author edits. (Source: TDD 01 X-8.)

#### BL-147 Golden-audio corpus v1
- Status: ready. Mode: pair (founder recruits speakers). Owner: speech engineer. Milestone: M3 to M12. Size: L.
- Satisfies: TDD 03 7.5 release gate. (Source: TDD 03 BL-069.)

#### BL-146 Suggestions UX in Review
- Status: blocked (BL-120). Mode: agent. Owner: speech engineer, mobile engineer. Milestone: M3 (P1 for v1.0; cut first if late). Size: M.
- Satisfies: ADR 0012, DATA-REQ-042. (Source: TDD 03 BL-067.)

---

## M4. Book, export, reminders, settings (weeks 4 to 8)

#### BL-022 Remote config and kill switches
- Status: ready (decided as a Supabase table, D-035). Mode: agent (`approve-migration` for the table). Owner: data architect, mobile engineer. Milestone: M4. Size: M.
- Satisfies: LEGAL-REQ-040, C-NFR-009, A-REQ-011, PRD-REQ-005, PRD-REQ-020.
- Scope: `app_config` table (public read of non-secret keys, service-role write, audit trigger) with the D-035 keys; client with bundled defaults, cache and refresh after first frame and on foreground, never awaited at launch, fail-safe kill-switch semantics; Edge Functions read kill switches with a 60 s cache. (Source: TDD 01 BL-M09, TDD 02 2.7.)

#### BL-034 Child switcher and per-child local scope
- Status: blocked (BL-111, BL-033). Mode: agent. Owner: mobile engineer. Milestone: M4.
- Satisfies: B-REQ-004, PRD-REQ-011, PRD-REQ-012.
- Scope: every local query scoped by `child_id`; "For {child}" switcher and a "Whose book?" form sheet (replaces the `Alert.alert` picker, which Android cannot render with more than 3 buttons) with `children.switcher.*` copy; "To {child}" in recording and Review, changeable before save; last opened child per device. Logic in `packages/core` with tests. (Source: TDD 01 BL-M08, TDD 09 F12.)
- Budgets: switch child p95 300 ms (PRD.md 7.1).

#### BL-035 Per-child settings
- Status: blocked (BL-034). Mode: agent. Owner: mobile engineer. Milestone: M4.
- Satisfies: PRD-REQ-013, B-REQ-014, C-REQ-012, C-REQ-016.
- Scope: Settings > Children list and "{child}'s book" page with the three scopes in PRD.md K-12; hide and show again; include in my reminders; pause celebrations per person per child. All rows 2 taps or fewer. Copy `children.settings.*`.

#### BL-023 Ask sequencer and analytics consent sheet
- Status: blocked (BL-020, BL-040). Mode: agent. Owner: mobile engineer, analytics engineer. Milestone: M4 to M10.
- Satisfies: PRD-REQ-001, PRD-REQ-016, LEGAL-REQ-003, LEGAL-REQ-008.
- Scope: pure `nextAsk(state)` in `packages/core` returning at most one of Keep the book, reminder prime, analytics consent per session after the first letter, never during recording, review or export; consent sheet with `analyticsConsent.*` copy, nothing preselected; Settings > Privacy rows from `my_consents()`. Tests prove no two asks in one session.

#### BL-150 Offline export (ZIP and PDF) [Critical]
- Status: blocked (BL-111). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: L.
- Satisfies: C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 to DATA-REQ-053, DATA-REQ-056, LEGAL-REQ-013.
- Scope: streaming ZIP64 export from local files with a manifest of hashes, every own entry (raw, edits, final), audio, photos with EXIF stripped, the PDF book and `account.json`; family letters without raw transcripts; works offline and in every plan state; under 2 minutes for a 230 MB year on SE 3; temp cleanup; golden schema test. (Source: TDD 01 BL-M17, TDD 05 NEW-09, TDD 07 BL-Q21.)

#### BL-151 Notification planner and local reminders [High]
- Status: blocked (BL-034). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: C-REQ-001 to C-REQ-007, C-REQ-010 to C-REQ-012, C-REQ-015, B-REQ-014, B-REQ-015, PRD-REQ-013, LEGAL-REQ-054, D-025.
- Scope: pure planner in `packages/core` (cadence "a few evenings a week" default, 07:00 to 21:30, smart quiet, rotation across included children, month-age and birthday notes, hidden-book and due-date rules, DST); primed permission after the first letter (via BL-023); `expo-notifications` local scheduling; lock-screen names off by default from remote config with the Settings toggle (C-REQ-009 at v1.0); payloads carry no content. Tests BL-Q15 and BL-Q16. (Source: TDD 07 BL-Q15, BL-Q16.)

#### BL-157 Lock-screen-safe notification copy
- Status: ready. Mode: agent. Owner: content. Milestone: M4. Size: S.
- Satisfies: D-025, C-REQ-009.
- Scope: notification title and body variants without `{child}` for when names are hidden; Settings toggle label and help line; lock-screen length rules pass.

#### BL-154 Read together free sessions per book
- Status: blocked (BL-022, BL-036). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: S.
- Satisfies: PRD-REQ-020, LEGAL-REQ-050, D-037.
- Scope: count per book on the device, only when highlighted playback starts in try mode, limit from remote config; delete `FREE_READ_TOGETHER_SESSIONS`; single-recording playback never limited. (Source: TDD 01 BL-M13, TDD 08 C-3, TDD 07 BL-Q20.)

#### BL-160 Book and Read together release pass
- Status: blocked (BL-145, BL-034). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: B-REQ-005, C-REQ-010, C-REQ-011, ADR 0009.
- Scope: month chapters and Before You; playback; Read together word highlight from `alignment` with the quality gate (sentence-level or plain playback fallback); quiet milestones inline; 60-letter chapter p95 500 ms.

#### BL-156 Content and localisation debt
- Status: ready. Mode: agent. Owner: content, design systems. Milestone: M4. Size: M.
- Satisfies: CLAUDE.md content rules, B-NFR-007, K-24, D-028.
- Scope: move `pendingCopy` and screen literals into `packages/content`; dates through `Intl.DateTimeFormat` with the device locale in `packages/core`; plurals through `Intl.PluralRules` with `{ one, other }` strings; assembled sentences become templates (`readTogether.position`); `caps` text style instead of `.toUpperCase()`. (Source: TDD 01 BL-M12, TDD 09 BL-085.)

#### BL-158 Help: "If you are struggling" row
- Status: ready. Mode: agent. Owner: content, mobile engineer. Milestone: M4. Size: S.
- Satisfies: D-034, LEGAL-REQ-015.
- Scope: a static, always-available row in Settings > Help with verified US resources (clinician-reviewed wording); the on-device card stays behind `safety_card_enabled`, off unless BL-105 signs off.

#### BL-159 Settings information architecture
- Status: blocked (BL-035). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: C-REQ-016, LEGAL-REQ-008, K-13, K-17.
- Scope: every row within 2 taps; Privacy rows (analytics, sensitive data, backup and shared voice, lock-screen names, audience); Help and Legal (About with the beta label, How transcription works, Support with content-free "Copy diagnostics", If you are struggling, Terms, Privacy Policy, CHD policy, Subscription terms, Subprocessors, Accessibility statement, Licences, 90-day pledge).

---

## M5. Account, sync, co-parent (weeks 4 to 8)

#### BL-050 Keep-the-book sheet with notice and terms
- Status: blocked (BL-130). Mode: agent. Owner: mobile engineer. Milestone: M5.
- Satisfies: A-REQ-013, A-REQ-014, A-REQ-031, A-REQ-034, LEGAL-REQ-001, LEGAL-REQ-045.
- Scope: sheet after the first save with Apple, Email and Later (Google in v1.1, D-044); child-data notice and the Terms line with the 18+ confirmation above the buttons; record `age_attested` in the `terms` acceptance context; Later keeps everything working locally and the sheet returns at most once a day.

#### BL-170 Secure session, deep links and invite tokens [High]
- Status: blocked (BL-040). Mode: agent. Owner: mobile engineer, security engineer. Milestone: M5. Size: M.
- Satisfies: A-REQ-028, A-REQ-032, A-REQ-033, A-NFR-008, LEGAL-REQ-026.
- Scope: `expo-secure-store` with the large-secure-store pattern; deep link parser; invite token to Keychain before any UI; tokens never logged; sign-out only after unsynced letters sync; "sign out other devices". (Source: TDD 01 BL-M14, TDD 04 task 11.)

#### BL-172 Auth configuration as code [High]
- Status: blocked (BL-053). Mode: agent (dashboard values: human). Owner: security engineer. Milestone: M5. Size: S.
- Satisfies: A-REQ-018, A-REQ-025, A-REQ-026, A-REQ-027, A-NFR-009.
- Scope: JWT lifetime 15 minutes, OTP settings, SMTP, anonymous sign-in off in v1.0 (K-08 is v1.1), CAPTCHA decision, documented in `docs/security/`; residual OTP risk accepted per TDD 04 X-1. (Source: TDD 04 SEC-03.)

#### BL-171 Sign in with Apple and token capture [Critical]
- Status: blocked (BL-053, BL-172). Mode: agent plus spike. Owner: security engineer. Milestone: M5. Size: M.
- Satisfies: A-REQ-016, A-NFR-009, A-NFR-011, DATA-REQ-019, DATA-REQ-033, LEGAL-REQ-055.
- Scope: native Sign in with Apple; spike whether Supabase yields the Apple refresh token; if not, an `apple-token-store` Edge Function exchanges the authorisation code; `apple_tokens` table (service only, encrypted); keep each user's Apple subject id (needed for revocation and for a future app transfer, D-004). (Source: TDD 04 task 12, TDD 05 NEW-12, X-25.)

#### BL-051 Email link and code sign-in
- Status: blocked (BL-050, BL-053). Mode: agent. Owner: mobile engineer. Milestone: M5.
- Satisfies: A-REQ-018, A-REQ-023, A-REQ-024, A-REQ-025, A-REQ-027, A-NFR-008.
- Scope: one email with link and 6-digit code; scanner-safe page; resend limits; session tokens only in Keychain-backed storage.

#### BL-054 Sensitive-data consent screen
- Status: blocked (BL-050, BL-114). Mode: agent. Owner: mobile engineer, privacy engineer. Milestone: M5.
- Satisfies: PRD-REQ-002, LEGAL-REQ-006, A-REQ-034.
- Scope: one plain screen after a new account is created and before the first sync, copy `sensitiveConsent.*` (counsel to approve; CHD notice HN-4). "Agree and sync" records `sensitive-data` accept; "Keep on this phone" records decline and keeps sync, backup and family off. Settings > Privacy shows `settings.privacy.sensitiveHelp` and allows withdrawal (modes in BL-240).

#### BL-175 Visibility migration: `book_access`, approvals, leave and remove [Critical]
- Status: blocked (BL-112). Mode: agent (`approve-migration`). Owner: data architect. Milestone: M5. Size: L.
- Satisfies: B-REQ-009, B-REQ-010, B-REQ-011, DATA-REQ-016, DATA-REQ-017, PRD-REQ-004, PRD-REQ-014, D-024, D-039.
- Scope: `book_access` table and triggers; `entries.approval`, `reviewed_by`, `reviewed_at`, `source`; contributors' `in_book` derived from approval; `review_family_letter`, `leave_child(p_keep_in_book)`, `remove_child_member(p_set_aside)`; `book_entries` rewritten on `book_access` with a column allowlist; contributors read name, nickname and birthday month and day only (no due date, D-039); replace the `data_governance.test.mjs` line 92 assertion with the B F9 matrix (a requirement fix, said so in the PR). (Source: TDD 02 M6 / SB-03, C2, C15.)

#### BL-173 Sync design and server RPCs
- Status: needs-decision (D-023: outbox and cursor on expo-sqlite recommended; PowerSync is the alternative). Mode: pair. Owner: sync owner, data architect. Milestone: M5. Size: L.
- Satisfies: DATA-REQ-043, DATA-REQ-044, DATA-REQ-030, DATA-REQ-031, PRD 7.3, ADR 0004 (amended or kept).
- Scope if D-023 is approved: `server_seq` on synced tables (sequence set by trigger); `sync_push(batch)` idempotent upsert keyed by client UUIDv7 through RLS; `sync_pull(cursor)` for own rows and `book_access`-visible rows with tombstones; per-book re-pull when membership or visibility changes; restore epoch so clients re-upload own rows after a server restore instead of deleting local ones (TDD 06 P-1, BL-R10); parity test that pull returns exactly what RLS allows. If PowerSync is chosen instead: the SYNC-1 spike, streams with `book_access`, the op-sqlite copy-and-verify migration, and the vendor no-training clause first (TDD 05 OQ-L15). (Source: TDD 02 SB-01, SB-07, SB-08; TDD 01 BL-M19; TDD 06 BL-R10.)

#### BL-174 Sync client [Critical]
- Status: blocked (BL-173, BL-111). Mode: agent. Owner: sync owner, mobile engineer. Milestone: M5. Size: L.
- Satisfies: DATA-REQ-043, A-REQ-033, PRD 7.3, PRD 7.4.
- Scope: outbox with retries and ordering; `rejected_writes` kept and surfaced; consent rejection (42501) treated as "paused by consent"; sign-out guard; never blocks recording, review, save or reading. Tests TC-16 and BL-Q11. (Source: TDD 02 SB-08, TDD 07 BL-Q11.)

#### BL-052 Re-own local letters on sign-in
- Status: blocked (BL-111, BL-051, BL-113). Mode: agent. Owner: mobile engineer. Milestone: M5.
- Satisfies: A-REQ-015, DATA-REQ-044.
- Scope: move every local row to the signed-in user id in one transaction before any sync, using client ids accepted by `create_child` (BL-113); on failure nothing changes and Retry shows. Tests cover crash mid-transaction (A-NFR-013: no lost letter).

#### BL-176 Co-parent invite in the app
- Status: blocked (BL-175, BL-170). Mode: agent. Owner: mobile engineer. Milestone: M5. Size: M.
- Satisfies: B-REQ-007, PRD-REQ-014, A-REQ-029.
- Scope: invite a co-parent by link or code naming one child; accept in the app (universal link or pasted code); both parents see in-book letters; invite expiry and resend.

#### BL-178 Profile settings and shared dictionary terms
- Status: blocked (BL-175). Mode: agent (`approve-migration`). Owner: data architect. Milestone: M5. Size: S.
- Satisfies: B-REQ-003, B-REQ-006.
- Scope: `profile_settings` (owner only); dictionary unique `(owner_id, child_id, term)` with shared read for child-level `child`, `nickname` and `family` kinds; split owner and child terms in the tests (TDD 07 Q-10). (Source: TDD 02 M11 / SB-17.)

#### BL-177 Cross-device integration stack and two-phone test
- Status: blocked (BL-174). Mode: agent plus human. Owner: QA engineer, sync owner. Milestone: M5. Size: M.
- Satisfies: PRD 7.3, DATA-REQ-043, LEGAL-REQ-014.
- Scope: Supabase CLI stack in CI for sync tests and a chaos suite (offline, kill, duplicate push); manual two-phone script (letter on one phone visible on the co-parent's in p95 5 s). (Source: TDD 02 SB-15.)

#### BL-024 Server business aggregates
- Status: ready (Plus totals added after BL-213). Mode: agent. Owner: analytics engineer, data architect. Milestone: M5 then M8.
- Satisfies: PRD-REQ-017.
- Scope: daily counts (accounts, books, letters saved, family letters, books per family bucket) and, after BL-213, trials, conversions, refunds and churn from `store_subscriptions` and `store_notifications`; counts only, cells under 10 suppressed; service role only with an access test. (Source: TDD 08 BL-024 extension.)

---

## M6. Family contributors in the app (weeks 7 to 10)

#### BL-190 Invite redemption function with rate limits [High]
- Status: blocked (BL-112, BL-236). Mode: agent. Owner: data architect. Milestone: M6. Size: M.
- Satisfies: B-NFR-004, A-REQ-028, B-NFR-002.
- Scope: `invite-redeem` Edge Function (token in the body, never logged) with per-device and per-IP limits (10 code attempts per hour per device; global failed-attempt brake with alert) calling `accept_child_invite` as the user; refuses anonymous callers for any role in v1.0. (Source: TDD 02 SB-10.)

#### BL-191 Contributor first run in the app
- Status: blocked (BL-176, BL-190). Mode: agent. Owner: mobile engineer, content. Milestone: M6. Size: M.
- Satisfies: B-REQ-007, B-REQ-002, PRD-REQ-014, D-002.
- Scope: "I was invited" path after the 18+ gate: sign in, accept, welcome (`family.contributorWelcome.*`), signature, first letter to the named child; contributors never create a child unless they start their own book; contributors never see the Plus sheet (D-036).

#### BL-192 Approvals
- Status: blocked (BL-175, BL-174). Mode: agent. Owner: mobile engineer. Milestone: M6. Size: M.
- Satisfies: B-REQ-009, B-REQ-023 (auto-add and thank you).
- Scope: pending family letters for both parents (first action wins); Add to the book, Keep it aside, Send a thank you; per-member "Add family letters automatically"; contributor sees "With {inviter}" or "In the book".

#### BL-193 Leave and remove with letter retention
- Status: blocked (BL-175). Mode: agent. Owner: mobile engineer. Milestone: M6. Size: S.
- Satisfies: B-REQ-010, B-REQ-016, LEGAL-REQ-032.
- Scope: leave (keep or take my letters from the book) and remove a Family member (parents are equals and cannot remove each other); honest copy about copies already on other phones.

#### BL-194 Family can read and per-child sharing
- Status: blocked (BL-175). Mode: agent. Owner: mobile engineer. Milestone: M6. Size: S.
- Satisfies: B-REQ-011, PRD-REQ-014.
- Scope: "Family can read {child}'s book" per book (private by default); invite names one child and says so; member list per child.

#### BL-195 Visibility matrix and cross-child leak tests [Critical]
- Status: blocked (BL-175, BL-116). Mode: agent. Owner: security engineer, QA engineer. Milestone: M6. Size: M.
- Satisfies: LEGAL-REQ-024, B-NFR-003, B-REQ-006 to B-REQ-011, PRD-REQ-004, PRD-REQ-014.
- Scope: generated matrix for every role and book state through RLS and through the pull RPCs; Nani invited to Asha's book only sees nothing of the sibling's book; contributor without "Family can read" sees only own letters. (Source: TDD 07 BL-Q12, TDD 04 SEC-04.)

#### BL-196 Family-letter push without content
- Status: blocked (BL-192). Mode: agent (APNs key: human). Owner: data architect, mobile engineer. Milestone: M6. Size: M.
- Satisfies: C-REQ-007, LEGAL-REQ-054, C-NFR-005.
- Scope: an Edge Function sends APNs pushes directly (no third-party push service) for a new family letter and "your letter is in the book". Server payloads never carry the child's name or letter text (PRD 7.10; DATA_CLASSIFICATION open issue 4); when lock-screen names are on, the app may render names locally (notification service extension or in-app), never the server. Payloads carry opaque ids for routing only; separate channel from reminders; data-map row for the APNs key and device tokens (L3). Content adds name-free push strings.

---

## M7. Shared voice (weeks 8 to 11; needs D-032)

#### BL-200 Audio key scheme and format
- Status: needs-decision (D-032). Mode: pair. Owner: security engineer. Milestone: M7. Size: M.
- Satisfies: LEGAL-REQ-022(a) (counsel reading), ADR 0006 (v1.0 subset).
- Scope: per-file AES-256-GCM on the phone (react-native-quick-crypto spike), file key wrapped by a server-held key through an Edge Function; `packages/crypto/FORMAT.md` versioned; known-answer tests and fuzz. Vault mode and per-child keys stay later. (Source: TDD 04 SEC-08 reduced, TDD 10 section 2.)

#### BL-201 Audio blobs, bucket and upload policy
- Status: blocked (BL-200, BL-213, BL-232). Mode: agent (`approve-migration`). Owner: data architect. Milestone: M7. Size: M.
- Satisfies: C-NFR-008, DATA-REQ-047, D-032.
- Scope: `audio_blobs` (path, size, sha256, wrapped file key), `entry-audio` bucket with path rules; signed upload URLs issued server-side only when the entry is in a shared book (Free) or `book_has_plus` (Plus); downloads of already uploaded audio never check entitlement. (Source: TDD 02 M12 reduced, TDD 08 BL-P09.)

#### BL-202 Upload queue on the phone
- Status: blocked (BL-201, BL-174). Mode: agent. Owner: mobile engineer. Milestone: M7. Size: M.
- Satisfies: PRD 7.3 (backed-up audio restore), D-032.
- Scope: resumable, background-safe uploads after encryption; retries with backoff; state visible in Settings; never blocks recording or reading.

#### BL-203 Member playback and deletion propagation
- Status: blocked (BL-201). Mode: agent. Owner: data architect, mobile engineer. Milestone: M7. Size: M.
- Satisfies: B-REQ-011, LEGAL-REQ-032, PRD-REQ-014.
- Scope: an Edge Function checks `book_access`, unwraps the file key and returns it with a short-lived URL; device cache with eviction; deleting a letter or leaving a book removes cached copies on next sync.

#### BL-206 Wrap-key custody [High]
- Status: blocked (BL-200). Mode: human plus agent. Owner: security engineer, founder. Milestone: M7. Size: S.
- Satisfies: LEGAL-REQ-023, LEGAL-REQ-040.
- Scope: key only in Edge secrets, never in the database or its backups; sealed offline copy and yearly recovery drill; rotation runbook; every unwrap logged without content; kill switch `escrow_unwrap`. (Source: TDD 06 BL-R18, TDD 04 3.6.4.)

#### BL-205 Shared-voice copy and legal alignment
- Status: needs-decision (D-032). Mode: agent. Owner: content, legal. Milestone: M7. Size: S.
- Satisfies: K-21, K-33, LEGAL-REQ-044.
- Scope: on approval, update the recordings claims in `packages/content` (Settings, store, site) and the Privacy Policy short version, section 4 and Terms 12.1 to say recordings of letters in a shared book upload, encrypted, so family can hear them.

---

## M8. Plus through the App Store (weeks 3 to 12)

#### BL-036 Plan rules engine
- Status: ready. Mode: agent. Owner: payments engineer. Milestone: M8, week 4. Size: M.
- Satisfies: PRD-REQ-015, PRD-REQ-020, C-REQ-023, LEGAL-REQ-050, D-036, D-007, D-008.
- Scope (extended 3 Oct): `packages/core/src/plan.ts` with `decide`, `planActive`, `FreeForever` and `GatedFeature` types (free-forever features cannot be gated at compile time), the TDD 08 2.3 truth table as fixtures and the three property tests; absorbs `canCreateBook` (first-run batch free, joined books never count, hidden books count). (Source: TDD 08 order 1.)

#### BL-212 Notice windows as data
- Status: ready. Mode: agent. Owner: payments engineer. Milestone: M8, week 5. Size: M.
- Satisfies: LEGAL-REQ-047, PRD-REQ-003, D-022.
- Scope: `notice_windows` seed (the D-022 table) and a pure `scheduleFor(snapshot)` with tests N-1 to N-10 (1 March leap and non-leap, 31-day months, DST, trials of 31 and 32 days, cancel after scheduling, birthday inside the window). (Source: TDD 08 BL-P01.)

#### BL-210 expo-iap spike on Expo SDK 57 [Critical]
- Status: blocked (BL-031, BL-103 for sandbox; the StoreKit configuration file works earlier). Mode: pair. Owner: payments engineer. Milestone: M8, week 3. Size: S.
- Satisfies: ADR 0013.
- Scope: `expo-iap` 5.8.x in a dev build: products load, purchase with `appAccountToken`, `currentEntitlementIOS`, `isEligibleForIntroOfferIOS`, `showManageSubscriptionsIOS`, `beginRefundRequestIOS`, transaction updates after a kill; record results in ADR 0013. Fallback per ADR 0013 if it fails.

#### BL-211 App Store Server API and JWS verification in Deno
- Status: ready. Mode: agent. Owner: payments engineer. Milestone: M8, week 3. Size: S.
- Satisfies: ADR 0013.
- Scope: does `@apple/app-store-server-library` run in Supabase Edge Functions through `npm:`? If not, `jose` plus Apple Root CA G3 verification and an ES256 JWT client. Tests use generated test keys, never Apple's.

#### BL-213 Billing migration and Plus rules on the server [Critical]
- Status: blocked (BL-113, BL-114, BL-036). Mode: agent (`approve-migration`). Owner: data architect, payments engineer. Milestone: M8, week 6. Size: L.
- Satisfies: K-28, PRD-REQ-015, C-REQ-021, C-REQ-028, D-038.
- Scope: `app_account_tokens`, `store_subscriptions` (one row per original transaction; 7-year ledger, pseudonymised at deletion), `store_notifications` (`notification_uuid` idempotency), `apply_store_transaction()`, `has_plus`, `book_has_plus`, `get_plan_state`, `my_app_account_token()`; `create_child` and `create_first_run_children` Plus rules; then `notice_schedule` with timestamps, `plan_cards`, `profiles.is_tester` and rule (d) for books made offline under Plus (D-038); DB-1 to DB-9 tests. Note 3 Oct: an uncommitted migration from the parallel data-architect session (`20261003010000_children_and_entitlements.sql`) already covers the first part; this task closes the rest. (Source: TDD 02 M9 / SB-11, TDD 08 order 5, TDD 07 BL-Q19, ADR 0013.)

#### BL-214 App Store notifications endpoint, `sync_plan`, reconcile [Critical]
- Status: blocked (BL-211, BL-213). Mode: agent. Owner: payments engineer. Milestone: M8, weeks 7 to 9. Size: L.
- Satisfies: C-NFR-002, C-REQ-027, C-REQ-029, LEGAL-REQ-049, PRD-REQ-003.
- Scope: `appstore-notifications` (JWS verified, dedupe on `notificationUUID`, map by `appAccountToken`, re-read Get All Subscription Statuses, upsert, recompute notices, consent reconcile, logs without ids); `sync_plan()` RPC from the client's signed transaction; `plan-reconcile` hourly and nightly with Get Notification History; environment rule; replay suite W-1 to W-9 re-pointed to App Store payloads. (Source: TDD 08 BL-P03, ADR 0013.)

#### BL-215 Mobile plan module
- Status: blocked (BL-210, BL-214, BL-050). Mode: pair (adds a purchase SDK). Owner: payments engineer, mobile engineer. Milestone: M8, weeks 8 to 10. Size: M.
- Satisfies: C-REQ-020, C-NFR-003, C-NFR-004, D-036, D-047.
- Scope: `apps/mobile/src/lib/plan.ts`: configure only when signed in; purchase with `appAccountToken` and `finishTransaction` after server confirmation; restore with the D-047 rule; manage and refund; cache precedence (server, StoreKit, cache); replace the `hasPlus` and `isJoinedBook` stubs. (Source: TDD 08 BL-P04.)

#### BL-216 Plus sheet [High]
- Status: blocked (BL-036, BL-215). Mode: agent. Owner: payments engineer, design systems. Milestone: M8, week 10. Size: M.
- Satisfies: C-REQ-022, C-REQ-023, LEGAL-REQ-046, C-NFR-006, C-NFR-007.
- Scope: TDD 08 section 6 rules (no preselection, eligibility from the store, disclosures above the button at AX5, no urgency, no hardcoded prices, never on quiet surfaces); delete `plus-gate.tsx` and the `onContinueDev` bypass; CI bundle grep fails on any dev bypass in production. (Source: TDD 08 BL-P05, C-9; TDD 07 BL-Q17.)

#### BL-217 Purchase consent records
- Status: blocked (BL-214). Mode: agent. Owner: payments engineer. Milestone: M8. Size: S.
- Satisfies: LEGAL-REQ-049, D-049. (Source: TDD 08 BL-P06.)

#### BL-218 Notice scheduler and emails [Critical]
- Status: blocked (BL-212, BL-214, BL-053). Mode: agent. Owner: payments engineer, content. Milestone: M8, weeks 9 to 12. Size: L.
- Satisfies: PRD-REQ-003, C-REQ-024 to C-REQ-026, LEGAL-REQ-047, LEGAL-REQ-053, LEGAL-REQ-054.
- Scope: pg_cron every 15 minutes; transactional templates without child names or promotion, with date, price string, cancel-by date (US Pacific in email, OQ-4) and cancel instructions; in-app cards; one push only for the final trial notice; hard-window refusal that pages the founder; the year-long clock test gates release. (Source: TDD 08 BL-P07, TDD 05 NEW-18, TDD 07 BL-Q18.)

#### BL-219 Settings > Plan
- Status: blocked (BL-215). Mode: agent. Owner: mobile engineer. Milestone: M8. Size: M.
- Satisfies: C-REQ-016, LEGAL-REQ-048, C-REQ-029.
- Scope: status and dates, "Plus is on for {child}'s book" coverage line, Manage or cancel in one tap, Restore, Request a refund; deleting the app does not cancel (said plainly). (Source: TDD 08 BL-P08.)

#### BL-220 Account deletion billing step
- Status: blocked (BL-213, BL-234). Mode: agent. Owner: payments engineer. Milestone: M8. Size: S.
- Satisfies: C-REQ-019, LEGAL-REQ-029.
- Scope: billing notice and Manage link before the final confirm; at hard delete remove `app_account_tokens`, set `store_subscriptions.profile_id` null and pseudonymise consent rows; no third-party call (ADR 0013). (Source: TDD 08 BL-P10.)

#### BL-221 Keep-and-leave end-to-end run [High]
- Status: blocked (BL-215, BL-216, BL-275). Mode: agent. Owner: QA engineer. Milestone: M8. Size: M.
- Satisfies: LEGAL-REQ-050, C-REQ-028, C-NFR-004.
- Scope: Maestro run with the App Store and entitlement hosts blocked and a lapsed fixture: write, read, play, export and play shared audio work; two books writable; a third offers Plus. (Source: TDD 08 BL-P11.)

#### BL-222 Sandbox checklist on device
- Status: blocked (BL-215, BL-218). Mode: human. Owner: founder, payments engineer. Milestone: M8, weeks 11 to 12; every build that changes purchase code. Size: S.
- Satisfies: C-NFR-002, C-NFR-003, C-REQ-020, C-REQ-027, C-REQ-029, LEGAL-REQ-048.
- Scope: S-1 to S-10 from TDD 08 9.1 with sandbox Apple Accounts against staging; signed evidence in `docs/qa/evidence/`.

---

## M9. Privacy, deletion, disclosures, operations (weeks 7 to 12)

#### BL-236 Operations tables migration [High]
- Status: blocked (BL-115). Mode: agent (`approve-migration`). Owner: data architect, security engineer. Milestone: M9. Size: M.
- Satisfies: LEGAL-REQ-025, LEGAL-REQ-037, LEGAL-REQ-040, DATA-REQ-006, D-021.
- Scope: `ops_audit_log` (append-only, 12 months), `security_events` (12 months), `rate_limits` (hashed keys, daily salt), `kill_switches` use by functions; `deletion_request_steps.next_attempt_at`, queue `last_error_code`; `purge_due(p_limit)` batching; re-enqueue on conflict with a done row; one-row cancel audit (TDD 02 C13). (Source: TDD 02 M10 / SB-09, TDD 04 SEC-05, TDD 05 X-07.)

#### BL-232 Bucket registry and purge coverage [Critical]
- Status: blocked (BL-236). Mode: agent (`approve-migration`). Owner: privacy engineer. Milestone: M9 (before M7 uploads). Size: M.
- Satisfies: DATA-REQ-011, DATA-REQ-047, DATA-REQ-066, LEGAL-REQ-031.
- Scope: a `bucket_registry` function; `purge_due` and `prepare_account_purge` enqueue every registered bucket (photos, `entry-audio`, avatars, exports); export expiry sweep; CI fails if a bucket in the data map is missing from the registry; shared-area object ownership handled by copy (TDD 02 C7, OQ-B9). (Source: TDD 05 NEW-05, X-04.)

#### BL-233 In-app account deletion flow
- Status: blocked (BL-051). Mode: agent. Owner: mobile engineer. Milestone: M9. Size: M.
- Satisfies: C-REQ-019, LEGAL-REQ-029, DATA-REQ-019 to DATA-REQ-023, K-22.
- Scope: export offered first; co-parent told their letters leave the shared book; billing notice (BL-220); type to confirm; 30-day undo; device wipe on next launch after completion.

#### BL-234 Purge worker [Critical]
- Status: blocked (BL-232, BL-236, BL-171). Mode: agent. Owner: privacy engineer. Milestone: M9. Size: L.
- Satisfies: DATA-REQ-011, DATA-REQ-019 to DATA-REQ-023, DATA-REQ-033, DATA-REQ-034, DATA-REQ-036, LEGAL-REQ-029, LEGAL-REQ-031, LEGAL-REQ-038.
- Scope: `purge-worker` Edge Function draining the queue and account steps (Postgres, Storage, Auth user, Apple token revocation, email provider suppression), backoff, verification step, SLA monitor and alerts; fake-vendor tests TC-19. (Source: TDD 05 NEW-06, TDD 02 SB-13, TDD 07 BL-Q22.)

#### BL-235 Analytics deletion at request time
- Status: blocked (BL-020). Mode: agent. Owner: analytics engineer. Milestone: M9. Size: S.
- Satisfies: DATA-REQ-033, PRD-REQ-018, D-003.
- Scope: stateless `analytics-forget` function called once by the deletion flow with the current analytics id in memory; logs counts only; the `posthog` deletion step marked not applicable at execution; disclosure that cancelling deletion cannot restore analytics. (Source: TDD 05 NEW-07, X-02.)

#### BL-237 Runbook wrapper, DSAR log, support deletion
- Status: blocked (BL-236). Mode: agent. Owner: privacy engineer. Milestone: M9. Size: M.
- Satisfies: LEGAL-REQ-025, LEGAL-REQ-036, LEGAL-REQ-057, DATA-REQ-027.
- Scope: `scripts/runbook.mjs` writes `ops_audit_log` first and refuses without a ticket; `privacy_requests` table and `ops/dsar.mjs`; `support_request_deletion` (service role, grace 0 for under-13 reports). (Source: TDD 05 NEW-11, TDD 04 SEC-10.)

#### BL-238 Cross-system deletion verification script
- Status: blocked (BL-234). Mode: agent. Owner: privacy engineer. Milestone: M9. Size: M.
- Satisfies: LEGAL-REQ-029, DATA-REQ-034. (Source: TDD 05 NEW-16.)

#### BL-239 Network capture, consent gating and log canary [High]
- Status: blocked (BL-275). Mode: agent. Owner: QA engineer, privacy engineer. Milestone: M9. Size: M.
- Satisfies: LEGAL-REQ-003, LEGAL-REQ-014, LEGAL-REQ-015, DATA-REQ-004, A-NFR-012.
- Scope: proxy-based E2E checks (zero PostHog or Sentry requests before consent; nothing queued on disk; no tier in any request); canary family "Asha" never in device logs, function logs, push payloads or analytics bodies; typed ops logger with redaction; Sentry scrub rules for PostgREST errors. (Source: TDD 05 NEW-15, TDD 07 BL-Q03, BL-Q07, TDD 04 SEC-13, TDD 06 BL-R05, BL-R06.)

#### BL-240 Sensitive-data withdrawal modes
- Status: blocked (BL-054). Mode: agent. Owner: privacy engineer. Milestone: M9. Size: S.
- Satisfies: LEGAL-REQ-006. (Source: TDD 05 NEW-08, X-08; default mode `offer` until counsel answers OQ-L1.)

#### BL-231 Privacy labels and manifest rendered from the data map [High]
- Status: blocked (BL-016). Mode: agent. Owner: privacy engineer. Milestone: M9. Size: M.
- Satisfies: LEGAL-REQ-042, LEGAL-REQ-043.
- Scope: `PrivacyInfo.xcprivacy` and the App Store label answers generated per build with an evidence hash; release script fails on drift. (Source: TDD 05 NEW-04.)

#### BL-241 Security programme documents and runbooks
- Status: ready. Mode: agent. Owner: security engineer. Milestone: M9. Size: S.
- Satisfies: LEGAL-REQ-028, LEGAL-REQ-039, LEGAL-REQ-040.
- Scope: `docs/security/WISP.md` (short form), `risk-register.md`, runbooks RB-1 to RB-8 in `docs/runbooks/`, `affected_users` script and breach templates. (Source: TDD 04 SEC-20, SEC-14; TDD 06 BL-R16.)

#### BL-242 Health views, cron and alerts
- Status: blocked (BL-236). Mode: agent plus human (alert channel). Owner: data architect. Milestone: M9. Size: M.
- Satisfies: DATA-REQ-036, LEGAL-REQ-038.
- Scope: content-free health views, `ops-health` cron, uptime check on the RPC endpoint, alerts for deletion SLA, notice-window misses and 5xx spikes to the founder's phone (channel per TDD 06 OQ-2). (Source: TDD 06 BL-R08.)

#### BL-243 Static deletion and privacy-choices pages
- Status: blocked (BL-100). Mode: agent. Owner: privacy engineer, content. Milestone: M9. Size: S.
- Satisfies: D-042, LEGAL-REQ-030 (v1.0 part), LEGAL-REQ-045.
- Scope: `https://<domain>/delete-account` and `/privacy-choices` as static pages naming the app and explaining in-app deletion and the email route; versioned legal pages published at their URLs.

#### BL-244 Value-free validation for content tables [High]
- Status: ready. Mode: agent (`approve-migration`). Owner: data architect. Milestone: M9. Size: S.
- Satisfies: LEGAL-REQ-014.
- Scope: a trigger that checks lengths and enums and raises without echoing the row, so Postgres error `DETAIL` never carries letter text (TDD 06 P-2). (Source: TDD 06 BL-R07.)

#### BL-245 Device data-protection assertions
- Status: blocked (BL-130). Mode: human plus agent. Owner: security engineer. Milestone: M9. Size: S.
- Satisfies: LEGAL-REQ-022(b), DATA-REQ-023.
- Scope: assert the iOS Data Protection class on the database and audio files, Keychain options, wipe on deletion, app-switcher snapshot masking; record the SQLCipher "no for v1" decision under LEGAL-REQ-022(d). (Source: TDD 04 SEC-11 reduced.)

#### BL-247 Server restore drill and ledger replay
- Status: blocked (BL-173, BL-107). Mode: pair. Owner: data architect. Milestone: M9. Size: M.
- Satisfies: DATA-REQ-030, DATA-REQ-031.
- Scope: restore staging to a new project, bump the restore epoch, prove clients re-upload and nothing is deleted on any device; replay the purge ledger. (Source: TDD 02 SB-20, TDD 06 BL-R10 drill.)

#### BL-248 Email-code abuse detection
- Status: blocked (BL-236, BL-172). Mode: agent. Owner: security engineer. Milestone: M9. Size: M.
- Satisfies: A-REQ-027 (residual), LEGAL-REQ-037. (Source: TDD 04 SEC-06; sign-in alert email P1.)

#### BL-249 Session kill switch
- Status: blocked (BL-236). Mode: pair. Owner: security engineer. Milestone: M9. Size: M.
- Satisfies: LEGAL-REQ-040.
- Scope: spike `db_pre_request` epoch check and signing-key revocation; runbook and drill so all sessions end within 5 minutes. (Source: TDD 04 SEC-07, X-2.)

---

## M10. Opt-in analytics (weeks 7 to 10)

#### BL-020 Typed analytics catalogue and allowlist
- Status: ready (package exists with 39 tests; this task closes the gaps). Mode: agent. Owner: analytics engineer. Milestone: M10.
- Satisfies: LEGAL-REQ-003, LEGAL-REQ-017, LEGAL-REQ-016, A-NFR-012, B-NFR-001, C-NFR-005, C-REQ-034, PRD-REQ-016, PRD-REQ-018.
- Scope: confirm the full product catalogue (PRD.md K-01) and add purchase and family events from TDD 08 section 12 and TDD 03 4.5; never send goal keys (TDD 05 X-23); children only as ordinals and `child_count_bucket`; every property L2 in the data map.

#### BL-021 Crash and log scrubber
- Status: ready. Mode: agent. Owner: analytics engineer. Milestone: M10. Depends on: BL-020.
- Satisfies: LEGAL-REQ-014, A-NFR-012, DATA-REQ-004.
- Scope: pure `scrubEvent()` and `scrubBreadcrumb()` in `packages/analytics` matching Sentry's `beforeSend` shape; `setUser` never called.

#### BL-251 Consent version and pending acts
- Status: blocked (BL-020). Mode: agent. Owner: analytics engineer. Milestone: M10. Size: S.
- Satisfies: LEGAL-REQ-003, LEGAL-REQ-009.
- Scope: the local consent store keeps `{status, version, decided_at}`; a newer major version counts as unknown; pending acts upload through `record_policy_act` on sign-in. (Source: TDD 05 X-13.)

#### BL-250 Analytics wiring in the app
- Status: blocked (BL-020, BL-021, BL-023, BL-251; counsel approval of `analyticsConsent.*`). Mode: pair (adds analytics and crash SDKs). Owner: analytics engineer, mobile engineer. Milestone: M10. Size: M.
- Satisfies: PRD-REQ-016, PRD-REQ-018, LEGAL-REQ-003, LEGAL-REQ-017, A-NFR-012, D-003.
- Scope: settings KV adapter, lazy PostHog only after consent, router `screen_view` with route templates, AppState flush, Sentry gated on the same consent with BL-021 scrubbers, Settings > Privacy toggle, queued `record_policy_act`. (Source: TDD 01 BL-M11.)

#### BL-252 Analytics contract test with the real SDK
- Status: blocked (BL-250). Mode: agent. Owner: QA engineer. Milestone: M10. Size: S.
- Satisfies: PRD checklist 6.9 (nothing queued on disk before consent).
- Scope: vendor-adapter test with the real PostHog React Native SDK under jest-expo, plus a container scan after a fresh install. (Source: TDD 07 section 8, Q-11.)

---

## M11. Accessibility and design system (weeks 3 to 11, parallel)

All depend on BL-030 unless marked. Order: BL-255, BL-256, BL-267, BL-268 first; then BL-257, BL-259, BL-261, BL-264; then BL-260, BL-262, BL-263, BL-265; then BL-266 and BL-269.

#### BL-255 Accessibility helpers
- Status: ready. Mode: agent. Owner: design systems. Size: S. Satisfies: A-NFR-007, PRD 7.6, LEGAL-REQ-051.
- Scope: `announce`, `useFocusOnMount`, `useIsAccessibilitySize`, `useTheme`, `useContrastPreference`. (Source: TDD 09 BL-070.)

#### BL-256 Token additions, including `destructive` [High]
- Status: ready. Mode: agent. Owner: design systems. Size: S. Satisfies: LEGAL-REQ-051, PRD 7.6, D-029.
- Scope: type scale, control-contrast values that pass 3:1 (input borders, outline buttons, switch off-track, edit underline), target sizes, motion additions, `destructive` token, tests. (Source: TDD 09 BL-071.)

#### BL-257 Type tokens and `Text` variants
- Status: blocked (BL-256). Mode: agent. Owner: design systems. Size: M. Satisfies: A-NFR-005, B-NFR-006. (Source: TDD 09 BL-072.)

#### BL-258 Fonts, including Devanagari
- Status: blocked (BL-030). Mode: agent. Owner: design systems. Size: M. Satisfies: B-REQ-003, A-NFR-001. (Source: TDD 09 BL-073.)

#### BL-259 Buttons with minimum heights
- Status: blocked (BL-256, BL-257). Mode: agent. Owner: design systems. Size: M. Satisfies: A-NFR-005, A-NFR-007. (Source: TDD 09 BL-074.)

#### BL-260 Text fields with announced errors
- Status: blocked (BL-255, BL-257). Mode: agent. Owner: design systems. Size: S. Satisfies: B-NFR-006. (Source: TDD 09 BL-075.)

#### BL-261 Choice groups, chips, segmented control
- Status: blocked (BL-256). Mode: agent. Owner: design systems. Size: M. Satisfies: A-NFR-007, LEGAL-REQ-051. (Source: TDD 09 BL-076.)

#### BL-262 Sheets through formSheet
- Status: blocked (BL-030). Mode: agent. Owner: design systems. Size: M. Satisfies: PRD 7.6, B-REQ-012. (Source: TDD 09 BL-077.)

#### BL-263 Toggle and list rows
- Status: blocked (BL-030). Mode: agent. Owner: design systems. Size: S. Satisfies: LEGAL-REQ-051. (Source: TDD 09 BL-078.)

#### BL-264 Persistent toast; delete without a timed undo [High]
- Status: blocked (BL-255). Mode: agent. Owner: design systems. Size: S. Satisfies: WCAG 2.2.1, PRD 7.6. (Source: TDD 09 BL-079.)

#### BL-265 Uncapped letter text with script runs [High]
- Status: blocked (BL-257, BL-258). Mode: agent. Owner: design systems. Size: M. Satisfies: A-NFR-005, B-REQ-003, D-027. (Source: TDD 09 BL-080.)

#### BL-266 AX5 stacking pass on every P0 screen [High]
- Status: blocked (BL-259 to BL-263). Mode: agent (one PR per screen if needed). Owner: design systems. Size: L. Satisfies: A-NFR-005, C-NFR-006. (Source: TDD 09 BL-081.)

#### BL-267 Motion rules
- Status: ready. Mode: agent. Owner: design systems. Size: S. Satisfies: A-REQ-008, PRD 7.6. (Source: TDD 09 BL-082.)

#### BL-268 Accessibility lint rules
- Status: ready. Mode: agent. Owner: design systems. Size: S. Satisfies: LEGAL-REQ-051. (Source: TDD 09 BL-086.)

#### BL-269 Component tests at default size and AX5
- Status: blocked (BL-259 to BL-263, BL-278). Mode: agent. Owner: design systems. Size: M. Satisfies: LEGAL-REQ-051. (Source: TDD 09 BL-087.)

#### BL-270 Native tabs
- Status: blocked (BL-030). Mode: agent. Owner: design systems. Size: S. Satisfies: PRD 7.6, A-NFR-005. (Source: TDD 09 BL-083; cut first if late.)

#### BL-271 Increase Contrast and Reduce Transparency variants
- Status: blocked (BL-256, BL-030). Mode: agent. Owner: design systems. Size: M. (Source: TDD 09 BL-084; cut to v1.1 if late.)

#### BL-272 Recording-without-words state
- Status: blocked (BL-142). Mode: agent. Owner: design systems. Size: S. Satisfies: WCAG 1.2.1. (Source: TDD 09 BL-090.)

#### BL-273 Accessibility statement
- Status: ready. Mode: agent. Owner: content, legal. Size: S. Satisfies: LEGAL-REQ-052. (Source: TDD 09 BL-089.)

---

## M12. Beta and release engineering (weeks 6 to 14)

#### BL-278 Component test harness
- Status: blocked (BL-030). Mode: agent. Owner: QA engineer. Size: M. Satisfies: A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051. (Source: TDD 07 BL-Q08.)

#### BL-275 Maestro harness and nightly workflow
- Status: blocked (BL-004, BL-031, BL-111). Mode: agent plus human CI setup. Owner: QA engineer. Size: L.
- Satisfies: all E2E checklist lines.
- Scope: `e2e` build profile, seed, clock and config deep links (blocked in release builds), mitmproxy scripts, container and export inspectors; nightly and release workflows on macOS. (Source: TDD 07 BL-Q25, TDD 01 BL-M16.)

#### BL-276 E2E flows 01 to 04
- Status: blocked (BL-275, BL-037, BL-033, BL-130, BL-050). Mode: agent. Owner: QA engineer. Size: M. Satisfies: PRD-REQ-019, B-REQ-001, A-REQ-012 to A-REQ-014, K-14. (Source: TDD 07 BL-Q26.)

#### BL-277 E2E flows 05 to 15
- Status: blocked (BL-275 and each feature). Mode: agent. Owner: QA engineer. Size: L. Satisfies: PRD checklist section 6. (Source: TDD 07 BL-Q27.)

#### BL-044 Device budget check
- Status: blocked (BL-040). Mode: human. Owner: founder, QA engineer. Milestone: M12, every release candidate.
- Satisfies: A-NFR-001, A-NFR-003, B-NFR-008, C-NFR-007, PRD 7.1, PRD 7.7.
- Scope (extended 3 Oct): perf build profile and measurement script on iPhone SE 3 with year-1 and year-5 fixtures; cold and warm start, first-run interactivity, Book scroll frame time, export time; MetricKit readout into diagnostics. (Source: TDD 01 BL-M18, TDD 06 BL-R13.)

#### BL-279 Manual scripts and evidence
- Status: ready. Mode: agent (scripts), human (runs). Owner: QA engineer. Size: S.
- Satisfies: manual checklist lines in PRD section 6; LEGAL-REQ-051.
- Scope: scripts M-01 to M-09, VoiceOver script V-1 to V-7, XCUITest accessibility audit target, `docs/qa/evidence/` template. (Source: TDD 07 BL-Q23, TDD 09 BL-088.)

#### BL-280 Beta programme setup
- Status: blocked (BL-275). Mode: pair. Owner: QA engineer, founder. Milestone: M12, week 6 (C0), week 10 (C1). Size: M.
- Satisfies: D-045, TDD 07 section 11.
- Scope: TestFlight internal and external groups; welcome note (no screenshots of letters); content-free "Report a problem"; triage board with `beta` and `S0` to `S3` labels; exit criteria from ROADMAP M12. (Source: TDD 07 BL-Q29.)

#### BL-282 Load test at 2x the 1k-family targets
- Status: blocked (BL-107, BL-174). Mode: agent plus human. Owner: QA engineer. Size: L. Satisfies: PRD 7.8. (Source: TDD 02 SB-16, TDD 06 BL-R11.)

#### BL-289 Realistic database performance data
- Status: ready. Mode: agent. Owner: data architect. Size: M. Satisfies: PRD 7.2, PRD 7.8.
- Scope: 300-word letters with `stt_meta`, `machine_edits` and versions; write-path timings with triggers on; `purge_due(p_limit)` on 10k due rows. (Source: TDD 06 BL-R01, BL-R02.)

#### BL-284 Durability drill
- Status: blocked (BL-150, BL-174). Mode: human. Owner: founder, QA engineer. Milestone: M12, every release candidate. Size: S.
- Satisfies: D-033, PRD 7.5.
- Scope: iCloud device backup then restore to a second phone; export ZIP then re-read; sign in on a new phone and re-download text (and shared audio if D-032).

#### BL-283 Release engineering and the founder checklist
- Status: blocked (BL-275). Mode: agent. Owner: QA engineer. Size: M.
- Satisfies: TDD 10 section 3; PRD 2.3.
- Scope: `docs/ops/RELEASE.md` (20 lines the founder runs per release, each linking automated evidence); release workflow from `ios-v*` tags; OTA gate questions ("does this change collection or destinations?"); pre-submission checklist; review-notes template with a demo account and the 5.1.1(ix) positioning (D-004).

#### BL-288 Android CI build (parity watch)
- Status: blocked (BL-031). Mode: agent. Owner: mobile engineer. Size: M. Satisfies: PRD 2.1 portability.
- Scope: Android build in CI and the small parity fixes (`haptics.android.ts`, BackHandler in Listen, audio mode); not shipped. (Source: TDD 01 BL-M20.)

#### BL-286 Store listing and submission
- Status: blocked (BL-104, BL-231, BL-280 exit). Mode: human. Owner: founder, content. Milestone: M13, weeks 14 to 15. Size: M.
- Satisfies: LEGAL-REQ-041 to LEGAL-REQ-045, LEGAL-REQ-058, D-030.
- Scope: listing text (store beta line per D-030), screenshots, Lifestyle category, privacy labels entered with evidence, review notes, products attached to the version, territories = United States; submit Mon 11 Jan 2027.

---

## Brand, email and web handoffs (BL-300 to BL-329; from the email and brand lane, 3 Oct 2026)

Source: branch `feat/email-brand-library`, the reviews in `docs/reviews/2026-10-03/`, the audit `docs/brand/CONSISTENCY_AUDIT.md`, decisions D-051 to D-064, and the activity record `docs/brand/activity/`. Ids BL-300 to BL-329 are reserved for this block.

**Assignment rule for this block (proposed for all tasks).** When an agent picks up a task, the PR that takes it changes the status line to `in-review (PR #n). Assignee: agent:<handle>, run <run id>`, so every task names the agent identity and run that did it. Founder tasks say `Assignee: founder`.

#### BL-300 Brand system: primary mark, asset registry, brand book
- Status: in-review (PR pending). Assignee: agent:design-systems, runs a84743e25427a87b5, ae4698bb9d7faf53f. Mode: agent. Owner: design systems. Milestone: M11. Size: M.
- Satisfies: D-051, D-052.
- Scope: `packages/brand` primary mark, `registry.ts` with `assetFor(context)` and tests, email logos, favicons, OG image, fonts for email; `docs/brand/BRAND_SYSTEM.md`.

#### BL-301 Email library and Supabase auth templates
- Status: in-review (PR pending). Assignee: agent:design-systems and agent:content, runs listed in `docs/brand/activity/2026-10-03.jsonl`. Mode: agent. Owner: design systems. Milestone: M5. Size: L.
- Satisfies: D-044, D-061, D-062; LEGAL-REQ on transactional email (see `docs/emails/COMPLIANCE.md`).
- Scope: `packages/emails` (components, 39 templates, render and Supabase export), `packages/content/src/emails`, `supabase/templates`, `docs/emails`.

#### BL-302 Copy and legal web drafts after the founder decisions of 3 Oct
- Status: in-review (PR pending). Assignee: agent:content and agent:legal. Mode: agent. Owner: content. Milestone: M9. Size: M.
- Satisfies: D-053 to D-064.
- Scope: `packages/content/src` (site, store, pages, strings), `packages/content/legal/*.md` (drafts, counsel review pending), glossary in `BRAND.md`.

#### BL-303 App icon and splash from the registry
- Status: ready. Mode: pair (needs a Mac for the Icon Composer file). Owner: mobile engineer. Milestone: M11. Size: S.
- Satisfies: D-051; audit CA-003, CA-004, CA-006.
- Scope: build the iOS 26 Icon Composer file from `icon.app.default`, `icon.app.dark` and `icon.app.tinted`; splash from `app.splash`; remove Expo scaffold images (CA-005); confirm EAS accepts icon paths outside `apps/mobile`.

#### BL-304 Brand fonts and type scale in the app
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M11. Size: M.
- Satisfies: audit CA-017, CA-018; DESIGN_LANGUAGE type scale.
- Scope: load Literata, Mukta and Tiro Devanagari Hindi with expo-font (subset); map headings to `tokens.type`; welcome screen uses the stacked lockup artwork (CA-007, D-060).

#### BL-305 Move app strings into packages/content and wire new keys
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: CLAUDE.md content rules; audit CA-036; review CUS-03.
- Scope: move `pendingCopy` and permission strings into content; wire `en.settings.plan`, `en.settings.account`, `en.auth`, `en.coParentLeft`; rename `tidy*` keys to "Word for word" (D-054); microphone purpose string without "share with family"; hide v1.1 family screens.

#### BL-306 App reports subscription status to the server
- Status: ready. Mode: pair. Owner: payments engineer. Milestone: M8. Size: M. Depends on: BL-307.
- Satisfies: D-061 (narrows Brief decision 3), D-022.
- Scope: after StoreKit 2 entitlement checks, send plan, trial end, renewal date and cancelled flag only (no payment data, no receipts) through `packages/api`.

#### BL-307 Subscription status table and endpoint
- Status: ready. Mode: pair (founder `approve-migration`). Owner: data architect. Milestone: M8. Size: M.
- Satisfies: D-061; data map entry required (DATA-REQ-001).
- Scope: new migration and RPC per the `packages/api` contract; RLS tests; retention; privacy data map row. Platform coordinator area.

#### BL-308 Renewal and trial reminder scheduler
- Status: blocked (BL-307). Mode: agent. Owner: sync owner. Milestone: M8. Size: M.
- Satisfies: D-022, D-061; California B&P 17602 notices (`docs/emails/COMPLIANCE.md`).
- Scope: schedule `trial-*`, `annual-renewal-*` and `price-increase` emails from reported status; payers only; idempotent sends; suppression-safe (never put transactional mail on Resend's account-wide suppression list).

#### BL-309 Supabase Auth sends through Resend
- Status: ready. Mode: pair. Owner: security engineer. Milestone: M5. Size: S.
- Satisfies: D-044, D-062; `supabase/auth-email.md`.
- Scope: custom SMTP or Send Email Hook per the runbook; apply `supabase/templates`; sending-only Resend key for earlyletters.com; redirect allowlist; OTP 6 digits, 15-minute expiry.

#### BL-310 Send the new account emails
- Status: blocked (BL-309). Mode: agent. Owner: sync owner. Milestone: M9. Size: S.
- Satisfies: review CUS-04, CUS-14.
- Scope: send `coparent-left`, `deletion-confirm`, `passkey-added` and `new-device-sign-in` through the email hook with the React Email templates.

#### BL-311 Sign-in providers removed at account deletion
- Status: ready. Mode: agent. Owner: security engineer. Milestone: M9. Size: S.
- Satisfies: Apple 5.1.1(v); D-042; review LGL findings.
- Scope: revoke Apple tokens and unlink Google at deletion; reauthentication within 10 minutes before deletion (`docs/emails/SECURITY.md`).

#### BL-312 Website serves brand assets, email images and fonts
- Status: ready. Mode: agent. Owner: web lane (E3, BR2 in `docs/web/TEAM.md`). Milestone: M12. Size: S.
- Satisfies: D-052; handoff `docs/web/handoffs/2026-10-03-brand-and-legal-for-web.md` items 1, 2, 2a, 4.
- Scope: `/email/*`, `/fonts/*` with CORS and cache headers, registry-driven logo and OG image, security headers adapted to Next.js.

#### BL-313 Website legal and account routes
- Status: ready. Mode: agent. Owner: web lane (E1). Milestone: M9. Size: M.
- Satisfies: Brief decision 13; D-042; handoff items 3 and 5.
- Scope: `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/subscription-terms` from `packages/content/legal` with draft banner, noindex and a build guard against unfilled placeholders; `/delete-account`, `/delete-account/confirm`, `/cancel`, `/auth/confirm` (never verifies the token) and the AASA file; "iPhone only for now" on `/open` for Android.

#### BL-314 Counsel review of the legal drafts
- Status: ready. Mode: human. Owner: founder. Milestone: M9. Size: M.
- Satisfies: `packages/content/legal/REVIEW_NOTES.md` (open questions, including `coparent-left` and D-064).
- Scope: counsel sign-off, effective dates, versions; written no-training confirmation from Resend.

#### BL-315 Trademark clearance for the name and the mark
- Status: ready. Mode: human. Owner: founder. Milestone: M0. Size: S.
- Satisfies: D-051; `docs/brand/logo-r2/neutral-review/final-strategy.md`.
- Scope: professional clearance search for "Early Letters" and the quotation-mark drawing (classes 9, 16, 41, 42); file the specific drawing, not "quotation marks".

#### BL-316 Support inbox route and postal address
- Status: needs-decision (founder). Mode: human. Owner: founder. Milestone: M0. Size: S.
- Satisfies: review CUS-16, LGL findings; CAN-SPAM postal address before any commercial email.
- Scope: one route for hello@ (Resend inbox or Porkbun forwarding, not both); PO box or private mailbox for `{postalAddress}`; name the mailbox provider in subprocessors.

#### BL-317 Email DNS hardening for both domains
- Status: ready. Mode: human. Owner: founder. Milestone: M0. Size: S.
- Satisfies: `docs/emails/SECURITY.md` DNS section.
- Scope: remove Porkbun forwarding MX and SPF include; add `earlyletters.app` sending records; DMARC from none to quarantine after launch; MTA-STS and TLS-RPT; register both domains with Apple's private email relay.

#### BL-318 Five-second parent test of the mark
- Status: ready. Mode: human. Owner: founder. Milestone: M11. Size: S.
- Satisfies: D-051 (final-a versus final-b).
- Scope: about 20 parents, the icon at 60 and 29 px, "what does this app do?"; keep final-a unless final-b clearly wins.

## v1.1 and later (kept for ordering; not in the v1.0 window)

| BL | Task | Requirements | Source |
|---|---|---|---|
| BL-300 | Web contribution page (`apps/web`): anonymous identity at Send, contributor gateway, return links, browser audio encryption, page CSP and headers, Playwright suite | B-REQ-008, B-NFR-005, PRD-REQ-007, K-08, LEGAL-REQ-005, -010, -035 | TDD 02 SB-19, TDD 04 task 22, TDD 07 BL-Q13 |
| BL-301 | Hindi invite messages and Hindi web page | B-REQ-022 | B |
| BL-302 | Google sign-in on iOS and account linking | A-REQ-017, A-REQ-019 | TDD 04 task 13, D-044 |
| BL-303 | 4-story intro behind the remote variant switch | A-REQ-003 to A-REQ-011 | BL-041, D-043 |
| BL-304 | AI gateway: server transcription with consent | LEGAL-REQ-004, -005, -018 to -020, -040 | TDD 03 BL-070, TDD 07 BL-Q24 |
| BL-305 | Name check (say the name three times) | B-REQ-017 | TDD 03 BL-071 |
| BL-306 | Backup and restore UX; Vault mode, Recovery Kit, per-child keys and member grants if needed | ADR 0006, DATA-REQ-055 | TDD 04 SEC-09, tasks 19 to 21; TDD 02 SB-18 |
| BL-307 | Server-side Read together counter | PRD-REQ-020, D-037 | TDD 01 OQ-12 |
| BL-308 | Gift a year of Plus; dormant-payer email; trial-length experiment | C-REQ-030, C-REQ-031, C 8 | TDD 08 BL-P12 to BL-P14 |
| BL-309 | Reduced server export, then full server export | DATA-REQ-054, DATA-REQ-014 | TDD 05 NEW-10, TDD 02 SB-21 |
| BL-310 | Web deletion flow and privacy choices (before Android) | LEGAL-REQ-030 | TDD 05 NEW-14, D-042 |
| BL-311 | Android release with Google Play Billing (server integration or RevenueCat) | PRD 2.2, C 4.2 | TDD 08 BL-P15, ADR 0013 |
| BL-312 | Load test at 2x the 100k targets (before 25k families) | PRD 7.8 | TDD 02 SB-22 |
| BL-313 | External penetration test (before the public link, paid marketing or 1k families) | LEGAL-REQ-024 | TDD 04 SEC-15 |
| BL-314 | Photos under per-book keys; optional Face ID lock | TDD 04 X-5 | TDD 04 task 28 |
| BL-317 | Second-provider copy of backup ciphertext (7-day versioning at most) | DATA-REQ-030 | TDD 06 BL-R15, TDD 05 X-16 |
| BL-319 | Nightly perf and concurrency runs; analytics additions; monthly cost sheet | PRD 7.8 | TDD 06 BL-R03, R04, R14, R17 |
| BL-320 | P1 product items: sealed letters, multi-book invite picker, merge books, themes, author and child photos, reminder back-off | B-REQ-018 to B-REQ-024, C-REQ-008 | B, C |
| BL-321 | Hindi app UI (P2) | B-REQ-025, A-NFR-014 | K-24 |

Printed books stay a future launch (K-32; ADR 0007 print half). Beta label removal happens only when the founder ends the beta (K-13): one release removes `settings.about.beta.*`, any store beta lines and Terms 16.4.

---

## Appendix: TDD proposal to BL mapping

Every task id proposed in TDD 01 to 09 maps to exactly one BL id (or is marked n/a with the reason). "+" means merged into that task.

| TDD | Proposed id to BL id |
|---|---|
| 01 (BL-M##) | M01 to BL-121; M02 to BL-111; M03 to BL-037; M04 to BL-040; M05 to BL-130; M06 to BL-142; M07 to BL-136; M08 to BL-034; M09 to BL-022; M10 to BL-031; M11 to BL-250; M12 to BL-156; M13 to BL-154; M14 to BL-170; M15 to BL-134; M16 to BL-275 + BL-276; M17 to BL-150; M18 to BL-044; M19 to BL-173 + BL-174 (per D-023); M20 to BL-288 |
| 02 (SB-##, M#) | SB-01 to BL-173; SB-02 (M5) to BL-112; SB-03 (M6) to BL-175; SB-04 (M7) to BL-113; SB-05 (M8) to BL-114; SB-06 to BL-116; SB-07 to BL-173 (pull parity; Sync Streams only if PowerSync is chosen); SB-08 to BL-174; SB-09 (M10) to BL-236 + BL-022; SB-10 to BL-190; SB-11 (M9) to BL-213; SB-12 to BL-214 + BL-218; SB-13 to BL-234; SB-14 to BL-107; SB-15 to BL-177; SB-16 to BL-282; SB-17 (M11) to BL-178; SB-18 (M12) to BL-200 to BL-203 (reduced) + BL-306; SB-19 (M13) to BL-300; SB-20 to BL-247; SB-21 to BL-309; SB-22 to BL-312 |
| 03 (BL-060 to BL-071) | 060 to BL-130; 061 to BL-140; 062 to BL-141; 063 to BL-142; 064 to BL-120; 065 to BL-143; 066 to BL-144; 067 to BL-146; 068 to BL-145; 069 to BL-147; 070 to BL-304; 071 to BL-305 |
| 04 (SEC-##, order #) | SEC-01 to BL-106; SEC-02 to BL-106 + BL-122; SEC-03 to BL-172; SEC-04 to BL-116 + BL-195; SEC-05 to BL-115 (pepper) + BL-236 (tables); SEC-06 to BL-248; SEC-07 to BL-249; SEC-08 to BL-200; SEC-09 to BL-306; SEC-10 to BL-237; SEC-11 to BL-245; SEC-12 to BL-117; SEC-13 to BL-239; SEC-14 to BL-241; SEC-15 to BL-313; SEC-20 to BL-241; order 5 to BL-112; 6 to BL-114; 8 to BL-031; 9 to BL-037; 11 to BL-170; 12 to BL-171; 13 to BL-302; 19 to 21 to BL-306 (BL-200, BL-206 for the v1.0 subset); 22 to BL-300; 28 to BL-314 |
| 05 (NEW-##) | 01 to BL-115; 02 to BL-114; 03 to BL-016; 04 to BL-231; 05 to BL-232; 06 to BL-234; 07 to BL-235; 08 to BL-240; 09 to BL-150; 10 to BL-309; 11 to BL-237; 12 to BL-171; 13 to BL-173 (n/a if PowerSync is not used); 14 to BL-243 (v1.0 static) + BL-310; 15 to BL-239; 16 to BL-238; 17 to BL-117; 18 to BL-218; 19 to BL-118; 20 to BL-106 |
| 06 (BL-R##) | R01 and R02 to BL-289; R03 and R04 to BL-319; R05 and R06 to BL-239; R07 to BL-244; R08 to BL-242; R09 to BL-107; R10 to BL-173 (restore epoch) + BL-247 (drill); R11 to BL-282; R12 n/a (PowerSync client load harness; only if PowerSync is chosen, then BL-282); R13 to BL-044; R14 to BL-319; R15 to BL-317; R16 to BL-241; R17 to BL-319; R18 to BL-206 |
| 07 (BL-Q##) | Q01 to BL-110; Q02 to BL-120; Q03 to BL-239; Q04 to BL-119; Q05 to BL-118; Q06 to BL-117; Q07 to BL-239; Q08 to BL-278; Q09 to BL-116; Q10 to BL-114; Q11 to BL-174; Q12 to BL-195; Q13 to BL-300; Q14 to BL-173 (pull parity); Q15 and Q16 to BL-151; Q17 to BL-216; Q18 to BL-218 + BL-214; Q19 to BL-213; Q20 to BL-154; Q21 to BL-150; Q22 to BL-234 + BL-238; Q23 to BL-279; Q24 to BL-304; Q25 to BL-275; Q26 to BL-276; Q27 to BL-277; Q28 to BL-004; Q29 to BL-280; Q30 to BL-135 |
| 08 (BL-P##) | BL-036 extension to BL-036; P01 to BL-212; P02 to BL-103; P03 to BL-214; P04 to BL-215; P05 to BL-216; P06 to BL-217; P07 to BL-218; P08 to BL-219; P09 to BL-201; P10 to BL-220; P11 to BL-221; P12 to P14 to BL-308; P15 to BL-311 |
| 09 (BL-070 to BL-090) | 070 to BL-255; 071 to BL-256; 072 to BL-257; 073 to BL-258; 074 to BL-259; 075 to BL-260; 076 to BL-261; 077 to BL-262; 078 to BL-263; 079 to BL-264; 080 to BL-265; 081 to BL-266; 082 to BL-267; 083 to BL-270; 084 to BL-271; 085 to BL-156; 086 to BL-268; 087 to BL-269; 088 to BL-279; 089 to BL-273; 090 to BL-272 |

Unused numbers inside the blocks (for example BL-123 to BL-129, BL-131 to BL-133, BL-138, BL-139, BL-149, BL-152, BL-153, BL-155, BL-161 to BL-169, BL-179 to BL-189, BL-197 to BL-199, BL-204, BL-207 to BL-209, BL-223 to BL-230, BL-246, BL-253, BL-254, BL-274, BL-281, BL-285, BL-287, BL-290 to BL-299, BL-315, BL-316, BL-318) are free for splits inside their milestone.
