# ADR 0033: Notification privacy: one neutral category, an allowlist for identifiers and payloads, day names behind a local switch

- **Status:** Proposed, 20 Nov 2026. CR-69 (`docs/agents/cto/RULINGS.md`) does not rule this ADR's decisions; it rules only the store behind them (A4, ADR 0032), and its A13 left "the neutral lock-screen body beside a day name" open. Errata E45 (`docs/product/prd/18-errata-after-lock.md`) has since ruled that body and the switch scope (items 2 and 4 below). Every other line is a proposal taken from `docs/product/prd/24-engineering-handoff.md` section 2 (draft C) and the cards, and the wording a parent reads stays PROPOSED content for `content`, `privacy` and the founder (CR-69 A12). Docs only.
- **Author:** `mobile` with `privacy` and `security`. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026 (`next-id.mjs`). Warning: older design documents and CR-67 cite this number for another subject; read them through `docs/adr/CROSSWALK-new-scope.md`.

## Context

- A lock-screen notification is readable by anyone who holds the phone. A day a family marks (a faith or a tradition) is sensitive (L4 under ADR 0032).
- No notification category exists in code and `previewPlaceholder` is unbuilt (grep `previewPlaceholder|setNotificationCategoryAsync` over `apps/mobile/src`, 20 Nov 2026: no match).
- Today a scheduled note's payload is `{ source, kind }` and its identifier is `p.id` (`apps/mobile/src/lib/reminders/scheduler.ts:154,159`); the allowlist is by convention, not by test.
- `lockScreenNamesOn()` in `apps/mobile/src/lib/reminders/prefs.ts` returns the stored value again when App lock turns off; the cards forbid copying that for day names.

## Decision (proposed)

1. **Every scheduled note carries a notification category** with one neutral `previewPlaceholder`. The category id contains no `:` and no `-`.
2. **One neutral title and one neutral body per tone,** each existing once (NS-46-R37). [E] E45(a): the neutral lock-screen body for a title that holds a day name is one fixed string with no `{child}` in any switch state, under the PROPOSED key `days.lock.body.neutral`; wording stays with `content`. A day's name never appears in `identifier`, `threadIdentifier`, `categoryIdentifier` or `data`.
3. **Identifiers and payloads are an allowlist:** `{ source, kind }` only; the identifier is opaque (shape in ADR 0030). A source check fails on any other key (NS-46-R32, NS-48-R31).
4. **Day names sit behind `notifications.dayNames`,** a local switch, default off, forced off while App lock is on, and its stored value cleared when forced off so it cannot return when App lock turns off (NS-47-R12). [E] E45(b): all day words, ticked or typed, follow this switch.
5. **A `publicTitleOk` allowlist** marks the only day titles that may ever be shown by name; it lives in the days data (`packages/content/src/days/`, card 21 section 10).
6. **Delivered day notes are dismissed at sign-out and at Erase everything** (the dismiss loop at `scheduler.ts:338-340`), and the days file is cleared first (ADR 0032).
7. The remote flag `flags.lockScreenNamesDefault` is not a path to day names (ADR 0029 item 7).

## Requirements stated as proposals

- **Consent lines (PRIV-R21, COORDINATION section 10).** Day names on the lock screen are something a person agrees to, so the PR that adds `notifications.dayNames` carries Shown, Records, Never and Decline lines. Records is a local setting only: nothing goes to analytics, a log, a crash report or a push payload.
- **Erase everything dismisses delivered day notes too,** by the same `getPresentedNotificationsAsync` pattern as sign-out (`scheduler.ts:338-340`), after the days file is deleted (ADR 0032 item 3).
- **The allowlist test is named in the first PR that schedules a day note.** It checks `identifier`, `threadIdentifier`, `categoryIdentifier` and `data` for the day, typed-day, birthday and month sources (E45(b): typed-day words follow `notifications.dayNames`), and has a positive control: a note carrying a day name must fail it (CHECKS-AND-BALANCES C-09; C-06 is the seed-before-erase rule for the Erase test; both binding under CR-69 A10).

## Open notes

- CR-69 A12 uses the label "Q-E7" for the parent-read wording line; in `docs/product/prd/24-engineering-handoff.md` section 5, Q-E7 is the 366 versus 92 day horizon. The label mismatch is for Karma.

## Consequences

- Tests: category present on every note; the allowlist test above; switch forced off under App lock and the stored value cleared; Erase dismisses delivered day notes (seeded first, per C-06); no `{child}` appears in any lock-screen string in any switch state, and the R38 test stays P0 (E45(a)).
- The neutral body wording is not written here: E45(a) fixes its shape (one fixed string, no `{child}`) and `content` writes it.
- `docs/legal/app-store-privacy-labels.md` and `docs/legal/DATA_CLASSIFICATION.md` change with the build, by the founder.
