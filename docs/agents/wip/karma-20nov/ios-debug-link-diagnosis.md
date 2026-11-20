# iOS simulator build (no signing): Debug link failure, root cause and fix

Author: ops (Release and Operations Engineer), 20 Nov 2026.
Scope: `.github/workflows/ios-compile.yml`, job `compile` (Debug, simulator, CODE_SIGNING_ALLOWED=NO).
Fix branch: `fix/ios-debug-link-prebuilt-flavour`, head `86b85ac58dbbc8d6d0cbf612761bc3e8c354e94e` (from origin/develop
`1513b265`, which already has #844). No PR opened. `.github/**` needs two reviews.

## 1. Cause, in two lines

`pod install` deletes React Native's flavour marker `Pods/React-Core-prebuilt/.last_build_configuration` whenever it
installs or updates any pod. CocoaPods then cleans every pod folder, and the pod's `preserve_paths '**/*.*'` does not
match a dotfile. With no marker, RN's switch script assumes the folder already holds Debug, so the Release
React.xcframework (restored from a Pods cache that a Release job saved) stays in place and links into the Debug app.

Karma's hypothesis is half right. The Debug app does link the Release-flavour prebuilt React. But "a pods cache that
restores a Release-flavour Pods folder" is necessary, not sufficient: the passing runs also restored Pods folders
saved by Release jobs. The deciding factor is whether `pod install` installed any pod.

## 2. Evidence

### 2.1 The linked React is the Release flavour (job log plus node_modules)

Job 136080246356 (#844, 27b963df), xcodebuild step, "Linker and tool errors":

    78909:Undefined symbols for architecture arm64:
    78910-  "_OBJC_CLASS_$_RCTPackagerConnection", referenced from: ... in libexpo-dev-launcher.a[10](RCTPackagerConnection+EXDevLauncherPackagerConnectionInterceptor.o)
    78912-  "_OBJC_CLASS_$_RCTReconnectingWebSocket", referenced from: ...
    78914-  "facebook::react::Sealable::Sealable()", referenced from: ... libRNDateTimePicker.a, libRNGestureHandler.a, libRNGoogleSignin.a, libRNReanimated.a, libRNSVG.a
    78923-  "facebook::react::Sealable::~Sealable()", referenced from: ...
    78932-  "facebook::react::ShadowNode::getDebugName() const", referenced from: ...
    79095: ... EarlyLetters: clang: error: linker command failed with exit code 1

These five are the only distinct undefined symbols. Every one is compiled only in a debug build of React Native
(node_modules/react-native, 0.86.3):

- `React/DevSupport/RCTPackagerConnection.mm:27` and `Libraries/WebSocket/RCTReconnectingWebSocket.m:16`: `#if RCT_DEV`.
  `React/Base/RCTDefines.h:41-46`: RCT_DEV is 1 only if `DEBUG` is defined.
- `ReactCommon/react/renderer/core/Sealable.h:46-64`: `#ifndef REACT_NATIVE_DEBUG` gives the inline Release class.
  The out-of-line `Sealable(); ~Sealable()` exist only in the debug version.
- `ReactCommon/react/debug/flags.h:16-22`: REACT_NATIVE_DEBUG is defined unless `NDEBUG` is defined.
- `ReactCommon/react/renderer/core/ShadowNode.h:218-219`: `getDebugName()` exists only under
  `RN_DEBUG_STRING_CONVERTIBLE`, which `renderer/debug/flags.h:34-37` ties to REACT_NATIVE_DEBUG.

So the third-party pods, compiled in Debug, need the Debug React.xcframework, and the binary they were linked against
lacks every debug-only symbol. That binary is the Release flavour. It is not "React missing": that would leave
thousands of undefined symbols, not five.

Where the flavour comes from (node_modules):

- `react-native/scripts/react_native_pods.rb:93`: RCT_USE_PREBUILT_RNCORE defaults to 1, so React comes prebuilt.
  The pod install log confirms it: "[ReactNativeCore] Building from source: false" and "Using React Native Core and
  React Native Dependencies prebuilt versions."
- `react-native/scripts/cocoapods/rncore.rb:144-145,163`: both tarballs go to `Pods/ReactNativeCore-artifacts/`. The
  pod source is the **debug** URL, so a fresh install holds Debug.
- `react-native/React-Core-prebuilt.podspec:22`: `s.preserve_paths = '**/*.*'`.
- `react-native/React-Core-prebuilt.podspec:55-73`: build phase "[RNCore] Replace React Native Core for the right
  configuration, if needed". It picks Debug if GCC_PREPROCESSOR_DEFINITIONS contains `DEBUG=1`, else Release, runs
  `scripts/replace-rncore-version.js`, and sets `always_out_of_date`.
- `react-native/scripts/replace-rncore-version.js:19`: the marker is
  `'React-Core-prebuilt/.last_build_configuration'`, inside the pod folder.
- `react-native/scripts/replace-rncore-version.js:47-53`:

      // Assumption: if there is no stored last build, we assume that it was build for debug.
      if (!fileExists && configuration === 'Debug') {
        console.log('No previous build detected, but Debug Configuration. No need to replace React-Core-prebuilt');
        return false;

- `react-native/third-party-podspecs/ReactNativeDependencies.podspec:40` and `replace_dependencies_version.js:17,45-48`:
  the same pattern for ReactNativeDependencies (marker `ReactNativeDependencies/.last_build_configuration`).
- Hermes keeps its marker at the Pods root (`sdks/hermes-engine/utils/replace_hermes_version.js:17`), outside any pod
  folder, so it is not affected.

### 2.2 pod install deletes the marker when it installs any pod (CocoaPods source, and a run of its cleaner)

The runner has CocoaPods 1.17.0 (actions/runner-images, macos-26-arm64 image 20261102.0473: "- CocoaPods 1.17.0").
Source at tag 1.17.0:

- `lib/cocoapods/installer.rb:256-262`: `download_dependencies` runs `install_pod_sources` and then `clean_pod_sources`.
- `lib/cocoapods/installer.rb:639-643`:

      def clean_pod_sources
        return unless installation_options.clean?
        return if installed_specs.empty?
        pod_installers.each(&:clean!)

  Once any pod is installed, every pod folder is cleaned, unchanged ones included.
- `lib/cocoapods/sandbox/pod_dir_cleaner.rb:52-57`: it lists every file, hidden ones too (`FNM_DOTMATCH`), and deletes
  what the spec does not use.
- `lib/cocoapods/sandbox/path_list.rb:146`: spec globs are matched with `File.fnmatch(p, path, FNM_CASEFOLD |
  FNM_PATHNAME)`, without FNM_DOTMATCH, so `'**/*.*'` never matches `.last_build_configuration`.

Run here: CocoaPods 1.17.0 and 1.16.2 gems, `Pod::Sandbox::PodDirCleaner` on a mock pod folder whose spec copies the
file attributes of `React-Core-prebuilt.podspec` (script: scratchpad `check/cleaner_check.rb`):

    CocoaPods 1.17.0
    React-Core-prebuilt      .last_build_configuration                                          DELETED
    React-Core-prebuilt      React-VFS.yaml                                                     kept
    React-Core-prebuilt      React.xcframework/ios-arm64_x86_64-simulator/React.framework/React kept
    ReactNativeDependencies  .last_build_configuration                                          DELETED

And React Native's own script, in that state (Release content, no marker, `-c Debug`):

    No previous build detected, but Debug Configuration. No need to replace React-Core-prebuilt
    after the build phase alone: core=RELEASE

### 2.3 The Pods this job restores are saved by Release jobs

`compile` (Debug), `launch` (Release) and both kill-harness.yml iOS jobs (Release, nightly on develop and on pull
requests) all use one key, `pods-macOS-xcode26.6-<hash>`. The Debug configuration is not in it. kill-harness.yml even
says "The same key as ios-compile.yml: Pods do not depend on the app env". The Release jobs usually finish first and
win the save. Every entry the failing runs restored was saved by a Release job (job logs, "Cache saved with key" and
the byte size):

| restored entry (bytes) | saved by | restored by failing runs |
|---|---|---|
| d1a7ae2a, 465423686 | kill-harness e2e (Release) on develop, job 129995410003, 10 Nov 17:40:47 | 39efe1ac, 8a026397, 555dc010, 45c35116, f55be7b8, 96c226ac, 27b963df |
| 03238a3a, 465461649 | ios-compile `launch` (Release), workflow_dispatch on develop, job 124783877745, 1 Nov 09:48 | 74771226, 34984d42 |
| 824f441d, 465343912 | kill-harness e2e (Release) on develop, job 128788354178, 8 Nov schedule | f0f9a74d, cad29cf8, c621909b, 2e88126a, 61988d26 |

The develop scope is fed only by kill-harness's nightly Release jobs, plus ios-compile on workflow_dispatch. A pull
request's first compile therefore starts from a Release-switched Pods folder.

### 2.4 Pass or fail is decided by "did pod install install a pod", across 38 compile jobs since 1 Nov

All 38 `compile` jobs that ran (not skipped or cancelled) from 1 Nov to 20 Nov, from their logs:

- 24 passes. Every one installed **no** pod.
- 14 failures. Every one installed **at least one** pod. All 14 failed only at
  `Ld .../EarlyLetters.debug.dylib (in target 'EarlyLetters')`, with zero compile errors.

    date        head      result  pods restore (key, bytes)   DerivedData  pods installed by pod install
    11-01 07:26 9d8f714e  success exact  03238a3a 465461649   clean        none
    11-08 08:26 f4bde44d  success prefix 03238a3a 465461649   restored     none
    11-08 09:01 74771226  failure prefix 03238a3a 465461649   clean        ExpoClipboard
    11-08 11:40 34984d42  failure prefix 03238a3a 465461649   clean        ExpoClipboard
    11-08 17:16 968328a2  success exact  824f441d 465343912   clean        none
    11-08 22:39 f0f9a74d  failure prefix 824f441d 465343912   clean        ExpoLocalAuthentication
    11-09 19:57 61988d26  failure prefix 824f441d 465343912   clean        ExpoLocalAuthentication   (develop dispatch)
    11-10 09:28 5433323c  success prefix f40e976a 465343129   clean        none                      (develop, 10 Nov)
    11-11 02:14 39efe1ac  failure prefix d1a7ae2a 465423686   clean        ExpoImagePicker,ScribePhoto
    11-11 06:29 e38941f0  success exact  d1a7ae2a 465423686   clean        none
    11-20 00:02 555dc010  failure prefix d1a7ae2a 465423686   clean        AppAuth,ExpoImagePicker,GTMAppAuth,GoogleSignIn,ScribePhoto
    11-20 00:54 1356cb8a  success exact  1f3cefa3 465459794   clean        none
    11-20 02:06 567de5fb  success exact  1f3cefa3 465459794   restored     none
    11-20 02:46 44dd950e  success exact  1f3cefa3 465459794   restored     none
    11-20 03:44 f55be7b8  failure prefix d1a7ae2a 465423686   clean        AppAuth,GTMAppAuth,GoogleSignIn,ScribePhoto
    11-20 04:02 96c226ac  failure prefix d1a7ae2a 465423686   clean        AppAuth,GTMAppAuth,GoogleSignIn,ScribePhoto
    11-20 04:19 27b963df  failure exact  d1a7ae2a 465423686   clean        AppAuth,GTMAppAuth,GoogleSignIn
    (excerpt; all 38 rows: scratchpad logs/table.txt)

The control pair is e38941f0 (11 Nov, pass) against 27b963df (20 Nov, fail). They restored the **same** entry
(465423686 bytes, the Release-built kill-harness save), both on a clean DerivedData. The only difference is that
27b963df's pod install changed three pods ("Installing AppAuth 2.1.0", "Installing GTMAppAuth 5.0.0", "Installing
GoogleSignIn 9.2.0"). The cache, DerivedData and runner image are ruled out: failures and passes both occur on
image 20261102.0473.1.

### 2.5 Why 1356cb8a passed on a clean build and 27b963df did not

- 1356cb8a (#834): its compile job (136000943050) restored the exact key `pods-...1f3cefa3` (465459794 bytes). That
  entry was saved at 01:27:51 (two minutes before this restore at 01:29:50) by #834's own kill-harness e2e job
  (136000788010, Release). pod install
  installed nothing, so the cleaner did not run and the marker kept "Release". The RNCore phase saw "Release" !=
  "Debug" and extracted the Debug tarball. The app linked Debug React.
- 27b963df (#844): it restored the exact key `pods-...d1a7ae2a` (465423686 bytes, kill-harness e2e on develop, 10 Nov,
  Release). pod install changed AppAuth, GTMAppAuth and GoogleSignIn. Those pods are "changed" because the e2e-env
  Pods differ from the testflight-env Podfile, and the key covers neither the env nor `eas.json`. The cleaner ran on
  every pod folder and deleted the marker. The RNCore phase saw no marker under Debug, logged "No need to replace", and
  the Release React linked.
- Clean DerivedData plays no part: both had it ("Cache not found for input keys: dd-...").

## 3. Fix (committed, branch `fix/ios-debug-link-prebuilt-flavour`, 86b85ac5)

One step in the `compile` job, after `pod install` and before `Restore DerivedData`, with working-directory
`apps/mobile/ios/Pods`:

1. For React-Core-prebuilt and ReactNativeDependencies, write a non-Debug marker, then run React Native's own switch
   script with `-c Debug`. That is `scripts/replace-rncore-version.js` and
   `third-party-podspecs/replace_dependencies_version.js`, resolved from `apps/mobile` like the Podfile does. The
   script extracts the Debug tarball that pod install already downloaded and writes the marker "Debug". The step
   checks the marker reads Debug.
2. Check the simulator `React.framework/React` in `Pods/React-Core-prebuilt` exports `RCTPackagerConnection` (Apple
   `nm -gU`, a dev-only class). If not, fail in seconds with "the Release React, which this Debug build cannot link"
   instead of after 15 minutes at Ld.

The in-build RNCore phase then finds "Debug" and does nothing. The step does not depend on the order of the
"[CP] Copy XCFrameworks" and "[CP-User] [RNCore]" phases in the React-Core-prebuilt target. It costs two tarball
extractions, a few seconds.

Tested here, on a mock Pods tree in the failing state (Release content, no markers) with the real RN 0.86.3 scripts
and the exact `run:` text taken from the committed YAML. Result: core and dependencies Debug, markers Debug/Debug,
React-VFS.yaml kept, build phase afterwards "Same config of the previous build". A mock Debug tarball that held
Release made it fail with the error. YAML parsed; the step is in `compile` only, not `launch`.

Alternatives considered:

- A pods cache key that includes the configuration (`pods-debug-...` for `compile`). It also fixes this, because a
  Debug-saved folder with no marker really is Debug. But it costs a cold pod install per scope and another ~450 to
  540 MB entry against the 10 GB cache (DerivedData entries are ~1 GB each). The marker bug would also stay latent for
  any later sharing. It is a reasonable follow-up, not needed now.
- Building React from source in this job (`RCT_USE_PREBUILT_RNCORE=0`). That adds a large compile time. It turns off
  Expo's precompiled modules (`expo-modules-autolinking/scripts/ios/precompiled_modules.rb:120-129` requires prebuilt
  React), and it stops this job building what EAS builds. Rejected.

## 4. Risk to Release, the store build and EAS

- The change touches only the `compile` (Debug) job of ios-compile.yml. Untouched: `launch`, kill-harness.yml,
  testflight.yml, release-ios.yml, the Podfile, app.config.ts, eas.json, package.json and node_modules.
- Release builds are immune to the marker bug. The script's only blind spot is "no marker + Debug". With no marker
  and Release it extracts Release (`replace-rncore-version.js:47-55`), and the "store-profile Release launch" job
  passed on every head above. If `compile` saves the shared `pods-` key (it can on a primary miss, as on 10 Nov, job
  129744408070, 538386717 bytes), the folder is Debug plus marker "Debug". A Release job restoring it swaps to Release
  whether its own pod install keeps the marker ("Debug" != "Release") or deletes it (no marker + Release). This is
  already true of any passing compile job's save today.
- EAS: eas.json sets no `cache` for any profile, and nothing here reaches EAS. An EAS build starts from a fresh
  prebuild and Pods folder: Debug content (`rncore.rb:163`) and no marker. A Release (store) build swaps to Release; a
  Debug (development) build keeps Debug. Both are right, so the bug cannot reach the store or TestFlight builds.

## 5. What only a macOS run can confirm

1. The full failing log has "No previous build detected, but Debug Configuration. No need to replace
   React-Core-prebuilt" in the RNCore phase. The artifact `xcodebuild-log` (id 14602970598, run 44673629015) could not
   be fetched from here (blob storage host blocked by the session proxy).
2. The first run of the fixed workflow on a pull request whose pod install installs a pod (e.g. #835 or #842 rebased)
   must print "React Native 0.86.3: prebuilt core and dependencies in their Debug flavour" and go green. A run that
   installs nothing must also stay green.
3. That `find React-Core-prebuilt/React.xcframework -path '*simulator*/React.framework/React'` finds the binary (else
   a warning, not a failure) and that Apple `nm -gU` lists `_OBJC_CLASS_$_RCTPackagerConnection` in the Debug one.
4. Phase order (optional). CocoaPods 1.17.0 appends "[CP] Copy XCFrameworks" before the user phase
   (`pod_target_integrator.rb:41-42`), and `reorder_script_phase` returns early in an aggregate target with no
   Sources phase (`target_integrator.rb:351`). Yet the 24 passes show the in-build switch did reach the link. The fix
   no longer relies on either, but `Pods/Pods.xcodeproj` on a Mac would show the actual order.

## 6. Not verified from here (stated, not guessed)

- The full xcodebuild logs (artifacts) and the Actions cache list API (`/actions/caches`) are both blocked by this
  session's proxy. Cache provenance comes from the "Cache saved with key" lines and byte sizes in the job logs.
- Maven artifacts are blocked, so I did not measure the Debug and Release React binaries. The embedded React.framework
  in every failing run is 24453834 bytes (rsync "total size"), but I do not claim which flavour that size is.
- The `ld: warning: Could not find or use auto-linked framework 'UIUtilities'` line is a warning, not the failure. It
  is only visible in 27b963df because older runs' warning list was capped at 400 lines.

## 7. Follow-ups (separate concerns)

- kill-harness.yml line "Pods do not depend on the app env, and pod install corrects a near miss" is not accurate:
  the e2e-env Pods make every testflight-env compile reinstall AppAuth, GTMAppAuth and GoogleSignIn. Worth a comment
  fix, or a key that includes the env or `apps/mobile/eas.json`.
- Upstream: React Native's "no marker means Debug" assumption plus CocoaPods' dotfile cleaning is a real bug for
  anyone caching Pods across configurations. A short report to react-native (marker outside the pod folder, as Hermes
  does) would help.
- `.github/README.md` could note that the `pods-` key is shared by Debug and Release jobs.
