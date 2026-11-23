Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC). Stale in the design: it says "`prefs.ts:116` becomes `included: c.remindersOn && !c.quiet`" and that nothing reads `quiet`. On develop #901 fixed it: `plannerChildren` is at `prefs.ts:127` and passes `quiet`, and `planner.ts:25-26,78-79` honour it; NS-32-R14 has tests (`reminders-quiet-books.test.ts:75`).
Pin at develop 55574906c, E1 to E83, CL-001 to CL-158 (`docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E57 (CL-131): a paused family gets no day notes (NS-46-R25 next to R49); there is no `EXPO_PUBLIC_DAYS_ASK` flag (the ask rides on `EXPO_PUBLIC_DAYS`). E64 (CL-138): the pause (`celebrations_paused`) is owned by the PHONE in Drop A and the planner reads it locally; nothing reads the server column. E45 (CL-119): all day words follow `notifications.dayNames`. E82 (CL-157): the plan's notes obey the names-off rule (no month number or age on a lock screen with names off or App lock on); the test is in BL-966c. E79: local notifications only.
Blocked until: BL-966 (a) merged; founder Q8 (the cap). Q-E1 is closed by CR-69 A1 (one `budget.ts`: registry and `chooseOnePerDay`). NS-32-R1b still fails today (two notifications can land on one day).

```
BRIEF BL-966b (planner: one a day, priority, ceiling) Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile (reminders owner)   Lane: Pack 4 (Reminders)   Build: 13 (R1b fixed before the cut, or shipped as a known defect by written decision, Q1)   Wave: 1

1. GOAL: When two books have a birthday and a month note on the same local day, exactly one notification is scheduled, the highest priority wins, and no plan ever holds more than 60 pending in total, plan notices kept first.

2. CARD ROWS and TEST TITLES
   Rows: NS-32-R1, R1b, R3, R4, R6, R7, R8; NS-13-R19, R28 (titles only). Card 11 and card 09 at 450bcb4a.
   Titles (catalogue A and C, PRs #925 and #926, exact):
     [NS-32-R1] one budgeted notification a day            [NS-32-R1b] birthday and month-day on one date   (fails today)
     [NS-32-R4] plan notice on time                        [NS-32-R6] time zone change
     [NS-32-R8] back-off pre-scheduled                     [NS-13-R19] two books, one notification a day
     [NS-13-R28] birthday and month merge
   R8's test lands here as a guard: it passes on the 21-day horizon and must keep passing after BL-943.
   Red on develop: `planner.ts:319` keys notes `${kind}:${isoDate(date)}`. Mutants (catalogue A and C): remove the one-per-day clamp in `chooseOnePerDay` (CR-69 A1) (R1); skip the same-date merge (R1b);
   plan in UTC dates (R6); remove the day-35 cutoff (R8); choose month copy over birthday copy (R28).

3. FILES  Touch: lib/reminders/{planner,prefs,index}.ts, test/reminders-planner.test.ts (retitle), test/reminders-budget.test.ts, test/reminders-quiet-books.test.ts (read only: do not weaken).
   Never: lib/billing/** (plan notices stay `payments`'; they keep ids `plan.`), lib/store.ts, lib/first-run/**, lib/auth/**.
   Shared file rule: `planner.ts` (384 lines) is edited next by BL-943 PRs 3 to 5, then BRIEF-HO908 touches `scheduler.ts` only.

4. READING PACK: Pack 4 items 1 to 6; `09-capture.md` (design) sections 1.2 and 1.3 (lines 29 to 80); `11-foundations.md` section 2.

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/reminders/planner.ts:293   horizon 21; :319 note key; :365 evening id `${ID_PREFIX}evening.${isoDate(date)}`; :378 sort and `.slice(0, max)`
   apps/mobile/src/lib/reminders/prefs.ts:127      `plannerChildren()`: `included: c.remindersOn, quiet: c.quiet === true`
   apps/mobile/src/lib/reminders/scheduler.ts:135  `currentPlan()`: reads prefs; :153-155 `scheduleNotificationAsync` with `content` and no category
   apps/mobile/test/reminders-planner.test.ts, reminders-quiet-books.test.ts:75, reminders-never-list.test.ts (#905)

6. DATA AND SECURITY
   Data classes: L2 reminder settings, L4 child name only when "names on the lock screen" is on (default off, D-025). New storage, send, log: none; no body, name, child id or date in a log.
   Boundary: NSC-03 (a plan must not plan for a book the account may not see: BRIEF-HO908), NS-32-R12 lock screen plain. Owner of the read: compliance-engineer; security-architect on R12.
   `PlanInput` has no text field (type test, #905).

7. LIBRARIES: none. Intl and `lib/reminders/tz.ts` for local dates (LD-18 USE; no date-fns, no temporal polyfill; PR #920).

8. BUDGETS (PR #928): B-03 (92-day property test: at most 60 in total, plan notices first; today the planner allows 64, so this lowers it; BLOCK); L-09 under 50 ms for 3 children (Node, median of 5; BLOCK at 3x); L-04 re-plan under 50 ms at launch, never awaited
   (`scheduler.ts` first re-plan stays `void`). Checked here by Node timing; the phone by the NS-34 run sheet.

9. ACCEPTANCE  Experience: D-S06 states backedOff, lateClamp; D-S10 lock screen hidden, named, neutral (PR #921); EX-15 nothing a person said in a notification preview. Test cases above.
   Security: AB-04, AB-10, AB-11 (PR #915). Done also means: red on old code and on mutants.

10. PR BREAKDOWN: PR b: the planner | about 350 lines, 4 files | base develop after 966a | flag-off proof: none; ships on (card section 10), way back: revert, next launch re-plans.

11. LENSES: A principal-architect, B compliance-engineer; add security-architect for R12.

12. ORDER: after BL-966 (a); before BL-966 (c), BL-943. Blocked by: 966a, founder (Q8).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors; `npm test -w packages/content` if a key is added
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: J-N4 spot check of the pending list, J-N24 lock screen over a week, J-N27 (JOURNEYS rows 3.11 and 4.11, PR #925; BL-948).

15. STOP AND ASK: the cap is not one a day; two classes tie and the card does not say who wins; a plan notice must change (payments); the ceiling is anything but 60 in total.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl966b agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl966b.md`. Branch feat/mobile-bl-966b-planner. Comments start `<!-- agent:mobile -->`.
```
