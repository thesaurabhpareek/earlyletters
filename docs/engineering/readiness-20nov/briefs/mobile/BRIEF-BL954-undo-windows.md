Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked at develop `16e61549`, 20 Nov 19:04 UTC). REWRITTEN after review of #956 to follow CR-67 AX-11 (`RULINGS.md:662`): ONE undo clock, the toast's own dismissal, with `createUndo` in `apps/mobile/src/components/ui/toast.logic.ts`, owned by `design-systems` (11-foundations section table row 33-3: "`createUndo`, `progress-bar.tsx`, the 1.5 scans, about 300 lines"). This brief builds NO helper of its own and does not edit `components/ui/**`.
Blocked until: row 33-3 merged (design-systems; `createUndo` is not on develop: `toast.logic.ts` exports only `toastLayout`, `reduceToast`, `createToastStore` [V]); BL-931 done. Conflict for product, not decided here: card rows NS-01-R38a and R38c describe timed windows (10 s; VoiceOver plus 10 s; Switch Control until the parent moves on); AX-11 rules a single clock that never times out. Titles are kept; their assertions follow the ruling until product re-words the rows.

```
BRIEF BL-954 (Undo follows AX-11)                 Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC (revised after review)
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When an Undo line is shown, its button works for as long as the toast is on screen (the toast's own dismissal is the only clock), and no photo or other caller keeps a second deadline that can leave a dead Undo.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R38a, R38b, R38c; NS-06-A2b; NS-33-R15; ruling T4; CR-67 AX-11. Cards 01, 06, 11 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R38a] Undo follows the VoiceOver rule        (assert per AX-11: the line stays until dismissed; the VoiceOver read does not close it)
     [NS-01-R38b] no Undo control outlives its window    (fails today on #839: `attach.ts` expires the ticket, the toast stays)
     [NS-01-R38c] Switch Control keeps Undo until the parent moves on
   Red on develop: no `createUndo`; on #839's head `attach.ts:8,41,50` sets `expiresAt` from `UNDO_WINDOW_MS` while `toast.tsx:9-12` never times out an action toast.
   Mutants (catalogue B): fixed 10 s (R38a); leave the toast open after the ticket is refused (R38b); time out under Switch Control (R38c). Budget A-01 (PR #928): a scan fails on `expiresAt` in an undo path: this brief REMOVES it, so the brief passes A-01.

3. FILES  Touch: lib/photos/attach.ts (drop `expiresAt`; undo works while the toast shows), the Undo callers of the toast (PR 2 onward), tests.
   Never: components/ui/** (toast.tsx, toast.logic.ts: design-systems, row 33-3), packages/content (no new words), lib/find/**.
   Shared file rule: `attach.ts` is #839's file; `review.tsx` and `letter/[id].tsx` are also #838/#839 files.

4. READING PACK: CR-67 AX-11 (`RULINGS.md:662`); 11-foundations section 1.1 (NS-33-R15) and the 33-3 row; docs/design/system COMPONENTS 2.14 toast (branch docs/e2e-ux-20nov, 9e78eecd); EX-14 (PR #921).

5. CODE ENTRY POINTS (develop 16e61549; #839 head f3b21698)
   apps/mobile/src/components/ui/toast.tsx:9-12        an action toast never times out; stays until Undo, Close, swipe down or the screen changes
   apps/mobile/src/components/ui/toast.logic.ts:58     `createToastStore` (where `createUndo` lands)
   #839: src/lib/photos/attach.ts:8,41,50,54            UNDO_WINDOW_MS, `expiresAt`, `undoPhotoChange`
   Callers: `grep -rlE "actionLabel|onAction" apps/mobile/src` lists 21 files at 16e61549 (components/settings, asks, language-row, app/settings/*, review.tsx, letter/[id].tsx, family.tsx, book.tsx); keep only those that pass an Undo action.

6. DATA AND SECURITY
   Data classes: none. New storage, send, log: none. Boundary: none. Owner of the read: none. Privacy line: ids in memory only; no word logged.

7. LIBRARIES: none. Do not add a timer library; no animation (Reanimated not needed).

8. BUDGETS (PR #928): A-01 (unit, BLOCK, design-systems): no time limit on an Undo or a toast with an action: met by construction once `expiresAt` is gone.

9. ACCEPTANCE  Experience: EX-14 (PR #921); A-S12, B-S11. Test cases above. Done also means: each test red on old code and on its mutant; the scan finds no `expiresAt` in an undo path.

10. PR BREAKDOWN (each at most 400 lines and 20 files)
    PR 1: the photo caller, `attach.ts` and R38b test | about 120 lines | base develop after 33-3 and #839
    PR 2..n: other Undo callers in batches of at most 8 files | about 250 lines each | base develop; list the callers in PR 1's body
    Flag-off proof: photos callers run behind the flag; each other caller needs a test or its existing test stays green.

11. LENSES: A design-systems, B principal-architect (plan 2.4).

12. ORDER: after 33-3 and BL-931; before BL-956. Blocked by: 33-3, product (R38a/R38c wording).

13. DEFINITION OF DONE
    [ ] tests red on old code and on the three mutants; `npm test -w apps/mobile`: only the 8 baseline files (73 tests) red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: VoiceOver and Switch Control with the Undo toast; AX5 stacking (JOURNEYS row 4.5, PR #925; BL-929 sheet).

15. STOP AND ASK: 33-3 slips and #839 must merge first (G6 holds `EXPO_PUBLIC_PHOTOS` then); a caller needs a timed window; `toast.tsx` needs a change.

16. HARNESS: claim row: NONE yet for BL-954; Karma adds it before the agent starts. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl954 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl954.md`. Branches `feat/mobile-bl-954-{1-photo-caller,2-callers}`. Comments start `<!-- agent:mobile -->`.
```
