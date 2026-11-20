# New-scope product requirements (11 Nov 2026)

Author: `product`. Status: Locked v1.0, 20 Nov 2026 (council round 2; record in `16-council-review-round-2.md`). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. Cards state order and gates, never build numbers or dates (ruling T5); the roadmap and `13-engineering-plan.md` own timing.

Aligned on 11 Nov to the design specs in PR #794 (`docs/design/specs/NEW-SCOPE-INDEX-11nov.md` and 01 to 07, head at time of writing `0a8499ab`, which will move: cite PR #794 and read its current head; see the changes list below). Where a design default and an earlier line of mine differed, the design default won and the file says so.

Scope came from the founder's request of 10 to 11 Nov 2026 as recorded in `closed-questions-2026-11-11.md` (X1 order of new work, X2 voice leaving the phone, X3 and X4 free versus Plus). One file per item, in this order (it follows X1 of the closed list; X1 does not order Share one letter, so the build order for Share is set by the build targets in the table below, not by the file order): photo with a letter, Find, the family-hears-it pilot, the hands-free spike, Share one letter, then Firsts and the sealed letter (after Share one letter Level 1 and the five-parent study).

## Added 19 Nov 2026: the full pack

Start with `docs/product/VISION.md`, then `00-product-frame.md` (how we choose, what we optimise, where everything lives, the master index of every ranked item). The ranked list itself is `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`.

| File | Cards | Bucket |
|---|---|---|
| `00-product-frame.md` | frame, KPIs, IA, standing design, content and legal inputs, run cost, master index | all |
| `08-keeping-and-trust.md` | NS-08 backup readiness, NS-09 let it go finishes, NS-10 new phone, NS-11 save a copy, NS-12 earlier versions | A Keeping |
| `09-capture.md` | NS-13 reminders, NS-14 whose book, NS-15 another day, NS-16 someone else speaks, NS-17 second language, NS-18 typed days, NS-19 continue a draft, NS-20 two books | B Capture |
| `10-reading-and-family.md` | NS-21 letter page, NS-22 calm header, NS-23 one past letter, NS-24 read the year back, NS-25 the other parent, NS-26 to NS-31 later family and keepsake items | C, D |
| `11-foundations.md` | NS-32 notification budget, NS-33 accessibility, NS-34 speed, NS-35 one start, NS-36 data follows the letter, NS-37 Book stays fast | F Foundations |
| `12-parked-and-not-built.md` | what we said no to, and what would change our mind | G Parked |
| `13-engineering-plan.md` | sizes, skills, order, dependencies (Karma) | for the harness |
| `14-test-plan.md` | priorities, levels, journeys J-N1 to J-N27, device matrix, store-build gate | for `qa` |
| `15-council-review.md` | what the council found and how each was answered | record |

### How to read a card (locked shape, 20 Nov 2026)

Every card from NS-01 to NS-37 follows one shape after the round-2 council review. A section may say "n/a because ..." but may not be missing:
1. Who and when. 2. Why. 3. What, and Not in scope. 4. Happy path. 5. Unhappy paths and edge cases. 6. Scenario coverage (one row for each standing state in `00-product-frame.md` section 5). 7. Acceptance criteria: `Id | Given, When, Then | Priority | Test title`, where Priority is P0 with its RR-4 reason ((a) a promise, (b) a legal or store duty, (c) the core loop), P1 or P2. 8. Non-functional budgets: latency (p95 on an iPhone SE 3 under the 06-nfr protocol), memory, on-device storage, battery, offline, accessibility, localisation, privacy (log canary); defaults inherit 06-nfr. 9. State space (RR-5) where sync, accounts or notifications are touched, including the kill switch, the card's remote pause and plan lapse. 10. Data and engineering: fields, classes, migrations (server ones update the `entries` content trigger tuple and `book_entries`), sync field group, export effect, modules and files, flags and pause keys, error codes, rollout and rollback. 11. Data inventory rows. 12. Door lines. 13. Threat rows. 14. Never lines (no system-intelligence donation; writing tools off on letter fields). 15. Design inputs. 16. Content inputs (lines in quotes are intent; `content` writes; the founder approves). 17. Legal, privacy and compliance inputs (counsel packet 1.5.0 numbers; counsel must confirm). 18. Label effect. 19. Claims enabled and forbidden. 20. Free or Plus. 21. Measures with analytics off. 22. Dependencies and gates (no build numbers or dates: the roadmap owns timing). 23. Open questions, each with an owner and a default.

Priority: the Priority column in each card is the source; `14-test-plan.md` section 7 collects every P0 row. Locked cards change only by a PR that lists every changed id.

Cards for items further down the rank are shorter on purpose: they record the decision, the reason it waits, and what would reopen it, so nobody designs or builds them by accident.

## The ground rules every file obeys

| Rule | Source |
|---|---|
| Tabs are Home, Book and Me. Family is never a tab, the Library is not a tab, and no build shows a co-parent "coming soon" surface (founder answer of 19 Nov in chat, "Sorry second. Go for it"; D-161 as drafted in #827; D-160 on develop still allows "coming soon" until #827 merges). | closed N2, N3; D-161 draft |
| Only Home starts a letter. Everything else adds to a letter that exists or reads kept letters. | `NAV-TAB-ROLES-10nov.md` P1, P2, P9 |
| The machine may remove and repair, and may never add meaning. No streaks, points or counts of gaps. `{child}` only. | CLAUDE.md, BRAND.md, VOICE.md |
| One gate: Keep after the allowance of 2, planned raise 2, 5, 10 (D-082). Capture is never blocked. What a family kept stays theirs to read, hear and export. No "free forever". | D-082, closed X3 and X4 |
| A copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first. | closed X2 |
| Memory Library comes after the photo release as a whole. NS-01 is only NX-39 P0 (one picture per letter). | `exec-rulings-2026-11-10-expansion.md`; NX-39 |
| Metrics are content-free. Opt-in analytics is off through 1.0 (D-124). | F18, NX-39-R34 |
| Lens, Photos lens, Firsts lens, Home memory, index and Find (as a header action) are internal terms. `content` names the parent-facing words (BRAND.md glossary, CR-25); a parent never reads "lens". | BRAND.md |
| Level 1 share has no recording row and no recording path until `security-architect` and counsel reads are on record; design spec 03 has removed its recording toggle (SH-R2, SH-R10). The shared text has no footer, brand name or link (NS-05-R16, SH-R10). | Karma, 11 Nov |
| The first photo release is one picture per letter and no video. The design cap of 8 photos and 2 videos is out of scope for it. | design spec 01 section 1a |

## The files

| Rank | File | Item | Order and gate | Flag | Type |
|---|---|---|---|---|---|
| 1 | `01-photo-with-a-letter.md` | Photo-first capture on Home; Photos lens in the Book | First; gates G1 to G5 | `EXPO_PUBLIC_PHOTOS` | Build |
| 2 | `02-find.md` | Search the family's own letters on the phone | With photos; gates G1 to G5 | `EXPO_PUBLIC_BOOK_SEARCH` | Build |
| 3 | `03-family-hears-it-pilot.md` | Concierge pilot with 8 to 10 parents | none | none | Research, no build |
| 4 | `04-hands-free-capture-spike.md` | Time-boxed spike on hands-free start | none | none | Spike |
| 5 | `05-share-one-letter.md` | One-letter share; the Share tab question | After photos and Find; counsel Q45 gates the production flag | `EXPO_PUBLIC_SHARE_LETTER` | Build, gated |
| 6 | `06-firsts-sealed-letter-quick-capture.md` | Firsts, sealed letter, quick capture | After Share one letter (Level 1) and the five-parent study; sealed is author-only (ADR 0028 D3) and the seal sync choice is card section B10.1 (default: pull clause) | `EXPO_PUBLIC_FIRSTS`, `EXPO_PUBLIC_QUICK_CAPTURE` and others | Build, gated by study and spike |
| 7 | `07-remaining-capability-rows.md` | Every other NX-42 row: cited, specified or parked | mixed | `EXPO_PUBLIC_PRINT_READY` | Mixed |

Firsts and the sealed letter are in scope and not cancelled; only their build is sequenced. Flag names are proposals; `capabilities.ts` sets the final names. Dates are not in this folder.

## What the founder is asked, with defaults

Every open question in every file has a default. On 20 Nov every default below was taken under the founder's 19 Nov delegation ("Consult with exec team and make all decisions."); each stays reversible by the founder. Timing words in the defaults are superseded by the roadmap (ruling T5).

| Ask | File | Default if no answer | By |
|---|---|---|---|
| Is Photos P1 (date from the file) in Build 13? | 01 OQ-1 | No, P0 only | Taken 20 Nov |
| Search across all books? | 02 OQ-1 | No, active book only | Taken 20 Nov |
| Accept the pilot principle and the proposed success lines | 03 OQ-1, section 8 | Yes, as written | Taken 20 Nov |
| Spike engineer and week | 04 OQ-1 | The Monday after Build 13 is cut | Taken 20 Nov |
| Share one letter in Build 14, and no Share tab | 05 OQ-1, OQ-5 | Build 14; no tab | Taken 20 Nov |
| Firsts and sealed letters: both in scope; when the five-parent study runs | 06 OQ-A1, OQ-B1 | Study after Build 13; both built earliest Build 15, after Share one letter (Level 1) ships and the five-parent study has run | Taken 20 Nov |
| Proof books spend (the amount in the exec record, Q2) | 07 OQ-1 | No spend | Taken 20 Nov |

## Reads that gate anything

| Read | Gates | By whom |
|---|---|---|
| Counsel on the NX-33 photo label | NS-01 in `production` | counsel, through the founder |
| `security-architect` and counsel on any voice leaving the phone | NS-03 Arm V, NS-05 Levels 2 and 3 | both |
| `security-architect` on plist and entitlement deltas | NS-04 exit, NS-06 Part C | `security-architect` |
| Counsel on minors and "open on a day" | NS-06 Part B | counsel |

## Facts not verified

Competitor facts come from `FEATURE-GAP-AND-WEDGE-10nov.md` (pages read by another agent, not products run) and are UNVERIFIED here. I did not verify any law, Apple guideline or Expo capability; the files that mention them say where the source is or mark them UNVERIFIED. Requirement files that live only on open branches (NX-41 to NX-44 in PR #790; NAV-TAB-ROLES in PR #789; the research file in PR #792; NX-27, NX-33, NX-34, NX-16, NX-17) are cited by name and need a re-check when they merge.

## Corrections owed to NX-41 and NX-42 (reconciliation)

NX-41 and NX-42 live on PR #790's branch (`docs/nav-tabs-requirements-10nov`, head `d80db1f2`), not on `develop`, so this PR cannot edit them. The edits below are for that branch (BL-898 is the reconcile row). Karma's ruling (11 Nov): tabs are Home | Book | Me; Family is never a tab; co-parent is at most one caption line in Me.

| File and line | Says now | Must say |
|---|---|---|
| NX-41 R12 | "Alpha stays whole. ... the Family tab with the real co-parent screens stays" in a `preview` build | Family is never a tab, in any build. The real co-parent screens are reached from Me. No caption, row, sheet or "coming soon" line in any build (founder, 19 Nov: "Sorry second. Go for it"; D-161 draft in #827). |
| NX-41 section 4 and H6 | Four tabs; a Moments tab; an alpha Family tab | Three tabs: Home (Say), Book (Read), Me (Look after). No Moments tab, no Family tab. |
| NX-42 section 1, "Tab model" | Home, Book, Moments (proposed), Me | Home, Book, Me (three tabs). |
| NX-42 rows C17 to C21 and section 2.3 "Remember (Moments, proposed)" | Tab "Moments" | C17 and C18 attach to a letter (Review, letter page); the picture shelf is the Book's Photos lens (NS-01); C19 is a doorway into the same chooser; C20 shares Home's one memory slot. No Moments tab. |
| NX-42 row C25 | "Pay once for more letters" | Plus is a subscription (D-082): a membership that lets you keep letters beyond the free allowance. Prices only from the App Store and `packages/content`. |
| NX-42 rows C13 and C14, section 3 | Find "no new file"; Firsts MISSING | C13 is specified in `02-find.md`; C14 in `06-firsts-sealed-letter-quick-capture.md` Part A. |
| NX-42 section 4 | Counts Moments 6 | Re-count after the re-homing above. |
| BRAND.md internal-terms table (CR-25) | Has no rows for lens, index, Home memory or Find as a header action | Add the rows, and add parent-facing glossary rows for the words a parent sees. Owner: `content`. A hand-off, not a decision here. |
| `book.empty.bookCta` ("Write a letter") | A button on the Book's empty state that reads as starting a letter | A pointer to Home. Behaviour: a tab switch only. NS-01-R23 holds the test; `content` writes the word (design spec 06, J3). |
| Photos lens in the Book | (NS-01) | No "Add photos" button that starts a letter (NS-01-R23). |

Parent-facing words quoted in acceptance rows (for example "Photo with this letter", "Find a letter", "Share this letter", "Letters found", "This was a first", "hidden until") are PROPOSED. `content` owns the final words; the rows test the behaviour, not the spelling.

Trace ids: each acceptance row carries an id of the form `NS-01-R7` or `NS-06-A3`, and its test title starts with that id in square brackets, so a test can cite the requirement it proves.

## What changed against the design head (re-read 11 Nov; PR #794 head at time of writing 0a8499ab)

The tab job sentences are the design's (spec 06), and the navigation test N1 to N10 (spec 06 section 10) proves the one-entry rule: Home "I go to Home to say something to {child}."; Book "I go to the Book to read what we kept."; Me "I go to Me to look after my account and books." N3 needs one `startCapture({source})` function that `mobile` consolidates first (spec 06 section 12, step 0). The doorway names are `widget`, `controlCenterControl`, `actionButton`, `siri`.

| Design change | Where I applied it |
|---|---|
| Build 13 is one photo per letter, no video (spec 01 1a) | NS-01 head and R22 |
| "Start from a photo" is the third and quietest item inside the capture cluster (spec 01 3.1) | NS-01 section 3 and OQ-3 |
| Photos on a sealed letter do not count until it opens; a sealed letter contributes nothing to any surface (spec 04 FS-R10) | NS-01-R10, NS-02-R16, NS-06-B2 |
| Opening removes the seal permanently; the opening-day Home slot `seal.homeOpened` is allowed (spec 04 B4, Q4, FS-R3) | NS-06-B3, B4 |
| Share Level 1 has no recording row; no footer, brand name or link (spec 03 3.3, SH-R10) | NS-05-R16 |
| Share one letter is a founder decision, text first (spec 03 Q0/Q1) | NS-05 head |
| A typed place on a photo is searched; a derived place is not (spec 02) | NS-02-R5, NS-01-R21 |
| Design spec 01 now follows this PRD: system picker only, no pre-prompt, no date chip from the file in Build 13, fixed VoiceOver label (NS-01-R9, R11, R21, R22) | no change needed; confirmed |
| Author-only export exception (FS-R10 and FS-R11): the ZIP data export carries a sealed letter whole for the author; the PDF book and any other person's export never carry its words until the seal is removed | NS-06-B2, B5, NS-07-C28-4 |
| Design spec 02 FD-R13: a VoiceOver-only hint under 3 characters, drawn nowhere | NS-02-R23 |
| Design spec 03 now makes the words row static text, not a switch (SH-R15) | NS-05-R4, R13 |
| Design spec 07 (the tappable co-parent caption) is withdrawn by the founder's answer of 19 Nov: no "coming soon" surface in any build | README ground rules, NX-41 R12 row, NS-05 section 10 |
| Share verb and the 22-character label limit are a `content` and `legal` decision | NS-05 OQ-6 (flag only; the PRD wording is unchanged) |
| Seal opens at an absolute instant (spec 04 FS-R7): settled by ADR 0028 D3a (two columns written together; `seal_opens_at` is the rule, the date is display), accepted under CR-62, file on PR #797 until it merges | NS-06-B1 |
| Spec 02 dropped the "Type three letters" hint; PR #798's `find.en.ts` still has it | NS-02-R3: the `hint` slot leaves #798 |

## Appendix A. String-scan pattern lists (used by NS-05-R17, NS-06-A5, A12, B9 and NS-01-R24)

A test scans the named `packages/content` keys, case-insensitive, whole words unless marked. A match fails the test. These lists are PROPOSED by `product`; `content` owns the final list in `packages/content/test/rules.test.ts`.

| List | Patterns |
|---|---|
| Gap, norm and counting | not yet; still waiting; so far; only \d+; \d+ left; missing; behind; on track; typical; normal for; most babies; milestone; streak; in a row; days since; progress; points; badge |
| Loss and ending (VOICE.md legacy rule) | if I am not here; when I am gone; farewell; last letter; passing; legacy contact; in memory of |
| Seal wording | locked; unlock; secure vault; sealed forever; wax |
| Machine-writes (CLAUDE.md) | tidy; cleaned up; polished; improved; corrected; edited (for what the machine does); written for you; we wrote; AI; summary |
| Forbidden characters | em dash; en dash; curly quotes; ellipsis character; emoji |
| Exemptions | A key may be exempt only by an entry in the scan's allow-list with a written reason. First entry (PROPOSED): the iCloud download progress label of NS-01-R17, which uses the system progress trait; the word "progress" in that one string is allowed, and nowhere else |
| Code deny-list for the Firsts folder | imports from any speech, NLP, classifier or text-analysis module; names matching `classif`, `sentiment`, `mood`, `suggest` |

## Studies and the spike: owner, trigger, default

Each pass line in the PRDs can be run once its trigger is met. Dates for Build 13 and later are not in the repo, so triggers are events. All owners and defaults are PROPOSED.

| What | File | Owner | Trigger | Default if nobody sets it |
|---|---|---|---|---|
| Five-parent photo study | NS-01 section 9 | `user-research` | Build 13 with photos on is in TestFlight | Within one week of that build |
| Five-parent Find study (parents with 40 or more letters) | NS-02 section 9 | `user-research` | Build 13 with Find on is in TestFlight and five testers have 40 or more letters | Within one week; if no tester has 40 letters, use a fixture book and mark the result as a stand-in (RR-8) |
| Five-parent share study | NS-05 section 11 | `user-research` | Share Level 1 is in TestFlight (Build 14) | Within one week of that build |
| Five-parent Firsts study and sealed-letter study | NS-06 section A9 (Metrics) and section B8 (Metrics) | `user-research` | Share Level 1 has shipped (the sequencing rule of NS-06) | One combined session, after Share Level 1 ships |
| Hands-free spike | NS-04 | `mobile` with `security-architect` | The Monday after Build 13 is cut | Five working days from that Monday; hard stop on day 5 |
| Family-hears-it pilot | NS-03 | `user-research` with the founder | Dated plan in NS-03 section 5 | As dated there |
