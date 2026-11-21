# NS-53 Moments tab: freeze checklist and harness hand-off

Status: PROPOSED (nothing here is decided; the founder signs each founder item)
Date: 21 Nov 2026
Owner: `product` (Chief Product Officer role, acting for Karma)
Spec: `docs/product/prd/28-moments-tab.md` (268 rows, R1 to R268; section 27 records all 184 review findings)
Load when: you freeze the Moments spec, hand it to the harness, or file its backlog and claim entries.

Fictional family Asha only. Every date below is PROPOSED and the founder's to set. D-121's target of Tue 1 Dec is UNVERIFIED as still current.

## 1. What remains before freeze

The spec is freeze-ready in the sense that no BLOCKER is open without either an edit or a founder question carrying a recommended default. Three kinds of item remain, and none of them is something the spec can close alone.

### 1.1 Founder-only decisions (each with the default the spec already follows)

| Id | Decision | Recommended default | By (PROPOSED) |
|---|---|---|---|
| O-37 | Which slips if a library gate is open: the date, or only the library read | The library read only for G2 and G8 (written licensed-counsel answers); the date for everything else; silence from counsel is never a pass | Tue 24 Nov; invoked or not by Mon 30 Nov |
| O-38 | Send `source: moment` as an analytics enum | Do not send in the first release (R87 stands); G-2 is read from App Store Connect cohorts, the device row and the diary | Before the registry change |
| O-39 | The CPO cut list and the F2a/F2b flag split | Split F2; adopt the cut list of section 23.2 (applied to no row's priority by the spec) | Tue 24 Nov |
| O-40 | Engage licensed California counsel (spend) | A capped brief on the ten questions of section 21.3 | Tue 24 Nov |
| O-47 | Entity and individual publisher, with Moments in the decision | Decide before D-004 on Fri 27 Nov; if counsel is silent, start the entity in parallel | Fri 27 Nov |
| O-41 | Store screenshots: hide the tab bar or wait for trademark clearance | Hide the tab bar in every frame | Fri 27 Nov |
| O-32 | Special occasions: dates we know, or also events recognised from pictures (K-SUG) | Dates we know; K-SUG NOT PLANNED | With G10 |
| O-30 | Faces and naming people | OUT, not decided here | When the founder chooses |
| O-44 | Stored picture copies in the iPhone backup | Disclose, plus device row D-3 in G11 (the CLO prefers excluding the folder; counsel Q7 default) | Before G2 |
| O-45 | Postal address for the lifecycle email | Decide with O-47; phase 2 only | With O-47 |
| O-46 | Numbers for the measurable and the stop line (section 20.1) | Founder sets them | Before PR 16 |
| O-42 | Sign RV-01 to RV-22 as four signatures, with H-10 (the machine-label boundary) in the third | Four signatures | With G10 |
| O-01 | Tab position | Home landing, Moments second | Tue 24 Nov |
| O-02, O-03, O-05, O-07, O-16, O-18, O-33, O-35 | The older founder-only questions of section 23 | The defaults in section 23 | Per section 23 |
| Spend | Any spend at all (counsel, dataset licence, entity, insurance, builds, email allowance) | None unless the founder signs a row of section 21.2 | n/a |

Items that are not the founder's (owner and default are in section 23): O-04, O-06, O-08, O-09, O-11, O-12, O-15, O-17, O-19, O-22 to O-28, O-34, O-43 (Chief Design Officer: keep the For you and Recent switch).

### 1.2 Counsel items (a written answer from licensed counsel, with name and date, or the part stays dark)

| Q | Question in short | Stays dark if silent |
|---|---|---|
| 1 | Label and consent for a build that reads dates and coordinates on the phone with servers on | The label and policy are not changed; the library read waits |
| 2 | Picture-timed reminders (4.5.4, 5.1.2(vi), both readings) | F4 off |
| 3 | Naming a city from picture location; the in-memory home place | Place lines |
| 4 | DPLA 3.3.3(F) and location in a library picture; readable under Limited | Place lines |
| 5 | Trademark attorney: Moments as a tab label (classes 9, 42, 45) and in screenshots | Fallback label in screenshots (O-28, R194) |
| 6 | Terms: other people's children, approximate labels, knowledge duty | Terms 4.2.0 not published; the library read waits |
| 7 | Deletion promise versus a picture copy in an iPhone backup | Exclude the folder from backup, with a carve-out sentence |
| 8 | Policy mechanics and absolute sentences | Say what we receive, never where it lives (H-11) |
| 9 | Publisher and liability (5.1.1(ix), entity, cover, public address) | Founder starts an entity in parallel |
| 10 | Place dataset licence for a paid app; later geocoder caching | No places in the first release |

Also owed before any servers-on store build links the policy: the founder corrects the build list of Privacy Policy 3.0.0 (line 21 and the label contradictions; R266). The counsel packet is not yet engaged (W0-13); the Moments section of packet 1.8.0 is drafted by `legal`.

### 1.3 Device spike G1a (first week, before PR 9 merges)

On the founder's phone or a simulator with a script-made Asha library. Answers only the unknowns, with timings and rates in the read-out and no place, date, count or album:

1. Is `asset.location` readable under Limited access, and without a Core Location permission.
2. The source-type default, the subtype predicate and the delivery options.
3. What the default fetch does with the hidden album and Recently Deleted.
4. The iCloud-only skip.
5. The place table size and accuracy against the bars of R204 (zero wrong-country on at least 100 geotagged pictures, a wrong-city ceiling the founder sets).

The spike must not use the D7 prototype for places: that prototype draws venue-level labels and is redrawn at city level first (R219).

### 1.4 Freeze exit checks

- [ ] The founder has answered, or accepted the default for, O-37, O-38, O-39, O-40, O-41, O-42, O-44, O-47.
- [ ] A challenger who is neither the author nor a reviewer has read the freeze copy (the CAIO's conflict-of-interest note: an AI session reviewing an AI-written spec).
- [ ] The CPO freeze review has regraded priorities (EX-CPO-5; the spec deferred the regrade so row ids stay stable).
- [ ] `legal` has the Moments section of packet 1.8.0 and the register rows of R239.
- [ ] `node scripts/trace.mjs` is re-run on the lead branches to recompute the 836 of 845 figure (it was carried forward, UNVERIFIED this round).
- [ ] Content rules scan passes on the PRD (no em or en dashes, curly quotes, ellipsis characters or emoji).

## 2. Harness hand-off summary (section 19.4 of the spec)

Twenty-six PRs in five waves, about 7,600 changed lines (ASSUMED), each under CODE-R02, each carrying its row ids. There is no `core` handle, so engine PRs go to `mobile` with `principal-architect` reviewing.

| Wave | PRs | Notes |
|---|---|---|
| A (parallel) | 1, then 4; 6, 8, 12; and the G1a spike | 1 types and reasons; 4 occasions and the registry; 6 tab shell; 8 `moments.json` store; 12 content |
| B | 2, 3, 5, 9, 13, 14, 7 | 2 and 3 group and rank; 5 place lookup with an injected table; 9 `scribe-library` (waits for G1a, G3 to merge); 13 and 14 components; 7 analytics decision |
| C | 10, 11, 15, 18, 16 | 10 native thumbnail view; 11 config plugin and guard scripts; 15 `use-moments`; 18 attach copy paths; 16 For you screen |
| D | 17, 19, 20, 21, 22, 23, 24 | 17 primer, Recent, day sheet; 19 hand-off; 20 viewer; 21 verbs and Me; 22 places on cards; 23 Home pointer and nudges; 24 the N layer |
| E | 25, the gate read-outs, then the F2 flip | 25 release read-out guard; the founder pastes the workflow step |
| Also | 5b | Place table package: waits for the licence read by licensed counsel (G11b) |

### 2.1 Can start now, before the founder answers

- Pure core PRs 1 to 4 (types and reasons, grouping, ranking and collage, occasions and the registry), and PR 5 with a synthetic 10 row table: pure TypeScript, no native, no founder decision needed.
- Wave A without native: PR 6 (tab shell behind F1), PR 8 (`moments.json` store), PR 12 (content).
- The Asha library generator of PR 24 can begin once PR 1 lands (it needs only fixtures).

Must wait: PR 9 and everything native (G1a read-out, G3 to merge); PR 5b (licence); PR 17 onward (PR 10 and PR 16); anything that sends a notification or email (phase 2); the F2 flip (G1b to G7, G10, G11).

## 3. Proposed backlog and claim entries (text only)

`docs/BACKLOG.md` and `docs/agents/CLAIMS.md` are not edited here. Karma assigns ids with `node scripts/agents/next-id.mjs`, which counts `develop` and every open PR, and files these through the owners' own PRs. Placeholders are `BL-NEW-n`.

### 3.1 BACKLOG entries (format of the existing `#### BL-nnnn` blocks)

```
#### BL-NEW-1 NS-53 Moments: pure core engine (PRs 1 to 5)
- Status: ready (no founder decision needed). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: L. Depends on: none.
- Satisfies: NS-53-R16, NS-53-R17, NS-53-R36, NS-53-R37 to R53, NS-53-R59, NS-53-R201, NS-53-R204 to R207, NS-53-R223, NS-53-R267.
- Scope: `packages/core/src/moments` (types, reasons, rules.ts data, exclude, group with offsetAt, rank, collage, occasions, momentsFor registry, place.ts with an injected table), the `asha-lib-v1` generator and 20 goldens in `packages/core/test/golden/`. No react-native, expo or fs import.
- Done when: the goldens, property tests and the import-graph test pass, and RSN-SUGGEST is absent from the enum.
- Source: `docs/product/prd/28-moments-tab.md` sections 6, 7, 7a, 19.4.

#### BL-NEW-2 NS-53 Moments: tab shell, decisions store and content (PRs 6, 8, 12)
- Status: ready. Mode: agent. Owner: design systems, mobile engineer, content. Milestone: M15. Size: M. Depends on: BL-NEW-1 for types.
- Satisfies: NS-53-R1 to R10, NS-53-R172, NS-53-R215, NS-53-R221, NS-53-R245, NS-53-R246, NS-53-R192.
- Scope: the fourth tab behind F1, `tab-jobs`, `MOMENT_SOURCES`, the `moments/pick` route row; `moments.json` store with the contract of section 17.1; the content keys with the primer naming date, time and place.
- Done when: navigation tests, schema tests (corrupt, higher version, rename-write) and the content rules pass.

#### BL-NEW-3 NS-53 Moments: device spike G1a (founder phone)
- Status: ready (needs the founder's phone). Mode: human with agent harness. Owner: mobile engineer, founder. Milestone: M15. Size: S.
- Satisfies: NS-53-R204, NS-53-R255; gate G1a.
- Scope: the five unknowns of FREEZE-CHECKLIST section 1.3; read-out with timings and rates only.
- Done when: a dated read-out is filed in `docs/release/<x.y.z>.md`.

#### BL-NEW-4 NS-53 Moments: scribe-library native module and thumbnail view (PRs 9, 10, 11, 18)
- Status: blocked (G1a read-out; G3 to merge; G11a). Mode: agent. Owner: mobile engineer, privacy engineer. Milestone: M15. Size: XL (four PRs). Depends on: BL-NEW-3.
- Satisfies: NS-53-R110, NS-53-R220, NS-53-R222, NS-53-R226, NS-53-R228, NS-53-R233, NS-53-R236.
- Scope: the function list of R220, the `ScribeLibraryThumbnail` view, the config-plugin usage string by profile, the source scans and guard scripts, the copy-for-attach paths in `scribe-photo`. Follows the `expo-native-module` skill.
- Done when: the scans, the iOS compile job and the call-site reachability test pass.

#### BL-NEW-5 NS-53 Moments: screens, flows and places (PRs 13 to 17, 19 to 23)
- Status: blocked (BL-NEW-2, BL-NEW-4). Mode: agent. Owner: mobile engineer, design systems. Milestone: M15. Size: XL.
- Satisfies: NS-53-R11 to R36 (screens), NS-53-R208 to R219, NS-53-R232, NS-53-R253, NS-53-R254, NS-53-R265.
- Done when: the N layer flows (BL-NEW-6) pass and the L3 matrix of the states that differ is baselined.

#### BL-NEW-6 NS-53 Moments: the N test layer (PR 24)
- Status: ready after PR 1. Mode: agent. Owner: qa engineer. Milestone: M15. Size: M.
- Satisfies: NS-53-R225, NS-53-R107, NS-53-R257.
- Scope: Asha library script loaded by `simctl addmedia`, Maestro flows through `fixtureSource` and the real module; the canary of R162 extended to attach, Keep, outbox, push mapper and export.

#### BL-NEW-7 NS-53 Moments: release gates G1b to G11 and the F2 flip (PR 25)
- Status: blocked (founder, counsel, device). Mode: human. Owner: release manager, legal, privacy, security. Milestone: M15. Size: M.
- Satisfies: NS-53-R171, NS-53-R222, NS-53-R238 to R244, NS-53-R262.
- Scope: the guard script that fails the production profile when F2 is on and a gate line is missing; the evidence index of section 21.1; Notes for Review under `docs/release/`.
```

### 3.2 CLAIMS entries (format of the table in `docs/agents/CLAIMS.md`: id, owner session, branch, PR, globs, claimed UTC, expires UTC, note)

```
| moments-core | mobile | feat/mobile-moments-core | (PR) | `packages/core/src/moments/**`, `packages/core/test/golden/moments*` | <claim time UTC> | <claim time + 72h> | BL-NEW-1; pure TypeScript; REST open check at claim |
| moments-shell | design-systems | feat/design-moments-shell | (PR) | `apps/mobile/src/lib/moments/**`, `apps/mobile/app/(tabs)/**` (moments only), `packages/content/**/moments*` | <claim time UTC> | <claim time + 72h> | BL-NEW-2; tab behind F1 |
| moments-native | mobile | feat/mobile-moments-library | (PR) | `apps/mobile/modules/scribe-library/**`, `apps/mobile/plugins/**` (library plugin only) | <claim time UTC> | <claim time + 72h> | BL-NEW-4; waits for G1a; check `compliance/FENCE.json` for `app.config.ts` first |
| moments-qa | qa | test/qa-moments-n-layer | (PR) | `apps/mobile/e2e/moments/**`, `scripts/guards/moments-*` | <claim time UTC> | <claim time + 72h> | BL-NEW-6 and the guard of BL-NEW-7 |
```

Claims for `docs/legal/**`, `packages/content/BRAND.md` and the claims inventory belong to their owners (`legal`, `content`, the CMO) and are not proposed here.

## 4. What this branch did not do

No PR was opened, nothing was merged, and nothing went to `develop` or `main`. `docs/BACKLOG.md`, `docs/agents/CLAIMS.md`, `docs/legal/**` and `packages/content/BRAND.md` are untouched. No code, migration or decision entry was written. The trace script was not re-run. Every legal and store-rule fact keeps the reviewer's label and stays UNVERIFIED until the CCO or `regulatory-affairs` reads it.
