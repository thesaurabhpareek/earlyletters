# Proposed: AX5 screens and accessibility-tree evidence job (BL-409)

Status: proposal. `.github/workflows/` cannot be edited by agents; the founder applies the patch. Nothing here has been run in GitHub Actions.
Security lens: this proposal targets `.github/workflows/` (it adds one workflow file), although the PR itself touches only `docs/ops` and `apps/mobile`.

## What it adds

`docs/ops/proposed/workflows/a11y-evidence.patch` creates `.github/workflows/a11y-evidence.yml`: one job, `ax5` (its name reads "Unnamed-control check and emulation screenshots; not AX5 conformance"), path filtered, not a required check (a required check that never reports blocks merges that do not touch the app), the same pinned actions as the e2e-web proposal (`docs/ops/proposed/workflows/e2e-web.patch`). It is a separate file from `.github/workflows/web-e2e.yml`, which on develop runs the site checks for `apps/web` and is not related. It runs only `apps/mobile/e2e-web/j25-ax5-evidence.flow.ts` with `JOURNEY_SHOTS=1` and `A11Y_STRICT=1`, then uploads the four AX5 screenshots (Review, a letter, Settings, the Plus gate), their step JSON and the traces.

## What a green run means

A green job means: no control in the four recorded steps lacks an accessible name, and four emulated screenshots exist. It does not mean AX5 conformance: a browser accessibility tree is not VoiceOver (no rotor, focus order, traits or grouping) and web scaling is not iOS Dynamic Type. The workflow name and the job name carry the sentence "unnamed-control check and emulation screenshots; not AX5 conformance". The patch adds no summary step (that would change its hunk size); when one is added, it starts with the same sentence.

## Where 3.571 comes from

The emulated font scale 3.571 is React Native's iOS AX5 multiplier, `FONT_SCALE.ax5` in `apps/mobile/src/lib/a11y.logic.ts`. The "about 3.1" in `docs/tdd/09-accessibility-design-system.md` is a type-size ratio (53/17 pt for H1), a different quantity. The two are not meant to match.

## What already runs in `npm test` (no workflow change)

- `apps/mobile/test/a11y-controls.test.ts`: fails on an unnamed icon-only control in `apps/mobile/src` (a Pressable or Touchable with no label, text or spread; a Button with an icon and no label or accessibilityLabel). This is the "CI fails on an unlabeled icon-only control" part of BL-409, in the existing unit job.
- `apps/mobile/test/a11y-tree.test.ts`: the pure parser (`e2e-web/support/a11y-tree.ts`) that turns the browser's accessibility tree into role, name and order.

Every step JSON written by `e2e-web/support/journey.ts` now carries `a11y.tree` (role, name, order) and `a11y.unnamed`. With `A11Y_STRICT=1` (only this job sets it) an unnamed control fails the step; without it, the journey runs are unchanged.

## Cost

One `npm ci`, a Chromium install and four short flows. `apps/mobile/e2e-web/support/global-setup.ts` loops over all four builds (plain, seed, server-on, seam) and exports each one that is missing, whatever flow is filtered, so a cold run does four Expo web exports, not one. Time: unmeasured; no run has happened. Timeout 15 minutes. That is above the 10 minute CI budget, so the job stays parallel and non-required and adds no time to the required path; if the first run is slower than the budget allows, split it rather than raise the timeout.

## How to verify

1. `git apply --check docs/ops/proposed/workflows/a11y-evidence.patch`, then `git apply` it.
2. Run it by hand (workflow_dispatch). Expect four J25 steps and `ax5-evidence` with `J25-01.png` to `J25-04.png` and four JSON files.
3. Open one JSON: `a11y.tree` lists roles and names in page order; `a11y.unnamed` is `[]`.
4. Mutant: remove an `aria-label`/`accessibilityLabel` from a control on one of the four screens; the job fails naming the step.

## Rollback

Delete `.github/workflows/a11y-evidence.yml`. Nothing else depends on it; the flow file and the tests keep working without it.

## Not covered

The VoiceOver script run and its evidence file in `docs/qa/evidence` stay a device task (BL-279). The web run is emulation, not device evidence. The J25 flow and the strict mode have not been run (no dependencies in the authoring sandbox); the first manual run may need selector fixes.
