# MonthList (the "Earlier" row and the month screen)

Owner: `design-systems`. Status: PROPOSED, not built. Sources: G-07, R210, R186, A1-R12. Shared rules: `README.md`.

## 1. Purpose
Recent shows the newest 14 qualifying days (ASSUMED, tuned at the card sort). One quiet row, "Earlier", follows them and opens a plain screen of months, newest first. A month opens the same day cards under one heading. Finite list, then a door, by design (R210). No count anywhere.

## 2. Anatomy
Two parts:
1. `EarlierRow`: a `ListRow` text row at the foot of Recent. Title from `copy.moments.earlier` (PLACEHOLDER key). A pressable row shows a chevron (the `ListRow` rule), so the destination is not a mystery. No number, no count of days, no subtitle with digits.
2. `MonthList` screen: pushed in the tab's stack with the platform back control (`BackButton`; no custom chrome). One heading (the same content key as the row, as a heading level 1). Under it one `ListRow` per month that has qualifying days, newest first. Each row's title is the month and the year only, in the parent's locale (`Intl` month names, a pure function of the date and locale, like R16's label). No count, no "days", no digits other than the year.
3. `MonthDays`: choosing a month pushes one screen with that month as the heading and the same `MomentCard` family under it (see `06-day-card.md`). Same states as Recent.

## 3. States
| State | What shows |
|---|---|
| Reading | A flat paper tile where rows will go (A1-R12). No spinner, no shimmer, no pull to refresh |
| Ready | Rows as above |
| One month only | The row list still shows (one row); no special case, no apology |
| None earlier | The `EarlierRow` is absent. No "nothing earlier" line |
| Limited access (ACC-3) | Built from the chosen set only; no message about it (R75, R287). The ACC-3 foot rows are specified in `08-door-row.md` |
| Access lost while open | The tab re-reads on foreground (R77); this screen closes to the tab with no message |

## 4. Tokens
`ListRow` and `ListSection` as built; colours `text`, `textMuted`, `line`, `bg`; `layout.gutter`; `layout.listRowMin`; `target.min`, `target.primary`; `Text` variants `title2` (heading), `callout` or `body` (row title). Hairline between rows is `line`. No raw value.

## 5. Dynamic Type
- Default: row height at least `layout.listRowMin`, one line.
- AX1 and above: single column, rows grow, the month and year wrap (never truncate), minimum height `target.primary` (G-07 says 56; README token gap: `listRowMin` is 52).
- AX5 with Bold Text on an iPhone SE 3: the heading may wrap to three lines at `title2`'s cap; rows keep a `target.min` target 8 pt apart; the chevron stays at the trailing edge, or below the title if the title needs the width.

## 6. VoiceOver and order
- The screen has one heading, read first; focus lands on it on arrival.
- Each row is one element: name is the month and year, role button ("March 2026, button" is the intent in G-07). The hint, if any, comes from a `content` key and differs per screen, not the same hint on every row (the `MonthsSheet` departure noted in COMPONENTS).
- The `EarlierRow` is one element after the last Recent card; its name is the visible word.
- Back is the platform's; focus returns to the `EarlierRow` on back.

## 7. Motion
Push and pop are the platform's (MOTION 5l). Under Reduce Motion the platform follows the system. Our own change (rows arriving after a read) is a `motion.fadeMs` cross-fade, no stagger past `motion.staggerMax`. Choosing a month is a push, never an animated scroll.

## 8. Targets
Every row at least `target.min` tall and full width; rows are contiguous with a `line` hairline, so adjacent hit areas touch only by design as in every `ListSection` (rows are the one exception to 8 pt spacing, as elsewhere in the app).

## 9. Words
All from `packages/content`: the row and heading key (PLACEHOLDER `copy.moments.earlier`), the reading line if any. No new copy here.

## 10. Test list
- ML-T1 L0: the row title builder returns month and year only, for 12 months in `en` and two other locales; no digit other than the four-digit year.
- ML-T2 L2: newest first; one row per month with qualifying days; absent `EarlierRow` when there is no day older than the 14.
- ML-T3 L2: no count, number of days or "found" word anywhere in the tree (a content-rule test reused from `rules.test.ts`).
- ML-T4 L3: default and AX5, light and dark, iPhone SE 3 and 16; at AX5 nothing truncates.
- ML-T5 L4: one heading; each row named "<month> <year>"; focus returns to the `EarlierRow` on back.
- ML-T6 L2: Reduce Motion gives a `motion.fadeMs` fade; no pull-to-refresh handler is mounted (R156).
- ML-T7 L2: access lost while open closes to the tab (R77).
- ML-T8 L1: no raw value, no string literal.
- ML-T9 L5: fling Recent on an iPhone SE 3 with no frame over 16.7 ms (DM-12).

## 11. Android later
Same code; `Intl` month names need the Hermes `Intl` check on Android.
