# UndoRow

Owner: `design-systems`. Status: PROPOSED, not built. Sources: G-03, DC-6, EXP 5.7, PRD R54, R150, R158, 14.3. Shared rules: `README.md`.

## 1. Purpose
After a parent sets a card aside (Not now, or a card-menu verb), one quiet row says so and offers a way back. It never celebrates, never counts, never times out.

## 2. Where it lives
Mounted by the Moments tab, pinned above the tab bar, inside the tab's own view. Not the app `Toast`: `Toast` auto-places over every screen and a toast with an action also never times out, but its host is app-wide and a second set-aside must replace only this row. `UndoRow` reuses `Toast`'s announce and replace-in-place rules (COMPONENTS 2.14) and is a separate component. Open for `mobile`: if `Toast` can take a host scoped to one tab with the layout below, use it and drop this component (library first).

## 3. Anatomy
- Surface: `surface`, hairline `stroke.control` in `line` (`controlBorder` under Increase Contrast), radius `md`, no shadow. Width: full, less `layout.gutter` each side.
- One text line from `copy.moments.setAside` (PLACEHOLDER key, `content` owns the words) in `subhead`, `text`.
- One text button from `copy.moments.undo` (PLACEHOLDER) using `Button variant="quiet"`; at the trailing edge by default.
- Minimum height `target.min`; the button's hit area is at least `target.min` by `target.min`.
- Scroll content gets a bottom inset equal to the row height plus `space[2]` while the row shows, so the row never covers a card action.

## 4. States
| State | What shows |
|---|---|
| Hidden | Nothing; no inset |
| Shown | Row with the set-aside line and Undo |
| Replaced | A second set-aside swaps the words in place over `motion.swapMs`; Undo now returns only the latest card. Earlier ones are listed in Me with "Start again" (R54) |
| Undone | Row leaves over `motion.exitMs`; the card returns to its slot with `motion.enter` and the existing `tap` haptic |
| Left | Row leaves on a tab switch or on leaving the tab. Leaving never changes the effect of the set-aside |

It never times out and is dismissed by nothing but those events (C-4 in `README.md`: the "3 further taps" idea in G-03 is not specified because a tap count is a hidden timer).

## 5. Tokens
Colours `surface`, `line`, `controlBorder`, `text`, `focus`; `space[2]`, `layout.gutter`; `radius.md`; `stroke.control`; `target.min`; `motion.enter`, `motion.exitMs`, `motion.swapMs`, `motion.fadeMs`; haptic intent `tap`. No other value.

## 6. Dynamic Type
- Default to AX0 range: one line, button trailing, height `target.min` or the text's height if larger.
- From AX1: the button moves below the line, leading, full width, still `target.min` tall at least; the row grows taller, never clips.
- AX5: the line wraps to as many lines as it needs; no truncation; the inset follows the real measured height. L3 asserts the row does not cover Continue or Not now of the last card, which must be scrollable above it.

## 7. VoiceOver and order
- On arrival: the set-aside line is announced politely once (`announce()` on iOS); focus is not stolen.
- Reading order: the row sits after the content and before the tab bar. Line (static text, not a stop of its own when it is part of the button's group; otherwise one stop), then Undo.
- Undo's accessible name starts with its visible word; its hint says the result using a `content` key ("Back where it was" is the intent in EXP 5.7; PLACEHOLDER key `copy.moments.undoDone`). After Undo, that phrase is announced politely and focus moves to the restored card's information group.
- After a Not now with no Undo yet used, focus moves to the next card's heading, or the tab heading if it was the last card (EXP 5.7).
- Reachable by Switch Control and Full Keyboard Access with no gesture (R150).

## 8. Motion
Enter: `motion.enter` (8 pt rise, 280 ms), opacity only under Reduce Motion (`motion.fadeMs`). Exit: `motion.exitMs`. Never bounces, never a count, never a checkmark. A haptic accompanies a visible change only; nothing depends on it (Low Power Mode mutes it).

## 9. Targets
Row at least `target.min` tall; Undo at least `target.min` by `target.min`; 8 pt (`space[2]`) clear of the card action above it.

## 10. Test list
- UR-T1 L2: inset equals measured row height plus `space[2]` while shown, and is zero when hidden.
- UR-T2 L2: a second set-aside replaces the row (one row mounted, by count) and Undo restores only the latest card.
- UR-T3 L2: no timer exists: advance fake time by 10 minutes, the row is still there.
- UR-T4 L2: leaves on tab switch and on unmount; the set-aside effect is unchanged by leaving.
- UR-T5 L3: default and AX5, light and dark; the row stacks from AX1 and covers no card action.
- UR-T6 L4: accessible name starts with the visible word; announce is polite and fires once; focus lands on the restored card after Undo.
- UR-T7 L2: Reduce Motion gives a `motion.fadeMs` cross-fade, no translation.
- UR-T8 L1: no raw colour, size or duration in the file; no string literal (content keys only).
- UR-T9 L5: S1-23 walk with VoiceOver, Voice Control ("Tap Undo") and Switch Control.

## 11. Android later
Same code. Check TalkBack's polite live region reads the line once.
