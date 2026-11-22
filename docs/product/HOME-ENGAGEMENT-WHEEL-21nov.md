# Home engagement wheel: what Home shows each day, and how Home differs from Book

Status: PROPOSED (nothing here is decided, built or recorded in `DECISIONS.md`) | 21 Nov 2026 | Owner: `product` | Docs only | Answers the founder question of 21 Nov: did requirements account for photo access, and for a Home that picks which memories, photos, videos or occasions to nudge a parent to speak or write about, so that Home and Book do not look the same.

Scope change folded in on 21 Nov (founder, 20 Nov, verbatim): "Basically learn from this and do what this does in a smarter way and relevant to my usecase. This is really critical for me. Doesn't need to be a half sheet but this can be one new tab like explore etc or suitable word." Then: "The default tab can be showcasing value props nicely and if not given permission for your photos then get that permission. If you gave them show relevant things like screenshots I provided." Section 7 proposes the tab (working name Moments). The founder's screenshots are not copied here and no real name or place from them is in the repo.

Fictional family: Asha only. Words in quotes are intent for `content`, never final copy. UNVERIFIED marks anything I did not read in a source. I read these files in a depth 1 clone at `86eccfa` of `develop`; I could not read the Project doc `infra/cto-rulings-2026-11-10-memory-library.md` from this run (no Projects tool), so ML-1 to ML-12 are not quoted here. The repo carries ML-4, ML-13 and ML-14 (`docs/roadmap/next/03-requirements/NX-39-council-record-10nov.md` section 8.1) and the engineer's ten rulings in section 8; I cite those only.

## Status after the locks of 21 and 22 Nov (read this first)

This file was written before the Moments locks. Where it conflicts with a lock below, the lock wins and the conflicting text is marked SUPERSEDED in place (the original wording stays so the history reads). Nothing here is decided, and nothing in this file is edited in `docs/DECISIONS.md`.

| Lock | What it fixes | Part of this file it supersedes |
|---|---|---|
| Founder, 21 Nov: "No it needs to ship with photo library read." (`docs/product/prd/28-moments-tab.md`, header) | The first Moments release reads the photo library in 1.0; gates G1 to G11 apply before store submission, not before coding | Section 1 question 3 ("first public build will NOT do what the founder described"), Q-HEW-1 options A and C and its default, the "drop C" timing in sections 3 and 7 |
| D-165 item 3 and PRD 28 section 4 (D-161, IA-R1) | Four tabs in the order Home, Moments, Book, Me; Home is the landing tab; flag off gives Home, Book, Me | Section 7.1 first row (IA-R1 collision is settled), section 7.6 NS-53-R1, and any reading that Moments or value props are the default tab |
| PRD 28 option C and O-01 (deadline Mon 24 Nov 2026) | Moments as the default tab is not adopted; a five-parent default-tab check is the cheaper test | The founder's 20 Nov "default tab can be showcasing value props" wish in the scope paragraph above stays as history only |
| `docs/product/prd/28-moments-tab.md`: NS-53 and its rows R1 to R60+ are already taken by the Moments spec | The card id NS-53 and every NS-53-R row in 7.6 are in use with other meanings | Section 7.6 (all sixteen rows). Cite PRD 28 rows; do not use this table as requirements. The proposed `source` value `moment` and FR-PRV-50 also meet the allowlist point in Review B note 3 and stay open for `analytics` |
| PRD 28 RV-03, RV-05, G-1 and G-3 (the ask is the parent's own tap inside Moments, after one sentence, never repeated; a first-run parent opens Moments with no permission given and sees something real) | Where and when the library ask lives | Q-HEW-3 is answered in substance by RV-03 and G-3; the "day one" M0 row in 7.3 is replaced as marked there |
| D-165 item 1 (O-48 value-prop pair, UNPUBLISHED until counsel answers packet Q130) | The two value-prop lines stay off every store page, website, first-run screen and ad | Any use of value props on a parent-facing surface in 7.3 M0 and FR-MKT-45: intent only, no wording is adopted from this file |
| D-165 item 5 (O-59, "Not now" until the next local day) | The card-face word | The "Not now" wording in 7.3 and 7.5 is read as the card verb of O-59, not a new permission-sheet button |
| Exec rulings CPO-17 point 5 (`docs/agents/exec/RULINGS.md`) | No library-timed push and no Moments email in 1.0, both off | Wheel source 6 in section 3 ("one neutral budgeted reminder") is OFF in 1.0 |
| Exec rulings CPO-27 and PRD 28 R253 | In a hard stretch or a quiet book the picture surfaces are suppressed; the picker door stays | Section 7.3 M2 and NS-53-R12 are read with R253 |

Not checked: PR #1281 (D-164, the tab name), because D-164 is not on `develop` at this head. The tab name "Moments" is therefore still the working name here.

Words for parents (content read, `content` agent, on PR #1264): "Moments" is only the fourth tab's label and place name, never the name of a note, letter, recording, picture or marked day (BRAND.md glossary: "moment" is banned for a short piece someone makes). The job line for the tab is "Pick a day worth a letter to {child}." Intent for `content`, not final copy.

## 1. Plain answers

After the 21 Nov scope change: the answers below still hold for the first store build. The new tab (section 7) is a drop C or later item unless the founder answers Q-HEW-1 otherwise, and it needs four tab rules changed (7.1).

**Question 2: is there ONE place that defines what Home shows each day?** No. The pieces exist and are good, but they are spread over seven files and none says "on this day, Home shows X". The gap, named:

- G1. The slip slot has one order (NS-50-R5, `docs/product/prd/21-days-cultural-photos-home.md`): waiting set, seal-opened, a day the parent chose, Save a copy, the Days ask, one past letter. That is a priority list for ONE slot. It is not a wheel: it does not say how a parent with no marked day and no past letter gets anything new on day 30.
- G2. NS-50 says so itself: "on a day with nothing marked, Home is unchanged by this card", and the spec says Home's weakness is "a stale second visit" (`docs/product/prd/22-final-holistic-spec.md` section 3). Whether Home is enough as the default tab is left to a five parent check (NS-50-R13), not to a rule.
- G3. Photo sources are placed by three documents that disagree on where they show. NS-49-R1, NS-50-R10 and NS-51 section 3 say the capture cluster menu only, never a Home slip, tile or strip (R-IA-3). The older Memory Library spec (NX-39, BL-873 in `docs/BACKLOG.md`) said "Tonight and the composer shelf are the only surfaces" and the IA spec (`docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` 3.1) allows one day card ML-S10 in the memory slip position. Nobody has ruled which wins now.
- G4. "A parent-labelled story" has no source row at all. NS-01 and NS-52 cover a picture the parent picks and their own words; nothing names a prior parent label (for example the "From your phone" editable label, Q-FD-30) as something Home may reuse to start a letter.
- G5. Home versus Book is defined by verbs (Home "say", Book "read", Me "look after", J1 to J4, J12 in the 12 line review, section 11 of the IA spec) and by IA-R9 (Home lists no kept letters). That holds, but J5 (five parent read of the headings) and J11 (device pass) are still Open, and nothing states the difference at day 30 or at 80 letters.
- G6. No requirement ties the sources together under the constitution checks once (no caption, no scene or place guess, no count or gap, nothing implies AI writes). They are scattered through NS-49, NS-51, FR-PHS-43 and FR-PHS-60.

**Question 3: what can the first public store build do?** SUPERSEDED in part by the founder ruling of 21 Nov (the first Moments release ships with the library read) and PRD 28; the text below is the 21 Nov morning position, kept as history. Honest version at that time:

- It can: speak and type letters, start from one picture the parent picks with Apple's own picker (level 1, NS-49, only if NS-01 reaches TestFlight; it is "dark" today and level 1 moved from drop A to drop B, CL-015), show one slip a day from the fixed order, send typed days and ticked days as the one budgeted reminder, and show one past letter on the same day of an earlier month or year (NS-23, C-20). The child switcher on Home is C-14 (BL-940, BL-941).
- It cannot: read the photo library to find a weekend worth a letter. No photo library usage string and no PhotoKit call in a 1.x build (FR-PHS-40; BL-1305, status proposed). Level 2 (Apple's suggestions picker, NS-49, BL-298) is drop C. Level 3 (NS-51, BL-045) is drop C with a device spike first on `exp/photos-library-nudge` (FR-PHS-41). Pictures and videos together with letters (NS-52) are also drop C.
- Against the founder's 20 Nov direction (`docs/product/prd/26-founder-direction-photos-library-and-media.md`: "Apple Journal like access to photos folder and using that data to find what letter someone should write"): the direction is accepted and specified as NS-51, but it is scheduled after 1.0 approval, spike first (Q-PM-7). So the first public build will NOT do what the founder described. That is a scheduling ruling made on our reading, not a finding that it cannot be done.
- A conflict I found: BL-1305 says no usage string or PhotoKit call "in any 1.x build" and lists FR-PHS-40. The addendum to the photos function file says FR-PHS-40 now holds "per profile and per flag" and NS-49 says level 3 ships in 1.1. 1.1 is a 1.x build. As written BL-1305 would fail a 1.1 build that ships NS-51. Karma or the founder must reword BL-1305 or the drop; I have not edited either (see Founder question 2).

## 2. What exists, by id (the audit)

| Piece | Where | What it does for Home |
|---|---|---|
| NS-50 Home today, R1, R4, R5, R10, R11 | `21-days-cultural-photos-home.md` | One slip slot, fixed order, no count of things waiting, no picture slip |
| NS-46 Days we mark | same file | Ticked days recur yearly; send as one reminder (library day) and show as slip rank 2b on the day |
| NS-18 typed days (parent typed occasions and dates) | `09-capture.md` | A one-off day the parent typed; outranks birthday and library day |
| NS-23 past letter (C-20, BL-946) | `10-reading-and-family.md` | One card, same day in an earlier month or year, last slip rank |
| NS-49 levels 1 and 2 | `21-days-cultural-photos-home.md` | "Start from a photo" in the capture cluster; level 2 adds "Pick from recent days" (Apple's list) |
| NS-51 library days (level 3) | `27-photo-moments-and-media.md` | Dates only, on the phone, opt-in from Me; a third menu item in the cluster; one budgeted neutral reminder |
| NS-52 pictures and videos with a letter | same file | Several pictures and videos on a letter; no machine caption |
| NS-32 notification budget | `11-foundations.md` | One reminder a day; day sources ranked typed day, birthday, library day, month age, evening; Apple's own suggestion notifications are outside it |
| ML-4, ML-13, ML-14 and the ten engineer rulings | NX-39 council record section 8 | Moment engine rules: no asset id or derived value kept, one hidden photo holds for the chooser session only, leftover pieces re-judged |
| BL-843 to BL-877 | `docs/BACKLOG.md` Memory Library block | Older build rows (spike BL-843 needs-founder; surfaces row BL-873 blocked) |
| IA spec J1 to J12, IA-R3, R4, R9 | `06-HOME-BOOK-ME-IA-11nov.md` | Home says, Book reads, Me looks after; Book starts nothing; Home lists no kept letters |
| BL-298, BL-045, BL-1304, BL-1305 | `docs/BACKLOG.md` | Build rows for levels 2 and 3 and the holds; all `proposed`, not `ready` |
| C-14, C-20 | `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md` | Child switcher on Home; one past letter on Home |

## 3. PROPOSED wheel, by source

One rule for the whole wheel: Home shows at most one slip, and the picture entries live in the capture cluster, not in the slip slot (R-IA-3, NS-50-R10, NS-50-R11 stand). The wheel only adds a second thing: which source supplies the day's prompt framing and the cluster's quiet "Start from a photo" menu. Sources are tried in order; the first with something real wins; no source ever invents something to show.

| Order | Source | What Home does with it | Ships | State of requirement |
|---|---|---|---|---|
| 1 | Parent-initiated picker (level 1, NS-49; NS-52 for several items later) | Always there: "Start from a photo" in the cluster. The parent chooses; capture opens with their picture and an empty words field | Drop B, if NS-01 is on TestFlight | Specified |
| 2 | Parent-typed occasions and dates (NS-18) | Slip rank 2b on the day, one line of the parent's own wording, then an ordinary prompt | With typed days in planner (BL-982) | Specified |
| 3 | Days the parent ticked (NS-46, NS-47) | Same slip, rank 2b, on the day; quiet line replaces the prompt on a quiet day (Q-FD-24) | Drop B subset (US, no question), then C | Specified |
| 4 | One past letter (NS-23, C-20) | Slip rank 4: the letter's own date and verbatim opening words, same day earlier month or year | With Home slip registry (BL-963) | Specified |
| 5 | Parent-labelled stories (PROPOSED, new) | If a kept letter has a parent-edited photo label, and the picture is attached, it may appear as the past letter card's date and the parent's own words only. No new source, no new slot. Needs a ruling that this is the same card as NS-23 | Drop B or later | GAP G4: not specified |
| 6 | Library moments, level 2 then level 3 (NS-49, NS-51) | Third item in the "Start from a photo" menu when a moment exists; one neutral budgeted reminder only if the app was opened since the pictures were taken. Never a slip, tile, strip or count | Drop C, spike first | Specified, gated |
| 7 | Prompt of the day (existing catalogue) | Always present; the fallback when nothing above applies | Built | Specified |

### Home in each state (PROPOSED)

Day one, no letters: greeting, the day's prompt, the capture cluster (Speak, Type, "Start from a photo", "Not much today"), the day-zero card. No slip, no past letter, no marked day unless the parent typed one at set up. Book on day one is the closed cover and one pointer to Home (IA spec section 6).

Day 30, about a month of letters: the same Home frame. New: at most one slip from the order, for example a typed or ticked day if one falls today, or one past letter once any kept letter has a matching earlier month day (NS-23-R1a). If the parent started level 1 pictures, "Start from a photo" is unchanged. If nothing applies, Home is the prompt and the cluster, and that is correct and stated, not hidden (G2). Book at day 30 shows the letters by month, Find, Read together, and the Photos lens when a second lens has material.

At 80 letters: Home is still one prompt, one cluster, at most one slip, the waiting row if any. It never lists kept letters and never shows a count (IA-R9, NS-50-R11). More past-letter matches exist, but still only one card shows (NS-23-R1b). Where drop C has shipped and the parent opted in, the photo menu may carry a third item. Book at 80 letters is where the volume is: months, lenses, Find, Read together, export and Save a copy entries on the letter itself.

### Home versus Book, in parent words (PROPOSED line for `content`)

"Home is where you start a letter. The Book is where you read the ones you kept."

This keeps J1 and J4 (Home says, Book reads) and IA-R3 and R4 (Book starts nothing). A letter in progress appears on Home until kept, and moves to Book when kept. J5 and J11 stay open until five parents read it and a device pass runs.

## 4. Constitution checks for every source (PROPOSED; each must have a test title starting with its id)

| Check | Rule | Source |
|---|---|---|
| No caption | No title, caption, summary or story is written, suggested or pre-filled from a picture; a nudge never describes what a picture shows | `CLAUDE.md` constitution; direction 26 section 1; NS-52 (alt text is the parent's words or none) |
| No scene or place guess | Library moments use date and count only; place off by default (Q-PM-5), no faces, scenes, objects or content class (Q-PM-6, FR-PHS-60); level 2 title is Apple's text, labelled "From your phone", saved only if the parent taps "Use this" (Q-FD-30) | NS-51, FR-PHS-60 |
| No count or gap | No count of moments, unwritten days, things waiting or pictures; no streak, no comparison; a count of pictures by day is close to a count of gaps, so a nudge carries only a date a parent can check (FR-PHS-43) | `CLAUDE.md` content rules; NS-50-R11 |
| Nothing implies AI writes | No line says the app found, wrote or suggested words; the app offers a start, the parent speaks or types; no "best" or "memories" claims | `CLAUDE.md`; NS-51 not in scope; FR-PHS-43 |
| No nag | No prompt about limited or denied access | FR-PHS-44 |
| Stays on the phone | Library analysis on the phone only; nothing from the library leaves except by the parent's own act | direction 26 section 1 |

Door lines for the library opt-in (PRIV-R21; PROPOSED, words by `content`, to be written into NS-51 section 12 if the founder approves drop C):
- Shown: one plain sentence in Me before Apple's sheet saying the app reads only the dates of pictures, on the phone.
- Records: the parent's yes and when, on the phone; no picture, filename, album or place.
- Never: reads a picture the parent did not choose to include, sends any of it, or describes a picture.
- Decline: "Not now" changes nothing and shows no reminder about it; the picker keeps working (engineer ruling 8).

## 5. Founder questions

Q-HEW-1 (one question, deadline proposed). When should the Moments tab (section 7) and library-derived nudges ship: in the first store build, or after 1.0 approval (drop C)?

- SUPERSEDED (founder ruling of 21 Nov, PRD 28): Option A, and its "default if unanswered", no longer stand. The library read ships in 1.0 behind its gates. Option B (picker only) is now the documented fallback if a gate fails, not the plan. The text is kept as history.
- Option A (recommended at the time): drop C, spike first, with a tab concept designed now. Move the device spike (BL-843, a founder device step), the counsel read (BL-841) and the entitlement check (Q-FD-11) earlier so drop C starts the day 1.0 is approved. The first build keeps three tabs and Home, made honest with wheel sources 1 to 4 and 7.
- Option B: Moments tab in the first build, fed only by Apple's own suggestions picker (level 2), no photo library read. Needs the entitlement approved (UNVERIFIED), iOS 17.2 or later, NS-01 on TestFlight (it is dark today), a fourth tab (see 7.1) and a counsel read on a child's pictures. Many gates close at once, right when App Review is the risk.
- Option C: own library read (level 3) in the first build. Not recommended: usage string, App Privacy label change, X2 counsel read, no spike data.
- Why A: a Moments tab fed only by sources 2 to 4 (typed days, ticked days, past letter) would show what Home's slip already shows, which is exactly the "two tabs look the same" risk the founder raised. The tab earns its place only with picture sources (levels 2 and 3), and those are the gated ones.
- Default if unanswered: A (drop C stands, spike first, Q-PM-7).
- Deadline: PROPOSED Mon 24 Nov 2026, so the spike can be scheduled before Build 13 freeze. UNVERIFIED: I have not read the freeze date.

Q-HEW-2 (for Karma, not the founder). Rule between NS-50-R10 and NX-39 BL-873 / ML-S10 on where a library moment may show, and reword BL-1305 ("any 1.x build") to match the drop C line. Under section 7 this becomes: a library moment shows in the Moments tab and the cluster menu, never as a Home slip.

Q-HEW-3 (SUPERSEDED in substance by PRD 28 RV-03 and G-3: one ask, on the parent's tap, never repeated; what parents are promised stays the founder's, CR-73). Does "get that permission" mean one parent-tapped ask, with no second ask after a No? Recommendation: yes, one ask on a tap, never re-asked, no nag after a No (FR-PHS-44, FR-PRV-38, Apple's ask-on-a-direct-action rule S2). Default: that.

## 6. Not done and not claimed

- I did not read ML-1 to ML-12 (Project doc not reachable here) and did not read code. No statement here is a finding about what is built; "built" claims come from the reviews quoted in `22-final-holistic-spec.md` section 4.
- The design concept, constitution analysis and feasibility documents are being written in parallel by the design, privacy and mobile agents. When their PRs are open, this file will link them and not repeat them. None was open when I looked (21 Nov, open PR list read by REST); do not read the absence as a decision.
- No backlog task is added or changed in this PR. If the founder accepts this wheel, `product` will add tasks: a single Home source registry row (extends BL-963), the parent-label ruling (G4), and the BL-1305 reword.
- Day 30 and day 80 states are derived from the cited rules; no parent has seen them.

## 7. PROPOSED: a Moments tab (card NS-53, working name; the founder said "explore etc or suitable word")

The word is for `content` and the founder. "Moments" is a working name only. The tab is where the wheel in section 3 becomes the main surface instead of one slip on Home. Ids: NS-53 is PROPOSED as the next free card id (confirm against the register; the one other mention in the repo is a count line in `docs/qa/test-plan-b13/03-photos-and-media-library.md`). FR rows below continue each function file's numbering and are PROPOSED, not added to those files.

### 7.1 What the scope change collides with (named, not waived)

| Existing rule | Collision | Proposed handling |
|---|---|---|
| IA-R1, navigation tests N1 and N4: exactly Home, Book, Me, "no screen for Family, Library, Photos or Share" (`docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` section 9) | A fourth tab breaks IA-R1 | `design-systems` approves a changed IA-R1 and N1; the IA spec says a new tab needs the Share-style test first. J12 (each tab removed leaves one job undone) must still hold for four tabs |
| IA-R3, N3: one capture entry; a tab other than Home with a capture list fails N3(b); P2: a start from a photo is a mode of Home's entry | Moments hands off to capture | The hand-off calls the one start function with a new allow-listed `source` (`moment`), approved by `design-systems`; Moments has no recorder of its own |
| IA-R4: Book starts nothing | none | Unchanged. Moments starts only through the hand-off |
| FR-PHS-44, FR-PRV-38: no prompt about limited or denied access, no nag | "if not given permission then get that permission" | One ask, on a parent tap, never repeated (Q-HEW-3). After a No the tab shows the picker and typed days, with no line about access |
| NS-50-R10, R-IA-3: no picture slip, tile or strip; no feed | A tab of moments is a feed if it is a list of things waiting | The tab shows a few of the parent's own pictures as an invitation, never a count, never "to do" wording, never more than one screen of items (NS-53-R9) |
| FR-PHS-40 and BL-1305: no usage string or PhotoKit call in 1.x | Library tab needs a read | Gated by Q-HEW-1; flag off in every release profile until ruled |
| Direction 26 section 3: no marketing claim like "we find your best moments"; NS-51 not in scope: "memories", "best" | "Showcasing value props" | Value props state what the parent does ("say something about a picture you chose"), never what the app finds or writes |

### 7.2 Home versus Moments versus Book (PROPOSED line for `content`)

"Home is where you start today's letter. Moments is where you pick a day worth a letter. The Book is where you read the ones you kept." (Reworded after the content read: the first version said pictures and days "wait for you", which reads as a to-do.)

| | Home (Say) | Moments (Look back and start) | Book (Read) |
|---|---|---|---|
| Owns | Today's prompt, Speak, Type, waiting drafts | Wheel sources 2 to 6: your marked days, your pictures, library days | Every kept letter |
| Starts a letter | Yes, directly | Only by handing off to the one capture entry | Never (IA-R4) |
| Lists kept letters | Never (IA-R9) | Never; one past letter only as a link to the Book | Always |
| Day one | Prompt and cluster | Value props and the permission ask (7.3) | Closed cover, pointer to Home |
| Day 30 | Prompt, cluster, one slip | A few of your pictures or days, or the quiet state | Months, Find, lenses |
| 80 letters | Same as day 30 | Same shape; never a count of letters or moments | Where the volume is |

If Moments and Home would show the same item on a given day, the item shows in Moments and Home shows only its slip order as today (NS-50-R5). One owner per fact (IA audit rule).

### 7.3 States of the tab (PROPOSED; names for `design-systems`)

| State | What the parent sees | Notes |
|---|---|---|
| M0 day one, before permission | Value props in plain words and fictional Asha examples; value props are intent only and unpublished under D-165 item 1; one quiet "Pick one picture" (Apple's system picker, no permission). "Show my pictures" appears only after the first saved letter, and no ask button is shown before it (content read; PRD 28 NS-53-R6 says the first permission a parent meets is the microphone) | No iOS sheet yet. No library read has happened. Marketing frames follow FR-MKT rules |
| M1 asking | Apple's own sheet, after one plain sentence, only after the parent taps | Asked once. The system sheet is the only ask |
| M2 allowed (all or limited) | A few days of the parent's own pictures (dates only, no place, no caption), plus any marked day today | Limited behaves like all; no line about what is missing (FR-PRV-38) |
| M3 nothing to show | One calm line and the picker | Never "no moments yet" counts; never a gap |
| M4 declined or off | The picker, typed days, ticked days and one past letter; no line about access | No nag, ever (FR-PHS-44) |
| M5 quiet book | Nothing from that book | NS-23-R8 and R-IA-6 hold |

### 7.4 Hand-off to capture (PROPOSED)

The parent taps a day of pictures, chooses one or several, and the one capture start opens with those pictures attached and an empty words field (NS-49-R3, NS-52). Nothing is pre-filled from a picture. Date of the letter comes from the picture date only if the parent confirms it. The prompt shown is an ordinary prompt from the catalogue and does not depend on the picture (the "prompt does not depend on the picture" test, CHECKS-AND-BALANCES F6).

### 7.5 Door lines for the permission ask (PRIV-R21; PROPOSED, words by `content`)

- Shown: one plain sentence before Apple's sheet saying the app reads the dates of pictures on the phone to show your days, and that the pictures stay on the phone.
- Records: the parent's yes with its time, on the phone. No picture, filename, album, place or count.
- Never: reads or sends a picture the parent did not include, describes a picture, writes words, re-asks after a No.
- Decline: "Not now" or a No in Apple's sheet changes nothing else; the picker, Home and Book work the same.

### 7.6 Requirement rows PROPOSED for NS-53 (SUPERSEDED: NS-53 and its rows are already used by `docs/product/prd/28-moments-tab.md`; kept as history, do not cite)

Each row's test title starts with its id in brackets. P0 reasons: (a) a promise, (b) a legal or store duty, (c) the core loop.

| Id | Given / When / Then | Priority |
|---|---|---|
| NS-53-R1 | Given any build, Then the tab bar has Moments only where the flag is on and Q-HEW-1 allows it; with the flag off the bar is Home, Book, Me (IA-R1 as built) | P0 (a) |
| NS-53-R2 | Given a first-run parent, When they open Moments before any permission, Then M0 shows value props and no iOS sheet appears and no library call is made | P0 (b) |
| NS-53-R3 | Given M0, When the parent taps the one button, Then one sentence shows and then Apple's sheet; the sheet never appears at launch, in first run or from a notification (FR-PHS-58) | P0 (b) |
| NS-53-R4 | Given a No, limited, or Not now, Then no screen of ours asks again or mentions access (FR-PHS-44) | P0 (a) |
| NS-53-R5 | Given M2, Then only creation date and media type are read (FR-PHS-60); a source scan fails any location, face, scene, filename or album field | P0 (a) |
| NS-53-R6 | Given any Moments item, Then it shows the parent's own pictures and a date; no caption, title, summary, place name or description of what a picture shows | P0 (a) |
| NS-53-R7 | Given the tab, Then no count of moments, pictures, unwritten days or things waiting, no streak, no comparison | P0 (a) |
| NS-53-R8 | Given any string in the tab, Then it does not say or imply the app found, chose, wrote or suggested words; content rules and the claims check pass | P0 (a) |
| NS-53-R9 | Given M2, Then at most one screen of items shows, newest first by picture date, with no endless scroll | P1 |
| NS-53-R10 | Given a tap on an item, Then the one capture start opens with the chosen pictures and an empty words field, `source` is `moment`, and Moments imports no recorder (N3) | P0 (c) |
| NS-53-R11 | Given a day the parent marked (NS-18, NS-46) or a past letter (NS-23), Then it shows in Moments by the 7.2 rule and never on both tabs | P1 |
| NS-53-R12 | Given a quiet or hidden book, Then nothing from it shows (NS-23-R8, R-IA-6) | P0 (a) |
| NS-53-R13 | Given the parent turns Moments off in Me, Then the on-phone index is removed and the tab shows M4 | P0 (a) |
| NS-53-R14 | Given airplane mode, Then Moments works the same (nothing needs the network) | P1 |
| NS-53-R15 | Given VoiceOver and AX5, Then each item is one element read as date then "picture, N of M" and never describes content (FR-PHS-70); the tab works at AX5 | P1 |
| NS-53-R16 | Given the founder's screenshots, Then no fixture, string, snapshot or doc in the repo holds a real name, place or picture from them; fixtures are Asha and synthetic | P0 (a) |

### 7.7 FR rows PROPOSED by function (each function file owns its own numbering and adds them)

| Function | Id | Row |
|---|---|---|
| photos-and-suggestions | FR-PHS-72 | The Moments tab reads the same moment engine as NS-51 (dates and counts only; ML-4, ML-13, ML-14 stand) and adds no second index |
| photos-and-suggestions | FR-PHS-73 | If fed by Apple's suggestions picker (level 2) the tab launches Apple's sheet and receives only what the parent picks; it reads no library (UNVERIFIED how the API behaves inside a tab; `mobile` feasibility doc decides) |
| privacy | FR-PRV-49 | Moments adds no persistent row beyond NS-51's index and decisions store; the permission act is recorded per 7.5 |
| privacy | FR-PRV-50 | Analytics: no event for a Moments item, tap, count or permission answer (NS-50-R17 pattern) |
| marketing | FR-MKT-45 | Value props in M0 and in store frames say what the parent does, never "we find your best moments"; no frame uses a real picture or a real place |
| legal and compliance | FR-LEG-xx | Counsel confirms the permission sentence and the App Privacy answer before any profile turns the flag on (id left for the function owner) |
| design-systems | IA-R12 (PROPOSED) | Four tabs change IA-R1, N1, N4 and J12 together, tested with five parents (J5) and a device pass (J11) |
| content | CR (id for `content`) | One glossary word for the tab; the Home versus Moments versus Book line; BRAND.md bans "journal" in prose |
| qa | FR-QA-xx | Device rows: limited, all, denied, iCloud-only, no pictures at all, an empty library of Asha fixtures only |
| reliability | FR-REL-xx | Foreground bounded read only; no background mode (FR-PHS-61) |

### 7.8 What I am not claiming

- I have not seen the founder's screenshots and have not read how Apple's suggestions picker behaves; "smarter than Apple's picker" is a goal, not a finding. The smarter parts proposed here are: it is ours and relevant to {child}'s days (marked days and past letters sit beside the pictures), and it hands off to the capture the parent already knows. The design concept document decides how it looks.
- Whether a first-run default tab of value props is better than Home is untested (J5, J11 are Open). Home stays the default in the first public build under Option A.
