# Days, planner and the notification catalogue: engineering design, part 2 of 5

Status: Proposed, 20 Nov 2026. Author: `mobile` (Claude session) for Karma, task RD-I2. Target: `docs/tdd/new-scope/14-days-planner-and-catalogue.md`. Continues `13-days-culture-home.md` (decisions DD-n, Conflicts C-n, the days data and the store). Same sources, tags and rules as file 13 section header. Words a parent reads are content keys marked PROPOSED; the founder approves words.

## 1. Planner kinds, the registry and the one-a-day chooser (NS-46-R4, R7 to R10, R29 to R33; NS-48-R2, R24, R26)

### 1.1 What is built
- **Fact** `PlannedKind = 'evening' | 'monthAge' | 'birthday'` (`planner.ts:111`); ids `el.<kind>.<date>` (`ID_PREFIX = 'el.'`, `planner.ts:131, 334, 365`); the evening loop skips a date only if a month or birthday note holds it (`planner.ts:357`), which is the whole of today's "one a day"; the final cut is `sort(fireAt).slice(0, max)` with `max` 60 (`planner.ts:295, 378`) [V].
- **Fact** Plan notices are a second scheduler (`apps/mobile/src/lib/billing/`): ids `plan.` (`lib/billing/plan-reminders.logic.ts:50`), cap 4 (`:48`), no shared budget. Our scheduler cancels only its own (`scheduler.ts:148`) [V]. So "one a day is enforced nowhere" (`21:343`); the property test NS-46-R30 fails on `develop` today for a birthday in book A and a month day in book B (`11-foundations.md:75`, R1b).
- **Fact** A tap routes `evening` to Home and everything else to the Book (`scheduler.ts:257`); the payload is `{ source, kind }` (`scheduler.ts:159`) [V].
- **Fact** Birthday time is 09:00 (`BIRTHDAY_TIME`, `planner.ts:139`); the window is 07:00 to 21:30 (`planner.ts:135`, `clampReminderTime` `:177`) [V].

### 1.2 The registry (one module, two jobs; Conflict C-1 resolved)
`lib/reminders/budget.ts` (owner `mobile`; the file NS-32 PR (a) creates, `11-foundations.md:78`):

| Source (`PlannedKind`) | Group | Rank (lower wins a date) | Backed off by NS-13 | Owner |
|---|---|---|---|---|
| `plan` (plan notices) | `plan` | outside the budgeted list, counted first | no | `payments` |
| `typedDay` | `typedDay` | 1 | no (NS-13-R29, NS-32-R9) | `mobile` (NS-18) |
| `birthday` | `birthday` | 2 | yes | `mobile` |
| `libraryDay` | `typedDay` | 3 | no | `mobile` (NS-46) |
| `monthAge` | `monthAge` | 4 | yes | `mobile` |
| `evening` | `evening` | 5 | yes | `mobile` |

The order is the DL-2 order (a day the parent typed, birthday, library day, month, evening; `21:42, 268`). `libraryDay` is a row of the registry's `typedDay` group with its own rank, not a new class, so `PlannedClass` gains no member and the "rejects an unregistered class" test stays green (NS-46-R29, N-2; `21:118, 290`). Rank is data, so priority is not coded twice (`21:290`). The back-off module of `09-capture.md:43` reads the `Backed off` column (`BACKOFF_CLASSES` becomes a derived list, not a literal).

### 1.3 `chooseOnePerDay` (the only place the rule lives)
```
chooseOnePerDay(candidates: Candidate[], planPending: number, max = 60): { kept: Candidate[]; dropped: number }
Candidate = { source, date: 'YYYY-MM-DD', fireAt, payload }   // payload opaque to budget.ts
```
1. Group by local `date`. Keep the candidate with the lowest rank. Merge same-source candidates for one date into one with a list (two children's month day: `monthNoteCopy` today does this by key `kind:date`, `planner.ts:319-322`; two library days: one note, neutral title, both names after the tap, NS-46-R8; three or more joined by the content layer's list format, NS-46-R39).
2. A birthday and a month note for different children on one date become one note, birthday wins (`11-foundations.md:75`).
3. Sort by `fireAt`, then id. Cut to `max - planPending`, nearest first; later ones return at the next re-plan (Q-QA-4, CL-045; `21:270`). `planPending` is never cut: plan notices are first within 60 (E13).
4. Pure: no clock, no store, no Notifications import. A fast-check style property test (file 16 section 1 item 3) over random plans asserts no date holds two kept candidates and `kept.length + planPending <= 60`.
`planReminders` becomes: gates, then candidates from each source, then `chooseOnePerDay`, then copy. The evening loop stops skipping `noteDays` (`planner.ts:357`); the chooser does it. The planner gets `PlanInput.planPending` and `PlanInput.days: DaySlot[]` (below).

### 1.4 Day sources, gates and identifiers
- `DaySlot = { date, kind: 'libraryDay' | 'typedDay', titleKey, bodyKey, tone, childId | null }`: produced by `lib/days` (`render.ts`, section 2) and by NS-18's module; the planner never sees a day id, tradition or name (NS-47-R11). The planner resolves the two keys to strings from content at plan time; keys never reach `data`, `identifier`, `threadIdentifier` or `categoryIdentifier` (NS-46-R32, NS-48-R31).
- Identifier `el.day.<isoDate>` for both day kinds (one per date by construction). **Rec**; NS-18 owns the typed-day id (OQ-P1: default the same, so a re-plan that changes the winner on a date changes only `data.kind`, not the id).
- Day-only gate (NS-46-R31). **Two gates exist today and both must change.** (1) `planReminders` returns `[]` when `!prefs.enabled || prefs.paused` (`planner.ts:291`). (2) `currentPlan` in the scheduler returns `[]` for the same condition, then for permission not granted (`scheduler.ts:135-137`), and `apply()` then cancels every scheduled note of ours [V]; so a correct planner alone would still send nothing when Reminders is off. Design: `planReminders` gates only the three classes on `prefs.enabled && !prefs.paused` and always runs the day sources; `currentPlan` becomes: permission not granted returns `[]`; otherwise `intendedPlan(now)`, which already returns only what the planner allows. The preview path `intendedPlan` (`scheduler.ts:118-127`, used by `nextReminder` and the Reminders page) passes the same `days` input so "Next" and "How it will look" equal what arrives (NS-48-R22); with Reminders off the page shows the one calm days line, not a Next line for a day. Files: `planner.ts` AND `scheduler.ts` in PR B8 (file 17). Reminders switched off still sends ticked days (D W-G7; CL-026). **OQ-P2** (product): does `prefs.paused` (a rough-patch pause) also stop days? Default yes: a paused family gets nothing, because a Mother's Day note in a hard time is the harm the pause exists to prevent; the card is silent.
- Quiet, hidden, "Include in my reminders" off, `celebrations_paused`: a library note is planned only for a child that is included and not quiet; with every included book quiet or hidden none is planned (NS-46-R25, R49). **Fact** `PlannerChild` already carries `included` and `quiet` (`planner.ts:303-304`). `celebrations_paused` is server-held L3: **Unverified** that it reaches the phone (PD2 section 5, Q-E10); default: the day module reads it only if `child_member_prefs` already syncs it to a local column, else R49 is a gap row and the PR carries a `GAP` status (file 17).
- Subject child of `{child}` in a neutral body: the active book's first included, not quiet child; an expecting-only book uses the nameless line (as typed days do, `21:252`).

### 1.5 Horizon and the ceiling (NS-46-R10, R9; Conflict C-2)
Library days plan 366 days ahead inside the 60 cut (CL-027); a parent who does not open the app for a year may have far days not pending, said plainly on C-S24 (content key `days.farDays.line`, PROPOSED). The 35-day horizon is NS-13's evening policy and does not apply (RV-4). **Rec** `planPending` is read in the scheduler from `getAllScheduledNotificationsAsync` (`scheduler.ts:146`) by counting identifiers that start `plan.` (`PLAN_ID_PREFIX` in `lib/billing/plan-reminders.logic.ts`), and the plan-notice scheduler asks for a re-plan after it schedules (a one-line hook, owner `payments`; Risk R-2 in file 17). Between the two events at most 60 + 4 = 64 stay pending, which is why 60 total leaves the race harmless.

### 1.6 Tap, landing and re-plan
- Routing: `scheduler.ts:257` becomes a lookup: `evening`, `libraryDay`, `typedDay` to Home; `monthAge`, `birthday` to the Book (NS-46-R32, NS-13-R9). A cold-start tap behaves like a warm tap: the `landing.ts` hook of `09-capture.md:57` reads `getLastNotificationResponse()` once; on a library-day tap it routes Home and clears it. No route parameter holds a day. Home finds the day by the phone's local date against the store (NS-46-R32); a later date or an unreadable store opens plain Home, no line, no message.
- Re-plan triggers (NS-46-R33, NS-32-R16): store bus (`store.ts:245-253`), `subscribeDays`, foreground, time zone change, clock change. **Fact** the scheduler today re-plans on the store bus and on the `AppState` `change` listener only (`scheduler.ts:248`); `deviceTimeZone()` is read at plan time (`:52, :121`) and there is no zone-change or clock-change listener [V]. Design: the foreground handler compares `deviceTimeZone()` and the local date with the last plan and forces a re-plan when either differs (no new native listener; a zone change while the app is in the background is caught at next foreground, and iOS fires floating triggers by local wall time meanwhile, section 5 of file 13); first launch after an update (`app.lastPlannedVersion`, `11-foundations.md:67`), and a remote-config change through `onManifestUpdated` (`lib/remote/index.ts:150` [V]) so a pause cancels pending library notes within the same debounce. Target: re-plan within 1.5 s of a tick or an untick (NS-46-R33).
- Untick, Clear all, pause: the next re-plan cancels pending; Clear all and sign-out also dismiss delivered library notes at once (NS-47-R15, R21).

## 2. The lock-screen render (NS-47-R12, R13, R36, R38; NS-48-R9)

Pure function `renderLibraryDay(input) -> { titleKey, bodyKey }` in `lib/days/render.ts`; keys only.

| Input | Value |
|---|---|
| `publicTitleOk` | the hand-list of NS-46-R36 (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) |
| `tone` | `bright` or `quiet` |
| `appLockOn` | live read (`appLockOn()`, as `prefs.ts:118`) |
| `dayNamesOn` | effective `stored && !appLockOn` |
| `count` | 1, 2, 3 or more days on the date |

Rules (all of NS-47-R12, R13):
1. App lock on: title is `days.lock.title.neutral`, whatever else is true.
2. Else if `count == 1` and `publicTitleOk` and tone is `bright`: title is the day's own name (`days.name.<id>`); this key family is resolved inside the days module only.
3. Else if `count == 1` and `dayNamesOn`: title is `days.name.<id>`.
4. Otherwise: `days.lock.title.neutral` (`count == 2` or more: `days.lock.title.twoDays`, which is also neutral).
5. Body: `days.lock.body.neutral` for `bright`, `days.lock.body.quiet` for `quiet` (NS-46-R37); the same string for every layer and never a day name.
6. If the title holds a day name, the body is rendered in its neutral-child form (`{child}` replaced by the fixed neutral rendering, NS-48-R13), even when names are on, so no string holds a day name and a child name (NS-47-R38; **Conflict C-7 inside the card**: the neutral body `21:600` uses `{child}`, and rule 2 or 3 plus names on would put both in one lock-screen string. Pick the neutral-child form; `content` words it, a key `days.lock.body.neutral` has two renderings as every NS-48 variant does).
7. The `{day}` slot never renders in a body (NS-47-R12).
`quiet` days never have `publicTitleOk` true (NS-46-R36). The snapshot test enumerates every `days.*` key by all four combinations of `dayNamesOn` and `appLockOn`, by names on and off, by count 1, 2, 3 (`[NS-47-R13]`, `[NS-47-R38]`).

**Categories (NS-47-R36, NS-48-R16).** One category `reminder` is registered by NS-32 PR (c) (`11-foundations.md:65, 80`) with `previewPlaceholder` from the PROPOSED key `reminders.previewPlaceholder`; library and typed day notes use it. No category sets `hiddenPreviewsShowTitle`; a test reads the category options (`[NS-47-R36]`). Each request sets `interruptionLevel: 'active'` (never time-sensitive, NS-46-R10) and `categoryIdentifier: 'reminder'`. **Fact** expo-notifications 57.0.21 types both (`09-capture.md:34`). **Unverified** whether a hidden title still shows on Apple Watch, Notification Summary and CarPlay: device walk J-CUL-01 (file 16).

**The day-names switch.** `notifications.dayNames` (settings, L3, default off). Effective value `stored && !appLockOn`; turning App lock on writes `off`; turning it off never writes `on` (NS-47-R12). The switch row lives on C-S24 under the list, shown only when a day is ticked, disabled with a reason while App lock is on (the built `.appLock` pattern). Typed-day words follow it (NS-47-R37, errata row for NS-18-R3, Karma). `notifications.lockScreenNames` covers the child's name only (NS-13-R6a, `21:134`).

## 3. NS-48: the notification catalogue (drop A phase 1; layers in C)

### 3.1 What is built and what changes
**Fact** Eight evening variants rotate by `slotOrdinal(date, weekdays) % 8` (`planner.ts:360-363`; `VARIANTS`, `namedSlotIndex`); named and neutral are two parallel sets; the built titles "A letter tonight?", "The house is quiet", "Before you sleep" ignore the reminder hour (`21:757`). No category or interruption level exists (`21:757`).
**Design.**
- `packages/core/src/notification-key.ts` (PROPOSED path, `21:635`): `selectNotificationKey(cell, ordinal): string`. `cell = { tone, band, dayPart, namesShown, lastKind?, ageBand?, chosen? }`. Pure, total (never throws, never returns empty: the floor answers every cell, NS-48-R15, R33), deterministic, stateless: no stored last key, so a store write never rewrites every pending note (NS-48-R32; RV-14; `planSignature` is stable, `planner.ts:382`).
- Resolution order (NS-48 section 3 item 3): chosen day or season, then last-letter layer (r1 and r2 only), then the weekday by recency grid, then the built eight (the floor). A cell that is thin falls through; a pool of n variants gives n distinct keys in n consecutive slots (NS-48-R14).
- The seam: `planReminders({ ..., select })` takes a function; the default is the catalogue selector, the test injects a floor-only selector (NS-48-R2). The planner needs no other change for catalogue on or off: the set of `(id, date, time, class)` is the same.
- `daysFromAnchor` (recency, NS-48-R3) is `fireDate - anchorDate` in days, bands r1 (next day), r2 (2 to 6), r3 (7 to 14), r4 (15 to 35), computed at plan time from the NS-13 anchor `lastMadeAt` (`09-capture.md` section 1.3, PR 3); the anchor is the newest made letter's `captured_at` date in the phone's zone, clamped to the plan date, never `occurredOn` (NS-48-R3). Drop C layers need `lastMadeLetter()`: one query (newest by `captured_at`, own author, `kind != not_much`) over the existing indexes (`entries_child`, `migrations.ts:120`; there is no `captured_at` index, and a new index would be a local migration and an L-number, which this design does not take: the Node bench on the 1,200-letter fixture decides; if it fails, the index is a separate data-steward PR, not part of this one) returning date and kind (NS-48-R27); `first` reads `none` until NS-06 supplies a flag; a 1,200-letter fixture re-plan stays inside the FR-REL-32 budget (Node bench, 10 ms proxy as `09-capture.md` section 1.7).
- Day part: variants tagged `evening` are dropped before 17:00, including the built eight; each (cell, hour in the window) has an eligible floor variant (NS-48-R12, R15, R33).
- Names: no `{child}` slot in a new title (NS-48-R11); one text per variant with fixed neutral rendering (`{child}'s` to "the", `{child}` to "your little one", override allowed; NS-48-R13, R35); names off or App lock on: no child name anywhere (default off, D-025).
- Kind in body only, title from a pool of at most six shared titles (NS-48-R5, R29); `picture` is not a kind (RV-2); `first` and `small` only with names on and App lock off.
- Date and weekday render in English, `gregory`, Latin digits whatever the phone's language (NS-48-R34, FR-LOC-11); a test runs the catalogue under `hi`, `ar`, `en-u-ca-islamic`.
- Pregnancy: a book with a due date and no birth date gets only the neutral evening line on the lock screen; before-birth variants exist in the unlocked preview only (NS-48-R36).
- Preview: D-S06 "How it will look" and "Next" call the same selector as the planner (NS-48-R22, R39); no new switch.

### 3.2 Content keys (PROPOSED; `content` writes, founder approves; none is final)
`packages/content/src/features/notifications.catalogue.en.ts` (new) exports under `en` and joins `rules.test.ts`'s `ALL` and the notification scope. **Fact** `index.ts` exports no `days`, `culture` or `ntc` family today (`21:716`), so the rules test would read none: PR N1 adds the drift test first (NS-48-R28, `[NS-48-R28]`).
- `ntc.grid.<tone>.<band>.<nn>` (5 tones by 4 bands = 20 cells, 6 variants each = 120).
- `ntc.kind.<kind>.<ageBand>.<nn>`, `ntc.titles.generic.<nn>` (at most 6).
- `ntc.occ.public.<nn>`, `ntc.occ.family.<nn>`, `ntc.occ.neutral.<nn>`, `ntc.season.<name>.<nn>` (4 per day, 3 per season; DL-5).
- `days.name.<id>`, `days.lock.title.neutral`, `days.lock.title.twoDays`, `days.lock.body.neutral`, `days.lock.body.quiet`, `days.landing.bright`, `days.landing.season`, `days.landing.quiet`, `days.picker.around`, `days.picker.whichDate`, `days.nextYear.line`, `days.farDays.line`, `days.door.line`, `days.empty`, `days.close.notToday`.
- `culture.ask.question`, `culture.ask.choose`, `culture.ask.notNow`, `culture.callout`, `culture.picker.tradition.header`, `culture.notInSaveCopy`, `culture.signOut.line`, `culture.delete.line`, `culture.clearedNote`.
- `notifications.dayNames.switch`, `notifications.dayNames.help`, `notifications.lockScreenNames.help` (reworded to child only), `reminders.previewPlaceholder`.
- `features.photos.suggestions.{start,door,choose.title,noPhoto,pickInstead,label.fromPhone,journalNote}` (file 15).
Launch floor is about 128 variants (the 120 grid cells' share plus the built eight at the end of phase 3); the rest are content drops (NS-48-R18). Retirement of a variant is by one report and by removing the key (NS-48-R17).

### 3.3 Phases (each one PR-sized content drop that passes the rules test alone, `21:810`)
| Phase | Needs | Rows |
|---|---|---|
| 1 (drop A) | nothing built | R6, R12, R13, R15, R16 (with categories), R23, R24, R28 to R33; built eight re-keyed |
| 2 | NS-13 anchor and back-off (`09-capture.md` PRs 3, 4) | R3, R4 |
| 3 | `lastMadeLetter()`, NS-06 flag | R5, R27 |
| 4 | NS-46 (this design) | R8, R9, R19 occasion layers |

## 4. Flags, pauses and kill switches (ruled names only)
| Name | Kind | Source | Read where |
|---|---|---|---|
| `EXPO_PUBLIC_DAYS` | local build flag (PROPOSED family, E20) | `21:339`; `LocalFlag` pattern, `architecture.md:123` (AP-1), `capabilities.test.ts:242` pins the list | `lib/days/flag.ts` (surface rule only); off by default in a servers-off profile (RV-10); `on` in a release profile only after counsel L-1 to L-3 (SECQ C-10) |
| `killSwitches.libraryDays` | remote pause, one boolean, fail-open | CL-021, NS-46-R28 | added to `KILL_SWITCH_KEYS` and the signed-config schema (`packages/api/src/kill-switches.ts:10-35`); an older config parses as off (`M14_KILL_SWITCH_KEYS` pattern, `:38-39`); header updated (E21); read outside `mayRun` (`capabilities.ts:258-268`, which also needs the build flag on) |
| `EXPO_PUBLIC_SUGGESTIONS` | local flag, narrows only | `21:948`, NS-49-R14 | inside `EXPO_PUBLIC_PHOTOS` |
| `EXPO_PUBLIC_PHOTOS`, `killSwitches.photos` | existing (NS-01) | NS-49-R14 | unchanged |
There is no flag or pause for NS-48 (variety is not a setting, `21:753`) and none for NS-50 (it follows NS-46's). Erase, export and sign-out clear never read a flag (LEGAL-REQ-040, AP-6). A hostile signed config can only hide, never enable (FR-SEC-16; SEC2 row T). The vocabulary PR also carries `signIn` if CL-111 still lists it; that key is not designed here. Fail-open means no config: the library stays on if the build flag is on; in a servers-off build the pause is honoured only when a manifest could be fetched, so the flag stays off by default in that profile (NS-46-R28).

## 5. Offline, failure and standing states
| State | Behaviour (NS-46-R42 one parametrised test) |
|---|---|
| Offline, outage, servers off | All local; the pause cannot be delivered (RV-10) |
| Plan lapsed, signed out, second account | No effect; free (NS-46-R27); the store was cleared (file 13 section 4.5) |
| Reminders off | Ticked days still plan (NS-46-R31); Me, Reminders and Me, Days each say so in one calm line (NS-46-R35, key `days.remindersOff.line`) |
| Notifications not allowed | Ticks stored, nothing scheduled, one line, no promise; the first tick makes the one iOS ask after one sentence through the ask door, final on refusal (`asks.daysPermission`, NS-46-R31, CL-026); the Days ask slip is not shown while denied (NS-47-R19) |
| iOS refuses to schedule | The built failure line (`D-S06.error-schedule_failed`); no day state changes |
| Store unreadable or the exclusion false | `days_store_unavailable`: typed days still show, one in-place line and Try again, no red (NS-46-R40); no library note planned |
| Table has no date for next year | Nothing planned for that day; one calm line, no count (NS-46-R15) |
| Removed id after an update | Dropped silently (NS-46-R43) |
| Pause on | Library, Browse and ask slip gone at next focus; typed days and reminders unchanged (NS-46-R28) |
| Clock or time zone change, restore, update | Full re-plan (NS-32-R16); `lastSignature` starts null each run (`scheduler.ts:45`) |
Local error code: `days_store_unavailable` only (`21:340`); modules return `{ ok: false, code }` (AP-9, `architecture.md:131`); the UX suffix is `<screen>.error-days_store_unavailable`.

## 6. Performance and budgets
- Plan a year of ticked days: under 50 ms on an SE 3 (ASSUMED, `21:313`); Node proxy 0.8 to 1.9 ms per plan was measured by the mobile review (`21:240`); no CI wall-time assertion; a `human` device-check row in the NS-34 run sheet times `apply()` in a development build (numbers only).
- Cold start p50 1.2 s, p90 2.0 s, warm p50 400 ms: nothing here is awaited at launch. The days table and store are read only inside the re-plan (`scheduler.ts:263` stays `void`) and by Home after first frame (file 15). Checked by a Node test that `lib/days` is not in the launch import graph (file 16 section 1 item 8, PX-2); measured on a phone by the NS-34 run sheet.
- Browse sheet opens in under 300 ms (06-nfr default; device row); tap to Home within 2 s on an SE 3 (NS-46-R13, NS-13-R9; device row).
- Catalogue selection adds no I/O (NS-48 section 8): a micro-benchmark of 366 selections under 5 ms [E].

## 7. Open questions (this file)
- OQ-P1 Typed-day identifier shared with `el.day.<date>`. `mobile` with NS-18 owner; default shared.
- OQ-P2 Does `prefs.paused` stop day notes? Product; default yes.
- OQ-P3 Neutral-child form of the neutral body when the title holds a day name (Conflict C-7). `content`, Karma; default as rule 6.
- OQ-P4 Should the plan-notice scheduler call a re-plan hook (owner `payments`)? Karma; default yes, one line.
