# Commit provenance (RB-13)

Owner: ops. Code: `scripts/agents/provenance.mjs`, tests in `scripts/agents/provenance.test.mjs`.

## What it does

`node scripts/agents/provenance.mjs --since <rev|YYYY-MM-DD> [--ref <ref>] [--json]` reads `git log` and reports, for each commit and in total, whether the message carries the trailers `Agent:`, `Co-Authored-By:` and `Claude-Session:`, and what share of commits are agent-attributed (carry a valid `Agent:` trailer).

- `--since` with a date (`2026-10-19`) uses a time cut-off; anything else is a revision and means `<rev>..<ref>`.
- `--ref` defaults to `HEAD`. Use `origin/develop` to measure the integration branch.
- It is warn-only by design. It always exits 0, prints `WARN:` lines for gaps, and prints a warning instead of failing if git cannot read the log (shallow clone, unknown revision). It never blocks a push or a merge.

## Trailer grammar

Trailers are the `Key: value` lines of the last paragraph of the commit message, and only if every line in that paragraph is a trailer (a line starting with whitespace continues the previous value). Keys are case-insensitive. Empty values do not count. "Agent: ops" in the middle of prose is not a trailer, because counting prose would inflate the share.

| Trailer | Value | Meaning |
|---|---|---|
| `Agent:` | a roster handle, lowercase kebab case (`[a-z][a-z0-9-]*`), as in `agents/roster.json` | The commit was produced by that agent role. This is the only trailer that makes a commit "agent-attributed". A value that is not a handle is reported as malformed and not counted. |
| `Co-Authored-By:` | `Name <email>` | The model that co-authored it. |
| `Claude-Session:` | session URL | Links the commit to the session that produced it. |

Required order on agent commits (AGENT-BRIEF): `Agent:`, then `Co-Authored-By:`, then `Claude-Session:`. The script checks presence, not order.

## Why it matters

We want to measure the agent share of delivery. DORA's finding is that AI-assisted output that is not measured hides instability: faster change with no visible failure rate attached. A share of commits you cannot compute cannot be set against change-failure rate or review churn. `Co-Authored-By:` and `Claude-Session:` say a model was involved; only `Agent:` says which role, which is what per-agent quality and cost need.

## Measured baseline (real numbers)

Measured on `origin/develop` at 6bfb94a9, `--since 2026-10-19`, 28 Oct 2026:

| Trailer | Commits | Share |
|---|---|---|
| total commits | 93 | |
| `Agent:` | 0 | 0% |
| `Co-Authored-By:` | 93 | 100% |
| `Claude-Session:` | 93 | 100% |
| malformed `Agent:` | 0 | |

The claim to verify was "0 of 81 commits carry an `Agent:` trailer". The zero is confirmed, independently by `git log --format=%B | grep -ci '^agent:'` giving 0. The denominator is not 81: it is 93 at this head (the count grows as develop moves, so 81 was likely taken at an earlier head). Develop uses squash merges, so these are the squash commits; trailers on commits inside a PR branch are not visible here, and the squash message does not carry an `Agent:` line either. The 100% on the other two shows the pipeline already adds the model and session trailers; only `Agent:` is missing.

Reproduce: `node scripts/agents/provenance.mjs --since 2026-10-19 --ref origin/develop`.

## Follow-up for the integrator (not part of this task)

1. Add a warn-only CI step (a patch for `.github/workflows/`, which needs independent review and which agents cannot apply): after checkout with `fetch-depth: 0`, run `node scripts/agents/provenance.mjs --since "$(date -u -d '14 days ago' +%F)" --ref HEAD` on pushes to `develop`, and print the output to the job summary. No `continue-on-error` is needed because it exits 0.
2. Make the squash-merge message keep the `Agent:` trailer for `agent:<handle>` PRs (the integrator sets it when squashing), otherwise the share stays 0 even when agents did the work.
3. After a week, record the share on the board next to lane health, and decide a target before anything is ever made blocking.
