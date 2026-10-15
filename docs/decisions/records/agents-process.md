# Agents and process

How work is planned, assigned, reviewed and merged: the backlog, the agent harness, its models and costs, and who may decide or merge what.

### ADR-0011 Requirements and agent workflow: no framework, a traceable `docs/BACKLOG.md`
- **Source:** `docs/adr/0011-requirements-and-agent-workflow.md` (Proposed, 2026-10-02; deciders: founder)
- **Decided:** skip the requirement frameworks; adopt `docs/BACKLOG.md` with requirement-ID traceability (tasks cite IDs, branches and PR titles carry the task ID, test titles start with the requirement ID, a trace script checks every cited ID), with GitHub Issues used only as an intake inbox; an unattended run protocol picks the first ready task.
- **Why:** requirements already exist with stable IDs and every framework wants its own shape; unattended runs need determinism; free and clean licence; maintenance risk in the frameworks; reversible (OpenSpec could be layered on later).
- **Alternatives:** GitHub Spec Kit, BMAD Method, Task Master, Agent OS, OpenSpec (runner-up), CCPM.
- **Door:** two-way: a Markdown file and conventions
- **Reversal cost:** low
- **Revisit when:** scale: more than about 60 open tasks; team: a second engineer joins (both from the ADR; its third trigger, more than one agent in parallel, has fired and led to ADR 0018)
- **Review by:** on trigger
- **Status:** amended by ADR-0018; the run protocol for work selection is superseded; the backlog format and traceability rules stay in force
- **As built:** `docs/BACKLOG.md`; the trace script (BL-002) is in open PR #143

### ADR-0018 Agent operating system: roster of identities, a code dispatcher, Claude Code on GitHub Actions
- **Source:** `docs/adr/0018-agent-operating-system.md` (Accepted, 2026-10-03; deciders: founder; amended the same day by ADR 0019); PR #4 (merged 15 Oct)
- **Decided:** each agent has a handle, charter, memory file, label and journal issue; runs start from a brief and end with a journal entry and a receipt; a plain-code dispatcher assigns work every 30 minutes; per-agent and team-wide caps (30 runs a day, 6 in parallel); the workflow runs only while `AGENTS_ENABLED` is true; agents never merge, approve or push to `develop` or `main`; only the founder's comments count as instructions.
- **Why:** the founder wants a large cross-functional team working continuously, organised in GitHub; one place to see and steer it; every run auditable and costed.
- **Alternatives:** third-party control planes (Paperclip, Multica, Gas Town, OpenHands); GitHub Agentic Workflows (preview); Claude Code agent teams or routines (experimental).
- **Door:** two-way: internal process; the harness is off unless a variable is set
- **Reversal cost:** low
- **Revisit when:** platform: gh-aw leaves preview and documents Claude Code configuration loading; platform: Paperclip ships GitHub Issues sync (both from the ADR); cost: harness spend passes the key's monthly budget
- **Review by:** on trigger
- **Status:** amended by ADR-0019; ADR 0020 also amends its dispatcher
- **As built:** `agents/roster.json`, `scripts/agents/dispatch.mjs`, `.github/workflows/agents.yml`

### ADR-0019 Open-weight models by default, through OpenCode and OpenRouter
- **Source:** `docs/adr/0019-open-weight-models-by-default.md` (Accepted, 2026-10-03; deciders: founder, "I would not want to burn that amount of money")
- **Decided:** engines are per agent with `opencode` the default; OpenCode pinned to 1.18.34; OpenRouter as the single provider with zero-data-retention routing; DeepSeek V4.1 Flash for every role except the red team, which uses GLM-5.2; a dollar and step cap per run ($2, $3 for the red team); an agents GitHub App as identity.
- **Why:** ADR 0018 modelled out at roughly $420 to $3,400 a month on Claude, too much for this project; open-weight models report agentic coding close to recent Claude versions at a fraction of the price (self-reported).
- **Door:** two-way: one roster field per agent
- **Reversal cost:** low
- **Revisit when:** cost: OpenRouter key spend reaches its monthly budget; technology: receipts show an agent's rework rate is too high on its model; cost: model prices change (the ADR's prices are from 3 Oct 2026)
- **Review by:** 2027-01-15
- **Status:** in force
- **As built:** `scripts/agents/run-opencode.mjs`, `agents/roster.json`

### ADR-0020 Agents talk through handoff issues; stewards review by path; only trusted authors count
- **Source:** `docs/adr/0020-agent-communication-and-stewards.md` (Proposed, 2026-10-03; deciders: founder); PR #39 (merged 15 Oct)
- **Decided:** handoffs are labelled GitHub issues with machine markers; the dispatcher schedules replies first and closes a handoff 48 hours after all replies; a `steward` agent kind reviews PRs touching its paths; markers count only from the founder, the agents App or listed bots; a ledger rebuilds one JSON line per agent event.
- **Why:** agents worked in silos; a harness review found the dispatcher counted a red-team verdict from any GitHub user, which on a public repository lets anyone fake a review or plant text in a brief (OWASP LLM01).
- **Alternatives:** `@handle` comments on journals; one council issue; a separate message bus; GitHub Discussions.
- **Door:** two-way: internal process
- **Reversal cost:** low
- **Revisit when:** team: per-agent identities become worth the setup cost (all OpenCode agents share one App, so `from:` is declared, not proven)
- **Review by:** on trigger
- **Status:** proposed: the ADR header says Proposed, though PR #39 implementing it is merged
- **As built:** `scripts/agents/handoff.mjs`, `scripts/agents/ledger.mjs`, `docs/agents/AGENT-COMMS.md`

### D-070 Insights loop agents never push
- **Source:** `docs/DECISIONS.md` D-070 (Decided, coordinator, 2026-10-03)
- **Decided:** the weekly insights agent writes its report and proposals into the repo working tree only; the coordinator commits them. This resolves DEBATES Q-007 in favour of COORDINATION.md.
- **Why:** not recorded in the source beyond DEBATES Q-007
- **Door:** two-way: process
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `scripts/insights`; `docs/agents/COORDINATION.md` section 6

### R-005 One agent harness: the PR #4 stack
- **Source:** issue #127 item 4 (founder-delegated, 14 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (item 5)
- **Decided:** the #4 stack (#4, #39, #42) is the one harness. #76's planner (scripts/plan.mjs, not on this branch) may land as a tool; its separate roster and operating model do not land. #112's `release` agent goes on #42 after its red-team findings are fixed.
- **Why:** two operating models would give agents conflicting rules. The source notes a conflict of interest: the session making the call wrote #4.
- **Door:** two-way: internal process
- **Reversal cost:** low
- **Revisit when:** team: the founder reviews the harness after its first weeks of runs
- **Review by:** on trigger
- **Status:** in force
- **As built:** `agents/roster.json`, `docs/agents/OPERATING_MODEL.md`, `scripts/agents/dispatch.mjs`

### R-006 Close the overtaken agent PRs
- **Source:** issue #127 item 5 (founder-delegated, 14 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (item 6 and the platform thread's 15 Oct update)
- **Decided:** close #45 and #47 (backlog) and #44 (CI snapshot); close #53 once its 9 missing questions are handed to #81's `COUNSEL_PACKET.md`.
- **Why:** the reviews of 13 and 14 Oct found nothing unique left in them (#127).
- **Door:** two-way: closed PRs can be reopened and their branches are kept
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force: #44, #45 and #47 are closed; #53 is still open
- **As built:** not applicable (GitHub state)

### R-007 PRD V2's three defaults accepted
- **Source:** issue #127 item 6 (founder-delegated, 14 Oct 2026); Project doc `product/prd-v2-summary.md` (the three defaults as written)
- **Decided:** the coordinator may merge docs, evidence and test-only PRs that two independent review agents have passed; recording backup is free for everyone when it ships; a voice-only letter counts toward the free letters only once its words exist and it is kept.
- **Why:** they reduce the merge bottleneck (12 merges a week is the plan's limiting factor) and match D-082 and D-083 (#127).
- **Door:** one-way after launch: "backup is free for everyone" becomes a pricing promise once backup ships and is advertised; the merge rule is two-way
- **Reversal cost:** low today; medium after backup ships free
- **Revisit when:** cost: backup storage per family passes the founder's budget; team: review agents pass a PR that later breaks main
- **Review by:** on trigger
- **Status:** in force: open PR #128 also records a wider merge delegation (D-107, "Widen.", 15 Oct), not merged
- **As built:** not built (process rule; backup not in v1.0)

### R-013 Release team: a `release` agent; `ops` as Platform and Reliability
- **Source:** Project doc `infra/release-engineering-plan.md` (D-090, Decided, founder); open PR #108 (D-090 text: "Decided (founder, 13 Oct 2026; recommended 3 Oct)"); founder approval of #108 to #112 on 14 Oct (comment on #108)
- **Decided:** a `release` agent (versions, release records, store metadata as code, the runbook) and `ops` re-chartered as Platform and Reliability Engineer; a separate SRE agent after launch, once there are real users and a first Sev 1 or 2 drill.
- **Why:** not recorded in the sources read
- **Door:** two-way: agent charters
- **Reversal cost:** low
- **Revisit when:** customer: real users and a first Sev 1 or 2 drill (the source's trigger for an SRE agent)
- **Review by:** on trigger
- **Status:** in force: the log entry D-090 is in open PR #108 and the agent in open PR #112, not merged
- **As built:** not built on this branch (open PR #112)
