Agent: ai-eng-lead
Mode: standing (agent readiness for the new scope, asked by Karma on 20 Nov 2026)
Satisfies: none (docs only). PR B of three. The charters name the skills in #848 (`review-gate`, `stacked-prs`, `expo-native-module`) and the dated memory entries in #850, so merge #848 first; B and C do not depend on each other's text.
Data classes touched: none.
Branch: `chore/agents-charters-20nov`, head 0cf7f4140f4a7836e4cf2fe0bc378f1266d50081, on `develop` e9dca86c (merges clean with `develop` d5d12178).

**Founder approval required (AIE-R21):** this PR edits 17 charters that belong to other agents. `docs/agents/OPERATING_MODEL.md` section 8, `docs/agents/HARNESS.md` section 8 and ai-eng-lead's own charter all say an agent never edits another agent's charter. AIE-R21 allows it only with the founder's approval on the PR, so his approval on this PR, in his own words (a comment he types, with no session marker or "Generated" footer; AIE-R22, AIE-R30), is what lifts that limit. A relayed approval does not count. Labels for whoever holds the PR: `needs:founder`, `agent:ai-eng-lead`, `from:agent`.

## What changed

Each of the 17 engineering charters gains one "You read first" line for the new scope on `develop` (#829, 697233d3). It names that agent's cards and rows from `docs/product/prd/13-engineering-plan.md` sections 2 to 5 and the Owner names in `docs/BACKLOG.md` "New scope, waves 1 and 2", the test plan where it applies, the skills from #848, and the agent's dated memory entry. Stale facts are corrected where a source on `develop` contradicts them. Line numbers below are on 697233d3.

| Charter | Change | Source |
|---|---|---|
| `mobile.md` | Backlog line 25 named only `mobile engineer` | `agents/roster.json` `backlog_owner_names`: `export owner`, `reminders owner` (BL-933, BL-943) |
| `sync.md` | You own, lines 16-17: "(ADR 0004)" and "create packages/api when needed"; read-first line 22: ADR 0025 (Proposed) and 0004 until 0025 is accepted; Backlog line 26 | ADR 0025 lines 3 and 6 (Proposed; supersedes 0004 once accepted; D-023); `packages/api/` exists; roster `family owner` |
| `data-architect.md` | You own, line 18: the inventory of record is `docs/legal/DATA_CLASSIFICATION.md` section 4, not `data-policy.md` section 4 "until BL-016 makes data-map.yaml canonical"; read first names ADR 0028 on `develop` and CR-62 | `docs/BACKLOG.md:194` (BL-016 deferred; v1.0 uses DATA_CLASSIFICATION.md); `docs/legal/data-map.yaml` does not exist; `docs/adr/0028-photo-seal-find-on-device-data.md` (#797); `docs/agents/cto/RULINGS.md:570` |
| `data-steward.md` | A note after line 30: `data-map.yaml` does not exist; check rows in `DATA_CLASSIFICATION.md` (the line itself mirrors the roster and stays) | as above; roster `review_paths` |
| `security-architect.md` | line 24 cited D-044 | `docs/DECISIONS.md:346` (D-054, founder, supersedes D-044) |
| `security.md` | Backlog line 27 named only `security engineer` | roster `auth owner` |
| `privacy.md` | You own, line 17: classification decisions in `DATA_CLASSIFICATION.md` section 4 | `docs/BACKLOG.md:194` |
| `ops.md` | Backlog line 26 "None by default"; line 22 `docs/ROADMAP.md` milestone M12; line 23 an old tag form; read first states the counted-review rule | roster `platform` (24 rows not done or superseded); `docs/ROADMAP.md` line 3 ("Superseded"); `CLAUDE.md` "Branches and commits", ADR 0022; CR-63 (`RULINGS.md:594`) |
| `payments.md` | You own, line 16: "create the plus folder when your first task needs it" | `apps/mobile/src/app/plus/` and `apps/mobile/src/lib/billing/` exist |
| `analytics.md` | read first: only `capture_started` comes from `startCapture`; the catalog has eight capture events | `apps/mobile/src/lib/capture/start-capture.ts:7-8, 28-30`; `packages/analytics/src/catalog.ts:444-528` |
| `red-team.md` | read first: a Lens A or B review uses the `review-gate` format (header on line 1, marker on line 2); a marker-first review is read, not counted | `scripts/agents/merge-queue.mjs:72`; D-132; CR-63; handoff #851 |
| `compliance-engineer.md`, `qa.md`, `design-systems.md`, `content.md`, `speech.md`, `principal-architect.md` | read-first line only | `13-engineering-plan.md` sections 2 to 5; `14-test-plan.md`; PRD README ground rules; PRD 07 OQ-2 |

Four "You own" lines changed: `data-architect.md:18`, `privacy.md:17`, `payments.md:16` and `sync.md:16-17`. Each corrects a fact. Not changed: missions, standing duties, Never lists, tools, models, budgets, caps.

**`docs/legal/data-policy.md` section 4 has no charter owner after this change.** `privacy.md` still reads the file, but no charter owns its section 4 rows, while CR-62 item 4 (`RULINGS.md:588`, "the data-policy 4.4 row") still directs an edit there. Proposal, not an assignment: `privacy` keeps those rows in step with `DATA_CLASSIFICATION.md`, `legal` words them, and the founder merges them (D-125). The founder or Karma decides.

## Answers to Review A and Review B at 57b7fb38

- A must-fix 1 (`analytics.md:23`): fixed as in the table.
- Body accuracy (A note 2, B note 2): the four "You own" lines are listed above, and the approval paragraph says plainly what the founder's approval lifts.
- `ops.md` (A note 4, B note 4): states the rule (CR-63), not the tool's state.
- `red-team.md` (A note 5, B note 3): cites `merge-queue.mjs:72`, not the dispatcher's state. Whether a red-team `fix first` on a D-041 path holds a merge is left to the founder, not settled by this line.
- `sync.md:22` (B note 5): ADR 0025 is Proposed; 0004 holds until it is accepted.
- `data-policy.md` section 4 (A note 3): above.
- Not taken here: the D-041 clause on the new intake lines (B note 6), the `DATA_CLASSIFICATION.md` overlap with device tables (B note 7), moving the `data-steward` note to memory (A note 6), and `principal-architect.md:25, 33` (A note 7, which its owner takes). The roster changes (B note 8) are in the readiness report for the founder and in handoff #851 for the review format.

## Checks

- `node scripts/agents/check.mjs`: "agent team is consistent" (26 agents, 473 backlog tasks).
- `node --test scripts/agents/*.test.mjs`: 149 pass, 0 fail.
- `npm test -w packages/content`: 395 pass.
- Every charter is under 90 lines (largest: `data-steward.md`, 63) (AIE-R03). ASCII only. `git merge-tree` against `develop` d5d12178: clean.

## Size (CODE-R02)

17 files, +31 / -13. Inside the limit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
