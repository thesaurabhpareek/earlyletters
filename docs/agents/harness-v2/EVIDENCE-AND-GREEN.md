# Evidence and green: design (qa, 1 Nov 2026)

Covers G3 (evidence part), G4, G9 in `RETROSPECTIVE.md`. Free throughout. Workflow edits are proposals for the founder (CR-22). Nothing here was run on a phone or on Actions. U = unverified.

## 1. Requirements
- EG-1 A run whose tests passed but whose skipped count exceeds the allowlist fails.
- EG-2 A suite whose summary line cannot be found fails.
- EG-3 Each allowlist entry has reason, owner, expiry and an exact count; an expired entry or one above the real count fails.
- EG-4 A page states the last run of `testflight.yml` and `release-ios.yml` that succeeded with no skipped build step, or "never".
- EG-5 `trace.mjs --check` runs in CI and fails on duplicate or undefined ids only.
- EG-6 Every B1 P0 id has a test title citing it; the uncited count cannot rise.
- EG-7 An `ENFORCEMENT.md` row citing a missing test file or workflow fails `npm test`.
- EG-8 The B1 device kit is one sitting, one evidence file, ending in pass, fail or stop.
- EG-9 EG-1 to EG-8 each have a planted-failure test.

## 2. Skip-count guard
New `scripts/ci/skip-guard.mjs` (pure Node) reads captured logs, so no suite changes how it runs.
- vitest: `Tests  A failed | B passed | C skipped`, one per workspace.
- node:test: `# skipped N` / `# todo N` (TAP) or the spec-reporter `skipped N`.
- db runner: `supabase/tests/run.mjs:18` uses `stdio: 'inherit'`, so each file's summary follows its `=== file ===` header (line 16); counts attach to that header.
- Allowlist `docs/qa/skip-allowlist.json`: `[{"suite":"apps/mobile","count":1,"reason":"...","owner":"qa","expires":"2026-12-01"}]`; suite is a workspace path or `db:<file>`.
- Fails: skipped above allowed (unlisted means 0); no summary for an expected suite; entry expired or above actual; zero passed.
- First run names the conditional skips: `seam-guard.test.mjs:204`, `functions-deploy.test.mjs:298`, `family-e2e.test.ts:416,442,705`, `privacy-manifest.test.ts:227,319`. The one skip on clean develop is unattributed (U).
- Runs in `ci.yml` after `npm test` (line 62) and `test:db` (line 73).

Patch for `docs/ops/proposed/skip-guard-ci.md`:
```
- run: npm test 2>&1 | tee test.log     # shell: bash -eo pipefail {0}
- run: npm run test:db 2>&1 | tee db.log
- run: node scripts/ci/skip-guard.mjs --allow docs/qa/skip-allowlist.json test.log db.log
```
Job names stay, so the required check `required` is untouched.

## 3. Pipeline ledger
`scripts/ci/pipeline-ledger.mjs` calls `GET /repos/{o}/{r}/actions/workflows/{file}/runs` then `/runs/{id}/jobs`. A run counts only if `conclusion=success` and no step in a fixed list (for example "Build on EAS", `testflight.yml:116`) is `skipped`. Output `docs/release/PIPELINE_LEDGER.md`: per workflow, last non-skipped success (URL, sha, date) or `never`, plus skipped and failed counts. Retro found 5 of 5 testflight runs skipped. Readers: the G2 `TODAY.md` generator and the release doctor. Runs in the no-model cron with read-only `GITHUB_TOKEN`; by hand until then.

## 4. Trace check and B1 P0 scope
- Append `node scripts/trace.mjs --check --no-write` at `package.json:11`. `--check` exits 1 only on duplicate or undefined ids (`trace.mjs:27-28, 542`); TRACE.md shows 0 and 0, so it is green on day one.
- Scope: B1 P0 ids are those cited by `docs/qa/release-test-catalog.csv` rows with release B1 or both and priority P0. New `trace.mjs --scope b1` lists them and the uncited ones. Size is U until computed (overall 571 of 768 P0 uncited).
- Citing: title starts `[DATA-REQ-048] ...`. Tests that already cover an id get the prefix; assertions untouched.
- Ratchet: `docs/qa/b1-p0-uncited.baseline`; the check fails if the count rises; a PR that lowers it lowers the file.

## 5. ENFORCEMENT.md truth
- `scripts/ci/enforcement-count.mjs` counts rows by status word and checks the Totals sentence (3 Oct: 42 / 38 / 34 / 78) between markers; stale totals fail `npm test`. The 27 rows citing PRs #26/#30/#32 are swept once by hand against develop.
- `scripts/ci/enforcement.test.mjs`: each backticked path in "Enforced by" must exist; an `enforced` row with none fails.
- Built on a branch; merged after 9 Nov (CR-22).

## 6. B1 device evidence kit (drill SE 3, one sitting, about 3 h)
Build 1 has servers off, so AL-04, 05, 06 and the sync parts are build 2 and recorded n/a. Never the family phone (`run-sheets/README.md` rule 3).

Order (times are the sheets' estimates [E]):
1. TF-04 smoke, 10 min: installs, launches, Settings > About build number.
2. AL-01 first run, 40 min: 18+ gate first, no OS prompt before first Speak, model download.
3. AL-02 record offline, 45 min: airplane mode, 30 s and 2 min scripted Asha letters, words present on reopen.
4. AL-03 kill during save, 10-run hand subset, 45 min.
5. AL-08 part A (time U).
6. AL-07.1 to .3 only if Delete account shows; else n/a with the flag value.
7. S1-23 VoiceOver and S1-24 display (AX5, dark, Low Power), about 30 min (U).

Capture: screen recording of AL-01 gate through first saved letter, one recording per ten kills; screenshots of About, the gate, the saved letter, and App Privacy Report after AL-02 (no domains). Media stay on the founder's storage; only file names go in the file.

File: `docs/qa/evidence/<date>-<x.y.z(n)>-se3.md` from `TEMPLATE.md`: Session, Phones, "Before the first step" boxes, then one row per step (AL-01.0 to .12, AL-02.0 to .12, AL-03.0 to .4) marked pass, fail or n/a with reason. `scripts/qa/evidence-check.mjs` rejects empty rows and name-like strings.

- Pass: all rows pass or justified n/a; kill tally shows zero lost or doubled; no S0.
- Fail: any row fails. Commit the file anyway (a failure is evidence), open one `device-fail` issue per row, rerun that row next build in a new file.
- Stop: any S0 (letter lost or changed, consent skipped, anything after an under-18 answer). Keep the phone as is; issue first.

Does not prove: other iPhones or iOS versions, speech accuracy, StoreKit or money (production-profile build after 9 Nov, D-124), sign-in, sync, backup, upgrades, 500-run kill robustness, Android, or that this is the build that ships.

## 7. Maestro testIDs
108 of 136 missing (RELEASE_TEST_PLAN.md:25). After 9 Nov: (1) a test listing flow testIDs absent from `apps/mobile/src`, baseline 108, ratchet down; (2) add IDs per screen (first run, record, save, then rest), one PR each under CODE-R02; (3) enable flows in simulator CI one at a time. Macos minute limits on a public repo: U.

## 8. Acceptance tests (all in `npm test`, under 5 s)
- EG-1: fixture log above allowlist exits 1; at it, 0. EG-2: summary removed, exit 1. EG-3: expired and over-count entries exit 1.
- EG-4: API fixture with only skipped runs, and one with success plus a skipped "Build on EAS", both print `never`.
- EG-5: duplicate-id and undefined-cite fixtures fail. EG-6: raised baseline fails, lowered passes.
- EG-7: fixture row citing `nope.test.ts` fails. EG-8: empty row and name-like string rejected.
- Before the founder applies the patch, a throwaway branch with one added `it.skip` must turn CI red (kill-harness style).

## 9. Cost, failure modes, order
Cost: zero; the device run is about 3 founder hours. Failure modes: reporter text changes on upgrade (fixtures fail first); `tee` hiding exit codes (pipefail in patch); allowlist as dumping ground (expiry, exact count); ledger says `never` until testflight is enabled (intended); kit drifts from sheets (it cites row ids, not copies).
Order: before the 3 Nov freeze, prepare the kit and evidence-check on a branch (no workflow edit). Device sitting after build 1 is on TestFlight (U), before 9 Nov. After go/no-go and the CR-22 lift: skip-guard patch, trace check, ledger cron, ENFORCEMENT test, Maestro IDs.

Conflicts of interest: I own trace.mjs, the harness and the QA plan structure I am redesigning, and gain when QA gaps rank high; the release catalog and test plan came from a Karma session.
