# Area E. Foundations and system states: design

Status: v1 after the reconciliation pass with MOTION.md and WORDS.md (section 12) and the design system v2 material policy (section 7a), design lead for area E, 20 Nov 2026. Docs only. Nothing here changes a card, the engineering plan or the code.
Companions in this folder: `MOTION.md` (motion lead), `WORDS.md` (content lead), `PROTOTYPE.html` (this lead).
Screen ids `E-Snn` and state ids `E-Snn.<state>` are stable from the skeleton on. The cross-area state catalogue ids `E-STnn` (section 6) are for areas A to D to point at.

## 0. Sources, precedence and what this file supersedes

Read in the brief's order (CR-66):
1. Locked cards: `11-foundations.md` (NS-32 to NS-37) is this area's own card. First run, sign-in, Plus and the switches are "Cited" rows in `07-remaining-capability-rows.md` section 2 (C25, C44, C45, C46: F01, F03, F14, F19, NX-31, NX-36), so for them the locked pack adds only the rows other cards name: NS-10 (new phone, consent outstanding, kill switch at sign-in, second account), NS-17-R1 (ungated languages absent from every picker, first run included), NS-33 (every row on first run and on the gate sheet), NS-35 (first run ends on Home), D1 (sign-out keeps the book), D2 and D3, T2 (free stays free), the frame's guardrail "zero paywalls before a parent has seen their words", and X5 (every state table carries the kill switch, the remote pause and plan lapse).
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
The founder asked (20 Nov, relayed by Karma) for the journey from download to the first kept letter. Product is writing NS-38 to NS-45 (`19-from-download-to-first-letter.md`); it was not on disk when this was written, so this flow is keyed to the built path and the open questions go to section 10 (K-E10 to K-E16) for product to answer.
1. App Store page [E-S27.default]: Apple's page; every public line is a claims row (no "fast", "smart reminders", "accessible to everyone": NS-32, NS-33, NS-34 Claims). Get -> [E-S27.installing] -> [E-S27.installed] the icon on the Home Screen. No account is needed to download; the download is under 40 MB (NS-34).
2. First launch -> [E-S01.default]: no words, no network wait; first interactive frame p50 1.2 s on SE 3.
3. Age and agreement [E-S03.default]: Yes or No (nothing preselected), the agreement box (unticked), Terms and Privacy as their own links. Validation in words, announced: no answer -> [E-S03.reason-noAnswer] "Choose Yes or No."; Yes without the box -> [E-S03.reason-noTick] "Check the box to continue." with focus on the box. Fail: No -> [E-S03.stop]; retry only after 24 hours ("I answered by mistake", D-026). Records: the age boolean and the local agreement record, on the phone only.
4. Region: no in-app region check exists (read 20 Nov in `lib/auth`, `lib/first-run`, `app`); availability is set per storefront in App Store Connect, so someone outside it cannot download. [E-S03.region] is drawn as a HOLD only, should counsel require an in-app check (K-E10).
5. Welcome, account-first [E-S02.default] (as built, `welcome-sign-in.tsx`): lockup, descriptor, body, the free-letters line, "Sign in to begin your book.", the agreement line with its two links, then two equal 56 pt doors: Sign in with Apple, Sign in with email. A returning phone sees the last method under the matching door [E-S02.lastMethod]. No password, name or phone field.
6a. Apple -> Apple's sheet (Apple verifies the person; we receive the account identifier and, if shared, a relay or real email) -> cancelled: nothing shown; failed: [E-S02.error-provider].
6b. Email -> [E-S05.default] one field (email autofill), Send link. Validation: empty -> [E-S05.reason-empty] (PROPOSED words; today the button is disabled with no reason, K-E11); malformed -> [E-S05.error-invalid_email]; too many sends -> [E-S05.error-email_wait]; provider off -> [E-S05.error-not_available]; offline -> [E-S05.error-network]. -> [E-S06.default] "Check your email": the code field (6 digits, one VoiceOver field, iOS one-time-code autofill) or the link on this phone. Validation: short -> [E-S06.reason-short] (PROPOSED); wrong -> [E-S06.error-wrong_code]; five wrong -> [E-S06.paused]; 429 -> [E-S06.error-rate_limited]; expired link -> [E-S06.error-expired]; link from another phone -> [E-S06.refused-other_phone] or `refused-other_phone_spent`; already signed in -> [E-S06.refused-already_signed_in]; nothing arrived -> [E-S06.help].
6c. A service or connection failure at any point -> [E-S14] (J-E03, J-E04).
7. Verification and agreement: [E-S07.loading] "Setting up your account" -> [E-S07.default] Before your book syncs (registered body, agree line, links), Agree and continue / Not now; then the sensitive-data consent as built. Failed -> [E-S07.error-consent_unavailable]; declined -> [E-S07.declined] (C-S11 rules). Records: PRIV-R21 acceptance rows.
8. The account is asked once (BL-922): new -> E-S08; has a book -> E-S09 (J-E05); this phone already holds letters -> [E-S24] claim.
9. First book [E-S08]: name (optional on the account-first path), birthday or due date (required): none -> [E-S08.dateWaiting]; a future birthday -> [E-S08.dateFuture] "Choose today or an earlier day."; a due date beyond ten months -> [E-S08.dueRange]; twins [E-S08.twins], an empty extra name -> `needNameMany` [E-S08.name-waiting]; what the child calls you (required, D2 writing tools off): empty -> [E-S08.signsAsWaiting], over the limit -> `signsAsLimit`. Every reason is in words under Continue, announced, with focus to the field; Continue is never a silent grey button. Languages only in multi-language builds, gated ones only (NS-17-R1). Then the promise sample and [E-S08.open] "The book is open."
10. Home [A-S01.first]. No permission has been asked yet: permissions only when needed (E-S28).
11. First Speak -> area A's microphone primer [A-S04.primer] -> the iOS prompt [E-S29.prompt] with `permissions.microphone`. Allow -> Listen; Don't Allow -> [A-S04.blocked] with Type instead and Open Settings. Notifications are asked only by area D's reminder ask, after a kept letter, never in first run. Photos need no permission (PHPicker). Face ID is asked only when the parent turns on App lock.
12. Record -> Review -> Keep: the first two letters keep with no gate (D-082); after the second the Book shows `secondFreeNote` once; the third meets E-S10 (J-E10).

### J-E02 First run, servers-off build (kill path)
1. E-S01 -> E-S03 -> [E-S02.serversOff] Welcome with "Begin the book" only; no sign-in door, no "I already have a book".
2. -> E-S08 steps -> Home. No account, Me has no Account or Delete account rows (`capabilities.ts`), no Plus offer copy changes (alpha note only in alpha builds).

### J-E03 First run, sign-in cannot be reached (unhappy)
1. E-S02 -> Begin the book -> E-S04 -> a failure (`network`, `rate_limited`, `email_wait`, `not_available`, `unknown`) or the 10 s gate timeout.
2. -> [E-S14.outage] "Sign-in cannot be reached right now." / "Try again in a moment." / Try again (primary) / Start on this phone (quiet, only when the gate offers it: age Yes, a failure, `LOCAL_START_FALLBACK`) with its note.
3a. Try again -> E-S02 (the failure is set aside) -> sign in again.
3b. Start on this phone -> E-S08 -> Home. Later, Me, Account, Sign in -> E-S04 -> E-S07 -> [E-S24.default] "Keep your letters in this account?" -> Keep in this account / Not my account.
4. If the account already has a book -> [E-S24.hasBook] the phone's book is added as a second book; nothing deleted.

### J-E04 First run, no connection
1. E-S02 -> Begin the book while offline -> [E-S14.offline] "Sign-in needs a connection." / "Connect to the internet, then tap Try again." / Try again / Start on this phone (same rule).
2. Connection returns -> announcement "You are back online." -> E-S02 by itself.

### J-E05 Returning parent on a new phone
1. E-S03 -> E-S02 -> "I already have a book" -> E-S04 -> E-S06 -> E-S07 -> the account has a book -> E-S09 (alias; area C draws C-S10: Opening your book, slow, offline, no book here yet, wrong account) -> the Book with the C-S12 line. Never E-S08 (NS-10-R0).

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

### J-E09 Kill switch at sign-in (NS-10-R8)
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
| E-S01 | Launch and boot | `app/_layout.tsx`, `components/resilience/launch-recovery.tsx`, `plain-screen.tsx` | default, migrating (breathing after 350 ms), recovery, recovery-trying, recovery-stillClosed, recovery-exporting, recovery-exportNothing, recovery-exportFailed, ax5, vo, dark |
| E-S02 | Welcome | `app/onboarding.tsx`, `components/onboarding/welcome-*.tsx` | default (store), serversOff, alpha (shows "I was invited" in a servers-on alpha only), restoring (blank up to 10 s, then default), error-provider, sessionExpired, ax5, vo, dark |
| E-S03 | Age gate and stop | `components/gate/age-gate-screen.tsx` | default, reason-noAnswer, reason-noTick, agreeOnly (old install), stop, stop-after24h, ax5, vo, dark |
| E-S04 | Sign in: choose a way | `app/(auth)/sign-in/index.tsx` | default, busy, error-cancelled (nothing), error-provider, error-not_available, error-network, ax5, vo, dark |
| E-S05 | Sign in: email | `app/(auth)/sign-in/email.tsx` | default, sending, error-invalid_email, error-email_wait, offline, ax5, vo, dark |
| E-S06 | Sign in: code and verify | `code.tsx`, `verify.tsx` | default, checking, verifying, error-wrong_code, error-code_paused, error-rate_limited, error-expired, refused-other_phone, refused-other_phone_spent, refused-already_signed_in, ax5, vo, dark |
| E-S07 | Agreements and consent at sign-in | `app/(auth)/sign-in/consent.tsx` | settingUp, terms, declined (to C-S11), error-consent_unavailable, ax5, vo, dark |
| E-S08 | First book steps | `app/onboarding.tsx` | name, name-waiting (Continue tapped empty), date, signsAs, promise, open, twins (add another), languages (multi-language builds only), ax5, vo, dark |
| E-S09 | First-run router (alias of C-S10, C-S11) | `lib/first-run/*.ts` | decision table only (section 5) |
| E-S10 | Keep gate sheet | `components/child/plus-gate.tsx` | default, opening, offline, needsNewerIos, unavailable, lapsed, fromLetter, fromLetter-offline, synced (held for counsel C10), ax5, vo, dark |
| E-S11 | Plan in Me | `app/settings/plus.tsx` | free (never had Plus), on, trial, renews, ends, ended, grace, retry, shared, alpha, restoring, restored, restoreNone, restoreFailed, notificationsOff, ax5, vo, dark |
| E-S12 | Plus confirmed | `app/plus/confirmed.tsx` | default, withAsk (notifications never asked), ax5, vo, dark |
| E-S13 | Something broke | `components/resilience/global-fault-screen.tsx`, root error boundary | boundary, global, ax5, vo, dark |
| E-S14 | Sign-in outage and offline (first run) | `components/onboarding/outage-screen.tsx` | outage, outage-withLocal, offline, offline-withLocal, backOnline (announcement), ax5, vo, dark |
| E-S15 | SystemLine in place (new component) | none | info, waiting, paused, offline, action, ax5, vo, dark |
| E-S16 | App update line in Me | none (gap) | line, absent, ax5, dark |
| E-S17 | Low-storage rules (rendered by A-S04, A-S05, C-S04, C-S18) | `lib/capture/free-space.ts` | under1gb, under50mb, under20mbMidTake, exportShort |
| E-S18 | Second account on one phone | `lib/auth/account-claim.logic.ts`, `lib/first-run/account-books*.ts` | signedOutA, signedInB-noBook, signedInB-arriving, backToA |
| E-S19 | Interruption and recovery | `lib/resilience/recover-to-tonight.ts`, capture sweep | call, background, killedMidTake, killedOnConsent, killedMidPurchase |
| E-S20 | Not found | `app/+not-found.tsx` | default, ax5, dark |
| E-S21 | Appearance | `app/settings/appearance.tsx` | system, light, dark, noLetter |
| E-S22 | App lock cover | `components/app-lock` | locked, failed, ax5, dark |
| E-S23 | Accessibility walk and speed sheet | `docs/qa` (BL-929, BL-948) | matrix (section 9) |
| E-S24 | Claim screen | `lib/auth/account-claim.logic.ts` (screen in sign-in stack) | default, noEmail, hasBook, waiting, ax5, vo, dark |
| E-S25 | Plan reminder note in the app | `lib/billing/plan-notice.tsx` | trial, renews, yearly, ax5, dark |
| E-S26 | Home Plus line (a rule drawn on A-S01) | `app/(tabs)/index.tsx` | off (absent), on (allowance used, Plus off or lapsed), alpha (absent) |

## 5. Screens in detail

Layout figures are in points at default text size on a 375 x 812 frame (safe area top 47, bottom 34; SE 3 is 375 x 667 with top 20 and bottom 0, and the AX5 layouts below are checked against 375 x 667). Tokens: gutters `space.5` (20) on state screens and `space.4` (16) on lists; primary button 56 tall, pill radius; quiet button 44.

### E-S01 Launch and boot
- Default: the gate's room (lamp `gate` scene, centred, still), the quote pair mark. No words. First interactive frame p50 1.2 s on SE 3 (NS-34).
- Migrating: if boot passes 350 ms, the mark breathes (opacity only, off under Reduce Motion and Low Power Mode). No progress, no count.
- Recovery (built, PlainScreen): page drawing, `errors.launch.title`, body, hint; Try again (primary, becomes "Trying again" for a beat), Export what's readable (quiet). After a failed retry, `stillClosed` in a polite live line. No action deletes data.
- AX5: drawing hides above AX2 to give text room (StateScreen rule); title wraps; both buttons stack full width, pinned.
- VoiceOver order: title (heading), body, hint, Try again, Export what's readable. Each result line announced every time.
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
- Layer: content (paper and lamp). Apple's button is Apple's control. No glass on this screen.
- Integration: C44 (F01, NX-31 R2, R8, R17, R18, R22, NX-36 S2); NS-35 first use; flag `serverFeaturesEnabled()`; error codes `provider`, `session_expired`, and the outage set via E-S14. Modules: `lib/first-run/route.logic.ts`, `welcome.logic.ts`.

### E-S03 Age gate and stop
- As built (PRD-REQ-019, LEGAL-REQ-002): the question in `display`, Yes and No as equal pills with nothing selected, the agreement row unticked, Terms and Privacy as their own 44 pt links, Continue never disabled. Reason line in `text` with a WarningCircle (never status colour on the gate).
- Stop: one line in the same room; "I answered by mistake" after 24 hours (D-026).
- AX5: Yes and No stack; agreement row wraps with the box top-aligned; Continue pinned.
- VoiceOver: question (heading), Yes, No (each "selected" when chosen), agreement checkbox with its full sentence, Terms, Privacy, Continue; the reason line is announced and focus moves to the box.
- Door lines (COORDINATION section 10): Shown: the question and the agreement; Records: the age boolean and the local agreement record on the phone; Never: preselected answer or ticked box; Decline: No stops the app with one line, nothing stored about the box.

### E-S04, E-S05, E-S06 Sign in
- E-S04: the sign-in sheet used after first run (Me, Account; the claim path; an invite in an alpha build). First run signs in on E-S02 itself. A system sheet (glass, N7) with Close; title "Sign in"; Apple's `ASAuthorizationAppleIDButton` and "Sign in with email" (filled), both 56. Inside the glass sheet the buttons are filled or plain, never glass (no glass on glass). One inline error slot above the buttons.
- E-S05: email TextField (autofill email, keyboard email), Send link (primary, sticky above keyboard); `email.help` "A link and a code arrive by email. No password to remember." reason-empty: a tap on Send with no address says why in words (PROPOSED), never a silent disabled button. Error under the field, field border `caution` plus the WarningCircle glyph and words (never colour alone).
- E-S06: six-box code field read as one field by VoiceOver ("Code, 6 digits"), autofill from Mail where iOS offers it; "Send a new email" quiet. Verifying: StateScreen loading with "Signing you in". Refused: StateScreen warm error with `verify.refusedTitle` and one action.
- AX5: all three are single columns; the code boxes become one wide field at AX3 and above; sticky buttons stay above the keyboard; ModalHeader keeps Close at 44.
- Error codes: see J-E08. Door lines: Shown: the sign-in method; Records: the session in the Keychain; Never: an email address shown in full on a shared screen beyond the field being typed; Decline: Close, back to the Welcome.

### E-S07 Agreements and consent at sign-in
- As built: "Setting up your account" (loading), then the Terms sheet "Before your book syncs" with the privacy body, the agree line with links, "Agree and continue" primary, "Not now" quiet.
- Not now (declined) on first run -> C-S11 rules (nothing downloads, nothing uploads, Delete account works without agreeing, export reachable).
- Door lines: Shown: the existing keys and versioned links; Records: a PRIV-R21 row (surface `returning_consent_sheet` when returning, method `tap`); Never: preticked; Decline: as NS-10 section 12.

### E-S08 First book steps
- One step per screen, lamp `form` scene; Continue full width at the bottom; Back top left. Name (nameField serif 22), date (wheel, birthday or due date, one control with two equal choices), what the child calls you (signs-as, D2 writing tools off), the promise sample (a small fix shown, not described), "The book is open." (lamp rises; success haptic once).
- name-waiting: tapping Continue with no name shows `childrenExtra.nameRequired` above Continue with the WarningCircle, focus to the field.
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
- Card gap noted (section 10): `errors.crash.body` makes a safety statement on a screen shown because something failed.

### E-S14 Sign-in outage and offline (first run)
- StateScreen warm error: envelope drawing; outage: `outage.title`, `outage.body`; offline: `offline.title`, `offline.body`; Try again (primary); Start on this phone (quiet) with `startLocalNote` only when shown.
- Needs the StateScreen `note` slot and a heading ref (both asked for in `outage-screen.tsx`; proposed in section 7).
- backOnline: announcement only, then the Welcome.
- AX5: drawing hidden above AX2; buttons stacked and pinned.
- Integration: NX-31 R18, R19; NX-36 S3; `LOCAL_START_FALLBACK`; error codes `network`, `rate_limited`, `email_wait`, `not_available`, `unknown`, the 10 s timeout.

### E-S15 SystemLine (new component; see section 7)
One line in place under the control it is about: a 20 pt Phosphor glyph (Info, CloudSlash, PauseCircle, ArrowCircleUp, HardDrives) in `textMuted`, the sentence in `subhead` `text`, an optional quiet action (44 pt). On `surface` with `radius.md`, no border in default contrast, `line` border under Increase Contrast. Never red. Kinds: info, waiting, paused, offline, action.

### E-S16 App update line
- Me, top of the list, a SystemLine (action) "A newer version is ready in the App Store." with Update. Absent when the build is at or above `minSupportedVersion`. Never on Home, Book or a sheet. Never blocks. PROPOSED words (content lead keys them).
- Integration: remote config `minSupportedVersion` (built in the schema; no consumer today: engineering gap G-E03). No card row: card gap K-E05.

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
- As built: `claim.title`, `claim.body` with the masked email (or `noEmail`), `claim.help`, Keep in this account (primary), Not my account (quiet). hasBook: `bodyHasBook` and `recordingsNote`. Door lines: Shown: the masked account; Records: ownership of this phone's rows on tap; Never: another account's letters listed; Decline: Not my account, nothing on the phone changes.

### E-S25 Plan reminder note
- As built: on the next open inside its window, on a calm tab root only (never mid-task), a sheet with `note.title`, the date line, cancel-by line, Manage subscription, Got it. Never a child name, a count or a price (NS-32-R12, D-083).

### E-S26 Home Plus line
- On A-S01, once the free letters are used and Plus is off or lapsed (store build): one standing line above Speak and Type, `billingCopy.tonight.plusLine`, `footnote textMuted`, no button, no count. Not a slip; never replaces a slip; absent in alpha builds.

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
| E-ST13c | `shareLetter`, `firsts`, `seals`, `printBook`, `quickCapture`, `earlierVersions`, `signAsOther` | no (platform review 2.2 proposal) | R1 the control absent; existing data reads; seals never revealed early and Open now stays (NS-06 B) | per card | per card | per card | per card |
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
| E-ST29 | Second account on the phone | E-S18 filter rule; no line | every list in A to D |
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
| K-E09 | C25, C44 cited rows | first run and Plus rows are cited to F01, F14 which this pack did not re-lock; the brief asks for "every locked-pack change" | E treats only NS-10, NS-17-R1, NS-33, NS-35, D1, T2 as the changes; any other F01 or F14 change needs a card |

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

## 12. Reconciliation with MOTION.md and WORDS.md

Pending: this section is completed after reading the motion and content leads' files (see the end of this file once updated).
