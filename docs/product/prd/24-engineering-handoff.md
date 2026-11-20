# 24. Engineering handoff: architecture, ADRs, conflicts, build order and open questions for NS-46 to NS-52

Status: CURRENT, 20 Nov 2026, owner `principal-architect` (hands to Karma and the engineering agents).
Replaces: nothing in full. It supersedes only these older statements, listed with the exact in-place edit in section 7: `docs/ARCHITECTURE.md:71` (photos in server Storage), `:64`, `:118-129` (the on-device versus server table has no row for days, culture, notifications or a library index), `docs/adr/0016-lean-app-and-server-driven-content.md:127-129` (switches stop only server features), `packages/api/src/kill-switches.ts:1-8` (same claim), and the claim in cards and GAP-LOG that "ADR 0029" exists (it does not).
Load when: building the days, catalogue, culture, pictures or Home today work (NS-46 to NS-52).

This file cites; it does not hold architecture text that lives elsewhere. Where a card, ADR or code file is the home of a fact, it is linked by file and row id. Docs only. It changes no card, files no ADR and records no decision. Where it and a card differ, the card wins (CR-66; note that CR-66 names cards `01` to `12`, so cards 19 and 21 are not yet inside its precedence list, see C-19). Nothing is legal advice.

Sources read this session: PRINCIPLES.md; `docs/ARCHITECTURE.md` (not re-read line by line, UNVERIFIED for anything not cited); ADRs 0004, 0016, 0017, 0023, 0024, 0025, 0027, 0028 (0016 section 5, 0028 D1 to D4 read); `docs/agents/cto/RULINGS.md` CR-62, CR-63, CR-66; `docs/agents/exec/COUNCIL.md`; `docs/DECISIONS.md` D-159 to D-162; `docs/BACKLOG.md` BL-958 to BL-967, BL-982, BL-985, BL-987, BL-999 note; `docs/engineering/plans/locked-pack-plan.md` and `inputs/C-platform-quality-delivery.md` section 1.4 and 2.1; `13-`, `14-test-plan.md`; cards 21 and 22 in full, 19 not re-read; GAP-LOG K1 to K17, R-IA, N-, CB-, DL-, RV-1 to RV-17; the reviews `ns46-50/{mobile,security,privacy,analytics,qa}.md`; `26-founder-direction-photos-library-and-media.md` (commit f8eead016).

Not available: cards NS-51 and NS-52 (`27-photo-moments-and-media.md` is being written; not on this branch), `docs/tdd/new-scope/` (CR-66 names it; the directory does not exist on this branch), `docs/product/prd/17-engineering-project-plan.md` (read from PR #847 head, below).

Code read on branch `docs/locked-pack-inputs-20nov` at `cfeca754e`/`f8eead016`, whose merge base with `develop` is `4f89d659b`; `develop` is now `51aa84b2e`. So `entry_media`, `bookVisibleTo` (#869) and Find's flags are not in this tree. "Built" below means built in this tree. Everything not read in code this session is marked UNVERIFIED.

GitHub, read-only, 20 Nov 2026 17:08 to 17:14 UTC. `gh pr list --state open --json ...` failed: `HTTP 403: GitHub GraphQL is not available from Claude Code sessions`. REST worked: `gh api repos/thesaurabhpareek/earlyletters/pulls?state=open&per_page=60`, `.../pulls/<n>`, `.../pulls/<n>/files`, `.../contents/<path>?ref=<branch>`. Facts about PRs below are from those calls at that time and go stale.

Test layers use `14-test-plan.md` section 2: Unit, Integration, Source checks, Content rules, Journey, Device.

---

## 1. Architecture view per capability

Each item: what it is, where it lives, what is built (path:line), what is missing, the rows it serves, tests.

### 1.1 Library days store and yearly planner source `libraryDay` (NS-46, NS-47)
- Rows: NS-46-R4, R5b, R6, R9, R10, R11, R25, R29, R30, R31, R33; NS-47-R1, R6, R11, R28; CB-1, CB-2, DL-2, DL-6.
- Split by CODE-R10 and CODE-R13: the rules (fixed, nth weekday, computus, astronomical instant to local date) are pure TypeScript in `packages/core` (new `days.ts`), with `DayLayer` and `DayTone` enums defined once in `packages/core/src/domain.ts`. The data (rows, authorities, `publicTitleOk` allowlist, `days.excluded`) is `packages/content/src/days/` (card 21 section 10, NR-DAY-01). The phone side (store file, change event, planner feed) is `apps/mobile/src/lib/days/` (name PROPOSED; the card says "the days module" and names no path). The table is imported lazily so Home and cold start never parse it (A-NFR-001, mobile M-24).
- Planner: `PlannedKind` is `'evening' | 'monthAge' | 'birthday'` (`apps/mobile/src/lib/reminders/planner.ts:106`). Add `libraryDay` and `typedDay` plus a `group` field so priority is data (mobile M-25). Ticked days are stored as ids and overrides, never a copied date (NS-46-R6), re-resolved on every plan. Horizon 366 days inside the ceiling (Q-FD-22); today's month and birthday horizon is 92 days (`planner.ts:88-89, 289`) and evening is NS-13's 35 (RV-4).
- Gate split: `planner.ts:286` and `scheduler.ts:136` return nothing when `!prefs.enabled || prefs.paused`, and `scheduler.ts:136-138` reads permission after that. Day sources need their own gate and a first-tick permission ask through one `turnOnReminders`-style door (NS-46-R31, RV-9). Permission is asked only at `scheduler.ts:293-310` today.
- Ceiling: `planner.ts:90` max 60 plus `MAX_PLAN_NOTIFICATIONS = 4` (`lib/billing/plan-reminders.logic.ts:47`) is 64 today; E13 rules 60 in total, plan notices first. The final `.slice(0, max)` at `planner.ts:368` drops the latest-dated, which with a 366-day horizon drops next year's days first (acceptable, NS-46-R9, Q-QA-4); `budget.ts` must take the plan-notice count as an input.
- Missing: everything. `grep libraryDay|chooseOnePerDay|chooseSlip|dayNames` over `apps`, `packages`, `supabase` returns nothing.
- Tests: Unit (calendar oracle 2026 to 2030, NS-46-R12; `daysDueOn` with injected today, R24; property test, R30); Integration (planner with fixtures `zz-test-day-a`, never a real tradition with Asha); Device (NTC-T24 one week of reminders, time zones, J-CUL-01).

### 1.2 One-a-day budget chooser `budget.ts` (NS-46-R30, NS-32, BL-966)
- Pure `chooseOnePerDay(candidates, planNoticeCount)` in `apps/mobile/src/lib/reminders/budget.ts`, no React Native import. It is the only place the DL-2 order lives: typed day, birthday, `libraryDay`, `monthAge`, `evening`. It merges same-kind notes for several children and two ticked days into one. Today the rule exists only as evening yielding at `planner.ts:350` and keys `${kind}:${date}` at `planner.ts:320-338` (two notes can already land on one date, mobile M-01).
- A second scheduler exists: `lib/billing/plan-reminders.ts` with ids `plan.` and its own cap. `budget.ts` sees it only as a count. Do not merge the two schedulers in this scope.
- Quiet reader: `Child.quiet` has no reader (`lib/reminders/prefs.ts:115-117` maps only `remindersOn`; the comment at `lib/store.ts:388` says the planner reads it, which is false). BL-985 builds the Me control, E16 asks for the planner reader. Recommended shape: `PlannerChild.included` is false for a quiet book so the planner stays free of the quiet concept (mobile M-12).
- Tests: Unit property test, no date holds two budgeted notes; `[NS-32-R1b]` two books, a birthday and a month note on one date; Integration two ticked days one date.

### 1.3 Home slip host and registry (NS-50, BL-963, COMPONENTS C9)
- Built: none. `apps/mobile/src/app/(tabs)/index.tsx:305-325` renders every waiting draft as `DraftCard` (or one `HeldRow`), else one resurfaced card, plus the Plus line. `grep SlipCard|FRAME-SLIP` finds only docs.
- Shape: a pure `chooseSlip(state, today)` over an ordered data registry: (1) waiting set, (2) seal opened, (2b) a day the parent chose, today, (3) Save a copy, (3b) the Days ask, (4) one past letter (NS-50-R5). An unregistered type throws in development and test; `[FRAME-SLIP]` fails the build. Absent ranks must be accepted so 2b and 3b can ship before ranks 2 and 3 (BL-963 depends on NS-06 and NS-11 for those).
- The day slip reads the days module read-only and shows a day only when it is today (NS-50-R2 to R4, RV-6). "Not today" stores a date value, never a day id (card 21 NS-50 section 10). The Days ask joins `lib/asks/next-ask.logic.ts` (`MAX_REMINDER_PRIMES = 2`, `:20`; session gap `ASK_SESSION_GAP_MS`) and counts as that day's ask (mobile M-15).
- Snapshot: `components/app-lock/privacy-cover.tsx` draws only under the lock layer; E18 and NS-50-R9 need a blank-on-background rule for Home and Me with or without App lock.
- Tests: Unit registry order and the stub-slip test; Integration Home with three waiting drafts (R11 as worded would fail, mobile M-13); Source check no slip count or list; Device snapshot blank.

### 1.4 Notification catalogue selection (NS-48)
- Pure function `selectNotificationKey(cell, slotOrdinal)` in `packages/core/src/notification-key.ts` (PROPOSED). Variant is a function of the cell and `slotOrdinal(date, weekdays)` (`planner.ts:212`); the "last chosen key" setting is removed (RV-14), so a re-plan on the same inputs gives an identical `planSignature` (`planner.ts:375`, compared at `scheduler.ts:144-146`).
- Today: eight evening variants rotated `ordinal % VARIANTS` where `VARIANTS = en.notifications.evening.length` (`planner.ts:139, 354`); `namedSlotIndex` is tied to the 8 (`planner.ts:230-235`); named titles carry `{child}` (`strings.en.ts:690-698`, mobile M-03). The planner gets only `lastSaveAt`; `lastOwnSaveAt` (`prefs.ts:120-131`) loops `listEntriesForChild` for every child on every store write, so the recency layer needs one indexed `lastMadeLetter()` query first (mobile M-11).
- Planner takes a `select` seam so tests inject the floor-only selector (NS-48-R2). Payload stays `{ source, kind }` (`scheduler.ts:159`); no key, variant or day in `data`, `identifier`, `threadIdentifier` or `categoryIdentifier` (NS-48-R31).
- Drop A is words only: day-part filter, weekday tone, the built 8 re-keyed, rules-test coverage. Recency and last-letter layers are drop C and need the NS-13 anchor and back-off (not built).
- Tests: Unit determinism, every key exists, no orphan (NS-48-R1); Content rules (section 1.11); Integration set of (id, date, time, class) identical with the catalogue on or off.

### 1.5 Culture store: outside `scribe.db`, backup-excluded, fail closed (NS-47)
- One versioned file in Application Support (not Caches), with the exclusion set and read back at create and open, a protection class no weaker than SEC-R15's (`app.config.ts:92-93` sets the data protection entitlement), atomic write (temp then rename), a refusal to write when the read-back says false, and fail-closed on a corrupt or unreadable file with the local error `days_store_unavailable` (NS-47-R6, R28; privacy F2, security F15).
- Primitive exists: `modules/scribe-files/index.ts:11` `setExcludedFromBackup(uri, excluded)` (Swift at `ScribeFilesModule.swift:32`); read-back precedent at `lib/packs/app-support.ts:38-39` and `lib/model-files.ts:43`. It has no change bus, so the days module exposes `subscribeDays` for the scheduler and Home (NS-46-R33, mobile M-10); the settings bus (`lib/store.ts:276-278`) does not reach it.
- `culture.asked` (L2, per account) must live in `settings`, which is in the iPhone backup, so it survives sign-out while the store is cleared (privacy F1); a restored phone shows an empty list and does not ask again (Q-FD-13). `notifications.dayNames` follows `prefs.ts:109-112`, but the stored value must not return when App lock turns off (`lockScreenNamesOn()` returns the stored value again; the card forbids copying that).
- Lifecycle: cleared at sign-out and Erase (`erase-everything.ts:84` calls `forgetReminders`; the store file joins its list), delivered library-day notes dismissed at sign-out (`scheduler.ts:336-339` pattern), BL-961's `[X4-R1]` enumeration gains the store. Sign-out does not cancel reminders today (BL-967 says so; UNVERIFIED re-read).
- Import boundary: only the days module reads the store; the planner gets opaque slots (NS-47-R11). Migration lint matches whole words in column, key and setting names with a named allowlist (`han_traditional`, `storefront`) owned by `data-architect` (qa F-15).
- Class: L4 in the registry. The home for the new row is `docs/legal/DATA_CLASSIFICATION.md` section 4.6 (device files; 4.5 is local SQLite). Card 21 says `docs/privacy/DATA_CLASSIFICATION.md` section 4.5; that path does not exist (C-15). `docs/legal/**` merges only by the founder.
- Tests: Unit (versioned file, unknown higher version never rewritten); Integration (fake exclusion returns false, 0 bytes written; corrupt file, no crash; two accounts); Source checks (import boundary, migration lint); Device (backup inspection, a device fact, qa F-17).

### 1.6 Tap routing and the `+native-intent` gate
Two different doors; do not merge them.
- Our own local notes: `scheduler.ts:254-258` `router.navigate(data.kind === 'evening' ? '/' : '/book')` in a response listener added in `startReminders()`. `libraryDay` and `typedDay` must route to Home (NS-46-R32). Cold start: the evening scheduler has no `getLastNotificationResponse()` path (the plan-notice scheduler does, `plan-reminders.ts:136`), so add one or the cold tap is lost (mobile M-08). Home finds the day from today's local date and the store, never from the payload (RV-6).
- Universal links: `apps/mobile/src/app/+native-intent.tsx` is a reviewed gate that strips secrets before routing and says links never open the microphone or a draft. Apple's suggestion notification (NS-49-R20, R21, P2, spike only) would need a fifth AASA path on the website at least a day earlier and the id stripped in `redirectSystemPath` (mobile M-21, security F6). `associatedDomains` is present only in sign-in-capable builds (`app.config.ts:250-257`), so a servers-off TestFlight build cannot receive it. Not in scope for drops A or B.
- Tests: Unit tap router per kind; Integration cold and warm tap, cleared store lands on plain Home; Source check no day id in identifier, `data` or route params (NS-46-R32, NS-47-R8); Device.

### 1.7 Kill switches and remote config, with servers-off builds
- Built: `packages/api/src/kill-switches.ts` has eight keys; `remote-config.ts:59-78` has a `KILL_SWITCHES_OFF` map and a `v.fallback` schema (so an older config parses missing keys as off). `mayRun` (`lib/capabilities.ts:266-269`) is true only when the build flag is on, and `buildFlagEnabled` is false whenever `serverFeaturesEnabled()` is off (`capabilities.ts:185-194`). TestFlight runs servers off (E20). So a pause for a phone-only feature cannot use `mayRun`.
- Pattern already exists in open PR #894 (head of the Find stack, read 17:10 UTC): `lib/find/flag.ts` (`EXPO_PUBLIC_BOOK_SEARCH`, exact string `on`, test override), `lib/find/pause.ts` (caller passes a `RemoteConfigReader`, unreadable config counts as not paused), and an additive `bookSearch` key in `kill-switches.ts`, `remote-config.ts`, `standards.ts`. #837 does the same for photos (`lib/photos/flag.ts`, `pause.ts`). Follow it for `EXPO_PUBLIC_DAYS` and `killSwitches.libraryDays`, and for `EXPO_PUBLIC_SUGGESTIONS`.
- Missing: nothing subscribes the scheduler to remote config, so a pause arriving after the foreground re-plan cancels nothing until the next write (mobile M-09). Use `remoteConfigDoc.subscribe` (`lib/remote/index.ts:132`). Update the `kill-switches.ts` header (E21): it says each switch only stops a server-dependent feature, and ADR 0016 section 5.3 says the same, which is no longer true.
- Additive only (API-R11): new key, older configs parse it as off, published config script lists server-enforced keys separately (`scripts/packs/lib.ts:217`; a phone-only key is not added there).
- Existing remote flag `flags.lockScreenNamesDefault` (`remote-config.ts:86`) must not become a path to turn on day names; the day-name switch default is off and local (NS-47-R12).
- Tests: Unit (config parse, older config, unknown key); Integration (pause arrives mid-session, pending library notes cancelled within the debounce, typed days untouched); servers-off profile test (NS-46-R42).

### 1.8 Journaling Suggestions native module, weak link, iOS 17.2 (NS-49 level 2, drop C)
- Built: `modules/scribe-photo/ios/ScribePhotoModule.swift` has `pickOne` (PHPicker, no library permission) and `reencodeUpright`; `ScribePhoto.podspec:9` says `:ios => '16.4'` while `app.config.ts:44` `IOS_DEPLOYMENT_TARGET = '17.0'`. No `JournalingSuggestions` reference, no weak frameworks (podspec grep), no entitlement beyond `DATA_PROTECTION_ENTITLEMENT` (`app.config.ts:260-262`).
- Needed: `s.weak_frameworks = 'JournalingSuggestions'`, every use inside `@available(iOS 17.2, *)`, `isAvailable()` false on Simulator, iPad, Mac and below 17.2, `pickSuggestion()` as the single native boundary returning a plain object (qa F-07), no title or date for a no-photo pick (mobile M-20), copy the file then delete only our copy (mobile M-19), capability on the App ID (Q-FD-11, UNVERIFIED whether Apple approves). Everything about the framework is from the reviews' reading of Apple pages; I did not open Apple's pages.
- Not testable in the Simulator or Maestro; launch on iOS 17.0 and 17.1 is a Device row and a build-config scan (qa F-06). Source scans cannot see a dependency's PhotoKit call, so add a binary strings read in the candidate job (qa F-08).
- Tests: Unit with the stand-in (titles say `(stand-in)`); Source checks (podspec weak link, deny list); Device (17.0, 17.1, 17.2, 26, iPad).

### 1.9 Photo pick path, level 1 (NS-49-R1, NS-01, stack #834 to #840)
- State at 17:09 UTC: #834, #841, #842 merged; #835 (migration 11, `entry_media`), #836, #837, #838, #839, #840 open, stacked in that order; #835 +775, #836 +981, #837 +718, #838 +617, #839 +592, #840 +326 added lines (REST `pulls/<n>`). Each of #835 to #839 is over the CODE-R02 400-line limit (founder's "Yes, all three" size exceptions are recorded per #847, relayed, UNVERIFIED here).
- Pick path: `startCapture({ source })` closed list in `lib/capture/start-capture.logic.ts` (`HOME_CAPTURE_SOURCES`; #838 adds the photo source). The picture start becomes a two-item menu only where level 2 exists (Q-FD-31); the `suggestion` source is added in the same PR as its handler (the file's own rule) and with NS-35-R3.
- No photo-library permission, no PhotoKit authorisation call: `NS-49-R6`, `NS-01-R22`. This stays true for `scribe-photo`; see 1.12 for how NS-51 must not break it.
- Tests: as the stack; add the NS-49 source scans to the same files.

### 1.10 Analytics allowlist changes
- Built: `packages/analytics/test/catalog.test.ts:19` `FORBIDDEN_KEY` checks property keys only, not enum values, event names or routes; `observe.ts:236` returns null unless `kind === 'evening'`; `catalog.ts:712, 726` bound `variant_id` to 0..99; `capture_started.source` is `tonight, book, notification, make_it_yours, resurface` (`catalog.ts:451`).
- Needed (all with analytics off today; they guard the day it returns): NS-47-R34 stems list plus enum-value and event-name test in `packages/analytics/test/`; NS-46-R34 four never-reported kinds (`libraryDay`, `typedDay`, `birthday`, `monthAge`) in `observe.test.ts`; `variant_id` range and no age band (analytics A-48-1, a schema bump); `capture_started.source` gains `photo` and `suggestion` only (A-49-1); never a Home slip event (A-50-2); never `reminder_suppressed` when a day note wins (A-48-3). Extending TRACKING_PLAN 6.4 to chosen days is Q-AN-5, Karma decides.
- Tests: Unit; Source check that no `insights.*` view column matches the stems.

### 1.11 Content key families and rules-test coverage (G3 words, NS-46, 47, 48, 49)
- `rules.test.ts:97-98` builds `IN_APP` from `en`, `permissions`, `features`, stories, helplines and local copy files; `packages/content/src/index.ts` exports no `days`, `culture` or `ntc` family; the notification-only rules key on paths: exclamation budget `:161`, 40/110 limit `:266-269`, rhythm scope `:296`. New files under `src/days/` or `notifications.catalogue.en.ts` match none unless exported under `en` or `features` and under those prefixes (qa F-01, NS-48-R28). Without this, the zero-exclamation and length rules pass while reading nothing.
- Add: a drift test that fails when a key family exists in `packages/content/src` and is not in `ALL`; new families `days.*`, `culture.*`, `ntc.*`, `notifications.dayNames.*`, `features.photos.suggestions.*`; neutral title and body exist once each (NS-46-R37); `VOICE.md` line 70 corrected (N-5); BRAND.md glossary rows (RV-3).
- Fixtures: no real tradition beside Asha; synthetic ids only (NS-46-R8, NS-47-R8).

### 1.12 Migrations and grants for NS-46 to NS-50: none expected
Evidence: card 21 section 10 of each card says "Migrations: none", sync none, export none. I checked the claim against the tree:
- Server: nothing syncs. `packages/api/src/server/sync.ts` has no day field, and the days store, `culture.asked`, `notifications.dayNames` and the "Not today" date are phone-only. `entries.prompt_key` is L2 and syncs (`supabase/migrations/20261002020000_data_governance.sql:1116`), so a day reminder must open an ordinary prompt and leave no day in that column (CB-3, NS-47-R5). No new table, view, sequence or function, so no `supabase/tests/grants.mjs` row and no `approve-migration`.
- Phone: local schema is at version 10 on this branch (`apps/mobile/src/lib/db/migrations.ts:393`); #835 takes 11. NS-46 to NS-50 add no local table: the store is a file, the flags are `settings` rows.
- Config: `killSwitches.libraryDays` is a schema key in `packages/api`, not SQL.
- Not "none": `child_member_prefs.celebrations_paused` is read-only server data read by NS-46-R49 (UNVERIFIED that a phone reader exists; card says read and never written). If a phone read path does not exist it is a sync-pull change and then not "none". Ask `sync` (Q-E10).
- Docs that must change with them: `docs/legal/DATA_CLASSIFICATION.md`, `docs/legal/app-store-privacy-labels.md`.

### 1.13 NS-51 Photo moments: the Photos library read path (founder direction 26, drop C, behind its own flag)
Card NS-51 is not written; the following is architecture for the direction's section 2.

What the stack cannot support yet (plainly):
- There is no library read capability anywhere. `package.json` has no `expo-media-library`, no image picker; `scribe-photo` is PHPicker only; `grep NSPhotoLibrary|PHPhotoLibrary|requestAuthorization` over `apps/mobile` finds nothing built. `docs/legal/app-store-privacy-labels.md:117` records Photos as "Not used".
- The binding rules are written the other way: NS-49-R6 and R25 ("no photo-library permission, no PhotoKit call, level 3 closed"), NS-01-R22 source scans, 22 section 4 and Q-FD-4, NX-39 R27. These rows must be reversed by a recorded ruling (direction 26 names RV-18 onward) before any code, and every source scan is rewritten, not deleted (AIE-R14, AIE-R15).
- A nudge that reacts to new pictures cannot be built as the planner works. The planner is deterministic at plan time and runs on foreground and store writes (`scheduler.ts:247-252`); `PHPhotoLibraryChangeObserver` does not run while the app is closed (UNVERIFIED, Apple behaviour not opened); there is no Notification Service Extension (grep of `app.config.ts` and `modules`, none). So a lock-screen "pictures from the weekend" note can only be planned for a future date from what the phone knew at the last open. Say so in the card.
- Second account: the shared-phone defect (BL-961, #869 merged, #871 and #879 open) is a hard dependency; a library index must be per account and cleared like the days store.

Architecture:
1. Native module `modules/scribe-library` (new), not an extension of `scribe-photo`, so `scribe-photo` keeps its "no PhotoKit authorisation" scan true. It exposes `authorizationStatus()`, `requestReadAccess()`, `presentLimitedPicker()`, `listAssetsMetadata(sinceDate)` returning only local identifier, creation date and media type, no filename, no album title, no location unless Q-PM-5 is answered; `loadThumbnail(id, size)` for in-app display only.
2. Access: ask for read-write status at the parent's act after one sentence; handle `limited` as first-class (the app works with the selected subset; no second nagging ask); `denied` and `restricted` show nothing. Info.plist `NSPhotoLibraryUsageDescription` is a new string written by `content`, read by counsel, injected in `app.config.ts`; the privacy manifest function `privacyManifest(capabilityFlags())` (`app.config.ts:263`) gains the API-reason entries (UNVERIFIED which). iCloud-optimised originals: thumbnails only, network access to iCloud is Apple's, never ours, and the index never requests originals.
3. Moment index: a SQLite file outside `scribe.db` in Application Support, `setExcludedFromBackup` with read-back, fail closed, versioned, one per account, same lifecycle as 1.5 (sign-out, Erase, import boundary, canary). Rows hold local asset identifiers, local day, counts and a cluster id. No place, no classification, no faces (direction section 1, Q-PM-6). The identifiers are device-specific, so excluding it from backup loses nothing on restore. Class is L4 until `privacy` rules.
4. Moment rule: pure function in `packages/core` over `{day, count}`; the open draft #754 `packages/core/src/moments.ts` (draft, mergeable_state clean, last updated 10 Nov, read the file header only) is a candidate base but takes a `cityKey`; remove it or default it off. Parent decisions (hide, Not now, album choice) are data applied after the function and never change the rule.
5. Nudge: neutral wording only, an existing class via the `budget.ts` chooser (so it needs a ranked `libraryMoment` source in the same group, not a new class, N-2; the direction says "one of the existing budgeted classes"). In the in-app capture area it is a rank in the slip registry or a capture-cluster item, not a strip (R-IA-3, which the direction does not reverse; ask Karma, Q-E11).
6. Never: no caption or description prefilled from a picture; no counts shown ("40 unwritten days"); no server sees the library (direction section 1).
- Tests: Unit moment rule and index file; Source checks (new scan: PhotoKit calls allowed only in `modules/scribe-library`, forbidden classification, geocoder and Vision APIs, forbidden network in the index path; #759's metadata-only AST scanner is a reusable base, draft and conflicting with develop, UNVERIFIED); Integration limited access, revoked access removes the index, two accounts; Device (limited library, iCloud-only asset, access revoked in Settings).

### 1.14 NS-52 Several pictures and videos with a letter: media storage and sync, video, metadata stripping
Card NS-52 is not written. Variants: A local only, B uploaded (Q-PM-3).

Local storage (both variants):
- Today: `entry_media` in migration 11 (#835, open) has `CHECK (kind = 'photo')`, `CHECK (ext = 'jpg')`, a `UNIQUE INDEX entry_media_one_photo_idx ON entry_media (COALESCE(entry_id, draft_id))` (ADR 0028 D1) and `photo_text` at 140 graphemes. Several pictures and any video need those constraints removed, which in SQLite is a table rebuild. Ruled (CR-64, E35): #835 merges as it is, migration 11 runs on every phone; several pictures and video land in a NEW local migration after it (named migration 12 in card 27; the number is taken in merge order) that rebuilds `entry_media`, behind its own flags, after 1.0. The rebuild is accepted: it runs when NS-52 ships, on a table that holds only pictures the parent chose.
- Files: `Library/Application Support/photos/<media_id>.jpg` is in the iPhone backup (CR-62 D1, open item 7). Video of a family in an unencrypted backup is a privacy decision for the founder, not for engineering; default to the same as pictures and say so in the label and the in-app line (CR-62 item 4).
- Export and Save a copy: 1.7.0 carries pictures; video and several pictures need a new export minor (ADR 0038 proposal) and size handling (the zip size on a phone with 6 pictures and 2 videos per letter and 1,000 letters is the FR-REL-32 fixture; UNVERIFIED, not measured).
- Delete, restore, purge: P-5 rows (NS-36-R1a to R1d); media follows the letter.

Video handling (cannot be supported yet):
- No video code exists: no `expo-video`, no `AVAssetExportSession` use, no thumbnail extraction, no duration check. PHPicker returns video, but `scribe-photo` restricts to images (`PHPickerConfiguration` filter, line 135 region; UNVERIFIED which filter). NS-01-R22 and OPP-16 said no video.
- Recommended: transcode and cap on the phone in the native module (`AVAssetExportSession`, H.264 or HEVC at a bounded resolution, 60 s cap per the direction's default, size cap), before anything is stored or uploaded; reject a longer clip with one calm line; never transcribe video sound (Q-PM-4 default off, speech is on-device only, `docs/adr/0001`). Playback needs a new player component (`expo-video` is a new dependency: licence, size, privacy manifest, SBOM and the SDK denylist check, BL-117 `chore/ci-security-scan-117`).
- App size: the lean-app rule (ADR 0016) and the bundle budget are untouched by video, but a transcoder in a native module is code to maintain; avoid third-party ffmpeg (LGPL and size, UNVERIFIED).

EXIF and GPS stripping:
- Pictures: built in the native module (`ScribePhotoModule.swift:225` `kCGImageMetadataShouldExcludeGPS: true`, header comment about MPF, GPS and embedded thumbnails; JavaScript re-checks in `strip.ts` per the comment at line 41; I did not open `strip.ts`). Reuse for every picture in NS-52.
- Video: containers carry location and creation metadata (QuickTime `mdta` and `udta` atoms; UNVERIFIED). The transcode step must write a fresh container with no source metadata (export without `AVAssetExportSession.metadata` carry-over), and a test reads the output with a parser and finds no location atom. No such parser or test exists.
- Live Photos: the still only (Apple's `LivePhoto.image` per mobile M-19); never the paired movie.

Variant A, local only (supportable now with new work, no server):
- No migration beyond local; sync keeps `entries.photo_path` null (NS-01-R15); BL-870 (server write-deny test for photos) stays valid; label stays "Photos or Videos: not collected" and must be re-checked per build; X2 not triggered because nothing leaves except by the parent's own Save a copy or share.
- Cost: loss on phone loss unless the iPhone backup carries it; an honest line is needed (D-033 pattern: "only on this phone" claims are fixed to what is true).
- Co-parent cannot see the other parent's media (no store build co-parent flow exists, D-161, D-162).

Variant B, uploaded (cannot be supported by the current stack; each item below is new):
- Schema (new migration, red-team review, `approve-migration`, applied only from CI on a tag, D-041): a server `entry_media` table (id, entry_id, book_id, author_id, kind, mime, bytes, sha256, duration_ms, width, height, storage_path, created_at, deleted_at), every column classed L1 to L4 with `COMMENT ON COLUMN` (DB-R12; hash and path of a child's picture are L4), CHECK constraints, a limit trigger (at most N pictures and 2 videos per entry, enforced server-side, not only in the app), added to the `entries` content trigger tuple and the sync column lists additively (API-R11; old builds must ignore unknown fields, parser tolerance is BL-987 and UNVERIFIED), and to `searchable_letters` never.
- Buckets: today only `entry-photos` exists (`20260930000000_scribe_core.sql:290-291`): private, 10 MiB limit, `image/jpeg`, `image/heic`, `image/png`, no video type, policies keyed on the uploader's folder `(storage.foldername(name))[2] = auth.uid()` (lines 295-304) and blocked for anonymous users (`20261003000000_security_and_family.sql:104-105`). Nothing in the server today refuses a photo upload (ADR 0028 context fact 1; BL-870 closes it); variant B reverses that promise. A new private bucket `entry-media` with a video mime list and a larger per-object limit, path `<book_id>/<entry_id>/<media_id>`, policies from book membership and role (IAM-R02, IAM-R13), not from uploader folder, so a co-parent can read. Do not widen `entry-photos`.
- Grants and access: every new table, view, function and sequence carries its own grants in its own migration and a row in `supabase/tests/grants.mjs`; allow and deny tests per role; the purge path reuses `storage_purge_queue` (`20261002020000_data_governance.sql:842, 861, 924, 930`) so a deleted letter, child or account removes the objects; the purge worker is `supabase/functions/purge-worker`.
- Signed URLs: none exist (`grep createSignedUrl|createSignedUploadUrl` over `apps/mobile/src`, `packages/api/src`, `supabase/functions` finds nothing). New Edge Function that checks membership and returns short-lived signed URLs; no URL or path in logs (OBS-R02); a kill switch (`photos` exists, `packages/api/src/kill-switches.ts`; a separate `media` key is better so pictures and video can be paused apart); its error codes in the registry (API-R09) and idempotent writes (API-R06).
- Resumable upload: not built. The outbox pushes rows (ADR 0025) and has no blob queue (UNVERIFIED re-read of ADR 0025 and `apps/mobile/src/lib/sync`). Needs a blob queue with resume, low-storage and background limits, iCloud downloads, and a standing-state test per D-state. Supabase's resumable protocol and its Free-plan limits (D-159: production stays on the Free plan) are UNVERIFIED: not fetched this session; check before costing anything.
- Transcoding on the server: not available in this stack (Edge Functions and Free plan; UNVERIFIED limits). Transcode on the phone (above).
- Quotas: a per-book and per-account byte and count quota enforced server-side with a calm over-limit state; the counts feed no analytics (direction section 3, data and finance). What Plus contains is the founder's (Q-PM-2). Free-plan storage cannot hold a family's video; cost per family per year is finance's to model, not mine.
- Encryption and sharing: recordings backup is client-side encrypted (ADR 0024) so the server cannot read; server-held pictures and video would be readable by us unless encrypted per book, which then needs key sharing for a co-parent. That is a product-and-security decision (X2, E23, red-team) before design; at rest encryption by the host is not end to end (UNVERIFIED host defaults).
- Hard gates before any bytes leave the phone: X2 (security read plus counsel read, 00-product-frame.md:85), counsel on a child's video (Q-PM-3 is "largest cost and counsel decision"), label change ("Photos or Videos" collected, then App Privacy and Terms), `privacy` and `security-architect` threat model before code (PRINCIPLES 16), BL-961 `[X4-R1]` green, the red-team's independent review of `supabase/**` (D-041).
- Recommendation: build variant A first, and design B as an additive layer behind `killSwitches.mediaSync` and `EXPO_PUBLIC_MEDIA_SYNC` (names from E38; card 27's `EXPO_PUBLIC_VIDEO` and `killSwitches.videos` gate video itself); do not choose B by default.

---

## 2. ADR drafts to be filed by engineering (not by me)

Numbers: input C reserves 0029 to 0039 (section 1.4 of `docs/engineering/plans/inputs/C-platform-quality-delivery.md`). None exists in `docs/adr/` on this branch. Cards cite "ADR 0029" as if it exists (card 21 section 10, GAP-LOG, errata E21). Use `node scripts/agents/next-id.mjs`; the numbers below are placeholders. Status for all: Proposed. Author per ownership; reviewers `principal-architect`, `security-architect`, `privacy`.

| Draft | Context | Decision proposed | From |
|---|---|---|---|
| A1. Amend 0029 (flags, kill switches, preflight): phone-only features | Two flag families (server-gated via `mayRun`, local `EXPO_PUBLIC_*`); TestFlight runs servers off; header of `kill-switches.ts` and ADR 0016 5.3 say switches stop only server features | Phone-only features use a local flag plus a pause read outside `mayRun` through an injected `RemoteConfigReader` (#894 pattern); a pause only hides; fail-open; keys `bookSearch`, `libraryDays`, `reminders`, `media` listed with their hidden states; scheduler re-plans on config change; header updated; G6 preflight lists every flag | RV-10, E20, E21, M-09 |
| A2. Amend 0032 (one notification budget) | BL-966 and ADR 0032 list classes `evening, monthAge, birthday, typedDay, plan` and say plan notices are "outside" a 60 budget; E13 says 60 in total | `libraryDay` (and later a moment source) is a ranked source inside the `typedDay` group, `PlannedKind` gains a `group` field, no class added (N-2); `chooseOnePerDay(candidates, planNoticeCount)` is pure and the only place the rule and the DL-2 order live; 60 in total with plan notices first; opaque identifier `el.day.<isoDate>`; payload `{source, kind}` only; day-only gate beside `prefs.enabled`; re-plan on `subscribeDays` | RV-4, RV-9, RV-11, NS-46-R29 to R33, E13 |
| A3. Amend 0033 (Home slip registry) | Registry lists ranks 1 to 4 | Ranks 2b and 3b, absent ranks allowed, `daySlip` and `askSlip`, one-way day display, Days ask joins `next-ask` | RV-5, RV-6, NS-50-R5 |
| B. On-device sensitive store (days, culture, and any future library index) | ADR 0028 covers `entry_media`; NS-47 needs a store outside `scribe.db` | One reusable pattern: file in Application Support, exclusion set and read back, protection class, atomic write, versioned, per account, fail closed, single reader behind an import-boundary test, cleared at sign-out and Erase; `culture.asked` stays in `settings` | CB-1, CB-4, RV, NS-47-R6, R11, R28; NS-51 index |
| C. Notification privacy | No notification category exists; `previewPlaceholder` unbuilt; identifiers and payloads are an allowlist | Every scheduled note carries a category with one neutral `previewPlaceholder` (category id without `:` or `-`), one neutral title and body per tone, day names behind `notifications.dayNames` (forced off under App lock, stored value cleared), `publicTitleOk` allowlist, delivered notes dismissed at sign-out | N-3, RV-1, RV-2, NS-47-R12, R13, security F5 |
| D. Pure notification selection | NS-48 key selection must be deterministic | `packages/core/src/notification-key.ts`, function of cell and `slotOrdinal`, `select` seam, floor selector, no stored state | RV-14, NS-48-R1, R2 |
| E. One age function in core | `chapters.ts:182` and `lib/reminders/tz.ts:131` duplicate month arithmetic; `dateOfAge` and an instant-to-local-date helper are needed | `packages/core/src/age.ts` owns both with two named precisions (CODE-R13) | R-IA-1, K12 |
| F. Journaling Suggestions and library-derived nudges | NS-49 level 2 and NS-51 need a native boundary and a spike | Weak link, `@available(iOS 17.2, *)`, one `pickSuggestion()` boundary, stand-in for tests, spike SP-PHS-1; and the library read path ADR (below) | RV-12, K13, NS-49 section 10 |
| G. Photo library read access (NS-51) | `scribe-photo` is permission-free by rule; direction 26 reverses the closed level 3 | Separate `scribe-library` module, limited access first-class, metadata only, index per section 1.13, reversal recorded as a ruling first (CR number), source scans rewritten | direction 26 section 1, Q-PM-1, Q-PM-5, Q-PM-6 |
| H. Media storage and sync (NS-52) | One picture, local only today; `entry-photos` bucket 10 MiB images only; no signed-URL or blob-queue code | Variant A local multi-media and video on the phone first; variant B only with a new bucket, membership RLS, signed-URL function, server limit triggers, blob queue, quotas, X2 and counsel read first; transcode on the phone; strip metadata from every container | direction 26 Q-PM-2, Q-PM-3 |
| I. Days library data and sourcing | Dates from memory are the highest-cost error | Rules computed in core; one row per authority; UTC instant for astronomical days; whole-library refresh route with no per-tick request; October review function; per-tradition reviewer record | DL-3, DL-4, DL-8, NS-46-R12, R24, R48 |
| J. Export minor allocation (already 0038) | Pictures 1.7.0, video and several pictures need another | Add NS-52 as a named consumer; fixture of the previous minor | ADR 0038 proposal |

---

## 3. Conflicts and duplicates (cards vs code vs open PRs vs ADRs and rulings)

Format: id, what, where (file:line), which side should change.

- C-1 Budget classes. #758 `apps/mobile/src/lib/reminders/budget.ts` (draft, `mergeable_state` dirty, updated 10 Nov) is a class registry with ceilings and an `occasion` class; NS-46-R30 `budget.ts` is a pure chooser; N-2 forbids a new class; BL-966 says "rework #758". Same path, two jobs. Change: #758 (drop `occasion`, add the chooser); BL-966 scope text gains the `libraryDay` rank and the DL-2 order (`docs/BACKLOG.md` BL-966 "priority typed day, birthday, month note, evening").
- C-2 60 plus 4 vs 60. BL-966 title says plan notices "outside" the budget, its scope says 60 pending with plan notices first; E13 says 60 in total; `planner.ts:90` plus `plan-reminders.logic.ts:47` is 64. Change: BL-966 title and ADR 0032 wording to E13.
- C-3 Level 3 and #754. Direction 26 reverses level 3 closed; NS-49-R6, R25, 22 section 4, Q-FD-4 still say closed. #754 (draft, 10 Nov) `packages/core/src/moments.ts` and `media-consent.ts` implement a moment engine over photo metadata with `cityKey`, behind off switches. Before direction 26 it contradicted the pack; now it is a candidate for NS-51. Change: product records the reversal (RV-18) and rewrites NS-49-R6, R25, NS-01-R22 in the same PR; engineering decides whether #754 is rebased as the NS-51 base.
- C-4 Single picture vs several. NS-01-R15 and ADR 0028 D1 (`entry_media` `CHECK (kind = 'photo')`, one-photo unique index, in #835 open) vs NS-52. Change: none to #835 (E35); NS-52 brings its own rebuild migration after migration 11.
- C-5 Server promise vs variant B. BL-870 and NS-01-R15 say the server never holds a picture; `entry-photos` is images only, 10 MiB. Variant B reverses both and the label row ("Photos or Videos: No", `docs/legal/app-store-privacy-labels.md:54`). Change: NS-52 chooses A or B before code; legal files change only through the founder.
- C-6 Pause pattern. Cards say "wire outside `mayRun`" (NS-46-R28) and ADR 0029 "key list"; #894 already does it for `bookSearch` and #837 for photos. Duplicate risk: a third pattern. Change: card text cites the #894 pattern; ADR 0029 does not exist yet (A1).
- C-7 ADR 0029 does not exist. Card 21 section 10, GAP-LOG 85, 272, 291, 308, E21 cite it as a list that "joins". The only record is a proposal in `inputs/C-platform-quality-delivery.md:89`. Change: engineering files A1; cards read "proposed ADR 0029".
- C-8 Kill-switch header. `kill-switches.ts:1-8` says switches stop only server-dependent features; ADR 0016 5.3 agrees; `photos`, `bookSearch`, `libraryDays` hide phone-only screens. Change: header and ADR 0016 note (E21).
- C-9 Backlog ids. Highest id BL-999 (`docs/BACKLOG.md`, note after BL-999); the dispatcher regex `/\bBL-\d{3}\b/` ignores BL-1000 (`scripts/agents/lib.mjs:52`, from `BACKLOG-GAPS.md`, UNVERIFIED re-read). NS-46 to NS-52 need about a dozen rows (NR-DAY-01 to NR-DAY-13 and more). Change: engineering row to extend the id format before product numbers them; until then the harness cannot pick these rows.
- C-10 Plan coverage. #847 (`17-engineering-project-plan.md`, +768, open) maps NS-01 to NS-37 and the lock `450bcb4a`; it has no NS-38 to NS-52. `locked-pack-plan.md` the same. Change: #847 re-sync adds a wave for NS-46 to NS-52; the rows here are its input.
- C-11 `docs/tdd/new-scope/` named by CR-66 does not exist. Change: engineering writes it, or CR-66 points here for NS-46 to NS-52.
- C-12 Four-tab PRs. #789, #790, #791 (open, 10 Nov) propose Home, Book, Share, Me; D-161 rules three tabs and the pack uses three. Change: close them or mark superseded (not mine to close).
- C-13 Tap routing. `scheduler.ts:257` routes every non-evening kind to `/book`; NS-46-R32 routes `libraryDay` to Home; month and birthday stay on the Book. Change: code.
- C-14 NS-48-R11 vs built titles. "A title never carries `{child}`" vs `strings.en.ts:690-698` named titles (mobile M-03, M-04). Change: card text (mobile's proposed wording).
- C-15 Wrong path. Card 21 NS-47 section 10 names `docs/privacy/DATA_CLASSIFICATION.md` section 4.5; the file is `docs/legal/DATA_CLASSIFICATION.md`, section 4.5 is local SQLite, 4.6 is device files. Change: card, and `docs/legal/**` is founder-merge.
- C-16 Remote flag vs day names. `flags.lockScreenNamesDefault` (`remote-config.ts:86`) exists; NS-47-R12 requires a local default off. Keep the remote flag out of the day switch.
- C-17 Podspec floor. `ScribePhoto.podspec:9` says 16.4, the app says 17.0 (`app.config.ts:44`); NS-49 needs a weak link and `@available(iOS 17.2, *)`. Change: code in the level 2 PR.
- C-18 NS-47-R6 vs R7. Privacy F1: "a restored phone asks again" contradicts `culture.asked` surviving sign-out. Change: card (privacy's wording is in the review).
- C-19 CR-66 precedence names cards `01` to `12`; cards 19, 21, 26 and 27 are not listed, so a lower document can claim to override them. Change: CR-66 amendment (Karma).
- C-20 Placement of the typed-day store. BL-982 stores typed days as `settings` keys `typedDay.<yyyy-mm-dd>` (in the iPhone backup) while NS-47 puts the ticked-day store outside `scribe.db` and backup-excluded, and RV-8 makes typed-day words follow the same lock-screen switch. Two stores for one Days page. Change: decide whether typed days stay in `settings` (BL-982 as written, UNVERIFIED NS-18 text) or move; Q-E5.
- C-21 Two schedulers. `lib/billing/plan-reminders.ts` and `lib/reminders/*`: an overlap the cards acknowledge. Not in scope to merge; `budget.ts` takes the count.
- C-22 PR size. #835 (+775), #836 (+981), #837 (+718), #838 (+617), #839 (+592) exceed CODE-R02 (400 lines or 20 files); recorded exceptions are relayed in #847 and UNVERIFIED here. The NS-46 to NS-52 work must be cut to fit: this handoff's build order uses one concern per step.
- C-23 Fixtures. QA F-04: real traditions beside Asha in card fixtures (14 Feb 2029, 16 May). Use synthetic ids in every test; the no-real-family-data test covers hashes only.
- C-24 Variant B vs ADR 0024 and the privacy promise. Recordings are encrypted client-side so the server cannot read them; a server-readable child's video is a new class of data. Change: security and privacy decide before design.

---

## 4. Build sequence, by dependency

Rule: one concern per PR, under 400 lines and 20 files (CODE-R01, R02); each step names card rows in the PR and `[NS-nn-Rn]` test titles (CR-66). Test layer in brackets.

Step 0: records and units that block the rest (no code to production).
- 0.1 Record the level 3 and multi-media reversals (RV-18 onward) and amend CR-66 precedence [docs]. Blocked on: Karma, founder.
- 0.2 Backlog id format beyond BL-999, then rows for NS-46 to NS-52 [Unit on `scripts/agents/lib.test.mjs`]. Blocked on: engineering.
- 0.3 File ADRs A1, A2, A3, B, C, D, E (section 2) as Proposed. Blocked on: engineering.
- 0.4 Q-E12 is ruled (E35): #835 merges as it is; the NS-52 migration is a new one after migration 11 [Integration].

Step 1: independent of NS-46 and NS-47 (Drop A; step 1.4 is Drop B since 20 Nov, CL-015).
- 1.1 Content rules drift test: every key family under `ALL`, notification scope paths, `VOICE.md` line 70 [Content rules]. Needs `content`. Unblocks every words PR (NS-48-R28).
- 1.2 NS-48 phase 1: pure key function in `packages/core`, planner `select` seam, `slotOrdinal`-based variant, built 8 re-keyed with the day-part filter, `planSignature` stable [Unit, Integration]. No new setting. No dependency on BL-966.
- 1.3 Analytics tests: stems, enum values, event names, four never-reported kinds, `variant_id` range [Unit]. Needs `analytics`.
- 1.4 NS-49 level 1 as the first-class start behind the existing photo flag, after the A-S01 re-draw passes AX5 and NS-01 is on `testflight` [Unit, Journey, Device]. Blocked on the photo stack (#835 to #840) and the founder's words.

Step 2: planner foundations (Drop B prerequisites).
- 2.1 BL-985 and E16: planner reads `Child.quiet` through `PlannerChild.included` [Unit, Integration].
- 2.2 BL-966 reworked on the C-1 and C-2 facts: `budget.ts` chooser, group field, 60 in total, `libraryDay` rank reserved [Unit property test, Integration].
- 2.3 BL-967 sign-out cancels reminders and dismisses delivered notes; `getLastNotificationResponse()` cold-tap path [Integration, Device].
- 2.4 Day-only gate and first-tick permission door (NS-46-R31) [Unit, Integration]. Blocked on: Q-FD-20 and Q-FD-21 (founder consent line, counsel).
- 2.5 BL-963 slip registry with absent ranks, ranks 2b and 3b registered but off [Unit, Source check]. Then BL-961 `[X4-R1]` stack (#871, #879) merged first; the registry reads the active account.
- 2.6 Phone-only flag and pause pattern (A1) in `packages/api`: `libraryDays` key, schema, parse test, header (E21), scheduler subscribes to config [Unit, Integration]. Reuse #894's files; do not duplicate.
- 2.7 Notification categories with `previewPlaceholder`, opaque identifiers, neutral strings (ADR C) [Unit, Source check, Device]. Hard prerequisite of NS-47-R12.

Step 3: days store and library (Drop B).
- 3.1 Days store module: file, exclusion with read-back, fail closed, `subscribeDays`, import-boundary test, erase and sign-out wiring, `[X4-R1]` enumeration [Unit, Integration, Source check]. Blocked on: BL-961 and counsel only for the consent line; privacy rows (`docs/legal`) founder-merge.
- 3.2 Calendar engine and oracle tables for 2026 to 2030 in core, sourced and dated; US days only [Unit]. Blocked on: counsel on any copied table (FR-DAY-23); computed dates need none (DL-4).
- 3.3 Planner feed for `libraryDay` plus tap routing to Home [Unit, Integration, Device NTC-T24].
- 3.4 Days page and Browse (C-S24, C-S25), plain list, one consent line [Journey, Device]. Blocked on: founder words (G3).
- 3.5 NS-50 rank 2b day slip and the blank-on-background rule [Unit, Device].
- Gate before any flag outside the founder's family: G0 trace sees NS ids (BL-964), G2 counsel, G3 words, G4 J-CUL-01 and NTC-T24, G5 label, G6 flags off in production.

Step 4: Drop C.
- 4.1 NS-47 ask slip, tradition browse, day-name switch, culture-led days; tradition-member reviews recorded. Blocked on counsel CUL-Q5, Q6, Q7, Q11 and reviewers (Q-FD-9).
- 4.2 NS-48 recency and last-letter layers. Blocked on the NS-13 anchor and back-off (not built) and `lastMadeLetter()` as one indexed query.
- 4.3 NS-49 level 2: weak-link spike on a real phone, then module, flag `EXPO_PUBLIC_SUGGESTIONS`. Blocked on the entitlement (Q-FD-11), a phone on 17.0 or 17.1 (Q-FD-33), counsel 3.3.3(H) and 5.1.3.

Step 5: NS-51 and NS-52 (direction 26; none of it can start until the cards exist and the reversal is recorded).
- 5.1 NS-52 variant A: local multi-media schema (per Q-E12), video cap and transcode in a native module with a metadata-stripped container test, playback component, export minor, delete and purge, Save a copy [Unit, Source check, Integration, Device]. Needs: founder limits (Q-PM-2), label read, `expo-video` dependency review.
- 5.2 NS-51: `scribe-library` native module and spike (authorisation, limited library, thumbnail only) [Device]; moment index store (ADR B); moment rule; neutral nudge through the chooser; scans rewritten [Unit, Source check, Integration, Device]. Needs: reversal recorded, counsel on Photos access, 5.1.1, label "Photos or Videos", `BL-961` green.
- 5.3 NS-52 variant B only after X2, counsel, security threat model, red-team and the founder's money decision: migration and grants, bucket, signed-URL function, blob queue, quotas, label, then app [Integration `npm run test:db`, `npm run test:functions`, Device]. Not before Step 5.1 is in a build.

Blocked on the founder or counsel (summary): Q-FD-7 (which drop), Q-FD-18 (lock-screen titles), Q-FD-20 and Q-FD-21 (permission and reminders off), Q-FD-11 (entitlement), Q-PM-1 to Q-PM-7, counsel CUL-Q5 to Q7, Q11, FR-DAY-23, DPLA 3.3.3(H), 5.1.3, X2 and the child's video, the privacy label rows, every word (G3).

---

## 5. Questions only engineering or Karma can rule (each with a recommendation)

- Q-E1 Is `budget.ts` the chooser and #758 reworked into it, or a new file with #758 closed? Recommend: rework #758 (C-1), drop `occasion`.
- Q-E2 `libraryDay` as a `group` field on `PlannedKind` or a new `PlannedClass`? Recommend: group field (N-2, mobile M-25).
- Q-E3 Where does the days module live and what do its tests import? Recommend: rules in `packages/core`, data in `packages/content/src/days/`, store in `apps/mobile/src/lib/days/`.
- Q-E4 Re-plan trigger on remote config change? Recommend: `remoteConfigDoc.subscribe`, within the 1.2 s debounce.
- Q-E5 Typed days: `settings` keys (BL-982) or the days store? Recommend: one store for the one Days page, outside `scribe.db`; typed-day words are L4 (RV-8); amend BL-982 before it starts.
- Q-E6 Diff the apply loop by identifier instead of cancel-all then schedule (mobile M-26)? Recommend: yes, before yearly days are pending; UNVERIFIED that iOS replaces a same-id request.
- Q-E7 Horizon 366 days vs 92 (Q-FD-22)? Recommend: 366 inside the ceiling; say plainly on C-S24 that far days need an app open in the year.
- Q-E8 Does the cold-start tap need `getLastNotificationResponse()` for the evening scheduler? Recommend: yes, one path for all our kinds.
- Q-E9 Weak-link spike: who owns the device row? Recommend: `mobile` runs step 1 on a borrowed 17.0 or 17.1 phone; level 2 stays off until it passes.
- Q-E10 Does `celebrations_paused` reach the phone today (NS-46-R49)? Recommend: `sync` answers by file and line; if not, drop R49 from drop B.
- Q-E11 Is a library moment a slip rank, a capture-cluster item or both (R-IA-3 is not reversed by direction 26)? Recommend: one rank, shown once, never a strip; Karma rules.
- Q-E12 Amend migration 11 in #835 for several pictures and video before it merges? RULED NO (CR-64: migration 11 ships unconditionally as it is; E35): a new migration after it does the rebuild, behind NS-52's flags.
- Q-E13 Library moment index and days store: one store file or two? Recommend: two files, one pattern (ADR B); different lifecycles (index is rebuildable, days are the parent's choices).
- Q-E14 Video transcode on the phone: native `AVAssetExportSession` or a dependency? Recommend: native, no ffmpeg; run a size and time budget on an SE 3.
- Q-E15 Variant A first and B behind `killSwitches.mediaSync` (E38)? Recommend: yes (section 1.14).
- Q-E16 The next ADR numbers and who files A1 to J? Recommend: `principal-architect` reviews, `mobile` and `data-architect` file by owner; Karma assigns numbers.

---

## 6. What engineering must not assume

1. Nothing in NS-46 to NS-52 is built. No planner kind, budget chooser, slip host, notification category, days store, flag or kill switch for them exists in this tree (grep, section 1.1).
2. "The budget is enforced" is false: it is enforced nowhere except evening yielding (`planner.ts:350`).
3. `Child.quiet` is read by nothing in `lib/reminders`; `store.ts:388` says otherwise and is wrong.
4. Plan notices are 4 extra pending notes today (64 in total); E13 says 60 in total. Do not reuse #758's constants as ruled.
5. Sign-out does not cancel reminders (BL-967), does not clear any days store (none exists) and a second account on one phone can see the first account's book until BL-961 (#871, #879) merges; #869 is merged but is not in this tree.
6. `EXPO_PUBLIC_PHOTOS` and `EXPO_PUBLIC_BOOK_SEARCH` are not in this tree; they are in open stacks (#837, #894). "Existing flag" in a card means "in an open PR".
7. ADR 0029 to 0039 do not exist. Do not cite them as rules.
8. `mayRun` and `buildFlagEnabled` are false whenever servers are off, and TestFlight runs servers off. A pause that uses them hides nothing in that build, and a flag that uses them never turns on.
9. `docs/tdd/new-scope/` and cards NS-51 and NS-52 do not exist yet. #847 and `locked-pack-plan.md` do not cover NS-38 to NS-52.
10. iOS does not impose a 35-day horizon; that is NS-13's own policy (RV-4). The code plans 92 days for month and birthday notes. The 64-pending limit is stated in code comments and is UNVERIFIED against Apple's pages here.
11. Apple's Journaling Suggestions: the app receives the suggestion you choose and uses only its picture; "only the picture reaches the app" is wrong (RV-12). The framework needs iOS 17.2 and a weak link; the Simulator lacks it (UNVERIFIED, forum report). The title may name a place or person, so it is L4 until `privacy` rules; the app deletes only its own copy.
12. A kill switch can only hide; none can turn a feature on, stop recording, typing, saving, reading or export (LEGAL-REQ-040).
13. A tap payload is `{source, kind}`. No day id, tradition, catalogue key, variant, layer or `days.` string in `identifier`, `data`, `threadIdentifier`, `categoryIdentifier` or a route parameter; Home finds the day from today's date.
14. A lock-screen title never carries a day's name unless the day-name switch is on, App lock is off and the day is on the `publicTitleOk` allowlist; with App lock on every title is neutral. A day name never sits beside a child name.
15. Analytics: do not add any event, property, route or enum value for days, culture, suggestions or library items; never a Home slip event; never report a day note.
16. Content rules do not read new key families until exported under `ALL` and the notification paths; a green rules test proves nothing about them until the drift test exists.
17. The photo stack has no video, no several-pictures support and no library read. Migration 11 allows one JPEG per entry or draft (ADR 0028 D1, #835); NS-52 changes that in a new migration after it (E35). `scribe-photo` is permission-free by rule: do not add PhotoKit authorisation to it.
18. The server accepts no video: `entry-photos` is private, 10 MiB, jpeg, heic and png only, with policies keyed on the uploader's folder. There are no signed-URL, resumable-upload, blob-queue, transcoding or quota facilities anywhere in the tree. Supabase Free-plan storage and upload limits are UNVERIFIED and unmeasured; production is on the Free plan (D-159).
19. Pictures are in the iPhone backup (CR-62 D1, open item 7). Do not tell a parent "only on this phone" for a picture or a video until the backup question is decided and the in-app line says it.
20. A card is not a decision for public words, the privacy label, a counsel answer or a store submission; defaults hold for design and build only. Every legal or store reading is "counsel must confirm".
21. The nudge about pictures cannot react to a new picture while the app is closed, and nothing here may count, rank or describe a family's pictures, or write, suggest or pre-fill a caption (constitution, direction 26 section 1).
22. Real family data, a real tradition beside Asha, and real media never go in code, tests, fixtures, logs or evidence.
23. The harness picks only rows that cite card rows and have a three-digit id; no row for NS-46 to NS-52 exists. Do not start work from this file alone.

UNVERIFIED in this file, in one place: Apple framework behaviour (Journaling Suggestions, PhotoKit limited library, change observer in background, iCloud downloads); Supabase Free-plan and resumable-upload limits; whether the outbox can carry blobs; whether `strip.ts` covers every case; PHPicker filter in `scribe-photo`; QuickTime metadata atoms; the exact content of `ARCHITECTURE.md` beyond what is cited; the recorded size exceptions for #835 to #839; the status of #754 and #758 beyond their file lists and headers; the planner's behaviour on a real device; no test, build or device was run.

---

## 7. Edits to make in place (engineering; update the existing artifact, never add a second copy)

Rule from the founder (20 Nov): update in place. Nothing below is copied here as text; each line is the edit.

| # | Artifact and line | Exact edit | Because |
|---|---|---|---|
| E-1 | `docs/ARCHITECTURE.md:71` (`ST` node) | Change "encrypted audio blobs, photos" to "encrypted audio blobs"; add one node note "pictures: phone only (ADR 0028 D1; NS-01-R15) until NS-52 variant B is ruled" | Contradicts NS-01-R15 and BL-870 today; the text says photos are in Storage |
| E-2 | `docs/ARCHITECTURE.md:118-129` (section 5 table) | Add rows: library days and culture store (device file, backup-excluded, no server role); notification choice (device, pure function); photo library read and moment index (device only, NS-51, once ruled); several pictures and video (device first, server role per NS-52 ruling) | The table is the one on-device versus server view; it has none of these |
| E-3 | `docs/ARCHITECTURE.md:5-8` (status box) | One row pointing the topics "days, culture, catalogue, Home today, pictures" to `docs/product/prd/24-engineering-handoff.md` and the ADRs once filed | The box says later decisions win; it should say where |
| E-4 | `docs/adr/0016-lean-app-and-server-driven-content.md:127-129` (5.3) | Add: a remote pause may hide a phone-only feature (never turn one on, never stop recording, typing, saving, reading, export); phone-only keys listed in the future flags ADR | E21; `bookSearch` (#894) and `libraryDays` do this |
| E-5 | `packages/api/src/kill-switches.ts:1-8` (header) | Same sentence as E-4, then add `libraryDays` (and later `media`) beside `bookSearch` in `KILL_SWITCH_KEYS` and `remote-config.ts:59-78` | E21; API-R11 (additive, older configs parse as off) |
| E-6 | `docs/adr/0028-photo-seal-find-on-device-data.md:15` and D1 at `:27` | Q-E12 is ruled no (E35): D1 stays as built for migration 11; the status line says Accepted by CR-62 (input C asks the same); when NS-52 is built, one `amendment` line on D1 names the new migration that rebuilds `entry_media` for several pictures and video | #835 builds migration 11; NS-52 builds the next one |
| E-7 | `docs/engineering/plans/inputs/C-platform-quality-delivery.md:89` (rows 0029, 0032, 0033) | Do not create a copy. When the ADR files are made, take the rows as their start and add: `libraryDay` ranked source in the `typedDay` group, 60 in total (E13), ranks 2b and 3b, phone-only pause pattern (#894) | RV-4, RV-9, RV-10, RV-11, NS-46-R29 to R33, NS-50-R5 |
| E-8 | `docs/BACKLOG.md` BL-966 (title and scope), BL-963 (slip order), BL-982 (storage of typed days) | BL-966: "60 in total, plan notices first", add `libraryDay` rank and DL-2 order; BL-963: add 2b and 3b; BL-982: decide with Q-E5 | C-1, C-2, C-20 |
| E-9 | `docs/product/prd/21-days-cultural-photos-home.md` NS-47 section 10 | Change `docs/privacy/DATA_CLASSIFICATION.md` to `docs/legal/DATA_CLASSIFICATION.md` section 4.6 (product edit; founder merges `docs/legal`) | C-15 |
| E-10 | `docs/agents/cto/RULINGS.md` CR-66 (`:610` heading, precedence bullet) | Name cards 19, 21, 26 and 27 in the precedence list; point `docs/tdd/new-scope/` at this file for NS-46 to NS-52 until it exists | C-11, C-19 |
| E-11 | `docs/product/prd/17-engineering-project-plan.md` (PR #847) | Re-sync adds NS-38 to NS-52; this file's section 4 is its input, not a second plan | C-10 |
| E-12 | `apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec:9` | Platform 17.0 and `s.weak_frameworks` in the level 2 PR | C-17 |

Not edited anywhere by me: every file above except this one.
