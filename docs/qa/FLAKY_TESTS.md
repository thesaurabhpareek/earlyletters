# Flaky tests: policy

Owner: qa engineer (S19 for the device and kill-harness rows). Status: **proposed policy, not yet enforced.** Nothing in CI reads this file today; section 6 lists what would enforce it and is not built. Drafted 28 Oct 2026 against `develop` 6bfb94a9 for RB-34.

Until the guard script in section 6 exists and the coordinator or founder signs this policy off, quarantine by skipping a test is NOT permitted: `docs/agents/OPERATING_MODEL.md` ("Never weaken, skip or delete a test to make it pass") and `docs/engineering/PRINCIPLES.md` rule 2 ("Never delete, skip or loosen a test") stand. Section 3 is a proposal for what may replace them.

It builds on two rules that already exist and does not replace them:
- TDD 07 section 9.2: "a flaky test may be quarantined for at most 7 days with an owner; quarantined tests still run and report; a P0 requirement may never be left with only quarantined coverage at G3 or later."
- `apps/mobile/e2e/README.md` ("Flake policy", TDD 07 3.2): a nightly Maestro flow may retry once and a pass on retry files a flake issue; release-candidate runs never retry.

The point of the policy is one sentence: **a red result is either a real defect, a broken test, or an environment fault, and each gets a different action. "Flaky" is a conclusion reached with evidence, never a first guess.**

## 1. What the repo's history shows first

Read before the rules, because the rules are shaped by it. Marks: V = read or run for this document, I = inferred, U = could not verify.

**Reruns.** The 500 most recent workflow runs the GitHub API lists (24 Oct 06:44 UTC to 28 Oct 05:44 UTC) have `run_attempt` 1 on every run: no rerun of any workflow in that window (V). That field holds the latest attempt, so it shows reruns of a run only if the run was rerun in place; a developer who pushed an empty commit to get a second roll would not appear (I). Older history is not covered (U): the API listing was not paged past those 500 runs.

**Failures in that window (V):** 16 runs concluded `failure`: 12 `Kill harness (DL-01, DL-02)`, 3 `Web e2e`, 1 `iOS compile`. `CI` (typecheck, tests, content rules, database rules) had none in the window. Classification:

| Failure | What it was | Class | Evidence |
|---|---|---|---|
| Kill harness runs 40072977424, 40076982108, 40082148320, 40084319361, 40574814981 and the other pull-request runs between 24 and 27 Oct | DL-01 exited 1 with the verdict "nothing lost or doubled" but the kept M4A takes did not open (AVFoundation -11829; 0 of 5, 0 of 50 kept takes play). The first three smokes (40069165832, 40071228099, 40072977424) exited 3, `app_exited`: the app crashed on launch | **Real defect, not flake.** A killed recording that cannot be played is the failure DL-01 exists to find | `docs/qa/ALPHA_GO_NO_GO.md` row B2-11; the launch crash was fixed by #276 (86b6e90); the playable-take failure by the ADTS flip, ADR 0027, #293 (bbac5ec). I did not open each of the 12 runs; the ones after the flip's merge (22:38 UTC on 27 Oct) are not individually checked (U) |
| Kill harness gate-size rehearsal 40596403809 | passed after the flip, 500 of 500 kept | n/a, green | row B2-11 |
| `iOS compile` 40086594249 on branch `exp/plant-launch-throw` | the branch name says a planted launch failure to prove the launch check can fail | **Deliberate** (I) | branch name only; not opened |
| `Web e2e` 40595443612 on `feat/web-header-lockup` | the log shows "Error: / link to #top" from the link test, and the next run on the same branch (40599992450) passed after a push | **A real finding fixed by a change**, not shown to be flaky (V for the log, I for the cause) | job log; run list |
| `Web e2e` 40630926287 (Vercel bot branch) and 40639310788 (`fix/web-critic-round-1`) | not opened | **Unclassified (U).** Neither may be called flaky: no run of the same commit passed | run list |

**Real flaky or load-dependent tests found in the repo's own records (V unless marked):**

| Case | Cause | Fix | Source |
|---|---|---|---|
| Packs interrupted-install matrix, "kill at 'remove' #9", 17 Oct | the shared disk was full (18 MB free), so a real write hit ENOSPC and the engine rightly returned `storage_error` | matrix moved to in-memory ports; 0 of 100 runs fail on a volume filling to 100% (29 of 30 failed before). **An environment fault that a real-disk test turned into a red** | `docs/agents/checkins/packs-owner.md`, 17 and 18 Oct |
| `verify.fuzz`, `lang.fuzz`, `billing-plan-reminders`, `decode-uri-component-shim`, `sync-e2e`, `config`, `no-real-family-data` | slow tests that time out under load; coverage runs already work around each one | BL-443 (status ready); done when `npm test` and `npm run test:coverage` pass three times in a row on a 2-core runner | `docs/BACKLOG.md` BL-443; `docs/ops/proposed/coverage-ci.md` (sync-e2e 20 s alone, 60 to over 120 s loaded) |
| Database p95 read budgets | the same SQL missed 5 of 6 budgets at load average 10 and passed at 3 (23 Oct) | budgets moved to the nightly; a red from a missed budget alone is advisory for B2-22 until they get their own workflow with one retry | D-114; #215 |
| PGlite absolute timings (CR-13) | 2.5x headroom on shared runners | "re-run once and compare medians before failing" | `docs/tdd/06-performance-reliability.md` CR-13 |

Two things follow. Every real case so far was a **timing or environment** problem, fixed at its cause; none was quarantined, because there is no quarantine mechanism (V: no `quarantine` tag in the repo). And the one family of reds that looked like instability, the kill harness, was **data loss**, so the policy has to make "rerun it until green" impossible there.

## 2. Declaring a test flaky: the evidence threshold

A test is **flaky** only when all three hold. Write them in the flake record (section 3).

1. **Same input, both outcomes.** Either (a) the same commit SHA has a pass and a fail for this test in two CI runs (link both run ids), or (b) it fails at least 1 time and passes at least 1 time in 20 consecutive local or CI runs of that test alone on that commit.
2. **Not a defect.** The failing message was read, and none of these holds:
   - it names lost, doubled, unreadable or unplayable data, a hash mismatch, a failed integrity check, a verifier or R-01 meaning change, an access-rule or leak failure, or a content rule;
   - it fails more often as the test gets closer to a code path someone changed recently;
   - a code change within the last 3 days touches what the test covers.
   If any holds, it is a defect. Open it at its severity (S0 or S1 for the first group) and stop.
3. **A named cause or an honest "unknown".** The record says one of: timing under load, shared state between tests, order dependence, disk or memory pressure on the runner, a network or third-party call, a clock, or **unknown**. Unknown is allowed for quarantine; it is not allowed past the expiry.

One failure on one run is not flaky. It is a red, and it blocks the PR like any other.

**Environment faults** (runner lost, disk full, a missing audio device) are a separate class: they are not test flakes. A rerun is allowed once, only when the job log shows no test verdict, and both run ids go in the PR or issue. If the same fault hits twice in 7 days it becomes an ops issue, not a quarantine.

## 3. Quarantine

Quarantine moves a flaky test out of the blocking path, visibly and for a short time. It must not be a way to lose coverage.

**The flake record** is a GitHub issue labelled `flaky` (a label that does not exist yet; creating it is a repo setting for the founder or coordinator, U) with:
- test id (file and full title), the requirement it proves (`Satisfies:` as in a test name), the two run ids from section 2, the cause class;
- **owner**: one agent handle or the founder, never "qa" as a group;
- **declared** date and **expiry** date, expiry at most 7 days after declared (TDD 07 9.2);
- whether the test covers a P0 requirement, and which other test still covers it.

**The skip is labelled and expires.** The test title carries a tag the code can read, in the form below (proposed; the format is the only thing the guard needs):

```
it.skip('[quarantine FLK-<issue number> owner:<handle> until:2026-11-04] <original title>', ...)
```

A guard script (section 6) greps the tag and fails CI when any of these is true:
- the `until` date is today or earlier (the skip turns the green into a red on the day, which forces a fix, a de-flake or a documented decision);
- the owner or issue number is missing, or the issue is closed;
- `until` is more than 7 days after the date of the commit that added the skip;
- the test is the only coverage of a P0 requirement at G3 or later (the guard reads the requirement id from the test name and the `docs/TRACE.md` mapping, U for how complete that mapping is);
- the number of active quarantines is above 5 (a proposed cap, so a pile of skips is itself a red).

Extending an expiry is allowed once, by 7 days, by the owner, with a new line on the issue saying what was learned. A second extension needs the coordinator. After that the test is fixed or deleted **with its requirement's coverage replaced in the same PR**.

**Quarantined tests still run and report** (TDD 07 9.2). A plain `it.skip` does not run. So the nightly runs the quarantined tests with the skip lifted (proposed switch `QUARANTINE_RUN=1`) and writes each outcome onto its flake issue, which is also the evidence for leaving quarantine. This is a gap between the TDD's words and a bare skip; whoever builds the guard decides the exact mechanism and records it here.

**Leaving quarantine:** the cause is fixed and the test passes 10 consecutive times in CI conditions (BL-443 uses 3 in a row on a 2-core runner for slow tests; for a test that failed intermittently, 3 is too few to show anything, so 10 is the proposal), or the test is replaced. Remove the tag in the same PR as the fix and close the issue.

**Existing skips are not quarantines.** `it.skipIf(...)` in `apps/mobile/test/privacy-manifest.test.ts` and `t.skip()` in `apps/mobile/test/family-e2e.test.ts` (waiting on a migration, a documented reason) are conditional skips for a stated precondition. They are outside this policy but should carry the same kind of reason in the title (I: not all of them do).

## 4. Where the policy does not bend

### Kill harness (DL-01, DL-02), workflow `kill-harness.yml`
- **Never quarantined, never retried to green, never "re-run to see".** A red kill-harness run is a defect until a human has read the report and shown otherwise. The DL-01 failures of 24 and 27 Oct (section 1) were exactly what the harness is for.
- The harness already separates its verdicts: exit 1 is a verdict on data (lost, doubled, or a kept take that does not play), exit 3 is `app_exited` (the app died). Both are findings. A run whose **self-check** (the planted failures it must catch) does not catch every plant is a broken harness: that is also red, fixed at the harness, and no run before that fix counts as a pass.
- The only rerun allowed is for an environment fault with no verdict (section 2). A re-run writes new artifacts by run attempt (V: artifact names include `run_attempt`), so a rerun's merge job never reads another attempt's shards.
- The gate run (500 of 500 kept, 50 at each crash point) belongs to the freeze commit (row B2-11, never waived, 07 section 5.3). A single failing shard fails the gate; it is not averaged away. The nightly size (50 runs a mode) finds regressions only and is not a gate.
- A decision to change what counts as a pass (for example amending 07's playable rule) is a recorded decision, not a test edit.

### Nightly (`nightly.yml`)
- A red scheduled run opens or updates one `nightly` issue (RA-20-19, #272). That issue is the flake record for anything in the nightly: a flaky job is declared there, with section 2's evidence.
- Fuzz and plan jobs are blocking for go/no-go row B2-22. The p95 budget job is advisory under D-114 until it has its own workflow with one retry; that retry is the one place a retry is already written into a decision, and a pass on the retry still files a flake issue.
- **The nightly does not run until the default branch is `develop` (AF-05)**; today a scheduled run does not exist (V per ALPHA_GO_NO_GO B2-22). So no nightly flake can have been observed yet, and none should be declared from pull-request runs of the nightly's jobs.
- Quarantine of a nightly job is allowed under section 3. A build 2 go/no-go record lists the active quarantines next to B2-22 (proposed), so a green nightly cannot hide a skipped test.

### Pull-request CI (`ci.yml`, `ios-compile.yml`, `migration-guard.yml`)
- Unit and database tests never retry automatically (Playwright for the web already has `retries: 0`, V, `apps/mobile/e2e-web/playwright.config.ts`). A retry would hide the order-dependence this policy exists to expose.
- Rerunning a failed required check is allowed once, to gather section 2's evidence. A pass on the rerun does not make the PR green by itself: the PR author attaches both run ids, and the reviewer decides between a flake record and a defect. Two reds on the same SHA after one rerun is a defect until shown otherwise.

### Device and Maestro runs
- Per the e2e README: a nightly flow may retry once and a pass on retry files a flake issue. Release-candidate and go/no-go runs never retry. A device row in `ALPHA_GO_NO_GO.md` never passes on a retry.

## 5. What is never allowed

1. **Deleting or weakening a test to get to green.** That includes loosening an assertion, widening a tolerance, or removing the line that fails. A test is removed only when its requirement no longer exists (a decision says so) or another test now proves it, named in the PR.
2. **Editing a content rule test to make it pass.** `packages/content/test/rules.test.ts` is never edited, skipped or quarantined to pass; the copy is fixed (CLAUDE.md). The same holds for `no-real-family-data.test.ts`.
3. **Quarantining, retrying or loosening** any never-waived row: the R-01 and verifier suites, access-rule and leak suites (`npm run test:db`), the kill harness, export completeness, the 18+ gate, consent-before-send (`SCCON`), the no-synthetic-speech check (07 section 5.3). If one of these is unstable, the instability is the defect.
4. **An open-ended skip.** No `skip` with no owner and no expiry for something that failed.
5. **Rerunning until green** and calling the last run the result. Each rerun is recorded; the first red stays on the record.
6. **A retry added to a test runner config** (vitest, Playwright, node test) to hide a failure.
7. **Using a flake as the reason for a go/no-go exception.** A flake never waives a never-waived row.
8. **Declaring flaky from one run, or from a failure message nobody read.**

## 6. What would enforce this (none of it exists yet)

I did not build any of these; the paths for this task were two documents. Each is its own change, and anything under `.github/workflows/` needs independent review before merge (brief rule).

| Piece | Where it would go | Notes |
|---|---|---|
| Guard script that fails on an expired, ownerless or over-long quarantine tag | `scripts/qa/` plus a step in `ci.yml` | pure text scan, runs in seconds; needs a test that fails with an expired tag |
| `flaky` label and an issue template with the section 3 fields | repo settings and `.github/ISSUE_TEMPLATE/` | the label is a settings change, the founder's or the coordinator's |
| Nightly lifts the skip and reports quarantined results | `nightly.yml` | after AF-05, because no nightly runs before it |
| A weekly count of quarantines, reruns and reds by workflow | the `ops` agent's twice-weekly refresh or QA's check-in | uses the same API read as section 1 |
| A task in `docs/BACKLOG.md` for the above | the product manager | not created here; this file owns no backlog |

## 7. Open points for the founder or the QA owner

- Is 7 days the right expiry (TDD 07) given the alpha is on a two-week clock? A 7-day skip on a Tuesday expires on a Tuesday, in the middle of the go/no-go week; the guard could treat the freeze as a stop on extensions.
- The cap of 5 and the 10-pass exit are proposals of this draft, not decisions.
- Section 1's window is 4 days of runs. Before relying on it for a decision, someone should page the full run history; I could not (U).
