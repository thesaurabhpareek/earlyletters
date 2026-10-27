---
title: Glossary
owner: reference-docs
covers: [packages/core/src/domain.ts, packages/core/src/types.ts, packages/core/src/prompts.ts, packages/core/src/safety.ts]
verified_at: 1c6795b
verified_on: 2026-10-27
---

# Glossary

What a word means, what the code calls it, and what the person sees. Code names come from `packages/core/src/domain.ts` and `types.ts` unless noted; screen words come from `packages/content/src/strings.en.ts` unless noted. "Server features" are sign-in, sync, co-parent, backup and the status report. Of the build profiles in `apps/mobile/eas.json`, only `preview` (the alpha against staging, D-106) turns server features on; `development`, `production` and `testflight` leave them off, and backup and the status report have their own flags, off in every profile. D-100 (founder) ships server features in v1.0 after the R-17 security gate ([register](../decisions/INDEX.md)).

## Things in the book

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Letter | `entry`, table `entries`, type `Entry`; `kind` is `letter`, `note` or `not_much` | "letter" for every kind | `packages/core/src/domain.ts` (`ENTRY_KINDS`), `apps/mobile/src/lib/store.ts` |
| Book | `child`, table `children`, type `Child` | "book", "Asha's book" | `store.ts`; one book per child |
| Active book | setting `activeChildId` | The book Tonight writes to | `store.ts` `getActiveChildId` |
| Hidden book | `child_member_prefs.hidden_at`, for the person on this phone only since local schema 7 (`children.hidden_at` is the support path, empty on the phone) | "Hide this book" | `store.hideChild` |
| Quiet book | `child_member_prefs.quiet_at`, `Child.quiet` (F12-REQ-011): no prompts, reminders or notes; letters untouched | "Quiet this book"; no screen sets it on `develop` yet | `store.setChildQuiet` |
| Book preferences | table `child_member_prefs`: what one person chose for a book (signature, reminders, hide, quiet) | Not shown as such | `lib/db/repos/children.ts`, [data-and-storage.md](data-and-storage.md#the-device-database) |
| Chapter | month of age, `chapterOf(birth, on)` | Month headings in the Book | `packages/core/src/age.ts`, `components/book/chapters.ts` |
| Dateline | `dateline`, `letterDateline` | The child's name and age above a letter | `packages/core/src/age.ts`, `lib/dates.ts` |
| Signature | `signs_as`, `signsAs`, `author_signs_as` (frozen at save) | "From {signsAs}" | `store.ts`, `strings.en.ts` |
| Quiet day | `kind = 'not_much'`, no text (D-084) | Button "Not much today"; in the Book "A quiet day" | `app/(tabs)/index.tsx`, `strings.en.ts` |
| In the book / private | `in_book` | "Keep private", "Make private" | `store.setEntryInBook` |
| Waiting for words | `transcript_status = 'waiting'` | "A recording, waiting for its words." | `domain.ts` `TRANSCRIPT_STATUSES` |
| Recently deleted | tombstone `deleted_at`, `SHELF_DAYS = 30` | "Recently deleted" shelf, Restore, Erase now | `app/settings/recently-deleted.tsx`, `lib/shelf-days.ts` |
| Orphan recording | table `orphan_audio` | Listed in Settings, Recordings | `lib/capture/sweep.ts` |
| Erased letter | `entries.sync_state = 'erased'`: the server erased it for good while it sat in Recently deleted here; never restorable | Leaves Recently deleted after the next sync | `store.finishServerErased`, `lib/sync/types.ts` `EntrySyncState` |

## Capturing and the words

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Speak, Type | `capture_mode` `spoken`, `typed`, `mixed` (spoken, then typed) | "Speak", "Type" on Tonight | `domain.ts` `CAPTURE_MODES` |
| Take, draft | table `drafts`, `Draft.state` `recording`, `ready`, `unrecoverable` | "A letter is waiting" on Tonight | `domain.ts` `DRAFT_STATES`, `lib/capture/recorder.ts` |
| Keep | Review's save, `saveLetterFromDraft` | "Keep it", "Keep the recording", "Keep this as said" | `app/review.tsx` |
| One-tap keep | `armKeep`, `peekKeep`, `consumeKeep`: Write arms a keep for one draft for 5 seconds, in memory, and Review runs the one Keep step | "Add to {child}'s book", "Keep private" in Write | `lib/capture/keep-intent.ts` |
| Words on screen | `hasWords(text)`: at least one letter or digit in any script; marks alone are not words (D-103) | Not shown | `lib/billing/letter-ledger.logic.ts` |
| Held draft | `drafts.held_kind`, `Draft.held`, `in_book_choice`; `holdDraft` marks it. Signed in, it also lives on the server as an author-only `held_drafts` row (schema 8) | "Leave it waiting" is the design name; no screen calls `holdDraft` yet (Review's Hold goes back, "A letter is waiting") | `lib/store.ts`, `lib/db/repos/drafts.ts` |
| Room to record | `MIN_FREE_BYTES_TO_RECORD` (50 MB): Listen does not start a take below it | "This phone is full" | `lib/capture/free-space.ts` |
| Raw transcript | `raw_transcript`, set once, never changed | "what you said" | `CLAUDE.md` constitution |
| Final text | `final_text` | The letter's words | `entries` |
| Machine edit, small fix | `Edit`, stored as `machine_edits` | "small fix"; struck through or dotted in Review | `packages/core/src/types.ts` |
| Edit types | `EditType`: `filler`, `false_start`, `repeat`, `stt_fix`, `punctuation`, `agreement`, `paragraph` | Named by what happened | [speech-and-languages.md](speech-and-languages.md#the-faithful-edit-engine-packagescore) |
| Recording container | `RECORDING_CONTAINERS` (`'m4a'` or `'adts'`), file `.m4a` or `.aac`; the codec is AAC-LC either way | Not shown | `lib/capture/recording-file.ts` (ADR 0027; both platforms `'m4a'` on `develop`) |
| Whole-frame copy | A temporary copy of an ADTS take's whole frames, made when a kill cut off its last frame | Not shown | `lib/capture/adts-file.ts`; in Caches, removed when the run ends |
| Run refused | `RunInputError` (`decoder_short`, `break_inside`), shown as the job failure `decode_failed` | The words job's failure state | `lib/transcribe-run.ts`, `transcription-queue/machine.ts` `jobFailureOf` |
| Edit level | `edit_level` `clean` or `verbatim` | "With small fixes" or "Exactly as said" | `domain.ts` `EDIT_LEVELS`, `strings.en.ts` |
| Word for word | The feature name for the edit engine (D-074, D-086) | "Word for word", only where the feature is named | `strings.en.ts` |
| Put it back | `withoutEdit` | Undo of one fix in Review | `packages/core/src/pipeline.ts` |
| Verifier | `verifyEdits`, `RejectReason` (now includes `changes_invisible`: a direction mark, joiner or other invisible character added, removed or moved) | Not shown | `packages/core/src/verify.ts`, `types.ts` |
| Engine version | `ENGINE_VERSION`, `entries.engine_version` | Not shown | `pipeline.ts` |
| Dictionary term | `DictionaryTerm` (`child`, `nickname`, `family`, `self`, `place`, `word`) | Names spelled the family's way | `types.ts` |
| Read it back | late words flag | "Words are ready. Read it back." | `lib/read-it-back.ts` (D-086) |
| Listening copy | file in `Application Support/listening` | A clearer version to listen to; the original is kept | `lib/audio-enhance/index.ts` |
| Prompt | `Prompt`, `PromptBand` (age bands), `PromptKind` (`opening`, `gap`, `hard`, `family`, `together`) | The gentle question on Tonight | `packages/core/src/prompts.ts`, `packages/content/src/prompts.ts` |
| Read together | route `/read-together` | "Read together" | `app/read-together.tsx` |

## Languages and downloads

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Spoken language | `SpeechLanguage`, `SPEECH_LANGUAGES` | Settings, Spoken language | `lib/models/catalog.ts`, `lib/language/` |
| Pack | `PackEntry`, id `<kind>.<name>`; kinds `speech-model`, `text-rules`, `prompts` | Settings, Storage | `packages/api/src/pack-manifest.ts`, `lib/packs/` |
| Text-rules pack | `TextRulesPack`, `packs/text-rules/<lang>.json` | Language download size and progress | `packages/core/src/lang/` |
| Punctuation-safe mode | a language with no installed pack | Footer note in Settings, Spoken language | `lib/language/rules.ts` |
| Speech model, tier | `SpeechModel`, `Tier` `full` or `compact` | Speech files in Settings, Recordings | `lib/models/` |
| Signed documents | remote config, pack manifest, content bundle | Not shown | `lib/remote/`, `packages/api` |
| Kill switch | `killSwitches` in remote config (`sync`, `invites`, `photos`, `packDownloads`, `serverContent`) | Not shown | `packages/api/src/remote-config.ts` |
| Pack host | `PACKS_ORIGIN`, `EXPO_PUBLIC_DOCS_BASE_URL` | Not shown | `https://packs.earlyletters.app` (D-097), `lib/models/catalog.ts`, `apps/mobile/eas.json` |

## People and family (server features)

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Co-parent | role `parent` | "Co-parent" | `domain.ts` `MEMBER_ROLES` |
| Family member | role `contributor` | "Family" (hidden in current builds) | `domain.ts` |
| Member | `child_members`, `Member` | People on the Family tab | `supabase/migrations`, `store.listMembers` |
| Invite | `child_invites`, token link `/i/<token>` | A build with server features off shows the co-parent "coming soon" presentation instead | `lib/family/`, `app/invite/` |
| Family review | `approval`: `not_needed`, `pending`, `added`, `set_aside` | Not shown in current builds | `domain.ts` `APPROVALS` |
| Author | `author_id` | The person who wrote a letter | `entries` |
| Conflict copy | a `rejected_writes` row with code `conflict` (`CONFLICT_CODE`, `ConflictCopy`); since schema 8 it can hold a held draft's typed words (`copy.draft`) | No screen on `develop`; the store's `listConflicts` and `resolveConflict` (`mine` or `theirs`) | `lib/sync/outbox.ts`, `store.ts`; exported as `data/other-versions.json` (ADR 0025) |
| Outbox | table `sync_outbox`: changes queued in the same transaction as the local write | Not shown | `lib/db/migrations.ts` (v4), `lib/sync/outbox.ts` |
| Kept author | Someone with a letter, held draft or recording backup in a book who is no longer a member at purge time (D-116). Their words survive the remaining parent's book deletion; the book row stays tombstoned (`children.purged_at`) | Not shown | `supabase/migrations/20261023010000_s02_purge_and_consent_guards.sql` ([register](../decisions/INDEX.md)) |
| Paused by the server | sync phase `paused_server` (`killSwitches.sync`) | Not shown | `lib/sync/index.ts` |

## Money

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Plus | product ids `plus.annual`, `plus.monthly` | "Plus", "Plus Annual", "Plus Monthly" | `lib/billing/config.ts` |
| Plan | `PlanView`, `PlanState`, `PLAN_STATES` | Settings, Plan | `packages/core/src/plan.ts`, `lib/billing/plan.logic.ts` |
| Free letters | `DEFAULT_FREE_LETTERS = 2`, allowance | The count of letters kept free | `plan.ts` (D-082) |
| Letter ledger | `letters.keptEver` (setting and Keychain) | Not shown | `lib/billing/letter-ledger.ts`; Keychain wiring in `letter-ledger.keychain.ts` |
| Keep gate | `keepGateFor` (asks only with words on screen), `keepLetterGate`, `decideKeepLetter`, trigger `keep_letter` | `PlusGate` in Review | `lib/billing/gates.ts` |
| Keep step | `keepSheetFor` before the write, `countAfterSave` after it | "That was your second free letter." | `lib/billing/keep-step.ts` |
| Status report | The phone tells the server its plan and end date, never a receipt (D-080); off in every profile. `sub_ref` is a salted hash made in Swift, `statusReportRefs` | Not shown | `lib/billing/status-report*.ts`, `modules/scribe-store` |
| Plan reminder | local notification, id prefix `plan.` | Reminder before a trial ends or a renewal | `lib/billing/plan-reminders.ts` (G-15) |

## Safety and gates

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| 18+ gate | settings `ageGate.passed` (a boolean), `ageGate.stoppedAt` | The age question before first run | `lib/age-gate.ts` (D-026) |
| Safety tier | `SafetyTier` `0`, `1`, `2`, `classify(text)` | "If you are struggling" row in Settings (always shown) | `packages/core/src/safety.ts`. The classifier is not called by the app; it is deferred (D-059), and the file says its patterns await clinician review |
| Capabilities | `capabilities.signIn`, `.sync`, `.coParent`, `.backup`, `.statusReport`, `.analytics`, `.englishOnly`; `mayRun(feature, config)` adds the remote kill switch | Not shown | `lib/capabilities.ts` |
| Recording backup | `lib/backup`; server tables `backup_devices`, `child_keys`, `audio_blobs`; flag `EXPO_PUBLIC_BACKUP`, off in every profile. Recordings are encrypted on the phone; the server keeps a recovery key (escrow) used only through a logged recovery service | "Back up my recordings" | `lib/backup/`, `packages/content/src/features/backup.en.ts`, ADR 0024 |
| Email sign-in link | PKCE flow plus a Keychain note that this phone asked for the email; a link opens only while that note is fresh | Not shown | `lib/supabase/client.ts`, ADR 0023 |

## Codenames and names

| Term | Meaning |
|---|---|
| `scribe` | The permanent codename: packages (`@scribe/*`), the database file `scribe.db`, the last part of the bundle id, and the URL scheme (`brand.scheme` in `packages/brand/index.ts`) |
| Early Letters | The public name, held only in `packages/brand/index.ts` |
| Asha | The fictional family every test and sample uses (`CLAUDE.md`) |
| Lamp, scene, unlit room | The decorative light pool behind a screen (`Lamp`), its per-screen look (`scene`, from `tokens.atmosphere`), and a room where it fades out (`useUnlitRoom`) (`components/ui/lamp.tsx`) |
| Kill drill | A test-build-only routine the kill harness drives on a simulator to prove a killed recording or save is never lost (`src/dev/kill-drill.ts`, `apps/mobile/e2e/kill/`) |
| Steward | An agent of kind `steward` that owns chapters of the engineering compendium and reviews PRs in its paths (`agents/roster.json`, ADR 0021) |
| Tonight, Book, Family | The three tabs (`app/(tabs)/_layout.tsx`) |
| L1 to L4 | Data classification levels ([data-and-storage.md](data-and-storage.md#classification-in-one-line-each)) |
| D-###, ADR ####, BL-###, FT-##, LEGAL-REQ-### | Decision log ids (`docs/DECISIONS.md`), architecture decision records (`docs/adr/`), backlog items (`docs/BACKLOG.md`), founder tasks (`docs/FOUNDER_TASKS.md`), legal requirements (`docs/legal/ENGINEERING_REQUIREMENTS.md`) |
