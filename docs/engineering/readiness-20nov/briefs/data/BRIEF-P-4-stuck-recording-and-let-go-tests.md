BRIEF P-4: Stuck recording row, failure counter and the NS-titled let-go tests (NS-09-R6, R7 to R12, R15 to R17)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 5 (keeping and letting go)   Build: 13: R6 holds the cut; R7, R8 tests before the cut (Q1 recommendation)   Wave: 1   Size: M: P-4a about 320 lines 8 files; P-4b about 300 lines 4 files (tests)
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: P-4a: the founder approves the BL-925 stuck-line words and Product rules where R6's row lives (design K3: card says Storage, storage.tsx:24-28 says letters never appear there; errata E28 amends that rule, on the unlocked inputs branch, so confirm with product). P-4b needs nothing but BL-925 for R9 wording. Whether production runs held sync (design U3, OQ-11) is `sync`'s answer; say so in the PR.

1. GOAL: When a delete has failed on three launches, then Settings shows one row 'still being removed' with Remove now, with no list and no count; and every let-go row R7 to R12, R15 to R17 has a test titled with its NS id that fails on the old code.

2. CARD ROWS and TEST TITLES
   Rows: NS-09-R6, R15, R16, R17 (P-4a); NS-09-R7, R8, R9, R10, R11, R12 (P-4b, BL-977) (card 08 lines 306-317).
   Tests (titles exact, PR #925 catalogue A; mutants from the same rows):
     [NS-09-R6] a stuck recording is visible in Storage           mutant: retry in a loop on tap
     [NS-09-R15] the failure count survives a relaunch            mutant: hold the count in memory only
     [NS-09-R16] the sweep runs after an update                   mutant: skip the sweep when the version changed
     [NS-09-R17] no remote switch stops a let-go (source check)   mutant: read a config key to delay the delete (needs a positive control)
     [NS-09-R7] the discard reaches the server                    mutant: remove the op on send instead of on ack
     [NS-09-R8] let go follows to the other phone (stand-in, then two phones)   mutant: skip the held.discard apply in the pull
     [NS-09-R9] the confirmation defaults to keep                 mutant: make Let it go the default, or add an Undo after confirm
     [NS-09-R10] kill switch queues the discard                   mutant: gate the local delete on the sync switch
     [NS-09-R11] a discard is never sent as another account       mutant: drain without checking the op's owner
     [NS-09-R12] sign out does not drop a discard                 mutant: remove the discard kind from signOutWouldWait
   Red on develop: R15 and R6 have no counter (assert key discard.failures.<id> reads 2); R7 to R12 pass today on the stand-in but cite no NS id, so trace skips them (add the id; the assertion is the proof).
   Conflict (design K3): catalogue A (PR #925) names data-architect on R7, R8, R11, R12; plan 2.3 names mobile. Mobile builds; data-architect reads the server half (BRIEF-BL-959-T2).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/store.ts and lib/db/repos/drafts.ts (noteDiscardFailure, key removal in finishDiscard, deleteDraft), lib/sync/merge.ts (the un-discard path only), lib/capture/sweep.ts (export finishLetGo), lib/capture/stuck.logic.ts (new, pure), the Storage or Where your letters live screen per the ruling, apps/mobile/test/** (new tests), docs/agents/checkins/mobile-p-4.md
   Never:  review.tsx (BL-926), listen.tsx, lib/sync/outbox.ts except a test seam, supabase/**, packages/content words except PROPOSED keys from #866, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: settings/storage.tsx and settings/where-letters-live.tsx are also edited by BL-976 P-6c; serial: P-4a first if the row moves.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 5 (tests to copy: test/sweep.disk.test.ts, sync-held-v8.test.ts, sync-two-phone.test.ts, helpers/expo-fs-standin.ts, auth-sign-out-wait.test.ts); 08-keeping.md sections 2.2, 2.5, 2.7 (develop); docs/adr/0025 for held ops.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/capture/sweep.ts:56              runLaunchSweep (finishLetGo is internal today)
   apps/mobile/src/lib/sync/merge.ts:407, 555, 569      marks a draft `discarding` from a gone marker; :591 turns it back to `ready` when the server kept the row
   apps/mobile/src/lib/sync/outbox.ts:547               held.discard queued with the mark (verify the transaction)
   apps/mobile/src/lib/auth/machine.logic.ts:274        signOutWouldWait; session-provider.tsx:545 uses it
   apps/mobile/src/lib/db/migrations.ts:63              settings table (key, value); no migration needed
   apps/mobile/src/app/settings/storage.tsx:24-28       the 'letters never appear here' rule that R6 amends
   supabase/migrations/20261016000000_sync_v1_server.sql:771   held_discard keeps the row on a later edit or a legal hold

6. DATA AND SECURITY
   Data classes: settings key discard.failures.<draft id>: id L3, count L2; phone only; never synced, exported or logged; removed with the row. No new table, no server change.
   Boundary: none new. Held discard sends the id only. Production may not run held sync (U3): R7, R8 and R14 prove the stand-in only; say so.
   Privacy line: nothing of a child's voice leaves the phone.

7. LIBRARIES ALLOWED
Use installed expo-sqlite (LD-32, PR #920), expo-file-system. None new.

8. BUDGETS
A failure costs one settings write; the sweep runs after the first frame, never awaited (sweep.ts:2-3). NS-09-R5 (0 discarding, under 5 ms, PROPOSED) and R13 (50 drafts under 2 s, U7) are SE 3 device rows (budget L-04, PR #928); not measured in CI.

9. ACCEPTANCE
   Experience: area C Storage or Where your letters live row and Remove now states (docs/e2e-ux-20nov 9e78eecd; re-open). No count, no error word, no list.
   Test cases: PR #925 catalogue A NS-09 block. Security: PR #915 abuse cases on let-go and second account (AB, FL ids; re-open).
   Done also means: every test above red on old code and red on its named mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (P-4a): counter, key removal in three places, stuckRecordings(), the row + Remove now, [R6][R15][R16][R17] | about 320 lines, 8 files | base develop | no flag
   PR 2 (P-4b): [R7][R8][R9][R10][R11][R12] tests, R9 source check | about 300 lines, 4 files (tests) | base develop; if over 400 changed lines split R7/R8 from R9 to R12

11. REVIEW LENSES
Lens A: principal-architect. Lens B: data-steward (the let-go removes a child's voice; the count must go with the row).

12. ORDER AND DEPENDENCIES
After: BL-925 words (#866) for the row text; BL-926 in review first. Before: BL-929 sheet rows (R5, R13). Blocked by: founder words; product ruling on K3.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
NS-09-R8 two phones (D13: let go on A, relaunch B, no row or file); R5 and R13 on an SE 3; R9 VoiceOver default focus (U2).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the count would need a table or a new local migration; - R9 needs a preferred-action flag RN 0.86 does not give (U2); - production held-sync state is needed to state a result.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-p-4 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-p-4.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: fix/mobile-p4a-stuck-recording-row in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
