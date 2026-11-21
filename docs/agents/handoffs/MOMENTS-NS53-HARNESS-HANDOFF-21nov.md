# NS-53 Moments tab: harness hand-off (hybrid design, v3, 41 PR items)

Status: PROPOSED. Written 21 Nov 2026 by `product`. Nothing here is decided; the founder signs each founder item. Replaces the file of the same name in PR #1296 (v2 spec, 7 rows).
Spec: `docs/product/prd/28-moments-tab.md` v3 (R1 to R301; arrives in the spec PR `docs/moments-prd-v3`, head `47922c6c` when this was last aligned). The PR plan is section 19.4 (41 items, about 10,130 changed lines, ASSUMED, not measured; PR 25 is split into 25a and 25b). Dependency graph, waves and sizes: `docs/product/moments-tab/HARNESS-REPLAN-HYBRID.md`. Freeze list: `docs/product/moments-tab/FREEZE-CHECKLIST.md`.
Backlog rows: BL-1432 to BL-1438 and BL-1447 (ids kept) and the new BL-1448 to BL-1452 in `docs/BACKLOG.md`. Fictional family Asha only. Sizes are ASSUMED changed lines, not measured.

## 1. The founder ruling that shapes this

On 21 Nov the founder ruled that the first Moments release ships with the photo library read (Route B). The release gates G1b to G11 apply before store submission, not before coding. Native work waits on the G1a-L and G1a-P read-outs and gate G3. Places and occasions are in scope; faces and naming people are out (open founder question O-30). The hybrid design adds Apple's picker in our sheet as the door that works in every access state.

## 2. Start now (exactly this set)

Every row is `proposed` or `blocked`; none is `ready`. Karma or the founder sets `ready`. The set, in order:

1. PR 0, the spec edit (PR #1314), row BL-1448. Blocked on the founder: the `size:accepted` label and the `Size exception` body line (O-60).
2. PR 0b, the D14 sweep (BL-1448), after PR 0.
3. PRs 1 to 4 (BL-1432), pure TypeScript. PR 1 first; PR 2 and PR 4 after it; PR 3 after PR 2.
4. PR 5 with a synthetic 10 row table (BL-1432). The real place table is BL-1451 and is not startable.
5. PRs 6, 8 and 12 (BL-1433). PR 12's door and host strings wait about a day for O-54; the value proposition waits for O-48.
6. PR 18a, the `AttachRequest` type and the stripper contract (BL-1447). It depends on nothing in `scribe-library`.
7. PR 18b-0, the picker threat-model rows (BL-1450): a docs item with no blocker that gates PR 18b-1a. Added to the set on 21 Nov (the first draft held it out).
8. The simulator picker spike, G1a-P simulator part (BL-1434), on a throwaway branch with a script-made Asha library. Read-outs hold timings, rates and yes or no only.
9. PR 3b, the R205 real-library harness (BL-1449), after PRs 2 and 3 land.

Nothing else starts. Not in the set, although the spec 19.4 text or the replan lists them as startable: the G1a-L spike and the Asha generator of PR 24. No native module PR is in the set: `scribe-library` (PR 9, 10, 11b, 11c, 18) waits for G1a-L, G3 and G3-x; `scribe-picker` (PR 18b-1a and later) waits for the G1a-P simulator read-out.

## 3. Must wait, and on what

| Item | Waits for |
|---|---|
| PR 9 (BL-1435) | G1a-L read-out; G3 and the G3-x exclusion spike to merge; founder O-61 (second `ios-compile` leg) |
| PRs 10, 11b, 18 (BL-1435) | PR 9 (PR 18 also PR 18a) |
| PR 11c (BL-1435) | PR 11b; G3-x read-out; O-61 |
| PR 18b-1a (BL-1447) | PR 18a; PR 18b-0 (BL-1450); G1a-P simulator read-out; `mobile`'s read of Apple's picker reference pages (EXH-ENG-17) |
| PRs 18b-1b, 18b-1c, 11a (BL-1447) | PR 18b-1a |
| PR 25a (BL-1447; wave D; part of the door) | PR 11a only; the founder pastes the workflow step |
| PR 19b (BL-1447) | PRs 6, 12, 14, 18a, 18b-1a, 18b-1b, 18b-1c |
| PR 18d (BL-1453) | PRs 18b-1a, 18b-1c, 19b; a `security-architect` read and a founder-visible note |
| PR 18b-2, 18c (BL-1447, later) | G1a-P device read-out (and O-53, O-57); the video read-back (R290) |
| PR 5b (BL-1451) | G11b, the dataset licence read by licensed counsel; silence is never a pass; before PR 22 |
| PR 7 (BL-1452) | PR 6; O-49 and O-38 (default: do not send) |
| PRs 13 to 17, 19 to 23 (BL-1436) | BL-1433 for 13 and 14; BL-1435 for 15 to 17 and 19; BL-1451 for 22; O-50 for the planner change in 23; O-48 for the value proposition |
| PR 24 (BL-1437) | PRs 9, 14, 17, 18b-1a |
| PR 25b and the F2 flip (BL-1438; wave E) | PR 25a, PR 11b and PR 11c; G1b to G7, G10 (five signatures, RV-23 for the door), G11a-lib, G11a-photo; counsel's Q5 to Q7 and Q9 (R278); O-52 |
| Anything that sends a notification or email | Phase 2 |
| Any spend | None unless the founder signs a row of section 21.2 of the spec |

The door (the picker, pictures only) ships only when 18a, 18b-0, 18b-1a, 18b-1b, 18b-1c, 19b, 11a and 25a exist and the photo flag's legal set is in the same build (R278). It does not wait for 9, 10, 11b, 11c, 15, 16, 17 or 25b. Waves: 11a, 11b, 11c, 5b, 10, 15, 16, 18 and 19b are C; 17, 18d, 19 to 24 and 25a are D; 25b and the F2 flip are E; 18b-2 and 18c come later. Sizes sum to about 10,130 changed lines (ASSUMED, not measured).

## 4. Rows and owners (all 41 items)

| Row | PR items | Owner name in the row | Agent handle that does the work |
|---|---|---|---|
| BL-1448 | 0, 0b | founder | `product` writes; the founder labels and merges (`product` has no `backlog_owner_names` and the roster is not edited, so `founder` stands as Owner and the dispatcher never assigns it) |
| BL-1432 | 1, 2, 3, 4, 5 | mobile engineer | `mobile`; `principal-architect` reviews (no core handle) |
| BL-1449 | 3b | qa engineer | `qa` |
| BL-1433 | 6, 8, 12 | design systems, mobile engineer, content | `design-systems` (6), `mobile` (8, `data-architect` reads the store contract), `content` (12) |
| BL-1434 | G1a-L, G1a-P spikes | mobile engineer | `mobile`, with the founder's phone for device parts |
| BL-1450 | 18b-0 | security engineer | `security-architect` writes (the handle has no `backlog_owner_names`; `security engineer` is the nearest accepted name and belongs to the `security` handle, so a human assigns it) |
| BL-1435 | 9, 10, 11b, 11c, 18 | mobile engineer, privacy engineer | `mobile`; `qa` scripts and `privacy` text in 11b; `privacy` text in 11c |
| BL-1447 | 11a, 18a, 18b-1a, 18b-1b, 18b-1c, 19b, 25a, later 18b-2, 18c | mobile engineer, qa engineer, privacy engineer | `mobile`, with a `security-architect` read requested in each native PR body; `qa` scripts and `privacy` text in 11a; `qa` writes 25a and the founder pastes the workflow step |
| BL-1453 | 18d | mobile engineer, security engineer | `mobile`; `security-architect` reads |
| BL-1451 | 5b | mobile engineer, privacy engineer | `mobile`; `privacy` approves |
| BL-1452 | 7 | analytics engineer | `analytics` |
| BL-1436 | 13 to 17, 19 to 23 | mobile engineer, design systems | `design-systems` (13, 14), `mobile` (the rest) |
| BL-1437 | 24 | qa engineer | `qa` |
| BL-1438 | 25b | qa engineer, platform, legal, privacy engineer, security engineer | `qa` writes the library line of the guard; the founder pastes the workflow step and signs |

Each row ends with "Acceptance by row ids" per PR, taken from the proposed mapping of spec section 26b (the mapping is itself PROPOSED and awaits a read by `mobile` and `data-architect`).

## 5. Rules for every run

Agents only open pull requests. They never merge, never push to `develop` or `main`, and label each PR `agent:<handle>`. One concern per PR, each carrying its row ids, under CODE-R02 (PR 0 is the one named exception, with the founder's label). Check `compliance/FENCE.json` before touching `app.config.ts` or any fenced path. Native Swift follows the `expo-native-module` skill. No entry text, transcript, audio, child name, date, place, picture identifier or count in analytics, logs or crash reports. Machine labels never write or shape a person's words.

## 6. Founder items that still gate freeze

O-60 (the size label for PR 0, needed now), O-61 (the second `ios-compile` leg, before PR 9 or PR 11c merges), O-37, O-38, O-39, O-40, O-41, O-42, O-44, O-47, and the v3 items O-48, O-49, O-50, O-52, O-53, O-54, each with the default the spec follows, are listed in `FREEZE-CHECKLIST.md` section 1.4 and spec section 23. The experience spec adds O-27 (extended), O-56 to O-59. A challenger read of EXH-ENG-1, EXH-ENG-4 and EXH-ENG-7 by someone who is neither author nor reviewer is also owed before signing (`HARNESS-REPLAN-HYBRID.md` section 4).
