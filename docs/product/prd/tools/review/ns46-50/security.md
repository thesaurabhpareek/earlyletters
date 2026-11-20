# NS-46 to NS-50: security and identity review

Lens: security and identity (X2 for pictures, entitlements, local stores, Journaling Suggestions data flow, deep links from notifications, App lock, shared-device cases). Reviewer: a Claude role (security-architect lens), not counsel and not an Apple employee. 20 Nov 2026. Docs only; nothing was run on a phone or built. Reviewed file: `docs/product/prd/21-days-cultural-photos-home.md` (line numbers below are that file unless another path is given).

## 0. What I read and what I did not

Read in this session: BRIEF; CLAUDE.md; cards NS-46 to NS-50 in full; `20-founder-direction-20nov.md`; `GAP-LOG.md` rulings K1 to K10, R-IA-1 to 6, N-1 to 8, CB-1 to 6, DL-1 to 10; `18-errata-after-lock.md` (E16, E18, E23); `functions/photos-and-suggestions.md`, `functions/risk-security.md`, `functions/reliability.md` (requirement tables); `FUNCTION-TRACE.md` (grep for NS-46 to 50: none of them was reviewed by a function, line 14); `00-product-frame.md` line 85 (X2); `01-photo-with-a-letter.md` (R2, R6, R13a, R22, R26, R27, R33, R47, R52 and section 11); engineering chapter 06 (SEC-R15, R17).

Code read on this branch head: `apps/mobile/src/lib/reminders/scheduler.ts` (lines 28-40, 148-172, 225-262), `planner.ts` (ID_PREFIX line 126, ids lines 328 and 358, `planSignature` 375), `prefs.ts` (lines 100-125), `apps/mobile/src/app/+native-intent.tsx`, `apps/mobile/app.config.ts` (lines 44, 92-93, 240-262), `apps/web/src/app/.well-known/apple-app-site-association/route.ts`, `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift` (header comments only). A grep for `previewPlaceholder`, `hiddenPreviews`, `setNotificationCategory`, `categoryIdentifier`, `interruptionLevel` across `apps` and `packages` found nothing.

Outside sources fetched today (20 Nov 2026):
- A1: https://developer.apple.com/documentation/JournalingSuggestions/receiving-journaling-suggestions-from-system-notifications.md
- A2: https://developer.apple.com/documentation/JournalingSuggestions/presenting-the-suggestions-picker-and-processing-a-selection.md
- E1: https://docs.expo.dev/versions/latest/sdk/notifications/ (first 100,000 of 123,941 characters only; the `NotificationContentInput` section was cut off, so anything about `interruptionLevel` as a content field is UNVERIFIED)

Not read: the Developer Program License Agreement text; whether Xcode weak-links a framework newer than the deployment target (UNVERIFIED); where the suggestion photo's file lives and who owns it (UNVERIFIED, Apple says only "an image on disk" via the function review's A4); iOS behaviour of a hidden-preview title, Notification Summary or Apple Watch mirroring (UNVERIFIED, left to the J-CUL-01 walk); iOS's cap on pending local notifications (UNVERIFIED here; the card's 60 plus 4 is its own number).

Priorities: P0 blocks build, P1 fix before build, P2 note. New row ids are PROPOSED. No backlog id is invented: "new row needed".

## 1. Findings, most serious first

### F1. NS-49-R16, R27, section 12 (Shown), section 18: "only the chosen picture reaches the app" is not what Apple says (P0, a promise and a store duty)
Evidence: lines 776, 787, 832, 871. A2 says "the system shares only the details of the chosen suggestion with your app" and "makes high-level details about the event available". A suggestion is a bundle: its `items` can hold photos, location with coordinates, workout route and heart rate, contact names and photos, songs, state of mind (A2 table). The whole chosen suggestion is handed to our process; our code then chooses to read only the photo. Whether non-photo items are materialised only on request is UNVERIFIED. The true sentence is "only the suggestion you pick comes to the app, and the app reads only its picture". Using the shorter sentence in the privacy policy, the Notes for Review and the claims inventory puts a false claim in three public places (FR-RSK-03).
Change: reword R16, R27, section 12 Shown, section 18 and section 19 to "the phone makes the list; only the one you pick comes to the app; the app uses only its picture". Add a claims-inventory row that says "reads only the picture" and cites R10's scan, not Apple's design. Label effect stays "no change" only on counsel's read (R27 already says so).

### F2. NS-49-R10: the scan as written does not stop non-photo data entering memory (P0, a)
Evidence: line 770 bans other `JournalingSuggestion.*` types by name. Apple's own example reads photos with `suggestion.content(forType: JournalingSuggestion.Photo.self)` (A2). Iterating `suggestion.items` (type `ItemContent`) touches every item type without naming any of them, so the scan passes and every item is read.
Change to R10: "... the source scan also fails the build on any reference to `.items`, `JournalingSuggestion.ItemContent` or `JournalingSuggestionAsset`; the only reads are `title`, `date` and `content(forType: Photo)` and `content(forType: LivePhoto)`; a Swift unit test with a fake suggestion holding a location, a workout and a contact asserts none is touched." Spike step 2 gains: record whether non-photo items are loaded eagerly.

### F3. NS-46-R13, NS-50-R4 and the tap handler: a library-day tap lands on Book today, and the card never says how Home learns which day (P0, a)
Evidence: `scheduler.ts:254-258`: `router.navigate(data.kind === 'evening' ? '/' : '/book')`. A `libraryDay` kind would go to Book, not Home (line 186 requires Home). The notification payload is built at `scheduler.ts:159` as `{ source, kind }` with the comment "Enums only". NS-47-R8 (line 385) wants 0 hits for a day key in route parameters and `userInfo`, so the day cannot ride in the payload or the route. NS-50-R4 (line 955) needs Home to know "the parent arrived by tapping a note".
Change: new NS-46-R29 (P0 a): "Given a library-day note is tapped, Then the handler routes to Home, the payload holds only `{source, kind: 'libraryDay'}` (no day id, layer, tradition or `days.*` key), Home finds the day by the phone's local date against the store, and the 'came from a note' state is one in-memory flag cleared after one Home render and carried through an App lock unlock; Given the note is tapped on a later date than it fired, Then Home shows no day line; Given the store is unreadable, Then Home opens plain with no message. Test: `[NS-46-R29] a day note opens Home, carries no day, and a stale tap shows nothing`." Also set the notification identifier to `el.day.<isoDate>` (same shape as `planner.ts:328`), never `days.<id>`, and say so in R4.

### F4. NS-48 section 10, line 627: "the tap payload may carry `key` for debugging" (P1)
Evidence: the catalogue key names the layer (`ntc.occ.family.03`, `ntc.occ.public.01`, line 667). A key in `userInfo` tells anything that reads delivered-notification data, a crash payload or a log that this was a family or faith-day note. It contradicts NS-47-R8 and NS-47-R12 ("every identifier is opaque") and the code comment "Enums only" (`scheduler.ts:158`).
Change: delete the clause. New NS-48-R28 (P1): "Given any scheduled note, Then `content.data` holds only `source` and the coarse `kind`; no catalogue key, variant number, day id or layer appears in `data`, `identifier`, `threadIdentifier` or `categoryIdentifier`. Test: a planner snapshot over every key asserts it."

### F5. NS-48-R16, NS-47-R12, NS-32-R13: the neutral hidden-preview placeholder is not built, and the cards write "keeps" (P1)
Evidence: line 591 says its category "keeps the neutral hidden-preview placeholder". The grep (section 0) finds no category, placeholder or interruption level anywhere in `apps` or `packages`; `scheduler.ts:153-162` schedules with no `categoryIdentifier`. E1: `setNotificationCategoryAsync(identifier, actions, options)` has an iOS option `previewPlaceholder`; the category identifier must not use `:` or `-`. NS-47-R12 is P0 and rests on this.
Change: NS-48-R16 and NS-47-R12 read "adds" not "keeps"; Dependencies (sections 22) name NS-32-R13 as unbuilt and a hard prerequisite. Add a test that every scheduled note carries a category whose `previewPlaceholder` is the one neutral string and that the category sets no option that echoes content (no `categorySummaryFormat` text, no `showSubtitle`). Note for the planner row: the placeholder only helps when the parent has set Show Previews to hide; in the default case the scheduled title and body are what the lock screen shows, so the neutral strings in R12 are the real control.

### F6. NS-49-R20, R21 (Apple's notification opens the app): wrong place and under-specified (P1 for the text, the work is P2)
Evidence: lines 780-781. The app already has a reviewed deep-link gate: `+native-intent.tsx` takes secrets out of every incoming URL before routing so they never become route params, history entries or log lines, and "links never open the microphone or a draft" (header, lines 1-25; SEC-R17). A1: the system opens a universal link on our domain with the suggestion's UUID in the path or a query argument; for a general reminder the id is empty; Apple's own handler validates with `UUID(uuidString:)`. Left alone, Expo Router would turn `/journaling-suggestion/<uuid>` into a route with the id as a route parameter. The AASA file lists "these paths, and only these" and its test pins them (`route.ts` header and `APP_LINK_PATHS`), with a stated principle that no token path opens the app. Anyone can send a parent that link in a message or a web page.
Change to R20 and new NS-49-R29 (P1, written before the spike, built after): "Given a link to the journaling path, Then `redirectSystemPath` (a) matches the exact host and path, (b) accepts only a value that parses as a UUID or is empty, ignoring every other parameter and every other path under it, (c) holds the id in memory only, never as a route param, (d) routes to Home with the picture start visible and never to `listen`, `review` or a draft (SEC-R17), (e) queues behind App lock and the 18+ gate and then drops the id if it is not used within one Home visit, (f) treats a link from any source the same. Tests: `links.logic` table with malformed, long, repeated and foreign-host values; AASA `route.test.ts` updated in the same PR (a change to `apps/web`, so it comes to security review); the website page at that path is content-free and logs no id (whether Vercel request logs keep the path is UNVERIFIED; treat the id as L3, which R21 already does)."

### F7. NS-49-R5, R15: the choice can be live while the entitlement is missing, and the framework is newer than our floor (P0, c core loop)
Evidence: `app.config.ts:44` floor is iOS 17.0; the framework and entitlement start at 17.2 (function review A1, A3 as read there). A2: "The suggestions picker fails to present without it" (the entitlement). Two failure modes:
1. Launch: a native module that links `JournalingSuggestions` strongly may fail to load on 17.0 and 17.1. Whether Xcode weak-links it automatically is UNVERIFIED. A launch failure means no letters at all. The card's device runs (line 856: "iOS 17.1, 17.2 and 26 ... flag off") do not test a binary that contains the module on 17.0 or 17.1.
2. Flag drift: `EXPO_PUBLIC_SUGGESTIONS` is a JS flag; the entitlement is a build-config decision (R15). A build with the JS flag on and the entitlement absent shows a dead button.
Change: new NS-49-R28 (P0 c): "Given a binary built with the module and the entitlement, When it launches and runs the core loop (cold start, Speak, Keep, Book) on iOS 17.0 and 17.1 and 17.2 and 26, Then it launches and the picker choice is absent below 17.2; the Swift import is guarded by `#available(iOS 17.2, *)` and the framework is weak-linked (the spike proves it, or the founder raises the floor, Q-PHS-2)." And R5 gains: "`isAvailable()` also returns false when the entitlement is absent from the signed plist, so no build ships a dead button."

### F8. NS-49-R7, R19: deleting "the Apple-provided copy" and checking "the returned container" assume facts we do not have (P1)
Evidence: lines 767, 779. Apple says the photo is "a URL to an image on disk" (function review A4); who owns that file, where it lives and how long it lasts is UNVERIFIED. R7 deletes it once read; if it is not ours that can fail or remove something the system uses. R19 refuses "paths outside the returned container" without naming one.
Change: R7: "the app deletes only the copy it made in its own Caches folder; it never deletes the URL Apple returned." R19: "the app opens the returned URL once without following links, checks with the open handle that it is a regular file under the size cap, reads the bytes from that handle (no second open by path), and runs the NS-01 type allowlist on the bytes, not the name." Spike step 2 records the directory, owner and lifetime of the URL and whether Exif location is present (the strip in NS-01-R6 applies either way).

### F9. NS-49-R9: Apple's title becomes the parent's words unless the parent clears it (P1)
Evidence: line 769 stores the title "only if the parent keeps the letter" in `photo_text`. Apple builds suggestions from "a place someone visited, a person they connected with" (A2); titles can carry place or person names. `photo_text` is L4, is indexed by Find and rides in Save a copy and the NS-05 wrapper (NS-01 section 11 line 258). The default is opt-out by omission, and machine-made text then sits in a field the app treats as the parent's own words, against CLAUDE.md "no feature may write ... a person's words".
Change: the title and date show as a label in memory only; they are written to `photo_text` or the letter date only after an explicit tap ("Use as photo words"); closing Ready without the tap discards them. Test: save a letter from a suggestion with a title and assert `photo_text` is null and the Find index holds no title.

### F10. NS-49 section 12 and the X2 line: the card never names X2, and "never leaves the phone" skips the iPhone backup (P1)
Evidence: grep of the file finds no `X2` or `E23`. `00-product-frame.md:85`: a child's picture leaving the phone needs a security read and a counsel read; E23 treats a Share picture as an X2 path. The suggestion path adds no egress, but the stored copy is the same object that Share (NS-05 Level 1) and Save a copy can later send. And NS-01-R27 puts pictures in the iPhone backup, so "stays on the phone" (R27, section 18) is true of our servers, not of Apple's backup.
Change: new NS-49-R30 (P0 a): "Given the whole suggestion flow (open, pick, cancel, keep, erase), a network fake sees 0 requests and no share-sheet call; the card states that a suggestion-origin picture leaves only through NS-05 and NS-11, each with its own X2 reads (E23), and that this card adds no door." R16, R27, section 18 use the NS-01-R32 lines ("on this phone and in your iPhone backup").

### F11. NS-47-R12: a stored day-name switch that is "forced off" comes back on by itself (P1)
Evidence: `prefs.ts:109-112`: `lockScreenNamesOn()` returns false while App lock is on, else the stored value, so turning App lock off silently restores the earlier choice. The same pattern for the day-name switch would put a family's faith back on the lock screen with no tap. A faith day costs more than a child name.
Change to R12 (and CB-5's "forced off", not a reopening): "Turning App lock on sets the stored day-name value to off; turning it off never turns it on; the effective value is always `stored && !appLockOn`. Test: on, lock on, lock off, assert the switch reads off and the next re-plan carries the neutral title." (The re-plan after a settings change is already triggered by `setSetting` and `scheduler.ts:211`; the test should cover it.)

### F12. NS-47-R13 and conflict 2: civic days can reveal a family (P1; a conflict with N-3 flagged, not reopened)
Evidence: line 390 and conflict 2 (line 71): N-3 lets seasonal and civic days name themselves in a lock-screen title, by default also with App lock on. A ticked Veterans Day, Memorial Day, Juneteenth or MLK Day can point to military service, bereavement or politics; the family chose it privately. N-3 is Karma's ruling; I flag the conflict with CB-5's purpose.
Proposed (for Karma): with App lock on, every library-day title is the neutral one, public days included; and `publicTitleOk` is true only for seasonal and fixed shared days (New Year's Day, Thanksgiving, Halloween, 4 July, solstices and equinoxes), not Veterans Day, Memorial Day, Juneteenth or Presidents' Day. If Karma keeps N-3 as ruled, add a data test that `publicTitleOk` is false for every `quiet` day and every day whose id is in a closed commemorative list. Founder question Q1.

### F13. NS-47-R22 and section 19: claims must admit what timing gives away (P1)
Evidence: a neutral note that fires at 09:00 on the same calendar date every year, while evening notes fire in the evening with different words, can be correlated with a faith date by someone who sees the phone each year. A public-named day versus a neutral one also tells an observer which kind of day it is. R12 says the notification never carries a tradition label (true) and R22 forbids "never shows" claims for the name, but not a "nobody can tell" claim.
Change: R22 adds forbidden claims "nobody can tell", "invisible", "private" and "undetectable"; the claim that is allowed is "the note does not name the day unless you turn that on". The call-out states nothing about timing; the Privacy Policy line and Notes for Review say the same. J-CUL-01 adds a reviewer sentence recording this residual.

### F14. NS-48 section 10 line 625: "the last chosen key" is stored in `settings`, which is in the iPhone backup (P1)
Evidence: line 625 stores the last chosen key so the next plan does not repeat it. If that key can be an occasion key (`ntc.occ.family.03`), the backup holds the layer of the last day note. `settings` is in the backup (NS-47 section 10, line 435).
Change: new NS-48-R29 (P1): "the anti-repeat memory records only an evening pool index, never an occasion, season or day key; a day note needs no anti-repeat memory (it recurs once a year)."

### F15. NS-47-R6 and R2: where the store lives, how it is protected and what the sheet holds (P1)
Evidence: R6 (line 383) says "a file or database excluded from the iPhone backup". SEC-R15 sets the floor: letters and audio files never use a weaker class than `NSFileProtectionCompleteUntilFirstUserAuthentication` (`app.config.ts:92-93`). R2 (line 379) holds the picked tradition "in memory until the sheet closes" but does not say a route parameter or navigation state may not carry it.
Change: new NS-47-R28 (P1): "Given the store file, Then it lives in Application Support with `isExcludedFromBackup` true (not Caches, which the system may purge), has a protection class no weaker than SEC-R15's, is written atomically (temp file then rename), and an unreadable or corrupt store fails closed (no note, `days_store_unavailable`, no crash). Test: read the attribute; kill mid-write; corrupt the file." R2 adds: "the browse filter is component state only: no route parameter, no `setSetting`, no persisted navigation state; the canary of R8 covers it."

### F16. NS-50-R9 and the App-lock edge row: conditional on App lock, against E18 (P1)
Evidence: line 960 and the edge row (line 920) say the switcher snapshot is blank "given App lock on". E18 (errata) and FR-SEC-22 ruled one rule: blank whether or not App lock is on, for every screen showing L4. NS-47-R26 (line 403) already says it without the condition. A ticked day is L4 (CB-1).
Change: R9 reads "Given Home, the Days page, Browse days, Day detail or the ask slip, When the app goes inactive, Then the switcher snapshot is blank, whether or not App lock is on"; add C-S24, C-S25, C-S26 and the ask slip to FR-SEC-22's list of L4 screens. Test title unchanged.

### F17. NS-49-R12: opening the picker while locked, and the switcher during the system picker (P1)
Evidence: line 772 covers a result that returns while locked. It does not say the picker cannot be opened while locked (the start is on Home, behind App lock, so normally true) and says nothing about the switcher snapshot while Apple's picker is on screen. The picker is in a system process (A2); what the switcher shows then is UNVERIFIED and the surface holds a child's pictures.
Change: R12 adds "the picker cannot be started while App lock is up" (a state-machine test) and a device check row in section 13: "switcher snapshot while the picker is open shows no picture; if it does, record it as an Apple limit and say so in the review notes."

### F18. NS-49 section 22: the shared-phone defect is a dependency (P1)
Evidence: `functions/risk-security.md` section 5 and FR-SEC-01 to 03: a second signed-in account on one phone opens the first account's book and can keep letters into it (`use-first-run-route.ts:131`, `gate.logic.ts:123-125`, `ownership.ts:49`); `[X4-R1]` does not exist as a test (E27). A level 2 start on B's session would put a picture from the phone's recent days into A's book under B. Apple's consent sheet is once per device, not per account (A2).
Change: section 22 adds "BL-961 and `[X4-R1]` green" as a gate for NS-49 and NS-46 to NS-50 ship (NS-47-R15 depends on the same enumeration). New row: a two-account test per card, Asha only.

### F19. NS-46 section 10 and R9, R10: the planning window and iOS limits (P2, reliability)
Evidence: R10 plans 92 days ahead; planning runs only when the app is foregrounded (`scheduler.ts:247-251`). A parent who does not open the app for more than 92 days before a ticked day gets no note, with no message. The 60 plus 4 pending ceiling is the card's number; iOS's own cap is UNVERIFIED here.
Change: the Days page and the Reminders help line say "notes arrive while you open the app now and then" (intent, `content`'s words, no promise of delivery); the planner test list includes "app not opened for 100 days: nothing wrong is shown". Not a build blocker.

### F20. NS-47 sections 5 and 13, J-CUL-01: device walk gaps (P2)
Add to the walk: Notification Summary, Lock Screen with the default Show Previews setting, Apple Watch mirror, CarPlay, and a check that grouping does not use a day-derived `threadIdentifier` (F4). Record the title-when-body-hidden behaviour as observed, since the card calls it UNVERIFIED (line 670).

### F21. FR-SEC-13 (trace gap) (P2)
`FUNCTION-TRACE.md:4006` says the security author fills or retires FR-SEC-13. I retire it: its job is now covered by FR-SEC-19 and the new rows above. For Karma to record.

## 2. Proposed new rows (summary for the trace)

| Id | Card | P | Given, When, Then (short) | Source finding |
|---|---|---|---|---|
| NS-46-R29 | 46 | P0 (a) | A library-day tap opens Home, carries only the enum kind, no day in payload or route, stale tap shows nothing | F3 |
| NS-47-R28 | 47 | P1 | Store file: Application Support, backup-excluded, class at least SEC-R15, atomic, fails closed; browse filter is component state | F15 |
| NS-48-R28 | 48 | P1 | `data`, `identifier`, `threadIdentifier` and `categoryIdentifier` hold no catalogue key, day id or layer | F4 |
| NS-48-R29 | 48 | P1 | Anti-repeat memory holds only an evening pool index | F14 |
| NS-49-R28 | 49 | P0 (c) | Launch and core loop on 17.0, 17.1, 17.2, 26 with module and entitlement in the binary; `isAvailable()` false if entitlement absent | F7 |
| NS-49-R29 | 49 | P1 | Journaling link goes through `redirectSystemPath`, exact match, UUID or empty only, id in memory, Home only, AASA test updated | F6 |
| NS-49-R30 | 49 | P0 (a) | 0 requests and no share-sheet call across the suggestion flow; X2 route for later sharing named | F10 |
| NS-49-R31 | 49 | P1 | Title and date held in memory; written to `photo_text` or the letter date only on an explicit tap | F9 |
| NS-49-R10 (changed) | 49 | P0 (a) | Scan bans `.items`, `ItemContent`, `JournalingSuggestionAsset` as well as named types | F2 |
| NS-47-R12 (changed) | 47 | P0 (a) | Turning App lock on sets the day-name value to off; effective value `stored && !appLockOn` | F11 |
| NS-50-R9 (changed) | 50 | P1 | Blank snapshot whether or not App lock is on; list gains C-S24 to C-S26 | F16 |

Engineering rows needed (none given an id): the `+native-intent` journaling branch and its AASA entry; category registration with `previewPlaceholder` and an `interruptionLevel` check once E1's cut-off section is read; the store file module with its attribute test; the two-account test; the weak-link and launch test. All are "new row needed".

## 3. Good enough, leave alone (one line each)
- NS-49-R6, R25: no permission, no usage string, no PhotoKit authorisation or fetch, level 3 closed; matches NS-01-R22 and A2.
- NS-49-R11: cancel, decline and empty write nothing and the app never pre-prompts Apple's sheet.
- NS-49-R13: byte-identical export for level 1 and level 2 pictures; it is the right test and works with F9.
- NS-49-R22 and R26: Apple's notifications are not ours, and a level 3 spike makes a decision, not a feature.
- NS-47-R4, R8, R9, R11: network fake, canary with synthetic keys, analytics allowlist rejection and a single reader of the store.
- NS-47-R15 and R16: sign-out clears at that moment, B sees nothing, Erase scan covers the store file and resumes after a kill.
- NS-47-R3 and R5: nothing attached to the child, and a day note leaves no trace in the synced row (CB-3 test against a control).
- NS-47-R20: no "Eastern" option, no prefill from locale, storefront or time zone, no cross-suggestion.
- NS-46-R2, R4, R7, R8: nothing pre-ticked, no new class, birthday beats a day, two days give one note.
- NS-46-R16: quiet days stay quiet and the tone is not editable.
- NS-46-R28: the pause hides the library and cancels pending library notes, never turns anything on and never stops export; it fits FR-SEC-16 and E21.
- NS-46-R11, R12: rule dates computed on the phone, astronomical days stored as a UTC instant; no network is needed, so no new egress.
- NS-48-R9, R11: neutral strings on lock screens, no child name by default, a title never carries a `{child}` slot.
- NS-50-R1, R2, R10, R11: one slip slot, today only, no picture slip, no strip.

## 4. Conflicts with rulings (flagged, not reopened)
- N-3 against CB-5's purpose: civic day names on a lock screen (F12). Karma's conflict 2 already asks; my recommendation is in F12 and Q1.
- CB-5 "forced off while App lock is on" is kept; F11 only closes the silent comeback.
- NS-48 section 10 "key in the tap payload" conflicts with CB-1 and N-3 in effect (the layer would be visible in `userInfo`); removed by F4. No ruling is changed.
- R-IA-3 (slip, not strip) is respected: no finding asks for a strip.

## 5. Verdicts

| Card | Verdict | Changes required before build |
|---|---|---|
| NS-46 Days we mark | CHANGES | F3 (P0: tap routing and payload), F19 (P2), F12 (flag for Karma), F18 (dependency). Quiet-day, ordering and pause rows stay. |
| NS-47 Cultural background | CHANGES | F11, F13, F15, F5 (P1s), F20 (P2). The no-request, one-reader and sign-out rows stay. |
| NS-48 Notification catalogue | CHANGES | F4 and F14 (P1: key out of the payload; no occasion key in the backup), F5 (the placeholder is not built). Volume and rule rows stay. |
| NS-49 Picture-first and suggestions | CHANGES, with two P0s that hold the `EXPO_PUBLIC_SUGGESTIONS` flag and the entitlement | F1 (claim wording), F2 (scan), F7 (17.0 and 17.1 launch), F6, F8, F9, F10, F17, F18. Level 1 and the first-class start are not blocked; level 3 stays closed. |
| NS-50 Home today | CHANGES | F16 (snapshot rule, P1), F3 (in-memory flag, shared with NS-46-R29). Rest stays. |

I would not give BLOCK to any card: each flaw is a row-level wording or test fix, and no card adds a server write, a permission, a secret or a new egress path.

## 6. Questions for the founder (each with a default)

| Id | Question | Default |
|---|---|---|
| Q-SEC-1 | With App lock on, should every day note show the one neutral title, public days included (F12)? | Yes. If you prefer N-3 as ruled, the Veterans Day, Memorial Day, Juneteenth and MLK Day names do not go on a lock screen. |
| Q-SEC-2 | May Apple's suggestion title be saved into the letter's photo words only when the parent taps to use it (F9)? | Yes, explicit tap; never saved by default. |
| Q-SEC-3 | If the spike cannot weak-link the Journaling Suggestions framework, raise the iOS floor to 17.2 or keep the start off (F7, Q-PHS-2)? | Keep 17.0 and keep the start off until the spike proves weak linking; do not ship the framework into a 17.0 build without a launch run. |
| Q-SEC-4 | Should turning App lock off ever bring the day-name switch back on by itself (F11)? | No; it stays off until the parent turns it on. |
| Q-SEC-5 | Should the Home slip and landing name a faith day to whoever holds the unlocked phone even when the day-name switch is off? The card says yes ("the parent's choice", NS-50 section 17). | Yes, leave as drawn; the claims say only "not on the lock screen unless you turn it on". |

## 7. Sources and honesty notes
- Apple facts used: A1 (system notification opens a universal link with the id, empty for a general reminder, entitlement needed to present the picker, universal link required for `JSNotificationURLFormat`) and A2 (picker in a system process; "only the details of the chosen suggestion"; consent sheet once per device; the item table; "suggestion data requires careful handling"; the picker fails without the entitlement). Expo: E1 (`previewPlaceholder`, category identifier characters). Read 20 Nov 2026; E1 only in part.
- UNVERIFIED and not asserted: weak linking by default; the file URL's owner and lifetime; eager versus lazy loading of items; Exif in the suggestion photo; hidden-preview title behaviour; the pending-notification cap; the Vercel log treatment of the path; Apple's entitlement approval; the Developer Program License Agreement duties (counsel).
- Every legal or store reading here: counsel must confirm. I am a Claude role, not counsel.
- Wrote only this file. Did not commit, push or post.
