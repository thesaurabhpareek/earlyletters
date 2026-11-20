Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked at develop `16e61549`, 20 Nov 19:04 UTC). REWRITTEN twice: after review, and again for CL-116 C-02 (GAP-LOG, ruled 20 Nov): timed Undo windows as the cards say (T4; NS-01-R38a to R38c; NS-33-R15) with ONE clock, owned by the toast that removes the control and refuses Undo at the same moment. `createUndo` in `apps/mobile/src/components/ui/toast.logic.ts`, owned by `design-systems` (11-foundations section table row 33-3: "`createUndo`, `progress-bar.tsx`, the 1.5 scans, about 300 lines"). CL-116 C-07: the toast keeps its Close control. This brief builds NO helper of its own and does not edit `components/ui/**`.
Blocked until: row 33-3 merged (design-systems; `createUndo` is not on develop: `toast.logic.ts` exports only `toastLayout`, `reduceToast`, `createToastStore` [V]); BL-931 done. The old conflict is closed: product ruled the windows are timed (CL-116 C-02). Note: PR #928 budget A-01 ("no time limit on an Undo") now contradicts that ruling; `ops` and `qa` correct A-01, it is not a gate here.

```
BRIEF BL-954 (Undo windows, one timed clock)      Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC (revised twice)
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When an Undo line is shown, its button works for the stated window (10 s, or until VoiceOver has finished the line plus 10 s, or with Switch Control until the parent moves on), and the toast removes the control and refuses Undo at the same moment, so no dead Undo stays on screen.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R38a, R38b, R38c; NS-06-A2b; NS-33-R15; ruling T4; CR-67 AX-11; CL-116 C-02. Cards 01, 06, 11.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R38a] Undo follows the VoiceOver rule        (fake timers: 10 s, or VoiceOver finish plus 10 s)
     [NS-01-R38b] no Undo control outlives its window    (fails today on #839: the toast stays after `attach.ts` refuses)
     [NS-01-R38c] Switch Control keeps Undo until the parent moves on
   Red on develop: no `createUndo`; on #839's head `attach.ts:8,41,50` keeps its own `expiresAt` while `toast.tsx:9-12` never times out an action toast.
   Mutants (catalogue B): fixed 10 s (R38a); leave the toast open after the ticket is refused (R38b); time out under Switch Control (R38c).

3. FILES  Touch: lib/photos/attach.ts (take the window from `createUndo`; no second `expiresAt`), the other Undo callers (PR 2 onward), tests.
   Never: components/ui/** (toast.tsx, toast.logic.ts: design-systems, row 33-3), packages/content (no new words), lib/find/**.
   Shared file rule: `attach.ts` is #839's file; `review.tsx` and `letter/[id].tsx` are also #838/#839 files.

4. READING PACK: CR-67 AX-11 (`RULINGS.md:662`); GAP-LOG CL-116 C-02 and C-07 (inputs branch 84bcf961); 11-foundations section 1.1 and the 33-3 row; docs/design/system COMPONENTS 2.14 toast; EX-14 (PR #921).

5. CODE ENTRY POINTS (develop 16e61549; #839 head f3b21698)
   apps/mobile/src/components/ui/toast.tsx:9-12        today an action toast never times out
   apps/mobile/src/components/ui/toast.logic.ts:58     `createToastStore` (where `createUndo` lands)
   #839: src/lib/photos/attach.ts:8,41,50,54            UNDO_WINDOW_MS, `expiresAt`, `undoPhotoChange`
   Callers: `grep -rlE "actionLabel|onAction" apps/mobile/src` lists 21 files at 16e61549; keep only those that pass an Undo action.

6. DATA AND SECURITY
   Data classes: none. New storage, send, log: none. Boundary: none. Privacy line: ids in memory only; no word logged.

7. LIBRARIES: none. No timer library; no animation.

8. BUDGETS (PR #928): A-01 as written ("no time limit") contradicts CL-116 C-02: do not gate on it; A-02-style checks: the control is removed and Undo refused in one step (unit).

9. ACCEPTANCE  Experience: EX-14 (PR #921); A-S12, B-S11. Test cases above. Done also means: each test red on old code and on its mutant; one clock only (a scan finds no second `expiresAt` in an undo path).

10. PR BREAKDOWN (each at most 400 lines and 20 files)
    PR 1: the photo caller and R38b test | about 120 lines | base develop after 33-3 and #839
    PR 2..n: other Undo callers in batches of at most 8 files | about 250 lines each | list the callers in PR 1's body

11. LENSES: A design-systems, B principal-architect (plan 2.4).

12. ORDER: after 33-3 and BL-931; before BL-956. Blocked by: 33-3.

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files (73 tests) red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: VoiceOver finishing the line, Switch Control scanning, AX5 stacking (JOURNEYS row 4.5, PR #925).

15. STOP AND ASK: 33-3 slips and #839 must merge first (G6 holds `EXPO_PUBLIC_PHOTOS` then); `toast.tsx` needs a change; RN exposes no Switch Control signal (record a finding, keep the row open).

16. HARNESS: claim row: NONE yet for BL-954; Karma adds it before the agent starts. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl954 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl954.md`. Branches `feat/mobile-bl-954-{1-photo-caller,2-callers}`. Comments start `<!-- agent:mobile -->`.
```
