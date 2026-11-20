Agent: ai-eng-lead
Mode: standing (agent readiness for the new scope, asked by Karma on 20 Nov 2026)
Satisfies: none (docs only). PR C of three. The entries name the `review-gate` skill from #848, so merge #848 first; C does not depend on #849.
Data classes touched: none.
Branch: `chore/agents-memories-20nov`, head 8f42d653fd6ae6b4489f0f46c72c161116d4b65d, on `develop` e9dca86c (merges clean with `develop` 1513b265, which has CR-63 and #841).

**Founder approval required (AIE-R21):** this PR edits the memory of 17 other agents (every engineering agent). `docs/agents/OPERATING_MODEL.md` section 8 says an agent never edits another agent's memory; AIE-R21 allows it only with the founder's approval on the PR, so his approval here, in his own words (no session marker or "Generated" footer; AIE-R22, AIE-R30), is what lifts that limit. The 18th file, `agents/ai-eng-lead/MEMORY.md`, is mine and needs none. Labels for whoever holds the PR: `needs:founder`, `agent:ai-eng-lead`, `from:agent`.

## What changed

Every engineering memory's "Current focus" names that agent's Build 13 rows (`docs/product/prd/13-engineering-plan.md` sections 3 and 4; Owner names in `docs/BACKLOG.md` "New scope, waves 1 and 2"), in place of the 3 Oct seed rows, which were never re-checked. A new section, "New scope (20 Nov 2026)", lists only the decisions that bind that agent, one fact per line in the AIE-R07 form `fact (source, verified date)`, with rulings cited by id.

Lines shared across entries, and their sources:

| Line | Source | In |
|---|---|---|
| The pack is on `develop` at 697233d3 (#829); rows from wave 2 on wait under a founder hold, released by one status-change PR | `git log`; `13-engineering-plan.md` section 6 | all 17 |
| No autonomous lane runs; `AGENTS_ENABLED` not verified | Actions API (`agents.yml` `disabled_manually`, 0 runs); `docs/agents/HARNESS.md` lines 11 and 17 | all 17 |
| A counted review: line 1 `## Review A|B at <sha>: PASS`, or `PASS WITH NOTES` with `Must fix: none`; CHANGES, FAIL, BLOCKED do not count; Karma merges | CR-63 (`docs/agents/cto/RULINGS.md:594` on `develop`); D-132 | all 17 |
| BL-931 is the nine-PR photo stack: #834 (merged), #841 (merged, 1513b265), #842, #835 to #840 | Karma's direction; PR states read from the API, 20 Nov | all 17 and ai-eng-lead |
| The picker is PHPickerViewController in `scribe-photo`, never expo-image-picker (ITMS-90683) | CR-65 (#852); #833 comment 7026600796 | all 17 and ai-eng-lead |
| Local migration 11 ships unconditionally | CR-64 (#852); #835 body | mobile, data-architect, data-steward, privacy, ops, red-team |
| ADR 0028 accepted; the file is on `develop` | CR-62 (`RULINGS.md:570`); `docs/adr/0028-photo-seal-find-on-device-data.md` (#797) | mobile, sync, data-architect, data-steward, security-architect, privacy, compliance-engineer, principal-architect |
| Memory Library rows are after Build 13, except what NS-01 needs (NS-01 is NX-39 P0, one picture per letter); for example BL-868, BL-852, BL-870 | `docs/product/prd/README.md:42`; NS-01-R14, NS-01-R15 | mobile, sync, data-architect |
| Tabs Home, Book, Me; no co-parent "coming soon"; co-parent only with server features on in an alpha | D-161, D-162 (`docs/DECISIONS.md:1161`, `:1174`); `apps/mobile/src/lib/family/entry.logic.ts:74` | mobile, sync, security, privacy, design-systems, content, red-team |
| Only `startCapture({source})` starts a letter | `start-capture.ts:24`; #828; `navigation-one-entry.test.ts` | mobile, qa, design-systems, principal-architect, red-team |
| A let-go draft never leaves its recording | `let-it-go.logic.ts`, `sweep.ts` `finishLetGo`; #832 | mobile, qa, content, red-team |
| Phone migrations: append-only, `user_version`, upgrade tests, DATA_CLASSIFICATION 4.5 row | `apps/mobile/src/lib/db/migrations.ts:1-14`; `migrations.v9.test.ts` | data-architect, data-steward |
| P0 rows block builds outside the founder's family | `14-test-plan.md` section 7, RR-3 | mobile, qa |
| A child's voice leaving the phone needs `security-architect` and counsel reads (X2) | PRD README ground rules | security-architect, security, privacy |
| Opt-in analytics is off through 1.0 | D-124 | compliance-engineer, analytics |

Agent-specific lines and stale lines fixed (line numbers on 697233d3):

| Memory | Change | Source |
|---|---|---|
| mobile | focus: waves 1 and 2 rows; BL-846 and BL-847 overlap #835 and BL-931; one photo per letter | 13 section 4; BACKLOG BL-846, BL-847; PRD README |
| sync | lines 12-13: ADR 0025 and D-023; `packages/api` exists; focus: BL-870 and BL-852 behind NS-01-R15 | ADR 0025 lines 3, 6; PRD 01 |
| data-architect | line 14: the inventory of record is `DATA_CLASSIFICATION.md`; focus: BL-868 gates BL-933; ADR 0028 on `develop` | `docs/BACKLOG.md:194`; CR-62 item 3 |
| data-steward | focus: #835 and #798 route to you; `docs/adr/**` and `DATA_CLASSIFICATION.md` do not | roster `review_paths` |
| security-architect | line 29: D-054 supersedes D-044; line 30: the `approve-migration` label is retired; focus: native review of BL-931 slices 2, 2b, 2c; the NS-03 read (date in PRD 03 line 65) | `docs/DECISIONS.md:346`; D-117 (`docs/DECISIONS.md:843`) |
| analytics | only `capture_started` comes from `startCapture`; eight capture events | `start-capture.ts:7-8, 28-30`; `catalog.ts:444-528` |
| privacy | line 13: `DATA_CLASSIFICATION.md` | `docs/BACKLOG.md:194` |
| payments | line 12: Plus folders exist | `apps/mobile/src/app/plus/`, `apps/mobile/src/lib/billing/` |
| ops | line 8 "No backlog owner role" removed; default branch is `develop` | roster `platform`; repos API |
| security, compliance-engineer, qa, design-systems, content, speech, principal-architect, red-team | focus lines and their own facts | the files each line names |
| ai-eng-lead (mine) | 120-line limit (AIE-R03); 26 agents; `apps/web/AGENTS.md` breaks AIE-R02; `agents.yml` disabled; CR-63; `isFounderComment` and its marker exclusion (`lib.mjs:250-254`); handoff #851; the #306 record (`DECISIONS.md:878` shows two PASS WITH NOTES at the held head f54b6f2; #306 merged at 8604b5c on a `PASS` and a red-team `ship`); `approve-migration` retired | `check.mjs`; `git ls-files`; Actions API; #306 comments; D-117 |

## Answers to Review A and Review B at 25ab1dbb

- A must-fix 1 (Memory Library line in mobile, sync, data-architect): the README's own exception (line 42), with the NS-01 rows as examples; it now agrees with `sync/MEMORY.md:8`.
- A must-fix 2 (`analytics/MEMORY.md:16`): fixed as in the table.
- Rulings from PR text (B note 1): cited by id, CR-62 and CR-63 (on `develop`), CR-64 and CR-65 (#852, open), each beside its source pointer.
- Round 2 (Review A at 404b889c): ai-eng-lead's line states CR-63 as merged (`merge-queue.mjs:20-25, 75-90`); #841 is marked merged.
- Volatile lines (B note 2, A note 4): no PR is called open; "#843 (open)" is now the rule from 13 section 6; the counted-review line states CR-63, not the tool's state.
- One fact per line (A note 5): the BL-931 stack and the picker are two lines.
- HARNESS citation (A note 7): lines 11 and 17.
- security-architect (B notes 4, 7): the label line and the restated date are fixed.
- ai-eng-lead (B notes 5, 6; A note 6): the plan line is gone; `isFounderComment` is complete; the review-format conflict is handoff #851 (`needs:founder`).
- The same retired-label wording in the `data-architect`, `data-steward` and `security` memories is fixed too (D-117, `docs/DECISIONS.md:843`): no memory states the `approve-migration` label as a requirement.
- Not changed here: the shared lines stay copied per memory (B note 3), because each memory is read alone by its agent; the ADR 0028 line still packs D1, D3a, D4 (A note 5, next touch).

## Checks

- `node scripts/agents/check.mjs`: "agent team is consistent" (26 agents, 473 backlog tasks).
- `node --test scripts/agents/*.test.mjs`: 149 pass, 0 fail.
- `npm test -w packages/content`: 395 pass (the real-family-data scan reads every tracked file; no real family detail and nothing personal about the founder is in any line).
- Every memory is under 120 lines (AIE-R03). ASCII only. `git merge-tree` against `develop` 1513b265: clean.

## Size (CODE-R02)

18 files, +245 / -40 (285 changed lines). Inside the limit of 400 lines and 20 files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
