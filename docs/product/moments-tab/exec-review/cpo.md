> v2-era document; dispositions superseded by spec section 27 and 27b at PR #1314; kept as review history.

# Executive review: Chief Product Officer, NS-53 Moments tab master requirements

Reviewed: `docs/product/prd/28-moments-tab.md` at commit 5bebd892 on `wip/moments-prd` (1187 lines, NS-53-R1 to R191, open questions O-01 to O-36).
Reviewer: Chief Product Officer (Claude role). I am a role a Claude session plays with the `early-letters-cpo` skill. I have no customer interviews, no dashboards and no tester list. Every number below comes from the PRD, `docs/DECISIONS.md`, `docs/prd/v2/02-customers.md` or `docs/agents/exec/COUNCIL.md`, read in this session on 21 Nov 2026. I did not re-read any Apple or legal source; where a point leans on one I mark it UNVERIFIED.
Bound by (founder rulings of 21 Nov, taken as given): library read ships in the first release (Route B); places and special occasions are in; faces and naming people stay out and are an open question; the machine never writes the parent's words. Nothing below argues against those four.

## Verdict: ACCEPT-WITH-CHANGES

The spec is strong where it matters most to this seat: the constitution is protected by tests, nothing counts or shames, the daily-return claim is labelled a hypothesis, and the unhappy paths are thorough. It is not yet the smallest release that teaches, it cannot read its own headline goal, and it has no answer to what slips if the gates do not close.

Conditions before I would call it done (each is a finding below):

1. C1 (EX-CPO-1, BLOCKER): the founder chooses what slips if gates G1 to G10 do not close by the store date: the date, or the library read. The spec silently defaults to shipping with the library off.
2. C2 (EX-CPO-2, BLOCKER): one consistent measurement statement that matches D-163 and lets us read whether Moments starts letters and brings parents back.
3. C3 (EX-CPO-3, EX-CPO-4): a cut list inside phase 1 and a split of flag F2, so a failure in one piece (places, album, stays) does not take down the library read.
4. C4 (EX-CPO-5, EX-CPO-6): fix the rows that cannot pass as written, merge duplicates, re-grade priority, and move the 14 phase 2 and 3 rows out of the first-release spec.
5. C5 (EX-CPO-7, EX-CPO-8): notification landing and the paywall path made consistent with the one-owner rule and the F14 guardrails.
6. C6 (EX-CPO-10): the 36 open questions triaged so the founder is asked about 14, not 36, with the rest ruled by the owning role.

Counts: 2 BLOCKER, 8 MAJOR, 5 MINOR (15 findings).

## What is right (so the changes are read in proportion)

- The constitution and the label firewall F1 to F8 are written as tests with a type that has no free-text machine field (R11, R16, R17, R59). Nothing in the first release lets a machine write, rewrite or title anything.
- The calm rules hold under the new scope: no badge, dot, count, streak or gap word on any surface (R4, R14, R33, R123).
- Honest labelling: daily-return is a HYPOTHESIS (4.4, section 20), the 28 to 34 agent-day effort is marked ASSUMED, UNVERIFIED facts are listed (section 27).
- The guardrail "zero lost letters" is carried by R86, R126 and R98 for the Moments-to-capture path.
- Faces and people are fenced with a scan and no row depends on the open question (R68).

## Findings

### EX-CPO-1 (BLOCKER): no tie-break between the store date and the library read, and the fallback quietly reverses the ruling

- Requirements: 19.3 (last paragraph), 21, RK-12, R169, R171, O-01 to O-36 deadlines, F2 in 19.2.
- Finding: the founder said the first release "needs to ship with photo library read". The spec then says that if any of G1 to G7 or G10 has no dated read-out, F2 stays off and "the tab ships on its no-library content" (19.3, 21, R171). That is a different release from the one he ruled, and the choice between "slip the date" and "ship without the library" is a scope and dates call, which is the founder's (CPO skill sections 4 and 5), not a spec default. The gates are not small: G2 needs counsel's written answer (the CPO skill records that engaging counsel, FOUNDER_QUEUE W0-13, was open on 28 Oct; current status UNVERIFIED), G4 needs a built app in front of five parents, G7 needs the founder's own phone. D-121 targeted submission Tue 1 Dec 2026 (D-121 is a coordinator ruling on delegation, and I have not confirmed it is still the target: UNVERIFIED). Every O-deadline in section 23 falls between Mon 24 Nov and Mon 1 Dec, so the decisions and the gates land on top of each other. The spec states no submission date, no critical path and no per-gate owner dates. F2 is a build flag (19.2), so turning the library on after a flag-off submission means a new binary and a new review cycle (Apple's process, UNVERIFIED this session), which is exactly the scarce resource.
- Proposed change: add one founder question, O-37, in the shape of Karma's section 10: "If a library gate is not closed by the submission date, which slips? (a) the date, (b) the library read only, ship Moments on its no-library content and add the library in the next binary." Recommended: (b) only for gates G2 and G8, which are legal and can be dark without wasting engineering; (a) for G1, G5, G6, G7 which are ours to close. Prepare two release candidates in parallel (F2 on and F2 off) so a rejection or a counsel hold costs one cycle, not two. Add a one-page gate calendar (gate, owner, date, what it blocks) to section 21 and name the submission date as the founder's, not ours.
- Evidence: PRD lines 14, 866 to 870, 900 to 917, 939; `docs/DECISIONS.md` D-121 (line 644) and D-130; CPO skill sections 4, 5, 6.

### EX-CPO-2 (BLOCKER): the headline goal cannot be read, and section 18 contradicts a decided founder entry

- Requirements: G-2, R87, R167, section 18, section 20 (E2, E4), O-04, O-18, 3.3 row 10.
- Finding: four statements cannot all be true. (1) G-2 measures "letters started with `source: moment` among opted-in analytics users". (2) R87 says no field, log, breadcrumb or event records that a letter began from a moment, and `capture_started` with source `moment` "sends nothing that says so". (3) Section 18 and R167 say analytics is off at 1.0. (4) 3.3 row 10 adopts tab-level analytics "under the D-163 consent default". D-163 (founder, 20 Nov) supersedes D-095 and D-124 item 3 for the production build and says page-view, click and impression instrumentation is collected for every user, with the consent default, counsel's view and the content ban still undecided. So the spec's "off at 1.0" is stale against a decided entry, and the one event that would answer the founder's core question ("does Moments get parents to start letters") is both named as the measure and forbidden. Separately, E2 needs two TestFlight builds with at least 20 per group before any percentage (line 887); I have no evidence of a tester pool that large (UNVERIFIED), so E2 is not runnable before launch, and nothing in section 20 says what we would change if a result comes back wrong.
- Proposed change: (a) rewrite section 18 against D-163 and say plainly which events exist in the production build and which wait on the D-163 open gates. (b) Allow `capture.letter.started` with `source: moment` for every card kind. The value is not library-derived because the prompt, typed-day and birthday cards also start letters with it, so it discloses nothing about pictures; narrow R87 to "no per-letter provenance in the database or in the letter, and no library fact in any event". This is an analytics call, so it goes to the founder with that recommendation. (c) Name one primary read and one guardrail: primary, letters started from Moments per week among families that opened Moments; guardrail, letters started per family with the tab versus the three-tab baseline, and paywall views (see EX-CPO-8). (d) Replace E2's n of 20 per group with a before-and-after read on the tester group, labelled "x of n", plus the five-parent diary E4. (e) Add a decision rule to each of E1 to E7: the result, then the change we make.
- Evidence: PRD lines 49, 126, 485, 828 to 843, 882 to 894; `docs/DECISIONS.md` line 670 (D-163); `docs/prd/v2/03-goals-and-principles.md` section 4 as quoted by the CPO skill.

### EX-CPO-3 (MAJOR): phase 1 is not the smallest release that teaches; here is the cut list inside the rulings

- Requirements: R55, R56, R57, R58, R64, R65, R66, R149, R150, R54, 7.4, 7a.2 item 5 and 6, O-13, O-14, O-16, O-33.
- Finding: the four rulings fix the core: the tab, For you, the library read with Limited honoured, Recent, day cards, a place line, dated occasions, capture hand-off. They do not require everything else now in phase 1. The first release as written adds: seven teaching verbs (7.4) plus "Not today" (R28), "Not this place" and "Hide this place" (R63, R65), which is up to ten ways to dismiss a card on a surface meant to be calm; an album chooser with a stored album identifier and a verbatim album title (R57, O-14); a stored picture identifier for "Leave out this picture" (R56, O-13); a kept-day concept with no recurrence and no stated purpose (R55 second half); multi-day stay cards and run cards (R58, R64) whose parameters `MAX_RUN` and the allowed gap are ASSUMED and wait on the card sort; a full photo viewer with pinch, pan and swipe (R149); one switch per public holiday in Me (R66, O-33). "Not this one" and "Hide this day" (7.4) both remove a day for good and both are listed in Me, so they are one verb with two names. Each of these costs review, a gate row or a stored identifier, and none is needed to learn whether parents want days from their own pictures. I have no parent evidence that any of them is wanted (none exists in the repo, per PRD 4.4).
- Proposed change: first release keeps four dismiss and teach actions: "Not today" (R28), "Not this one" (a day for good, undoable, listed in Me; absorbs "Hide this day"), "Name this day" (R55 first half) and "Not this place" (a place for good, undoable, listed in Me; absorbs "Hide this place" and U23 to U25). Move to a 1.1 list, after the card sort and device spike say they are needed: R56 and the stored picture identifier (this also matches G3's own fallback, "store none and ship Not this one only", which O-13's default contradicts), R57 album chooser, the kept-day concept, R58 and R64 stays and runs, R149 pinch and pan viewer (the day sheet's tiles at 96 pt and the system's own handling carry the first release), and per-holiday switches (one switch "Public holidays" instead). That removes or defers about 10 rows and 3 stored identifier classes from the first release without touching any of the four rulings. The flag-off fallback becomes credible only if the remaining set is small enough to finish while gates close.
- Evidence: PRD 7.4 (line 307), R28, R54 to R58, R63 to R66, R149, 8.5 table, G3 row of section 21 (line 908), O-13 default (line 982).

### EX-CPO-4 (MAJOR): one build flag couples the library read, Recent and places, so a place problem takes down everything

- Requirements: 19.2 (F2, F3), 21 (G1, G8), RK-5, R61, R169, R171.
- Finding: F2 controls "the ask, the library read, Recent, places" (line 857). RK-5 says if the offline place table is too large, unlicensed or inaccurate the fallback is date-only cards, and G1 measures the table's size and accuracy, but there is no flag that lets places go dark while the library read ships. The place table's dataset licence is UNVERIFIED (line 1181). Places are the piece with the most unknowns (licence, size, accuracy, the read of photo location under Limited access, sensitive places, the new "location" item in READ_SET_V1 that privacy and the security architect must approve in G3), and the founder's ruling put them in the release, not on the critical path of the library read itself.
- Proposed change: split F2 into F2a (ask, library read, Recent, day cards, hand-off) and F2b (place labels, which also controls reading location in READ_SET_V1). Gates G1 (place half), G3 (location in the read set) and the licence read attach to F2b only. A failed F2b gate ships date-only cards, and the library read ships. R169 and R171 test both flags. Combine with EX-CPO-1: two candidate binaries differ by F2a and F2b only.
- Evidence: PRD lines 857, 906 to 913, 932, 1181.

### EX-CPO-5 (MAJOR): P0 inflation and padding make 191 rows read as less testable than they are

- Requirements: all; named rows below.
- Finding: by my count of the table rows, 122 of 191 (64 percent) are P0 (a) 85, (b) 26, (c) 11; 61 are P1 and 8 are P2. When two rows in three are top priority the column tells an engineer nothing about order. Fourteen rows are phase 2 or 3 (R62, R67, R82, R94, R132 to R135, R140 to R143, R184, R188) and sit in a spec whose title and gate list are the first release. Fifteen rows are manual or process only (layer L5, R or P with no automated layer): R7, R60, R161, R168, R174 are research activities; R171, R175, R80 are release paperwork; they belong in the test plan and release record, not in product requirements. Rows that repeat another row: R36 and R130 (the source registry lists channels as data; the library source lists none); R107 and R176 (fixtures are Asha only); R8, R9 and R159 (glossary and tab name); R11 and R52 (forbidden words); R87, R162 and R167 (no provenance or library fact in logs and analytics); R78, R115 and R166 (Turn off wipes the moments file); R6, R70 and R109 (no PhotoKit call at launch); R24 and R133 (quiet book plans nothing). Rows 177 to 191 in section 22a are described as completing detail, and several bundle many behaviours (R141 lists about twelve conditions; R85 and R122 each carry over twenty Satisfies ids) against the rule "one behaviour per row". The traceability claim in section 26 (836 of 845 ids carried) measures that an id is named in a Satisfies column, not that a test checks it, and it rewards padding.
- Proposed change: (a) regrade: P0 only for a promise, a legal or store duty, or the core loop as the file defines it, and move motion, viewer, copy-detail and haptic rows to P1; target about a third P0. (b) Move the 14 phase 2 and 3 rows to a separate `28b-moments-later-phases.md`; keep one line each in 19.3. (c) Move the 15 research and release-paperwork rows to the test plan and release record. (d) Merge the duplicate groups above to one row each with a single named test; I estimate about 20 rows fewer. (e) Split R85, R122 and R141 into one behaviour per row. (f) Replace the "836 of 845" claim with "rows with an automated test" and "rows with a named device or manual script".
- Evidence: PRD lines 205 to 216 and all `NS-53-R` rows (counted with a script over the Pri, Phase and Layer columns); 22a (lines 942 to 962); section 26 (line 1128).

### EX-CPO-6 (MAJOR): rows that cannot pass as written

- Requirements: R36, R130, 5.2 (K-LIB row), R58, R64, R50, R186, 6.2 S3, 6.4 K-AGE, R125, R181, R190, R180, R51.
- Finding:
  - R36 says S1, S2, S3, S6 and S7 are `pushSafe` and also that "a test fails if the library source lists `push` or `email`". S7 is the library source (6.2, "A day of pictures from the phone"). The row cannot pass. It also decides whether phase 1 has any library-derived nudge, and 13.1, R130 and R132 say it does not (phase 2, behind counsel's answer).
  - R58 (P2) and R64 (P1) both specify a place plus date range card with reason RSN-PLACE, at different priorities.
  - Age: 6.2 S3 gives the card body "Today {child} is N months old", R50 and O-11 say no number on the card, and R186 says no number shows except a date, clock time, duration or year. The age day is one of the few cards present on a day with no pictures (it is a daily reason to open), so the choice matters. The content rules ban counts of days, pictures and letters, not the child's age; I recommend O-11 answer "yes, show the age in months on the age day card" (UNVERIFIED that Home already shows the same line today: I did not grep the shipped copy), with the lock screen rule R138 unchanged.
  - R125 ("a huge library stays fast"), R51 and R190 give no pass condition; the spec says every number comes from G1, so each should read "within the budget recorded in the G1 read-out". R190 also contains the sentence "given the reserved row id P6-R13, no behaviour is required", which is not a requirement. R181 and R180 restate decisions of record ("the reversals ... are those of section 3.2") with no Given, When, Then.
- Proposed change: R36: S7 is not `pushSafe` in phase 1; list `pushSafe` S1, S2, S3, S6 only; the library source lists no surface until its founder decision id exists. Merge R58 into R64 at the lower priority or delete R58. Answer O-11 as above and amend R50, R186 and S3 to match. Point R125, R51 and R190 at a G1 budget key. Delete the reserved-id clause from R190 and rewrite or delete R180 and R181.
- Evidence: PRD lines 233, 253, 281, 326, 334, 391, 886, 943 to 962.

### EX-CPO-7 (MAJOR): a notification for a typed day or birthday lands on Home, where the one-owner rule says the card is not

- Requirements: 13.4, O-22, R5, R137, R191, 4.3, RV-10.
- Finding: 13.4 recommends every tap land on Home "with the occasion card chosen on screen after unlock". But R5 and 4.3 say a fact shows on one tab only, and Moments owns the typed day, the birthday card and the year-ago letter when Moments is on (RV-10 removed the year-ago slip from Home). A parent who taps a `typedDay`, `birthday` or `monthAge` push and lands on Home may see no card for it. The privacy argument for a common landing (so the landing does not reveal whether the nudge was library-timed) applies only to the phase 2 library-timed reminder; in phase 1 no push is library-derived (R36, R132). So the stricter landing is paid for in phase 1 with a worse experience and nothing gained.
- Proposed change: in phase 1, `typedDay`, `birthday` and `monthAge` taps land on Moments (their lock-screen text already names the class), `evening` taps land on Home; the single routing table stays. Revisit when the phase 2 reminder is specified: that one lands wherever the ordinary evening reminder lands. Add the case to R137 as a test. Confirm with the Chief Design Officer and Chief Privacy Officer; this is not a founder question unless it changes what a notification says.
- Evidence: PRD lines 97, 147, 171, 664, 686 to 693, 962.

### EX-CPO-8 (MAJOR): no row for the paywall path, though this tab exists to raise letter starts

- Requirements: none carries it; R83, R85, R99, 2.2 last bullet (MT-X4-R11 "no paid feature depends on the library"), E2.
- Finding: the free allowance is the first 2 letters per account, counted when the author has seen their words, then Plus at Keep (D-082, D-103, F14-REQ-037 as cited by the CPO skill). The PRD v2 guardrails are zero paywalls outside their triggers and zero lost letters. A tab built to increase starts will bring more parents to the gate sooner, and nothing in NS-53 says the card, the day sheet or Recent may never mention Plus, change by plan or gate the start. The non-goal is stated in 2.2 but has no test row. Pricing and what Plus holds belong to the Chief Business Officer and the Chief Financial Officer; I give the product view only and have not consulted them in this review.
- Proposed change: add one P0 (a) row: Moments reads no plan state, shows no Plus or allowance text on any card, sheet or state, and a tap on a card goes through the same `startCapture` so the only gate is Keep, after the words are seen. Add paywall views per family to the E2 guardrail (EX-CPO-2). Ask the Chief Business Officer whether the 2-letter allowance is still right for a tab that sends parents to the gate in the first session; I flag it, I do not rule on it.
- Evidence: CPO skill sections 4, 9; PRD 2.2 (line 64), R83, R99.

### EX-CPO-9 (MAJOR): the founder's phrase "special occasions" is interpreted, not confirmed, and the place feature will be quiet by design

- Requirements: 7a.1 to 7a.4, R61, R63, R66, O-31, O-32, O-34, RV-18, RK-3, RK-4.
- Finding: the founder's words are "Places. Special occasions etc all are part of it. Don't exclude what drives attention." The spec reads "special occasions" as dates (birthday, month day, typed or ticked days, firsts, public holidays) and holds back event inference from the pictures themselves (K-SUG, 7a.4) as phase 3. That is a reasonable reading, but 7a.4 itself begins "If the founder wants events recognised from the pictures". It is his sentence, so the question should be put to him as a question about his meaning, not as a deferrable option. Second, the default place source is an offline city table (P-A) and the default shows a place line only when the day is away from home (O-34). The honest result is: "Lisbon" on the days of a trip, and nothing on most daily cards, which are taken at home. A founder who pictures venue names ("the zoo") or a place on every card will find that the feature barely appears. 7a.1 says this in one line ("an offline table gives Lisbon, not a venue"), but it is not in the founder questions as an expectation to reset.
- Proposed change: reframe O-32 as: "By 'special occasions' did you mean dates we know (birthday, month day, days you mark, public holidays), or also parties and events recognised from the pictures? The second is a labelled guess, off by default, and needs its own legal gate (G9)." Default stays: dates only in the first release. Add to O-31 the plain consequence: city names on trip days only. I agree with the defaults; I want the founder to see what he is getting.
- Evidence: PRD lines 340, 352, 358, 376 to 378, 999 to 1004, 1181 (place table facts UNVERIFIED).

### EX-CPO-10 (MAJOR): 36 open questions is too many for one founder, several are not his, and RV-01 to RV-22 arrive as one signature

- Requirements: section 23 (O-01 to O-36), G10, RV-01 to RV-22.
- Finding: the founder's hours are the scarcest resource this company has. Section 23 asks for answers by four dated deadlines between 24 Nov and 1 Dec (and the weekdays printed for them are wrong, see EX-CPO-15). Defects: O-10 and O-12 are the same question (Recent shows lone pictures or qualifying days only); O-21 is marked superseded; O-29 is coordinator housekeeping (which reconciliation decision the ruling closed), not a founder matter; O-36 (iOS floor) only matters for Route A, which is phase 3; O-13's default ("Yes, store a picture identifier") contradicts G3's fallback ("store none"); O-20 (shared book under Variant A) is moot until co-parent ships (D-162); many questions are design, mobile or privacy rulings. G10 asks the founder to sign 22 reversals in one entry, including a reversal of D-161 (decided by the founder on 11 Nov), which makes real review of each impossible.
- Proposed change: triage as follows (my recommended answers are in the table below). Founder-only, 14 questions: O-01, O-02, O-03, O-05, O-07, O-16, O-18, O-30, O-31, O-32 (as reframed), O-33, O-35, plus new O-37 (date versus library, EX-CPO-1) and new O-38 (the `moment` source value in analytics, EX-CPO-2). Others go to the named owner with a deadline and are ruled in the exec rulings log: O-04, O-06, O-11 to the Chief Product Officer; O-08, O-09, O-15, O-19 to the Chief Technology Officer with privacy; O-17, O-22, O-24 to O-27, O-34 to the Chief Design Officer; O-28 to the Chief Legal Officer; O-14, O-13 to privacy and the CTO at gate G3; O-29 to the coordinator; O-10 deleted as a duplicate of O-12; O-21 deleted; O-20 and O-36 parked with their phases. Present G10 as four signatures, not one: Tab and capture (RV-01, 02, 10, 14, 15), Permission and ask (RV-03, 04, 05, 13, 17), Computed labels, places and occasions (RV-06, 07, 11, 12, 18, 19, 20, 21, 22), Nudges and email (RV-08, 09, 16). This is bundling by topic for review, not splitting a founder call to avoid the founder (COUNCIL section 6).
- Evidence: PRD lines 91 to 109, 966 to 1005, 915; `docs/DECISIONS.md` line 668 (D-161); COUNCIL sections 2, 6.

### EX-CPO-11 (MINOR): the job is never tied to a ranked job, and the tab asks more of the build than the ranked jobs it serves

- Requirements: 1.3, 4.4, G-1 to G-6.
- Finding: `docs/prd/v2/02-customers.md` section 4 ranks nine jobs. The nearest is rank 5, "Tell me what to write about, without nagging" (F13, F19). Ranks 1 and 2 are "Never lose what I made" and "Let me capture it in the few minutes I have". The founder has said this is the core value proposition and told us to change principles that stand in the way, and that is his call. The spec never says which ranked job it serves, and it adds a library, a place table and a fourth tab for a job the customer file ranks fifth, so the trade should be written down rather than implicit.
- Proposed change: add one sentence to 1.3 naming job 5 (and, through the day sheet, job 2: few minutes), and one line in 2.1 stating that jobs 1 and 2 are guarded by R86, R98 and R126. If the founder wants `02-customers.md` re-ranked, that is a founder-visible change to the PRD v2 customer file, not a side effect of NS-53.
- Evidence: `docs/prd/v2/02-customers.md` lines 84 to 92; PRD lines 30, 34.

### EX-CPO-12 (MINOR): on a day with no pictures, Moments is a second prompt surface next to Home

- Requirements: R10, R25, 4.4, 6.3, E4.
- Finding: the daily "honest card" when nothing real exists is a prompt from the 111 (S6, always eligible, excluding Home's key). Home already carries today's prompt. On a quiet day the parent sees two different questions on two tabs. That cuts against the "one ask at a time" principle and weakens the "reason to come back" claim, which then rests on the same content Home has.
- Proposed change: keep the card, but add E4 sub-question "did the second question help or crowd?" and decide after the diary. No change to rows now.
- Evidence: PRD lines 152, 270, 237; CPO skill section 9 (principle: one ask at a time).

### EX-CPO-13 (MINOR): D7 exists on origin; section 28 says it was not found

- Requirements: section 28, section 27.
- Finding: the clone shows `origin/wip/moments-d7`, last commit Sat 21 Nov 08:26 UTC, holding `docs/design/moments-tab/prototype/README.md` and a prototype HTML file. PRD section 28 says D7 was not found. I did not read it, so I do not know whether it contradicts the spec.
- Proposed change: the author reads D7 and records any conflicts in section 24 before round 1 closes.
- Evidence: `git branch -r` and `git log origin/wip/moments-d7` in the review clone.

### EX-CPO-14 (MINOR): the core value proposition cannot appear in the store listing until the name clears

- Requirements: R8, O-28, RK-11.
- Finding: "Moments" is in-app only until counsel clears it (R8, RK-11). The founder calls this the core value proposition, so a tab he rates highest is absent from the listing, the screenshots and the website at launch. That is a business and marketing cost, small if clearance is quick, real if not. The closed list RSN-SUGGEST (6.4a) is also in the phase 1 reason list though K-SUG is not built.
- Proposed change: ask the Chief Legal Officer for the clearance timeline so the Chief Marketing Officer knows whether the first listing can carry it; remove RSN-SUGGEST from the phase 1 closed list (it is the only reason that cannot appear in the first release).
- Evidence: PRD lines 174, 257, 938, 997.

### EX-CPO-15 (MINOR): the weekdays printed on the O-question deadlines are wrong

- Requirements: section 23 deadlines (O-01 to O-36), 4.2, 23 preamble.
- Finding: the PRD says today is Sat 21 Nov 2026 (line 221, matching `date`). Then Mon 24 Nov is a Tuesday, Fri 28 Nov is a Saturday, Mon 1 Dec is a Tuesday (D-121 itself says Tue 1 Dec), and "Fri 1 Dec" in O-36 is a Tuesday. I checked with the system calendar. A founder reading "Fri 28 Nov" will plan for the wrong day, and the deadlines sit on top of the submission target.
- Proposed change: correct to Mon 23 Nov, Fri 27 Nov and Tue 1 Dec, or restate as dates only, and re-sequence them after the gate calendar of EX-CPO-1.
- Evidence: PRD lines 138, 221, 972 to 1005; `docs/DECISIONS.md` line 644 (D-121: Tue 1 Dec 2026); `date -d` in the review clone.

## Recommended answers to the founder questions (O-01 to O-36)

"Agree" means I accept the PRD default. "Change" means I recommend something different. Founder-only items are marked F; others show the owner.

| Id | Owner | My recommended answer |
|---|---|---|
| O-01 | F | Agree: Home, Moments, Book, Me, Home landing. Run the five-parent default-tab check only if it costs under an hour; it is the cheapest test of his first wish. |
| O-02 | F | Agree: no library-timed reminder in the first release; phase 2 after counsel. Phase 1 still gives him push nudges from the existing classes. |
| O-03 | F | Change: park. Write no email rows in the first-release spec; revisit after two weeks of E4 diary evidence. Email needs server rows and a commercial-class opt-in for a signal with no evidence yet. |
| O-04 | CPO | Agree: keep as a hypothesis; never a headline claim until E4 reads. |
| O-05 | F | Agree: any tap after first run. |
| O-06 | CPO | Agree: one pointer, once; cut it first if scope must shrink (R121 is P1). |
| O-07 | F | Agree: no extra seasonal days. |
| O-08 | CTO with privacy | Agree: never show or store Apple's title; it only matters in phase 3. |
| O-09 | CTO | Agree: rebuild from a date window; decide after G1. |
| O-10 | CPO | Delete: duplicate of O-12. |
| O-11 | CPO | Change: show the age in months on the age day card (EX-CPO-6). |
| O-12 | CPO | Agree: qualifying days; tune thresholds at G1 and the card sort. |
| O-13 | privacy, CTO at G3 | Change: No in the first release; store no picture identifier (EX-CPO-3). |
| O-14 | privacy, CTO at G3 | Change: No in the first release; defer the album chooser. |
| O-15 | privacy, security-architect at G3 | Agree as a closed set, with location behind F2b (EX-CPO-4). |
| O-16 | F | Agree: no recurrence for kept days; I would also drop the kept-day concept (EX-CPO-3). |
| O-17 | CDesO | Agree: foot. |
| O-18 | F | Agree: no permission-result event. |
| O-19 | CTO | Agree: Book after Keep (the existing Keep moment). |
| O-20 | park | Moot until co-parent ships (D-162). |
| O-21 | delete | Superseded. |
| O-22 | CDesO, CPrivO | Change for phase 1: typed day, birthday and month-age taps land on Moments; evening on Home (EX-CPO-7). |
| O-23 | F | Agree: no widget. |
| O-24 to O-27 | CDesO | Agree with the defaults; haptics owner reads SOUND.md first. |
| O-28 | CLO | Agree: in-app only; ask for the clearance timeline (EX-CPO-14). |
| O-29 | coordinator | Housekeeping, not a founder question. |
| O-30 | F | Agree: faces and naming people OUT; not decided here. |
| O-31 | F | Agree: offline city table plus parent-typed place; state the consequence (city names on trip days only). |
| O-32 | F | Reframe as a question about his meaning of "special occasions"; default dates only (EX-CPO-9). |
| O-33 | F | Agree with a US civic list, with one switch, not one per holiday. |
| O-34 | CDesO | Agree: only when away. |
| O-35 | F | Agree: "every year" only when the parent chooses. |
| O-36 | park | Route A only, phase 3. |
| O-37 (new) | F | Date or library when gates do not close (EX-CPO-1); recommended (b) for G2 and G8, (a) for the rest. |
| O-38 (new) | F | Allow `source: moment` in `capture.letter.started` for every card kind (EX-CPO-2). |

## Section 25.1 answers (for the review log)

- Does the job statement match the customer problem, and is the daily-return claim honest? Yes on both, with the job tied to ranked job 5 (EX-CPO-11); the claim is honest but unreadable until EX-CPO-2 is fixed.
- Is phase 1 the smallest set that solves the problem, and is the flag-off fallback credible? No, not yet: EX-CPO-3 cuts about 10 rows and 3 stored identifier classes; the fallback is credible only with F2a and F2b split (EX-CPO-4) and a founder answer to EX-CPO-1.
- Are the Recent qualifying tiers and teaching verbs the right size? The tiers (O-12) are the right idea with ASSUMED numbers owned by G1. The verbs are too many: four in the first release (EX-CPO-3).
- Verdict for the log: Approve with changes. Rows to change: R28, R36, R50, R54 to R58, R62, R64 to R67, R80, R82, R85, R87, R94, R107, R122, R125, R130, R132 to R135, R137, R140 to R143, R149, R159, R167, R169, R171, R176, R180, R181, R184, R186, R188, R190; add a plan-neutrality row (EX-CPO-8). Owner: product (author), CPO review. Date: 21 Nov 2026.

## Not done in this review

I did not read Apple's guidelines, any statute, the lead documents P1 to P6, D1 to D7, A1 to A5, T1 to T5, X1 to X6 or the Project docs listed in the session (this session cannot read them). I did not consult the Chief Technology Officer, the Chief Design Officer, the Chief Business Officer or the Chief Financial Officer; findings that touch their seats are flagged as asks, not rulings. No edits were made to any other file. No decision was recorded in `docs/DECISIONS.md` or the exec rulings log.

Chief Product Officer (Claude role)
