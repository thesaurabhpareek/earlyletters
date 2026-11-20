# Area A. Capture: end-to-end design

Owner: design lead, area A (design-systems), 20 Nov 2026. Brief: `docs/design/e2e/BRIEF.md`. Motion: `MOTION.md` (this folder). Words: `WORDS.md` (this folder).
Sources, in order: the locked cards (`docs/product/prd/01`, `08` NS-09, `09` NS-13 to NS-20, `06` Part C, `04`, `11` NS-35), then `14-test-plan.md` and `16-council-review-round-2.md`, then engineering (`13`, plan PR #847 `17-engineering-project-plan.md`, BACKLOG BL-922 to BL-987, `/home/claude/review/eng/C-platform-quality-delivery.md`), then house design. The app as built on the lock branch is the baseline: `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/write.tsx`, `app/review.tsx`, `components/capture/*`, `components/tonight/*`, `components/child/whose-book-sheet.tsx`, `components/book/date-sheet.tsx`.

Nothing here was run on a phone. Words in quotes are intent; WORDS.md holds the PROPOSED keys, and the founder approves words. UNVERIFIED marks anything not read this session. No real family: the fixture is the fictional Asha (and a second book, Kiran, for two-book states).

Superseded history (BRIEF 1.5): design spec 01 (photo) where it drew a cropped thumbnail and a full-width thumbnail at accessibility sizes (NS-01-R39, R42 win); design spec 05 (hands-free) is used only as hypotheses (NS-04 decides); design spec 06 (IA) only where the frame agrees (three tabs, one start).

---

## 1. Screen inventory

| Id | Screen | Built today | Cards |
|---|---|---|---|
| A-S01 | Home (Say): whose-book switcher, dateline, greeting, prompt, Another thought, capture cluster (Speak, Type, Start from a photo, Not much today), one slip | `app/(tabs)/index.tsx` (no switcher, no photo start on the lock branch; photo start in #838) | NS-35, NS-14, NS-01, NS-13 R9 landing, NS-18 landing, NS-19 (not drawn), frame slip rule |
| A-S02 | Whose book sheet (one `Sheet`, radio list, current month under each name) | `whose-book-sheet.tsx`, `child-switcher.tsx` | NS-14 |
| A-S03 | Apple's photo picker, and our states around it (iCloud download, cancel, failure) | system; `lib/photos/picker.ts` in #837 | NS-01 |
| A-S04 | Listen at Ready: from a link or doorway (red circle), with a picture (Speak and Type), the microphone primer and the three start problems | `app/listen.tsx` (ready, primer, denied, busy, full) | NS-01, NS-06 C, NS-04, NS-35 |
| A-S05 | Listen while recording: listening, still here, paused, finishing | `app/listen.tsx` | NS-04 hypotheses, NS-06-C9, NS-09 (Let it go from here) |
| A-S06 | Write (Type) | `app/write.tsx` | NS-35, NS-01 (picture carried), D2 |
| A-S07 | Review: the letter sheet with To, the day and From; words states; picture; another language; Keep; Let it go | `app/review.tsx`, `words-state.logic.ts`, `letter-sheet.tsx` | NS-15, NS-16, NS-17, NS-01, NS-09, NS-14, NS-19, NS-20 |
| A-S08 | Day sheet ("When was this?", A day or A month) | `components/book/date-sheet.tsx` (letter page only today) | NS-15 |
| A-S09 | From sheet (who is speaking: one field, names used on this phone, the instruction line) | none | NS-16 |
| A-S10 | Another language: the mark on Review, the words-set-aside state, Type the words yourself | `language-hold.ts` card state `language` (held languages only) | NS-17 |
| A-S11 | Let it go confirmation (from Review and Listen) and the not-removed-yet line | `Alert.alert` in `listen.tsx:411`, `review.tsx:408` | NS-09 |
| A-S12 | Use this picture instead? (replace confirm), and the Undo line after replace or take off | #839 (confirm; Undo toast with no expiry) | NS-01 R7, R38 |
| A-S13 | After Keep: the saved moment, the held letter, and the hand-offs (Keep gate E-S10, reminder ask D-S04) | `saved-moment.tsx`, `plus-gate.tsx` | NS-01 R5b, R18; D-082 |
| A-S14 | Doorways outside the app: widget, Control Center control, Action Button, Siri phrase; unlock; App lock | none (conditional on NS-04) | NS-06 C, NS-04, NS-35 R3, R4, R7 |
| A-S15 | Hands-free states (hypotheses only; NS-04 findings decide) | none | NS-04 |

Cross-area screens this area lands on or hands to (ids from the other folders): E-S10 Plus gate at Keep; E-S15 system line; E-S17 low storage; E-S18 second account; E-S19 interruption and recovery; E-S22 App lock cover; E-S02 first run; D-S04 reminder ask; D-S11 notification landing (typed-day line above the prompt); D-S21 Not much today kept line; B-S08 letter page; B-S09 day sheet on the letter page (the same component as A-S08); B-S11 picture on the letter page; B-S17 one past letter slip; B-S18 seal-opened slip; C-S06 Save a copy slip; C-S18 Storage (stuck recording).

### 1.1 State names used in every screen

Every screen lists only the states that apply. Shared names: `default`, `empty`, `loading`, `offline`, `error.<code>`, `killSwitch`, `planLapse`, `secondAccount`, `signedOut`, `ax5` (largest text plus Bold Text on a 375 pt wide SE 3), `vo` (VoiceOver reading order), `dark`. Where a shared state changes nothing, the screen says "same as default" once rather than drawing it.

---

## 2. Journeys

Numbered flows. Each step names the screen state. "J-Nn" is the test-plan journey it serves.

### 2.1 Happy paths

**A-J01 Speak a letter and keep it** (NS-35, baseline; J-N20 with VoiceOver)
1. A-S01.default: the parent reads the prompt and taps Speak.
2. First time only: A-S04.primer, Continue, then the iOS microphone question (system).
3. A-S05.recording: "Listening.", the aura moves only with the voice; Pause and Finish pinned.
4. Finish. A-S05.finishing, then A-S07.writing (the words are on their way), then A-S07.default (the letter with its small fixes marked).
5. Keep ("Add to Asha's book"). A-S13.saved: the sheet files into its month; lands on the Book.
6. After the first kept letter only, Home shows the reminder ask (D-S04, not a slip).

**A-J02 Type a letter** (NS-35)
1. A-S01.default, Type. 2. A-S06.default, the prompt as the line above the field; "Saved on this phone" as the parent writes. 3. Save. A-S07.typed (no fixes, no Play). 4. Keep. A-S13.saved.

**A-J03 Start from a photo** (NS-01 section 4; J-N9 first half)
1. A-S01.default: "Start from a photo", under Speak and Type.
2. A-S03.open: Apple's picker, no permission question. Pick one.
3. A-S04.readyPhoto: thumbnail (at most 160 pt tall, fitted, uncropped), Change under it, the prompt (the same prompt as without a picture), Speak and Type.
4. Speak: A-S05.recording with the picture held small at the top. Or Type: A-S06.withPhoto.
5. A-S07.withPhoto: the picture card under the letter, with the optional words about it and where.
6. Keep. A-S13.saved with the picture on the sheet. The Book's Months or Photos choice appears (B-S03).

**A-J04 Two books: whose book** (NS-14; J-N6)
1. A-S01.twoBooks: "For Asha" with a chevron above the dateline.
2. Tap: A-S02.default, two rows (Asha, Month 7; Kiran, Month 31). Choose Kiran; the sheet closes; the dateline, greeting and prompt now read for Kiran.
3. Speak, Finish, A-S07.twoBooks ("To Kiran"), Keep. The letter files into Kiran's book. The Book opens on Kiran (one selection, R6).

**A-J05 A letter for another day** (NS-15; J-N7)
1. Speak a letter about last Thursday. A-S07.default shows the day line "Today, 9 June" with a calendar affordance.
2. Tap the day line: A-S08.day opens on today. Pick 5 June. Save (off until the pick differs).
3. A-S07.dateSet: the day line reads the chosen day; VoiceOver hears the new month once.
4. Keep. The Book files it in that month; the letter page shows both days (B-S08, NS-15-R3).

**A-J06 Someone else speaks** (NS-16; flag `EXPO_PUBLIC_SIGN_AS_OTHER` on)
1. Home, Speak, hand the phone over. Nani speaks. Finish.
2. A-S07.default: "From Mama" at the top right of the sheet is a control.
3. Tap: A-S09.empty. Type "Nani" (or pick it from names used on this phone). The instruction line sits under the field. Done.
4. A-S07.fromSet: "From Nani". Keep. The letter is signed "From Nani" everywhere, kept by the parent; read-only after Keep.

**A-J07 Another language** (NS-17; J-N23, J-N16; English-only build)
1. Speak in Spanish. A-S07.default shows English-looking words.
2. Under the words, the quiet control "This was in another language". One tap.
3. A-S10.withheld: the words leave view; the recording stays (Play); the waiting line; Undo for the T4 window (see card gap G-07); "Type the words yourself" and "Keep the recording".
4. "Type the words yourself": A-S06.forTake (the field is the parent's own; never machine-edited). Save. Keep. The letter holds the typed words and the recording.

**A-J08 Let it go from Review** (NS-09; J-N1)
1. A-S07.default: "Let it go" is the last quiet control in the scroll, away from Keep.
2. A-S11.confirm: default is "Keep it"; says it cannot be brought back.
3. Confirm. Back to where they came from (Home, or the Book's waiting card). Nothing else shows.

**A-J09 Let it go from Listen** (NS-09-R3)
1. A-S05.recording or .paused: "Let it go" under Pause and Finish.
2. A-S11.confirmListen. Confirm: recording stops, file then row go, back to Home.

**A-J10 Not much today** (D-084; D-S21 draws the line)
1. A-S01.default, "Not much today". 2. A-S01.quietKept: the link gives way to the kept line with Undo (T4 window); the lamp lowers in the evening. 3. Undo removes the mark.

**A-J11 A reminder tap lands on Home** (NS-13-R9; J-N3)
1. Lock screen notification (D-S10), tap. 2. A-S01.fromReminder within 2 s on an SE 3, the current prompt, nothing recording (NS-35-R7). 3. One tap on Speak starts A-J01.

**A-J12 A typed day lands on Home** (NS-18; D-S11 draws the line)
1. Tap the typed-day notification. 2. A-S01.typedDay: the parent's own words ("Nursery starts") above the prompt, exactly as typed. 3. Speak.

**A-J13 A doorway opens Ready** (NS-06 C; only for a doorway that passed NS-04)
1. A-S14.widget (or control, Action Button, Siri). 2. A-S14.unlock (system) if locked; E-S22 if App lock is on. 3. A-S04.ready ("Tap the red circle and talk."), active book. 4. Tap the circle: A-S05.recording. 5. Finish: A-S07, the letter is a draft until Keep (NS-06-C4).

**A-J14 Pick up a waiting letter** (NS-35 resume; frame slip 1)
1. A-S01.waiting: the waiting cards. 2. "Pick it up" opens A-S07 for that draft (a resume, never a start). 3. Keep.

**A-J15 Past the free allowance** (D-082; E owns the gate)
1. A-S01.plusLine: the standing line above Speak and Type (built, F14-REQ-040). Capture is never blocked.
2. Speak, Finish, A-S07.default, Keep. 3. E-S10 opens; "Keep it here for now" holds the letter: A-S13.held, then A-S01.waiting ("Waiting to be kept."). Nothing about the visitor or the picture is at risk.

**A-J16 Change or take off a picture on Review** (NS-01 R7, R38)
1. A-S07.withPhoto, "Change photo": A-S03.open, pick: A-S12.confirm ("Keep the first one" is the safe default). "Use this one": A-S12.undo (T4 window).
2. "Take the photo off": removed at once, A-S12.undo. Undo puts it back while the window is open; the Undo control leaves the screen in the same moment the window closes (R38b).

**A-J17 VoiceOver only** (J-N20, NS-33)
Start (Speak), stop (Finish), review (rotor through the fixes rows), put back a fix (Put it back), Keep, with no sighted help. Reading orders are in each screen's `vo` state. VoiceOver never speaks into a take (built gate, `speech-gate.ts`).

### 2.2 Unhappy paths, by card

NS-35 (one start)
- A-U01 Arrival from outside (notification, link, restored screen): lands on Home or Listen at rest (A-S04.ready); the microphone is not touched until the parent taps (R7; built `start-intent.ts`).
- A-U02 Type instead on Listen, Record again on Review, Change on Ready: mode changes, not starts (R2).
- A-U03 The Book's empty state button: a tab switch to Home only (B-S01).
- A-U04 Interrupted capture: resumes as a waiting card on Home, never from another tab (E-S19).

Listen and recording (built; F04)
- A-U05 Microphone denied: A-S04.denied: "Type instead" primary, "Open Settings" quiet. Back from Settings with the microphone on: Listen at rest.
- A-U06 Microphone in use by another app: A-S04.busy: Try again, Type instead.
- A-U07 Phone full at start (under 50 MB): A-S04.full: Type instead, Try again. No draft is created.
- A-U08 Call, Siri or alarm mid-take: the take stops and is kept; Review opens with the one stop line ("Everything before that is kept" family, built S14).
- A-U09 App to background mid-take: same as A-U08 on return.
- A-U10 App killed mid-take: the launch sweep keeps it; Home shows "Recorded before the app closed." (E-S19).
- A-U11 Words not ready: A-S07.writing, .ask, .downloading, .language, .failed, .unsupported, .unreadable, .fileMissing, .emptyTake, .shortTake, .noWords (built cards, one primary and at most one quiet action each).
- A-U12 Keep did not save: A-S07.saveFailed ("That did not save. Your words are still here."), primary reads Try again.

NS-01 (photo, capture side)
- A-U13 Cancel in the picker: back on Home, nothing written, no message (R4).
- A-U14 Back or Close from Ready before speaking: nothing written, temporary copy deleted, Home as before (R4, R52).
- A-U15 The picture cannot be opened (corrupt, unknown type, over 150 MP): A-S04.photoCouldNotOpen: one calm line where the thumbnail would be, "Choose another" and Speak and Type still there (#838's line).
- A-U16 iCloud-only picture: A-S03.downloading (progress and Cancel; R17b not met in the stack). Offline: A-S04.iCloudOffline, one calm line, capture continues without a picture (R46).
- A-U17 Phone too full to store the picture, re-encode fails or times out at 20 s: at Review open, A-S07.photoNotStored: the letter goes on, one calm line with "Add a photo"; 0 files remain (R17a, R45, R58).
- A-U18 A picture and no words: A-S07.photoNeedsWords: Keep is off, with the reason in words (R5a).
- A-U19 A second picture: A-S12.confirm, "Keep the first one" leaves everything (R7).
- A-U20 Let it go with a picture: A-S11.confirmPhoto: the picture goes with the recording (R16c).
- A-U21 A pick lands while App lock is up: dropped, 0 files; the parent sees the lock cover only (R47).
- A-U22 App killed after the pick, before Review: no picture kept; if recording had started the draft returns without it (R43; BL-955 improves this).
- A-U23 Interruption on Ready with a picture: the picture is still there on return (R57).
- A-U24 Flag off, `killSwitches.photos` on, or no native module: the photo start, Change, Add, Take off are absent, never greyed (R19, R59). Pictures already stored are untouched.
- A-U25 A quiet-day mark: no picture control (R25).

NS-14 (whose book)
- A-U26 One book: no switcher and no gap (R2).
- A-U27 Two books with no names: each row and the switcher label carry the birth or due date (R7).
- A-U28 Switch while a draft is waiting: the draft keeps its child; its card still says whose it is (R4).
- A-U29 Listen open: no switcher on screen (R8). Review's own "To" control may still move this one draft (built; see card gap G-12).
- A-U30 A hidden book: absent from the sheet (R9). A book with reminders off: present.
- A-U31 Second account on the phone: selection resets, none of A's names (R11; E-S18).

NS-15 (another day)
- A-U32 A day before birth: allowed; files into Before You.
- A-U33 A future day: not offered. Earlier than 3 years before the birthday or due date: the picker stops there.
- A-U34 A month of age: "Sometime in Month 3" (built dateline).
- A-U35 Interrupted with the sheet open: the pick stays until Save; killed: the unsaved pick is lost, the draft keeps its day.
- A-U36 The words say "last Thursday": nothing changes (R4). A picture's file date: never used (R18).
- A-U37 Held at the gate: the day can still be set on Review before Keep.

NS-16 (someone else speaks)
- A-U38 Field left empty: signed as the parent (A-S09.empty, Done).
- A-U39 Over 30 characters (code points, as the database counts): A-S09.tooLong, a calm line, Done stays off; Keep cannot carry it (R6, `sign_as_too_long`).
- A-U40 Flag off: no control; the signature is plain text (A-S07.fromOff).
- A-U41 After Keep: read-only on the letter page (B-S08).
- A-U42 Past the allowance: the gate sheet never names the speaker; the letter waits as any draft (E-S10).
- A-U43 Sign-out or Erase everything: the names used on this phone are cleared (R15).

NS-17 (another language)
- A-U44 A language the author chose but the build holds: the take waits, never sent to the recogniser (A-S07.language, built).
- A-U45 Marked by mistake: Undo while the T4 window is open (card gap G-07); after it, the mark stands and the parent may type the words.
- A-U46 Keep the recording without words: kept as a letter waiting for its words; it never counts until words exist (D-103).
- A-U47 The language ships later: waiting recordings get their words in their own language; nothing lost.

NS-09 (Let it go)
- A-U48 The file will not delete: A-S11.notRemoved on that Review visit, once, announced after the screen settles; never blocks leaving.
- A-U49 Still stuck after 3 launches: Storage in Me names it with Remove now (C-S18).
- A-U50 Offline, kill switch, signed out: the local delete completes; the server discard waits, held for the same account. Nothing shown.
- A-U51 Interrupted after confirm: the delete still runs. Before confirm: nothing happens.

NS-06 C and NS-04 (doorways, conditional)
- A-U52 A take is already active: a second doorway start is refused; the current take stays on screen.
- A-U53 Phone locked: unlock first; App lock cover next (E-S22).
- A-U54 First run not done: the doorway opens first run (E-S02), never Ready.
- A-U55 No book: Home's empty state, never a recording.
- A-U56 Siri mishears: the app opens at Ready, never records.
- A-U57 Doorway fails: the app opens at Home, no error naming the doorway.
- A-U58 Not available on this phone (Action Button on an SE 3, Control Center control on iOS 17): iOS does not offer it; nothing in the app mentions it.

System states that cross every capture screen (E owns the line; A says how capture behaves)
- A-U59 Offline, server outage, `serverFeaturesEnabled()` off, `killSwitches.sync`: capture, Review, Keep, the day, From, the mark and Let it go all work on the phone; sync follows later. No line on Home or Listen.
- A-U60 Plan lapsed: capture never blocked; only Keep of a new letter past the allowance meets E-S10.
- A-U61 Low storage under 1 GB: E-S17 line on Home above the capture cluster; capture works. Under 50 MB: A-S04.full.
- A-U62 App updated with a draft waiting: the draft (with its picture, day and From name) is intact (NS-01-R44).

---

## 3. Screens

Grid: 375 pt wide (SE 3 and the prototype frame), gutter 20 pt (`space[5]`), 4 pt scale. Targets: 44 pt minimum, 56 pt primary, 64 pt capture (`target`). Type: `promptHero`, `prompt`, `title1`, `title2`, `headline`, `callout`, `subhead`, `footnote`, `letterBody`, `letterDateline`, `signature` (tokens.ts). Colour: tokens only; `recording` means listening, never an error; `caution` for a save that did not work; `textMuted` for the app's small voice. Dark: the `dark` set; sheets carry a 1 pt `line` edge instead of a shadow. Increase Contrast: the `highContrast` overrides. Smart Invert: pictures ignore invert (NS-01-R40). AX5 rule used everywhere (built `footerPlacement`): at accessibility sizes, pinned actions ride inline in the scroll, under the content they act on.

### A-S01 Home (Say)

Default layout, top to bottom:
1. Whose-book switcher (two or more visible books only): "For Asha" + chevron, `subhead`, 44 pt row, left aligned, above the dateline (NS-14 design inputs).
2. Dateline: "ASHA (dot) 7 MONTHS" (`letterDateline`, caps; read "Asha, 7 months"). Before birth: "ASHA (dot) BEFORE YOU".
3. Greeting, `title2`, two tones (built).
4. Typed-day line (A-J12 only): the parent's own words, `callout`, above the prompt (D-S11 draws it).
5. Prompt, `promptHero`, on the paper. "Another thought", quiet, 44 pt.
6. One slip (frame order): (1) the waiting cards, as built (several drafts each a card, two or more held letters fold into one row); else (2) the seal-opened line (B-S18) on its day; else (3) Save a copy in the birthday week (C-S06); else (4) one past letter (B-S17).
7. Capture cluster, pinned in the thumb zone above the tab bar: the Plus line when it applies (built); Speak and Type as equal 64 pt twins; "Start from a photo" quiet 44 pt centred under them (image icon, never larger than either); "Not much today" quiet 44 pt under that.

AX5 (375 pt): the switcher label wraps to two lines (names never truncate; chevron stays on the first line end); dateline wraps; the capture cluster rides inline under "Another thought" and before the slip; Speak and Type stack full width (64 pt each); Start from a photo and Not much today stack full width at 44 pt. The switcher, dateline and the three capture controls never overlap (NS-14-R5).

VoiceOver order: switcher ("Letters go to Asha's book", hint "Changes whose book", intent) > dateline > greeting (heading level 1) > typed-day line > prompt (hint "A thought to start with") > Another thought > [default size: the slip, then the cluster; AX5: the cluster, then the slip, matching what is seen] > Plus line > Speak > Type > Start from a photo > Not much today. Voice Control names equal the visible labels: "Speak", "Type", "Start from a photo", "Not much today", "For Asha".

States:
| State | What changes |
|---|---|
| `default` | One book, no slip, cluster pinned |
| `twoBooks` | Switcher above the dateline (R1) |
| `twoBooksNameless` | Switcher label and sheet rows carry the date: "For your child, born 2 March" (intent) (R7) |
| `beforeYou` | Due date only: "BEFORE YOU" dateline; prompts from that set; no age words |
| `waiting` | Slip 1: waiting cards ("Waiting to be kept.", "Recorded before the app closed.", "A recording is ready to read back.") with Pick it up / Open; a picture draft shows its 40 pt thumbnail on the card (PROPOSED) |
| `heldMany` | Two or more held letters: one row, "Letters waiting to be kept." with Show them |
| `slipPast`, `slipSeal`, `slipCopy` | Hand-offs to B-S17, B-S18, C-S06; at most one |
| `plusLine` | Allowance used and no Plus: the standing line above Speak and Type, no button, no price (built) |
| `photoOff` | Flag off, `killSwitches.photos`, no native module: no photo start and no gap (R19, R59) |
| `quietKept` | Not much today kept: the kept line with Undo replaces the link (D-S21) |
| `fromReminder` | Same as default; the current prompt; nothing records (NS-13-R9, NS-35-R7) |
| `typedDay` | Typed-day line above the prompt (D-S11) |
| `lowStorage` | E-S17 line above the cluster; capture works |
| `offline`, `killSwitch`, `planLapse`, `signedOut` | Same as default (plan lapse may add `plusLine`) |
| `secondAccount` | B's books only; selection reset (NS-14-R11; E-S18) |
| `empty` | No book: first run (E-S02); a doorway never records here |
| `ax5`, `vo`, `dark` | As above |

Components: existing `Lamp`, `Text`, `Button` (capture, quiet), `ButtonRow`, `DraftCard`, `HeldRow`, `PlusLine`, `QuietDayInline`, `ResurfacedCard` (to be replaced by NS-23's slip), `ChildSwitcher` (from the Book, gains `surface: 'home'`), `PhotoStart` (#838, `components/photos/photo-start.tsx`). New: none.

Integration map:
| | |
|---|---|
| Card rows | NS-35-R1, R3, R5, R7; NS-14-R1, R2, R5, R6, R9, R10, R11; NS-01-R1, R19, R20a, R59, R60; NS-13-R9; NS-18-R1 (landing); NS-19-R1 (no record into a kept letter, nothing drawn); frame `[FRAME-SLIP]` |
| Backlog | BL-941 (switcher), BL-931 / #838 (photo start), BL-963 (slip registry), BL-946 (past letter), BL-942 (Save a copy slip) |
| Flags | `EXPO_PUBLIC_PHOTOS` (on only for `on`; a local feature, `localFeatureEnabled` per plan 17 2.2) |
| Kill switches | `killSwitches.photos` hides the photo start only. `serverFeaturesEnabled()` off: no change |
| Error codes | none shown on Home |
| Data read | active child (`useChildren`), `listDrafts(childId)`, entries (past letter, quiet mark), plan view, letters kept; prompt selection inputs |
| Data written | active child selection (local); a quiet-day mark (`startCapture({source: 'notMuchToday'})`) |
| Module | `app/(tabs)/index.tsx`, `lib/capture/start-capture.ts` (sources `speak`, `type`, `notMuchToday`, `photo`), `components/tonight/*`, `components/child/child-switcher.tsx` |

### A-S02 Whose book sheet

The one `Sheet` with title "Whose book?" (built `children.switcher.title`) and a `ChoiceGroup` list: each row the book title ("Asha's book") with the current month under it ("Month 7", "Before You"), radio selection shown by a check and weight, not colour. A tap chooses and closes. A last row "Add a book" routes to `settings/children/new` (as built on the Book).

AX5: rows grow, names and month lines wrap; the list scrolls inside the sheet. VoiceOver: sheet title, then each row "Asha's book, Month 7, selected" / "Kiran's book, Month 31", then Add a book, then Close. Reduce Motion: the system sheet's reduced transition.

States: `default` (two books), `many` (three or more, scrolls), `nameless` (dates on rows), `hiddenExcluded` (a hidden book is absent), `dark`, `ax5`, `vo`. Interrupted: stays open or closes with no change.

Components: existing `Sheet`, `ChoiceGroup` (`WhoseBookSheet`). New: none.
Integration: NS-14-R1, R6, R7, R9, R10; BL-941; no flag, no kill switch, no error code; reads `listChildren()` minus hidden; writes the active child id (local, L3, not synced); module `components/child/whose-book-sheet.tsx`, `child-switcher.tsx`.

### A-S03 Apple's photo picker and the states around it

The picker is Apple's (`PHPickerViewController`, one still, no library permission). Ours are only what happens around it.

States:
| State | Shows | Code or outcome |
|---|---|---|
| `open` | System picker over Home (or Review, or the letter page) | pick outcome `picked` |
| `cancel` | Back where they were; no message; nothing written | `cancelled` |
| `downloading` | iCloud-only picture: the system progress with Cancel (R17b; not met in #837: P-1 / BL-950) | none |
| `iCloudOffline` | Ends at A-S04.iCloudOffline | `failed` |
| `failed` | Ends at A-S04.photoCouldNotOpen | `photo_pick_failed` |
| `appLockDrop` | A pick landing under App lock is dropped; the parent sees the lock cover (E-S22) | none (0 files, R47) |
| `noNativeModule` | Never reached: the start is absent (R59) | none |

Integration: NS-01-R2, R4, R17b, R22, R46, R47, R52; BL-931 (#837), P-1 / BL-950 (progress); flag `EXPO_PUBLIC_PHOTOS`, kill `killSwitches.photos`; codes `photo_pick_failed`, `picked_file_outside_picker_folder`, `photo_temp_name_refused` (all shown as `failed`, never logged with a path); writes the picker's temporary copy in `Caches/ImagePicker`, deleted once read; module `modules/scribe-photo`, `lib/photos/picker.ts`, `use-photo-pick.ts`.

### A-S04 Listen at Ready, the primer and the start problems

Two Ready forms, kept apart on purpose:

1. **Ready at rest** (built S12: a link, a restored screen, a doorway): Close (the word, top right, N2); "To Asha" (`headline`) with the lock line "Only you, until you add it to the book." (`footnote`); the prompt if one came with it; the 120 pt red circle is the start control (target 120 pt), held in a glass ring: the v2 record control A3 at `ready`, keeping the red disc so the built words "Tap the red circle" stay true; "Tap the red circle and talk." (`callout`, muted); the region where the record control's Pause and Finish appear is reserved, so nothing moves when the take starts (built 5.8 rule 3).
2. **Ready with a picture** (NS-01-R3, R20b): Close; "To Asha" and the lock line; the thumbnail, fitted and uncropped, at most 160 pt tall, 1 pt hairline frame in dark mode and Increase Contrast; "Change" quiet 44 pt under it; the prompt (`prompt`); Speak and Type as the 64 pt twins in the thumb zone (as on Home, because the card names them). No red circle.

AX5: Ready at rest: the room scrolls; the clock and line pin with the controls (built). Ready with a picture: from AX3 the thumbnail is at most 88 pt tall (R39, O-4 default), Change wraps beside or under it, Speak and Type stack and are on screen without scrolling on an SE 3; the prompt scrolls if long.

VoiceOver: at rest: Close > To Asha > lock line > prompt > the red circle ("Start recording") > hint. With a picture: thumbnail ("Photo with this letter", or the parent's own words if typed later) > prompt > Speak > Type > Change (R20b, order set explicitly even though Change sits visually under the thumbnail) > Close.

Primer and problems (built `MicPrimer`, `micStateView`), one state layout: glyph in its soft circle, title, body, one primary, one quiet way, Close top right.
| State | Title (built key) | Primary | Quiet | Code |
|---|---|---|---|---|
| `primer` | `listen.primer.title` | Continue | Type instead (same size: equal way) | none |
| `denied` | `errors.micDenied` | Type instead | Open Settings | `mic_denied` |
| `busy` | `errors.micBusy` | Try again | Type instead | none (catalogue has no code; see E-gaps) |
| `full` | `errors.phoneFull` | Type instead | Try again | `storage_low` |
With a picture pending, each of these keeps the picture: Type instead carries it to Write; Close discards it with nothing written (card gap G-15).

Photo failure states on Ready: `photoCouldNotOpen` (line in the thumbnail slot, "Choose another", Speak and Type unchanged; `photo_pick_failed`, `photo_reencode_failed`, `unreadable`), `iCloudOffline` (line in the slot, "Choose another"; R46). Both keep the capture going without a picture.

Other states: `lowSpace` (under 1 GB: one line under the hint; capture goes on), `doorway` (identical to Ready at rest; NS-06-C1; VoiceOver announces Ready on arrival), `appLockFirst` (E-S22 then Ready), `firstRunIncomplete` (E-S02, never Ready), `secondTakeRefused` (a doorway while a take runs: the current A-S05 stays; no new Ready), `interruptedOnReady` (picture still there, R57), `offline`/`killSwitch`/`planLapse`/`signedOut` (same as default), `secondAccount` (Ready for B's active book only), `dark`, `ax5`, `vo`.

Components: existing `ListeningAura`, `Button`, `ModalHeader`, `StateScreen`, `StateGlyph`, `PendingPhotoThumb` and `PhotoFrame` (#838; COMPONENTS 2.23) with `fit` and the 88 pt rule. New: none.
Integration: NS-35-R2, R3, R7; NS-01-R3, R4, R20b, R39, R40, R41, R42, R46, R57; NS-06-C1, C2, C9; BL-931 (#838), BL-956 (AX3 thumbnail, fit, Smart Invert), BL-971; flags `EXPO_PUBLIC_PHOTOS`, `EXPO_PUBLIC_QUICK_CAPTURE`; kill `killSwitches.photos`; codes `mic_denied`, `storage_low`, photo codes above; reads active child, prompt key, pending picture; writes nothing until the tap (the draft row is written before the microphone goes live); module `app/listen.tsx`, `listen.logic.ts`, `mic-state.logic.ts`, `lib/resilience/start-intent.ts`, `lib/photos/pending.ts`.

### A-S05 Listen while recording

Layout (built): the header slot holds still (Close hidden while recording); "To Asha" and the lock line; the prompt (3 lines, whole at AX sizes); the aura, the only thing that moves, and only with the voice; the clock (`headline`, tabular, muted: not a timer); the line "Listening." or, after 8 s under -50 dB, "Still here. Take your time."; "Say it however it comes."; Pause and Finish as equal 56 pt halves; Let it go quiet under them. With a picture pending: a 56 pt thumbnail beside "To Asha" (PROPOSED; still, no motion) so the parent knows it goes with this letter.

AX5: the room scrolls; the clock and line pin with Pause and Finish, so the screen always says it is recording; Pause and Finish stack full width.

VoiceOver: never speaks into the take; labels hold still while capturing (built `stableLabels`); minute marks are dropped while live; "Paused." is said once the recorder has really stopped. Order: To Asha > lock line > prompt > clock > line > Pause ("Pause or keep talking") > Finish > Let it go.

States: `recording`, `stillHere`, `saved` (the moment before Review), `lowSpace` (under 1 GB: one line in place of the hint, v2 F2), `paused` (aura still and dimmed, "Paused.", button reads "Keep talking"), `finishing` ("Saving your words."; never stuck, leaves within the finish timeout), `withPhoto`, `interrupted` (call, Siri, alarm, media reset: the take ends and is kept; Review opens with the stop line, A-U08), `backgrounded` (same, A-U09), `confirmLetGo` (A-S11 over it), `offline`/`killSwitch`/`planLapse`/`signedOut`/`secondAccount` (same), `dark`, `ax5`, `vo`.

Never: a count of takes, a countdown, a flash, a sound while recording, an auto-stop on silence (spec 05 H4, NS-04 Q8 closed).

Components: existing. New: none. Integration: NS-06-C9, C11 (route change, device); NS-09-R3 (Listen's Let it go keeps a row whose file is still there; built #832); NS-35-R2; F04 rules; BL-924 (done), BL-972 spike; no flag; no kill switch (a recording is never remotely paused, LEGAL-REQ-040); codes none shown; writes the draft row before the microphone, progress every 5 s, the file; module `app/listen.tsx`, `lib/capture/recorder.ts`, `lib/speech-gate.ts`, `lib/resilience/keep-awake.ts`.

### A-S06 Write (Type)

Built: the prompt as the line above the field; the field in the letter face; "Saved on this phone" (or "Not saved yet") as it autosaves; the very-long line past about 100,000 characters (nothing cut). Save opens Review.
Added: with a picture pending, the thumbnail (same rules as A-S04) above the prompt with Change; the system writing tools are off on the field (card gap G-16: D2 names the Review editor, and this field becomes a letter's words too). From "Type the words yourself" (A-S10), Write opens for that take (`draftId`): the recording stays, the line above the field says the words are the parent's own (intent), and Save returns to Review.

AX5: the field grows; Save rides above the keyboard. VoiceOver: Close > prompt > field ("Your letter") > save state line > Save.
States: `default`, `withPhoto`, `forTake`, `autosaved`, `notSaved`, `tooLong`, `offline` (same), `dark`, `ax5`, `vo`.
Integration: NS-35-R2; NS-01 (#838 edits `app/write.tsx`); NS-17-R9; D2 via BL-962; module `app/write.tsx`, `lib/capture/write-session.logic.ts`.

### A-S07 Review

Default layout, top to bottom (built order kept; three header controls added):
1. Header: Close (with "Saved on this phone" hint when nothing changed), Play or Pause (spoken letters).
2. Title "Read it back" (`title1`).
3. The stop line when the take ended early (built S14).
4. The words card when words are not there yet (built states, one primary and one quiet each).
5. The letter sheet (`LetterSheet`). Its header becomes three controls, each a real 44 pt button with a visible affordance, in `letterDateline` caps, muted:
   - Left, line 1: "TO ASHA" with a chevron, only with two or more books (built `onChangeBook`; moves this one draft).
   - Left, line 2: the day line, "TODAY, 9 JUNE" or "5 JUNE (dot) MONTH 7" or "SOMETIME IN MONTH 3", with a small calendar glyph: opens A-S08 (NS-15-R1). Author only (on Review the author is always this parent).
   - Right: "FROM MAMA" with a pencil glyph when NS-16's flag is on: opens A-S09. Plain text when off.
   Then the words in `letterBody` with small fixes marked (dotted underline, struck words), tappable.
6. The view control "With small fixes | Exactly as said" and the fixes count row (built).
7. "Change words" (quiet).
8. "This was in another language" (quiet; NS-17; shown in an English-only build, or when the author's spoken-language list has one entry, card gap G-06).
9. The picture card (NS-01), when a picture is with the draft: thumbnail (fitted, at most 160 pt; 88 pt from AX3), "Change photo", "Take the photo off", the field "A few words about this picture, if you like" (140 graphemes) and "Where, if you like" (60 graphemes). Writing tools off on both (R50). When no picture and the flag is on: one quiet "Add a photo" row (PROPOSED; NS-01 section 3 allows add on Review).
10. "Let it go" (quiet, muted), the last item in the scroll, away from Keep (card gap G-09).
11. Footer pinned: "Add to Asha's book" (56 pt primary), "Keep private" (44 pt quiet). The caution line above it when a save did not work.

AX5: the header's three controls stack, each full width and wrapping (never truncated); the picture card stacks thumbnail above its fields; the footer rides inline after Let it go (built `footerPlacement`), so the letter keeps the screen.

VoiceOver order: Close > Play > Read it back (heading) > stop line > words card > To Asha (button, hint "Changes whose book") > the day line (button, "About 9 June. Changes the day", intent) > From Mama (button, "From, Mama, button", NS-16 intent) > the letter (one element, its words) > view control (radio) > fixes count (expandable) > fix rows > Change words > This was in another language (reads its consequence, NS-17 scenario row) > picture (fixed label, or the parent's words) > Change photo > Take the photo off > photo words field > place field > Let it go > Add to Asha's book > Keep private.

States:
| State | What changes | Rows |
|---|---|---|
| `writing` | Words on the way; after 15 s with no progress, "Read it back later" | built S14 |
| `ask`, `downloading` | Language pack: get ready / downloading, Keep the recording | built S15, D-087 |
| `language` | A language this build holds: the waiting line, Keep the recording, Type it instead | NS-17-R10 |
| `failed`, `unsupported`, `unreadable`, `fileMissing`, `emptyTake`, `shortTake`, `noWords` | Built cards (words-state.logic) | F04, S16 |
| `default` | Words with fixes, all controls | |
| `exact` | Exactly as said view | D-086 |
| `editing` | Change words in place; Done in the header and footer; writing tools off | D2 |
| `typed` | No Play, no fixes, no another-language control | |
| `twoBooks` | "TO ASHA" control on the sheet | NS-14 |
| `dateSet` | The day line shows the chosen day; VoiceOver announces the new month once | NS-15-R1, R12 |
| `fromSet` | "FROM NANI" | NS-16-R1 |
| `fromOff` | Flag off or `killSwitches.signAsOther`: plain "FROM MAMA" | NS-16 rollout |
| `withPhoto` | Picture card | NS-01-R21a |
| `photoNeedsWords` | Picture, no words: Keep off; line "A letter needs words. Speak or type a few." (intent) | R5a |
| `photoNotStored` | One calm line where the picture card was, "Add a photo" (R58 shape; card gap G-08) | R17a, R45 |
| `photoUndo` | After Take the photo off or a replace: the Undo line (A-S12.undo) | R38 |
| `anotherLanguageOffer` | The mark control under the words | NS-17-R5 |
| `withheld` | A-S10.withheld replaces the letter sheet body | NS-17-R5, R7 |
| `notRemoved` | After a confirmed Let it go whose file would not delete: A-S11.notRemoved | NS-09-R4a |
| `saveFailed` | Caution line above the primary; primary reads Try again | S17 |
| `noDraft`, `keepStillSaving`, `firstNote`, `playing`, `markOpen`, `putBack` | As built (section 9.2) | S17, S23 |
| `dateNotSaved` | Named line instead of the generic one (WORDS G6) | NS-15 Failed row |
| `fromTooLong` | Keep refused with the calm line (R6) | NS-16-R6 |
| `partUnwritten` | Mixed-language stretch: the page says words are not written there | NS-17 section 5 |
| `laterWords` | A letter whose words came later: words as stored, no fixes, no Change words | F14 6.1 |
| `held` | After E-S10 "Keep it here for now": the toast, then back | D-082 |
| `sample` | Development builds only | |
| `offline`, `killSwitch`, `signedOut` | Same as default; the day, From and the mark apply locally and sync later | NS-15-R10, R13; NS-16-R13, R14 |
| `planLapse` | Same; Keep may open E-S10; the day, From, picture, mark are never gated | NS-15-R15, NS-01-R18 |
| `secondAccount` | Only B's drafts | X4 |
| `dark`, `ax5`, `vo` | As above | |

Components: existing `LetterSheet` (header gains three controls: v2 I6 child switcher for To, v2 C6 Dateline `tappable` for the day, v2 A1 `plain` `sm` with a trailing pencil for From), `Transcript`, `EditUnderline`, `ViewControl`, `FixRow`, `WordsStatus` (InlineState), `Button`, `TextField`, `ReviewPhoto` and `PhotoFrame` (#839), `Toast`, `SavedMoment`, `PlusGate`. New: none. (The first draft proposed `LetterHeaderControl`; withdrawn in favour of v2 C6 Dateline, I6 and A1, see section 9.)

Integration map:
| | |
|---|---|
| Card rows | NS-15-R1, R4, R5, R7, R12, R13, R15, R18; NS-16-R1, R3, R4, R5, R6, R7, R9, R13, R14, R18; NS-17-R5, R6, R7, R8, R9; NS-01-R5a, R5b, R7, R8, R9a, R17a, R18, R21a to R21c, R38, R50, R58; NS-09-R4a, R4b, R9; NS-14-R3, R4; NS-19-R1, R4; NS-20-R1 (no control files into two books); D2 (editor) |
| Backlog | BL-945 (day), BL-980 (From), no row for NS-17's Review UI (engineering gap E-03), BL-931 / #839 (picture), BL-954 (Undo), BL-925 and BL-926 (Let it go line), BL-977, BL-962 (writing tools), BL-957 (grapheme counts) |
| Flags | `EXPO_PUBLIC_PHOTOS`; `EXPO_PUBLIC_SIGN_AS_OTHER` (PROPOSED; PRIV-R20 `child-input`); `EXPO_PUBLIC_ENGLISH_ONLY`, `EXPO_PUBLIC_SPOKEN_LANGUAGES` |
| Kill switches | `killSwitches.photos` (hides the picture controls; a stored picture still reads); `killSwitches.signAsOther` (plan 17 proposal; card says build flag only, gap E-08); `killSwitches.sync` (local first); `killSwitches.packDownloads` (language downloads); never a switch on Let it go (NS-09-R17) |
| Error codes | `sign_as_too_long`; photo commit outcomes `needs_words`, `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `no_space`, `failed`, `photo_bake_timeout`, `photo_reencode_failed`, `baked_file_outside_folder`, `photos_folder_unknown`, `photo_path_refused`; transcription states as built; no code is ever shown to the parent |
| Data read | the draft (audio, `raw_transcript`, edits, `promptKey`, `occurred_on`, `occurred_precision`, `createdAt`), queue job, children, plan and ledger, `entry_media` for the draft, `signAs.recent` (PROPOSED) |
| Data written | draft choices as they happen (view, put-backs, own words); `occurred_on` / `occurred_precision` on the draft; the typed From name on the draft (PROPOSED local column); `entry_media` (`draft_id`, then `entry_id` at Keep, same transaction); `language_withheld` flag (PROPOSED local); at Keep the entry with `author_signs_as`; let-go marks `discarding`, deletes file then row, queues the discard |
| Module | `app/review.tsx`, `components/capture/letter-sheet.tsx`, `review-view.logic.ts`, `words-state.logic.ts`, `lib/capture/let-it-go.logic.ts`, `lib/transcription-queue/language-hold.ts`, `lib/photos/attach.ts`, `components/photos/review-photo.tsx`, `lib/billing/keep-step.ts` |

### A-S08 Day sheet

Built `DateSheet`, opened from Review's day line (and from the letter page, B-S09: the same component). Title "When was this?"; a `ChoiceGroup` with "A day" and "A month"; A day: the installed date picker, from 3 years before the birthday (or due date) to today; A month: Before You, The first weeks, Month 1 to this month, oldest first. Save stays off until the pick differs. The month tab is hidden for a child not born yet.

AX5: tabs stack; the month rows scroll inside the sheet; Save stays reachable. VoiceOver: "When was this?" once (sheet title) > "Day or month" (radio) > "Day" picker or the month rows > Save > Close. After Save: Review announces the new month once ("Files in Month 3", intent; NS-15-R12).

States: `day`, `month`, `unborn` (no month tab), `bound` (earliest day reached; the picker goes no further), `unchanged` (Save off), `interrupted` (pick kept until Save), `dark`, `ax5`, `vo`. Never: a date read from the words or a picture; a future day.
Integration: NS-15-R1, R2, R4, R5, R12, R17, R18; BL-945; no flag; `killSwitches.sync` only delays sync; no code (a local write failure shows the generic line, as built on the letter page); reads child birthday or due date; writes `occurred_on`, `occurred_precision` on the draft (Review) or entry (letter page); module `components/book/date-sheet.tsx`, `date-change.logic.ts`.

### A-S09 From sheet (someone else speaks)

A `Sheet` titled "Who is speaking?" (intent):
1. One `TextField`, label "From" (visible), one line, any script, RTL allowed; writing tools off (D2); no Contacts, no network while typing (R4).
2. The counter appears only near the limit, in plain words (intent "A little shorter, please"), counting what the database counts (code points; BL-957 helper).
3. The instruction line under the field, muted `footnote`, no checkbox: "Ask before you record someone else." (intent; D9, R18).
4. "Names used on this phone": up to 20 recent names as a `ChoiceGroup` list (radio); never from Contacts; absent when empty.
5. Done (primary, 56 pt). "Sign as Mama" (quiet) clears the field back to the parent.

AX5: the field is full width; recent names wrap; the instruction wraps; Done rides above the keyboard. VoiceOver: title > field ("From", value) > instruction > names list > Done > Sign as Mama > Close.

States: `empty` (first use, no list), `recent` (list), `typing`, `tooLong` (calm line, Done off; `sign_as_too_long`, never logged with the value), `set` (back on Review, "FROM NANI"), `flagOff` (sheet unreachable), `afterKeep` (read-only on the letter page, B-S08), `signedOut` (list cleared; R15), `secondAccount` (never A's list), `offline` (works), `dark`, `ax5`, `vo`.
Never: "invite", a relationship field, a photo of the speaker, any word that invites a child or sibling to speak (R5), speaker identification of any kind (R9).
Components: existing `Sheet`, `TextField`, `ChoiceGroup`, `Button`. New: none.
Integration: NS-16-R1 to R7, R12 to R18; BL-980, BL-957, BL-962; flag `EXPO_PUBLIC_SIGN_AS_OTHER` (PROPOSED), off in production until counsel Q45, Q46, Q48, Q54; code `sign_as_too_long`; reads `signAs.recent` (PROPOSED); writes the draft's typed name (PROPOSED local), then `entries.author_signs_as` at first insert (insert-only); module `app/review.tsx` (new sheet component inside the capture folder).

### A-S10 Another language

On Review, under the words: "This was in another language" (quiet, 44 pt), hint read by VoiceOver: "Sets these words aside and keeps your recording" (intent; the consequence, NS-17 VoiceOver row). One tap, no dialog (R5).

`withheld` layout, replacing the letter body on the sheet: the waiting line (`languageCopy.waitingForLanguage`, see card gap G-05 on its words), Play stays in the header, then:
- "Type the words yourself" (primary 56 pt) opens A-S06.forTake.
- "Keep the recording" (quiet) keeps a letter waiting for its words (counts only once words exist, D-103).
- The Undo line for the T4 window, "Words set aside. Undo" (intent; card gap G-07).
The machine output is never shown, indexed, shared, printed or exported (D10, R7); the "another language" control and the view control are gone.

States: `offer`, `withheld`, `withheldUndo`, `typed` (words typed by the parent, back on Review as a typed letter: no fixes), `keptWaiting` (Home and the Book show the waiting-for-words line), `heldLanguage` (A-S07.language, built), `dark`, `ax5` (control and line wrap), `vo`.
Integration: NS-17-R5, R6, R7, R8, R9, R10; J-N16, J-N23; no backlog row (E-03), BL-987 (`held_drafts` nulling); flags `EXPO_PUBLIC_ENGLISH_ONLY`, `EXPO_PUBLIC_SPOKEN_LANGUAGES`; kill `killSwitches.packDownloads` (downloads only); writes `language_withheld` (PROPOSED local, L4 output kept on the phone), the held-draft push without `raw_transcript` and `final_text`; module `lib/transcription-queue/language-hold.ts`, `app/review.tsx`.

### A-S11 Let it go

Confirmation: v2 F6 confirmation sheet (`simple`), originating from the control, replacing the built `Alert.alert`: title "Let this recording go?", body that says it cannot be brought back (content lead updates the built body, NS-09-R9), "Keep it" (`filled` `lg`, the default and first for VoiceOver) and "Remove it" (`destructive` text). Haptic `warning` only with the outcome. With a picture: the body also names the picture (R16c). From Listen: the same alert; the take stops first.

`notRemoved` (NS-09-R4a, R4b; BL-925 words, BL-926): after confirm, when the file would not delete. Review keeps the screen only to say it, once: the letter sheet and footer give way to one muted `subhead` line, no icon, no red ("That recording is still on this phone. We will finish removing it.", intent), and one "Done" (quiet) back to where they were. Announced to VoiceOver after the screen settles. Never blocks leaving; the draft is never shown as keepable again.

States: `confirm`, `confirmPhoto`, `confirmListen`, `notRemoved`, `storageStuck` (after 3 launches: C-S18 row "One recording is still on this phone" with Remove now), `offline`/`killSwitch`/`signedOut` (local delete completes; nothing shown), `dark`, `ax5` (line wraps; Done 44 pt), `vo`.
Never: Undo after confirm; "failed", "error", "deleted everywhere", "instantly".
Integration: NS-09-R1 to R17 (R1, R2, R13 to R16 invisible); BL-923, BL-924 (done), BL-925, BL-926, BL-977, P-4; no flag; no kill switch (R17); no code shown; writes `discarding`, `discard.failures.<draft id>`, the outbox discard op; module `lib/capture/let-it-go.logic.ts`, the launch sweep, `app/settings/storage.tsx`.

### A-S12 Replace confirm and the Undo line

Replace: a small `Sheet` (the app's confirmation sheet, `components/book/confirm-sheet.tsx`) with both pictures side by side (88 pt each, fitted) and two equal buttons: "Keep the first one" (default, first) and "Use this one". Nothing changes until confirmed (R7).
Undo line: the built `Toast` with an action, bottom of Review above the footer: "Photo changed. Undo" or "Photo taken off. Undo" (intent). Window per T4: 10 s, or until VoiceOver has finished reading the line plus 10 s, whichever is later; with Switch Control, until the parent moves on. The Undo control leaves the screen in the same moment the window closes (R38b): never a dead button.

States: `confirm`, `undo`, `undoVo` (window extended), `undoSwitch` (no timer), `closed` (no control), `dark`, `ax5` (pictures stack, buttons full width), `vo` (sheet title > first picture "The photo with this letter now" > new picture "The photo you just picked" > Keep the first one > Use this one).
Integration: NS-01-R7, R8, R38a to R38c; BL-954 (the one undo helper; ADR 0035), #839; module `lib/photos/attach.ts`, `components/ui/toast.tsx`.

### A-S13 After Keep

Saved moment (built S21): the same sheet files away into its month and lands on the Book; with a picture, the picture rides on the sheet. Keep private: the moment says private. Voice kept without words: "waiting for its words" line. Held at the gate (E-S10, "Keep it here for now"): one toast line, back to Home where the letter waits. A letter kept from a doorway take is kept only here, never by the doorway (NS-06-C4).
States: `saved`, `savedPhoto`, `savedPrivate`, `voiceOnly`, `held`, `gate` (E-S10), `reminderAskNext` (D-S04 on Home after the first kept letter), `dark`, `ax5`, `vo`.
Integration: NS-01-R5b, R18; NS-16-R3; D-082, D-103; NS-13 ask cap (area D); module `components/capture/saved-moment.tsx`, `components/child/plus-gate.tsx`.

### A-S14 Doorways (conditional)

Only doorways that pass NS-04 EX-1 to EX-5, behind `EXPO_PUBLIC_QUICK_CAPTURE`; nothing in the app mentions a doorway that did not ship (no "coming soon").
- Widget (Lock Screen or Home Screen): the static mark and "Start a letter" (intent). No name, no letter, no count, no data (C2).
- Control Center control: the same label and mark.
- Action Button: the App Shortcut "Start a letter".
- Siri phrase: "Start a letter in {brand.name}" (intent); no words as a parameter; "nothing leaves your phone" never next to it.
Arrival: unlock (system) > App lock cover if on (E-S22) > A-S04.doorway. A second start while a take is active is refused (the current take stays). Failure lands on Home with no message. Smart Invert: the widget mark ignores invert. Dark: system appearance.
States: `widget`, `control`, `actionButton`, `siri`, `locked`, `appLock`, `firstRun`, `noBook`, `activeTake`, `failed`, `notOffered`, `flagOff` (nothing registered).
Integration: NS-06-C1 to C11; NS-35-R3, R4, R5, R7; NS-04 EX-1 to EX-5; BL-972, BL-971; flag `EXPO_PUBLIC_QUICK_CAPTURE`; remote pause: none (C9; plan 17's `killSwitches.quickCapture` conflicts, E-07); no code; module `lib/capture/start-capture.ts` sources `widget`, `controlCenterControl`, `actionButton`, `siri`.

### A-S15 Hands-free states (hypotheses)

Drawn only as hypotheses mapped onto built states, to be confirmed or struck by `docs/research/spikes/hands-free-findings.md`:
| Spec 05 state | Maps to | Status |
|---|---|---|
| H1 Ready | A-S04.ready / .doorway | built |
| H2 Starting, H3 Listening, H4 Quiet stretch, H5 Paused, H10 Finishing | A-S05 | built |
| H6 Interrupted, H7 Backgrounded | A-S05.interrupted, E-S19 | built |
| H8 Limit reached | none built (no take limit read in `recorder.ts`) | hypothesis; needs a card row |
| H9 Low space mid take | none built | hypothesis |
| H12, H13 Cannot start, cannot hear | A-S04.denied, .busy | built |
| Screen-off recording | not designed | needs `UIBackgroundModes`: founder decision (EX-3), default no |
| Route change (AirPods) | A-S05 continues or holds | NS-04 Q14 decides |
| Driving Focus | no change, no driving words | NS-04 Q13 |
| Cue without looking (tone, haptic) | the existing start and stop haptics only | NS-04 Q6 decides |

---

## 3a. Material layer per screen (design system v2, `docs/design/system/BRIEF.md` section 3)

Rule applied: glass (regular) only on the navigation and control layer; clear glass with a 35 percent dim only for a control floating over a picture; everything that is a letter, a list, a card, an empty or error screen stays content layer (paper and ink tokens). One glass container per cluster, never glass inside glass, at most three glass surfaces visible. Reduce Transparency or iOS before 26: each glass surface becomes a solid `surfaceRaised` with a 1 pt `line` hairline, same shape and size. Increase Contrast: hairline and labels step to the high-contrast tokens.

| Screen | Glass (regular) | Clear glass, 35 percent dim | Content layer | Glass surfaces visible (max 3) |
|---|---|---|---|---|
| A-S01 Home | Native tab bar (N1); Speak and Type as one `GlassContainer` (A2) | none | Switcher row (I6), dateline, greeting, prompt, Another thought, slips and waiting cards; the Plus line, Start from a photo (A4) and Not much today on paper in the fixed bottom region (A2) | 2 (tab bar, cluster). At AX5 the cluster rides inline in the scroll and renders as content-layer solid buttons, because it no longer floats (reconcile with system COMPONENTS.md) |
| A-S02 Whose book | The sheet | none | Rows inside the sheet (no glass inside glass) | 1 |
| A-S03 Picker | System | none | none | system |
| A-S04 Ready | Close button; Speak and Type as one bottom container (picture form) | none | Thumbnail, Change, prompt, primer and problem screens (C8 state screens are never glass). The red circle at rest sits in the A3 glass ring | 2 |
| A-S05 Recording | The record control A3: Pause and Finish (with the recording dot and the time) in one container | none | Aura, clock, line, prompt; Let it go as a `plain` button on paper | 1 |
| A-S06 Write | Close; Save toolbar above the keyboard | none | The field and prompt | 2 |
| A-S07 Review | N2 header items (Play, Close); the N3 bottom toolbar (Keep prominent, Keep private plain); the F1 Undo toast when open | Only if a control is placed over the picture (none in this design: Change photo and Take the photo off sit under it) | The letter sheet including its To, day and From controls (they are part of the letter), view control, fixes, picture card, Let it go | 3 at most (header, footer, toast). At AX5 the footer is inline and solid, leaving 2 |
| A-S08, A-S09, A-S12 | The sheet | none | Fields, pickers, lists inside | 1 (Review below sits under the scrim) |
| A-S10 | none | none | All inline on Review | as A-S07 |
| A-S11 | The F6 confirmation sheet | none | the notRemoved line | 1 |
| A-S13 | Undo or held toast | none | The saved sheet | 1 |
| A-S14 | System (widget, control) | none | none | system |

Names: this file uses the built component names. Section 9 maps them to the v2 names in `docs/design/system/COMPONENTS.md` once that file exists.

## 4. New components proposed

1. None. The first draft's `LetterHeaderControl` is withdrawn: v2 C6 Dateline (`tappable`), I6 Child switcher and A1 cover it.
2. No other new component. The From sheet, the day sheet, the replace confirm, the Undo line, the picker states, the another-language state and the doorway arrival use `Sheet`, `ChoiceGroup`, `TextField`, `Toast`, `StateScreen` / `InlineState`, `PhotoFrame` and `Button` as built. The undo window is a helper, not a component (BL-954).

## 5. Integration summary by card

| Card | Screens | Backlog | Flag | Kill switch | Codes |
|---|---|---|---|---|---|
| NS-35 | A-S01, A-S04, A-S06, A-S07, A-S14 | navigation test (#828), P-8 retitles | none | none | none |
| NS-01 (capture side) | A-S01, A-S03, A-S04, A-S05, A-S06, A-S07, A-S11, A-S12, A-S13 | BL-931, BL-950/P-1, BL-953, BL-954, BL-955, BL-956, BL-957, BL-958, BL-962 | `EXPO_PUBLIC_PHOTOS` | `killSwitches.photos` | section 10 list |
| NS-09 | A-S05, A-S07, A-S11 | BL-923 to BL-926, BL-977, P-4 | none | none, by rule | none shown |
| NS-14 | A-S01, A-S02, A-S07 | BL-941 | none | none | none |
| NS-15 | A-S07, A-S08 | BL-945 | none | `killSwitches.sync` (sync only) | none |
| NS-16 | A-S07, A-S09 | BL-980, BL-957 | `EXPO_PUBLIC_SIGN_AS_OTHER` (PROPOSED) | card: none; plan 17: `signAsOther` | `sign_as_too_long` |
| NS-17 | A-S07, A-S10, A-S06 | none (E-03); BL-987 | `EXPO_PUBLIC_ENGLISH_ONLY`, `EXPO_PUBLIC_SPOKEN_LANGUAGES` | `killSwitches.packDownloads` | none |
| NS-19 | A-S01 (nothing drawn), B-S08 (no add-audio) | none (not taken up) | none | none | none |
| NS-20 | A-S07 (no two-book control) | none | none | none | none |
| NS-06 C | A-S04, A-S14 | BL-971 | `EXPO_PUBLIC_QUICK_CAPTURE` | none (C9) | none |
| NS-04 | A-S15 | BL-972 | none (spike branch) | none | none |
| NS-13, NS-18 (landing only) | A-S01 | BL-943, BL-982 | `EXPO_PUBLIC_TYPED_DAYS` (PROPOSED) | `killSwitches.reminders` (PROPOSED) | none |

How each card's error code reaches the parent: never as a code. Photo pick codes become A-S04.photoCouldNotOpen; photo commit codes become A-S07.photoNotStored (or the letter page line, R58); `needs_words` becomes A-S07.photoNeedsWords; `sign_as_too_long` becomes A-S09.tooLong; `mic_denied` and `storage_low` become A-S04.denied and .full; `SCPHO` (server) is never reachable from a correct client and shows nothing.

---

## 6. Card gaps

Each: card row, what is missing, proposed default. No card is changed.

- G-01 NS-15 section 15 and the built Review header (`letter-sheet.tsx`): the left header "To {child} (dot) Month n" is today both the label and, with two books, the whose-book control. The card asks the "dateline" to open `DateSheet`. Default: split into two controls (To on line 1, the day on line 2) through v2 C6 Dateline (`tappable`) on line 2 and I6 on line 1.
- G-02 NS-16 section 15: "the signature line on Review becomes a control", but Review shows the signature at the top right of the sheet, not at the end. Default: the top-right "From" is the control; the letter page keeps the signature where B draws it.
- G-03 NS-15-R1 on Review: the day line's words for today and for a chosen day are not given. Default: "Today, 9 June" until changed, then the day; VoiceOver "About {date}" (WORDS.md).
- G-04 NS-14 VoiceOver row says the switcher reads "Letters go to {child}'s book"; the visible label is "For {child}". Voice Control needs the visible label as the command (NS-14 Voice Control row). Default: accessibility label starts with the visible words: "For Asha. Letters go to Asha's book."
- G-05 NS-17 sections 4 and 16 reuse `languageCopy.waitingForLanguage`, whose text ends "Other languages are coming in a later update." That is a coming-soon line, which the brief and frame forbid. Default: content proposes a version without the promise; the card's intent (the words are waiting) stays.
- G-06 NS-17-R5 names only an English-only build. With `EXPO_PUBLIC_SPOKEN_LANGUAGES` set, a take in a language the list leaves out has the same risk. Default: the mark shows whenever the author has one spoken language chosen; with two or more, it also shows (the parent knows best), never hidden.
- G-07 NS-17-R5: one tap, no confirm, and the card is silent on Undo. A mistaken tap hides the parent's words. Default: an Undo line for the T4 window (BL-954 helper); after it, the mark stands.
- G-08 NS-01-R58 puts the "did not come along" line on the letter page; with the stored copy written when Review opens (step 5), the failure is first known on Review. Default: the same line on Review with "Add a photo", and R58 on the letter page as written.
- G-09 NS-09 happy path says "The parent taps Let it go on Review or Listen"; on Review the control is built only inside the short-take card (`words-state.logic.ts:226`). Default: a quiet "Let it go" at the end of Review's scroll in every state that has a recording.
- G-10 NS-09-R4a says the line shows "on that Review visit" but not what else Review shows once the draft is `discarding`. Default: A-S11.notRemoved (the line and Done; the letter and Keep are gone).
- G-11 NS-01-R3 and R20b name Speak and Type on Ready with a picture, while built Ready at rest uses the red circle. Default: two Ready forms (A-S04), the picture form as the card says; doorways keep the circle.
- G-12 NS-14-R4 (a draft keeps its child on a Home switch) is silent on Review's built "To {child}" control, which moves one draft on purpose. Default: keep it; it is the parent's explicit choice on that letter, and it stays absent for a later-words letter (built).
- G-13 Frame slip rule: "at most one slip", yet slip 1 is "the existing waiting cards" (plural, and Home lists every draft as built). Default: slip 1 is the whole waiting set as built; when it shows, no other slip shows.
- G-14 NS-01: the card is silent on whether the picture shows while recording. Default: a still 56 pt thumbnail beside "To {child}" on A-S05; no motion.
- G-15 NS-01: the card is silent on the microphone primer and problem screens with a picture pending. Default: the picture stays pending; Type instead carries it to Write; Close is a back-out (R4: nothing written).
- G-16 Ruling D2 lists the Review editor, Firsts label, photo text, place, typed-day words and From name; Write's field becomes a letter's words too. Default: writing tools off on Write as well (BL-962 scope).
- G-17 NS-06 C9 withdraws any remote pause for doorways; plan 17 section 2.2 proposes `killSwitches.quickCapture`. Default: the card wins; no remote key for doorways.
- G-18 NS-16 RR-5 says "The build flag; no remote key (PROPOSED)"; plan 17 proposes `killSwitches.signAsOther`. Default: a kill switch that only hides the control is harmless and matches ADR 0029; Karma rules.
- G-19 NS-01: a picture draft's waiting card on Home is not described. Default: the card shows a 40 pt thumbnail so the parent recognises it (no words about the picture).
- G-20 NS-04 H8 (30-minute limit) and H9 (low space mid take) appear in spec 05 but in no card row; nothing in `recorder.ts` sets a limit (read this session). Default: not drawn beyond the hypothesis table; a card row is needed if a limit exists.
- G-21 NS-16 R1 counts code points, BL-957 says graphemes for other fields and "30 characters as built" for From. The counter wording for Devanagari names is not given. Default: plain words, no number ("A little shorter, please"), shown only at the limit.

## 7. Engineering gaps

- E-01 Review header controls: the day line needs v2 C6 Dateline (`components/ui/dateline.tsx`, v2 row R11) before BL-945 can draw it; From needs only A1; To reuses I6. BL-945 depends on R11.
- E-02 "Let it go" on Review outside the short-take card (G-09): belongs to BL-926 or BL-977.
- E-03 NS-17's Review mark, the withheld state, the Undo, the held-draft push without words and "Type the words yourself" for a take: no backlog row (the plan 17 table gives NS-17 "No row"), while NS-17-R5, R7, R8 are P0. Needs a new row next to BL-987's `held_drafts` question.
- E-04 Review's photo-not-stored line (G-08): belongs to BL-931 slice 4c (#839).
- E-05 The thumbnail during recording (G-14) and on Home's waiting card (G-19): belongs to BL-931 (#838) or BL-956.
- E-06 Writing tools off on Write (G-16): belongs to BL-962.
- E-07 `killSwitches.quickCapture` proposed in plan 17 against NS-06 C9: plan 17 section 2.2 item 3 should drop it.
- E-08 `killSwitches.signAsOther` (plan 17) versus NS-16 RR-5 (no remote key): needs a ruling (G-18).
- E-09 The error catalogue has no code for a busy microphone (`mic-state.logic.ts` comment); area E owns the catalogue.
- E-10 NS-01-R17b iCloud progress and Cancel: P-1 / BL-950 (named in the plan, not in BACKLOG as read).
- E-11 The undo helper (BL-954) must also serve the NS-17 Undo (G-07) and the quiet-day Undo (D-S21); the row lists NS-01, NS-06, NS-33 only.
- E-12 NS-14's VoiceOver label and the `surface: 'home'` event: BL-941 names neither the label (G-04) nor the analytics surface; analytics is off in 1.0, so only the label matters.
- E-13 The From sheet's names list key `signAs.recent` and the draft's typed name column are PROPOSED in NS-16 section 10 but not in BL-980's scope line; belongs to BL-980.
- E-14 A take length limit (G-20): no row; belongs to NS-04b if the spike finds one is needed.

## 8. Reconciliation with MOTION.md and WORDS.md

See section 9.

## 9. Reconciliation pass (end of round, 20 Nov)

Read: `MOTION.md` and `WORDS.md` in this folder; `docs/design/system/BRIEF.md`, `COMPONENTS.md` and `MOTION.md` (design system v2). `FOUNDATIONS.md` and `tokens.v2.json` were not yet in `docs/design/system/` at this pass, so token names below are the ones v2 COMPONENTS.md asks for.

### 9.1 Screen ids
All three files use A-S01 to A-S15 with the same meaning. No re-keying of screens is needed.

### 9.2 State ids: this file's names are canonical
WORDS.md section 12 says DESIGN.md's names win. MOTION.md keys moments (MA-nn) to states. The alias table below is the find-and-replace list for Karma; states marked "added" are taken into this file from the siblings.

| Used in WORDS.md or MOTION.md | Canonical (this file) |
|---|---|
| A-S01.namelessTwo | A-S01.twoBooksNameless |
| A-S01.waitingCard | A-S01.waiting |
| A-S01.waitingMany | A-S01.heldMany |
| A-S02.open | A-S02.default |
| A-S03.iCloudProgress | A-S03.downloading |
| A-S04.default, A-S04.fromDoorway | A-S04.ready, A-S04.doorway |
| A-S04.photo, A-S04.withPicture | A-S04.readyPhoto |
| A-S04.micDenied, micBusy, phoneFull | A-S04.denied, busy, full |
| A-S04.openFailed, A-S04.photoFailed | A-S04.photoCouldNotOpen |
| A-S04.photoOffline | A-S04.iCloudOffline |
| A-S04.lowSpace, A-S05.lowSpace | added: A-S04.lowSpace and A-S05.lowSpace (under 1 GB: one line in place of the hint; capture goes on; v2 F2 SystemLine `lowStorage`) |
| A-S05.saved | added: A-S05.saved (the moment between finishing and Review; words `tonight.states.saved`) |
| A-S06.photo | A-S06.withPhoto |
| A-S07.transcribing | A-S07.writing |
| A-S07.waitingLong | A-S07.writing (after 8 s) |
| A-S07.noSpeech | A-S07.noWords |
| A-S07.missingFile | A-S07.fileMissing |
| A-S07.stoppedEarly, A-S07.stoppedBy | A-S07.interrupted (the stop line) |
| A-S07.dateline | A-S07.default (the day line) and A-S07.dateSet |
| A-S07.from | A-S07.default (From control) and A-S07.fromSet |
| A-S07.photo, A-S07.withPicture | A-S07.withPhoto |
| A-S07.keepDisabled | A-S07.photoNeedsWords |
| A-S07.otherLanguage | A-S07.anotherLanguageOffer |
| A-S07.wordsWaiting | A-S10.withheld |
| A-S07.voiceOnly, A-S13.keptVoiceOnly | A-S13.voiceOnly |
| A-S07.noDraft, keepStillSaving, firstNote, playing, markOpen, putBack | added as A-S07 states, as built (Review with nothing to read; Keep tapped while the save still runs; the first-time note; Play running; a fix's card open; the put-back line with Undo) |
| A-S07.dateNotSaved | added: A-S07.dateNotSaved (WORDS G6: a named line instead of the generic one) |
| A-S07.fromTooLong | added: A-S07.fromTooLong (Keep refused when a draft carries a name over the limit, R6) |
| A-S07.partUnwritten | added: A-S07.partUnwritten (NS-17 section 5, mixed-language stretch). Engineering gap: no module reports an unwritten stretch (WORDS section 19) |
| A-S08.default | A-S08.day |
| A-S09.default, A-S09.recentNames | A-S09.empty, A-S09.recent |
| A-S10.undo | A-S10.withheldUndo |
| A-S10.waiting | A-S10.withheld |
| A-S10.writeWords | A-S06.forTake |
| A-S10.confirm | not drawn: only if the founder prefers a confirm to the Undo (WORDS G8, this file G-07) |
| A-S12.replaceAsk | A-S12.confirm |
| A-S12.changedUndo, takenOffUndo | A-S12.undo (A-S07.photoUndo for take off on Review) |
| A-S12.undoClosed | A-S12.closed |
| A-S13.kept, keptPrivate, gateHandoff | A-S13.saved, savedPrivate, gate |
| A-S14.beforeFirstRun | A-S14.firstRun |
| A-S15.hypotheses | A-S15.map |

### 9.3 Words decisions this file follows (WORDS.md wins on words)
- "Write the words" (built) instead of the card's intent "Type the words yourself" (WORDS ruling 2). The prototype uses it.
- "Change photo" on Ready as on Review (WORDS G2, for an unambiguous Voice Control name). The prototype uses it.
- Storage line "A recording you let go is still on this phone." (WORDS G4, not a count).
- Day line: "About {a}. Said on {b}." on the letter page; on Review the day line shows the chosen day (WORDS 7.2).
- The waiting line for a withheld or held language drops "coming in a later update" (WORDS G11, this file G-05).
- Typed-day line on Home is part of the prompt block, never a slip (WORDS G9 agrees with A-S01 layout item 4).

### 9.4 Motion decisions this file follows (MOTION.md wins on motion)
- Review stays to show the not-removed line (MOTION CG-7 = this file G-10).
- The NS-17 Undo is an MA-44 window (T4) (MOTION CG-8 = G-07).
- "Moves on" for Switch Control: leaves the screen, activates another control, or locks the phone (MOTION CG-4); the clock pauses in the background (CG-3).
- No sound and no haptic on a picture that failed (MOTION CG-6).
- MOTION's MA-nn ids map to v2 primitives through v2 MOTION.md section 4b and 13; this file names no durations.

### 9.5 Design system v2 names (COMPONENTS.md, MOTION.md)
| This file said | v2 name |
|---|---|
| `Button` capture, primary, secondary, quiet | A1 `Button` styles `prominent` / `glass` / `plain`, size `xl` for Speak and Type |
| Speak and Type pair on Home | A2 Capture cluster (`components/capture/capture-cluster.tsx`) |
| Ready red circle; Pause and Finish | A3 Record control (`ready`, `recording`, `paused`, `still here`, `interrupted`) |
| "Start from a photo" | A4 Photo start (`plain`, content) |
| `ChildSwitcher`, `WhoseBookSheet` | I6 Child switcher plus N7 sheet with I4 list |
| `DateSheet` | I3 Date sheet (moves to `components/ui/date-sheet.tsx`) |
| Review's day line | C6 Dateline `tappable` (and `two dates` on the letter page) |
| `PhotoFrame`, `PendingPhotoThumb` | C3 Photo thumbnail (`ready` variant on Ready and Review) |
| `TextField` (From, photo words, place) | I1 Text field, `writingTools={false}` |
| Write field, Review editor | I2 Textarea (`letter`, `review`) |
| `Toast` with Undo | F1 Undo toast (T4 window) |
| `Alert.alert` Let it go; replace confirm | F6 Confirmation sheet (`simple`) |
| `PlusGate` | F4 Keep gate sheet |
| `SavedMoment` | F5 Saved moment |
| `StateScreen` primer and problems | C8 State screen |
| Low storage and offline lines | F2 Banner (SystemLine) |
| `ModalHeader` Close | N2 header, Close as the word, top right |
| Review footer | N3 bottom toolbar |
| Motion | v2 `m.cover` (Listen, Review), `m.sheet`, `m.toast`, `m.glass` (Speak capsule to record control), `m.keep`, `m.signal` (aura), `m.instant` (recording state changes) |

### 9.6 Open points between this design and v2 (Karma rules; the card wins where one speaks)
- O-1 A2 says the capture cluster stays in the bottom third at AX5. NS-35's scenario row says "Capture actions inline under the prompt (as built)" at the largest text size, and NS-14-R5 needs the switcher, dateline and three controls not to overlap. This file keeps the card: inline under Another thought at AX5, rendered solid (content layer) because it no longer floats.
- O-2 N3 lists Let it go in Review's toolbar (`split`). Review's toolbar already holds two keep choices (Add to the book, Keep private) and allows one prominent item; a destructive choice next to Keep invites a mis-tap with a baby on one arm. This file keeps Let it go as the last `plain` item in Review's content (G-09); the toolbar holds Keep (prominent) and Keep private (plain). At AX3 and above both move into content as A1 `lg` (N3 rule).
- O-3 A3 names "Stop" and "Speak" on the record control; the built words are "Finish" and the glossary phrase "Tap the red circle and talk." Words are WORDS.md's call; the prototype shows the built words. A3's glass circle at Ready is drawn as a glass ring around the red disc so "red circle" stays true.
- O-4 A2 shows Speak and Type as glass; F4 and N7 put the Keep gate as a system sheet over Review. Budget on Review with the toast and a sheet: header, toolbar, sheet (the toast cannot show under a sheet). Within three.
- O-5 v2 I2 says writing tools off on "every letter field"; D2's list omits Write. This file's G-16 asks for Write too; v2 R10 covers the build.
- O-6 FOUNDATIONS.md and `tokens.v2.json` were absent at this pass; the prototype copies today's `tokens.ts` values and draws glass with CSS `backdrop-filter`, solid under Reduce Transparency, per BRIEF section 3.

### 9.7 Gap ids across the three files
| This file | WORDS.md | MOTION.md |
|---|---|---|
| G-05 (coming-soon waiting line) | G11 | |
| G-07 (NS-17 Undo) | G8 | CG-8 |
| G-08 (photo not stored on Review) | G1 | |
| G-10 (Review stays for the not-removed line) | | CG-7 |
| G-04 (switcher label vs Voice Control) | G5 (nameless label format), section 19 row 1 | |
| E-03 (no NS-17 row) | section 19 row 2 | |
