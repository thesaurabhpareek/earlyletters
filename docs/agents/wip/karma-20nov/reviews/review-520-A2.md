## Review A at 8a8db62712729104c5d8dd8caec4e68dfe76fd62: PASS WITH NOTES

PR #520, delta re-review (lens A, correctness and data safety) since my Review A at 79bc4456. Head read from gh api (8a8db627, parent f4e3a2ef, which merges develop cda0ba83 into 79bc4456). I read the code in a detached worktree at this sha. No must-fix.

### Delta checks
- The delta is two commits. `git diff --stat f4e3a2ef 8a8db627` touches exactly 3 files: `lib/erase-everything.ts` (12 lines), `test/erase-all.test.ts` (53), `docs/qa/DEVICE_TEST_PLAN.md` (9). No other source or test file.
- The merge f4e3a2ef is clean: `git show --remerge-diff f4e3a2ef` lists no file. Its diff against 79bc4456 equals develop's own diff d26335da..cda0ba83 line for line (compared with `index` lines stripped; the same 15 files). The PR's own file set against develop is still the same 32 files, and `git merge-tree --write-tree origin/develop 8a8db627` is clean (tree equals the head tree).
- Against develop, DEVICE_TEST_PLAN has 17 added lines and 0 removed, so develop's steps (including #663's) are intact; S1-133 appears once; no conflict markers in docs, apps or packages.
- Nothing from develop needs Erase everything to cover. I scanned the added lines of `d26335da..cda0ba83` under `apps/mobile/src` for `setSetting`, `setItem`, `Paths.`, `new Directory`, `new File`, SecureStore, `CREATE TABLE`, `scheduleNotification`: no hit. The source changes are wait-line text (`downloadingLine` and its callers), `dates.ts`, `recordings.logic.ts` and the Write retry. The Write change (`write-session.logic.ts`: an unmount now also writes words that did not go through) matters only if the Write screen is mounted when the age question replaces the stack; Write is a route above the tabs and cannot sit under Settings, so I found no path to a write after the erase. (Not run on a device.)
- Added lines of `cda0ba83..8a8db627` have no em or en dash, curly quote, ellipsis or emoji.

### The fix commit
1. `CACHE_COPIES` is now `['exports', 'recovery-export', 'Print']` (`erase-everything.ts:50`), so the whole `Caches/Print` folder goes (expo-print writes `Caches/Print/<uuid>.pdf`; this app calls expo-print only in `export/device.ts`). The loop is inside try/catch as before. Closes my note 3.
2. Two new tests subscribe to the store's `settings` event around `eraseEverything()` and around `resumeEraseAtLaunch()` after a simulated kill. Each expects exactly two events, both after `ageGate.passed` is gone, the first with the pending mark set (`store.ts:1048`) and the second with it removed (`store.ts:1057`). They match the emit lines the PR body cites.
3. The device plan: (c) no longer says Storage shows less used. I read `settings/storage.tsx`: its header says letters and recordings never appear there, and it lists only the speech and language downloads, so the correction is right. (f) now says plan reminders stay on purpose (kinds `trialLong`, `trialWeek`, `trialFinal`, `annualLong`, `annualShort`, `yearly`, ids with the `plan.` prefix); that closes note 4. New (k): install over build 9 with its letters, open, confirm counts and playback, then run (d) to (f); that is the step I asked for.
4. The PR body now documents `reloadAppLock()` (closes note 1), `Caches/Print`, the 18+ stop rule at `store.ts:1038-1046` (I checked those lines), and the emit pin. I diffed it against the body I read before; the edits are additions and corrections, and I found no claim the code contradicts.

### Mutations (second scratch worktree at this sha, each restored after)
- `'Print'` removed from `CACHE_COPIES`: 3 of 40 `erase-all` tests fail (the main erase test, the kill-while-files-go test, the new Print test).
- Both `bus.emit('settings', ...)` lines removed (`store.ts:1048` and `:1057`): 2 fail (the two new emit tests). Only the first removed: the same 2 fail. Only the second removed: the same 2 fail. At 79bc4456, with both emits removed, erase-all, age-gate-erase, reminders-erase, age-gate and age-gate-screen (49 tests) all stayed green, so these two tests are what pin the emit now.

### Ran at this head (apps/mobile unless noted)
- erase-all 40, age-gate-erase 3, reminders-erase 2, billing-alpha 16, app-lock-behaviour 13, age-gate 5, age-gate-screen 2: 81 passed.
- `store.*`, `sweep*`, adts, plus the develop-delta tests (`download-wait-line`, `write-session`, `dates`, `settings-p6b`): 20 files, 365 passed.
- `packages/content` full: 12 files, 281 passed.
- `tsc --noEmit`: the same 5 errors as before, none in a file this PR touches: `help-fallback.tsx:11` (expo-clipboard), `app-lock/controller.ts:10` (expo-local-authentication) and its three cascade errors (107, 109, 117).
- I did not rerun the whole apps/mobile suite. The known environment failures (config, privacy-manifest, licences, capabilities, hosting-ios17, preflight-production, app-lock-wiring) come from the same two missing modules; the delta touches none of their inputs.

### Notes, still open and accepted as follow-ups
- Note 2 (unchanged, body says it needs a `content` ruling): after a visible "did not finish", a person who keeps using the app has the new letters erased by the next launch.
- Note 5 (unchanged): a busy or full-disk error in the launch resume reaches the error boundary; no data is lost.
- Note 6 (unchanged): `erase-all.test.ts` mocks the app-lock controller; the real reload is covered by `app-lock-behaviour.test.ts` (passes).
- Nit: the second new test is titled "the first frame is told", but at a real launch the resume runs inside Root's first render before `useAgeGate` mounts, so no subscriber exists then. The first-frame guarantee is the order test at `erase-all.test.ts` ("the root layout resumes an unfinished erase before ..."), which I mutated last time. The test is still a valid pin of the emit.

### CI at this head
`typecheck`, `tests and content rules`, web (typecheck, test, build), install, edge functions, functions-deploy, migrations unchanged, sizes, native files changed: success. `compliance-fence`: one failure and one cancelled run (`age-gate.ts` needs the CCO approval on this head; not a code finding). Still in progress when I looked: `database rules`, `web e2e`, B-8 (no e2e seam in store bundles), `e2e simulator app`, one `store-profile Release launch`; no `required` result yet. A PASS holds only once required CI is green at this exact head and the fence has its approval. The T2 rules still need two counted reviews and the Privacy Officer's view on this head.

### Not verified
No device or simulator run; the real `expo-local-authentication` path (module absent here); the in-progress CI jobs; Keychain behaviour on a locked device; a signed-in phone; the Android path of expo-print.

Reviewer: independent of the author (CR-44).
