## Review B at 57e368bd3e297a04c67e70288a2f90c4b01e7674: PASS WITH NOTES
<!-- agent:design-systems -->

Lens B (accessibility and design system). Three files: `apps/mobile/src/components/ui/toast.tsx` (+28 -19), `toast.logic.ts` (+10), new `apps/mobile/test/toast-large-text.test.ts` (52 lines). Head pushed 11:28 UTC, more than 10 minutes before this review. CI on the head: `required`, tests and content rules, typecheck, database rules, Deno, migrations unchanged, B-8 seam and native-files all green; iOS simulator build skipped (no native change); one duplicate compliance-fence run cancelled beside a green one; "store-profile Release launch" still queued at 11:41 UTC (not part of `required`). Merges clean with develop `21e0341a`; `toast.tsx`, `toast.logic.ts` and `lib/a11y*` are unchanged since `20553b18`.

Must fix: none.

What I checked:
- Spec #867 sections 5.1 and 5.4 against the diff: stacked from AX1, words full width, then one row at the end with Undo (when there is an action) then Close, both 44 pt; below AX1 nothing changes. It matches.
- Layout at every size. Below AX1 the class string, the `flex-1` on the words and the control JSX are the same as develop (`toast.tsx:113-131` on `20553b18`), so the row form is unchanged. From AX1 the box is a column (no `flex-row`, so children stretch), the words lose `flex-1`, and the controls sit in `flex-row flex-wrap items-center justify-end gap-2`. The threshold is `isAccessibilitySize` (1.786, `lib/a11y.logic.ts:16-17`), the same as `useIsAccessibilitySize()` and every other switch in the spec. `useFontScale()` reads `useWindowDimensions().fontScale`, so a size change while a toast shows re-lays it out.
- Widths, re-measured with opentype.js on `packages/design-tokens/fonts/Mukta-Regular.ttf` at callout 17 pt x 3.571: "Letter" 156 pt, "deleted." 206 pt. Stacked on an SE 3 the words get 375 - 24 (insets) - 28 (`pl-5 pr-2`) = 323 pt, so every word of the Book's toasts fits ("Letter deleted.", "Back in {child}'s book.", "Mark removed.", "Moved to {label}."). The controls row needs 162 + 8 + 44 = 214 pt, inside 323.
- Hit targets: Undo is `Button size="sm"` (`min-h-11`, `button.tsx:61`; shrink-0 at `:48`) and Close is `IconButton size="md"` (44 pt, `:198`), in both forms. Nothing reaches 44 pt only through `hitSlop`.
- VoiceOver order: words, then a plain (non-accessible) View holding Undo then Close, so the order is words, Undo, Close in both forms. The announcement (`:67`), no timer with an action or a screen reader (`:70-77`), swipe, replace and `onDismiss` are untouched. Labels unchanged: `action.label` and `copy.common.closeButton`, so Voice Control's "Tap Undo" and "Tap Close" are as before.
- Reduce Motion: `motion.enter`, `motion.exit`, `SWAP_IN` and `SWAP_OUT` are untouched, and the row-to-stack switch is a plain re-layout with no animation.
- Tokens only: no colour, size or duration literal added; spacing is from the class scale (`gap-1`, `py-3`, `gap-2`); colours stay `bg-foreground`, `tone="inverse"`, `c.bg`.
- Test: 4 tests under `[NS-33-R4] the toast stacks at accessibility sizes`, the title spec 5.1 names. They import `toastLayout`, which does not exist on develop, so all 4 fail there. They pass in CI on this head.
- Facts: 14 cites sampled (PR body, test header, code comment), 14 hold.

Findings (most serious first):
1. Long words still split, outside R4's four screens. The stacked column is 323 pt at AX5 on an SE 3. "Notifications" measures 329 pt, so a reminders toast that starts with it would still split. On the Book, a long child name in "Back in {child}'s book." could do the same. R4 covers the four screens and Asha, so this is not a gate. Note it in COMPONENTS 2.14 when the proposal lands: the words wrap at word breaks; a single word wider than the box still breaks.
2. Stacked padding is lopsided: the words keep `pr-2` (8 pt) on the right against `pl-5` (20 pt) on the left, which was there for the Close button in the row form. In the stacked form, add right padding to the words (for example `pr-3` on the `Text`) so they do not run to 8 pt from the edge. Visual only; check it in the X1 walk, light and dark.
3. COMPONENTS 2.14 is not updated here (the claim on #855 keeps `COMPONENTS.md` out). The line is a proposal in #867 section 8. Make sure it lands with or after this PR, or the spec says one thing and the code another (standing duty 3).
4. The tests read class strings exactly, so a harmless class change will fail them. That matches the repo pattern (`test/write-footer-large-text.test.ts`), so fine for now.
5. PR body: "at every Apple size" means the five sizes in `FONT_SCALE` (large, xxxLarge, AX1, AX3, AX5), not all twelve. The rule is one threshold, so the claim holds in effect; say "at the five sizes in FONT_SCALE".

Format: ASCII only, comments in plain sentences, no new words.

Not verified:
- Anything on a phone: the X1 walk (delete a letter at AX5 on an SE 3, read the toast on the Book, light and dark, VoiceOver on and off), and whether the taller toast covers the Book's inline bar or its tab bar offset.
- I did not run the suite locally; I rely on CI's green "tests and content rules" and typecheck on this head.

Reviewer: independent of the author (CR-44).
