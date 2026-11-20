# ADR 0035: One age and calendar-month function, in `packages/core`

- **Status:** Proposed, 20 Nov 2026. CR-69 (`docs/agents/cto/RULINGS.md`) has no line on this subject; the rule is CODE-R13 (one definition of every domain fact, `docs/engineering/01-code-and-change.md`) applied to the duplication below. Marked [proposal], the shape comes from `docs/product/prd/24-engineering-handoff.md` section 2 (draft E). Docs only.
- **Author:** `mobile` with `principal-architect`. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026 (`next-id.mjs`). Warning: older design documents and CR-67 cite this number for another subject; read them through `docs/adr/CROSSWALK-new-scope.md`.

## Context

- `packages/core/src/age.ts` already owns `ageOn`, `chapterOf` and `dateline`.
- The phone has its own month arithmetic: `daysInMonth` and `monthDay` in `apps/mobile/src/lib/reminders/tz.ts:109,131` (the comment says it matches `ageOn`), and a different `monthDay` (a display formatter) in `apps/mobile/src/components/book/shelf.logic.ts:35`. A third copy is `monthStart` at `apps/mobile/src/components/book/chapters.ts:182`, with its own `daysIn` at `:178`; the handoff cite is right (checked 20 Nov 2026).
- The days and photo-moment work needs `dateOfAge` (the date a child reaches an age) and an instant-to-local-date helper.

## Decision (proposed)

1. **`packages/core/src/age.ts` owns both** the age-to-date direction (`dateOfAge`, clamped to the month's last day) and the instant-to-local-date helper, so `tz.ts` and `apps/mobile/src/components/book/chapters.ts` import them and their copies are deleted.
2. **Two named precisions,** for calendar days and for instants, never a bare `Date` argument.
3. **Pure TypeScript,** no platform import (CODE-R10); `DayLayer` and `DayTone` enums, when the days work needs them, are defined once in `packages/core/src/domain.ts` (CODE-R13).
4. **Tests:** the existing `ageOn` cases are the oracle; `dateOfAge` and `ageOn` round-trip across month ends, leap days and a 31st birth date.

## Consequences

- `tz.ts` and `chapters.ts` shrink; the planner imports one age function. The `shelf.logic.ts` `monthDay` is a name clash only and is not touched.
- The change is mobile and core code, not this ADR.
