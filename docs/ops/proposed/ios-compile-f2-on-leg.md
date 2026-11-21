# Proposal: a second `ios-compile` leg with the photo-moments flag (F2) on, and a prebuild scan of the F2-off leg

Status: proposal, 21 Nov 2026. Docs only. Nothing under `.github/` is edited by this file. Source: challenger read CH-ENG-4 of the Moments tab spec (`docs/product/prd/28-moments-tab.md` R222, R277, PR 11c, PR 25a and PR 25b). Needed only once PR 9 (`scribe-library`) is about to merge; until then there is no Swift to compile.

## Why

`.github/workflows/ios-compile.yml` builds the env of the `testflight` profile in `apps/mobile/eas.json` with `EXPO_PUBLIC_SERVER_FEATURES=off` and nothing else (the step "Build env from the eas.json testflight profile"). Under R222 `scribe-library` is excluded from the native project of any profile where F2 (`EXPO_PUBLIC_PHOTO_MOMENTS`, spec 19.2) is off. If the `testflight` profile has F2 off, the job never compiles the Swift of `scribe-library`, and the first compile of it happens in an EAS store build of a profile where F2 is on. The job also proves nothing about the exclusion itself.

## What to add (a matrix, `f2: [off, on]`, on the `compile` job only)

1. A matrix on the `compile` job: `strategy: { fail-fast: false, matrix: { f2: [off, on] } }`. The `launch` job is unchanged.
2. After the step "Build env from the eas.json testflight profile", one more step that overrides the flag for the leg (the names are those of spec 19.2; the config plugin of PR 11c reads them):

```yaml
      - name: Photo-moments flag for this leg
        env:
          F2: ${{ matrix.f2 }}
        run: |
          set -euo pipefail
          echo "EXPO_PUBLIC_MOMENTS_TAB=on" >> "$GITHUB_ENV"
          echo "EXPO_PUBLIC_PHOTO_MOMENTS=${F2}" >> "$GITHUB_ENV"
```

3. After "pod install", a step that reads the generated project (text, no build needed):

```yaml
      - name: scribe-library is in the project exactly when F2 is on
        working-directory: apps/mobile/ios
        env:
          F2: ${{ matrix.f2 }}
        run: |
          set -euo pipefail
          present=false; grep -q 'scribe-library' Podfile.lock && present=true
          key=false; grep -rq 'NSPhotoLibraryUsageString\|NSPhotoLibraryUsageDescription' --include=Info.plist . && key=true
          echo "F2=${F2} scribe-library pod: ${present}; photo-library usage string: ${key}"
          if [ "$F2" = off ] && { [ "$present" = true ] || [ "$key" = true ]; }; then
            echo "::error::F2 is off but scribe-library or the photo-library usage string is in the generated project"; exit 1
          fi
          if [ "$F2" = on ] && [ "$present" != true ]; then
            echo "::error::F2 is on but scribe-library is not in the generated project"; exit 1
          fi
```

   The picker module `scribe-picker` has no PhotoKit and no usage string and is present in both legs; the scan for the picker's own invariants is a unit scan (R271, R297) and is not part of this step.
4. Include `matrix.f2` in the two cache keys (`pods-...` and `dd-...`) so the legs do not share DerivedData, and in the `concurrency` group if the legs should not cancel each other.
5. The `changes` job already lists `apps/mobile/modules/`, `apps/mobile/app.config.ts` and `apps/mobile/package.json`; add `apps/mobile/eas.json` as in `docs/ops/proposed/workflows/ios-compile-eas-json.patch`, because a profile's F2 value lives there.

## What it does not prove

- That an EAS build excludes the module the same way a local `expo prebuild` does (G3-x, spec 21, stays a device-or-EAS read-out; UNVERIFIED).
- Anything about the binary: the symbol scan of R277 on a built store binary is a G11a-lib read-out, not a PR check.
- That Apple accepts a linked, unused PhotoKit framework; that is counsel's question and matters only if the fallback rule of R222 is the live one.

## Cost

One more macOS job per native PR (macOS runners are free on this public repository, see the header of `ios-compile.yml`), roughly doubling that job's minutes. PR 25a and PR 25b of the Moments plan (the release read-out guard, photo line and library line) do not depend on this leg, but PR 11b, PR 11c and PR 9 should not merge without it green.

## Who pastes

A workflow edit is `.github/**`, which agents never edit: the founder, or Karma under CR-73, pastes it with two reviews (`security-architect` reads `.github/**`). It is a proposal until then.
