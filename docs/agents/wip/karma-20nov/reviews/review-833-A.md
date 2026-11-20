## Review A at 45c35116c7c9eaded5caa672d920208557a870df: CHANGES

Lens A: correctness, build config, dependency pin, licences and preflight, tests that fail on old code. PR #833, BL-931 slice 1 (NS-01), split from #796. Read-only. Nothing posted.

### What I read
- Head confirmed with `gh api .../pulls/833 --jq .head.sha`: 45c35116c7c9eaded5caa672d920208557a870df. Merge base with develop: a17254f6.
- The PR body. CLAUDE.md. docs/engineering/PRINCIPLES.md. ADR 0028 at the #797 head 1bee878b (it never names the picker package; D1 covers storage only). PRD docs/product/prd/01-photo-with-a-letter.md rows NS-01-R2 and R22 and section 10. NX-39-R52 in docs/roadmap/next/03-requirements/NX-39-memory-library.md:260. BL-878. docs/agents/cto/RULINGS.md CR-62 (lines 570-592). docs/ops/RELEASE.md:135.
- The full diff `git diff origin/develop...45c35116`: 10 files, +187 -4.
- Package sources: expo-image-picker 57.0.20 `plugin/build/withImagePicker.js`, `ios/ExpoImagePicker.podspec` and the iOS Swift files. expo-image-loader 57.0.1 `expo-module.config.json`. @expo/config-plugins 57.0.9 `build/ios/Permissions.js` (applyPermissions). @expo/prebuild-config `build/plugins/withDefaultPlugins.js` (legacyExpoPlugins). expo 57.0.26 `bundledNativeModules.json`.

### What I ran
I used a scratch worktree at the head, with the root node_modules hard-linked from the repo. The repo's node_modules has no expo-image-picker, expo-image-loader, expo-local-authentication or expo-clipboard. I downloaded those four locked tarballs from registry.npmjs.org. All four sha512 values match package-lock.json. I extracted them into the worktree's copy only.
1. Integrity: the picker and loader tarball hashes equal the lockfile entries and the test constants (photos-picker-config.test.ts:14-15).
2. Registry and SDK: 57.0.20 was published 2026-09-24. expo 57.0.26 `bundledNativeModules.json` names `expo-image-picker ~57.0.20` and `expo-image-loader ~57.0.1`, so the exact pin is the SDK's own version. The other expo-* deps use `~57.x` ranges. The picker has no install or postinstall script, its only dependency is `expo-image-loader ~57.0.1`, and its peer is `expo *`. Its iOS podspec targets 16.4, below the app's iOS 17.
3. `npm install --package-lock-only --ignore-scripts`: "up to date", no lockfile change.
4. `node scripts/licences/generate.mjs --check`: up to date (156 entries) with every locked package present. Against develop's licences.json it reports the file as stale, which is correct. Mutation (expo-image-picker line removed from components.mjs): fails with "what ships in the app is not decided".
5. `node scripts/licences/verify-shipped.mjs` (the RC gate at RELEASE.md:135): exit 1 at the head: "128 npm packages in the iOS build, 129 listed. listed, not in the build: expo-image-loader@57.0.1". At the develop state, with the same node_modules and the picker removed: exit 0, 127 = 127. Scratch trial with the loader moved to NOT_SHIPPED and the file regenerated: exit 0, 128 = 128.
6. vitest with every locked package present: photos-picker-config, app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest, store-sign-in-capabilities and account-deletion-switch all pass (10 files, 354/354). The full apps/mobile suite also passes (274 files, 5069/5069).
7. vitest at the sandbox baseline (expo-local-authentication and expo-clipboard absent, picker present): 75 tests fail in 9 files. They are the 8 known baseline files (config 34, privacy-manifest 22, store-sign-in-capabilities 11, licences 2, app-lock-wiring 1, capabilities 1, hosting-ios17 1, preflight-production 1) plus photos-picker-config 2. In photos-picker-config the two prebuild tests fail with `PluginError: Failed to resolve plugin for module "expo-local-authentication"`. All 75 pass once the two packages are present, so the missing packages are the whole cause. In the untouched sandbox the picker is also absent, so photos-picker-config fails for the same reason (package not installed).
8. Mutations, each reverted afterwards:
   - M1: drop `cameraPermission: false` (app.config.ts:316). 2 tests go red in photos-picker-config: C2 ("expected undefined to be false") and C3 ("expected [ 'NSCameraUsageDescription' ] to deeply equal []"). config, preflight-production and app-lock-wiring stay green.
   - M2: remove the whole plugin line. 2 tests go red: C2 ("expo-image-picker is listed") and C3 (two keys appear). This confirms the legacyExpoPlugins claim in the comment at app.config.ts:314-315.
   - M3: make askedConfigText return plain `JSON.stringify(parts)`. app-lock-wiring goes red ("expected [ 'photosPermission', (1 more) ] to deeply equal []").
   - M4: revert preflight-testflight.mjs:282 to `JSON.stringify`. Only capabilities.test.ts "a key id listed twice" goes red, because it expects exactly one FAIL line. Nothing tests the call site directly.
   - M5: change the picker integrity in the lockfile and the pin to `~57.0.20`. C1 goes red and lists both problems.
   - Old code: develop's app.config.ts, package.json, package-lock.json and preflight-lib.mjs run against the new tests. 4 tests go red: C1 twice, C2, and app-lock-wiring ("askedConfigText is not a function"). C3 stays green on develop. That is expected: it is a regression guard.
9. Introspected Info.plist and entitlements (getPrebuildConfigAsync plus compileModsAsync with introspect) for development, preview and production are identical between develop and the head. The usage keys are NSLocalNetworkUsageDescription (dev client), NSFaceIDUsageDescription and NSMicrophoneUsageDescription. There is no NSPhotoLibrary, NSCamera or NSLocation key and no application-groups entitlement.
10. With a real `expo prebuild --platform ios --no-install`: `preflight-testflight.mjs --profile testflight` gives 0 fail and 60 pass; `--profile preview` gives 0 fail and 61 pass. Both report "generated Info.plist asks for the microphone and Face ID only", and the entitlements did not change. `preflight-production.mjs` gives 0 fail and 19 pass.
11. `npx tsc --noEmit -p apps/mobile`: 0 errors with every locked package present. With expo-local-authentication and expo-clipboard absent, exactly the 5 known errors: help-fallback.tsx 1 (TS2307) and app-lock/controller.ts 4 (TS2307, TS2322, TS7006 twice). Nothing in apps/mobile/src imports the picker or the loader.
12. Added lines: none has a non-ASCII byte (grep -P '[^\x00-\x7F]' on the + lines). The board row at BOARD.md:97 has 5 cells, matching the header at BOARD.md:8.
13. Check-runs at the head (00:24 UTC, 20 Nov). Green: required, applied migrations unchanged, compliance-fence, tests and content rules, typecheck, install, database rules, web, web e2e, edge functions, no e2e seam, native files changed. Still queued in the iOS compile workflow since 00:03-00:05 UTC: "store-profile Release launch (testflight env, no seam, 20 s)" and "iOS simulator build (no signing)".

### Findings

Must fix
1. scripts/licences/components.mjs:128 and apps/mobile/src/generated/licences.json:913-921. expo-image-loader is listed as shipping in the iOS app, under 'storage'. It does not ship on iOS. Its expo-module.config.json says `"platforms": ["android"]`, it has no ios folder, the picker podspec depends only on ExpoModulesCore, and the JS bundle never imports it. components.mjs:10-11 puts Android-only code in NOT_SHIPPED with a reason. The repo's own check, `npm run licences:verify -w @scribe/mobile`, fails at this head ("listed, not in the build: expo-image-loader@57.0.1") and passes on develop. RELEASE.md:135 requires that check to exit 0 on the RC commit, so the next RC would stop on it.
   Fix: move 'expo-image-loader' to NOT_SHIPPED with a reason such as "Android only: the image picker Android loader, no iOS code", then regenerate licences.json. I tried exactly this in scratch: `generate.mjs --check` is clean and verify-shipped exits 0 (128 = 128). The PR body line "The licences list gains both packages" should change to match.

Notes
1. App Store upload risk, UNVERIFIED. The picker's iOS code links `AVCaptureDevice.requestAccess(for: .video)` (ImagePickerPermissionRequesters.swift:13), `PHPhotoLibrary.requestAuthorization` (:86) and the UIImagePickerController camera source (ImagePickerModule.swift:108). The plist now has neither NSCameraUsageDescription nor NSPhotoLibraryUsageDescription, which is what NS-01-R22 asks for. App Store Connect processing can send ITMS-90683 (missing purpose string) when code references these APIs without the key. I could not check whether that is a warning or blocks the build. The native module is linked in every profile, whatever EXPO_PUBLIC_PHOTOS says. So the risk applies to the first TestFlight or store upload from develop after this merges, not only once photos ship. Neither the simulator build nor the store-profile Release launch can show it. Suggest adding "App Store Connect processing email (ITMS-90683)" to Not verified and reading that email on the first upload. If Apple wants the keys, R22 needs a ruling.
2. The pin is one patch behind. npm's `sdk-57` dist-tag is 57.0.21, published 2026-11-05. 57.0.20 is still the version expo 57.0.26 names, so it is compatible. If the 11 Nov security review (C1) chose 57.0.20 on purpose, no action is needed. I could not find that review to check.
3. Nothing tests the call site at preflight-testflight.mjs:282 directly (see M4). app-lock-wiring.test.ts:270-275 checks `extraPermissions(asked)` but not `askedConfigText(`. One `expect(pre).toContain('askedConfigText([cfg.ios')` would cover it.
4. askedConfigText (preflight-lib.mjs:147-149) drops every key ending in Permission that is set to false, at any depth and for any plugin. That matches Expo's applyPermissions, where false deletes the key. It cannot hide an added key. The generated-plist check (preflight-testflight.mjs:583-588) is still the real guard, and it passes at the head with a real prebuild.
5. photos-picker-config.test.ts:76-83: `built()` saves and restores EXPO_PUBLIC_PHOTOS but never sets it. That is dead code, and it reads as if the test covered the flag. The C3 test also evaluates only the default (development) profile. Outside the test I checked development, preview and production by introspection, and testflight and preview with a real prebuild; all were clean.
6. Test text claims more than the test checks:
   - photos-picker-config.test.ts:64-68: the title says "no other expo package or install script", but the test only checks install scripts on expo-image-* keys.
   - :106-107: the comment says "no new entitlement, no app group", but the test only checks application-groups.
   - :2 says C1 to C4, but no test is tagged C4.
   - :103: `^NSPhotoLibraryAdd` is redundant next to `^NSPhotoLibrary`.
7. Android, for later: with microphonePermission set to a string, the picker plugin adds RECORD_AUDIO and blocks CAMERA (withImagePicker.js, Android part). expo-audio already asks for RECORD_AUDIO. There is no Android build today; keep this in mind for the Android port.
8. The board row at BOARD.md:97 says "slice 1 of 5", while the PR body says 8 PRs. Both are consistent if 5 counts the numbered slices and 8 counts the PRs (1, 2, 3a, 3b, 4a, 4b, 4c, 5). The row format is fine.

### Config plugin and plist, checked against the source
- app.config.ts:316 passes `microphone`, the same const (app.config.ts:138) that expo-audio gets at :303. The evaluated config holds the identical string (test :95 passed). applyPermissions writes `permissions[k] || infoPlist[k] || default`, so the plugin order does not change the result. Using a string and not false is correct: false would delete the microphone key if the picker's mod ran last.
- `photosPermission: false` and `cameraPermission: false` delete NSPhotoLibraryUsageDescription and NSCameraUsageDescription (Permissions.js, applyPermissions). On iOS the plugin only calls createPermissionsPlugin. It writes no entitlement, no app group and no other key. The introspection diff and the real prebuild confirm this.
- The picker ships no PrivacyInfo.xcprivacy. A grep of its iOS sources for required-reason APIs (file timestamps, UserDefaults, boot time, disk space) finds none. The generated PrivacyInfo still equals the config (preflight PASS).

### Not verified
- An EAS build, a device plist read, and the picker opening on a phone with no prompt (NS-01-R2).
- App Store Connect processing (ITMS-90683): see Note 1.
- The macOS store-profile Release launch and the iOS simulator build: still queued at 00:24 UTC.
- The text of the 11 Nov security review (conditions C1 to C4). I did not find it on develop or in the #796 comments I searched.
- CODEOWNERS and the NX-39-R52 process items (security-architect review, maintainer record). These are process, outside lens A.
- verify-shipped ran on Linux. It reads autolinking and a Metro export, not a macOS build.

Reviewer: independent of the author (CR-44).
