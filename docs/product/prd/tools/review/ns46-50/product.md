# Review of NS-46 to NS-50 from the product scope and coherence lens

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

Reviewer: product lens (a Claude role, not a licensed researcher, lawyer or engineer). 20 Nov 2026. Docs only. I changed no other file.
Card file reviewed: `docs/product/prd/21-days-cultural-photos-home.md` (1063 lines, read in full). Read also: BRIEF, `20-founder-direction-20nov.md` (full), `GAP-LOG.md` rulings R-IA, N, CB, DL, K (lines 401 to 460), `18-errata-after-lock.md`, `functions/BRIEF.md`, `functions/feature-opportunities.md` (full), `functions/research-validation.md` (rows FR-RSH-01 to 25 and the study table), `functions/back-office.md` (sections 1, 4 and a grep for these cards), `functions/support.md` (coverage table), `FUNCTION-TRACE.md` (grep), `00-product-frame.md` (opportunity tree, principles), `docs/release/1.0.0.md`, `docs/BACKLOG.md` BL-963, 966, 982, `packages/api/src/kill-switches.ts`, `apps/mobile/src/lib/capabilities.ts` (grep).
Not read: `docs/design/e2e/IA-AUDIT.md` (worktree `/home/claude/wt/E`), `functions/days-library.md` beyond a grep, `photos-and-suggestions.md`, `notification-catalogue.md`, `cultural-background-data.md`, NS-01, NS-13, NS-18, NS-23, NS-32, NS-35 in full. I rely on the card file's account of them and mark it where that matters. I read no outside web page this session, so every outside fact below is UNVERIFIED or taken from the repo.
Method check: I recounted the trace table. Rows and P0/P1/P2 splits match the card (46: 14/13/1, 47: 17/9/1, 48: 11/15/1, 49: 17/9/1, 50: 4/7/1). Total 28+27+27+27+12 = 121 rows, 63 of them P0.

## 0. Summary for Karma

The five cards are coherent with the constitution and the three-tab IA almost everywhere, and the discipline is good (nothing ticked for the parent, no new class, slip not strip, level 3 closed). The weaknesses are about scope and order, not about intent:

1. The pack has no release cut. 121 rows, 63 P0, and nothing says which of it is 1.0, build 13 or 1.x. Most of it stands on planner work that is not built (typed days, budget, anchor, quiet reader) and on external gates (counsel, tradition reviewers, an App Review reading of a faith question, a device walk). Proposed: a cut with three drops (PR-01).
2. The Days ask slip is ranked above Save a copy. That puts an Attractive one-time ask above a Must-be trust slip, against frame principle 2 (PR-05).
3. NS-50 does not make Home richer on a normal day, and the pack widens triggers, not the job. Say so plainly rather than claim it (PR-06, PR-07).
4. Three tester-sheet measures contradict the research rules or cannot work with five parents (PR-11, PR-12, PR-13).
5. Card 21's founder table is missing items and crams seven questions into one row (PR-14, PR-15).
6. One real constitution ambiguity: a phone-written title can land in the parent's photo words (PR-09).

Verdicts: NS-46 CHANGES, NS-47 CHANGES, NS-48 CHANGES, NS-49 CHANGES, NS-50 CHANGES. No BLOCK. No finding stops a docs merge; P1 items must be fixed before build starts.

## 1. Findings

Severity: P0 blocks build, P1 fix before build, P2 note. Evidence file lines are in `21-days-cultural-photos-home.md` ("21:") unless named.

### PR-01. No release cut; 63 P0 rows with no line between 1.0, build 13 and 1.x (all five cards; P1)
Evidence: 21:15 "Timing: cards state order and gates only (ruling T5)". Card sections 22 list gates but not a line. `docs/release/1.0.0.md` section 0 says the App Store 1.0.0 lane "has not started" and is re-planned after the alpha (D-106). README "Studies" table (README lines 145 to 160) puts photos and Find in Build 13, Share in Build 14. Errata E30 says about 70 P0 rows already have no backlog row and G0 cannot pass until each has one; this pack adds 63 more. 21:234 and 21:632: `planner.ts` kinds are only `evening`, `monthAge`, `birthday`; `typedDay` is "a design and a row, not shipped". BL-982 is `blocked (BL-966, BL-943)` (`docs/BACKLOG.md:3934-3935`).
Why it matters: the founder asked "what should wait for 1.x versus build 13". T5 forbids dates, not a cut. Without a cut the cards read as one release and the first App Review submission would carry a faith-adjacent question, a new entitlement, two new settings and a new planner source together. The superseded ROADMAP already named an App Review rejection on a data question as its largest risk (`docs/ROADMAP.md` section 0, 5.1.1(ix); the plan is superseded, the lesson stands).
Proposed card wording (new section "Release line and cut" after "Founder items", an order and gate statement, no dates):

| Drop | Contents | Gate that must be true first | Line |
|---|---|---|---|
| A (can ride a near build, independent of the rest) | NS-49 level 1 only if the A-S01 re-draw passes its AX5 test (see PR-08); NS-48 phase 1: the day-part filter and weekday tone on the built 8 (NS-48-R6, R12, R13, R16, R23, R24). No new setting, no new stored field except "last chosen key" | NS-01 is on `testflight`; no planner change beyond words | Build 13 or the next build; no gate beyond CI and the rules test |
| B (after the planner foundations) | NS-46 seasonal, family and civic days for the US only, plus the plain browse-and-tick list in Me (the CUL-Q8 fallback, already specified, no ask slip, no tradition or country), with NS-50 rank 2b | BL-966, BL-982, BL-963, BL-985 done; NS-48-R26 confirmation of where the budget is enforced; the days store registered and Erase-scanned (NS-47-R1, R15, R16 only); counsel on date-table licence for any table copied (rule-computed dates need none, DL-4) | 1.0 only if every gate is closed before freeze; otherwise 1.1 |
| C (after 1.0 is approved) | NS-47 ask slip (rank 2c), tradition and country browse, culture-led days, tradition-member review (DL-8), day-name switch, NS-48 recency and last-letter layers (need NS-13 anchor), NS-49 level 2 behind `EXPO_PUBLIC_SUGGESTIONS` | Counsel CUL-Q5 to Q7 and Q11 on record; J-CUL-01 device walk; a named reviewer per tradition shipped; NS-13 anchor built; entitlement approved if Apple requires it | 1.x |

Why this split is sound: drop B needs only NS-47's store rules and none of its question; the ask, the tradition lists and the country list are the parts that carry the Article 9 and 5.1.1(iii) questions (21:487, 21:464, both UNVERIFIED, counsel must confirm). Drop C is the part the founder can still have, one release later, with the first review already behind it. This does not reopen CB-6 or DL-7; it sequences them. The founder decides (new Q-FD-7).
Also add to section 22 of NS-46 and NS-47 one line: "Ships in the drop named in the cut; a row not in the drop is not a P0 for that build".

### PR-02. P0 inflation: some P0 reasons are not promises, store duties or the core loop (NS-46, NS-48; P1)
Evidence: README Priority rule (21:13) says a P0 carries an RR-4 reason (a), (b) or (c).
- NS-48-R8 is tagged P0 (c) "core loop". A chosen day taking the slot is not the core loop (Home, speak, keep). It is a ruled ordering (DL-2). P1.
- NS-46-R5 (recurs yearly, P0 (a)) is the feature working, not a promise to the parent until a claim exists. The promise it protects is "a typed day never recurs" (NS-18-R7); the second half of R5 is the P0, the first half is P1.
- NS-46-R13 (landing opens within 2 seconds, P0 (a)) is a latency budget; it duplicates NS-13-R9 (cited in section 8). P1.
- NS-48-R26 is a precondition (confirm where the budget is enforced), not a behaviour. Keep P0 but retitle as a gate and give it a backlog row first.
Why: every P0 needs a backlog row before G0 (E30). Inflated P0s lengthen the G0 list the team cannot yet close.
Proposed change: re-tag NS-48-R8 and the landing-time half of NS-46-R13 to P1; split NS-46-R5 into R5a (typed day still deleted after delivery, P0 (a)) and R5b (ticked day recurs, P1). Net P0 count 63 to 60.

### PR-03. Dependency chain is longer than the cards say, and one precondition is circular (NS-46, NS-47, NS-48; P1)
Evidence: NS-46 section 22 lists BL-982 and BL-966; BL-982 is blocked on BL-966 and BL-943 (`docs/BACKLOG.md:3935`). BL-966's scope still says classes "evening, monthAge, birthday, typedDay, plan" (`:3831`), so `libraryDay` as a ranked source of the `typedDay` group is not in any row. NS-46 section 22 says "NS-47 shipped with it", NS-47 section 22 lists "NS-46" first: each gates the other. R-IA-6 says `setChildQuiet` has no reader in the planner (inference); E16 says the same for `Child.quiet`, and BL-985 is the row.
Proposed wording:
- NS-46 section 22 and NS-47 section 22: "NS-46 and NS-47 are one release unit behind one flag (`EXPO_PUBLIC_DAYS`); neither ships alone, except the Drop B subset in the cut". State the build order once: BL-966, then BL-963 and BL-985, then BL-982, then NS-46 planner source, then NS-48 key function, then NS-50 ranks, then NS-49 level 2.
- New row NS-46-R29 (P1): "Given BL-966's registry, When `libraryDay` is added, Then it is a ranked source inside the `typedDay` group, `PlannedClass` gains no member, and the registry test that rejects an unregistered class stays green. Test `[NS-46-R29] libraryDay adds no class to the registry`." This is the NS-32-R3/R5 change already in 21's "Changes these cards ask" table; a row makes it testable.
- Ask product to amend BL-966's scope text to name the `libraryDay` rank (a backlog edit, the product role's job, not made here).

### PR-04. The remote pause may not reach the builds that carry the feature first (NS-46; P1)
Evidence: 21:158 says "Kill switch `serverFeaturesEnabled()` off: No effect; nothing here uses the server", yet NS-46-R28 relies on `killSwitches.libraryDays`, a value that arrives by signed remote config. `packages/api/src/kill-switches.ts:1-8` header says each switch "only stops a server-dependent feature ... none can turn a feature on" and lists a closed vocabulary with no `libraryDays` (lines 10 to 40). E21 already asks engineering to update that header because `photos` and `bookSearch` hide phone-only screens. E20: TestFlight runs servers off, so a value delivered by the server is unreachable there. `apps/mobile/src/lib/capabilities.ts:268` reads `killSwitches?.[feature] !== true`, so adding a key is cheap once the vocabulary and the signed config carry it.
Why: the pause is justified as the control for "the failure mode with the highest cost to trust" (21:230). In a servers-off alpha it does not exist, and the card's state table says the opposite.
Proposed wording: NS-46 section 6 and 9 row "Kill switch `serverFeaturesEnabled()` off" becomes "The remote pause cannot be delivered; the library stays as shipped. Mitigation in a servers-off build: the flag `EXPO_PUBLIC_DAYS` is off by default in that profile; a wrong date there is fixed by a new build". Add to NS-46-R28: "and `libraryDays` is added to `KILL_SWITCH_KEYS` and the M-block comment, older signed configs parse it as off". Add to section 22: "ADR 0029 key list and `kill-switches.ts` change (engineering row)". New founder item DAY-R default stays "Yes".

### PR-05. The Days ask outranks Save a copy (NS-50-R5, NS-47-R19; P1)
Evidence: 21:901 and NS-50-R5 order: (1) waiting set, (2) seal-opened, (2b) day today, (2c) Days ask, (3) Save a copy, (4) past letter. BL-963 today: Save a copy is rank 3 in the birthday week (`docs/BACKLOG.md:3804-3812`). Frame principle 2: "Must-be items (never lose a letter ...) ... are never traded for an attractive item" (`00-product-frame.md` line 15). Save a copy is the "I can't lose this" trust slip (NS-11); the Days ask is Attractive (21:313). Conflict 7 (21:76) names the issue and defaults to (2c).
Proposed wording (NS-50-R5, NS-47-R19, `[FRAME-SLIP]` change): order (1) waiting set, (2) seal-opened, (2b) a day we mark today, (3) Save a copy, (4) the Days ask, (5) one past letter. Reason in the row: "a trust slip before an Attractive ask". A day we mark today stays above Save a copy because the parent asked for it and it is date-bound. The Days ask is once-only, so placing it above the past letter does not starve it. Slip test T3 may move it again. This replaces the default in Conflict 7; Karma to confirm.
Related P2: new-parent week one now holds the Keep gate, the reminder ask, the Days ask and possibly Save a copy. NS-47-R19 already spaces the ask after the reminder ask (R31 cap) and a later sitting, which is good. Add to NS-47 section 21: record how many asks a parent was shown before the first week ended (a count of asks, never of gaps).

### PR-06. NS-50 does not give Home more on a normal day; the card should say so (NS-50; P1)
Evidence: founder asked "Home is not too thin to be the default tab" (direction 1, item 4). NS-50 section 1 says Home "is not thin" (5 content elements, 4 actions, 0 to 1 slips, citing IA-AUDIT, which I did not read; design judgement, not observed, 21:898). A ticked day fires on at most a handful of dates a year for a parent who ticked a handful; first-run parents tick nothing (21:150, 21:930). So on most days Home is exactly as it was.
Position: this is a coherent answer (a feed would break the frame and R-IA-3 is ruled), but the card claims more than it delivers. T3 (21:1012) tests slip versus strip, not "is Home enough to be the default tab".
Proposed wording:
- NS-50 section 2 add: "On a day with nothing marked, Home is unchanged by this card. This card does not claim to answer whether Home is enough; that answer rests on IA-AUDIT and a default-tab check (NS-50-R13)".
- New row NS-50-R13 (P2): "Given S1 task set A on the e2e prototype, When five parents open Home with nothing marked and are asked 'what is this screen for' and 'would you open this or Book first', Then the result is recorded as x of n with a stop line if any parent says 'there is nothing here'. Test `[NS-50-R13] default tab check`" (research plan row, no build).
- A cheap freshness lever that needs no new surface is OPP-03 (same question a year on, `functions/feature-opportunities.md` section 6.2). Honest caveat in PR-07.

### PR-07. The pack widens triggers, not the job (cross-card; P2 note with one proposal)
Evidence: all five cards serve one job, "start a letter" (days, a note's words, a picture start, a Home line). Of the founder's ten candidates (direction 6.4) only picture-first and suggestions are new; five are carded, four parked with a reopen test (`functions/feature-opportunities.md` section 2). OPP summary: top new items after OPP-01 are OPP-03 (same question again), OPP-02 (doorway, needs the NS-04 spike), OPP-04 (child's own words), OPP-05 (bring in what the parent already has) (feature-opportunities lines 117 to 123).
Position: that is right for now. Frame principles 4 and 5 (confidence written down, appetite before solution) say do not widen before first-run evidence (S2, RA-06). I recommend no further card now. Two honest notes:
- OPP-03 cannot work for a long time. It offers a prompt "a year or six months earlier" answered (feature-opportunities 6.2). A new app has no such answer until 6 to 12 months after a parent starts. It is a 1.x card with a built-in delay, not a cheap fix for a thin Home this quarter. Correct the "cheapest" label in OPP section 5 for the Home-freshness use (a note to Karma, not a change here).
- The pack touches the job's second axis only through NS-49 level 2, which starts from what happened (an event) rather than a prompt. That is the one real widening, and it is why NS-49 earns its place.
Proposed: add to "Conflicts and open items" (or the cut) one sentence: "This pack adds ways to start; it does not add a second job. OPP-02, 03, 04 and 05 stay candidates until S2 first-run evidence (RA-06)". Founder question Q-FD-8 (default: no further card before S2).

### PR-08. "First-class start" is not testable and the card contradicts itself (NS-49-R1, section 23; P1)
Evidence: NS-49-R1 (21:761): "one of the equal starts ... no larger than Speak, Home's one primary action stays Say". Section 3.1 (21:704): "one of the equal starts next to Speak and Type". Section 23 (21:887): "Speak and Type stay the equal twins; the picture start is the third item, as NS-01 draws it, until a study says otherwise". Direction 6.1: "make picture-first entry a first-class start on Home". FR-OPP-02 asks for the A-S01 version tested on an SE 3 at AX5 (feature-opportunities lines 212, 243). Three statements, not one.
Why: build cannot satisfy "equal" and "third item" together. Also Home must still fit at AX5 on 375 pt, and the Home content stack is already long (feature-opportunities lines 82 to 84).
Proposed wording (NS-49-R1): "Given Home at default size and at AX5 with Bold Text on an SE 3, Then 'Start from a photo' is a control of at least 44 pt with the same type role as 'Type', placed in the capture cluster after Speak and Type, never larger than Speak; at AX5 all three controls are reachable without the Home first screen scrolling Speak off view. Test `[NS-49-R1] picture start sizing at AX5`." Section 23: delete the contradicting default and state "equal weight to Type, third in order" as the design default, ruled by the A-S01 test (FR-OPP-02). If the A-S01 AX5 test fails, level 1 stays as built and ships nothing new (this is the cut's Drop A condition).
Also P2: OPP C-1 asked that picture-edge defaults G-08, G-14, G-15, G-19 apply to the new start. They are existing GAP-LOG defaults (`GAP-LOG.md` lines 75 to 86). Add one sentence to NS-49 section 3: "A level 2 picture goes through the same path, so those defaults apply unchanged".

### PR-09. A phone-written title can enter the parent's photo words (NS-49-R9; P1, escalates to P0 if prefilled)
Evidence: CLAUDE.md constitution: "No feature may write ... or shape a person's words." NS-49-R9 (21:769): a suggestion's title and date show as an editable label marked as the phone's, "stored only if the parent keeps the letter, held in the existing editable fields (`photo_text` and the letter date), never prefilled into the letter's words". Section 11 (21:826): the title becomes `photo_text` (L4) once kept. After Keep, nothing marks that text as the phone's. How Apple derives the title is UNVERIFIED here (I read no Apple page this session).
Why: if the label sits in the field and the parent presses Keep without touching it, a phrase the machine wrote is stored as the parent's own photo words. The constitution says the machine may remove and repair, never add.
Proposed wording (NS-49-R9): "Given a suggestion with a title, Then the title shows above the picture as 'From your phone: {title}' with a 'Use this' control; the photo-words field starts empty; only a tap on 'Use this' copies it into the field, after which it is the parent's text and is edited like any other; Keep without a tap stores no title. Test `[NS-49-R9] the phone's title is never stored unless the parent takes it`." Date: unchanged (parent-confirmed only, NS-01 OQ-1). Same change to section 11 (title retention "memory only unless taken") and to the A-S04 `suggestionLabel` state.

### PR-10. The day-name switch adds a second names switch in Reminders; place it where it explains itself (NS-47-R12, R14; P1)
Evidence: Conflict 1 (21:70) admits "A parent then sees two name switches in Me, Reminders". NS-47 section 15 puts the day-name switch in D-S06 under the names switch. CB-5 requires it to be separate; it does not say where it lives.
Why: Me is already under strain (R-IA-4 regroup). A second names switch beside the first invites the exact confusion NS-47-R14's help line has to repair. The day-name switch only matters once a parent has ticked a day.
Proposed wording (NS-47 section 15, NS-47-R14): the day-name switch lives on the Days page (C-S24), under the list, shown only when at least one day is ticked, with its own help line; D-S06's help line for "Names in notifications" says "This is for your child's name. Days have their own choice on the Days page". CB-5 stays true (separate, default off, forced off with App lock). Cost: C-S24 gains one row and a disabled-with-reason state. Karma to confirm, since it moves a row but changes no ruling.

### PR-11. NS-46 section 21 conflicts with the research rules on faith (NS-46 section 21; P1)
Evidence: NS-46 section 21 (21:299): "one question about wrong dates per tradition". NS-47-R27 (21:404): the sheet "never [asks] a tester's own faith or origin, records none". FR-RSH-17 (research-validation) and FR-RSH-15: no real participant data, notes by code only. A per-tradition date check needs the tester to say which tradition they keep.
Also: a usability test of NS-46 and NS-47 with real days needs real traditions, while the fixtures forbid pairing a real tradition with Asha (21:17). Five parents cannot cover several traditions anyway.
Proposed wording (NS-46 section 21): delete "one question about wrong dates per tradition". Date correctness is checked by the tradition-member reviewer (NS-46-R23, DL-8) and the October review (NS-46-R24), not by testers. The tester sheet keeps: ticked a day without help; the note landed on the date shown; felt guessed at (reaction only). Pass line unchanged; add the pass-chance table reference (FR-RSH-24) because "4 of 5" with n=5 needs it.

### PR-12. NS-48 retirement by tester sheet cannot work (NS-48-R17, section 21; P1)
Evidence: NS-48-R17 (21:592): a variant is retired "if testers turn reminders off within a day of seeing it, measured by the tester sheet, no analytics". Section 21 (21:682) repeats it per variant. NS-48 itself says evidence for variety is a hypothesis (21:518). With about 128 variants launch floor and five testers, each variant is seen by almost no one; analytics is off through 1.0 (frame line 36, D-124). A parent who turns reminders off cannot say which line caused it.
Proposed wording: NS-48-R17 becomes "a variant is retired by editorial review (content plus the S6 reading test, FR-RSH-08) when a reader says it feels like a judgement or a count; it is never retired by an inferred cause". Section 21: use the existing S6 reading test (five printed or on-screen mock notes; stop line "made me feel I was failing", FR-RSH-08) on the shapes of the 20 grid cells, and the existing NS-13 yes-or-no question for reminders still on after two weeks (frame line 47). Add measure: "reminders still on after 2 weeks, before and after the catalogue, x of n, a stand-in if n is under 5".

### PR-13. Level 2 cannot be usability-tested under the research rules as drawn (NS-49 section 21; P1)
Evidence: FR-RSH-15 (research-validation): no participant creates, imports or shows their own picture; Asha-only install; pre-G0 sessions are moderated on a founder-owned phone (FR-RSH-03). Apple's suggestions list is built from the phone's own library, so a tester sees the founder's real moments, or none. NS-49 section 21 (21:880) asks "Did you start a letter from the recent-days list this week?" and "3 of 5 try it without help", which needs a hand-held build and the tester's own library.
Proposed wording: split NS-49 section 21 into (a) two past-behaviour questions now, no device (already in the OPP-01 plan: "The last time you took a picture of {child} ...", "Did you ever want to say something about it and not?"; pass 4 of 5 name one); (b) a founder-run device walk of level 2 on the founder's own phone, never a tester session, recorded as pass or fail of NS-49-R6, R7, R10, R11, R12 (the P0 rows) and nothing about tester behaviour; (c) the "tried it this week" question only after the flag is on for the founder's family after G0 (FR-RSH-03 row 1). State plainly that level 2 desirability has no pre-build test beyond (a).

### PR-14. Founder-items table is incomplete (21:49 to 66; P1)
Items present in the cards but missing from the table:

| Missing item | Where it appears | Proposed default |
|---|---|---|
| DL-7 which countries after the US | NS-46 section 23 says "see Founder items"; the table has no DL-7 row | US only; the founder names a country field in scope before any other country (as DL-7) |
| Q-DAY-8 regional or sub-community days (Pongal, Onam, Parsi New Year) in the first release | NS-46 section 23 | Not in the first drop; a later drop after the tradition review exists for them |
| How many traditions in the first tradition drop, and who reviews each | DL-8 "a member of each tradition reviews its rows"; NS-46-R23. Recruiting or paying a reviewer is a founder act | Ship no tradition without a recorded reviewer; start with the traditions the founder can reach reviewers for; none is announced as "all" (21:293) |
| Named owner of the October review | NS-46-R24 says "a named `content` owner" (an agent lane cannot own a calendar duty alone, and sources need judgement) | Founder named as accountable; `content` does the read; the date goes on the weekly card (back-office FR-BKO-23) |
| Counsel questions CUL-Q5, Q6, Q7, Q11, Q-DAY-6, Q-DAY-11, FR-DAY-23 licence, 1.1.1 reading | NS-47 sections 13, 17; NS-46 section 17. These are founder-to-counsel hand-offs | Flag stays off until counsel answers; the Drop B subset needs only the licence question for any copied table |
| Which drop ships when | New (PR-01) | The cut in PR-01 |
| Whether to add further cards (OPP-02 to 05) | New (PR-07) | None before S2 |
| The Apple developer-portal capability for `com.apple.developer.journal.allow` | Q-PHS-3 default says "mobile enables the capability in the spike's step 1" | A founder hands row: an App ID capability lives in the founder's Apple account, so it is not Mode `agent` (backlog rule). Whether Apple must approve the entitlement is UNVERIFIED (21:853) |
| Conflicts 1, 2, 5, 7 | Section "Conflicts and open items for Karma" | Not founder items; keep with Karma, but conflict 1 (two name switches) is parent-visible, so Karma's answer is reported to the founder |

### PR-15. Table hygiene: overlapping ids and a seven-question row (21:49 to 66; P1)
- Q-FD-2 (when to ask) and CUL-Q10 (when to ask) are the same question with two ids and two defaults. Q-FD-5 (phone only) and CUL-Q2 (store only ticked days) overlap on the same store decision. Merge each pair into one id, keep the stricter default.
- The row "Q-PHS-1 to Q-PHS-7" (21:66) holds seven questions and seven defaults in one cell. A founder cannot answer a cell. Split into seven rows (the PHS review owns the wording; I did not read it). Q-PHS-1 (level 2 timing) and Q-PHS-2 (iOS floor) are the two a founder must answer first; the others are `mobile`'s or counsel's.
- "Q-NTC-5, Q-NTC-8, Q-NTC-9" (21:65) is the same problem on a smaller scale. Q-NTC-8 "floor at freeze or full set" is the founder's real question and links to PR-12 (the full set is unmeasurable pre-launch); recommended default: floor at freeze, full set after the S6 reading test.
- The header sentence "a default is the requirement for design and build, never for public text or a store submission" is right; add that a counsel answer is also never defaulted.
- The Defaults themselves: Q-FD-1 (no option), Q-FD-3 (yes), Q-FD-5 (yes), CUL-Q3 (clear, CB-4 ruled), CUL-Q4 (exclude from backup), CUL-Q9 (yes, CB-5), DAY-R (yes) are sound and need no change. Q-FD-4 is sound. Q-FD-6 is sound.

### PR-16. Days ask promises a note that a denied notification permission cannot deliver (NS-47-R19; P1)
Evidence: ask text (21:323): "Would you like a note on days that matter to your family?" NS-46 section 5 (21:134): with notifications not allowed in iOS, ticking works, "one line says notes need permission, with no promise of delivery and no second ask". NS-47-R19 conditions the ask on the reminder ask being answered or capped, not on the permission state. A parent who denied permission is offered a feature whose promised result cannot arrive, then told so after ticking.
Proposed wording (NS-47-R19): add "and the ask is not shown when the phone's notification permission is denied; Days stays in Me, where its permission line explains. Given permission is undetermined, the ask is shown and ticking does not trigger Apple's permission prompt (NS-13's ask owns that)". Test `[NS-47-R19]` gains a denied-permission case. Alternative for Karma: show Home's day slip (NS-50) as the fallback delivery when permission is denied; it works with no permission and is already in the card (NS-50 reads the store, not the scheduler), so say in NS-46 section 5 that a denied-permission parent still sees the day on Home when opened that day.

### PR-17. Days has no fallback place if tree test T1 has not run (NS-46, NS-47; P1)
Evidence: R-IA-4: "the Me regroup ... is adopted for design, built only after tree test T1". NS-46 section 3.2 puts C-S24 in a new "Notes and days" group "built only after T1"; section 22 gates the card on T1. If T1 has not run, there is no stated home for the page, and the typed-day list currently lives on the Reminders page (21:86).
Proposed wording (NS-46 section 3.2): "If T1 has not been run, C-S24 is one row 'Days' inside the existing Reminders group (typed days move there from the current list), and the regroup is applied later without changing the page". NS-46-R3 test gains that case. This keeps R-IA-2 (one list) true on both paths and removes T1 as a hard gate on the feature.

### PR-18. Back office and support have no rows for these cards (NS-46, NS-47; P1)
Evidence: `FUNCTION-TRACE.md` line 14: "no function reviewed them". `functions/support.md` coverage table stops at NS-45 and says NS-18 typed days needs "an article only" (line 77). `functions/back-office.md` line 132 access matrix lists "typed days (L4)" but has no row for the days store, and no row for who flips `killSwitches.libraryDays` or how fast. NS-46 itself leans on "support has a macro (FR-DAY-21)" (21:133), and a FR-DAY-21 macro is not in the support file.
Why: three real support and ops loads arrive with this feature: (1) "the date is a day off" (moon sighting; the parent's own move-date is the fix; a macro must not ask which tradition); (2) "my days are gone" after sign-out, restore or a new phone (CB-4, NS-47-R6, R7: cleared at sign-out, out of the backup, empty on a new phone, all by design); (3) a wrong table found after release needs the pause and an app update, owned by one founder.
Proposed new row NS-46-R30 (P1, owner lane `support` and `ops`, no card behaviour): "Given the days feature is in a store candidate, Then `docs/support/macros.md` holds macros for (a) a date a day off, (b) days not found after sign-out or a new phone, (c) how to clear or turn off day notes, none of which asks for a tradition, a day or a country, none of which says the lock screen 'never' shows a day (NS-47-R22); `docs/ops/ACCESS.md` (back-office section 4) gains a row 'days store: device only, L4, staff never see it, nothing on a server to look up'; a runbook line names who flips `libraryDays`, the signed-config publish step and its reach time (PACKS_HOSTING 5-minute reach, quoted by back-office; I did not re-read it); the October review and any table refresh appear on the weekly card (FR-BKO-23). Test `[NS-46-R30] support and ops pieces exist for the release candidate` (the FR-SUP-19 release checklist item)". Ask `support` and `back-office` to add FR rows in the next pass.

### PR-19. Two renderings of one day depend on the arrival path (NS-46-R13, NS-50-R4; P2, leave unless T3 objects)
Evidence: Conflict 5 (21:74): a notification tap shows the day as the D-S11 line (no slip), any other open shows the slip. IA-AUDIT asks that the day shows "one way" (as the card cites it; I did not read IA-AUDIT).
Position: this is a reasonable fix. The alternative of a slip on both paths fails when a higher slip is due (a parent who tapped a Thanksgiving note would see a waiting card instead). Leave it. One test addition: NS-50-R4 gains "Given a tap on the note and a higher slip due, Then the day line still shows (the higher slip is the slip) so a parent who tapped a note never lands on nothing". Include in the T3 prototype.

### PR-20. NS-48 recency and kind layers depend on unbuilt anchors; split the content drop (NS-48; P1)
Evidence: N-6 (`GAP-LOG.md` line 431): the axis "depends on NS-13's anchor and back-off, not yet built". 21:631 prerequisites: BL-537 (back-off), NS-13-R18, R19, R27, BL-982, BL-985. 21:544 and R27: picture and first kinds read as `none` until NS-01 and NS-06 supply flags. Launch floor is about 128 variants, full size 264 (21:525, 21:606). Founder approves every word.
Why: what can ship before the anchor exists is the day-part filter (N-8), weekday tone and the 8 built variants; everything else is blocked behind unbuilt work, and 128 variants is a large word-approval load for one person.
Proposed wording (NS-48 section 3 and 22): "Phase 1 (no prerequisites): day-part filter, weekday tone, the built 8 re-keyed (R6, R12, R13, R15, R16, R23, R24). Phase 2 (needs the NS-13 anchor): recency bands r1 to r4 (R3, R4). Phase 3 (needs `lastMadeLetter()` and NS-01, NS-06 kinds): last-letter layer (R5, R27). Phase 4: the day, season and occasion layers (needs NS-46)." The launch floor of about 128 is the end of phase 3; each phase is one PR-sized content drop that passes the rules test alone. Also P2: N-1 sets 6 per cell; that is a ruling, not reopened.

### PR-21. NS-49 level 2 gate on the iOS floor and entitlement is stated but the build order is implicit (NS-49; P2)
Evidence: 21:724 hides the choice on iOS 17.0 and 17.1 (target 17.0, `app.config.ts:44` as the card cites). NS-49 section 22 gates on NS-01 on `testflight`, NS-35 (`suggestion` on the closed list), the entitlement on the App ID, `security` plist review, counsel on the label line and licence, device runs on iOS 17.1, 17.2 and 26. NS-35-R3 and R5 closed-list change is listed in "Changes these cards ask".
Position: complete. One addition: NS-49 section 22 should name that `suggestion` is added to the closed start list in the same PR as the module, never earlier, so a closed-list test (NS-35 N3, N6) never passes while a dead source exists. Already implied by NS-49-R4; make it explicit.

### PR-22. NS-46 scope: "Add a day" fallback and "never says a day is missing" are good; the Days page can still read as a checklist (NS-46-R3, R19; P2)
Evidence: R3 forbids counts and "complete your list"; R19 forbids saying a day is missing. But Browse is a long tick list by design, and a tick list is a to-do list in shape. The founder's own caution: "a short list the parent ticks is personal and safe" (direction 3.1).
Proposed: NS-46-R20 gains a cap on length per group on first view (design default, for example the first N rows per group with "Show more"), so Browse reads as an offer and not a form; and NS-46 section 21's tester sheet asks "did Browse feel like a list you had to finish" (a reaction question, stop line if any parent says yes). `design-systems` sets N.

## 2. Coverage of the lens questions

| Question | Answer |
|---|---|
| Fit the constitution | Yes, with one ambiguity (PR-09). NS-46 R2, R17, R22, NS-47 R3, R5, NS-48 R4, R5, R9 hold the line well. NS-49 R10 and R23 (no detection, only photos read) are strong |
| Fit the three-tab IA | Yes. Home (Say, today), Book (read), Me (look after) are respected: nothing new on Book; the Days page goes to Me; NS-49 stays in the capture cluster. Fallback location needed (PR-17); second names switch placement (PR-10) |
| Duplication between Home and Book | None introduced. NS-46-R22 keeps the look-back out (NS-23 and NS-31 own it). The day appears on Home in two forms by design (PR-19). The past-letter slip stays NS-23's |
| Home enough to be the default tab | Not changed on a normal day (PR-06). Honest position proposed; the lever is IA-AUDIT plus a default-tab check, not this card |
| Widening beyond one JTBD | Triggers widened, job not (PR-07). One real widening is NS-49 level 2. No further card recommended before S2 |
| Scope creep versus release gates | 63 P0 rows, no cut (PR-01, PR-02, PR-03). Cut proposed |
| Ordering and dependencies | Chain longer than stated; circular NS-46/NS-47 gate; slip order wrong for a trust slip (PR-03, PR-05, PR-20) |
| Card 21 split table complete | The "what the five cards are" split table (21:23 to 31) is sound: each card owns one promise. The "rulings that override" table (21:35 to 47) is complete against the rulings I read (K1 to K10 not touched; R-IA-3, DL-2, DL-5, N-1, N-3, N-5, CB-2, CB-5, CB-6, DL-9 all appear). The "Changes these cards ask of locked cards" table (21:81 to 95) is complete except: BL-966 scope text (PR-03), D-S06 day-names row move (PR-10), `kill-switches.ts` vocabulary and ADR 0029 (PR-04). The two-table split has no missing card |
| Founder-items table complete, defaults sound | Defaults sound; table incomplete and cluttered (PR-14, PR-15) |

## 3. Good enough to leave alone

- Slip not strip (R-IA-3): NS-50-R1, R2, R10, R11 hold it with testable rows and the T3 stop line.
- "Nothing is ticked for the parent" with a build-fail on `preTicked` true (NS-46-R2).
- No new notification class; `libraryDay` as a source of the `typedDay` group (N-2), once PR-03's row is added.
- Quiet-tone days: name only, no question, no "remember" (NS-46-R16, DL-1).
- Rule dates computed on the phone, no third-party table copied (NS-46-R12, DL-4).
- "Around" wording and parent override for moving days (NS-46-R14, DL-3).
- Store is L4 whole, per account, outside the backup, cleared at sign-out and Erase, never logged or exported (NS-47-R1, R6, R10, R15, R16).
- Generic prompt, no day-specific prompt key, with a synced-row comparison test (NS-47-R5, CB-3).
- Library-day lock-screen rules: one neutral body, name only behind its own switch, forced off with App lock (NS-47-R12, R13).
- Level 3 closed with a test that fails any release profile that enables it (NS-49-R25, R26).
- Only Photo and LivePhoto read from a suggestion, with a source-scan test (NS-49-R10).
- Out-of-process picker, no permission string, no PhotoKit call (NS-49-R6).
- Apple's iOS 26 notifications are Apple's, outside the budget, never promised as covered by "one a day" (NS-49-R22).
- Catalogue is a pure function that cannot add a note (NS-48-R2, R24); recency computed at plan time, not delivery (NS-48-R3).
- No emoji, dashes or exclamation marks, with the VOICE.md line 70 correction (NS-48-R10).
- NS-50 "Not now" at equal weight and its own row at AX sizes (NS-50-R7, R12).
- The fallback if App Review reads the ask as unneeded data (plain browse-and-tick list, CUL-Q8).

## 4. Verdicts

| Card | Verdict | Changes |
|---|---|---|
| NS-46 Days we mark | CHANGES | PR-01 cut and gates; PR-02 re-tag R5, R13; PR-03 circular gate and R29; PR-04 pause delivery and R28; PR-11 section 21 tradition question; PR-16 permission note; PR-17 T1 fallback; PR-18 R30; PR-22 Browse length |
| NS-47 Cultural background | CHANGES | PR-01 Drop C; PR-03; PR-05 ask rank; PR-10 switch placement; PR-14 counsel and reviewer items; PR-16 R19 permission condition |
| NS-48 Notification catalogue | CHANGES | PR-02 R8 tag; PR-12 R17 and section 21; PR-20 phases; Q-NTC-8 default |
| NS-49 Picture-first and suggestions | CHANGES | PR-08 R1 wording; PR-09 R9 title never stored unless taken; PR-13 section 21; PR-21 closed list sentence; Q-PHS split |
| NS-50 Home today | CHANGES | PR-05 order; PR-06 honest claim and R13; PR-19 test case |

## 5. Questions for the founder (each with a default)

| Id | Question | Default |
|---|---|---|
| Q-FD-7 | Which of this pack goes in the first App Store submission, which in the next build, and which after approval? | The cut in PR-01: Drop A with the next build, Drop B only if its gates close before freeze, Drop C after 1.0 is approved |
| Q-FD-8 | Add any more cards from the opportunity list (OPP-02 doorway, OPP-03 same question again, OPP-04 child's own words, OPP-05 bring in) before first-run evidence? | No further card before S2 (RA-06); OPP-02 waits on the NS-04 spike, OPP-03 is a 1.x card with a built-in delay |
| Q-FD-9 | Who reviews each tradition's days before it ships, and which traditions are in the first tradition drop? | None ships without a recorded reviewer; start with the traditions the founder can reach reviewers for; no public line says "all" |
| Q-FD-10 | Who is accountable for the October review of every date row? | The founder, with `content` doing the read; it sits on the weekly card |
| Q-FD-11 | Can the Apple App ID capability for Journaling Suggestions be added from the founder's Apple account, and is Apple's approval needed? | Founder checks when the level 2 spike starts; flag stays off until known (UNVERIFIED) |
| Karma 1 | Days ask rank: below Save a copy (this review) or (2c) as drawn? | Below Save a copy, above the past letter; T3 may move it |
| Karma 2 | Day-name switch on the Days page (C-S24) or in Reminders (D-S06)? | The Days page |
| Karma 3 | May `libraryDay` be a named ranked source in BL-966's scope text? | Yes (N-2 stands, no class added) |
| Existing items | Q-FD-1 to Q-FD-6, CUL-Q2, Q3, Q4, Q9, Q10, DAY-R, Q-NTC-5, 8, 9, Q-PHS-1 to 7 | Defaults as in card 21, with the merges and splits in PR-15 |

Nothing here is a requirement until Karma rules it. I changed no ruling; PR-05 and PR-10 propose a different default inside open conflicts (conflict 7 and conflict 1), not a reversal of a GAP-LOG ruling.
