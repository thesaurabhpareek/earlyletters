# NX-42: Capability map: everything we build or have committed, which tab it lives in, and which requirement it has

Status: v1, 10 Nov 2026 (UTC). Docs only. Author: `product`, for the unique-tabs programme (brief: Karma). Founder direction 10 Nov (second message, verbatim): "The navigation need to feel unique and carrying material info in each tab so one tab on right can be me which includes everything settings. Default home tab on left most is where you see actions memorities etc and then identify what other 2 tabs need to be that are relevant. We also need to identify what other capabilities we build as part of our scope so identify and write those requirements." Nothing here is reserved in `DECISIONS.md`. Requirements for the gaps this map finds are NX-43 (Home and memories) and NX-44 (Firsts, a proposal). Find a letter already has a requirement (`F09-REQ-015`); the work is to decide and build it. The tab model is NX-41.

Tags: EVIDENCE = a repo file or PR read this session (named). HYPOTHESIS = anything about what a parent wants. UNVERIFIED = not read or not run. I did not run the app and did not open every PRD V2 feature file in full; for most rows I read the feature map (`docs/prd/v2/05-feature-map.md`), route names under `apps/mobile/src/app`, the BACKLOG section titles, the NX files named, and the NX-40 text.

## 1. How to read this

- Tab model (four tabs, NX-41 section 4): **Home** (left, default: do and remember), **Book** (the kept letters), **Moments** (proposed: the pictures and days around the letters), **Me** (right: everything settings). "Moments" is a working name and "Home" and "Me" are the founder's words; labels are `content`'s to rule (BRAND.md; `tab-labels.test.ts`). "None" means the capability has no tab (first run, ops, store).
- Status: **Shipped** = on `develop` and in TestFlight (code exists; device proof may still be open). **B12** = in the Build 12 cut (open stack #699, #720, #724 to #764 or a Build 12 row). **B13** = proposed for Build 13 by this map. **Later** = committed in the PRD as after 1.0 or in NX-39 later phases, no date. A status I did not verify says UNVERIFIED.
- Owner = first-choice agent handle from `agents/roster.json`. Size = S, M, L, a guess unless the cited file gives one.
- Requirement = the file that already states it, or **MISSING** with the NX file that this PR adds.

## 2. The map

### 2.1 Do (Home)

| # | Capability | One-line job | Status | Tab | Depends on | Owner | Size | Requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Capture: speak or type a letter | Say one thing to {child} now | Shipped | Home | F19 config, speech packs | mobile | done | `docs/prd/v2/features/F04-capture.md` |
| C2 | Review and faithful edit | See and undo every machine fix; keep or erase | Shipped | Home (modal) | C1, F05 | speech | done | `F06-faithful-edit.md` |
| C3 | Waiting drafts and held letters | Never lose a take; finish later | Shipped | Home | C1 | mobile | done | F04; `(tabs)/index.tsx` header (F14-REQ-041 for the fold) |
| C4 | Prompts and "Another thought" | Give a gentle first line, by age | Shipped | Home | F13, `packages/content` | content | done | `F13-prompts-reminders.md` (REQ-001 to REQ-006) |
| C5 | Not much today (quiet day mark) | Mark a day without words, no guilt | Shipped | Home | C1 | mobile | done | D-084; header of `(tabs)/index.tsx` (UNVERIFIED which requirement file) |
| C6 | Age and stage: month-age, "Before You", due-date mode | Date line and prompts that fit the child's age | Shipped | Home, Book | F03, F12 | mobile | done | F03, F12, F13-REQ-003 |
| C7 | Catch-up: add a letter for an earlier day | Backdate what I said before installing | Dates shipped; voice-memo import not ready | Home (entry), Book | C1 | mobile | M | `docs/roadmap/next/03-requirements/NX-27-catch-up-letters.md` (on branch `docs/execution-tracker-8nov`, not yet on `develop`) |
| C8 | Memories on Home: a past letter or day resurfaced | Be reminded of what we kept, without counts | Partial (the "A month ago" card only) | Home | C1, Book | product, mobile | M | **MISSING: NX-43** (F47 "On this day" is Later and thin) |
| C9 | Plus line on Home | Tell me once when free letters are used | Shipped (alpha) | Home | C25 | payments | done | F14 (F14-REQ-040) |

### 2.2 Keep and read (Book)

| # | Capability | One-line job | Status | Tab | Depends on | Owner | Size | Requirement |
|---|---|---|---|---|---|---|---|---|
| C10 | The book by month (cover band, chapters, Months sheet) | Read what we kept, newest first | Shipped (#674) | Book | F09 | design-systems, mobile | done | `F09-book.md` |
| C11 | Letter page: read it, hear it | The letter as the object, with the recording | Shipped | Book | F08 | mobile | done | F09, `F08-recordings.md` |
| C12 | Read together | Read the book aloud to {child} | Shipped, device checks open | Book | C10 | mobile | done | `F10-read-together.md` |
| C13 | Find a letter | Find the one I remember in a long book | **Not built** (cut from 1.0 as a P1 extra) | Book | C10 | mobile | M | `F09-book.md` F09-REQ-015 and WP-F09-11 (analytics `book_search_used` is specified there); founder question Q4 in F09 is still open |
| C14 | Firsts: letters the parent marks as a first | Pick out the firsts in my own words | **Not built** | Book | C10 | product, mobile | M | **MISSING: NX-44** (proposal; founder decision first) |
| C15 | Multiple books and the switcher | Twins and siblings each have a book | Shipped | Book (switcher), Me (Children) | F12 | mobile | done | `F12-children.md` |
| C16 | Hide, delete a letter, Recently deleted | Take back what I did not mean to keep | Shipped | Book (delete), Me (Recently deleted) | F17 | mobile | done | F17; NX-04 |

### 2.3 Remember (Moments, proposed)

| # | Capability | One-line job | Status | Tab | Depends on | Owner | Size | Requirement |
|---|---|---|---|---|---|---|---|---|
| C17 | Attach one photo to a letter (picker, no library read) | The picture next to my words | Memory Library phase P0; the NX-39 phase table puts its build with Build 12 (UNVERIFIED that it merged) | Moments (shelf), Book (letter page) | NX-33, counsel on the label | mobile | M | `NX-33-photos.md` (branch `docs/nx-33-photos-8nov`); `NX-39-memory-library.md` P0 |
| C18 | Date, and maybe a city, from the picked file | Date the memory from the photo | P1, gated on spike BL-843 | Moments | C17 | mobile | S | NX-39 |
| C19 | Add from your library (chooser by date range) | Find the photos of that week | P2a, gated | Moments | permission, counsel | mobile | L | NX-39 |
| C20 | Suggested days, "days away" card | A day worth a letter, on the parent's say | P2b, gated, off by default | Moments, Home (one card) | C19 | mobile | L | NX-39 (R15 to R30) |
| C21 | Video | Short clips with a letter | P3, later | Moments | C19 | mobile | L | NX-39 |
| C22 | Occasions the parent types, reminders on those days | Birthdays, trips, festivals I name | P4a, later | Me (setup), Home (card) | F13 | reminders owner | M | NX-39 P4a |

### 2.4 Together and beyond the phone

| # | Capability | One-line job | Status | Tab | Depends on | Owner | Size | Requirement |
|---|---|---|---|---|---|---|---|---|
| C23 | Co-parent sharing | The other parent writes to the same book | Coming soon in Build 12 (one state, BL-882 in #767); live later | Me (People) | F02, F16 | sync | L | `F11-co-parent.md`; `03-requirements/09-co-parent-and-shared-voice.md`; BL-882 to BL-889 (#767) |
| C24 | Shared voice and close family | Hear each other's recordings; grandparents join | Later (v1.1) | Me (People), Book | C23 | sync | L | F31, F32 in `F30-later.md`; `11-relatives-add-a-hello.md` |
| C25 | Plus: membership and plan | Pay once for more letters | Alpha; store state UNVERIFIED | Me (Plan) | App Store | payments | done | `F14-plus.md`; `08-plus-and-billing-trust.md` |
| C26 | Gifts and lifetime | Give a book | Later | Me | C25 | payments | M | F43 (stub in `F30-later.md`, **thin: no requirement file**) |

### 2.5 Keep forever (export, print, backup, sync)

| # | Capability | One-line job | Status | Tab | Depends on | Owner | Size | Requirement |
|---|---|---|---|---|---|---|---|---|
| C27 | Export everything (ZIP, PDF book) | Take it all with me, always | Shipped | Me (Your data); Book entry (later) | F09, F08 | mobile | done | `F15-export.md` |
| C28 | Printed book (Year One) | A paper book with a QR to the voice | Later (F42; "not promised at v1.0") | Book, Me | C27 | product | L | F42 (stub; **no requirement file**) |
| C29 | Backup of recordings | A lost phone does not lose the voice | Built, off in Build 12 (NX-34 says 1.0.1 or after) | Me (Where letters live) | F08, escrow | data-architect | M to L | `NX-34-free-audio-backup.md` (branch `docs/nx-34-audio-backup-8nov`) |
| C30 | Sync and a new phone | My book arrives on a new phone | B12 for words (S17 in #764); recordings follow C29 | Me, none (first run) | F02, F16 | sync | M | `F16-sync.md`; `07-letters-on-every-phone.md`; NX-40 H6 |

### 2.6 Me: account, trust, settings

| # | Capability | One-line job | Status | Tab | Depends on | Owner | Size | Requirement |
|---|---|---|---|---|---|---|---|---|
| C31 | Sign-in and account | Prove it is my book | B12 (account first) | Me (Account); none (first run) | F02 | security-architect | M | `F02-account.md`; NX-31; NX-32; NX-40 |
| C32 | Account management: sign-in methods, signs letters as, delete | Look after who I am in the app | B12 (#738, #740) | Me | C31 | mobile | M | NX-32; `YOU-TAB-STATES-9nov` (PR #732) |
| C33 | App lock (Face ID, passcode) | Keep the book behind my face | Shipped (off by default) | Me (Lock) | none | mobile | done | `F17-settings-privacy.md`; NX-40 R12 to R15 |
| C34 | Privacy controls and consents (withdraw, sensitive data) | Say yes or no, change my mind | Shipped; withdrawal in NX-08 | Me (Privacy) | F17 | privacy | M | F17; `NX-08-consent-withdrawal.md` |
| C35 | Delete account, erase phone | Leave at any time | Shipped | Me | F17 | mobile | done | F17; `04-delete-account-and-erase-phone.md` |
| C36 | Safety resources ("If you are struggling") | Always one tap from a hard day | Shipped (never behind a flag, D-034) | Me (Help) | none | content | done | `F20-help-safety.md`; D-034 |
| C37 | Help, support, legal pages | Get a person, read the terms | Partial | Me (Help and legal) | web | support | M | F20; `NX-16-support-route.md` |
| C38 | Spoken languages and packs | Say it in my language | English only in Build 12 (D-121, UNVERIFIED for 13) | Me (Language) | F05, F19 | speech | per language | `12-names-and-languages-as-spoken.md`; F05, F33 |
| C39 | Your words (dictionary) | Teach it our names | Shipped | Me (Your words) | F07 | speech | done | `F07-dictionary.md` |
| C40 | Reminders (nudges) | A gentle nudge at my time | Shipped on the phone | Me (Reminders), Home (one ask) | F13 | reminders owner | done | F13; `10-reminders-that-fit.md`; M13 in BACKLOG |
| C41 | Appearance and accessibility | Large text, dark, motion | Shipped | Me (Appearance) | design tokens | design-systems | done | `06-nfr.md`; NX-35 |
| C42 | Opt-in analytics | Help us learn, content-free | Off in 1.0 profiles (D-124 item 3) | Me (Privacy) | F18 | analytics | S | `F18-analytics.md`; `NX-15-free-analytics.md` |
| C43 | App-interface localisation | The app in my language | Later (F44) | Me | content | content | L | stub in `F30-later.md`; **no requirement file** |

### 2.7 No tab

| # | Capability | One-line job | Status | Owner | Requirement |
|---|---|---|---|---|---|
| C44 | First run, age gate, story intro | Get from install to the first letter | B12 (account-first); intro Tier B | mobile | `F01`, `F03`, NX-31, NX-40 |
| C45 | Store listing, website, rating ask | Be found, be honest | B12 | marketing | `F21-store-web.md`; `NX-24-rating-ask-and-store-page.md` |
| C46 | Internal alerts, kill switches, remote config | The team hears first; a switch turns a feature off | Shipped/partial | ops | `NX-17-internal-alerts.md`; `F19-content-config.md` |

## 3. Gaps this map found

| Gap | Why it is a gap | What this PR does |
|---|---|---|
| Memories on Home (C8) | The founder named it ("actions memorities"). Only one card exists (a letter 28 to 35 days old, only when no draft waits). "On this day" is Later in a stub (F47). NX-39 adds library cards but no requirement covers the plain resurfacing of the parent's own letters | NX-43 |
| Find a letter (C13) | Has a requirement (F09-REQ-015) but is not built (cut from 1.0). A long book is hard to browse; no search anywhere in `apps/mobile/src` (NX-30 audit) | No new file. One backlog row to build it from F09-REQ-015 once the founder answers F09 Q4 |
| Firsts (C14) | The founder's earlier list names ages and milestones. Nothing marks a "first". Risk: a milestone list becomes gap counting | NX-44 as a proposal with a founder decision first |
| Printed book (C28), gifts (C26), app localisation (C43) | One-row stubs in `F30-later.md`, no requirement file | Listed, **not written**: they are Later, need counsel and business answers, and I will not invent them. Recommendation: write them when the founder picks a release for them |
| Outward share of one letter (a message or a link to a grandparent) | Not in the PRD or the map; F37 web page and F32 are the closest. Privacy-heavy (a child's voice leaving the book) | Listed, **not written**; founder decision first |
| Me as one list (C31 to C43) | Pieces exist in NX-32, YOU-TAB-STATES and `settings/index.tsx` but there is no one statement of what Me holds and in what order | NX-41 section 7 (Me) |
| Home as one screen (C1 to C9) | Same: Tonight's text exists in a code header, not in a requirement | NX-41 section 5 and NX-43 |

## 4. Where the weight falls

Counting rows by tab (a count of my own rows, not a priority): Home 9, Book 7, Moments 6 (all gated, none shipped), Together 4, Keep forever 4, Me 13, none 3. Me is by far the largest, which fits the founder's word "everything settings"; Moments has no shipped capability, which is the main risk to a fourth tab (NX-41 section 8).

## 5. UNVERIFIED

- Whether NX-39 P0 (photo picker) merged for Build 12; the phase table says it ships with Build 12 (line "P0 build" in the gates table) but I did not find the code.
- Store state of Plus (C25), help and support pages (C37), and the Build 12 language list (C38).
- Contents of NX-27, NX-33, NX-34 beyond their opening lines, and of `09`, `10`, `11`, `12` numbered files (read titles only).
- Whether C5 has its own requirement file.
- Everything about parents' wants (all HYPOTHESIS).
