## Review B at 45c35116c7c9eaded5caa672d920208557a870df: CHANGES

Lens B: privacy, permissions, store privacy declarations, what a family is asked and promised.
PR #833, slice 1 (picker pin, licences, preflight) of BL-931. Base develop at a17254f6. Head confirmed by `gh api .../pulls/833 --jq .head.sha` before and after the review.

### What I read and ran
- PR body and all 10 changed files (`git diff a17254f6..45c35116`), including the generated licences.json.
- CLAUDE.md privacy rules. PRD `docs/product/prd/01-photo-with-a-letter.md` (rows R2, R6, R15, R19, R22; sections 7, 10, 13). NX-39 rows R1, R2, R4, R51, R52 and open item (18) at `docs/roadmap/next/03-requirements/NX-39-memory-library.md:146-149, 259-260, 334`.
- ADR 0028 from #797's branch (`docs/adr-photo-seal-find-data-11nov`). CR-62 at `docs/agents/cto/RULINGS.md:570-592`. Neither governs this slice: no storage, no schema.
- `apps/mobile/src/lib/privacy-manifest.ts`, `docs/legal/app-store-privacy-labels.md`, `docs/legal/privacy-policy.md:45`, `apps/mobile/scripts/preflight-lib.mjs`, `apps/mobile/scripts/preflight-testflight.mjs:276-290, 576-650`.
- expo-image-picker is not in this sandbox's node_modules. I downloaded `expo-image-picker-57.0.20.tgz` and `expo-image-loader-57.0.1.tgz` from registry.npmjs.org into the scratchpad. Their sha512 values equal the lockfile and the test's PICKER_INTEGRITY and LOADER_INTEGRITY. I read the plugin and the Swift sources. I ran none of that code.
- `node_modules/@expo/config-plugins` 57.0.9 `build/ios/Permissions.js`, `build/plugins/withMod.js`, `build/plugins/withRunOnce.js`; `node_modules/@expo/prebuild-config` 57.0.16 `build/getPrebuildConfig.js`, `build/plugins/withDefaultPlugins.js`.
- Apple's required-reason API type page (developer.apple.com documentation JSON, fetched today). Apple developer forum thread 744965 (ITMS-90683). docs.expo.dev and forums.expo.dev do not resolve in this session.
- CI: check-runs and the "tests and content rules" job log (job 135978090037).
- Not run: the tests locally (the sandbox lacks expo-image-picker, expo-local-authentication and expo-clipboard), `npm run preflight`, any build.

### Checks

1. No new usage key, entitlement or app group; system picker. PASS (config level).
   - `apps/mobile/app.config.ts:316` lists the plugin with `photosPermission: false, cameraPermission: false`.
   - Plugin source (57.0.20, `plugin/build/withImagePicker.js:48-57`) passes the options to `IOSConfig.Permissions.createPermissionsPlugin`. In config-plugins 57.0.9 `build/ios/Permissions.js:28-30`, a value of `false` deletes the key; a string sets it; undefined writes the default. So `false` deletes NSPhotoLibraryUsageDescription and NSCameraUsageDescription. Verified from source.
   - The plugin touches only the Info.plist on iOS (plus Android permissions and colours). No entitlement, no app group, no Podfile change. Verified from source.
   - Listing it matters, as the comment says. `withDefaultPlugins.js:185` has expo-image-picker in `legacyExpoPlugins`, applied after user plugins (`getPrebuildConfig.js:43-57`). `createRunOncePlugin` (`withRunOnce.js:20-36`) skips the second, prop-less run. Verified from source.
   - System picker: `ImagePickerModule.swift:94-95, 150-160` launches PHPickerViewController when `allowsEditing` is false and the source is the library. Nothing calls the module in this slice (`git grep` finds no import under `apps/mobile/src`; only licences.json names it).
   - Test proof: `apps/mobile/test/photos-picker-config.test.ts:99-108` introspects the iOS mods and finds no NSPhotoLibrary, NSCamera or NSLocation key and no application-groups entitlement. The positive control at `:110-117` shows the defaults would write three keys.

2. Microphone string unchanged. PASS.
   - `app.config.ts:138` builds one `microphone` constant. expo-audio uses it at `:303`, the picker at `:316`. Mods run newest first, and both write the same value, so the plist value is the same whichever runs last.
   - `photos-picker-config.test.ts:97` asserts the picker option equals the expo-audio option.
   - What a family reads in the microphone prompt does not change. No founder decision needed for this point.

3. Privacy manifest and App Privacy labels. PASS on the manifest, with notes; labels stay true.
   - Source scan of all 14 Swift files: the only file-metadata call is `URLResourceKey.fileSizeKey` (`MediaHandler.swift:549`). Apple's NSPrivacyAccessedAPIType page (fetched today) does not list `fileSizeKey` under file timestamp or disk space. No UserDefaults, systemUptime, mach_absolute_time, stat family, getattrlist family or activeInputModes. expo-image-loader has no iOS code. So no new required-reason category. The app manifest already declares all four categories it could need (`privacy-manifest.ts:74-121`).
   - Collected data: nothing leaves the phone in this slice. Labels doc answers stay true with the flag off and on, as long as NS-01-R15 holds later: "Photos or Videos: No" (`app-store-privacy-labels.md:54`), privacy policy "we do not collect ... photos" (`privacy-policy.md:45`).

4. No data leaves the phone; no child name or entry text in logs. PASS.
   - No src code, no network call, no analytics event, no log line. Tests read local files and the prebuild config only.

5. Flag-off proof. Runtime: enough. Upload and binary: not proven. See Must fix 1.
   - At this head nothing reads EXPO_PUBLIC_PHOTOS (only the test's save and restore at `photos-picker-config.test.ts:76-83`, which never sets it). The plugin line is unconditional, so the plist result is the same with the flag on or off. That is a stronger result than "flag off".
   - But the flag does not gate the native module. ExpoImagePicker is autolinked into every build from this merge on, production included.
   - The module's start-up code only registers permission requesters (`ImagePickerModule.swift:28-33`); it asks nothing. So a family is asked nothing new at runtime.

6. ASCII and family data. PASS. 0 added lines with a non-ASCII byte. No real or fictional family names in the diff.

7. CI at the head. PASS. The three required checks for develop (`applied migrations unchanged`, `compliance-fence`, `required`) are success. `required` aggregates install, unit, db, functions, typecheck and seam-guard, all success. The unit job log shows `test/photos-picker-config.test.ts (6 tests)` passed, with `app-lock-wiring`, `licences`, `config` and `preflight-production`. Not required and still queued when read: "iOS simulator build (no signing)" and "store-profile Release launch". The PR's merge plan asks for the second.

### Must fix

1. Upload risk from purpose strings (ITMS-90683), and the PR's flag claim. No code change; a merge condition.
   - From this merge, every build links code that calls camera and library APIs: `AVCaptureDevice.requestAccess(for: .video)` (`ImagePickerPermissionRequesters.swift:13`), `PHPhotoLibrary.requestAuthorization` (`:86`), and `UIImagePickerController` with `.camera` (`ImagePickerModule.swift:61, 108`). The plist deliberately has no NSCameraUsageDescription or NSPhotoLibraryUsageDescription.
   - Apple's ITMS-90683 text, quoted in Apple developer forum thread 744965, says: "If you're using external libraries or SDKs, they may reference APIs that require a purpose string. While your app might not use these APIs, a purpose string is still required." That developer reports a TestFlight rejection for NSCameraUsageDescription. Whether App Store Connect rejects this binary or only sends an email is UNVERIFIED.
   - If it rejects, there are two ways out: drop the package, or add camera or library purpose strings. Adding them contradicts NS-01-R22 and NX-39-R4. It also puts new lines in front of a family, because iOS Settings shows them. That is a founder decision, and it would land on the store train for unrelated work too.
   - The PR body says "Everything is behind `EXPO_PUBLIC_PHOTOS`" and "A person sees no new permission question". The screens are behind the flag. The native module and the plist config are not.
   - Fix (either):
     - (a) Before merge, upload a build from this head (or from the stack) to App Store Connect and record the processing email: no ITMS-90683 and no ITMS-91053.
     - (b) The founder records, before merge, that the next store upload carries this risk and which way out is taken if it fires.
   - In both cases, the PR body should say plainly that the module and its plist config are in every build whatever the flag.
   - Also add ITMS-90683 to the upload-email check that today names only ITMS-91053 (`docs/ops/RELEASE.md:209`, TF-10; B1-10). That is a doc for its owner, not for this PR.

### Notes

1. Record the required-reason audit. `privacy-manifest.ts:24` says to re-run the audit after any native dependency change, and its evidence list (`:59-73`) does not name expo-image-picker. NX-39 open item (18) asks the same question. Check 3 above has the result: no new category. Put that result in the PR body, or in that comment, in this slice.
2. Hand-off to `legal`. `docs/legal/app-store-privacy-labels.md:127`, the pre-submission checklist line "No photo picker, no new SDK since the last review", is false at the next submission after this merges. `:54` ("No photo feature in v1.0") and `:117` ("Photos, camera ... Not used") need `legal`'s words before a store build with the flag on. The yes and no answers stay true. Requirement docs are not edited here; the PR body should name this hand-off.
3. Pin the exact microphone text. `photos-picker-config.test.ts:105` only proves the plist value is not the picker default. Assert it equals `permissionCopy.microphone` with the brand name, so any change to what a family reads fails a test. No test pins that today.
4. The entitlement assertion is narrower than its comment. `:106-107` says "no new entitlement, no app group" but only checks application-groups. The source shows the plugin writes no entitlement, so this is a test gap, not a defect.
5. Scope and tags of the plist proof:
   - The introspection runs only in the default (development) env. Production and testflight are the same by construction (`app.config.ts:316` has no condition), but are not introspected. `store-sign-in-capabilities.test.ts` shows the per-profile pattern.
   - The EXPO_PUBLIC_PHOTOS save and restore at `:76-83` does nothing. Either set the flag off explicitly, or drop it.
   - The `[NS-01-R2]` tag at `:99` over-claims. R2 is "tap the start, no permission question, no authorization call". This test proves only the plist half.
6. Preflight relaxation is sound. `askedConfigText` (`preflight-lib.mjs:147-149`) drops only a `...Permission` key whose value is `false`. A string or `true` still fails (`app-lock-wiring.test.ts:252-254`). The generated-plist exact-key check (`preflight-testflight.mjs:583-587`) remains the backstop. Suggest a preflight note like the Google one at `:657`: the ExpoImagePicker pod is autolinked and nothing calls it with the flag off, so an App Review question about dormant code has an answer. How App Review treats dormant code is UNVERIFIED.
7. Android, later (D-059). The library manifest merges `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (maxSdkVersion 32) and IMAGE_CAPTURE queries. The plugin blocks CAMERA (`withImagePicker.js:63-66`) and keeps RECORD_AUDIO, because the microphone option is a string. The package README says `false` does not skip on Android; the code blocks CAMERA. Record this for the Android data-safety answers.
8. For slice 4a, not this diff:
   - Call `launchImageLibraryAsync` with `allowsEditing: false`. `true` switches to UIImagePickerController (`ImagePickerModule.swift:94-98`).
   - Set `exif: false`. With `true`, GPS tags are copied into the result (`ImageUtils.swift:320-323`; `MediaHandler.swift:159, 168`).
   - Images only. Never call the permission or camera functions.
   - With those settings, the image path makes no PHAsset fetch, which keeps NS-01-R2 and NS-01-R6.

### Not verified
- Whether App Store Connect rejects, or only emails about, a binary that links ExpoImagePicker without NSCameraUsageDescription or NSPhotoLibraryUsageDescription. The source is a developer's forum report quoting Apple's message.
- The contents of a precompiled ExpoImagePicker.framework, if EXPO_USE_PRECOMPILED_MODULES applies to it (the package has `spm.config.json`). Also unverified: whether such a framework is built from the source I read, and whether it ships its own privacy manifest. From source it needs none.
- Whether the built app links Core Location (NX-39-R4, "the app links no Core Location"). The picker imports Photos, PhotosUI, UIKit, ImageIO, AVFoundation and no CoreLocation. Proof needs `otool -L` on a built binary.
- `npm run preflight`, an EAS build, a device plist read (as the PR says).
- The 11 Nov security review that defines conditions C1 to C4. I did not find its text in the repo or on #796.
- I did not run the tests. CI ran them at this head and they passed.

Sources: https://developer.apple.com/forums/thread/744965 ; https://developer.apple.com/tutorials/data/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype.json ; https://developer.apple.com/tutorials/data/documentation/bundleresources/describing-use-of-required-reason-api.json

Reviewer: independent of the author (CR-44).
