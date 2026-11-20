# NS-46 to NS-50: days we mark, cultural background, the notification catalogue, picture-first start and suggestions, Home today

Status: Locked-shape draft, 20 Nov 2026 (needs Karma's ruling on the items in "Conflicts and open items for Karma" and the founder's answers in "Founder items"). Changes after lock need a PR that lists every changed id.

Author: `product` (PM role, a Claude session, not a scheduled `product` run), for Karma (CTO). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. These five cards answer the founder direction of 20 Nov (`20-founder-direction-20nov.md`, section 8 last line).

Sources, in precedence order: (1) every ruling in `GAP-LOG.md`, especially the four blocks added on 20 Nov: IA audit R-IA-1 to R-IA-6, notification catalogue N-1 to N-8, cultural background CB-1 to CB-6 and days library DL-1 to DL-10; (2) `20-founder-direction-20nov.md`; (3) the function reviews `functions/days-library.md` (FR-DAY, outline NS-46), `functions/cultural-background-data.md` (FR-CUL, NS-47), `functions/notification-catalogue.md` (FR-NTC, NS-48), `functions/photos-and-suggestions.md` (FR-PHS, NS-49), `functions/feature-opportunities.md` (FR-OPP) and `docs/design/e2e/IA-AUDIT.md` (worktree `/home/claude/wt/E`, head `ed44fe899`; NS-50); (4) the existing cards NS-01 (`01`), NS-13 and NS-18 (`09`), NS-23 (`10`), NS-32 and NS-35 (`11`), and the shape of `19-from-download-to-first-letter.md`.

Read with: `README.md` (the locked 23-section card shape and the Priority rule), `00-product-frame.md` (standing states, slip rule `[FRAME-SLIP]`), `GAP-LOG.md`, `18-errata-after-lock.md`.

Conventions (as `19`):
- Section numbers 1 to 23 follow the locked shape in `README.md`. A section may say "n/a because ..." but is never missing.
- Priority: P0 rows carry their RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Test titles start with `[NS-xx-Rn]`. `scripts/trace.mjs` does not yet read NS ids (r3 F1, gate G0), so no card claims trace coverage.
- Words in quotes that are not an existing `packages/content` key are intent for `content`, never final copy. UNVERIFIED marks anything not read in code or a source. Every legal reading: counsel must confirm (counsel packet 1.5.0 numbers; "needs a number from legal" where none exists). None of this is legal advice. I did not re-read any source; I rely on the function reviews and rulings named, and I did not verify any holiday date, Apple rule or law.
- Timing: cards state order and gates only (ruling T5).
- Rulings D1 (sign-out keeps the book), D2 (writing tools off on letter fields), D3 (no system-intelligence donation), D13 (device evidence on the Asha-only install), T2 (free stays free) apply to every card here.
- Fictional family Asha only. No fixture pairs a real tradition with Asha (CUL review, FR-CUL-08).
- Screen ids. Existing e2e ids are cited as drawn (areas A to E, head `ed44fe899`: A-S01 to A-S15, B-S01 to B-S23, C-S01 to C-S22, D-S01 to D-S24, E-S01 to E-S29; C-S23 and E-ST47 are taken by privacy and support, GAP-LOG K9; E-S30 and E-S31 are proposed for support). New ids proposed here are the next free in each area and are PROPOSED until the area lead confirms: C-S24, C-S25, C-S26, A-S16, plus new states of existing screens. They collide with nothing in the inventory.
- Existing flags and keys are cited; new ones are marked PROPOSED and join the ADR 0029 key list.

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
| DAY 3.2 and 3.3: a ticked day wins over a birthday on the same date because `typedDay` sits above `birthday` | DL-2 | Order is: a day the parent typed, then birthday, then library day, then month, then evening. A ticked day yields to a birthday |
| NTC section 4.2 and direction 4.3: 8 to 12 variants per cell | N-1 and DL-5 | 6 per grid cell; 4 per day; 3 per season |
| NTC axis "hours since the last letter" (direction 4.2) | N-6 | The axis is days between the fire date and the newest made letter |
| DAY 5.1 rule 1: one names switch covers the day name too | CB-5, DL-10 | Library-day names sit behind their own switch (see "Conflicts", item 1) |
| CUL FR-CUL-12: the neutral string for all layers is a body; NTC 3.4: a neutral title | N-3, CB-5 | One neutral title and one neutral body, each one string for every layer (see "Conflicts", item 2) |
| PHS 4.1: a Home strip tile opens the picker | R-IA-3 | No tile; the "Pick from recent days" choice sits inside the picture start |
| CUL section 2 and PHS: new screen C-S24 etc. | none | Used as proposed ids; see conventions |
| VOICE.md line 70 (one exclamation mark a month in notifications) | N-5 | Zero; `content` corrects VOICE.md line 70 (NS-48-R10) |
| Direction 3.2 "East East" option; DAY Q-DAY-12 | CB-6, DL-9 | No "Eastern" option; "Another tradition" and "Not now" only; Lunar New Year, Mid-Autumn and Norooz are culture-led days |

## Founder items across the five cards (defaults hold until answered; a default is the requirement for design and build, never for public text or a store submission)

| Id | Question | Ruled so far | Default if no answer | Cards |
|---|---|---|---|---|
| Q-FD-1 | What does "East East" mean? | CB-6 and DL-9: no such option; may mean East Asian (a culture or origin group) | No option. "Another tradition" and "Not now" cover it. Culture-led days offered without any question | NS-46, NS-47 |
| Q-FD-2 | Ask after the first kept letter, not in first run? | R-IA-5 and CB-6: yes, once, not the same sitting; pending founder | After the first kept letter, a later sitting; "Not now" is final for Home; Me stays | NS-47, NS-50 |
| Q-FD-3 | Mother's Day, Father's Day, Memorial Day, Veterans Day offered, never pre-ticked? | DL-1: yes, quiet tone for Memorial Day and Veterans Day | Yes | NS-46 |
| Q-FD-4 | Level 2 now; level 3 never in 1.x | Direction default; no GAP-LOG ruling | Level 2 yes (after NS-01 is on `testflight`, Q-PHS-1); level 3 closed; a spike only on `exp/photos-library-nudge` and only if the founder asks | NS-49 |
| Q-FD-5 | Religion and country stay on the phone only? | CB-1: all L4; CUL-Q2 recommends keeping only ticked days | Yes, phone only; only ticked days stored | NS-47 |
| Q-FD-6 | Reopen `occasion`, the Memory Library "on this day" part, and NX-39 R27? | N-2: first half yes (`occasion` returns only as a source of typed days; no class). Second half and R27: no ruling | `occasion` as source only (ruled). "On this day" stays with NS-23 and NS-31, untouched. R27 stays closed for level 3; a narrow exception for the chosen-picture picker (level 2) | NS-46, NS-49 |
| CUL-Q2 | Store the tradition and country as fields, or only the ticked days? | none | Only ticked days; picks are a browse filter forgotten when the sheet closes | NS-47 |
| CUL-Q3 | At sign-out, clear the store or keep it per account? | CB-4: clear | Clear | NS-47 |
| CUL-Q4 | Keep the store out of the iPhone backup so "only on this phone" is true? | none | Exclude; short true call-out | NS-47 |
| CUL-Q9 | Separate switch for the day's name? | CB-5: yes | Yes | NS-47 |
| CUL-Q10 | When to ask | CB-6 | Later sitting; Me only if more than 1 tester in 5 says "too personal" | NS-47 |
| DAY-R | Remote pause for the library (a wrong date is a trust defect) | none | Yes, `killSwitches.libraryDays` (PROPOSED), hides the library at the next focus and cancels pending library notes; parent-typed days unaffected | NS-46 |
| Q-NTC-5, Q-NTC-8, Q-NTC-9 | Do more variants reduce turn-off; floor at freeze or full set; corrected age | N-1 sets the size | Hypothesis tested by tester sheet; floor at freeze, rest in content drops; age as the Book shows | NS-48 |
| Q-PHS-1 to Q-PHS-7 | Level 2 timing; iOS target; entitlement approval; Apple's notification; label as Apple's text; places; level 3 spike | none | After NS-01 on `testflight`; keep 17.0 and hide on 17.0 and 17.1; `mobile` enables the capability in the spike's step 1; Apple's notification second step after a spike; label editable and clearable; no place or workout read; level 3 not run | NS-49 |

## Conflicts and open items for Karma (not resolved by me)

1. **One names switch or two (CB-5 and DL-10 against N-7 and DAY 5.1).** N-7 keeps "one names switch" and refuses a separate "Show celebration names" switch for the catalogue. CB-5 and DL-10 give library days their own "day's name" switch, default off, forced off with App lock, separate from `notifications.lockScreenNames`. Read together they are compatible (N-7 is about child names in celebration notes; CB-5 is about a day's name), so this file follows CB-5 and DL-10 for library days and N-7 for the catalogue. A parent then sees two name switches in Me, Reminders. If Karma wants one, NS-47-R12 and R14 change and a faith day's name would show whenever a child's name does.
2. **A public day's name in a title (N-3) against "the day's name shows only behind its own switch" (CB-5).** N-3 lets seasonal and civic days name themselves in a lock-screen title with names off. CB-5 reads as all days. This file applies N-3 to seasonal and civic days only (`publicTitleOk`) and CB-5 to family, tradition, culture-led and national days (NS-47-R12, R13). Whether a public title still shows with App lock on is not ruled; default: yes, because a season or a civic day reveals nothing about the family. Karma to confirm.
3. **The same neutral words, three drafts.** Direction, CB-5 and NTC say "Something for the book today". DAY and the area D WORDS use "A day you wanted to remember" for the typed day. G-D19 ruled the hidden-preview body placeholder "Something for the book, whenever you have a minute." This file keeps three different strings for three different jobs (typed-day title; library-day neutral title; hidden-preview body placeholder) and tests that each layer shares one string per field. `content` decides the words.
4. **A ticked day per account or per book (DAY 3.2 against CB-1 and FR-CUL-01).** This file stores per account and clears at sign-out (CB-4), and lets the landing use the active book's `{child}`. A quiet or hidden book gets none of its own (R-IA-6, NS-32-R14); if every included book is quiet or hidden, no library note is sent.
5. **Library day on Home: a slip (R-IA-3) against the typed-day line, which A W9 ruled "not a slip".** IA-AUDIT asks that the day shows one way whether the parent arrives by notification or by opening the app. This file resolves it: on a notification tap the day shows as the line above the prompt (D-S11, not a slip) and the slip is not drawn that visit; on any other open on that day, with no higher slip, it is rank 2b (NS-50-R4). Karma to confirm.
6. **Where the one-a-day budget is enforced is UNVERIFIED (R-IA-6).** IA-AUDIT found no "budget" in `lib/reminders` or `lib/billing`. NS-46 and NS-48 add sources and keys to it, so NS-48-R26 makes confirmation a precondition. Likewise `setChildQuiet` has no reader in the planner (IA-AUDIT X6, INFERENCE); NS-48-R21 and NS-46-R25 depend on BL-985 and test T6.
7. **Rank of the Days ask slip.** IA-AUDIT proposes (2c), directly after a day we mark. A question about a feature may be better last (below Save a copy and the past letter). Default: (2c) as drawn; design and the slip test T3 decide. Not a contradiction between rulings.
8. **NS-32-R5 says "no `occasion` class" and lists five classes.** That stays true (N-2). DL-2 needs `libraryDay` as a ranked source inside the `typedDay` group. NS-32-R3 and R5 gain that ranking (changes list below). If Karma prefers a registry row, that is a new class and contradicts N-2.

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
| `00-product-frame.md` slip order and `[FRAME-SLIP]` | Registry gains rank 2b (a day we mark today) and 2c (the Days ask), order as NS-50-R5 | R-IA-3, R-IA-5 |
| `VOICE.md` line 70 | Corrected to match line 160 and the checker (zero exclamation marks in notifications) | N-5 |

---

## NS-46. Days we mark (candidate C-xx; kind Attractive; area B Capture, lives in Me)

### 1. Who and when
A parent who would like a short, personal note on days that matter to their family: a season, Mother's Day, Thanksgiving, Diwali, Eid, Easter, Hanukkah, Lunar New Year. The first offer is a Home slip after the first kept letter, once, in a later sitting (NS-47-R19); after that the Days page in Me, any time. Not in first run.

### 2. Why
The parent's own choice is the gentlest prompt there is (NS-18 section 2), and a day on the calendar is a natural thing to say something to {child} about. Job: "Tell me what to write about, without nagging." Evidence: the founder's direction only; no research yet. The tester sheet in section 21 and the research plan follow (HYPOTHESIS, not observed).

### 3. What, and Not in scope
**What.**
1. A library of days, as data with a source per row (layers: seasonal and shared, family and parent, civic and commemorative, traditions, culture-led, national). The parent ticks the days they want. Nothing is ticked for them.
2. One Days page, C-S24 (PROPOSED), in Me under a new "Notes and days" group (R-IA-2; the Me regroup is built only after tree test T1, R-IA-4). It lists the parent's own typed days (NS-18) and the library days they ticked as one list, with "Add a day" (NS-18's flow) and "Browse days" (C-S25, a sheet).
3. A ticked day recurs each year until unticked. It is stored in a separate yearly store (CB-2), not as a typed day, and feeds the same planner slot and the same one-a-day budget as source `libraryDay` (no new class; N-2).
4. The parent can move a date for one year or for always, and can say "which calendar" where authorities differ (DL-3).
5. On the day, 09:00 local (DL-6), one note. Its lock-screen words follow NS-47-R12 and R13. A tap lands on Home with the day's name and one line above the prompt (NS-46-R13).
**Not in scope.** Pre-ticked days; inference of any kind; location; any note built from a picture, a letter, a place or a name; any greeting or explanation of a day; recurring typed days (those stay NS-18's one-off); a second notification class; a "complete your list" or a count of days ticked or missed; the religion and country question and the store's privacy rules (NS-47); the "on this day" look-back (NS-23, NS-31); other countries' national days (DL-7: later, after the founder names a country field in scope).

### 4. Happy path
1. The first letter is kept. In a later sitting Home shows one slip (rank 2c, NS-50): the ask in NS-47. The parent taps "Choose days".
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
| Authorities disagree (Eid al-Fitr 2026: 20 or 21 Mar; Diwali 2027: 28 or 29 Oct; Buddha's birthday 2026: four dates) | One calm question, "Which calendar does your family follow?" (intent); the default is the first row of the parent's tradition; the day shows as "around" |
| A day has no published date for the coming year | Nothing is scheduled; the Days page shows one calm line; the next app update refreshes the table (NS-46-R14) |
| A moon-sighting day is one day off | The parent moves it; support has a macro (FR-DAY-21) |
| Notifications not allowed in iOS Settings | Ticking still works; one line says notes need permission, with no promise of delivery and no second ask (E K-E13) |
| Reminders switched off | Library days still come if notifications are allowed, as typed days do (D W-G7); Me, Days stays visible |
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
| Slow | Planning a year of ticked days under 50 ms on an iPhone SE 3 (ASSUMED figure, `mobile` sets the real one) |
| Failed | iOS refuses to schedule a note: the built failure line; nothing else changes |
| Interrupted, killed mid-flow, updated mid-flow | A tick is saved as it is made; the Browse sheet re-opens at the top; after an update every pending note is re-planned (NS-32-R16) |
| Low storage | The table is under 100 kB (ASSUMED); no extra download |
| Low Power Mode | n/a |
| Kill switch `serverFeaturesEnabled()` off | No effect; nothing here uses the server |
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
| NS-46-R3 | Given the Days page, Then typed days (NS-18) and ticked library days are one list in one place with one "Add a day" flow, the Reminders page no longer holds a second list, and the page has no count, no header such as "You mark 7 days" and no "complete your list" | P1 | `[NS-46-R3] one Days page and no counts` |
| NS-46-R4 | Given the NS-32 registry after this card, Then it has no new class and the planner emits a `libraryDay` item as a source of the `typedDay` group, with the content key `days.<id>`, under the same budget, ceiling and neutral placeholder | P0 (a) | `[NS-46-R4] a ticked day adds no class` |
| NS-46-R5 | Given a ticked day delivered, Then it is not deleted after delivery and recurs next year until the parent unticks it; Given a typed day delivered (NS-18-R7), Then it is deleted the day after as before | P0 (a) | `[NS-46-R5] a ticked day recurs; a typed day does not` |
| NS-46-R6 | Given a ticked day, Then the phone stores its id and optional overrides, never a copy of the date; Given a corrected table in an app update, When the app next plans, Then every ticked day is re-resolved from the new table | P1 | `[NS-46-R6] ticks store ids, not dates` |
| NS-46-R7 | Given two budgeted notes due on one date, Then the order is: a day the parent typed, birthday, `libraryDay`, `monthAge`, `evening`; Given a first birthday that falls on a ticked day, Then the birthday is sent and the library day is not | P0 (a) | `[NS-46-R7] birthday beats a library day` |
| NS-46-R8 | Given two ticked days on one date (fixtures 14 Feb 2029 and 16 May 2027), Then exactly 1 note is scheduled with the neutral title, both names show after the tap, and no day is moved to another date | P0 (a) | `[NS-46-R8] two days one date one note` |
| NS-46-R9 | Given a ticked day and a plan notice on one date, Then both are delivered; Given 60 budgeted notes pending, Then library days respect the ceiling and the 4 plan notices are still scheduled (NS-32-R4b) | P1 | `[NS-46-R9] plan notice and ceilings hold` |
| NS-46-R10 | Given a library day, Then its note is planned like a birthday: 92 days ahead, 09:00 local clamped into the parent's window (07:00 to 21:30 in 15 minute steps), never time-sensitive; a day that begins at sundown is sent on the daytime date its list gives; no sunset or location is used | P1 | `[NS-46-R10] library day time and window` |
| NS-46-R11 | Given an astronomical day, Then the row stores one UTC instant and the note falls on the phone's own local date (the 23 Sep 2027 06:02 UTC equinox is 22 Sep on Pacific time and 23 Sep on Eastern time); the picker offers the astronomical day by default and the meteorological first of the month as the second choice; season names follow the hemisphere switch | P1 | `[NS-46-R11] astronomical days follow the phone's date` |
| NS-46-R12 | Given every rule-based day (fixed, nth weekday, Easter by the computus), Then the phone computes the date and a test equals the checked table for 2026 to 2030; no third-party table is copied for a rule date (DL-4) | P1 | `[NS-46-R12] rule dates are computed and match` |
| NS-46-R13 | Given a tap on a library-day note, Then Home opens within 2 seconds on an SE 3 showing the day's name and one line above the prompt (the typed-day line component, D-S11), the prompt below is an ordinary prompt (NS-47-R5), and one more tap starts speaking; `quiet` tone days show the name and "The book is open if you want it." with no question; two ticked days name both | P0 (a) | `[NS-46-R13] the landing shows the day and a plain prompt` |
| NS-46-R14 | Given a moving day, Then the row carries an `authority` and a country or tradition and `precision: about`, the picker and the landing say "around", and where authorities differ the picker asks one calm question and keeps the parent's choice; the parent can move the date for one year or for always and that date is the parent's own (DL-3) | P0 (a) | `[NS-46-R14] a moving day says around and can be moved` |
| NS-46-R15 | Given a ticked day with no date for the coming year, When the planner runs, Then nothing is scheduled for it and the Days page shows one calm line ("{day}: the date for next year arrives with the next update."); no count, no warning style, no badge; years no authority has published are not shipped (DL-3) | P1 | `[NS-46-R15] no date means no guess` |
| NS-46-R16 | Given Memorial Day, Veterans Day, Good Friday, Yom Kippur or a national day whose name refers to a war or a lost life, Then the day is offered, never pre-ticked, with tone `quiet`: its name only, no prompt, no question mark, no "remember"; a parent cannot change the tone (DL-1) | P0 (a) | `[NS-46-R16] quiet days stay quiet` |
| NS-46-R17 | Given every `days.*` key, When the rules test runs, Then none has "your" before a day name, a relationship word, a greeting (Happy, Merry, Blessed, Mubarak), "celebrate", "gather", "together", "around the table", a digit outside a date, a `{child}` in a names-off lock string, a question mark in a `quiet` line, an exclamation mark, a count or comparison ("another year"), or a claim about what a day means | P0 (a) | `[NS-46-R17] days copy passes the voice rules` |
| NS-46-R18 | Given the ids in `days.excluded` (days of death or mourning, contested names, commercial or political days, private family days; DAY section 6), Then the build fails if any appears in the library | P1 | `[NS-46-R18] excluded days stay out` |
| NS-46-R19 | Given a day the library does not hold, Then Add a day (NS-18) takes it in the parent's own words and the app never says a day is missing, never counts what is ticked and never offers "complete your list" | P0 (a) | `[NS-46-R19] the app never says a day is missing` |
| NS-46-R20 | Given Browse days, Then the order is seasonal and shared, family, civic, then traditions; a parent who ticked tradition days sees that tradition's days first; "Browse all" is alphabetical and not by size; the words "your religion" and "your tradition" never appear; ticking works across traditions | P1 | `[NS-46-R20] browse order and no label` |
| NS-46-R21 | Given the first release, Then only US days and rules ship; a row with a country has one row per country read; no country is offered by default; other countries wait for the founder (DL-7) | P2 | `[NS-46-R21] US days first` |
| NS-46-R22 | Given a day note, Then no title, body or landing says "last year", "again", "another" or shows anything the parent wrote on that day before; the "on this day" look-back is NS-23 and NS-31, not this card | P0 (a) | `[NS-46-R22] no look-back and no count` |
| NS-46-R23 | Given a tradition's rows, Then a member of that tradition has reviewed them and the review is on record before they ship (DL-8); and given each source table, Then counsel has confirmed the right to use it, with rule dates computed rather than copied (DL-4, FR-DAY-23) | P0 (b) | `[NS-46-R23] tradition review and source licence on record` (release checklist) |
| NS-46-R24 | Given each October, Then a named `content` owner re-reads every table row for the next year and records source and date, and a test fails the build when a row's last year is before the next calendar year after the October review date | P1 | `[NS-46-R24] annual data review` |
| NS-46-R25 | Given a quieted or hidden book (R-IA-6), Then it receives no library note; Given every included book is quiet or hidden, Then no library note is sent; Given "Include in my reminders" is off for a book, Then that book is not the subject of a note | P0 (a) | `[NS-46-R25] quiet book adds nothing` |
| NS-46-R26 | Given VoiceOver, Voice Control, Switch Control and AX5 with Bold Text on an SE 3, Then every control on C-S24, C-S25 and C-S26 is reachable at 44 pt or more with its visible label as its name; a moving day reads "around {date}"; the list reads flat and nothing truncates | P1 | `[NS-46-R26] Days page works with assistive settings` |
| NS-46-R27 | Given any day note, Then it names no Plus, price, allowance or Keep step (NS-13-R11) and the feature has no entitlement check | P0 (b) | `[NS-46-R27] a day note never sells` |
| NS-46-R28 | Given `killSwitches.libraryDays` (PROPOSED) true, Then the Days library, Browse and the ask slip are absent at the next focus of their screen, pending library notes are cancelled at the next re-plan, and typed days, reminders, reading and export are unaffected | P1 | `[NS-46-R28] remote pause hides the library only` |

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
| Kill switch `serverFeaturesEnabled()` off | No effect | `[NS-46-R4]` |
| Card's remote pause `killSwitches.libraryDays` (PROPOSED) | Library gone at next focus; notes cancelled; typed days stay | `[NS-46-R28]` |
| Plan lapse | No effect; free | `[NS-46-R27]` |
| Second account on the same phone | A's store cleared at A's sign-out; B sees nothing | `[NS-47-R15]` |
| Reminders off | Library notes still come (D W-G7) | `[NS-46-R4]` |
| Notifications not allowed | Tick works; one line; no promise | `[NS-46-R10]` |
| Quiet or hidden book | None | `[NS-46-R25]` |
| Clash with birthday, typed day, plan notice, other day | Rows R7 to R9 | `[NS-46-R7]`, `[NS-46-R8]`, `[NS-46-R9]` |

### 10. Data and engineering
- Fields: ticked day ids; optional per-day date override (one year or always); optional per-day "off this year"; hemisphere choice for season names; all held in the one store of NS-47 (class and lifecycle are NS-47's). Day data is content, not user data: `packages/content/src/days/` (PROPOSED).
- Migrations: none. Sync field group: none (nothing syncs; FR-CUL-04). Export: none (NS-47-R10).
- Modules: `packages/content/src/days/` and `packages/content/test/` (calendar tests, rules scan, `days.excluded`); `apps/mobile/src/lib/reminders/planner.ts` (kind `libraryDay`, extends `PlannedKind` with BL-982's typed-day work); `lib/reminders/prefs.ts` or the store module of NS-47; `lib/reminders/tz.ts` and `packages/core/src/age.ts` (R-IA-1: `dateOfAge` moves to core; astronomical-instant-to-local-date helper; `deviceTimeZone()` per IA-AUDIT X5); Me rows in `app/settings/` (C-S24 to C-S26).
- Flags and pause keys: `EXPO_PUBLIC_DAYS` (PROPOSED, ships on once copy and counsel gates pass); `killSwitches.libraryDays` (PROPOSED; the pause is worth having because a wrong date is the failure mode with the highest cost to trust, DAY section 7). Both join ADR 0029.
- Error codes: `days_store_unavailable` (PROPOSED, local).
- Rollout and rollback: flag on for `preview` first; rollback is flag off plus the pause; nothing is stored anywhere that outlives the phone.
- Backlog: new rows needed (no id invented): days data and calendar tests (NR-DAY-01); planner `libraryDay` source and the DL-2 order (NR-DAY-06); store (NR-DAY-03, with NS-47); astronomical and hemisphere (NR-DAY-04); table refresh route (NR-DAY-07); October review runbook (NR-DAY-08); Days page and Browse sheet (NR-DAY-10). BL-982 (typed days) and BL-966 (budget) are prerequisites.
- Built today: `planner.ts` kinds are only `evening`, `monthAge`, `birthday` (line 106, read by the DAY review); `typedDay` is a design and a row, not shipped. Where the one-a-day budget is enforced is UNVERIFIED (conflict 6).

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
- **Shown:** before the first tick, `days.door.line` (intent, from the direction: "Only on this phone. Used for one thing: suggesting days to mark. Change or clear any time."), and the names-switch help line.
- **Records:** on the phone, day ids and overrides; no server row and no PRIV-R21 record. If counsel rules a ticked tradition day is special-category data needing a recorded act, this line changes (needs a number from legal).
- **Never:** a pre-ticked day; a tradition, day id, country or count in analytics, logs, crash reports, URLs or a notification title (except a public day's name under N-3); a greeting.
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
New screen ids (PROPOSED): **C-S24** Days (Me, Notes and days; states: empty, some, no-date-next-year line, clear-confirm, store-unavailable, AX5); **C-S25** Browse days (sheet; groups in the NS-46-R20 order; "Dates differ by country" question; hemisphere switch in the seasonal rows; "Done" the only exit; no "select all"); **C-S26** Day detail (name, date with "around", "Move this date" one year or always, Remove; no tradition label). New states of existing screens: A-S01.daysAsk and A-S01.dayToday (NS-50); D-S10 `libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, `libraryDay-quiet` and `twoDays`; D-S11 `libraryDay`, `libraryDay-quiet`, `twoDays`; D-S06 states for the day-names switch (NS-47). C-S01 gains a "Days" row in "Notes and days" (R-IA-4, after T1). D-S08 and D-S09 are reused by C-S24 for typed days and their detail. Typed days and library days are in two sections of the one list so the difference is visible ("a day you type" and "a day we mark", CUL section 4).

### 16. Content inputs
New key family `days.*` (PROPOSED), all under the rules test: `days.name.<id>`; `days.lock.title.neutral` and `days.lock.body.neutral` (NS-47); `days.lock.title.twoDays`; `days.landing.bright` (intent: "{day}. Anything you would like {child} to hear about today?"); `days.landing.season` (intent: "{season}. What does today look like?"); `days.landing.quiet` (intent: "{day}. The book is open if you want it."); `days.picker.around` ("around {date}"); `days.picker.whichCalendar` ("Which calendar does your family follow?"); `days.nextYear.line`; `days.door.line`; `days.empty` (no words about gaps). Words that are the parent's: none. The founder approves. Samples and the 12 wording rules are in DAY sections 5.2 to 5.4 and are intent, not final.

### 17. Legal, privacy and compliance inputs
FR-DAY-23 (source licences; counsel must confirm; "needs a number from legal"), Q-DAY-6 and Q-DAY-11 (a ticked tradition day as data inferring religion; GDPR Article 9 reading; both are NS-47's), 1.1.1 of the App Review Guidelines on content about religion and origin (`legal` reads the set before it ships), 4.5.4 treated as applying to a local note by default (FR-CUL-14). No law, guideline or date was re-verified here.

### 18. Label effect
None expected, because nothing leaves the phone (NS-47-R4); the label is re-run per build (NS-47-R23).

### 19. Claims enabled and forbidden
Enables: "Pick the days you want a note on." Forbids: "every holiday", "all religions", "every culture", "the right date", "we know your traditions", any claim that the feature is free forever (T1).

### 20. Free or Plus
Free. A note on a day is the parent's own reminder; no entitlement logic in any lock-screen string (NS-46-R27; T2).

### 21. Measures with analytics off
A tester sheet (no telemetry; NS-47-R9): did the parent tick a day; did a note land on the right day; did anyone feel guessed at (a reaction question, never the tester's own faith or origin); one question about wrong dates per tradition. Pass line (PROPOSED): 4 of 5 ticked a day without help, 0 of 5 felt guessed at, 0 wrong dates in the first year's rows read. Results are "x of n".

### 22. Dependencies and gates
BL-982 (typed days), BL-966 (budget) and the NS-32 order change; NS-13's anchor does not gate this card; the Days page designed (C-S24 to C-S26) and tree test T1 for its place in Me; NS-47 shipped with it (store, lock rules); founder approval of copy; counsel on FR-DAY-23; a tradition-member review for each tradition; a named annual-review owner; first-year tables read from authorities.

### 23. Open questions
- DAY-R: remote pause for the library. Owner: Karma. Default: yes (see "Founder items").
- Q-FD-1, Q-FD-3, Q-FD-6 (first half ruled), DL-7: see "Founder items".
- Q-DAY-8: a regional or sub-community day (Pongal, Onam, Parsi New Year, Norooz) in the first release. Owner: `content`. Default: yes if its list was read and the parent can move it; Norooz is already culture-led (DL-9).
- Library bundle or downloadable pack. Owner: `architect`. Default: bundle, refreshed with an app update (DAY 3.6).
- Rank of the Days ask slip: conflict 7. Owner: design lead area A. Default: (2c).

---

## NS-47. Cultural background: the optional ask, what is kept, and the lock-screen rules (candidate C-xx; kind Foundation with Attractive; Me and Home)

### 1. Who and when
A parent, after the first kept letter and in a later sitting, who may want the days of their family's tradition or a country that matters to their family to be easy to find. Also any parent, later, in Me, Days. Never in first run.

### 2. Why
The founder asked to optionally ask for religion and native country with a clear call-out. A list the parent browses is safer than a guess, and the data is among the most sensitive a person has. This card keeps what we hold to the least that works. Evidence: direction 3.4; CUL review sections 0 and 6 (product risks, not legal claims).

### 3. What, and Not in scope
**What.**
1. A one-time ask slip on Home (rank 2c, NS-50-R6): "Would you like a note on days that matter to your family?" with "Choose days" and an equal-weight "Not now" (intent). "Not now" is final for Home (CB-6).
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
| "Not now" on the slip | `culture.asked = done`; Home never shows it again; the same choices stay one tap away in Me, Days |
| The parent closes the sheet without ticking | Nothing but the flag is written; the app behaves as if never asked |
| Sign-out | Store and pending notes cleared at that moment; the flag stays keyed to the account; account B reads nothing of A's and is asked afresh on B's rules (NS-47-R15) |
| Erase everything, Delete account | Store gone; C-S20 gains one line (NS-47-R16, R17) |
| New phone, restore, claim step on "Start on this phone" | Empty on a new phone; claimed books re-key the store and upload nothing (NS-47-R7) |
| App lock on | The day's name never shows on the lock screen; the switch is shown disabled with a reason, as the built `.appLock` pattern |
| Show Previews Never or When Unlocked | The category placeholder shows; the app cannot change it |
| Apple Watch mirror, Notification Center, a Focus summary | UNVERIFIED whether a hidden body shows; device walk J-CUL-01 decides |
| A shared phone and a partner | The Days page shows only on the unlocked phone; the app-switcher snapshot is blank (errata E18) |
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
| Kill switch `serverFeaturesEnabled()` off | No effect |
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
| NS-47-R2 | Given the ask or the Browse sheet, When the parent picks a tradition or a country, Then it is held in memory until the sheet closes and the only things written are each ticked day (and a moved date) and the `culture.asked` flag; "Not now", "Another tradition" left empty and closing write only the flag | P0 (a) | `[NS-47-R2] picks are a filter; only ticks are stored` |
| NS-47-R3 | Given any answer, Then no column, key or label on a child, a book, a letter or a share says the family or child follows a tradition, and no screen word says "your child is {tradition}" | P0 (a) | `[NS-47-R3] nothing is attached to the child` |
| NS-47-R4 | Given the ask, a tick, a clear, the claim step and a re-plan, Then a network fake sees 0 requests carrying a day id, tradition or country; no migration, view, RPC argument or setting key is named like tradition, religion, faith, country, origin or culture (a migration lint); nothing is written to `record_policy_act` or any server table | P0 (a) | `[NS-47-R4] no request carries a day key` |
| NS-47-R5 | Given a tap on a library-day note, Then Home shows an ordinary prompt from the existing catalogue; `entries.prompt_key`, `prompt_library_version` and every synced entry field are identical to those of a letter saved on any other evening; a test saves a letter from each library day and compares the synced row to a control (CB-3) | P0 (a) | `[NS-47-R5] a day note leaves no trace in the synced row` |
| NS-47-R6 | Given the store, Then it lives in a file or database excluded from the iPhone backup (as `photos/*-512.jpg` are, NS-37-R4), not in the `settings` table of `scribe.db`; deleting the app deletes it; it is never in the Keychain; a restored phone asks again. If the founder keeps it in `settings` (CUL-Q4), the call-out and the Privacy Policy line change to "and in your own iPhone backup" | P0 (a) | `[NS-47-R6] the store is out of the backup` |
| NS-47-R7 | Given the claim step (E-S24) or a new phone, Then a claimed book re-keys the store unchanged and uploads nothing, and a new phone starts empty with the ask following its own rules | P0 (a) | `[NS-47-R7] claim and new phone move nothing` |
| NS-47-R8 | Given the log canary with synthetic tradition and day keys (for example `zz-test-tradition`, never a real tradition with Asha), When it runs through ask, tick, move, clear, schedule, deliver and tap, Then 0 hits in logs, breadcrumbs, error messages, URLs, route parameters, notification identifiers or `userInfo`, analytics properties, crash payloads and support links | P0 (a) | `[NS-47-R8] canary finds nothing` (J-N18 pattern) |
| NS-47-R9 | Given opt-in analytics (off through 1.0, D-124) or the k-anonymised insights, Then no event, property, bucket or aggregate carries a tradition, a country, a day id or a count of parents who ticked any, and the typed catalogue test rejects those names | P0 (a) | `[NS-47-R9] analytics allowlist rejects day data` |
| NS-47-R10 | Given a Save a copy file built with every key set, Then no file holds a key, day, tradition or country, and no phone-settings key leaks into it (the export reads phone settings for its consent block, `schema.ts:271`); C-S24 says in one line that the list is not in Save a copy | P1 | `[NS-47-R10] the export holds none of it` |
| NS-47-R11 | Given the module boundary, Then only the days module reads the store; the planner gets opaque slots (a date and a neutral body key); prompts, Home copy, emails, Find, analytics and support read none of it; an import-boundary test fails on a second reader | P0 (a)(b) | `[NS-47-R11] one reader` |
| NS-47-R12 | Given a library-day note of any layer with the day-name switch off (the default) or App lock on, Then its body is one neutral string, the same for every layer, naming no day, tradition, country or child; its category sets the hidden-preview placeholder; no notification, in any state, ever carries a tradition label; every identifier is opaque; the day-name switch is separate from `notifications.lockScreenNames`, default off and forced off while App lock is on | P0 (a) | `[NS-47-R12] one neutral body; the name only behind its switch` |
| NS-47-R13 | Given the lock-screen title, Then a seasonal or civic day (`publicTitleOk` true) may be its own name (N-3); a family, tradition, culture-led or national day uses the one neutral title unless the day-name switch is on and App lock is off (DL-10); a snapshot test enumerates every `days.*` key and its title and body in each state | P0 (a) | `[NS-47-R13] public days may name themselves; others need the switch` |
| NS-47-R14 | Given the day-name switch, Then it has its own help line ("Anyone who sees your lock screen can read it." intent) and the "Names in notifications" help line says it does not cover days; whether the second plain line "This can also show the name of a day your family keeps" is required is counsel's (Q-DAY-6) | P1 | `[NS-47-R14] the switch says what it shows` |
| NS-47-R15 | Given account A signs out (book kept, D1), Then the store and its scheduled notes are cleared at that moment, the `culture.asked` flag stays keyed to A, and B signing in reads nothing of A's store, is never told it existed and is asked afresh; the registry enumeration of `[X4-R1]` covers the store | P0 (a) | `[NS-47-R15] sign-out clears and B sees nothing` |
| NS-47-R16 | Given Erase everything, When it finishes, Then the store, the flag and every pending library-day note are gone, the FR-PRV-34 scan covers the store's file, and a kill mid-erase resumes and finishes | P0 (a) | `[NS-47-R16] erase scan finds nothing` |
| NS-47-R17 | Given Delete account, Then this phone clears the store at once and every other phone clears it when its session ends; C-S20 "What happens" gains one line ("We keep nothing about the days you chose; it was only ever on your phones", intent) and does not claim an offline phone has cleared yet | P1 (b) | `[NS-47-R17] delete account line and clear` |
| NS-47-R18 | Given first run (E-S01 to E-S08), Then no field, card, picker or line about tradition, faith or country appears and the FR-PRV-24 field-inventory test is unchanged and fails if one is added | P1 (b) | `[NS-47-R18] first run has no such field` |
| NS-47-R19 | Given a book with at least one kept letter, When the reminder ask has been answered or has reached its two-showing cap (NS-13-R31), and not in the sitting where the Keep gate or the reminder ask showed, Then Home may show the ask slip once on a later open; "Not now" ends it for Home; it never shows to an account with `culture.asked = done`, and never from a notification, an email or a banner; nothing is preselected | P1 | `[NS-47-R19] the ask comes once, later` |
| NS-47-R20 | Given the ask and the pickers, Then several traditions may be chosen; lists are alphabetical with equal visual weight, never by size; the only extra choices are "Another tradition" and "Not now"; there is no "Eastern" option; device locale, the storefront and the time zone never prefill either list; a country offers national days only and a tradition offers its days only; neither suggests the other | P1 | `[NS-47-R20] pickers do not rank, guess or cross-suggest` |
| NS-47-R21 | Given Days, Then every ticked day can be unticked in one tap and "Clear all" (one confirm, an F6 `explained` sheet) removes every tick and cancels every pending note at once | P0 (b) | `[NS-47-R21] untick and clear all` |
| NS-47-R22 | Given the call-out at the point of choice, Then every sentence has a claims-inventory row true of that build; "stays on this phone" holds only while R4 and R6 hold; "only used to suggest days" only while R11 holds; it never says the lock screen "never" shows the day (the name can show behind the switch) | P0 (a) | `[NS-47-R22] call-out claims are true` |
| NS-47-R23 | Given a store candidate, Then `privacy` re-runs the label against the binary: "not collected" holds for this data while R4 holds; a G11 check fails on any new host or analytics property that references the store; the Privacy Policy gains one plain sentence; Notes for Review gain a section (what it does, that it is optional, where to find it) | P0 (b) | `[NS-47-R23] label re-run for the days store` (release checklist) |
| NS-47-R24 | Given two parents on one book (NS-25), Then each phone holds its own store and nothing on the Family page, an invite sheet or any shared surface shows, counts or hints at the other parent's days | P1 | `[NS-47-R24] days are never shared` |
| NS-47-R25 | Given the ask slip, C-S25 and C-S24 at AX5 with Bold Text, VoiceOver, Voice Control and Switch Control, Then every control is reachable, the lists read flat with no grouping that ranks traditions, "Not now" has a visible label and the same touch size as the primary, and nothing truncates | P1 (b) | `[NS-47-R25] the ask and lists work with assistive settings` |
| NS-47-R26 | Given the Days page and the day slip, Then they show only to the person using the unlocked phone, the app-switcher snapshot of Home and Me is blank where they appear (errata E18), and Home names a day only when it is today and never lists upcoming days or a count | P1 | `[NS-47-R26] unlocked only; blank snapshot` |
| NS-47-R27 | Given research on this feature, Then the tester sheet asks only reaction questions ("fine, odd, or too personal"), never a tester's own faith or origin, records none, and a result where more than 1 tester in 5 says "too personal" moves the ask from Home to Me only | P2 | `[NS-47-R27] research asks reactions only` (research plan) |

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
- Fields: one registry row for the store (L4, device only, per account, excluded from backup, cleared at sign-out and Erase, not exported, never logged); `culture.asked` (L2, per account); `notifications.dayNames` (PROPOSED, L3 setting, default off, forced off with App lock).
- Migrations: none; a migration lint (FR-CUL-04, 05) guards the schema. Sync field group: none. Export: none, with a leak test (NS-47-R10).
- Modules: the days module and its single store (PROPOSED location outside `scribe.db`), `lib/reminders/prefs.ts` (the switch and its app-lock rule beside `lockScreenNames`), `lib/reminders/planner.ts` (opaque `libraryDay` slot, no day key in an identifier or `userInfo`), `erase-everything.ts` (store file added to its list), the sign-out path (BL-961 `[X4-R1]` enumeration), an import-boundary test, a migration lint (`data-architect`), the analytics allowlist negative test, `docs/privacy/DATA_CLASSIFICATION.md` section 4.5 (new device row; `privacy` owns).
- Flags and pause keys: as NS-46.
- Error codes: `days_store_unavailable` (PROPOSED).
- Rollout and rollback: ships with NS-46; rollback is the pause plus flag off; the store is removed by Erase.
- Backlog: new rows needed (no id invented): the days module and store; import-boundary and canary tests; migration lint; planner slot and switch; Home ask state and Me Days (NR-DAY-03 and NS-46's rows); J-CUL-01 device walk. BL-961 gains the store in its enumeration; BL-975 gains the "derived off-device" check.
- Built today: `settings` table is the phone's one settings store and is in the iPhone backup per `data-policy.md:144` (UNVERIFIED in code); `notifications.lockScreenNames` and its app-lock rule exist (`prefs.ts`).

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
- **Shown:** "Only on this phone. Used for one thing: suggesting days to mark. Change or clear any time." (the direction's own draft; CUL section 9 has a shorter draft "Stays on this phone. Only used to suggest days to mark. Change or clear any time in Me."; `content` decides) before the first tick; the day-name switch's help line.
- **Records:** nothing on our servers. On the phone, the days the parent ticks and the asked flag. No `record_policy_act` row, because nothing leaves the phone and an "answered a faith question" row would itself be the derived fact the label rules warn about.
- **Never:** a pre-ticked day; a second ask after "Not now"; a tradition or country on the child; a tradition or country in analytics, logs, crash reports, URLs, notifications, the Save a copy file, a backup, support mail or an email; an inference of one from the other or from the device; a "Prefer not to say" stored as a value.
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
Reuses C-S24, C-S25, C-S26 (NS-46) and adds: A-S01.daysAsk (one card in the slip slot; question, "Choose days", "Not now" at equal weight and size; no count or badge; gone after either answer); D-S06 gains the day-name switch under the names switch (disabled with a reason while App lock is on); D-S10 and D-S11 new states (NS-46); C-S03 gains one line ("Days you chose on this phone are cleared", intent); C-S20 gains the NS-47-R17 line; C-S04 unchanged (the one line lives on C-S24); E-S01 to E-S08 unchanged, with a design check that none gains a field; E-S27 screenshots use seasonal days only or a synthetic tradition, never a real tradition on Asha.

### 16. Content inputs
Intent drafts (CLAUDE.md content rules only; `content` and the founder decide): `culture.ask.question` ("Would you like a note on days that matter to your family?"); `culture.ask.choose` ("Choose days"); `culture.ask.notNow` ("Not now"); `culture.callout` (section 12); `culture.picker.tradition.header` ("A tradition your family keeps"); `culture.picker.country.header` ("A country that matters to your family"; never "native" or "foreign", never "where you live"); `culture.another` ("Another tradition"); `culture.notInSaveCopy` ("These days are not part of Save a copy."); `culture.signOut.line`; `culture.delete.line`; `days.lock.title.neutral` and `days.lock.body.neutral` (the same words as `ntc.occ.neutral.01`, "Something for the book today", by direction and CB-5; the hidden-preview placeholder stays G-D19's); `notifications.dayNames.switch` ("Show the day's name in the note") and its help line. No key says "your religion".

### 17. Legal, privacy and compliance inputs
Apple App Privacy Details (on-device is not "collected"; derived data sent off the device is considered separately), App Review 5.1.1(i) to (v), 5.1.2(ii) and (iii), 1.1.1 and 4.5.4; GDPR Article 9; California sensitive-data list (secondary source only). Counsel questions (need numbers from legal): CUL-Q5 (export), Q6 (device-only sensitive data), Q7 (label and Privacy Policy sentence), Q11 (4.5.4 and local notes). App Review's view of an optional faith or origin question found no source: UNVERIFIED. Counsel must confirm all of it.

### 18. Label effect
None while NS-47-R4 holds; the Sensitive Info row stays as it is for the due date; a G11 check guards it; the Privacy Policy gains one sentence; the Notes for Review gain a section (NS-47-R23). Not verified against the current label rules.

### 19. Claims enabled and forbidden
Enables: only the call-out sentences that have claims rows. Forbids: "we never show your faith" (the name can show behind the switch), "private by design" without a row, "we know your traditions", any statement that App Review or a law has approved the feature.

### 20. Free or Plus
Free (T2). Nothing here is gated.

### 21. Measures with analytics off
Tester sheet reactions only (NS-47-R27); "x of n"; stop rule: any parent who reads the ask as the app guessing at their beliefs ends the session (FR-RSH-21 pattern). No telemetry.

### 22. Dependencies and gates
NS-46; the registry and erase scan (FR-PRV-07, 34; NS-36); BL-961; errata E18; counsel CUL-Q5 to Q7 and Q11 on record or the fallback list; the device walk J-CUL-01; a label check at the G5 gate (compliance names it CG5, K7); founder word approval. NS-45 carries the sign-out and delete lines once written.

### 23. Open questions
- Q-FD-1, Q-FD-2, Q-FD-5, CUL-Q2, Q3, Q4, Q9, Q10: see "Founder items".
- Does the Home ask slip need counsel's read before any build? Owner: `legal`. Default: yes, with the fallback of no question.
- Whether the second plain line under the day-name switch is required (Q-DAY-6). Owner: `privacy`, counsel. Default: one switch, one plain line.
- Conflicts 1 and 2 above.

---
