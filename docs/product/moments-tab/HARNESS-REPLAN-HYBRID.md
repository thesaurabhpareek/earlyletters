# NS-53 Moments tab: harness replan for the hybrid design (v3)

Status: PROPOSED (nothing here is decided; the founder signs each founder item; docs only)
Date: 21 Nov 2026
Owner: `product` (Chief Product Officer role, acting for Karma)
Spec: `docs/product/prd/28-moments-tab.md` v3 (301 rows, R1 to R301; section 3.4 decisions D1 to D14 and KM1 to KM5; section 19.4 the PR plan; section 27b and 27c dispositions)
Replaces: section 2 and section 3 of `FREEZE-CHECKLIST.md` as written for v2 (26 PRs). That file now points here.
Load when: you hand the hybrid design to the harness, file or amend the Moments backlog rows, or order the PRs.

Fictional family Asha only. Labels: SOURCE-READ means I read the text this session. UNVERIFIED means I did not read the primary text. Sizes are changed lines, ASSUMED, not measured.

## 1. The new PR list, with dependencies and waves

33 items (the 26 numbered PRs 0 to 25, plus 5b, 18a, 18b-1a, 18b-1b, 18b-2, 18c and 19b). Each stays under CODE-R02 (400 lines, 20 files). The spec table in 19.4 is the source; this is the same list as a dependency graph.

| # | Concern | Owner | Size | Depends on | Wave | Can start now |
|---|---|---|---|---|---|---|
| 0 | Spec edit with the sweep of D14 (this change) | `product` | docs | none | A | Yes (done on this branch; needs the founder only for the flip) |
| 1 | Types, reasons (no RSN-ALBUM), `rules.ts` (`NEAR_SECONDS`, `MIN_SPAN`), five verbs | `mobile` | 300 | 0 | A | Yes |
| 2 | Exclude, group, qualification (span rule), near-duplicate rule, goldens | `mobile` | 380 | 1 | B | After 1 |
| 3 | Rank, collage, tile order (heart, else middle session), property tests | `mobile` | 350 | 2 | B | After 2 |
| 4 | Occasions, `momentsFor` registry, slots | `mobile` | 380 | 1 | A | After 1 |
| 5 | `place.ts` with an injected table, home-place rarity rule, goldens | `mobile` | 300 | 1 | B | Yes, with a synthetic 10 row table |
| 5b | Place table package, licence note | `mobile`, `privacy` | generated | licence read by licensed counsel (G11b) | later | No |
| 6 | Tab shell behind F1, `moments/pick` route row | `design-systems` | 250 | 1 | A | Yes |
| 7 | Analytics decision (no-change note by default, O-49) | `analytics` | 150 | 6 | B | After 6 |
| 8 | `moments.json` store (no album or picture members) | `mobile` | 250 | 0 | A | Yes |
| 9 | `scribe-library` access and fetch | `mobile` | 400 | G1a-L read-out; G3 to merge | B | No |
| 10 | Native thumbnail view | `mobile` | 300 | 9 | C | No |
| 11 | Config plugin by profile, build-time exclusion of `scribe-library`, guard scripts (library and photo lines) | `privacy`, `qa` | 400 | 9 (library guards); 18b-1a (photo guard) | C | No |
| 12 | Content: tab, ask, primer, states, door and host strings, value proposition (after O-48) | `content` | 380 | none | A | Yes (door and host strings wait one day for the limits decision, O-54) |
| 13 | `MomentCard`, `DayCollage`, `ExampleCard` | `design-systems` | 400 | 6, 12 | B | After 6, 12 |
| 14 | `PermissionAsk`, state lines, door row, Limited calm line, host sheet frame and tray (placeholder body) | `design-systems` | 350 | 12 | B | After 12 |
| 15 | `use-moments`, ACC state function, kill switches | `mobile` | 350 | 4, 8, 9 | C | No |
| 16 | For you with no library, value view | `mobile` | 300 | 13, 14, 15 | C | No |
| 17 | Primer, ask, Recent, day sheet (no album chooser, no grid) | `mobile` | 300 | 10, 16 | D | No |
| 18a | `AttachRequest` type and the one stripper contract | `mobile` | 150 | none | A | Yes |
| 18 | Copy-for-attach from library assets | `mobile` | 300 | 9, 18a | C | No |
| 18b-1a | `scribe-picker`: modal multi-select of pictures in our sheet, native contract, temp lifecycle, scans, classification and threat rows | `mobile`, `security-architect` read | 250 | 18a; simulator read-out of G1a-P; Apple reference read (EXH-ENG-17) | B | After the simulator read-out |
| 18b-1b | Date read with canary-GPS fixture | `mobile`, `security-architect` read | 120 | 18b-1a | B | After 18b-1a |
| 18b-2 | Inline host (LATER) | `mobile` | 150 | G1a-P device read-out; G11a-photo | E | No |
| 18c | Video in the picker (LATER) | `mobile` | UNVERIFIED | G1a-P read-back of what the container keeps | E | No |
| 19 | Capture hand-off from a day | `mobile` | 300 | 6, 17, 18 | D | No |
| 19b | Hand-off from a picked set to capture | `mobile` | 250 | 6, 12, 14, 18a, 18b-1a | C | No |
| 20 | Reduced viewer: one plain full-width enlarge | `mobile` | 150 | 17 | D | No |
| 21 | Five verbs, Me list with Hidden choices, Turn off | `mobile` | 250 | 8, 17 | D | No |
| 22 | Places on cards, Hide this place | `mobile` | 300 | 5, 5b, 17, 21 | D | No |
| 23 | Home pointer, nudges from phone-held facts, planner change (R280) | `mobile` | 300 | 4, 6 | D | No |
| 24 | N layer: Asha library script, Maestro flows (host sheet through `fixturePicker`), L3 and L4 | `qa` | 350 | 9, 17 | D | The Asha generator, after 1 |
| 25 | Release read-out guard step (library and photo lines) | `qa`, founder pastes the workflow step | 150 | 11 | E | No |

Waves. A (parallel): 1, then 4, plus 6, 8, 12, 18a, the G1a-L spike and the G1a-P simulator spike (a throwaway branch, never merged). B: 2, 3, 5, 9, 13, 14, 7, then 18b-1a and 18b-1b once the simulator read-out and the Apple reference read are on file. C: 10, 11, 15, 18, 16, 19b. D: 17, 19, 20, 21, 22, 23, 24. E: 25, the gate read-outs, the F2 flip, and later 18b-2 and 18c (not on the first-release critical path). About 8,400 lines (ASSUMED): the cuts to PRs 8, 17, 20, 21, 24 give about 7,150; 18a, 18b-1a, 18b-1b, 18b-2, 18c, 19b and the door in PR 14 add about 1,250. The honest size of the change (EXH-ENG-16): fewer lines in the library part, more device and review time, more and smaller PRs.

The door (the picker, pictures only) ships only when 18a, 18b-1a, 18b-1b and 19b exist and the photo flag's legal set is in the same build (R278); it does not wait for any of 9, 10, 11 (library guards), 15, 16, 17, so it can ship even if every library gate fails (D4), but not without counsel and not before 19b (EXH-ENG-4, EXH-PRV-1).

## 2. What can start now, and what must wait

Can start now, before the founder answers anything:

- PR 0, the spec edit (this branch).
- PRs 1 to 4 (pure TypeScript). PR 1 is built to the D6 default: no album, no picture identifier, five verbs, `NEAR_SECONDS` and `MIN_SPAN` as data (EXH-ENG-7).
- PR 5 with a synthetic 10 row table.
- PRs 6, 8 and 12. PR 12 waits about a day for the door and host strings and the per-type limits decision (O-54); the value proposition text waits for O-48.
- PR 18a, the `AttachRequest` type and stripper contract. It depends on nothing in `scribe-library`.
- The simulator picker spike (G1a-P, the parts a simulator can answer: (a), (b), (d) and the host-in-a-sheet questions of (i) to (j)) on a throwaway branch, with a script-made Asha library. Read-outs hold timings, rates and yes or no only.
- The Asha library generator of PR 24, once PR 1 lands.

Must wait:

- PR 9 and everything that needs `scribe-library`: the G1a-L read-out, and G3 to merge.
- PR 18b-1a: the simulator read-out of G1a-P and a primary-source read of Apple's picker reference pages by `mobile` (EXH-ENG-17). 18b-1b follows 18b-1a.
- 18b-2: the G1a-P device read-out (hidden-bars matrix, first-time text, memory on an iPhone SE 3, iCloud, app lock) and G11a-photo.
- 18c (video): the read-back of what the container keeps (location atoms) and Live Photo behaviour.
- PR 5b: licence read by licensed counsel (G11b).
- Anything that sends a notification or email (phase 2), and the planner change of R280 until O-50 is answered.
- The door's store build: the photo flag's legal set (label, policy, Terms, backup line) and counsel's Q5 to Q7 and Q9 (R278). Nothing in a profile that reaches the store carries the door before then.
- The F2 flip: G1b to G7, G10 (five signatures, RV-23 for the door), G11a-lib, G11a-photo.

## 3. Replacement text for BACKLOG rows BL-1432 to BL-1438, and one new row

PR #1296, branch `docs/moments-harness-handoff`. I read the rows on the branch and did not edit them. Replace the blocks below in that PR (ids are unchanged). The new row's id is assigned by `node scripts/agents/next-id.mjs`; the placeholder is `BL-NEW-8`.

```
#### BL-1432 NS-53 Moments: pure core engine (PRs 1 to 5)
- Status: proposed (docs/product/moments-tab/HARNESS-REPLAN-HYBRID.md; no founder decision needed to start; Karma or the founder sets it to ready once the spec is on develop). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: L. Depends on: none.
- Satisfies: NS-53-R16, NS-53-R17, NS-53-R36, NS-53-R37 to R53, NS-53-R59, NS-53-R201, NS-53-R204 to R207, NS-53-R223, NS-53-R267, NS-53-R281, NS-53-R286.
- Scope: `packages/core/src/moments` (types, reasons without RSN-ALBUM, five verbs, rules.ts data including NEAR_SECONDS and MIN_SPAN, exclude, group with offsetAt, span rule and near-duplicate rule, rank, collage with tile 1 a heart else the middle session, occasions, momentsFor registry, place.ts with an injected table and the home-place rarity rule, a synthetic 10 row table for tests), the `asha-lib-v1` generator and goldens including three frames 4 seconds apart, a restored duplicate, and 60/30 and 30/60 day place splits, in `packages/core/test/golden/`. The `Moment` type has no album member. No react-native, expo or fs import. There is no core handle: `principal-architect` reviews these PRs. Split into PRs 1 to 5, one PR each.
- Done when: the goldens, property tests and the import-graph test pass, RSN-SUGGEST and RSN-ALBUM are absent from the enum, and the junk-rate bar of R281 is written before the harness runs.

#### BL-1433 NS-53 Moments: tab shell, decisions store and content (PRs 6, 8, 12)
- Status: proposed (HARNESS-REPLAN-HYBRID.md; Karma or the founder sets it to ready). Mode: agent. Owner: design systems, mobile engineer, content. Milestone: M15. Size: M. Depends on: BL-1432 for types.
- Satisfies: NS-53-R1 to R10, NS-53-R172, NS-53-R215, NS-53-R221, NS-53-R245, NS-53-R246, NS-53-R192, NS-53-R270, NS-53-R285, NS-53-R294.
- Scope: the fourth tab behind F1, `tab-jobs`, `MOMENT_SOURCES`, the `moments/pick` route row; the `moments.json` store of section 17.1 with no album and no picture members (about 50 lines smaller than first sized); content keys: tab, reasons, ask, primer naming date, time and place, states, the picker door and host-sheet strings (one key family, a verb, no digit or count word, a heading that is not the tab name), and the value proposition text only after the founder approves O-48. Album chooser strings are out. Three PRs (6, 8, 12), one concern each.
- Done when: navigation tests, schema tests (corrupt, higher version, rename-write) and the content rules pass, including the mode-scoped claim test (R300).

#### BL-1434 NS-53 Moments: device spikes G1a-L (library) and G1a-P (picker)
- Status: proposed (HARNESS-REPLAN-HYBRID.md and FREEZE-CHECKLIST.md 1.3; the simulator part of G1a-P needs no founder decision; the device part needs the founder's phone). Mode: pair. Owner: mobile engineer. Milestone: M15. Size: S to M (G1a-L is S; G1a-P is M in two sessions, a simulator one then a device one). Depends on: none.
- Satisfies: NS-53-R204, NS-53-R255 (dropped, closed by the hide-day check), NS-53-R290; gates G1a-L and G1a-P.
- Scope: G1a-L, the five library unknowns plus whether a Favorites flag is readable under Limited. G1a-P, section 21 of the spec: the hidden-bars matrix (Layout A or B), Apple's first-time text per access state, what the item provider gives for date and GPS, picks under Limited, per-type limits and what the picker shows at the limit, VoiceOver and Switch Control task completion, iCloud and eight concurrent downloads, app lock and the switcher snapshot, theme override, a video pick under Expo defaults for SDK 57 (surprise permission prompt), what a video container keeps for location. A throwaway branch, never merged; an Asha library built for the purpose (no real family library); read-outs hold timings, rates and yes or no only.
- Done when: dated read-outs are filed in `docs/release/<x.y.z>.md`.

#### BL-1435 NS-53 Moments: scribe-library native module and thumbnail view (PRs 9, 10, 11, 18)
- Status: blocked (BL-1434 G1a-L read-out; gate G3 to merge; G11a-lib). Mode: agent. Owner: mobile engineer, privacy engineer. Milestone: M15. Size: XL (four PRs, one concern each). Depends on: BL-1434, BL-NEW-8 for 18a.
- Satisfies: NS-53-R110, NS-53-R220, NS-53-R222, NS-53-R226, NS-53-R228, NS-53-R233, NS-53-R236, NS-53-R277.
- Scope: the function list of R220 (no picker functions; the picker is BL-NEW-8), the `ScribeLibraryThumbnail` view for cards and day tiles, the config-plugin usage string by profile and the build-time exclusion of `scribe-library` where F2 is off, the source scans and guard scripts, copy-for-attach from library assets in `scribe-photo` (PR 18, which depends on the PR 18a type). Follows the `expo-native-module` skill. Check `compliance/FENCE.json` before touching `app.config.ts`.
- Done when: the scans, the iOS compile job, the call-site reachability test and the binary and plist scan (no photo-library usage string or PhotoKit symbol in a profile where F2 is off) pass.

#### BL-1436 NS-53 Moments: screens, flows and places (PRs 13 to 17, 19 to 23)
- Status: blocked (BL-1433, BL-1435). Mode: agent. Owner: mobile engineer, design systems. Milestone: M15. Size: XL (ten PRs, one concern each). Depends on: BL-1433, BL-1435.
- Satisfies: NS-53-R11 to R36 (screens), NS-53-R208 to R219, NS-53-R232, NS-53-R253, NS-53-R254, NS-53-R265, NS-53-R269, NS-53-R275, NS-53-R276, NS-53-R287, NS-53-R291, NS-53-R295.
- Scope: PRs 13 and 14 (components, PR 14 gains the door row, the Limited calm line and the host sheet frame with a placeholder body) may start once BL-1433 is done and need no native module; PRs 15 to 17 and 19 to 23 follow BL-1435. PR 17 has no album chooser and no all-pictures grid; PR 20 is the reduced viewer (one plain full-width enlarge, about 150 lines); PR 21 has five verbs and the Hidden choices list. The picked-set hand-off (PR 19b) is in BL-NEW-8. Place table PR 5b is not in this row: it waits for licensed counsel's reading of the dataset licence (G11b).
- Done when: the N layer flows (BL-1437) pass and the L3 matrix of the states that differ is baselined, with the host sheet baselined against a flat placeholder body.

#### BL-1437 NS-53 Moments: the N test layer (PR 24)
- Status: proposed (HARNESS-REPLAN-HYBRID.md; the Asha generator can start once PR 1 of BL-1432 lands; Karma or the founder sets it to ready). Mode: agent. Owner: qa engineer. Milestone: M15. Size: M. Depends on: BL-1432.
- Satisfies: NS-53-R225, NS-53-R107, NS-53-R257, NS-53-R297.
- Scope: the Asha library script loaded by `simctl addmedia`, Maestro flows through `fixtureSource`, `fixturePicker` and the real module; the flows stop at the host sheet because Maestro cannot drive inside Apple's out-of-process picker (the picker is a named device row); the canary of R162 extended to attach (library, picker), Keep, outbox, push mapper and export. Fictional family Asha only.
- Done when: the script, the flows and the extended canary run in the existing test commands and fail on a seeded leak; the picker device rows are listed in `DEVICE_TEST_PLAN.md`.

#### BL-1438 NS-53 Moments: release gates G1b to G11 and the F2 flip (PR 25)
- Status: blocked (founder, counsel, device; the gates apply before store submission, not before coding). Mode: human. Owner: platform, legal, privacy engineer, security engineer. Milestone: M15. Size: M. Depends on: BL-1436, BL-NEW-8.
- Satisfies: NS-53-R171, NS-53-R222, NS-53-R238 to R244, NS-53-R262, NS-53-R277, NS-53-R278, NS-53-R301.
- Scope: the guard script that fails the production profile when F2 is on and a G11a-lib line is missing, and when the door is on and the G11a-photo line is missing; the evidence index of section 21.1; Notes for Review under `docs/release/`; the five founder signatures (RV-23 for the door); G4 (with the new tasks), G5 (frame and task completion), G6 (mode-scoped claim test) and G7 picker rows; the counsel packet sub-items (Q1 (c), (d), Q4 (b), Q6 (b), Q7 (b), Q8 (b)). The first release includes the library read (Route B, founder ruling 21 Nov); the F2 flip is the founder's. Anything that sends a notification or email is phase 2 and waits.
- Done when: the guard fails a production build with a missing gate line (either part) and passes with all of them; the founder pastes the workflow step.

#### BL-NEW-8 NS-53 Moments: scribe-picker module and picked-set hand-off (PRs 18a, 18b-1a, 18b-1b, 19b; later 18b-2, 18c)
- Status: proposed (HARNESS-REPLAN-HYBRID.md; 18a can start now; 18b-1a waits for the G1a-P simulator read-out and the Apple reference read). Mode: agent. Owner: mobile engineer, with a `security-architect` read requested in each native PR body. Milestone: M15. Size: L (four PRs now, two later, one concern each). Depends on: none for 18a; BL-1434 (G1a-P simulator part) for 18b-1a; BL-1433 and the PR 14 door row for 19b.
- Satisfies: NS-53-R88, NS-53-R269, NS-53-R271, NS-53-R272, NS-53-R273, NS-53-R274, NS-53-R279, NS-53-R282, NS-53-R283, NS-53-R296, NS-53-R297.
- Scope: PR 18a, the `AttachRequest` type and the one stripper contract. PR 18b-1a, new local module `apps/mobile/modules/scribe-picker` (custom Swift through expo-modules-core, podspec iOS 17.0, no new dependency, one plain `PHPickerConfiguration()` with no library and no identifier), modal multi-select of pictures only in our sheet, the native contract (limit enforced twice, bounded concurrency, per-item closed codes, cleanup, iCloud progress and Cancel), the scans of R271, the `DATA_CLASSIFICATION.md` 4.6 row, the threat-model rows. PR 18b-1b, the date read with an allow-list of keys, the canary-GPS fixture and the changed scan. PR 19b, hand-off from a picked set to capture. Later: 18b-2 (inline host, after the picker device read-out) and 18c (video, after the read-back). `scribe-photo` is not edited by these PRs and keeps its pins. Follows the `expo-native-module` skill; the door depends on nothing in `scribe-library`.
- Done when: the scans, the iOS compile job and the zero-residue test (including a process kill between pick and strip) pass; the canary finds no coordinate, file name or day outside the stored copy; capture Add and the tab door call the same function.
```

## 4. An honest note for a challenger

The seven hybrid reviews were written by AI sessions playing executive roles, and so was this edit. Nobody independent has read any of it. Several statements about Apple's picker rest on a WWDC session summary, Apple reference pages read through a fetch tool and forum threads, not on a device, and every one of them stays UNVERIFIED until G1a-P. The CAIO and engineering reviewer asked for a challenger who is neither an author nor a reviewer (a human reader or a different model family) to read three findings before the founder signs:

- EXH-ENG-1 (BLOCKER): the picker host cannot live in `scribe-photo`; a new module `scribe-picker`; cut the library-configured picker (D3, R271). Is a new module right, or is rewriting the pins in `scribe-photo` with a `security-architect` read smaller and safer? Does one plain `PHPickerConfiguration()` really cover Limited and Full access with no identifier?
- EXH-ENG-4: the door cannot ship alone without PR 18a and PR 19b (D4, 19.4). Check the dependency chain, including whether `AttachRequest` really belongs before PR 9.
- EXH-ENG-7: the quality bar for suggestions (span rule, `NEAR_SECONDS`, home-place rarity, junk bar). The values are hypotheses; the harness of R205 decides, and the reviewer said so.

Also worth a second reader: D10 (the value proposition, founder-only), D11 (names in notes against the shipped planner) and the decision that "Not this one" stores a day key only, which keeps the existing behaviour of R54 and was read from the instruction "session-scoped, undoable, stores no picture or album id" (the instruction could also mean it should not persist across launches; confirm which).

## 5. What this change did not do

No PR, no merge, no push to `develop` or `main`. `docs/BACKLOG.md` and PR #1296 are untouched; the text in section 3 is proposed. No code, migration, decision entry or counsel contact. `EXPERIENCE-AND-MOTION.md` was not on `origin/wip/moments-experience` when checked, so it is a pending input and nothing from it is folded in. The requirement-trace figure of the spec was not recomputed (the repo's `node scripts/trace.mjs` reads the V2 PRD, not this spec).
