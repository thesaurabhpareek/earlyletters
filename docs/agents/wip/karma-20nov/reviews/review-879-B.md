## Review B at e27d104e1d673fa268a54140909fe85af1c3ca3e: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (identity, security, privacy). PR 3 of the BL-961 stack, reviewed as its own delta against its base #871 at `4879ff5c`: `bookVisibleNow()` and a private `shown()` in `apps/mobile/src/lib/store.ts`, `watchAccountScope()`, the cover starting it, the account-deletion note guard, and tests. I reviewed it first at `9a6956df`, then at `a0bb0c5c` (CHANGES, one must-fix). The head is now `e27d104e` (pushed 12:27 UTC): `c7eba156` adds the note guard, then a merge of #871's branch (develop merged in). Check: `git diff 4879ff5c e27d104e` is byte-identical to `git diff 46608dd4 c7eba156`, so the merge brought nothing else into this delta. Reviewed after the new head was 10 minutes old. CI at 12:48 UTC: `required`, tests and content rules, typecheck, database rules, Deno and the other jobs green; the store-profile Release launch job was still queued (it waits on the shared runner queue, as it did on the earlier heads); one duplicate compliance-fence run cancelled beside a green one.

Must fix: none.

My must-fix is done. A's account-deletion note survives B's session. `use-first-run-gate.ts` now reads the owner and computes `ownersNote = bookVisibleTo({ owner, sessionUser: userId })`. While it is false, the hook never asks the server as B (both `askServer` effects), never rewrites the note through `recordStatus`, and never clears it (`clearDeadNote`). The other write in the hook, `recordBookBack`, needs a listed book, and B lists none. `test/account-note.test.ts` runs the real hook and note-store over mini-react: under B the note is unchanged, `loadStatus`, `recordStatus` and the clear are not called; under A the read still happens. The four source pins in `account-deletion-gate.test.ts` now name `ownersNote`.

What I checked:
- Tests in a worktree of `e27d104e`: account-note, account-deletion-gate, account-deletion-gate-hook, account-store, account-scope, account-gate, account-layer and account-route, 126 of 126 pass. Mutation: dropping `ownersNote` from the clear effect and the no-book ask fails account-note ("B signed in on A's phone ..."), so the guard bites. Full mobile suite at `e27d104e`: 8 files / 73 tests fail, exactly the sandbox baseline (expo-local-authentication, expo-clipboard). `npx tsc --noEmit`: the 5 known errors only.
- Earlier checks still hold (the store delta is unchanged since `9a6956df`). No recording or row is deleted by hiding the lists: every file delete decides from unscoped reads (`capture/sweep.ts:87-97, 170-174`, `capture/erase.ts:44-47`, `audio-enhance/index.ts:109-111`). `bookVisibleNow()` fails closed on a read error (`store.ts:446-454`). There is no import cycle. No log, analytics or crash call is added (grep of the delta). The `shown()` mutation fails 2 of 6 in account-store. The planner-input case passes.
- Cites, 8 sampled earlier, 8 hold: `prefs.ts:116`, `scheduler.ts:247`, `audio-enhance/index.ts:109`, `children.ts:54-56`, `export/device.ts:117`, `transcription-queue/index.ts:391`, `use-first-run-route.ts:132`, `analytics/index.ts:148`.

Every read path, covered or listed (NSC-03 on #858, line 52):
- Covered here: the 15 list functions in the PR body, through them Book, Home, Recently deleted, export, billing gates, asks, analytics counts and the planner's named notes, and now the account-deletion note.
- Listed as open: reminders (`currentPlan()` guard in the BL-967 lane; `[X4-R1]` marked partial), Find (#798), the Photos lens (#840).
- Not listed (finding 2): by-id reads from a route parameter, `listMembers`, `listOrphanAudio`.

Findings (most serious first):
1. Note: generic evening nudges still fire for B until the `currentPlan()` guard lands in the BL-967 lane. NSC-03 stays `not yet` until then. Carry the guard in a handoff, not only in this PR's body.
2. Note, unlisted reads: `settings/children/[id].tsx:36` (`getChild`, `listMembers` from a route id) and `settings/where-letters-live.tsx:36` (`listOrphanAudio` count). They are behind the iOS cover today. List them, so the Android cover is checked against them.
3. Note: writes are guarded only by the cover. `saveFamily` with no active child creates a book (`store.ts:414-419`), and the `otherAccount` gate step makes it unreachable today. Say so in the `shown()` comment.
4. Note: the note guard reads the owner with `getSetting` in render. An unreadable store would throw there, not hide. That matches the hook's other reads, and is noted only because `bookVisibleNow()` fails closed.

Not verified:
- On a phone: B signs in with reminders on and names on the lock screen, and A's deletion notice is still shown after B signs out (device rows).

Reviewer: independent of the author (CR-44).
