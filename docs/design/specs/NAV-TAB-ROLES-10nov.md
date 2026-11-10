# Four tabs, one job each: Home, two middle places, Me, and a quiet "coming soon"

Owner: design systems (journey and IA lead for the "unique tabs" programme). Status: DRAFT v2 for the founder, `mobile`, `content`, `product` and `qa`, 10 Nov 2026 (UTC). Docs only: nothing here is built, no token or string is changed, and no word is live until the founder approves it and `mobile` wires it in the same PR that moves it. Signed: Design Systems and Accessibility Lead (Claude role).

v2 replaces v1 (three tabs, Family folded into You) after the founder changed direction. Founder, 10 Nov 2026, verbatim: "The navigation need to feel unique and carrying material info in each tab so one tab on right can be me which includes everything settings. Default home tab on left most is where you see actions memorities etc and then identify what other 2 tabs need to be that are relevant. We also need to identify what other capabilities we build as part of our scope so identify and write those requirements."

Tags. EVIDENCE: read in the repo, or at a named PR head or branch, this session. UNVERIFIED: not read, not run, not measured on a device. PROPOSED: my wording, number or rule. HYPOTHESIS: a statement about what a parent will do or feel. I wrote no statistic. Sizes (S, M, L) are guesses.

## 0. The short version

1. Four tabs, in this order: Home (left, the default), two middle places, Me (right). Home is where a parent acts and is reminded: say something now, finish what is waiting, see one memory from the book. Me is everything settings: account, plan, privacy, people and sharing, export, help.
2. The middle two are the real question. I give three options (section 5). Recommendation: Book and Library. Book is what was said (read it, hear it). Library is what was lived (the photos, videos, days and occasions that help a parent remember what to say). Each has a different kind of material, so neither repeats the other.
3. Library is specified (NX-39) but not built. A tab with no job is the problem the founder named. So Library joins the bar only in the build where its first phase is on, behind the same kind of build guard Family has today. Until then the bar is Home, Book, Me. If the founder wants four tabs on the bar before Library exists, option 2 (Book and Firsts) is the only one buildable from what exists, and I advise against filling a slot to fill a slot.
4. "Coming soon" is never a tab. It is one quiet row inside Me, under People and sharing: "Write this book together", value "Coming soon". The full-size Family page goes away (section 7).
5. Tonight and Book stop looking like one room: raised card means a kept letter; waiting-to-be-kept is a flat row; Home shows one memory as a slip that opens the Book. Collisions: the label changes (Tonight to Home, You to Me) and the Family removal touch the files #699, #720, #738, #740 and #764 edit, and #721 edits Home's memory card (section 10).

## 1. Audit: what each tab shows today

Read on `origin/develop` `6800a54f4` (10 Nov). PR heads read: #699 `81d25dd0`, #720 `54757ac4`, #738 `0cd8e1f1`, #740 `b2b730e1`, #764 `b8a4230e`, #721 `bd6727d1`.

### 1.1 The bar

- `apps/mobile/src/app/(tabs)/_layout.tsx`: JS tabs, Tonight (MoonStars), Book (BookOpen), Family (UsersThree) inside `Tabs.Protected guard={FAMILY_TAB}`. Labels from `copy.tabs` (`packages/content/src/strings.en.ts` line 58). 25 pt icons, 13 pt labels, no Dynamic Type scaling, Large Content Viewer on iOS.
- `familySurfacesShown` is `alpha || coParent` (`lib/family/entry.logic.ts`). Store build with servers off: two tabs. Every alpha build (TestFlight, preview): three. #720 makes a servers-on store build three as well (Tonight, Book, You).
- Settings has one door on `develop`: the gear on the Book cover band (`book.tsx`, `openSettings`). Tonight has none.

### 1.2 Tonight (`(tabs)/index.tsx`, 339 lines)

| Order | What it shows | Source |
|---|---|---|
| 1 | Date line "Asha, 7 months" (or "Before You") | `tonightDateline`, `tonightStageLabel` |
| 2 | Greeting in two tones, by time of day | `greetingParts`, `copy.tonight.greeting` |
| 3 | The prompt, large, with "Another thought" | `promptHero`, `selectPrompt` |
| 4 | Speak and Type, pinned (inline at accessibility sizes) | `Button size="capture"` |
| 5 | "Not much today" | `keepNotMuch` |
| 6 | One card per waiting draft; two or more fold to one row | `DraftCard`, `HeldRow` |
| 7 | Only if nothing waits: one kept letter from a month ago | `ResurfacedCard`, "A month ago" |
| 8 | A standing Plus line when free letters are used and Plus is off | `PlusLine` |

### 1.3 Book (`(tabs)/book.tsx`, 498 lines) and where it overlaps Tonight

Book: cover band ("Asha's book", age in words, Read together, the gear), months newest first, a letter card per kept letter, a quiet-day row per "Not much today" mark, a Months sheet, an end-of-book mark. Child switcher only with more than one book.

| # | Overlap (EVIDENCE) | Where |
|---|---|---|
| O1 | One lamp room. Both sit in `persistKey "tabs"`; only the scene name differs. | `index.tsx` `<Lamp scene="tonight" persistKey="tabs">`; `book.tsx` `<Lamp scene="book" persistKey="tabs">` |
| O2 | One object. Tonight's draft card, Tonight's month-ago card and Book's letter card are each a raised `Card` with a caps date line and `ExcerptFade`. | `tonight/draft-card.tsx`, `tonight/resurfaced-card.tsx`, `book/letter-card.tsx` |
| O3 | One date line style (`letterDateline` caps) on all three. | same files |
| O4 | Two empty rooms with the same ask. First day: Tonight asks for a letter; Book's empty state asks for one too and its button goes to Tonight (`router.navigate('/')`). | `book.tsx`; `copy.book.empty` (`strings.en.ts` lines 534 to 536) |
| O5 | Two meanings of "waiting". Tonight: a draft not yet kept ("Waiting to be kept", BRAND.md). Book: a kept letter whose words are still being made (`letterWords(item) === 'waiting'`). | BRAND.md; `book.tsx` |
| O6 | A kept letter on Tonight: "A month ago" is Book's object on the capture tab. It shows only when nothing waits. | `index.tsx` `monthAgo` |

No count, streak or gap on either tab. The sameness is shape and light, not content. I have not seen either tab on a device (UNVERIFIED).

Two gaps: G1, Tonight has no child switcher (with two books it writes to the last active one; `index.tsx` has no `ChildSwitcher`, `book.tsx` has). G2, with a Me tab the Book gear becomes a second door to the same Settings.

### 1.4 Family (`(tabs)/family.tsx`, 327 lines)

- Two bodies by `capabilities.coParent`: `FamilyShared` (who writes to {child}, signatures, pending invites, invite card) and `FamilySoon` (`CoParentSoon presentation="screen"`).
- `CoParentSoon` draws "Family" at display size, a 232 pt breathing drawing, "For now, this book is yours." and "In a later update, {child}'s other parent can add letters too, from their own phone." No action. It sends one content-free event, `coparent_soon_opened`, on each focus.
- The co-parent entry already exists in a second place: Settings, Children, the child's page, row "Write this book together" (`soon.settingsRow`; value `soon.status` "Coming soon").
- Words that name the Family tab: `family.en.ts` line 38 (comment) and line 75 (`done`: "The invite waits on the Family tab until they join."), `release/testflight.en.ts` line 104. Code: `FAMILY_TAB_HREF` (`child-settings.logic.ts` line 67), `family: '/family'` (`content-blocks/blocks.tsx` line 45).

### 1.5 You (on #699 and #738, not on `develop`)

- #699: `you.tsx` is `export { default } from '../settings/index'`. The tab root is the Settings home, no lamp, no Back, page title "Settings". Settings is 1 tap (was 2); Account 2 (was 3) (derived from code in NX-30a, not measured).
- #738: states A signed in, B signed out, C local start, 0 no sign-in (`youTabView`). #740: Account page sections.
- What it holds (`settings/index.tsx` at #738): header card and Plan; Children; Writing (language, Your words, Reminders, Appearance); Your letters (Where your letters live, Export, Recently deleted, back-up row when in the build, Storage, Erase on a phone that never signed in); Privacy and security (App lock, Privacy); Delete account; Help and legal; About.
- It has no row for people or sharing. That is the gap the founder's "Me" fills.

### 1.6 Two documents that are in flight

- NX-41 (product, branch `docs/nav-tabs-requirements-10nov`, EVIDENCE): three tabs, Family stays in alpha builds (R12), coming soon as a quiet row on You (R9, R10). The founder's four-tab direction replaces its tree; its quiet-row rule (R9 to R11) and its "one fact, one tab" rule (R6) I keep. Product's BL-898 reconciles the two.
- NX-42 (product's capability map, which the coordinator said would appear): I found no branch or file for it on 10 Nov (checked `git branch -r` after a fetch). Section 3 is my own inventory, from the documents named in it. NX-42 wins where they differ.

## 2. What the founder's direction fixes

| Fixed by the founder | Consequence |
|---|---|
| Four tabs | The bar has Home, A, B, Me. |
| Left-most is the default Home: "actions, memories" | Home carries doing (Speak, Type, Not much today, what is waiting) and remembering (one memory from the book). |
| Right-most is Me: "everything settings", including people and sharing, export, help, plans | Family is not a tab. People and sharing is a section of Me. |
| "Unique" and "carrying material info" | Each tab has information only it holds (section 6). |
| "Identify capabilities in scope and write the requirements" | Section 3 (inventory) and section 11 (the navigation requirements). Feature requirements stay with their owners (NX-39, product's NX-42). |

## 3. Capabilities and where each belongs

Status is on `develop` at `6800a54f4` unless a PR is named. "Spec" names the document that holds the requirements. I read the headings and the status lines of each spec, not every row (UNVERIFIED for anything not quoted).

| Capability | Status | Spec | Home |
|---|---|---|---|
| Speak, Type, Not much today | Built | F04 capture | Home |
| Prompts (111) and "Another thought" | Built | F13 | Home (one at a time) |
| Waiting to be kept, Keep | Built | F09, F14 | Home |
| "From the book" letter slip, day-zero book card | Draft PR #721 | NX-36 S13, BL-790 | Home |
| Letters by month, letter page, quiet-day rows | Built | F09 | Book |
| Read together | Built | F10 | Book |
| Several books, due-date mode | Built | F12 | Book (switcher), Me (add, edit) |
| Find a letter | Specified, not built | F09-REQ-015; gap G-4 | Book |
| Mark a first, tag only | Not built; "no milestone checklists" rule | gap G-6; BK-05 | Book (a tag on a letter) |
| Share one letter | Not built | gap G-3 | Book (action on the letter page) |
| On this day, calm play-back of a month | Not built (BK-06 S; month play-back later) | gap G-8 | Home (the slip), Book later |
| Photos and videos with a letter; date and place chips | Specified, not built | NX-39 P1, P2a; ML-S4 to S8 | Library (and Review) |
| "A day to tell a letter about" | Specified, not built | NX-39 P2b; ML-S10 | Home (shares the memory slot), Library |
| Occasions the parent types, reminders on those days | Specified, not built | NX-39 P4a; ML-S12, S13 | Library (list), Me (reminders) |
| Video | Specified, later | NX-39 P3 | Library |
| Sign-in, account, plan | Built or in the open stack | #724 to #740 | Me |
| Export (ZIP, PDF book), Recently deleted, Erase, Delete account | Built (Delete account behind a flag) | F15, F17 | Me |
| App lock, Appearance, Reminders, Spoken language, Your words | Built | F17 | Me |
| Back up recordings | Built behind a build flag, off | F19; gap G-1 | Me |
| New phone, "Opening your book" | #764 tier 0 | S17 spec | First screen after sign-in, then Home |
| Co-parent: invite, join, who writes | Built behind servers-on; "coming soon" in the store build | F11; BL-882 to BL-889 | Me, People and sharing |
| Printed book | Parked; June 2027 go/no-go | gap G-9 | Not in the nav. Export in Me; no tab |
| Relatives without the app | Later; family words are v1.1 | gap G-10 | Not in the nav |

Rule I apply: a capability gets a tab only if it has a different kind of material from every other tab and works on day one without a placeholder. That is why Print and Relatives get none, Co-parent goes to Me, and Library waits for its build.

## 4. Home and Me

### 4.1 Home (left, default)

| | |
|---|---|
| The parent's words | "What do I say to {child} now, and what did we already say?" |
| What only Home does | Starts a letter (Speak, Type, Not much today). Holds what is waiting to be kept. Shows the prompt for this time of day. Shows one memory: "A month ago" or "From the book" (#721), or on the first day the closed cover that opens the Book. When Library ships, a "day to tell a letter about" takes the same slot (ML-S10 says they share it; never both). |
| Material information only Home has | The time of day, the one question, the waiting letters. |
| Never | A list of kept letters. A count. Settings, account, people. |

### 4.2 Me (right)

| | |
|---|---|
| The parent's words | "Look after the book, and who can reach it." |
| What only Me does | Account and sign-in. Plan. The books (add, edit, hide). People and sharing. Language, Your words, reminders, appearance. Where letters live, export, recently deleted, back-up. App lock and Privacy. Delete account and Erase. Help, If you are struggling, Legal. About. |
| Material information only Me has | How this phone signs in, the plan in one word, where the letters live, who writes to {child}. |
| Never | A letter. A lamp. A badge, a colour change or a nag. |

Me adds one section to the #738 screen: People and sharing, between Children and Writing. One row, "People and sharing", opens a page. With servers on and co-parent live it is the body of `FamilyShared` (who writes to {child}, signatures, invites). With co-parent not live it is the quiet row of section 7. This is the only structural change to `settings/index.tsx`; the other groups stay as #738 and #740 have them. Founder's "plans" is the existing Plan row, directly under the account card in every state (CCO-9).

## 5. The middle two: three options

The test for a tab: a parent can say "I go to X to ..." with a verb that no other tab shares, the tab holds material only it holds, and it is not empty on the first day.

### Option 1: Book and Library (recommended)

| | Book | Library |
|---|---|---|
| Job | Read it back and hear it. | Remember what we lived, and turn a moment into a letter. |
| Kind of material | What was said: letters by month, the recording, Read together. | What was lived: photos and videos placed on the day they carry, days to tell a letter about, occasions the parent typed. |
| Only this tab | The whole book by month; the cover; Read together; the letter page; Months; later Find a letter, a first tagged on a letter, Share one letter. | The chooser and the moments; the date and place chips; a day card. |
| Source | Built (F09, F10) | NX-39, ML-S9 (written there as "the Photos tab, third of four"), NX-30 option C |
| First day | Closed cover, "The first page is waiting.", one quiet button to Home. | The "Add a photo or video" entry and the occasions row. No empty grid, no count. If the parent grants nothing, the baseline of ML-S15 applies and the tab still works through the system picker. |
| Many letters | Months grow; Months sheet; later Find a letter. | The moments the parent has attached or marked, by date. Never "photos without a letter". |
| Build state | Ready | Not built. Joins the bar when NX-39 P1 is on in the build (a guard like `Tabs.Protected`); until then three tabs. |

Why it is the one I recommend: it is the only option whose second tab holds a different kind of material from the Book, it is already specified with screens (ML-S1 to S15), and the founder named "memories and photos library" in the brief. The cost is dependence on NX-39, which is large and counsel-gated (the `media_read` consent, the promise wording; NX-39 section 5). NX-30a argued against a Photos tab (no photo feature then; the PRD forbids photo-only entries; the brand sits against photo apps). A Library that only exists to attach to letters and is named for remembering, not for photos, answers the PRD point; the brand point is the founder's.

### Option 2: Book and Firsts

| | Book | Firsts |
|---|---|---|
| Job | As option 1. | Mark a first, and choose what to talk about at this age. |
| Material | As option 1. | The child's stage in words ("7 months"); the firsts the parent tagged on letters, listed in their own words; the prompts for this stage; occasions the parent typed (NX-39 P4a, no photo access needed). |
| Source | Built | Prompts built (111, `selectPrompt`). Firsts tag: gap G-6, BK-05, S to M, not built. Occasions: NX-39 P4a, not built. |
| First day | Closed cover. | The stage, a short list of prompts for it. No firsts section until one exists. |
| Many letters | Months grow. | The parent's firsts, by date. |
| Risks | | G-6 and FUTURE 7.6 forbid milestone checklists and any "have you recorded X yet?" list, so the tab can never show what is missing; it risks reading as a checklist anyway (HYPOTHESIS). Browsing prompts overlaps Home's "Another thought". The stage-based prompts must not read as developmental advice (not assessed). |

It is the only option that can have a real second tab in Build 13 from capabilities that exist or are small. It is weaker as "material only this tab has", because the prompts and the stage already appear on Home.

### Option 3: Book and Listen

| | Book | Listen |
|---|---|---|
| Job | Read and find. | Hear it, together with {child}. |
| Material | Letters by month, in type. | The recordings: Read together, a month played in a row, "on this day" played. |
| Source | Built | Read together built (F10); month play-back and on-this-day are gap G-8 (BK-06 S, month play-back later), not built. |
| First day | Closed cover. | Nothing to play yet. |
| Risk | | The same letters as Book, split by sense, which breaks "one fact, one tab" (NX-41 R6). A parent who has no recordings (typed letters) gets an empty tab. |

I do not recommend it: it fails the day-one test and the one-fact test.

### Considered and set aside

- A People tab (Family renamed): the founder put people and sharing in Me.
- Keepsakes (share one letter, PDF, print): print is parked (G-9), share-one is not built, and the day-one state would be empty.
- Search as a tab: it is an action inside Book (G-4).

### Recommendation

Option 1. Bar: Home, Book, Library, Me. Library appears with its first build phase; until then Home, Book, Me. Trigger to revisit: NX-39 P1 slips past the build in which the founder wants four tabs. In that case choose between a three-tab bar and option 2, and do not ship a tab whose body is a promise.

## 6. Each tab, first day and many letters (recommended option)

| | Home | Book | Library | Me |
|---|---|---|---|---|
| Job | Say something now | Read and hear it | Remember and tell about it | Look after the book |
| First day | Date line, greeting, the first prompt, Speak, Type. The day-zero book card (#721) where the memory goes. | Closed cover, "The first page is waiting.", one quiet button to Home. | Add a photo or video; the occasions row. No grid. | Account card (or Sign in card), Plan "Free", Children, People and sharing. |
| First week | Prompts change by time of day. A waiting letter is a flat row. After a kept letter, the reminder ask appears over the Book (`ReminderPrimeAsk`). | "This month" and the letters. | Photos the parent attached, by date. | Same; a local start sees the Sign in card. |
| Many letters | Same length as day one. "From the book" shows one letter, picked by date, not by score (#721 `from-the-book.logic.ts`). | Months, Months sheet, later Find a letter. | The moments by date; a day card now and then. | Same. |
| Signed out | Unchanged; no sign-in prompt on Home in Build 12 (NX-36 Q4 as quoted in YOU-TAB-STATES). | Unchanged. | Unchanged (it reads the book's own files). | Sign in card with one button, then Plan. |
| Servers off | Unchanged. | Unchanged. | Unchanged (local). | "On this phone"; no Account, no sign-in; the People and sharing row shows the quiet coming-soon line (section 7). |

## 7. Coming soon, made quiet

Principles (PROPOSED, and consistent with NX-41 R8 to R11 and BL-882):

1. A feature that is not here is never a tab, a display-size title, or a drawing.
2. It is one row in Me, in People and sharing: "Write this book together", value "Coming soon" (`soon.settingsRow`, `soon.status`). Same size as its neighbours, muted text token, below the account rows, no badge, no accent colour, no count, no date, no notify button (SET-08 stays).
3. The row opens the existing sheet shortened: title "For now, this book is yours.", the line "In a later update, {child}'s other parent can add letters too, from their own phone.", Close. No drawing, no breathing. The line is a promise about the future and stays COUNSEL-READ.
4. The same row becomes the real thing: when co-parent is live it opens the invite sheet (one parent) or the people page (two parents), and its value is the co-parent's signature. No second surface to build.
5. Build rule. BL-882 (PR #767, Build 12, one coming-soon state for every co-parent surface, driven by `CO_PARENT_IN_STORE_BUILD` from #720) means a store build shows this row. D-126 says "no coming soon surface" and the 10 Nov decision that amends it for Build 12 is a D-### the founder still has to decide (#767 body). If the founder keeps D-126, the store build shows no row at all, and only alpha builds show it.
6. `coparent_soon_opened` keeps counting with `surface: 'sheet'`; `surface: 'tab'` stops.
7. Library, when it is not built, follows the same rule: no tab, no row (it is not a promise to the parent yet).

Words that change (all need `content` and founder approval): `family.sheet.done` becomes a line that points to Me, People and sharing, not to a Family tab; `release/testflight.en.ts` line 104 likewise; `tabs.family` goes. Door lines (COORDINATION section 10): the row asks for nothing. **Shown:** the existing `familyCopy.soon` words. **Records:** nothing beyond the opt-in, content-free count. **Never:** a date, a notify promise, a number. **Decline:** Close in one tap. The invite flow and its consent, Records and Never lines are unchanged.

## 8. Making Home and Book look like different rooms (PROPOSED)

| Rule | Home | Book | Why |
|---|---|---|---|
| R1 Raised card means a kept letter | Waiting-to-be-kept items are flat rows: date line, one line of words, "Keep" as the verb, hairline between. | Letter cards stay raised. | Fixes O2. |
| R2 One memory object on Home | The month-ago and "From the book" kept letter is one slip (#721), the only kept letter on Home. It opens the letter in the Book. | Everything else. | Fixes O6 and honours "memories" on Home. #721's slip is the object to restyle, not a second card. |
| R3 Book starts nothing | n/a | Empty state: closed cover and a quiet button to Home. | Fixes O4. |
| R4 Light says where you are | Lamp with the daypart tone and breath. | Lamp still (the `book` scene). | Already so; keep. |
| R5 Library and Me | Library: the paper of the Book with the photo as its object, no lamp. Me: plain paper, no lamp. | | Keeps lamps for the two rooms of the book. |
| R6 One word per waiting thing | "Waiting to be kept" (draft). | "Getting ready" (words being made). | Fixes O5. |

R1 is a prototype question: does a flat row still read as tappable and as work in progress at AX5? UNVERIFIED until built. The label "Home" no longer says "evening"; the prompt and lamp keep the time of day.

## 9. Text wireframes

Fictional family Asha. `[ ]` is a button, `~` is lamp light.

### 9.1 The bar

```
|  Home      Book      Library      Me   |    recommended, Library once built
|  (moon)    (book)    (images)     (person)|
|  Home      Book      Me                  |    before Library is built
```
VoiceOver: "Home, tab, 1 of 4", "Book, tab, 2 of 4", "Library, tab, 3 of 4", "Me, tab, 4 of 4. Settings and account." Selected: filled icon plus the bolder label (NX-30a R5, proposed there). Icons are placeholders (Phosphor).

### 9.2 Home, first day

```
~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
ASHA, BEFORE YOU
Good evening, Mama.
What is the first thing you want
{child} to know about today?     [ Another thought ]

 [cover] Asha's book                     (day-zero card, flat, opens Book)
         Ready for its first letter.

 [ Speak ]            [ Type ]
        Not much today
```

### 9.3 Home, a week in, a letter waiting and one memory

```
ASHA, 7 MONTHS
Good morning, Mama.
(the prompt)    [ Another thought ]

 Waiting to be kept                      (flat row)
 SAT 14 OCT  1 min
 "We went to the park and she laughed..."        Keep >
 ---------------------------------------
 A month ago                             (the one memory slip)
 "She slept through for the first time"      Read it >

 [ Speak ]            [ Type ]
        Not much today
```
Two or more waiting: one row that opens the list (`HeldRow`). When a day card from Library exists it takes the slip's place; never both.

### 9.4 Book, first day and a week in

```
First day:                               A week in:
|  Asha's book                  [gear?]|  |  Asha's book           [Read together]|
|      +--------------+                |  |  7 months      [ Months ]             |
|      |  closed cover|                |  |  THIS MONTH                           |
|      +--------------+                |  |  +--------------------------------+   |
| The first page is waiting.           |  |  | SAT 14 OCT                     |   |
|  [ Write a letter ] (quiet) -> Home  |  |  | "We went to the park..."       |   |
                                          |  +--------------------------------+   |
```
The gear leaves the Book after a device pass shows Me is found.

### 9.5 Library, first day and with moments (once built)

```
First day:                               With moments:
|  Library                             |  |  Library                             |
|  Add a photo or video     [ Choose ] |  |  OCTOBER                             |
|  Days you mark                     > |  |  [photo][photo][photo]               |
|  (occasions the parent typed)        |  |  Sat 14 Oct  ... with a letter  >    |
```
Nothing is counted; no "photos without a letter". The wording is NX-39's (`MEMORY-LIBRARY-WORDS-10nov.md`) and needs founder approval.

### 9.6 Me, signed in

```
Settings                                   (heading level 1; tab label "Me")
 | Mama                              >  |  Account card
 | Signed in with Apple                 |
 | Plan                       Free   >  |
CHILDREN
 | Asha's book  /  Add a book           |
PEOPLE AND SHARING                          new section
 | People and sharing                 >  |  opens the people page, or the
WRITING / YOUR LETTERS / PRIVACY AND SECURITY / DELETE ACCOUNT / HELP AND LEGAL / ABOUT
 (as #738 and #740 have them)
```

### 9.7 People and sharing, co-parent not live

```
< Me
People and sharing
 | Write this book together    Coming soon |   one row, muted, no chevron
```
Tap: the shortened sheet (section 7). With co-parent live this page is the body of `FamilyShared`:
```
Who writes to Asha
 From Mama   You
 From Papa   Co-parent
 Invited, open until 20 Nov   [ Share again ] [ Cancel invite ]
```

### 9.8 Me, signed out

As #738: "Not signed in", body, `[ Sign in ]`, then Plan, then the groups. Words are #738's (`settingsHome.signedOut.body`, `localStart.body`) and still need founder approval there.

## 10. Collisions with open PRs, and which renames apply

Files from each PR's changed-file list through the REST API on 10 Nov, at the heads in section 1. #699, #720, #738, #740 and #764 are stacked, so their lists show the stack.

Renames this spec causes: **R-a** `tabs.tonight` "Tonight" becomes "Home" (label only; keep the route `index.tsx` and the folder `components/tonight`); **R-b** `tabs.you` "You" becomes "Me" (label only; keep the file `you.tsx` and route `/you` to avoid renaming across four PRs; rename later or never); **R-c** `tabs.family` removed; **R-d** a Library tab added behind a guard; **R-e** the words "Tonight" and "Family tab" in strings.

| File | #699 | #720 | #738 | #740 | #764 | #721 | Change asked | Rename |
|---|---|---|---|---|---|---|---|---|
| `apps/mobile/src/app/(tabs)/_layout.tsx` | adds You, keeps guard | same | **removes `Tabs.Protected` and the `familySurfacesShown` import**, adds You | stack | guard back | n/a | Drop the Family `Tabs.Screen`; label order Home, Book, (Library), Me; Library inside a guard | R-a, R-b, R-c, R-d |
| `apps/mobile/src/app/(tabs)/you.tsx` | adds | adds | adds | stack | n/a | n/a | Keep the file name; only the label changes | R-b |
| `apps/mobile/src/app/(tabs)/family.tsx` | n/a | edits the switch | n/a | n/a | n/a | n/a | Body moves to the People and sharing page; leave until #720 merges | R-c |
| `apps/mobile/src/app/(tabs)/index.tsx` | n/a | n/a | no net change vs `develop` (I diffed it) | stack | n/a | **edits** (+29 lines) | R1, R2 restyle `DraftCard` and #721's slip; coordinate with #721's owner. I did not push to it. | R-a (comments) |
| `apps/mobile/src/components/tonight/resurfaced-card.tsx` | n/a | n/a | n/a | n/a | n/a | **edits** (+32) | R2: one memory object. Same owner conversation. | |
| `apps/mobile/src/app/(tabs)/book.tsx` | n/a | n/a | n/a | n/a | **edits** (+21, the arrival line) | n/a | R3 empty state; remove the gear later. After #764. | |
| `apps/mobile/src/lib/family/entry.logic.ts` | n/a | **own**: `CO_PARENT_IN_STORE_BUILD` | edits | stack | edits | n/a | `familySurfacesShown` no longer means "show the tab"; it means "show the real people page", and BL-882 shows the quiet row otherwise | R-c |
| `apps/mobile/src/components/family/coparent-soon.tsx` | n/a | edits | n/a | n/a | n/a | n/a | Sheet only; drop the screen presentation, the drawing and `Breathe`. After #720. | R-c |
| `apps/mobile/src/app/settings/index.tsx`, `settings-home.logic.ts` | n/a | n/a | **own** | stack | n/a | n/a | Add the People and sharing section; `youTabView` keeps its name | R-b (hint) |
| `apps/mobile/src/app/settings/children/[id].tsx`, `child-settings.logic.ts` | n/a | edits | edits `[id].tsx` | stack | edits `[id].tsx` | n/a | The per-book "Write this book together" row stays and links to the same page | |
| `apps/mobile/src/app/settings/_layout.tsx` | edits | edits | edits | stack | n/a | n/a | Register the people page | |
| `packages/content/src/strings.en.ts` (`tabs`, `settingsHome.youTabHint`) | adds `tabs.you` | edits | edits | stack | edits | edits (+11) | `tabs` becomes `home`, `book`, `library` (later), `me`; hint text for Me. #721 also edits this file, so expect a merge conflict. | R-a, R-b, R-c |
| `packages/content/test/tab-labels.test.ts` | adds | adds | adds | stack | n/a | n/a | It pins `Object.keys(en.tabs)` to `['tonight','book','family','you']`; update the list | R-a, R-b, R-c |
| `packages/content/src/features/family.en.ts` | n/a | edits | n/a | n/a | n/a | n/a | `done` (line 75) and the comment on line 38 | R-e |
| `packages/content/src/features/billing.en.ts` lines 51, 52, 59; `strings.en.ts` lines 1159 and 1165 | n/a | n/a | n/a | n/a | n/a | n/a | "This letter waits on Tonight", "Go to Tonight", "Back to Tonight" must read Home (or the tab name the founder picks). Not in any of the five PRs. | R-a, R-e |
| `apps/mobile/test/tab-bar.test.ts`, `family-tab.test.ts`, `store-family-tab.test.ts` | edits | edits | edits | stack | adds the latter | n/a | They pin the bar and a Family tab in alpha builds; rewrite for the new list | R-a to R-c |
| `apps/mobile/e2e-web/j04-tonight.flow.ts`, `j21-coparent.flow.ts`, `j22-sign-in.flow.ts`, `support/app.ts` | n/a | n/a | n/a | n/a | edits some e2e-web files | n/a | They name tabs by label (found by file-name grep of the tab words; which lines tap a tab is UNVERIFIED); `j21` goes through the Family tab | R-a to R-c |
| `docs/design/IA.md` | edits | edits | edits | stack | n/a | n/a | Bring to four tabs after the PRs land. I do not edit it here. | all |
| `docs/design/specs/YOU-TAB-STATES-9nov.md` (PR #732) | | | | | | | Names say "You"; add a line that the label is Me | R-b |

Findings for owners:

1. **#738 at `0cd8e1f1` deletes the guard `develop` has** (#665 merged as `c1f7cec51`). Merged first, the store build shows Tonight, Book, Family, You. #764 (`b8a4230e`) has the guard back. #738's owner should re-base. Nothing pushed to that branch.
2. **#721 edits Home's memory card.** R2 asks for one memory object. Its owner and I need the same answer on whether the slip is raised or flat. Open question 5.
3. **Merge order.** The Family removal and the renames touch `_layout.tsx` on five PRs. Do not start them until #699, #720, #738 and #764 settle (section 12).

## 11. Requirements (Given, When, Then)

Ids are `NAV-R#`, working ids; `product` assigns real ones (NX-41 or NX-42). Feature requirements for the capabilities in section 3 stay in their own specs; these rows say where each surfaces and what each tab must hold.

| Id | Requirement | Device and proof |
|---|---|---|
| NAV-R1 | Four slots, fixed order. Given any build, When the bar draws, Then the left item is Home, the right item is Me, and the items between are the middle places that build has. | iPhone; `tab-bar.test.ts` |
| NAV-R2 | One job each. Given each tab's first screen, Then a parent who has not seen the specs can say a verb for it that no other tab shares. | Five-parent read-through (research doc, section 6); at least 4 of 5 is a proposed bar, not a measurement |
| NAV-R3 | No tab is only a promise. Given a build where a tab's capability is not on, Then the tab is not in the bar. | `tab-bar.test.ts` reads the guard |
| NAV-R4 | Home acts and reminds. Given a book with many letters, When Home opens, Then Speak and Type are the first controls, waiting letters are flat rows, and one kept letter shows at most (the slip). No list of kept letters. | Device, AX5 |
| NAV-R5 | Book reads. Given a book with letters, When Book opens, Then the cover and the newest month are first; no capture control except the empty-state button to Home. | Device |
| NAV-R6 | One kind of material per middle tab. Given the middle tabs, Then no kept letter is the main object of two tabs, and Library never shows a count of photos without letters. | Review against section 5 |
| NAV-R7 | Me holds all settings. Given Me, Then account, plan, people and sharing, privacy, export, help and the books are reachable from its first screen in one tap; no Settings door remains elsewhere once a device pass shows Me is found. | Device; 1-tap count derived from code |
| NAV-R8 | People and sharing lives in Me. Given co-parent live, Then the people page opens from Me; Given not live, Then one quiet "Coming soon" row (section 7). | Device both builds |
| NAV-R9 | Coming soon is quiet. Given the row, Then it is no larger than a neighbour, uses the muted token, has no badge, accent, count or date, and closes in one tap. | Device |
| NAV-R10 | Library is gated. Given a build where NX-39 P1 is off, Then no Library tab and no row for it exists. Given it is on, Then the tab shows the day-one state of section 6 and no empty grid. | `tab-bar.test.ts`, device |
| NAV-R11 | Labels are single glossary words. Given `copy.tabs`, Then each label is one word, passes `rules.test.ts` and `tab-labels.test.ts`, and is not "Memories" for a thing the parent makes (BRAND.md glossary: "memory" is banned as a word for a letter). | `content` |
| NAV-R12 | Accessibility. Given VoiceOver, AX5, Reduce Motion, Reduce Transparency, light and dark, Then each tab has one level 1 heading, tab labels stay at 13 pt with the Large Content Viewer (`LARGE_CONTENT(title)` on every tab), targets are 44 pt or more, and nothing relies on colour alone. Four tabs at 375 pt are 93.75 pt wide (computed, 375 / 4); the widest label is "Library"; its width at 13 pt Mukta Medium I did not measure (UNVERIFIED; NX-30a measured the other words). | Device |
| NAV-R13 | Constitution. Given any new string, Then no streak, point, badge, gap count, fear, guilt or loss word; {child} for the child; nothing says a machine writes; glossary words only. | `rules.test.ts` |
| NAV-R14 | No analytics added. Given this spec, Then no new event or property. `coparent_soon_opened` keeps counting with `surface: 'sheet'`. | `packages/analytics` catalog |
| NAV-R15 | Signed out and servers off do not change a tab's job. Given either, Then Home, Book and Library work with no account and no network; Me shows its state card. | Device, airplane mode |
| NAV-R16 | One word for waiting. Given Home and Book, Then "Waiting to be kept" means a draft only and Book's word for words being made is "Getting ready". | `content` |

## 12. Sequence for `mobile` (one concern per PR, each under 400 lines)

| Step | Change | Size (guess) | After |
|---|---|---|---|
| N0 | Re-base #738 so the guard stays | S | now |
| N1 | #699 and #720 merge as they are (store build: Tonight, Book, You) | none | review |
| N2 | Remove the Family tab in every build; `family.tsx` becomes the people page; People and sharing section in Me | M | N1, #738, #764 |
| N3 | The coming-soon row and the shortened sheet (BL-882 supplies the switch) | S | N2, #720 |
| N4 | Labels: Home and Me; the Tonight strings in `billing.en.ts` and `strings.en.ts`; tests; e2e-web flows | S to M | N2 |
| N5 | Home: flat waiting rows; one memory slip (with #721's owner) | S to M | #721, N2 |
| N6 | Book: empty-state button; remove the gear after a device pass | S | #764 |
| N7 | Library tab behind a guard, when NX-39 P1 is on | L (NX-39's) | NX-39 P1 |
| N8 | `IA.md`, `COMPONENTS.md` in step | S | N2 to N7 |

## 13. Open questions (each with a recommendation)

1. Founder: Option 1 (Book and Library), 2 (Book and Firsts) or 3? Recommend 1, with the bar at three tabs until Library is built. Needed before N2, and before #720 merges.
2. Founder: is a three-tab bar acceptable until Library exists, or must four tabs ship in Build 13? Recommend three; if four, option 2, accepting that Firsts has less material of its own.
3. Founder and content: labels "Home" and "Me" (and "Library" or "Moments" for the third). Recommend "Home" and "Me"; "Library" until the five-parent study says otherwise. "Memories" is out as a tab word under the glossary. "Tonight" stays the name of the evening prompt and the lamp's mood in copy.
4. Founder: D-126 versus BL-882. Does a store build show the quiet "Coming soon" row in Me? Recommend yes, as NX-41 R9 and BL-882 have it; if no, the row is alpha only.
5. Product and #721's owner: is Home's one memory a raised card or a flat slip? Recommend flat, with the kicker; prototype first.
6. Product: NX-42 does not exist yet on any branch I could see. Recommend it adopts section 3 as its starting inventory and its nav-facing rows from section 11.

## 14. UNVERIFIED list

- Everything on a device: how the tabs feel, the flat row at AX5, VoiceOver spoken text, the iOS tab-button wrapper, the "Library" label's width at 13 pt.
- Apple HIG tab-bar statements (single-word labels, navigation not actions, overflow tabs): second-hand from NX-30a, not read by me; my fetch of the HIG page was refused. Nothing in this spec depends on a number from it.
- Tap counts: derived from code, not measured.
- Contrast ratios: quoted from NX-30a, not recomputed. This spec changes no colour.
- Whether NX-39 P1 is in Build 13 or when: not stated in what I read.
- Whether any usage data exists for any tab: none found; none claimed.
- Which lines of the e2e-web flows tap a tab: file names found by grep, lines not read.
- The rendered text of Book's `WaitingCard` ("Getting ready"): read from a code comment.
- #699, #720, #738, #740, #764, #721 and #767 are drafts or open; their heads move. Section 10 holds only at the heads in section 1.
- NX-42: not found. Sizes S, M, L: guesses.
