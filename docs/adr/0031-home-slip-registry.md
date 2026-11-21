# ADR 0031: The Home slip registry: a closed, ordered list, at most one slip

- **Status:** Proposed, 20 Nov 2026. [E] marks a decision ruled in errata E36 (`docs/product/prd/18-errata-after-lock.md`); [CR-69] marks one ruled in `docs/agents/cto/RULINGS.md` CR-69 A12 (Q-E11 follows E36). The rest is a proposal from the cards (NS-50-R5) and `docs/product/prd/24-engineering-handoff.md` draft A3. Docs only.
- **Author:** `mobile` with `design-systems` (BL-963). Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026. Input C section 1.4 reserved 0033 for this subject and the design pack cites "eval C ADR 0033"; this file is that record, under the id `next-id.mjs` gave (CR-69 A11). Full table: `docs/adr/CROSSWALK-new-scope.md`. Read "eval C ADR 0033" as 0031. Warning: the design pack also cites "eval C ADR 0031" for "one phone, two accounts" (`[X4-R1]`). That is a different subject, is not filed here, and is not this file.

## Context

- `apps/mobile/src/app/(tabs)/index.tsx:317-330` renders every waiting draft as a `DraftCard` (or one `HeldRow`), else the resurfaced card (the `resurfaced(...)` call is at `:210`). No `SlipCard` or `FRAME-SLIP` exists in code (grep, 20 Nov 2026: docs only).
- Cards 08 and 10 list four slips; NS-50-R5 and the frame list six, with ranks 2b (a day the parent chose, today) and 3b (the Days ask).

## Decision

1. **Slips are a closed, ordered data registry** read by a pure `chooseSlip(state, today)`: (1) waiting set, (2) seal opened, (2b) a day the parent chose, today, (3) Save a copy, (3b) the Days ask, (4) one past letter. At most one renders. [E] E36.
2. **An unregistered type throws in development and test**, and the `[FRAME-SLIP]` source check fails the build.
3. **Absent ranks are allowed**, so 2b and 3b can ship before ranks 2 and 3 exist (BL-963 depends on NS-06 and NS-11 for those).
4. **Slip ranks are fixed by E36**, not left to engineering. [CR-69] A12 (Q-E11).
5. **The day slip is one-way:** it reads the days module read-only and shows a day only when it is today. "Not today" stores a date value, never a day id. [Handoff draft A3, NS-50-R2 to R4; proposal.]
6. **The Days ask joins `lib/asks/next-ask.logic.ts`** and counts as that day's ask. [Handoff draft A3, NS-50; proposal.]
7. No count and no list of slips is ever shown (source check).

## Consequences

- The registry is the one place Home order lives; a new slip is one registry row and one test.
- Whether a library moment (NS-51) is a slip rank, a capture-cluster item or both is open. [Proposal, not ruled] CR-69 A12 says E36 fixes the slip ranks, and E36 has no library-moment row, so this ADR adds none; handoff Q-E11 recommends one rank, shown once, never a strip, for Karma to rule.
