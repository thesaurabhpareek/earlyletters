# 6. Home, Book and Me: information architecture, states and the navigation test

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. This replaces the four-tab bar of `NAV-TAB-ROLES-10nov.md` v3 (PR #789, head `c189206b`) with the founder's three: Home (Say) | Book (Read) | Me (Look after). It keeps that file's four classes and placement rules P1 to P9. It uses `NX-41` to `NX-44` (PR #790, head `d80db1f2`) for Home's order, the memory slot and Firsts.

## 1. The bar, the verbs and the sentences

```
|   Home          Book          Me    |
|   (Say)         (Read)     (Look after)   <- verbs are for the team; the bar shows only the label
```

| Tab | Route (kept) | Verb | "I go to X to ..." (PROPOSED) | Material only this tab holds | Never |
|---|---|---|---|---|---|
| Home | `/` (`index.tsx`) | Say | I go to Home to say something to {child}. | Today's prompt; the one capture cluster; what waits to be kept; at most one memory slip | A list of kept letters; settings; sending |
| Book | `/book` | Read | I go to the Book to read, hear or find what we kept. | Every kept letter by month; recordings; the lenses (Photos, Firsts); Find; Read together; the letter page and its object actions | A control that starts a letter |
| Me | `/you` | Look after | I go to Me to look after my account, my books and my rules. | Account, Plan, Children, Writing, Your letters, Privacy and security, Take the book with you, Help, About | A letter; a lamp; a count |

Rules that hold:
- Three tabs, in this order, always. The bar never gains a fourth tab for a feature. A tab needs the test in `03` section 8 (Share) or an equivalent written for it.
- Labels: "Home" and "Me" are the founder's words. "Book" stays. Single words, from the glossary (HIG tab bars: single-word labels; the 13 pt label floor and Large Content Viewer in `_layout.tsx`, as NX-41 R14 says, EVIDENCE as quoted there).
- Family is never a tab. Co-parent "coming soon" is at most one caption line in Me (section 5).
- The Library is not a tab (spec 1). Share is not a tab (spec 3).
- Each tab's first screen has one level 1 heading that says its job, and the tab label is its short name.

Renames this implies in code (labels only; keep routes): Tonight to Home, You to Me; the `family` screen leaves the bar. Collisions with open PRs are listed in NAV-TAB-ROLES section 10 and not repeated; the third slot now becomes Me (not Share), which removes its R-c.

## 2. Placement rules (kept from NAV-TAB-ROLES, restated for three tabs)

| # | Rule |
|---|---|
| P1 | Capture has one entry: Home's cluster (Speak, Type, Not much today, Start from a photo) and the one function behind it. Doorways (widget, control, Siri) open its Ready state |
| P2 | A capture that starts from a photo, a day or an occasion is a mode of that entry, reached on Home |
| P3 | Lenses live in the Book and appear only with material (Months always; Photos; Firsts). Find and Read together are Book actions |
| P4 | Sending one letter is an action on the letter page, in the Book (spec 3). No tab |
| P5 | Care lives in Me, including export and where letters live (section 5) |
| P6 | Doorways, not lists, across tabs: Home may show one memory slip; no tab shows another's list |
| P7 | One fact, one place |
| P8 | Coming soon is one quiet line inside Me. Never a tab, never a page |
| P9 | Object actions stay on the object: add a photo, mark a first, close until a day, share this letter. Each changes that letter only |

## 3. Home (Say)

### 3.1 What it shows, in order (NX-43 R1, kept; EVIDENCE for the order)

1. Date line with the child's age in words, and the greeting by time of day (`tonight.greeting.*`). The child switcher when there is more than one book (NAV-TAB-ROLES Gaps: Tonight has none today).
2. The prompt, with "Another thought".
3. The capture cluster, pinned: Speak, Type (64 pt, equal), then the quiet "Start from a photo" (spec 1), then "Not much today".
4. Waiting letters as flat rows (`tonight.draft.*`); two or more fold into one row.
5. At most one memory slip, flat, opening the letter in the Book (NX-43 R2 to R8). Or one day card (ML-S10), never both.
6. The Plus line, only when it applies.

Home lists no kept letters and starts nothing but a take.

### 3.2 Wireframe (a week in; fictional Asha)

```
 ASHA, 7 MONTHS                    Good morning, Mama.
 What is one small thing she did today?
                                [ Another thought ]
 [ Speak ]                 [ Type ]
        Start from a photo
          Not much today
 Waiting to be kept                     (flat row)
 SAT 14 OCT  1 min   "We went to the park"     Keep >
 A month ago                            (the one slip, flat)
 "She slept through for the first time"      Read it >
```

### 3.3 States

| State | Behaviour |
|---|---|
| First run, day zero | Date line, greeting, the first prompt, the cluster, and #721's day-zero book card where the slip goes (NAV-TAB-ROLES 5.1). No empty box, no "nothing yet" (NX-43 H1) |
| Many letters | Same length as day one; at most one slip |
| Draft waiting | Flat row(s) above the slip (NX-43 R6; the older "slip only when nothing waits" rule is the conflict NX-43 section 10 names; default here: slip below drafts) |
| Offline | Identical. Nothing on Home needs the network. The first-run and billing lines that do say so in their own words (NX-31-R18 as quoted in NX-41) |
| Signed out, local start | Same Home; never asks to sign in on its own (NX-43 U1) |
| Error: store cannot open | The existing "The book could not open" recovery screen (IA.md, EVIDENCE), not a Home state |
| Microphone denied | Speak shows the existing `errors.micDenied` line and Type works (CaptureBar disabled state) |
| Photos build switch off | "Start from a photo" is absent |
| App locked | Cover first; no memory text in the app switcher (NX-43 R10) |
| Two books | The switcher names the active book; memory and drafts are that book's |

### 3.4 Components and tokens

`ScreenHeader` (heading level 1: the greeting), `Text` (`prompt`, `promptHero`), `CaptureBar` rest variant, `Button` (`quiet`), `Card` flat variant for waiting rows and the slip (a flat row so "raised" keeps meaning a kept letter, NAV-TAB-ROLES R1; prototype question at AX5, UNVERIFIED), `Lamp` scene `tonight` (daypart, breathes), `ListRow`. Tokens: `atmosphere.scene.tonight`, `target.capture`, `space`, `radius.md`. The tab keeps the scene key `tonight` until a tokens change renames it.

## 4. Book (Read)

### 4.1 What it shows

The cover band (title, age in words, Read together, child switcher when there is more than one book); the Find magnifier (spec 2); one `LensRow` only when a second lens has material (specs 1 and 4); the months, newest first, as raised letter cards; a quiet-day row where a mark exists; flat closed rows for sealed letters (spec 4). The gear leaves the Book once Me is found (device pass), so there is one door to settings.

### 4.2 Wireframe

```
 Asha's book                          [Find]
 7 months             [ Read together ]
 ( Months )  Photos  Firsts          <- only lenses with material
 THIS MONTH
 +--------------------------------------+   raised card = a kept letter
 | SAT 14 OCT   "We went to the park"   |
 +--------------------------------------+
 A quiet day                              <- flat row
 A closed letter. Opens 12 Jun 2044.      <- flat row (if spec 4 is built)
```

Letter page: read it, hear it, then the object actions: Add a photo, This was a first, Close until a day, Share this letter. Each opens a sheet or row and changes this letter only.

### 4.3 States

| State | Behaviour |
|---|---|
| First day, no letters | The closed cover and the existing title "The first page is waiting." (`book.empty.bookTitle`) and one quiet button that moves to Home. The existing label is "Write a letter" (`bookCta`); that wording reads as starting a letter on the Book. Slot: the button should read as a pointer to Home (J3). Behaviour is a tab switch, not a capture call. Only the Months lens exists, so no lens row, no Find |
| Letters, no photo or first | Months only; no lens row; Find present |
| Waiting for words | Existing waiting card (`book.waitingForWords`); Book's word is "getting ready" (R6 in NAV-TAB-ROLES); a draft is not a Book card |
| Offline | Identical; all local. Read together and hearing a letter work offline (recordings are on the phone) |
| Error | A letter file missing: the letter reads; the media box says so (ML-S8). Index not ready: Find says so (02). Book cannot load: the existing recovery |
| Two books | Switcher on the cover; the lens row and Find follow the active book |
| Signed out, local start | Works. The arrival line from S17 (new phone) belongs to its spec |
| App locked | Cover; no text in the switcher |
| Nameless child | "Your child's book" fallback |

### 4.4 Components

`BookCover` (2.24), `MonthOpener` (2.20), `LetterCard` (2.5), `AppNote` and `QuietDayRow` (2.5b), `LensRow` (NEW), `FindBar` (NEW), `SealedRow` (NEW), `AudioPlayer` (2.21), `ReadTogetherPlayer` (2.22), `PhotoFrame`/`MediaGrid`. Lamp scene `book` (still, intensity 0.6).

## 5. Me (Look after)

### 5.1 What it shows

Plain paper, no lamp, one level 1 heading ("Settings" per NAV-TAB-ROLES 9.7; the tab label is Me; the heading word is a content decision, default: the existing Settings word so the Terms' "Settings, Plan" stays true, CCO-9 as quoted).

Sections, in order (existing rows from IA.md and #738/#740 as described in NAV-TAB-ROLES 5.4; EVIDENCE for IA.md, second-hand for the PRs):

1. Account card (or Sign in, or "On this phone"), then Plan.
2. Children: each book; Add a book; Hidden books when one is hidden.
3. Writing: Spoken language, Your words, Reminders, Appearance.
4. Your letters: Recently deleted, Storage, Photos and days (when built).
5. Take the book with you: Export your book; Where your letters live; Back up my recordings (absent until on). This is the section that would have been Share. It sits here because it is care of the book (P5), at a position below Your letters.
6. Privacy and security: App lock, Privacy.
7. Delete account (only while signed in).
8. Help and legal: Help, If you are struggling (always present, D-034), Terms, Privacy Policy, Licenses.
9. About.

Co-parent: while it is not live, one caption line, no button, no badge, no colour, no date, muted text, below the Children rows (P8; NX-41 R9 to R11 are the constraints: the strings exist as `familyCopy.soon.settingsRow` and `status`, EVIDENCE as quoted; the sheet from `coparent-soon.tsx` stays and opens from the line; default is the line opens the existing sheet with Close). It is not above the fold on Me's first screen (NX-41 R10). Where co-parent is live (alpha, servers on), the real people rows replace it in the same place.

### 5.2 States

The signed-in, signed-out and local-start states are #738's (`YOU-TAB-STATES-9nov`) and unchanged. This spec adds: the Take the book with you section works with no account (export reads the phone); "Where your letters live" says this phone only when signed out; empty book: Export stays (data rights) and its screen says in one line the book has no letters yet (slot; NAV-TAB-ROLES 6.2 notes this is odd and offers no better design; default as written).

Offline: rows needing the network say so in their own words; no row shows an error as its first line (NX-41 U5). Error: a failed export shows the existing export error. Day one: Me is long; it is also the least visited tab, so its first screen is Account, Plan and Children.

## 6. First run, offline and error across the three tabs (one table)

| | Home | Book | Me |
|---|---|---|---|
| First run (nothing kept) | Prompt and cluster; day-zero card | Closed cover; one pointer to Home | Account or Sign in; Children with the one book |
| After first letter | Same length; one waiting row until kept | The letter in its month; Find appears | Unchanged |
| Offline | Unchanged | Unchanged | Rows that need network say so |
| Error | Mic or store line | Missing media box; Find not ready | Row-level error line |
| Locked | Cover | Cover | Cover |

## 7. Look, motion and accessibility for the tabs

Rooms differ by rule (NAV-TAB-ROLES section 8, kept): Home has the daypart lamp that breathes; Book has a still lamp and raised cards for kept letters; Me has plain paper. Three differences are visible at once (NX-41 R4's test). Switching tabs is calm: the lamp settles, no content slides (NX-41 R5; existing EXPERIENCE_PASS rule). Tab switch motion: `swapMs` 150 cross-fade; Reduce Motion: none. Tab bar: three items, 125 pt each at 375 pt (computed: 375 / 3), labels at the 13 pt floor with Large Content Viewer at AX sizes; I measured no label width (UNVERIFIED). VoiceOver: "Home, tab, 1 of 3", "Book, tab, 2 of 3", "Me, tab, 3 of 3. Account and settings." Each tab has one level 1 heading read first. Targets 44 pt or more. Reduce Transparency: the bar is solid `surfaceRaised` with a 1 pt `line` top edge (`platform/blur-surface`).

## 8. Copy slots (for `content`)

Existing (EVIDENCE): `tabs.tonight`, `tabs.book`, `tabs.family` (strings.en.ts lines 58 to 62), `book.empty.*`, `tonight.*`, `book.entryMenu.*`.

| Slot | Intent | Rules |
|---|---|---|
| `tabs.home`, `tabs.me` (and `tabs.book` kept) | Labels | One glossary word each; `tab-labels` test updated; "Me" and "Home" are the founder's |
| `tabs.homeA11y`, `.bookA11y`, `.meA11y` | VoiceOver hints of the tab | Say the job in a few words; no verb repeated across tabs |
| `home.title` | The level 1 heading, if the greeting is not it | |
| `book.empty.pointer` | The button on the empty Book that moves to Home | Must read as a pointer, not as starting a letter in the Book |
| `me.takeBookSection` | Section title for export, where letters live, backup | Replaces the idea of a Share tab; not "share" as backup (glossary) |
| `me.coparentCaption` | The one caption line | Reuse `familyCopy.soon.settingsRow`; no date, no notify promise |
| `me.exportEmpty` | Export on an empty book | One line |
| `book.lens.*`, `book.find.*`, `book.letter.*` | See specs 1, 2, 3, 4 | |

Paths in copy that name old places must change in the same PR: "Tonight" in `billing.en.ts` (lines 51, 52, 59) and `strings.en.ts` (1159, 1165) must read Home; "Settings, Your letters" in `release/testflight.en.ts` (line 147) and any Family-tab mention (lines 104 and `family.en.ts` line 75) (all from NAV-TAB-ROLES section 10, EVIDENCE as stated there at a different head; UNVERIFIED on `da83fb1e`).

Door lines: none new. The co-parent caption keeps NAV-R13's lines: Shown, the existing `familyCopy.soon` words; Records, nothing beyond the opt-in content-free count; Never, a date, a notify promise, a number; Decline, Close in one tap.

## 9. Requirements (working ids IA-R#)

| Id | Requirement | Proof |
|---|---|---|
| IA-R1 | Three tabs. Given any build, Then the bar has exactly Home, Book, Me, in that order, and no screen for Family, Library, Photos or Share | navigation test N1, N4 |
| IA-R2 | One verb each. Given the job table, Then each tab declares one verb and no two are equal | navigation test N2 |
| IA-R3 | One capture entry. Given the source, Then only Home's module and the allow-listed doorways call the capture start function | navigation test N3 |
| IA-R4 | Book starts nothing. Given the Book's empty state, Then its button switches to Home and calls no capture function | N5 |
| IA-R5 | Job in the first line. Given each tab, Then its level 1 heading and first element say the job | device, `user-research` read-through |
| IA-R6 | Rooms differ. Given Home, Book, Me, Then at least three of lamp, card shape, type scale of the main line, main action, entry motion differ, judged by a person who has not seen the specs | device |
| IA-R7 | Me holds no letter, lamp or badge | device |
| IA-R8 | Co-parent coming soon is one caption line in Me, below the fold of the first screen, muted, with no badge | device (NX-41 R10) |
| IA-R9 | Home lists no kept letters; at most one memory slip | device, AX5 |
| IA-R10 | Accessibility per section 7 in both themes with Reduce Motion and Reduce Transparency | device |
| IA-R11 | Content. New strings pass `rules.test.ts` and the tab-labels test | content tests |
| IA-R12 | No new analytics event (NAV-R12) | catalog |

## 10. The navigation test: fails if two tabs share a verb or a capture entry

Owner of the code: `mobile` (it edits `apps/mobile/**`); `qa` reviews; `design-systems` owns the manifest's wording. I write no code here. Names are PROPOSED and UNVERIFIED against the repo: `apps/mobile/test/tab-bar.test.ts` exists only in the open stack (#699 to #764), not on `develop`, so this is a new file.

### 10.1 The manifest (one source of truth, also read by the tab layout)

```ts
// apps/mobile/src/lib/nav/tab-jobs.ts  (PROPOSED path)
export const TAB_JOBS = [
  { id: 'index', label: 'home', verb: 'say',        job: 'tabs.home.job', captureEntries: ['speak', 'type', 'notMuch', 'photoFirst', 'dayCard'] },
  { id: 'book',  label: 'book', verb: 'read',       job: 'tabs.book.job', captureEntries: [] },
  { id: 'you',   label: 'me',   verb: 'look after', job: 'tabs.me.job',   captureEntries: [] },
] as const;
export const CAPTURE_DOORWAYS = ['widget', 'lockScreenControl', 'actionButton', 'siri', 'nativeIntent'] as const;
```

### 10.2 The checks

| # | Check | Fails when |
|---|---|---|
| N1 | Bar | The layout's screens are not exactly `index`, `book`, `you` in that order, or the labels are not `copy.tabs.home`, `.book`, `.me` |
| N2 | Verbs | Any two tabs have the same `verb`; or a verb is empty; or the first verb in a tab's job sentence is not its declared `verb` (checked on the English string by the first word after "to" in the pattern "I go to X to <verb>"); or two tabs' job sentences share a verb after stemming |
| N3 | Capture entries | A `captureEntries` id appears under two tabs; or any tab other than `index` has a non-empty list; or a source file outside Home's module and the doorway handlers imports or calls `startCapture` (the one capture function), pushes the capture routes (`/listen`, `/write`) , or renders the capture cluster component. The scan is a plain read of `apps/mobile/src/**` (the way `tab-bar.test.ts` is described as reading sources in NAV-R2); allow-list is `CAPTURE_DOORWAYS` plus the Home route and `components/tonight/**` |
| N4 | No extra tabs | The layout defines `family`, `library`, `photos`, `share` or a fourth screen; or a tab guard (`Tabs.Protected`) hides one |
| N5 | Book starts nothing | The empty-state button in the Book handler references `startCapture`, `/listen` or `/write` rather than the Home tab |
| N6 | Words | The tab labels are single words and each appears in the BRAND.md glossary; `copy.tabs` has no key other than `home`, `book`, `me` and their `A11y` pairs |
| N7 | Counts | No string reachable from the tab modules matches a count pattern (a number followed by "letters", "photos", "firsts", "days") in the lens, Find and Firsts keys. Count of the parent's own selection in the chooser is allow-listed by key |

### 10.3 The test must prove it can fail

The test file also runs the same checker over three fixtures and expects each to fail, so a loosened checker is caught:

| Fixture | Expected failure |
|---|---|
| Two tabs with `verb: 'read'` | N2 |
| `book` with `captureEntries: ['speak']` | N3 |
| A temp source file under `book/` calling `startCapture()` | N3 |
| A layout with a `share` screen | N4 |

A real change that needs a new doorway adds its name to `CAPTURE_DOORWAYS` in a PR that `design-systems` approves; a new tab fails N1 and needs the Share-style test in `03` section 8 first.

Limits (said plainly): a static scan cannot see a capture started by a string-built route or a library call it does not know; N3 catches the common shapes and the manifest, not every possible bypass. It does not judge whether a tab's first screen communicates its job (IA-R5 is a person on a device).

## 11. The 12-line job-clarity review (for the whole IA)

| # | Result | Reason |
|---|---|---|
| J1 | Pass | Three sentences, each under 13 words, one verb |
| J2 | Pass | Say, Read, Look after are distinct; N2 enforces it |
| J3 | Pass | One entry function; N3 enforces it; Book's empty button is a pointer |
| J4 | Pass | Home: today's take; Book: kept letters; Me: settings |
| J5 | Open | Needs a five-parent read of the headings |
| J6 | Pass | Home: Speak and Type equal (the one deliberate pair); Book: reading; Me: the account card |
| J7 | Pass | One memory slip is the only cross-tab doorway |
| J8 | Pass | Section 6 |
| J9 | Pass | Section 3.3, 4.3, 5.2 |
| J10 | Open | Slots in section 8 |
| J11 | Open | Device pass |
| J12 | Pass | Each tab removed leaves one job undone: Say, Read or Look after |

## 12. Hand-offs and sequence

| Step | Owner | Change |
|---|---|---|
| 1 | `product` | Reconcile NX-42 (the Moments tab dissolves into Home mode, Book lens, letter actions) and NX-41 R12 with this bar; assign ids to IA-R1 to R12 |
| 2 | `content` | Slots in section 8 and each spec; `legal` read of "Share" as a button word |
| 3 | `mobile` | Labels and manifest; remove the Family tab; export rows into Me's section; flat waiting rows (needs #721); Book lens row and Find; the test in section 10 |
| 4 | `design-systems` | Tokens in the index section 7; `COMPONENTS.md` entries for `LensRow`, `FindBar`, `SharePreview`, `SealedRow`, `FirstMark`, `MediaTile` family; fix 2.18; `IA.md` updated when the bar ships |
| 5 | `qa` | Device passes; AX5 and VoiceOver tables |
| 6 | `user-research` | Five-parent read of the three job sentences and the headings, then Find and the letter-page actions |

## 13. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| Q1 | Is the Me heading "Settings" or "Me"? | "Settings" (keeps the Terms' "Settings, Plan" true); the tab label is Me |
| Q2 | Does export live as a section of Me, or its own page? | A section in Me with two or three rows |
| Q3 | Home memory slip below drafts or only when nothing waits? | Below drafts, flat (NX-43 R6) |
| Q4 | The Book gear: remove when Me ships? | Remove after one device pass shows Me is found |
| Q5 | Does the empty Book keep a button at all? | Yes, one quiet pointer to Home; the default is to keep it so the Book is never a dead end |
| Q6 | Co-parent caption above or below Children? | Below, muted, not on the first screen |
| Q7 | Do we measure "Me" label width and Large Content Viewer before shipping? | Yes, in the device pass |

## 14. UNVERIFIED

The rendered Home, Book and Me on a device; tab label widths; whether the open stack can be rebased onto a three-tab bar without conflicts; the e2e flows that tap a tab by label; that `startCapture` is one function (the name is mine; `listen.tsx` and `write` may start captures in several places today); the exact copy lines I cite at other heads; #721's slip style; anything about #738/#740 beyond what NAV-TAB-ROLES says of them.
