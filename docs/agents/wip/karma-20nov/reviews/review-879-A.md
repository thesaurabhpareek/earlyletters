## Review A at e27d104e1d673fa268a54140909fe85af1c3ca3e: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. PR 3 of the BL-961 stack. Base `fix/mobile-bl-961-account-cover` is now at 4879ff5c (#871 with develop merged in). Since my confirm at a0bb0c5c the head adds two commits:
- c7eba156: Review B's must-fix. The first-run gate no longer clears, asks about or rewrites the owner's account-deletion note while another account is signed in. It adds `test/account-note.test.ts`.
- e27d104e: the merge of #871's branch, which carries develop.

Own delta against its base: 341 added lines in 9 files, of which about 90 are app code. Inside CODE-R02.

Must fix: none.

### The new change, checked
- `lib/account-deletion/use-first-run-gate.ts`:
  - reads the owner (`sync.ownerId`) through the same `subscribe` as the note;
  - computes `ownersNote = bookVisibleTo({ owner, sessionUser: userId })`, the one reader, not a second rule;
  - guards the three writers: the no-book server ask, the with-book refresh, and `clearDeadNote`.
- I traced every writer of the note in `apps/mobile/src`:
  - `recordStatus` at `use-first-run-gate.ts:83` (now guarded) and at `use-account-deletion.ts:53`;
  - `recordCancelled` at `use-account-deletion.ts:101`;
  - `recordBookBack` at `use-first-run-gate.ts:144`, which needs a listed book, and B lists none;
  - `clearDeadNote` at `:151` (now guarded).

  `use-account-deletion` runs only on Settings > Delete account and on `OpenDeletionScreen`. For B the gate never picks that screen, because `chooseScreen` drops another account's note (`open-request.ts:227, 233`) and B lists no book. So B reaches no unguarded writer, except through Settings under the cover.
- Red on the old code: I copied `account-note.test.ts` onto the base 4879ff5c. "B signed in on A's phone: the note is not cleared ..." fails (`loadStatus` was called once). It passes at this head, as does the "A signed in" control.
- `account-deletion-gate.test.ts`: the two source pins are updated to the guarded lines. The behaviour is in the new test.
- I missed this path in my first pass (I listed account-deletion among callers that "delete nothing on an empty answer"). Review B was right, and the fix closes it.

### What I checked at this head
- Head e27d104e, committed 12:27 UTC on 20 Nov, more than 10 minutes old at review.
- Full mobile suite in a worktree of the head with its own packages: exactly the 8 known sandbox baseline files (73 tests), nothing else. `tsc --noEmit`: only the 5 known errors.
- The planner-input test from a0bb0c5c is still red against develop's store (`expected [ { ... } ] to deeply equal []`) and green here. `[X4-R1]` stays marked partial, under the ruling (option b).

### Findings (notes, most serious first)
1. Settings > Delete account under B can still erase the owner's note. `use-account-deletion.ts:53` calls `recordStatus(s.value, userId)` as B. In `noteAfterRead` (`open-request.ts:144-157`), A's note is not "mine" for B, so with B's status `none` it returns null, and A's note is written away. The refresh runs on mount and whenever `userId` changes (`:45-58`, `:60-62`), so no tap is needed: a deep link to `/settings/delete-account`, or the screen still mounted when B's session starts, is enough. The cover does not stop either. The note is a cache of the server: A's next sign-in with no book asks again and rewrites it. So this is a note, not a must-fix. It is the same class as Review B's finding, so guard `refresh` with `bookVisibleNow()` (or the same `ownersNote`) in this PR or the next.
2. The planner guard (`currentPlan()`, BL-967 lane) is still tracked only in prose. Put it on the BL-967 row or in a `handoff` issue. Until then, NSC-03 is open for reminders.
3. By-id display reads (`app/letter/[id].tsx` and others) stay open behind the cover. This is for the security-architect lens.
4. The watcher starts in a UI component. `shown()` asks on every call, so this is a timing gap, not a leak.
5. One `settings` read per wrapped list call while signed in: measure against cold-start p50.
6. Analytics counts read 0 under B: name it in the tracking plan.

### Not verified
- The device row (B with reminders and lock-screen names on).
- Find (#798) and the Photos lens (#840).

CI at the head (13:00 UTC): every check completed with success, including `required`, `tests and content rules`, `typecheck`, `database rules` and `compliance-fence`, except `store-profile Release launch`, which was still queued on the macOS runner after more than 30 minutes. It is outside `required`; I finalised without it. The iOS simulator build was skipped. One `compliance-fence` run was cancelled; its sibling run succeeded.
Reviewer: independent of the author (CR-44).
