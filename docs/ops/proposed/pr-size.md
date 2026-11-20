# Proposal: PR size job (CODE-R02, gate G8, CODE-G1)

Status: PROPOSED, advisory until pasted. Brief: `docs/engineering/readiness-20nov/briefs/platform/BRIEF-CI-PRSIZE-pr-size-job.md`.

## Founder paste
1. Merge this PR (it adds `scripts/guards/pr-size.mjs`, its test, and the root `test` entry). The workflow reads the script from the base branch, so the script must be on `develop` first.
2. Copy `docs/ops/proposed/workflows/pr-size.yml` to `.github/workflows/pr-size.yml` in a PR into `develop`. No edits, no secrets, no sha to check (the checkout sha is the one `ci.yml` already pins).
3. Leave it advisory (not a required check) for a week. Then, if you want it blocking, Settings, Rules, `develop`, add the required check `pr size`.
4. Size exceptions: you apply the label `size:accepted` yourself and the PR body carries `Size exception: <reason>`. Both are needed.

## Way back
Delete `.github/workflows/pr-size.yml` (or remove `pr size` from the required checks, one click, then disable the workflow). Nothing else depends on it. The script and test can stay.

## What it counts
`git diff -M --numstat origin/develop...<head sha>`. Binary files count 0, a rename counts only the changed lines. Output on every PR: `lines 312 / 400, files 11 / 20`.
Not counted: `package-lock.json`, any `generated/` folder, `*.generated.ts`, images under `docs/` (all uncapped). Fixtures and golden data are counted only if on the list (`__fixtures__/` folders and the six folders in `EXCLUDED_DIRS`), and together they are capped at 2,000 lines. Docs text, tests and every other fixture folder count.

## Limits (honest)
- Every Claude session posts as the founder's one GitHub account (see `review-gate.yml` header), so the label's actor check cannot tell the founder from a session using his token. It stops an agent token and a collaborator; it is not a security boundary.
- A fork PR cannot read issue events with the default token; forks are not checked.
- Stacked PRs: the workflow only triggers for PRs whose base is `develop`.

## Questions for cto
- Question for cto: the brief asks that a 3,000 line lockfile change passes and that excluded lines are capped at 2,000. Both cannot hold for the lockfile, so I capped only the hand-written exclusions (fixtures, golden) and left lockfile, generated files and doc images uncapped. Confirm.
- Question for cto: may a valid exception also lift the 2,000 line fixture cap? Implemented: yes.
- Question for cto: should stacked PRs (base is another feature branch) be measured against their stack base? Not covered; the trigger is `develop` only. Measured against `develop`, #840 reads 3,994 lines, not 342.
- Question for cto: the founder's proof rule (label by the owner plus the body line) is the brief's recommendation, not a decision. Who else, if anyone, may grant an exception?
