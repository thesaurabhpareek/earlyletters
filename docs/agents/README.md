# The agent team: a guide for the founder

How to run, steer and pause the Early Letters agent team. The rules the agents follow are in `OPERATING_MODEL.md`; the decision is ADR 0014.

## Where to look

| What | Where |
|---|---|
| Who is doing what right now, runs and spend today, what needs you | The issue titled **Agent board** (label `agent-board`) |
| One summary a day | The newest issue labelled `digest` |
| One agent's history and memory | Its journal issue (label `journal`), and `agents/<handle>/MEMORY.md` |
| Work waiting for your review | Pull requests labelled `from:agent`; the red-team verdict is a label |
| The team, caps and models | `agents/roster.json` |

## Steering

- **Tell one agent something:** comment on its journal issue. It reads your comments at the start of its next run and answers in its entry. Only your comments count.
- **Ask Claude anything in GitHub:** write `@claude` in an issue or PR comment.
- **Change priorities:** reorder `docs/BACKLOG.md`, or tell the `product` agent on its journal.
- **Force a task:** Actions, then Agents, then Run workflow, with an agent handle and a backlog id.
- **Approve work:** review and merge the PR. Agents never merge. For `supabase/**` or sign-in changes, also add the `approve-migration` label (D-041).

## Budget and pausing

- **Hard stop:** the monthly spend limit on the Claude Console workspace that holds `ANTHROPIC_API_KEY`.
- **Daily cap:** `limits.max_runs_per_day_total` in `agents/roster.json` (30 by default), plus each agent's `daily_runs`.
- **Pause everything:** set the repository variable `AGENTS_PAUSED` to `true` (Settings, Secrets and variables, Actions, Variables). Delete it or set `false` to resume.

## Adding or changing an agent

Edit `agents/roster.json`, add `.claude/agents/<handle>.md` from `CHARTER_TEMPLATE.md`, add `agents/<handle>/MEMORY.md`, and run `node scripts/agents/check.mjs`. The next dispatcher tick creates its label and journal.

## One-time setup

1. Create a Claude Console workspace for the agents, set its monthly spend limit, create an API key in it, and add it to this repository as the Actions secret `ANTHROPIC_API_KEY`.
2. Keep the Claude GitHub App installed on this repository: agents act as that app.
3. Optional: `node scripts/agents/bootstrap.mjs` creates labels, journals and the board immediately; otherwise the first dispatcher tick does it.
