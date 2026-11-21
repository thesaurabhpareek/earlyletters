# NS-53 Moments tab: harness hand-off

Status: PROPOSED. Written 21 Nov 2026 by `product`. Nothing here is decided; the founder signs each founder item.
Spec: `docs/product/prd/28-moments-tab.md` (R1 to R268, arrives in PR #1294). Freeze list: `docs/product/moments-tab/FREEZE-CHECKLIST.md`.
Backlog rows: BL-1432 to BL-1438 in `docs/BACKLOG.md`. This is the first file in `docs/agents/handoffs/`; no earlier hand-off location existed (the nearest is `docs/product/prd/24-engineering-handoff.md`).
Fictional family Asha only.

## 1. The founder ruling that shapes this

On 21 Nov the founder ruled that the first Moments release ships with the photo library read (Route B). There is no library-free first phase. The release gates G1 to G11 apply before store submission, not before coding. Native work waits on the G1a device spike and gate G3. Places and occasions are in scope; faces and naming people are out (open founder question O-30).

## 2. Start now

Take these in file order from the backlog once Karma or the founder sets them `ready` (they are `proposed` until the spec PR is on `develop`):

1. BL-1432, pure core PRs 1 to 5: types and reasons, grouping, ranking and collage, occasions and the registry, place lookup with a synthetic 10 row table. Pure TypeScript, no native import.
2. BL-1433, tab shell behind F1 (PR 6), `moments.json` store (PR 8), content keys (PR 12).
3. BL-1437, the Asha library generator, once PR 1 of BL-1432 has landed (it needs only fixtures).
4. BL-1434, the G1a spike, is a pair task with the founder's phone: the harness prepares the script-made Asha library and the read-out template; the founder runs it.

## 3. Must wait

- The native module and everything that calls it (BL-1435, and PR 15 to 17 and 19 to 23 of BL-1436): until the G1a read-out and gate G3.
- PR 5b, the place table package: until licensed counsel has read the dataset licence (G11b). Silence is never a pass.
- Anything that sends a notification or email: phase 2.
- The F2 flip and BL-1438: the founder, after G1b to G7, G10 and G11.
- Any spend (counsel, dataset licence, entity, insurance): none unless the founder signs a row of section 21.2 of the spec.

## 4. Who owns which PR

| PRs | Owner handle | Note |
|---|---|---|
| 1 to 5 (engine) | `mobile` | There is no `core` handle. `principal-architect` reviews each engine PR. |
| 6, 13, 14 (shell, components) | `design-systems` | Behind F1. |
| 8 (`moments.json`) | `mobile`, with `data-architect` reading the store contract | No server table; safety tiers stay on the device. |
| 12 (content) | `content` | Content rules apply; the primer names date, time and place. |
| 9, 10, 11, 18 (native) | `mobile`, `privacy` | Waits for G1a and G3. |
| 7 and any registry change | `analytics` | O-38: do not send `source: moment` in the first release (R87 stands). |
| 24 (N layer) | `qa` | |
| 25 and gates | `platform`, `legal`, `privacy`, `security` | Founder and counsel items. |

## 5. Rules for every run

Agents only open pull requests. They never merge, never push to `develop` or `main`, and label each PR `agent:<handle>`. One concern per PR, each carrying its row ids, under CODE-R02. Check `compliance/FENCE.json` before touching `app.config.ts` or any fenced path. No entry text, transcript, audio, child name, date, place or count in analytics, logs or crash reports. Machine labels never write or shape a person's words.

## 6. Proposed claim rows (text only, not added)

`docs/agents/CLAIMS.md` is at its 15-row cap and the cleanup PR #1283 is pending, so no row is added here. Each engineer adds their own row at start, with their own times (claimed UTC from `date -u`, expiry 72 hours later), and runs the REST open-PR check first.

```
| moments-core | mobile | feat/mobile-moments-core | (PR) | `packages/core/src/moments/**`, `packages/core/test/golden/moments*` | <claimed UTC> | <claimed + 72h> | BL-1432; pure TypeScript; REST open check at claim |
| moments-shell | design-systems | feat/design-moments-shell | (PR) | `apps/mobile/src/lib/moments/**`, `apps/mobile/app/(tabs)/**` (moments only), `packages/content/**/moments*` | <claimed UTC> | <claimed + 72h> | BL-1433; tab behind F1 |
| moments-native | mobile | feat/mobile-moments-library | (PR) | `apps/mobile/modules/scribe-library/**`, `apps/mobile/plugins/**` (library plugin only) | <claimed UTC> | <claimed + 72h> | BL-1435; waits for G1a and G3; check `compliance/FENCE.json` for `app.config.ts` first |
| moments-qa | qa | test/qa-moments-n-layer | (PR) | `apps/mobile/e2e/moments/**`, `scripts/guards/moments-*` | <claimed UTC> | <claimed + 72h> | BL-1437 and the guard of BL-1438 |
```

Claims for `docs/legal/**`, `packages/content/BRAND.md` and the claims inventory belong to `legal`, `content` and the CMO.

## 7. Founder items that still gate freeze

O-37, O-38, O-39, O-40, O-41, O-42, O-44, O-47, each with the default the spec already follows, are listed in FREEZE-CHECKLIST section 1.1. The decision on #1264 (superseded by the spec for the NS-53 rows) is also the founder's.
