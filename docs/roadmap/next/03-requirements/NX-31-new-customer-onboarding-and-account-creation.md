# NX-31: The first run of a new customer, from the App Store tap to the first kept letter, and when the account happens

Readiness: 20 of 28, author's score, `qa` to confirm. Remains: the three founder answers below; the split of #635 (NX-03-R0) lands the Before you begin screen this file starts after; one `mobile` read of `apps/mobile/src/app/onboarding.tsx` for the claims marked UNVERIFIED; counsel on the strings flagged "registered".

Status: draft, 9 Nov 2026 (UTC). Docs only. Written after the founder tested the newest TestFlight build and asked for "core capability gaps as well as new customer onboarding experience for account creation and account management". This file is the onboarding and account-creation half (lane G-3). Account management after sign-up is NX-32, landing and navigation is NX-30 (both written by other agents; this file cites them by working label and copies nothing from them). It assigns no BL, D or CR id and reserves nothing.

| | |
|---|---|
| Working label | NX-31 (working id, see `_CONVENTIONS.md`; the rank-number rule in section 1 of the conventions applies once `product` ranks it) |
| Refines | F03 (first run), F02 (account, sections 4 and 6), F13 (reminder prime, DR-12 B), F17 (app lock), F01 (entry); F03-REQ and F02-REQ ids are cited in the trace table, not changed |
| Builds on, does not re-specify | NX-02 (sign-in methods and session security), NX-03 (Before you begin: age, agreement, region, age signal; PR #635 and its four-part split plan), NX-05 (reviewer sign-in, Apple 2.1(a)), NX-04 and NX-08 (deletion, consent withdrawal), NX-10 (reminders that fit), NX-16 (support route) |
| Tag | EVIDENCE for what the repo contains and what Apple says (sources in section 4). HYPOTHESIS for every timing target and every claim that a step changes behaviour: no parent interview in the repo tests an account-after-letter flow with real families. Targets are labelled "proposed" |
| Size | M in agent PRs; most rows are S. Mostly sequencing and tests on screens that exist |
| Gate | Founder (three answers in section 14; Apple key and Resend SMTP are NX-02's founder steps). Counsel for registered strings (section 10). Apple: 4.8, 5.1.1(iii), 5.1.1(v), 2.1(a) |
| Order | Not ranked. Build 12 is servers-on against production with passwordless sign-in (Build 12 programme; the decision entry is not written yet, gap map section 0 item 1), so this file is needed before Build 12 reaches a stranger |

## 1. What the new customer sees and does, in plain words

They find the app in the store and open it. One short question: are you 18 or older, with the agreement under it (NX-03). They are told what the app is in one screen. They type their child's first name if they want to, pick a birthday or due date, and tap what the child calls them. They are in the book within about a minute. They tap, talk, and read the words back to check them. They keep the letter. The app says it is kept, and offers one thing: an evening reminder, yes or no.

They have not been asked for an email, a name, a password, a phone number, a contact or a photo. Nothing in the app has said "sign in".

The next evening, or after their second kept letter, a card offers to keep the book on any phone: Continue with Apple, or an email and a short code. "Not now" is one tap and the book carries on exactly as before. If they say yes, their letters come with them to a new phone.

A parent who already has a book, on a new phone, taps "I already have a book", answers the age question once on this phone, signs in the same way as last time, and their letters are there. They are never asked to make the child again.

## 2. The journey, screen by screen (new customer, one child, English)

"Ask" means anything the person is asked to agree to, allow or give. The "one action" column is the single thing the screen wants. Screens marked "exists" are on `develop` today (`apps/mobile/src/app/`, `apps/mobile/src/components/`); screens marked "NX-03" are specified there; "new" are specified here.

| # | Screen | Purpose | The one action | Ask on it | Source |
|---|---|---|---|---|---|
| 1 | Before you begin | Adults only; plain agreement | Answer Yes, tick the box, Continue | Age (yes or no only), the Terms and Privacy agreement | NX-03 (exists in part; #635 open) |
| 2 | Welcome | Say what this is in one line | Begin the book | none (also shows "I already have a book" and "I was invited") | exists: `onboarding.welcome.*` |
| 3 | Who is this book for? | Make the book | Pick a birthday or a due date, Continue; the name may stay empty (R3) | Child's first name or nickname (optional), birthday or due date | exists; changed by R3 |
| 4 | What does {child} call you? | Sign the letters | Tap a chip, Continue | A signature | exists: `onboarding.signsAs.*` |
| 5 | Get your words ready | Offer the speech download without blocking | Not now, or Download on Wi-Fi | Download of the speech model (a choice, not a permission) | exists: `speechConsentCopy.*`; F05 |
| 6 | The book is open. | Land | Write the first one | none (R14 removes the lock card from here, if founder answer 3 is yes) | exists: `onboarding.finish.*` |
| 7 | Tonight with the first prompt, then Speak | Record | Tap Speak | Microphone, in context at the first Speak tap (microphone primer, then the OS sheet) | exists; F04 |
| 8 | Review | Check the words | Keep | none | exists |
| 9 | The first-letter moment, then the reminder card | Say it is kept; offer the one habit | Yes, evenings / Pick a time / No reminders | Notifications, only after Yes (R6) | exists: F09, F13 DR-12 B, `onboarding.reminder.*` |
| 10 | (later) Keep the book on any phone | Account creation | Continue with Apple, or email and code; or Not now | Sign-in method; the Terms line is above the buttons (R7, R8) | exists: `authCopy.sheet.*`; timing fixed by R7 |
| 11 | (later) Your book is kept | Confirm and say how to get back | Done | none | new (R10) |

Screens 1 to 9 make up "first run". Nine screens and no account. The target is in section 8.

### Where each ask lives (one table; the ask sequencer in `apps/mobile/src/lib/analytics/ask-sequencer.logic.ts` is the only code allowed to put an ask on screen after screen 9)

| Ask | Where | Earliest | Why there |
|---|---|---|---|
| Age and agreement | Screen 1 | First launch | Law and store rules (NX-03); nothing is stored if the answer is No |
| Child's name (optional), date | Screen 3 | Screen 3 | Prompts and chapters need a date; the name only decorates (R3) |
| Signature | Screen 4 | Screen 4 | Every letter says who wrote it |
| Speech download | Screen 5 | Screen 5 | A choice; never blocks (Apple HIG, section 4) |
| Microphone | First Speak tap | Screen 7 | Asked when it is needed (HIG; 5.1.1(iv)) |
| Reminder card, then the notification permission | After the first kept letter | Screen 9 | The person has just felt the product work (F13 R1-S57 is a vendor case study; see section 4) |
| Sign-in method (account creation) | Keep the book card | Session 2, or right after the second kept letter, whichever is first; always reachable from Settings > Account | Delay sign-in for as long as possible (HIG, section 4); the product already worked |
| Sensitive-data consent | Second screen of the same sign-in moment | After a new sign-in | F02-REQ-010; counsel Q-DX-15 |
| Face ID or passcode lock | A card in the third session, and Settings > Privacy | Session 3 | Not a setup need; needs a book worth locking (R14, founder answer 3) |
| Analytics and crash reports | The third ask, only when switched on | After sign-in is answered | Off in every 1.0 profile (D-124 item 3); opt-in |
| Sharing with a co-parent or family | Family tab; hidden in the store build (D-126) | Not in first run | A second person needs a first letter to read |
| Backup of recordings | Settings; off in every profile today (gap map 1.6) | Not in first run | D-121 order |
| Rating ask | Not in this file | Never in first run | NX-24 owns the timing |

### What we deliberately postpone until after the first letter

The account itself. The Face ID lock. The notification permission. Analytics consent. Sharing and invites. Backup. Languages beyond English while English only is on (build-time list, PR #689, read by title only: UNVERIFIED). The Plus sheet (C-REQ-023, F03 Never). Goals ("what matters to you"; cut by F03 section 6.4). A "tour".

## 3. Why this order

1. **Apple lets us.** App Store Review 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login." Early Letters records, reviews, keeps and exports with no account (NX-02 "Not now keeps the phone fully working"). Sync, sharing and backup are the account-based features, and they are offered when the person has something worth keeping. We do not require registration to reach the core.
2. **Apple says to delay it.** HIG "Managing accounts": "Delay sign-in for as long as possible. People often abandon apps when they're forced to sign in before they can do anything useful." And: "Ask people to create an account only if your core functionality requires it; otherwise, let people enjoy your app or game without one."
3. **Apple 4.8 stays simple.** Sign in with Apple and our own email code are the two methods (NX-02 default: no Google in Build 12). 4.8 applies to apps that use a third-party or social login; our own email account system is exempt, and Apple is offered anyway.
4. **The account is worth more after a letter.** The reasons people give for a sign-in ("your letters come with you to a new phone") are only felt once a letter exists. The repo's own note: habit fade is a likelier loss than a phone lost in the first days (F02 section 1, [R]); that is the spec author's judgement, not a measured result.
5. **The risk this order accepts, stated plainly.** Before the account, the letters live on one phone and in the customer's own iCloud device backup (D-033, status "Recommended"; the copy waits on the founder). A phone lost in the first days loses the book. The first-run screen 9 and the Keep card say where the letters are in true words (the existing `onboarding.promise.recordingBody`: "The recording is kept on this phone"), and the Keep card is never later than the second kept letter.

## 4. Benchmark, with how each source was checked

Checked means: opened on 9 Nov 2026 by this author. Copied means: taken from a repo file that cites it, not re-opened today. UNVERIFIED means no source was opened.

| Source | What it says | Status | Our call |
|---|---|---|---|
| Apple, App Store Review Guidelines 5.1.1(v), https://developer.apple.com/app-store/review/guidelines/ | "If your app doesn't include significant account-based features, let people use it without a login." Account creation requires in-app account deletion | Checked 9 Nov (text read through a page-fetch tool that summarises; the quoted sentences match the page text it returned) | Match: no account on the path to the first letter (R1) |
| Apple 5.1.1(iii) and (iv), same page | Collect only data required for the task; do not "trick, or force people to consent to unnecessary data access" | Checked 9 Nov | Match: name optional (R3); Apple sign-in asks for email only (R9) |
| Apple 4.8, same page | Third-party or social login needs an equivalent privacy-preserving option; not required where the app "exclusively uses your company's own account setup and sign-in systems" | Checked 9 Nov | Match: Apple plus own email; no Google in Build 12 |
| Apple 2.1(a), same page | "include demo account info (and turn on your back-end service!) if your app includes a login"; a built-in demo mode needs prior approval | Checked 9 Nov | NX-05 owns the reviewer path; this file keeps the Keep card reachable from Settings from minute one so a reviewer need not write two letters first (R7) |
| Apple HIG, Managing accounts, https://developer.apple.com/design/human-interface-guidelines/managing-accounts | "Delay sign-in for as long as possible"; "In general, avoid offering an app-specific setting for opting in to biometric authentication" (people turn biometrics on at the system level); account deletion must be offered in the app | Checked 9 Nov (the .md version of the page) | Match the first. The second is about authenticating an account. Our lock guards the book on the phone, not an account; see founder answer 3 |
| Apple HIG, Onboarding, https://developer.apple.com/design/human-interface-guidelines/onboarding | "Postpone nonessential setup flows or customization steps"; "Don't let large downloads hinder onboarding"; request a permission "when people first access the specific function that relies on private data"; "Avoid displaying licensing details within your onboarding flow" (let the store show them) | Checked 9 Nov (the .md version) | Match all. The last one is in tension with screen 1 (the agreement); NX-03 and counsel own it |
| Dearest, Baby Diary: Voice Journal | No account; on-device | Copied from `02-benchmark.md` item 4 and F02 section 5 (R1-S3) | Match the local-first start; our label cannot say "Data Not Collected" once accounts exist (`02-benchmark.md` row 10) |
| Calm, reminder ask right after the first completed session; "40% set a reminder, 3x retention" | Vendor case study; the causal claim is the vendor's | Copied from F13 (R1-S57); not re-opened | Match the placement; do not rely on the number |
| Headspace onboarding quiz: doubled course starts (31% to 63%), no lift in practice days | First-run questions buy first use, not habit | Copied from F03 (R1-S58); not re-opened | Avoid a quiz (R16) |
| Tinybeans: child details optional | Reported +885% completion in a designer's portfolio case study | Copied from F03 (R1-S51); self-reported; not used for any decision | Match the principle only (R3) |
| Duolingo and others put the paywall or account in or after the first lesson | Transcribed screen walkthroughs | Copied from `adjacent-and-ux-benchmarks.md` [B7]; not re-opened | We put Plus nowhere near first run |
| Any conversion-rate figure for "account after value versus account first" | none | UNVERIFIED. No figure is claimed. The order is argued from Apple's rules and the product's shape, and tested on our own cohort (C1) | HYPOTHESIS |

## 5. The states a new customer can be in

### 5.1 Empty, error, offline, lost email

| State | What happens | What the person sees | Source |
|---|---|---|---|
| Airplane mode for the whole first run | Screens 1 to 9 work; the speech download waits for Wi-Fi | Nothing unusual; screen 5's footnote says it waits | R5; F03-U11 |
| Offline when the Keep card is due | The card shows once, says it needs a connection in plain words, "Not now" stays one tap, and it returns next session | `authCopy.errors.network` (exists) | NX-02 offline paragraph |
| Sign-in cancelled at the Apple sheet | Back to the Keep card, nothing recorded as a failure, letters untouched | The card as before | NX-02; `auth_deferred` |
| Email typed wrong | Same screen for known and unknown addresses (NX-02-R3); the code screen offers "Use a different email" (exists: `authCopy.code.differentEmail`) | `authCopy.code.*` | F02-REQ-005 |
| No email arrives | After 60 seconds the code screen offers "Send a new email", "Use a different email" and "Sign in with Apple" side by side; the letters-are-safe line stays visible; support route in Settings (NX-16) | `authCopy.code.resend`, `.resendWait` (exist); new line `authCopy.code.noMailHelp` (R11) | R11; NX-02-R10 drill |
| Hide My Email relay address | Mail must arrive | n/a | NX-02 edge cases |
| Code expired (900 s) | Friendly retry, no second account | `authCopy.errors.expired` (exists) | NX-02 |
| Wrong method on a new phone | "No book here yet. Did you use a different way to sign in last time?" with Try another way and Start a book | `authCopy.noBook.*` (exists) | R12 |
| Empty book after sign-in | Not an error: the person lands on Tonight with the first prompt | exists | R12 |
| Under 18 or "No" on screen 1 | NX-03-R2 stop screen; nothing stored but the time | NX-03 | NX-03 |
| Blocked country (D-131) | NX-03-R7 refusal at sign-up only, never on the on-device book | NX-03 | NX-03 (held) |

### 5.2 Resume after quitting mid-way

Today, "nothing is saved until the final transaction; inputs are lost (under 60 s of input)" (F03-U12). That is acceptable for a name and a date, but it is a bad ending for a parent who typed the name of a baby born last week, got the baby back to sleep, and found the app asking again. R4 changes it: each completed step is kept on the phone, and the app reopens on the first step not completed. The kept values are device-only, class L2/L3 as the child's details already are, and are removed by "Erase everything on this phone" (NX-04). Nothing is sent anywhere.

### 5.3 A returning customer on a new phone

Welcome > "I already have a book" > screen 1 (the age answer is stored on the phone, not synced, so it is asked once on every phone: NX-03 stores a boolean only) > the Keep card's sign-in methods, with the agree line above the buttons > code or Apple sheet > if the account has a book: "Your book is here" with what arrived (R12, R13); if not: the "No book here yet" screen. Never the child step again. The recordings arrive only if the owner's backup is on (off in every profile today, gap map 1.6), and the screen says which it is (R13).

## 6. The check

Tags: EVIDENCE means the behaviour is checkable on the tree or against Apple's text. HYPOTHESIS means it is a claim about customers, tested on cohort C1 with the owner `user-research` and no engineer build row.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-31-R1 | EVIDENCE | Given a fresh install in airplane mode, When the person passes screen 1 and completes screens 2 to 9, Then a letter is kept, 0 sign-in screens appear, 0 requests are made to the hosted project, and Settings > Account shows Sign in. | UNVERIFIED on a hosted-project build: Build 12 flips server features on and no run of the first-run path with servers on exists (gap map 1.1; `eas.json` `production` still writes servers `off` on 8 Nov). The risk is a root gate that waits for a session; `session-provider.tsx` has a 10 second gate timeout (`authCopy.account.gateOffline` comment), so the path must be proven, not assumed. | Apple 5.1.1(v); F02 section 4 |
| NX-31-R2 | EVIDENCE | Given the ask table in section 2, When the first-run path runs on a device, Then asks appear only in that order, and before the first Speak tap 0 OS permission sheets appear, and before the first kept letter 0 notification sheets appear, and in any one session at most 1 card ask appears. | The sequencer exists and has tests (`ask-sequencer.logic.test.ts`), but no test walks the whole path and counts OS sheets; the app lock card (#640) shows at "The book is open." before any letter (S1-131 (a)), which breaks the third clause for the card ask unless R14 moves it. | F02 "every ask in the first 14 days"; F13 DR-12 B |
| NX-31-R3 | EVIDENCE | Given screen 3 with the name field empty and a birthday or due date chosen, When the person taps Continue, Then the book is made with no name, every place that shows the name shows `onboarding.childFallback` ("your child"), 0 errors, and the name can be added later in Settings > the child's book. Given a name typed and no date, Continue still waits and the reason line is shown. | `childrenExtra.nameRequired` ("Add a name to continue.", `strings.en.ts`) and F03-U02 block Continue on an empty name. Whether `onboarding.tsx` or the local `children` table also requires a name is UNVERIFIED (not read); `mobile` reads both first. The fallback string `onboarding.childFallback` exists. Conflict with F03-U02 and F03 section 4: flagged in section 14. | Task decisions on record (see section 14); Apple 5.1.1(iii); F03-U07 |
| NX-31-R4 | EVIDENCE | Given first run quit after screen 3 is completed, When the app is opened again (cold start, any time later), Then it opens on screen 4 with the name and date kept, 0 steps repeat, the age answer is not asked again, and "Erase everything on this phone" removes the kept values. | F03-U12 states the opposite: inputs are lost and the person starts at the child step. | F03-U12 (changed); NX-04 |
| NX-31-R5 | EVIDENCE | Given airplane mode from install to the first kept letter, When the person completes the path, Then screen 5 offers the download as "waits for Wi-Fi", the first letter is kept as a recording and typed or transcribed words per the speech state, and 0 screens show an error. | UNVERIFIED on a device with servers on (R1 reason); the offline first run exists for the on-device build (F03-U11, Maestro "Airplane test" named, run state not read). | F03-U11; B-NFR-009 |
| NX-31-R6 | EVIDENCE | Given the first kept letter, When the first-letter moment closes, Then the reminder card is the only ask in that session; Yes, evenings asks the OS for notification permission once; No reminders asks for nothing and the OS sheet never appears; after a refusal at the OS sheet, the reminder card is not shown again. | The card and sequencing exist (F13 DR-12 B, `onboarding.reminder.*`, `reminder_prime_shown` source `first_letter` in the catalog). Not proven end to end on a device after a first run in the Build 12 profile. Timing and content of reminders are NX-10's; only the placement is here. | F13-REQ-023; NX-10 |
| NX-31-R7 | EVIDENCE | Given a phone with no account, When the person's second letter is kept, or a second session starts after at least one kept letter, whichever is first, Then the Keep card shows once; Not now returns it at most once per calendar day and never in the same session as another ask, never during recording, review or export, and not after the third kept letter more than once more. Given a brand new install, Then Settings > Account > Sign in is reachable from the first minute. | The re-offer rule is in F02 (6.1) and the sequencer; the entry from Settings exists (`authCopy.account.signedOutTitle`). No test proves the "second letter or second session, whichever first" tie-break on a device. | F02-REQ (entry rules); Apple 2.1(a) via NX-05 |
| NX-31-R8 | EVIDENCE | Given the Keep card, Then it shows Continue with Apple and Sign in with email at equal weight, no password field, no name field, no phone field, the versioned Terms and Privacy line directly above the buttons, and no second "are you 18 or older" question for a phone that already passed screen 1; at AX5 0 lines clip. | `authCopy.consent.age` ("Are you 18 or older?") exists in `auth.en.ts` as a sign-in-time question; whether it still shows after Before you begin is UNVERIFIED and NX-03's to settle. The agree line above the buttons was not found by search (NX-03-R3). | NX-03-R3; D-138 item 3; Apple 5.1.1(iii) |
| NX-31-R9 | EVIDENCE | Given Sign in with Apple, When the app requests the authorization, Then the requested scopes are the email only (no full name), and a Hide My Email address is accepted as the account email. | UNVERIFIED: which scopes `apps/mobile/src/lib/auth/apple.ts` requests was not read. If the full name is requested today, the request is removed: the product never uses a parent's name. | Apple 5.1.1(iii); F02-REQ-006; LEGAL-REQ-012 |
| NX-31-R10 | EVIDENCE | Given a sign-in that succeeds, When the claim and consent steps are done, Then one confirmation shows the method and the masked email, the count of letters kept (a count of what exists, never of what is missing), and one sentence on how to get back in on another phone ("sign in the same way"); Done returns to where the person was. | The pieces exist (`authCopy.claim.*`, `authCopy.account.signedInWith.*`, `authCopy.sheet.lastMethod.*`); no confirmation screen joins them. The count of letters kept must not be shown as a goal or a gap (R16). | F02-REQ-019 |
| NX-31-R11 | EVIDENCE | Given the code screen, When 60 seconds pass with no code entered, Then "Send a new email", "Use a different email" and "Sign in with Apple" are shown together with the line that letters are safe, and a link to Help; tapping Not now closes without penalty. | `resendWait` ("You can send another in a minute.") exists; no screen offers the three recoveries together, and the recovery drill for "lost my phone and my email" is NX-02-R10's (HYPOTHESIS). | NX-02-R10; NX-16 |
| NX-31-R12 | EVIDENCE | Given a new phone, Welcome > "I already have a book" > screen 1 > sign in as for the existing account, When the account has a book, Then 0 child steps, 0 signature steps and 0 reminder or lock cards appear in that session; the person lands on Tonight for the book that arrived. When the account has no book, Then `authCopy.noBook.*` shows. | Merged in code, never run across two phones on a hosted project (NX-02-R9 says the same for links). | F02-REQ-002; gap map 1.5 |
| NX-31-R13 | EVIDENCE | Given a new phone signed in to an account whose recordings are not backed up, When the book arrives, Then the screen says in plain words that the words arrived and the recordings are still on the old phone, and gives no promise of audio. Given backup on, Then it says the recordings are arriving and shows them as they land. | The backup is off in every profile on 8 Nov (gap map 1.6); whether the app already tells a new phone which recordings are missing is UNVERIFIED. Without this row the Keep card's true claim "your letters come with you" is half true for audio. | D-033; F08 |
| NX-31-R14 | EVIDENCE for placement; the decision is the founder's | Given a new install, When the person reaches "The book is open." Then no lock offer is shown; Given the third session or Settings > Privacy, Then the lock card is shown once, "Not now" is final for 30 days, and the lock itself behaves as S1-131 describes. | Build 11 shows the lock card at "The book is open." (S1-131 (a)). Held on founder answer 3. | F17; F03 section 4 Never |
| NX-31-R15 | HYPOTHESIS | Given 10 scripted first runs on an iPhone SE 3 (Maestro) and then C1 families, When the time from first launch to the first kept letter is measured, Then the median is 90 seconds or less (F03 target, itself [A]), and screens 1 to 5 together take 45 seconds or less (proposed), and the number of taps before the Speak button is 14 or fewer (proposed). Owner: `user-research`. Test: none, study. | No measurement exists; F03's table says "Maestro on SE 3 with 10 scripted runs" and the field bucket `time_to_first_letter` exists in the catalog. | F03 section 3 |
| NX-31-R16 | EVIDENCE | Given every string a new customer can see in screens 1 to 11, When the content rules test runs, Then 0 strings contain a streak, point, badge, count of gaps ("you have not written"), countdown, "only N free", "don't lose" or any fear, guilt or loss wording, and 0 strings say a machine writes or shapes their words. | `packages/content/test/rules.test.ts` enforces the character and word rules; no test enumerates this path's keys, so a new key can be added to the path unchecked. | CLAUDE.md content rules |

Counts shown to the person: only the number of letters kept (R10), and only on the confirmation. Never a streak, never a gap, never a total owed.

## 7. Door lines (COORDINATION section 10; PRIV-R21)

Each ask that a person agrees to or allows, in the order they appear. Strings flagged "registered" change only with counsel and a disclosures version bump in the same PR (`COUNSEL_LOCKED.md`).

### Screen 1: age and agreement (NX-03 owns the words)
**Shown:** `ageGate.*` and the agreement line. **Records:** the yes or no and the agreement act per PRIV-R21; never a birth date. **Never:** a preselected answer. **Decline and withdraw:** No stops with nothing stored beyond the time.

### Screen 3: the child's details
**Shown:** `onboarding.child.*` (title, name label, placeholder "First name, or a nickname", birthday or due date). **Records:** the name if typed (as typed, any script, never transliterated), the date, on the phone. Kept values for resume (R4) are the same fields, same place. **Never:** a surname, a photo, a location, a contact, gender (F03 Never; LEGAL-REQ-012). **Decline and withdraw:** leave the name empty; edit or remove in Settings > the child's book; erase everything on this phone (NX-04).

### Screen 9: reminders
**Shown:** `onboarding.reminder.*` (exists; words by `content`). **Records:** the chosen time on the phone; the OS records the permission. **Never:** a reminder that quotes the child's name by default (names off by default, D-025), a nudge after a refusal, a count of missed days. **Decline and withdraw:** No reminders asks nothing; Settings > Reminders turns them off in one tap; the OS Settings stays the final control.

### Screen 10: Keep the book
**Shown:** `authCopy.sheet.titles.first_letter`, `.bodies.first_letter`, `.privacy`, `.why`, `.emailUse` (exist; `privacy`, `why` and `emailUse` are registered, in-app-disclosures 3a, `en.trust.signIn.*`), the Terms and Privacy line directly above the buttons. **Records:** a sign-in act through `record_policy_act` (NX-02), the sensitive-data consent as its own act (F02-REQ-010). **Never:** a password, a name, a phone number, contacts, an advertising id, a Plus sheet in this card (F02-REQ-009 Rev, D-036). **Decline and withdraw:** Not now keeps the whole app working; sign out and delete account stay in Settings (PRIV-R09; Apple 5.1.1(v); NX-04).

### Third session: the lock
**Shown:** the S1-131 card ("A lock for {child}'s book", Turn on / Not now; the system Face ID sheet carries Apple's own usage string). **Records:** a device setting only. **Never:** our own PIN (F17: the lock uses the device's Face ID or passcode only), a server record. **Decline and withdraw:** Not now; Settings > App lock; the book opens normally if the phone has no passcode.

## 8. The time to the first kept letter

Targets are proposed (HYPOTHESIS) except the F03 median, which is a PRD target itself marked [A].

| Measure | Target | How | Owner |
|---|---|---|---|
| First launch to first kept letter, median | 90 s or less (F03 section 3; [A]) | 10 scripted Maestro runs on an iPhone SE 3; field bucket `time_to_first_letter` for consenting families | `qa`, `user-research` |
| Launch to the Speak button | 45 s or less (proposed) | Same runs | `qa` |
| Taps before Speak | 14 or fewer (proposed). Count: age Yes, tick, Continue (3); Begin (4); date, 2 taps (6); Continue (7); chip, Continue (9); speech Not now (10); Write the first one (11); Speak (12); microphone primer Continue and OS Allow (14). Name and signature typing add 0 taps if the name is skipped | Counted on the screens, not measured | `design-systems` |
| Screens 1 to 5 interactive | 300 ms p95 (F01 and B-NFR-008) | Perf run | `mobile` |
| Keep card to signed in, Apple | p90 3 s after the OS sheet closes (A-NFR-004) | NX-02 | `mobile` |
| Sign-in mail arrives | p95 2 minutes (NX-02); p90 30 s (A-NFR-004) | Resend logs | `ops` |

Why 14 taps and not 8: the age question, the agreement tick, the date and the two OS-level permissions are not ours to remove. Cutting the signature step to a skip would save 2 taps and would put a blank "From" on letters; that is not recommended.

## 9. What we reject, and why

| Pattern | Why not |
|---|---|
| Account before the first letter, or a skippable "Create account" on Welcome | Apple HIG says delay it; the person has not felt anything work yet |
| A forced name, phone number, contacts or a photo at sign-up | LEGAL-REQ-012 never collects them; 5.1.1(iii) |
| A password, or a "forgot password" path | D-054; NX-02 Never |
| Streaks, points, badges, "you have written 3 of 30" | CLAUDE.md content rules |
| Counting gaps ("you missed 4 days"), or a quiet "we miss you" | Same; also guilt language |
| "Don't lose your memories" or any fear or loss wording on the Keep card | Same; the Keep card says what is true: letters come to a new phone |
| A quiz or goals in first run | F03 6.4; Headspace evidence (copied) |
| A tour of the tabs before the first letter | HIG "Teach through interactivity" |
| A notification or lock prompt before the first kept letter | HIG; F03 Never; K-02 |
| Plus or a price in first run | C-REQ-023, F03 Never |
| Showing "n letters free" before the person has a letter | Counting a limit is counting a gap |

## 10. Copy needs (packages/content)

Words are by `content` and reviewed against `VOICE.md` and the content rules; none is proposed here. Parent vocabulary only: "book", "letter", "kept", "sign in". Never "entry", "take", "draft", "sync", "account holder". Never gender the child; use `{child}`, with the existing `onboarding.childFallback` ("your child") when no name was typed.

| Key | Status | Used by |
|---|---|---|
| `onboarding.welcome.*`, `onboarding.child.*`, `onboarding.signsAs.*`, `onboarding.finish.*`, `speechConsentCopy.*` | exists | screens 2 to 6 |
| `onboarding.childFallback` | exists | R3 |
| `onboarding.child.nameOptionalHelp` | new (a short line under the name field that says it can be added later; replaces the "Add a name to continue." reason for this case) | R3 |
| `onboarding.reminder.*` | exists | R6 |
| `authCopy.sheet.*`, `authCopy.email.*`, `authCopy.code.*`, `authCopy.errors.*`, `authCopy.noBook.*`, `authCopy.claim.*`, `authCopy.account.signedInWith.*` | exist | screens 10, 11 and states |
| `authCopy.sheet.privacy`, `.why`, `.emailUse` | exist; registered, word for word, counsel only | screen 10 |
| `authCopy.code.noMailHelp` | new | R11 |
| `authCopy.kept.title`, `.body`, `.howToGetBack`, `.lettersKept` (count) | new | R10 |
| `authCopy.newPhone.arrivedWords`, `.arrivedWithRecordings` | new | R13 |
| `onboarding.resume.*` | new only if a one-line "Picking up where you left off" is wanted; otherwise none (the screen simply opens) | R4 |
| `appLock.offer.*` | exists in the app-lock PR (name and namespace not read; UNVERIFIED) | R14 |

Registered strings touched: none by this file. The agree line and the Terms and Privacy links belong to NX-03 and counsel.

## 11. Analytics (opt-in, content-free, names only; off in every 1.0 profile, D-124 item 3)

Existing, in catalog: `auth_sheet_shown`, `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `auth_deferred`, `signed_out`, `reminder_prime_shown` (source `first_letter`), `reminder_prime_result`, `os_permission_result`, `keep_gate_shown`, `letter_saved`, `child_added`, `analytics_opted_in` (carrying the `time_to_first_letter` bucket). New, not in `packages/analytics/src/catalog.ts` (checked 9 Nov), so add each to the catalog and `docs/analytics/TRACKING_PLAN.md` in the same PR: `first_run_resumed` (no properties; R4). Nothing about names, dates, emails or letter text. The No answer on screen 1 is never sent (NX-03). The allowlist test fails on any property. Sends nothing in 1.0.

Content check that applies to everything above: no entry text, transcript, audio or child name in analytics, logs or crash reports (CLAUDE.md privacy rules). The child's name is optional (R3); when absent the stored value is empty, not a placeholder that looks like a name.

## 12. Device rows

Rows are placeholders until `qa` assigns ids. Scan on 9 Nov of the patches of the 41 open PRs listed by `gh api repos/.../pulls?state=open` found S1-110, S1-111, S1-112 (#635), S1-131, S1-132, S1-133, S1-134, S1-135, S1-140, S1-144, S1-150 to S1-152 in use or claimed, so `qa` picks above S1-152 or fills gaps. Not assigned here.

| Placeholder | Steps | Proves |
|---|---|---|
| D31-1 | Fresh install, airplane mode, complete first run, keep a letter; open Settings > Account | R1, R5 |
| D31-2 | Same with the name left empty; read every place the name shows | R3 |
| D31-3 | Quit after screen 3 and after screen 4; reopen cold | R4 |
| D31-4 | Count OS sheets across the path; confirm none before Speak and none for notifications before the first kept letter | R2, R6 |
| D31-5 | Keep a second letter; Keep card shows once; Not now; relaunch; card not shown the same day | R7 |
| D31-6 | Keep card at AX5 and VoiceOver; read order | R8 |
| D31-7 | Apple sheet: confirm what it asks for; Hide My Email address | R9 |
| D31-8 | Sign in; read the confirmation | R10 |
| D31-9 | Request a code, wait 60 s, use each recovery | R11 |
| D31-10 | Two phones: sign in on the second as the first | R12, R13 |
| D31-11 | Stopwatch the whole path on an SE 3, 10 times | R15 |
| D31-12 | Third session: lock card once; Not now | R14 |

## 13. Rollout, owners, gate

| Step | What | Owner lane | Switch and off behaviour |
|---|---|---|---|
| 1 | R3 (name optional), R4 (resume), R16 (key list test): on-device, small, no server | `mobile`, `content` | None needed; behaviour is local. Rollback: revert the PR |
| 2 | R2, R5, R6, R7 proofs on the Build 12 profile; R14 move if approved | `mobile`, `qa` | The Keep card is behind the server-features capability; off means no card and sign-in only from Settings |
| 3 | R8, R9, R10, R11: Keep card content and confirmation | `mobile`, `design-systems`, `content`, `security-architect` for R9 | Same switch |
| 4 | R12, R13: the new phone path | `mobile`, `sync` | Needs a hosted project (theme 1) and two phones |
| 5 | R15 measurement, then C1 cohort comparison of the order | `qa`, `user-research`, `analytics` | Study; no engineer row |
| Reviewer path | NX-05 | `ops`, founder | Separate |

Gate: founder reads section 14 and answers three questions; Build 12 does not go to a stranger until R1 and R12 have a device run with servers on. Counsel for any registered string. No row here touches `supabase/` or auth code, so the agent fence (D-041) is not triggered by this file; R9 touches auth code and needs a counted second review.

Engineering block lines that apply: API contract none (no new type). Schema: none expected; R3 may need the local `children.name` column to accept empty (UNVERIFIED, `mobile` reads `apps/mobile/src/lib/db` and the sync contract for `create_first_run_children`, which today may require a name); if the server function requires a name, that is a server change and a new migration with grants, and R3 waits for it only for the signed-in sync path. Data class: child name L4 (as today), kept resume values L2/L3 on the phone only. Accessibility: AX5, VoiceOver order, 44 pt targets, Reduce Motion fade only, on screens 3, 10 and 11 at least.

## 14. Founder-only decisions (three), with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | When does a new customer create an account? | **A.** After the second kept letter or the second session, always reachable from Settings (today's spec, F02 DR-12 B). **B.** Right after the first kept letter. **C.** Before the book is opened. | **A.** It satisfies 5.1.1(v) and the HIG advice to delay sign-in with no argument, keeps first run under the 90 s target, and Build 12's servers-on build still has the card. B is acceptable and shortens the unprotected window. C is not recommended: it adds a sign-in wall in front of the first value and risks a 5.1.1(v) finding because the core works without it. The cost of A is the unprotected window in section 3 item 5. The cohort test (C1) can compare A and B (F13 R7 already names the comparison) |
| 2 | May the child's name stay empty at first run? (I found no D entry that says so; this brief states it as on record. The repo points both ways: `onboarding.childFallback` exists and F03-U07 accepts placeholders, while F03 section 4 and F03-U02 require 1 to 60 characters.) Should the date also be skippable? | Name: required / optional. Date: required / skippable | Name optional, as the brief says. Date required: prompts, chapters and Before You depend on it, and "Not here yet" with a due date already covers the unknown birth. Founder confirms in `DECISIONS.md`, which edits F03-U02 |
| 3 | Move the Face ID lock offer off "The book is open." to the third session and Settings? Also: keep the reminder card as the only ask after the first letter? | Keep as built in Build 11 / move | Move. A lock offer before a letter exists asks the person to protect nothing and spends the one-ask-per-session allowance that F13's research puts on the reminder. The HIG advice against an app-specific biometric opt-in is about account authentication; our lock is a book lock, so it can stay, but it should not be a first-run step. If the founder likes the lock card where it is, R2 and R14 reduce to "the lock card and the reminder card are in two sessions" |

## 15. What the founder should test on his phone (one page)

Use a phone or simulator with no previous install (delete the app first). Airplane mode on for steps 1 to 10. Judge the feeling, not the code. Write one word per step: smooth, slow, odd, or stuck.

1. Install. Open the app. Time it from now (start a stopwatch at the first screen). Is the first question clear? Answer Yes, tick the box. Did the Terms and Privacy links come back to the same place?
2. Welcome. Read the one line. Is it clear what this is?
3. Child. Type nothing in the name. Pick a birthday. Continue. (Expected after R3: it goes through. Today: it asks for a name. Either way, write which.)
4. Signature. Tap one chip. Continue.
5. Speech. Tap Not now. Is the note about Wi-Fi honest and short?
6. "The book is open." Is there a lock card here? (Today yes in Build 11; with R14, no.) Did you want it here?
7. Tonight. Tap Speak. Did the microphone question come only now?
8. Talk for 20 seconds. Read the words back. Keep. Stop the stopwatch at "kept". Write the number. Target: 90 s or less.
9. After the kept moment: the reminder card. Tap No reminders. Did any system pop-up appear? (Should be none.) Quit the app.
10. Reopen. Is the book as you left it? Go to Settings > Account. Is there a way to sign in? Is there a way to delete the account? (Delete shows only when an account exists.)
11. Switch airplane mode off. Write a second letter. After keeping it: does the "keep the book on any phone" card appear once? Tap Not now. Close and reopen: does it stay away for the day?
12. Settings > Account > Sign in. Is it Apple and email at equal weight? Is the agreement line above the buttons? Does anything ask your name, your phone or your child's name again?
13. Continue with email. Enter an address. Look for the mail. If it takes over a minute, what does the screen offer?
14. Sign in. Is there a screen that tells you how many letters were kept and how to get back in on another phone? Does it ever say a number you have not written, or what you missed?
15. A second phone (or delete and reinstall): Welcome > I already have a book. Age question once. Sign in the same way. Did it ask for the child again (it must not)? Did the recordings come, or does the screen say so?
16. Count the screens and the taps from install to the first kept letter. Is any step one you would remove? Write it down: that is the best input to answer 1 and 3 above.

Stop and note if at any point you were asked to sign in before step 11 without choosing to.

## 16. Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-31-R1 | F02 section 4; Apple 5.1.1(v) | Maestro flow (proposed `apps/mobile/e2e/first-run-no-account.flow.yaml`); `[NX-31-R1] first run reaches a kept letter with no sign-in and no request to the hosted project` | D31-1 |
| NX-31-R2 | F02 ask table; F13-REQ-023 | mobile unit on the ask table (proposed `apps/mobile/test/first-run-ask-order.test.ts`); `[NX-31-R2] asks appear in table order with 0 OS sheets before Speak and before the first kept letter` | D31-4 |
| NX-31-R3 | F03-U02 (changed), F03-U07 | mobile unit (extends `apps/mobile/test/onboarding*.test.ts`; exact file UNVERIFIED); `[NX-31-R3] an empty name with a date creates the book and shows the fallback` | D31-2 |
| NX-31-R4 | F03-U12 (changed) | mobile unit on the first-run store (proposed `apps/mobile/test/first-run-resume.test.ts`); `[NX-31-R4] a cold start after step 3 opens on step 4 with the values kept` | D31-3 |
| NX-31-R5 | F03-U11 | Maestro airplane flow (same file as R1); `[NX-31-R5] first run works in airplane mode` | D31-1 |
| NX-31-R6 | F13-REQ-023 | mobile unit (extends `apps/mobile/src/lib/analytics/ask-sequencer.logic.test.ts`); `[NX-31-R6] reminder card is the only ask after the first kept letter` | D31-4 |
| NX-31-R7 | F02 re-offer rule | unit on the sequencer (same file); `[NX-31-R7] Keep card on second letter or second session, whichever is first, once a day` | D31-5 |
| NX-31-R8 | NX-03-R3; D-138 item 3 | mobile unit (proposed `apps/mobile/test/keep-card.test.ts`); `[NX-31-R8] Keep card has equal methods, no name or phone field, agree line above, no second age question` | D31-6 |
| NX-31-R9 | F02-REQ-006; 5.1.1(iii) | unit on the Apple request (proposed `apps/mobile/test/apple-scopes.test.ts`); `[NX-31-R9] Apple request asks for email only` | D31-7 |
| NX-31-R10 | F02-REQ-019 | mobile unit (proposed `apps/mobile/test/kept-confirmation.test.ts`); `[NX-31-R10] confirmation shows method, masked email and letters kept` | D31-8 |
| NX-31-R11 | NX-02-R10 | mobile unit (proposed `apps/mobile/test/code-screen-recovery.test.ts`); `[NX-31-R11] after 60 seconds three recoveries are shown` | D31-9 |
| NX-31-R12 | F02-REQ-002 | device, 2 phones; `[NX-31-R12] new phone sign-in shows no child step` | D31-10 |
| NX-31-R13 | D-033; F08 | device, 2 phones; `[NX-31-R13] new phone says which recordings arrived` | D31-10 |
| NX-31-R14 | F17; F03 Never | mobile unit (proposed `apps/mobile/test/app-lock-offer-placement.test.ts`); `[NX-31-R14] no lock offer in first run; offered once in session 3` | D31-12 |
| NX-31-R15 | F03 section 3 | study, minutes recorded in the QA report; Test: none, study (`user-research`) | D31-11 |
| NX-31-R16 | CLAUDE.md content rules | content test (proposed `packages/content/test/first-run-keys.test.ts`); `[NX-31-R16] first-run and Keep card keys have no streak, count of gaps, fear or loss wording` | none |

Trace: NX-31-R1..R16 -> F01, F02-REQ-002, -006, -009, -010, -019, F03-U02, -U07, -U11, -U12, F13-REQ-023, F17, LEGAL-REQ-012, D-025, D-033, D-054, D-124, D-138.

## 17. Conflicts and open points with other work

1. **PR #635 and its split plan (NX-03).** No conflict in the screens. One reading to settle: NX-03 says that on Yes "the sign-in buttons appear with the agreement line directly above them". This file reads that as the Keep card and the "I already have a book" path, not as a sign-in wall on the way into a new book (R1). If the founder intended a wall, answer 1 is C. The split does not change this; the age answer is a root boot gate (D-026), so the order of Welcome and screen 1 stays as on `develop` (the Welcome-first order is held for counsel, D-109).
2. **Build 12 lane.** Build 12 flips server features on. R1 and R5 must be proven on that profile; no such run exists. The Build 12 gap map lists the demo-account problem (2.1(a)) as not designed; NX-05 owns it; R7 keeps Settings > Account reachable so a reviewer need not write letters first.
3. **F03-U02 and F03 section 4** say the name is required; R3 and answer 2 change that. **F03-U12** says first-run inputs are lost on quit; R4 changes that. Both are edits to F03, done by `product` only after the founder's answer.
4. **Build 11 (#640)** shows the lock card at "The book is open."; R14 moves it if the founder agrees.
5. **`authCopy.consent.age`** may ask the age again at sign-in; NX-03 and R8 say it must not for a phone that passed screen 1.
6. **D-033 copy ("only on this phone")** still waits on the founder; the Keep card's claim and the section 3 item 5 risk rest on it.
7. **Not in this file:** account management (NX-32), navigation and landing (NX-30), the reminder schedule and back-off (NX-10), deletion (NX-04), consent withdrawal (NX-08).

## 18. Not verified

Whether `onboarding.tsx`, the local `children` schema or `create_first_run_children` accept an empty name. Which scopes `apps/mobile/src/lib/auth/apple.ts` requests. Whether `authCopy.consent.age` still shows after Before you begin. What PR #689 does to the languages step (title only). The key names the app-lock PR uses. Any conversion figure comparing account-first with account-after-value. Whether the sign-in methods and servers-on build will behave on a hosted project at all (S-52 FAIL on 8 Nov). The Apple pages were read through a fetch tool on 9 Nov 2026; a reviewer's reading can differ from the text quoted.
