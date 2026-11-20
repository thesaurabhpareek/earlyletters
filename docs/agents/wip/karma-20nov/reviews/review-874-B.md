## Review B at 4a79091d8fcc538ec9f93ca86f40b2c6995136eb: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (identity, security, privacy). NS-08-R6, test only: `apps/mobile/test/ns08-sign-out-keeps-recordings.test.ts` (249 lines) and a check-in file. No app code changed. First read at `06a341bd`; the head moved to `4a79091d` (pushed 12:11 UTC), which adds 17 lines to the same test: pins on `releaseEmptyPhone`, on `ensureEngine`'s ended-session branch and on `stopEngine`. Reviewed after the new head was 10 minutes old. CI at 12:22 UTC: every job on `4a79091d` green (`required`, tests and content rules, typecheck, database rules, Deno, agent team consistent) except the store-profile Release launch job, which was still running.

Must fix: none.

What I checked:
- Tests in a worktree: the file passes 6 of 6 at `4a79091d` (5 pass, plus 1 expected `it.fails`). Mutation at `4a79091d`: a `DELETE FROM drafts` put into `stopEngine` fails the engine case, so the new pins bite. Full mobile suite at `06a341bd` (the delta since is test-only): 9 files / 75 tests fail under the parallel run. 8 files are the sandbox baseline (expo-local-authentication, expo-clipboard). Two extras timed out under load and pass alone: `book-cover.test.ts` (59 of 59) and one `capabilities.test.ts` case (passes in 62 s alone; that file's other failure is baseline). `npx tsc --noEmit`: the 5 known errors only, at both heads.
- The behaviour case runs each step a finished sign-out runs (reducer, `forgetAppleUser`, `clearPendingEmailRequest`, `releaseEmptyOwner`), then the next launch's `runLaunchSweep`, on the expo-file-system stand-in. Every file keeps its sha256, rows are unchanged, the owner is kept, and `capabilities.backup` is asserted off first. Fixtures are the fictional Asha family. The Keychain stand-in holds a placeholder, not a real token.
- The pins match develop. At the new head `releaseEmptyPhone` calls only `releaseEmptyOwner`, `localSqlDb` and `notifyStoreChanged`, and `stopEngine` only stops the engine and drops listeners (`sync/index.ts`, no DELETE in either). The finishing effect `session-provider.tsx:293-308` calls only `sb.auth.signOut({ scope: 'local' })`, `forgetAppleUser`, `clearPendingEmailRequest` and `dispatch`; the engine subscriber `sync/index.ts:253-258` calls only `isSignedIn`, `ensureEngine`, `releaseEmptyPhone`; `releaseEmptyOwner` `ownership.ts:106-118` has no DELETE and nulls only `owner` and `heldCursor`.
- The reachability scan: I confirmed the two `expo-file-system` importers it lists. `lib/remote/expo-adapter.ts:39` deletes only its own config-cache file. `lib/packs/app-support.ts` deletes nothing. No module in `apps/mobile/src` imports a subpath such as `expo-file-system/legacy` (grep).
- Cites, 9 sampled, 9 hold: the three above, `app/settings/account.tsx:192` (Alert with `signOutTitle`, `signOutBody`), `auth.en.ts:297` (body names letters only), `plan.edges.test.ts:184` (`it.fails` precedent), `session-provider.tsx:298` and `:316` (both sign-outs are `scope: 'local'`), `expo-adapter.ts:39`.
- Privacy: nothing is logged or sent. The test reads source text and a stand-in disk only.

Findings (most serious first):
1. Note, scan blind spot: the scan flags only modules that import the bare `expo-file-system` specifier. The app's own native module `modules/scribe-audio` can also touch files (`audio-enhance/index.ts:30`, `backup/runtime.ts:25` import it). Today neither is reachable from `lib/auth/**`; if they were, they would also be flagged through their own `expo-file-system` imports. Add `modules/scribe-audio` and any `expo-file-system/` subpath to the matcher, so a future native delete cannot pass unseen.
2. Note, two more sign-out paths are not pinned: the under-18 effect (`session-provider.tsx:312-324`) and `notMyAccount` (`:384-388`, used by the #871 cover). Today both call the same non-deleting steps. One pin each closes the gap, because the #871 cover makes `notMyAccount` a common path.
3. Note, ruling D1 trade-off, not mine to change: after sign-out, with backup off, the recordings stay readable by anyone who opens the app on this phone, and the app lock is the only control. The `it.fails` case keeps the sheet honest until BL-965's words are approved and wired. I agree with leaving NS-08-R6 half met rather than weakening the case.
4. Note: the behaviour case calls the steps, not the provider. The pins in finding 2 and the existing ones are what tie the two together, so keep them exact (`toEqual` on the call list, as here).

Not verified:
- A real phone (J-N21): the Keychain and the real file system. That is the device row in the PR.

Reviewer: independent of the author (CR-44).
