# Inputs register: what engineering must follow, and how firm each input is

Status: v1, 20 Nov 2026, `principal-architect`, task RD-A. Docs only. Facts read 20 Nov 2026 between 17:40 and 18:40 UTC. Tags: [V] verified (command, file or line named), [E] estimate (basis named), [U] not verified.
Rule used throughout: the locked pack at `450bcb4a` is the source of truth (CR-66: cards beat 14 beat 13 and design beat BACKLOG). Everything newer is UNLOCKED input. Where it contradicts the lock, this register says so and the item goes to product. Nothing here decides anything.

## 1. The plain summary

1. Nothing newer than the lock is merged. [V] `gh api repos/thesaurabhpareek/earlyletters/pulls/846`: open, not merged, head `450bcb4a`. `gh api .../pulls?head=thesaurabhpareek:docs/locked-pack-inputs-20nov` returned no PR; the same for `docs/e2e-ux-20nov` and `docs/eng-eval-20nov`. So three of the four product-side branches are branches with no PR.
2. The inputs branch (`bee01360`) is the lock plus 92 changed docs files and 28,147 added lines under `docs/product` (`git diff --stat 450bcb4a origin/docs/locked-pack-inputs-20nov -- docs/product`) [V]. It holds eight new first-run cards, five days and catalogue cards, two photo cards, 23 function files, and records.
3. Cards NS-38 to NS-45 (file 19) carry the status "Locked v1.0 candidate", not locked; NS-46 to NS-50 (file 21) are a "Final holistic draft" that still needs Karma's ruling and the founder's answers (`21:3`); NS-51 and NS-52 (file 27) say "Status: CURRENT" (`27:1`) but are not in #846 and carry open founder questions Q-PM-1 to Q-PM-12 (`27` founder questions table) [V].
4. Founder direction round 2 (file 26) reverses three locked positions: level 3 library read access, no video, one picture per letter (`26:13-15`, GAP-LOG RV-18 to RV-20, `GAP-LOG.md:495-497`) [V]. That is the largest change for engineering. The cards that implement it (NS-51, NS-52) are written, but they are drop C and need the spike, the reversal ruling and counsel first.
5. Our eight designs (`docs/tdd/new-scope/*`, merged 20 Nov 11:12 to 13:00 UTC) cover NS-01 to NS-37 only. [V] `grep -c "NS-3[89]\|NS-4[0-9]\|NS-5[0-2]"` over architecture, security, privacy, data-and-sync, 08 to 11 finds no card id above 37 (only NS-10 first-run material). Nothing designed yet covers NS-38 to NS-52.
6. Plan #847 (`774d3e13`) maps NS-01 to NS-37 only (`17-engineering-project-plan.md:26` "NS-01 to NS-37: 637 row ids at the lock") [V]. It is being refreshed by another agent today; this register does not edit it.
7. `develop` moved after our designs were written: 27 commits since 12:00 UTC (`git log origin/develop --since=2026-11-20T12:00`) [V], head `16e61549` at 17:35. Handoff 24 was written against an older tree and is now stale on at least three facts (section 4).

## 2. Register

Columns: Id; What; Where (branch or path); Head sha; Merged; Firmness; Owner; Last change (UTC, 20 Nov); How engineering uses it; Depended on by (readiness document, RD-x names are the other readiness tasks; folder names are `docs/engineering/readiness-20nov/<folder>/`).
Firmness: LOCKED (in #846 at `450bcb4a`, not yet on develop), CANDIDATE (called locked candidate, not in #846), DRAFT (unlocked, needs rulings), PROPOSAL (design or plan input), MERGED (on develop).

### 2.1 The locked pack (#846)

| Id | What | Where | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| L-1 | Cards 00 to 12 (NS-01 to NS-37), 13 engineering plan, 14 test plan, 15 and 16 council | `git show origin/docs/prd-lock-v1-20nov:docs/product/prd/<file>` | `450bcb4a` | No (PR #846 open) | LOCKED | product | 05:07 (card edits; PR updated 11:36) | The only source for NS-01 to NS-37 rows. Build to row ids; tests titled `[NS-nn-Rn]` | Every readiness document; RESYNC-LIST |
| L-2 | README, errata 18 (E1 to E30) | same; E23 to E30 are on the inputs branch only | E1 to E22 at lock; E23 to E30 at `5b1bd17b` | No | E1 to E22 LOCKED with the pack; E23 to E30 DRAFT (ruled by Karma, applied "in one docs PR after #846 merges", `18:3`) | Karma | 11:36 | Until applied, "engineering builds to this file where it differs from a card" (`18:3`) | PACK-DELTA-6; RESYNC-LIST |
| L-3 | Backlog rows BL-952 to BL-987 | `docs/BACKLOG.md` on `docs/prd-lock-v1-20nov` | `450bcb4a` | No | LOCKED | product | 05:07 | Dispatcher reads develop only, so none of these rows can be picked up yet (card 23 section 0 "Two traps") | RD plan rows |

### 2.2 Newer product material (branch `docs/locked-pack-inputs-20nov`, no PR, merge base with the lock = `450bcb4a`)

| Id | What | Path | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| P-19 | Cards NS-38 to NS-45: download to first kept letter (8 cards, 1,764 lines, 96 P0 rows) | `docs/product/prd/19-from-download-to-first-letter.md` | `736a1cf1` (file); branch `bee01360` | No | CANDIDATE ("Locked v1.0 candidate; needs Karma's ruling on open items", `19:3`) | product | 05:56 | New designs for first run, sign-in, age and region, agreements, first book, first Keep, account life | PACK-DELTA-1 |
| P-21 | Cards NS-46 to NS-50: days, cultural background, notification catalogue, picture-first, Home today (182 rows, 87 P0) | `21-days-cultural-photos-home.md` | `cfeca754` | No | DRAFT ("Final holistic draft", `21:3`; open items for Karma, founder answers Q-FD-*) | product | 16:56 | New designs; drops A, B, C ("Release line and cut", `21:156`) | PACK-DELTA-2 |
| P-27 | Cards NS-51 (photo moments) and NS-52 (pictures and videos with a letter) | `27-photo-moments-and-media.md` | `bf195d36` | No | CURRENT in product's word, unlocked; drop C, spike first (Q-PM-7); founder answers open | product | 17:19 | Library read path, several pictures and video; defaults not decisions | PACK-DELTA-3 |
| P-26 | Founder direction round 2 (photo library moments, pictures and videos) | `26-founder-direction-photos-library-and-media.md` | `f8eead01` | No | Founder words, reversal rulings RV-18 to RV-24 are DRAFT | founder, product | 17:11 | Source of the reversals; sections 1 and 3 bind NS-51 and NS-52 | PACK-DELTA-3 |
| P-20 | Founder direction of 20 Nov (days we mark, notification catalogue, one Home, pictures first) | `20-founder-direction-20nov.md` | `2e75e476` | No | Founder words | founder | 11:09 | Context for NS-46 to NS-50 | PACK-DELTA-2 |
| P-22 | Final holistic spec: what the product does, where each card sits, 7 gates G0 to G6, master founder list | `22-final-holistic-spec.md` | `bf195d36` | No | DRAFT summary (cards win, `22:3`) | product | 17:19 | Read first for tab placement, drop table (`22:59-63`), promises table (`22:69-83`) | PACK-DELTA index |
| P-23 | Dependency map and plan across workstreams (P01 to P12, F38 to F45, D01 to D06, L01 on) | `23-dependency-map-and-plan.md` | `bf195d36` | No | PROPOSAL; "Replaces sections 3 to 7 of `locked-pack-plan.md`" (`23:4`) | product | 17:19 | Sequencing input. Not the engineering plan (that is #847) | RESYNC-LIST; plan rows |
| P-24 | Engineering handoff by `principal-architect` (architecture view per capability, ADR drafts A1 to J, conflicts C-1 to C-24, build steps 0 to 5, questions Q-E1 to Q-E16) | `24-engineering-handoff.md` | `3ff9da55` | No | PROPOSAL (covers NS-46 to NS-52, written before card 27 existed, `24:11`) | principal-architect | 17:16 | Strongest engineering input for NS-46 to NS-52. Parts are stale (section 4 below) | PACK-DELTA-2, -3, -6 |
| P-25 | Instruction coverage audit (QA): is every founder instruction in a file; "NOT READY, 0 of 18 checklist items done" | `25-instruction-coverage-audit.md` | `3ff9da55` | No | Audit | qa | 17:16 | Section 7 checklist is a gate list for "start" | readiness checklist |
| P-F | 23 function files, 741 FR rows, 371 P0 | `docs/product/prd/functions/*.md` (+ BRIEF.md) | `d3b678b4` | No | DRAFT, "Claude roles, not licensed professionals" (`FUNCTION-TRACE.md:3`) | product (function roles) | 17:20 | Expert guidance; extracted in PACK-DELTA-4 and -5 | PACK-DELTA-4, -5 |
| P-T | FUNCTION-TRACE (forward table of every FR, reverse view per card, 177 new engineering rows NR-05 to NR-177, 34 existing rows to change) | `FUNCTION-TRACE.md` (4,239 lines) | `cfeca754` | No | DRAFT, script-built | product | 16:56 | One source for "engineering work not in a card" | PACK-DELTA-4 |
| P-G | GAP-LOG: rulings K1 to K17, RV-1 to RV-24, R-IA, N, CB, DL; "Engineering gaps routed (round 2)" (`GAP-LOG.md:257-345`) | `GAP-LOG.md` (502 lines) | `bf195d36` | No | Rulings are Karma's drafts; founder items open | product, Karma | 17:19 | Rulings engineering must know; gaps routed to BL rows | PACK-DELTA-6 |
| P-B | BACKLOG with 38 proposed rows for P0 gaps (BL-006 to BL-008, BL-017 to BL-019, BL-025 to BL-029, BL-038, BL-039, BL-045 to BL-047, BL-126 to BL-128, BL-181 to BL-188, BL-198, BL-208, BL-291 to BL-298, BL-328); BL-988 to BL-999 | `docs/BACKLOG.md`, `BACKLOG-GAPS.md` | `bee01360` | No | PROPOSED (status "proposed; Karma or the founder sets it to ready", `BACKLOG.md:4058` block) | product | 17:29 | Rows are status `proposed`, so the dispatcher will not hand them out until Karma or the founder sets them ready; they use ids that exist in no heading (BL-006 to BL-049 holes) because the dispatcher reads only `#### BL-nnn` with three digits and BL-999 is used up (`BACKLOG.md:4058` block). BL-045 is NS-51 and BL-046 is NS-52; BL-047 lumps 140 P0 function rows | RESYNC-LIST; plan rows |
| P-M | Founder messages verbatim (turns 720 to 874) | `FOUNDER-MESSAGES-VERBATIM.md` | `3b157194` | No | Source record | product | 17:17 | Check any "the founder said" claim against the words | all |
| P-R | Expert reviews: ten reviews of NS-46 to NS-50 (`tools/review/ns46-50/`), executive reviews r1 to r3, eng input A to C, trace generator | `docs/product/prd/tools/**` | `f8eead01` | No | Input | product | 17:11 | The code facts behind P-24 (mobile.md, security.md, privacy.md, analytics.md, qa.md) | PACK-DELTA-2 |
| P-P | Product thread sequencing input | `docs/engineering/plans/locked-pack-plan.md` | `b01be40f` | No | PROPOSAL; sections 3 to 7 replaced by P-23 | Karma, product | 05:14 | Input to #847 | RESYNC-LIST |
| P-I | First-run auth and compliance inputs (`inputs/first-run-auth-security.md` 344 lines, `first-run-compliance.md` 257) | `docs/product/prd/inputs/` | `bee01360` (added in the diff) | No | Input to NS-38 to NS-45 | product | [U] not dated | Code line cites behind card 19 | PACK-DELTA-1 |

### 2.3 End-to-end design and motion (branch `docs/e2e-ux-20nov`, no PR)

| Id | What | Path | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| E-A | Area A capture: DESIGN, MOTION, WORDS, two HTML prototypes | `docs/design/e2e/A-capture/` | `a1e3fe80` | No | DRAFT v2, re-keyed to the final pack | design-systems | 17:19 | Screen ids A-S01 to A-S18 (18, 3 PROPOSED), 136 states, 66 motion ids | PACK-DELTA-6; RD design rows |
| E-B | Area B book and reading | `.../B-book-and-reading/` | `8585858e` | No | DRAFT v2 | design-systems | 17:15 | 26 screens, 194 states, 71 motion ids | same |
| E-C | Area C keeping and trust | `.../C-keeping-and-trust/` | `f0ad5be3` | No | DRAFT v2 | design-systems | 17:20 | 27 screens, 208 states, 97 motion ids | same |
| E-D | Area D family sharing and reminders | `.../D-family-sharing-reminders/` | `6ade48e2` | No | DRAFT v2 | design-systems | 17:19 | 27 screens, 229 states, 85 motion ids | same |
| E-E | Area E foundations and system states | `.../E-foundations-and-system-states/` | `deda7111` | No | DRAFT v2 (INDEX says "B and E as on disk") | design-systems | 17:17 | 32 screens, 223 states, 82 system state ids E-ST, 96 motion ids | same |
| E-I | Master INDEX (script-built) and IA-AUDIT | `docs/design/e2e/INDEX.md`, `IA-AUDIT.md` | `9e78eecd`, `45b9d42b` | No | DRAFT, machine counts (130 screens, 990 states, 415 motion ids, `INDEX.md` section 1) | design-systems | 17:26, 11:11 | One list of screens. The IA audit proposes the Me regroup after tree test T1 (`22:51`) | PACK-DELTA-6 |
| E-S | Design system v2: FOUNDATIONS, COMPONENTS, MOTION, AUDIT, BRIEF, REFERENCE.html, `tokens.v2.json` (3,101 lines) | `docs/design/system/` | `31269da0`; tokens `de638399` | No | "proposal, 20 Nov" (`FOUNDATIONS.md:3`) | design-systems | 05:47 | Rows DS2-01 to DS2-15, ENG-M1 to ENG-M15, COMPONENTS R1 to R13 are the engineering asks. New dependency questions: `expo-symbols`, `expo-battery` (D-065), `expo-image` | PACK-DELTA-6; RD design rows |

### 2.4 Engineering evaluation (branch `docs/eng-eval-20nov`, no PR)

| Id | What | Path | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| V-A | Eval A: data and sync (408 lines) | `docs/engineering/eval-20nov/A-data-and-sync.md` | `6c011919` | No | PROPOSAL, adopted in `data-and-sync.md` | product thread (evaluation) | 05:27 | Schema, sync, export, deletion. Errata E1 to E12 came from it | data-and-sync |
| V-B | Eval B: mobile client (539) | `.../B-mobile-client.md` | `6c011919` | No | PROPOSAL | same | 05:25 | Module map, state, flags, PR slicing | 08 to 11 |
| V-C | Eval C: platform, quality, delivery (528): ADR 0029 to 0039 reservations, G6 preflight | `.../C-platform-quality-delivery.md` | `6c011919` | No | PROPOSAL | same | 05:24 | Release train M0 to M4, test strategy | architecture, ops |

### 2.5 Our merged designs and standards (on develop)

| Id | What | Path | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| D-1 | architecture (210 lines), security (379), privacy (274), data-and-sync (230) | `docs/tdd/new-scope/` | develop `16e61549` | Yes (#857, #858 and siblings) | MERGED, scope NS-01 to NS-37 | principal-architect, security-architect, privacy, data-architect | 11:14 to 11:42 | Contracts, threat model, class rules, schema register | all readiness documents |
| D-2 | 08-keeping (302), 09-capture (217), 10-reading-and-family (229), 11-foundations (367), facts BL-987 (53), README (40) | same | same | Yes (#863, #864, #876) | MERGED | mobile, sync, ops | 11:12 to 13:00 | Per-card PR breakdowns | plan rows |
| D-3 | Standards: PRINCIPLES, chapters 01 to 10, ADRs 0004 to 0028, RULINGS CR-66, CR-67 | `docs/engineering/`, `docs/adr/`, `docs/agents/cto/RULINGS.md` | `16e61549` | Yes | MERGED | stewards | n/a | Binding rules. ADR 0029 to 0039 do NOT exist (`ls docs/adr` ends at 0028 and 0101) | all |
| D-4 | `docs/tdd/01-mobile-client.md` tag set (Fact, Assumption, Rec, Risk, OQ, Conflict, Unverified) | `docs/tdd/` | `16e61549` | Yes | MERGED | mobile | n/a | Tag vocabulary for readiness documents | all |

### 2.6 Plan and open PRs engineering depends on

| Id | What | Where | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| X-847 | Task-level engineering plan, 771 lines added, maps NS-01 to NS-37 at the lock | PR #847, `docs/product/prd/17-engineering-project-plan.md` | `774d3e13` | No | PROPOSAL (v1; refreshed today by another agent, do not edit) | Karma | 06:04 | Row ids, waves, owners. It says "re-syncs once more when #846 merges" (`17:22`) | RESYNC-LIST |
| X-835 | Photo stack: #835 (migration 11, `entry_media`, +775), #836, #837, #838, #839, #840 open; #834, #841, #842 merged | PRs | #835 `39cf30d3` | Partly | In flight | mobile | 17:16 | NS-52 changes what #835 may contain (card 27 NS-52 section 10 says migration 12; handoff 24 Q-E12 says amend 11 before merge: they differ) | PACK-DELTA-3 |
| X-894 | Find stack 6 of 8 (`bookSearch` pause, flag pattern) | PR #894 | `1fb48f4e` | No (1 to 5 of 8 merged: #881 to #885) | In flight | mobile | 17:35 | The phone-only flag and pause pattern NS-46 and NS-51 must copy | PACK-DELTA-2 |
| X-961 | BL-961 second account: #869 merged; #871 `4879ff5c`, #879 `e27d104e` open | PRs | as stated | Partly | In flight | mobile | 13:00 | Hard dependency of NS-51, NS-52, NS-47 stores | all |

## 3. What is not merged, plainly

- Not merged: every item in 2.2, 2.3, 2.4, and X-847. [V] heads read from `git rev-parse origin/<branch>`.
- Could still move: the lock itself (`450bcb4a` is the PR head; product says it "will not move under the engineering thread", `18:3`); all of 2.2 (product kept committing until 17:29); area files of e2e (A, C, D re-keyed 17:19 to 17:20, B and E "as on disk"); #847 (refresh in progress); the photo and Find stacks.
- The founder's naming of the lock as the source of truth is relayed, not recorded (`17:30`, "Founder record used") [V]. The new cards are not founder-approved: the founder's own words are "approve all requirements" and "Consult with exec team and make all decisions" (`18:E26`; `FOUNDER-MESSAGES-VERBATIM.md:10`) and the pack records every default as taken under that delegation. The cards NS-46 to NS-52 still list founder answers (Q-FD-*, Q-PM-*) that "hold for design and build, never for public text, a counsel answer or a submission" (`22:105`).
- Whether Build 12 or 13 ships what: the founder's (ROADMAP:3). Not decided here.

## 4. Where the newest material is already stale against develop [V]

| Statement | Where | Fact on `develop` `16e61549` |
|---|---|---|
| "`Child.quiet` has no reader" | `24:37`, `24:287`, `22:67` | The planner reads `quiet` (`apps/mobile/src/lib/reminders/planner.ts:78-79`, `prefs.ts:127`). Merged #901 and #902. E16 and BL-985's "planner reads quiet" half is done; the Me control may not be |
| "Sign-out does not cancel reminders (BL-967)" | `24:58`, `24:289` | #904 merged: "signing out ends reminders on every path (NS-13-R14)". Still true: the cold-start tap path has no `getLastNotificationResponse` in `scheduler.ts` (grep finds none) |
| `PlannedKind` at `planner.ts:106` | `24:28` | Now `planner.ts:111`; same three kinds `'evening' \| 'monthAge' \| 'birthday'` |
| "`killSwitches.bookSearch` and photo flags only in open PRs" | `24:71`, `24:290` | `KILL_SWITCH_KEYS` on develop still has eight keys (no `bookSearch`); #896 (BL-958) merged and keeps the photo and Find flags off in every store profile |
| "`#869` merged but not in this tree" | `24:289` | Right. #869 `c1306b18` is on develop |
| `ScribePhoto.podspec:9` says iOS 16.4 while app target is 17.0 | `24:78` | Still true (`podspec:9`, `app.config.ts:44`) |
| No `expo-symbols`, `expo-battery`, `expo-video`, `expo-image`, `expo-media-library` dependency | design system v2 assumes some | `git show origin/develop:apps/mobile/package.json` has none of the five; it has `expo-glass-effect ~57.0.4`, `expo-blur`, `react-native-reanimated 4.5.1`, `phosphor-react-native` |

## 5. How I checked this register

Sampled cites: see `PACK-DELTA.md` section 6 (62 of 62 scripted line cites held after 23 drafting corrections; 22 of 22 code cites on develop held; 6 GitHub facts read by `gh api`). Corrections made in this file: plan line numbers (23, 19, 15 became 26, 22, 30), card 27's status, the commit count (25 became 27), the `26:13-17` range, and this row's dispatcher statement.
