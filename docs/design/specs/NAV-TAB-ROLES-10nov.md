# Navigation from jobs, not screens: four classes of capability, one home for each

Owner: design systems (journey and IA lead for the "unique tabs" programme). Status: DRAFT v3 for the founder, `product`, `mobile`, `content`, `legal` and `qa`, 10 Nov 2026 (UTC). Docs only: nothing here is built, no token or string is changed, and no word is live until the founder approves it and `mobile` wires it in the same PR that moves it. Signed: Design Systems and Accessibility Lead (Claude role).

History. v1 (three tabs) and v2 (Home, Book, Library, Me; head `8ed9343c`) are in this file's git history. v3 replaces v2 after the founder's pushback, verbatim: "Lot of overlapping jobs to be done and record or write is becoming action on 3 tabs. So think like a strong designer how we think of new capabilities navigation and core jobs." He is right about v2: it let a letter start on Home and in Library (ML-S9 "Add photos or videos" starts a letter), and it left Find, Read together and Share spread through Book. v3 starts from the jobs, not the tabs.

Earlier founder direction that still holds, verbatim: "The navigation need to feel unique and carrying material info in each tab so one tab on right can be me which includes everything settings. Default home tab on left most is where you see actions memorities etc and then identify what other 2 tabs need to be that are relevant."

Tags. EVIDENCE: read in the repo, or at a named PR head or branch, this session. UNVERIFIED: not read, not run, not measured on a device. PROPOSED: my wording, number or rule. HYPOTHESIS: a statement about what a parent will do or feel. I wrote no statistic. Sizes (S, M, L) are guesses.

## 0. The short version

1. Every capability is exactly one of four classes: CAPTURE (a way to put something in), LENS (a way to look at what is already kept), OUTPUT (the book, or part of it, leaving the app or the phone), CARE (looking after the account, the rules and the books). All 46 capabilities in product's map (NX-42, PR #790) are classified in section 3.
2. Four placement rules follow (section 4): capture has one entry, and everything else may only add to a letter that exists; lenses live inside the Book; outputs live together; care lives in Me. A five-question tree places any new capability.
3. The bar that falls out: Home (Say) | Book (Read) | Share (working label; Give is worse) | Me (Look after). One verb per tab. The Library is not a tab: photo-first is a capture mode on Home, Photos is a lens in the Book, and no tab needs a build guard (section 5).
4. Honest challenges (section 6): Share is thin on day one (two shipped rows and one quiet one), the word needs legal and the glossary, and moving export and people out of Me goes against the founder's own list for Me. So I give two alternatives (section 7) and recommend: adopt the model now, ship the four-tab bar only with Share's first real verb, and fall back to Home | Book | Me with the same model if the founder keeps export and people in Me.
5. Collisions with #699, #720, #738, #740, #764 and #721 are in section 9, by file.

## 1. What I read, and what the audit says now

Read on `origin/develop` `6800a54f4` (10 Nov). PR heads: #699 `81d25dd0`, #720 `54757ac4`, #738 `0cd8e1f1`, #740 `b2b730e1`, #764 `b8a4230e`, #721 `bd6727d1`, #790 `d80db1f2` (NX-41 to NX-44 and BL-898 to BL-915). NX-42 now exists on that branch, and I classify from it. NX-43 (Home) and NX-44 (Firsts) I read in part.

The audit of v1 and v2 stands. Short form (EVIDENCE):

| # | Finding | Where |
|---|---|---|
| O1 | Tonight and Book share one lamp room (`persistKey "tabs"`). | `index.tsx`, `book.tsx` |
| O2 | A waiting-draft card, the month-ago card and a Book letter card are all a raised `Card` with a caps date line and `ExcerptFade`. | `tonight/draft-card.tsx`, `tonight/resurfaced-card.tsx`, `book/letter-card.tsx` |
| O3 | Book's empty state asks for a letter, and its button goes to Tonight. | `book.tsx`; `copy.book.empty` (`strings.en.ts` lines 534 to 536) |
| O4 | "Waiting" means two things: a draft not yet kept (Tonight), and a kept letter whose words are still being made (Book `WaitingCard`). | BRAND.md; `book.tsx` |
| O5 | The Family tab, with servers off, is a display-size page with a breathing drawing and no action. Every alpha build still draws it. | `family.tsx`, `coparent-soon.tsx`, `lib/family/entry.logic.ts` |
| O6 | Settings has one door today (the Book gear). #699 and #738 add a You tab holding all of Settings. | `book.tsx`; #699 `you.tsx` |
| O7 | The v2 capture sprawl: ML-S9 (Photos tab) has a button that starts a letter. | `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` ML-S9 |

Gaps: Tonight has no child switcher (the switcher is on Book only); the Book gear becomes a second door to Settings once Me ships.

## 2. The four classes

A capability is classified by what it does to the book, not by where it happens to sit today.

| Class | Definition | The parent's verb | Test question |
|---|---|---|---|
| CAPTURE | Puts new material in: a new letter, a quiet-day mark, or something added to a letter. An input method. | Say | Does it make or change what is kept? |
| LENS | Shows material that is already kept, without changing it or sending it anywhere. | Read | Is it a different way to look at the same kept letters? |
| OUTPUT | The book, or part of it, leaves the app, the phone or this account; or another person is let in. | Give | Does the book or a piece of it travel? |
| CARE | Who the parent is, what the app may do, and the books themselves: account, plan, privacy, language, reminders, lock, safety, help, books management. | Look after | Is it about the parent, the device, or the rules, not the letters? |

Two clarifications that settle most edge cases:

- An **enricher** is a CAPTURE act that can only attach to a letter in progress or a letter that exists: a photo, a date, a place, a first. It is not a second way to start a letter.
- A **doorway** is not a place. Home may show one memory slip that opens a letter in the Book; the Book's letter page may carry one button that opens the Share sheet. A doorway opens its owner's screen and has no behaviour of its own.

## 3. Every capability, classified

Source: `docs/roadmap/next/03-requirements/NX-42-capability-map.md` on `docs/nav-tabs-requirements-10nov` at `d80db1f2` (PR #790). Ids C1 to C46 are product's. Where one row is really two acts I split it (a, b) so that each part has exactly one class. "Home" in the last column is where the parent meets it under the v3 bar. Statuses are NX-42's; I did not re-verify them (UNVERIFIED).

| Id | Capability | Class | Where it surfaces (v3) | Note |
|---|---|---|---|---|
| C1 | Speak or type a letter | CAPTURE | Home | The one entry |
| C2 | Review and faithful edit | CAPTURE | Modal after capture | Finishing a capture |
| C3 | Waiting drafts and held letters | CAPTURE | Home | Work in progress; flat rows |
| C4 | Prompts and "Another thought" | CAPTURE | Home | A capture aid, one at a time |
| C5 | Not much today | CAPTURE | Home | A mark with no words |
| C6 | Age and stage (month-age, "Before You") | CAPTURE | Home (date line, prompt choice) | Feeds the prompt and the date line; the Book's month headings reuse it, no second capability |
| C7 | Catch-up: a letter for an earlier day | CAPTURE | Home, as a date chip in Review | Not a second entry |
| C8 | Memories on Home | LENS | Home (one slip) opening the Book | A doorway to a lens |
| C9 | Plus line | CARE | Home (one standing line) | The plan, said once |
| C10 | The book by month | LENS | Book | The default lens |
| C11 | Letter page: read it, hear it | LENS | Book | |
| C12 | Read together | LENS | Book (cover action) | A way to hear the book |
| C13 | Find a letter | LENS | Book (header action) | Not built |
| C14a | Mark a first (on a letter, or while capturing) | CAPTURE | Letter page and Review | An enricher |
| C14b | See the firsts | LENS | Book (a lens, absent until one exists) | NX-44 R4 |
| C15 | Several books and the switcher | CARE | Me (Children); the switcher control also on Home and Book | One control, shown where a book is the context |
| C16 | Hide, delete, Recently deleted | CARE | Me (Recently deleted); delete is an object action on the letter page | |
| C17a | Attach a photo to a letter | CAPTURE | Review and letter page | An enricher |
| C17b | The photo shelf (browse attached photos) | LENS | Book, "Photos" lens | Replaces the Photos tab (ML-S9) |
| C18 | Date and place chips from a picked file | CAPTURE | Review and letter page | An enricher |
| C19 | Add from your library (chooser) | CAPTURE | Review, letter page, Home (photo-first) | One chooser component, three doors |
| C20 | A day to tell a letter about | CAPTURE | Home (shares the memory slot) | A prompt source, never both with the slip |
| C21 | Video | CAPTURE | As C17a and C19 | Later |
| C22 | Occasions the parent types | CAPTURE | Home (a card in the same slot); setup row in Me, Reminders | A prompt source |
| C23 | Co-parent sharing | OUTPUT | Share | Coming soon: quiet row |
| C24 | Shared voice and close family | OUTPUT | Share | Later (v1.1) |
| C25 | Plus: membership and plan | CARE | Me, Plan row directly under the account card | Terms say "Settings, Plan" (CCO-9; `settings-home.logic.ts`) |
| C26 | Gifts and lifetime | OUTPUT | Share | Later; "gift" is a banned word at v1.0 (BRAND.md) |
| C27 | Export everything (ZIP, PDF book) | OUTPUT | Share | Shipped |
| C28 | Printed book | OUTPUT | Share | Parked; BRAND.md: "Not promised in v1.0", so no row |
| C29 | Backup of recordings | OUTPUT | Share ("Where your letters live") | Built, off in Build 12 |
| C30 | Sync and a new phone | OUTPUT | Share ("Where your letters live"); the arrival screens are first run | Words move now; recordings follow C29 |
| C31 | Sign-in and account | CARE | Me | |
| C32 | Account management | CARE | Me | |
| C33 | App lock | CARE | Me | |
| C34 | Privacy controls and consents | CARE | Me | |
| C35 | Delete account, erase phone | CARE | Me | |
| C36 | Safety resources | CARE | Me (Help), never behind a flag (D-034) | |
| C37 | Help, support, legal | CARE | Me | |
| C38 | Spoken languages and packs | CARE | Me | |
| C39 | Your words | CARE | Me | |
| C40 | Reminders | CARE | Me; one ask card on Home exists (`ReminderPrimeAsk`) | |
| C41 | Appearance and accessibility | CARE | Me | |
| C42 | Opt-in analytics | CARE | Me, Privacy | |
| C43 | App-interface localisation | CARE | Me | Later |
| C44 | First run, age gate, story intro | CARE | No tab | No nav surface; the account and consent steps are care |
| C45 | Store listing, website, rating ask | CARE | No tab | No nav surface |
| C46 | Internal alerts, kill switches, remote config | CARE | No tab | Not parent-facing. The four classes do not describe it; I put it under CARE only so that every row has one class |
| (new) | Share one letter with one person (gap G-3) | OUTPUT | Share, with a button on the letter page | Not in NX-42; the founder has not decided it (NX-42 section 3) |

Counts of my own rows (a count, not a priority order): CAPTURE 14, LENS 7, OUTPUT 7 plus the uncatalogued share-one, CARE 20. That is 48 rows for the 46 capabilities, because I split C14 and C17 in two. Every id from C1 to C46 appears once or as a and b, and no row has two classes. C44 to C46 fit CARE poorly (they are not places a parent looks after); that is a limit of the four classes, not a finding about the product.

What this does to product's map: NX-42 puts C17 to C21 on a "Moments" tab. Under v3 they re-home: attach and chips are capture enrichers, the shelf is a Book lens, the day card sits on Home. NX-42 needs a one-line update (BL-898 reconciles).

## 4. Placement rules and the decision tree

### 4.1 Rules

| # | Rule | Why |
|---|---|---|
| P1 | **Capture has one entry.** One verb, one behaviour, one owner: Home's capture cluster (Speak, Type, Not much today) and the one function behind it. Every other place may only "add to this letter": it needs a letter, and it never creates one. | Fixes "record or write is becoming action on 3 tabs". |
| P2 | A capture mode that starts from something other than the voice (a photo, a day, an occasion) is a mode of that same entry, reached from Home. It opens the same capture screens with context. It is not a button on another tab. | Photo-first stays one verb. |
| P3 | **Lenses live inside the Book.** The Book has one default lens (Months) and may offer others (Photos, Firsts). A lens appears only when it has material. Find and Read together are actions on the Book, not lenses of their own. | One place to look at the kept letters. |
| P4 | **Outputs live together**, in Share. A letter's page may carry one "Share this letter" button; it opens the Share sheet and does nothing of its own. | One place to see what has left the app. |
| P5 | **Care lives in Me.** Anything that is about the parent, the device, the rules or the books' admin. Plan stays in Me because the Terms name "Settings, Plan" (CCO-9). | The founder's Me. |
| P6 | **Doorways, not lists, across tabs.** Home may show one memory slip. No tab shows another tab's list. | Fixes the Tonight and Book overlap (O2). |
| P7 | **One fact, one place.** A fact (a draft, a kept letter, a setting, an export) is the main object of exactly one tab. | NX-41 R6. |
| P8 | **Coming soon is a quiet row inside its class's tab.** Never a tab, never a page. At most one at a time, never above a real row, no badge, count, date or accent. | The founder: "Coming soon can be less prominent". |
| P9 | **Object actions stay on the object.** Add a photo, mark a first, delete, share this letter appear on the letter or in Review; they open their class owner's flow. | Where a hand already is. |

### 4.2 Decision tree for a new capability

1. Does it make a new letter, a mark, or add something to a letter (voice, text, photo, video, date, place, a first)? It is CAPTURE. If it can start a letter, it becomes a mode of Home's entry (P1, P2). If it only attaches, it is an enricher on Review and the letter page. A new button that starts a letter anywhere else is refused.
2. Does it show kept material in a new way, without changing or sending it? It is a LENS. It goes inside the Book, only when it has material (P3).
3. Does the book, or a piece of it, leave the app, the phone or this account, or let someone else in? It is an OUTPUT. It goes in Share (P4).
4. Is it about the parent, the account, the device, the rules, help, or the books' admin? It is CARE. It goes in Me (P5).
5. It fits two classes, or none: split it into its parts and place each part. If it cannot be split, stop. Do not add a tab; take it to the design lead and `product`.

A new tab needs a verb that no other tab has, material no other tab holds, and a day-one state that is not empty and not mostly a promise (section 6).

## 5. The candidate bar

```
|  Home        Book         Share        Me     |
|  Say         Read         Give         Look after |
```
Labels: "Home" and "Me" are the founder's words. "Share" is a working label and I do not like it much (section 6.3). The verbs above are for the team, not for the bar.

| Tab | One-line test ("I go to X to ...") | Material only this tab holds | Never |
|---|---|---|---|
| Home | I go to Home to say something to {child}. | Today's prompt for this time of day; the one capture entry; what is waiting to be kept; one memory slip (or one day card) | A list of kept letters; settings; sending |
| Book | I go to the Book to read, hear or find what we kept. | Every kept letter by month; the recordings; the lenses (Photos, Firsts); Find; Read together | A button that starts a letter (its empty state points to Home) |
| Share | I go to Share to send the book, or a letter, out of the app. | What has left the app or can: export, where the letters live, backup, who writes with me | A letter; a setting that is about the parent |
| Me | I go to Me to look after my account and my rules. | How I sign in, my plan, privacy, language, reminders, lock, help, my books | A letter; anything that leaves the app |

### 5.1 Home (Say)

Order (NX-43 R1, which I keep): date line and greeting; the prompt; the capture cluster pinned (Speak, Type, then a quiet "Start from a photo" when photo-first exists); "Not much today"; waiting letters as flat rows; one memory slip or one day card; the Plus line only when it applies. Home does not list kept letters (P6). The memory slip is the same object #721 builds ("From the book"; "A month ago" first); I ask only that it stop being a raised Book-style card (R1 in section 8).
- First day: date line, greeting, the first prompt, Speak, Type, and #721's day-zero book card where the slip goes. No empty box.
- Many letters: the same length as day one. At most one slip.

### 5.2 Book (Read)

The cover band stays (title, age in words, Read together, child switcher when there is more than one book). Under it, one row of lenses: Months (always), Photos (only once a photo is attached), Firsts (only once a first is marked). Find is one magnifier in the header and searches the lens in view (on the device only; search terms never enter analytics, PRINCIPLES 12). The gear leaves the Book once a device pass shows Me is found.
- First day: the closed cover, "The first page is waiting.", and one quiet button to Home. Only the Months lens, so no lens row at all.
- Many letters: Months, the Months sheet, Find; Photos and Firsts lenses if they have material.
- Letter page: read, hear; object actions "Add to this letter" (photo, a first, a date) and "Share this letter" (P9). The page may not start a letter.

### 5.3 Share (Give)

A tab of what has left the app, or can. Day one in a store build, servers on, signed in (EVIDENCE for what exists; status is NX-42's):

| Row | Status | Real or quiet |
|---|---|---|
| Export your book (ZIP, recordings, PDF book) | Shipped (C27) | Real |
| Where your letters live (this phone, your account, the iPhone's backup) | Shipped (C30) | Real |
| Back up my recordings | Built, off in Build 12 (`backupInBuild()` false) | Absent until on |
| Write this book together | Coming soon in Build 12 (C23, BL-882) | One quiet row |
| Share one letter | Not decided, not built (G-3) | Absent; if the founder decides yes, it adds the tab's first verb of its own |
| Printed book | Parked; "Not promised in v1.0" | Absent. No row |

So on day one Share has two real rows and one quiet row. See section 6.2.

### 5.4 Me (Look after)

As #738 and #740 have it, minus what moved out: account card and Plan; Children (the books); Writing (language, Your words, Reminders, Appearance); Your letters (Recently deleted, Storage; the Photos and days row from ML-S14 when built); Privacy and security (App lock, Privacy); Delete account; Help and legal (Help, If you are struggling, Legal); About. Moved to Share: Export your book, Where your letters live, Back up, People. Signed out, local start, and no-sign-in states are #738's, unchanged.

## 6. Challenging the candidate honestly

### 6.1 Is Home too thin?

Not by content: it holds the prompt, the capture cluster, waiting letters, a memory and the plan line. It is thin by design, and NX-43 R2 makes that a goal (one memory, no feed). The risk is the founder's "memorities", plural. One slip is what the code and NX-43 give; a second memory object would make Home a feed and bring back the overlap. I recommend one. HYPOTHESIS: a tired parent wants the fewest things on the first screen; no parent evidence exists.

### 6.2 Does Share feel empty or promise-heavy?

Yes, a little, on day one. Two real rows and one quiet one is a short page, and one third of it would be a promise. That is closer to a Settings section than to a place. It improves the day Share gains a verb of its own: share one letter (G-3, S to M, no server, uses the share sheet `expo-sharing` already in the build per the gap file) or a preview of the PDF book. Neither is decided. My test for keeping the tab in the bar: it has at least one real thing a parent can do other than open a settings page. If Share has only Export and Where letters live, it is Settings with a different name, and the three-tab alternative in section 7 is more honest. A first-day export of an empty book is also an odd screen; the row stays (data rights), and I have not designed a better state.

### 6.3 The word, the glossary and counsel

- "Give" is out: BRAND.md bans "gift" and "give Early Letters" at v1.0 (row "Approvals, gifts (v1.1)").
- "Share": BRAND.md bans "sharing" as the word for backup, and VOICE.md lists "Per-book sharing" as a phrasing to avoid. The privacy promise is "private by default; only you, and your co-parent if you invite them". A tab named Share says on first sight that the book is meant to travel. That is a promise `legal` confirms before it ships (COORDINATION section 10); I have not asked anyone. COUNSEL-READ.
- No grandparent or "family" word in a v1.0 Share tab (BRAND.md: v1.1).
- Candidates for `content` to weigh, none checked: "Share", "Keep" (clashes with the Keep step), "Together" (reads as people only), "Out" (poor), "Send". I have no better single word.
- Evidence about how a store review reads a tab that holds a single "Coming soon" row: none. NX-41's research doc notes App Review 2.1 on placeholder content and says its fetch read the guideline text only, not how it is applied (its E5). UNVERIFIED for this case.

### 6.4 Does it fight "Me includes everything settings"?

Yes. The founder's list for Me includes people and sharing and export. v3 moves both to Share, and moves "Where your letters live" and Back up too. Four reasons I still show it: P1 to P4 are cleaner with it; Plan stays in Me (the Terms name it); everything else on his list stays; and OUTPUT is the one class that is not settings. But it is his call. Copy that names the Settings path to export would change: `release/testflight.en.ts` line 147 ("use Settings, Your letters ...") and any other line I did not find (UNVERIFIED that my search is complete), and #740's Account page "Your data" section lists an Export row.

### 6.5 What breaks in the Memory Library flows (ML-S9 to S15), and what is saved

Read: `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` (on `develop`).

| Screen | Under v3 | Saved or broken |
|---|---|---|
| ML-S9 Photos tab | Becomes the Photos lens inside the Book. Same grid, states, AX5 and VoiceOver rows. | Saved: the whole body. Broken: it is no longer "third of four"; its "Add photos or videos" button started a letter. That button becomes "Add to a letter" and needs a "which letter" step, which no spec has (a new small design; M, UNVERIFIED). Its empty state goes: the lens is absent until a photo exists. |
| ML-S10 Day card on Tonight | Stays on Home, in the memory slot. It is a capture prompt (P2). | Saved |
| ML-S12, S13 Occasions and their reminders | Setup stays in Me (Settings, Photos and days). The card is on Home. | Saved |
| ML-S14 Settings: Photos and days | Stays in Me, "Your letters". Its text says "(the You tab)"; read it as Me. | Saved |
| ML-S15 No-access baseline | Unchanged. It says "Photos tab unchanged"; read: the Photos lens. | Saved |
| ML-S4 to S8 chooser, Review, chips, letter page | Unchanged. The chooser gets a third door: Home's "Start from a photo". | Saved |
| NX-39 phase table | No phase needs a tab guard. P1 and later gate only their own rows. | Saved: the bar has no dependency on NX-39 |

## 7. Alternatives, and the decision table

### The options

- **v3 (candidate): Home | Book | Share | Me.** Section 5.
- **Alt 1: Home | Book | Me.** The same model, three tabs. Outputs are a section of Me ("Take the book with you": Export, Where your letters live, People). It obeys the founder's list for Me literally. If Share later gains weight, the section is promoted to a tab with no change to the model.
- **Alt 2 (v2): Home | Book | Library | Me.** The Library tab holds photos, days and occasions (NX-39), with its own entries.

### Decision table (v2 against v3, with Alt 1)

| Test | v2: Library tab | v3: Share tab | Alt 1: three tabs |
|---|---|---|---|
| Overlap of verbs: how many places start a letter | Three: Home, Library's "Add photos" (ML-S9), the day card | One: Home | One: Home |
| Overlap: where a kept letter is the main object | Book, and Library (photos of the same letters) | Book only (Photos is a lens) | Book only |
| Empty-state risk on day one | High for Library: no photos yet, the chooser and occasions only | Medium: two real rows and one quiet row | Low: no tab to fill |
| Promise-heavy risk | Low | Medium: one third of the page is "Coming soon" | Low: a quiet row among Me's rows |
| Dependency on unbuilt scope for the bar | High: needs NX-39 P1 and a build guard | None for the bar (Export and Where letters live ship); the tab's growth needs share-one or co-parent | None |
| Fit: "Home left with actions and memories" | Yes | Yes | Yes |
| Fit: "Me right with all settings" | Yes (Me keeps export and people) | Partly: outputs leave Me | Yes |
| Fit: four tabs | Yes, once Library is built; three until then | Yes | No, three |
| Glossary and counsel | Library: one new word | "Share": legal read and glossary change | None new |
| Bar stability as features arrive | Library appears later: the bar changes | Stable: new capabilities land in a class | Stable; a tab appears only if a class outgrows its section |
| Rework against specs | Low | ML-S9 and the Account "Your data" row | None |

### Recommendation

1. Adopt the model (sections 2 to 4) now, whatever the bar. It is what removes the overlap.
2. Bar: v3 (Home | Book | Share | Me), with one condition: Share ships with at least one real verb of its own beyond Export, which means the founder decides share-one-letter (G-3) or the co-parent invite ships. Until then, ship Alt 1, same model, outputs as a section in Me.
3. If the founder keeps export and people in Me as he listed them, take Alt 1 and stop; v3 is then a later promotion.
4. Do not build the Library tab (v2). Its material is a capture mode, a Book lens and a Settings page.

One-line tests per tab for the recommended bar are in section 5.

## 8. Making Home and Book look like different rooms (PROPOSED, kept from v2)

| Rule | Home | Book |
|---|---|---|
| R1 Raised card means a kept letter | Waiting letters are flat rows; the memory slip is flat with a kicker ("A month ago", "From the book") | Letter cards stay raised |
| R2 One memory object | The slip (#721), at most one | Everything else |
| R3 Book starts nothing | n/a | Empty state: the closed cover and a quiet button to Home |
| R4 Light | Lamp with the daypart tone and breath | Lamp still (the `book` scene) |
| R5 Share and Me | Plain paper, no lamp, like every Settings page | |
| R6 One word per waiting thing | "Waiting to be kept" (a draft) | "Getting ready" (words being made) |

R1 is a prototype question (does a flat row still read as tappable at AX5?), UNVERIFIED until built. #721's slip is a raised-card style today; its owner and I need the same answer.

## 9. Wireframes (text)

Fictional family Asha. `[ ]` is a button, `~` is lamp light. Words are PROPOSED unless they exist; new words need `content` and the founder.

### 9.1 The bar
```
|  Home        Book        Share        Me    |
```
VoiceOver: "Home, tab, 1 of 4" ... "Me, tab, 4 of 4. Settings and account." Each tab calls `LARGE_CONTENT(title)`.

### 9.2 Home, first day
```
~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
ASHA, BEFORE YOU
Good evening, Mama.
What is the first thing you want {child} to know about today?
                                 [ Another thought ]
 [cover] Asha's book                     (day-zero card, opens Book)
         Ready for its first letter.
 [ Speak ]            [ Type ]
     Start from a photo   (quiet; only when photo-first exists)
        Not much today
```

### 9.3 Home, a week in
```
ASHA, 7 MONTHS      Good morning, Mama.
(the prompt)                      [ Another thought ]
 Waiting to be kept                       (flat row)
 SAT 14 OCT  1 min  "We went to the park..."     Keep >
 A month ago                              (the one memory slip, flat)
 "She slept through for the first time"       Read it >
 [ Speak ]            [ Type ]
        Not much today
```

### 9.4 Book with lenses
```
|  Asha's book                       [search] |
|  7 months            [ Read together ]      |
|  Months   Photos   Firsts      (a lens appears only with material)
|  THIS MONTH                                  |
|  +----------------------------------------+  |  raised card = a kept letter
|  | SAT 14 OCT   "We went to the park..."  |  |
|  +----------------------------------------+  |
```
First day: cover, "The first page is waiting.", quiet button to Home; no lens row.

### 9.5 Letter page object actions
```
< Book
SAT 14 OCT                      From Mama
"We went to the park and she laughed..."
[ play ]  0:42
 Add to this letter      Share this letter     (each opens its owner's sheet)
```

### 9.6 Share, day one
```
Share                                      (heading level 1)
 | Export your book                      >   (ZIP, recordings and a PDF book)
 | Where your letters live               >
 Write this book together     Coming soon      (one quiet row, muted, no chevron)
```
Later, with the co-parent flow live, that row opens the invite sheet or the people page (the body of `FamilyShared`). If share-one-letter is decided, it adds one row, "Letters you shared", content-free.

### 9.7 Me
```
Settings                                   (heading level 1; tab label "Me")
 | Mama  Signed in with Apple         >   | Plan   Free   >
CHILDREN      | Asha's book  /  Add a book
WRITING       | Spoken language / Your words / Reminders / Appearance
YOUR LETTERS  | Recently deleted / Storage / Photos and days (when built)
PRIVACY AND SECURITY | App lock / Privacy
DELETE ACCOUNT, HELP AND LEGAL, ABOUT   (as #738 and #740)
```
Signed-out and local-start cards are #738's.

## 10. Collisions with open PRs, by file, and what each needs

Files from each PR's changed-file list through the REST API on 10 Nov, at the heads in section 1. #699, #720, #738, #740 and #764 are stacked, so their lists show the stack. Renames this spec causes: **R-a** Tonight to Home (label only; keep the route `index.tsx` and folder `components/tonight`); **R-b** You to Me (label only; keep `you.tsx` and `/you`); **R-c** the Family tab removed and a Share tab added (`share.tsx`; the `FamilyShared` body moves into it as the people section); **R-d** outputs rows move from Settings to Share.

| File | PRs touching it | Change asked | Rename |
|---|---|---|---|
| `apps/mobile/src/app/(tabs)/_layout.tsx` | #699, #720, #738 (removes `Tabs.Protected` and the `familySurfacesShown` import), #740, #764 (guard back) | Screens become `index`, `book`, `share`, `you`; drop `family`. No guard on any tab. | R-a to R-c |
| `apps/mobile/src/app/(tabs)/you.tsx` | #699, #720, #738, #740 | Keep the file; the label changes | R-b |
| `apps/mobile/src/app/(tabs)/family.tsx` | #720 (the switch) | Replaced by `share.tsx`; leave until #720 merges | R-c |
| `apps/mobile/src/app/(tabs)/index.tsx` | #721 (+29 lines); #738 and #740 list it but have no net change vs `develop` (I diffed #738) | Flat waiting rows; the slip. Coordinate with #721. | R-a |
| `apps/mobile/src/components/tonight/resurfaced-card.tsx`, `day-zero-card.tsx`, `from-the-book.logic.ts` | #721 | R1 and R2 restyle; same owner | |
| `apps/mobile/src/app/(tabs)/book.tsx` | #764 (+21 lines, the arrival line) | Lens row, search, empty state, remove the gear. After #764. | |
| `apps/mobile/src/app/settings/index.tsx`, `settings-home.logic.ts` | #738 (own), #740 | Remove Export, Where your letters live and the Back up row (R-d). Keep Plan. | R-d |
| `apps/mobile/src/app/settings/account.tsx` | #740 | Its "Your data" section has an Export row (`account.export`); move or drop | R-d |
| `apps/mobile/src/lib/family/entry.logic.ts` | #720 (own), #738, #764 | `familySurfacesShown` decides the real people section versus the quiet row, not a tab | R-c |
| `apps/mobile/src/components/family/coparent-soon.tsx` | #720 | Sheet only; drop the screen presentation and the drawing | R-c |
| `apps/mobile/src/app/settings/children/[id].tsx`, `child-settings.logic.ts` | #720, #738, #764 | The per-book "Write this book together" row stays and links to Share | R-d |
| `packages/content/src/strings.en.ts` (`tabs`, `settingsHome`), `packages/content/test/tab-labels.test.ts` | #699, #720, #738, #764, #721 (+11 lines) | `tabs` keys become `home`, `book`, `share`, `me`; the test pins `['tonight','book','family','you']` today. #721 edits the same file: expect a conflict. | R-a to R-c |
| `packages/content/src/features/family.en.ts` | #720 | `done` (line 75): "waits on the Family tab" | R-c |
| `packages/content/src/features/billing.en.ts` lines 51, 52, 59; `strings.en.ts` lines 1159, 1165 | none of the six | "waits on Tonight", "Go to Tonight", "Back to Tonight" must read Home | R-a |
| `packages/content/src/release/testflight.en.ts` lines 104, 147 | none | Family tab and Settings, Your letters paths | R-c, R-d |
| `apps/mobile/test/tab-bar.test.ts`, `family-tab.test.ts`, `store-family-tab.test.ts` | #699, #720, #738, #740, #764 | `tab-bar.test.ts` pins `['index','book','family','you']`; update | R-a to R-c |
| `apps/mobile/e2e-web/j04-tonight.flow.ts`, `j21-coparent.flow.ts`, `j22-sign-in.flow.ts`, `support/app.ts` | #764 edits some e2e-web files | Name tabs by label (found by file-name search; the lines are UNVERIFIED) | R-a to R-c |
| `docs/design/IA.md`; `docs/design/specs/YOU-TAB-STATES-9nov.md` (PR #732); NX-42 and NX-41 (PR #790) | #699, #720, #738, #740; #732; #790 | Four tabs and the class model. NX-41 R12 (keep Family in alpha) and NX-42's Moments tab are superseded. I do not edit them here. | all |

Findings for owners:
1. **#738 at `0cd8e1f1` deletes the Family guard `develop` already has** (#665 merged as `c1f7cec51`). #764 has it back. Re-base #738 before review. Nothing pushed to that branch.
2. **#721 and this spec ask the same thing of Home's memory object.** One owner conversation.
3. **The third slot changes meaning.** #699 to #764 and #720 all keep Family's slot as Family or hide it. v3 turns it into Share. Do not start `share.tsx` before those settle.

## 11. Requirements (Given, When, Then)

Working ids `NAV-R#`; `product` assigns real ones. Feature requirements stay in their own specs.

| Id | Requirement | Proof |
|---|---|---|
| NAV-R1 | Every capability has one class. Given the capability map, Then each row names exactly one of CAPTURE, LENS, OUTPUT, CARE. | Doc review against section 3 |
| NAV-R2 | One capture entry. Given any build, Then the only controls that start a letter are Home's cluster and the modes it opens (photo, day, occasion). No other tab has a control that starts a letter. | `tab-bar.test.ts` reads the sources; device |
| NAV-R3 | Enrich only. Given a letter page or Review, When the parent adds a photo, a date, a place or a first, Then it changes that letter and creates no new one. | Device; unit tests in NX-39, NX-44 |
| NAV-R4 | Lenses inside the Book. Given a photo or a first exists, Then the Book offers that lens. Given none exists, Then no lens row, no empty state. | Device |
| NAV-R5 | Outputs together. Given export, where letters live, backup, people, Then each is reachable from Share and from no other tab's first screen. | Device; tab test |
| NAV-R6 | Me is care. Given Me, Then it holds the account, Plan, Children, Writing, privacy, help and About, and no letter, no lamp, no badge. | Device |
| NAV-R7 | Home is thin on purpose. Given a book with many letters, Then Home shows the prompt, the capture cluster, waiting rows and at most one memory. | Device, AX5 |
| NAV-R8 | Share is not a promise. Given Share, Then at least one row is a real, working thing, and at most one row is "Coming soon", below the real rows. Given no real row, Then the tab is not in the bar. | `tab-bar.test.ts`; device |
| NAV-R9 | Labels. Given `copy.tabs`, Then each label is one glossary word, passes `rules.test.ts` and `tab-labels.test.ts`, and `legal` has read "Share". | `content`, `legal` |
| NAV-R10 | Accessibility. Given VoiceOver, AX5, Reduce Motion and Reduce Transparency in light and dark, Then each tab has one level 1 heading; tab labels stay at 13 pt with the Large Content Viewer; targets are 44 pt or more; nothing relies on colour alone. Four tabs at 375 pt are 93.75 pt wide (computed); label widths for "Share" I did not measure (UNVERIFIED). | Device |
| NAV-R11 | Constitution. Given any new string, Then no streak, point, badge, gap count, fear, guilt or loss word; {child}; nothing says a machine writes; glossary words only. | `rules.test.ts` |
| NAV-R12 | No new analytics. Given this spec, Then no new event. `coparent_soon_opened` keeps counting with `surface: 'sheet'`. | Catalog |
| NAV-R13 | Door lines. Given the quiet co-parent row, Then **Shown:** the existing `familyCopy.soon` words. **Records:** nothing beyond the opt-in, content-free count. **Never:** a date, a notify promise, a number. **Decline:** Close in one tap. The invite flow's consent, Records and Never lines are unchanged. | `legal`, `privacy` |

## 12. Sequence for `mobile` (one concern per PR, each under 400 lines)

| Step | Change | After |
|---|---|---|
| N0 | Re-base #738 so the guard stays | now |
| N1 | #699 and #720 merge as they are | review |
| N2 | Labels Home and Me; the Tonight strings; tests; e2e-web (S to M) | N1 |
| N3 | Move Export, Where your letters live and Back up out of Me into `share.tsx`; Family tab removed; the quiet co-parent row (BL-882) (M) | N1, #738, #740, #764; the founder's answer to question 1 |
| N4 | Home: flat rows and one slip (S to M) | #721 |
| N5 | Book: lens row, Find, empty-state button, remove the gear (M) | #764 |
| N6 | Photos lens and "Add to a letter" (M); Start from a photo (S) | NX-39 P1 |
| N7 | `IA.md` and `COMPONENTS.md` in step | N2 to N6 |

## 13. Open questions (each with a recommendation)

1. Founder: may export, where letters live and people move from Me to Share, given your list for Me? Recommend yes only if Share gets a real verb of its own; otherwise Alt 1 (outputs as a section of Me). Needed before N3 and before #720 merges.
2. Founder: decide share-one-letter (gap G-3, S to M, no server)? Recommend yes, it is the cheapest real verb for Share and the "grandma should hear this one" need. If no, Alt 1.
3. Content and legal: the third label. Recommend a read of "Share" by `legal` before anything else; if it fails, Alt 1 avoids the word.
4. Product: update NX-42 (Moments tab dissolves into three places) and NX-41 R12, through BL-898. Recommend yes.
5. Product and #721's owner: Home's one memory, flat slip or raised card? Recommend flat.
6. Memory Library owner: ML-S9 as a Book lens, with an "Add to a letter" step. Recommend yes; a small new design for the "which letter" choice.

## 14. UNVERIFIED list

- Anything on a device: how the lens row, the flat rows and the four tabs feel; VoiceOver text; the iOS tab-button wrapper; the width of "Share" at 13 pt.
- Apple HIG tab-bar statements: second-hand through NX-30a and NX-41's research doc; my fetch was refused. Nothing here depends on a number from it.
- Statuses in section 3 are NX-42's, not re-checked. I read NX-42 in full, NX-43 and NX-44 in part.
- That every copy line naming a Settings path or the Family tab is in my list.
- That a store reviewer accepts a Share tab with one quiet row (no source).
- Tap counts and contrast ratios: quoted from NX-30a; this spec changes no colour.
- Which e2e-web lines tap a tab.
- #699, #720, #738, #740, #764, #721, #790 are drafts or open; their heads move.
- Sizes S, M, L are guesses. No statistics were invented.
