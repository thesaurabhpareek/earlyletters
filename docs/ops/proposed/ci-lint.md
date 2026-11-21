# Proposal: a report-only lint with a shrink-only baseline (BRIEF CI-LINT; CODE-R02)

Status: proposal, 21 Nov 2026. This pull request adds the checker, its tests and the first baseline. It changes no workflow: agents cannot edit `.github/workflows/`, so the job is proposed text for the founder or Karma to paste.

## Why no ESLint yet

The repo has no ESLint or Prettier today (root and every workspace checked); TypeScript is the only static check, run by the `typecheck` job. Karma approved a lint dependency in principle but asked for the boring option first. So this PR adds no dependency and no lockfile change. The script is plain Node, in the same style as `scripts/guards/pr-size.mjs`.

## What it checks

`node scripts/lint/lint.mjs` reads every tracked `.ts`, `.tsx`, `.mjs` and `.js` file (not `__fixtures__`, `generated` or `scripts/lint/`). Comment-only lines are skipped.

| Rule | Where | Matches |
|---|---|---|
| `no-debugger` | everywhere | a `debugger` statement |
| `no-focused-test` | everywhere | `test.only(`, `it.only(`, `describe.only(`: a focused test silently skips the rest |
| `no-ts-suppress` | everywhere | `@ts-ignore`, `@ts-nocheck` (use `@ts-expect-error` with a reason) |
| `no-eval` | app code | `eval(`, `new Function(` |
| `no-console-in-app` | app code | any `console.*` call: logs must not carry entry text, transcripts or a child name (privacy rules) |

App code is `apps/mobile/src`, `apps/mobile/app` and `packages/*/src`, minus tests. Scripts and tests may print and may use `new Function` (seven test files do today).

Output is the rule, the path and the count only, never the matching line, so nothing in source can reach a CI log.

## The baseline

`docs/ops/lint-baseline.json` holds the allowed count per rule per file. Today: three files, one `console.*` call each (`global-errors.ts`, `build-css.ts`, `build-grain.ts`). The comparison is shrink-only: a count above the baseline, or a finding in a file not listed, is "over"; a count below it prints "shrunk" and the PR lowers the baseline with `--write-baseline`. The job reads the baseline from the BASE branch (the same reason as the size gate: the PR author controls their own copy).

## What the founder or Karma does

1. Merge this PR. The checker does nothing without the job.
2. Paste `docs/ops/proposed/workflows/lint-step.yml` into `ci.yml` under `jobs:` as a new job. It is report-only.
3. After two weeks of reports with no surprises, add `--enforce` to its last line and make `lint` required on the owner's decision.

## ESLint later

When a rule needs a syntax tree (unused variables, hooks rules, import order), add ESLint and typescript-eslint at the root as `devDependencies`, exact pinned versions at least two weeks old, with the lockfile from `npm install`, as one PR with the owner's yes. The baseline file and the report-first approach carry over: run ESLint once, write its per-file counts next to these, shrink only. This is a proposal, not a request in this PR.

## How to verify

- `node --test scripts/lint/lint.test.mjs` (9 tests; also in root `npm test`). Mutant: change `>` to `>=` in `compare` and the equal-count test goes red.
- `node scripts/lint/lint.mjs --enforce` on the tree exits 0 with `0 over, 0 shrunk`. Adding a `debugger;` line to a tracked file makes it exit 1.

## Not verified

The job (never run on GitHub), the checkout action pin copied from `size-gate-step.yml` (its pin was not re-checked), and whether the two-week report period is the right length.

## The way back

Delete the job. The script and baseline do nothing on their own.
