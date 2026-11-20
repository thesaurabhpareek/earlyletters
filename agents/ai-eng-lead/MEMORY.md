# Memory: AI-Assisted Engineering Lead (ai-eng-lead)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines (AIE-R03).

Seeded on 3 Oct 2026 during the compendium drafting run. Lines marked (15 Oct) were re-checked against `develop` at `56ec5b5` (after #4, #39 and #130 merged). Every other line is as of 3 Oct: re-verify it before acting on it.

## Current focus
- Close the gaps in chapter 09: AIE-G2 first (`apps/web/AGENTS.md` breaks AIE-R02; AIE-G7 was closed by #39); then AIE-G4 (`Done when:` on agent tasks; BL-923 to BL-949 all have one).
- (20 Nov) Agent readiness for the new scope (#829): engineering charters, memories and three skills (`review-gate`, `stacked-prs`, `expo-native-module`) proposed as three branches, `chore/agents-skills-20nov`, `chore/agents-charters-20nov`, `chore/agents-memories-20nov`; the roster, cap and routing proposals went to Karma in the report.

## New scope audit (20 Nov 2026)
- `merge-queue.mjs` counts a review only if line 1 is `## Review A|B at <40 hex>: PASS` (lines 19-24, 72). Karma ruled on 20 Nov that `PASS WITH NOTES` is also a counted pass and CHANGES, FAIL, BLOCKED are not (CR to be recorded; his fix to the tool is its own PR). #828, #829, #831 and #832 merged on two `PASS WITH NOTES`; `docs/DECISIONS.md:878` records two at #306's held head f54b6f2, and #306 merged at 8604b5c on a `PASS` and a red-team `ship` (verified 2026-11-20).
- A marker first line (`OPERATING_MODEL.md` section 4, the red-team and steward charters) makes a review uncounted by `merge-queue.mjs`: an AIE-R05 contradiction for the founder (verified 2026-11-20).
- The dispatcher's queue is backlog file order (`queueFor`, `scripts/agents/lib.mjs:147`), so older `ready` rows come before BL-923 to BL-949 (verified 2026-11-20).
- Roster `review_paths`: `security-architect` lacks `apps/mobile/modules/**`; `data-steward` names `docs/legal/data-map.yaml`, which does not exist, and not `docs/legal/DATA_CLASSIFICATION.md` or `docs/adr/**`; my `docs/agents/**` matches every PR's `docs/agents/BOARD.md` row (verified 2026-11-20).
- `user-research` and `regulatory-affairs` have `daily_runs` 0 while BL-935 and BL-949 name them (`agents/roster.json`, verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged as 76a4a5d7), #841, #842, #835 to #840 (open); #833 closed. The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833) (verified 2026-11-20).
- Default branch is `develop` (repos API), not `main` as the 28 Oct box in `docs/agents/HARNESS.md` says (verified 2026-11-20).

## Facts about this codebase (with paths)
- (15 Oct) The harness is on `develop`: PR #4 (roster, charters, dispatcher, `agents.yml`; `cb8fa72`) and PR #39 (handoffs, stewards, trusted authors, ledger; `0c71ea9`). `agents.yml` runs only while the repository variable `AGENTS_ENABLED` is `true`; it is `disabled_manually` since 31 Oct with 0 runs (Actions API, verified 2026-11-20).
- (15 Oct) Brief reading order: `readingOrder()` in `scripts/agents/brief.mjs` lists CLAUDE.md, the latest `docs/agents/BRIEF-*.md`, OPERATING_MODEL, `docs/engineering/PRINCIPLES.md` when it exists, the charter, then memory (AIE-R01 precedence).
- Founder test: `isFounderComment` in `scripts/agents/lib.mjs` (login equals `roster.founder` or `author_association == OWNER`).
- (15 Oct) Red-team and steward verdicts count only from trusted authors: `isTrusted` in `scripts/agents/lib.mjs` (founder, the agents App by client id or bot login, roster `trusted_bots`), used by `dispatch.mjs` and `brief.mjs`. AIE-G7 closed by #39.
- Dispatcher `sensitive` PRs are matched by regex on title and branch only (`sensitive` in `dispatch.mjs`), not on changed files. Open PR #137 adds file-based D-041 targets.
- OpenCode deny list: `scripts/agents/run-opencode.mjs`; Claude Code deny list: `--disallowedTools` in `.github/workflows/agents.yml` (since 15 Oct it also names pushes to `develop` and `main`).
- Runner caps: dollar and step caps at `run-opencode.mjs:109-110`; stops paid models that report zero cost after 5 steps (line 112).
- Receipts (`scripts/agents/receipt.mjs`) record model, cost, turns, minutes; the OpenCode result also has `tokens` but the receipt drops them. Spend on the board sums `<!-- receipt ... cost:x -->` markers from any comment (`spendToday` in `dispatch.mjs`).
- (15 Oct) `check.mjs` warns past 120 memory lines (the limit) and 200 description chars; it requires charter `model: inherit`.
- (15 Oct) `docs/agents/CHARTER_TEMPLATE.md` uses `model: inherit`, matching `check.mjs` (fixed in #4).
- No root `AGENTS.md`; `apps/mobile/AGENTS.expo.md` is gone; `apps/web/AGENTS.md` is a regular file `next dev` writes (since #317), against AIE-R02 (verified 2026-11-20). OpenCode reads `AGENTS.md` before `CLAUDE.md` and uses only the first it finds.
- Fuzz test: `packages/core/test/verify.fuzz.test.ts`, seed 20261003, (15 Oct) 10,000 runs by default (`SEED` and `RUNS`, lines 39-40). On develop.
- (15 Oct) Backlog: 232 tasks on `develop`, 65 `Done when:` lines, most in the M-JR block (BL-370 to BL-434, #86).
- Always-loaded words for `mobile`: about 4,200 (`wc -w` of CLAUDE.md, OPERATING_MODEL, BRIEF, charter, memory).
- Roster: 26 agents; red-team on `openrouter/z-ai/glm-5.2`, everyone else on the DeepSeek default; daily runs sum 50 against a team cap of 30 (`node scripts/agents/check.mjs`, verified 2026-11-20).

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
