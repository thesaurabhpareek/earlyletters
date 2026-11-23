Re-open every file:line before relying on it. This brief was filled by `product` on 21 Nov 2026 from the backlog row and the locked cards only: no code file was opened, so every code cite below is NOT VERIFIED and field 3 and field 5 name areas, not lines. `mobile` fills in the lines before the PR opens.
Blocked until: nothing for the registry itself. #721 (the day-zero card) must be reconciled in the same PR or superseded first: ask Karma which.

```
BRIEF BL-963 (Home slips: one registry, one fixed order (FRAME-SLIP))    Filled by: product for Karma, 21 Nov 2026 (card rows read at rev 2; code NOT read)
Agent: mobile   Lane: Wave 1   Wave: 1

1. GOAL: When Home renders, one registry decides which single slip shows, in this fixed order: (1) the existing waiting cards in their existing order, (2) the seal-opened line on its day, (3) Save a copy in the birthday week, (4) one past letter. At most one slip shows. A slip type that is not in the registry fails a test.

2. CARD ROWS and TEST TITLES
   Rows: `[FRAME-SLIP]` (`docs/product/prd/00-product-frame.md`, slip order); NS-23-R6, NS-23-R18; the NS-11 slip rows.
   Titles (exact, from card 10): `[NS-23-R6] slip order`, `[NS-23-R18] slip registry`, `[FRAME-SLIP]` (register the title the frame gives).
   Red on old code: a stub slip that is not registered renders on Home and the registry test fails. The reminder ask sheet and the Plus line are not slips (BL-963 scope); the photo start belongs to the capture cluster.

3. FILES  Touch: the Home screen's slip code under `apps/mobile/src/` (find it with `git grep -n slip apps/mobile/src` [U]) and one new registry module beside it; the #721 day-zero card (leaves #721). Never: `packages/content` words, `supabase/**`, `lib/find/**`.

4. READING PACK: `docs/product/prd/00-product-frame.md`; card 10 NS-23 rows; BL-963 in `docs/BACKLOG.md`; later rows that add slips: BL-942, BL-946, BL-1014 (the days slip, NS-50 rank 2b) register into this registry, so keep the registry open to them.

5. CODE ENTRY POINTS: NOT VERIFIED. `mobile` lists them first.

6. DATA AND SECURITY: no new storage, send or log. A slip may name a past letter; it never reaches a log or an event. The registry holds ids, not words.

7. LIBRARIES: none new.

8. BUDGETS: Home must not render slower; the registry is a pure ordered list (no budget number is given by a card; do not invent one).

9. ACCEPTANCE: the three titles above pass; a registry with the stub slip removed passes; a stub added without registering fails.

10. PR BREAKDOWN: one PR, small (the plan marks BL-963 size S); branch `feat/mobile-bl-963-home-slip-registry`.

11. LENSES: A principal-architect, B per the plan 2.4 row for this id.
12. ORDER: first in Wave 1 for slips: BL-942, BL-946 and BL-1014 depend on it (readiness map). Blocked by: nothing but the #721 decision.
13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile` shows no new red file; ASCII only; no typed words or child name in a log
    [ ] labels agent:mobile, from:agent; journal PATCHed; check-in line committed
14. ONLY A PHONE CAN PROVE: Home on a real phone shows one slip, in order, across a birthday week and a seal day.
15. STOP AND ASK: a card row and the code disagree; a new word is needed (content owns the key, the founder approves); the row needs a file outside the list in field 3.
16. HARNESS: claim row: NONE yet; Karma adds it before the agent starts. Check-in `docs/agents/checkins/mobile-bl963.md`.
```
