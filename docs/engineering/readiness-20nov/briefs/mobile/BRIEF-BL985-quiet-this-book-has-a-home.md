Re-open every file:line before relying on it. This brief was filled by `product` on 21 Nov 2026 from the backlog row and the locked cards only: no code file was opened, so every code cite below is NOT VERIFIED and field 3 and field 5 name areas, not lines. `mobile` fills in the lines before the PR opens.
Blocked until: nothing (the plan marks BL-985 ready). The planner already reads a quiet book (#901, #902 per the readiness map); this row adds the control only.

```
BRIEF BL-985 (Quiet this book has a home (F12-REQ-011, NS-22))    Filled by: product for Karma, 21 Nov 2026 (card rows read at rev 2; code NOT read)
Agent: mobile   Lane: Wave 1   Wave: 1

1. GOAL: When a parent opens Me and then a book's page, a Quiet control sits beside Hide, and turning it on quiets that book (the existing `setChildQuiet`), with no new words unless `content` supplies keys.

2. CARD ROWS and TEST TITLES
   Rows: F12-REQ-011 (P0); NS-22-R5 to NS-22-R7 (card 10, all P1 and in the same PR where cheap): `[NS-22-R5] first letter near at AX5` (device), `[NS-22-R6] settings still reachable`, `[NS-22-R7] unquiet offered` (a quieted book's end menu offers Unquiet and no other wording changes).
   Red on old code: the book's page in Me does not render a Quiet control (BL-985 "Fails on old code").

3. FILES  Touch: the Me book page under `apps/mobile/src/` [U], using the existing keys; `setChildQuiet` exists in `store.ts` (BL-985 says line 390; NOT VERIFIED). Never: `packages/content` new words without `content`, `supabase/**`.

4. READING PACK: BL-985 and BL-948 in `docs/BACKLOG.md`; card 10 NS-22; F12-REQ-011 in the function file that holds it (`git grep -n F12-REQ-011 docs`).

5. CODE ENTRY POINTS: NOT VERIFIED. `mobile` lists them first.

6. DATA AND SECURITY: no new storage; the control writes the existing quiet flag. No child name in a log or event.

7. LIBRARIES: none new.

8. BUDGETS: none given by a card.

9. ACCEPTANCE: the test that Me, under the book's page, renders the Quiet control passes; BL-948 has its device row.

10. PR BREAKDOWN: one PR (size S); branch `feat/mobile-bl-985-quiet-control`.

11. LENSES: A principal-architect, B per the plan 2.4 row for this id.
12. ORDER: any time in Wave 1; BL-948 owns the device row. Blocked by: nothing.
13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile` shows no new red file; ASCII only; no typed words or child name in a log
    [ ] labels agent:mobile, from:agent; journal PATCHed; check-in line committed
14. ONLY A PHONE CAN PROVE: the control on a real phone with VoiceOver and at AX5 (NS-22-R5).
15. STOP AND ASK: a card row and the code disagree; a new word is needed (content owns the key, the founder approves); the row needs a file outside the list in field 3.
16. HARNESS: claim row: NONE yet; Karma adds it before the agent starts. Check-in `docs/agents/checkins/mobile-bl985.md`.
```
