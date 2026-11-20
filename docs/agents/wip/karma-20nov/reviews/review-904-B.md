## Review B at 24c0f28dc3ae8a1acc9da3c8521e3e363b2b7080: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. PR #904, BL-967: signing out ends reminders on every path (NS-13-R14, with R13 and R15). This is a re-review after my PASS WITH NOTES at `4052cfc4`.

Must fix: none.

## What I checked

- The fix commit `24c0f28d`, compared against `4052cfc4`: `session-provider.tsx`, `reminders/session.ts`, `prefs.ts`, `index.ts` and the test (+45). Also the updated PR body.
- My strong note 1 (a kill after Sign out handed A's reminders to B) is closed.
  - While a session is signed in, the phone keeps a mark, `reminders.session` = `on`: a flag with no id (`prefs.ts:16, 52, 59`; `session.ts:39`).
  - `settleReminderSession` ends reminders when the user id ends here, or when a settled launch finds no session but the mark is still set (`session.ts:27-34`). The mark is one of `REMINDER_SETTING_KEYS`, so the clear removes it. A new session then marks itself again, after the synchronous clear.
  - The hook waits until the Keychain has answered (`session-provider.tsx:200, 203`), so a launch never reads "not read yet" as "signed out".
  - The test `reminders-session.test.ts:210` runs the kill sequence on the real store and scheduler. A is marked, A's notes are planned, then a launch with no user clears everything, and B starts with reminders off and names off. The test at `:228` pins the other side: a phone that never signed in, or A restored at launch, keeps its reminders.
- My note 2 (the reset combined with the kept ask count) is now in "Founder, look first at". A parent who has seen both primes stays at reminders off, and only Settings brings them back. A second account inherits the count. The reset is stated plainly for the founder and product, not hidden.
- My note 3 is closed. `[NS-13-R15] deletion removes reminders` now has its own test at `:123`.
- My note 5 is closed. The body now classes these settings as L2 and cites `DATA_CLASSIFICATION.md:698-699`.
- Privacy: the mark holds no id and no person data. The added lines have no log, analytics, crash or network call. `settleReminderSession` is local only and never throws.
- Cites: 20 sampled, 20 hold.
  - `session-provider.tsx:24, 199, 200, 203, 206, 207`.
  - `session.ts:18, 27, 30, 34, 39, 51`.
  - `prefs.ts:16, 52, 59`.
  - Test titles at `:123, 210, 228, 239`.
  - `secure-storage.ts:24` (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`).

## Findings, most serious first

1. Note, a merge condition for Karma. PRIV-R01 requires a new device key to ship with its classification. `reminders.session` is described in `prefs.ts:16` and in the body (L2, purpose, cleared at session end), but its row in `docs/legal/DATA_CLASSIFICATION.md` is only a handoff to `legal`, listed under "Handoffs (to be filed)". Please file that `to:legal` handoff before merge. The mobile agent may not edit `docs/legal/`.
2. Note, a merge condition for Karma. The `bookVisibleNow()` guard in `currentPlan()` (after #879) is still only in the body. Until #879 merges, B starts with reminders off, but if B turns them on with names on, the plan can name A's child: `listVisible` has no account filter (`repos/children.ts:26-27`). That is NS-32-R12, CR-67 AX-12. Please file the `handoff` issue so it outlives this PR.
3. Note. The new path fails toward clearing. If the Keychain read fails at launch (`storedUserId` returns null on any error, `session-provider.tsx:138-148`) while the mark is set, a signed-in parent's reminders are cleared without a word. That is safe for privacy. The Keychain item is readable after the first unlock and the app has no background launch mode, so this should be rare. It belongs on the BL-948 device rows next to the kill row the body already lists.
4. Note. Upgrade: a phone that signed out under an earlier build, before this one shipped, has no mark. Its old reminders are not cleared at launch. They end the next time a session ends here. This is a one-time gap, worth one line in the release notes for `qa`.

## Not verified

- On a device: delivered notes clear after `dismissNotificationAsync`, the kill-after-Sign-out row, and a purged account's `SIGNED_OUT` (all BL-948).
- I did not rerun the suite locally. I relied on CI.

CI at this head: `required` passed, and so did tests and content rules, typecheck, database rules, the Deno functions, the B-8 seam check and agent team consistent. `store-profile Release launch` is still queued, as it is on every PR in this batch. One duplicate `compliance-fence` run was cancelled, and its twin passed. The head commit is from 12:44 UTC, and I finalised at 12:55 UTC.

Reviewer: independent of the author (CR-44).
