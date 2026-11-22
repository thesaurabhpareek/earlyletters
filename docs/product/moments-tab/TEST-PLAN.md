# NS-53 Moments tab: test plan and requirement-to-test traceability

Status: PROPOSED. Owner: `qa`. Date: 21 Nov 2026. Spec: `docs/product/prd/28-moments-tab.md` v3 (301 rows, section 19.4 PR plan of 41 items, section 26b row homes). Fictional family Asha only.
Load when: you write or review any test for a Moments PR, or you plan the founder's device pass for Moments.

This file answers one question for each of the 41 PRs: which rows does it have to prove, with which named test, and which part can only be proved on a phone. It adds no requirement and changes no row. It reads the spec; where the spec and this file disagree, the spec wins and this file is wrong.

## 0. What is true today (read before trusting any number)

- Rows with an automated test today: 0 of 301. No test title cites `NS-53-R<n>`. `node scripts/trace.mjs` (report mode) reads 203 of the rows (the P0 ones: 129 P0 (a), 52 P0 (b), 22 P0 (c)) and lists all 203 as untested. The 98 P1 and P2 rows are not read by `trace.mjs`; they are in this file's counts only.
- `node scripts/trace.mjs --check` would fail today. It prints 214 FAIL lines; 203 of them are the NS-53 rows, because `docs/ops/trace-ns-baseline.txt` holds none of them. This is not a gate in CI (report mode), so nothing is red. The day `--check` is made a gate, either the baseline is updated with `--update-ns-baseline` (a visible decision that 203 rows are open) or the rows have tests. That choice is the founder's (TDD 07 question 8). I did not touch the baseline.
- The PR homes below are the PROPOSED homes of spec 26b. `mobile` and `data-architect` have not confirmed them (FREEZE-CHECKLIST section 0). This file is computed from that table by script; if 26b changes, this table changes with it.
- Layer names follow the spec: L0 unit and core (vitest), L1 lint and source or binary scan, L2 component or Maestro on the simulator, L3 visual regression, L4 accessibility audit, L5 device or manual script, R review, P paper. L0 and L1 run in `npm test` and fit the CI budget. L2 to L4 do not run in per-PR CI today: Maestro and the simulator run nightly and per release candidate (TDD 07 section 3), and the L3 and L4 harness for Moments is PR 24, which is not written. Whether an L3 or L4 harness exists in the repo at all is UNVERIFIED by me; I did not look past PR 24's row.
- Test sizes and file counts of the PR plan are ASSUMED by the spec. Nothing here has been run against a Moments PR, because none has merged.

## 1. How a Moments test is named

1. The title starts with the row id in brackets: `[NS-53-R115] Erase deletes moments.json before any await`. One test may cite several rows; one row usually needs several tests. `trace.mjs` reads the bracket and nothing else.
2. A source scan carries a positive control (the pattern matches a known bad line) and a named mutant (the guarded line removed makes it fail), the shape of `first-run-no-prompts.test.ts`. A scan with no negative control does not count as proof of its row.
3. Fixtures are the Asha library `asha-lib-v1` (row R107, R225, PR 2 and PR 24): synthetic pictures, synthetic dates, no real family. A test that needs a name uses Asha.
4. A row proved only on a phone gets a Maestro tag or a manual script id in the device section below, never a test title that pretends to prove it in Node.
5. Where the spec names a test that already exists and must be edited, the PR body names the file and line. The edit is a changed assertion with the reason in the PR, never a deletion (QA rule: no test is loosened to make a build green).

## 2. Requirement to test, by PR home

Computed from spec 26b (the PR column) and the Layer column of each row. "Rows homed" counts a row once for each PR it names, so the column sums to more than 301. "Device or paper only" counts rows whose every layer is L5 or P. A PR with a row of layer L0 or L1 owes a named test in `npm test`; a PR with only L2 to L4 rows owes a Maestro, L3 or L4 artefact that does not run per PR.

| PR | Owner | Rows homed (P0) | Automated layers declared | Device or paper only (all layers L5 or P) | Row ids |
|---|---|---|---|---|---|
| 0 | `product` | 3 (2) | L1 1, L3 1 | 1 | R216 R219 R243 |
| 0b | `content` | 2 (0) | L0 1 | 1 | R268 R286 |
| 1 | `mobile` | 4 (2) | L0 4 | 0 | R12 R42 R203 R267 |
| 2 | `mobile` | 11 (8) | L0 11, L1 3 | 0 | R38 R39 R40 R41 R59 R107 R176 R190 R223 R267 R281 |
| 3 | `mobile` | 5 (3) | L0 5 | 0 | R41 R44 R51 R190 R281 |
| 3b | `qa` | 3 (3) | L0 3 | 0 | R40 R205 R281 |
| 4 | `mobile` | 31 (18) | L0 31, L1 4, L2 2 | 0 | R5 R10 R16 R18 R19 R20 R21 R22 R23 R24 R25 R27 R33 R34 R36 R46 R47 R48 R50 R58 R66 R130 R173 R199 R201 R202 R207 R253 R254 R258 R267 |
| 5 | `mobile` | 10 (7) | L0 9, L1 3, L2 1 | 0 | R58 R61 R63 R64 R117 R204 R241 R249 R267 R281 |
| 5b | `mobile`, `privacy` approve | 5 (4) | L0 5, L1 4 | 0 | R61 R206 R228 R229 R248 |
| 6 | `mobile` (shell, route row, nav tests, `tab-jobs`) with a `design-systems` approval line; `design-systems` (tokens, brand parity) | 16 (10) | L0 6, L1 2, L2 10, L3 6, L4 3 | 0 | R1 R2 R3 R4 R84 R119 R139 R145 R165 R172 R180 R185 R215 R216 R227 R269 |
| 7 | `analytics` | 7 (6) | L0 7, L1 5 | 0 | R83 R87 R167 R227 R251 R282 R284 |
| 8 | `mobile` | 14 (14) | L0 13, L1 1, L2 2 | 0 | R105 R113 R114 R115 R116 R162 R166 R221 R245 R246 R247 R248 R249 R250 |
| 9 | `mobile` | 8 (6) | L0 6, L1 6, L2 1 | 0 | R37 R109 R110 R111 R220 R223 R228 R237 |
| 10 | `mobile` | 6 (3) | L0 4, L1 2, L2 2 | 1 | R45 R53 R110 R112 R118 R220 |
| 11a | `qa` scripts, `privacy` text | 1 (1) | L1 1 | 0 | R277 |
| 11b | `qa` scripts, `privacy` text | 18 (18) | L0 4, L1 17, L2 1 | 1 | R43 R68 R70 R164 R167 R169 R171 R176 R202 R222 R226 R230 R231 R233 R236 R241 R258 R277 |
| 11c | `mobile`, `privacy` text | 5 (5) | L1 5 | 0 | R169 R222 R236 R243 R277 |
| 12 | `content` | 27 (23) | L0 25, L1 4, L2 3, L4 2 | 0 | R2 R8 R9 R11 R12 R25 R42 R52 R72 R80 R81 R104 R159 R160 R187 R191 R192 R193 R196 R198 R235 R256 R260 R278 R285 R294 R300 |
| 13 | `design-systems` | 24 (14) | L0 12, L1 6, L2 11, L3 6, L4 7 | 0 | R11 R13 R16 R17 R46 R48 R144 R146 R148 R151 R153 R154 R156 R157 R158 R160 R185 R186 R201 R208 R211 R212 R214 R217 |
| 14 | `design-systems` | 23 (15) | L0 5, L1 6, L2 16, L3 8, L4 11 | 1 | R13 R71 R72 R76 R90 R102 R124 R144 R150 R153 R155 R178 R180 R182 R217 R218 R269 R270 R279 R287 R293 R294 R297 |
| 15 | `mobile` | 25 (17) | L0 13, L1 4, L2 18, L4 1 | 0 | R6 R10 R24 R28 R32 R35 R53 R70 R73 R74 R76 R77 R106 R109 R113 R119 R125 R165 R170 R173 R182 R202 R213 R232 R253 |
| 16 | `mobile` | 19 (12) | L0 5, L2 15, L3 3, L4 5 | 0 | R14 R26 R31 R33 R35 R69 R79 R120 R123 R124 R145 R147 R151 R153 R155 R177 R189 R209 R295 |
| 17 | `mobile` | 28 (15) | L0 7, L1 3, L2 23, L3 7, L4 8 | 0 | R6 R10 R14 R72 R73 R75 R90 R122 R125 R144 R146 R150 R156 R177 R178 R181 R186 R189 R210 R211 R212 R213 R218 R232 R269 R275 R276 R287 |
| 18a | `mobile` | 1 (1) | L0 1, L1 1 | 0 | R88 |
| 18 | `mobile` | 6 (5) | L0 6, L1 3, L2 1 | 0 | R88 R89 R93 R110 R220 R261 |
| 18b-0 | `security-architect` | 2 (0) | L1 2 | 0 | R237 R283 |
| 18b-1a | `mobile`, `security-architect` read | 4 (3) | L0 4, L1 3, L3 1 | 0 | R89 R271 R282 R297 |
| 18b-1b | `mobile`, `security-architect` read | 3 (3) | L0 2, L1 1, L2 2 | 0 | R95 R273 R274 |
| 18b-1c | `mobile`, `security-architect` read | 4 (2) | L0 1, L1 1, L2 3, L4 1 | 0 | R86 R90 R91 R272 |
| 18b-2 | `mobile` | 0 | none (no row has this PR as a home) | 0 | none |
| 18c | `mobile` | 0 | none (no row has this PR as a home) | 0 | none |
| 18d | `mobile`, `security-architect` read | 2 (0) | L0 1, L1 1 | 0 | R106 R296 |
| 19 | `mobile` | 26 (16) | L0 10, L1 3, L2 17, L4 1 | 2 | R15 R32 R49 R79 R83 R84 R85 R86 R87 R91 R92 R96 R97 R99 R100 R101 R102 R103 R104 R106 R108 R148 R163 R179 R183 R257 |
| 19b | `mobile` | 4 (3) | L0 2, L1 1, L2 3 | 0 | R95 R106 R274 R279 |
| 20 | `mobile` | 5 (1) | L2 2, L3 1, L4 2 | 2 | R98 R101 R149 R150 R276 |
| 21 | `mobile` | 17 (10) | L0 12, L2 11, L4 1 | 0 | R17 R28 R29 R30 R54 R55 R78 R105 R115 R158 R166 R199 R246 R249 R256 R275 R291 |
| 22 | `mobile` | 7 (5) | L0 6, L1 2, L2 2, L4 1 | 0 | R58 R64 R65 R117 R195 R202 R254 |
| 23 | `mobile` | 17 (14) | L0 15, L1 3, L2 6 | 0 | R4 R121 R127 R128 R129 R131 R136 R137 R138 R139 R191 R196 R198 R234 R265 R280 R299 |
| 24 | `qa` | 10 (6) | L0 8, L1 6, L2 2, L3 2 | 0 | R107 R152 R162 R176 R189 R194 R224 R225 R257 R297 |
| 25a | `qa`, founder pastes the workflow step | 8 (6) | L0 3, L1 3 | 1 | R81 R175 R193 R240 R259 R277 R278 R296 |
| 25b | `qa`, founder pastes the workflow step | 8 (7) | L0 2, L1 1 | 2 | R80 R81 R171 R175 R193 R222 R240 R259 |

Reading this table:

- PRs 11a and 11c carry few rows (1 and 5); several are shared with 11b and 25a. Row R277 is the one that makes 11a, 11c and 25a one chain: the guard and its test never sit in the same PR as the file they guard.
- PRs 18b-0 and 0b are docs PRs. Their rows are checked by review (layer R or P), not by a test. 18b-0 homes two rows (R237, R283), both L1 or L5, which the later picker PRs prove.
- PR 7 has seven L0 and L1 rows but the spec treats it as a note (analytics decision). Which existing analytics tests prove them, I did not check; that is `analytics`' to name in the PR.
- A row with a PR home and no automated layer is not covered by a test, and this file does not make it so.

## 3. Named tests owed, by PR

Each line is `row: test title, file, what it must assert`. File names are PROPOSED. A title in bold is one a reviewer has already asked for.

### Wave A and B (pure logic, store, shell)

- PR 1 (R12, R42, R203, R267): `[NS-53-R12]` and `[NS-53-R42]` enum and reason tests in `packages/core/test/moments-types.test.ts`: there is no `RSN-ALBUM`, five verbs exactly, `MOMENTS_RULES_VERSION` present and the PROPOSED values of 7.2a pinned so a change is a visible diff.
- PR 2 (R38 to R41, R59, R176, R190, R223, R281): goldens on `asha-lib-v1`; both span predicates behind the rules field; a day with a heart and a day with none; `offsetAt` across a DST change. Regenerating a golden needs a founder-visible diff (R225).
- PR 3 (R41, R44, R51, R190, R281): property tests for `rank`, `collage` and the seeded rotation: the same seed gives the same order, no tile twice, the tile order rule (heart, else middle session).
- PR 3b (R40, R205, R281): one test that the harness prints counts only and writes nothing but the junk-marks file; a fixture of two Asha days; no pixel and no filename in its output.
- PR 4 (31 rows, 18 P0): per-occasion tests (birthday, month day, holidays, firsts); `momentsFor` registry; the plain-date fallback when `machineLabels` is off (R202). This is the largest L0 load; both 4a and 4b carry their own.
- PR 5 (R58, R61, R63, R64, R117, R204, R241, R249, R281): grid lookup and the home-place rarity rule with a synthetic table; no network symbol.
- PR 5b (R61, R206, R228, R229, R248): the table checksum fails closed to no place; the size ceiling; the banned-character and fear-word scan of the generated table; the licence note exists.
- PR 6 (16 rows): see 3.1 below; the tab shell is where the most existing tests change.
- **PR 8 (R105, R113 to R116, R162, R166, R221, R245 to R250), the excluded-from-backup test.** Row home: R250 and the 17.1 table (the file is "excluded from iPhone backup and read back"). Title: `[NS-53-R250] moments.json is excluded from backup after create, after every temp-and-rename write, and read back`. Pattern to copy: `setExcluded` and `isExcluded` in `apps/mobile/src/lib/days/store-file.ts` with the read-back in `apps/mobile/test/days-store.test.ts`. It must assert, with a fake `ScribeFiles` that can refuse the flag (mode "stick" as in `backup-files.test.ts`): the flag is set on the temp file and on the renamed file; a refused flag fails closed (the write is not reported as done); the read-back after launch finds it set or sets it again. Also in PR 8: `[NS-53-R115] Erase, sign-out and Delete account delete moments.json before any await`, `[NS-53-R221]` one test per sentence of the contract (unknown fields kept, higher `v` reads empty and writes nothing, corrupt file deleted with no message, owner is never a person id), `[NS-53-R246]` the three operations, and `erase-all.test.ts` gains the file in its `eraseDeviceFiles` list. R250's own layer is review; the test above is what turns it into proof, and `privacy` still decides whether `labels{}` is exported.
- PR 9 (R37, R109 to R111, R220, R223, R228, R237): `nullSource` and `fixtureSource` return the same shape; a denied or Limited state is a working state, not an error (R173); the scan that no `scribe-library` call site is reachable when F2 is off.
- PR 10 (R45, R53, R110, R112, R118, R220): LRU bound and cancellation on the fixture; the byte ceiling is a device measure (section 5).

### Wave C and D (screens, flows)

- **PR 14 and PR 17, the 25-percent pinned bar at AX5 (R155, R211, spec 15, design closure G-05).** The rule: at AX5 no pinned bar covers more than 25 percent of the screen, and on the primer sheet Continue and Not now sit at the end of the scroll, not pinned. Owed: `[NS-53-R155] at AX5 on iPhone SE 3 no pinned control is taller than a quarter of the screen` as an L3 frame assertion, `maxY(pinned) - minY(pinned) <= 0.25 * screenHeight`, for each of the eleven states of R189 that has a pinned control, plus an L0 test that the layout function returns "not pinned" for the primer at AX1 and above. The L3 part runs only when PR 24's harness exists; until then it is UNRUN, not passing.
- **G-04 card accessibility, keyed on the visible label (R214, R150, design closure G-04).** Owed: `[NS-53-R214] every card control's accessibility name begins with its visible label`. It must read the label from the rendered control's visible text, not from a constant copied into the test, so renaming "Continue" without renaming its accessibility name fails; and it must assert the four stops and their order (information group, Continue, Not now, menu) for each of the six card kinds. L2 for the label rule, L4 for the order and names. Voice Control itself is a device item (section 5).
- PR 13 and PR 14 (R144, R146, R148, R151 to R158, R185, R186, R201, R208, R211, R212, R214, R217): one L3 baseline per card kind at default and AX5, light and dark. R225 prunes the matrix to the states that differ; do not add a full theme-by-size cross.
- PR 14 (R297 part): L3 baseline of the host sheet frame with Apple's body replaced by a flat placeholder, so a visual regression is found at once.
- PR 15 (R6, R10, R24, R28, R106, R170, R173, R182, R202, R253): kill switches K1, K2, K4 and K5: a config from before K1 and K4 existed reads as not paused (R170); a paused surface is hidden and nothing is deleted.
- PR 16 and 17: ACC state function over all eleven states (R189): one Maestro flow per state through `fixtureSource`; the denied state and the Limited state each reach the Recent view with no error text.
- PR 18 and 18a (R88, R89, R93, R110, R220, R261): the one stripper contract. Test: a canary GPS and a canary date in a synthetic picture give zero hits after `reencodeUpright`; the source scan that `scribe-photo` and its scan are not edited.
- PR 18b-1a, 18b-1b, 18b-1c (R86, R89, R90, R91, R95, R271 to R274): the scans of R271 (one configuration, no library, imports pinned) with a mutant each; the date rule and `pick-limits.logic` in Node (R297); limit enforced twice (once in TypeScript, once in the Swift contract's constants, which a scan equates); and the process-killed-between-pick-and-strip test on `fixturePicker`. Apple's picker itself is out-of-process and cannot be driven by us (section 5).
- PR 18d (R106, R296): the only PR allowed to edit the pins of `photos-device.test.ts`, `photos-capture.test.ts` and `photos-surfaces.test.ts`. Each edit changes an expected value with the reason in the PR; none is deleted.
- PR 19 and 19b (R15, R32, R49, R79, R83 to R87, R91, R92, R95 to R106, R148, R163, R179, R183, R257, R274, R279): `moment` is added to `CAPTURE_SOURCES` and not to `MOMENT_SOURCES`; `start-capture.test.ts:39` and `[IA-N3]` change with it; the host sheet opens only from a parent's tap (R279, an L1 scan for a route parameter, link or notification payload).
- PR 20 (R98, R101, R149, R150, R276): the box with one calm line when the stored file is missing, through `PhotoFrame` `onMissing`.
- PR 21 and PR 22 (R17, R28 to R30, R54, R55, R58, R64, R65, R78, R105, R115, R117, R158, R166, R195, R199, R202, R246, R249, R254, R256, R275, R291): the five verbs each write exactly one key to `moments.json` and nothing else; Hide this place writes a place key, never a coordinate (R254).
- **PR 23, the notification payload with names on and off (R138, R280, R234, R135).** Owed: `[NS-53-R138] a Moments-class push carries no child name and no month number or age in its title, body or payload, with names on and with names off`. Table-driven over the three classes `typedDay`, `birthday` and `monthAge` times names {on, off} times App lock {on, off}, twelve cells, each asserting title, body and every key of `data` against the ban (no `Asha`, no digits that are a month number or age, no occasion name on the lock screen). It runs on the real planner output, not on a copied string. It must be red against today's planner (R280 says the shipped planner differs when names are on), so the red-then-green order in the PR is evidence. Also: `[NS-53-R135]` a library-timed note's title, body and payload equal the ordinary evening reminder's, key for key. `reminders-cold-start-route.test.ts` is rewritten in this PR (R280 and the PR plan). The delivery on a locked phone is a device item (section 5).
- PR 24 (R107, R152, R162, R176, R189, R194, R224, R225, R257, R297): the Asha simulator library script and its canary test: a canary asset id, album, date, coordinate and filename through primer, Recent, picker, push, email, attach, Keep, outbox, push mapper and export leave 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs (R162, R257). `[NS-53-R107]` no fixture picture holds a real name, place or picture.

### Wave E (guards)

- PR 11a, 11b, 11c, 25a, 25b (R43, R68, R70, R164, R167, R169, R171, R175, R176, R193, R202, R222, R226, R230, R231, R233, R236, R240, R241, R243, R258, R259, R277, R278, R296): every guard has a negative control (delete the line and the guard fails). `[NS-53-R169]` the F2 allow list: a test fails on any profile not named. `[NS-53-R277]` the guard script fails a production build when the door is on and the `G11a-photo` line is missing. The guarded file and its test are never in one PR (R277). The `ios-compile` job at the head is a required check for any Swift PR; it is not mine to run here.

### 3.1 PR 6, the tab shell: existing tests that change

PR 6 (R1 to R4, R84, R119, R139, R145, R165, R172, R180, R185, R215, R216, R227, R269) turns three tabs into four, behind F1. Today at least five existing tests pin the old shape, and two of them forbid exactly what PR 6 builds. Each must change with a reason in the PR body, as a changed assertion and never a deletion. I read these on `develop` at 4b8b467ee.

| Test | Today | Becomes | Row |
|---|---|---|---|
| `apps/mobile/test/tab-bar.test.ts`, `[NX-30a-R1]` | `expect(SCREENS).toEqual(['index', 'book', 'you'])` | **Asserts the tabs are exactly Home, Book, Moments, Me in the order the spec fixes (R172, tab order is a tested decision), and fails if a fifth is added or the order changes. This is the "tab-bar.test.ts asserts three tabs" item the reviewers named: it must assert three with F1 off and four with F1 on, not just be edited to four.** `[NX-30a-R4]` (Large Content Viewer title and fixed label size) must hold for the new tab too, and at AX5 four labels must fit whole (R3). | R3, R172 |
| `apps/mobile/test/navigation-one-entry.test.ts`, `[IA-N1]` | the bar is the manifest: index, book, you | the manifest gains Moments, each titled from `copy.tabs` | R172 |
| same file, `[IA-N4]` | "no fourth tab, and no tab hidden behind Tabs.Protected" | **Contradicts PR 6.** Rewrite to: no fifth tab; the fourth exists only under F1; with F1 off the bar equals the build without Moments (R169). Do not delete it. | R169, R172 |
| same file, `[IA-N2]`, `[IA-N6]`, and `[IA-N3]` (PR 19 edits N3) | one verb per tab; single-word labels; one capture entry | Moments declares one verb and a single-word label (R2, R4); `[IA-N3]` changes in PR 19 when `moment` joins `CAPTURE_SOURCES` | R2, R4, R15 |
| `apps/mobile/test/store-family-tab.test.ts`, "[11 Nov] three tabs in every build" (lines 44 to 68) | bar is exactly three; no guard in the layout (`Tabs.Protected`, capabilities); every `eas.json` profile gets that bar and `bar()` has length 3 | **Contradicts PR 6 as written.** Rewrite to: the bar is three where F1 is off and four where F1 is on, per profile, from the one F1 switch; Family is still never a tab. The "no guard" rule becomes "no guard other than the F1 switch". | R169, R172 |
| `apps/mobile/src/lib/nav/tab-jobs.ts` and the tests that read it | one job per tab | gains Moments' job line (R2, R4) | R2, R4 |

Also in PR 6: the `moments/pick` route is one row in `ROUTES` with a modal presentation (R172); the tokens `glassFallback`, `highlight` and pill-alpha go through the normal token route with the brand-parity test (R216); and the app's one `startCapture` is the only caller of `/listen` and `/write`.

## 4. Report-only checks to add

All report mode first: they print, they do not fail, until the founder decides to gate (TDD 07 question 8). I propose them; I have not changed `.github/workflows/`, which the Claude GitHub App cannot edit, so any CI step is a patch under `docs/ops/proposed/` for the founder to paste. I have not written those patches in this PR.

1. NS-53 row to PR to test report. `scripts/trace.mjs` already lists the 203 P0 rows as untested. Add a PR-home column read from spec 26b (the logic is in `docs/product/moments-tab/row-homes.mjs`), so each Moments PR can print "rows owed by this PR: n, with a test: m". Owner `qa` (BL-002 follow-up).
2. Owed-by-this-PR check on every Moments PR: the PR body lists its row ids (19.4 says each PR carries them); the report prints any row id in the body with no matching bracketed test title and no device or paper tag. Report only.
3. A scan for an `NS-53-R<n>` in a test title that the spec does not define (typos), matching what `trace.mjs` does for the other cards.
4. A PR-size report line for Moments PRs. The 19.4 sizes are ASSUMED and 9, 10 and 18b-1a hit the 20-file limit first; report the measured size against the table so the assumption is replaced by a number. `docs/ops/proposed/pr-size.md` already exists for the gate.
5. A device-evidence report: for every row in section 5, whether `docs/qa/evidence/<date>-<build>-<device>.md` has a row for its script id. It prints UNRUN or the date. This is what keeps section 5 honest after the first device pass.
6. A negative-control report for the guards of PRs 11a, 11b, 25a and 25b: run each guard on a copy with its guarded line removed and print whether it failed. It can be a test; I list it here because the first run should be a report.
7. A baseline decision for `trace --check` (section 0): report how many NS-53 rows would be added to `docs/ops/trace-ns-baseline.txt`. No change to the baseline without the founder.

## 5. What can only be proved on a device, and stays UNRUN until a founder device pass

Nothing in this section runs in CI, and nothing here is claimed as passing. Each item is UNRUN until the founder runs it on an iPhone SE 3 (the budget phone) and a current iPhone, and the result is saved in `docs/qa/evidence/`. Script ids are the ones the spec names; where the spec only says "device", the script is not yet written and I say so. `docs/qa/DEVICE_TEST_PLAN.md` has no Moments section yet: adding one is an owed follow-up of this plan (not done here, to keep this PR to one file).

Rows whose only layer is L5 (device or manual script, 19 rows): R7, R60, R161, R168, R174, R200, R219, R252, R288 (all the G4 script); R98, R102, R118, R126 (G7 rows); R101 (G5 W1 to W12); R235 (G7 rows, with review); R289 (G10); R290, R292 (G1a read-out, spike on a device); R301 (counsel, G2).

Rows whose only layer is paper or review (16 rows, not tests): R80, R143, R171, R175, R238, R239, R240, R242, R244, R250, R259, R262, R263, R264, R266, R268. These are counsel, founder or `privacy` reads; the evidence is a dated read-out in the release record, not a test.

Rows with an automated layer AND an L5 part (64 rows; the L5 half is UNRUN even when the automated half is green): R3, R39, R41, R45, R47, R53, R57, R71, R75, R76, R77, R82, R86, R89, R91, R93, R100, R103, R105, R106, R109, R111, R112, R113, R115, R122, R125, R128, R136, R138, R145, R146, R149, R150, R151, R152, R153, R154, R155, R156, R177, R179, R183, R189, R190, R199, R204, R205, R209, R224, R228, R232, R255, R269, R271, R272, R275, R278, R279, R281, R283, R287, R293, R295.

By kind of thing a phone is needed for:

| What | Why Node or the simulator cannot prove it | Script | Rows (examples) |
|---|---|---|---|
| Apple's picker (out-of-process) behaviour: Limited picker, iCloud-only assets, cancel, limits as the parent sees them | The view runs in another process; `fixturePicker` drives only our sheet | G1a-P read-out; G5(b) task completion through the picker | R271, R272, R290, R292, R293 |
| VoiceOver, Voice Control, Switch Control, Full Keyboard Access at AX5 with Bold Text, Reduce Motion, Reduce Transparency, Increase Contrast, on every state | The simulator does not run these assistive technologies faithfully | S1-23 (V-01 to V-10) extended, G5 W1 to W12 | R3, R150, R153, R155, R214, R293 |
| Frame budgets: no frame over 16.7 ms during the card enter, the host-sheet motion and a Recent fling on the SE 3; 120 Hz, Low Power Mode, thermal state | Needs real GPU and thermal behaviour | DM-11, DM-12 (design closure G-06) | R152, R224 |
| Library byte and memory ceilings, LRU size, memory-warning handler | Needs real memory pressure and a real library | PR 3b harness on the founder's own phone, counts only; R224 rows | R205, R224 |
| Notification delivery on a locked phone with names off or App lock on, and timing | The lock screen and delivery time are the OS's | G7 rows; the payload test of PR 23 is the Node half | R136, R138 |
| A second account, restore to a new phone, device restore starts off, the file is not in the backup | Needs two phones and a real iCloud restore | DL-03 style two-phone drill; D-085 | R105, R113, R115, R250 |
| Settings paths and labels for photos access on a current iOS; the system picker under Restricted | The words must be read from a current iOS, not recalled | G7 | R126, R98, R102, R118 |
| Compile and link of `scribe-library`, `scribe-picker`, and the F2-off exclusion | A native build, not a test | `ios-compile` at the PR head; G3-x spike (needs the founder's second leg, O-61) | R169, R222, R277 |
| Store and legal evidence | Not testable | G2, G4, G10, G11d reads | R80, R132 to R135, R238 to R244 |

Simulator-only items that are not device items but are also not in per-PR CI today (L2 Maestro, L3 baselines, L4 audits): they run in the nightly and release-candidate job once PR 24 exists. Until then they are UNRUN, and a PR that declares such a row must say "not run" in its body rather than "covered".

## 6. How I will keep this file true

- When a Moments PR merges, I update its row in section 2 from "owed" to the test file and title, and run `node scripts/trace.mjs` to confirm the row moved from untested to tested. A row is tested only when a title cites it and the test passes in `npm test`.
- If a home in 26b changes, I regenerate section 2 from the spec rather than edit it by hand. The counts here were computed on 21 Nov 2026 from the spec as it stands on `develop` at 4b8b467ee.
- Standing duty 2 (flaky hunt) applies to every new Moments test: rerun with new fuzz seeds before the PR is marked ready.

## 7. Open points for others

- `mobile` and `data-architect`: confirm or correct the PR homes of 26b. This plan is only as good as they are.
- `privacy`: whether `labels{}` is exported decides what the R250 test asserts about the export; default is the plain "this phone only" statement.
- `design-systems`: the L3 pruning of R225 (which states differ) and the frame assertion for the 25-percent rule.
- Founder: whether `trace --check` becomes a gate and how the 203 open NS-53 rows are baselined; and the Moments section of the device test plan (a doc to add after the first device pass is scheduled).
