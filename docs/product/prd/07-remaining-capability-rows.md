# NS-07: Remaining rows of the capability map (NX-42) that were not specified

Status: Draft v1, 11 Nov 2026 (UTC). Docs only. Author: `product`. Rank 7 of 7. Index: `README.md`.
Source: `docs/roadmap/next/03-requirements/NX-42-capability-map.md` on branch `docs/nav-tabs-requirements-10nov` (PR #790, head `d80db1f2`), C1 to C46, and its gaps section (G-rows are numbered G1 to G11 in `FEATURE-GAP-AND-WEDGE-10nov.md`, PR #792).

Tags: EVIDENCE = file or PR read this session. UNVERIFIED = not read or not run. I read NX-42, NX-43, NX-44, NX-39 and the feature files named. I did not open NX-16, NX-17, NX-27, NX-33, NX-34, F31, F32, `07-letters-on-every-phone.md` or the `docs/prd/v2/features` files for rows marked "cited". Those requirement files are named by NX-42 as the home of the row; I trust the name and mark each UNVERIFIED for content. Several live on branches and not on `develop` at `da83fb1ee`.

## 1. How each row was handled

Three outcomes only:

- Cited: a requirement already exists. No new text. The citation is the deliverable.
- Specified here: a short requirement set follows in section 3.
- Parked with a default: not specifiable now. Section 4 says why and what would reopen it.

## 2. Disposition of every row

| Row | Capability | Outcome | Where |
|---|---|---|---|
| C1 | Capture | Cited | F04 |
| C2 | Review and faithful edit | Cited | F06 |
| C3 | Waiting drafts and held letters | Cited | F04; F14-REQ-041 |
| C4 | Prompts and Another thought | Cited | F13 |
| C5 | Not much today | Specified here | section 3.1 |
| C6 | Age and stage | Cited | F03, F12, F13-REQ-003 |
| C7 | Catch-up letters | Cited (branch) | NX-27, on `docs/execution-tracker-8nov`; UNVERIFIED on `develop` |
| C8 | Memories on Home | Cited (branch) | NX-43 (PR #790), R1 to R14 |
| C9 | Plus line on Home | Cited | F14-REQ-040 |
| C10 to C12 | Book by month, letter page, Read together | Cited | F09, F08, F10 |
| C13 | Find | Specified | NS-02 |
| C14 | Firsts | Specified | NS-06 Part A |
| C15, C16 | Several books, hide and delete | Cited | F12, F17, NX-04 |
| C17 to C19 | Photo, date and place chips, library chooser | C17 specified; C18, C19 cited | NS-01; NX-39 P1, P2a |
| C20 to C22 | Suggested days, video, occasions | Cited | NX-39 P2b, P3, P4a |
| C23 | Co-parent sharing | Cited | F11; BL-882 to BL-889 |
| C24 | Shared voice, close family | Parked | section 4.1 |
| C25 | Plus | Cited | F14; `08-plus-and-billing-trust.md` |
| C26 | Gifts and lifetime | Parked | section 4.2 |
| C27 | Export everything | Cited | F15 |
| C28 | Printed book | Specified (structure only) | section 3.2 |
| C29, C30 | Backup, sync and new phone | Cited (branch) | NX-34; F16 |
| C31 to C36, C38 to C42 | Account, lock, privacy, delete, safety, languages, dictionary, reminders, appearance, analytics | Cited | F02, NX-31, NX-32, F17, NX-08, F20, F07, F13, NX-35, F18 |
| C37 | Help, support, legal | Cited (branch) | F20; NX-16; UNVERIFIED content |
| C43 | App-interface localisation | Parked | section 4.3 |
| C44, C45, C46 | First run, store and web, alerts and switches | Cited | F01, F03, NX-31, NX-40, F21, NX-24, NX-17, F19 |
| Share one letter | (new row, NAV-TAB-ROLES G-3) | Specified | NS-05 |
| Sealed letter | PRD F41; research gap G5 | Specified | NS-06 Part B |
| Quick capture | Research gap G6 | Specified (conditional) | NS-04, NS-06 Part C |
| G7 | Weekly list for family | Parked | section 4.4 |
| G8 | Choose who sees each letter | Parked | section 4.5 |
| G9 | Bring letters in from another app | Parked | section 4.6 |
| G10 | Gifts | Same as C26 | section 4.2 |
| G11 | The privacy label as a feature | Specified | section 3.3 |

## 3. Specified here

### 3.1 C5. "Not much today" (a requirement for what ships)

NX-42 says the requirement file is UNVERIFIED. D-084 states the rule; this restates it as testable rows.

Job: I go to Home on a quiet day to mark the day without words, so that the book has the day and I feel no pressure.
Entry rule: a capture mode of Home's one entry (rule P1); nothing else starts it.

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-07-C5-1 | Given Home, When the parent taps "Not much today", Then the book stores a mark with `final_text` empty, no recording and no sentence; the Book shows "A quiet day" with the date, unsigned (D-084). | `[NS-07-C5-1] a quiet day stores no text` |
| NS-07-C5-2 | Given a quiet day, Then it does not count toward the allowance (D-083, D-103), cannot carry a picture (NS-01-R25), cannot be marked a first (NS-06-A6), cannot be sealed (NS-06-B10), is not found by Find (NS-02) and is not a Home memory (NX-43-R9). | `[NS-07-C5-2] a quiet day is outside every other feature` |
| NS-07-C5-3 | Given quiet days, Then no screen, notification or export file name shows a count of them or a run of them. | `[NS-07-C5-3] quiet days are never counted` |
| NS-07-C5-4 | Given Read together and the printed book, Then quiet days never appear (D-084). | `[NS-07-C5-4] quiet days stay out of Read together and print` |
| NS-07-C5-5 | Given one tap on the control, Then the mark is written and Home shows the ordinary state with no dialog. A second tap the same day is a no-op. | `[NS-07-C5-5] one tap, no dialog, no duplicate` |

Label effect: none. Free vs Plus: free; capture never blocked; not counted. Privacy: stores no words. Rollout: the behaviour is in the code (EVIDENCE: `apps/mobile/src/lib/db/migrations.ts` blanks the old `not_much` sentences; `strings.en.ts` holds `notMuchButton` "Not much today" and the "A quiet day" label; the export golden fixtures carry `kind: not_much`; read at `da83fb1ee`). I did not run the app or find a test titled for each row, so each NS-07-C5 test below is new until a trace shows an existing one (UNVERIFIED). Backlog: trace rows to existing tests; no build.

### 3.2 C28. Print-ready file (structure only; numbers wait for proof books)

Source: the exec record (Q2, Q4 rank 2): "a print-ready export spec only (BK-13), if you want it", proof from two print-on-demand services after Build 12, a revenue decision no earlier than the BK-14 go/no-go in June 2027 and after the entity question. Print is a separate purchase outside Plus (closed X3). Nothing here sells, ships or promises a printed book (BRAND.md: "Not promised in v1.0").

Job: I go to Export to get a file my family can print, so that a paper book can be made from what we kept.

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-07-C28-1 | Given the Export screen with `EXPO_PUBLIC_PRINT_READY` on, Then it offers one extra file, a print-ready PDF, beside the existing ones, and no price, order button, seller or partner name. | `[NS-07-C28-1] Export offers a file and sells nothing` |
| NS-07-C28-2 | Given the PDF, Then every page carries only text the parent said or typed, the parent's pictures (stored stripped copies) and the app's fixed unsigned words (month headings, a title page); no generated caption, summary or "highlights" page. | `[NS-07-C28-2] the book holds only the parent's words and pictures` |
| NS-07-C28-3 | Given the PDF text layer, Then it equals the letters' `final_text` in book order, for 20 fixtures including Devanagari, Arabic and Chinese. | `[NS-07-C28-3] the text layer equals the words` |
| NS-07-C28-4 | Given quiet days, Then they do not appear (D-084); Given sealed letters, Then the print-ready PDF omits their words until the seal is removed (design FS-R11); the author's own data export (ZIP) is the file that carries a sealed letter whole. | `[NS-07-C28-4] quiet days and closed seals stay out` |
| NS-07-C28-5 | Given empty months, Then no page, heading or line mentions them; no page count or "pages left" appears. | `[NS-07-C28-5] gaps are not shown or counted` |
| NS-07-C28-6 | Given the file, Then it has embedded fonts and no external links, trackers or QR code (a QR needs hosted audio: not before NS-03 and NS-05 Level 3). | `[NS-07-C28-6] fonts embedded; no links; no QR` |
| NS-07-C28-7 | Given Export, Then this file is free and ungated when built (what a family kept stays theirs to export); not promised as forever. | `[NS-07-C28-7] the print-ready file is never gated` |

Not specified, because the numbers come from proof books: trim size, margins, bleed, resolution, page count limit, cover. Default: the two proof books set them, `product` adds them to this section with the proof's date. Until then C28-1 to C28-7 are testable and the layout is not.

### 3.3 G11. The privacy label as a release gate

Evidence: the research file notes that a clean privacy label is a competitive fact only while we keep it; the exec record says a hosted recording flips Audio Data to collected and linked.

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-07-G11-1 | Given a diff fixture that adds a network call carrying letter text, a recording, a picture or a child name, or adds a server table, bucket or function for them, When the guard `scripts/guards/label-effect.mjs` (name proposed) runs, Then it exits non-zero unless the PR body names a recorded founder decision id (D-###) for the label change; given a diff with neither, it exits zero. | `[NS-07-G11-1] the label-effect guard fails an unrecorded data-leaving diff` (Node test over diff fixtures) |
| NS-07-G11-2 | Given each file whose name starts `0` and ends `.md` in `docs/product/prd/` (the NS-01 to NS-07 files; the README is excluded), Then it contains a line starting `Label effect:` (or `Label effect (Part`). | `[NS-07-G11-2] every PRD states its label effect` (Node test over the folder) |

Free vs Plus: not applicable. Rollout: a new guard script (size S, a guess) for `security-architect` and `compliance-engineer`. Today's feature set in this folder changes the label in none of NS-01, NS-02, NS-05 Level 1 and NS-06 A; NS-05 Levels 2 and 3 do.

## 4. Parked with a default

Each row says why it cannot be written as testable text today, who can reopen it and what the default is.

| Id | Row | Why not now | Reopened by | Default |
|---|---|---|---|---|
| 4.1 | C24 Shared voice and close family (F31, F32) | Needs audio to leave the phone (NS-03, NS-05) and a contributor model; F32 has an open draft-count edge (DR-16) per the F30 text I read; also needs counsel (D-050, LEGAL-REQ-035). I did not read F31 or F32 in full | NS-03 Go and the security and counsel reads | Later (v1.1 and after); no copy promises it |
| 4.2 | C26 and G10 Gifts and lifetime | "Gift" is a banned word at v1.0 (BRAND.md glossary); no requirement file; counsel and Apple in-app purchase rules not read; gift buyer is last in the exec ranking | Founder names a release; counsel read | Not written, not built |
| 4.3 | C43 App-interface localisation | English only in Build 13 (D-121); strings, dates and plurals are "ready now" per F30; a language ships only after its gate passes with a native reviewer | A language passing its evidence gate | Not written |
| 4.4 | G7 A weekly list of new letters for family | Needs a family audience (4.1). The constitution allows only a plain list of letters with no new sentence; a summary is forbidden | NS-05 Level 3 live | Not written; no recaps in any form |
| 4.5 | G8 Choose who sees each letter | Part of hosted-link design (NS-05 Level 3). Per-letter and author-chosen is already a guard in NS-05 section 8 | NS-05 Level 3 requirement | Default nobody; never default on |
| 4.6 | G9 Bring in letters from another app | Other apps' export formats are UNVERIFIED; the voice-memo import is covered by NX-27 (UNVERIFIED on `develop`) | A parent study showing arrivals with history | Not written |

## 5. Free vs Plus, privacy, metrics (applies to the specified rows)

Label effect: none for C5 and C28; G11 is the rule for the others. Free vs Plus: none of the rows in section 3 is a gate (free and ungated when built; not promised as forever). The one gate stays Keep after the allowance (D-082: 2, planned raise 2, 5, 10; capture never blocked; what a family kept stays theirs to read, hear and export). Metrics: none in the app for any row here; opt-in analytics is off through 1.0. Privacy: the machine adds no meaning in any row; no streak, point or gap counting; `{child}` only.

## 6. Dependencies, risks, rollout

- Dependencies: the files named in section 2; NS-01 to NS-06; the founder's release choices in section 7.
- Risk: citing branch-only requirement files (NX-27, NX-33, NX-34, NX-16, NX-17) means the cite can drift. Mitigation: the next backlog PR re-checks each against `develop` and replaces "branch" with the merged path.
- Rollout: C5 is in the code at `da83fb1ee` (EVIDENCE above; not run); C28 behind `EXPO_PUBLIC_PRINT_READY` (name proposed), target after Build 14 and after the proof books; G11 is a CI guard, no build.

## 7. Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-1 | Spend the proof-book amount in the exec record (Q2) on two proof books? | Founder | No spend; C28 layout numbers stay open | Fri 20 Nov 2026 |
| OQ-2 | Who writes the label-effect guard and by when? | `security-architect`, `compliance-engineer` | The guard is built (size S) and runs in CI before Build 14 freezes. Until it merges, G11-1 is a PR-checklist line and the row is "partly built" (RR-8). This agrees with G11-1, which is the guard's test. | Before Build 14 freeze |
| OQ-3 | Re-check of branch-only cites | `product` | Next backlog PR | Fri 20 Nov 2026 |

## 8. Not fully testable

- C28 layout (trim, bleed, resolution) is not testable until the proof books exist.
- Every "Cited" row's content is UNVERIFIED by me where marked.
- The parked rows are not specified by design; they have no acceptance criteria.
