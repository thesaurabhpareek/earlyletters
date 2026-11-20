## Review B at c7e4b48b66e9b6bf71fb0748c6e2d49da5d0e8d5: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: security, privacy and release safety (SEC-R10, SEC-R11; the proposed workflow; G11-2; the README's residual risk).

Must fix: none.

This head is `c7e4b48b` (12:42), a merge of develop after #897 squash-merged as `450857dc`. I reviewed `2849f55a`. Same change: the patch-id of this PR's diff against develop (`450857dc..c7e4b48b`) equals the patch-id of part 2's own diff at the reviewed head (`307b56b2..2849f55a`), both `a4ccd2db`. Develop's copies of `label-effect.mjs` and its test equal #897's head `307b56b2`, and the four files at `c7e4b48b` equal those at `2849f55a` (empty diffs). The findings below stand unchanged.

Earlier at this PR:
The head moved during review: `391f6024` (11:12) to `2849f55a` (12:25, part 1's fixes merged in, plus "review fixes for the job"). At `391f6024` I had two must-fixes. Both are fixed at this head:
- The job ran the PR's own copy of the guard, so a PR could loosen `CONTENT` or `NETWORK` in the same diff and go green. Now a step checks out the base branch into `$RUNNER_TEMP/base` with `git worktree add --detach` and runs that copy against the PR checkout (`docs/ops/proposed/workflows/label-guard.yml:33-41`). The base copy imports its own `preflight-lib.mjs`, and git runs in the PR checkout, so the diff and the cards are the PR's and the rules are develop's. `LABEL_GUARD.md` says so, and that the job can only run once the guard is on develop.
- SEC-R10: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0`, `runs-on: ubuntu-24.04`. These match the pins on develop (`agents-check.yml:29-30`, `kill-harness.yml:131,145`).
Part 1's must-fixes (renames, quoted paths) are fixed in the script this branch carries; see review-897-B.

## What I checked

- The workflow proposal at both heads, `docs/ops/LABEL_GUARD.md`, the G11-2 code (`labelEffectProblems`) and `main`.
- Cites: 9 of 9 hold. D-124 is the workflows decision on develop; the two pins as above; SEC-R10 and SEC-R11 in `docs/engineering/06-security-engineering.md:51,53`; `preflight-lib.mjs` has only `node:` imports, so "needs no install" holds; the script reads cards with `git ls-tree` and `git show` at `head`; `DECISIONS.md` is read at base; ten existing decisions name the privacy label (review-897-B note 2).
- SEC-R11 and untrusted text: `permissions: contents: read`, no job raises it; `pull_request`, not `pull_request_target`; `persist-credentials: false`; the PR body and base ref reach the shell only through `env:` (`PR_BODY`, `BASE_REF`), and every use of `$BASE_REF` and `$RUNNER_TEMP` is quoted. No `${{ }}` in any `run:`. The script treats the body as data: one regex for D-ids, and it prints only the D-ids it matched. No shell injection, no workflow-command injection (no printed line starts with `::`). Good.
- Privacy: G11-2 prints card file, line and NS id only. No user content anywhere.
- Trigger: `opened, synchronize, reopened, edited` on PRs into develop. Retargeting a stacked PR to develop fires `edited`, so stacks are checked when they land.
- I ran the head's script on my repro repo: renames and non-ASCII names now fail, a quoted name exits 2.
- ASCII only in all four files.

## Findings (notes, most serious first)

1. G11-2 passes when it reads nothing. If `docs/product/prd/` is missing or renamed at the head, `ls-tree` returns nothing and the guard prints "pass (0 card files read)". `show()` returns an empty string on any git error, so an unreadable card also passes. Suggest exit 2 when no card file is read, and let `show` throw for card files. (#906 fixes the unreadable card; the empty folder still passes.)
2. `LABEL_GUARD.md` residual risk now covers moves, split hunks, SDKs outside the app manifest and the base copy. It still leaves out that any of the ten existing privacy-label decisions satisfies the record check, the lexical gaps in review-897-B note 3, and the children narrowing in review-897-B note 1.
3. The workflow file itself still runs from the PR (GitHub reads `pull_request` workflows from the merge commit), so a PR that edits `.github/workflows/label-guard.yml` controls the job. D-124 and the `.github/**` review path cover that today; say it in the residual-risk list once the job is live.
4. The order note is right: on develop G11-2 fails 33 cards, so applying the job before #846 merges turns every PR red.
5. Required-check advice ("after a week green, add `label guard`") is a SEC-R12 founder act. Fine as advice.

## Not verified

- I did not run the workflow; `git worktree add` from `origin/develop` after a `fetch-depth: 0` checkout should work but has not run on a runner.
- I did not run the vitest file; I read CI.
- CI at the head (read 12:53 UTC, head 11 minutes old): every Linux check green and `required` green (tests and content rules, typecheck, database rules, Deno, B-8 seam, migrations, compliance-fence). The macOS "store-profile Release launch" job is still queued; it does not exercise this change.

Reviewer: independent of the author (CR-44).
