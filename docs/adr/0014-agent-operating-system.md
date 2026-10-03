# ADR 0014: Agent operating system: a roster of identities, a code dispatcher, and Claude Code on GitHub Actions

- **Status:** Accepted, 2026-10-03 (founder asked for the full setup). Amended the same day by ADR 0015: agents run on open-weight models by default; Claude is optional per agent.
- **Deciders:** founder.
- **Supersedes:** the "Unattended run protocol" in ADR 0011 for work selection; ADR 0011's backlog format and traceability rules stay in force. ADR 0011 said to revisit "when more than one agent runs in parallel"; that is now.
- **Related:** `agents/roster.json`, `docs/agents/OPERATING_MODEL.md`, `.github/workflows/agents.yml`, `scripts/agents/`.

## Context

The founder wants a large, cross-functional team of agents (engineering, product, design, data, decision science, applied science, quality, support, brand, marketing, operations) working continuously, each with an identity and its own context, with nothing sitting idle and the work organized in GitHub. Until now there was one scheduled Claude run every 4 hours reading `docs/BACKLOG.md`.

Options researched on 3 Oct 2026 (sources below):

| Option | Why not, or why |
|---|---|
| Third-party control planes (Paperclip, Multica, Gas Town or Gas City, OpenHands Agent Canvas) | Their own database becomes a second system of record outside GitHub; each needs an always-on server; several default to skipping Claude's permission checks; fast-moving with open bugs in exactly the dispatch and stall paths that matter here. |
| GitHub Agentic Workflows (gh-aw) with the Claude engine | Strong governance model (read-only agent, "safe outputs"), but public preview, API key only, and whether it loads `.claude/agents` and skills is not documented. |
| Claude Code native agent teams or routines | Agent teams are experimental and interactive only; routines are a research preview billed to one subscription. |
| **`anthropics/claude-code-action` driven by a small dispatcher of our own** | Chosen. Anthropic-maintained (MIT, v1), runs the full Claude Code with this repo's `CLAUDE.md`, charters and skills; acts as the Claude GitHub App, so agent PRs are not authored by the founder, run CI, and can be approved by him. Everything lives in GitHub. |

Policy constraint: Anthropic's legal and compliance page says Pro and Max usage limits assume ordinary, individual usage, and that third-party tools may not route requests through subscription credentials. A team of this size therefore runs on an API key from a Claude Console workspace with a spend limit, not on the founder's subscription.

## Decision

1. **Identity.** Each agent has a handle, title and department in `agents/roster.json`; a charter in `.claude/agents/<handle>.md` (also usable as a Claude Code subagent in interactive sessions); a memory file `agents/<handle>/MEMORY.md`; a label `agent:<handle>`; and a journal issue. The roster maps backlog owner roles to agents.
2. **Context.** Each run starts from a brief built by `scripts/agents/brief.mjs`: rules, charter, memory, the agent's last journal entries, any founder comments on its journal since then, and the assignment. Each run ends with a journal entry written by the agent and a receipt (cost, turns, minutes) written by the workflow.
3. **Dispatch.** `scripts/agents/dispatch.mjs` is plain code with no model. Every 30 minutes it gives each free agent its next work in this order: fix its own PRs (failing checks, founder comments, red-team "fix first"), then the next eligible backlog task, then a standing duty from its charter. The red team reviews every agent PR; the chief of staff writes a daily digest. The board issue shows every agent's state, runs and estimated spend.
4. **Limits.** Per-agent daily runs and open-PR limits, a team-wide daily cap (30) and parallelism (6) in the roster; the Console workspace spend limit is the hard stop; `AGENTS_PAUSED=true` stops everything.
5. **Governance.** Agents never merge, approve or push to `develop` or `main`; the Claude GitHub App cannot edit workflows. Branch protection on `develop` and `main` requires the CI checks and one approval, so agent PRs wait for the founder; supabase and auth PRs also need red-team review and the `approve-migration` label (D-041). On this public repository only the founder's comments count as instructions.
6. **Fallback lane.** Until the API key exists, the founder's 4-hourly scheduled Claude task runs one dispatcher assignment per run (`dispatch.mjs --local --top 1 --claim`) on the subscription, which stays within ordinary individual use.

## Consequences

- Positive: one place to see and steer the team (the board, journals, labels, PRs); every run is auditable and costed; any agent can be redirected by a comment on its journal.
- Negative: API spend is real; at the modelled $0.47 to $3.73 per Sonnet session, 30 runs a day is roughly $420 to $3,400 a month before Opus runs. The founder's review time is the throughput limit; the open-PR limits keep it bounded.
- `docs/BACKLOG.md` stays the plan. Running several agents at once raises the odds of conflicts on its status lines; only `product` edits tasks other than its own status line.
- Revisit gh-aw when it leaves preview and documents Claude Code configuration loading; revisit Paperclip if a GitHub Issues sync ships.

## Sources (opened 3 Oct 2026)

- https://github.com/anthropics/claude-code-action (MIT; agent mode; `allowed_bots`; GH_TOKEN set to the Claude App token)
- https://code.claude.com/docs/en/github-actions and https://code.claude.com/docs/en/legal-and-compliance
- https://github.github.com/gh-aw/reference/engines/ and https://github.blog/changelog/2026-06-11-github-agentic-workflows-is-now-in-public-preview
- https://code.claude.com/docs/en/agent-teams and https://code.claude.com/docs/en/routines
- https://github.com/paperclipai/paperclip, https://github.com/multica-ai/multica, https://github.com/gastownhall/gascity, https://github.com/OpenHands/OpenHands
- https://platform.claude.com/docs/en/about-claude/pricing and https://platform.claude.com/docs/en/manage-claude/workspaces
