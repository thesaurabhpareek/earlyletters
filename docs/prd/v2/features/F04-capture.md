# F04 Capture: speak or type a note or letter

| | |
|---|---|
| Release | v1.0 gate (lock-screen widget is P1 inside v1.0, first to cut) |
| Priority and rank | P0, rank 1 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent, P4 Multilingual family |
| Existing IDs | A-REQ-012, A-REQ-014, A-REQ-030, B-REQ-003, B-REQ-004, PRD-REQ-001, PRD-REQ-005, PRD-REQ-012, C-REQ-005, C-REQ-009, LEGAL-REQ-007, LEGAL-REQ-011, LEGAL-REQ-014, LEGAL-REQ-051, DATA-REQ-044, DATA-REQ-046, DATA-REQ-048, D-025, D-033, D-040, D-084, D-085, DR-01, DR-09, BL-130, BL-134, BL-135, BL-136, BL-140, BL-142, BL-272 |
| Depends on | F03 (child, signature, languages), F05 (transcription queue), F06 (Review screen), F08 (audio format, file locations), F09 (month chapters, quiet-day rows), F19 (remote config), design system (ADR 0101) |
| Status | Draft V2, 3 Oct 2026. Reconciled with code on `develop` and decisions M10, M11, M13 on 13 Oct 2026 (section 12 says what is built). Revised 14 Oct 2026 after critique round 1 (M14 to M17; reviews R1 to R6; every finding handled or rejected is in `reviews/DISPOSITION-C.md`). Revised 15 Oct 2026 after critique round 2 for held drafts and durability only (R8 R2A-04, R2A-05, R2A-19; `reviews/DISPOSITION-R2-architecture.md`) |

## 1. Why

- [S] Losing work is the most common complaint in the category. 41 of 104 negative or mixed reviews across 11 memory and journal products are about bugs, sync or lost entries; 9 describe work that vanished, including a 30-minute entry lost to a paste with no undo and a book lost because there was no autosave (R2 section 0 item 1, T8; R2-S10, R2-S16).
- [S] Every voice product checked has a loss story: entries lost on app switch (Qeepsake, R1-S56), data loss in voice processing (Rosebud, R1-S33), failed uploads (StoryCorps, R1-S31). FirstChapter's September release added retry and a confirm-before-discard prompt (R1 section 0 item 5; R1-S4).
- [F] Parents with a child under 6 have about 3.2 hours of leisure a day, and secondary childcare runs 4.2 to 7.7 hours a day, so capture happens in minutes, often one-handed (R2-S25, R2-S26). [S] Reviewers praise entries made while nursing and entries that take five minutes or less (R2-S13).
- [S] All 6 reviews about chronology are complaints, and one product charges a fee to backdate (R2 section 0 item 6, T25).
- [F] The code on `develop` (read 13 Oct 2026) writes the draft row before the microphone goes live, stops and keeps the take on background, interruption and dismiss, pauses and resumes in one file, keeps the screen awake while a take is live or paused (`apps/mobile/src/app/listen.tsx` with `lib/resilience/keep-awake`), hashes the file, and saves in one transaction (`lib/capture/recorder.ts`, `lib/store.ts` `saveLetterFromDraft`). After a kill, the launch sweep probes the recovered take before it marks it ready; a take that will not open is kept and listed in Settings > Recordings (`lib/capture/probe.ts`, `sweep.ts`, D-085). It has no low-storage check, no length cap, no microphone primer before the iOS prompt, no backdating and no language chip (searches of `apps/mobile/src` on 13 Oct found none).
- [F] Typed text still passes through `normalizeChars` in Review, which turns an em dash into a comma and curly quotes into straight ones (`apps/mobile/src/app/review.tsx` line 244 `cleanedText`; `packages/core/src/text.ts`). That is a machine edit on typed text, which B5 forbids.
- [D] "Not much today" stores a mark with no words; the Book shows an unsigned "A quiet day" row; marks never count, print, play or move into the book (D-084, `_AUTHORING.md` M10). Built in commit f4cdbc3.
- [D] Server features are on for v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9 ("v1.0 on-device only"): sign-in, sync and co-parent ship. On 13 Oct every `eas.json` profile still sets `EXPO_PUBLIC_SERVER_FEATURES=off` (`apps/mobile/src/lib/capabilities.ts`) until the release profiles flip. Capture itself never needs the server; rows below that assume a signed-in co-parent are v1.0.

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F04 must do for them |
|---|---|---|---|
| P1 Evening parent | After the baby is down, or mid-feed with one hand free | A phone in the dark, a sleeping baby nearby, a few minutes. Afraid of losing what they made (R2 section 5) | One tap to speak or type. Nothing lost on a call, a lock or a crash. Quiet: no sounds, no flashes (SOUND.md section 2) |
| P2 Co-parent | Their own cadence, often a longer letter at a weekend [S] UR S25, S30 | Their own phone; their recordings stay on it, plus their own encrypted backup if they turn it on (D-073, M7); hearing the other parent's recordings is v1.1 | The same capture flow, writing to a shared book chosen with "To {child}" |
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
| Median first launch to first saved letter | 90 s or less [A] (03 section 4.2), lab and C1 observation only; no field target at v1.0 (R1 PL-16) | The E-01 lab script and Study 1 observation | The first letter happens before the analytics consent ask (F02 ask order), so device analytics cannot see it; open question Q3 |
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
- The durability path: draft row before the first audio byte, stop and keep on background, atomic save with SHA-256 after AVAudioRecorder has closed the file (no fsync today, 11.1), launch sweep, kill-during-save gate, and a forced-reboot case (F04-REQ-048).
- Microphone permission primer, denied path, return from Settings.
- Interruptions: call, Siri, alarm, other audio apps, route change, media services reset, low storage, power loss, thermal, Low Power Mode.
- Accessibility: VoiceOver, AX5, Reduce Motion, one-handed reach, dark room. Nothing the phone says out loud (VoiceOver, our own announcements, our own notifications) is recorded into a letter (6.2 H, F04-REQ-040, F04-REQ-041).
- The first spoken letter before speech is ready on the phone (6.2 G): kept as a recording, words later, and it does not use a free letter until the author has seen its words (M17).
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
| FirstChapter | 30-second voice notes; v1.0.6 added retry, background upload and confirm before discarding a recording [F] R1-S4 | No US average yet [F] R1-S4 | n/a | **Match** confirm before discard. Capture uploads nothing; the owner's encrypted backup (D-073, F08) retries on its own queue |
| Day One | Audio up to 3 hours, transcription limited to 10 minutes, up to 30 recordings per entry, Siri Shortcuts [F] R1-S60, R1-S6 | 4.8 (118K) [F] R1-S6 | n/a | **Match** a generous cap; we choose 30 minutes for one take, bounded by on-device transcription (section 11) |
| Remento | Recordings up to 30 minutes, through a web link with no app [F] R1-S13 (R1 row 10) | Trustpilot 4.8 (1,738), not an App Store rating [F] R1-S15 | Elders record on their own [S] R2-S22, R2-S23 | **Match** a 30-minute cap; Remento's users are elders recording on the web, so the number is a ceiling we borrow, not evidence parents need it |
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
| Not much today | Tonight, secondary text button under Speak and Type (`tonight.notMuchButton`) | Saves a quiet-day mark inline | child, local date | Built to D-084 (`(tabs)/index.tsx`, `components/book/quiet-day.logic.ts`) |
| Prompt card | Tonight (`tonight.promptLabel`) | No action of its own at v1.0 | Its prompt rides on Speak or Type | "Another thought" (`tonight.newPromptButton`) changes it |
| Waiting draft row | Tonight (`tonight.draftWaiting.title`) | `/review` for audio, `/write` for typed | `draftId` | Exists; one row per waiting draft up to 2, then one collapsed row (F04-REQ-027, F04-REQ-046) |
| Words ready row | Tonight (`wordsCopy.waiting.readyBody`, exists) | `/review` with `entryId` | `entryId` | New (path G) |
| Empty month in the Book | F09 chapter empty state | `/write` or `/listen` | `occurredOn` preset to the start of that month of age, `occurredPrecision = month` | F09 owns the button; F04 accepts the params |
| Reminder notification | F13 | Tonight | none | Never opens a live recording (F04-REQ-021) |
| Widget (P1) | Lock Screen accessory (circular, rectangular) and Home Screen small, via `expo-widgets` (R4-S61) | `/listen?entry=widget` in the Ready state | `kind = note` | Static: no child name, no data in the widget (F04-REQ-020) |
| Siri, Shortcuts, Control Center | n/a | n/a | n/a | Later (section 4) |

### 6.2 Happy paths

**A. First spoken letter on this install (microphone not yet asked).**

| Step | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Speak on Tonight | Listen opens as a full-screen modal with no entrance animation on the buttons (MOTION principle 2) | Guards against a second tap for 500 ms. Reads microphone permission: undetermined |
| 2 | Reads the primer | Primer (a `StateScreen`, COMPONENTS 2.15a): title `listen.primer.title` (new), body `listen.primer.body` (new), the recording-consent line `listen.primer.othersLine` (new), button `common.continueButton` | Sets `capture.micPrimerSeen = 1` when Continue is tapped |
| 3 | Taps Continue, then Allow in the iOS prompt | iOS prompt with the purpose string `permissions.microphone` (revised, F04-REQ-022) | On grant: haptic `press` before the session activates; `setAudioMode('recording')`; `prepareToRecordAsync`; draft row written with state `recording`, file path, child, prompt, kind, language; then `record()`; keep-awake on |
| 4 | Talks | Always on the dark colour set (`dark` in `packages/design-tokens/src/tokens.ts`: `bg` #161412, `text`, `textMuted`, `recording`), whatever the system appearance (F04-REQ-042). Top: "To {child}" (`listen.toChild`), audience line (`listen.audience`), the prompt text in `textMuted` if the take started from a prompt, language chip if two or more languages. Centre: `ListeningAura` (COMPONENTS 2.17), elapsed time. State line `tonight.states.listening` with hint `tonight.states.listeningHint`; `tonight.states.stillHere` per F04-REQ-043. After 30 s with no touch, everything except Pause and Finish fades to 40% opacity over 400 ms and the aura becomes the static ring; any touch restores it | Elapsed time written to the draft every 5 s; free space checked every 30 s. With VoiceOver on, Listen uses the VoiceOver take layout (6.2 H): nothing is announced while the microphone is live |
| 5 | Taps Finish (`tonight.states.stopButton`) | Aura moves to processing; buttons disabled | Recorder stops and AVAudioRecorder closes the file; its size is read back and its SHA-256 computed (`expo-crypto` today; a native streaming hash is an optimisation, not built); draft state `ready` with duration, bytes and hash in one statement; `setAudioMode('idle')`; keep-awake off; haptic `press` after the session ends |
| 6 | Reads it back | Review opens (`review.title`), owned by F06. Transcription runs from the queue (F05). If the model is not ready: path G | Hand-off contract in section 11.4 |
| 7 | Saves with one tap; changes the dateline only if something is wrong | F06 owns the layout (F06 6.2 A step 8): one primary save button preselected to the last destination this author used for this child, and one dateline row (child, date, kind, language) that opens a sheet holding the kind control (`tonight.noteOrLetter.*`), the date sheet (`review.date.*`, new) and the "To {child}" picker | One local transaction inserts the entry with the draft's id and deletes the draft (DATA-REQ-048). Success haptic, then the settle animation (MOTION 5e) |

**B. Spoken letter, permission already granted.** Steps 2 and 3 are skipped. Step 1 goes straight to recording. The haptic fires before the session activates.

**C. Typed letter.**
1. Taps Type. Write opens with the dateline, the prompt if any, and the field with placeholder `tonight.typing.letterPlaceholder`.
2. Types with the iOS keyboard. Autocorrect, dictation key and predictive text are the keyboard's own; the app adds nothing (B5).
3. Every pause of 500 ms writes the draft (`setDraftTyped`); the status line shows `write.autosaved` ("Saved on this phone", exists). Leaving the foreground writes immediately.
4. Taps Save (`tonight.typing.saveButton`). Review opens with the text exactly as typed, `edit_level = verbatim`, no machine edits, and no transcription.
5. Saves as in A step 7.

**D. Not much today (quiet-day mark, D-084).**
1. Taps Not much today. The button's VoiceOver hint is `notMuch.confirmBody` ("Marks today without writing anything.").
2. The app saves one quiet-day mark for the active child and today's local date: `kind = not_much`, `raw_transcript = ''`, `final_text = ''`, `in_book = false`, `edit_level = verbatim`, no prompt (`newQuietMark` in `components/book/quiet-day.logic.ts`). No words are ever generated for it, so no weekday sentence and no template.
3. The button is replaced by `notMuch.savedToast` ("Kept. Rest well.") with `notMuch.undo`. Undo removes the mark.
4. A second tap that day for that child adds nothing (`markOn`).
5. The Book shows the mark as an unsigned "A quiet day" row with the date (`book.quietDay.label`), and hides it on a day that also has a letter (F09). The mark is never counted, printed, read in Read together, played, or moved into the book (`isLetterLike`, `readableInBook`).

**E. Backdated letter.** In Review the date row reads `review.date.today` (new). Tapping it opens a sheet with two tabs, `review.date.dayTab` and `review.date.monthTab` (new). Day uses the installed `@react-native-community/datetimepicker`, bounded by section 6.3 F04-U36. Month lists Before You (`book.beforeYouChapter`), The first weeks (`book.chapterNewborn`) and Month 1 to the current month (`book.chapterTitle`). Choosing a month stores the first day of that month of age with `occurred_precision = month`.

**F. Widget note (P1).** Taps the widget. The app opens Listen in the Ready state: `listen.ready.title`, `listen.ready.body`, a 64 pt Start button (`listen.ready.startButton`, exists). Taps Start. Recording begins as in A step 3. The draft carries `kind = note`.

**G. First spoken letter before speech is ready on this phone (DX-02, M17).** Most fresh installs reach their first letter before the speech model has arrived: the model is 574 MB (F05 7.3), about 95 s on 50 Mbps Wi-Fi (F05 section 9), and waits for Wi-Fi. F05 starts the download at the languages step of first run (F05-REQ-042), so on fast Wi-Fi it may land in time; this path covers the rest.

| Step | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Finish | Review opens with the recording player at the top and an `InlineState` card (COMPONENTS 2.15a) built from existing copy in `packages/content/src/features/words.en.ts`: `wordsCopy.pack.title` ("Your {name} words are on their way"), `.body` ("Your voice is kept now. The words will follow as soon as this phone is ready for {name}."), a determinate bar with `.progress` ("Getting ready, {n}%") while the model downloads, or `.waitingForWifi` while it waits; `.noSpace` when space is short. The screen says nothing about free letters (M1: no counters) | F05 job in `waiting_model`. Nothing counts toward the free letters (M17) |
| 2 | Taps Keep my voice (`wordsCopy.pack.keepButton`, exists) | Toast `wordsCopy.pack.keptToast` ("Your voice is kept. The words will follow.", exists) | Saves a voice-only entry, private, `transcript_status = waiting` (F06-REQ-030). The membership ledger is not touched (M17; F14 owns the count) |
| 3 | Later, the model verifies | Tonight shows one row `wordsCopy.waiting.readyBody` ("Words are ready. Read it back.", exists) above the prompt; the Book card for that letter changes from `book.waitingForWords` to the words | F05 fills the words once (`setWordsForWaitingEntry`) |
| 4 | Taps the row | Review opens on the entry with the words, marks and change rows (F06 6.1 "Words ready for a voice-only letter") | The words stay marked unreviewed (F05-REQ-043) until the author saves Review with them on screen; that Save is the counting moment (M17; F14 6.2 B2, F14-REQ-037) |
| 5 | Saves to the book or keeps it private | As A step 7 | F14 applies the Keep rules (M1, M17) |

Typing instead is always offered (`wordsCopy.pack.typeButton` "Type it instead", exists). A parent who never waits for words keeps every recording; no voice-only letter ever counts (M17).

**H. A take with VoiceOver on (DX-06).** VoiceOver speaks through the iPhone speaker unless headphones are connected, and the microphone records whatever the speaker plays. The rule: nothing the phone says out loud while the microphone is live. Mechanism:
1. With VoiceOver on, Speak opens Listen in the VoiceOver take layout: one focusable element, label `listen.voiceOver.startLabel` (new), hint `listen.voiceOver.startHint` (new). VoiceOver reads it now, before anything records. If the output route is the built-in speaker, the hint includes `listen.voiceOver.headphonesHint` (new) [A: route reading from `expo-audio` is checked in WP-F04-01; if it cannot be read, the line always shows with VoiceOver on].
2. A double-tap on the element (or Magic Tap, F04-REQ-019) starts the take. The `press` haptic fires before the session activates (as A step 3). VoiceOver says nothing more: the element's label, hint and value do not change while recording, focus does not move, no other element appears, and no live region exists on the screen.
3. Every status message goes through `announce()` in `apps/mobile/src/lib/a11y.ts`, which already holds messages while audio plays (`getAudioMode() === 'playback'`). It also holds them while the mode is `recording` and speaks them once the recorder has paused or stopped (F04-REQ-040). The direct `AccessibilityInfo.announceForAccessibility` calls in `listen.tsx` today (lines 85, 124, 191 and 195 on `develop`; line 124 speaks "Listening." after `beginTake` has started recording, so that word is in every VoiceOver user's recording today) move to `announce()`.
4. A double-tap or Magic Tap while recording pauses the recorder first, then the screen swaps to the full paused layout (Keep talking, Finish, Let it go, elapsed time) and `announce()` speaks `tonight.states.paused` plus `listen.elapsedA11y`. Keep talking returns to the one-element layout and records again only after a double-tap.
5. The 25-minute line is not announced during the take; at 30:00 the take stops and is kept (F04-REQ-006), then `capture.limitReachedLine` is announced.
6. Our own notifications are not presented while a take is live: the `expo-notifications` foreground handler returns no banner, no list entry and no sound for the length of the take (request to the F13 owner).

Residual we cannot remove: VoiceOver also reads another app's notification banner aloud, and the user can choose to swipe during a take. Both can reach the recording without headphones. The hint in step 1 says so in plain words. The recording stays exactly as captured (B6); the author can remove such words from the letter with Change words (F06), and the raw transcript keeps them (DATA-REQ-040).


### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F04-U01 | First Speak tap, permission undetermined | Primer before any OS prompt; no draft, no file | Primer screen | Continue shows the OS prompt | Unit (reducer); E2E E-01 |
| F04-U02 | Permission denied (now or earlier) | No OS prompt is repeated; no draft, no file | `StateScreen` with `errors.micDenied.title`, `.body`, buttons `.typeButton`, `.settingsButton`, `common.closeButton` | Type instead opens Write with the same prompt and kind | Unit; F04-REQ-034 manifest lint; manual M-script |
| F04-U03 | Permission granted later in iOS Settings, person returns | On AppState `active`, permission is read again | The denied card changes to the Ready state with Start | One tap on Start records | Manual script |
| F04-U04 | Permission restricted (Screen Time or device management) | Treated as denied | Same as U02 | Type instead | Manual script |
| F04-U05 | App leaves the foreground mid-take (home swipe, app switcher, another app opened) | On AppState `background`: stop, file closed, hash, draft `ready` within 1 s; `inactive` alone does nothing | On return: Review with `listen.keptSoFar` (new) above the transcript | Save, or record a new letter for the rest | E2E E-05; LEGAL-REQ-011 |
| F04-U06 | Side button locks the phone mid-take | Same as U05 [A] that a lock moves the app to the background; verified in WP-F04-01 | Same as U05 after unlock | Same | Manual script on SE 3 |
| F04-U07 | Auto-Lock would fire during a long take | Keep-awake is on while recording, and while paused for up to 5 minutes | Screen stays on, on the dark colour set, chrome dimmed to 40% after 30 s with no touch (F04-REQ-042) | None needed | Device test: 6-minute take with Auto-Lock at 30 s |
| F04-U08 | Incoming call, answered or declined | The recorder stops capturing; the existing poll (`recorder.isRecording` false after it was true) or `hasError` marks an interruption; stop and keep | After the call: Review with `listen.keptSoFar` | Save; a new letter for the rest | Manual script; TDD 03 FM-1 |
| F04-U09 | Siri invoked | As U08 | As U08 | As U08 | Manual script |
| F04-U10 | Alarm or timer fires | As U08 | As U08 | As U08 | Manual script |
| F04-U11 | Another app takes the audio session (FaceTime, a video call) | As U08 | As U08 | As U08 | Manual script |
| F04-U12 | AirPods disconnect or input route changes | If the recorder keeps running, nothing changes. If it stops, the poll catches it and U08 applies. The take never ends silently | Nothing, or Review as U08 | As U08 | Manual script with AirPods |
| F04-U13 | Media services reset | `mediaServicesDidReset` in recorder status; stop and keep (exists in `listen.tsx`) | Review | Save | Unit with a fake status |
| F04-U14 | App killed or crashes mid-take | Draft row with state `recording` exists. Launch sweep after first frame: file with bytes is hashed and marked `ready` with `recovered_at`; empty file is kept as `unrecoverable`; no file drops the row (`sweep.logic.ts`) | Tonight shows the waiting row; Review opens it | Save, or Let it go | Kill-while-recording run, 50 iterations (F04-REQ-024) |
| F04-U15 | Battery dies or power is lost mid-take | As U14 | As U14 | As U14 | Covered by U14 |
| F04-U16 | Killed during save | One transaction: either the entry exists with its hash and file, or the draft is intact. Never both, never neither, never a row pointing at a missing file | The letter, or the waiting row | Re-open and save | Kill-during-save run, 500 iterations (PRD 7.4, BL-135) |
| F04-U17 | Free space under 1 GB when Speak is tapped | Recording starts as normal | An `AppNote` line (COMPONENTS 2.5b) on Listen: `capture.storageLowLine` (new) | Free space later; typed letters never blocked | Integration with a fake free-space reader |
| F04-U18 | Free space under 50 MB when Speak is tapped | No draft, no recording | Card: `errors.storageLow.title`, `errors.storageLow.body` (revised), Type instead | Type instead, or free space | Integration |
| F04-U19 | Free space drops under 20 MB during a take | Stop and keep at the next 30 s check | Review with `capture.storageStoppedLine` (new) | Save; free space | Integration |
| F04-U20 | Take reaches 25:00 | Warning line; no announcement while recording (F04-REQ-040); with VoiceOver on, the line is announced at the next pause | `capture.nearLimitLine` (new) | Keep talking or Finish | Unit (reducer); integration with a fake clock |
| F04-U21 | Take reaches 30:00 (constant `maxMs`, no remote key at v1.0) | Stop and keep | Review with `capture.limitReachedLine` (new) | Save; a new letter for more | Integration with a fake clock |
| F04-U22 | Navigation away or swipe-dismiss while recording | Listen blocks the back gesture (`gestureEnabled: false` in `_layout.tsx`); any unmount still finalizes and keeps (`useLayoutEffect` cleanup) | Review or Tonight with the waiting row | Save | Unit; E2E |
| F04-U23 | Speak tapped twice fast, or Speak then the widget | One Listen screen; a second start is refused while `activeTakeId()` is set | One recording | n/a | Unit; E2E double tap |
| F04-U24 | Finish tapped twice, or Finish and background at once | `finalizeTake` is idempotent per draft (exists) | One Review | n/a | Unit |
| F04-U25 | Paused longer than 5 minutes | Keep-awake released; if the phone then locks, U06 applies | Paused state | Keep talking, or Finish | Unit (reducer) |
| F04-U26 | Let it go tapped by mistake | Confirm dialog `pendingCopy.listen.discardTitle`, `.discardBody`, `.keepButton`, `.discardConfirm` | Dialog | Keep it | Unit; E2E |
| F04-U27 | Speech model not downloaded, or transcription unavailable | Capture is never blocked. Review shows path G (F05, TDD 03 FM-9) | `wordsCopy.pack.*` (exists) | Words arrive later (F05); or type them | E2E E-04 |
| F04-U28 | Thermal state serious or critical | Recording continues; the transcription queue pauses (F05, TDD 03 section 3.5.4) | Nothing new on Listen | n/a | Manual |
| F04-U29 | Low Power Mode | Recording continues; iOS may mute haptics (MOTION section 6), so every haptic already pairs with a visible change | Same screens | n/a | Manual |
| F04-U30 | VoiceOver on | VoiceOver take layout (6.2 H): instructions read before the microphone is live; zero announcements while recording; "Paused" and the elapsed time spoken after the recorder has paused; Magic Tap toggles pause (F04-REQ-041) | One element while recording, full controls while paused | n/a | `apps/mobile/test/listen-voiceover.test.ts` (new); device run VO-REC in VoiceOver script V1c (07 section 2.11) |
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
| F04-U42 | Not much today tapped again the same day for the same child | No second mark (`markOn`) | The kept state | Undo while the toast is visible | Unit (`quiet-day.logic.test.ts`, exists) |
| F04-U43 | Not much today tapped by mistake | Undo removes the mark; later, the Book row offers `book.quietDay.remove` | Toast with Undo, persists until dismissed (DESIGN_LANGUAGE section 11 rule 5) | Undo, or Remove this mark | Unit |
| F04-U43b | A quiet-day mark saved by an older build with a template sentence | Local migration 5 blanks `final_text` and queues the change through the sync outbox; `raw_transcript` is untouched (server trigger); every screen decides by `kind`, never by text | "A quiet day", never the old sentence | n/a | `apps/mobile/test/migrations.test.ts` (migration 5) |
| F04-U44 | Audio file missing at save (removed outside the app, storage fault) | `AudioMissingError`; nothing saved; draft kept (`saveLetterFromDraft`) | `errors.generic.title`, `errors.generic.body`; Review offers Type the words and Let it go | Type the words (capture mode `mixed`) or let it go | Unit (exists) |
| F04-U45 | Over-the-air JS update arrives mid-take | Updates apply only on the next cold start (TDD 06 FM-R18) | Nothing | n/a | Release checklist |
| F04-U46 | iOS update moves the app container | Sweep rebases stored paths by file name (`sweep.logic.ts`) | Nothing | n/a | Unit (exists in `test/sweep.test.ts`) |
| F04-U47 | Language chip set to a language whose pack has not passed its gate (Arabic at v1.0, DR-01 A) | Recording kept; Review offers Type the words; no transcript attempted (F05) | Waiting card | Type the words | E2E with a gated-language fixture |
| F04-U48 | Recorder cannot start (microphone in use by a call, `prepareToRecordAsync` throws) | If no draft exists: card `capture.micBusyTitle` and `capture.micBusyBody` (new) with Type instead. If a draft exists: finalize and keep | Card or Review | Try again after the call, or type | Unit with a throwing fake |
| F04-U49 | Offline | Capture, Review, save, Not much today all work; zero network requests | Normal | n/a | E2E E-01 proxy log |
| F04-U50 | Co-parent records a letter in a shared book (v1.0 per M14; needs `EXPO_PUBLIC_SERVER_FEATURES=on`) | Same capture on their own phone; the audio stays on that phone; family listening is v1.1 (D-073); the text syncs after save and sign-in (F16) | Normal capture. The other parent later sees the F08 line for a recording kept on another phone | n/a | E2E with two signed-in fixture devices (F11) |
| F04-U51 | Two children and the active child changes on another screen while Listen is open | The draft keeps the child it started with; Review shows that child | "To {child}" of the draft | Change in Review | Unit |
| F04-U52 | Dark room, system in light or dark mode | Listen always opens on the dark colour set with no white frame; keep-awake never changes brightness; chrome dims after 30 s (F04-REQ-042) | Dark screen | n/a | Snapshot of the first frame of the modal transition in light and dark system appearance |
| F04-U53 | Whisper, or speech over a white-noise machine | `stillHere` is relative to the take's own level (F04-REQ-043), so a whisper does not trigger it; the recording is kept whatever F05 makes of it | Normal Listen | If no words come out, F05 shows `wordsCopy.noSpeech.*` (F05-U13) | Unit (reducer) with a whisper metering fixture; F05 corpus whisper clips |
| F04-U54 | Incoming notification read aloud by VoiceOver from another app, no headphones | Cannot be blocked (6.2 H residual) | The hint before Start says it can happen | Change words removes it from the letter; raw keeps it | VoiceOver script V1c records the residual on device |
| F04-U55 | Three or more drafts waiting for the active child that are not held at the Keep step | Tonight shows one row instead of a list (F04-REQ-046); letters held at the Keep step always share F14's one row (`tonight.heldRow.title`) | `tonight.waitingMany` (new) | Opens the waiting list | Unit |

### 6.4 Screen states

One table per screen so two designers draw the same thing. Component names are from `docs/design/COMPONENTS.md` (`StateScreen`, `InlineState`, `AppNote`, `Toast`, `EmptyState`, `ListeningAura`, `CaptureBar`); "quiet" in this spec means one of these, never a new treatment (R3 DX-24).

| Screen | Empty | Loading | Error | Offline | AX5 (SE 3) | VoiceOver |
|---|---|---|---|---|---|---|
| Tonight capture area | No prompt loaded: `CaptureBar` with Speak, Type, Not much today and no prompt card (prompts are bundled, so this is a defect state only) | None: nothing on Tonight waits on the network | A failed quiet-day save: `Toast` with `errors.generic.body` | Same as online; zero requests | Speak and Type stack full width, 64 pt each; prompt wraps; waiting row wraps | Order: greeting, prompt, Another thought, Speak, Type, Not much today, waiting row |
| Listen, ready (widget, VoiceOver, return from Settings) | n/a | n/a | Microphone busy: `StateScreen` `capture.micBusyTitle`, `.micBusyBody`, Type instead | Same | Title, body and Start stack; Start 64 pt in the bottom third | One element in the VoiceOver layout (6.2 H); otherwise title, body, Start |
| Listen, recording | n/a | Finishing: aura `processing`, buttons disabled, no spinner (COMPONENTS 2.17) | Interruption: Review with `listen.keptSoFar`; storage: `capture.storageStoppedLine` | Same | Pause and Finish stack; clock, state line and "To {child}" wrap | One element, no announcements (F04-REQ-040, F04-REQ-041) |
| Listen, paused | n/a | n/a | n/a | Same | As recording | Full order (F04-REQ-019); "Paused" and the elapsed time spoken once |
| Microphone denied | n/a | n/a | `StateScreen` with `errors.micDenied.*` | Same | Buttons stack | Title is a header; Type instead first |
| Storage under 50 MB | n/a | n/a | `StateScreen` with `errors.storageLow.title`, `.body`, Type instead | Same | Stack | Title is a header |
| Write | Placeholder `tonight.typing.placeholder` | n/a | Autosave failure: `InlineState` with `errors.generic.title`, `.body` above the field; typing continues and the next pause retries | Same | Field grows; Save pinned above the keyboard | Field label `write.label`; status `write.autosaved` announced once per save, not per keystroke |
| Waiting list (3 or more drafts) | Closes itself when the last draft is saved or let go | n/a | n/a | Same | Rows wrap to two lines | Each row: date, kind, "recording" or "typed" |

### 6.5 Copy

Existing keys are in `packages/content/src/strings.en.ts` (checked on `develop` 14 Oct 2026) or `apps/mobile/src/lib/copy.ts` `pendingCopy`. New strings go in the stream's `packages/content/src/features/*.en.ts` file (R5 EQ-29; CLAUDE.md: every word lives in `packages/content`). Proposed text follows `packages/content/VOICE.md` and the content rule tests; content and counsel own the final words.

| Key | Status | Proposed text |
|---|---|---|
| `listen.toChild` | Exists | To {child} |
| `listen.audience` | Exists | Only you, until you add it to the book. |
| `listen.ready.title`, `.body`, `.startButton` | Exist | Ready when you are; Nothing is recording yet. Tap Start when you want to speak.; Start |
| `listen.elapsedA11y` | Exists | {minutes} min {seconds} s recorded |
| `tonight.states.listening`, `.listeningHint`, `.stillHere`, `.paused`, `.resumeButton`, `.stopButton`, `.ready`, `.readyHint` | Exist | as in content |
| `listen.primer.title` | New | Your voice, kept with each letter |
| `listen.primer.body` | New | Next, your iPhone asks to use the microphone. We only listen while you are recording. |
| `listen.primer.othersLine` | New | If someone else is talking nearby, ask them first. |
| `listen.voiceOver.startLabel` | New | Start recording |
| `listen.voiceOver.startHint` | New | Double-tap to start. VoiceOver stays quiet while it records. Double-tap again to pause. |
| `listen.voiceOver.headphonesHint` | New | Without headphones, anything the phone says out loud can be heard in the recording. |
| `listen.voiceOver.recordingLabel` | New | Recording. Double-tap to pause. |
| `wordsCopy.pack.*`, `wordsCopy.waiting.readyBody` | Exist (`packages/content/src/features/words.en.ts`) | as in content; path G uses them unchanged |
| `tonight.waitingMany` | New | {n} letters are waiting for you |
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
| `errors.storageLow.body` | Revised in content (13 Oct: "New recordings may not fit. Freeing some space on this phone will help.") | Add "Typing always works." when F04-U18 ships |
| `permissions.microphone` | Revise (F04-REQ-047). Today (`packages/content/src/permissions.en.ts` and `apps/mobile/src/lib/permission-copy.ts`): "{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone." The second sentence is false for anyone who turns on the encrypted backup (D-073, M7, M14) | {app} uses the microphone to record the letters you speak to your child. Counsel confirms (Q2) |
| `notMuch.button`, `notMuch.confirmBody`, `notMuch.savedToast`, `notMuch.undo` | Exist | as in content |
| `book.quietDay.label`, `.a11y`, `.remove`, `.removedToast` | Exist (D-084) | as in content |

`quickNote.widgetLabel` and `quickNote.lockScreenLabel` exist but carry `{child}`, which a static widget cannot fill and D-025 keeps off the lock screen by default; the widget uses `widget.startLabel`. `notMuch.template` no longer exists: a quiet-day mark carries no words (D-084).

## 7. Requirements and acceptance criteria

Renamed on 14 Oct 2026 (R5 EQ-05): rows that restated a legacy ID owned by another spec now carry a new F04 ID and name the home spec; the legacy ID stays in force there.

| ID | P | Requirement | Acceptance criteria (Given / When / Then) | Source |
|---|---|---|---|---|
| F04-REQ-030 | P0 | A first letter needs no sign-in (capture slice of A-REQ-012; home F02) | Given a fresh install past the 18+ gate and first run, When the person records and saves, Then no sign-in screen appeared and one `entries` row exists | PRD A |
| F04-REQ-031 | P0 | Capture works without an account (capture slice of A-REQ-014; home F02) | Given Later on the Keep the book sheet, When the person records, types and saves 3 letters, Then all 3 rows exist and no sign-in screen appears during capture | PRD A |
| F04-REQ-032 | P0 | Capture works offline (capture slice of A-REQ-030; home F01) | Given airplane mode, When the person records, saves a voice-only letter, types and saves a letter and taps Not much today, Then all succeed and the proxy log shows 0 requests | PRD A, PRD 7.4 |
| F04-REQ-033 | P0 | "To {child}" is visible on Listen, Write and Review and changeable in Review before save (capture slice of B-REQ-004 and PRD-REQ-012; home F12) | Given two children, When recording, Then `listen.toChild` filled with the draft's child is on screen; When the person picks the other child in Review and saves, Then the entry's `child_id` is the chosen child and the first child has no new row. Given one child, Then no chevron or picker shows | PRD B, PRD 3.4 |
| F04-REQ-034 | P0 | Microphone asked only at first Speak, after an in-app primer; purpose string true for every user (microphone slice of LEGAL-REQ-007; home F17) | Given a fresh install, When the person reaches Tonight, Then no OS prompt has appeared. Given first Speak, Then the primer shows before the OS prompt. Given the built Info.plist, Then `NSMicrophoneUsageDescription` equals `permissions.microphone`, makes no claim about where recordings are kept, does not mention sharing with family or cloud transcription, and no speech-recognition key exists | LEGAL-REQ-007; B7; M16 |
| LEGAL-REQ-011 | P0 (raised from P1 for capture) | Stop and keep on background; never auto-start; recording-consent line; no background recording | Given recording, When the app goes to the background, Then within 1 s the draft is `ready` with a hash and Review opens on return. Given the built Info.plist, Then `UIBackgroundModes` has no `audio`. Given the primer, Then `listen.primer.othersLine` is visible. Given a widget or notification launch, Then no audio session is set to recording until an in-app tap | LEGAL-REQ-011; PRD 6.3 checklist |
| DATA-REQ-048 | P0 | Atomic local save | Given 500 scripted kills at random offsets during save on Simulator and 50 on an SE 3, Then every iteration ends with exactly one of: an entry whose `audio_sha256` matches its file, or an intact draft with its file; 0 rows point at a missing file; `PRAGMA integrity_check` returns ok | DATA-REQ-048; PRD 7.4; BL-135 |
| F04-REQ-035 | P0 | Audio hashed when recording stops (capture slice of DATA-REQ-046; home F08) | Given a finished take, Then the draft holds a 64-character SHA-256 and byte size before state `ready`. Given a draft without a hash, When saved, Then the hash is computed before the transaction (`ensureAudioHash`) | DATA-REQ-046 |
| F04-REQ-036 | P0 | Idempotent local saves (capture slice of DATA-REQ-044; home F16) | Given a draft, Then its UUIDv7 id becomes the entry id. Given a save retried twice, Then one `entries` row exists | DATA-REQ-044 |
| F04-REQ-037 | P0 | No content from capture in logs, analytics or crash reports (capture slice of LEGAL-REQ-014; home F17) | Given the E2E run with the Asha fixture letter spoken and typed, When device logs and analytics payloads are scanned, Then 0 matches for the fixture strings, child name or language name | LEGAL-REQ-014; B-NFR-001 |
| F04-REQ-001 | P0 | Draft row before the first audio byte | Given Speak with permission granted, When `record()` is called, Then a `drafts` row with state `recording` and the file path already exists (assert in the reducer test and an integration test with a fake recorder that records call order) | Brief M2; TDD 01 section 3.4 rule 1 |
| F04-REQ-002 | P0 | Elapsed time persisted during a take | Given a 60 s take, Then `audio_duration_ms` on the draft is updated at least 11 times; Given a kill at 47 s, Then the recovered draft shows a duration between 45 s and 47 s | `listen.tsx` 5 s progress write |
| F04-REQ-003 | P0 | Any OS interruption stops and keeps the take | Given recording, When the recorder reports not recording after it was recording, or `hasError`, or `mediaServicesDidReset`, Then the take is finalized once and Review opens. Never auto-resumes | TDD 03 FM-1; section 11.5 deviation |
| F04-REQ-004 | P0 | Launch recovery never deletes audio | Given drafts in state `recording` at launch, Then the sweep finalizes files with bytes, keeps empty files as `unrecoverable`, drops only rows with no file, and deletes 0 audio files. Given a draft in state `discarding` (F04-REQ-009), Then the sweep removes the row | `sweep.logic.ts`; BL-134 |
| F04-REQ-005 | P0 | Screen kept awake while recording | Given Auto-Lock at 30 s, When a take runs 6 minutes with no touch, Then the take is still recording at 6:00. Given paused for 5 minutes, Then keep-awake is released | R1 F04 (Voice Memos lock signal); section 11 |
| F04-REQ-006 | P0 | 30-minute cap with a warning at 25 minutes; nothing lost at the cap | Given a fake clock, When elapsed reaches 25:00, Then `capture.nearLimitLine` shows and nothing is announced until the recorder pauses or stops; When it reaches 30:00, Then the take stops, is hashed and Review opens with `capture.limitReachedLine`. The cap is the constant `maxMs` in `packages/core/src/capture.ts`; no remote config key changes it at v1.0 (the closed schema in `packages/api/src/remote-config.ts` has none, R5 EQ-17) | R1 F04 (StoryCorps, Remento); TDD 03 section 3.4 |
| F04-REQ-007 | P0 | Pause and resume in one file | Given recording, When Pause, Then the clock stops, the aura shows paused and `tonight.states.paused` is announced; When Keep talking (`tonight.states.resumeButton`), Then recording continues into the same file and the final duration excludes paused time | `listen.tsx` |
| F04-REQ-008 | P0 | Storage thresholds | Given free space under 1 GB, When Speak, Then recording starts and `capture.storageLowLine` shows. Given under 50 MB, Then no draft is created and the storage card shows. Given a drop under 20 MB mid-take, Then the take stops and is kept within 30 s. Typed letters are never blocked | PRD 7.7; TDD 03 section 3.2 rule 5 |
| F04-REQ-009 | P0 | Audio is deleted only by a confirmed Let it go | Given any draft with audio on Listen, Review or the Tonight row, When Let it go is confirmed, Then the draft moves to state `discarding`, the file is deleted, then the row is deleted. Given a kill between steps, Then the sweep never re-attaches that file and removes the row. Given a held draft that synced (F16 6.2 I), Then the same transaction queues `held.discard`, which removes the server row and any backup of its recording (F08-REQ-043). No other code path deletes a draft's audio | `listen.tsx`; DATA-REQ-048; FirstChapter (R1-S4) |
| F04-REQ-010 | P0 | One take at a time | Given a take is live, When Speak, the widget or a deep link asks for another, Then no second recorder starts and the live Listen screen stays in front | `recorder.ts` `activeTakeId` |
| F04-REQ-011 | P0 | Typed text autosaves | Given typing, Then the draft is written 500 ms after the last keystroke and immediately on AppState `inactive` or `background`. Given the typed kill run of 100 iterations, Then at most the last 500 ms of typing is lost in every iteration | R2 section 6 F04; `write.tsx` |
| F04-REQ-012 | P0 | Typed text is stored exactly as typed (B5) | Given typed text containing an em dash, curly quotes, an ellipsis character, an emoji, Devanagari and Arabic, When saved, Then `raw_transcript` and `final_text` equal the typed string after removing only leading and trailing whitespace; `edit_level = verbatim`; `machine_edits = []`; `normalizeChars` and `faithfulClean` are not called on typed drafts | B5; `review.tsx` |
| F04-REQ-013 | P0 | Write respects the keyboard and any script | Given Write, Then the TextInput keeps the system defaults for autocorrect, spell check and capitalisation (no prop turns them off) and adds no suggestion bar of ours. Given an Arabic keyboard, Then text aligns right and the caret moves right to left (manual script) | B4, B5; DR-01 A (typed Arabic) |
| F04-REQ-014 | P0 | Note or letter is a label chosen in Review | Given Speak or Type from Tonight, Then the draft `kind` is `letter`; Given the widget, Then `note`. Given Review, Then a two-option control (`tonight.noteOrLetter.note`, `tonight.noteOrLetter.letter`) shows the draft kind preselected; the saved entry's `kind` matches the control. `not_much` is never offered in the control | BRAND.md naming system |
| F04-REQ-015 | P0 | Backdating to a day or a month, free | Given a born child, Then the day picker allows any date from 3 years before the birthday to today; the month tab lists Before You, The first weeks, and Month 1 to the current month. Given a month choice, Then `occurred_on` is the first day of that month of age and `occurred_precision = month`. Given an expecting child, Then only the day tab shows, bounded from 3 years before the due date to today. Never a Plus check | R2 T25, UR R10 |
| F04-REQ-016 | P0, Rev (D-084) | Not much today saves a quiet-day mark with no words | Given a tap, Then one entry with `kind = not_much`, `raw_transcript = ''`, `final_text = ''`, `in_book = false` for the active child and local date is saved in under 100 ms, and `notMuch.savedToast` shows with Undo. Given a second tap that day for that child, Then no new row. Given any mark, Then it is excluded from every count (letters kept, the membership ledger, chapter counts), from the printable book, from Read together and from playback, and it can never be added to the book. Given an old mark with a stored sentence, Then no screen, export or read-aloud path shows that sentence | D-084; C-REQ-005; `quiet-day.logic.test.ts` |
| F04-REQ-017 | P0 | Language chip on Listen | Given an author with two or more letter languages (F03), Then a chip shows the current language and a tap opens the list of the author's languages; the value at Finish is stored on the draft `language`. Given one language, Then no chip. Never auto-detected | B-REQ-003; R5 section 2.4 |
| F04-REQ-018 | P0 | Model state never blocks capture | Given no model on the phone, When Speak, Then recording starts with the same latency and Review shows the waiting card with Keep the recording only | TDD 03 FM-9; PRD 7.4 |
| F04-REQ-019 | P0 | Capture is fully accessible | Given VoiceOver and a paused or ready Listen, Then the swipe order is "To {child}", audience line, prompt, elapsed time, state, language chip, Keep talking or Start, Finish, Let it go; the aura is hidden from accessibility; while recording, the VoiceOver take layout applies (F04-REQ-041); Magic Tap starts and pauses through `onMagicTap` [A: confirmed on device in WP-F04-01 before G3; if absent, the one-element double-tap is the only control and the line is dropped]. Given AX5, Then nothing truncates and buttons stack. Given Reduce Motion, Then only fades and the stepped ring. Pause and Finish sit in the bottom third at 56 pt or taller; Speak and Type at 64 pt | LEGAL-REQ-051; A-NFR-005; DESIGN_LANGUAGE section 1 principle 2; TDD 09 |
| F04-REQ-020 | P1 | Widget opens capture safely | Given the widget tapped, Then Listen opens in Ready state and nothing records until Start is tapped. The widget shows no child name and reads no app data | R4-S61; D-025; 02 section 6 item 5 |
| F04-REQ-021 | P0 | Notifications never open a live recording | Given a reminder tapped, Then Tonight opens and the audio session stays idle | LEGAL-REQ-011 |
| F04-REQ-022 | P0 | Denied path and return from Settings | Given denied, When Speak, Then the denied card shows and no OS prompt appears. Given the person enables the microphone in Settings and returns, Then within 1 s of AppState `active` the card becomes the Ready state | LEGAL-REQ-007 |
| F04-REQ-023 | P0 | Fast start | Given an SE 3 with permission granted, When Speak is tapped 200 times in the perf build, Then tap to first non-silent metering sample is p95 500 ms or less | PRD 7.1 |
| F04-REQ-024 | P0 | Kill while recording is measured and recovered | Given 50 kills at random points 10 s to 120 s into a take on an SE 3, Then 50 of 50 takes have a row after relaunch, 0 files are deleted, and at least 49 of 50 play back to within 5 s of the kill point. If fewer than 49 play, the founder decides on the ADTS fallback before beta C1 (section 11.6) | TDD 03 section 3.2 rule 4, R-4 |
| F04-REQ-025 | P0 | One audio session, restored after capture | Given recording, Then the session uses `doNotMix` with recording allowed (`audio-mode.ts`); Given Finish, discard, background or interruption, Then the mode returns to `idle` within 500 ms. No UI sound plays while the recorder is armed or live (SOUND.md section 3 rule 1) | `audio-mode.ts`; SOUND.md |
| F04-REQ-026 | P0 | No processing of the captured signal | Given the recorder options, Then no voice processing, gain or noise suppression is enabled; the file on disk is the recorder's output, byte for byte, until save | B6; DR-09 default A |
| F04-REQ-027 | P0 | Every waiting draft is reachable | Given 1 or 2 waiting drafts for the active child, Then Tonight shows one row each (`tonight.draftWaiting.title`), newest first, each opening its draft. Given 3 or more, Then F04-REQ-046 applies and every draft is one tap from the list. Drafts never expire. Held letters follow F14 and the sync rule there | `listDrafts`; TDD 01 section 3.2.6 |
| F04-REQ-028 | P0 | Calm in a dark room | Given system light or dark mode, When Listen opens, Then the first rendered frame uses the dark colour set (no white frame); no UI sound plays (SOUND.md section 2 default off); keep-awake does not change screen brightness; the only haptics are `press` before the session starts and after it ends | DESIGN_LANGUAGE section 1 principle 2; SOUND.md; MOTION 5b |
| F04-REQ-029 | P0 | The draft keeps its child | Given Listen open for child A, When the active child changes to B elsewhere, Then the draft's `child_id` stays A until the person changes it in Review | PRD-REQ-012 |
| F04-REQ-038 | P0 | Capture never stacks asks (capture slice of PRD-REQ-001; home F02, which defines a session and the ask order) | Given Listen, Write or Review is open, Then no Keep the book, reminder or analytics sheet appears. The microphone primer is the act itself and does not count as the session's ask | PRD 3.4; F02 |
| F04-REQ-039 | P0 | No child-input capture (capture slice of PRD-REQ-005; home F13) | Given the `child-input` flag off, Then no `together` prompt and no "Write one together" entry is reachable from Tonight, Listen or Write | PRD 3.4 |
| F04-REQ-040 | P0 | Nothing the phone says is recorded | Given a take is live (audio mode `recording`), Then `announce()` queues every message and calls no `AccessibilityInfo` method; no element on Listen changes its accessibility label, hint or value; Listen has no live region; and the app presents none of its own notifications. Given the recorder pauses or stops, Then the queued messages are spoken in order. Given the device run VO-REC (VoiceOver on, built-in speaker, no headphones, 60 s of silence in a quiet room, one Magic Tap pause and resume, Finish), Then F05's voice detector finds no speech in the file and the transcript is empty (`outcome = no_speech`) | DX-06; constitution; B6 |
| F04-REQ-041 | P0 | VoiceOver take layout | Given VoiceOver on, When Speak, Then Listen opens with one element labelled `listen.voiceOver.startLabel` and nothing records until a double-tap or Magic Tap. Given recording, Then the screen exposes exactly one element (`listen.voiceOver.recordingLabel`) and focus does not move. Given a double-tap, Then the recorder pauses before any layout change or announcement | DX-06; LEGAL-REQ-051 |
| F04-REQ-042 | P1 | Dark surface and dimming | Given system light mode, When Listen opens, Then every colour comes from the `dark` set. Given 30 s with no touch while recording, Then all elements except Pause and Finish render at 40% opacity and the aura is the static ring; a touch restores them within 200 ms. Reduce Motion: the change is a 200 ms fade | DX-13; DESIGN_LANGUAGE principle 2 |
| F04-REQ-043 | P1 | "Still here" follows the take's own level | Given the first 5 s of a take, Then `stillHere` never shows. Given later 8 s in which every metering sample is at least 15 dB below the take's running 90th-percentile level [A: thresholds set from Study 1 recordings], Then `stillHere` shows once until speech returns. Given a steady whisper at -45 dBFS with a white-noise floor at -55 dBFS, Then it never shows | DX-14; R3 study 1 |
| F04-REQ-044 | P0 | First spoken letter before speech is ready | Given no verified model, When a take finishes, Then Review shows path G with the download state; Keep my voice saves a private voice-only entry with `transcript_status = waiting` and does not change the free-letter ledger. Given the words arrive, Then the Tonight row (`wordsCopy.waiting.readyBody`) shows until the author opens the letter in Review, and the letter counts only at the Save with its words on screen (F14-REQ-037) | DX-02; M17; F05-REQ-043; F14 6.2 B2 |
| F04-REQ-045 | P1 | The Plus line lives where F14 puts it | Given F14's allowance is used and Plus is off, Then Tonight and Write show F14's standing line (`billingCopy.tonight.plusLine`, F14-REQ-040) as a state with no number; Listen shows nothing about Plus, so nothing competes with the take (F14 owns the copy and the rule) | DX-03; F14-REQ-040; M1 |
| F04-REQ-046 | P1 | Many waiting drafts collapse into one row | Given 3 or more waiting drafts for the active child that are not held at the Keep step, Then Tonight shows one row `tonight.waitingMany` that opens a list of drafts newest first; held letters are always F14's single row (`tonight.heldRow.title`, F14 6.2 B step 2a); no other row or badge names them | DX-22; 03 principle 4 |
| F04-REQ-047 | P0 | Microphone purpose string makes no storage claim | Given the release build, Then `NSMicrophoneUsageDescription` has no sentence about where recordings are kept, so it is true with backup on or off; the content rules test compares `permissions.en.ts` and `permission-copy.ts` (exists) | R2 AR-24; R4 PT-01; M16 |
| F04-REQ-048 | P0, new | A finished take survives a forced reboot (R8 R2A-19) | Given 20 takes on an SE 3, each followed within 1 s of Finish by a forced restart (the hardware button sequence), Then after each reboot the draft or entry exists, its file opens, and its SHA-256 equals the recorded hash. Any failure opens WP-F04-18 (`F_FULLFSYNC` before the hash) and the 06 save budget adds it back | 06 section 2.2; DATA-REQ-048; `recorder.ts` header on `develop` |

### 7.1 Test map (P0)

Every P0 row above names where its test lives. Test titles start with the ID in brackets (07 section 1.1). "New" means the file does not exist on `develop` on 14 Oct 2026. Component tests at AX5 wait for the render harness WP-F00-01 (07 section 2.1); until it merges they are device evidence in `docs/qa/evidence/`.

| ID | Test file or run | Exists? |
|---|---|---|
| F04-REQ-030, F04-REQ-031, F04-REQ-032 | `apps/mobile/e2e/flows/E2E-03-speak-save-offline.yaml`; proxy zero-request assertion added; `apps/mobile/test/store.entries.test.ts` | Flow and test exist; the proxy assertion is new (needs mitmproxy, 07 section 2.6) |
| F04-REQ-033, F04-REQ-029 | `apps/mobile/test/capture-child.test.ts` | New |
| F04-REQ-034, LEGAL-REQ-011 (Info.plist half) | `apps/mobile/test/permissions-manifest.test.ts` (built Info.plist: keys, `UIBackgroundModes`) | New |
| F04-REQ-047 | `packages/content/test/rules.test.ts` (new case: no storage claim in `permissions.microphone`) | File exists, case new |
| F04-REQ-048 | DL-01 forced-reboot case (new row in `docs/qa/DEVICE_TEST_PLAN.md`, request to S19) | New |
| LEGAL-REQ-011 (stop and keep) | `packages/core/test/capture.test.ts`; device S1-11 | New |
| DATA-REQ-048 | `apps/mobile/test/store.entries.test.ts`; kill-during-save runs DL-01 | Test exists; runs not done |
| F04-REQ-035, F04-REQ-002, F04-REQ-004, F04-REQ-009 | `apps/mobile/test/sweep.test.ts` (add `discarding` and duration cases) | Exists |
| F04-REQ-036 | `apps/mobile/test/store.entries.test.ts` (retry case) | Exists |
| F04-REQ-037 | `packages/analytics/test/domain.test.ts`; E2E log canary (BL-239) | Test exists; canary new |
| F04-REQ-001, F04-REQ-003, F04-REQ-006, F04-REQ-007, F04-REQ-010 | `packages/core/test/capture.test.ts`; `apps/mobile/test/recorder-order.test.ts` (fake recorder call order) | New |
| F04-REQ-005 | `apps/mobile/test/keep-awake.test.ts`; device S1-12 | Exists |
| F04-REQ-008 | `apps/mobile/test/capture-storage.test.ts` | New |
| F04-REQ-011 | `apps/mobile/test/write-autosave.test.ts`; typed kill run (07 section 2.7) | New |
| F04-REQ-012 | `apps/mobile/test/typed-exact.test.ts` (byte equality) | New |
| F04-REQ-013 | Device run "Arabic keyboard" (07 section 2.7) | Not run |
| F04-REQ-014 | `apps/mobile/test/capture-kind.test.ts` | New |
| F04-REQ-015 | `packages/core/test/backdate.test.ts` | New |
| F04-REQ-016 | `apps/mobile/src/components/book/quiet-day.logic.test.ts`, `apps/mobile/test/quiet-day-book.test.ts`, `apps/mobile/test/billing-ledger.test.ts` (new case: a mark never counts) | Exist; ledger case new |
| F04-REQ-017 | `apps/mobile/src/lib/language/spoken-language.logic.test.ts`; `apps/mobile/test/language-chip.test.ts` | First exists; second new |
| F04-REQ-018, F04-REQ-044 | `apps/mobile/test/transcription-queue.test.ts`; `apps/mobile/test/first-letter-waiting.test.ts`; `apps/mobile/test/billing-ledger.test.ts` (voice-only letter does not count, M17) | Queue test exists; others new |
| F04-REQ-019 | VoiceOver script V1 (07 section 2.11); `apps/mobile/e2e/flows/E2E-15-voiceover-smoke.yaml` | Flow exists; script run not done |
| F04-REQ-021 | `apps/mobile/test/notification-route.test.ts` | New |
| F04-REQ-022 | `apps/mobile/test/listen-permission.test.ts`; device S1-03 | New |
| F04-REQ-023 | Perf build run, 200 taps on SE 3 (06-nfr.md Gate row) | Not run; needs the `perf` profile (R5 EQ-30) |
| F04-REQ-024 | Device DL-01 kill-while-recording, evidence file | Not run |
| F04-REQ-025 | `apps/mobile/test/audio-mode.test.ts` | New |
| F04-REQ-026 | `apps/mobile/test/recorder-options.test.ts` | New |
| F04-REQ-027 | `apps/mobile/test/drafts-list.test.ts` | New |
| F04-REQ-028 | `apps/mobile/test/theme-leaks.test.ts` (Listen case); first-frame snapshot on device | Test exists, case new |
| F04-REQ-038 | `apps/mobile/src/lib/analytics/ask-sequencer.logic.test.ts` | Exists |
| F04-REQ-039 | `apps/mobile/test/child-input-flag.test.ts` | New |
| F04-REQ-040 | `apps/mobile/src/lib/a11y.logic.test.ts` (new case for a pure `shouldHoldAnnouncement(mode)`); `apps/mobile/test/listen-voiceover.test.ts`; device run VO-REC (07 section 2.11, V1c) | First exists; others new |
| F04-REQ-041 | `apps/mobile/test/listen-voiceover.test.ts`; VoiceOver script V1c | New |

## 8. Data, privacy and security

| Data | Level (PRD 7.10) | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| Recording file (AAC-LC mono M4A, F08) | L4 | App Documents folder (`directory: 'document'` in `listen.tsx`), in the user's own device backup if they use one [Unverified until BL-284, D-033] | The author's app on this phone | Until the person lets it go (draft) or the letter is purged (F08) | Capture sends nothing. After save, only as ciphertext through the owner's encrypted backup when the owner turns it on (F08 6.5; D-073, M7, M16), and through the person's own share sheet in export (F15) |
| `drafts.typed_text`, `drafts.raw_transcript` | L4 | Local SQLite `scribe.db` | Author | Until saved or let go; never expire | Never, except a held letter or a waiting voice-only letter of a signed-in author, which syncs as an author-only `held_drafts` row defined in F16 6.2 I (F14-REQ-039; TDD 01 section 3.2.6 is superseded for those). A draft that was never held (in progress, typed and not yet saved, waiting to be read back) never leaves the phone. The draft id becomes the entry id at save (F04-REQ-036), so the server row, the backup object and the letter share one id (R8 R2A-04, R2A-05) |
| `drafts.audio_uri` | L3 | Local SQLite | Author | As above | Never |
| `drafts.state`, `audio_sha256`, `audio_bytes`, `recovered_at` (exist in migration 3) | L2, L4 for the hash (derived from content, TDD 03 section 4.1) | Local SQLite | Author | As above | Never |
| `drafts.kind`, `drafts.occurred_precision` (new) | L2 | Local SQLite | Author | As above | Never |
| `drafts.occurred_on` (new) | L3 | Local SQLite | Author | As above | Never |
| `drafts.language` (new) | L4 (languages are L4, PRD 7.10) | Local SQLite | Author | As above | Never |
| `entries.occurred_precision` (new), `entries.language` (new) | L2, L4 | Local SQLite, then Postgres through sync (F16) | Author; book members see the date precision; whether members see the language is the F11 and F16 owners' call (R3 DX-10 asks for it); never in analytics | Life of the letter | With the letter, after sign-in and sensitive-data consent (LEGAL-REQ-006) |
| `drafts.base_direction`, `entries.base_direction` (new, `ltr` or `rtl`) | L2 (layout only) | Local SQLite, then Postgres; readable by members | Every reader | Life of the letter | With the letter |
| Quiet-day mark (`kind = not_much`): child, date, no text (D-084) | L2 (a date and a kind; no words) [A: classification row to confirm in `DATA_CLASSIFICATION.md`] | Local SQLite | Author | Until removed or the book is erased | Syncs as an entry when sync is on; never in the book, so never seen by members |
| Settings `capture.micPrimerSeen` (new) | L2 | Local `settings` | App | Install | Never |
| Analytics events (section 10) | L2 | PostHog after opt-in | Analytics | 12 months (TDD 03 section 4.1) | Only after consent; nothing queued before (PRD-REQ-016) |

Rules:
1. Capture makes no network request. Capture itself never uploads audio. The encrypted backup of the owner's recordings that D-073 and M14 put in v1.0 is a separate, later step owned by F08 and F16, not built on 13 Oct (F08 section 12); its copy follows M16 (we hold a recovery key under logged access). No server transcription at v1.0 (03 section 5).
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
| Local save commit, 2-minute take | p95 200 ms including hash of the closed file (no fsync; 06 section 2.2) | Yes | Perf build (TDD 01 section 5.3) |
| Finalize of a 30-minute take (about 14.4 MB at 0.48 MB per minute, R5 section 6) | p95 1.5 s [A] | No | Perf build; native streaming hash once BL-140 lands |
| Typed autosave latency | 500 ms after the last keystroke; immediate on background | Yes | Unit plus typed kill run |
| Kill during save | 0 losses in 500 Simulator plus 50 device iterations | Yes | BL-135 |
| Kill while recording | 50 of 50 rows kept; 49 of 50 playable to within 5 s | Yes (report plus decision) | WP-F04-11 |
| Not much today | Saved and toast visible within 100 ms of the tap | No | Component test |
| Memory while recording | Under 40 MB above the app's idle footprint [A] | No | Instruments, 10-minute take |
| Battery while recording | 2% or less for a 10-minute take [A] | No | 10 takes, `UIDevice.batteryLevel` delta averaged (TDD 06 method) |
| Download size | Widget extension adds 2 MB or less toward the 40 MB app budget [A] (B13) | Yes for the total | EAS build size check |
| Accessibility | WCAG 2.2 AA; AX5 on Tonight, Listen, Write; VoiceOver scripts V1 and V1c pass; zero synthetic speech in a VoiceOver recording (F04-REQ-040) | Yes | TDD 09 L3 and V1; 07 section 2.11 |
| Network | 0 requests from capture | Yes | E2E proxy log |

## 10. Analytics

All events are opt-in (LEGAL-REQ-003), typed in `packages/analytics/src/catalog.ts`, L2 only, never with text, names, languages or durations beyond buckets.

| Event | Status | Properties | Question it answers |
|---|---|---|---|
| `capture_started` | Exists; add `widget` to `source` | `mode`, `source` (`tonight`, `book`, `notification`, `widget` new, `make_it_yours`, `resurface`), `prompt_kind`, `child_ordinal`, `member_role` | Where capture starts, and whether people speak or type (U1) |
| `capture_ended` | New | `reason` (`user`, `background`, `interruption`, `dismiss`, `max_length`, `low_storage`), `audio_bucket` | How often a take ends without the person choosing; durability health |
| `capture_recovered` | New, sent once per launch sweep with counts | `finalized` int, `unrecoverable` int, `reattached` int | Whether kills mid-take happen in the field and whether recovery works |
| `capture_discarded` | Exists | `mode`, `stage`, `audio_bucket` | How often people let a take go |
| `os_permission_result` | Exists; reuse with `permission = microphone` (R5 EQ-29) and add `primer_shown` bool | `permission`, `granted`, `primer_shown` | Whether the primer helps people allow the microphone |
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
| Recorder session | `apps/mobile/src/lib/capture/recorder.ts` | Exists; add storage checks. Keep-awake is built in `listen.tsx`. No fsync exists: the header says expo-file-system has none and relies on AVAudioRecorder closing the file |
| Launch sweep | `apps/mobile/src/lib/capture/sweep.ts`, `sweep.logic.ts` | Exists; add the `discarding` rule |
| Free space reader | `apps/mobile/src/lib/capture/storage.ts` | New. Use `Paths.availableDiskSpace` from expo-file-system, which export already uses (`apps/mobile/src/lib/export/device.ts`) |
| Keep-awake wrapper | `apps/mobile/src/lib/resilience/keep-awake.ts` (`useKeepAwakeWhile`) over `expo-keep-awake` | Built; used by `app/listen.tsx` and `components/player/audio-player.tsx` (Read together holds the screen through the player, not from `read-together.tsx`). The 5-minute release while paused (F04-REQ-005) is not in it: it holds while paused for as long as the pause lasts |
| Playability probe | `apps/mobile/src/lib/capture/probe.ts` | Built (D-085): a recovered take that does not load with a duration is kept, marked `unrecoverable` and listed in Settings > Recordings |
| Quiet-day mark | `apps/mobile/src/components/book/quiet-day.logic.ts`, `quiet-day-row.tsx` | Built (D-084) |
| Date sheet for Review | `apps/mobile/src/components/capture/date-sheet.tsx` | New; F06 places it in Review |
| Kind control for Review | `apps/mobile/src/components/capture/kind-control.tsx` | New; F06 places it |
| Language chip | `apps/mobile/src/components/capture/language-chip.tsx` | New; reads the author's languages from F03 |
| Capture strings | `packages/content/src/features/capture.en.ts` | New (R5 EQ-29; CLAUDE.md) |
| Announcement hold while recording | `apps/mobile/src/lib/a11y.ts` (`announce`) | Exists; add the `recording` mode to the existing playback hold (F04-REQ-040) |
| VoiceOver take layout | `apps/mobile/src/app/listen.tsx` | New branch (F04-REQ-041) |
| Local schema | `apps/mobile/src/lib/db/migrations.ts`, next free version | New; the coordinator assigns the number in merge order (08 section 4; R2 AR-37) |
| Store API | `apps/mobile/src/lib/store.ts` | Exists; new functions in 11.3 |
| Full fsync, only if the forced-reboot case fails | A `fullFsync(path)` function (new) using `F_FULLFSYNC` in the existing `apps/mobile/modules/scribe-audio` module. Corrected 15 Oct: there is no `scribe-audio-decode` module on `develop` (modules are `scribe-audio`, `scribe-files`, `scribe-store`) and no fsync in any of them (R8 R2A-19) | Not built; WP-F04-18 |
| Widget | `expo-widgets` config plugin plus a `'widget'` component (R4-S61) | New, P1 |
| Deep link to Ready state | `apps/mobile/src/app/listen.tsx` param `entry=widget` | New |

Libraries: `expo-audio` ~57.0.5, `expo-file-system` ~57.0.7, `expo-crypto` ~57.0.3, `expo-sqlite` ~57.0.3, `expo-keep-awake` ~57.0.2, `@react-native-community/datetimepicker` 9.1.0, `react-native-reanimated` 4.5.1 (all installed, `apps/mobile/package.json`; `expo-keep-awake` corrected 14 Oct per `reviews/R6-fact-check.md` check 3 row 2). New: `expo-widgets` (R4-S61; licence not stated on the page, check before install). Installs follow the brief: `flock /tmp/scribe-npm.lock npx expo install <pkg>`.

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

Constants in `packages/core/src/capture.ts`: `maxMs` 1,800,000 (a constant at v1.0; no remote key), `warnBeforeEndMs` 300,000, `keepAwakePausedMs` 300,000, `progressEveryMs` 5,000, `storageCheckEveryMs` 30,000, `warnBelowBytes` 1,000,000,000, `refuseBelowBytes` 50,000,000, `finishBelowBytes` 20,000,000, `startTapGuardMs` 500. The 30-minute ceiling matches the whole-file VAD decode budget in TDD 03 section 3.4 (30 minutes, 58 MB of PCM).

### 11.3 Data model and store contract

Next local migration (append-only, one transaction, test in `apps/mobile/test/migrations.test.ts` from v0 to head; the number is assigned by the coordinator, R2 AR-37):
```sql
ALTER TABLE drafts ADD COLUMN kind TEXT NOT NULL DEFAULT 'letter';      -- note | letter
ALTER TABLE drafts ADD COLUMN occurred_on TEXT;                          -- YYYY-MM-DD; null = local date of created_at
ALTER TABLE drafts ADD COLUMN occurred_precision TEXT NOT NULL DEFAULT 'day'; -- day | month
ALTER TABLE drafts ADD COLUMN language TEXT;                             -- BCP-47, null = author default
ALTER TABLE entries ADD COLUMN occurred_precision TEXT NOT NULL DEFAULT 'day';
ALTER TABLE entries ADD COLUMN language TEXT;
ALTER TABLE drafts ADD COLUMN base_direction TEXT NOT NULL DEFAULT 'ltr'; -- ltr | rtl (DX-20)
ALTER TABLE entries ADD COLUMN base_direction TEXT NOT NULL DEFAULT 'ltr';
```
`base_direction` is `rtl` when the letter language is Arabic; for a typed letter in any other language it is `rtl` when right-to-left letters outnumber left-to-right letters in the text at save [A: rule checked against the F09 fixtures]. It never changes the words.
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
**Outcome so far (ADR 0027, 27 Oct):** the simulator answered the playable half. No killed M4A take opened (0 of 70 across five kill-harness runs). The coordinator chose option (a) without the remux, under D-117 (the founder may reverse it): every iOS build cut from develop from #293 on records ADTS AAC (`.aac`), kept exactly as recorded, and 100 of 100 killed ADTS takes played to within 5 s on the simulator. Still to come on the SE 3: this spike's 50 kills, the interruption runs, and ADR 0027's DL-06 (due before the build 2 freeze; if it fails, iOS goes back to M4A). Android stays M4A.

### 11.7 Sequencing

Order only; dates live in `08-delivery.md` section 2.1 (M15; R1 PL-03).

1. WP-F04-01 device runs (with FT-22) and WP-F04-02 reducer.
2. WP-F04-15 VoiceOver capture fix (never-cut: it keeps words the parent did not say out of letters).
3. WP-F04-03 local migration, then WP-F04-04 recorder hardening (cap and storage checks).
4. WP-F04-05 primer and WP-F04-07 typed exactness in parallel; WP-F04-16 first-letter path with F05 WP-F05-14.
5. WP-F04-08 backdating and WP-F04-10 discard state before freeze; if they slip, they are the first F04 cuts (backdating moves to v1.0.x; the `discarding` state is a durability fix and does not move).
6. WP-F04-11 kill runs on every release candidate.
7. WP-F04-12 widget: not started; recommended cut from v1.0 (Q4).

## 12. Work packages

Status is what the code on `develop` holds on 13 Oct 2026. "Device" names the run in `docs/qa/DEVICE_TEST_PLAN.md` that must pass on a real iPhone; none of them has run yet (ROADMAP 2.1 section 0). `08-delivery.md` section 3.3 governs file ownership: a path below owned by another stream is a request to that stream, not a licence to edit (R5 EQ-08).

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|
| WP-F04-01 | Device spike: kill-while-recording playability, interruption events, lock to background, resume after interruption, keep-awake | `docs/qa/evidence/` (new evidence file per DEVICE_TEST_PLAN) | BL-030 dev build | 50 kills recorded with playable count and seconds lost; each of F04-U05 to U13 has an observed behaviour | pair (QA engineer, mobile engineer) | Not run | S1-10 to S1-13, DL-01 (iPhone SE 3) |
| WP-F04-02 | Pure capture reducer and constants | `packages/core/src/capture.ts`, `packages/core/test/capture.test.ts` | none | `[F04-REQ-001]` insert before record; `[F04-REQ-003]`, `[F04-REQ-006]`, `[F04-REQ-007]`, `[F04-REQ-008]`, `[F04-REQ-010]` state tests green; `npm test` | agent (mobile engineer) | Not built. The phases live inside `listen.tsx` (`Phase` type: ready, asking, denied, recording, paused, finishing) | none |
| WP-F04-03 | Next local migration (draft kind, date, precision, language, base direction), store functions, classification rows | `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/store.ts`, `apps/mobile/test/migrations.test.ts`, `docs/legal/DATA_CLASSIFICATION.md` section 4.5 (request to S17) | none (BL-111 done: store routes through `db/repos`) | Fixture DBs v0 to head migrate with row counts and hashes unchanged; `[F04-REQ-036]` retry test; `npm test` | agent (mobile engineer) | Not built | none |
| WP-F04-04 | Recorder hardening: 30-minute cap, storage checks, release keep-awake after 5 minutes paused | `apps/mobile/src/lib/capture/recorder.ts`, `apps/mobile/src/lib/capture/storage.ts` (new), `apps/mobile/src/lib/resilience/keep-awake.ts` | WP-F04-02, WP-F04-03 | `[F04-REQ-005]` (device), `[F04-REQ-006]`, `[F04-REQ-008]` integration with fake free space; `[F04-REQ-002]`, `[F04-REQ-025]`, `[F04-REQ-026]`, `[F04-REQ-035]` | agent plus device check (mobile engineer) | Partly built. Built: draft before record, stop and keep on background and interruption (`listen.tsx` line 166), one take at a time (`activeTakeId`), keep-awake while live or paused, SHA-256 at stop, playability probe after a kill. Not built: cap, storage checks, the 5-minute paused release. No fsync: `recorder.ts` header says expo-file-system has none and relies on AVAudioRecorder closing the file | S1-11, S1-12, S1-14 |
| WP-F04-05 | Microphone primer, denied card, return from Settings | `apps/mobile/src/app/listen.tsx` (primer and denied branches), `packages/content/src/features/capture.en.ts` (new) | WP-F04-02 | `[F04-REQ-034]` manifest lint; `[F04-REQ-047]` content rule; `[F04-REQ-022]` E2E | agent (mobile engineer, content) | Partly built. Denied state exists (`listen.tsx` phase `denied`); the iOS prompt is asked on first Speak with no in-app primer. Purpose string still says "Your recordings stay on this phone" (`permission-copy.ts`, `permissions.en.ts`), which F04-REQ-047 removes; counsel confirms (Q2) | S1-03, S1-10 |
| WP-F04-06 | Listen UI: "To {child}", prompt line, language chip, Ready state, AX5 stack, VoiceOver order, kept-so-far and limit lines | `apps/mobile/src/app/listen.tsx`, `apps/mobile/src/components/capture/language-chip.tsx` | WP-F04-02, F03 languages API | `[F04-REQ-017]`; `[F04-REQ-019]` at AX5 by the device script until the render harness WP-F00-01 merges (R5 EQ-04), then as component tests; VoiceOver script V1; `[F04-REQ-021]`, `[F04-REQ-029]`, `[F04-REQ-033]`, `[F04-REQ-038]`, `[F04-REQ-039]` | agent (mobile engineer, design systems) | Partly built. Built: listening, paused and still-here lines, elapsed time announced each minute, pause and resume. Not built: language chip, "To {child}" line on Listen (search found no `toLabel` in `listen.tsx`), limit lines | S1-23 VoiceOver walk |
| WP-F04-07 | Write: background flush, exact typed text, RTL check | `apps/mobile/src/app/write.tsx`; the typed branch of `apps/mobile/src/app/review.tsx` (only `cleanedText` for typed) | WP-F04-03 | `[F04-REQ-011]`, `[F04-REQ-012]` byte-equality test, `[F04-REQ-013]` manual Arabic script | agent (mobile engineer) | Partly built. Typed drafts save through `setDraftTyped`. Not built: typed text is still passed through `normalizeChars` (`review.tsx` line 244), which breaks F04-REQ-012 and B5 | Arabic keyboard check on device |
| WP-F04-08 | Backdating rules and date sheet | `packages/core/src/backdate.ts`, `packages/core/test/backdate.test.ts`, `apps/mobile/src/components/capture/date-sheet.tsx` | WP-F04-03 | `[F04-REQ-015]` bounds, month starts on the 31st, expecting child; component test | agent (mobile engineer) | Not built | none |
| WP-F04-09 | Not much today as a quiet-day mark (D-084) | `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/src/components/book/quiet-day.logic.ts`, `quiet-day-row.tsx`, local migration 5 | none | `[F04-REQ-016]`; `quiet-day.logic.test.ts`; migration 5 test | agent (mobile engineer) | Built (commit f4cdbc3). Remaining: a test that the membership ledger never counts a mark (`billing/letter-ledger.logic.ts`) | none |
| WP-F04-10 | Drafts: kind control, all waiting rows on Tonight, confirmed discard with the `discarding` state | `apps/mobile/src/components/capture/kind-control.tsx`, `apps/mobile/src/lib/capture/sweep.logic.ts`, `apps/mobile/test/sweep.test.ts` | WP-F04-03 | `[F04-REQ-009]` kill between steps never re-attaches; `[F04-REQ-014]`; `[F04-REQ-027]` | agent (mobile engineer) | Partly built. Confirmed discard exists (`abandonTake`); the waiting-row card exists on Tonight. Not built: kind control, the `discarding` state | none |
| WP-F04-11 | Kill runs and capture E2E | `apps/mobile/e2e/` (Maestro flows exist, for example `flows/E2E-08-delete-and-undo.yaml`), `docs/qa/evidence/` | WP-F04-04, WP-F04-07 | `[DATA-REQ-048]`, `[F04-REQ-024]`, `[F04-REQ-011]`, `[LEGAL-REQ-011]` pass on the release candidate; `[F04-REQ-004]`, `[F04-REQ-023]`, `[F04-REQ-030]`, `[F04-REQ-031]`, `[F04-REQ-032]`, `[F04-REQ-037]` | human plus agent (QA engineer) | Not run. Maestro cannot drive a physical iPhone (DEVICE_TEST_PLAN "How to use"), so kill runs are by hand | DL-01, DL-02, S1-13 |
| WP-F04-12 | Widget (P1) | `apps/mobile/app.config.ts` (plugin entry only), `apps/mobile/src/widgets/` (new) | WP-F04-06; licence check | `[F04-REQ-020]` E2E: widget deep link records nothing until Start; IPA size check within budget | pair (mobile engineer) | Not built; no widget package in `apps/mobile/package.json`. Recommended cut from v1.0 (Q4) | Lock Screen check |
| WP-F04-13 | Analytics: new events and properties | `packages/analytics/src/catalog.ts`, `docs/analytics/TRACKING_PLAN.md` | none | Catalogue schema tests; `[LEGAL-REQ-017]` allowlist test | agent (analytics engineer) | Not built: `capture_ended`, `capture_recovered` are not in the catalogue; `os_permission_result` exists and gains `primer_shown` | none |
| WP-F04-14 | Server columns `occurred_precision` and `base_direction` with classification comments and access tests | `supabase/migrations/` (new file, S02's range), `supabase/tests/` | WP-F04-03 | `npm run test:db` green, including a member reading `base_direction` through `book_entries`; `approve-migration` label | agent (data architect) | Partly built: `entries.language` exists on the server (`20261005000000_family_cap_language_idempotency.sql`, not applied to any project yet). `occurred_precision` and `base_direction` not built. Needed for v1.0 now that sync ships (M14) | none |
| WP-F04-15 | VoiceOver capture fix: `announce()` holds while recording; direct `AccessibilityInfo` calls in `listen.tsx` replaced; VoiceOver take layout; own notifications held during a take (request to F13 for the handler) | `apps/mobile/src/lib/a11y.ts`, `a11y.logic.ts`, `apps/mobile/src/app/listen.tsx`, `apps/mobile/test/listen-voiceover.test.ts` (new) | WP-F04-02 | `[F04-REQ-040]`, `[F04-REQ-041]` unit green; device run VO-REC: zero speech found in the file | agent plus device check (mobile engineer) | Not built. Today `listen.tsx` line 124 announces "Listening." after recording has started and line 85 announces the elapsed time every minute while recording | VoiceOver script V1c on SE 3 |
| WP-F04-16 | First spoken letter before speech is ready: path G, words-ready row, hand-off to F14's counting moment | `apps/mobile/src/app/review.tsx` (waiting branch, with S11), `apps/mobile/src/app/(tabs)/index.tsx` (row), `packages/content/src/features/capture.en.ts` | F05 WP-F05-14, F14 ledger change (M17) | `[F04-REQ-044]`; `[F04-REQ-018]` | agent (mobile engineer) | Partly built: voice-only save and words-later exist (BL-142); the copy, the row and the seen signal do not | none |
| WP-F04-17 | Listen dark surface and dimming, relative `stillHere`, collapsed waiting row | `apps/mobile/src/app/listen.tsx`, `packages/core/src/capture.ts`, `apps/mobile/src/app/(tabs)/index.tsx` | WP-F04-02 | `[F04-REQ-042]`, `[F04-REQ-043]`, `[F04-REQ-046]`; `[F04-REQ-028]` | agent (mobile engineer, design systems) | Not built | First-frame snapshot in light mode on SE 3 |
| WP-F04-18 | Full fsync with `F_FULLFSYNC` on the closed take, only if F04-REQ-048 fails | `apps/mobile/modules/scribe-audio/ios/ScribeAudioModule.swift`, `apps/mobile/modules/scribe-audio/index.ts`, `apps/mobile/src/lib/capture/recorder.ts` | F04-REQ-048 device result | `[F04-REQ-048]` 20 of 20 after the change; save budget in 06 section 2.2 still met | agent plus device (speech engineer) | Not built; conditional (new, R8 R2A-19) | DL-01 |

## 13. Open questions and assumptions

**Questions**

| # | Question | Who answers | By when | What changes |
|---|---|---|---|---|
| Q1 | Is a 30-minute constant cap per take right for v1.0? No remote key at v1.0 (the remote-config schema is closed, ADR 0016); a key would be an ADR 0016 change owned by S07 | Founder | Before wave 2 (dates: 08 section 2.1) | `maxMs` and F05 chunking load |
| Q2 | Approve the microphone purpose string without its storage sentence (F04-REQ-047). Backup ships in v1.0 (M14), so "Your recordings stay on this phone" is false for anyone who turns it on | Counsel, founder | With the M14 counsel delta (08 section 2.1) | `permissions.en.ts`, `permission-copy.ts`; `docs/legal/app-store-privacy-labels.md` section 4 |
| Q7 | Can `expo-audio` report the current output route (speaker or headphones), so the headphones hint in 6.2 H shows only when it matters? | Mobile engineer, WP-F04-01 | Before G3 | Hint shown always with VoiceOver on, or only on the speaker |
| Q8 | Answered by F14 (14 Oct): a standing line on Tonight and Write (F14-REQ-040); F04-REQ-045 points at it | n/a | Closed | F04-REQ-045 |
| Q3 | Can the first-letter time be kept on the device as an L2 bucket and sent once after analytics consent, or is that "queued before consent" (PRD-REQ-016)? | Analytics engineer, counsel | 30 Oct | Whether the 90 s activation metric is measurable outside TestFlight |
| Q4 | Keep the widget in v1.0 as P1? Nothing is built; spec default [R]: cut to v1.1 (feature freeze date in 08 section 2.1) | Founder | 16 Oct | WP-F04-12 |
| Q5 | Confirm finalize on interruption instead of TDD 03's pause (section 11.5) | Architect, after WP-F04-01 | 23 Oct | `capture.ts` interruption transition |
| Q6 | `normalizeChars` and `FORBIDDEN_CHARS` in `packages/core/src/text.ts` say forbidden characters must never survive into an entry. B5 says typed text is never rewritten. This spec exempts typed text. The same rule also rewrites standard Chinese quotation marks in spoken text (R5 risk K7) | Core owner with F06 | 16 Oct | `packages/core` text rules and F06 |

**Assumptions**

| # | Assumption | How we validate |
|---|---|---|
| A1 | Locking the phone moves the app to the background, which ends the take | WP-F04-01 on an SE 3 |
| A2 | `expo-keep-awake` exists for SDK 57 with a permissive licence and stops Auto-Lock | Read the installed package; WP-F04-01 |
| A3 | `expo-audio` 57 reports interruptions only through recorder status, so the `isRecording` poll is the detector | WP-F04-01; TDD 03 OQ-8 |
| A4 | Answered: `Paths.availableDiskSpace` (expo-file-system) is in use in `lib/export/device.ts` | Device value checked in S1-14 |
| A5 | React Native 0.86 exposes `onMagicTap` on iOS views and `announcementFinished` on `AccessibilityInfo`; neither was checked against the docs in this revision (no web access) | Read the RN 0.86 docs and run it on device in WP-F04-01, before G3; drop the Magic Tap line if absent |
| A8 | VoiceOver does not speak when a focused element's label is unchanged and focus does not move, so a quiet one-element layout keeps speech out of the take | Device run VO-REC (F04-REQ-040) |
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
- Code read 13 Oct 2026 on `develop`: `apps/mobile/src/app/listen.tsx`, `write.tsx`, `review.tsx`, `(tabs)/index.tsx`; `apps/mobile/src/lib/capture/recorder.ts`, `probe.ts`, `erase.ts`, `sweep.ts`; `apps/mobile/src/lib/resilience/keep-awake.ts`; `apps/mobile/src/lib/db/migrations.ts` (versions 1 to 5); `apps/mobile/src/lib/capabilities.ts`; `apps/mobile/eas.json`; `apps/mobile/src/components/book/quiet-day.logic.ts`; `apps/mobile/src/lib/permission-copy.ts`; commits f4cdbc3 (D-084), 6482cd3 (D-085), c1764f9 (on-device only). `docs/qa/DEVICE_TEST_PLAN.md`; `docs/ROADMAP.md` 2.1.
- Reviews (14 Oct revision): `reviews/R3-design-research.md` DX-02, DX-03, DX-06, DX-13, DX-14, DX-22, DX-33; `reviews/R5-eng-qa.md` EQ-04, EQ-05, EQ-08, EQ-17, EQ-29; `reviews/R2-architect.md` AR-24, AR-37; `reviews/R4-privacy-trust.md` PT-01; `reviews/R6-fact-check.md` check 3 row 2. Code read 14 Oct on `develop`: `apps/mobile/src/lib/a11y.ts` (`announce`, playback hold), `apps/mobile/src/app/listen.tsx` (announcement calls), `packages/content/src/permissions.en.ts`, `packages/content/src/strings.en.ts` (`listen.*`, `review.waiting.*`, `write.autosaved`, `tonight.draftWaiting`).
- Research: R1 section 0 items 5, F04 table (R1-S1, R1-S3, R1-S4, R1-S6, R1-S11, R1-S13, R1-S15, R1-S20, R1-S30, R1-S31, R1-S33, R1-S56, R1-S60, R1-S64, R1-S67, R1-S68); R2 section 0 items 1, 6, sections 2.2, 2.3, 5, 6 (R2-S7, R2-S10, R2-S13, R2-S16, R2-S22, R2-S23, R2-S25, R2-S26); R4 section 9 (R4-S61); R5 sections 2.4, 5, 6; UR S25, S27, S30, R10.
