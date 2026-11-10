# One job per tab: Tonight, Book, You, and a quiet place for "coming soon"

Owner: design systems (journey and IA lead for the "unique tabs" programme). Status: DRAFT spec for the founder, `mobile`, `content`, `product` and `qa`, 10 Nov 2026 (UTC). Docs only: nothing here is built, no token or string is changed, and no word is live until the founder approves it and `mobile` wires it in the same PR that moves it. Signed: Design Systems and Accessibility Lead (Claude role).

Founder direction, 10 Nov 2026, quoted: "Assign team to work on how each tab on nav is unique and serves value. Right now tonight and book feel same and third is empty coming soon. Coming soon can be less prominent and focus on re think of that."

Tags. EVIDENCE: read in the repo, or at a named PR head, this session. UNVERIFIED: not read, not run, not measured on a device. PROPOSED: my wording, number or rule. HYPOTHESIS: a statement about what a parent will do or feel. I wrote no statistic. Sizes (S, M, L) are guesses, not measurements.

## 0. The short version

1. The founder's three observations are right, for different reasons. Tonight and Book share one light, one date line and one card shape (section 1.3). The third tab is a full-size "Family" page that says nothing can be done (section 1.4). And in the TestFlight builds the founder tests, that tab is still drawn: the store build hides it, every alpha build keeps it (EVIDENCE: `familySurfacesShown`, `lib/family/entry.logic.ts`).
2. Each tab gets one job, said in a sentence a parent would say. Tonight: tell {child} one thing about today. Book: read it back and hear it. You: look after the book, who can open it, and who writes to it.
3. Recommendation: three tabs, Tonight, Book, You, in every build. Family stops being a tab. The real co-parent screen moves under You as a page that opens only when it is live, and "coming soon" shrinks to one quiet row inside the child's page, where a parent who wants it will already be looking (section 4).
4. Tonight and Book stop sharing a grammar. A raised card means "a kept letter" and nowhere else. Waiting-to-be-kept becomes a flat row on Tonight. Tonight starts a letter and never lists the book; Book lists the book and never starts a letter (section 2.2).
5. Collisions: #738 at its current head deletes the Family tab guard that `develop` already has (merged #665), so merging it before #720 brings a fourth tab back to the store build. Details in section 7.

## 1. Audit: what each tab shows today

Read on `origin/develop` `6800a54f4` (10 Nov). PR heads read: #699 `81d25dd0`, #720 `54757ac4`, #738 `0cd8e1f1`, #740 `b2b730e1`, #764 `b8a4230e`.

### 1.1 The bar

- `apps/mobile/src/app/(tabs)/_layout.tsx`: JS tabs, Tonight (MoonStars), Book (BookOpen), then Family (UsersThree) inside `Tabs.Protected guard={FAMILY_TAB}`. Labels come from `copy.tabs` (`packages/content/src/strings.en.ts` line 58: `tonight`, `book`, `family`). 25 pt icons, 13 pt labels, no scaling with Dynamic Type, Large Content Viewer on iOS.
- `FAMILY_TAB = familySurfacesShown({ alpha: PLUS_ALPHA, coParent: capabilities.coParent })`, and `familySurfacesShown` is `alpha || coParent` (`lib/family/entry.logic.ts`). So: store build with servers off, two tabs. Every alpha build (TestFlight, preview), three tabs. A store build with servers on, three tabs, until #720 lands.
- There is no You tab on `develop`. Settings is reached from one place: the gear on the Book cover band (`book.tsx`, `openSettings`, line 198 of the file at that head). Tonight has no door to Settings.

### 1.2 Tonight (`(tabs)/index.tsx`, 339 lines)

| Order | What it shows | Source |
|---|---|---|
| 1 | Date line: "Asha, 7 months" (or "Before You") | `tonightDateline`, `tonightStageLabel` |
| 2 | Greeting in two tones, by time of day | `greetingParts`, `copy.tonight.greeting` |
| 3 | The prompt, large, with "Another thought" | `promptHero`, `selectPrompt` |
| 4 | Speak and Type, pinned (inline at accessibility text sizes) | `Button size="capture"` |
| 5 | "Not much today" | `keepNotMuch`, saves a mark with no words |
| 6 | One card per waiting draft, newest first; two or more at the Keep step fold to one row | `DraftCard`, `HeldRow`, `listDrafts` |
| 7 | Only if no draft is waiting: one kept letter from a month ago | `ResurfacedCard`, kicker "A month ago" |
| 8 | A standing Plus line above Speak and Type when free letters are used and Plus is off | `PlusLine` |

Light: the `tonight` lamp scene, tone by daypart, `persistKey "tabs"`.

### 1.3 Book (`(tabs)/book.tsx`, 498 lines) and where it overlaps Tonight

Book: a cover band ("Asha's book", the age in words, Read together, the gear), months as chapters, newest first, a letter card for each kept letter, a quiet-day row for each "Not much today" mark, a Months sheet, and an end-of-book mark. Child switcher only when there is more than one book. Light: the `book` lamp scene, same `persistKey "tabs"`.

Overlaps, each with its file (EVIDENCE):

| # | Overlap | Where |
|---|---|---|
| O1 | Same light. Both tabs sit in one lamp room (`persistKey "tabs"`), so switching between them settles the same glow instead of changing rooms. Only the scene name differs. | `index.tsx` `<Lamp scene="tonight" persistKey="tabs">`; `book.tsx` `<Lamp scene="book" persistKey="tabs">` |
| O2 | Same object. Tonight's waiting-draft card, Tonight's "A month ago" card and Book's letter card are each a raised `Card` with a caps date line and a faded excerpt (`ExcerptFade`). Same size, same radius, same weight. | `tonight/draft-card.tsx`, `tonight/resurfaced-card.tsx`, `book/letter-card.tsx` |
| O3 | Same date line style. `letterDateline` caps on Tonight's top line, on every Tonight card and on every Book card. | the three files above |
| O4 | Two empty rooms that say the same thing. First day: Tonight asks for a letter. Book's empty state asks for a letter too ("The first page is waiting.", button "Write a letter") and its button sends the person to Tonight (`router.navigate('/')`, `book.tsx` line 264 at that head). | `book.tsx`; `copy.book.empty` (`strings.en.ts` lines 534 to 536) |
| O5 | Two meanings of "waiting". On Tonight, "Waiting to be kept" is a draft not yet kept (BRAND.md internal-terms table). In Book, a `WaitingCard` is a kept letter whose words are still being made (`letterWords(item) === 'waiting'`, `book.tsx`). Same word, different objects. | BRAND.md; `book.tsx` |
| O6 | The month-ago card is a Book letter shown on Tonight, opening the Book's letter page. It appears only when no draft is waiting, so Tonight is never both. | `index.tsx` `monthAgo`; `resurfaced()` in `draft-card.logic` |

What I did not find: a count, streak or gap on either tab. Both already follow the constitution. The sameness is in shape and light, not in content. I have not seen either tab on a device (UNVERIFIED), so whether they "feel" the same is the founder's report plus O1 to O3, not my measurement.

Gaps found on the way:

| # | Gap | Where |
|---|---|---|
| G1 | Tonight cannot change which book it writes to. The child switcher lives only on Book. With two books, a parent who is on Tonight writes to whichever book was last active. | `index.tsx` has no `ChildSwitcher`; `book.tsx` lines 207 |
| G2 | Two doors to Settings once You ships: the Book gear and the You tab. | `book.tsx` `openSettings`; #699 `you.tsx` |

### 1.4 Family (`(tabs)/family.tsx`, 327 lines)

- Two bodies, chosen at build time by `capabilities.coParent`: `FamilyShared` (servers on: who writes to {child}, signatures, pending invites, the invite card) and `FamilySoon` (servers off: `CoParentSoon presentation="screen"`).
- `CoParentSoon` (`components/family/coparent-soon.tsx`) draws the page title "Family" at display size, a 232 pt line drawing that breathes, a title ("For now, this book is yours.") and a line ("In a later update, {child}'s other parent can add letters too, from their own phone."). No action. It also sends one content-free event, `coparent_soon_opened`, on each focus.
- So the third tab is one of the biggest things on the bar and the only thing it can do is say "later". That is the "empty coming soon" the founder named.
- The co-parent entry already exists in a second place: the child's page, Settings, Children, row "Write this book together" (`soon.settingsRow`, `bookRow.label`), which opens the same "coming soon" presentation as a sheet.
- Words that name the Family tab and would need `content` to change if it stops being a tab: `family.en.ts` line 38 (comment: "opens the Family tab"), line 75 (`done`: "The invite waits on the Family tab until they join."), and `release/testflight.en.ts` line 104 (tester instructions: "invite the other parent from the Family tab"). Code that routes to it: `FAMILY_TAB_HREF` in `child-settings.logic.ts` line 67, and the `family: '/family'` map in `content-blocks/blocks.tsx` line 45.

### 1.5 You (does not exist on `develop`; on #699 and #738)

- #699 (`you.tsx`): `export { default } from '../settings/index'`. The tab root is the Settings home screen, no lamp, no Back, page title "Settings". Label `tabs.you` "You" is a placeholder the founder confirms. Settings reaches 1 tap from any tab (was 2, via Book and the gear; Account 2, was 3; numbers derived from code in NX-30a, not measured on a device).
- #738 (`settings-home.logic.ts` `youTabView`): the same screen in named states. A signed in: Account card. B signed out and C local start: a "Sign in" card with one button. 0 no sign-in: "On this phone", opens nothing. Plan row stays in every state.
- #740: Account page sections (Signs letters as, Ways to sign in, Lock, Your data, Help).
- What You holds today, in order (EVIDENCE, `settings/index.tsx` at #738): header card and Plan; Children (one row per book, Add a book); Writing (Spoken language, Your words, Reminders, Appearance); Your letters (Where your letters live, Export, Recently deleted, Storage, Erase on a phone that never signed in); Privacy and security (App lock, Privacy); Delete account (only while signed in and the build allows it); Help and legal; About.

## 2. One job per tab

### 2.1 The jobs

| Tab | What the parent comes to do (their words) | What only this tab does | What it never does |
|---|---|---|---|
| Tonight | "Tell {child} one thing about today." | Starts a letter: Speak, Type, "Not much today". Holds what is waiting to be kept. Offers the one thought for the day, by time of day. | List the book. Show settings, account or people. Count anything. |
| Book | "Read it back. Hear it." | The whole book by month. Read together. A letter's own page. The Months jump. Later: a Photos view of the book, and finding a letter (section 2.4). | Start a letter by itself (its empty state may point to Tonight). Hold a setting. |
| You | "Look after the book." | Account and sign-in. Plan. The books (Children). Language, reminders, appearance, lock. Export and delete. Who writes to {child}, when that is live. | Show a letter. Carry a lamp, a badge, a colour change or a nag (YOU-TAB-STATES, NX-36 S0). |

Test for each job: a parent can answer "where do I go to ...?" with one tab and never two. Today the answers to "where do I start a letter?" (Tonight, and Book's empty button) and "where do I find Settings?" (Book gear, and You once #699 ships) each have two.

### 2.2 Rules that make Tonight and Book look like different rooms (PROPOSED)

| Rule | Tonight | Book | Why |
|---|---|---|---|
| R1 Raised card means a kept letter | The waiting-to-be-kept items are flat rows: date line, one line of words, "Keep" as the verb, a hairline between, no raised surface. | Letter cards stay raised. | Fixes O2. A parent learns one thing: raised paper is something already in the book. Tonight's rows are work in progress. |
| R2 Tonight lists no kept letters, except one doorway | "A month ago" stays as the single doorway into the book. It becomes a text row, not a card: the kicker, one line of the words, "Read it". It opens the letter in the Book (`/letter/[id]`). | Everything else. | Fixes O6. Keeps the "On This Day" idea (BENCHMARK.md, Day One) without a second letter object. |
| R3 Book starts nothing | n/a | The empty state shows the closed cover and one quiet line; its button is `variant="quiet"`, label unchanged, goes to Tonight. | Fixes O4: one place makes letters. |
| R4 The light says where you are | The lamp keeps its time-of-day tone and breath. | The lamp stays still (the `book` scene is already still, DESIGN_LANGUAGE 12). | Already so; R4 is a rule to keep, not a change. |
| R5 You has no light | n/a | n/a | Already so on #699. Plain paper tells a parent they have left the writing and reading rooms. |
| R6 One word per waiting thing | "Waiting to be kept" (a draft). | Book's `WaitingCard` reads "Getting ready" (words being made). | Fixes O5. `content` to confirm the Book line never says "waiting". I read the code comment ("Getting ready, 40%"), not the rendered screen (UNVERIFIED). |

R1 and R2 are small: `DraftCard` and `ResurfacedCard` change shape; `HeldRow` already is a row. R1's look is a prototype question (does a flat row still read as tappable and as a letter in progress at AX5?). It is UNVERIFIED until built; if it fails, the fallback is a card with a dashed left rule, which needs a new token and is not recommended first.

### 2.3 What each tab's top of screen says (so a parent never wonders where they are)

| Tab | Top of screen | Heading level 1 (VoiceOver lands here) |
|---|---|---|
| Tonight | "ASHA, 7 MONTHS" then the greeting | The greeting (already `asHeading={1}`) |
| Book | The cover band: "Asha's book" | The cover title (already so) |
| You | "Settings" (native header) | "Settings" |

### 2.4 Later, not Build 12 (PROPOSED, for the product owner)

- Book at many letters: a "Find a letter" action inside the Months sheet area. Nothing in the repo does this today (grep of `book.tsx` finds Months only). It is the next thing only Book does. Needs a search design that never indexes into analytics (PRINCIPLES 12).
- Photos: the Memory Library specs put a Photos tab as "third of four" (`MEMORY-LIBRARY-FLOWS-10nov.md` ML-S9, NX-30 option C). NX-30a argued against a Photos tab (no photo feature, PRD forbids photo-only entries, brand). I agree with NX-30a. If photos ship, they are a view inside Book. That means ML-S9 needs a revision; I do not edit another spec here.

## 3. The whole nav: options

Taps are from a cold launch, derived from code (NX-30a method), not measured.

| | A. Tonight, Book, You (3 tabs) | B. Tonight, Book, Family, You (4 tabs) | C. Tonight, Book (2 tabs) plus a gear | D. Tonight, Book, Family (today's alpha) |
|---|---|---|---|---|
| Family | Not a tab. A page under You, opened only when co-parent is live. "Coming soon" is one row in the child's page. | A tab, real screen only when live; hidden otherwise | Not a tab. Same as A | A tab, real or "coming soon" |
| Settings from Tonight | 1 tap | 1 tap | 1 tap if a gear is added to Tonight | no door (2 taps after switching to Book) |
| Account | 2 taps | 2 taps | 3 taps | 3 taps, and in alpha builds only |
| Item width at 375 pt | 125 pt | 93.75 pt | 187.5 pt | 125 pt |
| Placeholder tab | None | None while hidden; one when co-parent is off in an alpha build | None | Yes, in every alpha build |
| Each tab one job | Yes | Yes, but Family has one job only for two-parent books | Settings has no home; the gear becomes a second door | No (Family empty) |
| Build 12 cost | S to M: remove one tab, rehome one page (guesses) | S | S | none |
| Risk | The co-parent feature has no tab when it ships | A tab for a feature most books will not use | Hard-to-reach settings: the founder reported this on 9 Nov (NX-30a "The founder's words") | The founder's complaint |

A one-line case for each:

- A is what the store build already becomes with #699 and #720 (Tonight, Book, You, EVIDENCE: #720 description: "a servers-on store build keeps three tabs"). Making every build match means the founder's TestFlight device shows what customers get, and one bar is tested instead of two.
- B is NX-30a's recommendation for builds where family surfaces are on. It stays right if co-parent becomes a daily place. For a feature with at most two parents per book (D-069) and one invite per book, a tab is more weight than the use needs (HYPOTHESIS: no usage data exists for it).
- C removes the placeholder but keeps Settings hard to reach, which the founder named on 9 Nov.
- D is today.

A fifth shape I rejected: two tabs, Book and You, with writing as a button on the Book. It deletes the one room that is lit and warm and that the brand is built on (DESIGN_LANGUAGE 12, the website's lamp), and puts the doing and the reading back on one screen, which is the problem we are solving.

### Recommendation: A, with a named trigger to reopen B

Three tabs in every build. Reopen B only if both hold: co-parent is live in the store build, and `product` shows a parent needs the people page more than once a month (a number `analytics` would have to provide from the allowlisted, content-free events; none exists today).

### 3.1 Why this serves value for each tab

| Tab | Value to the parent | Value to the product |
|---|---|---|
| Tonight | The shortest path from opening the app to talking: one question, two buttons. | The capture moment is protected; nothing competes with Speak. |
| Book | The reason to keep going: the proof, in order, readable and audible. | Retention comes from reading back, not from nags (no streaks, ever). |
| You | Trust: the parent can see where their letters are, who they sign in as, and leave or export at any time. | A home for sign-in, plan, delete and export that is not three taps deep. |

## 4. Coming soon, made quiet

### 4.1 Principles (PROPOSED)

1. A feature that is not here is never a place. It never gets a tab, a page title at display size, or a drawing.
2. It lives as one row in the place the parent would look for it. For co-parent that is the child's page (Settings, Children, {child}), where "Write this book together" already is.
3. One line, no art, no motion, no button. The page behind the row is the existing sheet, shortened.
4. In a build where the feature does not exist at all (the store build, `familySurfacesShown` false) there is no row. Silence is more honest than "soon".
5. The row is the same row that becomes the real thing. When co-parent ships, the row's value changes from "Coming soon" to nothing (one parent: it opens the invite sheet) or the co-parent's signature (two parents: it opens the people page). No second surface to build.
6. No date and no promise of when. "Tell me when it's here" stays removed (SET-08, `coparent-soon.tsx` header).
7. `coparent_soon_opened` keeps counting, with `surface: 'sheet'` only; `surface: 'tab'` stops being sent. Content-free either way.

### 4.2 What changes in each build

| Build | Tab bar | Child page row | People page under You |
|---|---|---|---|
| Store, servers off | Tonight, Book, You | None (`familySurfacesShown` false, as on `develop`) | None |
| Store, servers on (Build 12) | Tonight, Book, You | None (#720 sets the store build's co-parent flag false) | None |
| Alpha, servers off | Tonight, Book, You | "Write this book together", value "Coming soon", opens the shortened sheet | None |
| Alpha, servers on | Tonight, Book, You | "Write this book together": one parent opens the invite sheet; two parents show the co-parent's signature and open the people page | A row "Who writes to {child}" appears in You, under Children, only while a co-parent or an open invite exists |
| Later, co-parent live in store | Tonight, Book, You (B reopened only on the trigger in section 3) | As alpha, servers on | As alpha, servers on |

### 4.3 The words (needs `content`; nothing is final)

Reused as they are: `soon.status` "Coming soon" (row value), `soon.settingsRow` "Write this book together" (row label), `soon.title` "For now, this book is yours." (sheet title), `membersTitle` "Who writes to {child}" (people page title and You row).

The sheet keeps its title and drops the 232 pt drawing and the breathing; it keeps one line: `soon.lead` "In a later update, {child}'s other parent can add letters too, from their own phone." That line is a promise about the future, so it is COUNSEL-READ as it already is; I do not change it.

Changed words, all needing founder approval and `content`'s check:

| Key | Today | Proposed | Why |
|---|---|---|---|
| `family.sheet.done` (`family.en.ts` line 75) | "The invite waits on the Family tab until they join." | "The invite waits under You, Who writes to {child}, until they join." | There is no Family tab. PROPOSED; `content` owns the final line. |
| `release/testflight.en.ts` line 104 | "invite the other parent from the Family tab" | "invite the other parent from You, then Who writes to {child}" | Tester instructions must match the build. |
| `tabs.family` | "Family" | Removed once no code reads it | Glossary: "family" is a v1.1 word and is banned in v1.0 public copy; the tab name was the last in-app use. |

No new string names a streak, count, point, fear or loss. No new string implies a machine writes. {child} is used wherever a child is named; the nameless fallback "your child" applies as in NX-31.

### 4.4 The door lines (COORDINATION section 10)

This spec changes where the invite and the people list are reached, not what a person agrees to. The invite flow, its consent, its Records and its Never lines are unchanged and are not restated here. **Shown:** the existing words for each step, by their `packages/content` keys above. **Records:** no new act. **Never:** no new collection; the one event stays content-free. **Decline and withdraw:** unchanged, and export and deletion stay in You.

## 5. States

Rows are the five founder-relevant states. "Signed out" means B and C of YOU-TAB-STATES (#738). Nothing ever blocks reading, recording or export (NX-31-R22).

| State | Tonight | Book | You |
|---|---|---|---|
| First day (no letters, servers on, signed in) | Date line, greeting, the first prompt, Speak and Type. No month-ago row, no flat rows. | Closed cover, the line "The first page is waiting.", quiet button to Tonight. | Account card, Plan "Free" with its help line, Children with one book. No People row. |
| First week (1 to a few letters) | As first day. After a kept letter, the reminder ask appears over the Book (`ReminderPrimeAsk`, `_layout.tsx`), not over Tonight. A waiting draft appears as a flat row. | A "This month" opener and the letters under it. The Months button appears when there is more than one month (`showsMonthsButton`). | Same. A person who started on this phone sees the Sign in card (state C) and one line; nothing moves until they agree. |
| Many letters | Same length as day one. Two or more waiting letters fold into one row (`HeldRow`). The month-ago row shows only when nothing is waiting. | Months grow; the Months sheet jumps. Later: Find a letter (section 2.4). | Same. Export is the same row it always was. |
| Signed out (B) or local start (C) | Unchanged. No sign-in prompt on Tonight in Build 12 (NX-36 Q4, quoted in YOU-TAB-STATES section 3). | Unchanged. | Sign in card with one button, then Plan. Erase everything shows only in C. |
| Servers off | Unchanged. | Unchanged. | Header card "On this phone", opens nothing. No Account, no sign-in, no Delete account. People row never appears. |

Each state is checked at default text size and at AX5, in light and dark, with Reduce Motion on (section 8).

## 6. Text wireframes

Fictional family Asha. `[ ]` is a button, `( )` is a row, `~` is lamp light, `|` is the screen edge. Widths are schematic.

### 6.1 The bar, option A (recommended)

```
|  Tonight        Book          You     |
|  (moon, fill)   (book)        (person)|
```
Selected item: filled icon plus the label in the bold face (NX-30a R5, still proposed there). VoiceOver: "Tonight, tab, 1 of 3", "Book, tab, 2 of 3", "You, tab, 3 of 3. Settings and account." The hint is `settingsHome.youTabHint` from #738.

### 6.2 Tonight, first day

```
~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
ASHA, BEFORE YOU                         (date line)
Good evening, Mama.                      (greeting, two tones)

What is the first thing you
want {child} to know about
today?                                   (prompt, promptHero)
   [ Another thought ]

 [ Speak ]            [ Type ]           (pinned)
        Not much today
```
Nothing below the prompt on the first day.

### 6.3 Tonight, a week in, one letter waiting and a plan line

```
ASHA, 7 MONTHS
Good morning, Mama.
(the prompt)    [ Another thought ]

 Waiting to be kept                      (flat row, no raised surface)
 ---------------------------------------
 SAT 14 OCT  1 min
 "We went to the park and she laughed
  at the ..."                      Keep >
 ---------------------------------------

 New letters need Plus.                  (PlusLine, only when it applies)
 [ Speak ]            [ Type ]
        Not much today
```
Two or more waiting: one row "Waiting to be kept" that opens the list (existing `HeldRow`).

### 6.4 Tonight, nothing waiting, a letter from a month ago

```
(date line, greeting, prompt)

 A month ago                             (text row, kicker in caps)
 "She slept through for the first
  time and I ..."                Read it >
 ---------------------------------------
 [ Speak ]            [ Type ]
```
Tapping opens the letter's page in the Book.

### 6.5 Book, first day

```
|                                  [gear]|   (gear leaves once You is proven, section 7)
|            Asha's book                 |
|            Before You                  |
|        +--------------+                |
|        |   closed     |                |
|        |   cover      |                |
|        +--------------+                |
|     The first page is waiting.         |
|  Tell Asha one thing about today.      |
|                                        |
|        [ Write a letter ]  (quiet)     |   goes to Tonight
```

### 6.6 Book, a week in

```
|  Asha's book                      [gear]|
|  7 months      [ Read together ]       |
|  [ Months ]                            |
|                                        |
|  THIS MONTH                            |
|  +----------------------------------+  |  raised card = a kept letter
|  | SAT 14 OCT                       |  |
|  | "We went to the park and she     |  |
|  |  laughed at the dog..."          |  |
|  |                       From Mama  |  |
|  +----------------------------------+  |
|  (quiet-day row: "Not much today")     |
```

### 6.7 Book, many letters

As 6.6 with month openers ("Month 6", "Month 5") down the page, the Months sheet listing only months that have letters, and the end-of-book mark under the oldest month. No count of missing months.

### 6.8 You, signed in, store build, no co-parent

```
Settings                                   (heading level 1)

 +--------------------------------------+
 | Mama                              >  |  Account card
 | Signed in with Apple                 |
 +--------------------------------------+
 | Plan                       Free   >  |
 +--------------------------------------+
CHILDREN
 | Asha's book                        >  |
 | Add a book                         >  |
WRITING
 | Spoken language / Your words /        |
 | Reminders / Appearance               |
YOUR LETTERS
 | Where your letters live / Export your |
 | book / Recently deleted / Storage     |
PRIVACY AND SECURITY
 | App lock  Off  /  Privacy            |
 | Delete account                    >  |
HELP AND LEGAL
 | Help / If you are struggling / Legal  |
ABOUT
 | Version                               |
```
No People row. No Family word anywhere.

### 6.9 You, signed out or local start

```
Settings
 +--------------------------------------+
 | Not signed in                        |
 | Your letters are on this phone. Sign |
 | in to open your book on any phone.   |
 | (C adds: This book is on this phone. |
 |  When you sign in, it moves to your  |
 |  account after you agree.)           |
 |            [ Sign in ]               |
 +--------------------------------------+
 | Plan                       Free   >  |
 ...                                (rest as 6.8; no Delete account)
```
Words from #738 (`settingsHome.signedOut.body`, `settingsHome.localStart.body`, `authCopy.account.signedOutTitle`, `authCopy.account.signIn`); they still need founder approval there. Not owned by this spec.

### 6.10 You, servers on, a co-parent or an open invite exists (alpha, later store)

```
CHILDREN
 | Asha's book                        >  |
 | Who writes to Asha        You, Papa >  |   new row; appears only when there is
 | Add a book                         >  |   a co-parent or an open invite
```
Opens the people page (6.11). The row value is names the parent signs as, shown as signatures as today ("From Mama"), never an email.

### 6.11 People page (pushed from You or from the child's page)

The body of `FamilyShared`, unchanged in content, as a pushed page with Back:

```
< You
Who writes to Asha                         (heading level 1)
 From Mama          You
 From Papa          Co-parent
 Invited, open until 20 Nov
   [ Share again ]  [ Cancel invite ]
 (invite card only while one parent and no open invite)
```
No lamp here (a settings page). The existing family lamp scene `family` is no longer used by any screen; `lamp.test.ts` and `LampScene` need a `mobile` look (collision list, section 7).

### 6.12 The child's page, "coming soon" made quiet (alpha builds with servers off)

```
< Settings
Asha's book
 | Name / Birthday / Signs letters as ...
 | Write this book together    Coming soon |   one row, no chevron
```
Tap: a sheet with the title "For now, this book is yours." and the line "In a later update, Asha's other parent can add letters too, from their own phone." One Close button. No drawing, no motion.

### 6.13 Option B and C bars (for the founder's comparison)

```
B  |  Tonight     Book     Family     You  |
C  |  Tonight                    Book      |   settings by a gear on Tonight and Book
```

## 7. Collisions with open PRs

Files below are from each PR's changed-file list read through the REST API on 10 Nov, with heads as in section 1. #699, #720 and #738 are stacked, so their lists show the whole stack; "own" means the file the PR is about.

| File | #699 | #720 | #738 | #740 | #764 | What this spec asks of `mobile` |
|---|---|---|---|---|---|---|
| `apps/mobile/src/app/(tabs)/_layout.tsx` | adds You, keeps guard | same | **removes the `Tabs.Protected` guard and the `familySurfacesShown` import**, adds You and the hint | stack | re-adds the guard | Option A removes the Family `Tabs.Screen` altogether. Do it after #699 and #764 merge. |
| `apps/mobile/src/app/(tabs)/you.tsx` | adds | adds | adds | stack | n/a | No change. Add the People row in `settings/index.tsx`, not here. |
| `apps/mobile/src/app/(tabs)/family.tsx` | n/a | changes the build switch (`inviteDestination('family_tab', ..., PLUS_ALPHA)`) | n/a | n/a | n/a | Becomes the people page body at `/settings/people` (route name is `mobile`'s call). Do not edit until #720 merges. |
| `apps/mobile/src/app/(tabs)/index.tsx` (Tonight) | n/a | n/a | in the stack list, no net change at its head vs `develop` (I diffed it) | stack | n/a | R1 and R2 edit `DraftCard`, `ResurfacedCard`, not this file's logic. |
| `apps/mobile/src/app/(tabs)/book.tsx` | n/a | n/a | n/a | n/a | **edits it** (adds the arrival line, 21 lines) | R3 (empty state) and removing the gear edit the same file. Sequence after #764. |
| `apps/mobile/src/lib/family/entry.logic.ts` | n/a | **own**: `CO_PARENT_IN_STORE_BUILD`, `familySurfacesShown` | edits | stack | edits `visibleCoParentDoors` | Option A makes `familySurfacesShown` mean "show the child-page row", not "show the tab". Rename in a later PR. |
| `apps/mobile/src/components/family/coparent-soon.tsx` | n/a | edits | n/a | n/a | n/a | Section 4.3: drop the drawing and `Breathe`, keep title and line. After #720. |
| `apps/mobile/src/components/child/child-settings.logic.ts`, `settings/children/[id].tsx` | n/a | edits | edits `[id].tsx` | stack | edits `[id].tsx` | The "Write this book together" row stays here and carries the quiet "Coming soon". |
| `apps/mobile/src/app/settings/index.tsx` | n/a | n/a | **own** (You states) | stack | n/a | The People row goes in the Children section. After #738. |
| `apps/mobile/src/app/settings/_layout.tsx` | edits | edits | edits | stack | n/a | Register the people page. |
| `apps/mobile/test/tab-bar.test.ts` | adds | edits | edits | stack | n/a | Pins the bar. Option A changes its expected list to three items in every build. |
| `apps/mobile/test/family-tab.test.ts`, `store-family-tab.test.ts` | edits | edits | edits | stack | adds the latter | Both pin a Family tab in alpha builds. Both change under A. |
| `packages/content/src/strings.en.ts` (`tabs`) and `packages/content/test/tab-labels.test.ts` | adds `tabs.you` | edits | edits | stack | edits | Remove `tabs.family` last. |
| `packages/content/src/features/family.en.ts` | n/a | edits | n/a | n/a | n/a | Section 4.3 wording. After #720. |
| `docs/design/IA.md` | edits the tab table | edits | edits | stack | n/a | IA.md still says the store build "is meant to have two" tabs (line 87 on `develop`). Update to three, in every build, after the three PRs land. I do not edit it here (it is on three open PRs). |

Two findings that need an owner now:

1. **#738 at head `0cd8e1f1` deletes the guard `develop` has.** Its description says it "kept the Family tab as it is on #737 (no `Tabs.Protected` guard, that is #665's)". #665 is merged (`c1f7cec51`). Merged into `develop` as it stands, the layout diff removes `FAMILY_TAB` and the guard, so the store build shows Tonight, Book, Family, You. #764 (`b8a4230e`) has the guard back, so the order they merge in decides the outcome. The owner of #738 should re-base it on `develop` before review. I did not push to that branch.
2. **Option A removes the same lines #720 edits.** #720 makes the store build hide Family whatever `coParent` says; A hides it in every build. Do not merge A's PR before #720, #699 and #738 settle, or all four rebase on each other. Sequence in section 9.

## 8. Accessibility checks that apply to every change here

- Dynamic Type to AX5: no letter text is cut. Tab labels do not scale (13 pt, `tabBarAllowFontScaling: false`) and the Large Content Viewer carries AX users; the new `button(title)` call for each tab must be present. The flat Tonight row (R1) wraps its words; its line count follows `ExcerptFade`. The "Coming soon" row value wraps under the label at AX5.
- Targets: every row 44 pt or more (`tokens.target.min`). Three tabs at 375 pt are 125 pt wide each (computed from 375 / 3).
- VoiceOver: each tab has one level 1 heading; the flat Tonight row reads as one element: "Waiting to be kept. Saturday 14 October. One minute. Opens the letter." The month-ago row reads "A month ago. A letter from 14 October. Opens the letter." (existing `resurfaced.a11y`). The quiet Coming soon row reads "Write this book together, Coming soon, button."
- Reduce Motion and Reduce Transparency: no new motion is added. Removing the breathing drawing removes the one loop in the coming-soon path.
- Contrast: no colour changes. The raised-versus-flat difference does not rely on colour: raised has the surface and radius, flat has the hairline and no surface; the "Keep" verb is a word. Selected and unselected tab colours are 1.00 : 1 and 1.04 : 1 apart in luminance (NX-30a section 5, computed there from token hex values; I did not recompute), so the filled icon and the bolder label are the non-colour cue.
- Colour is never the only signal: nothing in this spec adds a colour state.
- Apple HIG on tab bars (single-word labels, navigation not actions, avoid overflow tabs): second-hand from NX-30a, which read the page through a summarising tool. UNVERIFIED by me this session; my fetch of the HIG page was blocked.

## 9. Sequence for `mobile` (one concern per PR, each under 400 lines)

| Step | PR | Size (guess) | After |
|---|---|---|---|
| N0 | Re-base #738 on `develop` so the guard stays | S | now |
| N1 | Merge #699 and #720 as they are (store build: Tonight, Book, You) | none | review |
| N2 | Remove the Family tab in every build; `family.tsx` becomes `/settings/people`; People row in You, shown only with a co-parent or an open invite; tests rewritten; `family.en.ts` `done` and `testflight.en.ts` line 104 words | M | N1, #738, #764 |
| N3 | The child-page row carries "Coming soon"; the sheet loses the drawing | S | N2 |
| N4 | Tonight: flat waiting rows; month-ago as a text row | S to M, depends on the prototype | N2 |
| N5 | Book: empty state's quiet button; remove the gear after a device pass shows You is found | S | #764 |
| N6 | `docs/design/IA.md`, `COMPONENTS.md` brought in step | S | N2 to N5 |

## 10. Open questions (each with a recommendation)

1. Founder: option A (three tabs, Family folded into You) or B? Recommendation: A, with the reopen trigger in section 3. Needed before N2 starts, and before #720 merges, so #720 is not reworked.
2. Founder: should TestFlight builds lose the Family tab too? Recommendation: yes. Testers keep every flow, reached from You and the child's page, and the founder's device matches what customers see. Cost: the testers' instruction line changes (`testflight.en.ts` line 104).
3. Founder: the third label, "You". Recommendation: keep "You" for the tab and "Settings" for the page title, as #738 has it, and decide after the device pass in the QA plan; fall back to "Settings" if parents miss it (NX-30a's fallback).
4. Product: does "A month ago" stay on Tonight as a text row (R2)? Recommendation: yes, as the one doorway into the Book; it is the only thing on Tonight that comes from the past, and it is hidden whenever a letter is waiting.
5. Product and Memory Library owner: photos as a view inside Book, not a tab. Recommendation: yes; revise ML-S9 and NX-30 option C before any Photos work starts.

## 11. UNVERIFIED list

- Anything on a device: how Tonight and Book feel, the flat row at AX5, VoiceOver spoken text for the tabs, the hint on the iOS tab wrapper.
- Apple HIG tab bar statements (labels, More tab, navigation not actions): from NX-30a, not read by me; my fetch was refused.
- Tap counts: derived from code in NX-30a and here, not measured.
- Whether `ReminderPrimeAsk` still sits over the Book after a first kept letter in the shipped build: read in `_layout.tsx`, not run.
- Whether any usage data exists for the Family tab: none found in the repo; none claimed.
- The rendered text of Book's `WaitingCard` ("Getting ready"): read from a code comment.
- #699, #720, #738, #740 and #764 are drafts and their heads move; section 7 holds only at the heads in section 1.
- Contrast ratios: quoted from NX-30a, not recomputed.
- Sizes S, M, L: guesses.
