# BRIEF CI-SIZEGATE: a size gate with a committed baseline (Z-02, Z-05, Z-06; founder decision 15, 40 MB)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: the first measured baseline exists (the founder or CI runs `measure.ts` once; this sandbox cannot export the bundle: expo-local-authentication is missing) and the founder pastes the workflow step (a change to `ci.yml` `seam-guard`; two reviews). The thresholds below are my proposal (Rec) and are set from the first real number, not from the 3 Oct figure.** Founder-only: the paste, any change to the 40 MB budget, accepting a baseline that grows.

```
BRIEF CI-SIZEGATE                                 Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: before 14 (photo and video libraries will add weight)   Wave: 2

1. GOAL: When a pull request grows the Hermes bytecode by more than 100 KB or 1 percent, grows a top-20 package by more than 50 KB, or adds an app dependency, the check fails with the numbers,
   unless the PR body says `Size-change: <reason, owner>` and the baseline file changes in the same PR.

2. CARD ROWS and TEST TITLES: NFR budgets Z-02, Z-05, Z-06 (docs/engineering/readiness-20nov/performance/NFR-BUDGETS.md, #928); APP_SIZE.md section 1 (decision 15). No NS row.
   Tests: extend scripts/size/lib.test.ts (exists [V]): `[Z-02] bytecode growth over the limit fails`, `[Z-05] a new app dependency fails`, `[Z-06] a Size-change line downgrades to a notice only when the baseline changed too`.
   Red on develop: `measure.ts` has no `--check` and no baseline file (`ls docs/ops/size-baseline.json` -> missing [V]). Mutant: compare with `>=` instead of `>` at the limit.

3. FILES
   Touch: scripts/size/measure.ts and lib.ts (a `--check` flag; read, compare, exit 1), scripts/size/lib.test.ts, docs/ops/size-baseline.json (new; written by the script, reviewed like a snapshot),
          docs/ops/APP_SIZE.md (the re-measured figures; its cut 1 is done in code: components/ui/toast.tsx:19), docs/ops/proposed/workflows/size-gate-step.yml, docs/agents/checkins/ops-rd-h3-sizegate.md
   Never: .github/workflows/**; a native size claim from CI (CI cannot see the native binary: App Store Connect or the thinning report per candidate decides, Z-01, Z-04).
   Shared file: scripts/release/label-effect.mjs hosts the optional `Native-size:` rule (BRIEF BL-975-ACT part b).

4. READING PACK: Pack 10 item 1; MEASUREMENT-PLAN.md section 5.1 (#929); APP_SIZE.md (all); scripts/size/measure.ts header (lines 1-22); .github/scripts/seam-guard.mjs (the export it already pays for) and ci.yml `seam-guard` (:100-135).

5. CODE ENTRY POINTS (verified at 16e61549)
   scripts/size/measure.ts:1-22     what it does: two exports, attribution, verdict vs budget, exit 1 over budget; writes dist/size/report.json (git-ignored)
   .github/workflows/ci.yml:100     job `seam-guard`: guard tests always; the exports (about 4 minutes) only when BUNDLE_PATHS match (seam-guard.mjs:80)
   docs/ops/APP_SIZE.md:33          Hermes bytecode 11.6 MB of a 12 MB sub-budget (3 Oct): under 4 percent headroom, stale (Phosphor per-icon imports were cut after)
   [U] whether seam-guard's export keeps the source map: if not, the attribution step needs `measure.ts`'s own export; budget one more minute then.

6. DATA AND SECURITY: no data class. The baseline holds byte counts and package names only. Boundary: none. A size check never reads bundle content beyond names.

7. LIBRARIES: none (node:zlib already used).  A new `source-map` reader would be a dependency: avoid; lib.ts already attributes bytes per source [V header].
8. BUDGETS: download under 40 MB (decision 15); bytecode 12 MB sub-budget; JS assets 3 MB and fonts 1.5 MB are my Rec numbers (MEASUREMENT-PLAN 5.1), to be re-set from the first run. CI cost: [E] under 1 minute added to `seam-guard`.

9a. REVIEW B FIXES: (i) the hard budgets (12 MB Hermes bytecode sub-budget, 40 MB download, founder decision 15) have NO waiver: `Size-change:` only moves the relative baseline, never the absolute limits; add the test `[Z-02] bytecode over 12 MB fails whatever the PR body says` with the limits as constants in the script. (ii) both the body line and the baseline file are written by the PR's author, so compare the baseline with the BASE branch's copy (`git show origin/<base>:docs/ops/size-baseline.json`) and require the founder's approval when the baseline grows (a failing check until he sets the owner-applied label, read as in BRIEF CI-PRSIZE (i)). Test: `[Z-06] a PR that raises the baseline and the body line together still needs the owner`.
9. ACCEPTANCE: baseline fields: bytecode bytes, gzip bytes, JS asset bytes, font bytes, top-20 owners with bytes, dependency count, commit. `--check` prints each comparison, exit 1 on the first limit. The first PR's baseline is produced by a CI run, pasted into the PR
   (not typed). Done also means a planted 200 KB import fails the check in a scratch PR.

10. PR BREAKDOWN: PR 1 script + tests ~180 lines, 3 files; PR 2 baseline + workflow proposal ~90 lines, 3 files | base develop | check not running until the founder pastes the step.

11. LENSES: A principal-architect, B security-architect (it touches `.github` only as a proposal) [E].

12. ORDER: after the first measured run; before Build 14 (NS-01 pictures add native code). With BRIEF B13-CHECKS step (d). Blocked by the founder for the paste and the first run.

13. DONE: [ ] `npx vitest run scripts/size` [U: where scripts/size/lib.test.ts runs: confirm it is in `npm test`]; [ ] baseline from CI; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE (or Apple) CAN PROVE: the real download size: App Store Connect or the thinning report of the candidate (Z-01, Z-04), recorded in docs/release/<x.y.z>.md. Build 13's number is the first one on record.

15. STOP AND ASK: the first run shows the bundle already over a sub-budget; the baseline must grow to merge a feature (the founder accepts, never the agent); the export differs between CI and a Mac by more than 2 percent [E] (then compare like with like only).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-sizegate agent:ops -->`; branch chore/ops-size-gate; labels agent:ops, from:agent, needs:founder.
```
