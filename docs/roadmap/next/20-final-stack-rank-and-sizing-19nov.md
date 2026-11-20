# Final stack rank, sizing and first work packages (19 Nov 2026)

> SUPERSEDED-BY docs/product/prd/23-dependency-map-and-plan.md (parts only, see its section 8: section 2 In flight and the rank order for waves) | 20 Nov 2026 | Rest of this file is unchanged | Registry: docs/product/prd/REGISTRY.md

Owner: Karma (CTO role), with the Chief Product Officer role. Docs only. Read against develop `09a104da` (19 Nov, after #764 merged) and the open PRs listed in section 2, at 22:15 UTC.

Status: CURRENT | Updated: 20 Nov 2026 | Load when: you need the order of work and each item's size and gate (rank 1 to 54, plus section 4b for cards added 20 Nov).

Status: Locked v1.0, 20 Nov 2026 (council round 2). Rescoped items marked "Rescoped 20 Nov". Changes after lock need a PR that lists every changed id.

What this is: the 55 candidates of the 19 Nov scope round (C-01 to C-42, N-01 to N-13), looked at again by the CPO against what develop holds now, debated with the owning roles, given a final order, sized by the CTO, and broken into backlog rows BL-923 to BL-941 for the first two waves.

What it is not: a calendar. No build date is set here; dates and what is in a release are the founder's. No device was run. No parent evidence exists yet, so every Value number is a judgment and is labelled as one.

How the roles were run: one Claude session, reading the council protocol and each role's skill, answering as each in turn. The objections below are real cross-role objections. They are not independent reviews. This file needs two counted reviews like any other.

## 1. What changed since the first rank, and one correction

- **Correction.** The exec record of 19 Nov ruled that Build 12 should carry a logic-only fix for "Recording kept on this phone". That fix was already on develop: #764 merged at 19:33 UTC, and `provenance.ts` and `letter-card.logic.ts` now name the place only when `audioUri` is set. I ruled from a read of `be1c1142` taken before that merge and did not re-read. Ruling 1 is satisfied by #764, not by new work. What is left of C-02 is BL-922 and device row S1-204.
- **N-05 is done.** #828 (one capture entry and the navigation test) merged on 19 Nov as `5f5dfaf4`.
- **ADR 0028 moved.** #797 was amended three times on 19 Nov. Its D3a answers the seal clock: two columns written once together, where the instant (`seal_opens_at`) is the rule and the date is for display. That matches the working rule in the exec record. It was accepted under CR-62 (#831, merged as `a17254f6`); what remains is the founder's ready click on #797 and BL-868 (the export gate note).
- **Find moved.** #798 was rebuilt onto develop on 19 Nov and is in a fix round at `e7d399b3`. GitHub reports 280 changed files for it, which cannot be its own delta; the true size was not re-read here.
- **The co-parent caption is settled.** See section 6. C-22 is dropped.

## 2. In flight (not new rows; do not duplicate)

| Item | PR or row | State at 22:15 UTC, 19 Nov | Needs |
|---|---|---|---|
| N-05 | #828 | merged 19 Nov as `5f5dfaf4` | nothing |
| N-08, N-10 | #797; #831 | ADR 0028 accepted under CR-62 (#831, `a17254f6`) | the founder's ready click on #797; BL-868 |
| C-17 | #798, head `e7d399b3` | draft, flag `EXPO_PUBLIC_BOOK_SEARCH` | size re-read; device row S1-205 |
| C-06 | #833 to #840 (eight slices; #796 closed) | open, stacked | counted reviews per slice (BL-931) |
| C-02 | BL-922 | ready | an owner |
| C-05 | #680, BL-770 | drafts | refresh against develop; device row S1-135 |
| N-09 | #758 | draft | review |
| Decisions | #827 (D-161, D-162) | open | the founder confirms and merges (D-125) |
| Data inventory row for Find | #799 | open | the founder merges legal text (D-125) |

## 3. CPO evaluation

Method (CPO skill, section 7): name the job, name the risks (value, usability, feasibility, viability, and the constitution), set the appetite in review load, pick the smallest step that teaches.

The bets, in order:

1. **Keeping comes before adding.** The ranked job is "never lose what I made". Build 12 has recording backup off, so the voice lives on one phone. Everything that makes a kept letter safer or a screen truer goes first, as long as it is cheap: the discarding sweep, the device baseline, the accessibility floor, reminders proven on a phone.
2. **The founder's order holds after that:** Photo, Find, the pilot, the spike, Share, then Firsts and seals (closed question X1). Their enablers go in front because they are what makes review real and the Book fast.
3. **Learn where it costs no engineering.** The pilot and the saved copy both test whether a family cares about a second place for the voice, before any server holds it.

What reading would prove this wrong: device numbers that show the Book is already slow without photos (then N-06 moves above everything in tier B); pilot parents who do not send a recording to anyone (then C-27 and C-28 fall further); testers who never open Find (then N-04 is not worth its header work).

What we will not build, restated: no summaries, recaps or rewording (C-36); no counts or milestones (C-42); no Share tab (C-37); no picture or voice leaving the phone without a security and counsel read (X2, ruling 3).

### The debate, one line each side

| Question | Position | Strongest objection | Outcome |
|---|---|---|---|
| Does N-07 rise from 6 to 2? | CPO: yes, hidden audio after a failed delete is the one place the app keeps something the parent asked it to let go | Design: nobody has reported it | Rise. It is S, ready, and a durability defect does not wait for a report |
| Does the pilot (C-19) rise from 16 to 14? | CPO: it costs no code and tests the largest bet | CLO: consent texts are unread by counsel | Rise, with the pilot itself gated on the counsel read. The kit is prepared now |
| Does Save a copy (C-03) rise from 18 to 15? | CPO: while our backup is off, it is the one second copy the parent controls directly | Design: any "in case" line is fear language | Rise. The requirement must be a keepsake line; content writes it, the founder approves the words |
| Does Book header calm (N-04) stay above Share? | Design: yes, the header breaks at the largest text size | CTO: it rewrites the header Find is adding to, while Find is mid-review | Falls to 17, after Find lands. The AX5 defect itself is fixed sooner in N-02 |
| Does Print-ready file (C-26) rise? | CBO: print is the best-evidenced gap in R6 | CFO, CLO: no spend, no partner, no seller role before an entity | Rises to 27 as a structure-only file. No spend is approved |
| Does N-05 rise from 15 to 11? | CTO: it is built and changes nothing a parent sees | CPO: it adds review load ahead of Photo | Rise. One review now is cheaper than a rebase later |
| Does C-32 fall? | CPrivO: it cannot start under ruling 3 | CPO: photos that do not follow the account will surprise a parent on a new phone | Falls to 38. The surprise is real and is a requirement for the Photo words: say where the picture lives |

## 4. The final rank

Value is 1 to 5, a judgment with no parent evidence behind it. Size is the CTO's estimate [E]:
- **S**: one PR inside the review limit (400 added lines, 20 files), no native code, no schema change.
- **M**: two to four such PRs, or one with a local migration.
- **L**: five or more PRs, or a native module, a server schema change, a new entitlement or a counsel gate.

Every PR costs two counted reviews. Sizes for items whose code was not read are marked.

| Rank | Was | Id | Item | Value | Size [E] | State and gate | Why here |
|---|---|---|---|---|---|---|---|
| 1 | 2 | C-01 | Owner backup of recordings: prerequisites now, flip later | 5 | S to M (code not read) | Flip gated: hosting path, escrow drill, device run, counsel-read label and policy | Job 1, never lose what I made. With #764 the words follow a parent to a new phone and the voice does not. Only zero-cost work starts. |
| 2 | 6 | N-07 | Discarding sweep and the two silent delete failures | 3 | S (3 PRs) | Done: BL-923 and BL-924 (#832, `5dc025d3`); BL-926 waits for the words in BL-925 | Durability before delight. A draft left `discarding` hides audio on the phone; S cost; nothing gates it. |
| 3 | 4 | N-01 | Device baseline on a small phone | 4 | S (human run) | Ready: BL-929, then the founder's phone | Every performance and motion number in the plan is unmeasured. One run prices the rest. |
| 4 | 3 | N-02 | Accessibility floor pass | 3 | S (2 PRs) | Ready: BL-927, then BL-928 | Every later feature lands on the letter page and the Book header. Raising the floor needs no decision. |
| 5 | 5 | C-05 | Reminders made real | 4 | S to M | In flight: #680, BL-770; device row S1-135 | Built and unproven on a phone. The device run comes first. |
| 6 | 1 | C-02 | New phone: close-out | 4 | M (BL-922) | Tier 0 merged in #764 (09a104da). Left: BL-922, device row S1-204 | Was rank 1. The false line is fixed on develop, so only the hold case remains. |
| 7 | 8 | N-08 | ADR 0028 accepted; export 1.7.0; inventory rows | 3 | S to M | ADR 0028 accepted (CR-62, #831); export BL-933 after BL-868; #799 is the founder's merge | Photo, Find and seals all write new on-device data. One accepted rule first. |
| 8 | 23 | N-10 | Seal clock | 2 | S (a decision) | Settled in ADR 0028 D3a, accepted under CR-62: the instant is the rule, the date is display | Up from 23 because #797 now answers it; it closes with N-08. |
| 9 | 7 | N-11 | Split the photo work; check #798's true size | 2 | S to M | Done as eight PRs, #833 to #840 (BL-931). #798 is a draft; size to be re-read | Review is the gate. 64 files in one PR is not reviewed, it is skimmed. |
| 10 | 9 | N-06 | Book list stays light; two photo derivatives | 3 | M | BL-932, after BL-931 slice 2 | Photo must not slow the Book or a take. |
| 11 | 15 | N-05 | One capture start and the navigation test | 2 | S to M | Done: #828 merged as `5f5dfaf4` | Up from 15: it is built, changes nothing a parent sees, and pins the founder's rule in a test. |
| 12 | 10 | C-06 | Photo with a letter | 4 | M after the enablers | Alpha only until four conditions hold (ruling 4) | First in the founder's order (X1). |
| 13 | 11 | C-17 | Find | 3 | M | Draft: #798, behind a flag; device row S1-205 | Second in the founder's order. |
| 14 | 16 | C-19 | Family-hears-it pilot (no build) | 3 | S (no code) | Ready: BL-935. Counsel read of consent texts is the founder's, due 27 Nov | Up from 16: costs no engineering and tests the largest bet, the people around the child. |
| 15 | 18 | C-03 | Save a copy of the year | 3 | S | Requirement NS-11 written; build row BL-942 | Up from 18: while our backup is off, a saved copy is the one copy of the voice the parent controls directly, beside the phone's own iCloud backup if that is on. |
| 16 | 14 | N-03 | Letter page as one list | 3 | S | BL-937, after BL-928 (same file) | Share, Firsts and seals each add a row here. |
| 17 | 12 | N-04 | Book header calm | 3 | S to M | BL-938, after #798 lands | Down from 12: it rearranges the header Find adds to, so it follows Find. |
| 18 | 13 | C-18 | Share one letter, text first | 4 | S to M | BL-939, after BL-937. Level 1 only | Build 14 in the PRD. No recording path until security and counsel have read it. |
| 19 | 19 | C-14 | Child switcher on Home | 3 | S | Requirement NS-14 written; build row BL-941 | A letter can land in the wrong book today with no control on Home. |
| 20 | 21 | C-09 | Hands-free spike | 3 | spike S, build L | PRD 04; starts the Monday after the Build 13 cut | A spike, time-boxed. No doorway ships from it. |
| 21 | 20 | C-20 | One past letter on Home | 3 | S | NS-23; BL-946. Rescoped 20 Nov: changes the built "A month ago" card (`resurfaced`) to the same day of an earlier month or year; one Home card rule with open PR #721 | Shares the single Home slip. |
| 22 | 22 | C-07 | A letter for another day | 3 | S | NS-15; BL-945. Rescoped 20 Nov: the about-day (`occurred_on`) is already stored, synced and exported; the card adds the Review control and the two-day line; BL-944 superseded | The app must never read a date out of the words. |
| 23 | 25 | N-09 | One notification budget (built before C-05: reminders depend on it; plan notices sit outside it) | 2 | S | #758 to be reworked without Memory Library classes; needs a backlog row | Gates every reminder class after it. |
| 24 | 24 | N-12 | Doc and code drift | 1 | S | Needs its list copied into the repo first | Cheap; not urgent. |
| 25 | 26 | C-23 | Firsts | 3 | M | Earliest Build 15 (PRD 06) | Tone risk: must not become milestones. |
| 26 | 28 | C-25 | Read the year back | 3 | S to M | Not broken down | Read together is built; this is a thin layer. |
| 27 | 31 | C-26 | Print-ready file | 3 | M | Structure only (PRD 07 3.2). Proof-book spend is the founder's | Up from 31: R6 names print as the best-evidenced gap [S]. No spend, no partner. |
| 28 | 27 | C-21 | Co-parent turned on in store builds | 3 | S to M | D-162 draft keeps it alpha-only | A second adult sees every letter; needs the co-parent work BL-882 to BL-889. |
| 29 | 29 | C-08 | Someone else speaks | 3 | M to L | NS-16. The name is the existing `author_signs_as` (30 characters, set before first upload); counsel Q48 and the sibling question first | Authorship and allowance rules. |
| 30 | 30 | C-12 | Second spoken language (gate) | 3 | L per language | Native reviewer and the founder | A promise we keep only when the gate passes. |
| 31 | 32 | C-24 | Sealed letters | 3 | L | Earliest Build 15; counsel on minors and open-on-a-day | Legal and sync. |
| 32 | 33 | C-10 | Quick capture from a doorway | 3 | M | After the spike; Ready only (ruling 6) | Risk of an unmeant recording. |
| 33 | 34 | C-15 | Typed days in reminders | 2 | S to M | After N-09 | Fatigue. |
| 34 | 35 | C-04 | Earlier versions of my words | 2 | M | Not broken down | The server keeps versions; the phone has no reader. |
| 35 | 37 | C-11 | Add more to this letter | 3 | L | Schema and constitution | Raw words are immutable. |
| 36 | 38 | N-13 | Low Power Mode guard | 1 | S to M | New native module | Only matters once loops exist. |
| 37 | 39 | C-33 | Read-along highlight | 3 | L | D-059 | Alignment data. |
| 38 | 36 | C-32 | Photos follow the account | 4 | M | Blocked by ruling 3: no picture leaves the phone | Down from 36: it cannot start. |
| 39 | 40 | C-13 | A letter to two books | 2 | L | Data model, sync |  |
| 40 | 41 | C-27 | Hosted family link | 2 | L | X2: no build before security and counsel |  |
| 41 | 42 | C-29 | Push for the other parent | 2 | L | Entitlement, consent |  |
| 42 | 43 | C-31 | Per-person visibility | 2 | L | Server access rules |  |
| 43 | 44 | C-28 | Printed Year One with QR | 3 | L | Spend, entity, hosted audio |  |
| 44 | 45 | C-16 | Memory Library | 2 | L | After Build 13 as a whole (exec record 10 Nov) |  |
| 45 | 46 | C-30 | Past-letter widget | 1 | L | Words on a Home Screen |  |
| 46 | 47 | C-34 | First-run story cards (new cards) | 2 | M | Held (ruling 7) |  |
| 47 | 48 | C-39 | Android | 3 | L | Second platform |  |
| 48 | 49 | C-40 | Native tab bar | 1 | M |  |  |
| 49 | 50 | C-38 | Apple Watch | 2 | L |  |  |
| 50 | 51 | C-36 | Weekly family recap | 1 | L | The machine may not summarise |  |
| 51 | 52 | C-42 | Milestone notes (count style) | 1 | S | Counts are banned |  |
| 52 | 53 | C-41 | Paper sounds | 1 | M |  |  |
| 53 | 54 | C-35 | Gifts and lifetime | 1 | L | Payments; banned word |  |
| 54 | 55 | C-37 | A Share tab | 1 | M | Fails the founder's tab test |  |

## 4b. Cards added 20 Nov 2026, proposed order (not ranks 55 and up: the founder rules, Q-FD-7)

Source: `docs/product/prd/21-days-cultural-photos-home.md` "Release line and cut" for NS-46 to NS-50; `19-from-download-to-first-letter.md` for NS-38 to NS-45; `26-founder-direction-photos-library-and-media.md` for NS-51 and NS-52 (card 27, being written). Sizes and the build order are in `24-engineering-handoff.md` and `23-dependency-map-and-plan.md` (both being written); this table does not repeat them. No dates (ruling T5).

| Order | Card | Item | Drop | First gate | Value and size |
|---|---|---|---|---|---|
| 1 | NS-48 phase 1 | Notification catalogue: day-part filter, weekday tone, the built 8 re-keyed, rules-test coverage (NS-48-R28) | A | NS-01 on `testflight`; no planner change beyond words | not scored; card 21 |
| 2 | NS-49 level 1 | Picture-first start (Apple's picker) as a first-class start | A | The A-S01 re-draw passes its AX5 test (NS-49-R1) | not scored |
| 3 | NS-46 | Days we mark, US only, plain browse-and-tick list in Me | B | BL-966, BL-982, BL-963, BL-985; `budget.ts`; days store registered and Erase-scanned; counsel | not scored |
| 4 | NS-47 | Cultural background, store rules only | B | Same as NS-46 (one release unit); counsel CUL-Q5 to Q7 and Q11 for the ask | not scored |
| 5 | NS-50 | Home today, rank 2b in the slip | B | BL-963 slip registry (not built) | not scored |
| 6 | NS-47, NS-48, NS-49 | Ask slip and traditions; recency and last-letter layers; Suggestions picker (level 2) | C | After 1.0 approval; J-CUL-01; weak-link launch run on iOS 17.0 to 17.2 and 26 | not scored |
| 7 | NS-38 to NS-45 | First run: store page to account life (card 19; P0 96 rows) | founder rules (card 19 has no cut) | Karma's rulings on its open items | not scored |
| 8 | NS-51, NS-52 | Photo moments (level 3); pictures and videos with a letter | not yet | Cards not written; the founder direction reverses three earlier rulings (level 3 closed, no video, one picture per letter) | not scored |

Why the order is only proposed: the reviews found no single cut in the pack, and it stands on planner work that is unbuilt (`budget.ts`, the quiet reader BL-985, the slip registry BL-963; `tools/review/ns46-50/mobile.md` M-01, M-13). Superseded: "one note a day is enforced" (rank 5, C-05, and N-09 rank 23 read as if it were) -> enforced nowhere, `budget.ts` is the prerequisite (`mobile.md` M-01).

Dropped from the rank: **C-22** (co-parent caption and sheet in store builds), on the founder's answer of 19 Nov. See section 6.

## 5. Sizing in review load, waves 1 and 2

| Wave | Rows | PRs [E] | Counted reviews [E] | Needs the founder |
|---|---|---|---|---|
| 1, ready or in flight | BL-922, 925, 926, 927, 928, 929, 930, 931 (eight photo PRs, all slices, in progress), 935, 936, 949; #798 Find (draft); #758 notification budget (draft). Done: BL-923, 924 | 18 to 22 | 36 to 44 | words for BL-925; the phone for BL-929; the counsel read behind BL-935 |
| 2, held for the founder's approval | BL-932, 933, 937, 943 | 5 to 7 | 10 to 14 | approval of the requirements in chat |
| 3 and later, held | BL-938, 939, 941, 942, 944, 945, 946, 947, 948 | 10 to 13 | 20 to 26 | word approvals for Share, Save a copy and one past letter |

Waves follow `docs/product/prd/13-engineering-plan.md` section 4. Done since this file was first written: #828 (one capture start). ADR 0028 was accepted under CR-62.

The limit is review, not building. COORDINATION section 6 and D-132 need two counted reviews and green CI on each head. At that rate wave 1 is about 30 to 40 counted reviews. I have not measured how many counted reviews a day the sessions sustain; until that is measured, no date follows from this table.

## 6. The co-parent caption: answered

The record held two relayed answers on the co-parent caption, both dated 11 Nov: closed question N1 as amended (one tappable caption in Me that opens one sheet, design spec 07), and D-161 as drafted in #827 (no build shows a "coming soon" co-parent surface, which is what #720 shipped).

Asked on 19 Nov which stands, with the first listed as 1 and the second as 2, the founder answered in chat: "Sorry second. Go for it". So the shipped state stands: no caption and no sheet in any build. C-22 is dropped from the rank, and design spec 07 waits until co-parent sharing is ready for store builds (C-21). #827 carries the decision record and is the founder's to merge (D-125).

## 7. Work packages

Rows BL-923 to BL-949 are in `docs/BACKLOG.md`, section "New scope, waves 1 and 2 (19 Nov 2026)". Ids came from `node scripts/agents/next-id.mjs` (BL-923) and `node scripts/agents/id-collisions.mjs` on 19 Nov (no open PR uses BL-923 or above).

Broken down since: C-20 (BL-946), C-07 (BL-944, 945), C-25 (BL-947). Not broken down yet, with the reason: C-08, C-04 (cards written, no backlog rows yet); N-12 (its list lives in session papers, not the repo); C-23, C-24, C-10 (PRD 06 puts them at Build 15 earliest); everything from rank 35 down.

## 8. Not verified

Every device number. The true size of #798. Whether #680 and #758 still apply cleanly. The Build 12 cut state. How many counted reviews a day are sustained. NS-05's Level 1 rows are cited by section, not listed one by one.

Karma
