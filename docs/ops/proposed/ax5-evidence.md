# Proposed: AX5 screens and accessibility-tree evidence job (BL-409)

Status: proposal. `.github/workflows/` cannot be edited by agents; the founder applies the patch. Nothing here has been run in GitHub Actions.
Security lens: this proposal targets `.github/workflows/` (it adds one workflow file), although the PR itself touches only `docs/ops` and `apps/mobile`.

## What it adds

`docs/ops/proposed/workflows/a11y-evidence.patch` creates `.github/workflows/a11y-evidence.yml`: one job, `ax5`, path filtered, not a required check (a required check that never reports blocks merges that do not touch the app), the same pinned actions as the e2e-web proposal. It runs only `apps/mobile/e2e-web/j25-ax5-evidence.flow.ts` with `JOURNEY_SHOTS=1` and `A11Y_STRICT=1`, then uploads the four AX5 screenshots (Review, a letter, Settings, the Plus gate), their step JSON and the traces.

## What already runs in `npm test` (no workflow change)

- `apps/mobile/test/a11y-controls.test.ts`: fails on an unnamed icon-only control in `apps/mobile/src` (a Pressable or Touchable with no label, text or spread; a Button with an icon and no label or accessibilityLabel). This is the "CI fails on an unlabeled icon-only control" part of BL-409, in the existing unit job.
- `apps/mobile/test/a11y-tree.test.ts`: the pure parser (`e2e-web/support/a11y-tree.ts`) that turns the browser's accessibility tree into role, name and order.

Every step JSON written by `e2e-web/support/journey.ts` now carries `a11y.tree` (role, name, order) and `a11y.unnamed`. With `A11Y_STRICT=1` (only this job sets it) an unnamed control fails the step; without it, the journey runs are unchanged.

## Cost

One `npm ci`, a Chromium install and four short flows on the seam build. Estimate 6 to 9 minutes (the seam build is one Expo web export; the existing journey run took 6 to 8 minutes for two builds and 55 flows). Unmeasured. Timeout 15 minutes, inside the 10 minute budget only if it stays a parallel, non-required job; it adds no time to the required path.

## How to verify

1. `git apply --check docs/ops/proposed/workflows/a11y-evidence.patch`, then `git apply` it.
2. Run it by hand (workflow_dispatch). Expect four J25 steps and `ax5-evidence` with `J25-01.png` to `J25-04.png` and four JSON files.
3. Open one JSON: `a11y.tree` lists roles and names in page order; `a11y.unnamed` is `[]`.
4. Mutant: remove an `aria-label`/`accessibilityLabel` from a control on one of the four screens; the job fails naming the step.

## Rollback

Delete `.github/workflows/a11y-evidence.yml`. Nothing else depends on it; the flow file and the tests keep working without it.

## Not covered

The VoiceOver script run and its evidence file in `docs/qa/evidence` stay a device task (BL-279). The web run is emulation, not device evidence. The J25 flow and the strict mode have not been run (no dependencies in the authoring sandbox); the first manual run may need selector fixes.
