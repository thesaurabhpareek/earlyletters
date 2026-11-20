## Review A at 01f4388cb374b63f8a84dd64217fa449ef530669: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. BL-962, `apps/mobile/test/no-system-indexing.test.ts` plus check-in lines. I first reviewed ab4562cd, then re-checked the delta to 01f4388c (Review B's two must-fixes: the ExpoHead and createActivity bans, `apple/`, `macos/` and expo-module roots, and "NSUserActivity made" for dependencies).

Must fix: none.

## What I checked

- Sandbox gap: `expo-local-authentication` and `expo-clipboard` are missing from this checkout's node_modules. I made my own worktree at each head, linked the shared node_modules and added both packages from the lockfile's tarballs (57.0.3 and 57.0.2; sha512 matches `package-lock.json`). Nothing outside my worktree was changed.
- Run at 01f4388c: `npx vitest run test/no-system-indexing.test.ts` gives 13 of 13. At ab4562cd it was 13 of 13 in 9.4 s at load 62, and a scratch merge of develop `1400718b` was also 13 of 13. CI at ab4562cd ran the file: 13 tests, 1.4 s.
- Old code: I ran the PLANTED samples through develop's `findings`. It catches 0 of 31 (one sample gets `CSSearchableIndex` only). The three new ExpoHead samples are not caught there either, because develop has no such rule.
- Each rule has a planted failure:
  - PLANTED expects exact arrays, and a meta-check fails if any NEVER or NOT_BUILT_YET name has no sample. That now covers `ExpoHead native module` and `createActivity`.
  - The dependency-only "NSUserActivity made" rule has explicit samples for Swift, Objective-C and the planted `apple/` donor.
  - Dropping `apple` from the native-root list fails the donor test, because `apple-donor` has no podspec.
  - The MAYBE pre-filter still covers every rule; `ActivityType`, `ExpoHead` and `createActivity` were added.
- Five-profile compile: `compiledIos` makes the same calls with the same options as `config.test.ts:474-495`: `getPrebuildConfigAsync` through `@expo/cli`, then `compileModsAsync` with `introspect: true`, `assertMissingModProviders: false`, `ignoreExistingNativeFiles: true`. It clears every `EXPO_PUBLIC_*` and `EAS_*` variable, a superset of config.test's fixed list. Every variable `app.config.ts` reads has one of those prefixes. It restores the environment in `finally`. Mutation: I put `INIntentsRestrictedWhileLocked` and `NSExtension` in `app.config.ts:243` `infoPlist`, and all five profile tests fail.
- The dependency scan is bounded and deterministic at 01f4388c: 697 packages, 0 missing, 54 native (6 by `apple/`: reanimated, worklets, svg, gesture-handler, expo-modules-jsi, expo-modules-macros-plugin), 3,692 files, about 1.9 s for closure and scan, against a 60 s timeout. The hits equal REVIEWED_DEPENDENCY_CODE exactly (the two expo-router files, `ExpoHeadModule.swift` now with `NSUserActivity made`). The `files > 500` floor and the fail-closed `missing` check stop a partial tree from passing. No native package has a symlink or a second installed version.
- No false positive on our own code: the src, modules and package.json tests pass at both heads.
- PR body cites, about 25 checked, and all hold except two nits (note 6). Checked: `ExpoHeadModule.swift:4, 15, 17, 19, 21, 91, 99, 107, 128, 138-141`; `withRouter.js:11-20, 35`; `withSQLite.js:31-36`; `ExpoSQLite.podspec:61, 85`; `ExpoHead.ios.js:216, 255`. D2: `grep -rl -a -i writingtools` finds 0 files in `react-native` 0.86.3 and 0 in `@expo/ui` 57.0.21. `TextInput.d.ts:141, 211, 352`. On develop: `text-field.tsx:65`, `review.tsx:1028`, `write.tsx:414`, `letter/[id].tsx:617`, `onboarding.tsx:511`.
- Size at 01f4388c: +313 / -13 in 2 files, under the CODE-R02 limit.

## Findings (notes, most serious first)

1. The comment stripper hides code in podspecs; this is still true at 01f4388c. `strip` removes `/* ... */`, but `.podspec` files are Ruby, and a glob like `"**/*.{h,m}"` opens a "comment" that runs to the next `*/`. At the new head, `findings` of `s.source_files = "**/*.{h,m,swift}"`, then `s.frameworks = 'Intents'`, then `s.exclude_files = "Tests/**/*.swift"` returns `[]`. In the shipped tree, 19 podspecs lose a multi-line span this way, for example `React-Core.podspec` (40 lines, including `s.weak_framework`), `ExpoSQLite.podspec` (7) and `ExpoRouter.podspec` (4). Our own five podspecs have one glob each, so the modules scan is sound today. The impact is low, because a donation also needs Swift or Objective-C code, which is scanned. Fix: for `.podspec`, strip `#` comments only.
2. Two plist keys have no planted case. `NEVER_PLIST` lists `INIntentsRestrictedWhileLocked` and `NSExtension`, but the planted plist has neither. Deleting both from the list leaves every test green; the real config path does catch them (mutation above). Add both to the planted plist, plus a meta-check over `NEVER_PLIST` and `NOT_BUILT_YET_PLIST`. Likewise, the `macos` and `expo-module.config.json` roots have no planted donor.
3. The `NSExtension` check reads the app's own Info.plist only. An extension target that a config plugin adds (an App Intents extension, a share extension, a widget) has its own plist, and `compileModsAsync` does not return it. The package-name regex covers names with `app-intents`, but a generic targets plugin would pass. This needs a rule before NS-06 Part C builds a doorway.
4. Hit keys can collide. `dependencyHits` keys a hit by package name and relative path. If two versions of one native package were installed, the later one would overwrite the earlier one's hits. There are none today. Keying by `relative(APP, f)` would remove the risk.
5. Prebuilt binaries are outside the scan, and the header now says so. My own `grep -a` of `rnwhisper.xcframework` and `libsql.xcframework` for `INInteraction|CSSearchable|IntentDonationManager|NSUserActivity|INVocabulary|CoreSpotlight` agrees with Review B: 0 hits. Pods fetched at `pod install` are also outside the scan.
6. Body nits: the body says 53 native packages; I count 51 by the old rule and 54 by the new one. `build/qualified-entry.js:16` is the `require`; the `Head.Provider` use is `:20`.
7. The `App Intents text parameter` regex can run from a non-text `@Parameter` to a later plain `var x: String` with no braces in between. That is a false positive, and it fails closed, so it is a note for the NS-06 Part C author.

## Not verified

- I did not repeat the author's `node_modules/expo-haptics` donor plant, to keep the shared tree clean. The planted donor test runs the same `dependencyHits` path in a temp dir, and it passes.
- Device behaviour (Spotlight, Siri suggestions, writing tools on iOS 18).

CI at 01f4388c (11:42 UTC): every check is complete and green, including "tests and content rules", "typecheck" and "required". "store-profile Release launch (testflight env, no seam, 20 s)" is still queued, as it was on ab4562cd. "iOS simulator build" was skipped. The head was committed at 11:31 UTC, and this file was finalised after 11:41.

Reviewer: independent of the author (CR-44).
