# src/lib: local store and capture services (owner: Mobile A)

Other screens import from here; only Mobile A edits these files. Ask for a new
function rather than writing SQL elsewhere. Everything is synchronous SQLite
(expo-sqlite) and works in Expo Go.

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
| `saveEntry(entry)` | Capture screens only. `raw_transcript`, `captured_at` and audio are never changed after insert. |

`Entry` gained optional `childId, authorId, authorSignsAs, audioUri, audioDurationMs`. `authorSignsAs` is frozen at save time.

### Device settings
`getSetting(key): string | null`, `setSetting(key, value)`. Keys in use:
`activeChildId`, `appearance` (`system|light|dark`, applied in `app/_layout.tsx`), `readingSize`, `reminders.cadence`, `reminders.paused`, `review.firstNoteSeen`, `ageAttested` (`yes` only: under 18 is stopped in onboarding and nothing is stored; never an age), `ageAttestedAt`, `readTogether.sessions` (a count, see read-together.ts).

### Plus gates
`newChildNeedsPlus()`: books made in first run are all free (twins or more); after that a new book needs Plus once you have started any book of your own (hidden ones count). `isJoinedBook(child)` (false until co-parent joining exists) keeps joined books out of the count.

### Not built yet (stubs with stable signatures)
`currentUserId(): null`, `hasPlus(): false`, `listMembers(childId): []`. They become real with sign-in (PRD A), purchases (PRD C) and sync.

### Change events
`subscribe(listener): unsubscribe` fires on any write (child switch, save, delete, setting).

### Drafts (capture only)
`createDraft`, `getDraft`, `listDrafts(childId)`, `setDraftTranscript` (set once), `setDraftTyped`, `setDraftChild`, `deleteDraft`. A draft is written before Review opens so nothing is lost; Tonight shows "waiting to be read back" when one exists.

### Legacy
`getFamily()` / `saveFamily()` read and write the active child. The old single `family` setting is migrated into `children` on first open.

## Other modules
- `copy.ts`: `copy`, `fill`, `greetingKey`, and `pendingCopy` (strings awaiting the PM, see TODO there).
- `transcribe.ts`: `Transcriber` interface and `getTranscriber()`. Adapters: `transcribe-whisper.ts` (dev build + model + decoder), `transcribe-sample.ts` (development only).
- `dates.ts`: the one date format, from `@scribe/core` `dateline`: `dayDate(iso)` "Tuesday, 29 September 2026", `longDate(iso)`, `letterDateline(child, iso)`, `ageText(child, iso)`, `isoOf(date)`. Never call `toLocaleDateString` in screens.
- `read-together.ts`: `FREE_READ_TOGETHER_SESSIONS` (3), `canStartReadTogether()`, `recordReadTogetherSession()`, `readTogetherSessions()`.
- `haptics.ts`: `haptic('tap' | 'press' | 'soft' | 'success' | 'warning')`.
- `motion.ts`: `useMotion()`, `useReducedMotion()`; never read Reduce Motion elsewhere.
- `audio-mode.ts`: `setAudioMode('idle' | 'recording' | 'playback')`; always restore `idle`.
