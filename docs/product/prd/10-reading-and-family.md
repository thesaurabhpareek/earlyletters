# NS-21 to NS-31: Reading the book, and the people around the child

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: Karma with the CPO role | Replaces: none | Load when: building or testing reading, family and sharing (NS-21 to NS-31).

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: Karma with the Chief Product Officer role (one Claude session), revised 20 Nov 2026 against the three round-2 executive reviews and Karma's round-2 rulings (T1 to T5, D1 to D13). Docs only. Card shape: `README.md`. Sizes, skills and order: `13-engineering-plan.md`. Tests: `14-test-plan.md`. Timing lives in the roadmap and the engineering plan; no card here states a build number or a date (ruling T5).

Words in quotes that are not an existing content key are intent for `content`. PROPOSED marks a number or rule I propose. UNVERIFIED marks anything not read in code or a source this session. Legal readings: counsel must confirm. Nothing was run on a phone. Code facts were read on `develop` at `697233d35` on 20 Nov 2026, and open PRs through the GitHub REST API the same day.

Jobs served: "Leave my words and voice for my child's future" (rank 3), "Keep my child's memories private" (rank 4), "Let family see the baby grow" (rank 6), "Give me a finished book I can hold" (rank 7).

Photo with a letter, Find, Share one letter, the pilot, Firsts and sealed letters have their own cards (NS-01, NS-02, NS-05, NS-03, NS-06). This file covers what reading needs around them (NS-21 to NS-24), the other parent in the store app (NS-25), and the family and keepsake items that wait (NS-26 to NS-31).

**Rules every card here inherits** (stated once; each card points back):
- **Device evidence (ruling D13, X3).** Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, screen recording, log or trace carries a real name, letter, picture or voice.
- **Undo windows (ruling T4).** Every undo window stays open for its stated seconds, or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on.
- **Sign-out (ruling D1, X4).** Sign-out keeps the book on the phone. A second account never sees, claims or uploads the first account's local letters (test `[X4-R1]`).
- **Never (rulings D2, D3).** No letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (test `[X6-R1]`). System writing tools (rewrite, proofread) are off on every field whose text becomes a letter's words; `mobile` checks whether React Native exposes the switch, and if it cannot, that is a finding, not a silent pass.
- **Free or Plus (ruling T2).** Every capability that ships free in the 1.0.x line falls under principle 6 and never moves behind Plus. Plus holds one paid act: keeping letters beyond the allowance (D-082, D-103). Each card here raises the value of a kept letter. Public copy says nothing either way.
- **Hand-sent measures (ruling D5).** Analytics is off through the 1.0 line (D-124). Testers send numbers only; the founder keeps them in a private sheet, never in the repo or a Claude session, and deletes them 90 days after the round. Results are reported as "x of n", never as a percentage when n is under 20. Each round asks at most 5 questions with fixed wording, versioned in `docs/research/`.
- **Home slips, one fixed order (ruled 20 Nov, Karma, council round 2).** Home shows at most one slip, in this order: (1) the existing waiting cards, in their existing order; (2) the seal-opened line on its day (NS-06-B4); (3) Save a copy in the birthday week (NS-11); (4) one past letter (NS-23, replacing "A month ago"). The reminder ask sheet and the Plus line are not slips. The photo start is part of the capture cluster, never a slip. A registry test fails when an unregistered slip renders (`[FRAME-SLIP]`).
- **Traceability.** Test titles start with the row id in square brackets. `scripts/trace.mjs` does not yet match NS ids (finding F1; an open draft partly addresses it), so no card here claims trace coverage until that lands.
- **Counsel numbers** are from `COUNSEL_PACKET.md` 1.5.0 (old Q2 is Q48, Q29 is Q49, Q27 is Q50, Q1 is Q47, Q7 is Q54).

---

## NS-21. The letter page reads as one place (candidate N-03, rank 16)

**Label effect.** None. No new data is collected and nothing new leaves the phone.

### 1. Who and when
Every parent (P1, P2), every time they open a letter from the Book, Find, Home's past letter or a Firsts lens. The grandparent or {child} years later at the largest text size, or with VoiceOver, reading the same page.

### 2. Why
- The job: "Leave my words and voice for my child's future" (rank 3). The page is where a kept letter is read and looked after.
- What goes wrong today [F, read in code]: `apps/mobile/src/app/letter/[id].tsx` shows the words, then Play (`:413`), then a provenance footnote and a Private chip in their own block (`:430-455`), then, for the author only, one inset list of three rows: Make private or Add to book, Change the date, Delete (`:458-483`). The page has no heading (`accessibilityRole="header"` appears nowhere in the file). Six coming features each need a control here: a picture (NS-01, an open draft edits this file), a first and a seal (NS-06), Share (NS-05), earlier versions (NS-12), both days (NS-15).
- What goes wrong next [A]: if each feature adds its own control where there is room, the page becomes a settings screen around a letter, and a VoiceOver reader hears controls in a different order on every letter.

### 3. What, and Not in scope
**What.** Under the letter: Share as a button on its own; then one list titled for the letter (intent: "This letter"), whose rows are the facts and choices about it, in a fixed order; Delete last, apart from everything. A row is absent when it does not apply, never disabled.

Order of rows (fixed):
1. The day it is about, and the day it was said (NS-15; today the "Change the date" row).
2. A first (NS-06 Part A). This order supersedes NS-06 OQ-A2's "the letter's action row".
3. A picture (NS-01). The picture itself shows in the body of the letter, above the words; this row only adds, changes or removes it.
4. Sealed until (NS-06 Part B; author only, before the day).
5. Who can read it (today "Make private" or "Add to book"). Absent while the book has one adult and the letter is in the book. A private letter always shows the row, whatever the number of adults (ruled 20 Nov on the CPO finding: a private state must never become invisible).
6. Earlier versions (NS-12).
7. Where the recording is (the provenance line, NS-08). It moves from its own block into the list. A typed letter has no recording row; its provenance ("Typed") stays as a footnote under the words.

**Not in scope.** The behaviour behind each row (each is owned by its card). The words area, the reading size control, the "Exactly as said" view switch and the player stay as built. No new component. No "move to the other book" (that is NS-14b, if the CPO ranks it). No edit of the words beyond the existing words sheet for a letter that has none.

### 4. Happy path
1. The parent taps a letter card in the Book; the page opens in the card's text column (as built).
2. VoiceOver users land on the dateline, now a level 1 heading.
3. The parent reads; for a spoken letter whose recording is on this phone, Play sits after the words.
4. The parent scrolls; Share sits apart; then the list "This letter" with the rows that apply, in order; then Delete.
5. The parent taps one row; one sheet opens; one change; the sheet closes and the row states the new fact.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| A typed letter | No Play, no recording row; the footnote says it was typed |
| The other parent's letter | Rows show read-only facts (the day, a first, a picture, the recording line). No author-only control: no Who can read it, no Sealed until, no Earlier versions, no Delete |
| Nothing applies but the date | The list shows one row; it is still a list with its title |
| Words still being made (a voice-only letter, `transcriptStatus = 'waiting'`) | The existing waiting card shows; the list shows the day row and the recording row only |
| Words arrived but not yet kept from Review (`wordsUnreviewed`) | The existing Read it back card leads to Review (as built, `:417-428`); the list is unchanged |
| A letter held at the Keep gate | Not a letter yet: it is a waiting card on Home, never in the Book, so this page is never reached for it |
| The letter is deleted on another phone while open | The built not-found state, with Recently deleted when it is there (`:534-551`) |
| A private letter in a book with one adult | The Who can read it row shows "Only you" (intent) |
| The recording is not on this phone (new phone, backup off) | No Play; the recording row says where it is (NS-08 wording); never an error |
| The picture file is missing (sweep removed it) | The letter reads whole with no picture; the picture row offers to add one (NS-01 sweep rule) |
| A sealed letter | Only the author reaches it before the day (NS-06-B2); the Sealed until row shows |
| Delete tapped | The built confirm sheet, "Keep it" the default (D-085); then the Book, where "Letter deleted." waits with Undo by tap, never a timer (`:364-383`); the letter sits in Recently deleted for 30 days |
| The largest text size | One column; rows grow; nothing truncates; Share and Delete stay full width |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | The first kept letter opens to a list of one or two rows (day; recording) |
| Empty | n/a because the page exists only for a letter |
| Many (1,000 letters, 300 pictures) | The page reads one letter; open time holds R8 at the year-5 fixture; the picture uses the page copy (NS-37) |
| Offline | Every row works; a change syncs later through the outbox |
| Slow | No row waits on a network; a sheet opens within the 350 ms transition budget (06-nfr 2.1) |
| Failed | A failed local write keeps the old fact and says so in one line; nothing is half-changed |
| Interrupted (call, Siri, alarm, the baby) | Playback pauses with the audio session (as built); an open sheet stays open; nothing is saved until the parent confirms |
| App killed mid-flow | A sheet not confirmed changes nothing; a confirmed change is already committed |
| App updated mid-flow | n/a because the page holds no state across launches beyond the letter itself |
| Low storage (under 1 GB, under 50 MB) | Reading is unaffected; changes are a few bytes and still save |
| Low Power Mode and low battery | No loops on this page (as built); no change |
| Two books | The page belongs to the letter's book; nothing changes |
| Two parents | The other parent's letter shows read-only facts; Who can read it appears once there are two adults |
| Expecting parent (due date only) | The day row files a letter before the due date into Before You (NS-15) |
| Multilingual (Devanagari, RTL, CJK) | The words keep their own direction and font; the list follows the interface direction (English, left to right); dates come from `Intl.DateTimeFormat` |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | One column; every row at least 56 pt tall; no truncation (R5) |
| VoiceOver | Heading, words, Play, Share, list title, rows in order, Delete (R14) |
| Voice Control and Switch Control | Every row's visible label is its command; every control is reachable by item scanning (NS-33-R9, R10) |
| Reduce Motion | The card-to-page move becomes a 200 ms fade (as built) |
| Dark mode and Increase Contrast | Row text holds 4.5:1 in both (NS-33-R8) |
| Plan lapsed | Every row works; nothing here is behind Plus |
| Signed out | The page still opens every letter on the phone (ruling D1); changes stay local |
| Second account on the same phone | Never sees the first account's letters (`[X4-R1]`) |
| New phone | Words present after sync; the recording row says where the recording is (NS-10) |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-21-R1 | Given any letter, Then the rows that apply appear in the fixed order of section 3 | P1 | `[NS-21-R1] rows in the fixed order` |
| NS-21-R2 | Given a row that does not apply, Then it is absent, not disabled | P1 | `[NS-21-R2] absent, never greyed` |
| NS-21-R3a | Given the page, Then Share is a separate button above the list | P1 | `[NS-21-R3a] Share apart` |
| NS-21-R3b | Given the page, Then Delete is the last control on the page | P1 | `[NS-21-R3b] Delete last` |
| NS-21-R4 | Given VoiceOver, Then the dateline is a level 1 heading and the list title a level 2 heading | P0 (b: accessibility duty, LEGAL-REQ-051) | `[NS-21-R4] headings for the rotor` |
| NS-21-R5 | Given the largest text size with Bold Text on an iPhone SE 3, Then every row is at least 56 pt tall and no text is truncated (device) | P1 | `[NS-21-R5] rows at AX5 on SE 3` |
| NS-21-R6a | Given a typed letter, Then the page has no Play control | P1 | `[NS-21-R6a] no Play on a typed letter` |
| NS-21-R6b | Given a spoken letter whose recording is on this phone, Then Play sits after the words and before Share (as built, `letter/[id].tsx:413`) | P1 | `[NS-21-R6b] Play after the words` |
| NS-21-R7a | Given Delete, When tapped, Then a confirmation opens whose default is "Keep it" (D-085) | P1 | `[NS-21-R7a] delete asks first` |
| NS-21-R7b | Given the confirmation, When confirmed, Then the letter is in Recently deleted for 30 days and the Book offers Undo by tap (T4 applies) | P1 | `[NS-21-R7b] delete goes to Recently deleted` |
| NS-21-R8 | Given a Book card on an iPhone SE 3, When tapped, Then the page is interactive within p95 300 ms (PROPOSED; inside NS-34's 900 ms hand-off) | P1 | `[NS-21-R8] page open time` |
| NS-21-R9 | Given a private letter in a book with one adult, Then the Who can read it row shows | P0 (a: a private state stays visible) | `[NS-21-R9] private always shows its row` |
| NS-21-R10 | Given a letter whose words are still being made, Then the list shows only the day row and the recording row | P1 | `[NS-21-R10] waiting letter rows` |
| NS-21-R11 | Given the other parent's letter, Then no author-only control is present (Who can read it, Sealed until, Earlier versions, Delete) | P0 (a: only the author changes a letter) | `[NS-21-R11] no author controls on another's letter` |
| NS-21-R12 | Given the words sheet on this page, Then system writing tools are off on its text field (ruling D2; the native setting of ADR 0039, PROPOSED); until that setting is built the sheet is not shown in any `production` profile and a source test fails a `production` profile that shows it without the setting (CR-67 AX-1; E41) | P0 (a: the machine never adds words) | `[NS-21-R12] writing tools off on the words sheet`, default branch `[NS-21-R12b] the sheet stays off in production until the setting exists` |
| NS-21-R13 | Given this page, Then nothing on it is donated to Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (ruling D3; source scan `[X6-R1]`) | P0 (a: private) | `[NS-21-R13] no system donation from the letter page` |
| NS-21-R14 | Given VoiceOver, When the parent swipes from the top, Then the order is: dateline, words, Play (if any), Share, list title, rows in order, Delete | P1 | `[NS-21-R14] VoiceOver order` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Page interactive p95 300 ms from a Book card on SE 3 (R8, PROPOSED); a row's sheet opens within 350 ms (06-nfr 2.1) |
| Memory | No more than the page today plus one page copy of a picture (NS-37) |
| On-device storage | None new |
| Battery | Under the measurable step (06-nfr section 0) |
| Offline | Works fully; changes queue in the outbox |
| Accessibility | AX5 plus Bold Text; VoiceOver order R14; 44 pt targets, 56 pt rows |
| Localisation | Dates by `Intl.DateTimeFormat`; letter words keep their own direction; interface strings in `packages/content` |
| Privacy | The log canary (PRIV-R10) covers the page: no letter text, child name or picture path in any log |

### 9. State space (RR-5)
| Case | Expected | Test |
|---|---|---|
| Second phone, same account | A changed row (Who can read it, the day) reaches the other phone at its next pull, through the `in_book` and `occurred_on` field groups (`packages/api/src/server/sync.ts:94-102`) | existing sync tests |
| Second account on the same phone | Never sees the first account's letters | `[X4-R1]` |
| Offline | The change is applied locally and queued | existing outbox tests |
| Retry after a lost answer | The op is idempotent by entry id and group; applied once | existing sync tests |
| Sign out | The page still opens local letters (D1) | `[X4-R1]` |
| Account deletion | The letters leave with the account on the published clock (31, 38, 45 days, `data-policy.md:187`) | existing deletion tests |
| Kill switch (`serverFeaturesEnabled()` off) | Every row works locally; nothing syncs | `[NS-21-R1]` run with servers off |
| Remote pause | None for this card (layout only) | n/a |
| Plan lapse | Every row works | J-N25 |

### 10. Data and engineering
- **Fields.** None new. Used: `entries.in_book` (field group `in_book`), `occurred_on` and `occurred_precision` (field group `occurred_on`), `captured_at`, the recording fields read by `lib/provenance.ts`.
- **Migrations.** None. Export: no effect.
- **Modules and files.** `apps/mobile/src/app/letter/[id].tsx` (the list and its order), `components/ui/list-row`, content keys under `book.entryMenu` and one new list title. Order of work (finding from the CTO pass): BL-928, then #839 (picture on the letter page), then BL-937 (this card), because both edit `letter/[id].tsx`.
- **Flags.** None PROPOSED: a layout change ships whole; rollback is a revert of BL-937.
- **Error codes.** None new.

### 11. Data inventory
No new or newly used data.

### 12. Door lines
- **Who can read it** (once a second adult can join, NS-25): Shown: "Only you" and "In the book" (intent). Records: `entries.in_book`, existing. Never: tell the other parent that a letter became private. Decline: no change.
- **Delete:** Shown: the existing confirm title and body, "Keep it" the default. Records: the tombstone, on the phone and, when signed in, on the server; no PRIV-R21 row, because deleting a letter is not an agreement. Never: delete without the confirm. Decline: "Keep it" leaves the letter.
- **The day, a first, a picture:** Records: on the phone, synced as the letter's field where that card says so; no PRIV-R21 row, because this is a setting on a letter.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| A private letter | A mis-tap on Who can read it puts it in the book for the other parent | The row states the current state in words; the change is announced; the other parent is never told a letter became private | `[NS-21-R9]`, `[NS-21-R11]` |
| Letter words | System donation exposes them in Spotlight or Siri | No donation API used (D3) | `[NS-21-R13]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (ruling D3).
- System writing tools are off on the words sheet, the only field on this page whose text becomes a letter's words (ruling D2 applied to this page; it is the same rule as the Review editor).
- No control the author alone may use appears on another parent's letter.

### 15. Design inputs
- States to draw: own spoken letter (all rows); own typed letter; other parent's letter; waiting words; one row only; private in a one-adult book; sealed (author); recording elsewhere; picture missing; AX5 on SE 3; dark mode; Increase Contrast.
- Components reused: `ListSection`, `ListRow`, `Button`, `ConfirmSheet`, `DateSheet`. No new component.
- Layout at AX5 on SE 3: one column; Share full width; rows wrap their titles; Delete full width, last.
- Motion: none new. Dark mode first. Pictures ignore Smart Invert (NS-33-R11).

### 16. Content inputs
- One list title (intent: "This letter") and one label per row, written once for all features.
- Who can read it values (intent: "Only you", "In the book").
- Banned: "edit", "manage", "settings" for this list; no count of anything.
- `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
None new. Accessibility rows are a LEGAL-REQ-051 duty. Counsel: none.

### 18. Label effect
**Label effect.** None.

### 19. Claims
- Enables: nothing new in public.
- Forbids: "edit your letter", "rewrite", any line that implies the app changes words.

### 20. Free or Plus
Free (ruling T2). Nothing on this page is behind Plus.

### 21. Measures with analytics off
- Source: testers, by hand, numbers only (D5). Rule: x of n.
- Fixed question: "Could you find what you wanted to change about a letter on its page (yes / no)?"

### 22. Dependencies and gates
NS-33-R1 (heading), NS-01 (#839), NS-05, NS-06, NS-08, NS-12, NS-15 each add their row into this list when they ship. Device rows R5 under D13.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Spacing between Share and the list | design | The design language's section spacing |

---

## NS-22. The Book header stays calm (candidate N-04, rank 17)

**Label effect.** None.

### 1. Who and when
A parent opening the Book to read, often in the evening, sometimes at the largest text size, who meets the title, the age and then a stack of controls before the first letter.

### 2. Why
- The job: "Leave my words and voice for my child's future" (rank 3); the Book is for reading.
- Today [F, read in code]: the cover band (`app/(tabs)/book.tsx:356-368`, `CoverBand`) holds the title, the age, the child switcher (two books only), Read together, Months and the gear; the inline bar after scroll holds the title, Months and the gear (`:385-400`). The gear opens `/settings` (`:353`). Me is already Settings home as a tab (`app/(tabs)/you.tsx`, NX-30a; IA.md row Me), so the gear is a second door to the same place.
- Next [F]: Find and the lens choice both want the same inch.
- Quiet this book has no surface on `develop` [F]: `setChildQuiet` exists in `lib/store.ts:390` and no screen calls it, while F12-REQ-011 (P0) wants it within 2 taps of the book header. Hide this book lives in Me, then the book (`app/settings/children/[id].tsx:113-125`).

### 3. What, and Not in scope
**What.** One bar in a fixed order: title, age, child switcher (two books only), Read together, the lens choice, Find, Go to a month (today "Months"). The gear leaves the Book. One menu at the end of the bar holds Quiet this book (or Unquiet) and Hide this book, so both are within 2 taps of the Book (F12-REQ-011, F09-REQ-016). Book settings (name, dates, languages) stay in Me, then the book. Hide this book stays in Me as well.

**Not in scope.** No new destination. No change to what Quiet or Hide do (F12 owns them). No change to Read together, Find or the lens behaviour.

### 4. Happy path
1. The parent opens the Book.
2. The bar shows, in order, what applies; the first letter card's top edge is visible on an SE 3 at the default size.
3. The parent taps the end menu; it offers Quiet this book and Hide this book; one tap more acts.
4. The parent wants account or plan settings: Me, one tap from anywhere.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| An empty book | Title and age remain; Find, the lens choice, Read together and Go to a month are absent |
| One book | No switcher |
| The largest text size | Controls wrap to a second line in the same order; Go to a month may fold into the end menu |
| A quieted book | The bar is the same; the menu offers Unquiet |
| A hidden book opened from Hidden books | Read-only (F09-REQ-016); the menu offers Show this book again |
| A deep link to `/settings` | Still opens Settings (as built) |
| Find is open | The bar stays in place; Find's field replaces nothing above it (NS-02 owns the field) |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | Empty book: title and age only, the closed cover below (as built) |
| Empty | As first use |
| Many (1,000 letters, 300 pictures) | The bar is unchanged; NS-37 holds scrolling |
| Offline | Every control works on the phone |
| Slow | n/a because nothing in the bar waits on a network |
| Failed | A failed Quiet write keeps the old state and says so in one line |
| Interrupted | The menu closes with the app going inactive; nothing changes without a tap |
| App killed mid-flow | A menu not acted on changes nothing |
| App updated mid-flow | n/a because the bar holds no state |
| Low storage (under 1 GB, under 50 MB) | No effect |
| Low Power Mode and low battery | The header settle motion is skipped under Reduce Motion only (as built); no change |
| Two books | The switcher shows; the menu acts on the active book |
| Two parents | Quiet and Hide are per person (F12-REQ-011, B-REQ-014 Rev); the other parent sees no change |
| Expecting parent (due date only) | The age line reads Before You (as built) |
| Multilingual | The title holds a name in any script; the bar follows the interface direction |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | R2 and R5 |
| VoiceOver | Title heading, then controls in bar order, then the list |
| Voice Control and Switch Control | Every control has a visible label or a spoken name that works as a command; reachable by item scanning |
| Reduce Motion | The bar switches, no fade (as built) |
| Dark mode and Increase Contrast | The bar is solid under Increase Contrast and Reduce Transparency (as built, `BlurSurface`) |
| Plan lapsed | Every control works |
| Signed out | Every control works on the phone |
| Second account on the same phone | Sees only its own books |
| New phone | The bar is the same once the book arrives |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-22-R1 | Given the Book at the default text size on an iPhone SE 3, Then the first letter card's top edge is visible without scrolling (device) | P1 | `[NS-22-R1] first letter above the fold` |
| NS-22-R2 | Given the largest text size, Then every header control is 44 pt or more and stays in the fixed order | P0 (b: accessibility duty) | `[NS-22-R2] header controls at AX5` |
| NS-22-R3 | Given the Book, Then it has no gear, and Quiet this book and Hide this book are each reachable in 2 taps from the Book | P0 (b: F12-REQ-011 is P0) | `[NS-22-R3] quiet and hide in 2 taps` |
| NS-22-R4 | Given a book with no letters, Then Find, the lens choice, Read together and Go to a month are absent, not disabled | P1 | `[NS-22-R4] empty book header` |
| NS-22-R5 | Given AX5 with Bold Text on an SE 3, Then the first letter card's top edge is within one screen height of scroll (PROPOSED; device) | P1 | `[NS-22-R5] first letter near at AX5` |
| NS-22-R6 | Given the gear has left the Book, Then Settings is one tap away through Me, and a deep link to `/settings` still opens it | P1 | `[NS-22-R6] settings still reachable` |
| NS-22-R7 | Given a quieted book, When the end menu opens, Then it offers Unquiet and no other wording changes | P1 | `[NS-22-R7] unquiet offered` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | The end menu opens within 350 ms (06-nfr 2.1); Book first render with 1,200 letters p95 500 ms (06-nfr 2.3), unchanged |
| Memory | No change |
| On-device storage | None |
| Battery | No change |
| Offline | Works fully |
| Accessibility | AX5 plus Bold Text; header heading first; 44 pt targets |
| Localisation | Wrap order holds in any interface language; names in any script |
| Privacy | Log canary: no child name in any log from the menu |

### 9. State space (RR-5)
Quiet and Hide are per person and stored on the phone today (`children.quiet`, v7; `hideChild`). Second phone: the choice is this phone's until F12's per-person server column ships, then it follows the account. Second account on the same phone: its own books only. Offline, retry, kill switch, remote pause: n/a because nothing here syncs today. Sign out and account deletion: the setting goes with the book's local data. Plan lapse: no effect.

### 10. Data and engineering
- **Fields.** None new. Used: `Child.quiet` (`lib/db/repos/types.ts:95`), the hidden flag (`children.hide`).
- **Modules and files.** `app/(tabs)/book.tsx` (`CoverBand` and the inline bar), `components/book/*` for the end menu, `lib/store.ts` `setChildQuiet`, `hideChild`.
- **Order.** After Find (#798) and the lens (#840) land, so the bar is designed once with them in place (CTO pass: NS-22 depends on #798 and #840).
- **Flags.** None; rollback is a revert.

### 11. Data inventory
No new data. `Child.quiet` is an existing setting (L2, phone only).

### 12. Door lines
Records: on the phone only; no PRIV-R21 row, because Quiet and Hide are settings.

### 13. Threats
n/a because no trust boundary is crossed.

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No text field on this card (ruling D2 does not apply).

### 15. Design inputs
States: empty book (title and age only); one book; two books; a quieted book (Unquiet); a hidden book from Hidden books; AX5 wrap order on SE 3; dark mode; Increase Contrast. Components reused: the existing bar, `Button`, `IconButton`, the system menu. No new component. Go to a month may fold into the end menu at the largest sizes; design decides.

### 16. Content inputs
The end menu's label (intent: "More for this book") and its items, using the existing `children.quiet.*` and `children.settings.hideLabel` keys. Banned: loss words (F12 section on hard days).

### 17. Legal, privacy and compliance inputs
None. Quiet this book is the parent's own tool on a hard day (F12 D2); no copy names a loss.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables nothing in public. Forbids nothing new.

### 20. Free or Plus
Free (ruling T2).

### 21. Measures with analytics off
Testers, by hand (D5): "Did you find Quiet this book when you wanted it (yes / no / did not look)?" x of n.

### 22. Dependencies and gates
NS-02 (#798), NS-01 lens (#840), F12-REQ-011. Device rows under D13.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Does Go to a month fold into the end menu at AX5 | design | Folds at AX3 and above |

---

## NS-23. One past letter on Home (candidate C-20, rank 21)

**Label effect.** None.

Ruled 20 Nov (Karma, council round 2): this card changes the built `resurfaced` card ("A month ago", 28 to 35 days) to "the same day of an earlier month or year", as one Home card rule, reconciled with the open draft for the same card.

### 1. Who and when
P1 opening Home to speak tonight, finding a letter they said a year ago today, or on this day last month. Sometimes P2, whose in-book letters can come back too.

### 2. Why
- The job: "Leave my words and voice for my child's future" (rank 3). Rereading turns a habit of speaking into a reason to keep going [A: no evidence from our families yet].
- Today [F, read in code]: `resurfaced()` in `apps/mobile/src/components/tonight/draft-card.logic.ts:177-206` shows, only when no draft is waiting, the newest in-book letter with words dated 28 to 35 days ago, never a private letter, never a quiet-day mark, never a month-only date; `index.tsx:200` and `:319-326` render it under the prompt, after any draft cards. Its kicker is `tonight.resurfaced.kicker` "A month ago" (`packages/content/src/strings.en.ts:277-280`).
- Open draft (+678, "From the book", NX-36 S13) [F, read 20 Nov]: moves the rule to `from-the-book.logic.ts`, keeps the 28 to 35 day window first, and otherwise rotates through every eligible letter by the day count; adds a hard-day prompt exclusion (`hard.*`), excludes today's letters, a grapheme-safe excerpt and capped VoiceOver labels, and a day-zero card for an empty book.
- What goes wrong [A]: a window that slides daily makes "a year ago today", the moment parents talk about, impossible; a daily rotation through the whole book reads as the app choosing for the parent. One rule by date, stated plainly, is easier to trust.

### 3. What, and Not in scope
**What.** At most one past letter at a time on Home, as slip 4 in the fixed order (rules block above). It is a letter whose about-day falls on today's day of the month in an earlier month, or on today's day and month in an earlier year. It appears only when no higher slip is due. Tapping it opens the letter. The card shows the letter's own date and an opening fragment; it never says how long ago in numbers beyond the date and never says "you have not written since". A switch in Me turns past letters off.

Choice rule (PROPOSED, R12): first, the same day and month in an earlier year, the most recent such year; otherwise, the same day in an earlier month, the most recent. Ties: later `captured_at`, then id. The same letter shows all day and moves on at local midnight.

Reconciliation with the open draft (R16): its eligibility (kept letter, in the book, has words, not a quiet-day mark, not month-only, not dated today, not from a `hard.*` prompt), its verbatim grapheme-safe excerpt and its capped VoiceOver label are kept. Its 28 to 35 day window and its daily rotation through the book are replaced by this card's date rule. Its day-zero card is not a past letter and is not one of the four registered slips; it does not ship under this card (open question 1).

**Not in scope.** Notifications (nothing reaches a notification). A widget (C-30, parked). Any ranking by a score, model, "most loved" or play count. Private letters, even the author's own (as built).

### 4. Happy path
1. The parent opens Home in the evening; no draft is waiting; no seal opens today; it is not the birthday week.
2. Under the prompt and the "Another thought" control, one quiet card shows the letter's date and its first words.
3. The parent taps the card; the letter opens; Back returns to Home.
4. The parent speaks tonight's letter from the capture cluster as usual.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| No letter on a matching day | Nothing; no placeholder |
| Several matches | One card only, by the choice rule |
| A private letter (any author) | Never shown (as built) |
| The other parent's in-book letter | Eligible |
| A sealed letter | Never shown before its day |
| A letter in Recently deleted | Never chosen; eligible again once restored |
| A month-only letter (`occurred_precision = month`) | Never chosen (as built; its day is not one the parent gave) |
| A letter started from a hard-day prompt (`hard.*`) | Never chosen (from the open draft) |
| A letter dated today | Never chosen; it is in the Book |
| The parent dismisses it | Gone until tomorrow (local midnight) |
| A hard day the app cannot know about | The switch in Me turns past letters off in one tap; Quiet this book stops it for that book |
| A quieted or hidden book | No past letter from it, ever |
| Today is the 30th; the letter was on the 31st of a month with 31 days | Matches only on a month whose last day is earlier (R9) |
| Today is 28 Feb in a non-leap year; the letter was on 29 Feb | Matches (R9) |
| The letter's words arrive later (voice-only letter) | Not eligible until it has words and they are kept |
| App lock on | The switcher snapshot shows no fragment (R11) |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | No past letter exists; nothing shows (the day-zero card is out of this card) |
| Empty | Nothing shows |
| Many (1,000 letters, 300 pictures) | The pick runs in under 5 ms on the year-5 fixture (06-nfr prompt-selection class); no picture on the card |
| Offline | Works; all local |
| Slow | n/a because nothing waits on a network |
| Failed | A pick that throws shows nothing; Home is unaffected |
| Interrupted | The card is static; nothing to resume |
| App killed mid-flow | The same letter shows on relaunch the same day |
| App updated mid-flow | The same rule; the dismissal for today is kept (settings key survives an update) |
| Low storage (under 1 GB, under 50 MB) | Unaffected; the card reads existing rows |
| Low Power Mode and low battery | No motion beyond the existing enter (none under Reduce Motion) |
| Two books | Only the active book's letters |
| Two parents | The other parent's in-book letters are eligible; private ones never |
| Expecting parent (due date only) | Letters written before the birth are eligible by their about-day like any other |
| Multilingual (Devanagari, RTL, CJK) | The fragment is a verbatim prefix in the letter's own direction and font, cut by grapheme and never on a joiner or virama (R2) |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | The capture actions ride inline under the prompt at accessibility sizes, before the cards (as built, `index.tsx:304-305`), so the card never pushes Speak away; fragment lines per R10 |
| VoiceOver | One element: the date, then the fragment, in the letter's language (R7) |
| Voice Control and Switch Control | The card's visible date is its command; the dismiss control is reachable by item scanning |
| Reduce Motion | No enter animation |
| Dark mode and Increase Contrast | Holds 4.5:1; the accent rule stays a shape, not the only signal |
| Plan lapsed | Shown; reading is free |
| Signed out | Shown from local letters (D1) |
| Second account on the same phone | Only that account's books (`[X4-R1]`) |
| New phone | Eligible once letters arrive by sync; no catch-up |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-23-R1a | Given a letter whose about-day matches today's day in an earlier month or year, and no higher slip is due, Then Home shows a card for exactly one such letter, chosen by R12 | P1 | `[NS-23-R1a] one past letter on a matching day` |
| NS-23-R1b | Given several matches, Then still only one card is shown | P1 | `[NS-23-R1b] one card only` |
| NS-23-R2 | Given the card, Then it carries the letter's date and an opening fragment that is a verbatim prefix of `final_text`, cut at a word boundary where the language has spaces and by grapheme otherwise, never ending on a joiner or virama, and no count | P1 | `[NS-23-R2] verbatim fragment, no count` |
| NS-23-R3 | Given a tap, Then the letter opens; Back returns to Home | P1 | `[NS-23-R3] opens the letter` |
| NS-23-R4 | Given the switch in Me is off, Then no past letter appears on Home | P1 | `[NS-23-R4] switch off hides it` |
| NS-23-R5 | Given a sealed, hidden, private or recently deleted letter, Then it is never chosen | P0 (a: private and sealed letters stay so) | `[NS-23-R5] never a private or sealed letter` |
| NS-23-R6 | Given a higher slip is due (a waiting card, the seal-opened line, Save a copy), Then the past letter does not show | P1 | `[NS-23-R6] slip order` |
| NS-23-R7 | Given VoiceOver, Then the card is one element read as the date then the fragment, with the fragment in the letter's language | P1 | `[NS-23-R7] one element for VoiceOver` |
| NS-23-R8 | Given a quieted or hidden book, Then no letter from it is chosen | P0 (a: a parent's hard-day tool holds) | `[NS-23-R8] quiet book never resurfaces` |
| NS-23-R9a | Given a letter on day 29, 30 or 31, When today is the last day of a shorter month, Then it matches | P1 | `[NS-23-R9a] month-end match` |
| NS-23-R9b | Given a letter on 29 Feb, When today is 28 Feb in a non-leap year, Then it matches | P1 | `[NS-23-R9b] leap day match` |
| NS-23-R9c | Given a letter in the current month, Then it never matches | P1 | `[NS-23-R9c] current month never matches` |
| NS-23-R10 | Given the default text size, Then the fragment is at most 2 lines (as built, `EXCERPT.lines`); at accessibility sizes at most 4 lines (PROPOSED; design confirms against #721's 2) | P1 | `[NS-23-R10] fragment length` |
| NS-23-R11 | Given App lock on, When the app goes to the background, Then the app-switcher snapshot of Home shows no letter fragment | P0 (a: private) | `[NS-23-R11] snapshot hides the fragment` |
| NS-23-R12 | Given matches in an earlier year and in an earlier month, Then the most recent earlier year wins; with no year match, the most recent earlier month wins; ties by later `captured_at`, then id (PROPOSED) | P1 | `[NS-23-R12] choice rule` |
| NS-23-R13 | Given the same local day, Then every open and cold start shows the same letter; at local midnight the choice is made again | P1 | `[NS-23-R13] stable all day` |
| NS-23-R14 | Given a dismissal, Then no past letter shows again until the next local day | P1 | `[NS-23-R14] dismiss until tomorrow` |
| NS-23-R15 | Given a letter started from a `hard.*` prompt, or dated today, or with no words, Then it is never chosen | P0 (a: no surprise on a hard day) | `[NS-23-R15] never a hard-day letter` |
| NS-23-R16 | Given the code after this card, Then one pure function chooses the Home letter, and no other rule (28 to 35 day window, daily rotation) renders a letter on Home | P1 | `[NS-23-R16] one Home letter rule` |
| NS-23-R17 | Given the card and its words, Then nothing is donated to the system (ruling D3) | P0 (a: private) | `[NS-23-R17] no donation from Home` |
| NS-23-R18 | Given a slip type not in the registry, When Home renders it, Then the test fails (`[FRAME-SLIP]`) | P1 | `[NS-23-R18] slip registry` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | The pick under 5 ms on the year-5 fixture (PROPOSED; same class as prompt selection, 06-nfr 2.3); Home's first frame is not delayed |
| Memory | No more than the excerpt string |
| On-device storage | Two settings keys, a few bytes |
| Battery | Under the measurable step |
| Offline | Works fully |
| Accessibility | One element; AX5 plus Bold Text; 44 pt for the dismiss control |
| Localisation | Date by `Intl.DateTimeFormat`; fragment in the letter's language and direction; `Intl.Segmenter` on Hermes is UNVERIFIED, so the built grapheme-prefix rule is the floor |
| Privacy | Log canary: no fragment, letter id or child name in any log; no analytics event (as the open draft states) |

### 9. State space (RR-5)
| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Each phone picks from its own local letters; the same rule gives the same letter when both hold the same book | `[NS-23-R13]` |
| Second account on the same phone | Only that account's books | `[X4-R1]` |
| Offline | Works | `[NS-23-R1a]` |
| Retry after a lost answer | n/a because nothing is sent | n/a |
| Sign out | Shown from local letters (D1) | `[X4-R1]` |
| Account deletion | Letters gone, nothing to choose | existing |
| Kill switch (`serverFeaturesEnabled()` off) | Works the same (local) | `[NS-23-R1a]` with servers off |
| Remote pause | None; rollback is the flag | n/a |
| Plan lapse | Shown | J-N25 |

### 10. Data and engineering
- **Fields.** None new on letters. Used: `id`, `kind`, `inBook`, `occurredOn`, `occurredPrecision`, `capturedAt`, `finalText`, `promptKey`, `transcriptStatus` (`lib/db/repos/types.ts:20-72`); `Child.quiet`.
- **Settings keys (new, phone only).** `home.pastLetters` (boolean, default on, PROPOSED) and `home.pastLetter.dismissedOn` (`YYYY-MM-DD`). Cleared by Erase everything; kept at sign-out with the book (D1).
- **Modules.** Replace `resurfaced()` in `components/tonight/draft-card.logic.ts` with one pure picker (on #721's `from-the-book.logic.ts` if it merges first; the date rule replaces its window and rotation); `components/tonight/resurfaced-card.tsx`; `app/(tabs)/index.tsx`; the Me switch in `app/settings/index.tsx`; a slip registry module used by `[FRAME-SLIP]`.
- **Flags.** `EXPO_PUBLIC_PAST_LETTER` (PROPOSED). Off: the built "A month ago" card stays as today. Remote pause: none.
- **Error codes.** None.
- **Rollout and rollback.** Flag on in preview and testflight first; production after the device rows. Rollback: flag off restores the built card.

### 11. Data inventory
| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `home.pastLetters` switch | L2 | phone settings | no | until changed or Erase everything | Erase everything; app deletion | no (a setting; CPrivO confirms) | never logged |
| `home.pastLetter.dismissedOn` | L2 | phone settings | no | overwritten daily | as above | no | never logged |

### 12. Door lines
Records: on the phone only; no PRIV-R21 row, because this is a setting.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| Letter words on Home | Someone glances at an unlocked phone or the app switcher | App lock covers the snapshot (built, `lib/app-lock/machine.ts:13`); private letters never shown; the switch in Me | `[NS-23-R11]`, `[NS-23-R5]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No words on a notification or the lock screen from this card.
- No count of letters, days or gaps; no "since" line.
- No text field on this card (ruling D2 does not apply).

### 15. Design inputs
States: card present; card absent; dismissed; switch off in Me; AX5 on SE 3 with inline actions; dark mode; Increase Contrast. Components reused: `ResurfacedCard` shape (`Card`, `ExcerptFade`, the letter rule). The card never sits between the prompt and the capture controls at default sizes (the actions are pinned below the scroll, as built). The verb is not "Read it"; the card itself is the tap. The dismiss control: a small quiet text button (PROPOSED; design places it), because every gesture needs a button.

### 16. Content inputs
- The kicker is the letter's own date (the date already in the card), not "A month ago" or "A year ago" (no number of time beyond the date).
- The Me switch label (intent: "Past letters on Home") and its one-line footer (intent: "One letter you made on this day, now and then").
- The dismiss label (intent: "Not today").
- Banned: "memories", "on this day" if the glossary does not carry it, any count, "since", "missed".
- `content` writes; the founder approves. The open draft's five strings already need founder approval (NX-36 section 6).

### 17. Legal, privacy and compliance inputs
Words of a letter on Home are already on screen in the app; nothing reaches a notification. Counsel: none.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables nothing new in public. Forbids "memories that come back to you", "we pick your best letters", any line that implies a machine chooses by meaning.

### 20. Free or Plus
Free (ruling T2).

### 21. Measures with analytics off
Testers, by hand (D5): "Did a past letter on Home make you read it (yes / no / did not see one)?" and "Did a past letter ever come at a bad moment (yes / no)?" Guardrail target for the second: 0. x of n.

### 22. Dependencies and gates
The slip registry and `[FRAME-SLIP]`; #721 (reconcile or supersede); NS-06-B4 (seal-opened line) and NS-11 (Save a copy) rank above it; device rows under D13.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| 1. The day-zero card in #721 is not one of the four registered slips. Does it ship? | CPO with design | It leaves #721 and waits for a PR that adds it to the registry and lists every changed id |
| 2. Default of the Me switch | founder (r1 recommended on) | On, with Quiet this book as the hard-day path |
| 3. Fragment lines at accessibility sizes: 4 (r1) or 2 (#721) | design | 4 |

---

## NS-24. Read the year back (candidate C-25, rank 26)

**Label effect.** None.

### 1. Who and when
Both parents on {child}'s birthday evening, phone between them, reading the year aloud. Also any evening a parent wants one year of the book, not the whole of it.

### 2. Why
- The jobs: "Leave my words and voice for my child's future" (rank 3); "Give me a finished book I can hold" (rank 7) in its on-screen form.
- Today [F, read in code]: Read together (`app/read-together.tsx`) reads every in-book letter with words of one book, oldest first, one page at a time, free with no limit (header comment citing D-082, D-083). There is no way to read one year.
- [A] The birthday is the other reading moment: the adults, together, once a year.

### 3. What, and Not in scope
**What.** For one year of {child}'s life, Read together over that year's letters, oldest first, with the existing page turn. A year runs from a birthday to the day before the next; Before You is its own year. A letter's year comes from its about-day (`occurred_on`). The year choice is offered where the Book already lists months (the Months sheet, "Go to a month"), as one row per year of life that has letters (PROPOSED; design decides; NS-22 adds nothing to the header).

**Not in scope.** No summary, no highlights, no count of letters, no "year in review". No new notification on the birthday. No new letters selection rule beyond the year range.

### 4. Happy path
1. On the birthday evening a parent opens the Book and taps Go to a month.
2. The sheet lists the years that have letters; the parent taps the year just ended.
3. Read together opens at that year's first letter; they turn pages together.
4. The last page is the last letter of the year; then the existing end of the book; then the Book.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| A year with no letters | Not offered |
| Due-date-only child | Only Before You is offered |
| Two books | The year is of the active book |
| Private letters (any author), sealed letters before their day, waiting letters | Skipped (Read together reads in-book letters with words, `readableInBook`, `components/book/quiet-day.logic.ts:53-55`) |
| The other parent's in-book letters | Included, signed with their name |
| A letter whose recording is not on this phone | Its words show; Play is absent |
| A call arrives mid-page | Playback pauses with the audio session; on return the same page shows |
| Back mid-year | Returns to the Book; starting again opens at the year's first letter |
| A 29 Feb birthday | The year boundary follows `packages/core` age math (`ageOn`) |
| The birth date is corrected later | Letters re-file by about-day; the years recompute |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | Before You or year one only, as letters exist |
| Empty | Not offered |
| Many (1,000 letters, 300 pictures) | Start to first page within Read together's budget (06-nfr 2.2, start to first audio p95 500 ms) on the year-5 fixture |
| Offline | Works |
| Slow | n/a because nothing waits on a network |
| Failed | A letter that cannot render is skipped with no message; the rest reads |
| Interrupted | Audio pauses; same page on return |
| App killed mid-flow | Relaunch opens Home; reading starts again from the year's first letter |
| App updated mid-flow | As killed |
| Low storage (under 1 GB, under 50 MB) | Unaffected |
| Low Power Mode and low battery | The page turn becomes a fade under Reduce Motion; no loops |
| Two books | Active book only |
| Two parents | Both parents' in-book letters, each signed |
| Expecting parent (due date only) | Before You only |
| Multilingual | Each page keeps the letter's own script and direction |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | Read together's Large print scales; controls stay reachable |
| VoiceOver | Each page reads the dateline then the words; the position line is "Letter n of m" (as built) |
| Voice Control and Switch Control | Next and Back are visible labels; reachable by item scanning |
| Reduce Motion | The page turn becomes a 200 ms fade (06-nfr section 8) |
| Dark mode and Increase Contrast | Dark is the bedtime default (as built); 4.5:1 |
| Plan lapsed | Works (J-N25) |
| Signed out | Works on the phone's letters |
| Second account on the same phone | Only its own books |
| New phone | Words present after sync; Play absent where the recording is elsewhere |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-24-R1 | Given a year with letters, Then Read together can start at its first letter and ends at its last | P1 | `[NS-24-R1] reads one year` |
| NS-24-R2 | Given the year view, Then no page contains text the parents did not say or type, except datelines and the app's own control labels | P0 (a: only the parents' words) | `[NS-24-R2] only their words` |
| NS-24-R3 | Given private letters (any author), sealed letters before their day, or hidden letters, Then they are skipped | P0 (a: private) | `[NS-24-R3] skips private and sealed` |
| NS-24-R4 | Given a year with no letters, Then it is not offered | P1 | `[NS-24-R4] empty year absent` |
| NS-24-R5 | Given a birth date, Then a year is birthday to the day before the next birthday, and Before You is its own year | P1 | `[NS-24-R5] year boundaries` |
| NS-24-R6 | Given a due-date-only child, Then only Before You is offered | P1 | `[NS-24-R6] expecting: Before You only` |
| NS-24-R7 | Given a letter, Then its year is decided by `occurred_on`, never `captured_at` | P1 | `[NS-24-R7] year by about-day` |
| NS-24-R8 | Given a call mid-page, When the parent returns, Then the same page shows and playback is paused | P1 | `[NS-24-R8] interruption keeps the page` |
| NS-24-R9 | Given Read the year is open and a recording plays, Then the screen stays awake, and is released 5 minutes after pause (F10-REQ-012; NEEDS EVIDENCE: no keep-awake call found in `read-together.tsx` on 20 Nov) | P1 | `[NS-24-R9] screen awake while reading` |
| NS-24-R10 | Given a lapsed plan, Then a year reads in full | P0 (a: reading is free, Terms 8.2) | `[NS-24-R10] reads with a lapsed plan` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Year chosen to first page p95 500 ms on SE 3 (06-nfr 2.2 class, PROPOSED for this entry); page turn under 300 ms p95 |
| Memory | Read together's today plus nothing |
| On-device storage | None |
| Battery | As Read together |
| Offline | Works |
| Accessibility | AX5 plus Bold Text; VoiceOver as built |
| Localisation | Year labels from `Intl.DateTimeFormat` and the age strings in `packages/content`; CLDR plurals |
| Privacy | Log canary: no words or child name; the existing analytics hook stays off (D-124) |

### 9. State space
n/a because the card reads local letters only and touches no sync, account or notification.

### 10. Data and engineering
- **Fields.** None new. Used: `occurred_on`, `Child.birthday`, `Child.dueDate`, `readableInBook`.
- **Modules.** `app/read-together.tsx` gains an optional year range param; the Months sheet in `components/book/*` gains year rows; `packages/core` age math for boundaries.
- **Flags.** `EXPO_PUBLIC_READ_THE_YEAR` (PROPOSED); rollback hides the year rows.

### 11. Data inventory
No new data.

### 12. Door lines
n/a because nothing is agreed, shared or deleted.

### 13. Threats
n/a because no trust boundary is crossed.

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No summary, highlight, "best of" or count.
- No text field on this card (ruling D2 does not apply).

### 15. Design inputs
States: the Months sheet with year rows; a year in progress; the end of a year; due-date-only; AX5; dark mode. Reused: Read together, `PageTurn`, the Months sheet. Motion: the existing page turn; a fade under Reduce Motion.

### 16. Content inputs
Year row label (intent: "{child}'s first year", "Before You"). Banned: "year in review", "highlights", "recap", any count.

### 17. Legal, privacy and compliance inputs
Ruled 20 Nov (Karma, T1): internally, Read together has no session limit and no Plus gate. Publicly, copy may say "Read together is free" only as the current listing does; no "forever", no "never limited". Terms 8.4 lists Read together among what is free today, not in the permanent list (counsel Q40; counsel must confirm).

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables: "Read a year of letters together" (with a claims row). Forbids: "your year in review", "highlights", any count, "free forever", "never limited".

### 20. Free or Plus
Free (ruling T2; T1).

### 21. Measures with analytics off
Testers, by hand (D5), asked only in birthday weeks: "Did you read a year back (yes / no)?" x of n.

### 22. Dependencies and gates
NS-15 (about-day control), NS-22 (header unchanged), Q40 for any public line.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Where the year choice lives | design | The Months sheet |

---

## NS-25. The other parent, in the store app (candidate C-21, rank 28)

**Label effect.** Changes when it ships: a second adult's account data and their letters become shared within the book; CPrivO and counsel read the App Privacy answers against the release build (Q54) before the store build that turns it on. None until then.

### 1. Who and when
P2, who has heard about the book from P1 and wants to add letters in their own voice, on their own phone and their own rhythm. P1, who sends the invite from Me.

### 2. Why
- The job: "Let family see the baby grow" (rank 6); "Leave my words and voice for my child's future" (rank 3) for the second parent.
- Today [F, read in code and record]: co-parent invites, peek, accept and a 72-hour undo are built on the server (`supabase/migrations/20261015010000_v1_gate_peek_invite_consent_pepper.sql:141-200`, `20261015020000_v1_gate_coparent_invites_undo.sql:397-456`); a co-parent surface shows only when server features are on and the build is an alpha (D-162 as drafted, not merged on 20 Nov). Nothing about co-parent shows in any store build, and nothing says "coming soon" in any build (D-161 draft; founder answer of 19 Nov).
- What goes wrong today [F]: BRAND.md line 40 says "At v1.0 the book is shared with your co-parent", which is false for store builds; the Terms (3.3 and 4) allow removal only by the inviter within 72 hours, while this card's draft said "the second adult can be removed by the first" (conflict, counsel Q53).
- [S] "Both parents in one book" is a gap other products leave open (`FEATURE-GAP-AND-WEDGE-10nov.md`, competitor facts UNVERIFIED).

### 3. What, and Not in scope
**What, when the gates in section 22 clear.** P1 invites from Me. P2 opens the link, installs, signs in, sees only the inviter's sign-off and role, agrees, and sees the book. Each signs their own letters. Two parents per book, at most. The inviter may undo the join within 72 hours; after that, neither removes the other (Terms 3.3 and 4; ruling D11 until counsel answers Q53). Each parent's private letters stay theirs. Each parent's free allowance counts only their own kept letters (D-103).

**Not in scope.** Grandparents or close family (contributors; NS-28, v1.1). Push notifications (NS-26). Per-letter audience (NS-27). Android (C-39). A Leave control (D-113 hides it until left books are listed). Any change to removal rules before Q53.

### 4. Happy path
1. P1 opens Me and taps the invite row; a sheet says, before sending, that P2 will be able to read every letter in the book that is not private, including the ones already there.
2. P1 sends the link through their own messages.
3. P2 opens the link; the page shows no child name and no letter (D-111 item 8); it points to the App Store (iPhone only for now).
4. P2 installs, signs in, and sees "{inviter} invited you to their book" with the role only (`peek_invite` returns inviter and role).
5. P2 reads the agreement and accepts; a PRIV-R21 row is recorded; the book arrives.
6. P2 speaks a letter; it is signed with P2's name; P1 sees it at the next sync unless P2 kept it private.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| The link is opened on an Android phone or a computer | The page says the app is iPhone only for now and offers nothing that needs an account |
| The invite has expired (7 days for a parent invite) | "This invite has expired" (intent); P1 can send a new one |
| The invite was revoked or already used | `SCINV`; one plain line |
| P2 already belongs to this book | "already a member" (`SCINV`); the book opens |
| P2 already has their own book | They keep it; the joined book is a second book (NS-14 switcher) |
| A third adult opens an invite | Refused with a plain line (`SCCAP`, `max_parents_per_book()`) |
| P1 undoes the join within 72 hours | P2 stops receiving the book at the next sync; P2's letters leave the book (set private, never deleted) and stay P2's to read, export and delete (`undo_parent_join`) |
| P1 tries to remove P2 after 72 hours | Not offered; only the support runbook (`SCPAR`; F11-REQ-012) |
| P2 deletes their account | P2's letters are purged on the published clock; P1's book stays whole |
| P1 deletes their account | P2's letters survive; the book row keeps the name and dates for P2's kept letters (D-116) |
| Two parents edit the same letter | Only the author can; the other sees read-only facts (NS-21-R11) |
| The invites kill switch is on | Creating, peeking and accepting send nothing and show `errors.paused`; cancelling an invite still works (`lib/family/invites-switch.ts`) |
| P2's plan | P2's own kept letters count against P2's allowance; Plus reaches P2 only through Apple Family Sharing (D-053) |
| Separation, or an ex-partner | Private letters stay private; the 72-hour undo is the only removal; a support runbook for safety cases (Q50) |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | P2's first view is the inviter's sign-off and role only; then the book |
| Empty | P1 can invite with an empty book; P2 sees an empty book |
| Many (1,000 letters, 300 pictures) | P2's first sync of 1 year of text p95 30 s on LTE (06-nfr section 4); pictures never leave P1's phone (NS-01), so P2 sees none of P1's pictures |
| Offline | Invite and accept need a connection; one line says so; nothing half-joins |
| Slow | The accept is one transaction; a slow answer shows progress, never a second membership |
| Failed | A failed accept leaves no membership; Try again |
| Interrupted | An accept in flight completes or rolls back on the server; the phone asks again on return |
| App killed mid-flow | The token stays in the Keychain; the join sheet resumes |
| App updated mid-flow | As killed |
| Low storage (under 1 GB, under 50 MB) | The book's text is small; under 50 MB, no new draft (06-nfr 11.3) but reading works |
| Low Power Mode and low battery | Sync honours the OS; no change |
| Two books | A joined book is one more book in the switcher |
| Two parents | This card |
| Expecting parent (due date only) | P2 joins a Before You book; the due date is shared within the book (health-adjacent, Q48) |
| Multilingual | Each parent's letters in their own language and script |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | Invite and accept sheets stack buttons at equal size |
| VoiceOver | Invite, peek and accept sheets read title, body, choices in order |
| Voice Control and Switch Control | Every choice is a visible label; reachable by item scanning |
| Reduce Motion | No new motion |
| Dark mode and Increase Contrast | 4.5:1 |
| Plan lapsed | Reading both parents' letters is free; Keep of a new letter meets each author's own gate |
| Signed out | The book stays on the phone (D1); it no longer syncs |
| Second account on the same phone | Never sees the first account's local letters (`[X4-R1]`) |
| New phone | P2 signs in; the book arrives with words; recordings stay on the phone that made them (NS-10) |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-25-R1 | Given a store build, Then no co-parent surface or "coming soon" line appears until this card's gates are met (D-161, D-162 drafts in #827) | P0 (b: App Review 2.1(a), 2.5.19) | `[NS-25-R1] no co-parent surface in store builds` |
| NS-25-R2 | Given an invite, When the second adult opens it, Then they see the inviter's sign-off and role only, and no child name or letter, until they agree | P0 (a: private) | `[NS-25-R2] peek shows sign-off and role only` |
| NS-25-R3 | Given two parents, Then neither can read the other's private letters or delete the other's letters | P0 (a: private) | `[NS-25-R3] private stays private` |
| NS-25-R4 | Given the inviter undoes the join within 72 hours, Then the second parent's phone stops receiving the book at its next sync, and the second parent's letters leave the book and stay theirs (D-116; `undo_parent_join`) | P0 (a: yours always) | `[NS-25-R4] undo within 72 hours` |
| NS-25-R5 | Given a third adult opens a parent invite, Then joining is refused with a plain line (`SCCAP`) | P1 | `[NS-25-R5] third adult refused` |
| NS-25-R6 | Given the invite link page, Then it shows no child name and no letter (D-111 item 8) | P0 (a: private) | `[NS-25-R6] link page names no child` |
| NS-25-R7 | Given each parent's allowance, Then each counts only their own kept letters (D-103) | P0 (a: one paid act, counted fairly) | `[NS-25-R7] allowance per author` |
| NS-25-R8 | Given P2's second phone, When P2 signs in, Then the book arrives | P1 | `[NS-25-R8] second phone receives the book` |
| NS-25-R9 | Given P2 is already a member, When P2 opens the invite again, Then no second membership is made (`SCINV` "already a member") | P1 | `[NS-25-R9] no double membership` |
| NS-25-R10 | Given the accept answer is lost, When the phone retries, Then exactly one membership exists | P0 (c: the core loop of joining) | `[NS-25-R10] lost accept answer` |
| NS-25-R11 | Given `killSwitches.invites` on, Then create, peek and accept send nothing and show the paused line; cancel still works | P1 | `[NS-25-R11] invites paused` |
| NS-25-R12 | Given `serverFeaturesEnabled()` off, Then invite and join are absent and existing letters stay readable locally | P0 (b: no dormant surface) | `[NS-25-R12] servers off hides co-parent` |
| NS-25-R13 | Given more than 72 hours since the join, Then no removal control exists for either parent | P1 | `[NS-25-R13] no removal after 72 hours` |
| NS-25-R14 | Given P2 deletes their account, Then P2's letters are purged on the published clock and P1's book is intact | P0 (b: deletion duty) | `[NS-25-R14] P2 deletes account` |
| NS-25-R15 | Given P1 deletes their account, Then P2's letters survive and keep their labels (D-116) | P0 (a: yours always) | `[NS-25-R15] P1 deletes account` |
| NS-25-R16 | Given the inviter, Before sending, Then the sheet states that the other parent will read every letter in the book that is not private, including earlier ones | P0 (b: consent design, Q48) | `[NS-25-R16] invite says what is shared` |
| NS-25-R17 | Given accept, Then one PRIV-R21 row is recorded (document, version, method, surface `invite_accept`) | P0 (b: consent record) | `[NS-25-R17] accept is recorded` |
| NS-25-R18 | Given a parent invite older than 7 days, Then it is refused as expired | P1 | `[NS-25-R18] invite expires` |
| NS-25-R19 | Given a second account signs in on P1's phone, Then it never sees, claims or uploads P1's local letters (`[X4-R1]`) | P0 (a: private) | `[NS-25-R19] second account on the phone` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Invite sheet opens under 300 ms (06-nfr 2.1); accept to book visible: first page of letters within 10 s p95 on LTE (06-nfr section 4) |
| Memory | No change |
| On-device storage | The joined book's text and P2's own recordings |
| Battery | Sync as built |
| Offline | Invite and accept need a connection; reading works offline |
| Accessibility | AX5 plus Bold Text on invite, peek and accept; VoiceOver order |
| Localisation | Sign-offs in any script; interface English |
| Privacy | Log canary: no invite token, child name or letter in any log; tokens hashed on the server |

### 9. State space (RR-5)
| Case | Expected | Test |
|---|---|---|
| P2's second phone | Book arrives | `[NS-25-R8]` |
| Second account on the same phone | Never sees P1's local letters | `[NS-25-R19]` |
| Offline | Invite and accept refuse with one line; nothing half-joins | `[NS-25-R10]` |
| Retry after a lost answer | One membership | `[NS-25-R10]` |
| Already a member | Refused, book opens | `[NS-25-R9]` |
| Sign out | Book stays on the phone; no sync (D1) | `[X4-R1]` |
| Account deletion (P2) | P2's letters purged; P1's book intact | `[NS-25-R14]` |
| Account deletion (P1) | P2's letters survive (D-116) | `[NS-25-R15]` |
| Kill switch (`serverFeaturesEnabled()` off) | Invite and join absent; letters readable | `[NS-25-R12]` |
| Remote pause (`killSwitches.invites`) | Create, peek and accept paused; cancel works | `[NS-25-R11]` |
| Undo within 72 h | P2 stops receiving; keeps own letters | `[NS-25-R4]` |
| Plan lapse | Allowance per author; Family Sharing per D-053 | `[NS-25-R7]` |
| Third adult | Refused | `[NS-25-R5]` |

### 10. Data and engineering
- **Fields and tables (existing).** `child_invites` (token stored as a hash, role, expiry 7 days for a parent, `accepted_by`, `accepted_at`, `revoked_at`), `child_members`, `child_member_prefs`, `policy_acceptances` (PRIV-R21). Functions: `peek_invite`, accept, `undo_parent_join`, `leave_child`, `max_parents_per_book()`. Errors: `SCINV`, `SCCAP`, `SCPAR`.
- **Migrations.** None new for this card. Any new synced column from any other card must be added to the `entries` content trigger tuple (`20261003000000_security_and_family.sql:444-450`) and the `book_entries` view (`20261002020000_data_governance.sql:210`), or it bypasses `require_content_consent()` and is invisible to the other parent (finding F12).
- **Export.** Existing: `memberships[].role`, `manifest.scope.exporter_role` (1.3.0).
- **Modules.** `lib/family/*`, `app/invite/*`, the Me invite row; `visibleCoParentDoors(coParent, alpha)` (D-162).
- **Flags and pauses.** D-162's door rule; `killSwitches.invites`, `killSwitches.sync`.
- **Rollout and rollback.** Only after every gate in section 22; rollback is D-162's rule (alpha only), which hides every door while keeping joined books readable.

### 11. Data inventory
Existing rows, stated (CDO finding M4): `child_invites` (hash L3, kept 90 days after use, revocation or expiry), `child_members` (L3), `policy_acceptances` (L3). No new data.

### 12. Door lines
- **Invite.** Shown (to the inviter, before sending, intent): "They will be able to read every letter in this book that is not private, including the ones already there." Records: invite created (PRIV-R21). Never: a child name or letter in the link or the link page; the invitee's contacts. Decline: nothing is sent.
- **Accept.** Shown: the inviter's sign-off and role, the agreement with versioned links. Records: PRIV-R21 row (document, version, method, surface `invite_accept`). Never: a child name or letter before acceptance (`peek_invite`). Decline: nothing joins; the inviter is not told why.
- **Undo (72 hours).** Shown: what happens to the other parent's letters (they leave the book and stay theirs). Records: membership audit `member_join_undone`, PRIV-R21 row for the act. Never: delete the other parent's letters. Decline: no change.
- **Leave.** Not offered (D-113) until left books are listed.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| The whole book's history | An ex-partner co-parent (A1) | Private letters; the 72-hour undo; a support runbook (Q50); residual: a co-parent can screenshot (TDD 04) | `[NS-25-R3]`, `[NS-25-R4]` |
| Invite token | A forwarded or leaked link | Hashed token; peek needs sign-in; single use; 7-day expiry; revocable; the page names no child | `[NS-25-R2]`, `[NS-25-R6]`, `[NS-25-R18]` |
| Health or pregnancy details in earlier letters | Shared with the second adult without a clear consent | The invite sheet says so before sending; counsel Q48 | `[NS-25-R16]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No child name or letter before acceptance.
- No co-parent surface or "coming soon" line in a store build before the gates.
- No text field that becomes a letter's words on this card (ruling D2 does not apply; letters themselves follow Review's rule).

### 15. Design inputs
States: invite sheet; link page (iPhone, other device); peek; accept; expired; already a member; third adult refused; paused; undo within 72 hours; after 72 hours (no control); AX5; dark mode. Reused: existing `app/invite/*` screens, `ConfirmSheet`. Smart Invert: n/a (no pictures).

### 16. Content inputs
Invite sheet sentence (as in section 12); accept lines; expired, refused and paused lines; BRAND.md line 40 rewritten before any store listing mentions both parents (owner `content`). Banned: "coming soon", "family can listen", "invite grandparents".

### 17. Legal, privacy and compliance inputs
Counsel must confirm: Q48 (consent design: is a separate sharing consent needed at the first invite; MHMDA consent content; D-050), Q49 (death, incapacity and fiduciary access in a shared book), Q50 (safety removal, custody and legal orders), Q53 (two parents per book: the 72-hour undo and no later removal), Q43 (privacy claims), Q54 (App Privacy answers). Ruling D11: the Terms' 72-hour undo only, until Q53 is answered. The age-rating "social" answer changes when co-parent ships (F21-REQ-NEW-E, CCO).

### 18. Label effect
**Label effect.** None until the store build that turns co-parent on; then CPrivO and counsel read the App Privacy answers (Q54) against that build.

### 19. Claims
Enables (only after the gates): "Both parents in one book, each letter signed." Forbids: "share with family", "grandparents can join", "coming soon", BRAND.md line 40 as written.

### 20. Free or Plus
Joining is free. Each parent's allowance counts their own kept letters (D-103). Plus reaches the other parent only through Apple Family Sharing (D-053). Ruling T2 applies.

### 21. Measures with analytics off
Testers in alpha, by hand (D5): "Did the other parent make a letter this month (yes / no)?" x of n.

### 22. Dependencies and gates
- #827 merged (D-161, D-162).
- The co-parent backlog work BL-882 to BL-889 merged.
- Counsel answers on Q48, Q49 and Q53 (D11 applies until Q53).
- BRAND.md line 40 corrected.
- The founder's call on D-053 (Plus outside one Apple Family) before store.
- Device rows: two phones, under D13.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Plus for a co-parent outside one Apple Family | founder (CBO, CFO) | Keep D-053; say it plainly in the invite |
| Removal after 72 hours | counsel Q53 | Terms as drafted (D11) |
| Leave | CPO with `mobile` | Hidden until BL-444 |

---

## NS-26. Hear when the other parent writes (candidate C-29, rank 41)

**Label effect.** None until built. If built, push tokens may need an App Privacy row (Q54(d)).

Decision record. Designers do not draw this until it is reopened.

- **Who it serves.** P1 or P2, who would like to know the other parent made a letter.
- **Why it waits.** A push needs a server sender, an entitlement and a consent, and it puts a sign that a letter exists near a lock screen. Value for P2 is real but small next to its cost [A]. NS-25 is not in a store build yet.
- **What would reopen it.** NS-25 shipped in a store build, and tester evidence (D5 rule) that parents want to know: "Would you like to know when the other parent made a letter (yes / no)?", reported x of n.
- **What must be true before anyone designs it.** NS-25 live; NS-32's registry has a row for it with a priority, inside the one-per-day budget; door lines for the push permission; push tokens in a server table with grants and a `grants.mjs` row, class L3; payloads follow PRIV-R10; counsel on Q54(d).
- **Rules if built.** At most 1 per day, inside NS-32's budget; never letter words or a child's name by default; set `hiddenPreviewsBodyPlaceholder` on its category (research note 3); never "time-sensitive".
- **Never.** No letter text, child name, picture or prompt is donated to the system (ruling D3).
- **Free or Plus.** Free if built (ruling T2).
- **Counsel.** Q54(d); Apple 4.5.4 names push notifications (research note 1).

## NS-27. Who can read each letter (candidate C-31, rank 42)

**Label effect.** None.

Decision record.

- **Who it serves.** A parent who wants one letter seen by some readers and not others.
- **Why it waits.** Today a letter is private to its author or in the book for both parents (`entries.in_book`). Per-person choices matter only once there are more than two readers (NS-28). Building it first is access-rule work with no reader to serve.
- **What would reopen it.** NS-28 specified, or evidence from NS-25 testers that two states are not enough (x of n).
- **What must be true before anyone designs it.** More than two readers exist; a new access rule with `book_entries` and the content trigger updated (finding F12); a security read; NS-21 row 5 extended, not replaced.
- **Never.** No letter text, child name, picture or prompt is donated to the system (ruling D3).
- **Free or Plus.** Free if built (ruling T2).

## NS-28. A family link or circle (candidate C-27, rank 40)

**Label effect.** Changes if built: Audio Data becomes collected and linked (Q54).

Decision record.

- **Who it serves.** P5, close family who are not account holders.
- **Why it waits.** It puts a child's voice and words on our servers for people who are not account holders. Closed question X2: no build before a security read and a counsel read. The pilot (NS-03) tests the need by hand first.
- **What would reopen it.** The NS-03 read-out shows that parents send recordings, how often and to whom, against the pass lines in NS-03 section 8.
- **What must be true before anyone designs it.** A `security-architect` read and a counsel read on record (X2; Q45, Q42); link tokens hashed, L3, on a 90-day clock (the `member_return_links` pattern); recording backup (NS-08) decided, since hosted audio is its precondition; a founder decision on cost.
- **Never.** No letter text, child name, picture or prompt is donated to the system (ruling D3). No public link without an expiry.
- **Free or Plus.** If built, part of what keeping a letter brings, never a second tier (X3; NS-03 rule).
- **Counsel.** Q45, Q42, Q54.

---

## NS-29. Words that light up as they are read (candidate C-33, rank 38)

**Label effect.** None.

Decision record.

- **Who it serves.** A parent reading a letter aloud to {child}, following the words with a finger. Designed for the parent's use, never for a child using the app alone.
- **Why it waits.** It needs word timings stored against the raw words, and it must never mark a word the parent did not say. Size L.
- **What the code says (read 20 Nov).** The server column `entries.stt_meta` exists, is author-only and synced in the contract (`packages/api/src/server/sync.ts:161`), and `data-policy.md:87` describes it as holding per-token timestamps. The phone does not keep it yet: `lib/transcribe.ts:53` says "once the store keeps it", its `SttMeta` type holds chunk times and counts, not per-word times, and the export writes `stt_meta: null` (`lib/export/build.logic.ts:689`). So the ruling's "stt_meta already holds per-token timings" is true of the server schema's description, not of what any phone stores today.
- **What would reopen it.** Tester evidence that parents read aloud from the screen (x of n) and a ranked slot after NS-24.
- **What must be true before anyone designs it.** The phone stores per-word timings against the raw transcript and syncs them in `stt_meta` (author-only, L4); only tokens of the raw transcript, mapped through `machine_edits` offsets, are ever highlighted; a word that came from an `stt_fix` or `agreement` edit has no timing and is never highlighted; zero highlighted words absent from `final_text`.
- **Never.** No letter text, child name, picture or prompt is donated to the system (ruling D3). No highlight of a word the parent did not say.
- **Free or Plus.** Free if built (ruling T2).

---

## NS-30. A book you can hold (candidates C-26 printable file, rank 27; C-28 printed Year One, rank 43)

**Label effect.** None for the file. A printed book with a code needs hosted audio, which changes the label (Q54).

Decision record.

- **Who it serves.** P1 at the end of the first year, who wants to hand a grandparent something made of paper.
- **The file.** Specified in `07-remaining-capability-rows.md` section 3.2 (rows NS-07-C28-1 to 8). The file is free and sells nothing. Its parent-facing name uses "printable", never "print-ready" (content rule K-32). Layout numbers wait for two proof books, which need the founder's approval to spend. The stored copy of a picture is kept at its own size up to 4,032 px on the long side, never below 2,550 px when the source is larger (ruling T3), so a later file can print at 8.5 inches and 300 dpi.
- **The printed Year One with a code that plays the voice. Why it waits.** Three things that are not product work: an entity (D-004; Q47), a print partner and terms (Q11), and hosted audio for the code to point at (X2). Founder sequence: the entity, then partner quotes, then hosted audio.
- **What would reopen it.** The entity exists; the founder approves proof-book spend; NS-28's or NS-08's server audio has its security and counsel reads.
- **What must be true before anyone designs it.** The three conditions above, and the claims row for the file in place.
- **Order of work for print (CL/K ruling K14, `GAP-LOG.md`).** The accountant is settled before the first order; finance owns the run-cost register and adds print rows only when a partner quote exists; print publishes no price before then (FR-PRT-23); legal drafts a one-line Terms note for the free file now and the Print Terms only when FR-PRT-34 is true. Nothing here ships in 1.0 (FR-PRT-01). Who sells (Q-PRT-2) and the money path are the founder's.
- **Never.** No letter text, child name, picture or prompt is donated to the system (ruling D3).
- **Claims.** Forbids "order", "printed", "hardcover" and any partner name until a printed book exists.
- **Free or Plus.** The file is free (ruling T2). A printed book's price is a founder decision with the CBO, CFO and CLO roles.

## NS-31. A library of moments (candidate C-16, rank 44)

**Label effect.** None until built; reading the photo library would change it (NX-39 counsel brief).

Decision record.

- **Who it serves.** P1 with years of photos who wants days suggested from them.
- **Why it waits.** Specified in full as NX-39 (Memory Library), after the photo-with-a-letter work as a whole (10 Nov exec record). It reads the photo library and suggests days, which needs counsel on several questions (the NX-39 counsel brief). The open reminders draft currently registers an `occasion` notification class for it; that class leaves it when it becomes NS-32 (see NS-32).
- **What would reopen it.** NS-01 shipped and its five-parent study read; counsel answers on the NX-39 brief.
- **What must be true before anyone designs it.** As NX-39 states; no notification derived from the library (NX-39 R27).
- **Never.** No letter text, child name, picture or prompt is donated to the system (ruling D3). No machine-made caption or title.
- **Free or Plus.** Free if built (ruling T2).
