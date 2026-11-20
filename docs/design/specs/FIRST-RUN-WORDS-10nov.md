# First run and sign-in: the words

Status: DRAFT, 10 Nov 2026 (UTC). Docs only. Author: Content lead, for `content`. Not a requirement, not legal advice, not a founder decision. Nothing here is live and nothing is written into `packages/content`; the engineering agent ports it in a later PR, with the rules test, after Karma rules on the scope tiers.

Read: BRIEF (first-run programme), `CLAUDE.md`, `VOICE.md`, `BRAND.md` (glossary), `rules.test.ts`, `claims-capabilities.test.ts`, `src/stories.en.ts`, `src/features/auth.en.ts`, `src/strings.en.ts` (onboarding, trust), `src/features/family.en.ts` (soon), `src/features/account-deletion.en.ts`, `apps/mobile/src/lib/app-lock/copy.ts` and `machine.ts`, `lock-offer.tsx`, `lib/auth/email.ts`, `lib/capabilities.ts`, `eas.json`; MEMORY-LIBRARY-WORDS-10nov.md (PR #752 ref) for format; #720 at its head ref for the co-parent lines. Not read: the journey lead's doc, the motion spec, the requirements file (other branches, not fetched; section 9 says what to cross-check). Apple behaviour is not re-read here; every iOS statement is marked UNVERIFIED.

## 0. What decides the words (truth first)

| Fact in the repo today | Source | What it does to the words |
|---|---|---|
| `eas.json` `build.production` has `EXPO_PUBLIC_SERVER_FEATURES` "off". Build 12 is meant to be servers on | `eas.json` lines 59 to 67 | Any sign-in or sync line is a claim the claims test judges false until that value flips. Section 8 lists the rows |
| `capabilities.signIn`, `.sync` and `.coParent` all follow the one server switch | `capabilities.ts` | With servers on, the claims test calls a co-parent claim TRUE, but Build 12 shows "coming soon" (BL-882). The test cannot protect us here. A human must keep co-parent claims out of the story cards |
| Email uses `shouldCreateUser: true`: new and returning people look the same | `lib/auth/email.ts` | There is no separate "sign up" in the code. First sign-in creates the account. The words must not promise two doors that are one |
| Providers in the repo: Apple, Google, email, passkey | `lib/auth/apple.ts`, `google.ts`, `email.ts`, `passkey.ts` | Apple is offered, so the Apple-must-be-offered rule (guideline 4.8) is met on our side; the rule itself is UNVERIFIED |
| The app lock is a lock on opening the book (Face ID or passcode), offered once at the end of first run in the code on develop today; the ruling (NX-31-R14, 11 Nov) moves it to session 3 and out of first run. A signed-in session persists | `lock-offer.tsx`, `machine.ts` | "Face ID next time" is true of the lock. It is not true of signing in, except with a passkey. Never say Face ID signs you in unless a passkey exists |
| Glossary bans "log in", "login", "Continue with Google", "Continue with email" | `BRAND.md` | Buttons are the glossary's: Sign in with Apple, Google, email |

Rules held (applied by hand; I could not run vitest): no em or en dash, curly quote, ellipsis character or emoji; no fear, guilt, loss word; none of the words the AI rule bans (AI, smart, magic, generate, polish, perfect, enhance); "rewrite" only inside a "never"; no gendered word; `{child}` only; no count of gaps, no streak; no "stays on your phone" line; no exclamation mark (the in-app budget is 2 and the baseline may already use them); placeholders only from the test's list (`child`, `app`, `email`, `n`, `count`, `date`). A separate node check (section 10) re-reads the file's strings.

Flags. COUNSEL-READ: counsel and the founder read these exact words before they ship. It does not mean counsel wrote or cleared them. REUSE: the string already exists in `packages/content` or in a feature `copy.ts`; the key shown is the existing one. NEW: proposed under `firstRun.` in a new `features/first-run.en.ts`. HOLD: do not ship, the code for the state does not exist.

## 1. Story cards (scope tier B, behind a flag; 3 cards for Build 12, CTO ruling 11 Nov)

Ruling 11 Nov (Karma, CTO, relayed by `product`): the deck is three cards with the journey spec's ids (`FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md` section 4.2). The Private card (`story.private.v3`) is withheld until counsel reads it. Card 2 is the journey spec's `story.exact.v3`; `story.words.v1` below is withdrawn (it was never placed in code; the id is not reused). This file's text is changed in place to match; the struck rows are kept only as a record.

Shape from `stories.en.ts`: headline 80 or fewer, line 200 or fewer, `visual` one of `envelope-fold`, `letter-underline`, `moon`, `two-hands` (a new visual is a schema change in `packages/api`, so these four are reused). Ids match `story.<letters-and-hyphens>.v<n>` (no digit in the middle). A placed card needs only `{child}`, `{app}`, `{signsAs}`; none is used, because no child is named yet. Never reuse an id for new wording.

| # | Id | Headline | One line | Visual | Screen-reader text (said in order) | Flag |
|---|---|---|---|---|---|---|
| 1 | `story.talk.v1` (REUSE, unchanged) | Talk for a minute. | Tell your child about today. It becomes a letter in their book. | `envelope-fold` | "Card 1 of 3. Talk for a minute. Tell your child about today. It becomes a letter in their book." | none |
| 2 | `story.exact.v3` (NEW wording from the journey spec, chosen 11 Nov over `story.words.v1`; replaces `story.exact.v2`) | It stays in your words. | We only fix small slips, like an um, a repeat or a misheard word. We never rewrite your words. | `letter-underline` | "Card 2 of 3. It stays in your words. We only fix small slips, like an um, a repeat or a misheard word. We never rewrite your words." | COUNSEL-READ |
| 3 | `story.voice.v1` (REUSE, unchanged) | Read together, in your voice. | Years from now, your child can hear how you sounded tonight. | `moon` | "Card 3 of 3. Read together, in your voice. Years from now, your child can hear how you sounded tonight." | none |

Withheld, not in the Build 12 deck: card 4 `story.private.v3` ("Private by default. You choose what goes in the book. Never sold, never used for ads.", `two-hands`). It stays in this file as a draft for counsel and ships only after counsel reads it and the founder approves. The journey spec's optional `story.account.v1` is also not in the deck.

Why these (the card 4 and old card 2 notes below describe the withdrawn drafts; they are history, not the deck):
- Card 2 (withdrawn draft `story.words.v1`, "Your words stay yours.", with "and mark each one"): replaced by `story.exact.v3` on 11 Nov. The reasoning about the old headline follows. The old headline "Exactly as you said it." is a known false claim (`exactWords` row, D-133, removed by #502). The new headline makes no claim about exactness. The line is the glossary's one sentence about small fixes, plus "mark each one", which is true of Word for word (each fix is a mark that can be undone). "Rewrite" sits inside "never", so the rewrite rule passes.
- Card 4: the old line says "the people you invite", a co-parent claim Build 12 cannot keep while it shows "coming soon". The new line has three promises: "you choose" (true: a letter is kept or kept private at the destination step), "never sold" and "never used for ads" (registered text, `in-app-disclosures.md`). It leaves out "never used to train models" to stay short; add it only if counsel prefers all three of D-061.
- Card 3 keeps "tonight": the recording is kept with the letter (BRAND pillar 2). "Read together" is two words, capital R only.
- No card says "on your phone", "free", a price, a language count, or "co-parent". A fifth card about accounts ("your letters come with you to a new phone") is true only with servers on; it is not drafted. The sign-in screen says it (section 3), where the person acts on it.

| Key | String | Where | Max | Notes |
|---|---|---|---|---|
| `firstRun.story.position` | Card {n} of {count} | Spoken with each card (VoiceOver), and the dots' label | 20 | `{n}`, `{count}` are in the test's list. Not a story-card field, so the story placeholder rule does not apply. Never shown as text with a "gap" feel |
| `firstRun.story.skipButton` | Skip | Top right of every card, 48 pt minimum target (11 Nov ruling) | 22 | VoiceOver: "Skip the introduction". Glossary bans "skip" only for the quiet-day action ("Not much today"); I will add a glossary row for the intro so the two do not collide |
| `firstRun.story.nextButton` | Next | Cards 1 to 2, bottom | 22 | VoiceOver: "Next card" |
| `firstRun.story.startButton` | Start your book | Card 3, replaces Next (the journey spec's label for this button is "Get started"; one of the two is chosen by `content`, not here) | 22 | Leads to the auth entry (section 3). The founder's order: stories, skip, then sign in or up |
| `firstRun.story.backA11y` | Previous card | Swipe or control for VoiceOver | 30 | Optional if the deck supports a swipe back; VoiceOver users need it |

## 2. Skip and where it lands

Skip and Start your book go to the same place, the auth entry (after the age question: the story intro comes AFTER the age gate, Karma's standing ruling, 11 Nov), so a person who skips loses nothing they need. Nothing on card 1 to 3 is required reading. No key states how many cards a person missed (no gap counting). Reduce Motion and screen-reader users see the same words with no animation timing in the text.

## 3. Auth entry (scope tier A)

Existing keys are reused wherever they say the right thing. The consent and age steps already exist (`consent.age`, `consent.terms`).

| Key | String | Where | Truth check | Flag |
|---|---|---|---|---|
| `firstRun.auth.title` | Start your book | Entry screen title | True: the first sign-in creates the account and the book follows | none |
| `firstRun.auth.body` | Sign in once and your letters come with you to a new phone. | Under the title | True only with servers on (sync). `claims` `sync` rule: false in the current production profile until `eas.json` flips (section 8) | COUNSEL-READ |
| `firstRun.auth.newOrBack` | New here or back again, the steps are the same. Use the same way as last time. | Small line under the buttons | True (`shouldCreateUser`). This is the honest answer to "sign up or log in": one set of buttons, because the code has one path | none |
| `authCopy.sheet.google` (REUSE) | Sign in with Google | Provider button | Provider exists | none |
| `authCopy.sheet.email` (REUSE) | Sign in with email | Provider button | Exists | none |
| `firstRun.auth.appleButton` | Sign in with Apple | Provider button, first in the list | Exists (`apple.ts`). Rendered with Apple's own system button where possible, so this string is the accessibility label. Order and prominence rule: UNVERIFIED (guideline 4.8) | none |
| `authCopy.sheet.passkey` (REUSE) | Use a passkey | Only when this phone has one | Exists | none |
| `authCopy.sheet.privacy` (REUSE, `en.trust.signIn.privacy`) | Only you and the people you invite can read your letters. We never sell them or use them for ads. | Under the buttons | Registered text, but "the people you invite" is a co-parent claim while Build 12 shows "coming soon". Recommend counsel replace it with a line that names no invitation (the withheld card 4 line is one draft) | COUNSEL-READ |
| `authCopy.sheet.emailUse` (REUSE) | We use your email only to sign you in and to write to you about your account. | Under the email field | Registered | COUNSEL-READ |
| `firstRun.auth.haveBookButton` | I already have a book | Optional second door, for a founder who wants two doors | 21 characters. Same destination as the buttons; do not add it unless the journey lead wants two doors. Existing: `onboarding.welcome.signInButton` | none |

CONFLICT, OPEN (11 Nov, for `content` and the founder; no copy is invented here). This section lists Google and passkey buttons and bans "Create account", "Sign up" and "Log in". NX-40 R7 and the Build 12 profile show Apple and email only (Google and passkey are built but off: no Google client id or `EXPO_PUBLIC_PASSKEYS` in `eas.json`, NX-40 section 3), and the journey spec's Option A heading is "Create your account or sign in", which uses the banned word. Content decides: (a) drop the Google and passkey rows from the Build 12 list, keeping them for later; (b) rule on the heading, either by a glossary exception for "account" in a heading or by a heading that avoids it. The founder is needed only for journey open question 1 (Option A or B), whose default is A.

Do not use "Create account", "Sign up", "Log in" or "Continue with" anywhere. "Sign up" is not in the glossary; it is only in an email line ("Did not sign up?"). Recommendation: keep one verb, "sign in", so Apple, Google and email read the same on the button and in the email (LNG-13).

### 3.1 Code entry, wrong, expired (REUSE unless noted)

| Key | String | Notes |
|---|---|---|
| `authCopy.code.title` | Check your email | Reuse |
| `authCopy.code.sentToEmail` | A link and a code are on their way to {email}. | Reuse |
| `authCopy.code.body` | Tap the link on this phone, or type the code here. | Reuse |
| `authCopy.errors.wrong_code` | That code didn't match. Check the newest email, or send a new one. | Reuse |
| `firstRun.auth.codeExpired` | That code didn't match or has expired. Send a new email for a fresh one. | NEW. UNVERIFIED whether the app can tell an expired code from a wrong one (`errors.logic.ts` not re-read). If it cannot, use this single line for both. Reuse `authCopy.errors.expired` for an expired link |
| `authCopy.errors.code_paused` | Your letters are safe. You can try a code again in 15 minutes. | Reuse, but "Your letters are safe" is odd for a first-run person with no letters yet. See 3.2 |
| `authCopy.code.resend`, `resent`, `resendWait`, `differentEmail`, `openMail` | Send a new email; A new email is on its way.; You can send another in a minute.; Use a different email; Open Mail | Reuse |

### 3.2 Error and empty states

Existing errors begin "Your letters are safe on this phone." A person on first run has no letters, so the line reads as a puzzle. Recommendation: on the first-run path, use the NEW `firstRun.*` line; keep the existing one for people who have letters.

| Key | String | Where | Truth check | Flag |
|---|---|---|---|---|
| `firstRun.auth.offline` | No connection right now. Connect to the internet and try again. | Entry, any provider, no network | True. No promise about letters | none |
| `firstRun.auth.didNotFinish` | That sign-in did not finish. Try again, or try another way. | Provider cancelled or failed | True. `authCopy.errors.provider` is the same with "Your letters are safe" in front | none |
| `firstRun.auth.invalidEmail` | That email doesn't look quite right. | Email field | Reuse `authCopy.errors.invalid_email` | none |
| `firstRun.auth.waitAMoment` | Too many tries for now. Wait a few minutes, then try again. | 429 | Reuse text of `rate_limited` without the first sentence | none |
| `firstRun.auth.emailAlreadyUsed` | That email already has a book. Sign in the way you did last time. | A provider returns an account that exists under another method | UNVERIFIED that the server returns this case; for email the case does not exist (one path). Pair with `authCopy.sheet.lastMethod.*` ("Last time you used Apple.") | none |
| `firstRun.auth.accountDeleted` | That account was deleted. You can start a new book any time. | Sign-in with an address whose account is gone | UNVERIFIED how Apple and Google behave after deletion. For a scheduled deletion, the existing `account-deletion` line is the truth: sign in and cancel | none |
| `firstRun.auth.regionBlocked` | HOLD. Draft: {app} isn't available where you are yet. | A region gate | HOLD: no region check exists in the repo (searched `lib/auth`, `app`). Writing it now would describe a state the binary cannot reach. A legal call (export or sanctions) must name the region list first | COUNSEL-READ |
| `authCopy.consent.age.body` (REUSE) | Are you 18 or older? | Age step; Yes and No pills, neutral (LEGAL-REQ-002) | Exists | COUNSEL-READ |
| `authCopy.errors.under_18` (REUSE) | {app} is currently for adults 18 and over. | After No | Exists | COUNSEL-READ |
| `authCopy.consent.terms.*` (REUSE) | Before your book syncs ... Agree and continue | Terms step | Registered; the "never used to train machine learning models" line is counsel's | COUNSEL-READ |
| `authCopy.errors.session_expired` (REUSE) | Your letters are safe on this phone. Sign in again to keep sharing them. | Returning, session lost | True for a person with letters | COUNSEL-READ |

## 4. Returning user (scope tier A)

Truth: the session persists, so a returning person usually sees no sign-in at all; the app lock (if on) is what they meet. When the session is lost they see the sign-in sheet in its "Welcome back" form.

| Key | String | Where | Notes | Flag |
|---|---|---|---|---|
| `authCopy.sheet.titles.sign_in` (REUSE) | Welcome back | Sign-in sheet, returning | Exists | none |
| `authCopy.sheet.bodies.sign_in` (REUSE) | Sign in the same way as last time to see every letter. | Same | Exists; "every letter" is true when sync is on | none |
| `authCopy.sheet.lastMethod.*` (REUSE) | Last time you used Apple. / Google. / email. / a passkey. | Under the matching button | Exists | none |
| `authCopy.sheet.busy` (REUSE) | Signing you in | While waiting | Exists | none |
| `authCopy.consent.noBook.*` (REUSE) | No book here yet / Did you use a different way to sign in last time? / Try another way / Start a book | Signed in, no book found | Exists. "Start a book" is 12 characters | none |

The Tonight screen after sign-in says nothing about this being the second visit. No "welcome back, you missed" form.

## 5. Face ID and the lock (scope tier A: correct, not new)

The lock offer exists in code. It is offered in session 3, not at the end of first run (NX-31-R14, Karma 11 Nov); this file previously said it stays at the end of first run, which is corrected. NOTE: `onboarding.tsx` on develop (checked 11 Nov) still mounts `LockOffer` on "The book is open.", so the move is not built; NX-40 U16 ("lock cannot be on before session 3") is not yet true of the binary. The words below are the existing `appLockCopy` strings plus failure states that the code does not name today. Distinction to hold in every line: the lock opens the book; a passkey signs in.

| Key | String | Where | Truth check | Flag |
|---|---|---|---|---|
| `appLock.offer.title` (REUSE) | A lock for {child}'s book | Offer card | Exists | none |
| `appLock.offer.body.faceId` (REUSE) | Face ID or your iPhone passcode opens it. Anyone else who picks up your phone sees a cover. | Offer card | True per `machine.ts`; "anyone else" is a security claim, the registry row for it is pending (note in `copy.ts`) | COUNSEL-READ |
| `appLock.offer.turnOn.faceId`, `.touchId`, `.passcode` (REUSE) | Turn on Face ID / Turn on Touch ID / Turn on the lock | Offer buttons | 15, 17, 17 characters | none |
| `appLock.offer.notNow` (REUSE) | Not now | Offer button, equal weight | Exists | none |
| `appLock.faceIdDenied` (REUSE) | Face ID is off for {app} in iPhone Settings, so your passcode opens the book. | Offer, after Face ID refused | Exists | none |
| `appLock.noPasscode` (REUSE) | This iPhone has no passcode. Set one in iPhone Settings, then turn on the lock here. | Settings, App lock | Exists. The offer card is hidden in this case | none |
| `appLock.unlock` / `unlockHint.*` (REUSE) | Unlock / Opens the book with Face ID. | Lock screen | Exists | none |
| `firstRun.lock.tryAgain` | Face ID didn't recognise you. Try again, or use your iPhone passcode. | Lock screen after a failed match | NEW. UNVERIFIED that iOS offers the passcode fallback in this flow (`machine.ts` maps `user_fallback` to "cancelled"; the system sheet decides). Say "passcode" only if the fallback is on | none |
| `firstRun.lock.lockedOut` | Face ID is paused for now. Your iPhone passcode opens the book. | After too many failed matches | NEW. UNVERIFIED (Apple behaviour) | none |
| `firstRun.lock.cancelled` | (no text) | After Cancel on the system sheet | The code says "after a cancel only Unlock asks again". Do not add a line; a nag here reads as pressure | none |
| `firstRun.lock.passkeyOffer` | Sign in next time with Face ID. | After first sign-in, optional | Same truth as `account.passkeysHelp` ("Sign in next time with Face ID or Touch ID ..."). Not drafted as a new offer: adding a passkey is an Account action today; promoting it at first run is a scope decision for Karma | none |

Do not write "Face ID keeps your book private" or "only you can open it": the first is an absolute, the second ignores the passcode and the backup.

## 6. Co-parent: the coming-soon line (for the BL-882 agent)

BL-882 reads `familyCopy.soon` and writes no copy. Cross-check against #720's head: its `family.en.ts` is word for word the same as the base for these lines, so nothing in #720 changes them.

| Key (existing) | String | Where | Truth check | Flag |
|---|---|---|---|---|
| `familyCopy.soon.title` | For now, this book is yours. | Family tab, `/invite`, Settings | True | none |
| `familyCopy.soon.lead` | In a later update, {child}'s other parent can add letters too, from their own phone. | Same | A promise about a later update: true as a plan, not a date. No claim the build keeps. The claims test passes it as "true" with servers on, which is the trap in section 0 | COUNSEL-READ |
| `familyCopy.soon.status` | Coming soon | Settings row value | True | none |
| `familyCopy.soon.settingsRowHelp` | Sharing a book with a co-parent is coming in a later update. | Settings row | Same as `lead` | COUNSEL-READ |
| `familyCopy.soon.quiet.body` (`flags.familyTeaser = 'quiet'`) | {child}'s book and every letter in it stay on this phone. | The quiet variant | FALSE in Build 12 (servers on, letters sync). This is a "stays on your phone" line (PRs #768 and #769). Recommend: delete the `quiet` branch or replace the body with "For now, this book is yours." | COUNSEL-READ |

Recommendation: keep the single line for Build 12 and ship nothing else. One more word to avoid: "Notify me" and "Tell me when it's here" (SET-08 removed it; no build keeps that promise).

## 7. Existing lines that Build 12 makes untrue (found while reading)

| Key | Line | Problem | Proposal |
|---|---|---|---|
| `authCopy.sheet.bodies.first_letter`, `.settings`, `account.signedOutBody` | "... and {child}'s other parent can write in the same book." | Co-parent writing is "coming soon" | "Your letters come with you to a new phone." (the three keys are word for word one sentence; change all three) |
| `authCopy.sheet.titles.invite`, `invite_create` | Sign in to join / invite | The doors are hidden or "coming soon" | Leave in code; they cannot be reached. Do not show |
| `en.onboarding.promise.title` | Exactly as you said it. | Known false (`exactWords`, #502) | The card 2 headline above ("It stays in your words."); #502 owns the change |
| `en.trust.firstRecording.body` | "Your words are written down on this phone, and the recording stays with your letter." | "On this phone" is true of where the words are made, but a reader hears "stays here" | COUNSEL-READ; suggest "Your words are written down as you talk, and the recording stays with your letter." |

## 8. Claims-ledger rows and the rules-test risks (for the engineers)

What the tests check and what will surprise:

| Test | What it checks | Risk for this file |
|---|---|---|
| `rules.test.ts` characters | No em or en dash, curly quote, ellipsis character, emoji, in `en`, `features`, stories, store, site | My strings use straight quotes and no dash. Section 3's "Did not sign up?" is not touched |
| `rules.test.ts` buttons | Any path ending `button`, `cta` (case-insensitive tail) or containing `.button`/`.cta`: 22 characters or fewer | Name the key `...Button`; the longest here is 21 |
| `rules.test.ts` AI rule | Bans AI, smart, magic, generate, polish, perfect, enhance (whole word); "rewrite" only with never/not/no within 40 characters | The card 2 line passes because "never" is 5 characters before "rewrite" |
| `rules.test.ts` fear | Bans too late, don't miss, you haven't, you forgot, streak, regret, die, dead, ... | None used |
| `rules.test.ts` exclamations | 2 in all in-app copy, 3 in all copy | Zero here, so nothing is taken from the budget |
| `rules.test.ts` placeholders | Fixed list; story cards only `child`, `app`, `signsAs` | `{n}`, `{count}` in `firstRun.story.position` only |
| `rules.test.ts` story schema | headline 80, line 200, id `story.[a-z-]+.v\d+`, `order` equals position, visual in `STORY_VISUALS` | Existing visuals only; new ids; `order` 1 to 3 in the deck (three cards, CTO ruling 11 Nov) |
| `rules.test.ts` store listing | No "sign in" or "co-parent" in `storeListing` | Do not copy section 3 or 6 lines into the store listing |
| `rules.test.ts` CR-25 | No "entry", "draft" (noun), "take" as a recording, "language pack" | None used |
| `rules.test.ts` brand name | The public name only through `{app}` | `{app}` used in two lines, never typed |
| `server-surfaces-auth.test.ts` | Pins every changed or new line in `authCopy` word for word; no "we" outside registered keys (the `authCopy` row of `copy-surfaces.ts`) | The `firstRun.auth.*` lines say "you", not "we". Moving any `authCopy` line needs that test's pin edited in the same PR |
| `claims-capabilities.test.ts` | Reads story cards, `en.onboarding.*`, `en.trust.*`, `features.billing`, `features.language.picker`, `permissions`, store, web. Judges by pattern: `sync` (sign in, sync, account, cloud), `coParent` (co-parent, other parent, same book, invite), `backup`, `exactWords`, `languages` | Card 2 and card 4 remove two known violations (`stories.story.exact.v2.headline`, `stories.story.private.v1.line`); the engineer must remove those rows and lower `KNOWN_VIOLATIONS_CAP` (17) in the same PR, or the test fails because a listed claim is gone |
| `claims-capabilities.test.ts` profile | Production profile is read from `eas.json`; servers "off" today | `firstRun.auth.body` and any "sign in" line that lands in a scanned path (`en.onboarding`, `en.trust`) is a NEW false claim until the profile flips. Put the strings under `features.firstRun` (not scanned) or flip the profile in the same PR |

Claims-ledger rows (the new promise lines; counsel owns the ledger text):

| Id (proposed) | Line | Says | Backed by | State |
|---|---|---|---|---|
| FR-C1 | `story.private.v3` line (WITHHELD from the Build 12 deck, 11 Nov) | You choose what is kept; never sold; never used for ads | Destination step, registered text | Needs counsel read before it can be added |
| FR-C2 | `story.exact.v3` line (was `story.words.v1`) | Only small slips are fixed; never rewritten | `verifyEdits`, Word for word marks | Needs counsel read |
| FR-C3 | `firstRun.auth.body` | Letters come with you to a new phone after sign-in | Sync, servers on only | Counsel; blocked until Build 12 flips the switch |
| FR-C4 | `familyCopy.soon.lead` | Other parent can add letters in a later update | A plan | Counsel; no date |
| FR-C5 | `appLock.offer.body.*` | Others see a cover | `layer.logic.ts` | Counsel; registry row pending per `copy.ts` |

## 9. Cross-check with the other team docs (not yet read)

When the journey lead, product, motion and qa docs land, check: (a) the journey lead's placeholder strings against section 1 to 5, where mine win; (b) any "log in" or "sign up" word, which the glossary bans; (c) any "stays on your phone" or "private" line; (d) any story count other than 3 and any `visual` outside the four; (e) NX requirements that need a state this file marks HOLD (region blocked) or UNVERIFIED (email already used, account deleted).

## 10. Check script

A node script with no install (the engineer or I run it before the port) reads this file's backticked strings and flags: em dash (U+2014), en dash (U+2013), curly quotes (U+2018, U+2019, U+201C, U+201D), ellipsis (U+2026), emoji ranges, a banned AI word, and any button-named key over 22 characters. I ran the character and word checks on this file by hand reading; I did not run vitest.

## 11. Open questions (each with a recommendation)

1. One set of provider buttons, or two doors ("Start a book" and "I already have a book")? Recommendation: one set, because the code has one path; add the second door only if the journey lead needs a visible returning route.
2. Does Build 12 flip `EXPO_PUBLIC_SERVER_FEATURES` before the first-run PR merges? Recommendation: land the `firstRun` strings under `features.firstRun` (not scanned) and flip in the account-first PR.
3. Do the intro cards ship at all in Build 12? Recommendation: tier B behind the flag; the auth entry (tier A) needs no card.
4. Is "Skip" acceptable beside the glossary? Recommendation: yes; I add the glossary row in my own PR.
5. Replace the registered `trust.signIn.privacy` line ("the people you invite")? Recommendation: counsel replaces it with the card 4 line while co-parent is "coming soon".
