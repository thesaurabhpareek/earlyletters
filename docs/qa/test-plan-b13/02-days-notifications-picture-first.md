# Test plan B13, part 02: days, cultural background, notification catalogue, picture-first, Home today (NS-46 to NS-50)

Owner agent: `qa` (Quality Engineer). Date: 20 Nov 2026. Base sha: `3e16f6a2` (branch `docs/test-plan-build-13`). Docs only; no test was written or run. Fixtures: the fictional family Asha only (Asha and Avi as in `apps/mobile/test/reminders-quiet-books.test.ts`); synthetic ids `zz-test-*` for days.

## Header

Sources read: `docs/product/prd/21-days-cultural-photos-home.md` (sections 7 of all five cards, drop table, founder items, conflicts); `functions/cultural-background-data.md` and `functions/notification-catalogue.md` (P0 priority cells and rows 01 to 16, 22 to 29); `tools/review/ns46-50/qa.md` (F-01 to F-21; the brief says F-01 to F-19, the file holds 21; it sits under `docs/product/prd/tools/`, not `tools/`); `14-test-plan.md` (J-N37 to J-N39, G0 to G6, device matrix); `18-errata-after-lock.md` (E31, E36, E45, E57, E61, E64, E73); `22`, `23`, `24`; `docs/tdd/new-scope/16-days-tests.md` (an earlier design of the same 87 rows; reused for mutants, corrected where it disagrees with E73). Code and tests: `apps/mobile/src/lib/reminders/*`, `apps/mobile/test/reminders-*.test.ts`, `packages/analytics/test/allowlist-pins.test.ts`, `packages/content/test/rules-drift.test.ts`, `apps/mobile/test/photos-device.test.ts`, `preflight-production.test.ts`, `capabilities.test.ts`. Not read: `CHECKS-AND-BALANCES.md`, `DEFINITION-OF-DONE.md`, catalogues A to D (not opened this run; UNVERIFIED that the row format below matches them exactly), `docs/design/e2e/*`, `packages/content/src/*` copy beyond greps.

Counts: rows read 182 (NS-46 50, NS-47 38, NS-48 39, NS-49 37, NS-50 18); P0 rows 87 (22, 27, 13, 21, 4), each with one case. Cases written 122 (counted by script): 87 P0 row cases, 21 P1 row cases, 14 cross-cutting (lock-screen walk 8, G6 and fixtures 6; of these 13 are P0 and 1 is P1, so P0 total 100, P1 total 22). Status of the 87 P0 row cases: BUILT 3, PARTIAL 7, GAP 71, DEVICE 1, DOC 5 (rows with a GAP CI half and a DEVICE or DOC half are counted GAP and say so). Cross-cutting: DEVICE 8, GAP 6. FR-CUL and FR-NTC P0 rows add no new case in Drop A or B: each maps to an NS row below.

Status legend: BUILT = a test file whose title cites the id (named). PARTIAL = a test covers part (part named). GAP = none (nothing under `apps/mobile/src/lib/days`, no `budget.ts`, `notification-key` exists since #1032 (NS-48 phase 1) and is covered in the NS-48 section, no `chooseSlip`, no `libraryDay` or `typedDay` in `apps/mobile/src`; checked by grep). DEVICE, DOC as in the brief. Mutant = the one-line change that must turn the case red; "(code not built)" is implicit for every GAP.

Drop column: taken from card 21 "Rows by drop" (A, B, C). The task asked for Drop A = NS-46, 47, 48 floor, 50; card 21, E31 and CL-015 say only NS-48 phase 1 is A and NS-46, 47, 50 are B (after `budget.ts`, typed days, the days store and counsel). I followed the card and list the conflict in Questions, item 1.

## 1. NS-46 days we mark

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-001 | NS-46-R2 | `[NS-46-R2] nothing is ticked for the parent` | U,S | P0 | B | Open Days, Browse, ask on empty store: 0 ticked, 0 planned; scan rows for `preTicked` | one row `preTicked: true` | content | GAP |
| T2-002 | NS-46-R4 | `[NS-46-R4] a ticked day adds no class` | U | P0 | B | Plan one `zz-test-day-a`: kind `libraryDay`, group `typedDay`, id `el.day.<iso>`, `PlannedClass` unchanged | add `libraryDay` to `PlannedClass`; id `days.<id>` | mobile | GAP |
| T2-003 | NS-46-R5 | `[NS-46-R5] a typed day does not recur` | U | P0 | B | Deliver a typed day on an injected clock: gone next day, absent a year on | keep delivered typed day a year | mobile | GAP (needs NS-18 typed days: no `typedDay` in src) |
| T2-004 | NS-46-R7 | `[NS-46-R7] birthday beats a library day` | U | P0 | B | Avi first birthday on a ticked day: only the birthday kept | swap ranks 2 and 3 | mobile | GAP |
| T2-005 | NS-46-R8 | `[NS-46-R8] two days one date one note` | U | P0 | B | `zz-test-day-a`+`b` same date: 1 note, neutral title, both names after tap, none moved | schedule both | mobile | GAP |
| T2-006 | NS-46-R14 | `[NS-46-R14] a moving day says around and can be moved` | U | P0 | C | `zz-test-about-two-authorities`: says "around", which-date row, "always" move survives next year | drop `precision: about` | content | GAP |
| T2-007 | NS-46-R16 | `[NS-46-R16] quiet days stay quiet` | U,S | P0 | B,C | Every `quiet` row: no question mark, no prompt, tone not editable | `?` in a quiet landing | content | GAP |
| T2-008 | NS-46-R17 | `[NS-46-R17] days copy passes the voice rules` | C | P0 | B | Rules test over landing, lock, picker, nextYear, door keys; each new regex has a positive and a negative self-test | "Happy" in a landing key | content | GAP (drift guard exists, see T2-088) |
| T2-009 | NS-46-R19 | `[NS-46-R19] the app never says a day is missing` | S,U | P0 | B | Render Days and Browse keys: no missing line, no count, no "complete your list" | "Not in the list?" line | content | GAP |
| T2-010 | NS-46-R22 | `[NS-46-R22] no look-back and no count` | S | P0 | B | Scan day keys for "last year", "again", "another", digits | "last year" in a body | content | GAP |
| T2-011 | NS-46-R23 | `[NS-46-R23] tradition review and source licence on record` | P | P0 | B,C | CI half: a tradition id reachable from Browse only if a reviewer record exists (pseudonymous id, tradition id, date, "read") | tradition id with no record | content | DOC (licence half: counsel) |
| T2-012 | NS-46-R25 | `[NS-46-R25] quiet book adds nothing` | U | P0 | B | Fixture F2 (below): quiet, hidden, included-off, all-quiet, paused book: 0 library notes each | ignore `quiet` in the library source | mobile | PARTIAL (`reminders-quiet-books.test.ts` [NS-13-R12], [NS-32-R14] cover month and birthday notes; library and paused parts GAP; no phone-side paused setting exists, only server column `celebrations_paused`, E64) |
| T2-013 | NS-46-R26 | `[NS-46-R26] Days page works with assistive settings` | U,D | P0 | B | Labels "{name}, around {date}", 44 pt, no count in a label, untick by tap, swipe, custom action; DV-6 on SE 3 at AX5 | a count in a row label | design-systems | GAP (logic) + DEVICE |
| T2-014 | NS-46-R27 | `[NS-46-R27] a day note never sells` | S | P0 | B | Scan day keys and the days module for Plus, price, allowance, entitlement | "Plus" in a body | content | GAP |
| T2-015 | NS-46-R30 | `[NS-46-R30] one chooser, one rule` | U | P0 | B | 500 plans, `SCRIBE_FUZZ_SEED` fixed and printed: no date with two budgeted notes; plan notices first; at most 60 | second `schedule` path outside `chooseOnePerDay` | mobile | GAP (`budget.ts` absent) |
| T2-016 | NS-46-R31 | `[NS-46-R31] day reminders do not need evening reminders on` | U,I | P0 | B | Reminders off, permission granted: day notes planned, evening not; undetermined: one iOS ask after first tick; denied: no ask slip | gate day sources on `prefs.enabled` | mobile | GAP |
| T2-017 | NS-46-R32 | `[NS-46-R32] a day reminder opens Home and carries no day` | U,S | P0 | B | Tap fake `libraryDay` response (warm and cold): route Home, data `{source, kind}`, id `el.day.<iso>`; later date opens plain Home | day id in `data` or route param | mobile | GAP (today `scheduler.ts:159` data is `{source, kind}`, so shape fits) |
| T2-018 | NS-46-R34 | `[NS-46-R34] day notes are never observed` | U | P0 | B | Four kinds return null from `notificationOpenedEvent`; consent on sends nothing | return an event for `libraryDay` | analytics | BUILT (`packages/analytics/test/allowlist-pins.test.ts`) |
| T2-019 | NS-46-R35 | `[NS-46-R35] consent line and opt-out are in the UI` | U,S | P0 | B | First tick shows the line first; Reminders off shows the calm line; no "new day" in a landing | tick without the line | mobile | GAP |
| T2-020 | NS-46-R36 | `[NS-46-R36] public titles are an allowlist` | U,S | P0 | B | List each `publicTitleOk` true row (5 seasonal ids); Christmas Day, Memorial Day, Columbus Day false; App lock on gives the neutral title for all | derive `publicTitleOk` from layer | content | GAP |
| T2-021 | NS-46-R46 | `[NS-46-R46] no public line misstates the day reminder time` | S | P0 | B | Scan `store.en.ts`, support page for "pick ... time" aimed at day reminders | leave the line as is | content | GAP (live today: `store.en.ts:79` says "You pick the days and the time"; the test must scope to day reminders or the evening sentence fails it, see Q4) |
| T2-022 | NS-46-R48 | `[NS-46-R48] the library fetch does not vary with the store` | U | P0 | B | Fetch with empty store and all-ticked: request logs byte-identical (0 while bundled) | query derived from ticks | mobile | GAP |
| T2-023 | NS-46-R6 | `[NS-46-R6] ticks store ids, not dates` | U | P1 | B | Corrected table in an update re-resolves; unknown higher version read, not rewritten | store the date | mobile | GAP |
| T2-024 | NS-46-R9 | `[NS-46-R9] plan notice and ceilings hold` | U | P1 | B | 70 candidates: 60 total, plan notices first, nearest by fire date stay (Q-QA-4 default) | drop plan notice first | mobile | GAP |
| T2-025 | NS-46-R10 | `[NS-46-R10] library day time, window and horizon` | U | P1 | B | Zones LA, NY, Sydney, Kiritimati, Pago_Pago; 09:00 clamped to window; DST crossing; 366 days | read runner zone | mobile | GAP |
| T2-026 | NS-46-R28 | `[NS-46-R28] remote pause hides the library only` | U | P1 | B | Config `killSwitches.libraryDays` true hides; absent or non-true stays on; typed days unaffected | treat `"true"` string as pause | mobile | GAP (pattern: `capabilities.ts` `mayRun`) |
| T2-027 | NS-46-R33 | `[NS-46-R33] store and pause changes re-plan` | U | P1 | B | Tick, untick, move, clear: re-plan within 1.5 s on fake timers | no change event | mobile | GAP |
| T2-028 | NS-46-R42 | `[NS-46-R42][NS-46-R4] library works under every standing state` | I | P1 | B | One parametrised test over six standing states, title lists each id proved | skip offline | mobile | GAP |
| T2-029 | NS-46-R12 | `[NS-46-R12] rule dates are computed and match` | U | P1 | B | Computus and nth-weekday vs sourced oracle 2026 to 2030; fails if oracle has no source | oracle generated from code | content | GAP |

## 2. NS-47 cultural background and the lock-screen rules

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-030 | NS-47-R1 | `[NS-47-R1] the whole store is L4 and registered` | S | P0 | B | Registry holds the days file with scope, sign-out, Erase, backup, export, sync | omit registry row | security | GAP |
| T2-031 | NS-47-R2 | `[NS-47-R2] picks are a filter; only ticks are stored` | U | P0 | B | Pick tradition, close: only ticks and `culture.asked` written; no route param, no `setSetting` | persist the pick | mobile | GAP |
| T2-032 | NS-47-R3 | `[NS-47-R3] nothing is attached to the child` | S | P0 | B | Scan children, entries, books, shares for tradition or country columns and labels | `tradition` column on children | data | GAP |
| T2-033 | NS-47-R4 | `[NS-47-R4] no request carries a day key` | U,S | P0 | B | Network fake over ask, tick, clear, claim, re-plan: 0 hits; migration lint is whole-word with allowlist (F-15: `han_traditional`) | fetch with a day id | data | GAP |
| T2-034 | NS-47-R5 | `[NS-47-R5] a day note leaves no trace in the synced row` | I | P0 | B | Prompt selector ignores the day (pure); one save on `sync-v1-standin.ts` equals a control letter (F-16) | day id as `prompt_key` | sync | GAP |
| T2-035 | NS-47-R6 | `[NS-47-R6] the store is out of the backup and fails closed` | U,D | P0 | B | Call-order fake: empty file, exclusion, read-back, bytes; false read-back writes 0 bytes; device transfer in J-N37 | write bytes before read-back | mobile | GAP + DEVICE |
| T2-036 | NS-47-R7 | `[NS-47-R7] claim and new phone move nothing` | I | P0 | B | Claim re-keys unchanged, 0 uploads; new phone empty; any other first sign-in deletes the local file (E73) | adopt on first sign-in without claim | mobile | GAP |
| T2-037 | NS-47-R8 | `[NS-47-R8] canary finds nothing` | U | P0 | B | `zz-test-tradition`, `zz-test-day-a`, `zz-test-country` through ask to tap: 0 hits in logs, ids, `userInfo`, URLs | log the id in a failure path | qa | GAP |
| T2-038 | NS-47-R9 | `[NS-47-R9] analytics allowlist rejects day data` | U | P0 | B | Validator drops a day-vocabulary event or value | add `tradition_picked` | analytics | BUILT (`allowlist-pins.test.ts`) |
| T2-039 | NS-47-R10 | `[NS-47-R10] the export holds none of it` | U | P0 | B | Save a copy with a full days file and every key set: grep bytes | read days file in the export builder | mobile | GAP |
| T2-040 | NS-47-R11 | `[NS-47-R11] one reader` | S | P0 | B | Import graph: only the days module reads the store; positive-control importer fails | import store from analytics | mobile | GAP |
| T2-041 | NS-47-R12 | `[NS-47-R12] one neutral body; the name only behind its switch` | U | P0 | B | Switch x App lock x tone x layer: one neutral body per tone, no day, tradition, country, child; stored switch off after App lock on and does not return | stored value survives App lock | mobile | GAP (App lock forces child names off today: `prefs.ts:117`; day-name switch not built) |
| T2-042 | NS-47-R13 | `[NS-47-R13] public days may name themselves; others need the switch` | U | P0 | B | Enumerate every `days.*` key, four switch combos, title and body | title named for a family day | mobile | GAP |
| T2-043 | NS-47-R15 | `[NS-47-R15] sign-out clears and B sees nothing` | I | P0 | B | A signs out: file gone before first await, delivered notes dismissed, B asked afresh; system-ended session clears and says one calm line | clear on A's id only | mobile | GAP |
| T2-044 | NS-47-R16 | `[NS-47-R16] erase scan finds nothing` | I | P0 | B | Erase with days and `dismissedOn`: nothing left; kill mid-erase resumes | leave a key in `settings` | mobile | GAP (extend `erase-all.test.ts`) |
| T2-045 | NS-47-R17 | `[NS-47-R17] delete account line and clear` | U,I | P0 | B | Store cleared here; line does not claim other phones cleared | line claims offline phone cleared | mobile | GAP |
| T2-046 | NS-47-R18 | `[NS-47-R18] first run has no such field` | S | P0 | B | Field-inventory test unchanged; no tradition field on E-S01 to E-S08 | field on E-S08 | mobile | GAP |
| T2-047 | NS-47-R21 | `[NS-47-R21] untick and clear all` | U,I | P0 | B | Untick; Clear all: store empty, pending cancelled, delivered dismissed | Clear all leaves a pending note | mobile | GAP |
| T2-048 | NS-47-R22 | `[NS-47-R22] call-out claims are true` | S | P0 | B | Call-out keys vs banned claims ("private", "invisible", "nobody can tell"); each sentence has a claims row | "nobody can tell" in call-out | content | GAP |
| T2-049 | NS-47-R23 | `[NS-47-R23] label re-run for the days store` | P | P0 | B | CI half: no network or analytics import in the days module; label read per build | fetch client in days module | privacy | DOC |
| T2-050 | NS-47-R24 | `[NS-47-R24] days are never shared` | U | P0 | B | Two-parent fixture: Family and invite sheets show no day, count, hint | other parent's count on Family | mobile | GAP |
| T2-051 | NS-47-R25 | `[NS-47-R25] the ask and lists work with assistive settings` | U,D | P0 | C | "Not now" same size and style as primary; AX5, VoiceOver, Voice Control; DV-6 | "Not now" smaller | design-systems | GAP + DEVICE |
| T2-052 | NS-47-R26 | `[NS-47-R26] unlocked only; blank snapshot` | U,D | P0 | B | Cover raised on inactive for C-S24 to C-S26 with and without App lock; Home names a day only today; DV-5 | no cover for C-S24 | mobile | PARTIAL (`app-lock-wiring.test.ts` PrivacyCover, App lock case only) |
| T2-053 | NS-47-R29 | `[NS-47-R29] call-out visible, static and first` | U | P0 | B | DoorNote static, first in reading order, not collapsible | collapsible DoorNote | design-systems | GAP |
| T2-054 | NS-47-R34 | `[NS-47-R34] analytics allowlist rejects day vocabulary` | U | P0 | B | Stems rejected as event, key, enum, route, `settings_changed.key`, insights column | add `holiday` to an enum | analytics | BUILT (`allowlist-pins.test.ts`) |
| T2-055 | NS-47-R36 | `[NS-47-R36] no category shows a title with previews hidden` | U,D | P0 | B | Read every category: no `hiddenPreviewsShowTitle`, `previewPlaceholder` is the one neutral string; Show Previews Never on a phone | `hiddenPreviewsShowTitle: true` | mobile | GAP (no category is set today: `scheduler.ts` sends no `categoryIdentifier`) + DEVICE |
| T2-056 | NS-47-R38 | `[NS-47-R38] no day name beside a child name on a lock screen` | U | P0 | B | Enumerate every title and body in every state: no string holds both tokens; neutral body has no `{child}` | named title with `{child}` body | mobile | GAP |
| T2-057 | NS-47-R14 | `[NS-47-R14] the switch says what it shows` | U | P1 | C | Help line on C-S24; D-S06 line says "for your child's name" | line missing | content | GAP |
| T2-058 | NS-47-R19 | `[NS-47-R19] the ask comes once, later` | U | P1 | C | Not in the Keep-gate, reminder-ask or rating sitting; denied permission hides it; `done` never shows | show in same sitting | mobile | GAP |
| T2-059 | NS-47-R37 | `[NS-47-R37] typed day words follow the day-name switch` | U | P1 | C | Typed day on a lock screen only behind `notifications.dayNames`; `lockScreenNames` covers child only | typed day follows `lockScreenNames` | mobile | GAP |

## 3. NS-48 catalogue and rotation (Drop A is the floor: R1, R2, R10, R11, R28, R36 are the P0 rows in Build 13)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-060 | NS-48-R1 | `[NS-48-R1] same inputs same key; every key exists` | U | P0 | A | Same cell and ordinal twice: same key; every key in content; no orphan | `Math.random` in the pick | mobile | PARTIAL (`packages/core/test/notification-key.test.ts` and `apps/mobile/test/reminders-key.test.ts` cite NS-48-R1 on develop since #1032; assertion depth UNVERIFIED; row was GAP at this plan's base) |
| T2-061 | NS-48-R2 | `[NS-48-R2] volume is unchanged` | U | P0 | A | Planner with floor-only `select` vs catalogue: identical (id, date, time, class) sets across cadences and zones | selector adds a note | mobile | PARTIAL (`allowlist-pins.test.ts`: analytics half only; no `select` seam in `planner.ts`) |
| T2-062 | NS-48-R3 | `[NS-48-R3] recency is computed at plan time` | U | P0 | C | Band edges r1 to r4 with injected clock; anchor = `captured_at` clamped; rebuild after zone change is identical | clock read at delivery | mobile | GAP |
| T2-063 | NS-48-R4 | `[NS-48-R4] no gap in the words` | S | P0 | C | Scan r1 to r4 lines for gap, count, comparison; meaning by a signed reviewer sheet (S+P) | "a while" in an r4 line | content | GAP |
| T2-064 | NS-48-R5 | `[NS-48-R5] the kind may shape the body, never the title` | U,S | P0 | C | Each kind: body only; `first`, `small` only with names on and App lock off; no `picture` kind | kind word in a title | mobile | GAP |
| T2-065 | NS-48-R9 | `[NS-48-R9] the catalogue honours the lock-screen rules` | U | P0 | B | Family, tradition, national day, names off: neutral strings, no day or faith word | catalogue overrides neutral body | mobile | GAP |
| T2-066 | NS-48-R10 | `[NS-48-R10] every variant passes the rules test` | S,C | P0 | A | Every variant, both renderings: 40/110, no `!`, emoji, dash, curly quote, ellipsis, "note", "story"; VOICE.md line 70 corrected (live today: says one `!` a month) | 41-char title | content | PARTIAL (`rules-drift.test.ts` enforces 40/110 and zero `!` on notification-scoped keys; ntc keys absent) |
| T2-067 | NS-48-R11 | `[NS-48-R11] no child name by default` | S,U | P0 | A | Neutral form of every title: no child name, no `{child}` in a new title; the built 8 keep named titles only when names on | `{child}` in a new title | content | PARTIAL (`reminders-never-list.test.ts` [NS-13-R6a]; `app-lock-behaviour.test.ts` F17-REQ-015) |
| T2-068 | NS-48-R21 | `[NS-48-R21] a quiet book adds nothing to a key` | U | P0 | B | F2 fixture: quiet, hidden, included-off book adds no band, name, kind to a cell | read `quiet` after key built | mobile | GAP |
| T2-069 | NS-48-R26 | `[NS-48-R26] the one-a-day budget has one enforced place` | U | P0 | B | Same property run as T2-015 over all sources incl. birthday for one child and month for another | second `schedule` call | mobile | GAP |
| T2-070 | NS-48-R28 | `[NS-48-R28] every notification key is under the notification rules` | S | P0 | A | Plant a `days` family outside the index: drift test fails; positive control; real keys read once added | unexported family | content | PARTIAL (`packages/content/test/rules-drift.test.ts` built; no days, culture, ntc family yet to prove) |
| T2-071 | NS-48-R30 | `[NS-48-R30] no age norm in a reminder` | S | P0 | C | Scan kind and age-band lines for yet, already, still, by now, should, milestone verbs | "already" in a toddler line | content | GAP |
| T2-072 | NS-48-R36 | `[NS-48-R36] no pregnancy words on a lock screen` | U,S | P0 | A | Asha with due date, no birth date: both renderings name no pregnancy; lock rendering is the neutral evening line | "before birth" in lock text | mobile | GAP |
| T2-073 | NS-48-R14 | `[NS-48-R14] rotation without repeats` | U | P1 | A | 365 slots per cadence, fixed `SCRIBE_FUZZ_SEED` printed: no repeat, no shape three in a row | stateful counter | mobile | GAP |
| T2-074 | NS-48-R15 | `[NS-48-R15] the floor always answers` | U | P1 | A | Every hour and cell returns a key | empty cell | mobile | GAP |
| T2-075 | NS-48-R16 | `[NS-48-R16] interruption level and placeholder` | U | P1 | A | Level `active`, never time-sensitive; one neutral placeholder per category | time-sensitive level | mobile | GAP |
| T2-076 | NS-48-R23 | `[NS-48-R23] update re-plans; the built 8 are unchanged` | U | P1 | A | Golden: the built 8 render identically after re-key | reword a built line | content | GAP |
| T2-077 | NS-48-R33 | `[NS-48-R33] the floor covers every hour` | U | P1 | A | 24 hours x cadences return a key; no evening word before 17:00 (R12) | untagged evening word | content | GAP |

## 4. NS-49 picture-first and Journaling Suggestions (Drop B: R1, R3, R4, R25, R26; Drop C: the rest, behind `EXPO_PUBLIC_SUGGESTIONS`)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-078 | NS-49-R3 | `[NS-49-R3] no note about the picture` | U,S | P0 | B | Scan keys and `PlanInput` for any picture field or "photo" line | picture field on `PlanInput` | content | GAP |
| T2-079 | NS-49-R6 | `[NS-49-R6] no permission, no library call` | S,E | P0 | C | Source, `package.json` deny list, resolved plist and entitlements per EAS profile; binary strings read saved to gate record (F-08) | `NSPhotoLibraryUsageDescription` added | security | GAP + DOC (binary read) |
| T2-080 | NS-49-R7 | `[NS-49-R7] a suggestion becomes one stored picture` | I | P0 | C | Stand-in JPEG, HEIC, Live Photo still: one stored copy, only the app's copy deleted | delete Apple's URL | mobile | GAP (stand-in) |
| T2-081 | NS-49-R9 | `[NS-49-R9] the phone's title is never stored unless the parent takes it` | U | P0 | C | Four titles of E61: Keep without tap stores no title; Use this copies; text exact; Clear empties | copy at Keep | mobile | GAP (stand-in) |
| T2-082 | NS-49-R10 | `[NS-49-R10] only photos are read; the suggestion is not retained` | S,U | P0 | C | Scan fails on any other `JournalingSuggestion` type or `.items`; fake suggestion with location, workout, contact untouched | read a location | security | GAP (+ Swift unit) |
| T2-083 | NS-49-R11 | `[NS-49-R11] cancel and empty write nothing` | I | P0 | C | Cancel, decline, empty: no draft, 0 files, no message | draft on cancel | mobile | GAP |
| T2-084 | NS-49-R12 | `[NS-49-R12] a locked return is discarded` | I | P0 | C | Result while App lock up: 0 files; no picture in switcher | accept while locked | mobile | GAP |
| T2-085 | NS-49-R13 | `[NS-49-R13] a suggestion leaves no mark` | I | P0 | C | Level 1 vs level 2 stand-ins, injected ids and clock: stored bytes, row, export bytes identical | title into Exif | mobile | GAP |
| T2-086 | NS-49-R15 | `[NS-49-R15] entitlement only when the flag is on; security read` | S | P0 | C | Resolved entitlements per profile: `com.apple.developer.journal.allow` only where flag on | entitlement with flag off | security | GAP + DOC |
| T2-087 | NS-49-R16 | `[NS-49-R16] the recent-days lines are true and read by counsel` | P | P0 | C | Each door sentence has a claims row citing the R10 scan | sentence with no row | privacy | DOC |
| T2-088 | NS-49-R17 | `[NS-49-R17] assistive settings work` | U,D | P0 | C | Choice and one-photo sheet 44 pt, labelled, reachable; DV-6 | 40 pt choice | design-systems | GAP + DEVICE |
| T2-089 | NS-49-R19 | `[NS-49-R19] the suggestion file is validated` | U,D | P0 | C | Stand-in: symlink, directory, 0 byte, outside container, odd type refused; real container on iOS 17.2 (DV-9) | follow a symlink | security | GAP + DEVICE |
| T2-090 | NS-49-R21 | `[NS-49-R21] the suggestion id is never kept` | S | P0 | C | Canary id through the notification path: not logged or stored | log the id | qa | GAP |
| T2-091 | NS-49-R23 | `[NS-49-R23] no detection of faces or scenes` | S | P0 | C | Scan module and photo folders for Vision, face, scene imports | import Vision | security | GAP |
| T2-092 | NS-49-R24 | `[NS-49-R24] canary finds nothing` | U | P0 | C | Canary title, place, workout through the module: 0 hits | log the title | qa | GAP |
| T2-093 | NS-49-R25 | `[NS-49-R25] level 3 stays closed` | S | P0 | B | Scan all source and each profile's plist for usage string, `PHPhotoLibrary`, MediaLibrary, background fetch; positive control | add a usage string | security | PARTIAL (`photos-device.test.ts` is the NS-01 sweep only; no scan for these strings found) |
| T2-094 | NS-49-R26 | `[NS-49-R26] a spike produces a decision, not a feature` | S,P | P0 | B | No EAS release profile enables the spike flag; test fails any that does | flag on in `production` | security | GAP |
| T2-095 | NS-49-R27 | `[NS-49-R27] label, review notes and the license read` | P | P0 | C | CI half: review notes hold the entitlement section when flag on; counsel on DPLA 3.3.3(H), 5.1.3 | section removed | privacy | DOC |
| T2-096 | NS-49-R28 | `[NS-49-R28] no launch crash below 17.2` | D | P0 | C | Podspec weak-link and platform 17.0, `#available(iOS 17.2, *)` scan; launch Home on iOS 17.0, 17.1, 17.2, 26 and iPad (J-N39) | strong-link the framework | qa | DEVICE (no 17.0/17.1 phone recorded: row is "not run", G4 fails) |
| T2-097 | NS-49-R33 | `[NS-49-R33] the suggestion flow makes no request` | U | P0 | C | Network fake across open, pick, cancel, keep, erase: 0 requests, no share call | fetch in module | mobile | GAP |
| T2-098 | NS-49-R35 | `[NS-49-R35] the journaling purpose is evident and read by counsel` | P | P0 | C | CI half: store listing names the recent-days picker when flag on; counsel on the BRAND "journal" ban | line removed | privacy | DOC |
| T2-099 | NS-49-R5 | `[NS-49-R5] the choice is absent where it cannot work` | U | P1 | C | `isAvailable()` false below 17.2, Android, Expo Go, flag off, entitlement absent: absent not greyed | greyed control | mobile | GAP |
| T2-100 | NS-49-R14 | `[NS-49-R14] flags only narrow` | U | P1 | C | Remote config cannot turn level 2 on | config enables | mobile | GAP |
| T2-101 | NS-49-R29 | `[NS-49-R29] entry control by availability` | U | P1 | C | Menu shows level 1 only when level 2 absent | dead button | mobile | GAP |

## 5. NS-50 Home today

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-102 | NS-50-R2 | `[NS-50-R2] only today, never a list or a count` | U | P0 | B | `chooseSlip` with a day today, tomorrow, none: slip only for today | "no days today" line | mobile | GAP (no slip registry or `FRAME-SLIP` in src) |
| T2-103 | NS-50-R3 | `[NS-50-R3] the slip uses the landing words` | U | P0 | B | Bright, quiet, two-day: `days.landing.*`; quiet has no question | question on a quiet day | mobile | GAP |
| T2-104 | NS-50-R8 | `[NS-50-R8] a quiet book shows no day slip` | U | P0 | B | Fixture F2: quiet, hidden, included-off active book: no day slip | ignore `quiet` | mobile | GAP |
| T2-105 | NS-50-R11 | `[NS-50-R11] Home is not a feed` | U,S | P0 | B | Every state: at most one slip, no count in a label (R11a; the strip gate R11b is research, P) | two slips | mobile | GAP |
| T2-106 | NS-50-R4 | `[NS-50-R4] a day shows one way` | U | P1 | B | Arrive by tap or by opening: same slip | second D-S11 state | mobile | GAP |
| T2-107 | NS-50-R5 | `[NS-50-R5] the slip order is one registry` | U | P1 | B | Unregistered slip fails (`[FRAME-SLIP]`); order 1, 2b, 3, 3b | unregistered slip | mobile | GAP |
| T2-108 | NS-50-R9 | `[NS-50-R9] snapshot has no day name` | D | P1 | B | App switcher with a day slip, DV-5 | name in snapshot | mobile | DEVICE |

## 6. Lock-screen leak cases (J-N37 and J-N24; device; phone with Asha-only install)

Every row: arrange a ticked `publicTitleOk` day, a ticked family day, a typed day and an evening reminder on the Asha book; names switch and day-name switch each on and off; fire on a real phone; record observed title and body in `docs/qa/evidence/<date>-<build>-<phone>.md` (screenshot with Asha only). Pass = no child name unless names on and App lock off; no faith, tradition or country word unless day-name switch on and App lock off; no day name beside a child name in any state. UNVERIFIED in the cards: whether a hidden body shows on Watch, Notification Center and Focus summary, so none of these may be marked passed from the Simulator.

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-110 | NS-47-R36, NS-47-R12 | `[NS-47-R36] J-N37 Show Previews Never` | D | P0 | B | Settings > Notifications > Show Previews: Never, When Unlocked, Always; each state: only the neutral placeholder under Never | category with title shown | qa | DEVICE |
| T2-111 | NS-47-R13, R38 | `[NS-47-R13] J-N37 Notification Center and lock screen` | D | P0 | B | Both locked and unlocked, App lock on and off, four switch combos | named title with App lock on | qa | DEVICE |
| T2-112 | NS-47-R12 | `[NS-47-R12] J-N37 Notification Summary` | D | P0 | B | Scheduled summary on: one neutral body, no day, no child | named summary row | qa | DEVICE |
| T2-113 | NS-47-R12 | `[NS-47-R12] J-N37 Apple Watch mirror` | D | P0 | B | Paired watch (UNVERIFIED availability: Q-FD-33 phones): title and body as the phone's | child name on wrist | qa | DEVICE (needs a watch; not recorded as owned) |
| T2-114 | NS-47-R12 | `[NS-47-R12] J-N37 CarPlay` | D | P0 | B | CarPlay or simulator-less head unit: nothing reads aloud a child or day name (UNVERIFIED that a unit is available) | name read aloud | qa | DEVICE (not run unless a unit exists) |
| T2-115 | NS-47-R12 | `[NS-47-R12] J-N37 Focus summary` | D | P0 | B | Focus on: summary shows the neutral placeholder | named row in summary | qa | DEVICE |
| T2-116 | NS-47-R6 | `[NS-47-R6] J-N37 device transfer` | D | P0 | B | Backup and restore to a second phone: days list empty, ask not shown again; call-out words match | store restored | qa | DEVICE |
| T2-117 | NS-48-R11 | `[NS-48-R11] J-N24 default settings week` | D | P0 | A | Defaults, reminders on, one week: no child name or letter word on any lock screen | name in a title | qa | DEVICE (J-N24 is registered; this run adds the catalogue) |

## 7. Flag-off production check (G6) and shared fixtures

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T2-120 | NS-49-R15, R25, R26 | `[NS-49-R25] G6 every EAS production profile has the flags off` (PROPOSED title) | S | P0 | B | Resolve each profile in `eas.json`: `EXPO_PUBLIC_DAYS`, `EXPO_PUBLIC_SUGGESTIONS` unset or off, `killSwitches.libraryDays` parses; no photo usage string, no journal entitlement | set `EXPO_PUBLIC_DAYS=on` in `production` | qa | GAP (host: `preflight-production.test.ts`; `capabilities.test.ts` pins only `EXPO_PUBLIC_SERVER_FEATURES`) |
| T2-121 | NS-49-R25 | `[NS-49-R25] G6 positive control` (PROPOSED) | S | P0 | B | Fixture config with each flag on, usage string, entitlement: the check fails each | check returns pass on fixture | qa | GAP |
| T2-122 | NS-46-R28 | `[NS-46-R28] G6 flag pins` (PROPOSED) | S | P1 | B | Pinned list in `capabilities.test.ts` gains both flags; older signed config parses `libraryDays` as off | flag missing from pins | mobile | GAP |
| T2-123 | NS-47-R36 | `[NS-47-R36] G6 no days flag, no category` (PROPOSED) | U | P0 | B | Flag off in a production build: planner emits no `libraryDay`, no category registered, no Days route | day source ignores the flag | mobile | GAP |
| T2-124 | NS-46-R25, NS-48-R21, NS-50-R8 | fixture F2 `apps/mobile/test/helpers/reminders-books.ts` (PROPOSED) | U | P0 | B | Asha plus Avi in five states: active, quiet, hidden, included-off, paused; one export reused by all three rows | each row builds its own | qa | GAP (Asha and Avi exist inline in `reminders-quiet-books.test.ts`) |
| T2-125 | NS-46-R8, R36 | fixture F3 `apps/mobile/test/helpers/synthetic-days.ts` (PROPOSED) | U | P0 | B | `zz-test-day-a`, `-b`, `-quiet`, `-public`, `-about-two-authorities`; real tradition never beside Asha | real pair on Asha's book | qa | GAP |

## FR-CUL and FR-NTC P0 rows: one case each, already counted above

FR-CUL-01 to 04 = T2-030 to T2-033; 05 = T2-034; 06 = T2-035; 07 = T2-036; 08 = T2-037; 09 = T2-038; 11 = T2-040; 12 = T2-041; 15 = T2-043; 16 = T2-044; 21 = T2-047; 22 = T2-048; 23 = T2-049. FR-NTC-01 = T2-060; 02 = T2-061; 03 = T2-062; 04 = T2-063; 05 = T2-064; 09 = T2-065 and T2-042; 10 = T2-066; 11 = T2-067. FR-NTC-08 (P0 c, ticked day wins slot, ignores recency, survives back-off) maps to NS-46-R7 (T2-004) and NS-48-R8 (P1), which is a priority mismatch (Q5). FR-CUL-28 to 35 and FR-NTC-22 to 29 (photo moments, NS-51) are P0 but are not in Build 13 or Drop A or B (NS-51 ships 1.1, E32, CL-052): no cases here; they belong to part 03. FR-NTC-29 restates NS-48-R5 and NS-49-R3 (T2-064, T2-078).

## Findings reconciled (qa.md F-01 to F-21 against the locked card)

| Finding | State in the locked card or repo | Action in this plan |
|---|---|---|
| F-01 rules test blind to new keys | Applied: NS-48-R28; `rules-drift.test.ts` is built | T2-070: needs a positive control with a planted key family |
| F-02 "note" reserved | Applied in NS-48-R10 | T2-066 scans "note" |
| F-03 R17 contradicts Mother's Day | Applied: `days.name.*` has its own rule | T2-008 splits scope |
| F-04 real traditions beside Asha | Applied (R8 synthetic) | T2-125 |
| F-05 quiet reader missing | Stale: `plannerChildren` carries `quiet` and `reminders-quiet-books.test.ts` proves it for current kinds | T2-012 PARTIAL; paused has no phone reader (E64) |
| F-06 launch crash below 17.2 | Applied: NS-49-R28 | T2-096 |
| F-07 stand-in seam | Applied: NS-49-R31 (P1) | every NS-49 stand-in case says (stand-in) |
| F-08 scan cannot see dependencies | Applied in R6 | T2-079 |
| F-10 date-driven red test | Applied: R24 `daysDueOn` | not in P0 set; add with Drop B |
| F-12 priority labels | R17, R18, R25 now P0; R10 and R24 of NS-47 P0 | none |
| F-13 G6 untested | Open: no check exists | T2-120 to T2-123 |
| F-14 journeys without ids | Applied: J-N37 to J-N39 in `14` | section 6 |
| F-15 migration lint | Open | T2-033 owner `data-architect` for the lint |
| F-17 backup exclusion half device | Open | T2-035, T2-116 |
| F-18 catalogue seam, F-19 slip registry | Open; neither built | T2-061, T2-102 |

## Order of build

1. Drop A, Build 13 (words only, no new setting): T2-066, T2-067, T2-070 (rules-drift positive control), T2-060, T2-061 (the `select` seam), T2-072, T2-073 to T2-077, and J-N24 (T2-117) on a phone. They need no planner foundation, so they are the only P0 set that can go green in Build 13 and they guard the lock screen first.
2. Right after, still cheap: G6 (T2-120 to T2-123). It must exist before any flag is added, or the first flag ships unchecked; build the positive control before the first `EXPO_PUBLIC_DAYS` line lands in `eas.json`.
3. Fixtures F2 and F3 (T2-124, T2-125), then `budget.ts` cases (T2-015, T2-069): hard prerequisite of NS-46 and NS-48-R26 (card conflict 6). Then the days store cases (T2-030 to T2-050) behind G1.
4. Drop B then needs the lock-screen walk (section 6) on a phone before any day flag is on; write the case sheets now so the founder's hands row (DV-1) is a checklist.
5. Drop C last: NS-49 stand-in cases need the native seam; device row T2-096 gates G4.

## Risks (how these tests could lie)

- Stand-ins: NS-49 cases run on a JS stand-in; a validator stricter than Apple's real container passes CI and fails on every phone (T2-089 needs the device row).
- Clocks and zones: every time row needs an injected clock and an explicit zone; a test that reads the runner zone passes on a Pacific laptop. Oracles for dates must be a sourced table, never computed by the code under test (R11, R12).
- Source scans pass vacuously: each S case needs a positive control (planted violation) or it proves nothing; `rules-drift.test.ts` has none for the days or ntc families yet.
- Simulator and notification-category behaviour: Show Previews, Summary, Watch, CarPlay and Focus cannot be proven in CI; no case in section 6 may be ticked from a simulator.
- Fixtures drift: if each row builds its own quiet book, R25, NS-48-R21 and NS-50-R8 can disagree about what "quiet" means (F2).
- Counted-as-built risk: `trace.mjs` does not read NS ids (G0), so a title that cites an id is not yet counted; BUILT here means the file exists and cites the id, not that trace sees it.
- A 17.0 or 17.1 phone is not recorded as owned, so T2-096 may stay "not run" and G4 cannot pass.

## Questions for the owner

1. Drop A scope. The task says A = NS-46, 47, 48 floor, 50; card 21 "Release line and cut" (lines 158 to 180), E31 and CL-015 say A = NS-48 phase 1 only and NS-46, 47, 50 are B after `budget.ts`, BL-982 typed days, the days store and counsel. No Build 13 ruling is in the repo (`23-dependency-map-and-plan.md` line 165 says the Build 13 list is a proposal). Owner: product and Karma. If the task wins, 74 P0 cases move to A with no `budget.ts` yet.
2. `docs/tdd/new-scope/16-days-tests.md` adds `[NS-47-R15]` "first sign-in adopts the local file"; E73 (18-errata line 253) says only the claim step adopts and any other first sign-in deletes the file. T2-036 follows E73. Owner: mobile.
3. NS-47-R25, NS-46-R14, NS-47-R19 are P0 or gate P0 text but carry drop C while the lock-screen rule for the ask (R25 "Not now" same size) applies the day the ask ships. Is the ask really absent in Drop B? (card 21 NS-47 rows by drop.) Owner: product.
4. NS-46-R46: `store.en.ts:79` says "You pick the days and the time" about evening reminders, which stays true. Should the scan flag it or only lines that name day reminders? Owner: content.
5. FR-NTC-08 is P0 (c) but its carrier NS-48-R8 is P1. I did not upgrade. Owner: product.
6. NS-46-R49 and the paused clause of NS-46-R25: no phone-side setting exists (only `child_member_prefs.celebrations_paused`; E64 says the phone owns it). Is the phone setting part of Drop B? Owner: mobile, sync.
7. NS-47-R12 and R13 depend on `notifications.dayNames` and a category set that do not exist; keys marked PROPOSED in the card. Counsel read (Q-DAY-6) can change the strings; the cases assert structure, not words. Owner: content.
8. CarPlay and Apple Watch: no source says the founder owns either. If neither is available T2-113 and T2-114 stay "not run". Owner: founder (hands list).
