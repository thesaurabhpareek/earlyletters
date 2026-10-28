# Task: make the roster and the files that name its handles agree

The working directory holds a slice of the Early Letters agent harness. `agents/roster.json` lists the agents. Each agent is meant to have, under its handle:

- a charter `.claude/agents/<handle>.md` whose `name:` is the handle,
- a memory file `agents/<handle>/MEMORY.md`,
- (for engineering chapters) an `owner:` in `docs/engineering/NN-*.md` that is a roster handle,
- a backlog owner in `docs/BACKLOG.md` (`Owner: ...`) that is listed in the agent's `backlog_owner_names`.

The prose in `docs/release/HARNESS_SETUP.md` also counts the agents and the labels the harness creates: 14 shared labels, plus three labels (`agent:`, `from:`, `to:`) for each agent.

Somewhere these have drifted apart. Find every mismatch and repair it.

Rules:
- `agents/roster.json` is the source of truth. The GitHub labels already exist for exactly its handles. Do not edit it.
- Move or edit the other files to follow the roster. When you rename a charter or a memory directory, keep its content and leave no copy under the old name.
- Do not add or remove an agent to make a count true; fix the count.
- Do not invent owners, handles or numbers.
- Content rules for anything you write: no em dashes, en dashes, curly quotes, ellipsis characters or emoji.
