# Area A. Capture: every word (CONTENT DESIGN LEAD)

Status: draft for the reconciliation pass, 20 Nov 2026. Owner: `content`. Every new or changed line is PROPOSED: the founder approves words before any build outside his family shows them (BRIEF section 2). Nothing here was run on a phone. Docs only; no string in `packages/content` was changed by this file.

Sources read this session: `BRIEF.md`; cards `00-product-frame.md` (sections 4 to 7), `09-capture.md` (NS-14 to NS-20), `01-photo-with-a-letter.md`, `08-keeping-and-trust.md` (NS-09), `06-firsts-sealed-letter-quick-capture.md` (Part C), `04-hands-free-capture-spike.md`, `11-foundations.md` (NS-35), `16-council-review-round-2.md`, `14-test-plan.md` (journeys); `docs/BACKLOG.md` rows BL-925, BL-926, BL-965 and the BL-922 to BL-987 titles; `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`; `packages/content/src/strings.en.ts` (app, common, tabs, tonight, listen, write, notMuch, review, book, children, errors, trust), `features/language.en.ts`, `features/words.en.ts`, `features/billing.en.ts` (keepGate, membership); `photos.en.ts` as it stands on branch `feat/mobile-photo-4c-letter-page` (PR #839, read through the REST API, not on `develop`); `docs/design/specs/05-HANDS-FREE-CAPTURE-STATES-11nov.md` and `06-HOME-BOOK-ME-IA-11nov.md` (word slots only); screens `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/review.tsx`, `app/write.tsx`, `components/child/child-switcher.tsx`, `components/tonight/*`, `lib/nav/tab-jobs.ts` (which keys they read).

## 0. How to read this file

**Screen and state ids.** Screens are the design lead's `A-S01` to `A-S15` (DESIGN.md, skeleton of 20 Nov). DESIGN.md names only three states so far (`A-S07.default`, `A-S07.ax5`, `A-S07.notRemoved`), so the state names below are PROPOSED by `content` and listed in section 12 for the reconciliation pass. Surfaces another area draws (the letter page, Storage in Me) are named in words and handed off in section 13.

**Status column.**

| Mark | Meaning |
|---|---|
| E | Exists on `develop`; reuse as is |
| EP | Exists in `photosCopy` on PR #839 (itself marked PROPOSED there, needs word approval) |
| P | PROPOSED new key |
| C | PROPOSED change to an existing key (old words given) |
| R | PROPOSED retirement (delete in the PR that switches the screen) |

**Columns.** Key (path as the rules test sees it: `en.` is implied for `strings.en.ts`; `features.<file>.` for feature files); Text; Shows on (state ids); VoiceOver (label, then hint after a slash; "same" means the visible text is the label); Voice Control name (always the visible label; where a control has no visible text, the input labels to set); Card row.

**Placeholders used.** Only names the rules test allows: `{child}`, `{signsAs}`, `{date}`, `{a}`, `{b}`, `{month}`, `{label}`, `{percent}`, `{app}`, `{n}`. Some existing keys contain the separator dot (a non-ASCII character); this file names them by key and writes "(separator dot)" instead of copying the character, to stay ASCII.

## 1. Home (A-S01) and the capture cluster

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tabs.tonight` | E | "Home" | tab bar, every state | "Home, tab, 1 of 3" (system) | "Home" | frame 4 |
| `tonight.greeting.*` | E | "Good evening, {name}." and the six other dayparts | A-S01.default | heading | n/a (text) | frame 4 |
| `tonight.promptLabel` | E | "A thought to start with" | A-S01.default | hint of the prompt text, never shown | n/a | NS-35 |
| `tonight.newPromptButton` | E | "Another thought" | A-S01.default | same | "Another thought" | NS-35 |
| `tonight.speakButton` | E | "Speak" | A-S01.default, A-S04.photo | same / `tonight.speakHintA11y` | "Speak" | NS-35-R1, R7 |
| `tonight.speakHintA11y` | P | "Starts recording a letter to {child}." | hint only | hint | n/a | NS-35 (VoiceOver row: Speak and Type are the only start labels) |
| `tonight.typeButton` | E | "Type" | A-S01.default, A-S04.photo | same / `tonight.typeHintA11y` | "Type" | NS-35 |
| `tonight.typeHintA11y` | P | "Opens a page to type a letter to {child}." | hint only | hint | n/a | NS-35 |
| `features.photos.capture.startButton` | EP | "Start from a photo" | A-S01.default when the flag is on and the picker is registered; absent in A-S01.photoOff | same / `features.photos.a11y.startHint` | "Start from a photo" | NS-01-R1, R59 |
| `features.photos.a11y.startHint` | EP | "Opens your photos so you can pick one and then tell {child} about it." | hint only | hint | n/a | NS-01-R20b |
| `tonight.notMuchButton` | E | "Not much today" | A-S01.default | same / `notMuch.confirmBody` | "Not much today" | NS-07 C5 |
| `notMuch.confirmBody` | E | "Marks today without writing anything." | hint only | hint | n/a | NS-07 C5-1 |
| `notMuch.savedToast` | E | "A quiet day, kept." | A-S01.quietKept (in place of the link, with Undo) | announced | n/a | NS-07 C5 |
| `common.undoButton` | E | "Undo" | A-S01.quietKept | same | "Undo" | NS-07 C5-6 |

Whose book (NS-14), on Home above the dateline, only with two or more visible books:

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `children.switcher.label` | E | "For {child}" | A-S01.twoBooks | `children.switcher.homeA11y` / `children.switcher.hint` | "For {child}" (set input labels to the visible text, because the VoiceOver label is longer) | NS-14-R1 |
| `children.switcher.homeA11y` | P | "For {child}. New letters go to {child}'s book." | label only | label | n/a | NS-14 VoiceOver row ("Letters go to {child}'s book", intent) |
| `children.switcher.hint` | E | "Switch to another child's book" | hint only | hint | n/a | NS-14 |
| `children.switcher.labelBorn` | P | "For your child, born {date}" | A-S01.namelessTwo (two books, no name; birthday known) | same | same as visible | NS-14-R7 |
| `children.switcher.labelDue` | P | "For your child, due {date}" | A-S01.namelessTwo (due date only) | same | same as visible | NS-14-R7 |

`{date}` is `Intl.DateTimeFormat` with no ordinal day (NS-15 localisation row). One nameless book alone keeps the built fallback (`onboarding.childFallback`, "your child"): "For your child". Never "Child 2" (NS-14 section 5).

Waiting cards and the one-slip rule (frame 4: the existing waiting cards come first, in their existing order):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tonight.draft.held` | E | "Waiting to be kept." | A-S01.waitingCard (held) | read with the card | n/a | frame 4 slip 1 |
| `tonight.draft.heldMany` | E | "Letters waiting to be kept." | A-S01.waitingMany | same | n/a | F14-REQ-041 |
| `tonight.draft.heldShowButton` / `heldHideButton` | E | "Show them" / "Hide them" | A-S01.waitingMany | same | same | F14-REQ-041 |
| `tonight.draft.swept` | E | "Recorded before the app closed." | A-S01.waitingCard (swept), A-S05.interrupted | same | n/a | NS-04 Q12, NS-06-C9 |
| `tonight.draftWaiting.title` | E | "A recording is ready to read back." | A-S01.waitingCard (ready, no words yet) | same | n/a | frame 4 |
| `tonight.draft.typedA11y` | E | "A letter you started, {date}." | label of a typed waiting card | label | n/a | frame 4 |
| `tonight.draft.pickUpButton` / `openButton` / `keepButton` | E | "Pick it up" / "Open" / "Keep it" | A-S01.waitingCard | same | same | frame 4 |

A day the parent typed (NS-18, landing on Home after the notification tap; the notification itself is area D):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tonight.typedDay.kicker` | P | "For today" | A-S01.typedDay, above the parent's own words, above the prompt | read with the words | n/a | NS-18 happy path 3 |
| `tonight.typedDay.a11y` | P | "For today: {label}" | label of the line; `{label}` is the parent's typed words, unchanged | label | n/a | NS-18-R1 |

The parent's words show exactly as typed, in the app's small voice, never the letter serif and never completed or suggested (NS-18 Never). See card gap G9 for where this line sits relative to the slips.

## 2. Whose book sheet (A-S02)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `children.switcher.title` | E | "Whose book?" | A-S02.default | sheet title, radio group label | n/a | NS-14 |
| `book.title` | E | "{child}'s book" | each row | "{child}'s book, {month line}, selected" (radio) | "{child}'s book" | NS-14 |
| `book.chapterTitle` / `book.chapterNewborn` / `book.beforeYouChapter` | E | "Month {month}" / "The first weeks" / "Before You" | row description (the child's current month) | read after the name | n/a | NS-14 expecting row |
| `children.switcher.rowBorn` | P | "Your child's book, born {date}" | A-S02.nameless | same | same | NS-14-R7 |
| `children.switcher.rowDue` | P | "Your child's book, due {date}" | A-S02.nameless (due date only) | same | same | NS-14-R7 |
| `children.switcher.addButton` | E | "Add a child" | A-S02.default | same | "Add a child" | NS-14 ("Add a book", as built) |

A hidden book is absent; no line says so (NS-14-R9). No string names a count of books.

## 3. Apple's picker and our states around it (A-S03)

The picker is Apple's own sheet; we add no line above it until counsel clears the NX-33 label line (NS-01 section 12). Cancel writes nothing and shows nothing (NS-01-R4).

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.photos.capture.iCloudProgress` | P | "Getting the photo from iCloud" | A-S03.iCloudProgress | `features.photos.capture.iCloudProgressA11y` with the system progress trait | n/a | NS-01-R17b |
| `features.photos.capture.iCloudProgressA11y` | P | "Getting the photo from iCloud, {percent}%" | label only | label | n/a | NS-01-R17b |
| `common.cancelButton` | E | "Cancel" | A-S03.iCloudProgress | same | "Cancel" | NS-01-R17b |
| `features.photos.capture.iCloudOffline` | P | "This photo is in iCloud and needs a connection. You can go on without it." | A-S04.iCloudOffline (Ready, no picture) | announced once | n/a | NS-01-R46 |
| `features.photos.capture.openFailed` | C | "That photo could not be opened. You can choose another, or go on without one." Was: "That photo could not be opened. Choose another." | A-S04.openFailed | announced once | n/a | NS-01 section 15 (#838 state) |

A pick that lands while App lock is up is dropped with no line (NS-01-R47): after unlock the parent is on Ready with no picture, which is true and needs no words.

## 4. Listen, Ready (A-S04)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `listen.toChild` | E | "To {child}" | A-S04 all | heading | n/a | NS-14 (the book is fixed during a take, R8) |
| `listen.audience` | E | "Only you, until you add it to the book." | A-S04 all | same | n/a | as built |
| `tonight.states.ready` | E | "Ready when you are." | A-S04.default, A-S04.doorway | announced on arrival | n/a | NS-06 C6 VoiceOver row |
| `tonight.states.readyHint` | E | "Tap and talk. Pauses are fine." | A-S04.default | same | n/a | HF-R4 |
| `listen.ready.hint` | E | "Tap the red circle and talk." | A-S04.default, A-S04.doorway | same | n/a | BRAND glossary (record control) |
| `listen.ready.startA11y` | E | "Start recording" | the red circle (no visible text) | label | input labels `listen.ready.startInputLabels` | NS-06-C1, NS-33 |
| `listen.ready.startInputLabels` | P | ["Start recording", "Red circle", "Record"] | Voice Control only | n/a | any of the three | NS-33 (Voice Control), spec 05 section 9 |
| `features.photos.capture.thumbA11y` | P | "The photo you picked" | A-S04.photo, the thumbnail | label (image) | n/a | NS-01-R20b (order: thumbnail, prompt, Speak, Type, Change) |
| `features.photos.capture.change` | C | "Change photo" Was: "Change" | A-S04.photo, under the thumbnail | same | "Change photo" | NS-01-R20b, R20e; card gap G2 |
| `common.closeButton` | E | "Close" | A-S04 all (back out writes nothing) | same | "Close" | NS-01-R4 |
| `listen.lowSpace` | P | "This phone is low on space. If it fills up, the recording stops and what you said so far is kept." | A-S04.lowSpace and A-S05.lowSpace (under 1 GB free) | announced once | n/a | 06-nfr 11.3; NS-01 low-storage row |

The colour question from spec 05 section 9: the record control is named by colour and shape ("the red circle", the glossary name), so colour is not the only signal and the hint stays. The VoiceOver label carries no colour. Recording state is also said in words ("Listening.", "Paused."), never by the red alone.

Microphone primer and blocked starts (existing, three causes, three screens):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `listen.primer.title` / `body` / `continueButton` | E | "Your phone will ask about the microphone" / "{app} uses it to hear the letters you speak to {child}. It listens only while you record." / "Continue" | A-S04.primer (first Speak, once) | same | "Continue" | SR-C-05 |
| `errors.micDenied.title` / `body` | E | "The microphone is off" / "Turn it on in Settings, or type this one." | A-S04.micDenied | same | n/a | HF-R8 |
| `errors.micDenied.settingsButton` / `typeButton` | E | "Open Settings" / "Type instead" | A-S04.micDenied, A-S04.micBusy, A-S04.phoneFull | same | same | HF-R8 |
| `errors.micBusy.title` / `body` | E | "The microphone is in use" / "A call or another app has it right now." | A-S04.micBusy | same | n/a | H13 |
| `errors.phoneFull.title` / `body` | E | "This phone is full" / "Free some space to record, or type this one." | A-S04.phoneFull (under 50 MB: no new recording) | same | n/a | 06-nfr 11.3; NS-06 C5 |
| `common.tryAgainButton` | E | "Try again" | A-S04.micBusy, A-S04.phoneFull | same | "Try again" | as built |

## 5. Listen, Recording (A-S05)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `tonight.states.listening` / `listeningHint` | E | "Listening." / "Say it however it comes." | A-S05.recording | announced once | n/a | NS-33 colour row |
| `tonight.states.stillHere` | E | "Still here. Take your time." | A-S05.stillHere (8 s quiet; never stops on silence) | announced once | n/a | HF-R4 |
| `common.pauseButton` / `tonight.states.resumeButton` | E | "Pause" / "Keep talking" | A-S05.recording / A-S05.paused | `listen.toggleA11y` | "Pause" / "Keep talking" | F04-REQ-041 |
| `listen.toggleA11y` | E | "Pause or keep talking" | label of the toggle | label | input labels: the visible word of the moment | F04-REQ-041 |
| `tonight.states.paused` | E | "Paused." | A-S05.paused | announced | n/a | H5 |
| `tonight.states.stopButton` | E | "Finish" | A-S05.recording, A-S05.paused | same | "Finish" | H10 |
| `listen.elapsedA11y` | E | "{minutes} min {seconds} s recorded" | timer label | label | n/a | as built |
| `listen.discardButton` | E | "Let it go" | A-S04, A-S05.paused | same | "Let it go" | NS-09 |
| `tonight.states.saving` / `saved` | E | "Saving your words." / "Saved, in your words." | A-S05.finishing / A-S05.saved | announced | n/a | H10, H11 |
| `tonight.states.transcribing` and `features.words.preparing` | E | "Writing down what you said." | A-S07.transcribing | announced | n/a | H11; ruling in section 11 |
| `features.words.listening` / `listeningA11y` | E | "Writing down what you said. Part {n} of {count}." | A-S07.transcribing (long) | label form without the full stop | n/a | as built |
| `features.words.pack.stoppedInterruption` | E | "The recording stopped for a call or an alert. Everything before that is kept." | A-S07.stoppedEarly | announced | n/a | NS-06-C9 |
| `features.words.pack.stoppedInBackground` / `stoppedClosed` | E | "The recording stopped when you left the app. Everything before that is kept." / "The recording stopped when the app closed. Everything before that is kept." | A-S07.stoppedEarly | announced | n/a | NS-04 Q12 |
| `features.words.pack.stoppedNoSpace` | P | "The recording stopped when the phone ran out of space. Everything before that is kept." | A-S07.stoppedEarly (drop under 20 MB mid-recording) | announced | n/a | 06-nfr 11.3 |
| `trust.firstRecording.title` / `body` / `dismissButton` | E | "Your voice stays here" / "Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models." / "Good to know" | once, first recording | same | "Good to know" | VOICE privacy table |

## 6. Write (A-S06)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `write.label` | E | "Your letter" | A-S06.default | field label | "Your letter" | NS-35 |
| `tonight.typing.placeholder` | E | "Write it the way you would say it." | A-S06.default (empty) | field hint | n/a | as built |
| `write.autosaved` / `notSaved` | E | "Saved on this phone" / "Not saved yet" | A-S06.default / A-S06.notSaved | announced on change | n/a | as built |
| `write.tooLong` | E | "This is a very long letter. Every word is kept. You can start another letter to say more." | A-S06.tooLong | announced once | n/a | BL-378 |
| `features.photos.capture.thumbA11y` | P | "The photo you picked" | A-S06.photo (typing after a photo start) | label | n/a | NS-01 happy path 4 |

Writing tools are off on this field (D2); no string says so.

## 7. Review (A-S07) and its sheets (A-S08 to A-S10)

### 7.1 Existing Review words (reused as is)

`review.title` "Read it back"; `review.headerTo`, `headerToNewborn`, `headerToBefore` (each "To {child}" then the separator dot then the month); `review.playButton` "Hear it"; `review.view.fixes` "With small fixes", `review.view.exact` "Exactly as said", `review.view.a11y` "How this letter reads"; `review.changesLabel` "{count} small fixes", `changesLabelOne` "1 small fix"; `review.noChanges`, `noChangesAfterUndo`, `noChangesNoRules`; `review.cardYouSaid`, `cardNowReads`, `cardTakenOut`, `rowChange`, `undoEditButton` "Put it back", `putBackToast` "Put back."; `review.edits.*` (each fix named by what happened); `review.lock.*`; `review.firstNote.*`; `review.waitingLong` "Long recordings take a little more time."; `review.laterButton` "Read it back later"; `review.keepStillSaving`; `review.saveFailed` "That did not save. Your words are still here."; `review.missingFile.title` "The recording did not save"; `review.shortTake.*`; `review.emptyTake.*`; `review.noDraft.*`; `review.voiceOnlyButton` "Keep the recording"; `review.waiting.*`; `review.destination.addButton` "Add to {child}'s book", `addButtonShort` "Add to the book", `privateButton` "Keep private"; `features.words.noSpeech.*`, `features.words.waiting.*`, `features.words.pack.*` (language wait). Their states: A-S07.default, .transcribing, .waitingLong, .noSpeech, .shortTake, .emptyTake, .missingFile, .noDraft, .saveFailed, .keepStillSaving, .firstNote, .voiceOnly.

### 7.2 The day this letter is about (NS-15; A-S07.dateline, A-S08)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `book.entryMenu.changeDate` | E | "Change the date" | A-S07.default, beside the dateline, author only (one string for Review and the letter page) | same / `review.date.changeHintA11y` | "Change the date" | NS-15-R1, R7 (absent for a reader who is not the author) |
| `review.date.changeHintA11y` | P | "Sets the day this letter is about. The day you said it stays the same." | hint only | hint | n/a | NS-15 VoiceOver row |
| `review.date.label` | E | "When was this?" | A-S08.default (sheet title) | heading | n/a | NS-15 |
| `review.date.dayTab` / `monthTab` / `tabsLabel` / `dayLabel` | E | "A day" / "A month" / "Day or month" / "Day" | A-S08.default, A-S08.month | as built | "A day" / "A month" | NS-15 section 5 |
| `common.saveButton` / `common.cancelButton` | E | "Save" / "Cancel" | A-S08 | same | same | NS-15 happy path 3 |
| `book.dateline.monthOnly` / `monthOnlyNewborn` | E | "Sometime in Month {month}" / "Sometime in the first weeks" | A-S07.dateline (month precision) | same | n/a | NS-15 section 5 |
| `review.date.filedA11y` | P | "This letter will go in {label}." | announced after Save when the month changes; `{label}` is "Month 2", "The first weeks" or "Before You" | announcement | n/a | NS-15-R12 (announce the new month) |
| `review.date.notSaved` | P | "That date did not save. The letter keeps the day it had." | A-S07.dateNotSaved and the letter page | announced | n/a | NS-15 Failed row (as built: generic line); card gap G6 |
| `book.changeDate.movedToast` | E | "Moved to {label}." | letter page after a change (area B) | announced | n/a | NS-15-R12 |
| `book.dateline.aboutSaid` | P | "About {a}. Said on {b}." | letter page when the two days differ (area B draws it); `{a}` the about-day, `{b}` the said-on day, both `Intl.DateTimeFormat` | same | n/a | NS-15-R3 |
| `book.dateline.aboutSaidMonth` | P | "Sometime in Month {month}. Said on {date}." | same, month precision | same | n/a | NS-15-R3 |
| `book.dateline.aboutSaidNewborn` | P | "Sometime in the first weeks. Said on {date}." | same, month precision in the first weeks | same | n/a | NS-15-R3 |

No "backdated", no "late", no ordinal day (NS-15 content inputs). The app never reads a date from the words or the picture, and no line suggests it does (NS-15-R4, R18).

### 7.3 Someone else speaks (NS-16; A-S07.from, A-S09). Behind `EXPO_PUBLIC_SIGN_AS_OTHER`, off in production until counsel answers Q45, Q46, Q48, Q54

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `common.signature` | E | "From {signsAs}" | A-S07.from, the signature row, now a control | "From {signsAs}" / `review.from.rowHintA11y` | "From {signsAs}" | NS-16-R1 ("From, {name}, button", intent) |
| `review.from.rowHintA11y` | P | "Changes the name this letter is signed with." | hint only | hint | n/a | NS-16 VoiceOver row |
| `review.from.sheetTitle` | P | "Who is this letter from?" | A-S09.default | heading | n/a | NS-16 |
| `review.from.fieldLabel` | P | "Name to sign with" | A-S09.default | field label | "Name to sign with" | NS-16-R1 |
| `review.from.fieldHint` | P | "Up to 30 characters. Some scripts count more characters than you see." | A-S09.default, under the field | field hint | n/a | NS-16 localisation line ("the counter says so plainly") |
| `review.from.counterA11y` | P | "{n} of 30 characters" | the field's counter, as the database counts | label | n/a | NS-16-R1, R6 |
| `review.from.ask` | P | "Ask before you record someone else." | A-S07.from and A-S09.default, one line under the field; no checkbox | same | n/a | NS-16-R18, D9 |
| `review.from.recentTitle` | P | "Names used on this phone" | A-S09.recentNames (absent when the list is empty) | list heading | n/a | NS-16 section 5 (names used before) |
| `review.from.useMineButton` | P | "Use my name" | A-S09.default when a name is typed | same | "Use my name" | NS-16 Decline (signed as the parent) |
| `common.doneButton` | E | "Done" | A-S09 | same | "Done" | NS-16 |
| `review.from.tooLong` | P | "That name is longer than 30 characters. A shorter one will fit." | A-S09.tooLong and A-S07.fromTooLong (Keep refused) | announced | n/a | NS-16-R6, error `sign_as_too_long` |

After Keep the row is plain text, "From Nani", with no control (NS-16-R17). No line on this path says "invite", "family can add letters", "speaker", or asks a child or sibling to speak (NS-16-R5).

### 7.4 Another language (NS-17; A-S07.otherLanguage, A-S10)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `review.otherLanguage.markLink` | P | "This was in another language" | A-S07.default for a spoken letter with words, below the words (a text link, so the 22-character button rule does not bind) | same / `review.otherLanguage.markHintA11y` | "This was in another language" | NS-17-R5 |
| `review.otherLanguage.markHintA11y` | P | "Sets these words aside for good. The recording stays with this letter." | hint only | hint | n/a | NS-17 VoiceOver row ("reads its consequence") |
| `review.otherLanguage.setAsideToast` | P | "Words set aside." | A-S10.undo, with Undo for the T4 window | announced, then "Undo, button" | "Undo" | NS-17-R5 (one tap); card gap G8 |
| `review.otherLanguage.confirmTitle` | P | "Set these words aside?" | A-S10.confirm (only if the founder picks a confirm over Undo, G8) | heading | n/a | NS-17-R5, D10 |
| `review.otherLanguage.confirmBody` | P | "They will not be shown again or added to the book. Your recording stays with this letter, and you can write the words yourself." | A-S10.confirm | read with the title | n/a | D10 |
| `review.otherLanguage.confirmButton` | P | "Set the words aside" | A-S10.confirm | same | "Set the words aside" | D10 |
| `review.otherLanguage.cancelButton` | P | "Leave as it is" | A-S10.confirm (the default, safe choice) | same | "Leave as it is" | D10 |
| `features.language.waitingForLanguage` | E | "This recording is waiting for its language. Other languages are coming in a later update." | A-S10.waiting in an English-only build; letter page and Book (area B) | same | n/a | NS-17 happy path 3 |
| `review.otherLanguage.waiting` | P | "The words for this recording are waiting. You can write them yourself." | A-S10.waiting in a build with a spoken-language list (no promise of a later language) | same | n/a | NS-17 section 5 |
| `features.words.waiting.writeButton` | E | "Write the words" | A-S10.waiting | same | "Write the words" | NS-17-R9 ("Type the words yourself", intent; the built words are kept for one name) |
| `features.words.waiting.writeTitle` / `writeLabel` / `saveButton` / `cancelButton` | E | "Write the words" / "Words for this recording" / "Save words" / "Not now" | A-S10.writeWords | as built | same | NS-17-R9 |
| `review.partUnwritten` | P | "Part of this recording has no words written here. Play it to hear all of it." | A-S07.partUnwritten and the letter page | same | n/a | NS-17 section 5 (mixed-language stretch) |

Never on this path: "translate", "detect", "mixed", "broken", or any promise of when a language arrives (NS-17 content inputs, VOICE multilingual rule).

### 7.5 A picture on Review (NS-01; A-S07.photo)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.photos.book.photos.a11yCard` | EP | "Photo with this letter" | the picture's label when the parent typed no words about it | label | n/a | NS-01-R9a, R21c |
| `features.photos.text.label` / `optional` / `hint` | EP | "Words about this photo" / "Optional" / "Up to 140 characters. Only what you type is kept." | A-S07.photo | field label, hint | "Words about this photo" | NS-01-R21a, R21b |
| `features.photos.text.placeLabel` / `placeHint` | EP | "Where was this?" / "Up to 60 characters. Only what you type is kept." | A-S07.photo | field label, hint | "Where was this?" | NS-01-R21a |
| `features.photos.text.atLimit` | P | "That is as much as fits here." | A-S07.photo when a field reaches its cap (graphemes) | announced once | n/a | NS-01-R54 |
| `features.photos.review.addButton` | P | "Add a photo" | A-S07.default when no picture and the flag is on | same | "Add a photo" | NS-01 section 3 (add on Review) |
| `features.photos.book.letter.changePhoto` | EP | "Change photo" | A-S07.photo | same | "Change photo" | NS-01-R7 |
| `features.photos.book.letter.removePhoto` | EP | "Take the photo off" | A-S07.photo | same | "Take the photo off" | NS-01-R38a |
| `features.photos.review.needsWords` | P | "Keep is ready once this letter has words." | A-S07.photoNeedsWords, beside the disabled Keep | Keep reads "dimmed" with this as its hint | n/a | NS-01-R5a, outcome `needs_words` |
| `features.photos.review.notStored` | P | "That photo did not come along. You can add it again." | A-S07.photoNotStored (any commit failure while Review is open) | announced once | n/a | NS-01-R17a, R58; card gap G1 |

## 8. Let it go (NS-09; A-S11, A-S07.notRemoved)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `listen.discardButton` | E | "Let it go" | A-S04, A-S05.paused, A-S07 | same | "Let it go" | NS-09 |
| `listen.discardTitle` | E | "Let this recording go?" | A-S11.confirm | alert title | n/a | NS-09-R9 |
| `listen.discardBody` | C | "It will be removed from the phone, and it cannot be brought back." Was: "It will be removed from this phone." ("from this phone" matches the P0 `ON_DEVICE_ONLY` pattern once the key is touched) | A-S11.confirm | read with the title | n/a | NS-09-R9 ("says the take cannot be brought back") |
| `listen.discardBodyPhoto` | P | "The recording and its photo will be removed from the phone, and they cannot be brought back." | A-S11.confirmPhoto (a waiting letter holding a picture) | read with the title | n/a | NS-09-R9, NS-01-R16c |
| `listen.keepButton` | E | "Keep it" | A-S11 (the default, cancel style) | same | "Keep it" | NS-09-R9 (default keep) |
| `listen.discardConfirm` | E | "Remove it" | A-S11 | same | "Remove it" | NS-09 |
| `review.notRemoved` | P | "This recording is not removed yet. {app} tries again each time it opens." | A-S07.notRemoved, once per recording per Review visit, inline under the words, muted, no icon, no red; never blocks leaving | announced after the screen settles | n/a | NS-09-R4a, R4b; BL-925, BL-926 |
| `settingsHome.letGoStuck` | P | "A recording you let go is still on this phone." | Storage in Me (area C), one row per stuck recording after 3 launches | same | n/a | NS-09-R6 |
| `settingsHome.removeNowButton` | P | "Remove now" | the same row | "Remove now" / hint "Tries again to remove this recording." (`settingsHome.removeNowHintA11y`, P) | "Remove now" | NS-09-R6 |
| `settingsHome.removeNowHintA11y` | P | "Tries again to remove this recording." | hint only | hint | n/a | NS-09-R6 |

When Remove now does not finish, the row stays with the same words and no error word (NS-09 section 5). A successful let-go shows nothing: the parent returns to where they were. Banned on this path: "failed", "error", "deleted everywhere", "instantly" (NS-09 Never).

## 9. Replace and take off a picture (NS-01; A-S12)

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `features.photos.book.letter.replacePhotoAsk.question` | EP | "Use this photo instead?" | A-S12.replaceAsk | title | n/a | NS-01-R7 |
| `...replacePhotoAsk.body` | EP | "The first photo stays until you choose." | A-S12.replaceAsk | read with the title | n/a | NS-01-R7 |
| `...replacePhotoAsk.confirm` / `keep` | EP | "Use this photo" / "Keep the first" (the safe default) | A-S12.replaceAsk | same | same | NS-01-R7 |
| `features.photos.book.letter.replacePhotoUndo` | EP | "Photo changed." | A-S12.changedUndo | announced, then "Undo, button" | n/a | NS-01-R38a |
| `features.photos.book.letter.removed` | EP | "Photo taken off." | A-S12.takenOffUndo | announced, then "Undo, button" | n/a | NS-01-R38a |
| `features.photos.book.letter.undo` | EP | "Undo" | A-S12.changedUndo, A-S12.takenOffUndo, for the T4 window only | same | "Undo" | NS-01-R38a to R38c |

When the window closes the Undo control leaves in the same moment; no string replaces it (NS-01-R38b, state A-S12.undoClosed). The PR comment on `replacePhotoUndo` and `removed` says "Undo for 10 seconds"; the words name no time, which stays right under T4.

## 10. After Keep (A-S13) and doorways (A-S14, A-S15)

After Keep (existing; the Keep gate sheet is area E):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `review.destination.filedChip` / `filedChipNewborn` / `filedChipBefore` | E | "Kept in Month {month}" / "Kept in the first weeks" / "Kept in Before You" | A-S13.kept | announced | n/a | NS-14-R3, NS-15-R2 |
| `review.destination.addedToast` / `privateToast` / `voiceOnlyToast` | E | "Added to {child}'s book." / "Kept just for you." / "Recording kept on this phone." | A-S13.kept, .keptPrivate, .keptVoiceOnly | announced | n/a | as built |
| `features.billing.keepGate.*`, `secondFreeNote` | E | (area E) | A-S13.gateHandoff | area E | area E | D-082 |

Doorways, only where NS-04 passed and `EXPO_PUBLIC_QUICK_CAPTURE` is on (NS-06 Part C). Static: no child name, no letter words, no count (NS-06-C2):

| Key | St | Text | Shows on | VoiceOver | Voice Control | Card |
|---|---|---|---|---|---|---|
| `doorways.startLabel` | P | "Start a letter" | A-S14.widget, A-S14.control, A-S14.actionButton (App Shortcut title) | read by iOS | "Start a letter" | NS-06 C16 |
| `doorways.siriPhrase` | P | "Start a letter in {app}" | A-S14.siri (App Shortcut phrase; iOS fills the app name token) | n/a | n/a | NS-06 C16 |
| `doorways.widgetA11y` | P | "Start a letter. Opens {app}, ready when you are." | widget label | label | n/a | NS-06-C2 |
| `doorways.widgetDescription` | P | "Opens {app} ready to record. Nothing records until you tap." | the iOS widget gallery and the control gallery | read by iOS | n/a | NS-35-R7, NS-04 EX-2 |
| `quickNote.widgetLabel` | R | "Quick note for {child}" | none | n/a | n/a | conflicts with NS-06-C2 (a child name on a widget) |
| `quickNote.lockScreenLabel` | R | "Note for {child}" | none | n/a | n/a | conflicts with NS-06-C2 |

Arrival from a doorway is A-S04.doorway with the same words as a tap on Speak; a doorway before first run opens first run (A-S14.beforeFirstRun) with no doorway line; a second start while recording is refused with no line. Banned on doorway strings: "while driving", "hands-free", "always listening", "voice-activated", any count, and "nothing leaves your phone" next to Siri (Siri sends the spoken phrase to Apple).

Hands-free states (A-S15) are hypotheses until NS-04 files its findings. If Q6 picks a spoken cue, it reuses the existing state lines ("Listening.", "Paused.", "Saved, in your words.") and adds no new words. No hands-free string ships before NS-04b.

Add more to this letter (NS-19) is not taken up: no strings, no "Continue" on Home, no "add audio" on the letter page (NS-19-R1, section 15).

## 11. Rulings `content` makes here (for the founder to confirm)

1. **"Writing down what you said."** (`tonight.states.transcribing`, `features.words.preparing`). Spec 05 asked whether it reads as a machine writing. It stays: the sentence says the parent's own words are being written down, and it never says the app wrote or shaped a letter. It is the plainest true line for transcription. The founder can overrule.
2. **One name for one action.** Review uses the letter page's "Change the date" rather than a second phrase; Review uses "Write the words" (built) rather than the card's intent "Type the words yourself", which is also 23 characters and over the button budget.
3. **"About {a}. Said on {b}."** follows the card's intent. Risk: "About" can read as "roughly". If the founder hears it that way, the alternative is "This letter is about {a}. Said on {b}."
4. **"Names used on this phone"** rather than "Recent names": it says where the list lives without the on-device-only wording the P0 rule blocks.

## 12. State ids this file uses (for the reconciliation pass with DESIGN.md and MOTION.md)

A-S01: default, photoOff, quietKept, twoBooks, namelessTwo, waitingCard, waitingMany, typedDay. A-S02: default, nameless. A-S03: iCloudProgress. A-S04: default, photo, doorway, primer, micDenied, micBusy, phoneFull, lowSpace, iCloudOffline, openFailed. A-S05: recording, stillHere, paused, finishing, saved, interrupted, lowSpace. A-S06: default, notSaved, tooLong, photo. A-S07: default, transcribing, waitingLong, noSpeech, shortTake, emptyTake, missingFile, noDraft, saveFailed, keepStillSaving, firstNote, voiceOnly, stoppedEarly, dateline, dateNotSaved, from, fromTooLong, otherLanguage, partUnwritten, photo, photoNeedsWords, photoNotStored, notRemoved. A-S08: default, month. A-S09: default, recentNames, tooLong. A-S10: undo, confirm, waiting, writeWords. A-S11: confirm, confirmPhoto. A-S12: replaceAsk, changedUndo, takenOffUndo, undoClosed. A-S13: kept, keptPrivate, keptVoiceOnly, gateHandoff. A-S14: widget, control, actionButton, siri, beforeFirstRun. A-S15: hypotheses. If DESIGN.md names a state differently, its name wins and this list is re-keyed.

States with no words of their own: offline, kill switch (`serverFeaturesEnabled()` off), plan lapse before Keep, signed out, second account, dark, AX5. Capture works the same in each; the only gate is at Keep (area E). Offline reuses `errors.offline` ("You're offline" / "Keep talking. Everything is saved on this phone.") wherever the design shows it.

## 13. Every error and failure the area's cards name

What happened, then what the parent can do. No code ever reaches the screen, a log line with a path, name or hash, or a VoiceOver string.

| Code or outcome | Card | Where | Key | What the parent reads |
|---|---|---|---|---|
| `photo_pick_failed`; pick outcome `failed` | NS-01 | A-S04.openFailed | `features.photos.capture.openFailed` (C) | "That photo could not be opened. You can choose another, or go on without one." |
| pick outcome `cancelled` | NS-01-R4 | A-S01 or the letter page | none | Nothing: back where they were |
| iCloud picture, offline (no code in the stack; the CTO pass's `photo_icloud_unavailable` is not the code's name) | NS-01-R46 | A-S04.iCloudOffline | `features.photos.capture.iCloudOffline` (P) | "This photo is in iCloud and needs a connection. You can go on without it." |
| pick dropped under App lock | NS-01-R47 | none | none | Nothing (Ready without a picture after unlock) |
| `photo_reencode_failed`, `photo_bake_timeout`, `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `no_space`, commit `failed` | NS-01-R17a, R45, R58 | A-S07.photoNotStored; letter page in that session | `features.photos.review.notStored` (P); `features.photos.book.letter.notSaved` (EP) | "That photo did not come along. You can add it again." / "The photo did not come along with this letter. Your words are kept, and you can add it again." |
| `photo_path_refused`, `photo_temp_name_refused`, `picked_file_outside_picker_folder`, `baked_file_outside_folder`, `photos_folder_unknown` (safety refusals) | NS-01-R34, section 10 | same as the row above | same | Same calm line; the parent never learns of a path |
| commit `needs_words` | NS-01-R5a | A-S07.photoNeedsWords | `features.photos.review.needsWords` (P) | "Keep is ready once this letter has words." |
| stored file missing | NS-01-R56 | letter page (area B) | `features.photos.book.letter.missing`, `missingRemove` (EP) | "Not on this phone any more" with "Remove" for the author |
| `sign_as_too_long` (PROPOSED code) | NS-16-R6 | A-S09.tooLong, A-S07.fromTooLong | `review.from.tooLong` (P) | "That name is longer than 30 characters. A shorter one will fit." |
| let-go file delete did not finish | NS-09-R4a | A-S07.notRemoved | `review.notRemoved` (P) | "This recording is not removed yet. {app} tries again each time it opens." |
| still not removed after 3 launches; Remove now did not finish | NS-09-R6 | Storage in Me (area C) | `settingsHome.letGoStuck`, `removeNowButton` (P) | "A recording you let go is still on this phone." with "Remove now" |
| about-day local write did not finish | NS-15 Failed row | A-S07.dateNotSaved; letter page | `review.date.notSaved` (P), replacing `errors.generic` there | "That date did not save. The letter keeps the day it had." |
| microphone off, busy; phone full | capture (H12, H13), 06-nfr 11.3 | A-S04 | `errors.micDenied`, `errors.micBusy`, `errors.phoneFull` (E) | As in section 4 |
| recording stopped early (call, alert, background, closed, space) | NS-04 Q12, NS-06-C9, 06-nfr 11.3 | A-S07.stoppedEarly | `features.words.pack.stopped*` (E), `stoppedNoSpace` (P) | "The recording stopped ... Everything before that is kept." |
| no words from the recording | capture | A-S07.noSpeech | `features.words.noSpeech.*` (E) | "No words in this one" / "The recording is kept just as it is." |
| transcription did not finish | capture | A-S07 | `errors.transcriptionFailed` (E) | "No words yet for this one" / "The recording is kept." |
| save to the book did not finish | capture | A-S07.saveFailed | `review.saveFailed`, `errors.saveFailed` (E) | "That did not save. Your words are still here." |
| file missing or nothing recorded | capture | A-S07.missingFile, .emptyTake | `review.missingFile`, `review.emptyTake` (E) | As built |
| Keep tapped while still saving | capture | A-S07.keepStillSaving | `review.keepStillSaving` (E) | As built |
| Review opened with nothing to read | capture | A-S07.noDraft | `review.noDraft` (E) | "Nothing to read back here" / "Go to the book" |
| doorway failed to open | NS-06 C6 | Home | none | Opens Home; no line names the doorway |

NS-14, NS-17 (beyond the existing transcription path), NS-19, NS-35 and NS-04 name no error codes.

## 14. Notifications

Area A sends none. Doorways show no child name, letter words or count on the Lock Screen, Control Center or the widget (NS-06-C2). The typed-day and reminder notifications are area D's; Home only shows the parent's typed words after the tap (section 1).

## 15. Empty states

- Home always has a prompt; there is no empty Home line. With no book at all (after Erase everything), Home's empty state is area E's.
- Names used on this phone: with none, the heading is absent (no "No names yet").
- Waiting cards: with none, nothing shows; no "all caught up" line, no count.
- Two books with nothing in one: the switcher row shows the book and its month line only.

## 16. Rules check

Run 20 Nov over the 59 P and C strings in this file (a throwaway script outside the repo read the Text column; ASCII and every regex below are from `rules.test.ts` and the card banned lists):

| Rule | Result |
|---|---|
| ASCII only in the whole file; no em or en dash, curly quote, ellipsis character, emoji | Pass |
| Fear, guilt, loss words (`FEAR`); "failed", "error", "deleted everywhere", "instantly" on NS-09 lines | Pass |
| AI-writing words (`AI`); rewrite only as a "never" | Pass |
| Gendered words; child named only as `{child}` or "your child" | Pass |
| Daily rhythm (`DAILY`), gap counts (`GAP`, `DAY_COUNT`) | Pass |
| Print, beta, other platforms | Pass |
| Internal words: take (noun), entry, draft (noun), pack, chapter | Pass |
| Glossary: tidy, clean, correct, edit, improve (the `en.review` rule), "translate", "detect", "backdated", "late", "invite", "while driving", "memory", "moment", "album", "caption" | Pass |
| "we" or "our" in new strings (P0 rule for touched keys) | Pass: none |
| On-device-only phrases (`ON_DEVICE_ONLY`) | Pass after one fix: the first run caught "removed from this phone" in `listen.discardBody` and `discardBodyPhoto`; both now say "from the phone" |
| Button keys (ending `Button`) at 22 characters or fewer, filled with the Asha fixtures | Pass; the longest is "Set the words aside" (19) |
| Error and state titles with no full stop | Pass ("Set these words aside?" is a question) |
| Placeholders from the allowed list only | Pass |
| Exclamation marks | None added |

Two things the test cannot see and a reviewer must: `review.otherLanguage.markLink` is a link, not a button, so its 28 characters are allowed only if the screen draws it as a text link; and the new `doorways` group needs a row or an opt-out in `test/support/copy-surfaces.ts` when it lands (the P8 rule).

## 17. Claims check

Lines that state a fact about what the product does. None is store or website copy today; each stays inside its card's Claims section.

| Line (key) | Promise | Card Claims section it stays inside | Condition |
|---|---|---|---|
| `listen.discardBody`, `listen.discardBodyPhoto` | Let it go removes the recording (and its photo) from the phone, with no way back | NS-09 section 19 enables "Let it go removes the recording from this phone"; forbids "instantly deleted everywhere" (the line names this phone only) | Needs the claims inventory row NS-09 asks for (frame 7) |
| `review.notRemoved` | The app tries again each time it opens | NS-09 sections 5 and 17 (sweep retries each launch); the Review line "is a claim and needs a claims inventory row" | BL-926 must read the result; the sweep must retry every launch |
| `features.photos.text.hint`, `placeHint` ("Only what you type is kept.") | The app writes no photo words or place | NS-01 section 19; NS-01-R21b | True while R21b holds |
| `features.photos.review.notStored` | Nothing about the cause; the letter's words are kept | NS-01-R17a, R58 | None |
| `review.otherLanguage.confirmBody`, `markHintA11y` | Set-aside words are not shown again or added to the book; the recording stays | NS-17 section 19 (forbids "translates", "understands any language"); D10. The line does not say the words are deleted, because D10 keeps them on the phone, flagged | NS-17-R7, R8 must hold before it ships |
| `review.date.changeHintA11y` | The said-on day never changes | NS-15 section 19 (forbids any line that the app understands dates in what was said; this line says only that the parent sets the day) | None |
| `listen.lowSpace`, `features.words.pack.stoppedNoSpace` | When space runs out mid-recording, what was said so far is kept | No card Claims section; 06-nfr 11.3 ("drop under 20 MB mid-take: the take stops and is kept within 30 s") | UNVERIFIED in code this session; `mobile` confirms before the line ships |
| `doorways.widgetDescription` ("Nothing records until you tap.") | No doorway records on its own | NS-06 C18 and NS-04 section 18 (forbid voice-activated, always listening); NS-35-R7 | Ships only with a doorway that passed NS-04 EX-2 and EX-5 |
| Public line, later: "Start a letter from your Lock Screen" (or the doorway that ships) | A doorway exists | NS-06 C18 enables it only after it ships | Not written now |
| Store listing languages | Only shipped languages are named | NS-17 section 19, NS-17-R4 | No new store line from this area |
| `review.from.ask` | None: an instruction, not a statement that anyone agreed | NS-16 section 19 enables nothing public; D9 | Flag off in production until counsel |

## 18. Card gaps

| Id | Card row | What is missing | Proposed default |
|---|---|---|---|
| G1 | NS-01-R58, R17a | The "did not come along" line is specified for the letter page only; a commit failure while Review is open has no words | `features.photos.review.notStored` on Review, the R58 line on the letter page |
| G2 | NS-01-R20b, R20e | Ready's "Change" sits beside other "Change" controls in the flow; Voice Control needs an unambiguous visible name | Visible "Change photo" on Ready, the same as Review and the letter page |
| G3 | NS-01-R5a | Keep is disabled with no words to say why | `features.photos.review.needsWords` |
| G4 | NS-09 section 16 | The Storage line's intent "One recording is still on this phone" reads as a count, and one row shows per stuck recording | "A recording you let go is still on this phone." |
| G5 | NS-14-R7 | The format of a nameless label with its date is not given | "For your child, born {date}" and "due {date}"; sheet rows to match |
| G6 | NS-15 Failed row | As built the failure shows the generic line; VOICE asks to name what did not finish | `review.date.notSaved` |
| G7 | NS-16-R2 | "kept by the parent" in the happy path has no display rule; the export carries the keeper | No keeper line on the letter page; the signature alone shows. Founder decides |
| G8 | NS-17-R5 vs D10 | R5 says one tap; D10 makes the set-aside final. A confirm is two taps; no Undo is named | One tap, then "Words set aside." with Undo for the T4 window, committing when the window closes. The confirm strings are written in case the founder prefers a confirm |
| G9 | NS-18 happy path 3 vs frame 4 | The typed-day line on Home is not one of the four registered slips, so `[FRAME-SLIP]` would fail it if drawn as a slip | Part of the prompt block, not a slip; the design lead and BL-963 confirm |
| G10 | NS-06-C2 | Existing `quickNote.widgetLabel` and `lockScreenLabel` carry `{child}` | Retire both (R) |
| G11 | NS-17 section 5 | The waiting line for a build with a spoken-language list is not named; the built line promises "a later update" | `review.otherLanguage.waiting` for those builds |
| G12 | NS-35 content inputs | `tabsJob` sentences for N2 (d to f) are owed by `content`; Book and Me are other areas' screens | Home: "I go to Home to say something to {child}." (9 words). Book and Me left to areas B and C, each 12 words or fewer, pattern "I go to <tab> to <verb> ..." |

## 19. Engineering gaps

| Gap | Backlog row it belongs to |
|---|---|
| Voice Control input labels where the VoiceOver label differs from the visible text (the switcher, the red circle). Whether React Native exposes `accessibilityUserInputLabels` is UNVERIFIED | BL-984 (accessibility floor beyond VoiceOver) |
| NS-17 has no backlog row: the mark control, the set-aside Undo or confirm, the waiting state on Review, and the "part unwritten" line all need a build row | New row after BL-987 (owner `mobile`, with `data-architect` for the held-draft null update) |
| The "part of this recording has no words" line needs the recogniser to report an unwritten stretch; no module was found that does | Same new NS-17 row |
| A `sign_as_too_long` check before Keep, with the database's code-point count shown in the counter | BL-980 |
| The 30-character counter and the photo-words cap must count the same way the database does | BL-957 |
| `review.notRemoved` needs `letItGo`'s result read on Review | BL-926 |
| The low-space line on Listen and the mid-recording space stop are not traced to code this session | BL-958 (free-space check) |
| The doorway strings need a `doorways` group in `packages/content` and a SURFACES row | BL-971 |
| Every P and C key above lands in one content PR with the founder's word approvals listed | BL-965 |
