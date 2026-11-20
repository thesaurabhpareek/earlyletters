# 01. Experience content map: every place a parent reads words, from install to year five

Status: PROPOSED, 20 Nov 2026. Owner: `content`. Part of the lifecycle playbook (README.md, this file, 02-email-lifecycle.md, 03-in-app-and-reminder-logic.md, 04-events-and-festivals-usa.md, 05-backlog-proposed.md). Docs only: this file changes no string, no card, no test. Every line of copy in it is PROPOSED until the founder approves it (G3), and each one carries a content key.

Read with: `packages/content/VOICE.md`, `BRAND.md` (glossary and the CR-25 internal-terms table), `packages/content/test/rules.test.ts`, `docs/design/IA.md`, `docs/design/e2e/INDEX.md` (screen ids), the five area `WORDS.md` files in `docs/design/e2e/`, `docs/content/words-packet-20nov.md`, and the locked pack errata (`docs/product/prd/18-errata-after-lock.md`, E45, E75 to E82).

## 0. What this file is, and what it is not

It is the one list of the places a parent reads words, with the key, the line (or the brief for the line), the tone rule, what the place must never say, and where the words live today. It is an index into work that already exists, not a second copy of it. Where an area `WORDS.md` already holds the proposed words for a screen, this file points there and says the status; it writes new words only where nothing exists.

It is not the logic of when reminders fire (that is 03-in-app-and-reminder-logic.md), not the list of festivals and days (04-events-and-festivals-usa.md) and not the email lifecycle (02-email-lifecycle.md). Where a surface belongs to one of those, the row here gives the key and a pointer.

What I could not do in this run, so no row relies on it:
- The Project docs (`proposals/*`) were not reachable from this session: there is no Projects tool here. Nothing below cites them.
- I ran no app, no device and no test suite (no `npm install`, by instruction). Test names are read from the repo, not run. A row that says "tested" means a test exists that reads the key, not that I saw it pass.
- I did not read all of `strings.en.ts` line by line. I read the group headings, the groups named in rows below, and the lines I quote. A line I did not read is not claimed to be clean.
- Outside facts (store rules, law) are cited to the repo document that cites them, and marked UNVERIFIED where that document says so. Legal readings end "counsel must confirm".

## 1. The rules every row obeys

| Rule | Source | What it means for a row |
|---|---|---|
| The machine may remove and repair, never add meaning. No feature writes, rewrites, summarises or shapes a person's words | `CLAUDE.md` constitution | No line in this map describes a letter, summarises a day or guesses at feeling. A line may invite; it never reports what a parent said |
| No generated text in any notification or email | NS-13-R24, NS-48 | A notification or email line is a `packages/content` key, filled only with a weekday, a month number or a child name. Never a sentence made at send time |
| ASCII only. No em or en dash, curly quote, ellipsis character or emoji | `rules.test.ts` "characters" | Hyphen and "to" only |
| No fear, guilt or loss language; legacy is love and time, never endings | `VOICE.md`, `rules.test.ts` | "for years", "again and again", "one day {child} can hear". Never "before it is too late", "slipping away", "no longer" about a person's letters |
| Never gender the child | `rules.test.ts` | `{child}`. In a neutral line, "your little one" |
| Celebrate what exists; never count gaps; no streaks, points, badges | `VOICE.md` | A total of letters that exist may be said. A run, a gap, "days since" and a comparison never |
| Parent-facing words come from the BRAND.md glossary | CR-25 | letter, note, recording, your words, small fix, month, book. Never take, entry, draft, pack, transcript, chapter |
| Notifications: at most one exclamation mark a month; the rules test gives notifications none | `VOICE.md`, `rules.test.ts` | No exclamation mark in any notification or email line |
| No server push in 1.0 | E79, LEGAL-REQ-054 | Every notification line in this map is a local reminder. Nothing says or implies a push from us |
| Lock screen, names off (the default) or App lock on: no age, month number, count of months or years, or "A year of letters." | E82, NS-32-R12 | See section 12 and the Proposed change box there |
| 60 notifications in total, one a day across books | NS-32 | A line never assumes a second message on a day |
| The public name comes only from `packages/brand` | CLAUDE.md | Written `{app}` in a line; filled from `brand.name` |
| A line promises only what the build does | `VOICE.md` "Saying what the product does today" | A row for a feature behind a flag says so in the Source column |

## 2. How to read the tables

Columns, in order: **Surface** (id, and the IA place: Home, Book, Me, or a screen off the tabs); **Trigger** (what puts the words in front of the parent); **Key** (the path the rules test reads; `en.` is `strings.en.ts`, `authCopy`, `billingCopy`, `reminderCopy` and the others are the feature files in `packages/content/src/features/`); **Line or brief** (a built line is quoted and marked BUILT; a proposed line is marked PROPOSED; a brief says what the line must do); **Tone**; **Never says**; **Source today** (file and line on develop at `e68541d`, a `WORDS.md` section, or "missing").

Status words used in the Source column:
- **BUILT**: the key is in `packages/content` on develop and under the rules test.
- **PROPOSED (file)**: the words are written in the named `WORDS.md` or packet, not in `packages/content`. Nothing is live.
- **missing**: no key and no written words. The row carries a brief or a PROPOSED line.
- **pointer**: owned by another lane (marketing, legal, design-systems); this file only names the place.

Screen ids (A-S01, D-S10, E-S25 and so on) are the ids in `docs/design/e2e/INDEX.md`. A row for a flagged feature (photo with a letter, Find, Share, Firsts, Days, co-parent) is live only when its flag is on; the row says so.

## 3. Before install: store and website (pointers only)

The store page and the website are owned by `marketing` and `legal` for plans and claims. This file records the places and the content rule; it does not write them.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 3.1 App Store name and subtitle (E-S27) | A person finds the app | `brand.storeName`, `brand.subtitle` (from `packages/brand`) | BUILT: "Early Letters: Baby Journal", "For parents who'd rather talk" (BRAND.md naming system). "Journal" is allowed here for search only | Plain | "Memory Book" in the name (retired, D-139); another platform; "beta" | `packages/brand/index.ts`; `store.en.ts:44`; pointer |
| 3.2 App Store description, promotional text, keywords, what's new | Same | `storeListing.*` | BUILT. The description's first line is the descriptor "letters to your child, in your own words and voice" | Warm, calm; adults only | "kids"; "AI"; "print" or "order a copy"; "early access", "preview"; a claim with no claims-registry row; a countdown or a price not from StoreKit | `store.en.ts`; tests: length limits, `claims-capabilities.test.ts`, "adult audience", "digital only", "Apple platforms only" |
| 3.3 Screenshot captions | Same | none yet | Brief: captions are text in the description too (accessibility), show Asha and seasonal days only, never a faith day or a made-up tradition (NS-46-R47) | Quiet | A tradition, a faith greeting or a real family on a frame (Q-FD-28) | Card 21 section 15; pointer to `marketing` |
| 3.4 App Review notes and TestFlight "What to test" | Review and testers | `appReviewCopy`, `testflightCopy` | BUILT | Factual | "beta" outside TestFlight; calling the Days ask a question about religion (Q-FD-28) | `release/app-review.en.ts`, `release/testflight.en.ts`; tests `app-review.test.ts`, `testflight.test.ts` |
| 3.5 Website: landing, about, why, contact, 404 | A visit | `site.*`, `pages.about`, `pages.why`, `pages.contact`, `pages.notFound` | BUILT | Warm; the promise once | A user count, ranking or review that is not real and verifiable; a family-beyond-co-parent promise at 1.0 | `site.en.ts`, `pages.en.ts`; pointer |
| 3.6 Website: delete-account page | A person asks to delete | `pages.deleteAccount.*` | BUILT, with a known wrong line: line 240 promises removing photos we never hold. Replacement words are in `words-packet-20nov.md` row 53 (PROPOSED, counsel reads) | Plain, calm | A promise about photos or backups the build does not make | `pages.en.ts:213`; words packet row 53 |
| 3.7 Website: waitlist form | A visit | `site.waitlist.label`, `.button`, `.success`, `.error` | BUILT: "Thank you. We will write when {app} is ready for you." Missing: the notice line under the field. PROPOSED `site.waitlist.notice`: "We will use this only to tell you when {app} is ready. Privacy Policy." (from `docs/emails/COMPLIANCE.md` 6.3) | Plain | Any promise of more than the one message (E75: the waitlist is never joined to accounts) | `site.en.ts:116`; notice line missing |
| 3.8 Website: the unsubscribe page | A click from a commercial email | `emailLegal.unsubscribePage.*` | BUILT: heading "Stop these emails?", button "Unsubscribe", done and error lines | One button, no survey, no guilt | "We will miss you"; a reason question | `emails/legal.en.ts:46`; page `/unsubscribe` is on `main` (`packages/emails/src/links.ts`) |
| 3.9 Terms, Privacy Policy, health privacy | A link | legal documents | pointer to `legal`; in-app links use `beforeBegin.termsLink`, `.privacyLink` | Legal | Anything in app copy that differs from the registered row | `docs/legal/in-app-disclosures.md` |

## 4. First run: install to "The book is open." (E-S01 to E-S09, E-S24, E-S28, E-S29)

Order of the path is card 19 (`docs/product/prd/19-from-download-to-first-letter.md`). The store build with servers off has no sign-in, no account words and no co-parent words (IA.md "Builds and switches"; `packages/emails/src/links.ts` says Build 1 sends no email at all).

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 4.1 Launch and boot (E-S01) | First open | none | No words. The mark only | Calm | A tip, a count, "loading your memories" | `docs/design/e2e/E-foundations-and-system-states/WORDS.md` |
| 4.2 Welcome (E-S02, Home of first run) | First open, after the age gate | `en.onboarding.welcome.title`, `.subtitle`, `.body`, `.startButton`, `.signInButton`, `.joinButton` | BUILT: "Letters to your child, in your own words and voice." Buttons "Begin the book", "I already have a book", "I was invited" | Warm, one idea | "capture every precious moment"; "AI"; a feature list | `strings.en.ts:69` |
| 4.3 Free letters line | Same screen | `en.onboarding.welcome.freeLine` | BUILT: "Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free." | Plain fact | A price, "free trial" or "we will email you" (D-083) | `strings.en.ts:75`. Check with `legal` that the number matches E59 (per phone, not per account) |
| 4.4 Age gate and stop (E-S03) | Before sign-in | `en.ageGate.title`, `.yesButton`, `.noButton`, `.stopTitle`, `.mistakeButton` | BUILT: "Are you 18 or older?"; stop: "{app} is currently for adults 18 and over" | Courteous, no scolding | Mention of children using the app; a reason that sounds like blame | `strings.en.ts:1547`; NS-40 |
| 4.5 Agreement line (E-S07) | Before sign-in | `en.beforeBegin.agree` | BUILT: "I agree to the Terms of Service and Privacy Policy." | Plain | A bundled marketing consent (E75: none) | `strings.en.ts:1559` |
| 4.6 Sign in: Apple, email, code (E-S04 to E-S06) | Servers-on builds | `authCopy.*`, `en.auth.troubleButton`, `.noEmailHelp`, `en.trust.signIn.why`, `.privacy`, `.email` | BUILT. The trust lines say why an account helps, who can read, and what the email is for | Calm; once | "magic link", "log in", "password", "Continue with Google" | `features/auth.en.ts`, `strings.en.ts:1503`, `:1531`. `trust.signIn.why` ("keeps your book safe") and `.privacy` ("invite") are registered requests to counsel (`build12-untrue-copy.test.ts:72-76`) |
| 4.7 Sensitive-data consent at sign-in | Servers-on, first sign-in | `en.sensitiveConsent.*` | BUILT | Plain, optional, withdrawable | Fear; "we need" | `strings.en.ts:1068`; counsel reads |
| 4.8 Claim screen (E-S24) and "Opening your book" (C-S10, C-S11) | A returning account on a phone | `authCopy.claim.*`, `auth.newPhone.*` | PROPOSED (file): `words-packet-20nov.md` rows 6 to 12 and 24 | Reassuring without promising | "lost", "missing", "everything moved"; "your recordings are safe" (no backup at 1.0) | words packet Part 1; `features/auth.en.ts` |
| 4.9 Story cards (flag, three cards) | First run, if the flag is on | `onboardingStories[*].headline`, `.line` | BUILT, with alternates | One idea per card | A feature the build lacks | `stories.en.ts:26`; `docs/design/specs/FIRST-RUN-WORDS-10nov.md` section 1 |
| 4.10 The promise screen | First run | `en.onboarding.promise.*` | BUILT: "Exactly as you said it." Sample line and "Word for word marks every small fix. Tap one to put it back." | The one place the feature is named as a promise | "tidy", "cleaned up", "polished", "improved", "corrected" | `strings.en.ts:81` |
| 4.11 Who is this book for? (E-S08) | First run | `en.onboarding.child.*` | BUILT: "Who is this book for?"; "Here yet, or on the way?"; "Not here yet"; "Letters written before the birth go in Before You." | Gentle for a parent who is expecting | A countdown ("12 weeks to go"), a health word, any loss word, a due-date rhythm | `strings.en.ts:97`; E-1 rule: the due date is L4 |
| 4.12 What does {child} call you? | First run | `en.onboarding.signsAs.*` | BUILT: "What does {child} call you?" with examples Mama, Papa, Amma, Appa | Family words as families use them | "Mother" or "Father" as the only choices; "contributor" | `strings.en.ts:142` |
| 4.13 Names and the child's name check | First run, optional | `en.onboarding.dictionary.*`, `.nameCheck.*` | BUILT: "Say {child}'s name three times"; "{count} of 3" | Warm, brisk | A suggestion that the app knows how to spell the name better than the parent | `strings.en.ts:158`, `:168`. E80: the dictionary stays on the phone |
| 4.14 Microphone primer, then iOS alert (E-S29) | First Speak | `en.listen.primer.*`; iOS string `permissions.microphone` | BUILT: "Your phone will ask about the microphone" / "It listens only while you record." | Plain | "always listening"; "smart" | `strings.en.ts:330`; `permissions.en.ts` |
| 4.15 Speech download ask | The first spoken letter in a language that needs it | `speechConsentCopy.*`, `languageCopy.*` | BUILT | Plain, optional, says the size | "AI model"; "cloud" | `features/speech.en.ts`, `features/language.en.ts` |
| 4.16 First recording trust line, once | First recording | `en.trust.firstRecording.title`, `.body`, `.dismissButton` | BUILT: "Your voice stays here" / "Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models." | Calm, one time | A repeat on later recordings (VOICE.md: repeating sounds anxious) | `strings.en.ts:1516` |
| 4.17 Reminder ask in first run | First run, where the build still has this step | `en.onboarding.reminder.*` | BUILT: "A gentle nudge, now and then?" / "Yes, evenings" / "Pick a time" / "No reminders" | Invite, easy to refuse | "Don't forget"; any count of days | `strings.en.ts:184`. The ask after the first kept letter is row 5.16 (D-S04); one of the two places is the one that ships, see 03 |
| 4.18 Invite the co-parent step | Only where the build has the co-parent flow | `en.onboarding.invite.*` | BUILT. Hidden in the store build (IA.md: no tab, no row, no "Coming soon") | Offer, never pressure | "partner", "spouse", a count of who has joined | `strings.en.ts:196` |
| 4.19 "The book is open." | End of first run | `en.onboarding.finish.title`, `.body`, `.cta` | BUILT: "The book is open." / "Say one thing about {child} today. That is a letter." / "Write the first one" | A door, not a fanfare | "Congratulations"; a badge | `strings.en.ts:204` |

## 5. Capture: Home, Listen, Write, Review, Keep (A-S01 to A-S15, E-S10)

The area words are in `docs/design/e2e/A-capture/WORDS.md`; the built lines are in `en.tonight`, `en.listen`, `en.write`, `en.notMuch`, `en.review`.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 5.1 Home greeting (A-S01) | Opening Home | `en.tonight.greeting.*` | BUILT: "Good evening, {name}." through "Still up, {name}. Take your time." | Time-of-day warmth | "Welcome back" after a gap; "It has been N days" | `strings.en.ts:212` |
| 5.2 The prompt and "Another thought" | Home | `en.tonight.promptLabel`, `.newPromptButton`; `PROMPTS` | BUILT: "A thought to start with", "Another thought". The prompt library is by age band | A question about the child's own days | A repeat inside 10 prompts (BL-534 is the longer window); "you should"; audit of the parent | `strings.en.ts:222`; `prompts.ts`; `prompts.preBirth.test.ts` |
| 5.3 Speak, Type, Not much today | Home | `en.tonight.speakButton`, `.typeButton`, `en.notMuch.button` | BUILT: "Speak", "Type", "Not much today" | One tap is a full answer | "skip", "check in", "log" | `strings.en.ts:225`, `:349` |
| 5.4 Quiet-day mark | Tap "Not much today" | `en.notMuch.savedToast` | BUILT: "A quiet day, kept." with Undo. Stores a mark with no sentence (D-084) | App's own words, small, unsigned | Writing a line for the person | `strings.en.ts:353` |
| 5.5 Waiting cards | A recording not yet kept | `en.tonight.draft.held`, `.swept`, `.heldMany`, `.pickUpButton`, `.keepButton` | BUILT: "Waiting to be kept.", "Recorded before the app closed." | Matter-of-fact | "draft"; "unsaved"; "you left this" | `strings.en.ts:261` |
| 5.6 A month ago card | A month-old letter exists, no waiting card | `en.tonight.resurfaced.kicker` | BUILT: "A month ago" | Quiet | Letter text in any notification or email (it is in-app only) | `strings.en.ts:277` |
| 5.7 Home slips, one at a time (ranks 1, 2, 2b, 3, 3b, 4) | Per E36 order | `en.tonight.*`, `days.*`, `book.*` | Order is a rule, not copy: waiting set, seal-opened, a day the parent chose today, Save a copy, the Days ask, one past letter. Only the highest shows | One slip, flat | A second slip on the same open; a badge or count | E36; spec 06 section 3; words in `A-capture/WORDS.md` |
| 5.8 Day-zero card (first open of Home with nothing kept) | Spec 06 section 6 | `en.tonight.dayZero.*` | missing. PROPOSED brief: one line pointing to the red circle, no tutorial. PROPOSED line `en.tonight.dayZero.line`: "Tap the red circle and talk. A minute is plenty." | Gentle | "Get started", a checklist, a progress bar | spec 06 sections 3.3 and 6; no key found in `strings.en.ts` |
| 5.9 Listen (A-S04, A-S05) | Speak | `en.listen.*` | BUILT: "To {child}", "Tap the red circle and talk.", "Listening.", "Still here. Take your time." | Patient | "Recording..." style urgency; a visible timer that pressures (the elapsed time is for VoiceOver) | `strings.en.ts:291`, `:235` |
| 5.10 Write (A-S06) | Type | `en.write.label`, `.autosaved`, `.notSaved`, `.tooLong` | BUILT: "Your letter", "Saved on this phone", "This is a very long letter. Every word is kept." | Reassuring | A character count that nags | `strings.en.ts:338` |
| 5.11 Review: the words and small fixes (A-S07) | After Listen or Write | `en.review.view.*`, `.edits.*`, `.changesLabel`, `.undoEditButton` | BUILT: "With small fixes" / "Exactly as said"; each fix named by what happened ("Took out a sound", "Spelled your way", "One word fixed") | Says what happened, never what improved | "tidied", "cleaned", "polished", "corrected", "edited" for what the machine does | `strings.en.ts:357-490`; BRAND.md Word for word |
| 5.12 Review: first-time note | First Review | `en.review.firstNote.*` | BUILT: "Please have a read" / "We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back." | Once | A repeat on later visits | `strings.en.ts:510` |
| 5.13 Where should this go? | Review | `en.review.destination.*` | BUILT: "Add to {child}'s book", "Keep private", toasts "Added to {child}'s book.", "Kept just for you." | Neutral choice, no default pressure | "Share with everyone"; an implied obligation | `strings.en.ts:493` |
| 5.14 Day sheet, From sheet, another language (A-S08 to A-S10) | Review | `en.review.date.*`, `en.book.dateline.*`, `authCopy`, words packet Part 2 | BUILT and PROPOSED (file) | Plain | A guess at the date from the recording | `A-capture/WORDS.md` |
| 5.15 Let it go (A-S11) | Review or Listen | `en.listen.discardTitle`, `.discardBodyNoUndo`, `.letGoStuck`, `.removeNowButton`, `en.review.letGoPending` | BUILT in part; the rest PROPOSED (file): `words-packet-20nov.md` rows 1 to 5 | Calm and exact | "deleted forever" drama; "lost" | words packet Part 1 |
| 5.16 Reminder ask over the Book (D-S04) | After the first kept letter, at most twice | `reminderCopy.priming.*`, D-S04 words | BUILT in part. PROPOSED (file): `D-family-sharing-reminders/WORDS.md` section 2 | An invitation; "No reminders" has equal weight | "Never miss a day"; a count; a promise the lock screen shows nothing (Show Previews is the user's setting) | `features/reminders.en.ts:60`; D WORDS |
| 5.17 After Keep: the saved moment (A-S13) | Keep | `en.tonight.afterSave.title`, `.body`, `.reviewButton`, `.doneButton`, `.anotherButton` | BUILT: "Kept." / "One more page for {child}." / "Read it back" / "Done for tonight" | Small; the success is the line | "Great job"; a total; "streak" | `strings.en.ts:281` |
| 5.18 Keep gate (E-S10) | After the free letters, per phone (E59) | `billingCopy.keepGate.*` | BUILT. Title in IA.md: "Keep adding to {child}'s book". The gate is never named in copy; the recording is "Waiting to be kept." | Plain, no pressure; Plus is the plan | A price in app copy (D-083); "upgrade"; "unlock"; "you will lose"; "we will email you" | `features/billing.en.ts`; `in-app-disclosures.md` section 3 |
| 5.19 Photo with a letter, Find, Share, Firsts, seals (flags) | Flag on | `photos.*`, `find.*`, `share.*` | PROPOSED (file): `words-packet-20nov.md` Part 2. Held until the flag and the counsel reads | Plain | "AI sees your photo"; a suggestion of a caption; "picture" and "photo" mixed (Q-FD-26: one word, "photo") | words packet Part 2 |
| 5.20 Quick note, widget and Control Center doorways (A-S14) | System surfaces | `en.quickNote.*` | BUILT: "Quick note", "What just happened?", "Noted. It is in Month {month}." | Tiny | A letter text on a lock screen label; a name with App lock on | `strings.en.ts:517`; `quickNote.lockScreenLabel` is a widget label, never a notification |

## 6. After the first letters: Plus, the plan and the Keep step (E-S10 to E-S12, E-S25, E-S26)

Plus is Apple-only. The words below say plan facts, never a price in app copy (the price comes from StoreKit) and never an offer.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 6.1 Plan in Me (E-S11) | Me, Plan | `billingCopy.plan.*`, `en.settingsHome.planHelp` | BUILT: "Plus is on, free until {date}." / "Cancel by {cancelBy} and you pay nothing." | Date, not countdown (CATALOG principle 6) | "3 days left"; "Last chance"; "Ends tonight" | `features/billing.en.ts:124-130` |
| 6.2 Plus confirmed (E-S12) | After purchase | `billingCopy.confirmation.*` | BUILT: "Thank you. Plus is on" (a status, not a toast and a title as well, VOICE.md) | Thanks | "Welcome to the club"; unlocking language | `features/billing.en.ts:206`; IA.md "Plus is on" screen |
| 6.3 Home Plus line (E-S26) | Home, only when it applies | `billingCopy.tonight.plusLine` | BUILT: "Adding new letters to the book needs Plus. Recording, reading and export are always free." (the group is still named `tonight`; spec 06 section 8 says paths that name Tonight read Home) | Quiet, one line, a state and not a count | A repeat on every open; a comparison with other parents | `E-foundations-and-system-states/WORDS.md` 5.15 |
| 6.4 Plan reminder inside the app (E-S25) and the lock-screen plan notice | Trial or renewal date near | `billingCopy.reminders.title`, `.trialOneMonth`, `.trialMonths`, `.renews`, `.yearly` | BUILT: "Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan." Title "Plus" | Plain legal courtesy; the one class that names Plus | A price, a count, a child name, "Keep step" on a lock screen (NS-32-R12) | `features/billing.en.ts:176-192`; D WORDS D-S10.plan |
| 6.5 Subscription legal lines | Paywall and Plan | `en.plus.legal.*` | BUILT: renewal, cancel steps, Terms and Privacy links | Legal, readable | A discount, "are you sure", a save offer | `strings.en.ts:1151` |
| 6.6 Restore, redeem, refund | Plan screen | `billingCopy.*` | BUILT | Plain | Blame when a restore finds nothing | `features/billing.en.ts` |

## 7. The Book and reading (B-S01 to B-S24)

Area words: `docs/design/e2e/B-book-and-reading/WORDS.md`. The Book's months run "Before You", "The first weeks", "Month 1" onward (IA.md).

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 7.1 The Book header and months (B-S01) | Book tab | `en.book.title`, `.chapterTitle`, `.chapterNewborn`, `.thisMonthLabel`, `.beforeYouChapter` | BUILT: "{child}'s book", "Month {month}", "The first weeks", "This month", "Before You" | A calm cover | "chapter" in copy; "page" for a month; a gap between months shown as empty | `strings.en.ts:530-551`. Retired `chapterNotes`, `chapterNoteOne`, `chapterMixed` are marked "delete in P7" (dead keys, see section 15) |
| 7.2 Letter cards and the signature | Reading | `en.book.signature`, `.together`, `.fromTwo`, `.privateLabel` | BUILT: "From {signsAs}", "Private", "From {signsAs} and {child}" | The person's own words in the serif, signed by them; the app's words small, muted, unsigned | A signature on an app line; "author", "contributor" | `strings.en.ts:552`; VOICE.md "The app's own words" |
| 7.3 Where the recording is (C-S09) | Letter page | `en.book.recordingOnPhone`, `.recordingBackedUp`, `.recordingElsewhere`; PROPOSED `en.book.recordingNotHere` | BUILT, plus PROPOSED (file) row 12: "Recording not on this phone" | Exact about where | "stored in the cloud" while backup is off; "safe" | `strings.en.ts:564-570`; words packet row 12 |
| 7.4 Provenance line | Letter page | `en.book.provenance.*` | BUILT: "Spoken, with small fixes", "Spoken, exactly as said", "Typed" | Says what happened | "edited", "enhanced" | `strings.en.ts:556` |
| 7.5 Quiet-day row (B-S22, D-S22) | Book | `en.book.quietDay.label` | BUILT: "A quiet day" | The mark only | "You skipped", "no letter"; a gap count | `strings.en.ts:573` |
| 7.6 Find (B-S06) | Flag on | `find.*` | PROPOSED (file): `words-packet-20nov.md` rows 54 to 57 | Short | "results", a number of matches, "yet", "still" | words packet Part 2 |
| 7.7 Letter page menu and delete | Letter page | `en.book.entryMenu.*` | BUILT: "Add to book", "Make private", "Show exactly what I said", "Delete" | Plain verbs | "edit your story"; "remove forever" without the 30-day undo | `strings.en.ts:599` |
| 7.8 Sealed letter and "Hide until a day" (B-S13 to B-S16, B-S18) | Flag and counsel (seals blocked until counsel answers) | keys as written in B WORDS | PROPOSED (file): `B-book-and-reading/WORDS.md`. No seal code until counsel answers (E67 plan Q3) | Anticipation, never surprise-spoiling | "time capsule" marketing; a countdown | B WORDS; `docs/product/prd/22-final-holistic-spec.md` section 7 |
| 7.9 Read together (B-S19, B-S20) | Book, "Read together" | `en.readTogether.*` | BUILT: "Read together", "Start reading", "That was Month {month}.", "That is every letter so far. More are still being written." | Bedtime-calm | "story mode", "bedtime mode", "playback"; a word highlight claim (v1.1) | `strings.en.ts:625` |
| 7.10 Read together for a typed letter or another phone's recording | Playing | `en.readTogether.noRecording`, `.recordingElsewhere` | BUILT: "This one was typed. Read it aloud together." | Warm | "No audio available" | `strings.en.ts:646-647` |
| 7.11 Past letter on Home (B-S17, B-S21) | Home slip rank 4; Me switch | keys as written in B WORDS | PROPOSED (file): B WORDS | One letter, quiet | "On this day" language; the child's age | B WORDS; NS-23, NS-31 |
| 7.11b Year rows in Go to a month (B-S07) | Book, Go to a month | `en.book.years.*` | PROPOSED (file): "{child}'s first year" to "{child}'s fifth year", then "{child}'s year {n}" for year 6 and later; "Year {n}" when the book has no name | Plain | "your child's first year" when the book has no name | `B-book-and-reading/WORDS.md` section 6 |
| 7.12 Year book title | A year of letters in the PDF | `en.book.yearTitle`, `book.aboutThisBook` | BUILT: "{app}: Year {year}" | Warm, factual | A promise of paper in 1.0 (digital only; BRAND.md) | `strings.en.ts:533`; `book.en.ts:22` |

## 8. Family: the co-parent, and the places v1.1 will fill (D-S12 to D-S20)

At 1.0 family is the co-parent only (D-055). Servers-off store build: no tab, no row, no "Coming soon" (IA.md; founder, 11 Nov). The built family keys for grandparents and others are marked v1.1 and must not render.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 8.1 "Write this book together" (D-S12) | Me, the book's page; servers-on builds | `familyCopy.*` | PROPOSED (file): D WORDS section 3 | Offer | "partner", "spouse"; "approve"; a count of who wrote more | `D-family-sharing-reminders/WORDS.md:325` |
| 8.2 Invite sheet and link page (D-S13, D-S14) | Inviting | `en.family.invite.*`, `en.family.shareMessage.*`; web `/j` | BUILT in part. The link page names no child, no inviter, no letter (R6) | Written by the parent, in their own voice; the shared message is the parent's, not a brand email (E-3) | The child's name on a web page; a push prompt | `strings.en.ts:664-683`; D WORDS D-S14 |
| 8.3 Join, accept, joined (D-S15 to D-S17) | The other parent opens the link | `familyCopy.join.*` | PROPOSED (file): D WORDS | Welcoming, equal | "contributor"; "you have been invited to read"; hierarchy | D WORDS |
| 8.4 Family page, undo join (D-S18 to D-S20) | Me | `familyCopy.*` | PROPOSED (file) | Calm; silence beats a rejection (E-5) | "removed"; "left"; a notice of who left | D WORDS |
| 8.5 The other parent wrote (no push, E79) | Next open | in-app line `familyCopy.newLetterLine` | missing. PROPOSED brief: one muted line on Home or the Book when a co-parent letter has arrived, no count, no name beyond `{signsAs}`. PROPOSED line: "{signsAs} added a letter to {child}'s book." | Glad, plain | A push or a promise of one; a count; a comparison | E79, LEGAL-REQ-054; `notifications.familyLetter` and `.familyAdded` exist and must not be wired (they need remote push) |
| 8.6 A co-parent's letters leave the book | The other parent deletes their account | `en.coParentLeft.*` | BUILT: title "Some letters are no longer in the book". Flagged in section 15: "no longer" is loss-adjacent. PROPOSED title `en.coParentLeft.title`: "A change in the book you share". The email twin uses "A change in a book you share" | Matter-of-fact | Who left or why; blame | `strings.en.ts:1539`; `emails/account.en.ts:190` |
| 8.7 Co-parent "coming soon" caption in Me | Builds without the flow | `familyCopy.soon.*` | CONFLICT, see section 15: spec 06 section 5.1 draws one caption line; IA.md (founder, 11 Nov) says none | | | decision for `design-systems` and the founder's 11 Nov ruling |
| 8.8 Grandparents, aunts, uncles (v1.1) | Not at 1.0 | `en.family.*`, `moments.firstGrandparentLetter` | BUILT, marked v1.1, must not render | Warm, for the first-time reader (VOICE.md "Writing for grandparents") | "approve", "gift" at 1.0 | `strings.en.ts:664-719`, `:753` |
| 8.9 Share one letter with someone outside the app (D-S01 to D-S03) | Flag on | `share.*` | PROPOSED (file): `words-packet-20nov.md`; the parent sends it from their own Messages | The parent's own words, nothing added | A tagline on the shared letter that sells; "viral" language | words packet; spec 03 |

## 9. Keeping: copy, where letters live, a new phone, deleting (C-S01 to C-S26)

Area words: `docs/design/e2e/C-keeping-and-trust/WORDS.md`.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 9.1 Me, the tab root (C-S01) | Me tab | `en.tabs.you`, `settingsHome.*` | BUILT: tab "Me"; heading "Me" (NS-33-R2: no new word). PROPOSED (file) job line "Account and settings" (spec 06 section 5.1) | Plain paper | "Dashboard"; a score | `strings.en.ts:63`, `:1334` |
| 9.2 Account and sign-out (C-S02, C-S03) | Me | `authCopy.account.*` | BUILT; `signOutBody` change PROPOSED (file): "Your letters and recordings stay on this phone." (words packet row 15, counsel reads) | Exact | "your letters are safe in the cloud" | words packet rows 15 to 17 |
| 9.3 Save a copy (C-S04) | Me, "Save a copy" | `exportCopy.*` | BUILT as "Export your book"; the rename to "Save a copy" is NS-11 (words packet row 25) | Plain, free, any time | "download your data" as a threat; a paywall | `features/export.en.ts` |
| 9.4 The printable book (C-S05) | Me | `book.*` | BUILT: PDF only. The word "printed" and any ordering are banned in 1.0 (rule "digital only") | Warm | "order", "ship", "hard copy" | `book.en.ts`; `rules.test.ts` "digital only" |
| 9.5 Where your letters live (C-S08) | Me | `en.whereLive.*`, `en.settings.privacy.*` | BUILT; adds photos in PROPOSED (file) row 50 | Says where each part is kept | "synced to the cloud" for audio; "safe" | `strings.en.ts:1407`; words packet row 50 |
| 9.6 A new phone (C-S10 to C-S12) | Signing in on a new phone | `auth.newPhone.*`, `en.book.newPhoneLine.*` | PROPOSED (file): rows 6 to 12 | Reassuring, exact | "everything moved"; "lost" | words packet Part 1 |
| 9.7 Recently deleted (C-S17), Storage (C-S18), Hidden books (C-S16) | Me | `en.settings.recentlyDeleted` (`strings.en.ts:873`), `packsCopy.*` | BUILT. Hidden books is never listed in analytics (R-G) | Plain; 30 days, Restore, Erase now | "gone forever" without the facts; a list of recordings with counts | `features/packs.en.ts` |
| 9.8 Erase everything on this phone (C-S19) | Me | `accountDeletionCopy.erase.*` | BUILT | Exact, owner check named | Drama | `features/account-deletion.en.ts` |
| 9.9 Delete account and delete a book (C-S20, C-S22) | Me | `accountDeletionCopy.*` | BUILT; photo lines PROPOSED (file) rows 52 and 53 | Calm, with the 30-day undo and the email receipts | "we are sad to see you go"; a save offer | `features/account-deletion.en.ts`; words packet |
| 9.10 Recording backup (C-S21) | Flip only; absent at 1.0 | `backupCopy.*` | BUILT, not shown (NS-08-R5) | Says it is for the owner alone | A promise of backup at 1.0; "sync" for audio | `features/backup.en.ts`; E78 gate |
| 9.11 Privacy page (C-S23) and promise | Me, Privacy | `en.trust.settings.*` | BUILT: the promise word for word | The promise once at the top, then the switches | "military-grade", "100% private", "bank-level" | `strings.en.ts:1522`; VOICE.md |
| 9.12 App lock and the cover (E-S22) | App lock on | `appLockCopy.*` | BUILT in `apps/mobile/src/lib/app-lock/copy.ts`, a feature copy file still in the app (its header says it moves to `features/app-lock.en.ts`) | Plain | A hint of what is inside | `apps/mobile/src/lib/app-lock/copy.ts`; duty 1 move |
| 9.13 Earlier versions of a letter (C-S13, C-S14) | Letter page | keys as written in C WORDS | PROPOSED (file): C WORDS | Says what is kept | "history of edits" as surveillance | C WORDS |

## 10. Me: Settings, Reminders, Days, Help (C-S24 to C-S26, D-S06 to D-S09, E-S21, E-S30, E-S31)

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 10.1 Reminders page (D-S06) | Me, Reminders | `reminderCopy.settings.*`, `.priming.*` | BUILT: "How often", "Which evenings", "Reminder time", "Month and birthday messages", "Names stay hidden while App lock is on." | Choices saved as you go | "daily"; "streak"; "don't miss" | `features/reminders.en.ts:41-84`; D WORDS |
| 10.2 Notifications off (iOS said no) | Permission denied | `reminderCopy.settings.deniedTitle`, `.deniedBody`, `.openSettingsButton` | BUILT: "Notifications are off" / "Turn them on in Settings to get these reminders." | No blame | "you are missing out" | `features/reminders.en.ts:57` |
| 10.3 Days (C-S24), Browse days (C-S25), Day detail (C-S26) | Me, Days; the Days ask on Home (rank 3b) | `days.*`, `culture.*` | PROPOSED (file): intent in card 21 section 16; days wording rules in 04. The ask: "Would you like a reminder on the days that matter to your family?" with "Choose days" and an equal-weight "Not now" | Optional, equal-weight choices; the call-out is "Only on this phone. Used for one thing: finding days for you to pick. Change or clear any time in Me." | "your religion", "your faith", "your tradition", "tell us your religion", "we know your traditions"; a pre-ticked day; a second ask after "Not now" | card 21 NS-47 sections 12, 16, 19; `culture.*` keys missing from `packages/content` |
| 10.4 Add a day (D-S08), a typed day (D-S09) | Me, Days | `days.add.*` | PROPOSED (file): D WORDS 18.2 | The parent's own words shown only if they turned showing on | Anything added to the parent's words | D WORDS section 18 |
| 10.5 Day reminders: consent line and visible opt-out (D-S25) | Before the first tick | `days.consent.line` | PROPOSED (file): D WORDS 18.3; counsel confirms (DPLA Attachment 1 2.2) | One plain sentence | "we will send you promotions" (a reminder is not marketing) | D WORDS 18.3 |
| 10.6 Appearance and reading size (E-S21) | Me | `en.reader.*`, `settingsHome.appearance*` | BUILT | Plain | "dark mode is better for sleep" claims | `strings.en.ts:1244` |
| 10.7 Help and legal | Me | `en.helpLinks.*`, `licences` | BUILT | Plain | "contact our team" (it is a person) | `strings.en.ts:1479` |
| 10.8 If you are struggling, lines in other countries (E-S30, E-S31) | Always present (D-034) | `en.struggling.*`, `HELPLINES` | BUILT; never listed in analytics; helpline sources re-checked on a schedule | Kind, short, no diagnosis | A screen that implies the parent is unwell; a number that is out of date | `strings.en.ts:1458`, `helplines.ts`; `helplines.test.ts` |
| 10.9 About: the "early version" note | Me, About | `en.settings.about.beta.*` | BUILT: "early version, can make mistakes" | One quiet note | "beta" anywhere else (D-060) | `rules.test.ts` "beta placement" |

## 11. Empty states

An empty state is one plain line and one door. It never says what is missing; it says what is here.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 11.1 Empty Book | No letters kept | `en.book.empty.bookTitle`, `.bookBody`, `.bookCta` | BUILT: "The first page is waiting." / "Tell {child} one thing about today." / "Write a letter". Spec 06 wants the CTA to read as a pointer to Home: PROPOSED `en.book.empty.pointer` | Inviting | "Nothing here"; "0 letters"; a progress ring | `strings.en.ts:587`; spec 06 section 8 |
| 11.2 Empty filter views | Family, Private | `en.book.empty.familyTitle`, `.privateTitle` | BUILT: "Family letters will gather here."; "Nothing private yet." The family line must not render at 1.0 | Quiet | "No family has joined"; "invite someone" nagging | `strings.en.ts:592-596` |
| 11.3 Find, no match | A search with no result | `en.book.empty.searchTitle` | BUILT: "No letters with that word yet." PROPOSED change: "No letters with that word." (NS-02-R39 bans "yet") | Plain | "yet" | words packet row 55 |
| 11.4 Read together, nothing yet | No letters | `en.readTogether.empty` | BUILT: "Letters you add to the book will be here to read together." | Inviting | "no content" | `strings.en.ts:648` |
| 11.5 Recently deleted, Hidden books, Days, Storage | Nothing to list | `settings.recentlyDeleted.empty`, `days.empty`, `packs.*` | BUILT and PROPOSED (file) | One line | A count of zero; "none" in a list heading | C WORDS; `docs/design/e2e/C-keeping-and-trust/WORDS.md` |
| 11.6 Review: nothing to read back | No waiting recording | `en.review.noDraft.title`, `.button` | BUILT: "Nothing to read back here" / "Go to the book" | Plain | "Error" | `strings.en.ts:406` |
| 11.7 Export on an empty book | Me, Save a copy | `me.exportEmpty` | missing. PROPOSED line: "There are no letters to save yet. Your copy will have what you add." | Plain | "nothing to export" as a failure | spec 06 section 8 (slot only) |

## 12. Notification and reminder lines (all local; E79)

Logic (when, how many, back-off, quiet window) is 03-in-app-and-reminder-logic.md. The days and festivals are 04-events-and-festivals-usa.md. This section lists the lines a lock screen can show and the rule each follows.

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 12.1 Evening reminder, neutral (the default, names off) | Chosen evenings, 07:00 to 21:30 | `reminderCopy.neutral.evening[0..7]` | BUILT: "A minute to write?" / "One thing about today is plenty. A sentence will do." and seven more | Invite, easy to ignore | "Don't forget"; a count; "since"; a day name with a child name | `features/reminders.en.ts:15-24` |
| 12.2 Evening reminder, named (names on, App lock off) | Same | `en.notifications.evening[0..7]` | BUILT: "A minute for {child}?" / "Tell {child} one thing about today. A sentence is plenty." | Same | Same, and never the child's age | `strings.en.ts:719-728` |
| 12.3 Catalogue variety and 23 extra evening lines | After the freeze (Q-NTC-8: floor at freeze, full set after the reading test) | `ntc.*` keys, `reminderCopy.neutral.evening[8..30]` | PROPOSED (file): `docs/product/prd/functions/notification-catalogue.md` section 6 (40 samples) and D WORDS D-S10.evening rows 8 to 30 | Friday may smile, Sunday goes slower, Monday stays small | An exclamation mark; "tonight" in a line the reminder time can make wrong (evening-only variants are dropped before 17:00) | catalogue section 6; D WORDS |
| 12.4 Month message | The day a new month opens, names on | `en.notifications.monthOpen` | BUILT: "Month {month} begins" / "A new month in {child}'s book is open." | Quiet marker | An age in years; a comparison with other children | `strings.en.ts:743` |
| 12.5 Birthday message | The birthday, 09:00, names on | `en.notifications.birthday` | BUILT: "Happy birthday to {child}" / "A year of letters. Want to read them together today?" | Warm | "Another year gone"; any loss; the day's count | `strings.en.ts:747` |
| 12.6 Month and birthday, names off or App lock on (E82) | Same, names off | `en.notifications.neutral.title`, `.body` | missing. Today the neutral set still says "Month {month} begins" and "A year of letters." (section 15). E82 requires the neutral reminder title and a neutral fixed body. See the Proposed change box below | A plain reminder, nothing that dates the child | A digit, "year", a month number, an age | E82; `features/reminders.en.ts:24-26` |
| 12.7 Typed day (the parent's own) | A day the parent added (D-S09) | `reminderCopy.neutral.typedDay` | PROPOSED (file): "A day you wanted to remember" / "Tap to see the words you added for today." With words shown only if the parent turned showing on, exactly as typed | Their words, unchanged | Quotation marks or a prefix around their words | D WORDS D-S10.typedDay |
| 12.8 A library day (a day the parent ticked) | 09:00 on the day | `days.lock.title.neutral`, `days.lock.body.neutral` | PROPOSED (file): title "Something for the book today", body "A day you chose to mark. A few words, if you like." One fixed string, no `{child}` (E45) | Quiet; reveals nothing about faith or family | A day name unless on the allowlist and names on and App lock off (Q-FD-18); "Happy {festival}" | D WORDS 18.4; E45; details in 04 |
| 12.9 Plan notice | Trial or renewal date | `billingCopy.reminders.*` | BUILT; see 6.4 | Legal courtesy | A price, a child name, a count | D WORDS D-S10.plan |
| 12.10 Hidden-preview placeholders (NS-32-R13, NS-13-R33) | Show Previews set to Never or When Unlocked | `en.notifications.previewPlaceholder`, `.planPreviewPlaceholder` | PROPOSED (file): "Something for the book, whenever you have a minute." and "A reminder about your plan." (words packet rows 18 and 19, option A) | Invites | A name, count, day, brand (iOS shows the app name) | words packet Part 1; BL-966 |
| 12.11 Reminder permission and the first-sheet lines | Turning reminders on | `reminderCopy.priming.privacyLine`, `.quietLine` | BUILT: "Notifications never show what you write. Names stay off the lock screen unless you turn them on." / "Only in the evenings you pick, and never late at night." | Reassuring, once | "We will never show"; the user's Show Previews setting is outside our control | `features/reminders.en.ts:60-63` |
| 12.12 A gentle return (never scheduled) | None | `en.notifications.gentleReturn` | BUILT, never scheduled, speaks to a gap. To be deleted in the dead-copy sweep (D WORDS section 10) | | | `strings.en.ts:730` |
| 12.13 Family letter and family added (v1.1) | None at 1.0 | `en.notifications.familyLetter`, `.familyAdded` | BUILT, not to be wired: they need a remote push (E79) | | | `strings.en.ts:735-741` |

**Proposed change (needs an erratum).** E82 ends: "Where a body would have carried the age, the neutral body is used instead", and names `days.lock.body.neutral` ("A day you chose to mark. A few words, if you like."). For a month message or a birthday with names off, that line would be untrue: the parent chose no day. Proposal: month and birthday messages with names off or App lock on use `en.notifications.neutral.title` "Something for the book" and `en.notifications.neutral.body` "Whenever you have a minute." (PROPOSED; under 40 and 110 characters; no digit, no "year"); `days.lock.body.neutral` stays for ticked and typed days only. It would amend E82's last clause. Erratum: next free number after E82 (E83 at this writing), carried by `content`, read by `privacy`. Nothing is built on this proposal until it is ruled.

## 13. Success and celebration lines

Celebrate what exists. These are in-app only (moments never go to a lock screen). A moment never compares, never counts per author, never mentions Plus (`rules.test.ts` "moments celebrate without comparing").

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 13.1 First letter | First Keep | `en.moments.firstLetter` | BUILT: "The first letter." / "Every book starts with one. This one is in your words." | Quiet pride | "Congratulations"; a badge | `strings.en.ts:754` |
| 13.2 Letter totals | When the total reaches 10, 50, 100, 365 | `en.moments.letters10` to `.letters365` | BUILT: "10 letters." / "Ten pieces of {child}'s story, told by you." Review: "story" is a banned word for what a person makes (BRAND.md: "A person makes letters, never stories"). Section 15 | Matter-of-fact | A rate ("in only 3 weeks"); a comparison; "story" for a letter | `strings.en.ts:758-771` |
| 13.3 A month is in the book | A month with letters closes | `en.moments.firstMonthComplete` | BUILT: "Month {month} is in the book now." / "{count} letters, there for {child} to read one day." / "Read this month" | Celebrates what exists | "only {count}"; a target | `strings.en.ts:774` |
| 13.4 Year complete | A twelve-month span is in the book | `en.moments.yearComplete` | missing. PROPOSED title "Year {year} is in the book." PROPOSED body "A full year of letters, there for {child} to read and hear for years." | Warm; time and love | "A whole year gone"; a total as a score | new key; the birthday lock-screen line is separate (12.5, 12.6) |
| 13.5 First time reading together | First Read together | `en.moments.firstReadTogether` | BUILT (v1.1 marked): "You read it together." | Quiet | "the first of many times" is a promise about time and is allowed; "story" | `strings.en.ts:784` |
| 13.6 Toasts | Small actions | `en.review.destination.addedToast`, `en.book.quietDay.removedToast`, `en.review.putBackToast`, `en.notMuch.savedToast` | BUILT: "Added to {child}'s book.", "Mark removed.", "Put back.", "A quiet day, kept." | Vary the ending; three toasts in a row should not all end in "kept" (VOICE.md) | "Success!" | various |
| 13.7 Export finished, Save a copy ready | A copy is made | `exportCopy.done.*` | BUILT | Plain | "Your data is ready" as a transaction | `features/export.en.ts` |
| 13.8 Backup finished (when on) | Flip only | `backupCopy.done.*` | BUILT, not shown at 1.0 | Exact | "protected"; "safe" | `features/backup.en.ts` |

## 14. Errors and system states (E-S13 to E-S20, `en.errors`)

Name what did not finish, and say what is true about the words. "Safe" is kept for a failed save and a crash, where the words are on the phone (VOICE.md "Words we lean on too much").

| Surface | Trigger | Key | Line or brief | Tone | Never says | Source today |
|---|---|---|---|---|---|---|
| 14.1 Save failed | Local save error | `en.errors.saveFailed.*` | BUILT: "Not saved to the book yet" / "Your words are safe on this phone. We will try again on our own." / "Try again now" | Steady | "Error 5"; blame | `strings.en.ts:1167`; test "save failure reassurance" |
| 14.2 Microphone off, busy, phone full | Listen | `en.errors.micDenied`, `.micBusy`, `.phoneFull` | BUILT: "The microphone is off" / "Turn it on in Settings, or type this one." | Offers the other way | "permission denied"; "fatal" | `strings.en.ts:1176-1189` |
| 14.3 No words yet | Transcription did not finish | `en.errors.transcriptionFailed.*` | BUILT: "No words yet for this one" / "The recording is kept." | Says what is kept | "failed to transcribe" | `strings.en.ts:1190` |
| 14.4 Offline | No network | `en.errors.offline.*` | BUILT: "You're offline" / "Keep talking. Everything is saved on this phone." | Calm | "No connection!" | `strings.en.ts:1195` |
| 14.5 Invite expired | An old link | `en.errors.inviteExpired.*` | BUILT: "This invite has expired" / "Ask {inviter} to send a new one." | Plain | Blame | `strings.en.ts:1199` |
| 14.6 Something went wrong; the page did not open; nothing at this link | Generic and crash | `en.errors.generic`, `.crash`, `.notFoundPage` | BUILT: "Please try again. Nothing you saved has changed." / "Your letters and recordings are safe on this phone." | Steady | "Oops"; "fatal" | `strings.en.ts:1203-1219` |
| 14.7 The book could not open (launch recovery) | Database cannot open | `en.errors.launch.*` | BUILT: "Export what's readable" and a README in the export | Honest | "corrupt"; "lost" | `strings.en.ts:1226-1239` |
| 14.8 Sign-in outage and offline (E-S14), sign-in help | Servers-on builds | `authCopy.*`, `en.auth.troubleButton` | BUILT and PROPOSED (file) | Names the step that did not finish; "Nothing has changed." only when nothing did | "Your letters are still on this phone." in an error line a new phone also reads | E WORDS; VOICE.md |
| 14.9 SystemLine and update line (E-S15, E-S16) | An app update is needed | keys as written in E WORDS | PROPOSED (file): E WORDS | One quiet line in Me | "Update now or lose access" | E WORDS |
| 14.10 Second account on one phone (E-S18) | Another account signs in | `accountScope.title`, `.body` | PROPOSED (file): words packet rows 13 and 14: "This phone has a book from another account" | Exact, names nothing of the other account | The other account's name, child or email | words packet; `apps/mobile/src/components/account/copy.ts` (PR #871) |
| 14.11 A bounced address | An email could not be delivered | `en.settings.account.emailUnreachable` | missing. PROPOSED line: "We could not reach {email}." with a row to update the email (CATALOG 10.4) | Quiet | "Your emails are failing"; a warning color | `docs/emails/CATALOG.md` 10.4 |
| 14.12 Session ended on another device | Signed out elsewhere | `authCopy` `session_expired` | BUILT: "You were signed out. Sign in again to carry on."; shown once (NS-45-R3) | Plain | "Someone signed you out" as an alarm | `features/auth.en.ts:214`; E77 |
| 14.13 Low storage, interrupted, recovery (E-S17, E-S19) | Device conditions | keys as written in E WORDS | PROPOSED (file): E WORDS | Offers the next step | "critical" | E WORDS |

## 15. Gaps, as plain rows

Each row is a fact I found in the repo on develop at `e68541d`, with the place and who can change it. None is a count of anything; a row is closed when its owner says so.

| Where | What I found | Why it matters | Owner |
|---|---|---|---|
| `features/reminders.en.ts:24-26` (`reminderCopy.neutral.monthOpen`, `.birthday`, `.birthdays`) | The neutral month message title is "Month {month} begins"; the neutral birthday bodies say "A year of letters." | E82: with names off, no month number or "A year of letters." on a lock screen. The names-off test (no digit, no "year") is part of BL-966's reminder copy PR | `content` with `mobile` |
| `strings.en.ts:743-749` (`en.notifications.monthOpen`, `.birthday`) | Named versions carry the month number and "A year of letters." | Allowed only with names on and App lock off; the planner must choose neutral when App lock is on | `mobile` |
| `strings.en.ts:730` (`gentleReturn`) | Exists and speaks to a gap; never scheduled | A line that is never sent can be sent by mistake; the dead-copy sweep deletes it | `content` |
| `strings.en.ts:735-741` (`familyLetter`, `familyAdded`) | Copy for a push we do not build | E79; must not be wired in 1.0 | `mobile` |
| `strings.en.ts:758-771` (`moments.letters10` to `.letters365`) | "Ten pieces of {child}'s story" | BRAND.md: a person makes letters, never stories | `content` |
| `strings.en.ts:1539-1542` (`coParentLeft.title`) | "Some letters are no longer in the book" | "no longer" is loss-adjacent; the test passes, the voice rule asks for the plain fact. PROPOSED in 8.6 | `content` |
| `strings.en.ts:597` (`book.empty.searchTitle`) | "No letters with that word yet." | NS-02-R39 bans "yet" (words packet row 55) | `content` |
| `strings.en.ts:543-545` (`chapterNotes`, `chapterNoteOne`, `chapterMixed`) | Marked "retired by EXPERIENCE_PASS_2026-10; delete in P7" | Dead keys the rules test still reads | `content` |
| `strings.en.ts` (`tonight.dayZero.*`) | No key for the day-zero card spec 06 section 6 describes | A first-run Home line is unwritten | `content` |
| `en.notifications.previewPlaceholder` and `.planPreviewPlaceholder` | No key; words packet rows 18 and 19 PROPOSED | A hidden preview shows iOS's own default until it exists | `content`, then `mobile` (BL-966) |
| `culture.*`, `days.*` keys | Not in `packages/content`; intent only in card 21 and D WORDS | The Days ask and the library cannot ship without keys and the claims rows | `content`, `legal` |
| `en.moments.yearComplete` | No key | A year of letters is the natural moment and has no line | `content` |
| After the child's fifth birthday | B WORDS section 6 proposes year rows to "year {n}" and says books run on, but the prompt library's last band is 37 to 60 months and I read no Home or prompt behaviour for month 61 on (UNVERIFIED in code) | A family whose child turns six still opens the Book | `product`, then `content` |
| `en.settings.account.emailUnreachable` | No key (CATALOG 10.4) | A bounced address has no quiet row | `content` |
| `site.waitlist.notice` | No key | CCPA notice at collection (COMPLIANCE 6.3); counsel confirms | `content`, `legal` |
| Spec 06 section 5.1 and IA.md "Builds and switches" | Spec 06 draws a one-line co-parent caption in Me; IA.md (founder, 11 Nov) says no row and no "Coming soon" in builds without the flow | One of the two must change | `design-systems`, founder's 11 Nov ruling stands |
| `strings.en.ts:1511` (`trust.signIn.why`) | "keeps your book safe when you change phones" | Registered request to counsel; the build has no recording backup | `legal` |
| `apps/mobile/src/lib/app-lock/copy.ts`, `lib/copy.ts`, `lib/packs/copy.ts`, `components/book/copy.ts`, `components/account/copy.ts`, `components/consent/copy.ts`, `lib/permission-copy.ts` | Feature copy files in the app that hold their own strings (the others re-export from `packages/content`) | BRIEF coordination rule: strings live in `packages/content`; duty 1 | `content` with `mobile` |
| `docs/emails/CATALOG.md` principle 3 and the `trial-ending-final` and `family-letter` rows | Still say a server push is used for one billing notice and for family letters | E79 and LEGAL-REQ-054: no server push in 1.0 | `content` (02-email-lifecycle.md lists the amendment) |

## 16. Coverage: surface against key, words and test

"Words approved" is the founder's approval (G3). For lines the founder decided as a rule (the promise, D-061; "Word for word", D-074 and D-086; "Not much today", D-084) I write the decision. For every other line on develop I found no record of approval, so the cell says "none recorded"; lines in a WORDS file or the packet say "PROPOSED 20 Nov". The test column names the file that reads the key; it is not a run result.

| Surface group | Key exists | Words approved | Test that reads it |
|---|---|---|---|
| Store and website (3.1 to 3.9) | Built (marketing, legal own) | none recorded; claims need counsel rows | `rules.test.ts` (length, adult audience, digital only, Apple platforms), `claims-capabilities.test.ts`, `legal-docs.test.ts` |
| First run: welcome, age, agree, promise (4.2 to 4.5, 4.10) | Built | the promise: founder decision (D-061, D-074, D-086); the rest none recorded | `rules.test.ts`, `experience-pass.test.ts`, `build12-untrue-copy.test.ts` |
| First run: sign-in, consent, claim, new phone (4.6 to 4.8) | Built in part; claim and new phone PROPOSED (file) | PROPOSED 20 Nov | `server-surfaces-auth.test.ts`, `build12-untrue-copy.test.ts` |
| First run: child, signs-as, names, reminder, finish (4.11 to 4.19) | Built | none recorded | `rules.test.ts`, `nameless-child.test.ts` |
| Capture (5.1 to 5.20) | Built; day-zero missing; photo, Find, Share PROPOSED (file) | "Not much today": D-084; the rest none recorded | `rules.test.ts`, `experience-pass.test.ts`, `tab-labels.test.ts` |
| Plus and plan (6.1 to 6.6) | Built | none recorded; counsel registered rows | `pricing.test.ts`, `server-surfaces-auth.test.ts`, in-app-disclosures registry |
| Book and reading (7.1 to 7.12) | Built; Find, seals, past letter PROPOSED (file) | none recorded | `rules.test.ts` (moments, comparisons), `experience-pass.test.ts` |
| Family (8.1 to 8.9) | Built in part (v1.1 keys marked); co-parent flow PROPOSED (file) | none recorded | `server-surfaces-family.test.ts`, `rules.test.ts` |
| Keeping and deleting (9.1 to 9.13) | Built; photo and new-phone lines PROPOSED (file) | PROPOSED 20 Nov; counsel reads | `server-surfaces-account-deletion.test.ts`, `rules.test.ts` |
| Me, Reminders, Days (10.1 to 10.9) | Reminders built; Days and culture missing | PROPOSED 20 Nov | `rules.test.ts` length and rhythm; no test yet reads `days.*` or `culture.*` |
| Empty states (11.1 to 11.7) | Built; three missing | none recorded | `rules.test.ts` |
| Notifications and reminders (12.1 to 12.13) | Built (evening, month, birthday, plan); catalogue, placeholders, neutral month and birthday missing | PROPOSED 20 Nov | `rules.test.ts` ("notifications fit on a lock screen", "no daily rhythm", exclamation budget). No test yet reads E82 (names off: no digit, no "year") |
| Moments and success (13.1 to 13.8) | Built; year complete missing | none recorded | `rules.test.ts` "moments celebrate without comparing" |
| Errors and system (14.1 to 14.13) | Built; system lines PROPOSED (file) | none recorded | `rules.test.ts` "save failure reassurance", `build12-untrue-copy.test.ts` |
| Emails | see 02-email-lifecycle.md | none recorded | `emails.test.ts` |

## 17. Tests this map says are missing

What a content test would have to prove, as plain rows, so `qa` and `content` can write them. None exists today.

1. Every key named in a row of sections 4 to 14 exists in `packages/content`, or the row says it is PROPOSED or missing (a map-to-keys parity test, run when a key is added).
2. With names off or App lock on, no notification string a planner can pick carries a digit, "year", a month number or an age (E82, BL-966).
3. Every notification string is under 40 characters (title) and 110 (body), has no exclamation mark and no `{child}` next to a day name (E45, R38).
4. No notification or email key is filled by anything other than a weekday, a month number or a child name (NS-13-R24): the template placeholders in notification keys are a closed list.
5. `days.*` and `culture.*` strings contain none of the claims-forbidden phrases of card 21 NS-47 section 19 ("your religion", "your faith", "your tradition", "we know your traditions", "personalised to your beliefs").
6. A key marked v1.1 is not reachable from any 1.0 screen (a build-profile test: the family and push keys).
7. The glossary: no parent-facing key contains take, entry, draft, pack, transcript or chapter outside the allowed forms (CR-25) (exists in part in `rules.test.ts`).

## 18. Decisions the founder owns

Only the ones that are his, each with the default that stands until he answers. Everything else in this file is `content`'s to propose and the founder's to approve line by line.

| # | Decision | Default |
|---|---|---|
| 1 | Approve the words in this map line by line, in the order of the words packet (Part 1 first). Nothing here is live | Nothing ships on an unapproved line |
| 2 | Month and birthday messages with names off use a plain neutral reminder (Proposed change in section 12) rather than `days.lock.body.neutral` | Yes, as proposed; needs an erratum (next free after E82) |
| 3 | A "year complete" moment (13.4) | Yes, in-app only, never on a lock screen |
| 4 | What Home asks after the fifth birthday | Keep the Book running on (year rows to "year {n}", B WORDS) and keep rotating the last prompt band; no "graduation" line |

Signed, `content`.
