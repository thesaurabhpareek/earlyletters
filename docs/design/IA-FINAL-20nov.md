# Information architecture, final for the locked pack (requirements rev 2)

Status: FINAL DRAFT for the Chief Design Officer and Karma, 20 Nov 2026 (UTC). Author: `design-systems`. Docs only: no code, token, card or string changes. Baseline: `develop` at `e68541dd3` (errata E1 to E82 in `docs/product/prd/18-errata-after-lock.md:3`). Supersedes `docs/design/IA.md` (31 Oct, stale) for the locked pack.

What this file is: the map of every place in the iOS app for Build 13 and after: three tabs, every pushed page and sheet with its route, the words a parent reads, where each locked requirement group (NS-01 to NS-52) lives, which switch or build gates it, the doorways in, the empty and first-run states, the Me, Account and Settings tree, the notification and reminder surfaces, and old name against new name. It lists places. It never defines a requirement: where this file and a card differ, the card wins (`docs/design/e2e/BRIEF.md:11`, `docs/product/prd/22-final-holistic-spec.md:5`).

ASCII only. No em or en dashes, curly quotes, ellipsis characters or emoji. The child is `{child}` throughout; the fictional family "Asha" appears only where a source draws it.

## 0. How to read this file

Status tags, used on every row that needs one:

| Tag | Meaning |
|---|---|
| BUILT | Read in `apps/mobile/src` on `develop` at `e68541dd3` this session (file and line given). Not run on a device. |
| DESIGNED | Drawn in the locked e2e design files or a locked card, not in the code on `develop`. |
| PROPOSED | A word, key or name that no founder or `content` approval has fixed yet. Marked in the Words column. |
| DARK | Shipped behind a switch that is off in every `eas.json` profile, so a parent never sees it. |
| UNVERIFIED | I could not check it. Said plainly where it matters. |

Source shorthand (every row ends with one or more of these):

| Short | File |
|---|---|
| `IA` | `docs/design/IA.md` (stale, 31 Oct) |
| `S06` | `docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` |
| `AUD` | `docs/design/e2e/IA-AUDIT.md` |
| `IDX` | `docs/design/e2e/INDEX.md`. A screen row `X-Snn` sits at line 28+nn (area A), 51+nn (B), 82+nn (C), 114+nn (D), 146+nn (E); counted from the file, e.g. `IDX A-S01` is `INDEX.md:29`. |
| `RUL` | `docs/design/e2e/RULINGS-20nov.md` (design rulings 25 to 37) |
| `A DESIGN`, `B WORDS`, and so on | `docs/design/e2e/<area folder>/DESIGN.md` or `WORDS.md` |
| `PRD nn` | `docs/product/prd/nn-*.md` (the card files) |
| `ERR Enn` | an erratum in `docs/product/prd/18-errata-after-lock.md` |
| `BRAND` | `packages/content/BRAND.md` |
| `CODE` | a path under `apps/mobile/` with a line |
| `STR` | `packages/content/src/strings.en.ts` |

Screen ids (`A-S01` and so on) are the e2e area ids; `.state` suffixes are the states those files name.

## 1. What I read, and what I could not

Read in full: `IA.md`, `S06`, `AUD`, `RULINGS-20nov.md`, `INDEX.md` (sections 1 to 8), `BRIEF.md`, `BRAND.md`, `18-errata-after-lock.md`, `22-final-holistic-spec.md`, `00-product-frame.md` section 4, `NOMENCLATURE_AUDIT_2026-10-31.md` section 3. Read in the parts that name places: the five area `DESIGN.md` files (A-S01, B-S01, B-S08, C-S01 and the C round 2 table), the five `WORDS.md` files (headings and every title or label row), `COMPONENTS.md` and `COMPONENT_LIBRARY.md` (section lists only; no place depends on a component), cards `01`, `02`, `05`, `06`, `07`, `08`, `10` (NS-25 to NS-31), `09` (NS-19, NS-20), `21`, `23`, `27` for flags, drops and names. In code: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/book.tsx` (header lines), `app/settings/index.tsx` and `_layout.tsx`, `app/family.tsx`, `app/invite/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/+not-found.tsx`, `app/+native-intent.tsx`, `lib/capabilities.ts`, `lib/transitions.logic.ts`, `lib/family/*`, `eas.json`.

Not read, or not read in full:

- The Project doc `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`. UNVERIFIED. I have no Projects tool in this run, and the pack's own registry marks it "do not load; the repo pack is the source after the lock" (`docs/product/prd/REGISTRY.md:201`). Nothing here depends on it.
- `docs/product/prd/19-from-download-to-first-letter.md` (NS-38 to NS-45) beyond its headings; first-run screens come from `IDX` E-S01 to E-S09 and `E WORDS` section 5.
- `docs/design/system/MOTION.md` and `COMPONENTS.md` that `RUL` and `IDX` cite: the folder `docs/design/system/` does not exist on `develop` (listing of `docs/design`, this session). UNVERIFIED; no place here depends on them.
- `app/listen.tsx`, `review.tsx`, `write.tsx`, `letter/[id].tsx`, `read-together.tsx`, `onboarding.tsx` beyond their `router` calls and header comments.
- No screen was seen on a device or simulator. No test was run. No `npm install` (disk).

## 2. Builds and switches

### 2.1 The profiles on `develop`

| Profile (`eas.json`) | Servers (sign-in, sync, co-parent) | Backup | Account deletion | English only | Source |
|---|---|---|---|---|---|
| `development`, `e2e` | off | off | on (but needs servers, so hidden) | unset | `CODE eas.json:15,19,33,37` |
| `preview` (alpha against staging) | on | off | not written | on | `CODE eas.json:47,51` |
| `testflight` | off | off | not written | on | `CODE eas.json:77,81` |
| `production` (store) | on | off | on | on | `CODE eas.json:61,65,66` |

Why this differs from `IA` lines 11 and 13: that file says the store profile has servers off and Family "none". Today `production` has servers on (`CODE eas.json:61`), and a servers-on store build hides the invite and join screens (`CODE app/invite/_layout.tsx:13`, `lib/family/surfaces.ts` `inviteScreensHidden`). Which profile Build 13 uses is not stated in any source I read: UNVERIFIED.

How a switch works (all `CODE lib/capabilities.ts`): a build flag is on only for the value `on`; `signIn`, `sync` and `coParent` follow the one server switch (lines 200 to 212); `backup`, `statusReport` and `accountDeletion` need the server switch and their own flag (lines 185 to 194); the English-only switch is separate (lines 165 to 168). A remote kill switch can only pause a feature a build has, never start one (lines 244 to 269; `ERR E21`).

### 2.2 What ships dark in Build 13

| Feature | Build flag | Remote pause | State in Build 13 | Source |
|---|---|---|---|---|
| Photo with a letter (NS-01) and everything that hangs on it: Start from a photo, Photos lens, Photo row, picture lines in Save a copy | `EXPO_PUBLIC_PHOTOS`; no `eas.json` profile sets it | `killSwitches.photos` | DARK. The task for this file says so; the only written proposal is that NS-01, NS-02, NS-37 and the 1.7.0 export are dark (`PRD 23:165`, a review proposal, "not a ruling") | `PRD 01:113,141,240`; `PRD 23:165` |
| Find (NS-02) | `EXPO_PUBLIC_BOOK_SEARCH`; no profile sets it | `killSwitches.bookSearch` | DARK, as above | `PRD 02:100,177,191` |
| Picture-first start and Apple's picker (NS-49 level 1) | rides `EXPO_PUBLIC_PHOTOS` (needs NS-01) | none own | Drop B, moved from A because NS-01 stays dark (`ERR E31`); not in Build 13 | `PRD 21:164-167`; `ERR E31` |
| Apple Journaling Suggestions (NS-49 level 2) | `EXPO_PUBLIC_SUGGESTIONS` | none own | Drop C, after 1.0 | `PRD 22:65,102` |
| Photo moments (NS-51) | `EXPO_PUBLIC_PHOTO_MOMENTS` | `killSwitches.photoMoments` | Build 13 has a spike only, on `exp/photos` behind a flag; ships in 1.1 | `ERR E32`, `ERR E38`; `PRD 22:112,159` |
| Several pictures and videos (NS-52) | `EXPO_PUBLIC_VIDEO` (pictures as today stay under `EXPO_PUBLIC_PHOTOS`) | `killSwitches.videos` | After 1.0 (drop C) | `ERR E34`, `ERR E38`; `PRD 22:34,159` |
| Days we mark, Days page (NS-46, NS-47, NS-18) | `EXPO_PUBLIC_DAYS` (typed days: `EXPO_PUBLIC_TYPED_DAYS`, `PRD 09:1039`) | `killSwitches.libraryDays` (to be added, `IDX 6.2` E X-11) | Drop B only if every gate closes before freeze; else later. No Days row is promised for Build 13 | `PRD 22:64`; `PRD 21:164-167`; `ERR E57` |
| Notification catalogue (NS-48) phase 1 | none (words only) | none | Drop A, "the next build (Build 13 or later)"; adds no screen | `PRD 21:164`; `PRD 22:63` |
| First-run stack (NS-38 to NS-45) | none named | none | Drop D: after wave 1 and Drop A, before any family outside the founder's signs in | `ERR E43` |
| Share one letter (NS-05) | `EXPO_PUBLIC_SHARE_LETTER` | none own | not stated for Build 13: UNVERIFIED | `PRD 05:111` |
| Firsts (NS-06 A) and sealed letters (NS-06 B) | `EXPO_PUBLIC_FIRSTS`, `EXPO_PUBLIC_SEALED_LETTERS` (names proposed) | none | not stated for Build 13: UNVERIFIED; seals wait on counsel (`PRD 22:150`) | `PRD 06:169,421` |
| Quick capture doorways (NS-06 C) | `EXPO_PUBLIC_QUICK_CAPTURE` (name proposed) | none | after the NS-04 spike passes; none ships from the spike | `PRD 06:619,655`; `PRD 12` row C-10 |
| Save a copy (NS-11) as a new name and screen | `EXPO_PUBLIC_SAVE_A_COPY` | none | not stated: UNVERIFIED | `PRD 08:702` |
| Earlier versions (NS-12) | `EXPO_PUBLIC_EARLIER_VERSIONS` (proposed) | none | not stated: UNVERIFIED | `PRD 08:873` |
| Printable book PDF (NS-07 C28) | `EXPO_PUBLIC_PRINT_READY` | none | not stated; no print order feature in 1.0 (`C 18 OQ-9`, `PRD 22:160`) | `PRD 07:304,358` |
| Past letter on Home (NS-23) | `EXPO_PUBLIC_PAST_LETTER` | none | not stated: UNVERIFIED | `PRD 10:488` |
| Read the year back (NS-24) | `EXPO_PUBLIC_READ_THE_YEAR` | none | not stated: UNVERIFIED | `PRD 10:646` |
| Sign as another speaker (NS-16) | `EXPO_PUBLIC_SIGN_AS_OTHER` | none | not stated: UNVERIFIED | `PRD 09:715` |
| Encrypted recording backup (NS-08) | `EXPO_PUBLIC_BACKUP` | `backupUploads`, `escrow` | off in every profile; the row is absent, not "coming soon" | `CODE eas.json:16,62`; `CODE lib/capabilities.ts:244-248`; `CODE settings/index.tsx:164` |
| Other parent (NS-25) | the server switch and an alpha build today | `killSwitches.invites` | store build shows nothing today; NS-25's own release drop is not named in `22` section 4: UNVERIFIED | `CODE lib/family/entry.logic.ts:51-56,87-88`; `PRD 10:693-712` |

The rule that makes a dark feature safe to map: with its flag off, the feature draws nothing and never says "coming soon"; data rights still work (launch sweep, Erase, export) (`PRD 01:141`, NS-01-R19; `BRIEF.md:21`; `PRD 12` row C-22 "dropped").

## 3. The map as a tree

Text drawn. `[D]` = DESIGNED, not on `develop`. `[B]` = BUILT. `(dark)` = behind an off switch in Build 13. `(alpha)` = servers on and an alpha build today. Names in quotes are parent-visible words; PROPOSED words are marked.

```
Early Letters (iOS)
|
+-- Before the tabs
|   +-- Age question and stop                   E-S03  [B: AgeGateScreen, app/_layout.tsx:215]
|   +-- Launch and boot / "The book could not open"  E-S01
|   +-- First run  /onboarding                  [B: steps welcome, promise, child, signsAs, finish; onboarding.tsx:94-95]
|   |     [D: Drop D stack] Welcome E-S02 > Sign in E-S04..S06 > Agreements E-S07 > "Who is this book for?" E-S08 > open book
|   +-- Opening your book (new phone)           C-S10, C-S11, C-S12   [D]
|
+-- TABS  (bar: Home | Book | Me, always these three; app/(tabs)/_layout.tsx:79-96)
|   |
|   +-- Home  "/"  (file index.tsx)             Say
|   |     dateline, greeting, ONE slip slot (above the prompt), prompt + "Another thought",
|   |     capture cluster: Speak | Type, "Start from a photo" (dark), "Not much today"
|   |     opens > Listen /listen, Write /write, Review /review, Whose book sheet, Day sheet
|   |
|   +-- Book  "/book"                           Read
|   |     cover band: "{child}'s book", age, switcher, "Read together", lens choice (dark), Find (dark),
|   |     "Go to a month", "More for this book"; months, newest first; letter cards; quiet-day rows
|   |     opens > Letter /letter/[id] > ("This letter" list) Day sheet, Mark a first, Hide until a day,
|   |             Who can read it, Photo, Earlier versions, Where the recording is, Share, Delete
|   |           > Read together /read-together
|   |
|   +-- Me  "/you"  (file you.tsx; same body as /settings)   Look after
|         account card, Plan, Children (Books), Writing, Keeping your book / Your letters, Privacy and security,
|         Delete account, Help and legal, About   (Section 7 draws the whole tree)
|
+-- Pushed pages and sheets over the tabs
|   +-- /listen (full screen), /review (full screen), /write (sheet)
|   +-- /letter/[id] (card to page), /read-together (full screen)
|   +-- /settings/* (push stack; one tap from Me)
|   +-- /(auth)/sign-in/* (one modal sheet)        [B, servers on]
|   +-- /invite, /invite/new, /invite/leave (modal) (alpha)
|   +-- /family (pushed page, "Write this book together")   (alpha)
|   +-- /plus/confirmed (modal, after a purchase)
|   +-- +not-found "Nothing at this link"
|
+-- Never a place: a Family tab, a Library tab, a Share tab, a "coming soon" screen, a strip on Home
```

Sources: tabs `CODE (tabs)/_layout.tsx:19-35,79-96`; root stack `CODE app/_layout.tsx:221-235`; presentation `CODE lib/transitions.logic.ts:44-57`; "never a place" `PRD 00:70`, `PRD 12` rows C-22 and C-37, `BRIEF.md:21`.

## 4. The three tabs

Three tabs, in this order, in every build: Home, Book, Me (`CODE (tabs)/_layout.tsx:79-96`; labels `STR:58-64`, founder 11 Nov). The bar is the same three items whatever the build (`CODE (tabs)/_layout.tsx:32-34`). Tab bar chrome is unchanged by the pack (`RUL` ruling 32); the Home glyph stays `moon.stars` (`RUL` ruling 34; built as `MoonStarsIcon`, `CODE (tabs)/_layout.tsx:79`). Home and Me are not yet rows in the BRAND.md glossary; see Open items.

| Tab | Route | File | One verb and sentence | Level 1 heading |
|---|---|---|---|---|
| Home | `/` | `(tabs)/index.tsx` | Say: "I go to Home to say something to {child}." (PROPOSED sentence) | the greeting (`tonight.greeting.*`) (`A WORDS:29`, `S06` section 1) |
| Book | `/book` | `(tabs)/book.tsx` | Read: "I go to the Book to read what we kept." (PROPOSED sentence) | "{child}'s book" (`B WORDS:26`) |
| Me | `/you` | `(tabs)/you.tsx` re-exports `settings/index.tsx` | Look after: "I go to Me to look after my account and books." (PROPOSED sentence) | "Me", the tab's own title; the old `headerTitle` override is gone on `develop` (`CODE (tabs)/_layout.tsx:84-96`; `NS-33 spec` row R2) |

Sources: verbs and sentences `PRD 00:62-68`, `PRD 22:15-19`, `S06` section 1; the sentences are PROPOSED in `S06` and carry no founder word yet. The line under the Me heading ("Account and settings") is PROPOSED (`S06` Q1) and is not built.

### 4.1 Home (Say), `/`

Home lists no kept letters, starts nothing but a letter, and holds at most one slip (`S06` section 3; `PRD 00:62-74`; `A DESIGN:276-295`).

| Order | Element | Visible name (exact words) | Switch or build | Opens | Source |
|---|---|---|---|---|---|
| 0 | Whose-book switcher, two or more visible books only | "For {child}"; sheet title "Whose book?" | none | A-S02 sheet, one radio list | `A WORDS:48,84`; `A DESIGN:277`; IDX A-S02 |
| 1 | Dateline | "ASHA . 7 MONTHS" shape; before birth "BEFORE YOU" | none | nothing | `A DESIGN:278,311` |
| 2 | Greeting | `tonight.greeting.*` (seven dayparts, e.g. "Good evening, {name}.") | none | nothing; heading level 1 | `A WORDS:29-30` |
| 3 | The one slip slot, directly above the prompt block (position closed in `A DESIGN`; see Open items) | see the ranks below | per rank | per rank | `A DESIGN:280-295`; `ERR E36`; `IDX 6.2` E X-6 |
| 4 | Prompt block: the typed-day line when a typed day is today, the prompt, "Another thought" | "Another thought" | Days on for the typed-day line | draws a new prompt | `A DESIGN:281`; `A WORDS:32` |
| 5 | Capture cluster, pinned at standard sizes, scrolls at AX1 and up | "Speak" and "Type" (64 pt twins), then "Start from a photo" (quiet), then "Not much today" (quiet) | "Start from a photo" is DARK in Build 13 (`EXPO_PUBLIC_PHOTOS`) | Listen, Write, picker or menu, quiet-day mark | `A WORDS:33-42`; `A DESIGN:282`; `S06` section 3.5 |
| 6 | Plus line, only when it applies; not a slip | Plus line (K2 wording) | plan state; alpha builds say Plus is not part of the test | Plan page `/settings/plus` | `IDX E-S26` (`INDEX.md:172`); `IDX 6.2` E X-7 (the K2 line); `A DESIGN:282` |

The slip registry, one registered order, one slip at a time (`ERR E36`, `PRD 00:74`, `A DESIGN:286-293`):

| Rank | Slip | Visible words | Switch | Dismiss | Drawn by |
|---|---|---|---|---|---|
| 1 | the waiting set | "Waiting to be kept.", "Recorded before the app closed.", "A recording is ready to read back."; buttons "Pick it up", "Open", "Keep it"; two or more fold to "Letters waiting to be kept." with "Show them" / "Hide them" | none (built) | none; Pick it up resumes | A, built; `A WORDS:62-66` |
| 2 | seal-opened line, on its day | words PROPOSED (`seal.homeOpened`) | Sealed letters flag (UNVERIFIED for Build 13) | "Not now" at most once | B-S18 (`IDX:69`) |
| 2b | a day the parent chose, today | the day's name and one line; "Not today" | `EXPO_PUBLIC_DAYS`; Drop B | "Not today" until the next local day | A-S01.dayToday; `A WORDS:462` |
| 3 | Save a copy, in the birthday week | PROPOSED; opens Save a copy | Save a copy flag (UNVERIFIED) | its own | C-S06 (`IDX:88`) |
| 3b | the Days ask, once, at most two showings | the question, then "Choose days" and "Not now" | `EXPO_PUBLIC_DAYS` (no flag of its own, `ERR E57`); Drop C | "Not now" is final for Home | A-S01.daysAsk; `A WORDS:471` |
| 4 | one past letter | PROPOSED kicker; replaces the built "A month ago" card | `EXPO_PUBLIC_PAST_LETTER` (`PRD 10:488`); Me switch "Past letters on Home" | "Not today" | B-S17 (`IDX:68`) |

Not slips: the typed-day line, the Plus line, the reminder ask (a sheet over the Book), the rating request, the picture start (`A DESIGN:295`, NS-50-R10). A strip of several things is not drawn: it would be a feed with a count of things waiting (`AUD:176`, R-IA-3; `PRD 22:43`).

States: first run day zero, many letters, draft waiting, offline, signed out and local start, mic denied, photos off, app locked, two books (`S06` section 3.3 and the table at section 6; `A DESIGN:305-313`). Built today the slip slot is not a host: Home shows the draft cards and a "A month ago" card (`CODE (tabs)/index.tsx:322-334`; `PRD 22:70` "there is no Home slip host or registry").

### 4.2 Book (Read), `/book`

The Book starts nothing (`S06` section 4.1, IA-R4). The cover band is the one lit object (`B DESIGN:192`).

| Order | Element | Visible name | Switch or build | Opens | Source |
|---|---|---|---|---|---|
| 1 | Title, level 1 heading | "{child}'s book" | none | nothing | `B DESIGN:193`; `B WORDS:26` |
| 1a | Find (magnifier, trailing, 44 pt) | VoiceOver label "Find"; field "Find a letter" | DARK in Build 13: `EXPO_PUBLIC_BOOK_SEARCH`, `killSwitches.bookSearch` | B-S06 Find over the Book | `B DESIGN:193`; `B WORDS:110`; `PRD 02:100` |
| 1b | Go to a month (quiet small button; renamed from the built "Months") | "Go to a month" | none | B-S07 sheet; folds into "More for this book" from AX3 | `B DESIGN:193`; `B WORDS:69,127` |
| 1c | More for this book (icon menu) | "More for this book": "Quiet this book", "Hide this book" (and "Turn Quiet off", "Show this book again") | none; Quiet is not read by the planner yet (`ERR E16`, BL-985) | B-S02 | `B WORDS:32,64-68`; `ERR E16` |
| 2 | Age line | age in words | none | nothing | `B DESIGN:193` |
| 3 | Child switcher, two or more books | "For {child}" | none | A-S02 sheet | `B WORDS:28` |
| 4 | Read together, full width | "Read together" (two words, capital R only) | none | `/read-together` | `BRAND:19,102`; `B WORDS:29` |
| 5 | Lens choice, only when a second lens has material | group label "Show letters by" (never drawn); options "Months", "Photos", "Firsts" | Photos lens DARK in Build 13; Firsts lens needs the Firsts flag | B-S03 radio group; B-S04 and B-S05 are letter cards | `B DESIGN:197`; `B WORDS:80-90` |
| 6 | Months, newest first: month opener then letter cards | "This month", "Month {n}", "The first weeks", "Before You"; cards "From {signsAs}", "Private" | none | `/letter/[id]` | `B WORDS:86`; `IA:41-42`; `CODE (tabs)/book.tsx:338` |
| 7 | Quiet-day row | "A quiet day" | none | row menu "Remove this mark" | D-S22 (`IDX:136`) |
| 8 | Sealed card, author's phones only | "Hidden until {date}" family; PROPOSED | Sealed letters flag | letter page | B-S16 (`IDX:67`) |

Built today versus drawn: the gear is still on the Book (`CODE (tabs)/book.tsx:353,365,400`), and the header has Read together and the gear only; the pack removes the gear (NS-22-R3, R6; `B DESIGN:193`) and puts Quiet and Hide behind "More for this book". Spec `S06` Q4 leaves the gear until Me is found on a device; `B DESIGN` and the card drop it. The card wins (`BRIEF.md:11`).

States: first day with no letters shows the closed cover, "The first page is waiting." and one quiet button that is a tab switch to Home, not a capture call (`B WORDS:386`; `B DESIGN:207`; `S06` IA-R4). The built label is "Write a letter" (`CODE (tabs)/book.tsx:427` calls `router.navigate('/')`); the pointer wording is a slot for `content` (`S06` section 4.3).

### 4.3 The letter page (pushed from the Book), `/letter/[id]`

One level 1 heading, the dateline (`B DESIGN:325`; `ERR`: ruling 29, `RUL` row 29). The locked order replaces the "Add to this letter" group of `S06` section 4a (`B DESIGN:320-345`).

| Order | Element | Visible name | Switch | Opens | Source |
|---|---|---|---|---|---|
| 1 | Back, "Aa" | built | none | | `B DESIGN:324` |
| 2 | Dateline as heading 1 | e.g. "Sat 14 Oct" | none | | `B DESIGN:325` |
| 3 | Picture, when present | label is the parent's photo words, else "Photo with this letter" | DARK (photos) | B-S11 viewer | `B DESIGN:326`; `B WORDS:99` |
| 4 | Words, signature | "From {signsAs}" | none | | `B DESIGN:327` |
| 5 | Player for a spoken letter on this phone | "Hear {signsAs}" (as built, `IA:54`) | none | | `B DESIGN:328` |
| 6 | Built cards: words waiting, "Read it back" | built | none | Review | `B DESIGN:329` |
| 7 | Share, full width, on its own | "Share this letter" (PROPOSED verb, G12) | `EXPO_PUBLIC_SHARE_LETTER`; absent on a private letter, a sealed letter, a letter with no words | D-S02 preview sheet, then iOS share sheet D-S03 | `D WORDS:31`; `D WORDS:695` |
| 8 | "This letter" list, level 2 heading, rows in this order, each absent when it does not apply: The day ("About 3 March", opens B-S09); "This was a first" switch (opens B-S12); Photo or "Add a photo" (B-S11); "Hide until a day" or "Hidden until {date}" (B-S13, B-S14); "Who can read it" (B-S10); "Earlier versions" (C-S13); where the recording is, "Kept on this phone" (C-S09) | as quoted | per row flag | per row | `B DESIGN:332-339`; `B WORDS:152` |
| 9 | Delete, full width, destructive, last, author only | "Delete" | none | B-S15 confirm "Delete this letter?", then "Letter deleted." with Undo on the Book | `B DESIGN:340`; `B WORDS:168,306-310` |

No "add audio to a kept letter" button is drawn: NS-19 is Home only, continuing a waiting draft (`PRD 09:1096-1112`).

### 4.4 Me (Look after), `/you`

Plain paper, no lamp, no count, no letter. The same component as `/settings` (`CODE (tabs)/you.tsx:7`). One tap to any row; nothing nests (`C DESIGN:401`). The full tree is Section 7.

## 5. Pushed pages, sheets and system screens

### 5.1 Root stack routes

| Route | Presentation | Visible name or first line | Reached from | Switch | Source |
|---|---|---|---|---|---|
| `/(tabs)` | tab root | Home, Book, Me | gate, first run | none | `CODE app/_layout.tsx:221-223` |
| `/onboarding` | cut (no transition) | first run steps: welcome, "Exactly as you said it." promise, "Who is this book for?", signs-as, finish ("The book is open.") | first launch with no book | Drop D adds the account-first stack | `CODE onboarding.tsx:94-95`; `CODE lib/transitions.logic.ts:45`; `IA:49` |
| `/listen` | full-screen modal, dissolve | "To {child}", "Listening."; red circle labelled "Start recording" | Home cluster, doorways | none | `CODE lib/transitions.logic.ts:46`; `A WORDS:113` |
| `/write` | modal sheet | field "Your letter"; "Words for this recording" for a take | Home "Type", Listen "Type instead" | none | `CODE lib/transitions.logic.ts:49`; `A WORDS:167,171` |
| `/review` | full-screen modal | "To {child} . Month {n}"; views "With small fixes" and "Exactly as said"; Keep, "Let it go" | after Listen or Write | none | `CODE lib/transitions.logic.ts:48`; `IA:52` |
| `/letter/[id]` | card to page | the letter | Book, Home slip, Recently deleted | none | `CODE lib/transitions.logic.ts:53` |
| `/read-together` | full-screen modal | "Read together"; controls "Play", "Pause", "Hear it again", "Next letter", "Back one", "Keep playing"; end "Read it again", "Close the book" | Book "Read together", year rows | `EXPO_PUBLIC_READ_THE_YEAR` for the year (`PRD 10:646`) | `B WORDS:332-350` |
| `/settings` and `/settings/*` | push stack | see Section 7 | Me rows; the Book gear (built); deep link | per row | `CODE lib/transitions.logic.ts:54`; `CODE settings/_layout.tsx:40-54` |
| `/(auth)/sign-in/*` (index, email, code, verify, consent) | one modal sheet; code, verify, consent cross-fade | "Sign in with Apple" / "Sign in with Google" / "Sign in with email"; "Sign in with email"; "Check your email"; "Before your book syncs" | Welcome, Me signed-out card, Keep gate, invite | servers on; else redirects Home | `CODE (auth)/_layout.tsx:24-36`; `E WORDS:256,421-442`; `BRAND:116` |
| `/invite`, `/invite/new`, `/invite/leave` | modal sheet | join ask; invite sheet | invite link, Family page, onboarding | alpha only: a servers-on store build redirects Home | `CODE invite/_layout.tsx:13`; `CODE lib/transitions.logic.ts:56` |
| `/family` | pushed page | "Write this book together" is the row that opens it | the book's page in Me | alpha only; else Redirect Home | `CODE family.tsx:98`; `D WORDS:333` |
| `/plus/confirmed` | modal sheet | "Thank you. Plus is on" with "Plus Monthly" or "Plus Annual" | after a purchase | store build only | `CODE lib/transitions.logic.ts:57`; `E WORDS:347`; `BRAND:21` |
| `+not-found` | StateScreen | "Nothing at this link", button "Back to Home" | any unmatched link | none | `CODE +not-found.tsx:1-14`; `STR:1216-1220` |
| Error boundary | StateScreen | "This page did not open" (E-S13) | a render fault | none | `E WORDS:389`; `IDX E-S13` |

Outside links may open only `/` and `/invite`; a link to `/listen`, `/review` or `/read-together` opens Home and never the microphone (`CODE lib/family/entry.logic.ts:121`; `CODE +native-intent.tsx:18-19`).

### 5.2 Sheets and overlays that are not routes

| Sheet | Owner screen | Visible title or label | Opened from | Switch | Source |
|---|---|---|---|---|---|
| Whose book | A-S02 | "Whose book?" | Home and Book switchers | two or more books | `A WORDS:84` |
| When was this? | A-S08, B-S09 (one DateSheet) | "When was this?", tabs "A day" and "A month" | Review dateline, letter page day row | none | `A WORDS:196-197`; `B WORDS:182` |
| Who is this letter from? | A-S09 | "Who is this letter from?", field "From", "Names used on this phone", "Use my name" | Review "From" | `EXPO_PUBLIC_SIGN_AS_OTHER` for another speaker | `A WORDS:214-219`; `PRD 09:715` |
| Another language | A-S10 | "Type the words", "Keep the recording" | Review | second language passes its gate | `A WORDS:235-236` |
| Let it go | A-S11 | "Let this recording go?", "Let it go", "Keep it" | Listen, Review | none | `A WORDS:147,264-267` |
| Use this picture instead? | A-S12 | replace confirm, Undo | Review, letter page | DARK (photos) | `IDX A-S12` |
| Keep gate | E-S10 | "Keep adding to {child}'s book" | Review or Write after the free letters | store build; alpha has no letter limit | `E WORDS:329`; `CODE lib/billing/alpha.ts:1-12` |
| Reminder ask | D-S04 | the evening-reminder card over the Book after the first kept letter | first kept letter, once, cap of two showings | none | `CODE (tabs)/_layout.tsx:98-100`; `AUD:95` |
| Sign-out | C-S03 | "Sign out on this phone?", "Stay signed in", "Sign out" | Account | servers on | `C WORDS:49` |
| Share preview | D-S02 | "Share this letter" flow | letter page | `EXPO_PUBLIC_SHARE_LETTER` | `D WORDS:31` |
| Go to a month | B-S07 | "Go to a month"; section "Read a year together" | Book | none | `B WORDS:127,130` |
| Who can read it | B-S10 | "Who can read it" | letter page row | none | `B WORDS:188` |
| Mark a first | B-S12 | "This was a first", field "In your words, if you like" | letter page, Review | Firsts flag | `B WORDS:232-235` |
| Hide until a day | B-S13 | "Hide until a day", "Opens on", "Hide it" | letter page, Review | Sealed letters flag | `B WORDS:250-258` |
| Open now | B-S14 | "Open this letter now?", "Open now" | sealed letter | Sealed letters flag | `B WORDS:269-272` |
| Add a day, Browse days, Day detail | D-S08, C-S25, C-S26 | "Browse days"; day detail with "Move this date", "Remove" | Days page | `EXPO_PUBLIC_DAYS` | `C WORDS:632`; `IDX C-S25` |
| Which book? | C-S07 | "Which book?" | Save a copy, the birthday-week slip | two or more books | `C WORDS:155,182` |
| Photos access primer and Moments sheet | A-S18, A-S17, E-S32 | "Photos access" (PROPOSED) | Me row, or the picture start after one kept picture letter | `EXPO_PUBLIC_PHOTO_MOMENTS`, spike in Build 13 | `C WORDS:675`; `IDX 7` |
| App lock cover and unlock | E-S22, A-S14.unlock | lock screen | app launch, foreground | App lock on | `IDX E-S22` |
| Account layer | `AccountLayer` | one screen, "Sign out", over every route when another account holds the phone's book | second account on one phone | servers on | `CODE app/_layout.tsx:244-247` (comment) |

## 6. Where each requirement group lives

Row groups are the card ids NS-01 to NS-52 (`docs/product/prd/` cards 01 to 11, 19, 21, 27). "Place" is a tab, a pushed page, a sheet, or "no screen". A row group with no place by decision says so and cites the decision.

| NS | Group | Place (screen ids) | Tab or doorway | Switch or drop | Source |
|---|---|---|---|---|---|
| NS-01 | Photo with a letter | Start from a photo (A-S01, A-S03, A-S04.readyPhoto, A-S06.photo, A-S07.photo, A-S12); Photos lens (B-S03, B-S04); Photo row and viewer (B-S08, B-S11); lines in Save a copy, Recently deleted, Storage | Home, Book, letter page | DARK; `EXPO_PUBLIC_PHOTOS` | `IDX A-S01..A-S07, B-S03, B-S04, B-S11`; `PRD 01:113` |
| NS-02 | Find | Find mode over the Book (B-S06) | Book header | DARK; `EXPO_PUBLIC_BOOK_SEARCH` | `IDX:57`; `PRD 02:100` |
| NS-03 | Family-hears-it pilot | no app screen: messages only (D-S23) | outside the app | no build | `IDX:137`; `PRD 03:1` |
| NS-04 | Hands-free capture spike | no screen; A-S15 hypotheses only | none | spike | `IDX A-S15`; `PRD 12` row C-09 |
| NS-05 | Share one letter | Share on the letter page (D-S01), preview sheet (D-S02), iOS share sheet (D-S03) | Book > letter page | `EXPO_PUBLIC_SHARE_LETTER` | `IDX D-S01..S03`; `PRD 05:111` |
| NS-06 | Firsts, sealed letters, quick capture | A: B-S05 lens, B-S12; B: B-S13, B-S14, B-S16, B-S18 (Home rank 2), B-S22 (Recently deleted row); C: doorways (A-S14) | Book, Home slip, Me, system | `EXPO_PUBLIC_FIRSTS`, `EXPO_PUBLIC_SEALED_LETTERS`, `EXPO_PUBLIC_QUICK_CAPTURE` (names proposed) | `IDX B-S05, B-S12..S16, B-S18, B-S22`; `PRD 06:169,421,655` |
| NS-07 | Quiet days, printable book, label guard | C5: Home "Not much today" (D-S21), Book row "A quiet day" (D-S22); C28: section in Save a copy (C-S04), making screen (C-S05); G11: no screen | Home, Book, Me | `EXPO_PUBLIC_PRINT_READY` | `IDX D-S21, D-S22, C-S05`; `PRD 07:304,358` |
| NS-08 | Recording backup: get ready, do not turn on | Where your letters live (C-S08), provenance line (C-S09), flip-only Recording backup (C-S21) | Me, letter page | off; row absent | `IDX C-S08, C-S09, C-S21`; `CODE settings/index.tsx:164` |
| NS-09 | Let it go always finishes | Let it go confirm (A-S11), Storage state line "A recording is still being removed" with "Remove now" (C-S18) | Review, Listen, Me > Storage | proposed in Build 13 | `IDX A-S11, C-S18`; `ERR E28`; `PRD 23:165` |
| NS-10 | A new phone | Opening your book (C-S10), returning consent (C-S11), book-level line (C-S12), E-S09 alias | first run, Book | servers on | `IDX C-S10..S12, E-S09` |
| NS-11 | Save a copy of the year | Save a copy (C-S04), birthday-week slip (C-S06), Which book? (C-S07), lines on E-S12, C-S19, C-S20, E-S01 | Me, Home rank 3 | `EXPO_PUBLIC_SAVE_A_COPY` | `IDX C-S04..S07`; `AUD:92` (D-01); `PRD 08:702` |
| NS-12 | Earlier versions of my words | Earlier versions list (C-S13), one version (C-S14) | letter page row | `EXPO_PUBLIC_EARLIER_VERSIONS` | `IDX C-S13, C-S14`; `PRD 08:873` |
| NS-13 | Reminders that help, then step back | Reminder ask (D-S04), Me > Reminders (D-S06), time picker (D-S07), lock-screen and landing (D-S10, D-S11) | Book (sheet), Me | `reminders` pause | `IDX D-S04..S11` |
| NS-14 | Whose book | Whose book sheet (A-S02), switchers on Home and Book, "Add a child" in Me | Home, Book, Me | none | `IDX A-S02`; `AUD:103` |
| NS-15 | A letter for another day | Day sheet (A-S08, B-S09) | Review, letter page | none | `IDX A-S08, B-S09` |
| NS-16 | Someone else speaks | From sheet (A-S09) | Review | `EXPO_PUBLIC_SIGN_AS_OTHER` | `IDX A-S09`; `PRD 09:715` |
| NS-17 | A second spoken language | Another language (A-S10), Spoken language row, languages step (E-S08) | Review, Me, first run | English only in the store build | `IDX A-S10`; `CODE eas.json:66` |
| NS-18 | Typed days in reminders | one Days page (C-S24) with Add a day (D-S08) and a typed day (D-S09); a pointer row on Reminders | Me | `EXPO_PUBLIC_TYPED_DAYS`, `EXPO_PUBLIC_DAYS` | `IDX C-S24, D-S08, D-S09`; `C 15` X5, X6 |
| NS-19 | Add more to this letter | Home waiting draft, "Pick it up"; no letter-page button | Home | none | `PRD 09:1096-1112` |
| NS-20 | A letter to two books | not built, no place | none | none | `PRD 09:1210-1223` |
| NS-21 | The letter page reads as one place | B-S08 "This letter" list, B-S09, B-S10, B-S15 | Book > letter page | none | `IDX B-S08..S10, B-S15`; `B DESIGN:320-345` |
| NS-22 | The Book header stays calm | B-S01, B-S02, B-S07; Quiet and Hide in Me (C-S15), Hidden books (C-S16) | Book, Me | none | `IDX B-S01, B-S02, B-S07, C-S15, C-S16` |
| NS-23 | One past letter on Home | slip rank 4 (B-S17); Me switch "Past letters on Home" (B-S21) | Home, Me | `EXPO_PUBLIC_PAST_LETTER` | `IDX B-S17, B-S21`; `PRD 10:488` |
| NS-24 | Read the year back | Read together whole book or one year (B-S19), end screens (B-S20), year rows in B-S07 | Book | `EXPO_PUBLIC_READ_THE_YEAR` | `IDX B-S19, B-S20`; `PRD 10:646` |
| NS-25 | The other parent | the book's page row (D-S12), invite sheet (D-S13), link page (D-S14, web), join ask and agreement (D-S15, D-S16), arrival (D-S17), Family page (D-S18), undo (D-S19, D-S20) | Me > book > Family page | alpha today; store drop not named | `IDX D-S12..S20`; `CODE family.tsx:98` |
| NS-26 | Hear when the other parent writes | no place: parked; in 1.0 only an in-app line, a local reminder or an email (E79) | none | none | `PRD 10:885-899`; `ERR E79` |
| NS-27 | Who can read each letter (per person) | no place: parked; the two-state "Who can read it" row exists (B-S10) | none | none | `PRD 10:901-912` |
| NS-28 | A family link or circle | no place: parked | none | none | `PRD 10:914-928` |
| NS-29 | Words that light up as read | no place: decision record only (B-S23) | none | none | `IDX B-S23`; `PRD 10:930-944` |
| NS-30 | A book you can hold | the free printable PDF only (C-S04 section, C-S05); no order, no print entry in 1.0 | Me | `EXPO_PUBLIC_PRINT_READY` | `PRD 10:946-960`; `C 18 OQ-9` |
| NS-31 | A library of moments | no place: parked; the live relative is NS-51 | none | none | `PRD 10:962-973` |
| NS-32 | One notification budget | no screen of its own; seen on Reminders (D-S06), lock screen (D-S10), landing (D-S11), plan line (D-S24, E-S25) | Me, system | none | `IDX D-S06, D-S10, D-S24, E-S25`; `ERR E13` |
| NS-33 | Everyone can use it | no place: a floor on every screen; heading rows on Me and the letter page | all | none | `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md:1-12` |
| NS-34 | Quick on the smallest phone | no place: speed targets | all | none | `PRD 11` NS-34 heading |
| NS-35 | Only Home starts a letter | Home cluster and the allow-listed doorways (A-S14); a test proves it | Home | none | `IDX A-S14`; `S06` section 10 |
| NS-36 | New kinds of data follow the letter | Recently deleted (C-S17), Erase everything (C-S19), Delete account (C-S20), Delete this book (C-S22) | Me | none | `IDX C-S17, C-S19, C-S20, C-S22` |
| NS-37 | The Book stays fast as it grows | no place: budgets | Book | none | `PRD 11` NS-37 heading |
| NS-38 | The App Store page and install | outside the app (E-S27); claims only | outside | none | `IDX E-S27` |
| NS-39 | First launch and first interaction | Launch (E-S01), Welcome (E-S02), mic primer and prompt (A-S04.primer, E-S29) | first run | Drop D | `IDX E-S01, E-S02, E-S29`; `ERR E43` |
| NS-40 | Age and region checks | Age gate and stop (E-S03); refusal after the code step (E-S04.refused-region) | first run | Drop D; `ERR E62`, `E70` | `IDX E-S03, E-S04` |
| NS-41 | Sign up and sign in | Sign-in sheet (E-S04), email (E-S05), code and verify (E-S06), outage (E-S14) | first run, Me | Drop D | `IDX E-S04..S06, E-S14` |
| NS-42 | Agreements and notices at collection | Agreements and consent (E-S07), returning consent (C-S11), Privacy (C-S23) | first run, Me | Drop D; notice words wait for the founder (`ERR E51`) | `IDX E-S07, C-S11, C-S23` |
| NS-43 | Setting up the first book | First book steps (E-S08) | first run | Drop D | `IDX E-S08` |
| NS-44 | The first letter and the allowance | After Keep (A-S13), Keep gate (E-S10), Plan (E-S11), Plus confirmed (E-S12) | Home, Me | Drop D; allowance per phone (`ERR E59`) | `IDX A-S13, E-S10..S12` |
| NS-45 | Account life after first run | Me account card and states (C-S01), Account (C-S02), sign-out (C-S03), update line (E-S16), claim (E-S24) | Me | Drop D; update line only on Me, never blocks (`ERR E58`) | `IDX C-S01..S03, E-S16, E-S24` |
| NS-46 | Days we mark | Days page (C-S24), Browse days (C-S25), Day detail (C-S26), Home rank 2b, lock-screen rows (D-S10) | Me, Home | `EXPO_PUBLIC_DAYS`; Drop B | `IDX C-S24..S26`; `PRD 22:64` |
| NS-47 | Cultural background | optional pickers inside Browse days (C-S25), the Days ask (A-S01.daysAsk), consent line (D-S25); no top-level Me row | Home rank 3b, Me > Days | Drop B store rules; Drop C ask | `IDX C-S25, D-S25`; `AUD:196` |
| NS-48 | Notification catalogue | no screen; the "How it will look" preview on Reminders (D-S06), specimens (D-S26, a design artefact) | Me | Drop A phase 1 | `IDX D-S06, D-S26`; `PRD 22:63` |
| NS-49 | Picture-first start and suggestions | Start from a photo (A-S01), Apple's picker (A-S03), one photo from a suggestion (A-S16, PROPOSED) | Home | level 1 Drop B (dark with NS-01); level 2 Drop C | `IDX A-S01, A-S03, A-S16`; `ERR E31` |
| NS-50 | Home today | slip rank 2b and the seal-opened rank 2 in the one slot (A-S01, B-S17, B-S18) | Home | Drop B | `IDX A-S01, B-S17, B-S18`; `PRD 21:165` |
| NS-51 | Photo moments | Me row "Photo moments", page "Photos access" (C-S27, PROPOSED), Moments sheet (A-S17), ask (A-S18, E-S32), reminder states (D-S06), landing (D-S11) | Me, Home photo menu | spike in Build 13; 1.1 | `IDX 7`; `PRD 27:80`; `ERR E32` |
| NS-52 | Pictures and videos with a letter | tray on Listen (A-S04.mediaTray), Review (A-S07.mediaCard), letter page (B-S08.withMedia, B-S25, B-S26 PROPOSED), Storage group "Pictures and videos" (C-S18.media) | Home, Book, Me | after 1.0; `EXPO_PUBLIC_VIDEO` | `IDX 7`; `ERR E34`, `E38` |

## 7. Me, Account and Settings: the whole tree

Me is the Settings home: one component mounted at `/you` and at `/settings` (`CODE (tabs)/you.tsx:7`). Three layouts are on record, in time order; the second is what ships first and the third waits for the tree test.

### 7.1 BUILT on `develop` (read this session)

Titles are the exact built words (`CODE settings/index.tsx` as noted; `STR` as noted).

```
Me
|-- Header card: signed-in line, or "On this phone"           (opens Account only when sign-in is in the build)   CODE settings/index.tsx:118-127
|-- Plan                                                       /settings/plus   title "Plan" / "Plus"             CODE :118-134; features/billing.en.ts:125,26
|-- Children                                                   CODE :138-150
|     each child's name  > /settings/children/[id]  "{child}'s book": details, "Hide this book", Delete this book
|     "Add a child"      > /settings/children/new
|     Hidden books (only while one is hidden) > /settings/children/hidden
|-- Writing                                                    CODE :152-157
|     "Spoken language"  /settings/language   (English alone with one line in the store build)
|     "Your words"       /settings/your-words
|     "Reminders"        /settings/reminders  (value: the summary)
|     "Appearance"       /settings/appearance
|-- Your letters                                               CODE :159-171
|     "Where your letters live"  /settings/where-letters-live
|     "Export your book"         /settings/export        (page title today: "Export", STR:858)
|     "Recently deleted"         /settings/recently-deleted
|     Back up my recordings      /settings/backup        (absent: build flag off)
|     "Storage"                  /settings/storage
|     "Erase everything on this phone"  /settings/erase  (only on a phone that never signed in)
|-- Privacy and security                                       CODE :173-183
|     "App lock" (On or Off)     /settings/app-lock
|     "Privacy"                  /settings/privacy
|-- Delete account  (own section; signed in AND flag on)       /settings/delete-account   CODE :187-190
|-- Help and legal                                             CODE :193-198
|     "Help" (value "Write to us")  opens Mail
|     "If you are struggling"    /settings/struggling  > "Lines in other countries" /settings/struggling-elsewhere
|     "Legal"                    /settings/legal  > Terms of Service, Privacy Policy, "Licenses" /settings/licenses
|-- About: "Version", the early-version note, the sign-off     CODE :201-212
Account (/settings/account): signed in only, from the header card; Sign out, "Sign out other devices"
```

Section words: "Writing", "Your letters", "Privacy and security", "Help and legal", "About" are `STR:1334-1342`; "Children" is `STR:1113`. Rows are `STR:1370-1395`.

### 7.2 DESIGNED first (`.default`, ships first), C-S01

Changes from built: a "Me" heading; a new section "Keeping your book" holding Save a copy and Where your letters live; a Days row directly under Reminders; a "Past letters on Home" switch in Writing; Erase also shown when signed out after a sign-in; no co-parent caption (`C DESIGN:357-406`).

```
Me
|-- Account card (or signed-out card), Plan
|-- Books  (PROPOSED title; built is "Children")   each book, "Add a book" (built word "Add a child"), Hidden books
|-- Writing    "Spoken language", "Your words", "Reminders" (D-S06), "Days" (C-S24), "Past letters on Home" (switch, B-S21), "Appearance"
|-- Keeping your book (PROPOSED title)   "Save a copy" (PROPOSED word; built "Export your book"), "Where your letters live"
|-- Your letters   "Recently deleted", "Storage", "Erase everything on this phone"
|-- Privacy and security   "App lock", "Privacy", "Delete account"
|-- Help and legal, About (as built)
```

Rows that depend on state: Days is present when the Days flag is on and the person is signed in or the build has no sign-in; Delete account when signed in and the flag is on; "If you are struggling" in every build (`C DESIGN:403`; D-034 as cited in `CODE settings/index.tsx:48-50`).

### 7.3 DESIGNED after tree test T1 (`.regrouped`)

Adopted for design, built only if T1 finds each task at least as often as `.default` and not worse on "keep safe" tasks (`C DESIGN:388-401`; `PRD 22:53`; `AUD:131-147`). No row is deleted. Group titles are working titles that `content` still names (`C 18` OQ-2).

```
Me
|-- header (no title): Account card, Plan
|-- Books                 each book, Add a book, Hidden books
|-- Writing               Spoken language, Your words, Appearance
|-- Days and reminders    Reminders, Days, Past letters on Home          (PROPOSED title)
|-- Keeping your book     Save a copy, Where your letters live, Recently deleted, Storage
|-- On this phone         App lock, Privacy                              (PROPOSED title)
|-- (no title, last)      Erase everything on this phone (no one signed in) or Delete account (signed in)
|-- Help and legal        Help, If you are struggling, Legal
|-- About                 Version
```

### 7.4 Pages under Me (route, visible name, owner screen)

| Route | Page title (visible) | Screen id | Words status | Source |
|---|---|---|---|---|
| `/settings/account` | "Account" | C-S02, C-S03 | built | `packages/content/src/features/auth.en.ts:256`; `C WORDS:42-70` |
| `/settings/plus` | "Plan" (store), plan states Free, Plus, "Plus, shared" | E-S11 | built | `CODE settings/index.tsx:127,133`; `NOMENCLATURE_AUDIT` R-C |
| `/settings/children/[id]` | "{child}'s book" | C-S15 | built | `C WORDS:322` |
| `/settings/children/new` | add a child | first-run form reused | built | `CODE settings/index.tsx:147` |
| `/settings/children/hidden` | "Hidden books" ("No hidden books.") | C-S16 | built | `C WORDS:334` |
| `/settings/children/delete-book` | "Delete the whole book?" | C-S22 | built | `C WORDS:453` |
| `/settings/language` | "Spoken language" | A-S10 and E-S08 languages | built | `A WORDS`; `IDX E-S08` |
| `/settings/your-words` | "Your words" | the Word for word choice | built | `STR:1370-1371` |
| `/settings/reminders` | "Reminders" | D-S06 | built; Days pointer and Photo moments row DESIGNED | `CODE settings/_layout.tsx:42`; `IDX D-S06` |
| `/settings/appearance` | "Appearance" | E-S21 | built | `CODE settings/_layout.tsx:41` |
| `/settings/export` | "Export" built; "Save a copy" PROPOSED | C-S04, C-S05 | PROPOSED change | `STR:858`; `C WORDS:78` |
| `/settings/where-letters-live` | "Where your letters live" | C-S08 | built | `C WORDS:196` |
| `/settings/recently-deleted` | "Recently deleted" | C-S17 | built | `C WORDS:346` |
| `/settings/storage` | "Storage" | C-S18 | built; the stuck-recording line DESIGNED (E28) | `C WORDS:366`; `ERR E28` |
| `/settings/backup` | recording backup | C-S21 | flag off | `CODE settings/index.tsx:164` |
| `/settings/app-lock` | App lock | E-S22 | built | `CODE settings/_layout.tsx:43` |
| `/settings/privacy` | "Privacy" | C-S23 (and sheet "Stop syncing letters?") | built; withdraw control is a P0 row (`ERR E46`) | `STR:1011`; `C WORDS:664` |
| `/settings/erase` | "Erase everything on this phone" | C-S19 | built | `C WORDS:381` |
| `/settings/delete-account` | "Delete account" | C-S20 | built, flag-gated | `C WORDS:395-427` |
| `/settings/struggling`, `/settings/struggling-elsewhere` | "If you are struggling"; "Lines in other countries" | E-S30, E-S31 | built | `STR:1459,1471` |
| `/settings/legal`, `/settings/licenses` | "Legal"; "Licenses" | none | built | `CODE settings/_layout.tsx:51-52` |
| (no route yet) Days | "Days"; sections "Days you added", "Days you chose"; row "Browse days"; "Clear all" | C-S24 | PROPOSED words (`days.*`) | `C WORDS:629-644` |
| (no route yet) Photos access | "Photos access" | C-S27 | PROPOSED, pending NS-51 | `C WORDS:675` |
| (no route yet) Earlier versions | "Earlier versions" | C-S13, C-S14 | PROPOSED | `C WORDS:289` |

The Terms name "Settings, Plan" as the cancel path, so a row called Plan stays one tap from Me's top (`CODE settings/index.tsx:35-36,116`; `NOMENCLATURE_AUDIT` R-C).

## 8. Entry points and doorways

One capture entry: Home's cluster and the allow-listed doorways (`S06` section 10.1, N3; NS-35). A doorway only opens Listen at Ready; it never records on its own (`PRD 12` row C-10).

| Doorway | Opens | Switch | Source |
|---|---|---|---|
| Speak, Type, Not much today, Start from a photo | Listen, Write, a quiet-day mark, Apple's picker | photo is DARK | `A WORDS:33-42` |
| Widget, Control Center control, Action Button, Siri phrase "Start a letter" | Listen at Ready (A-S14) | `EXPO_PUBLIC_QUICK_CAPTURE`; none until the NS-04 spike passes | `A WORDS:309`; `PRD 06:619,655`; `PRD 12` row C-09 |
| Local reminder tap | Home (evening), Book (month, birthday), Home with the day's words (typed day), Me > Plan (plan) | Reminders on | `D WORDS:563-572` (section 8 matrix) |
| Invite link `https://earlyletters.com/j#t=` | `/invite`; token to Keychain | alpha only | `CODE +native-intent.tsx:10-11` |
| Sign-in link | `/sign-in/verify` or `/sign-in/code` | servers on | `CODE +native-intent.tsx:7-9` |
| Any other link | `/` only | none | `CODE lib/family/entry.logic.ts:121` |
| Book gear | Settings pushed page (built) | removed by NS-22-R3 | `CODE (tabs)/book.tsx:353`; `B DESIGN:193` |
| Home slip | the one letter or the page the slip names | per rank | Section 4.1 |
| Keep gate and sign-in prompts after a first letter | sign-in sheet; Keep gate sheet | servers on; store build | `CODE review.tsx:524-526` (read by grep); `E WORDS:329` |

## 9. Empty and first-run states

| Place | State | What the parent sees | Source |
|---|---|---|---|
| First run | no book | `/onboarding` is the first route; tabs are not mounted behind it | `CODE app/_layout.tsx:221` |
| Home | day zero | date line, greeting, first prompt, cluster; no empty box and no "nothing yet"; a day-zero book card where the slip goes | `S06` section 3.3; `A DESIGN:305-313` |
| Home | before the child is born | "BEFORE YOU" dateline; prompts from that set; no age words | `A DESIGN:311` |
| Book | no letters | closed cover; "The first page is waiting."; one quiet button that moves to Home; no Find, no lens, no Read together, no Go to a month | `B DESIGN:207`; `B WORDS:386` |
| Book | letters, no picture or first | Months only; no lens choice | `B DESIGN:206-215` |
| Book | nameless child | "your child" fallback; never "Your child's book" | `S06` section 4.3; `A WORDS` (switcher date labels) |
| Me | day one | account card, Plan, Children; Export stays and says so in one line when the book is empty (slot) | `S06` section 5.2 |
| Me | signed out | signed-out card, Plan, books; Erase present; "Your letters are on this phone." | `C DESIGN:407`; `STR:1355` |
| Days | empty | one calm line, no count | `IDX C-S24` (`.empty`) |
| Recently deleted | empty | "No deleted letters." | `C WORDS:346` |
| Hidden books | empty | "No hidden books." | `C WORDS:334` |
| Find | no match | "No letters with that word." | `B WORDS:114` |
| Quiet day | marked | "A quiet day, kept." with Undo | `A WORDS:41` |
| New phone | arriving | "Opening your book" and slow, offline, no-book states ("No book here yet") | `E WORDS:297-307`; `C WORDS:257` |
| Any link that does not exist | not found | "Nothing at this link", "Back to Home" | `STR:1216-1220` |
| App fault | boundary | "This page did not open" | `E WORDS:389` |
| Store would not open | launch recovery | "The book could not open"; the export option "Gathering your files" | `E WORDS:241,248` |

## 10. Notification and reminder surfaces

One budgeted reminder a day; 60 pending in total with plan notices first (`ERR E13`; `PRD 22:51`). Local only: no push token, no server sender (`ERR E79`).

| Surface | Screen id | Where it lives | Visible words | Switch | Source |
|---|---|---|---|---|---|
| Reminder ask after the first kept letter | D-S04 | sheet over the Book, cap of two showings | PROPOSED words (`reminderCopy.*`) | none | `CODE (tabs)/_layout.tsx:98-100` |
| iOS notification permission alert | D-S05 | system | system | none | `IDX D-S05` |
| Reminders page | D-S06 | Me > Reminders | switch "Reminders", "Off" value, time, names switch, "How it will look" preview, "Example" | none | `D WORDS:107,138`; `IDX D-S06` |
| Time picker | D-S07 | system compact, 07:00 to 21:30, 15-minute steps | system | none | `IDX D-S07`; `AUD:210` (X4) |
| Days page and day reminders | C-S24, D-S08, D-S25 | Me > Days | "Days you added", "Days you chose" | `EXPO_PUBLIC_DAYS` | `C WORDS:629-632` |
| Photo moments (reminder states) | D-S06 `.photoMoments*` | Reminders page | PROPOSED | spike in Build 13 | `IDX 7` |
| Lock screen and Notification Centre | D-S10 | system | evening, month "Month {month} begins", birthday "A birthday today", typed day "A day you wanted to remember", plan "Plus"; with names off or App lock on no title or body carries an age or a month number (`days.lock.body.neutral`, PROPOSED) | names switch default off | `D WORDS:563-570`; `ERR E82`; `RUL` ruling 3 |
| Notification landing | D-S11 | Home (evening, typed day), Book (month, birthday), Me > Plan | per class | none | `D WORDS:563-570` |
| Plan reminder inside the app | E-S25, D-S24 | `PlanNoticeHost`, a calm tab root | "A reminder about Plus" family | store build | `CODE app/_layout.tsx:238-239`; `packages/content/src/features/billing.en.ts:190` |
| Plan date when notifications are off | D-S24 | Me > Plan | one line | none | `IDX D-S24` |
| App update line | E-S16 | top of Me only; never blocks | PROPOSED | update required | `ERR E58` |
| Analytics ask | none own | a later session after the first letter, tab roots only; off in every profile | | `EXPO_PUBLIC_ANALYTICS` off | `CODE app/_layout.tsx:240-241`; `CODE eas.json:17` |

## 11. Old name to new name

| Old (where) | New | Status | Source |
|---|---|---|---|
| Tonight (tab label) | Home | BUILT label; key stays `tonight`, route stays `index` | `STR:58-64` |
| You (tab label) | Me | BUILT label; key `you`, file `you.tsx` | `STR:58-64` |
| Family tab | none; a pushed `/family` page opened from "Write this book together" | BUILT (alpha) | `CODE family.tsx:31-35` |
| "coming soon" caption in Me (spec 06 section 5.1, 07) | nothing: no build shows a coming-soon surface | DESIGNED; supersedes `S06` and `07-COPARENT-COMING-SOON` | `C DESIGN:405`; `PRD 12` row C-22 |
| Settings (opened from the Book gear) | Me tab; the gear leaves the Book | gear BUILT today, removal DESIGNED | `CODE (tabs)/book.tsx:353`; `B DESIGN:193` |
| "Months" (Book band button) | "Go to a month"; "Months" is now only the lens name | DESIGNED | `B WORDS:69,127` |
| lens (design term) | "Show letters by" with "Months", "Photos", "Firsts" | the word "lens" is internal only | `B WORDS:80-90`; `BRIEF.md:23` |
| "Export your book" row, "Export" page | "Save a copy" row and page | PROPOSED | `STR:858,1379`; `C WORDS:24,78` |
| "Your letters" group (Export, Where, Recently deleted, Storage) | "Keeping your book" plus "Your letters"; after T1 only "Keeping your book" | DESIGNED | `C DESIGN:359-399` |
| "Children" group, "Add a child" | "Books", "Add a book" | PROPOSED (words unsettled) | `C DESIGN:359-364`; `A WORDS:89` |
| "Recordings" row, "How transcription works" | "Where your letters live" and "Your words" | BUILT | `STR:1368-1371` |
| "Word for word" switch under Recordings | "Your words" page under Writing | BUILT | `STR:1371`; `IA:72,78` |
| "Month and birthday messages", "notes" | "reminders" (never "notes" for what we send) | DESIGNED | `C DESIGN:388`; `BRAND:93`; `D WORDS:731` |
| "Days to remember" section on Reminders (NS-18) | one "Days" page, sections "Days you added" and "Days you chose" | DESIGNED | `AUD:101`; `C 15` X5; `C WORDS:629-631` |
| "A month ago" card on Home | one past letter, slip rank 4 | DESIGNED; built today | `PRD 00:74`; `CODE (tabs)/index.tsx:334` |
| Four slips on Home | six ranks: 1, 2, 2b, 3, 3b, 4 | DESIGNED | `ERR E36` |
| "Add to this letter" group, "Close this letter until a day" (spec 06 4a) | "This letter" list; "Hide until a day" | DESIGNED | `B DESIGN:332-339`; `B WORDS:250` |
| "Take the book with you" section (spec 06) | "Keeping your book" | DESIGNED | `C WORDS:24,26` |
| Share as a tab candidate | Share on the letter page | refused as a tab | `PRD 12` row C-37 |
| "Edit", "Save" on Keep paths | "Keep" commits a letter; "Add to {child}'s book" | BUILT per ruling R-B | `NOMENCLATURE_AUDIT` R-B |
| Plus Yearly | Plus Annual | glossary | `BRAND:21,110` |
| "This page did not open" | "This screen did not open" (R-F) | ruled; built word still "This page did not open": UNVERIFIED | `NOMENCLATURE_AUDIT` R-F; `E WORDS:389` |

## 12. What changed since IA.md

1. Three tabs shipped as Home, Book, Me (founder, 11 Nov) and the strings are on `develop`: `IA.md` tabs table at lines 21 to 25 is now correct for labels, but its "Book gear is the only way into Settings" (line 39) and "Settings, reached from the gear on Book" (line 63) are stale: Me is the Settings home, one tap (`CODE (tabs)/_layout.tsx:81-96`).
2. The Book drops the gear and gains Find, Go to a month, More for this book and a lens choice (`B DESIGN:193-197`). Of these, Go to a month and More for this book are not behind a build flag; Find and the Photos lens are DARK in Build 13, and the Firsts lens waits on its own flag.
3. The letter page is now one list titled "This letter", with Share on its own above it, replacing the "Add to this letter" group of spec 06 (`B DESIGN:320-345`).
4. Home gains a single slip slot with six ranks and a photo start, replacing the waiting-card-plus-month-ago arrangement (`ERR E36`; `A DESIGN:276-295`).
5. Me gains Days, Photo moments, Keeping your book and, after a tree test, a regroup (`C DESIGN:357-406`).
6. First run is reorganised as a Drop D stack: age question, region, sign-in, consent, first book, first letter, Plan (`ERR E43`; `IDX E-S01..S12`). The `IA.md` five-step first run is the built form today (`CODE onboarding.tsx:94-95`).
7. Nothing says "coming soon" in any build. This supersedes both `IA.md` lines 11 and 13 ("none") as to wording and spec 06 section 5.1's caption (`PRD 12` row C-22; `BRIEF.md:21`).
8. The store profile has servers on, not off (`CODE eas.json:61`); `IA.md` line 13 says off. A servers-on store build hides the invite and join screens (`CODE invite/_layout.tsx:13`).
9. Settings sections as built are now "Children", "Writing", "Your letters", "Privacy and security", "Help and legal", "About", with Plan in a header section, "Where your letters live" replacing "Recordings" and "Your words" replacing the Word for word switch (`CODE settings/index.tsx:118-212`; `STR:1334-1395`). `IA.md` lines 65 to 83 describe the 31 Oct arrangement.
10. Four decisions are recorded that change how a place reads: one lock-screen string with no `{child}` and no age with names off (`RUL` ruling 3; `ERR E82`); the Days ask rides the Days flag (`ERR E57`); a paused family gets no day notes (`RUL` ruling 21); the update line lives on Me only (`ERR E58`).
11. Design rulings 25 to 37 touch no place; they fix radii, spring, glass fallback, the Home glyph, the heading level and the tab bar (`RUL`).

## 13. Open items

Each item names a place or a word with no home, or a place whose home is not fixed by any source. Owner in brackets.

- OI-1 Glossary rows for "Home" and "Me" are not in `BRAND.md` (the glossary at lines 84 to 122 has neither); `S06` proposes them and the navigation test N6(b) fails until they ship. [`content`]
- OI-2 The Me heading's job line "Account and settings" and the tab job sentences are PROPOSED slots with no approved words (`S06` Q1, section 1). [`content`, founder]
- OI-3 Me group titles "Books", "Keeping your book", "Days and reminders" and "On this phone", and "Add a book" against the built "Children" and "Add a child", have no approved words (`C 18` OQ-2; `A WORDS:89`). [`content`]
- OI-4 "Save a copy" is a PROPOSED word for the row and page built as "Export your book" and "Export"; BRAND.md names neither (`C WORDS:24,78`). [`content`, founder]
- OI-5 Where the Days row sits in Build 13 if Drop B ships: under Reminders (`.default`) or in "Days and reminders" (`.regrouped`) depends on tree test T1, which has no result on record (`C DESIGN:388`; `AUD` section 10, T1). [`user-research`, `design-systems`]
- OI-6 The Me row for NS-51 is "Photo moments" in the card (`PRD 27:80`) and the page heading is "Photos access" in `C WORDS:675` (PROPOSED). One name needed. [`content`]
- OI-7 Photos access has four ids for one sheet: A-S18, E-S32, C-S27, A-S17; which id survives is not ruled (`INDEX.md` section 7, overlap paragraph). [`design-systems`, `product`]
- OI-8 NS-25's release drop is not named in `22` section 4, and the store build shows no co-parent surface today. The drawn places (D-S12 to D-S20) have no build to land in. UNVERIFIED which drop (`PRD 22:57-68`; `CODE invite/_layout.tsx:13`). [`product`]
- OI-9 Build 13's profile and which of Share, Firsts, seals, Save a copy, Earlier versions, past letter, Read the year, Sign as another speaker and the printable PDF ship in it are not stated in any locked source; only Photo and Find are dark by instruction, and NS-09, NS-10, NS-13, NS-32, NS-33 are "on" by a review proposal (`PRD 23:165`). [`product`, founder]
- OI-10 Flag names for Photo and Find (`EXPO_PUBLIC_PHOTOS`, `EXPO_PUBLIC_BOOK_SEARCH`) are written in the cards but in no `eas.json` profile, and `CODE lib/capabilities.ts` has no entry for them; `ERR E20` says local features need their own flag family. How "dark" is enforced in the binary is not set. [`mobile`]
- OI-11 A hidden book opened from Hidden books needs a route; `B DESIGN` records "no route today" (`B DESIGN:212,586`, E-05). [`mobile`]
- OI-12 Slip position: closed in `E DESIGN` and `A DESIGN` (above the prompt block) but `A` Q-A1 stays open pending an SE 3 check (`IDX 6.3` item 3). [`design-systems`, `mobile`]
- OI-13 The first Keep haptic: card NS-44-R12 says success once; the older system motion file says none (`IDX 6.3` item 4; `RUL` ruling 33). Not a place, listed because A-S13 is the screen. [`design-systems`]
- OI-14 `docs/design/system/` (MOTION and COMPONENTS) cited by `RUL` ruling 37 and `IDX` is not on `develop`; the timing source named by the ruling cannot be opened. [`design-systems`]
- OI-15 The built Settings stack index title is "Settings" (`CODE settings/_layout.tsx:40`) while the tab heading is "Me"; a deep link to `/settings` shows "Settings" over the same body. Whether that is two names for one screen is not ruled (`S06` Q1). [`content`, `mobile`]
- OI-16 Reminders pointer row "Days" in a build with the Days flag off: typed days stay on Reminders in a flag-off build (`C 15` X5). The pointer's visible word is not written. [`content`]
- OI-17 Letter-page row "Earlier versions" and "Where the recording is" rows exist in the card list but their routes (C-S13, C-S14) have no file on `develop`. UNVERIFIED which flag hides the row. [`mobile`]
- OI-18 The Project doc named in the task could not be read here; nothing in this file rests on it. [`product`]

## 14. UNVERIFIED, in one place

The rendered tabs on a device; tab label widths; VoiceOver reading of any tab; every flag state for Build 13 other than Photo and Find; the profile Build 13 is cut from; the Project doc `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`; card 19 beyond its headings; the code of `listen`, `review`, `write`, `letter/[id]`, `read-together` and `onboarding` beyond their routes and header comments; whether copy in `packages/content/src` still says "Tonight" anywhere (my grep for quoted strings found none, which is not proof); whether `docs/design/system/` exists on another branch.

Signed: `design-systems`, 20 Nov 2026.
