## Review A at 86b85ac58dbbc8d6d0cbf612761bc3e8c354e94e: PASS WITH NOTES

Lens A: correctness and accuracy. One file, `.github/workflows/ios-compile.yml`, +38 -2 (diff stat at the head).

### Read
- PR body (gh api pulls/853). The ops diagnosis `ios-debug-link-diagnosis.md` (sections 1 to 7).
- The workflow at the head: the new step `ios-compile.yml:153-186`, the jobs around it (`compile` :57-284, `launch` :321-506), the Pods cache `:139-147` and `:379-387`.
- Installed React Native in `node_modules/react-native`, version 0.86.3 (`package.json`; `apps/mobile/package.json:52` pins 0.86.3):
  - `scripts/replace-rncore-version.js:19` (marker `React-Core-prebuilt/.last_build_configuration`, relative to the working directory), `:33-56` (no marker plus Debug keeps what is there), `:64` (tarball `<podsRoot>/ReactNativeCore-artifacts/reactnative-core-<version>-<config>.tar.gz`), `:98-109` (tar status checked, extraction verified), `:111-122` (only directories removed, so `React-VFS.yaml` stays), `:184-199` (`-c`, `-r`, `-p` are configuration, version, Pods root).
  - `third-party-podspecs/replace_dependencies_version.js` (this is where the dependencies switch lives): `:17` marker, `:31-54` same rule, `:61` tarball path, `:65-71` removes `ReactNativeDependencies/framework` first and ignores tar's status, `:80-86` throws when the xcframework is missing, `:116-131` same three flags.
  - `React-Core-prebuilt.podspec:8,20-22,52-77` and `third-party-podspecs/ReactNativeDependencies.podspec:24-41,72-97`: the in-build phase runs the same scripts with `-c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"`, cwd the Pods folder. The step passes the same flags, the same version source (react-native `package.json`) and `-p "$PWD"` from `apps/mobile/ios/Pods`, which is `$PODS_ROOT`.
  - `scripts/cocoapods/rncore.rb:144-145,163,398-412,485-487` and `rndependencies.rb:159-162,234-238,311-312`: pod install downloads both flavours into `Pods/ReactNativeCore-artifacts` and `Pods/ReactNativeDependencies-artifacts` with exactly the names the scripts expect; the pod source is the Debug URL.
  - `scripts/react_native_pods.rb:92-93` and the Expo Podfile template (`node_modules/expo/template.tgz`, Podfile:16-17): both prebuilt switches default to 1; `apps/mobile/app.config.ts:239` does not set `buildReactNativeFromSource`.
  - `sdks/hermes-engine/utils/replace_hermes_version.js:17`: Hermes keeps its marker at the Pods root, outside a pod folder, so it is not hit by the cleaner. Agrees with the diagnosis 2.1.
  - `React/DevSupport/RCTPackagerConnection.mm:27` and `.h:13` (`#if RCT_DEV`): the class exists only in a debug React. No other symbol name contains `RCTPackagerConnection` (the `RCTDevSettings` ivar is `_packagerConnection`, lower case), so the grep cannot match a Release binary by accident.
  - `node_modules/expo-modules-autolinking/scripts/ios/precompiled_modules.rb:96-100,780-789,1306-1316` (finding 2).
- Job log 136080246356 (#844 at 27b963df, fetched with gh api): exact restore of `pods-...-d1a7ae2a` (:329-336), "Installing AppAuth, GTMAppAuth, GoogleSignIn" (:521-523), both flavour tarballs "already exist in Pods" (:414-415, :506-507), the five undefined symbols (:698-721), and five Expo precompiled modules (:558-563).
- Other workflows: `kill-harness.yml:189-198,344-346` share the `pods-` key and build Release; `testflight.yml` and `release-ios.yml` run on Ubuntu and call EAS, with no Pods cache; `apps/mobile/eas.json` has no `cache`.

### Ran
- Extracted the step's `run:` text from the YAML at the head with a YAML parser: it sits in job `compile` only, working directory `apps/mobile/ios/Pods`.
- Ran that exact text with bash on a mock Pods tree (real RN 0.86.3 scripts through a `node_modules/react-native` link; mock tarballs; a compiled object with or without an `RCTPackagerConnection` symbol as the React binary):
  1. Failing state (Release content, no markers): both pods end Debug, markers `Debug`/`Debug`, `React-VFS.yaml` kept, exit 0. The in-build phase afterwards logs "Same config of the previous build" for both.
  2. A "debug" core tarball that holds Release: the guard prints its error, exit 1.
  3. Core Debug tarball missing: `tar` fails, the script throws, exit 1 (marker left at `Release`, folder unchanged).
  4. Dependencies Debug tarball missing: `tar` fails silently, then the script throws at `:83`, exit 1 (its `framework` folder is already emptied; the job fails, so no cache is saved).
  5. ReactNativeDependencies absent: "not installed", continues, exit 0.
  6. No simulator slice: the warning, exit 0.
  7. React-Core-prebuilt absent: exit 1 at `find` (finding 1).
  8. A Release build phase on the step's output with the marker deleted (a Release job restoring a Pods cache this job saved): it extracts Release, as the diagnosis 4 says.
- `set -euo pipefail`: `set -e` applies inside `debug_flavour` (called as a plain command); the `[ ... ] || { ...; exit 1; }` check and the `elif ! nm | grep` guard are exempt from `-e` as intended; grep without `-q` reads all of nm's output, so the SIGPIPE comment is right.
- `git merge-tree --write-tree origin/develop <head>`: clean. develop moved to 20553b18 (#852, docs only); `ios-compile.yml` is unchanged there.

### Findings, most serious first
1. Low. The "not installed" branch is not reachable for React-Core-prebuilt (`ios-compile.yml:170` with `:180`). When the pod is absent, `debug_flavour` prints "nothing to switch" and returns, then `find React-Core-prebuilt/React.xcframework ...` exits 1 on a missing start path, and `set -e` ends the step (mock case 7; GNU find here, BSD find also exits non-zero on a missing path). So the step fails with a bare `find` error instead of warning. The pod is absent when React builds from source: `ios.buildReactNativeFromSource: true`, or `rncore.rb:79-86` falling back to source when the Maven HEAD check fails during pod install. Not today's config, and it fails closed (no false green). Fix if a new commit is made anyway: guard the `find` with `[ -d React-Core-prebuilt/React.xcframework ]`, or append `2>/dev/null || true`.
2. Low, residual of the same cause, not fixed here. Expo's precompiled modules (ExpoModulesCore, ExpoModulesWorklets, ExpoFileSystem, ExpoFont, ExpoPrint, in use per job log :558-563) keep their flavour marker inside the pod folder, `Pods/<pod>/artifacts/.last_build_configuration` (`precompiled_modules.rb:787-789`). `post_install` writes `debug` there whenever it is missing, whatever the contents, and the build phase skips the switch when the marker equals the configuration (`:1310-1312`). After the cleaner runs, the Debug build can keep a Release Expo module. It produced no undefined symbol in the failing job, so it is not this failure, and the compile job only links. Add it to the follow-ups and to the upstream note; the step comment's "both in their Debug flavour" is right for the two RN pods only.
3. Low, comment accuracy. `ios-compile.yml:157-158` says the restored Pods "are saved by the Release jobs". This job's own `actions/cache` (`:139-147`) also saves the same key on a primary miss. With this step such a save is Debug with marker `Debug`, and a Release job then switches correctly (mock case 8), so nothing breaks; the comment is incomplete.
4. Info. If `nm` itself fails (not a Mach-O, a tool error), `pipefail` makes the step say "the Release React", which the guard did not prove. It still fails closed; wording only.
5. Info. With ReactNativeDependencies absent, the last line still says "core and dependencies in their Debug flavour" (`:186`). Cosmetic.

Scope and safety, checked:
- The step is in `compile` only. `launch`, `kill-harness.yml`, `testflight.yml`, `release-ios.yml`, the Podfile, `app.config.ts` and `eas.json` are not in the diff. Release builds are immune: with no marker and Release, the script extracts Release (`replace-rncore-version.js:47-55`). EAS has no cache.
- The step does what the in-build phase already did in every passing run whose marker read `Release` (extract the Debug tarball, write `Debug`), so it adds no new Pods state.
- Quoting: every expansion is quoted. `require('$rn/package.json')` would break only on a path with a single quote; the runner path has none.

Must fix: none.

### Not verified (needs a macOS run)
- The macOS jobs at this head ("iOS simulator build (no signing)", "store-profile Release launch") were still queued when I read check-runs. Karma should merge only on their green.
- That the fixed `compile` job goes green on a PR whose pod install installs a pod, and stays green when it installs none. This PR's own run installs nothing unless its cache misses.
- That `find ... -path '*simulator*/React.framework/React' -type f` matches the real xcframework slice (Maven and repo.reactnative.dev are blocked here, so I could not open the tarball), and that Apple `nm -gU` lists `_OBJC_CLASS_$_RCTPackagerConnection` in the Debug binary and not in the Release one.
- Whether the Expo precompiled modules in finding 2 really end Release in a failing run (needs `Pods/<pod>/artifacts` on a Mac).
- The full xcodebuild log artifact (blob host blocked).

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.
Reviewer: independent of the author (CR-44).
