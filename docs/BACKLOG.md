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

**Numbering.** Existing ids (BL-001 to BL-321) never change. **BL-055 to BL-099 are never used** (TDD 03 and TDD 09 proposed colliding numbers there; the appendix maps every TDD proposal). New ids from this consolidation: BL-322 to BL-326 (security review follow-ups) and BL-330 to BL-349. Free for later splits: BL-123 to BL-129, BL-131 to BL-133, BL-138, BL-139, BL-149, BL-152, BL-153, BL-155, BL-161 to BL-169, BL-179 to BL-189, BL-197 to BL-199, BL-204, BL-207 to BL-209, BL-223 to BL-230, BL-246, BL-253, BL-254, BL-274, BL-281, BL-285, BL-287, BL-290 to BL-299, BL-315, BL-316, BL-318, BL-327 to BL-329; the next block starts at BL-350.

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
- Status: done in part (the rules test enforces the trust lines word for word, no beta wording, no grandparent claims, and only what Plus gates in v1.0: D-053, D-055, D-060, D-061 effects). The claims registry and the remaining rules are deferred (v1.1, merged into T5-08).

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
