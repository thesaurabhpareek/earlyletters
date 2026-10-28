# Robustness integration (RB-29)

Joins four modules to the dispatcher. Code: `scripts/agents/robustness.mjs` (hooks), four call sites in `scripts/agents/dispatch.mjs`. Tests: `dispatch.test.mjs` (runs dispatch.mjs against a fake `gh`), `robustness.test.mjs`.
Inputs, built separately: `gates.mjs` (RB-06), `provenance.mjs` (RB-13), `sla.mjs` (RB-17), `stale.mjs` (RB-18); their own notes sit beside this one.

## Switches

Read from the dispatcher's environment. Unset or unknown means the first value, which is the safest.

| Variable | Values (default first) | Effect |
|---|---|---|
| `AGENTS_GATES` | `warn`, `off`, `enforce` | `warn`: board lists agent PRs with an emptied, deleted, shrunk, renamed-over or binary file. `enforce`: also sends the PR's agent to `maintain` mode and keeps the PR from red-team assignment and from "ready for your review". `off`: nothing. |
| `AGENTS_PROVENANCE` | `warn`, `off` | Board lists agent PR commits with no `Agent:` trailer, another agent's handle, or no Co-Authored-By or Claude-Session. Merge commits are skipped. Never blocks. |
| `AGENTS_SLA` | `report`, `off` | Board counts handoffs ok, escalate (5 days) and expire (14 days) and lists the late ones. Comments and closes nothing. |
| `AGENTS_STALE` | `report`, `off` | Board summarises the stale plan (14/21/30 days, a proposal awaiting the founder). Labels and closes nothing. |
| `AGENTS_STALE_HELD` | list of PR numbers | PRs exempt from the stale plan (today #109, #110, #112 per RB-18). |

Waivers for the diff gate: `docs/agents/hardening/diff-allow.json`, an array of `{ path, reason, flags? }` (rules in `diff-sanity.md`). It is read from the checkout, so only a merged change adds one. Absent means no waivers.

Dry run: `node scripts/agents/dispatch.mjs --dry-run --local --board-only` prints the board, including the "Robustness checks" section, and makes no GitHub write. It still reads GitHub (open PRs, files, commits, handoffs) through `gh`; "without touching GitHub" here means no writes. Tested: only GET calls.

## Where each module runs

| Module | Point in the dispatcher | Cost per tick (not-measured) |
|---|---|---|
| gates | `attentionReasons` (enforce only), `reviewTargets` filter, board | one `pulls/N/files` call per agent PR, cached for the run |
| provenance | board only | one `pulls/N/commits` call per agent PR |
| sla | board only, over the handoffs the dispatcher already loaded | none |
| stale | board only | one `commits/<sha>` call per open PR |

No state is added to the board's `agents-state`, so the size cap is untouched.

## Failure behaviour

A hook that throws is skipped and named on the board; the dispatcher continues. If the files call fails, the gate sees no files and passes the PR (fail open, indistinguishable from an empty diff through `ghAll`), so enforce mode is only as reliable as the API. Diffs over 100 files read one page only. `baseLines` is not supplied, so `shrunk` never fires from the dispatcher; `emptied` (patch `+0,0`), `deleted`, `binary`, `mass_delete` and the rename fallback do. GitHub omits `patch` on very large diffs, which also hides `emptied`.

## Stale and the 28 Oct backfill

The label backfill set `updated_at` on every open PR between 04:03 and 05:39 UTC on 28 Oct, so `updated_at` alone cannot show quiet time. Two measures, both in `stale.mjs`/`robustness.mjs`:
1. The dispatcher passes `last_activity_at` = the head commit date, which a label sweep cannot move. `ageDays` prefers it.
2. With no commit date and `updated_at` inside the backfill window (04:00 to 05:40 UTC, 28 Oct), the PR is `unknown` until it is 14 days old. After that `updated_at` is a safe lower bound and the rule ends by itself.
Limit: reviews and comments are not activity, so a PR under active discussion with no new commit can still read stale. Report only, so nothing acts on it.

## Turning it on

The defaults need no workflow change. Setting a switch from a repository variable needs a line in the Dispatch step's `env:` of `.github/workflows/agents.yml`; the proposed patch is `docs/ops/proposed/agents-robustness-switches.md` and needs D-041 independent review before merge.
