# GitHub Projects, labels and where things live

Owner: ops. Read-only audit of 31 Oct 2026. Nothing here has been created or deleted. The founder applies it.

## 1. Labels as they exist today

Source: `gh api repos/thesaurabhpareek/earlyletters/labels --paginate` (31 Oct 2026). Counts are of label names, not of issues using them. Whether a label is used on any issue or PR is UNVERIFIED unless noted.

### agent: (one per agent, 26 labels)
Meaning: the agent that authored a PR. Set on every agent PR (CLAUDE.md: "label their PRs `agent:<handle>`").
Handles: ai-eng-lead, analytics, chief-of-staff, compliance-engineer, content, data-architect, data-steward, decision-records, decision-science, design-systems, legal, marketing, mobile, ops, payments, principal-architect, privacy, product, qa, red-team, reference-docs, security, security-architect, speech, support, sync.
Flag: the roster says 19 agents; 26 labels exist. Some handles may be retired or planned. UNVERIFIED which.

### from: (handoff sender)
Meaning: "Handoff sent by X". Set on a handoff issue by the sender.
- `from:agent`: "Opened by an Early Letters agent". Different job from the rest of the family. Unclear; keep or rename to `opened-by:agent`.
- 24 `from:<handle>` labels, one per agent except `from:sync`, which has no description.
- Missing against the agent list: none checked beyond the above. UNVERIFIED.

### to: (handoff recipient)
Meaning: "Handoff waiting for X". Removed when the recipient answers.
- 26 `to:<handle>` labels. `to:content`, `to:data-architect` and `to:mobile` have no description.

### review: (red team verdict)
- `review:changes-needed`: red team says fix first.
- `review:red-team-ok`: red team says ship.

### needs:
- `needs:founder`: blocked on a founder decision or account step. This drives the "Founder only" column below.

### risk:
- `risk:low`: docs, tests, copy; easy undo.
- `risk:med`: behaviour change, or a supabase/.github/auth/plan.ts path.
- `risk:high`: migration, data, security, release path.
- Required on PRs by the PR standard (rollback needed at med or high).

### area:
- `area:core`, `area:db`, `area:harness`, `area:mobile`, `area:release`, `area:web`. Which part of the repo a change touches.

### type: (PR type, from the title)
- `type:chore`, `type:docs`, `type:feat`, `type:fix`, `type:perf`, `type:refactor`, `type:test`.
- Flag: CLAUDE.md and `docs/agents/cto/RULINGS.md` also list `qa`, `exp`, `ci` and `revert` as title types. No `type:` label exists for those four. Decide whether to add them or trim the title list.

### Workflow and board labels
- `backlog`: mirrors a `docs/BACKLOG.md` task.
- `inbox`: founder bug or idea, not yet in the backlog. The intake label.
- `idea`: founder idea.
- `handoff`: a handoff between agents (no description).
- `digest`: daily founder digest.
- `report`: recurring report written by an agent.
- `journal`: an agent's journal.
- `agent-board`: live status of the agent team.
- `agents`: no description. Unclear. Possibly overlaps `area:harness`.
- `approve-migration`: founder approval for a supabase or auth change (D-041).
- `rfc`: proposed change to an engineering standard; every steward replies.
- `eas-build`: PR label that triggers an EAS build. Not ours: the description is the Expo default. Check the workflow before removing.

### GitHub defaults
`bug`, `documentation`, `enhancement`, `question`, `duplicate`, `invalid`, `wontfix`, `help wanted`, `good first issue`, `accessibility`.
- `bug` is used by the new bug form.
- `good first issue` and `help wanted` are unlikely to be used: this is not an open-contribution repo. Candidates to remove, founder's call.
- `enhancement` overlaps `type:feat` and `idea`. `documentation` overlaps `type:docs`.
- `accessibility` has a custom description, so it was made on purpose.

### Gaps and clean-up suggestions (none applied)
1. Add `from:sync` description and the three missing `to:` descriptions.
2. Decide on `agents` versus `area:harness`.
3. Decide on `type:` labels for qa, exp, ci, revert.
4. Retire the GitHub defaults nobody uses.
5. Confirm 26 agent labels against `agents/roster.json` (19 agents).

## 2. Proposed board (paste-ready)

**Name:** Early Letters: work at a glance

**Description:** A view of work already tracked elsewhere. The plan lives in docs/BACKLOG.md. This board never holds a decision.

**Columns (Status field):**
| Column | Meaning |
|---|---|
| Intake | New issues with the `inbox` label. Nobody has triaged them. |
| Ready | In `docs/BACKLOG.md`, meets Definition of Ready, nobody started. |
| In progress | A branch exists and work is under way. |
| In review | A PR is open. Red team or the founder is looking. |
| Founder only | Carries `needs:founder`. Only the founder can unblock it. |
| Done | Merged to `develop`, or closed as not doing. |

**Fields:**
| Field | Type | Values |
|---|---|---|
| Status | single select | the six columns above |
| BL id | text | `BL-123` |
| Requirement | text | `A-REQ-012` and so on |
| Risk | single select | low, med, high (from `risk:` labels) |
| Area | single select | core, db, harness, mobile, release, web |
| Agent | single select | the agent handle, or "founder" |
| Milestone | single select | M-number from `docs/ROADMAP.md` |

**Views:**
1. Board, grouped by Status. The default.
2. Founder queue: table, filter `Status:Founder only`, sorted by Risk descending.
3. In review: table, filter `Status:In review`, grouped by Agent.
4. By area: board, grouped by Area, filter `-Status:Done`.
5. Done this week: table, filter `Status:Done`, sorted by closed date.

**Automation (built-in workflows, founder switches on):** item added to project sets Status to Intake; PR merged sets Done; issue closed sets Done.

Create it as a user project: Profile, Projects, New project, Board. Link the repo. Not created by this change.

## 3. What lives where

| Thing | Home | Note |
|---|---|---|
| Bug reports and ideas from outside the plan | GitHub issues | Intake only (ADR 0011). Use the issue forms. |
| The ordered plan | `docs/BACKLOG.md` | Tasks are `BL-###`. Agents work only from here. |
| Changes | Pull requests | One concern each. Squash-merged (CR-6). |
| Decisions | `docs/DECISIONS.md` | Plus `docs/adr/` for the long form. |
| Requirements | `docs/prd/`, `docs/legal/` | Cited by ID, never copied. |
| Board | GitHub Projects | View only. If it disagrees with the backlog, the backlog wins. |
