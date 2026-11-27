# Proposal: CI steps for the SDK denylist, the dev-bypass bundle check and the placeholder scan (BL-2125)

Status: proposal, 27 Nov 2026. The pull request adds `scripts/guards/sdk-denylist.mjs` (list in `sdk-denylist.json`), `scripts/guards/bundle-dev-bypass.mjs`, `scripts/guards/placeholder-scan.mjs` and their tests, and wires the three tests into root `npm test`. Nothing under `.github/` changes (CR-22, D-124); Karma pastes the steps below.

## 1. SDK denylist: no new step needed

`scripts/guards/sdk-denylist.test.mjs` scans the real repository (`package-lock.json` and imports under `apps/` and `packages/`) as one of its tests, so the `npm test` that `ci.yml`, `testflight.yml` and `release-ios.yml` already run fails on a denylisted dependency (LEGAL-REQ-016). A separate step is optional, for a clearer log line:

```yaml
      - name: SDK denylist (LEGAL-REQ-016, BL-2125)
        run: node scripts/guards/sdk-denylist.mjs
```

## 2. Dev bypass in the exported bundle (BL-216)

The check reads an `expo export --no-bytecode` output as text. The export uses the profile's env from `apps/mobile/eas.json` through the helpers `.github/scripts/seam-guard.mjs` already exports, with any `EXPO_PUBLIC_*` of the runner removed. About 45 seconds per profile, no secrets.

`testflight.yml`, after "Release check B-8", before "Build on EAS":

```yaml
      - name: No dev bypass in the bundle (BL-216, BL-2125)
        run: |
          set -euo pipefail
          case "$PROFILE" in testflight|preview) ;; *) echo "unknown profile"; exit 1 ;; esac
          OUT="$RUNNER_TEMP/dev-bypass-$PROFILE"
          OUT="$OUT" node --input-type=module -e '
            import { readFileSync } from "node:fs";
            import { spawnSync } from "node:child_process";
            import { exportEnv, profileEnv } from "./.github/scripts/seam-guard.mjs";
            const eas = JSON.parse(readFileSync("apps/mobile/eas.json", "utf8"));
            const env = exportEnv(process.env, profileEnv(eas, process.env.PROFILE), false);
            const r = spawnSync("npx", ["expo", "export", "--platform", "ios", "--no-bytecode", "--clear", "--output-dir", process.env.OUT], { cwd: "apps/mobile", env, stdio: "inherit" });
            process.exit(r.status ?? 1);
          '
          node scripts/guards/bundle-dev-bypass.mjs "$OUT"
```

`release-ios.yml`, job `checks (G2)`, after "No e2e seam in the production bundle": the same step with `PROFILE: production` in its `env:` and the `case` line removed.

Optional, on pull requests: in `ci.yml`, job "no e2e seam in store bundles (B-8)", a step with the same `if: steps.changed.outputs.run == 'true'` that runs the block above once per store profile (`preview`, `production`, `testflight`), about two more minutes.

## 3. Placeholder scan: do not paste until the TODO is resolved

```yaml
      - name: No TODO publisher value in a release build (BL-2125)
        run: node scripts/guards/placeholder-scan.mjs --profile "$PROFILE"
```

In `testflight.yml` after "Preflight", and in `release-ios.yml` `checks (G2)` with `--profile production`, next to "No placeholder identity in the build".

Today `packages/brand/index.ts` `publisher.legalName` is `TODO: individual publisher (name set in legal documents, not in code)`, so this step fails every preview, testflight and production build. Its comment says the value is never to hold a real name (D-004) and nothing renders it. Before the step is pasted, someone decides whether that text is a placeholder still to be filled (then the build should stop, as the step does) or a permanent value (then it is reworded without `TODO`, in its own PR). Until then the script and its tests run in `npm test` against planted values only.

## How to verify

- `node --test scripts/guards/sdk-denylist.test.mjs scripts/guards/bundle-dev-bypass.test.mjs scripts/guards/placeholder-scan.test.mjs` (also in root `npm test`).
- Dev bypass on real exports, 27 Nov 2026: the production and preview exports pass (the flag is `!1`, both `onContinueDev` hits are a destructured name and a prop behind `devShortcutsAllowed ?`); a `--dev` development export fails, because the flag is an expression there, not a constant false.

## The way back

Remove the pasted steps. The scripts are inert without them, except the denylist test, which stays in `npm test`.
