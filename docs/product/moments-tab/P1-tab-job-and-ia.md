# Moments tab, P1: the tab's job, where it sits, and what each tab owns

Status: PROPOSED (nothing here is decided, built or in `DECISIONS.md`) | 21 Nov 2026 | Author: product lead P1 of 5 | Docs only | Fictional family: Asha only.

Words in quotes are intent for `content`, never final copy. UNVERIFIED marks anything I did not read this session. I never viewed the founder's screenshots and nothing from them is here.

## 1. Purpose and scope

The founder asked for a new tab that learns from Apple's journaling suggestions picker and does it in a way that fits this product (20 Nov). A later message (same day) relaxed "default tab" and asked three things of me: where the tab sits, what brings a parent back every day without streaks, counts or guilt, and how one signal can drive in-app cards, local push and email.

This file answers, in this order:
1. The job sentence and the versus lines (section 3).
2. The tab position, with a recommendation (section 4).
3. What each of four tabs owns on day one, day 30 and at 80 letters (section 5).
4. The reason to come back, and the channel rules for cards, push and email (section 6).
5. The effect on J1 to J12 and on the capability map (sections 7 and 8).
6. The journeys: first run, returning, no child set up yet, photos declined (section 9).
7. Requirement rows MT-P1-R1 to R24 (section 10).

Out of scope (other leads own them): how it looks (design leads), motion, the feasibility of Route A (Apple's picker) versus Route B (our own on-device read), privacy and legal analysis, the market benchmark.

Three honest answers up front:
- I recommend a four-tab bar, Home | Moments | Book | Me, with Home still the landing tab. Moments is second. I do not recommend Moments as the default, a centre tab, or a part of Home (reasons in section 4).
- Moments cannot honestly be a daily reason to open the app. On most days a parent has no new day or picture worth a letter, and we are forbidden to invent one. The daily reason stays Home's prompt and the one evening reminder. Moments is the reason to come back when something real exists. I say why in section 6 and the founder should decide knowingly.
- The same signal cannot drive all three channels. The source of a signal decides which channels may carry it. Library signals are in-app only on the phone. Email cannot carry any library signal, and the email catalog today forbids email that exists to bring a person back (section 6.3).

## 2. Inputs read

Read in a depth 1 clone of `develop` at `86eccfa`, this session:
- `/home/claude/moments-brief.md`, including the UPDATE line (tab position, daily return, nudges).
- `docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` (three tabs, IA-R1 to R15, placement rules P1 to P9, navigation test N1 to N10, section 11 job review).
- `docs/design/specs/NEW-SCOPE-INDEX-11nov.md` section 5 (the working copy of J1 to J12).
- `docs/design/IA-FINAL-20nov.md` (the tree, the slip registry, section 6 where each NS group lives, section 9 empty states).
- `docs/product/prd/21-days-cultural-photos-home.md` (NS-46 to NS-50), `27-photo-moments-and-media.md` (NS-51, NS-52), `26-founder-direction-photos-library-and-media.md`, `19-from-download-to-first-letter.md` (first run), `11-foundations.md` (NS-32).
- `docs/emails/CATALOG.md` section 1 and 2 (email principles).
- `docs/BACKLOG.md` BL-1305.
- PR #1264 branch `docs/product-home-engagement-wheel-21nov`, file `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` (the wheel, section 7 NS-53 proposal). I build on it and mark where I differ (section 11).
- `docs/design/DESIGN-LANGUAGE-V2-21nov.md` and `packages/content/BRAND.md`: only grepped (glossary and "journal" rule), not read through. UNVERIFIED beyond that.

Not available to me:
- ML-1 to ML-12 and the exact text of ML-3 and ML-6 (they live in a Project doc, not in the repo). I use the brief's own wording for ML-3 and ML-6 and say so wherever it matters.
- `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md` (the three-tab ruling). I cite it from the brief only. The repo carries the same ruling as IA-R1 and IA-FINAL section 4.
- Branch `wip/moments-b1` (the market benchmark B1). It did not exist when I fetched it. I make no claim about any competing app. Where B1 should be cited, I mark "B1 to confirm". The privacy, feasibility and design concept docs were not open as PRs either; I state assumptions (section 12).

## 3. The tab's job

### 3.1 The sentence

Working name: Moments. Declared verb (for the navigation test manifest): choose.

Job sentence (PROPOSED, 12 words with {child} as one word, the limit):

"I go to Moments to choose a day to tell {child} about."

Why "choose":
- It is unique. Home says, the Book reads, Me looks after (N2 compares the whole declared verb and its first word, so "look" is also taken). "Choose" collides with none of them.
- It puts the act with the parent. The machine does not pick a day or find a best one. It lays out days the parent already has, and the parent picks. That keeps the constitution and the claims rule ("we never find your best moments").

Alternatives for `content` (each is one verb, none collides): "pick", "go back to". Rejected: "remember" (invites a memories claim, which NS-51 lists as not in scope), "explore" (founder's word, but it says nothing about the job), "find" (Find is the Book's action, N8), "look back" (first word collides with "look after").

Heading and first line (PROPOSED, `content` owns words): heading "Moments", first line is the job sentence slot `tabsJob.moments`, matching IA-R12's pattern for the other tabs.

### 3.2 Versus lines (one sentence each, for `content`)

- Versus Home: "Home is for today. Moments is for a day you already have." Home hands you today's thought to say. Moments shows days and pictures that are yours and waits for you to pick one.
- Versus the Book: "The Book is for letters you kept. Moments is for days you have not told yet." Once a letter exists for a day, that day leaves Moments and lives in the Book.
- Versus Me: "Me is where you turn Moments on or off. Moments never has settings in it."

The three-way line for the store and the website (Q-P1-6 asks `content` to own it):
"Home is where you start today's letter. Moments is where your days and pictures wait for you to choose one. The Book is where you read the ones you kept."

This is the wheel's line (section 7.2 of PR #1264) with the verbs aligned to the manifest. The wheel says "wait for you to say something about them"; I use "choose" so no two tabs share the verb "say".

## 4. Where the tab sits

### 4.1 The four options, judged against the founder's aim (engagement) and our rules

| Option | What it does | Verdict |
|---|---|---|
| A. Home stays default, Moments second (Home, Moments, Book, Me) | Four tabs. First run and cold start land on Home | Recommended |
| B. Moments as a centre tab in a five-tab bar | Needs a fifth tab. There is none. Centre position by convention carries the main create action | Not recommended |
| C. Moments is the default tab | Every cold start lands on Moments | Not recommended for 1.0; revisit with evidence |
| D. Moments inside Home | No new tab. Home gains a Moments region or a mode | Not recommended |

### 4.2 Why A

1. The daily core loop is saying a letter, and it starts on Home (IA-FINAL section 4.1, NS-44 first run, evening reminder lands on Home, NS-35 "only Home starts a letter"). Landing on Home keeps that loop one tap. Landing on Moments adds a tap to every daily open, for a tab that has nothing new on most days.
2. The first-run ruling is untouched. K-02 says no permission ask during first run, and first run ends on Home (NS-39, `19-from-download-to-first-letter.md` step 6: "The first permission the person may meet is the microphone"). Under A the library ask exists only on a parent's tap inside Moments, so K-02 is not reopened. Under C it would be reopened every time.
3. Fewer reversals. C turns the first screen of the product into a showcase and moves the first-run job. A leaves J3 narrowed, not removed (R-J3 below).
4. A gives the founder's showcase idea a home: the first time a parent opens Moments with no access, it shows the value in our own words and Asha examples (M0, section 9.1).

### 4.3 Why not B, C, D

- B: no fifth tab exists and I will not invent one for the shape of the bar. A prominent centre slot reads as "make something", which breaks "Moments starts nothing alone" (R-J3) and J6 (one primary action). Four tabs at 375 pt are 93.75 pt each (computed: 375 / 4), enough for one seven-letter label at the 13 pt floor; I measured nothing (UNVERIFIED, device pass).
- C: see 4.2. If the founder still wants it, the cost is explicit: K-02 reopened, first-run goal slower by one tap (not measurable by analytics, see 6.4), `index` no longer the initial route. A cheaper test of the same wish: keep A, and run the five-parent default-tab check NS-50-R13 already specifies, with Moments in the bar. If at least 4 of 5 say they would open Moments first, switch the default. The threshold is a proposal, not a source.
- D: Home would carry two verbs (say and choose), break R-IA-3 (Home is not a feed, one slip) and IA-R9, and turn into a long scroll. The wheel (#1264) chose a separate tab for the same reason.

### 4.4 What C and A both need from the founder

A decision, not a default I can apply: Q-P1-1 (position), deadline PROPOSED Mon 24 Nov 2026 (matches Q-HEW-1 in #1264 so the two answers are one meeting). UNVERIFIED: I have not read the Build 13 freeze date.

## 5. What each tab owns (four tabs)

### 5.1 Rule of ownership

One fact, one place (P7). When two tabs could show the same fact, the owner table decides, and a registry on the phone enforces it (R6). A tab may point to another tab's item as a doorway (J7) and never copy it.

### 5.2 The table

| | Home (Say) | Moments (Choose) | Book (Read) | Me (Look after) |
|---|---|---|---|---|
| Owns | Today's prompt, Speak, Type, "Start from a photo", "Not much today", waiting letters, the one slip (waiting set, seal-opened, a marked day that is today, Save a copy, the Days ask) | Days and pictures you can pick from: library days (when allowed), pictures you chose before, marked days that are not today, month and age days, one year ago from your own letters, written prompts as a fallback | Every kept letter, Find, lenses, Read together | Account, Plan, Children, Reminders, Days page, Photos access and Moments on or off, Export, Help |
| Starts a letter | Yes, directly | Only through the one capture start with `source` `moment` (R-J3). No cluster, no recorder of its own | Never (IA-R4) | Never |
| Lists kept letters | Never | Never. A year-ago item points to its letter in the Book | Always | Never |
| Never | A count, a feed, a picture slip | A count, a gap, a streak, a caption, a place, a guess about who or what is in a picture | A control that starts a letter | A letter |

Moves from today's plan (each is a founder-owned reversal, section 11):
- The one past letter (NS-23, slip rank 4) moves from Home to Moments when Moments is on. Reason: P7. A year-ago item is a day you can go back to, which is Moments' job. Home keeps its slip ranks 1 to 3b. With Moments off, rank 4 stays on Home as built.
- A marked day that is today stays a Home slip (rank 2b) because a reminder for it lands on Home. Moments lists marked days that are not today, and omits one while Home's slip shows it. The registry decides at render time.

This differs from the wheel, which says an item shows in Moments and "Home shows only its slip order". I keep the day-today slip on Home so NS-50-R5 and the typed-day reminder landing do not change. See section 11.

### 5.3 Day one, day 30, and 80 letters

Day one means: first run just ended, no letter, no photo access asked.

| Tab | Day one | Day 30 (about a month of letters) | 80 letters |
|---|---|---|---|
| Home | Greeting, the day's prompt, the cluster, the day-zero card. No slip | Same frame. At most one slip from ranks 1 to 3b; otherwise prompt and cluster, and that is correct | Same frame, same length. Never lists letters, never a count |
| Moments | M0: Asha examples in our own illustrations, one plain sentence of value, one "Show my pictures" button, one quiet "Pick one photo instead" (Apple's picker, no permission needed), and any real item that already exists (a day typed at set up, the child's first month-age day if a date of birth was given) | If access was given: a few days of the parent's own pictures newest first, plus any marked day or month-age day near today; once a letter has a year-ago match, that card. If access was not given: the same, minus pictures (M4). If nothing is real today: one calm line and the picker (M3) | Same shape and the same length, never a longer list. One year-ago card at most. Days already told have left; the screen does not show how many |
| Book | Closed cover and one pointer to Home | Months, Find, a Photos lens when material exists | Where the volume is: months, lenses, Find, Read together, export entries on the letter |
| Me | Account, Plan, Children | Same, plus Days and Reminders when set | Same; the Photos access row shows on or off in plain words |

Day 30 check: a parent who gave access and takes ordinary photos will usually have something real. A parent who never took pictures, or declined, will often see M3. That is correct and is stated, not hidden (see 6.1).

## 6. The reason to come back, and the three channels

### 6.1 The daily reason, said straight

There are three kinds of return, and only one is daily:
1. Daily: Home's prompt of the day and the one evening reminder (NS-32 `evening` class). Our 111 written prompts and the child's changing age are the only content we can honestly produce every day. This already exists.
2. When something real exists: Moments. A day of pictures, a month-age day, a day the parent typed, one year ago from their own letters. Real days arrive on the parent's own schedule, not ours.
3. When there is a reason to read: the Book (Read together, a letter from a year ago).

So I will not claim Moments brings a parent back every day. Making it appear to do so would need one of: an invented card each day (we cannot write meaning, J8 and the constitution forbid a hollow tab), a count or "waiting" line (forbidden), or a streak or guilt line (forbidden). What Moments can honestly give is a reason that is true when it is shown: "these are yours, you can choose one." If that is not enough engagement, the founder's remedy is more real material (Route B pictures, typed days, Days), not more nudges.

Design rules that follow:
- A quiet Moments is a good state. M3 is calm, short and has the picker. It never says "no moments yet", "nothing new" or any gap or count.
- No tab badge, no dot, no number on Moments (the brief and CLAUDE.md ban badges and counts). The tab shows its label only.
- A day the parent skips does not return as a reminder of what they missed. It leaves quietly (NS-51-R22 pattern: nothing says what vanished).
- One thing at a time on a lock screen: NS-32-R1 (one budgeted notification per local day) stays.

Evidence I do not have: whether any of this brings parents back. The five-parent check (NS-50-R13) and the TestFlight diary are the only tests I propose, and analytics may not carry any Moments event (R20), so engagement from Moments cannot be measured by us in the product. Said honestly in section 12.

### 6.2 Which source may drive which channel

A "signal" is a fact that makes a day worth a card. I split signals by where the fact comes from, because that decides who may know it. The phone owns the registry (R6); the server never receives a library fact.

| Source of the fact | Example | In-app card | Local push | Email |
|---|---|---|---|---|
| S1 Library: picture dates and counts, read on the phone (NS-51) | "A day with several pictures" | Yes, in Moments (and the Home photo menu) | Default no. See below | Never. The server never sees it |
| S2 The parent's own marks on the phone: typed days (NS-18), ticked days (NS-46), pictures they chose earlier | A day typed at set up | Yes | Yes, only through the existing classes `typedDay`, `birthday`, `monthAge` (NS-32-R5) | Never. NS-47-R4 and BL-1307 say a ticked day is never sent to the server; typed days UNVERIFIED |
| S3 Date of birth and time | Month-age day, birthday | Yes | Yes, existing classes | Only if the server holds the date of birth (UNVERIFIED). No child name in any email (catalog E-1) |
| S4 Our own letters (past letters kept in the book) | One year ago | Yes, in Moments | Via the `evening` class ranked source, no letter words (NS-32-R12) | The server may know letters exist; the catalog forbids letter content and child names in email |
| S5 Our 111 written prompts | A fallback card when nothing real exists | Yes, in M3 only | Already the evening reminder | No |

Library push, the one real conflict:
- The brief states ML-3 as: no push is created from library data; fixed text, random id, no place, photo, count or "waiting". NS-51-R11 (PRD 27) plans a neutral moment nudge ("Some pictures from the weekend are here") as a ranked source inside `evening`, below `monthAge`, planned only when the app is opened (Q-PM-8: no background refresh).
- I read the nudge as a push created from library data, because the phone decides to send it because pictures exist. I could not read ML-3 itself. Until counsel and the CISO say the NS-51-R11 nudge is compatible with ML-3, my default is that ML-3 wins and S1 is in-app only (R17). That costs the founder a lock-screen nudge for library days; it keeps the Data Not Collected story simple.
- If the founder decides otherwise, R17 must be superseded explicitly. The wording stays NS-51-R11's: fixed text from a `packages/content` key (NS-32-R11), random notification id, no thumbnail, no place, no count, no "waiting", inside quiet hours, one per local day (NS-32-R1), `active` level (NS-32-R10), and hidden-preview placeholder (NS-32-R13).

### 6.3 Email

Today's rule (`docs/emails/CATALOG.md`): email "is for things a person needs to know or keep" and "nothing that exists to bring someone back into the app" (principle 1); no commercial email at 1.0 (principle 5); no child name or letter content in any email (principle 4, E-1). The founder's new ask (nudges "not just this app feed") overturns principle 1 if it means a come-back email. That is a founder-owned reversal (section 11).

What email could legitimately carry, if the founder reverses principle 1:
- Only S3 and S4 facts the server already holds. For example one monthly note keyed on the book's date of birth: "A new month of your book begins on 14 December." Dates, not countdowns (principle 6). No child name, no letter words.
- Opt-in only, from the separate commercial subdomain principle 5 already names, with a visible unsubscribe, at most one a month. Counsel confirms the CAN-SPAM kind (the catalog marks this `T?` or `C`; I decide neither).
- Never S1 or S2. Never a picture, a count, a "waiting", or "you have not written".

My recommendation: do not send a come-back email at 1.0. The reminders already on the phone do this job with no server fact and no vendor storing the content. Revisit when the founder has evidence from 5 parents that they miss it. Q-P1-4.

### 6.4 One registry, three channels

To make "the same moment signal" real without letting a library fact leak, I propose a single on-phone registry (an extension of BL-963's slip registry, which the wheel already proposes) where each source declares its surfaces as data:

```
source      origin      surfaces
library     S1          card
marked day  S2          card, push(typedDay)
age day     S3          card, push(birthday, monthAge)
year ago    S4          card, push(evening)
prompt      S5          card, push(evening)
```

A test fails if `library` lists `push` or `email`, or if any source lists `email` without a founder decision id (R19). The registry also decides which tab owns a fact on a given day (5.2).

## 7. Effect on J1 to J12

The brief names J1 to J10. The only definition I could read in the repo is the working copy of J1 to J12 in `NEW-SCOPE-INDEX-11nov.md` section 5 (the charter that should replace it, from closed question X5, is not on any branch I read). I use that and cover J11 and J12 too. The brief's phrase "J4 (only Home starts a letter)" is J3 in that table (J4 there is "one object"). I use the table's numbers and flag the mismatch for the integrator.

| # | Line | Result with Moments as the second tab | Why and what is needed |
|---|---|---|---|
| J1 | One job, 12 words, one verb | Pass | Section 3.1, exactly 12 words |
| J2 | Unique verb | Pass | "choose" differs from "say", "read", "look after" in whole verb and first word. N2 manifest gains a row |
| J3 | One capture entry | Fails as written; passes with one amendment | Home's cluster is no longer the only caller. Amend N3 to allow one more doorway: `startCapture({ source: 'moment' })` from the Moments module, which renders no cluster and imports no recorder. Founder-owned reversal R-J3 |
| J4 | One object | Open | The object is "a day" (one day of pictures, a marked day, a year-ago letter day). Mixed objects fail. Test in the five-parent read |
| J5 | First line says it | Open | Needs the heading, first line and a five-parent read. Not decided here |
| J6 | One primary action | Open | M0 has one primary button (ask) and one quiet pointer. In M2 the items are equal rows, with no primary button. A day card's tap is the action, not a button |
| J7 | Doorway, not a copy | Pass, with the registry | A year-ago item points to the Book. A day-today slip stays on Home and Moments omits it (R6) |
| J8 | Day one is whole | Open, at risk | M0 is mostly a promise unless it holds one real action. It does: "Pick one photo instead" works with no permission, and any typed day or month-age day is real. Without the picker, J8 fails |
| J9 | States say what next | Pass once words exist | M0 to M5 in section 9, one line each, `content` writes them |
| J10 | Words | Open | No glossary row for the tab yet. "Journal" is banned in prose except store name, subtitle and keywords (BRAND.md row, D-139, grepped only) |
| J11 | Everyone | Open | VoiceOver, AX5, Bold Text, Reduce Motion, Reduce Transparency, Increase Contrast on SE 3 need a device pass |
| J12 | Removal | Conditional pass | If Moments were removed, "choosing a day or picture to start from" goes undone, but only if library days or the day sources ship. If only Home-slip sources existed, Home would already do the job and J12 fails. That is the wheel's own argument for why the tab earns its place only with picture sources |

Net: of 12 lines, 3 pass, 1 passes conditionally, 1 fails until an amendment is ruled, 7 stay open on a person or a device.

## 8. Effect on the capability map

From IA-FINAL section 6. Only rows that change are listed. Nothing else moves.

| NS | Today | With Moments (PROPOSED) |
|---|---|---|
| NS-01, NS-49 | "Start from a photo" in Home's cluster | Stays. Moments adds a second doorway; both call the one start function. Level 2 (Apple's suggestions picker, Route A) may be launched from Moments |
| NS-13, NS-32 | Reminders; one budgeted notification a day | Unchanged. No new class (NS-32-R5). Library push default no (R17) |
| NS-14 | Switcher on Home and Book | Also on Moments. Library days are not tied to a child (no face matching), so the hand-off asks "Whose book?" with the existing sheet |
| NS-18, NS-46 | Days page in Me; slip rank 2b on Home | Days page stays in Me. Moments lists marked days that are not today |
| NS-23 | One past letter, slip rank 4, Me switch "Past letters on Home" | Moves to Moments when Moments is on. The Me switch's word changes. Founder reversal |
| NS-35 | Only Home starts a letter | Home plus one allow-listed doorway from Moments. Founder reversal |
| NS-50 | Slip ranks 1 to 4 | Ranks 1 to 3b stay. Rank 4 moves. R-IA-3 stands: no picture slip, tile or strip on Home |
| NS-51 | Me row "Photo moments", menu item in the cluster, newest moment only (R8), no list | Me row stays and Moments' own ask button is a second place that asks (breaks NS-51-R1). "Recent, newest first by day" is a list, which breaks NS-51-R8. Two founder reversals |
| NS-52 | Several pictures with a letter | Moments hands the chosen pictures to capture; nothing is attached by Moments itself |
| NS-33 | A floor on every screen | Moments meets it on a device pass (J11) |
| IA-R1, N1, N4, J12 | Exactly Home, Book, Me | Home, Moments, Book, Me. Founder reversal; needs the Share-style test the IA spec calls for before a new tab |

## 9. User journeys

States (names for design, from the wheel, kept): M0 before any permission; M1 asking; M2 allowed (all or limited); M3 nothing real to show; M4 declined or off; M5 quiet book.

### 9.1 First run

1. After the first-run steps, the parent lands on Home (NS-39 to NS-44 unchanged). No library question has been asked.
2. They speak or type their first letter on Home. The microphone primer is the first permission, on their first tap of Speak.
3. Later, or at once, they tap Moments. M0 shows a few Asha examples, one sentence of what Moments does, and one button. A quiet "Pick one photo instead" uses Apple's picker, which needs no permission.
4. They tap the button. One plain sentence shows (door lines below), then Apple's own sheet. Only after that tap.
5. If they allow all or a limited set, M2. If they say no, M4.

Door lines (PRIV-R21; PROPOSED; `content` writes the words, counsel reads them):
- Shown: one plain sentence before Apple's sheet: the app reads only the dates of pictures, on the phone, to show your days.
- Records: the parent's answer and when, on the phone. No picture, file name, album, place or count.
- Never: reads or sends a picture the parent did not choose to include, describes a picture, writes words, asks again after a No.
- Decline: "Not now" or a No changes nothing else. The picker, Home, the Book and typed days work the same.

### 9.2 Returning parent

- Cold start lands on Home (option A). Taps to Moments only when they choose.
- A reminder tap goes where the reminder says: evening to Home, typed day to Home with the day's words, month or birthday to the Book (IA-FINAL section 8). Moments is reached by tap, never by a notification (R17).
- In Moments, M2 shows at most one screen of days, newest first. A day already told has left. A skipped day leaves without a message.
- Tapping a day opens the capture start with that day's pictures attached and an empty words field. The prompt shown is an ordinary catalogue prompt that does not depend on the picture (NS-49 rule, CHECKS-AND-BALANCES F6 as cited by the wheel).
- A letter made from a day appears in the Book; the day is gone from Moments.

### 9.3 A parent with no child set up yet

Two cases, both real in the first-run docs (UNVERIFIED how the build handles each):
- Before the child is born ("BEFORE YOU" dateline, no date of birth or only a due date): month-age and age days do not exist, so they are absent, not shown as zero. Pictures, marked days and prompts from the "before you" set still work. Moments never asks for a date of birth.
- A signed-in parent on a new phone whose book has not arrived yet (C-S10, "Opening your book"): Moments shows the same arrival line the Book shows and offers nothing to start, because there is no book to hand a letter to. No library ask appears.
- A nameless child shows "your child" (IA N5 fallback), never a blank.

A quiet row in Me > Children is the only place that offers to add a date of birth. Moments does not.

### 9.4 A parent who declined photos

- After a No, a limited selection or "Not now": M4. Moments shows the picker, marked days, month and age days, and one year-ago card. It carries no line about access and never asks again (FR-PHS-44, NS-51-R19 as cited by the wheel and the PRD; I read NS-51's state table, not every row).
- The way back is the parent's own: Me, the Photos access row, which says plainly it is off and offers "Open Settings" when the parent opens it. Never from a reminder, never from Moments.
- With limited access: M2 on the selection. No line says what is missing. If the selection is too small to make a day, M3.
- A parent who declines still sees real things. It is never an empty promise (J5 of the brief).

## 10. Requirements

Ids are PROPOSED. Test layers: unit (U), static scan or source test (S), content test (C), e2e on a simulator (E), device (D), research (R). Priority reasons follow the pack: (a) a promise, (b) a legal or store duty, (c) the core loop.

| Id | Given / When / Then | Layer | P |
|---|---|---|---|
| MT-P1-R1 | Given the tab bar, When any build runs with Moments on, Then the tabs are Home, Moments, Book, Me in that order and the initial route is Home; with the flag off the bar is Home, Book, Me as built | S, E | P0 (a) |
| MT-P1-R2 | Given the manifest `TAB_JOBS`, Then Moments has `verb: 'choose'`, its job sentence matches `^I go to Moments to choose\b`, is 12 words or fewer, and N1, N2, N4, N6 are updated to expect four tabs, with a failing fixture for a fifth | S, U | P1 |
| MT-P1-R3 | Given `copy.tabs.moments` and `copy.tabsJob.moments`, Then both are single strings, the label is one word in the BRAND.md glossary, and no key is both string and object (N6) | C | P1 |
| MT-P1-R4 | Given any file outside Home's module, When it calls `startCapture`, Then only the Moments module with `source: 'moment'` and the existing doorway handlers pass N3; the Moments module renders no capture cluster, imports no recorder and pushes neither `/listen` nor `/write` directly | S | P0 (c) |
| MT-P1-R5 | Given a tap on a Moments day, When capture opens, Then it opens with the chosen pictures attached, an empty words field and the "Whose book?" sheet if more than one book is visible, and nothing is pre-filled from a picture | E | P0 (a) |
| MT-P1-R6 | Given a fact that two tabs could show (a marked day that is today, a year-ago letter), Then the one registry picks a single owner per 5.2 and the fact shows on one tab only, in a test with each combination | U | P1 |
| MT-P1-R7 | Given Moments is on, Then the year-ago letter (NS-23) shows in Moments and not as a Home slip; with Moments off it shows on Home as NS-50-R5 says | U, E | P1 |
| MT-P1-R8 | Given the first cold start after first run, Then no photo-library question has been shown, no PhotoKit call has been made, and the first permission the parent meets is the microphone on their first tap of Speak | E, S | P0 (b) |
| MT-P1-R9 | Given M0, When the parent taps the one button, Then one plain sentence shows and then Apple's sheet; the sheet is never shown at launch, from a notification, from a tab switch alone or from any other screen | E | P0 (b) |
| MT-P1-R10 | Given a No, a limited choice or "Not now", Then no screen of ours asks again or mentions access, and a test that scans Moments strings for "allow", "access" and "settings" finds none outside the Me row | S, C | P0 (a) |
| MT-P1-R11 | Given M0 with no permission, Then "Pick one photo instead" opens Apple's picker with no usage string needed, and the screen is not mostly promise (it holds at least one real action) | E, R | P0 (c) |
| MT-P1-R12 | Given any state of Moments, Then no tab badge, dot or number shows on the tab or in the screen, no count of days, pictures, letters or things waiting, no streak, no "you have not", no gap | S, C | P0 (a) |
| MT-P1-R13 | Given M3 (nothing real to show), Then one calm line and the picker show; the line has no "nothing yet", no count and no apology, and no card is invented | C, E | P0 (a) |
| MT-P1-R14 | Given M2, Then at most one screen of days shows, newest first, with no endless scroll, and a day that has been told or skipped is absent without a message | E, U | P1 |
| MT-P1-R15 | Given a book with no date of birth, a book before birth, or a nameless child, Then no month-age or age day shows, no zero or blank shows, the fallback "your child" is used, and Moments never asks for a date of birth | E | P1 |
| MT-P1-R16 | Given a new phone whose book has not arrived, Then Moments shows the arrival line, offers nothing to start, and asks nothing about photos | E | P1 |
| MT-P1-R17 | Given any source whose origin is S1 (library), Then it creates no local notification, no scheduled body, no notification id derived from library data and no widget text; library facts show in the app only, unless a founder decision id is added to the registry | U, S | P0 (a) |
| MT-P1-R18 | Given any push the app schedules from S2 to S5, Then it uses an existing class (`typedDay`, `birthday`, `monthAge`, `evening`), a `packages/content` key as body, no letter words, no child name unless names are on, no thumbnail, one budgeted notification per local day, `active` level, and quiet hours as NS-32 says | U | P0 (a) |
| MT-P1-R19 | Given the source registry, Then a source lists its surfaces as data, a test fails if the library source lists `push` or `email`, and a test fails if any source lists `email` without a founder decision id | U | P0 (a) |
| MT-P1-R20 | Given any Moments screen, tap, item, permission answer or day, Then no analytics event, log line or crash field carries it (no photo, filename, album, place, date, count) | S | P0 (a) |
| MT-P1-R21 | Given the Me row for Photos access, Then it states on or off in plain words, turns Moments' library read off and removes the on-phone index when switched off, and shows M4 | E | P0 (a) |
| MT-P1-R22 | Given VoiceOver, AX5 plus Bold Text on iPhone SE 3, Reduce Motion, Reduce Transparency and Increase Contrast, Then each tab (all four) reads its heading first, the tab says "Moments, tab, 2 of 4", and the bar is a solid paper surface with Reduce Transparency | D | P1 |
| MT-P1-R23 | Given five parents shown the four-tab bar and the heading and first line of each tab, When asked what Moments is for and which tab they would open first, Then the result is recorded as x of n, with a stop line if any says "there is nothing here" or cannot tell Moments from Home | R | P2 |
| MT-P1-R24 | Given the founder's screenshots, Then no fixture, string, snapshot or doc in the repo holds a real name, place or face from them; all examples are Asha and synthetic | S | P0 (a) |

## 11. Reversals the founder owns

Each is a place where this IA, or the founder's new direction, overturns a ruling. None is applied by me.

| # | Earlier ruling | Where | What changes | My default |
|---|---|---|---|---|
| RV-1 | Exactly three tabs; "no screen for Family, Library, Photos or Share"; a new tab needs the Share-style test first | IA-R1, N1, N4, J12 in `06-HOME-BOOK-ME-IA`; the three-tab ruling in the Project doc (not read) | Four tabs | Accept, with the test written first |
| RV-2 | Only Home starts a letter (J3, NS-35, IA-R3, N3). The brief calls it J4 | Same | One allow-listed `moment` doorway from the Moments module | Accept, narrowly (R4) |
| RV-3 | No photo-library usage string or PhotoKit call in any 1.x build | BL-1305, FR-PHS-40 | A library read in a 1.x build, if Route B | Per the wheel's Q-HEW-1, which I do not repeat; flag stays off until the founder rules. Also: the wheel found BL-1305 contradicts NS-49's own 1.1 line |
| RV-4 | K-02: no permission ask during first run | brief; `COPY_INVENTORY.md` photo cards "never during first run (K-02 rule)" | Not reopened under option A. Reopened only under option C | Keep K-02 by landing on Home |
| RV-5 | No other screen asks for library access; only the Me row does | NS-51-R1 | Moments' button is a second asking place | Accept, tap-gated, one ask, never repeated |
| RV-6 | Capture menu offers only the newest moment, no list | NS-51-R8 | A "Recent" list in Moments | Accept as one screen max (R14) |
| RV-7 | No picture slip, tile or strip, no feed on Home | NS-50-R10, R-IA-3 | Unchanged for Home. Only Moments shows pictures | No reversal on Home |
| RV-8 | Cards show a date, never a place or thumbnail | ML-6 (brief wording; text not read) | Moments shows the parent's own pictures. Whether a thumbnail is allowed is for the design and privacy leads | Date and the parent's own thumbnail only; no place unless the parent typed it |
| RV-9 | No push is created from library data | ML-3 (brief wording; text not read) versus NS-51-R11 | Not reversed by me. NS-51-R11's nudge needs a ruling | ML-3 wins (R17) |
| RV-10 | Email is not for bringing someone back; no commercial email at 1.0 | `docs/emails/CATALOG.md` principle 1 and 5 | A come-back email | Do not send at 1.0 (6.3) |
| RV-11 | The past letter shows on Home (rank 4) | NS-23, NS-50-R5 | Moves to Moments while Moments is on | Accept; alternative: leave it on Home and omit it from Moments |
| RV-12 | Default tab is Home (implicit; the first-run flow ends on Home) | NS-39 to NS-44 | Not reversed under A | Keep Home |

## 12. Open questions, defaults and deadlines

Founder decisions are listed under Founder in my journal and in the PR body (the integrator carries them).

| Id | Question | Default if unanswered | Deadline (PROPOSED) |
|---|---|---|---|
| Q-P1-1 | Tab position: A (Home default, Moments second), B, C or D | A | Mon 24 Nov 2026 |
| Q-P1-2 | Is Moments allowed to call the one capture start with `source: moment` (RV-2), or must it switch to Home and let Home start it | Allow the one doorway | Mon 24 Nov 2026 |
| Q-P1-3 | Does the year-ago letter move from Home to Moments (RV-11) | Move it | Fri 28 Nov 2026 |
| Q-P1-4 | A come-back email: yes or no at 1.0 (RV-10) | No | Fri 28 Nov 2026 |
| Q-P1-5 | Library push: does NS-51-R11's neutral nudge stand against ML-3 (RV-9). Needs the CISO and counsel | ML-3 wins | before Route B spike results |
| Q-P1-6 | The three-way line and the tab's word, one verb, with the five-parent read | Section 3 | before `content` closes J10 |
| Q-P1-7 | Is the daily-return claim for Moments dropped, with Home's prompt as the daily reason (section 6.1) | Yes, dropped | Mon 24 Nov 2026 |

Assumptions I make where other docs are not yet readable (reconcile here):
- The privacy and constitution doc: I assume it keeps NS-51-R5 (date and count only), no place, no face, no machine title, and Route A's titles are never stored or shown by us. If it allows a place name, RV-8 and the M2 items change.
- The feasibility doc: my IA works for both routes. Under Route A the app sees only what the parent picks, so M2 has no list of days and Moments becomes a launcher plus S2 to S5 sources. Then J12 is weak (see 7). If feasibility rules Route A impossible inside a tab (the wheel flags this UNVERIFIED), Route B or "picker only" decides how much of M2 exists.
- The design concept: I assume paper content, glass only on the bar and controls, a solid fallback, iOS 17.0.
- The benchmark B1: not present when I looked. I assert no market fact. Where competing apps' habits (for example a "on this day" card, or a weekly digest) are cited by other leads, they cite B1, and I mark "B1 to confirm" on the decision for the Moments word and for the card kinds.

## 13. Edge and unhappy paths

- Parent with two books: Moments follows the active book for the owned items (marked days, year-ago, prompts). Library days belong to no book; the hand-off asks "Whose book?" once.
- Quiet or hidden book: nothing from it shows in Moments (NS-23-R8, R-IA-6), and `quiet book adds nothing` (NS-32-R14) holds.
- App lock: the Moments screen needs unlock, no thumbnail in the switcher (NS-51-R25).
- Airplane mode: everything works the same; no item needs the network.
- Signed out or local start: same. Moments never asks to sign in.
- Parent switches Moments off in Me: the on-phone index is removed and the tab shows M4 (R21).
- A parent who gave access and later revokes it in Settings: Moments shows M4 without a line about it.
- iCloud picture not on the phone: a plain box, no download for dates (NS-51-R21 as cited).
- A day with pictures that is also a marked day or a typed day: one card, parent's own label if they typed one; no machine title.
- A picture deleted after the day showed: the day vanishes quietly (NS-51-R22).
- Second account on a phone: per account, account B starts off (NS-51-R24).
- A parent who opens Moments every day and sees M3 every day: acceptable. If the five-parent test says it feels empty, the fix is more real material, not a daily card.

## 14. Constitution, privacy and accessibility checks

Constitution: no machine-written title, caption, summary or story; a label shows only if the parent typed or chose it; Apple's machine titles are never stored or shown by us. No scene, place or person guess, no face matching (nothing in this IA needs one, and library days are not tied to a child for that reason). No counts, gaps, streaks, points or badges. Nothing implies AI writes anything: the value-prop words say what the parent does ("choose a day, then say it"), never "we found", "we picked", "we wrote". Never gender the child; use {child}.

Privacy: nothing leaves the phone from the library; no photo, filename, album, place or date in analytics, logs or crash reports (R20); safety tiers stay on the device. The Data Not Collected label story holds only if no library fact reaches the server; R17, R19 and the email rule keep it so. Any change to that goes to counsel first. Coordinates and reverse geocoding: none by default (UNVERIFIED whether a geocode call sends coordinates to Apple).

Accessibility: R22. The tab bar goes from three to four items; label width and Large Content Viewer need a device pass (UNVERIFIED).

Words: "Moments" is a working name. Parent-facing strings avoid the internal terms (take, entry, draft, pack, `raw_transcript`). Content rules apply (no em or en dashes, curly quotes, ellipsis characters or emoji); this file passes them by construction and should be run through `rules.test.ts` by the integrator if it becomes a repo doc.

## 15. Dependencies

- Feasibility doc (Route A or B) before M2 can be specified past a launcher.
- Privacy and constitution doc for RV-8 (thumbnail and place) and RV-9 (library push).
- Design concept for M0 to M5 layouts.
- `content` for the tab word, the three-way line, door-line words and the M0 to M5 strings.
- `mobile` for the single `startCapture` function (IA step 0), then the manifest and N1 to N4 change.
- `design-systems` for IA-R1 and IA-R12 amendments and a Moments tab icon.
- Counsel and the CISO for the door-line sentence, the App Privacy answer and RV-9.
- PR #1264 (the wheel): reconcile section 7 (NS-53) with this file. Differences: I keep the day-today slip on Home; I move the year-ago letter to Moments; I add the registry channel rule and the position analysis; I use "choose" for the verb.

## 16. What is VERIFIED, UNVERIFIED, or a guess

VERIFIED (read in the clone at `86eccfa`, or on PR #1264's branch, this session):
- Three tabs, their verbs, IA-R1 to R15, N1 to N10 and J1 to J12 text: `docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md`, `NEW-SCOPE-INDEX-11nov.md`.
- The slip registry order and the NS-50 rules R5, R10, R11, R13: `docs/product/prd/21-days-cultural-photos-home.md`; the capability map: `docs/design/IA-FINAL-20nov.md` section 6.
- NS-51 rules R1, R5, R6, R7, R8 and its state table: `docs/product/prd/27-photo-moments-and-media.md`; the founder's direction text: `26-...md`.
- NS-32-R1 to R16: `docs/product/prd/11-foundations.md`.
- Email principles and E-1: `docs/emails/CATALOG.md`.
- NS-47-R4 and BL-1307 (a ticked day is never sent to the server): `21-days-cultural-photos-home.md` line 487 and BACKLOG.
- BL-1305 text: `docs/BACKLOG.md`.
- The wheel's proposal and its open questions: PR #1264 branch.
- The first permission a parent meets is the microphone: `19-from-download-to-first-letter.md` step 6.
- Computed: 12 words in the job sentence; 375 / 4 = 93.75 pt.

UNVERIFIED:
- ML-1 to ML-12, and the exact text of ML-3 and ML-6 (brief wording only).
- The three-tab ruling's source file in the Project (cited via the brief and the repo's IA-R1).
- That typed days (NS-18) stay off the server. NS-47 says ticked days do.
- That the server holds a date of birth at all.
- Anything about Apple's suggestions picker, PhotoKit limits, tab bar label width and how the build handles a book before birth.
- BRAND.md glossary and DESIGN-LANGUAGE-V2: grepped only.
- The market: no benchmark was available. Whether any competitor's daily card or email brings parents back is not asserted.
- Whether Moments brings anyone back. No evidence exists; analytics may not measure it (R20).

GUESSES (labelled, mine): the verb "choose" and its alternatives; the 4 of 5 threshold for switching the default; the deadlines; moving the year-ago letter to Moments; defaults on RV-8 and RV-9.
