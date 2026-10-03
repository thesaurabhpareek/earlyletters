# src/lib: local store and capture services (owner: Mobile A)

Other screens import from here; only Mobile A edits these files. Ask for a new
function rather than writing SQL elsewhere. Everything is synchronous SQLite
(expo-sqlite) and works in Expo Go.

## Database: versioned migrator (`db/`)
`db/migrations.ts` holds numbered, append-only migrations; the version is
`PRAGMA user_version`. Each step runs in one transaction with its version
bump; a failure rolls back and throws `local_db_migration_failed:<n>` (no
SQLite text). Every open sets `journal_mode=WAL` and `synchronous=FULL`.
`db/sql.ts` is the engine-neutral `SqlDb` interface (expo-sqlite in the app,
node:sqlite in `test/`). To change the schema: add migration n+1, add a test
in `test/migrations.test.ts`, and add the column to DATA_CLASSIFICATION 4.5.
`localSchemaVersion()` reports the version.

## store.ts

### Children (multi-child, PRD B F2)
| Function | Notes |
|---|---|
| `listChildren(): Child[]` | Visible books, oldest first. Hidden books excluded. |
| `getChild(id)` / `getActiveChild()` | `null` when missing. |
| `getActiveChildId(): string \| null` | Falls back to the first visible child. |
| `setActiveChildId(id)` | Fires `subscribe` listeners (Tonight re-renders). |
| `addChild({ name, birthday, dueDate, signsAs }): Child` | `birthday` or `dueDate`, the other `null`. |
| `updateChild(id, patch)` | Any of `name, birthday, dueDate, signsAs, remindersOn, familyCanRead`. Expecting to born = set `birthday`, clear `dueDate`. |
| `hideChild(id)` / `unhideChild(id)` / `listHiddenChildren()` | "Hide this book" (B-REQ-014). |

`Child = { id, name, birthday, dueDate, signsAs, remindersOn, familyCanRead }`. Per-child settings are fields on `Child`.

### Entries
| Function | Notes |
|---|---|
| `listEntriesForChild(childId): Entry[]` | Newest first, tombstoned excluded. |
| `listEntries()` | Same, for the active child (unchanged signature). |
| `getEntry(id)` | |
| `setEntryInBook(id, inBook)` | Add to book / make private. Never touches text. |
| `deleteEntry(id)` / `undeleteEntry(id)` | Tombstone only. |
| `saveEntry(entry)` | Entries without a draft (Not much today, dev seed). `raw_transcript`, `captured_at` and audio never change after insert; `child_id` never changes once synced. |
| `saveLetterFromDraft(draftId, entry, audioExists)` | Review's save: insert the letter and delete the draft in **one transaction** (DATA-REQ-048). Hash the audio first (`capture/recorder.ts` `ensureAudioHash`). Throws `AudioMissingError` for a spoken letter whose file is gone. |
| `saveVoiceOnlyFromDraft(draft, opts)` | Keep a recording as a letter **waiting for its words**: `raw_transcript = final_text = ''`, `transcriptStatus = 'waiting'`, private by default. |
| `listWaitingForWords(childId)` / `setWordsForWaitingEntry(id, words)` | For the transcription queue (BL-063). Words are set once; the first transcript becomes the immutable raw. |

`Entry` gained optional `childId, authorId, authorSignsAs, audioUri, audioDurationMs, audioSha256, audioBytes, transcriptStatus`. `authorSignsAs` is frozen at save time. A `transcriptStatus: 'waiting'` letter has no text: show `pendingCopy.book.waitingForWords`.

### Device settings
`getSetting(key): string | null`, `setSetting(key, value)`. Keys in use:
`activeChildId`, `appearance` (`system|light|dark`, applied in `app/_layout.tsx`), `readingSize`, `reminders.cadence`, `reminders.paused`, `review.firstNoteSeen`, `ageGate.passed` (`1` after Yes, a boolean, never an age), `ageGate.stoppedAt` (only after No: the time of the No, for the 24-hour stop; DECISIONS D-026), `readTogether.sessions` (a count, see read-together.ts). `deleteSetting(key)` removes one.

### Plus gates
`newChildNeedsPlus()`: books made in first run are all free (twins or more); after that a new book needs Plus once you have started any book of your own (hidden ones count). `isJoinedBook(child)` (false until co-parent joining exists) keeps joined books out of the count.

### Not built yet (stubs with stable signatures)
`currentUserId(): null`, `hasPlus(): false`, `listMembers(childId): []`. They become real with sign-in (PRD A), purchases (PRD C) and sync.

### Change events
`subscribe(listener): unsubscribe` fires on any write (child switch, save, delete, setting).

### Drafts (capture only)
`createDraft`, `getDraft`, `listDrafts(childId)` (excludes takes still `recording`), `setDraftTranscript` (set once), `setDraftTyped`, `setDraftChild`, `deleteDraft` (row only, never the file). Recording drafts: `createRecordingDraft` (written **before** the mic is live), `setRecordingProgress`, `finalizeDraftAudio` (path, length, SHA-256, size, state), `setDraftAudioHash`. `Draft.state` is `recording | ready | unrecoverable`; `recoveredAt` marks takes the launch sweep rescued. Tonight shows "waiting to be read back" when one exists.

### Launch sweep support
`audioRows()`, `rebaseAudioUri`, `listOrphanAudio()` (Settings > Recordings), `reportOrphanAudio`, `reattachOrphanAudio`. Used by `capture/sweep.ts` only.

### Legacy
`getFamily()` / `saveFamily()` read and write the active child. The old single `family` setting is migrated into `children` on first open.

## Capture (`capture/`)
- `recorder.ts`: `beginTake(recorder, {childId, promptKey})` (prepare, draft row, record), `finalizeTake(recorder, draftId, reason, ms)` (stop, hash, mark ready; idempotent, so Finish, background, interruption and dismiss can all call it), `abandonTake` (confirmed Discard only), `ensureAudioHash(draft)`, `hashAudioFile`, `activeTakeId()`.
- `sweep.logic.ts` (pure, tested) and `sweep.ts`: `runLaunchSweep()` once per process after the first frame. Finishes takes cut off by a kill, rebases paths after an iOS container move (matches by file name), re-attaches stray recordings to the active book as drafts or reports them when no book exists. Never deletes audio.

## Other modules
- `age-gate.logic.ts` (pure, tested) and `age-gate.ts`: `useAgeGate()` for the root layout, `answerAgeGate`, `reopenAgeGate`.
- `build-env.ts`: `APP_ENV` from `EXPO_PUBLIC_APP_ENV` (eas.json profile; `.env.development` locally) and `devShortcutsAllowed` (development profile AND `__DEV__`). Every dev bypass checks this, never `__DEV__` alone.
- `model-files.ts`: Whisper models in Application Support, excluded from backup (ADR 0001) through `modules/scribe-files`; falls back to Documents/models without the native module.
- `permission-copy.ts`: OS purpose strings (part of `pendingCopy`), read by `app.config.ts` at build time.
- `copy.ts`: `copy`, `fill`, `greetingKey`, and `pendingCopy` (strings awaiting the PM, see TODO there).
- `transcribe.ts`: `Transcriber` interface and `getTranscriber()`. Adapters: `transcribe-whisper.ts` (dev build + model + decoder), `transcribe-sample.ts` (development profile only; Review never saves its words).
- `dates.ts`: the one date format, via `Intl` in the device's English locale (en-US "Tuesday, September 29, 2026"; other English locales their own order; non-English falls back to en-GB): `dayDate(iso)`, `longDate(iso)`, `letterDateline(child, iso)` (age sentence from core), `ageText(child, iso)`, `isoOf(date)`. Never call `toLocaleDateString` in screens.
- `copy.ts`: also `plural(count, one, other)` until content has plural forms.
- `read-together.ts`: `FREE_READ_TOGETHER_SESSIONS` (3), `canStartReadTogether()`, `recordReadTogetherSession()`, `readTogetherSessions()`.
- `haptics.ts`: `haptic('tap' | 'press' | 'soft' | 'success' | 'warning')`.
- `motion.ts`: `useMotion()`, `useReducedMotion()`; never read Reduce Motion elsewhere.
- `audio-mode.ts`: `setAudioMode('idle' | 'recording' | 'playback')`; always restore `idle`.
