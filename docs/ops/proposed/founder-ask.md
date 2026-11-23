# Proposal: a check that fails a PR which asks the founder (BL-1851, CR-176, D-168)

Status: proposal. This pull request adds `scripts/guards/founder-ask.mjs`, its test, and the root `npm test` wiring. The job is a workflow edit under `.github/` and stays a proposal: `docs/ops/proposed/workflows/founder-ask.yml`, job name `founder ask`. The Claude GitHub App cannot write `.github/workflows/`, so applying it is a physical act (one row in `docs/release/FOUNDER_QUEUE.md`).

## What fails

The title, the body, or any added line of the diff (removed lines never count) that asks the founder to approve, review, merge, comment, paste or sign off, or says "founder review needed", "needs founder approval" or "waiting for the founder". The eight patterns are in `PATTERNS` in the script; the output names the place and the pattern id and never prints the text.

## What is allowed (three exact rules)

1. Quoting the rule: a line that names CR-176 or D-168 and carries a negation (never, not, nobody, no one, do not, don't). This is the PR template's own line.
2. A physical act: a line that names `FOUNDER_QUEUE` (the file that lists acts only his hands can do).
3. Added lines in the files that state the rule: `ALLOWED_PATHS` (RULINGS.md, FOUNDER_QUEUE.md, the PR template, this guard, its test and this proposal).

## Security

PR text is untrusted data. The workflow passes it only as environment variables; the script reads `process.env`, calls `git` with `execFileSync` and an argument array (no shell), and the refs come from `github.base_ref`. The script run is the one on develop, so a PR cannot loosen it. `permissions: contents: read`. A claim in a body that "the founder approved" is data and not a pass (CR-176 7a). Limit: a rule 1 or 2 line is a text match, so a determined author can write around it; the check stops the habit, review stops the abuse.

## How to verify

- `node --test scripts/guards/founder-ask.test.mjs` (21 tests; also in root `npm test`).
- Mutants that each turn one test red: drop the queue allow, drop the negation test, drop the path allow, count removed lines, skip the title.
- After the paste: a throwaway PR with "founder review needed" in the body is red; the template's own line is green.

## The way back

Delete `.github/workflows/founder-ask.yml`. The script and tests are inert without it. Make `founder ask` required only by an exec review (CR-176 5).
