# Backlog

The ordered list of work for Early Letters. Format and rules: ADR 0011 (`docs/adr/0011-requirements-and-agent-workflow.md`).
Window: 5 Oct 2026 to App Store submission on Mon 11 Jan 2027 (`docs/ROADMAP.md`, milestones M0 to M13). Last re-planned: 3 Oct 2026 (PRD.md 1.3: founder decisions of 3 Oct, Plus and family contributors at launch, individual publisher; TDD 01 to 10 findings folded in; decisions in `docs/DECISIONS.md`). Reconciled 3 Oct 2026 with the founder brief of the same day (`docs/agents/BRIEF-2026-10-03.md`, all Decided), which wins where PRD 1.3 differs: no server of ours sees purchases (decision 3), Google sign-in and passkeys at v1.0 (decision 4), co-parent only at v1.0 (decision 5), no audio upload, word highlighting or safety classifier at v1.0 (decision 9).

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
- Satisfies: C-REQ-021, C-REQ-027, LEGAL-REQ-058, D-001, D-048; brief 3 Oct decision 3.
- Scope: production bundle id from `bundleId()` after BL-100 (suffixed ids for dev and preview, TDD 01 R-10); app record; subscription group "Plus"; `el_plus_monthly_399` (1-month free intro offer) and `el_plus_annual_2999` (2-month free intro offer); experiment arm products created but not offered (TDD 08 3.1); Billing Grace Period 16 days; **Family Sharing on** for both products (brief decision 3: a co-parent gets Plus through Apple Family Sharing; this replaces "off" in ADR 0013 and TDD 08). Apple's App Store Connect help says that once Family Sharing is turned on for an In-App Purchase "you can't turn it off" (page "Turn on Family Sharing for In-App Purchases", read 3 Oct 2026), so confirm before switching it on. Territories = United States. No In-App Purchase server key and no App Store Server Notifications URL: no server of ours sees purchases (brief decision 3). Confirm App Store Connect Sales and Trends subscription reports are readable from the founder's account, because Plus totals come only from them (BL-024). Checklist in `docs/ops/` (product configuration check, TDD 08 F-16). (Source: TDD 08 BL-P02, ADR 0013 as amended by brief decision 3.)

#### BL-104 Counsel engagement and sign-off
- Status: ready. Mode: human. Owner: founder. Milestone: M0 week 1 (engage), M13 (sign-off). Size: S (founder time), counsel L.
- Satisfies: PRD 2.3 gate 3; LEGAL-REQ-044.
- Scope: send the v1.0 scope (PRD 1.3 section 2) and the questions in Lawyer 1, Lawyer 2 and TDD 05 section 13 by week 1; full package (Terms 1.4.0, Privacy Policy 1.3.0, CHD notice 1.1.0, Subscription terms 1.3.0, in-app disclosures 1.3.0, claims registry) by week 5; sign-off by week 14. Includes the re-tier of web-page LEGAL-REQs (D-002) and D-042, D-021, D-022, D-039, D-049, D-050. Added 3 Oct: the auto-renewal question in BL-223 (notices and consent records with no purchase server) and the trademark question pack (BL-124, for BL-123).

#### BL-105 Perinatal clinician review of safety copy
- Status: ready. Mode: human. Owner: founder. Milestone: M0, answer by 20 Nov. Size: S.
- Satisfies: D-034; LEGAL-REQ-015.
- Scope (3 Oct): brief decision 9 moves the safety classifier and on-device support cards to v1.1 (BL-322), so v1.0 needs this review only for the wording of the static "If you are struggling" row (BL-158). The classifier review comes back with BL-322.

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
- Scope (3 Oct): adjust the coverage list to v1.0 (brief decisions 5, 6 and 9): grandparents cannot join a book in v1.0, so they wait for v1.1 (BL-316); recruit speakers of the v1.0 letter languages instead of code-switching speakers (Hindi-English mode is v1.1).

#### BL-005 Founder setup for the workflow
- Status: ready. Mode: human. Owner: founder. Milestone: M1, week 1.
- Satisfies: none (process; D-041).
- Scope: create Issue labels `inbox`, `bug`, `idea`, `beta`, `S0` to `S3`, `approve-migration`; update the scheduled-run prompt to "follow the protocol at the top of docs/BACKLOG.md"; turn on branch protection for `main` requiring CI; pause unattended runs for `supabase/**` and auth until BL-004 is green. Accept ADR 0011 or send it back.

#### BL-053 Sign-in provider and email setup
- Status: blocked (BL-100). Mode: human. Owner: founder, security engineer. Milestone: M0, weeks 2 to 3.
- Satisfies: A-REQ-016, A-REQ-022, A-REQ-026, A-NFR-009, LEGAL-REQ-026.
- Scope: custom SMTP on the domain with SPF, DKIM, DMARC; Apple Services ID and key with a named owner and rotation date; AASA file for universal links (and `webcredentials` for passkeys, BL-180). Google client ids for Sign in with Google at v1.0 (brief 3 Oct decision 4 supersedes D-044; used by BL-179). Secrets stay out of the repo. (Was needs-decision on company and domain; company is decided by D-004, the domain is BL-100.)

#### BL-123 Trademark clearance for "Early Letters" [Critical]
- Status: blocked (BL-124). Mode: human. Owner: founder, legal. Milestone: M0, send to counsel by week 3 (with BL-104); result before the store listing (BL-286). Size: S (founder time).
- Satisfies: compliance register CR-122 (trademark not cleared; clearance before store submission).
- Scope: the founder sends the question pack (BL-124) to counsel, alone or inside the BL-104 package; counsel decides how to clear the name and advises. The founder records the outcome in the compliance register (CR-122 evidence) and, if counsel advises any change, opens a decision entry before BL-286, because `packages/brand`, the bundle id (BL-103), the domains and the store name all carry the name. Agents never write a legal conclusion, a likelihood or a cost about the name. (CR-122 asked for clearance before the domain purchase too; the domains are already bought, brief decision 13, so the remaining gate is store submission.)
- Done when: CR-122 no longer reads "Gap" and links the founder's record of counsel's answer.

#### BL-124 Trademark question pack for counsel
- Status: ready. Mode: agent. Owner: legal. Milestone: M0, week 2. Size: S.
- Satisfies: compliance register CR-122; prepares BL-123.
- Scope: a draft for counsel in `docs/legal/memos/` that states only facts from the repo, each with its source path: the marks in use (`brand.name`, `storeName`, `tagline` and the `printTitle` pattern in `packages/brand/index.ts`); the domains (brief decision 13); the publisher is an individual (D-004) with a possible later transfer to an organisation (D-004 point 5); US storefront only at launch (LEGAL-REQ-058), Android and printed books later (K-32); submission date (`docs/ROADMAP.md`). Then open questions for counsel: what a clearance should cover, which goods and services to consider, whether and when to file, what to do if a similar mark turns up, and whether the tagline or the print title need their own check. No legal conclusions, no likelihoods and no costs. Content rules apply.
- Done when: the file exists, every fact cites a repo path, it contains questions only, and the founder can send it as written.

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
- Scope: `create_child(p_id uuid, p_name, p_date_of_birth, p_due_date, p_first_run_batch boolean, p_client_created_at)` idempotent on `p_id`; check birth date or due date present; `entries_author_insert` also requires `child_is_live(child_id)`. No Plus rules on the server: brief 3 Oct decision 3 says server code does not enforce Plus (BL-213 superseded; commit f20898c in PR #32 removes the server entitlement objects). (Source: TDD 02 M7 / SB-04, TDD 01 X-7.)

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
- Scope: one job at a time, persisted status, resume after kill; a spoken letter saves with its audio before text exists and is shown as a voice letter until transcribed (TDD 03 OQ-4: kept local until transcribed, TDD 01 OQ-2); block Save on sample transcripts in release builds; no safety classifier runs in v1.0 (brief 3 Oct decision 9; the on-device tier returns with BL-322, behind `safety_card_enabled`). (Source: TDD 03 BL-063, TDD 01 BL-M06.)

#### BL-143 Model manager [High]
- Status: blocked (BL-022). Mode: agent plus device check. Owner: speech engineer. Milestone: M3. Size: M.
- Satisfies: PRD 7.7, ADR 0001, D-046.
- Scope: manifest with device tiers; resumable Range download to `Application Support/models/*.part` on Wi-Fi by default; SHA-256 verified before rename; excluded from backup (TDD 10 contradiction 2); storage-pressure check; remove and re-download in Settings; versioned URLs on the zero-egress host the founder picks (D-046) with its data-map row. (Source: TDD 03 BL-065.)

#### BL-144 Transcription persistence and alignment column [High]
- Status: blocked (BL-111). Mode: agent (`approve-migration` for the server part). Owner: data architect, speech engineer. Milestone: M3. Size: M.
- Satisfies: PRD-REQ-004, DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-001.
- Scope: draft candidates, `stt_meta`, accepted and rejected `machine_edits`, author edit layer, `audio_sha256`; migration for `entries.alignment` (L4, final text only) and `audio_sha256` with classification comments; `book_entries` exposes `alignment` but never `stt_meta`; access tests. (Source: TDD 03 BL-066, C-1.)

#### BL-145 Word alignment projection and quality gate [High]
- Status: deferred (v1.1, BL-318). Mode: agent. Owner: speech engineer. Milestone: M3. Size: M.
- Satisfies: ADR 0009, PRD-REQ-020.
- Scope: pure projection of word timings through accepted edits onto `final_text` with a quality gate (word, sentence or none); Read together consumes `quality`; no raw transcript leak. (Source: TDD 03 BL-068.)
- Deferred 3 Oct: its only consumer is word highlighting in Read together, which brief decision 9 moves to v1.1. Word timings are still captured (BL-141) and stored (BL-144) so v1.1 has them.

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

#### BL-152 Store and site copy match the v1.0 scope [Critical]
- Status: ready. Mode: agent. Owner: content. Milestone: M4, week 4 (before the website goes live). Size: M.
- Satisfies: LEGAL-REQ-044, D-030; brief 3 Oct decisions 5, 6, 9 and 10.
- Scope: `packages/content/src/store.en.ts` and `site.en.ts` promise features the brief moved out of v1.0 (list from the marketing launch plan section 1.2, PR #38; line numbers on `develop` at 3688796). Rewrite or remove each line, in the product voice, without adding new claims:
  - Grandparents and family writing (decision 5, co-parent only): store 14 (keyword "grandparents"), 31 to 32 ("A BOOK FOR THE WHOLE FAMILY"), 51 (audience line), 61 (`whatsNewV1` "invite family"), 66 (caption "Grandparents can write too"); site 25 to 26 (benefit "The whole family, signed"), 52 (`family`), 81 to 82 (FAQ "Can grandparents add letters?"), 101 to 104 (`gift`; gifts are not in v1.0 either).
  - Shared voices (decision 9, no audio upload): store 67 (caption "Read together, in their voices"); site 48 ("listen to Dadi"), 59 and 98 ("Family can hear a recording once it is backed up").
  - Word highlighting (decision 9): store 26 and site 48 ("while the words appear on the page").
  - Hindi and English in one letter (decisions 6 and 9; code-switching is v1.1): store 34 to 35, site 85 to 86. Name the seven v1.0 letter languages instead.
  - Backup (decision 9): store 22 to 23 (optional backup, recovery key), site 59 to 60 (backup, recovery key, Vault mode), 94 (Plus "adds backup for every recording"), 98.
  - Beta (decision 10, D-030): store 55 (last description paragraph) and 59 (`promotionalTextBeta`); the in-app "early version" note stays.
  - Also found: site 58, 59 and 98 offer "cloud transcription", which is v1.1 (BL-304).
- Two lines wait for the founder: where recordings live (D-033: until it is answered, remove the backup promise and add no new claim about device backups), and the rest of the Plus feature list (store 26, site 94) until the founder says what Plus includes at v1.0 (BL-154).
- Done when: no line in `store.en.ts` or `site.en.ts` promises family contributors, shared voices, word highlighting, mixed-language letters, backup, cloud transcription or a beta; the content rules test passes; the PR lists every line changed and any line left for a founder answer.

#### BL-153 In-app strings match the v1.0 scope
- Status: ready. Mode: agent. Owner: content. Milestone: M4. Size: S.
- Satisfies: LEGAL-REQ-044; brief 3 Oct decisions 5 and 9.
- Scope: `packages/content/src/strings.en.ts` (line numbers on `develop` at 3688796) still promises family contributors and backup in places a v1.0 screen can show: 120 (family invite body "Grandparents, aunts, uncles"), 324 to 325 (`familyBody`, `familyCta`), 484 to 487 (`firstGrandparentLetter`), 306 (`recordingBackedUp`), 516 to 536 (`recordings.*` backup lines and `backup.*`), 594 (`aiLabel` "Cloud transcription", v1.1), 606 ("syncing, backup and family sharing"), 715 to 718 (`backupFailed`), 725 (`storageLow.body` "Turning on backup"), 788 (`backupNotYet` "Backup arrives with Plus"). For each: rewrite for v1.0, or move it into a clearly marked v1.1 group that no v1.0 screen imports (check `apps/mobile` usage and name any screen change needed for `mobile` in the PR body). Co-parent strings stay.
- Done when: no string a v1.0 screen can show promises family contributors, backup or cloud transcription; the content rules test passes.

#### BL-157 Lock-screen-safe notification copy
- Status: ready. Mode: agent. Owner: content. Milestone: M4. Size: S.
- Satisfies: D-025, C-REQ-009.
- Scope: notification title and body variants without `{child}` for when names are hidden; Settings toggle label and help line; lock-screen length rules pass.

#### BL-154 Read together free sessions per book
- Status: needs-decision (what Plus includes at v1.0: does Read together without word highlight stay Plus after 3 free sessions?). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: S. Depends on: BL-022, BL-036.
- Satisfies: PRD-REQ-020, LEGAL-REQ-050, D-037.
- Scope: count per book on the device, only when highlighted playback starts in try mode, limit from remote config; delete `FREE_READ_TOGETHER_SESSIONS`; single-recording playback never limited. (Source: TDD 01 BL-M13, TDD 08 C-3, TDD 07 BL-Q20.)
- Why the decision (3 Oct): PRD-REQ-020 starts a session "when playback with word highlight begins", and brief decision 9 moves word highlighting to v1.1. With backup also out of v1.0 (no audio upload), the founder decides what Plus includes at v1.0; this task then counts whatever starts a session.

#### BL-160 Book and Read together release pass
- Status: blocked (BL-034). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: B-REQ-005, C-REQ-010, C-REQ-011.
- Scope: month chapters and Before You; playback; Read together plays each letter in its author's voice without word highlight (brief 3 Oct decision 9; highlight from `alignment` moves to v1.1, BL-318); quiet milestones inline; 60-letter chapter p95 500 ms.

#### BL-156 Content and localisation debt
- Status: ready. Mode: agent. Owner: content, design systems. Milestone: M4. Size: M.
- Satisfies: CLAUDE.md content rules, B-NFR-007, K-24, D-028.
- Scope: move `pendingCopy` and screen literals into `packages/content`; dates through `Intl.DateTimeFormat` with the device locale in `packages/core`; plurals through `Intl.PluralRules` with `{ one, other }` strings; assembled sentences become templates (`readTogether.position`); `caps` text style instead of `.toUpperCase()`. (Source: TDD 01 BL-M12, TDD 09 BL-085.)

#### BL-158 Help: "If you are struggling" row
- Status: ready. Mode: agent. Owner: content, mobile engineer. Milestone: M4. Size: S.
- Satisfies: D-034, LEGAL-REQ-015; brief 3 Oct decision 9.
- Scope: a static, always-available row in Settings > Help with verified US resources (clinician-reviewed wording, BL-105). Brief decision 9 moves the safety classifier and on-device support cards to v1.1 (BL-322); `safety_card_enabled` stays off in v1.0.

#### BL-159 Settings information architecture
- Status: blocked (BL-035). Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: C-REQ-016, LEGAL-REQ-008, K-13, K-17.
- Scope: every row within 2 taps; Privacy rows (analytics, sensitive data, lock-screen names, audience; backup and shared voice rows wait for v1.1, brief 3 Oct decision 9); Help and Legal (About with the beta label, How transcription works, Support with content-free "Copy diagnostics", If you are struggling, Terms, Privacy Policy, CHD policy, Subscription terms, Subprocessors, Accessibility statement, Licences, 90-day pledge).

---

## M5. Account, sync, co-parent (weeks 4 to 8)

#### BL-050 Keep-the-book sheet with notice and terms
- Status: blocked (BL-130). Mode: agent. Owner: mobile engineer. Milestone: M5.
- Satisfies: A-REQ-013, A-REQ-014, A-REQ-031, A-REQ-034, LEGAL-REQ-001, LEGAL-REQ-045.
- Scope: sheet after the first save with Apple, Google, Email and Later (brief 3 Oct decision 4 supersedes D-044; Google sign-in is BL-179); child-data notice and the Terms line with the 18+ confirmation above the buttons; record `age_attested` in the `terms` acceptance context; Later keeps everything working locally and the sheet returns at most once a day.

#### BL-170 Secure session, deep links and invite tokens [High]
- Status: blocked (BL-040). Mode: agent. Owner: mobile engineer, security engineer. Milestone: M5. Size: M.
- Satisfies: A-REQ-028, A-REQ-032, A-REQ-033, A-NFR-008, LEGAL-REQ-026.
- Scope: `expo-secure-store` with the large-secure-store pattern; deep link parser; invite token to Keychain before any UI; tokens never logged; sign-out only after unsynced letters sync; "sign out other devices". (Source: TDD 01 BL-M14, TDD 04 task 11.)

#### BL-172 Auth configuration as code [High]
- Status: blocked (BL-053). Mode: agent (dashboard values: human). Owner: security engineer. Milestone: M5. Size: S.
- Satisfies: A-REQ-018, A-REQ-025, A-REQ-026, A-REQ-027, A-NFR-009.
- Scope: JWT lifetime 15 minutes, OTP settings, SMTP, providers Apple, Google and email (brief 3 Oct decision 4), anonymous sign-in off in v1.0 (K-08 is v1.1), CAPTCHA decision, documented in `docs/security/`; residual OTP risk accepted per TDD 04 X-1. (Source: TDD 04 SEC-03.)

#### BL-171 Sign in with Apple and token capture [Critical]
- Status: blocked (BL-053, BL-172). Mode: agent plus spike. Owner: security engineer. Milestone: M5. Size: M.
- Satisfies: A-REQ-016, A-NFR-009, A-NFR-011, DATA-REQ-019, DATA-REQ-033, LEGAL-REQ-055.
- Scope: native Sign in with Apple; spike whether Supabase yields the Apple refresh token; if not, an `apple-token-store` Edge Function exchanges the authorisation code; `apple_tokens` table (service only, encrypted); keep each user's Apple subject id (needed for revocation and for a future app transfer, D-004). (Source: TDD 04 task 12, TDD 05 NEW-12, X-25.)

#### BL-051 Email link and code sign-in
- Status: blocked (BL-050, BL-053). Mode: agent. Owner: mobile engineer. Milestone: M5.
- Satisfies: A-REQ-018, A-REQ-023, A-REQ-024, A-REQ-025, A-REQ-027, A-NFR-008.
- Scope: one email with link and 6-digit code; scanner-safe page; resend limits; session tokens only in Keychain-backed storage.

#### BL-179 Sign in with Google on iOS
- Status: blocked (BL-053, BL-172). Mode: agent. Owner: security engineer, mobile engineer. Milestone: M5. Size: M.
- Satisfies: A-REQ-017, LEGAL-REQ-055; brief 3 Oct decision 4 (supersedes D-044 and the v1.1 placement in PRD 2.1).
- Scope: native Google sign-in into Supabase Auth's Google provider through a maintained, permissively licensed library (brief decisions 1 and coordination rules; verify the library and its API against the installed version, never from memory); client ids from BL-053; tokens only in Keychain-backed storage (BL-170); Sign in with Apple stays offered wherever Google is (LEGAL-REQ-055). Account linking between methods stays v1.1 (BL-302). Data-map row for any new identity column or vendor in the same PR.
- Done when: a dev build signs in with Google and lands in the same account on a second sign-in; the Keep-the-book sheet (BL-050) offers Apple, Google and Email; tests cover the cancel and error paths.

#### BL-180 Add a passkey after sign-in
- Status: blocked (BL-171, BL-051). Mode: agent plus spike. Owner: security engineer, mobile engineer. Milestone: M5. Size: M.
- Satisfies: brief 3 Oct decision 4 ("Passkeys can be added after sign-in"; PRD 2.2 lists passkeys out of scope, change proposed to the founder).
- Scope: spike first and record the result in `docs/security/`: does Supabase Auth support passkeys (WebAuthn) as a sign-in factor (Unverified), and which maintained Expo-compatible library calls the iOS passkey APIs (Unverified). If a standard path exists, a signed-in user can add a passkey in Settings and later sign in with Face ID or Touch ID; `webcredentials` association on the domain (BL-053). If the only path needs our own server-side WebAuthn code, stop and set this task to needs-decision (brief decision 1, standard over custom).
- Done when: the spike result is recorded, and either a dev build adds and uses a passkey, or the task carries the founder question.

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
- Status: ready. Mode: agent. Owner: analytics engineer, data architect. Milestone: M5.
- Satisfies: PRD-REQ-017 (Plus part replaced by brief 3 Oct decision 3).
- Scope: daily counts (accounts, books, letters saved, family letters, books per family bucket); counts only, cells under 10 suppressed; service role only with an access test. No Plus totals on our server: no server of ours sees purchases (brief decision 3), so trials, conversions, refunds and churn come only from App Store Connect reports (metric tree section 3.4, BZ-02 to BZ-05, in PR #40). (Source: TDD 08 BL-024 extension, narrowed 3 Oct.)

---

## M6. Family contributors in the app (weeks 7 to 10)

Brief 3 Oct decision 5 (Decided): family at v1.0 is the co-parent only; other family members and the web page come later, and the app hides the contributor path while the database keeps the role. So BL-191, BL-192, BL-194 and BL-196 are deferred to v1.1 (BL-316). BL-190, BL-193 and BL-195 stay, because co-parent invites, leaving a shared book and the visibility matrix are needed at v1.0. This supersedes D-002 for v1.0.

#### BL-190 Invite redemption function with rate limits [High]
- Status: blocked (BL-112, BL-236). Mode: agent. Owner: data architect. Milestone: M6. Size: M.
- Satisfies: B-NFR-004, A-REQ-028, B-NFR-002.
- Scope: `invite-redeem` Edge Function (token in the body, never logged) with per-device and per-IP limits (10 code attempts per hour per device; global failed-attempt brake with alert) calling `accept_child_invite` as the user; refuses anonymous callers for any role in v1.0. v1.0 invites are co-parent invites (BL-176); the app never creates a Family invite (brief decision 5). (Source: TDD 02 SB-10.)

#### BL-191 Contributor first run in the app
- Status: deferred (v1.1, BL-316). Mode: agent. Owner: mobile engineer, content. Milestone: M6. Size: M.
- Satisfies: B-REQ-007, B-REQ-002, PRD-REQ-014, D-002.
- Scope: "I was invited" path after the 18+ gate: sign in, accept, welcome (`family.contributorWelcome.*`), signature, first letter to the named child; contributors never create a child unless they start their own book; contributors never see the Plus sheet (D-036).

#### BL-192 Approvals
- Status: deferred (v1.1, BL-316). Mode: agent. Owner: mobile engineer. Milestone: M6. Size: M.
- Satisfies: B-REQ-009, B-REQ-023 (auto-add and thank you).
- Scope: pending family letters for both parents (first action wins); Add to the book, Keep it aside, Send a thank you; per-member "Add family letters automatically"; contributor sees "With {inviter}" or "In the book".

#### BL-193 Leave and remove with letter retention
- Status: blocked (BL-175). Mode: agent. Owner: mobile engineer. Milestone: M6. Size: S.
- Satisfies: B-REQ-010, B-REQ-016, LEGAL-REQ-032.
- Scope: leave (keep or take my letters from the book) and remove a Family member (parents are equals and cannot remove each other); honest copy about copies already on other phones. v1.0 (brief 3 Oct decision 5): a co-parent leaving a shared book only; removing a Family member and the last-parent guard with contributors move to v1.1 (BL-316).

#### BL-194 Family can read and per-child sharing
- Status: deferred (v1.1, BL-316). Mode: agent. Owner: mobile engineer. Milestone: M6. Size: S.
- Satisfies: B-REQ-011, PRD-REQ-014.
- Scope: "Family can read {child}'s book" per book (private by default); invite names one child and says so; member list per child. (The v1.0 co-parent invite already names one child, BL-176.)

#### BL-195 Visibility matrix and cross-child leak tests [Critical]
- Status: blocked (BL-175, BL-116). Mode: agent. Owner: security engineer, QA engineer. Milestone: M6. Size: M.
- Satisfies: LEGAL-REQ-024, B-NFR-003, B-REQ-006 to B-REQ-011, PRD-REQ-004, PRD-REQ-014.
- Scope: generated matrix for every role and book state through RLS and through the pull RPCs; Nani invited to Asha's book only sees nothing of the sibling's book; contributor without "Family can read" sees only own letters. Contributor rows stay in the matrix at v1.0 because the database keeps the role even though the app hides it (brief 3 Oct decision 5). (Source: TDD 07 BL-Q12, TDD 04 SEC-04.)

#### BL-196 Family-letter push without content
- Status: deferred (v1.1, BL-316). Mode: agent (APNs key: human). Owner: data architect, mobile engineer. Milestone: M6. Size: M.
- Satisfies: C-REQ-007, LEGAL-REQ-054, C-NFR-005.
- Scope: an Edge Function sends APNs pushes directly (no third-party push service) for a new family letter and "your letter is in the book". Server payloads never carry the child's name or letter text (PRD 7.10; DATA_CLASSIFICATION open issue 4); when lock-screen names are on, the app may render names locally (notification service extension or in-app), never the server. Payloads carry opaque ids for routing only; separate channel from reminders; data-map row for the APNs key and device tokens (L3). Content adds name-free push strings.

---

## M7. Shared voice (weeks 8 to 11; needs D-032)

Brief 3 Oct decision 9 (Decided): no audio upload in v1.0, and family members hearing each other's recordings is v1.1. That answers D-032 for v1.0 with its alternative (a): letters reach the co-parent as text, and each recording plays on the phone that made it. Every task in this milestone is deferred to v1.1 (BL-315); BL-205 is superseded by the copy and policy tasks BL-152, BL-153, BL-224 and BL-246.

#### BL-200 Audio key scheme and format
- Status: deferred (v1.1, BL-315). Mode: pair. Owner: security engineer. Milestone: M7. Size: M.
- Satisfies: LEGAL-REQ-022(a) (counsel reading), ADR 0006 (v1.0 subset).
- Scope: per-file AES-256-GCM on the phone (react-native-quick-crypto spike), file key wrapped by a server-held key through an Edge Function; `packages/crypto/FORMAT.md` versioned; known-answer tests and fuzz. Vault mode and per-child keys stay later. (Source: TDD 04 SEC-08 reduced, TDD 10 section 2.)

#### BL-201 Audio blobs, bucket and upload policy
- Status: deferred (v1.1, BL-315). Mode: agent (`approve-migration`). Owner: data architect. Milestone: M7. Size: M.
- Satisfies: C-NFR-008, DATA-REQ-047, D-032.
- Scope: `audio_blobs` (path, size, sha256, wrapped file key), `entry-audio` bucket with path rules; signed upload URLs issued server-side only when the entry is in a shared book (Free) or `book_has_plus` (Plus); downloads of already uploaded audio never check entitlement. (Source: TDD 02 M12 reduced, TDD 08 BL-P09.)

#### BL-202 Upload queue on the phone
- Status: deferred (v1.1, BL-315). Mode: agent. Owner: mobile engineer. Milestone: M7. Size: M.
- Satisfies: PRD 7.3 (backed-up audio restore), D-032.
- Scope: resumable, background-safe uploads after encryption; retries with backoff; state visible in Settings; never blocks recording or reading.

#### BL-203 Member playback and deletion propagation
- Status: deferred (v1.1, BL-315). Mode: agent. Owner: data architect, mobile engineer. Milestone: M7. Size: M.
- Satisfies: B-REQ-011, LEGAL-REQ-032, PRD-REQ-014.
- Scope: an Edge Function checks `book_access`, unwraps the file key and returns it with a short-lived URL; device cache with eviction; deleting a letter or leaving a book removes cached copies on next sync.

#### BL-206 Wrap-key custody [High]
- Status: deferred (v1.1, BL-315). Mode: human plus agent. Owner: security engineer, founder. Milestone: M7. Size: S.
- Satisfies: LEGAL-REQ-023, LEGAL-REQ-040.
- Scope: key only in Edge secrets, never in the database or its backups; sealed offline copy and yearly recovery drill; rotation runbook; every unwrap logged without content; kill switch `escrow_unwrap`. (Source: TDD 06 BL-R18, TDD 04 3.6.4.)

#### BL-205 Shared-voice copy and legal alignment
- Status: superseded (by BL-152, BL-153, BL-224 and BL-246). Mode: agent. Owner: content, legal. Milestone: M7. Size: S.
- Satisfies: K-21, K-33, LEGAL-REQ-044.
- Scope: on approval, update the recordings claims in `packages/content` (Settings, store, site) and the Privacy Policy short version, section 4 and Terms 12.1 to say recordings of letters in a shared book upload, encrypted, so family can hear them.

---

## M8. Plus through the App Store (weeks 3 to 12)

Brief 3 Oct decision 3 (Decided): StoreKit 2 with Apple's own subscription UI, restore and manage sheets, and the on-device entitlement check. No server of ours sees purchases; no RevenueCat; no App Store Server Notifications endpoint; server code does not enforce Plus; a co-parent gets Plus through Apple Family Sharing. Plus totals come from App Store Connect reports (BL-024, BL-253). So the server billing tasks (BL-211, BL-213, BL-214) are superseded, and the notice and consent tasks (BL-212, BL-217, BL-218) wait for the founder's answer in BL-223. This amends D-001 and ADR 0013 (server half).

#### BL-036 Plan rules engine
- Status: ready. Mode: agent. Owner: payments engineer. Milestone: M8, week 4. Size: M.
- Satisfies: PRD-REQ-015, PRD-REQ-020, C-REQ-023, LEGAL-REQ-050, D-036, D-007, D-008.
- Scope (extended 3 Oct): `packages/core/src/plan.ts` with `decide`, `planActive`, `FreeForever` and `GatedFeature` types (free-forever features cannot be gated at compile time), the TDD 08 2.3 truth table as fixtures and the three property tests; absorbs `canCreateBook` (first-run batch free, joined books never count, hidden books count). (Source: TDD 08 order 1.)
- Inputs (3 Oct, brief decision 3): Plus comes only from this device's StoreKit entitlements, from the person's own subscription or through Family Sharing; there is no server plan state. A co-parent outside the purchaser's Apple family therefore does not inherit Plus (the PRD K-28 change and this consequence are listed for the founder). D-036's "no double offer" holds only where the other parent's Plus reaches this device through Family Sharing.

#### BL-212 Notice windows as data
- Status: needs-decision (BL-223). Mode: agent. Owner: payments engineer. Milestone: M8, week 5. Size: M.
- Satisfies: LEGAL-REQ-047, PRD-REQ-003, D-022.
- Scope: `notice_windows` seed (the D-022 table) and a pure `scheduleFor(snapshot)` with tests N-1 to N-10 (1 March leap and non-leap, 31-day months, DST, trials of 31 and 32 days, cancel after scheduling, birthday inside the window). (Source: TDD 08 BL-P01.)
- Why the decision (3 Oct): the windows were to be filled from server purchase snapshots, which brief decision 3 removes. If BL-223 chooses reminders on the device, the table and `scheduleFor` become pure code in `packages/core` fed by StoreKit dates on the phone, with no server seed; otherwise this task is superseded.

#### BL-223 Trial and renewal reminders with no purchase server
- Status: needs-decision (drop the reminder promises, rely on Apple, or remind on the device? and what replaces server purchase consent records?). Mode: human. Owner: founder, legal. Milestone: M8, before the Terms go to counsel in week 5 (BL-104). Size: S (founder decision; counsel time not estimated).
- Satisfies: LEGAL-REQ-047, LEGAL-REQ-049, PRD-REQ-003, C-REQ-024 to C-REQ-026; compliance register CR-050.
- Scope: Terms 14.3 and 14.6 and the Subscription terms ("Reminders from us"; "send you a copy by email") promise email and in-app notices when a trial starts, before it ends, before an annual renewal, once a year and before a price change. LEGAL-REQ-047 builds those notices on our server from App Store Server Notifications, and LEGAL-REQ-049 reconciles purchase consent rows from them. Brief decision 3 removes both: no server of ours sees purchases. Options for the founder, with counsel:
  - (a) Drop the promises we cannot keep. Counsel says what remains our own duty when Apple is the merchant of record (CR-050).
  - (b) Rely on Apple's own notices. Verified: for a price increase, "the App Store informs the affected subscribers with an email, push notification, and in-app price consent sheet" (Apple StoreKit documentation, "Handling Subscriptions Billing", read 3 Oct 2026). Unverified: whether Apple sends any notice before a free trial ends or before a renewal. No Apple source was found on 3 Oct 2026; Apple's support page "Cancel a subscription from Apple" only tells people to cancel at least 24 hours before a trial ends, and PRD C 4.2 already marks Apple's trial notices as unverified.
  - (c) Remind on the device: local notifications and in-app cards scheduled from the StoreKit 2 renewal data on the phone. No email; it reaches people only while the app is installed and notifications are allowed; whether `expo-iap` exposes the dates is Unverified (BL-210).
  - Consent records: a `started` row written from the device at purchase start (our server then learns that a purchase began), or no server row at all. Counsel confirms either.
- Done when: the founder's answer is recorded as a decision entry, with counsel's input, and BL-212, BL-217, BL-218 and BL-224 and the proposed LEGAL-REQ-047 and LEGAL-REQ-049 changes follow it.

#### BL-226 Plus on the device: design note for decision 3
- Status: ready. Mode: agent. Owner: payments engineer. Milestone: M8, week 3. Size: S.
- Satisfies: ADR 0013, C-REQ-020, C-NFR-003, C-NFR-004, LEGAL-REQ-046, LEGAL-REQ-050; brief 3 Oct decision 3.
- Scope: `docs/payments/PLUS_ON_DEVICE.md`, the design that replaces the server half of TDD 08 and ADR 0013: where Plus comes from (StoreKit 2 entitlements on the device, own or through Family Sharing); the states the app must handle (active, in trial, grace period, billing retry, expired, refunded or revoked) and what each gate in `packages/core/src/plan.ts` does in each; the offline cache rule; which TDD 08 sections and BL tasks decision 3 supersedes; a checklist of LEGAL-REQ-046 disclosures against Apple's own subscription view; the questions BL-210 must answer. Every StoreKit API named is marked Verified (with the Apple documentation page) or Unverified. Propose the ADR 0013 amendment text in the PR body; do not edit `plan.ts` (founder code-owned).
- Done when: the note exists, every API claim is marked, and BL-210, BL-215 and BL-216 can cite it.

#### BL-210 StoreKit 2 spike on Expo SDK 57 (expo-iap first) [Critical]
- Status: blocked (BL-031, BL-103 for sandbox; the StoreKit configuration file works earlier). Mode: pair. Owner: payments engineer. Milestone: M8, week 3. Size: S.
- Satisfies: ADR 0013; brief 3 Oct decision 3.
- Scope (rewritten 3 Oct for brief decision 3): in a dev build, find the most standard way to reach StoreKit 2 from Expo SDK 57 for: Apple's own subscription view (`SubscriptionStoreView`, or the closest Apple-provided equivalent reachable from Expo); products load; purchase; current entitlements on the device, including family-shared transactions; transaction updates after a kill; intro-offer eligibility; Apple's restore, manage-subscription and refund sheets; the renewal dates BL-223 option (c) would need. Try `expo-iap` (5.8.x was the ADR 0013 candidate) first; which of these it exposes is Unverified. No `appAccountToken` binding and no server call. Record what each API returned in ADR 0013 (amended).

#### BL-211 App Store Server API and JWS verification in Deno
- Status: superseded (by BL-210; brief 3 Oct decision 3, no server of ours sees purchases). Mode: agent. Owner: payments engineer. Milestone: M8, week 3. Size: S.
- Satisfies: ADR 0013.
- Scope: does `@apple/app-store-server-library` run in Supabase Edge Functions through `npm:`? If not, `jose` plus Apple Root CA G3 verification and an ES256 JWT client. Tests use generated test keys, never Apple's.

#### BL-213 Billing migration and Plus rules on the server [Critical]
- Status: superseded (by brief 3 Oct decision 3; commit f20898c in PR #32 removes the server entitlement objects). Mode: agent (`approve-migration`). Owner: data architect, payments engineer. Milestone: M8, week 6. Size: L.
- Satisfies: K-28, PRD-REQ-015, C-REQ-021, C-REQ-028, D-038.
- Scope: `app_account_tokens`, `store_subscriptions` (one row per original transaction; 7-year ledger, pseudonymised at deletion), `store_notifications` (`notification_uuid` idempotency), `apply_store_transaction()`, `has_plus`, `book_has_plus`, `get_plan_state`, `my_app_account_token()`; `create_child` and `create_first_run_children` Plus rules; then `notice_schedule` with timestamps, `plan_cards`, `profiles.is_tester` and rule (d) for books made offline under Plus (D-038); DB-1 to DB-9 tests. Note 3 Oct: an uncommitted migration from the parallel data-architect session (`20261003010000_children_and_entitlements.sql`) already covers the first part; this task closes the rest. (Source: TDD 02 M9 / SB-11, TDD 08 order 5, TDD 07 BL-Q19, ADR 0013.)

#### BL-214 App Store notifications endpoint, `sync_plan`, reconcile [Critical]
- Status: superseded (by brief 3 Oct decision 3; no App Store Server Notifications endpoint). Mode: agent. Owner: payments engineer. Milestone: M8, weeks 7 to 9. Size: L.
- Satisfies: C-NFR-002, C-REQ-027, C-REQ-029, LEGAL-REQ-049, PRD-REQ-003.
- Scope: `appstore-notifications` (JWS verified, dedupe on `notificationUUID`, map by `appAccountToken`, re-read Get All Subscription Statuses, upsert, recompute notices, consent reconcile, logs without ids); `sync_plan()` RPC from the client's signed transaction; `plan-reconcile` hourly and nightly with Get Notification History; environment rule; replay suite W-1 to W-9 re-pointed to App Store payloads. (Source: TDD 08 BL-P03, ADR 0013.)

#### BL-215 Mobile plan module
- Status: blocked (BL-210, BL-050). Mode: pair (adds a purchase SDK). Owner: payments engineer, mobile engineer. Milestone: M8, weeks 8 to 10. Size: M.
- Satisfies: C-REQ-020, C-NFR-003, C-NFR-004, D-036; brief 3 Oct decision 3.
- Scope (rewritten 3 Oct for brief decision 3): the plan module in the payments feature folder: purchase only when signed in (D-036, kept until the founder says otherwise: its two reasons, Plus held on our server and emailed notices, both change under decision 3); Plus comes only from StoreKit 2 on the device: current entitlements (own or family-shared) at launch and on every transaction update; finish each transaction after StoreKit verifies it on the device; restore, manage and refund through Apple's own sheets; cache the last known state for offline; replace the `hasPlus` and `isJoinedBook` stubs. No `appAccountToken`, no server confirmation and no server plan state. D-047 no longer applies, because no server binds a subscription to one of our accounts. (Source: TDD 08 BL-P04, amended.)

#### BL-216 Plus sheet [High]
- Status: blocked (BL-036, BL-215). Mode: agent. Owner: payments engineer, design systems. Milestone: M8, week 10. Size: M.
- Satisfies: C-REQ-022, C-REQ-023, LEGAL-REQ-046, C-NFR-006, C-NFR-007.
- Scope: Apple's own subscription view from BL-210 (brief 3 Oct decision 3) with our header that says what Plus includes; check each LEGAL-REQ-046 disclosure against what Apple's view shows and add any that is missing in our header, above the button, readable at AX5; TDD 08 section 6 rules (no preselection, eligibility from the store, no urgency, no hardcoded prices, never on quiet surfaces); never offered when this device's Apple Account already has Plus, own or family-shared (D-036); delete `plus-gate.tsx` and the `onContinueDev` bypass; CI bundle grep fails on any dev bypass in production. (Source: TDD 08 BL-P05, C-9; TDD 07 BL-Q17.)

#### BL-217 Purchase consent records
- Status: needs-decision (BL-223). Mode: agent. Owner: payments engineer. Milestone: M8. Size: S.
- Satisfies: LEGAL-REQ-049, D-049. (Source: TDD 08 BL-P06.)
- Why the decision (3 Oct): LEGAL-REQ-049 matches a `completed` row to the App Store notification, which brief decision 3 removes. BL-223 decides what replaces it.

#### BL-218 Notice scheduler and emails [Critical]
- Status: needs-decision (BL-223). Mode: agent. Owner: payments engineer, content. Milestone: M8, weeks 9 to 12. Size: L.
- Satisfies: PRD-REQ-003, C-REQ-024 to C-REQ-026, LEGAL-REQ-047, LEGAL-REQ-053, LEGAL-REQ-054.
- Scope: pg_cron every 15 minutes; transactional templates without child names or promotion, with date, price string, cancel-by date (US Pacific in email, OQ-4) and cancel instructions; in-app cards; one push only for the final trial notice; hard-window refusal that pages the founder; the year-long clock test gates release. (Source: TDD 08 BL-P07, TDD 05 NEW-18, TDD 07 BL-Q18.)
- Why the decision (3 Oct): this server scheduler cannot see trials or renewals once no server of ours sees purchases (brief decision 3). BL-223 decides whether it is replaced by reminders on the device, by Apple's own notices, or dropped.

#### BL-219 Settings > Plan
- Status: blocked (BL-215). Mode: agent. Owner: mobile engineer. Milestone: M8. Size: M.
- Satisfies: C-REQ-016, LEGAL-REQ-048, C-REQ-029.
- Scope: status and dates from StoreKit on the device; a coverage line that says Plus comes with this Apple Account, from the person's own subscription or through Family Sharing (brief 3 Oct decision 3; it no longer covers a book through our server); Manage or cancel in one tap, Restore, Request a refund; deleting the app does not cancel (said plainly). (Source: TDD 08 BL-P08.)

#### BL-220 Account deletion billing step
- Status: blocked (BL-234). Mode: agent. Owner: payments engineer. Milestone: M8. Size: S.
- Satisfies: C-REQ-019, LEGAL-REQ-029.
- Scope: billing notice and Manage link before the final confirm (deleting the account does not cancel the Apple subscription); no server billing rows exist to remove (brief 3 Oct decision 3); purchase consent rows, if BL-223 keeps any, are pseudonymised; no third-party call (ADR 0013). (Source: TDD 08 BL-P10, amended.)

#### BL-221 Keep-and-leave end-to-end run [High]
- Status: blocked (BL-215, BL-216, BL-275). Mode: agent. Owner: QA engineer. Milestone: M8. Size: M.
- Satisfies: LEGAL-REQ-050, C-REQ-028, C-NFR-004.
- Scope: Maestro run with the App Store and entitlement hosts blocked and a lapsed fixture: write, read, play and export work; two books writable; a third offers Plus. (No shared audio at v1.0, brief 3 Oct decision 9.) (Source: TDD 08 BL-P11.)

#### BL-222 Sandbox checklist on device
- Status: blocked (BL-215, BL-216). Mode: human. Owner: founder, payments engineer. Milestone: M8, weeks 11 to 12; every build that changes purchase code. Size: S.
- Satisfies: C-NFR-002, C-NFR-003, C-REQ-020, C-REQ-027, C-REQ-029, LEGAL-REQ-048.
- Scope: S-1 to S-10 from TDD 08 9.1 with sandbox Apple Accounts, without the server steps (brief 3 Oct decision 3), plus a Family Sharing case if Apple's sandbox supports it (Unverified); signed evidence in `docs/qa/evidence/`.

#### BL-224 Terms and Subscription terms match decision 3 and the v1.0 scope
- Status: ready. Mode: agent. Owner: legal. Milestone: M8, before the counsel package in week 5 (BL-104). Size: S.
- Satisfies: LEGAL-REQ-044; brief 3 Oct decisions 3, 5 and 9.
- Scope: draft-for-counsel edits, with version bumps and change-log lines per `docs/legal/POLICY_VERSIONING.md`, in `docs/legal/terms-of-service.md` and `subscription-terms.md`: 12.1 (recordings leave the phone only through backup, which is not in v1.0; the D-032 counsel note is answered by decision 9); 14.1 and the Subscription terms feature list (no encrypted backup at v1.0; the rest follows the founder's answer on what Plus includes, BL-154); 14.11 and "If Plus ends" (no backed-up recordings at v1.0); 14.12 (Family Sharing is on, so Plus reaches the family members Apple's Family Sharing includes, instead of covering the co-parent through our server; decision 3); any family-contributor lines (co-parent only, decision 5). 14.3, 14.6, 14.8 and "Reminders from us" get a counsel note pointing at BL-223 and change only after its answer. Counsel notes stay questions, never conclusions.
- Done when: neither draft promises backup, server-side Plus coverage or family contributors at v1.0; the reminder lines carry the BL-223 note; versions and change logs are updated; content rules pass.

#### BL-225 Purchase data in the data policy and privacy labels match decision 3
- Status: ready. Mode: agent. Owner: privacy engineer, legal. Milestone: M8. Size: S.
- Satisfies: LEGAL-REQ-041, LEGAL-REQ-042, DATA-REQ-001; brief 3 Oct decision 3.
- Scope: `docs/legal/data-policy.md` still lists `app_account_tokens`, the `store_subscriptions` purchase ledger (7 years) and App Store transaction status held on our server; `docs/legal/app-store-privacy-labels.md` declares Purchases as linked because "entitlements are mapped to accounts and books on our server". Brief decision 3 and commit f20898c (PR #32) remove all of that. Update both documents to what the app does at v1.0 (StoreKit on the device; analytics purchase events only with consent), and line them up with `docs/legal/data-map.yaml` once PR #37 merges. Where the right privacy-label answer is a judgement call, write the question for counsel instead of a conclusion.
- Done when: neither document describes server-side purchase records; the label rows and the data-map rows agree; the change-log lines name brief decision 3.

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

#### BL-246 Privacy Policy and subprocessors match the v1.0 scope
- Status: ready. Mode: agent. Owner: legal. Milestone: M9, before the counsel package in week 5 (BL-104). Size: M.
- Satisfies: LEGAL-REQ-041, LEGAL-REQ-044; brief 3 Oct decisions 3, 5 and 9.
- Scope: draft-for-counsel edits with a version bump and change-log line in `docs/legal/privacy-policy.md` and `subprocessors.md` (line numbers on `develop` at 3688796): purchases (the subprocessors row for Apple names the App Store Server API and Server Notifications; no server of ours sees purchases, decision 3); recording backup and its keys (policy lines 22, 69, 117, 129 and 155; no audio upload at v1.0, decision 9); family contributors and web contributions (lines 38, 63, 90, 183 and 207; co-parent only, decision 5); support cards (lines 67, 94, 170 and 219, and CN-10; the classifier is v1.1, decision 9, and v1.0 has a static resources row). Coordinate with PR #37, which also edits `privacy-policy.md` (its version header). Counsel notes stay questions, never conclusions.
- Done when: neither document describes server purchase data, recording backup, family contributors or support cards as part of v1.0; versions and change logs are updated; content rules pass.

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

#### BL-253 Tracking plan: Plus totals from App Store Connect only
- Status: ready. Mode: agent. Owner: analytics engineer. Milestone: M10. Size: S.
- Satisfies: PRD-REQ-017 (Plus part replaced by brief 3 Oct decision 3), D-003.
- Scope: `docs/analytics/TRACKING_PLAN.md` still names RevenueCat and a server purchase ledger as the source of trials, conversions, renewals, cancellations and refunds (section 0 items 4 and 5, the 1.2 source codes and row 7, the section 2 billing row, the section 4 Plus row, 6.2 "RevenueCat ids", 8.3 pricing test arm). Brief decision 3 removes both. Replace them with App Store Connect reports and the device purchase events among consenters, following the metric tree's section 3.4 and its item R-3 (PR #40). Do not add any per-user join between App Store data and our accounts.
- Done when: the tracking plan names no RevenueCat id or server purchase ledger; every Plus metric cites an App Store Connect report or is marked device-only; analytics tests still pass.

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
- Scope: iCloud device backup then restore to a second phone; export ZIP then re-read; sign in on a new phone and re-download text (no audio upload at v1.0, brief 3 Oct decision 9).

#### BL-283 Release engineering and the founder checklist
- Status: blocked (BL-275). Mode: agent. Owner: QA engineer. Size: M.
- Satisfies: TDD 10 section 3; PRD 2.3.
- Scope: `docs/ops/RELEASE.md` (20 lines the founder runs per release, each linking automated evidence); release workflow from `ios-v*` tags; OTA gate questions ("does this change collection or destinations?"); pre-submission checklist; review-notes template with a demo account and the 5.1.1(ix) positioning (D-004).

#### BL-288 Android CI build (parity watch)
- Status: blocked (BL-031). Mode: agent. Owner: mobile engineer. Size: M. Satisfies: PRD 2.1 portability.
- Scope: Android build in CI and the small parity fixes (`haptics.android.ts`, BackHandler in Listen, audio mode); not shipped. (Source: TDD 01 BL-M20.)

#### BL-286 Store listing and submission
- Status: blocked (BL-104, BL-123, BL-152, BL-231, BL-280 exit). Mode: human. Owner: founder, content. Milestone: M13, weeks 14 to 15. Size: M.
- Satisfies: LEGAL-REQ-041 to LEGAL-REQ-045, LEGAL-REQ-058, D-030.
- Scope: listing text with no beta line (brief 3 Oct decision 10 settles D-030) and only v1.0 features (BL-152), screenshots, Lifestyle category, privacy labels entered with evidence, review notes, products attached to the version, territories = United States; submit Mon 11 Jan 2027.

---

## v1.1 and later (kept for ordering; not in the v1.0 window)

| BL | Task | Requirements | Source |
|---|---|---|---|
| BL-300 | Web contribution page (`apps/web`): anonymous identity at Send, contributor gateway, return links, browser audio encryption, page CSP and headers, Playwright suite | B-REQ-008, B-NFR-005, PRD-REQ-007, K-08, LEGAL-REQ-005, -010, -035 | TDD 02 SB-19, TDD 04 task 22, TDD 07 BL-Q13 |
| BL-301 | Hindi invite messages and Hindi web page | B-REQ-022 | B |
| BL-302 | Account linking between sign-in methods ("Ways to sign in"); Google sign-in itself moved to v1.0 as BL-179 (brief 3 Oct decision 4) | A-REQ-019 | TDD 04 task 13, D-044 |
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
| BL-315 | Shared voice: encrypted audio upload, member playback, wrap-key custody (was BL-200 to BL-203 and BL-206) | C-NFR-008, DATA-REQ-047, B-REQ-011, LEGAL-REQ-023 | Brief 3 Oct decision 9; D-032 design |
| BL-316 | Family contributors in the app: contributor first run, approvals, Family can read, removing a member, family-letter push (was BL-191, BL-192, BL-194, BL-196 and part of BL-193) | B-REQ-007, B-REQ-009 to B-REQ-011, C-REQ-007, PRD-REQ-014 | Brief 3 Oct decision 5; D-002 |
| BL-317 | Second-provider copy of backup ciphertext (7-day versioning at most) | DATA-REQ-030 | TDD 06 BL-R15, TDD 05 X-16 |
| BL-318 | Read together word highlighting: alignment projection, quality gate and highlight (was BL-145 and the highlight part of BL-160) | PRD-REQ-020, ADR 0009 | Brief 3 Oct decision 9; TDD 03 BL-068 |
| BL-319 | Nightly perf and concurrency runs; analytics additions; monthly cost sheet | PRD 7.8 | TDD 06 BL-R03, R04, R14, R17 |
| BL-320 | P1 product items: sealed letters, multi-book invite picker, merge books, themes, author and child photos, reminder back-off | B-REQ-018 to B-REQ-024, C-REQ-008 | B, C |
| BL-321 | Hindi app UI (P2) | B-REQ-025, A-NFR-014 | K-24 |
| BL-322 | On-device safety classifier and support cards, only with a clinician's written sign-off (BL-105) | LEGAL-REQ-015 | Brief 3 Oct decision 9; D-034 |

Printed books stay a future launch (K-32; ADR 0007 print half). Beta label removal happens only when the founder ends the beta (K-13): one release removes `settings.about.beta.*`, any store beta lines and Terms 16.4.

---

## Appendix: TDD proposal to BL mapping

Every task id proposed in TDD 01 to 09 maps to exactly one BL id (or is marked n/a with the reason). "+" means merged into that task.

| TDD | Proposed id to BL id |
|---|---|
| 01 (BL-M##) | M01 to BL-121; M02 to BL-111; M03 to BL-037; M04 to BL-040; M05 to BL-130; M06 to BL-142; M07 to BL-136; M08 to BL-034; M09 to BL-022; M10 to BL-031; M11 to BL-250; M12 to BL-156; M13 to BL-154; M14 to BL-170; M15 to BL-134; M16 to BL-275 + BL-276; M17 to BL-150; M18 to BL-044; M19 to BL-173 + BL-174 (per D-023); M20 to BL-288 |
| 02 (SB-##, M#) | SB-01 to BL-173; SB-02 (M5) to BL-112; SB-03 (M6) to BL-175; SB-04 (M7) to BL-113; SB-05 (M8) to BL-114; SB-06 to BL-116; SB-07 to BL-173 (pull parity; Sync Streams only if PowerSync is chosen); SB-08 to BL-174; SB-09 (M10) to BL-236 + BL-022; SB-10 to BL-190; SB-11 (M9) to BL-213; SB-12 to BL-214 + BL-218; SB-13 to BL-234; SB-14 to BL-107; SB-15 to BL-177; SB-16 to BL-282; SB-17 (M11) to BL-178; SB-18 (M12) to BL-200 to BL-203 (reduced) + BL-306; SB-19 (M13) to BL-300; SB-20 to BL-247; SB-21 to BL-309; SB-22 to BL-312 |
| 03 (BL-060 to BL-071) | 060 to BL-130; 061 to BL-140; 062 to BL-141; 063 to BL-142; 064 to BL-120; 065 to BL-143; 066 to BL-144; 067 to BL-146; 068 to BL-145; 069 to BL-147; 070 to BL-304; 071 to BL-305 |
| 04 (SEC-##, order #) | SEC-01 to BL-106; SEC-02 to BL-106 + BL-122; SEC-03 to BL-172; SEC-04 to BL-116 + BL-195; SEC-05 to BL-115 (pepper) + BL-236 (tables); SEC-06 to BL-248; SEC-07 to BL-249; SEC-08 to BL-200; SEC-09 to BL-306; SEC-10 to BL-237; SEC-11 to BL-245; SEC-12 to BL-117; SEC-13 to BL-239; SEC-14 to BL-241; SEC-15 to BL-313; SEC-20 to BL-241; order 5 to BL-112; 6 to BL-114; 8 to BL-031; 9 to BL-037; 11 to BL-170; 12 to BL-171; 13 to BL-179 (Google sign-in, v1.0) + BL-302 (linking); 19 to 21 to BL-306 (BL-200, BL-206 for the v1.0 subset); 22 to BL-300; 28 to BL-314 |
| 05 (NEW-##) | 01 to BL-115; 02 to BL-114; 03 to BL-016; 04 to BL-231; 05 to BL-232; 06 to BL-234; 07 to BL-235; 08 to BL-240; 09 to BL-150; 10 to BL-309; 11 to BL-237; 12 to BL-171; 13 to BL-173 (n/a if PowerSync is not used); 14 to BL-243 (v1.0 static) + BL-310; 15 to BL-239; 16 to BL-238; 17 to BL-117; 18 to BL-218; 19 to BL-118; 20 to BL-106 |
| 06 (BL-R##) | R01 and R02 to BL-289; R03 and R04 to BL-319; R05 and R06 to BL-239; R07 to BL-244; R08 to BL-242; R09 to BL-107; R10 to BL-173 (restore epoch) + BL-247 (drill); R11 to BL-282; R12 n/a (PowerSync client load harness; only if PowerSync is chosen, then BL-282); R13 to BL-044; R14 to BL-319; R15 to BL-317; R16 to BL-241; R17 to BL-319; R18 to BL-206 |
| 07 (BL-Q##) | Q01 to BL-110; Q02 to BL-120; Q03 to BL-239; Q04 to BL-119; Q05 to BL-118; Q06 to BL-117; Q07 to BL-239; Q08 to BL-278; Q09 to BL-116; Q10 to BL-114; Q11 to BL-174; Q12 to BL-195; Q13 to BL-300; Q14 to BL-173 (pull parity); Q15 and Q16 to BL-151; Q17 to BL-216; Q18 to BL-218 + BL-214; Q19 to BL-213; Q20 to BL-154; Q21 to BL-150; Q22 to BL-234 + BL-238; Q23 to BL-279; Q24 to BL-304; Q25 to BL-275; Q26 to BL-276; Q27 to BL-277; Q28 to BL-004; Q29 to BL-280; Q30 to BL-135 |
| 08 (BL-P##) | BL-036 extension to BL-036; P01 to BL-212; P02 to BL-103; P03 to BL-214; P04 to BL-215; P05 to BL-216; P06 to BL-217; P07 to BL-218; P08 to BL-219; P09 to BL-201; P10 to BL-220; P11 to BL-221; P12 to P14 to BL-308; P15 to BL-311 |
| 09 (BL-070 to BL-090) | 070 to BL-255; 071 to BL-256; 072 to BL-257; 073 to BL-258; 074 to BL-259; 075 to BL-260; 076 to BL-261; 077 to BL-262; 078 to BL-263; 079 to BL-264; 080 to BL-265; 081 to BL-266; 082 to BL-267; 083 to BL-270; 084 to BL-271; 085 to BL-156; 086 to BL-268; 087 to BL-269; 088 to BL-279; 089 to BL-273; 090 to BL-272 |

Unused numbers inside the blocks (for example BL-125 to BL-129, BL-131 to BL-133, BL-138, BL-139, BL-149, BL-155, BL-161 to BL-169, BL-181 to BL-189, BL-197 to BL-199, BL-204, BL-207 to BL-209, BL-227 to BL-230, BL-254, BL-274, BL-281, BL-285, BL-287, BL-290 to BL-299) are free for splits inside their milestone. BL-123 and BL-124 sit in M0 because the M0 block (BL-100 to BL-109) is full; the next new v1.1 id is BL-323.
