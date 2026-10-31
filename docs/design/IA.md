# Information architecture

The map of every place in the iOS app and what each is called. Visible names are the exact words a parent sees; the glossary for those words is `packages/content/BRAND.md`. Read on `develop` at fa37032 (31 Oct 2026). Naming findings and rulings: [NOMENCLATURE_AUDIT_2026-10-31.md](NOMENCLATURE_AUDIT_2026-10-31.md).

## Builds and switches

Three builds show different trees. The switches live in `apps/mobile/src/lib/capabilities.ts` and the EAS profiles in `apps/mobile/eas.json`.

| Build | Profile | Server features | Languages | Family surfaces |
|---|---|---|---|---|
| Alpha build 1 (TestFlight) | `testflight` | off | all that passed their gate | "Coming soon" screens today; hidden once the D-126 change lands after the go/no-go |
| Alpha build 2 | `preview` | on | all that passed their gate | the full co-parent screens |
| First store build (1.0) | `production` | off | English only (D-121, CR-16) | hidden (D-126) |

Every tree below is the first store build unless marked.

## Tabs

| Tab | Route | What it is for | Heading |
|---|---|---|---|
| Tonight | `/` | Start today's letter | A greeting, then the prompt |
| Book | `/book` | Read and hear what is kept | "{child}'s book" |
| Family | `/family` | Build 2 and later only (D-126). Build 2: "Who writes to {child}" | |

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

| Section | Row | Opens |
|---|---|---|
| - | Plan (stays; the Terms name "Settings, Plan", ruling R-C) | Plus status, manage subscription, restore, redeem a code, request a refund, terms |
| Children | each child's name | "{child}'s book": name, birthday or due date, "Sign my letters to {child} as", reminders for this child, "Hide this book" |
| Children | Add a child | the first-run form |
| Children | Hidden books (only when one is hidden) | "Show this book again" |
| Writing | Spoken language | English only in the store build |
| Writing | Reminders | how often, which evenings, time, month and birthday messages, names in notifications |
| Writing | Appearance | theme; reading size |
| Your data | Privacy | what we never do; the policy and terms |
| Your data | Export your book | export everything |
| Your data | Recently deleted | 30 days, Restore, Erase now |
| Your data | Recordings | kept on this phone; recordings without a letter; per-language speech downloads; "How transcription works" with the Word for word switch (to become section "Word for word" with "Show spoken letters", ruling R-A) |
| Your data | Storage | downloads and space used |
| Help and legal | Help, If you are struggling, Terms of Service, Privacy Policy, Licenses | |
| About | Version | "Early version" note |

Build 2 adds Account (sign-in methods, devices, sign out), "Back up my recordings", and Delete account when its switch is on (D-129).

## Rules for adding a place

- A new tab needs a decision entry; the store build has two.
- A new screen gets a route, a visible name from `packages/content`, a row in this file, and an analytics route name (`packages/analytics/src/catalog.ts`) before analytics turn on.
- A Settings row belongs to the section that matches what it changes, not the screen that happens to own the code.
- Anything behind a capability switch says so in the table above.
