# Harness v2 backlog (product, 1 Nov 2026)

Ordered, smallest useful first, first-build proof first. Ids HV2-B01..; the coordinator maps them to BL ids later (next free on origin/develop is BL-563; last used BL-562, `docs/BACKLOG.md:2522`). Acceptance is the check in REQUIREMENTS.md (HV2-nnn). Sizes: S under a day, M, L. Phases: A docs and scripts, PR-drafted now, none touches `.github`, app code or the release path; B proposals under `docs/ops/proposed/` the founder applies on or after 10 Nov; C founder-only; D after 9 Nov or conditional. Sources are sibling sections. Rulings: CTO means a ruling is needed, FD a founder decision (recommendation, then default).

## Phase A: first-build proof, then the rest
- **HV2-B01 Build checklist and log.** Goal: build 1 and 2 run to a script with STOP lines. Files: `docs/release/BUILD_CHECKLIST.md`, `docs/release/build-log-TEMPLATE.md`, `scripts/release/checklist-check.mjs` + test. Accept: HV2-015, 016. Size S. Owner ops. Depends none. Cite ARCH sec 5, `TESTFLIGHT.md:19`.
- **HV2-B02 Device evidence kit.** Goal: one 3 h sitting on the drill SE 3. Files: `docs/qa/evidence/KIT-B1.md`, `scripts/qa/evidence-check.mjs` + test. Accept: HV2-014 (EG-8, EG-9). Size M. Owner qa. Depends none. Cite EG sec 6, `docs/qa/evidence/TEMPLATE.md`.
- **HV2-B03 Pipeline ledger script.** Goal: "has the release path ever run" answered by a machine. Files: `scripts/ci/pipeline-ledger.mjs` + test, `docs/release/PIPELINE_LEDGER.md`. Accept: HV2-011. Size S. Owner qa. Depends none. Cite EG sec 3, `testflight.yml:116`.
- **HV2-B04 CLAIMS.md, archive, checker.** Goal: live claims only. Files: `docs/agents/CLAIMS.md`, `BOARD-ARCHIVE.md`, `BOARD.md` stub, `scripts/agents/board-check.mjs` + test, COORDINATION.md:14-26. Accept: HV2-007 (T5 to T9). Size M. Owner chief-of-staff. Depends none. Cite FP sec 4.
- **HV2-B05 Pointer pass.** Goal: one status surface. Files: `FOUNDER_QUEUE.md` lines 3-8, `FOUNDER_TASKS.md`, `TESTFLIGHT.md` "Where build 1 stands", `docs/release/TODAY.md`. Accept: HV2-006. Size S. Owner chief-of-staff. Depends B07 (needs the issue number; use "pending" text until then). Cite FP sec 3.
- **HV2-B06 Strict-sha gate core.** Goal: `decide()` with strict 40-char mode. Files: `scripts/review-gate/decide.mjs` + `decide.test.mjs` (imports `parseLens`, `countedPass`, no edit to `page.mjs`). Accept: HV2-001, 002. Size M. Owner qa. Depends none. FD: none. Cite RG sec 2, 6; `page.mjs:36-41, 105-155`. Fixtures need real bodies via `gh api` (U).
- **HV2-B07 TODAY generator.** Goal: 15-line page, run by hand until the cron. Files: `scripts/status/today.mjs` + test, `docs/release/dates.json`. Accept: HV2-005 (T1 to T3). Size M. Owner chief-of-staff. Depends none. Cite FP sec 2, `page.mjs:205, 227, 279`, `check.mjs:110`.
- **HV2-B08 Stale-PR sweep printer and handoff list.** Goal: founder closes with one paste. Files: `scripts/agents/board-check.mjs --sweep` (same file as B04, so land B04 first). Accept: HV2-008 (T10), sweep excludes #30, #26, #32 until B16. Size S. Owner chief-of-staff. Depends B04. Cite FP sec 5, 6.
- **HV2-B09 Skip guard.** Files: `scripts/ci/skip-guard.mjs` + test, `docs/qa/skip-allowlist.json`. Accept: HV2-010. Size M. Owner qa. Depends none. Cite EG sec 2.
- **HV2-B10 Trace check and B1 scope.** Files: `scripts/trace.mjs` (`--scope b1`), `docs/qa/b1-p0-uncited.baseline`. Accept: HV2-012. Size M. Owner qa. Depends none. Cite EG sec 4, `trace.mjs:27-28, 542`.
- **HV2-B11 Lint scripts.** Goal: SHA-pin lint and `pull_request_target` lint with planted fixtures. Files: `scripts/ci/workflow-lint.mjs` + test + fixtures. Accept: HV2-017. Size S. Owner security. Depends none. Cite SM sec 5, 6; `compliance-fence.yml:27`.
- **HV2-B12 Decisions checker and templates.** Goal: "Amended by" and "Capacity" drafts. Files: `scripts/agents/decisions-check.mjs` + test, `docs/ops/proposed/decisions-amended-capacity.md` (patch text for DECISIONS.md, which agents do not edit). Accept: HV2-021. Size M. Owner product. Depends none. FD: adopt the Capacity field (recommend yes; default no change). Cite retro PRD-3, 4; `DECISIONS.md:623-624, 885-900, 1034`.
- **HV2-B13 CR-43 and CR-44 text.** Goal: ruling text ready for the CTO. Files: `docs/ops/proposed/cr-43-44.md`. Accept: HV2-004 after the CTO files it. Size S. Owner product. Depends none. CTO: file in `RULINGS.md` (recommend yes now; docs only). Cite RG sec 7. I could not read the Project doc, so clauses come from RG.
- **HV2-B14 Release-path section draft.** Goal: BACKLOG ordered by the release path, Done-when on every release-path task. Files: `docs/agents/harness-v2/RELEASE-PATH-ORDER.md` (coordinator moves it into `docs/BACKLOG.md`). Accept: HV2-021. Size M. Owner product. Depends none. Cite retro PRD-5, 6.
- **HV2-B15 Credentials text and proposals for settings.** Files: `docs/ops/proposed/claude-md-secrets.md`. Accept: HV2-020. Size S. Owner security. Depends none. Cite SM sec 4.
- **HV2-B16 Harvest PR #30, #26, #32.** Goal: keep SEC-R03, R08, R09 content before any close. Files: `docs/ops/proposed/harvest-pr-30.md`. Accept: sweep list in B08 may then include them. Size S. Owner security. Depends none. Cite FP sec 5, SM sec 5.

## Phase B: proposals the founder applies (one PR each, 10 Nov onward, order as ARCH sec 7)
- **HV2-B17 `dependabot.yml`** and audit job text. Files: `docs/ops/proposed/dependabot.yml`, `npm-audit.md`. Accept: HV2-018. S. security. Depends B16.
- **HV2-B18 `review-gate.yml`.** Files: `docs/ops/proposed/review-gate.yml`. Accept: HV2-003. M. qa. Depends B06, B13. Advisory first, required 17 Nov (FD: recommend advisory; default advisory).
- **HV2-B19 `today-page.yml`.** Files: `docs/ops/proposed/today-page.yml`. Accept: HV2-005. S. chief-of-staff. Depends B07. CTO exception for pre-9 use (recommend no; default no).
- **HV2-B20 Skip-guard CI patch, SHA pins, CODEOWNERS lines, lint job.** Files: `docs/ops/proposed/*`. Accept: HV2-010, 017, 024. M. ops. Depends B09, B11.

## Phase C: founder-only (minutes are estimates)
- **HV2-B21 Rehearse steps 1 to 3 of the checklist.** Run `doctor.ts --live` and preflight; paste output into the build log. 30 min. Depends B01. Before 3 Nov.
- **HV2-B22 Build 1: steps 4 to 9.** Count builds used on the dashboard, `eas build`, `eas submit`, install. About 90 min plus Apple processing. Depends B21.
- **HV2-B23 Device sitting.** Follow the kit; commit the evidence file. 180 min. Depends B02, B22. Before 9 Nov.
- **HV2-B24 Settings clicks.** Enable Dependabot security updates (2 min); confirm `testflight` environment reviewer (5 min); close #43 and set the CoS daily_runs to 0 (5 min); run the sweep after B16 (10 min); close or answer the 8 old handoffs (30 min); pin the TODAY issue (2 min).
- **HV2-B25 Apply B17 to B20, one PR each**, 15 min each, from 10 Nov. Run the gate on 5 PRs via dispatch before requiring it.
- **HV2-B26 Decisions.** Vercel: ask support now (10 min; recommend ask, default Hobby). Repo stays public (recommend yes, default yes). Second identity on 10 Nov (default held). Build path A (default A).

## Phase D: after 9 Nov or conditional
- **HV2-B27 ENFORCEMENT truth scripts** (HV2-013). M. qa. Merge after 9 Nov. Cite EG sec 5.
- **HV2-B28 `ACCEPTANCE.md`** (HV2-022). S. product. Cite PRD-7.
- **HV2-B29 Maestro testID ratchet and IDs** (108 of 136 missing). L, mobile. Cite EG sec 7, `RELEASE_TEST_PLAN.md:25`.
- **HV2-B30 Lane preconditions checklist** (HV2-019) incl. H15 job split. L, security with CTO. Only if the founder wants a lane; default off.
- **HV2-B31 `trace --check` into `package.json:11`** after B10 is green. S.

Conflicts of interest: I am the product agent and own the backlog this feeds; I gain scope from process items (B12, B14, B28), I did not read the CR-44 Project doc, and I ranked first-build proof above my own items.
