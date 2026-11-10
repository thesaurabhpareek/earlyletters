# NX-40: First run and sign-in, end to end: a short story intro, then an account, then the book, then the way back in

Status: v1, 10 Nov 2026 (UTC). Docs only. Author: `product`, for the first-run and sign-in team (brief: Karma). Nothing here is reserved in `DECISIONS.md`. Backlog rows BL-891 to BL-897 are in `docs/BACKLOG.md` (ids from `scripts/agents/next-id.mjs` on 10 Nov; run `id-collisions.mjs` before merge, other team members may have taken the same numbers). NX-37 is unused; NX-40 is the next free id (NX-39 is the highest in the repo and on open PRs).

Tag: EVIDENCE = a repo file or an Apple page read this session (named). HYPOTHESIS = anything about what a parent feels or does. UNVERIFIED = not read. Every privacy or promise line is COUNSEL-READ, not cleared.

| | |
|---|---|
| Founder direction (10 Nov, quoted in the team brief) | First open: Instagram-like stories with value props, nicely animated like the website, an option to skip, then log in or sign up; and "next time you come in Face ID and everything works" |
| Already decided | Sign-in REQUIRED in Build 12; sign-up must work; account before the book opens; co-parent surfaces say "coming soon"; fallback rule below |
| Builds on, does not re-specify | NX-31 (first run, R1 to R29, door lines, gates G1 to G7), NX-36 (screens S0 to S17), NX-32 (account management), NX-03 (age and agreement), NX-02 (methods), NX-05 (reviewer path), NX-04 and NX-08 (deletion, withdrawal) |
| Sibling team files (read on their branches, not edited) | Journey and state map: `docs/design/specs/FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md` (branch `docs/first-run-journey-10nov`; not yet pushed when I wrote this, so section ids below are by name, not number). Motion, words, research, tests, animation feasibility: see the brief |
| Size | M for tier A new work (most of A is already on the PR stack); M for tier B; tier C later |

## 1. Goals and non-goals

Goals
1. A parent opens the app once, at night, one-handed, and within a minute knows what this is, has an account, and is writing the first letter. HYPOTHESIS targets live in NX-31-R15; this file adds none.
2. The first screens look and move like the website (same tokens, same quiet), and never cost the parent a decision they cannot make.
3. The second open is easy: the book is there, and Face ID is available where the parent chose it.
4. Every failure (no network, wrong code, a killed app) leaves the parent somewhere that makes sense and loses nothing typed.

Non-goals
- No new sign-in provider, no password, no phone number, no quiz, no tour after sign-in (NX-31 section 9 rejects).
- No change to the age gate, agreement or sensitive-data consent wording (NX-03, NX-31 owns).
- No claim that recordings are backed up (backup is off in Build 12, NX-31-R21).
- No streaks, counts of gaps, points, badges, countdowns or "only N" anywhere in the intro.
- The co-parent journey itself. Surfaces show "coming soon" only (founder, Build 12).
- No app lock that replaces the account session. Face ID here is the book lock (section 6), not how the account is proved.

## 2. Personas

| Persona | Situation | What they need from first run |
|---|---|---|
| P1 New parent at night | One hand holds the baby, a dim room, low battery, 11 pm, 30 seconds of patience, may not remember a password for anything | Big targets in the thumb zone, no typing beyond an email, a skip that is obvious, no loud sound or light, a clear way back if they are interrupted |
| P2 Second parent, later | Gets the app on their own phone weeks later; co-parent invites are "coming soon" in Build 12 | In Build 12 they are simply another new user with their own account and book; "I was invited" stays a text link and says "coming soon" where the feature is not on. They must not be told they can join a book today |
| P3 Returning parent, new phone or reinstall | Has an account and maybe a book | Same two buttons as everyone, the book arrives, no child step (NX-31-R12, S17 in #764) |
| P4 Assistive-tech user | VoiceOver, large text, Reduce Motion | Every story and screen works without sight or motion (R9) |

## 3. What exists and what the stack gives (EVIDENCE, read 10 Nov)

- Providers in the repo: Sign in with Apple (`apps/mobile/src/lib/auth/apple.ts`), Google (`google.ts`), email one-time code or link (`email.ts`), passkey (`passkey.ts`). The sign-in sheet (`src/app/(auth)/sign-in/index.tsx`) shows Apple when available, Google only if both Google client ids are in the build environment, and a passkey link only if `EXPO_PUBLIC_PASSKEYS=1`. No profile in `apps/mobile/eas.json` sets a Google client id or the passkey switch, so **Build 12 offers two ways in: Apple and email.** The founder's "each provider that exists" therefore means those two; Google and passkeys are built but off, and stay off (NX-31 section 4: no Google in Build 12).
- Apple guideline 4.8 (read 10 Nov at developer.apple.com/app-store/review/guidelines): another login service is required if the app uses a third-party login for the primary account, and is not required if the app exclusively uses its own account system. Apple plus our email code satisfies it whether or not Google is on. Turning Google on later is allowed while Apple stays. Guideline 5.1.1(v) (same page): an app without significant account-based features should be usable without a login; account creation requires in-app deletion. That is NX-31 section 6.1's accepted risk and gate G5; this file adds nothing to it.
- Conflict found in code: `apple.ts` line 51 requests `FULL_NAME` and `EMAIL`; NX-31-R9 says the scope is email only. For `design-systems`/`mobile`: resolve in BL-896 (the product choice is email only; a parent's name is never used).
- App lock (`src/lib/app-lock/machine.ts`, `controller.ts`): off until the parent turns it on; locks on cold start and after a grace (immediately, 1 minute default, 5 minutes); uses `expo-local-authentication` with device-passcode fallback allowed (`disableDeviceFallback: false`); if the passcode is removed the lock turns off and says so once. It is independent of the account session.
- Reduce Motion is read in `src/lib/motion.ts` (`AccessibilityInfo.isReduceMotionEnabled` and a change listener).
- Stack, in merge order: #700 (db: optional child name), #701/#716/#703 (name optional on phone, surfaces, copy), #720 (three tabs when servers on), #722 gate, #724 Welcome and sign in plus outage and offline, #728 code, consent, child step, #737 new account and claim, #738 You tab states, #764 S17 "Opening your book" (draft, stacked on #738). #764 edits `gate.logic.ts`, `use-first-run-route.ts`, `onboarding.tsx` and `book.tsx`. **Collision rule:** the story intro (R1 to R9) must mount before the age gate through its own file and its own gate step; it must not edit those four files until #764 merges, and BL-892 names that dependency.

## 4. Numbered requirements

Each row: Given, When, Then. Ids are `NX-40-R#`.

| Id | Requirement |
|---|---|
| R1 | Order. Given a fresh install, When the app opens, Then the order is: story intro (tier B, or absent in tier A), age and agreement (NX-03), Welcome and sign in (NX-31 screen 2), code, consent, child, signature, book open, first letter. Nothing after the intro is reordered by this file |
| R2 | Skip. Given the intro on any frame, When the parent taps Skip, Then they land on the same screen as finishing, in one tap, Skip is visible from the first frame, its target is at least 48 pt, and it is reachable with one thumb (bottom half) |
| R3 | The intro asks nothing, records nothing about the person, needs no network and shows no OS permission sheet. Its only stored fact is "intro seen on this phone" in local settings, erased by "Erase everything on this phone" |
| R4 | Length and rhythm. Given the intro, Then it has 3 to 4 frames (proposed), each holds long enough to read at the default text size, auto-advance is paused while the finger is down, and a tap on the right or left moves forward or back. A first-time parent can finish in under 20 seconds or skip in 1 tap (HYPOTHESIS targets) |
| R5 | Truth. Given any intro line, Then it is true for the Build 12 binary: no "kept safe", no backup, no sharing today, no AI writes or tidies the words, no number of letters, no child name. Lines are COUNSEL-READ; the final words are `content`'s (`FIRST-RUN-WORDS-10nov.md`) |
| R6 | One sign-in entry. Given the end of the intro or Skip, Then the next screen after the age answer is NX-31 screen 2 with Apple and email at equal weight (NX-31-R8, R17); the intro itself shows no sign-in button |
| R7 | Providers. Given the Build 12 production profile, Then the screen shows only the providers whose preconditions are in the build (Apple, email); a test asserts that Google and passkey are absent when their switches and ids are absent |
| R8 | A seen intro is not shown again on the same install, including after sign-out. After a reinstall it is shown once more (nothing synced to say otherwise). A signed-in phone that holds a book never sees it |
| R9 | Accessibility and motion. Given Reduce Motion on, Then frames are still, there is no auto-advance, and the parent moves with Next. Given VoiceOver on, Then each frame is one element read in order with a "Next" and "Skip" action, nothing auto-advances, and focus lands on the frame title when it changes. Given text at AX5, Then no line clips and the Skip and Next buttons stay on screen |
| R10 | Night use. Given a dark system appearance or low-light, Then the intro uses the dark theme tokens; no flashing; no sound by default (no autoplay audio); haptics are optional and off under Reduce Motion |
| R11 | The returning-on-same-phone path. Given a phone with a session, When the app opens, Then Tonight opens (or the lock if on); neither the intro nor the sign-in screen is shown (NX-31-R17 only blocks the signed-out) |
| R12 | Lock offer. Given a parent who finished the first letter, Then Face ID (or Touch ID, or passcode) is offered once in the place NX-31-R14 puts it (session 3, proposed), with Shown, Records, Never and Decline in section 8; the text says it locks this book on this phone and is not how they sign in |
| R13 | Lock behaves as the code does. Given the lock on, When the app opens cold or returns after the grace, Then the cover shows and Face ID is asked once; a cancel or failure leaves one "Unlock" button that offers Face ID again; the passcode opens the book when Face ID is off, unrecognised, or locked out; no letter is visible in the app switcher |
| R14 | Session separate from lock. Given a valid session, Then reopening never asks for the email code again; the lock is the only gate on a signed-in phone. How long a session lives is UNVERIFIED (Supabase project settings were not read); BL-897 records it |
| R15 | Session end. Given a session that ended (expiry, forced sign-out, deleted elsewhere), Then NX-31-R22 and R26 hold: reading, recording and export on the phone keep working and a plain "Sign in" card appears; nothing is wiped |
| R16 | Every failure in section 6 has a visible next step, no error code shown to a parent, no dead end, and nothing typed is lost (NX-31-R4) |
| R17 | Content rules. Every new string passes `packages/content/test/rules.test.ts` (no em dash, en dash, curly quote, ellipsis character, emoji; no fear, guilt, loss; no gendering; `{child}` never the name; BRAND.md glossary words) |
| R18 | Analytics. See section 9: only allowlisted, content-free events; nothing runs unless the parent opted in (D-124 item 3) |
| R19 | Tier-B gating. The intro is behind a build switch (proposed `EXPO_PUBLIC_FIRST_RUN_INTRO`), off in `production` until the founder rules, and off or on in `testflight` as the founder chooses; with it off the first screen is the age gate exactly as the stack builds it |
| R20 | Website match. Colours, type, spacing, motion tokens come from `packages/design-tokens`; the motion designer's timing (`FIRST-RUN-MOTION-SPEC-10nov.md`) is the only source of durations and easings; this file sets none |

## 5. Happy paths: user stories with acceptance criteria

Format: As a ..., I want ..., so that ... Acceptance is Given/When/Then. Screen names are NX-31 and NX-36's; the journey lead's state map names the states.

**H1 First launch to first letter (P1).** As a new parent on a first night, I want to open the app and be writing within a few minutes, so that I do not lose the moment.
- Given a fresh install online, When I open the app, Then I see the intro (tier B) or the age question (tier A), and I am never shown a tab bar before I have an account (R1, NX-31-R17).
- When I answer 18 or older and agree, Then the next screen is Welcome and sign in.
- When I sign in with Apple, Then there is no code step; I reach the child step; I may leave the name empty (NX-31-R3).
- When I tap Keep on my first take, Then the letter is kept and one reminder card follows (NX-31-R6). No lock, analytics or sharing ask appears in session 1 (NX-31-R2).

**H2 Skip the stories (P1).** As a tired parent, I want to skip, so that I get to the sign-in without watching.
- Given any frame, When I tap Skip, Then I reach the same screen as the last frame's Continue within one navigation (R2), no confirmation, and the intro is marked seen (R8).
- Given I skip, Then nothing is sent anywhere and no "are you sure" appears.

**H3 Sign up with email (P1, P2).** As a parent without Apple on this phone, I want a short code by email, so that I need no password.
- Given the email screen, When I enter an address and tap Continue, Then "Check your email" shows with a code field and the link works on this phone (`authCopy.code.*`).
- When I type the right code within 15 minutes (900 s), Then I move to the sensitive-data consent screen, then the child step.
- Given no mail after 60 seconds, Then Send again, Use a different email and Continue with Apple are shown together (NX-31-R11).

**H4 Sign up with Apple (P1).** As a parent, I want one tap, so that I need no typing.
- Given the Apple button, When I confirm on Apple's sheet, Then the session starts, the same consent and child steps follow, and no email field is shown.
- Given I cancel at Apple's sheet, Then I return to Welcome with nothing recorded as a failure.

**H5 Providers that do not exist (P1).** As a parent, I do not want a button that does nothing.
- Given Build 12, Then no Google and no passkey button show (R7). If the founder turns Google on later, Apple stays equal in weight and a separate row of this file is opened.

**H6 Log in on a second phone (P3).** As a parent with a book, I want the same two buttons on a new phone, so that my book appears.
- Given a new phone, When I pass the age question and sign in by the method I used before, Then "Opening your book" shows (S17, #764), then Tonight with my letters; no child step, signature step, reminder or lock card appears in that session (NX-31-R12).
- Given a different method or email than last time and no book, Then `authCopy.noBook.*` appears with Try another way and Start a book.
- Given backup is off, Then the screen says the words arrived and the recordings are still on the old phone (NX-31-R13).

**H7 Return the next day with Face ID (P1).** As a parent with the lock on, I want my book to open with a glance.
- Given lock on and the app killed overnight, When I open it, Then the cover shows, Face ID asks once, and on success Tonight opens, with no code and no sign-in screen (R11, R13, R14).
- Given the lock is off (the Build 12 default until the offer in session 3 or Settings), Then the app opens straight to Tonight. The founder's "next time you come in Face ID" is true only after the parent has turned the lock on: see founder decision FD-3.

**H8 Face ID declined, passcode fallback (P1).**
- Given I cancel or Face ID does not recognise me, Then the cover stays, one Unlock button remains, and tapping it asks again; no loop of prompts (machine rule: the lock asks once on its own per lock).
- Given Face ID is turned off for the app in iPhone Settings, Then the passcode opens the book and the screen says so (`faceIdDenied`).
- Given I decline the offer card, Then "Not now" holds 30 days (proposed, NX-31-R14) and Settings > Privacy > App lock stays available.

**H9 Session expired (P3).** As a parent whose session ended, I want to keep my work.
- Given an expired session on a phone with a book, When I open the app, Then I can read, record and export (R15); a "Sign in" card shows on You and Tonight at most once a day, never during a take, review or writing (NX-31-R27).
- When I sign in again with the same method, Then the same book continues; if the account differs, the claim rule of #737 applies (not re-specified here).

## 6. Unhappy and edge paths

Columns: what happens, what the parent sees (words are `content`'s), source of the behaviour.

| Id | Case | Required behaviour | Source |
|---|---|---|---|
| U1 | Offline at first launch | Intro and age gate work. Welcome says sign-in needs a connection, retries itself on reconnect, shows no error code; after an age answer Yes, the quiet "Start the book on this phone for now" appears only with a failure or offline (build constant) | NX-31-R18, R19; #724 |
| U2 | Slow network | A spinner under 10 s with the button disabled once; at 10 s the outage screen with retry and back-off and the line that letters are safe | NX-31-R18 |
| U3 | Wrong code | Same screen, plain "That code did not work", the field is cleared, three tries do not lock the parent out of a fresh code; a code past 900 s says it ran out and offers a new one; no second account is made | NX-31 section 5.1; `authCopy.errors.expired` |
| U4 | Email already used | The same flow signs them in; the screen never says whether an address exists. If it is an Apple-created account with a relay address and the parent types another email, they get `noBook` and "Try another way" | NX-31 5.1, R12 |
| U5 | Account deleted | If deleted elsewhere while the phone holds a book: R15. If a deleted account's email signs in again, it is a new empty account and the screen says "No book here yet" | NX-31-R22, NX-32, NX-04 |
| U6 | Blocked region | Refusal at sign-up only, not at app open; words from NX-03-R7 (held). Not designed here | NX-03 |
| U7 | Under 18 | NX-03-R2 stop screen; nothing stored beyond the time; the intro (tier B) may already have shown, which is harmless since it asks and stores nothing (R3) | NX-03 |
| U8 | Apple private relay email | A relay address is accepted as the account email; mail to it must arrive (sender domain registered with Apple, a gate in NX-31-R20). The app never shows the real Apple email and never asks for another. Apple's name is not used (conflict with `apple.ts`, BL-896) | NX-31-R9, NX-02 |
| U9 | App killed mid-signup | Reopens on the first screen not completed; a still-valid code is offered again; a signed-in parent is never sent back to Welcome; typed child values are kept; the age answer is not asked again | NX-31-R4, 5.2 |
| U10 | Restore after reinstall | A reinstall starts at the age question (the answer is stored on the phone and is not restored); a session is not assumed; sign-in finds the book (H6); local-only books made by the fallback are lost with the app unless exported, and the fallback copy must not promise otherwise. Whether iOS restores any app files from an iCloud backup is UNVERIFIED | NX-31 5.3, R13 |
| U11 | Reduce Motion | R9; the story is readable as still frames; no parallax | motion.ts |
| U12 | VoiceOver | R9; the sign-in buttons read their purpose; the Terms line is read before the buttons (NX-31-R8); the code field announces errors | NX-31-R8 |
| U13 | Notification or deep link while signed out | Lands on Welcome, not on a letter (NX-31-R17). After sign-in, the link target opens only if it belongs to this account | NX-31-R17 |
| U14 | Interruption (call, switcher) during Apple sheet or email app trip | Returning resumes the same screen; the code field keeps typed digits | NX-31-R4 |
| U15 | Lock on and the passcode is removed | The lock turns off and says so once; the book is not blocked | machine.ts |
| U16 | Lock on, then first-run session 1 | Not reachable: the lock cannot be on before session 3 on a new install | R12 |
| U17 | Device without Face ID or passcode | The lock offer does not show; Settings explains `noPasscode` | copy.ts |
| U18 | Face ID locked out after too many failures | iOS asks for the passcode (the code allows the fallback); the app shows nothing special | UNVERIFIED for exact iOS behaviour; device row in the QA plan |

## 7. Scope tiers and recommendation

| Tier | Contents | Needs |
|---|---|---|
| A, must have for Build 12 | Account-first path as the stack builds it (NX-31 R17 to R19, R22, R26, R27); Welcome and sign in with Apple and email only (R6, R7); returning-user path incl. S17 Tier 0 (H6); lock offer wording correct and true (R12, FD-3); unhappy paths U1 to U15 in the QA plan; accessibility rows R9 for the screens that exist; Apple name scope fixed (BL-896) | #700, #720, #724, #728, #738, #764 merged; NX-31 gates G1 to G7 |
| B, stretch behind a flag | Story intro of 3 to 4 frames, skip, replay-free (R1 to R10, R19), static art first, one light motion per frame | Words (content), timing (motion), feasibility (mobile), counsel read of the lines, #764 merged |
| C, later | Richer animation (parallax, per-frame scenes matching the website), a sound option, an intro per language, an intro variant for an invited second parent when co-parent exists | Build 12 data; founder |

Recommendation: ship A; build B now in parallel behind `EXPO_PUBLIC_FIRST_RUN_INTRO`, off in `production`, on in `testflight`, and let the founder switch it on for the public build only if its device row passes on the decision day with no open A gate. Reason: the stack is the critical path (a chain of nine PRs, each stacked on the previous, and a new head voids reviews per #764), A carries the account rejection risk, and a story intro adds copy for counsel to read. If B is not ready it ships in 1.0.1, which costs the founder's "first impression" ask one release. This is a recommendation, not a ruling; Karma rules on tiers.

## 8. Door lines (COORDINATION section 10; PRIV-R21; COUNSEL-READ, not cleared)

- **Story intro.** Shown: a few frames of plain value lines (content's words). Records: "intro seen" on the phone only. Never: a question, a sign-in button, an account claim, a count, a promise about backup or sharing. Decline: Skip.
- **Sign-in and consent.** Unchanged: NX-31 section 8, screens 1, 2, 2b. This file adds no ask.
- **Lock offer.** Shown: the S1-131 card (`app-lock/copy.ts`; Face ID, Touch ID or passcode variant). Records: a device setting only; the OS records biometric enrolment, not us. Never: our own PIN, a server record, "your account is secured by Face ID". Decline: Not now (30 days, proposed); Settings > Privacy > App lock; turning it off in one tap.

## 9. Success metrics that respect the privacy rules

Honest frame: analytics is opt-in and off in every 1.0 profile (D-124 item 3), and the opt-in ask comes after the reminder answer (NX-31 section 2). So a new parent in first run is not measured by analytics. Do not read the dashboard as the first-run funnel.

| Measure | How | Allowed? |
|---|---|---|
| Time to first kept letter, Apple and email paths; taps to Speak | Scripted runs on an iPhone SE 3 (Maestro) and a small study; no telemetry | Yes (NX-31-R15 targets, HYPOTHESIS) |
| Intro skip rate, frames seen | Existing opt-in events cannot say it. Proposed new allowlisted events `intro_shown`, `intro_skipped`, `intro_finished` with one enum prop (frame bucket 1 to 4 or "end"); `analytics` adds them to `catalog.ts` with the content-free test, only for parents who opted in later | Names not in the catalog today (UNVERIFIED that none exists beyond `auth_*`); BL-895 |
| Sign-in success and failure | Existing `auth_sheet_shown`, `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `auth_deferred`, `signed_out`, with enum reasons, no address | Yes, opt-in only |
| Lock adoption | Existing settings-level facts only through allowlisted keys; no per-user biometric result | Yes if already in the catalog, else not added |
| Completion of screen 3 among those who pass screen 1 (NX-31-R15 85% target) | Study, not telemetry | HYPOTHESIS |
| Parent comprehension of the intro lines | Five-parent read-through by `user-research` (the researcher's file) | HYPOTHESIS |
| Never | Any entry text, transcript, audio, child name, email address or device identifier; "yes-rate" as a goal for the lock offer | Rule |

## 10. Dependencies, release plan and the fallback rule

Dependencies (EVIDENCE: titles and heads read 10 Nov via REST; states may have moved): #700 (db, name optional) before the build is deployed to the server; #720 (three tabs, servers on); #724 Welcome, outage, offline; #728 code, consent, child; #738 You tab states; #764 S17 (draft, stacked on #738). Between #724 and #738 sit #722, #737, #701, #716, #703 (all open on 10 Nov). Order from #764: #724, #728, #737, #738, then #764. A new head on a predecessor voids reviews of the successors; the intro work must not rebase the stack.

Release plan against the fallback rule (NX-31 section 0; brief):
1. Wed 11 Nov: the founder's "build" word for Build 12. The date is unmeasured and may slide; nothing here assumes it holds.
2. On the decision day: if gates G1 to G7 are all closed and the stack is merged and device-run, Build 12 ships account-first (tier A). If any gate is open, the on-device binary ships and account-first becomes 1.0.1; everything in this file moves with it, including tier B.
3. The intro (tier B) ships in Build 12 only if A is closed and its own device row passes; otherwise it waits for 1.0.1. A closed A gate never waits for B.
4. Both paths stay in the code behind `EXPO_PUBLIC_SERVER_FEATURES`; the intro has its own switch, so the fallback does not need a code change for B.

## 11. Founder decisions (few; each with a recommendation and a default if unanswered)

| Id | Decision | Recommendation | Default if no answer |
|---|---|---|---|
| FD-1 | Does the story intro ship in Build 12, or in 1.0.1 (tier B, section 7)? | Build it now; decide to switch on at the Build 12 decision day if tier A is closed | Off in `production`; ships in 1.0.1 |
| FD-2 | Does the intro show before the age question (the founder's order) or after it? | Before: it asks and stores nothing, so it is safe, and it gives the parent a reason before the legal questions | Before |
| FD-3 | "Next time you come in Face ID": the lock offer is in session 3 (decided 9 Nov, NX-31-R14). Keep, or offer it at the end of the first letter or on the second open? | Offer it on the second open, once, as a single card on Tonight (not on the first night: the first night is for the letter). This changes R14 of NX-31 and needs his word, not ours. HYPOTHESIS that earlier help | Session 3 stays; the founder's line is true only after the lock is on |
| FD-4 | Google sign-in later: leave off through 1.0.1? | Leave off; two ways in is enough for a first public build and 4.8 is simple with Apple plus email | Off |
| FD-5 | Apple name scope: email only (NX-31-R9) vs the full name that the code asks for today | Email only | Email only (BL-896) |
| FD-6 | Session length (R14, UNVERIFIED): how long can a phone stay signed in without asking again? | Long, as long as the Supabase refresh token allows; ops reads the setting | Whatever the project is set to; BL-897 documents it |

## 12. Conflicts and open points with other team documents

- Journey lead's file was not yet on a branch when I wrote this; section names above must be reconciled to its state ids. I did not copy its state map.
- NX-31-R14 (lock at session 3) versus the founder's 10 Nov sentence: FD-3.
- `apple.ts` scope versus NX-31-R9: FD-5.
- NX-31 G4 and G6 need the Notes for Review to name the local start; no change from this file.

## 13. UNVERIFIED list

Session lifetime; iOS lockout and passcode fallback details; whether iCloud backup restores any app data after reinstall; any WCAG or HIG rule on auto-advancing content (not read; the pause-on-press and Reduce Motion rules are my judgement); NX-31's own reading of Apple 5.1.1(v) risk beyond the page text I re-read; the intro event names not existing in the catalog; the open states of #700 to #764 after 10 Nov.

## 14. Trace

R1 to R8, R19: founder direction 1, NX-31 section 2. R9, R10: NX-35, `docs/design`. R11 to R15: founder direction 1 ("next time you come in Face ID"), F17, NX-31-R14, R22. R16: NX-31 section 5. R18: D-124 item 3, `packages/analytics`. Backlog: BL-891 (requirements and trace, this file), BL-892 intro scaffolding behind a flag, BL-893 intro screen and a11y, BL-894 test seams and Maestro rows for H1 to H9 and U1 to U15, BL-895 intro events, BL-896 Apple scope, BL-897 session length record.
