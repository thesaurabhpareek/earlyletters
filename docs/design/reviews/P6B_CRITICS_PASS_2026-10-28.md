# P6b critics' pass: Plan, Reminders, Recordings, Export, Privacy, Appearance (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P6b of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 6 "P6 Settings, Plus and errors", spec ids S34 (Reminders), S41 (Plan), S42 (Recordings), S43 (Export), S44 (Privacy) and S45 (Appearance), journeys J12 to J16, and the rules P6b leans on (P1's disabled-button and caution rules, MOTION 6's haptics, the BRAND glossary, the held billing text). Read against `develop` at **817879d**, where P6b (#313) and P6a (#312) are merged, and re-checked against **a6519a4** (develop moved by #358, the Delete account page, and #362, a test fix; no file P6b owns changed). Every file:line below is at 817879d unless it says otherwise. This pass critiques; it changes no app code, tests or copy. P6c (errors, #355) and P6d (hidden books, #361) are not merged and are left out. P6a has its own document, `P6A_CRITICS_PASS_2026-10-28.md`.

Scope note from #313: only **S43 Export** is on B2-10's line (J8, "Settings: Back up my recordings, Delete account, Export"); S34, S41, S42, S44 and S45 are not on it. I ranked all six the same way.

## 0. Verdict for B2-10 (P6b's share)

**Signed once M1 is fixed: the Privacy screen's two links to pages the website no longer serves are removed.** S43 Export, the one P6b screen on B2-10's line, passes on its own: every failure names its cause and has an action that can work, and it stays free and offline. S1 (two glossary words in what the app sends) should be fixed or ruled before build 2, and the device checks in section 7 go on the build 2 run sheet.

P6b is calm and honest. The Plan screen is an iOS Settings list with no status card when Plus is off, the promise said once, the payment line said once, no price anywhere, and every billing sentence still the registered one. Reminders has one switch, keeps the person's choices when it is off, and reads a pause left by an earlier build as Off on both screens. Recordings says one fact in one place and never says "only on this phone". Export shows the book's cover, says the export is made on this phone, and every failure names its cause. The never-lines are a plain list on paper. The Appearance sample is the person's own first line, never a sentence the app wrote.

| Rank | Count |
|---|---|
| Must before build 2 | 1 |
| Should before build 2 | 1 |
| Later | 9 |
| Accept as built | 13 |

The two to fix first: **M1** (Privacy links to removed pages), **S1** ("chapter" in the month notification and "note" for what Plus sends).

## 1. How this was looked at

- A scratch worktree at 817879d, node_modules as a directory of symlinks to the main checkout (no `npm ci`), a fresh web export of all three builds, a short TMPDIR. Develop then moved to a6519a4; I diffed the files P6b owns (none changed).
- The P6b Playwright journeys, `JOURNEY_SHOTS=1`, one worker: **j12, j13, j14, j15 (2) and j16 (2) passed**, in the same run as P6a's (19 of 19, 28.5 min, on a host at load 20 to 44). Screenshots at 402 by 874 pt, 3x.
- A scratch probe (never committed) against patched copies of the web build, as the P4 pass did. Plan states written to the on-device plan cache and read through the real screen: annual, monthly, free trial, ends (not renewing), grace, billing retry, lapsed (expired), Family Sharing and Plus off, each with Apple's store view reported as available; Restore answering "restored", "nothing" and "failed" (with and without a trial on the row); a pause left from an earlier build (`reminders.enabled` and `reminders.paused` both on); a font scale reported to the app and accessibility text sizes emulated by scaling every px font size by RN's multipliers with the token caps (the same approximation the P4 pass used; it also scales the web preview's own header, which iOS does not). Dark mode and AX5 captured for Settings home, Plan, Reminders, Recordings, Export, Privacy, Appearance, Add a child and the struggling page; I looked closely at Plan (trial), Reminders (default and dark and AX5), Recordings, Export, Privacy and Appearance from the journeys.
- Screenshots stay in the session scratchpad, not in git: `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p6-shots/` (`default/`, `keep/`, `p6b/`), probe results in `/tmp/cr-p6/probe-b-results.json`.
- Read: CLAUDE.md, the spec sections above, MOTION 2 and 6, COMPONENTS 0.1, 2.10, 2.11, `packages/content` VOICE.md and BRAND.md (glossary), `docs/legal/in-app-disclosures.md` (unchanged by this pass), every string these screens read, the bodies of #313 and #312, and, for M1, the website code on `main` (`apps/web/e2e/pages.e2e.ts`, `apps/web/e2e/support/legal.ts`) and the body of #169.

The web preview is a stand-in. It has no haptics, no VoiceOver, no StoreKit (the probe fakes the plan cache and Restore's answer, not a purchase), no notification permission (the web always answers "denied", so the Plan screen's "Allow notifications" row and the Reminders card appear there regardless), no file system (Export's failure card is what the web shows; it says "needs more free space" there, which is a web artefact), and no speech files. Section 7 lists everything left for a phone. I could not reach earlyletters.com from this sandbox, so M1 rests on the website's code and tests on `main`, not on a live request.

## 2. Findings, ranked

### Must before build 2

**M1. The Privacy screen links to two pages the website has taken down.**
- Spec: S44 copy (line 1139): "Both land after #163 merges and no later than #169, which takes `/health-privacy` off the website, so no link ever points at a missing page." Counsel item C9 (line 2065).
- Built: Privacy renders four document rows from content (`apps/mobile/src/app/settings/privacy.tsx:80-83`): Privacy Policy, "Consumer Health Data Privacy Policy" (`brand.web.healthPrivacy`, `packages/brand/index.ts:53`), "Who helps us run the app" (`brand.web.subprocessors`, `:54`) and Terms of Service. #169 merged on 16 October and removed `/health-privacy`, `/subprocessors` and `/delete-account`; on `main` they are listed as removed routes that answer 404 (`apps/web/e2e/support/legal.ts:25`, `REMOVED_ROUTES = ['/health-privacy', '/subprocessors', '/delete-account']`, asserted by the "taken off the site for now" tests in `apps/web/e2e/pages.e2e.ts`; the short list of services now sits inside `/privacy`). #163, which deletes the notice document and lets S14 retire `healthPrivacyLink`, is still open, so the order the spec relied on did not hold: #169 landed first. The same dead link is in sign-in's consent page (`apps/mobile/src/app/(auth)/sign-in/consent.tsx:296`, P8a's file).
- A parent: opens Settings, Privacy, taps "Consumer Health Data Privacy Policy" or "Who helps us run the app", and the browser shows the website's not-found page (`default/J16-02.png` shows both rows as ordinary links). On a screen whose whole job is to prove the app keeps its promises, two of its four proof links go nowhere, in a build that goes to testers and to App Review. Unverified live: the sandbox could not reach the site.
- Fix: remove the two rows from `privacy.tsx` now (their content keys can wait for S14 and #163), and the consent link with them (P8a's line); keep Privacy Policy and Terms, which work. Pin it with a test that no document row points at a route in the website's removed list.

### Should before build 2

**S1. Two glossary words in what the app sends: "chapter" in the month message, "note" for what Plus sends.**
- Spec: BRAND.md glossary (`packages/content/BRAND.md`, the rows "A month section of the book" and "What we send"): the month is "month", "chapter" is banned in copy; what we send is a "reminder" or a "message", never a "note". S34 copy (line 937): `monthNotesLabel` is "Month and birthday messages" for exactly this reason; S34 acceptance (line 951): "no 'note' for anything the app sends."
- Built: the Reminders screen's own "Month and birthday messages" switch (`apps/mobile/src/app/settings/reminders.tsx:236`) controls notifications whose words are `monthOpen` "A new chapter in the book is open." and `together` "New chapters today", "New chapters for {child} are open.", "A new chapter is open in each book." (`packages/content/src/features/reminders.en.ts:23`, `:29-31`). On the Plan screen, while a plan note is open, its section title is `billingCopy.note.title` "A note about Plus" (`apps/mobile/src/app/settings/plus.tsx:174`, `packages/content/src/features/billing.en.ts:146`), and the yearly reminder begins "A yearly note:" (`:141`). `rules.test.ts` does not test for "chapter", so nothing failed. #313 recorded the two "note" lines as a follow-up (its item c).
- A parent: reads "A new chapter in the book is open" on the lock screen on the first of each month, in a book that calls every month a month, and sees "A note about Plus" over the dates StoreKit reports.
- Fix: "Month {month} has begun in the book." style wording for the month message and "A new month is open in each book." for twins, owned by the content owner; "Plus dates" or "About Plus" for the Plan section title, with counsel because the `billingCopy.note.*` words sit beside registered Plus text. Add "chapter" to the banned list in `rules.test.ts`.

### Later

| # | Spec line | Built (817879d) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S34 Visual (949), HIG Settings: say what is true | with Reminders on and iOS Notifications off, the switch stays on and Settings home's row reads "A few times a week, 8:30 PM" (`settings/reminders.tsx:159`, `:162-173`; `settings/index.tsx:99`) | the card on Reminders explains it; the Settings row says reminders are on while none can arrive | let the Settings row read "Notifications are off" in that state (the card's own words) |
| L2 | S43 Visual (1130): the cover with the child's name and the month span ("Month 1 to 7"), 96 by 128 pt | the cover shows the name and the next book behind it; no month span (declared: no content key says it) (`settings/export.tsx:164-168`); at the thumbnail size it is an almost empty white card on paper (`default/J15-02-full.png`) | a quiet placeholder, not a preview of what they will get | a request to the content owner for the span; until then the cover is decoration, which S43 does not need |
| L3 | S43 Visual (1130): "Never mention print" | `exportCopy.screen.includesBook` "A printable book for each child, by month" is kept (`packages/content/src/features/export.en.ts:14`; ruled unchanged on #313); VOICE: "Digital only for now. No print" | the word "printable" in the What is inside list | spec owner to reconcile the two lines (section 5); "A PDF book for each child, by month" says it without the word |
| L4 | S41 States and Visual (1070): no status card when Plus is off | a parent whose Plus has lapsed sees the same Plan as one who never had it: "See what Plus adds", with "Request a refund" and "Save a copy" rows for a purchase that ended (`components/settings/plan.logic.ts:102-105`, `settings/plus.tsx:244-253`; probe "lapsed"); `keepGate.lapsedBody` ("Plus has ended ...") is said only on the Keep sheet | nothing says Plus ended or when | decide whether a lapsed Plan shows `lapsedBody` as its first row |
| L5 | S41 acceptance (1072): no sentence appears twice | the row dedups only identical sentences (`plan.logic.ts:93-100`): on a trial after a worked Restore the row says "Plus is on, free until November 24, 2026." and the result under Restore says "Plus is on." (probe "restore found, trial") | "Plus is on" twice, 150 pt apart | drop the Restore result's sentence when the row already says Plus is on |
| L6 | MOTION 6 (a haptic marks an outcome, never a navigation); P4 critics L6; #312 applied it to the Keep sheet | every Plan row plays `haptic('tap')` first, including "See what Plus adds", "Redeem a code" and "Manage subscription", which open Apple's sheets (`settings/plus.tsx:93`) | a tap where nothing was decided | play none for the three that navigate; keep it for a result (Restore found, refund sent) if wanted |
| L7 | S42 acceptance (1102): no fact appears twice | the screen title and the first section title are both "Recordings" (`settings/recordings.tsx:47`, `settings/_layout.tsx:50`), and the Word for word switch sits under the heading "How transcription works" with a five-sentence footer (`recordings.tsx:70`; `default/J14-01.png`) | a repeated word and a long grey footer | drop the section title (the card needs none) |
| L8 | S41 Visual (1070): "Manage subscription (only with a subscription)" | a Family Sharing member (probe "family") sees "Plus renews on September 28, 2027. Shared with you through Apple Family Sharing.", the plan name, and a "Manage subscription" row, though the subscription is not theirs (`plan.logic.ts:101-117`) | a row that opens Apple's list with nothing to manage | device check D1; hide Manage and the renewal sentence for `familyShared` |
| L9 | S41 copy table (1046 to 1068) lists the rows | the screen also shows "Save a copy of the terms", "Request a refund" (with an own purchase) and "Allow notifications" (`settings/plus.tsx:181-185`, `:244-253`), none in S41 (they pre-date it: #121) | nothing wrong; the spec is silent | spec owner adds them (section 5) |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S41: every registered and held billing sentence is the registered one. I read the Plan screen's text in nine plan states: the payment line is "Apple handles payment for Plus. We never see your card details.", grace and retry are the registered words, `restoreFailed` is "The App Store could not be reached. Please try again in a moment.", the plan names are "Monthly" and "Yearly" (`plan.logic.ts:35-39`, `HELD`, one line each when counsel clears them). `in-app-disclosures.md` was not touched; `experience-pass.test.ts` REGISTERED and HELD are as they were | Accept; unchanged and held for counsel. The S41 acceptance "Plus Monthly and Plus Annual" cannot pass until counsel clears them; that is the hold, not a miss |
| A2 | S41: no sentence twice, in every state but L5: the promise is the section footer once, the payment line is the second footer once, the row's status and the open plan note never say the same date (`plan.logic.ts:93-100`; probe over annual, monthly, trial, ends, grace, retry, lapsed, family) | Accept, with L5 |
| A3 | S41 and D-083: no "$", price or trial length typed. No dump of a Plan state shows a price; the trial row shows the dates StoreKit reports in the registered sentences | Accept. "Plus is on, free until {date}" with the note is the known counsel item |
| A4 | S41 structure: Plus off shows "See what Plus adds" first (or "Plus is not available on this device yet." / "Plus can be added on iOS 17 or later."), Manage only with a subscription, Redeem a code as a row, Restore's result inline under its row with the warning mark on failure, "Plus" with the plan name and StoreKit's date when on (`default/J12-01.png`, probe) | Accept. The spec's value "On" is the plan name instead (declared in #313) |
| A5 | S34: one switch; the master switch keeps cadence, evenings and time when off; no Pause row; a pause left by an earlier build reads Off on Reminders and on Settings home and turning the switch on clears it (probe "leftover pause": the Reminders page shows the switch and its help only, Settings reads "Off"; `reminders.logic.ts:269-276`, `lib/reminders/index.ts:56-62`) | Accept |
| A6 | S34: the notifications-off card carries WarningCircle in `caution` beside a heading, says "Notifications are off / Turn them on in Settings to get these reminders." with "Open Settings"; the switch thumb is white on the web (the old teal defect is fixed). Caution on the accentSoft card 4.09:1 (light) and 7.08 (dark), against 3:1 for a graphic; the card collapses and "Reminders are on." shows on return (source; a device check) (`default/J13-02-full.png`, `p6b/rem-dark.png`) | Accept |
| A7 | S42: the card says where recordings are kept once, in one place, never "only on this phone" ("Kept on this phone / Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own."); the three backup states are built behind `C7_CLEARED = false`, so build 2 shows today's card; the `keepHelp` footer is gone (`settings/recordings.tsx:47-50`, `recordings.logic.ts:231-247`; `default/J14-01.png`) | Accept; held for counsel (C7) |
| A8 | S43: the offline line is about the export only; "Not exported yet" with the nudge; four What is inside rows with 20 pt glyphs; a failure card with WarningCircle names its cause ("The export did not finish / This phone needs more free space first.") with "Export again"; too big leads to "Write to us" (mail with `helpSubject`); an empty book shows the outline button with "You can export once the book has a letter." above it (J15b); no Plus UI or network on the screen (`settings/export.tsx`, `export.logic.ts`; `default/J15-02-full.png`) | Accept. Too big needs a phone (D4) |
| A9 | S44: the three never-lines are a plain list on paper, each with a 20 pt LockSimple in textMuted, each one element for VoiceOver, glyph hidden; the words are the registered claims, unchanged (`components/consent/never-list.tsx`; `default/J16-02.png`) | Accept. The two dead rows are M1 |
| A10 | S45: the sample is the first line of the person's newest letter in the book (never private, never the other parent's, never a quiet-day mark or a letter waiting for words), in `letterBody` at the chosen size, ending in a fade with no ellipsis; "Aa" with no letter; the Reading size labels in Literata at their own size (`settings/appearance.tsx:150-211`, `appearance.logic.ts:228-238`; `default/J16-04.png`: "Bath time. You splash with your whole body, both hands, both feet,") | Accept. The labels are the one place the app's own words sit in the letter face, as S45 says (section 5) |
| A11 | Declared departures of #313: the Plan value is the plan name not "On"; the cover has no month span; S45's 200 ms theme cross-fade (P1, root layout) and S41's stacked lockup above Apple's view (S06, native SwiftUI) are recorded follow-ups, not P0 lines | Accept for build 2; L2 for the span; neither follow-up has an acceptance box |
| A12 | Dark mode and contrast: Reminders in dark (`p6b/rem-dark.png`) keeps the card, glyph, chips and switch legible; every colour on these screens is a token; textMuted on paper 5.51 (light) and 8.01 (dark), on accentSoft 4.75 and 5.73 | Accept |
| A13 | Targets and text size: list rows are at least 44 pt, the primaries 56 pt, Remove and Download are the row's own trailing word (one element); at accessibility sizes list rows stack their value under the title, the never-lines and the failure card wrap, and the sample keeps whole lines. Emulated only | Accept from source; Dynamic Type is a device check (D5) |

## 3. The departures #313 declared

| # | Item | Ruling | Where |
|---|---|---|---|
| 1 | Plan names "Monthly" and "Yearly" until counsel clears "Plus Monthly" and "Plus Annual" | Accept; held, one line each (`HELD`) | A1 |
| 2 | `plan.payment`, `grace`, `retry`, `restoreFailed` and `store.subtitle` unchanged; `restoreNothing` kept | Accept; held for counsel | A1 |
| 3 | `onPhoneBodyBackupOff`, `backedUpTitle`, `backedUpBody` behind `C7_CLEARED` | Accept; held for counsel (C7). #313 asks counsel and S05 to confirm the wording for the four backup states `paused`, `quota`, `waiting_key` and `some_kept_here` before the switch | A7 |
| 4 | S43's month span not built; S41's "On" value not built | Later; Accept | L2, A4 |
| 5 | S44's health notice link stays until #163 | **Overtaken**: #169 merged first; the rows are dead links | M1 |
| 6 | S43 "never mention print" against `includesBook` | Later; spec owner | L3 |

## 4. Every recorded gap, ruled

| # | Item | Ruling | Where |
|---|---|---|---|
| 7 | `reminderCopy.settings.pausedHelp`, `en.plus.promise`, `getRemindersPaused` and `setRemindersPaused` left for P7 | Accept; P7's clean-up | none |
| 8 | "A note about Plus" and "A yearly note" (#313 item c) | Should | S1 |
| 9 | A download held for being offline offers "Download" again as the retry (item e) | Accept; harmless, as #313 says | none |
| 10 | `settings/recordings.tsx` is S05's file; S05 should read the edit | Open, for S05 | none |
| 11 | `settings.neverRewrite` rendered nowhere; the plan row says "Plus is on." while the note carries the trial date | Known; not re-raised | none |

## 5. Spec-owner changes

Each row changes a line in `docs/design/EXPERIENCE_PASS_2026-10.md` (or VOICE.md) to match what was built and accepted, or to the fix a finding proposes. Line numbers are on 817879d.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S44 copy, 1139 | the Privacy and consent rows go "after #163 merges and no later than #169" | "The Consumer Health Data and 'Who helps us run the app' rows go now: the website no longer serves `/health-privacy` or `/subprocessors` (#169)" | M1 |
| S41 Visual, 1070 | "With Plus on, the first row reads 'Plus' with the value 'On' and the plan name" | "the first row reads 'Plus' with the plan name as its value" | A4 |
| S41 copy table, 1046 to 1068 | no rows for these | add `plan.saveCopy`, `plan.refund` (own purchase only) and `plan.turnOnNotifications` with their places | L9 |
| S41 States, 1070 | nothing for a lapsed Plus | add: lapsed shows `keepGate.lapsedBody` or nothing, and no refund row | L4 |
| S43 Visual, 1130 | "Never mention print" and `includesBook` KEEP | one line: drop "printable" from `includesBook`, or allow it | L3 |
| S43 Visual, 1130 | the month span on the cover | "the cover shows the name; the span waits for a content key" | L2 |
| S34 copy, 937 and acceptance, 951 | "no 'note' for anything the app sends" | extend to "and no 'chapter'": the month message words | S1 |
| S34 States | nothing for a pause left by an earlier build | add: "A pause from an earlier build reads Off on Reminders and Settings home; turning the switch on clears it" | A5 |
| S45 Visual, 1150 and VOICE "The app's own words" | the app's words "never sit in the letter's type" | add the exception S45 already makes: the three Reading size labels and "Aa" | A10 |
| MOTION 6 | no row for Plan | say Plan rows that open Apple's sheets play no haptic | L6 |

## 6. Motion, dark mode and text size

**Motion.** Plan, Recordings, Export, Privacy and Appearance have none of their own. Reminders: the notifications-off card leaves with `FadeOut` over `exitMs` and the rows below move with `LinearTransition` over the enter duration, and under Reduce Motion both are skipped (`settings/reminders.tsx:154`, `:163`, `:176`); source only, a device check (D2). The download ring steps with progress and never spins (`recordings.tsx:181-206`); Export's progress bar steps and has no animation (`export.tsx:225`). Haptics: Plan plays `tap` on every row (L6); Reminders plays `tap` on the day chips (a selection, as Reading size); Export plays `press` on start and `success` when ready (outcomes).

**Dark mode.** Captured for all six screens and Settings home; I looked closely at Reminders. The caution card is the accentSoft token with a caution glyph at 7.08:1; the chips and switch keep their edge (`controlBorder`).

**Text size.** Emulated AX5 only. List rows stack their value under their title (`components/ui/list-row.tsx:94-100`) and the Reminders switch row moves the switch under its title. The notifications-off card's heading is a single long word at AX5 ("Notifications") that is wider than the card in the web emulation (`p6b/rem-ax5.png`); iOS breaks a word that does not fit, so this is a device check (D5), not a finding. The Plan screen's long status sentences wrap.

| Plan screen, by state (web probe; every row's text) | First row | Rows below |
|---|---|---|
| Plus off, store available | "See what Plus adds" | Restore purchases, Redeem a code |
| Plus off, no store | "Plus is not available on this device yet." | Restore purchases |
| annual | "Plus / Plus renews on {date}. / Yearly" | Allow notifications (web), Manage, Restore, Save a copy, Refund |
| monthly | "Plus / Plus renews on {date}. / Monthly" | as annual |
| free trial | "Plus / Plus is on, free until {date}. Cancel by {date} and you pay nothing. / Monthly" | as annual |
| ends | "Plus / Plus stays on until {date}. It will not renew. / Yearly" | Manage, Restore, Save a copy, Refund |
| grace | "Plus / There is a problem with the payment for Plus. Your letters are fine, and Plus stays on while Apple tries again." | as ends |
| billing retry | "Plus / Apple could not take the payment for Plus, so Plus is paused. Every letter you have kept is safe." | Manage, Restore, Redeem, Refund |
| lapsed | "See what Plus adds" | Restore, Redeem, Refund (L4) |
| Family Sharing | "Plus / Plus renews on {date}. Shared with you through Apple Family Sharing. / Yearly" | Manage, Restore (L8) |

## 7. What we could not see on the web (device checks, with procedures)

Run on an iPhone with the TestFlight preview build and the StoreKit sandbox.

- **D1. Plan, every state.** Plus off: "See what Plus adds" opens Apple's view; "Redeem a code" opens Apple's code sheet. Buy Monthly with a free trial: Plan shows "Plus", the plan name and the dates once; the open plan note says its date and the row does not repeat it; "Manage subscription" opens Apple's list. Restore: with a purchase it says "Plus is on." under its row (and not twice, L5); with none it says "No Plus was found for this Apple Account."; in airplane mode it says the App Store could not be reached, with the warning mark. Share the plan through Family Sharing to a second phone and read that phone's Plan (L8). Let a sandbox plan lapse and read Plan and the Keep sheet (L4). Confirm no price and no "free trial" typed anywhere on the screen.
- **D2. Reminders.** Turn the switch on with notifications never asked: the priming sheet, then iOS's alert. Deny, tap Open Settings, allow, come back: the card collapses over about 280 ms and "Reminders are on." shows once (nothing slides with Reduce Motion on). On a phone paused in an earlier build (or after setting `reminders.paused` through a debug build): both Reminders and Settings home read Off, and the switch comes back on with its old cadence. With notifications off and the switch on, read Settings home's row (L1).
- **D3. Recordings.** English not on the phone: "Download" starts it, the ring fills ("Getting ready, 40%"), "Remove" asks first and removing keeps recordings and letters. Wi-Fi wait and low space read as before. The card says "Kept on this phone" with backup off.
- **D4. Export on a phone.** Export a book with letters and a recording: the cover is the active book's, with a twin behind it when there are two; "Save or share" opens the share sheet; the copy is cleared afterwards. Low space: fill the phone, read "The export did not finish / This phone needs more free space first." with "Export again". Too big (a very large test book): "This book is too big for one file" and "Write to us" opens Mail with the help subject. Empty book: the button waits under "You can export once the book has a letter."
- **D5. Dynamic Type.** AX3 and AX5 on an SE 3 and a 6.1-inch phone: Plan (status sentences wrap, the plan name stacks), Reminders (the switch under its title, the card heading breaks cleanly), Recordings, Export (the cover, the failure card), Privacy (the never-lines), Appearance (each Reading size and the sample's whole lines).
- **D6. Privacy links.** On a phone tap each of the four document rows; after M1 only Privacy Policy and Terms of Service remain and both open. Until M1: the two removed pages answer not found.
- **D7. VoiceOver.** Plan rows read title, subtitle and value once; the Restore result is announced politely; the Reminders card heading is a heading and the card reads in order; each never-line is one element with no glyph read; the language row is one button with its hint and the trailing word not read twice; Export's failure is one live region.
- **D8. The month message.** With "Month and birthday messages" on, read the lock-screen text on the first of a month (S1).
- **D9. Appearance.** With a kept letter the sample is its first line; with only a private letter, "Aa"; each Reading size at AX5.

## 8. The constitution and the content rules, checked

- Nothing on these screens writes or reshapes a person's words. The Appearance sample is the person's own first line as kept; Export reads the letters and changes none; Recordings says nothing about a letter's words beyond the registered "We never rewrite your words" in the Word for word footer.
- No fear, guilt or loss language, and no streaks, points or badges: Reminders counts no days or runs ("Late nights stay quiet."), Plan counts nothing left, Export's failures say the letters are still there.
- Billing and counsel text: the registered `billingCopy.plan.*` group, `store.promise`, `store.subtitle` and `keepGate.heldNoteSynced` are unchanged and held (A1); nothing in P6b reads like a change to them; the held switches are one line each. `docs/legal/in-app-disclosures.md` is byte for byte as it was.
- Never "only on this phone": no Recordings state says it. Nothing says software wrote or improved anything. Nothing genders the child.
- Privacy: no entry text, transcript, audio or child name in analytics or logs; Export reads on this phone with no network call; the Appearance sample is read on this phone and shown only here.
- The glossary and the content rules: S1 is the one breach I found (a word, not a rule the test enforces). No em dash, en dash, curly quote, ellipsis character or emoji in any string these screens read; the spec's rule that "we" appears only in the sanctioned promises holds (the registered Plan and Recordings lines are the registered "we").
- This document uses the fictional family Asha only, and no em dashes, en dashes, curly quotes, ellipsis characters or emoji.

## 9. Coordinator's rulings

None yet. M1 is ranked Must because a legal-policy link that opens a not-found page is a shipping defect with a two-line fix, even though S44 is not on B2-10's line; the coordinator may rule it Should, in which case the verdict in section 0 becomes "Signed" with M1 and S1 on the fix list. M1's live behaviour is unverified from this sandbox: a request to the two addresses from a phone settles it (D6).
