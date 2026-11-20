# BRIEF HG-MQ: merge-queue fixes from HARNESS-GAPS (native paths, skipped checks, quiet rule, stale-review delta)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder decides. `scripts/agents/**` is founder-owned (security-architect and ai-eng-lead review). The agent writes a PATCH file and a test patch under `docs/ops/proposed/merge-queue/`, checks them by applying both in a scratch worktree, and never edits `scripts/agents/**`. The quiet-rule change (item 3) is a policy, so it is Karma's and the founder's call; items 1, 2 and 4 are plain bugs or output.** Founder-only: applying the patch.

```
BRIEF HG-MQ                                       Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10 (harness)   Build: none   Wave: 1

1. GOAL: When the merge queue reads a PR, a PR that changes only `apps/mobile/eas.json` stays in the native path list (CR-69 A9, `docs/agents/cto/RULINGS.md` ~706) and so waits for the macOS checks, which fails closed until the founder adds `apps/mobile/eas.json` to the `changes` match in `ios-compile.yml` (a separate founder note), a PR that changes `apps/mobile/package.json` is held by a red compile check, and a stale review prints the reviewed sha and the diff command.

2. CARD ROWS and TEST TITLES: HARNESS-GAPS H4 and H5 (#918); no card row. Tests (added to a copy of scripts/agents/merge-queue.test.mjs inside the patch):
     [HG-MQ] a skipped compile check on a PR that ios-compile does not treat as native, with a successful `native files changed?` job, is not WATCH-RED; an eas.json-only PR stays native in the queue
     [HG-MQ] apps/mobile/package.json is a native path, as in ios-compile.yml
     [HG-MQ] STALE-REVIEW names the older sha and the delta command
   Red on develop 16e61549, by reading the code plus live data: (1) `NATIVE_PATHS` (merge-queue.mjs:73) lists eas.json and omits apps/mobile/package.json, while ios-compile.yml:306-311 treats package.json as native and eas.json as not; (2) `compile` is `if: needs.changes.outputs.native == 'true'` (ios-compile.yml:60),
   so for an eas.json-only PR it concludes `skipped` (live example: #894, #895, #879 each show "iOS simulator build ... completed skipped" [V gh api check-runs]); `verdictFor` treats any state outside success, missing, pending as red (merge-queue.mjs:193-195), so that PR reads `WATCH-RED iOS simulator build (no signing)` [E: derived from the code, not yet run on an eas.json-only PR].
   Existing test at merge-queue.test.mjs:137 passes an eas.json PR with both macOS checks green, which hides the case.

3. FILES
   Touch: docs/ops/proposed/merge-queue/merge-queue.patch (a `git diff` of scripts/agents/merge-queue.mjs and .test.mjs made in a scratch worktree), docs/ops/proposed/merge-queue/README.md, docs/agents/checkins/ops-rd-h3-mq.md
   Never: scripts/agents/** itself; the dispatcher (`dispatch.mjs`, `lib.mjs`); #912 (draft, four-digit ids, not mine); branch protection.
   Shared file: #912 edits scripts/agents/lib.mjs only [V gh api files]; no overlap.

4. READING PACK: Pack 10 item 5; HARNESS-GAPS.md H3, H4, H5 (#918); merge-queue.mjs header (lines 1-70), `verdictFor` (:184-203), `buildQueue` (:219-270); ios-compile.yml:288-320 and :57-60; docs/engineering readiness quality CHECKS-AND-BALANCES section 9 (review header form).

5. CODE ENTRY POINTS (verified at 16e61549)
   scripts/agents/merge-queue.mjs:72-74  MACOS_CHECKS (two name patterns), NATIVE_PATHS (ios/, modules/, app.config.*, eas.json, package-lock.json), `touchesNative`
   scripts/agents/merge-queue.mjs:148-164 `checkState`: skipped stays "skipped"; :184-203 verdicts; :189 STALE-REVIEW; :193-198 the native branch; :200 WAIT-QUIET
   scripts/agents/merge-queue.mjs:236-262 `pushAgeMinutes` = minutes since the head commit's committer date (a proxy: a rebase gives a new date)
   .github/workflows/ios-compile.yml:306-311 native filter: modules/, app.config.ts, apps/mobile/package.json, ios/, package-lock.json, ios-compile.yml itself
   Items: (1) keep `apps/mobile/eas.json` in NATIVE_PATHS and ADD `apps/mobile/package.json` (the workflow lists package.json; the founder's note adds eas.json to the workflow's `changes` match, ios-compile.yml:306-311 inside the job that starts at :288), no removal; (2) treat `skipped` as not-a-failure for the macOS checks (a skipped check is "not required"); (3) quiet rule (H4: CI takes about 20 minutes, so "settled plus 10 quiet" can be 30; Rec, not decided: measure quiet from the later of the head date and the last check completion, keep the default 10);
   (4) STALE-REVIEW row prints `reviewed <sha12>` and `git diff <old> <new> --stat` (H4 fix 3).

6. DATA AND SECURITY: no data class. Read-only GETs only (header: "There is no write path in this file"); the patch must not add one: keep the test that the injected api rejects non-GET. Boundary: the merge gate is where an agent's PR becomes code on develop; a loosened gate is a security change. Read: security-architect.
   Fail closed: an unknown check state still blocks.

7. LIBRARIES: none.
8. BUDGETS: none new (same number of API calls).

9a. REVIEW B FIXES: (item 2) a macOS job is also `skipped` when the `changes` job FAILS, so "skipped is fine" would pass a native PR on broken CI. Accept `skipped` for `compile` only when the queue itself computes that ios-compile's filter says not native (the workflow's path list, ios-compile.yml:306-311) AND `native changes` concluded success; otherwise skipped stays red. Add `[HG-MQ] a skipped compile with a failed `changes` job is still WATCH-RED`. (item 1) Karma has ruled (CR-69 A9): `eas.json` STAYS in NATIVE_PATHS; removing it would loosen the merge gate. The patch only adds `apps/mobile/package.json`. The `changes`-job eas.json match is a proposal under `docs/ops/proposed/` for the founder to apply to `ios-compile.yml`; until then an eas.json-only PR waits, which fails closed. The skipped-check rule (item 2) is likewise a proposal.
9. ACCEPTANCE: the three tests green on the patched tree and red on develop's; the full existing test file green; a table in the README of which verdict each of five sample PRs gets before and after (eas.json only, which stays WATCH-RED until the founder's `changes` match is pasted; apps/mobile/package.json only; a native module; a docs PR; a stack slice).
   Done also means the patch is shown to turn one verdict only where intended (diff the `--json` output on the 20 PRs open now: only rows touching those paths change).

10. PR BREAKDOWN: PR 1 | ~150 lines, 3 files | base develop | no flag; not live until the founder applies it.

11. LENSES: A security-architect, B ai-eng-lead.

12. ORDER: any time; folds BRIEF HG-H3 in as `--stacks` only if the founder asks. Blocked by the founder for the apply.

13. DONE: [ ] `node --test scripts/agents/merge-queue.test.mjs` in the scratch worktree with the patch applied; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing. The first live check: after the founder pastes the `changes` match, an eas.json-only PR runs the macOS checks instead of waiting. The queue matches the job by its name `native files changed?` in the same check-runs list.

15. STOP AND ASK: item 3 is a policy and Karma has not ruled; a verdict change would let a red macOS check pass; the workflow's native filter itself looks wrong (that is BRIEF CI-Q2's file).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-mq agent:ops -->`; branch chore/ops-merge-queue-proposal; labels agent:ops, from:agent, needs:founder.
```
