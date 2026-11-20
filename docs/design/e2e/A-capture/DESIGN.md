# Area A. Capture: end-to-end design

Owner: design lead, area A (design-systems), 20 Nov 2026. Brief: `docs/design/e2e/BRIEF.md`. Motion: `MOTION.md` (this folder). Words: `WORDS.md` (this folder).
Sources, in order: the final pack (`docs/product/prd/22-final-holistic-spec.md`, `21-days-cultural-photos-home.md` NS-46 to NS-50, `19-from-download-to-first-letter.md` NS-38 to NS-45, `GAP-LOG.md` rulings including RV-1 to RV-17 and K1 to K17, `FUNCTION-TRACE.md` section 6.1, the NS-46 to NS-50 reviews in `tools/review/ns46-50/`, and `docs/design/e2e/IA-AUDIT.md`), then the locked cards (`docs/product/prd/01`, `08` NS-09, `09` NS-13 to NS-20, `06` Part C, `04`, `11` NS-35), then `14-test-plan.md` and `16-council-review-round-2.md`, then engineering (`13`, plan PR #847 `17-engineering-project-plan.md`, BACKLOG BL-922 to BL-987, `/home/claude/review/eng/C-platform-quality-delivery.md`), then house design. The app as built on the lock branch is the baseline: `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/write.tsx`, `app/review.tsx`, `components/capture/*`, `components/tonight/*`, `components/child/whose-book-sheet.tsx`, `components/book/date-sheet.tsx`.

**Re-key pass, 20 Nov (final pack).** What changed in this file: (1) NS-38 to NS-45 now live in card 19, and NS-46 to NS-50 in card 21; area A touches NS-39-R4 and R10 (the microphone primer and a recording that waits for its words), NS-44 (the first kept letter) and NS-46 to NS-50 (days, the ask, picture-first, Home today). (2) A-S01 gains the day slip, the Days ask slip, the quiet-tone day and the one slip slot above the prompt block; the photo start becomes a menu where level 2 exists. (3) A-S03, A-S04 and A-S07 gain the recent-days states; A-S16 is new. (4) "Reminder", never "note", for anything the app sends; "slip", never "strip". (5) Section 10 adds Home as the default tab; section 11 accounts for every function design need; section 12 holds the open design questions, each with a default. New gap ids are G-22 onward and E-15 onward; new unhappy-path ids are A-U63 onward; new journeys are A-J18 onward. Nothing in sections 2 to 9 was removed except where a line below says "corrected".

Nothing here was run on a phone. Words in quotes are intent; WORDS.md holds the PROPOSED keys, and the founder approves words. UNVERIFIED marks anything not read this session. No real family: the fixture is the fictional Asha (and a second book, Kiran, for two-book states).

Superseded history (BRIEF 1.5): design spec 01 (photo) where it drew a cropped thumbnail and a full-width thumbnail at accessibility sizes (NS-01-R39, R42 win); design spec 05 (hands-free) is used only as hypotheses (NS-04 decides); design spec 06 (IA) only where the frame agrees (three tabs, one start).

---

## 1. Screen inventory

| Id | Screen | Built today | Cards |
|---|---|---|---|
| A-S01 | Home (Say): whose-book switcher, dateline, greeting, the one slip slot (above the prompt block), prompt, Another thought, capture cluster (Speak, Type, Start from a photo, Not much today) | `app/(tabs)/index.tsx` (no switcher, no slip host, no photo start on the lock branch; photo start in #838) | NS-35, NS-14, NS-01, NS-49-R1, R29, NS-50 (day slip, quiet-tone day), NS-47-R19, R29, R31, R32 (the Days ask), NS-13 R9 landing, NS-18 landing, NS-19 (not drawn), frame slip rule, NS-44 (first Home) |
| A-S02 | Whose book sheet (one `Sheet`, radio list, current month under each name) | `whose-book-sheet.tsx`, `child-switcher.tsx` | NS-14 |
| A-S03 | Apple's photo picker and Apple's recent-days picker, and our states around them (iCloud download, cancel, failure, no photo in the suggestion) | system; `lib/photos/picker.ts` in #837; the suggestions module does not exist | NS-01, NS-49-R5 to R12 |
| A-S04 | Listen at Ready: from a link or doorway (red circle), with a picture (Speak and Type), with "From your phone" beside a picture from the recent-days picker, the microphone primer and the three start problems | `app/listen.tsx` (ready, primer, denied, busy, full) | NS-01, NS-49-R9, R10, NS-06 C, NS-04, NS-35, NS-39-R10 (primer) |
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
| A-S16 | One photo from a suggestion: a sheet that holds each photo of the suggestion the parent picked, so the parent chooses one (PROPOSED id, NS-49 section 15) | none | NS-49-R8, R30 |

Cross-area screens this area lands on or hands to (ids from the other folders; C-S24 Days, C-S25 Browse days and C-S26 Day detail are area C's: "Choose days" on the Days ask opens C-S25 as a sheet over Home; the day slip has no destination and opens nothing): E-S10 Plus gate at Keep; E-S15 system line; E-S17 low storage; E-S18 second account; E-S19 interruption and recovery; E-S22 App lock cover; E-S02 first run; D-S04 reminder ask; D-S11 notification landing (typed-day line above the prompt); D-S21 Not much today kept line; B-S08 letter page; B-S09 day sheet on the letter page (the same component as A-S08); B-S11 picture on the letter page; B-S17 one past letter slip; B-S18 seal-opened slip; C-S06 Save a copy slip; C-S18 Storage (stuck recording).

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
6. After the first kept letter only, the reminder ask (D-S04) rises as a sheet over the Book, not on Home and not a slip (card 22 section 3; corrected: this file said "Home shows the reminder ask").

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

**A-J18 A day the parent chose, today** (NS-50-R1 to R5, R7, R12, R14; NS-46-R13)
1. The parent ticked Thanksgiving in Me, Days (area C). On the day they open Home by any route: the 09:00 reminder, a cold start or an ordinary open (R4: one rendering, never two).
2. A-S01.dayToday: one slip directly above the prompt block: "Thanksgiving. Anything you would like Asha to hear about today?" and "Not today". Speak and Type are where they always are.
3a. Speak or Type starts A-J01 or A-J02; the slip is not a start (it has no destination).
3b. "Not today": A-S01.dayDismissed. The slip leaves until the next local day; the next slip in the order, if any, waits for the next Home visit (C M-3). No haptic. No Undo (the slip is not an answer to anything, R7).
4. Two ticked days on one date: A-S01.dayTodayTwo, one slip naming both. A higher slip due (waiting set, seal-opened line): that slip shows and the day slip does not (A-U64).

**A-J19 A quiet-tone day** (NS-50-R3, R15; NS-46-R16; RV-7; default pending founder, Q-FD-24)
1. Memorial Day or Veterans Day, ticked by the parent. Home opens.
2. A-S01.dayTodayQuiet: the slip holds the name and "The book is open if you want it." with "Not today"; the prompt block (prompt and Another thought) is not drawn that day; no question mark anywhere on the screen's words. Speak, Type, Start from a photo and Not much today are unchanged.
3. "Not today" removes the slip; the prompt block stays absent for the local day (an ordinary question after a quiet line would be the clash RV-7 ruled out). Home then holds the greeting and the capture cluster only.

**A-J20 The Days ask** (NS-47-R19, R29, R30, R31, R32; NS-50-R6; rank 3b)
1. A book with at least one kept letter; the reminder ask answered or capped; not the sitting where the Keep gate, the reminder ask or the rating request showed; no higher slip due. Home opens on a later sitting.
2. A-S01.daysAsk: one card in the slip slot: the question ("Would you like a reminder on the days that matter to your family?", intent), the short call-out under it (a `DoorNote`, static, never collapsed), then "Choose days" and "Not now" as two `bordered` buttons of the same size, stacked, neither filled.
3a. "Choose days": C-S25 rises as a sheet over Home (area C). Whatever happens there, the card is gone afterwards and Home is as before.
3b. "Not now": the card leaves (`m.list.remove`); it never returns to Home; Me, Days stays one tap away.
3c. Two showings with no answer: it retires to Me, Days (R31) and does not return. A-S01.daysAskGone is the default Home again.
4. Never in the first run, never from a notification, an email or a banner, never with a count, a badge, "new" or a price (R19, R32).

**A-J21 Start from recent days** (NS-49-R5 to R13, R29, R30; level 2, drop C; flag `EXPO_PUBLIC_SUGGESTIONS` PROPOSED)
1. A-S01.photoMenu: "Start from a photo" opens an anchored menu with two items, "Choose a photo" and "Pick from recent days" (hint "Opens choices"). Where level 2 is absent the button opens the picker directly (A-S01.default, hint "Opens your photos").
2. "Pick from recent days": A-S03.suggestions (Apple's own sheet; first time Apple's one-time consent sheet, which we never explain or pre-prompt).
3. The parent picks one suggestion. One photo: A-S04.suggestionLabel (Ready with the picture and "From your phone: {title}", "Use this", a 44 pt Clear). Several photos: A-S16 first; the parent chooses one; nothing is stored before the choice.
4. "Use this" copies the phone's title into the photo words (it is then the parent's text, edited like any other, writing tools off, no marker); without the tap nothing of the title is kept (R9). Speak or Type, Review, Keep as A-J03. The kept letter holds one stored copy and no mark of how it began (R13).
5. A suggestion with no photo: A-S04.suggestionNoPhoto: Ready with no picture and one calm line (R10).

**A-J22 The first Home and the first kept letter** (card 19 NS-44; NS-39-R4, R10)
1. A-S01.default on a fresh book: the first prompt; Speak, Type, Start from a photo (level 1 where the flag allows) and Not much today. No slip, no Plus line, no sheet, no Days ask (NS-44 happy path 1; NS-47-R18 first run has no such field).
2. First Speak: A-S04.primer (Continue and Type instead as equal ways), then iOS's microphone question (NS-39-R10); A-S05; A-S07 with the first Review note once; A-S13.saved with the success haptic and nothing else (NS-44-R12).
3. A speech model not on the phone: the recording is kept and A-S07 shows the words card (NS-39-R4, NS-44-R7); Type instead is always open.
4. The second kept letter: the Book's one toast (area E). The third Keep with Plus off: E-S10 (A-J15). The Days ask is never in these sittings (NS-47-R19).

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

NS-50 (Home today) and NS-47 (the Days ask)
- A-U63 No day ticked, or the date is not a ticked day's date: Home holds no word about days: no upcoming day, no list, no count, no "no days today" (NS-50-R2). A day ticked for tomorrow is invisible today.
- A-U64 A higher slip is due (a waiting card, the seal-opened line): it shows; the day slip does not, until the next Home visit after the higher one leaves (A G-13, NS-50-R5, C M-3). Known cost, written in NS-50 section 3: in the birthday week the day slip (2b) sits above Save a copy (3), so Save a copy waits for that day.
- A-U65 A birthday on the same date: the day yields; no day slip (NS-46-R7).
- A-U66 A quieted or hidden active book, or "Include in my reminders" off: no day slip, and the Days ask is not drawn either (NS-50-R8, R-IA-6). A book with the Days ask answered: never again.
- A-U67 The parent moved the date: the slip shows on their date (NS-50 section 5).
- A-U68 Second Home visit the same day: the slip stays until "Not today" or the local day ends; the dismissal is keyed to the local date, so a time zone change does not bring it back; it leaves the next day with no exit animation (NS-50 section 5, D G5).
- A-U69 The days store cannot be read, signed out, a restored phone, a second account: no slip and no message (NS-50 section 6; NS-47-R15). B sees nothing of A's days.
- A-U70 The remote pause `killSwitches.libraryDays` (PROPOSED, NS-46-R28) is on: the day slip is absent at the next focus; the Days ask is absent too.
- A-U71 The app goes to the background on Home: the app-switcher snapshot shows no day name, with App lock on or off (NS-50-R9, errata E18). The privacy cover is a blank block where the slip would draw (A-S01.snapshot).
- A-U72 Reduce Motion: the slip renders complete, with a fade of 200 ms at most, no haptic (NS-50 section 5, R12).
- A-U73 A typed day today: its line stays in the prompt block as built (A W9); a library day on the same date shows only when no typed day falls today (NS-50 section 5).
- A-U74 The Days ask when notification permission is denied: not drawn; Days stays in Me (NS-47-R19). When the parent answers "Not now": nothing else is written but the asked flag (NS-47-R2).
- A-U75 The ask on an SE 3 at the default size does not fit above the prompt: it sits below the prompt (A-S01.daysAskBelow, NS-47-R32 device check).

NS-49 (picture-first and recent days)
- A-U76 Cancel, or the first-use Apple sheet declined, or Journaling Suggestions off, or an empty list: the app learns nothing (Apple documents no cancel or empty callback, UNVERIFIED) and does nothing: Home as before, no draft, 0 files, no message, no retry prompt (NS-49-R11). Level 1 stays one tap away in the menu. The earlier `suggestions.empty` state is removed (the app cannot observe an empty list).
- A-U77 A suggestion with no photo: A-S04.suggestionNoPhoto, one calm line, nothing else kept, shown or logged (NS-49-R10, R34).
- A-U78 iOS 17.0 or 17.1, Android, Expo Go, the flag off, the entitlement absent, the iPhone app on an iPad, an Apple silicon Mac or Apple Vision: "Pick from recent days" is absent, never greyed, never a dead button; the photo start opens the picker directly (NS-49-R5, R18, R28).
- A-U79 App lock raised, or the app inactive, during the pick: the picker cannot be started under App lock; a result that returns while locked is discarded with 0 files and no picture in the switcher snapshot (NS-49-R12; A-S03.appLockDrop).
- A-U80 A suggestion with a location, a workout, a contact, a song or any other item: nothing of it is read, shown or kept (NS-49-R10); the design draws no field for any of it.
- A-U81 An iCloud-only suggestion photo, a Live Photo (the still only), a full phone, level 3 (library read): NS-01's lines apply; level 3 has no design because it is closed in 1.x (NS-49-R25).
- A-U82 `killSwitches.photos` on or the flag off: the photo start, the menu, Change, Add and Take off are absent (A-U24 extended to the menu).
- A-U83 The parent never taps "Use this": the title is not stored; the photo-words field starts empty (NS-49-R9).

System states that cross every capture screen (E owns the line; A says how capture behaves)
- A-U59 Offline, server outage, `serverFeaturesEnabled()` off, `killSwitches.sync`: capture, Review, Keep, the day, From, the mark and Let it go all work on the phone; sync follows later. No line on Home or Listen.
- A-U60 Plan lapsed: capture never blocked; only Keep of a new letter past the allowance meets E-S10.
- A-U61 Low storage under 1 GB: E-S17 line on Home above the capture cluster; capture works. Under 50 MB: A-S04.full.
- A-U62 App updated with a draft waiting: the draft (with its picture, day and From name) is intact (NS-01-R44).

---

## 3. Screens

Grid: 375 pt wide (SE 3 and the prototype frame), gutter 20 pt (`space[5]`), 4 pt scale. Targets: 44 pt minimum, 56 pt primary, 64 pt capture (`target`). Type: `promptHero`, `prompt`, `title1`, `title2`, `headline`, `callout`, `subhead`, `footnote`, `letterBody`, `letterDateline`, `signature` (tokens.ts). Colour: tokens only; `recording` means listening, never an error; `caution` for a save that did not work; `textMuted` for the app's small voice. Dark: the `dark` set; sheets carry a 1 pt `line` edge instead of a shadow. Increase Contrast: the `highContrast` overrides. Smart Invert: pictures ignore invert (NS-01-R40). AX5 rule used everywhere (built `footerPlacement`): at accessibility sizes, pinned actions ride inline in the scroll, under the content they act on.

### A-S01 Home (Say)

Default layout, top to bottom (re-drawn 20 Nov for the one slip slot, NS-50-R4 and COMPONENTS C9: the slot is directly above the prompt block, for every rank):
1. Whose-book switcher (two or more visible books only): "For Asha" + chevron, `subhead`, 44 pt row, left aligned, above the dateline (NS-14 design inputs).
2. Dateline: "ASHA (dot) 7 MONTHS" (`letterDateline`, caps; read "Asha, 7 months"). Before birth: "ASHA (dot) BEFORE YOU".
3. Greeting, `title2`, two tones (built).
4. The slip slot: at most one slip, in the fixed order below, or nothing and no space kept. Content layer, `surfaceRaised`, `radius.md`, 16 pt padding (NS-50-R14).
5. Prompt block: the typed-day line when a typed day is today (A-J12; the parent's own words, `callout`, part of the block and never a slip, A W9; D-S11 draws it), the prompt (`promptHero`, on the paper), "Another thought" (quiet, 44 pt). On a quiet-tone day the whole block is absent (A-J19).
6. Capture cluster, pinned in the thumb zone above the tab bar: the Plus line when it applies (built; not a slip); Speak and Type as equal 64 pt twins; "Start from a photo" quiet 44 pt centred under them (image icon, never larger than either; a menu where level 2 exists, A-S01.photoMenu); "Not much today" quiet 44 pt under that.

**The slip order (one registry as data, BL-963; NS-50-R5, RV-5).** One slip shows at a time; the higher rank shows and the others do not; a dismissed slip lets the next one show at the next Home visit, never in the same visit (C M-3).

| Rank | Slip | Anatomy | Dismissal | Drawn by |
|---|---|---|---|---|
| 1 | The waiting set (draft cards, or one folded row for two or more held letters) | `DraftCard`, `HeldRow` as built; a picture draft shows a 40 pt thumbnail (G-19) | none: Pick it up resumes | A (built) |
| 2 | The seal-opened line on its day | one line, no enter (B-motion 2) | none | B-S18 |
| 2b | A day the parent chose, today (the day slip) | name and one line; "Not today" | "Not today": until the next local day, no haptic, no Undo | A-S01.dayToday (NEW, this file) |
| 3 | Save a copy in the birthday week | card with one `bordered` button | its own | C-S06 |
| 3b | The Days ask (once, at most two showings) | question, `DoorNote`, two stacked `bordered` buttons | "Not now": final for Home | A-S01.daysAsk (NEW, this file) |
| 4 | One past letter | `ResurfacedCard` until NS-23's slip replaces it | its own | B-S17 |

Not slips: the typed-day line (prompt block), the Plus line (capture cluster), the reminder ask (a sheet over the Book), the rating request (Apple's), the picture start (capture cluster, NS-50-R10). There is no strip: a strip of several things is a feed with a count of things waiting, which the frame forbids (R-IA-3). No slip holds a count, an upcoming day, a list, or a word about what the parent has not done.

**Day slip anatomy (NS-50-R14).** One non-interactive element whose label is "{name}. {line}" (the NS-46 landing words, `days.landing.*`); a custom accessibility action "Not today"; a separate visible "Not today" button (`plain`, `sm`, 44 pt minimum, trailing, Voice Control name "Not today") that is not inside the labelled element's group as a nested control; `callout` in `text`; the name in the semibold weight of the same size, not a colour. Height budget at default size on an SE 3 (arithmetic, not measured): 16 pad, two callout lines, a 44 pt button row, about 124 pt; one book without the switcher keeps the whole prompt in view (about 404 of about 420 pt free above the pinned cluster); with two books the switcher's 44 pt pushes the prompt's last line into the scroll (device check, open question Q-A4). Two ticked days: "{a} and {b}. Anything you would like {child} to hear about today?" (intent; the names joined as a list, never in code; three or more use the same form).

**Days ask anatomy (NS-47-R29, R30, R32).** The question (`callout`, `text`), the short `DoorNote` under it (one sentence, `callout`, `text` on `surface`, `radius.md`, a decorative lock glyph hidden from VoiceOver, never collapsed, never behind an info glyph, never dismissible, never glass, first in reading order before the controls), then "Choose days" and "Not now" as two `bordered` buttons of the same style and size (48 pt, `size.control.md`, pending `target.md`), stacked at every size, neither `filled`. Where `DoorNote` sits is first in the order, so a parent reads what is kept before the choice. Optional is a word beside a label where a field exists (NS-47-R30); the ask has none. Height budget at default size on an SE 3: about 190 pt, which does not fit above a three-line prompt with the cluster pinned (arithmetic): the ask sits below the prompt block when a device check says the prompt's full text would not stay visible (A-S01.daysAskBelow, NS-47-R32 allows it). The day slip never moves below the prompt.

AX5 (375 pt): the switcher label wraps to two lines (names never truncate; chevron stays on the first line end); dateline wraps; the slip scrolls with the content above the prompt (never between the prompt and the cluster, C9); the day slip's "Not today" takes its own full-width row (AX3 and above, NS-50-R14); the Days ask's buttons stay stacked; the capture cluster rides inline under "Another thought", rendered solid; Speak and Type stack full width (64 pt each); Start from a photo and Not much today stack full width at 44 pt. The switcher, dateline and the three capture controls never overlap (NS-14-R5). Speak is not scrolled off view at AX5 with the slip showing (NS-49-R1 test; if the re-draw fails the AX5 test on a device, level 1 ships nothing new).

VoiceOver order: switcher ("For Asha. Letters go to Asha's book.", hint "Changes whose book") > dateline > greeting (heading level 1) > the slip, if any (one element: "{name}. {line}"; its action "Not today"; then its visible button "Not today", hint "Hides this until tomorrow"; for the Days ask: the question, the call-out, "Choose days", "Not now", hint on "Not now": "Closes this question. You can still choose days in Me.") > typed-day line > prompt (hint "A thought to start with") > Another thought > Plus line > Speak > Type > Start from a photo (hint "Opens choices" with level 2, "Opens your photos" without) > Not much today. At AX5 the cluster follows Another thought and the order matches what is seen. Voice Control names equal the visible labels: "Speak", "Type", "Start from a photo", "Not much today", "Not today", "Choose days", "Not now", "For Asha".

States:
| State | What changes |
|---|---|
| `default` | One book, no slip, cluster pinned; "Start from a photo" opens the picker directly (level 2 absent: drop A) |
| `twoBooks` | Switcher above the dateline (R1) |
| `twoBooksNameless` | Switcher label and sheet rows carry the date: "For your child, born 2 March" (intent) (R7) |
| `beforeYou` | Due date only: "BEFORE YOU" dateline; prompts from that set; no age words |
| `waiting` | Rank 1: waiting cards ("Waiting to be kept.", "Recorded before the app closed.", "A recording is ready to read back.") with Pick it up / Open; a picture draft shows its 40 pt thumbnail (PROPOSED) |
| `heldMany` | Two or more held letters: one row, "Letters waiting to be kept." with Show them |
| `slipSeal`, `slipCopy`, `slipPast` | Ranks 2, 3 and 4: hand-offs to B-S18, C-S06 and B-S17; at most one |
| `dayToday` | Rank 2b: the day slip, name and one line, "Not today" (A-J18) |
| `dayTodayTwo` | One day slip naming both days |
| `dayTodayQuiet` | A quiet-tone day: the slip holds the name and "The book is open if you want it."; no prompt block; no question (A-J19; default pending Q-FD-24) |
| `dayDismissed` | After "Not today": the slip is gone for the local day; the prompt block is back on an ordinary day, absent on a quiet-tone day |
| `daysAsk` | Rank 3b: the Days ask above the prompt block (A-J20) |
| `daysAskBelow` | The same ask below the prompt block, when the device check says it does not fit above (NS-47-R32) |
| `daysAskGone` | After either answer or two unanswered showings: default Home |
| `quietBook` | A quieted or hidden active book: no day slip, no ask, no Plus line change (NS-50-R8) |
| `snapshot` | The app-switcher snapshot of Home: blank where a slip would show, with or without App lock (E18) |
| `plusLine` | Allowance used and no Plus: the standing line above Speak and Type, no button, no price (built; the words "stay free", FIN-09) |
| `photoMenu` | "Start from a photo" opened to its two-item menu: "Choose a photo", "Pick from recent days" (level 2 present, drop C) |
| `photoOff` | Flag off, `killSwitches.photos`, no native module: no photo start and no gap (R19, R59); the menu is absent with it |
| `quietKept` | Not much today kept: the kept line with Undo replaces the link (D-S21); a different thing from the quiet-tone day above (see Q-A6) |
| `fromReminder` | Same as default or as the day slip when a day is today: a tap changes nothing about what Home shows (NS-50-R4); the current prompt; nothing records (NS-13-R9, NS-35-R7) |
| `typedDay` | Typed-day line in the prompt block (D-S11) |
| `lowStorage` | E-S17 line above the cluster; capture works |
| `offline`, `killSwitch`, `planLapse`, `signedOut` | Same as default (plan lapse may add `plusLine`); the day slip and ask read the local store only, so offline changes nothing; signed out clears the store and so the slip |
| `secondAccount` | B's books only; selection reset; B sees nothing of A's days (NS-14-R11; E-S18) |
| `empty` | No book: first run (E-S02); a doorway never records here |
| `ax5`, `vo`, `dark` | As above |

Components: existing `Lamp`, `Text`, `Button` (capture, quiet, `bordered`), `ButtonRow`, `DraftCard`, `HeldRow`, `PlusLine`, `QuietDayInline`, `ResurfacedCard` (to be replaced by NS-23's slip), `ChildSwitcher` (from the Book, gains `surface: 'home'`), `PhotoStart` (#838, `components/photos/photo-start.tsx`). New or changed: C9 Home slip host gains the variants `daySlip` and `askSlip` and the order as data (extends BL-963; COMPONENTS R11), `DoorNote` (new shared component, NS-47-R29; justified in section 4). The anchored menu on the photo start is a system menu (T-MENU, A4 gains the `menu` variant); if the spike shows the suggestions picker can only open from its own label, the menu becomes an N7 `fit` sheet holding both choices (NS-49-R29).

Integration map:
| | |
|---|---|
| Card rows | NS-35-R1, R3, R5, R7; NS-14-R1, R2, R5, R6, R9, R10, R11; NS-01-R1, R19, R20a, R59, R60; NS-49-R1 to R5, R29; NS-50-R1 to R12, R14, R15; NS-46-R13, R16; NS-47-R19, R26, R29 to R32; NS-13-R9; NS-18-R1 (landing); NS-19-R1 (no record into a kept letter, nothing drawn); NS-44-R1, R12 (first Home, nothing sold); frame `[FRAME-SLIP]` |
| Backlog | BL-941 (switcher), BL-931 / #838 (photo start), BL-963 (slip registry; ranks 2b and 3b need a new row, NS-50 section 10), BL-946 (past letter), BL-942 (Save a copy slip), BL-985 (quiet reader, `bookIsQuiet`), BL-966 (days store, Drop B) |
| Flags | `EXPO_PUBLIC_PHOTOS` (on only for `on`); `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED, narrows only, level 2); `EXPO_PUBLIC_DAYS` (NS-46); `localFeatureEnabled` per plan 17 2.2 |
| Kill switches | `killSwitches.photos` hides the photo start and its menu only; `killSwitches.libraryDays` (PROPOSED) hides the day slip and the ask. `serverFeaturesEnabled()` off: no change |
| Error codes | none shown on Home (a store that cannot be read shows no slip and no message) |
| Data read | active child (`useChildren`), `listDrafts(childId)`, entries (past letter, quiet mark), plan view, letters kept; prompt selection inputs; `subscribeDays` (the days module, read-only, lazy); `culture.asked` and the two-showings counter; `bookIsQuiet` |
| Data written | active child selection (local); a quiet-day mark (`startCapture({source: 'notMuchToday'})`); the "Not today" dismissal as a local date value, never a day id (NS-50 section 10); the ask's answered flag (NS-47-R2) |
| Module | `app/(tabs)/index.tsx`, `lib/capture/start-capture.ts` (sources `speak`, `type`, `notMuchToday`, `photo`, and `suggestion` added in the suggestions module's own PR, NS-49-R2), `components/tonight/*` (`slip-host.tsx`, `slip.logic.ts`), `components/child/child-switcher.tsx` |

### A-S02 Whose book sheet

The one `Sheet` with title "Whose book?" (built `children.switcher.title`) and a `ChoiceGroup` list: each row the book title ("Asha's book") with the current month under it ("Month 7", "Before You"), radio selection shown by a check and weight, not colour. A tap chooses and closes. A last row "Add a book" routes to `settings/children/new` (as built on the Book).

AX5: rows grow, names and month lines wrap; the list scrolls inside the sheet. VoiceOver: sheet title, then each row "Asha's book, Month 7, selected" / "Kiran's book, Month 31", then Add a book, then Close. Reduce Motion: the system sheet's reduced transition.

States: `default` (two books), `many` (three or more, scrolls), `nameless` (dates on rows), `hiddenExcluded` (a hidden book is absent), `dark`, `ax5`, `vo`. Interrupted: stays open or closes with no change.

Components: existing `Sheet`, `ChoiceGroup` (`WhoseBookSheet`). New: none.
Integration: NS-14-R1, R6, R7, R9, R10; BL-941; no flag, no kill switch, no error code; reads `listChildren()` minus hidden; writes the active child id (local, L3, not synced); module `components/child/whose-book-sheet.tsx`, `child-switcher.tsx`.

### A-S03 Apple's photo picker and the states around it

There are two pickers and both are Apple's. Level 1 is `PHPickerViewController` (one still, no library permission). Level 2 is Apple's recent-days picker (the Journaling Suggestions picker, iOS 17.2 and later; the phrase never reaches a parent, NS-49-R37): the phone lists recent days, the parent picks one, and the phone hands the app that one suggestion; the app uses only its photo or Live Photo still (NS-49-R7, R10). Ours are only what happens around them. No line of ours sits above either picker until counsel clears the one door sentence (NS-49 section 12; LEG-01 keeps the label line absent until Q43).

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
| `suggestions` | Apple's recent-days sheet over Home, reached only from the menu item "Pick from recent days" (A-S01.photoMenu); first time, Apple's one-time consent sheet, never explained or pre-prompted by us (NS-49-R11). The pick returns one suggestion in memory | outcome `picked` with one photo, several photos, or none |
| `suggestionsCancel` | Cancel, or the consent sheet declined, or Suggestions off, or an empty list: back on Home exactly as before, no draft, 0 files, no message, no retry prompt. The app cannot tell these apart and does not try (NS-49-R11; F49-2) | none observable |
| `suggestionsNoPhoto` | A suggestion with no photo item: ends at A-S04.suggestionNoPhoto (a picture-less Ready and one calm line); the module returns not even a title or a date (NS-49-R10, R34) | `photo_pick_failed` is not used; the module returns nothing |
| `levelAbsent` | iOS 17.0 or 17.1, Android, Expo Go, flag off, entitlement missing, iPad, Mac, Vision: the menu is not drawn and "Start from a photo" opens the level 1 picker directly; never a dead button (NS-49-R5, R18) | `isAvailable()` false |

Integration (level 2 adds): NS-49-R5 to R7, R10 to R12, R18, R19, R21, R24, R25, R28 to R31; the suggestion file is validated as a regular file in Apple's location, opened once without following links (R19); `pickSuggestion()` is the one native boundary and a JS stand-in with Asha fixtures drives the prototype and tests, labelled "(stand-in)" (R31); the entitlement `com.apple.developer.journal.allow` is present only in a build whose flag is on (R15); the weak-linked, `#available(iOS 17.2, *)`-guarded import must launch on iOS 17.0, 17.1, 17.2 and 26 (R28, P0 (c)); no photo-library permission string, no PhotoKit call, level 3 closed (R6, R25); a pick landing under App lock is dropped (R12); a network fake sees 0 requests (R33). Backlog: new rows needed for the suggestions module, the entitlement and plist review, the source scan and canary (NS-49 section 10; no id invented here); flag `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED). Level 1 integration: NS-01-R2, R4, R17b, R22, R46, R47, R52; BL-931 (#837), P-1 / BL-950 (progress); flag `EXPO_PUBLIC_PHOTOS`, kill `killSwitches.photos`; codes `photo_pick_failed`, `picked_file_outside_picker_folder`, `photo_temp_name_refused` (all shown as `failed`, never logged with a path); writes the picker's temporary copy in `Caches/ImagePicker`, deleted once read; module `modules/scribe-photo`, `lib/photos/picker.ts`, `use-photo-pick.ts`.

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

Recent-days states on Ready (NS-49-R9, R10; the picture is the one the parent chose, stored through the NS-01 path):
| State | Shows |
|---|---|
| `suggestionLabel` | Ready with the picture (as `readyPhoto`) and, under it, one row: a decorative glyph (hidden from VoiceOver), the visible words "From your phone: {title}", "Use this" and "Clear" (each 44 pt, `plain`). The row wraps at AX5 and never truncates the title (the phone's text, shown as given, any script). VoiceOver reads "From your phone: {title}"; the glyph plus words, never colour alone. The photo-words field does not exist on Ready: it is on Review and starts empty |
| `suggestionTaken` | After "Use this": the row gives way (`m.swap`) to one quiet line saying the words are kept for the photo and can be changed on Review (intent). The title is now the parent's own text in `photo_text`, edited like any other, writing tools off, no marker that Apple wrote it (see Q-A2: the constitution reading is not ruled) |
| `suggestionCleared` | After "Clear": the row leaves; nothing of the title is kept; the picture stays |
| `suggestionNoPhoto` | A suggestion with no photo: plain Ready (the red circle, or Speak and Type if the parent came from Home with no picture) and one calm line above the prompt (`InlineState`, `textMuted`, no icon, announced politely once): the intent is that this one had no photo in it. Nothing about the other items is kept, shown or logged |
Without a tap on "Use this" and without the row, a kept letter stores no title (R9). A date chip from the suggestion's date is parent-confirmed only (NS-01 OQ-1) and is not drawn here.

Photo failure states on Ready: `photoCouldNotOpen` (line in the thumbnail slot, "Choose another", Speak and Type unchanged; `photo_pick_failed`, `photo_reencode_failed`, `unreadable`), `iCloudOffline` (line in the slot, "Choose another"; R46). Both keep the capture going without a picture.

Other states (after the recent-days rows): `lowSpace` (under 1 GB: one line under the hint; capture goes on), `doorway` (identical to Ready at rest; NS-06-C1; VoiceOver announces Ready on arrival), `appLockFirst` (E-S22 then Ready), `firstRunIncomplete` (E-S02, never Ready), `secondTakeRefused` (a doorway while a take runs: the current A-S05 stays; no new Ready), `interruptedOnReady` (picture still there, R57), `offline`/`killSwitch`/`planLapse`/`signedOut` (same as default), `secondAccount` (Ready for B's active book only), `dark`, `ax5`, `vo`.

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
| `photoWordsFromPhone` | The photo-words field holds the phone's title after "Use this" on Ready: it is the parent's own text, editable, writing tools off, no marker, no "From your phone" label (NS-49-R9; Q-A2) | NS-49-R9 |
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
States: `saved`, `savedPhoto`, `savedPrivate`, `voiceOnly`, `held`, `gate` (E-S10), `reminderAskNext` (D-S04, a sheet over the Book after the first kept letter; never on Home), `dark`, `ax5`, `vo`.
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

### A-S16 One photo from a suggestion (PROPOSED id, NS-49 section 15)

Reached only when the suggestion the parent picked holds several photos (NS-49-R8). An N7 sheet (native `formSheet`, `fit` detent) titled by `content` ("Choose one photo", PROPOSED key `features.photos.suggestions.choose.title`; one word, "photo", through the whole flow). Inside, a grid of `PhotoFrame` (C3) thumbnails, each at least 96 pt square and a button: a tap chooses that photo and closes the sheet, then A-S04.suggestionLabel (or `readyPhoto`). Nothing is stored until the choice; the app takes none by default. No glass inside the sheet (N7 rule); no spinner: a placeholder fades in by `m.fade` after `loading.placeholderAfterMs` and the picture fades in on decode.

AX5: one column; each thumbnail full width, fitted and never cropped; the sheet scrolls. VoiceOver: sheet title > "Picture 1 of 4" > "Picture 2 of 4" ... > Close (a picture is never described: no scene, person or place words; the count is a position, not a total of anything the parent owns). Voice Control: "Tap Picture 2". Switch Control: one item per picture. Swipe down and the VoiceOver escape gesture close it and choose nothing, which is the same as cancelling: Home as before, 0 files. `accessibilityIgnoresInvertColors` on every thumbnail (NS-33-R11; Smart Invert leaves pictures alone). A Live Photo shows its still only.

States: `default` (four photos), `loading` (placeholders), `ax5`, `vo`, `dark` (1 pt `line` edge, no shadow), `closed` (nothing chosen), `appLockDrop` (the sheet is discarded if App lock rises; 0 files).
Integration: NS-49-R8, R17, R30; backlog row needed (suggestions module, NS-49 section 10); flag `EXPO_PUBLIC_SUGGESTIONS`; kill `killSwitches.photos`; no code shown; reads the in-memory suggestion (released when the picker returns, R10) and writes nothing until the choice; module `modules/scribe-photo` (`pickSuggestion()`), a sheet inside `components/photos/`.

## 3a. Material layer per screen (design system v2, `docs/design/system/BRIEF.md` section 3)

Rule applied: glass (regular) only on the navigation and control layer; clear glass with a 35 percent dim only for a control floating over a picture; everything that is a letter, a list, a card, an empty or error screen stays content layer (paper and ink tokens). One glass container per cluster, never glass inside glass, at most three glass surfaces visible. Reduce Transparency or iOS before 26: each glass surface becomes a solid `surfaceRaised` with a 1 pt `line` hairline, same shape and size. Increase Contrast: hairline and labels step to the high-contrast tokens.

| Screen | Glass (regular) | Clear glass, 35 percent dim | Content layer | Glass surfaces visible (max 3) |
|---|---|---|---|---|
| A-S01 Home | Native tab bar (N1); Speak and Type as one `GlassContainer` (A2); the photo menu is the system's while open | none | Switcher row (I6), dateline, greeting, the day slip and the Days ask (content, `surfaceRaised`, `DoorNote` on `surface`), prompt, Another thought, waiting cards; the Plus line, Start from a photo (A4) and Not much today on paper in the fixed bottom region (A2) | 2 (tab bar, cluster). At AX5 the cluster rides inline in the scroll and renders as content-layer solid buttons, because it no longer floats (reconcile with system COMPONENTS.md) |
| A-S02 Whose book | The sheet | none | Rows inside the sheet (no glass inside glass) | 1 |
| A-S03 Picker | System | none | none | system |
| A-S04 Ready | Close button; Speak and Type as one bottom container (picture form) | none | Thumbnail, Change, prompt, primer and problem screens (C8 state screens are never glass). The red circle at rest sits in the A3 glass ring | 2 |
| A-S05 Recording | The record control A3: Pause and Finish (with the recording dot and the time) in one container | none | Aura, clock, line, prompt; Let it go as a `plain` button on paper | 1 |
| A-S06 Write | Close; Save toolbar above the keyboard | none | The field and prompt | 2 |
| A-S07 Review | N2 header items (Play, Close); the N3 bottom toolbar (Keep prominent, Keep private plain); the F1 Undo toast when open | Only if a control is placed over the picture (none in this design: Change photo and Take the photo off sit under it) | The letter sheet including its To, day and From controls (they are part of the letter), view control, fixes, picture card, Let it go | 3 at most (header, footer, toast). At AX5 the footer is inline and solid, leaving 2 |
| A-S16 | The N7 sheet | none | Thumbnails (content), no glass inside | 1 |
| A-S08, A-S09, A-S12 | The sheet | none | Fields, pickers, lists inside | 1 (Review below sits under the scrim) |
| A-S10 | none | none | All inline on Review | as A-S07 |
| A-S11 | The F6 confirmation sheet | none | the notRemoved line | 1 |
| A-S13 | Undo or held toast | none | The saved sheet | 1 |
| A-S14 | System (widget, control) | none | none | system |

Names: this file uses the built component names. Section 9 maps them to the v2 names in `docs/design/system/COMPONENTS.md` once that file exists.

## 4. New components proposed

1. `DoorNote` (new shared component, NS-47-R29): a static content-layer block in `callout` type and `text` colour on `surface` with `radius.md` and a decorative lock glyph hidden from VoiceOver; never collapsed, dismissible, behind an info glyph or glass; first in reading order before the control that records a choice; wraps at AX5 and never truncates. Justification: three surfaces need it (the Days ask, C-S25, C-S24), and C-S21 (backup consent door lines) and NS-10's sheets need the same block; the existing F2 SystemLine is for system conditions only, `AppNote` is `textMuted` and too quiet for a promise, and an InlineNote with a close button is dismissible (wrong for a promise). Where it also serves area A: the one door sentence for the recent-days picker, once counsel clears it (NS-49 section 12), as a menu item subtitle or the first line of the `fit` sheet fallback (Q-A5).
2. C9 Home slip host variants `daySlip` and `askSlip`, and the slip order as data (extends BL-963 and COMPONENTS R11): not a new component, a change to the one the system file already names. `Not today` is its own key, not `en.common.notNowButton`, which stays the Days ask's answer.
3. I1 `optional` slot and the decline role of the paired-answers pattern (NS-47-R30): used by area C and E; area A's ask has no field. A4 gains a `menu` variant (a system menu; no new file).
4. Token gaps (standing duty 2): `layout.rowMin` 52 and `target.md` 48 are still open name requests to FOUNDATIONS (COMPONENTS section 9); the ask's 48 pt buttons and C-S25's rows depend on them. No new colour, type token or motion primitive: the new states use `surfaceRaised`, `surface`, `text`, `textMuted`, `callout`, `footnote`, `m.enter.group`, `m.list.remove`, `m.fade`, `m.swap`, `m.select`, `H-select`. A new transition id `T-SLIP` is proposed to v2 (MOTION.md of this folder).
5. No other new component. The From sheet, the day sheet, the replace confirm, the Undo line, the picker states, the another-language state and the doorway arrival use `Sheet`, `ChoiceGroup`, `TextField`, `Toast`, `StateScreen` / `InlineState`, `PhotoFrame` and `Button` as built. The undo window is a helper, not a component (BL-954).

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
| NS-49 | A-S01 (menu), A-S03, A-S04, A-S07, A-S16 | new rows (module, entitlement, scan, canary); BL-931 | `EXPO_PUBLIC_PHOTOS`, `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED) | `killSwitches.photos` | NS-01's; none added |
| NS-50 | A-S01 (`dayToday`, `dayTodayTwo`, `dayTodayQuiet`, `dayDismissed`, `snapshot`) | BL-963, BL-985; new row for ranks 2b and 3b | NS-46's (`EXPO_PUBLIC_DAYS`) | `killSwitches.libraryDays` (PROPOSED) | none |
| NS-47 (the ask) | A-S01 (`daysAsk`, `daysAskBelow`, `daysAskGone`) | BL-023 (ask sequencer), BL-963 | NS-46's | `killSwitches.libraryDays` | none |
| NS-39, NS-44 (card 19) | A-S01, A-S04 primer, A-S05, A-S07, A-S13 | BL-962 | none | none | `mic_denied`, `storage_low` |

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

- G-22 NS-50-R3 and R15 against RV-7: R3 says a quiet-tone day's slip shows the name and the quiet line, and R15 says the same line replaces the prompt block. Read together they draw the line twice or the slip as the replacement. Default: one rendering: the slip card holds the name and the quiet line with "Not today", and the prompt block is not drawn; after "Not today" the block stays absent for the local day (A-J19). Karma rules (Q-FD-24 is the founder's).
- G-23 NS-50-R4 and C9 against the built order: the slip slot is "directly above the prompt block", but the built Home puts waiting cards after the prompt, and rank 1 can be several cards. Default: one slot above the prompt for every rank; rank 1 with two or more waiting items folds into the one `HeldRow` so the prompt stays in view; the fold is a change to built behaviour and a rank 1 pick-up row per draft stays one tap away. UNVERIFIED on a device; see Q-A3.
- G-24 NS-47-R32 allows the ask "below the prompt" and NS-50-R4 puts the day slip above it: the two ranks may sit in two places. Default: the day slip always above; the ask above unless a device check on an SE 3 at the default size fails, then below (A-S01.daysAskBelow). A test that Speak and Type never move.
- G-25 NS-50-R7 words: "Not today" for the day slip against `en.common.notNowButton` for the ask; the day slip is not an answer, so it has no Undo and the VoiceOver hint states the consequence ("Hides this until tomorrow"). Default as the card.
- G-26 The word "quiet" now names three things on Home: the quiet-tone day (Memorial Day), the quiet-day mark ("Not much today", NS-07 C5, "A quiet day, kept.") and Quiet this book (R-IA-6). Default: in this folder the first is always "quiet-tone day", the second "the quiet-day mark", the third "a quieted book"; a parent never reads "quiet tone". `content` decides the parent words.
- G-27 NS-49-R29 puts a menu on "Start from a photo" where level 2 exists; IA-AUDIT 6 says one control. Default as Q-FD-31: a menu only where level 2 exists, otherwise the picker directly; the hint changes with it. If the spike shows the suggestions picker opens only from its own SwiftUI label (UNVERIFIED), an N7 `fit` sheet holds both choices.
- G-28 NS-49-R9: after "Use this" Apple's title is stored as the parent's own words with no marker. Whether that fits the constitution's "never add meaning" is not ruled in the card (design-systems review F49-4). Default as the card; flagged to Karma (Q-A2), not resolved here.
- G-29 NS-49-R37 forbids public copy that shows Apple's sheet; the prototype state A-S03.suggestions is an internal stand-in. Default: the stand-in is labelled internal and never leaves the design folder or a store frame.
- G-30 Round 2 direction (`26-founder-direction-photos-library-and-media.md`) reverses NS-49's "level 3 closed in 1.x" and "one picture per letter". This file's A-U81 and the A-S03 `levelAbsent` rows still say level 3 is closed; see "Round 2 additions".

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

- E-15 Home slip host and registry do not exist; ranks 2b and 3b need a new row (BL-963 covers the registry; the host and SlipCard are COMPONENTS R11's row) (NS-50 section 10).
- E-16 `DoorNote`, I4 `multi`, I1 `optional`, C9 `daySlip` and `askSlip`, `target.md` and `layout.rowMin`: backlog rows needed (design-systems review section 11; no id above BL-999 invented).
- E-17 Picker hosting spike: can the recent-days picker be presented without its own label button; does a hosted SwiftUI view join a glass container; what does Apple's returned file URL's location and lifetime look like (NS-49-R19, spike steps 1 and 2).
- E-18 The days store, `bookIsQuiet` (BL-985), the one-a-day `budget.ts` and the blank-on-background rule (E18) are prerequisites of the day slip (NS-50 section 22).
- E-19 `A-S01.dayToday` and `daysAsk`, A-S16 and C-S24 to C-S26 are not in the accessibility screen set (NS-33-R4, R7, R16, quality Annex B.3); XCUITest rows needed (design-systems review F-X1).
- E-20 `startCapture` closed source list gains `suggestion` only in the suggestions module's own PR (NS-49-R2).

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

### 9.8 Final-pack re-key (20 Nov, second pass)
| Earlier key in this folder | Now |
|---|---|
| NS-38 to NS-45 (area E's old numbering, cited as "first run" rows) | Card 19: NS-39-R4 and R10 (a recording that waits for its words; the microphone primer), NS-44-R1 to R13 (the first kept letter, the allowance, nothing sold in first run). Area E owns NS-38, NS-40 to NS-43, NS-45 |
| "strip", "today strip" (FR-CUL-13, FUNCTION-TRACE 6.1.1) | "slip": A-S01.dayToday, rank 2b (R-IA-3, NS-50) |
| "note" for something the app sends | "reminder" (RV-3, BRAND.md glossary). "Note" stays only for something a person makes. The word survives in code names (`quickNote.*`) and in "Notes for Review", which is Apple's term |
| A-S01 slip after the prompt | The one slip slot directly above the prompt block (NS-50-R4, C9) |
| A-S03 `suggestions.empty` | Removed: the app cannot observe an empty list (NS-49-R11) |
| "Start from a photo" always opens the picker | A menu only where level 2 exists (NS-49-R29, Q-FD-31) |
| A-J01 step 6 "Home shows the reminder ask" | A sheet over the Book (card 22 section 3) |
| NS-50 row ids | R1 to R18 as in card 21 (the review's proposed R13 and R14 became R14 and R15; R13 is now the default-tab check) |
| NS-47 row ids | R28 to R33 as in card 21 (R29 `DoorNote`, R30 optional, R31 two showings, R32 equal weight and height budget); the review's R28 to R31 are renumbered |
| NS-49 row ids | R28 (launch below 17.2), R29 (entry control), R30 (A-S16 sheet), R31 (one native boundary); the review's R28 and R29 are renumbered |

## 10. Home as the default tab (IA-AUDIT sections 5 and 6)

Question: Home is the tab the app opens on. Does it carry enough, without copying the Book? Answer in design terms (a design judgement and code reading, not observed users; the default-tab check with five parents is NS-50-R13 and has not run).

**What Home is for.** "I go to Home to say something to {child}." (frame; WORDS W12). One primary action, Say. IA-AUDIT 5.1 counts 5 content elements, 4 actions and 0 to 1 slips: not thin, one job above the fold. Its weakness is the second visit the same day or the third day in a row, when only the greeting and the prompt change.

**What this pass adds, and what it refuses.**
| Adds (each a way to start a letter or to resume one, never a second job) | Refuses (and why) |
|---|---|
| A day the parent chose, today (rank 2b): the parent's own choice is the gentlest prompt there is; it changes Home on the days that matter without asking anything | A strip of several things: a feed with a count of things waiting (R-IA-3) |
| The Days ask, once, capped at two showings (rank 3b): a way to set up days, after the first kept letter | Any "complete your days" line, any count of days ticked or missed, any upcoming day (NS-50-R2, R11) |
| "Start from a photo", with recent days where level 2 exists: the capture cluster's third start | A picture suggestion as a slip or a tile (NS-50-R10); a fourth start button (NS-49 not in scope) |
| One past letter (rank 4, NS-23, unchanged) and the waiting set (rank 1, unchanged) | A second "on this day" row in the Book (IA-AUDIT 5.4); it stays NS-23 and NS-31 |
On a day with nothing marked Home is unchanged by NS-50. That is on purpose: a screen that always had something new would be a feed.

**One owner per fact (so Home and the Book do not duplicate).**
| Fact | Owner | Home shows | Book shows |
|---|---|---|---|
| The prompt of the day | Home | yes | no |
| Letters kept, by month | Book | no; one past letter only as rank 4, with its own words | yes |
| Age | one function, two precisions (R-IA-1) | months and weeks | months |
| Days the parent chose | Me, Days (C-S24) | today's only, as one slip | no |
| Waiting and held letters | Home | yes (rank 1) | a waiting card is the Book's too only through its own empty state pointing to Home |
| Save a copy | Me | a slip in the birthday week | no |
| The picture start | Home (capture cluster) | yes, once | Add a photo on a letter, not a start |

**Honest limits.** (1) Home still depends on one rule that is not built: the one slip slot has no host or registry today (E-15). (2) The slip cannot raise the floor: on a day with nothing marked Home reads as it did. (3) Whether five parents would open Home or the Book first is not known (NS-50-R13). (4) At the default text size on an SE 3 the slip leaves the prompt's last line in the scroll with two books (arithmetic, not measured; Q-A4).

### 10.1 Writing tools off, field by field (PRV-16, AIS-55, D2)
| Field | Screen and state | Writing tools, autocorrect, predictive text |
|---|---|---|
| Write | A-S06 default, withPhoto, forTake | off (G-16) |
| Review editor | A-S07 editing | off (D2) |
| Photo words, place | A-S07 withPhoto, photoWordsFromPhone | off (R50) |
| From name | A-S09 | off |
| The phone's title once the parent taps "Use this" | A-S07 photoWordsFromPhone | off; it is the parent's text after the tap |
| Typed-day words | D-S08 (area D) | off |
Each field's test id is `writingToolsOff.<screen>.<field>` (PROPOSED; quality owns the names).

### 10.2 Undo windows in area A, in one table (FR-QAL-09, T4)
| Undo | Where | Seconds | VoiceOver | Switch Control |
|---|---|---|---|---|
| Photo changed or taken off | A-S12.undo, A-S07.photoUndo | 10 | until the line is read plus 10, whichever is later | until the parent moves on |
| Words set aside (another language) | A-S10.withheldUndo | 10 (card gap G-07) | as above | as above |
| Not much today kept | A-S01.quietKept | no timer: stays while Home stays (A-motion 3) | n/a | n/a |
| Put it back (a small fix) | A-S07.putBack | no timer (as built) | n/a | n/a |
| Let it go | A-S11 | none: there is no Undo after the confirm | n/a | n/a |
| "Not today" on the day slip | A-S01.dayDismissed | none: it is not an answer; it returns tomorrow | n/a | n/a |
| "Not now" on the Days ask | A-S01.daysAsk | none: final for Home; Me, Days is one tap away | n/a | n/a |

## 11. Function needs accounted for

Each design-needs row the function trace assigns to area A (FUNCTION-TRACE section 6.1), with where it is designed or an explicit gap. Rows with no FR id are cited by function and number.

### 11.1 Rows filed by the functions
| FR | Screen and state | What the function needs | Where designed, or the gap |
|---|---|---|---|
| MKT-05, MKT-15, MKT-24 | A-S01.default | Store frame 1 with the Home tab label, no Plus line and no slip in the frame | Designed: A-S01.default is that frame (tab label "Home", no slip, no Plus line, Asha fixture). The frame art is marketing's, not drawn here |
| MKT-12 | A-S07 default | Frame 2 as today, Asha words only | Designed as is; the prototype uses Asha only |
| MKT-12 | A-S03, B-S11 | A picture frame with an illustrated or licensed picture; no real child; rights record | Gap: the store frame is marketing's artefact. The prototype draws shapes, never a photo of a person. NS-49-R37: no frame shows Apple's sheet |
| MKT-23 | B-S01 after A-S13.saved | A rating-moment state with the FR-MKT-23 exclusion list | No change in A: A-S13 draws no rating request; area B owns the state. Cross-effect designed: the Days ask is not shown in a sitting where the rating request showed (NS-47-R19; A-J20 step 1) |
| FIN-09 | A-S01.plusLine | "always free" becomes "stay free" | Designed as a state only: A-S01.plusLine draws the standing line with no button and no price; the line's words are area E's (E-S26) and WORDS.md of this folder holds none. Gap for area E: carry "stay free" in place of "always free" (K2 pins one string) |
| DAT-03 | A-S13 saved | No ordinal or total ("your 10th letter") | Designed: A-S13 shows no ordinal, no total, no count; nothing in this file draws one |
| PRV-16 | A-S06, A-S07, A-S09 | Writing tools off stated per field | Designed: section 10.1 |
| PRV-17, SEC-21 | A-S14 | No widget, control or Siri response shows words or a name; every string neutral | Designed: A-S14 (static mark, "Start a letter") |
| LEG-15 | A-S09 | Keep "Ask before you record someone else"; nothing that reads as an attestation | Designed: A-S09 item 3, no checkbox |
| LEG-01 | A-S03 | The label line stays absent until counsel's Q43 | Designed: A-S03 opening paragraph (no line of ours above either picker until cleared) |
| LOC-01, LOC-02, LOC-28 | A-S07.language, A-S10 | A reconciled line and a language chip when a build hears more than one language | Partly: the mark shows whatever the spoken-language list holds (G-06). Gap: no language chip is drawn; no card row asks for one in 1.0 (English-only). Default: none |
| LOC-15, LOC-16 | A-S07, B-S04, B-S05, B-S08, C-S05 | Arabic and Chinese fonts; Hindi line-height and Bold Text states | Gap: Review's letter uses the `letterBody` token; Devanagari, Arabic and Chinese states are not drawn here. Default: area B draws the shared letter styles; A follows. The A-S09 field accepts any script |
| LOC-17 | A-S07, B-S05.rtlLabel, B-S07, D-S02.rtl | A right-to-left state list, each state once | Gap for A: no RTL Review state is drawn. A-S09 allows RTL names and the phone's suggestion title is shown as given (NS-49 Devanagari row). Default: one mixed-direction Review state to be drawn when area B's list lands |
| REL-48 | E-S17, A-S04.lowSpace | The under-1 GB line; the 0 bytes at Keep case | Designed: A-S04.lowSpace, A-S05.lowSpace; A-S01.waiting "Recorded before the app closed." covers the recovered case |
| AIS (row 25, 29) | A-S07 words card | The recorded-but-no-words state names a whisper in plain words; Type the words stays the one primary; recording playable | Designed: A-S07.noWords and .emptyTake (built cards, one primary, one quiet). Words by content (title revision "We could not make out words this time" proposed by F05-U13) |
| AIS (row 31, 32) | A-S07 small fixes | One quiet "Check this" mark for a flagged span | Gap: the dotted-underline fix marks exist and are tappable at 44 pt; a distinct flagged-span mark needs an engine flag that no module reports. Default: not drawn |
| AIS (row 28) | A-S07, A-S10 | A state for a code-switched take; no new control | Designed: A-S07.partUnwritten (engineering gap: no module reports an unwritten stretch) |
| AIS (row 33) | A-S10.withheld | The machine output is never drawn | Designed: A-S10 |
| AIS (row 55) | A-S06 and every words field | Writing tools off as an annotation per field | Designed: section 10.1 |
| AIS (row 25, 29) | A-S04, A-S05 | One calm line when a take is mostly silent | Gap: A-S05.quietTake (a footnote replacing "Say it however it comes": "That was quiet. The recording is kept.", intent) is proposed and not drawn; needs `mobile` to say where the speech floor is read |
| AIS (row 48, 56) | A-S07 | A one-line help sentence that says what the fixes are and that nothing is added | Gap: not drawn. Default: one `footnote` under the fixes count row, words by `content`; no "AI", no "cleaned" |
| RSH-04 | A-S01, A-S04.primer, E-S02 to E-S12 | A clickable first-run path with no dead ends | Designed for A's part: journeys A-J01 and A-J22 in PROTOTYPE.html; area E draws the rest |
| QAL-09 | A-S12, B-S11, B-S15, D-S19, C-S17 | Undo seconds in one table | Designed: section 10.2 |
| DAY (days row) | A-S01 | The ask card on Home | Designed: A-S01.daysAsk (A-J20), wording "reminder" |
| CUL-19, CUL-26 | A-S01.daysAsk | One card, once, equal weight, no count, no badge, gone after either answer | Designed: A-S01.daysAsk, daysAskGone; NS-47-R32 stacked `bordered` pair |
| CUL-13 | A-S01 (NS-50) | A day we mark today shows its name; nothing for tomorrow; never a list | Designed as a slip, not a strip: A-S01.dayToday |
| CUL-19 | A-S13 | No change: the ask never rises after Keep | Designed: A-S13 has no ask hand-off; the reminder ask is a sheet over the Book |
| photos row | Home, A-S04 | The picture start with "Pick from recent days" inside it (light, dark, AX5 on SE 3), absent on 17.0 and 17.1 | Designed: A-S01.photoMenu, A-S01.photoOff, A-S03, A-S04.suggestionLabel, A-S16 |
| OPP-02 | A-S01 | Picture-first as an equal start, tested on the SE 3 at AX5 | Designed as the card rules it: third in the cluster, quiet, never larger (NS-49-R1; section 23's default). The AX5 device test is open (E-19) |
| OPP-04 | A-S01 | A prompt-offer state for "the same question again" | Gap and conflict: not drawn. NS-46-R22 bans "again" and "another" on a day reminder; Q-FD-8 says no opportunity cards before first-run evidence. Flagged below |
| OPP-05 | A-S14 | Lock Screen control and Home Screen prompt widget, redacted while locked | Designed as the static doorway only (A-S14: no name, no text). A prompt widget is not drawn (parked, Q-FD-8) |
| OPP-11 | A-S07 | A first view of Review with fewer controls before Keep | Gap: not drawn (parked, Q-FD-8). Review's three header controls are one visible row each |
| OPP-07 | A-S09 | A "from {child}" path in plain words | Gap and conflict: NS-16-R5 forbids any word that invites a child or sibling to speak. Not drawn; flagged below |

### 11.2 FRs that name a screen of this area with no design-needs row
The design response is the FR requirement itself (FUNCTION-TRACE section 1).
| FR | Screen | Where it lands |
|---|---|---|
| MKT-28 | A-S10 | No language named in the app before it ships: A-S10's words are language-neutral; the public side is marketing's |
| LEG-08 | A-S09 | A new field needs a policy line and a notice: A-S09's instruction line is the notice at the point of typing; the policy line is legal's |
| LOC-08 | A-S07.language | A-S07.language, built card |
| LOC-09 | A-S10 | Code-switching mode (v1.1) not drawn; A-S07.partUnwritten holds the place |
| LOC-11 | A-S08 | The day sheet shows Gregorian dates in Western digits (K12); A-S08 uses the installed picker |
| LOC-20 | A-S01 | The prompt block shows an English prompt in this build; native-written prompt sets are content's |
| REL-33 | A-S04 | Record latency under stress: A-S04 and A-S05 draw no wait; Speak is disabled only while a picture decodes (EG-6) |
| REL-54 | A-S05 | Clock and zone rows: the elapsed time is not a wall clock; the clock pauses in the background (CG-3) |
| AIS-07 | A-S06 | Typed words are never machine-edited: A-S06.forTake line, no fixes on `typed` |
| AIS-16, AIS-25 | A-S07 | The recording is kept untouched and the letter waits for its words: A-S07.ask, .downloading, .language, A-J22 step 3 |
| AIS-27 | A-S09 | No speaker label or voice comparison: A-S09 never names a speaker identification (R9) |
| AIS-29, AIS-30, AIS-31 | A-S07, A-S04 | No-words card (designed); repetition flag reaches Review (gap, see 11.1 row "Check this") |
| AIS-56 | A-S07 | Only what the engine changed is shown; "Exactly as said" one tap away; every fix undoes in one tap; no "keep all fixes" control: A-S07 view control and Put it back |
| RSH-05 | A-S01 | The diary week sends nothing from the app: no design |
| RSH-12 | A-S05, A-S10 | Research pooling: no design |
| RSH-16 | A-S07 | Research does not test the small-fix feature: no design; flagged for Karma (a charter reading) |
| QAL-08 | A-S01, A-S07 | Glass fallback and at most three glass surfaces: section 3a, now including A-S16 and the new Home states (all content layer) |
| DAY-02 | A-S01 | Nothing ticked for the parent; "Not now" and leaving are full answers: A-S01.daysAsk |
| PHS-01 | A-S04 | Photo start is a first-class start: A-S01.default, A-S04.readyPhoto |
| OPP-03 | A-S03 | "Only the chosen item reaches the app" is wrong (RV-12): the design wording is that the phone hands the app the one suggestion and the app uses only its picture; flagged below |
| OPP-06 | A-S14 | No doorway offered before NS-04 passes: A-S14 conditional, `flagOff` |
| OPP-08 | A-S03 | Bringing in a file by a system picker: not drawn here (NS-06; not in this area's cards) |

### 11.3 Contradictions with a product ruling (flagged, not resolved)
1. FR-OPP-03 and FR-PHS-54 say "only the chosen item reaches the app"; RV-12 ruled that wrong. This file follows RV-12 and NS-49-R16; the FR text needs the amendment.
2. FR-OPP-07 ("from {child}" path) against NS-16-R5 (never invite a child to speak): not drawn.
3. FR-OPP-04 ("the same question again") against NS-46-R22 and the "no again" rule in NS-48-R4: not drawn.
4. NS-50-R3 against R15 on one or two renderings of a quiet-tone day (G-22).
5. NS-49-R1 says "one of the equal starts" in section 3 and "never larger than Speak" and "quiet capsule" in R1; the design draws it quiet, third (the section 23 default). The card text itself disagrees.
6. FUNCTION-TRACE 6.1 row for cultural-data says "A-S01 Home strip (today strip, NS-50)": the product ruling is slip, not strip (R-IA-3). The design follows the ruling.
7. NS-47-R29 prescribes `DoorNote` "dismissible" in a list of what it must never be, but its sentence reads "never collapsed, dismissible, behind an info glyph or glass": ambiguous list; this file reads it as "never dismissible".

## 12. Round 2 additions (founder direction 20 Nov, second round): photo moments, and pictures and videos with a letter

Status: PROPOSED. Source: `docs/product/prd/26-founder-direction-photos-library-and-media.md` (committed f8eead016). The cards NS-51 (photo moments, library access) and NS-52 (several pictures and videos with a letter) are being written in `27-photo-moments-and-media.md`, which did not exist when this was written, so everything below is keyed to NS-51 and NS-52 by name, uses PROPOSED ids, and is re-keyed to row ids when 27 lands. Nothing in sections 1 to 11 was changed by this section except where it says so; those sections still describe level 3 as closed and one picture per letter, which direction 26 reverses (RV-18 onward). The founder has not ruled Q-PM-1 to Q-PM-7; every default here holds until he does.

What does not change (direction 26 section 1): no caption, title, summary or story is ever written, suggested as words or pre-filled from a picture; a nudge never describes what a picture shows; analysis is on the phone only; no face recognition; nothing counts or scolds.

### 12.1 New screens and states (PROPOSED ids)
| Id | What | Where it lives |
|---|---|---|
| A-S17 | Moments sheet: the parent's own pictures, grouped by day, as a way to start a letter | An N7 sheet opened from the photo start's menu (A-S01.photoMenu gains a third item, "From your pictures", PROPOSED wording by content), only when the parent has opted in and a moment exists; absent otherwise (not greyed, no empty promise) |
| A-S18 | Photos access: the ask, and every access state | A primer sheet before iOS's own Photos question, reached from A-S17's entry or from Me, Photos access (area C); never in first run (NS-39-R2), never in the same sitting as another ask (NS-47-R33) |
| A-S04 and A-S07 `mediaTray` | The pictures and videos attached to this letter | A row of thumbnails under the prompt on Ready, and the media card on Review, in place of the single picture card |

### 12.2 A-S17 Moments sheet
Content layer inside an N7 sheet. A list of days; each row is a day line (`subhead`, "Saturday 14 June": date and nothing else), and up to three of the parent's own thumbnails (fitted, uncropped, `PhotoFrame`, at least 96 pt, `accessibilityIgnoresInvertColors`). A tap opens that day's pictures to choose from; nothing is preselected; the parent attaches one or several (up to the limit) and then speaks or types. The app never writes a title, a caption or a description of a day, never names a place (place names are off by default, Q-PM-5), never shows a count of pictures or of days ("12 photos", "3 days with no letter") and never ranks days by how many letters are missing. Which days are offered comes from date, count and clustering on the phone only (direction 26 section 2), and a day the parent marked (NS-46) or a birthday week may be offered first; the sheet says nothing about why.

Only the days the parent allowed are shown. With limited access (the parent chose some pictures): A-S17.limited shows those pictures only, plus one quiet row "Choose more" that opens Apple's own limited-library picker; there is no nag, no second prompt and no line saying anything is missing. Reduce Transparency, Increase Contrast, Smart Invert (pictures exempt), AX5 (one column, rows stack, day lines wrap) and dark follow the A-S16 rules. VoiceOver: sheet title > "{day line}" > "Picture 1 of {n}" for each picture (a position, never a description) > Close. Voice Control: "Tap Picture 2".
States: `default`, `limited`, `loading` (placeholders `m.fade`, no spinner), `iCloudDownloading` (the system's progress, Cancel), `none` (no moment today: the menu item is absent, so the sheet is never reached empty), `paused` (parent paused it: absent), `appLockDrop` (discarded, 0 files), `ax5`, `vo`, `dark`.

### 12.3 A-S18 Photos access (the ask and the states)
Draws the same as the microphone primer (A-S04.primer): glyph, title, body, two equal ways, Close. "Allow" leads to iOS's question (limited or full read, the parent's choice, Q-PM-1); "Not now" is a full answer of equal weight and leaves every other way to attach a picture working (Apple's picker needs no permission). The primer says in plain words that the app looks at dates and counts on the phone and that nothing leaves it (claims wait for counsel and the label read; no sentence is final). No sentence names Apple's Journal, "memories" or "moments" (BRAND.md).
States: `primer`, `denied` (one calm line and a quiet "Open Settings"; level 1 and level 2 go on working; no repeat ask), `limited`, `full`, `paused` (the parent paused moments: no invitation, the index kept), `off` (the index removed: Me, Photos access, area C), `appLockDrop`, `notAvailable` (iPad, Mac, Vision, Android, flag off: absent, never greyed), `ax5`, `vo`, `dark`. Where the parent turns it off, pauses it or removes the index is area C's (Me, Photos access); this area draws only the ask and the entry.

### 12.4 Pictures and videos with a letter (NS-52)
Defaults from direction 26: up to 6 pictures and 2 videos per letter, a video up to 60 seconds and under a size cap; the founder confirms (Q-PM-2).
- **Ready (A-S04.mediaTray):** under the prompt, a row of thumbnails, 56 pt each, scrolling sideways at default size and a single column list at AX3 and above; each item has its own 44 pt Remove (visible word "Remove", Voice Control name "Remove picture 2") and a video shows a poster still with its length as visible words ("0:42") and a play glyph, never colour alone. "Add a photo or video" is one quiet 44 pt row at the end (the same Apple picker, one choice at a time, or several if the picker allows). Speak and Type are unchanged and never move.
- **Review (A-S07.mediaCard):** the media card replaces the picture card: the items in the order the parent added them, each with "Change", "Take it off", and the optional words field "A few words about this one, if you like" (the parent's own words or nothing; never generated, never pre-filled; writing tools off). A video opens in the system player; its sound is kept as it is and is not transcribed in this design (Q-PM-4).
- **Limits (A-S07.mediaLimit):** when the letter holds all it can, "Add" is absent and one calm line says the letter is full of pictures and videos (words by content; no number beyond the limit itself). A video over the limit or the size cap: the item is not attached and one calm line says so (A-S07.videoTooLong, `.videoTooBig`); nothing else changes.
- **Errors:** an iCloud-only original downloads on demand with the system's progress and Cancel (offline: one calm line, the letter continues without it); an unreadable or unsupported file, a failed re-encode, or a full phone: the same calm line as a failed picture, silent (A-motion 4: no sound, no haptic).
- **Undo:** "Take it off" and "Change" use the one undo helper (A-S12, T4, 10 seconds).
- **Letter with a picture and no words:** Keep stays off with the reason in words, as A-S07.photoNeedsWords; a video with no words is the same.
- **Never:** a caption, a transcript of a video's sound by default, a thumbnail grid counted in words ("4 photos"), a face or scene tag, a "best" picture, autoplay with sound, a pulse or a counter.

### 12.5 The moment invitation on Home: refused as a slip or tile, drawn as an entry
Direction 26 asks for the app to show the parent their own pictures as an invitation "in the capture area". The pack's rules say a picture suggestion is never a slip or a tile (NS-50-R10, R-IA-3) and Home is not a feed. Default: no new element on Home. The invitation is the third item of the photo start's menu (A-S01.photoMenu), present only when the parent has opted in and a moment exists, plus the neutral reminder area D draws (the existing budgeted class, no new class, no description of pictures). The photo start's label never changes and never shows a count, a dot or a badge. If the founder wants an on-Home element, the only form that fits the frame is one more line inside the capture cluster that replaces nothing and is hidden by "Not now" for the day (Q-A7). This is flagged as a conflict with NS-50-R10 and R-IA-3, not resolved.

### 12.6 Integration (PROPOSED, to be re-keyed to NS-51 and NS-52 rows)
| | |
|---|---|
| Cards | NS-51, NS-52 by name; NS-49-R6, R10, R25 and NS-01-R22 are the rows direction 26 reverses; NS-35-R5 (`startCapture` source list gains `moment`, memory only) |
| Flags and switches | A new flag for level 3 and one for media (names proposed by the card; `killSwitches.photos` pauses the new starts and leaves Erase, sweep and Export working) |
| Data (screen side) | Reads on the phone only: asset dates and counts; writes: the chosen items through the NS-01 stored-copy path; no thumbnail, filename, album or place leaves the phone; nothing is logged |
| Error codes | NS-01's photo codes; new media codes by the card |
| Gaps this adds | G-30 above; claims, label and counsel reads (Photos or Videos become "collected" if pictures leave the phone; Q-PM-3); storage and egress cost is finance's |

## 13. Open design questions (each with a default)

| Id | Question | Default |
|---|---|---|
| Q-A1 | Does the Days ask sit above or below the prompt block? | Above, unless a device check on an SE 3 at the default size says the prompt would not stay in view; then below (A-S01.daysAskBelow; NS-47-R32) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A2 | Is it acceptable that Apple's title, once the parent taps "Use this", is kept in the parent's own words with no marker? | Yes, as card NS-49-R9 reads; Karma to confirm against the constitution (design-systems review F49-4 flagged it, nobody ruled) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-035: Never without Use this; once taken it is the parent's own words, no marker; privacy may reverse |
| Q-A3 | Does rank 1 (the waiting set) fold to one row when two or more items wait, so the prompt stays in view above it? | Yes, fold; a pick-up row per draft stays one tap away (G-23) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A4 | With two books at the default text size on an SE 3, the switcher plus the day slip push the prompt's last line into the scroll. Accept, or move the switcher into the dateline row? | Accept and measure on a device; if the prompt's first two lines are not visible, drop the slip's height by putting "Not today" trailing in the first text row CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A5 | Where does the one recent-days door sentence (once counsel clears it) sit? | As a menu item subtitle; the `fit` sheet fallback holds it as the first line; absent until counsel clears it CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A6 | The "quiet" word names three things (quiet-tone day, quiet-day mark, quieted book). Rename in parent words? | Parent words stay as the cards have them; in this folder and in code, three distinct names (G-26) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A7 | A Home element for photo moments, if the founder wants one (direction 26) | None; the entry is the photo menu's third item and area D's neutral reminder (12.5) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A8 | After "Not today" on a quiet-tone day, does the ordinary prompt return? | No, absent for the local day (Q-FD-24 is the founder's) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A9 | The day slip and the ask draw the same card shape. Two shapes? | One C9 card shape, two variants; the ask differs only by its two stacked buttons and its call-out CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A10 | Maximum thumbnails shown in A-S17 per day row | Three, no "and more" count CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A11 | Limits of pictures and videos per letter and video length | 6 pictures, 2 videos, 60 seconds (direction 26 defaults; Q-PM-2) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
| Q-A12 | Order of media on Review | The order added; no reorder control in the first build CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order) |
