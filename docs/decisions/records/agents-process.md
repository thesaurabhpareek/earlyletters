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
- **Status:** proposed (the ADR header says Proposed); its run protocol is superseded by ADR-0018, which keeps the backlog format and traceability rules in force
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
- **Revisit when:** team: a PR proposes a second roster or operating model (as #76 did); cost: harness spend reaches the OpenRouter key's monthly budget (ADR 0019)
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
- **Revisit when:** cost: no backup storage budget is set (the founder should set one before backup ships); team: review agents pass a PR that later breaks main
- **Review by:** on trigger
- **Status:** amended by D-107: D-107 (founder, 15 Oct, merged 16 Oct) replaces the merge rule. The log records the same three defaults as D-104 with status "Proposed; awaits founder confirmation", while issue #127 item 6 records them as accepted: the founder has to say which stands.
- **As built:** not built (process rule; backup not in v1.0)

### D-090 Release team: a `release` agent; `ops` as Platform and Reliability
- **Source:** `docs/DECISIONS.md` D-090 (Decided, founder, 2026-10-13; recommended 3 Oct); PR #108 (merged 15 Oct 2026)
- **Decided:** a `release` agent (Release Engineer: versions, release records, store metadata as code, the runbook) and `ops` re-chartered as Platform and Reliability Engineer (DevOps and SRE). Defined on the harness branch; until the harness runs, used in interactive sessions by handle under COORDINATION.md. A separate SRE agent after launch, once there are real users and a first Sev 1 or 2 drill.
- **Why:** not recorded in the source
- **Door:** two-way: agent charters
- **Reversal cost:** low
- **Revisit when:** customer: real users and a first Sev 1 or 2 drill (the source's trigger for an SRE agent)
- **Review by:** on trigger
- **Status:** in force: the agent definitions are in open PR #112, not merged
- **As built:** not built on this branch (open PR #112)
- **Also:** R-013

### D-104 Three delivery defaults (proposed)
- **Source:** `docs/DECISIONS.md` D-104 (Proposed by the coordinator, 2026-10-14; awaits founder confirmation); PR #128 (merged 16 Oct 2026)
- **Decided:** not decided. Proposed: (1) the coordinator may merge docs, evidence and test-only PRs after two independent review agents pass them; (2) encrypted recording backup is free for everyone, and Plus does not gate it; (3) voice-only letters follow D-103. Until confirmed, the founder merges every PR, and items 2 and 3 are the spec defaults PRD V2 is written against.
- **Why:** not recorded in the source
- **Door:** one-way after launch: item 2 becomes a pricing promise once backup ships free and is advertised; items 1 and 3 are two-way
- **Reversal cost:** low today; medium once backup ships free
- **Revisit when:** cost: no backup storage budget is set before backup ships; team: the founder confirms or rejects each item
- **Review by:** on trigger
- **Status:** proposed: item 1 is replaced by D-107; items 2 and 3 await the founder's confirmation (issue #127 item 6, recorded as R-007, says they were accepted)
- **As built:** not applicable (a proposal)
- **Also:** related to R-007

### D-107 Merge delegation widened to app code
- **Source:** `docs/DECISIONS.md` D-107 (Decided, founder, 2026-10-15, about 17:00 UTC: "Widen."); PR #128 (merged 16 Oct 2026)
- **Decided:** the coordinator may merge PRs into `develop` that change app code (`apps/mobile`, `packages/*`, `apps/web` content and components), docs or tests, once two independent review agents pass the PR and CI is green on its head. Founder-only merges: `supabase/**`, auth, payments (billing, StoreKit, `packages/core/src/plan.ts`), release configuration (`.github/**`, `apps/mobile/eas.json`, `apps/mobile/app.config.ts`), the CODEOWNERS-protected engine files, and any production deploy.
- **Why:** not recorded in the source
- **Door:** two-way: an internal merge rule
- **Reversal cost:** low: a rule in `docs/agents/COORDINATION.md`
- **Revisit when:** team: a coordinator-merged PR breaks `develop`; team: agents stop acting through the founder's own account (ADR 0026 AF-27)
- **Review by:** on trigger
- **Status:** in force: confirms the delegation part of D-106 and replaces item 1 of D-104
- **As built:** `docs/agents/COORDINATION.md` section 6

### ADR-0021 An engineering compendium owned by five steward agents
- **Source:** `docs/adr/0021-engineering-compendium-and-stewards.md` (status line: Proposed, 2026-10-03; deciders: founder); PR #42 (merged 16 Oct 2026)
- **Decided:** one compendium in `docs/engineering/` (a one-page `PRINCIPLES.md`, ten chapters with stable rule ids, and `ENFORCEMENT.md`); five steward agents own its chapters and review PRs in their paths; stewards set and check, delivery agents build; changing a MUST rule needs the founder.
- **Why:** standards were spread across many documents with about 20 id schemes and no precedence ladder; the 3 Oct architecture review found the same class of bug in several places that a written, enforced standard would have caught; agents on open-weight models follow short, specific, testable rules better than long prose (the ADR's Context).
- **Alternatives:** standards in `CLAUDE.md` (too long for every run); give them to the existing delivery agents (an agent marking its own work); one architecture agent (too broad); a wiki outside the repo (not versioned or loadable).
- **Door:** two-way: internal documents and agent charters
- **Reversal cost:** low: docs and roster entries
- **Revisit when:** cost: the roster's requested runs (50 a day in the ADR) stay above the team cap of 30; team: stewards idle because nothing in their paths changes
- **Review by:** on trigger
- **Status:** proposed: the ADR's status line still reads Proposed although PR #42 merged it on 16 Oct and `docs/agents/OPERATING_MODEL.md` now describes the five stewards; the founder or coordinator should mark it accepted or not
- **As built:** `docs/engineering/PRINCIPLES.md`, `agents/roster.json`, `docs/agents/OPERATING_MODEL.md`

### R-017 Writing for the founder: status and the ask first, numbers over adjectives
- **Source:** PR #212 (merged 17 Oct 2026; relayed by an agent session: "The founder asked on 17 Oct that everything written for them read like an experienced technical and business program manager wrote it"); `docs/agents/COORDINATION.md` section 9
- **Decided:** anything the founder reads (PR descriptions, reports, status updates, the program status sheet, plan docs) leads with status and the ask; every date is On track, At risk or Off track with a one-line reason; numbers, dates, owners and links over adjectives; a list of banned filler words; times in Pacific time with the day; "unverified" when it is; a recommendation and a needed-by date with every decision for the founder.
- **Why:** not recorded in the source
- **Door:** two-way: a writing rule for agents
- **Reversal cost:** low: one section of a doc
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `docs/agents/COORDINATION.md` section 9
