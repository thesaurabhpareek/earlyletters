# Moments tab: hybrid picker design, executive review, Privacy (NS-53)

Reviewer: Chief Privacy Officer (Claude role, not counsel). Nothing here is legal advice. Every legal or store-rule statement is UNVERIFIED unless it says SOURCE-READ; I read no Apple, FTC or statute text this session. Every legal judgment is "counsel must confirm" and goes to the CLO for the counsel brief.
Date: 21 Nov 2026
Fictional family: Asha only.

## What I read (heads)

| Source | Ref | Read |
|---|---|---|
| Hybrid delta, `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` | `wip/moments-picker-delta` head a84f448c7f75480b629000b7997d8c4f18652e2b | In full |
| Spec, `docs/product/prd/28-moments-tab.md` | `wip/moments-prd` head 1c1e05bc2f1dabc294a4b87aefca9035838f6fe7 (268 rows) | Rows on picker, attach, strip, label, backup, quiet books, analytics, gates; not every row |
| My earlier review, `exec-review/privacy.md` | `wip/moments-review-privacy` (EX-PRV-1 to EX-PRV-14, on the earlier 191-row spec) | In full |
| `PICKER-ROUTE-FEASIBILITY.md` | `wip/moments-picker-feasibility` | NOT PRESENT. The branch does not exist on the remote (checked with `git ls-remote`). Nothing here depends on it |
| `docs/agents/exec/COUNCIL.md`, `.claude/skills/early-letters-privacy/SKILL.md` | `develop` | In full |
| `apps/mobile/modules/scribe-photo` (index.ts, ScribePhotoModule.swift) | `develop` | The pick, copy and re-encode code, to test what the delta says it does |

SOURCE-READ for repo facts. The delta's picker facts come from its author's WWDC23 summary and one Apple forum thread; I did not re-read them, so I carry them as UNVERIFIED.

## Verdict: ACCEPT-WITH-CHANGES

The hybrid is more private than library-only and I support it. It collects less (no album id, no album title, no picture id, no all-pictures grid), and it makes declining or limiting access a real path instead of a dead end. It is not a privacy-free path: it adds a second way for a picture file, with its location, to reach our code, and every row of the picked-file handling is a control we must build and test ourselves because Apple's picker does not do it for us.

One condition is a hold, not a design change. The picker door cannot ship in a store build until policy, label and the backup line say what the build does (EXH-PRV-1). That is the "fix the policy later" anti-pattern otherwise.

Counts: 13 findings: 1 BLOCKER, 4 MAJOR, 8 MINOR.

| Id | Severity | One line |
|---|---|---|
| EXH-PRV-1 | BLOCKER | The picker door attaches stored copies; policy, label and backup line must match in the same build |
| EXH-PRV-2 | MAJOR | "Door ships with library gates dark" is only true with a build-time exclusion, not a flag |
| EXH-PRV-3 | MAJOR | Date read from a picked file must return a day and nothing else, inside the strip call |
| EXH-PRV-4 | MAJOR | Picked videos and Live Photos: location strip is unproven; hold video until a test proves it |
| EXH-PRV-5 | MAJOR | Strike the library configuration from NEW-5; the picker touches item-provider bytes only |
| EXH-PRV-6 | MINOR | Limited access: picks outside the limited set are the parent's own act; words must not say otherwise |
| EXH-PRV-7 | MINOR | Picked-original temp copies carry location until the strip; remove them at once |
| EXH-PRV-8 | MINOR | A picked picture must leave no stored fact, event or log line |
| EXH-PRV-9 | MINOR | Dropping R56 dissolves EX-PRV-6 but leaves EX-PRV-9 (sensitive tile on a card) with a thinner remedy |
| EXH-PRV-10 | MINOR | Other people's children in pictures; Apple's People album inside our sheet |
| EXH-PRV-11 | MINOR | Apple's own words inside our flow; no absolute claim in our host sheet |
| EXH-PRV-12 | MINOR | App switcher and App lock with Apple's picker open: device row |
| EXH-PRV-13 | MINOR | The G1a picker spike must use synthetic Asha files, not a real family library |

## What each path touches

| | Picker path (Apple's picker, item provider) | Library path (`scribe-library`, PhotoKit) |
|---|---|---|
| Permission asked | None, per the delta's WWDC23 summary (UNVERIFIED against the API reference) | Photos read, behind the primer, on the parent's tap |
| Purpose string | None needed in a build without PhotoKit access (UNVERIFIED) | Required; names date, time and place (R72, R192, EX-PRV-1) |
| What our code receives | Only the files the parent selected, one by one, as file representations | Identifier, creation date, kind, duration, subtype flags, favourite flag, burst id, and location rounded to a place cell (READ_SET_V1, with my EX-PRV-3 condition) for every asset in the window |
| What it sees of the rest of the library | Nothing. Browsing happens in Apple's process; we cannot read or screenshot it (delta, WWDC summary) | Metadata of every asset in the window, in memory only |
| Location | Present in the picked file unless the parent strips it in Apple's Options menu, which is not offered under Full access (delta, UNVERIFIED). Our strip is the only guard | Read on the phone, resolved to a city in Swift, never returned above Swift (EX-PRV-3) |
| Date | Read from the file by our native module before the strip (new, EXH-PRV-3) | Library creation date |
| Stored | Our stripped copy in `entry_media` after Keep; temp copies in Caches until then | `moments.json` decisions (day keys, labels, hidden place keys, home correction); copies only if the parent attaches |
| Leaves the phone | Nothing by design. The copy sits in the parent's iPhone backup | Nothing by design. Same backup copy on attach |
| Signal to us about the rest of the library | None | Counts, dates, places in memory; never persisted or sent |

## Findings

### EXH-PRV-1
Severity: BLOCKER
Requirement ids: delta NEW-2, NEW-3, R169, R170; NS-53-R81, R235, R166; EX-PRV-8; O-44
Finding: The picker door is an attach path. Each pick becomes a stripped copy of a picture of a child in the app container, and that copy is part of the parent's iPhone backup (PRD line 822, ADR 0032 line 9, FACT-CHECK). Today the photo UI sits behind `EXPO_PUBLIC_PHOTOS`, which no `eas.json` profile sets (PRD line 825), and `docs/legal/app-store-privacy-labels.md` line 54 reads "Photos or Videos: No photo feature in v1.0" (carried from my earlier review). The delta puts the door "in every profile under F1 only" and says it "can ship even if every library gate fails". Those two statements together mean the door could be on in a store build while the library gates, and the paperwork that rides on them (G2, G11), are still open. Policy and label say nothing about stored picture copies or backup. Code would collect; promise would lag.
Proposed change:
1. Hold the door out of any store profile until, in the same build: the policy has the backup line (R81, R235; default O-44 is disclose); the label of record answers Photos or Videos and Location for a build that attaches copies on the phone with servers on (my EX-PRV-8 table stands; the "No" rests on Apple's definition that data is collected only when it leaves the device, UNVERIFIED, counsel must confirm); the deletion screen says a deleted letter's copy leaves the phone but not an older backup Apple holds.
2. G11 (d) paperwork parity applies to the door, not only to the library read. Add that to the delta's G11 row.
3. Keep the door in development, preview and testflight profiles under F1 as the delta says; this finding binds the production profile only.
Evidence: delta sections 3 (R169, R170), 6 (PR 18b), 10; PRD lines 468, 822, 825, 1150. Source read. Holding a claim until the code matches is mine to rule under my skill section 4; pulling the door from a release or moving a date is founder-only, so this goes up as a condition with the recommendation above.

### EXH-PRV-2
Severity: MAJOR
Requirement ids: delta R70, R110, R169, R170, NEW-5; NS-53-R72, R233, R236; G11
Finding: The delta says a library gate failing never removes the door. True only if the library read can be absent from the binary. A flag-off `scribe-library` still ships PhotoKit symbols, and the purpose string key in the app's property list, and App Review reads both (the same argument I made for the geocoder in EX-PRV-4). R72 already says the purpose string is "present only in the allow-listed profile", and R110 keeps the picker host in `scribe-photo` and the library in `scribe-library`, which makes the split possible. R170 says K2 `photoMoments` "hides the library read": a hide is a runtime switch, not an exclusion.
Proposed change:
1. In every profile where F2 is off, `scribe-library` is not compiled in and no photo-library usage string is present; a binary and property-list scan in R169 fails the build otherwise. This is the R236 treatment (build-time exclusion), applied to the library module.
2. In those profiles `scribe-photo` also carries no PhotoKit authorization, fetch or change symbol (see EXH-PRV-5), so a reviewer who opens the app with access never sees a prompt, because none exists.
3. R170: K2 stays a hide for the profile where F2 is on; the F2-off profile is the real exclusion.
Evidence: delta R170 row, R110 row, section 6 PR 18b; PRD rows R72, R233, R236. Source read. Whether Apple objects to a purpose string with no reachable use, or to PhotoKit symbols with none, is UNVERIFIED; this change avoids the question.

### EXH-PRV-3
Severity: MAJOR
Requirement ids: delta R95, NEW-3, NEW-1; NS-01-R17; NS-53-R93, R95
Finding: The delta reads a date from the picked file "inside the native module" before the strip and returns only a day. The idea is right (the date chip is a parent convenience and the stripped output is unchanged). Three points need to be rows, because today's module states the opposite: its re-encode reads "its width and height, nothing else" from the source (`ScribePhotoModule.swift`, source read), and a scan most likely pins that.
1. The only date source is the file's own capture date metadata (UNVERIFIED which keys; mobile names them in the spike). Never the file-system creation date of the provider's temp copy, which is the time of the pick and would silently put today on a picture from last spring.
2. The value crossing the bridge is a local day key or nothing. Not a timestamp, not a time of day, not a coordinate, not a time zone offset, not the raw metadata dictionary. Capture dates in picture files often carry no time zone, so the chip says "Taken on" the day the file says and the parent decides (R95: optional, never preselected). No inference when absent.
3. The read and the strip happen in one native call on one open source, so no metadata dictionary exists in a long-lived variable or is returned.
Proposed change: add to NEW-3: "the module reads the capture date key set and no other property; returns a day key or none; a source scan fails on any read of a location dictionary or key, on any write of the date outside the return value, and on use of file-system dates". Add a golden with an Asha picture whose file carries a synthetic capture date and a synthetic coordinate: the chip day is right and the stripped output has neither. Update the existing scan that pins "nothing else" so the change is deliberate and reviewed.
Evidence: delta section 1 last paragraph and R95 row; `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift` (reencode, around lines 196 to 232). Source read.

### EXH-PRV-4
Severity: MAJOR
Requirement ids: delta NEW-3 (pictures and videos, multi-select); NS-52-R5, R33; NS-53-R90, R91, R93
Finding: Today's pick is single, images only, and the strip is a still-image re-encode that passes no source properties (source read). The hybrid adds multi-select with video, up to 6 pictures and 2 videos, from the picker. A video file can carry location in container-level atoms. Doc 27 itself lists "EXIF and QuickTime location-atom stripping APIs" as not read, UNVERIFIED (`27-photo-moments-and-media.md` line 24). A Live Photo item may also arrive as a still plus a paired video. If the video strip is not proven, the stored copy of a baby's first steps carries the street the family lives on, into a backup and later an export, and cannot be undone for a copy already shared.
Proposed change:
1. Video from the picker is held out of the door until a test proves that a stored video has no location atom or key: an Asha clip built with a synthetic coordinate in each place the container can hold one, run through the real transcode, then read back by a second reader that lists every key. Fail closed: if the read-back finds any location key, the item is refused with the calm line of R91 and nothing is stored.
2. Fix the type filter so a Live Photo is a still only, or the paired video is dropped; the stored item is one file of the kind the parent saw.
3. The same read-back test runs for stills (the existing JavaScript check, `strip.ts`, already re-checks results; extend it to the new multi-select path).
4. Audio in a video is the parent's keepsake, not analysed: R43 and the CR-040 guardrails (no speaker identification, no voiceprints) apply unchanged to picked videos. Whether a baby's or another child's voice in a parent's video is collected "from a child" is counsel packet Q4(b); counsel must confirm.
Evidence: delta NEW-3; `ScribePhotoModule.swift` pickOne and reencode; PRD section 10.1 step 9 (line 534), R90, R91; doc 27 line 24. Source read. Platform behaviour for Live Photos and video location metadata is UNVERIFIED.

### EXH-PRV-5
Severity: MAJOR
Requirement ids: delta NEW-5, R88, R93, R233; NS-53-R93
Finding: NEW-5 allows the picker, when library access exists, to use the library configuration to receive an identifier that "the same attach pipeline resolves". That clause turns a path with no permission, no read of anything unchosen and no identifier into a path that links PhotoKit, receives an asset identifier and invites an asset fetch, which returns the favourite flag and the location. It also makes the picker path depend on the access state, so Limited, Full and None behave differently inside one door. And it contradicts the delta's own best privacy argument (section 1: "you do not need to request any photo library access to use it"). Nothing in the hybrid needs the identifier: the bytes and, with EXH-PRV-3, the day come from the item provider.
Proposed change: strike the library-configuration clause. The picker is always made without a library, in every access state. A source scan fails on `PHPhotoLibrary`, `PHAsset`, `PHAssetResource`, any authorization request and any change-request call in `scribe-photo`, in every profile (this extends R233, which already forbids change requests). The attach pipeline's three producers (library asset, picker, existing single pick) stay; only the library-asset producer holds a library id, and it does not keep it (R93).
Evidence: delta section 1 table row "What the app receives", NEW-5 row, R88 row. Source read. How the picker behaves with the library configuration under Limited access is UNVERIFIED; the change avoids needing the answer.

### EXH-PRV-6
Severity: MINOR
Requirement ids: delta R75, R76, R79, NEW-5; G1a(a) to (c)
Finding: The Limited-access caveat. A parent who chooses "Selected Photos" has told the system and us which pictures the library read may see. Apple's picker is a separate, per-pick act: the delta's forum evidence shows a pick outside the limited set works, and says Apple's own statement of this was not read (UNVERIFIED). Privacy reading: that is fine, because a tap on a specific picture in Apple's picker is an explicit choice of that file, the same as in any app. The risk is words and wiring. (a) Any sentence in the primer, Me row or host sheet that says the app only sees the pictures the parent chose would be untrue of the door. (b) A picture picked outside the limited set must never reach the library engine, thumbnails or day sheet; with EXH-PRV-5 it cannot, because the engine holds no id for it. (c) "Choose which pictures" (Apple's limited-library manager, changes what the read may see) and "Choose other pictures" (the picker, attaches one file now) sit near each other and do different things; the labels must say which. (d) Whether the Options menu that strips location appears under Limited is not known (delta G1a(b)); our strip makes the answer harmless.
Proposed change: content tests: no string says the app can only see the chosen pictures where the door exists; the two controls have distinct verbs and one-line purposes. Add to G7 the Limited rows of the delta plus: pick a picture outside the limited set, attach, Keep, and confirm the library read shows no new day or tile for it.
Evidence: delta R75 row and section 1. Source read for the delta; the platform statements are UNVERIFIED.

### EXH-PRV-7
Severity: MINOR
Requirement ids: delta NEW-7, R86, R91; NS-01-R17; NS-52-R33
Finding: Today the picked original, with its location, is copied to `Caches/ImagePicker` and lives there until the re-encode and a later sweep; the code removes a partial copy on failure (source read). With multi-select, video and a Review step that can stay open, up to eight originals can sit in Caches with location, and an iCloud-only item may be downloaded by the system after the pick (delta R91 carve-out). NEW-7 covers back-out and Erase. It does not cover the window between a pick and the strip, nor an app killed in it.
Proposed change: in the native call, delete each original the moment its stripped copy is written or the item is refused; the launch sweep stays as the backstop; a test kills the process between pick and strip and checks the sweep empties the folder; confirm the folder is outside backup (Caches is not backed up, UNVERIFIED against Apple's text; mobile confirms). An iCloud download is Apple's transfer to the phone, not ours, so it adds no exit; say so in the Notes for Review only if counsel wants it.
Evidence: `ScribePhotoModule.swift` copyPicked and pickOne; delta NEW-7. Source read.

### EXH-PRV-8
Severity: MINOR
Requirement ids: delta NEW-1, section 8, R167, R162, R257; NS-53-R87, R245
Finding: NEW-1 says a picked picture is never grouped, ranked or labelled. It should also say the pick leaves no stored fact. Two quiet ways it could: the decisions file (for example, remembering which pictures were already attached, to avoid duplicates), and an event or log line (a picker opened, cancelled, a count of picks, a failed pick with a file name in the error). Each would turn a no-signal path into a usage record about a family's pictures.
Proposed change: add to NEW-1: no write to `moments.json` from the picker path; no analytics event for open, cancel, pick or count (the delta already says none; make it a test, R167); errors map to the closed code with no path or name (EX-PRV-13 item 2 extended to `scribe-photo`); the canary of R162 and R257 runs a synthetic picked file through attach, Keep, outbox, push mapper and export and finds no file name, day or coordinate outside the stored copy. Duplicates are the parent's to see in Review, not ours to prevent.
Evidence: delta NEW-1, section 8; PRD lines 829, 873, 1166. Source read.

### EXH-PRV-9
Severity: MINOR
Requirement ids: delta R56 DROP, R57 DROP, Q2; EX-PRV-6, EX-PRV-9; NS-53-R44, R253
Finding: I agree with dropping R56 and R57. A stored picture identifier file is a list of the pictures a parent found sensitive, and a verbatim album title is parent-authored text that may name a person or place. Not storing either is collecting less, and EX-PRV-6 (five controls) and the O-14 half of it fall away. What does not fall away is EX-PRV-9: an intimate, medical or other-people's picture can appear as a thumbnail on a card on an unlocked phone. The delta's remedy, "a parent who does not want a picture simply does not tick it", works inside the day sheet but not on the card, which shows a tile before any tick. The remaining control is Hide this day, which hides a whole day, including the good pictures in it.
Proposed change: keep the drop. Make Hide this day reachable from the card menu in one tap with Undo (my EX-PRV-9 ask, now carrying all the weight). State the limit in the Me row: a card chooses pictures by time and hearts, never by what is in them. If the card sort (G4) shows parents want one-picture removal, bring R56 back with the five controls of EX-PRV-6; the door is two-way.
Evidence: delta sections 2, 3, 7; my earlier EX-PRV-6 and EX-PRV-9. Source read.

### EXH-PRV-10
Severity: MINOR
Requirement ids: delta NEW-3, section 7; NS-53-R43, R68; counsel packet Q4, Q6
Finding: Pictures a parent attaches will include other people's children (daycare, a playdate, a group shot at a party), and videos include their voices. The hybrid does not change this against library-only, because in both the parent picks and we copy; we read no pixels, run no face or scene step and build no per-person data (R43, R68). Two things are worth saying. First, Apple's picker has its own Albums tab, which on Apple's side may show grouped people and pets from Apple's on-device recognition (UNVERIFIED). That is inside our sheet and we receive nothing from it, but it sits beside our promise that faces and people are out (O-30). I have no privacy objection to leaving it on, because the parent's own phone is doing it and the delta uses the Albums tab to replace our chooser; the design chief may want the Search and Albums capabilities decided with that in mind. Second, the stored copy of another child travels wherever the letter's pictures travel: backup (EXH-PRV-1), export, a future print book, and, if the founder later chooses Variant B, a server. Terms for other people's children is counsel Q6.
Proposed change: no machine step that tags, counts or recognises people in picked files, in either route (scan stays). Host-sheet and policy words say "pictures you choose" and make no claim about who is in them. Counsel must confirm COPPA treatment of a parent-provided picture or voice of a child (the FTC FAQ is carried in my skill, page dated 10 Jul 2026, not re-read this session: UNVERIFIED) and the Terms line for other people's children (packet Q4, Q6).
Evidence: delta section 3 (R61 to R68 KEEP), section 5; PRD rows R43, R68. Source read for the repo; platform and legal statements UNVERIFIED.

### EXH-PRV-11
Severity: MINOR
Requirement ids: delta NEW-4, NEW-6, R80, R160; NS-53-R192, R80
Finding: The first time the embedded picker shows, Apple presents its own words about the app seeing only selected pictures (delta, SOURCE-READ via the WWDC summary). We do not control them, and they will sit inside our host sheet. Two cautions. Our own heading and strings in that sheet must not add a claim the build cannot prove ("we never see your pictures" is exactly the sort of absolute that D5-F4 bans and that is false the moment the library read is on). And the Notes for Review argument in R80 ("we use the system picker wherever it suffices; the library read is only for what the picker cannot give") is honest and I support it, but it must be written against what the build does: suggestions, Recent, and place and date lines use the library read, and say so.
Proposed change: content test on the host sheet strings for absolute claims (the existing D5-F4 scan); the Notes for Review sentence maps to rows R80, R192 and R240. 5.1.1(iii) wording is UNVERIFIED; counsel confirms.
Evidence: delta section 1, R80 row, NEW-4, NEW-6. Source read.

### EXH-PRV-12
Severity: MINOR
Requirement ids: delta NEW-4, G7; NS-53-R102, R232, R234
Finding: NEW-4 says the host sheet cannot be open under App lock or when the app is inactive. What Apple's out-of-process picker looks like in the app switcher, or when the screen is recorded or captured, is Apple's, and the delta says we cannot reach into it (UNVERIFIED how the system masks it). A parent's library thumbnails in a switcher card is the exposure R102 and R232 exist to prevent, and this one is not ours to blank.
Proposed change: add to G7 a device row: open the picker, go to the app switcher, lock the phone, and with App lock on return to the app; record what is visible. If the picker content shows in the snapshot, close the sheet on the inactive event in our host so the system takes the snapshot of our paper chrome. Observation, not a pass bar for Apple's UI (as G5 already treats it), but our host's behaviour is ours.
Evidence: delta NEW-4, section 4 G7 row; PRD rows R102, R232, G7 (line 1003). Source read.

### EXH-PRV-13
Severity: MINOR
Requirement ids: delta G1a (a) to (g), NEW-8; EX-PRV-12; NS-53-R107, R176
Finding: G1a(c) asks what the item provider gives for date and location. The easy way to find out is to pick from the founder's or a tester's real library. That puts real location and real children on a spike read-out. The H-8 rule (no real data in files) does not cover the session.
Proposed change: the picker spike uses an Asha library generated for the purpose, with synthetic coordinates and dates added to the files, loaded onto the test phone; the read-out records yes or no per unknown and the keys present, never a value from a real picture; a real-library pass, if wanted, is the founder on his own phone, with no screenshots and nothing written down but yes or no. Same rule for the picker rows in G7 and the five-parent task in G4 (own phone, held by the parent, no recording).
Evidence: delta section 4, G1a and G4 rows; my EX-PRV-12. Source read.

## Earlier findings the hybrid touches

| Earlier finding | Effect, privacy view |
|---|---|
| EX-PRV-1 (primer omits place) | Stands, unchanged. The library read still reads place |
| EX-PRV-2 (quiet, hard-stretch, expecting-only) | Stands and already folded in as R253. The door stays in those states ("Add pictures"); that is right, because a picker pick is the parent's own act and produces no card or reason. The door's label stays a plain verb with no reason line |
| EX-PRV-3 (coordinates stay in Swift) | Stands for the library read. For picked files the equivalent is: no coordinate is ever read (EXH-PRV-3) |
| EX-PRV-4 (geocoder not in binary) | Stands. EXH-PRV-2 applies the same build-time logic to the library module |
| EX-PRV-5 (place harm) | Stands; picked files give no place (delta Q3, which I endorse) |
| EX-PRV-6 (stored picture id) | Dissolved by dropping R56 and R57 (EXH-PRV-9). My earlier "approve with five controls" is withdrawn as moot, not as wrong |
| EX-PRV-7 (analytics kinds) | Stands; picker emits none |
| EX-PRV-8 (label, backup line) | Stands and is now also the gate for the door (EXH-PRV-1) |
| EX-PRV-9 (sensitive tile) | Not dissolved; its remedy changes (EXH-PRV-9) |
| EX-PRV-10 to EX-PRV-14 | Stand. EX-PRV-14 (canary) gains the picker path (EXH-PRV-8) |

## Is the hybrid more or less private than library-only?

More private, with conditions, for these reasons:

1. Less is stored: no album id, no album title, no picture id (EXH-PRV-9), so two identifier classes and one parent-authored text field I had to control are gone.
2. Declining is real. A parent who says no, or Limited, keeps a working way to attach pictures, which also helps the consent be free (PRD R79; App Review 5.1.1(iv) is UNVERIFIED, not read).
3. The no-permission path reads nothing it was not handed. No library metadata is read for a parent who never grants access.
4. The browse surfaces (an all-pictures grid, an album chooser) are Apple's process, so our app does not decode and hold thumbnails for browsing.

Less private in these ways, each with a control above: a second route for a picture file and its location into our code (EXH-PRV-3, 4, 7); a new read of the file's date; a new styling and wording surface we do not own (EXH-PRV-11, 12); more reach for the door, hence more stored copies in backup (EXH-PRV-1). Against a picker-only design the hybrid touches more, since the library read is on; that read was the founder's ruling of 21 Nov and I recommended approving it with conditions, so I do not reopen it here.

## Stored copy and iPhone backup

Unchanged in substance from EX-PRV-8, wider in reach. A picked picture or video, stripped, is stored in `entry_media` in the app container after Keep. It is part of the parent's iPhone backup, held by Apple on the parent's account, and is not collected by us under Apple's definition of collection (UNVERIFIED, counsel must confirm). The door makes more copies likely, so the line is needed in the first build that has the door. My recommendation to the founder at O-44 stands: disclose, do not exclude, because excluding `entry_media` would lose every picture on a letter on a phone restore while the words survive under sync. The CLO prefers exclusion because it makes the deletion promise true; that disagreement is already recorded in the PRD (R235) and goes to the founder with both positions.

## Answers to the delta's founder questions Q1 to Q5

Each is a recommendation to the founder, who decides. None touches a privacy promise on its own, with the exception noted at Q5.

| Q | Question | Privacy answer |
|---|---|---|
| Q1 | Inline picker as the body of the tab, or inside a full-height sheet? | Sheet. A picker in the body of the tab would show a parent's library to anyone looking at an unlocked phone each time the tab opens, with no act by the parent. In a sheet it appears on a tap and goes away with Cancel, and our host can close it when the app goes inactive (EXH-PRV-12). Also keeps Apple's onboarding words out of the first screen of the tab |
| Q2 | Drop the album chooser and Leave out this picture now? | Yes, drop both. It collects less. Residual: EX-PRV-9 stays, with Hide this day on the card (EXH-PRV-9). The door back is open if the card sort asks for it |
| Q3 | Date chip only, or also a place from a picked file's location? | Date chip only. Reading a location from a picked file would add a collection to a path that otherwise needs none and would raise the location questions the delta names as Q3 and Q4 of the counsel packet. The stronger rule: our code never reads the location of a picked file at all, it only strips it (EXH-PRV-3) |
| Q4 | Defer the viewer (PR 20) for 1.0? | No privacy objection to deferring, and a small gain: no full-size decode of library assets in our process. It is a design and product call |
| Q5 | Door under F1 only, so a failed library gate never removes it? | Yes, with two conditions. The library module must be excluded at build time when F2 is off (EXH-PRV-2), and the door must not ship to the store before policy, label and the backup line match (EXH-PRV-1). Without the second, "ships with library gates dark" is a way to ship a photo feature with stale promises |

## Can the picker door ship with library gates dark?

Yes, technically and from a privacy view, under these conditions only:

1. F2 off means `scribe-library` is absent from the binary, no photo-library usage string is present, and `scribe-photo` has no PhotoKit authorization, fetch or change call (EXH-PRV-2, EXH-PRV-5); a build scan proves it.
2. The picker is created without a library configuration in every state (EXH-PRV-5).
3. The date read, strip and temp-copy rules hold (EXH-PRV-3, 4, 7), with video held back until its strip test passes.
4. Policy, label, backup line and deletion screen are in the same build (EXH-PRV-1).
5. The G2 questions that need only the library read (label for the read, purpose string, location, 5.1.2(v) and (vi)) stay open and stay dark. The ones the door also touches, Q5 (name), Q6 (other people's children), Q7 (backup) and Q9 (publisher), must be answered or defaulted before the door ships. The delta says the same (section 5); I agree. Counsel must confirm that the door alone needs none of Q1 to Q4 and Q10: that is the delta's reading and mine, and neither is a counsel view.

## Label and purpose string by profile

| Profile | Photo-library usage string | Label rows that change (all UNVERIFIED against Apple's current page; counsel confirms) |
|---|---|---|
| F1 only (picker door, library dark) | Absent, with the module excluded | Photos or Videos: not collected while copies stay on the phone (Variant A); Location: not collected; policy gains the backup line; the "No photo feature" sentence goes |
| F1 plus F2 (library read on) | Present; names date, time and place; the same key set as the primer and Me row (R72, R192) | As in my EX-PRV-8 table. Library read adds no collected type while nothing leaves the phone |
| Variant B (media sync), if the founder ever chooses it | Unchanged | Photos or Videos becomes collected and linked; label, policy and counsel reads change in that build |

## What I did not do

Did not read Apple's PHPicker, PhotosPicker, PhotoKit or App Review text, any FTC text or statute, or the WWDC session: every platform and legal statement above is UNVERIFIED and carried from the delta or my skill. Did not run the trace script or any test. Did not read every spec row, only those on the picker, attach, strip, label, backup, quiet-book, analytics and gate paths. Did not read `docs/legal/subprocessors.md`. The `PICKER-ROUTE-FEASIBILITY.md` file was not on the remote.

## For the review log

Round 2, 21 Nov 2026, Privacy, hybrid: ACCEPT-WITH-CHANGES. Rows to change: delta NEW-1 (add: no stored fact), NEW-3 (date read contract), NEW-5 (strike the library configuration), NEW-7 (delete originals at once), R169 and R170 (build-time exclusion), R88 (scan list), G1a (synthetic files), G7 (Limited, switcher and App lock rows), G11 (paperwork parity covers the door), R81 and R235 (backup line gates the door), R56 and R57 (dropped; card menu Hide this day). Next action: `product` folds EXH-PRV-1 to EXH-PRV-5 into the delta before PR 18b is filed; I re-read them and sign the label table before any store build carries the door.

Chief Privacy Officer (Claude role, not counsel)
