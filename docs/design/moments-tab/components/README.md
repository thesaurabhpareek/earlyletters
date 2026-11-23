# Moments component specs: index, shared rules, token gaps and open conflicts

Owner: `design-systems`. Written 21 Nov 2026 from `docs/design/moments-design-closure.md` (DC-1 to DC-8, G-01 to G-10) and `docs/product/prd/28-moments-tab.md` (NS-53), with `docs/product/moments-tab/EXPERIENCE-AND-MOTION.md` (EXP). Status of every file here: PROPOSED. Nothing is built, nothing was run on a phone, and no accessibility claim follows from these files (R293). Where a spec needs a phone, the device row is named (DM-nn, G5, G7, S1-23).

## Components

| # | Spec | Component (proposed name) | Closure and PRD rows |
|---|---|---|---|
| 1 | `01-undo-row.md` | `UndoRow` | G-03, DC-6, EXP 5.7, R54, R150, R158 |
| 2 | `02-month-list.md` | `MonthList` (the "Earlier" row and the month screen) | G-07, R210 |
| 3 | `03-enlarge-close.md` | `EnlargeViewer` with its enlarged `Close` | G-10, R276, R208, R154, D7 |
| 4 | `04-privacy-cover-moments.md` | `PrivacyCover` reuse, `MomentsCoverGate` and the focused-route signal | G-01, DC-5, R102, R232, EXP 4.7 |
| 5 | `05-ask-card.md` | `PermissionAsk` (ask card and primer) | G-04, G-05, R71, R73, R218, DC-6 |
| 6 | `06-day-card.md` | `MomentCard` and `DayCollage` | G-02, G-04, DC-6, R186, R211, R212, R214 |
| 7 | `07-picker-bars.md` | `PICKER_BARS` and the `PickHostSheet` frame | DC-2, EXP 4.2 to 4.9, R269, R293 |
| 8 | `08-door-row.md` | `DoorRow` | DC-1, R270, R287, EXP 2.2 |

Each entry in `docs/design/COMPONENTS.md` section 2.27 to 2.34 is a short summary that points here. The older convention (one spec inside COMPONENTS.md, screens in `docs/design/screens/`) is kept for the summary; the full spec is a file here because eight specs with test lists would bury the rest of COMPONENTS.md.

## Rules that hold for every spec here

1. Words. Every string is a `packages/content` key. The closure and PRD give intents only. Key names written as `copy.moments.<x>` below are PLACEHOLDER names for `content` to create or rename; they are not copy. No file here writes a user-facing word. Where a visible label is named for Voice Control (G-04), it is the key's value at build time, never a literal in a screen.
2. Tokens only. Colour, size, spacing, radius, stroke and duration are token names from `packages/design-tokens/src/tokens.ts`: colours `bg`, `surface`, `surfaceRaised`, `text`, `textMuted`, `accent`, `accentSoft`, `line`, `controlBorder`, `mediaFrame`, `focus`, `scrim`, `glassFallback`, `caution`; `space[n]`; `layout.gutter`; `target.min` (44) and `target.primary` (56); `radius.sm|md|lg|xl|pill`; `stroke.control|selected|focus`; `motion.enter`, `motion.fadeMs`, `motion.exitMs`, `motion.swapMs`, `motion.standard`, `motion.staggerMs`, `motion.press`; `Text` variants. No raw number in a screen. A number in a spec that has no token is listed under "Token gaps" below.
3. Dynamic Type. Layouts switch at AX1 (`useIsAccessibilitySize`), reflow at AX5 (about 3.571 times the base size, R211), text never truncates (D-027), caps come only from `tokens.type[*].maxScale` through `Text`. Fixed-size artwork (tray thumbnails 44 pt, the duration mark) does not scale; the words around it do.
4. VoiceOver. One heading first on a screen or sheet; reading order equals visual order; every control's accessible name starts with its visible label (WCAG 2.5.3); no gesture without a visible button (R150, R156); colour is never the only signal; focus goes to a named place after every change.
5. Reduce Motion is read only through `useMotion()`. Every movement has a 200 ms (`motion.fadeMs`) cross-fade form. Reduce Transparency uses `glassFallback`; Increase Contrast uses `controlBorder` and the `mediaFrame` override. Controls never animate in (MOTION principle 2).
6. Touch targets: `target.min` at least, 8 pt (`space[2]`) apart (PRD 15).
7. Nothing in these components counts, ranks or praises: no count, gap word, streak, point, badge, "best", or machine-made title (R11).
8. Tests use layers L0 unit, L1 scan, L2 component, L3 baseline (iPhone SE 3 and iPhone 16, light and dark, default and AX5), L4 audit, L5 device. Fixtures are the fictional family Asha. Test ids are local to each file.
9. No analytics event is added by any component here (DC-8, O-38, O-49 stay No).
10. Android later: same code unless a spec says otherwise; TalkBack, maximum font size and animator scale 0 are device checks. Moments is iOS first.

## Token gaps found while writing (for `design-systems` to close in `tokens.ts` with tests; none is changed by this PR)

| Gap | Where it bites | Proposal |
|---|---|---|
| `motion.carry` { ms: 320 } is approved (DC-3, O-58). CLOSED: it is in `tokens.ts` with its test (the design-tokens PR for the Moments motion spec) | The Start hand-off flight; `07-picker-bars.md` refers to it | Done. The stepped `carryPlan` timeline test stays with `mobile`'s flight PR (motion spec 6.2 item 2) |
| No 48 pt action height; EXP 2.3 and G-02 ask for 48 with 44 as the floor | Card actions, `06-day-card.md` | `target.action: 48` (web keeps `target.web`), or use `space[10]` and say so; `design-systems` decides at the story screen |
| `layout.listRowMin` is 52; G-07 and G-08 say 56 | Month rows, Me rows | Use `target.primary` (56) as the AX5 minimum; leave 52 for default size; confirm |
| `sheetTitle` (title2 at `maxScale` 1.4) is named in EXP 12 and absent from `tokens.ts` | Host sheet heading at AX1 and above | Add as a type role with a test |
| No named `UndoRow` or enlarge-close metrics | `01`, `03` | None needed: composed from `target.min`, `space`, `layout.gutter`; listed so nobody adds raw values |

## Awaiting a Chief Design Officer ruling (not in `tokens.ts`; nothing below was invented)

Three gaps above are design choices, not decided values, so the tokens PR does not add them. Each needs a CDesO ruling first; `design-systems` then adds the token and its test in one small PR.

| Gap | Ruling needed | Recommendation from `design-systems` |
|---|---|---|
| `target.action` (48 pt) | Is there one 48 pt action height, with 44 (`target.min`) as the floor? | Yes: add `target.action: 48` for card actions. It is above the 44 floor, below the 56 primary, and gives the day card actions a named value instead of `space[10]`. Web keeps `target.web`. |
| `layout.listRowMin` 52 against 56 (G-07, G-08) | Which minimum do month rows and Me rows use? | Keep 52 for default size and use `target.primary` (56) as the minimum from AX1 up, as the table above proposes. If the CDesO prefers 56 everywhere, change `listRowMin` itself and re-run the baselines, because Me rows move too. |
| `sheetTitle` (title2, `maxScale` 1.4) | Is it a new type role, and at which cap? | Add it as a type role at `maxScale` 1.4 as EXP 12 names it, with a test that the cap is at most the `title2` cap and that it is not truncated at AX5 (D-027). |

## Conflicts between source texts, and the call this folder makes (each is a one-line row edit for `product` or a decision for the founder)

| # | Conflict | Call made here | Who closes it |
|---|---|---|---|
| C-1 | R211 says the card is "a single target" and the More button moves into the menu at AX1; DC-6 strikes R211's single-target clause and G-04 sets four stops a card including a menu button | DC-6 and G-04 win (the closure is later and ruled). The menu button stays a visible button at every size | `product` edits R211 |
| C-2 | R71 says "the pinned ask bar shows up to XL text"; EXP 2.2 and PRD 8.2 put the ask card inline below the real cards; G-06 wants the ask card's buttons visible after at most one real card | Inline in the scroll, never pinned, at every size; the pinned bar is not specified. If `product` keeps R71 the spec adds a pinned form capped at 25 percent of the screen (PRD 15) | `product` |
| C-3 | DC-2 says `PICKER_BARS` default `bottom-hidden` (Layout B) and also "C is the shipped fallback today"; PRD 14.1 lists A first, then B, then C | The constant ships at `none` (Layout C, buildable today, no device row needed) until DM-02 and DM-11 pass; then it moves to `bottom-hidden`. `both-hidden` only on DM-02's explicit pass | `mobile`, with DM results |
| C-4 | G-03 says the Undo row leaves "on 3 further taps elsewhere ASSUMED"; EXP 5.7 and PRD say Undo never times out | The row never times out. It leaves on Undo, on a second set-aside (replaced), on a tab switch or on leaving the tab; the "3 taps" rule is NOT specified because a tap count is a hidden timer. Flagged back to CDesO | CDesO |
| C-5 | The task text lists "Not this one in the menu with Undo" under the ask card; in DC-6 that menu belongs to the day card | Specified on `MomentCard`. The ask card has one Not now (R73) and no menu | none, noted |
| C-6 | `PrivacyCover` lives in `components/app-lock/`; its own header says it moves to `components/ui/` on hand-off to `design-systems` | Spec assumes it moves (mobile does the move, one file, one import path); no behaviour change | `mobile` |
| C-7 | `coverShown(s)` returns `s.enabled && (s.locked || s.phase !== 'active')`: no cover with the lock off. R232 says follow the lock; R102 says cover with or without it | DC-5 (founder) and G-01: scoped cover, R102 wins | already ruled |
