# F12 Multiple children

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 16 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent |
| Existing IDs | B-REQ-004, B-REQ-005, B-REQ-014, B-REQ-016, B-REQ-020, B-REQ-021, PRD-REQ-011, PRD-REQ-012, PRD-REQ-013, PRD-REQ-014, PRD-REQ-015 Rev (M2), C-REQ-012, C-REQ-023, C-REQ-028, DATA-REQ-014; K-12, K-28; D-007, D-008, D-014 (all amended by D-051 (main) and D-082), D-038; DR-03, DR-04 (answered); BL-034, BL-035, BL-036, BL-113, BL-213 |
| Depends on | F03 (first-run batch), F11 (per-child sharing), F13 (reminders per child), F16 (sync of books), F17 (Settings), F20 (support path). Not F14: starting a book has no Plus gate |
| Status | Draft V2.2, 13 Oct 2026. Every book is free to start; the second-book Plus gate is removed (M2; D-082, D-083 in `apps/mobile/src/components/child/add-child-form.tsx`); the membership counts letters, not books (F14). Revised after critique round 1: "Quiet this book" (R3 DX-05), hide per person, a note and 72-hour undo for book changes by the other parent, a confirm before a birthday change moves letters (R3 DX-12, R4 PT-18), one home per requirement id (R5 EQ-05), local schema numbering (R5 EQ-23), WP status (R5 EQ-25, EQ-26). Dates are milestone ids in `08-delivery.md` section 2.1 |

## 1. Why

- [F] UK mothers reported noticeably fewer photos of a second child (87%), and 92% of them later regretted it (2013, commissioned by a photo studio, directional) [F] UR S7. A younger sibling resents having no book [S] UR S26.
- [S] 4 positive reviews across Qeepsake, BabyPage and Huckleberry praise separate journals per child and twins support [S] R2 section 2.2, theme T18.
- [F] Qeepsake's cheapest paid tier includes 2 journals; Premium has no limit [F] R1-S42. Qeepsake offers twins one shared journal or separate ones [F] R1-S43. A two-child family pays sooner with us than on Qeepsake Essential (R1 F12 note).
- [D] Each child has a separate profile and book. Every book is free to start, at first run or later, born or expected, started or joined. The membership counts kept letters in one pool across every book: 2 free per account, then Plus at Keep (D-082, D-083; M1, M2; F14).
- [F] The pending migration `supabase/migrations/20261004000000_plus_on_device_only.sql` replaces `create_child_row` so it never raises `SCPLS` and drops `has_plus()`. Neither it nor `20261003010000_children_and_entitlements.sql` is applied yet (`.github/migrations-applied.txt` lists two files).

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P1 with a second child | A newborn and a toddler; the first book is months old | No time; wants the second child's book in 3 taps or fewer (UR R3) |
| P1 with twins or more | First run, on day 1 to 10 | Two names, one date, one free hand; any paywall here reads as a charge for twins (K-12) |
| P3 expecting a second child | Third trimester with a toddler at home | Needs a due-date book next to a born child's book (B-REQ-005) |
| P2 co-parent | Joined the partner's book | Can also start their own books, free (M2) |
| A parent whose child has died, or whose baby is in intensive care | Any time | Needs a self-serve way to stop the app talking about that child, without being asked why and without any copy that names the loss (B section 1 non-goals; R3 DX-05), and a person to write to (F20) |
| Separated or separating parents | Any time | Must not have the other parent silently rename the child, move every letter by changing the birthday, or hide the book for both (R3 DX-12) |

## 3. What we are solving

**Outcome.** Every child has their own book, free to start, and a parent always knows whose book they are writing in.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Letters saved to the wrong child then moved or deleted within 24 hours | Under 1% of letters [A] | Device event `child_switched{surface: review}` after save is not countable; use support tickets plus beta C1 interviews | Analytics consent; small sample |
| Switch child time | p95 300 ms offline (PRD 7.1, gate) | Device performance run | n/a |
| Families with 2 or more books whose second book has a letter in its first 30 days | 60% or more [A] | Server aggregate (books per family bucket, BL-024) | Synced users only |
| Plus sheets or StoreKit calls from first run or Add a child | Zero (gate, M2) | Automated test | n/a |
| Taps from the book header to "Quiet this book" | 2 or fewer | UI test | n/a |
| Book-level changes by one parent that the other parent never sees noted | Zero | Two-device test | n/a |

## 4. Scope

**In v1.0**
- One profile and book per child (PRD-REQ-011), the switcher (PRD-REQ-012), per-child settings in three scopes (PRD-REQ-013), per-child sharing (PRD-REQ-014, home F11).
- Every book free to start; no Plus gate (PRD-REQ-015 Rev (M2)).
- Hide and show a book, for this person (B-REQ-014 Rev); delete a book (B-REQ-016).
- "Quiet this book", for this person: stops prompts, reminders, month notes, birthday notes, milestone cards and Read together suggestions for that child; letters untouched; no reason asked; reversible (F12-REQ-011).
- Book-level changes by one parent show the other parent a one-time note with who changed what, and Undo for 72 hours; a birthday change on a book with letters asks to confirm that letters will move chapters (F12-REQ-012, F12-REQ-013).
- Bring never-synced letters from a local book into a joined book for the same child (F12-REQ-007).
- Change the child of a letter before it first syncs (rule in `apps/mobile/src/lib/db/repos/entries.ts`: `child_id` changes only while `synced_at` is null).
- Twins and siblings in the first-run batch, up to 6 (D-038, `create_first_run_children`).
- A support path for a family whose child has died, routed to F20.

**Later**
- B-REQ-021 merge a duplicate synced book and move a synced letter: **deferred to v1.1** [R]. Moving a synced letter needs a copy with identical `raw_transcript` and `captured_at` plus a tombstone (B section 6 item 8), which touches immutability, export history and the other parent's view. Duplicates are rare once the first-run branch "My partner already started one" exists (B F1). Hide covers the v1.0 case.
- B-REQ-020 write to several children at once and sibling letters (P1, sibling part behind `child-input`, PRD-REQ-005).
- Multi-book invite picker (P1, PRD-REQ-014).

**Never**
- A Plus gate on starting, joining or keeping open any book. A lapse never closes a book (C-REQ-028).
- A Plus sheet in first run or in Add a child (C-REQ-023, M2).
- Loss language in any string (CLAUDE.md content rules).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Essential: 2 journals; Premium: no limit; no extra cost per journal [F] R1-S42, R1-S16 | 4.9 (15K) | Families with several children like it [S] R1-S1 | **Innovate**: no book limit on any plan; the membership counts letters, not books (M2) [R] |
| Qeepsake twins | Separate or one shared journal [F] R1-S43 | n/a | n/a | **Match** an explicit twins answer: one book each, free in first run [R] |
| FamilyAlbum | Multiple child profiles [F] R1-S12 | 4.9 (375K) | n/a | Neutral |
| BabyPage | Multiple children's profiles [F] R1-S9 | 4.8 (4.1K) | n/a | Neutral |
| From, Mama | Timeline by child [F] R1-S20 | 4.9 (48) | n/a | **Innovate**: "To {child}" always visible while recording and in Review [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Where |
|---|---|
| "For {child}" switcher atop Tonight and Book (`children.switcher.label`) | `apps/mobile/src/components/child/child-switcher.tsx` (exists) |
| Book header menu: Quiet this book, Hide this book (new) | Book header (F09 owner places the menu; S13) |
| Long-press on any F13 notification for a child: Quiet this book (new) | Notification action (F13, S14) |
| "Whose book?" sheet with Add a child and Hidden books | `apps/mobile/src/components/child/whose-book-sheet.tsx` (exists) |
| "To {child}" in Listening and Review (`children.switcher.toLabel`, `changeLink`) | Capture and Review (F04, F06) |
| Settings > Children > {child}'s book (`children.settings.*`) | Settings (F17) |
| First run "Add another child" (twins and siblings) | F03 |

### 6.2 Happy path

#### A. Add a second child after first run

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps "For Asha", then Add a child | `children.add.title`, `children.add.body`, `children.add.twinsHelp` | No plan check (M2) |
| 2 | Enters a name and a birthday or due date | Form (`add-child-form.tsx`, exists) | Allowed for everyone: Free, Plus, lapsed |
| 3 | Saves the child | The new empty book (`book.empty.bookTitle`) | Local row with a UUIDv7 id; `create_child` op in the outbox (F16). The server never refuses it for Plus (F12-REQ-002) |
| 4 | Records | "To {new child}" visible | Letter files to the new book |

#### B. Twins in first run
F03 owns the form. Each child gets a book. The batch is sent once through `create_first_run_children` (1 to 6, exists) at sign-in; every book in it is free, like every other book (M2).

#### C. Switch
Tap "For {child}", pick a book. The last opened book is remembered per device (`settings.activeChildId`). With one book, the name shows with no chevron (PRD-REQ-012). Hidden books appear only under Hidden books.

#### D. Hide and show
Book header menu, or Settings > {child}'s book > Hide this book (`children.settings.hideLabel`, `hideBody`). **Per person** (R3 DX-12): sets a hidden flag in this person's `child_member_prefs` row (new column); the book moves under Hidden books and this person's devices drop every notification for that child within one sync. The other parent sees no change. Letters stay readable from Hidden books and exportable. Show this book again clears it. Hiding the book for both parents is a support action (F20), done only after the other parent is asked (R4 PT-18). The existing book-level `children.hidden_at` stays for that support path.

#### D2. Quiet this book (F12-REQ-011)
Book header menu or a notification's long-press: Quiet this book (`children.quiet.*`, new; proposed text "Quiet this book" and, under it, "No prompts, reminders or notes for {child}. Your letters stay as they are."). Per person, reversible from the same menu ("Turn notes back on"). The F13 planner drops every request for that child for this person; Tonight shows no prompt for that child; the Book shows no milestone or birthday cards; Read together is not suggested. Nothing asks why. The copy is reviewed with a perinatal loss and NICU family organisation before C1 (T22; 02 section 7).

#### E. Delete
Settings > {child}'s book > Delete the book. Sole parent: `request_book_deletion` schedules the book, 30-day restore (`settings.delete.bookBody`, `bookUndo`, `bookTypeToConfirmLabel`). With a co-parent: leave and remove own letters (`settings.delete.bookBodyCoParent`), per B-REQ-016 and DATA-REQ-014. Export is offered first (`settings.delete.bookExportFirst`).

#### F. Bring local letters into a joined book (F12-REQ-007)
When a person joins a co-parent's book (F11) and has a local book for what may be the same child with letters never synced, one sheet asks "Bring your letters into {child}'s book?" with Keep them separate as the default. Bring moves `child_id` on those never-synced rows and their drafts in one local transaction, then removes the empty local book. Synced letters are never moved at v1.0.

#### G. A child who has died
No product copy names it, ever (B section 1). The parent can act alone with Quiet this book (D2) or Hide this book (D), which name no loss. Settings > Help shows the support row (F20). Support offers, through the runbook: quiet or hide the book, export, delete, offer to delete a due date (consumer health data, R4 PT-18), and says which emails continue and why (billing notices required by law, with Apple's Manage subscription and refund pages). It never hides the book for the other parent without asking them. F20 owns the wording. F12 guarantees the actions exist: quiet (F12-REQ-011), hide per person (B-REQ-014 Rev), pause celebrations (C-REQ-012), export (LEGAL-REQ-034), delete (B-REQ-016).

#### Per-child settings (PRD-REQ-013, K-12)

| Scope | Settings | Who changes | Stored |
|---|---|---|---|
| Book (shared) | Name, nickname, birthday or due date, photo, book look, delete (book deletion through `request_book_deletion`). A change by one parent shows the other a one-time note with who changed what and Undo for 72 hours; a birthday change on a book with letters asks to confirm first | Parents | `children` (exists; `children_guard` blocks non-parents); the previous value of a changed field kept 72 hours (new, S02 decides the shape) |
| Person, per child | Sign my letters as, include in my reminders, pause celebrations, co-parent letter notifications (F11), hide this book, quiet this book | Each member | `child_member_prefs` (exists; `notify_letters` new in F11; hidden and quiet flags new) |
| Person, all children | Reminder cadence and time, languages, reading size, analytics | Each member | Profile and device settings |

"Family can read" stays in the schema and is hidden at v1.0 (B1).

#### Books and the membership (PRD-REQ-015 Rev (M2))
Changed 13 Oct 2026. The old rule (one free started book, first-run batch free, joined books not counted, Plus for more) is removed.
1. Starting a book is never gated: after first run, at first run, for a due date, for a co-parent.
2. Letters in every book draw on one pool: the first 2 kept per account are free; after that, Keep needs Plus (F14). A new book does not add free letters.
3. A lapse never closes a book: every book stays readable, playable and exportable, and new letters in any book need Plus at Keep (C-REQ-028 Rev, F14).
4. The server never enforces Plus on `create_child` (D-080).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F12-U01 | Offline when adding a child | Local book created; op queued (F16) | New book at once; "Not sent yet" in Settings > Sync (F16) | Automatic | Integration |
| F12-U02 | Removed (M2): no Plus gate on books | | | | |
| F12-U03 | Plus lapsed with 3 books | All 3 stay open; Add a child works; a new letter in any book meets the F14 Keep gate | No gate on books | Resubscribe to keep new letters | `[C-REQ-028]` |
| F12-U04 | Book made offline, synced later | Server accepts (no Plus check) | Nothing changes | n/a | `[F12-REQ-002]` |
| F12-U05 | Seventh child in first run | Add another hidden at 6 (F03-U05) | No button | Add later here | F03 test |
| F12-U06 | Same child id sent twice (retry) | `create_child` idempotent on id (exists) | One book | n/a | `[A-REQ-015] create_child idempotent` (exists) |
| F12-U07 | Recording, then wrong child noticed in Review | "Write to another child" changes the draft child before save | "To {child}" updates | n/a | `[PRD-REQ-012] review child change saves to chosen child` |
| F12-U08 | Wrong child noticed after save, letter not yet synced | Letter menu offers Move to another child | Moves | n/a | Unit: move allowed while `synced_at` null |
| F12-U09 | Wrong child noticed after sync | No move at v1.0 | Copy the text into a new letter to the right child; delete the old one (Recently deleted keeps it 30 days) | v1.1 move (B-REQ-021) | Manual |
| F12-U10 | Hidden book with a birthday today | No birthday note or card for anyone | Nothing | Show again | `[B-REQ-014]` (PRD 6.2 checklist) |
| F12-U11 | One parent hides the book | Hide is per person (B-REQ-014 Rev) | Hidden for that parent only; the other sees no change | That parent shows it | Two-device test |
| F12-U12 | Contributor-era data: a non-parent member edits book settings | `SCPAR` (exists) | n/a at v1.0 | n/a | Exists |
| F12-U13 | Delete with a co-parent | Leave and remove own letters (exists) | `bookBodyCoParent` | Restore own letters 30 days | `[DATA-REQ-014]` (exists) |
| F12-U14 | Two parents each started a book for the same child | Two books | Both in switcher | Hide one; merge v1.1 | Manual |
| F12-U15 | Twins with one shared date | Two books, same date prefilled | Two books | n/a | F03 |
| F12-U16 | Expecting book becomes born | "{child} is here?" sets birth date; letters before it stay in Before You (B-REQ-005) | Chapters recompute | n/a | F09 |
| F12-U17 | Switcher at AX5 on iPhone SE 3 | Sheet rows wrap, names never truncate (D-027) | Full names | n/a | AX5 component test |
| F12-U18 | VoiceOver on the switcher | Label "For Asha, switch to another child's book" (`children.switcher.hint`) | Spoken | n/a | Accessibility audit |
| F12-U19 | Names in Devanagari, Arabic or Chinese | Rendered as typed, never transliterated (B F1) | Correct script | n/a | Render test |
| F12-U20 | A family tells support their child has died | F20 runbook | F20 copy only | Hide, pause, export, delete | Runbook checklist |
| F12-U21 | Delete of the last visible book | Hidden books remain; if none, first run returns | First run | Restore within 30 days | Manual |
| F12-U22 | Parent quiets a book | No prompt, reminder, note, milestone card or Read together suggestion for that child for that parent | Nothing | Turn notes back on | `[F12-REQ-011]` planner and UI cases |
| F12-U23 | Other parent changes the birthday of a book with letters | The changer first confirms that letters will move chapters; the other parent then sees a one-time note with Undo for 72 hours | Note on next open | Undo within 72 hours | `[F12-REQ-012]`, `[F12-REQ-013]` two-device test |
| F12-U24 | Other parent renames the child or changes the photo | One-time note with Undo for 72 hours | Note | Undo | `[F12-REQ-012]` |
| F12-U25 | Both parents change the same field within 72 hours | The later change wins; each note shows the latest; Undo returns the value before the first change [A] | Note | Undo | Unit |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| PRD-REQ-011 | P0 | One profile and book per child; nothing about one child is readable through another child's book | Given Asha and a sibling, When any pull or query runs for Asha, Then no sibling row, member or photo appears (cross-child leak test, F16-REQ-008) | PRD, K-12 |
| PRD-REQ-012 | P0 | Switcher on Tonight and Book; "To {child}" in recording and Review, changeable before save; last book per device; no chevron with one book | Given two books, When recording, Then "To {child}" is visible; switch p95 300 ms offline on iPhone SE 3 | PRD |
| PRD-REQ-013 | P0 | Per-child settings in three scopes, each row 2 taps or fewer from Settings | Given Settings, Then every row in the 6.2 table is reachable in 2 taps; one parent's "pause celebrations" leaves the other's on | PRD, K-12 |
| PRD-REQ-015 Rev (M2) | P0 | Every book is free to start; lapse never closes a book; the server never enforces Plus | Given a Free user with 3 books, When Add a child, Then the form opens with 0 Plus sheets and 0 StoreKit calls. Given `create_child` from a consented user, Then the server creates the book | D-082, D-083, D-080. Built: `add-child-form.tsx`; server in pending migration `20261004000000_plus_on_device_only.sql` |
| B-REQ-004 | P0 | Multiple children; switcher; "To {child}" | As PRD-REQ-012 | B |
| B-REQ-014 Rev (R3 DX-12) | P0 | Hide is per person: it moves the book under Hidden books for that person and stops every child-anchored notification on that person's devices within one sync; the other parent sees no change. Book-level hide for both is a support action | Given A hides Asha's book, When A's second phone syncs, Then 0 requests for Asha on it; and B's phone still has its requests and shows the book | B, R3 DX-12 |
| B-REQ-016 | P0 | Only a sole parent deletes a book; 30-day restore | As DATA-REQ-014 (exists) | B, K-10 |
| B-REQ-021 Rev | P1 (v1.1) | Merge duplicate synced books and move synced letters move to v1.1 | Given v1.0, Then no UI moves a synced letter between books | B, this spec |
| C-REQ-023 | P0 | No Plus sheet in first run, Add a child, at launch, during recording or export | Given first run with 3 children and then Add a child, Then zero Plus sheets and zero purchase calls | C, K-12, M2 |
| C-REQ-028 Rev (M1) | P0 | Lapse keeps every book open: read, play, export, start a book, capture and hold drafts; keeping a new letter needs Plus (F14) | Given a lapsed user with 3 books, Then read, play and export work in all 3 and a new letter is held at Keep | C, D-051 (main) item 3 |
| F12-REQ-001 | n/a | Removed (M2): no book gate. `start_book`, `countStartedBooks` and `newChildNeedsPlus` are gone from code (commit 71070c4) | n/a | D-082 |
| F12-REQ-002 | P0 | `create_child_row` never raises `SCPLS`, and `create_child` no longer reads `has_plus` | Given a consented user with one started book and no store rows, When `create_child` runs, Then the book is created. Given the migration source, Then no function in `create_child` paths references `has_plus` | B2, D-080. Built in pending `20261004000000_plus_on_device_only.sql` |
| F12-REQ-003 | P0 | The client never discards a book for any server answer; permanent refusals go to `rejected_writes` and the book stays local and exportable (F16) | Given a forced `SCCID` on create, Then the book and its letters stay on the phone with "Not sent yet" | D-038, DATA-REQ-043 |
| F12-REQ-004 | P0 | Local `children` keeps only book-level columns; per-person columns (`signs_as`, `reminders_on`, and the new hidden and quiet flags) move to a local `child_member_prefs` table in local schema v7 (`08-delivery.md` section 4) | Given every database version from v0 to the current head, When migrated to v7, Then each child's `signs_as` and `reminders_on` exist in `child_member_prefs` and no value is lost | TDD 01 3.2.2, TDD 02 3.4 |
| F12-REQ-005 Rev | P0 | Hide is per person; Show again restores everything for that person | Given hide then show, Then that person's reminders reschedule on each of their devices within one sync | B-REQ-014 Rev |
| F12-REQ-006 | P0 | Move a letter to another child only while it has never synced | Given a synced letter, Then the Move action is absent; given an unsynced one, Then the move updates the row and its draft in one transaction | `store.ts` rule, DATA-REQ-040 |
| F12-REQ-007 | P0 | On joining a book, offer to bring never-synced letters from a local book; default Keep them separate | Given 4 unsynced letters in a local book, When Bring is chosen, Then all 4 file to the joined book and the empty local book is removed in one transaction; a crash mid-way changes nothing | B F5 edge, F11-U17 |
| F12-REQ-008 | P1 (v1.1) | Move synced letters and merge books (B-REQ-021) | Deferred | B |
| F12-REQ-009 | P0 | Support path for a child who has died: F20 lists the actions; no product string mentions it | Given the content test, Then no string contains loss language; given the F20 runbook, Then hide, pause, export and delete are listed | B section 1, F20 |
| F12-REQ-010 | P0 | Reminders rotate across included children; a child is named only if included (K-12) | Given 2 included children, Then 4 consecutive reminders name each child twice | K-12, F13 |
| F12-REQ-011 | P0 | Quiet this book: per person, reachable in 2 taps from the book header and from a notification's long-press; stops prompts, reminders, month and birthday notes, milestone cards and Read together suggestions for that child; letters untouched; no reason asked; reversible; no string names a loss | Given Asha quieted by A, Then 0 F13 requests for Asha on A's devices, 0 prompts for Asha on A's Tonight, 0 milestone cards for Asha in A's Book; B is unchanged. Given the content test, Then `children.quiet.*` has no loss words | R3 DX-05 |
| F12-REQ-012 | P0 | A book-level change (name, nickname, birthday or due date, photo, look) by one parent shows the other parent a one-time note naming who changed what, with Undo for 72 hours | Given B renames Asha, When A next opens the app, Then 1 note with B's signature and Undo; Given Undo within 72 hours, Then the old name returns on both phones | R3 DX-12 |
| F12-REQ-013 | P0 | A birthday or due-date change on a book with letters asks the changer to confirm that letters will move chapters | Given a book with 1 or more letters, When the birthday changes, Then a confirm sheet shows before save | R3 DX-12 |

Defined in another spec and checked there (R5 EQ-05): **PRD-REQ-014** sharing is per child (home F11). F12 is the home of B-REQ-014, B-REQ-016, PRD-REQ-013 and PRD-REQ-015; F09, F11, F13, F14 and F17 cite them.

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| `children` row (name, nickname, birthday or due date, photo path, look, hidden) | L4 for name and dates | Device, Postgres | Members (`children_member_select`); contributors get name, nickname, month and day only when they return (D-039) | Until book deletion plus 30 days |
| `children.created_by` | L3 | Device, Postgres | Members | Nulled at the creator's account deletion (DATA-REQ-012) |
| `profiles.first_run_closed_at` | L2 | Postgres | Owner (server-owned, `profiles_guard`) | Life of account |
| `child_member_prefs` | L3 | Device, Postgres | Owner | Cascades on leave |
| Active child setting | L3 | Device only | Device | Install |

The hidden and quiet flags are per person and readable only by that person; the 72-hour previous values are readable by the book's parents. The child's name never goes into analytics; children appear only as `child_ordinal` and `child_count_bucket` (PRD-REQ-016). Plus state leaves the device only as the status-only report (D-080, F14).

## 9. Non-functional requirements

| Item | Budget | Gate |
|---|---|---|
| Switch child | p95 300 ms offline, iPhone SE 3 (PRD 7.1) | Yes |
| `create_child` | p95 500 ms at the client (PRD 7.2) | Yes |
| Hide propagates | Within one sync; p95 60 s online (PRD 7.3) | Yes |
| Accessibility | AX5 and VoiceOver on switcher, add, settings, hide, delete | Yes |
| Shared rules | `06-nfr.md` | |

## 10. Analytics

| Event (exists in `packages/analytics/src/catalog.ts`) | Properties | Question |
|---|---|---|
| `child_added` | `mode`, `ordinal`, `in_first_run`, `added_together` | How many families add a second book, and when? |
| `child_switched` | `ordinal`, `surface` | Is the switcher found? Is Review used to correct the child? |
| `child_setting_changed` | `key` (includes `hidden`, `deleted`), `ordinal` | Which settings matter? |

Consent-gated; L2 only. The `second_child` offer trigger is removed from the catalogue (schema 4).

## 11. How we build it (with the architect)

| Part | Files | Notes |
|---|---|---|
| Rules | none | No book rule exists (M2) |
| Local schema | `apps/mobile/src/lib/db/migrations.ts` (exists, at v5 on 13 Oct): v7 adds local `child_member_prefs` with hidden and quiet flags, `children.created_by`, `children.first_run_batch` (TDD 01 3.2.2) | Append-only; never edit a shipped step; number from `08-delivery.md` section 4 |
| Server | `supabase/migrations/20261004000000_plus_on_device_only.sql` (exists, pending apply) replaces `create_child_row` and `create_child` without the Plus check and drops the store tables. New in v1.0: hidden and quiet columns on `child_member_prefs`, and the 72-hour previous value of book fields (S02, in one migration) | Apply after `20261003020000_purge_batching.sql` |
| UI | `apps/mobile/src/components/child/*` (exist), `apps/mobile/src/app/settings/` | `add-child-form.tsx` has no gate (done) |
| Sync | Children and prefs sync through F16 | `children` pulled with the book |

Riskiest unknown: the local schema split (F12-REQ-004) on installs with real letters. The migrator test opens each historical schema fixture (TDD 10 section 3).

## 12. Work packages

Streams: S13 client, S03 local schema, S02 server, S14 planner inputs (`08-delivery.md` section 3.3, which governs file ownership; a path here owned by another stream is a request). Status checked on `origin/develop` on 13 Oct.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode | Status 13 Oct |
|---|---|---|---|---|---|---|---|
| WP-F12-01 | Server: apply the migration that drops the Plus check | Data architect | `supabase/migrations/20261004000000_plus_on_device_only.sql` (exists) | BL-113 pack in staging | `[F12-REQ-002]`; `npm run test:db` green; applied in staging (FT-10); `[PRD-REQ-015]` (exists in `apps/mobile/test/billing-plan.test.ts`) | Human apply. BL-213 superseded | Built; not applied |
| WP-F12-02 | Local schema split, v7 | S03 | `apps/mobile/src/lib/db/migrations.ts`, its test | BL-111 | `[F12-REQ-004]` from v0 to head; `[PRD-REQ-011]` | Agent. BL-136 | Built (checked 27 Oct, develop 1c6795b): local v7 `child_member_prefs` in `lib/db/migrations.ts`; test `store.child-prefs-v7.test.ts` (F12-REQ-004). The prefs also carry `hidden_at` and `quiet_at` for WP-F12-08 and -09, which are not built |
| WP-F12-03 | Removed (M2): no book gate | n/a | n/a | n/a | Removed; `[C-REQ-023]` is checked in the F14 placement tests | n/a | Removed |
| WP-F12-04 | Switcher and Review child change | S13 | `child-switcher.tsx`, `whose-book-sheet.tsx` | WP-F12-02 | `[PRD-REQ-012]`; switch p95 300 ms; `[B-REQ-004]` | Agent. BL-034 | Partly built: both components exist; verify against PRD-REQ-012 |
| WP-F12-05 | Per-child settings, hide, show, delete | S13 | `apps/mobile/src/app/settings/children/` | WP-F12-04 | `[PRD-REQ-013]`, `[F12-REQ-005]`, `[B-REQ-016]`; `[C-REQ-028]`, `[F12-REQ-003]` | Agent. BL-035 | Partly built: `children/[id].tsx` and `new.tsx` exist; hide is book-level today |
| WP-F12-06 | Move unsynced letter; bring local letters on join | S03 move function, S04 join sheet | `apps/mobile/src/lib/db/repos/entries.ts` (move rule exists), join sheet | WP-F11-06 | `[F12-REQ-006]`, `[F12-REQ-007]` crash test | Agent | Partly built: the unsynced-only rule exists in `entries.ts`; bring-on-join not built |
| WP-F12-07 | Hide propagation to notifications | S14 | F13 planner inputs | F13 planner | `[B-REQ-014]` two-device test; `[F12-REQ-010]` | Agent | Not built |
| WP-F12-08 | Quiet this book: menu, notification action, planner input | S13 menu, S14 planner and notification action | Book header menu (request to the F09 owner's file), `packages/core/src/reminder-plan.ts` input | WP-F12-02, WP-F13-02 | `[F12-REQ-011]`; `[F12-REQ-009]` | Agent | Not built |
| WP-F12-09 | Per-person hide; book-change note and 72-hour undo; birthday confirm | S02 server columns (fenced), S13 client | New migration; `apps/mobile/src/app/settings/children/[id].tsx` | WP-F12-02 | `[B-REQ-014]` Rev, `[F12-REQ-012]`, `[F12-REQ-013]` two-device test | Agent | Not built |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 Answered by M2 (D-082, D-083): no book gate | n/a | n/a |
| Q2 Defer B-REQ-021 merge and move to v1.1 | Founder, T15 | WP-F12-06 scope |
| Q3 Hide per person (spec default now, R3 DX-12), with book-level hide only through support after asking the other parent (R4 PT-18). Confirm | Founder, T15 | WP-F12-09 |
| Q4 Are 72 hours right for undoing the other parent's book change? | Founder, T15 | One constant |

| A | Assumption | Validate |
|---|---|---|
| A1 | Duplicate books for one child are rare with the first-run branch | Count books per child name per family in C1 support notes |

## 14. Sources

`docs/prd/v2/_AUTHORING.md` (B1, B2, section 3b M1, M2); `git show origin/main:docs/DECISIONS.md` D-051; commit 71070c4 (D-082, D-083); `supabase/migrations/20261004000000_plus_on_device_only.sql`; `apps/mobile/src/components/child/add-child-form.tsx`; `09-decisions-and-risks.md` DR-03, DR-04; `docs/DECISIONS.md` D-007, D-008, D-014, D-038, D-039; `docs/prd/PRD.md` K-12, K-28, PRD-REQ-011 to -016, 6.8, 7.1 to 7.3; `docs/prd/B-first-run-and-family.md` F1, F2, B-REQ-004, -005, -014, -016, -020, -021, section 6; `docs/prd/C-habits-pricing-settings.md` C-REQ-012, -023, -028; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-012, -014; `docs/tdd/01-mobile-client.md` 3.2.2, 3.2.3; `docs/tdd/02-sync-backend.md` 3.4; `docs/tdd/10-red-team-critique.md` section 3; `supabase/migrations/20261002020000_data_governance.sql`, `20261003010000_children_and_entitlements.sql`; `.github/migrations-applied.txt`; `apps/mobile/src/lib/store.ts`; `apps/mobile/src/lib/db/migrations.ts`; `apps/mobile/src/components/child/`; `packages/core/src/plan.ts`; `packages/content/src/strings.en.ts` (`children.*`, `childrenExtra.*`, `settings.delete.*`); `packages/analytics/src/catalog.ts`; `docs/BACKLOG.md` BL-034, -035, -036, -111, -113, -136, -213; research R1 F12 (R1-S1, R1-S9, R1-S12, R1-S16, R1-S20, R1-S42, R1-S43), R2 theme T18, `docs/research/USER_RESEARCH.md` S7, S26, R3.
