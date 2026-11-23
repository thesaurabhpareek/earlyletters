# BRIEF HG-H3: a read-only `stack-status` script for stacked PRs (HARNESS-GAPS H3)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder decides where it lives. `scripts/agents/**` is founder-owned and a security-architect and ai-eng-lead review path; an agent may not write there. This brief therefore produces a PROPOSAL under `docs/ops/proposed/stack-status/` (script plus test) that the founder moves into `scripts/agents/` (or into `scripts/ops/`, which ops owns, if he allows it). The agent never edits `scripts/agents/**`.** Founder-only: the move, and reviewing the path.

```
BRIEF HG-H3                                       Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10 (harness)   Build: none   Wave: 1

1. GOAL: When someone runs `node stack-status.mjs`, every open PR whose base is not `develop` is one table row naming its base PR, whether that base merged, `mergeable_state`, the commits it is ahead of its base, and the one next step (retarget, rebuild, wait), using GET calls only.

2. CARD ROWS and TEST TITLES: HARNESS-GAPS H3 (#918); BRIEF-TEMPLATE field 10 (stack rule). No NS row.
   Tests (docs/ops/proposed/stack-status/stack-status.test.mjs, `node --test`): a table of fixtures from the 20 Nov stack:
     [H3] #836 on #835's branch shows "waits for #835"        [H3] a slice whose base merged shows "retarget to develop, then rebuild"
     [H3] a PR into develop is not listed                      [H3] no call is anything but GET (the injected `api` throws on any other method)
   Red on develop: no such script (`ls scripts/agents | grep stack` -> none [V]). Mutant: let the api accept POST: the last test goes red.

3. FILES
   Touch: docs/ops/proposed/stack-status/stack-status.mjs and stack-status.test.mjs (new), docs/ops/proposed/stack-status/README.md (how the founder installs it), docs/agents/checkins/ops-rd-h3-stack.md
   Never: scripts/agents/** (founder); any write call (no PATCH of a base: the runbook step is Karma's); tokens or headers in output.
   Shared file: merge-queue.mjs already has `--all-bases` with an OTHER-BASE verdict (:312); reuse its `paged` and `api` pattern by copying the injected-api shape, not by importing a file you cannot edit.

4. READING PACK: Pack 10 items 5 and 7; HARNESS-GAPS.md H3 and H3.1 (#918); scripts/agents/merge-queue.mjs lines 1-35 (read-only rule, `gh api` only) and 219-262 (how rows are built); `.claude/skills/stacked-prs/SKILL.md` sections 4 and 5 (rebuild recipe).

5. CODE ENTRY POINTS (verified at 16e61549)
   scripts/agents/merge-queue.mjs:219   `buildQueue({ api, repo, ... allBases })`, REST only (GraphQL is blocked: `gh pr list` errors); :312 `--all-bases`
   scripts/agents/merge-queue.mjs:70-74 DEFAULT_REPO, FALLBACK_REQUIRED, MACOS_CHECKS, NATIVE_PATHS
   Live stacks on 20 Nov [V gh api]: photo #835 (base develop), #836 on #835's branch, #837 on #836's, #838 on #837's, #839 on #838's, #840 on #839's; BL-952 #894 then #895; BL-961 #879 on #871's branch (head refs: use `gh api repos/.../pulls/<n> --jq '.base.ref'`)
   `git merge-base` distance needs a local clone: Rec use `GET repos/.../compare/<base>...<head>` (`ahead_by`, `behind_by`) so the script needs no checkout [U: confirm the field names against one real response before relying].

6. DATA AND SECURITY: the `gh` wrapper builds the argument list itself and rejects any `-f`, `-F`, `--field`, `--raw-field`, `--input` and any `--method` other than GET (`gh api` flips to POST when `-f` or `-F` is given); a test feeds each flag to the real wrapper (not only the injected `api`) and expects a throw. no data class. Output is PR numbers, branch names, shas and states: public repo data. No token read. Boundary: agent harness (security-architect reads `scripts/agents/**`). Fail closed: an unreadable PR prints `unknown`, never "ok".

7. LIBRARIES: none (Node built-ins, `gh` via child_process like merge-queue.mjs).
8. BUDGETS: one API call per open stacked PR plus one list call [E]; under 10 seconds.

9a. REVIEW B FIX: `ahead_by` and `behind_by` stay [U] until one real `compare` response is read and pasted into the test fixture; until then the table prints `unknown` for them and the next-step column uses base PR state and `mergeable_state` only.
9. ACCEPTANCE: columns: PR, base ref, base PR, base state, mergeable_state, ahead_by, behind_by, next step. A final line counts stacks and the oldest unmerged base. `--json`. Done also means the fixtures reproduce the six photo slices and the two BL-952 rows.

10. PR BREAKDOWN: PR 1 | ~190 lines, 4 files | base develop | not run by anything; the founder moves it.

11. LENSES: A security-architect, B ai-eng-lead (harness).

12. ORDER: any time; helps the retarget cascade now. Before BRIEF HG-MQ (which may fold it in as `--stacks`). Blocked by the founder for the move only.

13. DONE: [ ] `node --test docs/ops/proposed/stack-status/stack-status.test.mjs`; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing.

15. STOP AND ASK: the compare endpoint does not give `ahead_by` as assumed; the founder wants it inside merge-queue.mjs instead (then HG-MQ owns it); any need to write.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-stack agent:ops -->`; branch chore/ops-stack-status-proposal; labels agent:ops, from:agent, needs:founder.
```
