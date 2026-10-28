# Usage budget across lanes (owner: ai-eng-lead)

Status, 28 Oct 2026: built and tested, **not wired**. Nothing calls it yet, and it turns no lane on.
Code: `scripts/agents/budget.mjs`. Config: `agents/budget.json`. Tests: `scripts/agents/budget.test.mjs` (fixtures, no network).
Retro package H3; rule AIE-R28 (lane budgets, listed as missing in the retro); root cause RC7.

## Why

- One subscription is shared by the interactive threads and six scheduled tasks, with no budget or priority (retro panel 06, P7; `scheduled-tasks.md` in the retro evidence).
- Runs stopped on a usage limit on 3 Oct (commit 9be06dbe, "interrupted by usage limit"), 15 Oct (agent lane) and 27 Oct (docs run 13:06 UTC and PRD run 13:31 UTC, both USAGE_LIMIT_REACHED).
- The work paused from Sat 24 Oct, 5:10 AM PT to Tue 27 Oct, 1:00 PM PT on a usage limit (`docs/qa/ALPHA_GO_NO_GO.md` line 5). The nightly kill runs for 25 and 26 Oct did not happen.
- Retro panel 02, finding 6: "Budget usage so the build thread is never the lane that hits the limit."

## What it does

`canRun(lane, { config, usage, now })` answers: may this lane start one more run today?

1. A lane not named in `agents/budget.json` has no budget and may not run.
2. A lane marked `interactive` (the founder-led build threads) is never blocked.
3. A scheduled lane is blocked when any of these is reached, checked in this order:
   - any of its own runs today has **unknown cost** (see below);
   - any run in the scheduled pool today has unknown cost;
   - its own daily `runs` or `cost_usd` cap;
   - the **scheduled pool**: all scheduled lanes together may use `daily_total` times `(1 - reserved_interactive_share)`. The rest is kept for interactive work;
   - the **daily total**, interactive runs included: if the build thread runs past its share, scheduled lanes yield for the rest of the day. Interactive work never yields to them.
4. Days are UTC, as on the board (`todayUTC` in `lib.mjs`).

The reason string says which cap was hit, with numbers, for example
`scheduled lanes: 15 of 15 runs used today; the other 50% is kept for interactive build work`.

### Unknown cost is over budget

A receipt with `cost:unknown`, or an older one that wrote `0.0000` with "cost not reported", is counted as a run with unknown cost (the same rule as `spendToday` in `dispatch.mjs`). The budget cannot tell how much of the shared limit such a run used, so it fails closed: that lane, and every scheduled lane while the pool holds such a run, may not run again that UTC day.

Consequence to know: a lane whose engine never reports cost gets at most one run a day. That is intended while unattended runs stay off. The fix is a receipt that carries cost, not a looser budget.

## Where consumption comes from

Only run receipts, in the existing format (`scripts/agents/receipt.mjs`):

```
<!-- receipt run:<run id> agent:<handle> cost:<usd>|unknown -->
```

They are parsed by `ledger.mjs` (`ledgerRow`), so trust rules match the ledger: the founder, trusted bots, and `github-actions[bot]` for receipts. A fake receipt from anyone else is ignored. Each run id and agent pair counts once.

A receipt names a run, not a lane, so the lane comes from the run id (`laneOfRun`):

| Run id | Lane |
|---|---|
| all digits (a `GITHUB_RUN_ID`, as `agents.yml` passes it) | `actions` |
| `local` or `local-<n>` (receipt.mjs and dispatch.mjs defaults) | `local` |
| `<lane>~<anything>`, for example `docs-daily~2026-10-28` | that lane, if configured |
| anything else | unattributed: counts against the pool and the daily total, no single lane |

`~` cannot appear in a lane name (`lane.mjs` cleans names to `[A-Za-z0-9._-]`), so the split is unambiguous. No receipt format change is needed: `receipt.mjs` already takes `--run-id`.

Limits, stated plainly:
- Today only `agents.yml` calls `receipt.mjs` (`.github/workflows/agents.yml` line 208), and that workflow has never run (retro EVIDENCE.md). Scheduled tasks and interactive threads post no receipts that I could find, so the budget sees none of their use until they post a receipt with a `<lane>~` run id. Unverified: whether any scheduled prompt posts receipts.
- The subscription's own usage limit is not visible to the repo. Run counts and estimated cost are a proxy for it, not a measure.

## Config: `agents/budget.json`

| Key | Meaning |
|---|---|
| `daily_total` | `{ runs, cost_usd }` for all lanes in one UTC day |
| `reserved_interactive_share` | 0 to 1; the part of `daily_total` scheduled lanes may never use |
| `lanes.<name>` | `{ runs, cost_usd }`, or `{ interactive: true }` |
| `profiles.<name>` | overrides: `reserved_interactive_share` and per-lane `{ runs, cost_usd }` |
| `profile_windows` | `{ profile, from, until, reason, decided_by }`; active from 00:00 UTC on `from` until 00:00 UTC on `until`; `decided_by` must be a D-id |

The committed numbers are **proposed defaults, not a founder decision**:
- `daily_total.runs` 30 equals `limits.max_runs_per_day_total` in `agents/roster.json`; a test keeps the budget at or under it.
- `daily_total.cost_usd` 60 is 30 runs at the opencode `default_budget_usd` of 2 (`agents/roster.json`).
- Reserve 50%. Lanes: `actions` 12 runs and $24, `local` 6 runs and $12 (the 4-hourly lane runs 6 times a day per the retro's scheduled-tasks list), `docs-daily` and `prd-daily` 1 run and $4 each.
- `freeze-week` profile: reserve 80%, `actions` 4 runs, `local` 2 runs, docs and PRD lanes 0.
- `profile_windows` is empty. The freeze is proposed for Tue 3 Nov, 5:00 AM PT (`docs/qa/ALPHA_GO_NO_GO.md` line 7) and not confirmed, so no window is set. When the founder records the date, add a window with its D-id.

The 4-hourly scheduled lane's actual `AGENTS_LANE` value is unverified; if it sets one, that name must be added under `lanes`, or the lane is refused as unbudgeted.

## Wiring into `dispatch.mjs` (for the integrator, A29)

`dispatch.mjs` is not edited here (H2 owns it). `blockedReason(ctx, agent, work)` has the same contract as `pause.blockedReason`, so the wiring is one import and one line. Put the line last, just before `const a = {` (after the team-limit check), so an empty answer means the run is assigned:

```js
import * as budget from "./budget.mjs";
// ...
  const budgetWhy = budget.blockedReason(hctx(), agent, work);
  if (budgetWhy) { row.now = `idle: ${budgetWhy}`; continue; }
```

What it does with `ctx` (`hctx()` already carries all of it): the lane comes from `LOCAL` and `env.AGENTS_LANE` by the same rule as `lane.laneName`; receipts are read once per tick with `ctx.ghAll` (one GET of today's issue comments, the same call `spendToday` makes); runs it approves in the tick count as pending until their receipts exist. A missing or invalid `agents/budget.json` blocks every run with the reason.

How it composes with the other packages:
- H2 `freeze.mjs` refuses work on frozen **paths**; this module refuses runs over **usage**. They are independent checks; order does not matter, but budget goes last because it counts what it approves.
- The other session's `gates`, `provenance`, `sla` and `stale` modules (wired by A29) judge a run's content or age, not its cost; no shared state.
- `pause.blockedReason` stays as is: a paused agent is idle before the budget is asked.
- H4 `smoke.mjs` can run `node scripts/agents/budget.mjs --check` to prove the file parses.

## Command line (read-only)

```bash
node scripts/agents/budget.mjs --check               # validate agents/budget.json; no network
node scripts/agents/budget.mjs --lane local          # exit 0 may run, 3 may not; reads today's receipts (GET only)
node scripts/agents/budget.mjs --lane local --json   # the verdict plus usage per lane
node scripts/agents/budget.mjs --lane local --profile freeze-week
```

A scheduled prompt can call `--lane <name>` as its first step and stop when the exit code is 3.
