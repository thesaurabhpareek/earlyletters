# NS-53 Moments: architecture alignment check, mobile owner

Status: PROPOSED (a read-only check; it decides nothing and changes no code, spec, backlog row or test)
Date: 21 Nov 2026
Owner: `mobile`
Base read: `origin/develop` at `abc7d57e6` (worktree branch `docs/moments-alignment-mobile`; every line cite below is on `abc7d57e6`, and the corrections of 21 Nov were made on `f308da806`)
Read: `docs/product/moments-tab/ARCHITECTURE-BRIEF.md` (AB), `HARNESS-REPLAN-HYBRID.md` (HR), `row-homes.mjs`, `docs/product/prd/28-moments-tab.md` sections 19.4 and 26b (spec), `docs/BACKLOG.md` BL-1432 to BL-1438 and BL-1447 to BL-1453 (lines 7228 to 7306).

Rulings applied on 21 Nov (docs-only edits): the dependency edits of section 4 items 1 to 3, R227 to PR 6, `moment` to PR 19, the PR 6 owner split, the PR 23 test, the BL-1453 line, G3-x as its own wave A item; the one-picture gap of item 4 is the founder's O-62 with the default of one picture. The findings below are as written on the base.

Labels: a `file:line` was read this session on `abc7d57e6`. UNVERIFIED means I did not read a primary source or could not run the thing. Facts only; where I recommend, the line starts with "Recommend". Fictional family Asha only. Nothing here is a founder decision.

`node docs/product/moments-tab/row-homes.mjs` run on this base: 301 rows, 41 PR ids in 19.4, 0 orphans, 0 problems, `rowsWithAutomatedTest: 0` (no row is cited by a test yet, as expected before PR 1).

## 1. Summary

- (a) PR homes: the homes in spec 26b and BL rows are right for scribe-library (9, 10, 11b, 11c, 18), scribe-picker (11a, 18a, 18b-1a, 18b-1b, 18b-1c, 18d, 19b, 25a), the `moments.json` store (8) and `exportForAttach` (18). Three homes need correction: the tab and nav tests (the list of tests that assert three tabs is incomplete, and the decision id cited is the wrong row), the `moment` capture source (PR 6 versus PR 19), and `routeForReminder` (one more test pins it). PR 6 is owned by `design-systems` in 19.4 but nearly all its files are `mobile` paths.
- (b) Dependency order: buildable with five edits (section 4). One of them is a gap that no PR owns: today a letter holds one pending picture, and the plan assumes up to 6.
- (c) Cites: 27 table rows of apps/mobile cites checked in 5.1; 20 true, 2 off by one, 1 false, 1 wrong line range for the end of a table, and the other three rows are facts without a line (section 5). Four brief statements marked UNVERIFIED are now answerable from the code (section 5.2).

## 2. (a) PR homes for the rows that touch apps/mobile and modules

Home source: spec 26b (printed by `row-homes.mjs`) and the backlog rows. "Confirm" means the home is consistent across AB section 2, HR section 1, spec 19.4, 26b and the BL row.

| Item | Proposed home | Verdict | Fact |
|---|---|---|---|
| `scribe-library` access and fetch, `nullSource`, `fixtureSource` | PR 9 (9a, 9b); R110, R220 | Confirm | `apps/mobile/modules` holds `scribe-audio`, `scribe-files`, `scribe-keys`, `scribe-photo`, `scribe-store` only; no `scribe-library` and no `apps/mobile/src/lib/moments` on develop. BL-1435 carries it. |
| Thumbnail view | PR 10; R110, R220 | Confirm | Same module as PR 9; needs the `ScribeLibraryThumbnail` view declared in `expo-module.config.json` of PR 9a, so 9a must declare the view name or 10 edits the module config. Minor. |
| `exportForAttach` | PR 18 (BL-1435); R88, R110, R220 | Confirm | Lives in `scribe-library`, so it cannot start before PR 9. `scribe-photo/index.ts` has 2 functions today (24 lines) and is not edited by it. |
| `scribe-picker` modal presenter | PR 18b-1a (BL-1447); R271 | Confirm | `scribe-photo` presenter shape is `ScribePhotoModule.swift:135-139`. |
| Date read | PR 18b-1b; R95, R273, R274 | Confirm | Separate function in `scribe-picker`. |
| Multi-select and original deletion | PR 18b-1c; R86, R90, R91, R272 | Confirm, with the gap in section 4 item 3 | Deleter is `PickedFiles.remove` (`lib/photos/types.ts:88-94`). |
| Capture Add moves to host sheet | PR 18d (BL-1453); R106, R296 | Confirm | The only PR that edits `scribe-photo` pins. |
| Photo guard, release guard photo line | PR 11a, 25a | Confirm | Where "qa scripts" live is UNVERIFIED: if under `scripts/compliance/**` they are in the `protected` tier of `compliance/FENCE.json` (CCO approval plus Karma approval on the head commit). |
| `moments.json` store, clear, `eraseDeviceFiles` | PR 8 (BL-1433); R221, R246 | Confirm home; edit dependency (section 4 item 2) | `eraseDeviceFiles(): void` exists at `apps/mobile/src/lib/erase-everything.ts:62`, called at `:142` and `:181`. A sync function: the file-first-before-any-await rule of R246 fits. |
| Tab shell, F1, `tab-jobs`, nav tests, `moments/pick` route row | PR 6; R172 | Correct (3 points below) | See 2.1. |
| `MOMENT_SOURCES`, `moment` source | PR 6 in 19.4; R227 homed to PR 7 in 26b; R83 homed to 7, 19 | Move: `MOMENT_SOURCES` stays in PR 6, R227 goes to PR 6, the `moment` entry of `CAPTURE_SOURCES` goes to PR 19 (MOMENT_SOURCES and CAPTURE_SOURCES are separate lists) | See 2.2. |
| `routeForReminder`, planner kind, R280 | PR 23; R265, R280, R299 | Confirm home; add the test | See 2.3. |
| Config plugin usage string, build-time exclusion | PR 11c; R169, R222, R277 | Confirm; Q-9 is answerable | See 5.2. |

### 2.1 Tab and navigation tests that assert three tabs

AB section 1.2 names three: `[IA-N1]` (`navigation-one-entry.test.ts:199`), `[IA-N4]` (`:217`) and NS-35-R1. Read on develop, the set that fails when a fourth tab exists is larger:

| Pin | File:line | What it asserts |
|---|---|---|
| `[IA-N1]` | `apps/mobile/test/navigation-one-entry.test.ts:199-202` | bar is `index, book, you`; `TAB_JOBS` ids equal those three |
| `[IA-N2]` | `navigation-one-entry.test.ts:204-206` | `TAB_JOBS` verbs equal `['say', 'read', 'look after']` (a fourth tab adds a verb) |
| `[IA-N3]` | `navigation-one-entry.test.ts:209-215` | `CAPTURE_SOURCES` equals the 8 named values exactly; adding `moment` breaks it |
| `[IA-N4]` | `navigation-one-entry.test.ts:217-219`, `checkNoExtraTabs` `:152-160` | more than 3 screens fails; `Tabs.Protected` fails |
| `[IA-N6]` | `navigation-one-entry.test.ts:225-227` | tab labels are single words under `en.tabs` keys |
| `[NX-30a-R1]` | `apps/mobile/test/tab-bar.test.ts:27` | `SCREENS` equals `['index', 'book', 'you']`; the regex at `:23` reads only `<Tabs.Screen name="...">` literals |
| `[NX-30a-R8]` | `apps/mobile/test/tab-bar.test.ts:67` | three tabs at 320 pt and 375 pt keep 44 pt targets and whole labels |
| founder 11 Nov | `apps/mobile/test/store-family-tab.test.ts:44-68` | `[11 Nov] three tabs in every build`: `bar()` equals the three ids and `toHaveLength(3)` |
| manifest type | `apps/mobile/src/lib/nav/tab-jobs.ts:15-34` | `id: 'index' | 'book' | 'you'`, `tabsKey` union, three rows |
| layout | `apps/mobile/src/app/(tabs)/_layout.tsx:79,80,84` | three `Tabs.Screen` |

Facts that correct AB:
- AB says the three tests change "each under the founder's RV-02 (line 95)". Spec line 95 is RV-02 (the one doorway). The three-tab reversal is RV-01 (spec line 94: "Three-tab ruling ... D-161, Decided by the founder on 11 Nov, so this is a reversal of a decided ruling"). `[IA-N1]`, `[IA-N4]`, `[NX-30a-R1]`, `[NX-30a-R8]` and `store-family-tab.test.ts` fall under RV-01; `[IA-N3]` and the "only Home starts" pin fall under RV-02.
- `[NS-35-R1] only Home starts` is a spec test title (`docs/product/prd/11-foundations.md:538`). `grep -rn "only Home starts" apps/mobile/test` returns nothing, so no test carries that title today; the pin is `[IA-N3]` (title: "one capture entry: Home starts through startCapture ..."). PR 6 must cite which one it rewrites.
- `store-family-tab.test.ts` is not named anywhere in AB, HR, 19.4 or the BL rows.

Recommend: PR 6 lists these seven test pins (`[IA-N1]`, `[IA-N2]`, `[IA-N4]`, `[IA-N6]`, `[NX-30a-R1]`, `[NX-30a-R8]`, `store-family-tab.test.ts:44-68`) and the manifest file `tab-jobs.ts` in its body (`[IA-N3]` changes with the `moment` source in PR 19; the table has ten rows: those seven, `[IA-N3]`, `tab-jobs.ts` and `_layout.tsx`), cites RV-01 and RV-02 by id, and keeps the "one doorway" property (the one `startCapture` is the only caller of `/listen` and `/write`) as a rewritten assertion, per R172.

Owner: 19.4 gives PR 6 to `design-systems`. The files above (`(tabs)/_layout.tsx`, `lib/nav/tab-jobs.ts`, `lib/transitions.logic.ts`, five test files) are `apps/mobile/**` outside `src/components/ui/**`, which is `mobile`'s ownership; only the `glassFallback`, `highlight` and pill-alpha tokens and the brand-parity test (`packages/design-tokens`) are `design-systems`'. Recommend splitting the owner line: tab shell and route row `mobile` with a `design-systems` approval line (the closed-source-list comment at `start-capture.logic.ts:14-16` asks for one), tokens `design-systems`. If the founder prefers one PR, the 290-line, 11-file estimate is ASSUMED and has room.

### 2.2 The `moment` capture source: PR 6 or PR 19

- `start-capture.logic.ts` header says a new source is added "in the same PR as its handler" (NS-35-R5, `docs/product/prd/11-foundations.md:542`, test title `[NS-35-R5] closed source list`).
- 19.4 puts `MOMENT_SOURCES` in PR 6; the handler (a card tap that calls `startCapture`) is PR 19 (R83 homed to "7, 19" in 26b). R227 (spec line 1263) says one PR adds `MOMENT_SOURCES = ['moment']` and updates `tab-jobs.ts` and N1 to N6, but 26b homes R227 to PR 7 (analytics) only.
- Fact: `trackCaptureStarted` in `apps/mobile/src/lib/capture/start-capture.ts:30-36` passes the literal `source: 'tonight'`, not the capture source, so a new local source value does not change what is sent today. UNVERIFIED whether that stays true after PR 7.

Recommend: R227 homed to PR 6 for the `tab-jobs.ts` and N-test edits, and `moment` added to `CAPTURE_SOURCES` in PR 19 with its handler, with the `[IA-N3]` list edit in that PR. PR 6 then adds the tab and no source.

### 2.3 `routeForReminder`

- `routeForReminder` returns `'/' | '/book' | null` (`apps/mobile/src/lib/reminders/payload.ts:34-39`): `evening` to `/`, everything else to `/book`. AB cites this correctly.
- It is pinned by `apps/mobile/test/reminders-cold-start-route.test.ts:63-69` (`monthAge` and `birthday` expect `/book`). AB and 19.4 do not name this test; PR 23 rewrites it with R265's table (`typedDay`, `birthday`, `monthAge` to Moments).
- `PlannedKind` is `'evening' | 'monthAge' | 'birthday'` (`planner.ts:136`); `budget.ts:23` already has class `typedDay`.
- Return type `'/' | '/book' | null` is a literal union; the new route widens it. The only other file importing it is `scheduler.ts` (grep).

## 3. Row-by-row on BL-1432 to BL-1438 and BL-1447 to BL-1453 (mobile view)

| Row | Mobile verdict |
|---|---|
| BL-1432 (PR 1 to 5, core) | Keep. `packages/core/src/index.ts:4` has `export * from './rules'`; Q-4 default `export * as moments` avoids a name clash. |
| BL-1433 (PR 6, 8, 12) | Move PR 6 owner split (2.1); PR 8 add dependency on PR 1 (section 4 item 2). Owner line "design systems, mobile engineer, content" is fine for the row. |
| BL-1434 (spikes) | Keep. BL-1434 already carries G3-x as a clause of its G1a-L scope ("the G3-x exclusion spike", with its definition and the O-61 leg); what is missing is G3-x as its own wave A item in spec 19.4 (AB 8.1). |
| BL-1435 (PR 9, 10, 11b, 11c, 18) | Keep. State in the row that 9a declares the thumbnail view name (2 above). |
| BL-1436 (PR 13 to 17, 19 to 23) | Edit: PR 15 dependencies (section 4 item 1), PR 19 dependency on 19b (item 3), the multi-picture gap (item 4), PR 23 test list (2.3). |
| BL-1437 (PR 24) | Keep. |
| BL-1438 (PR 25b) | Keep. |
| BL-1447 (11a, 18a, 18b-1a, -1b, -1c, 19b, 25a, later 18b-2, 18c) | Keep; 19b add the pending-model gap (item 4). 11a: one open point, where the scripts live (fence). |
| BL-1448, 1449, 1450, 1451, 1452 | Not mobile-owned in the Owner line except 1451 (PR 5b, mobile engineer, blocked on G11b) and 1452 (analytics). Keep. |
| BL-1453 (PR 18d) | Keep, with one fix: its text says `photos-device.test.ts` "line 73 pins `pickOne`"; the `it(` is at line 75 (`apps/mobile/test/photos-device.test.ts:75`). AB 2.4 already says so. |

Reject or move: none rejected. Move: R227 (to PR 6), the `moment` source addition (PR 6 to PR 19), PR 6 owner (split).

## 4. (b) Is the dependency order of PRs 0 to 25b buildable

Read against HR section 1 and spec 19.4 (they agree with each other on every edge I compared). No cycle found: the longest chains are 1, 2, 3, 3b; 18a, 18b-1a, 18b-1c, 19b, 18d; and 9, 10, 15, 16, 17, 19, 24. Gaps, each with the file that makes it a gap:

1. PR 15 (`use-moments`) lists "4, 8, 9" only. It calls the engine's `buildMoments` (AB 5.1), which needs `group`, `qualify` and `rank` (PRs 2 and 3); PR 4 depends only on 1. Edit: PR 15 depends on 3 (and so 2). It also takes `places`; with `null` until 5b the date-only fallback applies, so 5 and 5b are not required.
2. PR 8 (`moments.json` store) lists "0" only. AB 5.1 types `readMoments` and the engine input `Decisions` from core types (PR 1). Edit: PR 8 depends on 1, or the store owns its file type and PR 15 maps it. Either is buildable; the row must say which.
3. PR 19 and PR 19b both build `lib/moments/capture-handoff.ts` (AB 1.3, 2.1: "PR 18a, 19, 19b"). 19b is wave C and 19 is wave D, but 19 does not list 19b. Two PRs creating one file is a merge conflict. Edit: PR 19 depends on 19b, or the file is created in 18a.
4. One picture per letter today, plan assumes 6. Read: `apps/mobile/src/lib/photos/pending.ts:1-30` (`PendingPhoto` holds one `PhotoSession`, "The picture chosen before a letter exists"); `ScribePhotoModule.swift:137` `selectionLimit = 1`; `photos-device.test.ts:974` ("returns one photo"). Spec line 553 (R90) wants 6 pictures or 2 videos; `docs/product/prd/27-photo-moments-and-media.md:37` says NS-01 "one picture per letter" is replaced by the NS-52 limits and `entry_media` "already has one row per picture". The NS-52 build rows (BL-1018 `Status: blocked`; BL-1378 to BL-1380 `proposed`) are not in any Moments dependency column, and none of the 41 items changes `pending.ts`, `session.ts` or the Review screen to hold N pictures. UNVERIFIED: whether `entry_media` writes N rows on develop (I did not read the save path). Effect: PRs 18b-1c, 19 and 19b cannot deliver "the chosen pictures attached" for N above 1 without it. Recommend one of: add the dependency on the NS-52 build rows to 18b-1c, 19, 19b; or add a PR that owns the N-picture pending set; or state that the first door ships one picture and R90's limit is later. This is a scope fact for `product`, not mine to decide.
5. PR 6 adds `moments/pick` as a `ROUTES` row, but there is no body for it until 14b and 17. Buildable (a route with a placeholder), and AB 4.2 says 14b baselines against a flat placeholder. No edit; noted so 6 does not claim R269.
6. Wave placement: 11c is wave C but needs the G3-x read-out; AB 8.1 asks to run G3-x in wave A. I agree as `mobile`: `apps/mobile/package.json:96` holds a static `"expo": { "autolinking": { "exclude": ["scribe-keys"] } }` and nothing on develop shows a per-profile value reaching it. UNVERIFIED that a per-profile exclusion works on EAS; the spike answers it.

Hard blockers confirmed buildable as written: the door chain 18a, 18b-0, 18b-1a, 18b-1b, 18b-1c, 19b, 11a, 25a has no edge into 9, 10, 11b, 11c, 15, 16, 17 or 25b (checked edge by edge in HR rows 11a, 18b-1a, 18b-1b, 18b-1c, 19b, 25a). Apart from item 4, the door does not wait on the library chain.

Open and not mine: PR 0 label, the founder gates, counsel items; nothing read here changes them.

## 5. (c) Every apps/mobile file:line cite in AB, checked on `abc7d57e6`

### 5.1 Table

| AB cite | Claim | Result |
|---|---|---|
| `apps/mobile/src/app/(tabs)` | holds `index.tsx`, `book.tsx`, `you.tsx` only | True, plus `_layout.tsx` (a layout, not a screen) |
| `lib/transitions.logic.ts:43` | `ROUTES` | True (`export const ROUTES = {` at 43) |
| `transitions.logic.ts:43-57` | existing rows | Off by one: the table closes at line 56 (`} as const satisfies Record<string, Row>`); 11 rows at 44-55 |
| `apps/mobile/src/lib/capture/start-capture.logic.ts:26-28` | closed source list and `CAPTURE_ROUTES` | False for lines 26-27: `HOME_CAPTURE_SOURCES` is 19, `CAPTURE_DOORWAYS` 20, `CAPTURE_SOURCES` 21, `CAPTURE_ROUTES` 28. Only line 28 is in the cited range. Source list content (4 + 4 values) is right |
| `start-capture.logic.ts:7-9` | `photo` "called once the system picker has returned a picture" | True at lines 8-9 (line 7 is not part of it) |
| `apps/mobile/test/navigation-one-entry.test.ts:199` | `[IA-N1]` bar is `index, book, you` | True |
| `navigation-one-entry.test.ts` line 217 | `[IA-N4]` | True |
| `ScribePhotoModule.swift:130-139` | one `PHPickerConfiguration()`, `.images`, limit 1, `.current` | True: `PHPickerConfiguration()` at 135, filter 136, limit 137, mode 138, picker 139 |
| `ScribePhotoModule.swift` line 58 | 2.0 s present timeout | True (`presentTimeout` at 58) |
| `apps/mobile/src/lib/photos/files.ts:39` | `PLAIN_NAME` | True |
| `files.ts:91,113,150` | `remove` implementations | True (91, 113, 150) |
| `apps/mobile/src/lib/photos/types.ts:88-94` | `PickedFiles` interface | True |
| `apps/mobile/modules/scribe-photo/index.ts:1-27` | two functions, closed codes | True in substance; the file is 24 lines, so "1-27" overruns by 3. `pickOne` at 19, `reencodeUpright` at 21 |
| `apps/mobile/test/photos-device.test.ts:68` | C5 describe | True |
| `photos-device.test.ts` line 75 | `pickOne` called in exactly one place | True |
| `photos-device.test.ts` line 971 | C8 Swift scan | True (describe at 971) |
| `apps/mobile/src/lib/capture/sweep.ts:69` | `sweepPhotosAtLaunch` | True |
| `apps/mobile/src/lib/photos/device.ts:85` | `sweepPhotosAtLaunch` | True |
| `apps/mobile/src/lib/reminders/payload.ts:34-39` | `routeForReminder` | True |
| `reminders/planner.ts:136` | `PlannedKind` | True |
| `planner.ts` `monthNoteCopy`, "from line 296" | name-bearing month note | Off by one: `function monthNoteCopy` is at 295; used at 404 |
| `reminders/budget.ts:23,40,9` | class `typedDay`, `libraryDay` source | True (23 `CLASS_IDS`, 40 `typedDay` row, 9 comment on `libraryDay`; `SOURCE_RANK` at 50) |
| `apps/mobile/package.json:96` | static autolinking exclude of `scribe-keys` | True |
| `packages/design-tokens/src/tokens.ts:364` | `standard` spring 0.4, 0.92 | True |
| `tokens.ts:429` and `:376` | `swapMs` 150, `exitMs` 160 | True; `fadeMs` 200 at 374, `sequenceMaxMs` 900 at 386; no `carryMs` (grep empty) |
| `packages/core/src/rules.ts:1-3` and `index.ts` `export *` | name collision risk | True (`index.ts:4` is `export * from './rules'`) |
| "Reanimated 4.5.1 and the other motion packages" (AB 10.2, UNVERIFIED) | present | Now verified: `react-native-reanimated` `4.5.1` (`package.json:57`), `react-native-gesture-handler` `~2.32.0` (`:55`), `expo-haptics` `~57.0.3` (`:35`), `@gorhom/bottom-sheet` `^5.2.14` (`:7`), `expo` `~57.0.26` (`:22`). `expo-image` and `expo-image-picker` are absent from `package.json` |
| `apps/mobile/modules` four others untouched | `scribe-audio`, `scribe-files`, `scribe-keys`, `scribe-store` | True |

Tally: 27 table rows, 24 of them with a line or range. True 20; off by one 2 (`transitions.logic.ts:43-57`, `monthNoteCopy`); wrong range 1 (`scribe-photo/index.ts:1-27`); false 1 (`start-capture.logic.ts:26-28`).

### 5.2 AB statements marked UNVERIFIED that develop now answers

- Q-7 and 1.2 ("whether a transparent presentation fits the `Row` type is UNVERIFIED"): `type Presentation = 'modal' | 'fullScreenModal' | 'transparentModal'` is at `transitions.logic.ts:37`, and `Row` takes `presentation?: Presentation` (`:40`), so the type already allows it. The `Move` union (`:36`) is `'none' | 'dissolve' | 'sheet' | 'push' | 'cardToPage' | 'cut'`, and `apps/mobile/test/transitions.test.ts:47` repeats it as `MOVES`, with `:55-56` requiring every row's move to be in that list; a new `Move` value, if PR 6 wants one, changes that test. `letter/[id]` uses `transparentModal` with `animation: 'none'` through its own options (`transitions.test.ts:86`), and its `ROUTES` row has no `presentation` field. Whether a `moments/pick` row with `presentation: 'transparentModal'` renders as AB 6 wants is UNVERIFIED (needs a device or simulator).
- Q-9 (is `app.config.ts` fenced): `compliance/FENCE.json` `protected` lists `compliance/**`, `scripts/compliance/**`, `docs/compliance/**`, two migration and test globs, one skill, one agent file and one workflow; `cco_review` lists `apps/mobile/src/components/gate/**`, `apps/mobile/src/lib/age-gate*`, `*age-signal*`, `*declared-age*`. `apps/mobile/app.config.ts` is in neither tier on `abc7d57e6`. The file is read from the base branch, so this holds until the fence file changes.
- Q-10 (does a test pin the callers of `PickedFiles.remove`): grep in `apps/mobile/test/photos-*.test.ts` finds no assertion on callers. Callers in `apps/mobile/src/lib/photos`: `baker.ts:50`, `pending.ts:89,97,104`, `session.ts:137`, `attach.ts:56,63` (the last two remove `photoPath(...)` files, a different store). A scan-level pin is absent as far as grep shows; UNVERIFIED for scans that build names dynamically.
- `ios-compile.yml` jobs on develop are `compile` (`:57`), `changes` (`:288`) and `launch` (`:321`), all built from the testflight profile with server features off (`:109`, `:350`); there is no F2-on leg (BL-1435 cites the founder's O-61 for it).

### 5.3 Not checked

- `docs/engineering/01-code-and-change.md:51,55`, `docs/engineering/02-api-and-contracts.md:49`, `docs/security/**` and EM line numbers: not `apps/mobile`, outside this check.
- Whether Apple API names in AB hold (every one stays UNVERIFIED until G1a-P).
- Whether the planner enforces cadence beneath the 60-in-92-days ceiling (R299): I did not read `scheduler.ts` or the cap logic.
- Whether `entry_media` writes N rows on develop (section 4 item 4).
- No test, typecheck or iOS build was run; this is a docs-only change.

## 6. Rows I would move or reject

Move:
1. R227: home PR 6 (tab-jobs and N-test edit) instead of PR 7 only; PR 7 keeps the analytics note.
2. The `moment` entry in `CAPTURE_SOURCES`: PR 6 to PR 19, with its handler (NS-35-R5).
3. PR 6 owner: split `mobile` (shell, route row, nav tests) and `design-systems` (tokens, brand parity).
4. PR 15: add dependency on PR 3 (and 2).
5. PR 8: add dependency on PR 1, or state the store owns its types.
6. PR 19: depend on 19b, or move `capture-handoff.ts` creation to 18a.
7. PR 23: name `reminders-cold-start-route.test.ts` as a test it rewrites.
8. BL-1453 text: `photos-device.test.ts` line 73 becomes 75.
9. G3-x: its own wave A item in spec 19.4 (BL-1434 already carries it as a clause).
10. PR 6 body: cite RV-01 as well as RV-02, and list `tab-bar.test.ts`, `store-family-tab.test.ts` and `[IA-N2]`, `[IA-N3]`, `[IA-N6]`.

Reject: none.

Raise to `product` (not mine to decide): the N-picture gap in section 4 item 4. Until it is answered, PRs 18b-1c, 19 and 19b have an unstated precondition.
