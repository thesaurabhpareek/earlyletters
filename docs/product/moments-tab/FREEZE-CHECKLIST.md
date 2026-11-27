# NS-53 Moments tab: freeze checklist and harness hand-off

Status: PROPOSED (nothing here is decided; the founder signs each founder item)
Date: 21 Nov 2026
Owner: `product` (Chief Product Officer role, acting for Karma)
Spec: `docs/product/prd/28-moments-tab.md` v3 (301 rows, R1 to R301; section 27 records the 184 round 1 findings, section 27b the 104 hybrid findings, section 27c the 20 benchmark ids; section 3.4 the decisions D1 to D14 and KM1 to KM5)
Harness hand-off: `HARNESS-REPLAN-HYBRID.md` (replaces sections 2 and 3 below)
Load when: you freeze the Moments spec, hand it to the harness, or file its backlog and claim entries.

Fictional family Asha only. Every date below is PROPOSED and the founder's to set. D-121's target of Tue 1 Dec is UNVERIFIED as still current.

## 0. What is frozen, what is not

Said plainly, so nobody reads a freeze as more than it is.

- **Frozen: the row text.** The wording of the 301 rows R1 to R301 (Given, When, Then, layer, priority, phase, Satisfies) is what the freeze fixes. Ids stay stable.
- **NOT frozen: the PROPOSED row homes.** The PR home, gate home and device-or-script home of spec section 26b are the author's reading. `mobile` and `data-architect` still have to confirm them.
- **NOT frozen: sizes.** Every size and file count in section 19.4 and in `HARNESS-REPLAN-HYBRID.md` is ASSUMED.
- **NOT frozen: quality thresholds.** `BUSY_DAY`, `SESSION_GAP`, `RECENT_CAP`, `CANDIDATES`, the LRU size, the place radius, and the floors and margins of R204 are ASSUMED until G1a-L, G1b and the card sort set them as data.
- **NOT frozen: anything Apple UNVERIFIED.** Every Apple platform, App Review and licence fact keeps its UNVERIFIED label until the CCO or `regulatory-affairs` reads the source and a spike or counsel answer is on file.
- **NOT frozen: EX-ENG-4 is OPEN until G3-x.** Whether a per-profile autolinking exclusion really removes `scribe-library` from a profile with F2 off is UNVERIFIED until the G3-x read-out says which rule of R222 is live.
- **NOT frozen: the value proposition text.** The proposed value proposition, first-run promise and store story of spec 16.1 wait for the founder's answer on O-48. No public line uses them before that.

## 0a. Registers (what closes each item)

Sections 1.5 to 1.8 list every gate, every founder decision, every counsel question and the row ids v2 cited, each with an owner, the evidence that closes it and a status. Status words: OPEN (nothing on file), PROPOSED (text or default drafted, not decided), CLOSED (decided in the spec), PARKED, DELETED. Nothing here is DONE: no read-out, counsel answer or founder signature is on file at 21 Nov 2026.

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
| O-44 | Stored picture copies in the iPhone backup | Disclose, plus device row D-3 in G11 (the CLO prefers excluding the folder; spec Q7 = packet Q129 default; the founder chose disclose on 21 Nov 2026) | Before G2 |
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

Decided 21 Nov 2026 (decided by the executive council, approved by the founder, who said as relayed: "Decide for all 10 with exec team. I approve their decision. Same for 6 moments questions."; rulings `CPO-17` and `CPrivO-10` in `docs/agents/exec/RULINGS.md`, PR #1377). The table above and the status words in 1.6 are left as written; for these six this note wins:
1. O-01: Moments is the second of four tabs (Home, Moments, Book, Me); Home stays the landing tab.
2. O-37, O-39, O-52, RV-13, RV-17: the first release ships with the photo-library read (Route B) in 1.0, places and occasions in, faces and naming people out. The G6 guard (`g6-production-flags-off`, `store-flags.mjs`) is amended in the PR that adds the PHAsset use and its usage strings. Gates G1 to G11 apply before store submission, not before coding. O-37 (which slips if a gate is open) is not answered here.
3. RV-18, RV-19, O-42 (H-10): only the person's own photo metadata (date, place) is used; no machine-written scene, face or people label is shown or stored as the family's words.
4. O-44: keep ADR 0028 D1 and disclose it (device row D-3 stays).
5. O-02, O-03, O-50: no library-timed push and no Moments email in 1.0; both off.
6. O-48 in part: no whole-app "Data Not Collected" claim (CPrivO-10). The value proposition text stays PROPOSED; O-48 itself stays OPEN.

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

- [ ] The founder has answered, or accepted the default for, O-37, O-38, O-39, O-40, O-41, O-42, O-47, and the v3 items O-48, O-49, O-50, O-52 and the hybrid decisions D1 to D14 (D10 and D11 are founder-visible). O-44 is decided: the founder decided disclose (21 Nov 2026, O-44); G2 still waits on counsel's wording (packet Q129).
- [ ] A challenger who is neither the author nor a reviewer has read the freeze copy (the CAIO's conflict-of-interest note: an AI session reviewing an AI-written spec), starting with EXH-ENG-1, EXH-ENG-4 and EXH-ENG-7.
- [ ] The G1a-P simulator read-out is on file before 18b-1a is filed; the device read-out is on file before 18b-2 and 18c.
- [ ] The door's legal set (label, policy, Terms, backup line, `docs/legal` lines 54, 117, 127 and policy line 45) is drafted for counsel before any production profile carries the door (R278).
- [x] `EXPERIENCE-AND-MOTION.md` is read and folded (spec section 29); its open items O-56 to O-59 and O-27 await the founder.
- [ ] The CPO freeze review has regraded priorities (EX-CPO-5; the spec deferred the regrade so row ids stay stable).
- [ ] `legal` has the Moments section of packet 1.8.0 and the register rows of R239.
- [x] The "836 of 845" claim is withdrawn as a coverage figure (it only says an id is written next to a row) and replaced by the honest measures of spec sections 26 and 26b, recomputed by `node docs/product/moments-tab/row-homes.mjs` (21 Nov 2026: 301 rows; 260 with a PR home; 141 with a gate home; 293 with a PR or a gate; 20 not built with a reason; 0 orphans; 0 with an automated test; 71 naming a device or manual script). `node scripts/trace.mjs` reads card 28 only after PR #1313 merges; until then use the row-homes script. The PR and gate homes of 26b are PROPOSED and wait for a read by `mobile` and `data-architect`.
- [ ] `mobile` and `data-architect` have read the row homes of 26b and corrected any they disagree with; after PR #1313 merges, `node scripts/trace.mjs --no-write` is run and its NS-53 P0 untested count (203 of 203 expected today) is recorded.
- [ ] Content rules scan passes on the PRD (no em or en dashes, curly quotes, ellipsis characters or emoji).


### 1.5 Gate register (spec section 21; every date PROPOSED)

Evidence goes in `docs/release/<x.y.z>.md` as one dated line with a commit. Every gate is OPEN today.

| Gate | Owner | Evidence that closes it | Decide by | Status | If it fails |
|---|---|---|---|---|---|
| G1a-L Early device spike, library | `mobile` with the founder's phone | Written read-out of the six unknowns in 1.3 (timings and rates only); input to PR 9 | Fri 27 Nov, before PR 9 merges | OPEN | The named unknown stays unbuilt |
| G1a-P Picker spike, throwaway branch | `mobile`, founder's phone; `privacy` reads it | Dated read-out of unknowns (a) to (o) (yes or no, timings, rates); simulator part first, device part before 18b-2 and 18c | Simulator part now; device part Fri 27 Nov | OPEN | 18b-2 and 18c wait; modal picker still ships; door stays pictures-only |
| G1b Full device run | `mobile` with the founder's phone | Written read-out with iPhone SE 3 numbers (scan, thumbnails, zone change, Limited and Full, 20,000 item script library, place table size); ASSUMED thresholds set as data | Mon 30 Nov | OPEN | Affected part stays dark (O-37) |
| G2 Counsel read | `legal`, `privacy`, licensed counsel | A written answer from licensed counsel, with name and date, on each of Q1 to Q10 and sub-items (internal memo, agent review or silence does not count) | Mon 30 Nov | OPEN | Affected part stays dark |
| G3 Approval of READ_SET_V1, with sub-task G3-x | `privacy`, `security-architect` | Signed set (location member signed separately, R241; picker identifier member "none permitted"); G3-x read-out of the autolinking exclusion per profile | Mon 30 Nov | OPEN (G3-x UNVERIFIED until run) | Narrow the set; store none and ship "Not this one" only |
| G4 Five-parent check | `user-research` | Read-out against the section 20 bar, on city-level place lines (R219), with the v3 tasks T1 to T4 and the three primer variants | Mon 30 Nov | OPEN | Wording or design changes first; place lines off for that build if any parent did not expect it |
| G5 Accessibility pass | `qa`, `design-systems` | Device rows W1 to W12 pass on iPhone SE 3 (a) our frame, (b) task completion through Apple's picker, recorded on device | Mon 30 Nov | OPEN | No ship |
| G6 Content rules | `content` | `rules.test.ts` and glossary pass, plus the mode-scoped claim test and the D5-F4 absolute-claim scan on the host strings | Mon 30 Nov | OPEN | Fix the copy |
| G7 Real-iPhone checks | `qa`, founder's phone | Dated read-out (timings and rates only): permission states, Limited, revoke, zone change, cold-start tap, switcher and App lock snapshot (R232), restore with attached pictures (D-3, R235), Reduce Motion frame times, and the v3 picker rows | Mon 30 Nov | OPEN | F2 or the affected part stays off |
| G8 Place data flow (phase 2, not the first release) | licensed counsel, `privacy` | Written counsel answer and signed text, only if P-B (Apple geocoder) is wanted later | Not on the first-release path | OPEN (phase 2) | F3 stays off and uncompiled; P-A and P-C ship |
| G9 Suggestions (K-SUG) | licensed counsel, `privacy`, `security-architect` | Written answer, only if the founder asks | n/a (O-32: NOT PLANNED) | NOT PLANNED | K-SUG not built |
| G10 Founder signs | founder (`product` drafts the D-### entry as Proposed) | The D-### entry signed as four signatures plus RV-23 as a fifth | Mon 30 Nov | OPEN | The part is not built |
| G11a-lib Security read, library (F2) | `security-architect` with the CISO role | Dated line with a commit: lockfile and prebuild diff against `NATIVE_MODULE_GATE.md` items 1 to 3, binary and plist scan, source read of `scribe-library` | Mon 30 Nov | OPEN | The part stays dark |
| G11a-photo Security read, picker (F1) | `security-architect` with the CISO role | Dated line with a commit: source read of `scribe-picker`, scan list, plist, entitlements and privacy manifest diffs unchanged, device rows of R279; before the door's first store build | Before the door's first store build | OPEN | The door stays out of that build |
| G11b Place table provenance and licence | `mobile`, `legal`, CFO, CBO | Dated line with a commit: named dataset, licence text read by licensed counsel (Q10), attribution, size, binary or signed download, `docs/security/PLACE_TABLE.md` | Mon 30 Nov | OPEN | No places in the first release |
| G11c Data inventory | `data-architect` | Dated line with a commit: `DATA_CLASSIFICATION.md` 4.6 rows and data map row for the decisions store, merged with the code (R250); gains the temporary located original | Mon 30 Nov | OPEN | The part stays dark |
| G11d Store paperwork parity | `legal` with `privacy` | Dated line with a commit: label, policy, usage string, Notes for Review and privacy manifest match the production profile, evidence index in `docs/release/<x.y.z>.md` (R240); applies to the door as well as the library read | Mon 30 Nov | OPEN | The part stays dark |

### 1.6 Founder and owner decision register (spec section 23; one row per O-id)

"Closes it" for a founder item is the founder's dated one-line answer, recorded in the D-### entry or the exec rulings log. For an item owned by someone else it is that owner's ruling in the exec rulings log. Every default below the spec states is a recommendation and applies to docs and test builds only until answered. Status OPEN unless stated.

| Id | Owner | Subject | Closes it | Status |
|---|---|---|---|---|
| O-01 | Founder | Tab position | Founder answer, Tue 24 Nov | OPEN |
| O-02 | Founder | Library-timed local reminder (RV-08) | Founder answer before G2; F4 off until Q2 is answered | OPEN |
| O-03 | Founder | Lifecycle email (RV-09) | Founder answer, Fri 27 Nov | OPEN |
| O-04 | CPO | Daily-return claim as hypothesis | CPO ruling, Tue 24 Nov | OPEN |
| O-05 | Founder | When the library ask may appear | Founder answer, Fri 27 Nov | OPEN |
| O-06 | CPO | One Home pointer after first kept letter | CPO ruling with O-01 | OPEN |
| O-07 | Founder | Seasonal days beyond public holidays | Founder answer, Fri 27 Nov | OPEN |
| O-08 | CTO with privacy | Apple's title on Route A | Ruling, Tue 24 Nov | OPEN |
| O-09 | CTO with privacy | Index cache or date window rebuild | Ruling after G1 | OPEN |
| O-10 | none | Recent: lone pictures or qualifying days | Same question as O-12 | DELETED |
| O-11 | CPO | Age in months on a card | CPO ruling, Fri 27 Nov | OPEN |
| O-12 | CPO | Recent tiers versus one card per day | CPO ruling, Tue 24 Nov | OPEN |
| O-13 | Privacy and CTO at G3 | Stored picture identifier | Closed as No (R56 dropped, D6); founder may reverse | CLOSED |
| O-14 | Privacy and CTO at G3 | Album title verbatim | Closed (R57 dropped, D6); founder may reverse | CLOSED |
| O-15 | CTO with privacy | Approve READ_SET_V1 | G3 signature, Tue 24 Nov | OPEN |
| O-16 | Founder | Kept day recurs each year | Founder answer, Fri 27 Nov | OPEN |
| O-17 | Design | Choose-pictures row at head or foot | Design ruling | OPEN |
| O-18 | Founder | Permission result as analytics event | Founder answer before the registry change | OPEN |
| O-19 | CTO with privacy | After Keep, land on Book or Moments | Ruling, Tue 24 Nov | OPEN |
| O-20 | none | Shared book under Variant A | Parked until co-parent ships (D-162) | PARKED |
| O-21 | none | Country or region as coarser place | Superseded by 7a | DELETED |
| O-22 | Design | Where a notification tap lands | Design ruling, Tue 24 Nov | OPEN |
| O-23 | CPO | Any widget | CPO ruling after launch | OPEN |
| O-24 | Design | Haptics and sound | Design ruling before sign-off | OPEN |
| O-25 | Design | Lamp scene or plain paper | Design ruling | OPEN |
| O-26 | Design | A3 settle or A1 tokens | Design ruling | OPEN |
| O-27 | Design, founder | Card carries one thing into capture; tray flight | Design ruling, founder answer | OPEN |
| O-28 | CLO and counsel | Moments as a name in store text | Counsel (Q5) | OPEN |
| O-29 | Coordinator | Which reconciliation decisions the 21 Nov ruling closes | Coordinator housekeeping, not a founder matter | OPEN |
| O-30 | Founder | Face recognition or naming people | Founder, when he chooses; OUT by default | OPEN (not decided here) |
| O-31 | Founder | Offline city table only, or Apple geocoder too | Founder answer, Tue 24 Nov | OPEN |
| O-32 | Founder | K-SUG scene or event inference | Founder answer after the real-library card sort | OPEN (K-SUG NOT PLANNED) |
| O-33 | Founder | Which public holidays ship | Founder answer, Fri 27 Nov | OPEN |
| O-34 | Design | Place line on every card or only away | Design ruling | OPEN |
| O-35 | Founder | Recurring typed days, ticked Days, firsts | Founder answer, Fri 27 Nov | OPEN |
| O-36 | none | iOS floor 17.0 or 17.2 | Parked with Route A (phase 3), D-098 | PARKED |
| O-37 | Founder | Which slips if a gate is open | One-line answer Tue 24 Nov; invoked or not by Mon 30 Nov | OPEN |
| O-38 | Founder | `source: moment` enum | Answer before the registry change | OPEN |
| O-39 | Founder | CPO cut list and F2a/F2b split | Answer, Tue 24 Nov | OPEN |
| O-40 | Founder | Engage licensed counsel (spend) | Answer and cap, Tue 24 Nov | OPEN |
| O-41 | Founder | Store screenshots and the tab bar | Answer, Fri 27 Nov | OPEN |
| O-42 | Founder | RV-01 to RV-22 as four signatures | Answer with G10 | OPEN |
| O-43 | Chief Design Officer | For you and Recent switch | Design ruling | OPEN |
| O-44 | Founder with Privacy | Picture copies in iPhone backup | Decided: disclose (founder, 21 Nov 2026, O-44). G2 still waits on counsel's wording (packet Q129) | DECIDED, WORDING OPEN |
| O-45 | Founder | Postal address for lifecycle email | Answer with O-47; phase 2 | OPEN |
| O-46 | Founder | Numbers of the measurable and the stop line | Answer before PR 16 | OPEN |
| O-47 | Founder | Entity and individual publisher | Answer, Fri 27 Nov | OPEN |
| O-48 | Founder | Value proposition, first-run promise, store story (16.1) | Founder approval before PR 12 content freezes and before any public line; counsel must confirm | OPEN |
| O-49 | Founder | Enum for how a letter was started | Answer with O-38 | OPEN |
| O-50 | Founder, with product and privacy | No child name or month number on Moments push and email | Answer before any Moments push copy is final | OPEN |
| O-51 | CPO | Apple Journaling Suggestions (Route A) | CPO ruling after the F2a read-out | OPEN |
| O-52 | CPO, founder told | Does the door pull the photo flag in | CPO ruling before PR 18b-1a merges | OPEN |
| O-53 | Chief Design Officer | Host sheet Layout A or B | Design ruling after G1a-P | OPEN |
| O-54 | Engineering lead with `content` | Per-type limit approach | Ruling after G1a-P, before 18b-1a strings | OPEN |
| O-55 | Founder with `content` | Primer wording A or B | Answer with G4 | OPEN |
| O-56 | Founder, with CPO and Design | Picker door in the never-asked state (and R106, R120, R144, R253 PROPOSED changes) | Answer before PR 14 and PR 17 are filed | OPEN |
| O-57 | Chief Design Officer | Host sheet Layout A, B or C | Design ruling after G1a-P (DM-02) | OPEN |
| O-58 | Design, founder for O-27 | Token `motion.carry` | With O-27; not added until yes | OPEN |
| O-59 | `content` with the founder | "Not now" or "Not this one" on the card face | Answer before PR 12 words freeze | OPEN |
| O-60 | Founder (the label), with Karma | `size:accepted` label for PR 0 | Label applied with a `Size exception:` body line before PR 0 merges | OPEN |
| O-61 | Founder or Karma under CR-73; `security-architect` reads | Paste the second `ios-compile` leg (F2 on) | Pasted before PR 9 or PR 11c merges | OPEN |

Also founder-facing and not O-ids: RV-23 (the door as a fifth signature at G10), the hybrid decisions D1 to D14 and KM1 to KM5 (spec 3.4; D10 and D11 are founder-visible), and any spend (spec 21.2).

### 1.7 Counsel register (spec section 21.3)

An item closes only on a written answer from licensed counsel with name and date, filed in `docs/release/<x.y.z>.md`; owner for all is `legal` with `privacy` and licensed counsel; status OPEN for all because counsel is not yet engaged (W0-13, O-40). The spec numbers the questions Q1 to Q10 with sub-items; there is no Q11.

| Q | Blocks | Stays dark if silent |
|---|---|---|
| Q1 (and Q1 c, Q1 d) | G2 | Part stays dark; label and policy not changed |
| Q2 | G2 | F4 off |
| Q3 | G2, G3 | Place lines off, date-only cards |
| Q4 (and Q4 b) | G2, G3 | Date-only cards |
| Q5 | O-28, R194 | Fallback label in screenshots |
| Q6 (and Q6 b) | G2 | Terms 4.2.0 not published; library read waits |
| Q7 (and Q7 b) | G2 | Exclude the folder from backup, with a carve-out sentence |
| Q8 (and Q8 b) | G2 | Say what we receive, never where it lives (H-11) |
| Q9 | G10 | Founder starts an entity in parallel |
| Q10 | G11b | No places; P-B not built |

Numbering note: this spec numbers its counsel questions Q1 to Q10 (no Q11). The counsel packet in PR #1316 (`docs/legal/COUNSEL_PACKET.md` section 9.2) numbers the same ten as packet Q123 to Q132: spec Q1..Q10 = packet Q123..Q132 (so spec Q2 = packet Q124 and spec Q8 = packet Q130). Those packet rows exist in #1316 and are not on this branch until it merges. R135 now cites spec Q2 and spec Q8 with the packet number in brackets. Use the spec numbers in this checklist; the packet numbers are the cross-reference.

### 1.8 Row ids the v2 checklist cited and v3 dropped from its text

Home columns are the PROPOSED homes of spec 26b (not frozen, see section 0). All 36 rows keep their text; this table only restores the pointer. R255 is DROPPED (D6).

| Row | What it says (start) | Pri | PR home | Gate home |
|---|---|---|---|---|
| R1 | the Moments flag on, When any build runs, Then the bar is Home, Moments, Book, Me in (cut) | P0 (c) | 6 | G10 |
| R11 | any source, Then no card shows a machine-made title, caption, summary, story, mood, (cut) | P0 (a) | 12, 13 | G6 |
| R16 | any card, Then its date heading is the weekday and date in the parent's locale (cut) | P0 (a) | 4, 13 | none |
| R17 | a machine label, Then it renders in the machine slot and type style of R201, never in (cut) | P0 (a) | 13, 21 | G10 |
| R36 | the source registry (`momentsFor`), Then each source lists its surfaces as data (cut) | P0 (a) | 4 | none |
| R37 | the library module, When it scans, Then it reads only the closed `READ_SET_V1` (local (cut) | P0 (a) | 9 | G3, G1a-L |
| R59 | the golden fixture `asha-lib-v1`, Then the output equals the committed golden for all (cut) | P0 (a) | 2 | none |
| R107 | all fixtures, Then every picture and video is generated by script (Asha, synthetic) (cut) | P0 (a) | 2, 24 | none |
| R110 | the native contract, Then it is one iOS-only optional module with the closed functions (cut) | P0 (a) | 9, 10, 18 | none |
| R171 | F2 is set on, When the release owner prepares the build, Then each gate G1b to G7, G10 (cut) | P0 (b) | 11b, 25b | G1b, G7, G10, G11a-lib |
| R172 | the router, Then the Moments tab is a tab screen under `(tabs)`, `moments/pick` is one (cut) | P0 (c) | 6 | none |
| R192 | the primer, the purpose string, the Me row and the Notes for Review, Then each names (cut) | P0 (a) | 12 | G2, G6 |
| R201 | the card model, Then it has two disjoint fields, `machineLines` (closed kinds: reason, (cut) | P0 (a) | 4, 13 | none |
| R204 | the place resolver, Then the pass bars are written before G1a runs: abstain over (cut) | P0 (a) | 5 | G1a-L, G1b |
| R208 | any card, Then no text sits over a photo except (a) one duration mark on a video tile (cut) | P0 (c) | 13 | G5 |
| R215 | the fourth tab, Then it sits on today's paper bar, `tabLabel` is a token, the Large (cut) | P1 | 6 | G5 |
| R220 | the native contract, Then `scribe-library` exposes exactly these functions and no (cut) | P0 (a) | 9, 10, 18 | none |
| R221 | `moments.json` (17.1), Then it has `{v, owner, dayKeys[], labels{}, hiddenPlaces[], (cut) | P0 (a) | 8 | none |
| R222 | any build, Then ONE rule holds (v3 fix CH-ENG-4, which resolves the contradiction of (cut) | P0 (b) | 11b, 11c, 25b | G3-x |
| R223 | the fetch, Then it returns the UTC offset in seconds per asset from the system (cut) | P0 (c) | 2, 9 | none |
| R225 | the test plan, Then an N layer exists: a generated Asha library script (synthetic (cut) | P1 | 24 | none |
| R226 | the source scans, Then one scan script has a path scope (`modules/scribe-library`, (cut) | P0 (a) | 11b | none |
| R228 | the place read, Then the table lookup runs in Swift inside `scribe-library` (the table (cut) | P0 (a) | 5b, 9 | G1a-L |
| R232 | a borrowed or shared unlocked phone, Then Moments follows App lock exactly as the Book (cut) | P0 (a) | 15, 17 | G7 |
| R233 | the permission API grants write access we do not use, Then a source scan for (cut) | P0 (b) | 11b | G11a-lib |
| R236 | the release profile, Then the Apple geocoder adapter is not compiled in (a build-time (cut) | P0 (b) | 11b, 11c | G11a-lib |
| R238 | the counsel packet 1.8.0, Then a Moments section lists the questions of 21.3 with the (cut) | P0 (b) | none | G2 |
| R245 | the decisions store (17.2), Then each field has an expiry rule, a maximum count (cut) | P0 (a) | 8 | none |
| R246 | revoke, downgrade and turn off, Then three operations are defined: (1) revoke or (cut) | P0 (a) | 8, 21 | none |
| R253 | a book that is quiet, hidden, in a hard stretch or expecting-only, or any visible book (cut) | P0 (a) | 4, 15 | none |
| R254 | a place line, Then place themes (runs of days) appear only in Recent and never in For (cut) | P0 (a) | 4, 22 | none |
| R255 | DROPPED with R56 (v3, D6; "Hide this day" in the card menu replaces it, R275). Was: (cut) | P1 | none | none (not built: DROPPED with R56 (D6); "Hide this day" (R275) replaces it) |
| R257 | the canary test of R162, Then it also covers the attach pipeline, Keep, the outbox, (cut) | P0 (a) | 19, 24 | none |
| R262 | the gates, Then each of G1b, G2, G3, G5, G7, G10 and G11 has a decide-by date (21.1), (cut) | P0 (b) | none | G1b, G2, G3, G5, G7, G10, G11a-lib |
| R265 | a notification tap or a link, Then `typedDay`, `birthday` and `monthAge` taps land on (cut) | P0 (c) | 23 | none |
| R267 | the OPEN rows O-09, O-11, O-12, O-13, O-14, O-16, O-34 and O-35, Then the engine takes (cut) | P1 | 1, 2, 4, 5 | none |

## 2. Harness hand-off summary

Replaced for v3: see `HARNESS-REPLAN-HYBRID.md` (the first 21 Nov 2026 PR list in five waves, before the design closure fold of the same day added 6b and 19c and before 3c on 22 Nov; see spec 19.4 for the current count and size; what can start now; what must wait; replacement text for BL-1432 to BL-1438 and one new row for `scribe-picker`). In one line: PR 0, PRs 1 to 4, PR 5 with a synthetic table, PRs 6, 8 and 12, PR 18a and the simulator picker spike can start now; PR 9 waits for G1a-L and G3; 18b-1a waits for the simulator read-out; 18b-2 and 18c wait for the device read-outs; the door ships only with the photo flag's legal set.

## 3. Proposed backlog and claim entries (text only)

The v2 placeholder entries BL-NEW-1 to BL-NEW-7 were filed as BL-1432 to BL-1438 in PR #1296. The v3 replacement text for those rows and the new `scribe-picker` row (BL-NEW-8) are in `HARNESS-REPLAN-HYBRID.md` section 3. The claim entries of v2 stand with one addition for the picker module: `moments-picker | mobile | feat/mobile-moments-picker | (PR) | apps/mobile/modules/scribe-picker/**, apps/mobile/src/lib/photos/* (picker logic only) | <claim time UTC> | <claim time + 72h> | BL-NEW-8; scribe-photo is not edited`.

## 4. What this branch did not do

No PR was opened, nothing was merged, and nothing went to `develop` or `main`. `docs/BACKLOG.md`, `docs/agents/CLAIMS.md`, `docs/legal/**` and `packages/content/BRAND.md` are untouched. No code, migration or decision entry was written. The trace script was not re-run in a form that checks lead-document coverage. Every legal and store-rule fact keeps the reviewer's label and stays UNVERIFIED until the CCO or `regulatory-affairs` reads it.
