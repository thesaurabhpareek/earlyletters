---
title: Glossary
owner: reference-docs
covers: [packages/core/src/domain.ts, packages/core/src/types.ts, packages/core/src/prompts.ts, packages/core/src/safety.ts]
verified_at: d74e860
verified_on: 2026-10-15
---

# Glossary

What a word means, what the code calls it, and what the person sees. Code names come from `packages/core/src/domain.ts` and `types.ts` unless noted; screen words come from `packages/content/src/strings.en.ts` unless noted. "Off in every profile" means the code exists on `develop` but every build profile turns it off; D-100 (founder; logged 16 Oct) ships server features in v1.0 after the R-17 security gate; the build profiles that turn them on are not on `develop` yet (open PR #145) ([register](../decisions/INDEX.md)).

## Things in the book

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Letter | `entry`, table `entries`, type `Entry`; `kind` is `letter`, `note` or `not_much` | "letter" for every kind | `packages/core/src/domain.ts` (`ENTRY_KINDS`), `apps/mobile/src/lib/store.ts` |
| Book | `child`, table `children`, type `Child` | "book", "Asha's book" | `store.ts`; one book per child |
| Active book | setting `activeChildId` | The book Tonight writes to | `store.ts` `getActiveChildId` |
| Hidden book | `children.hidden_at` | "Hide this book" | `store.hideChild` |
| Chapter | month of age, `chapterOf(birth, on)` | Month headings in the Book | `packages/core/src/age.ts`, `components/book/chapters.ts` |
| Dateline | `dateline`, `letterDateline` | The child's name and age above a letter | `packages/core/src/age.ts`, `lib/dates.ts` |
| Signature | `signs_as`, `signsAs`, `author_signs_as` (frozen at save) | "From {signsAs}" | `store.ts`, `strings.en.ts` |
| Quiet day | `kind = 'not_much'`, no text (D-084) | Button "Not much today"; in the Book "A quiet day" | `app/(tabs)/index.tsx`, `strings.en.ts` |
| In the book / private | `in_book` | "Keep private", "Make private" | `store.setEntryInBook` |
| Waiting for words | `transcript_status = 'waiting'` | "A recording, waiting for its words." | `domain.ts` `TRANSCRIPT_STATUSES` |
| Recently deleted | tombstone `deleted_at`, `SHELF_DAYS = 30` | "Recently deleted" shelf, Restore, Erase now | `app/settings/recently-deleted.tsx`, `lib/shelf-days.ts` |
| Orphan recording | table `orphan_audio` | Listed in Settings, Recordings | `lib/capture/sweep.ts` |

## Capturing and the words

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Speak, Type | `capture_mode` `spoken`, `typed`, `mixed` (spoken, then typed) | "Speak", "Type" on Tonight | `domain.ts` `CAPTURE_MODES` |
| Take, draft | table `drafts`, `Draft.state` `recording`, `ready`, `unrecoverable` | "A letter is waiting" on Tonight | `domain.ts` `DRAFT_STATES`, `lib/capture/recorder.ts` |
| Keep | Review's save, `saveLetterFromDraft` | "Keep it", "Keep the recording", "Keep this as said" | `app/review.tsx` |
| Raw transcript | `raw_transcript`, set once, never changed | "what you said" | `CLAUDE.md` constitution |
| Final text | `final_text` | The letter's words | `entries` |
| Machine edit, small fix | `Edit`, stored as `machine_edits` | "small fix"; struck through or dotted in Review | `packages/core/src/types.ts` |
| Edit types | `EditType`: `filler`, `false_start`, `repeat`, `stt_fix`, `punctuation`, `agreement`, `paragraph` | Named by what happened | [speech-and-languages.md](speech-and-languages.md#the-faithful-edit-engine-packagescore) |
| Edit level | `edit_level` `clean` or `verbatim` | "With small fixes" or "Exactly as said" | `domain.ts` `EDIT_LEVELS`, `strings.en.ts` |
| Word for word | The feature name for the edit engine (D-074, D-086) | "Word for word", only where the feature is named | `strings.en.ts` |
| Put it back | `withoutEdit` | Undo of one fix in Review | `packages/core/src/pipeline.ts` |
| Verifier | `verifyEdits`, `RejectReason` | Not shown | `packages/core/src/verify.ts` |
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

## People and family (server features, off in every profile)

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Co-parent | role `parent` | "Co-parent" | `domain.ts` `MEMBER_ROLES` |
| Family member | role `contributor` | "Family" (hidden in current builds) | `domain.ts` |
| Member | `child_members`, `Member` | People on the Family tab | `supabase/migrations`, `store.listMembers` |
| Invite | `child_invites`, token link `/i/<token>` | Current builds show the co-parent "coming soon" presentation instead | `lib/family/`, `app/invite/` |
| Family review | `approval`: `not_needed`, `pending`, `added`, `set_aside` | Not shown in current builds | `domain.ts` `APPROVALS` |
| Author | `author_id` | The person who wrote a letter | `entries` |

## Money

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| Plus | product ids `plus.annual`, `plus.monthly` | "Plus", "Plus Annual", "Plus Monthly" | `lib/billing/config.ts` |
| Plan | `PlanView`, `PlanState`, `PLAN_STATES` | Settings, Plan | `packages/core/src/plan.ts`, `lib/billing/plan.logic.ts` |
| Free letters | `DEFAULT_FREE_LETTERS = 2`, allowance | The count of letters kept free | `plan.ts` (D-082) |
| Letter ledger | `letters.keptEver` (setting and Keychain) | Not shown | `lib/billing/letter-ledger.ts` |
| Keep gate | `keepLetterGate`, `decideKeepLetter`, trigger `keep_letter` | `PlusGate` in Review | `lib/billing/gates.ts` |
| Plan reminder | local notification, id prefix `plan.` | Reminder before a trial ends or a renewal | `lib/billing/plan-reminders.ts` (G-15) |

## Safety and gates

| Term | Code name | On screen | Where it lives |
|---|---|---|---|
| 18+ gate | settings `ageGate.passed` (a boolean), `ageGate.stoppedAt` | The age question before first run | `lib/age-gate.ts` (D-026) |
| Safety tier | `SafetyTier` `0`, `1`, `2`, `classify(text)` | "If you are struggling" row in Settings (always shown) | `packages/core/src/safety.ts`. The classifier is not called by the app; it is deferred (D-059), and the file says its patterns await clinician review |
| Capabilities | `capabilities.signIn`, `.sync`, `.coParent`, `.analytics` | Not shown | `lib/capabilities.ts` |

## Codenames and names

| Term | Meaning |
|---|---|
| `scribe` | The permanent codename: packages (`@scribe/*`), the database file `scribe.db`, the last part of the bundle id, and the URL scheme (`brand.scheme` in `packages/brand/index.ts`) |
| Early Letters | The public name, held only in `packages/brand/index.ts` |
| Asha | The fictional family every test and sample uses (`CLAUDE.md`) |
| Tonight, Book, Family | The three tabs (`app/(tabs)/_layout.tsx`) |
| L1 to L4 | Data classification levels ([data-and-storage.md](data-and-storage.md#classification-in-one-line-each)) |
| D-###, ADR ####, BL-###, FT-##, LEGAL-REQ-### | Decision log ids (`docs/DECISIONS.md`), architecture decision records (`docs/adr/`), backlog items (`docs/BACKLOG.md`), founder tasks (`docs/FOUNDER_TASKS.md`), legal requirements (`docs/legal/ENGINEERING_REQUIREMENTS.md`) |
