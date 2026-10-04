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

**Numbering.** Existing ids (BL-001 to BL-321) never change. **BL-055 to BL-099 are never used** (TDD 03 and TDD 09 proposed colliding numbers there; the appendix maps every TDD proposal). New ids from this consolidation: BL-322 to BL-326 (security review follow-ups) and BL-330 to BL-349. Free for later splits: BL-123 to BL-129, BL-131 to BL-133, BL-138, BL-139, BL-149, BL-152, BL-153, BL-155, BL-161 to BL-169, BL-179 to BL-189, BL-197 to BL-199, BL-204, BL-207 to BL-209, BL-223 to BL-230, BL-246, BL-253, BL-254, BL-274, BL-281, BL-285, BL-287, BL-290 to BL-299, BL-315, BL-316, BL-318, BL-327 to BL-329; BL-351 to BL-369 are the brand, email and web handoffs, and BL-370 to BL-434 are the M-JR journey review block (4 Oct 2026); the next block starts at BL-435.

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

Status values: `ready`; `blocked (reason)`; `needs-founder (FT-##)`: waits on a step in `docs/FOUNDER_TASKS.md`; `needs-decision (D-### or Q-###)`; `in-progress (<agent>)`: claimed on BOARD.md this wave; `in-review (PR #n)`; `done (evidence)`; `superseded (by D-### or BL-###)`; `deferred (release, FUTURE id)`.
Mode values: `agent`, `human` (founder, device, store, vendor or secrets), `pair` (interactive session with the founder).
Severity tags: **[Critical]** blocks launch or makes a published statement false; **[High]** must land before the related feature reaches non-founder users.

---

## Status at a glance (verified 3 Oct 2026)

| Status | v1.0 tasks |
|---|---|
| Done in code | BL-003, BL-004, BL-010 to BL-014, BL-020, BL-023, BL-024, BL-031, BL-033 to BL-035, BL-036, BL-037, BL-040, BL-050 to BL-052, BL-054, BL-100, BL-111 to BL-114, BL-116, BL-120, BL-121, BL-130, BL-137, BL-140 to BL-143, BL-150, BL-151, BL-154, BL-157 to BL-160, BL-170, BL-172 to BL-174, BL-176, BL-215, BL-216, BL-219, BL-220, BL-233 to BL-235, BL-238, BL-240, BL-250, BL-255 to BL-264, BL-267, BL-289 |
| Done in part (remainder named in the task) | BL-115 (rest is BL-334), BL-118 (rest is T5-08), BL-122, BL-134, BL-136, BL-156, BL-171 (rest is BL-330), BL-236, BL-237, BL-239, BL-241, BL-242 |
| In progress this wave | BL-021 and BL-266 (mobile-polish), BL-275 to BL-277, BL-279, BL-283 (qa-e2e), BL-331 to BL-333 (db-followup, `20261005000000` builds and applies), legal alignment (`docs/legal/**`, legal-alignment). Done this wave: the security review (`docs/reviews/2026-10-04-security-privacy.md`) |
| Needs the founder | BL-005, BL-015, BL-030, BL-043, BL-044, BL-053, BL-101 to BL-104, BL-106 to BL-109, BL-122, BL-135, BL-177, BL-222, BL-245, BL-247, BL-280, BL-284, BL-286, BL-335 to BL-337, BL-339, BL-346 |
| Ready for agents (v1.0 first) | **BL-330, BL-347, BL-322, BL-342, BL-349** (the five that gate C1 or make a published statement true), then BL-323 to BL-326, BL-334, BL-341, BL-001, BL-002, BL-110, BL-117, BL-119, BL-148, BL-244, BL-251, BL-252, BL-265, BL-268, BL-270, BL-272, BL-273, BL-278; v1.0.1: BL-343, BL-344 |
| Blocked | BL-221 (BL-275), BL-243 (website thread), BL-269 (BL-278), BL-340 (first preview build) |
| Needs a decision | BL-338 (Q-009), BL-348 (invite link format, FT-04), BL-345 (counsel, FT-47) |
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
- Scope (rewritten for D-053; the old scope is superseded): app record for `com.earlyletters.scribe`; subscription group `Plus`; `plus.monthly` US $3.99 with a free 1-month introductory offer and `plus.annual` US $29.99 with a free 2-month offer; same level; **Family Sharing on** for both; Billing Grace Period 16 days (D-048); United States only; sandbox testers. Steps: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`.
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
- Status: done (`src/app/settings/children/[id].tsx`, `new.tsx`).

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

#### BL-178 Profile settings and shared dictionary terms
- Status: deferred (v1.2, CVL-03).

#### BL-177 Cross-device two-phone test
- Status: needs-founder (FT-22, two phones). The CI stack part waits for BL-275 (qa-e2e).

#### BL-024 Server business aggregates
- Status: done (9be06db, `20261004300000_insights_aggregates.sql`, k = 10). Plus totals: superseded (D-053; App Store Connect reports only).

#### BL-330 Apple refresh-token capture at sign-in (new) [Critical]
- Status: ready. Mode: agent (deploy needs FT-11 secrets). Owner: security engineer. Size: S to M.
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
- Status: ready. Mode: agent (auth code: independent review run and `approve-migration` label once BL-005 is on). Owner: auth owner, sync owner. Size: M.
- Satisfies: A-REQ-023, LEGAL-REQ-024, LEGAL-REQ-026; TDD 04 3.1.
- Scope: accept an opened link only while this phone has a pending request from this session (`getPendingEmail()` or a persisted request nonce), otherwise route to "type the code"; refuse a link while a different account is signed in; never run `takeOwnership` on `SIGNED_IN`: run it only after consent, behind a screen that shows the masked account email and needs a tap; then move to Supabase PKCE for email links (`flowType: 'pkce'`, template change in `supabase/templates/magic_link.html` and FT-12). Tests for the attack in H1's five steps.
- Needed before C1 (Mon 19 Oct): a phishing link would otherwise upload a family's letters to an attacker's account.

#### BL-322 Invite asks before it joins, and never switches the open book by itself (review H2, app part) [High]
- Status: ready. Mode: agent (needs a `peek_invite(token)` RPC from db-followup or the next migration range). Owner: family owner.
- Scope: `src/app/invite/index.tsx` shows "Join {child}'s book as a parent? Invited by {signsAs}" and waits for a tap; `peek_invite` returns only the child's first name and the inviter's signature; never `setActiveChildId` on join without a tap. Copy in `packages/content`.

#### BL-348 Invite token in the URL fragment (review M2; FAM-04 parts 1 and 2 pulled forward)
- Status: needs-decision (founder chose `/i/<token>`, AUTH_SETUP 5.3; FT-04 item 7 asks again). Mode: agent plus website thread.
- Scope if yes: links become `https://earlyletters.com/i#t=<token>`; the parser reads the fragment and still accepts `/i/<token>` for 7 days; AASA pattern `/i`; generic preview tags. If no: legal-alignment rewrites Privacy Policy line 195 (it says tokens travel where servers do not log) and the website disables logging and analytics on `/i/*` with `Referrer-Policy: no-referrer` (FT-31).

#### BL-349 App-level privacy manifest (review L7) [High]
- Status: ready. Mode: agent. Owner: mobile engineer.
- Satisfies: LEGAL-REQ-043. Scope: `ios.privacyManifests` in `app.config.ts` covering React Native's required-reason APIs and `whisper.rn`; inspect `PrivacyInfo.xcprivacy` in the archived build before C1 so the upload does not fail ITMS-91053.

#### BL-323 Export carries consent history and dictionary terms (review L4)
- Status: ready. Mode: agent. Owner: export owner. Satisfies: LEGAL-REQ-034. Scope: add the person's `policy_acceptances` (through `my_policy_state` and own rows) and dictionary terms; include Recently deleted letters; use the real membership role instead of `'parent'`.

#### BL-324 Native modules never crash or hang on bad input (review L9)
- Status: ready. Mode: agent (device check FT-22). Owner: speech engineer, payments engineer. Scope: clamp and `isFinite`-check times in `ScribeAudioModule.swift` `samples()`; `PlusStoreSheet.swift` resumes its continuation once when UIKit refuses the presentation.

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

#### BL-288 Android CI build (parity watch)
- Status: deferred (FUTURE T5-16 readiness).

#### BL-286 Store listing and submission [Critical]
- Status: needs-founder (FT-43 approve listing, privacy answers, age rating, review notes; FT-45 submit). Listing source: `docs/store/app-store.md` and `packages/content/src/store.en.ts`; no beta wording (D-060); Lifestyle; United States only; age rating overridden to 18+ because the Terms require adults (qa-e2e, checked against App Store Connect help); both subscriptions attached to the version. Submit in the week of Mon 2 Nov 2026.

#### BL-335 Pack signing key in the app and the first signed publish (new) [Critical]
- Status: needs-founder (FT-16: `npx tsx scripts/packs/keygen.ts`, secret in the password manager only). Then agent: add the public key line to `packages/api/src/keys.ts` in a PR (needs an app build); then the coordinator runs `scripts/packs/publish.ts all` with the founder's OK (COORDINATION 6).
- Why critical: `keys.ts` ships empty, so the app trusts no remote config, no content and no pack (ADR 0016 4.2). Without it there are no kill switches in C1 (LEGAL-REQ-040) and no non-English language pack can install.

#### BL-336 iOS deployment target 17 (new)
- Status: needs-founder (FT-04 answers Q-002). Then agent: `expo-build-properties` with `ios.deploymentTarget: '17.0'` (app.config.ts plugin; owner mobile-polish this wave); removes the iOS 16 branch of the Plus gate (ADR 0013).

#### BL-337 Pack and model hostname and uploads (new)
- Status: needs-founder (FT-04 answers Q-001; FT-16 creates the bucket and domain). Then agent: one hostname in `src/lib/models/catalog.ts` (`SELF_HOST_BASE` is `https://models.earlyletters.com/speech` today, while DOMAINS.md says `packs.earlyletters.com` and Q-001 recommends `packs.earlyletters.app`); the founder uploads the Hindi small model and text packs with the commands `publish.ts` prints, then `hosted: true` (ADR 0015 section 9 item 2).

#### BL-338 Policy versions for the beta (new) [Critical]
- Status: needs-decision (Q-009, founder with counsel). Without published `terms` and `sensitive-data` rows in `policy_versions`, every new account stops at "We couldn't finish setting up your account" (AUTH_SETUP 1.4, APPLY step 8.2), so C1 cannot sign in or sync.

#### BL-339 EAS project id and environment variables (new)
- Status: needs-founder (FT-17 `eas init` and EAS environment variables per profile: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_EMAIL_OTP_LENGTH`). Then agent: commit the `projectId` in `app.config.ts`. Verified: no project id in the config today.

#### BL-340 Store screenshots from the release build (new)
- Status: blocked (first preview build, FT-17). Mode: agent plus founder approval (FT-43). Owner: content. Tools: `scripts/brand/screenshots.mts`, `scripts/brand/capture-store.cjs`.

#### BL-341 App Review notes and demo account (new)
- Status: ready. Mode: agent drafts, founder enters. Owner: QA engineer, content.
- Scope: review notes from `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 plus the D-004 positioning (a family memory journal in Lifestyle; a due date is optional); how to reach Plus; a demo account on production seeded with the fictional family "Asha" and how the reviewer passes the 18+ gate.

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
- Severity: major. Raised by: product, design, quality (10 findings). Steps: J09-04, J09-05, J10-01, J10-09, J10-10.
- Satisfies: CLAUDE.md constitution (typed words are the person's own; raw stays immutable); D-056.
- Scope: The waiting card in Book (J09-04) and the letter page (J10-09) get "Write the words yourself" (typed under the recording, stored as the person's words), "Try again" or "Download English", and a one-line reason. A "Nobody spoke" letter gets "Try writing it down again" (re-enqueue) and "Record again"; Delete is the lower-emphasis action on a silent recording. The letter page subscribes to the store so words appear without reopening.
- Done when: From a waiting letter the person can type the words and it becomes a normal letter. Try again re-enqueues and sets words once. A letter open on screen updates when words arrive. A no-speech letter offers Record again.
- Test: Journeys J09 (J09-04, J09-05) and J10 (J10-09, J10-10, J10-01); retry-sets-words-once case in `apps/mobile/test/transcription-queue.test.ts`; `apps/mobile/test/store.entries.test.ts`.

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
- Severity: major. Raised by: quality (2 findings). Steps: J01-04, J10-09.
- Satisfies: CLAUDE.md constitution (edits stored and reversible); the promise line "read each letter and fix anything we got wrong"; BL-148.
- Scope: "Change words" on the letter page, stored as a person edit with raw untouched and a per-edit put-back. A letter whose words arrived in the background is marked "words arrived, please read" and opens in Review. If this is not built, the promise line must change (BL-393 owns wording).
- Done when: A saved letter can be edited and every edit can be put back. A background-words letter opens in Review and the flag clears after it is read.
- Test: Journeys J10 (J10-09) and J01 (J01-04); `apps/mobile/test/store.entries.test.ts`; words-set-once in `apps/mobile/test/transcription-queue.test.ts`.

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
