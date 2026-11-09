# Theme 30: A richer way around the app, and a Tonight that is not dull

Readiness: 20 of 28 after the founder's answers of 8 and 9 Nov (see "What the founder has now said"). Author's score (`design-systems`), `qa` to confirm. Remains: which part of "dull" he means (still a hypothesis, L1 is the default), the label of the fourth tab ("You" is a placeholder), the decision entry for the new tabs (`product`), NX-33 (Photos) and NX-32 (Account rows) being ready, the baseline run of the evaluation, and a device row number confirmed by a re-scan at merge time. Revised twice after his answers (Photos tab, then a four-button bar); the earlier version on the roadmap branch (0a613585) is superseded, take this one.

| | |
|---|---|
| Working label | NX-30 (working id, see `_CONVENTIONS.md`); no backlog rank assigned yet |
| Refines | `docs/design/IA.md` ("Rules for adding a place"), `docs/design/DESIGN_LANGUAGE.md` section 12 (Tonight, tab bar), F09 (book), F12 (children), F17 (settings), F14-REQ-040 and -041 (Tonight Plus line, held row). UNVERIFIED: F14 in `docs/prd/v2/features/` is `F14-plus.md`, not a home or engagement spec; the brief's "F14 home/engagement, F15 book" does not match the file names (F09 is the book, F15 is export). Read at header level only |
| Tag | EVIDENCE for the current state (code, 9 Nov, `origin/develop` at e15e307b). HYPOTHESIS for every statement about why it feels dull or what the founder meant |
| Size | S for R2 (one screen); M for the bar, the You tab and its routes (R1, R11 to R13, R15 to R18); the Photos tab itself is NX-33 (M there); M if L2 is chosen |
| Gate | Decision entry for the new tabs (IA.md rule; the founder has chosen them, the entry is not written) and the one-line IA.md update listed below. The Photos tab ships only with NX-33 behind it. No counsel gate for the You tab (it moves existing screens; NX-32 owns any new Account words); the Photos tab inherits NX-33's counsel gate |
| Order | After the Build 12 store programme lane (see "What I assume" below); alongside NX-31 (onboarding) and NX-32 (account management), which this file references and does not repeat |

## What the founder has now said (9 Nov, relayed in chat; not a document)

| Statement | Status |
|---|---|
| "Landing page" is the Tonight tab | CONFIRMED (answers Q1) |
| Navigation should have "more tabs" | CONFIRMED |
| Settings and account (profile) should be easier to reach | CONFIRMED |
| The extra tab holds Photos first (add a photo to a letter, local first) | CONFIRMED. Specified in NX-33 (a separate file, not yet on this branch's base); this file holds only the tab slot |
| "Start evaluation and a nav with 4 buttons. Setting more accessible. Profile more accessible." (founder chat, Sun 8 / Mon 9 Nov, relayed) | CONFIRMED as a request: a four-button bottom bar and an evaluation. It SUPERSEDES the earlier "no third tab" advice in this file and the three-tab option B. The label of the fourth button is the coordinator's working name "You" (placeholder, not the founder's word) |
| Search, share and family were not chosen | CONFIRMED (not specified; R5 stays a parked question) |
| He tested Build 12, which "we also push to public" | NOTED. Photos is not in Build 12 (no image picker in `apps/mobile/package.json`, per file 15 searched 9 Nov; UNVERIFIED on a branch). Which commit Build 12 was cut from was not checked; counts "before" below are from `develop` e15e307b |
| Why Tonight is "dull" | STILL A HYPOTHESIS (H1 to H3 below). He has not said whether it means flat, empty of his own book, or one thing to do. L1 stays the recommendation as the cheapest answer to H1; a letter's photo on that row (R14) makes it livelier once Photos exists |

## The founder's words

"the navigation should add more things and the landing page is dull." (verbatim, after testing the newest TestFlight build). Nothing more is known: there is no screenshot, no named screen and no list of what was looked for. Everything below that interprets the sentence is a HYPOTHESIS.

## What I assume from the Build 12 store lane (not redone here)

| Lane item | State on 9 Nov | What this file assumes |
|---|---|---|
| Book page redesign (cover band, Read together, Months sheet, gear on the title row) | Merged, #674 | The Book keeps this layout. Nothing here redraws it. The gear on the Book cover band stays and is the first path to Settings |
| Settings regroup (header card, five groups) | Merged, #614; Erase row pinned by #693 | Settings home keeps its five groups. This file adds a second door to it (the You tab) and does not change its rows |
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

The store build after #665 has two tabs (Tonight, Book). Tabs are navigation, never actions (HIG; DESIGN_LANGUAGE 12). The founder has asked for four buttons.

- Option B (kept for the record, now the fallback): three tabs, Tonight, Book, Photos, with a gear on Tonight opening Settings. Settings 1 tap from Tonight, Account 2.
- Option C (recommended, per the founder's request): four tabs, Tonight, Book, Photos, You. Settings 1 tap and Account (profile) 2 taps from every tab, no gear needed on Tonight or Photos.

### Option C: the four-button bar

```
Tonight                  Book                    Photos                  You
+--------------------+  +--------------------+  +--------------------+  +--------------------+
| ASHA . 7 MONTHS    |  | Asha's book  [gear]|  | Photos             |  | You                |
| Good evening, Mama.|  | 7 months           |  | Asha               |  | +----------------+ |
| (the prompt)       |  | [ Read together ]  |  | +------+ +------+  |  | | Mama (profile) | |
| [Speak]    [Type]  |  | [Months]           |  | | pic  | | pic  |  |  | | Account    >   | |
| From the book (row)|  | (months)           |  | +------+ +------+  |  | +----------------+ |
|                    |  |                    |  | This month         |  | Plan               |
|                    |  |                    |  |                    |  | Children, Writing, |
|                    |  |                    |  |                    |  | Your data, Help    |
+--------------------+  +--------------------+  +--------------------+  +--------------------+
| (moon)Tonight | (book)Book | (image)Photos | (person)You |
+--------------------------------------------------------------------+
```

The You tab root is the existing Settings home (#614: header card, Plan row, five groups), not a new screen of rows. The header card is the profile: the name the parent signs as, and it opens Account when sign-in is on (NX-32 owns Account and everything under it; cited here, not edited).

### The bar, specified

| Topic | Rule |
|---|---|
| Order and labels | Tonight, Book, Photos, You, left to right (`copy.tabs.tonight`, `book`, `photos` new, `you` new). Single words, nouns or a pronoun, no verbs, each 3 to 7 letters. "You" is a placeholder: `content` and `design-systems` confirm, with "Settings" and "Me" as the alternatives to test (evaluation question 5) |
| Icons | 25 pt Phosphor, regular, fill when selected (as today): moon-stars (Tonight), book-open (Book), an image glyph (Photos), a user-circle glyph (You). UNVERIFIED that the image and user glyph files exist under `phosphor-react-native/src/icons`; `design-systems` checks the import path the way `_layout.tsx` does. Never a gear on the tab (the Book gear stays a gear; one symbol, one meaning) |
| VoiceOver | Each tab reads its title then "tab, N of 4" (N of 3 when Photos is off). Selected state is announced. You is read as "You, tab". The profile card reads the name and "Opens your account" (NX-32 words). Order is the visual order |
| Targets | Each tab at least 44 pt tall and wide (320 pt screen / 4 = 80 pt) |
| Dynamic Type, AX5 | Labels do not scale (`tabBarAllowFontScaling: false`, 13 pt floor `tokens.minFontSize`), as today. Rule: a label is always whole (never wraps, never truncated, never hidden, never icon-only); at accessibility text sizes a long press shows the Large Content Viewer with the title (exists, `LARGE_CONTENT`). If a label cannot fit in 80 pt at 13 pt on a 320 pt phone the bar fails its test (R13) and the label is shortened; the bar is never made icon-only and the font never goes below the floor. UNVERIFIED that "Tonight" and "Photos" fit; the widest is about 50 pt at 13 pt Mukta Medium, not measured. Other languages are English-only today (D-125); each language's four labels get their own width test before it ships |
| Badges | None, on any tab, ever: no count, no dot, no colour change. Nothing "needs attention" on You: an account problem shows as one calm line inside Account, never on the bar. No app icon badge number is set (UNVERIFIED that no code sets one today) |
| Motion | None on tab change (as today, MOTION 5i). Reduce Motion changes nothing |
| Lamp | Tonight, Book keep their scenes; Photos and You have none (plain paper, like Settings today, DESIGN_LANGUAGE 2b) |
| Tab count per build | Photos switch off (NX-33): 3 tabs (Tonight, Book, You). Photos on: 4. `preview` builds with family surfaces: still 4; Family never a fifth tab (below) |

### What happens to Family (#665)

#665 hides the Family tab and the child row in the store build. This file adds no Family tab back. Where family surfaces are on (alpha `preview`), Family content becomes one row inside You, under Children (UNVERIFIED design; `product` decides, R18), never a fifth tab: five labels at AX5 on 320 pt is 64 pt each, which I expect to fail and have not measured. The existing Family screens and routes stay as they are; only their door moves. In the store build nothing of Family is reachable, as #665 intends.

### Links, reminders, first run

- Cold launch opens Tonight, always (not the last tab). Reminder taps open the app on Tonight: a reminder is the nudge to speak, and the tab never changes because of a notification (UNVERIFIED how a tap routes today: `lib/reminders/scheduler.ts` sets `data.source` and `lib/analytics/observers.ts` listens for a tap, but no route handling was found in the search).
- Links: `+native-intent.tsx` already sends `/listen`, `/review`, `/read-together` links to Tonight, never to a capture room. The same rule covers `/photos` and `/you`: no outside link opens the photos grid or the profile; both land on Tonight. Invite and sign-in links keep their own routes and open over whichever tab is showing. App lock covers all four tabs.
- First run and sign-in: the bar does not exist during the age gate, sign-in or onboarding (`/onboarding` is outside the tabs and Tonight redirects there while no book exists, `index.tsx`). NX-31 is being revised so that sign-in comes before the book opens (founder, relayed; the revision was not read, UNVERIFIED). Consequence for this file: in a build with sign-in on, You shows the profile from the first launch (no signed-out card to design); in a build with sign-in off, You shows the signs-as name only (the existing header card behaviour, NX-32-R1). The first time the bar appears is after "The book is open." and Tonight is selected.

### Cost of four tabs against option B

| | B: three tabs plus a gear on Tonight | C: four tabs |
|---|---|---|
| Taps to Settings, to Account (sign-in on) from Tonight | 1, 2 | 1, 2 (same from Book and Photos) |
| Settings doors to keep correct | 3 gears (Tonight, Book, Photos) | 1 tab plus the Book gear already there |
| Bar width at AX5 on 320 pt | 107 pt per item | 80 pt per item; labels fixed at 13 pt |
| Code | a gear in two more headers | one new tab route that renders the Settings home, Settings sub-pages unchanged as root stack routes (as `/letter/[id]` is today, UNVERIFIED for nesting); a route list update (R-L: `isCaptureRoute`, `resilience.test.ts`) |
| Risk to #614 | none | the Settings home component must be one component used by `/settings` and the tab; a copy would break `test/account-deletion-switch.test.ts` on purpose (it pins `settings/index.tsx` as the only file naming `/settings/delete-account`; NX-32-R19) |
| Brand | a gear on a screen about tonight | a fourth item to scan; calm if it has no badge |
| Can ship before Photos | gear yes | the You tab yes (3 tabs), Photos later |

Trade-off: C asks more of the bar (80 pt items) and of the route work, and gives the founder what he asked: Settings and profile equally reachable from everywhere. If the evaluation (below) fails on the bar, the fallback is B.

## Landing options (Tonight)

### Option L1: the same room, with your own book in it (recommended)

```
+----------------------------------+
| ASHA . 7 MONTHS                  |
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
| ASHA . 7 MONTHS                  |
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

## Recommendation (revised for the four-button request)

1. Landing: Tonight (confirmed). Keep L1: one kept letter from the book under Speak and Type every day there is one. "Dull" is still a hypothesis until the founder answers question 3.
2. Navigation: option C, a four-button bar: Tonight, Book, Photos, You. You is the existing Settings home as a tab (profile card first, then Plan and the five groups). Settings 1 tap, Account 2 taps, from any tab. No gear on Tonight or Photos; the Book gear keeps working unchanged.
3. Order: after #665 merges (same `(tabs)/_layout.tsx`). The You tab can ship first and alone (three tabs); Photos joins when NX-33's flow does.
4. No badges, counts or dots on any tab. No search, share or Family tab (not chosen). Fallback if the evaluation fails on the bar: option B.
5. Judge it by the evaluation below, with a baseline run on the current build before any code.
6. A letter's photo shows as a thumbnail on the From the book row once Photos exists (R14).

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-30-R1 | EVIDENCE | Given Tonight, Book or Photos (store build, one child), When I tap the tab named "You", Then Settings home opens (header card, Plan, groups as #614 draws them) in 1 tap; Given sign-in is on and the phone is signed in, Then the header card opens Account in 1 more tap (2 from any tab). Tonight and Photos hold 0 gear icons. | Today Settings is 2 taps from Tonight (Book, gear) and Account is 3 (Book, gear, header card). No You tab exists (`_layout.tsx` declares `index`, `book`, `family`). | IA.md Book section; NX-32 |
| NX-30-R2 | EVIDENCE | Given a book with at least 1 kept letter that is not private, When Tonight shows (with 0, 1 or 3 waiting drafts), Then 1 "From the book" row shows a kept letter below Speak and Type, and the waiting drafts stay above the actions' row, unchanged in order. | `resurfaced()` is read only when `cards.length === 0` and the newest letter is 28 to 35 days old (`index.tsx`, `draft-card.logic.ts:190`). | design intent (L1) |
| NX-30-R3 | EVIDENCE | Given a private letter (marked Private), When Tonight picks the row, Then it is never chosen, and the row's words are the person's own first words, ending on a whole word. | Same rule exists for "A month ago"; the new rule must not weaken it (`resurfaced` tests). | existing S09 rule |
| NX-30-R4 | EVIDENCE | Given any Tonight state, Then the screen shows 0 numerals about letters kept, days since or time left, and no new badge, ring or dot on a tab or the gear (scan of the visible text and accessibility labels of 5 states). | Passes today; the row exists to stop R2 and R1 breaking it. | CLAUDE.md content rules; Tonight header comment |
| NX-30-R5 | HYPOTHESIS | Given search is ever wanted (the founder did not choose it on 9 Nov), When it is specified, Then it is a separate theme (not a navigation tweak) with its own privacy review: searched words are letter text and never reach analytics or logs. Test: none, study (`user-research`, then `product`). | No search exists. | Q2 |
| NX-30-R6 | HYPOTHESIS | Decided by the founder in chat: four buttons, the fourth a placeholder "You". Given that, When `product` writes the decision entry and the IA.md rows, Then it records the four tabs, their labels, the Photos build switch, the one-line IA.md change below and what Family does in `preview` (R18). Test: none, decision (`product`, founder). Build rows are R12 and R13. | IA.md "Rules for adding a place" requires an entry; none is written. | IA.md |
| NX-30-R7 | EVIDENCE | Given Dynamic Type at AX5 and VoiceOver on, When Tonight opens, Then focus order is: dateline, greeting (heading), prompt, Another thought, Speak, Type, Not much today, From the book row, then the tab bar (Tonight, Book, Photos, You), and every control is 44 pt or larger; the greeting and the row's words are never truncated. | The top row and the new row do not exist yet. | A-NFR-005 to A-NFR-007; DESIGN_LANGUAGE H1 |
| NX-30-R8 | EVIDENCE | Given Reduce Motion on, When Tonight opens or a letter changes, Then the new row appears without movement, and it enters once per cold launch (not on tab switch or return from Listen). | The row is new. | MOTION 5.8 rule 2 |
| NX-30-R9 | HYPOTHESIS | Given option L2 is chosen, When a parent taps "Hear a letter", Then audio plays only on the tap, stops on Speak, Type and when the app goes to the background, and never plays in a capture room. Test: device row only; not handed to engineering until Q3 says "a voice". | Not built. | L2 |
| NX-30-R10 | HYPOTHESIS | Given 5 parents shown Tonight with and without the From the book row, Then most name the row as the reason to open it (a study, not a pass bar). Test: none, study (`user-research`). | No study exists; H1 to H3 are untested. | H1 |
| NX-30-R11 | EVIDENCE | Given the Book, When the person taps its gear (`testID="book.settings"`), Then Settings opens exactly as today with the same content and the back button returns to the Book; the gear is not removed or moved by this theme, and the Settings home is one component shared with the You tab (not a copy). | The gear works today; no test pins that a second Settings door shares the component (`test/account-deletion-switch.test.ts` pins one file naming `/settings/delete-account`). | #674; #614; NX-32-R19 |
| NX-30-R12 | EVIDENCE | Given the Photos switch (owned by NX-33) is on, When the app opens, Then the bar shows exactly 4 tabs in the order Tonight, Book, Photos, You, titles from `copy.tabs`, 25 pt icons, 13 pt labels, 44 pt targets; Given it is off, Then exactly 3 (Tonight, Book, You) and a link to `/photos` lands on Tonight. In the store build after #665 Family is never a tab. | `_layout.tsx` declares `index`, `book`, `family`; no Photos or You route exists. | DESIGN_LANGUAGE 12 |
| NX-30-R13 | EVIDENCE | Given 4 tabs at Dynamic Type AX5 on an iPhone SE 3 (320 pt wide) and VoiceOver, Then all 4 labels show whole (0 wrapped, 0 truncated, 0 hidden, never icon-only) at 13 pt, VoiceOver reads "Tonight, tab, 1 of 4" through "You, tab, 4 of 4", and a long press shows the Large Content Viewer with the title. | The bar has `tabBarAllowFontScaling: false` and a Large Content Viewer; never proven with 4 items on a 320 pt phone (UNVERIFIED). | A-NFR-005 to -007 |
| NX-30-R14 | EVIDENCE | Given the From the book row (R2) picks a letter that has a photo (NX-33), When Tonight shows it, Then the row shows that photo as a thumbnail beside the letter's own first words, with no caption added, and the row's accessibility label is the letter's words only (never a generated description). Given the letter has no photo, Then the row is unchanged. | The row and the photo do not exist. Waits for NX-33. | NX-33; constitution |
| NX-30-R15 | EVIDENCE | Given any of 8 states (new book, sign-in problem, unsent letters, a draft waiting, Plus lapsed, a new Plus line, a reminder due, Photos empty), Then the bar draws 0 badges, 0 dots, 0 count and 0 colour change on any tab, and the app icon badge is not set. | Passes by absence today; a scan pins it. | CLAUDE.md content rules |
| NX-30-R16 | EVIDENCE | Given a cold launch, a reminder tap, and links `scribe://photos`, `scribe://you`, `scribe://listen`, When the app opens, Then Tonight is shown each time (0 of 4 open another tab or a capture room), after the 18+ gate and the App lock. | The capture-route rule exists in `+native-intent.tsx`; no `/photos` or `/you` rule exists; reminder-tap routing was not found (UNVERIFIED). | `+native-intent.tsx`; PRD-REQ-019 |
| NX-30-R17 | EVIDENCE | Given the age gate, sign-in or onboarding is showing, Then the bar is absent (0 tabs) and the first Tonight after "The book is open." has Tonight selected; given a build with sign-in on, Then the You profile card shows the signs-as name and Account from the first Tonight. | Onboarding is outside the tabs today (`index.tsx` redirect). The account-first order is NX-31's revision, not read (UNVERIFIED). | NX-31 |
| NX-30-R18 | HYPOTHESIS | Given family surfaces are on (`preview`), When the parent opens You, Then Family is 1 row under Children and never a fifth tab; given the store build, Then 0 Family rows. Test: none, decision (`product`). | `family.tsx` is a tab today. | #665; D-126 |
| NX-30-R19 | HYPOTHESIS | Given the evaluation script below, When the founder and 3 to 5 parents run it on the same phone and build, Then the proposed thresholds hold. Test: none, study (`user-research`). | No baseline exists. | Evaluation |
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
| `tabs.you` | new; PLACEHOLDER, `content` and `design-systems` confirm (alternatives to test: Settings, Me) | You |
| `tabs.youA11y` (accessibility label if it differs from the title) | new, only if `content` wants more than the title; none drafted | |
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
| `settings_opened` with `from: oneOf('tab','book_gear')` | add to catalog first (catalog and `docs/analytics/TRACKING_PLAN.md` in the same PR) | no content, no child name |
| `tonight_book_row_opened` | add to catalog first | none |
| `tab_selected` (which tab) | not in the catalog (the catalog has `book_opened` and the Family teaser event only); not proposed here. If `product` wants tab use, add to catalog first with `tab: oneOf('tonight','book','photos')` and no content | |
| any search event | not allowlisted; none proposed | letter text must never enter analytics |

## Device rows

Scan on 9 Nov (open PR patches via the API, and every docs branch fetched): S1-110, -112, -131 to -135, -140, -144, -150 to -152 are used, and #664 (open) already carries S1-160 and S1-161. My first draft of this file proposed S1-160 to S1-162, which collides with #664; this version moves to S1-170 and above (UNVERIFIED that nothing else holds them; `qa` re-scans at merge). Proposed: S1-170 (the You tab: Settings in 1 tap, Account in 2, Book gear still works, from each of Tonight, Book; a, b, c), S1-171 (the bar at AX5 on an iPhone SE 3 with VoiceOver, light and dark, 3 tabs and 4 tabs; R12, R13), S1-172 (From the book row with 0, 1, 3 drafts waiting; R2, R14), S1-173 (option L2 playback, only if chosen), S1-174 (the evaluation script on the founder's phone, section below; a record, not a pass/fail row). NX-33 takes S1-175 onward. Record: phone, iOS version, build number, text size, a screen recording with the Asha book only.

## Evaluation: how we judge the four-button bar

Status: a plan. Nothing has been run. Every number is PROPOSED, a target, not data. 5 people cannot prove a rate; this finds problems, it does not measure the population.

**Script (read aloud, one task at a time, no hints):** T1 "Find where your settings are." T2 "Find your account (or profile)." T3 "Add a photo to one of Asha's letters." T4 "Find the letter you kept last week." Then 5 short questions: what is each of the four buttons for; what would you expect behind "You"; did anything feel crowded or missing; is Tonight more or less dull than before (a free word, no scale); would you call the fourth button "You", "Settings" or "Me".

**Same phone, same book:** a TestFlight phone with the fictional Asha book loaded (no real family data, CLAUDE.md), the current Build 12 first (the baseline), then the build with the bar. Order is swapped for half the people. Screen recording on; analytics are off so nothing is measured by the app.

**Tap counts, before (from `develop` e15e307b; the Build 12 commit was not checked) and design target after:**

| Task | Before (taps) | After (target, proposed) |
|---|---|---|
| T1 Settings | 2 (Book, gear) | 1 (You) |
| T2 Account | 3 with sign-in on (Book, gear, card); not reachable with sign-in off | 2 (You, card); 1 (the signs-as card) with sign-in off |
| T3 Add a photo | cannot be done (no feature) | 3 or fewer to the system picker from Photos or a letter (NX-33 fixes the exact path) |
| T4 Last week's letter | 1 plus a scroll (Book, newest first) | 1 plus a scroll (no regression) |

**Who runs it:** `user-research` runs it and writes it up; the founder runs T1 to T4 first on his own phone; then 3 to 5 parents (at least 1 who has never seen the app, at least 1 using VoiceOver or a larger text size). `design-systems` attends only to fix the script.

**Pass (proposed):** at least 4 of 5 people complete T1 and T2 unaided in 10 seconds or less each; at least 4 of 5 complete T3 in 30 seconds or less excluding time spent browsing in the system picker; T4 median time no more than 2 seconds above the baseline; at least 4 of 5 say the fourth button holds settings or account without being told; 0 clipped labels in the AX5 and VoiceOver run, and the VoiceOver person completes T1 and T2 in 60 seconds or less (R13); 0 people mistake a tab for a badge or a notice.

**If it fails, we change (in this order, one thing at a time):**
1. Label misread (fewer than 4 of 5): change the one `tabs.you` key to Settings or Me, run the 5 questions again; no layout change.
2. T3 too slow or missed: move the add-a-photo door (NX-33), not the bar.
3. T1 or T2 missed: put the profile card first and larger on You, and show the signs-as name inside the tab's own title; consider the Book gear's label.
4. AX5 clipping on 320 pt: shorten a label; if still failing, fall back to option B (three tabs, a gear on Tonight).
5. T4 slower: leave Book unchanged and look at the Months sheet, not the bar.
Nothing here changes copy that counsel has registered. A fail is recorded in `docs/qa/` with the recording kept off the repo (a child's book on screen).

## IA.md update that ships with R12 (one line, docs)

`docs/design/IA.md`, section "Settings": change "Reached from the gear on Book" and the Tabs table (which lists three tabs: Tonight, Book, Family) so that it says: "Reached from the You tab, and from the gear on the Book (the Book gear stays until the Book page lane decides otherwise). Tabs: Tonight, Book, Photos (when its switch is on), You; Family is not a tab." Product or `design-systems` makes this edit in the same PR as the tab.

## Dependencies

#665 (hide Family) before any tab change; it edits the same `_layout.tsx` as R12. NX-33 (Photos) for the tab's content and for R14. NX-32 for the Account screen and its header-card entry (R1 adds only the tab that shows them). #674 and #614 are merged and assumed. File 15 (capability gap analysis, other lane, not read) for search, milestones, share, print. NX-31 (onboarding) and NX-32 (account management, includes where Account and Sign out live) are referenced, not duplicated: if NX-32 moves Account or Settings entry points, R1 follows it.

## Engineering block

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. Local screens only. |
| Budget (`06-nfr.md`) | Tonight's first frame does not wait on the new row (it reads the store synchronously like `readRoom`). No number measured. UNVERIFIED against the launch-time rows in `06-nfr.md` |
| Accessibility | R7 and R8. Tabs: 44 pt minimum target, role tab, selected state announced. Row: one element, label from `tonight.resurfaced.a11y`. No colour-only signal. Contrast in both themes with the lamp on (the lamp test samples text boxes; the new row's text box must be added to `apps/mobile/test/lamp.test.ts`, UNVERIFIED how) |
| Switch, off behaviour, noticed by | Proposed: no runtime flag (remote config may not change what the app shows or collects, `capabilities.ts`). If the founder wants a switch, a build-time constant in `capabilities.ts`, on in `testflight` and `preview`, off in `production` until S1-170 passes. Rollback: revert the PR. Noticed by: device row |
| Data class and retention | L1 to L3, local only (letter words stay on the phone). Nothing new stored |
| Schema and grants | None |
| Analytics events | Above |

## Owner lanes

`design-systems`: this spec, tab and gear patterns in `docs/design/COMPONENTS.md` after build. `mobile`: R1, R2, R3, R7, R8 (screens). `content`: the new keys. `qa`: S1-170 and the tests below. `user-research`: R10 and H1 to H5. `product`: decision entry if a tab is added, back-log rows and `_ID-MAP.md`. `ops`: website, if Q1 is the website.

## Trace and tests

Id convention: `_CONVENTIONS.md`. Paths marked proposed do not exist yet.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-30-R1 | IA.md | proposed `apps/mobile/test/tabs-you.test.ts`; `[NX-30-R1] You opens Settings in one tap and Account in two` | S1-170 (a) (proposed) |
| NX-30-R2 | F14-REQ-041 | proposed `apps/mobile/test/tonight-from-the-book.test.ts`; `[NX-30-R2] a kept letter shows below the actions with 0, 1 and 3 drafts waiting` | S1-170 (b) |
| NX-30-R3 | S09 rule | same file; `[NX-30-R3] a private letter or a quiet day is never chosen` | none |
| NX-30-R4 | CLAUDE.md content rules | same file; `[NX-30-R4] Tonight shows no count, streak or badge in 5 states` | none |
| NX-30-R5 | none | none, study | none |
| NX-30-R6 | IA.md | none, decision | none |
| NX-30-R7 | A-NFR-005 to -007 | proposed `apps/mobile/test/tonight-a11y-order.test.ts`; `[NX-30-R7] reading order and 44 pt targets at AX5` | S1-170 (c) |
| NX-30-R8 | MOTION 5.8 | same file as R2; `[NX-30-R8] the row never moves under Reduce Motion and enters once per launch` | S1-170 (d) |
| NX-30-R11 | IA.md | proposed `apps/mobile/test/tabs-you.test.ts`; `[NX-30-R11] the Book gear still opens the shared Settings home` | S1-170 (a) |
| NX-30-R12 | DESIGN_LANGUAGE 12 | proposed `apps/mobile/test/tabs-photos.test.ts`; `[NX-30-R12] three tabs with Photos on, two with it off, no Photos route when off` | S1-171 |
| NX-30-R13 | A-NFR-005 to -007 | same file; `[NX-30-R13] three tab labels at AX5 are whole and ordered for VoiceOver` | S1-171 |
| NX-30-R15 | CLAUDE.md content rules | proposed `apps/mobile/test/tabs-no-badges.test.ts`; `[NX-30-R15] the bar draws no badge, dot or count in 8 states` | S1-171 |
| NX-30-R16 | PRD-REQ-019 | proposed `apps/mobile/test/native-intent-tabs.test.ts`; `[NX-30-R16] links, cold launch and a reminder tap open Tonight` | S1-170 (c) |
| NX-30-R17 | NX-31 | proposed `apps/mobile/test/tabs-first-run.test.ts`; `[NX-30-R17] no bar before the book opens; Tonight selected first` | S1-170 |
| NX-30-R18 | #665 | none, decision | none |
| NX-30-R19 | none | none, study (`user-research`) | S1-174 |
| NX-30-R14 | NX-33 | proposed `apps/mobile/test/tonight-from-the-book.test.ts`; `[NX-30-R14] the row shows the letter's photo and adds no caption` | S1-170 (b) |
| NX-30-R9 | none | none until L2 is chosen | S1-171 (proposed) |
| NX-30-R10 | none | none, study (`user-research`) | none |

Trace: NX-30-R1..R19 -> IA.md (rules for adding a place), F09, F14-REQ-040, F14-REQ-041, A-NFR-005, A-NFR-006, A-NFR-007.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Which screen is the landing page | Decided: Tonight |
| A four-button bar, Settings and profile more accessible | Decided in chat: Tonight, Book, Photos, You |
| The fourth button's label | "You" as a placeholder; test "Settings" and "Me" in the evaluation |
| What "dull" means on Tonight (question 3) | Open. Default: shows nothing of your own book (L1) |
| Family in `preview`: a fifth tab or a row in You | A row in You (R18) |
| Keep the Book gear | Yes, until the Book page lane says otherwise; the Settings home is one shared component |
| A build switch for the From the book row | No runtime flag; a build-time constant off in `production` until the device row passes, if he wants one |

## Not verified

The Tonight the founder actually saw (build number, light or dark mode, text size). Whether the TestFlight build matches `origin/develop` e15e307b. The content of `proposals/v1-experience/daily-home.md`, `library.md`, `memories.md` and `proposals/book-page.md` (not in the repo). File 15. The F14 and F15 spec text (header read only). The `apps/web` landing page and which version is live. Whether the AX5 tab bar fits a third item. The Book gear's content key name. Whether `lamp.test.ts` needs a new measured box. The launch-time budget. Whether #665 merges unchanged. Whether the Settings home can be a tab root and still be a root-stack route for sub-pages (expo-router nesting, `settings/_layout.tsx`). Whether a notification tap routes anywhere today. The NX-31 revision (account first), NX-32 row text beyond the lines read, and NX-33 (not on this branch's base). The width of the four labels at 13 pt on 320 pt. Whether a Phosphor image glyph is importable the way `_layout.tsx` imports the others. How Family sits next to Photos in `preview`. Everything in "What feels dull" is a hypothesis; no user was asked.
