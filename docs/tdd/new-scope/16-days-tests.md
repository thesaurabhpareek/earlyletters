# Days, culture, catalogue, picture-first and Home: test design for the 87 P0 rows, part 4 of 5

Status: Proposed, 20 Nov 2026. Author: `mobile` (Claude session) for Karma, task RD-I2. Target: `docs/tdd/new-scope/16-days-tests.md`. Continues files 13 to 15. Tags and sources as in file 13. Mutants are designs, not runs: none was applied in this run; the first run of each belongs to the author (QA rule C-05 in `CHECKS-AND-BALANCES.md`, #924).

## 0. What exists and what this adds
**Fact** The quality catalogues A to D (#924 to #927) key waves 1 to 5 of NS-01 to NS-37 and contain no `NS-38` to `NS-52` row id (PD2 section 4, last paragraph; a grep of `catD.md`, `journeys.md`, `a11y.md`, `motion.md`, `delta.md` for NS-46 to NS-50 finds none [V]). `scripts/trace.mjs` does not read NS ids (`21:15`). So this file proposes a **Catalogue E: NS-46 to NS-50** in the shape of Catalogue D (Row, exact title, Lvl, Run, W, Fixture and assert, Mutant, Lane). Titles are the backticked titles on the cards, used exactly (`21:261-299` and the other tables). `qa` merges it into the catalogue; ids `J-N37` (J-CUL-01 device walk, `21:550`) is qa's to register.
Legend: U unit (Node, vitest), I integration (real store on `node:sqlite`, fake `expo-notifications` as in `test/reminders-erase.test.ts`), S source or content scan (needs a positive control), J simulator journey, D device only, P process or document check. Run: SB runs in the sandbox (Node 22.5+; the 8 baseline `apps/mobile` files stay red), CI, DV device. W is the wave and drop in file 17.

## 1. Test method (applies to every row)
1. **Injected clock, no ambient time.** `planReminders` already takes `now` and `timeZone` (`planner.ts:289-290` [V]); `chooseSlip(input, today)`, `daysDueOn(rows, today)`, `daysForDate(iso)`, `plannableDays(now, tz)`, `selectNotificationKey(cell, ordinal)` and `chooseOnePerDay` take their time as a parameter. A scan (`test/pure-modules-no-clock.test.ts`, positive control: a fixture file with `Date.now()`) fails on `Date.now`, `new Date(` without an argument, `Math.random` and `Intl.DateTimeFormat().resolvedOptions` inside `lib/days/*.logic.ts`, `lib/reminders/budget.ts`, `lib/reminders/backoff.ts`, `components/tonight/home-slips.ts`, `packages/core/src/{days,notification-key}.ts`.
2. **J-N4 style days journey** (`test/days-journey.test.ts`): `fakeDevice({ tz, now })` holds a fake store file, a fake `ScribeFiles`, a fake `expo-notifications` (list, schedule, cancel, dismiss), settings on `node:sqlite`. A loop advances `now` by a day from day 0 to day 400 and re-plans each step: asserts per local date at most one budgeted note, total pending at most 60, plan notices first, a day note on its date, none after untick, none for a quiet book, evening back-off still stopping after day 35 while a ticked day keeps firing a year out (NS-13-R29, NS-46-R10). Zones: Pacific, Eastern, Hawaii, India, Sydney; one zone change mid-run. The asserted dates come from the committed oracle (file 13 section 3), never from the code under test.
3. **Property test** for `chooseOnePerDay` (NS-46-R30, NS-48-R26): 500 seeded random plans (seed printed on failure) over five sources, one to three children, two to four ticked days, birthdays on ticked days, 0 to 4 plan notices. Invariants: no date with two kept; `kept + planPending <= 60`; the lowest rank wins each date; same input same output; a candidate dropped by the cut is never earlier than any kept one. Mutant: break the cut order (sort by id) and the invariant fails.
4. **Canary** (J-N18 pattern; `test/days-canary.test.ts`): synthetic strings `zz-test-tradition`, `zz-test-day-a`, `zz-test-country`, a suggestion title and place `zz-test-title`, `zz-test-place`; run through ask, tick, move, clear, plan, deliver, tap, suggestion pick and keep; scan logs, breadcrumbs, errors, URLs, route params, notification `identifier`, `userInfo`/`data`, `threadIdentifier`, `categoryIdentifier`, analytics properties, crash payloads, support links, `mailto` bodies: 0 hits (NS-47-R8, NS-49-R24).
5. **Import boundary** (`test/days-boundary.test.ts`): only `lib/days/**` imports `store-file`; no import of `lib/days` from `lib/prompts`, `lib/find`, `lib/analytics`, `lib/support`, emails, Home copy (NS-47-R11). Positive control: a fixture importer fails.
6. **Fixtures:** Asha only; day pairs only `zz-test-day-a`, `zz-test-day-b`; real 14 Feb 2029 and 16 May 2027 pairs only in `packages/content` data tests that hold no child (NS-46-R8). No real tradition beside Asha anywhere (NS-47 section 13).
7. **Content tests:** `npm test -w packages/content` for any key; the `rules.test.ts` drift test (NS-48-R28) goes first so `days`, `culture`, `ntc` families are read at all (`21:716`).
8. **Cross-cutting scans.** PX-1 `test/pure-modules-no-clock.test.ts` (item 1). PX-2 `test/launch-import-graph.test.ts`: a Node walk of the transitive imports of `app/_layout.tsx` finds no module under `lib/days/` and no `packages/content/src/days` (A-NFR-001; positive control: a fixture that imports it). PX-3 `test/days-flag-pins.test.ts`: `capabilities.test.ts:242` pinned list gains `EXPO_PUBLIC_DAYS` and `EXPO_PUBLIC_SUGGESTIONS`, `KILL_SWITCH_KEYS` gains `libraryDays`, an older signed config parses it as off.
9. **Device rows** are `human` tasks in the NS-34 run sheet: DV-1 J-CUL-01 (lock screen, Notification Center, Notification Summary, Apple Watch mirror, CarPlay, Focus summary, Show Previews Never, App lock on and off, names switch on and off, device-to-device transfer); DV-2 a library note on the correct local date in three zones (Pacific, Eastern, Auckland) and across a daylight-saving change; DV-3 Home cold launch on a ticked day (SE 3, default and AX5: did Speak move); DV-4 tap to Home within 2 s; DV-5 app-switcher blank on Home with a day slip and on C-S24 to C-S26, App lock on and off; DV-6 SE 3 at AX5 with Bold Text on C-S24 to C-S26, the ask slip, the day slip, the one-photo sheet; DV-7 NTC-T24 (a week on a real phone: no name on the lock screen, Sunday slower than Friday, an r3 note names no absence); DV-8 iOS 17.0, 17.1, 17.2 and 26 launch run and iPad for NS-49-R28 (borrowed phones, Q-FD-33); DV-9 the founder's own-phone suggestions walk (R6, R7, R10, R11, R12, R28; never a tester session, `21:1014`); DV-10 planning time of `apply()` with a full year ticked (numbers only). Founder hands: DV-1, DV-7, DV-8, DV-9.

## 2. Catalogue E: the 87 P0 rows

Mutant column: a change that must turn the test red. `(code not built yet)` is implicit for every row.

### 2.1 NS-46 (22 P0)
| Row | Exact title | Lvl | File | Mutant |
|---|---|---|---|---|
| NS-46-R2 | `[NS-46-R2] nothing is ticked for the parent` | U, S | `packages/content/test/days.data.test.ts`, `test/days-store.test.ts` | Set `preTicked: true` on one row; open Browse and the ask: a tick appears |
| NS-46-R4 | `[NS-46-R4] a ticked day adds no class` | U | `test/reminders-budget.test.ts` | Add `libraryDay` to `PlannedClass`; use `days.<id>` as the identifier |
| NS-46-R5 | `[NS-46-R5] a typed day does not recur` | U | `test/typed-days.test.ts` | Keep a delivered typed day one more year |
| NS-46-R7 | `[NS-46-R7] birthday beats a library day` | U | `test/reminders-budget.test.ts` | Swap ranks 2 and 3 |
| NS-46-R8 | `[NS-46-R8] two days one date one note` | U | `test/reminders-budget.test.ts`, `test/days-lockscreen.test.ts` | Schedule both, or move one day to the next date |
| NS-46-R14 | `[NS-46-R14] a moving day says around and can be moved` | U | `packages/content/test/days.data.test.ts`, `test/days-store.test.ts` | Drop `precision: about`; ignore an `always` move next year |
| NS-46-R16 | `[NS-46-R16] quiet days stay quiet` | U, S | `days.copy.test.ts`, `days-lockscreen.test.ts` | A question mark in a quiet landing; `tone` made editable |
| NS-46-R17 | `[NS-46-R17] days copy passes the voice rules` | S | `packages/content/test/rules.test.ts` (extended) | "Happy" in a landing key; a `{child}` in a names-off lock string. Each new pattern has a positive and a negative self-test |
| NS-46-R19 | `[NS-46-R19] the app never says a day is missing` | S, U | `days.copy.test.ts`, `test/days-page.logic.test.ts` | A "not in the list?" line; a count of ticked days in a label |
| NS-46-R22 | `[NS-46-R22] no look-back and no count` | S | `days.copy.test.ts` | "last year" in a landing body |
| NS-46-R23 | `[NS-46-R23] tradition review and source licence on record` | P | `packages/content/test/days.review.test.ts` (checklist) | Ship a tradition with no review record |
| NS-46-R25 | `[NS-46-R25] quiet book adds nothing` | U | `test/days-planner.test.ts` | Ignore `quiet`; ignore `remindersOn` off; ignore every-book-quiet |
| NS-46-R26 | `[NS-46-R26] Days page works with assistive settings` | U, D | `test/days-a11y.logic.test.ts`, DV-6 | A row label with a count; a 40 pt target; `numberOfLines` on a name |
| NS-46-R27 | `[NS-46-R27] a day note never sells` | S | `days.copy.test.ts` | "Plus" in a body; an entitlement check in `lib/days` |
| NS-46-R30 | `[NS-46-R30] one chooser, one rule` | U property | `test/reminders-budget.test.ts` | Add a second path that schedules (the cap of 4 in `plan-reminders.ts` as a template) |
| NS-46-R31 | `[NS-46-R31] day reminders do not need evening reminders on` | U, I | `test/days-planner.test.ts`, `test/days-permission.test.ts` | Gate day sources on `prefs.enabled`; ask iOS twice |
| NS-46-R32 | `[NS-46-R32] a day reminder opens Home and carries no day` | U, S | `test/days-tap.test.ts` | Route to `/book`; put the id in `data` or `userInfo` |
| NS-46-R34 | `[NS-46-R34] day notes are never observed` | U | `packages/analytics/test/observe.test.ts` | `notificationOpenedEvent` returns an event for `libraryDay` |
| NS-46-R35 | `[NS-46-R35] consent line and opt-out are in the UI` | U, S | `test/days-consent.logic.test.ts`, `days.copy.test.ts` | Tick without the line; "new days" in a landing |
| NS-46-R36 | `[NS-46-R36] public titles are an allowlist` | U, S | `days.data.test.ts`, `days-lockscreen.test.ts` | Derive `publicTitleOk` from layer; allow Christmas Day; title named with App lock on |
| NS-46-R46 | `[NS-46-R46] no public line misstates the day reminder time` | S | `packages/content/test/store-claims.test.ts` | Leave "You pick the days and the time" in `store.en.ts` |
| NS-46-R48 | `[NS-46-R48] the library fetch does not vary with the store` | U | `test/days-refresh.test.ts` | Add a query derived from ticks; the two request logs differ |

### 2.2 NS-47 (27 P0)
| Row | Exact title | Lvl | File | Mutant |
|---|---|---|---|---|
| NS-47-R1 | `[NS-47-R1] the whole store is L4 and registered` | S, P | `supabase/tests/classification.test.mjs` pattern; `test/days-registry.test.ts` | Omit the registry row; class the file L3 |
| NS-47-R2 | `[NS-47-R2] picks are a filter; only ticks are stored` | U | `test/days-store.test.ts` | Persist the tradition in `setSetting` or a route param |
| NS-47-R3 | `[NS-47-R3] nothing is attached to the child` | S | `test/days-migration-lint.test.ts` | A `tradition` column on children |
| NS-47-R4 | `[NS-47-R4] no request carries a day key` | U, S | `test/days-network.test.ts` | A fetch with a day id; a migration named `faith` |
| NS-47-R5 | `[NS-47-R5] a day note leaves no trace in the synced row` | I | `test/days-synced-row.test.ts` | Pass a day id as `prompt_key` |
| NS-47-R6 | `[NS-47-R6] the store is out of the backup and fails closed` | U, D | `test/days-store.test.ts`, DV-1 | Skip exclusion; write bytes before the empty-file read-back; rename then read back only; leave the `.tmp` after a kill; write to Caches |
| NS-47-R7 | `[NS-47-R7] claim and new phone move nothing` | I | `test/days-claim.test.ts` | Upload at the claim step |
| NS-47-R8 | `[NS-47-R8] canary finds nothing` | U | `test/days-canary.test.ts` | Log the day id in a failure path |
| NS-47-R9 | `[NS-47-R9] analytics allowlist rejects day data` | U | `packages/analytics/test/catalog.test.ts` | Add `tradition_picked` |
| NS-47-R10 | `[NS-47-R10] the export holds none of it` | U | `test/days-export.test.ts` | Read the days file in the export builder |
| NS-47-R11 | `[NS-47-R11] one reader` | S | `test/days-boundary.test.ts` | Import the store from `analytics` |
| NS-47-R12 | `[NS-47-R12] one neutral body; the name only behind its switch` | U | `test/days-lockscreen.test.ts` | Stored switch survives App lock on; name in a body |
| NS-47-R13 | `[NS-47-R13] public days may name themselves; others need the switch` | U | `test/days-lockscreen.test.ts` | Skip one combination; title named for a family day |
| NS-47-R15 | `[NS-47-R15] sign-out clears and B sees nothing` | I | `test/days-session.test.ts` | Leave the file on sign-out; skip delivered dismissal; clear on A's id only; run `forgetReminders()` before deleting the file; drop the owner check so a queued re-plan schedules A's days for B; skip adopting the `'local'` file at first sign-in |
| NS-47-R16 | `[NS-47-R16] erase scan finds nothing` | I | `test/erase-all.test.ts` (extended) | Omit the folder or the Caches suggestion folder; no resume after a kill; leave `dismissedOn` in `settings` |
| NS-47-R17 | `[NS-47-R17] delete account line and clear` | U, I | `test/days-session.test.ts`, `test/delete-account.logic.test.ts` | The line claims an offline phone cleared |
| NS-47-R18 | `[NS-47-R18] first run has no such field` | S | `test/first-run-fields.test.ts` | Add a tradition field to E-S08 |
| NS-47-R21 | `[NS-47-R21] untick and clear all` | U, I | `test/days-store.test.ts`, `days-session.test.ts` | Clear all leaves a pending note |
| NS-47-R22 | `[NS-47-R22] call-out claims are true` | S, P | `days.copy.test.ts`, claims inventory | "Nobody can tell" in the call-out |
| NS-47-R23 | `[NS-47-R23] label re-run for the days store` | P | release checklist (`privacy`) | A new host or analytics property naming the store |
| NS-47-R24 | `[NS-47-R24] days are never shared` | U | `test/days-family.test.ts` | Show the other parent's count on Family |
| NS-47-R25 | `[NS-47-R25] the ask and lists work with assistive settings` | U, D | `test/days-a11y.logic.test.ts`, DV-6 | "Not now" smaller than "Choose days" |
| NS-47-R26 | `[NS-47-R26] unlocked only; blank snapshot` | U, D | `test/blank-on-background.test.ts`, DV-5 | No blank for C-S24 |
| NS-47-R29 | `[NS-47-R29] call-out visible, static and first` | U | `test/days-a11y.logic.test.ts` | DoorNote collapsible or after the first control |
| NS-47-R34 | `[NS-47-R34] analytics allowlist rejects day vocabulary` | U | `packages/analytics/test/catalog.test.ts` | Add the stem `holiday` to an enum |
| NS-47-R36 | `[NS-47-R36] no category shows a title with previews hidden` | U | `test/reminders-categories.test.ts` | `hiddenPreviewsShowTitle: true` |
| NS-47-R38 | `[NS-47-R38] no day name beside a child name on a lock screen` | U | `test/days-lockscreen.test.ts` | Named title with a `{child}` body, names on |

Added tests (review A on #970): `[NS-47-R15]` first sign-in on a never-signed-in phone: a `'local'` file is adopted by A (owner re-keyed, ticks kept, nothing uploaded) and B then reads nothing (`test/days-session.test.ts`); `[NS-47-R6]` write order: a fake `ScribeFiles` records call order and asserts exclusion set and read back on an empty temp before any byte is written, a read-back on every open, and a swept temp (`test/days-store.test.ts`); `[NS-47-R1]` `dismissedOn` is in the file, not in `settings` (`test/days-store.test.ts`).
New test files that do not exist on develop (not extensions): `test/photos-notes.test.ts`, `test/first-run-fields.test.ts`, `test/delete-account.logic.test.ts`, `packages/content/test/store-claims.test.ts`, `test/app.config.test.ts`. The migration lint of NS-47-R4 is two halves: the `supabase/migrations` half is a `data-architect` PR (`supabase/tests/`), the settings-key and local-column half stays in `test/days-migration-lint.test.ts`.

### 2.3 NS-48 (13 P0)
| Row | Exact title | Lvl | File | Mutant |
|---|---|---|---|---|
| NS-48-R1 | `[NS-48-R1] same inputs same key; every key exists` | U | `packages/core/test/notification-key.test.ts` | Use `Math.random`; orphan key in content |
| NS-48-R2 | `[NS-48-R2] volume is unchanged` | U property | `test/reminders-select-seam.test.ts` | Let the selector add a note |
| NS-48-R3 | `[NS-48-R3] recency is computed at plan time` | U | `notification-key.test.ts` | Read the clock at delivery; use `occurredOn` |
| NS-48-R4 | `[NS-48-R4] no gap in the words` | S | `packages/content/test/rules.test.ts` | "It has been a while" in an r4 line |
| NS-48-R5 | `[NS-48-R5] the kind may shape the body, never the title` | U, S | `notification-key.test.ts`, `rules.test.ts` | "voice" in a title; read letter text |
| NS-48-R9 | `[NS-48-R9] the catalogue honours the lock-screen rules` | U | `days-lockscreen.test.ts` | Catalogue overrides the neutral body |
| NS-48-R10 | `[NS-48-R10] every variant passes the rules test` | S | `rules.test.ts` | An exclamation mark; a 41-character title |
| NS-48-R11 | `[NS-48-R11] no child name by default` | S | `rules.test.ts` | A `{child}` in a new title |
| NS-48-R21 | `[NS-48-R21] a quiet book adds nothing to a key` | U | `notification-key.test.ts` | Read `quiet` after the key is built |
| NS-48-R26 | `[NS-48-R26] the one-a-day budget has one enforced place` | U property | `reminders-budget.test.ts` | A second `schedule` call outside the chooser |
| NS-48-R28 | `[NS-48-R28] every notification key is under the notification rules` | S | `rules.test.ts` | A `days` family not in `ALL` |
| NS-48-R30 | `[NS-48-R30] no age norm in a reminder` | S | `rules.test.ts` | "already" in a toddler line |
| NS-48-R36 | `[NS-48-R36] no pregnancy words on a lock screen` | U, S | `notification-key.test.ts` | "before birth" in the lock rendering |

### 2.4 NS-49 (21 P0; level 1 rows R3, R25 are drop B, the rest C)
| Row | Exact title | Lvl | File | Mutant |
|---|---|---|---|---|
| NS-49-R3 | `[NS-49-R3] no note about the picture` | U, S | `test/photos-notes.test.ts` | A body "from your photo"; picture field on `PlanInput` |
| NS-49-R6 | `[NS-49-R6] no permission, no library call` | S, P | `test/photos-device.test.ts` (extended), preflight, binary strings | A usage string; a `PHPhotoLibrary` call |
| NS-49-R7 | `[NS-49-R7] a suggestion becomes one stored picture` | I | `test/suggestions-flow.test.ts (stand-in)` | Delete the source URL; store two |
| NS-49-R9 | `[NS-49-R9] the phone's title is never stored unless the parent takes it` | U | `suggestions-flow.test.ts (stand-in)` | Copy the title at Keep |
| NS-49-R10 | `[NS-49-R10] only photos are read; the suggestion is not retained` | S, U | `test/suggestions-scan.test.ts`, Swift unit | Read a location item; keep the object |
| NS-49-R11 | `[NS-49-R11] cancel and empty write nothing` | I | `suggestions-flow.test.ts (stand-in)` | Create a draft on cancel |
| NS-49-R12 | `[NS-49-R12] a locked return is discarded` | I | `suggestions-flow.test.ts (stand-in)` | Accept a result while locked |
| NS-49-R13 | `[NS-49-R13] a suggestion leaves no mark` | I | `suggestions-flow.test.ts (stand-in)` | Write the title into Exif or a column |
| NS-49-R15 | `[NS-49-R15] entitlement only when the flag is on; security read` | S, P | preflight, `app.config.test.ts` | Entitlement without the flag |
| NS-49-R16 | `[NS-49-R16] the recent-days lines are true and read by counsel` | P | claims inventory | A sentence with no row |
| NS-49-R17 | `[NS-49-R17] assistive settings work` | U, D | `suggestions-a11y.logic.test.ts`, DV-6 | A 40 pt choice |
| NS-49-R19 | `[NS-49-R19] the suggestion file is validated` | U | `suggestions.logic.test.ts (stand-in)`; DV-9 | Follow a symlink; second open by path |
| NS-49-R21 | `[NS-49-R21] the suggestion id is never kept` | S | `days-canary.test.ts` | Log the id |
| NS-49-R23 | `[NS-49-R23] no detection of faces or scenes` | S | `photos-device.test.ts` | Import a Vision module |
| NS-49-R24 | `[NS-49-R24] canary finds nothing` | U | `days-canary.test.ts` | Log the title |
| NS-49-R25 | `[NS-49-R25] level 3 stays closed` | S, P | `photos-device.test.ts` allowlist (zero entries), preflight | A `NSPhotoLibraryUsageDescription` |
| NS-49-R26 | `[NS-49-R26] a spike produces a decision, not a feature` | P, S | release profile check | Enable the spike flag in a release profile |
| NS-49-R27 | `[NS-49-R27] label, review notes and the license read` | P | release checklist | No Notes for Review entry |
| NS-49-R28 | `[NS-49-R28] no launch crash below 17.2` | D | DV-8 | Strong-link the framework |
| NS-49-R33 | `[NS-49-R33] the suggestion flow makes no request` | U | `suggestions-flow.test.ts (stand-in)` | A fetch in the module |
| NS-49-R35 | `[NS-49-R35] the journaling purpose is evident and read by counsel` | P | counsel packet | Store listing omits the recent-days picker |

### 2.5 NS-50 (4 P0)
| Row | Exact title | Lvl | File | Mutant |
|---|---|---|---|---|
| NS-50-R2 | `[NS-50-R2] only today, never a list or a count` | U | `test/home-slips.test.ts` | Show tomorrow; "no days today" line |
| NS-50-R3 | `[NS-50-R3] the slip uses the landing words` | U | `home-slips.test.ts`, `days-lockscreen.test.ts` | A quiet day with a question |
| NS-50-R8 | `[NS-50-R8] a quiet book shows no day slip` | U | `home-slips.test.ts` | Ignore `quiet` |
| NS-50-R11 | `[NS-50-R11] Home is not a feed` | U, S | `home-slips.test.ts`, `test/home-feed-scan.test.ts` | Two slips; a count in a label |

## 3. P1 and P2 rows (95) and the standing journeys
Titles stay the cards' (`[NS-nn-Rn] ...`); each P1 row goes in the same test file as its neighbour above. Files: `days-planner.test.ts` (R9, R10, R11, R13, R15, R29, R33, R38 of NS-46), `days-timezones.test.ts` (NS-46-R10, R11, DST sweep), `days-page.logic.test.ts` (R3, R20, R40, R41, R43), `days-ask.test.ts` (NS-47-R19, R20, R30 to R33, R35), `home-slips.test.ts` (NS-50-R1, R4 to R7, R9, R10, R12, R14 to R17), `reminders-select-seam.test.ts` (NS-48 R6, R7, R8, R12 to R20, R22 to R25, R27, R29, R31 to R35, R37 to R39), `suggestions-menu.test.ts` (NS-49-R1, R2, R4, R5, R8, R14, R18, R22, R29 to R32, R34, R36, R37). P2 rows are listed, not blocking. NS-46-R44, R45, R47 and NS-50-R13, R18, NS-47-R27 are process rows (support macros, marketing scan, research) with a P-level check each.
Journeys (qa registers): J-N4 days (the loop above), J-N19 (quiet book: no day note, no slip; unquiet brings them back), J-N18 (canary), J-N24 and J-N27 (nothing on a lock screen names a child or a day beside it, device), J-N37 (J-CUL-01).
