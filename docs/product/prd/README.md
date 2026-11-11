# New-scope product requirements (11 Nov 2026)

Author: `product`. Status: Draft v1 for the founder and the owners named in each file. Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`.

Aligned on 11 Nov to the design specs in PR #794 (`docs/design/specs/NEW-SCOPE-INDEX-11nov.md` and 01 to 06, head `38abc432`, re-read on 11 Nov after the updates; see the changes list below). Where a design default and an earlier line of mine differed, the design default won and the file says so.

Scope came from the founder's request of 10 to 11 Nov 2026 as recorded in `closed-questions-2026-11-11.md` (X1 order of new work, X2 voice leaving the phone, X3 and X4 free versus Plus). One file per item, in stack-rank order.

## The ground rules every file obeys

| Rule | Source |
|---|---|
| Tabs are Home, Book and Me. Family is never a tab. Co-parent "coming soon" is at most one caption line in Me. The Library is not a tab. | closed N1 to N3 |
| Only Home starts a letter. Everything else adds to a letter that exists or reads kept letters. | `NAV-TAB-ROLES-10nov.md` P1, P2, P9 |
| The machine may remove and repair, and may never add meaning. No streaks, points or counts of gaps. `{child}` only. | CLAUDE.md, BRAND.md, VOICE.md |
| One gate: Keep after the allowance of 2, planned raise 2, 5, 10 (D-082). Capture is never blocked. What a family kept stays theirs to read, hear and export. No "free forever". | D-082, closed X3 and X4 |
| A copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first. | closed X2 |
| Memory Library is after Build 13 as a whole. NS-01 is only NX-39 P0 (one picture per letter), which the exec record already puts in Build 13. | `exec-rulings-2026-11-10-expansion.md`; NX-39 |
| Metrics are content-free. Opt-in analytics is off through 1.0 (D-124). | F18, NX-39-R34 |
| Lens, Photos lens, Firsts lens, Home memory, index and Find (as a header action) are internal terms. `content` names the parent-facing words (BRAND.md glossary, CR-25); a parent never reads "lens". | BRAND.md |
| Level 1 share has no recording row and no recording path until `security-architect` and counsel reads are on record; design spec 03 must remove its recording toggle. The shared text has no footer, brand name or link (NS-05-R16, SH-R10). | Karma, 11 Nov |
| Build 13 is one photo per letter and no video. The design cap of 8 photos and 2 videos is out of Build 13. | design spec 01 section 1a |

## The files

| Rank | File | Item | Build target | Flag | Type |
|---|---|---|---|---|---|
| 1 | `01-photo-with-a-letter.md` | Photo-first capture on Home; Photos lens in the Book | 13 | `EXPO_PUBLIC_PHOTOS` | Build |
| 2 | `02-find.md` | Search the family's own letters on the phone | 13 | `EXPO_PUBLIC_BOOK_SEARCH` | Build |
| 3 | `03-family-hears-it-pilot.md` | Concierge pilot with 8 to 10 parents | none | none | Research, no build |
| 4 | `04-hands-free-capture-spike.md` | Time-boxed spike on hands-free start | none | none | Spike |
| 5 | `05-share-one-letter.md` | One-letter share; the Share tab question | 14 earliest (Level 1) | `EXPO_PUBLIC_SHARE_LETTER` | Build, gated |
| 6 | `06-firsts-sealed-letter-quick-capture.md` | Firsts, sealed letter, quick capture | In scope, specified now; build after rank 5 and a five-parent study, earliest Build 15 for Firsts, the sealed letter and quick capture (flag `EXPO_PUBLIC_QUICK_CAPTURE` for Part C); sealed is author-only (nothing reaches another phone before the day, ADR 0028 D3) and `data-architect` reconciles the UTC instant with the calendar date by Fri 20 Nov 2026 | `EXPO_PUBLIC_FIRSTS` and others | Build, gated by study and spike |
| 7 | `07-remaining-capability-rows.md` | Every other NX-42 row: cited, specified or parked | mixed | `EXPO_PUBLIC_PRINT_READY` | Mixed |

Firsts and the sealed letter are in scope and not cancelled; only their build is sequenced (earliest Build 15). Flag names and build numbers are proposals. The release train and `capabilities.ts` set the final names. Dates for Build 13 and Build 14 are not in the repo; this folder does not invent them.

## What the founder is asked, with defaults

Every open question in every file has a default. The ones that need the founder:

| Ask | File | Default if no answer | By |
|---|---|---|---|
| Is Photos P1 (date from the file) in Build 13? | 01 OQ-1 | No, P0 only | Fri 20 Nov 2026 |
| Search across all books? | 02 OQ-1 | No, active book only | Fri 20 Nov 2026 |
| Accept the pilot principle and the proposed success lines | 03 OQ-1, section 8 | Yes, as written | Fri 20 Nov 2026 |
| Spike engineer and week | 04 OQ-1 | The Monday after Build 13 is cut | Fri 20 Nov 2026 |
| Share one letter in Build 14, and no Share tab | 05 OQ-1, OQ-5 | Build 14; no tab | Fri 20 Nov 2026 |
| Firsts and sealed letters: both in scope; when the five-parent study runs | 06 OQ-A1, OQ-B1 | Study after Build 13; both built earliest Build 15, after rank 5 and the study | Fri 20 Nov 2026 |
| Proof books spend (the amount in the exec record, Q2) | 07 OQ-1 | No spend | Fri 20 Nov 2026 |

## Reads that gate anything

| Read | Gates | By whom |
|---|---|---|
| Counsel on the NX-33 photo label | NS-01 in `production` | counsel, through the founder |
| `security-architect` and counsel on any voice leaving the phone | NS-03 Arm V, NS-05 Levels 2 and 3 | both |
| `security-architect` on plist and entitlement deltas | NS-04 exit, NS-06 Part C | `security-architect` |
| Counsel on minors and "open on a day" | NS-06 Part B | counsel |

## Facts not verified

Competitor facts come from `FEATURE-GAP-AND-WEDGE-10nov.md` (pages read by another agent, not products run) and are UNVERIFIED here. I did not verify any law, Apple guideline or Expo capability; the files that mention them say where the source is or mark them UNVERIFIED. Requirement files that live only on open branches (NX-41 to NX-44 in PR #790; NAV-TAB-ROLES in PR #789; the research file in PR #792; NX-27, NX-33, NX-34, NX-16, NX-17) are cited by name and need a re-check when they merge.

## Corrections owed to NX-41 and NX-42 (reconciliation)

NX-41 and NX-42 live on PR #790's branch (`docs/nav-tabs-requirements-10nov`, head `d80db1f2`), not on `develop`, so this PR cannot edit them. The edits below are for that branch (BL-898 is the reconcile row). Karma's ruling (11 Nov): tabs are Home | Book | Me; Family is never a tab; co-parent is at most one caption line in Me.

| File and line | Says now | Must say |
|---|---|---|
| NX-41 R12 | "Alpha stays whole. ... the Family tab with the real co-parent screens stays" in a `preview` build | Family is never a tab, in any build. The real co-parent screens are reached from Me. "Coming soon" is at most one caption line in Me, with no row, screen or chevron (closed N1). |
| NX-41 section 4 and H6 | Four tabs; a Moments tab; an alpha Family tab | Three tabs: Home (Say), Book (Read), Me (Look after). No Moments tab, no Family tab. |
| NX-42 section 1, "Tab model" | Home, Book, Moments (proposed), Me | Home, Book, Me (three tabs). |
| NX-42 rows C17 to C21 and section 2.3 "Remember (Moments, proposed)" | Tab "Moments" | C17 and C18 attach to a letter (Review, letter page); the picture shelf is the Book's Photos lens (NS-01); C19 is a doorway into the same chooser; C20 shares Home's one memory slot. No Moments tab. |
| NX-42 row C25 | "Pay once for more letters" | Plus is a subscription (D-082): a membership that lets you keep letters beyond the free allowance. Prices only from the App Store and `packages/content`. |
| NX-42 rows C13 and C14, section 3 | Find "no new file"; Firsts MISSING | C13 is specified in `02-find.md`; C14 in `06-firsts-sealed-letter-quick-capture.md` Part A. |
| NX-42 section 4 | Counts Moments 6 | Re-count after the re-homing above. |
| BRAND.md internal-terms table (CR-25) | Has no rows for lens, index, Home memory or Find as a header action | Add the rows, and add parent-facing glossary rows for the words a parent sees. Owner: `content`. A hand-off, not a decision here. |
| `book.empty.bookCta` ("Write a letter") | A button on the Book's empty state that reads as starting a letter | A pointer to Home. Behaviour: a tab switch only. NS-01-R23 holds the test; `content` writes the word (design spec 06, J3). |
| Photos lens in the Book | (NS-01) | No "Add photos" button that starts a letter (NS-01-R23). |

Parent-facing words quoted in acceptance rows (for example "Photo with this letter", "Find a letter", "Share this letter", "Letters found", "This was a first", "hidden until") are PROPOSED. `content` owns the final words; the rows test the behaviour, not the spelling.

Trace ids: each acceptance row carries an id of the form `NS-01-R7` or `NS-06-A3`, and its test title starts with that id in square brackets, so a test can cite the requirement it proves.

## What changed against the design head (re-read 11 Nov at 38abc432)

The tab job sentences are the design's (spec 06), and the navigation test N1 to N10 (spec 06 section 10) proves the one-entry rule: Home "I go to Home to say something to {child}."; Book "I go to the Book to read what we kept."; Me "I go to Me to look after my account and books." N3 needs one `startCapture({source})` function that `mobile` consolidates first (spec 06 section 12, step 0). The doorway names are `widget`, `controlCenterControl`, `actionButton`, `siri`.

| Design change | Where I applied it |
|---|---|
| Build 13 is one photo per letter, no video (spec 01 1a) | NS-01 head and R22 |
| "Start from a photo" is the third and quietest item inside the capture cluster (spec 01 3.1) | NS-01 section 3 and OQ-3 |
| Photos on a sealed letter do not count until it opens; a sealed letter contributes nothing to any surface (spec 04 FS-R10) | NS-01-R10, NS-02-R16, NS-06-B2 |
| Opening removes the seal permanently; the opening-day Home slot `seal.homeOpened` is allowed (spec 04 B4, Q4, FS-R3) | NS-06-B3, B4 |
| Share Level 1 has no recording row; no footer, brand name or link (spec 03 3.3, SH-R10) | NS-05-R16 |
| Share one letter is a founder decision, text first (spec 03 Q0/Q1) | NS-05 head |
| A typed place on a photo is searched; a derived place is not (spec 02) | NS-02-R5, NS-01-R21 |
| Design spec 01 now follows this PRD: system picker only, no pre-prompt, no date chip from the file in Build 13, fixed VoiceOver label (NS-01-R9, R11, R21, R22) | no change needed; confirmed |
| Author-only export exception (FS-R10 and FS-R11): the ZIP data export carries a sealed letter whole for the author; the PDF book and any other person's export never carry its words until the seal is removed | NS-06-B2, B5, NS-07-C28-4 |
| Seal opens at an absolute UTC instant (spec 04 FS-R7); differs from ADR 0028 D3 calendar date | NS-06-B1; `data-architect` reconciles |
| Spec 02 dropped the "Type three letters" hint; PR #798's `find.en.ts` still has it | NS-02-R3: the `hint` slot leaves #798 |

## Appendix A. String-scan pattern lists (used by NS-05-R17, NS-06-A5, A12, B9 and NS-01-R24)

A test scans the named `packages/content` keys, case-insensitive, whole words unless marked. A match fails the test. These lists are PROPOSED by `product`; `content` owns the final list in `packages/content/test/rules.test.ts`.

| List | Patterns |
|---|---|
| Gap, norm and counting | not yet; still waiting; so far; only \d+; \d+ left; missing; behind; on track; typical; normal for; most babies; milestone; streak; in a row; days since; progress; points; badge |
| Loss and ending (VOICE.md legacy rule) | if I am not here; when I am gone; farewell; last letter; passing; legacy contact; in memory of |
| Seal wording | locked; unlock; secure vault; sealed forever; wax |
| Machine-writes (CLAUDE.md) | tidy; cleaned up; polished; improved; corrected; edited (for what the machine does); written for you; we wrote; AI; summary |
| Forbidden characters | em dash; en dash; curly quotes; ellipsis character; emoji |
| Code deny-list for the Firsts folder | imports from any speech, NLP, classifier or text-analysis module; names matching `classif`, `sentiment`, `mood`, `suggest` |
