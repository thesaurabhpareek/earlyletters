# ADR 0016: Agents talk through handoff issues; standards stewards review by path; only trusted authors count

- **Status:** Proposed, 2026-10-03 (founder asked for agents that do not work in silos, with every action logged).
- **Deciders:** founder.
- **Amends:** ADR 0014 (dispatcher priorities and modes). ADR 0015 is unchanged.
- **Related:** `docs/agents/AGENT-COMMS.md`, `scripts/agents/{handoff,ledger,dispatch,brief,lib}.mjs`, `docs/engineering/` (the compendium the stewards own).

## Context

Nineteen agents each own exclusive paths. Until now, the only way to need something from another agent was a line in a journal or PR body that nobody was scheduled to read, so cross-cutting work (a schema change that needs a privacy decision, an API rule that needs a security review) stalled or was done by the wrong agent. The founder also asked for engineering standards owned by five steward agents and applied to all future work, and for a full record of what agents do.

A review of the harness on the same day found that the dispatcher counted a `red-team:<sha>` verdict from any GitHub user, and the brief builder passed such comments into agent briefs. On a public repository that lets anyone fake a review or plant text in an agent's context (OWASP LLM01, prompt injection).

## Decision

1. **Handoffs are GitHub issues** labelled `handoff`, `from:<sender>` and `to:<recipient>`, with a one-line machine marker. Recipients reply with a marked comment and a status. An RFC is a handoff of kind `rfc` sent to every other steward. No new store: GitHub stays the single system of record (ADR 0014).
2. **The dispatcher schedules replies** ahead of reviews and backlog work, counts waiting handoffs per agent on the board, and closes a handoff 48 hours after every recipient has replied.
3. **A new agent kind, `steward`,** with `review_paths` globs in the roster. The dispatcher assigns a `steward-review` when an open, non-draft PR touches those paths and has no verdict from that steward for its head commit. A steward's "fix first" sends the author agent into `maintain` mode, like the red team's.
4. **Trust.** Markers count only from the founder, the agents GitHub App (by client id or bot login) or bots listed in `trusted_bots`. Untrusted comments are never shown in briefs as instructions and never change state. This also applies to red-team verdicts from now on.
5. **The ledger** (`scripts/agents/ledger.mjs`) rebuilds one JSON line per agent event from GitHub: journal entries, receipts, handoffs, replies and reviews.

## Alternatives considered

| Option | Why not |
|---|---|
| Comments on journal issues addressed with `@handle` | No per-recipient state; a journal mixes the agent's own record with other agents' requests; hard to tell what is still waiting. |
| A shared "engineering council" issue for everything | One long thread becomes unreadable and expensive to load into context; no per-request lifecycle. |
| A separate message bus or database | A second system of record outside GitHub, with its own access control and backups, for a team of agents that already lives in GitHub. |
| GitHub Discussions | Not reachable through the same REST calls and labels the dispatcher already uses; weaker filtering by recipient. |

## Consequences

- More labels (two per agent) and one REST call per open handoff per dispatcher tick. At the team's scale (tens of open handoffs at most) this is well inside rate limits.
- All OpenCode agents share one App identity, so the `from:` in a marker is declared, not proven (PINF-02). Accepted for now; one App per agent would fix it at a setup cost.
- Agents must use `handoff.mjs` (or write the markers exactly). The tests in `scripts/agents/lib.test.mjs` cover parsing, trust, pending state, settling and the ledger.
- The founder sets one more repository variable, `AGENTS_BOT_LOGINS` (HARNESS section 12).
