Agent: mobile
Mode: task BL-967
Satisfies: NS-13-R14; also NS-13-R13 and NS-13-R15, which the same hook covers
Data classes touched:
- Deletes the local settings `reminders.*` and `notifications.lockScreenNames` when a session ends. These are L2 (`docs/legal/DATA_CLASSIFICATION.md:698-699`), as review B corrected.
- Adds one local setting, `reminders.session`: an `on` flag with no id, L2 like the other reminder preferences. It needs a row in `DATA_CLASSIFICATION.md`, a `legal` file this run may not edit (handoff below).
- Nothing is sent or logged.

## What and why

Sign-out never removed reminders. Only Erase everything called `forgetReminders` (`apps/mobile/src/lib/erase-everything.ts:84`). A signed-out phone kept firing the last person's nudges and notes, possibly with a child's name, and the next account inherited their settings. NS-13-R14 (P0) is marked "not built today" on the locked card.

This PR:
- New `lib/reminders/session.ts`:
  - `sessionEnded(previous, next)` is true when a signed-in user id goes to none, or to another account.
  - `endReminderSession()` clears the reminder settings first (`REMINDER_SETTING_KEYS`, every key in `prefs.ts` `K`, `prefs.ts:54`), so a re-plan already queued plans nothing. It then awaits `forgetReminders()`, which removes every scheduled and delivered notification of ours and leaves anyone else's.
- One hook in `lib/auth/session-provider.tsx:196-204`, on `authUserId(state)`. It covers every path a session ends:
  - Sign out (finishes at `:300-315`);
  - account deletion, which ends with the same `auth.signOut` (`lib/account-deletion/use-account-deletion.ts`);
  - the under-18 answer (the reducer goes to `signedOut` with `under_18`);
  - a sign-out Supabase makes itself (`SIGNED_OUT` in `onAuthStateChange`);
  - another account signing in.
- A phone that never signed in is untouched. So are the open book (`activeChildId`, per the NS-14 state table) and the ask counts (`asks.*`, the default for capture design OQ-13.6).
- Durable clear (review B note 1, ruled a must-fix on this PR, NS-32-R12 risk):
  - The clear ran after the Keychain session was gone, so an app killed in that gap handed A's reminders, names on, to the next account.
  - While a session is signed in, the phone now keeps the mark `reminders.session` = `on`.
  - `settleReminderSession(previous, userId)` (`session.ts`) runs from the one provider effect, but only once the Keychain has answered (`authSettled`, never while `restoring`). It ends reminders when the session ended in this run, or when the launch settles with no session and the mark is still set. It marks a new session's reminders.
  - A phone that never signed in, and a launch that restores A, keep their reminders.
- `lib/reminders/index.ts` exports the new functions.

Design: `09-capture` 1.3, "The session ends, reminders end", the session half of its PR 2. The coordinator's brief called this NS-13 PR 1. The never-list tests that design calls PR 1 are a separate PR (test/mobile-bl-943-reminder-never-list). There are two differences from the design:
- `reminders.onSince` does not exist yet (it arrives with the back-off).
- The design's "a value to none" is widened to "a value to anything else", so a direct switch to another account (a second `SIGNED_IN`) also ends A's reminders (NS-13-R13).

Not touched: `_layout.tsx`, `lib/first-run/**` and `auth/account-*.ts` (the account layer, BL-961).

No new words.

## How it was checked

`apps/mobile/test/reminders-session.test.ts`:
- `[NS-13-R14] one hook on the user id ends reminders on every path a session ends`. Each path is driven through the real `authReducer`, and the hook's decision is counted per transition:
  - Sign out, including after a wait for uploads; deletion is pinned to the same `auth.signOut`;
  - the under-18 answer;
  - a Supabase sign-out, a lost session, and a session restored at launch then signed out;
  - another account (`[NS-13-R13]`).
  Each ends exactly once. There is also a test carrying the card's own title, `[NS-13-R15] deletion removes reminders` (review B note 3). A phone that never signed in, a repeated sign-in and "Stay signed in" end nothing. A source pin checks the provider effect and that it is the only caller.
- `[NS-13-R14] sign out removes reminders`, on the real store and the real scheduler with a stateful stand-in for `expo-notifications` (as in `reminders-erase.test.ts`). Every scheduled and delivered note of ours goes, and another app's stay. All 8 settings are cleared. `activeChildId` and `asks.reminderPrimes` are kept.
- `[NS-13-R13] killed right after Sign out, before the clear`: A's session is marked, and the next launch settles with no user. A's reminders, names and plan are gone before B signs in, and B's session is marked. This fails at 4052cfc4.
- A launch never clears what it should keep: a phone that never signed in, and A restored at launch. This also fails at 4052cfc4, which had no settle step.
- `[NS-13-R13] a second account starts with none`: reminders off, names off, and a re-plan schedules nothing.

On develop (`20553b18`) the 9 original tests fail; on this branch all 12 pass.

Run note, at 24c0f28d: `tsc --noEmit` shows the 5 known errors only. The full apps/mobile suite (3 workers) is exactly the sandbox baseline: 8 files and 73 tests, all from the missing `expo-local-authentication` and `expo-clipboard`. There was one Vitest worker RPC timeout under load and no test error. An earlier run at 4052cfc4 also had 4 load timeouts, and those files pass alone.

## What only a phone can prove

- That iOS really clears delivered notes from Notification Center after `dismissNotificationAsync` on sign-out, and that no note fires in the second between sign-out and the cancel.
- That a purged account's session ends with `SIGNED_OUT` on a phone that never taps Sign out (the design marks this Unverified).

Both are device rows for BL-948 (`qa`).

## Next step (handoff from BL-961, CR-67 AX-12, NS-32-R12)

The planner must not plan for a book the signed-in account may not see. When #879 (BL-961 3 of 3, `bookVisibleNow` in `lib/store.ts`) reaches develop, a follow-up commit on this work adds `if (!bookVisibleNow()) return [];` at the top of `currentPlan()` in `lib/reminders/scheduler.ts`. It comes with a test: a book owned by A, B signed in, gives an empty plan. Until #879 merges, this PR does not import it. This PR already covers the related case of another account signing in, which ends A's reminders (NS-13-R13).

## Way back

Revert this commit. Sign-out leaves reminders as before. Nothing stored is migrated.

## Globs touched

`apps/mobile/src/lib/reminders/{session,prefs,index}.ts`, `apps/mobile/src/lib/auth/session-provider.tsx`, `apps/mobile/test/reminders-session.test.ts`, `docs/agents/checkins/mobile-bl-967.md`. `session-provider.tsx` is also edited by fix/consent-retry-one-key; they merge cleanly.

## Handoffs (to be filed; this agent cannot post on GitHub in this run)

- `legal`: add a `reminders.session` row (L2, a flag with no id) to `docs/legal/DATA_CLASSIFICATION.md`.
- `mobile`, after #879 merges: the `bookVisibleNow()` guard in `currentPlan()` (CR-67 AX-12, NS-32-R12), as the "Next step" above says. Review B asks for this as a `handoff` issue so it outlives this PR. Until then, B starts with reminders off. But if B turns them on with names on, the plan can name A's child, because `listVisible` has no account filter on develop.
- BL-948 device row: kill the app right after Sign out, relaunch, sign in as B, and see no A reminder.

## Founder, look first at

- A parent who signs out and back in as themselves starts with reminders off. The card's R14 clears the settings, and nothing tells the parent.
- The ask count is kept per phone (`asks.reminderPrimes`, capped at 2, the default for OQ-13.6). Together with the reset, a parent who has seen both primes and then signs out and in again stays at reminders off and is never asked again. Only Settings > Reminders brings them back. A second account on the same phone inherits that count too.
- If either needs a line, or a reset of the ask count, that is a product and `content` decision. This PR adds no words.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
