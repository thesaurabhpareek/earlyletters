# NS-53 Moments tab: freeze checklist and harness hand-off

Status: PROPOSED (nothing here is decided; the founder signs each founder item)
Date: 21 Nov 2026
Owner: `product` (Chief Product Officer role, acting for Karma)
Spec: `docs/product/prd/28-moments-tab.md` v3 (301 rows, R1 to R301; section 27 records the 184 round 1 findings, section 27b the 104 hybrid findings, section 27c the 20 benchmark ids; section 3.4 the decisions D1 to D14 and KM1 to KM5)
Harness hand-off: `HARNESS-REPLAN-HYBRID.md` (replaces sections 2 and 3 below)
Load when: you freeze the Moments spec, hand it to the harness, or file its backlog and claim entries.

Fictional family Asha only. Every date below is PROPOSED and the founder's to set. D-121's target of Tue 1 Dec is UNVERIFIED as still current.

## 1. What remains before freeze

The spec is freeze-ready in the sense that no BLOCKER is open without either an edit or a founder question carrying a recommended default. Three kinds of item remain, and none of them is something the spec can close alone.

### 1.1 Founder-only decisions (each with the default the spec already follows)

| Id | Decision | Recommended default | By (PROPOSED) |
|---|---|---|---|
| O-37 | Which slips if a library gate is open: the date, or only the library read | The library read only for G2 and G8 (written licensed-counsel answers); the date for everything else; silence from counsel is never a pass | Tue 24 Nov; invoked or not by Mon 30 Nov |
| O-38 | Send `source: moment` as an analytics enum | Do not send in the first release (R87 stands); G-2 is read from App Store Connect cohorts, the device row and the diary | Before the registry change |
| O-39 | The CPO cut list and the F2a/F2b flag split | Split F2; adopt the cut list of section 23.2 (applied to no row's priority by the spec) | Tue 24 Nov |
| O-40 | Engage licensed California counsel (spend) | A capped brief on the ten questions of section 21.3 | Tue 24 Nov |
| O-47 | Entity and individual publisher, with Moments in the decision | Decide before D-004 on Fri 27 Nov; if counsel is silent, start the entity in parallel | Fri 27 Nov |
| O-41 | Store screenshots: hide the tab bar or wait for trademark clearance | Hide the tab bar in every frame | Fri 27 Nov |
| O-32 | Special occasions: dates we know, or also events recognised from pictures (K-SUG) | Dates we know; K-SUG NOT PLANNED | With G10 |
| O-30 | Faces and naming people | OUT, not decided here | When the founder chooses |
| O-44 | Stored picture copies in the iPhone backup | Disclose, plus device row D-3 in G11 (the CLO prefers excluding the folder; counsel Q7 default) | Before G2 |
| O-45 | Postal address for the lifecycle email | Decide with O-47; phase 2 only | With O-47 |
| O-46 | Numbers for the measurable and the stop line (section 20.1) | Founder sets them | Before PR 16 |
| O-42 | Sign RV-01 to RV-22 as four signatures, with H-10 (the machine-label boundary) in the third | Four signatures | With G10 |
| O-01 | Tab position | Home landing, Moments second | Tue 24 Nov |
| O-02, O-03, O-05, O-07, O-16, O-18, O-33, O-35 | The older founder-only questions of section 23 | The defaults in section 23 | Per section 23 |
| O-48 | Approve the proposed value proposition, first-run promise for three states and store story (section 16.1; founder-only: what a user is promised; counsel must confirm) | The proposed text; primer A with B as challenger (O-55) | Before PR 12 content freezes |
| O-49 | A closed enum for how a letter was started (picker, card, capture) | Do not send in the first release; two diary questions instead | With O-38 |
| O-50 | Moments-class push and email: no child name or month number on every setting, against the shipped planner (names-on variants), which needs a code change | The stricter reading; code change row R280 | Before any Moments push copy is final |
| O-52 | Does the picker door pull the photo flag into the Moments release or wait for the photo flag's own build (CPO scope, founder told) | The door ships only with the photo flag's legal set in the same build | Before PR 18b-1a merges |
| RV-23 | The picker door as its own reversal at G10 (a fifth signature) | Sign with G10 | With G10 |
| Hybrid decisions D1 to D14, KM1 to KM5 | Karma's decisions (spec 3.4) that the founder confirms or overrides, including: picker in a sheet, never the tab body; door only after a No; R56 and R57 dropped; viewer reduced, not deferred; the library read stays in 1.0 | The decisions as written | With G10 |
| Spend | Any spend at all (counsel, dataset licence, entity, insurance, builds, email allowance) | None unless the founder signs a row of section 21.2 | n/a |

Items that are not the founder's (owner and default are in section 23): O-04, O-06, O-08, O-09, O-11, O-12, O-15, O-17, O-19, O-22 to O-28, O-34, O-43 (Chief Design Officer: keep the For you and Recent switch), O-51 (CPO: evaluate Apple Journaling Suggestions after the F2a read-out), O-53 (Chief Design Officer: Layout A or B for the host sheet, default B until the picker spike), O-54 (engineering lead with `content`: per-type limit approach, default one total cap).

Closed by the hybrid edit: O-13 and O-14 (R56 and R57 dropped, D6).

### 1.2 Counsel items (a written answer from licensed counsel, with name and date, or the part stays dark)

| Q | Question in short | Stays dark if silent |
|---|---|---|
| 1 | Label and consent for a build that reads dates and coordinates on the phone with servers on | The label and policy are not changed; the library read waits |
| 2 | Picture-timed reminders (4.5.4, 5.1.2(vi), both readings) | F4 off |
| 3 | Naming a city from picture location; the in-memory home place | Place lines |
| 4 | DPLA 3.3.3(F) and location in a library picture; readable under Limited | Place lines |
| 5 | Trademark attorney: Moments as a tab label (classes 9, 42, 45) and in screenshots | Fallback label in screenshots (O-28, R194) |
| 6 | Terms: other people's children, approximate labels, knowledge duty | Terms 4.2.0 not published; the library read waits |
| 7 | Deletion promise versus a picture copy in an iPhone backup | Exclude the folder from backup, with a carve-out sentence |
| 8 | Policy mechanics and absolute sentences | Say what we receive, never where it lives (H-11) |
| 9 | Publisher and liability (5.1.1(ix), entity, cover, public address) | Founder starts an entity in parallel |
| 10 | Place dataset licence for a paid app; later geocoder caching | No places in the first release |

Sub-items added by the hybrid review (no Q11): Q1 (c) Apple's first-time picker text beside our primer, (d) the stored copy of a picked picture and the Photos or Videos row; Q4 (b) handling a GPS-bearing picked file only to read its date and re-encode it without location; Q6 (b) Terms for pictures the parent picks, including other people's children; Q7 (b) temporary copies and the system iCloud download after a pick; Q8 (b) mode-scoped sentences. The picker door is independent of Q1 to Q4 and Q10 (counsel must confirm that reading) but NOT of Q5, Q6, Q7 and Q9, nor of the photo flag's legal set: the label row, Privacy Policy picture lines, Terms picture lines and the backup line say what the build does in the same build, and `app-store-privacy-labels.md` lines 54, 117 and 127 and policy line 45 are corrected (R278). `legal` re-reads DPLA 3.3.3 in full before G2 and records the version date.

Also owed before any servers-on store build links the policy: the founder corrects the build list of Privacy Policy 3.0.0 (line 21 and the label contradictions; R266). The counsel packet is not yet engaged (W0-13); the Moments section of packet 1.8.0 is drafted by `legal`.

### 1.3 Device spikes: G1a-L (library) and G1a-P (picker)

Split (D8). Both use an Asha library built for the purpose (synthetic dates and coordinates; no real family library; a real-library pass, if wanted, is the founder on his own phone with no screenshots). Read-outs hold timings, rates and yes or no only; no place, date, count or album.

G1a-L, first week, before PR 9 merges (founder's phone or a simulator with a script-made library):

1. Is `asset.location` readable under Limited access, and without a Core Location permission.
2. The source-type default, the subtype predicate and the delivery options.
3. What the default fetch does with the hidden album and Recently Deleted.
4. The iCloud-only skip.
5. The place table size and accuracy against the bars of R204 (zero wrong-country on at least 100 geotagged pictures, a wrong-city ceiling the founder sets).
6. Whether a Favorites flag is readable under a limited selection (UNVERIFIED).

G1a-P, picker spike, a throwaway branch never merged; the simulator part starts now, one founder-phone session for the rest; on iOS 17.0 and on an iPhone SE 3:

1. The hidden-bars control matrix: for each of {bars shown, top bar hidden, bottom bar hidden, both hidden}, under None, Limited and Full, in light and dark, which of Albums, search, Options, Cancel, Add, the privacy badge and the first-time text are reachable. Decides Layout A (hide Apple's bars) or Layout B (keep the top bar), O-53. Never hide Options.
2. Apple's first-time text per access state, its exact words, light, dark and AX5, and whether it shows under Full access (the inline host waits on this).
3. Picks under Limited, including picks outside the limited set: do they load, and does the identifier question vanish with the plain picker.
4. What the item provider gives for date and GPS per access state and per type (HEIC, JPEG, a saved image with no date), with and without Apple's remove-location option (iOS 27 and later only, optional defence in depth).
5. Per-type limits (6 pictures, 2 videos): can a mixed limit be enforced live, what the picker shows at the limit, whether it shows a count anywhere (decides O-54).
6. VoiceOver, Voice Control and Switch Control task completion: choose, see, remove, Start (a pass bar at G5).
7. iCloud-only items, eight concurrent downloads, backgrounding mid-download; memory and time on an iPhone SE 3 with the inline host and our views.
8. App lock, the app-switcher snapshot with the picker open, and a sheet closed by code answering Cancel.
9. The inline view inside a sheet: drag-to-dismiss against the picker's scroll; AX5 with the keyboard and the safe area; theme override honoured by the picker; which of the SwiftUI view and the UIKit child controller is smaller and steadier.
10. A video pick under Expo defaults for SDK 57: any surprise permission prompt (UNVERIFIED); what a video container keeps for location; Live Photos as a still only.

Also before 18b-1a: `mobile` reads Apple's `PHPickerConfiguration`, `PHPickerViewController` and `PhotosPicker` reference pages and records the date and answers.

The spike must not use the D7 prototype for places: that prototype draws venue-level labels and is redrawn at city level first (R219).

### 1.3a Pending inputs not yet landed

- `EXPERIENCE-AND-MOTION.md` has landed (`docs/product/moments-tab/`, with the prototype under `docs/design/moments-tab/prototype/`). Spec section 29 summarises it; the two row edits it flagged (5.3, R186) are applied; its open items are O-27 (extended) and O-56 to O-59. Its R144, R106, R120 and R253 row changes are applied as PROPOSED text (fix pass), each with its founder-decision id (O-27 with O-58, O-56, O-56 with O-48, D2 with O-56) and none in force until answered; the contradictions found on the re-read are C-45 to C-53 and spec 14.6.
- The market benchmark landed (`MARKET-BENCHMARK.md`, `origin/wip/moments-benchmark`, head 18c27847) and is folded in (spec 27c, experiments E8 to E11).
- An independent challenger read of EXH-ENG-1, EXH-ENG-4 and EXH-ENG-7 (see `HARNESS-REPLAN-HYBRID.md` section 4).

### 1.4 Freeze exit checks

- [ ] The founder has answered, or accepted the default for, O-37, O-38, O-39, O-40, O-41, O-42, O-44, O-47, and the v3 items O-48, O-49, O-50, O-52 and the hybrid decisions D1 to D14 (D10 and D11 are founder-visible).
- [ ] A challenger who is neither the author nor a reviewer has read the freeze copy (the CAIO's conflict-of-interest note: an AI session reviewing an AI-written spec), starting with EXH-ENG-1, EXH-ENG-4 and EXH-ENG-7.
- [ ] The G1a-P simulator read-out is on file before 18b-1a is filed; the device read-out is on file before 18b-2 and 18c.
- [ ] The door's legal set (label, policy, Terms, backup line, `docs/legal` lines 54, 117, 127 and policy line 45) is drafted for counsel before any production profile carries the door (R278).
- [x] `EXPERIENCE-AND-MOTION.md` is read and folded (spec section 29); its open items O-56 to O-59 and O-27 await the founder.
- [ ] The CPO freeze review has regraded priorities (EX-CPO-5; the spec deferred the regrade so row ids stay stable).
- [ ] `legal` has the Moments section of packet 1.8.0 and the register rows of R239.
- [x] The "836 of 845" claim is withdrawn as a coverage figure (it only says an id is written next to a row) and replaced by the honest measures of spec sections 26 and 26b, recomputed by `node docs/product/moments-tab/row-homes.mjs` (21 Nov 2026: 301 rows; 259 with a PR home; 141 with a gate home; 293 with a PR or a gate; 20 not built with a reason; 0 orphans; 0 with an automated test; 70 naming a device or manual script). `node scripts/trace.mjs` reads card 28 only after PR #1313 merges; until then use the row-homes script. The PR and gate homes of 26b are PROPOSED and wait for a read by `mobile` and `data-architect`.
- [ ] `mobile` and `data-architect` have read the row homes of 26b and corrected any they disagree with; after PR #1313 merges, `node scripts/trace.mjs --no-write` is run and its NS-53 P0 untested count (203 of 203 expected today) is recorded.
- [ ] Content rules scan passes on the PRD (no em or en dashes, curly quotes, ellipsis characters or emoji).

## 2. Harness hand-off summary

Replaced for v3: see `HARNESS-REPLAN-HYBRID.md` (33 items in five waves, about 8,560 changed lines ASSUMED; what can start now; what must wait; replacement text for BL-1432 to BL-1438 and one new row for `scribe-picker`). In one line: PR 0, PRs 1 to 4, PR 5 with a synthetic table, PRs 6, 8 and 12, PR 18a and the simulator picker spike can start now; PR 9 waits for G1a-L and G3; 18b-1a waits for the simulator read-out; 18b-2 and 18c wait for the device read-outs; the door ships only with the photo flag's legal set.

## 3. Proposed backlog and claim entries (text only)

The v2 placeholder entries BL-NEW-1 to BL-NEW-7 were filed as BL-1432 to BL-1438 in PR #1296. The v3 replacement text for those rows and the new `scribe-picker` row (BL-NEW-8) are in `HARNESS-REPLAN-HYBRID.md` section 3. The claim entries of v2 stand with one addition for the picker module: `moments-picker | mobile | feat/mobile-moments-picker | (PR) | apps/mobile/modules/scribe-picker/**, apps/mobile/src/lib/photos/* (picker logic only) | <claim time UTC> | <claim time + 72h> | BL-NEW-8; scribe-photo is not edited`.

## 4. What this branch did not do

No PR was opened, nothing was merged, and nothing went to `develop` or `main`. `docs/BACKLOG.md`, `docs/agents/CLAIMS.md`, `docs/legal/**` and `packages/content/BRAND.md` are untouched. No code, migration or decision entry was written. The trace script was not re-run in a form that checks lead-document coverage. Every legal and store-rule fact keeps the reviewer's label and stays UNVERIFIED until the CCO or `regulatory-affairs` reads it.
