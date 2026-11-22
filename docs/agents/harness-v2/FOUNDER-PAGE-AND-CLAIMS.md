# Founder page, live claims, WIP rule (design for G2 and G6)

Proposal, 1 Nov 2026. Nothing here was run. U marks unverified.

## 1. Requirements
- FP-1 One URL answers "what needs me today" in 15 lines or fewer.
- FP-2 Line 1 states generation time and when the page expires; a page older than 6 h is labelled stale by its own text.
- FP-3 No model; free runners only; GET calls plus one issue edit.
- FP-4 Output holds numbers and fixed words only, never PR titles or comment text (untrusted, no mentions).
- FP-5 Every other status surface is a one-line pointer or retired.
- FP-6 CLAIMS.md holds live rows only, at most 15, each expiring 72 h after claim or renewal.
- FP-7 `board-check.mjs` never blocks a merge; it exits 0, 1 or 2 and prints findings.
- FP-8 Archiving BOARD.md loses no byte of history (blob hash test).
- FP-9 WIP breaches show as a red line, not a gate.
- FP-10 The stale-PR sweep is printed, never run by an agent.
- FP-11 Every session ends with a "decisions given, where recorded" line.

## 2. TODAY page
Lines, in order (functions: `buildModel` page.mjs:205, `collect` :279, `founderLine` :227, `runChecks` check.mjs:110):
1. Generated UTC, valid until +6 h, develop sha.
2. Freeze and go/no-go days left (from new `docs/release/dates.json`, founder-edited; U, file does not exist).
3. Founder steps open, first 3 ids (`runChecks`).
4. Steps unreadable (`exitCode` 2; the Actions token cannot read branch protection, so this line says "run check.mjs locally").
5. Handoffs over 48 h, oldest 6 (`model.handoffs`).
6. Handoffs over 14 days: count.
7. Founder-class merges in 7 days; how many lack 2 counted passes on the merged head (`founderLine` warning, `countedPass` :141).
8. Worst such merge, one line.
9. Review gate (G1): "not built" until the check exists, then open PRs whose head lacks 2 counted passes.
10. Merged in 24 h.
11. Waiting for review: count, oldest PR number and age.
12. Open PRs over 14 days (`model.old14`); target 0 after the sweep.
13. WIP red line (section 5).
14. Claims: `board-check.mjs` counts of expired, closed-PR and overlapping.
15. Decisions: `D-` ids cited in PRs merged in 7 days and absent from `docs/DECISIONS.md` (new function, U).

Location: a pinned issue, body replaced in place, locked to collaborators. A file in `docs/release/` loses:
- Pushing to `develop` from Actions needs a bypass actor past the required checks: the identity work held to 10 Nov (CR-20, RULINGS.md:261; CR-24).
- Eight commits a day each trigger CI.
The issue needs `issues: write` and no commits. Costs: not versioned; agents read it by REST; pinning is a founder click. Agents cannot edit workflows, so the founder applies the file either way. `docs/release/TODAY.md` becomes a 3-line pointer to the issue.

Workflow: `docs/ops/proposed/today-page.yml`, cron every 3 h plus `workflow_dispatch`, `permissions: contents: read, pull-requests: read, issues: write`, triggers `schedule` only (no `pull_request_target`), ubuntu runner. CR-5 (RULINGS.md:41) bans the model lane; this runs no model, but CR-22 and CR-5 still make it a CTO ruling before the founder enables it. An `if: failure()` step writes "LAST RUN FAILED" into line 1.

Staleness: 6 h allowed (two missed cycles). A dead cron cannot write "stale", so line 1 carries "valid until" and the issue list shows its own updated time. 

## 3. Other surfaces
| Surface | Becomes |
|---|---|
| `FOUNDER_QUEUE.md` | Only hand-written founder document; steps only. Status lines :3-8 replaced by a pointer. |
| `FOUNDER_TASKS.md` (1 of 57 ticked) | Retired to a pointer (the Queue index maps its ids). |
| `TESTFLIGHT.md` "Where build 1 stands" | Pointer to TODAY; steps stay. |
| `BOARD.md` | Archived (section 4), 10-line stub. |
| Project docs `infra/whats-missing`, `release-readiness` | Dated snapshots. `COORDINATION.md:60` mirror duty becomes the TODAY link. |
| Digest #43 and CoS daily run (`agents/roster.json:358`) | Founder closes #43; daily_runs set to 0. |

## 4. CLAIMS.md
Columns: `id | owner session | branch | PR | globs | claimed UTC | expires UTC | note`. No status column: a finished claim is deleted in the PR that merges. Renewal edits `expires`.

Archive: `git mv docs/agents/BOARD.md docs/agents/BOARD-ARCHIVE.md` (history follows), then a stub BOARD.md pointing at CLAIMS.md. Rows 1 to 88 are the retro's count; U, I read table lines 9 to 92. `COORDINATION.md:14-26` then points to CLAIMS.md.

`scripts/agents/board-check.mjs [--repo] [--json] [--sweep]`, modelled on check.mjs. Reads CLAIMS.md (local file or contents API) and `GET /pulls/{n}` per claimed PR via `gh api` or `fetch` with `GITHUB_TOKEN`. Exit 0 clean, 1 findings, 2 unreadable or malformed. Checks:
- C1 claim names a merged or closed PR.
- C2 `expires` earlier than now.
- C3 two live claims overlap (conservative: one literal glob prefix contains the other; false positives accepted).
- C4 over 15 rows, or a row missing a field (exit 2).
CI runs it advisory (`continue-on-error`).

## 5. WIP and stale PRs
Limits: 3 open non-draft PRs per owner label (`agent:<handle>` or `session:<slug>`; U whether session labels exist), 25 open overall. Today 72 open, 19 drafts. Line 13 turns red ("RED: 72 open, limit 25"). No gate, because sessions share an identity (CR-20).

Policy: 14 days without update, the founder may close; branches stay. Sweep of the 18 listed in the retro (created before 18 Oct; `chief-of-staff.md:11`). Edit KEEP first; #112, #164, #167, #168 are harness PRs held to 9 Nov, and #105 targets `main`.
```bash
KEEP="112 164 167 168"; R=thesaurabhpareek/earlyletters
for n in 26 30 32 35 37 40 41 51 53 87 88 89 90 105 112 164 167 168; do
  case " $KEEP " in *" $n "*) continue;; esac
  gh pr close "$n" --repo "$R" --comment "Closing in the 1 Nov stale sweep: no update for 14 days or more, reason: <superseded by #N | not needed | rebuilt later>. Branch kept; reopen if still wanted."
done
```
`board-check.mjs --sweep` prints this loop from live data and never runs it.

## 6. Handoffs
11 open, 8 over 14 days: #154 #155 #156 #187 #196 #197 #198 #216. Rule: answer or close within 7 days. Founder reads each, then `gh issue close N --reason completed|"not planned" --comment "<one-line answer or reason>"`. Which are moot is U.

## 7. Decision propagation
Last check-in line of a session (`COORDINATION.md:21` format): `HH:MM (DD Mon) <agent> | decisions: <D-id or none> given, recorded at <file:line or PR> |`. Line 15 sees only ids cited in PRs; an unrecorded spoken decision is invisible.

## 8. Acceptance tests (fixtures, no network)
- T1 `today.test.mjs`: fixture model renders at most 15 lines; line 1 holds a time and "valid until".
- T2 a fixture PR title with a mention or URL never appears in output.
- T3 now = generated + 7 h renders "STALE".
- T5 `board-check`: claim on a merged PR gives C1, exit 1.
- T6 expiry 1 minute past gives C2; 1 minute future gives none.
- T7 `src/**` against `src/lib/**` gives C3; `docs/**` against `src/**` none.
- T8 row missing `expires` gives exit 2; REST 500 gives exit 2.
- T9 `git rev-parse` of the old BOARD blob equals the archive blob.
- T10 `--sweep` prints the 18 numbers and no `--delete-branch`.

## 9. Cost, failure modes, rollout
Cost: zero. About 8 runs a day, roughly 2 min each, ubuntu, public repo; about 300 API calls a run against a 1,000/h token limit (U).
Failures: cron dropped (validity text); token cannot read protection (line 4); lens format drift (page fails closed); hand edits (next run overwrites); the same work claimed under two names (C3 misses it).
Rollout: (a) now, docs only: CLAIMS.md and archive PR, sweep, handoff close, pointers; (b) CTO ruling plus founder applies `today-page.yml` before 9 Nov if the freeze allows (CR-22), else the first week after; (c) `board-check` CI job with the other workflow patches; (d) line 9 once G1 exists.

Conflicts of interest: I am the chief-of-staff; this design enlarges my digest into the page and I did not build page.mjs or BOARD.md. Figures come from the retro notes; none re-queried live.
