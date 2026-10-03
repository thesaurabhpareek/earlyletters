# F15 Export and the PDF book

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 13 (`05-feature-map.md` section 2) |
| Personas | P1, P2, P5 (receives the PDF), P6 |
| Existing IDs | C-REQ-017, C-REQ-018, C-NFR-004, C-NFR-007, DATA-REQ-050, DATA-REQ-051, DATA-REQ-052, DATA-REQ-053, DATA-REQ-054 (P1), DATA-REQ-055 (P1), DATA-REQ-056, LEGAL-REQ-013, LEGAL-REQ-034, LEGAL-REQ-035 (v1.1), LEGAL-REQ-036 (P1), LEGAL-REQ-050, PRD-REQ-004, PRD-REQ-009, K-05, K-32, D-033, BL-150, BL-243, BL-284 |
| Depends on | F08 (original and listening copy files, hashes), F09 (chapters, signatures, `LetterText` rules), F11 (what a co-parent's letters include), F05 (language packs that carry fonts), F17 (Your data, deletion), F02 (account fields for `account.json`) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [S] Losing what you made is the most common complaint in the category: 41 of 104 negative or mixed reviews are bugs, sync or lost work (R2 section 0 item 1). The export is the copy that does not depend on us.
- [S] Charging for something that used to be free drew a negative review 10 times out of 10; export and backdating fees are resented (R2 section 0 item 3, T14; Qeepsake export fees [S] R1-S56).
- [S] Fear that the app stalls or closes appears in 4 reviews (R2 T19). Our answer is the 90-day shutdown pledge with export working throughout (PRD-REQ-009, K-05).
- [S] Blank printed pages after prompts were removed (one person, three comments, R2-S37) and missing text in printed books (R1-S10) are the print complaints we must not copy in the PDF.
- [F] LEGAL-REQ-034 requires a complete, free export that works offline in every plan state; access and portability rights rely on it (CR-014, CR-022).
- [D] v1.0 is digital only; the PDF is the book (K-32). Grandparents see letters at v1.0 only through a parent or the PDF (R-05, B1).
- [R] With no audio upload in v1.0 (B7), export is the free user's only copy of their recordings outside the phone and its device backup (R-11, D-033).

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F15 must do |
|---|---|---|---|
| P1 Evening parent | Month end, a birthday, a phone upgrade, a scare after reading about an app closing | Phone, maybe 30 seconds of patience | One tap, a progress line, a share sheet; works offline; never asks for Plus |
| P2 Co-parent | Leaving, separating, or keeping a copy | Their own letters plus the other parent's in-book letters | Their own words in full; others' final text only |
| P5 Close family | Receives the PDF from a parent | Email or AirDrop | A PDF that reads well on a phone and prints at home |
| P6 Future reader | Handover at 18 (DATA-REQ-055) | A folder, no app | Open formats, a README, an offline `index.html` |

## 3. What we are solving

**Outcome:** any parent, in any plan state, offline, gets every letter and recording they are entitled to, as open files and a good-looking PDF, verified byte for byte, in a few minutes.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Export success rate | 99.5% or more of started exports finish or resume to finish | `export_completed` / `export_started` | Opt-in only; failures also in local diagnostics |
| 1-year export time on SE 3, originals only | Under 2 minutes, 230 MB (C-NFR-007, gate) | Device perf run with year-1 fixture | None |
| 1-year export time on SE 3, originals and listening copies | Under 4 minutes, about 470 MB [A] (section 9) | Same | None |
| Manifest verification | 100% of files re-read and hashed before "ready" | Unit, E2E-10 | None |
| Plus UI during export | 0 | E2E-10 lapsed | None |

## 4. Scope

**In v1.0**
- Export everything: one ZIP built on the phone from local data, offline, free in every plan state.
- Contents: `entries.json` with raw transcript, machine edits and final text for own letters; letters as text; audio originals and listening copies; the PDF book per child; `account.json`; `children.json`; README; offline `index.html`; manifest with hashes.
- Co-parent letters: final text, signature, dates, audio only if on this phone; never the other author's raw transcript or edits (PRD-REQ-004).
- PDF book: chapter per month of age, no blank pages, every script, signatures, page breaks that keep short letters whole.
- PDF on its own ("Share the book as a PDF") for sending to family.
- Share sheet with the plaintext notice; temp copy deleted after.
- Progress, pause on background, resume, partial failure reporting.
- Export before delete in every delete flow (DATA-REQ-053).
- Shutdown pledge copy in Settings and its runbook.

**Later**
- Server-built export (DATA-REQ-054, P1): with the web deletion page and DSAR by email; v1.0 reading of LEGAL-REQ-030 is a static page plus email (D-042). Needed by v1.1 shared voice.
- Contributor export without an account (LEGAL-REQ-035): v1.1 with the web page.
- Printed books with QR to audio (F42, K-32). Not promised anywhere at v1.0.
- Archival FLAC or Opus copy (ADR 0005, DATA-REQ-055).
- Photos: no photo capture at v1.0 (F46), so `photos/` is empty or absent; the format keeps the folder.

**Never**
- Any charge, Plus gate or sign-in requirement for export (LEGAL-REQ-050).
- Another author's raw transcript, edits or version history (PRD-REQ-004, DATA spec 4.1).
- Encryption of the export by us at v1.0 (DATA-REQ-056 says plaintext; we say so instead).
- A print order, print price or "coming soon" print line (K-32).
- Any rewrite, summary or translation in the PDF (constitution).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Export text or PDF; download audio any time; ebook $49.99 [F] R1-S13 | 4.8 | n/a | **Match** text, PDF and audio, free [R] |
| Dearest | Full vault export as ZIP [F] R1-S3 | 5.0 (1) | n/a | **Match** ZIP [R] |
| Tiny Treasures | Exports audio files without an account [F] R1-S67 | 5.0 (7) | n/a | **Match** no-account export [R] |
| Qeepsake | Book credits; Lite can preview but not order [F] R1-S16, R1-S44 | 4.9 | Extra fees to export personal data [S] R1-S56 | **Avoid** paid export [R] |
| Storyworth | Free ebook downloads with the hardcover [F] R1-S14 | 4.7 | Photo formatting frustrates [S] R1-S54 | **Match** free digital copy [R] |
| 23snaps | Photo books | 4.8 | Text missing in printed books [S] R1-S10 | **Avoid**: PDF shows every word [R] |
| Apple Journal | Export and print [F] R1-S5 | 4.8 | n/a | **Match** PDF at minimum [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Where | Copy key |
|---|---|---|
| Settings > Your data > Export everything | `settings/*` (row disabled today: `settingsMore.exportNotYet`) | `settings.export.button` |
| Settings > Help and Legal > About (beta) | About | `settings.about.beta.exportCta` |
| Delete a book or account | F17 step before Confirm | `settings.delete.bookExportFirst` |
| Keep-safe card at a chapter milestone | Book (C-REQ-018, F08 WP-F08-06) | `settings.recordings.onPhoneBody` |
| Root error screen | `ErrorBoundary` offers "Export what is on this phone" (TDD 01 3.1) | new |
| Book header menu: Share the book as a PDF | `(tabs)/book.tsx` | new `export.pdfOnly` |
| Account deleted elsewhere | One local export, then wipe (DATA-REQ-023) | F17 |

### 6.2 Happy path

1. **Start.** Parent taps `settings.export.button`. Sheet shows `settings.export.body` ("Download every letter and recording, any time, free. Plain text and audio files."), the scope (which books: all by default; a list when there are two or more), "Include listening copies" (on by default when any exist; off saves about half the audio size), "Include recently deleted" (off, DATA spec 4.1), the plaintext notice (DATA-REQ-056), and Start. No entitlement call (LEGAL-REQ-050, `export` is `FreeForever` in `plan.ts`).
2. **Space check.** The app estimates the size from file sizes in the database plus 5 MB per PDF [A]. If free space is under estimate plus 200 MB, it says so before starting and offers "Leave out listening copies" and "One book at a time" (new `export.spaceLow`).
3. **Build.** `settings.export.preparing` ("Gathering every letter. This can take a minute.") with a progress line in words ("Month 7 of 14") and a determinate bar. The screen stays awake (`expo-keep-awake`, as F10). The builder streams files into the ZIP from file paths; JS never holds the archive (TDD 01 3.7).
4. **PDF.** One PDF per child is rendered from the HTML book template (`packages/book`, new, ADR 0010) with `expo-print` `printToFileAsync` (Expo docs, opened 3 Oct 2026), then streamed into the ZIP.
5. **Verify.** Every file is re-read and hashed against the manifest (DATA-REQ-051). Audio whose hash differs from the capture hash is kept and flagged `integrity: "mismatch"`.
6. **Ready.** `settings.export.ready` ("Your export is ready.") and the share sheet (`expo-sharing` `shareAsync`, Expo docs). Above the button: "This file holds your letters and recordings, unlocked. Keep it somewhere private." (DATA-REQ-056 text; new key `export.plaintextNotice`).
7. **After.** When the share sheet closes, the temp ZIP is deleted from the sandbox (DATA-REQ-056). Settings shows "Last export: {date}" (new `export.lastExport`), local only.

### 6.3 What the ZIP holds

Format `early-letters-export` (string from `packages/brand` at build time), `format_version` 1.1.0 (minor bump from DATA spec 4.2's 1.0.0 because listening copies and `occurred_precision` are added; readers of 1.0 ignore unknown fields).

| Path | Content | Own letters | Other parent's letters in the book |
|---|---|---|---|
| `README.txt` | Plain guide to every folder and file, how to verify hashes (`shasum -a 256`, `certutil -hashfile`), which audio file is which, what `audio_missing` reasons mean, the 90-day pledge | n/a | n/a |
| `index.html` | Offline reader: list by child and month, text, audio players; no network, no external scripts (DATA-REQ-055) | n/a | n/a |
| `manifest.json`, `manifest.sha256` | Path, bytes, SHA-256, media type for every file; counts; scope (DATA spec 4.3) | n/a | n/a |
| `schema/export-v1.schema.json` | JSON Schema | n/a | n/a |
| `data/children.json` | Name, birthday or due date, signatures used | n/a | n/a |
| `data/entries.json` | One object per letter (fields below) | All, private included | In-book only |
| `data/account.json` | Profile fields, memberships, dictionary terms, consent history (`my_policy_state` and every acceptance row), plan status as the phone knows it (LEGAL-REQ-034) | n/a | n/a |
| `letters/<child>/<YYYY-MM>/<YYYY-MM-DD>_<entry_id>.txt` | UTF-8, header lines (date, month of age, signature, provenance), then `final_text` | Yes | Yes |
| `audio/<entry_id>.m4a` | Original, byte-identical (F08-REQ-002, ADR 0005) | If on this phone | Only if on this phone (never at v1.0, B7) |
| `audio/<entry_id>.listening.m4a` | Listening copy, if one exists and the switch is on (F08 hand-off WP-F08-09) | Same | Same |
| `book/<child>.pdf` | The PDF book (6.4) | In-book letters only | In-book |
| `history/<entry_id>.json` | Every version of the letter | Yes | Never |
| `photos/` | Empty at v1.0 (no photo capture) | n/a | n/a |

`entries.json` fields per letter: `id`, `child_id`, `author {signs_as, is_exporter}`, `kind`, `occurred_on`, `occurred_precision` (new, F04), `captured_at`, `capture_mode`, `edit_level`, `language` (own letters only, when known; F04 adds the column), `final_text`, `in_book`, `audio {path, sha256, bytes, duration_ms, codec}` or `audio_missing {reason}`, `listening_copy {path, sha256, bytes}` (new) or absent, and for own letters only `raw_transcript`, `raw_sha256`, `machine_edits` (accepted and rejected), `stt_meta.engine`, `alignment`, `engine_version`, `prompt_key`. The fixed `audio_missing.reason` values: `not_on_this_device` (the other parent's recording, DATA-REQ-050), `voice_only_none` (never recorded: typed), `file_missing`, `offline` (backed-up audio, v1.1).

### 6.4 The PDF book

| Rule | Value |
|---|---|
| What goes in | Letters in the book only (private letters never), in F09 order read forwards: Before You, The first weeks, Month 1, Month 2 and on; inside a chapter oldest first |
| Front matter | Cover (`book.coverTitle`, `book.coverSubtitle` from `packages/content/src/book.en.ts`), dedication, `book.aboutThisBook` |
| Chapters | Each chapter starts on a new page with its title and month range. Chapters with no letters are left out. Layout is single-sided, so no page is ever blank |
| Letter block | Dateline (`letterDateline`, or the month-only form for `occurred_precision = month`, F09-REQ-003), the full `final_text`, the signature right-aligned ("From Papa"), provenance line (`book.provenance.*`), and "Recording kept" or `book.recordingElsewhere` as plain text |
| Page breaks | A letter shorter than one page never splits (CSS `break-inside: avoid`); a longer letter flows and repeats nothing; no orphan dateline at a page foot (dateline kept with the first lines) |
| Page size | US Letter 612 by 792 points, the `printToFileAsync` default (Expo docs); 54 point margins [A]; body text 12 point serif [A]. Prints on a home printer at 100% |
| Scripts | Per paragraph direction (`dir="auto"` in HTML) so Arabic sits right to left beside English; Devanagari in Tiro Devanagari Hindi; Latin in Literata; Arabic in Noto Naskh Arabic; Chinese in Noto Serif SC (all SIL OFL) |
| Fonts | `printToFileAsync` on iOS cannot load local asset URLs from WKWebView (Expo docs), so fonts go into the HTML as base64 `@font-face`. File sizes checked on 3 Oct 2026 from Google Fonts' repository: Literata variable 955 KB, Tiro Devanagari Hindi 423 KB, Noto Naskh Arabic 308 KB, Noto Serif SC 25.1 MB. Literata and Tiro ship in the app (BL-258). Arabic and Chinese reading fonts come with their language pack (F05) [R]; Chinese is subset at export to only the characters used in that book [R], which keeps the PDF small |
| Missing font | If a letter uses a script whose font is not on the phone (a pack was deleted), the PDF uses the system font for that run and README says so; never empty boxes |
| Links | No audio links or QR codes at v1.0 (QR is F42) |
| Accessibility | Tagged headings per chapter where the renderer supports it (**Unverified** for WKWebView PDF output); document language set per run |
| Size | About 1 MB per 100 Latin letters plus embedded fonts [A]; measured in WP-F15-03 |

### 6.5 Size and time

| Item | Value | Source |
|---|---|---|
| Original audio | 0.48 MB per minute (AAC-LC mono 64 kbps) | ARCHITECTURE section 7; R5 section 0 item 9 |
| With listening copy | 0.96 MB per minute | R5 section 0 item 9 |
| Active family | 40 audio minutes a month | ARCHITECTURE section 7 |
| 1 year, originals only | About 230 MB | C-NFR-007; 19.2 MB x 12 |
| 1 year, originals and listening copies | About 461 MB audio, plus text and PDF: about 470 MB | Arithmetic from R5 |
| ZIP method | Store (no deflate) for `.m4a` and `.pdf` (already compressed); deflate for text and JSON [R] | new |
| Split | One ZIP64 part per child-year above 2 GB (DATA spec 4.2) | DATA spec |

### 6.6 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F15-U01 | Airplane mode | Builds from local data; nothing waits on network | Normal flow | n/a | E2E-10 |
| F15-U02 | Lapsed, refunded, billing retry, Free, signed out | Same flow, no plan check | No Plus UI | n/a | `[DATA-REQ-052]` per state |
| F15-U03 | Not enough space | Pre-check stops before writing; mid-build ENOSPC deletes the partial file | `export.spaceLow` with Leave out listening copies, One book at a time | Retry smaller | Fault injection |
| F15-U04 | App backgrounded | Builder pauses at the next file boundary; iOS background time not relied on (TDD 01 3.7) | On return: "Paused. Carry on?" (new `export.paused`) | Carry on resumes from the last finished file | Kill and background test |
| F15-U05 | App killed mid-build | A small job file records finished entries; temp ZIP is discarded at next launch and the job restarts from scratch, keeping the scope [R] (resuming inside a ZIP is not safe) | "Your export did not finish. Start again?" once | Start again | Kill test 20 of 20 |
| F15-U06 | One audio file unreadable | Skip, record `audio_missing.reason = "file_missing"`, continue | Ready screen says "1 recording could not be added" with details in README | Export again after F08 scrub | Fixture |
| F15-U07 | Audio hash mismatch | File included, `integrity: "mismatch"` (DATA-REQ-051) | Count on ready screen | n/a | TC-17 |
| F15-U08 | PDF render fails (memory) | Retry chapter by chapter into one PDF; if still failing, ZIP ships without that PDF and says so | "The book PDF could not be made this time. Everything else is here." (new `export.pdfFailed`) | Share the book as a PDF later | Large-book fixture |
| F15-U09 | Share sheet dismissed without saving | Temp file deleted (DATA-REQ-056) | Back to Settings | Export again | Sandbox check |
| F15-U10 | Share sheet saves to iCloud Drive or mail fails | Out of our control; temp deleted after close | System messages | n/a | n/a |
| F15-U11 | Duplicate taps on Start | One job at a time; button disabled | One progress | n/a | Unit |
| F15-U12 | Other parent's letters | Final text and signature; no raw, edits, history; audio `not_on_this_device` | README explains | n/a | `[DATA-REQ-050]` 432-object fixture |
| F15-U13 | Letter in Arabic, Hindi and Chinese in one month | Per-run fonts and direction in PDF and `index.html` | Correct glyphs | n/a | PDF text extraction plus visual check |
| F15-U14 | Chinese pack deleted before export | System font for those runs | Correct glyphs in system font | Reinstall pack for the book font | Fixture |
| F15-U15 | Voice-only letter waiting for words | `.txt` and `entries.json` hold empty text and `transcript_status: waiting`; audio included; PDF shows "A recording, waiting for its words." | Kept | n/a | Fixture |
| F15-U16 | Account deletion grace period | Export works for everything not purged, including tombstoned letters (DATA-REQ-053) | Normal flow | n/a | E2E-09 |
| F15-U17 | VoiceOver and AX5 | Progress announced every 10% and at done; controls stack | Spoken progress | n/a | V-script |
| F15-U18 | Reduce Motion | Bar updates without animation | Calm | n/a | V6 |
| F15-U19 | Two children, one hidden | Scope list shows hidden books unticked by default [R] | Choice | Tick it | Unit |
| F15-U20 | Export started from the delete flow | After the share sheet closes, the delete flow resumes at Confirm | Delete flow | n/a | E2E-09 |
| F15-U21 | 5 years, 3 GB | Two ZIP parts by child-year; progress per part | "Part 1 of 2" | n/a | Synthetic fixture |
| F15-U22 | Company announces shutdown | Export unchanged; an app update (PRD-REQ-009) shows the pledge banner pointing to Export | Pledge banner | Export | Runbook drill |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| C-REQ-017 | P0 | Export, free forever, offline | Given a lapsed user with 400 letters, When they tap Export everything, Then the ZIP holds all entries, audio, PDF and README, and no Plus UI appears | C |
| LEGAL-REQ-034 | P0 | Complete export | Given a lapsed Free user offline, When they export, Then the ZIP contains own entries (raw transcript, edits, final text, timestamps), audio, PDF and `account.json` with profile, memberships, dictionary terms, consent history and plan status; a schema check passes | Legal |
| DATA-REQ-050 | P0, Rev (B6, B7) | Export contents | Given 400 own letters (2 private), 30 co-parent letters in the book, Then `entries.json` has 430 objects, co-parent letters have no `raw_transcript`, own letters do; co-parent audio is `audio_missing.reason = "not_on_this_device"`; listening copies appear as `audio/<id>.listening.m4a` | DATA spec; F08 row DATA-REQ-050 |
| DATA-REQ-051 | P0 | Checksums and self-verification | Given an export, Then every file except the manifest pair is listed with SHA-256 and bytes, and the app re-reads every file before `settings.export.ready`; a flipped byte is reported | DATA spec |
| DATA-REQ-052 | P0, Rev | Always available | Given every plan state and airplane mode, Then export completes; given a 230 MB year, originals only, Then under 2 minutes on SE 3 | DATA spec, C-NFR-007 |
| DATA-REQ-053 | P0 | Export before deletion | Given any delete-book or delete-account flow, Then Export is the primary action on the step before Confirm | DATA spec |
| DATA-REQ-056 | P0 | Plaintext notice and temp cleanup | Given the share sheet, Then the notice line is visible above it; Given the sheet closes, Then no export file remains in the sandbox | DATA spec |
| PRD-REQ-004 | P0 | No one else's working material | Given any export, Then no other author's `raw_transcript`, `machine_edits`, `stt_meta` or history appears (they are never on the phone, TDD 01 3.7) | K-09 |
| PRD-REQ-009 | P0 | 90-day shutdown pledge | Given Settings > Help and Legal, Then the pledge reads 90 days and matches Terms 17 and Privacy 18 word for number; given a shutdown, Then export works for the whole 90 days | K-05 |
| LEGAL-REQ-050 | P0 | Never gated | Given the export module, Then it imports nothing from the plan engine (static test) | Legal |
| F15-REQ-001 | P0 | Listening copies included, switchable | Given letters with listening copies, Then they are included by default; given the switch off, Then only originals are written and `listening_copy` is absent | F08 WP-F08-09 |
| F15-REQ-002 | P0 | Originals byte-identical | Given an export, Then each `audio/<id>.m4a` SHA-256 equals the capture hash (or is flagged mismatch) | F08-REQ-002 |
| F15-REQ-003 | P0 | Month precision carried | Given a letter with `occurred_precision = month`, Then `entries.json` carries it and its `.txt` header and PDF dateline name the month, not a day | F04-REQ-015, F09-REQ-003 |
| F15-REQ-004 | P0 | PDF: chapters, order, no blank pages | Given a book with letters in months 0, 3 and 7, Then the PDF has Before You (if any), The first weeks, Month 3, Month 7, each starting a page, no chapter for empty months, and zero pages without text | R2-S37, R1-S10 |
| F15-REQ-005 | P0 | PDF: every word | Given the PDF, Then text extracted from it equals each in-book letter's `final_text` (whitespace normalised) for 100% of letters; private letters never appear | Constitution, R1-S10 |
| F15-REQ-006 | P0 | PDF: scripts and direction | Given Hindi, Arabic, Mandarin and English letters, Then each renders with its font, Arabic right to left, and no missing-glyph boxes in a visual check of the fixture | DR-15 |
| F15-REQ-007 | P0 | PDF: signatures and short letters whole | Given a letter under one page, Then it is not split across pages and its signature is on the same page as its last line | DESIGN_LANGUAGE, B-REQ-002 |
| F15-REQ-008 | P0 | PDF prints at home | Given the PDF, Then pages are US Letter with margins of at least 0.5 inch and print at 100% without clipping | K-32 |
| F15-REQ-009 | P0 | Share the book as a PDF | Given the Book menu, When the parent picks Share the book as a PDF, Then one child's PDF is built and handed to the share sheet with the plaintext notice; temp deleted after | new |
| F15-REQ-010 | P0 | Space pre-check | Given free space below estimate plus 200 MB, Then no file is written and `export.spaceLow` offers smaller options | new |
| F15-REQ-011 | P0 | Pause and restart | Given background mid-build, Then the job pauses and resumes on return. Given a kill, Then the next launch offers Start again once and no partial ZIP remains | TDD 01 3.7 |
| F15-REQ-012 | P0 | Partial failure honest | Given one unreadable file, Then the export finishes, the ready screen names the count, README lists them, and `entries.json` marks each | DATA-REQ-051 |
| F15-REQ-013 | P0 | Offline reader | Given the ZIP opened on a laptop with no network, Then `index.html` lists every letter by child and month and plays every `.m4a` in Safari and Chrome | DATA-REQ-055 |
| F15-REQ-014 | P0 | Keep awake and progress | Given a 4-minute build, Then the screen does not auto-lock, progress names the month, and VoiceOver hears progress every 10% | new |
| F15-REQ-015 | P0 | No export during recording | Given a recording in progress, Then Export is unavailable until it stops; Given export running, Then capture still works and is not blocked | PRD-REQ-001 spirit, 03 principle 2 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone |
|---|---|---|---|---|---|
| Temp export ZIP and PDF | L4, plaintext by design | App temp | This device | Deleted when the share sheet closes (DATA-REQ-056) | Only through the person's share sheet |
| Export job file (scope, finished entry ids) | L2 | App temp | This device | Deleted on finish or discard | Never |
| Last export date (`export.lastExportAt` setting) | L2 | Local | This device | Until app delete | Never |

- No server sees the export at v1.0. The privacy label already says the ZIP and PDF are created on the device and handed to the share sheet (`docs/legal/app-store-privacy-labels.md`).
- LEGAL-REQ-013 (strip photo location) applies when photos return (F46); v1.0 has none.
- The pledge (PRD-REQ-009): before any shutdown, an app update keeps export working for 90 days. At v1.0 there is no backed-up audio, so nothing needs escrow decryption (DATA-REQ-055 item applies from v1.1).

## 9. Non-functional requirements

| Budget | Value | Gate |
|---|---|---|
| 230 MB, originals only, SE 3, offline | Under 2 minutes | Yes (C-NFR-007) |
| 470 MB with listening copies, SE 3 | Under 4 minutes [A]: same throughput as the gate | Proposed gate, founder to confirm (Q1) |
| Peak memory | Under 150 MB [A] (TDD 05 5.5) | No |
| PDF for 240 letters | Under 30 s on SE 3 [A] | No; measured in WP-F15-03 |
| Hashing | Streaming native SHA-256 (`react-native-quick-crypto`, TDD 01 3.4 item 5) | n/a |
| Accessibility | WCAG 2.2 AA, AX5 (LEGAL-REQ-051); shared rules in `06-nfr.md` | Yes |

## 10. Analytics

| Event | Status | Properties (L2) | Question |
|---|---|---|---|
| `export_started` | Exists | `format` (`pdf`, `archive`, `audio`) | How often families take a copy |
| `export_completed` | Exists | `format`, `size_bucket`, `duration_bucket` | Do we meet the time budget in the field |
| `export_failed` (new) | New | `stage` (`space`, `audio`, `pdf`, `zip`, `verify`, `killed`), `format` | Where exports break |
| `settings_changed` | Exists | n/a | n/a |

Consent-gated (LEGAL-REQ-003). Business counts of exports come from nowhere else: we accept the blind spot.

## 11. How we build it (with the architect)

- **Packages.** `packages/export` (new, TDD 05 5.5): pure TS manifest, `entries.json` and README builders, schema, fixtures. `packages/book` (new, ADR 0010): HTML and CSS book template from the same chapter model as F09 (`packages/core/src/book.ts`, WP-F09-02), used for the PDF and `index.html`.
- **ZIP.** Streaming ZIP64 writer from file paths in a maintained, permissive library (TDD 01 OQ-3, still open); spike WP-F15-01 picks it.
- **PDF.** `expo-print` `printToFileAsync({ html, width: 612, height: 792 })`; iOS HTML cannot load local asset URLs, so fonts are base64 inline (Expo Print docs, opened 3 Oct 2026). Margins via CSS `@page` [A], verified in the spike.
- **Share.** `expo-sharing` `shareAsync(uri, { UTI })` (Expo Sharing docs). The docs do not say when the promise resolves, so temp cleanup also runs on next foreground and next launch (sweep, BL-134).
- **Fonts.** Literata and Tiro bundled (BL-258); Noto Naskh Arabic and Noto Serif SC ride in the Arabic and Mandarin packs (F05, B13) with a font subsetter at export for Chinese; subsetter choice is part of WP-F15-04 (permissive licence only).
- **New installs.** `expo-print`, `expo-sharing`, `expo-keep-awake` through `flock /tmp/scribe-npm.lock npx expo install` (brief coordination rule), licences checked first.
- **Riskiest unknown.** Throughput on SE 3 for 470 MB plus hashing plus re-read verification, and WKWebView memory on a 240-letter PDF with a Chinese subset. Spike WP-F15-01 measures both on device before BL-150 starts.

## 12. Work packages

| WP | Scope | Owner | Owns files | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F15-01 | Spike: ZIP library choice, SE 3 throughput for 230 and 470 MB, PDF memory at 240 letters | Mobile engineer | `apps/mobile/src/dev/export-probe.tsx` (new) | BL-030 | Numbers and library decision in PR (closes TDD 01 OQ-3) | pair, device |
| WP-F15-02 | Export format 1.1.0: schema, `entries.json`, manifest, README, `account.json`, fixtures | Privacy engineer | `packages/export/` (new) | none | `[DATA-REQ-050]`, `[DATA-REQ-051]` schema tests, `[F15-REQ-001]`, `[F15-REQ-003]` | agent |
| WP-F15-03 | Book template and PDF render | Design systems, mobile engineer | `packages/book/` (new), `apps/mobile/src/lib/export/pdf.ts` (new) | WP-F09-02, BL-258 | `[F15-REQ-004]` to `[F15-REQ-008]` with the 4-script fixture | agent |
| WP-F15-04 | Fonts in packs and Chinese subsetting | Speech engineer (packs), design systems | F05 pack manifest fields (request), `apps/mobile/src/lib/export/fonts.ts` (new) | WP-F15-03, F05 packs | `[F15-REQ-006]`; Mandarin PDF under 3 MB of font data [A] | agent |
| WP-F15-05 | Streaming builder, verify, pause and restart, space check (BL-150) | Mobile engineer | `apps/mobile/src/lib/export/build.ts` (new), `apps/mobile/src/lib/export/job.ts` (new) | WP-F15-01, WP-F15-02, BL-111 | `[DATA-REQ-052]`, `[F15-REQ-010]`, `[F15-REQ-011]`, `[F15-REQ-012]`, kill test 20 of 20 | agent plus device |
| WP-F15-06 | Export screen, share sheet, notice, cleanup | Mobile engineer | `apps/mobile/src/app/settings/export.tsx` (new), `apps/mobile/src/components/export/copy.ts` (new) | WP-F15-05 | `[DATA-REQ-056]`, `[F15-REQ-014]`, `[F15-REQ-015]`, E2E-10 | agent |
| WP-F15-07 | Offline `index.html` reader | Mobile engineer | `packages/book/reader/` (new) | WP-F15-03 | `[F15-REQ-013]` in Safari and Chrome | agent |
| WP-F15-08 | Entry points: Book PDF share, delete flows, About, ErrorBoundary | Mobile engineer | `(tabs)/book.tsx` menu, F17 flow hooks (request to F17 owner) | WP-F15-06 | `[F15-REQ-009]`, `[DATA-REQ-053]` | agent |
| WP-F15-09 | Pledge copy in Help and Legal and shutdown runbook | Content, founder | `apps/mobile/src/components/export/copy.ts`, `docs/` runbook (request) | BL-159 | `[PRD-REQ-009]` text equality test against Terms 17 number | pair |
| WP-F15-10 | Durability drill includes export re-read (BL-284) | QA engineer | `docs/` QA script (request) | WP-F15-06 | Drill evidence each release candidate | human |

## 13. Open questions and assumptions

| # | Question | Who | By | What changes |
|---|---|---|---|---|
| Q1 | The 2-minute gate was set for 230 MB (originals only). With listening copies a year is about 470 MB. Spec default: keep the 2-minute gate for originals only and add a 4-minute target with copies, or make copies off by default if the spike misses it | Founder | After WP-F15-01, week 6 | C-NFR-007, F15-REQ-001 |
| Q2 | Should the PDF include private letters if the author asks (an "Include my private letters" switch)? Spec default: never at v1.0 | Founder | 30 Oct | F15-REQ-005 |
| Q3 | Arabic and Chinese reading fonts in the language packs (spec default) or downloaded only at export | F05 owner, design systems | 23 Oct | WP-F15-04 |
| Q4 | Does a co-parent's export include the other parent's in-book letters as PDF pages (spec default: yes, final text only) | Founder, counsel | 30 Oct | F11 export row |
| Q5 | Format version 1.1.0 versus keeping 1.0.0 (nothing has shipped) | Privacy engineer | 16 Oct | WP-F15-02 |

| # | Assumption | How we validate |
|---|---|---|
| A1 | ZIP throughput on SE 3 allows 470 MB in 4 minutes with hashing and re-read | WP-F15-01 |
| A2 | WKWebView honours `break-inside: avoid` and `@page` margins in `printToFileAsync` | WP-F15-01 |
| A3 | Families share the PDF with grandparents at v1.0 | Study 3; `export_started{format: pdf}` |

## 14. Sources

- `docs/prd/v2/_AUTHORING.md` B6, B7, B13; `01-problem.md` 2.4; `02-customers.md` P5, P6; `03-goals-and-principles.md` PS7; `05-feature-map.md`; `09-decisions-and-risks.md` R-05, R-10, R-11.
- `docs/prd/PRD.md` 1.3: PRD-REQ-004, PRD-REQ-009, K-05, K-32, section 6.6, 7.1, 7.10 item 6.
- `docs/prd/C-habits-pricing-settings.md` C-REQ-017, C-REQ-018, C-NFR-004, C-NFR-007.
- `docs/legal/DELETION_AND_EXPORT_SPEC.md` section 4, DATA-REQ-050 to -056; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-013, -034, -035, -036, -050; `docs/legal/app-store-privacy-labels.md`.
- `docs/DECISIONS.md` D-033, D-042; `docs/adr/0005-audio-format.md`; `docs/adr/0010-web-app-placement.md`; `docs/ARCHITECTURE.md` section 7.
- `docs/tdd/01-mobile-client.md` 3.1, 3.4, 3.7; `docs/tdd/05-privacy-compliance.md` 5.5; `docs/tdd/07-quality-test-strategy.md` E2E-09, E2E-10.
- `docs/design/DESIGN_LANGUAGE.md` 3.
- Code: `packages/content/src/strings.en.ts` (`settings.export.*`, `settings.delete.bookExportFirst`, `settingsMore.exportNotYet`), `packages/content/src/book.en.ts`, `packages/core/src/plan.ts`, `packages/analytics/src/catalog.ts`, `apps/mobile/package.json`.
- `docs/prd/v2/features/F04-capture.md` (F04-REQ-015, `occurred_precision`, `language`), `F08-recordings.md` (F08-REQ-002, DATA-REQ-050 row, WP-F08-09), `F09-book.md`, `F11-co-parent.md`.
- Research: R1 F15 (R1-S3, -S5, -S10, -S13, -S14, -S16, -S44, -S54, -S56, -S67); R2 section 0 items 1, 3, 6, T14, T19, R2-S37; R5 section 0 item 9.
- Opened 3 Oct 2026: Expo Print docs, https://docs.expo.dev/versions/latest/sdk/print/; Expo Sharing docs, https://docs.expo.dev/versions/latest/sdk/sharing/; Expo KeepAwake docs, https://docs.expo.dev/versions/latest/sdk/keep-awake/; Google Fonts metadata and file sizes for Noto Naskh Arabic (https://github.com/google/fonts/tree/main/ofl/notonaskharabic), Noto Serif SC (https://github.com/google/fonts/tree/main/ofl/notoserifsc), Tiro Devanagari Hindi and Literata (same repository).
