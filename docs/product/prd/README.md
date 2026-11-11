# New-scope product requirements (11 Nov 2026)

Author: `product`. Status: Draft v1 for the founder and the owners named in each file. Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`.

Aligned on 11 Nov to the design specs in PR #794 (`docs/design/specs/NEW-SCOPE-INDEX-11nov.md` and 01 to 06, head `e872793d`). Where a design default and an earlier line of mine differed, the design default won and the file says so.

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

## The files

| Rank | File | Item | Build target | Flag | Type |
|---|---|---|---|---|---|
| 1 | `01-photo-with-a-letter.md` | Photo-first capture on Home; Photos lens in the Book | 13 | `EXPO_PUBLIC_PHOTOS` | Build |
| 2 | `02-find.md` | Search the family's own letters on the phone | 13 | `EXPO_PUBLIC_BOOK_SEARCH` | Build |
| 3 | `03-family-hears-it-pilot.md` | Concierge pilot with 8 to 10 parents | none | none | Research, no build |
| 4 | `04-hands-free-capture-spike.md` | Time-boxed spike on hands-free start | none | none | Spike |
| 5 | `05-share-one-letter.md` | One-letter share; the Share tab question | 14 earliest (Level 1) | `EXPO_PUBLIC_SHARE_LETTER` | Build, gated |
| 6 | `06-firsts-sealed-letter-quick-capture.md` | Firsts, sealed letter, quick capture | After ranks 1 to 5, behind a five-parent study; sealed also needs `data-architect` on seal sync; sealed not scheduled | `EXPO_PUBLIC_FIRSTS` and others | Build, gated by study and spike |
| 7 | `07-remaining-capability-rows.md` | Every other NX-42 row: cited, specified or parked | mixed | `EXPO_PUBLIC_PRINT_READY` | Mixed |

Flag names and build numbers are proposals. The release train and `capabilities.ts` set the final names. Dates for Build 13 and Build 14 are not in the repo; this folder does not invent them.

## What the founder is asked, with defaults

Every open question in every file has a default. The ones that need the founder:

| Ask | File | Default if no answer | By |
|---|---|---|---|
| Is Photos P1 (date from the file) in Build 13? | 01 OQ-1 | No, P0 only | Fri 20 Nov 2026 |
| Search across all books? | 02 OQ-1 | No, active book only | Fri 20 Nov 2026 |
| Accept the pilot principle and the proposed success lines | 03 OQ-1, section 8 | Yes, as written | Fri 20 Nov 2026 |
| Spike engineer and week | 04 OQ-1 | The Monday after Build 13 is cut | Fri 20 Nov 2026 |
| Share one letter in Build 14, and no Share tab | 05 OQ-1, OQ-5 | Build 14; no tab | Fri 20 Nov 2026 |
| Firsts concept study; sealed letters timing | 06 OQ-A1, OQ-B1 | Study after Build 13; sealed not before Build 15 | Fri 20 Nov 2026 |
| Proof books spend (about $45) | 07 OQ-1 | No spend | Fri 20 Nov 2026 |

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
| `book.empty.bookCta` ("Write a letter") | A button on the Book's empty state that reads as starting a letter | A pointer to Home. Behaviour: a tab switch only. NS-01-R24 holds the test; `content` writes the word (design spec 06, J3). |
| Photos lens in the Book | (NS-01) | No "Add photos" button that starts a letter (NS-01-R24). |

Trace ids: each acceptance row carries an id of the form `NS-01-R7` or `NS-06-A3`, and its test title starts with that id in square brackets, so a test can cite the requirement it proves.
