# NS-46 to NS-50: days we mark, cultural background, the notification catalogue, picture-first start and suggestions, Home today

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: `product` (PM role) | Replaces: none | Load when: building or testing days, background, notification catalogue, picture-first start or Home today (NS-46 to NS-50).

Status detail: LOCKED rev 2, 20 Nov 2026, inside the lock (PR #934), after ten expert reviews (`tools/review/ns46-50/`: analytics, compliance, content, design-systems, marketing, mobile, privacy, product, qa, security). The items in "Conflicts and open items for Karma" and the founder's answers in "Founder items" keep their defaults; every default marked "default pending founder" holds until answered. Changes after lock need a PR that lists every changed id. The one-document reading of the whole pack is `22-final-holistic-spec.md`.

Author: `product` (PM role, a Claude session, not a scheduled `product` run), for Karma (CTO). Rewritten in place on 20 Nov to apply every review finding; new row ids continue each card's numbering (NS-46-R29 to R49 and R5b, NS-47-R28 to R38, NS-48-R28 to R39, NS-49-R28 to R37, NS-50-R13 to R18) and each id is unique across the reviews that proposed them. Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. These five cards answer the founder direction of 20 Nov (`20-founder-direction-20nov.md`, section 8 last line).

Sources, in precedence order: (1) every ruling in `GAP-LOG.md`, especially the four blocks added on 20 Nov: IA audit R-IA-1 to R-IA-6, notification catalogue N-1 to N-8, cultural background CB-1 to CB-6 and days library DL-1 to DL-10; (2) `20-founder-direction-20nov.md`; (3) the function reviews `functions/days-library.md` (FR-DAY, outline NS-46), `functions/cultural-background-data.md` (FR-CUL, NS-47), `functions/notification-catalogue.md` (FR-NTC, NS-48), `functions/photos-and-suggestions.md` (FR-PHS, NS-49), `functions/feature-opportunities.md` (FR-OPP) and `docs/design/e2e/IA-AUDIT.md` (worktree `/home/claude/wt/E`, head `ed44fe899`; NS-50); (4) the existing cards NS-01 (`01`), NS-13 and NS-18 (`09`), NS-23 (`10`), NS-32 and NS-35 (`11`), and the shape of `19-from-download-to-first-letter.md`.

Read with: `README.md` (the locked 23-section card shape and the Priority rule), `00-product-frame.md` (standing states, slip rule `[FRAME-SLIP]`), `GAP-LOG.md`, `18-errata-after-lock.md`.

Conventions (as `19`):
- Section numbers 1 to 23 follow the locked shape in `README.md`. A section may say "n/a because ..." but is never missing.
- Priority: P0 rows carry their RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Test titles start with `[NS-xx-Rn]`. `scripts/trace.mjs` does not yet read NS ids (r3 F1, gate G0), so no card claims trace coverage.
- Words in quotes that are not an existing `packages/content` key are intent for `content`, never final copy. "note" in this file's prose is internal; the parent-facing word for what the app sends is "reminder" (BRAND.md glossary, RV-3). UNVERIFIED marks anything not read in code or a source. Every legal reading: counsel must confirm (counsel packet 1.5.0 numbers; "needs a number from legal" where none exists). None of this is legal advice. I did not re-read every source; the ten reviews read Apple's pages, the code and the statutes they cite (each review says what it read and what it left UNVERIFIED), and I did not verify any holiday date, Apple rule or law myself.
- Timing: cards state order and gates only (ruling T5).
- Rulings D1 (sign-out keeps the book), D2 (writing tools off on letter fields), D3 (no system-intelligence donation), D13 (device evidence on the Asha-only install), T2 (free stays free) apply to every card here.
- Fictional family Asha only. No fixture pairs a real tradition with Asha (CUL review, FR-CUL-08).
- Screen ids. Existing e2e ids are cited as drawn (areas A to E, head `ed44fe899`: A-S01 to A-S15, B-S01 to B-S23, C-S01 to C-S22, D-S01 to D-S24, E-S01 to E-S29; C-S23 and E-ST47 are taken by privacy and support, GAP-LOG K9; E-S30 and E-S31 are proposed for support). New ids proposed here are the next free in each area and are PROPOSED until the area lead confirms: C-S24, C-S25, C-S26, A-S16, plus new states of existing screens. They collide with nothing in the inventory.
- Existing flags and keys are cited; new ones are marked PROPOSED and join the proposed ADR 0029 (no file yet) key list.

## What the five cards are, and how they split

| Card | One line | Owner lane |
|---|---|---|
| NS-46 Days we mark | A library of days the parent ticks; one Days page with the typed days of NS-18; a ticked day recurs yearly and is sent as one note through the existing planner slot and budget | `content`, `mobile` |
| NS-47 Cultural background | The optional, once-only question that helps browse traditions and countries; what is stored (only ticked days), where, for how long, and the lock-screen rules that keep a family's faith off the lock screen | `privacy`, `mobile` |
| NS-48 Notification catalogue and rotation | One pure function that picks the words of a note the planner already decided to send; adds no note, no class, no setting | `content`, `mobile` |
| NS-49 Picture-first start and Journaling Suggestions | Level 1 (Apple's picker) is a first-class start; level 2 (Apple's suggestions picker) is parent-started; level 3 (library reading) is closed | `mobile`, `privacy`, `security` |
| NS-50 Home today | One more rank in the single Home slip slot: a day the parent marked, today. Not a strip | `design-systems`, `mobile` |

Why five cards and no merge. NS-46 and NS-47 share a store and a Days page and stay apart because they own different promises: NS-46 owns which days exist, when they fire and what they say; NS-47 owns what we keep about a family and what a passer-by may learn. NS-48 touches every note but adds nothing the parent can see as a feature, so it carries no screen. NS-49 is the only card that touches a system process and an entitlement. NS-50 is the smallest because the slot already exists.

## Rulings that override a function review (followed here, noted once)

| Review proposed | Ruling that overrides | What this file does |
|---|---|---|
| Direction 3.1: a chosen day "becomes a typed day" | CB-2 | A ticked day is not a typed day. NS-46 owns a separate yearly store that feeds the same planner slot and the same budget as source `libraryDay`. NS-18 stays one-off, deleted after delivery |
| Direction section 5 and 6.4: a Home "strip" of up to four things; PHS FR-PHS-02 and design need "Home strip tile for the picker" | R-IA-3 | NS-50 is one more rank in the single slip slot. The picture suggestion is not a slip and not a tile: it lives in the capture cluster (NS-49-R1). The strip is refused as a feed |
| Review round 20 Nov: where two or more reviews showed a ruling wrong or too wide | RV-1 to RV-17 in `GAP-LOG.md` ("Review round 20 Nov") | Each is applied as the stated default and marked "default pending founder" or "pending Karma"; no GAP-LOG ruling text was edited |
| DAY 3.2 and 3.3: a ticked day wins over a birthday on the same date because `typedDay` sits above `birthday` | DL-2 | Order is: a day the parent typed, then birthday, then library day, then month, then evening. A ticked day yields to a birthday |
| NTC section 4.2 and direction 4.3: 8 to 12 variants per cell | N-1 and DL-5 | 6 per grid cell; 4 per day; 3 per season |
| NTC axis "hours since the last letter" (direction 4.2) | N-6 | The axis is days between the fire date and the newest made letter |
| DAY 5.1 rule 1: one names switch covers the day name too | CB-5, DL-10 | Library-day names sit behind their own switch (see "Conflicts", item 1) |
| CUL FR-CUL-12: the neutral string for all layers is a body; NTC 3.4: a neutral title | N-3, CB-5 | One neutral title and one neutral body, each one string for every layer (see "Conflicts", item 2) |
| PHS 4.1: a Home strip tile opens the picker | R-IA-3 | No tile; the "Pick from recent days" choice sits inside the picture start |
| CUL section 2 and PHS: new screen C-S24 etc. | none | Used as proposed ids; see conventions |
| VOICE.md line 70 (one exclamation mark a month in notifications) | N-5 | Zero; `content` corrects VOICE.md line 70 (NS-48-R10) |
| Direction 3.2 "East East" option; DAY Q-DAY-12 | CB-6, DL-9 | No "Eastern" option; "Another tradition" and "Not now" only; Lunar New Year, Mid-Autumn and Norooz are culture-led days |

## Founder items across the five cards (defaults hold until answered; a default is the requirement for design and build, never for public text, a counsel answer or a store submission)

Merged: Q-FD-2 with CUL-Q10; Q-FD-5 with CUL-Q2; the packed Q-PHS and Q-NTC cells are split. "Who else must read" lists agents or counsel who must read the answer before it is built. A default that changes what a user is promised is the founder's; Karma decides the technical ones (marked Karma).

| Id | Question | Ruled so far | Default if no answer ("default pending founder: Q-id" in the row) | Who else must read | Cards |
|---|---|---|---|---|---|
| Q-FD-1 | What does "East East" mean? | CB-6, DL-9: no such option; may mean East Asian | No option. "Add a day" and "Not now" cover it; culture-led days (Lunar New Year, Mid-Autumn, Norooz) offered without any question | content, privacy | 46, 47 FOUNDER-ANSWERED 20 Nov, default accepted (CL-009): No such option; Add a day and Not now; show in plain words first (departure from 842) |
| Q-FD-2 | When is the Days ask shown (merged CUL-Q10)? | R-IA-5, CB-6: after the first kept letter, a later sitting, once | Later sitting, not where the Keep gate, reminder ask or rating request showed; "Not now" is final for Home; Me stays; moves to Me only if more than 1 tester in 5 says "too personal" | marketing, design-systems | 47, 50 FOUNDER-ANSWERED 20 Nov, default accepted (CL-010): Later sitting after first kept letter, once; Not now final (departure from 842) |
| Q-FD-3 | Offer Mother's Day, Father's Day, Memorial Day, Veterans Day, never pre-ticked? | DL-1 | Yes; quiet tone for Memorial Day and Veterans Day | content | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-011: Offer all four never pre-ticked; Memorial and Veterans quiet |
| Q-FD-4 | Level 2 now; level 3 never in 1.x (merged Q-PHS-7) | Direction default | Level 2 after NS-01 is on `testflight`; level 3 is NS-51 (card 27): a spike only in Build 13 on `exp/photos` behind a flag, ship in 1.1 after the spike, the counsel read and the device rows (founder-answered 20 Nov, F1; errata E32) | security, privacy, counsel | 49 FOUNDER-ANSWERED 20 Nov, default accepted (CL-012): Reversed by direction 26; see Q2: spike in Build 13 behind flag, ship 1.1 |
| Q-FD-5 | Religion and country stay on the phone, and only ticked days are stored (merged CUL-Q2) | CB-1: all L4 | Yes, phone only; only ticked days stored; picks are a browse filter forgotten when the sheet closes | privacy, counsel | 47 FOUNDER-ANSWERED 20 Nov, default accepted (CL-013): Yes phone only, ticked only; part of 842 departures ask |
| Q-FD-6 | Reopen `occasion`, the Memory Library "on this day" part, and NX-39 R27? | N-2: first half yes (source only) | `occasion` as source only. "On this day" stays with NS-23 and NS-31. R27 stays closed for level 3, narrow exception for the picker | Karma | 46, 49 CLOSED 20 Nov, see GAP-LOG Closures CL-014: occasion as source only; on this day stays with NS-23 and NS-31 |
| Q-FD-7 | Which drop ships when? | none | The release cut: A with the next build, B only if its gates close before 1.0 freeze, C after 1.0 is approved | all | all CLOSED 20 Nov, see GAP-LOG Closures CL-015: A with Build 13; B only if gates close before freeze; C after 1.0 approved; NS-49 L1 moves to B because it depends on NS-01 which stays dark |
| Q-FD-8 | Add more cards (OPP-02 doorway, 03 same question again, 04 child's own words, 05 bring in)? | none | None before S2 first-run evidence (RA-06); OPP-03 is a 1.x card with a built-in delay (it needs an answer 6 to 12 months old) | user-research | pack CLOSED 20 Nov, see GAP-LOG Closures CL-016: None before S2 first-run evidence; OPP-01 is NS-49, OPP-03 cheapest next |
| Q-FD-9 | Who reviews each tradition's days, and which traditions are in the first tradition drop? | DL-8 | None ships without a recorded reviewer (pseudonymous id); start with traditions the founder can reach reviewers for; no public line says "all" | content, regulatory-affairs | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-017: Nothing ships without a recorded reviewer; no "all traditions" claim |
| Q-FD-10 | Who is accountable for the October review of every date row? | NS-46-R24 | The founder accountable, `content` does the read, a September scheduled issue | content, ops | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-018: Founder accountable on paper, content reads, scheduled issue in September |
| Q-FD-11 | Can the Journaling Suggestions capability be enabled on the App ID from the founder's account, and does Apple approve it (merged Q-PHS-3)? | none | `mobile` runs spike step 1; the founder is asked only if the portal says a request is needed (a founder hands row, not Mode `agent`); flag off until known (UNVERIFIED) | mobile, security | 49 FOUNDER-ANSWERED 20 Nov, default accepted (CL-019): Account step: mobile enables on test App ID, founder files if Apple needs a request; approval UNVERIFIED. Decision made, action pending founder hands: Apple entitlement request if the portal needs one |
| Q-FD-12 | At sign-out clear the store (CUL-Q3); and when the system ends a session? | CB-4: clear at sign-out | Clear; a system-ended session also clears with one calm line next time Me, Days opens (default pending founder: Q-FD-12) | privacy | 47 CLOSED 20 Nov, see GAP-LOG Closures CL-020 |
| Q-FD-13 | Keep the store out of the iPhone backup (CUL-Q4); a restored phone? | none | Exclude and read back; a restored phone is empty and the ask does not return; device-transfer test decides the call-out words | privacy, mobile | 47 CLOSED 20 Nov, see GAP-LOG Closures CL-020 |
| Q-FD-14 | Separate day-name switch (CUL-Q9); where does it live; can it return by itself? | CB-5: separate, default off, forced off with App lock | Separate; on the Days page under the list; turning App lock on sets it off and turning it off never turns it on (default pending founder: Q-FD-14) | privacy, content, design-systems | 46, 47 CLOSED 20 Nov, see GAP-LOG Closures CL-020 |
| Q-FD-15 | Remote pause for the library (DAY-R) | none | Yes, one boolean `killSwitches.libraryDays` (default pending founder: Q-FD-15), fail-open, not deliverable in a servers-off build; per-tradition hold waits for Drop C (RV-10) | Karma, ops | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-021: One boolean killSwitches.libraryDays, fail-open; proposed ADR 0029 (no file yet) vocabulary change by mobile |
| Q-FD-16 | Which countries after the US (DL-7)? | DL-7 | US only; the country list is absent until a second country ships and the founder names it | counsel | 46, 47 CLOSED 20 Nov, see GAP-LOG Closures CL-022 |
| Q-FD-17 | Regional or sub-community days (Pongal, Onam, Parsi New Year) in the first release (Q-DAY-8)? | none | Not in the first drop; after a tradition review exists for them | content | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-023 |
| Q-FD-18 | May commemorative and religious-observance days name themselves on a lock screen; and with App lock on? | N-3 (RV-1) | No: `publicTitleOk` is a hand-listed allowlist (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day); Memorial Day, Veterans Day, Juneteenth, MLK Day, Christmas Day, Columbus Day are neutral; with App lock on every title is neutral (default pending founder: Q-FD-18) | privacy, security, regulatory-affairs | 46, 47 CLOSED 20 Nov, see GAP-LOG Closures CL-024: Hand-list of seasonal days only; neutral under App lock |
| Q-FD-19 | Time of a day reminder: the parent's or fixed 09:00? | DL-6: 09:00 | Fixed 09:00; the listing and support words are fixed (`store.en.ts` "You pick the days and the time") | marketing, legal | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-025 |
| Q-FD-20 | May ticking the first day trigger the iOS permission ask once, after one sentence? | E K-E13 says whichever ask comes first asks iOS | Yes, once, through `next-ask`, final on refusal; the Days ask is not shown when permission is denied; Karma confirms K-E13 (default pending founder: Q-FD-20) | mobile, legal | 46, 47 CLOSED 20 Nov, see GAP-LOG Closures CL-026 |
| Q-FD-21 | Reminders off: do ticked days still send a reminder? | D W-G7 (typed days) | Yes for ticked days, with the consent line before the first tick and one calm line on Reminders (DPLA Attachment 1 2.2; counsel confirms); no master switch | legal, compliance-engineer | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-026 |
| Q-FD-22 | Planning horizon for library days | none | 366 days within the 60 ceiling; say plainly a parent opens the app once a year for far days (default pending founder: Q-FD-22) | mobile | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-027: 366 days within the 60 note ceiling; say plainly app opens once a year for far days |
| Q-FD-23 | Rank and cap of the Days ask (conflict 7, RV-5) | none | After Save a copy, before the past letter (rank 3b), retired after two unanswered showings; T3 may move it (default pending founder: Q-FD-23) | design-systems | 47, 50 CLOSED 20 Nov, see GAP-LOG Closures CL-028: After Save a copy, before past letter, retired after two showings; T3 measures |
| Q-FD-24 | On a quiet day does Home show an ordinary prompt under the quiet line? | none | No: the quiet line replaces the prompt block; Speak and Type stay (default pending founder: Q-FD-24) | design-systems, content | 46, 50 CLOSED 20 Nov, see GAP-LOG Closures CL-029: Quiet line replaces prompt block; Speak and Type stay |
| Q-FD-25 | Does a day show one way (the slip) however the parent arrives? | R-IA-3 | Yes, one slip, one place (RV-6) | design-systems, mobile | 46, 50 CLOSED 20 Nov, see GAP-LOG Closures CL-030: Yes |
| Q-FD-26 | Words: "reminder" not "note"; group "Days and reminders"; "Days you added" / "Days you chose"; "Dates differ by country. Which date should we use?"; "Independence Day"; "Not today" on the day slip; one word "photo" | BRAND glossary | All yes; `content` words them, the founder approves (RV-3) | content | 46 to 50 CLOSED 20 Nov, see GAP-LOG Closures CL-031: reminder not note; Days and reminders; Days you added / chose |
| Q-FD-27 | May the catalogue grid have a little playfulness on Friday and Saturday? | direction 4.1 | Yes; Monday and Sunday stay small and slow | content | 48 CLOSED 20 Nov, see GAP-LOG Closures CL-032: Yes Fri and Sat; Mon and Sun small |
| Q-FD-28 | Marketing: no frame, preview, post or promotional text shows a tradition, a faith day name or a greeting; the store, site and Notes never call the ask a question about religion; the fallback list ships if Review pushes back | none | Yes to all | marketing, legal | 46, 47 CLOSED 20 Nov, see GAP-LOG Closures CL-033: Yes; ask never called a religion question |
| Q-FD-29 | Last-letter kinds on a lock-screen body | N-4 (RV-2) | `spoke` and `typed` in the body, never the title; `picture` dropped; `first` and `small` only with names on and App lock off (default pending founder: Q-FD-29) | privacy, content | 48 CLOSED 20 Nov, see GAP-LOG Closures CL-034: spoke and typed in body not title; picture dropped; first and small only with names on |
| Q-FD-30 | May Apple's suggestion title be saved without the parent tapping "Use this" (merged Q-PHS-5)? | none | No; never by default; the label reads "From your phone" and is editable | privacy, security | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-035 |
| Q-FD-31 | Picture start becomes a two-item menu where level 2 exists (one more tap)? | none | Yes, only where level 2 exists; otherwise the button opens the picker directly | design-systems | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-036: Menu only where level 2 exists |
| Q-FD-32 | iOS floor (Q-PHS-2): raise to 17.2 or hide below it? | none | Keep 17.0, hide below 17.2; level 2 stays off until a weak-link launch run passes on 17.0 and 17.1 | mobile, security | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-037 |
| Q-FD-33 | A phone on iOS 17.0 or 17.1, one on 17.2 or later, an iPad | none | Borrow; record a waiver for what is missing, never for a lost letter; with none, level 2 stays off | qa | 49 FOUNDER-ANSWERED 20 Nov, default accepted (CL-038): Borrow; waive only what is missing, never for a lost letter; founder's device time. Decision made, action pending founder hands: borrow phones |
| Q-FD-34 | May the picker line or listing say "journal" so the purpose is "clearly evident" (DPLA 3.3.3(H))? | BRAND.md bans "journal" in prose | No change to the ban; the store name, the listing sentence and Apple's own sheet carry it; counsel confirms | legal, content | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-039: Keep BRAND ban; store name carries it (D-139); 3.3.3(H) read this session applies to Journaling Suggestions API only |
| Q-NTC-5 | Do more variants reduce turn-off? | N-1 sets size | A hypothesis that cannot be tested in 1.x (about 2,170 families needed); no public claim | analytics | 48 CLOSED 20 Nov, see GAP-LOG Closures CL-041 |
| Q-NTC-8 | Launch floor at freeze or the full set? | N-1 | Floor at freeze, full set after the S6 reading test | content | 48 CLOSED 20 Nov, see GAP-LOG Closures CL-041 |
| Q-NTC-9 | Which age does a band use (corrected age)? | R-IA-1 | The age the Book shows | content | 48 CLOSED 20 Nov, see GAP-LOG Closures CL-041 |
| Q-PHS-1 | Level 2 timing | none | After NS-01 is on `testflight` | mobile | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-037 |
| Q-PHS-2 | iOS target | none | See Q-FD-32 | mobile | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-037 |
| Q-PHS-3 | Entitlement approval | none | See Q-FD-11 | mobile | 49 FOUNDER-ANSWERED 20 Nov, default accepted (CL-042): Same as Q-FD-11. Decision made, action pending founder hands: Apple entitlement request if the portal needs one |
| Q-PHS-4 | Apple's own notification opening the app | none | A second step after a spike, P2; not ours | security, web | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-043 |
| Q-PHS-5 | Label as Apple's text | none | See Q-FD-30 | privacy | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-035 |
| Q-PHS-6 | Places or workouts read | none | None read; v1 reads photos only | privacy | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-043 |
| Q-PHS-7 | Level 3 spike | none | Spike in Build 13 only, behind a flag (see Q-FD-4; errata E32) | security | 49 CLOSED 20 Nov, see GAP-LOG Closures CL-043 |
| Q-QA-3 | Out-of-date table: red build on a date or a scheduled issue? | none | A scheduled issue in September with the due date printed | qa | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-045 |
| Q-QA-4 | Above 60 budgeted notes which are kept? | none | The nearest 60 by fire date; later ones return at the next re-plan | mobile | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-045 |
| Q-AN-3 | Order of asks when analytics returns | none | Reminder prime, then Days ask, then analytics consent, each in a later sitting | analytics | 47 CLOSED 20 Nov, see GAP-LOG Closures CL-045 |
| Q-AN-5 | Extend TRACKING_PLAN 6.4 to a parent's chosen days (typed or ticked)? | none | Yes, it only narrows what is sent; Karma decides | analytics | 46 CLOSED 20 Nov, see GAP-LOG Closures CL-045 |
| Q-AN-6 | Seconds for "no added time" on Home | none | Median under 1 second, none 3 seconds or more slower; fixed before day 0 | design-systems | 50 CLOSED 20 Nov, see GAP-LOG Closures CL-045 |
| COUNSEL | CUL-Q5 (export), Q6 (device-only sensitive data, controller, Article 7), Q7 (label sentence), Q11 (4.5.4 and local notes), Q-DAY-6 (second plain line), Q-DAY-11, FR-DAY-23 (source licences), the consent line (Attachment 1 2.2), DPLA 3.3.3(H), 5.1.3 and the Q43, Q45, Q48, Q54 pictures, K6 age-rating re-read for NS-46 and NS-49 | none | Flag stays off until answered; the Drop B subset needs only the licence question for any copied table. A counsel answer is never defaulted | legal, regulatory-affairs | 46, 47, 49 |

## Conflicts and open items for Karma (each carries the review-round resolution; Karma confirms)

1. **One names switch or two (CB-5 and DL-10 against N-7 and DAY 5.1).** Compatible: N-7 is about the child's name, CB-5 about a day's name. Resolution (RV-13): the day-name switch lives on the Days page (C-S24) so Reminders keeps one names switch; a typed day's words follow the same switch (RV-8, NS-47-R37, needs an NS-18-R3 errata row). Karma confirms.
2. **A public day's name in a title (N-3) against "the day's name shows only behind its own switch" (CB-5).** Resolution (RV-1): `publicTitleOk` is a hand-listed allowlist and with App lock on every title is neutral (NS-46-R36); default pending founder: Q-FD-18.
3. **The same neutral words, three drafts.** Kept as three strings for three jobs (typed-day title; library-day neutral title; hidden-preview placeholder) plus one neutral body per tone (NS-46-R37); the DAY 5.1 and 5.4 samples are superseded. `content` decides the words.
4. **A ticked day per account or per book.** Per account, cleared at sign-out (CB-4); the landing uses the active book's `{child}`; a quiet or hidden book gets none (R-IA-6); with every included book quiet or hidden no library reminder is sent.
5. **Library day on Home: a slip (R-IA-3) against the typed-day line.** Resolution (RV-6): one way, the slip, however the parent arrives; the D-S11 library-day state is dropped. Karma confirms.
6. **Where the one-a-day budget is enforced.** Answered by `mobile`: nowhere (`planner.ts:320-350`; `plan-reminders.ts` is a second scheduler); `budget.ts` (NS-46-R30) is a hard prerequisite of NS-46 and NS-48, and `setChildQuiet` has no planner reader (errata E16, BL-985).
7. **Rank of the Days ask slip.** Resolution (RV-5): rank 3b, after Save a copy, retired after two unanswered showings; T3 may move it.
8. **NS-32-R5 says "no `occasion` class".** Still true (N-2). `libraryDay` is a ranked source of the `typedDay` group (NS-46-R29); NS-32-R3 and R5 gain that ranking. A registry row would be a new class and contradict N-2.
9. **The remote pause is not deliverable in a servers-off build (RV-10).** One boolean, fail-open, wired outside `mayRun`, a `kill-switches.ts` vocabulary and proposed ADR 0029 (no file yet) change; a per-tradition hold waits for Drop C.
10. **Reminders off, and the first permission ask (RV-9).** Day sources get their own gate; ticking the first day makes the one iOS ask after one sentence; Karma confirms this does not break E K-E13.
11. **N-4 last-letter kinds (RV-2).** `picture` dropped; `first` and `small` only with names on and App lock off.
12. **The Days ask against FR-MKT-24 (no promotional slip).** Accepted as one family question, once per account (NS-50-R16); FR-MKT-24 is reworded.
13. **TRACKING_PLAN 6.4 for a parent's chosen days.** Extension proposed (Q-AN-5), Karma decides.
14. **BRAND.md bans "journal" in prose while DPLA 3.3.3(H) needs the journaling purpose "clearly evident".** Default keep the ban (Q-FD-34); counsel and the founder decide.

## Changes these cards ask of locked cards (ids; for the errata PR)

| Card row | Change | Because |
|---|---|---|
| NS-32 section 3 priority list, NS-32-R3, NS-32-R5 | Priority within the budget: a day the parent typed (NS-18), birthday, `libraryDay`, `monthAge`, `evening`. `libraryDay` is a ranked source of the `typedDay` group, not a class. Add the two-ticked-days case | DL-2, CB-2, N-2 |
| NS-32-R12, R13 | Name the library-day neutral title and body; one names rule per layer (NS-47-R12, R13) | N-3, CB-5 |
| NS-32 section 3 (note) | Apple's journal suggestion notifications (iOS 26) are the system's, outside the budget; no sentence says "one a day" covers them | PHS 3.4 |
| NS-18 section 3 Not in scope; D-S06 "Days to remember" section | No change to "recurring days, days the app suggests" (they belong to the library store). The typed-day list moves from the Reminders page to the one Days page, C-S24, which draws NS-18's add flow (D-S08, D-S09) unchanged | CB-2, R-IA-2 |
| NS-13 names switch rows (R6a, R33) | State that `notifications.lockScreenNames` covers the child's name only; the library day name has its own switch (NS-47-R12) | CB-5 |
| NS-13-R27 anchor, R18, R19 | Become a hard prerequisite of NS-48 (the recency axis); no change to the rows | N-6 |
| NS-35-R3, R5 | The closed list of start sources gains `suggestion` once level 2 is ruled in (NS-49-R2) | FR-PHS-02 |
| NS-01 section 3, section 12 (Shown), NS-01-R22 | One line: a picture may also come from the phone's recent-days list (NS-49); R22 "only source" wording names both out-of-process pickers; level 3 and NX-39 R27 stay closed | PHS section 10 |
| NS-11 section 3 | One line: the list of days is not in Save a copy | CB-4 |
| NS-36 erase and registry rows | The days store is a registry row (L4, per account, excluded from backup, cleared at sign-out and Erase) | FR-CUL-01, 16 |
| NS-45 (when written in `19`) | Carries the sign-out clear and the Delete account line (NS-47-R15, R17) | CB-4 |
| `00-product-frame.md` slip order and `[FRAME-SLIP]` | Registry gains rank 2b (a day we mark today) and 3b (the Days ask), order as NS-50-R5 | R-IA-3, R-IA-5 |
| `VOICE.md` line 70 | Corrected to match line 160 and the checker (zero exclamation marks in notifications) | N-5 |
| NS-18-R3 | Words of any typed day, including one added through "Add a day", show on a lock screen only behind `notifications.dayNames` | NS-47-R37, RV-8 (Karma rules the errata row) |
| NS-13 section 3a and BL-966 scope text | The horizon of 35 days is NS-13's policy for evening reminders, not an iOS rule; BL-966 names the `libraryDay` rank; `budget.ts` is the one chooser | RV-4, NS-46-R29, R30 |
| `packages/api/src/kill-switches.ts` header and proposed ADR 0029 (no file yet) | Gains `libraryDays`; the header says a switch can hide a phone-only feature (errata E21) | NS-46-R28 |
| D-S06 | One calm line when Reminders is off; no day-name switch row (it lives on C-S24); the "Names in notifications" help line says it covers the child only | NS-47-R14 |
| COMPONENTS C9 and `[FRAME-SLIP]` | Variants `daySlip` and `askSlip`; order (1), (2), (2b), (3), (3b), (4); "Not today" close key | NS-50-R5 |
| NS-33-R4, R7, R16 and quality Annex B.3 | The screen set gains C-S24, C-S25, C-S26, A-S16, A-S01 `dayToday` and `daysAsk` | NS-46-R26, NS-47-R25 |
| `BRAND.md` glossary and internal-terms table | Rows for "days you chose", "library day", "days store", "catalogue key", "slip"; "note" stays banned for what the app sends | RV-3 |
| `docs/analytics/TRACKING_PLAN.md` 6.4 and `catalog.test.ts` | Stems and kinds in NS-47-R34, NS-46-R34 | Q-AN-5 |
| FR-MKT-23, FR-MKT-24, FR-MKT-11 | One ask slip allowed; keywords carry no faith, holiday, "photos" or "journal" words | NS-50-R16, NS-46-R47 |
| `store.en.ts` REMINDERS paragraph | "You pick the days and the time" becomes true of evening reminders only when days ship | NS-46-R46 |
| FR-SEC-22 L4 screen list | Gains C-S24 to C-S26 | NS-47-R26 |
| `docs/legal/app-store-privacy-labels.md` | One row: on-device religious or ethnic data not collected, re-checked per build | NS-47-R23 |
| `docs/support/macros.md`, `docs/ops/ACCESS.md`, help centre | Days macros, access row, article | NS-46-R45 |
| `FUNCTION-TRACE.md` | Regenerated from the final row numbering (its FR-CUL and FR-PHS cites pointed at superseded ids) | `gen.py` rerun |

## Release line and cut (order and gates only, no dates: ruling T5)

The pack now has 87 P0 rows (63 before the reviews) and stands on planner work that is not built (typed days, `budget.ts`, the anchor, the quiet reader) and on external gates (counsel, tradition reviewers, an App Review reading of a faith question, a device walk). It adds ways to start a letter; it does not add a second job. A row not in the drop being built is not a P0 for that build (Q-FD-7).

| Drop | Contents | Gate that must be true first | Line |
|---|---|---|---|
| A (independent of the rest) | NS-48 phase 1: day-part filter, weekday tone and the built 8 re-keyed, the rules-test coverage and the no-key payload. No new setting, no stored field | No planner change beyond words | The next build (Build 13 or later); CI and the rules test |
| B (after the planner foundations) | NS-46 seasonal, family and civic days for the US only, the plain browse-and-tick list in Me (the CUL-Q8 fallback: no ask slip, no tradition, no country), NS-47 store rules only, NS-50 rank 2b, NS-49 level 1 (R1, R3, R4, R25, R26; moved here from A on 20 Nov, CL-015, because it needs NS-01 and NS-01 stays dark) and only if the A-S01 re-draw passes its AX5 test (NS-49-R1) | NS-01 on `testflight`; BL-966, BL-982, BL-963, BL-985 done; `budget.ts`; the days store registered and Erase-scanned; counsel on any copied table licence (rule-computed dates need none, DL-4); the consent line read by counsel | 1.0 only if every gate closes before freeze, otherwise 1.1 |
| C (after 1.0 is approved) | NS-47 ask slip (rank 3b), tradition browse, culture-led days, tradition-member review, day-name switch, NS-48 recency and last-letter layers, NS-49 level 2 behind `EXPO_PUBLIC_SUGGESTIONS` | Counsel CUL-Q5 to Q7 and Q11 on record; J-CUL-01; a named reviewer per tradition; the NS-13 anchor; the entitlement; a weak-link launch run on 17.0 to 17.2 and 26 | 1.x |

Every row, tagged with its drop (`A`, `B`, `C`; "B, C" means the row has a part in each):

| Card | Rows by drop |
|---|---|
| NS-46 | B: R1, R2, R3, R4, R5, R5b, R6, R7, R8, R9, R10, R11, R12, R13, R15, R17, R18, R19, R21, R22, R24, R25, R26, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R40, R41, R42, R43, R44, R45, R46, R47, R48, R49; B, C: R16, R23; C: R14, R20 |
| NS-47 | B: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R15, R16, R17, R18, R21, R22, R23, R24, R26, R28, R29, R34, R36, R38; C: R14, R19, R20, R25, R27, R30, R31, R32, R33, R35, R37 |
| NS-48 | A: R1, R2, R6, R10, R11, R12, R13, R14, R15, R16, R17, R18, R20, R22, R23, R24, R25, R28, R31, R32, R33, R34, R35, R36, R37, R39; B: R8, R9, R19, R21, R26; C: R3, R4, R5, R7, R27, R29, R30, R38 |
| NS-49 | B: R1, R3, R4, R25, R26 (moved from A, 20 Nov, CL-015); C: R2, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14, R15, R16, R17, R18, R19, R20, R21, R22, R23, R24, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R37 |
| NS-50 | A: R13; B: R1, R2, R3, R4, R5, R7, R8, R9, R10, R11, R12, R14, R15, R17, R18; C: R6, R16 |

This sequences the rulings CB-6 and DL-7; it reopens neither. CLOSED 20 Nov (CL-015; founder: "Go with all default answers"): A with the next build, B only if its gates close before 1.0 freeze, C after 1.0 is approved; NS-49 level 1 moves from A to B because it depends on NS-01, which stays dark.

## Review round 20 Nov: what the reviews changed

Ten reviews (analytics, compliance, content, design-systems, marketing, mobile, privacy, product, qa, security) found no BLOCK and no card-level P0 that stops a docs merge; the P1 items are applied above. Rulings in `GAP-LOG.md` were not edited; where two or more reviews showed one too wide or wrong, an entry RV-n in the appendix "Review round 20 Nov" records what, why, evidence, default and who decides. Stale claims corrected here: Apple's suggestion data ("only the picture reaches the app" is not true: the app receives the chosen suggestion and uses only its picture; K13 and FR-PHS-54 rest on it); the 35-day horizon (NS-13's policy, not an iOS rule); "60 plus 4" (60 in total, E13); "one a day is enforced" (it is enforced nowhere, so `budget.ts` is a prerequisite); "built today" for Home slips (the host and registry do not exist); "note" for a reminder (BRAND glossary); the E18 snapshot rule (blank with or without App lock); the "Apple-provided copy is deleted once read" (the app deletes only its own copy); "ticks do not need notifications" (day-only gate and one ask).

---

## NS-46. Days we mark (candidate C-xx; kind Attractive; area B Capture, lives in Me)

### 1. Who and when
A parent who would like a short, personal note on days that matter to their family: a season, Mother's Day, Thanksgiving, Diwali, Eid, Easter, Hanukkah, Lunar New Year. The first offer is a Home slip after the first kept letter, once, in a later sitting (NS-47-R19); after that the Days page in Me, any time. Not in first run.

### 2. Why
The parent's own choice is the gentlest prompt there is (NS-18 section 2), and a day on the calendar is a natural thing to say something to {child} about. Job: "Tell me what to write about, without nagging." Evidence: the founder's direction only; no research yet. The tester sheet in section 21 and the research plan follow (HYPOTHESIS, not observed).

### 3. What, and Not in scope
**What.**
1. A library of days, as data with a source per row (layers: seasonal and shared, family and parent, civic and commemorative, traditions, culture-led, national). The parent ticks the days they want. Nothing is ticked for them.
2. One Days page, C-S24 (PROPOSED), in Me under a new "Days and reminders" group (R-IA-2; the Me regroup is built only after tree test T1, R-IA-4). It lists the parent's own typed days (NS-18) and the library days they ticked as one list, with "Add a day" (NS-18's flow) and "Browse days" (C-S25, a sheet).
3. A ticked day recurs each year until unticked. It is stored in a separate yearly store (CB-2), not as a typed day, and feeds the same planner slot and the same one-a-day budget as source `libraryDay` (no new class; N-2).
4. The parent can move a date for one year or for always, and can say "which calendar" where authorities differ (DL-3).
5. On the day, 09:00 local (DL-6), one note. Its lock-screen words follow NS-47-R12 and R13. A tap lands on Home with the day's name and one line above the prompt (NS-46-R13).
**Not in scope.** Pre-ticked days; inference of any kind; location; any note built from a picture, a letter, a place or a name; any greeting or explanation of a day; recurring typed days (those stay NS-18's one-off); a second notification class; a "complete your list" or a count of days ticked or missed; the religion and country question and the store's privacy rules (NS-47); the "on this day" look-back (NS-23, NS-31); other countries' national days (DL-7: later, after the founder names a country field in scope).

### 4. Happy path
1. The first letter is kept. In a later sitting Home shows one slip (rank 3b, NS-50): the ask in NS-47. The parent taps "Choose days".
2. The Days page opens with nothing ticked. "Browse days" shows seasonal and shared, family, civic, then "Traditions". The parent ticks Thanksgiving, the first day of spring and one tradition day, then "Done". The Days page now lists three days with their next dates ("around" where the date moves).
3. On the day, at 09:00, one note arrives. A public day (Thanksgiving) may name itself in the title; a family or tradition day shows the neutral title (NS-47-R12, R13).
4. The parent taps it. Home shows the day's name and one line above the prompt; one more tap starts speaking. The words are the parent's.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| Two ticked days on one date (14 Feb 2029: Valentine's Day and Ash Wednesday; 16 May 2027: Pentecost and Eid al-Adha, per DAY 4.8) | One note, neutral title, both names after the tap; no day is moved (NS-46-R8) |
| A birthday on the same date | The birthday is sent; the library day yields that year (DL-2, NS-46-R7) |
| A day the parent typed (NS-18) on the same date | The typed day is sent; the library day yields |
| A plan notice the same date | Both are sent (plan notices are outside the budget, NS-32-R4) |
| The parent moves a date for one year, or always | Their date is used; it counts as the parent's own date; the table is not edited |
| Authorities disagree (Eid al-Fitr 2026: 20 or 21 Mar; Diwali 2027: 28 or 29 Oct; Buddha's birthday 2026: four dates) | One calm question, "Dates differ by country. Which date should we use?" (intent; options name the source plainly and one is "I will pick my own date"); the default is the first row of the parent's tradition; the day shows as "around" |
| A day has no published date for the coming year | Nothing is scheduled; the Days page shows one calm line; the next app update refreshes the table (NS-46-R14) |
| A moon-sighting day is one day off | The parent moves it; support has a macro (FR-DAY-21) |
| Notifications not allowed in iOS Settings | Ticking still works; one line says nothing arrives until notifications are allowed in Settings and no promise of delivery is made; the one ask follows NS-46-R31 and is never repeated (E K-E13); the day still shows on Home when the app is opened that day |
| Reminders switched off | Library days still come if notifications are allowed, as typed days do (D W-G7); Me, Reminders and Me, Days each say so in one calm line (NS-46-R35) |
| Reduce Notifications, a Focus mode, Show Previews set to Never | The hidden-preview placeholder shows; the parent's iOS settings decide the rest; nothing is time-sensitive |
| App lock on | No day name on the lock screen whatever the switch says (NS-47-R12) |
| The time zone changes or the parent flies | Astronomical days are stored as a UTC instant and shown on the phone's local date; a fixed or rule day stays on its calendar date |
| A Southern Hemisphere phone | The row carries the event (March equinox) and two names; the Browse sheet shows northern names unless the parent switches the small hemisphere control; no location service (DAY 3.4) |
| The parent unticks a day | Its pending note is cancelled at once |
| Quiet or hidden book | No library note for that book (NS-46-R25) |
| Sign-out, Erase everything, Delete account | NS-47-R15 to R17 |
| A day is not in the library | "Add a day" takes it in the parent's own words (NS-18). The app never says a day is missing |
| Bad data found after release (a wrong date) | `killSwitches.libraryDays` (PROPOSED) hides the library at the next focus and cancels pending library notes (section 9); a corrected table ships with an update |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Nothing ticked, nothing sent, no message about it. The Days page's empty state says nothing about gaps |
| Empty, normal, many | Empty: no note. Many (every library day ticked): still at most 1 budgeted note a day and under the 60 pending ceiling (NS-32-R7) |
| Offline | Everything is local; no network is needed |
| Slow | Planning a year of ticked days: a Node proxy measured 0.8 to 1.9 ms per plan (mobile review); the SE 3 Hermes figure is UNVERIFIED and is a device-check task, no CI wall-time assertion |
| Failed | iOS refuses to schedule a note: the built failure line; nothing else changes |
| Interrupted, killed mid-flow, updated mid-flow | A tick is saved as it is made; the Browse sheet re-opens at the top; after an update, a restore, a time zone change or a clock change every pending note is re-planned (NS-32-R16, K11) |
| Low storage | The table is under 100 kB (ASSUMED); no extra download |
| Low Power Mode | n/a |
| Kill switch `serverFeaturesEnabled()` off | The library works (nothing here uses the server) but the remote pause cannot be delivered in a servers-off build (RV-10) |
| Remote pause `killSwitches.libraryDays` (PROPOSED) | Library hidden, notes cancelled; typed days and reminders unchanged (K-6: disappears at the next focus, never under a finger) |
| Outage | n/a (local) |
| Plan lapsed | No effect; free (section 20) |
| Signed out | The store was cleared at sign-out (NS-47-R15) |
| Second account on the same phone | B reads nothing of A's days (NS-47-R15) |
| New phone | Empty; the ask follows its rules afresh (NS-47-R7) |
| Two books, two parents, expecting | Per account store; the landing uses the active book's {child}; a quiet or hidden book gets none; each parent's phone holds its own store, never shared (NS-47-R24); an expecting book uses the nameless prompt line as the typed day does |
| VoiceOver, AX5 plus Bold Text on SE 3 | NS-46-R26; the Browse sheet is a flat list |
| Devanagari, RTL | Names are in English at version 1 (VOICE.md); names from other languages keep the family's spelling (FR-DAY-19); the languages review owns translation |
| Every error code | `days_store_unavailable` (PROPOSED, local: the store could not be read; the Days page shows one line and Try again, never a crash) and the built notification failure line |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-46-R1 | Given the build, When the data tests run, Then every day row in `packages/content/src/days/` has `id`, `layer`, `nameKey`, a rule or a table, an `authority` on each table row, `precision` (`exact` or `about`), `tone` (`bright` or `quiet`), `publicTitleOk`, and `preTicked: false`, and every table cell is a date or the literal `n/r` (no date written from memory) | P1 | `[NS-46-R1] every day row has its fields and a source` |
| NS-46-R2 | Given Days, Browse, or the ask slip is opened, Then no day is ticked; a day is scheduled only after the parent's own tap; "Not now" and leaving schedule nothing; and the build fails if any row has `preTicked` true | P0 (a) | `[NS-46-R2] nothing is ticked for the parent` |
| NS-46-R3 | Given the Days page, Then typed days (NS-18) and ticked library days are one list in one place with one "Add a day" flow (one list on the screen, two stores underneath, by design: typed days stay as BL-982 builds them in `settings`, ticked days live in the days store of NS-47-R6, so a failed library read leaves typed days, R40), the Reminders page no longer holds a second list, and the page has no count, no header such as "You mark 7 days" and no "complete your list"; until tree test T1 has run the page is one row "Days" under Reminders in the present group and the Me regroup moves it later without changing the page; the two list sections are headed "Days you added" and "Days you chose" (words by `content`) | P1 | `[NS-46-R3] one Days page and no counts` |
| NS-46-R4 | Given the NS-32 registry after this card, Then it has no new class and the planner emits a `libraryDay` item as a source of the `typedDay` group, with the content key `days.<id>` resolved only inside the days module, under the same budget, ceiling and neutral placeholder; the notification identifier is `el.day.<isoDate>`, never `days.<id>`, a catalogue key or a layer | P0 (a) | `[NS-46-R4] a ticked day adds no class` |
| NS-46-R5 | Given a typed day delivered (NS-18-R7), Then it is deleted the day after as before, and no code path makes a typed day recur | P0 (a) | `[NS-46-R5] a typed day does not recur` |
| NS-46-R5b | Given a ticked day delivered, Then it is not deleted after delivery and recurs next year until the parent unticks it | P1 | `[NS-46-R5b] a ticked day recurs` |
| NS-46-R6 | Given a ticked day, Then the phone stores its id and optional overrides, never a copy of the date; Given a corrected table in an app update, When the app next plans, Then every ticked day is re-resolved from the new table; a ticked id no longer in the table is dropped silently (NS-46-R43); the days store file carries a version number and a higher unknown version is read for the keys it knows and never rewritten or deleted | P1 | `[NS-46-R6] ticks store ids, not dates` |
| NS-46-R7 | Given two budgeted notes due on one date, Then the order is: a day the parent typed, birthday, `libraryDay`, `monthAge`, `evening`; Given a first birthday that falls on a ticked day, Then the birthday is sent and the library day is not | P0 (a) | `[NS-46-R7] birthday beats a library day` |
| NS-46-R8 | Given two ticked days on one date (planner, store, landing and lock-screen tests use synthetic ids `zz-test-day-a` and `zz-test-day-b`, never a real tradition on a book with Asha; the real pairs 14 Feb 2029 and 16 May 2027 appear only in content-data tests that hold no child), Then exactly 1 note is scheduled with the neutral title, both names show after the tap (any number joined by NS-46-R39), and no day is moved to another date | P0 (a) | `[NS-46-R8] two days one date one note` |
| NS-46-R9 | Given a ticked day and a plan notice on one date, Then both are delivered; Given the pending ceiling, Then it is 60 in total with plan notices kept first within it (errata E13, not 60 plus 4), when it binds the nearest by fire date stay and later ones return at the next re-plan, and the budgeted group never exceeds 60 minus the plan notices pending | P1 | `[NS-46-R9] plan notice and ceilings hold` |
| NS-46-R10 | Given a library day, Then its note is planned for the next 366 days within the ceiling (a parent who does not open the app for a year may have far days not pending, said plainly on C-S24; the 35-day horizon is NS-13's policy for evening reminders, not an iOS rule), 09:00 local clamped into the parent's window (07:00 to 21:30 in 15 minute steps), never time-sensitive; a day that begins at sundown is sent on the daytime date its list gives; no sunset or location is used; the time is not the parent's choice and no public line says it is (NS-46-R46) | P1 | `[NS-46-R10] library day time, window and horizon` |
| NS-46-R11 | Given an astronomical day, Then the row stores one UTC instant and the note falls on the phone's own local date (the 23 Sep 2027 06:02 UTC equinox is 22 Sep on Pacific time and 23 Sep on Eastern time; the test oracle is a sourced table with its read-on date, never derived from the code under test); the picker offers the astronomical day by default and the meteorological first of the month as the second choice; season names follow the hemisphere switch | P1 | `[NS-46-R11] astronomical days follow the phone's date` |
| NS-46-R12 | Given every rule-based day (fixed, nth weekday, Easter by the computus), Then the phone computes the date and a test equals a sourced oracle table for 2026 to 2030 (authority and read-on date committed with it; the test fails if the oracle has no source, as `helplines.test.ts` does); no third-party table is copied for a rule date (DL-4) | P1 | `[NS-46-R12] rule dates are computed and match` |
| NS-46-R13 | Given a tap on a library-day note, Then Home opens within 2 seconds on an SE 3 (routing and payload are NS-46-R32) and shows the day the one way NS-50-R4 draws it, as the day slip with the day's name and one line, never from the payload; the prompt below is an ordinary prompt (NS-47-R5), except on a `quiet` day, where the quiet line replaces the prompt block and Speak and Type are unchanged (RV-7, default pending founder: Q-FD-24); one more tap starts speaking; two ticked days name both | P1 | `[NS-46-R13] the landing shows the day and a plain prompt` |
| NS-46-R14 | Given a moving day, Then the row carries an `authority` and a country or tradition and `precision: about`, the picker and the landing say "around", and where authorities differ the picker asks one calm question (about which date, never about the family's calendar or belief) and keeps the parent's choice; the parent can move the date for one year or for always and that date is the parent's own (DL-3) | P0 (a) | `[NS-46-R14] a moving day says around and can be moved` |
| NS-46-R15 | Given a ticked day with no date for the coming year, When the planner runs, Then nothing is scheduled for it and the Days page shows one calm line ("{day}: no date for next year yet." No promise of an update, RV review content F13); no count, no warning style, no badge; years no authority has published are not shipped (DL-3) | P1 | `[NS-46-R15] no date means no guess` |
| NS-46-R16 | Given Memorial Day, Veterans Day, Good Friday, Yom Kippur or a national day whose name refers to a war or a lost life, Then the day is offered, never pre-ticked, with tone `quiet`: its name only, no prompt, no question mark, no "remember"; a parent cannot change the tone (DL-1) | P0 (a) | `[NS-46-R16] quiet days stay quiet` |
| NS-46-R17 | Given every `days.landing.*`, `days.lock.*`, `days.picker.*`, `days.nextYear.*` and `days.door.*` key (`days.name.*` has its own rule: no greeting, no "your", no digit outside a name from an allowlist; Mother's Day and Father's Day are names, not relationship words), When the rules test runs over the real keys (NS-48-R28), Then none has "your" before a day name, a relationship word, a greeting (Happy, Merry, Blessed, Mubarak), "celebrate", "gather", "together", "around the table", a digit outside a date, a `{child}` in a names-off lock string, a question mark in a `quiet` line, an exclamation mark, a count or comparison ("another year"), or a claim about what a day means; each new pattern has a positive and a negative self-test | P0 (a) | `[NS-46-R17] days copy passes the voice rules` |
| NS-46-R18 | Given the ids in `days.excluded` (days of death or mourning, contested names, commercial or political days, private family days; DAY section 6), Then the build fails if any appears in the library | P1 | `[NS-46-R18] excluded days stay out` |
| NS-46-R19 | Given a day the library does not hold, Then Add a day (NS-18) takes it in the parent's own words and the app never says a day is missing, never counts what is ticked and never offers "complete your list" | P0 (a) | `[NS-46-R19] the app never says a day is missing` |
| NS-46-R20 | Given Browse days, Then the order is seasonal and shared, family, civic, then traditions; a parent who ticked tradition days sees that tradition's days first; "Browse all" is alphabetical and not by size; the words "your religion" and "your tradition" never appear; ticking works across traditions | P1 | `[NS-46-R20] browse order and no label` |
| NS-46-R21 | Given the first release, Then only US days and rules ship; a row with a country has one row per country read; no country is offered by default; other countries wait for the founder (DL-7) | P2 | `[NS-46-R21] US days first` |
| NS-46-R22 | Given a day note, Then no title, body or landing says "last year", "again", "another" or shows anything the parent wrote on that day before; the "on this day" look-back is NS-23 and NS-31, not this card | P0 (a) | `[NS-46-R22] no look-back and no count` |
| NS-46-R23 | Given a tradition's rows, Then a member of that tradition has reviewed them and the review is on record before they ship (DL-8); and given each source table, Then counsel has confirmed the right to use it (the record names a pseudonymous reviewer id, the tradition id, the date and "read"; the person's name stays outside the repository), with rule dates computed rather than copied (DL-4, FR-DAY-23) | P0 (b) | `[NS-46-R23] tradition review and source licence on record` (release checklist) |
| NS-46-R24 | Given each October, Then a named `content` owner re-reads every table row for the next year and records source and date, and a pure `daysDueOn(rows, today)` function is tested with an injected today (red and green cases); the real-date check is a scheduled job that opens an issue in September, with the due date printed (default pending founder: Q-QA-3) | P1 | `[NS-46-R24] annual data review` |
| NS-46-R25 | Given a quieted or hidden book (R-IA-6), Then it receives no library note; Given every included book is quiet or hidden, Then no library note is sent; Given "Include in my reminders" is off for a book, Then that book is not the subject of a note; Given a member whose `celebrations_paused` is set, Then none is sent (NS-46-R49); `PlannerChild.included` is false for a quiet book (blocked by BL-985, errata E16) | P0 (a) | `[NS-46-R25] quiet book adds nothing` |
| NS-46-R26 | Given VoiceOver, Voice Control, Switch Control and AX5 with Bold Text on an SE 3, Then every control on C-S24, C-S25 and C-S26 is reachable at 44 pt or more with its visible label as its name; a moving day reads "around {date}"; each row is one VoiceOver element "{name}, {date or around date}" with the chevron hidden, the no-date line is part of the row label in footnote text with no warning glyph, no count appears even in a label; "flat" means group titles are headings (rotor), rows are one level, no collapsible groups and no tiers; the hemisphere control is a segmented row of 44 pt or more that stacks at AX1 and above with nothing selected by default (never inferred from the time zone or locale); a tick is untickable in one tap on the Browse list and on C-S24 by Remove in C-S26, a swipe action and a VoiceOver custom action; (accessibility on screens in the set is P0 (b), FR-QAL-09) | P0 (b) | `[NS-46-R26] Days page works with assistive settings` |
| NS-46-R27 | Given any day note, Then it names no Plus, price, allowance or Keep step (NS-13-R11) and the feature has no entitlement check | P0 (b) | `[NS-46-R27] a day note never sells` |
| NS-46-R28 | Given `killSwitches.libraryDays` (PROPOSED) true, Then the Days library, Browse and the ask slip are absent at the next focus of their screen, pending library notes are cancelled at the next re-plan, and typed days, reminders, reading and export are unaffected; the key is added to `KILL_SWITCH_KEYS` and the signed-config schema, older configs parse it as off, with no remote config the library stays on (fail-open), the gate is `EXPO_PUBLIC_DAYS` plus `killSwitches.libraryDays !== true` and not `mayRun`, the scheduler re-plans when the config changes (NS-46-R33), and in a servers-off build the pause is honoured only when remote config could be fetched, so `EXPO_PUBLIC_DAYS` stays off by default in that profile (RV-10, default pending Karma) | P1 | `[NS-46-R28] remote pause hides the library only` |
| NS-46-R29 | Given BL-966's registry, When `libraryDay` is added, Then it is a ranked source inside the `typedDay` group, `PlannedClass` gains no member, the registry test that rejects an unregistered class stays green, and the planner `kind` distinguishes `libraryDay` and `typedDay` from `evening` and carries a `group` field so priority is data | P1 | `[NS-46-R29] libraryDay adds no class to the registry` |
| NS-46-R30 | Given the planner builds candidates for every source (`typedDay`, `birthday`, `libraryDay`, `monthAge`, `evening`) in one plan, Then one pure `chooseOnePerDay(candidates, planNoticeCount)` in `lib/reminders/budget.ts` is the only place the one-a-day rule and the DL-2 order live, it merges same-kind notes for several children and two library days into one, and a property test over random plans finds no local date with two budgeted notes (including a birthday for one child and a month note for another); `budget.ts` is the answer to "where is the one-a-day rule enforced" (nowhere today, `planner.ts:320-350`) and a hard prerequisite of NS-46 and NS-48 | P0 (a) | `[NS-46-R30] one chooser, one rule` |
| NS-46-R31 | Given reminders are off and notifications are allowed, Then `libraryDay` and `typedDay` still plan and evening, month and birthday do not (a day-only gate beside `prefs.enabled`); Given permission is undetermined and the parent ticks their first day, Then after the tick and one sentence the standard iOS ask is made once through the `next-ask` door and a refusal is final with one calm line; Given permission is denied, Then the Days ask slip is not shown and Me, Days says in one line that nothing arrives until notifications are allowed in Settings (default pending founder: Q-FD-20; Karma confirms E K-E13) | P0 (c) | `[NS-46-R31] day reminders do not need evening reminders on` |
| NS-46-R32 | Given a library-day note is tapped, Then the handler routes to Home (not the Book), the payload holds only `{source, kind: 'libraryDay'}`, the identifier is `el.day.<isoDate>`, Home finds the day by the phone's local date against the store, a tap on a later date or with a cleared or unreadable store opens plain Home with no day line and no message, a cold-start tap behaves like a warm tap, and no day id, tradition, catalogue key or layer is in `identifier`, `data`, `threadIdentifier`, `categoryIdentifier` or a route parameter | P0 (a) | `[NS-46-R32] a day reminder opens Home and carries no day` |
| NS-46-R33 | Given a tick, untick, move, clear or a change in `killSwitches.libraryDays`, Then the scheduler re-plans within 1.5 s through the days module's own change event (the store sits outside `scribe.db`, so the store bus does not reach it) | P1 | `[NS-46-R33] store and pause changes re-plan` |
| NS-46-R34 | Given a delivered or opened note of kind `libraryDay` or `typedDay` with analytics consent granted, Then `notificationOpenedEvent` returns null and none of `reminder_sent`, `reminder_suppressed`, `app_opened.source = notification`, `capture_started.source = notification` or `letter_saved.from_notification_2h` is produced from it; `observe.test.ts` names `libraryDay`, `typedDay`, `birthday` and `monthAge` as the four never-reported kinds | P0 (a) | `[NS-46-R34] day notes are never observed` |
| NS-46-R35 | Given the first tick, Then the line shown before it says a reminder arrives on that day and that unticking or "Clear all" stops it; Given Reminders is off, Then Me, Reminders and Me, Days each say in one calm line that chosen days still send a reminder and where to stop it; and no day reminder, slip or landing line advertises a feature, a new day, the Days page or an update (Apple Developer Program License Agreement, Attachment 1 section 2.2; counsel must confirm) | P0 (b) | `[NS-46-R35] consent line and opt-out are in the UI` |
| NS-46-R36 | Given `publicTitleOk`, Then it is a hand-listed allowlist in the data, true only for seasonal and shared days (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) and never derived from a layer or a statute, false for every `quiet` day, every religious observance even where also a public holiday (Christmas Day, Easter) and every contested name (Columbus Day), with App lock on every library-day title is the one neutral title, and a test lists each true row for `regulatory-affairs` and `content` to read (RV-1; default pending founder: Q-FD-18) | P0 (a) | `[NS-46-R36] public titles are an allowlist` |
| NS-46-R37 | Given a `quiet` day on a lock screen with the neutral title, Then the body is "The book is open if you want it." with no question mark and no invitation to write; the neutral body of every other tone is the one string of NS-47-R12 (one neutral body per tone) | P1 | `[NS-46-R37] quiet days have a quiet neutral body` |
| NS-46-R38 | Given any heading, button, claim or help line on C-S24 to C-S26 or the ask slip, When the rules test runs over the real keys, Then none says "your religion", "your tradition", "a day we mark" or "note" for a reminder, or claims the library is complete; the list headings are "Days you added" and "Days you chose" | P1 | `[NS-46-R38] days surfaces use the parent's verbs` |
| NS-46-R39 | Given three or more ticked days on one date, Then the names are joined with an English list format ("A, B and C"), the lock title is the one neutral title and no string is joined in code | P2 | `[NS-46-R39] many days on one date read cleanly` |
| NS-46-R40 | Given the library store cannot be read, Then C-S24 still lists the typed days and shows one in-place line with Try again in the library section only, announced politely once, no icon-only signal and no red | P1 | `[NS-46-R40] a failed library read leaves typed days` |
| NS-46-R41 | Given Browse, Then rows are a multi-select list (checkbox role, check shape and weight, date in footnote text, VoiceOver "{name}, around {date}, ticked", no select-all, no truncation at AX5), group titles are heading rows, the first view shows at most a design-set number of rows per group with "Show more" so Browse reads as an offer and not a form, the sheet closes by Done, swipe down, the VoiceOver escape gesture or Back with nothing lost, the "Dates differ by country" question is a row inside the sheet and never a second sheet, and a tick shows only the row change, `H-select` and a VoiceOver value change (no toast, no count) | P1 | `[NS-46-R41] browse rows and exits` |
| NS-46-R42 | Given each standing state (server features off, plan lapsed, signed out, reminders off, notifications not allowed, offline), Then the library behaves as section 6 says in one parametrised test whose title lists every id it proves | P1 | `[NS-46-R42][NS-46-R4] library works under every standing state` |
| NS-46-R43 | Given a ticked id that is no longer in the table after an update, Then it is dropped without a crash, a phantom note or any line saying it is missing | P1 | `[NS-46-R43] an id gone from the table is dropped silently` |
| NS-46-R44 | Given one support or tester report of a day reminder on a wrong date, Then the founder hears the same day, the row is read against its authority and whether to use the pause is decided before the next build reaches a wider group; "a day reminder on a wrong date" is a support category (counts only) | P1 | `[NS-46-R44] a wrong-date report trips a same-day review` |
| NS-46-R45 | Given the days feature is in a store candidate, Then `docs/support/macros.md` has macros for a date a day off (it never asks which tradition), days gone after sign-out or on a new phone, and how to clear or turn off day reminders; the help centre has one article "Days and reminders"; `docs/ops/ACCESS.md` has a row "days store: device only, L4, staff never see it"; a runbook line names who flips `libraryDays` and the publish step; no support link, `mailto` or article link carries a day id or name | P1 | `[NS-46-R45] support and ops pieces exist for the candidate` |
| NS-46-R46 | Given the release that turns days on, When the listing and the support page are read, Then the REMINDERS paragraph says the evening reminder's days and time are the parent's and that a ticked day arrives in the morning, and a test fails if any public line says the parent picks the time of a day reminder (`store.en.ts` today says "You pick the days and the time"; default pending founder: Q-FD-19) | P0 (b) | `[NS-46-R46] no public line misstates the day reminder time` |
| NS-46-R47 | Given any marketing surface (store text, promotional text, screenshots, preview video, site, email, social, paid placement, press), Then none names, pictures or targets a faith, a tradition's day, an ethnicity or a country as an audience, none runs a seasonal or religious-day campaign or a greeting, no frame draws the tradition list, the ask slip, a faith day name or a synthetic tradition, there is no child-directed holiday imagery and no real child, family or place of worship (Asha only), and a scan of `store.en.ts`, `site.ts` and `packages/emails` for `days.name.*` and faith words finds none outside an allowlist with a written reason (paid-targeting rules are our own; platform rules UNVERIFIED) | P1 | `[NS-46-R47] marketing never uses days` |
| NS-46-R48 | Given the library, Then it is one file identical for every phone and any refresh is a single whole-library fetch with no query, header or path derived from ticks or browse choices (default: bundled, refreshed by app update, DAY 3.6); a test runs the fetch with an empty store and with every day ticked and the requests are byte-identical | P0 (a) | `[NS-46-R48] the library fetch does not vary with the store` |
| NS-46-R49 | Given a member whose `child_member_prefs.celebrations_paused` is set (server-held L3, read and never written), Then no library-day reminder is sent for that member | P1 | `[NS-46-R49] a paused season silences day reminders` |

### 8. Non-functional budgets
- Latency: planning a year of ticked days under 50 ms on an SE 3 (ASSUMED); Browse sheet opens under 300 ms (06-nfr default); tap to landing under 2 s (NS-13-R9).
- Memory: inherits 06-nfr; the table is under 100 kB (ASSUMED).
- On-device storage: the ticked list is bytes; the table ships in the bundle (DAY 3.6; a downloadable pack is the alternative, engineering decides).
- Battery: n/a (local notifications only; no background work).
- Offline: fully offline.
- Accessibility: NS-46-R26.
- Localisation: English names at version 1; keys carry slots, not built sentences; the languages review owns the rest.
- Privacy (log canary): no day id, tradition or country in any log, URL or crash report (NS-47-R8).

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch `serverFeaturesEnabled()` off | Library works; pause not deliverable | `[NS-46-R42]` |
| Card's remote pause `killSwitches.libraryDays` (PROPOSED) | Library gone at next focus; notes cancelled; typed days stay | `[NS-46-R28]` |
| Plan lapse | No effect; free | `[NS-46-R42]` |
| Second account on the same phone | A's store cleared at A's sign-out; B sees nothing | `[NS-47-R15]` |
| Reminders off | Library notes still come (D W-G7) | `[NS-46-R31]` |
| Notifications not allowed | Tick works; one line; no promise | `[NS-46-R31]` |
| Quiet or hidden book | None | `[NS-46-R25]` |
| Clash with birthday, typed day, plan notice, other day | Rows R7 to R9 | `[NS-46-R7]`, `[NS-46-R8]`, `[NS-46-R9]` |

### 10. Data and engineering
- Fields: ticked day ids; optional per-day date override (one year or always); optional per-day "off this year"; hemisphere choice for season names; all held in the one store of NS-47 (class and lifecycle are NS-47's). Day data is content, not user data: `packages/content/src/days/` (PROPOSED), imported lazily inside the days module so Home and cold start never parse it (A-NFR-001).
- Migrations: none. Sync field group: none (nothing syncs; FR-CUL-04). Export: none (NS-47-R10).
- Modules: `packages/content/src/days/` and `packages/content/test/` (calendar tests, rules scan, `days.excluded`, `publicTitleOk` allowlist); `apps/mobile/src/lib/reminders/budget.ts` (PROPOSED, NS-46-R30) and `planner.ts` (kind `libraryDay` with a `group` field, extends `PlannedKind` with BL-982's typed-day work); the days module and its change event; the tap router in `scheduler.ts:254-258` (`libraryDay` goes to Home); `lib/reminders/tz.ts` and `packages/core/src/age.ts` (R-IA-1: `dateOfAge` moves to core; astronomical-instant-to-local-date helper; `deviceTimeZone()` per IA-AUDIT X5); `packages/api/src/kill-switches.ts` and the signed-config schema (`libraryDays`; the header of that file is updated, errata E21); Me rows in `app/settings/` (C-S24 to C-S26).
- Flags and pause keys: `EXPO_PUBLIC_DAYS` (PROPOSED local flag family, errata E20; ships on once copy and counsel gates pass; off by default in a servers-off profile); `killSwitches.libraryDays` (PROPOSED, one boolean for the whole library; a per-tradition hold waits for Drop C and a Karma ruling on the config vocabulary, RV-10). Both join proposed ADR 0029 (no file yet).
- Error codes: `days_store_unavailable` (PROPOSED, local).
- Rollout and rollback: flag on for `preview` first; rollback is flag off plus the pause; nothing is stored anywhere that outlives the phone.
- Backlog: new rows needed (no id invented): days data and calendar tests (NR-DAY-01); `budget.ts` and the DL-2 order (NR-DAY-06, with NS-46-R30); store (NR-DAY-03, with NS-47); astronomical and hemisphere (NR-DAY-04); table refresh route (NR-DAY-07); October review runbook (NR-DAY-08); Days page and Browse sheet (NR-DAY-10); `kill-switches.ts` vocabulary and proposed ADR 0029 (no file yet) keys; support, ops and marketing rows (NS-46-R45 to R47). Prerequisites: BL-966 (its scope text gains the `libraryDay` rank, a backlog edit for `product`), BL-982, BL-963, BL-985, BL-961.
- Built today (read by `mobile` on this branch): `planner.ts` kinds are only `evening`, `monthAge`, `birthday` (line 106); `typedDay` is a design and a row, not shipped; the one-a-day budget is enforced nowhere except evening yielding to month and birthday notes (`planner.ts:320-350`), `plan-reminders.ts` is a second scheduler with its own cap of 4 and no shared budget, and `Child.quiet` has no reader (errata E16).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Ticked day id | To schedule the parent's own choice | Optional | Must be an id in the library | L4 (whole store, CB-1) | Phone only, per account (NS-47) | Until unticked, sign-out, Erase, deletion | No (CB-4) |
| Date override (one year or always) | The parent moved a moving day | Optional | A valid calendar date | L4 | Same store | As above | No |
| Hemisphere choice | Season names | Optional | Two values | L4 (inside the store) | Same store | As above | No |
| Days asked flag | So the ask is made once | n/a | `done` | L2, per account | Phone only | Per account; cleared with the store except the flag stays keyed to the account (NS-47-R15) | No |
| Names switch for days | Lock-screen name | Optional | on or off; forced off with App lock | L3 setting | Phone only | Until sign-out | No |

We collect none of this on a server. Nothing is added to first run.

### 12. Door lines
Ticking a day is a choice, not a Terms or Privacy agreement; the lines are written so counsel can say whether PRIV-R21 applies. NS-47 holds the full set; here the ones this card owns.
- **Shown:** before the first tick, `days.door.line` (intent: "Only on this phone. Used for one thing: finding days for you to pick. Change or clear any time in Me." until `mobile` confirms the backup exclusion and the device-transfer test, NS-47-R6), the reminder consent line of NS-46-R35, and the day-name switch help line.
- **Records:** on the phone, day ids and overrides; no server row and no PRIV-R21 record. If counsel rules a ticked tradition day is special-category data needing a recorded act, this line changes (needs a number from legal).
- **Never:** a pre-ticked day; a tradition, day id, country, hemisphere, moved date, browse pick or count in analytics, logs, crash reports, URLs, support links or a notification title (except a public day's name under N-3 as narrowed by NS-46-R36); a greeting; a claim of "nobody can tell", "invisible", "private" or "undetectable" about a day reminder (its time repeats yearly).
- **Decline:** "Not now" schedules nothing and is a full answer; unticking cancels; Erase everything and account deletion remove the list.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| A family's faith or origin | A passer-by reads a lock screen | NS-47-R12, R13 | `[NS-47-R12]` |
| A family's faith or origin | Someone with the unlocked phone opens the Days page | Phone-only; blank app-switcher snapshot; "Clear all" in one place | `[NS-47-R26]`, `[NS-47-R21]` |
| Trust | A wrong date | "around", parent override, remote pause, annual review, support macro | `[NS-46-R14]`, `[NS-46-R24]`, `[NS-46-R28]` |
| Trust | A stereotype from a default | Nothing ticked; alphabetical; several traditions | `[NS-46-R2]`, `[NS-46-R20]` |
| Legal | A table copied from a site whose licence forbids it | Rule dates computed; counsel reads each source | `[NS-46-R23]` |
| Legal | A table presented as an authority | Source and uncertainty in the data; "around" | `[NS-46-R1]` |

Risk checks:

| Check | When | Who | On fail |
|---|---|---|---|
| Day rows read by a member of each tradition | Before a tradition ships | `content` with a volunteer or paid reviewer; founder | The tradition's rows do not ship |
| Source licence and dates | Before any table ships; each October | `regulatory-affairs`, counsel, `content` | Table held |
| Copy against the rules test and VOICE.md | Every PR touching `days.*` | `content`, rules test | Test red |

### 14. Never
- Never pre-tick a day. Never a greeting, an explanation of a day, a count or a comparison with a prior year.
- Never write a day note from a letter, a picture, a place or a name (system-intelligence donation: ruling D3; nothing is donated to Spotlight or Siri).
- Never a tradition label in a screen, title, body, log or analytics.
- Ruling D2: writing tools off on the Add a day field and the move-a-date field (they hold a parent's own words, as NS-18).

### 15. Design inputs
New screen ids (PROPOSED): **C-S24** Days (Me, Days and reminders; states: empty, some, no-date-next-year line, clear-confirm, store-unavailable with typed days still visible, AX5; the day-name switch lives here under the list, shown only when a day is ticked, disabled with a reason while App lock is on, RV-13); **C-S25** Browse days (sheet; groups in the NS-46-R20 order; "Dates differ by country" question as a row; hemisphere switch in the seasonal rows; "Done" is the visible exit and swipe down, the escape gesture and Back do the same; no "select all"; multi-select rows per NS-46-R41); **C-S26** Day detail (pushed from C-S24 only; name, date with "around", "Move this date" one year or always, as an I4 choice under the date, default "just this year"; Remove; no tradition label). New states of existing screens: A-S01.daysAsk and A-S01.dayToday (NS-50); D-S10 `libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, `libraryDay-quiet` and `twoDays`; D-S11 is not used for library days (one way, RV-6); D-S06 gains the one calm line about reminders when Reminders is off. C-S01 gains a "Days" row in "Days and reminders" (R-IA-4, after T1; before T1 the row sits under Reminders and both routes open C-S24). D-S08 and D-S09 are reused by C-S24 for typed days and their detail. Typed days and library days are in two sections of the one list: "Days you added" and "Days you chose". The notification permission line reuses the D-S06 `.denied` card. New shared pieces for `design-systems`: I4 `multi` variant, `DoorNote` (NS-47-R29), C9 variants (NS-50); `layout.rowMin` 52 and `target.md` 48 are still open name requests.

### 16. Content inputs
New key family `days.*` (PROPOSED), all under the rules test: `days.name.<id>`; `days.lock.title.neutral` and `days.lock.body.neutral` (NS-47); `days.lock.title.twoDays`; `days.landing.bright` (intent: "{day}. Anything you would like {child} to hear about today?"); `days.landing.season` (intent: "{season}. What does today look like?"); `days.landing.quiet` (intent: "{day}. The book is open if you want it."); `days.picker.around` ("around {date}"); `days.picker.whichDate` ("Dates differ by country. Which date should we use?"); `days.nextYear.line` ("{day}: no date for next year yet."); `days.door.line`; `days.empty` (no words about gaps). Words that are the parent's: none. The founder approves. Samples and the 12 wording rules are in DAY sections 5.2 to 5.4 and are intent, not final.

### 17. Legal, privacy and compliance inputs
FR-DAY-23 (source licences; counsel must confirm; "needs a number from legal"), Q-DAY-6 and Q-DAY-11 (a ticked tradition day as data inferring religion; GDPR Article 9 reading; both are NS-47's). App Review Guideline 1.1.1 is about discriminatory or mean-spirited content about religion or origin (read by `regulatory-affairs`, 20 Nov), so the library names and prefills are read against it by `legal` and the tradition reviewer (DL-8); it does not regulate neutral day names. 4.5.4 names push, not local notes; the Apple Developer Program License Agreement Attachment 1 section 2.2 names local notifications for marketing and requires opt-in consent language and an opt-out (NS-46-R35); the default of treating 4.5.4 as applying stays because Apple lists religious belief as Sensitive Info (counsel confirms CUL-Q11). 5 U.S.C. 6103 lists Christmas Day and Columbus Day among federal holidays, which is why `publicTitleOk` is an allowlist (NS-46-R36). The compliance review fetched the licence and the statute through the session proxy with curl (public pages; see the GAP-LOG process note). No law, guideline or date was otherwise re-verified here. Add DPLA 3.3.3(H) and Attachment 1 section 2.2 to the compliance register by card (FR-CMP-01).

### 18. Label effect
None expected, because nothing leaves the phone (NS-47-R4); the label is re-run per build (NS-47-R23).

### 19. Claims enabled and forbidden
Enables: "Pick the days you want a reminder on." and, only with a claims row, "The days you choose stay on this phone." Forbids: "every holiday", "all religions", "every culture", "for every family", "celebrate your culture", "the right date", "we know your traditions", "we ask your religion", "we never store your religion", "you pick the time" for a day reminder, any claim that the feature is free forever (T1).

### 20. Free or Plus
Free. A note on a day is the parent's own reminder; no entitlement logic in any lock-screen string (NS-46-R27; T2).

### 21. Measures with analytics off
A tester sheet (no telemetry; NS-47-R9). Fixed questions, numbers only, "x of n": did the parent tick a day without help (pass: 4 of 5; a usability check, not a rate); did a reminder arrive on the date shown (yes or no; if no, the founder records only the row id, never the tester's tradition or country, and findings are pooled across traditions unless 5 or more testers answered); a reaction question "did anyone feel guessed at" and "did Browse feel like a list you had to finish". Stop rules (one report trips each): any tester who felt guessed at about faith or origin, or a reminder on a wrong date (NS-46-R44). With 5 testers "0 of 5" has a 33% chance when 20% would feel guessed at, so it is a stop line, not a pass line (analytics review; FR-RSH-24 table). "First year's rows read with 0 wrong dates" is the NS-46-R23 and R24 review record, not the tester sheet. No tester is asked their faith or origin.

### 22. Dependencies and gates
Build order, stated once: BL-966, then BL-963 and BL-985, then `budget.ts` (NS-46-R30) and BL-982, then the NS-46 planner source, then NS-48's key function, then NS-50 ranks, then NS-49 level 2; BL-961 and `[X4-R1]` green (two-account test per card, Asha only). NS-46 and NS-47 are one release unit behind `EXPO_PUBLIC_DAYS`; neither ships alone except the Drop B subset in the release cut. Also: the Days page designed (C-S24 to C-S26); T1 only for the Me regroup (before T1 the Days row sits under Reminders); founder approval of copy; counsel on FR-DAY-23 and on the consent line; a tradition-member review for each tradition (Drop C); a named annual-review owner (Q-FD-10); first-year tables read from authorities; the `kill-switches.ts` vocabulary change. A row not in the drop being built is not a P0 for that build.

### 23. Open questions
All in "Founder items" with defaults: Q-FD-1, Q-FD-3, Q-FD-6, Q-FD-7, Q-FD-9, Q-FD-10, Q-FD-15 (the pause), Q-FD-16 (DL-7), Q-FD-17 (regional days), Q-FD-18 (public titles), Q-FD-19 (time), Q-FD-20 to Q-FD-22 (permission, reminders off, horizon), Q-FD-24, Q-FD-26. Owner Karma: library bundle or pack (default bundle with an app update, DAY 3.6), the rank of the Days ask (conflict 7, RV-5) and the one-way landing (conflict 5, RV-6).

---

## NS-47. Cultural background: the optional ask, what is kept, and the lock-screen rules (candidate C-xx; kind Foundation with Attractive; Me and Home)

### 1. Who and when
A parent, after the first kept letter and in a later sitting, who may want the days of their family's tradition or a country that matters to their family to be easy to find. Also any parent, later, in Me, Days. Never in first run.

### 2. Why
The founder asked to optionally ask for religion and native country with a clear call-out. A list the parent browses is safer than a guess, and the data is among the most sensitive a person has. This card keeps what we hold to the least that works. Evidence: direction 3.4; CUL review sections 0 and 6 (product risks, not legal claims).

### 3. What, and Not in scope
**What.**
1. A one-time ask slip on Home (rank 3b, NS-50-R6): "Would you like a reminder on the days that matter to your family?" with "Choose days" and an equal-weight "Not now" (intent). "Not now" is final for Home (CB-6).
2. Browse by tradition and browse by country, as two flat alphabetical lists inside C-S25. Several traditions may be chosen. "Another tradition" lets the parent add their own day and date. "Not now" is a full answer. There is no "Eastern" option (CB-6; Q-FD-1).
3. The store: the days the parent ticks (NS-46) plus the `culture.asked` flag. The tradition and the country are a browse filter held in memory and forgotten when the sheet closes (CUL-Q2 default). All of it is class L4, per account, on the phone only, excluded from the iPhone backup, cleared at sign-out and by Erase everything, never exported, synced or logged (CB-1, CB-4).
4. The lock-screen rules for library-day notes (NS-47-R12 to R14).
**Not in scope.** Any server copy or sync; any use outside suggesting days; an "Eastern" option; a country read from the device, the storefront or the time zone; any field in first run; any tradition or country attached to the child or a book; "Prefer not to say" as a separate stored value (it is the same as "Not now"); the days themselves (NS-46).

### 4. Happy path
1. First letter kept. The Keep gate and the reminder ask are the only hand-offs in that sitting.
2. A later open: Home shows the ask slip once. The parent taps "Choose days".
3. C-S25 opens. The parent picks a tradition (a filter), ticks two days, closes. Only the two ticked days are stored.
4. On the day: a note with the neutral title; tap; Home shows the day and a generic prompt; the parent speaks.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| "Not now" on the slip | `culture.asked = done` (the same value as after "Choose days"); Home never shows it again; the same choices stay one tap away in Me, Days |
| The parent closes the sheet without ticking | Nothing but the flag is written; the app behaves as if never asked |
| Sign-out | Store and pending notes cleared at that moment; the flag stays keyed to the account; account B reads nothing of A's and is asked afresh on B's rules (NS-47-R15) |
| Erase everything, Delete account | Store gone; C-S20 gains one line (NS-47-R16, R17) |
| New phone, restore, claim step on "Start on this phone" | Empty on a new phone or restore, and no re-ask because the flag lives in `settings`; claimed books re-key the store and upload nothing (NS-47-R6, R7) |
| App lock on | The day's name never shows on the lock screen; the switch is shown disabled with a reason, as the built `.appLock` pattern |
| Show Previews Never or When Unlocked | The category placeholder shows; the app cannot change it |
| Apple Watch mirror, Notification Center, Notification Summary, CarPlay, a Focus summary | UNVERIFIED whether a hidden body shows; with no category setting `hiddenPreviewsShowTitle` the title is hidden too (NS-47-R36); device walk J-CUL-01 decides |
| A shared phone and a partner | The Days page shows only on the unlocked phone; anyone who can open the phone can see the list (one plain line on C-S24); the app-switcher snapshot is blank with or without App lock (errata E18) |
| App Review reads the question as unneeded data (5.1.1(iii), UNVERIFIED) | Fallback (CUL-Q8): remove the ask slip; keep a plain browse-and-tick list in Me with no question about the family; the same data, no question |
| The parent is of no tradition, several, or one not listed | Nothing is assumed from silence; several allowed; "Another tradition" adds their own |
| An app update adds days | They appear only when Me, Days is opened; never pushed |
| Second parent on another phone | Each phone holds its own store; nothing on the Family page hints at the other's days (NS-47-R24) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The ask is not shown in first run (NS-47-R18) |
| Empty, normal, many | Empty: nothing. Many: still one note a day (NS-46) |
| Offline | All local |
| Slow, Failed | The store read fails: C-S24 shows `days_store_unavailable` calmly (NS-46) |
| Interrupted, killed mid-flow, updated mid-flow | A tick is saved as made; the ask slip reappears only if the flag is not `done` |
| Low storage, Low Power Mode | n/a |
| Kill switch `serverFeaturesEnabled()` off | No effect on the store (the pause cannot be delivered, RV-10) |
| Outage | n/a |
| Plan lapsed | No effect |
| Signed out | Store cleared at sign-out |
| Second account on the same phone | NS-47-R15 |
| New phone | NS-47-R7 |
| Two books, two parents, expecting | Per account; never tied to a book or child (NS-47-R3) |
| VoiceOver, AX5 plus Bold Text | NS-47-R25 |
| Devanagari, RTL | The lists read in any language; sorted by the phone's collation (UNVERIFIED) |
| Every error code | `days_store_unavailable` (PROPOSED) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-47-R1 | Given any value that states or implies a tradition, a country a family is from, or the list of ticked days, When it is stored, Then it is class L4 in the FR-PRV-07 registry with scope per account, sign-out cleared, Erase erased, export no, backup excluded, sync never; the highest class in the store wins (a ticked Mother's Day sits beside a faith day as L4) | P0 (a) | `[NS-47-R1] the whole store is L4 and registered` |
| NS-47-R2 | Given the ask or the Browse sheet, When the parent picks a tradition or a country, Then it is held in memory until the sheet closes and the only things written are each ticked day (and a moved date) and the `culture.asked` flag; "Not now", "Another tradition" left empty and closing write only the flag, which has the same value after either answer so it cannot become "the parent chose days"; the browse filter is component state only (no route parameter, no `setSetting`, no persisted navigation state) | P0 (a) | `[NS-47-R2] picks are a filter; only ticks are stored` |
| NS-47-R3 | Given any answer, Then no column, key or label on a child, a book, a letter or a share says the family or child follows a tradition, and no screen word says "your child is {tradition}" | P0 (a) | `[NS-47-R3] nothing is attached to the child` |
| NS-47-R4 | Given the ask, a tick, a clear, the claim step and a re-plan, Then a network fake sees 0 requests carrying a day id, tradition or country; no migration, view, RPC argument or setting key is named like tradition, religion, faith, country, origin or culture (a migration lint); nothing is written to `record_policy_act` or any server table | P0 (a) | `[NS-47-R4] no request carries a day key` |
| NS-47-R5 | Given a tap on a library-day note, Then Home shows an ordinary prompt from the existing catalogue; `entries.prompt_key`, `prompt_library_version` and every synced entry field are identical to those of a letter saved on any other evening; a test saves a letter from each library day and compares the synced row to a control (CB-3) | P0 (a) | `[NS-47-R5] a day note leaves no trace in the synced row` |
| NS-47-R6 | Given the store, Then it lives in a file or database in Application Support (not Caches) excluded from the iPhone backup (as `photos/*-512.jpg` are, NS-37-R4), not in the `settings` table of `scribe.db`, with a protection class no weaker than SEC-R15's, written atomically (temp file then rename); when it is created or opened the app sets the exclusion and reads it back, and if it reads false the store refuses to write, C-S24 shows `days_store_unavailable` and nothing is ticked; an unreadable or corrupt file fails closed (no reminder, no crash); deleting the app deletes it; it is never in the Keychain; a restored phone opens with an empty Days list and does not ask again because `culture.asked` (which holds no tradition) lives in `settings` (Me, Days is one tap away); a device-to-device transfer test is part of J-CUL-01 and "Only on this phone" stays in the call-out only if the store is absent on the second phone, else the words become "on your devices". If the founder keeps it in `settings` (CUL-Q4), the call-out and the Privacy Policy line change to "and in your own iPhone backup" | P0 (a) | `[NS-47-R6] the store is out of the backup and fails closed` |
| NS-47-R7 | Given the claim step (E-S24) or a new phone, Then a claimed book re-keys the store unchanged and uploads nothing, and a new phone starts empty (the asked flag follows the restore rule of NS-47-R6: `culture.asked` is in `settings`, so it comes back with a restore and the restored phone does not ask again; a fresh install with no restore asks once) | P0 (a) | `[NS-47-R7] claim and new phone move nothing` |
| NS-47-R8 | Given the log canary with synthetic tradition and day keys (for example `zz-test-tradition`, never a real tradition with Asha), When it runs through ask, tick, move, clear, schedule, deliver and tap, Then 0 hits in logs, breadcrumbs, error messages, URLs, route parameters, notification identifiers or `userInfo`, analytics properties, crash payloads, support links, `mailto` bodies and article links | P0 (a) | `[NS-47-R8] canary finds nothing` (J-N18 pattern) |
| NS-47-R9 | Given opt-in analytics (off through 1.0, D-124) or the k-anonymised insights, Then no event, property, bucket or aggregate carries a tradition, a country, a day id or a count of parents who ticked any, and the typed catalogue test rejects those names | P0 (a) | `[NS-47-R9] analytics allowlist rejects day data` |
| NS-47-R10 | Given a Save a copy file built with every key set, Then no file holds a key, day, tradition or country, and no phone-settings key leaks into it (the export reads phone settings for its consent block, `schema.ts:271`); C-S24 says in one line that the list is not in Save a copy | P0 (a) | `[NS-47-R10] the export holds none of it` |
| NS-47-R11 | Given the module boundary, Then only the days module reads the store; the planner gets opaque slots (a date and a neutral body key); prompts, Home copy, emails, Find, analytics and support read none of it; an import-boundary test fails on a second reader (`culture.asked` is in its list); the days module exposes one `subscribeDays` that the scheduler and Home read, so a tick, untick, move or clear re-plans within the debounce (NS-46-R33); `culture.asked`, if in `settings`, is keyed by account id and deleted by Erase | P0 (a)(b) | `[NS-47-R11] one reader` |
| NS-47-R12 | Given a library-day note of any layer with the day-name switch off (the default) or App lock on, Then its body is one neutral string per tone (NS-46-R37), the same for every layer, naming no day, tradition, country or child; no notification, in any state, ever carries a tradition label; every identifier is opaque (NS-46-R32); the day-name switch is separate from `notifications.lockScreenNames`, default off and forced off while App lock is on; turning App lock on sets the stored day-name value to off and turning it off never turns it on (effective value is `stored && !appLockOn`); no lock-screen title or body, in any switch state, holds both a day name of a family, tradition, culture-led or national day and a child name | P0 (a) | `[NS-47-R12] one neutral body; the name only behind its switch` |
| NS-47-R13 | Given the lock-screen title, Then a seasonal or civic day (`publicTitleOk` true) may be its own name (N-3); a family, tradition, culture-led or national day uses the one neutral title unless the day-name switch is on and App lock is off (DL-10); `publicTitleOk` is the allowlist of NS-46-R36 and with App lock on every title is neutral; a snapshot test enumerates every `days.*` key and its title and body in each state and all four switch combinations | P0 (a) | `[NS-47-R13] public days may name themselves; others need the switch` |
| NS-47-R14 | Given the day-name switch, Then it has its own help line ("Anyone who sees your lock screen can read it." intent) and the "Names in notifications" help line says it does not cover days; the switch lives on the Days page (C-S24) under the list, shown only when a day is ticked, and the "Names in notifications" line on D-S06 says "This is for your child's name. Days have their own choice on the Days page"; whether the second plain line "This can also show the name of a day your family keeps" is required is counsel's (Q-DAY-6) | P1 | `[NS-47-R14] the switch says what it shows` |
| NS-47-R15 | Given account A signs out (book kept, D1), Then the store and its scheduled notes are cleared at that moment, the `culture.asked` flag stays keyed to A, and B signing in reads nothing of A's store, is never told it existed and is asked afresh; the registry enumeration of `[X4-R1]` covers the store; every delivered library-day notification is dismissed at the same moment; a session ended by the system (not the parent) clears the store the same way and the next time the parent opens Me, Days one calm line says the list was cleared when the session ended and they may choose days again (no count, no "you lost"; default pending founder: Q-FD-12) | P0 (a) | `[NS-47-R15] sign-out clears and B sees nothing` |
| NS-47-R16 | Given Erase everything, When it finishes, Then the store, the flag and every pending library-day note are gone, the FR-PRV-34 scan covers the store's file, and a kill mid-erase resumes and finishes | P0 (a) | `[NS-47-R16] erase scan finds nothing` |
| NS-47-R17 | Given Delete account, Then this phone clears the store at once and every other phone clears it when its session ends; C-S20 "What happens" gains one line ("We keep nothing about the days you chose; it was only ever on your phones", intent) and does not claim an offline phone has cleared yet | P0 (b) | `[NS-47-R17] delete account line and clear` |
| NS-47-R18 | Given first run (E-S01 to E-S08), Then no field, card, picker or line about tradition, faith or country appears and the FR-PRV-24 field-inventory test is unchanged and fails if one is added | P0 (b) | `[NS-47-R18] first run has no such field` |
| NS-47-R19 | Given a book with at least one kept letter, When the reminder ask has been answered or has reached its two-showing cap (NS-13-R31), and not in the sitting where the Keep gate, the reminder ask or the rating request showed, Then Home may show the ask slip once on a later open; a "sitting" is an `ASK_SESSION_GAP_MS` session, the ask registers with `next-ask` and counts as the day's ask, and it is due only when `primesShown >= 2` or the reminder answer exists; it is not shown when the phone's notification permission is denied (Days stays in Me); "Not now" ends it for Home; it never shows to an account with `culture.asked = done`, and never from a notification, an email or a banner; nothing is preselected | P1 | `[NS-47-R19] the ask comes once, later` |
| NS-47-R20 | Given the ask and the pickers, Then several traditions may be chosen; lists are alphabetical with equal visual weight, never by size; the only extra choices are "Another tradition" and "Not now"; there is no "Eastern" option; device locale, the storefront and the time zone never prefill either list; a country offers national days only and a tradition offers its days only; neither suggests the other; the hemisphere and country defaults are never inferred | P1 | `[NS-47-R20] pickers do not rank, guess or cross-suggest` |
| NS-47-R21 | Given Days, Then every ticked day can be unticked in one tap and "Clear all" (one confirm, an F6 `explained` sheet) removes every tick, cancels every pending note and dismisses every delivered one at once; on the Browse list a tick is untickable in one tap (on C-S24 by Remove in C-S26, a swipe action and a VoiceOver custom action) | P0 (b) | `[NS-47-R21] untick and clear all` |
| NS-47-R22 | Given the call-out at the point of choice, Then every sentence has a claims-inventory row true of that build; "stays on this phone" holds only while R4 and R6 hold; "only used to suggest days" only while R11 holds; it never says the lock screen "never" shows the day (the name can show behind the switch), never says "nobody can tell", "invisible", "private" or "undetectable" (the reminder's yearly timing is a residual), never says "we never store your religion" or "we do not know your faith" (a ticked tradition day implies it), and says in one line what clears the list (signing out, erasing, a new phone); an allowed claim is "The days you choose stay on this phone." | P0 (a) | `[NS-47-R22] call-out claims are true` |
| NS-47-R23 | Given a store candidate, Then `privacy` re-runs the label against the binary: "not collected" holds for this data while R4 holds; a G11 check fails on any new host or analytics property that references the store; the Privacy Policy gains one plain sentence; Notes for Review gain a section (what it does, that it is optional, where to find it) | P0 (b) | `[NS-47-R23] label re-run for the days store` (release checklist) |
| NS-47-R24 | Given two parents on one book (NS-25), Then each phone holds its own store and nothing on the Family page, an invite sheet or any shared surface shows, counts or hints at the other parent's days | P0 (a) | `[NS-47-R24] days are never shared` |
| NS-47-R25 | Given the ask slip, C-S25 and C-S24 at AX5 with Bold Text, VoiceOver, Voice Control and Switch Control, Then every control is reachable, the lists read flat with no grouping that ranks traditions, "Not now" has a visible label and the same touch size as the primary, and nothing truncates | P0 (b) | `[NS-47-R25] the ask and lists work with assistive settings` |
| NS-47-R26 | Given the Days page, Browse, Day detail, the day slip and the ask slip, When the app goes inactive, Then the app-switcher snapshot of Home and Me is blank where they appear, whether or not App lock is on (errata E18; C-S24 to C-S26 join the L4 screen list of FR-SEC-22); Home names a day only when it is today and never lists upcoming days or a count | P0 (a) | `[NS-47-R26] unlocked only; blank snapshot` |
| NS-47-R27 | Given research on this feature, Then the tester sheet asks only reaction questions ("fine, odd, or too personal"), never a tester's own faith or origin, records none, and a result where more than 1 tester in 5 says "too personal" moves the ask from Home to Me only | P2 | `[NS-47-R27] research asks reactions only` (research plan) |
| NS-47-R28 | Given the store file, Then it is a versioned file in Application Support whose higher unknown version is read for known keys and never rewritten or deleted, has no iOS-only field (Android would read the same file, FR-LCY-31), and a Swift or unit test fakes the exclusion call returning false and asserts 0 bytes written | P1 | `[NS-47-R28] the store file is protected, versioned and fails closed` |
| NS-47-R29 | Given the ask slip, C-S25 and C-S24, Then the call-out is a static `DoorNote` (new shared component) in `callout` type and `text` colour on `surface`, never collapsed, never dismissible, never behind an info glyph or glass, first in reading order before any control that records a choice, wrapping at AX5 without truncating, with a short form under the question on the ask slip and the full form at the top of C-S25; C-S24 adds "Anyone who can open this phone can see this list. App lock keeps it private." (the second sentence only while App lock exists as a switch; claims row) | P0 (a) | `[NS-47-R29] call-out visible, static and first` |
| NS-47-R30 | Given any optional question or field (the ask, C-S25 pickers, E-S08 name), Then "Optional" is a word beside the label (never an asterisk, placeholder alone or colour alone), VoiceOver reads "{label}, optional", the decline control has the same style and size as the accept control and sits in the same stack, nothing is preselected, and skipping writes nothing and prompts nothing later | P1 | `[NS-47-R30] optional pattern` |
| NS-47-R31 | Given the Days ask has been displayed on two separate Home opens without an answer, Then it retires to Me, Days and does not return | P1 | `[NS-47-R31] the ask is capped at two showings` |
| NS-47-R32 | Given the ask slip, Then "Choose days" and "Not now" are two `bordered` buttons of the same style and size, stacked at every size, neither `filled`; and on an SE 3 at the default text size with the ask showing the prompt's full text is visible above the capture cluster without scrolling, or the ask sits below the prompt (device check); the ask carries no feature name, "new", count or price | P1 | `[NS-47-R32] ask slip equal weight and height budget` |
| NS-47-R33 | Given the ask sequencer (`nextAsk`, BL-023), Then the Days ask is a member of the sequence and sets `askShownThisSession`, `analyticsConsentDue` returns `ask_already_this_session` in that sitting, the order is reminder prime, Days ask, analytics consent, each in a later sitting; the analytics sheet never mentions days, faith or origin and the Days ask never mentions usage data | P1 | `[NS-47-R33] asks do not stack` |
| NS-47-R34 | Given `packages/analytics/test/`, Then `FORBIDDEN_KEY` and a new enum-value and event-name test reject the stems `tradition`, `religio`, `faith`, `countr`, `region`, `origin`, `cultur`, `holiday`, `hemisphere`, `library_day`, `typed_day`, `day_id`, `day_name`, `ticked`, `suggestion_`, `place`, `location`, `workout`, `reflection`, `contact_`, `ROUTE` holds no Days, Browse, day detail, ask or suggestion route, `settings_changed.key` gains no day-names switch, and no `insights.*` view column matches the stems (no real tradition names in the test) | P0 (a) | `[NS-47-R34] analytics allowlist rejects day vocabulary` |
| NS-47-R35 | Given fewer than two countries have shipped day rows, Then the country list is absent (not greyed) and the ask and Browse offer traditions and "Add a day" only; the country list appears in the build that ships a second country, after the founder names it (DL-7) | P1 | `[NS-47-R35] no country list before a second country` |
| NS-47-R36 | Given every notification category, Then none sets `hiddenPreviewsShowTitle` (a test reads the category options) so with Show Previews hidden no title shows and the hidden-preview placeholder is the only text; the J-CUL-01 walk records the observed behaviour; every scheduled note carries a category whose `previewPlaceholder` is the one neutral string (categories are added, not "kept": none is built today) | P0 (a) | `[NS-47-R36] no category shows a title with previews hidden` |
| NS-47-R37 | Given a typed day (NS-18), including one added through "Add a day", Then its words show on a lock screen only behind `notifications.dayNames`, off by default and forced off with App lock, and `lockScreenNames` covers the child's name only (needs a Karma ruling as an NS-18-R3 errata row, RV-8) | P1 | `[NS-47-R37] typed day words follow the day-name switch` |
| NS-47-R38 | Given every lock-screen title and body in any switch state, Then none holds both a day name of a family, tradition, culture-led or national day and a child name (the R13 enumeration fails on both tokens in one string) | P0 (a) | `[NS-47-R38] no day name beside a child name on a lock screen` |

### 8. Non-functional budgets
- Latency: the ask slip and sheets under 300 ms (06-nfr defaults); no store read on cold start beyond the days module's own lazy read (ASSUMED; `mobile` confirms).
- Memory, battery: inherit 06-nfr; no background work.
- On-device storage: bytes.
- Offline: fully offline.
- Accessibility: NS-47-R25.
- Localisation: the lists read in any language; the call-out is a content key.
- Privacy (log canary): NS-47-R8.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch `serverFeaturesEnabled()` off | No effect | n/a |
| Card's remote pause | Uses NS-46's `killSwitches.libraryDays` (PROPOSED); the store is untouched, the ask slip and Days are hidden | `[NS-46-R28]` |
| Plan lapse | No effect | n/a |
| Second account on the same phone | Cleared at sign-out; B asked afresh | `[NS-47-R15]` |
| Sign-out, Erase, Delete account | Cleared | `[NS-47-R15]`, `[NS-47-R16]`, `[NS-47-R17]` |
| App lock on or off; names switch on or off | Lock rows | `[NS-47-R12]`, `[NS-47-R13]` |
| Notifications not allowed | Ticks stored; no note; one line | `[NS-46-R10]` |

### 10. Data and engineering
- Fields: one registry row for the store (L4, device only, per account, excluded from backup, cleared at sign-out and Erase, not exported, never logged); `culture.asked` (L2, per account, in `settings`, holds no tradition, written with one value for both answers); `notifications.dayNames` (PROPOSED, L3 setting, default off, forced off with App lock, cleared when App lock is turned on). The in-memory browse filter is class L4 and component state only.
- Migrations: none; a migration lint (FR-CUL-04, 05) guards the schema and matches whole words in column, key and setting names (not comments) with a named allowlist (`han_traditional`, `storefront`) owned by `data-architect`. Sync field group: none. Export: none, with a leak test (NS-47-R10).
- Modules: the days module and its single store (a file outside `scribe.db`, `scribe-files.setExcludedFromBackup` with read-back), `lib/reminders/prefs.ts` (the switch and its app-lock rule beside `lockScreenNames`), `lib/reminders/planner.ts` (opaque `libraryDay` slot), notification categories with `previewPlaceholder` (none built today), `erase-everything.ts` (store file added to its list), the sign-out path (BL-961 `[X4-R1]` enumeration; delivered library-day notes dismissed, `scheduler.ts:336-339` pattern), `lib/asks/next-ask.logic.ts` (the Days ask joins the sequence), an import-boundary test, a migration lint, the analytics allowlist negative test (NS-47-R34), `docs/legal/DATA_CLASSIFICATION.md` section 4.6 (device files; 4.5 is local SQLite) (new device row; `privacy` owns), `docs/legal/app-store-privacy-labels.md` (one row recording on-device religious or ethnic data as not collected, re-checked per build).
- Flags and pause keys: as NS-46.
- Error codes: `days_store_unavailable` (PROPOSED).
- Rollout and rollback: ships with NS-46; rollback is the pause plus flag off; the store is removed by Erase.
- Backlog: new rows needed (no id invented): the days module and store; import-boundary and canary tests; migration lint; planner slot and switch; categories; Home ask state and Me Days (NR-DAY-03 and NS-46's rows); J-CUL-01 device walk (a register id J-N37 is proposed by `qa`); analytics tests. BL-961 gains the store in its enumeration; BL-975 gains the "derived off-device" check.
- Built today: `settings` is the phone's one settings store and is in the iPhone backup per `data-policy.md:144` (UNVERIFIED in code); `notifications.lockScreenNames` and its app-lock rule exist (`prefs.ts:109-112`: the stored value returns when App lock turns off, which the day-name switch must not copy).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Tradition picked | Browse only | Optional | From the list or the parent's own | L4, memory only | Memory, forgotten when the sheet closes (CUL-Q2 default) | Seconds | No |
| Country picked | Browse national days only | Optional | From the list | L4, memory only | Memory | Seconds | No |
| Ticked days and moved dates | To schedule | Optional | NS-46 | L4 | Phone only, backup-excluded | Until unticked, sign-out, Erase, deletion | No |
| `culture.asked` | The ask is made once | n/a | `done` | L2 | Phone only, per account | Per account | No |
| Day-name switch | Lock-screen name | Optional | on or off | L3 | Phone only | Until sign-out | No |

If the founder rules the picks are kept as fields (CUL-Q2), each becomes a registry row with a "Clear" control and every rule above applies; counsel's answers to CUL-Q6 and Q7 then gate the flag.

### 12. Door lines
- **Shown:** "Only on this phone. Used for one thing: finding days for you to pick. Change or clear any time in Me." (the shorter CUL draft; the direction's own draft said "suggesting days to mark"; `content` decides; not final until `mobile` confirms the backup exclusion and device-transfer behaviour, NS-47-R6) before the first tick, with the NS-47-R29 `DoorNote`; the day-name switch's help line.
- **Records:** nothing on our servers. On the phone, the days the parent ticks and the asked flag. No `record_policy_act` row, because nothing leaves the phone and an "answered a faith question" row would itself be the derived fact the label rules warn about. If counsel's answer to CUL-Q6 is yes, a recorded act is needed and this line changes; the flag stays off until Q6 is answered.
- **Never:** a pre-ticked day; a second ask after "Not now"; a tradition or country on the child; a tradition or country in analytics, logs, crash reports, URLs, notifications, the Save a copy file, a backup, support mail, support links or an email; an inference of one from the other or from the device; a "Prefer not to say" stored as a value.
- **Decline:** "Not now" is a full answer of equal weight; the app is unchanged; Days stays one tap away in Me.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| A family's faith or origin | Outing on a lock screen, to a partner, relative, colleague or stranger (a safety matter for some people) | NS-47-R12, R13, R15, R26; App lock forces the switch off | `[NS-47-R12]` |
| A family's faith or origin | A day-specific prompt key reaches our server (`entries.prompt_key` is L2 and synced) | Generic prompt; compare to a control | `[NS-47-R5]` |
| Origin | An inference from device locale or storefront | No prefill | `[NS-47-R20]` |
| Trust | A stereotype or a ranking | Alphabetical; no cross-suggestion | `[NS-47-R20]` |
| Legal | Special-category reading of device-only data (GDPR Article 9 and US state rules; counsel must confirm) | Optional, withdrawable, never received | `[NS-47-R4]`, `[NS-47-R21]` |
| Store | App Review reads the ask as unneeded data (5.1.1(iii), UNVERIFIED) | Notes for Review; fallback with no question | `[NS-47-R23]` |
| Export | A settings key leaks into the file | Leak test | `[NS-47-R10]` |
| Fixtures | A real tradition paired with Asha is itself a stereotype | Synthetic keys only | `[NS-47-R8]` |

Risk checks:

| Check | When | Who | On fail |
|---|---|---|---|
| Label re-run against the binary | Each store candidate | `privacy` | Candidate held |
| Device walk J-CUL-01 (lock screen, Notification Center, Apple Watch mirror, Focus summary, Show Previews Never, App lock on and off, names switch on and off) | Before the flag ships | `qa`, founder | Flag stays off |
| Counsel answers CUL-Q5 to Q7 and Q11 | Before `production` | `legal` through the founder | Flag stays off; fallback list with no question |
| Library wording read against 1.1.1 | Before each tradition ships | `legal`, `regulatory-affairs` | Rows held |

### 14. Never
As section 12, plus: no system-intelligence donation (D3); writing tools off on every field here that takes the parent's own words (D2).

### 15. Design inputs
Reuses C-S24, C-S25, C-S26 (NS-46) and adds: A-S01.daysAsk (one card in the slip slot at rank 3b; question, short call-out, "Choose days" and "Not now" as two stacked `bordered` buttons of the same size; no count or badge; gone after either answer or two unanswered showings); the day-name switch on C-S24 (disabled with a reason while App lock is on, the built `.appLock` pattern read as "present and not ready"); D-S10 new states (NS-46); C-S03 gains one line ("Days you chose on this phone are cleared", intent); C-S20 gains the NS-47-R17 line; C-S04 unchanged (the one line lives on C-S24); E-S01 to E-S08 unchanged, with a design check that none gains a field; E-S27 screenshots use seasonal days only on Asha, never a real tradition and never a synthetic one (a made-up tradition on a store page treats faith as a placeholder, NS-46-R47). New shared pieces: `DoorNote`, I1 `optional` slot, I4 `multi`. C-S24 to C-S26, A-S16 and the new A-S01 states join NS-33-R4, R7, R16 and the quality Annex B.3 screen set.

### 16. Content inputs
Intent drafts (CLAUDE.md content rules only; `content` and the founder decide): `culture.ask.question` ("Would you like a reminder on the days that matter to your family?"); `culture.ask.choose` ("Choose days"); `culture.ask.notNow` ("Not now"); `culture.callout` (section 12); `culture.picker.tradition.header` ("Traditions", help "Pick any that fit. You can pick more than one."; never "a tradition your family keeps"); `culture.picker.country.header` ("A country that matters to your family"; never "native" or "foreign", never "where you live"; absent until a second country ships); one door for adding a day, "Add a day" (not "Another tradition"); `culture.notInSaveCopy` ("These days are not part of Save a copy."); `culture.signOut.line`; `culture.delete.line` ("Days you chose stay on your phones and are cleared with your account."); `days.lock.title.neutral` and `days.lock.body.neutral` ("Something for the book today" and "A day you chose to mark. A few words for {child}, if you like."; the hidden-preview placeholder stays G-D19's; the days-library samples in DAY 5.1 and 5.4 are superseded for neutral title and body); `notifications.dayNames.switch` ("Show the day's name in notifications") and its help line. No key says "your religion" or "note" for a reminder. The Me group name is a working title, "Days and reminders", for tree test T1 (RV-3).

### 17. Legal, privacy and compliance inputs
Apple App Privacy Details (data processed only on the device is not "collected"; Sensitive Info lists religious or philosophical beliefs; derived data sent off the device is considered separately), App Review 5.1.1(i) to (v) (5.1.1(iii) data minimisation, 5.1.1(iv) no manipulating consent and alternatives given, which the equal-weight "Not now" fits), 5.1.2(i), 1.1.1 and 4.5.4 (names push; the licence agreement Attachment 1 section 2.2 names local notifications for marketing; the default stays treating it as applying), GDPR Article 9(1) and 9(2)(a) (explicit consent for a specified purpose; the design is optional, explicit and withdrawable in one tap), the California sensitive-data list (secondary source only). Counsel questions (need numbers from legal): CUL-Q5 (export), Q6 (device-only sensitive data, including whether an app maker is a controller for data it never receives and Article 7), Q7 (label and Privacy Policy sentence), Q11 (4.5.4 and local notes). App Review's view of an optional faith or origin question found no source: UNVERIFIED; the fallback is a plain browse-and-tick list with no question (Notes for Review lead with the fallback as the default description and the ask slip as the optional entry; the store, site and Notes never describe the ask as a question about religion or country). Counsel must confirm all of it. Read 20 Nov by `regulatory-affairs`, through the session proxy with curl for two public pages (see the GAP-LOG process note).

### 18. Label effect
None while NS-47-R4 holds; the Sensitive Info row stays as it is for the due date; a G11 check guards it; the Privacy Policy gains one sentence; the Notes for Review gain a section (NS-47-R23). Not verified against the current label rules.

### 19. Claims enabled and forbidden
Enables: only the call-out sentences that have claims rows. Forbids: "we never show your faith" (the name can show behind the switch), "private by design" without a row, "we know your traditions", "we ask your religion", "tell us your religion", "your tradition", "for your faith", "know your culture", "personalised to your beliefs", "we never store your religion", any statement that App Review or a law has approved the feature.

### 20. Free or Plus
Free (T2). Nothing here is gated.

### 21. Measures with analytics off
Tester sheet reactions only (NS-47-R27); "x of n"; stop rule: any parent who reads the ask as the app guessing at their beliefs ends the session (FR-RSH-21 pattern). No telemetry.

### 22. Dependencies and gates
NS-46 (one release unit, behind `EXPO_PUBLIC_DAYS`; the Drop B subset of NS-47 is the store rules only, R1, R4, R6 to R9, R11, R15, R16); the registry and erase scan (FR-PRV-07, 34; NS-36); BL-961; BL-985; errata E18; counsel CUL-Q5 to Q7 and Q11 on record or the fallback list; the device walk J-CUL-01 (Show Previews Never, Notification Center, Notification Summary, Apple Watch mirror, CarPlay, Focus summary, App lock on and off, names switch on and off, device-to-device transfer); a label check at the G5 gate (compliance names it CG5, K7); founder word approval; `next-ask` change. NS-45 carries the sign-out and delete lines once written. Ships in the drop named in the release cut.

### 23. Open questions
All in "Founder items" with defaults: Q-FD-1, Q-FD-2, Q-FD-5, Q-FD-12 to Q-FD-14, Q-FD-23, Q-FD-26, Q-FD-28. Owner `legal`: does the Home ask slip need counsel's read before any build (default yes, with the fallback of no question). Owner `privacy` and counsel: whether the second plain line under the day-name switch is required (Q-DAY-6; default one switch, one plain line). Conflicts 1 and 2 above.

---

## NS-48. Notification catalogue and rotation (candidate C-xx; kind Attractive; area B Capture; no screen of its own)

### 1. Who and when
A parent three weeks in who has seen the same eight lines and has begun to ignore them, and a parent who has not opened the app for ten days and must not be made to feel it. The words of a note the planner has already decided to send.

### 2. Why
The only repeatable problem that variety solves is notification blindness (NS-13 section 2: a reminder that repeats itself teaches the parent to turn notifications off for good). Evidence is a hypothesis: no parent evidence yet that more variants reduce turn-off (NOTIFICATIONS.md line 55 says the same). Whether variety reduces turn-off cannot be tested in the 1.x line: 434 families per arm (868 in all, about 2,170 at 40% consent) are needed to see 10% against 5% (analytics review, arithmetic shown there), so the full set ships on judgement and a content review, and no public sentence says variety improves habit. The reading test is the tester sheet, section 21. "Fun and engaging" is voice, not volume (direction 4.1).

### 3. What, and Not in scope
**What.**
1. One pure function `selectNotificationKey` in `packages/core` (PROPOSED `packages/core/src/notification-key.ts`) picks a catalogue key for a note the planner has already decided to send. It cannot add, remove or move a note, so volume is unchanged by construction.
2. Inputs, all known at plan time (N-6): the weekday tone; `daysFromAnchor`, the days between the fire date and the newest made letter (the NS-13 anchor, not hours); the kind of the last letter (spoke, typed, first, small, none; `picture` is dropped, RV-2); the child's age band on the fire date; a chosen day or ticked season (NS-46); the day part of the reminder time (filter only); whether names are shown.
3. Resolution with fallbacks: chosen day, then the last-letter layer (recency bands r1 and r2 only), then the weekday by recency grid, then the built 8 evening variants as the floor.
4. Size (N-1): 6 variants per grid cell (5 weekday tones by 4 recency bands = 20 cells, 120 lines); the founder's 8 to 12 applies to the day, season and last-letter layers (DL-5 sets 4 per day and 3 per season); launch floor about 128 variants, the rest in content drops. Content mines the existing 87 rows and 174 variants (`docs/design/NOTIFICATIONS.md`, `docs/design/notifications/COPY_INVENTORY.md`) first (N-7).
5. One text per variant with a `{child}` slot and a fixed neutral rendering; no second parallel set (N-7).
6. A day-part filter: evening-worded variants are dropped before 17:00, including the built 8 (N-8).
**Not in scope.** More notifications; push; the photo-suggestion nudge (NS-49 holds Apple's, which is not ours); the days data (NS-46); the religion and country store (NS-47); month and birthday copy (they keep `en.notifications.monthOpen`, `birthday` and the `together` set); translation; any new setting (variety is not a setting); a new class in the registry (N-2).

### 4. Happy path
Default settings, Tuesday and Saturday at 8:30 PM. After a spoken letter on Monday, Tuesday's note is a question about the child's age, a day later. Saturday carries a Saturday tone. A week later the words differ and none repeat. After day 35 with no letter, there is silence (NS-13-R4, NS-32-R8).

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| Reminder time 07:00 | No variant with "tonight", "evening" or "before you sleep" is chosen, including the built 8 (NS-48-R12) |
| Two books with names off | Age bands are not used; the grid runs (Q-NTC-4 default) |
| A chosen day on a date | The chosen day takes the one slot and ignores recency (NS-48-R8) |
| A family or tradition day with names off | The neutral title and body of NS-47-R12 and R13 |
| A parent turns reminders off | Nothing is chosen; the function is not called |
| A parent never opens the app | The plan holds; day 35 ends it (the 35-day horizon is NS-13's policy, not an iOS rule, RV-4) |
| A letter made today | The anchor moves; every future key is recomputed at the next re-plan; a date in the new r1 band never takes a key from the old r4 pool (NS-48-R3) |
| The last letter was a first or a small mark | Until NS-06 supplies a flag it reads as `none` and the layer falls back to the grid; `first` and `small` shape a body only with names on and App lock off (NS-48-R27, R5) |
| A quiet or hidden book, or "Include in my reminders" off | It contributes no name, age band or kind (NS-48-R21) |
| The pool for a cell is thin or empty | The floor returns a built variant; never an error or an empty key (NS-48-R15) |
| The preview in Me, Reminders | It calls the same function as the planner (NS-48-R22) |
| Apple's journal suggestion notification (iOS 26) the same day | Not ours, outside the budget; no sentence promises "one a day" covers it (NS-32 note; NS-49-R22) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The reminder ask is NS-13's; the first plan uses the grid and floor |
| Empty, normal, many | A pool of n variants gives n distinct keys in n consecutive slots |
| Offline | All local |
| Slow, Failed | Pure function; a failure returns the floor |
| Interrupted, killed mid-flow, updated mid-flow | After an update every pending note is re-planned; the migrated 8 keep their built wording (NS-48-R23) |
| Low storage, Low Power Mode | n/a |
| Kill switch `serverFeaturesEnabled()` off | No effect (NS-13-R26) |
| Remote pause | n/a because the catalogue only chooses words and adds no surface; reminders already have their own behaviour (NS-13-R26) |
| Outage | n/a |
| Plan lapsed | No effect; no Plus, price or Keep step in any key (NS-13-R11) |
| Signed out | Reminders are removed at sign-out (NS-13-R14); the last chosen key is a phone-only setting cleared with them |
| Second account on the same phone | B starts with reminders off (NS-13-R13) |
| New phone | Settings do not sync (NS-13-R22) |
| Two books, two parents, expecting | Name rotation by ordinal over included books, not by the number of name-bearing variants; an expecting-only plan uses lines tagged "before birth: yes" in the unlocked preview only; the lock screen shows the neutral evening line (NS-48-R36; D W-G5) |
| VoiceOver, AX5 | Not a screen; the preview on D-S06 follows that page's rows |
| Devanagari, RTL | Keys with slots, not built sentences, so a language pack can supply them (NS-48-R25) |
| Every error code | None; the function never throws |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-48-R1 | Given any planned evening or day note, When the planner asks for its words, Then a pure function in `packages/core` returns a catalogue key, the same inputs always give the same key, and every key it can return exists in `packages/content` and no content key is an orphan | P0 (a) | `[NS-48-R1] same inputs same key; every key exists` |
| NS-48-R2 | Given the catalogue on or off and the same plan inputs across cadences, books and time zones, Then the set of (id, date, time, class) is identical, so the catalogue never raises volume; the planner takes a `select` function and the test injects the floor-only selector (the seam for "catalogue off"); the catalogue and the budget emit no analytics event on the date of a day note | P0 (a) | `[NS-48-R2] volume is unchanged` |
| NS-48-R3 | Given a plan for any future date, Then every input is computable at plan time: recency is the fire date minus the anchor date in days (r1 the next day, r2 days 2 to 6, r3 days 7 to 14, r4 days 15 to 35), never a clock read at delivery; the anchor is the newest made letter's `captured_at` date in the phone's zone, clamped so it is never after the plan date (not `occurredOn`, which "another day" can change, IA-AUDIT X7; K11 ruling); a letter made today moves the anchor and the next re-plan recomputes every future key; the plan is rebuilt on first launch after a restore, on a time zone change and on a clock change, and a rebuild on the same inputs gives the same set of (id, date, time, class) | P0 (a) | `[NS-48-R3] recency is computed at plan time` |
| NS-48-R4 | Given recency r1 to r4, Then the copy is a question or an invitation that is shorter and more open as the gap grows, and never mentions the gap, a count, a comparison or a judgement | P0 (a) | `[NS-48-R4] no gap in the words` |
| NS-48-R5 | Given a last letter within 6 days, Then the question follows from its kind, only `spoke` and `typed` (the act of capture) feed a visible body and a title never carries a kind (N-4 as narrowed, RV-2); `first` and `small` shape a body only when names are on and App lock is off, otherwise the grid runs; `picture` is not a kind (it would word a reminder from a picture, against NS-49-R3); the question never summarises the letter or repeats the parent's words, the app does not read the letter's text, and a body never names a feature the parent has not already used | P0 (a) | `[NS-48-R5] the kind may shape the body, never the title` |
| NS-48-R6 | Given the weekday, Then it changes tone only (lighter Friday, slower Sunday, small Monday) and never the number or timing of notes | P1 | `[NS-48-R6] weekday is tone only` |
| NS-48-R7 | Given a child's age band on the fire date (newborn 0 to 2 months, baby 3 to 11, toddler 12 to 35, child 36 and over; bands PROPOSED, using the age the Book shows, R-IA-1), Then it changes only the subject of the question; with names off and two or more included books the last-letter layer is skipped and the grid runs; band words stay out of titles; boundary tests on the fire date use `packages/core` age and injected clocks | P1 | `[NS-48-R7] age band is the subject only` |
| NS-48-R8 | Given a ticked day or season on a date (source `libraryDay`), Then it takes the one budgeted slot, takes its words from the occasion layer whatever the recency, survives the back-off (it is not an evening note), and the function never infers a day or season the parent did not tick | P1 | `[NS-48-R8] a chosen day takes the slot and ignores recency` |
| NS-48-R9 | Given a family, tradition, culture-led or national day, or names off, Then the lock-screen title and body are the neutral ones of NS-47-R12 and R13 and contain neither the day name nor a faith word; the catalogue never overrides them | P0 (a) | `[NS-48-R9] the catalogue honours the lock-screen rules` |
| NS-48-R10 | Given any variant in either rendering, Then the title is at most 40 characters and the body at most 110, and there is no emoji, dash, curly quote, ellipsis character, exclamation mark, day count, gap word, "daily" form, machine-writing word, "story" or "note" for an app message, or gendered word; zero exclamation marks (N-5) and `VOICE.md` line 70 is corrected to match line 160 | P0 (a) | `[NS-48-R10] every variant passes the rules test` |
| NS-48-R11 | Given names off (the default) or App lock on, Then no title or body contains a child name; a new catalogue title never carries a `{child}` slot (the migrated 8 keep their built named titles, which render only when names are on, R23; the lint checks the rendered neutral form) | P0 (a) | `[NS-48-R11] no child name by default` |
| NS-48-R12 | Given a reminder time before 17:00, Then no variant that names the evening or "tonight" is chosen (day-part filter, N-8), including the migrated 8 | P1 | `[NS-48-R12] no evening words in the morning` |
| NS-48-R13 | Given a variant authored once with a `{child}` slot, Then the renderer produces a named and a neutral version by one fixed rule (`{child}'s` becomes "the", `{child}` becomes "your little one"; an author may add an explicit override), and a test renders and lints both | P1 | `[NS-48-R13] one text, two renderings, both linted` |
| NS-48-R14 | Given a pool, Then no key repeats within the pool's length, no title repeats back to back, and the same shape (question, invitation, observation, tiny task, quote-a-line) is never used three times in a row over 365 consecutive slots for each cadence | P1 | `[NS-48-R14] rotation without repeats` |
| NS-48-R15 | Given a thin or empty pool, Then the function falls back through the layers to the floor and never throws or returns an empty key; the floor is the five day-neutral built variants (content confirms which) and the three evening-worded ones are eligible only from 17:00, and every (cell, reminder hour in the window) has at least one eligible floor variant (NS-48-R33) | P1 | `[NS-48-R15] the floor always answers` |
| NS-48-R16 | Given any note built from a key, Then its interruption level is `active`, never `time-sensitive`, and its category adds the neutral hidden-preview placeholder (no category or placeholder is built today, NS-47-R36) and never sets `hiddenPreviewsShowTitle` | P1 | `[NS-48-R16] interruption level and placeholder` |
| NS-48-R17 | Given any one reader (a tester or `content` in the S6 reading test, FR-RSH-08) says a variant feels like a judgement, a count or about absence, Then it is retired by removing its key from content in the next drop, the fallback chain covers a thinned pool, and a variant is never retired by an inferred cause or a per-variant rate (the group is too small; analytics review); "reminders still on after two weeks, before and after the catalogue, x of n" is a whole-catalogue question asked once per round | P1 | `[NS-48-R17] retirement by one report` |
| NS-48-R18 | Given the launch floor (about 128 variants) or the full set, Then the fallback chain keeps every cell safe, 6 variants per grid cell is the full size (N-1), the minimum per cell and per layer is a constant the test reads (20 cells by 6 is 120; the other 8 are the built evening 8), and the Design B inventory (87 rows, 174 variants) was mined and reconciled with the rules before new lines were written | P1 | `[NS-48-R18] floor and full set are safe` |
| NS-48-R19 | Given a month or birthday note, Then it keeps its own copy and is outside the catalogue; on a day that is also a chosen day the chosen day wins by the NS-46-R7 order | P1 | `[NS-48-R19] month and birthday stay as built` |
| NS-48-R20 | Given several included books, Then name rotation picks the subject child by ordinal modulo the included books, independent of how many name-bearing variants a pool holds | P1 | `[NS-48-R20] name rotation is independent of the pool` |
| NS-48-R21 | Given a quieted or hidden book, or one with "Include in my reminders" off, Then it contributes no age band, name or kind to any key (NS-32-R14, R-IA-6) | P0 (a) | `[NS-48-R21] a quiet book adds nothing to a key` |
| NS-48-R22 | Given Me, Reminders "How it will look" and "Next", Then both call the same selection function as the planner, so the preview equals what arrives; there is no new switch for the catalogue | P1 | `[NS-48-R22] the preview calls the planner's function` |
| NS-48-R23 | Given an app update, Then the first plan re-plans every pending note (NS-32-R16) and the migrated 8 floor variants still produce their built titles and bodies | P1 | `[NS-48-R23] update re-plans; the built 8 are unchanged` |
| NS-48-R24 | Given the NS-32 registry after this card, Then no class is added and no pending ceiling rises; the evening class keeps its group, priority and ceiling | P1 | `[NS-48-R24] no new class` |
| NS-48-R25 | Given any variant, Then it is a key with slots (`{child}`, `{day}`, `{weekday}`), not a sentence built in code; weekday and day names render per NS-48-R34 (English, `gregory`, Latin digits) | P2 | `[NS-48-R25] variants are keys with slots` |
| NS-48-R26 | Given the planner, When NS-46 and NS-48 add sources and keys, Then the one-a-day rule lives only in `budget.ts` (NS-46-R30), a property test proves no local date holds two budgeted notes across all sources (NS-32-R1), and `budget.ts` is a hard prerequisite of both cards; the answer to IA-AUDIT's "where is the one-a-day rule enforced" is "nowhere before this" and is on record | P0 (a) | `[NS-48-R26] the one-a-day budget has one enforced place` |
| NS-48-R27 | Given `lastMadeLetter()`, Then it is one indexed query (newest by `captured_at` over visible books, own author, `kind != not_much`) returning date and kind, the map is spoken to spoke, typed and mixed to typed, note to typed, `not_much` is not a letter (founder or `content` confirms "small"), and `lastOwnSaveAt` is fixed the same way; Given `first` has no flag yet (NS-06 not built), Then it reads as `none` and the layer falls back to the grid; a 1,200-letter fixture re-plan is within the FR-REL-32 budget | P1 | `[NS-48-R27] last letter is one query; unbuilt kinds fall back` |
| NS-48-R28 | Given every key in `days.lock.*`, `days.landing.*`, `ntc.*` and `notifications.dayNames.*`, When `rules.test.ts` runs, Then each key is in `EVERY` and in the notification scope (zero exclamation marks, 40 and 110 limits, rhythm and gap rules) and a drift test fails if a key family exists in `packages/content/src` that is not in `ALL` (today `index.ts` exports no `days`, `culture` or `ntc` family, so the rules would see none of these strings) | P0 (a) | `[NS-48-R28] every notification key is under the notification rules` |
| NS-48-R29 | Given any `ntc.kind.*` key, Then its title is drawn from a generic pool of at most 6 titles shared across kind cells ("A minute for today?", "One thing today?", "Something to say?", "Something new?", "A small thing?", "The book is open") and no title holds typed, spoken, voice, picture, photo, first, again, another, lately or more; only the body may name a kind (R5) | P1 | `[NS-48-R29] kind never reaches a title` |
| NS-48-R30 | Given any `ntc.kind.*` or age-band line, Then it asks about the child without stating or implying what a child of that age does, should do or has done; the rules test rejects "yet", "already", "still", "by now", "should" and any milestone verb in a title or body, and `content` reads each band's lines for expectation | P0 (a) | `[NS-48-R30] no age norm in a reminder` |
| NS-48-R31 | Given any scheduled note, Then `content.data` holds only `source` and the coarse `kind`, and no catalogue key, variant number, day id or layer appears in `data`, `identifier`, `threadIdentifier` or `categoryIdentifier` (the "tap payload may carry key" clause is struck) | P1 | `[NS-48-R31] payload and identifiers hold no key` |
| NS-48-R32 | Given a plan made twice with no input change, Then the signatures are equal: the variant is a pure function of the cell and `slotOrdinal(date, weekdays)` with no stored "last chosen key" (RV-14), so a store write never rewrites every pending note | P1 | `[NS-48-R32] selection is stateless` |
| NS-48-R33 | Given every (cell, reminder hour in the window), Then at least one eligible floor variant exists | P1 | `[NS-48-R33] the floor covers every hour` |
| NS-48-R34 | Given the interface is English (FR-LOC-10), When `{weekday}`, `{day}` or `{date}` render, Then they use locale `en`, calendar `gregory` and Latin digits whatever the phone's language or calendar (FR-LOC-11), a test runs the catalogue under `hi`, `ar` and `en-u-ca-islamic` and finds no non-Latin digit or weekday name, and day names from other languages keep the family's spelling as data (this replaces "weekday and day names come from the platform's localisation" in R25). CL/K ruling K12 (`GAP-LOG.md`): FR-LOC-11 and FR-LOC-12 govern display and age arithmetic; the days module may use other arithmetic inside, but every date it shows is Gregorian in Western digits, and any question to the parent is about which date, never a calendar conversion or the family's belief; the `en-u-ca-*` test is scoped to display; DL-3 and DL-4 stand | P1 | `[NS-48-R34] names and dates render in English` |
| NS-48-R35 | Given a rendered neutral variant, When it holds "your little one" more than once or "one" twice in a row, Then the build fails until the author supplies an explicit neutral override (R13) | P2 | `[NS-48-R35] neutral renderings read cleanly` |
| NS-48-R36 | Given a book with a due date and no birth date, Then every title and body in either rendering names no pregnancy, due date, "before birth", "bump" or "arrival" (Apple lists pregnancy or childbirth information as Sensitive Info and the due date is L4); the before-birth variants exist only in the unlocked in-app preview and the lock-screen rendering is the neutral evening line | P0 (a) | `[NS-48-R36] no pregnancy words on a lock screen` |
| NS-48-R37 | Given the catalogue and `days.*` files, When the rules test runs over the real keys, Then no title or body holds "note" for an app message, "story", "memory", "moment", "tonight" outside evening-tagged keys, "while you remember", "before it", "gone", "last chance", a "Just" closer or a word from the fear pattern at `rules.test.ts:182` | P1 | `[NS-48-R37] catalogue and days keys pass the vocabulary scan` |
| NS-48-R38 | Given analytics is on (v1.1, off through 1.0), Then `variant_id` is reported only for grid and migrated-floor variants as an append-only index (0 to 399), the last-letter layer reports a `layer` and no id, no age band, no named-or-neutral flag and no kind-with-age is a property, `RECENCY_BAND` is `d1`, `d2_6`, `d7_14`, `d15_35`, and `SCHEMA_VERSION` records it; no claim says variety improves habit | P2 | `[NS-48-R38] no id or property carries an age band` |
| NS-48-R39 | Given D-S06 "How it will look" at AX5 with Bold Text, Then the example wraps and never truncates, is one VoiceOver element "Example" then title then body, shows the neutral rendering when names are off or App lock is on, and never shows a variant the planner would not send | P2 | `[NS-48-R39] the preview is accessible` |

### 8. Non-functional budgets
- Latency: the function is pure and runs inside the planner's existing run; no extra I/O (ASSUMED; `mobile` confirms).
- Memory, on-device storage: a content file of about 264 variants; trivial.
- Battery: n/a. Offline: all local.
- Accessibility: not a screen; the D-S06 preview follows that page.
- Localisation: keys with slots (NS-48-R25).
- Privacy (log canary): the last letter's kind and age band are read on the phone only; nothing new is stored except the last chosen key (phone-only setting).

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch `serverFeaturesEnabled()` off | No effect | `[NS-13-R26]` |
| Card's remote pause | n/a, no surface | n/a |
| Plan lapse | No effect | `[NS-46-R27]` |
| Second account on the same phone | B starts with nothing pending | `[NS-13-R13]` |
| Reminders off or paused | The evening class is not planned and the function is not called for it; a ticked day still resolves its key (NS-46-R31) | `[NS-48-R2]` |
| Notifications not allowed | Nothing scheduled | `[NS-13-R16]` |
| Quiet or hidden book | None (blocked by the Home slip registry) | `[NS-48-R21]` |

### 10. Data and engineering
- Fields: none. The "last chosen key" setting is removed: the variant is a pure function of the cell and `slotOrdinal` (RV-14), so no occasion or day key sits in the iPhone backup and a store write never changes every pending note.
- Migrations: none. Sync: none. Export: none.
- Modules: `packages/core/src/notification-key.ts` (PROPOSED) and tests; `packages/content` new `notifications.catalogue.en.ts` exported under `en` or `features` and the notification path prefixes of `rules.test.ts` (NS-48-R28; the `{day}` slot joins the allowlist; `reminders.en.ts` `neutral.evening` and `en.notifications.evening` become the floor); `apps/mobile/src/lib/reminders/planner.ts` (`PlannedNotification` gains `key`, `variant` goes after the migration test passes; `VARIANTS` and `namedSlotIndex` untied from the 8, `planner.ts:139, 222-235`; new `PlanInput` fields `lastLetter`, the NS-13 anchor, `chosenDays`, `dayPart`; plus the `select` seam); `prefs.ts` (`lastMadeLetter()`, one indexed query, NS-48-R27); notification categories with `previewPlaceholder`; `scheduler.ts:159` payload stays `{ source, kind }` (enums only, NS-48-R31); `packages/analytics` tests (NS-47-R34, NS-46-R34).
- Flags and pause keys: none (variety is not a setting).
- Error codes: none.
- Rollout and rollback: phase 1 (the floor) ships first; rollback is the migrated 8 as the only pool.
- Backlog: new rows needed (no id invented): core function and tests; content catalogue file and rules additions; planner change; `lastMadeLetter()`; day-part filter and the migration of the 8; categories; tester-sheet row. Prerequisite rows: BL-537 (back-off), NS-13-R18, R19, R27 (anchor), `budget.ts` (NS-46-R30), BL-982, BL-985 (X6).
- Built today: 8 evening variants rotated by `slotOrdinal(date, weekdays) % 8` (`planner.ts:139, 212, 353 to 356`); named and neutral are two parallel sets; the planner gets only `lastSaveAt`; the built "A letter tonight?", "The house is quiet" and "Before you sleep" ignore the reminder hour; the built named titles carry `{child}` (`strings.en.ts:690-698`); no notification category or interruption level exists in `apps` or `packages`.

### 11. Information collected
n/a because nothing new is collected or stored. The last letter's kind and date and the child's age band are read on the phone at plan time only.

### 12. Door lines
n/a because the parent agrees to nothing here. Reminders are NS-13's door.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Trust | A note reads as a judgement of absence | R4, copy review | `[NS-48-R4]` |
| Privacy | A name or a faith on a lock screen | R9, R11 | `[NS-48-R9]`, `[NS-48-R11]` |
| Volume | Variety turns into more notes | R2, R24 | `[NS-48-R2]` |
| Constitution | A note appears to write about the parent's letter | R5; the app does not read the text | `[NS-48-R5]` |
| Quiet book | A hard-day tool is ignored | R21 | `[NS-48-R21]` |

Risk checks:

| Check | When | Who | On fail |
|---|---|---|---|
| Every variant through the rules test | Every PR touching the catalogue | `content`, rules test | Test red |
| One week on a real phone: no name on the lock screen, Sunday slower than Friday, an r3 note mentions no absence (NTC-T24) | Before the floor ships | founder device check | Wording fixed |
| Reading by a native editor of the VOICE.md voice | Before ship | `content` | Variant dropped |

### 14. Never
- Never a count, a comparison or a judgement; never "missed", "waiting", "still", "again" after a long pause, "keep your streak", "the app will help you write", "story", "tonight" outside evening-only variants, an exclamation mark.
- Never a variant that implies the app wrote or read anything.
- Ruling D3: nothing is donated to the system. Ruling D2: n/a because no field.

### 15. Design inputs
No new screen. D-S06's "How it will look" preview shows one sample variant for the next planned note and calls the same function as the planner (NS-48-R22). No new switch in Me, Reminders.

### 16. Content inputs
`notifications.catalogue.en.ts` (PROPOSED): keys `ntc.grid.<tone>.<band>.<nn>`, `ntc.kind.<kind>.<ageBand>.<nn>`, `ntc.occ.public.<nn>`, `ntc.occ.family.<nn>`, `ntc.occ.neutral.<nn>`, `ntc.season.<name>.<nn>`; each tagged with a shape and, where it names the evening, an `evening` tag; each with a `{child}` slot rendering. The 40 samples in NTC section 6 are intent and passed only a scratch lint, not the repo suite. Launch floor and full size as in section 3. The parent's own words: none.

### 17. Legal, privacy and compliance inputs
No counsel question of its own; the religion-on-the-lock-screen question belongs to NS-47 (counsel must confirm). Apple documents the category option `hiddenPreviewsShowTitle` ("show the title even if previews are disabled") and a placeholder for the body only, so a title shows with previews hidden only if a category sets that option (NS-47-R36; the default is confirmed on a device in J-CUL-01). DPLA Attachment 1 section 2.3 (no excessive local notifications) is helped by NS-48-R2.

### 18. Label effect
None. All local; nothing new leaves the phone.

### 19. Claims enabled and forbidden
Enables: "Reminders change wording from time to time" and nothing else about variety. Forbids: "smart reminders", "personalised", "adapts to you", "keeps you on track", "keeps parents writing", "we do not track when you write", "not based on your habits", "we do not look at your letters" (true of the text, but read as covering kind and date), "we know when you are free", any claim about fewer or more notes.

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
The S6 reading test (five mock reminders on the shapes of the 20 grid cells; stop line "made me feel I was failing", FR-RSH-08); a device check NTC-T24 (one week on a real phone: no name on the lock screen, Sunday slower than Friday, an r3 reminder mentions no absence); one whole-catalogue yes or no per round, "reminders still on after two weeks" (x of n, a stand-in if n is under 5). One report that a reminder felt like a judgement retires that variant. No per-variant rate. Pass: 0 of 5 report a reminder that felt like a judgement. These cards do not move a number readable in 1.0.

### 22. Dependencies and gates
Phases (each one PR-sized content drop that passes the rules test alone): phase 1, no prerequisites, day-part filter, weekday tone, the built 8 re-keyed (R6, R12, R13, R15, R16, R23, R24, R28 to R33); phase 2, needs the NS-13 anchor and back-off, recency bands r1 to r4 (R3, R4); phase 3, needs `lastMadeLetter()` and the NS-06 flag, the last-letter layer (R5, R27); phase 4, needs NS-46, the day, season and occasion layers. The launch floor of about 128 is the end of phase 3. Hard prerequisites: `budget.ts` (NS-46-R30), BL-537, NS-13 R18, R19, R27, BL-982, BL-985, NS-32-R13 (categories are unbuilt), founder word approval, the device check NTC-T24, a content review of the 40 samples (nine kind titles, "another", "again", "lately", "more", two forgetting lines and "Just" closers fail the rules as drafted; replacements are in the content review).

### 23. Open questions
Q-NTC-5, Q-NTC-8, Q-NTC-9, Q-FD-27 (a little playfulness on Friday and Saturday): see "Founder items". Owner Karma: whether the last-letter layer is used when names are off (default: spoke and typed in the body, never in the title; first and small only with names on, RV-2). Conflicts 1 to 3 and 6.

---

## NS-49. Picture-first start and Journaling Suggestions (candidate C-xx; kind Attractive; area A Capture; extends NS-01)

### 1. Who and when
A parent with a picture of {child} on the phone, or who does not know what to say and would like to see recent days the phone itself lists, then choose one. Job: "I start from what happened, not from a blank page, and the words stay mine."

### 2. Why
Pictures are what parents already take, and the founder asked for the Apple Journal flow (pick a picture, then tell the story). Level 2 uses Apple's system picker, which needs no library permission; the phone hands the app the one suggestion the parent picks (a suggestion can carry a place, workout, contact, song or state of mind as well as a picture, so the true claim is "the app uses only its picture", not "only the picture arrives"; Apple pages read by three reviews). The words stay the parent's; we never write, caption or start the entry. Evidence: the founder's direction; the OPP review ranks it first by a judgement of value, not data. A study test is in section 21.

### 3. What, and Not in scope
**What.**
1. **Level 1, Pick (built, NS-01).** "Start from a photo" is a first-class start on Home inside the capture cluster, the third and quiet start after Speak and Type (A G-11, FR-PHS-01, NS-49-R1), never larger than Speak. Home's one primary action stays Say. No strip, no tile (R-IA-3).
2. **Level 2, Journaling Suggestions (parent-initiated).** Where level 2 exists, "Start from a photo" opens an anchored menu with two items, "Choose a photo" (the picker as built) and "Pick from recent days" (words by `content`), which opens Apple's system picker on iOS 17.2 and later; where level 2 is absent the button opens the picker directly as today (NS-49-R29; this adds one tap, default pending founder: Q-FD-31). The phone lists recent days; the parent picks one; the phone hands the app that one suggestion and the app uses only its photo or Live Photo still, through the NS-01 stored-copy path, and the same picture-edge defaults G-08, G-14, G-15 and G-19 apply unchanged. The suggestion's title and date show as "From your phone: {title}" with a "Use this" control and are never stored or written into the letter unless the parent taps it.
3. **Level 3, library read access: closed in 1.x.** No permission, no PhotoKit read, no nudge built from the library. A spike only on `exp/photos-library-nudge`, only if the founder asks (Q-FD-4).
4. **Apple's own suggestion notification (iOS 26 and later) opening the app** is a second step behind a spike, P2 (NS-49-R20 to R22). It is Apple's notification, not ours.
**Not in scope.** Any picture the parent did not pick; places, workouts, contacts, music, mood, steps, event posters or reflections from a suggestion; video; several pictures per letter; any caption, title or summary we write; any count of pictures; any nudge from pictures; Android; Share of the picture; a Home strip tile (overridden by R-IA-3); a fourth start button.

### 4. Happy path
1. Home. The parent taps "Start from a photo", then "Pick from recent days" (on iOS 17.2 and later with the flag on).
2. Apple's sheet opens in its own process (first time: Apple's one-time consent sheet, which we never explain or pre-prompt). The parent chooses one suggestion and, if it holds several photos, chooses one.
3. Ready appears with the picture and, if the suggestion had one, a label "From your phone: {title}" with a "Use this" control; the photo-words field starts empty. The parent speaks or types.
4. Review, then Keep. The letter holds one stored copy and no mark of how it started.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| Cancel, or the first-use Apple sheet declined | Home as before: same props, no draft, 0 files; no message and no retry prompt (NS-49-R11) |
| Journaling Suggestions off or types restricted in Settings, or an empty list | The app learns nothing and does nothing (Apple documents no cancel or empty callback, UNVERIFIED): Home as before, no draft, 0 files, no message; level 1 stays one tap away in the menu (NS-49-R11, R29) |
| A suggestion with no photo item | Capture starts with no picture, one calm line from `content`; nothing about the other items is kept, shown or logged (NS-49-R10) |
| A suggestion with several photos | The app takes none by default; the parent chooses one (A-S16) |
| iOS 17.0 or 17.1 (our floor is 17.0), Android (not offered, FR-LCY-31), Expo Go, flag off, entitlement absent from the signed plist | The "Pick from recent days" choice is absent, not greyed, and the app still launches (NS-49-R5, R28) |
| App lock raised or the app goes inactive during the pick | A result that returns while locked is discarded with 0 files; no picture in the switcher snapshot (NS-49-R12) |
| iCloud-only suggestion photo | Whether the file is local is UNVERIFIED; NS-01's iCloud lines apply (R17b) |
| Live Photo | The still only (Apple documents `LivePhoto.image` as a still image on disk) |
| Full phone | NS-01's low-storage behaviour |
| The iPhone app on iPad, on an Apple silicon Mac or on Apple Vision (`supportsTablet` is false; no Catalyst) | `isAvailable()` is false where the picker is absent or `isiOSAppOnMac` or `isMacCatalystApp` is true; the choice is absent, never a dead button (NS-49-R18) |
| A picture of another adult or a child | Nothing differs from level 1; no face, scene or person detection (NS-49-R23) |
| Library access limited or denied | No screen of ours mentions it; levels 1 and 2 work identically (NS-49-R25) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Level 1 is available at once; level 2 only on iOS 17.2 and later; Apple's consent sheet is Apple's |
| Empty, normal, many | Empty list: "Pick a photo instead". Many suggestions: Apple's own scrolling list |
| Offline | The picker is on the phone; an iCloud-only photo follows NS-01 |
| Slow | NS-01 states; the stored-copy path is the same |
| Failed | NS-01's failed-picture rows; a failed picture is silent (A-motion 4) |
| Interrupted, killed mid-flow | The temporary copy in `Caches` is swept at launch (NS-01-R52) |
| Updated mid-flow | As killed |
| Low storage, Low Power Mode | NS-01 |
| Kill switch `serverFeaturesEnabled()` off | No effect |
| Remote pause `killSwitches.photos` (existing, NS-01-R19) | The picture start and the suggestions start are absent; Erase, sweep and Export still handle every picture |
| Outage | n/a |
| Plan lapsed | No effect; free |
| Signed out | No effect; the stored copy is per book |
| Second account on the same phone | Each account's pictures follow NS-01 |
| New phone | NS-01 |
| Two books, two parents, expecting | The letter goes to the active book as today |
| VoiceOver, AX5 plus Bold Text on SE 3 | NS-49-R17; the system picker follows system settings |
| Devanagari, RTL | The label is the phone's text, shown as given |
| Every error code | NS-01's picture codes; this card adds none |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-49-R1 | Given Home at the default size and at AX5 with Bold Text on an SE 3, Then "Start from a photo" is a control of at least 44 pt, the third item in the capture cluster after Speak and Type, drawn as the quiet capsule of COMPONENTS A2 and A4 and never larger than Speak, Speak is not scrolled off view at AX5, Home's one primary action stays Say, the picture start count is exactly 1 on Home and 0 elsewhere, and Home holds no strip, tile or second picture entry; if the A-S01 re-draw fails the AX5 test, level 1 ships nothing new | P1 | `[NS-49-R1] picture start sizing at AX5` |
| NS-49-R2 | Given any start, Then it goes through `startCapture({ source })` whose closed list gains `suggestion` beside `photo` (NS-35-R5), and Given a kept letter, Then no column, flag or file name records how it started, `suggestion` is added to the closed list in the same PR as the module and never earlier; the source is in memory only and dropped at Keep | P1 | `[NS-49-R2] the start source is not stored` |
| NS-49-R3 | Given a letter that began from a picture, When Home next shows a reminder note or a slip, Then neither mentions the picture, its subject or its place; the app does not read them for this, nor photo words the parent typed | P0 (a) | `[NS-49-R3] no note about the picture` |
| NS-49-R4 | Given the closed list of Home entries (NS-35 navigation test), Then adding the suggestions choice leaves N3 and N6 green and creates no new start path | P1 | `[NS-49-R4] navigation test still passes` |
| NS-49-R5 | Given iOS 17.2 or later, the module present, the entitlement present in the signed plist and the flag on, Then "Pick from recent days" shows; on iOS 17.0 and 17.1, on Android, in Expo Go, with the flag off or with the entitlement absent it is absent, not greyed (native `isAvailable()` checks the OS version and the entitlement; the NS-01-R59 pattern; a "what Android would do" line: not offered, FR-LCY-31) | P1 | `[NS-49-R5] the choice is absent where it cannot work` |
| NS-49-R6 | Given the parent taps the suggestions start, Then the system picker opens in Apple's process, the app asks no permission, no photo or location usage string exists in the plist, and the compiled app calls no PhotoKit authorisation function (NS-01-R2 extended to this module); proof is a source and `package.json` deny list plus the resolved Info.plist and entitlements per EAS profile in CI, and a binary strings read of the candidate saved to the gate record (a dependency's call is invisible to a source scan) | P0 (a) | `[NS-49-R6] no permission, no library call` |
| NS-49-R7 | Given a picked suggestion with at least one photo or Live Photo, Then the first still is copied into the app's own `Caches` folder, stripped and stored by the NS-01 pipeline (R6, R34, R37), the app deletes only its own copy and never deletes the URL Apple returned (its location, owner and lifetime are recorded by spike step 1), and the letter starts at Ready with the picture exactly as level 1 | P0 (a) | `[NS-49-R7] a suggestion becomes one stored picture` |
| NS-49-R8 | Given a picked suggestion with several photos, Then the app takes none by default and shows each as a choice of one; no photo is stored until the parent chooses | P1 | `[NS-49-R8] several photos, parent chooses one` |
| NS-49-R9 | Given a suggestion with a `title` or `date` range, Then they show only as "From your phone: {title}" (a glyph plus visible words, never colour alone; VoiceOver reads it so) with a "Use this" control and a 44 pt Clear; the photo-words field starts empty; only a tap on "Use this" copies the title into `photo_text` (after which it is the parent's text, edited like any other, writing tools off); keeping without a tap stores no title; the title is never used for a prompt, a nudge or Find ranking; a date chip from `date` is parent-confirmed only (NS-01 OQ-1); no field records that text came from a suggestion | P0 (a) | `[NS-49-R9] the phone's title is never stored unless the parent takes it` |
| NS-49-R10 | Given a suggestion that holds a location, workout, contact, song, podcast, media, steps, state of mind, event poster, reflection, video or any item not named, Then v1 reads none: `content(forType:)` is called only for Photo and LivePhoto, a source scan fails the build on any other `JournalingSuggestion.*` type and also on any reference to `.items`, `JournalingSuggestion.ItemContent` or `JournalingSuggestionAsset`, a Swift unit test with a fake suggestion holding a location, a workout and a contact asserts none is touched, the suggestion object is not stored in state, a route parameter, a log or a crash payload and is released when the picker returns; Given a suggestion with no photo item, Then the module returns nothing (not even title or date), capture starts with no picture and one calm line, and nothing else is kept, shown or logged | P0 (a) | `[NS-49-R10] only photos are read; the suggestion is not retained` |
| NS-49-R11 | Given the parent cancels or dismisses the picker, declines Apple's first-use sheet, has Journaling Suggestions off, or the list is empty, Then the app learns nothing and does nothing: Home is as before (no draft, 0 files), no message or retry prompt shows, the app never explains or pre-prompts Apple's sheet, and level 1 stays one tap away in the menu of NS-49-R29 (Apple's sheet cannot hold "Pick a photo instead") | P0 (a) | `[NS-49-R11] cancel and empty write nothing` |
| NS-49-R12 | Given App lock is up or the app goes inactive during the picker, Then the picker cannot be started while App lock is up, a result that returns while locked is discarded with 0 files (NS-01-R47) and no picture shows in the switcher snapshot (R13a) | P0 (a) | `[NS-49-R12] a locked return is discarded` |
| NS-49-R13 | Given a letter kept from the suggestions path, Then it holds one stored copy and no suggestion identifier, title, coordinates, workout or contact detail, the export (1.7.0) is byte-identical to a level 1 letter with the same words and picture, and given the same source image delivered by the level 1 stand-in and the level 2 stand-in with ids and time from injected sources, the stored file bytes, the entry row fields and the Save a copy file bytes are identical and carry no suggestion-derived metadata (no Exif, XMP, title, id or coordinates) | P0 (a) | `[NS-49-R13] a suggestion leaves no mark` |
| NS-49-R14 | Given `EXPO_PUBLIC_PHOTOS` off or `killSwitches.photos` true, Then the suggestions choice is absent and Erase everything, sweep and Export still handle every picture; `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED) may gate level 2 inside level 1's flag and can only narrow it | P1 | `[NS-49-R14] flags only narrow` |
| NS-49-R15 | Given the entitlement `com.apple.developer.journal.allow`, Then it is added in the Expo config's one entitlements block, appears in a signed build only when the suggestions flag is on for that profile, and `security` reviews the plist and entitlement delta before any `production` build (the NS-04 and NS-35-R7 bar); Apple's pages state no approval step beyond enabling the capability (UNVERIFIED that none exists) | P0 (b) | `[NS-49-R15] entitlement only when the flag is on; security read` |
| NS-49-R16 | Given level 2 ships, Then the where-it-lives lines and the privacy policy say in plain words that the phone makes the list, that only the suggestion the parent picks goes to the app, and that the app uses only its picture and keeps nothing else; counsel reads them before the flag turns on in `production`, each sentence has a claims-inventory row citing the NS-49-R10 scan, and the Notes for Review say the same | P0 (b) | `[NS-49-R16] the recent-days lines are true and read by counsel` |
| NS-49-R17 | Given AX5 and VoiceOver, Voice Control and Switch Control, Then the suggestions choice and the one-photo sheet are 44 pt or more, labelled with their visible words and reachable | P0 (b) | `[NS-49-R17] assistive settings work` |
| NS-49-R18 | Given the iPhone app running on iPad, on an Apple silicon Mac or on Apple Vision, Then `isAvailable()` is false where the picker is absent or `isiOSAppOnMac` or `isMacCatalystApp` is true, no dead button renders on any platform where the module reports unavailable, and a device row records iPad and, if one exists, a Mac (else "not run") | P1 | `[NS-49-R18] no dead button off iPhone` |
| NS-49-R19 | Given the Apple file URL, Then the app accepts it only if it is a regular file readable in the location Apple provided, with a type from the NS-01 allowlist (JPEG, HEIC, HEIF, PNG), under the canvas cap, opens the returned URL once without following links, checks with the open handle that it is a regular file under the size cap, reads the bytes from that handle (no second open by path), runs the NS-01 type allowlist on the bytes and not the name, and the allowed location is recorded by the spike from a real device (spike step 2 also records whether a security-scoped read is needed and whether an iCloud-only photo returns a file) | P0 (a) | `[NS-49-R19] the suggestion file is validated` |
| NS-49-R20 | Given the founder wants Apple's suggestion notifications to open the app, When the spike passes on a real iOS 26 phone, Then (with R32) the app adds `JSNotificationURLFormat` with a universal link on the brand domain (from `packages/brand`, never typed), a route that parses the id (empty for a general reminder) and opens the picker prefilled with the token; Given a build with no associated domain, Then the key is not added and a build never ships a key whose link the website does not serve | P2 | `[NS-49-R20] Apple's notification opens the picker` (spike) |
| NS-49-R21 | Given the suggestion id on the notification path, Then the handler never logs or stores it and drops it after the picker returns; the id counts as L3 for log purposes | P0 (a) | `[NS-49-R21] the suggestion id is never kept` |
| NS-49-R22 | Given our reminder and an Apple suggestion notification may land the same day, Then our NS-32 budget counts only ours, Me, Reminders says in one calm line that the phone's own journal suggestions are separate and can be turned off in Settings (if the app is the chosen app), no sentence states "one notification a day" as covering Apple's, and nothing claims we send them | P1 | `[NS-49-R22] Apple's notifications are not ours` |
| NS-49-R23 | Given a child's picture or a picture showing another adult arrives through level 2, Then nothing differs from level 1 (counsel Q45, Q48) and no face, scene or person detection exists (the NS-01-R33 scan covers the suggestions module) | P0 (a) | `[NS-49-R23] no detection of faces or scenes` |
| NS-49-R24 | Given a canary suggestion title, place name and workout name through the module, Then 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs (NS-01-R51 pattern) | P0 (a) | `[NS-49-R24] canary finds nothing` |
| NS-49-R25 | Given any production, preview or testflight build in the 1.x line, Then there is no photo-library usage string, no PhotoKit authorisation call, no `PHPhotoLibrary` fetch or observer, no background mode for fetch or processing, no MediaLibrary or camera package, and the binary strings read of NS-49-R6 finds none, and a parent whose library access is limited or denied sees no prompt, "grant access" nag or error from us; the NS-01-R22 and R33 scans stay green and cover new folders | P0 (a) | `[NS-49-R25] level 3 stays closed` |
| NS-49-R26 | Given a level 3 spike is asked for, Then it runs only on `exp/photos-library-nudge`, on a development build, against fictional Asha pictures with the flag off in every EAS profile and a test that fails any release profile that enables it; its output is a decision record and no nudge text is written until an ADR is accepted; any future library-derived nudge carries only facts the parent can verify, never faces, scenes, places or people, never a count of "missing" days, never a comparison | P0 (a) | `[NS-49-R26] a spike produces a decision, not a feature` |
| NS-49-R27 | Given the privacy label, Then its effect for level 2 is "no change while only the chosen picture reaches the app and it never leaves the phone", re-read if the entitlement changes the label questions; the Notes for Review name the entitlement, say the picker is Apple's and returns only the chosen picture, say no photo-library permission is requested, and give a reviewer path; counsel reads DPLA 3.3.3(H) and App Review 5.1.3 (health data, the suggestion can carry Health-derived items; UNVERIFIED whether it applies) before the flag turns on | P0 (b) | `[NS-49-R27] label, review notes and the license read` (release checklist) |
| NS-49-R28 | Given a binary built with the module and the entitlement, When it launches and runs the core loop (cold start, Speak, Keep, Book) on iOS 17.0, 17.1, 17.2 and 26 and on the iPhone app on iPad, Then it launches and the choice is absent below 17.2; the Swift import is guarded by `#available(iOS 17.2, *)`, `ScribePhoto.podspec` weak-links `JournalingSuggestions` and its platform is raised from 16.4 to 17.0; with no 17.0 or 17.1 phone the row is "not run" and the flag stays off (level 1 is unaffected) | P0 (c) | `[NS-49-R28] no launch crash below 17.2` (device row) |
| NS-49-R29 | Given level 2 is available, Then "Start from a photo" opens an anchored menu with two items and the VoiceOver hint says "Opens choices"; where unavailable it opens the picker directly with the hint "Opens your photos"; if the spike shows the suggestions picker can only be opened by its own label button, the menu becomes an N7 `fit` sheet holding both choices and keeps the 44 pt, AX5 and VoiceOver rules | P1 | `[NS-49-R29] entry control by availability` |
| NS-49-R30 | Given a suggestion with several photos, Then A-S16 is an N7 sheet of `PhotoFrame` thumbnails of at least 96 pt each (one column at AX5) whose tap chooses it and closes the sheet, VoiceOver says "Picture 1 of 4" (a picture is never described), `accessibilityIgnoresInvertColors` is set, swipe down and the escape gesture close it and choose nothing, nothing is stored until a choice, and there is no glass inside the sheet | P1 | `[NS-49-R30] one-photo sheet works with assistive settings` |
| NS-49-R31 | Given `pickSuggestion()` is the only native boundary (its file and directory names carry no deny-list word of FR-AIS-54: the native file is `journal-picker`, E39; Apple's own `JournalingSuggestionsPicker` symbol is read from the system framework and is not a module name) and returns a plain object (file URL, title, date, kind), Then a JS stand-in produces Asha fixtures (a JPEG, a HEIC, a Live Photo still, a symlink, a path outside the container, a 0 byte file, a suggestion with no photo, one with three photos), tests that use it say `(stand-in)` in their title, and R19 has a device row because a validator stricter than Apple's real container would pass CI and fail on every phone | P1 | `[NS-49-R31] one native boundary and a labelled stand-in` |
| NS-49-R32 | Given a link to the journaling path (spike only), Then `redirectSystemPath` matches the exact host and path, accepts only a value that parses as a UUID or is empty, holds the id in memory and never as a route parameter, routes to Home with the picture start visible and never to `listen`, `review` or a draft, queues behind App lock and the 18+ gate and drops the id if unused within one Home visit; the AASA file gains the path at least one day before the build that needs it with its `route.test.ts` updated in the same PR (an `apps/web` change, so `security` reads it); the website page at that path is content-free and does not log the path or query | P1 | `[NS-49-R32] the journaling link is parsed like a secret` |
| NS-49-R33 | Given the whole suggestion flow (open, pick, cancel, keep, erase), Then a network fake sees 0 requests and no share-sheet call; a suggestion-origin picture leaves the phone only through NS-05 and NS-11, each with its own X2 reads (errata E23), and this card adds no door; the card says "on this phone and in your iPhone backup" (the NS-01-R32 lines) | P0 (a) | `[NS-49-R33] the suggestion flow makes no request` |
| NS-49-R34 | Given a pick that holds no photo item, Then the module returns neither title nor date, and given a pick with a photo the title and date are returned only alongside it | P1 | `[NS-49-R34] a no-photo pick returns nothing` |
| NS-49-R35 | Given level 2, Then DPLA 3.3.3(H) (the API only "for journaling purposes", the use "clearly evident in Your marketing text and user interface", nothing collected through it used for another purpose or given to a third party without consent) is met: the App Store description names the recent-days picker and that it is for starting a letter, the in-app words or Apple's own sheet make the purpose evident, and counsel confirms that the store name "Baby Journal" plus the button words suffice (BRAND.md bans "journal" in prose; default pending founder: Q-FD-34, keep the ban) | P0 (b) | `[NS-49-R35] the journaling purpose is evident and read by counsel` |
| NS-49-R36 | Given analytics is on (v1.1), Then `capture_started.source` gains at most `photo` and `suggestion`, no event or property carries a suggestion title, date, place, workout, contact, id, photo count, empty or cancelled outcome, and `source` is sent at the start and never joined to a kept letter's row on the server | P2 | `[NS-49-R36] only the two source values` |
| NS-49-R37 | Given any public line, store frame or preview, Then it never names Apple's Journal app or "Journaling Suggestions" as ours or as a partner feature, never implies Apple endorses or runs the list (it says "your phone's recent days"), never shows Apple's picker or sheet or a mock of it, and keywords carry no "photos", "journal" or "journal prompts" (counsel confirms the use of Apple's feature name) | P1 | `[NS-49-R37] public copy names no Apple feature and shows no Apple sheet` |

### 8. Non-functional budgets
- Latency: opening the picker under 500 ms on an SE 3 (ASSUMED; the system process owns the rest); Ready with the picture inherits NS-01's budget.
- Memory: the copy is processed under NS-01's cap; the Apple file is deleted once read.
- On-device storage: as NS-01 (one stored copy).
- Battery: n/a; no background work (NS-49-R25).
- Offline: the picker is on the phone; iCloud-only photos follow NS-01.
- Accessibility: NS-49-R17.
- Localisation: the choice's words are `content`'s; the label is the phone's text.
- Privacy (log canary): NS-49-R24.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch `serverFeaturesEnabled()` off | No effect | n/a |
| Card's remote pause `killSwitches.photos` (existing) | Start absent; Erase, sweep, Export intact | `[NS-49-R14]` |
| Plan lapse | No effect | n/a |
| Second account on the same phone | NS-01 | n/a |
| App lock mid-pick | Discarded | `[NS-49-R12]` |
| OS below 17.2 | Choice absent | `[NS-49-R5]` |
| Notification path (iOS 26) | Spike only; P2 | `[NS-49-R20]` |

### 10. Data and engineering
- Fields: three transient rows and no persistent one (PHS 4.5): the app's own copy of the suggestion file in `Caches` (L4, deleted once read, swept at launch, deleted by Erase, never logged, never synced, not in export; the suggestion folder joins the FR-PRV-34 Erase scan and the log canary); the in-memory `title` and `date` (class L4 until `privacy` rules a class, K13, because a title can name a place or person; memory only until the parent taps "Use this", then the existing `photo_text` or letter date); the in-memory suggestion id on the notification path (L3).
- Migrations, sync, export: none beyond NS-01's; a level 2 letter exports as a level 1 letter.
- Modules: `apps/mobile/modules/scribe-photo` (a SwiftUI picker in a hosting controller beside `pickOne`; `isAvailable()` by OS version; `pickSuggestion()` returning one photo URL copy, label title and date; no other item type read; no third-party picker package, NS-01-R22); `ScribePhoto.podspec` (weak link, platform 17.0) and `app.config.ts` entitlements block (`:260-262`; `:250-257` is `associatedDomains`) and `IOS_DEPLOYMENT_TARGET = '17.0'` (`:44`); `start-capture.logic.ts` closed source list; source-scan tests extending NS-01-R22 and R33; the log canary.
- Flags and pause keys: `EXPO_PUBLIC_PHOTOS` and `killSwitches.photos` (existing); `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED, narrows only).
- Error codes: NS-01's.
- Rollout and rollback: after NS-01 is on `testflight` (Q-PHS-1); `preview` first; rollback is the flag; nothing persistent exists.
- Backlog: new rows needed (no id invented): the suggestions module; entitlement and plist review; source scan; canary; `startCapture` source list; spike SP-PHS-1 and an ADR "Library-derived nudges" (`architect`); privacy, claims and review-notes rows. No planner change.
- Built today: Level 1 is built in the open stack (#834 to #840), not read here; the `scribe-photo` module and `pickOne` exist per NS-01.

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| The chosen picture | The letter's one picture | Optional | NS-01's | L4 | Phone, per NS-01 | As the letter | As NS-01 |
| Suggestion title and date | A label the parent may take | Optional, parent taps "Use this" | Length as NS-01's photo words | L4 in memory (K13) | Memory; the existing field only after the tap | Seconds, or as the letter | As the letter's field |
| The suggestion file copy | Read once | n/a | R19 | L4 | `Caches`, transient | Deleted once read; swept at launch | No |
| The suggestion id (iOS 26 path) | Prefill the picker | n/a | n/a | L3 | Memory | Dropped after the picker returns | No |

### 12. Door lines
Picking is an act, not an agreement.
- **Shown:** Apple's own picker and Apple's one-time consent sheet; above the start, at most one sentence from `content` once counsel clears it ("The phone makes the list. Only the suggestion you choose goes to the app, and the app uses only its picture.").
- **Records:** nothing about the act. The stored copy is as NS-01.
- **Never:** reading any suggestion the parent did not pick; reading places, workouts, contacts, music, mood or steps; the photo library; location; faces or scenes; background reads; upload; a donation to Spotlight, Siri or App Intents (D3); writing a caption or an entry start from a suggestion.
- **Decline:** Cancel in Apple's sheet, or "Not now" on Apple's consent sheet. Level 1 stays.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| A child's picture | The app reads a picture the parent did not pick | R6, R10, R25 | `[NS-49-R6]`, `[NS-49-R25]` |
| A person's mood, contacts, route | Apple hands the app the whole suggestion | R10 scan, object not retained | `[NS-49-R10]` |
| Files | A crafted or odd file | R19 | `[NS-49-R19]` |
| Trust | A nudge made from pictures | R3, R26 | `[NS-49-R3]`, `[NS-49-R26]` |
| Privacy | A title or place in a log | R24 | `[NS-49-R24]` |
| Store | Entitlement or label surprise | R15, R27 | `[NS-49-R15]`, `[NS-49-R27]` |
| Launch failure below 17.2 | R28 | `[NS-49-R28]` |
| Notifications | Apple's note read as ours | R22 | `[NS-49-R22]` |

Risk checks:

| Check | When | Who | On fail |
|---|---|---|---|
| Whether the entitlement needs an Apple request (UNVERIFIED) | The spike's step 1 | `mobile`; founder files if needed | The flag stays off; level 1 alone |
| Plist and entitlement delta | Before any `production` build | `security` | Build held |
| Counsel on the label line, the recent-days lines and the license | Before the flag turns on in `production` | `legal` through the founder | Flag off |
| Device runs on iOS 17.1, 17.2 and 26 | Before ship | `qa` | Flag off |

### 14. Never
As section 12, plus: no system-intelligence donation (D3); writing tools off on the label field, photo words and place (D2); no sound or haptic on a failed picture (A-motion 4).

### 15. Design inputs
New ids (PROPOSED): **A-S16** One photo from a suggestion (an N7 sheet, NS-49-R30). New states of existing screens: A-S01 capture cluster with the anchored menu on "Start from a photo" (light, dark, AX5 on SE 3; absent below 17.2); A-S03 state `suggestions.noPhoto` (one calm line, then a picture-less letter; the `suggestions.empty` state is removed because the app cannot observe an empty list); A-S04 state `suggestionLabel` ("From your phone: {title}", a glyph plus words, "Use this" and a 44 pt Clear); D-S06 `journalNote` (the one calm line that the phone's own journal suggestions are separate). There is no Home strip tile (R-IA-3).

### 16. Content inputs
Intent for `content`; none implies the app finds, chooses, writes or understands a picture; banned: memory, moment, album, best, caption, AI, smart, suggested for you, "Journaling Suggestions" and "Apple Journal" in public copy. Keys (PROPOSED, `features.photos.suggestions.*`): `start` ("Pick from recent days", the words are `content`'s), `door` (the one sentence once counsel clears it), `choose.title` ("Choose one photo"; one word, "photo", through the flow), `noPhoto` (one calm line), `pickInstead` ("Choose a photo", the first menu item), `label.fromPhone` ("From your phone"), `journalNote` (the Reminders line). The NS-48 picture-kind copy says "pick", never that the app saw a photo (NTC section 6).

### 17. Legal, privacy and compliance inputs
App Review 5.1.1(iii) (the out-of-process picker; counsel must confirm the reading) and 2.5.19 (no hidden, dormant or undocumented features, which is why the Notes for Review name the flag, the entitlement and a reviewer path; it is not about pickers); Apple Developer Program License Agreement 3.3.3(H) (read 20 Nov by `regulatory-affairs` through curl and the session proxy; the link Apple gives lands on a different anchor), NS-49-R35; counsel Q43 (label line), Q45 (a child's image), Q48 (another adult's picture), Q54 (Photos or Videos become collected if pictures sync). New counsel items need numbers from legal: whether the picker changes the label or Notes for Review; whether the wording above the picker is a notice; 5.1.3 for Health-derived suggestion items; a library permission for a child's pictures (level 3, not for 1.x). Apple's pages state no approval step for the entitlement beyond enabling the capability in Xcode or by Expo capability sync (UNVERIFIED that none exists).

### 18. Label effect
None while the suggestion reaches the app in memory only, one photo is kept and nothing leaves the phone (NS-49-R27; Apple's on-device-not-collected reading; counsel must confirm). Stored pictures are in the iPhone backup, so "stays on the phone" is true of our servers, not of Apple's backup (NS-49-R33). Level 3 would change it and is closed.

### 19. Claims enabled and forbidden
Enables: "Pick a photo from your recent days, then say what you want to say." Forbids: "we find your best moments", "we suggest", "smart", "AI", "memories", "your photos, organised", any count, any sentence that the app reads your photos.

### 20. Free or Plus
Free and ungated, as NS-01 (T2).

### 21. Measures with analytics off
Level 2 desirability has no pre-build test beyond (a). (a) Two past-behaviour questions now, no device, in the planned study OPP-01: "The last time you took a picture of {child} that you wanted to remember, what did you do with it?" and "Did you ever want to say something about it and not?"; pass 4 of 5 name a picture they wanted to say something about and did not; stop if a parent reads a suggestion list as the app watching. (b) A founder-run device walk of level 2 on the founder's own phone, never a tester session (a suggestion list shows real moments), recorded as pass or fail of R6, R7, R10, R11, R12, R28 and nothing about tester behaviour. (c) "Did you start a letter from the recent-days list this week? (yes or no)" only after the flag is on for the founder's family after G0 (FR-RSH-03); a usability check, not a rate. Stop line: "0 of 5 say it felt like the app reading their photos".

### 22. Dependencies and gates
NS-01 shipped on `preview` and on `testflight` (Q-PHS-1); NS-35 (`suggestion` on the closed list, added in the module's PR); NS-32 note on Apple's notifications; the entitlement enabled on the App ID and a weak-linked, `#available`-guarded build proven on iOS 17.0, 17.1, 17.2 and 26 (NS-49-R28); `security` plist and entitlement review; counsel on the label line, DPLA 3.3.3(H) and the recent-days lines; BL-961 and `[X4-R1]` green with a two-account test (a level 2 pick on B's session must not put a picture into A's book); founder word approval; device runs on iOS 17.1, 17.2 and 26 and an iPad (Q-FD-33). NS-50 is not a dependency (no tile). Level 1 and the first-class start are not blocked by any of this.

### 23. Open questions
Q-FD-4, Q-FD-6 (R27 kept closed for level 3, narrow exception for the picker), Q-FD-11, Q-FD-30 to Q-FD-34, Q-PHS-1 to Q-PHS-7: see "Founder items". Owner design lead area A: is the picture start ranked before Type (default: no, "equal weight to Type, third in order" as COMPONENTS A2 and A4 draw it, ruled by the A-S01 AX5 test, FR-OPP-02). Owner Karma: raise the iOS floor to 17.2 or hide below it (default hide; keep 17.0 until the weak-link spike proves a launch run).

---

## NS-50. Home today (candidate C-xx; kind Attractive; area A Capture; one more rank in the Home slip slot)

### 1. Who and when
A parent opening Home on a day they marked. Today Home holds one job and does it above the fold; its weakness is a stale second visit (only the prompt and greeting change). This card gives Home one real, parent-chosen thing on the days that have one, without a second job.

### 2. Why
IA-AUDIT found Home is not thin (5 content elements, 4 actions, 0 to 1 slips) and that the direction's "strip" of up to four things would be a feed with a count of things waiting, which the frame forbids. R-IA-3 rules slip, not strip. A day the parent chose outranks any suggestion, and it is one line of the parent's own choice. On a day with nothing marked, Home is unchanged by this card. This card does not claim to answer whether Home is enough to be the default tab; that rests on IA-AUDIT and a default-tab check (NS-50-R13), and it widens the triggers for starting a letter, not the job (pack-wide note, "Release line"). Evidence: IA-AUDIT sections 5.2 and 5.3 (design judgement, not observed; test T3 below).

### 3. What, and Not in scope
**What.** One more rank in the single Home slip slot (COMPONENTS C9, `[FRAME-SLIP]`): rank (2b), "a day the parent chose, today". Rank (3b) is the one-time Days ask of NS-47. Order: (1) the waiting set, (2) the seal-opened line, (2b) a day the parent chose today, (3) Save a copy, (3b) the Days ask, (4) one past letter (RV-5: a trust slip before an Attractive ask; the day stays above Save a copy because the parent asked for it and it is date-bound, at the known cost that on a day-slip day in the birthday week Save a copy waits). At most one slip shows. The reminder ask is a sheet over the Book and the Plus line is not a slip (frame). A typed day (NS-18) keeps its line in the prompt block and is not a slip (A W9). The slip is the day's only rendering whether the parent opens the app or taps the reminder (RV-6). A quiet day replaces the prompt block with its quiet line (RV-7).
**Not in scope.** A strip or a second list; a count of anything; upcoming days; a picture suggestion tile (it lives in the capture cluster, NS-49-R1); a "past letter" change (NS-23 is locked); new notification behaviour (NS-46); the Days ask's rules (NS-47-R19); any analytics event for a slip.

### 4. Happy path
1. The parent ticked Thanksgiving. On the day they open Home, by the 09:00 reminder or any other way, with no waiting card and no seal opening.
2. Home shows one slip: the day's name and one line (the NS-46 landing words), with "Not today". Speak and Type are as always.
3. The parent taps Speak. Or they tap "Not today" and the slip leaves until tomorrow's date, with the next slip, if any, waiting for the next Home visit (C M-3).
4. A parent who tapped the reminder while a higher slip was due sees that slip first and the day slip at the next Home visit that day; the cost is accepted for one way of drawing the day (RV-6).

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A waiting card or the seal-opened line is due | It shows; the day slip does not (one slip at a time; A G-13: while slip 1 shows, no other slip shows) |
| Two ticked days on one date | One slip naming both |
| A quiet-tone day | The name and "The book is open if you want it."; the quiet line replaces the prompt block, Speak and Type unchanged |
| A birthday the same date | The day yields (NS-46-R7); no day slip |
| The parent moved the date | The slip shows on their date |
| A quieted or hidden book | No slip (R-IA-6) |
| The app goes to the background, with or without App lock | The app-switcher snapshot of Home is blank where the slip would show (E18) |
| Reduce Motion | The slip renders complete, 200 ms fade at most (C9) |
| Second visit the same day | The slip stays until "Not today" or the local day ends; it then leaves the next day with no exit animation and the dismissal is keyed to the local date so a zone change does not resurface it (D G5) |
| The remote pause is on | The slip is absent at the next focus (NS-46-R28) |
| Typed day today | Its line shows in the prompt block as built; no library slip unless a library day also falls today and no typed day does (a day the parent typed ranks first) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | No day is ticked, so no slip; the ask slip is NS-47's |
| Empty, normal, many | A day with nothing ticked: no slip. Never a list |
| Offline | All local |
| Slow, Failed | n/a; the slip reads the store; if it cannot, no slip and no message |
| Interrupted, killed mid-flow | The slip re-evaluates at the next Home focus |
| Updated mid-flow | Same |
| Low storage, Low Power Mode | n/a |
| Kill switch `serverFeaturesEnabled()` off | No effect |
| Remote pause | NS-46's `killSwitches.libraryDays` (PROPOSED) |
| Outage, Plan lapsed | No effect |
| Signed out | The store was cleared; no slip |
| Second account on the same phone | B sees nothing of A's days |
| New phone | Empty |
| Two books, two parents, expecting | The active book's `{child}` where the words use it; a quiet or hidden active book shows none; each phone its own |
| VoiceOver, AX5 plus Bold Text | The slip is one non-interactive element, name then line, with a custom dismiss action and a separate visible button; at AX sizes the button has its own row (B G-06; NS-50-R14) |
| Devanagari, RTL | The day's name as given |
| Every error code | None; no slip on failure |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-50-R1 | Given the Home slip registry, Then a day we mark today is a registered rank (2b), an unregistered slip type fails the test (`[FRAME-SLIP]`), and at most 1 slip renders at a time | P1 | `[NS-50-R1] one slip slot, one more rank` |
| NS-50-R2 | Given a ticked day whose date is today, Then Home shows its name and one line; Given any other date, Then it shows nothing about days: never an upcoming day, a list, a count of ticked days or "no days today" | P0 (a) | `[NS-50-R2] only today, never a list or a count` |
| NS-50-R3 | Given the slip, Then its words are the NS-46 landing words (`days.landing.*`) and a `quiet` day shows the name and "The book is open if you want it." with no question; two ticked days name both | P0 (a) | `[NS-50-R3] the slip uses the landing words` |
| NS-50-R4 | Given a ticked day today, When Home opens by any route (a tap on the reminder, a cold start or an ordinary open) and no higher slip is due, Then the same day slip shows in the slip slot at the position A-S01 draws (directly above the prompt block), a notification tap changes nothing about what Home shows, and Speak and Type never move between visits; the notification arrival is not a stored or carried state | P1 | `[NS-50-R4] a day shows one way` |
| NS-50-R5 | Given the registry, Then the order is (1) waiting set, (2) seal-opened, (2b) a day the parent chose today, (3) Save a copy, (3b) the Days ask, (4) past letter; the higher rank shows and the others do not (NS-23-R6); the order lives in one registry as data (BL-963; COMPONENTS C9 gains the `daySlip` and `askSlip` variants) | P1 | `[NS-50-R5] the slip order is one registry` |
| NS-50-R6 | Given the Days ask (NS-47-R19) is due, When no higher slip is due, Then it shows as rank (3b), at most twice (NS-47-R31) and the NS-47 rules decide whether it is due; Given a slip was dismissed, Then the next slip in the order shows at the next Home visit, never in the same visit (C M-3) | P1 | `[NS-50-R6] the ask is a slip and waits its turn` |
| NS-50-R7 | Given the slip, Then it has a "Not today" button (its own key, not `en.common.notNowButton`, which stays the Days ask's answer) for gesture-free use, the VoiceOver hint says "Hides this until tomorrow" (the ask's says "Closes this question. You can still choose days in Me."); Given a tap, Then it leaves until the next local day with no haptic; it is not an answer to anything | P1 | `[NS-50-R7] not now dismisses until tomorrow` |
| NS-50-R8 | Given a quieted or hidden active book, or "Include in my reminders" off, Then no day slip shows for it (R-IA-6, NS-32-R14) | P0 (a) | `[NS-50-R8] a quiet book shows no day slip` |
| NS-50-R9 | Given the app going to the background on Home or Me, with App lock on or off, Then the switcher snapshot shows no day name (errata E18; the privacy cover is generalised to a blank-on-background rule for screens that carry a day name) | P1 | `[NS-50-R9] snapshot has no day name` |
| NS-50-R10 | Given Home, Then a picture suggestion is never a slip or a tile: the picture entry is the capture cluster's alone (NS-49-R1) and the slip registry holds no picture rank | P1 | `[NS-50-R10] no picture slip` |
| NS-50-R11 | Given Home on any day, Then at most one slip rank shows at a time (rank 1, the waiting set, keeps its list) and no screen shows a count of things waiting | P0 (a) | `[NS-50-R11] Home is not a feed` |
| NS-50-R12 | Given the slip, Then on cold launch it arrives with `m.enter.group`, on a later visit it is already in place, a dismissal is `m.list.remove`, a day change removes it with no animation, under Reduce Motion each becomes the `m.fade` of at most 200 ms or a jump, no haptic plays, and VoiceOver reads it as one element, name then line, then the button | P1 | `[NS-50-R12] slip motion with Reduce Motion and VoiceOver` |
| NS-50-R13 | Given Home with nothing marked and five parents on the e2e prototype, When asked "what is this screen for" and "would you open this or Book first", Then the result is recorded as x of n with a stop line if any parent says "there is nothing here" (research row, no build) | P2 | `[NS-50-R13] default tab check` |
| NS-50-R14 | Given the day slip, Then it is one non-interactive element labelled "{name}. {line}" with a custom action for dismissal and a separate visible dismiss button of 44 pt or more reachable by Voice Control and Switch Control, no nested interactive child inside an accessible group, at AX3 and above the button takes its own full-width row, and the card is `surfaceRaised`, `radius.md`, 16 pt padding, `callout` in `text`; Home on an SE 3 at the default text size with the slip keeps the prompt visible | P1 | `[NS-50-R14] day slip anatomy and labels` |
| NS-50-R15 | Given a `quiet` day, Then Home shows the name and "The book is open if you want it." once, as the day slip of NS-50-R3 itself (one rendering, not a second block), in place of the prompt block, no question and no ordinary prompt, with Speak and Type unchanged (default pending founder: Q-FD-24) | P1 | `[NS-50-R15] quiet day Home` |
| NS-50-R16 | Given the Days ask slip, Then it carries no feature name, "new", count or price and is never shown in a session where the rating request or the Keep gate showed; FR-MKT-24 is reworded to allow exactly one ask slip, once per account, and FR-MKT-23's exclusion list gains the Days ask | P1 | `[NS-50-R16] the ask slip is not a promotion` |
| NS-50-R17 | Given any slip, its rank, its dismissal or the Days ask answer, Then no analytics event exists for it (a day-slip event would show the day-tick date; the "Choose days" versus "Not now" tally is a count of parents who ticked any, which NS-47-R9 forbids) | P1 | `[NS-50-R17] no analytics event for a slip` |
| NS-50-R18 | Given the T3 research gate, Then a strip is not built before T3 shows it adds no time to Speak or Type and no parent says "waiting"; time is the median seconds from Home first frame to tapping Speak or Type, slip shown against not shown, the same 5 parents in random order, differing by less than 1 second with no parent 3 seconds or more slower (PROPOSED figures, `design-systems` or the founder fixes them before day 0), run once per entry path (tap a reminder, open the app) | P2 | `[NS-50-R18] strip gate is research, not a test` |

### 8. Non-functional budgets
- Latency: the slip is chosen inside Home's existing render; no extra read beyond the days module's lazy read (ASSUMED); Home first frame budgets of NS-34 hold.
- Memory, storage, battery: n/a.
- Offline: all local.
- Accessibility: NS-50-R12 and NS-47-R25.
- Localisation: as NS-46.
- Privacy (log canary): the day name is never logged (NS-47-R8).

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch `serverFeaturesEnabled()` off | No effect | n/a |
| Card's remote pause | Absent at next focus | `[NS-46-R28]` |
| Plan lapse | No effect | n/a |
| Second account on the same phone | B sees nothing | `[NS-47-R15]` |
| Higher slip due | Day slip hidden | `[NS-50-R5]` |
| Quiet or hidden book | None | `[NS-50-R8]` |

### 10. Data and engineering
- Fields: none new. "Not today" stores a date value, never a day id.
- Migrations, sync, export: none.
- Modules: the Home slip registry and host (COMPONENTS C9; BL-963; the registry file named in `[FRAME-SLIP]`) as a pure `chooseSlip(state, today)`, `app/(tabs)/index.tsx`, the days module (read-only), the privacy cover generalised to a blank-on-background rule.
- Flags and pause keys: NS-46's.
- Error codes: none.
- Rollout and rollback: ships with NS-46; rollback is the pause.
- Backlog: new row needed (design-systems and mobile) for ranks 2b and 3b in the registry (IA-AUDIT C8); BL-963 is the registry row and depends on NS-06 and NS-11 for ranks 2 and 3 (2b and 3b can ship first only if the registry accepts absent ranks); BL-985 (quiet reader, `bookIsQuiet`); the Home slip host and SlipCard are COMPONENTS R11's row.
- Built today (read by `mobile`): Home renders every waiting draft as a `DraftCard` (or one `HeldRow`), or one "A month ago" card when none is waiting, plus the Plus line (`app/(tabs)/index.tsx:305-325`); the slip host, the registry, the seal-opened line and the Save a copy slip do not exist; ranks 2b and 3b do not exist.

### 11. Information collected
n/a because nothing is collected; it reads NS-46's store.

### 12. Door lines
n/a because the slip is shown, not agreed to; the Days ask has its door lines in NS-47.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Trust | Home becomes a feed | R2, R11 | `[NS-50-R11]` |
| A family's faith | A day name visible to a shoulder-surfer or in the switcher | R9; the day shows only when it is today | `[NS-50-R9]` |
| Hard days | A day slip in a quiet book | R8 | `[NS-50-R8]` |

Risk checks:

| Check | When | Who | On fail |
|---|---|---|---|
| Slip vs strip prototype test T3 (5 parents each, area A `PROTOTYPE.html`) | Before any strip is considered | `user-research`, area A lead | The single slip stands |
| SE 3 at AX5 | Before ship | `qa` | Layout fixed |

### 14. Never
- Never a strip, a list, a count, an upcoming day or a "complete your days" prompt.
- Never a picture suggestion as a slip.
- Never a streak or anything that says what the parent has not done.
- Ruling D3: nothing donated. Ruling D2: n/a because no field.

### 15. Design inputs
A-S01 states `dayToday` and `daysAsk` (PROPOSED), drawn with the C9 slip host (variants `daySlip` and `askSlip`), the day slip directly above the prompt block; "Not today" at the card's foot, its own row at AX sizes (B G-06); the ask slip as two stacked `bordered` buttons (NS-47-R32); D-S11 gains no library-day state. Home with the slip against the SE 3 at the default size and at AX5. Tree test T1 and slip test T3 per IA-AUDIT section 10, T3 run once per entry path. The Home glass budget is unchanged (all content layer).

### 16. Content inputs
Reuses NS-46's `days.landing.*`; adds one close key for the day slip ("Not today"); the Days ask keeps `en.common.notNowButton`.

### 17. Legal, privacy and compliance inputs
NS-47's: a day name on an unlocked Home shows to whoever holds the phone; that is the parent's choice, and the snapshot rule covers the switcher. Counsel must confirm anything touching a protected class (NS-47).

### 18. Label effect
None.

### 19. Claims enabled and forbidden
Enables: nothing new. Forbids: "your day", "don't forget", any count or "waiting".

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Slip test T3 per NS-50-R18 and, as an open question, "what, if anything, on this screen wanted something from you?" (a leading "did anything feel like it was waiting" is not asked); the default-tab check NS-50-R13. Pass: no added time and no parent says "waiting". Tester sheet; "x of n"; no telemetry.

### 22. Dependencies and gates
NS-46 (the data and the store), BL-963 (slip registry), BL-985 (quiet reader), COMPONENTS R11 (SlipCard, SystemLine, Dateline), NS-47 for rank 3b, errata E18, the design of A-S01.dayToday and A-S01.daysAsk, the NS-33 screen set.

### 23. Open questions
R-IA-3 ruled slip not strip; T3 remains in the research plan, default the slip stands. The rank of the Days ask (3b) and the one-way landing are resolved by RV-5 and RV-6 pending Karma. Q-FD-24 (quiet day).

---

## Trace: what each card carries (counted by script from the rows above; priority is the cell's first token)

| Card | Acceptance rows | P0 | P1 | P2 | FR rows it draws from |
|---|---|---|---|---|---|
| NS-46 | R1 to R49 (50 rows) | 22 | 26 | 2 | FR-DAY-01 to 25 |
| NS-47 | R1 to R38 (38 rows) | 27 | 10 | 1 | FR-CUL-01 to 27 |
| NS-48 | R1 to R39 (39 rows) | 13 | 22 | 4 | FR-NTC-01 to 21, N-1 to N-8 |
| NS-49 | R1 to R37 (37 rows) | 21 | 14 | 2 | FR-PHS-01 to 57 (folded) |
| NS-50 | R1 to R18 (18 rows) | 4 | 12 | 2 | R-IA-3, R-IA-5, IA-AUDIT 5.3 |
| Total | 182 | 87 | 84 | 11 | |

No test is claimed to exist: `scripts/trace.mjs` does not yet read NS ids (r3 F1, gate G0), and every P0 row needs a backlog row (E30, `BACKLOG-GAPS.md`).

product (for Karma)
