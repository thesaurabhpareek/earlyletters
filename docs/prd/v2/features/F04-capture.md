# F04 Capture: speak or type a note or letter

| | |
|---|---|
| Release | v1.0 gate (lock-screen widget is P1 inside v1.0, first to cut) |
| Priority and rank | P0, rank 1 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent, P4 Multilingual family |
| Existing IDs | A-REQ-012, A-REQ-014, A-REQ-030, B-REQ-003, B-REQ-004, PRD-REQ-001, PRD-REQ-005, PRD-REQ-012, C-REQ-005, C-REQ-009, LEGAL-REQ-007, LEGAL-REQ-011, LEGAL-REQ-014, LEGAL-REQ-051, DATA-REQ-044, DATA-REQ-046, DATA-REQ-048, D-025, D-033, D-040, DR-01, DR-09, BL-130, BL-134, BL-135, BL-136, BL-140, BL-142, BL-272 |
| Depends on | F03 (child, signature, languages), F05 (transcription queue), F06 (Review screen), F08 (audio format, file locations), F09 (month chapters), F19 (remote config), design system (ADR 0101) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [S] Losing work is the most common complaint in the category. 41 of 104 negative or mixed reviews across 11 memory and journal products are about bugs, sync or lost entries; 9 describe work that vanished, including a 30-minute entry lost to a paste with no undo and a book lost because there was no autosave (R2 section 0 item 1, T8; R2-S10, R2-S16).
- [S] Every voice product checked has a loss story: entries lost on app switch (Qeepsake, R1-S56), data loss in voice processing (Rosebud, R1-S33), failed uploads (StoryCorps, R1-S31). FirstChapter's September release added retry and a confirm-before-discard prompt (R1 section 0 item 5; R1-S4).
- [F] Parents with a child under 6 have about 3.2 hours of leisure a day, and secondary childcare runs 4.2 to 7.7 hours a day, so capture happens in minutes, often one-handed (R2-S25, R2-S26). [S] Reviewers praise entries made while nursing and entries that take five minutes or less (R2-S13).
- [S] All 6 reviews about chronology are complaints, and one product charges a fee to backdate (R2 section 0 item 6, T25).
- [F] The current code already writes the draft row before the microphone goes live, stops and keeps the take on background, interruption and dismiss, and saves in one transaction (`apps/mobile/src/lib/capture/recorder.ts`, `apps/mobile/src/app/listen.tsx`, `apps/mobile/src/lib/store.ts` `saveLetterFromDraft`). It has no fsync, no low-storage check, no length cap, no screen keep-awake, no microphone primer and no backdating (TDD 03 section 8 M-5, M-6; `listen.tsx` read 3 Oct).
- [F] Typed text currently passes through `normalizeChars` in Review, which turns an em dash into a comma and curly quotes into straight ones (`apps/mobile/src/app/review.tsx` `cleanedText`; `packages/core/src/text.ts`). That is a machine edit on typed text, which B5 forbids.

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F04 must do for them |
|---|---|---|---|
| P1 Evening parent | After the baby is down, or mid-feed with one hand free | A phone in the dark, a sleeping baby nearby, a few minutes. Afraid of losing what they made (R2 section 5) | One tap to speak or type. Nothing lost on a call, a lock or a crash. Quiet: no sounds, no flashes (SOUND.md section 2) |
| P2 Co-parent | Their own cadence, often a longer letter at a weekend [S] UR S25, S30 | Their own phone; audio stays on it at v1.0 (B7) | The same capture flow, writing to a shared book chosen with "To {child}" |
| P3 Expecting parent | Pregnancy, third trimester [S] UR S27 | A due date, no birthday | Capture works with a due date; letters file into Before You (F09); backdating by day only |
| P4 Multilingual family | Speaking the heritage language at bedtime | One or two letter languages set at first run (F03) | A language chip on the record screen; the recording kept whatever the transcription quality (DR-01); typed letters in any script, right to left included |

## 3. What we are solving

**Outcome.** A parent can start a spoken or typed letter in one tap, in the dark, with one hand, and nothing they record or type is ever lost or changed by the app.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Recordings or typed drafts lost | Zero (gate) | 500-iteration kill-during-save run, 50-iteration kill-while-recording run, typed kill run (section 9), support tickets tagged lost content | Lab and support data; no consent needed |
| Tap Speak to microphone live | p95 500 ms on iPhone SE 3 (gate, PRD 7.1) | Perf build marker: tap to first non-silent metering sample (TDD 06 section 7.2) | Lab only |
| Local save commit, row plus hashed audio | p95 200 ms for a 2-minute take on SE 3 (gate, PRD 7.1) | Perf build marker around the transaction (TDD 06 section 7.2) | Lab only |
| Typed text lost on a kill | 500 ms of typing or less | Typed kill run (WP-F04-11) | Lab only |
| Median first launch to first saved letter | 90 s or less [A] (03 section 4.2) | TestFlight Study 1 observation and the E-01 lab script | The first letter happens before the analytics consent ask (PRD-REQ-001), so device analytics cannot see it; open question Q3 |
| Share of takes not ended by the person (background, interruption, cap, storage) | Watched, no target; a rise of 50% after a release triggers a review | `capture_ended{reason}` | Opt-in users only (about 40% [A], TRACKING_PLAN 1.2) |
| Takes recovered by the launch sweep | Watched; any `unrecoverable` count above 0 is investigated | `capture_recovered` | Opt-in users only |
| Spoken versus typed share per author | No target; answers U1 | `capture_started{mode}` | Opt-in users only |

## 4. Scope

**In v1.0**
- Entry from Tonight (Speak, Type, Not much today), from an empty month in the Book (F09), from a waiting draft on Tonight, and from a reminder notification (opens Tonight, F13).
- Lock-screen and Home Screen widget that opens capture in a Ready state (P1, first to cut).
- "To {child}" on every capture screen; change in Review before save.
- Notes and letters as two labels on the same capture; Not much today as a one-tap entry.
- Recording UI with states asking, primer, denied, ready, recording, paused, finishing; 30-minute cap with a warning at 25 minutes; pause and resume.
- Language chip on the record screen when the author has two or more letter languages (B-REQ-003, R5 section 2.4).
- Typed letters with the keyboard's own autocorrect only; stored exactly as typed (B5).
- Backdating to a past day or a month of age, free.
- Drafts that autosave and never expire.
- The durability path: draft row before the first audio byte, stop and keep on background, atomic save with SHA-256 and fsync, launch sweep, kill-during-save gate.
- Microphone permission primer, denied path, return from Settings.
- Interruptions: call, Siri, alarm, other audio apps, route change, media services reset, low storage, power loss, thermal, Low Power Mode.
- Accessibility: VoiceOver, AX5, Reduce Motion, one-handed reach, dark room.
- Hand-off to F05 transcription and F06 Review, including the model-not-ready path.

**Later**
| Item | Release | Why later |
|---|---|---|
| Siri and Shortcuts through App Intents | v1.1 candidate | R4 section 9 found no Expo path on the SDK 57 widgets page and did not read Apple's pages (Unverified); it needs a native module and a spike; starting a recording from an intent has background-audio rules not checked |
| Control Center control (iOS 18) | v1.1 candidate | Not on the SDK 57 widgets page; needs a custom native target or a community library (R4 section 9, Unverified) |
| Recording that continues while the phone is locked | Later, only after counsel review | LEGAL-REQ-011 requires stop on background unless counsel reviews a designed background feature; app.config.ts sets `enableBackgroundRecording: false` |
| Live Activity for an active recording | Later, with background recording | Recording stops when the phone locks, so a lock-screen activity would show nothing live |
| Several takes in one letter | Later | One audio file per letter keeps transcription, playback and export simple at v1.0 |
| Import existing voice memos with their original dates | v1.1 candidate | Dearest does it (R1 F04, R2-S7); new file-picker and permission surface |
| Live captions while recording | Later | Streaming ASR is premature for v1 (TDD 03 section 9.1) |
| Per-author default of note or letter (`entry_default`) | Later | PRD B section 5 proposes it; one default is enough at launch |
| Battery-level warning while recording | Later | No battery API installed; power loss is handled like a kill (F04-U15) |

**Never**
- Voice processing, gain or noise suppression on the recording being captured. The original is never altered (B6, DR-09 default A). A quieter listening copy is made after save (F08).
- Any machine edit of typed text, including punctuation or character normalisation (B5).
- Recording that starts without an in-app tap on Speak, Start or Continue (LEGAL-REQ-011).
- Recording in the background (LEGAL-REQ-011).
- Speaker identification, voiceprints or diarization (LEGAL-REQ-019).
- Streaks, counts of missed days, or nudges inside capture (C-REQ-005).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| FirstChapter | 30-second voice notes; v1.0.6 added retry, background upload and confirm before discarding a recording [F] R1-S4 | No US average yet [F] R1-S4 | n/a | **Match** confirm before discard. Retry is moot: nothing uploads at v1.0 (B7) |
| Day One | Audio up to 3 hours, transcription limited to 10 minutes, up to 30 recordings per entry, Siri Shortcuts [F] R1-S60, R1-S6 | 4.8 (118K) [F] R1-S6 | n/a | **Match** a generous cap; we choose 30 minutes for one take, bounded by on-device transcription (section 11) |
| Remento | Recordings up to 30 minutes [F] R1-S13 | 4.8 (1,738) [F] R1-S15 | Elders record on their own [S] R2-S22, R2-S23 | **Match** 30 minutes |
| StoryCorps | Interviews stop automatically at 45 minutes [F] R1-S30 | 4.6 (1.6K) [F] R1-S31 | Earlier versions lost uploads [S] R1-S31 | **Avoid** silent hard stops: warn 5 minutes before the cap and keep everything |
| Then | 60-second limit [F] R1-S68 | Too new | n/a | **Avoid** short caps for letters |
| Huckleberry | Lock-screen Live Activities, voice logging, Siri, widgets [F] R1-S11 | 4.9 (74K) [F] R1-S11 | Easy hand-offs between caregivers [S] R1-S11 | **Match** a widget (P1). No Live Activity while recording stops on lock |
| Apple Voice Memos | Built-in recorder with transcription and Enhance [F] R1-S64 | 4.8 (1.1M) [F] R1-S64 | Some reviewers say recording stops when the screen locks [S] R1-S64 | **Innovate within the law**: keep the screen awake while recording so Auto-Lock never ends a take, and keep what exists if the parent locks the phone |
| Qeepsake | Answers by SMS or app [F] R1-S1 | 4.9 (15K) | Entries disappear when switching apps unsaved [S] R1-S56; charges to backdate [S] R2 section 2.3, T25 | **Avoid**: autosave typed text continuously; backdating free |
| Rosebud | Text and voice entries [F] R1-S33 | 4.9 (3.3K) | Occasional data loss in processing [S] R1-S33 | **Avoid**: audio saved before any processing |
| From, Mama | Typing or hands-free dictation; audio and selfie video notes [F] R1-S20 | 4.9 (48) | n/a | Video out of scope for v1.0 |
| Dearest | Home Screen widgets; imports voicemails and files with original dates [F] R1-S3 | 5.0 (1) | n/a | **Match later**: import is a v1.1 candidate |
| Tiny Treasures | Family phone line; CarPlay recording [F] R1-S67 | 5.0 (7) | Reviewers love keeping relatives' voicemails [S] R1-S67 | **Later** (P5 is v1.1) |

## 6. Experience

### 6.1 Entry points

| Entry | Where | Opens | Carries | Notes |
|---|---|---|---|---|
| Speak | Tonight CaptureBar (`tonight.speakButton`) | `/listen` | active child, `promptKey` of the shown prompt, `kind = letter` | Exists in `(tabs)/index.tsx` |
| Type | Tonight CaptureBar (`tonight.typeButton`) | `/write` | same | Exists |
| Not much today | Tonight, quiet button (`tonight.notMuchButton`) | Saves inline | weekday, child | Exists; rules change (F04-REQ-016) |
| Prompt card | Tonight (`tonight.promptLabel`) | No action of its own at v1.0 | Its prompt rides on Speak or Type | "Another thought" (`tonight.newPromptButton`) changes it |
| Waiting draft row | Tonight (`pendingCopy.tonight.waitingTitle`) | `/review` for audio, `/write` for typed | `draftId` | Exists; one row per waiting draft (F04-REQ-027) |
| Empty month in the Book | F09 chapter empty state | `/write` or `/listen` | `occurredOn` preset to the start of that month of age, `occurredPrecision = month` | F09 owns the button; F04 accepts the params |
| Reminder notification | F13 | Tonight | none | Never opens a live recording (F04-REQ-021) |
| Widget (P1) | Lock Screen accessory (circular, rectangular) and Home Screen small, via `expo-widgets` (R4-S61) | `/listen?entry=widget` in the Ready state | `kind = note` | Static: no child name, no data in the widget (F04-REQ-020) |
| Siri, Shortcuts, Control Center | n/a | n/a | n/a | Later (section 4) |

### 6.2 Happy paths

**A. First spoken letter on this install (microphone not yet asked).**

| Step | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Speak on Tonight | Listen opens as a full-screen modal with no entrance animation on the buttons (MOTION principle 2) | Guards against a second tap for 500 ms. Reads microphone permission: undetermined |
| 2 | Reads the primer | Primer: title `listen.primer.title` (new), body `listen.primer.body` (new), the recording-consent line `listen.primer.othersLine` (new), button `common.continueButton` | Sets `capture.micPrimerSeen = 1` when Continue is tapped |
| 3 | Taps Continue, then Allow in the iOS prompt | iOS prompt with the purpose string `permissions.microphone` (revised, F04-REQ-022) | On grant: haptic `press` before the session activates; `setAudioMode('recording')`; `prepareToRecordAsync`; draft row written with state `recording`, file path, child, prompt, kind, language; then `record()`; keep-awake on |
| 4 | Talks | Top: "To {child}" (`children.switcher.toLabel`), audience line (`pendingCopy.listen.audience`), the prompt text in muted type if the take started from a prompt, language chip if two or more languages. Centre: listening aura, elapsed time. State line `tonight.states.listening` with hint `tonight.states.listeningHint`; after 8 s below -50 dBFS, `tonight.states.stillHere` | Elapsed time written to the draft every 5 s; free space checked every 30 s; VoiceOver hears "Listening" once and the elapsed time once a minute (`pendingCopy.listen.elapsedA11y`) |
| 5 | Taps Finish (`tonight.states.stopButton`) | Aura moves to processing; buttons disabled | Recorder stops; file fsynced and hashed (SHA-256) natively once BL-140 lands; draft state `ready` with duration, bytes and hash in one statement; `setAudioMode('idle')`; keep-awake off; haptic `press` after the session ends |
| 6 | Reads it back | Review opens (`review.title`), owned by F06. Transcription runs from the queue (F05). If the model is not ready: `pendingCopy.review.waitingTitle` and `pendingCopy.review.waitingBody` with `pendingCopy.review.voiceOnlyButton` | Hand-off contract in section 11.4 |
| 7 | Chooses note or letter if needed, the date if not today, the child if wrong, then Add to the book or Keep private | Kind control (`tonight.noteOrLetter.*`), date row (`review.date.*`, new), "To {child}" picker, destination buttons (`review.destination.addButton`, `review.destination.privateButton`) | One local transaction inserts the entry with the draft's id and deletes the draft (DATA-REQ-048). Success haptic, then the settle animation (MOTION 5e) |

**B. Spoken letter, permission already granted.** Steps 2 and 3 are skipped. Step 1 goes straight to recording. The haptic fires before the session activates.

**C. Typed letter.**
1. Taps Type. Write opens with the dateline, the prompt if any, and the field with placeholder `tonight.typing.letterPlaceholder`.
2. Types with the iOS keyboard. Autocorrect, dictation key and predictive text are the keyboard's own; the app adds nothing (B5).
3. Every pause of 500 ms writes the draft (`setDraftTyped`); the status line shows `pendingCopy.write.savedOnPhone`. Leaving the foreground writes immediately.
4. Taps Save (`tonight.typing.saveButton`). Review opens with the text exactly as typed, `edit_level = verbatim`, no machine edits, and no transcription.
5. Saves as in A step 7.

**D. Not much today.**
1. Taps Not much today.
2. The app saves one `not_much` entry for the active child and today's local date, private, with the template text `notMuch.template` (weekday from `Intl.DateTimeFormat` in the device locale, D-028).
3. Haptic `soft`. The button is replaced by `notMuch.savedToast` with Undo (`common.undoButton`). Undo tombstones the entry.
4. Until local midnight the button shows the kept state for that child; a second entry for the same child and date is never created.

**E. Backdated letter.** In Review the date row reads `review.date.today` (new). Tapping it opens a sheet with two tabs, `review.date.dayTab` and `review.date.monthTab` (new). Day uses the installed `@react-native-community/datetimepicker`, bounded by section 6.3 F04-U36. Month lists Before You (`book.beforeYouChapter`), The first weeks (`book.chapterNewborn`) and Month 1 to the current month (`book.chapterTitle`). Choosing a month stores the first day of that month of age with `occurred_precision = month`.

**F. Widget note (P1).** Taps the widget. The app opens Listen in the Ready state: `tonight.states.ready`, `tonight.states.readyHint`, a 64 pt Start button (`listen.startButton`, new). Taps Start. Recording begins as in A step 3. The draft carries `kind = note`.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F04-U01 | First Speak tap, permission undetermined | Primer before any OS prompt; no draft, no file | Primer screen | Continue shows the OS prompt | Unit (reducer); E2E E-01 |
| F04-U02 | Permission denied (now or earlier) | No OS prompt is repeated; no draft, no file | `errors.micDenied.title`, `.body`, buttons `.typeButton`, `.settingsButton`, `common.closeButton` | Type instead opens Write with the same prompt and kind | Unit; LEGAL-REQ-007 manifest lint; manual M-script |
| F04-U03 | Permission granted later in iOS Settings, person returns | On AppState `active`, permission is read again | The denied card changes to the Ready state with Start | One tap on Start records | Manual script |
| F04-U04 | Permission restricted (Screen Time or device management) | Treated as denied | Same as U02 | Type instead | Manual script |
| F04-U05 | App leaves the foreground mid-take (home swipe, app switcher, another app opened) | On AppState `background`: stop, fsync, hash, draft `ready` within 1 s; `inactive` alone does nothing | On return: Review with `listen.keptSoFar` (new) above the transcript | Save, or record a new letter for the rest | E2E E-05; LEGAL-REQ-011 |
| F04-U06 | Side button locks the phone mid-take | Same as U05 [A] that a lock moves the app to the background; verified in WP-F04-01 | Same as U05 after unlock | Same | Manual script on SE 3 |
| F04-U07 | Auto-Lock would fire during a long take | Keep-awake is on while recording, and while paused for up to 5 minutes | Screen stays on in the theme's dark surfaces | None needed | Device test: 6-minute take with Auto-Lock at 30 s |
| F04-U08 | Incoming call, answered or declined | The recorder stops capturing; the existing poll (`recorder.isRecording` false after it was true) or `hasError` marks an interruption; stop and keep | After the call: Review with `listen.keptSoFar` | Save; a new letter for the rest | Manual script; TDD 03 FM-1 |
| F04-U09 | Siri invoked | As U08 | As U08 | As U08 | Manual script |
| F04-U10 | Alarm or timer fires | As U08 | As U08 | As U08 | Manual script |
| F04-U11 | Another app takes the audio session (FaceTime, a video call) | As U08 | As U08 | As U08 | Manual script |
| F04-U12 | AirPods disconnect or input route changes | If the recorder keeps running, nothing changes. If it stops, the poll catches it and U08 applies. The take never ends silently | Nothing, or Review as U08 | As U08 | Manual script with AirPods |
| F04-U13 | Media services reset | `mediaServicesDidReset` in recorder status; stop and keep (exists in `listen.tsx`) | Review | Save | Unit with a fake status |
| F04-U14 | App killed or crashes mid-take | Draft row with state `recording` exists. Launch sweep after first frame: file with bytes is hashed and marked `ready` with `recovered_at`; empty file is kept as `unrecoverable`; no file drops the row (`sweep.logic.ts`) | Tonight shows the waiting row; Review opens it | Save, or Let it go | Kill-while-recording run, 50 iterations (F04-REQ-024) |
| F04-U15 | Battery dies or power is lost mid-take | As U14 | As U14 | As U14 | Covered by U14 |
| F04-U16 | Killed during save | One transaction: either the entry exists with its hash and file, or the draft is intact. Never both, never neither, never a row pointing at a missing file | The letter, or the waiting row | Re-open and save | Kill-during-save run, 500 iterations (PRD 7.4, BL-135) |
| F04-U17 | Free space under 1 GB when Speak is tapped | Recording starts as normal | A quiet line on Listen: `capture.storageLowLine` (new) | Free space later; typed letters never blocked | Integration with a fake free-space reader |
| F04-U18 | Free space under 50 MB when Speak is tapped | No draft, no recording | Card: `errors.storageLow.title`, `errors.storageLow.body` (revised), Type instead | Type instead, or free space | Integration |
| F04-U19 | Free space drops under 20 MB during a take | Stop and keep at the next 30 s check | Review with `capture.storageStoppedLine` (new) | Save; free space | Integration |
| F04-U20 | Take reaches 25:00 | Warning line and one VoiceOver announcement | `capture.nearLimitLine` (new) | Keep talking or Finish | Unit (reducer); integration with a fake clock |
| F04-U21 | Take reaches 30:00 (`capture_max_minutes`) | Stop and keep | Review with `capture.limitReachedLine` (new) | Save; a new letter for more | Integration with a fake clock |
| F04-U22 | Navigation away or swipe-dismiss while recording | Listen blocks the back gesture (`gestureEnabled: false` in `_layout.tsx`); any unmount still finalizes and keeps (`useLayoutEffect` cleanup) | Review or Tonight with the waiting row | Save | Unit; E2E |
| F04-U23 | Speak tapped twice fast, or Speak then the widget | One Listen screen; a second start is refused while `activeTakeId()` is set | One recording | n/a | Unit; E2E double tap |
| F04-U24 | Finish tapped twice, or Finish and background at once | `finalizeTake` is idempotent per draft (exists) | One Review | n/a | Unit |
| F04-U25 | Paused longer than 5 minutes | Keep-awake released; if the phone then locks, U06 applies | Paused state | Keep talking, or Finish | Unit (reducer) |
| F04-U26 | Let it go tapped by mistake | Confirm dialog `pendingCopy.listen.discardTitle`, `.discardBody`, `.keepButton`, `.discardConfirm` | Dialog | Keep it | Unit; E2E |
| F04-U27 | Speech model not downloaded, or transcription unavailable | Capture is never blocked. Review shows the waiting card and Keep the recording only (F05, TDD 03 FM-9) | `pendingCopy.review.waitingTitle`, `.waitingBody`, `.voiceOnlyButton` | Words arrive later (F05); or type them | E2E E-04 |
| F04-U28 | Thermal state serious or critical | Recording continues; the transcription queue pauses (F05, TDD 03 section 3.5.4) | Nothing new on Listen | n/a | Manual |
| F04-U29 | Low Power Mode | Recording continues; iOS may mute haptics (MOTION section 6), so every haptic already pairs with a visible change | Same screens | n/a | Manual |
| F04-U30 | VoiceOver on | "Listening" announced at start, "Paused" on pause, elapsed time each minute, the 25-minute line once; Magic Tap toggles pause [A] (F04-REQ-019) | Same screens | n/a | VoiceOver script V1 (TDD 09) |
| F04-U31 | AX5 text size | Pause and Finish stack vertically; clock, state line and "To {child}" wrap; nothing truncates | Stacked layout | n/a | L3 visual regression at AX5 (TDD 09) |
| F04-U32 | Reduce Motion on | Aura shows the stepped ring; screen changes use 200 ms fades (MOTION section 4) | Static ring | n/a | Component test |
| F04-U33 | App killed 300 ms after the last keystroke | Draft holds text up to the last 500 ms debounce or the background flush | Waiting typed draft on Tonight | Open and continue | Typed kill run |
| F04-U34 | Write closed with an empty field | Empty typed draft removed; a draft with audio is always kept (exists in `write.tsx`) | Tonight | n/a | Unit |
| F04-U35 | Typed text with emoji, curly quotes, em dashes, Devanagari, Arabic or Chinese | Saved exactly as typed; no `normalizeChars`, no `faithfulClean` | The same characters in Review and the Book | n/a | Unit: byte-equality round trip (F04-REQ-012) |
| F04-U36 | Backdate to a future date | Not offered: the picker maximum is today's local date | Picker stops at today | n/a | Unit (`backdate.ts`) |
| F04-U37 | Backdate before birth for a born child, or any date for an expecting child | Allowed down to the lower bound (F04-REQ-015); the letter files into Before You (F09); the month tab is hidden for an expecting child | Picker | n/a | Unit |
| F04-U38 | Take started at 23:59 and finished after midnight, or across a time-zone change | `occurred_on` is the local date when the take started (draft `created_at`) | Today's date as of the start | Change the date in Review | Unit |
| F04-U39 | Recorded to the wrong child | "To {child}" changes the draft's child in Review before save (`setDraftChild`) | Whose book sheet | Pick the right child | E2E E-06 |
| F04-U40 | Book hidden or deleted on another device while recording | The draft keeps its child id; save is local and succeeds; if sync later rejects it, the write moves to `rejected_writes` and stays exportable (DATA-REQ-043) | The letter saves | Export or move later (F16) | Integration with a fake sync rejection |
| F04-U41 | Signed out, lapsed, or in the 30-day deletion grace | Capture works in every plan and account state (A-REQ-014, LEGAL-REQ-050); after deletion executes, the device wipes (DATA-REQ-023) | Normal capture | n/a | E2E with a lapsed fixture |
| F04-U42 | Not much today tapped again the same day for the same child | No second entry | The kept state | Undo while the toast is visible | Unit |
| F04-U43 | Not much today tapped by mistake | Undo tombstones the entry | Toast with Undo, persists until dismissed (DESIGN_LANGUAGE section 11 rule 5) | Undo | Unit |
| F04-U44 | Audio file missing at save (removed outside the app, storage fault) | `AudioMissingError`; nothing saved; draft kept (`saveLetterFromDraft`) | `errors.generic.title`, `errors.generic.body`; Review offers Type the words and Let it go | Type the words (capture mode `mixed`) or let it go | Unit (exists) |
| F04-U45 | Over-the-air JS update arrives mid-take | Updates apply only on the next cold start (TDD 06 FM-R18) | Nothing | n/a | Release checklist |
| F04-U46 | iOS update moves the app container | Sweep rebases stored paths by file name (`sweep.logic.ts`) | Nothing | n/a | Unit (exists in `test/sweep.test.ts`) |
| F04-U47 | Language chip set to a language whose pack has not passed its gate (Arabic at v1.0, DR-01 A) | Recording kept; Review offers Type the words; no transcript attempted (F05) | Waiting card | Type the words | E2E with a gated-language fixture |
| F04-U48 | Recorder cannot start (microphone in use by a call, `prepareToRecordAsync` throws) | If no draft exists: card `capture.micBusyTitle` and `capture.micBusyBody` (new) with Type instead. If a draft exists: finalize and keep | Card or Review | Try again after the call, or type | Unit with a throwing fake |
| F04-U49 | Offline | Capture, Review, save, Not much today all work; zero network requests | Normal | n/a | E2E E-01 proxy log |
| F04-U50 | Co-parent records a letter in a shared book | Same capture on their own phone; the audio stays on that phone (B7); the text syncs after save and sign-in (F16) | Normal capture. The other parent later sees the F08 line for a recording kept on another phone | n/a | E2E with two signed-in fixture devices (F11) |
| F04-U51 | Two children and the active child changes on another screen while Listen is open | The draft keeps the child it started with; Review shows that child | "To {child}" of the draft | Change in Review | Unit |
| F04-U52 | Dark room, system dark mode | Listen opens on dark surfaces with no white frame; keep-awake never changes brightness | Dark screen | n/a | Snapshot of the first frame of the modal transition |

### 6.4 Copy

Existing keys are in `packages/content/src/strings.en.ts` or `apps/mobile/src/lib/copy.ts` `pendingCopy`. New strings go in `apps/mobile/src/components/capture/copy.ts` until the content agent moves them (brief rule). Proposed text follows `packages/content/VOICE.md` and the content rule tests; content and counsel own the final words.

| Key | Status | Proposed text |
|---|---|---|
| `children.switcher.toLabel` | Exists | To {child} |
| `pendingCopy.listen.audience` | Pending | Only you, until you add it to the book. |
| `tonight.states.listening`, `.listeningHint`, `.stillHere`, `.paused`, `.resumeButton`, `.stopButton`, `.ready`, `.readyHint` | Exist | as in content |
| `listen.primer.title` | New | Your voice, kept with each letter |
| `listen.primer.body` | New | Next, your iPhone asks to use the microphone. We only listen while you are recording. |
| `listen.primer.othersLine` | New | If someone else is talking nearby, ask them first. |
| `listen.startButton` | New | Start |
| `listen.keptSoFar` | New | The recording stopped early. Everything you said is kept. |
| `capture.storageLowLine` | New | This phone is nearly full. Recording still works. |
| `capture.storageStoppedLine` | New | The phone ran out of room, so the recording stopped here. Everything you said is kept. |
| `capture.nearLimitLine` | New | {n} minutes left in this recording. |
| `capture.limitReachedLine` | New | That is as long as one recording can be. Everything you said is kept. Start a new letter to keep going. |
| `capture.micBusyTitle` | New | The microphone is busy |
| `capture.micBusyBody` | New | A call or another app is using it. Try again in a moment, or type instead. |
| `review.date.label` | New | When was this? |
| `review.date.today` | New | Today |
| `review.date.dayTab` | New | A day |
| `review.date.monthTab` | New | A month |
| `widget.startLabel` | New | Start a note |
| `errors.storageLow.body` | Revise (today it suggests backup, which v1.0 does not have) | New recordings may not fit. Freeing some space will help. Typing always works. |
| `permissions.microphone` | Revise (Q2) | {app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone and in your iPhone's own backup, if you use one. |
| `notMuch.template`, `notMuch.savedToast` | Exist | as in content |

`quickNote.widgetLabel` and `quickNote.lockScreenLabel` exist but carry `{child}`, which a static widget cannot fill and D-025 keeps off the lock screen by default; the widget uses `widget.startLabel`. The microphone string's backup clause depends on D-033; if the founder keeps recordings out of device backup, the clause is removed.

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria (Given / When / Then) | Source |
|---|---|---|---|---|
| A-REQ-012 | P0 | A first letter needs no sign-in | Given a fresh install past the 18+ gate and first run, When the person records and saves, Then no sign-in screen appeared and one `entries` row exists | PRD A |
| A-REQ-014 | P0 | Capture works without an account | Given Later on the Keep the book sheet, When the person records, types and saves 3 letters, Then all 3 rows exist and no sign-in screen appears during capture | PRD A |
| A-REQ-030 | P0 | Capture works offline | Given airplane mode, When the person records, saves a voice-only letter, types and saves a letter and taps Not much today, Then all succeed and the proxy log shows 0 requests | PRD A, PRD 7.4 |
| B-REQ-004, PRD-REQ-012 | P0 | "To {child}" is visible on Listen, Write and Review and changeable in Review before save | Given two children, When recording, Then `children.switcher.toLabel` filled with the draft's child is on screen; When the person picks the other child in Review and saves, Then the entry's `child_id` is the chosen child and the first child has no new row. Given one child, Then no chevron or picker shows | PRD B, PRD 3.4 |
| LEGAL-REQ-007 | P0, Rev (B7, D-033) | Microphone asked only at first Speak, after an in-app primer; purpose string matches v1.0 facts | Given a fresh install, When the person reaches Tonight, Then no OS prompt has appeared. Given first Speak, Then the primer shows before the OS prompt. Given the built Info.plist, Then `NSMicrophoneUsageDescription` does not mention backup, sharing with family or cloud transcription, and no speech-recognition key exists | LEGAL-REQ-007; B7 |
| LEGAL-REQ-011 | P0 (raised from P1 for capture) | Stop and keep on background; never auto-start; recording-consent line; no background recording | Given recording, When the app goes to the background, Then within 1 s the draft is `ready` with a hash and Review opens on return. Given the built Info.plist, Then `UIBackgroundModes` has no `audio`. Given the primer, Then `listen.primer.othersLine` is visible. Given a widget or notification launch, Then no audio session is set to recording until an in-app tap | LEGAL-REQ-011; PRD 6.3 checklist |
| DATA-REQ-048 | P0 | Atomic local save | Given 500 scripted kills at random offsets during save on Simulator and 50 on an SE 3, Then every iteration ends with exactly one of: an entry whose `audio_sha256` matches its file, or an intact draft with its file; 0 rows point at a missing file; `PRAGMA integrity_check` returns ok | DATA-REQ-048; PRD 7.4; BL-135 |
| DATA-REQ-046 | P0 | Audio hashed when recording stops | Given a finished take, Then the draft holds a 64-character SHA-256 and byte size before state `ready`. Given a draft without a hash, When saved, Then the hash is computed before the transaction (`ensureAudioHash`) | DATA-REQ-046 |
| DATA-REQ-044 | P0 | Idempotent saves | Given a draft, Then its UUIDv7 id becomes the entry id. Given a save retried twice, Then one `entries` row exists | DATA-REQ-044 |
| LEGAL-REQ-014 | P0 | No content from capture leaves the phone in logs, analytics or crash reports | Given the E2E run with the Asha fixture letter spoken and typed, When device logs and analytics payloads are scanned, Then 0 matches for the fixture strings, child name or language name | LEGAL-REQ-014; B-NFR-001 |
| F04-REQ-001 | P0 | Draft row before the first audio byte | Given Speak with permission granted, When `record()` is called, Then a `drafts` row with state `recording` and the file path already exists (assert in the reducer test and an integration test with a fake recorder that records call order) | Brief M2; TDD 01 section 3.4 rule 1 |
| F04-REQ-002 | P0 | Elapsed time persisted during a take | Given a 60 s take, Then `audio_duration_ms` on the draft is updated at least 11 times; Given a kill at 47 s, Then the recovered draft shows a duration between 45 s and 47 s | `listen.tsx` 5 s progress write |
| F04-REQ-003 | P0 | Any OS interruption stops and keeps the take | Given recording, When the recorder reports not recording after it was recording, or `hasError`, or `mediaServicesDidReset`, Then the take is finalized once and Review opens. Never auto-resumes | TDD 03 FM-1; section 11.5 deviation |
| F04-REQ-004 | P0 | Launch recovery never deletes audio | Given drafts in state `recording` at launch, Then the sweep finalizes files with bytes, keeps empty files as `unrecoverable`, drops only rows with no file, and deletes 0 audio files. Given a draft in state `discarding` (F04-REQ-009), Then the sweep removes the row | `sweep.logic.ts`; BL-134 |
| F04-REQ-005 | P0 | Screen kept awake while recording | Given Auto-Lock at 30 s, When a take runs 6 minutes with no touch, Then the take is still recording at 6:00. Given paused for 5 minutes, Then keep-awake is released | R1 F04 (Voice Memos lock signal); section 11 |
| F04-REQ-006 | P0 | 30-minute cap with a warning at 25 minutes; nothing lost at the cap | Given a fake clock, When elapsed reaches 25:00, Then `capture.nearLimitLine` shows and one VoiceOver announcement fires; When it reaches 30:00, Then the take stops, is hashed and Review opens with `capture.limitReachedLine`. Given remote config `capture_max_minutes` of 20, Then the cap is 20:00 and the warning 15:00. Values outside 5 to 30 are clamped | R1 F04 (StoryCorps, Remento); TDD 03 section 3.4 |
| F04-REQ-007 | P0 | Pause and resume in one file | Given recording, When Pause, Then the clock stops, the aura shows paused and `tonight.states.paused` is announced; When Keep talking (`tonight.states.resumeButton`), Then recording continues into the same file and the final duration excludes paused time | `listen.tsx` |
| F04-REQ-008 | P0 | Storage thresholds | Given free space under 1 GB, When Speak, Then recording starts and `capture.storageLowLine` shows. Given under 50 MB, Then no draft is created and the storage card shows. Given a drop under 20 MB mid-take, Then the take stops and is kept within 30 s. Typed letters are never blocked | PRD 7.7; TDD 03 section 3.2 rule 5 |
| F04-REQ-009 | P0 | Audio is deleted only by a confirmed Let it go | Given any draft with audio on Listen, Review or the Tonight row, When Let it go is confirmed, Then the draft moves to state `discarding`, the file is deleted, then the row is deleted. Given a kill between steps, Then the sweep never re-attaches that file and removes the row. No other code path deletes a draft's audio | `listen.tsx`; DATA-REQ-048; FirstChapter (R1-S4) |
| F04-REQ-010 | P0 | One take at a time | Given a take is live, When Speak, the widget or a deep link asks for another, Then no second recorder starts and the live Listen screen stays in front | `recorder.ts` `activeTakeId` |
| F04-REQ-011 | P0 | Typed text autosaves | Given typing, Then the draft is written 500 ms after the last keystroke and immediately on AppState `inactive` or `background`. Given the typed kill run of 100 iterations, Then at most the last 500 ms of typing is lost in every iteration | R2 section 6 F04; `write.tsx` |
| F04-REQ-012 | P0 | Typed text is stored exactly as typed (B5) | Given typed text containing an em dash, curly quotes, an ellipsis character, an emoji, Devanagari and Arabic, When saved, Then `raw_transcript` and `final_text` equal the typed string after removing only leading and trailing whitespace; `edit_level = verbatim`; `machine_edits = []`; `normalizeChars` and `faithfulClean` are not called on typed drafts | B5; `review.tsx` |
| F04-REQ-013 | P0 | Write respects the keyboard and any script | Given Write, Then the TextInput keeps the system defaults for autocorrect, spell check and capitalisation (no prop turns them off) and adds no suggestion bar of ours. Given an Arabic keyboard, Then text aligns right and the caret moves right to left (manual script) | B4, B5; DR-01 A (typed Arabic) |
| F04-REQ-014 | P0 | Note or letter is a label chosen in Review | Given Speak or Type from Tonight, Then the draft `kind` is `letter`; Given the widget, Then `note`. Given Review, Then a two-option control (`tonight.noteOrLetter.note`, `tonight.noteOrLetter.letter`) shows the draft kind preselected; the saved entry's `kind` matches the control. `not_much` is never offered in the control | BRAND.md naming system |
| F04-REQ-015 | P0 | Backdating to a day or a month, free | Given a born child, Then the day picker allows any date from 3 years before the birthday to today; the month tab lists Before You, The first weeks, and Month 1 to the current month. Given a month choice, Then `occurred_on` is the first day of that month of age and `occurred_precision = month`. Given an expecting child, Then only the day tab shows, bounded from 3 years before the due date to today. Never a Plus check | R2 T25, UR R10 |
| F04-REQ-016 | P0 | Not much today in one tap | Given a tap, Then one `not_much` entry for the active child and local date is saved private in under 100 ms with haptic `soft` and `notMuch.savedToast` plus Undo. Given a second tap that day for that child, Then no new row. The weekday comes from `Intl.DateTimeFormat` in the device locale | BRAND.md; C-REQ-005; D-028 |
| F04-REQ-017 | P0 | Language chip on Listen | Given an author with two or more letter languages (F03), Then a chip shows the current language and a tap opens the list of the author's languages; the value at Finish is stored on the draft `language`. Given one language, Then no chip. Never auto-detected | B-REQ-003; R5 section 2.4 |
| F04-REQ-018 | P0 | Model state never blocks capture | Given no model on the phone, When Speak, Then recording starts with the same latency and Review shows the waiting card with Keep the recording only | TDD 03 FM-9; PRD 7.4 |
| F04-REQ-019 | P0 | Capture is fully accessible | Given VoiceOver, Then the swipe order on Listen is "To {child}", audience line, prompt, elapsed time, state, language chip, Pause, Finish, Let it go; the aura is hidden from accessibility; starting, pausing and resuming are announced; Magic Tap toggles Pause [A]. Given AX5, Then nothing truncates and buttons stack. Given Reduce Motion, Then only fades and the stepped ring. Pause and Finish sit in the bottom third at 56 pt or taller; Speak and Type at 64 pt | LEGAL-REQ-051; A-NFR-005; DESIGN_LANGUAGE section 1 principle 2; TDD 09 |
| F04-REQ-020 | P1 | Widget opens capture safely | Given the widget tapped, Then Listen opens in Ready state and nothing records until Start is tapped. The widget shows no child name and reads no app data | R4-S61; D-025; 02 section 6 item 5 |
| F04-REQ-021 | P0 | Notifications never open a live recording | Given a reminder tapped, Then Tonight opens and the audio session stays idle | LEGAL-REQ-011 |
| F04-REQ-022 | P0 | Denied path and return from Settings | Given denied, When Speak, Then the denied card shows and no OS prompt appears. Given the person enables the microphone in Settings and returns, Then within 1 s of AppState `active` the card becomes the Ready state | LEGAL-REQ-007 |
| F04-REQ-023 | P0 | Fast start | Given an SE 3 with permission granted, When Speak is tapped 200 times in the perf build, Then tap to first non-silent metering sample is p95 500 ms or less | PRD 7.1 |
| F04-REQ-024 | P0 | Kill while recording is measured and recovered | Given 50 kills at random points 10 s to 120 s into a take on an SE 3, Then 50 of 50 takes have a row after relaunch, 0 files are deleted, and at least 49 of 50 play back to within 5 s of the kill point. If fewer than 49 play, the founder decides on the ADTS fallback before beta C1 (section 11.6) | TDD 03 section 3.2 rule 4, R-4 |
| F04-REQ-025 | P0 | One audio session, restored after capture | Given recording, Then the session uses `doNotMix` with recording allowed (`audio-mode.ts`); Given Finish, discard, background or interruption, Then the mode returns to `idle` within 500 ms. No UI sound plays while the recorder is armed or live (SOUND.md section 3 rule 1) | `audio-mode.ts`; SOUND.md |
| F04-REQ-026 | P0 | No processing of the captured signal | Given the recorder options, Then no voice processing, gain or noise suppression is enabled; the file on disk is the recorder's output, byte for byte, until save | B6; DR-09 default A |
| F04-REQ-027 | P0 | Every waiting draft is reachable | Given 3 waiting drafts for the active child, Then Tonight shows 3 rows newest first, each opening its draft. Drafts never expire and never sync | `listDrafts`; TDD 01 section 3.2.6 |
| F04-REQ-028 | P0 | Calm in a dark room | Given system dark mode, When Listen opens, Then the first rendered frame uses dark tokens (no white frame); no UI sound plays (SOUND.md section 2 default off); keep-awake does not change screen brightness; the only haptics are `press` before the session starts and after it ends | DESIGN_LANGUAGE section 1 principle 2; SOUND.md; MOTION 5b |
| F04-REQ-029 | P0 | The draft keeps its child | Given Listen open for child A, When the active child changes to B elsewhere, Then the draft's `child_id` stays A until the person changes it in Review | PRD-REQ-012 |
| PRD-REQ-001 | P0 | Capture never stacks asks | Given Listen, Write or Review is open, Then no Keep the book, reminder or analytics sheet appears. The microphone primer is the act itself and does not count as the session's ask | PRD 3.4 |
| PRD-REQ-005 | P0 | No child-input capture | Given the `child-input` flag off, Then no `together` prompt and no "Write one together" entry is reachable from Tonight, Listen or Write | PRD 3.4 |

## 8. Data, privacy and security

| Data | Level (PRD 7.10) | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| Recording file (AAC-LC mono M4A, F08) | L4 | App Documents folder (`directory: 'document'` in `listen.tsx`), in the user's own device backup if they use one [Unverified until BL-284, D-033] | The author's app on this phone | Until the person lets it go (draft) or the letter is purged (F08) | No (B7). Only through the person's own share sheet in export (F15) |
| `drafts.typed_text`, `drafts.raw_transcript` | L4 | Local SQLite `scribe.db` | Author | Until saved or let go; never expire | Never (drafts never sync, TDD 01 section 3.2.6) |
| `drafts.audio_uri` | L3 | Local SQLite | Author | As above | Never |
| `drafts.state`, `audio_sha256`, `audio_bytes`, `recovered_at` (exist in migration 3) | L2, L4 for the hash (derived from content, TDD 03 section 4.1) | Local SQLite | Author | As above | Never |
| `drafts.kind`, `drafts.occurred_precision` (new) | L2 | Local SQLite | Author | As above | Never |
| `drafts.occurred_on` (new) | L3 | Local SQLite | Author | As above | Never |
| `drafts.language` (new) | L4 (languages are L4, PRD 7.10) | Local SQLite | Author | As above | Never |
| `entries.occurred_precision` (new), `entries.language` (new) | L2, L4 | Local SQLite, then Postgres through sync (F16) | Author; book members see the date precision, never the language in analytics | Life of the letter | With the letter, after sign-in and sensitive-data consent (LEGAL-REQ-006) |
| `not_much` entry text | L4 | Local SQLite | Author; members if added to the book | Life of the entry | As a letter |
| Settings `capture.micPrimerSeen` (new) | L2 | Local `settings` | App | Install | Never |
| Analytics events (section 10) | L2 | PostHog after opt-in | Analytics | 12 months (TDD 03 section 4.1) | Only after consent; nothing queued before (PRD-REQ-016) |

Rules:
1. Capture makes no network request. No audio is uploaded at v1.0 (B7). No server transcription at v1.0 (03 section 5).
2. The reason a take ended is shown in the UI and sent only as an L2 enum after consent; it is never stored in the row (`recorder.ts` keeps it in memory today).
3. Errors carry codes only. No SQLite message, file path or text goes into logs or crash reports (TDD 01 section 4.2 rules 1 and 2).
4. Files keep iOS Data Protection at least complete until first user authentication (LEGAL-REQ-022(b), BL-245).
5. The widget extension holds no personal data: no child name, no letter, no count.
6. New columns ship with rows in `docs/legal/DATA_CLASSIFICATION.md` section 4.5 in the same pull request (DATA-REQ-001). Section 4.5 today also lacks the migration 3 columns (`drafts.state`, `audio_sha256`, `audio_bytes`, `recovered_at`, `entries.audio_sha256`, `audio_bytes`, `transcript_status`) and the `orphan_audio` table; WP-F04-03 adds them.

## 9. Non-functional requirements

Shared budgets live in `06-nfr.md` (not yet written); these are F04's own. Reference device: iPhone SE (3rd gen).

| Area | Budget | Gate | How measured |
|---|---|---|---|
| Tap Speak to microphone live | p95 500 ms | Yes | Perf build, 200 samples (TDD 06 section 7.2) |
| Finish to Review on screen, 2-minute take | p95 400 ms, including hash and row update [A] | No | Perf build marker |
| Local save commit, 2-minute take | p95 200 ms including hash | Yes | Perf build (TDD 01 section 5.3) |
| Finalize of a 30-minute take (about 14.4 MB at 0.48 MB per minute, R5 section 6) | p95 1.5 s [A] | No | Perf build; native streaming hash once BL-140 lands |
| Typed autosave latency | 500 ms after the last keystroke; immediate on background | Yes | Unit plus typed kill run |
| Kill during save | 0 losses in 500 Simulator plus 50 device iterations | Yes | BL-135 |
| Kill while recording | 50 of 50 rows kept; 49 of 50 playable to within 5 s | Yes (report plus decision) | WP-F04-11 |
| Not much today | Saved and toast visible within 100 ms of the tap | No | Component test |
| Memory while recording | Under 40 MB above the app's idle footprint [A] | No | Instruments, 10-minute take |
| Battery while recording | 2% or less for a 10-minute take [A] | No | 10 takes, `UIDevice.batteryLevel` delta averaged (TDD 06 method) |
| Download size | Widget extension adds 2 MB or less toward the 40 MB app budget [A] (B13) | Yes for the total | EAS build size check |
| Accessibility | WCAG 2.2 AA; AX5 on Tonight, Listen, Write; VoiceOver script V1 passes | Yes | TDD 09 L3 and V1 |
| Network | 0 requests from capture | Yes | E2E proxy log |

## 10. Analytics

All events are opt-in (LEGAL-REQ-003), typed in `packages/analytics/src/catalog.ts`, L2 only, never with text, names, languages or durations beyond buckets.

| Event | Status | Properties | Question it answers |
|---|---|---|---|
| `capture_started` | Exists; add `widget` to `source` | `mode`, `source` (`tonight`, `book`, `notification`, `widget` new, `make_it_yours`, `resurface`), `prompt_kind`, `child_ordinal`, `member_role` | Where capture starts, and whether people speak or type (U1) |
| `capture_ended` | New | `reason` (`user`, `background`, `interruption`, `dismiss`, `max_length`, `low_storage`), `audio_bucket` | How often a take ends without the person choosing; durability health |
| `capture_recovered` | New, sent once per launch sweep with counts | `finalized` int, `unrecoverable` int, `reattached` int | Whether kills mid-take happen in the field and whether recovery works |
| `capture_discarded` | Exists | `mode`, `stage`, `audio_bucket` | How often people let a take go |
| `mic_permission_result` | New | `granted` bool, `primer_shown` bool | Whether the primer helps people allow the microphone |
| `letter_saved` | Exists; add `kind` (`note`, `letter`, `not_much`) and `backdated` bool | existing plus new | Note versus letter use; how much backdating happens (R2 T25) |
| `error_shown` | Exists | `code` (`mic_denied`, `storage_low`, `save_failed`, `generic`) | Error rates on the capture path |

Not sent: the reason a take ended before consent, the letter language (B-NFR-001), any file size other than `audio_bucket`, any count of drafts.

## 11. How we build it (with the architect)

### 11.1 Components and files

| Part | File | Status |
|---|---|---|
| Capture state machine (pure) | `packages/core/src/capture.ts` | New (BL-130 asks for the reducer in core) |
| Backdating rules (pure) | `packages/core/src/backdate.ts` | New; uses `ageOn` and `chapterOf` from `packages/core/src/age.ts` |
| Listen screen | `apps/mobile/src/app/listen.tsx` | Exists; driven by the reducer |
| Write screen | `apps/mobile/src/app/write.tsx` | Exists |
| Tonight CaptureBar, Not much today, waiting rows | `apps/mobile/src/app/(tabs)/index.tsx` | Exists |
| Recorder session | `apps/mobile/src/lib/capture/recorder.ts` | Exists; add keep-awake, storage checks, native hash and fsync |
| Launch sweep | `apps/mobile/src/lib/capture/sweep.ts`, `sweep.logic.ts` | Exists; add the `discarding` rule |
| Free space reader | `apps/mobile/src/lib/capture/storage.ts` | New. Uses the expo-file-system free-space API if the installed version has one (Unverified; confirm in `build/*.d.ts`), else a new `availableBytes()` method on `modules/scribe-files` |
| Keep-awake wrapper | `apps/mobile/src/lib/capture/keep-awake.ts` | New, over `expo-keep-awake` [A] (Expo SDK package; agent confirms the API and licence in the installed version before use, brief rule) |
| Date sheet for Review | `apps/mobile/src/components/capture/date-sheet.tsx` | New; F06 places it in Review |
| Kind control for Review | `apps/mobile/src/components/capture/kind-control.tsx` | New; F06 places it |
| Language chip | `apps/mobile/src/components/capture/language-chip.tsx` | New; reads the author's languages from F03 |
| Capture strings | `apps/mobile/src/components/capture/copy.ts` | New (brief rule: feature-folder `copy.ts`; content agent moves them) |
| Local schema | `apps/mobile/src/lib/db/migrations.ts` migration 4 | New |
| Store API | `apps/mobile/src/lib/store.ts` | Exists; new functions in 11.3 |
| Native hash and fsync | `apps/mobile/modules/scribe-audio-decode` (`sha256File`, `fsyncFile`) | New, BL-140 (speech engineer) |
| Widget | `expo-widgets` config plugin plus a `'widget'` component (R4-S61) | New, P1 |
| Deep link to Ready state | `apps/mobile/src/app/listen.tsx` param `entry=widget` | New |

Libraries: `expo-audio` ~57.0.5, `expo-file-system` ~57.0.7, `expo-crypto` ~57.0.3, `expo-sqlite` ~57.0.3, `@react-native-community/datetimepicker` 9.1.0, `react-native-reanimated` 4.5.1 (all installed, `apps/mobile/package.json`). New: `expo-keep-awake` [A], `expo-widgets` (R4-S61; licence not stated on the page, check before install). Installs follow the brief: `flock /tmp/scribe-npm.lock npx expo install <pkg>`.

### 11.2 State machine

| State | Entered by | Draft row | Exits |
|---|---|---|---|
| `primer` | Speak with permission undetermined | none | Continue then grant: `recording`; deny: `denied` |
| `denied` | Permission denied or restricted | none | Type instead; Open Settings; AppState `active` with permission granted: `ready` |
| `ready` | Widget launch, or return from Settings with permission | none | Start: `recording` |
| `blocked_storage` | Free space under 50 MB at start | none | Type instead; Close |
| `recording` | `record()` called after the draft insert | state `recording` | Pause, Finish, Let it go, background, interruption, unmount, cap, storage under 20 MB |
| `paused` | Pause | state `recording` | Keep talking, Finish, Let it go, background, unmount |
| `finishing` | Any stop except Let it go | becoming `ready` or `unrecoverable` | Review |
| `discarding` | Let it go confirmed | state `discarding` | Row and file gone; back |

Constants in `packages/core/src/capture.ts`: `maxMs` from remote config `capture_max_minutes` (default 30, clamped 5 to 30), `warnBeforeEndMs` 300,000, `keepAwakePausedMs` 300,000, `progressEveryMs` 5,000, `storageCheckEveryMs` 30,000, `warnBelowBytes` 1,000,000,000, `refuseBelowBytes` 50,000,000, `finishBelowBytes` 20,000,000, `startTapGuardMs` 500. The 30-minute ceiling matches the whole-file VAD decode budget in TDD 03 section 3.4 (30 minutes, 58 MB of PCM).

### 11.3 Data model and store contract

Migration 4 (append-only, one transaction, test in `apps/mobile/test/migrations.test.ts`):
```sql
ALTER TABLE drafts ADD COLUMN kind TEXT NOT NULL DEFAULT 'letter';      -- note | letter
ALTER TABLE drafts ADD COLUMN occurred_on TEXT;                          -- YYYY-MM-DD; null = local date of created_at
ALTER TABLE drafts ADD COLUMN occurred_precision TEXT NOT NULL DEFAULT 'day'; -- day | month
ALTER TABLE drafts ADD COLUMN language TEXT;                             -- BCP-47, null = author default
ALTER TABLE entries ADD COLUMN occurred_precision TEXT NOT NULL DEFAULT 'day';
ALTER TABLE entries ADD COLUMN language TEXT;
```
`drafts.state` gains the value `discarding`.

New store functions (all synchronous, same patterns as `store.ts`): `setDraftKind(id, kind)`, `setDraftOccurred(id, occurredOn, precision)`, `setDraftLanguage(id, language)`, `beginDiscard(id)`, `finishDiscard(id)`, `hasNotMuchOn(childId, isoDate)`. `saveLetterFromDraft` writes `kind`, `occurred_on`, `occurred_precision` and `language` from the draft.

Server: `entries.occurred_precision` and `entries.language` need a migration by the data architect with classification comments and the `approve-migration` label (BACKLOG rule 9). Sync mapping is F16.

### 11.4 Hand-off to F05 and F06

When Listen or Write hands over, Review receives `draftId`. The draft row is the contract:

| Field | Value at hand-off | Owner after hand-off |
|---|---|---|
| `id` | UUIDv7; becomes the entry id | F06 |
| `child_id` | From the active child; changeable in Review | F06 |
| `capture_mode` | `spoken`, `typed`, or `mixed` when words are typed for a recording | F06 |
| `kind`, `occurred_on`, `occurred_precision` | From the entry point; changeable in Review | F06 |
| `language` | From the chip or the author default | F05 picks the model and pack |
| `audio_uri`, `audio_duration_ms`, `audio_sha256`, `audio_bytes` | Set and hashed | F05 reads the original only (R5 section 5.3 item 3); F08 owns the file after save |
| `state` | `ready` or `unrecoverable` | F05 skips `unrecoverable`; Review offers Type the words |
| `typed_text` | Exactly as typed | F06 shows it with no machine edits |
| `raw_transcript` | Null until F05 sets it once (`setDraftTranscript`) | F05, F06 |

Model not ready: F05 reports `model-missing`; Review shows the waiting card; Keep the recording only saves a voice-only entry with `transcript_status = waiting` (`saveVoiceOnlyFromDraft`); F05 fills the words once later (`setWordsForWaitingEntry`). Whether a voice-only letter can enter the book before it has words is F06's call (TDD 03 OQ-4).

### 11.5 Deviation from TDD 03 section 3.2 rule 2

TDD 03 treats a call or Siri as a pause that the person resumes. This spec finalizes the take instead, as `listen.tsx` does today. Reason: whether `expo-audio` 57 can resume the same file after an audio-session interruption is Unverified (TDD 03 OQ-8), and finalizing is the path that cannot lose audio. The cost is that a long letter interrupted by a call becomes a letter plus a new one. WP-F04-01 tests resume; if it is reliable on device, the architect may switch to pause without changing any other requirement.

### 11.6 Riskiest unknown and the spike

**Unknown:** whether an M4A whose writer was killed is playable (TDD 03 section 3.2 rule 4 and R-4), plus which interruptions `expo-audio` 57 surfaces and whether a lock reliably fires AppState `background`.
**Spike (WP-F04-01):** 50 kills on an SE 3 at random points; count playable files and the seconds lost; run every interruption in F04-U05 to U13 and record what the recorder reports. If fewer than 49 of 50 play, options for the founder: (a) record ADTS AAC, which survives truncation, and remux to M4A on stop, amending ADR 0005; (b) record in 60-second segments joined at stop. Both keep every byte the microphone produced.

### 11.7 Sequencing

1. WP-F04-01 spike and WP-F04-02 reducer (week 2).
2. WP-F04-03 migration 4, then WP-F04-04 recorder hardening (weeks 2 to 3; needs BL-111 for the store interface).
3. WP-F04-05 primer, WP-F04-06 Listen UI, WP-F04-07 Write, in parallel (week 3).
4. WP-F04-08 backdating, WP-F04-09 Not much today, WP-F04-10 drafts and discard (weeks 3 to 4).
5. WP-F04-11 kill runs (week 4, then every release candidate).
6. WP-F04-12 widget (weeks 5 to 8, P1, cut first at the week 6 checkpoint).

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|
| WP-F04-01 | Device spike: kill-while-recording playability, interruption events, lock to background, resume after interruption, keep-awake API | `docs/qa/evidence/F04-spike.md` (new) | BL-030 dev build | 50 kills recorded with playable count and seconds lost; each of F04-U05 to U13 has an observed behaviour; result attached to BL-130 | pair (QA engineer, mobile engineer) |
| WP-F04-02 | Pure capture reducer and constants | `packages/core/src/capture.ts`, `packages/core/test/capture.test.ts` | none | `[F04-REQ-001]` insert before record; `[F04-REQ-003]`, `[F04-REQ-006]`, `[F04-REQ-007]`, `[F04-REQ-008]`, `[F04-REQ-010]` state tests green; `npm test` | agent (mobile engineer) |
| WP-F04-03 | Migration 4, store functions, classification rows | `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/store.ts`, `apps/mobile/test/migrations.test.ts`, `docs/legal/DATA_CLASSIFICATION.md` section 4.5 | BL-111 | Fixture DBs v0 to v3 migrate to v4 with row counts and hashes unchanged; `[DATA-REQ-044]` retry test; `npm test` | agent (mobile engineer) |
| WP-F04-04 | Recorder hardening: keep-awake, cap, storage checks, interruption finalize, one take at a time, native hash and fsync when available | `apps/mobile/src/lib/capture/recorder.ts`, `keep-awake.ts`, `storage.ts` | WP-F04-02, WP-F04-03, BL-140 for native hash | `[F04-REQ-004]`, `[F04-REQ-005]` (device), `[F04-REQ-008]` integration with fake free space; `[DATA-REQ-046]` | agent plus device check (mobile engineer) |
| WP-F04-05 | Microphone primer, denied card, return from Settings, revised purpose string | `apps/mobile/src/app/listen.tsx` (primer and denied branches), `apps/mobile/src/lib/permission-copy.ts`, `apps/mobile/src/components/capture/copy.ts` | WP-F04-02 | `[LEGAL-REQ-007]` manifest lint; `[F04-REQ-022]` E2E; counsel approves the purpose string (Q2) | agent (mobile engineer, content) |
| WP-F04-06 | Listen UI: "To {child}" from `children.switcher.toLabel`, prompt line, language chip, Ready state, AX5 stack, VoiceOver order and announcements, Magic Tap, kept-so-far and limit lines | `apps/mobile/src/app/listen.tsx`, `apps/mobile/src/components/capture/language-chip.tsx` | WP-F04-02, F03 languages API | `[F04-REQ-017]`, `[F04-REQ-019]` component tests at AX5; VoiceOver script V1 run | agent (mobile engineer, design systems) |
| WP-F04-07 | Write: background flush, exact typed text, RTL check, kind and date pass-through | `apps/mobile/src/app/write.tsx`; the typed branch of `apps/mobile/src/app/review.tsx` (only `cleanedText` for typed) | WP-F04-03 | `[F04-REQ-011]`, `[F04-REQ-012]` byte-equality test, `[F04-REQ-013]` manual Arabic script | agent (mobile engineer) |
| WP-F04-08 | Backdating rules and date sheet | `packages/core/src/backdate.ts`, `packages/core/test/backdate.test.ts`, `apps/mobile/src/components/capture/date-sheet.tsx` | WP-F04-03 | `[F04-REQ-015]` bounds, month starts on the 31st, expecting child; component test | agent (mobile engineer) |
| WP-F04-09 | Not much today: once per child per day, Undo, `Intl` weekday, kind on `letter_saved` | `apps/mobile/src/app/(tabs)/index.tsx` | WP-F04-03 | `[F04-REQ-016]`; `[C-REQ-005]` content test | agent (mobile engineer) |
| WP-F04-10 | Drafts: kind control, all waiting rows on Tonight, confirmed discard from Review and Tonight with the `discarding` state | `apps/mobile/src/components/capture/kind-control.tsx`, `apps/mobile/src/lib/capture/sweep.logic.ts` (discarding rule), `apps/mobile/test/sweep.test.ts` | WP-F04-03 | `[F04-REQ-009]` kill between steps never re-attaches; `[F04-REQ-014]`; `[F04-REQ-027]` | agent (mobile engineer) |
| WP-F04-11 | Kill runs and capture E2E: 500 kill-during-save, 50 kill-while-recording, 100 typed kills, Maestro E-01, E-04, E-05, E-06 | `apps/mobile/e2e/capture/*` (new), `docs/qa/evidence/` | WP-F04-04, WP-F04-07, BL-275 | `[DATA-REQ-048]`, `[F04-REQ-024]`, `[F04-REQ-011]`, `[LEGAL-REQ-011]` pass on the release candidate | human plus agent (QA engineer) |
| WP-F04-12 | Widget (P1): `expo-widgets` plugin, static Lock Screen and Home Screen widget, deep link to Ready state | `apps/mobile/app.config.ts` (plugin entry only), `apps/mobile/src/widgets/` (new) | WP-F04-06; licence check | `[F04-REQ-020]` E2E: widget deep link records nothing until Start; IPA size check within budget | pair (mobile engineer) |
| WP-F04-13 | Analytics: new events and properties | `packages/analytics/src/catalog.ts`, `docs/analytics/TRACKING_PLAN.md` | none | Catalogue schema tests; `[LEGAL-REQ-017]` allowlist test | agent (analytics engineer) |
| WP-F04-14 | Server columns `occurred_precision`, `language` with classification comments and access tests | `supabase/migrations/` (new file in the assigned range), `supabase/tests/` | WP-F04-03 | `npm run test:db` green; `approve-migration` label | agent (data architect) |

## 13. Open questions and assumptions

**Questions**

| # | Question | Who answers | By when | What changes |
|---|---|---|---|---|
| Q1 | Is a 30-minute cap per take right for v1.0, with remote config able only to lower it? | Founder | 16 Oct | `capture_max_minutes` default and F05 chunking load |
| Q2 | Approve the revised microphone purpose string; the current one names backup, family sharing and cloud transcription, none of which exist at v1.0 (B7) | Counsel, founder | 23 Oct | `permission-copy.ts`; `docs/legal/app-store-privacy-labels.md` section 4 |
| Q3 | Can the first-letter time be kept on the device as an L2 bucket and sent once after analytics consent, or is that "queued before consent" (PRD-REQ-016)? | Analytics engineer, counsel | 30 Oct | Whether the 90 s activation metric is measurable outside TestFlight |
| Q4 | Keep the widget in v1.0 as P1? | Founder | Week 6 checkpoint, 13 Nov | WP-F04-12 |
| Q5 | Confirm finalize on interruption instead of TDD 03's pause (section 11.5) | Architect, after WP-F04-01 | 23 Oct | `capture.ts` interruption transition |
| Q6 | `normalizeChars` and `FORBIDDEN_CHARS` in `packages/core/src/text.ts` say forbidden characters must never survive into an entry. B5 says typed text is never rewritten. This spec exempts typed text. The same rule also rewrites standard Chinese quotation marks in spoken text (R5 risk K7) | Core owner with F06 | 16 Oct | `packages/core` text rules and F06 |

**Assumptions**

| # | Assumption | How we validate |
|---|---|---|
| A1 | Locking the phone moves the app to the background, which ends the take | WP-F04-01 on an SE 3 |
| A2 | `expo-keep-awake` exists for SDK 57 with a permissive licence and stops Auto-Lock | Read the installed package; WP-F04-01 |
| A3 | `expo-audio` 57 reports interruptions only through recorder status, so the `isRecording` poll is the detector | WP-F04-01; TDD 03 OQ-8 |
| A4 | A free-space API is reachable from Expo or a one-method native addition | Read `expo-file-system` 57 types; else extend `modules/scribe-files` |
| A5 | React Native 0.86 exposes a Magic Tap handler on iOS | Read RN 0.86 docs before WP-F04-06; drop the line if absent |
| A6 | A killed M4A is often unplayable (TDD 03 R-4) | WP-F04-01 |
| A7 | Parents will speak at night near a sleeping baby (U1) | Study 1 (02 section 7) |

## 14. Sources

- Founder brief: `docs/agents/BRIEF-2026-10-03.md` items 1, 6, 7, 8, 9, 15, 16 (B4, B5, B6, B7, B13, B14, B16 in `_AUTHORING.md` section 3).
- V2: `docs/prd/v2/_AUTHORING.md`; `01-problem.md` sections 2.2, 2.4; `02-customers.md` sections 3, 6, 7; `03-goals-and-principles.md` sections 2 to 4; `05-feature-map.md` section 2; `09-decisions-and-risks.md` DR-01, DR-07, DR-09, R-03, R-11.
- PRD 1.3: `docs/prd/PRD.md` sections 3.1 to 3.4, 6.3, 7.1, 7.4, 7.5, 7.7; `docs/prd/A-entry-and-auth.md` A-REQ-012, -014, -030; `docs/prd/B-first-run-and-family.md` B-REQ-003, -004, section 5; `docs/prd/C-habits-pricing-settings.md` C-REQ-005.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-007, -011, -014, -019, -022, -051; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-043, -044, -046, -048; `docs/legal/DATA_CLASSIFICATION.md` section 4.5; `docs/legal/app-store-privacy-labels.md` section 4; `docs/legal/compliance-register.md` CR-041.
- Decisions: `docs/DECISIONS.md` D-025, D-028, D-033, D-040; `docs/ROADMAP.md` M2; `docs/BACKLOG.md` BL-111, BL-130, BL-134, BL-135, BL-136, BL-140, BL-142, BL-275.
- Design: `docs/tdd/01-mobile-client.md` sections 3.2, 3.4, 3.6, 4, 5.3, 6, 7; `docs/tdd/03-audio-transcription.md` sections 3.1 to 3.5, 6, 8, 12; `docs/tdd/06-performance-reliability.md` sections 2.2, 7.2; `docs/tdd/09-accessibility-design-system.md` V1, A11Y-F19; `docs/tdd/10-red-team-critique.md` risks 1, 2, 8; `docs/adr/0001-on-device-asr.md`; `docs/adr/0005-audio-format.md`; `docs/adr/0101-ui-component-library.md`; `docs/design/DESIGN_LANGUAGE.md` sections 1, 11, 12; `docs/design/COMPONENTS.md` 2.17, 2.18, 2.21; `docs/design/MOTION.md` sections 2, 4, 5b, 6; `docs/design/SOUND.md` sections 2, 3; `packages/content/BRAND.md`; `packages/content/VOICE.md`.
- Code read 3 Oct 2026: `apps/mobile/src/app/listen.tsx`, `write.tsx`, `review.tsx`, `(tabs)/index.tsx`, `_layout.tsx`; `apps/mobile/src/lib/capture/recorder.ts`, `sweep.ts`, `sweep.logic.ts`; `apps/mobile/src/lib/store.ts`, `audio-mode.ts`, `copy.ts`, `permission-copy.ts`, `haptics.ts`, `transcribe.ts`; `apps/mobile/src/lib/db/migrations.ts`, `expo-adapter.ts`; `apps/mobile/app.config.ts`; `apps/mobile/package.json`; `packages/content/src/strings.en.ts`; `packages/core/src/text.ts`; `packages/analytics/src/catalog.ts`.
- Research: R1 section 0 items 5, F04 table (R1-S1, R1-S3, R1-S4, R1-S6, R1-S11, R1-S13, R1-S15, R1-S20, R1-S30, R1-S31, R1-S33, R1-S56, R1-S60, R1-S64, R1-S67, R1-S68); R2 section 0 items 1, 6, sections 2.2, 2.3, 5, 6 (R2-S7, R2-S10, R2-S13, R2-S16, R2-S22, R2-S23, R2-S25, R2-S26); R4 section 9 (R4-S61); R5 sections 2.4, 5, 6; UR S25, S27, S30, R10.
