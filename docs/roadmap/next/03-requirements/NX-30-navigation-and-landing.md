# Theme 30: A richer way around the app, and a Tonight that is not dull

Readiness: 21 of 28 after the founder's answers of 9 Nov (see "What the founder has now said"). Author's score (`design-systems`), `qa` to confirm. Remains: which part of "dull" he means (still a hypothesis, L1 is the default), the decision entry for the third tab (`product`), NX-33 (Photos, the content of that tab) being ready, and a device row number confirmed by a re-scan at merge time. Revised 9 Nov after his answers; the earlier version of this file is what sits on the roadmap branch at 0a613585, take this one.

| | |
|---|---|
| Working label | NX-30 (working id, see `_CONVENTIONS.md`); no backlog rank assigned yet |
| Refines | `docs/design/IA.md` ("Rules for adding a place"), `docs/design/DESIGN_LANGUAGE.md` section 12 (Tonight, tab bar), F09 (book), F12 (children), F17 (settings), F14-REQ-040 and -041 (Tonight Plus line, held row). UNVERIFIED: F14 in `docs/prd/v2/features/` is `F14-plus.md`, not a home or engagement spec; the brief's "F14 home/engagement, F15 book" does not match the file names (F09 is the book, F15 is export). Read at header level only |
| Tag | EVIDENCE for the current state (code, 9 Nov, `origin/develop` at e15e307b). HYPOTHESIS for every statement about why it feels dull or what the founder meant |
| Size | S for R1, R2, R11 (one screen each); S for the tab slot R12 and R13 (the Photos tab itself is NX-33, size M there); M if L2 is chosen |
| Gate | Decision entry for the third tab (IA.md rule; the founder has chosen it, the entry is not written). The tab ships only with NX-33 behind it. No counsel gate for R1, R2, R4, R7 or R11; the Photos tab inherits NX-33's counsel gate |
| Order | After the Build 12 store programme lane (see "What I assume" below); alongside NX-31 (onboarding) and NX-32 (account management), which this file references and does not repeat |

## What the founder has now said (9 Nov, relayed in chat; not a document)

| Statement | Status |
|---|---|
| "Landing page" is the Tonight tab | CONFIRMED (answers Q1) |
| Navigation should have "more tabs" | CONFIRMED |
| Settings and account should be easier to reach | CONFIRMED |
| The extra tab holds Photos first (add a photo to a letter, local first) | CONFIRMED. Specified in NX-33; this file holds only the tab slot |
| Search, share and family were not chosen | CONFIRMED (not specified; R5 stays a parked question) |
| He tested Build 12, which "we also push to public" | NOTED. Photos is not in Build 12 (no image picker in `apps/mobile/package.json`, per file 15 searched 9 Nov; UNVERIFIED on a branch) |
| Why Tonight is "dull" | STILL A HYPOTHESIS (H1 to H3 below). He has not said whether it means flat, empty of his own book, or one thing to do. L1 stays the recommendation as the cheapest answer to H1; a letter's photo on that row (R14) makes it livelier once Photos exists |

## The founder's words

"the navigation should add more things and the landing page is dull." (verbatim, after testing the newest TestFlight build). Nothing more is known: there is no screenshot, no named screen and no list of what was looked for. Everything below that interprets the sentence is a HYPOTHESIS.

## What I assume from the Build 12 store lane (not redone here)

| Lane item | State on 9 Nov | What this file assumes |
|---|---|---|
| Book page redesign (cover band, Read together, Months sheet, gear on the title row) | Merged, #674 | The Book keeps this layout. Nothing here redraws it. The gear on the Book cover band stays and is the first path to Settings |
| Settings regroup (header card, five groups) | Merged, #614; Erase row pinned by #693 | Settings home keeps its five groups. This file adds a second door to it and does not change its rows |
| Hide the Family tab and child row in the store build (BL-604, D-126) | Open, #665 (ready, per the tracker) | After it merges, the store build has two tabs. Tonight and Book. If it does not merge, option B below is moot and the third tab stays "coming soon" |
| Settings regroup and Family hiding in the alpha (servers-on, build 2) builds | Family screens stay for `preview` (IA.md) | Tab count is per build: two in the store build, three where family surfaces are on |

Conflict check: NX-30 touches `apps/mobile/src/app/(tabs)/index.tsx` and `(tabs)/_layout.tsx`. #665 edits `(tabs)/_layout.tsx` (read from its file list). R1 and R2 below do not need `_layout.tsx`, so they do not collide; option B would, and must wait for #665.

## Current state (verified from code, `origin/develop` e15e307b, 9 Nov)

- `apps/mobile/src/app/(tabs)/_layout.tsx`: three JS tabs, in order Tonight (`index`), Book (`book`), Family (`family`); 25 pt Phosphor icons, 13 pt labels, `tabBarAllowFontScaling: false`, Large Content Viewer on iOS, no haptic and no transition on switch. The titles are `copy.tabs` (`tonight`, `book`, `family` in `packages/content/src/strings.en.ts`). Family is still drawn on `develop`; #665 removes it from the store build.
- `apps/mobile/src/app/(tabs)/index.tsx` (Tonight, route `/`): dateline ("Asha · 7 months"), two-tone greeting by time of day, the prompt as the one large line (`promptHero`) with "Another thought", one card per waiting draft or one folded "Letters waiting to be kept" row, or, only when no draft waits and a letter is 28 to 35 days old, a "A month ago" card; "Speak" and "Type" pinned below (inline under the prompt at accessibility text sizes), a quiet "Not much today"; the `tonight` lamp scene behind. No header row, no icon buttons on the screen. Its own comment says "Nothing on Tonight counts: no totals, no days-since, no streak."
- Settings is reached from the gear on the Book cover band only (`components/book/cover-band.tsx`, `testID="book.settings"`). From Tonight that is two taps. IA.md says "the only way into Settings"; that was true on 31 Oct and still is in code.
- There is no search screen. `grep` for search in `apps/mobile/src` finds only the language picker. UNVERIFIED beyond that grep.
- There is no milestone, share-a-letter or print screen. Export is in Settings (Your data). Printed books are "not promised in v1.0" (`packages/content/BRAND.md` glossary row for the printed product). Read together is a button on the Book cover band.
- Welcome (first run) is `/onboarding`, five steps (IA.md). NX-31 owns it.
- Website: `apps/web` exists on `main`/`develop` (`Landing.tsx` named in the experience-pass critique, not re-read here). UNVERIFIED which version is live.
- The picture the team last captured is `docs/design/calm-brand/after/tonight-light.png`. It shows the prompt on a white card and a draft row, from before the current Tonight code removed the card, so it is not what the founder saw. UNVERIFIED what the TestFlight build looked like beyond the code.
- Source docs the brief names that I could not find in the repo: `proposals/v1-experience/daily-home.md`, `library.md`, `memories.md`, `proposals/book-page.md`. `git ls-files` finds none; they exist in the Project, not on disk. The merged Book page code cites `proposals/book-page.md`. I did not read them, so no statement here relies on them.

## What feels dull, and why (HYPOTHESES, no user research was done)

| # | Hypothesis | Why I think it, from the code | How to test |
|---|---|---|---|
| H1 | Tonight has one thing to look at and one thing to do, and for a parent with no waiting draft it is the same screen every night | Greeting, a prompt, two buttons. The "A month ago" card shows only when no draft waits and only for letters 28 to 35 days old, so most days there is nothing of the family's own book on screen | Show 5 parents a week-three phone with and without a row from their own book; ask what the screen is for |
| H2 | The lamp is subtle by design and may read as plain paper, especially in light mode, with Increase Contrast or Reduce Transparency on (those show plain paper by design) | `Lamp` scene `tonight`; DESIGN_LANGUAGE 2b | Photograph on a device at default brightness; compare with the website hero |
| H3 | A two-tab bar (after #665) looks thin, and "navigation should add more things" may be this | Tonight, Book only; Settings is hidden two taps deep | CONFIRMED in part: he wants more tabs and easier Settings and account |
| H4 | The founder looked for something that is not built: search, milestones, share, print | None exists (see above) | Answered: he chose Photos; search and share were not chosen |
| H5 | "Landing page" is the website or the welcome | Both are named "landing" in the experience-pass docs | Answered: it is Tonight. H5 closed |

Nothing here says the founder is wrong. The brand rules (no streaks, points, badges, gap counts, fear or guilt language; celebrate what exists) narrow what "less dull" may mean: it cannot be a progress ring or a "you have written 14 letters" tile.

## Other readings, in one place (not specified further)

- The first-run welcome: NX-31. If the answer to Q1 is the welcome, close NX-30's landing rows and hand the founder's sentence to NX-31.
- The website: no `web` handle in the roster (backlog file 08, column key); routed to `ops`. If Q1 is the website, this file's rows do not apply and `product` opens a web row.
- The app after sign-in on a new phone (a returning parent lands on the Book, `EXPERIENCE_PASS` 5.8 row 13): not touched.

## The three questions, and what came back

1. Which screen is "landing page"? Answered: Tonight.
2. Which things were missing in the navigation? Answered: more tabs, and Settings and account easier to reach; the extra tab holds Photos first. Search, share and family not chosen.
3. What does "dull" mean on Tonight? NOT answered. Asked again as the one open question: does it look flat (colour, picture, light), show nothing of your own book, or offer one thing to do? Default kept: nothing of your own book (L1).

## Navigation options

The store build after #665 has two tabs (Tonight, Book). Tabs are navigation, never actions (HIG; DESIGN_LANGUAGE 12). The founder has chosen "more tabs" and the first extra tab is Photos, so option B below is now the plan; option A stays as the doors that ship with it.

### Option A: two tabs, more doors (kept: the doors are part of the plan)

```
Tonight                         Book (unchanged, #674)
+--------------------------+    +--------------------------+
| ASHA . 7 MONTHS    [gear]|    | Asha's book        [gear]|
|                          |    | 7 months                 |
| Good evening, Mama.      |    | [ Read together ]        |
| (the prompt)             |    | [Months]                 |
|                          |    | (months)                 |
+--------------------------+    +--------------------------+
| (moon) Tonight | (book) Book|
+--------------------------+
```

- The gear on Tonight opens Settings home in 1 tap. Settings home's header card opens Account when sign-in is on (`headerCard()`, #614, as NX-32 describes), so Account is 2 taps from Tonight (3 today: Book, gear, card). Tonight gets no second account control: one gear, not a gear and an avatar. NX-32 owns what is inside Account and keeps Delete account where it is (NX-32-R19).
- Without a third tab the bar is thin (H3). That is the reason for B.

### Option B (now recommended): three tabs, the third is Photos

```
Tonight                       Book                       Photos
+------------------------+    +------------------------+ +------------------------+
| ASHA . 7 MONTHS  [gear]|    | Asha's book      [gear]| | Photos           [gear]|
| Good evening, Mama.    |    | ...                    | | Asha                   |
| (the prompt)           |    |                        | | +------+ +------+      |
| [Speak]   [Type]       |    |                        | | | pic  | | pic  |      |
| From the book (row)    |    |                        | | +------+ +------+      |
+------------------------+    +------------------------+ | This month             |
| (moon)Tonight|(book)Book|(image)Photos|                | +------+ +------+      |
+----------------------------------------+                +------------------------+
```

- The tab label is "Photos", a noun, one word (the HIG and `DESIGN_LANGUAGE` rules the existing tabs follow). Icon: a Phosphor image glyph, 25 pt, filled when selected (UNVERIFIED which glyph file exists under `phosphor-react-native/src/icons`; `design-systems` picks and checks the import path the way `_layout.tsx` does).
- What the tab shows, the picker, limits, storage, privacy and erase are NX-33 (not repeated here). This file only fixes the slot: third position, after Book, same lamp-free paper, same no-count rule, the gear in its top row.
- Where family surfaces are on (alpha `preview`), Family would be a fourth tab. That is UNVERIFIED as a design (4 labels at AX5) and not recommended: the store build hides Family (#665) and Photos does not need it. Decision for `product`: in `preview`, is Family a fourth tab or a row inside Settings.
- The tab appears only when the Photos feature is on in the build (R12). With it off the bar is the two-tab bar above, with no empty "Photos" tab. A tab for a feature that does not exist breaks "celebrate what exists".

Trade-off against the brand: a third item is one more thing to scan, so it must be a place where the parent sees what they have (their own photos), never a place with a count of what is missing, a "first photo" prompt or a badge. The bar's labels do not scale (13 pt, Large Content Viewer at accessibility sizes), and three items at 390 pt is about 130 pt each, which should fit; not measured (UNVERIFIED, R13 proves it).

## Landing options (Tonight)

### Option L1: the same room, with your own book in it (recommended)

```
+----------------------------------+
| ASHA . 7 MONTHS            [gear]|
| Good evening, Mama.              |
|                                  |
| What is Asha's favorite thing    |
| in the house this week?          |
| (arrows) Another thought         |
|                                  |
| [mic Speak]      [pencil Type]   |
|        Not much today            |
|                                  |
| From the book                    |
| +------------------------------+ |
| | A month ago           (play) | |
| | "She laughed at the dog"  | |
| +------------------------------+ |
+----------------------------------+
```

- The existing `ResurfacedCard` is shown below the actions when a kept letter exists, even when drafts wait (today only when none wait). Drafts stay above.
- Uses data and components that exist. No new motion beyond once per cold launch.

### Option L2: the book on the table, and a voice (bigger, later)

```
+----------------------------------+
| ASHA . 7 MONTHS            [gear]|
| [cover: Asha's book, 7 months]   |
| Good evening, Mama.              |
| (the prompt)  Speak  Type        |
| Hear a letter                    |
| ( play )  Month 2, in your voice |
+----------------------------------+
```

- A cover thumbnail (the Book's `BookCover`) and a tap-to-hear row that plays a kept letter's recording in place. Never autoplays.
- New playback state shared across tabs; the Book already has a voice marker (#674). Larger risk and a larger test surface. UNVERIFIED how playback behaves if the person moves to Listen (a capture room) while it plays.

Trade-off against the brand: both show only what exists, never a count, never a gap. L2's voice row is the stronger emotional payoff and the larger risk (audio in a room where the person is about to record; a recording that plays aloud near a sleeping child).

## Recommendation (revised 9 Nov)

1. Landing: Tonight (confirmed). Keep L1: one kept letter from the book under Speak and Type every day there is one. "Dull" is still a hypothesis until the founder answers question 3.
2. Navigation: option B plus the doors of option A. A third tab, Photos, behind the build switch NX-33 owns; the gear on Tonight opens Settings in 1 tap and Account in 2 (via the header card).
3. Order: after #665 merges (it edits `(tabs)/_layout.tsx`), and the Photos tab ships only when NX-33's add-a-photo flow does. The gear and the From the book row (R1, R2) can ship first and alone.
4. No search, share or family tab (not chosen), no counts or badges, no new motion.
5. A letter's photo shows as a thumbnail on the From the book row once Photos exists (R14).

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-30-R1 | EVIDENCE | Given Tonight (store build, one child), When I tap the gear named "Settings" in Tonight's top row, Then Settings home opens in 1 tap and back returns to Tonight. Given sign-in is on and the phone is signed in, Then the Settings header card (existing, #614) opens Account in 1 more tap (2 from Tonight), and Tonight itself holds 0 account controls. | Tonight has no top row; Settings is reached from the Book gear only (2 taps, `cover-band.tsx`). | `IA.md` Book section |
| NX-30-R2 | EVIDENCE | Given a book with at least 1 kept letter that is not private, When Tonight shows (with 0, 1 or 3 waiting drafts), Then 1 "From the book" row shows a kept letter below Speak and Type, and the waiting drafts stay above the actions' row, unchanged in order. | `resurfaced()` is read only when `cards.length === 0` and the newest letter is 28 to 35 days old (`index.tsx`, `draft-card.logic.ts:190`). | design intent (L1) |
| NX-30-R3 | EVIDENCE | Given a private letter (marked Private), When Tonight picks the row, Then it is never chosen, and the row's words are the person's own first words, ending on a whole word. | Same rule exists for "A month ago"; the new rule must not weaken it (`resurfaced` tests). | existing S09 rule |
| NX-30-R4 | EVIDENCE | Given any Tonight state, Then the screen shows 0 numerals about letters kept, days since or time left, and no new badge, ring or dot on a tab or the gear (scan of the visible text and accessibility labels of 5 states). | Passes today; the row exists to stop R2 and R1 breaking it. | CLAUDE.md content rules; Tonight header comment |
| NX-30-R5 | HYPOTHESIS | Given search is ever wanted (the founder did not choose it on 9 Nov), When it is specified, Then it is a separate theme (not a navigation tweak) with its own privacy review: searched words are letter text and never reach analytics or logs. Test: none, study (`user-research`, then `product`). | No search exists. | Q2 |
| NX-30-R6 | HYPOTHESIS | Decided 9 Nov by the founder in chat: a third tab, Photos. Given that, When `product` writes the decision entry and the IA.md row, Then it records the tab, its label and its build switch, and says what Family does in `preview` (fourth tab or a Settings row). Test: none, decision (`product`, founder). The build rows are R12 and R13. | IA.md "Rules for adding a place" requires an entry; none is written. | IA.md |
| NX-30-R7 | EVIDENCE | Given Dynamic Type at AX5 and VoiceOver on, When Tonight opens, Then focus order is: dateline, greeting (heading), prompt, Another thought, Speak, Type, Not much today, From the book row, Settings, and every control is 44 pt or larger; the greeting and the row's words are never truncated. | The top row and the new row do not exist yet. | A-NFR-005 to A-NFR-007; DESIGN_LANGUAGE H1 |
| NX-30-R8 | EVIDENCE | Given Reduce Motion on, When Tonight opens or a letter changes, Then the new row appears without movement, and it enters once per cold launch (not on tab switch or return from Listen). | The row is new. | MOTION 5.8 rule 2 |
| NX-30-R9 | HYPOTHESIS | Given option L2 is chosen, When a parent taps "Hear a letter", Then audio plays only on the tap, stops on Speak, Type and when the app goes to the background, and never plays in a capture room. Test: device row only; not handed to engineering until Q3 says "a voice". | Not built. | L2 |
| NX-30-R10 | HYPOTHESIS | Given 5 parents shown Tonight with and without the From the book row, Then most name the row as the reason to open it (a study, not a pass bar). Test: none, study (`user-research`). | No study exists; H1 to H3 are untested. | H1 |
| NX-30-R11 | EVIDENCE | Given Tonight, Book and Photos each draw their own top row, When the person taps the gear on any of the three, Then Settings home opens (1 tap) and back returns to the tab they were on. | Only the Book draws a gear (`cover-band.tsx`). | IA.md |
| NX-30-R12 | EVIDENCE | Given the Photos feature switch (owned by NX-33) is on, When the app opens, Then the bar shows exactly 3 tabs in the order Tonight, Book, Photos, with the titles from `copy.tabs`, 25 pt icons, 13 pt labels and a 44 pt target each; Given the switch is off, Then exactly 2 tabs (Tonight, Book) and 0 Photos route reachable by link. | `_layout.tsx` declares `index`, `book`, `family`; no Photos route exists. | DESIGN_LANGUAGE 12 |
| NX-30-R13 | EVIDENCE | Given 3 tabs at Dynamic Type AX5 on an iPhone SE 3 (320 pt wide) and VoiceOver, Then all 3 labels show in full with 0 clipped, VoiceOver reads "Tonight, tab, 1 of 3", "Book, tab, 2 of 3", "Photos, tab, 3 of 3", and a long press shows the Large Content Viewer with the tab's title. | The bar has `tabBarAllowFontScaling: false` and a Large Content Viewer; not proven with 3 items on a small phone (UNVERIFIED). | A-NFR-005 to -007 |
| NX-30-R14 | EVIDENCE | Given the From the book row (R2) picks a letter that has a photo (NX-33), When Tonight shows it, Then the row shows that photo as a thumbnail beside the letter's own first words, with no caption added, and the row's accessibility label is the letter's words only (never a generated description). Given the letter has no photo, Then the row is unchanged. | The row and the photo do not exist. Waits for NX-33. | NX-33; constitution |
**Shown / Records / Never / Decline:** no person agrees to anything in these rows, so no door lines. A letter shown on Tonight stays on the phone; the row opens the same page the Book opens.

## Edge cases

No kept letter yet (the row is absent, nothing says "no letters yet"); only private letters (absent); a quiet-day mark (never chosen, it has no words); two children (the row follows the active book); the book is hidden or being deleted (absent); a letter still transcribing (absent until it has words); very long first words (whole-word cut, never mid-word, wraps at AX5); after midnight or a resume (read again on focus, as Tonight already does); a day the letter picked yesterday is chosen again (stable per day, not random per visit; engineering picks the rule, proposed: same letter for the whole local day).

## Offline behaviour

Fully local. Settings and the row read the phone's store only. No network call is added.

## What we never do

A count, streak, badge, dot or "you have not written for N days" on Tonight, the tab bar or the gear. A fear, guilt or loss line. Rewriting or shortening a letter's words except by the existing whole-word cut. Auto-playing a voice. Showing a private letter. Putting a letter's words, the child's name or the route in analytics.

## Copy needs (parent vocabulary only; none registered with counsel unless stated)

| Key (namespace `packages/content/src`) | Status | Words |
|---|---|---|
| `tonight.settingsButton` (accessibility label of the gear) | new. The Book's gear already has a label (key name not read, UNVERIFIED); reuse its words "Settings" | Settings |
| `tonight.fromTheBook.kicker` | new | From the book |
| `tonight.resurfaced.kicker` | exists | A month ago |
| `tonight.resurfaced.a11y` | exists | A letter from {date}. Opens the letter. |
| `tabs.tonight`, `tabs.book` | exist | Tonight, Book |
| `tabs.family` | exists; hidden in the store build by #665 | Family |
| `tabs.photos` | new; owner `content`, NX-33 holds the other Photos keys | Photos |
| Option L2 only: "Hear a letter" | new, not drafted | owner `content` |

All new strings go through `packages/content/test/rules.test.ts`. No "AI", "entry", "draft", "take" in a parent string. Never gender the child; use {child}.

## Analytics events

All analytics are off in every 1.0 profile (D-124 item 3); an event "in catalog" still sends nothing.

| Event | Status | Props |
|---|---|---|
| `book_opened` | in catalog (`packages/analytics/src/catalog.ts:579`) | existing |
| `settings_opened` with `from: oneOf('book','tonight')` | add to catalog first (catalog and `docs/analytics/TRACKING_PLAN.md` in the same PR) | no content, no child name |
| `tonight_book_row_opened` | add to catalog first | none |
| `tab_selected` (which tab) | not in the catalog (the catalog has `book_opened` and the Family teaser event only); not proposed here. If `product` wants tab use, add to catalog first with `tab: oneOf('tonight','book','photos')` and no content | |
| any search event | not allowlisted; none proposed | letter text must never enter analytics |

## Device rows

I scanned the patches of the 101 open PRs on 9 Nov for `S1-1xx` ids. Used: S1-110, -112, -131 to -135, -140, -144, -150, -151, -152 (the highest on `develop` is S1-152, in `docs/qa/DEVICE_TEST_PLAN.md`). #684 and #680 both claim S1-133 to -135 in different files (a clash, not mine). I take none yet. Proposed, to confirm by a fresh scan when `qa` merges: S1-160 (Settings gear and the From the book row, rows (a) gear opens Settings in 1 tap, (b) row with drafts waiting, (c) AX5 and VoiceOver order, (d) Reduce Motion, (e) dark mode) and S1-161 (the Photos tab at AX5 on a small phone, R12 and R13, with NX-33's rows) and S1-162 (option L2 playback, only if chosen). NX-33 proposes its own rows after S1-162; take numbers from one fresh scan, not two. Record: phone, iOS version, build number, text size, a screen recording with Asha only.

## Dependencies

#665 (hide Family) before any tab change; it edits the same `_layout.tsx` as R12. NX-33 (Photos) for the tab's content and for R14. NX-32 for the Account screen and its header-card entry (R1 only adds the gear). #674 and #614 are merged and assumed. File 15 (capability gap analysis, other lane, not read) for search, milestones, share, print. NX-31 (onboarding) and NX-32 (account management, includes where Account and Sign out live) are referenced, not duplicated: if NX-32 moves Account or Settings entry points, R1 follows it.

## Engineering block

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. Local screens only. |
| Budget (`06-nfr.md`) | Tonight's first frame does not wait on the new row (it reads the store synchronously like `readRoom`). No number measured. UNVERIFIED against the launch-time rows in `06-nfr.md` |
| Accessibility | R7 and R8. Gear: 44 pt minimum target, label "Settings", role button. Row: one element, label from `tonight.resurfaced.a11y`. No colour-only signal. Contrast in both themes with the lamp on (the lamp test samples text boxes; the new row's text box must be added to `apps/mobile/test/lamp.test.ts`, UNVERIFIED how) |
| Switch, off behaviour, noticed by | Proposed: no runtime flag (remote config may not change what the app shows or collects, `capabilities.ts`). If the founder wants a switch, a build-time constant in `capabilities.ts`, on in `testflight` and `preview`, off in `production` until S1-160 passes. Rollback: revert the PR. Noticed by: device row |
| Data class and retention | L1 to L3, local only (letter words stay on the phone). Nothing new stored |
| Schema and grants | None |
| Analytics events | Above |

## Owner lanes

`design-systems`: this spec, tab and gear patterns in `docs/design/COMPONENTS.md` after build. `mobile`: R1, R2, R3, R7, R8 (screens). `content`: the new keys. `qa`: S1-160 and the tests below. `user-research`: R10 and H1 to H5. `product`: decision entry if a tab is added, back-log rows and `_ID-MAP.md`. `ops`: website, if Q1 is the website.

## Trace and tests

Id convention: `_CONVENTIONS.md`. Paths marked proposed do not exist yet.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-30-R1 | IA.md | proposed `apps/mobile/test/tonight-settings-door.test.ts`; `[NX-30-R1] Tonight opens Settings in one tap` | S1-160 (a) (proposed) |
| NX-30-R2 | F14-REQ-041 | proposed `apps/mobile/test/tonight-from-the-book.test.ts`; `[NX-30-R2] a kept letter shows below the actions with 0, 1 and 3 drafts waiting` | S1-160 (b) |
| NX-30-R3 | S09 rule | same file; `[NX-30-R3] a private letter or a quiet day is never chosen` | none |
| NX-30-R4 | CLAUDE.md content rules | same file; `[NX-30-R4] Tonight shows no count, streak or badge in 5 states` | none |
| NX-30-R5 | none | none, study | none |
| NX-30-R6 | IA.md | none, decision | none |
| NX-30-R7 | A-NFR-005 to -007 | proposed `apps/mobile/test/tonight-a11y-order.test.ts`; `[NX-30-R7] reading order and 44 pt targets at AX5` | S1-160 (c) |
| NX-30-R8 | MOTION 5.8 | same file as R2; `[NX-30-R8] the row never moves under Reduce Motion and enters once per launch` | S1-160 (d) |
| NX-30-R11 | IA.md | proposed `apps/mobile/test/tonight-settings-door.test.ts`; `[NX-30-R11] the gear on every tab opens Settings and back returns` | S1-160 (a) |
| NX-30-R12 | DESIGN_LANGUAGE 12 | proposed `apps/mobile/test/tabs-photos.test.ts`; `[NX-30-R12] three tabs with Photos on, two with it off, no Photos route when off` | S1-161 |
| NX-30-R13 | A-NFR-005 to -007 | same file; `[NX-30-R13] three tab labels at AX5 are whole and ordered for VoiceOver` | S1-161 |
| NX-30-R14 | NX-33 | proposed `apps/mobile/test/tonight-from-the-book.test.ts`; `[NX-30-R14] the row shows the letter's photo and adds no caption` | S1-160 (b) |
| NX-30-R9 | none | none until L2 is chosen | S1-161 (proposed) |
| NX-30-R10 | none | none, study (`user-research`) | none |

Trace: NX-30-R1..R14 -> IA.md (rules for adding a place), F09, F14-REQ-040, F14-REQ-041, A-NFR-005, A-NFR-006, A-NFR-007.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Which screen is the landing page | Decided: Tonight |
| More tabs and easier Settings and account | Decided: Photos tab, gear on Tonight |
| What "dull" means on Tonight (question 3) | Open. Default: shows nothing of your own book (L1) |
| Family in `preview`: a fourth tab or a Settings row | A Settings row (a fourth tab strains AX5 and the store build has none) |
| A build switch for Tonight's new row | No runtime flag; a build-time constant off in `production` until the device row passes, if he wants one |

## Not verified

The Tonight the founder actually saw (build number, light or dark mode, text size). Whether the TestFlight build matches `origin/develop` e15e307b. The content of `proposals/v1-experience/daily-home.md`, `library.md`, `memories.md` and `proposals/book-page.md` (not in the repo). File 15. The F14 and F15 spec text (header read only). The `apps/web` landing page and which version is live. Whether the AX5 tab bar fits a third item. The Book gear's content key name. Whether `lamp.test.ts` needs a new measured box. The launch-time budget. Whether #665 merges unchanged. Whether a Phosphor image glyph is importable the way `_layout.tsx` imports the others. How Family sits next to Photos in `preview`. Everything in "What feels dull" is a hypothesis; no user was asked.
