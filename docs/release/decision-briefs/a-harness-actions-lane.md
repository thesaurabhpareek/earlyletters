# Brief (a): how and when to turn on the rebuilt harness

Status: open, not decided. The question is no longer whether to keep the harness but when unattended runs start. Needed by Thu 5 Nov (proposed go/no-go). Brief (b) depends on this one.
Default if unanswered: the rebuild packages proceed, and unattended runs stay off, because `agents.yml` is unregistered and `AGENTS_ENABLED` is unset.
Conflict of interest: the session that commissioned this brief built the harness.

## Founder's stated position (28 Oct 2026, as relayed by the coordinator; not a D-id)
"I don't see why we should retire the harness. There is a lot of value we can create by a strong harness." Then: "let's do everything that a strong harness needs that would help me build stronger apps". The coordinator records any D-id.

## Evidence of what failed
- The default branch is `main` (GitHub API, 28 Oct). The workflows API lists 14 workflows; `agents.yml` is not one of them, so its schedule ([agents.yml:21](../../../.github/workflows/agents.yml#L21)) has never fired. Once registered, every tick still skips unless `vars.AGENTS_ENABLED == 'true'` ([agents.yml:42](../../../.github/workflows/agents.yml#L42)).
- `agents/roster.json` lists 24 agents; 4 carry `paused_until`. The retro panels report 13 never ran (retro IMP-11; not rechecked here).
- The 4-hourly scheduled lane left no journal entry in four weeks (retro spot-check 23). Its prompt still cites #127 (retro spot-check 7). The task, and the PRD daily task, were disabled 28 Oct 06:05 UTC; the docs run at 05:30 UTC (retro reviewer's read of the task list; not rechecked here). Their connectors are a separate step (Wave 0 item 1).
- Agents post through the founder's account, so trust checks cannot tell an agent from the founder (retro IMP-06; unverified here).
- `develop` has no branch protection and no required checks (retro spot-check 3); the scheduled tasks carry write-capable connectors (retro spot-check 12).

## Rebuild packages (none turns an unattended lane on)
- H1: a GitHub App identity for agents, with trust rules that tell agent posts from founder posts.
- H2: freezes, honest board status and "no trace" runs enforced in the dispatcher, not prompt text.
- H3: one usage budget across lanes, with a reserved share for build work.
- H4: an offline end-to-end lane test plus a read-only start-of-run smoke check.
- H5: charters and memories aligned with D-100 to D-119, with a charter lint.
- H6: one task source that reads the backlog and the PRD V2 work packages.
- H7: briefs that carry each agent's memory, lessons and new D-ids.
- H8: interactive orchestration (claim, two lens reviews, merge train) written down as part of the harness.

## Options (when unattended runs start)
| Option | What it takes | Cost or risk |
|---|---|---|
| 1. After four preconditions | Branch protection with required checks on `develop` and `main` (Wave 0 item 8); the GitHub App identity (H1); write connectors removed from scheduled tasks (Wave 0 item 1); and the 5 Nov go/no-go has passed | Unattended runs start after 5 Nov. The founder's setup is about 1 to 2 hours plus API spend |
| 2. Sooner, before the preconditions | Default branch to `develop`, an API key, `AGENTS_ENABLED=true` now | An unattended lane writes to a public repo as the founder, with no required checks, in freeze week (Tue 3 Nov, 5:00 AM PT); production connectors still attached |
| 3. Interactive orchestration only until H1 to H8 land | Threads keep doing the work as now (H8 writes it down) | No unattended capacity until the rebuild lands; the date depends on H1 to H8 review time |

## Recommendation (a recommendation, not a decision)
Option 1. It gives the founder the strong harness asked for, with its safety checks in code before it runs alone, and keeps the release path clear until the go/no-go.
