Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC). Already merged (do not redo): the never-list tests (#905: `reminders-never-list.test.ts`), reminders end with the session (#904: `reminders-session.test.ts`), quiet books (#901), and the consent-key fix (#903).
Pin at develop 55574906c, E1 to E83, CL-001 to CL-158 (`docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): Council D4 (DECISIONS-20nov.md, merged to develop): with names off, no month number or age in any reminder body or title (the age leaks): re-check the month and birthday note copy against it before the planner PR. E57 and E64: no new Days-ask flag; a paused family gets no day notes and the phone owns the pause. E58: no softer words for an optional update. E82 (CL-157): the month and birthday copy must pass the names-off test (no month number or age when names are off or App lock is on); neutral body reused; `content` owns the swap. E79 (CL-153): local notifications only; no remote push.
Blocked until: BL-966 (a) to (c) merged (BL-943 edits `planner.ts` after 966b); founder Q2 order (Build 14 on); open questions for Karma and product: OQ-13.3 (is a `killSwitches.reminders` wanted: default none; NS-13-R26 says the kill switch does NOT touch reminders), OQ-13.4 (upgraders: a phone with reminders on and no `reminders.onSince` gets one once, per the design). NOTE for the backlog row: the plan lists BL-943's rows as R1 to R33, the backlog text lists R1 to R17: the card wins.

```
BRIEF BL-943 (anchor, back-off, landing; 3 PRs plus a docs PR)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile (reminders owner)   Lane: Pack 4 (Reminders)   Build: 14 on   Wave: 2

1. GOAL: When a parent has not opened the app, reminders step back to weekly after 7 days and stop after day 35 (one constant, PROPOSED); a letter made today cancels today's reminder;
   and a tap on a month or birthday note opens the Book.

2. CARD ROWS and TEST TITLES
   Rows: NS-13-R1 to R4, R7 to R9, R16 to R18, R22, R23, R25 to R27, R29 to R32 (R5, R6a, R6b, R10 to R15 done: #905, #904, #901; R19, R28, R20, R21 are BL-966). Card 09 at 450bcb4a.
   Titles (catalogue C, PR #926, exact):
     [NS-13-R3] unanswered reminders back off        [NS-13-R4] reminders stop on their own
     [NS-13-R8] no reminder after a made letter      [NS-13-R18] nothing after day 35 when untouched (unit with injected clock, plus a device spot check of the pending list)
     [NS-13-R27] the anchor counts a made draft      [NS-13-R9] the reminder lands on Home      [NS-13-R26] kill switch does not touch reminders
     [NS-13-R23] never over sixty pending            [NS-13-R32] the first week follows the cadence   [NS-13-R30] quiet hours hold   [NS-13-R2] never the same words twice running
   Red on develop: no `backoff.ts` (planner horizon 21 days for evening at `planner.ts:293`, 92 for notes at `:294`). Backlog "fails on old code": R3, R4, R8.
   Mutants (catalogue C): schedule every chosen weekday after day 7 (R3); remove the day-35 cut (R4, R18); count only kept letters (R8); count discarding drafts (R27); route to Listen on tap (R9);
   gate reminders on the switch (R26); drop plan notices first (R23); ignore smart quiet (R32); allow 21:45 in the picker (R30).

3. FILES  Touch: lib/reminders/{backoff (new),landing (new),planner,prefs,scheduler,index}.ts, lib/db/repos/{entries,drafts}.ts (two SQL reads), lib/store.ts (two read exports), app/(tabs)/_layout.tsx (one hook),
   tests reminders-backoff, reminders-anchor (new), next-ask, reminders-planner; `docs/qa/DEVICE_TEST_PLAN.md` rows by `qa`; inventory row for `reminders.onSince` (L2) in the same PR (privacy).
   Never: app/_layout.tsx, lib/billing/** (plan notices), lib/first-run/**, packages/content words (the 31 neutral lines for R2b come from `content`).
   Shared file rule: `lib/db/repos/entries.ts` is also edited by #895 (Find row): whichever lands second merges develop. `planner.ts` with 966b first; `store.ts` with #835, #839, #879, #895; `scheduler.ts` with 966c and HO-908.

4. READING PACK: Pack 4 items 1 to 6; `09-capture.md` (design) section 1.3 (anchor, back-off, landing) and section 1.9 (PR order), OQ-13.3 and OQ-13.4; `docs/design/NOTIFICATIONS.md`; PR #680 (fold in).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/reminders/planner.ts:293 horizon 21 (evening), :294 month horizon 92, :346-368 the evening loop (re-open), :378 cap; PlanInput `lastSaveAt` becomes `lastMadeAt` plus `onSince`
   apps/mobile/src/lib/reminders/prefs.ts:127 `plannerChildren`; `lastOwnSaveAt()` becomes `lastMadeAt()`: later of MAX(captured_at) over own non-deleted entries and MAX(created_at) over drafts in state `ready` (held or not)
   apps/mobile/src/lib/reminders/scheduler.ts:253-260 response listener (warm tap routes evening to '/', month/birthday to '/book'; a COLD start lands on Home); `turnOnReminders` writes `reminders.onSince`
   apps/mobile/src/app/(tabs)/_layout.tsx: mount `landing.ts` beside the reminder ask card (`reminder-prime-ask.tsx:4`); `getLastNotificationResponse()` reads once then clears
   #680 head 68cdb4db: 43 lines, 2 files, conflicts; its device row id is S1-133 in the PR and S1-135 at the lock

6. DATA AND SECURITY
   Data classes: L2 `reminders.onSince` (a local date); nothing else new. Reads two SQL aggregates, no content. New send, log: none; no body, name, child id or date logged.
   Boundary: NSC-03 (the anchor reads must go through the account scoping `[X4-R1]` adds: drafts carry no author, `drafts.ts:35-37`); R9 landing never starts a capture (NS-35-R3).
   Owner of the read: security-architect on landing and cold start; compliance-engineer on the anchor.

7. LIBRARIES: none. `expo-notifications ~57.0.21` (`getLastNotificationResponse` in `NotificationsEmitter.d.ts:83` [U re-check]); Intl and `tz.ts` (LD-18); no date library (PR #920).

8. BUDGETS (PR #928): L-09 re-plan under 50 ms for 3 children (Node, BLOCK at 3x); a Node bench of `lastMadeAt` plus `planReminders` on `node:sqlite` with 1,000 entries and 3 children under 10 ms (PROPOSED);
   L-01, L-03 no awaited work added at launch (`scheduler.ts` first re-plan stays `void`); B-03 at most 60 pending in TOTAL, plan notices first (E13 applied in card 11: NS-13-R23, R7 and NS-32-R4b say 60 in total; CL-115). Today the planner allows 64: `planner.ts:295` caps the budgeted group at 60 (`maxNotifications ?? 60`) and `plan-reminders.logic.ts:48` adds up to 4 plan notices, so this change LOWERS the total. Checked: Node; the phone by the NS-34 run sheet; tap to Home within 2 s is a device row.

9. ACCEPTANCE  Experience: D-S04 reminder ask, D-S06 Me Reminders (off, on, denied, backedOff, lateClamp, appLock, ax5), D-S10 (PR #921); no screen says reminders slowed (card section 15). Test cases above.
   Done also means: red on old code and mutants; an injected clock for every cadence.

10. PR BREAKDOWN (design 1.9)
    PR 3: the anchor counts a made letter (R27, R8) | about 260 lines, 7 files | base develop after 966b | way back: revert, the next launch re-plans
    PR 4: pre-scheduled back-off (R3, R4, R18, R32, R23, R2; folds #680) | about 330, 3 | base PR 3 (or develop) | live behaviour change: a parent silent over 35 days stops getting reminders (by design)
    PR 5 (owns the cold-start landing; 966c and HO-908 refer to it as PR 5): cold-start landing (R9), kill-switch test (R26), picker bounds (R30) | about 250, 6 | base develop after 966c
    PR 6: device rows R1, R7, R9, R16, R25; J-N3, J-N4, J-N5, J-N19, J-N24 | docs, by `qa`

11. LENSES: A principal-architect, B compliance-engineer (PR 3: data-steward / principal-architect; PR 5: security-architect / principal-architect).

12. ORDER: after BL-966 (a), (b), (c); before BL-982 (typed days) and BL-985. Blocked by: BL-966, founder (Q2), Karma (OQ-13.3, OQ-13.4).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors; `npm test -w packages/content` if a key changes
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed; BL-948 sheet rows named in the PR body

14. ONLY A PHONE CAN PROVE: J-N3 reminder at the chosen hour within 5 minutes; J-N4 nothing after day 35 on a real pending list; J-N5 zone change across 5 zones, none between 21:30 and 07:00; tap lands on Home within 2 s on SE 3;
    S1-135; revoked permission schedules nothing (JOURNEYS rows 3.11, 4.11, PR #925).

15. STOP AND ASK: the cold-start route races the tabs mount (Unverified on 57.0.21: fallback Home); the 7-day or 4-week numbers are changed; a kill switch for reminders is wanted; `getLastNotificationResponse` behaves differently.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl943 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl943.md`. Branches `feat/mobile-bl-943-{3-anchor,4-backoff,5-landing}`. Comments start `<!-- agent:mobile -->`.
```
