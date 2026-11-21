# Moments tab (NS-53): what the traceability figure really measures

Status: findings, docs only. Branch `wip/moments-trace`, cut from `wip/moments-prd-v3` at b31a389b8. Nothing in `scripts/` or the spec was edited. Run 21 Nov 2026 by `qa`.

## Short answer

- "836 of 845" is real as a count, and I reproduced it: 845 lead-document ids are listed in section 26 of the spec, 9 are marked not carried, and 836 are named in the Satisfies column of at least one NS-53 row. It says an id is written down next to a row. It does not say that a PR builds the row, that a gate checks it, or that any test exists.
- `scripts/trace.mjs` did not produce it and cannot. It does not read `28-moments-tab.md` at all, and it does not know the `MT-*` ids.
- The real figure for "does this row have a home" is below. Of 301 rows, 140 are named by a PR item, a gate or the replan. 161 are named by none. No NS-53 row is cited by any test title, flow tag or test file in the repo (0 of 301).

## 1. What trace.mjs checks, and can it be pointed at the Moments spec

It has two readers. Neither reaches this spec as shipped.

1. The requirement reader (V2 `features/F*.md` or legacy `docs/prd/*.md`). It looks for ids shaped `X-REQ-nnn` or `X-NFR-nnn`. The spec has none of these. Running `node scripts/trace.mjs docs/product/prd --no-write` reads other files in that folder and still finds nothing from 28.
2. The NS reader (`collectNs`, BL-964). It reads the acceptance tables (`Id | Given... | Priority | Test...`) of the card files next to `14-test-plan.md`, then reports each P0 row as tested, partial, journey, device or untested. A row counts as tested only when a test title cites its id in brackets and the title is not skipped.

Run on this branch, unchanged: `node scripts/trace.mjs --no-write --json` gives `ns.cards 16, rows 1032, p0 537, tested 90`, and zero NS-53 ids anywhere. `--register docs/product/prd/28-moments-tab.md` only changes which file the P0 list is read from. The cards are still read from the folder, and the folder's file filter leaves 28 out.

Three things block it, so no flag or config reaches it. The paths and names are hard-coded; the only options are the ones in `--help`.

| # | Where | Problem |
|---|---|---|
| 1 | `CARD_FILE` (line 534) lists cards 00 to 12, 19, 21, 27. Card 28 is not in it | The file is never opened |
| 2 | `NS_SOURCE` (line 529) allows `[A-Z]\d{1,2}` | `NS-53-R100` to `R301` (202 of 301 rows) do not match, so only R1 to R99 are read |
| 3 | The priority column is matched as `/^Priority$/i` (line 563 area). The spec's header is `Pri` | Priority comes out empty for all 301 rows, so none is counted as P0 |

Smallest change, as a diff. Not applied. I tested it on a copy of the script outside the repo, run with `--repo` pointed at this branch.

```diff
--- a/scripts/trace.mjs
+++ b/scripts/trace.mjs
@@ export const NS_SOURCE
-(?:NS-\d{2}-[A-Z]\d{1,2}(?:-\d{1,2})?[a-z]?|
+(?:NS-\d{2}-[A-Z]\d{1,3}(?:-\d{1,2})?[a-z]?|
@@ const CARD_FILE
-const CARD_FILE = /^(?:0\d|1[0-2]|19|21|27)-[^/\\]*\.md$/;
+const CARD_FILE = /^(?:0\d|1[0-2]|19|21|27|28)-[^/\\]*\.md$/;
@@ in nsDefinitions
-const pc = t.header.findIndex((h) => /^Priority$/i.test(h));
+const pc = t.header.findIndex((h) => /^Pri(?:ority)?$/i.test(h));
```

With it: `cards 17, rows 1333` (the 301 NS-53 rows are read, 1032 + 301), `p0 740` (537 + 203 NS-53 P0 rows), `tested 90` (unchanged: not one of the new rows is tested), `p0NoBacklog 208` (was 5: no BACKLOG row cites an NS-53 id yet, and the replan's BL-1432 to BL-1438 are proposed text only). So the script, once patched, would report 203 of 203 NS-53 P0 rows untested. That is the honest test number today. Widening `\d{1,2}` also touches the other cards' id grammar, so the patch needs `trace.test.mjs` run and a PR from `qa`. It has the `Test` column limitation too: the spec has a `Layer` column and no test-title column, so "partial" and "device" statuses will not be set from the spec text.

## 2. Independent count: does each of the 301 rows have a home

Method (throwaway scripts in `/tmp/tr`, not committed): read the 301 rows `| NS-53-Rn |` of the spec; read three texts: section 19.4 (33-item PR plan v3), section 21 with 21.1 to 21.3 (gates G1a to G11), and `docs/product/moments-tab/HARNESS-REPLAN-HYBRID.md` (the header line "R1 to R301" is removed, since it names every row). A row has a home when its number appears there, as `Rn`, in a list, or in a range `Rn to Rm`. A row's own Layer column is read for the test.

The 19.4 table names no row ids, although its text says each PR carries them. In practice the PR homes come from the replan's BL-1432 to BL-1437 and BL-NEW-8 `Satisfies` lines, which are per group of PRs, not per PR. Gate homes come from section 21 plus the `Satisfies` of BL-1434 and BL-1438.

| Measure | Rows of 301 |
|---|---|
| Named by a PR item (19.4 text or a replan PR-group Satisfies line) | 117 strict, 119 counting prose mentions |
| Named by a gate (section 21, BL-1434, BL-1438) | 35 |
| Named by both a PR and a gate | 14 |
| Named by a PR or a gate | 138 strict, 140 counting prose mentions |
| Have a PR, a gate and a declared automated layer (L0 to L4) | 12 |
| Declare an automated layer (L0 to L4) in their own row | 266 (35 are L5, R or P only: manual, research or paperwork) |
| Cited by an actual test title, Maestro tag or test file | 0 |
| Named by no PR, no gate, not in the replan (orphans, prose mentions counted) | 161 |
| of which P0 | 104 of 203 P0 rows |

"Acceptance test named": the plan texts name no test per row. Section 21's G5 and G7 name device rows (W1 to W12, D-3) and the replan's BL-1437 names the N layer (PR 24) and the R162 canary, none of which has a file yet. So the only test evidence a row has is the layer it declares for itself, and none of those tests exist.

Read the 161 as "no explicit home", not as "no one will build it". Most are single behaviours in the screen, grouping and data sections that obviously fall under PRs 13 to 23, but the spec does not say which, and a row nobody names is a row nobody checks off. Range-expansion is generous (for example `R11 to R36` gives 26 rows a home in one phrase), so 161 is a floor.

### Rows with no home (161)

R54-R58, R60-R87, R89, R91-R106, R108, R109, R111-R161, R163-R170, R173, R174, R177-R191, R193, R195-R200, R202, R203, R224, R227, R229-R231, R234, R237, R247-R249, R251, R252, R256, R258-R261, R268, R284, R288, R289, R292, R298, R299.

Strictly (Satisfies lists only, ignoring prose mentions) R162 and R300 join the list: 163.

P0 rows among them (104): R54, R56, R61-R63, R65, R68-R73, R75-R81, R83-R87, R89, R93-R95, R97-R100, R102-R105, R109, R112-R117, R119, R120, R123, R124, R126, R127, R129-R143, R153-R157, R159, R160, R163-R167, R169, R170, R173, R182, R187-R189, R191, R193, R195-R197, R200, R202, R203, R227, R229-R231, R234, R247-R249, R251, R256, R258, R260, R299.

Manual-only rows (layer has no L0 to L4, 35): R7, R60, R80, R98, R101, R102, R118, R126, R143, R161, R168, R171, R174, R175, R200, R219, R235, R238, R239, R240, R242, R244, R250, R252, R259, R262, R263, R264, R266, R268, R288, R289, R290, R292, R301.

## 3. The real number, and the commands

- Carried (the claim in section 26): 836 of 845 lead ids appear in a Satisfies column; 9 are marked not carried. Reproduced: `node /tmp/tr/sat.mjs <worktree>` gave `s26_ids_listed 845, s26_nc 9, s26_with_row 836, in_satisfies_union_distinct 836, s26_claimed_but_not_in_any_Satisfies 0`. Every id:row pair in section 26 is backed by the row's own Satisfies cell. That is a documentation check only.
- Rows with a named PR home: 117 of 301 (39 percent); with a gate home: 35 (12 percent); with either: 138 (46 percent), 140 with prose mentions; with no home at all: 161 (53 percent), 104 of them P0.
- Rows with a test that exists: 0 of 301. `grep -rl 'NS-53-R' apps packages supabase scripts` returns nothing. With the patch above `trace.mjs` agrees: 203 of 203 NS-53 P0 rows untested.

Commands:

```
git worktree add /home/claude/wt-moments-trace wip/moments-trace
node scripts/trace.mjs --no-write --json                 # unchanged script: no NS-53 ids seen
cp scripts/trace.mjs /tmp/tr/ && <apply the 3-line diff above to the copy>
node /tmp/tr/trace.mjs --repo . --no-write --json        # patched copy: 17 cards, 1333 rows, p0 740, tested 90
node /tmp/tr/homes.mjs .                                 # PR, gate and orphan counts above
node /tmp/tr/sat.mjs .                                   # 836 of 845 reproduced
```

## What I would change in the spec

1. In section 26, replace "836 of 845 ids are carried" with the two measures the CPO review asked for (exec-review/cpo.md, finding on rows 177 to 191 and section 26): rows with an automated test, and rows with a named device or manual script. Today the first is 0.
2. Add a `PR` column (and a `Gate` column) to the NS-53 row tables, filled from 19.4, so a row without one is visible in the table itself. The 161 above are the work list.
3. `FREEZE-CHECKLIST.md` line 72 ("re-run trace.mjs to recompute 836 of 845") cannot be done with the script; point it at this report or at the patch once `qa` ships it.
4. Handoff: the three-line `trace.mjs` change belongs in its own `qa/` PR with a fixture in `scripts/trace.test.mjs`; `data-architect` and `mobile` own the row-to-PR mapping.
