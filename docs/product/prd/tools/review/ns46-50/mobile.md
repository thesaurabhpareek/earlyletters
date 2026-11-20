# Review of NS-46 to NS-50 from mobile engineering (Expo SDK 57, iOS 17 target)

Reviewer: `mobile` agent (a Claude role, not a lawyer). Date: 20 Nov 2026 (UTC). Branch `docs/locked-pack-inputs-20nov`, head `69607775e`. Docs only; no code changed, no branch switched, nothing committed.
Card reviewed: `docs/product/prd/21-days-cultural-photos-home.md`. Function files read for this lens: `functions/lifecycle-and-platforms.md` (FR-LCY-15, 16, 31), `functions/reliability.md` (FR-REL-31, 32, 35, 54, 56, 57), `functions/messaging-and-entry-points.md` (FR-MSG-16, 18, 19, 21, 23). GAP-LOG rulings (R-IA, N, CB, DL) and errata E13, E16, E18, E20, E21 are treated as binding; conflicts are flagged, not reopened.

## 1. What I checked, and how

Code read (all on this branch): `apps/mobile/src/lib/reminders/{planner,scheduler,prefs,tz}.ts`; `lib/billing/plan-reminders*.ts` (the second scheduler); `lib/capabilities.ts`; `lib/remote/index.ts`; `lib/capture/start-capture.logic.ts`; `app/(tabs)/{_layout,index,you}.tsx`; `app/settings/index.tsx`; `app/+native-intent.tsx`; `app.config.ts`; `modules/scribe-photo`, `modules/scribe-store`, `modules/scribe-files`; `lib/db/repos/entries.ts`; `packages/core/src/{domain,age}.ts`; `packages/api/src/{kill-switches,remote-config}.ts`; `packages/content/src/features/reminders.en.ts`, `strings.en.ts:690-699`.
Outside facts read this session (Apple documentation JSON, fetched 20 Nov 2026, no personal data sent):
- JournalingSuggestions framework, iOS 17.2+: https://developer.apple.com/documentation/journalingsuggestions
- Picker view, iOS 17.2+: https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker
- `journalingSuggestionsPicker(isPresented:onCompletion:)` view modifier, iOS 17.2+: https://developer.apple.com/documentation/swiftui/view/journalingsuggestionspicker(ispresented:oncompletion:)
- Entitlement `com.apple.developer.journal.allow`: https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.journal.allow
- Presenting the picker and processing a selection: https://developer.apple.com/documentation/journalingsuggestions/presenting-the-suggestions-picker-and-processing-a-selection
- Notification path, `JSNotificationURLFormat`, token iOS 26+: https://developer.apple.com/documentation/journalingsuggestions/receiving-journaling-suggestions-from-system-notifications
- `Photo.photo` (URL "on disk"), `LivePhoto.image` (still URL "on disk"), `JournalingSuggestion.title` (non-optional String), `.date` (DateInterval?), `content(forType:)` (async).
- Expo capability sync lists Journaling Suggestions: https://docs.expo.dev/build-reference/ios-capabilities/
Measured: a Node micro-benchmark of the one cost driver in the planner (`Intl.DateTimeFormat.formatToParts`, section 5). Node is a proxy, not Hermes on an SE 3.
Not done: no device, no simulator, no EAS build, no Xcode; `node_modules` is not installed here, so `npm test` and `tsc` were not run.

## 2. Findings, in order of severity

Each finding: card and row, what is wrong, evidence, severity, proposed change.

### P0 (blocks build as written)

**M-01. NS-46-R4, R7, R8, NS-48-R26: the one-a-day rule is not enforced across classes anywhere, and the planner can already send two notes on one day.**
Evidence: `planner.ts:320-338` keys month and birthday notes by `${kind}:${date}`, so a birthday for child A and a month note for child B on the same date are two notes (09:00 and the reminder time). `planner.ts:350` only makes the evening nudge yield to them. `plan-reminders.ts` is a separate scheduler (`plan.` ids, own cap of 4, `plan-reminders.logic.ts:47-50`) and shares no budget. There is no `lib/reminders/budget.ts` (NS-13 section 3a names it). This answers IA-AUDIT X6/R-IA-6 and conflict 6: the budget is enforced nowhere except evening-versus-note replacement. NS-13 section 3a item 4 and 5 (merge, one per day, priority) are unbuilt.
Change: add row NS-46-R7b (P0 (a)): "Given the planner builds candidates for every source (`typedDay`, `birthday`, `libraryDay`, `monthAge`, `evening`) over one plan, Then one pure `chooseOnePerDay(candidates)` in `lib/reminders/budget.ts` picks at most one per local date by the DL-2 order, merges same-kind notes for several children and two library days into one, and is the only place the rule lives; a property test over random plans proves no date holds two budgeted notes." NS-48-R26 then reads "the answer is `budget.ts`", not "record where". Make `budget.ts` a hard prerequisite of NS-46 and NS-48 (today the cards list BL-966 only).

**M-02. NS-48-R1, R14, section 10 ("last chosen key" setting): the selection is not pure, and it makes every re-plan churn.**
Evidence: R1 says "same inputs same key"; section 10 adds a phone-only "last chosen key" so the next plan's first key does not repeat the previous one. But `scheduler.ts:144-146` skips work only if `planSignature` (which includes title and body, `planner.ts:376`) is unchanged, and re-plans run on every store write (`scheduler.ts:247`, 1.2 s debounce) and every foreground. A mutable input means the same plan can produce different words on the next run, so the signature changes and every pending note is cancelled and rescheduled for nothing. Also "last chosen" is not "last delivered": the phone cannot know what was delivered while the app was closed, so the no-back-to-back rule (R14) cannot rest on it.
Change: delete the "last chosen key" field. Pick the variant as a pure function of `(cell, slotOrdinal(date, weekdays))` using the built `slotOrdinal` (`planner.ts:212`), which already guarantees consecutive slots take consecutive variants. R14 then holds by construction inside one plan and across re-plans. Add test: planning twice with no change yields an identical signature.

**M-03. NS-48-R11 against NS-48-R23 and the built 8: a title may not carry `{child}`, but the built named titles do.**
Evidence: `strings.en.ts:690-698`: "A minute for {child}?", "Dear {child},", "{child}'s book is right here" (gentleReturn) are named titles. R11 says "a title never carries a `{child}` slot at all"; R23 says the migrated 8 keep their built wording; the planner uses the named set when names are on (`planner.ts:245`). These cannot both hold.
Change: R11 reads "With names off or App lock on, no rendered title or body contains a child name; new catalogue variants carry `{child}` in the body only; the migrated 8 keep their built named titles, which render only when names are on." Add a lint that checks the rendered neutral form, not the slot.

**M-04. NS-48-R12 against R15 and R23: the floor can violate the day-part filter.**
Evidence: of the built 8, "A letter tonight?", "The house is quiet" and "Before you sleep" are evening-worded (`reminders.en.ts:13-22`). R12 drops evening-worded variants before 17:00 "including the built 8"; R15 says a thin pool returns "a built variant". At 07:00 with a thin pool the floor could return "Before you sleep".
Change: R15: "the floor is the five day-neutral built variants (positions 1, 3, 5, 6 and 8 in the list, content to confirm), tagged `evening: false`; the three evening-worded ones are eligible only from 17:00." Content to confirm which five. Add the test: every (cell, hour) in the window has at least one eligible floor variant.

**M-05. NS-46-R10 and the "Reminders off" edge: library days cannot fire as the planner is built, and the first permission ask is undefined.**
Evidence: `planner.ts:286` returns `[]` when `!prefs.enabled || prefs.paused`; `scheduler.ts:135-139` does the same before reading permission. NS-46 section 5 says "Reminders switched off: library days still come if notifications are allowed". Also, permission is asked only in `turnOnReminders()` (`scheduler.ts:293-310`); FR-MSG-19 says one ask, at the person's own act. A parent who ticks a day with reminders off and permission undetermined gets no note and no ask, and the card says "no second ask" without defining a first.
Change: new row NS-46-R10b (P0 (c)): "Given the parent ticks a day with notifications undetermined, Then after the parent's own tick and our one sentence the standard iOS ask is made once through the one `turnOnReminders`-style door, without switching on evening nudges (a library-day-only mode); a refusal is final (FR-MSG-19); Given reminders are off and notifications are allowed, Then `libraryDay` and `typedDay` still plan and evening, month and birthday do not." This needs a planner input split: `prefs.enabled` gates the three reminder classes; day sources have their own gate. Same split NS-18 needs (BL-982); confirm with its owner.

### P1 (fix before build)

**M-06. NS-46-R10, R5: a 92-day horizon means a ticked day never fires for a parent who does not open the app in the 92 days before it.**
Evidence: NS-13 section 3a item 8 sets the horizon to day 35 for evening, month and birthday and says typed days are not stopped by the back-off (`09-capture.md:64`). NS-46-R10 plans a library day "92 days ahead". iOS keeps whatever we schedule; only our planner decides the horizon. A parent who ticked Thanksgiving in March and opens the app in July gets nothing in November. The 60 ceiling does not bind (see section 5), so a long horizon is cheap.
Change: R10: "`libraryDay` notes are planned for the next 366 days, subject to the ceiling; when the ceiling binds the latest-dated are dropped and the next re-plan refills them." State plainly in the card that a day beyond what is pending needs an app open in the year (the same honesty NS-13 applies to evening nudges). Default if the founder prefers fewer pending notes: 92 days, with the dormant-app limit written in section 5.

**M-07. NS-46-R9 against errata E13: 60 plus 4 versus 60 in total.**
Evidence: E13 (`18-errata-after-lock.md:19`) rules "60 pending in total, plan notices kept first within it". NS-46-R9 and NS-32-R4b (`11-foundations.md:98`) use 60 budgeted plus 4 plan. Built: planner `max` 60 (`planner.ts:90`) plus `MAX_PLAN_NOTIFICATIONS = 4` (`plan-reminders.logic.ts:47`) is 64. The iOS 64 limit itself is stated in code comments and cards; I did not find it in the Apple pages read (UNVERIFIED here).
Change: R9: "the budgeted group never exceeds 60 minus the plan notices pending (E13)". `budget.ts` takes the plan-notice count as an input; this is the same module as M-01.

**M-08. NS-46-R13, NS-50-R4: a tap on a library-day note goes to the Book, and no code knows "arrived by notification".**
Evidence: `scheduler.ts:257`: `router.navigate(data.kind === 'evening' ? '/' : '/book')`. Month and birthday go to the Book on purpose; `libraryDay` and `typedDay` would too unless named. Cold start: the listener is added in `startReminders()` after boot (`scheduler.ts:253`), while the plan-notice scheduler already uses `getLastNotificationResponse()` for a cold tap (`plan-reminders.ts:136`); the evening scheduler does not. The payload is `{ source, kind }` only; NS-47-R8 forbids a day key, so Home must derive "which day" from today's date and the store.
Change: R13 adds: "A `libraryDay` tap opens Home; Home finds the day by today's local date, never from the payload; a tap the next day shows no day line." Add `libraryDay` to the tap router with a test beside `reminders-inline.test.ts`. For NS-50-R4 (conflict 5), my recommendation to Karma: draw the day one way only, as the slip, for both arrivals. The two-way rule needs a module-level "tapped" flag consumed by Home plus cold-start handling for the evening scheduler, for no parent-visible gain. If the founder keeps two ways, add the cold-start `getLastNotificationResponse()` path as a row.

**M-09. NS-46-R28, NS-47 state tables: a remote pause cannot be wired with the existing pattern, and nothing would re-plan when it arrives.**
Evidence: `capabilities.ts:185-194` and `mayRun` (`:266-269`): `buildFlagEnabled` returns false whenever `serverFeaturesEnabled()` is off, and TestFlight runs servers off (errata E20). A `libraryDays` entry in `KILL_SWITCH_FLAG` would hide the whole library in every servers-off build. Remote config itself is fetched in every build (`startRemote`, `_layout.tsx:107`), so the switch can work if wired outside `mayRun`. Second: nothing subscribes the scheduler to remote config, so a pause arriving after the foreground re-plan (`scheduler.ts:248-252`) cancels nothing until the next store write. New key needs `packages/api/src/kill-switches.ts:10` and the signed-config schema (`remote-config.ts:59, 71`), plus the integrity tests.
Change: R28 adds: "The gate is `EXPO_PUBLIC_DAYS` (a local flag, E20) and `getRemoteConfig().killSwitches.libraryDays !== true`, not `mayRun`; the scheduler re-plans when the remote config document changes (`remoteConfigDoc.subscribe`); a servers-off build honours the pause when it can fetch." Same note for NS-49's `EXPO_PUBLIC_SUGGESTIONS`.

**M-10. NS-47-R6, R11, NS-46 "untick cancels at once": the days store sits outside `scribe.db`, so the scheduler never hears about a change.**
Evidence: `scheduler.ts:247` subscribes to the store bus; `setSetting` emits it (`store.ts:276-278`). A separate backup-excluded file has no bus. `scribe-files` already offers `setExcludedFromBackup` (`ScribeFilesModule.swift:32`), so the store is buildable.
Change: NS-47-R11 adds: "the days module exposes one `subscribeDays` that the scheduler and Home read; a tick, untick, move or clear re-plans within the existing debounce; an import-boundary test allows the scheduler to read only opaque slots." Also the `culture.asked` flag, if it lives in `settings` (backed up, device-wide), must be keyed by account id and deleted by Erase; say so in NS-47 section 10.

**M-11. NS-48 section 10, R27: `lastMadeLetter()` "reusing `lastOwnSaveAt`" would read every row of every entry on each re-plan, and its kinds do not map.**
Evidence: `prefs.ts:120-131` loops `listEntriesForChild` for each child; `entries.ts:60-62,164-171` select every column including `raw_transcript`, `machine_edits`, `final_text`. It runs on every store write and foreground. At the FR-REL-32 year-5 fixture (1,200 letters) this is megabytes of rows per re-plan. It also counts "Not much today" marks (`kind = 'not_much'`) as a save; NS-13's anchor is a made letter. `ENTRY_KINDS` is `note | letter | not_much`, `CAPTURE_MODES` is `spoken | typed | mixed` (`domain.ts:23-28`): the card's "spoke, typed, small" has no stated mapping for `mixed` and `note`.
Change: R27: "`lastMadeLetter()` is one indexed query (`SELECT kind, capture_mode, captured_at ... ORDER BY captured_at DESC LIMIT 1` over visible books, own author, `kind != 'not_much'`), returning date and kind. Mapping: spoken to spoke; typed and mixed to typed; note to typed; not_much is not a letter." Founder or content to confirm "small". Fix `lastOwnSaveAt` the same way (FR-REL-32 latency).

**M-12. NS-48-R21, NS-46-R25, NS-50-R8: "quiet book adds nothing" has no reader to test today.**
Evidence: `prefs.ts:115-117` maps only `remindersOn`; `Child.quiet` is never read in `lib/reminders` (grep). `store.ts:388` doc comment says "The planner reads `Child.quiet`", which is false. Confirms IA-AUDIT X6 and E16.
Change: no new row beyond E16/BL-985; make it a prerequisite in all three cards, and add to NS-46-R25 the line "`PlannerChild.included` is false for a quiet book" so the planner stays free of the quiet concept.

**M-13. NS-50 section 10 "Built today", R1, R5, R11: Home has no slip host or registry, and R11 would fail on the built waiting set.**
Evidence: `app/(tabs)/index.tsx:305-325` renders every waiting draft as a `DraftCard` (or one `HeldRow`), or one "A month ago" card when none is waiting; there is no seal-opened line, no Save a copy slip, no `SlipCard`, no registry (grep `SlipCard|FRAME-SLIP` finds only the frame doc). The card's "Home holds waiting cards, the seal-opened line, Save a copy and one past letter as slips" is true of the design, not of the code. R11 "count of slip-like items is at most 1" would fail on a phone with three waiting drafts.
Change: Built-today line: "Home holds waiting cards, one resurfaced card and the Plus line; the slip host, registry, seal-opened line and Save a copy slip do not exist (BL-963, COMPONENTS R11)." R11: "at most one slip rank shows at a time; rank 1 (the waiting set) keeps its list". NS-50 depends on BL-963, which depends on NS-06 and NS-11 for ranks 2 and 3: say so, because ranks 2b and 2c can ship before them only if the registry accepts absent ranks.

**M-14. NS-50-R9, NS-47-R26 against errata E18: the snapshot rule is worded "App lock on".**
Evidence: E18 rules the app-switcher snapshot blank whether or not App lock is on. Built: `components/app-lock/privacy-cover.tsx` draws only under the lock layer. A day name on Home shows on the unlocked screen, so the cover must be unconditional for Home and Me while a day name is on screen.
Change: R9: "Given the app goes to the background on Home or Me, with or without App lock, Then the snapshot shows no day name (E18)". Engineering row: generalise the cover to a blank-on-background rule keyed to screens that carry day names (rule owner: `mobile`; component is `design-systems`).

**M-15. NS-47-R19: "sitting", "answered or at its cap", and the ask cadence are not in the built ask sequencer.**
Evidence: `lib/asks/next-ask.logic.ts` has `reminder_prime` and `keep_book`, at most one ask per session and one per calendar day, a session being a cold start or a return after 30 minutes (`ASK_SESSION_GAP_MS`); `MAX_REMINDER_PRIMES = 2`. The Days ask is a Home slip, not a sheet, but "one ask per day" will conflict with NS-13's second prime if they land the same day.
Change: R19: "a sitting is an `ASK_SESSION_GAP_MS` session; the Days ask registers with `next-ask` and counts as the day's ask; it is due only when `primesShown >= 2` or the reminder answer exists". Otherwise two systems decide the same slot.

**M-16. NS-46 section 8 performance claims are ASSUMED and the planner has two unmeasured costs.** See section 5. Change: replace the ASSUMED 50 ms with a measured line (device check task) and add the budget "Home first frame does not wait on the days module (A-NFR-001)".

### P1 for NS-49 (native module; details in section 3)

**M-17. NS-49-R5, R15: the module needs weak linking, and `scribe-photo` declares the wrong floor.**
Evidence: `ScribePhoto.podspec:9` says `:ios => '16.4'`; `app.config.ts:44` is 17.0. JournalingSuggestions exists from 17.2 (Apple framework page). A hard-linked framework missing at launch on 17.0 or 17.1 stops the app before JavaScript runs.
Change: R5 adds: "`ScribePhoto.podspec` uses `s.weak_frameworks = 'JournalingSuggestions'`; every use is inside `@available(iOS 17.2, *)`; a build on the iOS 17.0 and 17.1 device rows launches and shows no suggestions choice". Raise the podspec platform to 17.0 to match the app.

**M-18. NS-49-R18: "iPad or Mac Catalyst" names the wrong platforms.**
Evidence: `app.config.ts:236` `supportsTablet: false`, no Catalyst key found. The real exposure is the iPhone app running on iPad, on Apple silicon Macs and on Apple Vision, which Apple allows by default for iPhone apps (UNVERIFIED here: I did not read the compatibility rules). Apple's own page says Mac Catalyst "ignore[s] input" from a picker button. Availability of the picker in those destinations is UNVERIFIED.
Change: R18: "`isAvailable()` is false when `ProcessInfo.isiOSAppOnMac` or `isMacCatalystApp` is true, and on a device where the picker is not present; the choice is absent, never a dead button; device rows: iPad (iPhone app), one Apple silicon Mac if the founder has one, else recorded as not run".

**M-19. NS-49-R7, R19: file-URL facts the card marks UNVERIFIED are partly answered, partly not.**
Apple pages say `Photo.photo` is "the URL to an image on disk" and `LivePhoto.image` is "the URL to a still image on disk" (so the "Live Photo still is provided" unknown is answered: it is, as `image`). They say nothing on where the file lives, how long it lasts, whether the app owns it (so "the Apple-provided copy is deleted once read" may be impossible, and a security-scoped read may be needed), or whether an iCloud-only photo has been downloaded: UNVERIFIED.
Change: R7: "copy then delete the copy in `Caches`; delete Apple's file only if the app owns its directory, otherwise leave it". R19: "the allowed location is recorded by the spike (step 1) from a real device; until then the validator accepts a regular file whose resolved path is not a symlink and whose type passes the allowlist". Add to the spike: whether `startAccessingSecurityScopedResource` is needed and whether an iCloud-only photo returns a file or fails.

**M-20. NS-49-R10: the app cannot restrict what the picker lists, so a parent may pick a workout or place and get a picture-less letter.**
Evidence: the picker pages list no filter parameter (`init(label:onCompletion:)`, `init(_:onCompletion:)` only); the system lists "a place someone visited, a person they connected with, a photo, a song" (framework page). The card handles `suggestions.noPhoto` with one calm line, which is right. But `suggestion.title` is a non-optional String and `date` a DateInterval?, and a place or workout title is read by the module even for a no-photo pick.
Change: R10: "for a suggestion with no photo item the module returns nothing, not the title or date; the title and date are returned only alongside a photo". Source scan as written.

**M-21. NS-49-R20, R21: the notification path touches boot wiring and the website's AASA file.**
Evidence: `JSNotificationURLFormat` must be a universal link (Apple page). `associatedDomains` is added only in sign-in-capable builds (`app.config.ts:250-257`), so a servers-off TestFlight build cannot offer it. The website's AASA lists exactly four paths (FR-MSG-23, `/auth/confirm`, `/auth/callback`, `/j`, `/open`) and must change one day before the build that needs it. The incoming URL would pass through `+native-intent.tsx` and expo-router, which would make the suggestion id a route and history entry, against R21 ("never logs or stores"); the file's own pattern strips secrets before routing.
Change: R20 adds "a fifth AASA path is added on the website at least one day before; the id is stripped in `redirectSystemPath` and held in memory like `setPendingAuthLink`; the edit to `+native-intent.tsx` is a task that names that file (it is boot wiring)". Keep P2 as the card has it.

### P2 (notes)

**M-22. N-6 (GAP-LOG) says "iOS schedules up to 35 days ahead".** I found no such iOS rule in the Apple pages read, and the code schedules 92 days today. The 35-day horizon is NS-13's own policy. Suggest Karma corrects the sentence so no one designs around a platform limit that is not one.

**M-23. NS-46-R11, tz edge.** iOS calendar triggers here carry no time zone (`scheduler.ts:101-113`): a note keeps its wall-clock date when the phone changes zone. An astronomical day shown on the local date is right at plan time and wrong if the parent crosses a zone before the day and does not open the app. Add one line: the planner re-plans on foreground (built), so a parent who flies and opens the app is correct; one who does not may see the note on the planned date. Acceptable, stated.

**M-24. NS-46 section 8: the table is under 100 kB and "ships in the bundle".** Keep it out of the boot path: import it lazily inside the days module so Home and cold start never parse it (A-NFR-001). Measure with a Hermes dev build, not by reading.

**M-25. NS-46-R4 `libraryDay` as "a source of the `typedDay` group".** `typedDay` is not in code (`planner.ts:106`). The planner type should be `PlannedKind` plus a `group` field so budget priority is data, not string compares.

**M-26. Apply loop (`scheduler.ts:147-165`) cancels everything, then schedules serially.** A kill between the two leaves nothing pending until the next launch (`lastSignature` is in memory only). With yearly faith days pending, a silent gap is a trust cost. Change: diff by id (add or replace what changed, cancel only ids no longer planned); iOS replaces a pending request with the same identifier (UNVERIFIED in the pages read, standard behaviour of `UNUserNotificationCenter.add`).

## 3. Journaling Suggestions: what is needed, verified against Apple's own pages

1. Native module: yes, one is needed. Expo has no JS API for it. Extend the local module `apps/mobile/modules/scribe-photo` (Swift, no third-party package; consistent with NS-01-R22). `scribe-store` already shows the pattern: a `UIHostingController` around a SwiftUI view presented from the current view controller, with a session that answers exactly once and a watchdog (`PlusStoreSheet.swift:98-170`).
2. API: SwiftUI only. `JournalingSuggestionsPicker { Text }` is a button-style view; for a programmatic start from our own React Native button use the `.journalingSuggestionsPicker(isPresented:onCompletion:)` modifier on a hidden SwiftUI host (iOS 17.2+, read). Presenting it from a hosting controller that is itself inside a presented sheet is UNVERIFIED and is spike step 1.
3. Result: `onCompletion` hands a `JournalingSuggestion` with `title` (String), `date` (DateInterval?) and `items`; read photos with `await suggestion.content(forType: JournalingSuggestion.Photo.self)` (and `LivePhoto` for the still); `Photo.photo` and `LivePhoto.image` are file URLs (read). `content(forType:)` is async: the Swift side must await it before resolving the JS promise.
4. Entitlement: `com.apple.developer.journal.allow`, "add by enabling the Journaling Suggestions capability in Xcode" (Apple). Expo's capability sync lists it, so EAS can enable it on the App ID from `ios.entitlements` (read). Whether Apple must approve the capability for a new App ID: UNVERIFIED; one forum thread read says nothing either way. Keep the card's step 1 spike and filing task.
5. Permission: none, and "You don't need to ask for additional authorization" (Apple). The first presentation shows Apple's one-time consent sheet (Apple). No usage string needed from our side (not stated by Apple; the card's R6 plist check stays).
6. OS and platform floor: iOS 17.2; Apple's framework page lists iPadOS 26.0 while the entitlement and modifier pages list iPadOS 17.2 (Apple's own pages disagree); Mac Catalyst ignores input. Our floor is 17.0 (`app.config.ts:44`), so the choice is absent on 17.0 and 17.1 (card is right) and `isAvailable()` is a runtime `#available(iOS 17.2, *)` check.
7. Simulator: availability in the Simulator is UNVERIFIED (a 2023 third-party write-up found it absent). Plan the CI as pure-logic tests (source scan, validator, closed lists) and every picker behaviour as device rows (iOS 17.1, 17.2, 26), as the card already says.
8. Notification path (iOS 26): `JSNotificationURLFormat` target property with a universal link; token modifier `journalingSuggestionsPicker(isPresented:journalingSuggestionToken:onCompletion:)`; `JournalingSuggestionPresentationToken` is iOS 26; an empty id means a general reminder (all read). Covered in M-21.
9. Android: the module is absent and TS returns null (`requireOptionalNativeModule`, `scribe-photo/index.ts:21`), which satisfies FR-LCY-31; the card needs its "what Android would do" line: not offered.
10. Closed-by-design check: no PhotoKit read is needed anywhere in this path; the NS-49-R25 scan still holds.

## 4. Where the cards contradict the code or each other (short list)

- NS-50 "Built today" (slips exist): contradicted by `index.tsx` (M-13).
- NS-46 "kinds are only evening, monthAge, birthday": confirmed (`planner.ts:106`). `typedDay` unbuilt: confirmed.
- NS-48 "8 evening variants rotated by `slotOrdinal % 8`, `planner.ts:139, 212, 353-356`": confirmed. "The planner gets only `lastSaveAt`": confirmed. "Two parallel sets": confirmed.
- NS-48-R11 versus built named titles (M-03); R12 versus floor (M-04).
- NS-46-R9 versus E13 (M-07). NS-46-R10 versus NS-13 section 3a item 8 (M-06).
- NS-46 "Reminders off: library days still come" versus `planner.ts:286` (M-05).
- NS-49 "level 1 built, `photo` source": `start-capture.logic.ts:20` lists `photo` as reserved ("until their PRs land, planning them starts nothing"); the Home on this branch has no picture start. The card says level 1 is in the open stack (#834 to #840), not read; that is accurate for this branch and means NS-49 cannot be built or tested here until that stack merges.
- Card line cites `app.config.ts:250-262` for entitlements; the block is `:260-262` (`:250-257` is `associatedDomains`). Minor.
- IA-AUDIT's X7 (three definitions of "days since the last letter") is real: Home uses `occurredOn` (`index.tsx:149`), the planner uses `captured_at`. NS-48-R3 (recency) should name which; recommend `captured_at` date in the phone's zone, as NS-13's anchor already says.

## 5. Performance and battery of the planner with a 35-day pre-schedule

What the planner does per plan (read, `planner.ts:284-372`): up to 35 evening candidates, each calling `zonedToEpoch` (2 or more `Intl.DateTimeFormat.formatToParts`) and `inQuietHours` (1); month and birthday notes for each included child (a loop of at most 1,440 cheap `monthDay` calls per child, then the same date work for each note inside the window); one sort; one slice to 60. About 100 to 200 `formatToParts` calls for an every-evening plan with a few children.
Measured here (Node, one run each, 175 calls per plan, five plans): 0.76 to 1.94 ms per plan. That is a proxy: Hermes on an SE 3 will differ by an unknown factor. UNVERIFIED on a device. Verdict: the planner function is not a risk at 35 days or at 366 days of library days (15 ticked days add about 45 calls). The card's 50 ms budget is plausible but unproven; add a dev-only timer around `planReminders` and a device-check task.
Pending count: with NS-13's back-off (11 evening at most, about 2 per child per window for month and birthday, library days and typed days on top) the pending set is typically 15 to 40, so the 60 ceiling rarely binds and NS-46-R9 needs a synthetic fixture to test it. Today (21-day evening horizon, 92-day month horizon) a single child with every-evening gives about 24 to 30.
Battery: pending local notifications cost the app nothing while pending (the system delivers them), and JavaScript does not run in the background here (no background mode, no task manager found by grep), so the planner runs only in the foreground: on a store write (debounced 1.2 s, `scheduler.ts:35, 247`) and on 'active'. The real costs are (a) the `lastOwnSaveAt` full-row read on every one of those triggers (M-11), and (b) the cancel-all-and-reschedule loop when the signature changes, which is serial `await` calls of up to about 60 cancels plus 60 schedules (`scheduler.ts:147-165`), roughly a second of native round trips on a slow phone (UNVERIFIED, not timed). NS-48 raises the chance of (b): a new letter moves the anchor, which changes every key, which rewrites every pending note once per letter. Acceptable if M-02 holds (no hidden state, one rewrite per letter, none per store write) and M-26 is done. Cold start: `startReminders()` runs a non-awaited re-plan at boot (`scheduler.ts:263`), so no new awaited work; keep the days table and the catalogue (about 264 variants) out of the boot import graph (M-24).
Device-check tasks to add (for the founder, `human`): (1) Hermes timing of `planReminders` for the every-evening plus 20 ticked days fixture on an SE 3; (2) `getAllScheduledNotificationsAsync` after a plan with 60 notes, counting what iOS holds; (3) cold start p50 and p90 with the days table present (A-NFR-001, target p50 1.2 s, p90 2.0 s); (4) Home first frame with a day slip at AX5 on SE 3; (5) the Journaling Suggestions device rows (17.1, 17.2, 26) and iPhone app on iPad; (6) lock screen, Notification Center and Apple Watch mirror for a library day (J-CUL-01).

## 6. Per-card notes: buildable as written?

**NS-46 Days we mark.** Buildable after M-01, M-05, M-06, M-07 are written in. Needs: `budget.ts`, a planner kind `libraryDay` with a group field, tap routing, a days module with its own change event, a lazy data table. Data rules R1, R6, R11, R12, R18, R24 are pure and buildable in `packages/content` and `packages/core` (move `dateOfAge` per R-IA-1 first). Computus and nth-weekday rules are plain integer maths in JS; no library is needed (permissive-licence rule: add none). R23 (tradition review, licence) is not mobile work.
**NS-47 Cultural background.** Buildable. Store as a JSON or small SQLite file excluded from backup with `scribe-files.setExcludedFromBackup`; sign-out hook is the existing `forgetReminders`-style path in `session-provider` (BL-961 enumeration). Needs M-10, M-14, M-15. The "ask once, later sitting" rule is straightforward once tied to `next-ask`.
**NS-48 Catalogue.** The pure function in `packages/core` is clean and testable without a phone. Blocked on NS-13's anchor and back-off (unbuilt) for the recency axis; the grid-only floor can ship first, as the card says. Needs M-02, M-03, M-04, M-11. `slotOrdinal` and `namedSlotIndex` are tied to 8 variants (`planner.ts:139, 222-235`) and must be reworked as the card says.
**NS-49 Suggestions.** Feasible with a Swift addition to `scribe-photo`; scope is small (picker host, two reads, one copy). Needs M-17 to M-21. Level 3 stays closed; nothing in the module reads the library.
**NS-50 Home today.** Small in logic, large in prerequisite: the slip host and registry do not exist (M-13). The two-arrival design (slip and line) costs more than it returns (M-08).

## 7. What is good enough to leave alone

- NS-46 "ticks store ids, not dates" (R6): matches how the planner would resolve at plan time; keeps corrected tables cheap.
- NS-46 quiet-tone rules and R17 copy rules: content-only, testable with the existing rules scan.
- NS-47-R4, R8, R9, R11 (no request carries a day key; one reader): testable with a network fake and an import-boundary test; the app already has the canary pattern.
- NS-47 sign-out, Erase, Delete account lines: the hooks exist (`forgetReminders`, `erase-everything.ts`).
- NS-48-R2, R3, R6, R10, R16: all hold with the built planner; `PlannedNotification` can gain a `key` without changing ids.
- NS-48-R22 (preview calls the planner's function): `intendedPlan()` and `nextReminder()` already share `planReminders` (`scheduler.ts:118-132`).
- NS-49-R1 to R4, R6, R11 to R14, R23 to R27: right in shape; `startCapture` closed list is real (`start-capture.logic.ts:20`).
- NS-49 level 3 closed and the `exp/photos-library-nudge` rule: correct and cheap to enforce with the existing source scans.
- NS-50-R2, R3, R7, R8, R10, R12: coherent once the host exists; "Not now" until tomorrow needs only a date-valued setting (store the date, never the day id).

## 8. Verdicts

| Card | Verdict | Required changes |
|---|---|---|
| NS-46 | CHANGES | M-01 (one-a-day chooser, P0), M-05 (planner gate and first permission ask, P0), M-06 (horizon), M-07 (60 total), M-08 (tap routing), M-09 (pause wiring), M-10, M-12, M-16, M-24 to M-26 |
| NS-47 | CHANGES | M-10 (store change event, flag keying), M-14 (snapshot rule), M-15 (ask sequencing), M-09 for the pause |
| NS-48 | CHANGES | M-02 (purity, P0), M-03 and M-04 (copy rule conflicts), M-11 (last-letter query and kind map), M-12; prerequisites NS-13 anchor and `budget.ts` named as hard |
| NS-49 | CHANGES | M-17 (weak link and floor), M-18 (platform names), M-19 (file URL facts), M-20 (read nothing from a no-photo pick), M-21 (AASA and native-intent), M-09 for the flag; no BLOCK: the API exists on 17.2 and the pattern exists in `scribe-store` |
| NS-50 | CHANGES | M-13 (built-today claim, R11 wording, registry dependency), M-14 (R9), M-08 (drop the two-way landing, Karma to rule conflict 5) |

No card is BLOCK. The two P0 findings (M-01, M-02) and M-05 need a card edit before an engineer picks up NS-46 or NS-48.

## 9. New rows proposed (ids are card-local; backlog numbers are Karma's)

| Id | Priority | Given, When, Then | Test |
|---|---|---|---|
| NS-46-R7b | P0 (a) | One pure `chooseOnePerDay` in `lib/reminders/budget.ts` is the only place the one-a-day rule and the DL-2 order live; a property test over random plans finds no date with two budgeted notes, including birthday plus month note for two children | `[NS-46-R7b] one chooser, one rule` |
| NS-46-R10b | P0 (c) | Ticking a day with notifications undetermined makes the one standard ask after our sentence; reminders off plus permission granted still plans `libraryDay` and `typedDay` only | `[NS-46-R10b] day notes do not need evening reminders on` |
| NS-46-R29 | P1 | Given a library day pending and the days store changes (tick, untick, move, clear) or `killSwitches.libraryDays` changes, Then the scheduler re-plans within 1.5 s | `[NS-46-R29] store and pause changes re-plan` |
| NS-46-R30 | P1 | Given a tap on a `libraryDay` note, Then Home opens and finds the day from the date; the payload holds no day key | `[NS-46-R30] tap opens Home, payload has no day` |
| NS-48-R28 | P1 | Given a plan is made twice with no input change, Then the signatures are equal (no hidden state in key choice) | `[NS-48-R28] selection is stateless` |
| NS-48-R29 | P1 | Given every (cell, reminder hour in the window), Then at least one eligible floor variant exists | `[NS-48-R29] floor covers every hour` |
| NS-48-R30 | P1 | `lastMadeLetter()` is one query returning date and kind, excludes `not_much`, and re-plan cost on a 1,200-letter fixture is within the FR-REL-32 launch budget | `[NS-48-R30] last letter is one query` |
| NS-49-R28 | P1 | The suggestions code is weak-linked and guarded by `#available(iOS 17.2, *)`; a build launches on iOS 17.0 and 17.1 rows with the choice absent | `[NS-49-R28] no launch crash below 17.2` (device row) |
| NS-49-R29 | P1 | For a pick with no photo item the module returns neither title nor date | `[NS-49-R29] no-photo pick returns nothing` |
| NS-50-R13 | P1 | Given Home or Me goes to the background with a day name on screen, with or without App lock, Then the snapshot is blank | `[NS-50-R13] snapshot rule is unconditional` |

## 10. Questions for the founder (each with a default)

1. Should the Days note ever be missed for a parent who does not open the app for months (M-06)? Default: plan library days for the next 366 days within the ceiling, and say honestly that a parent must open the app once a year for faraway days to be pending.
2. Should a day show one way (the slip) whether the parent arrives by the note or by opening the app (M-08, conflict 5)? Default: yes, one way; drop the separate line-above-prompt state.
3. If a parent ticks a day before ever allowing notifications, may we ask once, right after their tick and our sentence (M-05)? Default: yes, the standard iOS ask once, final on refusal.
4. Do you want the Journaling Suggestions entitlement filed with Apple now, in case approval is required (UNVERIFIED)? Default: `mobile` runs spike step 1 on the next TestFlight build; the founder is asked only if the Developer portal says a request is needed.
5. Is a founder phone available for iOS 17.1 and for iOS 17.2 or later, plus an iPad, for the device rows? Default: record a waiver for what is missing, never for a lost letter or a take refused (FR-REL-31 rule).
