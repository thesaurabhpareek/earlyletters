# F12 Multiple children

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 17 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent |
| Existing IDs | B-REQ-004, B-REQ-005, B-REQ-014, B-REQ-016, B-REQ-020, B-REQ-021, PRD-REQ-011, PRD-REQ-012, PRD-REQ-013, PRD-REQ-014, PRD-REQ-015, C-REQ-012, C-REQ-023, C-REQ-028, DATA-REQ-014; K-12, K-28; D-007, D-008, D-014, D-038; DR-03, DR-04; BL-034, BL-035, BL-036, BL-113, BL-213 |
| Depends on | F03 (first-run batch), F11 (per-child sharing), F13 (reminders per child), F14 (Plus state on the device), F16 (sync of books), F17 (Settings), F20 (support path) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [F] UK mothers reported noticeably fewer photos of a second child (87%), and 92% of them later regretted it (2013, commissioned by a photo studio, directional) [F] UR S7. A younger sibling resents having no book [S] UR S26.
- [S] 4 positive reviews across Qeepsake, BabyPage and Huckleberry praise separate journals per child and twins support [S] R2 section 2.2, theme T18.
- [F] Qeepsake's cheapest paid tier includes 2 journals; Premium has no limit [F] R1-S42. Qeepsake offers twins one shared journal or separate ones [F] R1-S43. A two-child family pays sooner with us than on Qeepsake Essential (R1 F12 note).
- [D] Each child has a separate profile and book; additional books are Plus; children added together in first run are free; joined books never count (D-007, D-008, D-014). Plus is checked on the device only (B2, DR-04).
- [F] The server today still refuses a second book without Plus (`create_child_row` raises `SCPLS` after `has_plus()`) [F] `supabase/migrations/20261003010000_children_and_entitlements.sql` section 5. That file is pending, not applied (`.github/migrations-applied.txt`). B2 removes server enforcement, so a new migration must remove the check.

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P1 with a second child | A newborn and a toddler; the first book is months old | No time; wants the second child's book in 3 taps or fewer (UR R3) |
| P1 with twins or more | First run, on day 1 to 10 | Two names, one date, one free hand; any paywall here reads as a charge for twins (K-12) |
| P3 expecting a second child | Third trimester with a toddler at home | Needs a due-date book next to a born child's book (B-REQ-005) |
| P2 co-parent | Joined the partner's book | Their first own book is still free (D-008) |
| A parent whose child has died | Any time | Needs a quiet way out or support, never product copy about it (B section 1 non-goals) |

## 3. What we are solving

**Outcome.** Every child has their own book, a parent always knows whose book they are writing in, and adding a child never costs a family anything they already had.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Letters saved to the wrong child then moved or deleted within 24 hours | Under 1% of letters [A] | Device event `child_switched{surface: review}` after save is not countable; use support tickets plus beta C1 interviews | Analytics consent; small sample |
| Switch child time | p95 300 ms offline (PRD 7.1, gate) | Device performance run | n/a |
| Families with 2 or more books whose second book has a letter in its first 30 days | 60% or more [A] | Server aggregate (books per family bucket, BL-024) | Synced users only |
| Plus sheet shown in first run | Zero (gate, C-REQ-023) | Automated test | n/a |

## 4. Scope

**In v1.0**
- One profile and book per child (PRD-REQ-011), the switcher (PRD-REQ-012), per-child settings in three scopes (PRD-REQ-013), per-child sharing (PRD-REQ-014).
- The Plus rule for additional books, enforced on the device only (PRD-REQ-015 Rev (B2)).
- Hide and show a book (B-REQ-014); delete a book (B-REQ-016).
- Bring never-synced letters from a local book into a joined book for the same child (F12-REQ-007).
- Change the child of a letter before it first syncs (store rule in `apps/mobile/src/lib/store.ts`: `child_id` changes only while `synced_at` is null).
- Twins and siblings in the first-run batch, up to 6 (D-038, `create_first_run_children`).
- A support path for a family whose child has died, routed to F20.

**Later**
- B-REQ-021 merge a duplicate synced book and move a synced letter: **deferred to v1.1** [R]. Moving a synced letter needs a copy with identical `raw_transcript` and `captured_at` plus a tombstone (B section 6 item 8), which touches immutability, export history and the other parent's view. Duplicates are rare once the first-run branch "My partner already started one" exists (B F1). Hide covers the v1.0 case.
- B-REQ-020 write to several children at once and sibling letters (P1, sibling part behind `child-input`, PRD-REQ-005).
- Multi-book invite picker (P1, PRD-REQ-014).

**Never**
- Charging for a book the family already has. A lapse never closes a book (C-REQ-028).
- A Plus sheet in first run (C-REQ-023).
- Loss language in any string (CLAUDE.md content rules).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Essential: 2 journals; Premium: no limit; no extra cost per journal [F] R1-S42, R1-S16 | 4.9 (15K) | Families with several children like it [S] R1-S1 | **Avoid** matching the 2-journal tier: the founder set the gate at the second started book (D-014). Flag the price gap (Q1) [R] |
| Qeepsake twins | Separate or one shared journal [F] R1-S43 | n/a | n/a | **Match** an explicit twins answer: one book each, free in first run [R] |
| FamilyAlbum | Multiple child profiles [F] R1-S12 | 4.9 (375K) | n/a | Neutral |
| BabyPage | Multiple children's profiles [F] R1-S9 | 4.8 (4.1K) | n/a | Neutral |
| From, Mama | Timeline by child [F] R1-S20 | 4.9 (48) | n/a | **Innovate**: "To {child}" always visible while recording and in Review [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Where |
|---|---|
| "For {child}" switcher atop Tonight and Book (`children.switcher.label`) | `apps/mobile/src/components/child/child-switcher.tsx` (exists) |
| "Whose book?" sheet with Add a child and Hidden books | `apps/mobile/src/components/child/whose-book-sheet.tsx` (exists) |
| "To {child}" in Listening and Review (`children.switcher.toLabel`, `changeLink`) | Capture and Review (F04, F06) |
| Settings > Children > {child}'s book (`children.settings.*`) | Settings (F17) |
| First run "Add another child" (twins and siblings) | F03 |

### 6.2 Happy path

#### A. Add a second child after first run

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps "For Asha", then Add a child | `children.add.title`, `children.add.body`, `children.add.twinsHelp` | Calls `decide({feature: 'start_book', ...})` in `packages/core/src/plan.ts` with `startedBooks` from `countStartedBooks` (both exist) |
| 2a | Has Plus on this device, or has started no book yet | Name and birthday or due date form (`add-child-form.tsx`, exists) | Allowed |
| 2b | Free, one started book | Plus gate (`childrenExtra.plusGateTitle`, `children.add.plusNote`, `children.add.joinedNote`, `children.add.keepNote`) at the third tap (B-REQ-004) | Offer, unless first run, birthday, offline or contributor (`decide` returns quiet) |
| 3 | Saves the child | The new empty book (`book.empty.bookTitle`) | Local row with a UUIDv7 id; `create_child` op in the outbox (F16). The server never refuses it for Plus (F12-REQ-002) |
| 4 | Records | "To {new child}" visible | Letter files to the new book |

#### B. Twins in first run
F03 owns the form. Each child gets a book. The batch is sent once through `create_first_run_children` (1 to 6, exists) at sign-in; every book in it is free and counts as started afterwards (PRD-REQ-015).

#### C. Switch
Tap "For {child}", pick a book. The last opened book is remembered per device (`settings.activeChildId`). With one book, the name shows with no chevron (PRD-REQ-012). Hidden books appear only under Hidden books.

#### D. Hide and show
Settings > {child}'s book > Hide this book (`children.settings.hideLabel`, `hideBody`). Parents only (`children_guard`, exists). Sets `children.hidden_at`; every member's device drops reminders, month, birthday and celebration notifications for that child within one sync (B-REQ-014). Letters stay readable from Hidden books and exportable. Show this book again clears it.

#### E. Delete
Settings > {child}'s book > Delete the book. Sole parent: `request_book_deletion` schedules the book, 30-day restore (`settings.delete.bookBody`, `bookUndo`, `bookTypeToConfirmLabel`). With a co-parent: leave and remove own letters (`settings.delete.bookBodyCoParent`), per B-REQ-016 and DATA-REQ-014. Export is offered first (`settings.delete.bookExportFirst`).

#### F. Bring local letters into a joined book (F12-REQ-007)
When a person joins a co-parent's book (F11) and has a local book for what may be the same child with letters never synced, one sheet asks "Bring your letters into {child}'s book?" with Keep them separate as the default. Bring moves `child_id` on those never-synced rows and their drafts in one local transaction, then removes the empty local book. Synced letters are never moved at v1.0.

#### G. A child who has died
No product copy about it, ever (B section 1). Settings > Help shows the existing support row (F20). Support offers, through the runbook: hide the book, stop every notification for it, export, or delete; and pauses celebrations for both parents. F20 owns all wording. F12 only guarantees the actions exist: hide (B-REQ-014), pause celebrations (C-REQ-012), export (LEGAL-REQ-034), delete (B-REQ-016).

#### Per-child settings (PRD-REQ-013, K-12)

| Scope | Settings | Who changes | Stored |
|---|---|---|---|
| Book (shared) | Name, nickname, birthday or due date, photo, book look, hide, delete (book deletion through `request_book_deletion`) | Parents | `children` (exists; `children_guard` blocks non-parents) |
| Person, per child | Sign my letters as, include in my reminders, pause celebrations, co-parent letter notifications (F11) | Each member | `child_member_prefs` (exists; `notify_letters` new in F11) |
| Person, all children | Reminder cadence and time, languages, reading size, analytics | Each member | Profile and device settings |

"Family can read" stays in the schema and is hidden at v1.0 (B1).

#### The Plus rule (PRD-REQ-015 Rev (B2, DR-04))
1. A person may start one book free. Starting another needs Plus on this device (`Transaction.currentEntitlements`, F14), when the person already started a non-deleted book (`children.created_by` = them; hidden counts).
2. Every child in the first-run batch is free (D-007).
3. Books joined as a co-parent never count (D-008).
4. A lapse never closes a book: every existing book stays writable, readable and exportable (C-REQ-028). Only starting another needs Plus.
5. Enforcement is on the device only. The server accepts any `create_child` from a consented user. A modified client can bypass the rule; accepted cost (DR-04).
6. Plus reaches a co-parent only through Apple Family Sharing (DR-03); a co-parent outside that family follows rule 1 on their own phone.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F12-U01 | Offline when adding a child | Local book created; op queued (F16) | New book at once; "Not sent yet" in Settings > Sync (F16) | Automatic | Integration |
| F12-U02 | Offline at the Plus gate | `decide` returns quiet `offline` | `childrenExtra.plusNotYet` style line: try again online | Retry online | `plan.ts` tests (exist) |
| F12-U03 | Plus lapsed with 3 books | All 3 stay open; Add a child shows the gate | Gate only on Add | Resubscribe | `[C-REQ-028] lapsed user keeps all books writable` |
| F12-U04 | Book made offline while Plus was on; Plus ended before sync | Server accepts (no server check) | Nothing changes | n/a | `[F12-REQ-002] server accepts second book without Plus` |
| F12-U05 | Seventh child in first run | Add another hidden at 6 (F03-U05) | No button | Add later here | F03 test |
| F12-U06 | Same child id sent twice (retry) | `create_child` idempotent on id (exists) | One book | n/a | `[A-REQ-015] create_child idempotent` (exists) |
| F12-U07 | Recording, then wrong child noticed in Review | "Write to another child" changes the draft child before save | "To {child}" updates | n/a | `[PRD-REQ-012] review child change saves to chosen child` |
| F12-U08 | Wrong child noticed after save, letter not yet synced | Letter menu offers Move to another child | Moves | n/a | Unit: move allowed while `synced_at` null |
| F12-U09 | Wrong child noticed after sync | No move at v1.0 | Copy the text into a new letter to the right child; delete the old one (Recently deleted keeps it 30 days) | v1.1 move (B-REQ-021) | Manual |
| F12-U10 | Hidden book with a birthday today | No birthday note or card for anyone | Nothing | Show again | `[B-REQ-014]` (PRD 6.2 checklist) |
| F12-U11 | One parent hides, the other expected reminders | Hide is book-level, by design | Book under Hidden books for both | Either parent shows it | Integration |
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

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| PRD-REQ-011 | P0 | One profile and book per child; nothing about one child is readable through another child's book | Given Asha and a sibling, When any pull or query runs for Asha, Then no sibling row, member or photo appears (cross-child leak test, F16-REQ-008) | PRD, K-12 |
| PRD-REQ-012 | P0 | Switcher on Tonight and Book; "To {child}" in recording and Review, changeable before save; last book per device; no chevron with one book | Given two books, When recording, Then "To {child}" is visible; switch p95 300 ms offline on iPhone SE 3 | PRD |
| PRD-REQ-013 | P0 | Per-child settings in three scopes, each row 2 taps or fewer from Settings | Given Settings, Then every row in the 6.2 table is reachable in 2 taps; one parent's "pause celebrations" leaves the other's on | PRD, K-12 |
| PRD-REQ-014 | P0 | Sharing is per child; an invite names one child | Given an invite to Asha, Then the joiner sees no other book (F11) | PRD |
| PRD-REQ-015 Rev (B2, DR-04) | P0 | One free started book; more need Plus on the device; first-run batch free; joined books never count; lapse never closes a book; the server never enforces Plus | Given a Free user with one started book, When Add a child, Then the gate shows at the third tap. Given a modified client, Then the server accepts the book. Given a joined book and none started, Then Add a child needs no Plus | PRD, B2, DR-04, D-007, D-008 |
| B-REQ-004 | P0 | Multiple children; switcher; "To {child}" | As PRD-REQ-012 | B |
| B-REQ-014 | P0 | Hide stops every child-anchored notification for every member within one sync | Given Asha hidden on A's phone, When B's phone syncs, Then no reminder, month, birthday or celebration for Asha is scheduled on B's phone | B |
| B-REQ-016 | P0 | Only a sole parent deletes a book; 30-day restore | As DATA-REQ-014 (exists) | B, K-10 |
| B-REQ-021 Rev | P1 (v1.1) | Merge duplicate synced books and move synced letters move to v1.1 | Given v1.0, Then no UI moves a synced letter between books | B, this spec |
| C-REQ-023 | P0 | No Plus sheet in first run, at launch, during recording or export, or on a birthday | Given first run with 3 children, Then zero Plus sheets and zero purchase calls | C, K-12 |
| C-REQ-028 | P0 | Lapse keeps every book writable | Given a lapsed user, Then write, read, play, export work in all books | C |
| F12-REQ-001 | P0 | The gate decision comes only from `decide()` in `packages/core/src/plan.ts` with `startedBooks` from `countStartedBooks` over local `children` rows where `created_by` is the user and the book is not deleted (hidden counts) | Given table tests over 12 cases (first run, joined only, lapsed, Plus, offline, birthday, contributor), Then decisions match the 6.2 rule list | D-007, D-008, BL-036 |
| F12-REQ-002 | P0 | A new migration replaces `create_child_row` so it never raises `SCPLS`, and `create_child` no longer reads `has_plus` | Given a consented user with one started book and no store rows, When `create_child` runs, Then the book is created. Given the migration source, Then no function in `create_child` paths references `has_plus` | B2, DR-04 |
| F12-REQ-003 | P0 | The client never discards a book for any server answer; permanent refusals go to `rejected_writes` and the book stays local and exportable (F16) | Given a forced `SCCID` on create, Then the book and its letters stay on the phone with "Not sent yet" | D-038, DATA-REQ-043 |
| F12-REQ-004 | P0 | Local `children` keeps only book-level columns; per-person columns (`signs_as`, `reminders_on`) move to a local `child_member_prefs` table in a new local migration | Given a v3 database, When migrated to the next version, Then each child's `signs_as` and `reminders_on` exist in `child_member_prefs` and the old values are not lost | TDD 01 3.2.2, TDD 02 3.4 |
| F12-REQ-005 | P0 | Hide is parents only and book-level; Show again restores everything | Given hide then show, Then reminders reschedule on every member's phone within one sync | B-REQ-014 |
| F12-REQ-006 | P0 | Move a letter to another child only while it has never synced | Given a synced letter, Then the Move action is absent; given an unsynced one, Then the move updates the row and its draft in one transaction | `store.ts` rule, DATA-REQ-040 |
| F12-REQ-007 | P0 | On joining a book, offer to bring never-synced letters from a local book; default Keep them separate | Given 4 unsynced letters in a local book, When Bring is chosen, Then all 4 file to the joined book and the empty local book is removed in one transaction; a crash mid-way changes nothing | B F5 edge, F11-U17 |
| F12-REQ-008 | P1 (v1.1) | Move synced letters and merge books (B-REQ-021) | Deferred | B |
| F12-REQ-009 | P0 | Support path for a child who has died: F20 lists the actions; no product string mentions it | Given the content test, Then no string contains loss language; given the F20 runbook, Then hide, pause, export and delete are listed | B section 1, F20 |
| F12-REQ-010 | P0 | Reminders rotate across included children; a child is named only if included (K-12) | Given 2 included children, Then 4 consecutive reminders name each child twice | K-12, F13 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| `children` row (name, nickname, birthday or due date, photo path, look, hidden) | L4 for name and dates | Device, Postgres | Members (`children_member_select`); contributors get name, nickname, month and day only when they return (D-039) | Until book deletion plus 30 days |
| `children.created_by` | L3 | Device, Postgres | Members | Nulled at the creator's account deletion (DATA-REQ-012) |
| `profiles.first_run_closed_at` | L2 | Postgres | Owner (server-owned, `profiles_guard`) | Life of account |
| `child_member_prefs` | L3 | Device, Postgres | Owner | Cascades on leave |
| Active child setting | L3 | Device only | Device | Install |

The child's name never goes into analytics; children appear only as `child_ordinal` and `child_count_bucket` (PRD-REQ-016). Plus state never leaves the device (B2).

## 9. Non-functional requirements

| Item | Budget | Gate |
|---|---|---|
| Switch child | p95 300 ms offline, iPhone SE 3 (PRD 7.1) | Yes |
| Add a child to Plus sheet with cached prices | Under 1 s (PRD 7.1) | Yes |
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
| `plus_offer_viewed` | `trigger` (the second-book value of `PLUS_TRIGGER`), `arm` | How often does the book gate appear? |

Consent-gated; L2 only.

## 11. How we build it (with the architect)

| Part | Files | Notes |
|---|---|---|
| Rules | `packages/core/src/plan.ts` (exists: `decide`, `countStartedBooks`) | No change to the rule; add table tests for the 6.2 list |
| Local schema | `apps/mobile/src/lib/db/migrations.ts` (exists): new version adds local `child_member_prefs`, `children.created_by`, `children.first_run_batch` (TDD 01 3.2.2) | Append-only; never edit a shipped step |
| Server | New migration `supabase/migrations/20261012030000_create_child_no_plus.sql` (indicative; data architect sets the timestamp) replacing `create_child_row` and `create_child` without the Plus check | Coordinate with F14, which removes the store tables (B2) |
| UI | `apps/mobile/src/components/child/*` (exist), `apps/mobile/src/app/settings/` | Replace `newChildNeedsPlus()` in `store.ts` with `decide()` |
| Sync | Children and prefs sync through F16 | `children` pulled with the book |

Riskiest unknown: the local schema split (F12-REQ-004) on installs with real letters. The migrator test opens each historical schema fixture (TDD 10 section 3).

## 12. Work packages

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F12-01 | Server: drop Plus check from `create_child` | Data architect | New migration, `supabase/tests/children_entitlements.test.mjs` | BL-113 pack in staging | `[F12-REQ-002]`; existing idempotency and first-run tests green | Agent, `approve-migration`. BL-213 |
| WP-F12-02 | Local schema split | Mobile engineer | `apps/mobile/src/lib/db/migrations.ts`, its test | BL-111 | `[F12-REQ-004]` on v1, v2, v3 fixtures | Agent. BL-136 |
| WP-F12-03 | Gate wiring to `decide()` | Mobile engineer | `apps/mobile/src/components/child/plus-gate.tsx`, `use-children.ts` | WP-F12-02, F14 plan module | `[F12-REQ-001]`, `[C-REQ-023]` | Agent. BL-036 |
| WP-F12-04 | Switcher and Review child change | Mobile engineer | `child-switcher.tsx`, `whose-book-sheet.tsx` | WP-F12-02 | `[PRD-REQ-012]`; switch p95 300 ms | Agent. BL-034 |
| WP-F12-05 | Per-child settings, hide, show, delete | Mobile engineer | `apps/mobile/src/app/settings/` child pages | WP-F12-04 | `[PRD-REQ-013]`, `[F12-REQ-005]`, `[B-REQ-016]` | Agent. BL-035 |
| WP-F12-06 | Move unsynced letter; bring local letters on join | Mobile engineer | `apps/mobile/src/lib/store.ts` (move function), join sheet | WP-F11-06 | `[F12-REQ-006]`, `[F12-REQ-007]` crash test | Agent |
| WP-F12-07 | Hide propagation to notifications | Mobile engineer | F13 planner inputs | F13 planner | `[B-REQ-014]` two-device test | Agent |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 A two-child family pays sooner with us than on Qeepsake Essential (R1-S42). Keep the gate at the second started book? | Founder, 23 Oct | `plan.ts` rule and store copy |
| Q2 Defer B-REQ-021 merge and move to v1.1 | Founder, 23 Oct | WP-F12-06 scope |
| Q3 Should a co-parent be able to hide a book for themselves only? Today hide is book-level | Founder, 30 Oct | New per-person column |

| A | Assumption | Validate |
|---|---|---|
| A1 | Duplicate books for one child are rare with the first-run branch | Count books per child name per family in C1 support notes |
| A2 | Modified clients bypassing the gate cost little (DR-04) | ASC trial starts vs books per family aggregate |

## 14. Sources

`docs/prd/v2/_AUTHORING.md` (B1, B2); `09-decisions-and-risks.md` DR-03, DR-04; `docs/DECISIONS.md` D-007, D-008, D-014, D-038, D-039; `docs/prd/PRD.md` K-12, K-28, PRD-REQ-011 to -016, 6.8, 7.1 to 7.3; `docs/prd/B-first-run-and-family.md` F1, F2, B-REQ-004, -005, -014, -016, -020, -021, section 6; `docs/prd/C-habits-pricing-settings.md` C-REQ-012, -023, -028; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-012, -014; `docs/tdd/01-mobile-client.md` 3.2.2, 3.2.3; `docs/tdd/02-sync-backend.md` 3.4; `docs/tdd/10-red-team-critique.md` section 3; `supabase/migrations/20261002020000_data_governance.sql`, `20261003010000_children_and_entitlements.sql`; `.github/migrations-applied.txt`; `apps/mobile/src/lib/store.ts`; `apps/mobile/src/lib/db/migrations.ts`; `apps/mobile/src/components/child/`; `packages/core/src/plan.ts`; `packages/content/src/strings.en.ts` (`children.*`, `childrenExtra.*`, `settings.delete.*`); `packages/analytics/src/catalog.ts`; `docs/BACKLOG.md` BL-034, -035, -036, -111, -113, -136, -213; research R1 F12 (R1-S1, R1-S9, R1-S12, R1-S16, R1-S20, R1-S42, R1-S43), R2 theme T18, `docs/research/USER_RESEARCH.md` S7, S26, R3.
