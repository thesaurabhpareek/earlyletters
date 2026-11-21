# NS-53 Moments tab: hybrid picker delta

Status: PROPOSED (a delta against the frozen-candidate spec; nothing here is decided; the PRD is not edited)
Date: 21 Nov 2026
Owner: `product`
Spec: `docs/product/prd/28-moments-tab.md` (268 rows, R1 to R268), `FREEZE-CHECKLIST.md`, exec reviews on `wip/moments-review-<role>`
Load when: you re-scope the first Moments release to the hybrid route, or file backlog rows for it.

Fictional family Asha only. Labels: SOURCE-READ means I read the text this session (named). UNVERIFIED means I did not read the primary text. Every legal and store-rule statement below is UNVERIFIED unless marked SOURCE-READ.

## 0. Which ruling this follows

An earlier draft of this delta (file name `PICKER-ROUTE-DELTA.md`, picker only, no library read) is replaced. The coordinator relayed the founder's correction: the library-read ruling of 21 Nov is NOT reversed. The first release still ships the library read (Route B, Limited honoured), places and occasions in, faces and people out (O-30). The new direction is a hybrid: the library read powers the proactive For you cards, Recent, place and date lines and (phase 2) the library-timed reminder; Apple's photo picker, embedded inline where it can be, replaces the browse surfaces we would otherwise build (album chooser, an all-pictures grid, part of the viewer) and is the working path when a parent declines or limits library access. The constitution, the Moments name, no machine titles, no counts, gaps or streaks, and "not now equals Continue in weight" are unchanged.

Read this as a small delta. Most of the spec stands. The honest size of the change is in section 7: effort is roughly neutral; the gains are a narrower surface to review, a stronger no-permission path and a better App Review story, not a big saving.

## 1. What the picker is, and what it needs (what I read, and what I did not)

Sources read this session: the WWDC23 session "Embed the Photos picker in your app" (developer.apple.com/wwdc23/10107; I read it through a page summary, not a full transcript), and an Apple developer forum thread on PHPicker metadata (developer.apple.com/forums/thread/660696; a forum thread, including one Apple engineer reply, is not API documentation). I did NOT read the PHPickerViewController or PHPickerConfiguration reference pages, the PhotosPicker SwiftUI reference, or the App Review Guidelines in this pass.

| Question | What I found | Label |
|---|---|---|
| Does the picker need photo library authorization? | The session says you do not need to request any photo library access to use it, and Apple asks developers to avoid requesting library access unless really necessary. | SOURCE-READ (WWDC23 10107, summary) |
| Does it work with library authorization too (Full, Limited)? | Yes in practice: the forum thread shows picks working under Limited access, including a picked photo that was outside the limited set. Apple's own statement on how the picker behaves under Limited access was not on the page I read. | Forum thread read; Apple statement UNVERIFIED |
| Can it be embedded inline? | Yes. SwiftUI `.photosPickerStyle(.inline)` (also `.compact`); in UIKit it is a child view controller. `selectionBehavior .continuous` gives live selection; `photosPickerDisabledCapabilities` can hide search, the Albums tab and the selection actions; `photosPickerAccessoryVisibility` hides the surrounding bars. Our floor is iOS 17.0 (D-098, `app.config.ts` line 44), and these are iOS 17 APIs, so the floor holds. | SOURCE-READ (WWDC23 10107, summary); the floor claim is the repo's |
| First-time experience | The first time an embedded picker shows, an Apple onboarding UI appears explaining the app can only access selected photos. We do not control its words. | SOURCE-READ |
| What the app receives | Only what the parent selected. Without the library configuration the `assetIdentifier` is nil; with the library configuration and library access the identifier can be used to fetch the asset (date and location from the asset). Without library access the image comes through the item provider. | Forum thread read; UNVERIFIED against the API reference |
| EXIF (date, GPS) | An Apple engineer's forum reply says you can get most metadata from the item provider's file representation without library permission. I did not confirm that GPS is present in a picked file in every case. | Forum thread; UNVERIFIED |
| Parent can strip location | The Options menu lets the parent strip metadata such as location; it is not offered to apps that have full library access (the session text). So with Full access, picked files may carry location the parent cannot strip in the picker. | SOURCE-READ for the statement; consequence is my inference |
| Can the picker be pre-filtered to one date or one album? | Not found in anything I read. I believe it cannot filter by date (`PHPickerFilter` covers types). | UNVERIFIED, test at G1a |
| Can our tokens restyle it? | No. It is Apple's UI: system fonts and colours, light and dark follow the system, Dynamic Type and VoiceOver are Apple's. Our paper theme, 13 pt floor and glass rules cannot reach inside it. It also shows its own selection numbers and badges. | My reading; UNVERIFIED on exact behaviour |
| Out of process | The WWDC page says our app cannot reach into the picker or screenshot it. That also means our Maestro flows cannot assert inside it. | Screenshot claim SOURCE-READ; test claim my inference |

What this means in the repo (read in `apps/mobile/modules/scribe-photo`): today's `pickOne` is single select, images only, `PHPickerConfiguration()` with no library, copies the file and re-encodes it with all metadata and GPS dropped (NS-01-R17). The hybrid needs three things that do not exist: a multi-select with video (selection limits of R90: 6 pictures, 2 videos), an inline host, and a read of the picked file's date (and nothing else) before the strip. That read does not break NS-01-R17 if it happens inside the native module, returns only a day value, and the stripped output is unchanged; the row text must say so (see NEW rows).

## 2. What the picker replaces, and what it cannot

| Surface in the spec | Picker replaces it? | Why |
|---|---|---|
| Album chooser and verbatim album title (R57, O-14, cut list) | Yes, DROP | The picker has an Albums tab (can be hidden or shown); we store no album id and show no album title. |
| An all-pictures grid / "add from anywhere" browse | Yes | We never build one. The picker is the browse. |
| "Choose pictures" when access is Denied, Restricted, Not now or no module | Yes, becomes a real door | R79 already says the system picker works in these states; the hybrid puts a visible door on the tab. |
| "Leave out this picture" (R56, stored picture id) | Not by the picker, but the need shrinks | It hides a picture inside OUR day sheet. Recommend DROP (the cut list already defers it): a parent who does not want a picture simply does not tick it. |
| The day sheet (our tiles of one day, R85, R90) | No | The picker cannot open on one date (UNVERIFIED), and a suggestion has to land on its own day. Our day sheet stays. |
| Viewer (R149, PR 20) | Only on the browse path | The picker previews its own picks. Our day-sheet tiles still need an enlarge, so the picker does not remove the viewer; the cut list's pinch and pan cut stays and I recommend deferring PR 20 as well (founder question Q4). |
| Limited-access "Choose which pictures" (R75) | No | That control opens Apple's limited-library manager, a different thing; it stays. |
| Recent, For you pictures slot, place lines, year-ago pictures | No | These need the library read; they are the reason for it. |

## 3. Row families (R1 to R268)

KEEP means unchanged. CHANGE says how. DROP says why. NEW is a row to add (ids to be assigned after R268 by the PRD owner). I list rows by family; where a family has an exception it is called out. By my hand count: DROP 2 (R57, R56), CHANGE about 14 rows, NEW 8 rows; the rest KEEP. I did not run the trace script.

| Rows | Family | Verdict |
|---|---|---|
| R1 to R9 | Tab, IA, naming | KEEP |
| R10 to R17 | Card model, closed kinds, machine-label slot | KEEP |
| R18 to R36 | Sources S1 to S7 without a library (typed days, ticked Days, birthdays, month days, prompts) | KEEP. R29 loses the "Not this one" for album use (none existed); unchanged otherwise |
| R37 to R55, R58 to R60 | Grouping, reasons, rank, collage, name this day, runs, golden fixture, card sort | KEEP. Grouping still applies to the library read only; a picked picture is never grouped, ranked or given a reason (see NEW-1) |
| R56 | Leave out this picture (stored picture id) | DROP (recommended): already default-off (R247), removes a stored identifier class, the parent's tick in the day sheet is the control. Founder may keep it |
| R57 | Album chooser, stored album id, verbatim title | DROP: the picker's Albums tab does the job; closes O-14 |
| R61 to R68 | Places, occasions, K-SUG not planned, faces out | KEEP. Place names only from the library read and the offline table (G11b licence stands). R62 stays phase 2 |
| R69 | Never a wall; no-library cards | CHANGE: the no-library cards include a "Choose pictures" door that opens the picker (NEW-2); still no ask |
| R70 | No PhotoKit prompt call before the primer | CHANGE: add that presenting the picker is not a permission request and never calls the authorization request, in any state (L1 scan) |
| R71 to R74, R77, R78 | Ask card, primer, Not now, re-read, Me row | KEEP |
| R75 | Limited access | CHANGE: add that "Choose other pictures" opens the picker; picks outside the limited set are the parent's own explicit choice and are attached through the picker path, not read by the library module |
| R76, R79 | Denied, Restricted, Not now, no module | CHANGE: the calm line is followed by the picker door; Export, Delete and capture still work (already true) |
| R80 | Notes for Review | CHANGE: the argument becomes "we use the system picker wherever it suffices; the library read is only for suggestions, Recent and place and date lines, which the picker cannot give" (5.1.1(iii) wording UNVERIFIED, not read this session) |
| R81, R82 | Label, policy, Route A | KEEP |
| R83, R84 | One start function, Book and Me start nothing | KEEP |
| R85 | Day tap opens capture with chosen pictures | CHANGE: the chosen pictures come from the day sheet (library ids) or from the picker (item providers); both end in one `AttachRequest` |
| R86 | Back out leaves nothing | KEEP; extend the zero-residue test to picker temp copies |
| R87 | No record that a letter began at a moment | KEEP; a picker pick is not a moment either |
| R88 | Both routes hand the same `AttachRequest`; one stripper | CHANGE: three producers (library asset, picker, existing single pick), one `AttachRequest`, one stripper in `scribe-photo` |
| R89 to R94 | Pipelines, limits, ordering, original untouched, Route A drops | KEEP; R90 limit enforced by picker `selectionLimit` plus our own check; R91 CHANGE: for a picked item the system may download an iCloud original after the parent chose it (carve-out from R45 and R118, as EX-ENG-1 proposed) |
| R95 | Picture date as optional chip | CHANGE: for a picked item the date comes from the file's date read inside the native module, offered as a chip, never preselected; none if absent |
| R96 to R108 | Draft add, delete, missing file, Keep, viewer rules, App lock, export, shared book, second account, flags, fixtures, Book landing | KEEP. R101 (viewer rules on the letter page) is about the letter, not the day sheet, so it stands |
| R109 to R118 | Library read steps, native contract, windows, thumbnails, persistence, erase, classification, place, airplane mode | KEEP. R110 list stays; the picker host lives in `scribe-photo`, not `scribe-library` (keeps the read-only module read-only) |
| R119 to R123 | 18+ gate, first experience | KEEP. R120 gets one line: the first thing a parent can do on the tab with no permission is pick pictures |
| R124 | Denied, limited, restricted unhappy paths | CHANGE: each gains the picker door in its matrix |
| R125 to R129 | Other unhappy paths, notification landings | KEEP |
| R130 to R143 | Nudges, local push, email, widgets | KEEP (section 5) |
| R144 to R148, R150 to R152 | Motion, haptics, performance | KEEP for our surfaces; picker motion and haptics are Apple's (NEW-6) |
| R149 | Viewer: full photo, swipe, pinch, pan | CHANGE: defer pinch and pan (cut list); recommend deferring the whole viewer for 1.0 (Q4) |
| R153 to R156, R158 | Accessibility of our surfaces | KEEP |
| R157 | Themes and glass; no text over a photo | CHANGE: scope the rule to our surfaces; Apple's picker draws its own badges, durations and selection numbers over thumbnails and we cannot test or change that |
| R159 to R161 | Content and microcopy | KEEP; new strings only for the picker door and its host sheet |
| R162 to R166 | Data model, classification | KEEP; the decisions store loses the album id (R247 already default-off) and picture id fields |
| R167, R168 | Analytics | KEEP (no event for a picker use either) |
| R169 | EAS profile allow list and F2 | CHANGE: the picker door is in every profile under F1 only and does not depend on F2; the library read still does |
| R170 | Kill switches | CHANGE: K2 `photoMoments` hides the library read and not the picker door; the existing photos switch (R106) governs the door |
| R171 to R176 | Gate read-outs, routing, metrics, compliance, fixtures | KEEP |
| R177 to R191 | Switch, focus, bar, grant transitions, day card, state tables | KEEP; R186 gains a "Choose other pictures" row on the day sheet; R189 gains the picker states |
| R192 to R207 | Primer wording, claims, screenshots, place menu, machine-label rules | KEEP |
| R208 | Nothing over a photo except two marks | KEEP for our surfaces (see R157) |
| R209 to R219 | Examples, Recent, AX layout, ask card, loading, prototype corrections | KEEP |
| R220 | Native contract function list | KEEP for `scribe-library`; the picker functions are listed in a new row for `scribe-photo` (NEW-3) |
| R221 to R224 | Decisions file contract, retention, performance | KEEP; R221 drops the album and picture id members |
| R225 | N layer (simulator library, Maestro flows) | CHANGE: Maestro cannot drive inside Apple's out-of-process picker (my inference); the picker is covered by a device row, and our flows stop at the host sheet |
| R226 to R246 | Scans, place table, F2 allow list, fences, counsel packet, register, store paperwork, deletion operations | KEEP. R236 (no geocoder in release) and R241 (`PLACE_READ`) stand |
| R247 | No picture or album id stored | CHANGE: becomes a dropped feature, not a default-off one |
| R248 to R256 | Place keys, home place, store inventory, quiet-book rule, leave out | KEEP; R255 follows R56 (dropped) |
| R257 | Canary through attach, Keep, outbox, push, export | CHANGE: add the picker attach path |
| R258 to R268 | Plus, metrics, print, money, routing table, legal set, counts | KEEP |
| NEW-1 | A picked picture is never grouped, ranked, labelled with a reason or place, and creates no card; the date chip is the only derived value | P0 (a), L0 and L1 |
| NEW-2 | The picker door: on the tab in every access state (ACC-0 to ACC-5 and flag off), in the day sheet and in capture Add; the label is a verb ("Choose pictures"), no counts, no "allow" | P0 (c), L2 |
| NEW-3 | `scribe-photo` gains a multi-select picker (pictures and videos, `selectionLimit`, continuous selection, our own Start control, Apple's add bar hidden) and an inline host; reads only the date from the file inside native; returns file URIs to the one pipeline; no coordinate leaves native | P0 (b), L0, L1, L5 |
| NEW-4 | Host sheet: the inline picker sits in a full-height sheet with our own heading, our own Start and Cancel, paper chrome around Apple's view; the sheet cannot be open under App lock or inactive | L2, L3 |
| NEW-5 | The picker is never preconfigured with the library when access is None; with access it may use the library configuration only to receive an identifier that the same attach pipeline resolves; either way the kept letter holds no library id (R93) | L1 |
| NEW-6 | Picker limits stated for review: Apple's fonts, colours, badges, selection numbers, onboarding words, motion and VoiceOver are not ours and are outside G5 and G6 scans; our host sheet and strings are inside them | R, L4 |
| NEW-7 | Picked-file temp copies and any iCloud download are removed on back-out and on Erase (extends R86, R115) | L0, L5 |
| NEW-8 | G1a answers the picker unknowns (section 4) before NEW-3 merges | gate |

## 4. Gates G1a to G11

| Gate | Verdict |
|---|---|
| G1a device spike | CHANGE: add the picker unknowns: (a) does the inline picker present under None, Limited and Full access; (b) does the Options menu appear under each; (c) what the item provider gives for date and GPS, and what `assetIdentifier` gives under each access; (d) can the picker be limited to one album or date; (e) the first-time onboarding UI, in light and dark and at AX5; (f) memory and time on an iPhone SE 3 with the inline picker and our views; (g) iCloud-only items. Place table unknowns stand |
| G1b full device run | CHANGE: add (f) and (g) to the budget run |
| G2 counsel read | KEEP, all ten questions. The library read still ships, so the label, purpose string, location, 5.1.2(v) and (vi) questions stand |
| G3 READ_SET_V1 | KEEP; the stored-identifier decision is now simpler (none stored, no album, no picture id) |
| G4 five-parent check | CHANGE: add a task on the picker door with access refused, and one on the picker styled differently from the rest of the app |
| G5 accessibility | CHANGE: our host sheet and strings only; Apple's picker UI is outside our control, so the device rows record what Apple's UI does at AX5 and VoiceOver as an observation, not a pass bar |
| G6 content rules | KEEP for our strings; Apple's text is not scanned |
| G7 real-iPhone checks | CHANGE: add picker rows (None, Limited, Full; revoke while the sheet is open; iCloud pick; App lock during a pick) |
| G8 geocoder (phase 2) | KEEP, not first release |
| G9 K-SUG | KEEP, not planned |
| G10 founder signs RV-01 to RV-22 | KEEP; add one line recording the hybrid; RV-05 (no other screen asks) is unaffected because the picker does not ask |
| G11 security, data, licence, store paperwork | CHANGE (a): the security read covers the `scribe-photo` picker changes, the usage-string and call-site scans stay; (c): the data inventory loses the album and picture id rows. (b) place table licence and (d) paperwork parity stand |

## 5. Counsel questions Q1 to Q10 (section 21.3)

All ten remain, because the library read ships: Q1 label and consent, Q2 picture-timed reminders (phase 2), Q3 and Q4 place and location (F2b), Q5 trademark, Q6 Terms for other people's children, Q7 backup, Q8 policy mechanics, Q9 publisher, Q10 place data. None falls away. One change in what is at stake: the picker door alone (no library read, no purpose string) is, in my reading, a path that needs none of Q1 to Q4 and Q10, and it already exists in the app today as a no-permission picker; that is UNVERIFIED and not a counsel view. It does mean that if a library gate fails, the tab still ships with a real action in it (G-1, G-3), which makes O-37 option (b) a better fallback than before. Q5, Q6, Q7 and Q9 apply to the picker door too (Q7 because a picked picture attached to a letter is a stored copy).

## 6. PR plan (section 19.4)

Sizes are changed lines, ASSUMED, my estimates and not the spec's.

| PR | Verdict |
|---|---|
| 0 | KEEP |
| 1 to 5, 5b | KEEP, unchanged. Grouping, ranking, occasions and place apply to the library read only; picked pictures never enter the engine |
| 6, 7 | KEEP |
| 8 decisions store | CHANGE: smaller by about 50 lines (no album, picture id members) |
| 9, 10, 11 | KEEP. PR 10 thumbnails still serve the day sheet and Recent |
| 12 content | CHANGE: album chooser strings out, picker door and host sheet strings in; about equal |
| 13 | KEEP |
| 14 | CHANGE: add the picker door row and host sheet state lines; about +50 |
| 15, 16 | KEEP |
| 17 primer, ask, Recent, day sheet | CHANGE: no album chooser, no all-pictures view; about -100 |
| 18 copy-for-attach | KEEP for library assets; the picker result path moves to NEW PR 18b |
| NEW 18b | `scribe-photo` multi-select picker, inline host, date read before strip (NEW-3, NEW-4); about 350 to 400. Needs no library read and no founder decision, so it can start in wave A or B and can ship even if every library gate fails |
| 19 | KEEP |
| 20 viewer | DROP for 1.0 (recommended, Q4): about -300. If kept without pinch and pan, about -150 |
| 21 verbs and Me | CHANGE: no "Use album", no "Leave out this picture"; about -100 |
| 22, 23 | KEEP |
| 24 N layer | CHANGE: the picker is a device row, not a flow; about -50 |
| 25 | KEEP |

Net effort: 26 PRs become 26 with PR 20 dropped and 18b added (27 if PR 20 is kept in reduced form). About -600 lines from PRs 8, 17, 20, 21, 24 and about +450 from PR 14 and PR 18b, so roughly -150 on the spec's 7,600 (ASSUMED; I treat it as zero). The honest answer: the hybrid does not make the release meaningfully cheaper. What it removes is review surface (two identifier classes, an album UI, a viewer) and the dead-end risk; what it adds is a new native view with a styling limit.

Cut list of section 23.2 (EX-CPO-3 and related):

| Cut item | Verdict |
|---|---|
| Stored picture identifier, R56 | DROP now (not just recommended for 1.1) |
| Album chooser, R57 | DROP now, replaced by the picker |
| Kept-day concept | unchanged |
| Stay and run cards, R58, R64 | unchanged |
| Pinch and pan viewer, R149 | unchanged; plus the question of PR 20 (Q4) |
| One switch per public holiday | unchanged |
| Verbs | shrink by two (Use album, Leave out this picture) |
| F2a / F2b split (O-39) | KEEP the split. Add: the picker door sits under F1 only, so F2a failing never removes it |

## 7. Exec-review findings the hybrid touches

No BLOCKER is dissolved, because the library read, the place read and the native module all remain. Findings narrowed or removed:

| Finding | Effect |
|---|---|
| EX-CDO-9 (do not store a picture or album identifier, MAJOR) | Dissolved once R56 and R57 are dropped |
| EX-PRV-6 (stored photo identifier: approve with five controls, MAJOR) | Dissolved with R56; its five controls no longer needed |
| EX-ENG-6 (open questions O-13, O-14 as engine fields, MAJOR) | Narrowed: two fewer fields |
| EX-DES-7 (verbs and teaching acts, MAJOR) | Narrowed: two fewer verbs |
| EX-CPO-3 (smallest release that teaches, MAJOR) | Partly met without touching a ruling |
| EX-CCO-4 (5.1.1(iii) asserted, not evidenced, MAJOR) | Narrowed: the system picker is used wherever it suffices; the library read must still be justified for suggestions and place and date lines (rule text UNVERIFIED) |
| EX-ENG-1 (native contract cannot deliver the attach path, BLOCKER) | Not dissolved; the hybrid adds the picker path to its list, so the finding gets another function to name |
| EX-DES-1 (no text over a photo, BLOCKER) | Not dissolved; scoped to our surfaces, and the picker's own overlays are a known exception |
| All other BLOCKERs and MAJORs (EX-SEC-1 to EX-SEC-3, EX-CMO-1 to EX-CMO-3, EX-PRV-1, EX-PRV-2, EX-CCO-1, EX-CCO-2, EX-CLO-1, EX-CLO-2, EX-CPO-1, EX-CPO-2, EX-CDO-1, EX-ENG-3 to EX-ENG-5 and the rest) | Stand |

New risks the hybrid creates (not in the spec): a visible style break (Apple's UI inside a paper app); selection numbers and badges we cannot remove, set against our no-counts rule (the rule is about gaps and things waiting, but the founder should see it); Apple's first-time onboarding words appearing in our flow; location may be present in picked files under Full access (Options menu absent), so the date read must return only the date; iCloud originals may download after a pick; memory of an inline picker on an iPhone SE 3; no scripted test inside the picker.

## 8. Nudges, For you and Recent

Nudges are unchanged: the push and email channels are keyed to what the spec already allows (typed days, ticked Days, birthdays and month days, the 111 prompts under the existing evening class; the library-timed reminder stays phase 2 behind F4 and counsel Q2; email on a parent-chosen date, phase 2). A picked picture produces no signal of any kind, because we never see the library through the picker.

For you and Recent stay as specified. The change is only at the edges: every no-access state now shows a "Choose pictures" door that works, and the day sheet and Limited state gain "Choose other pictures". For you is not a picker screen; I recommend against putting the inline picker as the body of the tab (Apple's first-time onboarding appears in it, it cannot take our tokens, and it would compete with the real cards). Inline lives in the host sheet (Q1).

## 9. Gives up, and does the tab still earn its place

Against the earlier picker-only draft the hybrid gives up nothing: proactive library suggestions, Recent, place and date lines and the picture-timed reminder all stay. Against the spec as frozen it gives up three things: the album chooser, the stored "leave out" picture and (recommended) the viewer. Candidly: those were lower-value, and none was named by the founder.

What the picker adds is not new value so much as a safer floor. Capture already has a system picker, so the tab's picker door is mostly discoverability, not a new capability; I would not claim it as a reason the tab earns its place. The tab still earns its place on the same grounds as before and with the same unproven hypothesis (R260, E2, E4): the daily-return claim has no parent evidence. The hybrid does make the failure case better: if G2 or G8 is not closed by the submission date, the tab still has dated and occasion cards plus a real picking action, rather than a tab that leans on a library read that stays dark.

## 10. BACKLOG rows BL-1432 to BL-1438 (PR #1296, branch `docs/moments-harness-handoff`)

I read the rows on the branch; I did not edit them.

| Row | Effect |
|---|---|
| BL-1432 pure core engine (PRs 1 to 5) | Still right. No change |
| BL-1433 tab shell, store, content (PRs 6, 8, 12) | Slightly wrong: the store contract has no album or picture id members; the content scope names an album chooser path that is dropped and omits the picker door and host strings |
| BL-1434 device spike G1a | Wrong in scope: "the five unknowns" becomes the five plus the picker unknowns of section 4 (a) to (g); size S is optimistic, S to M |
| BL-1435 native module and thumbnail view (PRs 9, 10, 11, 18) | Wrong in count and scope: PR 18 covers library assets only; the picker path is a fifth PR (18b) in `scribe-photo` and is not blocked on G1a for most of its work |
| BL-1436 screens, flows and places (PRs 13 to 17, 19 to 23) | Wrong in detail: PR 20 dropped or reduced, PRs 17 and 21 smaller, PR 14 gains the picker door; nine PRs become eight (or nine if the viewer is kept) |
| BL-1437 N test layer (PR 24) | Wrong in its Done-when: Maestro flows cannot reach inside the picker; add device rows for the picker and stop flows at the host sheet |
| BL-1438 release gates and F2 flip (PR 25) | Wrong in content: G1a, G1b, G4, G5, G7 and G11 change as in section 4; add "picker door under F1 only" to the guard's checks |
| New row needed | A proposed row for PR 18b (the picker door), mode agent, owner mobile, no dependency, size M; id to be assigned by `node scripts/agents/next-id.mjs` |

## 11. Founder questions this route creates

Only questions that change what we build. Each has a recommended default; none is applied.

| Id | Question | Recommended default |
|---|---|---|
| Q1 | Where does the inline picker live: as the body of the tab in the no-access states, or inside a full-height sheet from the tab door, the day sheet and capture? | Inside a sheet. Apple's onboarding and styling inside the body of the tab would break the paper design and compete with the real cards |
| Q2 | Drop the album chooser (R57) and "Leave out this picture" (R56) now rather than keep them default-off? | Drop both; the picker's Albums tab and the parent's own tick replace them |
| Q3 | For a picture the parent picks, show only an optional date chip, or also a place label from its location? | Date chip only; place stays a library-read suggestion line (a place from a picked file raises the location questions of Q3 and Q4 for a path that otherwise needs none) |
| Q4 | Defer the viewer (PR 20) for 1.0? | Defer; day-sheet tiles are selection only and the letter page keeps its own viewing rules (R101) |
| Q5 | The picker door ships under F1 alone, so a failed library gate never removes it | Yes |

Also still open and unchanged from the spec: O-37, O-38, O-39, O-40, O-44, O-47 and the rest of the freeze checklist section 1.1.

## 12. What I did not do

Did not read the PHPicker or PhotosPicker API reference, the App Review Guidelines or the Developer Program License Agreement; the picker facts in section 1 come from the WWDC23 session summary and a forum thread and are marked accordingly. Did not run the trace script or count rows with a tool (the verdict counts are by hand). Did not test any picker behaviour on a device or simulator. The size estimates in section 6 are mine and ASSUMED. The PRD, backlog and PR #1296 are untouched.
