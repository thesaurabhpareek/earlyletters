# Skills matrix: who can do what in the newest scope (RD-G, 1 of 5)

Author: `ai-eng-lead`, 20 Nov 2026. Docs only. Tags: [V] verified (file:line, sha or command), [E] estimate with basis, [U] unverified. Rule ids are chapter 09 (`docs/engineering/09-ai-assisted-engineering.md`, AIE-R##). Siblings: `KNOWLEDGE-PACKS.md`, `KNOWLEDGE-PACKS-2.md`, `BRIEF-TEMPLATE.md`, `HARNESS-GAPS.md`.

## 1. Read this first: what "has the skill" can mean today

- No autonomous lane runs. Every "agent" run so far is a Claude interactive session posting from the founder's account (`docs/agents/HARNESS.md:11`) [V]. The plan keeps the lane off for waves 1 and 2 (`17-engineering-project-plan.md` section 9, last paragraph, branch `docs/engineering-project-plan-20nov`) [V].
- So a charter's engine and model are nominal for wave 1. In `agents/roster.json` only `red-team` names a model (`openrouter/z-ai/glm-5.2`, max_budget_usd 3, max_turns 60); the other 25 take the opencode default `openrouter/deepseek/deepseek-v4.1-flash`, budget 2 [V `python3` over `agents/roster.json` defaults and engines]. The model that does the work is whatever the session runs. What decides quality is the brief and the reading pack (chapter 09 AIE-R12, AIE-R09), not the roster line.
- "Has the skill" below therefore means three things, in this order: (a) the charter or memory names it, (b) the lane has shipped code or tests of that kind on `develop`, (c) a skill file exists in `.claude/skills`. A skill with none of the three is a gap.
- Charters name no Swift, no PHPicker, no AVFoundation, no FTS, no `expo-sqlite`, no Voice Control, no Instruments, no XCUITest, no Maestro and no mutation checking. `grep -lE` over `.claude/agents/*.md` for each word returns no file (Swift, PHPicker, AVFoundation, FTS, expo-sqlite, Voice Control, mutation, Instruments, XCUITest, Maestro) [V 20 Nov]. Only `mobile` names Reanimated; `mobile` and `design-systems` name VoiceOver; `payments` names StoreKit. The code on `develop` still has all of them (five native modules, `apps/mobile/modules/*`; Maestro flows in `apps/mobile/e2e`) [V `ls`].

## 2. Lane capacity (roster limits, who actually has room)

| Lane | wip_limit | daily_runs | Notes [V roster unless marked] |
|---|---|---|---|
| mobile | 3 | 4 | Owns most of the work: owner column of #847 tables counts 14 of 27 rows in 2.3, 6 of 11 in 2.2, all 9 photo slices in 2.1, about 25 of 32 in 2.4 to 2.6 (counted by script over the Owner column) [V computed; 2.4 to 2.6 table shapes vary, so [E] +-3] |
| sync | 2 | 2 | BL-976, BL-987 (wave 1) |
| data-architect | 2 | 3 | BL-959, BL-868, migrations |
| design-systems | 2 | 3 | BL-927, tokens, `components/ui/**` |
| qa | 3 | 3 | BL-964, BL-929, BL-930, device rows |
| security | 2 | 2 | threat models (`docs/security/**`) |
| privacy | 2 | 2 | BL-960; consent and deletion code |
| content | 2 | 2 | BL-925, BL-965 words |
| ops | 1 | 1 | BL-958, BL-975; CI proposals |
| payments | 2 | 2 | StoreKit only |
| speech | 2 | 2 | packs, `experiments/**` |
| analytics | 2 | 2 | allowlist only; analytics off (D-124 per architecture.md AP-9) |
| product | 2 | 3 | backlog, cards |
| red-team | 1 | 4 | review |
| principal-architect, data-steward, security-architect, compliance-engineer, ai-eng-lead | 1 each | 2 each | lens reviewers; `security-architect` is lens B on 8 wave-1 rows (#847 section 4.4) |
| user-research, regulatory-affairs | 1 | 0 | never dispatched; need an interactive session (#847 section 9) |
| decision-science, legal, marketing, support | 1 | 1 | `paused_until` 2026-10-30, date passed, `paused_reason` still set [V roster; #847 4.4 says the same for `legal`] |
| chief-of-staff | 0 | 1 | digest only |

Team caps: `max_runs_per_day_total` 30, `max_parallel` 6, `max_open_agent_prs` 10 (`agents/roster.json` limits). Agents ask for 50 runs a day (sum of `daily_runs` = 50 [V computed]); 66 open PRs carry an `agent:` label (#847 4.4) [V from that plan]. For wave 1 these caps do not bind, because interactive sessions run the lanes (section 1). They bind the day the lane is switched on (founder Q6, #847 5.3).

Real limit: review. Two counted reviews at the head (D-132; `.claude/skills/review-gate/SKILL.md` section 5) and about 22 minutes of macOS CI per head (section 5 of `HARNESS-GAPS.md`).

## 3. The matrix

Columns: **Has** = lane with evidence. **Lacks** = lane that will be assigned the work and has no evidence. **Owner** = the one lane that builds and answers for it. **Action** = what to do (a charter or memory change is the founder's: propose, do not edit).

| # | Skill | Cards and designs that need it | Has (evidence) | Lacks | Single owner | Action |
|---|---|---|---|---|---|---|
| 1 | Expo, React Native 0.86 New Architecture, Expo Router | all on-device cards; `docs/tdd/new-scope/architecture.md` AP-1 to AP-12 | `mobile` (charter "Expo SDK 57 and Expo Router") | none | mobile | Pack 0 (`KNOWLEDGE-PACKS.md`) lists the 4 files every `mobile` run reads. No gap |
| 2 | Swift native modules, PHPicker, AVFoundation, ImageIO | NS-01 (`scribe-photo`), P-1 progress and Cancel, NS-37 copies, NS-49 Journaling Suggestions, NS-04 spike | `.claude/skills/expo-native-module` (#848); five modules on `develop`; `mobile` built `scribe-photo` | no charter names Swift; `security-architect`'s `review_paths` miss `apps/mobile/modules/**` (#847 section 9) | mobile (build); security-architect (read) | Gap G1. Brief template forces the skill load and the reviewer ask. Propose adding `apps/mobile/modules/**` to `security-architect` `review_paths` (founder: roster) |
| 3 | `expo-sqlite`, local migrations, FTS5 | NS-02 Find, NS-36, NS-37, L11 to L15 (data-and-sync.md) | `mobile` and `sync` jointly own `lib/db/`; BL-952 parts 1 to 5 merged (#881 to #885) | `data-steward` reviews it but has no charter line on FTS | mobile | Pack Find carries the FTS rules (shadow rows, erase order). AP-3 gives the migration test shape |
| 4 | Supabase Postgres, RLS, grants, migrations | server S1 to S5 (data-and-sync.md), NS-08 server, share | `data-architect` (charter); `data-steward` and `security-architect` review `supabase/**` | none | data-architect | CLAUDE.md grants rule and D-041 `approve-migration` are in the pack. Nothing runs against a remote project (never) |
| 5 | Sync, outbox, conflict handling, idempotency | NS-09 R7 to R12, NS-10, NS-14, seals | `sync` (charter), `lib/sync/*` | none | sync | Stand-ins exist: `test/sync-two-phone.test.ts`, `test/sync-held-v8.test.ts`, `test/helpers/sync-v1-standin.ts` [V ls]. Use them, do not write a second |
| 6 | Reanimated, Gesture Handler, motion | `docs/design/system/MOTION.md`, `docs/design/e2e/*/MOTION.md` (branch `docs/e2e-ux-20nov`) | `mobile` (charter); `design-systems` for tokens | nobody owns motion QA (device-only) | design-systems (spec), mobile (code) | Gap G5: motion cannot be shown by a Node test. Every motion PR carries a "what only a phone proves" line (template section 12) |
| 7 | Accessibility: VoiceOver, Dynamic Type AX5, Voice Control, Bold Text | NS-33-R1 to R16, NS-34 | `design-systems` (charter), `mobile` (charter) | Voice Control and Bold Text in no charter; no XCUITest target (11-foundations.md section 3, R16) | design-systems | BL-984 (a) to (c) is the row. Device walk is the founder's (BL-948) |
| 8 | Notifications, background limits, one-a-day budget | NS-13, NS-32, NS-46/47 days, NS-48 | `mobile` ("reminders owner" backlog name); `payments` names notifications for plan notices | no charter owns `expo-notifications` | mobile (reminders owner) | Pack Reminders. `BL-967`, P-3, P-9 first. See pitfalls on `planner.ts` keys |
| 9 | StoreKit | Plus gates, `decide()` | `payments` (charter) | none; sandbox needs founder (BL-102, BL-103) | payments | Out of wave 1. Keep `packages/core/src/plan.ts` as founder code (charter) |
| 10 | On-device speech, language packs | NS-17, NS-16, packs | `speech` (charter); `experiments/**` | none | speech | `speech` has 0 wave-1 rows; wave 5 gated |
| 11 | Search (Find) | NS-02, NS-37 | `mobile`; BL-952 parts 1 to 5 on `develop` | none | mobile | Pack Find |
| 12 | Export and print | NS-01-R14, BL-933, NS-11 | `mobile` ("export owner"); `expo-print`, `fflate` in `package.json` | print layout skill: none | mobile | BL-868 (legal merge first) |
| 13 | Security review | all boundary changes | `security`, `security-architect`, `.claude/skills/infosec` | `security-architect` wip 1, 2 runs a day | security-architect | Gap G3: capacity. Cap of passes per day is the plan's reviewer limit (#847 4.4) |
| 14 | Privacy engineering | consent, deletion, export, labels | `privacy`, `compliance-engineer`, `.claude/skills/early-letters-privacy` | none | privacy (code), compliance-engineer (review) | BL-960 inventory is founder-merged (D-125) |
| 15 | Performance measurement | NS-34, NS-37 | `qa`, `mobile` (budgets in charter) | no `perf` EAS profile, no markers (architecture.md AP-8); no Instruments owner | qa (sheet), founder (device) | Gap G4. Node timing tests are tripwires, never evidence (11-foundations.md section 4) |
| 16 | Test engineering and mutation checking | every row ([X4-R1] etc.) | `qa`; positive controls inside tests (`photos-device.test.ts:392-517`) [V] | no mutation tool in the repo: `grep stryker|mutation` over `package.json`, `scripts`, `docs/engineering/*.md` finds only two unrelated test files [V] | qa (harness), each author (their test) | Gap G2. Manual mutation is the standard (template section 9, "red on old code, red on mutant"). A tool is a founder-approved dependency (AIE-R21) |
| 17 | Release and CI | NS-07 G11, flags, preflight | `ops`; `ios-compile.yml` | `ops` has 1 run a day | ops | `ops` proposes workflow patches under `docs/ops/proposed/`; founder applies |
| 18 | Docs and ADR writing | ADRs, designs | `principal-architect`, `product`, every steward | none | the owning steward | `node scripts/agents/next-id.mjs` before any id (AIE-R25) |
| 19 | Content rules, words | all PROPOSED keys | `content` (charter), `packages/content/test/rules.test.ts` | none | content | Engineers never write words (architecture.md AP-5). Founder approves (BL-965) |
| 20 | Device run sheets | `docs/qa/DEVICE_TEST_PLAN.md` | `qa` per 13 section 2 | no charter lists the device plan (#847 section 9) | qa | Founder proposal: charter line for `qa` (G6) |
| 21 | Journaling Suggestions, PhotoKit library index (NS-49, NS-51, NS-52) | cards on `docs/locked-pack-inputs-20nov`, UNLOCKED | nobody; `scribe-photo` has no PhotoKit call by design (NS-01-R22) | everybody | none yet | Gap G7: no owner. Not wave 1. When a card locks, `mobile` builds it with `expo-native-module` loaded and `security-architect` reading. Conflict with NS-01-R22 (no library permission) goes to `product` first |

## 4. Gaps, ordered by harm

| Id | Gap | Harm seen today | Proposal | Needs founder |
|---|---|---|---|---|
| G1 | No charter names Swift or native review; roster `review_paths` miss modules | #834 (the Swift module) was routed to `principal-architect` and `ai-eng-lead`, not `security-architect` (#847 section 9) [V] | Add `apps/mobile/modules/**` to `security-architect` `review_paths`; add one line to `mobile` charter "load `expo-native-module` before `apps/mobile/modules/**`" | Yes (roster, charter) |
| G2 | No mutation tool and no rule that a new test is run against the old code | Brief names "tests that could not fail". The BL-961 test names the failing assertion on `develop` (PR #879 body) but the pattern is by habit, not rule | Make "red on old code, red on one named mutant" a Done line in every brief (BRIEF-TEMPLATE section 9). AIE-R14 already says it; AIE-G5 is the CI check, not built | Tool: yes. Rule: no |
| G3 | `security-architect` has 1 wip and 2 runs a day, and is lens A or B on about 12 wave-1 rows | Interactive Review B sessions carried it (#847 4.4) | Queue order from `KNOWLEDGE-PACKS-2.md` section 11: its rows are batched by boundary, not by PR. A second reviewer for `scripts/agents/**` and `.claude/**` is not possible without a charter change | Yes |
| G4 | No `perf` profile, no markers, nobody with Instruments | NS-34 rows 1 to 6 cannot be measured by hand at 200 samples (11-foundations.md section 4, "Risk") | Founder accepts a stand-in count in writing, or `ops` and `mobile` land the `perf` profile first (eval B s6.4) | Yes |
| G5 | Motion and VoiceOver cannot be proved by Node tests | Every a11y and motion PR passes CI and still owes a device row | Every such PR lists the device row id it leaves open; `qa` collects them in the Build sheet (#847 section 6) | No |
| G6 | `qa` has no charter line for the device plan | #847 section 9 [V] | Proposal to founder | Yes (charter) |
| G7 | Journaling Suggestions and PhotoKit index (NS-49, NS-51, NS-52) have no owner and sit on an unlocked branch | none yet | Wait for the lock; then see row 21 | No |
| G8 | `user-research` and `regulatory-affairs` have `daily_runs` 0 | BL-935, BL-981 never dispatched (#847 section 9) [V] | An interactive session runs them (#847 section 9) | No |

## 5. Who is the single owner of each file area (for claims)

Taken from each charter's "You own" and the BOARD wave-1 claims (`docs/agents/BOARD.md` on PR #855, lines 12 to 24) [V]:

| Area | Owner | Not theirs |
|---|---|---|
| `apps/mobile/**` | mobile | `src/components/ui/**` (design-systems); `plus`/`purchases` (payments) |
| `apps/mobile/src/lib/db/**` | mobile with sync | migrations (data-architect) |
| `supabase/migrations/**`, `supabase/tests/**` policy tests | data-architect | harness files `harness.mjs`, `run.mjs` (qa) |
| `packages/api/**`, `supabase/functions/**` | sync | deploys (nobody; founder) |
| `packages/content/**` | content | `packages/brand/**` (founder) |
| `packages/core/src/{verify,meaning,types,pipeline,plan}.ts` | founder code | propose by PR with tests |
| `docs/design/**`, `packages/design-tokens/**` | design-systems | |
| `docs/qa/**`, `scripts/trace.mjs` | qa | |
| `docs/legal/**` | legal, privacy (inventory); founder merges (D-125) | |
| `scripts/**` except `scripts/agents/**` | ops | `scripts/agents/**` is `ai-eng-lead` review territory; founder owns |
| `docs/engineering/**` | the chapter's steward | |

## 6. Cites

See the count at the end of `HARNESS-GAPS.md`. In this file: roster fields (python over `agents/roster.json`), `HARNESS.md:11`, `review-gate` section 5, `expo-native-module` section 1, `photos-device.test.ts:405,517`, `ls apps/mobile/modules`, test stand-in files, `grep -lE` of ten words over the charters, #847 sections 4.4 and 9 (read from branch `docs/engineering-project-plan-20nov`), BOARD rows (PR #855). Not read: cards 21 to 27 in full, `docs/design/e2e/**` bodies (index only), eval A, B, C bodies, charters of the five stewards and `red-team`.
