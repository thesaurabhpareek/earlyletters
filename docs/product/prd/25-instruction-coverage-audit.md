# 25. Instruction coverage audit (final, 20 Nov 2026): is every founder instruction in a file, and are we ready to start development?

Status: CURRENT (final audit, rev 2 lock) | 20 Nov 2026 | Owner: `qa` for Karma | Replaces: the morning audit of the same file (head `cfeca754e`, 0 of 18 done), which git history keeps | Load when: deciding whether to start development, closing an audit gap, or answering "where is founder instruction N covered"; otherwise do not load.

Written by the final audit pass on branch `docs/locked-pack-inputs-20nov` (head `40c6eb4aa` plus the edits of this pass) with the design branch `docs/e2e-ux-20nov` (head `7e6849843`) read from `/home/claude/wt/E`. Instructions are the founder's own words in `FOUNDER-MESSAGES-VERBATIM.md` (items 1 to 38; 34 to 38 relayed by the coordinator). Verdicts: COVERED (a file and row id carries it, read this pass), PARTIAL (carried, one named part missing or waiting), GAP (not in any file). "Action pending" is a founder, engineering or harness action with an owner; it is not a gap in the pack. Locked statements were not changed except by errata E33. ASCII only.

Top-line verdict: ready to kick off development (requirements side). Blocking list: none in the pack, no GAP remains. Pending, none of which stops work on rows that already have a ready backlog row: (1) engineering has not answered the plan question on the readiness-folders claim (REST comments of 20 Nov 18:27 UTC, no reply at 18:40 UTC); owner engineering architecture leads. (2) 771 of 1,050 P0 rows (regenerated 20 Nov after E43 to E60; the first audit read 781 of 1,048) have no row-level backlog row, so gate G0 is open; owner Karma, who sets the 38 proposed rows to ready, and the dispatcher four-digit id fix; owner engineering. (3) The PDF is built by `tools/pdf/build.py` but not on Drive; owner the coordinator with the founder's Drive. (4) Founder hands and the counsel batch (22 section 7 F6, F7). This verdict flips to "not ready" if engineering's read finds a row that contradicts another or has no testable line (class C in `FEEDBACK-LOOP.md`).

## 1. The 18-item readiness checklist, re-run

| # | Item | Verdict | Evidence read this pass | Fixed in this pass, or action pending (owner) |
|---|---|---|---|---|
| 1 | One linked set: README, 22 and RESUME list every file | COVERED | `22` section 8 links all cards and 23 function files; `README.md` index table now lists 23, 24, 25, REGISTRY, LOAD-ORDER, RESUME, FEEDBACK-LOOP, FOUNDER-MESSAGES-VERBATIM, 27 | README rows added (was PARTIAL: 23, 24, 25, REGISTRY, LOAD-ORDER, RESUME missing) |
| 2 | NS-38 to NS-50 (and 51, 52) in frame, plan, test plan, rank file | COVERED | `grep -c "NS-4[6-9]\|NS-50"`: `00-product-frame.md` 11, `13-engineering-plan.md` 7, `14-test-plan.md` 7, `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md` 7; NS-51 and NS-52: 7, 2, 3, 2 | none |
| 3 | Dependency map spans NS-38 to NS-52, design system v2 and the release cut | COVERED | `23-dependency-map-and-plan.md` sections 2, 2.1, 6 (6 hits of NS-46 and NS-51); `13` section 5 is superseded by 23 (REGISTRY C13) | none |
| 4 | Every P0 row has a test title and a backlog row | PARTIAL (action pending) | `p0.py --gaps` (re-run 20 Nov after E43 to E60): 1,050 P0 rows, 198 row-covered, 81 cite-covered, 44 card-level only, 727 no mention; 771 without a row-level row (`BACKLOG-GAPS.md` section 1); 38 `proposed` rows exist in `docs/BACKLOG.md` (G01 to G38, ids at or below BL-999) | Section 7 of BACKLOG-GAPS regenerated (771 rows); BL-045 now 26 rows (NS-51-R24 cite-covered by BL-961), BL-046 25 (NS-52-R18 by BL-933), BL-182 27 (adds NS-17-R11, R12). Action pending: Karma sets proposed rows to ready; engineering merges the four-digit id fix |
| 5 | Harness rows for second wave, wave 3, NS-46 to NS-52, the trace, hand-off, at or below BL-999 | PARTIAL (action pending) | The 38 proposed rows in `docs/BACKLOG.md` section "Locked pack: P0 rows with no backlog row" cover G18 to G21 (NS-46 to NS-50), G22 to G35 (function rows), G36 to G38 (NS-51, NS-52, FR addenda); row ids use holes below BL-999 | Action pending: Karma (status proposed to ready; the four-digit fix, owner engineering) |
| 6 | A board line or checkin names the programme threads | COVERED | `docs/agents/BOARD.md` line 100 (product, locked pack programme); the readiness-folders claim (RD-A to RD-G) is open as a docs PR | none |
| 7 | RESUME lists live threads, 03:01 Pacific and the push cadence | COVERED | `RESUME.md` header, "Where the pack stands", "Threads to restart" | RESUME refreshed (stale "header still to do" and "rebuild PDF not done" lines corrected) |
| 8 | Heads equal origin and nothing staged | COVERED | `git status` clean and `rev-parse HEAD` equal to `origin/` after the push of this pass (checked at the end of the pass; see the report) | none |
| 9 | All five design areas carry "Function needs accounted for" and are re-keyed | COVERED | one heading in each of the five `DESIGN.md` files (A, B, C, D, E); area A line 6 and area E lines 10 and 49 state the re-key to cards 19 and 21 | none |
| 10 | Screens exist for the Days page, the Days ask, Home today, the picture start with its level 2 menu | COVERED | `C-keeping-and-trust/DESIGN.md` row C-S24 (Days), C-S25, C-S26; `A-capture/DESIGN.md` `A-S01.dayToday` and `daysAsk` (line 726), A-S16 (one photo from a suggestion), A-S17 (moments) | none |
| 11 | Engineering confirms it has read cards 19, 21, 27 and the trace and accepts or rejects the rows | PARTIAL (action pending) | No engineering reply on the readiness-folders claim at 18:40 UTC (two product comments, 18:27); plan 17 section 11 still cites the lock at `450bcb4a`; engineering findings M29 to M38 of plan 17 section 8 are triaged below | Action pending: engineering architecture leads reply with plan and blockers (founder items 35, 36) |
| 12 | The founder has the plain-words departures list, and his answers are recorded | COVERED | `22` section 7: F1 (level 3 spike), F2 (pictures and videos phone only), F5 (the four 842 departures: Days ask after the first letter, no "East East" option, only ticked days stored, religion and country optional), F6, F7; answered by item 33 (defaults) | none |
| 13 | Gate owners named; gates relate to D-132 | COVERED | `14-test-plan.md` gates G0 to G6; `docs/DECISIONS.md` D-132 is the merge delegation (two counted reviews and green CI), not the build gates | One line added to `14` saying so (the morning audit assumed D-132 held G0 to G6; it does not) |
| 14 | The PDF of the whole pack exists and its file order is listed | PARTIAL (action pending) | `tools/pdf/build.py` builds `/tmp/pdf/early-letters-requirements-rev2.pdf` (page count in the report); order is in the script header and in the PDF contents; binary not committed by instruction | Action pending: the coordinator uploads to the founder's Drive (the Drive connector is not in the pack session) |
| 15 | No locked P0 waits on a Karma decision without a recorded ruling | COVERED | `GAP-LOG.md` K11 to K17 heading says "proposed" but CL-112 (line 623) records K11 and K13 closed and K12, K14, K15, K16, K17 carried into cards in place | none (heading wording left as the record) |
| 16 | Every pack file carries the four-field header | COVERED | scan of 62 files in `docs/product/prd` (cards, functions, inputs, root files) plus the tools: every first 12 lines have `Status:` and `Load when`; `FUNCTION-TRACE.md` and `BACKLOG-GAPS.md` headers added this pass (and `tools/trace-gen/gen.py` emits it); only `tools/review/p0-table.md` has none (the script rewrites it) | headers added |
| 17 | File 26 became NS-51 and NS-52, RV-18 on, addenda in 23 function files; 22, 21 and VERBATIM agree | COVERED | card 27; `GAP-LOG.md` line 495 "Round 2 founder direction (RV-18..)"; 23 of 23 function files contain "Addendum 20 Nov"; `21` lines 61 and 101 cite E32; `22` F1 | none |
| 18 | No non-ASCII punctuation and no real family data in the pack | PARTIAL | ASCII: 0 non-ASCII characters in `docs/product/prd` (all 99 files, `grep -P '[^\x00-\x7F]'`), so no em or en dash, curly quote, ellipsis character or emoji; real family data: `packages/content/test/no-real-family-data.test.ts` NOT run (no npm install, 1.6 GB disk) | Action pending: `qa` runs `npm test` in CI |

Counted: 13 COVERED (items 1, 2, 3, 6, 7, 8, 9, 10, 12, 13, 15, 16, 17), 5 PARTIAL (items 4, 5, 11, 14, 18), 0 GAP. Every PARTIAL is an action with an owner (section 4); none is fixable by editing the pack.

## 2. Founder instructions 1 to 38 (numbers as in `FOUNDER-MESSAGES-VERBATIM.md`)

| Items | Instruction in short | Verdict | Where (file, row or section) |
|---|---|---|---|
| 1, 2, 6 | Scope document, IA, backlog, roadmap, vision, stack rank | COVERED | `00-product-frame.md`, `22` section 3, `docs/product/VISION.md`, `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`, `design/e2e/IA-AUDIT.md` |
| 3, 33 | Delegation and "go with defaults"; lock | COVERED | `22` sections 7 and 10; errata E26 |
| 4, 16 | CPO evaluation, CTO sizing, harness source of truth | COVERED | `13`, `23`, `24`; plan 17 cites the lock |
| 5 | Co-parent caption choice (754 superseded by 756) | COVERED (record) | VERBATIM index item 5 |
| 7, 12, 19 | Deep line-item requirements, all scenarios, download to sign-in | COVERED | card shape in `README.md`; card 19 (NS-38 to NS-45) |
| 9 | Customer first, no PR numbers in product, KPIs, cost | PARTIAL | layer rule in `22` section 10 and REGISTRY; after the manual pass 141 lines in the 21 cards still carry ids (106 in the engineering and gates sections, 36 in acceptance rows as status notes that cross-refer to the trace); 66 prose lines were cleaned. Owner `product` for any further moves |
| 11, 14, 15 | Lock, executive review, detailed PDF, final doc on Drive | PARTIAL | lock `22` section 10; reviews `15`, `16`, `tools/review/`; PDF script `tools/pdf/build.py`; Drive upload pending (coordinator) |
| 13 | Capture executive feedback, research, improve | COVERED | `15`, `16`, `GAP-LOG.md`, `tools/review/r1` to `r3`, `ns46-50/` |
| 17, 18, 20 | Fifteen design leads; design system with Liquid Glass; design gaps back to product | COVERED | `docs/design/e2e/A..E`, `docs/design/system/`, `GAP-LOG.md` area rulings (Apple facts in FOUNDATIONS are the design agent's reading, UNVERIFIED here) |
| 21, 24 | Function agents and gap-filling waves | COVERED | `functions/` (23 files), `FUNCTION-TRACE.md` (947 FR rows) |
| 22, 23, 25, 26 | Harness sync, completion report, restart 03:01, save work | COVERED | `docs/agents/BOARD.md` line 100, `RESUME.md`, pushes on both branches |
| 27 | Days, cultural background, catalogue | COVERED (defaults accepted) | NS-46 to NS-48, `functions/days-library.md`, `cultural-background-data.md`, `notification-catalogue.md`; departures `22` F5; world non-religious days are later than 1.0 (Q-FD-16, accepted default) |
| 28, 32 | Home and Book duplication, default tab, other jobs, photos access, pictures and videos | COVERED | `IA-AUDIT.md`, NS-49 to NS-52 (cards 21, 27), `functions/feature-opportunities.md`, `26` |
| 29, 30 | Pending list; all reviews and final spec | COVERED | `22` |
| 31 | End to end check, plan, dependency map, partner with engineering, tell me when ready | PARTIAL | this audit; `23`, `24`; engineering reply pending (item 11 above) |
| 34 | Finalize and lock, listen to engineering and fix gaps | COVERED | lock; engineering findings triaged in section 3 below; errata E33 |
| 35 | Ask engineering for their plan and what help they need | PARTIAL (action pending) | asked in two PR comments of 20 Nov 18:27 UTC; no reply yet; owner engineering architecture leads |
| 36 | Continuous feedback loop, non sequential, product reactive | COVERED (pack side) | `FEEDBACK-LOOP.md` (quotes items 34 to 40); harness automation is proposal only |
| 37, 38 | Update the harness; backlog for CTO review; inform all agents | PARTIAL (action pending) | proposals P1 to P10 in `docs/ops/proposed/requirements-feedback-loop.md`; agents do not edit `scripts/`, `.github/`, `agents/roster.json`; owner Karma (CTO) |

## 3. Engineering findings since 18:30 UTC, triaged (`FEEDBACK-LOOP.md` section 3)

Comments on PRs 846, 847, 912, 913 created after 18:30 UTC (REST, checked 18:40 UTC): none. The only comments on 913 are product's two of 18:27 UTC; there is no engineering reply. The one change after 18:30 is the plan refresh commit on the plan branch (18:33 UTC, `17-engineering-project-plan.md` section 8, mismatches M29 to M38). Triage of those findings against the pack:

| Finding | Class | Result |
|---|---|---|
| M29 photo slice sizes over the founder's exception | E (founder) | Founder accepts or refuses at the new sizes; owner founder; recommendation: accept, slices are reviewed in series |
| M30 NS-01-R20b VoiceOver order vs the built Change position | C (design, QA) | Not closed here: it changes what a VoiceOver user hears. Recommendation: keep Change under the picture and amend R20b; owners `design-systems`, `qa` |
| M31 BL-952 says "at most six" PRs; the split is eight | B1 | Closed in place: `docs/BACKLOG.md` BL-952 heading and scope now say eight (the list of the eight is from plan 17, UNVERIFIED here) |
| M32 BL rows cover fewer P0 rows than the cards | A | Answered by `BACKLOG-GAPS.md` (groups G01 to G38 and section 7 regenerated); no card edit |
| M33 NS-05-R10a to R10c name `tmp/share` | A then B2 | Closed by errata E33 with a Plan delta line (AX-9 of CR-67: one Caches folder per feature) |
| M34 NS-17 section 10 and R8 vs immutable `held_drafts.raw_transcript` | A | Already E7 and E24; the constitution reading stays the founder's (class E, recommendation attached in E24) |
| M35 export minor and kill-switch header cites | A | E5 and E21 |
| M36 NS-32-R4b and R7 (60 plus 4) | A | E13. NS-01-R41 "line colour" contrast (1.40:1 in dark mode vs 3:1): class C (design); owner `design-systems` |
| M37 eight card gaps (P1 to P8) | A for six, C for two | Six are ruled in `GAP-LOG.md` (area A G-11, G-17, W7; area D V-2); the NS-18 typed words vs Home slip order and NS-13 3a item 1 vs the built planner need a design and mobile read: class C, UNVERIFIED which rows remain |
| M38 `18-errata-after-lock.md` missing | A | The file exists on the pack branch; CR-66 keeps its name |

Class D (another executive's domain): none. Class F (missing fact): the PDF-independent facts are marked UNVERIFIED above.

## 4. Action pending, by owner

| Owner | Action |
|---|---|
| engineering architecture leads | Reply to the plan and help question (items 35, 36); confirm reading of cards 19, 21, 27 and the trace; accept or reject the rows of `BACKLOG-GAPS.md`; four-digit id fix (PR 912) |
| Karma (CTO) | Set the 38 proposed rows to ready; CTO review of the harness backlog and proposals P1 to P10, then tell all agents their operating style (items 37, 38); merge the pack PRs under D-132 |
| founder | Founder hands list (`22` section 7 F7); counsel batch (F6); the sizes exception M29; constitution reading for NS-17 (E24); approve public words |
| coordinator | Upload the PDF to Drive; relay the lock to the harness thread |
| qa | Run `npm test` for the content and no-real-family-data tests; regenerate `14-test-plan.md` section 7 if a card changes |
| design-systems, qa | Class C items M30, M36 (NS-01-R41), M37 two rows |

## 5. What I did not verify

- No test, build or script of the app ran; no `npm install` (disk). The pack scripts `p0.py`, `trace-gen/gen.py` and `check.py` ran (check.py passed, 947 FR rows).
- The wording of the founder messages 34 to 38 is as relayed by the coordinator, not read from the chat.
- Whether engineering replied somewhere other than the PR comment threads (for example a chat).
- Apple, legal and holiday facts: not in scope; each file marks its own.
- The eight-PR list for BL-952 and the plan 17 mismatch rows: read from the plan branch, not re-checked against GitHub.
