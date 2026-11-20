# Information architecture audit: Home, Book, Me, and one owner per fact

Status: DRAFT for Karma and the founder, 20 Nov 2026 (UTC). Author: `design-systems`. Brief: `docs/product/prd/tools/review/wave3-briefs.md` item 4, answering `docs/product/prd/20-founder-direction-20nov.md` section 5 (which names candidates to test, not conclusions). Branch `docs/e2e-ux-20nov`, worktree `/home/claude/wt/E`, HEAD `ed44fe899`. Not committed. Changes no card, no token, no code.

Tags: EVIDENCE = read in this worktree this session (file and line). INFERENCE = my reading of evidence, not run. UNVERIFIED = not checked. Nothing here was run on a device or in the simulator; no test was executed.

## 0. What I read, and what I did not

Read in full or in the parts that matter: the five area `DESIGN.md` files (screen inventories, Home, Book, Me, Reminders, Plan and permission screens, integration maps), `docs/design/system/COMPONENTS.md` (section list, C9 Home slip host, F-series), `docs/design/system/AUDIT.md` (first 60 lines), `docs/design/e2e/BRIEF.md`, `docs/design/IA.md` (dated 31 Oct, stale: it still has a Settings gear on the Book and no Me sections), the founder direction and the gap-agent rules. In code: `apps/mobile/src/app/settings/index.tsx`, `app/(tabs)/index.tsx` (the parts that compute Plus, days since, and the slip), `app/write.tsx` (same), `lib/reminders/*`, `lib/billing/{gates,plan-reminders.logic,use-plan}.ts`, `components/book/{chapters,book-page.logic,shelf.logic}.ts`, `lib/dates.ts`, `lib/store.ts` (Quiet and Hide), `lib/asks/next-ask.logic.ts`.

Not read: the five `WORDS.md`, `MOTION.md` and prototypes; the locked cards beyond the row ids the DESIGN files cite (so card row numbers below are as cited by the design files, not re-read in the cards); `docs/design/NOTIFICATIONS.md`; most of `apps/mobile/src` (I searched by pattern, so a duplicate I did not grep for is missing from section 7); the Book tab's code (`book.tsx`, 522 lines); other branches (PRs #837 to #840 hold the picture code and are not in this worktree). I did not read any user research: there is none cited for IA, so every "verdict" is a design judgement to be tested (section 10).

## 1. Verdicts in brief

1. Home and Book hold almost no duplicated information. The one shared object is a past letter on Home (slip 4) that is a letter from the Book. That is a surfacing, not a copy. The real duplicates are not between Home and Book. They are (a) several doors to one function (Save a copy has six, Quiet and Hide two, the reminder permission ask two), (b) one fact rendered two ways (the age line), and (c) computed twice in code (section 7).
2. Me is not too long by count (about 22 rows in 9 groups for a signed-in one-book store build, section 4) but it mixes five jobs and is about to gain two more (Days we mark, cultural background). It needs regrouping more than pruning. I propose three moves and no deletions.
3. Home is not too thin to be the default tab. It has one job, 5 content elements and 4 capture controls (section 5). The risk is a stale second visit (only the prompt changes), not emptiness. NS-50's "strip" should be the existing single Home slip slot (COMPONENTS C9) with one more rank, not a second list, because a strip of up to four things is a feed, which the frame forbids.
4. NS-46 Days we mark must not create a second list of days. NS-18 already draws "Days to remember" inside Me > Reminders (D-S06). One list, one add flow, one page.
5. One finding is a behaviour gap, not a duplicate: "Quiet this book" is stored (`Child.quiet`, `store.ts:390`) but I find no reader in the reminders planner or the prompt selection (section 7, X6). That is BL-985's job; flagged so the design is not blamed for a switch that does nothing.
6. Two functions named `monthDay` mean different things, and month-of-age date arithmetic exists twice outside `packages/core`. Seven further duplicated computations are in section 7.

## 2. Object-by-screen matrix

Codes: O = owns the data and the rules; W = writes it (the parent changes it here); R = reads or shows it; A = an action on it (no data change by itself); - = not present. Screen ids are from the five DESIGN files. A cell with more than one W is a double door and is judged in section 3.

### 2.1 Content objects

| Object | Home A-S01 | Capture A-S04 to A-S12 | Book B-S01 to B-S20 | Me C-S01 to C-S22 | Family and reminders D | Foundations E |
|---|---|---|---|---|---|---|
| Letter words | - | O, W (Review A-S07, Write A-S06) | R (cards B-S01, page B-S08, Read together B-S19, Find B-S06); W only "add more" (NS-19, not drawn) | R (Recently deleted C-S17, export C-S04) | R (Share preview D-S02) | - |
| Letter day (`occurredOn`, precision) | R (dateline uses today, not this) | W (A-S08 Day sheet) | W (B-S09, the same sheet), R (openers B-S01) | - | - | - |
| Picture on a letter | A (Start from a photo) | W (A-S03, A-S07, A-S12) | W (B-S11), R (Photos lens B-S04, page B-S08) | R (C-S17 returns with its letter) | R (D-S02 stored copy) | - |
| Recording (audio) | - | O, W (A-S05) | R (player on B-S08) | R (C-S09 provenance, C-S08, C-S18 stuck, C-S21 backup) | - | - |
| Draft or held letter | R, A (slip 1: Pick it up) | O, W (A-S07) | - | R (C-S18 stuck recording) | - | R (E-S19 recovery) |
| Who can read it (Private) | - | W (A-S07) | W (B-S10) | - | R (D-S01 Share absent when private) | - |
| First mark and label | - | W (A-S07) | W (B-S12), R (Firsts lens B-S05) | - | - | - |
| Seal (hide until a day) | R (slip 2, B-S18) | W (A-S07) | W (B-S13), A (B-S14 Open now), R (B-S16) | R (C-S17, C-S20 line) | - | - |
| Quiet-day mark (Not much today) | W (D-S21) | - | R, W (B-S22 row, Remove this mark) | - | - | - |
| Past letter | R, A (slip 4, B-S17) | - | O (the letter lives here) | W (B-S21 switch, "Past letters on Home") | - | - |
| Deleted letter | - | - | W (B-S15 delete, Undo) | O, W (C-S17 Restore, Erase now) | - | - |

### 2.2 People, books and status

| Object | Home | Capture | Book | Me | D | E |
|---|---|---|---|---|---|---|
| Child name, birthday, due date | R (dateline) | R (headers) | R (age line, openers) | O, W (C-S15 edit; Add a book form) | R (notification text) | W (E-S08 first-run form) |
| "Signs as" (the writer's name) | - | W (A-S07 From for self), A-S09 is another speaker | R (byline B-S08) | W (C-S15 row) | - | W (E-S08 signsAs) |
| Active book (selection) | W (A-S02 switcher) | R | W (B-S01 row 3 switcher) | - | - | R (E-S18 reset) |
| Book state: Quiet | - | - | W (B-S02 More) | W (C-S15 switch) | R (should be read by the planner, X6) | - |
| Book state: Hidden | - | - | W (B-S02), R (B-S01.hiddenReadOnly) | W (C-S15), R, W (C-S16 Show again) | - | - |
| Other parent and invites | - | R (A-S09 names on this phone) | - | W (D-S12 row) | O, W (D-S13 to D-S19) | - |
| Account and sign-in | - | - | - | O, W (C-S01 card, C-S02) | - | O, W (E-S04 to E-S07, E-S24) |

### 2.3 Plan, reminders, days

| Object | Home | Capture | Book | Me | D | E |
|---|---|---|---|---|---|---|
| Plan state and the free allowance | R (Plus line E-S26) | R (Write's Plus line; Keep gate at Keep) | - | R (Plan row) | R (D-S24 line) | O, W (E-S10 gate, E-S11 Plan, E-S12 confirmed), R (E-S25 note) |
| Evening reminder preferences | - | - | R, A (D-S04 asks over the Book) | W (D-S06 page), W (C-S15 per-book "Include in reminders") | O, W (D-S04 ask, D-S06) | W (E-S12 ask, a second ask for a different notification) |
| Month and birthday notes | - | - | - | W (D-S06 switch), W (C-S15 Quiet) | O | - |
| Typed days (NS-18) | R (D-S11 landing line) | - | - | W (D-S06 "Days to remember" section) | O, W (D-S08, D-S09) | - |
| Notification permission | - | - | - | R (D-S06 denied card) | W (D-S04 triggers iOS prompt) | W (E-S12 ask triggers it too), R (E-S28 map) |
| Plan reminder notices | - | - | - | R (D-S24) | - | O (E-S25) |

### 2.4 Keeping, language, system

| Object | Home | Capture | Book | Me | D | E |
|---|---|---|---|---|---|---|
| Save a copy (the export) | A (slip 3, C-S06) | - | - | A (C-S04 row, the screen) | - | A (E-S12 "Save a copy" line; E-S01 recovery export), A in C-S19 Erase card, A in C-S20 Delete account card |
| Where letters live and recording place | - | - | R (provenance B-S08 via C-S09) | O (C-S08), R (C-S18 Storage) | - | R (claims in E-S27) |
| Spoken language and speech downloads | - | W (A-S10 Another language on Review) | - | W (Spoken language row), W (C-S18 downloads, cellular) | - | W (E-S08 languages, multi-language builds only) |
| Word for word setting | - | R (A-S07 views) | - | W (Your words) | - | - |
| Appearance | - | - | - | O, W (E-S21 is in Me) | - | - |
| App lock | - | - | - | W (C-S01 row) | R (D-S06 `.appLock`) | O (E-S22 cover) |
| Storage and space | - | R (E-S17 low-storage lines) | - | O (C-S18) | - | R (E-S17 rules) |
| Erase, Delete account, Delete this book | - | - | - | O (C-S19, C-S20, C-S22) | - | R (E-S18 second account) |
| Help, If you are struggling, Legal, About | - | - | - | O (one place each) | - | - |

### 2.5 Reading the matrix

- Single owner, single door (healthy): letter words, recording, draft, first, seal, quiet-day mark, appearance, help, legal, About, recently deleted (door in Me; the Undo is in the Book), the plan engine.
- Several W doors to one value, by design (judged in section 3): active book (2), Quiet this book (2), Hide this book (2), letter day (2, one component), picture on a letter (3, one component), Who can read it (2), reminder permission (2 asks), child details (3 forms), spoken language (3 screens), per-book notes (3 switches).
- Several A doors to one export: Save a copy (6).
- Me owns 24 of the 40 rows above that have an owner; Home owns none (it reads and starts). That is the shape the direction asks for: Home = start and today, Book = read, Me = look after.

## 3. Duplicates and double doors

Each row: evidence, verdict (KEEP / MERGE / MOVE / DELETE / TEST), what to change, cards and backlog it touches. "Cards" are the ids the DESIGN files cite.

| Id | What | Evidence | Verdict and change | Cards, backlog |
|---|---|---|---|---|
| D-01 | Save a copy has six doors: Me row (C-S04), Home slip in the birthday week (C-S06), a card inside Erase (C-S19), a card inside Delete account (C-S20), a line on Plus confirmed (E-S12), launch recovery export (E-S01) | C-S01, C-S06, C-S19, C-S20, E-S12 in the DESIGN files; built `export.tsx:182` has a `lastExport` line | KEEP all: five are "before you lose it" prompts that the cards lock (G4, D6). MERGE the implementation into one `SaveCopyOffer` component and one status source (`lastExport`), so each door says the same thing and the Home slip shows only when a copy for that year has not been made. No door deleted | NS-11-R1 to R4, R22; NS-36; D6; BL-942 |
| D-02 | Quiet this book and Hide this book at two doors: Book "More for this book" (B-S02) and the book's page in Me (C-S15) | B-S02, C-S15; both call `setChildQuiet` and `hideChild` (`store.ts:381, 390`) | KEEP both: one function, no second state; the parent who is reading wants it in the Book, the parent who looks after wants it in Me. Ruling already in NS-22-R3 | NS-22-R3, R7; F12-REQ-011; BL-985 |
| D-03 | Three switches steer which notes a book receives: Me > Reminders "Month and birthday messages" (global), the book's "Include {child} in my reminders", and the book's "Quiet this book" | D-S06, C-S15, `prefs.ts:116` maps `included: c.remindersOn` only | TEST a MOVE: show a "Notes for each book" group on the Reminders page, one row per book with its include switch; keep Quiet in the book where it also stops prompts. Fewer places to find "why did Asha's book stop getting notes" | NS-13-R31; NS-22-R3; D-S06; C-S15 |
| D-04 | Two asks can raise the one iOS notification prompt: the evening reminder ask (D-S04) and the "Remind me before" ask on Plus confirmed (E-S12.withAsk) | E-S28 table says both | KEEP the two reasons, MERGE the gate: `nextAsk` in `lib/asks/next-ask.logic.ts:54` already owns the reminder_prime slot and a cap of 2 (`:20`); the Plus ask must go through it so a parent is never asked twice for one system permission. Verify the Plus ask does (UNVERIFIED) | NS-13 door lines; NS-32-R4; E-S12 |
| D-05 | Age line shown four ways: Home dateline "ASHA . 7 MONTHS AND 1 WEEK" (`ageText`, `dates.ts:101`), Book cover band "7 months" (`coverAge` zeroes weeks, `book-page.logic.ts:18`), Review "To Asha . Month 7", Write's own `writeDateline` | `dates.ts:101-105`, `book-page.logic.ts:13-22`, `prompt.logic.ts:33-36`, A-S01, B-S01 | TEST then MERGE: same fact, two precisions in one session. Decide one rule (my lean: months only on Book, months and weeks on Home and Review, written down as one `ageLine(child, today, {weeks})` function in core) and stop calling it by three names. Karma to rule | NS-22-R1; frame; BL-946 |
| D-06 | Past letter on Home (slip 4) and a switch for it in Me (B-S21) | B-S17, B-S21; NS-23-R4 | KEEP (card-locked). MOVE the switch into the "Home" group of Me proposed in section 4 so it sits beside Days we mark; it is a Home preference, not a "Writing" one | NS-23-R4; B-S21 |
| D-07 | Spoken language is split: the Me row (language page) and Storage "speech languages, downloads, cellular" (C-S18) | C-S01, C-S18; IA.md says English only in the store build, so the language page is a single choice there | MERGE downloads into the Spoken language page; Storage keeps space and stuck recordings. HIDE the Spoken language row in English-only builds unless NS-17 ships a second language (an option list with one entry is a dead row) | NS-17; NS-09-R6; C-S18; E-S08 languages |
| D-08 | Child details have three forms: the first-run form (`onboarding.tsx` inline, with `DateField`), `AddChildForm` (Add a book), and per-field editors in `child-editors.tsx` (C-S15) | `onboarding.tsx:482`, `add-child-form.tsx:32`, `child-editors.tsx:37`; all use core's `checkChildName`, `checkSignsAs`, `checkBirthday` | KEEP the rules (they are in core once). MERGE the first-run form and `AddChildForm` into one component with a first-run variant; editors stay (editing one field is a different job) | E-S08; NS-14; BL-941 |
| D-09 | Plan appears in seven places: Me Plan row, E-S11, Home Plus line, Write's Plus line, Keep gate, Plus confirmed, plan reminder note (and D-S24's line) | E-S10 to E-S12, E-S25, E-S26, D-S24 | KEEP: each is a different moment (browse, nudge, gate, confirm, remind). The line on Home and on Write is the same line, computed twice in code (X3). No surface removed | E-S10 to E-S12; NS-32-R4; D-083 |
| D-10 | Typed days (NS-18, "Days to remember" inside Reminders) and the coming library of days (NS-46, "Days we mark") would be two lists with two add flows | D-S06 bottom section; direction section 3.1 says a chosen day "becomes a typed day" | MERGE before NS-46 is written: one page, "Days" (name for content to rule: "Days to remember" or "Days we mark", not both), reached from one row in Me and from one row on Reminders. Sections on it: Yours (typed days), then Suggestions by layer (seasonal, family, civic, traditions). Typed days leave the Reminders page, which is already 13 elements long | NS-18-R1 to R8; NS-46 (proposed); D-S06, D-S08, D-S09 |
| D-11 | Where letters live (C-S08), the Privacy page, the provenance line (C-S09) and App lock say overlapping things about "kept on this phone" | C-S08, C-S09, claims in E-S27; built `privacy.logic.ts`, `where-live.logic.ts` | TEST: one "Where your letters live" page that holds the Privacy text, reached from Me; the policy and terms stay under Legal. Counsel/compliance must see any merge of claim text (claims are registered) | NS-08-R7, R8, R20; NS-10 claims; LEGAL-REQ-014 |
| D-12 | Two switchers for the active book: Home (A-S02) and the Book header (B-S01 row 3) | A-S02, I6 in COMPONENTS | KEEP: same component, same store write (`ChildSwitcher`, `surface: 'home'`); the cost is one more control on each tab with two books only | NS-14-R1, R2 |

No duplicates found between Home and Book content beyond D-06 and D-05. I looked specifically for month and birthday lines on Home (the direction's candidate): they are notifications (D-S10, `monthAge`, `birthday`) and the Book's month openers; Home has neither. The candidate is not present in the designs.

## 4. Me: is it overloaded?

### 4.1 Count (EVIDENCE: C-S01 layout, signed in, one book, store build, nothing hidden)

| Group (as drawn) | Rows |
|---|---|
| (header) | Account card, Plan: 2 |
| Books | the book, Add a book: 2 (plus one per extra book, plus Hidden books while one is hidden) |
| Writing | Spoken language, Your words, Reminders, Past letters on Home (toggle), Appearance: 5 |
| Keeping your book | Save a copy, Where your letters live: 2 |
| Your letters | Recently deleted, Storage, Erase (only when signed out or never signed in): 2 to 3 |
| Privacy and security | App lock, Privacy: 2 |
| (own section) | Delete account: 1 |
| Help and legal | Help, If you are struggling, Legal: 3 |
| About | version: 1 |

About 20 to 22 rows in 9 groups. One screen at default type is about 8 rows, so about three screens of scrolling on an iPhone SE 3; at AX5 it is many more because rows stack title over value. The built file (`app/settings/index.tsx`) has the same groups with "Your letters" holding the export row and no "Past letters on Home" row yet (EVIDENCE: `:150-200`).

### 4.2 Why it feels overloaded (INFERENCE)

1. It is five jobs under one heading: who I am (account, plan), whose book (books), how I write (language, words, appearance), when we are nudged (reminders, past letters, soon days), and keeping safe (copy, where, deleted, storage, lock, privacy, erase, delete). "Writing" already holds Reminders and a Home toggle, which are not writing.
2. Safekeeping is spread over four groups (Keeping your book, Your letters, Privacy and security, and the lone Delete account), so a parent asking "how do I keep this safe" has four places to look.
3. Two proposed items arrive: Days we mark (NS-46) and cultural background (NS-47, which direction section 3.4 places inside the days page, not in Me's top level; I keep it there).

### 4.3 Proposed arrangement (candidate for a tree test, not a ruling)

| Group | Rows | Change from the DESIGN files |
|---|---|---|
| (header) | Account card, Plan | none |
| Books | each book, Add a book, Hidden books (only while one is hidden) | none |
| Writing | Spoken language (hidden in English-only builds), Your words, Appearance | Reminders and Past letters on Home leave |
| Notes and days | Reminders, Days (NS-18 plus NS-46, one page), Past letters on Home | new group; takes three rows; "Notes and days" is a working title, content to name it |
| Keeping your book | Save a copy, Where your letters live, Recently deleted, Storage | Storage moves up from "Your letters"; the group absorbs the old "Your letters" |
| On this phone | App lock, Privacy | the old "Privacy and security" without Delete account |
| (untitled, last, destructive) | Erase everything on this phone (when it applies), Delete account | Erase and Delete account sit together at the end |
| Help and legal | Help, If you are struggling, Legal | none |
| About | version | none |

Net: 9 groups to 9 groups, 0 rows deleted, 3 rows moved to a group of their own (Reminders, Days, Past letters on Home), 2 destructive rows brought together, 1 row made conditional (Spoken language). Cards touched: NS-11-R1 (Save a copy is still one row), NS-13, NS-18, NS-23-R4, NS-22-R3 (unchanged), D1 and D6 (Delete account's placement "own section" is kept in spirit: still its own group, now with Erase), NS-36 erase row, BL-927/928 (heading), BL-961 (Erase after sign-out).

Risk: a group titled with a destructive pair at the end must not read as a warning or use loss language (content rules). The rows keep their built labels; the group has no title.

### 4.4 What I would not do

- Not delete any Me row. Every row maps to a card or a claim.
- Not nest settings inside Settings (a "More" page). One tap to any of them stays (NX-30a in IA.md).
- Not put cultural background at the top level of Me. It lives on the Days page under a heading the parent reaches only by choosing to browse traditions (direction 3.3, 3.4).

## 5. Home: is it too thin to be the default tab?

### 5.1 What Home holds (EVIDENCE: A-S01)

Dateline; greeting; prompt with "Another thought"; at most one slip; the capture cluster (Speak, Type as 64 pt twins, Start from a photo and Not much today as 44 pt quiet controls); the Plus line when it applies; the whose-book switcher with two books. That is 5 content elements, 4 actions, 0 to 1 slips.

### 5.2 Verdict

Not thin. Home has one job and it does it above the fold. It would be thin only if "thin" meant "few things", and the frame's principle (the 2 a.m. rule, one primary action) is few things. The weakness is the second visit in one day or the third day in a row: only the prompt and the greeting change, and slips are rare (waiting cards, seal opened on its day, birthday week, a past letter).

### 5.3 What to add, and the rule

The direction's candidates for a "strip" are: a day we mark today, a picture suggestion, one past letter, the reminder ask. Applying the frame (`[FRAME-SLIP]`, COMPONENTS C9 Home slip host: at most one slip, fixed order, the reminder ask and the Plus line are not slips; the photo start is part of the capture cluster):

| Candidate | Where it goes | Why |
|---|---|---|
| A day we mark, today | A new slip rank between (2) seal-opened and (3) Save a copy. Proposed order: (1) waiting cards, (2) seal-opened line, (2b) a day we mark today, (3) Save a copy, (4) one past letter | The parent chose the day, so it outranks a suggestion; it is one line of the parent's own words, like the typed-day line D-S11 draws above the prompt |
| A picture suggestion (Journaling Suggestions, NS-49) | Not a slip. Inside the capture cluster as the label of "Start from a photo" (or one adjacent control), because the system picker lists the suggestions and the app receives only what the parent picks | Keeps Apple's own flow; no suggestion text of ours (constitution) |
| One past letter | Stays slip 4 | Locked by NS-23 |
| The reminder ask | Stays a sheet over the Book after the first kept letter | Locked by NS-13 |

So NS-50 "Home today strip" = one more rank in the existing slip host plus the typed-day line, not a new strip. If the founder wants several items visible at once, that is a feed with a count of things waiting, and I advise against it: it adds a job (checking Home) and brings in "counts of gaps" by the back door. If the founder still wants it, test it (section 10, T3).

Typed-day landing: D-S11 puts the parent's words above the prompt on the day, after a notification. The new slip rank should use the same component so a day shows one way whether the parent arrives by notification or by opening the app.

### 5.4 Home versus Book (the direction's candidates, one by one)

| Candidate from direction section 5 | Result |
|---|---|
| Past letter on Home vs the Book's "on this day" role | Not a duplicate. The Book has no "on this day" today (NS-31 parked); the slip is the only surfacing. If NS-31's part is reopened (Q-FD-6) the slip becomes its Home door; do not build a second "on this day" row in the Book as well |
| Month and birthday lines on Home vs Book age and month headings | Not present on Home. The overlap that does exist is the age line (D-05) |
| Save a copy in Me and as a Home slip | Two doors by design (D-01). Not a duplicate of data |
| Plan in Me and plan notices | Different moments (D-09). One state, two renderings, one computation to be made (X3) |
| Child details in three places | Confirmed as three forms (D-08), one set of rules |
| Me as a long settings list while Home may be too sparse | Me: regroup (section 4). Home: one more slip rank (section 5.3) |

## 6. What the new cards do to the map

| Card (proposed) | Where it lands | Rule that avoids a new duplicate |
|---|---|---|
| NS-46 Days we mark | One page "Days" in Me > Notes and days; one row on Reminders; one Home slip rank | Merge with NS-18 (D-10). A chosen day becomes a typed day; the library holds suggestions only |
| NS-47 Cultural background (religion, country) | Inside the Days page, behind "Browse traditions" and a "Prefer not to say" answer; not a Me row, not first run (direction recommends after the first kept letter, as a Home card once; I would draw that card as slip rank (2c), shown once) | One place to change or clear it. Stored on the phone only, so Erase everything and Delete account must name it (C-S19, C-S20 lines) |
| NS-48 Notification catalogue | No new screen. D-S06's "How it will look" preview shows one sample variant for the next planned note | The preview must call the same selection function as the planner, not a copy of its words |
| NS-49 Picture-first start and suggestions | The capture cluster on Home (A-S01), Apple's picker (A-S03) | One start, not two: Start from a photo and any "moments" entry are the same control |
| NS-50 Home today | One more slip rank (5.3) | Still one slip at a time |

## 7. Architecture: one owner per fact

Method: pattern search of `apps/mobile/src` for age, plan, reminder time, quiet and last-letter computations, then reading each hit. EVIDENCE unless marked. INFERENCE means "I believe this behaves differently from the other copy but did not run it". Names are proposals for `mobile` to rule on.

| Id | Fact | Where it is computed now | Problem | One owner (proposal) |
|---|---|---|---|---|
| X1 | Date a child turns N months old (the start of a month of age) | `packages/core/src/age.ts` (`ageOn`, `chapterOf`); `components/book/chapters.ts:174-186` (`monthStart`, with its own `parts`, `daysIn`, `isoOfUTC`); `lib/reminders/tz.ts:109-136` (`daysInMonth`, `monthDay`). Both copies say in a comment that they match `ageOn` | Same rule, three implementations held together by comments. Short-month clamping (born on the 31st) is the bug waiting to happen. Used by Book chapter spans, date-change bounds, month notes, birthday notes, plan anniversaries | Add `dateOfAge(birthISO, months)` to `packages/core/src/age.ts` with a test table (born 31 Jan, 29 Feb, 30 Apr); `chapters.ts` and `tz.ts` call it |
| X2 | Two functions called `monthDay` | `components/book/shelf.logic.ts:35` (a date formatter: "October 13"), re-exported by `chapters.ts:23`; `lib/reminders/tz.ts:131` (an age-date calculation returning a CalendarDate) | Same name, different meaning, imported by different layers; a wrong auto-import compiles only if the types happen to match (they do not, so it fails loudly: low risk, high confusion) | Rename the formatter `dayMonthLabel` and the calculation `dateOfAge` (X1) |
| X3 | Plan state for the Home and Write Plus line, the Keep gate and the Plan row | `plusLineShows({ plan: plan.view, now, lettersKept, allowance: freeLettersAllowance(), alpha })` written inline in `app/(tabs)/index.tsx:199` and `app/write.tsx:335`, each with its own `usePlan()` and `lettersKeptNow()` effect (`index.tsx:133-146`, `write.tsx:92-104`); the gate decides in `lib/billing/gates.ts:111-125` with `decideKeepLetter`; `hasPlus()` (`gates.ts:38`), `plusOn(...)` (`plan.logic.ts:317`), `usePlan().plusOn` (`use-plan.ts:28`), `planRowFor(plan, now, alpha)` (`settings-home.logic.ts:42`) all answer "is Plus on" | Five ways to ask "is Plus on" and two copies of the same five-argument call. `tonight-plus.logic.ts:8` says the line and the gate "never disagree" by routing through billing, which holds only while both call sites stay identical | One hook `usePlusLine()` in `lib/billing` returning `{ showLine, decision }` from one read of plan, letters kept and allowance; screens stop calling `plusLineShows` themselves. `hasPlus()` stays as the non-React read |
| X4 | Reminder window and slot rule (07:00 to 21:30, 15 minute steps) | Owned by `lib/reminders/planner.ts:127-136` (`DEFAULT_WINDOW`, `STEP_MINUTES`, `isQuietTime`, `normalizeWindow`); reused by `lib/billing/plan-reminders.logic.ts:34`. But `STEP_MINUTES = 15` is declared again at `plan-reminders.logic.ts:46`, and `pickSlot` there (`:195-228`) is a second slot picker with its own preferred time (10:00) | The window is shared (good); the step and the slot loop are not. A change to the step or to quiet hours in one file would not reach the other. The 10:00 preference is a real difference and should stay a parameter, not a second loop | Export `STEP_MINUTES` from the planner and import it; move `pickSlot` to `lib/reminders` taking `preferred` as an argument |
| X5 | The device time zone and locale | `Intl.DateTimeFormat().resolvedOptions().timeZone \|\| 'UTC'` at `lib/reminders/scheduler.ts:54`, `lib/billing/plan-reminders.ts:38`, `app/settings/plus.tsx:51`, `app/plus/confirmed.tsx:40`; locale at `lib/dates.ts:17`, `components/settings/phone-region.ts:21`, `lib/language/spoken-language.ts:35` | Seven copies of two one-liners, four of them in screens. Harmless today; the days library (dated notes, "around" dates) and the catalogue's weekday axis will need local date in many more places | `lib/dates.ts` exports `deviceTimeZone()` and `deviceLocale()`; everyone imports them. Also covers "today" (`todayISO` in `lib/store.ts:267`, and `isoOf(new Date(...))` in 8 call sites) |
| X6 | Quiet state of a book ("Quiet this book") | Written by `setChildQuiet` (`lib/store.ts:390`), stored as `quiet_at` (`lib/db/repos/children.ts:47, 151`), mapped to `Child.quiet`. The doc comment says "The planner reads `Child.quiet`" | I find no reader: `plannerChildren()` (`lib/reminders/prefs.ts:116`) maps `{id, name, birthday, included: c.remindersOn}` only, and no match for `.quiet` in `lib/reminders` or `components/tonight` (grep). The switch, as far as this worktree shows, changes nothing. INFERENCE: it may be on another branch (BL-985 is open in the DESIGN files) | `plannerChildren()` returns `included: c.remindersOn && !c.quiet`; the prompt and the month and birthday classes read the same field. Name one function `bookIsQuiet(child)` |
| X7 | "Days since the last letter" | Home: `index.tsx:146`, from `entries[0].occurredOn`; Write: `write.tsx:257`, the same formula inline; planner: `lastOwnSaveAt()` (`prefs.ts:120`), from the newest own save across books, by saved time and author | Three definitions: by the letter's day, by saved time, any author vs own. INFERENCE: a letter written today for an earlier day (NS-15) makes the prompt input read "many days" because `occurredOn` is old. NS-48 needs "hours since the last own save" and "kind of last letter": it must reuse `lastOwnSaveAt`, not add a fourth | One `lastLetterFacts(childId)` in `lib/store` returning `{ lastSavedAt, lastOccurredOn, kind }`; prompt selection and the catalogue read it |
| X8 | The "quiet" word in code | `isQuietMark` (a quiet-day entry), `isQuietTime` (outside the reminder window), `Child.quiet` (Quiet this book), `getReminderPermissionDetail().quiet` (Deliver Quietly), `Button variant quiet` (a style), `RECENT_SAVE_QUIET_MS` (no evening note within 20 hours of a save) | Six meanings. Not a bug; the cost is that a search for "quiet" does not answer any one question, and the parent sees three of them (A quiet day, Quiet this book, quiet delivery) | Rename in code only: `isNotMuchMark`, `isOutsideWindow`, `bookIsQuiet`, `deliversQuietly`. Parent words stay as the cards have them |
| X9 | Age text | `ageText` (`lib/dates.ts:101`), `coverAge` (`book-page.logic.ts:18`), `tonightStageLabel` (`prompt.logic.ts:33`, a wrapper on `ageText`), `chapterName` | One fact, one wrapper per screen (see D-05) | `ageLine` in one module, with `{ weeks: boolean }` |

Already single-owner (good, left alone): validation of child name, signs-as and birthday (`packages/core/src/child.ts`, used by all three forms); the reminder time formatter `formatReminderTime` (`lib/reminders/index.ts:49`, one definition, four callers); the next-ask order and cap (`lib/asks/next-ask.logic.ts`); the plan decision engine `decideKeepLetter` and `plusOn` in billing.

Reminder times the parent sets: stored once as `reminders.*` settings (`prefs.ts`); read by the planner, by D-S06, by D-S04 and by the scheduler. I found no second copy of the preference. I did not read the scheduler's use of the notification budget (NS-32 one a day): I searched `lib/reminders` and `lib/billing` for "budget" and found nothing, so the "one budgeted notification a day" rule is either enforced in the planner's per-day selection (`planReminders`, `planner.ts:284`) or not yet built. UNVERIFIED; `mobile` to confirm before NS-48 and NS-46 add classes to it.

## 8. Change list (merges, moves, deletions) with the rows each touches

| # | Change | Kind | Cards and backlog | Owner |
|---|---|---|---|---|
| C1 | One `SaveCopyOffer`, one `lastExport` status for six doors | MERGE (code) | NS-11-R1 to R4; NS-36; D6; BL-942 | mobile |
| C2 | Reminders, Days and Past letters on Home into a "Notes and days" group in Me | MOVE | NS-13; NS-18; NS-23-R4; C-S01; B-S21 | design systems to spec, mobile |
| C3 | Storage into "Keeping your book"; Privacy and App lock into "On this phone"; Erase and Delete account together, untitled, last | MOVE | NS-36; D1; D6; BL-961; C-S01 | design systems to spec, mobile |
| C4 | One Days page for typed days and the library of days; typed days leave the Reminders page | MERGE | NS-18-R1 to R8; NS-46 (proposed); D-S06, D-S08, D-S09 | product, design systems |
| C5 | Per-book note switches grouped on the Reminders page (TEST first) | MOVE (test) | NS-13-R31; NS-22-R3; C-S15 | design systems |
| C6 | Spoken language: downloads into its page; row hidden in English-only builds | MERGE, HIDE | NS-17; NS-09-R6; C-S18 | design systems to spec |
| C7 | First-run child form and `AddChildForm` become one component | MERGE (code) | E-S08; NS-14 | mobile |
| C8 | Home slip registry gains rank (2b) a day we mark today (and (2c) the one-time days card) | ADD | NS-50 (proposed); NS-46; frame `[FRAME-SLIP]`; BL-963 | design systems (C9), mobile |
| C9 | One age line function, one rule for weeks | MERGE after ruling | NS-22-R1; D-05 | Karma rules, mobile |
| C10 | Code owners X1 to X9 (section 7) | REFACTOR | BL-985 (X6); BL-963 (slip registry); new rows needed for X1, X3, X4, X5, X7 (no ids above BL-999 assigned here) | mobile |
| C11 | Refresh `docs/design/IA.md` to the Home, Book, Me tree as drawn in the five DESIGN files; its Settings section still says "Reached from the gear on Book" | DOCS | none | design systems |

Deletions proposed: none of a screen or a row. Two retirements of wording or structure only: the "Reminders" and "Past letters on Home" rows under "Writing", and the one-entry Spoken language row in English-only builds.

## 9. Questions and rulings needed

| Id | Question | Default |
|---|---|---|
| R-IA-1 | One age precision across Home and Book (D-05)? | Months and weeks on Home and Review, months only on the Book |
| R-IA-2 | One Days page merging NS-18 and NS-46 (D-10)? Name: "Days we mark" or "Days to remember"? | One page, content picks the name |
| R-IA-3 | Home today: one more slip rank (5.3), or a visible strip of several? | One slip rank; test the strip (T3) before any build |
| R-IA-4 | Regroup Me as in 4.3, after the tree test? | Test first (T1) |
| R-IA-5 | Where the religion and country card is asked: after the first kept letter as a one-time slip (direction recommendation, Q-FD-2) | As recommended |
| R-IA-6 | Is "Quiet this book" meant to stop the evening prompt on Home too, or only notes? The code comment says prompts, reminders, month and birthday notes; the card text is the authority | The card text |

## 10. Tests to run (cheapest first, no analytics needed)

| Id | Test | Method | Pass rule |
|---|---|---|---|
| T1 | Can a parent find things in Me? | Tree test, 8 parents, 10 tasks ("turn off evening reminders", "save a copy of the year", "add Asha's birthday to remember", "see what was deleted"). Tree A = C-S01 as drawn, tree B = 4.3. Paper or a text prototype | B finds each task in the first try at least as often as A on every task, and not worse on "keep safe" tasks |
| T2 | Do the six Save a copy doors confuse? | 5 parents read the six screens in a sequence, then say where they would go to save the year | Each names the Me row or the offer they were shown, none says "there are several ways, I do not know which" |
| T3 | Home slip or strip | Two prototypes, 5 parents each, on `PROTOTYPE.html` of area A with a day we mark. Measure time to Speak or Type and ask "did anything on Home feel like it was waiting for you?" | The strip adds no time to Speak or Type and no parent says "waiting"; otherwise the single slip stands |
| T4 | Age line | Show Home and Book in sequence to 5 parents; ask what age they think Asha is | No parent reports a mismatch |
| T5 (engineering) | Month-of-age arithmetic | Table test in `packages/core` for `dateOfAge` against every existing caller (born on 29 Feb, 30 Apr, 31 Jan, 1 Mar) | Identical output from chapters, planner and plan reminders |
| T6 (engineering) | Quiet this book is enforced | Test: a quiet book gets no evening, month or birthday note and no prompt change | Planner returns none for it |

The tester sheets for T1 to T4 are for `user-research`; I can draw the two Me trees and the Home variants in `PROTOTYPE.html` once the design lead for area C and area A asks for it.

## 11. Limits and honesty notes

- I am a design role. Verdicts in sections 3 to 5 are judgements; the only measured things are counts and file lines.
- The Me row count comes from the design file's layout, not from the running app. The built `settings/index.tsx` differs in small ways (no "Keeping your book" group, no "Past letters on Home" row), so the real count on a device today is lower by about three.
- I did not run `npm test`, the typecheck or the app. No file other than this one was written.
- Items marked INFERENCE (X6, X7, D-04 Plus ask path) must be confirmed by `mobile` before a card relies on them.
- The direction's section 9 says duplicates were "named from the cards, not audited". This audit covers the five design areas and a pattern search of the code; it is not a screen-by-screen audit of the running build and will miss duplicates that live in files I did not open.
