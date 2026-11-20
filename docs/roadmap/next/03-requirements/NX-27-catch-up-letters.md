# Theme 27: Catch up: add the letters I spoke before I installed

Readiness: catch-up dates (R1 to R3) 25 of 28; voice-memo import (R4 to R7) NOT READY, 15 of 28. Author's score, `qa` to confirm. Import is blocked below on counsel and on a native module.

### Blocked on (import only; exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | A recording a parent picks may hold other people's voices (a partner, a grandparent, another child). It stays on the phone and is never shared. Does that need any notice or consent from us beyond a plain line before the first import, and does it change the privacy label or the speech-model consent? | Counsel (add as a new question to the packet; none exists for it) | Allow import of a file the parent picks themself; show one plain line before the first import ("This may include other people's voices. It stays on this phone."); no extra consent; no change to the label because nothing leaves the phone. Not built until counsel answers. | R4 to R7 |
| B-2 | Which native module picks the file (a document picker is not in `apps/mobile/package.json`; searched 8 Nov) and which build carries it? | `mobile` and `security` | Use the system document picker, one file at a time, no library access (the app never lists Voice Memos; the parent picks a file, which also works from Files and share). Batch with the other native changes. | R4 |

R1 to R3 are finished and may start now.

| | |
|---|---|
| Working label | NX-27 (working id, see `_CONVENTIONS.md`); backlog rank 29 in `../08-ranked-backlog.md` |
| Refines | F04-REQ-015 (backdating), F09-REQ-003, -004 (dateline, date change), customer needs on catching up (`../01-customer-needs.md`; the exact row number is not given here) |
| Tag | EVIDENCE for the date rules: they are built and tested (`apps/mobile/src/components/book/date-change.logic.ts`, `apps/mobile/test/book-date-change.test.ts`). HYPOTHESIS for the demand for import: a want stated in the customer file, no measurement |
| Size | M (R1 to R3 are S; import is M and native) |
| Gate | Counsel for import (B-1). No Apple gate beyond accurate metadata |
| Order | 27 (provisional; "read the code first" in 08, done below) |

## What the parent will see and do

A parent installs the app when {child} is already eight months old. They tap "Add a letter from before", choose a day or just a month, and speak or type, and the letter files itself where it belongs in the book, in the right chapter, free. Later, they can pick an audio file they already have, such as a voice memo they recorded months ago, and it becomes a letter they review and keep. Nothing is filed without their say-so.

## What the code already does (read 8 Nov 2026)

A letter's date can be changed after it is saved, from the letter page, through the date sheet (`apps/mobile/src/components/book/date-sheet.tsx`, rules in `date-change.logic.ts`): any day from 3 years before the birthday (or due date) to today, or a month (Before You, the first weeks, Month 1 to the current month) stored with month precision; never a future day; never gated by a plan (F04-REQ-015). There is no way to choose the date before recording, no catch-up entry point, and no import (searched `apps/mobile/src` for `DocumentPicker`, `import` of audio files, `occurred_at` entry points; `expo-document-picker` is not a dependency).

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-27-R1 | EVIDENCE | Given the entry "Add a letter from before", When the parent picks a day or a month and then records or types and keeps, Then the saved letter has that `occurred_on` and precision on first save (0 letters need a second step to be dated) and it appears in the matching chapter (Before You, The first weeks, or Month n). | No entry point sets the date before capture; the date can only be changed after save from the letter page. | F04-REQ-015; F09-REQ-003 |
| NX-27-R2 | EVIDENCE (guard) | Given a catch-up letter, Then the bounds are the existing ones (3 years before the birthday or due date to today; the month tab only for a born child), a future day is impossible to pick, and no plan check runs. | PASSES today for the after-save sheet (`date-change.logic.ts`, `book-date-change.test.ts`). The new entry must reuse that logic, not copy it (0 duplicate bound constants: a test imports `BACKDATE_YEARS`). | F04-REQ-015, F04-U36, F04-U37 |
| NX-27-R3 | EVIDENCE | Given 5 catch-up letters kept in a row, Then each counts toward the free letters exactly as any letter does (D-083), the free count shown is right after each, and no separate counter or message names them as late. | Nothing to count. Proposed default; founder confirms. | D-083; F14 |
| NX-27-R4 | EVIDENCE (held with B-1, B-2) | Given the parent picks 1 audio file of 30 minutes or less (the longest take the app handles: `06-nfr.md` finalize row), When confirmed, Then the file is copied into the app's storage, transcribed on the phone, and shown as a draft in Review with the date taken from the file's creation date shown for the parent to confirm or change; a longer file is refused before copying, with a plain line. | No import exists. | Customer file |
| NX-27-R5 | EVIDENCE (held) | Given an import, Then 0 bytes of the audio or its transcript leave the phone, the original file the parent picked is untouched, and no other file or library is read or listed (the app sees only the one picked file). | Nothing exists. | PRIV-R09; CLAUDE.md privacy |
| NX-27-R6 | EVIDENCE (held) | Given 30 imports of a 30-minute file on the minimum phone, Then 0 jetsam (memory kills) occur and each leaves a draft or a plain failure line with the file kept (the `06-nfr.md` transcription gate: zero jetsam in 30 runs). | Nothing exists. | `06-nfr.md` gates |
| NX-27-R7 | EVIDENCE (held) | Given an imported file in a language other than the child's book language or in a language not installed, Then the app says which and keeps the audio as a draft with the words waiting (the existing waiting-for-language path); it never guesses a language. | Nothing exists. | `languageCopy.waitingForLanguage` (exists) |

**Shown (import):** before the first import, the plain line about other people's voices (B-1), and the date taken from the file, with a way to change it.
**Records:** the letter as any letter (words, audio, date, precision); an `imported` marker on the draft (device only, so Review can show where it came from); nothing about the file's name or path is kept.
**Never:** read the Voice Memos library or any folder; upload the audio; keep the original file's name; guess a speaker; change the words; fill the date from anything but the file's creation date the parent confirms.
**Decline and withdraw:** not importing changes nothing; a draft can be deleted in Review like any draft; Erase on the phone removes it.

## Edge cases

Second child (the entry asks which book first); expecting child (day tab only, bounded from 3 years before the due date); a file with no creation date (the date sheet opens with no default); a file that is not audio (refused with a plain line); a take in two languages (existing rules); phone full while copying (the copy stops, nothing half-written remains, the plain full-phone line from NX-06 shows); kill switch: none, local feature; sign-in not needed.

## Offline behaviour

All of it works with no network. Words may wait for the speech files like any letter.

## What we never do

Show "late" or "behind", count missed days, suggest how many letters a parent should catch up, or rewrite words. No nudge to import.

## Copy needs

`new`, words by `content`, no fear or guilt language, nothing that counts gaps: the entry label ("Add a letter from before"), the date step title, the import line about other people's voices, the refusal lines (too long, not audio). Existing groups to extend: the book and capture groups in `packages/content/src/strings.en.ts` (name the real group in the PR; UNVERIFIED here). The import line is counsel-reviewed (B-1).

## Analytics events

New, not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add first: `catchup_started` (no properties), `memo_import_result` (property: done, refused or failed). Nothing is sent in 1.0 (D-124).

## Device rows

New: "catch-up letter dated before recording"; "import a 30-minute m4a on an iPhone SE 3"; "import at AX5".

## Dependencies

NX-06 (the full-phone line); the date logic already on develop; for import, a native module in a native build, and counsel (B-1).

## Engineering block (G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. Both parts are on the phone. A catch-up letter syncs as any letter (existing `occurred_on` and precision fields). |
| Budget (`06-nfr.md`) | Finalize a 30-minute take: p95 1.5 s (about 14.4 MB); import copy of the same size within that budget (proposed); local save commit p95 200 ms; transcription: zero jetsam in 30 runs. The picker adds a small native module: re-measure against the 40 MB app budget. |
| Accessibility | Entry, date step and import screens: AX5 with 0 clipped lines; VoiceOver reads the entry label, then the date choice (the day or month picker is adjustable by VoiceOver and reads the full date); tap targets 44 pt or more; Reduce Motion: fade only. One device row each. |
| Switch, off behaviour, noticed by | Catch-up entry: no switch (local, existing rules). Import: a build flag, off until B-1 and B-2 are answered; off hides the row. Rollback: ship with the flag off; drafts already made stay. Noticed by: `memo_import_result` when analytics are on; in 1.0 by the device rows. |
| Data class and retention | Imported audio and transcript: L4, on the phone only (no backup in 1.0), same as a recording. The `imported` marker: L2 device setting or column, removed with the letter. |
| Schema and grants | R1 to R3: none. Import: if the marker is a column, a local migration step in `apps/mobile/src/lib/db/migrations.ts` with a test (no grants); no server change. |
| Analytics events | catchup_started, memo_import_result: add to catalog first. |

## Trace and tests

Id convention: `_CONVENTIONS.md`.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-27-R1 | F04-REQ-015; F09-REQ-003 | mobile unit (proposed `apps/mobile/test/catchup-entry.test.ts`); `[NX-27-R1] a catch-up letter is dated on first save and files into its chapter` | new: catch-up letter dated before recording |
| NX-27-R2 | F04-REQ-015 | `apps/mobile/test/book-date-change.test.ts` (exists; add the bracket and the bounds-import check); `[NX-27-R2] catch-up reuses the date bounds` | none |
| NX-27-R3 | D-083 | mobile unit on the free-letter ledger; `[NX-27-R3] catch-up letters count like any letter` | none |
| NX-27-R4 | customer file | HELD (B-1, B-2); mobile unit on the import plan (proposed `apps/mobile/test/memo-import.test.ts`); `[NX-27-R4] a 30-minute file becomes a draft with a confirmable date; longer is refused` | new: import a 30-minute m4a on SE 3 |
| NX-27-R5 | PRIV-R09 | HELD; mobile unit and a network-capture device row; `[NX-27-R5] 0 bytes leave the phone; only the picked file is read` | same |
| NX-27-R6 | `06-nfr.md` gates | HELD; device run 30 of 30; Test: none, device | same |
| NX-27-R7 | `languageCopy.waitingForLanguage` | HELD; mobile unit; `[NX-27-R7] unknown language waits, never guessed` | none |

Trace: NX-27-R1..R7 -> F04-REQ-015, F09-REQ-003, -004, D-083.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Do catch-up letters count toward the free letters | Yes, like any letter (D-083); no special rule |
| Ship catch-up dates first and import later | Yes: R1 to R3 now; import waits for counsel and a native build |

## Not verified

The customer-file row that names this need (cited by section, not row number). Whether a share-sheet "open in" path is simpler than the document picker. Counsel's view of other people's voices. The longest file the transcription path handles without memory pressure (the 30-minute figure is the finalize row, not an import measurement).
