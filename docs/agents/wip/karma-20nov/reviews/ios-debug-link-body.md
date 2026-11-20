## What

One new step in the `compile` job of `ios-compile.yml` (the Debug simulator build), between `pod install` and `Restore DerivedData`. It puts React Native's prebuilt core (`React-Core-prebuilt`) and `ReactNativeDependencies` in their Debug flavour with React Native's own switch scripts, then fails early if the simulator `React.framework/React` lacks `RCTPackagerConnection` (a class compiled only in a debug React Native). 1 file, +38 -2.

## Why

Since 1 Nov, 14 of 38 `compile` jobs failed at `Ld EarlyLetters.debug.dylib` with five undefined symbols (`RCTPackagerConnection`, `RCTReconnectingWebSocket`, `Sealable()`, `~Sealable()`, `ShadowNode::getDebugName()`), and no compile error. #844's linker output made them visible. All five exist only in a debug React Native build (`RCTPackagerConnection.mm:27`, `RCTReconnectingWebSocket.m:16`, `Sealable.h:46-64`, `ShadowNode.h:218`), so the Debug app linked the Release React.

Cause: whenever `pod install` installs or updates any pod, CocoaPods 1.17.0 cleans every pod folder (`installer.rb:639-643`), and the pod's `preserve_paths '**/*.*'` does not match a dotfile (`path_list.rb:146`). That deletes React Native's flavour marker `Pods/React-Core-prebuilt/.last_build_configuration`. With no marker, React Native's switch script assumes Debug and keeps what is there, which is the Release xcframework restored from a Pods cache a Release job saved (launch or kill-harness).

Evidence (full write-up kept with the ops diagnosis):
- 24 jobs passed, none installed a pod; 14 failed, every one installed at least one.
- Control pair: e38941f0 (pass) and 27b963df (fail) restored the same Release-built cache entry (465423686 bytes), both with clean DerivedData; only 27b963df's `pod install` installed pods (AppAuth, GTMAppAuth, GoogleSignIn).
- CocoaPods' own `PodDirCleaner` (1.17.0 and 1.16.2), run here, deletes the marker from both pods.
- The exact `run:` text, run against a mock of the failing state with the real RN 0.86.3 scripts, ends with both pods Debug, and the guard fails on a wrong tarball.

## Risk

Only the Debug `compile` job changes. The `launch` job, `kill-harness.yml`, `testflight.yml`, `release-ios.yml`, the Podfile, app config and `eas.json` are untouched. EAS sets no cache, so its builds start from a fresh Pods folder. Way back: revert this commit.

## Not verified here (needs a macOS run)

1. The fixed job goes green on a pull request whose `pod install` installs a pod, and stays green on one that installs nothing. This PR's own run installs nothing unless its cache misses.
2. The `find` path matches the simulator binary (if it does not, the step only warns) and Apple `nm -gU` lists the class.
3. The "No need to replace React-Core-prebuilt" line in a failing run's full log: the artifact host is blocked from this sandbox.

## Follow-ups (separate PRs)

- `kill-harness.yml` says "Pods do not depend on the app env"; the e2e-env Pods make the testflight-env compile reinstall AppAuth, GTMAppAuth and GoogleSignIn. Fix the comment or key the cache on the env.
- Note in `.github/README.md` that Debug and Release jobs share the `pods-` key.
- Report the marker problem to react-native upstream.

Tier T2 (`.github/**`): two independent reviews at the head before merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
