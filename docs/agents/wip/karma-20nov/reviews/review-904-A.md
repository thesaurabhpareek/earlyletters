## Review A at 24c0f28dc3ae8a1acc9da3c8521e3e363b2b7080: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape.

Must fix: none.

### What I checked
- Size and concern (CODE-R01, R02): 336 added, 1 removed, 6 files (one is the check-in log). One concern: the session ends, reminders end. I read 4052cfc4 first, then the new head 24c0f28d (12:44 UTC, "the reminder clear survives a kill right after Sign out").
- What I would have asked at 4052cfc4 is fixed at this head. There, NS-13-R15 was claimed with no test carrying its title. Now `it('[NS-13-R15] deletion removes reminders: ...')` exists and drives the deletion sign-out through the reducer.
- The new test on develop: I copied the head's `apps/mobile/test/reminders-session.test.ts` into a worktree of `origin/develop` (6813ab2f or later; develop moved during the review). All 12 fail there. At the head all 12 pass, with the other reminder test files (79 of 79).
- Full apps/mobile suite at the head: 8 files and 73 tests fail, the sandbox baseline (the same 8 files as on #901). Nothing else fails; the 4 files the body saw time out under load (book-cover, lamp, launch-retry, book-page) passed in my run at 4052cfc4. `tsc --noEmit`: the 5 known errors only.
- Cites in the body: 9 sampled, 8 hold exactly and one is off by a few lines (`session-provider.tsx:300-315` for the sign-out finish; the effect starts at `:307` now). Examples: develop `erase-everything.ts:84` is the only `forgetReminders` call; `prefs.ts` `K` now holds 9 keys including `reminders.session`; `use-account-deletion.ts:118` (`signOut: auth.signOut`); `machine.logic.ts:225-231` (`isSignedIn` covers checkingConsent, needsConsent, ready, signingOut).
- Every path the body lists, traced through `authReducer` and `settleReminderSession` at the head:
  - Local sign-out: signingOut keeps the user id, then SIGNED_OUT goes to signedOut. One end. A second SIGNED_OUT (the finish effect's own) is signedOut to signedOut, no second end.
  - Account deletion: the deletion screen calls the same `auth.signOut`, which dispatches SIGN_OUT_REQUESTED with reason `user`. Same path.
  - Under-18: CONSENT_RECORDED age false goes straight to signedOut. One end.
  - Supabase's own sign-out: SIGNED_OUT and SESSION_LOST from a signed-in state. A cold start reads the Keychain first (RESTORED with the stored id), so a session revoked while the app was closed still goes from an id to none.
  - Another account: SIGNED_IN with a different id; `sessionEnded(A, B)` is true; the mark is cleared and set again for B.
  - A kill after the Keychain is cleared and before the clear: the next launch settles with no user and finds `reminders.session` on, so it ends then. The new test pins it.
  - Never: a phone that never signed in (no mark), a repeated SIGNED_IN for the same id, "Stay signed in", and A restored at launch.
- The effect waits for `authSettled` (not `restoring`), so a launch never reads "Keychain not read yet" as signed out. `endReminderSession` deletes the settings (the mark too) before its first await, so the new mark written after it in `settleReminderSession` stays. Every store call there is guarded, so the effect cannot throw.
- What it keeps: `activeChildId` and `asks.*`, per the NS-14 state table and design OQ-13.6. Plan notices stay, because `forgetReminders` removes only `scribe.reminders` and `el.` ids, and plan notices use their own source and `plan.` ids (`billing/plan-reminders.ts:77, 88`).
- Merge checks (`git merge-tree`): clean against develop, #901 (both edit `prefs.ts`), #903 at 388dbf01 (both edit `session-provider.tsx`, different hunks) and #905.
- All five together: I merged #901, #902, #903 (388dbf01), #904 (24c0f28d) and #905 onto `origin/develop` in a scratch worktree. They merge with no conflict (git auto-merged `session-provider.tsx` and `prefs.ts`); the reminder tests, `month-ago-quiet`, `draft-card` and `consent-retry-one-key` pass (10 files, 167 tests), and `tsc` shows the 5 known errors only. All five also merge cleanly with develop at 627ac311.

### Findings, most serious first
1. Note (the upgrade path is still open). The mark is written only by this build. A parent who signed out on an earlier build still has reminders on and notes pending; after the update the phone launches signed out with no mark, so nothing ends, and the next account inherits them (NS-13-R13). Pre-release this may be acceptable. Either write it down in the body as accepted, or add a one-time launch rule: signed out, no mark, reminders on, and this phone has held an account before (for example `currentUserId()` is set), then end.
2. Note (a narrow kill window remains, by choice). The mark carries no id. If the app is killed after B's session reaches the Keychain and before the effect runs, the next launch restores B with A's mark and ends nothing. The window is milliseconds and B must have signed in straight over A, so I accept it; a one-way hash of the user id in the mark would close it without storing an id.
3. Note (design Rec not carried). `09-capture` 1.3 recommends that the first-run gate's "account gone" branch also call `endReminderSession()`, because a purged account ending with SIGNED_OUT is Unverified. The PR leaves `lib/first-run/**` alone (BL-961) and lists it as a device row. Please open a handoff so the Rec is not lost.
4. Note (test shape). The reducer-path tests still replay the effect's logic inside the test (`run()`), and the provider is pinned by one long regex on the exact effect body. The new kill and keep tests call the real `settleReminderSession`, which is better. Driving the path tests through `settleReminderSession` too would drop the replay.
5. Note (a missing check). Nothing pins that plan notices survive the end of a session. Add a `plan.` note with `PLAN_REMINDER_SOURCE` to the stand-in and expect it to stay.
6. Note. A new local setting, `reminders.session`, needs a `DATA_CLASSIFICATION.md` row; the body hands that to `legal`. Signing out and back in as the same person starts with reminders off; the body raises it for the founder and adds no words.

### Not verified
- That iOS clears delivered notes after `dismissNotificationAsync` on a device, that a purged account's session ends with SIGNED_OUT, and the kill-and-relaunch row (BL-948).
- Findings 1 and 2 are reasoned from the code, not run.

### CI
All required checks passed: install, typecheck, tests and content rules, database rules, edge functions and ops scripts, applied migrations unchanged, B-8 seam check, native files changed, compliance-fence and required. The iOS simulator build was skipped (no native change). "store-profile Release launch" was still queued at 12:57 UTC. One compliance-fence run was cancelled and its rerun passed. The head (12:44 UTC) is older than 10 minutes.

Reviewer: independent of the author (CR-44).
