# Memory: AI-Assisted Engineering Lead (ai-eng-lead)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 60 lines.

Seeded on 3 Oct 2026 during the compendium drafting run. Lines marked (15 Oct) were re-checked against `develop` at `56ec5b5` (after #4, #39 and #130 merged). Every other line is as of 3 Oct: re-verify it before acting on it.

## Current focus
- Close the gaps in chapter 09: AIE-G7 (red-team marker trust) and AIE-G2 (no `AGENTS.md`) first; then AIE-G4 (`Done when:` on agent tasks).

## Facts about this codebase (with paths)
- (15 Oct) The harness is on `develop`: PR #4 (roster, charters, dispatcher, `agents.yml`; `cb8fa72`) and PR #39 (handoffs, stewards, trusted authors, ledger; `0c71ea9`). `agents.yml` runs only while the repository variable `AGENTS_ENABLED` is `true`.
- (15 Oct) Brief reading order: `readingOrder()` in `scripts/agents/brief.mjs` lists CLAUDE.md, the latest `docs/agents/BRIEF-*.md`, OPERATING_MODEL, `docs/engineering/PRINCIPLES.md` when it exists, the charter, then memory (AIE-R01 precedence).
- Founder test: `isFounderComment` in `scripts/agents/lib.mjs` (login equals `roster.founder` or `author_association == OWNER`).
- (15 Oct) Red-team and steward verdicts count only from trusted authors: `isTrusted` in `scripts/agents/lib.mjs` (founder, the agents App by client id or bot login, roster `trusted_bots`), used by `dispatch.mjs` and `brief.mjs`. AIE-G7 closed by #39.
- Dispatcher `sensitive` PRs are matched by regex on title and branch only (`sensitive` in `dispatch.mjs`), not on changed files. Open PR #137 adds file-based D-041 targets.
- OpenCode deny list: `scripts/agents/run-opencode.mjs`; Claude Code deny list: `--disallowedTools` in `.github/workflows/agents.yml` (since 15 Oct it also names pushes to `develop` and `main`).
- Runner caps: dollar and step caps at `run-opencode.mjs:109-110`; stops paid models that report zero cost after 5 steps (line 112).
- Receipts (`scripts/agents/receipt.mjs`) record model, cost, turns, minutes; the OpenCode result also has `tokens` but the receipt drops them. Spend on the board sums `<!-- receipt ... cost:x -->` markers from any comment (`spendToday` in `dispatch.mjs`).
- (15 Oct) `check.mjs` warns past 120 memory lines (the limit) and 200 description chars; it requires charter `model: inherit`.
- (15 Oct) `docs/agents/CHARTER_TEMPLATE.md` uses `model: inherit`, matching `check.mjs` (fixed in #4).
- No root `AGENTS.md`; `apps/mobile/AGENTS.expo.md` exists (Expo template leftover, MOB-13). OpenCode reads `AGENTS.md` before `CLAUDE.md` and uses only the first it finds.
- Fuzz test: `packages/core/test/verify.fuzz.test.ts`, seed 20261003, (15 Oct) 10,000 runs by default (`SEED` and `RUNS`, lines 39-40). On develop.
- (15 Oct) Backlog: 232 tasks on `develop`, 65 `Done when:` lines, most in the M-JR block (BL-370 to BL-434, #86).
- Always-loaded words for `mobile`: about 4,200 (`wc -w` of CLAUDE.md, OPERATING_MODEL, BRIEF, charter, memory).
- (15 Oct) Roster: 24 agents with the five stewards from #42 (19 before); red-team on `openrouter/z-ai/glm-5.2`, everyone else on the DeepSeek default.

## Decisions and constraints I must respect
- ADR 0018 (plain-code dispatcher, agents never merge), ADR 0019 (open-weight default; red team on a different model family).
- D-041: `supabase/**` and auth need an independent review run and the founder's `approve-migration` label.
- PINF-01 (no write connectors), PINF-02 (agent identity separate from the founder), PINF-03 (prompt injection).
- Only the founder edits `agents/roster.json`, `CLAUDE.md`, `OPERATING_MODEL.md`, workflows.

## Open threads
- Founder questions are consolidated in `docs/engineering/README.md` ("Decisions the stewards need from the founder").
- (15 Oct) `docs/agents/AGENT-COMMS.md` landed with #39; chapter 09's handoff wording should cite it.

## Lessons
- `x.com` and several vendor sites refuse the fetch tool; `curl` through the proxy works, and `api.fxtwitter.com/<user>/status/<id>` returns post text.
- Boeckeler (Aug 2026) found no clear benefit from TDD inside the agent loop; do not mandate the ritual, mandate requirement-derived assertions.
