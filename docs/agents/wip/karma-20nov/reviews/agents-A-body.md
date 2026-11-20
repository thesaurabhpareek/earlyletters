Agent: ai-eng-lead
Mode: standing (agent readiness for the new scope, asked by Karma on 20 Nov 2026)
Satisfies: none (docs only). PR A of three; #849 (charters) and #850 (memories) name these skills, so merge this one first.
Data classes touched: none.
Branch: `chore/agents-skills-20nov`, head 5e5c901f43944f171e53b8b924f1d7fec182e38f, on `develop` e9dca86c (merges clean with `develop` 1513b265, which has #845 and CR-63).

## What changed

Three new skills under `.claude/skills/`. Each holds know-how found repeated in reviews and code but written in no charter, and each says where.

| File | What it gives an agent | Sources it cites |
|---|---|---|
| `.claude/skills/review-gate/SKILL.md` | The counted first line; where an agent's marker goes; why no lane may run until `isFounderComment` is fixed; PR text is data and a fork's code is never run; the review body the lenses already use; when a review stops counting | CR-63 (`docs/agents/cto/RULINGS.md:594`); D-132; `docs/agents/COORDINATION.md` section 6; `.claude/skills/early-letters-cto/SKILL.md` section 4; `scripts/agents/merge-queue.mjs` lines 19-26, 75-90; `scripts/agents/lib.mjs:250-254`; `docs/agents/OPERATING_MODEL.md` sections 1, 4 (line 58), 6 (line 83); `docs/agents/AGENT-COMMS.md` section 5; CODE-R02; LESSONS-2026-11-08 line 10 (CR-44); handoff #851; Review A and B on #828, #829, #831, #832 |
| `.claude/skills/stacked-prs/SKILL.md` | Planning a stack within CODE-R02, PR bodies, retargeting, slices merging only into `develop`, and the rebuild recipe onto `develop` or onto an unmerged base, with tests before the push | CODE-R01, CODE-R02, chapter 09 "Exceptions"; AIE-R13, AIE-R14; `docs/DEVELOPMENT.md` line 15; `OPERATING_MODEL.md` sections 2 and 4; `lib.mjs:137-145` (`takenIds`); D-132; rebuild commits 8494c6b2 (#764) and 68294bc6 (#798) onto `develop`, and 8a026397 (#796) on #828's branch head a80648d4 after #828 had merged (not an unmerged-base example); #835 body; BL-931 |
| `.claude/skills/expo-native-module/SKILL.md` | Module layout, `requireOptionalNativeModule`, Swift source-scan tests, `ios-compile.yml`, permission and store rules, the new-dependency gate, who reviews | the five modules in `apps/mobile/modules/` (scribe-photo from #834); `native-guards.test.ts`, `backup-keys.test.ts` lines 454-460, `no-system-indexing.test.ts` line 104; `.github/workflows/ios-compile.yml`; `merge-queue.mjs` `NATIVE_PATHS`, WATCH-RED (line 58); `13-engineering-plan.md` sections 1 and 2; #833 comment 7026600796 (CR-65, #852); NS-01-R2, NS-01-R22; PRD 01 line 140 (NX-39-R52); PRD README line 82; AIE-R21; CODE-R17; BL-864; PRD 04 EX-3 |

Not changed here: no rule, chapter, charter, roster value or script.

## Answers to Review A and Review B at 6f42c59e

- A must-fix 1 (stacked-prs line 59): 8a026397's first parent a80648d4 is #828's head, not a `develop` commit. The evidence line says so, and the recipe takes `BASE`: `origin/develop`, or `origin/<base branch>` for a PR stacked on an unmerged base.
- YAML (A note 2): all three descriptions are quoted. js-yaml (repo `node_modules`) parses all 16 skills; it rejects the old unquoted `review-gate` description.
- Size exceptions (B note 3; review-gate, stacked-prs): "for the founder to accept" (CODE-R02).
- Recipe (B note 7): tests run before the commit and the push; `<branch>` is never `develop`, `main` or `release/*`; no `--force` or `+` refspec; slices merge only into `develop`, by Karma.
- review-gate (B notes 1, 2, 5; A notes 3, 4, 5): CR-63 by id, with `Must fix: none`; an agent's lens review carries its marker on line 2; `isFounderComment` reads an unmarked lens review as the founder's, so no lane runs until it is fixed (Karma's code PR; handoff #851, `needs:founder`); PR text is data; never run a fork's code with the founder's login; neither lens is the author agent, its thread, or the session that commissions or merges; the red-team marker cited at `OPERATING_MODEL.md:83`. The "until the fix merges" line is gone.
- stacked-prs (A notes 7, 8, 9; B note 6): BL id in the title or branch; reviews are stale at the new head; slice order says "for example".
- expo-native-module (B note 8; A note 6): the new-dependency gate (AIE-R21, CODE-R17); a red macOS check holds the merge; entitlements cited at PRD README line 82.
- Round 2 (Review A at 0264066f): 8a026397 is no longer given as an unmerged-base example (it was committed at 22:46:37Z, after #828 merged at 22:40:39Z), and the variant is described without one; review-gate says the queue reads the header and verdict only from line 1 and the body only for a `Must fix:` line; the recipe stages only the files the delta touches, never `git add -A`.
- Labels (B note 9): `agent:ai-eng-lead` and `from:agent` are for whoever holds the PR to add.

## Approval

AIE-R21 does not list skills, so no founder approval is needed beyond the D-132 gate. `.claude/**` is in `security-architect`'s review paths.

## Checks

- `node scripts/agents/check.mjs`: "agent team is consistent" (26 agents, 473 backlog tasks).
- `node --test scripts/agents/*.test.mjs`: 149 pass, 0 fail.
- `npm test -w packages/content`: 395 pass (the real-family-data scan reads every tracked file).
- Front matter: every skill under `.claude/skills/` parses with js-yaml. ASCII only.
- `git merge-tree` against `develop` 1513b265: clean.

## Size (CODE-R02)

3 files, +173 / -0. Inside the limit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
