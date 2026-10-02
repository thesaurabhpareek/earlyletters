# ADR 0011: Requirements and agent workflow: no framework, a traceable docs/BACKLOG.md

- **Status:** Proposed, 2026-10-02.
- **Deciders:** founder.
- **Related:** `CLAUDE.md`, `docs/BACKLOG.md`, `docs/prd/*.md`, `docs/legal/ENGINEERING_REQUIREMENTS.md`, `docs/legal/DELETION_AND_EXPORT_SPEC.md`, `docs/legal/data-policy.md`.

## Context

Early Letters is built almost entirely through Claude Code by a non-engineer founder. Besides interactive sessions, an unattended scheduled run fires every 4 hours: it reads `CLAUDE.md` and `docs/BACKLOG.md`, works on a branch and opens a pull request. Nobody is there to answer questions during that run.

Requirements already exist, with stable IDs, in five places:

| Source | IDs | Count today |
|---|---|---|
| `docs/prd/A-entry-and-auth.md` | `A-REQ-001..035`, `A-NFR-001..014` | 35 + 14 |
| `docs/prd/B-first-run-and-family.md` | `B-REQ-001..025`, `B-NFR-001..010` | 25 + 10 |
| `docs/prd/C-habits-pricing-settings.md` | `C-REQ-001..034`, `C-NFR-001..009` | 34 + 9 |
| `docs/legal/ENGINEERING_REQUIREMENTS.md` | `LEGAL-REQ-001..060` | 60 |
| `docs/legal/DELETION_AND_EXPORT_SPEC.md` (classes in `data-policy.md`) | `DATA-REQ-001..066` (gaps by section) | 55 |

An integrated `PRD.md` is being written in parallel. Decisions live in `docs/adr/`. Each requirement already carries priority (P0/P1/P2) and, for most, Given/When/Then acceptance criteria. LEGAL-REQ is declared to win over a PRD on conflict.

What is missing is the layer between requirements and code: an ordered list of work that a scheduled run can pick from without asking, and a way to prove, for any requirement ID, which task, pull request and test satisfy it.

Constraints for any option: free (no paid API keys beyond the Claude subscription already used), maintained in 2025-2026, works with Claude Code (slash commands, skills, `CLAUDE.md`, subagents), does not force our ~220 existing requirements into a new folder layout or ID scheme, gives ID to task to PR to test traceability, runs unattended, is simple enough for a non-engineer to read, and is easy to leave.

## Options

Evidence was gathered on 2 Oct 2026 by cloning each repository read-only into a scratch folder (nothing installed in this repo) and reading `LICENSE`, `README`, docs and `git tag` dates. The GitHub REST API was not reachable from this session, so star counts and issue counts are **not verified** and are not used.

| Option | License and cost | Maturity and maintenance (observed) | Claude Code support | Fit with our docs | Traceability | Unattended runs | Simplicity for a non-engineer | Lock-in |
|---|---|---|---|---|---|---|---|---|
| **GitHub Spec Kit** [S1] | MIT. Free. Needs Python 3.11+ and `uv` in addition to Node. | Very active: v1.0.8 to v1.0.13 between 17 and 29 Sep 2026; 229 tags; ~1,570 commits in 2026; last commit 1 Oct 2026. | Yes, installs `/speckit-*` skills for many agents. | Poor. Each feature gets `specs/NNN-feature/spec.md` with its own `FR-###` IDs, plus a `constitution.md` that overlaps `CLAUDE.md`. Our PRDs would be duplicated or rewritten into its template. | Spec to plan to tasks inside its folders; a `taskstoissues` command exists. Our IDs are not first-class. | Designed as review-each-step ("review the result before continuing"), with `implement` then `converge` loops. Possible headless but not the intended mode. | Medium. Six to ten commands per feature, two toolchains. | Medium: `.specify/` and `specs/` trees, but plain Markdown. |
| **BMAD Method** [S2] | MIT. Free ("no paywalled workflows"). Needs `uv`. | Active: v6.8.0 (May 2026) to v6.12.0 (4 Sep 2026); 165 tags; commits on 2 Oct 2026. Large version churn (v4 to v6 rewrites). | Yes, Claude Code plugin marketplace and skills. | Poor to medium. Brings its own brief, PRD, architecture and story artifacts and many agent personas; existing docs can be "carried in" but the method expects its own shapes. | Story-level; not keyed to our IDs. | Built around guided, multi-agent conversations with a human; unattended use is off the main path. | Low. Largest surface of all options (personas, modules, hub skill). | Medium to high: process and artifact vocabulary. |
| **Task Master** (`claude-task-master`) [S3] | **MIT plus Commons Clause**: not an OSI open-source license (forbids selling services whose value derives from it). Free to use. Needs an AI provider key, except `claude-code` provider mode. Docs point to the commercial `tryhamster.com`. | **Slowing**: last release `task-master-ai@0.43.1` on 31 Mar 2026; last commit 23 Apr 2026; 46 commits in 2026; pre-1.0. | Yes, MCP server and a `claude-code` model provider. | Medium. Parses a PRD into `.taskmaster/tasks/tasks.json`; tasks do not carry our IDs unless prompted. | Task to subtask; requirement links are free text. | Works headless, but the source of truth is a JSON file plus an MCP server that must be running and configured. | Medium. JSON is hard for the founder to read or edit. | Medium: JSON task store, MCP config, model config. |
| **Agent OS** [S4] | MIT. Free. | Low cadence: v3.0.0 on 20 Jan 2026 (no release since); 10 commits in 2026; last commit 29 Aug 2026. Support community is paid (Builder Methods Pro). | Yes, slash commands. v3 itself defers spec writing to Claude Code plan mode and task tracking to Claude Code's todo lists. | Good (it is mostly about coding standards), but it does not manage requirements or a backlog at all in v3. | None beyond plan files. | Not addressed. | High, but solves a different problem (we already have `CLAUDE.md`, `VOICE.md`, design docs). | Low. |
| **OpenSpec** [S5] | MIT. Free. Node 20.19+. Telemetry **on by default** (opt out with `OPENSPEC_TELEMETRY=0`). | Very active: v1.13.1 to v1.14.0 between 17 and 30 Sep 2026; 56 tags; ~550 commits in 2026. | Yes, `/opsx:*` commands for Claude Code. | Medium. Brownfield-first and delta-based, so it does not demand back-filling, but requirements must live in `openspec/specs/**` as `### Requirement:` blocks, a second home for requirements we already hold. | Change folder holds proposal, delta specs, design and tasks; our IDs only if written in. | Plausible headless (`propose`, `apply`, `archive`); proposals are meant to be reviewed before `apply`. | Medium-high. Best of the frameworks. | Low to medium: plain Markdown, one folder. |
| **CCPM** [S6] | MIT. Free. Needs `gh` CLI. | Low cadence: 8 commits in 2026, last 18 Mar 2026; no tags. | Yes, Agent Skill. | Medium. PRD to epic to GitHub Issues; expects its own PRD files under its folder. | Strong idea (issue per task, PR per issue), weaker in practice: IDs live in Issues, not in the repo. | Parallel agents in worktrees; needs network and GitHub token on every run. | Medium. | Medium: GitHub Issues become the source of truth. |
| **No framework: `docs/BACKLOG.md` with requirement-ID traceability, Issues as intake only** | Free. Uses tools already in the repo (Node, vitest, `gh`). Optional CI on GitHub Actions free minutes; `anthropics/claude-code-action` is MIT [S7] if PR review by Claude is wanted later. | Nothing to maintain upstream. Conventions are ours. | Native: `CLAUDE.md` points to the backlog; scheduled runs already read it. | **Best.** Requirements stay exactly where they are; the backlog only cites IDs. The integrated `PRD.md` slots in without changes. | Explicit: task cites IDs; branch and PR title carry the task ID; PR body lists IDs; test titles start with the ID; a small script checks every cited ID exists and reports coverage. | **Best.** One readable file in git, no server, no extra keys; rules for picking, claiming and stopping are written into the file. | High. One Markdown file the founder can reorder in any editor. | None. |

## Decision

**Skip the frameworks. Adopt a disciplined `docs/BACKLOG.md` with requirement-ID traceability, with GitHub Issues used only as an intake inbox.**

Why:
1. **Our requirements are already the hard part, and they are done well.** Every framework above wants requirements in its own shape and folder (Spec Kit `FR-###`, OpenSpec `### Requirement:`, BMAD stories, Task Master JSON). That means two sources of truth for ~220 IDs, one of which legal and the PRDs do not govern. The gap we have is ordering and traceability, which is a file and a convention, not a framework.
2. **Unattended runs need determinism, not ceremony.** A scheduled run with nobody to answer must find the next task, know what "done" means, and know when to stop. A plain file with explicit status values and rules does this with no running server, no extra API key and no interactive review step.
3. **Free and clean license.** Task Master's Commons Clause and provider-key model, and OpenSpec's default-on telemetry, are small but real costs; none of this applies to a Markdown file.
4. **Maintenance risk.** Two candidates have slowed (Task Master: no commit since April 2026; Agent OS: no release since January 2026, and v3 itself says Claude Code's plan mode and todo lists now cover spec and task work). The active ones (Spec Kit, BMAD, OpenSpec) are changing fast, which is churn we would absorb.
5. **Reversibility.** If the backlog outgrows one file, OpenSpec is the runner-up and could be layered on later because it is brownfield-first and Node-based; nothing in this decision blocks it.

### The workflow

**Sources of truth.** Requirements: the PRD, LEGAL and DATA files (unchanged). Work: `docs/BACKLOG.md`. Decisions: `docs/adr/`. Founder bug reports and ideas: GitHub Issues, triaged into the backlog by the founder (or an interactive session) before any agent acts on them. A scheduled run never works from an Issue that is not in the backlog.

**IDs.** Tasks are `BL-###`, never reused. Epics are `E#`. Requirement IDs are cited exactly as written in their source (`A-REQ-012`, `B-NFR-005`, `LEGAL-REQ-017`, `DATA-REQ-040`). Where the integrated `PRD.md` renumbers anything, it must keep the section IDs as aliases; the backlog keeps citing the original IDs.

**Traceability chain.**
- Task: `Satisfies:` lists requirement IDs.
- Branch: `<type>/<area>-bl-###-<slug>` (extends the `CLAUDE.md` branch rule).
- PR title: `BL-###: <title>`. PR body: `Satisfies: <IDs>`, `Data classes touched:`, `Budgets checked:`, test evidence.
- Tests: the test title starts with the requirement ID in brackets, for example `it('[DATA-REQ-040] raw_sha256 cannot change', ...)`. One test may cite several IDs.
- Check: `scripts/trace.mjs` (task BL-002) fails if the backlog, tests or PR template cite an ID that does not exist in a source document, and writes `docs/TRACE.md` (requirement to tasks to tests, plus P0 IDs with no test). Coverage gaps are reported, not failed, until launch hardening.

**Unattended run protocol** (also written at the top of `BACKLOG.md`):
1. Pull `main`. Read `CLAUDE.md`, then `BACKLOG.md`.
2. List open PRs (`gh pr list`). A task whose ID appears in an open PR branch is taken.
3. Pick the first task, in file order, with `Status: ready`, all `Depends on` tasks `done`, and `Mode: agent`. Never pick `human`, `blocked` or `needs-decision` tasks.
4. One task per run, one task per PR. If the task is too big for one PR, open a PR that splits it in the backlog instead of writing code.
5. Meet the Definition of Done. If tests fail and cannot be fixed within the task's scope, open a draft PR titled `BL-###: blocked` explaining why, and stop.
6. In the same PR, set the task to `Status: in-review (PR #n)`. The founder sets `done` on merge (or a later run does, after seeing the PR merged).
7. Never: apply migrations to a remote project, change secrets, edit an applied migration, change a test to make it pass, merge a PR, or edit requirement documents (propose changes in the PR body instead).

## Consequences

**Positive**
- Zero new dependencies, zero cost, nothing to upgrade; the founder can read and reorder the plan in any editor.
- Requirement documents stay authoritative; legal precedence (LEGAL-REQ wins) keeps working.
- Each PR is auditable from requirement to test, which helps counsel review and App Store privacy work (LEGAL-REQ-041, -042).

**Negative and mitigations**
- Conventions are only as good as their enforcement. Mitigation: `scripts/trace.mjs` in `npm test`, a PR template, and CI that runs tests, typecheck and DB tests on every PR (BL-002 to BL-004).
- A single file can get merge conflicts when two runs edit it. Mitigation: each PR only changes its own task's `Status` line; the founder reorders on `main`.
- No automatic decomposition of PRDs into tasks. Mitigation: an interactive session refreshes the backlog weekly (BL-005 pattern); scheduled runs never re-plan.
- We forgo framework features such as Spec Kit's `analyze` consistency pass. Mitigation: if requirement drift between PRD sections becomes a problem, revisit OpenSpec first.

**Revisit when** more than about 60 open tasks make one file unwieldy, more than one agent runs in parallel, or a second engineer joins.

**Adoption plan** (no installs):
1. Merge this ADR (status to Accepted) and `docs/BACKLOG.md`.
2. BL-001: add a "Work selection" section to `CLAUDE.md` pointing at `docs/BACKLOG.md` and the run protocol; add the branch pattern.
3. BL-002 to BL-004: trace script, PR template, CI.
4. Founder: create GitHub labels `inbox`, `bug`, `idea` for Issues; weekly 20-minute triage into the backlog.
5. After 2 weeks, review: share of scheduled-run PRs merged without rework, and number of trace-check failures. Adjust the format if needed.

## Sources (opened 2 Oct 2026)

- [S1] GitHub Spec Kit, https://github.com/github/spec-kit: `LICENSE` (MIT, GitHub Inc.), `README.md` (Python 3.11+, uv, `/speckit-*` skills, "review the result before continuing"), `templates/spec-template.md` (`FR-###`), `templates/commands/` (`taskstoissues.md`), tags v1.0.8 (2026-09-17) to v1.0.13 (2026-09-29).
- [S2] BMAD Method, https://github.com/bmad-code-org/BMAD-METHOD: `LICENSE` (MIT, BMad Code LLC), `README.md` (uv required, Claude Code plugin marketplace, "free and open source, with no paywalled workflows"), tags v6.8.0 (2026-05-25) to v6.12.0 (2026-09-04).
- [S3] Task Master, https://github.com/eyaltoledano/claude-task-master: `LICENSE` (MIT with Commons Clause v1.0), `README.md` (API keys section; `claude-code` provider needs no key; docs at tryhamster.com), last tag `task-master-ai@0.43.1` (2026-03-31), last commit 2026-04-23.
- [S4] Agent OS, https://github.com/buildermethods/agent-os: `LICENSE` (MIT), `README.md`, `CHANGELOG.md` v3.0 (2026-01-20: spec creation defers to plan mode, task breakdown to Claude Code todo lists), last commit 2026-08-29.
- [S5] OpenSpec, https://github.com/Fission-AI/OpenSpec: `LICENSE` (MIT), `README.md` (telemetry on unless disabled), `docs/existing-projects.md` (delta specs, brownfield), `docs/installation.md` (Node 20.19+), tags v1.13.1 (2026-09-17) to v1.14.0 (2026-09-30).
- [S6] CCPM, https://github.com/automazeio/ccpm: `LICENSE` (MIT), `README.md` (PRD to epic to GitHub Issues, Agent Skill), last commit 2026-03-18, no tags.
- [S7] Claude Code GitHub Action, https://github.com/anthropics/claude-code-action: `LICENSE` (MIT), tag v1.0.239 (2026-10-01). Not adopted now; noted for optional PR review later.
