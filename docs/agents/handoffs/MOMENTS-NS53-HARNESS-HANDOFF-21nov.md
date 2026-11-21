# NS-53 Moments tab: harness hand-off (hybrid design, v3)

Status: PROPOSED. Written 21 Nov 2026 by `product`. Nothing here is decided; the founder signs each founder item. Replaces the file of the same name in PR #1296 (v2 spec, 7 rows).
Spec: `docs/product/prd/28-moments-tab.md` v3 (R1 to R301; arrives in the spec PR `docs/moments-prd-v3`). Dependency graph, waves and the replacement row text: `docs/product/moments-tab/HARNESS-REPLAN-HYBRID.md`. Freeze list: `docs/product/moments-tab/FREEZE-CHECKLIST.md`.
Backlog rows: BL-1432 to BL-1438 and BL-1447 in `docs/BACKLOG.md`. Fictional family Asha only.

## 1. The founder ruling that shapes this

On 21 Nov the founder ruled that the first Moments release ships with the photo library read (Route B). The release gates G1b to G11 apply before store submission, not before coding. Native work waits on the G1a-L and G1a-P read-outs and gate G3. Places and occasions are in scope; faces and naming people are out (open founder question O-30). The hybrid design adds Apple's picker in our sheet as the door that works in every access state.

## 2. Start now

Take these in file order once Karma or the founder sets them `ready` (they are `proposed` until the spec is on `develop`):

1. BL-1432, pure core PRs 1 to 5 (types and reasons with no album, grouping with the span rule, ranking and collage, occasions and the registry, place lookup with a synthetic 10 row table). Pure TypeScript, no native import.
2. BL-1433, tab shell behind F1 (PR 6), `moments.json` store (PR 8), content keys (PR 12; the door and host strings wait about a day for the limits decision O-54, the value proposition for O-48).
3. BL-1447, PR 18a only (the `AttachRequest` type and stripper contract); it depends on nothing in `scribe-library`.
4. BL-1434, the simulator part of the G1a-P spike and the G1a-L spike, on a throwaway branch with a script-made Asha library; the device part needs the founder's phone.
5. BL-1437, the Asha library generator, once PR 1 of BL-1432 has landed.

## 3. Must wait

- BL-1435 and everything that needs `scribe-library`: the G1a-L read-out, and G3 to merge.
- PR 18b-1a and 18b-1b (BL-1447): the simulator read-out of G1a-P and `mobile`'s primary-source read of Apple's picker reference pages (EXH-ENG-17).
- 18b-2 and 18c (later): the G1a-P device read-out, the video read-back, and G11a-photo.
- PR 5b, the place table package: licensed counsel's reading of the dataset licence (G11b). Silence is never a pass.
- The door's store build: the photo flag's legal set (label, policy, Terms, backup line) and counsel's Q5 to Q7 and Q9 (R278).
- Anything that sends a notification or email: phase 2.
- The F2 flip and BL-1438: the founder, after G1b to G7, G10 and G11.
- Any spend: none unless the founder signs a row of section 21.2 of the spec.

## 4. Who owns which PR

| PRs | Owner handle | Note |
|---|---|---|
| 1 to 5 (engine) | `mobile` | There is no `core` handle. `principal-architect` reviews each engine PR. |
| 6, 13, 14 (shell, components, door row, host sheet frame) | `design-systems` | Behind F1. |
| 8 (`moments.json`) | `mobile`, with `data-architect` reading the store contract | No server table; safety tiers stay on the device. |
| 12 (content) | `content` | Content rules apply; the primer names date, time and place. |
| 9, 10, 18 (library native) | `mobile` | Waits for G1a-L and G3. |
| 11 (config plugin, guards) | `privacy`, `qa` | |
| 18a, 18b-1a, 18b-1b, 19b (picker) | `mobile`, with a `security-architect` read requested in each native PR body | 18a can start now. |
| 7 and any registry change | `analytics` | O-38 and O-49: do not send `source: moment` or a start-mode enum in the first release. |
| 24 (N layer) | `qa` | |
| 25 and gates | `platform`, `legal`, `privacy`, `security-architect` | Founder and counsel items. |

## 5. Rules for every run

Agents only open pull requests. They never merge, never push to `develop` or `main`, and label each PR `agent:<handle>`. One concern per PR, each carrying its row ids, under CODE-R02. Check `compliance/FENCE.json` before touching `app.config.ts` or any fenced path. Native Swift follows the `expo-native-module` skill. No entry text, transcript, audio, child name, date, place, picture identifier or count in analytics, logs or crash reports. Machine labels never write or shape a person's words.

## 6. Founder items that still gate freeze

O-37, O-38, O-39, O-40, O-41, O-42, O-44, O-47, and the v3 items O-48, O-49, O-50, O-52, each with the default the spec follows, are listed in `FREEZE-CHECKLIST.md` section 1.4. The experience spec adds O-27 (extended), O-56 to O-59. A challenger read of EXH-ENG-1, EXH-ENG-4 and EXH-ENG-7 by someone who is neither author nor reviewer is also owed before signing (`HARNESS-REPLAN-HYBRID.md` section 4).
