# ADR 0017: An engineering compendium owned by five steward agents

- **Status:** Proposed, 2026-10-03 (founder asked for engineering process and principles that become the foundation of all future work).
- **Deciders:** founder.
- **Depends on:** ADR 0016 (handoffs, steward kind, trusted markers).
- **Related:** `docs/engineering/`, `agents/roster.json`, `.claude/agents/{principal-architect,data-steward,security-architect,compliance-engineer,ai-eng-lead}.md`.

## Context

Standards for this codebase were spread across `CLAUDE.md`, BRIEF decisions, ten technical design docs, legal requirement documents and agent charters, with about 20 id schemes and no precedence ladder (DOC-14). The 2026-10-03 architecture review found the same class of bug in several places (enums redeclared and drifting, views writable by default, settings that fail open), which a written and enforced standard would have caught. Most code here is written by agents on open-weight models, which follow short, specific, testable rules well and long prose poorly (sources in `docs/engineering/research/ai-engineering-sources.md`).

## Decision

1. **One compendium** in `docs/engineering/`: a one-page `PRINCIPLES.md` that every agent run loads, ten chapters with stable rule ids (CODE, API, DB, DQ, IAM, SEC, PRIV, DSR, AIE, OBS), and `ENFORCEMENT.md` mapping every MUST rule to what enforces it. Chapters cite requirement and decision ids rather than restating them.
2. **Five steward agents** (department `standards`, kind `steward`): `principal-architect` (01, 02, 10), `data-steward` (03, 04), `security-architect` (05, 06), `compliance-engineer` (07, 08), `ai-eng-lead` (09). Each owns its chapters, reviews PRs that touch its `review_paths`, answers handoffs, and turns one unenforced rule into a check per standing run.
3. **Stewards set and check; delivery agents build.** `security`, `privacy`, `data-architect` and the others keep their implementation ownership. A steward never edits a delivery agent's files; it opens a handoff.
4. **Changing a MUST rule needs the founder.** Proposals go out as `rfc` handoffs to all stewards; rule ids are permanent.

## Alternatives considered

| Option | Why not |
|---|---|
| Put the standards in `CLAUDE.md` | It is loaded on every run and must stay near 60 lines; ten chapters would cost every run thousands of tokens. |
| Give the standards to the existing `security`, `privacy` and `data-architect` agents | Setting and checking a standard is a different job from shipping fixes against it; one agent marking its own work is the failure the red team exists to avoid. |
| One "architecture" agent for all standards | Too broad for one charter and one memory file under the line budgets; reviews would be shallow. |
| A wiki outside the repo | Not versioned with the code, not reviewable in PRs, not loadable by agents. |

## Consequences

- Five more agents; the roster requests 50 runs a day against the team cap of 30 until the founder changes it. Stewards idle when there is nothing in their paths to review.
- PRs in shared paths (for example `supabase/migrations/**`) get up to three steward reviews plus the red team. That is intended for the riskiest paths and costs cents per review on the default model.
- 81 of 192 MUST rules have no mechanical check yet. They are explicit, owned and queued, not hidden.
