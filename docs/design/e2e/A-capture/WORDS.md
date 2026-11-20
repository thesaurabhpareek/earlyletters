# Area A. Capture: every word (CONTENT DESIGN LEAD)

Status: draft, re-keyed to DESIGN.md's screen and state ids on 20 Nov 2026. Owner: `content`. Every new or changed line is PROPOSED: the founder approves words before any build outside his family shows them (BRIEF section 2). Nothing here was run on a phone. Docs only; no string in `packages/content` was changed by this file.

Sources read this session: `BRIEF.md`; `DESIGN.md` in this folder (sections 1 to 7 as of 20 Nov, 05:30); cards `00-product-frame.md` (sections 4 to 7), `09-capture.md` (NS-14 to NS-20), `01-photo-with-a-letter.md`, `08-keeping-and-trust.md` (NS-09), `06-firsts-sealed-letter-quick-capture.md` (Part C), `04-hands-free-capture-spike.md`, `11-foundations.md` (NS-35), `16-council-review-round-2.md`, `14-test-plan.md` (journeys); `docs/BACKLOG.md` rows BL-925, BL-926, BL-965 and the BL-922 to BL-987 titles; `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`; `packages/content/src/strings.en.ts` (app, common, tabs, tonight, listen, write, notMuch, review, book, children, errors, trust), `features/language.en.ts`, `features/words.en.ts`, `features/billing.en.ts` (keepGate, membership); `photos.en.ts` as it stands on branch `feat/mobile-photo-4c-letter-page` (PR #839, read through the REST API; not on `develop`); `docs/design/specs/05-HANDS-FREE-CAPTURE-STATES-11nov.md` and `06-HOME-BOOK-ME-IA-11nov.md` (word slots only); which keys `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/review.tsx`, `app/write.tsx`, `components/child/child-switcher.tsx`, `components/tonight/*` and `lib/nav/tab-jobs.ts` read.

## 0. How to read this file

**Ids.** Screens and states are DESIGN.md's (`A-S01` to `A-S15`, `A-Snn.<state>`). Surfaces other areas draw are named by the ids DESIGN.md gives them (B-S08 letter page signature, B-S09 letter page date sheet, C-S18 Storage row, E-S10 Keep gate, E-S17 low-storage line, E-S22 App lock cover, D-S11 typed-day line) and handed off in section 15.

**Status column.**

| Mark | Meaning |
|---|---|
| E | Exists on `develop`; reuse as is |
| EP | Exists in `photosCopy` on PR #839 (itself marked PROPOSED there, needs word approval) |
| P | PROPOSED new key |
| C | PROPOSED change to an existing key (old words given) |
| R | PROPOSED retirement (delete in the PR that switches the screen) |

**Columns.** Key (path as the rules test sees it: `en.` is implied for `strings.en.ts`; `features.<file>.` for feature files); Text; Shows on (state ids); VoiceOver (label, then hint after a slash; "same" means the visible text is the label); Voice Control (the visible label; where the VoiceOver label differs, the input labels to set); Card row.

**Placeholders.** Only names the rules test allows: `{child}`, `{signsAs}`, `{date}`, `{a}`, `{b}`, `{month}`, `{label}`, `{percent}`, `{app}`, `{n}`, `{count}`. Some existing keys contain the separator dot (a non-ASCII character); this file names those by key and writes "(separator dot)" instead of copying the character, to stay ASCII.

## 1. Home (A-S01) and the capture cluster

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tabs.tonight` | E | "Home" | tab bar, every state | "Home, tab, 1 of 3" (system) | "Home" | frame 4 |
| `tonight.greeting.*` | E | "Good evening, {name}." and the six other dayparts | A-S01.default and every state | heading level 1 | n/a | frame 4 |
| `tonight.promptLabel` | E | "A thought to start with" | hint of the prompt, never shown | hint | n/a | NS-35 |
| `tonight.newPromptButton` | E | "Another thought" | A-S01.default | same | "Another thought" | NS-35 |
| `tonight.speakButton` | E | "Speak" | A-S01.default, A-S04.readyPhoto | same / `tonight.speakHintA11y` | "Speak" | NS-35-R1, R7 |
| `tonight.speakHintA11y` | P | "Starts recording a letter to {child}." | hint only | hint | n/a | NS-35 VoiceOver row (Speak and Type are the only start labels) |
| `tonight.typeButton` | E | "Type" | A-S01.default, A-S04.readyPhoto | same / `tonight.typeHintA11y` | "Type" | NS-35 |
| `tonight.typeHintA11y` | P | "Opens a page to type a letter to {child}." | hint only | hint | n/a | NS-35 |
| `features.photos.capture.startButton` | EP | "Start from a photo" | A-S01.default when the flag is on and the picker is registered; absent in A-S01.photoOff | same / `features.photos.a11y.startHint` | "Start from a photo" | NS-01-R1, R19, R59 |
| `features.photos.a11y.startHint` | EP | "Opens your photos so you can pick one and then tell {child} about it." | hint only | hint | n/a | NS-01-R20b |
| `tonight.notMuchButton` | E | "Not much today" | A-S01.default | same / `notMuch.confirmBody` | "Not much today" | NS-07 C5 |
| `notMuch.confirmBody` | E | "Marks today without writing anything." | hint only | hint | n/a | NS-07 C5-1 |
| `notMuch.savedToast` | E | "A quiet day, kept." | A-S01.quietKept (in place of the link, with Undo) | announced | n/a | NS-07 C5 |
| `common.undoButton` | E | "Undo" | A-S01.quietKept | same | "Undo" | NS-07 C5-6 |

Whose book (NS-14), above the dateline, only with two or more visible books:

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `children.switcher.label` | E | "For {child}" | A-S01.twoBooks | `children.switcher.homeA11y` / `children.switcher.hint` | "For {child}" (input labels set to the visible text, because the VoiceOver label is longer) | NS-14-R1 |
| `children.switcher.homeA11y` | P | "For {child}. New letters go to {child}'s book." | label only | label | n/a | NS-14 VoiceOver row (intent "Letters go to {child}'s book"); DESIGN G-04 |
| `children.switcher.hint` | E | "Switch to another child's book" | hint only | hint | n/a | NS-14 (DESIGN's intent "Changes whose book" is covered by the built hint) |
| `children.switcher.labelBorn` | P | "For your child, born {date}" | A-S01.twoBooksNameless (no name; birthday known) | same | same as visible | NS-14-R7 |
| `children.switcher.labelDue` | P | "For your child, due {date}" | A-S01.twoBooksNameless (due date only) | same | same as visible | NS-14-R7 |

`{date}` is `Intl.DateTimeFormat`, no ordinal day (NS-15 localisation row). One nameless book alone keeps the built fallback (`onboarding.childFallback`, "your child"). Never "Child 2" (NS-14 section 5).

Waiting cards (A-S01.waiting, A-S01.heldMany; frame 4 slip 1, as built):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tonight.draft.held` | E | "Waiting to be kept." | A-S01.waiting (held), A-S13.held | read with the card | n/a | frame 4 slip 1 |
| `tonight.draft.heldMany` | E | "Letters waiting to be kept." | A-S01.heldMany | same | n/a | F14-REQ-041 |
| `tonight.draft.heldShowButton` / `heldHideButton` | E | "Show them" / "Hide them" | A-S01.heldMany | same | same | F14-REQ-041 |
| `tonight.draft.swept` | E | "Recorded before the app closed." | A-S01.waiting (swept) | same | n/a | NS-04 Q12, NS-06-C9 |
| `tonight.draftWaiting.title` | E | "A recording is ready to read back." | A-S01.waiting (ready, words not shown yet) | same | n/a | frame 4 |
| `tonight.draft.typedA11y` | E | "A letter you started, {date}." | label of a typed waiting card | label | n/a | frame 4 |
| `tonight.draft.pickUpButton` / `openButton` / `keepButton` | E | "Pick it up" / "Open" / "Keep it" | A-S01.waiting | same | same | frame 4, NS-35 (a resume, not a start) |
| `features.photos.capture.thumbA11y` | P | "The photo you picked" | the 40 pt thumbnail on a picture draft's card (DESIGN G-19) | label (image) | n/a | NS-01 |

A day the parent typed (A-S01.typedDay; D-S11 draws it; the notification is area D's):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tonight.typedDay.kicker` | P | "For today" | A-S01.typedDay, above the parent's own words, above the prompt | read with the words | n/a | NS-18 happy path 3 |
| `tonight.typedDay.a11y` | P | "For today: {label}" | label of the line; `{label}` is the parent's typed words, unchanged | label | n/a | NS-18-R1 |

The parent's words show exactly as typed, in the app's small voice, never completed or suggested (NS-18 Never). Where the line sits against the slip rule: card gap W9.

A-S01.fromReminder, .beforeYou, .plusLine, .offline, .killSwitch, .planLapse, .signedOut, .secondAccount have no words of their own beyond the built keys (the Plus line is area E's). A-S01.lowStorage: the line is E-S17's; `content` offers `listen.lowSpace` (section 4) as its text.

## 2. Whose book sheet (A-S02)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `children.switcher.title` | E | "Whose book?" | A-S02.default, .many | sheet title, radio group label | n/a | NS-14 |
| `book.title` | E | "{child}'s book" | each row | "{child}'s book, Month 7, selected" (radio) | "{child}'s book" | NS-14 |
| `book.chapterTitle` / `chapterNewborn` / `beforeYouChapter` | E | "Month {month}" / "The first weeks" / "Before You" | row description | read after the name | n/a | NS-14 expecting row |
| `children.switcher.rowBorn` | P | "Your child's book, born {date}" | A-S02.nameless | same | same | NS-14-R7 |
| `children.switcher.rowDue` | P | "Your child's book, due {date}" | A-S02.nameless (due date only) | same | same | NS-14-R7 |
| `children.switcher.addButton` | E | "Add a child" | A-S02.default | same | "Add a child" | NS-14 ("Add a book" is DESIGN's intent; the built words stand) |
| `common.closeButton` | E | "Close" | A-S02 all | same | "Close" | NS-14 |

A-S02.hiddenExcluded: the book is absent and no line says so (NS-14-R9). No string counts books.

## 3. Apple's picker and our states around it (A-S03)

We add no line above Apple's picker until counsel clears the NX-33 label line (NS-01 section 12). A-S03.cancel writes nothing and shows nothing (NS-01-R4). A-S03.appLockDrop shows only the lock cover (E-S22); after unlock the parent is on Ready with no picture, which is true and needs no words (NS-01-R47).

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.photos.capture.iCloudProgress` | P | "Getting the photo from iCloud" | A-S03.downloading | `features.photos.capture.iCloudProgressA11y`, with the system progress trait | n/a | NS-01-R17b |
| `features.photos.capture.iCloudProgressA11y` | P | "Getting the photo from iCloud, {percent}%" | label only | label | n/a | NS-01-R17b |
| `common.cancelButton` | E | "Cancel" | A-S03.downloading | same | "Cancel" | NS-01-R17b |

## 4. Listen at Ready, the primer and the start problems (A-S04)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `listen.toChild` | E | "To {child}" | A-S04 all, A-S05 all | heading | n/a | NS-14-R8 (the book is fixed during a take) |
| `listen.audience` | E | "Only you, until you add it to the book." | A-S04 all, A-S05 all | same | n/a | as built |
| `tonight.states.ready` | E | "Ready when you are." | A-S04.ready, A-S04.doorway | announced on arrival | n/a | NS-06 C6 VoiceOver row |
| `tonight.states.readyHint` | E | "Tap and talk. Pauses are fine." | A-S04.ready | same | n/a | HF-R4 |
| `listen.ready.hint` | E | "Tap the red circle and talk." | A-S04.ready, A-S04.doorway | same | n/a | BRAND glossary (record control) |
| `listen.ready.startA11y` | E | "Start recording" | the red circle (no visible text) | label | input labels `listen.ready.startInputLabels` | NS-06-C1, NS-33 |
| `listen.ready.startInputLabels` | P | ["Start recording", "Red circle", "Record"] | Voice Control only | n/a | any of the three | NS-33 (Voice Control), spec 05 section 9 |
| `features.photos.capture.thumbA11y` | P | "The photo you picked" | A-S04.readyPhoto, the thumbnail | label (image) | n/a | NS-01-R20b (order: thumbnail, prompt, Speak, Type, Change photo) |
| `features.photos.capture.change` | C | "Change photo" Was: "Change" | A-S04.readyPhoto, A-S06.withPhoto, under the thumbnail | same | "Change photo" | NS-01-R20b, R20e; gap W2 |
| `common.closeButton` | E | "Close" | A-S04 all (a back-out writes nothing) | same | "Close" | NS-01-R4 |
| `features.photos.capture.openFailed` | C | "That photo could not be opened. You can choose another, or go on without one." Was: "That photo could not be opened. Choose another." | A-S04.photoCouldNotOpen, in the thumbnail slot | announced once | n/a | NS-01 section 15 (#838 state); A-U15 |
| `features.photos.capture.chooseAnotherButton` | P | "Choose another" | A-S04.photoCouldNotOpen, A-S04.iCloudOffline | same | "Choose another" | DESIGN A-S04 photo failure states |
| `features.photos.capture.iCloudOffline` | P | "This photo is in iCloud and needs a connection. You can go on without it." | A-S04.iCloudOffline, in the thumbnail slot | announced once | n/a | NS-01-R46; A-U16 |
| `listen.lowSpace` | P | "This phone is low on space. If it fills up, the recording stops and what you said so far is kept." | E-S17 (A-S01.lowStorage), offered to area E | announced once | n/a | 06-nfr 11.3; NS-01 low-storage row; A-U61 |

The colour question from spec 05 section 9: the record control is named by colour and shape ("the red circle", the glossary name), so colour is not the only signal and the hint stays. The VoiceOver label carries no colour, and recording state is also said in words ("Listening.", "Paused.").

Primer and problems (existing):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `listen.primer.title` / `body` / `continueButton` | E | "Your phone will ask about the microphone" / "{app} uses it to hear the letters you speak to {child}. It listens only while you record." / "Continue" | A-S04.primer | same | "Continue" | SR-C-05 |
| `errors.micDenied.title` / `body` | E | "The microphone is off" / "Turn it on in Settings, or type this one." | A-S04.denied (`mic_denied`) | same | n/a | HF-R8; A-U05 |
| `errors.micDenied.typeButton` / `settingsButton` | E | "Type instead" / "Open Settings" | A-S04.primer, .denied, .busy, .full | same | same | HF-R8 |
| `errors.micBusy.title` / `body` | E | "The microphone is in use" / "A call or another app has it right now." | A-S04.busy | same | n/a | H13; A-U06 |
| `errors.phoneFull.title` / `body` | E | "This phone is full" / "Free some space to record, or type this one." | A-S04.full (`storage_low`, under 50 MB) | same | n/a | 06-nfr 11.3; A-U07 |
| `common.tryAgainButton` | E | "Try again" | A-S04.busy, A-S04.full | same | "Try again" | as built |

## 5. Listen while recording (A-S05)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tonight.states.listening` / `listeningHint` | E | "Listening." / "Say it however it comes." | A-S05.recording, .withPhoto | announced once | n/a | NS-33 colour row |
| `tonight.states.stillHere` | E | "Still here. Take your time." | A-S05.stillHere (8 s quiet; never stops on silence) | announced once | n/a | HF-R4 |
| `common.pauseButton` / `tonight.states.resumeButton` | E | "Pause" / "Keep talking" | A-S05.recording / A-S05.paused | `listen.toggleA11y` | "Pause" / "Keep talking" (input labels follow the visible word) | F04-REQ-041 |
| `listen.toggleA11y` | E | "Pause or keep talking" | label of the toggle | label | n/a | F04-REQ-041 |
| `tonight.states.paused` | E | "Paused." | A-S05.paused | announced | n/a | H5 |
| `tonight.states.stopButton` | E | "Finish" | A-S05.recording, .paused | same | "Finish" | H10 |
| `listen.elapsedA11y` | E | "{minutes} min {seconds} s recorded" | the clock | label | n/a | as built |
| `listen.discardButton` | E | "Let it go" | A-S05.recording, .paused; A-S07 end of scroll | same | "Let it go" | NS-09 |
| `features.photos.capture.thumbA11y` | P | "The photo you picked" | A-S05.withPhoto, the 56 pt thumbnail (DESIGN G-14) | label (image) | n/a | NS-01 |
| `tonight.states.saving` | E | "Saving your words." | A-S05.finishing | announced | n/a | H10 |
| `tonight.states.transcribing`, `features.words.preparing` | E | "Writing down what you said." | A-S07.writing | announced | n/a | H11; ruling 1 in section 12 |
| `features.words.listening` / `listeningA11y` | E | "Writing down what you said. Part {n} of {count}." | A-S07.writing (long) | label form without the full stop | n/a | as built |
| `trust.firstRecording.title` / `body` / `dismissButton` | E | "Your voice stays here" / "Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models." / "Good to know" | once, the first recording | same | "Good to know" | VOICE privacy table |

The stop line when a recording ended early shows on Review (A-S07, item 3 of its layout) after A-S05.interrupted or .backgrounded:

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.words.pack.stoppedInterruption` | E | "The recording stopped for a call or an alert. Everything before that is kept." | A-S07 after A-S05.interrupted | announced | n/a | NS-06-C9; A-U08 |
| `features.words.pack.stoppedInBackground` | E | "The recording stopped when you left the app. Everything before that is kept." | A-S07 after A-S05.backgrounded | announced | n/a | NS-04 Q12; A-U09 |
| `features.words.pack.stoppedClosed` | E | "The recording stopped when the app closed. Everything before that is kept." | A-S07 after a relaunch | announced | n/a | NS-04 Q12 |
| `features.words.pack.stoppedNoSpace` | P | "The recording stopped when the phone ran out of space. Everything before that is kept." | A-S07 after a drop under 20 MB mid-recording (spec 05 H9, DESIGN G-20) | announced | n/a | 06-nfr 11.3 |

## 6. Write (A-S06)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `write.label` | E | "Your letter" | A-S06.default, .withPhoto | field label | "Your letter" | NS-35 |
| `tonight.typing.placeholder` | E | "Write it the way you would say it." | A-S06.default (empty) | field hint | n/a | as built |
| `write.autosaved` / `notSaved` | E | "Saved on this phone" / "Not saved yet" | A-S06.autosaved / A-S06.notSaved | announced on change | n/a | as built |
| `write.tooLong` | E | "This is a very long letter. Every word is kept. You can start another letter to say more." | A-S06.tooLong | announced once | n/a | BL-378 |
| `features.words.waiting.writeLabel` | E | "Words for this recording" | A-S06.forTake, field label | field label | "Words for this recording" | NS-17-R9 |
| `write.forRecording` | P | "Type the words of this recording. They are kept just as you type them." | A-S06.forTake, the line above the field | same | n/a | NS-17-R9 ("typed text is the parent's own and never machine-edited"); DESIGN A-S06 |
| `features.words.waiting.saveButton` | E | "Save words" | A-S06.forTake | same | "Save words" | NS-17-R9 |

Writing tools are off on both fields (D2; DESIGN G-16); no string says so.

## 7. Review (A-S07) and its sheets (A-S08 to A-S10)

### 7.1 Existing Review words, reused as is

`review.title` "Read it back"; `review.headerTo`, `headerToNewborn`, `headerToBefore` (each "To {child}", the separator dot, then the month; DESIGN G-01 splits the To and day lines, so the To line uses `listen.toChild`, and `review.toChildA11y` "To {child}. Change" when it is a control in A-S07.twoBooks); `review.playButton` "Hear it"; `review.view.fixes` "With small fixes", `review.view.exact` "Exactly as said", `review.view.a11y` "How this letter reads" (A-S07.exact); `review.changesLabel` "{count} small fixes", `changesLabelOne` "1 small fix"; `review.noChanges`, `noChangesAfterUndo`, `noChangesNoRules`; `review.cardYouSaid`, `cardNowReads`, `cardTakenOut`, `rowChange`, `undoEditButton` "Put it back", `putBackToast` "Put back."; `review.edits.*`; `review.editTextButton` "Change words" (A-S07.editing); `review.lock.*`; `review.firstNote.*`; `review.waitingLong`; `review.laterButton` "Read it back later" (A-S07.writing); `review.keepStillSaving`; `review.saveFailed` "That did not save. Your words are still here." (A-S07.saveFailed); `review.missingFile.title` (A-S07.fileMissing); `review.shortTake.*` (A-S07.shortTake); `review.emptyTake.*` (A-S07.emptyTake); `review.noDraft.*`; `review.voiceOnlyButton` "Keep the recording"; `review.waiting.*`; `review.destination.addButton` "Add to {child}'s book", `addButtonShort` "Add to the book", `privateButton` "Keep private"; `features.words.noSpeech.*` (A-S07.noWords); `features.words.pack.*` (A-S07.ask, .downloading); `features.words.unavailable.*` (A-S07.unsupported); `errors.transcriptionFailed` (A-S07.failed); `features.words.waiting.arrivedNote` (A-S07.laterWords).

### 7.2 The day this letter is about (NS-15; A-S07.default day line, A-S07.dateSet, A-S08)

DESIGN draws the day line itself as the control, with a calendar glyph (G-01, G-03). Words for it:

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `review.date.todayLine` | P | "Today, {date}" | A-S07.default, the day line before any change | `review.date.lineA11y` / `review.date.changeHintA11y` | the visible text, plus input label "Change the date" | NS-15-R1; DESIGN G-03 |
| `review.date.dayLine` | P | "{date}" | A-S07.dateSet, the chosen day (day precision) | as above | as above | NS-15-R1 |
| `book.dateline.monthOnly` / `monthOnlyNewborn` | E | "Sometime in Month {month}" / "Sometime in the first weeks" | A-S07.dateSet (month precision) | as above | as above | NS-15 section 5 |
| `book.beforeYouChapter` | E | "Before You" | added by the layout when the day files before birth | read with the day | n/a | NS-15 section 5 |
| `review.date.lineA11y` | P | "About {date}" | label of the day line (`{date}` is the whole visible line for month precision) | label | n/a | NS-15 VoiceOver row; DESIGN VoiceOver order |
| `review.date.changeHintA11y` | P | "Sets the day this letter is about. The day you said it stays the same." | hint only | hint | n/a | NS-15 VoiceOver row |
| `book.entryMenu.changeDate` | E | "Change the date" | the Voice Control input label of the day line; the letter page menu (B-S09) | n/a | "Change the date" | NS-15-R1 (one phrase for Review and the letter page) |
| `review.date.label` | E | "When was this?" | A-S08 all (sheet title) | heading | n/a | NS-15 |
| `review.date.dayTab` / `monthTab` / `tabsLabel` / `dayLabel` | E | "A day" / "A month" / "Day or month" / "Day" | A-S08.day, A-S08.month (month tab absent in A-S08.unborn) | as built | "A day" / "A month" | NS-15 section 5 |
| `common.saveButton` / `common.closeButton` | E | "Save" / "Close" | A-S08 all (Save off in A-S08.unchanged) | same | same | NS-15 happy path 3 |
| `review.date.filedA11y` | P | "This letter will go in {label}." | announced once on Review after Save when the month changes (A-S07.dateSet); `{label}` is "Month 2", "The first weeks" or "Before You" | announcement | n/a | NS-15-R12 |
| `review.date.notSaved` | P | "That date did not save. The letter keeps the day it had." | A-S07 and B-S09 when the local write does not finish | announced | n/a | NS-15 Failed row (as built: the generic line); gap W6 |
| `book.changeDate.movedToast` | E | "Moved to {label}." | letter page after a change (area B) | announced | n/a | NS-15-R12 |
| `book.dateline.aboutSaid` | P | "About {a}. Said on {b}." | letter page when the two days differ (area B); `{a}` the about-day, `{b}` the said-on day, both `Intl.DateTimeFormat` | same | n/a | NS-15-R3 |
| `book.dateline.aboutSaidMonth` | P | "Sometime in Month {month}. Said on {date}." | the same, month precision | same | n/a | NS-15-R3 |
| `book.dateline.aboutSaidNewborn` | P | "Sometime in the first weeks. Said on {date}." | the same, month precision in the first weeks | same | n/a | NS-15-R3 |

A-S08.bound (earliest day reached) and A-S08.interrupted need no words: the picker goes no further, and the pick waits until Save. No "backdated", no "late", no ordinal day (NS-15 content inputs). No line suggests the app reads a date from the words or a picture (NS-15-R4, R18).

### 7.3 Someone else speaks (NS-16; A-S07.fromSet, .fromOff, A-S09). Behind `EXPO_PUBLIC_SIGN_AS_OTHER`, off in production until counsel answers Q45, Q46, Q48, Q54

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `common.signature` | E | "From {signsAs}" | A-S07.default (a control when the flag is on), A-S07.fromSet, A-S07.fromOff (plain text) | "From {signsAs}" / `review.from.rowHintA11y` | "From {signsAs}" | NS-16-R1 ("From, {name}, button", intent) |
| `review.from.rowHintA11y` | P | "Changes the name this letter is signed with." | hint only (absent in A-S07.fromOff) | hint | n/a | NS-16 VoiceOver row |
| `review.from.sheetTitle` | P | "Who is this letter from?" | A-S09 all | heading | n/a | NS-16; DESIGN intent "Who is speaking?" (gap W13) |
| `review.from.fieldLabel` | P | "From" | A-S09.empty, .recent, .typing | field label | "From" | NS-16-R1; DESIGN A-S09 item 1 |
| `review.from.fieldHint` | P | "Up to 30 characters. Some scripts count more characters than you see." | A-S09 all, under the field | field hint | n/a | NS-16 localisation line; DESIGN G-21 |
| `review.from.ask` | P | "Ask before you record someone else." | A-S09 all, one muted line under the field; no checkbox | same | n/a | NS-16-R18, D9 |
| `review.from.recentTitle` | P | "Names used on this phone" | A-S09.recent (absent in A-S09.empty) | list heading | n/a | NS-16 section 5 |
| `review.from.useMineButton` | P | "Use my name" | A-S09.typing, .recent | same | "Use my name" | NS-16 Decline; DESIGN's "Sign as Mama" (gap W13) |
| `common.doneButton` | E | "Done" | A-S09 all (off in A-S09.tooLong) | same | "Done" | NS-16 |
| `review.from.tooLong` | P | "That name is longer than 30 characters. A shorter one will fit." | A-S09.tooLong (`sign_as_too_long`) | announced | n/a | NS-16-R6 |

B-S08 (A-S09.afterKeep) shows "From Nani" as plain text (NS-16-R17). No line on this path says "invite", "family can add letters", "speaker", or asks a child or sibling to speak (NS-16-R5).

### 7.4 Another language (NS-17; A-S07.anotherLanguageOffer, A-S10)

DESIGN picks one tap with an Undo for the T4 window (G-07); `content` agrees.

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `review.otherLanguage.markLink` | P | "This was in another language" | A-S07.anotherLanguageOffer, A-S10.offer (a quiet text link, so the 22-character button rule does not bind) | same / `review.otherLanguage.markHintA11y` | "This was in another language" | NS-17-R5 |
| `review.otherLanguage.markHintA11y` | P | "Sets these words aside for good. The recording stays with this letter." | hint only | hint | n/a | NS-17 VoiceOver row ("reads its consequence") |
| `review.otherLanguage.setAsideToast` | P | "Words set aside." | A-S10.withheldUndo, with `common.undoButton` for the T4 window | announced, then "Undo, button" | "Undo" | NS-17-R5; DESIGN G-07 |
| `review.otherLanguage.waiting` | P | "The words for this recording are waiting. You can type them yourself." | A-S10.withheld, A-S10.keptWaiting, in every build | same | n/a | NS-17 happy path 3; gap W11 (replaces the coming-soon line here) |
| `review.otherLanguage.typeButton` | P | "Type the words" | A-S10.withheld (primary), opens A-S06.forTake | same | "Type the words" | NS-17-R9 (intent "Type the words yourself", 23 characters, over the button budget) |
| `review.voiceOnlyButton` | E | "Keep the recording" | A-S10.withheld (quiet) | same | "Keep the recording" | D-103 |
| `features.words.waiting.writeButton` | E | "Write the words" | the letter page for a kept letter still waiting (area B) | same | same | NS-17-R9 |
| `features.language.waitingForLanguage` | E | "This recording is waiting for its language. Other languages are coming in a later update." | A-S07.language and A-S10.heldLanguage (a language the author chose and the build holds), as built | same | n/a | NS-17-R10; gap W11 |
| `review.partUnwritten` | P | "Part of this recording has no words written here. Play it to hear all of it." | A-S07.default when a stretch could not be written (and the letter page) | same | n/a | NS-17 section 5 (mixed-language stretch) |

If the founder prefers a confirm to the Undo (W8), these are ready: `review.otherLanguage.confirmTitle` (P) "Set these words aside?"; `confirmBody` (P) "They will not be shown again or added to the book. Your recording stays with this letter, and you can type the words yourself."; `confirmButton` (P) "Set the words aside"; `cancelButton` (P) "Leave as it is" (the safe default).

Never on this path: "translate", "detect", "mixed", "broken", or a promise of when a language arrives (NS-17 content inputs, VOICE multilingual rule).

### 7.5 A picture on Review (NS-01; A-S07.withPhoto, .photoNeedsWords, .photoNotStored, .photoUndo)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.photos.book.photos.a11yCard` | EP | "Photo with this letter" | the picture's label when the parent typed no words about it | label | n/a | NS-01-R9a, R21c |
| `features.photos.text.label` / `optional` / `hint` | EP | "Words about this photo" / "Optional" / "Up to 140 characters. Only what you type is kept." | A-S07.withPhoto | field label, hint | "Words about this photo" | NS-01-R21a, R21b (DESIGN's card intent "A few words about this picture, if you like" yields to the built words) |
| `features.photos.text.placeLabel` / `placeHint` | EP | "Where was this?" / "Up to 60 characters. Only what you type is kept." | A-S07.withPhoto | field label, hint | "Where was this?" | NS-01-R21a |
| `features.photos.text.atLimit` | P | "That is as much as fits here." | A-S07.withPhoto when a field reaches its cap (graphemes) | announced once | n/a | NS-01-R54 |
| `features.photos.review.addButton` | P | "Add a photo" | A-S07.default when no picture and the flag is on; A-S07.photoNotStored | same | "Add a photo" | NS-01 section 3 (add on Review) |
| `features.photos.book.letter.changePhoto` | EP | "Change photo" | A-S07.withPhoto | same | "Change photo" | NS-01-R7 |
| `features.photos.book.letter.removePhoto` | EP | "Take the photo off" | A-S07.withPhoto | same | "Take the photo off" | NS-01-R38a |
| `features.photos.review.needsWords` | P | "Keep is ready once this letter has words." | A-S07.photoNeedsWords, beside the dimmed Keep | Keep reads "dimmed" with this line as its hint | n/a | NS-01-R5a (`needs_words`); DESIGN intent "A letter needs words. Speak or type a few." |
| `features.photos.review.notStored` | P | "That photo did not come along. You can add it again." | A-S07.photoNotStored, where the picture card was, with "Add a photo" | announced once | n/a | NS-01-R17a, R58; DESIGN G-08 |

## 8. Let it go (NS-09; A-S11, A-S07.notRemoved)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `listen.discardButton` | E | "Let it go" | A-S05, A-S07 (end of scroll, DESIGN G-09) | same | "Let it go" | NS-09 |
| `listen.discardTitle` | E | "Let this recording go?" | A-S11.confirm, .confirmListen, .confirmPhoto | alert title | n/a | NS-09-R9 |
| `listen.discardBody` | C | "It will be removed from the phone, and it cannot be brought back." Was: "It will be removed from this phone." ("from this phone" matches the P0 `ON_DEVICE_ONLY` pattern once the key is touched) | A-S11.confirm, A-S11.confirmListen | read with the title | n/a | NS-09-R9 ("says the take cannot be brought back") |
| `listen.discardBodyPhoto` | P | "The recording and its photo will be removed from the phone, and they cannot be brought back." | A-S11.confirmPhoto | read with the title | n/a | NS-09-R9, NS-01-R16c |
| `listen.keepButton` | E | "Keep it" | A-S11 all (cancel style, the default) | same | "Keep it" | NS-09-R9 (default keep) |
| `listen.discardConfirm` | E | "Remove it" | A-S11 all | same | "Remove it" | NS-09 |
| `review.notRemoved` | P | "This recording is not removed yet. {app} tries again each time it opens." | A-S11.notRemoved (A-S07.notRemoved), once per recording per Review visit; muted, no icon, no red; never blocks leaving | announced after the screen settles | n/a | NS-09-R4a, R4b; BL-925, BL-926 |
| `common.doneButton` | E | "Done" | A-S11.notRemoved | same | "Done" | DESIGN A-S11 |
| `settingsHome.letGoStuck` | P | "A recording you let go is still on this phone." | C-S18 (A-S11.storageStuck), one row per stuck recording after 3 launches | same | n/a | NS-09-R6; gap W4 |
| `settingsHome.removeNowButton` | P | "Remove now" | the same row | same / `settingsHome.removeNowHintA11y` | "Remove now" | NS-09-R6 |
| `settingsHome.removeNowHintA11y` | P | "Tries again to remove this recording." | hint only | hint | n/a | NS-09-R6 |

When Remove now does not finish, the row stays with the same words and no error word (NS-09 section 5). A let-go that finishes shows nothing: the parent returns to where they were. DESIGN's intent line "We will finish removing it." is not used: it carries "we", which the P0 rule allows only inside the sanctioned promises. Banned on this path: "failed", "error", "deleted everywhere", "instantly".

## 9. Replace and take off a picture (NS-01; A-S12)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.photos.book.letter.replacePhotoAsk.question` | EP | "Use this photo instead?" | A-S12.confirm (sheet title) | heading | n/a | NS-01-R7 |
| `...replacePhotoAsk.body` | EP | "The first photo stays until you choose." | A-S12.confirm | read after the title | n/a | NS-01-R7 |
| `...replacePhotoAsk.currentA11y` | P | "The photo with this letter now" | A-S12.confirm, the first picture | label (image) | n/a | DESIGN A-S12 VoiceOver order |
| `...replacePhotoAsk.newA11y` | P | "The photo you just picked" | A-S12.confirm, the new picture | label (image) | n/a | DESIGN A-S12 VoiceOver order |
| `...replacePhotoAsk.keep` / `confirm` | EP | "Keep the first" (default, first) / "Use this photo" | A-S12.confirm | same | same | NS-01-R7 (DESIGN's intents "Keep the first one" and "Use this one" yield to the built words) |
| `features.photos.book.letter.replacePhotoUndo` | EP | "Photo changed." | A-S12.undo, .undoVo, .undoSwitch | announced, then "Undo, button" | n/a | NS-01-R38a |
| `features.photos.book.letter.removed` | EP | "Photo taken off." | A-S12.undo, .undoVo, .undoSwitch | announced, then "Undo, button" | n/a | NS-01-R38a |
| `features.photos.book.letter.undo` | EP | "Undo" | A-S12.undo, .undoVo, .undoSwitch | same | "Undo" | NS-01-R38a to R38c |

A-S12.closed has no words: the Undo control leaves in the same moment the window closes (NS-01-R38b). The PR comments say "Undo for 10 seconds"; the words name no time, which stays right under T4.

## 10. After Keep (A-S13)

Existing; the Keep gate sheet (E-S10) is area E's.

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `review.destination.filedChip` / `filedChipNewborn` / `filedChipBefore` | E | "Kept in Month {month}" / "Kept in the first weeks" / "Kept in Before You" | A-S13.saved, .savedPhoto | announced | n/a | NS-14-R3, NS-15-R2 |
| `review.destination.addedToast` / `privateToast` / `voiceOnlyToast` | E | "Added to {child}'s book." / "Kept just for you." / "Recording kept on this phone." | A-S13.saved, .savedPrivate, .voiceOnly | announced | n/a | as built |
| `book.waitingForWords` | E | "A recording, waiting for its words." | A-S13.voiceOnly, A-S10.keptWaiting in the Book | same | n/a | D-103 |
| `features.billing.keepGate.heldNote` and the rest of `keepGate` | E | (area E) | A-S13.held, A-S13.gate | area E | area E | D-082 |

## 11. Doorways (A-S14) and hands-free (A-S15)

Only where NS-04 passed and `EXPO_PUBLIC_QUICK_CAPTURE` is on (NS-06 Part C). Static: no child name, no letter words, no count (NS-06-C2).

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `doorways.startLabel` | P | "Start a letter" | A-S14.widget, .control, .actionButton (App Shortcut title) | read by iOS | "Start a letter" | NS-06 C16 |
| `doorways.siriPhrase` | P | "Start a letter in {app}" | A-S14.siri (App Shortcut phrase; iOS fills the app name token) | n/a | n/a | NS-06 C16 |
| `doorways.widgetA11y` | P | "Start a letter. Opens {app}, ready when you are." | the widget's label | label | n/a | NS-06-C2 |
| `doorways.widgetDescription` | P | "Opens {app} ready to record. Nothing records until you tap." | the iOS widget and control galleries | read by iOS | n/a | NS-35-R7, NS-04 EX-2 |
| `quickNote.widgetLabel` | R | "Quick note for {child}" | none | n/a | n/a | conflicts with NS-06-C2 (a child name on a widget); gap W10 |
| `quickNote.lockScreenLabel` | R | "Note for {child}" | none | n/a | n/a | conflicts with NS-06-C2 |

A-S14.locked and .appLock are the system unlock and E-S22; A-S14.firstRun opens first run; A-S14.noBook opens Home's empty state; A-S14.activeTake leaves the current recording as it is; A-S14.failed opens Home; A-S14.notOffered and .flagOff register nothing. None has a line of its own, and nothing in the app mentions a doorway that did not ship. Banned on doorway strings: "while driving", "hands-free", "always listening", "voice-activated", any count, and "nothing leaves your phone" next to Siri (Siri sends the spoken phrase to Apple).

A-S15 hypotheses: if NS-04 Q6 picks a spoken cue, it reuses the existing state lines ("Listening.", "Paused.", "Saved, in your words.") and adds no words. No hands-free string ships before NS-04b.

Add more to this letter (NS-19) is not taken up: no strings, no "Continue" on Home, no "add audio" on the letter page (NS-19-R1, section 15).

## 12. Rulings `content` makes here (for the founder to confirm)

1. **"Writing down what you said."** (`tonight.states.transcribing`, `features.words.preparing`). Spec 05 asked whether it reads as a machine writing. It stays: it says the parent's own words are being written down, and never that the app wrote or shaped a letter. It is the plainest true line for transcription.
2. **One name for one action.** Review's day line takes "Change the date" as its Voice Control name, the letter page's phrase. "Type the words" stands in for the card's "Type the words yourself", which is 23 characters and over the button budget.
3. **"About {a}. Said on {b}."** follows the card's intent. Risk: "About" can read as "roughly". If the founder hears it that way, the alternative is "This letter is about {a}. Said on {b}."
4. **"Names used on this phone"** says where the list lives without the on-device-only wording the P0 rule blocks.
5. **Built words beat intents.** Where DESIGN.md quotes a card's intent and the open photo PR already has words up for approval ("Words about this photo", "Where was this?", "Keep the first", "Use this photo"), the built words stand, so the code and the prototype say one thing.

## 13. Every error and failure the area's cards name

What happened, then what the parent can do. No code reaches the screen, a log line with a path, name or hash, or a VoiceOver string.

| Code or outcome | Card | State | Key | What the parent reads |
|---|---|---|---|---|
| `photo_pick_failed`; pick outcome `failed`; `picked_file_outside_picker_folder`, `photo_temp_name_refused` | NS-01 | A-S03.failed, then A-S04.photoCouldNotOpen | `features.photos.capture.openFailed` (C), `chooseAnotherButton` (P) | "That photo could not be opened. You can choose another, or go on without one." |
| pick outcome `cancelled` | NS-01-R4 | A-S03.cancel | none | Nothing: back where they were |
| iCloud picture offline (no code in the stack; the CTO pass's `photo_icloud_unavailable` is not the code's name) | NS-01-R46 | A-S03.iCloudOffline, then A-S04.iCloudOffline | `features.photos.capture.iCloudOffline` (P) | "This photo is in iCloud and needs a connection. You can go on without it." |
| pick dropped under App lock | NS-01-R47 | A-S03.appLockDrop | none | Nothing (Ready with no picture after unlock) |
| `photo_reencode_failed`, `photo_bake_timeout`, `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `no_space`, commit `failed`, `photo_path_refused`, `baked_file_outside_folder`, `photos_folder_unknown` | NS-01-R17a, R34, R45, R58 | A-S07.photoNotStored; the letter page in that session | `features.photos.review.notStored` (P); `features.photos.book.letter.notSaved` (EP) | "That photo did not come along. You can add it again." / "The photo did not come along with this letter. Your words are kept, and you can add it again." |
| commit `needs_words` | NS-01-R5a | A-S07.photoNeedsWords | `features.photos.review.needsWords` (P) | "Keep is ready once this letter has words." |
| stored file missing | NS-01-R56 | letter page (area B) | `features.photos.book.letter.missing`, `missingRemove` (EP) | "Not on this phone any more" with "Remove" for the author |
| `SCPHO` (server refusal) | NS-01-R61 | none | none | Never reachable from a correct client; shows nothing |
| `sign_as_too_long` (PROPOSED code) | NS-16-R6 | A-S09.tooLong | `review.from.tooLong` (P) | "That name is longer than 30 characters. A shorter one will fit." |
| let-go file delete did not finish | NS-09-R4a | A-S11.notRemoved | `review.notRemoved` (P) | "This recording is not removed yet. {app} tries again each time it opens." |
| still there after 3 launches; Remove now did not finish | NS-09-R6 | A-S11.storageStuck (C-S18) | `settingsHome.letGoStuck`, `removeNowButton` (P) | "A recording you let go is still on this phone." with "Remove now" |
| about-day local write did not finish | NS-15 Failed row | A-S07, B-S09 | `review.date.notSaved` (P), replacing `errors.generic` there | "That date did not save. The letter keeps the day it had." |
| `mic_denied` | capture (H12) | A-S04.denied | `errors.micDenied` (E) | "The microphone is off" / "Turn it on in Settings, or type this one." |
| microphone busy (no code; DESIGN E-09) | capture (H13) | A-S04.busy | `errors.micBusy` (E) | "The microphone is in use" / "A call or another app has it right now." |
| `storage_low` (under 50 MB) | 06-nfr 11.3 | A-S04.full | `errors.phoneFull` (E) | "This phone is full" / "Free some space to record, or type this one." |
| recording stopped early (call, alert, background, closed, space) | NS-04 Q12, NS-06-C9, 06-nfr 11.3 | A-S07 stop line | `features.words.pack.stopped*` (E), `stoppedNoSpace` (P) | "The recording stopped ... Everything before that is kept." |
| no words from the recording | capture | A-S07.noWords | `features.words.noSpeech.*` (E) | "No words in this one" / "The recording is kept just as it is." |
| transcription did not finish | capture | A-S07.failed | `errors.transcriptionFailed` (E) | "No words yet for this one" / "The recording is kept." |
| save to the book did not finish | capture | A-S07.saveFailed | `review.saveFailed` (E) | "That did not save. Your words are still here." |
| file missing; nothing recorded; very short | capture | A-S07.fileMissing, .emptyTake, .shortTake | `review.missingFile`, `emptyTake`, `shortTake` (E) | As built |
| Keep tapped while still saving | capture | A-S07 | `review.keepStillSaving` (E) | As built |
| Review opened with nothing to read | capture | A-S07 | `review.noDraft` (E) | "Nothing to read back here" / "Go to the book" |
| doorway did not open Ready | NS-06 C6 | A-S14.failed | none | Opens Home; no line names the doorway |

NS-14, NS-19, NS-35 and NS-04 name no error codes; NS-17 adds none beyond the built transcription path.

## 14. Notifications and empty states

**Notifications.** Area A sends none. Doorways show no child name, letter words or count on the Lock Screen, Control Center or a widget (NS-06-C2). Typed-day and reminder notifications are area D's; Home shows the parent's typed words only after the tap (section 1).

**Empty states.**
- Home always has a prompt; there is no empty Home line. With no book (A-S01.empty), first run is area E's.
- A-S09.empty: no names heading, no "No names yet".
- No waiting cards: nothing shows; no "all caught up", no count.
- A-S02 with a book that has no letters: its row shows the name and its month line only.

## 15. State ids and hand-offs (reconciliation)

Every state named in this file is a DESIGN.md state. Keys offered to other areas rather than drawn here: `listen.lowSpace` (E-S17's line); `settingsHome.letGoStuck`, `removeNowButton`, `removeNowHintA11y` (C-S18). Area B draws `book.dateline.aboutSaid*`, `review.date.notSaved` on B-S09, `review.partUnwritten` on the letter page, and the read-only From on B-S08. MOTION.md's state names that differ from DESIGN.md's (`A-S04.withPicture`, `.photoFailed`, `.photoOffline`, `.fromDoorway`; `A-S07.keepDisabled`, `.wordsWaiting`, `.withPicture`, `.stoppedBy`) map to DESIGN's `A-S04.readyPhoto`, `.photoCouldNotOpen`, `.iCloudOffline`, `.doorway` and `A-S07.photoNeedsWords`, `.writing`, `.withPhoto` and the stop line; the words follow DESIGN's names.

## 16. Rules check

Run 20 Nov over the P and C strings in this file: a throwaway script outside the repo read the Text column of every P and C row and applied the patterns of `rules.test.ts` plus the cards' banned lists. The fallback confirm strings in section 7.4 were checked by hand against the same list.

| Rule | Result |
|---|---|
| ASCII only in the whole file; no em or en dash, curly quote, ellipsis character, emoji | Pass |
| Fear, guilt, loss words (`FEAR`); "failed", "error", "deleted everywhere", "instantly" on NS-09 lines | Pass |
| AI-writing words (`AI`); rewrite only as a "never" | Pass |
| Gendered words; the child only as `{child}` or "your child" | Pass |
| Daily rhythm (`DAILY`), gap counts (`GAP`, `DAY_COUNT`) | Pass |
| Print, beta, other platforms | Pass |
| Internal words: take (noun), entry, draft (noun), pack, chapter | Pass |
| Glossary and card bans: tidy, clean, correct, edit, improve (the `en.review` rule), translate, detect, backdated, late, invite, while driving, hands-free, memory, moment, album, caption, safe | Pass |
| "we" or "our" in new strings (P0 rule for touched keys) | Pass: none |
| On-device-only phrases (`ON_DEVICE_ONLY`) | Pass after one fix: the first run caught "removed from this phone" in `listen.discardBody` and `discardBodyPhoto`; both now say "from the phone" |
| Button keys at 22 characters or fewer, also filled with the Asha fixtures | Pass; the longest is "Set the words aside" (19) |
| Error and state titles with no full stop | Pass |
| Placeholders from the allowed list only | Pass |
| Exclamation marks | None added |

Two things the test cannot see: `review.otherLanguage.markLink` is 28 characters and is allowed only as a text link, never drawn as a button; and the new `doorways` group needs a row or an opt-out in `test/support/copy-surfaces.ts` when it lands (the P8 rule).

## 17. Claims check

Lines that state a fact about what the product does. None is store or website copy; each stays inside its card's Claims section.

| Line (key) | What it promises | Card Claims section it stays inside | Condition |
|---|---|---|---|
| `listen.discardBody`, `discardBodyPhoto` | Let it go removes the recording (and its photo) from the phone, with no way back | NS-09 section 19 enables "Let it go removes the recording from this phone"; forbids "instantly deleted everywhere" (the line names no timing and no other place) | The claims inventory row NS-09 asks for (frame 7) |
| `review.notRemoved` | The app tries again each time it opens | NS-09 sections 5 and 17 (the sweep retries every launch; "the Review line is a claim and needs a claims inventory row") | BL-926 reads the result; the sweep retries every launch |
| `features.photos.text.hint`, `placeHint` ("Only what you type is kept.") | The app writes no photo words or place | NS-01 section 19; NS-01-R21b | True while R21b holds |
| `review.otherLanguage.markHintA11y`, `waiting`, fallback `confirmBody` | Set-aside words are not shown again or added to the book; the recording stays | NS-17 section 19 (forbids "translates", "understands any language"); D10. No line says the words are deleted, because D10 keeps them on the phone, flagged | NS-17-R7, R8 hold before it ships |
| `write.forRecording` ("They are kept just as you type them.") | Typed words are never machine-fixed | NS-17-R9; BOOK rule "Typed letters are exactly as they were typed" | True while R9 holds |
| `review.date.changeHintA11y` | The said-on day never changes | NS-15 section 19 (forbids any line that the app understands dates in what was said; this line says only that the parent sets the day) | None |
| `listen.lowSpace`, `features.words.pack.stoppedNoSpace` | When space runs out mid-recording, what was said so far is kept | No card Claims section; 06-nfr 11.3 ("drop under 20 MB mid-take: the take stops and is kept within 30 s"); DESIGN G-20 notes no card row | UNVERIFIED in code; `mobile` confirms before either line ships |
| `doorways.widgetDescription` ("Nothing records until you tap.") | No doorway records on its own | NS-06 C18 and NS-04 section 18 (forbid voice-activated, always listening); NS-35-R7 | Ships only with a doorway that passed NS-04 EX-2 and EX-5 |
| Later public line "Start a letter from your Lock Screen" (or the doorway that ships) | A doorway exists | NS-06 C18 enables it only after it ships | Not written now |
| Store listing languages | Only shipped languages are named | NS-17 section 19, R4 | No new store line from this area |
| `review.from.ask` | None: an instruction, not a statement that anyone agreed | NS-16 section 19 enables nothing public; D9 | Flag off in production until counsel |

## 18. Card gaps (words)

DESIGN.md's G-01 to G-21 stand; these are the word-side gaps, numbered W to keep them apart.

| Id | Card row | What is missing | Proposed default |
|---|---|---|---|
| W1 | NS-01-R58, R17a | The "did not come along" line is written for the letter page only (DESIGN G-08) | `features.photos.review.notStored` on Review; R58's line on the letter page |
| W2 | NS-01-R20b, R20e | Ready's "Change" is ambiguous for Voice Control in a flow that also has "Change the date" and "Change words" | Visible "Change photo" on Ready and Write, as on Review |
| W3 | NS-01-R5a | Keep is off with no words to say why | `features.photos.review.needsWords` |
| W4 | NS-09 section 16 | The Storage intent "One recording is still on this phone" reads as a count, and one row shows per stuck recording | "A recording you let go is still on this phone." |
| W5 | NS-14-R7 | No format for a nameless label with its date | "For your child, born {date}" and "due {date}"; sheet rows to match |
| W6 | NS-15 Failed row | As built the failure shows the generic line; VOICE asks to name what did not finish | `review.date.notSaved` |
| W7 | NS-16-R2 | "kept by the parent" (happy path 3) has no display rule; the export carries the keeper | No keeper line; the signature alone shows. Founder decides |
| W8 | NS-17-R5 vs D10 | One tap, but the set-aside is final and the card names no Undo (DESIGN G-07) | Undo for the T4 window; confirm strings ready if the founder prefers |
| W9 | NS-18 happy path 3 vs frame 4 | The typed-day line on Home is not one of the four registered slips | Part of the prompt block, not a slip (DESIGN draws it above the prompt); BL-963 confirms the registry ignores it |
| W10 | NS-06-C2 | `quickNote.widgetLabel` and `lockScreenLabel` carry `{child}` | Retire both |
| W11 | NS-17 sections 4 and 16 | The card reuses `waitingForLanguage`, which ends "Other languages are coming in a later update.", a coming-soon line the brief forbids (DESIGN G-05); it also misfits a build with a spoken-language list | `review.otherLanguage.waiting` on the set-aside path in every build. The built line stays where D-111 put it (a language the author chose and the build holds) until the founder rules on it and on `features.language.picker.englishOnly`, which has the same words |
| W12 | NS-35 content inputs | `tabsJob` sentences for N2 (d to f) are owed by `content`; Book and Me are other areas' screens | Home: "I go to Home to say something to {child}." (9 words). Book and Me left to areas B and C, each 12 words or fewer, pattern "I go to <tab> to <verb> ..." |
| W13 | NS-16 section 16 | The card names only the From label, the instruction and the too-long line; the sheet title and the way back to the parent's own name are not given | "Who is this letter from?" (not DESIGN's "Who is speaking?", which leans toward naming a speaker, close to the identification NS-16-R9 rules out) and "Use my name" (not "Sign as Mama": with a 30-character signature it can pass 22 characters) |
| W14 | NS-16 localisation line, DESIGN G-21 | Whether a number shows | No visible counter; the hint says how counting works and `review.from.tooLong` says when it is over |

## 19. Engineering gaps (words)

| Gap | Backlog row |
|---|---|
| Voice Control input labels where the VoiceOver label differs from the visible text (switcher, red circle, Review day line). Whether React Native exposes `accessibilityUserInputLabels` is UNVERIFIED | BL-984 |
| NS-17 has no backlog row for the mark, the Undo, the waiting state or the part-unwritten line (DESIGN E-03) | New row after BL-987 |
| The part-unwritten line needs the recogniser to report a stretch it could not write; no module found that does | Same new NS-17 row |
| `sign_as_too_long` before Keep, counted as the database counts | BL-980, BL-957 |
| `review.notRemoved` needs `letItGo`'s result read on Review | BL-926 |
| The low-space and mid-recording space lines are not traced to code | BL-958 |
| A `doorways` group in `packages/content` and its SURFACES row | BL-971 |
| Every P and C key above lands in one content PR, with the founder's word approvals listed | BL-965 |
