# ADR 0030: One notification budget: 60 pending in total, plan notices first, one chooser

- **Status:** Proposed, 20 Nov 2026. Decision lines marked [CR-69] are ruled in `docs/agents/cto/RULINGS.md` CR-69 A1 and `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`; marked [E] they are ruled in errata E13 (`docs/product/prd/18-errata-after-lock.md`). Docs only.
- **Author:** `mobile` (BL-966, the NS-46 stack), with `payments` for the plan-notice hook. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026 (`next-id.mjs`). Input C section 1.4 reserved 0032 for this subject and the design pack cites "eval C ADR 0032"; this file is that record, under the id `next-id.mjs` gave (CR-69 A11). Read "eval C ADR 0032" as 0030.
- **Supersedes:** the 64 reading in earlier design text and briefs, and BL-966's wording that plan notices sit "outside" a 60 budget.

## Context

- iOS keeps 64 pending local notifications. Today the evening planner caps at 60 (`apps/mobile/src/lib/reminders/planner.ts:295`, `maxNotifications ?? 60`) and the plan-notice scheduler adds up to 4 (`MAX_PLAN_NOTIFICATIONS`, `apps/mobile/src/lib/billing/plan-reminders.logic.ts:48`): 64 in all.
- `PlannedKind` is `'evening' | 'monthAge' | 'birthday'` (`planner.ts:111`). The one-a-day rule exists only as evening yielding to others and keys of the form `${kind}:${date}`, so two notes can land on one date.
- Errata E13: 60 pending in total, plan notices kept first within it.

## Decision

1. **`TOTAL_MAX = 60`, plan notices first, then the chooser.** The planner change lowers today's 60 plus 4. A test is written from this rule. [CR-69] A1, [E] E13.
2. **`budget.ts` is one file** (`apps/mobile/src/lib/reminders/budget.ts`, a new file) that holds the class registry and a pure `chooseOnePerDay(candidates, planNoticeCount)`. It is the only place the one-a-day rule and its order live. No React Native import (CODE-R10). [CR-69] A1.
3. **Ranks:** typed day 1, birthday 2, `libraryDay` 3 (inside the `typedDay` group, so no new class), month 4, evening 5. [CR-69] A1.
4. **`PlannedKind` gains a `group` field** so priority is data. [CR-69] A12 (handoff Q-E2 default: a group field, not a new class).
5. **The plan-notice scheduler gets a one-line re-plan hook**; owner `payments`. The two schedulers are not merged in this scope. [CR-69] A1.
6. **Notification payload stays `{ source, kind }` only** (`apps/mobile/src/lib/reminders/scheduler.ts:159`); ids are opaque. The day-name and privacy rules are ADR 0033.
7. **Not ruled in CR-69, carried from the handoff and cards as proposals:** the opaque identifier shape `el.day.<isoDate>`, a day-only gate beside `prefs.enabled`, and re-plan on `subscribeDays` (card NS-46-R29 to R33; handoff draft A2). Q-E1 (rework #758 into `budget.ts`) takes its default under CR-69 A12.

## Consequences

- One test: no local date holds two budgeted notes, with two books and a birthday and a month note on one date.
- A far-dated `libraryDay` is the first dropped when the ceiling bites; the cards accept that.
- Owner of the planner change: `mobile`.
