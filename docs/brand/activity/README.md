# Activity record: email and brand lane

One JSON line per agent run, so every change can be traced to the agent that made it.

| Field | Meaning |
|---|---|
| `seq` | Order the run was started in this session |
| `agent` | Roster handle the run acted as (`agents/roster.json` on the harness branch): `content`, `design-systems`, `legal`, `security`, `support`, `marketing`, `product`, `red-team` |
| `run` | The harness agent id of the run; use it to look up the run in the session transcript |
| `engine` | Interactive Claude Code subagents spawned by the coordinator session (not dispatcher runs; those are recorded by `scripts/agents/ledger.mjs` from GitHub) |
| `evidence` | The main file or folder the run produced |
| `evidence_last_modified_utc` | When that evidence was last written. Later runs can touch the same files, so this is an upper bound on the run's time, not its start |

Commits from this lane carry `Agent: <handle>` trailers (OPERATING_MODEL section 4) plus an `Agent-Runs:` trailer listing run ids.

Gaps, stated honestly:
- Four round-2 runs (logo designer `held`, typographer `wordmark`, critics `craft` and `production`) stopped on a provider usage limit before returning a run id. Their files exist under `packages/brand/assets/logo/r2/` and `docs/brand/logo-r2/critiques/`, but no run id was recorded.
- Rows 1 to 12 ran before this record existed. Their times come from file evidence, not run logs.

Files: `2026-10-03.jsonl` (43 runs).
