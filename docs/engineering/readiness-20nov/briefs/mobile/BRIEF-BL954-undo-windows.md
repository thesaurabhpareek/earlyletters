Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:36 UTC).
Blocked until: BL-931 done (#839 carries the dead Undo, review N1). Conflict for product, not decided here (DESIGN-DELTA C-02 and C-07, PR #923): the e2e design draws timed windows (10 s; VoiceOver read plus 10 s; Switch Control until the parent moves on) with a native Switch Control probe, while TDD 11 decision 2 builds one clock, the toast's own dismissal, which never times out. Cards NS-01-R38a to R38c and NS-33-R15 are the rows; the card wins (CR-66). `components/ui/toast.tsx` belongs to design-systems: ask it for the helper's home before editing there.

```
BRIEF BL-954 (Undo windows)                       Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:36 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When an Undo line is shown, its button works for exactly the window the parent was told (10 s, or until VoiceOver finishes reading plus 10 s, or
   with Switch Control until the parent moves on), the toast and the action expire together, and no dead Undo ever stays on screen.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R38a, R38b, R38c; NS-06-A2b; NS-33-R15; ruling T4. Cards 01, 06, 11 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R38a] Undo follows the VoiceOver rule        (fake timers: 10 s, or VoiceOver finish plus 10 s)
     [NS-01-R38b] no Undo control outlives its window    (fails today)
     [NS-01-R38c] Switch Control keeps Undo until the parent moves on
   Red on develop at 16e61549: `createUndo` does not exist (no hit in `src/`); on #839's head `attach.ts` expires the ticket at `UNDO_WINDOW_MS` (lines 8, 41, 50) while
   the toast with an action never times out (`components/ui/toast.tsx:9-10`). Mutants (catalogue B): fixed 10 s (R38a); leave the toast open (R38b); time out under Switch Control (R38c).
   Budget A-01 (PR #928): a source scan fails on `expiresAt` in an undo path (unit, BLOCK).

3. FILES  Touch: a new `lib/undo/create-undo.ts` (pure, with an injected clock; about 300 lines per the plan with tests), `lib/photos/attach.ts` (use the helper), every other Undo caller
   (`grep -rn "Undo" apps/mobile/src` to list; the backlog says every undo in the app uses the helper), tests `undo.test.ts`, photos-surfaces.
   Never: components/ui/toast.tsx (design-systems; propose the one-line prop and ask), packages/content keys (no new words), lib/find/**.
   Shared file rule: `attach.ts` is #839's file: this lands after #839.

4. READING PACK: Pack 8 (NS-33, foundations; PR #917 part 2); 11-foundations section 1.1 (NS-33-R15); docs/design/system COMPONENTS 2.14 toast (branch docs/e2e-ux-20nov, 9e78eecd); EX-14 (PR #921).

5. CODE ENTRY POINTS (develop 16e61549; #839 head f3b21698)
   apps/mobile/src/components/ui/toast.tsx:9-12   action toast "never times out"; stays until Undo, Close, swipe down or the screen changes; no action leaves after durationMs (default 4 s), never while a screen reader runs
   #839: src/lib/photos/attach.ts:8,41,50,54      UNDO_WINDOW_MS, `expiresAt`, `undoPhotoChange`
   `AccessibilityInfo` for the VoiceOver finish and for Switch Control state: [U] which events RN exposes; verify before design (eval B s7).

6. DATA AND SECURITY
   Data classes: none. New storage, send, log: none. Boundary: none. Owner of the read: none. Privacy line: the undo helper holds ids in memory only; no word is logged.

7. LIBRARIES: none. React Native `AccessibilityInfo`; Reanimated is not needed (no animation). Do not add a timer library.

8. BUDGETS (PR #928): A-01 no time limit on an Undo or a toast with an action: the toast's own dismissal is the only clock (unit, BLOCK, design-systems). This brief and A-01 disagree on
   whether the button expires; the card says the window is stated. Send the question to product; build to the card rows above.

9. ACCEPTANCE  Experience: EX-14 (PR #921), A-S12 replace picture and Undo, B-S11; a11y acceptance (PR #922) rows for Switch Control. Test cases above. Done also means:
   each test red on old code and on its mutant; every existing Undo caller migrated or listed as a follow-up.

10. PR BREAKDOWN: PR 1 the helper and its tests (about 250 lines, base develop); PR 2 migrate callers (about 150). Branches `feat/mobile-bl-954-{1-helper,2-callers}`. Flag-off proof: photos callers run behind the flag; other callers need a test per caller.

11. LENSES: A design-systems, B principal-architect (plan 2.4).

12. ORDER: after BL-931; before BL-956 (large text relies on the toast stacking). Blocked by: product (C-02, C-07), BL-931.

13. DEFINITION OF DONE
    [ ] tests red on old code and on the three mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: VoiceOver finishing the line, Switch Control scanning, the Undo toast at AX5 (JOURNEYS row 4.5, PR #925; BL-929 sheet).

15. STOP AND ASK: product rules C-02 against the card; `toast.tsx` needs a change; RN does not expose a Switch Control signal (record a finding; keep the row open).

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl954 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl954.md`. Comments start `<!-- agent:mobile -->`.
```
