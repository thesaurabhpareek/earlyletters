## Review B at 01f4388cb374b63f8a84dd64217fa449ef530669: PASS WITH NOTES
<!-- agent:security-architect -->

Must fix: none.

Lens: identity and security. The question is whether a person's words, a child's name or a picture can reach a system surface: Spotlight, Siri, Handoff or App Intents. PR #868 (BL-962) touches two files: `apps/mobile/test/no-system-indexing.test.ts` and `docs/agents/checkins/mobile-bl-962.md`. This is a re-review. My previous review, at `ab4562cd`, was CHANGES with two must-fixes. The new commit `01f4388c` is from 11:31 UTC on 20 Nov, so it was 13 minutes old at 11:44. Added lines are ASCII only.

CI on the head at 11:44: `required` passed. Also green: tests and content rules (which runs this file), typecheck, database rules, Deno, B-8 seam, install, native-files, compliance-fence, agent team and applied migrations. The iOS simulator build was skipped. "store-profile Release launch" is still queued. It was queued on the previous head too, and it does not run this file.

How both must-fixes were resolved:
1. Our code naming the ExpoHead module. `NEVER` now carries `ExpoHead(Module)?` and `createActivity` (:71-74). Three planted samples cover `requireNativeModule`, `globalThis.expo.modules` and `NativeModules[...]` (:290-292). Both rules are kept out of the dependency scan, because the module itself is on the reviewed list (:128). The comment at :200-202 now names both ways in.
   - M1 (`globalThis.expo?.modules?.ExpoHead?.createActivity` in `src/lib`) now fails "apps/mobile/src imports and calls none of them".
   - M1b (`requireNativeModule('ExpoHead').createActivity`) now fails the same test.
2. Packages laid out under `apple/`. A package now counts as native if it has `ios/`, `apple/` or `macos/`, `expo-module.config.json`, or a podspec at its root (:183-184). The planted test adds an `apple/` donor (:388-404).
   - M2 (a donor in `apple/` in a copy of `expo-modules-jsi`) now fails the dependency test.
   - `expo-modules-jsi` raises no new hit on the reviewed list, which matches my hand grep.

Note 1 from the last review was also taken. In dependencies, making an activity now counts as publishing: `NSUserActivity(activityType:`, `initWithActivityType:` and `.userActivity =` (:129-134). There are planted samples for each (:332-335). ExpoHeadModule's entry gains `NSUserActivity made` (:212). M3 (a dependency that makes an activity and assigns `vc.userActivity`) now fails the dependency test. Notes 2, 3, 6 and 7 are taken in the header and comments (:18-23, :78-80).

What I checked at this head:
- I ran the test in a worktree of `01f4388c`, using the shared node_modules plus `expo-clipboard` 57.0.2 and `expo-local-authentication` 57.0.3. Both came from registry tarballs whose sha512 matches `package-lock.json`, so the five profile compiles ran. Result: 13 of 13 pass.
- Mutations M1, M1b, M2, M3 and M4 each fail the expected test. Each was reverted, and `git status` was clean afterwards.
- The earlier checks still hold, and the diff does not touch them:
  - `expo-router/head` is never reached from `apps/mobile/src`, `modules` or `app.config.ts`.
  - The test's closure (697 packages) covers every autolinked iOS package except our own `scribe-*` modules, which the modules test covers.
  - The NS-06-C7 and NS-04 section 14 bans for features not built yet match the locked cards at `450bcb4a`.
  - The D2 evidence in react-native 0.86.3 and @expo/ui 57.0.21 is true. Last time 57 of 58 cites held; the miss was the modifier count.

Notes:
1. Still open from the last review: note 4, for the NS-06 Part C PR. The text-parameter rule (:59) misses `Optional<String>`, `IntentParameter<String>`, `URL` and `Data`. A widget or Control Center extension target has its own Info.plist, which the main-target compile does not read.
2. Still open: note 5. `strip` treats `//` inside a string as a comment, which could hide a call later on the same line. It matters little for honest code.
3. The `.userActivity =` rule will also flag a dependency that clears an activity (`= nil`). That fails closed, so a reviewer just adds the file to the list with a reason.

Not verified:
- The device half: Spotlight and Siri on a phone, and writing tools on iOS 18.
- The full `npm test` run. I ran this file only.
- The queued "store-profile Release launch" check.

Reviewer: independent of the author (CR-44).
