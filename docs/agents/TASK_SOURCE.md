# One task source

**Status: built, not wired.** `scripts/agents/tasks.mjs` reads `docs/BACKLOG.md` and the PRD V2 work-package tables into one task list and flags open tasks that something already closed. `dispatch.mjs` still reads only the backlog; wiring is the few lines in "Wiring" below, for the dispatcher integrator (A29) or H2. Retro package H6; improvements IMP-19 and IMP-43 in the 28 Oct 2026 retro.

**Ask for the founder.** Which file is the queue is still your call (retro R3-03, "task-source decision"). Recommendation: keep both as inputs through this module and let flags, not hand edits, decide what an agent may take. Needed before any unattended lane is switched back on (after the 5 Nov go/no-go).

## Why
- The dispatcher reads only `docs/BACKLOG.md` (`scripts/agents/dispatch.mjs` line 72, `parseBacklog` in `lib.mjs` line 55). The build streams worked from PRD V2 work packages (`docs/prd/v2/features/F*.md`, section "Work packages"), which the dispatcher could not see.
- So the board offered work that had shipped. BL-342 says `Status: ready` (`docs/BACKLOG.md` line 492) but shipped in #121, merged 15 Oct 2026. BL-440 is `ready` (line 677) with a Done-when that says "while server features are off for v1.0" (line 679); D-100 (`docs/DECISIONS.md` line 623) turned server features on.

## What it reads

| Source | Rows | How |
|---|---|---|
| `docs/BACKLOG.md` | `#### BL-###` blocks | `parseBacklog` from `lib.mjs`, unchanged, so both readers agree. Adds `Done when`. |
| `docs/prd/v2/features/F*.md` | Rows of any table whose first header cell is `WP` | Columns are found by header name, not position, so a column added or moved does not break it. Open PR #239 edits these tables; a test replays that kind of edit. |
| `docs/DECISIONS.md` | `\| D-### \|` rows | Only to find a decision that closes a task in the same clause. |
| Merged PRs | Title, branch, body | From a saved JSON file or read-only `gh` GET calls. Never written. |

Each task becomes `{ id, source, file, line, title, status, statusText, mode, owners, dependsOn, doneWhen, links, paths, flags }`. Work-package status cells are free text, so only the opening words count: "Built" is `built`, "Partly built" or "Partly" is `partly-built`, "Not built" is `not-built`, "Not run" is `not-run`, "Removed" is `removed`. Anything else is `unknown`. `links` holds the BL ids a work package names in its BL or Mode cell. `paths` holds the code-quoted paths in "Owns files", for a path check such as H2's freeze.

A task looks ready when its mode is `agent` and its status is `ready` (backlog) or `not-built`, `partly-built` or `not-run` (work package).

## Flags
A flag says "check before anyone builds this". Only ready-looking tasks are flagged.

| Kind | Fires when | Strength |
|---|---|---|
| `merged-pr` | A merged PR names the id in its title or branch, or in a body sentence that says it implements, ports, ships, closes, fixes, resolves or delivers it | strong |
| `merged-pr` | Any other body mention, or an id that bounds a range ("BL-370 to BL-434", usually the PR that created the tasks) | weak |
| `decision` | A D-### row has the id and a closing word (supersedes, replaces, closes, removes, drops, cancels, done) in the same clause | strong |
| `reversed-premise` | The task still states a premise a decision reversed. Today one row: "on-device v1.0" or "server features off for v1.0", reversed by D-100. The list is `REVERSED_PREMISES` in `tasks.mjs`; add a row after a decision. | strong |
| `linked-task` | A ready BL task is named by a work package that is `built` | weak |

An open work package that names a done BL task is not flagged: work packages are the deltas still owed on top of a BL task (for example WP-F06-02 to WP-F06-05 on top of BL-120).

## Numbers today
Run on Wed 28 Oct 2026 against `develop` at 6bfb94a9, with the 203 merged PRs into `develop` and `main` that `--gh` fetched:
- Backlog: 241 tasks; 83 ready for an agent; 60 of those 83 have a Done-when line.
- Work packages: 301 rows in 21 feature files; 140 ready for an agent. 108 rows have no status the parser can read, mostly because F01, F02, F03, F14, F18, F19, F20 and F21 have no Status column. Those rows are never offered.
- Flags: 31 strong (30 merged PR, 1 reversed premise) on 27 tasks, and 61 weak.
- BL-342 is flagged strong by #121 ("Ported from ... BL-342"). BL-440 is flagged strong by its premise (D-100).
- Strong flags on work packages match what open PR #239 records as built, for example WP-F16-01, WP-F16-13, WP-F16-14 and WP-F16-17 (#138, #208).

Not every strong flag is right. A PR can name a task it only touched. Treat a flag as a reason to check the task's status line, then fix the status line in the same place a human would.

## Run it
```bash
node scripts/agents/tasks.mjs                      # counts, flags without merged PRs
node scripts/agents/tasks.mjs --gh                 # also checks merged PRs (read-only gh GET)
node scripts/agents/tasks.mjs --merged prs.json    # same, from a saved list
node scripts/agents/tasks.mjs --json               # the full list
node --test scripts/agents/tasks.test.mjs
```

## Wiring (not done in this PR)
`dispatch.mjs` is not edited here. The swap is three lines:

```js
import { loadTasks, dispatchView, takenTaskIds } from "./tasks.mjs";
const merged = ghAll(`/repos/${repo}/pulls?state=closed&base=${roster.base_branch}`).filter((p) => p.merged_at);
const tasks = dispatchView(loadTasks({ mergedPRs: merged }));   // replaces parseBacklog(...)
const taken = takenTaskIds(openPRs, tasks.map((t) => t.id));     // replaces takenIds(openPRs)
```

`dispatchView` returns records in the shape `eligibility()` and `queueFor()` in `lib.mjs` already take. A built, removed or superseded work package becomes `done`, so a dependency on it resolves. An open one becomes `ready`. A task with a strong flag becomes `stale`, which `eligibility()` refuses with "status stale". `{ refuse: "any" }` also refuses weak flags; `{ refuse: "none" }` refuses none.

Work packages name owners as streams or roles ("S03", "Core owner"), not roster `backlog_owner_names`, so `queueFor` assigns none of them until the roster maps those names. That is deliberate: nothing new becomes dispatchable by this module alone.

## How it composes with the other harness work
- Diff gates, provenance, handoff SLA and stale checks (another session; A29 wires them): they act on PRs and runs. This module acts before a task is handed out, so the order is task list, then freeze and budget, then the run, then gates.
- H2 freeze: `task.paths` is the input for refusing a frozen work package.
- H3 budget: unchanged; it decides whether a lane may run, this decides what it may take.
- R3-03 backlog truth sweep: use `--gh` output as the list of status lines to check.

## Limits
- Done is read from text. A status cell that says "Built" on a task that is not built is believed (unverified per row).
- `--gh` reads at most 500 closed PRs per base branch (5 pages of 100).
- Decisions are read only from table rows in `docs/DECISIONS.md`.
