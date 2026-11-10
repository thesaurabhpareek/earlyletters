# Proposed workflow change: Apple Team ID for the TestFlight submit

Status: proposal, 9 Nov 2026. Nothing under `.github/` is changed by this pull request (the Claude GitHub App cannot edit `.github/workflows/`). The founder applies the patch below to `.github/workflows/testflight.yml`.

## Why

`eas submit` runs non-interactively here. With the App Store Connect key stored in EAS, it takes the Apple Team ID from the key record, then from `EXPO_APPLE_TEAM_ID`, and otherwise asks, which fails with no stdin ("Apple Team ID:", then "skipping TestFlight setup"; eas-cli 24.10.0 `build/credentials/ios/appstore/resolveCredentials.js`). The Team ID is not a secret (`docs/release/TESTFLIGHT.md`); the founder read it from his Apple Developer Membership page.

## The patch

Add one line to the env of the `Build on EAS` step:

```diff
--- a/.github/workflows/testflight.yml
+++ b/.github/workflows/testflight.yml
@@ -121,3 +121,5 @@
           # EXPO_TOKEN after the first green run with this one (AF-07, AF-22): then nothing can fall back to it.
           EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
+          # Not a secret. Lets the non-interactive submit sign in to App Store Connect without asking.
+          EXPO_APPLE_TEAM_ID: VX2Z7FGV23
         run: |
```

Line numbers may have moved; the anchor is the `EXPO_TOKEN:` line in the `Build on EAS` step.

## UNVERIFIED

Whether the EAS server attaches the build to "Family" once the prompt is gone, until a real build runs. Check the next build in TestFlight.
