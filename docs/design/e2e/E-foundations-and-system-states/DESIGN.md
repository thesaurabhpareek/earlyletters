# Area E. Foundations and system states: design

Status: v2, 20 Nov 2026, design lead for area E. v1 was reconciled with MOTION.md and WORDS.md (section 12) and the design system v2 material policy (section 7a). v2 re-keys area E to the final product pack: first run, sign-in, permissions order and optional fields now follow card 19 (NS-38 to NS-45), the days, cultural-background, picture-first and Home-today cards (NS-46 to NS-50, `21-days-cultural-photos-home.md`), `22-final-holistic-spec.md`, GAP-LOG rulings (RV-1 to RV-17, K1 to K17) and the function reviews (`FUNCTION-TRACE.md` section 6.5). New in v2: sections 13 (consolidated state and error inventory for every new state), 14 (foundations and tokens: DoorNote, optional field, slip variants, C9 text), 15 (Liquid Glass policy check for each new surface), 16 (function needs accounted for), 17 (contradictions to flag) and 18 (open design questions, with defaults). Docs only. Nothing here changes a card, the engineering plan or the code.
Companions in this folder: `MOTION.md` (motion lead), `WORDS.md` (content lead), `PROTOTYPE.html` (this lead).
Screen ids `E-Snn` and state ids `E-Snn.<state>` are stable from the skeleton on. The cross-area state catalogue ids `E-STnn` (section 6) are for areas A to D to point at.

## 0. Sources, precedence and what this file supersedes

Read in the brief's order (CR-66):
1. Locked cards: `19-from-download-to-first-letter.md` (NS-38 to NS-45; status Locked v1.0 candidate, 20 Nov) is now the card for first run, sign-in, agreements, the first book, the first letter and account life; `11-foundations.md` (NS-32 to NS-37) is this area's other card. Where the older text below says first run and sign-in are only "cited", card 19 now owns them and wins. First run, sign-in, Plus and the switches are "Cited" rows in `07-remaining-capability-rows.md` section 2 (C25, C44, C45, C46: F01, F03, F14, F19, NX-31, NX-36), so for them the locked pack adds only the rows other cards name: NS-10 (new phone, consent outstanding, kill switch at sign-in, second account), NS-17-R1 (ungated languages absent from every picker, first run included), NS-33 (every row on first run and on the gate sheet), NS-35 (first run ends on Home), D1 (sign-out keeps the book), D2 and D3, T2 (free stays free), the frame's guardrail "zero paywalls before a parent has seen their words", and X5 (every state table carries the kill switch, the remote pause and plan lapse).
2. `14-test-plan.md` journeys J-N2, J-N12, J-N15, J-N17, J-N20, J-N21, J-N22, J-N25, J-N27 and gates G0 to G6; `16-council-review-round-2.md` T1 to T5, D1 to D13.
3. Engineering: `13-engineering-plan.md`; PR #847 (`17-engineering-project-plan.md`, read 20 Nov through `gh api`); backlog BL-922, BL-927 to BL-930, BL-948, BL-954, BL-958, BL-961 to BL-967, BL-978, BL-984, BL-987; `/home/claude/review/eng/C-platform-quality-delivery.md` (flags, kill switch policy ADR 0029, proposed keys).
4. House design: `DESIGN_LANGUAGE.md`, `COMPONENTS.md` (2.12 Sheet, 2.13 Dialog, 2.14 Toast, 2.15 EmptyState, 2.15a StateScreen), `MOTION.md`; tokens `packages/design-tokens/src/tokens.ts`; words `packages/content/src/features/auth.en.ts`, `billing.en.ts`, `strings.en.ts` (`errors.*`).
5. History, used where a card agrees, superseded where it does not:
   - `specs/FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md` and its wireframes: used for the account-first order. Superseded where it shows any co-parent or "I was invited" door in a store build (NS-25 and the no-coming-soon rule; `visibleCoParentDoors` already hides it).
   - `specs/S17-NEW-PHONE-SPEC-10nov.md`: superseded by NS-10 (R0 held screen with two ways forward, R8 kill switch, R12 method line, R13 one Book-level line). Area C draws those screens (C-S10, C-S11, C-S12).
   - `specs/07-COPARENT-COMING-SOON-11nov.md`: superseded in full by the brief's rule "No coming soon surface in any build" and the founder answer of 19 Nov (frame section 4).
   - `specs/FIRST-RUN-MOTION-SPEC-10nov.md`, `FIRST-RUN-WORDS-10nov.md`: inputs to `MOTION.md` and `WORDS.md`; where they name the Family tab or "Tonight" as a tab name, the frame's three tabs (Home, Book, Me) win.

The app as built is the baseline. Every screen below names the file that draws it today.

## 1. Boundaries with the other areas

| Surface | Owner | Area E's part |
|---|---|---|
| Opening your book, returning consent, declined, wrong account | C (C-S10, C-S11) | E-S09 is an alias: E owns only the first-run routing that leads there |
| Book-level new phone line | C (C-S12) | none |
| Sign-out sheet, Account, Storage, Erase everything, Delete account | C (C-S02, C-S03, C-S18, C-S19, C-S20) | E owns the second-account rule they all follow (E-S18) |
| Home, Listen, Review, the Keep moment | A (A-S01, A-S04, A-S05, A-S07, A-S13) | E owns the Keep gate sheet (E-S10), the Home Plus line rule (E-S26) and the low-storage rules (E-S17) those screens render |
| Notifications, reminder ask, quiet days | D | E owns the plan reminder note inside the app (E-S25) and the notification-permission-denied state on Plan |
| Every screen in every area | all | Each renders system states per the catalogue in section 6 |

## 2. Rules this area holds for everyone

1. Local first. Recording, typing, saving, reading, playing, Find and export never wait on a network and never show a network state (LEGAL-REQ-040; `kill-switches.ts` header). There is no global offline banner: a banner over a book that works would read as "something is wrong with my letters".
2. A server state is shown only where the parent touched a server action, in place, in one line (component `SystemLine`, section 7), or as a whole screen only where nothing else can be shown (first-run sign-in).
3. A remote pause hides; it never shows, starts or teases. A hidden surface leaves no hole, no disabled button, no "paused" badge, except the three built paused lines where a parent is mid-action (invites, pack downloads, backup).
4. No "coming soon" anywhere, in any build, under any flag value (section 8).
5. Waiting rule (NS-34): 0 to 350 ms nothing changes; 350 ms to 10 s a breathing state with no count and no spinner; at 10 s the slow or held screen with a way forward. Never a blank screen, never a dead end.
6. Errors: a calm block, never red, never a code, never blame. Service errors say first that nothing changed (VOICE Error row, as built in `authCopy.errors`).
7. Plus: one gate, at Keep, after the parent has seen their words. Nothing else is ever gated (D-082, D-083, T2).
8. Accessibility to AX5 on a 375 pt SE 3: content scrolls, the primary action stays pinned, actions stack, nothing truncates; VoiceOver focus goes to the heading on arrival and the title is announced; Voice Control names equal visible words; colour is never the only signal.

## 3. Journeys (numbered flows)

Notation: `->` a tap or a system event; `[E-Snn.state]` the screen and state shown. "Store build" means servers on, not alpha (`PLUS_ALPHA` false). "Servers-off build" means `serverFeaturesEnabled()` false (the kill path; today the `testflight` profile, per the platform review 2.1).

### J-E01 From the App Store to the first kept letter, store build (happy path, with every check)
Re-keyed on 20 Nov to card 19 (`19-from-download-to-first-letter.md`, NS-38 to NS-45). Each step names its card row. The built order holds: the age question comes before the Welcome because the root layout renders no route until it passes (card 19, "Order on a fresh install"); D-043's "welcome, then the gate" is superseded. K-E10 to K-E16 are answered in section 10a.
1. App Store page [E-S27.default] (NS-38): Apple's page. Every public line is a claims row; the listing never says or implies "no account", "no sign-up", co-parent sharing, recording backup or a language the build does not transcribe (NS-38-R2). One plain sentence says sign-in is needed and why (open item O-1). Get -> [E-S27.installing] -> [E-S27.installed]. The install is under 40 MB and holds no speech model (NS-38-R6). A phone restored from an iCloud device backup opens Home with the restored book, signed out, sign-in offered and never required (NS-38-R8).
2. First launch [E-S01.default] (NS-39-R1): no words, no network request before the age question, first interactive frame p50 1.2 s and p90 2.0 s on SE 3 (NS-39-R7). If the Keychain read does not settle, the Welcome shows within 10 s (NS-39-R8).
3. Age and agreement [E-S03.default] (NS-40, NS-42): Yes or No with nothing selected, the agreement box unticked, Terms and Privacy as their own 44 pt links that open the version recorded, at "What we collect" (NS-42-R14). No answer -> [E-S03.reason-noAnswer] "Choose Yes or No."; Yes without the box -> [E-S03.reason-noTick] "Check the box to continue." with focus on the box (NS-42-R1). No -> [E-S03.stop] (NS-40-R3: one row, nothing in Documents, zero requests, a held link token gone); after 24 hours "I answered by mistake" (NS-40-R4; no confirm step, O-3). Records: the age boolean and two local agreement rows in one transaction, never an age (NS-40-R2, NS-42-R2). The answer and the box show their state by a check shape and weight as well as colour (QAL-09, NS-33-R12 reading). When the platform age signal ships, a minor answer shows [E-S03.platformMinor]: the same room and words as the stop, nothing stored (NS-40-R5, R6, K5).
4. Region: there is no in-app region question and no E-S03.region state (NS-40 Never: never ask where a person is). A refused country meets [E-S04.refused-region] only at sign-up (step 6, NS-40-R9). The HOLD state of v1 is retired.
5. Welcome, account-first [E-S02.default] (NS-39, NS-41-R1): lockup, descriptor, body, the free-letters line (one string, K2), "Sign in to begin your book.", the agreement line directly above the buttons, then two equal 56 pt doors: Sign in with Apple (where available) and Sign in with email. A returning phone sees the last method under the matching door [E-S02.lastMethod]. No password, name, phone, Google or passkey control (NS-41-R20). The words "sign up", "log in" and "create account" appear nowhere (NS-41-R1). No story card, no "coming soon" line, no price, trial or Plus button (NS-39-R12).
6a. Apple -> Apple's sheet -> cancelled: nothing shown (NS-41-R7); failed: [E-S02.error-provider]. Email name scope is requested as email only (O-8), so no Apple name is ever shown.
6b. Email -> [E-S05.default]; empty -> [E-S05.reason-empty] "Type your email to continue." (NS-41-R8, no silent grey button); malformed -> [E-S05.error-invalid_email]; address trimmed and lower-cased before send (NS-41-R24); identical screens for a known and an unknown address (NS-41-R2); too many sends -> [E-S14.outage] on first run with Sign in with Apple still reachable (NS-41-R12, R21). -> [E-S06.default] "Check your email": one field that reads as one VoiceOver field with its length (`code.digits` with `{n}`; 8 digits by default, O-6; the field draws 6 to 10), or the link on this phone. Short -> [E-S06.reason-short]; wrong -> [E-S06.error-wrong_code]; five wrong in 15 minutes -> [E-S06.paused] (NS-41-R9); 429 -> [E-S06.error-rate_limited]; expired (900 s) -> [E-S06.error-expired]; link from another phone -> [E-S06.refused-other_phone] or `refused-other_phone_spent` (NS-41-R3); already signed in -> [E-S06.refused-already_signed_in] (NS-41-R4); nothing arrived after a minute -> [E-S06.help]. A Hide My Email address shows the method, never the relay address (NS-41-R18).
6c. A refusal by the sign-up hook from a refused country -> [E-S04.refused-region] (NS-40-R9, R14): never a generic error or an outage; no Try again; Terms and Contact us as quiet actions (card 19 words; content decides whether the label is "Contact us" or "Write to us"); nothing stored. An existing account signs in from anywhere (NS-40-R11).
6d. A service, connection or `killSwitches.signIn` condition at any point -> [E-S14] (J-E03, J-E04, J-E09).
7. Setting up and agreements [E-S07.loading] -> [E-S07.default] "Before your book syncs": the agree line directly above "Agree and continue" (NS-42-R3), "Not now" records nothing and syncs nothing (NS-42-R16); then the sensitive-data step with two equal answers, nothing preselected (NS-42-R4). Declined sensitive data: zero entries uploaded, still signed in, reachable later from Me, Privacy in two taps (NS-42-R5). Failed -> [E-S07.error-consent_unavailable]; declined Terms -> [E-S07.declined] (C-S11 rules); a new major version -> [E-S07.reconsent] (NS-42-R10). Local agreement rows upload unchanged after the server row (NS-42-R12).
8. The account is asked once (BL-922): new -> E-S08; has a book -> E-S09 (never E-S08, NS-41-R14, NS-43-R8); this phone already holds letters owned by no account -> [E-S24] claim, nothing claimed until Keep in this account is tapped on a screen showing the masked address or the method (NS-41-R5).
9. First book [E-S08] (NS-43): what we promise, then who the book is for. The only required field is the date (NS-43-R1); the name is optional and says so in words (section 14.2). A missing date -> [E-S08.dateWaiting]; a future or impossible birthday -> [E-S08.dateFuture]; a due date out of range -> [E-S08.dueRange] (NS-43-R3); a 61-code-point name -> its limit line (NS-43-R4); twins with an empty extra name -> `needNameMany` (NS-43-R5); what the child calls you (writing tools off, NS-43-R12): empty -> [E-S08.signsAsWaiting], over 30 -> `signsAsLimit` (NS-43-R7). Every reason is in words under Continue, announced, focus to the field. Languages only in multi-language builds and only gated ones; no "coming soon" line (NS-43-R11). Then "The book is open." with the speech card [E-S08.open] and no app lock offer (NS-39-R9). A refused first-run book never deletes anything and says nothing on Home (NS-43-R14). The books commit together or not at all (NS-43-R9).
10. Home [A-S01.first] (NS-43-R10): no sheet, permission prompt, Plus surface or lock offer in front. No OS permission has been asked in the whole path (NS-39-R2; section 5 E-S28 map).
11. First Speak -> area A's primer [A-S04.primer] -> the iOS prompt [E-S29.prompt]; Continue on the primer is the only path to iOS's prompt (NS-39-R10, NS-44-R6). Don't Allow -> [A-S04.blocked] with Type instead and Open Settings, no dead end. Notifications are asked only after a kept letter by area D's ask (or once by Plus confirmed, K-E13); photos need no permission; Face ID only when App lock is turned on from Settings.
12. Record -> Review -> Keep [A-S13]: no price, trial, Plus name or sheet at any step (NS-44-R1); the first two kept letters meet no gate (NS-44-R2); the first Keep plays the success haptic once, with no confetti, badge, count or streak (NS-44-R12); a recording made before the speech model arrived is kept and waits for its words (NS-39-R4, NS-44-R7); after the second the Book shows `secondFreeNote` once as a toast (NS-44-R11); the third meets E-S10 (J-E10, NS-44-R3).

### J-E02 First run, servers-off build (kill path)
1. E-S01 -> E-S03 -> [E-S02.serversOff] Welcome with "Begin the book" only; no sign-in door, no "I already have a book".
2. -> E-S08 steps -> Home. No account, Me has no Account or Delete account rows (`capabilities.ts`), no Plus offer copy changes (alpha note only in alpha builds).

### J-E03 First run, sign-in cannot be reached (unhappy) (NS-39-R5, NS-41-R12, R21, R25)
1. E-S02 -> Sign in with Apple or Sign in with email -> a failure (`network`, `rate_limited`, `email_wait`, `not_available`, `unknown`) or the 10 s gate timeout.
2. -> [E-S14.outage] "Sign-in cannot be reached right now." / "Try again in a moment." / Try again (primary) / Start on this phone (quiet, only when the gate offers it: age Yes, a failure, `LOCAL_START_FALLBACK`) with its note.
3a. Try again -> E-S02 (the failure is set aside) -> sign in again.
3b. Start on this phone -> E-S08 -> Home. Later, Me, Account, Sign in -> E-S04 (the later sign-in sheet) -> E-S07 -> [E-S24.default] "Keep your letters in this account?" -> Keep in this account / Not my account.
4. If the account already has a book -> [E-S24.hasBook] the phone's book is added as a second book; nothing deleted.

### J-E04 First run, no connection
1. E-S02 -> a sign-in door while offline -> [E-S14.offline] "Sign-in needs a connection." / "Connect to the internet, then tap Try again." / Try again / Start on this phone (same rule).
2. Connection returns -> announcement "You are back online." -> E-S02 by itself.

### J-E05 Returning parent on a new phone
1. E-S03 -> E-S02.lastMethod -> the same door as last time -> E-S05, E-S06 or Apple -> E-S07 -> the account has a book -> E-S09 (alias; area C draws C-S10: Opening your book, slow, offline, no book here yet, wrong account) -> the Book with the C-S12 line. Never E-S08 (NS-10-R0).

### J-E06 Consent outstanding at relaunch (BL-922, NS-10-R0)
1. A session in `needsConsent` with no local book -> relaunch -> within 10 s the consent sheet again, or C-S11's held screen with "Finish setting up" and "Try another way". Never E-S08. E's part: the router (section 5, E-S09).

### J-E07 Under 18
1. E-S03 -> No -> Continue -> [E-S03.stop] one line in the same room (`errors.under_18`); after 24 hours "I answered by mistake" (D-026). Nothing else reachable.

### J-E08 Sign-in errors in place (each a state of E-S04, E-S05 or E-S06)
| Kind (`AuthErrorKind`) | Where | What shows | Way forward |
|---|---|---|---|
| `cancelled` | E-S04 | nothing (A-REQ-031) | the same buttons |
| `provider` | E-S02, E-S04 | inline `firstRun.errors.provider` | Try again, or the other way |
| `invalid_email` | E-S05 | inline under the field, focus to field | fix and Send |
| `email_wait` | E-S05 (send) | to E-S14.outage on first run; inline elsewhere | Try again later |
| `wrong_code` | E-S06 | inline, field keeps the code selected | retype or new email |
| `code_paused` | E-S06 | inline plus `pausedOtherWays` | the newest link, or another way |
| `rate_limited` | E-S06 (code check) | inline (the code screen owns it) | wait, then retry |
| `expired` | E-S06.verifying | inline | Send a new email |
| `other_phone` | E-S06.refused | `verify.refusedTitle` and the line | Type the code instead |
| `other_phone_spent` | E-S06.refused | the line | Send a new email |
| `already_signed_in` | E-S06.refused | the line | Close |
| `session_expired` | E-S02 or Me | inline line; book stays (D1) | Sign in |
| `consent_unavailable` | E-S07 | inline | Try again |
| `not_available` | E-S04 | to E-S14.outage on first run; inline elsewhere | Try another way |
| `network`, `unknown` | E-S04 | to E-S14 on first run; inline in Me | Try again |
| `under_18` | E-S03 | E-S03.stop | none |

### J-E09 Kill switch at sign-in (NS-10-R8) and the sign-in pause (`killSwitches.signIn`, NS-41-R25)
0. `killSwitches.signIn` on (disable-only, signed config; PROPOSED, O-19): a person with no session who reaches the Welcome and taps a door meets [E-S14.signInPaused], which renders as E-S14.outage with the local start; a signed-in session on any phone is never ended, refreshed differently or blocked.
1. A build or a moment with `serverFeaturesEnabled()` off -> the phone shows its local book only. Never the held screen, never a sign-in error. E-S02.serversOff on a fresh install; Home on a phone with a book.

### J-E10 The third letter: the one Plus gate (store build)
1. Review -> Keep on a letter with words, two free letters already kept, Plus off -> [E-S10.default] the Keep sheet rises over Review: the held letter card, `keepGate.title`, `keepGate.body`, `heldNote`; See Plus (primary), Keep it here for now (quiet), Redeem a code (link).
2. See Plus -> [E-S10.opening] "Opening the App Store" -> Apple's store view (system) -> purchase -> [E-S12.default] Plus confirmed (plan, dates, cancel-by, how to cancel, Save a copy, the one reminder ask) -> Done -> Review -> the parent taps Keep -> kept (A-S13).
Unhappy:
3. Keep it here for now -> Review closes; Home shows the waiting card "Waiting to be kept." (slip 1) -> any later Keep re-asks the gate.
4. Apple's sheet cancelled -> back to E-S10.default unchanged.
5. Offline -> [E-S10.offline] `keepGate.offline` replaces the body; See Plus is not offered; Keep it here for now is primary.
6. Plus status unknown at launch (StoreKit not answered) -> no sheet; the letter is held (`hold` gate, RT-PLS-10) and Review says it waits (A owns the line; E-ST13).
7. iOS below 17 -> [E-S10.needsNewerIos]; StoreKit unavailable -> [E-S10.unavailable]; both keep the hold button.
8. A letter whose words arrived later, reaching the gate from its page -> [E-S10.fromLetter] `heldNoteLetter` / `offlineLetter`.
9. Alpha build -> no gate at all; Plan says `alpha.note`.
10. After the second free letter is kept -> the Book's toast `secondFreeNote`, once (store build only).

### J-E11 Plan lapse (J-N25, J-N22)
1. Plus ends (StoreKit) -> Plan [E-S11.ended] `membership.ended` with the day; Home [E-S26.on] the one standing Plus line above Speak and Type, no button, no count.
2. Every past letter opens, plays, is found, is in Save a copy, Read together and Read the year back; recording and typing work; only Keep of a new letter meets E-S10 with `lapsedBody`.
3. Reminders keep their rules and never name Plus, a price or the Keep step (J-N22). Plan notices stop (NS-32 Plan lapsed row).
4. Grace and billing retry: [E-S11.grace], [E-S11.retry] registered lines; letters untouched.

### J-E12 Everyday offline
1. Airplane mode -> Home, Listen, Review, Keep (within the allowance or with Plus known), Book, Find, Read together, Save a copy: unchanged, no line.
2. Touch a server action (Sign in, Restore purchases, See Plus, Delete account, an invite in an alpha build, a language download) -> that action's own offline line in place (catalogue E-ST01).

### J-E13 Service outage while signed in
1. Sync fails quietly and retries; letters stay on the phone. Me, Account, Sync row reads "Waiting for a connection" only after the 10 s gate read fails (built `account.sync.unknown`). No Home or Book line.

### J-E14 A remote pause turns on (each key in E-ST05 to E-ST22)
1. The signed config arrives -> the paused surface leaves on the next render of its screen, with no motion beyond the 200 ms fade, never mid-gesture (a sheet already open keeps its content and shows its paused line on its next server call).

### J-E15 App update
1. Remote `minSupportedVersion` above this build -> Me shows [E-S16.line] one SystemLine at the top: "A newer version is ready in the App Store." with Update (opens the App Store page). It never blocks; it never shows on Home (not a registered slip).
2. A pack or speech model that needs a newer app -> its own built line (`needs_app_update`) in Me, Language.
3. First launch after an update -> local migrations run behind E-S01 (no screen if under 350 ms; the breathing launch state after); every pending notification is re-planned (NS-32-R16); a draft in progress returns as a waiting card on Home.
4. A migration that cannot open the book -> [E-S01.recovery] "The book could not open" with Try again and Export what's readable.

### J-E16 Low storage (06-nfr 11.3)
1. Under 1 GB free -> Listen starts with one calm line (A-S04.lowSpace, rule E-S17.under1gb). Recording is not blocked.
2. Under 50 MB -> Speak opens Listen in its built "This phone is full" state with Type instead (A-S04.full, rule E-S17.under50mb). No draft is created. Typing still works. Me, Storage shows space (C-S18).
3. Under 20 MB during a take -> the take stops and is kept within 30 s; Review opens with what was said (A-S05.stoppedForSpace).
4. Export, Save a copy or the printable PDF -> the space check before writing; the screen names how much space is needed (C-S04, C-S05).
5. A picture under 50 MB free -> not attached (NS-37 Low storage row; A-S03).

### J-E17 Second account on one phone (X4-R1, NS-10-R3, R5, BL-961)
1. A signs out (C-S03 with the D1 line) -> A's book stays and reads for anyone who opens the app (D1).
2. B signs in -> the claim screen never shows A's letters (NS-10-R5) -> E-S09 routing: B's book arrives (C-S10), or "No book here yet" with Start a book -> E-S08 -> Home with B's book only.
3. While B is signed in, nothing of A's shows anywhere: Home, waiting cards, Book, Find, Read together, Save a copy, Storage per-book lines, notifications (re-planned from B's prefs, NS-32). No line says another book exists (that would disclose A).
4. B signs out, A signs in -> A's book returns.

### J-E18 Interruption and kill
1. A call or Siri during recording -> area A's interrupted state; the take is kept.
2. Background mid-Review -> on return Review is as left; VoiceOver focus returns to the same element (NS-33 Interrupted row).
3. Killed mid-take or mid-Review -> relaunch -> E-S01 -> Home with the waiting card "Recorded before the app closed." (slip 1). VoiceOver lands on Home's heading (NS-33 App killed row).
4. Killed on the consent sheet during first run -> relaunch -> E-S09 routing (J-E06).
5. Killed during the Plus purchase -> StoreKit finishes the transaction on next launch; Plan shows the state; the held letter waits on Home.

### J-E19 Something broke
1. A screen throws -> [E-S13.boundary] "This page did not open" / "Your letters and recordings are safe on this phone." / Try again / Go to Home.
2. A fatal throw outside React (production profile only) -> [E-S13.global] the same screen.
3. The database cannot open at launch -> [E-S01.recovery].

### J-E20 A link the app does not have
1. An old or mistyped link -> [E-S20.default] "Nothing at this link" / "Your book is right where you left it." / Back to Home. An invite link in a build without sharing -> Home, token not kept (as built).

### J-E21 Forced sign-out (`forceReauthEpoch`)
1. The founder raises the epoch -> after its queued sends, the phone signs out once -> the book stays (D1) -> Me shows the signed-out Account state with `errors.session_expired` once.

### J-E22 Appearance
1. Me -> Appearance [E-S21] Light, Dark, Same as the phone; the preview is the parent's newest letter's first line, or "Aa" with no letter. Every E screen is drawn in both themes; dark is the default design pass.

### J-E23 App lock
1. App lock on -> return after the chosen time -> [E-S22.locked] the cover with the lockup and "Unlock" -> Face ID -> where they were. A recording in progress is never interrupted by the lock (as built).

### J-E24 Notification permission off (NS-32-R4)
1. iOS notifications off and Plus renewing -> Plan [E-S11.notificationsOff] `plan.notificationsOff` with Allow notifications. Plan dates stay on Plan.

### J-E25 The accessibility walk (NS-33) and the speed sheet (NS-34)
1. Run the matrix in section 9 on the SE 3 at AX5 with Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Increase Contrast, Smart Invert, dark; record pass or miss per row per candidate (BL-948).

## 4. Screen and state inventory

Common state suffixes (any screen may carry them): `.default`, `.loading`, `.empty`, `.offline`, `.error-<code>`, `.killswitch`, `.paused-<key>`, `.lapsed`, `.second-account`, `.ax5`, `.vo`, `.dark`. Each screen lists only the states it really has.

| Id | Screen | Built file | States |
|---|---|---|---|
| E-S01 | Launch and boot | `app/_layout.tsx`, `components/resilience/launch-recovery.tsx`, `plain-screen.tsx` | default, migrating (breathing after 350 ms), recovery (alias `error-launch`), recovery-trying, recovery-stillClosed, recovery-exporting (alias `loading-export`), recovery-exportNothing, recovery-exportFailed, ax5, vo, dark |
| E-S02 | Welcome (account-first when servers on) | `app/onboarding.tsx`, `components/onboarding/welcome-sign-in.tsx`, `welcome-lockup.tsx` | default (store, two sign-in doors, no Google or passkey), lastMethod, serversOff (Begin the book), alpha, restoring (alias `loading`, capped at 10 s), error-provider, sessionExpired, ax5, vo, dark. NS-39, NS-41, NS-42 |
| E-S03 | Age gate and stop | `components/gate/age-gate-screen.tsx` | default, reason-noAnswer, reason-noTick, agreeOnly (old install), stop, stop-after24h, platformMinor (new, built later, same room as stop, nothing stored; NS-40-R5), ax5, vo, dark. The v1 state `region` (HOLD) is RETIRED: no in-app region question exists (NS-40). NS-40, NS-42 |
| E-S04 | Sign-in sheet after first run (Me, claim path) | `app/(auth)/sign-in/index.tsx` | default, busy, error-cancelled (nothing), error-provider, error-not_available, error-network, refused-region (new, NS-40-R9: StateScreen warm, one line, no drawing of a map or flag, Terms and Contact us, no Try again), ax5, vo, dark. NS-41 |
| E-S05 | Sign in: email | `app/(auth)/sign-in/email.tsx` | default, sending, reason-empty (new, K-E11), error-invalid_email, error-email_wait, error-not_available, error-network, ax5, vo, dark |
| E-S06 | Sign in: code and verify (field draws 6 to 10 digits, `code.digits` with `{n}`) | `code.tsx`, `verify.tsx` | default, checking, reason-short (new, NS-41-R8), help (ordered per MSG-08, with Write to us), noAddress, verifying, error-wrong_code, paused (code_paused), error-rate_limited, error-expired, refused-other_phone, refused-other_phone_spent, refused-already_signed_in, ax5, vo, dark |
| E-S07 | Agreements and consent at sign-in | `app/(auth)/sign-in/consent.tsx` | loading (Setting up your account), default (Terms sheet), sensitive (the second step, two equal answers), reconsent (new: a new major version, change summary, NS-42-R10), offline (new), declined (to C-S11), error-consent_unavailable, claim (alias of E-S24), ax5, vo, dark |
| E-S08 | First book steps | `app/onboarding.tsx` | promise, name (optional, marked "Optional", NS-43-R1), name-waiting (twins only; no longer the servers-off path), date (with the PROPOSED why-we-ask line), dateWaiting, dateFuture, dueRange, nameLimit, twins, signsAs, signsAsWaiting, signsAsLimit, languages (multi-language builds only), open (the speech card: ask, downloading, waitingWifi, verifying, stopped, pausedRemote, needsSpace, done), ax5, vo, dark. NS-43 |
| E-S09 | First-run router (alias of C-S10, C-S11) | `lib/first-run/*.ts` | decision table only (section 5) |
| E-S10 | Keep gate sheet | `components/child/plus-gate.tsx` | default, opening, offline, needsNewerIos, unavailable, lapsed, fromLetter, fromLetter-offline, error-codeFailed (built `codeFailed`), hold (no sheet: Plus not known, E-ST26), synced (held for counsel C10), ax5, vo, dark |
| E-S11 | Plan in Me | `app/settings/plus.tsx` | free (never had Plus), on, trial, renews, ends, ended, grace, retry, shared, alpha, restoring, restored, restoreNone, restoreFailed, notificationsOff, ax5, vo, dark |
| E-S12 | Plus confirmed | `app/plus/confirmed.tsx` | default, withAsk (notifications never asked), ax5, vo, dark |
| E-S13 | Something broke | `components/resilience/global-fault-screen.tsx`, root error boundary | boundary, noBook (fresh install: no safety sentence), global, secondFault (adds Write to us), ax5, vo, dark |
| E-S14 | Sign-in outage and offline (first run) | `components/onboarding/outage-screen.tsx` | outage, outage-withLocal, offline, offline-withLocal, signInPaused (new: `killSwitches.signIn`, renders as outage-withLocal), backOnline (announcement), ax5, vo, dark. NS-39-R5, NS-41-R12, R25 |
| E-S15 | SystemLine in place (new component) | none | info, waiting, paused, offline, action, ax5, vo, dark |
| E-S16 | App update line in Me | none (gap G-E03) | line (one line, two wordings: required update, and "can no longer reach your account"; LCY-17), absent (current build, or an update that is available but not required: nothing shows, NS-45-R14), ax5, dark. NS-45-R13 |
| E-S17 | Low-storage rules (rendered by A-S04, A-S05, C-S04, C-S18) | `lib/capture/free-space.ts` | under1gb, under50mb, under20mbMidTake, exportShort |
| E-S18 | Second account on one phone | `lib/auth/account-claim.logic.ts`, `lib/first-run/account-books*.ts` | signedOutA (the book of the account that signed out last shows, K-E02 answered by O-5), signedInB-noBook, signedInB-arriving, signedInB-ownerMismatch (new: A's book hidden and locked, B's arrives or "No book here yet"), signedInB-localOnly (new: B's letters stay on this phone, one SystemLine), backToA. NS-41-R6 |
| E-S19 | Interruption and recovery | `lib/resilience/recover-to-tonight.ts`, capture sweep | call, background, killedMidTake, killedOnConsent, killedMidPurchase |
| E-S20 | Not found | `app/+not-found.tsx` | default, noBook (fresh install), ax5, dark |
| E-S21 | Appearance | `app/settings/appearance.tsx` | system, light, dark, noLetter |
| E-S22 | App lock cover | `components/app-lock` | locked, failed, ax5, dark |
| E-S23 | Accessibility walk and speed sheet | `docs/qa` (BL-929, BL-948) | matrix (section 9) |
| E-S24 | Claim screen | `lib/auth/account-claim.logic.ts` (screen in sign-in stack) | default, noEmail, methodOnly (new: relay address, shows the method), hasBook, accountDeleted (new: "your earlier account was deleted; keep these letters in this account?", LCY-11), waiting, ax5, vo, dark. NS-41-R5, R18 |
| E-S25 | Plan reminder note in the app | `lib/billing/plan-notice.tsx` | trial, renews, yearly, ax5, dark |
| E-S27 | App Store page and install (Apple's; ours only as claims) | none | default, installing, installed |
| E-S28 | Permission asks map (when each system permission is asked) | `permissions.en.ts`, `app.config.ts` | matrix (section 5) |
| E-S29 | Microphone prompt (iOS), after area A's primer at the first Speak | system | prompt, allowed, denied (to A-S04.blocked) |
| E-S30 | If you are struggling (new; support SUP-17, SUP-18; id assigned here because support's proposed E-S27 and E-S28 are taken, K9) | none | region with lines, IN (emergency and directory only), other region, iPad or no SIM (Copy fallback), offline, ax5, vo, dark. Reached from a quiet link on the Welcome and from Me, Help and legal (C-S01) |
| E-S31 | Lines in other countries (new; SUP-17) | none | list, offline, ax5, vo, dark. Reached only from E-S30 |
| E-S26 | Home Plus line (a rule drawn on A-S01) | `app/(tabs)/index.tsx` | off (absent), on (allowance used, Plus off or lapsed), alpha (absent) |

## 5. Screens in detail

Layout figures are in points at default text size on a 375 x 812 frame (safe area top 47, bottom 34; SE 3 is 375 x 667 with top 20 and bottom 0, and the AX5 layouts below are checked against 375 x 667). Tokens: gutters `space.5` (20) on state screens and `space.4` (16) on lists; primary button 56 tall, pill radius; quiet button 44.

### E-S01 Launch and boot
- Default: the gate's room (lamp `gate` scene, centred, still), the quote pair mark. No words. First interactive frame p50 1.2 s on SE 3 (NS-34).
- Migrating: if boot passes 350 ms, the mark breathes (opacity only, off under Reduce Motion and Low Power Mode). No progress, no count.
- Recovery (built, PlainScreen): page drawing, `errors.launch.title`, body, hint; Try again (primary, becomes "Trying again" for a beat), Export what's readable (quiet). After a failed retry, `stillClosed` in a polite live line. No action deletes data.
- AX5: drawing hides above AX2 to give text room (StateScreen rule); title wraps; both buttons stack full width, pinned.
- VoiceOver order: title (heading), body, hint, Try again, Export what's readable. Each result line announced every time.
- Recovery keeps "Export what's readable" on every recovery state, and it must run against an older-schema file (LCY-02, NS-39-R11: neither action deletes a file or row). After a second failure a quiet "Write to us" text button sits below Export what's readable (SUP-02); the readme inside the export names the address.
- Components: PlainScreen (existing). Integration: NS-34 cold start; NS-32-R16 re-plan; NS-36 "App updated mid-flow"; claims rows E1, E3, E4, E8. Data read: local database; written: none. Module: `lib/resilience/launch*.ts`.

### E-S02 Welcome
- Default (store, servers on), as built (`welcome-sign-in.tsx`, NX-36 S2): lamp `welcome` scene, lockup (`app.welcome`), descriptor as heading 1, body, the free-letters line (`membership.line`, said once before any purchase), "Sign in to begin your book.", then the footer: the agreement line directly above the buttons with Terms and Privacy as their own 44 pt links, Sign in with Apple (Apple's button) and Sign in with email (filled accent), both 56. No price, no trial.
- lastMethod: "Last time you used email." (or Apple) under the matching door.
- serversOff: Build 11's Welcome, "Begin the book" only, no sign-in door.
- alpha (servers on): adds "I was invited" quiet; `alpha.note` replaces `membership.line`.
- restoring: the room with no buttons for up to 10 s (`RESTORE_WAIT_MS`), then default.
- error-provider: one inline line above the doors, `firstRun.errors.provider`, announced. sessionExpired: `errors.session_expired`.
- AX5: the footer joins the scroll after the benefit line (as built); nothing truncates.
- VoiceOver: lockup, heading, body, benefit, agreement and its links, Apple, email, I was invited (as built). Voice Control: "Sign in with Apple", "Sign in with email".
- Re-keyed to NS-39, NS-41 and NS-42: exactly Sign in with Apple and Sign in with email at equal size (NS-41-R1); no Google or passkey control (NS-41-R20); the agreement line stays directly above the buttons and fully visible at AX5 without scrolling past them (NS-42-R15); Privacy opens the policy at "What we collect" (NS-42-R14). A two-sentence notice at collection above the agreement line was asked by the privacy function (PRV-24); card 19 does not carry it, so it is drawn as a pending state `E-S02.notice` (pending counsel Q20, open question D-5). A quiet "If you are struggling" link (E-S30) sits below the doors and needs no account (SUP-18; pending ruling). `killSwitches.signIn` never changes this screen; it sends a tap on a door to E-S14.signInPaused.
- Layer: content (paper and lamp). Apple's button is Apple's control. No glass on this screen.
- Integration: C44 (F01, NX-31 R2, R8, R17, R18, R22, NX-36 S2); NS-35 first use; flag `serverFeaturesEnabled()`; error codes `provider`, `session_expired`, and the outage set via E-S14. Modules: `lib/first-run/route.logic.ts`, `welcome.logic.ts`.

### E-S03 Age gate and stop
- As built (PRD-REQ-019, LEGAL-REQ-002): the question in `display`, Yes and No as equal pills with nothing selected, the agreement row unticked, Terms and Privacy as their own 44 pt links, Continue never disabled. Reason line in `text` with a WarningCircle (never status colour on the gate).
- Stop: one line in the same room; "I answered by mistake" after 24 hours (D-026). platformMinor (NS-40-R5, K5): identical room, words and absence of any control; nothing about the system answer is stored, logged or sent (NS-40-R6). Never "verified" or "safe for kids" wording (claims).
- Selected is never colour alone: the chosen answer pill gets a check glyph and a heavier label; the ticked box shows a check mark; the reason line carries a WarningCircle (QAL-09, WCAG 1.4.1).
- Region (v1 HOLD) is retired. No state asks where a person is (NS-40 Never).
- AX5: Yes and No stack; agreement row wraps with the box top-aligned; Continue pinned.
- VoiceOver: question (heading), Yes, No (each "selected" when chosen), agreement checkbox with its full sentence, Terms, Privacy, Continue; the reason line is announced and focus moves to the box.
- Door lines (COORDINATION section 10): Shown: the question and the agreement; Records: the age boolean and the local agreement record on the phone; Never: preselected answer or ticked box; Decline: No stops the app with one line, nothing stored about the box.

### E-S04, E-S05, E-S06 Sign in
- E-S04: the sign-in sheet used after first run (Me, Account; the claim path; an invite in an alpha build). First run signs in on E-S02 itself. A system sheet (glass, N7) with Close; title "Sign in"; Apple's `ASAuthorizationAppleIDButton` and "Sign in with email" (filled), both 56. Inside the glass sheet the buttons are filled or plain, never glass (no glass on glass). One inline error slot above the buttons.
- E-S05: email TextField (autofill email, keyboard email), Send link (primary, sticky above keyboard); `email.help` "A link and a code arrive by email. No password to remember." reason-empty: a tap on Send with no address says why in words (PROPOSED), never a silent disabled button. Error under the field, field border `caution` plus the WarningCircle glyph and words (never colour alone).
- E-S06: six-box code field read as one field by VoiceOver ("Code, 6 digits"), autofill from Mail where iOS offers it; "Send a new email" quiet. Verifying: StateScreen loading with "Signing you in". Refused: StateScreen warm error with `verify.refusedTitle` and one action.
- E-S04.refused-region (NS-40-R9, R14): StateScreen warm (C8), no drawing of a map or flag, one line (content: intent "{app} can't be set up from here."), Terms and Contact us as quiet actions, no Try again, nothing stored, never styled as an outage or a generic sign-in error. VoiceOver: heading first, then the line, then the two actions. Layer: content.
- AX5: all three are single columns; the code boxes become one wide field at AX3 and above; sticky buttons stay above the keyboard; ModalHeader keeps Close at 44.
- Error codes: see J-E08. Door lines: Shown: the sign-in method; Records: the session in the Keychain; Never: an email address shown in full on a shared screen beyond the field being typed; Decline: Close, back to the Welcome.

### E-S07 Agreements and consent at sign-in
- As built: "Setting up your account" (loading), then the Terms sheet "Before your book syncs" with the privacy body, the agree line with links, "Agree and continue" primary, "Not now" quiet.
- reconsent (NS-42-R10, new): a new major version while signed in. The same sheet with a change summary block (a PROPOSED key, content names it) above the agree line, then Agree and continue / Not now. Recording, reading, playing and export work whatever the answer; Delete account works without agreeing (NS-42-R11). Shows before sync resumes, never mid-gesture.
- offline (new): the sheet's own line `consent_unavailable` family, nothing recorded; Try again.
- sensitive: the second step; two answers of the same size and width, nothing preselected (NS-42-R4); the decline path is reachable later from Me, Privacy in two taps (NS-42-R5).
- Not now (declined) on first run -> C-S11 rules (nothing downloads, nothing uploads, Delete account works without agreeing, export reachable).
- Door lines: Shown: the existing keys and versioned links; Records: a PRIV-R21 row (surface `returning_consent_sheet` when returning, method `tap`); Never: preticked; Decline: as NS-10 section 12.

### E-S08 First book steps
- One step per screen, lamp `form` scene; Continue full width at the bottom; Back top left. Name (nameField serif 22), date (wheel, birthday or due date, one control with two equal choices), what the child calls you (signs-as, D2 writing tools off), the promise sample (a small fix shown, not described), "The book is open." (lamp rises; success haptic once).
- Optional name (NS-43-R1, K-E12 answered): the name is optional on every path, including the servers-off path. The label reads "Their name" with the word "Optional" beside it (section 14.2); VoiceOver reads "Their name, optional"; the book cover reads "Letters to your child" until a name is added (NS-43-R1: "your child" is shown). Continue is enabled with the field empty, so Continue is itself the skip: no second "Skip" control on this step. Only the date is required: missing -> `dateWaiting`, in words under Continue, announced.
- name-waiting is now only twins: an extra book with an empty name -> `needNameMany` (NS-43-R5). `childrenExtra.nameRequired` stays for Me, Add a child (NX-31-R28), where the name is required.
- why-we-ask (PRV-16, PRV-24, PROPOSED words): one `footnote` line under the date, that the book's chapters follow the child's age. Static, never a tooltip.
- nameLimit: 61 code points -> the limit line, announced; names in any script up to 60 (NS-43-R4).
- open: the speech card sits on "The book is open." (E-S08.open): ask (a size line read from the catalog, never typed), Download on Wi-Fi (primary) and Not now (quiet, same size; nothing starts without a tap, NS-39-R3); downloading and waitingWifi say it in words, never a percentage (NS-39-R13); verifying; stopped (Try again); pausedRemote (`packDownloads`, one built paused line); needsSpace; done. Not now is a full answer: the recording waits for its words (NS-39-R4). No lock offer here (NS-39-R9).
- Twins: "Add another" quiet under the name; each book free.
- Languages: only in multi-language builds and only gated languages (NS-17-R1); absent otherwise (no "later update" line).
- AX5: the field and its label stack; the wheel becomes the system compact date picker at AX3+; Continue pinned.
- Integration: F01; NS-17-R1; NS-35 first use; D2 on the signs-as field; data written: `children`, `members.signs_as` locally; module `app/onboarding.tsx`, `components/onboarding/child-step.logic.ts`.

### E-S09 First-run router (alias)
What first run shows, first match wins (as built in `gate.logic.ts`, with BL-922's change):
| Condition | Shows |
|---|---|
| `serverFeaturesEnabled()` off | Build 11 behaviour: E-S02.serversOff, never a held screen (NS-10-R8) |
| Session, age Yes, consent being read | C-S10 loading |
| Session, `needsConsent`, no local book | the consent sheet again or C-S11 held screen (BL-922; today: falls through to E-S08, a known gap) |
| Session, account answered `opening`, `slow`, `offline`, `noBook`, `arrived` | C-S10 states; `arrived` lands on the Book |
| Phone holds a book (any session state) | Home; sign-in offered, never required (R22); with a different account see E-S18 |
| Age not asked / No | E-S03 / E-S03.stop |
| Session, new account | E-S08 |
| Local start chosen | E-S08 |
| Offline or sign-in failed | E-S14 |
| Otherwise | E-S04 |

### E-S10 Keep gate sheet (the one Plus gate)
- Default: full-height sheet on paper over Review, scrim 32%; the held letter card at the top (its first lines in the serif, signature, the "Waiting" chip as text plus a dot, never colour alone); `keepGate.title` in title2; `keepGate.body`; `heldNote` in body; footer: See Plus (primary 56), Keep it here for now (quiet 44), Redeem a code (link 44). No price, no trial, no count, no countdown, no lamp.
- opening: See Plus shows "Opening the App Store" as its busy label; the sheet stays.
- offline: `keepGate.offline` replaces `heldNote`; See Plus is not drawn; Keep it here for now becomes the primary.
- needsNewerIos / unavailable: `gate.needsNewerIos` / `gate.unavailable` replace the body; See Plus not drawn; hold primary.
- lapsed: `keepGate.lapsedBody` before the held note.
- fromLetter: `heldNoteLetter` (no "Home", no "phone").
- AX5: footer holds only See Plus and Keep it here for now (built `keepSheetLayout`); every line scrolls; the held note right after the title; the held card and Redeem follow in the scroll.
- VoiceOver: modal; focus on the title; the held card read as one element ("Waiting. {first line}. From {signsAs}"); then body, note, See Plus, Keep it here for now, Redeem a code. Escape returns to Review unchanged.
- Integration: C25 (F14-6.2 B), D-082, D-083, D-103; NS-33 plan-lapsed row ("the gate sheet passes every row"); frame guardrail (no paywall before words); flags: `PLUS_ALPHA` (no gate in alpha); remote `freeLettersAllowance` (only raises, never lowers); kill switch: none (capture has none); data read: Keychain letter ledger, StoreKit; written: draft `held_kind`. Module: `lib/billing/keep-step.ts`, `gates.ts`, `components/child/plus-gate*.tsx`.

### E-S11 Plan in Me
- As built (S41): iOS grouped list. Section Plus (status row or "See what Plus adds"), "What Plus includes", Manage subscription (own subscription only), Restore purchases with its inline result, Redeem a code, payment footer. Dates only here; no countdown.
- notificationsOff: one SystemLine (info) under the status row with Allow notifications (NS-32-R4).
- alpha: `alpha.note` as the only row content.
- AX5: rows grow, subtitles wrap below titles, chevrons stay; nothing truncates.
- Integration: C25; NS-32-R4; LEGAL-REQ-048; kill switch `statusReport` (silent, see E-ST12); module `components/settings/plan.logic.ts`.

### E-S12 Plus confirmed
- As built: plan, trial end or renewal date, cancel-by date, automatic renewal, how to cancel, Apple's role, Family Sharing, reminders; Save a copy; the one "Remind me before" ask only while iOS has never asked. Done.
- AX5: one scrolling column; Done pinned.

### E-S13 Something broke
- PlainScreen: page drawing, `errors.crash.title`, `errors.crash.body`, Try again (primary), Go to Home (quiet). No code, no stack, nothing logged but the class name (PRIV-R10).
- Card gap noted (section 10): `errors.crash.body` makes a safety statement on a screen shown because something failed. K-E06 answered by card 19 (NS-39 E-S13 row): `errors.crash.bodyNoBook` when no book is on the phone; the safety sentence only on the React boundary path, never after a database failure (OPS-20). secondFault: on a second fault in one session a quiet "Write to us" sits below Go to Home (SUP-02). No error text carries a path or a name (PRV-11). Order status under outage and offline is area C's line (PRT-41).

### E-S14 Sign-in outage and offline (first run)
- StateScreen warm error: envelope drawing; outage: `outage.title`, `outage.body`; offline: `offline.title`, `offline.body`; Try again (primary); Start on this phone (quiet) with `startLocalNote` only when shown.
- Needs the StateScreen `note` slot and a heading ref (both asked for in `outage-screen.tsx`; proposed in section 7).
- signInPaused (NS-41-R25, O-19, PROPOSED `killSwitches.signIn`): the outage render with Start on this phone; the line says nothing about a switch or a pause. A signed-in phone never meets it.
- The screen says in words that Sign in with Apple and the local start stay open when mail or the site is down (MSG-15); Start on this phone is shown for every outage kind on first run (OPS-33, REL-03); a wrong-clock hint, when the phone's date is far off, is help text under the body, never a banner (REL-55).
- backOnline: announcement only, then the Welcome.
- AX5: drawing hidden above AX2; buttons stacked and pinned.
- Integration: NX-31 R18, R19; NX-36 S3; `LOCAL_START_FALLBACK`; error codes `network`, `rate_limited`, `email_wait`, `not_available`, `unknown`, the 10 s timeout.

### E-S15 SystemLine (new component; see section 7)
One line in place under the control it is about: a 20 pt Phosphor glyph (Info, CloudSlash, PauseCircle, ArrowCircleUp, HardDrives) in `textMuted`, the sentence in `subhead` `text`, an optional quiet action (44 pt). On `surface` with `radius.md`, no border in default contrast, `line` border under Increase Contrast. Never red. Kinds: info, waiting, paused, offline, action.

### E-S16 App update line
- Me, top of the list, a SystemLine (action) "A newer version is ready in the App Store." with Update. Absent when the build is at or above `minSupportedVersion`. Never on Home, Book or a sheet. Never blocks. PROPOSED words (content lead keys them).
- Two wordings, one line (LCY-17, NS-45-R13): "A newer version is ready in the App Store." for a build below `minSupportedVersion`, and a second sentence for a server answer `upgrade_required` or `gone` ("This version of {app} can no longer reach your account." PROPOSED), both with Update. A newer version that is not required shows nothing at all (NS-45-R14, O-16). Never a block (K-E15 held: reading, recording, saving and export always work, NS-45-R13). The line never lists features (MKT-09).
- Integration: remote config `minSupportedVersion` (built in the schema; no consumer today: engineering gap G-E03). Card row: NS-45-R13, R14 (K-E05 answered).

### E-S17 Low-storage rules
| Free space | Where it shows | What |
|---|---|---|
| under 1 GB | Listen Ready (A-S04) | one SystemLine (info) "Space on this phone is getting low." Recording starts normally (PROPOSED words) |
| under 50 MB | Listen (A-S04.full, built) | StateScreen glyph state "This phone is full" / "Free some space to record, or type this one." / Type instead / Try again; no draft created |
| under 20 MB mid-take | Listen to Review | take stops and is kept within 30 s; Review says why in one line (area A) |
| below an export's estimate plus 200 MB | Save a copy, printable PDF (C-S04, C-S05) | the space needed, smaller options |
| under 50 MB, picture | photo start (A-S03) | not attached; the letter goes on without it |
Not on Home: a storage card on Home would be an unregistered slip and fail `[FRAME-SLIP]` (card gap K-E03).

### E-S18 Second account on one phone
- No screen of its own: a rule every area follows. While a session of account B is on a phone holding account A's rows, every list (Home waiting cards, Book, Find, Read together, Save a copy, Storage per-book lines, Recently deleted, notifications) filters to B's rows. No line mentions another book. The claim screen (E-S24) never lists A's letters (NS-10-R5).
- Default rule (O-5, ADR 0031 as proposed, NS-41-R6): B signing in hides and locks A's book: no read, claim, upload, index or reminder until A signs in again or Erase everything runs. Two new states drawn for security (SEC-01, SEC-02, SEC-04): signedInB-ownerMismatch (A's book hidden; B's book arrives through C-S10 or "No book here yet" with Start a book) and signedInB-localOnly (B's own letters that have not synced stay on this phone, shown by one SystemLine, E-S15, `waiting`). No line names another book.
- signedOutA: D1 holds: A's book reads for anyone; Me shows `account.signedOutTitle` and the D1 body (C-S02).
- Integration: X4-R1, NS-10-R3, R5, NS-07-C5-12, NS-07-C28-17, NS-01-R29, R30, NS-02-R24, NS-18-R6; BL-961; ADR 0023. Engineering gap G-E05 (the first-run gate opens Home for any session when the phone holds a book).

### E-S19 Interruption and recovery
- No screen of its own: on relaunch Home shows the built waiting card (slip 1). Focus rules: VoiceOver returns to the same element after a call; after a kill it lands on Home's heading. A purchase interrupted is finished by StoreKit at next launch; E-S11 shows the result.

### E-S20 Not found
- As built: window drawing (still), `errors.notFoundPage.*`, Back to Home. The address is never read, shown or logged.

### E-S21 Appearance
- As built: three choices as a native radio list; preview of the newest letter's first line in the serif at the chosen theme (or "Aa"). Dark mode is drawn first for every E screen; the prototype shows both.

### E-S22 App lock cover
- As built: cover over the app switcher snapshot and on return; lockup, "Unlock" primary; Face ID; failed: one line, Try again. Never interrupts a recording.

### E-S24 Claim screen
- As built: `claim.title`, `claim.body` with the masked email (or `noEmail`), `claim.help`, Keep in this account (primary), Not my account (quiet). hasBook: `bodyHasBook` and `recordingsNote`. methodOnly (NS-41-R18): a Hide My Email address shows the method ("Apple (email hidden)", PROPOSED), never the relay address. accountDeleted (LCY-11, LCY-19; K15 ruling: parent-driven, never staff): "your earlier account was deleted; keep these letters in this account?" with the same masked-method and tap rules and words that say what happens, never who is at fault. Door lines: Shown: the masked account; Records: ownership of this phone's rows on tap; Never: another account's letters listed; Decline: Not my account, nothing on the phone changes.

### E-S25 Plan reminder note
- As built: on the next open inside its window, on a calm tab root only (never mid-task), a sheet with `note.title`, the date line, cancel-by line, Manage subscription, Got it. Never a child name, a count or a price (NS-32-R12, D-083).

### E-S26 Home Plus line
- On A-S01, once the free letters are used and Plus is off or lapsed (store build): one standing line above Speak and Type, `billingCopy.tonight.plusLine`, `footnote textMuted`, no button, no count. Not a slip; never replaces a slip; absent in alpha builds.

### E-S27 App Store page and install
- Apple's surface. Ours: the listing words (`storeListing.*`, claims rows), screenshots drawn from the Asha book only (D13), the privacy label as shipped (G5), no claim the build does not back (NS-17-R4: only shipped languages named). Install needs no account.

### E-S28 Permission asks map (only when needed)
| Permission | Asked when | Never | Declined |
|---|---|---|---|
| Microphone | the first Speak, after area A's primer (E-S29) | in first run, at launch, from a doorway (NS-35-R7) | A-S04.blocked: Type instead, Open Settings; typing works |
| Notifications | area D's reminder ask after a kept letter; the Plus confirmed "Remind me" ask (E-S12.withAsk) only while iOS never asked | in first run; twice by us (NS-13 door lines) | no reminders; Me explains in one sentence; plan dates stay on Plan (NS-32-R4) |
| Photos | never: PHPicker needs no permission (council round 2, section 6) | a library permission prompt | n/a |
| Face ID | turning on App lock | at launch | the lock stays off |
| Speech recognition, location, contacts, tracking | never (no usage string; G11-3 guard) | | |
The order a new parent can meet a system prompt, in full (NS-39-R2, NS-39-R10, NS-44-R6, NS-13): 1. none through "The book is open." and Home; 2. microphone at the first Speak, after our primer and only through its Continue; 3. notifications after a kept letter, once, by area D's ask or by Plus confirmed (whichever comes first; the other shows no ask, K-E13); on the first tick of a day in Days, one sentence then iOS's ask (RV-9, Q-FD-20); 4. Face ID when App lock is turned on from Settings; 5. never: photos, tracking (ATT), contacts, location, speech. A parent who has declined notifications sees no Days ask (RV-9).

### E-S29 Microphone prompt
- iOS's alert with `permissions.microphone` ("{app} uses the microphone to record the letters you speak to your child."). Glass is the system's. Allow -> Listen Ready; Don't Allow -> A-S04.blocked.

### E-S30 If you are struggling, E-S31 Lines in other countries (new, 20 Nov)
- Source: support SUP-17 and SUP-18 (`FUNCTION-TRACE.md` 6.5.1), drawn from `STRUGGLING.md`. Support proposed E-S27 and E-S28, which are taken (K9), so area E assigns E-S30 and E-S31 (pending ruling: GAP-LOG K9 names only C-S23 and E-ST47).
- E-S30: a content screen on paper, no drawing, no lamp. Title, one calm paragraph that is not advice, then the lines for the phone's region as rows that dial (44 pt or more, name and number as one VoiceOver element, "Calls {name}"). States: region with lines; IN (emergency and directory only); any other region (a link to E-S31 and a directory link); iPad or no SIM (a Copy button replaces dialling); offline (the directory link needs a connection, said in one line; the lines on the phone still show). Never a count, a score, a check-in, a "how are you" question or any word about the child's age. Reached from a quiet link below the Welcome's doors (needs no account) and from Me, Help and legal.
- E-S31: a list of countries, one row each, one level, no search needed at 30 rows or fewer; group titles are headings.
- AX5: rows grow, number under name, nothing truncates. VoiceOver: heading first. Layer: content; no glass; no sheet.
- Words: `content` and the founder; counsel reads (the lines are public claims). Fictional data only in any prototype.

## 6. Cross-area state catalogue

Render classes: R0 silent (nothing shown); R1 the surface is absent (hidden, no hole); R2 SystemLine in place; R3 toast; R4 StateScreen or InlineState; R5 sheet; R6 PlainScreen. "Parent can" is the way forward that must exist.

### 6.1 Connection, server and build states
| Id | State | Trigger | Render | Parent can | A Capture | B Book | C Keeping | D Family, reminders |
|---|---|---|---|---|---|---|---|---|
| E-ST01 | Offline | OS reports no connection or internet not reachable (unknown counts as online) | R0 everywhere local; R2 on the server action touched | keep doing everything local; Try again on the action | R0 (capture is local; pack download line in Language) | R0 (Find is local, NS-02) | R2 on Sign in, Restore, Delete account (`deletion.offline`), backup | R0 reminders; R2 on Share again in alpha (`errors.network`) |
| E-ST02 | Service outage, signed in | sync or a function fails, or the 10 s gate read fails | R0; Account Sync row "Waiting for a connection" | nothing needed; sync retries | R0 | R0 | R2 on the server action | R0 |
| E-ST03 | Sign-in outage, first run | see E-S14 | R4 (E-S14) | Try again; Start on this phone | n/a | n/a | n/a | n/a |
| E-ST04 | Servers-off build (`serverFeaturesEnabled()` false) | build flag | R1 for sign-in, Account, Delete account, co-parent, backup | everything local | as built | as built | Me without Account rows | invites absent (NS-25-R12) |

### 6.2 Remote pauses (`killSwitches.*`; true means stopped; none starts anything)
| Id | Key | Exists today | Render | A | B | C | D |
|---|---|---|---|---|---|---|---|
| E-ST05 | `sync` | yes | R0; Account Sync row shows a paused value (PROPOSED "Paused for now"; today it would say nothing or "Waiting") | R0, rows queue | R0 | R2 on Sync row only | R0 |
| E-ST06 | `invites` | yes | R2 `errors.paused` on create, peek, join; cancel still works | n/a | n/a | n/a | D-S family sheets (alpha builds only in 1.0) |
| E-ST07 | `photos` | yes (description changes per NS-01) | R1: photo start, Photos lens, add, change, remove absent; data rights unchanged | R1 photo start | R1 lens and page actions | R0 export, erase still handle pictures | R0 |
| E-ST08 | `packDownloads` | yes | R2 `status.paused` / `downloads_paused` in Language and speech rows | R0 capture; R2 in pack rows | R0 | R0 | R0 |
| E-ST09 | `serverContent` | yes | R0 (packaged copy used) | R0 | R0 | R0 | R0 |
| E-ST10 | `backupUploads` | yes (backup flag off in every store build) | R2 `backup.paused` where backup shows (C-S21 at flip only) | R0 | R0 | R2 | R0 |
| E-ST11 | `escrow` | yes | R2 on the restore action at flip only | R0 | R0 | R2 | R0 |
| E-ST12 | `statusReport` | yes | R0 (phone reminders keep working) | R0 | R0 | R0 | R0 |
| E-ST13a | `bookSearch` | no (#798 adds it) | R1 Find absent; index keeps following letters | R0 | R1 | R0 | R0 |
| E-ST13b | `reminders` | no (PROPOSED, NS-13) | R0 for scheduled ones; may only narrow the window (C-NFR-009) | R0 | R0 | R0 | D's state |
| E-ST13c | `shareLetter`, `firsts`, `seals`, `printBook`, `quickCapture`, `earlierVersions`, `signAsOther` | no. WITHDRAWN as pause keys (OPS-01, GAP-LOG B E-03: the cards win and say none). Render for these: "build flag only; no remote state" | R1 where a build flag is off; there is no remote pause to draw; seals are never revealed early and Open now stays (NS-06 B) | per card | per card | per card | per card |
Rule for every row: a pause never removes recording, typing, saving, reading, playback, export or deletion (LEGAL-REQ-040; NS-09-R17 deletion is never pausable).

### 6.3 Other remote config keys
| Id | Key | Render |
|---|---|---|
| E-ST14 | `flags.familyTeaser` (`coming_soon` default) | R0 in every build: nothing reads it (section 8). Designed absent state: no row, no tab, no screen, no line |
| E-ST15 | `flags.introVariant` | content blocks only; never a coming-soon story |
| E-ST16 | `flags.lockScreenNamesDefault` | D's reminders; default false (no name on the lock screen) |
| E-ST17 | `forceReauthEpoch` raised | J-E21: signed out once, book stays, `session_expired` line in Me |
| E-ST18 | `minSupportedVersion` above this build | E-S16 line in Me only |
| E-ST19 | `freeLettersAllowance` | raises only; no visible change except the gate meeting later |

### 6.4 Plan states
| Id | State | Render | Where |
|---|---|---|---|
| E-ST20 | Free, allowance not used | R0; `membership.line` on Welcome and Plan | E-S02, E-S11 |
| E-ST21 | Second free letter kept | R3 `secondFreeNote` once | B (the Book after Keep) |
| E-ST22 | Allowance used, Plus off | E-S26 line on Home; E-S10 at Keep | A, E |
| E-ST23 | Plus on, trial, renews, ends, shared | E-S11 rows | E |
| E-ST24 | Plan lapsed | E-S11.ended; E-S26; E-S10.lapsed at Keep; everything else unchanged (J-N25) | all areas: no other change. Reminders never name Plus (J-N22) |
| E-ST25 | Grace, billing retry | E-S11 registered lines | E |
| E-ST26 | Plus status unknown | no sheet; letter held (A's line) | A |
| E-ST27 | Alpha build | no gate; `alpha.note` on Plan and Welcome | E |

### 6.5 Account and phone states
| Id | State | Render | Areas |
|---|---|---|---|
| E-ST28 | Signed out with a book | the book reads (D1); Me Account signed-out state | C (C-S02), all others R0 |
| E-ST29 | Second account on the phone | E-S18 filter rule; A's book hidden and locked (O-5); no line names it; B's own unsynced letters show `signedInB-localOnly` | every list in A to D |
| E-ST30 | Consent outstanding | E-S09 routing to C-S11 | C |
| E-ST31 | Consent declined | C-S11 declined rules | C |
| E-ST32 | Under 1 GB free | E-S17 | A |
| E-ST33 | Under 50 MB free | E-S17 | A, C |
| E-ST34 | Under 20 MB mid-take | E-S17 | A |
| E-ST35 | Low Power Mode | loops off (opacity loops stop); printable PDF line; copy regeneration waits | all; C for the PDF line |
| E-ST36 | Thermal serious / critical | transcription pauses between chunks / never starts; no take refused | A (words-on-their-way line) |
| E-ST37 | First launch after an update | E-S01; re-plan notifications; waiting cards | all |
| E-ST38 | Interrupted (call, Siri, alarm, the baby) | E-S19 | A mostly |
| E-ST39 | Killed and relaunched | E-S19, Home waiting card | A |
| E-ST40 | Screen threw / fatal | E-S13 | all |
| E-ST41 | Database did not open | E-S01.recovery | all |
| E-ST42 | Link not found | E-S20 | all |
| E-ST43 | Notifications not allowed | Plan line (E-S11.notificationsOff); Reminders explains in one sentence | D, E |
| E-ST44 | Microphone not allowed / in use | A's StateScreen glyph states (`mic_denied`, `micBusy`) | A |
| E-ST45 | App lock | E-S22 | all |
| E-ST46 | iPad (App Review runs the iPhone app) | iPhone layout, centred; smoke row only | all |

### 6.6 Every error code named in a card, and how it renders
| Code | Card | Area | Render | Parent sees |
|---|---|---|---|---|
| `photo_pick_failed`, `photo_reencode_failed`, `photo_bake_timeout`, `photo_path_refused`, `photo_temp_name_refused`, `picked_file_outside_picker_folder`, `baked_file_outside_folder`, `photos_folder_unknown`; outcomes `failed`, `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`) | NS-01 | A | R2 on Ready: "That photo could not be opened" (#838); 0 files, 0 rows | the letter goes on without the picture; choose another |
| commit `no_space` | NS-01 | A | R2, E-S17 picture row | the letter goes on without it |
| commit `needs_words` | NS-01 | A | Review asks for words before Keep | speak or type |
| photo stored-copy loss after Keep | NS-01-R58 | B | R2 on the letter page once, with Add a photo | add again |
| `share_temp_write_failed` | NS-05 | B | R2 in the share preview: the words go without the picture | send words |
| `print_pdf_failed` | NS-07 C28 | C | R4 InlineState "The book could not be made this time." with Try again | try again |
| `print_pdf_disk_full` | NS-07 C28 | C | E-S17 export row, before writing | free space, smaller option |
| `sign_as_too_long` | NS-16 | A | inline under the From field (never logged with the value) | shorten |
| `SCSEL` | NS-06 B | B | R0 (a rejected write the author never sees; phone keeps its rule) | nothing needed |
| `SCPHO` | NS-01-R61 | none | R0 (only a modified client meets it) | n/a |
| `SCINV` | NS-25 | D | R2 one plain line (revoked, used, already a member opens the book) | ask for a new invite |
| `SCCAP` | NS-25-R5 | D | R2 one plain line | none (two parents already) |
| `SCPAR` | NS-25 | D | R1 (removal after 72 hours not offered) | support |
| `SCCON` | built (accept needs consent) | D, E | E-S07 first | agree |
| `SCLPG` | built (sole parent cannot leave) | D | R1 no Leave | delete the book instead (C-S22) |
| `errors.paused` (`SCKIL` server switch) | NS-25-R11 | D | R2 `familyCopy.errors.paused` | try later; cancel works |
| `ScheduleResult` failure | NS-32 | D | R2 in Me, Reminders (built `lastScheduleResult`) | try again |
| `mic_denied`, `storage_low` | built (`mic-state.logic.ts`) | A | R4 glyph state | Open Settings; Type instead |
| Auth kinds (`AuthErrorKind`, 18 values) | NS-10, F02 | E | J-E08 table | per row |
| Export errors (existing) | NS-11 | C | existing export lines | per row |

## 7. Components: reuse first, three proposals

Every area uses these existing components; E keeps their rules: Button (primary 56, quiet 44, outline), IconButton, Text (token type styles), ListRow, Sheet and ModalHeader, Dialog `confirm()`, Toast (one at a time, T4 undo windows through BL-954), EmptyState, StateScreen and InlineState, PlainScreen, Lamp and QuotePair, AgreementRow, ChoiceGroup and Chip, TextField and TextArea (D2 writing tools off on letter fields), Toggle.

Proposed (named and justified; specs go to `docs/design/COMPONENTS.md` once accepted):
1. **SystemLine** (new, `components/ui/system-line.tsx`). Why: today each feature draws its own one-line state (`ErrorLine` in auth, pack status strings, `account.gateOffline`, the paused invite line, the plan notifications line), with different glyphs, colours and announcement rules. One component makes the catalogue renderable the same way in every area. Props: `kind` (info, waiting, paused, offline, action), `text`, optional `action {label, onPress}`, `announce` (polite, once). Glyph plus words, never colour alone; `subhead` text, wraps to any length at AX5, action drops below the text at AX3+. No motion but the 200 ms fade. Not a banner: it sits under the control it is about.
2. **StateScreen `note` slot and heading ref** (extension). Why: E-S14 needs the local-start note to follow the body only when its button shows, and both E-S14 and C-S10 need focus on the heading itself (both asked for in `outage-screen.tsx` and `new-phone-screens.tsx`).
3. **HeldLetterCard** (extract, no new look). Why: the Keep gate sheet's held card and Home's waiting card draw the same letter preview; one component keeps the "Waiting" chip text-plus-shape rule (NS-33-R12 spirit) and the VoiceOver single-element label in one place.
No global banner, toast-for-errors or modal alert is proposed for system states.

Token gaps (TDD 09) seen while designing: `destructive` still equals `recording` (TDD 09 Q1); no semantic token for a neutral system surface, so SystemLine uses `surface` and `textMuted` (adequate: 5.11:1 light, 8.01:1 dark). No new token proposed now.

## 7a. Material policy and the system components (design system v2, `docs/design/system/`)

The coordinator relayed on 20 Nov that design system v2 adopts Apple's Liquid Glass under a decided policy (`system/BRIEF.md` section 3) and that the shared catalogue is now `system/COMPONENTS.md`. Area E keeps the state catalogue and renders each state with the system's components. `tokens.v2.json` was not on disk at this pass and `FOUNDATIONS.md` arrived at its end; names below are from `system/COMPONENTS.md` and `system/MOTION.md`, and token names stay the v1 names until `tokens.v2.json` lands.

How my proposals map to the catalogue (the catalogue's names win):
| This file | System component | Note |
|---|---|---|
| SystemLine (section 7, item 1) | F2 Banner (SystemLine) | adopted as is: content layer, `surface` fill, never glass, one per screen with the catalogue's priority order. One difference to settle: the catalogue places it under the screen header; for a line about one action (Restore, Send link, an invite) E places it under that control. Proposal: header placement for screen-wide states (offline on a screen that needs the network, paused, update available); control placement for action results |
| StateScreen `note` slot and heading ref (item 2) | C8 State screen | adopted (the catalogue adds `note`) |
| HeldLetterCard (item 3) | C1 Letter card (compact) inside F4 | withdrawn as a separate component; F4 uses C1 compact |
| Keep gate sheet | F4 | glass regular (system sheet); buttons inside are filled or plain |
| Sign-in sheet E-S04, plan note E-S25 | N7 Sheet | glass regular |
| Undo and result toasts | F1 Undo toast | glass regular; T4 window |
| Crash, launch recovery | C8's provider-free twin PlainScreen | content |

Layer per E screen (at most three glass surfaces; never glass on glass):
| Screen | Glass | Content (never glass) |
|---|---|---|
| E-S01, E-S03, E-S02, E-S08, E-S13, E-S14, E-S20, E-S22, E-S24 | none (navigation buttons only where a native header exists) | the whole screen: paper, lamp, StateScreen |
| E-S04, E-S05, E-S06, E-S07 (sheets) | the sheet (1) | fields, lines; buttons filled or plain inside the sheet |
| E-S10 | the sheet (1) over Review | held card (C1), body, buttons filled or plain |
| E-S11, E-S16, E-S21 (Me lists) | navigation bar or tab bar (1), toast (2) | grouped lists, the banner |
| E-S25 | half sheet (1) over Home, with tab bar (2) | text |
| A-S01 with E-S26 | tab bar (1), capture cluster (2), toast or sheet (3) | the Plus line is content |

Material tokens (from `system/FOUNDATIONS.md`, which landed at the end of this pass): glass surfaces use `material.glass.regular`; the fallback is `material.solid`; no E screen uses `material.glass.clear` or `material.glass.dim` (no E control floats over a picture); custom `GlassView`s pin `colorScheme` to the app's scheme (FOUNDATIONS line 58). State screens use the large Light glyph at 44 pt, hierarchical, `textMuted` (FOUNDATIONS icon table).

Fallbacks every E state must show (the prototype has toggles for both): Reduce Transparency, iOS before 26 or glass unavailable: every glass surface becomes the solid twin (`surfaceRaised` fill, 1 pt `line` hairline), same shape and size. Increase Contrast: hairlines become `controlBorder`, muted text steps to `highContrast` values, glass gains a visible edge. Never animate glass by opacity (system MOTION; `expo-glass-effect`).


## 8. The "coming soon" audit (brief item)

1. `flags.familyTeaser` defaults to `coming_soon` (`packages/api/src/remote-config.ts:88, 90, 122`). Read in code on 20 Nov: no screen or hook reads it (only a comment in `lib/capabilities.ts:24` and `apps/mobile/test/capabilities.test.ts:411`). So no screen shows it today. The family page (`app/family.tsx`), `/invite`, `/invite/new` and child settings all send the parent Home or draw no row when sharing is not in the build. Designed absent state (E-ST14): no tab, no row, no caption, no chevron, no screen, no line, in every value of the flag. Engineering gap G-E01: change the default to `quiet` or retire the key in the next schema version, so a future reader cannot draw a teaser by default.
2. `app/invite/leave.tsx` `LeaveLater` draws a sheet titled `familyCopy.soon.status` ("Coming soon") with `leave.later` ("Leaving a shared book is coming in a later update.") in a servers-on alpha build when `/invite/leave` is reached. No link points there, so it is dormant, but it is a coming-soon surface. Designed absent state: redirect Home as every other co-parent route does. Engineering gap G-E02.
3. `languageCopy.picker.englishOnly` and the second sentence of `languageCopy.waitingForLanguage` say "Other languages are coming in a later update." The first is a picker footer in English-only builds; the second is the line NS-17's happy path step 3 cites. Both are coming-soon lines. Designed: the picker footer absent; the waiting line keeps only "This recording is waiting for its language." Card gap K-E01 (NS-17 cites a string that carries a forbidden sentence); hand-off to content and area A.
4. `familyCopy.soon.*` keys and `settingsRowHelp` remain in content but are drawn nowhere except item 2. Content may retire them.
5. `packages/content/src/release/app-review.en.ts:4` notes D-160 ("co-parent surfaces may show coming soon"). Founder answer of 19 Nov supersedes it (frame section 4); content owns the note.

## 9. Accessibility walk (NS-33) and speed sheet (NS-34) as a design matrix (E-S23)

Run per release candidate on SE 3 (iOS 17 and latest), Asha install only (D13). Screens: Home, Listen, Review, the Book, the letter page, Me, Read together (NS-33 section 3) plus every E screen.

| Row | Check | E screens where it bites | Design answer |
|---|---|---|---|
| NS-33-R1 | letter page dateline is a level 1 heading | n/a (B) | B |
| NS-33-R2 | Me heading equals tab label | C-S01 | "Me" (today "Settings") |
| NS-33-R4, R7 | AX5 plus Bold Text: no control under 44, no truncation | E-S02, E-S03, E-S08, E-S10, E-S14 | actions stack and pin; drawings hide above AX2; content scrolls |
| NS-33-R5 | no moving loop under Reduce Motion | E-S01 migrating, E-S02 lamp breath, loading states | breath off; still drawing |
| NS-33-R6 | VoiceOver core loop | E-S10 inside the loop | sheet is modal, title focused, escape back to Review |
| NS-33-R8 | 4.5:1 under Increase Contrast | all | tokens `highContrast` |
| NS-33-R9 | Voice Control names = visible words | all | no icon-only buttons; Close has its word in the label |
| NS-33-R10 | Switch Control reach | all | no gesture-only action; sheets have Close |
| NS-33-R11 | Smart Invert ignores pictures and the brand mark | E-S02 lockup, E-S22 lockup, E-S10 held card picture | `accessibilityIgnoresInvertColors` on them |
| NS-33-R12 | recording state not colour alone | n/a (A) | A |
| NS-33-R14 | Bold Text on Mukta, Literata, Tiro | all | font token switch to the next heavier cut (Mukta-Medium, Literata-Medium) when Bold Text is on (BL-984) |
| NS-33-R15 | undo windows wait for VoiceOver | toasts | BL-954 |
| NS-33-R16 | XCUITest audit at AX5, zero critical | all named | |
Speed (NS-34) design markers: the screen change begins within 100 ms of the tap; controls usable by 350 ms; named hand-offs within 900 ms (`motion.sequenceMaxMs`); save hand-off within 2,000 ms (`motion.hardCeilingMs`); E-S10 must rise within the Review to Keep hand-off, so the gate decision is local (Keychain ledger and cached StoreKit status), never a network wait.

## 10. Card gaps (never changing a card; each with a proposed default)

| Id | Card row | What is missing or wrong | Proposed default |
|---|---|---|---|
| K-E01 | NS-17 happy path step 3 cites `languageCopy.waitingForLanguage` | its second sentence is a coming-soon line, forbidden by the brief's rule | keep the first sentence only |
| K-E02 | X4-R1, NS-10-R3 | what a signed-out phone shows when it holds books of two accounts (A then B both signed in and out) | show the book of the account that signed out last; the other returns when its account signs in |
| K-E03 | NS-35 Low storage row ("Home's low-storage rules"), NS-10 Low storage row ("the existing storage card shows") | a storage card on Home or the Book is not a registered slip (`[FRAME-SLIP]`) | storage messages live on Listen (built full state) and in Me, Storage; never on Home |
| K-E04 | D1, Erase everything (C) with a second account | Erase everything while B is signed in would erase A's rows too; no card says whether it may, or what it says | it erases everything on the phone and its sheet says "every book on this phone" without naming any |
| K-E05 | none | no card specifies the app update state (`minSupportedVersion`) the brief lists | E-S16: one line in Me, never blocks, never on Home |
| K-E06 | E-S13 (`errors.crash.body`) | "Your letters and recordings are safe on this phone." is a safety claim on a failure screen; no claims row checked it for the case where the database is what failed | keep for the boundary (React) case; the launch recovery already avoids the claim; CCO checks the claims row |
| K-E07 | `killSwitches.sync` (NS-10, NS-06, NS-09) | no card says what Me, Account, Sync shows while sync is paused | a paused value "Paused for now" (PROPOSED), not "Waiting for a connection", which would blame the network |
| K-E08 | NS-33 section 3 | E screens (first run, gate sheet) are named only by "First use" and "Plan lapsed" scenario rows, not in R4 and R7's screen lists | include E-S02, E-S03, E-S08, E-S10 in the AX5 device rows (BL-948) |
| K-E10 | NS-38 to NS-45 (not yet on disk); C44 | an "age and region risk check" is asked for; the app has an age gate (18+) and no region check; store availability is per storefront | no in-app region check; if counsel requires one, a stop line in the gate's room (E-S03.region, HOLD), nothing stored, no reason asked, no retry except after travel; the age stop keeps its 24 hour retry |
| K-E11 | F02 (cited) | Send link and the code's Continue are disabled with no reason in words, against the house rule "Continue is never disabled" used on the age gate | the button stays tappable; a tap says why (E-S05.reason-empty, E-S06.reason-short; words PROPOSED in WORDS.md) |
| K-E12 | F01 (cited), account-first path | the name is optional on the account-first path but required on the servers-off path (`nameRequired`); no card says which rule a store build follows | optional everywhere; the book cover reads "Letters to your child" until a name is added (PROPOSED) |
| K-E13 | NS-13 door lines; E-S12 | two notification asks exist (the reminder ask and Plus confirmed's "Remind me"); "Never: a second ask from us" | whichever comes first asks iOS; the other then shows no ask, only the result (allowed: nothing; denied: the Plan or Reminders line) |
| K-E14 | none | what information first run collects, in one place, for the founder's "information collected and verification" | the table in E-S28 plus: age boolean and agreement (phone), Apple identifier or email (server, verified by Apple or the email link or code), acceptance rows (server), child name optional, date, signs-as (phone, then synced). Nothing else; no phone number, no password, no birth year of the parent |
| K-E15 | remote config comment (`minSupportedVersion`: "never blocks local use") vs system COMPONENTS F2 "update required (becomes C8)" and MOTION E-M56 "block over everything" | a blocking update screen would stop recording and reading, which LEGAL-REQ-040 forbids a remote value to do | no blocking update screen; E-S16 is a line in Me; a feature that truly needs a newer app hides itself (absent rule) and its pack row says "Needs the latest version of the app" |
| K-E16 | NS-10 second-account row vs MOTION E-M57 "held block with Sign out only" | NS-10 says the app offers B their own book or a new one | no block: B lands on C-S10 or "No book here yet" with Start a book (E-S18) |
| K-E09 | C25, C44 cited rows | first run and Plus rows are cited to F01, F14 which this pack did not re-lock; the brief asks for "every locked-pack change" | E treats only NS-10, NS-17-R1, NS-33, NS-35, D1, T2 as the changes; any other F01 or F14 change needs a card |

### 10a. Card gaps answered by card 19 and the rulings (20 Nov)

| Gap | Answer | Where in this file |
|---|---|---|
| K-E01 language waiting line | First sentence only; no "later update" line anywhere in first run (NS-43-R11) | E-S08.languages |
| K-E02 signed-out phone with two accounts' books | Show the book of the account that signed out last (O-5) | E-S18 |
| K-E03 storage card on Home | Not on Home; Listen and Me, Storage only (card 19 K-E03) | E-S17 |
| K-E04 Erase everything with two accounts | Erases every book; the sheet says "every book on this phone" and names none (NS-45 section 5, O-5) | E-S18 |
| K-E05 app update state | NS-45-R13 (required: a line in Me, never blocks), R14 (available: nothing) | E-S16 |
| K-E06 crash body "safe" on a fresh install | `errors.crash.bodyNoBook` when no book is on the phone; the sentence only on the React boundary path | E-S13 |
| K-E07 paused sync value | "Paused for now", agreed in principle; NS-10 owns it | E-ST05 |
| K-E08 E screens in NS-33's AX5 lists | E-S02, E-S03, E-S04 to E-S08, E-S10, E-S14 are in card 19's AX5 rows (NS-40-R13, NS-41-R22, NS-42-R15, NS-43-R13, NS-45-R18); section 9 adds E-S24, E-S30 | section 9 |
| K-E09 first run and Plus only "cited" | Closed: card 19 re-locks first run (NS-38 to NS-45) | section 0 |
| K-E10 region | No in-app region question; the server refuses sign-up from refused places with E-S04.refused-region; E-S03.region is retired | J-E01 step 4 |
| K-E11 silent disabled buttons | Reasons in words (NS-41-R8): `authCopy.email.needEmail`, `authCopy.code.digits` with `{n}` | E-S05, E-S06 |
| K-E12 optional name | Optional everywhere (NS-43-R1); shown in words | E-S08, section 14.2 |
| K-E13 two notification asks | Unchanged: whichever comes first; Days adds one more first-tick ask under RV-9 (see D-3) | E-S28 |
| K-E14 information collected in one place | Card 19 "Information collected" tables (NS-40 to NS-45); E-S28 keeps the permissions order | E-S28 |
| K-E15 blocking update screen | Held: no blocking screen (NS-45-R13); F2 `update required (becomes C8)` stays contradicted | E-S16, section 17 |
| K-E16 second-account held block | Held: no block (NS-41-R6, O-5) | E-S18 |
| CG1 to CG14 (WORDS section 10) | Answered in card 19 "Card gaps answered"; words changes (CG3, CG4, CG5, CG13) are content's | WORDS.md |
| New K-E17 | Where "If you are struggling" lives and its id (E-S30, E-S31) | E-S30 |
| New K-E18 | Whether a notice at collection sits above the Welcome's agreement line (PRV-24) | E-S02.notice |

## 11. Engineering gaps (with the backlog row each belongs to)

| Id | Gap | Belongs to |
|---|---|---|
| G-E01 | `flags.familyTeaser` defaults to `coming_soon`; set the default to `quiet` or retire the key in the next schema version, with a test that no screen reads it | new row beside BL-983 (NS-25) or BL-958 (flags) |
| G-E02 | `app/invite/leave.tsx` `LeaveLater` draws "Coming soon" in servers-on alpha builds; redirect Home | BL-983 |
| G-E03 | no consumer of `minSupportedVersion`; E-S16 needs a reader and an App Store link from `packages/brand` | new row (platform); BL-987 lists engineering facts but not this |
| G-E04 | the under 1 GB calm line on Listen is not built (only the 50 MB block in `free-space.ts`); the 20 MB mid-take stop is UNVERIFIED in code | BL-929 run sheet records it; a new mobile row for the line |
| G-E05 | the first-run gate returns `openTonight` for any session when the phone holds a book, so account B could see A's book; every list must filter by owner | BL-961 |
| G-E06 | `needsConsent` with no local book still reaches E-S08 | BL-922 (holds the Build 13 cut) |
| G-E07 | StateScreen has no `note` slot and no heading ref | BL-928 or a design-systems row |
| G-E08 | SystemLine component does not exist | new design-systems row; adopters in BL-978 (NS-10) and BL-983 |
| G-E09 | `killSwitches.bookSearch`, `reminders` and the platform review's seven proposed keys do not exist; each needs its R1 hidden state tested | #798 for `bookSearch`; ADR 0029 rows for the rest |
| G-E10 | Bold Text does not reach the three custom fonts | BL-984 |
| G-E11 | no view sets `accessibilityIgnoresInvertColors` (pictures, lockup) | BL-956 (pictures), BL-984 (lockup) |
| G-E12 | Account Sync row has no value for a paused sync | BL-978 |
| G-E13 | the Plus gate decision must stay local to meet the 900 ms hand-off; confirm StoreKit status is cached and the `hold` path never waits | BL-929 sheet row; mobile |

## 12. Reconciliation with MOTION.md and WORDS.md (done 20 Nov)

Naming rule: in the docs a state is `E-Snn.<state>` with `error-<code>` and `reason-<what>` hyphenated as WORDS.md writes them; the prototype's state switcher uses the same names in camel case (`errorWrongCode` is `error-wrong_code`, `reasonEmpty` is `reason-empty`).

Aliases adopted (both names point at one state; the first is canonical):
| Canonical (this file) | Also used in | As |
|---|---|---|
| E-S01.recovery | MOTION, WORDS | `E-S01.error-launch` |
| E-S01.recovery-exporting | WORDS | `E-S01.loading-export` |
| E-S02.restoring | WORDS | `E-S02.loading` |
| E-S06.paused | MOTION | `E-S06.error-code` covers `error-wrong_code` and `error-expired` (one motion for both) |
| E-S07.loading, E-S07.default | earlier draft | `settingUp`, `terms` (retired) |
| E-S24 | WORDS | `E-S07.claim` |
| E-S10.hold | MOTION | E-ST26 (Plus not known: no sheet) |
| E-S15 kinds `offline`, `paused`, `update-available` | MOTION, WORDS | system F2 Banner variants `offline`, `paused`, `update available` |
| E-S17.under1gb, under50mb | MOTION | `E-S17.low-1gb`, `low-50mb` |
| E-S18 (a rule, no screen) | MOTION | `E-S18.second-account` |
| E-S16.line | MOTION | `E-S16.default` |
| E-S22.locked | MOTION | `E-S22.default` |

Taken from WORDS.md (its reconciliation notes): "Sign in with email" (the glossary bans "Continue with email"); the servers-on Welcome is the account-first screen as built, "Begin the book" is the servers-off Welcome; the name is optional on the account-first path; new states E-S05.reason-empty, E-S06.reason-short, E-S06.help, E-S13.noBook, E-S20.noBook, E-S03.region (HOLD), E-S10.error-codeFailed; the update line's keys `system.update.line` and `system.update.storeButton`; E-S22.failed has no built line (the system sheet speaks), so the prototype's line is marked PROPOSED.

Taken from MOTION.md: the banner appears only after its condition holds for `systemLine.showAfterMs` (proposed 2,000 ms, offline only) so a radio blink shows nothing; E-S09 and C-S10 share E-M20 to E-M23.

Disagreements returned to the motion lead (design wins per MOTION.md section 11, and each rests on a card):
1. `E-S14.killswitch` does not exist: with `serverFeaturesEnabled()` off the phone shows its local book or the servers-off Welcome, never a problem screen (NS-10-R8). E-M52 drops that state.
2. E-M56 (update required, "block over everything") is withdrawn: K-E15.
3. E-M57 (second account, "held block with Sign out only") is withdrawn: K-E16; B's arrival uses C-S10's motion.

Returned to the system components lead: F2's `update required (becomes C8)` variant conflicts with K-E15; C8's `killSwitch` variant is used only when a paused feature's route is reached directly (an old link), otherwise the absent rule applies.

Closed in v2 (20 Nov): `tokens.v2.json` and `FOUNDATIONS.md` are on the branch (token names `target.md`, `size.row`, `layout.*`, `material.*` are v2 names; `layout.rowMin` and `target.md` are still name requests in COMPONENTS section 9); NS-38 to NS-45 are on disk and J-E01 is re-keyed to them (section 3). Disagreement 1 above still holds and now rests on NS-41-R25 as well: there is no `E-S14.killswitch`; `killSwitches.signIn` is the one remote sign-in pause and it renders E-S14.signInPaused. The three E-M rows withdrawn here (E-M52 killswitch state, E-M56 update block, E-M57 held block) stay withdrawn.

## 13. Consolidated state and error inventory for every new state (v2)

One place for the states and errors that the final pack adds, so areas A to D point at ids, not prose. Render classes as section 6 (R0 silent, R1 absent, R2 SystemLine in place, R3 toast, R4 StateScreen or InlineState, R5 sheet, R6 PlainScreen). Motion ids are in `MOTION.md` section 4y. Every row obeys: no count, no streak, no red, no exclamation mark, and the book and recording, typing, saving, reading, playback, export and deletion stay open (LEGAL-REQ-040).

### 13.1 New and changed system states

| Id | State | Trigger | Render | Parent can | Card row and ruling | Motion |
|---|---|---|---|---|---|---|
| E-ST47 | Server restored | a restore from backup: sessions are not in the dump, so everyone is signed out once and phones re-upload | as E-ST17: R0 on Home; Me, Account shows `session_expired` once; Sync row "Paused for now" during the restore (E-ST05); the book stays (D1) | sign in again | OPS-07, REL-07, REL-18; NS-45-R3 | E-M58, E-M49 |
| E-ST48 | Sign-in paused (`killSwitches.signIn`, PROPOSED) | the signed config says stop | R4 E-S14.signInPaused on first run with Start on this phone; signed-in sessions never touched | Start on this phone; try later | NS-41-R25, O-19 | E-M105 |
| E-ST49 | Library of days paused (`killSwitches.libraryDays`, PROPOSED, one boolean, fail-open) | the signed config says stop; not deliverable in a servers-off build | R1 at the next focus: the library section, Browse, the ask slip and the day slip leave with no hole and no badge; library reminders cancelled; typed days stay on C-S24 | keep using typed days | RV-10, NS-46-R28 | E-M43 |
| E-ST50 | Days store unreadable (`days_store_unavailable`, local) | the library file cannot be read | R2 SystemLine (`waiting`) in the library section of C-S24 only, with Try again; typed days still listed; no whole-screen state, no red | Try again | NS-46 section 6; design-systems F46-1 | E-M40 |
| E-ST51 | Suspended account | back office suspends the account | R2 SystemLine on C-S02 (the book stays readable, sync waits, Save a copy and Delete account stay reachable); the words say what happens, never why | read, save a copy, delete | BKO-26; K15 | E-M40 |
| E-ST52 | Quiet day today (Memorial Day, Veterans Day, Good Friday, Yom Kippur) | a ticked quiet day is today | R0 system-wise; on Home the quiet line replaces the prompt block, Speak and Type unchanged (RV-7); no question anywhere | speak or type as any day | RV-7, NS-46-R13, NS-50-R15 | none: drawn with Home |
| E-ST53 | Day slip hidden by a higher slip | rank 1, 2 is due | R1: no day slip until the next visit; the cost is accepted (RV-6) | nothing needed | NS-50-R4, R5 | none |
| E-ST54 | Quiet or hidden book | `bookIsQuiet` or hidden (BL-985) | R1: no day slip, no day reminder, no ask | nothing needed | NS-50-R8, NS-46-R25 | none |
| E-ST55 | Suggestions picker unavailable | iOS below 17.2 (hidden below, Q-FD-32), flag off, entitlement not known, Android, Expo Go | R1 the "Pick from recent days" item is absent; Start from a photo opens Apple's picker directly (absent rule) | choose a photo | NS-49-R5, R28 | none |
| E-ST56 | Suggestions cancelled, declined, empty or off | the app is told nothing (F49-2) | R0: Home as before, no draft, no file, no message | the menu is one tap away | NS-49-R11 as changed by design-systems F49-2 | none |
| E-ST57 | Notifications not allowed and a day ticked | iOS permission off | R2 one line using the D-S06 `.denied` card wording and Open Settings; the tick is stored; no promise of a reminder | Open Settings | NS-46 state space; F46-4 | E-M40 |
| E-ST58 | Day-name switch while App lock is on | App lock on | present and not ready: the switch is off and disabled with its reason line (mandatory); it does not come back on by itself | turn App lock off to use it | NS-47-R14, R36; F47-6 | none |
| E-ST59 | Days store cleared | sign-out, Erase everything, Delete account | R0 plus one calm line on C-S03, C-S19, C-S20 | choose days again | NS-47-R15 to R17; Q-FD-12 | none |
| E-ST60 | Reminders off, a day ticked | Reminders switch off | R2 one calm line on Reminders: chosen days still send a reminder | turn Reminders on or untick | RV-9; NS-46-R31 | E-M40 |
| E-ST61 | Second account and the days store | A signs out, B signs in | A's store was cleared at sign-out; B sees nothing and is asked afresh | answer the ask | NS-47-R15 | none |
| E-ST62 | Re-consent required | a new major Terms version | R5 E-S07.reconsent over a calm tab root before sync resumes; local use unaffected | Agree and continue; Not now | NS-42-R10, R11 | E-M104 |
| E-ST63 | Sign-up refused for the region | the sign-up hook refuses | R4 E-S04.refused-region; nothing stored; existing accounts unaffected | Terms, Contact us | NS-40-R9, R11, R14 | E-M101 |
| E-ST64 | Platform says a minor | Declared Age Range answers under 18 (when it ships) | R4 E-S03.platformMinor; nothing stored, logged or sent | none | NS-40-R5, R6; K5 | E-M100 |
| E-ST65 | Account deleted elsewhere | the account was deleted on another phone | the phone keeps its letters (O-15); Me shows one line once and points to Erase everything; a claim after deletion is E-S24.accountDeleted | keep, or Erase everything | NS-45, O-15; LCY-11, LCY-19 | E-M107 |
| E-ST66 | `upgrade_required` or `gone` from the server | server answer | R2 E-S16 (second wording) in Me; nothing on Home | Update | NS-45-R13 | E-M106 |
| E-ST67 | Email to the account bounces | the sign-in address does not receive mail (MSG-05) | R2 a quiet row on C-S02: "We could not reach {email}" with Fix address; a relay address shows the method | Fix address | MSG-05, MSG-07 (assigned to C-S02, see section 17) | E-M40 |
| E-ST68 | Speech download not possible | cellular only, no space, paused remotely, needs a newer app | E-S08.open and the Language rows say it in words: waiting for Wi-Fi, needs space, paused, needs the latest version | Try again later; keep recording | NS-39-R13; AIS rows | E-M103 |

### 13.2 Error codes the final pack adds or changes

| Code or kind | Card | Area | Render | Parent sees (intent; `content` words) |
|---|---|---|---|---|
| sign-up refusal (hook, no app code) | NS-40-R9 | E | R4 E-S04.refused-region | "{app} can't be set up from here." with Terms and Contact us |
| `under_18`, platform minor | NS-40-R3, R5 | E | R4 E-S03.stop, platformMinor | one line in the same room |
| `invalid_email`, empty email | NS-41-R8, R24 | E | inline, focus to the field | "Type your email to continue." and the invalid line |
| code short; code length `{n}` | NS-41-R8, R10 | E | inline | "The code has {n} digits." |
| `code_paused` (5 wrong in 15 min) | NS-41-R9 | E | E-S06.paused | newest link and Apple still work |
| `email_wait` (429 on send) | NS-41-R12, R21 | E | E-S14.outage on first run | Sign in with Apple still open |
| `other_phone`, `other_phone_spent`, `already_signed_in` | NS-41-R3, R4 | E | E-S06.refused-* | type the code instead; how to change accounts |
| `consent_unavailable`, `SCCON` | NS-42 | E, D | E-S07.error-consent_unavailable | Try again |
| `session_expired` (epoch, revoked, Apple revoked, restore) | NS-45-R3, R4 | E, C | once in Me, book stays | Sign in |
| `upgrade_required`, `gone` | NS-45-R13 | E | E-S16 | the update line |
| `deleted`, `purged` on a new phone | NS-10, NS-45 | C, E | E-S24.accountDeleted or C-S10 | keep these letters in this account? |
| `days_store_unavailable` | NS-46 section 6 | C | E-ST50 | one line, Try again |
| `libraryDays` paused | NS-46-R28 | C, A | R1 absent | nothing |
| suggestion without a photo (`noPhoto`) | NS-49 (A-S03) | A | area A's line | "That one has no picture." (intent) |
| speech model: needs space, paused, waiting for Wi-Fi, `needs_app_update` | NS-39-R13 | E, C | E-S08.open and Language | in words, never a percentage |
| Delete account offline | NS-45-R15 | C | `deletion.offline`: nothing changed, a connection is needed | try again online |

## 14. Foundations and tokens needed by the final pack

Standing duty 2 (design systems): close token and component gaps. Area E names what it needs; the system files (`docs/design/system/COMPONENTS.md`, `FOUNDATIONS.md`, `tokens.v2.json`) are outside this folder, so every item below is paste-ready text for the coordinator to apply, not an edit made here.

### 14.1 DoorNote (new shared component; answers design-systems F47-1, F-X2)
- Purpose: the one sentence a parent must read before choosing, set where a choice is recorded: "your faith and origin stay on your phone", the sensitive-data answer, the backup consent door. It is a promise, not a hint (NS-47-R28, a promise, reason (a)).
- Anatomy: a static block on `surface`, `radius.md`, 16 pt padding; text in `callout` colour `text` (not `textMuted`); a decorative lock glyph, hidden from VoiceOver; no title, no button, no chevron, no info glyph.
- Variants: `short` (one sentence, under the question on the ask slip) and `full` (the whole call-out, at the top of C-S25 and C-S24).
- Rules: never collapsed, never behind a glyph, never dismissible, never glass, never animated; in reading order before the first control that records a choice; wraps at AX5 and never truncates; every sentence has a claims row (NS-47-R22). The Shown, Records, Never and Decline lines (COORDINATION section 10) are spec lines in the design file, and the DoorNote shows only the sentence a parent needs.
- A11y: one VoiceOver element, label equals the text; Voice Control n/a (not interactive); contrast `text` on `surface` above 4.5:1 in every scheme per FOUNDATIONS (quoted, not recomputed).
- Used by in area E: E-S07 (the privacy body above "Agree and continue" and the sensitive-data step), E-S02.notice if counsel adds the notice at collection (D-5), C-S21 at the backup flip; by others: A-S01 askSlip, C-S24, C-S25, NS-10 sheets.
- Implementation: `components/ui/door-note.tsx`; test `[NS-47-R28] call-out is visible, static and first`.

### 14.2 Optional-field pattern (I1 `optional` slot and a paired-answers `decline` role; answers F47-2)
- Words, not colour: the label is followed by the word "Optional" in `footnote` `textMuted` (never an asterisk, never placeholder-only); VoiceOver reads "{label}, optional"; Voice Control name equals the visible label.
- Nothing is preselected; skipping writes nothing and prompts nothing later.
- Two shapes. (a) A field inside a step that has a required control (E-S08: name is optional, date is required): Continue is the skip, and the step has no second "Skip" control. (b) A step made only of optional answers (the Days ask, C-S25): the accept and decline controls are the same style and size in one stack, stacked at every size, "Not now" never smaller or quieter than "Choose days" (NS-47-R25).
- The reason line for a required neighbour stays in words under Continue (NS-43-R2).
- Applies in area E: E-S08 name; any later optional field in Me. Does not apply to age, agreement or sensitive-data answers, which are required choices with equal answers (NS-42-R4).
- Implementation: `optional` boolean on `components/ui/text-field.tsx`; the `decline` role in the D-S04 pattern; WCAG 3.3.2 is the likely criterion (UNVERIFIED).

### 14.3 Home slip host: variants `daySlip` and `askSlip` and the order as data (C9 text for COMPONENTS)
Paste into COMPONENTS C9 (replaces the Anatomy and States bullets; the order is RV-5 and RV-6, not the design-systems review's "2c"):
- Order as data in `slip.logic.ts` with a test: 1 waiting set; 2 seal-opened line on its day; 2b a day the parent chose, today (`daySlip`); 3 Save a copy in the birthday week; 3b the Days ask (`askSlip`, once, capped at two showings, then it retires to Me, Days; NS-47-R31); 4 one past letter. At most one renders; absent means no space is kept. The reminder ask and the Plus line are not slips; the picture start is in the capture cluster, never a slip or a tile (NS-50-R10).
- One placement: the slip slot sits directly above the prompt block (the same place whether Home opens by the icon or by a tap on the 09:00 reminder; NS-50-R4, RV-6). At AX5 the slip scrolls with the content above the prompt and never sits between the prompt and the capture cluster. Quiet day: the quiet line replaces the prompt block, and Speak and Type are unchanged (RV-7).
- `daySlip` (rank 2b): `surfaceRaised`, `radius.md`, 16 pt padding; the day's name and one line in `callout` `text`; no destination, so the card is not a button; one non-interactive VoiceOver element labelled "{name}. {line}" with a custom action for the dismissal, plus a separate visible dismiss button of 44 pt or more reachable by Voice Control and Switch Control; at AX3 and above the button takes its own full-width row; no nested interactive child in an accessible group; the hint says the consequence ("Hides this until tomorrow") (NS-50-R7, R13). A day named only when it is today, never a list of upcoming days, never a count.
- `askSlip` (rank 3b): a question in `callout`, the DoorNote `short` form under it, then "Choose days" and "Not now" as two `bordered` buttons of the same style and size (`size.control.md` 48, pending `target.md`), stacked at every size, neither `filled`. The hint on Not now says "Closes this question. You can still choose days in Me." On an SE 3 at the default text size with the ask showing, the prompt's full text is visible above the capture cluster without scrolling, or the ask moves below the prompt (device check, NS-50 risk checks).
- Words: "Not now" means different things on the two slips (until tomorrow, versus final for Home); `content` decides whether the day slip uses another word (open question D-7).
- Motion: cold launch `m.enter.group`; later visits already in place (T-RESUME); a dismissal `m.list.remove`; a day change removes it with no animation; under Reduce Motion each becomes `m.fade` or a jump; no haptic (NS-50-R12 as P1).
- Layer: content; the Home glass budget is unchanged (tab bar and capture cluster stay the only glass).

### 14.4 Other component and token gaps
| Gap | Needed by | Proposal |
|---|---|---|
| I4 `multi` variant (list of tick rows) | C-S25 Browse (not area E) | row of at least `size.row` 52, check shape plus name, date in `footnote` `textMuted`, role checkbox, `m.select`, H-select on a change; no select all |
| `target.md` 48 and `layout.rowMin` 52 | ask buttons, Browse rows, E-S30 rows | still open name requests in COMPONENTS section 9 and DS2-02; E rows use `size.row` 52 meanwhile |
| F2 SystemLine placement | E-ST47, E-ST50, E-ST51, E-ST67 | header placement for screen-wide states; control placement for a result of an action; at most one per screen, priority order in F2 |
| StateScreen `note` slot and heading ref | E-S14, E-S04.refused-region | as section 7, item 2 (G-E07) |
| Selected-state shape on pills and the agreement box | E-S03 | check glyph and weight in addition to colour; `m.select` on change |
| No new colour, type token or motion primitive | all of the above | uses `text`, `textMuted`, `surface`, `surfaceRaised`, `callout`, `footnote`, `m.select`, `m.enter.group`, `m.list.remove`, `m.fade`, `m.swap`, H-select |
`destructive` equals `recording` (TDD 09 Q1) is unchanged and no new E state needs a destructive colour.

## 15. Liquid Glass policy check for every new surface (`system/BRIEF.md` section 3)

Rules applied: at most three glass surfaces on a screen; never glass on glass; information and state lines are content; sheets and bars are the system's glass; Reduce Transparency, Increase Contrast and iOS before 26 fall back to the solid twin (`surfaceRaised` fill, 1 pt `line` hairline, same shape and size).
| New surface | Layer | Check |
|---|---|---|
| E-S04.refused-region, E-S03.platformMinor | content (StateScreen) | no glass; passes |
| E-S14.signInPaused | content | no glass; passes |
| E-S07.reconsent, E-S07.sensitive, E-S07.offline | the sheet is glass (1); inside: buttons `filled` or plain, DoorNote content | passes; no toast over the sheet |
| E-S08 optional marker, why-we-ask line, speech card states | content | no glass; the speech card is a content card on paper; passes |
| E-S16 (both wordings) | content line in Me (F2) | Me has the tab bar (1) and the navigation bar (2); the line is content; passes; no toast for the update |
| E-S18 localOnly SystemLine, E-ST47, E-ST50, E-ST51, E-ST67 | content lines (F2) | never glass; passes |
| E-S24.methodOnly, accountDeleted | content on a pushed screen in the sign-in modal (the modal is the system's glass; the screen content is paper) | passes |
| E-S30, E-S31 | content | no glass; passes |
| DoorNote (all uses) | content | never glass (NS-47-R28); passes |
| daySlip, askSlip on A-S01 | content | Home keeps tab bar (1) and capture cluster (2) plus one transient (3); a slip is never the third glass element and never sits under a toast; passes |
| C-S25 Browse sheet (area C), A-S16 one-photo sheet (area A) | the sheet is glass; rows and buttons inside plain or `bordered` | passes; no "Added" toast over a sheet for a tick (F46-5) |
| Hosted SwiftUI suggestions button (A-S01 menu) | system-drawn, outside our material rules | UNVERIFIED that it can join a glass container; check under Reduce Transparency and AX5 on a device (design-systems section 9) |
| Quiet-day line on Home | content | no glass; passes |
Result: no new surface needs glass, none stacks glass, and every new surface has a solid fallback. The one open item is the hosted SwiftUI control, which is a device check, not a design change.

## 15a. Round 2 additions: photo moments and media (founder direction 20 Nov, second round)

Source: `26-founder-direction-photos-library-and-media.md` (committed f8eead016). Cards NS-51 (Photo moments, level 3) and NS-52 (Pictures and videos with a letter) are being written in `27-photo-moments-and-media.md`, which was not on disk when this was written, so every id below is PROPOSED and keyed by card name; re-key to row ids when 27 lands. The direction reverses three earlier positions (level 3 closed, no video, one picture per letter) and records them as RV-18 onward. Nothing here changes a card.

What the founder direction keeps and design must hold: no caption, title, summary or story is ever written or pre-filled from a picture; a nudge never describes what a picture shows; analysis is on the phone only and metadata only (date, count, clustering; place names off by default; no faces); nothing counts or scolds ("you have 40 unwritten days" never appears); no count of library items anywhere, including the permission screens.

### 15a.1 Permission order, rewritten (supersedes the Photos row of E-S28)
1. First run through Home: no prompt of any kind (NS-39-R2 unchanged).
2. Microphone: at the first Speak, after our primer (unchanged).
3. Photos, level 1 and 2: no permission (Apple's picker and suggestions picker run out of process). Unchanged and still the default path; NS-52's attach from the picker needs none.
4. Photos, level 3 (NS-51, PROPOSED): asked only from a parent-started door, never at launch, never in first run, never before a kept letter, never from a nudge. The order is: our primer first (one screen, content layer, says in words what the app will look at, that it stays on the phone, that limited access is fine and the app works with it, that no pictures are described or written about, and that it can be turned off in Me), then the iOS prompt only through the primer's Continue (same rule as the microphone, NS-39-R10), then the state the parent chose. The primer offers "Not now" at the same size and style as "Continue" (section 14.2 shape b). "Not now" is a full answer: it writes nothing, shows no repeat ask on Home, and the door stays in Me. It never asks twice from us (as NS-13 door lines).
5. Notifications for a moments nudge: no new ask; a nudge is an existing budgeted class (NS-32) and follows the existing permission state (E-ST43 when off).
6. Face ID: unchanged. Tracking, contacts, location, speech: never. Place names are off by default, and if turned on they use no location permission (metadata already in the picture) - flagged D-9.
Door lines for the Photos primer (COORDINATION section 10): Shown: what is read (dates, counts and groupings of pictures, on this phone only); Records: the parent's choice (on, limited, off) and nothing about any picture; Never: a picture, filename, album name, place or date leaves the phone except by the parent's own act; a description or caption; face matching; Decline: Not now, nothing read, nothing stored, level 1 and 2 pickers unchanged.

### 15a.2 States (proposed ids; render class as section 6)
| Id | State | Trigger | Render | Parent can | Motion |
|---|---|---|---|---|---|
| E-S32 | Photos access primer (proposed; screen drawn with area A's moments surface) | the parent starts "Look at my pictures" from Me or the capture area | content screen or half sheet (N7) with the primer, then iOS's prompt | Continue; Not now | T-SHEET or T-PUSH, E-M120 |
| E-ST69 | Photos access limited (iOS "Limited") | the parent chose Selected Photos | works: moments are found only among the chosen pictures; one calm line in Me and on the moments surface says "The app can see the pictures you chose" with Change what the app can see (opens iOS's picker for more); never an upgrade nag, never a count of what is missing | Change selection; carry on | E-M121 |
| E-ST70 | Photos access denied or restricted (Screen Time, MDM) | the parent chose Don't Allow, or it is restricted | R4 inline state on the moments door only: one line, Open Settings (not shown when restricted, where it would not help), and "Choose a photo" still works because the picker needs no permission; nothing else on Home or the Book changes; no repeat ask | Open Settings; choose a photo | E-M121 |
| E-ST71 | Photos access changed while the app is open | the parent flips it in Settings | the surface re-renders at the next focus; an index in progress stops; nothing is deleted from the book | none needed | E-M122 |
| E-ST72 | iCloud original not downloaded | a chosen picture or video is optimised and the original is in iCloud | the attach row shows "Getting it from iCloud" in words with a Cancel; no percentage in text, no spinner loop (`m.progress.wait`, or `m.progress` only when bytes are measured); success attaches it; failure or offline: `iCloudOffline` (area A's A-S03 words) and the letter goes on without it | Cancel; choose another | E-M123 |
| E-ST73 | No space for media | under 50 MB free for a picture (as E-S17) or the video's estimate plus margin | not attached, in place, with the space needed in words; the letter goes on without it; never blocks Keep | free space; choose smaller | E-M124 |
| E-ST74 | Large video | over the length or size cap (defaults 60 seconds, size cap pending Q-PM-2) | the picker's choice is refused in place before anything is copied: one line says the limit in words; offers "Choose another"; trimming is the system's own editor, never ours; no count of videos left | choose another | E-M124 |
| E-ST75 | Too many items on one letter | beyond the proposed 6 pictures and 2 videos | the add control reads in words that the letter holds as many as it can; no "4 of 6" counter anywhere, including VoiceOver | remove one to add another | none |
| E-ST76 | Video audio | a video carries sound | nothing is transcribed by default (Q-PM-4); no state, no line; if the founder says yes later, the words state is area A's | none | none |
| E-ST77 | Media waiting to upload | Q-PM-3 says media sync; offline or paused | R0 on Home; the Where your letters live row (C-S08) carries the waiting line; never a count; if media stays on the phone (the other Q-PM-3 answer), the Save a copy and export states carry the weight instead | none needed | none |
| E-ST78 | Moments index off or removed | the parent turns moments off in Me | the on-phone index is deleted at once; Me confirms in one line; nothing in the book changes | turn on again | E-M122 |
| E-ST79 | Media kill switch | `killSwitches.photos` (existing) pauses picture start; a video pause key is PROPOSED | R1 the add and moments doors absent; Erase, sweep and export intact (as E-ST07) | none | E-M43 |
| E-ST80 | Moments nudge on a lock screen | a nudge from the existing budget | neutral wording only; never describes a picture; follows lock-screen rules (D-S10); with App lock on, neutral | open the app | system |
Rule for all: the media states use SystemLine (F2) or InlineState, never glass, never a toast for a failure, and the book, recording, typing and export stay open. Error codes for media (corrupt, unreadable, `needs_rotation`, HEIC or Live Photo handling, video transcode failure, `no_space`) join section 13.2 when 27 gives them names; until then NS-01's codes apply to pictures and no code exists for video.

### 15a.3 Foundations and tokens the media cards need
| Need | Why | Proposal |
|---|---|---|
| A `PermissionPrimer` content pattern | microphone, Photos (level 3), Face ID and notifications each have a primer with the same anatomy | one shared anatomy: title, three plain sentences, DoorNote `full`, Continue and Not now as equal `bordered` buttons stacked at every size; one component, `components/ui/permission-primer.tsx`; the microphone primer in A-S04 adopts it |
| Media attach row states | iCloud download, refused, no space, too large | a row in the C1 or form-row family with a leading thumbnail box (reserved, `PhotoFrame` C3), words, one text action; no ring or percentage text |
| Thumbnail grid for several items | A-S16 pattern for many pictures and videos | cells at least 96 pt, VoiceOver "Picture 2" or "Video 1, 12 seconds" (a duration is a fact, never a description), `accessibilityIgnoresInvertColors`; no generated alt text; the parent's own words are the label if she typed any (NS-52 accessibility) |
| Video badge on a cell | tells a video from a picture | a play glyph plus the word "Video" in the VoiceOver label; shape and word, never colour alone |
| No new colour, type or motion token | all of the above reuse existing tokens | `m.swap`, `m.fade`, `m.progress.wait`, `m.progress` (only with measured bytes), `m.enter` |
Liquid Glass check: the primer is content or an N7 sheet (the sheet is glass, inside is solid); the thumbnail grid and attach rows are content; a video viewer, if one is built, uses clear glass controls with a 35 percent dim as B-S08's picture viewer (system BRIEF section 3) and is area B's to draw; a nudge surface on Home is a slip-like card in content and is not a third glass element. All have solid fallbacks.
Accessibility holds: AX5 stacks everything and truncates nothing; VoiceOver reads state then action; 44 pt targets; Reduce Motion replaces every move with `m.fade` or a jump; colour is never the only signal.

## 16. Function needs accounted for

Rows are the design-needs rows `FUNCTION-TRACE.md` section 6.5.1 assigns to area E (FR ids in `FR-<CODE>-nn` form; the trace prints them without the FR prefix) and the FRs of 6.5.2 whose design response is the FR text itself. "Designed" names where; "GAP" is an explicit gap.
| FR | Screen and state | Where designed or gap |
|---|---|---|
| SUP-02 | E-S06.help, E-S01.recovery, E-S13.secondFault, E-S09 noBook and accountDeleted | Designed: "Write to us" text button, last and quietest, in section 5 E-S01, E-S13, E-S06; E-S09 states are area C's C-S10 (hand-off: add the button) |
| SUP-18, SUP-17 | E-S02 link; E-S30, E-S31 | Designed (new screens E-S30, E-S31; quiet link below the doors). GAP: ids are not ruled (K-E17) |
| support error-code rows (launch fault, repeated fatal, `deleted`, no book, 15-minute pause, `under_18`, refused links, restore nothing, `tooBig`, `print_pdf_failed`, `file_missing`, `quota_full`, `consent_required`, `upgrade_required`) | section 13.2 and 6.6 | Designed: one render each; `quota_full` stays HOLD (backup off); family-share codes are D's |
| MKT-01, MKT-12, MKT-13 | E-S27 | GAP: a storyboard of up to 10 frames is a marketing artefact; E-S27 lists the rules (Asha only, claims row per frame, one dark frame) but draws no frames |
| MKT-21, MKT-33 | E-S02 | Designed: no price, trial or tour; descriptor matches the store subtitle |
| MKT-22, MKT-23 | E-S10, E-S26 | Designed as is: no testimonial, rating, count, discount or countdown; rule added: no rating request in a session where E-S10 showed (section 17 note) |
| MKT-09, MKT-21 | E-S16 | Designed: the line never lists features |
| OPS-01 | E-ST13c | Designed: seven keys withdrawn as pause keys; render "build flag only" |
| OPS-07, OPS-14, REL-07, REL-18 | E-ST05, E-ST02, E-ST47 | Designed: "Paused for now" (G-E12); restricted-project case renders as an outage; E-ST47 added |
| OPS-33, REL-03, REL-55 | E-S14 | Designed: Start on this phone for every outage kind; clock hint as help text; "or type the code" on the email |
| OPS-25 | E-S16, E-ST18 | Designed: never blocks |
| OPS-20, PRV-11 | E-S13 | Designed: safety sentence on the React boundary only; no path or name in error text |
| OPS-30, DAT-15, CMP-06, QAL-07, QAL-09 | E-S23 | Designed in section 9 (rows added below) |
| FIN-09, FIN-13 | E-S10, E-S12, E-S25, E-S26 | Designed as is: no price, trial, count or countdown; Redeem a code opens Apple's sheet only |
| FIN-12, FIN-11 | E-S11 .grace, .retry, .ended | Designed: a quiet action to Apple's billing page, no price or countdown; `.ended` covers a refund with the same words as a lapse; `plan.refund` points to Apple. Words: `plan.retry` loses "safe" (CG5) |
| FIN-10 | E-S27 | Rule: prices only from `pricing.ts`; no price in this folder |
| FIN-07 | E-S04 to E-S06, E-S14 | Designed: provider cap shows the outage line with Sign in with Apple still offered |
| DAT-03 | E-S10, E-S26, E-S11 | Designed: the allowance may be a fact, never a meter ("1 left", "2 of 2 used") |
| PRV-24, PRV-32 | E-S02 | GAP: the notice at collection is drawn only as pending state E-S02.notice (K-E18); card 19 carries the "What we collect" link only |
| PRV-04, PRV-25, PRV-26, LEG-04, LEG-09 | E-S03 | Designed: versioned links; agree line unchanged until FR-LEG-04's rewrite is approved |
| PRV-27 | E-S05, E-S06 | Designed: no full email on any screen except the field; the method only |
| PRV-28 | E-S07 | GAP: a line naming what syncs waits on counsel Q48; slot drawn in DoorNote `full` (D-5) |
| PRV-16 | E-S08 and every letter field | Designed: "Writing Tools: off" stated for E-S08 signs-as; the why-we-ask line |
| PRV-14, SEC-01, SEC-02, SEC-04 | E-S18 | Designed: K-E02 rule, signedInB-ownerMismatch, signedInB-localOnly |
| PRV-30, CMP-20, CUL-08, CUL-23, QAL-03, QAL-20 | E-S27 | Rule only: privacy label as shipped; only declared accessibility features; Asha screenshots; Days screenshots use synthetic data |
| CMP-07 | E-S03, E-S07, E-S10, E-S11 (and C, D, B screens) | Designed: AX5 with Bold Text and VoiceOver layouts for each (sections 5, 9); links announced as links; the walk is a device row |
| CMP-09 | E-S05, E-S06 | Designed: paste and one-time-code autofill allowed; no disabled Continue without words |
| CMP-15, CMP-13, LEG-20 | E-S03.platformMinor | Designed: same room as the stop, nothing stored (K5) |
| SEC-24 | E-S06 | Designed: field draws 6 to 10 digits; paused state stands |
| SEC-07, SEC-25, SEC-22 | E-S22, C-S03, Me | Designed: App lock offered in Me and on the sign-out sheet only; nothing at the end of first run (NS-39-R9) |
| BKO-12 | C-S01, E-S01.recovery, E-S06 | Designed: reuse Help row and Write to us; no new parent screen |
| BKO-26 | C-S02 new state | Designed as E-ST51 (SystemLine kind); the C-S02 state itself is area C's (hand-off) |
| OPS-02, BKO-17, BKO-19 | E-ST05 to E-ST13c | Designed: one row per key; GAP: `bookSearch` absent in `kill-switches.ts` (G-E09) |
| MSG-03, MSG-08, MSG-04, MSG-10, MSG-25 | E-S06.help, .noAddress | Designed: not-arriving help ordered as MSG-08 with the Hide My Email hint and Write to us at the same weight; checked at AX5 |
| MSG-05, MSG-07 | Me account row | Designed as E-ST67; screen is C-S02 (hand-off) |
| MSG-15, MSG-11 | E-S14 | Designed: names that Apple sign-in and the local start stay open when mail or the site is down |
| MSG-19, MSG-20, MSG-16, MSG-17, MSG-22 | D-S04, D-S06.denied, E-S12.withAsk, E-S28 | Designed: "No" never asked again; E-S28 order in section 5 |
| LOC-01, LOC-02, LOC-28, LOC-07, LOC-14, LOC-24 | E-S08 languages, E-ST08 | Designed: no teaser for an unshipped language; languages row only in multi-language builds; A-S10 and C-S18 own their rows |
| REL-48, REL-37, AIS-44 | E-S17, A-S04.lowSpace, E-ST32 | Designed: under 1 GB line and the 0 bytes at Keep case; GAP: G-E04 (line not built) |
| AIS-09, AIS-13, AIS-14, AIS-20 | E-S08.open speech card | Designed: size line read from the catalog; states ask, downloading, waitingWifi, verifying, stopped, pausedRemote, needsSpace, done |
| RSH-04, RSH-10, RSH-12 | A-S01.first to E-S12 | GAP: the clickable first-run path exists (PROTOTYPE.html); print-ready read-aloud cards are a research artefact, not drawn here |
| QAL-11 | E-S04 to E-S07, E-S14 | Designed: section 16a lists, per error kind, what VoiceOver announces and where focus lands |
| QAL-05, QAL-06, QAL-22 | E-S01, E-S10, E-S14, E-S24, E-S26, E-S05, E-S06, E-S08 | Designed: each state has a reading order and focus target in section 5 and J-E08 |
| LCY-11, LCY-19, CUL-04, CUL-07, SEC-05 | E-S24 | Designed: accountDeleted, methodOnly |
| LCY-17, LCY-24, DAT-34, LCY-03, REL-02 | E-S16 | Designed: two wordings, one line |
| LCY-02, LCY-01, LCY-05, REL-32, REL-59 | E-S01.recovery, E-ST37 | Designed: Export what's readable on every recovery state |
| PRT-41, PRT-26, PRT-33, REL-21 | E-S13, E-S14 | Designed as a rule: order creation disabled offline with a line; area C draws it |
| CUL-18 | E-S01 to E-S08 | Checked: no E screen gains a tradition or country field; E-S08 has none |
| OPS-10, OPS-11, OPS-12, OPS-13, OPS-19, REL-01, REL-05, REL-10, REL-19, REL-22, REL-26, REL-28, REL-40, REL-41, REL-42, REL-44, REL-51, REL-52 | E-ST01 to E-ST05, E-S05, E-S06, E-S14 | Designed in the catalogue (6.1 to 6.2); each is an existing render |
| OPS-03, REL-15, REL-59 | E-ST17 | Designed (J-E21) |
| OPS-04 | E-ST29 | Designed (E-S18) |
| OPS-16 | E-ST10, E-ST11 | Designed (6.2) |
| OPS-31, MKT-06, MKT-08, MKT-10, MKT-11, MKT-15, MKT-17, MKT-18, MKT-30, LCY-16, PRT-19, RSH-21, QAL-20 | E-S27 | Rule only: Apple's surface; ours is claims and screenshots |
| OPS-36 | E-S14, E-S04.refused-region | Designed |
| DAT-21 | E-S26 | Designed: no count |
| DAT-35, CMP-03, CMP-16, PRV-05 | E-S03, E-S04, E-S07 | Designed: declined states and record rules |
| POL-07, MKT-04, SUP-12, CMP-18, MSG-09, LCY-26 | E-S03, E-S10, E-S11, E-S02 | Designed as the cited screens; no change beyond this file |
| MSG-01, MSG-02, MSG-06, MSG-12, MSG-23, MSG-24, MSG-30, MSG-31, MSG-32, MSG-33, MSG-38, MSG-26 | E-S05, E-S06, E-S13, E-S20, E-S03, E-S27 | Designed: words are content's; screens as built |
| BKO-07 | E-S06, E-S09 | Designed: no staff tool changes either screen |
| LCY-10, PRT-17, PRT-18, PRT-24 | E-S18, E-S04, E-S07 | Designed: second-account rule, agreement rows |
| LCY-15 | E-ST46 | Designed: iPad runs the iPhone layout, centred |
| LCY-30, LCY-01 | E-S11, E-S01 | Designed as built |
| REL-13, REL-14 | E-ST47 | Designed |
| REL-33, REL-36, REL-43, REL-49 | E-ST35, E-ST36, E-ST38, E-ST39 | Designed (6.5) |
| PRT-15, PRT-42 | E-S23, E-S17 | Designed: matrix row and export space check |

### 16a. Announcements and focus for the sign-in error kinds (QAL-09, QAL-11)
Each error is announced once when it appears; focus moves as stated.
| Kind | VoiceOver announces | Focus lands |
|---|---|---|
| `cancelled` | nothing | stays on the door |
| `provider` | the provider line | stays on the door tapped |
| `invalid_email`, empty email | the line under the field | the email field |
| code short, `wrong_code` | the line | the code field, digits kept |
| `code_paused` | the line with the other ways | the heading of the paused block |
| `rate_limited`, `expired` | the line | the code field (rate_limited); Send a new email (expired) |
| `other_phone`, `other_phone_spent`, `already_signed_in` | the refused title, then the line | the title (heading) |
| `consent_unavailable` | the line | Try again |
| `refused-region` | the line | the heading |
| `session_expired` | the line, once | the Sign in row in Me or the Welcome heading |
| E-S14 outage, offline, signInPaused | title and body | the heading |

## 17. Contradictions with a product ruling or between sources (flagged, not resolved)

| Id | What conflicts | Sources | What this file does meanwhile |
|---|---|---|---|
| X-1 | Photos permission: E-S28 and council round 2 say "never a library permission"; `26-founder-direction-photos-library-and-media.md` makes level 3 (library read access) a card, reversing NS-49's "level 3 closed" | E-S28 v1 vs 26 section 1 | Section 15a draws the proposed order; the v1 row stays true for levels 1 and 2 |
| X-2 | First Keep haptic: NS-44-R12 says the success haptic plays once; design system MOTION (via E-M09, E-M33) lists no haptic and retires `success` for first run | card 19 NS-44-R12 vs `system/MOTION.md` section 9 | Follow the card for A-S13's first Keep (one `success`); E-M09 stays "none" on E-S08.open. Needs Karma and the system motion lead |
| X-3 | Refused-region state is keyed `E-S04.refused-region` (sheet used after first run) but the refusal arrives on the first-run path from the Welcome, not on the sign-in sheet | NS-40-R9 | Drawn as a StateScreen reachable from both; the id is kept as the card writes it |
| X-4 | Name optional everywhere (NS-43-R1 wording is about "a birthday and no name") vs the servers-off path where `nameRequired` is built | NS-43-R1, K-E12 | Optional on every path; `nameRequired` stays for Me, Add a child |
| X-5 | System F2 variant `update required (becomes C8)` and MOTION "block over everything" vs NS-45-R13 (never blocks) | `system/COMPONENTS.md` F2 vs NS-45 | Card wins; the system files need the variant removed |
| X-6 | Home slip position: C9 says "above the prompt"; A-S01 first drew the slip after "Another thought"; design-systems F50-1 recommends directly above the prompt block | system COMPONENTS C9, area A, NS-50-R4 | CLOSED at INDEX time: area A's v2 file now draws the slot above the prompt block, matching section 14.3 |
| X-7 | The K2 ruling pins one Plus line ("Reading, listening and your copy stay free"); WORDS.md still carries "Recording, reading and export stay free" | GAP-LOG K2 | WORDS.md delta below changes it; flagged for content |
| X-8 | K9 names C-S23 and E-ST47 only; support's two "struggling" screens still have no ruled id | GAP-LOG K9 | E-S30 and E-S31 assigned here |
| X-9 | MSG-05 and MSG-07 ask for "E-S11 or the Me account section"; the account row is C-S02 | trace 6.5.1 | Drawn as state E-ST67 (the line), screen left to area C |
| X-10 | Level 3 needs a Photos permission string; E-S28's "no usage string" guard (G11-3) names photos | E-S28 vs 26 | Guard needs the photos string added only when NS-51 ships behind its flag |
| X-11 | `killSwitches.libraryDays` and `killSwitches.signIn` are not in `kill-switches.ts` or ADR 0029; RV-10 and O-19 need the vocabulary change | RV-10, O-19 | Engineering gaps G-E14, G-E15 below |

Engineering gaps added in v2: G-E14 `killSwitches.signIn` (disable-only) and its E-S14.signInPaused reader (BL-922 neighbours, ADR 0029); G-E15 `killSwitches.libraryDays` outside `mayRun` (RV-10); G-E16 `PermissionPrimer` shared component and the microphone primer adopting it; G-E17 `DoorNote` component; G-E18 SystemLine adopters for E-ST47, E-ST50, E-ST51, E-ST67; G-E19 `code.digits` with `{n}` and the 6 to 10 digit field (NS-41-R10).

Section 9 matrix rows added in v2: NS-33-R4, R7, R16 gain E-S04.refused-region, E-S07.reconsent, E-S16, E-S24, E-S30, E-S31 (AX5 with Bold Text on an SE 3); NS-33-R11 gains the E-S30 rows (none carry pictures); NS-33-R12 and WCAG 1.4.1 apply to the E-S03 answer pills and the agreement tick (QAL-09); the system-state rows of FR-OPS-30 (offline, outage, paused, update, low storage, second account, server restored) are added as one row each (OPS-30); columns for phone, iOS, build, runs, p50, p95, unit, budget, met or missed (DAT-15); one column per declarable accessibility feature and the common tasks Apple names, first launch, sign-in, purchase, settings, pass or fail per task (CMP-06); the passes of Annex B are named in `docs/qa` (QAL-07).

## 18. Open design questions (each with a default)

| Id | Question | Default |
|---|---|---|
| D-1 | Does "If you are struggling" show on the Welcome, where no account exists, or only in Me, Help and legal? | A quiet link below the doors, because Me is not reachable before the first book (SUP-18) |
| D-2 | Are E-S30 and E-S31 the right ids? | Yes, until Karma rules otherwise (K9 left them open) |
| D-3 | Three notification asks can now exist (reminder ask, Plus confirmed, first day ticked). How do they coexist? | Whichever comes first asks iOS once; the others show no ask, only the result; a denied phone sees no Days ask (RV-9, K-E13) |
| D-4 | Second sentence of the update line for `upgrade_required` and `gone` | "This version of {app} can no longer reach your account." with Update; content words it |
| D-5 | Does a two-sentence notice at collection sit above the Welcome's agreement line? | No; Privacy links to "What we collect" (NS-42-R14); E-S02.notice stays a pending state until counsel Q20 answers |
| D-6 | Day slip: above or below "Another thought"? | Directly above the prompt block, one place for every route (F50-1, RV-6); area A to confirm |
| D-7 | Does the day slip use a word other than "Not now"? | `content` decides; default `en.common.notNowButton` with a hint that states the consequence |
| D-8 | First Keep haptic: the card says success once, the system motion file says none (X-2) | Follow the card; one success haptic on A-S13 only |
| D-9 | Place names in photo moments (Q-PM-5) | Off by default; no location permission is ever asked |
| D-10 | Where does the Photos access primer start from? | Parent-started from Me, and from the picture start menu only after one kept letter with a picture; never from a nudge, never in first run |
| D-11 | Limited access wording and action | "The app can see the pictures you chose" with Change what the app can see; no count, no nag |
| D-12 | How is a video limit said? | In words ("up to a minute"), with no counter; the exact cap follows Q-PM-2 |
| D-13 | Code field length | Draws 6 to 10 digits; default 8 (O-6); VoiceOver reads the length from `{n}` |
| D-14 | Optional marker | The word "Optional" beside the label; never an asterisk or "(optional)" in placeholder |
| D-15 | Does Start on this phone remain on the Welcome in a store build that requires sign-in? | Yes, outage-only fallback as built (O-22) |
| D-16 | Re-consent summary: how long is the change summary? | Three plain sentences at most, in a block above the agree line; content keys it |
