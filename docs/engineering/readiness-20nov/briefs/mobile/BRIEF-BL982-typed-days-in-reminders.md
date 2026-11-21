Re-open every file:line before relying on it. This brief was filled by `product` on 21 Nov 2026 from the backlog row and the locked cards only: no code file was opened, so every code cite below is NOT VERIFIED and field 3 and field 5 name areas, not lines. `mobile` fills in the lines before the PR opens.
Blocked until: BL-966 (notification budget, one a day) and BL-943 (reminders proven, back-off). A typed day is a notification, so it waits for the registry that counts them.

```
BRIEF BL-982 (Typed days in reminders (NS-18))    Filled by: product for Karma, 21 Nov 2026 (card rows read at rev 2; code NOT read)
Agent: mobile   Lane: Wave 1   Wave: 1

1. GOAL: When a parent types a day and some words, exactly one notification arrives that day with the fixed line, and it replaces any ordinary reminder or month note that day; the typed words show only if the parent turned showing on, and are deleted the day after delivery, on sign-out, on Erase everything and on account deletion.

2. CARD ROWS and TEST TITLES (card 09, NS-18)
   P0: NS-18-R3 `[NS-18-R3] words hidden by default` (body is the fixed line, never the typed words, unless `notifications.dayNames` is on; forced off with App lock, E45); NS-18-R6 `[NS-18-R6] typed days removed`; NS-18-R8 `[NS-18-R8] typed words never logged` (canary text in no log, crash report or URL).
   P1 in the same PR: NS-18-R1 `[NS-18-R1] one notification on the typed day`; NS-18-R2 `[NS-18-R2] the typed day replaces a reminder`; NS-18-R4 `[NS-18-R4] back-off never drops a typed day`; NS-18-R5 `[NS-18-R5] typed words length` (1 to 80 characters, PROPOSED, any script); NS-18-R7 `[NS-18-R7] typed words do not linger`.
   Red on old code: no typed-day store exists.

3. FILES  Touch: `apps/mobile/src/lib/reminders/**` (the planner and the settings keys) [U], the typed-day entry in the settings keys. Settings keys `typedDay.<yyyy-mm-dd>`, never synced and never exported (the BL-982 default). Never: `packages/content` words, `supabase/**`, any analytics call with the typed words.

4. READING PACK: card 09 NS-18 and NS-13 (back-off); BL-982, BL-966, BL-943 in `docs/BACKLOG.md`; the day-name switch rows NS-47-R37 and RV-8; BRIEF-BL966A and BRIEF-BL943 in this folder.

5. CODE ENTRY POINTS: NOT VERIFIED. `mobile` lists them first.

6. DATA AND SECURITY: typed words are the parent's own words and are L3: on the phone only, deleted the day after delivery, cleared on erase and sign-out. The notification body is the fixed line by default. The canary test (NS-18-R8) is the proof. No `verifyEdits` path: the words are stored and shown unchanged, never rewritten.

7. LIBRARIES: none new.

8. BUDGETS: the typed day counts inside the notification budget (BL-966 `TOTAL_MAX = 60`; plan notices first); it outranks other notes on its day (NS-13-R29).

9. ACCEPTANCE: the eight titles pass, the three P0 rows first.

10. PR BREAKDOWN: one PR (size S); branch `feat/mobile-bl-982-typed-days`.

11. LENSES: A principal-architect, B per the plan 2.4 row for this id.
12. ORDER: after BL-966 and BL-943. Blocked by: both.
13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile` shows no new red file; ASCII only; no typed words or child name in a log
    [ ] labels agent:mobile, from:agent; journal PATCHed; check-in line committed
14. ONLY A PHONE CAN PROVE: a typed day arrives once on the day, in a different time zone too, with and without the day-name switch on; the lock screen shows the fixed line.
15. STOP AND ASK: a card row and the code disagree; a new word is needed (content owns the key, the founder approves); the row needs a file outside the list in field 3.
16. HARNESS: claim row: NONE yet; Karma adds it before the agent starts. Check-in `docs/agents/checkins/mobile-bl982.md`.
```
