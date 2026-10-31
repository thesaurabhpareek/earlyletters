# agents

The agent team. One folder per agent, holding that agent's long-term memory. The roster is `roster.json`.

## What is in it

| Path | What |
|---|---|
| `roster.json` | The team: handles, engines, models, caps and departments. The dispatcher reads it on every tick |
| `<handle>/MEMORY.md` | One agent's curated memory (for example `mobile`, `security`, `sync`) |

An agent's identity is `.claude/agents/<handle>.md`. In an interactive session, ask for one by handle ("use the mobile agent").

## Commands

There are no tests in this folder. The harness scripts live in `scripts/agents/`.

```bash
node scripts/agents/check.mjs    # every roster agent has a charter and a memory file
```

## Rules

How it works: `../docs/agents/HARNESS.md`. Rules during a run: `../docs/agents/OPERATING_MODEL.md`. Read `../docs/agents/COORDINATION.md` before working. Decisions: `../docs/adr/0018-agent-operating-system.md` and `../docs/adr/0019-open-weight-models-by-default.md`.

## Do not

- Do not let an agent merge, or push to `develop` or `main`. Agents open PRs labelled `agent:<handle>`.
- Do not append to a memory file forever. Replace stale lines.
- Do not put real family details in memory. Use the fictional family "Asha".
