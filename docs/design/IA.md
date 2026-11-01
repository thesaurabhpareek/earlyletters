# Information architecture

The map of every place in the iOS app and what each is called. Visible names are the exact words a parent sees; the glossary for those words is `packages/content/BRAND.md`. Read on `develop` at e7b53193 (31 Oct 2026). Where a ruling or decision will change a place, the table says what you see today and what changes, so the map never presents a target as fact. Naming findings and rulings: [NOMENCLATURE_AUDIT_2026-10-31.md](NOMENCLATURE_AUDIT_2026-10-31.md).

## Builds and switches

Three builds show different trees. The switches live in `apps/mobile/src/lib/capabilities.ts` and the EAS profiles in `apps/mobile/eas.json`.

| Build | Profile | Server features | Languages | Family surfaces |
|---|---|---|---|---|
| Alpha build 1 (TestFlight) | `testflight` | off | all that passed their gate | Today: "Coming soon" screens. After the D-126 change: hidden |
| Alpha build 2 | `preview` | on | all that passed their gate | the full co-parent screens |
| First store build (1.0) | `production` | off | English only (D-121, CR-16) | Today: "Coming soon" screens. After the D-126 change: hidden. If that change is not ready, the screens stay and the Notes for Review describe them (D-126 fallback) |

Backup of recordings (`EXPO_PUBLIC_BACKUP`) is off in every profile, so no build shows "Back up my recordings"; the row reads "Kept on this phone" everywhere.

Every tree below is the first store build unless marked.

## Tabs

| Tab | Route | What it is for | Heading | Shown in |
|---|---|---|---|---|
| Tonight | `/` | Start today's letter | A greeting, then the prompt | every build |
| Book | `/book` | Read and hear what is kept | "{child}'s book" | every build |
| Family | `/family` | Build 2: "Who writes to {child}" | | Today: every build (`(tabs)/_layout.tsx:71`), "coming soon" with servers off. After the D-126 change: build 2 and later |

## Tonight

- Prompt, with "Another thought"
- "Speak" opens Listen; "Type" opens Write
- "Not much today" leaves a mark ("A quiet day, kept.", with Undo)
- Waiting cards: "Waiting to be kept.", "Recorded before the app closed.", "A recording is ready to read back."; actions "Pick it up", "Open", "Keep it", "Read it back"
- A month-ago card ("A month ago") when no draft is waiting
- Reminder sheet once: "A gentle nudge, now and then?"

## Book

- Header "{child}'s book"; "For {child}" switches books when there are two or more ("Whose book?")
- Gear: Settings (the only way into Settings)
- "Read together"
- Months, newest first: "This month", "Month {n}", "The first weeks", "Before You"
- Letter cards: "From {signsAs}", "Private", "Ready to read back"; quiet-day rows "A quiet day"
- Empty: "The first page is waiting." with "Write a letter" (goes to Tonight)

## Screens off the tabs

| Screen | Route | How it opens | Visible name or first line |
|---|---|---|---|
| First run (5 steps) | `/onboarding` | first launch, after the age gate | welcome, "Exactly as you said it.", "Who is this book for?", "What does {child} call you?", "The book is open." |
| Listen | `/listen` | full screen | "To {child}", "Listening." |
| Write | `/write` | sheet | field "Your letter" |
| Review | `/review` | full screen | "To {child} · Month {n}"; views "With small fixes" and "Exactly as said" |
| Keep gate | sheet in Review or Write | after the free letters | "Keep adding to {child}'s book" |
| Letter | `/letter/[id]` | push | the letter; "Hear {signsAs}" |
| Read together | `/read-together` | full screen | "Read together" |
| Plus is on | `/plus/confirmed` | after purchase | "Plus Monthly" or "Plus Annual" |
| Not found, error, launch recovery | `+not-found`, boundaries | | "Nothing at this link", "This page did not open", "The book could not open" |

Build 2 adds: sign-in (`/(auth)/sign-in/*`), join, invite and leave (`/invite`, `/invite/new`, `/invite/leave`).

## Settings

Reached from the gear on Book. Section titles are as shown; a dash means no title.

This table is today. From the 1 Dec build Settings regroups into five groups plus About (CDesO-1, F1): `screens/SETTINGS_AND_ACCOUNT.md` section 6 is the target, and this table changes with the code.

| Section | Row | Opens |
|---|---|---|
| - | Plan (stays; the Terms name "Settings, Plan", ruling R-C) | Plus status, manage subscription, restore, redeem a code, request a refund, terms |
| Children | each child's name | "{child}'s book": name, birthday or due date, "Sign my letters to {child} as", reminders for this child, "Hide this book" |
| Children | Add a child | the first-run form |
| Children | Hidden books (only when one is hidden) | "Show this book again" |
| Writing | Spoken language | English only in the store build |
| Writing | Word for word (after FP-1, ruling R-A) | a checkmark list "New spoken letters start": "With small fixes" or "Exactly as said". Today this is a switch under Recordings |
| Writing | Reminders | how often, which evenings, time, month and birthday messages, names in notifications |
| Writing | Appearance | theme; reading size |
| Your data | Privacy | what we never do; the policy and terms |
| Your data | Export your book | export everything (page titled "Export" today; "Export your book" after FP-1) |
| Your data | Recently deleted | 30 days, Restore, Erase now |
| Your data | Recordings | kept on this phone; recordings without a letter; per-language speech downloads ("Writing down your words"). Today it also holds "How transcription works" with the Word for word switch, which moves to Writing in FP-1 |
| Your data | Storage | downloads and space used |
| Help and legal | Help, If you are struggling, Terms of Service, Privacy Policy, Licenses | |
| About | Version | "Early version" note |

Build 2 adds Account (sign-in methods, devices, sign out) and Delete account when its switch is on (D-129). It does not add backup (see Builds).

## Rules for adding a place

- A new tab needs a decision entry. The store build is meant to have two, Tonight and Book, once the D-126 change lands.
- A new screen gets a route, a visible name from `packages/content`, a row in this file, and an analytics route name (`packages/analytics/src/catalog.ts`) before analytics turn on, unless a view of it could signal a mental state or a loss ("If you are struggling", Hidden books), which are never listed (R-G).
- Route names and setting keys are contracts: renaming one updates `isCaptureRoute` and `resilience.test.ts` in the same PR (R-L).
- A Settings row belongs to the section that matches what it changes, not the screen that happens to own the code.
- Anything behind a capability switch says so in the table above.
