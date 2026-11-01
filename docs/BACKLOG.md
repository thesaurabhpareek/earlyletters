# Backlog (v1.0)

The ordered list of work for Early Letters v1.0 and the v1.0.1 patch. Format and rules: ADR 0011 (`docs/adr/0011-requirements-and-agent-workflow.md`).

**Version 1.0, 3 Oct 2026 (evening), consolidated by the backlog-consolidation PM after the 3 Oct waves.** Window: Mon 5 Oct 2026 to App Store submission in the week of Mon 2 Nov 2026 (`docs/ROADMAP.md` 2.1). Everything after v1.0.1 lives in `docs/backlog/FUTURE.md` (v1.1 to v1.3, ids CVL, FAM, BK, G, T5). Every step only the founder can take lives in `docs/FOUNDER_TASKS.md` (ids FT-##); tasks here point to them.

What changed from the 3 Oct morning version:
- Each status was checked against the code on `auto/2026-10-04-wave` (files and commits named), not against reports. "Done in code" means built and tested in the repo; device checks and the live database apply are separate tasks and say so.
- Items made stale by the founder's 3 Oct decisions are `superseded` with the decision id: server billing, App Store Server Notifications and RevenueCat (D-053), PowerSync (D-023), contributors and the web page at v1.0 (D-055), audio upload (D-059), the remote-config table (D-068), Google sign-in in v1.1 (D-054).
- New tasks start at **BL-330**, plus BL-322 to BL-326 for findings in `docs/reviews/2026-10-04-security-privacy.md` (none of these ids was used before).
- Late in the wave (21:00 to 21:05 UTC): the security review landed (0 Critical, 3 High), legal-alignment's Q-003 memo makes on-device plan reminders a **v1.0** item (Subscription Terms 1.4.0 promise them), mobile-polish mounted the consent ask sequencer, and db-followup's `20261005000000_family_cap_language_idempotency.sql` builds and applies. Statuses below include them.
- Two new status values: `needs-founder (FT-##)` and `in-progress (<agent>)`.

Requirements are cited, never copied. Sources: `docs/prd/PRD.md` (PRD-REQ, conflict log K-##), `docs/prd/A-*.md`, `B-*.md`, `C-*.md` (A/B/C-REQ, -NFR), `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ), `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ). If a PRD line and a LEGAL-REQ disagree, LEGAL-REQ wins until the founder decides. Decisions: D-### in `docs/DECISIONS.md`; open questions: Q-### in `docs/agents/DEBATES.md`; design detail: TDD ## (`docs/tdd/`).

**Numbering.** Existing ids (BL-001 to BL-321) never change. **BL-055 to BL-099 are never used** (TDD 03 and TDD 09 proposed colliding numbers there; the appendix maps every TDD proposal). New ids from this consolidation: BL-322 to BL-326 (security review follow-ups) and BL-330 to BL-349. Free for later splits: BL-123 to BL-129, BL-131 to BL-133, BL-138, BL-139, BL-149, BL-152, BL-153, BL-155, BL-161 to BL-169, BL-179 to BL-189, BL-197 to BL-199, BL-204, BL-207 to BL-209, BL-223 to BL-230, BL-246, BL-253, BL-254, BL-274, BL-281, BL-285, BL-287, BL-290 to BL-299, BL-315, BL-316, BL-318, BL-327 to BL-329; BL-351 to BL-369 are the brand, email and web handoffs, and BL-370 to BL-434 are the M-JR journey review block (4 Oct 2026); BL-435 is free; BL-436 to BL-440 are release engineering (ADR 0022, 13 Oct 2026; BL-440 is listed first because it is the v1.0 blocker); BL-441 to BL-443 are the coverage baseline follow-ups (`docs/qa/COVERAGE.md`, PR #180, 16 Oct 2026); BL-444 is the left-books follow-up (D-113, PR #184, 23 Oct 2026); BL-445 is the typed-code follow-up (D-120, 27 Oct 2026); BL-446 to BL-456 are the review follow-ups of 28 Oct 2026 (section "Review follow-ups (28 Oct 2026)"); BL-457 to BL-474 are the second wave of 28 Oct 2026 (section "Review follow-ups, wave 2 (28 Oct 2026)"); BL-475 to BL-484 are the third wave of 30 Oct 2026 (section "Review follow-ups, wave 3 (30 Oct 2026)"); BL-485 to BL-497 are the fourth wave of 30 Oct 2026 (section "Review follow-ups, wave 4 (30 Oct 2026)"); BL-499 to BL-508 are the fifth wave of 30 Oct 2026 (section "Review follow-ups, wave 5 (30 Oct 2026)"; BL-498 is not used: the id script counted the earlier "next block starts at BL-498" as taken); BL-509 to BL-527 are the sixth wave of 31 Oct 2026 (section "Review follow-ups, wave 6 (31 Oct 2026)"); BL-528 is the offline consent-record gap (CR-35, CCO-4, PR #456), filed beside BL-323; BL-529 is the export's profile fields (LEGAL-REQ-034, PR #469); BL-530 to BL-550 are M13 (section "M13. Reminders, nudges and photo moments", 1 Nov 2026); run `node scripts/agents/next-id.mjs` for the next free id.

---

## How a scheduled run uses this file

1. Pull `develop`. Read `CLAUDE.md`, `docs/agents/COORDINATION.md`, then this file.
2. Any task whose `bl-###` appears in an open PR branch, or that is `in-progress` on `docs/agents/BOARD.md`, is taken.
3. Pick the **first** task in file order with `Status: ready`, `Mode: agent`, and every `Depends on` task `done`. Skip `human`, `pair`, `blocked`, `needs-founder`, `needs-decision`, `in-progress`, `superseded` and `deferred` tasks.
4. One task per run and per PR. Branch: `<type>/<area>-bl-###-<slug>`. PR title: `BL-###: <title>`.
5. Meet the Definition of Done. If a task is bigger than one PR, split it here (free ids above, same `Satisfies`) and stop.
6. In the same PR, change only this task's status line to `in-review (PR #n)`.
7. If tests fail and the fix is outside the task, open a **draft** PR titled `BL-###: blocked`, say why, and stop.
8. Never: apply a migration to a remote Supabase project, touch secrets or store accounts, edit an applied migration (`.github/migrations-applied.txt`), weaken a test, merge a PR, add an analytics, crash or purchase SDK (those tasks are `pair`), publish packs or config, or edit a requirement document.
9. **Agent fence (D-041).** CI is on (BL-004 done). Until branch protection is on (BL-005, FT-20), unattended runs take only tasks under `packages/*` and `docs/`. After that, any PR touching `supabase/**` or authentication code needs an independent review run and the founder's `approve-migration` label.

**Agent team (ADR 0018).** Unattended work is now assigned by `scripts/agents/dispatch.mjs` to the agent whose `backlog_owner_names` in `agents/roster.json` include the task's first non-founder Owner. Rules 1 to 9 above still apply to every run. A task `blocked` only by backlog ids that are all `done` counts as ready. Only the `product` agent edits tasks other than its own status line.

Status values: `ready`; `blocked (reason)`; `needs-founder (FT-##)`: waits on a step in `docs/FOUNDER_TASKS.md`; `needs-decision (D-### or Q-###)`; `in-progress (<agent>)`: claimed on BOARD.md this wave; `in-review (PR #n)`; `done (evidence)`; `superseded (by D-### or BL-###)`; `deferred (release, FUTURE id)`.
Mode values: `agent`, `human` (founder, device, store, vendor or secrets), `pair` (interactive session with the founder).
Severity tags: **[Critical]** blocks launch or makes a published statement false; **[High]** must land before the related feature reaches non-founder users.

---

## Status at a glance (verified 3 Oct 2026)

| Status | v1.0 tasks |
|---|---|
| Done in code | BL-003, BL-004, BL-010 to BL-014, BL-020, BL-023, BL-024, BL-031, BL-033 to BL-035, BL-036, BL-037, BL-040, BL-050 to BL-052, BL-054, BL-100, BL-111 to BL-114, BL-116, BL-120, BL-121, BL-130, BL-137, BL-140 to BL-143, BL-150, BL-151, BL-154, BL-157 to BL-160, BL-170, BL-172 to BL-174, BL-176, BL-215, BL-216, BL-219, BL-220, BL-233 to BL-235, BL-238, BL-240, BL-250, BL-255 to BL-264, BL-267, BL-289 |
| Done in part (remainder named in the task) | BL-115 (rest is BL-334), BL-118 (rest is T5-08), BL-122, BL-134, BL-136, BL-156, BL-171 (rest is BL-330), BL-236, BL-237, BL-239, BL-241, BL-242, BL-348 (app done in #165, 23 Oct 2026; rest is the website `/j` page, PR #144) |
| In progress this wave | BL-021 and BL-266 (mobile-polish), BL-275 to BL-277, BL-279, BL-283 (qa-e2e), BL-331 to BL-333 (db-followup, `20261005000000` builds and applies), legal alignment (`docs/legal/**`, legal-alignment). Done this wave: the security review (`docs/reviews/2026-10-04-security-privacy.md`) |
| Needs the founder | BL-005, BL-015, BL-030, BL-043, BL-044, BL-053, BL-101 to BL-104, BL-106 to BL-109, BL-122, BL-135, BL-177, BL-222, BL-245, BL-247, BL-280, BL-284, BL-286, BL-335 to BL-337, BL-339, BL-346 |
| Ready for agents (v1.0 first) | **BL-330, BL-347, BL-322, BL-342, BL-349** (the five that gate C1 or make a published statement true), then BL-323 to BL-326, BL-334, BL-341, BL-001, BL-002, BL-110, BL-117, BL-119, BL-148, BL-244, BL-251, BL-252, BL-265, BL-268, BL-270, BL-272, BL-273, BL-278; v1.0.1: BL-343, BL-344 |
| Blocked | BL-221 (BL-275), BL-243 (website thread), BL-269 (BL-278), BL-340 (first preview build) |
| Needs a decision | BL-338 (Q-009), BL-345 (counsel, FT-47) |
| Superseded or deferred | Everything in M6 and M7, most of M8's server half, BL-016, BL-022, BL-041, BL-105, BL-118 (rest), BL-144 to BL-147, BL-175, BL-178, BL-231, BL-232, BL-248, BL-249, BL-271, BL-282, BL-288, the v1.1 table |

### Critical path to submission, in order

Engineering is ahead of the founder path. The date is set by these, in this order (detail in `docs/ROADMAP.md` 2.1 and `docs/FOUNDER_TASKS.md`):

| # | Step | Task | Needed by |
|---|---|---|---|
| 1 | Apple Developer enrolment (individual) | BL-101, FT-01 | Mon 5 Oct |
| 2 | Paid Apps agreement Active; identifiers and Sign in with Apple key; app record; Plus products | BL-102, BL-103, BL-053, FT-06 to FT-09 | Wed 7 to Thu 8 Oct |
| 3 | Supabase staging with every migration applied, auth configured, secrets set | BL-015, BL-107, BL-053, FT-10 to FT-13 | Thu 8 Oct |
| 4 | Pack signing key and host (kill switches and non-English packs work only after this) | BL-335, BL-337, FT-16 | Fri 9 Oct |
| 5 | `eas init` and the first development build on a real iPhone | BL-108, BL-339, FT-17 | Fri 9 Oct |
| 6 | Security fixes before anyone outside the family signs in: Apple token capture (review H3), email-link login hijack (H1), invite confirm tap (H2 app part), membership and rate-limit migration (H2, M1, M3, M5), privacy manifest (L7) | BL-330, BL-347, BL-322, BL-331, BL-332, BL-349 | before C1, Mon 19 Oct |
| 6b | On-device plan reminders and "Save a copy" after purchase (Subscription Terms 1.4.0 promise them) | BL-342 | feature freeze, Mon 26 Oct |
| 7 | Device spikes: speech per language on SE 3, StoreKit sandbox, three sign-ins, two-phone sync, deletion, size | BL-030, BL-043, BL-044, BL-177, BL-222, FT-21, FT-22 | Fri 16 Oct |
| 8 | Production database, policy versions for the beta, legal pages live | BL-015, BL-338, FT-23, FT-31 | Tue 13 to Wed 14 Oct |
| 9 | C0 internal TestFlight, then Beta App Review, then C1 external | BL-280, FT-25, FT-26, FT-32 | Wed 14, Thu 15, Mon 19 Oct |
| 10 | Counsel sign-off; legal pages and 1.0.0 policy versions published | BL-104, FT-33, FT-41 | Thu 29 Oct |
| 11 | Release-candidate device checks and C1 exit review | BL-044, BL-135, BL-222, BL-284, FT-39, FT-40 | Thu 29 Oct |
| 12 | Listing, privacy answers, review notes; submit | BL-286, BL-340, BL-341, FT-43, FT-45 | Fri 30 Oct, Mon 2 Nov |

---

## Definition of Done (every task)

1. **Tests.** `npm test`, `npm run typecheck`, `npm run test:db` and `npm run test:functions` pass locally and in CI (`.github/workflows/ci.yml`, Node 22). New behaviour has tests. A test that proves a requirement starts its title with the id in brackets, for example `[DATA-REQ-040] raw_sha256 cannot change`. Logic lives in `packages/*` or `*.logic.ts` wherever possible.
2. **Traceability.** The PR body lists `Satisfies:` ids. `scripts/trace.mjs` passes once BL-002 lands.
3. **Constitution.** Nothing writes, rewrites, summarizes or shapes a person's words. Machine edits go through `verifyEdits`. `raw_transcript` stays immutable.
4. **Content rules.** Every user-facing word lives in `packages/content` and passes `packages/content/test/rules.test.ts`. The brand name and publisher identity come only from `packages/brand`. If a rule test fails, fix the copy, not the test.
5. **Data classification.** Any new table, column, bucket, device store, SDK or vendor has its row in `docs/legal/DATA_CLASSIFICATION.md` (1.3.0 is the inventory until BL-016) in the **same PR**, with class and level (L1 to L4), owner and retention. The PR body states `Data classes touched:`. Content and sensitive data never reach analytics, logs, crash reports, push payloads, URLs or support prefill (LEGAL-REQ-014).
6. **Privacy in tests.** Fixtures use only the fictional family "Asha".
7. **Database.** Schema changes ship as a new file in the agent's assigned timestamp range; applied migrations are never edited; every new RLS rule has an access-matrix row (`supabase/tests/access_matrix.test.mjs`). The founder applies migrations in `supabase/APPLY.md` order (COORDINATION 6).
8. **Performance budgets.** If the task touches a budgeted path, the PR states the budget and how it was checked. Budgets: cold start p50 <= 1.2 s and p90 <= 2.0 s on iPhone SE 3; no awaited network or model load on launch; first-run screens interactive <= 300 ms; Settings < 300 ms; switch child p95 300 ms; local save p95 200 ms; Plus sheet under 1 s; **App Store download under 40 MB** (D-065, `docs/ops/APP_SIZE.md`; JS bytecode 6.2 MB today).
9. **Accessibility.** Dynamic Type to AX5 without truncation (letter text never capped, D-027), VoiceOver labels, 44 pt targets, Reduce Motion honoured.
10. **Scope.** One concern per PR.

---

## M0. Founder long poles (week 1, then ongoing)

Exact steps, time, cost and deadlines are in `docs/FOUNDER_TASKS.md`. This section only tracks status.

#### BL-100 Domain and support mailbox [Critical]
- Status: done (D-063: earlyletters.com and earlyletters.app registered at Porkbun; hello@earlyletters.com live through Resend; `packages/brand` carries the domain and support email). Remainder moved: `privacy@`, `security@`, `dmarc@` aliases (FT-13); Porkbun security (FT-05).

#### BL-101 Apple Developer Program, individual enrolment [Critical]
- Status: needs-founder (FT-01). Mode: human. Satisfies: D-004, D-064. Blocks every Apple step (BL-102, BL-103, BL-053, BL-108, BL-280).

#### BL-102 Paid Applications Agreement, tax and banking
- Status: needs-founder (FT-06), after BL-101. Then the Small Business Program (FT-29). Satisfies: C-REQ-021.

#### BL-103 App Store Connect: app record and Plus products [Critical]
- Status: needs-founder (FT-08, FT-09), after BL-101 and BL-102.
- Scope (rewritten for D-053; the old scope is superseded): app record for `com.earlyletters.scribe`; subscription group `Plus`; `plus.monthly` US $4.99 with a free 1-month introductory offer and `plus.annual` US $49.99 with a free 2-month offer; same level; **Family Sharing on** for both; Billing Grace Period 16 days (D-048); United States only; sandbox testers. Steps: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`.
- Superseded parts (D-053): product ids `el_plus_*`, Family Sharing off, experiment-arm products, the In-App Purchase key and the App Store Server Notifications URLs.

#### BL-104 Counsel engagement and sign-off [Critical]
- Status: needs-founder (FT-03 engage, FT-18 package, FT-33 comments, FT-41 sign-off). Satisfies: LEGAL-REQ-044.
- Scope (updated): the v1.0 package that legal-alignment is preparing in `docs/legal/` (Terms, Privacy Policy, Consumer Health Data notice, Subscription Terms, in-app disclosures, claims), plus the open counsel questions: Q-003 (subscription emails), Q-004 and Q-005 (analytics language code, privacy label), Q-009 (policy versions for the beta), D-039, D-042, D-050, guideline 5.1.1(ix) as an individual (D-004), AB 1043 and Texas SB 2420 (BL-345), training-data terms for the Hindi model (ADR 0015 section 9). Sign-off Thu 29 Oct.

#### BL-105 Perinatal clinician review of safety copy
- Status: deferred (v1.1, FUTURE OPEN-01; D-059: the classifier is v1.1, the static "If you are struggling" row ships in v1.0). The founder checks the two listed resources are current before submission (FT-36).

#### BL-106 Vendor evidence and console security
- Status: needs-founder (FT-02 two-factor, FT-30 DPAs and retention evidence). Satisfies: LEGAL-REQ-022(c), -026, -028, DATA-REQ-062.

#### BL-107 Staging and production Supabase projects
- Status: needs-founder (FT-10 staging, FT-23 production; FT-04 decides whether `early-letters` becomes production or a clean `scribe-prod` is made). Satisfies: DATA-REQ-005, DATA-REQ-030, D-041.

#### BL-108 Expo account and EAS build credentials
- Status: needs-founder (FT-17), after BL-101. Agent half is BL-339.

#### BL-109 Recruit the C1 beta families
- Status: needs-founder (FT-26). Coverage (D-045, updated for D-055): two or more co-parent pairs, at least one Hindi and one Spanish speaker, one other non-English language, one VoiceOver or large-text user, one set of twins. Grandparents are not in v1.0.

#### BL-005 Founder setup for the workflow
- Status: needs-founder (FT-20). CI exists (BL-004). Remaining: branch protection on `develop` and `main` requiring the `required` job; labels `inbox`, `bug`, `idea`, `beta`, `S0` to `S3`, `approve-migration`; accept ADR 0011.

#### BL-053 Sign-in providers and email setup [Critical]
- Status: needs-founder (FT-07 Apple, FT-12 Supabase Auth, FT-13 Resend, FT-14 DNS, FT-15 Google), after BL-101.
- Scope (updated for D-054): Sign in with Apple, **Google (v1.0, supersedes the D-044 deferral)** and email link plus code; Resend SMTP with SPF, DKIM and DMARC; open and click tracking off; the AASA file with the Team ID served by the website. Steps: `docs/ops/AUTH_SETUP.md`.

---

## M1. Guardrails and the security migration pack

#### BL-001 Point CLAUDE.md at the backlog
- Status: ready. Mode: agent. Owner: QA engineer. Note: CLAUDE.md is coordinator-owned; the PR proposes the lines.
- Scope: a short "Work selection" section linking this file, `docs/backlog/FUTURE.md`, `docs/FOUNDER_TASKS.md` and the run protocol; add the `-bl-###-` branch pattern. Under 10 lines.

#### BL-002 Traceability check
- Status: ready. Mode: agent. Owner: QA engineer. Verified: `scripts/trace.mjs` does not exist.
- Scope: as before: collect defined ids (A/B/C-REQ and -NFR, LEGAL-REQ, DATA-REQ, PRD-REQ), collect cited ids in this file, test titles and the PR template, fail on unknown ids, write `docs/TRACE.md`, `npm run trace` called from `npm test`.

#### BL-003 Pull request template
- Status: done (3bf45a0, `.github/pull_request_template.md`).

#### BL-004 Continuous integration [Critical]
- Status: done (3bf45a0, `.github/workflows/ci.yml`: install, unit and content rules, database rules, Deno functions, typecheck including `apps/mobile`, one `required` job; Node 22; plus `migration-guard.yml` and `CODEOWNERS`).

#### BL-110 Requirement ids in test titles; database harness sections
- Status: ready. Mode: agent. Owner: QA engineer. Verified: 7 test files cite requirement ids; the harness has no named sections or JUnit output yet.

#### BL-121 Mobile test harness and lint
- Status: done (vitest in `apps/mobile` runs inside root `npm test`, about 1,150 tests across workspaces; integration wave a66376a). Lint rules (banned imports, no `console`) move to BL-117.

#### BL-117 CI security and platform scans [High]
- Status: ready (BL-004 is done). Mode: agent. Owner: security engineer.
- Scope: SDK and import denylist (ads, attribution, tracking, AdSupport, AppTrackingTransparency, HealthKit, face and diarization libraries, speech synthesis and voice cloning for CVL-04); manifest lint; gitleaks; Semgrep and SQL lint; OSV and npm audit; a release-bundle grep that fails on any dev bypass (from BL-216: `onContinueDev`, `devShortcutsAllowed` must be false in preview and production); placeholder scan (`TODO` publisher values fail release builds only); lint rules from BL-121.

#### BL-122 Agent fence and review rule
- Status: needs-founder (FT-20). Done in part: `CODEOWNERS` and the migration guard (3bf45a0). Remaining: the `approve-migration` label rule and the run limit.

### E1. Database integrity, governance and the fix pack

All database files below are **written and tested but not applied** to any remote project. The founder applies them in `supabase/APPLY.md` order (BL-015). Applied today: `20260930000000` and `20261001000000` only (`.github/migrations-applied.txt`).

#### BL-010 to BL-014 Governance migration (immutability, raw transcript, no cascade, audit and deletion state machine, policy acceptances)
- Status: done in code (81d9546, `20261002020000_data_governance.sql`); live apply is BL-015.

#### BL-112 Parent-only invites with explicit role [Critical]
- Status: done in code (3bf45a0, `20261003000000_security_and_family.sql`: parents only, explicit role, limits, revoke). Follow-ups found by the security review (a third parent, an inviter who has left, a remove path) are BL-331, in progress.

#### BL-113 Client ids for children, due date, live books only [High]
- Status: done in code (`20261003010000`; its Plus rule removed by `20261004000000` per D-053).

#### BL-114 Server consent gates and anonymous guards [Critical]
- Status: done in code (`20261003000000`: `is_anonymous` restrictive policies, content gate `SCCON`, `my_sync_gate`).

#### BL-115 Policy versioning and pepper [Critical]
- Status: done in part (`20261003000000`: X-01 notice-window fix, X-11 `source='support'` refused). Remainder is BL-334 (X-12: the pepper falls back to an empty string today).

#### BL-116 Access-test harness [High]
- Status: done (3bf45a0 and a66376a: `supabase/tests/access_matrix.test.mjs` with personas including `anon` and anonymous sessions; 466 checks at the integration check-in).

#### BL-015 Apply the migration pack to staging, then production [Critical]
- Status: needs-founder (FT-10 staging Thu 8 Oct; FT-23 production before C0 on Wed 14 Oct). Mode: human.
- Scope (updated): `supabase/APPLY.md` steps 1 to 16 in order, then the db-followup section appended for `20261005*` (BL-331 to BL-333) once it lands; the consent pepper (step 6) **before** any deletion runs; the purge and housekeeping crons; policy versions (step 8.2, see BL-338); settings from `docs/ops/SECURITY.md` section 4; record each applied file in `.github/migrations-applied.txt` through the coordinator. D-041's "apply only from CI on a tag" is not built; for v1.0 the founder applies by hand with APPLY.md's checks.

#### BL-016 Data map is canonical [High]
- Status: deferred (v1.1, with T5-01 and T5-08 in FUTURE). v1.0 uses `docs/legal/DATA_CLASSIFICATION.md` 1.3.0, regenerated from the migrations by the analytics agent.

#### BL-118 Content rule additions and claims registry [High]
- Status: in-review (PR #46, the remaining rules). Done before it: the rules test enforces the trust lines word for word, no beta wording, no grandparent claims, and only what Plus gates in v1.0 (D-053, D-055, D-060, D-061 effects). The claims registry is deferred (v1.1, merged into T5-08).

#### BL-119 `child-input` flag in the prompt selector [High]
- Status: ready. Mode: agent. Owner: speech engineer. Verified: Tonight passes `together: false` to `selectPrompt`, so `together` prompts never show today, but `packages/core` has no flag and no test that proves it.

#### BL-120 Verifier hardening and property tests [High]
- Status: done (3bf45a0: negation, tense and modal guards in `packages/core/src/verify.ts`, `test/verify.fuzz.test.ts`, language regressions in `test/lang.*.test.ts`; ENGINE_VERSION 4).

#### BL-111 LocalStore interface and schema migrator [High]
- Status: done (3bf45a0, `apps/mobile/src/lib/db/migrations.ts`: `PRAGMA user_version` steps in transactions; `expo-adapter.ts`: WAL with `synchronous=FULL`; Node tests).

#### BL-032 Local store and atomic save
- Status: superseded (by BL-111 and BL-130).

#### BL-334 Consent pepper guard (new) [High]
- Status: ready. Mode: agent (`approve-migration`; migration range from the coordinator, or folded into db-followup's `20261005*`). Owner: privacy engineer.
- Satisfies: LEGAL-REQ-009, DATA-REQ-006; TDD 05 X-12.
- Scope: account deletion's pseudonymisation raises if `app.consent_pepper` is missing or shorter than 32 characters, instead of hashing with an empty pepper (`coalesce(current_setting('app.consent_pepper', true), '')` today); a test proves it. The founder sets the pepper in FT-10 before any deletion.

---

## M2. Capture that cannot lose a word

#### BL-030 Component spike on a real iPhone
- Status: needs-founder (FT-17 first build, FT-22 device spikes). The stack runs in the web preview and passes `tsc`; nothing has run on a phone yet.

#### BL-031 App identity and build configuration [High]
- Status: done (`apps/mobile/app.config.ts` from `packages/brand`; bundle ids with `.dev` and `.preview`; `eas.json` development, preview, production). Not done: `expo-updates` and an OTA policy (not installed); decide after v1.0 (optional for v1.0.1).

#### BL-037 18+ root gate and stop screen [Critical]
- Status: done (3bf45a0 and a66376a: `src/lib/age-gate.ts`, `age-gate.logic.ts`, root gate in `_layout.tsx`).

#### BL-040 Boot sequence, launch path and splash
- Status: done in code (a66376a: boot wiring in `_layout.tsx` for remote, packs, queue, listening copies, sync, Plus, reminders, analytics). Device timing is BL-044.

#### BL-137 Welcome screen for v1.0
- Status: done (`src/app/onboarding.tsx`, D-043).

#### BL-041 Story intro
- Status: deferred (FUTURE G-07; D-043).

#### BL-042 Recording and saving the first letter
- Status: superseded (by BL-130 and BL-142).

#### BL-130 Recorder session and atomic save [Critical]
- Status: done in code (3bf45a0, `src/lib/capture/recorder.ts`: draft row before recording, stop and save on background, interruption and dismiss; `sweep.ts` recovery). Device kill test: BL-135.

#### BL-134 Launch sweeps and integrity checks
- Status: done in part (`capture/sweep.logic.ts`: orphan audio and draft recovery). Remainder ready for agents: `PRAGMA integrity_check` after an app update and weekly; local file cleanup for letters tombstoned over 30 days.

#### BL-136 Local schema for per-person settings, dictionary, versions, first-run batch
- Status: done in part (local `entries`, `children`, `drafts`, `orphan_audio`, `sync_outbox`, `rejected_writes`, `sync_books`; first-run batch through `create_first_run_children`). Remainder (local dictionary terms and per-member prefs) deferred (v1.2, CVL-03).

#### BL-135 Kill-during-save device run (500x)
- Status: needs-founder (FT-22, then every release candidate FT-39). qa-e2e is writing the device script (`docs/qa/`).

#### BL-033 Minimal first-run profile
- Status: done (`src/app/onboarding.tsx`: name, birthday or due date, signature, spoken language; first-run children free, D-007).

---

## M3. Transcription in a release build

#### BL-043 On-device transcription spike and the 14-recording experiment [Critical]
- Status: needs-founder (FT-21 recordings on the Mac, FT-22 device spike on SE 3, a 12 and a current iPhone). Decides the default tier per phone and feeds D-031 (Hindi script default, due Fri 30 Oct).

#### BL-140 Audio decode module [Critical]
- Status: done in code (9be06db, `modules/scribe-audio`: `probe`, `decodePcm16` in memory, `sha256File`, `enhance`). Device contract check in FT-22.

#### BL-141 Whisper engine v2 [Critical]
- Status: done in code (`src/lib/transcribe-whisper.ts`, `transcribe-plan.ts`, `models/whisper-runtime.ts`: Silero VAD, chunk planner, per-chunk decode with the dictionary prompt; no more `decoder-missing`). Speed, memory and heat per language are unmeasured until FT-22 (TDD 10 risk 1).

#### BL-142 Transcription queue and voice-only save [Critical]
- Status: done (9be06db, `src/lib/transcription-queue/`).

#### BL-143 Model manager [High]
- Status: done in code (9be06db, `src/lib/packs/engine.ts` and `models/catalog.ts`: Range download, SHA-256 against the signed manifest, Application Support excluded from backup, Wi-Fi rule, Settings > Storage). Hosting is BL-337 (Q-001).

#### BL-144 Transcription persistence and alignment column
- Status: deferred (v1.1, FUTURE CVL-20 with BK-01; D-059 moves word highlight to v1.1). Verified: no migration adds `entries.alignment` yet.

#### BL-145 Word alignment projection and quality gate
- Status: deferred (v1.1, CVL-20).

#### BL-148 Author edits keep the version-replay invariant
- Status: ready. Mode: agent. Owner: speech engineer. Scope unchanged (TDD 01 X-8).

#### BL-147 Golden-audio corpus v1
- Status: deferred into FUTURE CVL-02 and CVL-05 (scripted recordings from paid native-speaker reviewers). The v1.0 part is BL-043 plus the per-language spot check in FT-27 and FT-34.

#### BL-146 Suggestions UX in Review
- Status: deferred (P1; FUTURE CVL-03 uses the same suggest path).

---

## M4. Book, export, reminders, settings

#### BL-022 Remote config and kill switches
- Status: superseded (by D-068: one signed config document per ADR 0016, built in `src/lib/remote` and `supabase/functions/config`; the `app_config` table is not built). The app trusts nothing until the founder's signing key ships (BL-335).

#### BL-034 Child switcher and per-child local scope
- Status: done (`src/components/child/child-switcher.tsx`, "Whose book" copy in `packages/content`).

#### BL-035 Per-child settings
- Status: done in part (`src/app/settings/children/[id].tsx`, `new.tsx`). The undo for "Hide this book", `unhideChild` (`apps/mobile/src/lib/store.ts:340`), has no caller in any screen on develop at 8301ac8; PR #361 (P6d, Show this book again) adds one and was open on 28 Oct. Done once #361 merges.

#### BL-023 Ask sequencer and analytics consent sheet
- Status: done (mobile-polish, this wave: `src/lib/analytics/ask-sequencer.logic.ts` with `ask-sequencer.logic.test.ts`, `src/components/consent/consent-ask.tsx` mounted in `_layout.tsx`, the sheet on `ui/Sheet`). The sequencer lives in the app's `.logic.ts` layer, not `packages/core`; that is enough for v1.0.

#### BL-150 Offline export (ZIP and PDF) [Critical]
- Status: done (9be06db, `src/lib/export/`: streaming ZIP with manifest and SHA-256, PDF book per child, offline, free in every plan state). Known limit: no ZIP64, so one export stops at 3.9 GB (`pack.ts`), about 17 years of audio; splitting is FUTURE BK-17.

#### BL-151 Notification planner and local reminders [High]
- Status: done (9be06db, `src/lib/reminders/`: planner, scheduler, priming sheet; names on the lock screen off by default, D-025).

#### BL-157 Lock-screen-safe notification copy
- Status: done (`packages/content` lock-screen strings; Settings > Reminders toggle).

#### BL-154 Read together free sessions per book
- Status: done (`src/lib/read-together.ts` with `billing/plan.logic.ts`: count per book on the device; remote config may only raise the reviewed 3, ADR 0013).

#### BL-160 Book and Read together release pass
- Status: done for v1.0 scope (`(tabs)/book.tsx`, `read-together.tsx`: month chapters, playback without word highlight). Word highlight: FUTURE BK-01 (v1.1, D-059).

#### BL-156 Content and localisation debt
- Status: done in part (feature copy moved into `packages/content`, brand-content wave). Remainder ready for agents: plurals and dates through one helper in `packages/core` (Hermes has no `Intl.PluralRules`, ADR 0014, so plurals need a small rule table), `caps` style instead of `.toUpperCase()` (mobile-polish is doing the caps part).

#### BL-158 Help: "If you are struggling" row
- Status: done (Settings > Help disclosure with 988 Lifeline and Postpartum Support International, `strings.en.ts` `struggling`). The founder confirms the two resources are current (FT-36); counsel sees the wording in the package.

#### BL-159 Settings information architecture
- Status: done (`src/app/settings/index.tsx`: Account, Plan, Children, Spoken language, Reminders, Appearance, Privacy, Export, Recordings, Storage, Delete account, Help, If you are struggling, Terms, Privacy Policy, Licences, About; every row within 2 taps).

---

## M5. Account, sync, co-parent

#### BL-050 Keep-the-book sheet with notice and terms
- Status: done (`src/app/review.tsx` offers sign-in after the first letter; `(auth)/sign-in/` index, email, code, verify and consent screens; Later keeps everything local).

#### BL-170 Secure session, deep links and invite tokens [High]
- Status: done (`src/lib/supabase/secure-storage.ts`, `family/pending-invite.ts`, `+native-intent.tsx`).

#### BL-172 Auth configuration as code [High]
- Status: done as documentation (`docs/ops/AUTH_SETUP.md`); dashboard values are FT-12.

#### BL-171 Sign in with Apple and token capture [Critical]
- Status: done in part (9be06db, `src/lib/auth/apple.ts`: native sign-in with a hashed nonce). Token capture is not built; it is BL-330.

#### BL-051 Email link and code sign-in
- Status: done (`src/lib/auth/email.ts`, `(auth)/sign-in/email.tsx`, `code.tsx`, `verify.tsx`).

#### BL-054 Sensitive-data consent screen
- Status: done (`(auth)/sign-in/consent.tsx`, `src/lib/auth/consent.ts` accept, decline and withdraw; server gate `SCCON`).

#### BL-175 Visibility migration: `book_access`, approvals, leave and remove
- Status: deferred (v1.2 with FUTURE FAM-01; D-055). For v1.0 co-parents read through `book_entries` (`20261003000000`); db-followup adds `leave_child` and `remove_child_member` (BL-331).

#### BL-173 Sync design and server RPCs
- Status: done (D-023 decided; 5452c7a, `20261004100000_sync_engine.sql`: `sync_pull`, `sync_push`, `sync_books`, op receipts, rate windows, restore epochs). Security-review findings on rate windows and op receipts are in BL-331.

#### BL-174 Sync client [Critical]
- Status: done (5452c7a, `src/lib/sync/`: outbox, cursor pull, `rejected_writes`, consent pause, sign-out guard). The two-phone p95 check is BL-177.

#### BL-052 Re-own local letters on sign-in
- Status: done (`src/lib/sync/ownership.ts`; a second account gets `AccountMismatchError`, nothing changes).

#### BL-176 Co-parent invite in the app
- Status: done (9be06db, `src/app/invite/new.tsx`, `invite/index.tsx`, `src/lib/family/`).

#### BL-444 A book this phone has left stays readable under "Letters to {child}" (D-113) [High]
- Status: ready, needed before build 3. Mode: agent. Owner: family owner, sync owner.
- Satisfies: PRD V2 F11 6.2 D step 4, F11-REQ-011, DATA-REQ-016.
- Scope: after `leave_child`, `src/lib/sync/merge.ts` marks the book `left` and `src/lib/db/repos/children.ts` (`LISTED`) hides it, so the leaver's own letters stay on the phone with no screen. List left books under "Letters to {child}" with read, export and delete. Then set `LEAVE_BOOK_OFFERED` in `src/lib/family/entry.logic.ts` and bring the Leave row back (F11 6.2 D step 1), with a variant the lamp rule allows on that screen.
- Why: D-113 hides Leave in build 2 until this ships (PR #184).

#### BL-445 Typed invite codes: a code-registration route, the S04 client and #306's fix list (D-120) [Critical]
- Status: blocked (after the alpha, needed before the App Store release: build 2 invites are link-only, D-120). Mode: agent. Owner: data architect (S02, the route, #306 and the alert), family owner (S04, the client).
- Satisfies: F11-REQ-001 (Show code), F11-REQ-002, F11-REQ-007 (with its alert), A-REQ-029 (the code field).
- Scope: (1) a code-registration route: the device makes the 8-character code (`packages/core/src/invite.ts` has the helpers; the app does not use them yet) and the server stores its HMAC under `INVITE_CODE_PEPPER`, which only the Edge Functions hold, so `create_child_invite` stops getting `p_code_hash` null (`CreateInviteArgs` in `packages/api/src/server/family.ts`, `apps/mobile/src/lib/family/invites.ts`). (2) PR #306 (`invite_redeem_by_code`) resumes with the fix list on the PR (issuecomment-6460527733) worked through before any merge. (3) The S04 client: Show code on the invite sheet and a code field on the join sheet that redeems through `invite-redeem` (`INVITE_REDEEM_PATH`), with the words in `packages/content`. (4) The F11-REQ-007 alert: when code redemption reaches the global limit (1,001 failed codes in an hour across devices) and answers `SCRAT` for everyone, an alert fires within 15 minutes, and links keep working.
- Why: D-120. Until this ships those four P0 lines are unmet on the phone, and the F11-REQ-007 alert is not built (#306's hold comment).

#### BL-178 Profile settings and shared dictionary terms
- Status: deferred (v1.2, CVL-03).

#### BL-177 Cross-device two-phone test
- Status: needs-founder (FT-22, two phones). The CI stack part waits for BL-275 (qa-e2e).

#### BL-024 Server business aggregates
- Status: done (9be06db, `20261004300000_insights_aggregates.sql`, k = 10). Plus totals: superseded (D-053; App Store Connect reports only).

#### BL-330 Apple refresh-token capture at sign-in (new) [Critical]
- Status: in review (PR #139, stream S01; deploy needs FT-11 secrets and migration 20261004200000 applied). Mode: agent (deploy needs FT-11 secrets). Owner: security engineer. Size: S to M.
- Satisfies: A-NFR-011, DATA-REQ-019, Apple guideline 5.1.1(v) (revoke Sign in with Apple tokens on account deletion); `docs/ops/SECURITY.md` section 5.
- Scope: an `apple-token` Edge Function that takes the one-time authorization code after native Apple sign-in, exchanges it at `https://appleid.apple.com/auth/token` with a 10-minute ES256 client secret, wraps the refresh token with `wrapAppleToken()` (`supabase/functions/purge-worker/lib/apple.ts`) under `TOKEN_KEK_V1`, and stores it through `ops_apple_token_put`; the app calls it once after sign-in; ADR 0017 envelope, request id, rate limit, content-free log; Deno tests with fake keys. Until it ships, deletions of Apple users finish with `apple: no_token` and an `apple_no_token` alert.
- Needed before Sign in with Apple reaches anyone outside the founding family (C1, Mon 19 Oct).

#### BL-331 Membership and sync hardening migration (new) [Critical]
- Status: in-progress (db-followup: `supabase/migrations/20261005000000_family_cap_language_idempotency.sql` builds and applies; its own tests and the APPLY.md section are next). Needs founder OK on D-069 (FT-04).
- Scope (security review H2, M1, M5, L1, L2 and D-069): at most two parents per book (`SCCAP`) in both invite RPCs; `accept_child_invite` requires the inviter to still be a parent of a live book; a member's open invites are revoked when they leave or are removed; contributors cannot read `children.date_of_birth` or `due_date` (D-039); `remove_child_member` and `leave_child`; the pull digest computed over the caller's readable rows only (M5); `sync_op_receipts` keyed by `(profile_id, op_id)` (L1); photo update checks book membership (L2); access-matrix rows; regression tests from the review's PoC steps.

#### BL-332 Idempotency keys and server rate limits (new)
- Status: in-progress (db-followup, same file). Satisfies: D-067, ADR 0017 rules 3 and 4; security review M3: the sync counter not client-writable, a shared `consume_rate()` on `record_policy_act`, `delete_entry`, `restore_entry`, `accept_child_invite`, `create_child`, `request_account_deletion` and `sync_books`, `p_rendered_sha256` capped at 32 bytes, acceptances capped per profile per day.

#### BL-333 `entries.language` column (new)
- Status: in-progress (db-followup, same file). L4; for per-letter language later (CVL-07) and export.

### Security review follow-ups (`docs/reviews/2026-10-04-security-privacy.md`)

The review found no Critical issue and three High ones. H2, M1, M3, M5, L1 and L2 are in BL-331 and BL-332; H3 is BL-330. The rest:

#### BL-347 Email sign-in link cannot sign a phone into someone else's account (review H1) [Critical]
- Status: in review (PR #139, stream S01; ADR 0023 proposed; device check AUTH_SETUP 11.10 open). Mode: agent (auth code: independent review run and `approve-migration` label once BL-005 is on). Owner: auth owner, sync owner. Size: M.
- Satisfies: A-REQ-023, LEGAL-REQ-024, LEGAL-REQ-026; TDD 04 3.1.
- Scope: accept an opened link only while this phone has a pending request from this session (`getPendingEmail()` or a persisted request nonce), otherwise route to "type the code"; refuse a link while a different account is signed in; never run `takeOwnership` on `SIGNED_IN`: run it only after consent, behind a screen that shows the masked account email and needs a tap; then move to Supabase PKCE for email links (`flowType: 'pkce'`, template change in `supabase/templates/magic_link.html` and FT-12). Tests for the attack in H1's five steps.
- Needed before C1 (Mon 19 Oct): a phishing link would otherwise upload a family's letters to an attacker's account.

#### BL-322 Invite asks before it joins, and never switches the open book by itself (review H2, app part) [High]
- Status: in review (#184; `peek_invite` is on develop with #140). Mode: agent. Owner: family owner.
- Scope: `src/app/invite/index.tsx` shows "Join this book as a parent?" and "Invited by {inviter}" and waits for a tap; `peek_invite` returns only the inviter's sign-off and the role, never the child's name or ids (D-111 item 8), so the child's name appears only after joining; never `setActiveChildId` on join without a tap. Copy in `packages/content`.

#### BL-348 Invite token in the URL fragment (review M2; FAM-04 parts 1 and 2 pulled forward)
- Status: decided (founder, 15 Oct 2026, FT-04 item 7: yes, the token moves into the fragment). App part done (#165, merged 23 Oct 2026); website in review (PR #144). Mode: agent plus website thread.
- Decision: links are `https://earlyletters.com/j#t=<token>` (the `/j` path of PRD V2 F11 and B-NFR-002, not `/i#t=`), and `/i/<token>` is neither written nor accepted, with no 7-day overlap: no build has shipped, so no `/i` link exists. App: `fix/invite-link-fragment`. Website (`/j` page, AASA `/j` without `/i/*`): PR #144. Release gate (build 2 preflight fails while the app writes `/i/`): PR #145. Privacy Policy 1.4.0 already dropped the "servers don't log it" claim (privacy-policy.md CN-23); restoring it once this ships is counsel's call (COUNSEL_PACKET Q23).
- Scope as shipped in the app (#165): `inviteUrl` writes only `https://earlyletters.com/j#t=<token>`. A system link and a pasted link give a token only from the fragment's `t`, never from the path or the query, and `/i/<token>` is refused everywhere (`apps/mobile/src/lib/family/invite-link.logic.ts`; `test/invite-link.test.ts`, `test/deep-link.allowlist.test.ts`). E2E-13 reads the `/j#t=` link from the pasteboard (`e2e/bin/run-coparent.sh`). Website: the `/j` page and the AASA entry for `/j` without `/i/*` (PR #144).

#### BL-349 App-level privacy manifest (review L7) [High]
- Status: in review (PR #211, founder merge: `app.config.ts`; #145 merged 23 Oct). Mode: agent. Owner: mobile engineer. Built: `src/lib/privacy-manifest.ts` (required reasons for every build; collected data types follow `EXPO_PUBLIC_SERVER_FEATURES`, `EXPO_PUBLIC_BACKUP` and `EXPO_PUBLIC_STATUS_REPORT` as S17's label 1.4.0 answers them), `test/privacy-manifest.test.ts`, preflight checks of the generated file. Left: Apple's upload email (go/no-go B1-10), the archived `.ipa` check, and the S17 and counsel calls listed in the PR.
- Satisfies: LEGAL-REQ-043. Scope: `ios.privacyManifests` in `app.config.ts` covering React Native's required-reason APIs and `whisper.rn`; inspect `PrivacyInfo.xcprivacy` in the archived build before C1 so the upload does not fail ITMS-91053.

#### BL-323 Export carries consent history and dictionary terms (review L4)
- Status: done (PR #161, merged as 4651256; comment follow-up in PR #463). Mode: agent. Owner: export owner. Satisfies: LEGAL-REQ-034. Scope: add the person's `policy_acceptances` (through `my_policy_state` and own rows) and dictionary terms; use the real membership role instead of `'parent'`. Recently deleted letters moved to BL-388 (CR-35). The offline gap is BL-528.

#### BL-528 An offline export carries the consent record, or LEGAL-REQ-034 says it cannot [Medium]
- Status: needs-decision (Chief Privacy Officer: which option; options (b) and (c) change legal text, so they go to the founder through the gate). Mode: agent. Owner: export owner, privacy engineer. Satisfies: LEGAL-REQ-034 ("Works offline from local data"). Raised by: Reviews A and B of PR #456 (CCO-4).
- Problem: after BL-323 (PR #161) the export reads the person's consent record from the server; offline, `consent_history.status` is `unavailable` and the record is missing, while LEGAL-REQ-034 asks for consent history and an export that works offline from local data.
- Options: (a) keep a local copy of the person's own `policy_acceptances` rows after each successful read (L2 and L3, own rows only; a DATA_CLASSIFICATION row and a deletion path with it) and export that copy, marked with when it was read; (b) amend LEGAL-REQ-034 to say the consent history needs a connection; (c) both, (a) now and the wording in (b) for the gap before the first read.
- Done when: the chosen option is recorded; for (a), an export taken offline after one signed-in read holds the record and says when it was read, with a test.

#### BL-324 Native modules never crash or hang on bad input (review L9)
- Status: ready. Mode: agent (device check FT-22). Owner: speech engineer, payments engineer. Scope: clamp and `isFinite`-check times in `ScribeAudioModule.swift` `samples()`; `PlusStoreSheet.swift` resumes its continuation once when UIKit refuses the presentation.

#### BL-529 Export carries the person's own profile fields [Medium]
- Status: done (PR #469, merged as 985ed66). Mode: agent. Owner: export owner. Satisfies: LEGAL-REQ-034 ("profile fields"). Raised by: Review B of PR #161.
- Scope: `account.json` gains `profile` (export schema 1.4.0): the signed-in person's own `profiles` row (`display_name`, `signs_as`, `created_at`), read while the export is made, with a `status` like `consent_history`. The two server reads fail apart. Left out on purpose: `updated_at` and `first_run_closed_at` (L2 system timestamps; the class's export rule includes L2 only where useful). The phone keeps no copy, so an offline export says `unavailable`, the same offline gap the consent record has (BL-528).
- Done when: the export carries the profile when signed in, and says why when not; `supabase/tests/export_profile_read.test.mjs` runs the exact column list as a signed-in person.

#### BL-325 Remote documents cannot be held stale (review L10)
- Status: ready. Mode: agent. Owner: platform. Scope: ignore a same-version document with a different body; treat kill-switch config older than N days as stale (`notAfter` or `generatedAt`); act on `forceReauthEpoch` by signing out locally (review L3).

#### BL-326 Insights increments each pass k (review L12)
- Status: ready. Mode: agent (`approve-migration`). Owner: analytics engineer. Scope: publish `first_letter` increments (day 1, days 2 to 7, days 8 to 30) each through `k_part`, or suppress a difference below k.

Accepted or tracked elsewhere: L5 (analytics-forget may delete any 21 random ids a day: accepted, note in TRACKING_PLAN), L6 (Expo build-tool advisories: track Expo's fix; `npm prune`), L8 (`search_path` order: new functions use `pg_catalog, public`), L11 (Google nonce: accepted trade-off, AUTH_SETUP 3.4), M4 (email code brute force: FT-04 item 8 decides code length and life; the detection job is BL-248). Residual: confirm Supabase statement logging is off (FT-10).

---

## M6. Family contributors in the app

Deferred as a block by **D-055** (co-parent only at v1.0). Each moves to FUTURE FAM-01 (v1.2) unless noted.

| BL | Task | Status |
|---|---|---|
| BL-190 | Invite redemption function with rate limits | deferred (v1.2, FAM-01 and FAM-04; D-055) |
| BL-191 | Contributor first run in the app | deferred (v1.2, FAM-01; D-055) |
| BL-192 | Approvals | deferred (v1.2, FAM-01 core, FAM-02 extras; D-055) |
| BL-193 | Leave and remove with letter retention | server functions in progress (BL-331); app flows deferred (v1.2, FAM-01 and FAM-11) |
| BL-194 | Family can read and per-child sharing | deferred (v1.2, FAM-01; D-055) |
| BL-195 | Visibility matrix and cross-child leak tests | v1.0 roles covered by the access matrix (BL-116); contributor matrix deferred with FAM-01 |
| BL-196 | Family-letter push without content | deferred (v1.1, FAM-17; v1.0 has local reminders only) |

---

## M7. Shared voice

Superseded for v1.0 by **D-059** (no audio upload in v1.0; family hearing each other's recordings is v1.1). The design moves to FUTURE FAM-03 (v1.1), which reuses these scopes.

| BL | Task | Status |
|---|---|---|
| BL-200 | Audio key scheme and format | superseded for v1.0 (D-059); FAM-03 |
| BL-201 | Audio blobs, bucket and upload policy | superseded for v1.0 (D-059); FAM-03 (the server Plus check it named is also gone, D-053) |
| BL-202 | Upload queue on the phone | superseded for v1.0 (D-059); FAM-03 |
| BL-203 | Member playback and deletion propagation | superseded for v1.0 (D-059); FAM-03 |
| BL-205 | Shared-voice copy and legal alignment | superseded for v1.0 (D-059); FAM-03 (copy already says recordings stay on the phone, D-033) |
| BL-206 | Wrap-key custody | superseded for v1.0 (D-059); FAM-03 |

---

## M8. Plus through the App Store

D-053 (founder, 3 Oct): Apple only, on the device; no server sees purchases; no RevenueCat; no App Store Server Notifications. The server half of this milestone is superseded.

#### BL-036 Plan rules engine
- Status: done (3bf45a0, `packages/core/src/plan.ts` and `test/plan.test.ts`; `FreeForever` features cannot be gated).

#### BL-215 Mobile plan module
- Status: done (9be06db, `src/lib/billing/` and `modules/scribe-store`: `currentEntitlements`, `Transaction.updates`, restore, manage, refund; cached snapshot offline).

#### BL-216 Plus sheet [High]
- Status: done (9be06db, `modules/scribe-store/ios/PlusStoreSheet.swift`: Apple's `SubscriptionStoreView`, `.buttons` style, no preselection). The dev shortcut in `components/child/plus-gate.tsx` exists only when `devShortcutsAllowed` (development builds); the release-bundle grep is in BL-117.

#### BL-219 Settings > Plan
- Status: done (`src/app/settings/plus.tsx`: status and dates, Manage, Restore, Request a refund).

#### BL-220 Account deletion billing step
- Status: done (deletion step 1 says deleting the account does not cancel Plus; nothing else to remove, D-053).

#### BL-221 Keep-and-leave end-to-end run [High]
- Status: blocked (BL-275, in progress with qa-e2e).

#### BL-222 Sandbox checklist on device
- Status: needs-founder (FT-09 sandbox testers, FT-22 first run, FT-39 every release candidate). Checks D-1 to D-12 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11.

#### BL-342 Plan reminders on the device, the trial timeline and "Save a copy" (new; FUTURE G-12 pulled into v1.0) [Critical]
- Status: ready. Mode: agent. Owner: payments engineer (`src/lib/billing`), reminders owner. Size: S (about 2 to 3 engineer-days, Q-003 memo).
- Why v1.0: Subscription Terms 1.4.0 ("Receipts and reminders") and in-app disclosures 1.4.0 now promise that the app reminds before a trial ends, before an annual renewal and once a year, and shows what was agreed right after subscribing with a button to save a copy. Without this task those sentences are false at launch. Legal-alignment's position memo (`docs/legal/memos/q-003-subscription-notices.md`) is the default unless counsel objects by Fri 23 Oct (FT-33).
- Satisfies: LEGAL-REQ-046 to -049 as amended by legal-alignment; D-022 windows (kept as data); replaces BL-212 and BL-218.
- Scope: on phones where the subscription is `purchased` (not `familyShared`), schedule local notifications and an in-app card at the D-022 targets from `currentEntitlements` expiration, `RenewalInfo.willAutoRenew` and the introductory-offer type; recompute on every launch and every `Transaction.updates` event; cancel when auto-renew is off; a trial timeline in the store view's marketing content; after purchase, a confirmation sheet with the renewal terms, cancel-by date and how to cancel, and "Save a copy" through the share sheet (nothing leaves the phone). Pure planner with tests (leap day, 31-day months, DST, trials of 31 and 32 days, cancel after scheduling). Copy in `packages/content`. Device check in FT-39.

| BL | Task | Status |
|---|---|---|
| BL-210 | expo-iap spike | superseded (D-053; `expo-iap` removed in a66376a; Apple's store view through `scribe-store`) |
| BL-211 | App Store Server API and JWS in Deno | superseded (D-053) |
| BL-212 | Notice windows as data | superseded (D-053; no server); replaced by BL-342 |
| BL-213 | Billing migration and Plus rules on the server | superseded (D-053; `20261004000000_plus_on_device_only.sql` drops the tables) |
| BL-214 | App Store notifications endpoint, `sync_plan`, reconcile | superseded (D-053) |
| BL-217 | Purchase consent records | superseded (D-053; D-049 has no server to apply to; counsel question in Q-003) |
| BL-218 | Notice scheduler and emails | superseded (D-053); replaced by BL-342 |

---

## M13. Reminders, nudges and photo moments

Added 1 Nov 2026 by the reminders design effort (two product, two research, two design agents, ruled on by Karma). The design is `docs/design/NOTIFICATIONS.md`; the copy inventory is `docs/design/notifications/COPY_INVENTORY.md`; the setup journey is `docs/design/notifications/SETUP_JOURNEY.md`; the parent study is `docs/design/notifications/PARENT_STUDY_PLAN.md`; the evidence, with its grades, is `docs/research/NOTIFICATION_EVIDENCE_2026-11-01.md`. Spec: `docs/prd/v2/features/F13-prompts-reminders.md`. Nothing in this section has run on a phone.

**What every agent on this section must hold to**
1. **Reminders are local.** They are scheduled on the phone with expo-notifications (planner `apps/mobile/src/lib/reminders/planner.ts`, pure and tested). v1.0 has no remote push: nothing asks for a push token and `app.config.ts` strips `aps-environment`. Remote push is BL-546 and waits for servers (D-121). Do not add the entitlement or a token request in any other task.
2. **Quiet window.** Nothing between 21:30 and 07:00 local (C-NFR-001, F13-REQ-019). One notification a day at most. A month or birthday message replaces that day's evening nudge. A new type replaces a slot; it never adds one.
3. **Names stay off the lock screen** unless "Names in notifications" is on (D-025). Every row has a neutral variant, and the neutral one is the default. Festival names show only behind their own switch (BL-542). No letter text, ever.
4. **The machine adds no meaning.** A photo is only what the parent picked. Never describe, caption, classify or guess from a photo; never read the library, including dates and counts; no scanning for trips or faces. Use the system picker. The library-reading "Tier C" in the copy inventory is not approved for any release. "Trip" appears only if the parent typed that label.
5. **Traditions are chosen, never inferred.** No default selection. No religion from a region, a name or a language.
6. **Copy** lives in `packages/content` only after every row passes `npm test` there (titles 40 characters at most, bodies 110, no exclamation marks, nothing on the fear, guilt, gap-count, AI, gender or internal-term lists). The inventory is a draft in `docs/` until then. No streaks, counts of days, "missed" or "it has been".
7. **Evidence honesty.** Mark each claim verified, vendor claim or unverified. The best notification time for new parents has no public evidence; 8:30 PM is a hypothesis. Do not quote a figure you did not open.
8. **Freeze.** Build 2 freeze is Tue 3 Nov 5:00 AM PT (13:00 UTC); after it only S0 and S1 fixes until the go/no-go on Mon 9 Nov (D-130). Tasks marked "1.0" (BL-530, BL-532, BL-535, BL-549) land before the freeze or move to 1.0.1; tasks marked "1.1" wait. BL-535 bumps `PROMPT_LIBRARY_VERSION` (3 today), so mind merge order.
9. **Hard seasons.** A visible, always-reachable stop for all reminders is a v1.1 requirement (BL-538 is the timed version, not the stop; the master switch in Settings is the stop for 1.0). A loss path is also a v1.1 requirement: after pregnancy loss or a NICU stay, a parent must be able to stop everything and change or remove a date in a few taps, and milestone, birthday and expecting-book reminders must not fire on a date the parent has removed. Nothing is inferred; the planner cannot know. In 1.0 the stop is the master switch in Settings (reminders off), and a wrong birth date can be edited from the birthday row in child settings (`settings/children/[id].tsx`, `DateEditor`), which moves the month and birthday messages with it; the per-child reminders switch is a second stop. Not run on a phone. The target for 1.1 is a stop that is one tap from wherever the parent is. Never a countdown, nothing tied to a due date, and a research participant who finds a notification distressing halts it for everyone.

### Version 1.0 (before the freeze, or 1.0.1)

#### BL-530 Weekly reminders default to Saturday, as F13 says [Medium]
- Status: done (PR #483, merged 1 Nov 2026; planner test fails on the old default). Mode: agent. Owner: reminders owner. Size: XS.
- Satisfies: F13 section 6 ("Weekly fires on Saturday at the chosen time", K-03). Found by: reminders design effort, 1 Nov 2026.
- Scope: `DEFAULT_WEEKLY_DAY` is 0 (Sunday) in `planner.ts`; the spec says Saturday. Set it to 6; update the table comment in `prefs.ts`, the settings screen default, and the tests that name the default. A phone that already stored a weekly day keeps it (the stored value wins).
- Done when: a planner test with no stored weekly day fails on the old code and passes on the new; no other default changes.

#### BL-531 Quiet hours are written once, not three times [Low]
- Status: deferred (low value until the window is configurable; ruled by Karma 1 Nov 2026; revisit when FUTURE-REMOTE-WINDOW lands, i.e. when remote config can narrow the window). Mode: agent. Owner: content, reminders owner. Size: XS.
- Satisfies: F13-REQ-019 (remote config may narrow the window inside 07:00 to 21:30, so no screen may hard-code it once that config exists).
- Scope: `reminderCopy.settings.quietHelp` says "7 AM and 9:30 PM" and the reminder card caps its time picker at 21:30 in code (`reminder-prime-ask.tsx`). Read both from the planner window (`DEFAULT_WINDOW`, `formatReminderTime`). Adding placeholders to a copy line means updating the per-surface placeholder lists in `packages/content/test/rules.test.ts`, so do it when the remote window config lands, not in the freeze. Until then the window is fixed at 07:00 to 21:30 and the text is true.
- Done when: changing `LATEST_MINUTES` in a test changes the help text and the picker limit; content tests pass.

#### BL-532 The reminder card names the child [Medium]
- Status: done (PR #484, merged 1 Nov 2026; source test pins `{child}` and the card render; device check is BL-533). Mode: agent. Owner: content, reminders owner. Size: XS.
- Satisfies: the founder's ask on 1 Nov 2026 to make the setup personal with the child's name. In-app only; the lock screen stays neutral (rule 3).
- Scope: change `onboarding.reminder.body` to use `{child}` (it has none today), add the placeholder to the `onboarding.reminder` entry in the `placeholders` field of `packages/content/test/support/copy-surfaces.ts` if the surface does not allow `child` yet (`rules.test.ts` only reads that list), and have the card fill it (it is shown only after a first letter, so a name exists). No new buttons. Copy presumes nothing about sleep or the household.
- Done when: the card shows the name in a screen test; content tests pass; the neutral lock-screen copy is unchanged.

#### BL-533 Reminders on a real phone, WP-F13-08 [High]
- Status: needs-founder (a device operator; see `docs/FOUNDER_TASKS.md`). Mode: human. Owner: qa engineer. Size: S.
- Satisfies: F13 device gate; `docs/qa/DEVICE_TEST_PLAN.md` S2-15.
- Scope: on a TestFlight build, check: a reminder five minutes ahead fires with the phone locked; the app open shows none; a time-zone change keeps the wall-clock time; denied then Open Settings then allowed starts reminders by itself; Focus modes; 60 pending reminders is within iOS's 64; the lock screen shows neutral words; a tap opens Tonight (evening) or the Book (month or birthday); a real birthday and month-day fire; the card answers (yes, pick a time, no reminders) each leave the right state.
- Done when: each item is recorded in the S2-15 row with pass or fail, and failures become BL tasks.

#### BL-534 No prompt repeats within 365 days (F13-REQ-004, WP-F13-07) [High]
- Status: needs-decision (D-130: this needs a local schema step, which after the freeze is an S0 or S1 fix only; founder or Karma to say 1.0 or 1.0.1). Mode: agent. Owner: mobile engineer. Size: M. Depends on: BL-530.
- Satisfies: F13-REQ-004 (gate).
- Scope: `AVOID_RECENT` is 10 in `packages/core/src/prompts.ts`. Keep a per-author, per-child prompt history (one row per local date shown or skipped) and make `selectPrompt` avoid keys shown in the last 365 days; say what happens when the pool is exhausted (F13 metrics: under 10% of evenings).
- Done when: the property test over a simulated two-year history shows zero repeats in 365 days.

#### BL-535 Twelve prompts for a book before the birth [Medium]
- Status: ready. Mode: agent. Owner: content. Size: S.
- Satisfies: F13-REQ-008 (at least 12 `before` prompts; 8 exist).
- Scope: four more `before` prompts in `packages/content/src/prompts.ts`, bumping `PROMPT_LIBRARY_VERSION` to 4. They assume no birth, name no due date, week, hour or feeling, and presume nothing about the family. Keys are new; no old key is reused.
- Done when: the `before` count test passes at 12 or more and all content rules pass.

#### BL-549 Doc fixes from the reminders review [Low]
- Status: ready. Mode: agent. Owner: reminders owner. Size: XS.
- Scope: F13 still says co-parent letter pushes are in v1.0; servers are off (D-121), so move that line to v1.1 and point to BL-546. In R1 (`docs/research/`), the Calm figure (40% set a reminder, "almost 3x" retention) is a vendor claim from Amplitude's own case study, not a first-party fact.
- Done when: both edits are made and nothing else changes.

### Version 1.0.1 and 1.1

#### BL-536 The reminder card offers a cadence and asks about bedtime [Medium]
- Status: deferred (1.0.1 or 1.1; founder's scope call, `docs/design/NOTIFICATIONS.md` section 7). Mode: agent. Owner: design systems, reminders owner. Size: M. Depends on: BL-532.
- Scope: per `SETUP_JOURNEY.md`: "About when does {child} fall asleep?" in rough bands (only the resulting time is stored), the cadence labels (Once a week, A few evenings a week, Every evening, No reminders), a time chip row seeded from the answer, the names switch (off), a live preview of the next real dates and words, the existing iOS pre-sheet, a confirmation and a denied variant. Test with five parents before keeping the sleep question (BL-547).
- Done when: screen tests cover every state; VoiceOver and Dynamic Type pass; the cap of two showings ever still holds.

#### BL-537 Back-off after unopened reminders (C-REQ-008) [Medium]
- Status: deferred (1.1; the planner header lists it as later). Mode: agent. Owner: reminders owner. Size: M.
- Scope: four unanswered reminders drop to weekly, four more leave only month-age messages plus one card with no numbers; any save restores (F13-U18).

#### BL-538 Pause for a while [Low]
- Status: needs-decision (S34 removed "Pause all reminders" as a duplicate of the master switch; a timed pause of 1 week, 2 weeks or until turned back on is a different thing). Mode: agent. Owner: reminders owner. Size: S.

#### BL-539 Copy inventory, tranche 1: evening ideas, curiosity, gratitude, sensory [Medium]
- Status: deferred (1.1). Mode: agent. Owner: content. Size: M. Depends on: BL-541.
- Scope: move rows EV, CU, GR, SE from `COPY_INVENTORY.md` into `packages/content`, neutral and named, each passing `npm test`. Read the "exactly as it came out" wording against VOICE.md first (it describes speaking, and sits near the Word for word promise).

#### BL-540 Copy inventory, tranche 2: month notes, age milestones, birthdays, seasons [Medium]
- Status: deferred (1.1). Mode: agent. Owner: content. Size: M. Depends on: BL-541.
- Scope: as BL-539 for the month, milestone (months 1 to 24), birthday and secular season rows; add an off switch for milestone rows inside "Month and birthday messages" for preterm and corrected-age families.

#### BL-541 Sequencing rules in the planner [Medium]
- Status: deferred (1.1). Mode: agent. Owner: reminders owner. Size: M.
- Scope: the ten rules in `COPY_INVENTORY.md` section 3 (consecutive notifications differ in shape; no shape twice in a row; type budgets) as table-driven planner tests. A new type replaces a slot (rule 2 above). Variants must not reshuffle when the cadence changes (rotation is indexed by ordinal today).

#### BL-542 Celebrations, opt-in [Medium]
- Status: needs-decision (the founder approves the list and the lock-screen line; `NOTIFICATIONS.md` section 7 item 4). Mode: agent. Owner: content, reminders owner. Size: L.
- Scope: a short list the parent picks from, default none; the parent confirms the date (lunar and Eid dates shift; we ship no date table that claims to know); the lock screen always says "A celebration today"; the festival name shows only behind a new "Show celebration names" switch, and both that switch and "Names in notifications" must be on for the named text (either off gives the neutral text); counsel and `privacy` sign off before it ships; Mother's Day, Father's Day and due-date items are out. Needs a settings string and a reviewer per tradition for the copy.

#### BL-543 Moments: a parent-set date and one nudge after [Medium]
- Status: deferred (1.1). Mode: agent. Owner: reminders owner. Size: M. Depends on: BL-541.
- Scope: "we are away 12 to 20 Dec" (a date range and an optional label the parent types). One local nudge follows. No permission needed. "Trip" appears only if the parent typed it.

#### BL-544 Up to five photos on a letter, from the system picker [High]
- Status: needs-decision (the founder's photo call, and the privacy and constitution check, `NOTIFICATIONS.md` section 5). Mode: agent. Owner: privacy engineer, mobile engineer. Size: L. Depends on: F46.
- Scope: system picker only (no library permission, no scanning); 0 to 5 ordered photos; a private copy kept with the letter; export carries them; deleting a letter deletes the copies; removing one never touches the parent's Photos app; no sync promise while servers are off. Confirm on a device that the picker needs no prompt and what metadata a picked file carries (GPS) before any copy is stored. Privacy label stays "Data Not Collected" only if nothing leaves the phone.

#### BL-545 Journaling Suggestions spike [Low]
- Status: deferred (later; counsel and privacy first). Mode: pair. Owner: mobile engineer. Size: M.
- Scope: Apple's Journaling Suggestions picker (iOS 17.2 or later, an Apple entitlement, a custom Swift module in Expo). Find out whether App Review grants the entitlement to a baby-memory app, and confirm that no notification can be triggered from it. Both are unverified.

#### BL-546 Remote push foundation [High]
- Status: blocked (servers are off in v1.0, D-121). Mode: agent. Owner: sync owner. Size: L.
- Scope: the `aps-environment` entitlement, token registration, a sender, consent text, the privacy label, and the co-parent letter push (F11, M14) inside the planner's budget and quiet window. Until this is ruled in, no other task adds the entitlement.

#### BL-547 Parent study: ten parents, two weeks [High]
- Status: needs-founder (recruiting, incentive, the diary form tool, and counsel's read of a one-page parent consent; at most 5 of 10 from the founder's close circle). Mode: pair. Owner: user researcher. Size: M.
- Scope: `PARENT_STUDY_PLAN.md`. Thresholds are written before the test. Adults only; no child is interviewed, photographed or named; stimuli are stock or synthetic.

#### BL-548 Throwaway TestFlight build for the diary [Medium]
- Status: blocked (after the go/no-go on Mon 9 Nov and BL-547's consent). Mode: agent. Owner: mobile engineer. Size: S. Depends on: BL-547.
- Scope: a preview-bundle build with a hidden screen that schedules seven local notifications from a bundled file. Never reaches production. Fallback: the founder schedules the messages by hand.

#### BL-550 Names-off property test over the inventory [Medium]
- Status: deferred (with BL-539). Mode: agent. Owner: qa engineer. Size: S. Depends on: BL-539.
- Scope: with "Names in notifications" off, no title or body of any planned notification contains any child's name; with the festival-name switch off, no title or body contains a festival name, whatever the names switch says; with a celebration row and both off, the lock screen says "A celebration today".

---

## M9. Privacy, deletion, disclosures, operations

#### BL-236 Operations tables migration [High]
- Status: done in part (9be06db and 5452c7a, `20261004200000_ops_deletion_worker.sql`: schema `ops`, `audit_log`, `alert_state`, `forget_quota`, `apple_tokens`; `20261003020000` purge batching and retry backoff). Rate limits are BL-332; `security_events` is not built (deferred with BL-248).

#### BL-232 Bucket registry and purge coverage
- Status: deferred (v1.1 with FAM-03; D-059: no uploads in v1.0). The purge worker already drains `storage_purge_queue` for any bucket and sweeps object ownership.

#### BL-233 In-app account deletion flow
- Status: done (5452c7a, `src/app/settings/delete-account.tsx`, `src/lib/account-deletion/`: export first, Plus notice, type to confirm, 30-day undo).

#### BL-234 Purge worker [Critical]
- Status: done in code (`supabase/functions/purge-worker`, `supabase/cron/purge-worker.sql`, Deno tests). Apple revocation completes only once BL-330 ships. Deploy and schedule: FT-11.

#### BL-235 Analytics deletion at request time
- Status: done in code (5452c7a, `supabase/functions/analytics-forget`).

#### BL-237 Runbook wrapper, DSAR log, support deletion
- Status: done in part (`scripts/ops/*` write `ops.audit_log` first and refuse without `--project-ref` and `--ticket`). Remainder ready: a `privacy_requests` log (a dated spreadsheet is acceptable at v1.0 volume, TDD 10 section 7) and `support_request_deletion`.

#### BL-238 Cross-system deletion verification script
- Status: done (5452c7a, `scripts/ops/verify-deletion.ts`). Run once on staging before C1 (FT-22).

#### BL-239 Network capture, consent gating and log canary [High]
- Status: done in part (log canary over both functions, `supabase/functions/_shared/log/canary.test.ts`). The proxy-based E2E part is blocked (BL-275).

#### BL-240 Sensitive-data withdrawal modes
- Status: done (`src/lib/auth/consent.ts` decline and withdraw keep letters on the phone; default mode `offer` until counsel answers OQ-L1).

#### BL-231 Privacy labels and manifest rendered from the data map
- Status: deferred (v1.1, T5-01). v1.0 labels are entered by hand from `docs/legal/app-store-privacy-labels.md` (legal-alignment is updating it; Q-005 decides Linked or Not linked) in FT-43.

#### BL-241 Security programme documents and runbooks
- Status: done in part (`docs/ops/SECURITY.md`; five runbooks in `docs/ops/runbooks/`). Remainder ready: `WISP.md` short form and a risk register (LEGAL-REQ-028).

#### BL-242 Health views, cron and alerts
- Status: done in part (`ops_schema_health()`; purge-worker SLA alerts, at most one email a day per condition). Remainder ready: an external uptime check on the RPC endpoint and a 5xx alert to the founder's phone.

#### BL-243 Static deletion and privacy-choices pages
- Status: blocked (website thread; D-042). `/delete-account` must be live before submission (FT-31).

#### BL-244 Value-free validation for content tables [High]
- Status: ready. Mode: agent (`approve-migration`). Verified: no such trigger yet.

#### BL-245 Device data-protection assertions
- Status: needs-founder (FT-22 device run).

#### BL-247 Server restore drill and ledger replay
- Status: needs-founder (FT-39; `docs/ops/runbooks/restore-drill.md`, `scripts/ops/restore-drill.ts` exist).

#### BL-248 Email-code abuse detection
- Status: deferred (v1.2, with T5-10 sign-in resilience).

#### BL-249 Session kill switch
- Status: deferred (drill after launch). The kill is documented: revoking the JWT signing key signs everyone out (SECURITY.md 2.5).

---

## M10. Opt-in analytics

#### BL-020 Typed analytics catalogue and allowlist
- Status: done (analytics wave: catalogue v2, TRACKING_PLAN 3.1 generated from code, 99 tests). Open counsel points: Q-004, Q-005.

#### BL-021 Crash and log scrubber
- Status: in-progress (mobile-polish, "Sentry decision"). Verified: no Sentry SDK and no `scrubEvent` yet. If Sentry ships in v1.0 (D-003), the scrubbers and the same consent switch come with it; otherwise v1.0 relies on Xcode Organizer and App Store Connect crash data.

#### BL-251 Consent version and pending acts
- Status: ready. Mode: agent. Owner: analytics engineer.

#### BL-250 Analytics wiring in the app
- Status: done (a66376a: `startAnalytics`, observers, screen views; PostHog loads only after consent, `src/lib/analytics/posthog-sdk.ts`). Needs the PostHog key in the EAS environment (FT-24).

#### BL-252 Analytics contract test with the real SDK
- Status: ready. Mode: agent. Owner: QA engineer.

---

## M11. Accessibility and design system

Built in the design wave (9be06db) and the integration wave (a66376a); mobile-polish is doing the consistency pass now. AX5 and VoiceOver device runs are FT-22 and FT-39.

| BL | Task | Status |
|---|---|---|
| BL-255 | Accessibility helpers | done (`src/lib/a11y.ts`) |
| BL-256 | Token additions including `destructive` | done (`packages/design-tokens/src/tokens.ts`) |
| BL-257 | Type tokens and `Text` variants | done (`components/ui/text.tsx`, tokens) |
| BL-258 | Fonts including Devanagari | done (Literata, Mukta; subsetting is an APP_SIZE cut) |
| BL-259 | Buttons with minimum heights | done (`components/ui/button.tsx`) |
| BL-260 | Text fields with announced errors | done (`components/ui/text-field.tsx`) |
| BL-261 | Choice groups, chips, segmented control | done (`components/ui/choice-group.tsx`) |
| BL-262 | Sheets | done (`components/ui/sheet.tsx`, `@gorhom/bottom-sheet` per ADR 0101 as amended) |
| BL-263 | Toggle and list rows | done (`components/ui/list-row.tsx`) |
| BL-264 | Persistent toast | done (`components/ui/toast.tsx`) |
| BL-265 | Uncapped letter text with script runs [High] | ready (verify no `maxFontSizeMultiplier` on letter text, D-027) |
| BL-266 | AX5 stacking pass on every P0 screen [High] | in-progress (mobile-polish), then device check FT-39 |
| BL-267 | Motion rules | done (`src/lib/motion.ts`) |
| BL-268 | Accessibility lint rules | ready |
| BL-269 | Component tests at default size and AX5 | blocked (BL-278) |
| BL-270 | Native tabs | ready (cut first if late) |
| BL-271 | Increase Contrast and Reduce Transparency variants | deferred (v1.1 or later; T5-20) |
| BL-272 | Recording-without-words state | ready |
| BL-273 | Accessibility statement | ready (content and legal; LEGAL-REQ-052) |

---

## M12. Beta and release engineering

#### BL-278 Component test harness
- Status: ready. Mode: agent. Owner: QA engineer.

#### BL-275 Maestro harness and nightly workflow
- Status: in-progress (qa-e2e, `apps/mobile/e2e/**`).

#### BL-276 E2E flows 01 to 04, BL-277 E2E flows 05 to 15
- Status: in-progress (qa-e2e), each blocked on its feature and BL-275.

#### BL-044 Device budget check
- Status: needs-founder (FT-22 first run, FT-39 every release candidate). Includes the 40 MB App Thinning check (`scripts/size/measure.ts --thinning-report`).

#### BL-279 Manual scripts and evidence
- Status: in-progress (qa-e2e, `docs/qa/**`: device test plan, VoiceOver script, evidence template).

#### BL-280 Beta programme setup
- Status: needs-founder (FT-25 C0 internal Wed 14 Oct and Beta App Review Thu 15 Oct; FT-26 recruit; FT-32 C1 Mon 19 Oct to Thu 29 Oct). The TestFlight build and store listing never say "beta"; the in-app "early version" note stays (D-060).

#### BL-282 Load test at 2x the 1k-family targets
- Status: deferred (after launch; `supabase/tests/perf.test.mjs` already proves server-side budgets at 1,000 families x 400 letters).

#### BL-289 Realistic database performance data
- Status: done (53e1a33 and later, `supabase/tests/perf.test.mjs`, `sync_perf.test.mjs`).

#### BL-284 Durability drill
- Status: needs-founder (FT-39: iCloud device backup then restore to a second phone; export ZIP and re-read; sign in on a new phone and re-download text).

#### BL-283 Release engineering and the founder checklist
- Status: in-progress (qa-e2e, `docs/ops/RELEASE.md`).
- Note (13 Oct, D-089): the one runbook is qa-e2e's `docs/ops/RELEASE.md`, ported from Line B to `develop` and amended for D-089 in #111. The release tooling and the v1.0 record are BL-436 to BL-439 (`docs/release/1.0.0.md`).

#### BL-288 Android CI build (parity watch)
- Status: deferred (FUTURE T5-16 readiness).

#### BL-286 Store listing and submission [Critical]
- Status: needs-founder (FT-43 approve listing, privacy answers, age rating, review notes; FT-45 submit). Listing source: `docs/store/app-store.md` and `packages/content/src/store.en.ts`; no beta wording (D-060); Lifestyle; United States only; age rating overridden to 18+ because the Terms require adults (qa-e2e, checked against App Store Connect help); both subscriptions attached to the version. Submit in the week of Mon 2 Nov 2026.

#### BL-335 Pack signing key in the app and the first signed publish (new) [Critical]
- Status: needs-founder (FT-16: `npx tsx scripts/packs/keygen.ts`, secret in the password manager only). Then agent: add the public key line to `packages/api/src/keys.ts` in a PR (needs an app build); then the coordinator runs `scripts/packs/publish.ts all` with the founder's OK (COORDINATION 6).
- Why critical: `keys.ts` ships empty, so the app trusts no remote config, no content and no pack (ADR 0016 4.2). Without it there are no kill switches in C1 (LEGAL-REQ-040) and no non-English language pack can install.

#### BL-336 iOS deployment target 17 (new)
- Status: in-review (D-098 answers Q-002, 15 Oct; config PR). Was: needs-founder (FT-04 answers Q-002). Then agent: `expo-build-properties` with `ios.deploymentTarget: '17.0'` (app.config.ts plugin; owner mobile-polish this wave); removes the iOS 16 branch of the Plus gate (ADR 0013).

#### BL-337 Pack and model hostname and uploads (new)
- Status: in-review for the hostname (D-097 answers Q-001: `packs.earlyletters.app`, 15 Oct; config PR); the bucket, domain and uploads stay founder steps (FT-16). Was: needs-founder (FT-04 answers Q-001; FT-16 creates the bucket and domain). Then agent: one hostname in `src/lib/models/catalog.ts` (`SELF_HOST_BASE` is `https://models.earlyletters.com/speech` today, while DOMAINS.md says `packs.earlyletters.com` and Q-001 recommends `packs.earlyletters.app`); the founder uploads the Hindi small model and text packs with the commands `publish.ts` prints, then `hosted: true` (ADR 0015 section 9 item 2).

#### BL-338 Policy versions for the beta (new) [Critical]
- Status: needs-decision (Q-009, founder with counsel). Without published `terms` and `sensitive-data` rows in `policy_versions`, every new account stops at "We couldn't finish setting up your account" (AUTH_SETUP 1.4, APPLY step 8.2), so C1 cannot sign in or sync.

#### BL-339 EAS project id and environment variables (new)
- Status: needs-founder (FT-17 `eas init` and EAS environment variables per profile: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_EMAIL_OTP_LENGTH`). Then agent: commit the `projectId` in `app.config.ts`. Verified: no project id in the config today.

#### BL-340 Store screenshots from the release build (new)
- Status: blocked (first preview build, FT-17). Mode: agent plus founder approval (FT-43). Owner: content. Tools: `scripts/brand/screenshots.mts`, `scripts/brand/capture-store.cjs`.

#### BL-341 App Review notes and demo account (new)
- Status: ready. Mode: agent drafts, founder enters. Owner: QA engineer, content.
- Scope: review notes from `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 plus the D-004 positioning (a family memory journal in Lifestyle; a due date is optional); how to reach Plus; a demo account on production seeded with the fictional family "Asha" and how the reviewer passes the 18+ gate.

#### BL-440 Store description matches the on-device v1.0 [Critical] (new, D-089)
- Status: ready. Mode: agent. Owner: content.
- Scope: `packages/content/src/store.en.ts`: the description says "Invite your co-parent to the same book. You each sign your own letters" and "Only you and the people you invite can read your book", and `whatsNewV1` says "write together with your co-parent". v1.0 shows co-parent sharing as coming soon (PR #54). Say what v1.0 does; regenerate `docs/store/app-store.md` and `apps/mobile/store.config.json`.
- Done when: a content rules case rejects invite and write-together promises in `storeListing` while server features are off for v1.0; nothing is pushed to App Store Connect before this lands (guideline 2.3.1).

#### BL-436 Version and store metadata as code (new, D-089)
- Status: in-review (branch `feat/release-version-metadata`). Mode: agent. Owner: platform (the release engineer role of D-090 until the `release` agent is on the roster, PR #112).
- Scope: `apps/mobile/version.json` read by `app.config.ts`; `scripts/release/store-config.ts` writes `apps/mobile/store.config.json` (EAS Metadata) from `packages/content`; tests for both and for drift.

#### BL-437 Store-lane release workflow (new, D-089)
- Status: in-review (branch `ci/release-ios-workflow`, stacked on BL-436). Mode: coordinator and founder (agents never edit `.github/`; the release engineer proposes changes under `docs/ops/proposed/release-*`); founder sets up the `app-store` environment and rulesets (FT-20). Owner: founder (the coordinator runs it).
- Scope: `.github/workflows/release-ios.yml`: `ios-v<x.y.z>-rc.<n>` runs checks then an EAS production build with auto-submit to TestFlight; a manual metadata job; `ios-v<x.y.z>` publishes the GitHub Release. Review contact from `ASC_REVIEW_CONTACT_JSON`; review notes from `storeListing.reviewNotes` (BL-341 finishes the text).
- Needs: production App Store Connect record, `submit.production.ascAppId`, `EXPO_TOKEN`, production signing credentials in EAS, BL-339.

#### BL-438 Release records (new, D-089)
- Status: in-progress (first alpha-era refresh of `docs/release/1.0.0.md` on branch `docs/release-record-alpha`, 27 Oct; then `ops` keeps it current twice a week). Mode: agent. Owner: platform (the release engineer role of D-090 until the `release` agent is on the roster, PR #112).
- Scope: keep `docs/release/1.0.0.md` current twice a week until release; one record per later version; `apple.copyright` once the founder confirms the holder.

#### BL-439 Release health watch (new, D-090)
- Status: blocked (first release). Mode: agent plus founder numbers. Owner: platform.
- Scope: day 1, 3 and 7 health report on the release issue (crash-free sessions and users from App Store Connect, open S0 and S1, pause or hotfix recommendation); `docs/ops/SLO.md` with the G5 thresholds.

---

## v1.0.1 (ship by Mon 7 Dec 2026)

Small items that can follow launch. (The plan reminders, first proposed here, moved into v1.0 as BL-342 because the Subscription Terms 1.4.0 promise them from the first purchase.)

#### BL-343 Review request at a meaningful moment (new)
- Status: ready. Mode: pair (adds `expo-store-review`). Detail: FUTURE G-03. After the fifth saved letter or the end of a first Read together; never in first run, recording, Review, export, the Plus sheet or on a birthday; once per app version.

#### BL-344 Redeem an offer code (new)
- Status: ready. Mode: agent (Apple's `presentOfferCodeRedeemSheet` through `scribe-store`). Detail: FUTURE G-16. Settings > Plan "Redeem a code"; founding-family codes are created once the app is Ready for Sale.

#### BL-345 Platform age signal for the 1 Jan 2027 laws (new)
- Status: needs-decision (counsel in November, FT-47: does California AB 1043 or Texas SB 2420 require a request from 1 Jan 2027). Detail: FUTURE T5-15. If yes: request the platform signal where the API exists, hold it in memory only (D-026), treat a minor signal as actual knowledge.

#### BL-346 Post-launch cost and loop switches (new)
- Status: needs-founder (FT-49). Supabase spend cap off after launch with billing alerts at 150% (T5-23); PostHog billing limit; the weekly insights run scheduled (T5-26, INSIGHTS_LOOP section 6; D-070: the agent writes files, the coordinator commits).

---

## After v1.0.1

Everything else is ranked in `docs/backlog/FUTURE.md` (v1.1 about mid January 2027, v1.2 about mid March, v1.3 about early May). The old v1.1 table maps there:

| BL | Was | Now |
|---|---|---|
| BL-300 | Web contribution page | FAM-05 (v1.2 recommended), on T5-17 |
| BL-301 | Hindi invite messages and Hindi web page | FAM-04 part 3, FAM-05 phase 2 |
| BL-302 | Google sign-in on iOS | done in v1.0 (D-054); account linking is T5-10 |
| BL-303 | 4-story intro | G-07 (onboarding experiment E1) |
| BL-304 | AI gateway: server transcription with consent | T5-07 (Later, on pm-1 evidence) |
| BL-305 | Name check | part of CVL-03 |
| BL-306 | Backup and restore; Vault mode | OPEN-02 (backup, owner open, Q-010) and T5-06 (Vault, Later) |
| BL-307 | Server-side Read together counter | superseded (D-053; Plus stays on the device) |
| BL-308 | Gift a year of Plus; dormant-payer email; trial experiment | G-10 (gift, needs a server grant), G-15 (trial length); dormant email superseded (D-053, G-13) |
| BL-309 | Server export | inside T5-04 |
| BL-310 | Web deletion flow before Android | T5-17 |
| BL-311 | Android with Google Play Billing | T5-16 and G-21; RevenueCat superseded (D-053), Play Billing per Q-008 |
| BL-312 | Load test at 2x the 100k targets | T5-23 trigger (before 25k families) |
| BL-313 | External penetration test | T5-03 (before paid marketing, the public TestFlight link or 1k families) |
| BL-314 | Photos under per-book keys; Face ID lock | CVL-10 on FAM-03's media pipeline; T5-14 |
| BL-317 | Second-provider copy of backup ciphertext | Later, with OPEN-02 |
| BL-319 | Nightly perf runs; monthly cost sheet | T5-23 |
| BL-320 | P1 items: sealed letters, multi-book invites, merge books, themes, photos, reminder back-off | BK-03, FAM-15, BK-19, CVL-10, G-11 |
| BL-321 | Hindi app UI | T5-19 |

Printed books stay a future launch (K-32; BK-13 and BK-14). The beta label leaves only when the founder ends the beta (D-011): one release removes the in-app "early version" note and Terms 16.4.

---

## Brand, email and web handoffs (BL-351 to BL-369; from the email and brand lane, 3 Oct 2026)

Source: branch `feat/email-brand-library`, the reviews in `docs/reviews/2026-10-03/`, the audit `docs/brand/CONSISTENCY_AUDIT.md`, decisions D-071 to D-081, and the activity record `docs/brand/activity/`. Ids BL-351 to BL-369 are reserved for this block. (They were drafted as BL-300 to BL-318, then BL-340 to BL-358, which the 4 Oct backlog consolidation took; the block moved to BL-351 to BL-369 on 4 Oct.)

**Assignment rule for this block (proposed for all tasks).** When an agent picks up a task, the PR that takes it changes the status line to `in-review (PR #n). Assignee: agent:<handle>, run <run id>`, so every task names the agent identity and run that did it. Founder tasks say `Assignee: founder`.

#### BL-351 Brand system: primary mark, asset registry, brand book
- Status: in-review (PR #48). Assignee: agent:design-systems, runs a84743e25427a87b5, ae4698bb9d7faf53f. Mode: agent. Owner: design systems. Milestone: M11. Size: M.
- Satisfies: D-071, D-072.
- Scope: `packages/brand` primary mark, `registry.ts` with `assetFor(context)` and tests, email logos, favicons, OG image, fonts for email; `docs/brand/BRAND_SYSTEM.md`.

#### BL-352 Email library and Supabase auth templates
- Status: in-review (PR #49). Assignee: agent:design-systems and agent:content, runs listed in `docs/brand/activity/2026-10-03.jsonl`. Mode: agent. Owner: design systems. Milestone: M5. Size: L.
- Satisfies: D-044, D-080, D-054; LEGAL-REQ on transactional email (see `docs/emails/COMPLIANCE.md`).
- Scope: `packages/emails` (components, 39 templates, render and Supabase export), `packages/content/src/emails`, `supabase/templates`, `docs/emails`.

#### BL-353 Copy and legal web drafts after the founder decisions of 3 Oct
- Status: in-review (PR #49). Assignee: agent:content and agent:legal. Mode: agent. Owner: content. Milestone: M9. Size: M.
- Satisfies: D-073 to D-081.
- Scope: `packages/content/src` (site, store, pages, strings), `packages/content/legal/*.md` (drafts, counsel review pending), glossary in `BRAND.md`.

#### BL-354 App icon and splash from the registry
- Status: ready. Mode: pair (needs a Mac for the Icon Composer file). Owner: mobile engineer. Milestone: M11. Size: S.
- Satisfies: D-071; audit CA-003, CA-004, CA-006.
- Scope: build the iOS 26 Icon Composer file from `icon.app.default`, `icon.app.dark` and `icon.app.tinted`; splash from `app.splash`; remove Expo scaffold images (CA-005); confirm EAS accepts icon paths outside `apps/mobile`.

#### BL-355 Brand fonts and type scale in the app
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M11. Size: M.
- Satisfies: audit CA-017, CA-018; DESIGN_LANGUAGE type scale.
- Scope: load Literata, Mukta and Tiro Devanagari Hindi with expo-font (subset); map headings to `tokens.type`; welcome screen uses the stacked lockup artwork (CA-007, D-079).

#### BL-356 Move app strings into packages/content and wire new keys
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M4. Size: M.
- Satisfies: CLAUDE.md content rules; audit CA-036; review CUS-03.
- Scope: move `pendingCopy` and permission strings into content; wire `en.settings.plan`, `en.settings.account`, `en.auth`, `en.coParentLeft`; rename `tidy*` keys to "Word for word" (D-074); microphone purpose string without "share with family"; hide v1.1 family screens.

#### BL-357 App reports subscription status to the server
- Status: ready. Mode: pair. Owner: payments engineer. Milestone: M8. Size: M. Depends on: BL-358.
- Satisfies: D-080 (narrows Brief decision 3), D-022.
- Scope: after StoreKit 2 entitlement checks, send plan, trial end, renewal date and cancelled flag only (no payment data, no receipts) through `packages/api`.

#### BL-358 Subscription status table and endpoint
- Status: ready. Mode: pair (founder `approve-migration`). Owner: data architect. Milestone: M8. Size: M.
- Satisfies: D-080; data map entry required (DATA-REQ-001).
- Scope: new migration and RPC per the `packages/api` contract; RLS tests; retention; privacy data map row. Platform coordinator area.

#### BL-359 Renewal and trial reminder scheduler
- Status: blocked (BL-358). Mode: agent. Owner: sync owner. Milestone: M8. Size: M.
- Satisfies: D-022, D-080; California B&P 17602 notices (`docs/emails/COMPLIANCE.md`).
- Scope: schedule `trial-*`, `annual-renewal-*` and `price-increase` emails from reported status; payers only; idempotent sends; suppression-safe (never put transactional mail on Resend's account-wide suppression list).

#### BL-360 Supabase Auth sends through Resend
- Status: ready. Mode: pair. Owner: security engineer. Milestone: M5. Size: S.
- Satisfies: D-044, D-054; `supabase/auth-email.md`.
- Scope: custom SMTP or Send Email Hook per the runbook; apply `supabase/templates`; sending-only Resend key for earlyletters.com; redirect allowlist; OTP 6 digits, 15-minute expiry.

#### BL-361 Send the new account emails
- Status: blocked (BL-360). Mode: agent. Owner: sync owner. Milestone: M9. Size: S.
- Satisfies: review CUS-04, CUS-14.
- Scope: send `coparent-left`, `deletion-confirm`, `passkey-added` and `new-device-sign-in` through the email hook with the React Email templates.

#### BL-362 Sign-in providers removed at account deletion
- Status: ready. Mode: agent. Owner: security engineer. Milestone: M9. Size: S.
- Satisfies: Apple 5.1.1(v); D-042; review LGL findings.
- Scope: revoke Apple tokens and unlink Google at deletion; reauthentication within 10 minutes before deletion (`docs/emails/SECURITY.md`).

#### BL-363 Website serves brand assets, email images and fonts
- Status: ready. Mode: agent. Owner: web lane (E3, BR2 in `docs/web/TEAM.md`). Milestone: M12. Size: S.
- Satisfies: D-072; handoff `docs/web/handoffs/2026-10-03-brand-and-legal-for-web.md` items 1, 2, 2a, 4.
- Scope: `/email/*`, `/fonts/*` with CORS and cache headers, registry-driven logo and OG image, security headers adapted to Next.js.

#### BL-364 Website legal and account routes
- Status: ready. Mode: agent. Owner: web lane (E1). Milestone: M9. Size: M.
- Satisfies: Brief decision 13; D-042; handoff items 3 and 5.
- Scope: `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/subscription-terms` from `packages/content/legal` with draft banner, noindex and a build guard against unfilled placeholders; `/delete-account`, `/delete-account/confirm`, `/cancel`, `/auth/callback` (never verifies the token) and the AASA file; "iPhone only for now" on `/open` for Android.

#### BL-365 Counsel review of the legal drafts
- Status: ready. Mode: human. Owner: founder. Milestone: M9. Size: M.
- Satisfies: `docs/legal/COUNSEL_PACKET.md` (open questions, including `coparent-left` and D-081).
- Scope: counsel sign-off, effective dates, versions; written no-training confirmation from Resend.

#### BL-366 Trademark clearance for the name and the mark
- Status: ready. Mode: human. Owner: founder. Milestone: M0. Size: S.
- Satisfies: D-071; `docs/brand/logo-r2/neutral-review/final-strategy.md`.
- Scope: professional clearance search for "Early Letters" and the quotation-mark drawing (classes 9, 16, 41, 42); file the specific drawing, not "quotation marks".

#### BL-367 Support inbox route and postal address
- Status: needs-decision (founder). Mode: human. Owner: founder. Milestone: M0. Size: S.
- Satisfies: review CUS-16, LGL findings; CAN-SPAM postal address before any commercial email.
- Scope: one route for hello@ (Resend inbox or Porkbun forwarding, not both); PO box or private mailbox for `{postalAddress}`; name the mailbox provider in subprocessors.

#### BL-368 Email DNS hardening for both domains
- Status: ready. Mode: human. Owner: founder. Milestone: M0. Size: S.
- Satisfies: `docs/emails/SECURITY.md` DNS section.
- Scope: remove Porkbun forwarding MX and SPF include; add `earlyletters.app` sending records; DMARC from none to quarantine after launch; MTA-STS and TLS-RPT; register both domains with Apple's private email relay.

#### BL-369 Five-second parent test of the mark
- Status: ready. Mode: human. Owner: founder. Milestone: M11. Size: S.
- Satisfies: D-071 (final-a versus final-b).
- Scope: about 20 parents, the icon at 60 and 29 px, "what does this app do?"; keep final-a unless final-b clearly wins.

## M-JR: journey review (pre-TestFlight)

Source: the three screen critiques of the 116 captured journey steps (20 journeys) in `docs/release/journey/critiques/product.json`, `design.json` and `quality.json` with their `.md` summaries, on branch `qa/journey-flows` (PR #83; the journey flows `apps/mobile/e2e-web/j01-*.flow.ts` to `j20-*.flow.ts` named in each test line are on that branch too, so merge it before the first M-JR task starts). The critiques hold 290 findings (product 79, design 138, quality 73; 13 blockers, 108 majors, 169 minors) plus one `_journey` entry per role. Many repeat: design alone raises the same issue on up to nine steps. They are deduplicated here into **65 tasks, BL-370 to BL-434**, one per distinct issue. A finding that asks for two things appears under both tasks. Twelve findings are evidence or device checks that existing tasks already own; they are in the table below, not duplicated.

How to read a task. `Severity` is the highest of its findings: blocker is tagged [Critical], major [High], minor untagged (the critiques' words, mapped to the tags above). `Raised by` lists which of product, design and quality raised it. `Steps` are the journey step ids the findings are on (`_journey` entries are the role's system-level findings). `Test` names the journey flow that must show the fix (flow id J01 to J20, step id) and the unit or CI test that proves it; the flows and `INDEX.md` are regenerated with `npm run e2e:web:journey -w @scribe/mobile` then `node apps/mobile/e2e-web/support/build-index.mjs`. Owner names are the owner mapping used elsewhere in this file (the first name takes the task). Founder questions are `FT-52` to `FT-57` in `docs/FOUNDER_TASKS.md`; a task that waits on one is `needs-founder` and nothing in it is decided. Constitution, content rules and the Definition of Done apply to every task. No task edits `supabase/**` or an applied migration.

| Severity | Tasks | ready | needs-founder | blocked |
|---|---|---|---|---|
| blocker | 5 | 2 | 3 | 0 |
| major | 45 | 39 | 5 | 1 |
| minor | 15 | 15 | 0 | 0 |
| total | 65 | 56 | 8 | 1 |

| Owner | First owner (takes the task) | Named on |
|---|---|---|
| mobile engineer | 24 | 43 |
| content | 12 | 19 |
| design systems | 12 | 19 |
| payments engineer | 4 | 5 |
| speech engineer | 4 | 5 |
| QA engineer | 3 | 5 |
| privacy engineer | 2 | 5 |
| security engineer | 1 | 3 |
| platform | 1 | 2 |
| export owner | 1 | 1 |
| reminders owner | 1 | 1 |
| legal | 0 | 2 |
| data architect | 0 | 1 |

Founder questions raised by this review (answers unblock the tasks named):

| FT | Question | Blocks |
|---|---|---|
| FT-52 | Notes the app writes ("Not much today", "nobody spoke") are signed as the parent: write nothing, or label honestly | BL-372 |
| FT-53 | Membership model D-051 is only on `main`: build the allowance engine and the Plan, Settings and gate copy for v1.0, and answer the open edges | BL-373, BL-374, BL-407 |
| FT-54 | Exact words for the edit feature after D-074 ("Lightly tidied" and "Tidying" are still on about fifteen screens) | BL-393 |
| FT-55 | Backup promise: D-073 (backup in v1.0) against an on-device-only app and the website claim | BL-390 |
| FT-56 | First-run birthday default | BL-385 |
| FT-57 | Deep link `scribe://listen` starts recording with no tap | BL-384 |

Findings already owned by an existing task (no new task; ids and status as in this file):

| Finding (role, step) | Owned by | Status |
|---|---|---|
| Durability gates have never run on a phone: kill-during-save 500x, backup and restore drill, first native build and device session (quality, `_journey` blocker; also J05-01) | BL-135, BL-284, BL-279, FT-21, FT-22 | needs-founder and in-progress; **this is a blocker with no new task: it cannot start until the device session happens** |
| Device-only behaviour the web render cannot show: teal switch thumbs (design J03-07, J11-03), native time picker (J13-03), keyboard avoidance (J07-01), scrim, haptics, Dynamic Island, edit-field outline (design `_journey`), mic alert, call and Siri interruption, low storage, jetsam (quality `_journey`), unverified claims (product `_journey`) | BL-279, BL-030, BL-044 | needs-founder, in-progress |
| StoreKit paths cannot run on web: cancelled, pending, offline, failed, already owned, restore with nothing found (quality J03-08, J11-05, J12-02) | BL-222, BL-277 (E2E-14), BL-416 | needs-founder, in-progress, blocked |
| Few requirement ids in test titles and no component tests (quality `_journey`) | BL-002, BL-110, BL-278 | ready |
| "Redeem a code" row for offer codes (product decision list) | BL-344 | ready |
| Crash visibility and a hotfix path without App Review (quality `_journey`, ops) | BL-021 (scrubber, in progress); adding a crash or OTA SDK is a `pair` task by rule 8 and is not decided here; the false claim is BL-389 | in progress |

Note on D-051: `docs/DECISIONS.md` on `develop` has D-051 "Standard over custom" and D-052 "Quality bar", while `main` has D-051 "Plus is membership" and D-052 "Early-tester offers". The same ids mean different decisions on the two branches. Tasks here say "D-051 (on `main`)" for the membership model. FT-53 asks the founder to settle the numbering.

#### BL-370 A crash is never a blank page: root error screen, launch recovery, global handler [Critical]
- Status: ready. Mode: agent. Owner: mobile engineer, design systems. Milestone: M-JR. Size: M.
- Severity: blocker. Raised by: product, design, quality (4 findings). Steps: J20-01; system-wide (`_journey` entries).
- Satisfies: CLAUDE.md constitution (a person's words are never lost); PRD 7.5 crash handling; LEGAL-REQ-044 (copy says "Your letters are safe" only where it is true).
- Scope: Export an `ErrorBoundary` from the root layout (an EmptyState card: "Your letters are safe", Try again, Export). Catch `local_db_migration_failed` and any `open()` failure in `store.ts` with a recovery screen that still reaches Export and Recordings. Install a global handler (`ErrorUtils`) that never logs content. Set the native root background to the theme `bg` so there is no white flash in dark.
- Done when: A thrown render error in any route shows the recovery card with Try again and Export, not an empty page; Try again re-renders the route. A failing migration shows the recovery screen and Export still runs. Log capture during the crash contains no Asha fixture text, transcript or child name. In dark mode the first paint after a crash is the theme background.
- Test: Journey J20 (`apps/mobile/e2e-web/j20-crash.flow.ts`, step J20-01 asserts the recovery card text instead of an empty page); `apps/mobile/test/error-boundary.test.ts` (new); failing-migration case in `apps/mobile/test/migrations.test.ts`.

#### BL-371 Delete asks first, is undoable for 30 days, and purges for real [Critical]
- Status: ready. Mode: agent. Owner: mobile engineer, privacy engineer. Milestone: M-JR. Size: L.
- Severity: blocker. Raised by: product, design, quality (5 findings). Steps: J10-01, J10-06; system-wide (`_journey` entries).
- Satisfies: `docs/legal/DELETION_AND_EXPORT_SPEC.md` (Recently deleted, 30 days; `settings.delete.entryTitle`); D-061; CLAUDE.md constitution (every edit stored and reversible).
- Scope: A confirm sheet before a saved letter is deleted ("Delete this letter? The recording goes with it.", Keep it is the default, copy in `packages/content`). After deleting, Undo is a full-width button on the page, not only a toast. A Recently deleted list under Settings > Your data with Restore and an erase date. A launch sweep removes tombstoned text, versions and audio older than 30 days (device clock, injected in tests). Deleted letters never show in Tonight, Book, Read together or search. If this is too big for one PR, split confirm and Undo (PR 1) from Recently deleted and purge (PR 2) using free ids in the Numbering note.
- Done when: Delete needs a confirm whose default is Keep it. After Back, swipe-back or a kill, the letter is listed in Recently deleted and Restore returns it with its recording. With the clock moved 31 days, the launch sweep removes the row, its versions and the audio file. Undo is a button on the page for as long as the page is open. No deleted letter appears in Book, Tonight or Read together.
- Test: Journey J10 (`j10-letter.flow.ts`: steps J10-01, J10-05, J10-06 extended with the confirm, the Undo button and a new Recently deleted step); delete, restore and purge cases in `apps/mobile/test/store.entries.test.ts`; 30-day purge case in `apps/mobile/test/sweep.test.ts`.

#### BL-372 Notes the app writes are not signed as the parent: "Not much today", "nobody spoke", "Dear Asha," [Critical]
- Status: needs-founder (FT-52). Mode: agent. Owner: content, mobile engineer. Milestone: M-JR. Size: M.
- Severity: blocker. Raised by: product, design, quality (8 findings). Steps: J07-01, J08-02, J08-03, J10-10; system-wide (`_journey` entries).
- Founder question: FT-52 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: CLAUDE.md constitution ("the machine may remove and repair, never add meaning"; no feature may write a person's words); `packages/content/VOICE.md` (never imply AI writes anything).
- Scope: After the founder answers FT-52 (write nothing, or label honestly), no sentence the app generated is stored as a letter, shown with a signature, or exported as the parent's words. `notMuch.template` and `keepNotMuch` (`index.tsx`) follow the answer. A second tap on the same day does not add a second note. The note is flagged `system_generated` or has no raw text, and export marks it. The "A quiet recording. Nobody spoke" note and the "Dear Asha," ghost in Write follow the same answer. Whether a marker counts toward the free letters is part of FT-53.
- Done when: No entry in Tonight, Book, letter page, Read together or export carries machine text signed "From <name>". Tapping the quiet-day action twice in one day creates one entry. Export marks the entry as system generated (or has no text). The content rule test passes.
- Test: Journey J08 (`j08-quiet-day.flow.ts`: J08-02 and J08-03 assert no generated first-person sentence), J10 (J10-10), J07 (J07-01 placeholder); `packages/content/test/rules.test.ts`; quiet-day de-duplication in `apps/mobile/test/store.entries.test.ts`; marker in `apps/mobile/test/export-golden.test.ts`.

#### BL-373 Free-letters allowance in the app: counter, gate at the third letter, held letter, lapsed state (D-051) [Critical]
- Status: needs-founder (FT-53). Mode: agent. Owner: payments engineer, mobile engineer. Milestone: M-JR. Size: L.
- Severity: blocker. Raised by: product, design (4 findings). Steps: J01-03, J03-05, J06-10; system-wide (`_journey` entries).
- Founder question: FT-53 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: D-051 (on `main`, not on `develop`; see FT-53); PRD-REQ-015; `packages/core/src/plan.ts` `decide()`.
- Scope: After the answers in FT-53: a quiet free-letters counter, a gate on letter creation that uses `decide()` (reads, playback and export never consult entitlement for letters that already exist), the paywall at the third letter that never discards the in-progress letter (held on the phone, Plus offered, saved when Plus starts), a lapsed-member state, and the allowance as one config constant (default 2). A quiet one-time line after the second letter (wording from FT-53). "Plus" tag on Add a child in the Whose book sheet. New events are content-free and pass the analytics allowlist.
- Done when: With 2 saved letters, saving the 3rd shows the Plus sheet and keeps the typed or recorded letter on the phone; once Plus starts the held letter saves. A lapsed member can read, play and export every letter and cannot add one. The allowance is read from one constant. A unit test proves `decide()` never gates read, play or export. New analytics events pass the allowlist test.
- Test: Journeys J12 (`j12-plus.flow.ts`: J12-01 plus a new "third letter" step) and J03 (J03-08); `apps/mobile/test/billing-plan.test.ts`; `decide()` cases in `packages/core` plan tests.

#### BL-374 Plan, Settings, gate and store-facing strings follow the membership model: no "free, always" (D-051) [Critical]
- Status: needs-founder (FT-53). Mode: agent. Owner: content, payments engineer. Milestone: M-JR. Size: M.
- Severity: blocker. Raised by: product, design (7 findings). Steps: J03-06, J03-08, J12-01, J12-02, J16-01.
- Founder question: FT-53 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: D-051 (on `main`); LEGAL-REQ-044 (claims registry: a published statement may not be false); Apple 3.1.2 disclosure.
- Scope: Replace every retired promise: "free, always", "writing stays open", "Plus is optional", "The first book you start is free, always" (Plan J12-01, restore error J12-02, Settings Plan row J03-06 and J16-01, book gate J03-08). "Plus is off" becomes plain status wording. The Plan screen gets structure (what stays yours, what Plus adds) with room for the StoreKit price. Exact wording comes from FT-53. The website and store listing already say "Your first two letters are free"; keep the three identical.
- Done when: No string in `packages/content/src` or `apps/mobile/src` contains the retired promise (a banned-phrase case is added to the content rules test). The Plan, gate and Settings steps show the new copy and it matches the store listing and website line.
- Test: `packages/content/test/rules.test.ts` banned-phrase case; claims registry (BL-118); journeys J03 (J03-06, J03-08), J12 (J12-01, J12-02), J16 (J16-01) re-recorded.

#### BL-375 Speech model download is explained and visible: size, Wi-Fi, progress, failure, full storage [High]
- Status: ready. Mode: agent. Owner: speech engineer, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (7 findings). Steps: J01-12, J05-03, J14-01; system-wide (`_journey` entries).
- Satisfies: D-065 (models download on demand); LEGAL-REQ-007 (accurate purpose strings); `docs/ops/APP_SIZE.md`.
- Scope: The language sheet and the Recordings English row show the size and "Downloads on Wi-Fi" for each language that is not installed. A Download button with progress, cancel and resume. Failure and full-storage states with Try again. After first run, one tap "Get speech ready on Wi-Fi". The Review waiting card says "Getting ready, about N minutes" while the pack waits. Say in the PR whether English ships in the app (D-065) and make the row match.
- Done when: On a fresh install, no 575 MB download starts before the size is shown; mobile data holds the download until the person chooses. A kill mid-download resumes. Full storage shows a calm state with Try again. The Recordings row for a missing model has a Download button and a Ready state.
- Test: Journeys J01 (J01-12 shows the size line), J14 (J14-01 shows Download and the Wi-Fi note), J05 (J05-03); resume case in `apps/mobile/src/lib/packs/__tests__/engine.test.ts`; `apps/mobile/test/models-catalog.test.ts`.

#### BL-376 A letter waiting for its words has a way forward: write the words, try again, a reason [High]
- Status: ready. Mode: agent. Owner: mobile engineer, speech engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (10 findings). Steps: J09-04, J09-05, J10-01, J10-10, J10-17.
- Satisfies: CLAUDE.md constitution (typed words are the person's own; raw stays immutable); D-056.
- Scope: The waiting card in Book (J09-04) and the letter page (J10-17) get "Write the words yourself" (typed under the recording, stored as the person's words), "Try again" or "Download English", and a one-line reason. A "Nobody spoke" letter gets "Try writing it down again" (re-enqueue) and "Record again"; Delete is the lower-emphasis action on a silent recording. The letter page subscribes to the store so words appear without reopening.
- Done when: From a waiting letter the person can type the words and it becomes a normal letter. Try again re-enqueues and sets words once. A letter open on screen updates when words arrive. A no-speech letter offers Record again.
- Test: Journeys J09 (J09-04, J09-05) and J10 (J10-17, J10-10, J10-01); retry-sets-words-once case in `apps/mobile/test/transcription-queue.test.ts`; `apps/mobile/test/store.entries.test.ts`.

#### BL-377 Review keeps what the person changed: autosave edits, warn on Close, mark person edits [High]
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: M. Depends on: BL-148.
- Severity: major. Raised by: quality (2 findings). Steps: J06-08, J06-10.
- Satisfies: CLAUDE.md constitution (edits stored, raw immutable); WCAG 2.2.1 (LEGAL-REQ-051); extends BL-148.
- Scope: Persist `userText` to the draft (autosave like Write). Warn before Close when edits are unsaved. Record a user-edit marker in the edit log so replay does not present a person's edit as machine output. Cap the length. The 900 ms saved card stays until dismissed when VoiceOver is on, and a failed save shows a Try again button.
- Done when: Kill during an edit, relaunch, and the edited text is restored. Close with unsaved edits asks first. Export shows `user_edited`. A failed save shows Try again. With VoiceOver on, the saved card does not auto-close.
- Test: Journey J06 (J06-08, J06-10); edit persistence in `apps/mobile/test/store.entries.test.ts`; `user_edited` in `apps/mobile/test/export-golden.test.ts`.

#### BL-378 Typing, Finish and Save cannot lose or double a letter: autosave flush, in-flight guards, caught errors [High]
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: quality (3 findings). Steps: J01-13, J07-01, J07-02.
- Satisfies: CLAUDE.md constitution (a person's words are never lost); PRD 7.4 durability.
- Scope: Write autosave flushes on AppState background and has a 3 s maximum wait. `persist()` is wrapped in try/catch and shows "could not save, copy your text". First-run `finish()` is guarded by a ref and idempotent per first run; a failing `addChild` shows a calm retry card. The typed letter has a generous maxLength with a calm message.
- Done when: Backgrounding mid-typing keeps the last burst. A failing `setDraftTyped` does not crash. Double-invoking `finish` creates one book per name. A 100k-character paste is handled without jank.
- Test: Journeys J07 (J07-02) and J01 (J01-13); `apps/mobile/test/write-autosave.test.ts` and `apps/mobile/test/onboarding-finish.test.ts` (new).

#### BL-379 Drafts are visible and can be let go; short or empty takes are not kept silently [High]
- Status: ready. Mode: agent. Owner: mobile engineer, design systems. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (5 findings). Steps: J04-01, J05-08, J06-12.
- Satisfies: CLAUDE.md constitution (the machine never removes a person's words: confirm before discarding); DELETION_AND_EXPORT_SPEC.
- Scope: Tonight shows the waiting-draft card above the prompt card as one pressable card, with a count or list when there is more than one. Review and Tonight offer "Let it go" with a confirm. A take under about 1 second or 0 bytes says so ("That was very short. Keep it, or let it go?", Let it go first) instead of the transcription-failed heading. Discard removes the row and the audio file only after the confirm.
- Done when: Three drafts are all reachable from Tonight. Discarding from Review removes row and audio after the confirm. Finish tapped at once shows the short-take message, not the transcription-failed heading.
- Test: Journeys J04 (J04-01), J05 (J05-08), J06 (J06-12); discard cases in `apps/mobile/test/store.entries.test.ts` and `apps/mobile/test/sweep.test.ts`.

#### BL-380 Recording stays awake and Read together autoplay survives auto-lock [High]
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: quality (2 findings). Steps: J05-01, J11-03.
- Satisfies: LEGAL-REQ-011 (recording still stops when the app leaves the foreground); D-027.
- Scope: Keep the screen awake during recording and during Read together autoplay, and release it on stop or leave. A take is still saved and stopped if the app is backgrounded. Verify on a device (auto-lock 30 s).
- Done when: With Auto-Lock at 30 s, a 2-minute take is not cut. Autoplay continues with the screen on. The wake lock is released on stop and on leaving the screen.
- Test: Journeys J05 (J05-01) and J11 (J11-03) assert the wake lock is requested and released (mocked on web); `apps/mobile/test/player-logic.test.ts`; device row in BL-279.

#### BL-381 Recording start failures say the real cause; the permission card is a proper sheet [High]
- Status: ready. Mode: agent. Owner: mobile engineer, design systems. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (6 findings). Steps: J05-01, J05-04; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-007 (permission priming); PRD 7.4; the words so far are kept.
- Scope: Tell apart permission denied, audio session busy (a call), prepareToRecord failure, media services reset and low storage, each with its own calm card that says the words so far are kept. Free-space preflight (under 100 MB) before a take. After the person enables the microphone in iOS Settings and returns, re-check on foreground and continue. The permission card uses the shared Sheet (scrim, grabber), a microphone-off drawing aligned to the gutter, and Open Settings as a secondary button.
- Done when: A busy audio session does not show "microphone is off". Low storage shows its own card before recording starts. Returning from iOS Settings with the microphone enabled continues without a second tap.
- Test: Journey J05 (J05-01, J05-04); `apps/mobile/test/capture-errors.test.ts` (new); device rows in `docs/qa/DEVICE_TEST_PLAN.md` S1.

#### BL-382 A killed take is checked before it is called ready [High]
- Status: ready. Mode: agent. Owner: speech engineer, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: quality (1 findings). Steps: J05-01.
- Satisfies: PRD 7.4 durability; TDD 03 risk R-4; extends BL-134, proves part of BL-135.
- Scope: At launch the sweep opens each non-empty M4A with `AVAudioFile` and marks unreadable files `unrecoverable` while keeping them. If the 500-kill gate (BL-135) fails, fall back to ADTS plus remux.
- Update, 27 Oct (ADR 0027): the fallback came before the gate, without the remux. No killed M4A take opened on the simulator (0 of 70), so every iOS build cut from develop from #293 on records ADTS (`.aac`), and 100 of 100 killed ADTS takes played. The sweep's check (`capture/probe.ts`, `test/sweep.playable.test.ts`) stays for every take: M4A on Android and from before the flip, and any take that still does not open.
- Done when: A sweep fixture with a truncated M4A is marked unrecoverable and the file is kept and counted in Recordings. Readable files stay ready.
- Test: Truncated-M4A fixture in `apps/mobile/test/sweep.test.ts`; device run BL-135.

#### BL-383 Unknown links open a calm not-found screen, never the developer page [High]
- Status: ready. Mode: agent. Owner: mobile engineer, security engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: product, design, quality (4 findings). Steps: J19-01; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-044; BL-170 (deep links).
- Scope: Add `+not-found.tsx` with an EmptyState card ("We could not find that page", full-width Back to Asha's book). `redirectSystemPath` sends every unknown path to "/" (allowlist: invite, auth, tabs). No raw URL, route name or Sitemap link is shown. The recorder routes are handled in BL-384.
- Done when: A malformed deep link and an unknown universal link land on the card. `planIncomingLink` returns "/" for an unknown path. The text "Sitemap" never renders.
- Test: Journey J19 (`j19-errors.flow.ts`, step J19-01 asserts the card); unknown-path case in `apps/mobile/test/auth-links.test.ts` and `apps/mobile/test/invite-link.test.ts`.

#### BL-384 External links open a screen and never start the recorder: scribe://listen [High]
- Status: needs-founder (FT-57). Mode: agent. Owner: security engineer, mobile engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: quality (2 findings). Steps: J05-04; system-wide (`_journey` entries).
- Founder question: FT-57 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: LEGAL-REQ-011 ("never auto-starts recording"); BL-170.
- Scope: After FT-57: `redirectSystemPath` allowlists routes so /listen, /review, /write and /read-together are not reachable from outside the app (or are reachable only as the founder decides), and Listen no longer starts the recorder on mount: a tap starts it.
- Done when: `planIncomingLink` returns "/" for /listen, /review, /write and /read-together (or the founder's variant). Opening scribe://listen from Safari with microphone permission granted never starts a recording; Listen needs a tap.
- Test: `[LEGAL-REQ-011] an external link never auto-starts recording` in `apps/mobile/test/auth-links.test.ts`; journey J05 (J05-04) re-run; device check from Safari.

#### BL-385 First-run birthday has no silent default; siblings can have their own dates [High]
- Status: needs-founder (FT-56). Mode: agent. Owner: mobile engineer, content. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (4 findings). Steps: J01-05, J01-07, J01-09, J01-14.
- Founder question: FT-56 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: D-038 (siblings with different dates); CLAUDE.md "never gender the child".
- Scope: After FT-56: the first-run date follows the founder's answer (no default; a confirm; or an explicit "I'll add it later"). Siblings in first run get per-child dates or an explicit "Same birthday" switch. The dateline for a newborn (0 to 6 days) reads "newborn" if FT-56 approves it.
- Done when: A 7-month-old can no longer become "0 days" by tapping Continue. Twins can be set to different dates. Month chapters and prompts match the date entered.
- Test: Journeys J01 (J01-05, J01-07, J01-09, J01-14) and J03 (J03-01); `apps/mobile/test/dates.test.ts`.

#### BL-386 A first-run mistake can be corrected: edit name, birthday and signature; a due date becomes the birthday [High]
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design, quality (5 findings). Steps: J01-08, J01-10, J03-07; system-wide (`_journey` entries).
- Satisfies: BL-035 (per-child settings); PRD first-run profile.
- Scope: Name, birthday or due date, and "Sign my letters as" rows in child settings become editable (chevron, `updateChild`; rename the "Child" row to "Name"). When a due-date child's baby arrives (a "Asha has arrived" action, or the date passes), the due date becomes the birthday so month chapters start. A signature change affects new letters only.
- Done when: Editing the birthday moves letters to the right month chapters. A due-date child can get a birthday and `monthFor()` is no longer null. A signature edit leaves existing letters unchanged.
- Test: Journeys J03 (J03-07), J01 (J01-08, J01-10); `apps/mobile/test/dates.test.ts`; `updateChild` cases in `apps/mobile/test/store.repos.test.ts`.

#### BL-387 Delete a book and erase everything on this phone, each with a calm confirm [High]
- Status: ready. Mode: agent. Owner: mobile engineer, privacy engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, quality (5 findings). Steps: J03-07, J16-01; system-wide (`_journey` entries).
- Satisfies: `docs/legal/DELETION_AND_EXPORT_SPEC.md` (delete book); D-053 (on-device, no accounts in v1.0); BL-233.
- Scope: Per-book "Delete this book" in child settings and "Erase everything on this phone" under Your data. Export is offered first. Erase wipes the database, audio, settings and Keychain items. Retention for a deleted book follows the deletion spec; where the spec is silent the PR says so for counsel and uses an export offer plus a typed confirm.
- Done when: After Delete this book, the child, its letters and recordings are gone from the phone and from Export. After Erase everything, the database, audio folder and settings are empty and the app starts at first run.
- Test: Journeys J03 (J03-07) and J16 (J16-01) with new steps; `apps/mobile/test/store.repos.test.ts`; `apps/mobile/test/erase-all.test.ts` (new).

#### BL-388 Export is complete and safe: drafts, orphans and deleted letters included; ZIP64; share-cancel keeps the file [High]
- Status: ready. Mode: agent. Owner: export owner, mobile engineer. Milestone: M-JR. Size: L.
- Severity: major. Raised by: product, quality (4 findings). Steps: J14-01, J15-01, J15-02.
- Satisfies: LEGAL-REQ-034; BL-150, BL-323; the screen promises "every letter and recording".
- Before building (CR-35): settle with the Chief Privacy Officer whether Recently deleted letters go in always (this scope) or only when "Include recently deleted" is ticked (`docs/legal/DELETION_AND_EXPORT_SPEC.md` 4.1). If the answer changes the spec, Privacy Policy section 14 or the export screen copy, it goes to the founder through the gate.
- Scope: Include tombstoned letters, drafts (typed and recorded) and orphan recordings in a "not in the book" folder and the manifest. ZIP64 or split by year so a very large book does not fail. Keep the ZIP until the person leaves the export screen (Share cancelled must not delete it). The failure line names a cause only when known ("That did not work this time. Your letters are safe on this phone.").
- Done when: An export-golden fixture with a draft, an orphan and a deleted letter lists all three in the manifest. A test across the 4 GB boundary passes. Cancelling the Share sheet keeps the ZIP and Export again needs no rebuild. The "needs a little more free space" line shows only for a real space error.
- Test: Journey J15 (J15-01, J15-02); `apps/mobile/test/export-golden.test.ts` and `apps/mobile/test/export-schema.test.ts`.

#### BL-389 The consent sheet and Settings switch say only what v1.0 does: no crash-report claim [High]
- Status: ready. Mode: agent. Owner: content, privacy engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: product, quality (4 findings). Steps: J04-04, J16-02; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-044 (claims registry); D-061; BACKLOG rule 8 (adding a crash SDK is a `pair` task).
- Scope: Reword the consent sheet and the "Share usage and crash reports" switch to what is actually sent (usage; no crash data) until a scrubbed crash reporter exists (BL-021 is in progress; adding any crash or OTA SDK is a separate `pair` task and not part of this one). Drop "photos". Show the sheet after a letter is saved, not 1.2 s after Tonight opens. The unlabeled X gets the label "Not now". Add the claim to the registry.
- Done when: A claims test fails if consent copy says "crash" while no reporter is configured. The sheet appears after the first save. The X has an accessible label.
- Test: Journeys J04 (J04-04) and J16 (J16-02); `packages/content/test/rules.test.ts`; claims registry test (BL-118).

#### BL-390 The backup promise matches what v1.0 does: D-073 versus on-device only [High]
- Status: needs-founder (FT-55). Mode: agent. Owner: content, legal. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product (3 findings). Steps: J01-04, J10-01; system-wide (`_journey` entries).
- Founder question: FT-55 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: D-073 (backup in v1.0), D-033 (agreed storage sentence), D-053 and D-059 (no audio upload in v1.0); LEGAL-REQ-044.
- Scope: After FT-55: one sentence says where recordings live and it is identical on the promise screen, Recordings, the letter page and the store listing. Plan, Settings, Subscription Terms and the website line "Plus backs up every recording" (in `apps/web` on `main`, so a web handoff) match. If v1.0 is on-device only, add a new-phone and reinstall note and a gentle Export nudge.
- Done when: No string says "backs up" unless backup ships. The three in-app locations carry the same sentence. The claims registry has one row per claim and the website, store listing and Subscription Terms agree.
- Test: `packages/content/test/rules.test.ts` claims cases; journeys J01 (J01-04), J10 (J10-01), J14 (J14-01), J12 (J12-01).

#### BL-391 Doors to nowhere are hidden in v1.0: "I was invited", the Family tab, "Family can read", coming-soon rows [High]
- Status: ready. Mode: agent. Owner: mobile engineer, content. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (15 findings). Steps: J01-03, J03-07, J17-01, J17-02, J17-03, J17-04; system-wide (`_journey` entries).
- Satisfies: D-055 (co-parent only at launch); D-059; App Store review completeness (BL-341 review notes).
- Scope: Hide "I was invited" on Welcome, the Family tab, the "Family can read" switch, the "Write this book together: Coming soon" rows and the "We'll let you know here" sheet, behind the existing coming-soon flag so v1.1 flips them back. Drop "for everyone in the family" from the Hide-book copy. An invite link opened in v1.0 keeps the existing neutral page; a dedicated invited-person page is not part of this task.
- Done when: The app has two tabs and Settings. The words "Coming soon" appear nowhere in app UI. The coming-soon tests are updated. Review notes (BL-341) say so.
- Test: Journeys J01 (J01-03), J03 (J03-07), J17 (J17-01 to J17-04: `j17-family.flow.ts` now asserts the tab is absent); `apps/mobile/test/coparent-soon.test.ts`.

#### BL-392 The v1.0 binary carries only what v1.0 uses; size, entitlements and Info.plist are checked in CI [High]
- Status: ready. Mode: agent. Owner: platform, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: quality (3 findings). Steps: J17-01; system-wide (`_journey` entries).
- Satisfies: D-065 (download under 40 MB); LEGAL-REQ-007; extends BL-117 and BL-349; BL-283 release checklist.
- Scope: With server features off, drop or exclude the dormant SDKs and entitlements (Google Sign-In, passkeys, Sign in with Apple entitlement and associated domains if no sign-in ships, Supabase if unused). CI lint of Info.plist and entitlements against a v1.0 allowlist. Fix the stale free-space comment in the privacy manifest. A JS bundle size gate in CI against the 12 MB sub-budget; the App Thinning figure is added to the release checklist after the first native build.
- Done when: CI fails when Info.plist or the entitlements contain a key that is not on the v1.0 allowlist, or when the JS bundle exceeds 12 MB. The privacy manifest comment matches the code. `docs/ops/APP_SIZE.md` records the thinning figure after the first build.
- Test: New size and plist steps in `.github/workflows/ci.yml`; entitlement allowlist case in `apps/mobile/test/config.test.ts`.

#### BL-393 "Word for word" vocabulary replaces "tidy", "lightly tidied" and "Tidying" on every screen (D-074) [High]
- Status: needs-founder (FT-54). Mode: agent. Owner: content, mobile engineer. Milestone: M-JR. Size: M. Depends on: BL-356.
- Severity: major. Raised by: product (9 findings). Steps: J01-04, J03-06, J10-01, J14-01, J15-01, J16-01, J18-04; system-wide (`_journey` entries).
- Founder question: FT-54 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: D-074; `packages/content/VOICE.md` section "Word for word"; CONSISTENCY_AUDIT CA-027; extends BL-356.
- Scope: After FT-54: apply the confirmed words to the promise screen (J01-04), the letter provenance line (J10-01, J18-04), the Recordings setting and its label (J14-01), the Settings footer (J03-06, J16-01), the export file line (J15-01), and the "Writing down your words" and "How transcription works" headings (J14-01). BL-356 renames the `tidy*` keys; this task owns the visible strings. Re-run the journey capture afterwards.
- Done when: The banned list in the rules test includes tidy, tidied, tidying and "lightly tidied" (and "transcription" in user-facing copy) and finds zero hits in `packages/content/src` and `apps/mobile/src`. The re-captured journey text lists contain none of them.
- Test: `packages/content/test/rules.test.ts`; journeys J01, J03, J06, J10, J14, J15, J16, J18 (text assertion that no step text contains "tidy").

#### BL-394 Dark mode uses dark values on every screen: tab bar, icons, scrubber, recording disc, Appearance screen [High]
- Status: ready. Mode: agent. Owner: design systems, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design (6 findings). Steps: J18-01, J18-02, J18-03, J18-04, J18-06; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-051 (AA contrast and 1.4.11); `packages/design-tokens` dark tokens; D-052 quality bar.
- Scope: Bind the navigation container, tab bar, headers and every icon colour through `useTheme` (dark surface, line, accent, textMuted, recording tokens). The scrubber track uses `line` or controlBorder. A lint rule bans hex values and `tokens.light` outside the theme provider. Extend journey J18 to every route.
- Done when: J18 assertions hold on every captured route in dark: icons and controls at least 3:1, text at least 4.5:1, tab bar is the dark surface, the Appearance screen background follows the selection. The lint rule fails on a hex value outside the provider.
- Test: Journey J18 (`j18-dark-mode.flow.ts`, extended to Settings, Plan, Review, Letter); `packages/design-tokens/test/tokens.test.ts`; lint rule test.

#### BL-395 Review, the trust screen, has a clear hierarchy: readable fix marks, tappable fix rows, one primary, a safe permanent choice [High]
- Status: ready. Mode: agent. Owner: design systems, mobile engineer. Milestone: M-JR. Size: L.
- Severity: major. Raised by: product, design, quality (15 findings). Steps: J06-01, J06-02, J06-03, J06-04, J06-06, J06-08, J06-09.
- Satisfies: CLAUDE.md constitution (every edit visible and reversible); LEGAL-REQ-051; DESIGN_LANGUAGE (Review).
- Scope: Fix marks at least subhead size with a 44 pt hit area. The first-time note at 16 pt, "Got it" at 44 pt, and it says "Tap a dotted mark to see what we fixed, and put it back if you like." Fix rows are list rows with a chevron and 48 pt height. Viewing "what you said" is a segmented toggle; the permanent "Keep my exact words" is a distinct outlined button with a confirm. Primary full width, Keep private a quiet 44 pt button; the footer collapses at AX sizes. The edit field uses Literata 20/32 with the focus ring. Panel Close and Undo reach 44 pt, and a restored word keeps its space. "Does this sound like you?" states its purpose or is dropped, and is never sent when analytics are off. If one PR is too large, split by section.
- Done when: Review passes the bounding-box check (every button and link at least 44 pt) at default and AX5. The permanent action cannot be hit by a view toggle mis-tap. The edit field shows Literata and the focus ring. The feedback answer is absent from any analytics payload when consent is off.
- Test: Journey J06 (`j06-review.flow.ts`, J06-01 to J06-09) with the bounding-box assertion and AX5 screenshot (E2E-15); analytics allowlist test in `packages/analytics`.

#### BL-396 One ScreenHeader and one Sheet pattern replace five navigation idioms [High]
- Status: ready. Mode: agent. Owner: design systems. Milestone: M-JR. Size: L.
- Severity: major. Raised by: design (7 findings). Steps: J01-04, J01-12, J07-01, J16-01, J17-01, J17-03; system-wide (`_journey` entries).
- Satisfies: DESIGN_LANGUAGE; `docs/design/COMPONENT_LIBRARY.md`; HIG push, modal and sheet conventions.
- Scope: One ScreenHeader with three variants (root large title; pushed with chevron back and a collapsing large title; modal with title and Close) and one Sheet (grabber, labelled X, serif 22 pt title). Retire `< Back` text, the arrow-only header, top-left Close text on pushed screens and the bottom Close. The language sheet and Whose book sheet match. Root titles sit at one height. Header and body share one gutter in Write.
- Done when: Only the three header variants and one Sheet remain in the code. Every sheet has grabber, labelled close and the same title style. Root titles share one y position across tabs.
- Test: Journeys J01, J03, J07, J16, J17 header assertions; component test via BL-278.

#### BL-397 One selection pattern, and value rows that look tappable [High]
- Status: ready. Mode: agent. Owner: design systems. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design (8 findings). Steps: J01-02, J01-10, J03-06, J06-09, J12-01, J13-03, J14-01; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-051 (1.4.11 control edges 3:1); `docs/design/COMPONENTS.md` ChoiceGroup and Chip.
- Scope: ChoiceGroup and Chip are the only selection components: selected is accentSoft fill, accent edge and a check; unselected edge at least 3:1 (controlBorder); solid accent only for the single primary. ListRow always shows a chevron, a value or a switch (Spoken language, child fields, Restore purchases, model state, Add a child with a plus icon and accent text). The Plan status card is a tinted variant that does not look tappable.
- Done when: Yes/No, birthday chips, day pills and "Sounds like me / Not quite" share one selected style with a check. Unselected controls pass 3:1 against their background. Value rows are never chevron-less.
- Test: Journeys J01 (J01-02, J01-10), J03 (J03-06), J06 (J06-09), J12 (J12-01), J13 (J13-03); `packages/design-tokens/test/tokens.test.ts` control edge pair.

#### BL-398 One StateScreen for empty, error and loading states, and one inline caution card [High]
- Status: ready. Mode: agent. Owner: design systems. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design (6 findings). Steps: J05-03, J06-13, J10-11, J12-02, J15-02; system-wide (`_journey` entries).
- Satisfies: DESIGN_LANGUAGE; MOTION (loading rhythm).
- Scope: A StateScreen on EmptyState (art, title, body, full-width bottom action) with a Breathe loading variant, used for J06-13, J10-11 and J11-07. An inline Card with caution icon, 3 pt caution edge and `role=alert` for J12-02 and J15-02 so an error is not the same tint as info.
- Done when: The captured error and empty screens share one layout and one action position. Inline errors carry a caution icon and are announced on appear.
- Test: Journeys J06 (J06-13), J10 (J10-11), J11 (J11-07), J12 (J12-02), J15 (J15-02).

#### BL-399 "Writing down what you said" shows it is working and that the recording is safe [High]
- Status: ready. Mode: agent. Owner: mobile engineer, content. Milestone: M-JR. Size: S.
- Severity: major. Raised by: product, design (2 findings). Steps: J05-03.
- Satisfies: D-065; DESIGN_LANGUAGE (calm, honest waiting); MOTION.
- Scope: The waiting card uses Breathe (static with text under Reduce Motion), left-aligned on a flat `surface` (not a raised white card), and says "Listening back to what you said. You can close this, it will be waiting on Tonight." and that the recording is safe. After a threshold with no progress it says it is taking longer than usual and offers Keep voice or Type instead. A time estimate is added once transcription time is measured on iPhone SE 3 (BL-043).
- Done when: The card animates (or is static with text under Reduce Motion), states the recording is safe and can be closed, and shows the longer-than-usual state after the threshold.
- Test: Journey J05 (J05-03); timeout case in `apps/mobile/test/transcription-queue.test.ts`.

#### BL-400 Every control reaches 44 pt: text links, quiet buttons, close X, gear, Aa [High]
- Status: ready. Mode: agent. Owner: design systems, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design (9 findings). Steps: J01-03, J01-09, J01-14, J03-04, J03-05, J04-02, J04-04, J05-01; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-051; BACKLOG Definition of Done 9 (44 pt targets).
- Scope: Quiet and link Buttons get min-height 44 and hitSlop; IconButton sizes reach 44 pt (gear, X, Aa, remove name, switcher). Add a bounding-box assertion for role=button and role=link to the web journey run, and an Accessibility Inspector pass on device. Review marks are in BL-395.
- Done when: The journey run fails when any role=button or role=link in J01 to J20 has a hit area under 44 by 44 pt. The listed controls pass on the captured screens.
- Test: Bounding-box assertion in `apps/mobile/e2e-web/support/journey.ts`; journeys J01 to J20; Accessibility Inspector row in BL-279.

#### BL-401 Letter page and Read together scale with Large print and keep the dateline legible; one Dateline and type ramp [High]
- Status: ready. Mode: agent. Owner: design systems, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (9 findings). Steps: J10-01, J10-04, J10-05, J11-01; system-wide (`_journey` entries).
- Satisfies: D-027 (letter text never capped); LEGAL-REQ-051 (AX5); DESIGN_LANGUAGE type ramp.
- Scope: One Dateline component (`letterDateline` times `readingScale`), used on cards, Review, Letter and Read together, formatted "From Mama - The first weeks". Large print scales the dateline, player times, provenance and links, not only the body. Trust copy is never below subhead 16. Read together scrolls and keeps the player and footer clear of the text at Large print and AX5. The scrubber track is at least 3:1 with an elapsed fill. The Private toast sits on surfaceRaised with a border and the chip reserves its space.
- Done when: At Large print and AX5, dateline, times and links grow with the letter and nothing overlaps the player or footer. There is one dateline style across the app. The scrubber shows position by fill.
- Test: Journeys J10 (J10-01, J10-04, J10-05) and J11 (J11-01); AX5 screenshots (E2E-15); `apps/mobile/src/lib/a11y.logic.test.ts`.

#### BL-402 The app carries the brand: mark on the first screens, one Atmosphere wrapper, one QuotePair [High]
- Status: ready. Mode: agent. Owner: design systems, mobile engineer. Milestone: M-JR. Size: L.
- Severity: major. Raised by: product, design (14 findings). Steps: J00-open, J01-01, J01-03, J01-14, J02-05, J06-10, J10-01, J11-04, J18-02; system-wide (`_journey` entries).
- Satisfies: D-071 and D-072 (primary mark, asset registry); `docs/brand/BRAND_SYSTEM.md`; MOTION principle 1.
- Scope: Use the registry mark (BL-351, merged in #48) above the age question and on Welcome in place of the retired envelope drawing. One Atmosphere wrapper (static grain, radial lamp pool from `atmosphere.lamp`, paper or night tone, off under Reduce Motion and Reduce Transparency) and one QuotePair from the brand registry, used on Welcome, Tonight, Listening, Letter and End of book only. A plain crescent tab icon. No continuous loops except the voice-driven glow.
- Done when: The mark shows on the first two screens and Welcome. Atmosphere and QuotePair appear on the five named screens and nowhere else, and are off under Reduce Motion and Reduce Transparency. Contrast tests still pass with the wash.
- Test: Journeys J00 (J00-open), J01 (J01-01, J01-03, J01-14), J05, J10, J11 (J11-04); `packages/brand` registry test; `packages/design-tokens/test/tokens.test.ts`.

#### BL-403 Tonight reaches Settings and the child switcher, and settles after a letter [High]
- Status: ready. Mode: agent. Owner: mobile engineer, design systems. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design (4 findings). Steps: J01-14, J03-04, J07-05.
- Satisfies: DESIGN_LANGUAGE (celebrate what exists, no streaks); BL-034.
- Scope: Gear and child switcher as 44 pt theme-aware IconButtons on Tonight. On Book the title is the switcher (serif title with a chevron), replacing the 12 pt caps "FOR ASHA". After a letter is saved, Tonight shows "Tonight's letter is in Asha's book." with a quiet "Add another" link: no streak and no count.
- Done when: Settings and the switcher are reachable from Tonight. The Book title opens the switcher. After a saved letter Tonight shows the settled state.
- Test: Journeys J01 (J01-14), J03 (J03-04), J07 (J07-05).

#### BL-404 Settings leads with the person's book, not an apology or money; Recordings and Storage merged; accessibility statement [High]
- Status: ready. Mode: agent. Owner: mobile engineer, content, legal. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design, quality (8 findings). Steps: J03-06, J16-01, J16-02, J16-06; system-wide (`_journey` entries).
- Satisfies: D-060 (the early-version note stays); LEGAL-REQ-008, LEGAL-REQ-052; BL-159.
- Scope: Plan moves to its own section below children, language and privacy. The "early version" note shrinks and the export line loses any loss language. The privacy line shows once. Recordings and Storage merge into one row. "What we never do" is a check card, not navigation rows. Licences push to their own screen. Add the Accessibility statement row (LEGAL-REQ-052) and place Consumer Health Data and Subprocessors under Privacy (LEGAL-REQ-008). Help mailto falls back to copying the support address when no mail account exists.
- Done when: Settings order is children, language, privacy and data, plan, about. Licences open a separate screen. The Accessibility statement row exists. Help with no mail account copies the address.
- Test: Journeys J16 (J16-01, J16-02, J16-06) and J03 (J03-06); Settings layout case in the component harness (BL-278).

#### BL-405 Helplines follow the device region, with an international fallback and a Call row [High]
- Status: ready. Mode: agent. Owner: content, mobile engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: design, quality (3 findings). Steps: J16-05.
- Satisfies: D-059 (the static row ships in v1.0); BL-158; FT-36 (founder checks the resources before submission).
- Scope: The helpline list comes from the device region; every other region gets the international fallback (findahelpline.com). Each helpline is a 44 pt row with a Call label; when `tel:` cannot open, the number is shown to copy. The US list is unchanged. Non-US numbers are added only after the FT-36 check.
- Done when: A US device shows the existing list. A non-US region shows the international fallback only. A failed `tel:` shows the number to copy.
- Test: Journey J16 (J16-05); table-shape test in `packages/content/test`.

#### BL-406 Write and Review buttons say what they do: "Save" opens a read-back [High]
- Status: ready. Mode: agent. Owner: content, mobile engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: product, design (4 findings). Steps: J07-01, J07-02, J07-03.
- Satisfies: CLAUDE.md content rules; VOICE.md.
- Scope: Rename the Write primary to "Read it back" (disabled until there is text, with a visible reason). Keep the autosave line. Move the "Private letters stay with you" explainer next to the Keep private button. Whether typed letters skip the read-back is a product choice and is not made here.
- Done when: The Write primary is "Read it back" and matches the next screen's title. The explainer sits within one screen height of the button it explains.
- Test: Journey J07 (J07-01, J07-02, J07-03); `packages/content/test/rules.test.ts`.

#### BL-407 Read together under the membership model: does the fourth opening still hit a paywall (D-051 edge 5) [High]
- Status: needs-founder (FT-53). Mode: agent. Owner: payments engineer, content. Milestone: M-JR. Size: S.
- Severity: major. Raised by: product (1 findings). Steps: J11-05.
- Founder question: FT-53 in `docs/FOUNDER_TASKS.md`. Nothing here is decided; the task starts when the question is answered.
- Satisfies: D-051 edge 5 (on `main`); D-009 and D-037 (3 free sessions); BL-154.
- Scope: After FT-53: either Read together keeps its 3 free sessions, or it follows the free-letters allowance, so a free family never meets two stacked paywalls. Update the gate copy ("You have read together 3 times for free") to the answer.
- Done when: No flow shows two paywalls to a free family. The gate copy matches the model.
- Test: Journey J11 (J11-05); `apps/mobile/test/billing-plan.test.ts`.

#### BL-408 Performance budgets have a harness: SQL perf test with a 5-year fixture in CI, Maestro timing for device runs [High]
- Status: ready. Mode: agent. Owner: QA engineer, mobile engineer. Milestone: M-JR. Size: L.
- Severity: major. Raised by: quality (2 findings). Steps: J03-05; system-wide (`_journey` entries).
- Satisfies: BACKLOG Definition of Done 8 (budgets); PRD 7.1; extends BL-289 (done) and feeds BL-044.
- Scope: A CI SQL-level perf test with a 5-year fixture of 2,000 Asha letters: chapter of 60 letters p95 500 ms, local save p95 200 ms, switch child p95 300 ms. Maestro timing scripts for cold start and record start for the device run per release candidate (200 samples), feeding BL-044.
- Done when: The CI job fails when a budget is exceeded on the fixture. A documented Maestro script produces cold start and record start timings for BL-044.
- Test: `apps/mobile/test/perf.sql.test.ts` (new) and a job in `.github/workflows/ci.yml`.

#### BL-409 Accessibility evidence in CI: AX5 snapshots, RN accessibility lint, VoiceOver names for icon-only controls [High]
- Status: ready. Mode: agent. Owner: QA engineer, design systems. Milestone: M-JR. Size: L.
- Severity: major. Raised by: design, quality (5 findings). Steps: J06-01, J10-01, J10-04; system-wide (`_journey` entries).
- Satisfies: LEGAL-REQ-051; BL-279 (manual scripts and evidence).
- Scope: AX5 screenshot tests in the web journey run (E2E-15). An RN accessibility lint rule in CI. Step JSON exports role, name and order from the accessibility tree. Explicit labels for Aa, gear, X, back, play, Hear it, remove name and the scrubber. The VoiceOver script run is filed in `docs/qa/evidence`.
- Done when: CI fails on an unlabeled icon-only control. Step JSON includes roles and names. AX5 screenshots exist for Review, Letter, Settings and the Plus gate.
- Test: a11y assertion in `apps/mobile/e2e-web/support/journey.ts`; accessibility lint job in `.github/workflows/ci.yml`.

#### BL-410 Extend the journey capture: locales, AX5, interruption states, missing screens [High]
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: product, design (4 findings). Steps: J01-12, J05-08; system-wide (`_journey` entries).
- Satisfies: BACKLOG Definition of Done 9; LEGAL-REQ-051; D-056 (seven spoken languages).
- Scope: Capture hi, es, zh, fr, ar (forced RTL) and pt at default and AX3 and AX5 on the two-up controls (Birthday | Not here yet, Add to Asha's book, Keep it word for word, Sounds like me | Not quite, tab labels). Add the missing screens: Storage, Spoken language, Help, Write to us, in-app Terms and Privacy, About, a lock-screen notification example, Tonight for a not-yet-born child, a second waiting draft, a long Book. Add the interruption states and the short, silent and model-missing end states (device captures paired with BL-279).
- Done when: `INDEX.md` lists the new steps and the critiques can be re-run on them. Each listed screen has a captured step.
- Test: `npm run e2e:web:journey -w @scribe/mobile` then `node apps/mobile/e2e-web/support/build-index.mjs`.

#### BL-411 Localisation position for v1.0 is stated; letter fixtures and layout checks for ar, hi, zh; per-language suggestion sets [High]
- Status: ready. Mode: agent. Owner: content, mobile engineer. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design, quality (3 findings). Steps: J01-05, J01-10; system-wide (`_journey` entries).
- Satisfies: D-056 (UI in English, seven spoken languages, ready for localisation); BL-156.
- Scope: Store copy and Settings state "English app, seven spoken languages". Export-golden fixtures with Arabic, Hindi and Chinese letters plus a layout check at AX5. Signature chip suggestions per spoken language in `packages/content`. The date pill shows a short date and wraps. The language list aligns rows to start under RTL.
- Done when: Fixtures for ar, hi and zh pass export and layout checks. The suggestion set follows the spoken language. A long date does not truncate in es, fr or pt.
- Test: `apps/mobile/test/export-golden.test.ts` ar, hi, zh fixtures; journeys J01 (J01-05, J01-10, J01-12).

#### BL-412 raw_transcript is immutable on the phone too: local triggers [High]
- Status: ready. Mode: agent. Owner: mobile engineer, data architect. Milestone: M-JR. Size: M.
- Severity: major. Raised by: quality (1 findings). Steps: system-wide (`_journey` entries).
- Satisfies: DATA-REQ-040 (local variant); CLAUDE.md constitution ("raw_transcript is immutable").
- Scope: A new local migration adds BEFORE UPDATE OF raw_transcript triggers on entries and drafts that allow only the one-time set from empty. Every store function is tested to leave raw untouched.
- Done when: An UPDATE of `raw_transcript` on a set row aborts. `setWordsForWaitingEntry` still sets raw once.
- Test: `[DATA-REQ-040] local raw_transcript cannot change` in `apps/mobile/test/migrations.test.ts` and `apps/mobile/test/store.entries.test.ts`.

#### BL-413 The words of a saved letter can be changed by the person, and background words are read first [High]
- Status: ready. Mode: agent. Owner: speech engineer, mobile engineer. Milestone: M-JR. Size: M. Depends on: BL-148.
- Severity: major. Raised by: quality (2 findings). Steps: J01-04, J10-17.
- Satisfies: CLAUDE.md constitution (edits stored and reversible); the promise line "read each letter and fix anything we got wrong"; BL-148.
- Scope: "Change words" on the letter page, stored as a person edit with raw untouched and a per-edit put-back. A letter whose words arrived in the background is marked "words arrived, please read" and opens in Review. If this is not built, the promise line must change (BL-393 owns wording).
- Done when: A saved letter can be edited and every edit can be put back. A background-words letter opens in Review and the flag clears after it is read.
- Test: Journeys J10 (J10-17) and J01 (J01-04); `apps/mobile/test/store.entries.test.ts`; words-set-once in `apps/mobile/test/transcription-queue.test.ts`.

#### BL-414 App code only contacts allowlisted hosts (CI test), and the speech model has a mirror [High]
- Status: ready. Mode: agent. Owner: privacy engineer, platform. Milestone: M-JR. Size: M.
- Severity: major. Raised by: quality (2 findings). Steps: J01-12; system-wide (`_journey` entries).
- Satisfies: D-065; LEGAL-REQ-017; extends BL-239 (device capture stays there).
- Scope: A CI test that app source contains only allowlisted hosts (the models host, Apple, PostHog after consent). A mirror host for the model (`mirrors: []` in `catalog.ts`) and a nightly host-reachability check. The device network capture (App Privacy Report or proxy) stays with BL-239 and the S1 session.
- Done when: Adding a hard-coded host that is not on the allowlist fails CI. The catalog has a mirror and failover is tested.
- Test: `apps/mobile/test/network-allowlist.test.ts` (new); mirror failover in `apps/mobile/test/models-catalog.test.ts`; nightly workflow.

#### BL-415 Client log canary: no entry text, transcript or child name reaches an app log [High]
- Status: ready. Mode: agent. Owner: privacy engineer, QA engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: quality (1 findings). Steps: system-wide (`_journey` entries).
- Satisfies: CLAUDE.md privacy rules; LEGAL-REQ-017; extends BL-239.
- Scope: Run the Asha fixtures through the web journey run with console and log capture, and fail on any fixture string. The backup wording from the same finding is in BL-390.
- Done when: The journey run fails if any Asha entry text, transcript or child name appears in captured logs.
- Test: Console capture assertion in `apps/mobile/e2e-web/support/journey.ts`; all journeys.

#### BL-416 Capture the real StoreKit screens on an iPhone: offer, trial, terms, redeem, restore, failed, lapsed [High]
- Status: blocked (BL-103, BL-339). Mode: pair. Owner: payments engineer, QA engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: product (1 findings). Steps: system-wide (`_journey` entries).
- Satisfies: Apple 3.1.2 (price and terms beside the buy button, via D-053); D-052 offer codes (on `main`, BL-344).
- Scope: On a development build with the sandbox products, record the offer with price and auto-renewal terms, the trial, purchased, restored (success and none found), a failed load with Try again, a lapsed state and the Redeem a code row. File the captures in `docs/qa/evidence` and add them to the journey index as device-captured steps.
- Done when: Each state has a capture showing price and terms next to the buy button. The BL-222 sandbox checklist references them.
- Test: BL-222 checklist rows; E2E-14.

#### BL-417 Listening screen: the disc is the Pause control, the timer does not jitter, pause does not shift the layout [High]
- Status: ready. Mode: agent. Owner: design systems, mobile engineer. Milestone: M-JR. Size: S.
- Severity: major. Raised by: design (3 findings). Steps: J05-01, J05-02.
- Satisfies: DESIGN_LANGUAGE (Listening); MOTION.
- Scope: The 120 pt disc becomes the Pause target (or stops looking like a button). Tabular figures on the timer. Pausing keeps the line (swapping to "Take your time") and crossfades the disc over the motion token. Let it go at 44 pt.
- Done when: Tapping the disc pauses. The timer does not change width each second. Pausing moves nothing.
- Test: Journey J05 (J05-01, J05-02).

#### BL-418 One primary action pinned at the bottom on every screen that has one [High]
- Status: ready. Mode: agent. Owner: design systems. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design (5 findings). Steps: J03-08, J09-01, J11-05, J15-01; system-wide (`_journey` entries).
- Satisfies: DESIGN_LANGUAGE (bottom action rule).
- Scope: Apply the bottom-action rule (one 56 pt primary above the tab bar or home indicator) to Book empty, Export, the Plus gates and End of book. Left-align and balance their headings.
- Done when: The listed screens have one pinned primary at 56 pt and no mid-screen content-width primary.
- Test: Journeys J03 (J03-08), J09 (J09-01), J11 (J11-05), J15 (J15-01).

#### BL-419 First-run and stop screens: balanced headings, art on the gutter, cards with one fill, stable layout [High]
- Status: ready. Mode: agent. Owner: design systems, content. Milestone: M-JR. Size: M.
- Severity: major. Raised by: design (10 findings). Steps: J01-03, J01-04, J01-05, J01-10, J01-13, J02-02, J02-03, J02-04, J03-03.
- Satisfies: DESIGN_LANGUAGE type ramp (display 34/41).
- Scope: "The book is open" uses the display token with balanced wrap. Line art offsets so its edge sits on the gutter. The two promise cards share one fill and a neutral icon. "Add another child" moves below the date block. The signature helper sits under its field at subhead. The stop screen anchors where the age gate does and the 24-hour way back does not move the heading.
- Done when: No orphaned word in the finale or stop headings, including two long names. The stop-screen heading does not jump when the way back appears.
- Test: Journeys J01 (J01-03, J01-04, J01-13), J02 (J02-02, J02-04), J03 (J03-03).

#### BL-420 Layout shifts are reserved or animated: prompt swap, Private chip, first-time note, stop-screen button
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: design (1 findings). Steps: system-wide (`_journey` entries).
- Satisfies: MOTION (standard 200 ms, Reduce Motion fade).
- Scope: Reserve space or animate with the standard motion token for the prompt swap (about 32 pt), Private chip insertion (20 pt), first-time note dismissal (135 pt) and the stop-screen button (37 pt).
- Done when: Those four moves shift nothing, or animate; under Reduce Motion they fade.
- Test: Journeys J04 (J04-02), J06, J10 (J10-05), J02 (J02-04) with a layout-shift measurement in the web run.

#### BL-421 Book list: the month placeholder is one quiet line, voice letters show a play glyph, author only when there is more than one
- Status: ready. Mode: agent. Owner: design systems. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: design (2 findings). Steps: J09-03.
- Satisfies: DESIGN_LANGUAGE ("celebrate what exists, never count gaps").
- Scope: "This month: Month 7 is open" becomes one quiet row that opens Write. Voice letters get a 44 pt play glyph. "From Mama" shows only when more than one person writes.
- Done when: The placeholder is one line. Voice cards have a play affordance. A single-writer book repeats no author name.
- Test: Journey J09 (J09-03).

#### BL-422 "Private" versus "in the book" is explained once, with what Export and Read together include
- Status: ready. Mode: agent. Owner: content. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product (1 findings). Steps: system-wide (`_journey` entries).
- Satisfies: VOICE.md; D-061.
- Scope: One plain explanation of Private versus in the book (nobody else can see either in v1.0), and a line saying whether Export and Read together include private letters (check the code first). Remove the warning on the listening screen if it has no consequence in v1.0.
- Done when: One explanation exists and Export and Read together behaviour matches its words.
- Test: Journeys J05, J07 (J07-03), J15; content rules test.

#### BL-423 First run ends ready to speak
- Status: ready. Mode: agent. Owner: mobile engineer, content. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product (2 findings). Steps: J01-13; system-wide (`_journey` entries).
- Satisfies: D-043 (fewer first-run screens).
- Scope: Fold "The book is open" into Tonight, or open Tonight with Speak ready, and label the button for what it does ("Tell Asha something").
- Done when: From the last first-run screen the person reaches a ready recorder in one tap.
- Test: Journey J01 (J01-13, J01-14).

#### BL-424 Promise screen: plain button label, equal weight for the three promises, shorter first paragraph
- Status: ready. Mode: agent. Owner: content. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product, design (2 findings). Steps: J01-04.
- Satisfies: VOICE.md; D-061.
- Scope: "That sounds right" becomes "Continue". The privacy line becomes a third card or subhead 16. The first paragraph is trimmed to one sentence. Vocabulary words are in BL-393.
- Done when: The button reads Continue. The three promises have equal weight.
- Test: Journey J01 (J01-04); content rules test.

#### BL-425 Disabled buttons say why: Continue, Export everything, Sign my letters
- Status: ready. Mode: agent. Owner: mobile engineer, design systems. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product, design, quality (5 findings). Steps: J01-01, J01-05, J15-03.
- Satisfies: LEGAL-REQ-051 (accessible state).
- Scope: Disabled primary buttons show a visible helper ("Add a name to continue", "Write a letter first") and expose it as an accessibility hint; the disabled style is visibly disabled, not nearly invisible.
- Done when: Each listed disabled button has helper text and an accessibility hint.
- Test: Journeys J01 (J01-01, J01-05), J15 (J15-03).

#### BL-426 Under-18 stop: the way back is mentioned, layout stays put, device limits are recorded
- Status: ready. Mode: agent. Owner: content, security engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product, design, quality (4 findings). Steps: J02-02, J02-04.
- Satisfies: LEGAL-REQ-002; D-006.
- Scope: Add "If you answered by mistake, come back tomorrow." Record in the compliance register that the stop lives in local settings and uses the device clock; evaluate the Keychain for the stop.
- Done when: The stop screen mentions the way back. The register states both limits.
- Test: Journeys J02 (J02-02, J02-04); `[LEGAL-REQ-002]` cases in `apps/mobile/test/age-gate.test.ts`.

#### BL-427 Names and signature: duplicate warning, cut at a character not a code unit, cap shown
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: design, quality (5 findings). Steps: J01-06, J01-09, J01-10, J03-01.
- Satisfies: CLAUDE.md "never gender the child"; BL-136.
- Scope: Warn on case-insensitive duplicate names in first run and add-child. Truncate by code point and NFC-normalise, with a quiet counter near the limit.
- Done when: "Asha" and "asha" warn. A paste ending in an emoji or ZWJ sequence is never cut mid-character.
- Test: Journeys J01 (J01-06, J01-09), J03 (J03-01); unit tests with emoji, ZWJ and Devanagari names.

#### BL-428 The reminders switch shows the true state, and absence behaviour is stated
- Status: ready. Mode: agent. Owner: reminders owner, design systems. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: design, quality (2 findings). Steps: J13-02.
- Satisfies: BL-151; BL-157.
- Scope: Show the switch off until the OS permission exists (or a status row "Waiting for permission"). State that reminders are planned about 3 weeks ahead and refresh when the app opens, or use repeating triggers for the evening pattern.
- Done when: With permission denied the switch is not ON. A long-absence case exists in the planner test.
- Test: Journey J13 (J13-02); `apps/mobile/test/reminders-planner.test.ts`.

#### BL-429 Read together counts a free session only after a page is read for 10 seconds or the first play
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: quality (1 findings). Steps: J11-01.
- Satisfies: BL-154; D-037.
- Scope: Move the count from the screen opening to the first 10 seconds of reading or the first play.
- Done when: Opening and closing the screen does not use one of the 3 free sessions.
- Test: Journey J11 (J11-01); `apps/mobile/test/player-logic.test.ts`.

#### BL-430 Failed store load and restore show their own calm states with a retry
- Status: ready. Mode: agent. Owner: payments engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product (1 findings). Steps: J03-08.
- Satisfies: Apple 3.1.2; BL-216, BL-219.
- Scope: A failed StoreKit product load shows "We could not reach the App Store. Try again in a moment." with a retry, distinct from "not available on this device".
- Done when: A failed load has its own state and a retry. Device evidence is in BL-222.
- Test: Journeys J03 (J03-08), J12 (J12-02); `apps/mobile/test/billing-plan.test.ts`.

#### BL-431 A letter's date can be corrected and warns before the child's birth
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: quality (1 findings). Steps: system-wide (`_journey` entries).
- Satisfies: BL-035.
- Scope: Allow editing a letter's date and warn on dates before the birth. A wrong device date should not silently misplace chapters.
- Done when: Editing a letter date moves it between chapters. A date before birth shows a calm warning.
- Test: Journeys J09, J10; `apps/mobile/test/dates.test.ts`.

#### BL-432 Very long takes: soft warning at 30 minutes and a memory run on iPhone SE 3
- Status: ready. Mode: agent. Owner: speech engineer. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: quality (1 findings). Steps: J05-09.
- Satisfies: PRD 7.1 transcription budget; BL-043.
- Scope: A soft warning at 30 minutes and a 60-minute take through the queue on iPhone SE 3 for memory.
- Done when: The warning shows at 30 minutes. The memory run is recorded in `docs/qa/evidence`.
- Test: Journey J05 (J05-09); device run with BL-043.

#### BL-433 Review says "Nothing was changed" only when that is true
- Status: ready. Mode: agent. Owner: content. Milestone: M-JR. Size: S.
- Severity: minor. Raised by: product, design (3 findings). Steps: J06-07, J06-09.
- Satisfies: CLAUDE.md constitution (honest labels); VOICE.md.
- Scope: After "Keep my exact words" the line reads "Word for word. Nothing was changed." and the now-redundant "Show exactly what I said" link is hidden.
- Done when: The line never says nothing needed fixing after fixes were reverted.
- Test: Journey J06 (J06-07, J06-09); content rules test.

#### BL-434 Tonight and Book read only what they show
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M-JR. Size: M. Depends on: BL-408.
- Severity: minor. Raised by: quality (2 findings). Steps: J01-14, J09-03.
- Satisfies: PRD 7.1 (chapter of 60 letters p95 500 ms, switch child p95 300 ms); BL-111.
- Scope: Tonight queries only the last N prompt keys and the latest `occurred_on`. Book counts with SQL, pages by chapter and does not parse `machine_edits` for every row on focus. The switch-child path is timed.
- Done when: On the 2,000-letter fixture Tonight focus does not read `machine_edits` and Book renders its first chapter within p95 500 ms.
- Test: `apps/mobile/test/perf.sql.test.ts` (from BL-408); journeys J01 (J01-14) and J09 (J09-03).

## QA: coverage baseline follow-ups (BL-441 to BL-443; from PR #180, 16 Oct 2026)

#### BL-441 `decide()` honours own Plus on an account-level surface
- Status: ready. Mode: agent (engine file: a founder merge under D-107; under D-117's operating rule the coordinator merges it after two independent passing reviews on the current head and green CI). Owner: payments engineer (the plan engine, `packages/core/src/plan.ts`). Size: S.
- Satisfies: D-036 and plan rule R-3 (no offer where Plus is already on).
- Scope: `packages/core/src/plan.ts:203` allows own Plus only while `roleInBook === 'parent'`. With `roleInBook: null` and `book: null` (the documented account-level shape) a person whose Plus is on is offered Plus. Latent: no screen calls `decide()` with a null role yet.
- Done when: own Plus is `allow` on an account-level surface; the `it.fails` "[BL-441] [R-3] own Plus on an account-level surface..." in `packages/core/test/plan.edges.test.ts` becomes `it` and passes; the property test "never offers Plus where it is already on" in `plan.test.ts` counts a null role as on.

#### BL-442 Ten tests that assert too little
- Status: ready. Mode: agent. Owner: qa engineer. Size: S. Each test's owning agent reviews its change.
- Satisfies: TDD 07 section 9.2 (a test that cannot fail proves nothing).
- Scope: add the real assertion to each (tests only, nothing deleted):
  - `apps/mobile/test/capabilities.test.ts` "starts no sync": no `sync_outbox` row after a save.
  - `apps/mobile/test/resilience.test.ts` "does nothing more if retry itself throws": `timers.setTimeout` never called.
  - `apps/mobile/test/store.facade.test.ts` "[MOB-05] subscribeTo entries...": the listener receives `['entries']`.
  - `apps/mobile/test/store.repos.test.ts` "table-scoped listeners..." and "unsubscribing during a notification...": the filtered table list, and the first listener still fires.
  - `apps/mobile/test/config.test.ts` "has a submit profile": the fields the release needs.
  - `apps/mobile/test/shelf-strings.test.ts` "screens use only strings that exist": each value is a non-empty string.
  - `packages/brand/test/registry.test.ts` "npm fonts resolve": the resolved version equals the pinned one.
  - `packages/content/test/emails.test.ts` "every auth email carries a safety line": a non-empty string.
  - `packages/emails/test/emails.test.ts` "ports every email develop had": each renders non-empty HTML and text.
- Done when: each test fails when its subject is broken (checked by hand once per test).

#### BL-443 Slow tests that flake under load
- Status: ready. Mode: agent. Owner: qa engineer. Size: M. Each test's owning agent reviews its change.
- Satisfies: TDD 07 section 9.2 (quarantine at most 7 days); CI budget (TDD 07 section 10).
- Scope, one change per test (coverage runs already work around each one in `vitest.coverage.config.ts`):
  - `packages/core/test/verify.fuzz.test.ts`, `lang.fuzz.test.ts`: split each property into `it` blocks of 2000 cases, so no single synchronous call blocks a worker (instrumented, 40 to 67 s now; vitest's worker report times out).
  - `apps/mobile/test/billing-plan-reminders.test.ts` "holds every invariant...": a stride knob like `SCRIBE_FUZZ_RUNS` (every 15th day in PR CI, every day nightly); it takes 69 s of its own 120 s plain.
  - `apps/mobile/test/decode-uri-component-shim.test.ts`: load `metro.config.js` in a `beforeAll` with its own timeout.
  - `apps/mobile/test/sync-e2e.test.ts`: reuse a PGlite data-dir dump instead of applying every migration in `beforeAll`.
  - `apps/mobile/test/config.test.ts`: warm `getConfig` in a `beforeAll` (the first call pays the cold `@expo/config` load).
  - `packages/content/test/no-real-family-data.test.ts`: skip non-text files with `git ls-files --eol` instead of reading each one.
- Done when: `npm test` and `npm run test:coverage` each pass three times in a row on a 2-core runner, and the coverage-only skip in `apps/mobile/vitest.coverage.config.ts` is removed.

## Review follow-ups (28 Oct 2026)

Found in the PR reviews of 28 Oct 2026 (#311, #312, #358, #359, #360, #361, #362) and filed here by the product agent from the coordinator's list. File and line references were checked against `develop` at 8301ac8; where a line is on an open PR's head and not on `develop`, the entry says which PR. "Unverified" means the review read the code and did not run or reproduce it. This file tags only [Critical] and [High] in a heading, so Medium and Low items carry a `Priority:` line instead. In an Owner line, S## is a stream of PRD V2 `08-delivery.md` 3.3 and P8a is the experience pass package for the account view.

#### BL-446 Export includes the letters and books an account-deletion request moved to Recently deleted [Critical]
- Status: ready. Gate: the first build real families use with sign-in on. Not an alpha build 2 blocker: build 2 (the `preview` profile) is the first build with sign-in on, but PR #358 removed the export promise from the scheduled page and the request email, and its testers are family and invited friends (coordinator's call, 28 Oct 2026; the founder can overrule it). Mode: agent. Owner: sync owner (S03: lib/db, store.ts, lib/sync; listed first because the wire-change route starts there), export owner (S13: lib/export), mobile engineer (S14: lib/account-deletion). Milestone: M9. Size: M. Depends on: none.
- Satisfies: DATA-REQ-053 (P0, `docs/legal/DELETION_AND_EXPORT_SPEC.md:376`: "Export works for everything not yet purged, including letters tombstoned by the request").
- Why: `request_account_deletion` sets `entries.deleted_at` with `deleted_reason = 'account_deletion'` and tombstones sole-parent books (`supabase/migrations/20261005000000_family_cap_language_idempotency.sql:435-443`). The next sync moves those letters to Recently deleted and unlists the books: `sync_pull` has no `deleted_reason` in the pull row (`supabase/migrations/20261016000000_sync_v1_server.sql:1485-1495`), so the phone sees them as ordinary deletions (`apps/mobile/src/lib/sync/merge.ts:644`, `:844-845`). Export skips both. Its letters filter is `deleted_at IS NULL` (`apps/mobile/src/lib/db/repos/entries.ts:167`, in `listForChild`) and its books come from `listChildren` and `listHiddenChildren` (`apps/mobile/src/lib/export/device.ts:102-103`), which leave out left and deleted books (`apps/mobile/src/lib/db/repos/children.ts:29`); the comment at `apps/mobile/src/lib/export/build.logic.ts:9` says Recently deleted letters are left out by design (D-085). A person in the 30-day grace period who taps Export gets a file without those letters. Found in the review of #358, lens A: code reading, not reproduced on a phone.
- Where it can happen: in `preview` (alpha build 2), the only profile with `EXPO_PUBLIC_SERVER_FEATURES` on (`apps/mobile/eas.json:47`), and in the first release that turns sign-in and sync on. Not in a server-off store build: `production` and `testflight` are off (`apps/mobile/eas.json:61`, `:75`), and `apps/mobile/src/lib/capabilities.ts:8-9` and `:17` say store profiles stay off and the Delete account row is not offered when off. D-121 (proposed in PR #340, not on develop) would make the first store build server-off, with submission targeted Tue 1 Dec 2026; `docs/release/1.0.0.md:15` has App Store 1.0.0 as not started and re-planned. For build 2, PR #358 (merged as 8301ac8) removed the export promise from the scheduled page and the request email; this task is the real fix.
- Scope: make Export complete while a request is open, covering the letters the request tombstoned and the books it unlisted. Two ways; the owner picks one in the PR and says why: a wire change (put `deleted_reason` in the `sync_pull` row, which is a new migration and needs the founder's `approve-migration` label), or an export that reads Recently deleted and the unlisted books while a request is open. Reproduce first. Overlap: whether Recently deleted letters belong in an export at all (spec 4.1 says only when "Include recently deleted" is ticked; BL-388 says always; D-085 does not decide it) is BL-388's to settle with the Chief Privacy Officer, and goes to the founder if the answer changes the spec, Privacy Policy section 14 or the export screen copy (CR-35). This task covers only what an open request moved.
- Done when: an export taken during the grace period holds every letter the request tombstoned and every book it unlisted; a test runs the real merge and export path on the Asha fixture (request, sync, export); after Cancel the letters and books are back where they were and export as before.

#### BL-447 A deletion request under a legal hold: what the scheduled page tells the person [High]
- Status: needs-decision (counsel; counsel relay doc, item 11 addendum, not in the repo; gate: the first build real families use with sign-in on, same as BL-446). Mode: pair. Owner: legal (the question for counsel), mobile engineer (S14: `stepFor`). Milestone: M9. Size: S. Depends on: none.
- Satisfies: none given. Cited: `docs/legal/data-policy.md:221` (a hold pauses purge and account-deletion execution; "the user is told only what the law allows").
- Why: `held` is set only on or after `scheduled_for` (`supabase/migrations/20261023020000_purge_legal_holds.sql:210-214`, `:294`), and `stepFor` maps `held` to the scheduled page (`apps/mobile/src/lib/account-deletion/logic.ts:104`). A person whose request is under a legal hold therefore sees the scheduled page with a date that has already passed. Cancel still works while held. Only a build with sign-in on can show it (see BL-446 for the profiles).
- Scope: counsel decides what such a person is told. The question is in the counsel relay doc (not in the repo), under item 11 as an addendum ("Also for counsel"), not in item 11's own two lines. Then S14 changes `stepFor` and the page to say it, with the words in `packages/content`. Not a build 2 blocker: only the founder or counsel place holds (unverified that none exists on staging).
- Done when: counsel's answer is recorded here; a held request shows what the answer says and not a past date; a test covers `held` in `stepFor`.

#### BL-448 Deletion words and docs agree with the S64 page: emails, website page, register rows, spec, run sheets
- Status: needs-decision (counsel for the website page and register rows; the spec owner for the spec and run-sheet points; BL-361 for the co-parent notice). Mode: pair. Owner: legal (counsel draft, website page, register rows, Privacy Policy, spec), content (the emails), qa engineer (run sheets and test plans). Milestone: M9. Size: M. Depends on: BL-361 (item 1 only).
- Priority: Medium.
- Satisfies: none given. DATA-REQ-053 is cited in item 5. S64 is the Delete account page of `docs/design/EXPERIENCE_PASS_2026-10.md`.
- Why: six places say something the app does not do (from the review of #358, lens A, and its delta; checked on develop at 8301ac8, after #358 merged and fixed AL-07.3, AL-07.5 and E2E-09 steps 1 and 4):
  1. The request email no longer promises an export or says a co-parent is told (`packages/content/src/emails/account.en.ts:43-45`, `:52`; #358 did that). It can say a co-parent is told only once a notice is sent: the `coparent-left` template exists (`account.en.ts:188`) but nothing sends it (BL-361 is blocked), and no screen shows the in-app `coParentLeft` card (`packages/content/src/strings.en.ts:1257`).
  2. The book-deletion email promises an export during the grace period: its preheader "Until then you can export it, or change your mind." and its body "You can export everything in it first, free." (`packages/content/src/emails/account.en.ts:108` and `:112`). No book-deletion screen backs it: `request_book_deletion` appears in TypeScript only in `packages/core/src/family-rules.ts`.
  3. The website Delete account page (`packages/content/src/pages.en.ts` lines 199, 223, 225, 240, 248; counsel's draft is `docs/legal/delete-account-page.md` in PR #163) still says "Settings, then Your data, then Delete account", "we let them know", "You can also still export", lists photos and says "we send a receipt". It is counsel's draft, so counsel decides.
  4. PR #163's register row (`docs/legal/in-app-disclosures.md:37`) and Privacy Policy line 97 put Delete account under "Settings, Your data" and list "what we keep and why" on the screen. Both exist only on #163's head (53a7622), not on develop. Settings has Delete account in its own section (`docs/design/EXPERIENCE_PASS_2026-10.md:1029`) and the S64 page has no such list. Counsel and the spec owner reconcile.
  5. The spec disagrees with S64. `docs/legal/DELETION_AND_EXPORT_SPEC.md` 2.6.1 step 7 (line 202) says the phone signs out by itself, where S64 has a "Sign out of this phone" button; step 1 (line 196) puts the row under Settings > Your data, where the app has it in its own section. AL-07.1 (`docs/qa/run-sheets/AL-07-account-deletion.md:20`) says Export is "the main action" and DATA-REQ-053 says Export is "the primary action on the step before Confirm", but the S64 page makes Export and Continue both outline (S64 says bordered). The spec owner decides.
  6. Docs still say "sign in again" before cancelling, although the app stays signed in: `docs/tdd/07-quality-test-strategy.md:336` (E2E-09 step 5), `docs/qa/DEVICE_TEST_PLAN.md:503` (S2-13, whose heading is at `:502` at 146a8ff; this entry first cited `:371`, which is inside S1-29, and was corrected on 30 Oct; #393 rewrote S2-13's steps and added S1-35 above it), `docs/qa/run-sheets/2026-10-30-T11-session-1.md:63`.
- Scope: each point has an owner who decides first (counsel for 3 and 4, the spec owner for 5, counsel and content for 1 and 2); the words or the doc then change in the file the point names. A requirement document is not edited here: a proposed change goes in the PR body for the founder.
- Done when: each of the six points is settled in the file it names, or recorded here as left as it is; the book-deletion email and the website page say only what the app does, and the request email says a co-parent is told only if a notice is sent.

#### BL-449 A sign-out wait ends when the queued letters belong to another account [High]
- Status: ready. Mode: agent. Owner: auth owner (S01), sync owner (S03). Milestone: M5. Size: S. Depends on: none.
- Satisfies: none given.
- Why: `pendingCount` has no owner filter (`apps/mobile/src/lib/sync/outbox.ts:786-792`), and the engine does not start when the signed-in account differs from the account that owns the queue (`apps/mobile/src/lib/sync/index.ts:186`, `:206`). Account A signs out with letters queued, account B signs in with sync on, and B's sign-out waits on A's rows forever. The same on develop. From the #359 review (lens A S3): code reading, not run.
- Scope: end the wait when the queue is not the signed-in account's, for example by counting only that account's rows in the sign-out check, or by not waiting when the engine will not start on a mismatch. The owner picks one in the PR. A's queued rows are left as they are.
- Done when: a test with two accounts (A queues and signs out, B signs in with sync on and signs out) shows B's sign-out does not wait on A's rows, and A's rows are still queued.

#### BL-450 An Apple revocation noticed at launch waits for unsynced letters before signing out
- Status: ready. Mode: agent. Owner: auth owner (S01). Milestone: M5. Size: S. Depends on: none.
- Priority: Medium.
- Satisfies: A-REQ-033 (P0, `docs/prd/v2/features/F02-account.md:213`: "Given a revoked credential at launch, Then sign-out happens only after unsynced letters sync").
- Why: an Apple revocation noticed at launch signs out without waiting for unsynced letters. The state at that point is `checkingConsent`, and the sign-out request maps it to sync off (`apps/mobile/src/lib/auth/machine.logic.ts:181-183`), so no wait starts. A-REQ-033 is not met for that case. Letters are kept, not sent. Pre-existing. From the #359 review (lens A N1).
- Scope: meet A-REQ-033 for a revocation noticed at launch. If that needs a change to the requirement, the PR body drafts it for the founder; the requirement is not edited here.
- Done when: a test of a revoked credential at launch with letters queued shows sign-out happens only after they sync, or the PR body states why it cannot and the founder has decided.

#### BL-451 The sign-out wait tells the person when it ends early, can be cancelled, and shows the real sync state
- Status: done (PR #388, e3dbbe2: the signed-out line, "Stay signed in" and the real sync state in the waiting row; phone checks S1-27 (e) and (j); the follow-ups are BL-478 and BL-479). Mode: agent. Owner: mobile engineer (P8a: account view), auth owner (S01). Milestone: M5. Size: M. Depends on: none.
- Priority: Medium. A build 2 follow-up.
- Satisfies: none given.
- Why and where (from the #359 reviews and the #360 review; #359 merged as ab97b1c, #360 as 925a67f):
  1. When the wait ends early, the waiting row (`packages/content/src/features/auth.en.ts:188`, shown at `apps/mobile/src/app/settings/account.tsx:242`) vanishes and the signed-out view has no line saying the newest letters stayed on the phone and upload at the next sign-in to the same account. The confirm before the tap (`auth.en.ts:186`) says only that the letters stay on this phone; it does not mention letters not yet sent.
  2. No screen calls `cancelSignOutWait()` yet (`apps/mobile/src/lib/auth/session-provider.tsx:102`, `:489`; `apps/mobile/src/lib/auth/machine.logic.ts:80`, `:194`). A "Stay signed in" button should: show it only when `state.reason === 'user'`, and hide it when the account view says closing, because `cancelSignOutWait()` gives no outcome and is a silent no-op once a gate answer has ended the wait.
  3. The Account waiting row shows a hard "On" instead of `s.sync` (`apps/mobile/src/components/auth/account-view.logic.ts:32-33`).
- Scope: add the signed-out line (1), the button (2) and `s.sync` in the row (3), with the words in `packages/content`.
- Done when: each of the three has a test in `account-view.logic` or the screen test; the button is absent when the reason is not `user` and when the view says closing.

#### BL-452 Sign-in error words match the cause
- Status: ready. Mode: agent. Owner: auth owner (S01: `errors.logic.ts`), content (the words, `VOICE.md`), qa engineer (the scan). Milestone: M5. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low.
- Satisfies: none given.
- Why and where (from the #360 reviews, the review reports and not the posted PR comments; #360 merged as 925a67f). Points 1 and 2 are true in code:
  1. `errors.expired` is also returned for `webauthn_challenge_expired` and `flow_state_expired` (`apps/mobile/src/lib/auth/errors.logic.ts:37-39`), where its words ("That link has expired. Send a new email for a fresh one.", `packages/content/src/features/auth.en.ts:116`) are wrong for a passkey.
  2. The `rate_limited` and provider lines also show on Account for passkey (`apps/mobile/src/app/settings/account.tsx:156`) and sign-out-others (`:187`), where their words are about email and sign-in.
  3. The "on this phone" lines (`network`, `unknown`, `consent_unavailable`, `session_expired`) are wrong on a zero-letter phone: journey step j22 shows `network` on a fresh install.
  4. The `useCloseSheet` scan in `apps/mobile/test/server-surfaces-auth-screens.test.ts` misses writes through an aliased receiver, optional-call syntax, subpath store imports and transitive writes.
  5. `packages/content/VOICE.md` has no "Error row", although the spec cites one (`docs/design/EXPERIENCE_PASS_2026-10.md:633`, `:1276`).
- Scope: a cause that has no honest line gets its own; the lines that talk about letters on the phone say so only when there are letters; the scan covers the four misses; VOICE.md gets the Error row the spec cites.
- Done when: each point has a test or a content-rule case, and `npm test --workspace packages/content` passes.

#### BL-453 Database photo policy follow-ups after #311
- Status: ready. Mode: agent (a migration needs the founder's `approve-migration` label). Owner: data architect (S02), legal (point 6). Milestone: M9. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low. No live impact today: v1.0 has no photo feature (PRD V2 F46 is "later", `docs/prd/v2/05-feature-map.md:64`).
- Satisfies: none given.
- Why and where (#311 merged as 91c0785; migration `20261028000000_pg_temp_last_and_purged_photos.sql`):
  1. A letter purge queues only the exact `photo_path`: a second object under the same id with another extension is neither queued nor deleted.
  2. The helper `photo_entry_is_purged` answers true for a ledger-only id to an anonymous session where `sync_push` refuses (`SCANO`). Anonymous sign-ins are off (`supabase/config.toml:29`); if they are ever turned on, add `and not public.is_anonymous()`.
  3. Signed or resumable (TUS) upload URLs issued before an erasure are not covered. A purge-worker sweep for erased ids is the backstop.
  4. The 61-day test does not move `entry_erasures.erased_at`: mutant S04 (an erasure record that expires 60 days after `erased_at`) survives. Fix: back-date `erased_at` by 61 days before the checks after the trim.
  5. If PR #306 is revived, it must become `supabase/APPLY.md` File 27, with a migration timestamp later than `20261028000000`.
  6. `docs/legal/ENGINEERING_REQUIREMENTS.md:11` and the consumer-health notice attribute "no photos" to D-059, which does not mention photos. Use PRD V2 F46 (`docs/prd/v2/05-feature-map.md:64`). ENGINEERING_REQUIREMENTS.md is a requirement document, so the change is proposed in the PR body; the notice is legal's.
- Scope: points 1 and 3 close the gaps named; point 2 only if anonymous sign-ins are on; point 4 is a test change; point 5 is a note that holds until #306 is revived; point 6 is legal's.
- Done when: points 1, 3 and 4 have tests that fail before the change (point 4 kills mutant S04); points 2, 5 and 6 are done or recorded here as waiting on their condition.

#### BL-454 Keep sheet and Settings follow-ups from #312
- Status: ready (points 1 and 2 wait for an answer; points 3 and 4 can be done now). Mode: agent. Owner: mobile engineer, qa engineer (point 3). Milestone: M8. Size: S. Depends on: none.
- Priority: Low.
- Satisfies: none given.
- Why and where:
  1. `settings.neverRewrite` (`packages/content/src/strings.en.ts:854`) is rendered nowhere in `apps/mobile/src`. The line shown is `settings.tidyHelp` (`apps/mobile/src/app/settings/recordings.tsx:70`; its last sentence is "Either way, we never rewrite your words."). Counsel relay doc, item 15 (not in the repo).
  2. The held card now shows the stored raw transcript, fillers included, matching Tonight's card. This is a design consequence of the stored-words rule; the spec owner confirms.
  3. A double tap on "Keep it here for now" can land on the Book tab under the sheet's bottom edge on web (from the #312 review; unverified here, and unverified on iOS). `docs/qa/DEVICE_TEST_PLAN.md` V-06 gets a double-tap row.
  4. A test pins the order in `storedWords` (`apps/mobile/src/components/child/plus-gate.logic.ts:103`): typed words over the transcript.
- Scope: do points 3 and 4. For points 1 and 2, put the question in the PR body for counsel (relay doc, item 15) and the spec owner; change nothing until they answer.
- Done when: V-06 has the double-tap row; the `storedWords` order test exists and fails if the order is swapped; the answers to points 1 and 2 are recorded here.

#### BL-455 Delete account page clean-up from the #358 review
- Status: ready. Mode: agent. Owner: mobile engineer (S14: the page and its hook), content (the strings and the purge-worker copy). Milestone: M9. Size: S. Depends on: none.
- Priority: Medium. Point 4 is Low.
- Satisfies: none given.
- Why and where (from the #358 lens A delta and lens B; #358 merged as 8301ac8):
  1. `packages/content/src/strings.en.ts:820`, `settings.delete.accountScheduledBody` ("Until then you can export everything, or cancel and keep your account just as it is."), has no consumer. Retire it.
  2. `supabase/functions/purge-worker/copy.ts:16` (the contributor notice) points contributors to Export everything after the book is tombstoned. That follows the same code path as the account-deletion export gap (BL-446). Contributors are hidden in v1.0, so it matters when they ship (unverified).
  3. The E2E-09 Maestro flow needs `deleteAccount.*` test ids the page does not have (`apps/mobile/e2e/TESTID_REQUESTS.md:149`).
  4. A surviving mutant from #358's lens B: no test pins that a request in `held` counts as not cancelled in `cancelDeletion` (`apps/mobile/src/lib/account-deletion/api.ts:80-84`, where only the status `none` counts as cancelled).
- Scope: retire the string (1); after BL-446 ships, check the contributor notice's promise against it (2); add the test ids the request file lists (3); add the test that kills the mutant (4).
- Done when: no unused `accountScheduledBody` remains; the Maestro flow finds every `deleteAccount.*` id it uses; a test fails if `held` is treated as cancelled; the PR body says what was checked for point 2.

#### BL-456 Backup tests' plaintext-leak scans see only the start of a recording
- Status: ready. Mode: agent. Owner: sync owner (S05: backup). Milestone: M5. Size: S. Depends on: none.
- Priority: Low.
- Satisfies: none given.
- Why: three backup tests scan what leaves the phone for the recording's plaintext: `apps/mobile/test/backup-e2e.test.ts:82-87`, `apps/mobile/test/backup-queue.test.ts:244-248` and `apps/mobile/test/backup-format.test.ts:119-125`. Since #362 (merged as a6519a4) each checks the recording's own 16-byte header, at every offset of every body or object, and one 64-byte window at a fixed byte (2000 in the e2e test, 4096 in the queue test, 1000 in the format test), and nothing else of the recording. Plaintext from the middle of a recording (bytes 100..164 or 65536..65600) planted in a body or object passes all three files. Not new to #362: the old 4-byte check had the same blindness. From the #362 review.
- Scope: check several 16-byte shingles of the recording at strided offsets across the whole take, each against every offset of every body or object, as #362 does for the header.
- Done when: a test that plants plaintext from bytes 100..164 and from bytes 65536..65600 of the recording in a body or object makes each of the three scans fail; the real upload still passes all three.

## Review follow-ups, wave 2 (28 Oct 2026)

Found in the independent reviews of 28 Oct 2026 (#370, #373, #375, #380, #381, #382 and the experience critics' passes) and filed here by the product agent from the coordinator's list, one entry per item, in the format of BL-446 to BL-456 (`Problem` and `Evidence` take the place of `Why`; `Gate` names the build the item must land before, or "none"). Every file:line cite was re-checked against `develop` at 4192a99, the tip when I last looked, and a moved line has the test title or key beside it; where a line is on an open PR's head, the entry says which PR. "Unverified" means the review said it and I could not find or run it. The brief's "later" is written as `blocked (PR #n merge)` where the PR was open when this was written; the status parser does not clear a PR blocker, so the product agent flips it when the PR merges. `needs-decision (...)` names who decides in the parenthetical (the BL-447 and BL-448 precedent) where no D-### or Q-### exists yet. Priorities are the product agent's call (none were given); the file tags only [Critical] and [High] in a heading, so these carry a `Priority:` line. Not entered: the P8a link-versus-pause decision (F02-U14), because #372 had not merged.

#### BL-457 Pin the See Plus note effect's dependency array, and use `announce()` there
- Status: ready. Mode: agent. Owner: mobile engineer (P6a: the Keep sheet), qa engineer. Milestone: M8. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem: the test for the See Plus note effect does not pin the effect's dependency array, so a missing or changed `[view.note]` passes. The test slices the source to the first `}, [view.note]);`, and a missing anchor makes `indexOf` return -1, which slices to almost the whole file, where every match still passes. Mutants n5, n5b and n5c survive (from the review of #370, not re-run here). The effect also calls `AccessibilityInfo.announceForAccessibility(note)` directly instead of the repo's `announce()`.
- Evidence: `apps/mobile/test/plus-gate.test.ts:139-141` (the slice runs from `const openingNote = React.useRef(view.note);` to `}, [view.note]);`); `apps/mobile/src/components/child/plus-gate.tsx:127-140` (the effect; the direct call is at `:134`, the dependency array at `:140`); `apps/mobile/src/lib/a11y.ts:53` (`announce()` queues behind VoiceOver and is a no-op on Android, where the live region at `plus-gate.tsx:199` already reads the note). Review of #370 (merged as 86ff1e2).
- Scope: add `expect(gate).toMatch(/\}, \[view\.note\]\);/)` and assert both slice indexes are >= 0 before slicing; change the effect to `announce()` from `@/lib/a11y` and update the test's match for the old direct call.
- Done when: the test fails if the dependency array is removed or changed (n5, n5b and n5c are killed or shown irrelevant), and the effect uses `announce()`.

#### BL-458 Pins for the refused-Save line and the shelf after a refused Erase, and the Book's first-mount subscribe window
- Status: ready. Mode: agent. Owner: mobile engineer (P5: letter page, Book, Recently deleted), qa engineer. Milestone: M4. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem: (1) mutant S3-x survives: typing in the "Write the words" field no longer clears the "Your words are still here" refused-Save line, and no test notices. (2) Mutant S6-g survives: the review's "stale rows after a refused Erase when the card is gone" (the shelf's `setRows` after an erase). (3) The Book reads its letters in the `useState` initialiser and subscribes in an effect, so an `entries` event between the initialiser read and the subscribe is not picked up until the next event. Unverified on a device.
- Evidence: (1) `apps/mobile/src/app/letter/[id].tsx:590-592` (`onChangeText` calls `setRefused(false)`), `:581`, `:599` (the line, `letter.writeWords.refused`), `:611` (`setRefused(true)`). (2) `apps/mobile/src/app/settings/recently-deleted.tsx:74-87` (`erase` reads the shelf again and calls `setRows(left)`, then `eraseOutcome` at `:84`); `apps/mobile/test/p5-critics.test.ts:278-292` pins `eraseOutcome` and the words, and `:294-298` source-pins the `const outcome = eraseOutcome(...)` line and the erased and kept toast branches. Not pinned: `setRows(left)` and the `gone` case (a refused erase when the card has already left, which shows no toast). (3) `apps/mobile/src/app/(tabs)/book.tsx:78` (initialiser) and `:102-105` (`reread` and `subscribe(reread)`; the comment says no second read at mount); `apps/mobile/src/lib/store.ts` has no change counter (its "version" mentions are schema and held-draft versions). Review of #373 (merged as 1ee20c8).
- Scope: (1) a pin that the typed-words field's `onChangeText` calls `setRefused(false)`; (2) a pin for the shelf's `setRows(left)` after an erase and for the `gone` outcome at the screen (the exact S6-g mutation is not in the repo: unverified); (3) a store change counter and a compare in the Book's effect, or one read in the effect when the list differs from the initialiser's; the owner picks.
- Done when: mutants S3-x and S6-g are killed; a test shows an `entries` event between the initialiser read and the subscribe is picked up at once.

#### BL-459 Pin that a join wait started with no name does not inherit the previous book's name
- Status: ready. Mode: agent. Owner: family owner (S04: the join wait), qa engineer. Milestone: M5. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem: `createJoinWaitStore().start()` called with a null name for a new book must not keep the previous book's name: production calls `start(childId, null)` and the name arrives later through `named()`. `start` writes the name as given, but no test pins it: the mutant `name: name ?? wait?.name ?? null` survives (review of #375, not re-run here).
- Evidence: `apps/mobile/src/components/family/join-wait.logic.ts:92-96` (`start`); production call `apps/mobile/src/app/invite/index.tsx:174` and the name at `:177` (`joinWait.named`); `apps/mobile/test/join-wait.test.ts:107-114` is the only newer-join test and it passes a name ("Ravi"), so a null name is never tried. Review of #375 (merged as 7390a93).
- Scope: add a test: `start('book-asha', 'Asha')`, then `start('book-other', null)`, and expect the wait to be `{ childId: 'book-other', name: null, since }`.
- Done when: the mutant is killed.

#### BL-460 Join wait and invite residuals from the #375 review
- Status: ready. Mode: agent. Owner: family owner (S04), analytics engineer (point 8), qa engineer (points 4 and 6). Milestone: M5. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (review of #375, merged as 7390a93; points 2, 4 and 5 are from the review and unverified on a device):
  1. Close (not Open) on the joined sheet at a later first-run step leaves no line and shows Continue, so a second book is possible: the wait is welcome-only (`apps/mobile/src/components/family/join-wait.logic.ts:75-77`, `joinWaitEnds`; `apps/mobile/src/components/family/join-wait.tsx:38-40`).
  2. The joined sheet keeps "on its way" and the bar in a stall (not located in code: unverified).
  3. A join with no name is still titled "Join a book": add a `joinedTitleUnknown` content key (`apps/mobile/src/app/invite/index.tsx:367` falls back to `a.title`; `packages/content/src/features/family.en.ts:78` and `:107`).
  4. iOS Keychain can survive app deletion, so S1-28 (b) and (k) may skip steps on a reinstalled phone (`docs/qa/DEVICE_TEST_PLAN.md:328-355`): say so in the plan.
  5. Offline Try again flickers (the phase flips to syncing for a moment), and Try again gives no feedback while the sync runs (`apps/mobile/src/components/family/join-wait.tsx:33` and `:36` hold the phase and its subscription, `join-wait.logic.ts:68` is the stall test, and `onRetry` at `join-wait.tsx:55-61` has no pending state).
  6. The dismissed-share-sheet web test with a `navigator.share` stub exists only as a scratch copy (not in the repo: unverified); commit it as a flow, next to `apps/mobile/e2e-web/j17-family.flow.ts`.
  7. A changed sign-off after a dismissed share makes a second invite: `draftFor` is keyed by the sign-off, so the draft is reused only while it is unchanged (`apps/mobile/src/app/invite/new.tsx:105-110`).
  8. `invite_created` fires per share-sheet opening, not per invite (`apps/mobile/src/app/invite/new.tsx:127`; `packages/analytics/src/catalog.ts:622`): the analytics owner decides what to count.
- Scope: take each point to a test or a one-line change, or record why it stays; point 7 and point 8 are decisions for the family and analytics owners.
- Done when: each point is fixed with a test, or recorded here as left as it is.

#### BL-461 Spec and test nits after the P7-7 corrections (#381): cover pin, `COVER_SIZES` comment, card-to-page wording, v1 PRD line, F13 enums
- Status: ready. Mode: agent. Owner: design systems (points 1 to 3), analytics engineer (point 5), content (point 4). Milestone: M11. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (review of #381, merged as 1afb0d0):
  1. S05's text says `book-cover.test.ts` pins the 96 pt case (`docs/design/EXPERIENCE_PASS_2026-10.md:311`), but no assertion pins Christopher and Alexandrina fading on the 96 pt (`thumb`) cover: `apps/mobile/test/book-cover.test.ts:150-157` cover `sm` and `:158` pins only "Wilhelmina Rose" at `thumb` (the test title at `:134` claims the 96 pt case).
  2. The `COVER_SIZES` comment says `thumb` is for "Add a child (S47) and the Export thumbnail (S43)" (`apps/mobile/src/components/book/book-cover.logic.ts:20`), but Add a child uses `sm` (`apps/mobile/src/components/child/add-child-form.tsx:98`) and only `apps/mobile/src/app/settings/export.tsx:166` uses `thumb`.
  3. `docs/design/EXPERIENCE_PASS_2026-10.md:3` and `:1767` say "card to page" without a build qualifier.
  4. `docs/prd/B-first-run-and-family.md:315` says "0 of 104 prompts" (v1 history). A requirement document is not edited here: a proposed change goes in the PR body for the founder.
  5. F13's `band_fit` and `prompt_shown` enums are in the spec (`docs/prd/v2/features/F13-prompts-reminders.md:339`, WP-F13-11 at `:378`) and in no code under `packages/` or `apps/mobile/src`.
- Scope: pin the 96 pt case for the two names; correct the comment and the spec lines; for point 5 either add the enums to the analytics catalogue (WP-F13-11) or mark the spec rows as not built.
- Done when: the 96 pt assertions exist and fail if the cover stops fading both names; points 2 and 3 are corrected; points 4 and 5 are settled by their owners.

#### BL-462 Content rules guard: follow-ups to the fold into `rules.test.ts` (#380, P7-5)
- Status: ready. Mode: agent. Owner: content, legal (point 6). Milestone: M11. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (review of #380, merged as 51c0c3e; lines on develop):
  1. The SURFACES row's button-name regex `/(?:button|cta)$/i` (`packages/content/test/rules.test.ts:1029`, in the per-surface test "keeps every button label to 22 characters, as written and with the Asha fixtures") differs from the P0 regex `/(?:button|cta|action)(?:short)?$/i` (`:891`, in the P0 test of the same title), so a `...CtaShort` or `...Action` leaf over 22 characters can bypass the row's button list. Use the P0 regex.
  2. The auth, family and deletion button lists (26, 17 and 8 entries: `packages/content/test/support/copy-surfaces.ts:290-319`, `:322-340`, `:342-351`; the auth list gained `account.staySignedIn` in #388) are not pinned by length or by set. BL-479 point 4 is the related ask that a row label in no list fails.
  3. The guard reads `features` keys only (the test "has a row or an opt-out with a reason for every key of `features`, and keeps the three P8 rows" starts at `rules.test.ts:983`, the check is `:989`): a `packages/content/src/features/*.en.ts` file not wired into `features/index.ts` is invisible. Add a `readdirSync` check.
  4. Opt-out reasons are length-checked only (`rules.test.ts:992`, the reason-length line of that same test). The `backup` and `billing` reasons (`copy-surfaces.ts:437`, `:438`) and the `reminders` reason (`:445`) should name their "we" lines (the reminders line has its own entry, BL-474). Billing's reason overstates "pinned word for word" (40 of 102 leaves, from the review: unverified). Six "Please try again" lines sit in opt-out files that the auth-only chat-bot-voice rule does not cover: `packages/content/src/features/export.en.ts:34`; `packs.en.ts:36`, `:38`, `:39`, `:40`; `billing.en.ts:116` (`restoreFailed`).
  5. No rule checks that `{child}` is still present in the deletion `what.staysNone` line (`packages/content/src/features/account-deletion.en.ts:20`): mutant B07 survives (it survived before #380 too).
  6. `docs/legal/in-app-disclosures.md:50` (v1.4.0) still quotes the old `billingCopy.store.promise` wording ("... are free, always."): a counsel note only.
- Scope: points 1 to 5 are test changes in the files #380 added, plus the copy decision about the six "Please try again" lines in point 4 (the content owner's); point 6 goes to counsel's next read.
- Done when: each point is fixed with a test that fails on its mutant, or recorded here as left as it is.

#### BL-463 After #383 retired `en.plus.promise`: the guard's case-sensitive regex, `en.plus.legal`, and stale dated documents
- Status: ready (#383 merged as 4192a99; this is what it did not do). Mode: agent. Owner: content, legal (point 2). Milestone: M11. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (the coordinator ruled the retirement of `en.plus.promise` and #383, merged as 4192a99, did it: key deleted, claims guard retargeted, `DELETED` at 42, three documents edited. From the delta review of #383):
  1. The claims guard's `/Read together|more children|more books|free, always/` has no `i` flag (`packages/content/test/rules.test.ts:545`, the `PROMISES` loop in "promises only what Plus gates in v1.0 (D-085, D-082)"), so a lowercase "read together" passes. Add the flag.
  2. `en.plus` is now `{ legal }` only and is read by no screen (`packages/content/src/strings.en.ts:945-958`, the `plus` object; the keys are registered text, which #383 left alone). Whether they stay as dead registered text, move, or go is a counsel decision.
  3. Stale dated documents still name the old key or the old sheet: `docs/prd/v2/features/F21-store-web.md:219`, `docs/prd/C-habits-pricing-settings.md:306`, `docs/prd/v2/reviews/R4-privacy-trust.md:37`, `docs/design/reviews/P6B_CRITICS_PASS_2026-10-28.md:97`, and the rest of `docs/tdd/08-payments-entitlements.md:409-416`, which names `plus-sheet.tsx` and `plus.legal.renewTrial` and `plus.legal.links`; none of these exist (the sheet is `apps/mobile/src/components/child/plus-gate.tsx`, and the legal keys are `renewAnnual`, `renewMonthly`, `renewNoTrialAnnual`, `renewNoTrialMonthly` and the link labels). Not here: `docs/prd/PRD.md:892`, `docs/prd/v2/features/F14-plus.md:213` and `docs/tdd/08-payments-entitlements.md:413`, which #383 rewrote.
- Scope: add the `i` flag with a mutant check (point 1); take point 2 to counsel; for point 3 the document owners add a correction line or update the text (requirement documents: a proposed change goes in the PR body).
- Done when: a lowercase "read together" in the scanned Plus copy fails the guard; counsel's answer on `en.plus.legal` is recorded here; the listed documents no longer name keys or files that do not exist, or are marked as dated.

#### BL-464 Find the cause of the web e2e boot flake `local_db_migration_failed:1`, then harden the seeded flows
- Status: ready (#382 merged as 66e6d5a; the finding is in its body). Mode: agent. Owner: qa engineer, sync owner (S03: the migration). Milestone: M12. Size: M. Depends on: none.
- Priority: Medium.
- Gate: none.
- Satisfies: none given.
- Problem: an uncaught page error with a blank page on the first `seeded()` page load of the web e2e run: 3 of about 11 j18 runs at machine load 16 and above, never at low load, not reproduced (from the #382 write-up). `MigrationError` carries only the code, and `pageerror` does not show `error.cause`, so the report names no cause.
- Evidence: PR #382's body, section "Finding for the backlog" (merged as 66e6d5a); `apps/mobile/src/lib/db/migrations.ts:61-62` (migration 1 is one large synchronous `db.exec`, the strongest candidate: unverified) and `:370-376` (`MigrationError`); `apps/mobile/src/dev/store-ready.web.ts`; `apps/mobile/e2e-web/support/journey.ts:36` (`seeded()`); `apps/mobile/e2e-web/j09-book.flow.ts:35` (`/\w+ \d+ to \w+ \d+/` presumes the en-US date order); `apps/mobile/e2e-web/j04-tonight.flow.ts:119` (J04g: a global fixed clock breaks it, so do not copy one into CI).
- Scope: (1) log `error.cause` through an init script in the `app` fixture that listens for both `error` and `unhandledrejection`, using `console.log` and not `console.error`; (2) if the cause is `Sync operation timeout`, warm `scribe.db` itself and retry once in `store-ready.web.ts` (web preview only, never native); (3) if it is a lock, make `seeded()` do one `goto`; (4) if migration 1 is the cause, split its single `db.exec`; (5) make the j09 date assertion independent of the date order.
- Done when: the next flake names its cause in the log, and the chosen fix runs 50 loaded boots without the error.

#### BL-465 Rebase #161 (export consent history) and #163 (server-product legal set) onto develop
- Status: ready. Mode: agent. Owner: export owner (#161), legal (#163). Milestone: M9. Size: M. Depends on: none.
- Priority: Medium.
- Gate: none named by the reviews; BL-323 (#161) satisfies LEGAL-REQ-034 for signed-in builds, so the coordinator sets the build.
- Satisfies: LEGAL-REQ-034 (BL-323, through #161).
- Problem: #161 (a draft) and #163 conflict with develop and need rebases (from the 28 Oct reviews; the independent review and I saw `mergeable: false`, state `dirty`, for both; GitHub reads it as null while it recomputes). #161's export goldens will also touch the e7 letter and the manifest hash that #373 changed, so its goldens must be regenerated after the rebase and not merged by hand.
- Evidence: #161 (a draft, head 1087eac, `feat/export-consent-history`) and #163 (head 53a7622, `docs/legal-v1-server`), both open and based on develop; `apps/mobile/test/__golden__/export-asha/letters/Asha/2026-08/2026-08-10_e7.txt`, `manifest.json` and `manifest.sha256` changed in #373 (1ee20c8).
- Scope: rebase each onto develop; regenerate #161's goldens and check the `account.json` consent-history fields still validate; re-read #163 against develop's docs.
- Done when: both PRs are mergeable and their checks pass on the rebased head.

#### BL-466 Repo hygiene in the journey scripts and `.gitignore`
- Status: ready. Mode: agent. Owner: platform (point 1), qa engineer (points 2 and 3). Milestone: M12. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (from the 28 Oct reviews; this entry does not touch `docs/release/journey`):
  1. `.gitignore` has `node_modules/` (`.gitignore:4`), which does not match a symlink named `node_modules`; a symlinked `node_modules` shows as untracked (I saw it in a worktree). Drop the trailing slash.
  2. `apps/mobile/e2e-web/support/pack-journey.sh:28` zips `journey` leaving out dotfiles and `*.html` only, so the gitignored `INDEX.text-only.md` that `build-index.mjs --text-only` writes (`build-index.mjs:13-14`) travels in the zip. Exclude it.
  3. `apps/mobile/e2e-web/support/build-index.mjs:72-78` checks `fs.existsSync(stepsDir)` and then `readdirSync`, so a `steps` that is a file ends in a raw ENOTDIR (code reading, not run). Check that it is a directory.
- Scope: the three changes above, each with a test or a script check where one exists (`build-index` has a unit test).
- Done when: a symlinked `node_modules` is ignored; the packed zip has no `INDEX.text-only.md`; `build-index` prints its own message for a `steps` file.

#### BL-467 Pins and guards: recovery export re-entrancy, DrawingBoundary, the prompt library version, Android double announce, mutation survivors
- Status: ready. Mode: agent. Owner: mobile engineer, qa engineer, content (point 3). Milestone: M11. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (from the 28 Oct reviews):
  1. The recovery export button is already guarded in `PlainScreen`: `Pressable disabled={a.busy}` with `accessibilityState` busy and disabled (`apps/mobile/src/components/resilience/plain-screen.tsx:160-161`), pinned by `apps/mobile/test/plain-screen.test.ts:93-96` ("a busy button cannot be pressed twice"). Do not change that path. What remains is narrow: `exportReadable` itself has no guard (`apps/mobile/src/components/resilience/launch-recovery.tsx:25-32`), so a second press in the same frame, before `busy` has rendered, would start a second export (unverified). A ref guard inside `exportReadable` would close it.
  2. `DrawingBoundary` (`apps/mobile/src/components/resilience/plain-screen.tsx:45`, mounted at `:127-129`) has a source-text pin only (`apps/mobile/test/plain-screen.test.ts:88`) and no test that a throwing drawing leaves the screen working.
  3. `PROMPT_LIBRARY_VERSION` (`packages/content/src/prompts.ts:13`, value 3, read at `apps/mobile/src/app/(tabs)/index.tsx:223`) is named by no test, so a change to the library can ship without a bump.
  4. Android double announce: `announce()` is a no-op on Android because a live region carries the line (`apps/mobile/src/lib/a11y.ts:46-54`), but direct `AccessibilityInfo.announceForAccessibility` calls bypass it: `plus-gate.tsx:134` (BL-457), `plain-screen.tsx:109`, `apps/mobile/src/components/gate/age-gate-screen.tsx:67`, `apps/mobile/src/app/settings/export.tsx:117` and `apps/mobile/src/app/listen.tsx:120`, `:167`, `:255`, `:259`. Which of these also sit beside a live region is unverified.
  5. Mutation survivors of the "M3h" kind: the list is in the review reports and not in the repo (unverified). Ask the reviewer for it before starting this point.
- Scope: a guard inside `exportReadable` and a test for point 1; a behaviour test for point 2; a test that pins the version against the library for point 3; point 4 moves each direct call to `announce()` or removes the live region, per spot; point 5 starts from the reviewer's list.
- Done when: each point is fixed with a test that fails on its mutant, or recorded here as left as it is.

#### BL-468 Device and layout checks: a deep arrival on a cold Book, and the stacking threshold
- Status: ready. Mode: pair (device checks on a phone). Owner: qa engineer, design systems. Milestone: M11. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (from the 28 Oct reviews):
  1. Device check D2 is defined in `docs/design/reviews/P5_CRITICS_PASS_2026-10-28.md:196` ("The first letter's arrival (S1)": a fresh install, never open the Book tab, keep a typed letter from Write; does the new card wash on the Book, and is it in view?). It is not in `docs/qa/DEVICE_TEST_PLAN.md`. The scenario in this entry, a deep arrival in a long book on a cold launch, is a new check and is unverified anywhere. The code that scrolls: `apps/mobile/src/app/(tabs)/book.tsx:143` (`scrollToLocation`) and `:328` (`onScrollToIndexFailed`).
  2. Two buttons stack at xxxLarge, and the repo documents both thresholds. For xxxLarge: `useIsLargeText()` at `apps/mobile/src/components/ui/button.tsx:239` (1.353 at `apps/mobile/src/lib/a11y.logic.ts:21-23`), whose doc comment at `button.tsx:233-237` cites COMPONENTS 2.18 and TDD 09 A11Y-F10, and `docs/design/COMPONENTS.md:17` ("stacks from xxxLarge text"). For accessibility sizes (AX1 is 1.786: `a11y.logic.ts:10`, `:16-18`): the S30 Visual text as the P5 critics' pass quotes it ("at accessibility sizes the two buttons stack, full width, Next letter first", `docs/design/reviews/P5_CRITICS_PASS_2026-10-28.md:160`, for `docs/design/EXPERIENCE_PASS_2026-10.md:884`; I could not find that exact sentence in the spec file: unverified).
- Scope: add the deep-arrival check to the device test plan with its steps; give the spec owner both sources and ask which threshold applies to Read together's two buttons and which to `ButtonRow` generally, then pin it.
- Done when: the plan has the check and a phone result is recorded; the threshold is decided and pinned in `a11y.logic.test.ts`.

#### BL-469 The leave sheet has no way to close in the sheet when the sign-in gate replaces its buttons
- Status: ready. Mode: agent. Owner: family owner (S04). Milestone: M5. Size: S. Depends on: BL-444.
- Priority: Low.
- Gate: none. Latent today: `LEAVE_BOOK_OFFERED` is false (`apps/mobile/src/lib/family/entry.logic.ts:46`, D-113), so `/invite/leave` shows "coming soon" in every build. BL-444 turns the leave flow on before build 3 and touches the same screen, so do this with or after BL-444.
- Satisfies: none given.
- Problem: on the leave sheet the Leave and Stay buttons are children of `AccountGate`, and in every state where the person cannot sync the gate shows one next-step button instead (Sign in, "Agree and sync" after a declined consent, Try again). The sheet's own Stay button is then not on screen, and this sheet is the one `SheetFrame` in the file without a header close. The join sheet does not have the same dead end: it passes `closeLabel` and has "Not now" on its sign-in view. From the 28 Oct reviews (the brief names it as the join sheet gate; the code shows it on the leave sheet).
- Evidence: `apps/mobile/src/app/invite/leave.tsx:120-133` (`SheetFrame` without `closeLabel`, with the buttons inside `AccountGate`; the other three `SheetFrame`s in the file, at `:56`, `:80` and `:90`, pass `closeLabel`); `apps/mobile/src/lib/auth/ui.tsx:305-371` (`AccountGate` states); the join sheet at `apps/mobile/src/app/invite/index.tsx:302` and `:311`. Whether the system swipe closes the leave sheet is unverified.
- Scope: give the leave sheet a close outside the gate (the same `closeLabel` the other sheets pass, or a quiet "Not now" under the gate's button), with the words in `packages/content`; fold it into BL-444's leave-flow work if that lands first.
- Done when: after a declined consent the leave sheet has a visible way to close, with a test on the sheet's source or view.

#### BL-470 Typed words for a recording with no words that has been sent, or that failed to send
- Status: needs-decision (the sync owner and the data architect decide part 2; part 1 is client only and can be decided now; no D-### or Q-### exists yet, as with BL-447 and BL-448). Mode: pair. Owner: sync owner (S03), data architect (S02). Milestone: M5. Size: M. Depends on: none.
- Priority: Medium.
- Gate: none.
- Satisfies: none given.
- Problem: a spoken letter whose words came back empty can take typed words only while it has never been to the server: the rule needs `server_version IS NULL` and no outbox row with `sent_at` set or `attempts > 0`. Two questions follow, and they are independent:
  1. Client only, decidable now: should a failed attempt (`attempts > 0` with no `sent_at`) close the offer? Nothing reached the server in that case, unless an attempt was accepted and its answer lost (unverified).
  2. Server: a synced letter with no words has no way to receive the person's words, because the server's first raw is fixed once the letter is there. Does the server get an edit path for a letter's first words?
- Evidence: `apps/mobile/src/lib/db/repos/entries.ts:261-264` (the condition) and `:288-295` (`canTypeWords`); `apps/mobile/src/lib/store.ts:527-539` (`setTypedWordsForWaitingEntry`); the page shows the card through `wordsCardKind({ own, words, canWrite: words === 'nobodySpoke' && canTypeWordsFor(entry.id) })` (`apps/mobile/src/app/letter/[id].tsx:317`, rendered at `:393`; `apps/mobile/src/components/book/words-card.logic.ts:21-26`); P5 critics' pass S3 (`docs/design/reviews/P5_CRITICS_PASS_2026-10-28.md:54-59`); review of #373 (merged as 1ee20c8).
- Scope: part 1: decide, and if a failed attempt should not close the offer, change the condition and test it with a never-sent letter after a failed attempt. Part 2: decide whether the server gets an edit path for a letter's first words. If yes, build it (a migration, `approve-migration`) and offer "Write the words" on a synced letter; if not, say so on the letter page.
- Done when: both decisions are recorded here, and the offer matches what the client and the server can take.

#### BL-471 Erase now in a build that syncs: pass `serverErase` once the server's erase reaches every system
- Status: needs-decision (sync owner and data architect: is the reach of WP-F17-10 complete). Mode: pair. Owner: sync owner (S03), data architect (S02). Milestone: M9. Size: S. Depends on: none.
- Priority: Medium.
- Gate: none stated; in alpha build 2 (`preview`, servers on) a deleted letter waits its 30 days.
- Satisfies: F17-REQ-025 (P0, `docs/prd/v2/features/F17-settings-privacy.md:393`: Erase now is hidden in a sync build until the server erase op ships), F16-REQ-024 (`docs/prd/v2/features/F16-sync.md:279`).
- Problem: Recently deleted hides Erase now in a build that syncs, although the client and server halves of the erase are merged. The spec says to show it only once the server erase exists (S39 and S63).
- Evidence: `apps/mobile/src/app/settings/recently-deleted.tsx:60` (`shelfActions({ sync: capabilities.sync })`, no `serverErase`); `apps/mobile/src/components/book/shelf.logic.ts:96-100`; the client half: `eraseEntry` (`apps/mobile/src/lib/store.ts:726`, doc comment at `:722-725`) queues `entry.erase` through `enqueueEntryErase` at `:758`; the server half in `supabase/migrations/20261016000000_sync_v1_server.sql` (header: WP-F16-13), although WP-F16-13 is still "Not built" in the work-package table (`docs/prd/v2/features/F16-sync.md:433`); the WP-F17-10 link is `docs/prd/v2/08-delivery.md:585` (S02: WP-F17-10 with the WP-F16-13 server erase, reaching every M14 system), and WP-F17-10's own row (`F17-settings-privacy.md:573`) lists consent and deletion pieces. P5 critics' pass S5 (`docs/design/reviews/P5_CRITICS_PASS_2026-10-28.md:68-73`). Whether the server's erase reaches every system F17 8.4 lists is unverified.
- Scope: ask S03 and S02 whether WP-F17-10's reach (the backup object and every M14 system) is complete. If it is, pass `serverErase: true` (a one-line change in the screen and its test) and check S63's four acceptance lines on two phones; if not, write the date of the flip next to this entry.
- Done when: the answer is recorded here; with a yes, Erase now shows in a sync build and the two-phone check is recorded.

#### BL-472 A baby born early can leave the before-birth state only after the due date passes
- Status: ready. Mode: agent. Owner: mobile engineer (S13: children). Milestone: M4. Size: M. Depends on: none.
- Priority: Medium. B-REQ-005 is P0 (`docs/prd/B-first-run-and-family.md:167`), so Medium is the floor; raise it to High if expecting books are in the alpha (unverified: I do not know that).
- Gate: none.
- Satisfies: B-REQ-005, as PRD V2 F12-U16 cites it (`docs/prd/v2/features/F12-children.md:159`: "{child} is here?" sets the birth date; PRD B F2 step 3 promises the same row at `docs/prd/B-first-run-and-family.md:64`).
- Problem: the only way from an expecting book to a born one is the Settings "Set the birthday" card, and it shows only after the due date has passed (`bornCardShown` requires `dueDatePassed`). A baby born before the due date has no row to say so. The specs promise a "{child} is here?" row on the child row; no string or screen for it exists in the app. From the 28 Oct reviews (the review is not named in the brief).
- Evidence: `apps/mobile/src/components/child/child-settings.logic.ts:26-34` (`bornCardShown`), used at `apps/mobile/src/app/settings/children/[id].tsx:59`; `packages/content/src/strings.en.ts:1078` (`childrenExtra.edit.born.confirm`, "Set the birthday"); `docs/prd/v2/features/F12-children.md:159`; `docs/prd/v2/features/F13-prompts-reminders.md:180` (F13-U14: after the due date nothing asks whether the baby is here, and the parent sets the birth date in Settings by F12-U16); no match for "is here?" in `apps/mobile/src` or `packages/content/src`.
- Scope: add the "{child} is here?" row to the child's settings while the book is expecting, leading to the birth date step the card uses, with the words in `packages/content` and no countdown or prompt (F09-REQ-021, F13-U14).
- Done when: an expecting book shows the row before its due date, setting the birth date turns the book into a born one (letters before it stay in Before You), and a test covers the row's visibility.

#### BL-473 The Family tab's dateline for a book that is not born yet
- Status: ready. Mode: agent. Owner: mobile engineer (S04: the Family tab), design systems. Milestone: M5. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem: for a book whose child is not born yet, the Family tab's dateline is only the day: `ageText` returns null without a birthday, so `tonightDateline` falls back to the date. Tonight shows the name and "Before You" for the same book (fixed in #376).
- Evidence: `apps/mobile/src/app/(tabs)/family.tsx:191` (`tonightDateline(child, ageText(active, today), dayDate(today))`); `apps/mobile/src/lib/dates.ts:69-73` (`ageText`); `apps/mobile/src/components/tonight/draft-card.logic.ts:215-217` (the fallback); Tonight's label `tonightStageLabel` (`apps/mobile/src/components/tonight/prompt.logic.ts:33-36`, used at `apps/mobile/src/app/(tabs)/index.tsx:191`). From the 28 Oct reviews.
- Scope: use `tonightStageLabel` on the Family tab so a not-yet-born book reads like Tonight's dateline (the spec says "the dateline as on Tonight": `docs/design/EXPERIENCE_PASS_2026-10.md:1415`), with a test beside the Tonight one. Also update the documented fallback ("With no age it is the day's date (the Family tab)": `apps/mobile/src/components/tonight/draft-card.logic.ts:211-213`) and the pin that holds it (`apps/mobile/test/draft-card.test.ts:253`), which is the fix site for the day-only fallback.
- Done when: a before-birth book shows its name and "Before You" in the Family tab's dateline, and a test covers it.

#### BL-474 Notification copy says "we will keep it": a "we" outside any sanctioned promise
- Status: needs-decision (a VOICE ruling by the content owner and the coordinator: may notification copy say "we"; it needs a ruling and not just a fix because `packages/content/VOICE.md` has no rule on it, while the surface rules for auth, family and deletion allow "we" only on listed keys). Mode: pair. Owner: content. Milestone: M4. Size: S. Depends on: none.
- Priority: Medium.
- Gate: none.
- Satisfies: none given.
- Problem: the evening reminder titled "Tonight's letter" says "Say it out loud and we will keep it." The "we" is not one of the sanctioned promises, and the line is notification copy (the reviewer called it live). It is written twice.
- Evidence: `packages/content/src/features/reminders.en.ts:15` (`neutral.evening[1].body`), duplicated at `packages/content/src/strings.en.ts:620` (`notifications.evening`); found in the review of #380 (merged as 51c0c3e) as pre-existing; the guard side is BL-462 point 4.
- Scope: rule whether notification copy may say "we". If not, reword both lines the same way, through the content owner, and add a content rule that fails on a "we" in reminder copy outside the ruled list.
- Done when: the ruling is recorded here, both lines match it, and the rule exists.

## Review follow-ups, wave 3 (30 Oct 2026)

Found in the merged PR bodies of #372 (the sign-in code step), #387 (the spec as built), #388 (the sign-out wait, BL-451) and #389 (the journey record), in the independent review of #390 (spec journey ids, merged as 6d8676d), and in the coordinator's P7 check. Filed here by the product agent from the coordinator's list, in the format of BL-457 to BL-474. Every file:line cite was re-opened on `develop` at 6d8676d, the tip after #390 merged (the code, flows and journey record are as at 54e522d; #390 changed only the spec and five lines of this file). "Unverified" means I could not find or run it. `needs-decision (...)` names who decides in the parenthetical (the BL-447, BL-448 and BL-474 precedent). Already filed and cross-referenced, not repeated: BL-449 (a sign-out wait on another account's rows) and BL-450 (an Apple revocation noticed at launch). BL-451's three items shipped in #388 (merged as e3dbbe2). Not entered: anything from the P6c and Delete account critics' passes (still being written), and anything about the sheet or plan doc. Priorities are the product agent's call; the file tags only [Critical] and [High] in a heading, so these carry a `Priority:` line.

#### BL-475 Sign-in code step words: five claims that need a verdict
- Status: needs-decision (content with the claims-test owner for points 1 to 4; counsel for point 5; no D-### or Q-### exists yet, as with BL-447, BL-448 and BL-474). Mode: pair. Owner: content, auth owner (point 2), mobile engineer (point 4: P8a), legal (point 5). Milestone: M5. Size: S. Depends on: none.
- Priority: Medium.
- Gate: none stated. The code step exists only in a build with sign-in on (`preview`, alpha build 2).
- Satisfies: none given. Cited: F02-U14 (`docs/prd/v2/features/F02-account.md:168`).
- Problem and evidence (from #372's body and #387; every cite re-opened at 6d8676d; points 2 to 4 are my reading of the code and were not run on a phone: unverified):
  1. "Your letters are safe on this phone." has no verdict. The claims inventory lists it as row A2, "unverified", with "Local storage durability not opened" (`docs/reviews/2026-10-claims-inventory.md:120`; the row's cites `auth.en.ts:48, :103, :111, :113, :114` are from e7d96d58 and have moved). The words are `lettersSafe` (`packages/content/src/features/auth.en.ts:5`), also said under the code field since #372 (`:79`, shown at `apps/mobile/src/app/(auth)/sign-in/code.tsx:275-279`), in `errors.network` (`:115`), `session_expired` (`:123`), `consent_unavailable` (`:125`), `unknown` (`:126`) and `sheet.notConfigured` (`:52`). `errors.code_paused` says "Your letters are safe." without "on this phone" (`:118`). The claims test the inventory names (R2-07, `claims-inventory.md:3`) needs a verdict to pin, and its owner needs to know the line is unverified. `packages/content/test/rules.test.ts:271` already requires the words in `en.errors` (the save-failure copy).
  2. "The link in the newest email still works" (`auth.en.ts:85`, `code.pausedOtherWays`, said with `code_paused` at `code.tsx:177`) is true only while the newest email is under 15 minutes old. The link and the code share one expiry; the documented setting is `otp_expiry = 900` (`supabase/auth-email.md:70`, `:151`; `packages/emails/scripts/export-supabase.ts:43`), but the hosted value is unverified: `supabase/config.toml` does not set `otp_expiry`, `auth-email.md:70` says "if the founder keeps PRD A's 1 hour, set 3600", and claims row A3 says the sign-in email settings are hosted settings. First confirm the hosted value: if it is 3600 the line is true through the whole pause and this point falls. The pause runs 15 minutes after the fifth wrong code (`apps/mobile/src/lib/auth/errors.logic.ts:68-69`, `:75-83`). A person who typed five wrong codes at minute 14 is paused until minute 29, and the link ended at minute 15; the line reads the same all through. The spec's rule is no count of minutes in this line (`auth.en.ts:81-84`; `packages/content/test/server-surfaces-auth.test.ts:165` fails on a digit or "minute"), so a fix that adds a number goes back to the spec owner. Also, `code_paused` says "in 15 minutes" and does not change while the pause runs (`code.tsx:177`): my reading, not from the reviews.
  3. "so does signing in with Apple or Google": Google is offered only on iOS with both client ids set (`apps/mobile/src/lib/auth/google.ts:22-23`, `:38-40`; `apps/mobile/src/app/(auth)/sign-in/index.tsx:97`, `:129-131`), and no profile in `apps/mobile/eas.json` sets either; whether EAS secrets do is unverified. Apple is offered when `appleSignInAvailable()` says so (`index.tsx:62`, `:128`). The server can say no as well: `supabase/config.toml` has `[auth.external.apple]` and `[auth.external.google]` with `enabled = false` (`:41-42`, `:46-47`). That file is the local stack's; whether the hosted project enables either provider is a hosted setting and is unverified (as with `otp_expiry`, point 2). The line names ways the build or the project may not offer.
  4. A book is not a letter. "Your letters are safe on this phone." shows when `useChildren().active` is set (`code.tsx:72`, `:275-279`), the has-a-book signal. A newborn's empty book, or any book with no letters yet, makes the phone "hold a book" where the copy says letters (#372 names the signal). BL-452 point 3 is the same fault in the "on this phone" error lines.
  5. `sensitiveConsent.declineHelp` ("If you keep it on this phone, syncing and sharing stay off.", `packages/content/src/strings.en.ts:872`) is counsel's registered text, and the consent step shows it as written (`apps/mobile/src/app/(auth)/sign-in/consent.tsx:375`). #372 stopped the account gate showing it as a status (`apps/mobile/src/lib/auth/ui.tsx:299-303`, the doc comment). It rides in the counsel relay with the P8a critics' S3, the shared title on Terms and sensitive data (`docs/design/reviews/P8A_CRITICS_PASS_2026-10-28.md:52`; the relay doc is not in the repo). Its comment still says "v1.0 has no backup (D-059)" (`strings.en.ts:871`), and `docs/design/EXPERIENCE_PASS_2026-10.md:2069` (C7) asks counsel to re-read it.
- Scope: record a verdict per point. (1) A verdict for row A2 on evidence: whether anything on the sign-in, failed sign-in or sign-out path removes a letter from the phone (A-REQ-033, F16: a sign-out never drops a queued letter). If it is true of that path, say so in the row and let the claims test pin it; if the line reads as a promise about a phone that is reset or replaced, counsel decides whether it stays. (2) Either the line says the link works only while it is true, or it drops the link claim and points at Send a new email, or the risk is recorded and accepted. (3) Name only the ways the build offers and the project enables, or accept. (4) Pick one: gate the line on at least one letter in the active book (`apps/mobile/src/lib/store.ts:625`, `listEntries()`), or reword it for a book. (5) Counsel answers; nothing changes before.
- Done when: each point has its verdict recorded here; where it is "not true as written" the words change in `packages/content` through the content owner and the pinned words move with them (`packages/content/test/server-surfaces-auth.test.ts:34`, `:117`, `:118`); row A2 in the inventory carries a verdict, or the claims-test owner says why not.

#### BL-476 Sign-in code step: say when the pause ends, and give a way to Apple and Google
- Status: ready. Mode: agent. Owner: mobile engineer (P8a: the sign-in sheet), content (the words), design systems (point 2: review), qa engineer. Milestone: M5. Size: M (one PR per point is fine). Depends on: none.
- Priority: Medium.
- Gate: none. The code step exists only in a build with sign-in on.
- Satisfies: none given. Cited: F02-U14 (`docs/prd/v2/features/F02-account.md:168`, "Wait, or Send a new email") and A-REQ-027 (`:210`).
- Problem and evidence (#372's "Known" and its review; code at 6d8676d; not run on a device: unverified):
  1. The field comes back silently. When the 15 minutes end, a timer re-renders, the field is editable again and the paused line goes (`apps/mobile/src/app/(auth)/sign-in/code.tsx:108-115`, `:249`). The paused line is the live region (`ErrorLine`, `:273-274`), so when it goes nothing is spoken, and focus is not moved: it moves only after a wrong code (`:139`) and at mount (`autoFocus`, `:251`). On Android `announce()` does nothing (`apps/mobile/src/lib/a11y.ts:53-54`), so a line there needs a live region.
  2. A person on the code step has no direct way to the other doors. The step offers Open Mail, Send a new email, Use a different email and Trouble signing in? (`code.tsx:288-307`), and Not now in the header (`:181`). Apple and Google are on the first step only (`apps/mobile/src/app/(auth)/sign-in/index.tsx:128-131`); from the code step the way is Use a different email (`code.tsx:301-305`, back to the email step) and then back again (`apps/mobile/src/app/(auth)/sign-in/email.tsx:65-68`), which nothing on the step signposts. While paused the line says Apple or Google work, and a person who reads it has to find them.
- Scope: (1) when the pause ends, say once, calmly and without a count, that a code can be typed again (a new key in `authCopy.code`, words by the content owner) in a polite live region, and move focus to the field; (2) the owner picks one in the PR and says why: a quiet row on the step that goes back to the first step (new words), the provider buttons on the step, or, with BL-475 point 3's answer, words that say where the other ways are. A pick that adds a button gets design systems' review.
- Done when: (1) a test shows the line and the focus after the clock passes the pause end (a source pin in `apps/mobile/test/server-surfaces-auth-screens.test.ts`, and J22j's clock path in `apps/mobile/e2e-web/j22-sign-in.flow.ts:397`); (2) the code step reaches Apple or Google in one tap, or the line no longer says they work, with the pick and the reason in the PR body.

#### BL-477 A-REQ-027: the wrong-code pause lives in memory, so a restart clears it
- Status: needs-decision (the spec owner and the founder; no D-### or Q-### exists yet, as with BL-470 and BL-474). Mode: pair. Owner: auth owner (S01), privacy engineer (option b's key). Milestone: M5. Size: S. Depends on: none.
- Priority: Medium. A-REQ-027 is P0, so Medium is the floor; the server's own limit holds either way.
- Gate: none.
- Satisfies: A-REQ-027 (P0, `docs/prd/v2/features/F02-account.md:210`: "Given 5 wrong codes for one address in 15 minutes, Then entry pauses 15 minutes on the device").
- Problem and evidence (from #387's body, "Proposed change for the spec owner"; re-opened at 6d8676d): the wrong-code times are a `Map` in module memory (`apps/mobile/src/lib/auth/pending.ts:72`; read at `:103-104`, written at `:107-110`, "Memory only" in the comment at `:102`), so an app restart clears the pause and only the server's own per-IP verify limit holds (PRD A puts it at "30 per 5 min per IP", `docs/prd/A-entry-and-auth.md:157`: unverified against Supabase). The v2 requirement says "on the device", which reads as persisted; PRD A's own A-REQ-027 has no such words (`:157`). The requirement's test is unaffected. A constraint on option (b), as the code reads it: PRD A F6.2 says the install remembers the last sign-in method "never the email" (`A-entry-and-auth.md:82`; that is the last-method hint, not a wrong-code list), and the code step's header extends that to the address (`code.tsx:7-9`, "the address is never stored"). Whether a persisted list may be keyed by a hash of the address, or must be one count for the phone, is the privacy engineer's call.
- Scope: the spec owner and the founder choose one. (a) Amend the requirement to "while the app stays open; a restart clears the pause and the server's own limit holds" (the proposed wording is in #387's body and in this PR's body; the requirement is not edited here). (b) S01 persists the times under a key that is not the address, with the privacy engineer's read. F02-U14's row (`F02-account.md:168`) says nothing about persistence and stays.
- Done when: the choice is recorded here and, as the founder decides, in `docs/DECISIONS.md`; with (a) the requirement text says what is built; with (b) a test shows five wrong codes, a fresh module state and the pause still holding, with no address in storage.

#### BL-478 The sign-out wait: a stale poll, a false "ended early", and an Apple revocation during the wait
- Status: ready. Mode: agent. Owner: auth owner (S01), sync owner (S03: `pendingUploads`). Milestone: M5. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low. All three are rare and none removes a letter from the phone (from #388's "Known").
- Gate: none.
- Satisfies: A-REQ-033 (P0, `docs/prd/v2/features/F02-account.md:213`, in part: that row is about a revocation at launch, which is BL-450).
- Problem and evidence (#388's "Known" N3, N4 and its last bullet; code reading, none reproduced: unverified):
  1. A stale in-flight poll can end a second wait early (N4). The wait's effect polls every 10 s with `pendingUploads().then((n) => n === 0 && done())` (`apps/mobile/src/lib/auth/session-provider.tsx:259-273`, the promise at `:267`); its cleanup clears the interval and not a promise already in flight. `UPLOADS_DRAINED` names no wait (`apps/mobile/src/lib/auth/machine.logic.ts:187-189`), so a `done` that resolves after "Stay signed in" and a second sign-out ends the second wait. The revocation effect above it already guards with `alive` (`session-provider.tsx:246-255`).
  2. A false "ended early" (N3), rarely: when a gate answer turns sync off just after the outbox emptied and before that was noticed, the machine ends the wait with sync off (`machine.logic.ts:144-156`) and `waitEndedEarly` reads that as early (`apps/mobile/src/components/auth/account-view.logic.ts:57-61`), so the signed-out page says the newest letters are kept on this phone when they were sent. The window is narrower than the 10 s poll: the same effect also subscribes `onUploadsDrained(done)` (`session-provider.tsx:263`), so the engine's drained event ends the wait at once and the poll (`:264-268`) is the second route; how often a gate answer lands between the emptying and that event is unverified.
  3. An Apple revocation noticed during a sign-out the person asked for is dropped, and not tried again until the next launch (#388). The check runs once per signed-in user (`session-provider.tsx:244-256`, deps `[signedInUser]`), and `SIGN_OUT_REQUESTED` is taken only from `ready`, `needsConsent` and `checkingConsent` (`machine.logic.ts:179-181`), so one that arrives while `signingOut` is ignored. After "Stay signed in" the phone is `ready` with a revoked credential until a relaunch. BL-450 is the same requirement at launch; BL-449 is the other open sign-out wait item.
- Scope: (1) give each wait an identity, or an `alive` flag on the effect, so a stale `done` does nothing; (2) read the outbox once more before the page says "ended early", or have the machine carry whether the queue was empty; (3) check a revocation again when a wait is cancelled, or hold it for the end of the wait; the owner picks and says why. If (3) needs a change to A-REQ-033, the PR body drafts it for the founder; the requirement is not edited here.
- Done when: each point has a test in `apps/mobile/test/account-view.test.ts` or `auth-machine.test.ts` that fails on its mutant: a late `done` after a cancel and a second sign-out ends nothing; a gate answer after a drained queue shows no early-end line; a revocation during a wait is acted on after "Stay signed in" or at the wait's end.

#### BL-479 The Account page's sign-out wait: the early-end line's home and words, accessibility, and the 22-character rule's reach
- Status: ready. Mode: agent. Owner: mobile engineer (P8a: account view), content (point 2: the words), qa engineer (point 4). Milestone: M5. Size: M (one PR per point is fine). Depends on: none.
- Priority: Medium for point 3 (a screen-reader gap), Low for the rest.
- Gate: none. A build 2 follow-up to BL-451 (shipped in #388).
- Satisfies: none given.
- Problem and evidence (#388's "Known" N1, N2, N8 and N9; code at 6d8676d; the screen-reader points are code reading, not run on a device: unverified):
  1. The early-end line is the Account page's own state (N1): a `useState` and a `previous` ref (`apps/mobile/src/app/settings/account.tsx:71-81`, the comment at `:73`), so if Account is not open when the wait ends, nothing is said. S56 records this as designed (`docs/design/EXPERIENCE_PASS_2026-10.md:1386`).
  2. `signOutEarly` says "They are sent the next time you sign in to this account." (`packages/content/src/features/auth.en.ts:204`), which holds only if sync is allowed again; when a gate answer turned sync off, `waitEndedEarly` also reports early (`apps/mobile/src/components/auth/account-view.logic.ts:60`, `next.sync !== 'on'`) (N2).
  3. Accessibility (N8). After "Stay signed in" nothing is announced and focus is not placed: the row that held it goes (`account.tsx:264-267`). The early-end `Text` has no live region (`:128-132`) and `announce()` does nothing on Android (`apps/mobile/src/lib/a11y.ts:53-54`), as for the waiting row (`account.tsx:103-105`). The "Stay signed in" row shows a chevron, which reads as "go to another page" for an action that stays here: `ListRow` draws one for any pressable row without its own trailing node (`apps/mobile/src/components/ui/list-row.tsx:77-83`, `list-row.logic.ts:38-48`).
  4. The 22-character rule reaches tap-row labels only through the hand-kept `AUTH_BUTTONS` list (`packages/content/test/support/copy-surfaces.ts:290-319`) (N9). `rules.test.ts` passes with an entry removed and a 32-character label; only the word-for-word pin fails (#388). BL-462 point 2 asks to pin the lists by length; this asks that a row label in no list fails.
- Scope: (1) the owner picks: S01 holds the flag in the provider so the signed-out page shows it on the next visit, or the spec stays as built and the point is recorded as left; (2) a second line, or a rewording, for when sync is not allowed again (words by the content owner); (3) a calm announcement after "Stay signed in" with focus placed on Sign out, a live region for the early-end line and the waiting row on Android, and the cancel row without the chevron (a `Button` or a trailing node; the owner picks); (4) a test that fails when a label read by a `ListRow` or `Button` in `authCopy` is in no button list.
- Done when: each point has a test or a content-rule case that fails on its mutant, or is recorded here as left as it is; the phone checks are DEVICE_TEST_PLAN S1-27 (e) and (j) (`docs/qa/DEVICE_TEST_PLAN.md:307`).

#### BL-480 Journey record hygiene: a duplicate-id lint, run-day dates, retired words in flow notes, the saved moment, and a stray period
- Status: ready. Mode: agent. Owner: qa engineer, mobile engineer (the flows), content (point 3: the words). Milestone: M12. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (from #389's body and the review of #390; every cite at 6d8676d; the step files and the flows are the source):
  1. The recorder overwrites by id, and the config runs flows in parallel, so two steps with one id silently overwrite each other, and which one wins is not fixed (`apps/mobile/e2e-web/support/journey.ts:168`, `fs.writeFileSync` of `${meta.id}.json`). Ids come from `journey(code, name, start)` plus one per `step()` call (`apps/mobile/e2e-web/support/app.ts:49-60`). The 30 Oct run found three ids written twice (J10-08, J10-09 and J21-06) and #389 fixed them by hand. Nothing checks for a repeat: `apps/mobile/test/journey-index.test.ts` reads step files only.
  2. A flow note hard-codes a date. `apps/mobile/e2e-web/j10-letter.flow.ts:79` says "Deleted October 13. Kept here until November 12." while the assertion above it accepts any date (`:76`) and J10-12's captured text reads "Deleted October 30. Kept here until November 29." (`docs/release/journey/steps/J10-12.json`). The seed is relative to the run day, so the record carries that day's dates (#389: "Birthday October 30", "Friday, August 28, 2026"), and `docs/release/journey/README.md` does not say so (the procedure's bullets are at `:45-49`).
  3. Retired words sit in flow-authored titles and notes, which `packages/content/test/rules.test.ts` does not scan: J09-03's note "Chapters by month of age" (`apps/mobile/e2e-web/j09-book.flow.ts:38`; the Book says Month, rule at `rules.test.ts:795`), J06-05's note "Every edit is reversible both ways." (`apps/mobile/e2e-web/j06-review.flow.ts:34`) and J03-27's title "Birthday corrected" (`apps/mobile/e2e-web/j03-child-editing.flow.ts:57`; the glossary rule at `rules.test.ts:885` bans "correct" and "edit" in copy).
  4. J06-09's captured text has neither "Kept in Month 7" nor "Added to Asha's book." (`docs/release/journey/steps/J06-09.json`), although its note and the flow's assertions say both show (`j06-review.flow.ts:48-49`, the step at `:50` with `settle: 120`). The 13 Oct record's J06-09 text did end with "Added to Asha's book." (`git show 54e522d^:docs/release/journey/steps/J06-09.json`). J06-11 and J07-07 lack the "Kept just for you." chip line too. Probable cause, unverified: Playwright's `toBeVisible` counts a node at opacity 0 as visible, and the recorder leaves such text out (`journey.ts:107`, `checkVisibility({ checkOpacity: true })`), so the chip and the toast are still at opacity 0 at 120 ms. I opened the PNGs for J06-09, J06-11 and J07-07 in the P7 record's zip (in the scratchpad, not in git): each shows the card only, with no chip and no toast, so the screenshot misses the moment as well as the text.
  5. The generator writes a "." after every title, so a title that ends in "?" reads "What does Asha call you?." in `INDEX.md` (J01-13, J06-03, J22-09; `apps/mobile/e2e-web/support/build-index.mjs:153`). Cosmetic.
- Scope: (1) a lint test that counts `journey()` starts plus `step()` calls per journey code across all flows and fails on a repeated id, naming both places (or a recorder that refuses to write one id twice in a run; the owner picks), with a fixture that has a repeat; (2) drop the dates from the note, and say in the README that the record carries the run day's dates; (3) change the three words (the content owner picks them) and decide whether `rules.test.ts` should scan flow titles and notes; (4) make the saved moment visible when the step is recorded (a longer settle that is still before the screen leaves, or waiting for the chip and the toast to be opaque) for J06-09, J06-11 and J07-07; (5) the generator prints the title as written. Points 2 to 4 change step notes or text, and a note change rewrites `steps/*.json`, which only the journey-record PR commits (`docs/release/journey/README.md:22`): make the flow edits in a normal PR with the step files restored, as #372 and #388 did, or in the next journey-record PR.
- Done when: (1) a test fails on a fixture with a repeated id and passes on the real flows; (2) no flow note carries a fixed date and the README says so; (3) the three words are gone from flow titles and notes; (4) a regenerated J06-09 has "Kept in Month 7" and "Added to Asha's book." in its text and screenshot, and J06-11 and J07-07 the chip line; (5) `INDEX.md` shows "?" with no ".".

#### BL-481 Journey steps no web flow reaches: add flows or accept phone-only checks
- Status: needs-decision (the qa engineer and the experience-pass spec owner (design systems): which of the nine steps get a web flow and which are recorded as phone-only checks; no D-### or Q-### exists yet, as with BL-470 and BL-474). Mode: pair. Owner: qa engineer, design systems. Milestone: M12. Size: M. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (from #389's "Not in the record" and #390; I searched `apps/mobile/e2e-web` at 6d8676d): the 203-step record has no step for these nine, in six groups, because no web flow reaches them:
  1. The join-wait tests J21i and J21j run and pass but take only `{ app }` and no `record`, so they write no step (`apps/mobile/e2e-web/j21-coparent.flow.ts:144`, `:152`). The join wait's one step is J21-08, from J21's own test.
  2. Delete account (S64, merged in #358): no flow. J16b runs signed out and asserts there is no Delete account row (`apps/mobile/e2e-web/j16-settings.flow.ts:51-63`, the assertion at `:60`). A signed-in flow against the mock server, as J22's, may reach it: unverified.
  3. Tonight at large text, and the Keep sheet at the accessibility size: no web flow sets a font scale. The P8a critics did it with a patched export that was never committed (`docs/design/reviews/P8A_CRITICS_PASS_2026-10-28.md:26`). A committed seam is the decision.
  4. The Account sign-out wait (BL-451, shipped in #388): react-native-web's `Alert` does nothing, so the confirm and the wait cannot be held on the web (#388's body), and J22-33 shows only the Sign out row. Phone only by nature: DEVICE_TEST_PLAN S1-27 (e) and (j) (`docs/qa/DEVICE_TEST_PLAN.md:307`).
  5. Leave the book (S60): `LEAVE_BOOK_OFFERED` is false (`apps/mobile/src/lib/family/entry.logic.ts:46`, D-113), so there is no screen to record before BL-444.
  6. Back up (S61) and a new phone (S62): `EXPO_PUBLIC_BACKUP` is off in every profile (`apps/mobile/eas.json:17`, `:34`, `:48`, `:62`, `:76`), and no `j23` flow exists.
- Scope: per group, add a flow (points 1 and 2, and 3 with a font-scale seam) or record the step as a phone-only check in the spec's S entry and in the device plan (point 4, and points 5 and 6 until the feature is on). The decision and its reason go here.
- Done when: each of the six groups has either a flow that records named step ids, or a line in its S entry (`docs/design/EXPERIENCE_PASS_2026-10.md`) and a device-plan row saying it is checked on a phone; the next journey-record PR's count changes to match.

#### BL-482 Spec and doc fixes after the sign-in and journey work: SECURITY.md, "Before" images, P8 package plans, storyboard row 11
- Status: ready. Mode: agent. Owner: design systems (points 2 to 4), security engineer (point 1). Milestone: M11. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (from #387's "Found, not fixed" and the review of #390; at 6d8676d):
  1. `docs/emails/SECURITY.md:120` names `auth.code.pause` ("app-side lockout copy after 5 wrong codes"), a key that does not exist; it was renamed, and the words are now `errors.code_paused` and `code.pausedOtherWays` (`packages/content/src/features/auth.en.ts:118`, `:85`). `docs/prd/A-entry-and-auth.md:222` also lists the old key as v1.3 history: a requirement document, left as it is.
  2. The spec cites 47 lines of images as "Before: `screens/<id>.png`" (counted at 6d8676d, after #390 dropped four captures that the record has no file for). Those names now resolve to the regenerated 203-step record, which shows the build after P2 to P6, while the true pre-pass images exist only in the nine contact sheets in the scratchpad (`docs/design/EXPERIENCE_PASS_2026-10.md:22`, cut from the 147-step record b7afe42), labelled with the old ids. Where an id moved (J03-09, J10-09, J06-10, J07-04, J07-08 and J07-03: #390's table) the contact-sheet label no longer matches the id.
  3. The P8 package plans still describe built files as to come: P8a "new e2e `apps/mobile/e2e-web/j22-sign-in.flow.ts`, `support/mock-server.ts` (from `feat/coparent-alpha`, or new if that has not merged)" (`docs/design/EXPERIENCE_PASS_2026-10.md:2010`) and P8b "`j21-coparent.flow.ts` (from `feat/coparent-alpha`)" (`:2012`). Those files are on develop. The same P8b line says "from `feat/coparent-alpha`" for the invite screens and "from #148" for `join-ask.tsx` and `leave-sheet.tsx`, which also exist on develop (`apps/mobile/src/app/invite/`, `apps/mobile/src/components/family/`); which PR added each file is unverified. P8c's `j23-backup.flow.ts` (`:2014`) is still true: no such file.
  4. Storyboard row 11 (`:186`) pairs J06-09 and J07-07 with "Added to Asha's book.". J06-09's captured text has no such toast (BL-480 point 4), and J07-07 is the private keep, "Kept private", whose note names the lock chip and not a book toast; which line a private keep from Write shows is unverified.
- Scope: one correction line or text fix in each place named. For point 2, one note near `:22` saying the `Before` names are the ids of the 147-step record and the contact sheets are the source. For point 3, say what exists. For point 4, settle it after BL-480 point 4. A requirement document is not edited here.
- Done when: none of the four points names a key, file or image that does not exist or does not mean what the text says, or each is recorded here as left as it is.

#### BL-483 Re-check the backlog entries that cite journey step ids the 203-step record changed
- Status: ready. Mode: pair. Owner: qa engineer. Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. An entry whose test names a screen that no longer shows what the entry needs cannot prove it.
- Gate: none.
- Satisfies: none given.
- Problem and evidence: #389 regenerated the journey record (203 steps, develop 54e522d). Every id below still exists, but its title or route changed, so an entry may no longer mean the screen its `Steps:` and `Test:` lines name. I compared the 13 Oct record (`git show 54e522d^:docs/release/journey/steps/<id>.json`) with `docs/release/journey/steps/<id>.json` for every J-id cited in this file. Changed, with the entries that cite them (line numbers are `docs/BACKLOG.md` at 6d8676d):
  1. J04-04: was "A later session: "Help us make it better?"" (route `/`, the usage-sharing sheet), now "A later session: no usage-sharing ask" (route `/`, no sheet). Cited by BL-389 (`:1068`, `:1072`; its Done-when names the sheet and its X) and BL-400 (`:1158`, the close X among the 44 pt controls).
  2. J06-10: was "Saved to the book" on `/`, now "On the Book, on the new letter" on `/book`. Cited by BL-373 (`:935`), BL-377 (`:969`, `:973`) and BL-402 (`:1174`).
  3. J07-03: was "Review a typed letter" (`/review`, the read-back with its "Private letters stay with you" line), now "Saved to the book, no Review" (typed letters skip Review). Cited by BL-406 (`:1206`, `:1210`) and BL-422 (`:1339`).
  4. J16-06: was "Licences" on `/settings`, now "Licenses" on `/settings/licenses`, its own page. Cited by BL-404 (`:1190`, `:1194`).
  5. J16-05: was "If you are struggling" on `/settings`, now on `/settings/struggling`. Cited by BL-405 (`:1198`, `:1202`).
  6. J17-04: was "I was invited, but invites are not open yet" on `/invite`, now `No "I was invited" door` on `/onboarding`. Cited by BL-391 (`:1085`, `:1089`). Not on the coordinator's list; the same comparison found it.
  7. Retitled with the same screen, per #389, so confirm only: J11-03 ("Play the next one on its own" became "Keep playing"; BL-380 `:993`, `:997`) and J06-09 ("Saved to the book" became "Saved: kept in its month"; BL-395 `:1118`, `:1122`; BL-397 `:1134`, `:1138`; BL-433 `:1423`, `:1427`). J06-09's captured text no longer ends with "Added to Asha's book." (BL-480 point 4).
  Not in this list: J10-09, cited by BL-376 and BL-413, which #390 (merged as 6d8676d) re-pointed to J10-17.
- Scope: for each point, open the entry and the new step (title, route and `text`) and either re-point the id, rewrite the line to say what the step now shows, or record that the entry's screen no longer exists, with a status change and its evidence where the entry is finished or superseded (BL-389's sheet and BL-391's door may be). Nothing else in an entry changes. Only the product agent edits entries other than its own status line (the rules at the top of this file): a run by the qa engineer, the journey record's owner, proposes each change in its PR body and the product agent applies it. The coordinator asked for `Owner: product`; the harness does not accept it (`scripts/agents/lib.test.mjs:127`: every owner role must map to an agent, and the product agent has none). Mode is `pair`, not `agent` (changed 30 Oct): a dispatched qa run could not finish the task, because it cannot edit another entry. The qa engineer's comparison goes in a PR body or a journal note, and a product run (or the coordinator in a session) applies each edit.
- Done when: every cite above either names the step that shows what the entry means or says that no step does; the PR body lists what changed per entry; the ids are compared again against the record at the PR's base.

#### BL-484 A device walk of the 5.8 transitions: does any unlit frame show between lit rooms
- Status: ready. Mode: pair (a run on a phone, with a screen recording). Owner: qa engineer. Milestone: M5. Size: S. Depends on: none.
- Priority: Medium.
- Gate: the build 2 checks session (F25: `docs/qa/run-sheets/README.md:58`, the row "Build 2 checks" under "Suggested sessions"). Rows 5b, 12 and 13 need a build with sign-in on.
- Satisfies: none given. Cited: `docs/design/EXPERIENCE_PASS_2026-10.md:2041` (P7 acceptance 3: "The transitions in 5.8 are checked on the regenerated journey and on one device run (no unlit frame between lit rooms)") and `:1836` (5.8: "No transition shows a frame of unlit paper between two lit rooms, and no lamp re-arrives within a session except rows 8 and 12").
- Problem and evidence (coordinator's P7 check; re-opened at 6d8676d): the web journey record is one still per step and cannot show a frame between two screens, and the web preview has no native stack animation (`docs/design/reviews/P8A_CRITICS_PASS_2026-10-28.md:30`). `docs/qa/DEVICE_TEST_PLAN.md` has no row for the 5.8 table. S1-28 covers rows 10 and 12 only (title at `:329`): (a) says switching tabs on the Family tab never re-arrives the light (`:344`), (c) records the joined sheet's light rising from unlit over about 1.2 s (`:346`, row 12), and the room keeping its light under a sheet (row 10) is listed as not checkable on the web (`:355`). Nothing records the other lit-to-lit moves.
- Scope: add a device row (the next S1 number) that walks these rows of the table (`docs/design/EXPERIENCE_PASS_2026-10.md:1814-1831` at 146a8ff, the table header at `:1812`; #394 and #393 each moved the table down 4 lines after the 30 Oct text was written), each recorded as "no unlit frame between lit rooms", "an unlit frame at ... (described)" or "not reachable in this build". The table's own Lamp cells decide the groups:
  - One lit room replaces another: row 6 (Tonight, the Book and the Family tab, in every direction; the arriving lamp eases from where the last one left it over 280 ms), row 13 (the welcome to a returning parent's Book; the table says "with no unlit frame"), and row 12 (the second parent's Joined to the Book, which rises from 0 over 1.2 s by design: record only that it rises once, as S1-28 (c) does).
  - A lit room, an unlit cover, a lit room (Listen and Review carry no lamp: row 4): rows 1 and 2 (Tonight, Listen, Tonight), row 3 (Listen to Write), rows 4 and 4a (Listen to Review, Review to Tonight), row 5 (Review to the saved moment to the Book: "Tonight is never seen between them"), row 5a (Write to the saved moment to the Book: the Lamp cell says "as row 5", and the sequence plays inside Write's sheet before it dismisses onto the Book), row 5c (the Plus gate, then Tonight), row 7 (the Book, a letter, the Book; the platform push in build 2), and row 8 (to Read together and back; its dusk pool arrives over 1.2 s by design).
  - A lit room under a sheet or a pushed page, which keeps its light: row 3a (Tonight to Write, and Write closed without keeping: the Lamp cell says Tonight's holds under the sheet, and Write's own scene returns over 280 ms, so record the sheet's first frame too), row 5b (the sign-in sheet over the Book), row 9 (to Settings and back from Tonight, the Book and the Family tab) and row 10 (any sheet).
  Row 11 (toasts) leaves the lamp unchanged and is left out. The method (a screen recording stepped frame by frame, or slow motion) is the owner's pick. Reduce Motion is 5.8's own fourth acceptance line and stays with S1-28 (e).
- Done when: one device run records, per row above, whether any unlit frame shows between lit rooms, with the phone, iOS version and build; a "yes" on any row goes to the coordinator and P1 (`routeTransitions`, `useUnlitRoom()`) the same day.

## Review follow-ups, wave 4 (30 Oct 2026)

Found in the P8a critics' pass of 28 Oct (its Later table, `docs/design/reviews/P8A_CRITICS_PASS_2026-10-28.md:66-76`, which no entry held), in the P6c and Delete account critics' pass of 30 Oct (`docs/design/reviews/P6C_P8C_CRITICS_PASS_2026-10-30.md`, sections 2, 5 and 9), in the body of #372 (the sign-in code step, merged), in the bodies of #393 (the Delete account fix; merged as 146a8ff while this PR was open, its head was f5a5793) and #394 (the launch recovery fix, merged as c74c1b7), in the round-3 delta review of #393 (PASS WITH NOTES, no Must; relayed by the coordinator), and in the coordinator's list for build 2. Filed here by the product agent in the format of BL-475 to BL-484. Every file:line cite was re-opened on `develop` at 146a8ff, the tip after #393 (c74c1b7 plus #393; the #393 files cited were also checked against its head f5a5793 and are the same). "Unverified" means I could not find or run it. `needs-decision (...)` names who decides in the parenthetical (the BL-447, BL-448 and BL-474 precedent). The four entries that rest on code #393 added were first written as `blocked (PR #393 merge)` (the wave 2 precedent) and are `ready` now that it has merged. Already filed and cross-referenced, not repeated: BL-446 (Export while a request is open), BL-447 (a held request), BL-448 point 5 (the legal spec's step 7 against S64), BL-452 (error words for passkey and zero-letter phones), BL-464 (the boot flake), BL-467 point 4 (Android double announce), BL-475 point 4 (a book is not a letter) and BL-481 point 2 (a web flow for S64). Spec line numbers in `docs/design/EXPERIENCE_PASS_2026-10.md` after line 1231 moved by 4 when #394 merged, and by 4 more after line 1616 when #393 merged; #393 also added a line to the device plan's index table, so `docs/qa/DEVICE_TEST_PLAN.md` lines after 28 moved by 1. Wave 3 entries cite them as at 6d8676d (BL-448 and BL-484 are re-pointed in this wave, the others are not). Priorities are the product agent's call; the file tags only [Critical] and [High] in a heading, so these carry a `Priority:` line.

#### BL-485 Settings > Privacy has no owner for the sensitive-data row: it reads "Not signed in" in a sign-in build and nothing can withdraw the consent [High]
- Status: needs-decision (counsel: the withdrawal mode, F17 Q4; option (b) is done and merged in PR #408 (2980f3e), the founder's choice of 30 Oct 2026 (D-128), so the row reads On, Off, Waiting for a connection or Not signed in and has no withdrawal control, and the footer under it, `settings.privacy.sensitiveHelp`, still promises a switch and a deletion offer that build 2 does not have (BL-505 holds the split); option (a), the withdrawal sheet with `withdraw` in `recordConsent` and `withdraw_sensitive_data`, is still open before any friend outside the family signs in, and it needs counsel's read of the withdrawal mode first, so this entry is not done). Mode: pair. Owner: auth owner (S01: the source), mobile engineer (the withdrawal sheet), privacy engineer (F17 WP-F17-03), data architect (point 3 of the problem: the server function), legal (the counsel note). Milestone: M5. Size: M. Depends on: none.
- Priority: High. LEGAL-REQ-006 and LEGAL-REQ-008 are P0.
- Gate: the first build a person outside the founder's family signs in with. Alpha build 2 (`preview`, `apps/mobile/eas.json:47`) is the only profile with `capabilities.sync` on, and the row is drawn only then (`apps/mobile/src/app/settings/privacy.tsx:67`). The freeze is Tue 3 Nov 5:00 AM PT (`docs/design/reviews/P6C_P8C_CRITICS_PASS_2026-10-30.md:21`).
- Satisfies: LEGAL-REQ-006 (P0, `docs/legal/ENGINEERING_REQUIREMENTS.md:63-67`: "Withdrawal follows the same rule and offers export and deletion"), LEGAL-REQ-008 (P0, heading at `:78`, the Given and Then at `:80`: withdraw in at most two taps, recorded with `method='settings_toggle'`), F17-REQ-002 and F17-REQ-016 (`docs/prd/v2/features/F17-settings-privacy.md:370`, `:384`).
- Problem and evidence (re-opened at 146a8ff; what the screen shows is code reading, not run on a phone: unverified):
  1. The row has no owner. `setSensitiveDataSource` (`apps/mobile/src/lib/analytics/privacy-sources.ts:22`) has no caller anywhere in `apps/mobile/src` or `apps/mobile/test`. The file's header says the sign-in and sync owners register a source, and that until then the row reads "Not signed in", "true while sign-in does not exist" (`:1-7`). Sign-in exists in `preview`.
  2. What a person sees in a sign-in build: Settings > Privacy shows "Sync and family sharing" with the value "Not signed in", no chevron and a disabled row, signed in or not (`apps/mobile/src/app/settings/privacy.tsx:53`, `:67-77`: with no `open` registered and the status `signed_out`, `trailing` is none and `disabled` is true; the words are `settings.privacy.sensitiveSignedOut`, `packages/content/src/strings.en.ts:851`). The device plan says so: "Settings > Privacy's sync row has no owner yet" (`docs/qa/DEVICE_TEST_PLAN.md:324`, S1-27 (j)).
  3. Nothing can withdraw the consent. Account offers "Agree and sync" to a person who declined (`apps/mobile/src/app/settings/account.tsx:226-229`) and no row that turns it off. `recordConsent` writes `accept` or `decline` and never `withdraw` (`apps/mobile/src/lib/auth/consent.ts:91-112`, the action at `:107`); `loadSyncGate` reads a recorded `withdraw` (`:48`) that no screen writes. The server function the spec names for the withdrawal sheet, `withdraw_sensitive_data` (F17 6.2 B step 3, `F17-settings-privacy.md:168`; WP-F17-10, `:573`), is in no migration and no TypeScript file at 146a8ff (searched `supabase`, `packages` and `apps/mobile/src`), and WP-F17-03, the consents list and the withdrawal sheet (`:566`), is "Not built". BL-240 ("Sensitive-data withdrawal modes") is `done`: what it delivered is the decline handling in `consent.ts`. Its status is not changed here. The spec assigns `withdraw_sensitive_data(p_delete)` to BL-240 (`F17-settings-privacy.md:541`) and WP-F17-10 says it was "not found in migrations" (`:573`), so BL-240 closed without it. The server side of a plain withdrawal already works: a `withdraw` recorded through `record_policy_act` pauses the outbox with `paused_consent` and new letters wait on the phone (`apps/mobile/test/sync-e2e.test.ts:424-440`). What is missing is the screen that records it and the delete RPC.
  4. Counsel's open question OQ-L1 (F17 Q4, `:590`: erase synced letters within 15 days of a withdrawal, or stop plus offer) is due "Before any outside family signs in". The spec's default is `offer`.
- Scope: the founder picks one; the owners then split the work into entries (the product agent allots the ids).
  - (a) Wire it before the freeze. S01 calls `setSensitiveDataSource` once from the session provider: `read` maps the auth state to `on`, `off` or `signed_out` (`getAuthSnapshot()` and `subscribeAuth()`, `apps/mobile/src/lib/auth/auth-store.ts:46`, `:50`), `subscribe` is `subscribeAuth`, and `open` goes to the withdrawal sheet (F17 6.2 B step 3: Export first, what stops and what stays, "Stop syncing and delete my synced letters", "Stop syncing" and Cancel; words in `packages/content`, counsel's read; the spec's first button label is 41 characters against the 22-character button rule, `packages/content/test/rules.test.ts:890` and `:1026`, so the content owner shortens it), which records `withdraw` with `method='settings_toggle'` and pauses the outbox on `SCCON`. The status type has no value for an offline launch, where `SyncMode` is `unknown` (`apps/mobile/src/lib/auth/machine.logic.ts:52`); the owner picks how the row shows it. Deleting synced letters needs `withdraw_sensitive_data` (a migration by the data architect, the founder's `approve-migration` label, its own grants in `supabase/tests/grants.mjs`); without it the sheet offers Export and "Stop syncing" only, which is the `offer` mode without the delete button.
  - (b) Make the row true now and wire the withdrawal after: the same source with `read` and `subscribe` only, so a signed-in person sees On or Off and not "Not signed in". There is still no way to withdraw, and the counsel note says so.
  - (c) Ship build 2 as it is, with a counsel note that the row reads "Not signed in" for a signed-in person and that no withdrawal control exists, and write the date it will be wired here.
  - The product agent's suggestion: not (c) without counsel's read, because the row states something untrue and the requirement is P0; (b) is the smallest change that stops that.
- Done when: the choice is recorded here and, as the founder decides, in `docs/DECISIONS.md`; with (a) or (b) a test shows a signed-in account reads On or Off and a signed-out phone reads Not signed in; with (a) a withdrawal records `withdraw` with `method='settings_toggle'`, new letters stop within one sync cycle and Export is offered (LEGAL-REQ-006's second bullet); with (c) the counsel note is sent and the S1-27 (j) line is updated.

#### BL-486 A server guard: a new book, or a joined book, while an account-deletion request is open [Medium]
- Status: needs-decision (the founder: whether the server refuses a new book for a person with an open account-deletion request, or accepts it and lets the day-30 purge take it; the data architect and the sync owner first confirm what that purge does; no D-### or Q-### exists yet). Mode: pair. Owner: data architect (S02), sync owner (S03), mobile engineer (S14: the line for a refusal). Milestone: M9. Size: M. Depends on: none.
- Priority: Medium for alpha build 2, whose testers are friends and family and where the cost is a book started during the 30 days that goes with the account at day 30 (point 2, unverified); High before a store build that turns sign-in on, because the phone is then the only guard. The phone's guard is thin (point 5): since #393 only a sole parent's phone loses the "Begin the book" route.
- Gate: the first build real families use with sign-in on (as BL-446). A migration needs the founder's `approve-migration` label.
- Satisfies: none given. Cited: LEGAL-REQ-029 and C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`, the in-app deletion with its 30-day undo).
- Problem and evidence (the coordinator's review of #393 found it; re-opened at 146a8ff; the invite paths and the purge are my reading of the SQL, not run: unverified):
  1. The server does not read `deletion_requests` when a book is made or joined. `create_child` (`supabase/migrations/20261015000000_v1_gate_membership_sync_hardening.sql:778-793`) checks consent and the 20-a-day limit and calls `create_child_row` (`20261004000000_plus_on_device_only.sql:38-72`); `create_first_run_children` (`20261015000000_v1_gate_membership_sync_hardening.sql:798-826`) calls the same row function; `accept_child_invite` (`20261015020000_v1_gate_coparent_invites_undo.sql:176-224`) and `accept_child_invite_by_code` (`:315`) check the invite, the parent cap and consent; and `sync_push` makes a phone's new book through `create_child` and `create_first_run_children` (`20261016000000_sync_v1_server.sql:1215-1221`). None of the bodies mentions `deletion_requests`. #393's test creates a book over an open request on the real SQL, for `create_child` only (`apps/mobile/test/account-deletion-two-phone.test.ts:253-256`).
  2. What the day-30 purge does with such a book is unverified; the data architect and the sync owner confirm with a test on the real SQL. My reading: `prepare_account_purge` tombstones "Books where the caller became sole parent during the grace period" (`supabase/migrations/20261023020000_purge_legal_holds.sql:299-303`), deletes the person's own letters (`:322`) and deletes the books linked to the request (`:336`), so a book the person made after the request, and is the only parent of, goes with the account. The request told them they have 30 days to change their mind; nothing says a book started in those days is included.
  3. What a refusal does on the phone is part of the design. A new book travels as an outbox op, and no queued letter may be dropped (A-REQ-033, F16): a refused `book.create` has to park the op and say so, not retry for ever or discard it.
  4. The request itself: `request_account_deletion` (`supabase/migrations/20261005000000_family_cap_language_idempotency.sql:408-456`); an open request is `scheduled`, `held` or `executing` (`:422`).
  5. The phone does not stop these paths either (code reading, not run on a phone: unverified). (a) A co-parent's phone with an open request stays on `app`: #393's own test says so (`apps/mobile/test/account-deletion-two-phone.test.ts:235`, "the open request does not take the app away from a phone that lists a book"). Settings > Add a book is reachable there (`apps/mobile/src/app/settings/index.tsx:95`, `apps/mobile/src/app/settings/children/new.tsx`, `apps/mobile/src/components/child/child-switcher.tsx:74`); `AddChildForm.save` calls `addChild` (`add-child-form.tsx:78`), which queues `book.create` (`apps/mobile/src/lib/store.ts:280-292`), and nothing on that path reads the open request. (b) The `/invite` deep link (`apps/mobile/src/app/invite/index.tsx`) reaches `accept_child_invite`; the phone-side reading of it is not done (BL-494 point 6). (c) A fresh install signed in to the same account while offline (BL-493 point 1). The server accepts all three. For a sole parent, `prepare_account_purge` then deletes at day 30 a book made after the request (point 2, read from the SQL, unverified). So the rating does not rest on "the phone lists no book", which holds for a sole parent only.
- Scope: the founder picks one. (a) Refuse, in `create_child`, `create_first_run_children`, `accept_child_invite` and `accept_child_invite_by_code`, while an account request is open: a new migration, a new error code, the phone's handling of a refused op, one calm line in `packages/content` (counsel reads it: it is about deletion), and a test per function. A new helper function needs its own grants in its own migration and a line in `supabase/tests/grants.mjs`. (b) Accept, and say in the confirm step that a book started during the 30 days is deleted with the account (counsel's), with the purge test as the proof. Either way the data architect and the sync owner write the test of what the purge does with a book made after the request.
- Done when: the purge reading is confirmed or corrected by a test; the choice is recorded here and, as the founder decides, in `docs/DECISIONS.md`; with (a) each function refuses an open request on the real SQL and a reply that never arrives cannot drop a queued letter; with (b) the words say it.

#### BL-487 The account age step's "No" closes the app for 24 hours, also for an account that already has a book
- Status: needs-decision (legal and the coordinator: whether the account age step keeps the 24-hour closure for an account that already has a book on this phone; counsel for any new line; no D-### or Q-### exists yet, as with BL-447 and BL-474). Mode: pair. Owner: legal, mobile engineer (the consent step), auth owner (S01). Milestone: M5. Size: S. Depends on: none.
- Priority: Medium. The step shows only for an account whose Terms are current without the age line, an older account (`apps/mobile/src/lib/auth/machine.logic.ts:94-99`); whether any build 2 account is one is unverified.
- Gate: none stated.
- Satisfies: none given. Cited: LEGAL-REQ-002 (P0, `docs/legal/ENGINEERING_REQUIREMENTS.md:29-35`; the 24-hour closure is `:33`) and the spec's S55 age step ("no explanatory line", `docs/design/EXPERIENCE_PASS_2026-10.md:134`).
- Problem and evidence (P8a critics' pass L3, `docs/design/reviews/P8A_CRITICS_PASS_2026-10-28.md:70`; every cite re-opened at 146a8ff; the critics' probe is theirs and was not re-run):
  1. The step is `AgeStep` (`apps/mobile/src/app/(auth)/sign-in/consent.tsx:304-326`). Choosing No and Continue ends the session with `under_18` (`apps/mobile/src/lib/auth/machine.logic.ts:166`); the provider signs out on this phone and calls `onUnder18` (`apps/mobile/src/lib/auth/session-provider.tsx:299-314`), which is `closeGate` in the root layout (`apps/mobile/src/app/_layout.tsx:179-184`). That records the No (`apps/mobile/src/lib/age-gate.ts:27-37`, `answerAgeGate('no')`), and the whole app shows the stop screen for `BLOCK_MS`, 24 hours (`apps/mobile/src/lib/age-gate.logic.ts:15`). The probe read the stop line at `/`.
  2. A parent who already has a book here and taps No by mistake cannot open it for a day. The spec chose a confirming Continue over a one-tap No for this reason (`EXPERIENCE_PASS_2026-10.md:91`), and that is the only guard. After 24 hours "I answered by mistake" leads back to the question (`:132`). Whether read, play and export stay reachable during the closure is not stated anywhere I found: unverified.
- Scope: legal and the coordinator rule one of: (a) keep as built, and record why an existing account holder is treated like a new install; (b) for an account with a book on this phone, one calm confirm before the No is recorded (a new registered line, so counsel's, and a change to "no explanatory line" at `:134`, so the spec owner's).
- Done when: the ruling is recorded here; with (b) the words are in `packages/content` and a test shows a No on an account with a book needs the second tap; with (a) S55's acceptance records the reason.

#### BL-488 Sign-in words that say the wrong thing for the person's situation: a server error, an offline signed-in phone, and "Keep them here"
- Status: done (PR #402: the server-error kind in `apps/mobile/src/lib/auth/errors.logic.ts`, `account.gateOffline` in `AccountGate`, and the claim label "Keep in this account"; the screens were not run on a phone; the pieces still open are under "Left open" below). Mode: agent. Owner: auth owner (S01: point 1), mobile engineer (P8a: point 2), content (the words, points 2 and 3). Milestone: M5. Size: M (one PR per point is fine). Depends on: none.
- Priority: Medium for point 1, Low for the others.
- Gate: none. The sheets exist only in a build with sign-in on.
- Satisfies: none given. Cited: A-REQ-031 (P0, `docs/prd/v2/features/F02-account.md:211`, "Specific errors") and F02-REQ-019 (`:234`, the claim step).
- Problem and evidence (P8a critics' pass L4, L6 and L7, `P8A_CRITICS_PASS_2026-10-28.md:71`, `:73`, `:74`; every cite re-opened at 146a8ff; the screen effects are code reading and the critics' probes, not run on a phone: unverified). Distinct from BL-452 (words wrong for a passkey and for a zero-letter phone) and from BL-475 point 1 (whether "safe on this phone" is true):
  1. A server error reads as offline. `authErrorKind` returns `network` for any error `isNetworkError` accepts (`apps/mobile/src/lib/auth/errors.logic.ts:27`), and that test is true for the name `AuthRetryableFetchError` (`apps/mobile/src/lib/supabase/errors.logic.ts:41-47`, the name at `:44`). The pinned `@supabase/auth-js` 2.117.2 (`package-lock.json:4438-4439`) throws that error for a failed fetch (status 0) and also for statuses 500 to 504 and 520 to 530 (`node_modules/@supabase/auth-js/src/lib/fetch.ts:75-77`, `:88-98`). So an online person whose "Send link" gets a 500 reads "Your letters are safe on this phone. Sign in once you are back online." (`packages/content/src/features/auth.en.ts:115`). The critics saw it against a mock; against the real project it is unverified.
  2. A signed-in phone that launched offline is told to sign in. `AccountGate` shows `authCopy.errors.network` with a Try again button when `s.sync === 'unknown'` (`apps/mobile/src/lib/auth/ui.tsx:346`, `:359`), in the invite, join and leave sheets, to a person who is signed in.
  3. "Keep them here" (`packages/content/src/features/auth.en.ts:106`, drawn at `apps/mobile/src/app/(auth)/sign-in/consent.tsx:208-216`) sits under "Keep your letters in this account?" and can be read as this phone; the choice is this account. The critics suggested "Keep them in this account", which is 25 characters and over the 22 a button may have (the rule is stated at `packages/content/test/server-surfaces-auth.test.ts:9`; `claim.keep` is in the button list at `packages/content/test/support/copy-surfaces.ts:307`), or "Yes, keep them" (14).
- Scope: (1) a thrown error with a status of 500 or more is `provider` or `unknown` (the owner picks; both read "That did not work this time."), and a status of 0 or none stays `network`; (2) a new key whose words name the connection, not the sign-in, used by `AccountGate`'s offline branch (words by the content owner; the rule against "we" and the 22-character rule apply); (3) the content owner picks a label of 22 characters or fewer, and the pinned words move with it.
- Done when: (1) a test in `apps/mobile/test/auth-machine.test.ts` fails on its mutant: a 503 error is not `network`, a failed fetch is; (2) the offline gate no longer says "Sign in" to a signed-in person, with a source pin or a view test; (3) the label changes and `npm test --workspace packages/content` passes.
- Left open (not in PR #402; no new BL id): `authCopy.errors.network` ("Sign in once you are back online") still reaches signed-in people in `apps/mobile/src/app/settings/account.tsx:155` and `:174` (add and remove a passkey) and in `apps/mobile/src/lib/auth/session-provider.tsx:462` and `:476` (consent turn-on and record); `docs/prd/v2/features/F02-account.md:125` and ADRs 0023 and 0024 still quote the old label "Keep them here" (the spec owner's); and the S52 table in `docs/design/EXPERIENCE_PASS_2026-10.md` has no row for the new gate line.

#### BL-489 The sign-in code step and Account: notes VoiceOver does not hear, a Not now that sends no event, and a safe line that skips hidden books
- Status: ready (points 1 and 3; point 2 waits for the analytics owner's answer). Mode: agent. Owner: mobile engineer (P8a: points 1 and 3), analytics engineer (point 2), qa engineer. Milestone: M5. Size: S. Depends on: none.
- Priority: Low. Point 1 is a screen-reader gap, Medium for a VoiceOver parent.
- Gate: none; build 2.
- Satisfies: none given. Cited for point 2: PRD-REQ-016 (`docs/prd/PRD.md:279`, the typed event catalogue).
- Problem and evidence (P8a critics' pass L5, `P8A_CRITICS_PASS_2026-10-28.md:72`; #372's body, its A1 and B4 (c) notes; every cite re-opened at 146a8ff):
  1. Four notes use only a live region, which iOS does not read: "A new email is on its way." (`apps/mobile/src/app/(auth)/sign-in/code.tsx:169`, drawn at `:281-285`), the "Trouble signing in?" help (`:308-312`), and "Passkey added." and "Other devices are signed out." (`apps/mobile/src/app/settings/account.tsx:152`, `:186`, drawn at `:254-258`). `ErrorLine` pairs a live region with `announce()` (`apps/mobile/src/lib/auth/ui.tsx:143-163`), and `announce()` does nothing on Android, where the live region carries the line (`apps/mobile/src/lib/a11y.ts:44-52`, `:53-54`). Unverified on a phone; S1-27 has no VoiceOver step for these notes.
  2. The code step's Not now sends no `auth_deferred`: the header button is `closeLabel` (`code.tsx:181`) and only the first step tracks it (`apps/mobile/src/app/(auth)/sign-in/index.tsx:108`). #372's body says leaving it so was not a deliberate choice but is right by the tracking plan (the wording is from the PR body, not re-read here: unverified): the plan defines the event as "Later on the sign-in sheet", sent from `index.tsx` only (`docs/analytics/TRACKING_PLAN.md:116`, `:407`; `packages/analytics/src/catalog.ts:332-338`), and counting a leave after an email went would mix those people into how often Later wins. If the analytics owner wants it, a tracking-plan row comes first.
  3. A phone whose only books are hidden shows no safe line. The code step reads `useChildren().active` (`code.tsx:72`, `:275`), and the active book comes from `listChildren()`, which leaves hidden books out (`apps/mobile/src/lib/store.ts:265-274`; `apps/mobile/src/lib/db/repos/children.ts:51`, with the repo's `listHidden` at `:55`, which `store.ts:345` exports as `listHiddenChildren`). #372 said it "errs on the quiet side". It falls with BL-475 point 4 if that entry's pick reads letters across every book, hidden or not.
- Scope: (1) call `announce(note)` when a note is set, in the three places, keeping the live region, and add a VoiceOver line to S1-27; (2) the analytics owner decides; if yes, the tracking-plan row and the catalog entry come first and then one `track` call, if no, record it here; (3) read the has-a-book signal over hidden books too, or fold it into BL-475 point 4's pick.
- Done when: (1) a source pin or view test fails when a note is set and not announced; (2) the answer is recorded here, with the plan row if yes; (3) a test with only hidden books shows the safe line, or BL-475's pick covers it.

#### BL-490 Sign-in sheet departures from the spec and the checks only a phone can make: the tap haptic, the sheet's shape, the wrapped-label pill and a swipe during a sign-in
- Status: needs-decision (design systems as spec owner: point 1, accept the provider tap haptic and amend S52, or drop the two calls; points 2 to 4 are phone checks and a P1 change; no D-### or Q-### exists yet). Mode: pair. Owner: design systems, mobile engineer (P8a), qa engineer (points 2 and 4). Milestone: M5. Size: S. Depends on: none.
- Priority: Low.
- Gate: the build 2 checks session (`docs/qa/run-sheets/README.md:58`) for points 2 and 4.
- Satisfies: none given. Cited: MOTION 6 and S52's Motion line (`docs/design/EXPERIENCE_PASS_2026-10.md:1293`).
- Problem and evidence (P8a critics' pass L1, L2, L8 and L9, `P8A_CRITICS_PASS_2026-10-28.md:68`, `:69`, `:75`, `:76`; every cite re-opened at 146a8ff):
  1. L1. S52's Motion line says "No haptic" (`EXPERIENCE_PASS_2026-10.md:1293`), and both provider buttons play `tap` before their press handler (`apps/mobile/src/lib/auth/ui.tsx:202` for Apple, `:263` for the Google and passkey button). #310's list of departures does not declare it. The spec owner accepts and amends, or both calls go.
  2. L2. `(auth)` is a page-sheet `modal` (`apps/mobile/src/lib/transitions.logic.ts:54`), so on a phone the sheet is a near-full page for two lines and a button; #310 recorded it as a request to P1, and the fix would be a route option for a fit-to-contents sheet after the phone check. The critics list it as phone check 2 (`P8A_CRITICS_PASS_2026-10-28.md:158`); S1-27 (`docs/qa/DEVICE_TEST_PLAN.md:308-326`) has no row for the shape.
  3. L8, the same finding as the P6c critics' L13. `Button` is `rounded-full` whatever the label does (`apps/mobile/src/components/ui/button.tsx:48`, `:204`), so at accessibility sizes a wrapped label turns a full-width pill into a tall oval (the critics' emulated AX5 shots; COMPONENTS 0.1 says buttons grow taller instead of clipping). P1: a smaller radius once a label wraps. One change serves the sign-in sheet, the 404 and Delete account.
  4. L9. Not now is disabled while a sign-in runs (`apps/mobile/src/app/(auth)/sign-in/index.tsx:111`) and swipe-to-dismiss is not blocked (#310 B6), so during a slow Apple or Google sheet the swipe is the only way out. The critics left it as a phone check; S1-27 has no row for it.
- Scope: (1) design systems rules; (2) and (4) become rows in S1-27 with a result recorded; (3) design systems and P1 pick the rule, one PR.
- Done when: (1) the ruling is recorded here and S52's Motion line or the two calls change; (2) and (4) have phone results recorded; (3) a label that wraps keeps the radius the owner names, with a test on the button's logic.

#### BL-491 Delete account: decisions the 30 Oct critics' pass left open (re-authentication, the held intro, a warning on Export, four spec rows, the failed Cancel line, and the letters' door)
- Status: needs-decision (counsel for points 1, 3 and 5; the coordinator, and the founder if they overrule, for point 2; design systems as spec owner for points 4 and 6; the 30 Oct rulings are `docs/design/reviews/P6C_P8C_CRITICS_PASS_2026-10-30.md:234-245` and no D-### or Q-### exists yet). Mode: pair. Owner: legal (points 1, 3 and 5), security engineer (point 1), content (point 5), design systems (points 4 and 6), mobile engineer (S14). Milestone: M9. Size: M. Depends on: none.
- Priority: Medium.
- Gate: points 1 and 3 before the first store build with sign-in on; build 2 ships as ruled.
- Satisfies: none given. Cited: LEGAL-REQ-029 and C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`) and DATA-REQ-053 (`docs/legal/DELETION_AND_EXPORT_SPEC.md:374`).
- Problem and evidence (the critics' sections 2, 5 and 9 and #393's two residual lists; re-opened at 146a8ff; none run on a phone: unverified):
  1. Re-authentication before the request (L11, ruling 5). The legal spec's step 5 asks for re-authentication when the session is older than 24 hours (`docs/legal/DELETION_AND_EXPORT_SPEC.md:200`), and step 7 for signing the device out after unsynced writes are uploaded (`:202`). S64 follows neither: the typed word is the only gate, and the page has a "Sign out of this phone" button. Ruling 5: not wanted for build 2, to the backlog, and counsel told in the relay as a departure. Step 7 against S64 is also BL-448 point 5 (the spec owner decides there); this entry carries step 5 and the store-build question: is the typed word enough, given that a phone left unlocked can ask for the deletion and the cancel is one tap for 30 days. The security engineer and counsel decide.
  2. Export after a request leaves out the person's own letters (L5, ruling 6). BL-446 holds the fix, and its Gate already says it is not a build 2 blocker (coordinator, 28 Oct); ruling 6 accepts it for TestFlight again. Open: whether build 2 adds one line on the Export page while a request is open (the critics' option; BL-446's scope does not include it), or accepts it as ruled.
  3. The held intro (S5, ruling 2). The page shows `HELD.intro` (`apps/mobile/src/components/settings/delete-account.logic.ts:14-16`, drawn at `apps/mobile/src/app/settings/delete-account.tsx:222`), which names "photos" (`packages/content/src/features/account-deletion.en.ts:18`); the proposed words wait as `introProposed` (`:19`) and name "recording backup", which no build has (`EXPO_PUBLIC_BACKUP` is off in every profile, `apps/mobile/eas.json`). Ruling 2: today's line ships; S64 acceptance box 1, "No mention of photos anywhere in the flow" (`docs/design/EXPERIENCE_PASS_2026-10.md:1634`), is recorded as not met in build 2; the held intro and `exportFirst.body` (`account-deletion.en.ts:42`) go to counsel on the relay list (not in the repo). Counsel clears a line that names only what the build holds, or the box stays unmet.
  4. Spec rows from the critics' section 5 that no merged PR has applied (#393 added only copy rows, `:1618-1621`): S64 States gains "held" and "after the request, on the phone" (`EXPERIENCE_PASS_2026-10.md:1631`); Motion records that the steps swap in place and the warning plays once per request that reaches the server (`:1629`); Acceptance gains "A sole parent can reach Cancel deletion after the phone's next sync" and "AL-07 has a sole-parent cancel step" (`:1633-1637`, still four boxes, and #393's S1-35 Update line already points at the missing one: BL-497 point 3); the Copy mark keeps `confirm.*` and `scheduled.*` as KEEP (`:1616`, `:1622`), which the critics tied to M1 being fixed: #393 fixed it in code and S1-35 is the phone proof. The j24 web flow for S64 is BL-481 point 2 and is not repeated.
  5. A failed Cancel on the deletion screen shows the shared offline or failed line (`failureLine`, `apps/mobile/src/components/settings/delete-account.logic.ts:63-66`, used at `apps/mobile/src/components/settings/open-deletion.tsx:60`): "Nothing has changed. Deleting an account needs a connection." (`account-deletion.en.ts:107`). It is true, and it can be read as the deletion being blocked, so a person believes they are safe when the request is still open (#393 residuals, lens B). No cancel-specific line exists. The content owner and counsel decide; it is a deletion term.
  6. A sole parent's letters sit in Recently deleted while the request is open, but Settings is out of reach, so they cannot be seen until the Cancel (#393 residuals; the critics' M1, `P6C_P8C_CRITICS_PASS_2026-10-30.md:47`). The deletion screen is deliberately one button and a sign-out (`apps/mobile/src/lib/account-deletion/open-request.ts:260-283`). The spec owner and the coordinator decide whether to accept it or add one line to the screen.
- Scope: each point has one owner who decides first; the file the point names then changes. A requirement document and the legal spec are not edited here: a proposed change goes in the PR body for the founder.
- Done when: each point is settled in the file it names, or recorded here as left as it is.

#### BL-492 Launch-recovery and Delete account Later items from the 30 Oct critics' pass that no entry held
- Status: ready. Mode: agent. Owner: mobile engineer (S14: points 2 to 5), content (points 1 and 4), qa engineer. Milestone: M9. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given. Cited: C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`).
- Problem and evidence (the critics' Later table, `P6C_P8C_CRITICS_PASS_2026-10-30.md:98-111`; every cite re-opened at 146a8ff; none run on a phone: unverified):
  1. L3. `errors.crash.body` leaves "phone." alone on its second line at 402 and 375 pt (`packages/content/src/strings.en.ts:1005`; #394 changed the launch body). A no-break space (U+00A0) between "this" and "phone." is not on the banned list (`packages/content/test/rules.test.ts:138-139`); the content owner confirms it is welcome in strings, or a layout fix takes its place.
  2. L6. After Cancel deletion the toast shows and the page underneath goes back to "What happens ... Continue" (`apps/mobile/src/app/settings/delete-account.tsx:149-150`).
  3. L7. A status read that fails offline shows a bare spinner for several seconds (supabase-js retried four requests in 8 s: the critics'); the spinner has no accessibility name (`delete-account.tsx:109`), and the calls have no timeout (`apps/mobile/src/lib/account-deletion/api.ts:38-47`), so a hung request leaves the field read-only and "Keep my account" disabled.
  4. L8. `errors.failed` is also the line when step 1 cannot load its book lines (`delete-account.tsx:279-284`, `account-deletion.en.ts:108`): "That did not work this time. Nothing has changed." on a page where nothing was tried.
  5. L10. `haptic('warning')` plays on every press of Delete account, each offline retry included (`delete-account.tsx:203`).
  Where the other Later items went: L1 (the large-text window) is BL-495 point 4; L2 (the README's missing address) is BL-495 point 7; L4 (a held request) is BL-447; L5 (Export) is BL-446 and BL-491 point 2; L11 is BL-491 point 1; L13 is BL-490 point 3; L12 (AL-07.9) and L14 (the request re-read) are fixed in #393 (merged as 146a8ff); L9 (the 404 for a person with no book) is accepted by the critics as reachable on the web only, and is not filed.
- Scope: (1) the content owner rules, then the string or a layout fix; (2) pop to Settings after a cancel, or accept, and time the Book's return on a phone (S1-35); (3) label the spinner, and give the calls a timeout of about 15 s that ends in the offline line; (4) a load line of its own, words by the content owner (the key goes to the spec owner); (5) play it once per request that reaches the server, or once per visit.
- Done when: each point has a test or a content-rule case that fails on its mutant, or is recorded here as left as it is.

#### BL-493 Open-deletion gate edge cases left after #393: an offline fresh install, the paper, 48 hours of grace, one note slot, a cold first frame and timer clamps
- Status: ready. Mode: agent. Owner: mobile engineer (S14: lib/account-deletion), qa engineer. Milestone: M9. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low; point 1 Medium until BL-486 lands.
- Gate: none; a build 2 tester meets these only after asking for a deletion.
- Satisfies: none given. Cited: C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`).
- Problem and evidence (#393's body, "Residuals (not fixed here)" in both fix rounds; the code came with #393, merged as 146a8ff; every cite re-opened on that tree; none run on a phone: unverified):
  1. A fresh install signed in to the same account while offline can use "Begin the book" until the read lands: with no note and no closed book `chooseScreen` answers `welcome` at once (`apps/mobile/src/lib/account-deletion/open-request.ts:232-240`), and the read starts only when a client exists (`apps/mobile/src/lib/account-deletion/use-first-run-gate.ts:104-107`). BL-486 is the server's side of the same case.
  2. The paper. A signed-in phone holding a closed (`deleted`) book shows "One moment" for up to 3 s (`CHECK_CAP_MS`, `use-first-run-gate.ts:39`) on every Onboarding mount (`open-request.ts:239`), and the swap from `FirstRun` to the paper unmounts `FirstRun` under any sheet open over it (`apps/mobile/src/app/onboarding.tsx:585-589`).
  3. Dates. A signed-out phone shows the date and Sign in for up to 48 h after the request's date (`NOTE_GRACE_MS`, `open-request.ts:50`), and after a purge that Sign in fails. A held request more than 48 h past its date shows the paper and then the deletion screen when signed in, and the welcome when signed out (`open-request.ts:235-239`).
  4. One note slot. Clearing account A's note when B signs in (`noteIsDead`, `open-request.ts:187-199`; `clearDeadNote`, `apps/mobile/src/lib/account-deletion/note-store.ts:76`) removes A's "Sign in to cancel" pointer, so if B then signs out the phone no longer says A can cancel: the setting `accountDeletion.openRequest` (`open-request.ts:32`) holds one note. "Not counted for B" instead of "cleared" is not a small change.
  5. The first frame of a cold launch is built before auth is restored: `restoring` is not signed in (`apps/mobile/src/lib/auth/machine.logic.ts:86`), so a stale held note on a signed-in phone is cleared on frame one and the order is welcome, paper, deletion. The round-3 delta review adds the closed-book variant: a phone with a closed book and no note, while auth is `restoring`: `chooseScreen` answers `checking` only for a signed-in phone (`open-request.ts:239`), so the welcome is drawn for a few tens of milliseconds while the saved session is read (the review's figure; not measured here).
  6. A timer delay over 24.8 days is clamped (`MAX_TIMER_MS`, `use-first-run-gate.ts:41`, `:131-138`) and the effect's dependencies do not change, so it is not re-armed; the next render re-reads the clock.
- Scope: per point, the owner takes it to a test (the hook stand-in `apps/mobile/test/helpers/mini-react.ts` and `account-deletion-gate-hook.test.ts` exist for this) or records why it stays. For points 1 and 5 the choice is a paper before the welcome on a cold launch with no book (a cost on cold start, not measured) or the server guard in BL-486; the owner says which in the PR.
- Done when: each point has a test (the hook stand-in or `decideGate`) that fails on its mutant, or is recorded here as left as it is.

#### BL-494 The deletion screen after #393: the sign-in sheet's words, TalkBack, a loading action, what the phone does after day 30, and what the stand-in cannot see
- Status: ready. Mode: agent. Owner: mobile engineer (S14), content (point 1), design systems (point 3), sync owner (S03: point 4), qa engineer (point 5). Milestone: M9. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low; point 4 Medium, because it decides whether a line on step 1 stays true.
- Gate: none for points 1 to 3; point 4 before the first store build with sign-in on.
- Satisfies: none given. Cited: C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`).
- Problem and evidence (#393's body, both residual lists, and its lens B notes; the code came with #393, merged as 146a8ff; none run on a phone: unverified):
  1. The sign-in sheet opened from the signed-out deletion screen shows the generic body: the screen opens it with `trigger: 'settings'` (`apps/mobile/src/components/settings/open-deletion.tsx:79`), and that body talks about a new phone and the other parent (`packages/content/src/features/auth.en.ts:35`), nothing about cancelling. A new trigger is a change to the analytics catalog's trigger list (`SIGN_IN_TRIGGER`, `packages/analytics/src/catalog.ts:95`; `:337` only uses it), and the words are about deletion, so counsel reads them.
  2. TalkBack. `announce()` does nothing on Android by design, and a line there needs a live-region node (`apps/mobile/src/lib/a11y.ts:44-52`, `:53-54`). The deletion screen's spoken lines (cancelling, restoring, a failed press) go through `announce` (`open-deletion.tsx:64-71`, whose comment says Android "does nothing there yet"); only the paper has its own live region (`:107`). Whether the rest sit in a `StateScreen` live region on Android is unverified (`apps/mobile/src/components/ui/state-screen.logic.ts:79-85`).
  3. `StateScreen`'s primary action has no `loading` prop: `StateAction` is a label, an `onPress` and a `testID` (`apps/mobile/src/components/ui/state-screen.logic.ts:39`) and `Actions` draws a `Button` without it (`apps/mobile/src/components/ui/state-screen.tsx:69-82`), so the open-deletion screen turns the whole state into the loading state while Cancel runs (`open-deletion.tsx:35`). `components/ui/**` is design systems' file.
  4. What the phone does after the day-30 purge is unverified (claims row E9, `docs/reviews/2026-10-claims-inventory.md:144`; S03 confirms). A server-held letter is erased on the phone only when a later pull says the server no longer holds it (`apps/mobile/src/lib/sync/merge.ts:755`, `markGone`; `closeBook`, `:844-848`), the phone's own launch purge leaves such letters alone in a sync build (`apps/mobile/src/lib/store.ts:797-808`; `apps/mobile/src/lib/db/repos/entries.ts:338`), and after the purge the auth user is gone, so whether the phone ever gets that signal is not known. The line it protects is `what.onThisPhone` on step 1 (added by #393).
  5. Test and robustness gaps the round-3 delta review left (all added by #393): (a) the `ctl.attach()` call (`apps/mobile/src/components/settings/open-deletion.tsx:53`) is held by no test, so without it React's development mount, cleanup and mount would leave the controller's `gone` set (production is unaffected; only the controller is tested directly, the screen has no renderer); (b) no test that `dispose` clears the cap timer (`apps/mobile/src/components/settings/open-deletion.logic.ts:135-138`); (c) the 2^31 timer clamp (BL-493 point 6); (d) the controller's cancel path has no `.catch` (`open-deletion.logic.ts:115`, `void deps.cancel().then(...)`), so a throw in `recordCancelled` is an unhandled rejection, though the 20 s cap still returns the buttons (`:97`); (e) the hook stand-in (`apps/mobile/test/helpers/mini-react.ts`) follows React's rules for the hooks it covers but has no lane or batching model, runs effects synchronously, subscribes during render (`:90-96`) and applies no React Compiler, while the app has `reactCompiler: true` (`apps/mobile/app.config.ts:264`) and the review says the compiler skips `useFirstRunGate` and `OpenDeletionScreen` so they ship as written (the compiler's behaviour is the review's: unverified here), and vitest has no component renderer. S1-35 and AL-07.6a (#393) are the phone checks.
  6. Residuals the points above leave out (all from #393's and #394's bodies and the reviews, not re-opened on a phone: unverified). (a) The signed-out screens: `open.restoringBody` is drawn while the phone is signed out, and the executing screen signed out offers Sign in, which cannot cancel; `void d.signOut()` drops a `waiting` result (`apps/mobile/src/components/settings/open-deletion.tsx:78`). (b) A co-parent's stale note is refreshed only where the gate mounts, on the Delete account page and by the 48-hour rule. (c) The `/invite` deep link on the phone side: BL-486 covers the server only. (d) The iOS back gesture on the open-deletion screen was not observed. (e) #394's residuals: `live` is never reset under StrictMode, and the 500 ms beat timer is not cleared on unmount (`apps/mobile/src/lib/resilience/`).
- Scope: (1) a body or a parameter for this entry point, the owner picks and says why; (2) a live-region node for each spoken line, or `announce` plus a note on Android; (3) a `loading` on the primary action with a test, then the screen uses it; (4) S03 writes the test on the real SQL and merge path: after a purge, what a phone's pull says for the account's letters; if it says nothing, the line on step 1 changes or the phone is given the signal; (5) the phone checks run and recorded; (6) each residual gets a test or a recorded reason.
- Done when: each point has a test or a recorded phone result, or is recorded here as left as it is; point 4 has the answer recorded and the line on step 1 true.

#### BL-495 Launch recovery after #394: a render that opens the store again, the journey record, large text, hook tests, a stale comment and the README line
- Status: ready. Mode: agent. Owner: mobile engineer (P6c: the recovery screen), qa engineer (points 3 and 5), design systems (points 4 and 7). Milestone: M11. Size: M (one PR per point is fine). Depends on: none.
- Priority: Low; point 1 Medium, because a persistent failure costs extra open attempts on every tap.
- Gate: none; the screen is reached only after a failed database open.
- Satisfies: none given. Cited: D-085 (the recovery screen offers no delete, reset or rebuild).
- Problem and evidence (from #394's body, its residual lists and its "For the wave 4 product agent" list; every cite re-opened at 146a8ff; none run on a phone: unverified):
  1. `PlainScreen` can open the store during a render. `useSchemeSafely` (`apps/mobile/src/components/resilience/plain-screen.tsx:28-37`, called at `:74`) reads the saved appearance with `getSetting`, which goes through `ctx()` and so calls `openStore()` when no connection is open (`apps/mobile/src/lib/store.ts:188-194`, `:240-242`). On a persistent failure a render of the recovery screen can run the update steps again. #394 estimates about 3 attempts per Try again tap (from the code, not measured), and a stale "did not open" line is possible if the failure clears between the hook's attempt and the render. Fix: read the appearance on this screen without opening the store.
  2. Android may announce the new line twice (the live region at `plain-screen.tsx:147` and `announceForAccessibility` at `:113`). That is BL-467 point 4, which cites this line as `:109`; not filed again.
  3. The journey record is stale. `docs/release/journey/steps/J20-02.json`, `docs/release/journey/INDEX.md:273` and `screens/J20-02.png` still carry the old launch words, and only the journey-record PR commits them (`docs/release/journey/README.md:22`); no entry tracks the refresh. The flow's step note (`apps/mobile/e2e-web/j20-crash.flow.ts:90`) will be copied into the record as written, and it explains what the screen does not say ("and does not say the letters are safe"): reword it to describe the screen only before that record PR. The new test in that file is not a recorded step, so the count stays 203.
  4. Large text on an SE 3. The launch body is 86 characters against 51 before (`packages/content/src/strings.en.ts:1022`), and the critics' L1 already put the words below the fold at AX5 on a 375 by 667 phone: a 297 pt window for 1019 pt of words (`P6C_P8C_CRITICS_PASS_2026-10-30.md:98`). `PlainScreen` keeps its buttons outside the scroll (`plain-screen.tsx:123-153` is the scroll, the buttons follow). S1-34 (e) asks for the device run (`docs/qa/DEVICE_TEST_PLAN.md:448`). The critics' fix: at accessibility sizes put the actions inline after the words, as the sign-in sheet frame does (`apps/mobile/src/lib/auth/ui.tsx:77-92`, `inlineFooter` at `:92`).
  5. Tests. The hook's initial open effect and the preview fault seam (`apps/mobile/src/lib/resilience/use-launch.ts:24-26`, `:19`) are covered by the web e2e `j20-crash` and by source scans (`apps/mobile/test/launch-retry.test.ts:419-425`) only. The e2e runner on #394 reported that the first `j20-crash` run timed out cold on a 10 s expect (the source is the run, not the PR body; unverified) (`apps/mobile/e2e-web/playwright.config.ts:19-20`: test 90 s, expect 10 s): a warm-up or a longer first timeout. BL-464 is a different cold-boot failure (`local_db_migration_failed:1` on seeded flows); whether the two share a cause is unverified.
  6. A comment is untrue. `apps/mobile/src/app/_layout.tsx:130` still says "and nothing is deleted". Try again runs the update steps, and v2 and v3 delete three settings keys (`apps/mobile/src/lib/db/migrations.ts:134`, `:168`; claims row E8, `docs/reviews/2026-10-claims-inventory.md:143`). #394 reworded the three other comments that said so.
  7. The README inside the export ZIP. `errors.launch.readme` (`packages/content/src/strings.en.ts:1032-1033`) says "Nothing here was changed or removed", which cannot be shown for the book itself (claims row E8, unverified), and offers help with no address (the critics' L2; `publisher.supportEmail` exists, `packages/brand/index.ts:35`). The spec marks the row KEEP (`EXPERIENCE_PASS_2026-10.md:1243`), so the spec owner rules on the wording and the address.
  The critics' S2 text said "the code never deletes or changes anything on this screen" (`P6C_P8C_CRITICS_PASS_2026-10-30.md:67`); that is wrong for Try again, and a dated correction note is added to that document in the same PR as this entry.
- Scope: (1) read the appearance without the store on this screen, and a test that a render makes no `openStore()` call; (3) reword the note, and regenerate J20-02 in the next record PR; (4) the inline layout at accessibility sizes, or the owner records why the pinned buttons stay; (5) a warm-up or a longer first expect; a behaviour test for the hook if a stand-in exists (`apps/mobile/test/helpers/mini-react.ts` came with #393); (6) the comment says what the code does; (7) the spec owner's ruling, then the content owner's edit.
- Done when: each point has a test or a recorded result that fails on its mutant, or is recorded here as left as it is; points 2 and 7 are settled where their entries say.

#### BL-496 Two defects from #393's round-3 delta review: a late answer from an earlier account replaces the next account's answer, and Try again can show a passive error
- Status: ready. Mode: agent. Owner: mobile engineer (S14: lib/account-deletion and the deletion screen), qa engineer. Milestone: M9. Size: S. Depends on: none.
- Priority: Medium. The delta review's one Should (PASS WITH NOTES, no Must); the coordinator waived it for build 2.
- Gate: waived for build 2 by the coordinator (30 Oct); before the next build that real families use with sign-in on.
- Satisfies: none given. Cited: C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`).
- Problem and evidence (the round-3 delta review of #393, relayed by the coordinator; the code came with #393, merged as 146a8ff, and every cite was re-opened on that tree; both points are code reading and were not run: unverified):
  1. A late answer from an earlier account replaces the next account's answer. `askServer` (`apps/mobile/src/lib/account-deletion/use-first-run-gate.ts:59-73`) writes through `say` (`:60`), which resets the answer slot to the asking account whenever the slot belongs to another account. The read effect's cleanup only clears the cap timer (`:72`, `:104-107`), so a read that outlives its account still calls `say` when it ends, and the with-book read effect has no cleanup at all (`:112-116`). The sequence: A is signed in on a phone whose closed book is still local (`server_state='deleted'`); A's read stalls; A signs out and B signs in on the same Onboarding mount; B's read answers `none`, so B sees the welcome; A's stalled read then ends, even as a failure. The slot becomes `{ for: A, checked: true }`, `checked` is false for B, and `chooseScreen` answers `checking` for a signed-in phone with a closed book (`apps/mobile/src/lib/account-deletion/open-request.ts:239`). `CheckingScreen` has no button, not even Sign out (`apps/mobile/src/components/settings/open-deletion.tsx:99-111`), so B sees paper until the app is relaunched. It needs two accounts and a read that outlives the other's whole sign-in.
  2. Try again can show a passive error on the "Deletion cancelled" screen. `pressReducer` sets `acted` for any press, `retry` included (`apps/mobile/src/components/settings/open-deletion.logic.ts:39`), and the screen shows `failureLine(d.error)` once `acted` is set (`open-deletion.tsx:60`). The screen mounted offline after a cancel (the refresh set `error` to `offline`), the person taps Try again, and "Nothing has changed. Deleting an account needs a connection." (`errors.offline`, `packages/content/src/features/account-deletion.en.ts:107`) appears under "on their way back".
- Scope: (1) ignore a `say` whose `askedAs` is not the latest account asked (a ref set at the start of each ask), or keep the answers per account; (2) only a Cancel press sets `acted`.
- Done when: (1) a hook-level test with the stand-in (`apps/mobile/test/helpers/mini-react.ts`) shows A's late answer after B's leaves B's `checked` true, and it fails on the two mutations the review says survive today (the tag reset in `say` removed; the `askServer` cleanup removed); (2) a reducer test shows a `retry` press leaves `acted` false and a `cancel` press sets it.

#### BL-497 Device plan and run sheet fixes after #393: the S1-35 (d) wait, the S2-13 time, and the S1-35 Update line
- Status: done (docs only, branch `docs/qa-bl497-device-plan`: S1-35 (d) and its Update line in `docs/qa/DEVICE_TEST_PLAN.md`; block 8's time, the close, the end and the total in the T11 sheet; none of it run on a phone). Mode: agent. Owner: qa engineer. Milestone: M9. Size: S. Depends on: none.
- Priority: Low. The founder runs these checks on staging; point 1 is Medium if the check is run before it is fixed.
- Gate: the build 2 checks session (`docs/qa/run-sheets/README.md:58`).
- Satisfies: none given.
- Problem and evidence (the round-3 delta review of #393, relayed by the coordinator; the plan lines are on `develop` since #393 added S1-35 at `docs/qa/DEVICE_TEST_PLAN.md:461`; this PR edits neither file, as the coordinator asked):
  1. S1-35 (d) (`docs/qa/DEVICE_TEST_PLAN.md:467`) says that after the grant is restored "the phone's next sync brings the book back". The revoked grant makes `sync_pull` fail with 42501, which `classifyCallError` files under `server` (`apps/mobile/src/lib/sync/errors.ts:33`). A failed pull only records `lastFailure` (`apps/mobile/src/lib/sync/engine.ts:238-241`); the backoff (1 s, doubling to 5 minutes, `errors.ts:3-5`, `:37-39`) is written to the outbox's head op (`engine.ts:197`, `:219`), and `scheduleRetry` arms a timer only when an outbox op exists (`engine.ts:302-313`). A phone with an empty outbox has no retry timer: the next sync starts on a foreground (`apps/mobile/src/lib/sync/index.ts:235`, no sooner than 5 s after the last cycle, `engine.ts:91`, `:341`), on Try again (`syncNow`) or when the outbox changes. So the wording should tell the tester to send the app to the background and open it again, not to wait. Code reading, not run: unverified.
  2. The T11 session sheet gives S2-13 25 minutes (`docs/qa/run-sheets/2026-10-30-T11-session-1.md:63`, the 15:55 row), and #393's body estimates about 45 for S2-13 (a) to (h) with its base steps, and about 55 for S1-35 (20 of them a wait). The figures are in #393's body only; I found them in no file. Adding 20 minutes to the row moves the close and the total (the sheet states 7 h 15 min of device time against the 8-hour W2 budget, `:65`; my sum is 7 h 35 min, unverified against the sheet's other rows).
  3. S1-35's Update line (`DEVICE_TEST_PLAN.md:482`) points at an S64 acceptance box, "a sole parent can reach Cancel deletion", that the spec does not contain: `docs/design/EXPERIENCE_PASS_2026-10.md` has four boxes (`:1633-1637`). The critics' section 5 gives that edit to the spec owner (BL-491 point 4).
- Scope: edit `docs/qa/DEVICE_TEST_PLAN.md` (points 1 and 3) and the T11 sheet (point 2), keeping the sheet's end time and total in step with the row.
- Done when: S1-35 (d) tells the tester to send the app to the background and open it again once the grant is back; the T11 row for S2-13 gives the time the plan needs, with the end time and the total following; the Update line names the box as proposed until the spec has it.

## Review follow-ups, wave 5 (30 Oct 2026)

Found in the independent reviews of four PRs of 30 Oct 2026: #408 (BL-485 option (b), merged as 2980f3e), #409 (the Delete account row switch `EXPO_PUBLIC_ACCOUNT_DELETION`, branch `feat/mobile-account-deletion-switch`, merged as e4fd94d), #410 (build 2's "What to test" variants, branch `fix/content-delete-line-build2`, merged as 2af7f4c) and #406 (D-127 to D-130, merged as e2598b9; #405, the CTO rulings, merged as ad43534). The findings reached me in the task brief and in the bodies of #408 to #410; I did not read the review comments themselves. Filed here by the product agent in the format of BL-485 to BL-497. The entries were first written at 2980f3e, when #409 and #410 were still open and read at their heads; every file:line cite was then re-opened on `develop` at e4fd94d, the tip after both merged, and the entries that cite files only they added or changed (BL-499, BL-500, BL-501, BL-506, BL-507) were re-cited there. The counsel relay document is not in the repo, so its item numbers (29 to 32) are the coordinator's and unverified here. "Unverified" means I could not find or run it. `needs-decision (...)` names who decides in the parenthetical (the BL-447, BL-448 and BL-474 precedent); an entry that waits on another entry names it, as in `blocked (BL-485)`. Already filed and cross-referenced, not repeated: BL-485 option (a) (the withdrawal sheet; its status line is updated in this PR), BL-486 (a server guard while a request is open), BL-491 (Delete account decisions) and BL-493 (open-deletion gate edge cases). Priorities are the product agent's call; a heading carries a [Critical] or [High] tag (BL-486 carries [Medium], the one exception), so these entries have a `Priority:` line and no heading tag.

#### BL-499 Cancel deletion has no path on a phone that lists a book while the Delete account row is hidden
- Status: needs-decision (the founder confirms which Cancel path before it merges: options (a) and (b) show a row or a route again in a build where D-129 hides it, and option (c) adds a line outside the hidden page; no D-### or Q-### exists yet). Mode: pair. Owner: mobile engineer (S14: lib/account-deletion), qa engineer. Milestone: M9. Size: M. Depends on: none.
- Priority: Medium. Accepted for alpha builds 1 and 2 by the ruling R2 in #409's body (merged as e4fd94d); needed before the variable is ever switched off after it was on, and before anyone outside the family has a servers-on build.
- Gate: those two moments. The first is #409's own follow-up ("before the variable is ever switched off after being on"). The second, before anyone outside the family has a servers-on build, is this backlog's own and not D-129's. Until then `docs/release/TESTFLIGHT.md:110` (step 9) states two rules: no drill account on an alpha binary while a deletion request is open on it, and the variable is not dropped from the next build while any `deletion_requests` row is `scheduled` or `held`.
- Satisfies: none given. Cited: C-REQ-019 and LEGAL-REQ-029 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`, the in-app deletion with its 30-day undo), D-129. Related: BL-500 (its option (b) widens who can be stranded here).
- Problem and evidence (re-opened on `develop` at e4fd94d; none run on a phone: unverified):
  1. The first-run gate answers `app` for any phone that lists a book, before it looks at a request: `if (phone.hasBook) return 'app';` (`apps/mobile/src/lib/account-deletion/open-request.ts:232`). Only a phone with no book reaches the open-request screen, which holds Cancel deletion and is not behind the switch (D-129 point 3).
  2. Every other phone cancels on Settings > Delete account (the button is labelled `c.scheduled.cancelButton` at `apps/mobile/src/app/settings/delete-account.tsx:152` and calls `d.cancel()` at `:154`). The row is drawn only when `capabilities.accountDeletion` is true (`apps/mobile/src/app/settings/index.tsx:116-122`) and `DeleteAccountRoute` redirects to Settings when it is false (`delete-account.tsx:57-58`).
  3. So with the variable off, three kinds of phone have an open request and no Cancel: a co-parent, a sole parent who also co-parents another book, and a sole parent before the closing pull arrives (the same three that D-129's Effects line names).
  4. How a phone gets there: a request can only be opened from a build where the row is on (a development client, or a build made with the variable on), so in practice the founder's drill accounts. #409's body accepts it for builds 1 and 2. That claim holds only while no support or email route can file a request. `docs/emails/CATALOG.md:116` lists `deletion-confirm`, a web link ("route still to build") that files a request with `source='support'` from any browser, and BL-500 option (b) would add a manual route for testers. Either would let a person on a hidden-row build have an open request, and widens who can be stranded.
- Scope: the founder confirms the path and the owner then builds it, saying why in the PR. (a) Keep the row and the route open on a phone that holds a local open-request note (the setting `accountDeletion.openRequest`, `open-request.ts:32`; `noteIsDead` decides when it no longer counts, `:187-198`), whatever the variable says: covers only a request made on this phone. (b) A status read from Settings (`loadStatus`, `apps/mobile/src/lib/account-deletion/api.ts:48`) that draws the row only when the server says a request is open: covers a request made on another phone, costs a read and needs offline words (content, and counsel, because it is a deletion term). (c) A path with no row, which #409's body names as "a Cancel path outside the hidden page": a line on Account or on Settings that appears only when a local open-request note or a server status read says a request is open, and that opens Cancel deletion. Same words and counsel rule as (b). Options (a) and (b) show a Delete account row or route in a build where D-129 hides it, and (c) shows another surface there, so all three differ from what D-129 hides; D-129 is not edited here.
- Done when: with the variable off, a test shows a phone that lists a book and has an open request reaches Cancel deletion, and a phone with no open request gets no new row, line or route; the pick and its reason are recorded here.

#### BL-500 What build 2 tells testers about deleting an account while the row is hidden (counsel and the founder)
- Status: needs-decision (counsel and the founder: how the tester text treats a hidden Delete account row; counsel relay item 30, as the coordinator numbers it; no D-### or Q-### exists yet). Mode: pair. Owner: legal, content, qa engineer (B2-17), founder. Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. A mandatory item and the default text that #410 shipped disagree.
- Gate: the family build can go out as #410 left it; settle before the first friend outside the family gets build 2.
- Satisfies: none given. Cited: C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`), D-129.
- Problem and evidence (re-opened on `develop` at e4fd94d, after #410 merged as 2af7f4c):
  1. `docs/legal/TESTFLIGHT_TESTERS.md` 5.2, "Must say, by build" (`:111`), lists for build 2: "delete your account and its letters in Settings, Delete account (its own row, below Your data)" (`:116`).
  2. Go/no-go row B2-17 (`docs/qa/ALPHA_GO_NO_GO.md:59`) names `testflightCopy.whatToTest.build2` as the text to check.
  3. D-129 hides the row by default. On `develop`, `whatToTest.build2` is `build2Text(false)` (`packages/content/src/release/testflight.en.ts:140`) and has no delete sentence; `whatToTest.build2WithDeleteRow` (`:147`) is the same text plus `deleteAccountLine` (`:74`, exported at `:108`), for a build made with the row on. No replacement sentence is written for the hidden case on purpose (the comment at `:72-73`: those words are the founder's and counsel's). `docs/release/TESTFLIGHT.md:126` says which text to paste, and `:204` records this conflict with 5.2 and B2-17 as open for counsel and the founder.
  4. So the default text leaves out an item that 5.2 calls mandatory, and B2-17 reads the text that leaves it out.
- Scope: counsel and the founder pick one. (a) Make the 5.2 item and B2-17 conditional on the row being on (legal edits 5.2, QA words the row). (b) Say in the hidden-row text how a tester asks for deletion, for example by email, only once a manual route exists that the purge worker can keep (no such route is built or promised in anything I found: unverified). Such a route would also let a person on a hidden-row build have an open request, which widens who can be stranded in BL-499. (c) Keep the text silent for the family build and settle (a) or (b) before friends. The product agent's suggestion: (c) now, as #410 does, then (a), because (b) promises a route nobody has built.
- Done when: the choice is recorded here and, as the founder decides, in `docs/DECISIONS.md`; 5.2, B2-17 and the default text no longer disagree; with (b) the words are in `packages/content` with counsel's read and a test.

#### BL-501 Words that send a person to Settings, Delete account while the row is hidden: three emails, the Terms, the policy, the pages and a runbook template (counsel)
- Status: needs-decision (counsel: whether each line may stand while the row is hidden, and the words if not; counsel relay items 31 and 32, as the coordinator numbers them; no D-### or Q-### exists yet). Mode: pair. Owner: legal, content. Milestone: M9. Size: M. Depends on: none.
- Priority: Medium. Interim rule, from #410's body: support leaves the line at point 2 out of a hand reply while the row is hidden (support's own instructions are not read here).
- Gate: the family build can go out as it is; settle before the first friend outside the family and before the Terms and policy text goes live for a build with sign-in (D-100's legal-pages gate).
- Satisfies: none given. Cited: C-REQ-019 (`docs/legal/ENGINEERING_REQUIREMENTS.md:224`), D-129.
- Problem and evidence (re-opened on `develop` at e4fd94d; the live website and live legal pages are unverified):
  1. `packages/content/src/emails/account.en.ts:51`, in `account-deletion-scheduled`: "Until then, you can sign in and cancel the request in Settings, Delete account." The purge worker composes it (`supabase/functions/purge-worker/emails.ts:74`) after a request exists, so it reaches only a person who already asked.
  2. `:152`, in `deletion-request-received`: "If you can open the app, you can also do this yourself: Settings, Delete account." It is an Ops email for a deletion asked for by email (`docs/emails/CATALOG.md:115`); I found no code that sends it, and #410's body says support sends it by hand. It is the line most likely to reach a tester while the row is hidden.
  3. `:253`, in `policy-update`, the clause "delete your account in Settings, Delete account." I found no sender (searched `supabase`, `apps/mobile/src` and `scripts`).
  4. `packages/content/test/server-surfaces-account-deletion.test.ts:153`, `:165` and `:166` pin all three unconditionally, so a change moves the test with it.
  5. `docs/legal/terms-of-service.md:143` (8.4): "You can delete your account in the app at any time." `docs/legal/privacy-policy.md:225` puts the action under "In the app (Settings, Your data), or by email". Both are drafts for counsel.
  6. `docs/ops/runbooks/incident-notification.md:54`, a runbook template for a notice to families: "or delete your account (Settings, Delete account)". A ruling on the emails would cover it too.
  7. `packages/content/src/pages.en.ts:199` and `:223` say Settings, then Your data, then Delete account. In the app the row is its own section (`apps/mobile/src/app/settings/index.tsx:116-122`), so this is wrong with the row on or off. Nothing in this repo renders these pages (`apps` holds only `mobile`); the live site is unverified. LEGAL-REQ-029 (`docs/legal/ENGINEERING_REQUIREMENTS.md:225`) also says "Settings > Your data > Delete account"; a requirement is not edited here, so a change goes in the PR body for the founder.
- Scope: counsel rules per line: stand, drop while the row is hidden, or words that are true either way. The purge worker cannot read a build variable (my reading: unverified), so a conditional email is unlikely; the likely forms are dropping the sentence or counsel's either-way words. Content then edits, and the pinned lines in the test move in the same PR.
- Done when: each line has counsel's ruling recorded here; the files and the pinned test match it; the "Your data" slip in `pages.en.ts` is fixed in that PR even if counsel leaves the rest.

#### BL-502 Settings > Privacy's sync row follows the consent, not whether letters upload: five cases where it reads On or Off and the phone does something else
- Status: blocked (BL-485). Mode: agent. Owner: auth owner (S01), mobile engineer, content (words for any new status). Milestone: M5. Size: M. Depends on: BL-485.
- Priority: Low for build 2, which is family only; #408 recorded it as left open. Counsel relay item 29 (as the coordinator numbers it) covers points 1 and 2.
- Gate: with BL-485 option (a), before any friend outside the family signs in (D-128).
- Satisfies: none given. Cited: LEGAL-REQ-006 (P0, `docs/legal/ENGINEERING_REQUIREMENTS.md:63-67`).
- Problem and evidence (the row is `apps/mobile/src/lib/auth/sensitive-row.ts:30-46`, from #408; its header says it follows the consent and not the claim screen, `:23-24`; every case is code reading, not run on a phone: unverified):
  1. On before the claim is answered. A signed-in phone with letters, before "Keep in this account" is answered: Privacy reads On (`ready`, `sync: 'on'`), Account reads "Not set up yet" (`apps/mobile/src/components/auth/account-view.logic.ts:39-42`), and nothing uploads (`syncAllowed()` is false while a claim is pending, `apps/mobile/src/lib/auth/auth-store.ts:84-86`, `:98-100`).
  2. Account mismatch. `claim()` sets `mismatchUser` (`apps/mobile/src/lib/sync/index.ts:178`), `ensureEngine` then never starts the engine (`:186-189`), and `:206` sets it again if `start()` fails. No Settings or Account line reads the `account_mismatch` phase (`:71`; only the join wait treats it as stalled, `apps/mobile/src/components/family/join-wait.logic.ts:34`), so the person is told nowhere, and both rows read On.
  3. Re-consent. `needsConsent` reads `off`, "Off, kept on this phone" (`sensitive-row.ts:39-40`; `packages/content/src/strings.en.ts:850`), also for a Terms-only or age-only re-consent while the sensitive-data consent still stands.
  4. No timer for `unknown`. `sync: 'unknown'` is read again on a foreground (`apps/mobile/src/lib/auth/session-provider.tsx:244-247`), on Try again (`refreshGate`, `:487`) and by the sign-out wait's 10 second poll (`:271-275`), and nowhere else.
  5. Two things that stop uploads never reach the row: the sync engine's `paused_consent` phase (`apps/mobile/src/lib/sync/engine.ts:142`) and the remote kill switch (`paused: syncKilled`, `sync/index.ts:200`). Neither changes `AuthState.sync`, so the row reads On while letters wait. BL-503 ends in this state: after its sequence the engine can sit in `paused_consent`, and the row still reads On.
- Scope: when BL-485 option (a) lands, the owner decides per point: the row follows a fuller state (a new status value, words by the content owner, counsel's read because it names a consent), or it is left as it is with the reason recorded. Points 1, 2 and 5 are about uploading, point 3 about the consent, point 4 about the clock.
- Done when: each point has a test against the real reducer (`apps/mobile/test/privacy-sensitive-row.test.ts` already runs it) that fails on its mutant, or is recorded here as left as it is; points 1 and 2 also have counsel's answer.

#### BL-503 Auth machine: answering Terms or the age line again turns sync on for a person who declined sensitive-data
- Status: ready. Mode: agent. Owner: auth owner (S01), qa engineer. Milestone: M5. Size: S. Depends on: none.
- Priority: Medium. Not new: the line dates from 3 Oct 2026 (`git blame`). The new Privacy row (#408) makes it visible.
- Gate: before the first build a person outside the family signs in with.
- Satisfies: none given. Cited: LEGAL-REQ-006 (P0, `docs/legal/ENGINEERING_REQUIREMENTS.md:63-67`).
- Problem and evidence (reproduced on an unmodified copy of `apps/mobile/src/lib/auth/machine.logic.ts` at e4fd94d (the file is the same at 2980f3e), run in Node with `--experimental-strip-types`; not run on a phone):
  1. `CONSENT_RECORDED` works out the sync mode from the answered step alone: `const sync: SyncMode = event.step === 'sensitive' && !event.accepted ? 'off' : 'on';` (`machine.logic.ts:171`). It forgets an earlier decline when only Terms or the age line is asked again.
  2. The sequence: `GATE_LOADED` with Terms current, age attested and `sensitiveDeclined: true` gives `ready`, `sync: 'off'`. A later read with Terms no longer current and `sensitiveDeclined: true` gives `needsConsent`, steps `['terms']` (`consentSteps`, `:94-100`). `CONSENT_RECORDED` with Terms accepted then gives `ready`, `sync: 'on'`.
  3. Until the next gate read (a foreground more than 30 minutes after the last, `session-provider.tsx:113`, `:246`; `shouldRecheckGate` is false for `sync: 'on'` before that, `machine.logic.ts:236-237`; the provider does not read again after recording, `:466`), the Privacy row (`sensitive-row.ts:41-44`) and the Account row both read On for a declined consent, `canSync` is true (`machine.logic.ts:225-226`), `syncAllowed()` is true (`auth-store.ts:84-86`, `:98-100`) and the sync engine can start (`sync/index.ts:186`). I expect the server's consent gate to hold the pushes: `sync_push` returns `paused` on `SCCON` (`supabase/migrations/20261016000000_sync_v1_server.sql:1265-1267`), which `public.require_content_consent()` raises unless Terms, age and sensitive-data consent all stand (`supabase/migrations/20261003000000_security_and_family.sql:189-206`), and the withdrawn case on real SQL ends in `paused_consent` (`apps/mobile/test/sync-e2e.test.ts:424-441`). Whether a declined sensitive-data consent from this reducer sequence behaves the same was not run by me: unverified. If it does, the engine sits in `paused_consent`, a phase that never reaches the Privacy row (BL-502 point 5), so the row reads On while nothing uploads.
- Scope: the reducer must not turn sync on unless the last gate allowed content. The owner picks and says why: carry what the gate said into `needsConsent` (for example `sensitiveDeclined`), or read the gate again after recording.
- Done when: a failing reducer test first, in `apps/mobile/test/auth-machine.test.ts`, with the sequence above and the same sequence for the age step; then the fix, with the existing cases still green (a decline answered in the same pass still gives `off`, and a pass where every step is accepted gives `on`).

#### BL-504 useSensitiveDataStatus returns the `open` it read at render, so a mounted row can keep a stale one
- Status: blocked (BL-485). Mode: agent. Owner: mobile engineer, qa engineer. Milestone: M5. Size: S. Depends on: BL-485.
- Priority: Low. No source registers an `open` today (#408 registers none and its test pins that), so nothing is wrong on screen now. It matters when BL-485 option (a) registers one.
- Gate: with BL-485 option (a), before any friend outside the family signs in.
- Satisfies: none given.
- Problem and evidence (re-opened on `develop` at e4fd94d; code reading, not run: unverified): `useSensitiveDataStatus` returns `{ status, open: source.open }` (`apps/mobile/src/lib/analytics/privacy-sources.ts:67`), reading `open` from the module variable at render. The hook re-renders only when `status` changes (`setStatus` with an equal value does nothing, `:57-58`). If a later source adds an `open` while the status stays the same, the mounted row never re-renders and keeps the old `open`, so it stays a plain row with no chevron and no press handler (`apps/mobile/src/app/settings/privacy.tsx:69-75` disables the row only for `signed_out`; On, Off and Waiting for a connection are not disabled, they are a plain view because `onPress` is undefined, `apps/mobile/src/components/ui/list-row.tsx:107-111`). #408's tests cover a status change after a new source and the absence of `open`, not an `open` that appears later.
- Scope: keep `{ status, open }` together in state and set both in `attach` (`privacy-sources.ts:55-59`), or bump a version in `attach`; the owner picks.
- Done when: a hook test with the stand-in (`apps/mobile/test/helpers/mini-react.ts`, used by `privacy-sensitive-row.test.ts`) mounts the hook with a source that has no `open`, registers one that has an `open` and the same status, and sees the new `open`; it fails on the current hook.

#### BL-505 The Privacy footer promises a switch and a deletion offer that build 2 does not have (counsel)
- Status: needs-decision (counsel: the footer's words while no withdrawal control exists, and the split; counsel relay item 29, as the coordinator numbers it; no D-### or Q-### exists yet). Mode: pair. Owner: legal, content. Milestone: M9. Size: S. Depends on: none.
- Priority: Medium. It states a control that does not exist, in a build that is family only.
- Gate: build 2 goes out with it as it is, with the counsel note D-128 asks for; the split lands with BL-485 option (a), before any friend outside the family signs in. The footer is a `packages/content` string, so a counsel answer before the freeze (Tue 3 Nov 2026, 5:00 AM PT, D-130) can still reach build 2, and after the freeze it cannot.
- Satisfies: none given. Cited: LEGAL-REQ-006 and LEGAL-REQ-008 (P0, `docs/legal/ENGINEERING_REQUIREMENTS.md:63-67`, `:78`), D-128.
- Problem and evidence (re-opened on `develop` at e4fd94d): `settings.privacy.sensitiveHelp` (`packages/content/src/strings.en.ts:848`) reads "Letters can hold health details about you or {child}. Turn this off to stop syncing, and we will offer to delete what already synced." It is the footer of the sync row (`apps/mobile/src/app/settings/privacy.tsx:68`). Build 2 has no switch and no deletion offer (BL-485 option (b) is merged in #408). #408 left the key alone because its first sentence is the health disclosure counsel asked for (the comment at `strings.en.ts:847`). D-128 lists the footer as a follow-up that pairs with the counsel note.
- Scope: after counsel answers, split the key: the health sentence always, the turn-off sentence only when a withdrawal control exists (the row has an `open`, `privacy-sources.ts:26`); `privacy.tsx` picks the parts from `useSensitiveDataStatus().open`. Counsel may also reword the health sentence.
- Done when: counsel's answer is recorded here; with no `open` the footer shows the health sentence only, and with an `open` it shows both, each with a test; the pinned words move with the key.

#### BL-506 The preflight's .env* guard is pinned by source regexes only, and a mutant that discards its result survives
- Status: ready. Mode: agent. Owner: qa engineer, mobile engineer. Milestone: M12. Size: S. Depends on: none.
- Priority: Low. The guard function itself is tested on strings; the wiring is not.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (re-opened on `develop` at e4fd94d, where #409 merged; none of it run through vitest here):
  1. Section 4 of the preflight computes `const bad = envFiles.flatMap((f) => envFileProblems(f, read(join(MOBILE, f))));` with `envFileProblems` from `apps/mobile/scripts/env-file-guard.mjs` (`apps/mobile/scripts/preflight-testflight.mjs:361`) and then a `check` on `bad.length === 0` (`:362`). `MOBILE` comes from the script's own location (`:31`), so a test cannot point the script at another directory.
  2. `apps/mobile/test/account-deletion-switch.test.ts` tests `envFileProblems` on strings (`:213-240`), spawns the preflight without planting any `.env*` file (`:255` on), and pins the wiring with five source regexes (`:242-252`).
  3. I added the line `bad.length = 0;` after `:361` in a copy of the script on e4fd94d and ran the five regexes by hand: all five still match, so the suite would stay green while the guard did nothing. I did not run it through vitest: unverified.
- Scope: the preflight takes its app directory from an argument (default: today's location), and a test spawns it against a temp copy holding a planted `.env.local` that sets the variable, then expects the FAIL line and a non-zero exit. The regexes stay or go as the owner prefers.
- Done when: the planted-file test fails on the `bad.length = 0` mutant and on removing the `check` call, and passes on the real script.

#### BL-507 QA docs after D-129 and D-130: the S1-35 row's build, how B2-13 is run, the flip section, and the preflight's order of lines
- Status: ready (points 1 and 4 now; points 2 and 3 need the founder's confirmation of the rule before QA writes it). Mode: agent. Owner: qa engineer (points 1 to 3), mobile engineer (point 4). Milestone: M12. Size: S. Depends on: none.
- Priority: Low.
- Gate: points 1 to 3 ahead of the sole-parent drill (Mon 2 Nov noon PT, D-129); all of it before the go/no-go (Mon 9 Nov, D-130).
- Satisfies: none given. Cited: D-129, D-130.
- Problem and evidence (re-opened on `develop` at e4fd94d, after #409 merged):
  1. `docs/qa/DEVICE_TEST_PLAN.md:28` lists S1-35 for "Build 2 (B2-10)". The drill that gates the switch is earlier, on a development client with the variables in the shell (D-129; `docs/release/TESTFLIGHT.md` step 9, the drill paragraph at `:111`). D-129's Effects line says QA updates that row; #409 edited the "Needs" lines of S1-35 and S2-13 (`DEVICE_TEST_PLAN.md:463`, `:504`) and left this row as it is.
  2. Go/no-go row B2-13, "Account deletion works on staging end to end, and verification finds no residue" (`docs/qa/ALPHA_GO_NO_GO.md:55`, never waived), is not changed by D-129, and a hidden row does not satisfy it. The row does not say how it is run while build 2 hides the row. QA writes which run counts (the drill's, or a run of build 2 with the variable on) and the founder confirms, because the row is never waived.
  3. `docs/release/TESTFLIGHT.md`, "The flip after the R-17 gate" (`docs/release/TESTFLIGHT.md:155`), does not say that the variable must be on, and B2-13 passed, before a servers-on build reaches an external group or Beta App Review. The founder confirms this rule before QA writes it: D-129 has no such rule, and B2-13 supports only the B2-13 half of it.
  4. The preflight prints `PASS Delete account row: hidden (EXPO_PUBLIC_ACCOUNT_DELETION is not on)` for build 2 (`apps/mobile/scripts/preflight-testflight.mjs:209`) and then its UNVERIFIED line about the EAS environment (`:212`). For build 2 that PASS only describes `eas.json` and the shell, which are not what decides the row (the EAS `preview` environment does), so an UNVERIFIED line alone would be more honest. A PASS stays right where the build has no servers (`:210`).
- Scope: points 1 to 3 are doc edits; point 4 changes the script, with its test beside the other preflight tests in `account-deletion-switch.test.ts`.
- Done when: the plan row names the drill and its date; B2-13 says how it is run; the flip section names both conditions once the founder has confirmed them; a test on the preflight output for both profiles shows no PASS line for build 2's row.

#### BL-508 The test that the session provider registers the Privacy row is a formatting-sensitive regex
- Status: ready. Mode: agent. Owner: qa engineer, mobile engineer. Milestone: M5. Size: S. Depends on: none.
- Priority: Low.
- Gate: none.
- Satisfies: none given.
- Problem and evidence (re-opened on `develop` at e4fd94d): `apps/mobile/test/privacy-sensitive-row.test.ts:256-258` pins the provider with two regexes on its comment-stripped text, an import line and `useEffect(() => { registerSensitiveDataRow(); }, [])`. The effect is at `apps/mobile/src/lib/auth/session-provider.tsx:193-195`. A harmless reformat (another callback shape, the effect moved into a hook) turns the test red while the behaviour holds, and a registration moved somewhere that never runs would still pass. The provider imports React Native and cannot render in Node, and the repo has no component renderer (the header of `apps/mobile/test/helpers/mini-react.ts`: no `react-test-renderer`, tests run in a Node environment); the stand-in covers hooks only.
- Scope: if the effect can move into a small hook in a file the stand-in can run, replace the regexes with a behavioural check that mounting it registers a source whose `read` follows the auth snapshot. If not, keep the regexes, add a comment on them saying what they pin and what a refactor must keep, and record that here.
- Done when: either a test fails when the registration call is removed from what runs on mount, or the pin carries its reason and this entry says it is left as it is.

## Review follow-ups, wave 6 (31 Oct 2026)

Recorded from the comms validation reviews of 31 Oct 2026 (`docs/reviews/2026-10-31/`: `signin.md`, `subscriptions.md`, `email-templates.md`, `language.md`, `setup.md`) and their closure review (`CLOSURE_REVIEW.md`), on branch `fix/comms-validation-2026-10-31`. Each item is outside that branch's reach: website copy and pages live on `main` (`apps/web`), `supabase/**` was held by a database test run, or the work is planned for a later build. Ids BL-509 to BL-527; every branch was searched first and none of them was used.

### Website (web lane, `apps/web` on `main`)

#### BL-509 Website `authConfirm.expired` names an error the app never shows (SIGN-08)
- Status: ready. Mode: agent. Owner: web lane. Milestone: M12. Size: S. Depends on: none.
- Priority: Low. Gate: before build 2 (the first build with sign-in, D-121).
- Problem and evidence: `site.ts` `authConfirm.expired` on `main` says "If the app says the code has expired, tap 'Send a new email'". The app never says a code expired: `otp_expired` in code context maps to `wrong_code` ("That code didn't match", `apps/mobile/src/lib/auth/errors.logic.ts`). `docs/reviews/2026-10-31/signin.md` SIGN-08.
- Scope: change the line to "If the code does not work, tap Send a new email in the app." Content rules apply.
- Done when: the page text on `main` says it, with the website's copy test updated.

#### BL-510 Website `/open` page and AASA path (TPL-06)
- Status: ready. Mode: agent. Owner: web lane. Milestone: M12. Size: S. Depends on: none.
- Priority: High for build 2. Gate: build 2 (the first release with server features, D-121).
- Problem and evidence: `{appUrl}` in 14 emails points at `/open` (`packages/emails/src/links.ts`, `docs/emails/CATALOG.md` "Website pages emails need"). The website does not serve it and the AASA file does not hand it to the app.
- Scope: a `/open` page (opens the app, or the App Store when it is not installed) and the AASA path; add it to the route contract test.
- Done when: `/open` serves on `main`, the AASA lists it, and the emails route test passes against the website list.

#### BL-511 Website `/stop` page (TPL-06)
- Status: blocked (before owner backup ships, D-121 item 2(c)). Mode: agent. Owner: web lane. Size: S.
- Problem and evidence: `backup-restore-requested` links `/stop#<token>` (`supabase/functions` escrow `restore.ts`, `packages/api/src/server/recovery-key.ts`). No page serves it.
- Scope: the page reads the token after `#` (never sent to the server in a query) and calls the stop endpoint; words in `packages/content`.
- Done when: the page exists before owner backup is switched on, with a test that the token never leaves the fragment.

#### BL-512 Website `/subscription-terms` page (TPL-06, SUB-10)
- Status: ready. Mode: agent. Owner: web lane, legal. Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. Gate: before the reminder emails ship (D-121 item 2(b)), or point `{subscriptionTermsUrl}` at `/terms` instead.
- Problem and evidence: `trial-started` and `plus-started` link `/subscription-terms`; the StoreKit test file now names it too (SUB-11). The website does not serve it.
- Scope: publish `docs/legal/subscription-terms.md` at `/subscription-terms` once the founder merges the legal text (D-125 item 5).
- Done when: the page serves the current version and the emails route test lists it as built.

#### BL-513 Website `/delete-account/confirm` page (TPL-06)
- Status: blocked (before the D-042 email route takes requests). Mode: agent. Owner: web lane, privacy engineer. Size: S.
- Problem and evidence: `deletion-confirm` links `/delete-account/confirm`; no page serves it, so the email stays Ops-only (`docs/reviews/2026-10-31/email-templates.md` TPL-06).
- Scope: the confirm page and its call, with the words in `packages/content`.
- Done when: the page exists and `deletion-confirm` can move off Ops-only.

#### BL-514 Website `/open/export/<id>` route (TPL-06)
- Status: deferred (v1.1). Mode: agent. Owner: web lane. Size: S.
- Problem and evidence: `export-ready` links `/open/export/<id>`; the route is not defined (`email-templates.md` row export-ready).
- Scope: the route and its AASA path, handing the id to the app's export screen.
- Done when: the route serves and the email's link opens the export in the app.

#### BL-515 Website `/auth/confirm` handling matches the app (SIGN-04, website side)
- Status: ready. Mode: agent. Owner: web lane. Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. Gate: build 2.
- Problem and evidence: the AASA on `main` hands `/auth/confirm` to the app. The app now accepts it (`apps/mobile/src/lib/auth/links.logic.ts`, SIGN-04), but the website page and its fallback were written for `/auth/callback` only (`signin.md` SIGN-04). No redirect sends `/auth/confirm` yet (`docs/ops/AUTH_SETUP.md` 5.1).
- Scope: the `/auth/confirm` page shows the same "open the app, or type the code" fallback as `/auth/callback`, never reads or logs the token, and says the same words as the app.
- Done when: both paths behave the same in the website's tests.

### Server lane (`supabase/**`)

#### BL-516 Two stale comments under `supabase/` (closure review N4)
- Status: ready. Mode: agent. Owner: data architect. Milestone: M12. Size: XS. Depends on: none.
- Priority: Low. Gate: none (comments only, but `supabase/**` needs the D-041 review).
- Problem and evidence: `supabase/config.toml:38` says "/auth/confirm is not listed until the app accepts it (SIGN-04)"; the app accepts it now, and the real reason it is not listed is that no code sends it as a redirect. `supabase/templates/README.md:59-61` says the app does not accept `email_change`; it does now (SIGN-10). Left alone on 31 Oct because a database test run held `supabase/**`.
- Scope: reword both lines. No setting changes.
- Done when: both lines match the code and `supabase/tests/auth_config.test.mjs` still passes.

#### BL-517 Billing reminder email scheduler (TPL-03, SUB-03)
- Status: blocked (after build 2, D-121 item 2(b); WP-F14-16 in `docs/prd/v2/08-delivery.md`). Mode: agent. Owner: payments engineer, sync owner. Size: M.
- Problem and evidence: no function sends any billing template (`trial-ending-*`, `annual-renewal-*`, `plus-started`, `plus-cancelled`, `plus-ended`). Terms 14.6 says the emails are not sent yet and what they will contain (`docs/legal/CHANGES-2026-10-31.md`).
- Scope: a scheduler that sends the D-022 windows to the payer only (D-080), through `generated/resend.ts`, with the amount and period from the status report; update Terms 14.6 in the same release.
- Done when: each window sends once in a test, never to a Family Sharing member, and the legal text says emails are sent.

### App (mobile)

#### BL-518 The second reminder prime (after the first month chapter)
- Status: ready. Mode: agent. Owner: mobile engineer (asks). Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. Gate: none.
- Problem and evidence: C-REQ-001 Rev allows at most two primes; F13 6.2 B row 4c places the second after the first month chapter. Only the first is built (`apps/mobile/src/lib/asks/next-ask.logic.ts:7`, SET-02).
- Scope: offer `reminder_prime` again once after the first month chapter, inside the cap of 2 (`MAX_REMINDER_PRIMES`) and the one-ask-per-session rule.
- Done when: `test/next-ask.test.ts` covers the second prime and the cap, and a web journey shows it.

#### BL-519 Keep the book re-offer after the third letter when the person chose Later
- Status: ready. Mode: agent. Owner: mobile engineer (asks), auth owner. Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. Gate: build 2 (the sheet needs `auth.configured`).
- Problem and evidence: F02 6.1 offers Keep the book again after the third letter if the person tapped Later; `next-ask.logic.ts:10` offers it once ("the re-offer is not built", SET-01).
- Scope: one re-offer after the third saved letter when the first was declined, never more, within the session and day caps.
- Done when: `test/next-ask.test.ts` covers offer, Later, re-offer and no third offer.

### Typed invite codes: PR #306 follow-ups (D-120, with BL-445)

All six belong to resuming PR #306 (`fix/invite-redeem-by-code`) under BL-445. They are recorded one per item so none is lost when the PR resumes. Each problem line restates a label from the coordinator's fix list; the full findings are in #306's hold comment (issuecomment-6460527733) and were not re-checked against #306's head here (unverified).

#### BL-520 #306: wrong file name in the header and the PR body
- Status: blocked (BL-445). Mode: agent. Owner: data architect (S02). Size: XS.
- Problem and evidence: the file header and the PR body name a file that is not the one changed.
- Done when: both name the real file.

#### BL-521 #306: APPLY.md step for the typed-code screen
- Status: blocked (BL-445). Mode: agent. Owner: data architect (S02), family owner (S04). Size: XS.
- Problem and evidence: the apply notes (`APPLY.md`) do not cover the typed-code screen the client adds, so whoever applies the migration cannot check it end to end.
- Done when: APPLY.md has the step and its expected result.

#### BL-522 #306: `redeem.brake` alert and its runbook
- Status: blocked (BL-445). Mode: pair. Owner: data architect (S02), platform. Size: S.
- Problem and evidence: F11-REQ-007 asks for an alert within 15 minutes when code redemption reaches the global limit and answers `SCRAT` for everyone. The `redeem.brake` alert and a runbook entry for it do not exist.
- Done when: the alert fires in a test and the runbook says what to do, including that links keep working.

#### BL-523 #306: retention wording for failure rows
- Status: blocked (BL-445). Mode: agent. Owner: data architect (S02), privacy engineer. Size: XS.
- Problem and evidence: the comment and docs for the failed-attempt rows do not say how long they are kept in the same words as the retention schedule.
- Done when: the wording matches the retention schedule and the purge test covers the rows.

#### BL-524 #306: typed-code app copy, including `codes_paused`
- Status: blocked (BL-445). Mode: agent. Owner: content, family owner (S04). Size: S.
- Problem and evidence: the client needs words for each typed-code answer, including `codes_paused` (the global brake); none exist in `packages/content` (`familyCopy` has link words only, D-120).
- Done when: every answer the endpoint can give has words in `packages/content`, passing the content rules.

#### BL-525 #306: a retry after success answers `limited`
- Status: blocked (BL-445). Mode: agent. Owner: data architect (S02). Size: S.
- Problem and evidence: retrying a code that already succeeded can count against the limiter and answer `limited` instead of the success it already had.
- Done when: a test shows a retry after success returns the same success and does not count as a failure.

### Release and counsel

#### BL-526 Offer codes: TestFlight sandbox pass D-10 before submission (SUB-06)
- Status: needs-founder. Mode: human. Owner: founder, payments engineer. Milestone: M12. Size: S. Depends on: none.
- Priority: High. Gate: before App Store submission (offer codes ship in v1.0: ROADMAP, FUTURE G-16).
- Problem and evidence: Redeem a code is reachable in v1.0 (`settings/plus.tsx`, the Keep sheet). The native call has not run on a device (`ScribeStoreModule.swift`). The local StoreKit file now has one free-month code offer (SUB-11), but the App Store Connect sandbox codes (`docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 7) and run D-10 are not done.
- Done when: D-10 passes on TestFlight (a free-period code shows "free until", SUB-05) and the result is recorded in the ASC doc.

#### BL-527 Counsel reads the counsel-locked rewrites of 31 Oct 2026
- Status: needs-founder (counsel). Mode: pair. Owner: legal, content. Milestone: M12. Size: S. Depends on: none.
- Priority: Medium. Gate: before App Store submission.
- Problem and evidence: the language review's rewrites for registered disclosure strings were not applied, because those words change only through counsel (`docs/legal/in-app-disclosures.md`). The keys and proposed rewrites are in `docs/reviews/2026-10-31/COUNSEL_LOCKED.md` (LNG-04, LNG-09, LNG-12, LNG-15, LNG-18).
- Done when: counsel accepts or rejects each row; accepted rows change in `packages/content`, the disclosures file and its pinning tests in one PR with a version bump.

### Compliance follow-ups (1 Nov 2026)
- **BL-551 Support can open an account deletion for another person (`ops_open_account_deletion`).** Owner: `data-architect`. When: after the 9 Nov go/no-go, before any sign-in outside the family (D-121). Scope: a new migration with `public.ops_open_account_deletion(p_profile uuid, p_reason text, p_ticket text, p_skip_grace boolean)`, service role only, pinned `search_path`, explicit grants (and its line in `supabase/tests/grants.mjs`); writes `source='support'` (DATA-REQ-027) and a `support_access` audit event; reuses the same steps as `request_account_deletion`; idempotent on an open request; tests in `supabase/tests` that fail on today's code. Why: the underage runbook (`docs/ops/runbooks/underage-account.md` section 4) cannot keep the under-13 promise if the person does not delete the account themselves. No `under_18` audit value (CR-40).
- **BL-553 The app handles a refused sign-up.** Owner: `mobile`, copy by `content`; CCO review (the sign-up path). When: before #424's hook is switched on. Scope: when sign-in fails with the hook's refusal (HTTP 403 from the `before user created` hook), show one neutral, accessible screen that does not dead-end: it says sign-up is not available where the person is, links to the Terms and to support, and never asks where they are; nothing is stored on the phone. Add the DB-IP attribution link (https://db-ip.com, CC BY 4.0) to `apps/mobile/src/app/settings/licenses.tsx`. A test for the refusal path. Why: #424 only refuses on the server; today the app would show a generic sign-in error (D-131, CCO README checklist, DB-IP licence).
- **BL-554 Schedule the regulatory watch.** Owner: `regulatory-affairs` with `ops`. When: after #424 merges and the freeze ends. Scope: run `compliance/scripts/regulatory-watch.mjs` weekly (a GitHub Actions job with no secrets beyond the database write it needs, or the harness), and have a person or the CCO check the state age-assurance trackers in `references/checked-facts.md` monthly, with the date recorded. Until then the CCO checks both by hand before each submission (D-131 revisit). The first switch-on of an unattended lane is the founder's (CTO skill section 2).
- **BL-555 Legal paperwork before the hook goes on.** Owner: `legal`, through the CLO; founder merges (D-125). When: with #424. Scope: a DATA_CLASSIFICATION row for `ops.compliance_check_counts` (L2, counts only, two years); compliance register CR-121 updated to D-131, D-137 and the match runbook; the claims register gets the Privacy 12 lines (IP not kept, counts by result) with their code evidence once the hook ships.
- **BL-552 Suspend sign-in for one account without deleting it.** Owner: `data-architect` with `security-architect`. When: before any sign-in outside the family (D-121). Scope: a service-role path that blocks one person's sign-in and sync and keeps all their data, reversible, audited, with a test; used by `docs/ops/runbooks/sanctions-match.md` (D-137) and any other legal hold that needs the account frozen.

### Claims test follow-ups (1 Nov 2026, PR #498)
`packages/content/test/claims-capabilities.test.ts` lists each false claim with the item that removes it. Each item below closes when its rows are gone from `KNOWN_VIOLATIONS`.
- **BL-556 Delete or rewire the website copy nothing ships.** Status: ready. Owner: `content` with `web`. When: after the 9 Nov go/no-go (D-130). Scope: `packages/content/src/site.en.ts` and `pages.en.ts` are exported from `@scribe/content`, but no app imports them: earlyletters.com renders `apps/web/src/content/site.ts` and `apps/web` depends only on `@scribe/brand` and `@scribe/design-tokens`. They still say seven languages, co-parent and "exactly as you said it", and the content lint tests read them as if they were live. Either delete them (and the tests that read only them), or make `apps/web` import them and delete its own copy. Done when: one source of website words, and the claims test reads it.
- **BL-557 The packaged first-run privacy card promises invites.** Status: ready. Owner: `content`, review by the CCO (privacy claim, LEGAL-REQ-044). When: after the 9 Nov go/no-go (D-130). Scope: `stories.story.private.v1.line` in `packages/content/src/stories.en.ts` says "Only you and the people you invite can read these letters"; the production profile has no co-parent and no invite (`apps/mobile/eas.json`, D-121). Give the on-device build a true line (a new card id, so the deck order holds) and keep v1 for a build with server features. Done when: the claims test row for it is removed.
- **BL-558 The website's invite and sign-in pages while no store build has servers.** Status: ready. Owner: `web`, with `product`. When: before the first store build is public (D-121). Scope: `apps/web/src/content/site.ts` `invite.*` (the `/j` page: "Someone invited you to share a book", "I was invited") and `authConfirm.title` ("Finish signing in") describe co-parent invites and sign-in (and the app's "I was invited", which BL-391 hides in v1.0), which the production profile does not have. Only a build with server features (the alpha) sends links to them. Decide: keep them for those links and say on the page that the App Store version does not have invites or sign-in yet, or serve the pages only once a store build turns servers on. Done when: the claims test rows for `web.site.invite.*` and `web.site.authConfirm.title` are removed, by changing the words or because production turns the capability on.

### Release-path follow-ups (1 Nov 2026, CR-45 lanes)
- **BL-559 Deleted books never leave the phone at first sign-in.** Status: ready. Owner: `sync` with `privacy`. When: before sign-in is switched on for anyone (D-121). Scope: `apps/mobile/src/lib/sync/ownership.ts` (lines 54 and 78 at #520's head) must skip books in Recently deleted. `backup/local-store.ts` (line 54) must not back up their recordings. The signed-in erase flow (F17-REQ-026) must exist. Found by the privacy review of #520. Done when: tests prove a book deleted on the phone is never uploaded or backed up, and a signed-in Erase everything reaches the server.
- **BL-560 The Plus line on Write.** Status: blocked (on #508). Owner: `mobile`. When: after #508 merges. Scope: the Write half of F14-REQ-040, the same standing line with no count and no button. Done when: the line shows on Write under the same rule as Tonight, with a test.
- **BL-561 The age question and a thumb slip (SR-C-04).** Status: needs-founder. Needs counsel. Owner: CCO, then `regulatory-affairs` and `mobile`. Today a slip on No locks a parent out for 24 hours, until "I answered by mistake" appears. #521 added a confirm step after No, but writing nothing until the confirm breaks LEGAL-REQ-002's anti-retry rule (P0) and D-026, so it is held. Karma's recommendation: keep the immediate stop, and make "I answered by mistake" clearer and kinder. A confirm step needs a DECISIONS entry first, must treat both answers the same, and must record the first answer. Done when: the founder decides with counsel, and the chosen design passes a CCO review.
- **BL-562 Data classification rows for the new local columns.** Status: needs-founder. Owner: `legal`; founder merges (docs/legal). When: with #522 and #520. Scope: four 4.5 rows for `drafts.review_put_back`, `review_view`, `review_text` (L4, the person's words) and `review_base` (L4, a hash of the words), as written in the data-steward review of #522. Also Privacy Policy lines 159 and 225, per the privacy review of #520. Done when: the founder merges the legal PR.

### Alpha letter ceiling follow-ups (1 Nov 2026, D-139, CR-48)

- **BL-604 Reword the alpha note and the TestFlight line so neither promises "every letter".** Status: ready, after Mon 9 Nov (CR-3). Owner: `content`, with `mobile` for the tests. Scope: `billingCopy.alpha.note` (`packages/content/src/features/billing.en.ts`) and `plusLine` in `packages/content/src/release/testflight.en.ts`. Promise that nobody is asked to pay while testing, never a count; keep "Purchases in this test cost nothing". The registered text maps and the content rules stay green. Also: check that the web journeys J06e and J07d, which build as preview, still pass the Keep gate once #534 runs them (CPO-2, unverified); check that DEVICE_TEST_PLAN V-06 and S1-33 still read right (they need a production-profile build and say "before letter 101"); tell testers the store build starts with two free letters (CBO-1). Trigger: if a tester or a script passes 80 letters before then, Karma rules on making alpha unlimited (CR-48). Done when: the note and the line promise no count, tests pass, and the CLO role has read the wording (counsel must confirm stays).
- **BL-605 Alpha strings sit in no claims check.** Status: needs-evidence (Karma has not re-checked CLO-4's finding). Owner: CCO, with CMO. The CLO found that the claims registry file LEGAL-REQ-044 names does not exist and that `claims-capabilities.test.ts` reads production only. Done when: the CCO confirms what exists, and either the alpha strings join the claims check or the gap is recorded.

## Appendix: TDD proposal to BL mapping

Unchanged from the 3 Oct morning version. Every task id proposed in TDD 01 to 09 maps to exactly one BL id. "+" means merged into that task. Where the BL id is now superseded or deferred, the status above says where it went.

| TDD | Proposed id to BL id |
|---|---|
| 01 (BL-M##) | M01 to BL-121; M02 to BL-111; M03 to BL-037; M04 to BL-040; M05 to BL-130; M06 to BL-142; M07 to BL-136; M08 to BL-034; M09 to BL-022; M10 to BL-031; M11 to BL-250; M12 to BL-156; M13 to BL-154; M14 to BL-170; M15 to BL-134; M16 to BL-275 + BL-276; M17 to BL-150; M18 to BL-044; M19 to BL-173 + BL-174 (per D-023); M20 to BL-288 |
| 02 (SB-##, M#) | SB-01 to BL-173; SB-02 (M5) to BL-112; SB-03 (M6) to BL-175; SB-04 (M7) to BL-113; SB-05 (M8) to BL-114; SB-06 to BL-116; SB-07 to BL-173; SB-08 to BL-174; SB-09 (M10) to BL-236 + BL-022; SB-10 to BL-190; SB-11 (M9) to BL-213; SB-12 to BL-214 + BL-218; SB-13 to BL-234; SB-14 to BL-107; SB-15 to BL-177; SB-16 to BL-282; SB-17 (M11) to BL-178; SB-18 (M12) to BL-200 to BL-203 + BL-306; SB-19 (M13) to BL-300; SB-20 to BL-247; SB-21 to BL-309; SB-22 to BL-312 |
| 03 (BL-060 to BL-071) | 060 to BL-130; 061 to BL-140; 062 to BL-141; 063 to BL-142; 064 to BL-120; 065 to BL-143; 066 to BL-144; 067 to BL-146; 068 to BL-145; 069 to BL-147; 070 to BL-304; 071 to BL-305 |
| 04 (SEC-##, order #) | SEC-01 to BL-106; SEC-02 to BL-106 + BL-122; SEC-03 to BL-172; SEC-04 to BL-116 + BL-195; SEC-05 to BL-115 + BL-236; SEC-06 to BL-248; SEC-07 to BL-249; SEC-08 to BL-200; SEC-09 to BL-306; SEC-10 to BL-237; SEC-11 to BL-245; SEC-12 to BL-117; SEC-13 to BL-239; SEC-14 to BL-241; SEC-15 to BL-313; SEC-20 to BL-241; order 5 to BL-112; 6 to BL-114; 8 to BL-031; 9 to BL-037; 11 to BL-170; 12 to BL-171 (+ BL-330); 13 to BL-302; 19 to 21 to BL-306; 22 to BL-300; 28 to BL-314 |
| 05 (NEW-##) | 01 to BL-115 (+ BL-334); 02 to BL-114; 03 to BL-016; 04 to BL-231; 05 to BL-232; 06 to BL-234; 07 to BL-235; 08 to BL-240; 09 to BL-150; 10 to BL-309; 11 to BL-237; 12 to BL-171; 13 n/a (PowerSync not used, D-023); 14 to BL-243 + BL-310; 15 to BL-239; 16 to BL-238; 17 to BL-117; 18 to BL-218 (superseded, BL-342); 19 to BL-118; 20 to BL-106 |
| 06 (BL-R##) | R01 and R02 to BL-289; R03 and R04 to BL-319; R05 and R06 to BL-239; R07 to BL-244; R08 to BL-242; R09 to BL-107; R10 to BL-173 + BL-247; R11 to BL-282; R12 n/a; R13 to BL-044; R14 to BL-319; R15 to BL-317; R16 to BL-241; R17 to BL-319; R18 to BL-206 |
| 07 (BL-Q##) | Q01 to BL-110; Q02 to BL-120; Q03 to BL-239; Q04 to BL-119; Q05 to BL-118; Q06 to BL-117; Q07 to BL-239; Q08 to BL-278; Q09 to BL-116; Q10 to BL-114; Q11 to BL-174; Q12 to BL-195; Q13 to BL-300; Q14 to BL-173; Q15 and Q16 to BL-151; Q17 to BL-216; Q18 to BL-218 + BL-214; Q19 to BL-213; Q20 to BL-154; Q21 to BL-150; Q22 to BL-234 + BL-238; Q23 to BL-279; Q24 to BL-304; Q25 to BL-275; Q26 to BL-276; Q27 to BL-277; Q28 to BL-004; Q29 to BL-280; Q30 to BL-135 |
| 08 (BL-P##) | BL-036 extension to BL-036; P01 to BL-212; P02 to BL-103; P03 to BL-214; P04 to BL-215; P05 to BL-216; P06 to BL-217; P07 to BL-218; P08 to BL-219; P09 to BL-201; P10 to BL-220; P11 to BL-221; P12 to P14 to BL-308; P15 to BL-311 |
| 09 (BL-070 to BL-090) | 070 to BL-255; 071 to BL-256; 072 to BL-257; 073 to BL-258; 074 to BL-259; 075 to BL-260; 076 to BL-261; 077 to BL-262; 078 to BL-263; 079 to BL-264; 080 to BL-265; 081 to BL-266; 082 to BL-267; 083 to BL-270; 084 to BL-271; 085 to BL-156; 086 to BL-268; 087 to BL-269; 088 to BL-279; 089 to BL-273; 090 to BL-272 |
