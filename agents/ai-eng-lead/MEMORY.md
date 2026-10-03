# Memory: AI-Assisted Engineering Lead (ai-eng-lead)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 60 lines.

Seeded on 3 Oct 2026 during the compendium drafting run. Facts verified on branch `docs/engineering-compendium` (based on `chore/agents-operating-system`, PR #4).

## Current focus
- Close the gaps in chapter 09: AIE-G7 (red-team marker trust) and AIE-G2 (no `AGENTS.md`) first; then AIE-G4 (`Done when:` on agent tasks).

## Facts about this codebase (with paths)
- The harness (roster, charters, dispatcher, `agents.yml`) is PR #4 and is NOT on `develop` yet; `develop` lacks `scripts/agents/` and `.github/workflows/agents*.yml` (checked with `git cat-file`).
- Brief reading order: `scripts/agents/brief.mjs:126-132` lists CLAUDE.md, OPERATING_MODEL, charter, memory, then the latest `docs/agents/BRIEF-*.md`. It does not list `docs/engineering/PRINCIPLES.md`.
- Founder test: `isFounderComment` in `scripts/agents/lib.mjs:226` (login equals `roster.founder` or `author_association == OWNER`).
- The red-team verdict is read from any comment containing `red-team:<sha>`, with no author check (`scripts/agents/dispatch.mjs:106`; `brief.mjs:72` also passes such comments into maintain briefs).
- Dispatcher `sensitive` PRs are matched by regex on title and branch only (`dispatch.mjs:153`), not on changed files.
- OpenCode deny list: `scripts/agents/run-opencode.mjs:19-22`; Claude Code deny list: `.github/workflows/agents.yml:136`.
- Runner caps: dollar and step caps at `run-opencode.mjs:109-110`; stops paid models that report zero cost after 5 steps (line 112).
- Receipts (`scripts/agents/receipt.mjs`) record model, cost, turns, minutes; the OpenCode result also has `tokens` but the receipt drops them. Spend on the board sums `<!-- receipt ... cost:x -->` markers from any comment (`dispatch.mjs:259-268`).
- `check.mjs` warns at 150 memory lines (limit is 120) and 200 description chars; it requires charter `model: inherit`.
- `docs/agents/CHARTER_TEMPLATE.md:9` still says `model: <sonnet | opus>` (contradicts `check.mjs`).
- No root `AGENTS.md`; `apps/mobile/AGENTS.expo.md` exists (Expo template leftover, MOB-13). OpenCode reads `AGENTS.md` before `CLAUDE.md` and uses only the first it finds.
- Fuzz test: `packages/core/test/verify.fuzz.test.ts`, seed 20261003, 10,000 runs by default (lines 34-35). On develop.
- Backlog: 167 tasks, only 2 have a `Done when:` line (`docs/BACKLOG.md`).
- Always-loaded words for `mobile`: about 4,200 (`wc -w` of CLAUDE.md, OPERATING_MODEL, BRIEF, charter, memory).
- Roster: 19 agents before the five stewards; red-team on `openrouter/z-ai/glm-5.2`, everyone else on the DeepSeek default.

## Decisions and constraints I must respect
- ADR 0014 (plain-code dispatcher, agents never merge), ADR 0015 (open-weight default; red team on a different model family).
- D-041: `supabase/**` and auth need an independent review run and the founder's `approve-migration` label.
- PINF-01 (no write connectors), PINF-02 (agent identity separate from the founder), PINF-03 (prompt injection).
- Only the founder edits `agents/roster.json`, `CLAUDE.md`, `OPERATING_MODEL.md`, workflows.

## Open threads
- Founder questions are consolidated in `docs/engineering/README.md` ("Decisions the stewards need from the founder").
- `docs/agents/AGENT-COMMS.md` was being written in parallel on 3 Oct; align handoff wording once it lands.

## Lessons
- `x.com` and several vendor sites refuse the fetch tool; `curl` through the proxy works, and `api.fxtwitter.com/<user>/status/<id>` returns post text.
- Boeckeler (Aug 2026) found no clear benefit from TDD inside the agent loop; do not mandate the ritual, mandate requirement-derived assertions.
