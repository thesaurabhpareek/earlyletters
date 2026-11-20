Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 20:25 UTC).
Blocked until: Karma rules Q-E1 (two shapes for one file: PACK-DELTA-2 row NS-46-R30 in PR #932 says `budget.ts` is a pure chooser `chooseOnePerDay(candidates, planNoticeCount)` with the order typed day, birthday, library day, month-age, evening; our design `11-foundations.md` section 2 says a class registry with `allocate({ planPending, budgeted })` and `addNotificationClass`). The tests below hold under either shape; only the module's exports wait. Founder Q8 (the cap): default is one a day (locked card). Open conflict for product: NS-32-R4b wants plan notices at the iOS ceiling of 64; the design keeps 60 in total (Conflict P1, "confirm with product before building"; catalogue A marks R4b GAP). Do not build R4b until product answers.

```
BRIEF BL-966a (budget.ts and allocate)            Filled by: mobile RD-H1 for Karma, 20 Nov 2026 20:25 UTC
Agent: mobile (reminders owner)   Lane: Pack 4 (Reminders)   Build: 13 (NS-32-R12 tested before the cut; Q1)   Wave: 1

1. GOAL: When any number of notification classes want a slot, one shared registry and one `allocate` decide, so the total stays at 60 budgeted plus plan notices outside the budget,
   and a class cannot be added without a registry row.

2. CARD ROWS and TEST TITLES
   Rows: NS-32-R2, R3, R5, R7, R15 (R4b see above). Card 11 (NS-32) at 450bcb4a.
   Titles (catalogue A, PR #925, exact):
     [NS-32-R2] unregistered class fails        [NS-32-R3] priority decides
     [NS-32-R5] registry rows                   [NS-32-R7] pending ceilings
     [NS-32-R15] a class cannot raise the total
   File: `apps/mobile/test/reminders-budget.test.ts` (#758 has it; 262 added lines in 3 files: `budget.ts`, `planner.ts`, that test).
   Red on develop: no `budget.ts`. Mutants (catalogue A): register the class in one place only (R2); invert the sort (R3); add an `occasion` class (R5, there is none by design);
   raise a ceiling constant (R7); bump the ceiling per class (R15).

3. FILES  Touch: lib/reminders/budget.ts (new, from #758; pure), lib/reminders/index.ts, test/reminders-budget.test.ts. The planner and categories are 966b and 966c.
   Never: lib/billing/** (plan notices are `payments`' code: hand off), packages/content, lib/store.ts, lib/first-run/**.
   Shared file rule: `planner.ts` is edited by 966b first and BL-943 PRs after it; this PR does not touch it (keep it a pure module).

4. READING PACK: Pack 4 items 1 to 3, 5; `11-foundations.md` section 2 (lines 54 to 85); `docs/design/NOTIFICATIONS.md`; PR #758 (reuse its idea, not its Memory Library classes).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/reminders/planner.ts:319      `const key = ${kind}:${isoDate(date)}`: two kinds on one date are two notes (NS-32-R1b)
   apps/mobile/src/lib/reminders/planner.ts:378      `.slice(0, max)` latest-first drop; :293 horizon 21 days (evening); :142 MIN_LEAD_MS
   apps/mobile/src/lib/billing/plan-reminders.logic.ts:48   MAX_PLAN_NOTIFICATIONS = 4; :50 prefix `plan.`; plan-reminders.ts:77 cancels only its own ids
   #758 head 4b108df4: src/lib/reminders/budget.ts (draft, 0 reviews, last push 10 Nov; GitHub state `unknown`)

6. DATA AND SECURITY
   Data classes: none (a pure module). New storage, send, log: none. Nothing leaves the phone. Boundary: NSC-03 for the account guard (BRIEF-HO908). Owner of the read: none beyond lens B.

7. LIBRARIES: none. `expo-notifications ~57.0.21` as installed (LD-20 USE; iOS keeps 64 pending, we plan 60; PR #920).

8. BUDGETS (PR #928): B-03 at most 60 pending local notifications in total, one a day, quiet book 0 (property test over 92 days, BLOCK); L-09 planner under 50 ms for 3 children, median of 5 on the Asha 1,000-letter fixture,
   BLOCK at 3x (CI jitter), WATCH between 1x and 3x. Checked: B-03 and L-09 by Node tests here.

9. ACCEPTANCE  Experience: D-S06 Me, Reminders (backedOff, lateClamp states; PR #921). Test cases above. Done also means: red on old code and on each mutant; the rows hold under both Q-E1 shapes.

10. PR BREAKDOWN: PR a: `budget.ts` and `allocate` | about 250 lines, 3 files | base develop | supersedes #758 (ask Karma to close it; an agent never closes) | flag-off proof: none (a pure module nobody imports yet)
    Then 966b, 966c.

11. LENSES: A principal-architect, B compliance-engineer (plan 2.3).

12. ORDER: before 966b, 966c, BL-943, BL-982, BL-985. Blocked by: Karma (Q-E1), founder (Q8 cap), product (R4b). Counsel Q41 gates the plan windows of a STORE build, not this code.

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: nothing in this PR; the plan reaches a phone in 966b.

15. STOP AND ASK: Q-E1 is ruled; the ceiling is not 60; a class is wanted that the registry forbids (Memory Library `occasion`).

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl966a agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl966a.md`. Branch feat/mobile-bl-966a-budget. Comments start `<!-- agent:mobile -->`.
```
