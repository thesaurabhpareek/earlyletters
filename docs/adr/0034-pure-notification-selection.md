# ADR 0034: Notification wording is chosen by a pure function of the cell and the slot

- **Status:** Proposed, 20 Nov 2026. CR-69 (`docs/agents/cto/RULINGS.md`) has no line on this subject. The decision is the card's: NS-48-R1 and NS-48-R2 and review item RV-14 (`docs/product/prd/GAP-LOG.md`), which win over engineering text (CR-66). Anything marked [proposal] is from `docs/product/prd/24-engineering-handoff.md` section 1.4. Docs only.
- **Author:** `mobile` with `content`. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026 (`next-id.mjs`).

## Context

- The evening note rotates eight variants by `ordinal % VARIANTS`, where `VARIANTS = en.notifications.evening.length` (`apps/mobile/src/lib/reminders/planner.ts`, 20 Nov 2026 tree), and the plan signature (`planSignature`) is compared on re-plan to avoid churn.
- A "last chosen key" in settings would make the same inputs give different plans.

## Decision

1. **`selectNotificationKey(cell, slotOrdinal)`** lives in `packages/core/src/notification-key.ts` (a new file; none exists today) and is pure: no clock, no storage, no randomness (CODE-R10). [NS-48-R1; file name is a handoff proposal.]
2. **The variant is a function of the cell and `slotOrdinal(date, weekdays)`;** the "last chosen key" setting is removed, so a re-plan on the same inputs gives an identical `planSignature`. [RV-14]
3. **The planner takes a `select` seam,** so tests inject a floor-only selector. [NS-48-R2]
4. **The payload stays `{ source, kind }`:** no key or variant in `data`, `identifier`, `threadIdentifier` or `categoryIdentifier` (NS-48-R31; ADR 0033).
5. **Drop A is words only** (day-part filter, weekday tone, the built eight re-keyed); recency and last-letter layers are a later drop and need an indexed `lastMadeLetter()` query first. [proposal]

## Consequences

- Tests: determinism, every key exists, no orphan key, the set of (id, date, time, class) is identical with the catalogue on or off.
- Content rules coverage for the new key families is a separate change (`packages/content` is CODEOWNERS-owned).
