BRIEF HO-908-910-911: Second-account follow-ups after BL-961: reminder plan guard, account-gone reminders, Delete account note (#908, #910, #911)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 3 (account and consent) with the BL-967 reminders lane   Build: 13 (known P0 defect family)   Wave: 1   Size: S: three PRs of about 40 to 120 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: #879 (BL-961 3 of 3, head e27d104e, base #871's branch) and #871 (head 4879ff5c) merge first: bookVisibleNow does not exist on develop 16e61549 (checked: no match under apps/mobile/src). #910 part 2 also needs a Product choice between a one-time launch rule and a release-note line.

1. GOAL: When account B signs in on a phone that holds account A's book, then B's reminder plan is empty, B's Delete account screen never reads or erases A's deletion note, and an account that is gone ends its reminders.

2. CARD ROWS and TEST TITLES
   Rows: NS-32-R12 and NS-13-R13 (#908, #910); NS-10-R3 and [X4-R1] (#911); CR-67 AX-12.
   Tests (titles from PR #925 catalogue A and C; add the NS id in brackets first):
     [NS-32-R12] lock screen stays plain        add a case: book owned by A, B signed in, currentPlan() returns [] (mutant: remove the guard line)
     [NS-13-R13] a second account starts with none   add: account-gone path calls endReminderSession(); upgrade-path rule if chosen (mutant: skip the call)
     [X4-R1] ... (the #879 title)               add: B's refresh() never calls recordStatus for A's note (mutant: remove the bookVisibleNow guard in use-account-deletion)
   Red on develop: scheduler.ts:135 currentPlan has no account check; listVisible has no account filter (lib/store/repos/children.ts:26-27 per #908; re-open).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/reminders/scheduler.ts (the top of currentPlan only), lib/first-run/** (the account-gone branch only, #910 part 1), lib/account-deletion/** (the refresh hook; locate with git grep use-account-deletion, it is on #879's branch), matching tests, docs/agents/checkins/mobile-ho-908.md
   Never:  lib/store.ts (BL-961), the planner design (BL-966), supabase/**, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: lib/first-run is also edited by BL-922a and BL-978; the three PRs are independent, merge each as it is ready.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 3 and Pack 4; handoff issues #908, #910, #911 (read each body: they carry the exact first line); PR #879 body for bookVisibleNow; docs/tdd/new-scope/09-capture.md section 1.3.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/reminders/scheduler.ts:135       currentPlan(): add `if (!bookVisibleNow()) return [];` first (#908)
   apps/mobile/src/lib/auth/account-scope.logic.ts:34   bookVisibleTo (merged, #869); bookVisibleNow arrives in #879 (lib/store.ts) [U until merged]
   apps/mobile/src/lib/reminders/ session-end function   endReminderSession (merged in #904; locate with git grep)
   use-account-deletion.ts refresh and open-request.ts noteAfterRead   #911 cites :53 and :144-157; both moved, re-open
   apps/mobile/test/reminders-session.test.ts            the #904 test style

6. DATA AND SECURITY
   Data classes: none new. Fail closed. Nothing stored, sent or logged. A reminder body never names a child on a second account.
   Boundary: NSC-03; owner of the read: security-architect.

7. LIBRARIES ALLOWED
None new.

8. BUDGETS
Pure guards over memory; no launch wait. Not measured.

9. ACCEPTANCE
   Experience: none new on screen. Test cases: PR #925 catalogue A (NS-10-R3), catalogue C or D for NS-13, NS-32 rows (PR #926, #927). Security: PR #915 AB cases on second account.
   Done also means: each test red on old code and on its mutant (above).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (#908): planner guard + test | about 40 lines, 2 files | base develop after #879
   PR 2 (#911): Delete account refresh guard + test | about 60 lines, 2 files | base develop after #879
   PR 3 (#910): account-gone branch calls endReminderSession(); upgrade-path rule only after Product picks | about 120 lines, 3 files

11. REVIEW LENSES
Lens A: principal-architect. Lens B: security-architect (#908, #911), compliance-engineer (#910).

12. ORDER AND DEPENDENCIES
After: #871, #879. Before: BL-966 planner PRs. Blocked by: #879 merge; Product's pick for #910 part 2.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
BL-948 device row: B signs in, reminders on, lock screen shows no name of A's child; Delete account under B leaves A's note intact (two phones).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the guard needs a function other than bookVisibleNow; - #910 part 2 needs a choice (one-time rule or release note): ask, do not pick.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-ho-908-910-911 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-ho-908-910-911.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: fix/mobile-bl-961-followups-908 in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
