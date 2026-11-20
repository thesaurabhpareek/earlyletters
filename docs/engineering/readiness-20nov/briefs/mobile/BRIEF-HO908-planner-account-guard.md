Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 20:35 UTC). The handoff cites `listVisible` at `lib/store/repos/children.ts:26-27`: that path does not exist; it is `apps/mobile/src/lib/db/repos/children.ts:54` on develop [V]. The handoff names `currentPlan()` in `lib/reminders/scheduler.ts`: it is at `scheduler.ts:135` [V].
Blocked until: #879 merged (BL-961 3 of 3): `bookVisibleNow` is not on develop. Handoff issue: #908 (karma to mobile). Nothing for the founder. NSC-03 stays "not yet" for reminders until this lands (review B on #879, note 2).

```
BRIEF HO-908 (planner guard under a second account)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 20:35 UTC
Agent: mobile (reminders owner)   Lane: Pack 4 (Reminders)   Build: 13 (rides with BL-961)   Wave: 1

1. GOAL: When account B signs in on a phone that holds A's book, the reminder plan is empty: no note names A's child and none is planned for A's books.

2. CARD ROWS and TEST TITLES
   Rows: NS-32-R12 (lock screen plain), NS-13-R13 (a second account starts with none), [X4-R1]; CR-67 AX-12. Cards 09, 11, 08 at 450bcb4a.
   Title (PROPOSED; the catalogue has NS-13-R13 `[NS-13-R13] a second account starts with none`, cites `reminders-session.test.ts:210`; add this case under that title):
     `[NS-13-R13][X4-R1] a second account's plan is empty while the owner's book is on the phone`
   Fixture (handoff): a book owned by A, B signed in, names on the lock screen on, reminders on; `currentPlan()` returns `[]`. Red on develop: `currentPlan()` plans from `listChildren()`, which has no account filter.
   Mutant: delete the new first line `if (!bookVisibleNow()) return [];`.

3. FILES  Touch: apps/mobile/src/lib/reminders/scheduler.ts (the first line of `currentPlan()` only), one test in `test/reminders-session.test.ts` or `test/reminders-planner.test.ts`.
   Never: lib/store.ts (read `bookVisibleNow` only), lib/reminders/planner.ts, lib/billing/**.
   Shared file rule: `scheduler.ts` with BL-966 (c) and BL-943 PR 3.

4. READING PACK: Pack 4 items 3, 5; Pack 3 pitfalls ("the planner guard lands in the BL-967 lane"); #879 body ("Reminders" row) and review B notes 1 and 2.

5. CODE ENTRY POINTS (develop 16e61549; #879 head e27d104e)
   apps/mobile/src/lib/reminders/scheduler.ts:135-137   `currentPlan()`: `const prefs = readPrefs(); if (!prefs.enabled || prefs.paused) return [];` (add the guard before them)
   apps/mobile/src/lib/db/repos/children.ts:54            `listVisible`: no account clause (by design: reads go through `shown()` in the store)
   #879 head: apps/mobile/src/lib/store.ts:446             `bookVisibleNow()`
   apps/mobile/src/lib/reminders/session.ts:57             `forgetReminders` on session end; #904 makes B start with reminders off, which narrows the case but does not close it

6. DATA AND SECURITY
   Data classes: L4 child name on a lock screen (only if names on). New storage, send, log: none. Boundary: NSC-03; AB-04 "A's reminder was planned naming A's child; B signs in: pending notes cancelled and re-planned from B's books only" (PR #915).
   Owner of the read: security-architect.
   Re-plan also must CANCEL A's pending notes when the guard turns the plan to empty: check that the scheduler's `apply()` cancels what the new empty plan no longer lists [U]; if not, add one test and say so.

7. LIBRARIES: none.

8. BUDGETS (PR #928): L-09 under 50 ms; the guard adds one boolean read per plan. Not measured.

9. ACCEPTANCE  Experience: E-S18 (foreign scope reaches no reminder; PR #921). Test case above. Done also means: red on old code and the mutant.

10. PR BREAKDOWN: one PR, about 60 lines (S), base develop after #879, branch `fix/mobile-ho-908-planner-account-guard`. Flag-off proof: with one account the plan is unchanged (test).

11. LENSES: A principal-architect, B compliance-engineer (plan 2.3, BL-967 lane).

12. ORDER: after #879; independent of BL-966. Blocked by: #879.

13. DEFINITION OF DONE
    [ ] test red on old code and mutant; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed; comment on issue #908 with the PR link (start `<!-- agent:mobile -->`)

14. ONLY A PHONE CAN PROVE: two sign-ins on one phone: A's pending list is empty after B signs in; no A-named note arrives (device row for BL-948, as the handoff says).

15. STOP AND ASK: the guard needs a different function than `bookVisibleNow`; pending A notes are not cancelled by an empty plan; #879's name changes.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-ho908 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-ho908.md`. Comments start `<!-- agent:mobile -->`.
```
