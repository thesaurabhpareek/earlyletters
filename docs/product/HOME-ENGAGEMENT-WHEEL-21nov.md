# Home engagement wheel: what Home shows each day, and how Home differs from Book

Status: PROPOSED (nothing here is decided, built or recorded in `DECISIONS.md`) | 21 Nov 2026 | Owner: `product` | Docs only | Answers the founder question of 21 Nov: did requirements account for photo access, and for a Home that picks which memories, photos, videos or occasions to nudge a parent to speak or write about, so that Home and Book do not look the same.

Fictional family: Asha only. Words in quotes are intent for `content`, never final copy. UNVERIFIED marks anything I did not read in a source. I read these files in a depth 1 clone at `86eccfa` of `develop`; I could not read the Project doc `infra/cto-rulings-2026-11-10-memory-library.md` from this run (no Projects tool), so ML-1 to ML-12 are not quoted here. The repo carries ML-4, ML-13 and ML-14 (`docs/roadmap/next/03-requirements/NX-39-council-record-10nov.md` section 8.1) and the engineer's ten rulings in section 8; I cite those only.

## 1. Plain answers

**Question 2: is there ONE place that defines what Home shows each day?** No. The pieces exist and are good, but they are spread over seven files and none says "on this day, Home shows X". The gap, named:

- G1. The slip slot has one order (NS-50-R5, `docs/product/prd/21-days-cultural-photos-home.md`): waiting set, seal-opened, a day the parent chose, Save a copy, the Days ask, one past letter. That is a priority list for ONE slot. It is not a wheel: it does not say how a parent with no marked day and no past letter gets anything new on day 30.
- G2. NS-50 says so itself: "on a day with nothing marked, Home is unchanged by this card", and the spec says Home's weakness is "a stale second visit" (`docs/product/prd/22-final-holistic-spec.md` section 3). Whether Home is enough as the default tab is left to a five parent check (NS-50-R13), not to a rule.
- G3. Photo sources are placed by three documents that disagree on where they show. NS-49-R1, NS-50-R10 and NS-51 section 3 say the capture cluster menu only, never a Home slip, tile or strip (R-IA-3). The older Memory Library spec (NX-39, BL-873 in `docs/BACKLOG.md`) said "Tonight and the composer shelf are the only surfaces" and the IA spec (`docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` 3.1) allows one day card ML-S10 in the memory slip position. Nobody has ruled which wins now.
- G4. "A parent-labelled story" has no source row at all. NS-01 and NS-52 cover a picture the parent picks and their own words; nothing names a prior parent label (for example the "From your phone" editable label, Q-FD-30) as something Home may reuse to start a letter.
- G5. Home versus Book is defined by verbs (Home "say", Book "read", Me "look after", J1 to J4, J12 in the 12 line review, section 11 of the IA spec) and by IA-R9 (Home lists no kept letters). That holds, but J5 (five parent read of the headings) and J11 (device pass) are still Open, and nothing states the difference at day 30 or at 80 letters.
- G6. No requirement ties the sources together under the constitution checks once (no caption, no scene or place guess, no count or gap, nothing implies AI writes). They are scattered through NS-49, NS-51, FR-PHS-43 and FR-PHS-60.

**Question 3: what can the first public store build do?** Honest version:

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
| NS-51 photo moments (level 3) | `27-photo-moments-and-media.md` | Dates only, on the phone, opt-in from Me; a third menu item in the cluster; one budgeted neutral reminder |
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

Q-HEW-1 (one question, deadline proposed). Should library-derived nudges (NS-51 photo moments, level 3) move earlier than drop C, that is, be built into a 1.x build before 1.0 approval?

- Recommendation: No. Keep drop C. Move the device spike (BL-843, a founder device step) and the counsel read (BL-841) earlier, so that drop C can start the day 1.0 is approved. For the first public build make the wheel honest with sources 1 to 4 and 7 (picker, typed days, ticked days, one past letter, prompt) and ship Home's job line. Reason: a library read adds a Photos permission string, a changed App Privacy answer, a children's pictures counsel read (X2), and a review risk right when the first build needs to pass App Review, with no evidence yet from our families (NS-51 section 2).
- Default if unanswered: drop C stands, spike first (Q-PM-7).
- Deadline: PROPOSED Mon 24 Nov 2026, so that the spike can be scheduled before Build 13 freeze. UNVERIFIED: I have not read the Build 13 freeze date.
- Cost of saying yes: reword BL-1305 and FR-PHS-40 for a flagged build, add the usage string to one profile only, and take the counsel read onto the critical path before submission.

Q-HEW-2 (for Karma, not the founder). Rule between NS-50-R10 and NX-39 BL-873 / ML-S10 on where a library moment may show (cluster menu only, as NS-51 says, or also one day card), and reword BL-1305 ("any 1.x build") to match the drop C line.

## 6. Not done and not claimed

- I did not read ML-1 to ML-12 (Project doc not reachable here) and did not read code. No statement here is a finding about what is built; "built" claims come from the reviews quoted in `22-final-holistic-spec.md` section 4.
- No backlog task is added or changed in this PR. If the founder accepts this wheel, `product` will add tasks: a single Home source registry row (extends BL-963), the parent-label ruling (G4), and the BL-1305 reword.
- Day 30 and day 80 states are derived from the cited rules; no parent has seen them.
