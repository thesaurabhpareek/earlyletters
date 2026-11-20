# ADR 0033: Notification privacy: one neutral category, an allowlist for identifiers and payloads, day names behind a local switch

- **Status:** Proposed, 20 Nov 2026. CR-69 (`docs/agents/cto/RULINGS.md`) does not rule this ADR's decisions; it rules only the store behind them (A4, ADR 0032) and lists "the neutral lock-screen body beside a day name" as not decided (A13). So every line below is a proposal taken from `docs/product/prd/24-engineering-handoff.md` section 2 (draft C) and the cards, and the wording a parent reads stays PROPOSED content for `content`, `privacy` and the founder (handoff Q-E7, CR-69 A12). Docs only.
- **Author:** `mobile` with `privacy` and `security`. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026 (`next-id.mjs`).

## Context

- A lock-screen notification is readable by anyone who holds the phone. A day a family marks (a faith or a tradition) is sensitive (L4 under ADR 0032).
- No notification category exists in code and `previewPlaceholder` is unbuilt (grep `previewPlaceholder|setNotificationCategoryAsync` over `apps/mobile/src`, 20 Nov 2026: no match).
- Today a scheduled note's payload is `{ source, kind }` and its identifier is `p.id` (`apps/mobile/src/lib/reminders/scheduler.ts:154,159`); the allowlist is by convention, not by test.
- `lockScreenNamesOn()` in `apps/mobile/src/lib/reminders/prefs.ts` returns the stored value again when App lock turns off; the cards forbid copying that for day names.

## Decision (proposed)

1. **Every scheduled note carries a notification category** with one neutral `previewPlaceholder`. The category id contains no `:` and no `-`.
2. **One neutral title and one neutral body per tone,** each existing once (NS-46-R37). A day's name never appears in `identifier`, `threadIdentifier`, `categoryIdentifier` or `data`.
3. **Identifiers and payloads are an allowlist:** `{ source, kind }` only; the identifier is opaque (shape in ADR 0030). A source check fails on any other key (NS-46-R32, NS-48-R31).
4. **Day names sit behind `notifications.dayNames`,** a local switch, default off, forced off while App lock is on, and its stored value cleared when forced off so it cannot return when App lock turns off (NS-47-R12).
5. **A `publicTitleOk` allowlist** marks the only day titles that may ever be shown by name; it lives in the days data (`packages/content/src/days/`, card 21 section 10).
6. **Delivered day notes are dismissed at sign-out** (the `scheduler.ts:336-339` pattern), and the days file is cleared first (ADR 0032).
7. The remote flag `flags.lockScreenNamesDefault` is not a path to day names (ADR 0029 item 7).

## Consequences

- Tests: category present on every note; payload allowlist; switch forced off under App lock and the stored value cleared.
- The neutral body wording beside a day name is open (CR-69 A13) and is not written here.
- `docs/legal/app-store-privacy-labels.md` and `docs/legal/DATA_CLASSIFICATION.md` change with the build, by the founder.
