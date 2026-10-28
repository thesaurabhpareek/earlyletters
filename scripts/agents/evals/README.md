# Eval runner

Runs the agent eval tasks under `agents/evals/<class>/<task-id>/`. Node 22, no dependencies, no model calls. The engine under test is whatever command you pass to `--candidate`.

Design follows Anthropic's [Demystifying evals for AI agents](https://anthropic.com/engineering/demystifying-evals-for-ai-agents): code-based graders, a clean environment per trial, pass@k and pass^k, a grader may say "unknown", and 0 percent on many trials is treated as a suspected broken task or grader.

## Task layout

```
agents/evals/<class>/<task-id>/
  task.md      the brief the agent under test receives
  fixture/     starting files (copied fresh for every trial)
  grader.mjs   export function grade({ workdir }) -> { pass, reason, unknown? }
  reference/   files overlaid on a copy of fixture/ to prove the task is solvable
  meta.json    { "id", "class", "source", "roles", "k" }
```

`meta.id` and `meta.class` must match the directory names. `k` (1 to 50) is the number of trials. Symlinks in `fixture/` or `reference/` are rejected. A task with any problem is reported as malformed; it is never silently skipped.

## Commands

```bash
node scripts/agents/evals/runner.mjs --validate
node scripts/agents/evals/runner.mjs --candidate "node my-engine.mjs" --class writer --k 5
```

| Flag | Meaning |
|---|---|
| `--validate` | Check every task: must FAIL on the raw fixture and PASS with `reference/` applied, on every one of `--validate-trials` repeats (default 3). Exit 1 if any task is broken. |
| `--candidate <cmd>` | Run the candidate on each task for k trials and grade the result. |
| `--root <dir>` | Task root. Default `agents/evals`. |
| `--class <c>`, `--task <id>` | Filter. |
| `--k <n>` | Override `meta.k` for all tasks. |
| `--out <dir>` | Where results go. Default `$TMPDIR/earlyletters-evals`. |
| `--candidate-timeout <s>` (600), `--grader-timeout <s>` (30) | Limits. |
| `--keep` | Keep trial directories for debugging. |

Outputs: `validate.json` and `validate.md`, or `run.json` and `run.md`, in `--out`. Exit codes: 0 ok, 1 broken or malformed tasks, 2 usage error or no tasks found.

## Validate: why a task is "broken"

- passes on the raw fixture (trivially solved, or the grader is too lax)
- fails with the reference applied (unsolvable, or the grader is too strict)
- the grader returns different verdicts for identical input (flaky)
- the grader returns `unknown`, throws, times out or returns a malformed result
- malformed task directory or `meta.json`

## Candidate contract

The command is run through the shell as `<cmd> '<task.md path>' '<workdir>'`, with the workdir as its working directory, and these environment variables: `EVAL_TASK_MD`, `EVAL_WORKDIR`, `EVAL_TASK_ID`, `EVAL_CLASS`, `EVAL_TRIAL` (1-based), `EVAL_K`. It is expected to edit files inside the workdir. The workdir holds only a copy of `fixture/`; `grader.mjs`, `reference/` and `meta.json` are not in the trial directory. The grader runs afterwards on whatever state the workdir is in, even if the command exited non-zero or timed out (outcome, not process, is graded; the exit code is recorded in `run.json`).

## Grader contract

`grader.mjs` exports `grade({ workdir })`, sync or async, returning:

```js
{ pass: true | false, reason: "short text", unknown?: true }
```

- Grade the outcome (files in `workdir`), not the steps taken.
- `unknown: true` means "I cannot decide" (for example the evidence is ambiguous). `pass` is then ignored. Use it rather than guessing.
- Be deterministic: same files, same verdict. Each grade runs in its own Node process with a timeout, so module state cannot carry over and a crash cannot take down the runner. A throw, a timeout or a result of the wrong shape is an `error` outcome.
- Do not read outside `workdir` and do not write to it. Keep `reason` free of entry text and child names.

## Metrics

Per trial the outcome is `pass`, `fail`, `unknown` or `error`. Per task, from its k trials:

- pass@1: passes divided by determinate trials (pass + fail); n/a if none.
- pass@k: yes if at least one trial passed.
- pass^k: yes only if every trial passed (reliability).
- unknown and error trials are counted on their own and never as pass or fail. If they decide whether pass@k or pass^k is yes or no, the metric is reported as `unresolved`.
- A task with 3 or more fails, no passes and nothing undetermined gets the flag `all-fail-check-task-and-grader`: look at the task and grader before blaming the candidate.

Per class: pass@1 is the mean of the task pass@1 values; pass@k and pass^k are the share of tasks with yes among tasks where the metric is determined; unresolved tasks are counted.

## Limits

- Trials run one after another. No sandboxing beyond a fresh temp directory: the candidate command runs with your environment and can touch anything your user can. Run untrusted engines in a container.
- `reference/` is an overlay; it can add or replace files, not delete them.
- Tests: `node --test scripts/agents/evals/runner.test.mjs`. The toy tasks under `test-fixtures/` include one sound task, one trivially passing (broken) task, one flaky grader and one unknown grader.
