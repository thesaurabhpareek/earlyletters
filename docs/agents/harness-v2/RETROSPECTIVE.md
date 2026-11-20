# Harness retrospective, reconciled (1 Nov 2026)

Reconciled by Karma's session from six lens notes: ops, qa, security, red-team, product, chief-of-staff (agent notes in the session scratchpad; the numbers below were re-checked where marked V). Every one of those agents judged work it owns or shares an identity with; each said so. This document inherits that. Nothing here was verified against a phone or the Expo dashboard; the founder says the first build is on TestFlight, and no session has confirmed it.

## What the harness did well (keep)
- Machines that fail closed: required checks (`applied migrations unchanged`, `required`, `compliance-fence`), the store-profile Release launch check (`ios-compile.yml` 272-280, closes the 20-day launch crash class), the kill harness with planted failures, the seam guard, the hashed real-family guard, the content-rules test, the compliance fence. All run on GitHub Actions at no cost.
- Review lenses found real defects: red-team sampled 22 merged PRs; of 15 with Review A/B comments, 8 had a CHANGES/FAIL verdict fixed and re-reviewed (#543, #529, #509, #505, #501, #498, #481, #439).
- A machine counter for verdicts already exists: `parseLens` and `countedPass` in `scripts/status/page.mjs`, tested.
- Honest docs where it counted: TESTFLIGHT.md and CR-37 say what has never run. `docs/release/FOUNDER_QUEUE.md` is the best founder surface. CI cost is bounded (concurrency cancels stale runs; 52 of the last 100 iOS compile runs were cancelled).
- Decisions, rulings and the strict `## Review A at <sha>: PASS` format give an audit trail.

## What it did badly
1. **A rule that lived in prose failed.** #460 merged about 23 seconds after the second FAIL on its full head sha. #524, #506 and #504 merged with one lens on a stale head. CR-44, written in response, is not in the repo (`docs/agents/cto/RULINGS.md` ends at CR-42; V). Nothing in the required checks looks at reviews.
2. **Status is fragmented and stale.** About seven founder-facing surfaces; `FOUNDER_QUEUE.md` says its own status is 28 Oct; `BOARD.md` had 5 of 5 sampled claims stale; one digest issue ever (#43, open since 3 Oct). 72 PRs open now (V), 18 older than 14 days (V), 19 drafts, 11 handoff issues open.
3. **The release path has never run.** `testflight.yml` has only skipped runs (V: 5 of 5), its header says "NOTHING here has been run". No device evidence exists (`docs/qa/evidence/` is a README and a template). 87 of 240 release-catalog rows are gaps; 108 of 136 Maestro testIDs are missing from the app.
4. **Green still means less than it should.** No skip-count guard; conditional skips remain; 571 of 768 P0 requirement ids have no test citing them and `trace.mjs --check` is not in CI; `ENFORCEMENT.md` is dated 3 Oct with 27 rows citing dead PRs.
5. **Decisions do not propagate by machine.** D-100/D-101 rows not marked amended by D-121; D-133 moved scope after the freeze with no capacity check; three task sources (BACKLOG, PRD V2 work packages, PR titles), 26 of 198 recent merges cite a BL id.
6. **The Actions agent lane never ran.** `agents.yml` is `disabled_manually`; 4 PRs ever carried `from:agent`. The cost was authoring and review load, not minutes. The harness was designed for an operating model that did not exist (28 Oct RC1).
7. **Independence is of lens, not identity.** Every review is the founder's account and one model family. Gates built on comments are consistency checks, not security boundaries (CR-32).
8. **Supply chain is half done.** 17 tag-pinned `uses:` lines, no `dependabot.yml` (V), Dependabot security updates disabled (V), no `npm audit` job.

## Corrections to the agents' notes
- Secret scanning and push protection are already enabled (V via repo API). Security listed them as a pending founder click.
- Security's SEC-2 asks to put `EXPO_TOKEN` in a reviewed environment. The 1 Nov record says that is done (`testflight` environment, founder is required reviewer, no repo secrets). I could not re-read environments (API refused); treat as done, unverified by this session.
- Open PRs are 72, not 69 or 70 (V).

## Top gaps, merged and ranked
Severity is for the first store build and the next 30 days. Owner: A agent-doable, F founder-only. Free unless stated.

| Gap | From | Sev | Owner | Before 9 Nov? |
|---|---|---|---|---|
| G1 Review gate: a required, sha-bound check "2 counted reviews on the head, none failing after" (consistency gate, not a security boundary); CR-44 into the repo | RT-1,2,4,7; SEC-1 | Critical | A builds as a proposal; F adds to ruleset | Draft yes, apply after freeze |
| G2 One founder page, generated: `TODAY.md` from `page.mjs` + `check.mjs` by a no-model Actions cron; retire the other surfaces to pointers; fix stale `FOUNDER_QUEUE.md` | COS-1; PRD-2 | Critical | A; F enables workflow (CTO ruling needed: CR-5 keeps `agents.yml` off) | Yes |
| G3 First-build proof: build/submit checklist with stop points, EAS build budget (Free = 15 iOS builds/month, 45 min timeout, low priority; Expo pricing page, 1 Nov), device evidence B1 subset on a drill phone | OPS-1,2,3; QA-1 | Critical | A prepares; F runs | Yes |
| G4 Green means ran: skip-count guard; "pipeline has a non-skipped success" ledger; `trace.mjs --check` for undefined/duplicate ids in CI; cite ids for build-1 P0 | QA-2,3; OPS-6 | High | A drafts patch; F applies `.github` | Draft yes |
| G5 Decisions propagate: "Amended by" column and checker; capacity field on any decision after a freeze; one task source (BACKLOG), release-path section first; PRs cite BL id (warn only) | PRD-1,3,4,5,6; COS-4 | High | A drafts; Karma/F merges DECISIONS | Release-path section and decision field: yes |
| G6 Live claims and WIP: `CLAIMS.md` (live rows only, 72 h expiry), advisory checker, archive BOARD rows; WIP limit shown as a red line; one-off sweep of the 18 old PRs | COS-2,3,5 | High | A; F closes PRs | Yes |
| G7 Supply chain: `dependabot.yml`, SHA-pin the 17 tags, `npm audit --omit=dev` job, enable Dependabot security updates | SEC-4; OPS-5 | Medium | A patch; F applies | After |
| G8 Unattended safety: lanes stay off; trim scheduled-task connectors; job split (H15) before any lane; `pull_request_target` lint | SEC-3,6,7; OPS-7 | High if lane on, else Medium | F config; A code | No (CR-5, CR-22) |
| G9 Enforcement truth: recount `ENFORCEMENT.md`, test that rows cite real test files; harness acceptance criteria page (`ACCEPTANCE.md`) | QA-4; PRD-7 | Medium | A | No (CR-22) |
| G10 Free-tier risks named for the founder: Vercel Hobby is non-commercial only (fair-use page, updated 14 Sep 2026; U how a marketing site is classified); macOS runner minutes on a public repo (U, docs do not say); R2 limits (U) | OPS-4,8,9 | Medium | F decides | No |
| G11 Identity: second identity / machine account held to 10 Nov (CR-19/20/24); true review independence needs it | RT-6; SEC-8 | Medium | F | No |

## Constraints for the design
- Keep it free. Anything paid goes to the founder with a number.
- CR-22: harness frozen to the go/no-go; `.github/**` is a T2 path and agents cannot edit workflows, so workflow changes are proposals under `docs/ops/proposed/` that the founder applies.
- Agents never merge, never edit `docs/DECISIONS.md` or `docs/legal/**`, never touch founder-only items. Reviews cannot be self-approved; the classifier blocks merges without a human review, and the design must make the human click cheap, not bypass it.
- The child's real first name only in `apps/web/src/content/site.ts`.
