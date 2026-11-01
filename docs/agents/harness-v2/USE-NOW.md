# Harness v2: what every session does, starting now

Written 1 Nov 2026 by Karma's session. One page. Source: the retrospective, requirements and backlog in `docs/agents/harness-v2/` (PR #551). Items marked WAITING depend on a draft PR that is not merged; until it merges, do the manual version.

## Do these today (no PR needed)
1. **Ids come from `node scripts/agents/next-id.mjs`.** Before using a D, CR, BL or ADR number, also search open PRs for it (the CR and D numbers collided three times: CR-22, CR-25, and D-138 versus open PR #557). Example: `gh api 'repos/thesaurabhpareek/earlyletters/pulls?state=open&per_page=100' --jq '.[].number'`, then grep each patch.
2. **A review counts only at the full 40-character head sha** (CR-44). Format: `## Review A at <40-char sha>: PASS` as a PR comment. Re-check the head sha right before you merge. If it moved, the review is stale.
3. **One merge owner per PR.** A chat "approved" is not a counted pass. Name the PR when you ask the founder to merge.
4. **Read counts live, never from a doc or memory.** Open PR count was 69, 70, 72 and 91 within one day in four different notes. Quote the command and the time.
5. **Do not write what you cannot source.** Founder decisions in `docs/DECISIONS.md` quote his words. If you only have a paraphrase, say so (see D-139's draft).
6. **Disk is a fixed allowance.** Use sparse worktrees; never run a full `npm install` per worktree; delete `node_modules` from finished worktrees.
7. **Resolve rebase conflicts hunk by hunk.** Never `git checkout --ours` a whole file; diff the result against both sides before pushing.
8. **A green check is not proof it ran.** Say which suites ran, which skipped, and what you did not run.
9. **Workflow, ruleset and settings changes are proposals** under `docs/ops/proposed/` until the founder applies them (CR-22, D-124). No `.github/**` edits before 9 Nov.

## WAITING on a draft PR (do the manual version until it merges)
| When merged | What changes | Manual version today |
|---|---|---|
| #564 (merge commit, not squash) | Live claims move to `docs/agents/CLAIMS.md`; `BOARD.md` becomes a stub | Claim in `BOARD.md` as `COORDINATION.md` section 2 says |
| #559 | Review gate counts reviews at the exact sha | Count by eye per item 2 |
| #565 | One generated founder status page | Read `FOUNDER_QUEUE.md` and treat its status line as dated |
| #566 | Skip guard | State skipped suites in the PR |
| #577 | Decisions checker (Amended by, id collisions) | Item 1 |
| #558 | Build checklist and log | `docs/release/TESTFLIGHT.md` |
| #560 | Device evidence kit | None; no device evidence exists yet |
| #555 | CR-43 and CR-44 in the repo rulings file | Project doc `infra/cto-rulings-2026-11-01-karma-harness-v2.md` and CR-44 text |

## Still true limits
- Every review comes from one account and one model family. Independence is of method only (CR-32).
- Agents never merge, never mark ready, never edit `docs/DECISIONS.md` or `docs/legal/**` without the founder's words and path.
- After the 9 Nov go/no-go the next phase is the enforcement scripts (B27), `ACCEPTANCE.md` (B28), Maestro test ids (B29) and `trace --check` in CI (B31, blocked on five undefined sub-ids).
