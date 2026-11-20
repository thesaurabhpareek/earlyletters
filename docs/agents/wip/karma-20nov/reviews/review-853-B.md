## Review B at 86b85ac58dbbc8d6d0cbf612761bc3e8c354e94e: PASS WITH NOTES
<!-- agent:red-team -->

Lens B: CI supply chain, permissions and blast radius. One file, `.github/workflows/ios-compile.yml`, +38 -2 (three-dot diff against `develop` 8343d119; merge base 1513b265).

CI at the head (read 05:57Z): 10 checks completed, success. The two jobs this PR changes or depends on, "iOS simulator build (no signing)" and "store-profile Release launch", were still queued. The new step has not run on a runner yet. This verdict is on the lens only. If the compile job fails at the new step, that is a new fact and this review no longer holds.

Must fix: none.

### What I checked
- The full diff and the whole workflow at the head (`ios-compile.yml:1-506`). The new step is `ios-compile.yml:162-186`, in job `compile` only, between `pod install` (149-151) and `Restore DerivedData` (188-194).
- Downloads. The step runs `node`, `tar` (inside the scripts), `find`, `nm` and `grep`. It fetches nothing.
  - `node_modules/react-native/scripts/replace-rncore-version.js:58-180` (RN 0.86.3) only extracts the local `Pods/ReactNativeCore-artifacts/reactnative-core-<v>-debug.tar.gz` (line 64).
  - `third-party-podspecs/replace_dependencies_version.js:56-113` does the same for `ReactNativeDependencies-artifacts`.
  - `pod install` already put both flavours there (`scripts/cocoapods/rncore.rb:144-145`; `rndependencies.rb:161-162`). It downloads them from repo1.maven.org with a SHA check (`rncore.rb:455-471`), or they come back with the Pods cache.
  - react-native itself is pinned with an integrity hash at `package-lock.json:12377-12380`.
- Code not already run by the job: none.
  - The same two scripts, with the same `-c/-r/-p` arguments, already run as the pods' own build phases on every xcodebuild (`React-Core-prebuilt.podspec:55-73` with `always_out_of_date`; `ReactNativeDependencies.podspec:85`).
  - `npm ci` and `npx expo prebuild` already execute package code from `node_modules`.
- Permissions and secrets. Unchanged: workflow `permissions: contents: read` (43-44), `persist-credentials: false` (67-69). The `compile` job reads no `secrets.` and no `id-token`. The new `run:` block has no `${{ }}` expression, so there is no template injection.
- Fork pull requests. Unchanged.
  - The trigger is `pull_request`, not `pull_request_target`, so a fork gets a read-only token and no secrets.
  - A fork can already change every step of this file in its own pull request.
  - The paths the step uses come from `require.resolve` in the checked-out tree and from `Pods`. Nothing comes from PR title, body or branch text.
- Release, signing and store paths. The diff touches none of them.
  - Untouched: the `launch` job (321-506), `kill-harness.yml`, `testflight.yml`, `release-ios.yml` and `apps/mobile/eas.json`; the three-dot diff stat is the one file.
  - `release-ios.yml` builds on EAS from a fresh `npm ci` with no cache (`release-ios.yml:19,151,163`).
  - `eas.json` sets no `cache`.
- The shared `pods-` cache.
  - At the pinned SHA, `actions/cache@55cc8345` saves with `post-if: "success()"` (its `action.yml`, read at that SHA). So a failed switch never saves a damaged Pods folder.
  - A successful `compile` run saves Debug content with the marker "Debug". The Release jobs that restore it (`launch`, `kill-harness.yml:190-198,338-346`) switch to Release either way: marker "Debug" is not "Release", and no marker plus Release also switches (`replace-rncore-version.js:33-56`).
  - That was already true of any passing `compile` save before this PR.
- Failure mode. Loud on the paths that matter.
  - A marker that does not read Debug gives `::error` and exit 1 (174).
  - A binary without `RCTPackagerConnection` gives `::error` and exit 1 (183-184).
  - A missing tarball makes the core script throw (`replace-rncore-version.js:98-109`). The dependencies script ignores tar's exit status but throws when the xcframework is absent (`replace_dependencies_version.js:80-86`). Either way `set -euo pipefail` (165) fails the step.
- Way back. Revert is true. The step leaves nothing behind that the revert would miss. Caches saved after it have the same shape a passing `compile` save had before.
- Actions pins. The PR adds no `uses:`. All 11 `uses:` lines in the file are 40-character SHA pins, the same lines as on `develop` (compared line by line): checkout 3d3c42e5 (x3), setup-node 82076278 (x2), cache 55cc8345 (x3), cache/restore 55cc8345 (x1), upload-artifact cf430e03 (x2).
- The diagnosis file (ops, 20 Nov) against the code above: its sections 2.1, 2.2 and 4 match the RN 0.86.3 sources I read.

### Findings, most serious first
1. Low (failure message). If the prebuilt core is ever off, the step dies at `find` with a misleading message.
   - Line 170 handles a missing `React-Core-prebuilt` folder ("not installed, nothing to switch"). But line 180 then runs `find React-Core-prebuilt/React.xcframework ...` inside `$(...)` under `set -e`. A missing start path makes `find` exit 1, so the step stops with `find: ... No such file or directory`, not the warning at 182.
   - I ran the same lines in bash against an empty `Pods` folder: exit 1 at `find`.
   - Not reachable today. `react_native_pods.rb:93` defaults `RCT_USE_PREBUILT_RNCORE` to 1, and nothing in `apps/mobile` sets `ios.buildReactNativeFromSource`. If someone turns that on, the Debug compile fails loudly but with the wrong message.
   - Fix: `bin="$(find ... 2>/dev/null || true)"`, or test `[ -d React-Core-prebuilt/React.xcframework ]` first.
2. Low (guard strength). The binary check falls back to a `::warning` if the `*simulator*/React.framework/React` pattern misses (181-182).
   - The marker check (174) still holds, and a wrong flavour still fails at link. So this is not silent, only slower.
   - Once a macOS run shows the path matches, consider making a miss an `::error`, so the fast check cannot quietly stop checking.
3. Info (pre-existing cache trust, not widened). When a tarball is already in `Pods/ReactNativeCore-artifacts`, `rncore.rb:414-417` skips the download and the SHA check. So the Debug tarball this step extracts can come from the restored Pods cache unverified.
   - The in-build phase already extracts the same file. Caches written by a pull request run are scoped to that pull request, and only runs on `develop` write the `develop` scope. No action for this PR.
   - Worth one line in the `.github/README.md` follow-up the PR already lists.
4. Info. Line 167 puts `$rn` inside JavaScript source (`require('$rn/package.json')`).
   - `$rn` is the runner's checkout path from `require.resolve`, so no outside text reaches it, and `npm ci` already runs package install scripts.
   - `node -p 'require(process.argv[1] + "/package.json").version' "$rn"` would remove the quoting question.

### Not verified
- No macOS run. Not seen: the step on a runner image; BSD `find -quit` and the `*simulator*` path on the real xcframework; Apple `nm -gU` output on the Debug and Release binaries; a green run on a pull request whose `pod install` installs a pod. The PR lists the same gaps.
- That every restored Pods cache holds the Debug tarball. If one does not, the step fails loudly (finding 3 notes the code path).
- GitHub's cache scoping rules for pull requests and forks: from the platform's documented behaviour, not re-read this session.
- I did not open the failing runs' logs or artifacts.

Reviewer: independent of the author (CR-44).
