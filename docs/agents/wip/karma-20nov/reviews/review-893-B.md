## Review B at 73a5556c994632fb156a405ed1754c9b26ad1916: PASS WITH NOTES
<!-- agent:design-systems -->

Lens B: accessibility and the design system. BL-928 slice (c): Review's fix row and the NS-33-R4 code scan. Read against the spec on develop (`docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md`, section 1, then sections 2, 5.1 and 5.2) and the locked card NS-33 at 450bcb4a (`docs/product/prd/11-foundations.md:265`).

Must fix: none.

### What I checked
- Head 73a5556c, committed 11:49 UTC. Read live at 12:34 and unchanged, so more than 10 minutes old.
- CI at the head:
  - `required`, `tests and content rules`, `typecheck`, `database rules`, `edge functions` and `install` all succeeded.
  - One duplicate `compliance-fence` run was cancelled. Its sibling succeeded.
  - The iOS simulator build was skipped.
  - `store-profile Release launch` is still queued. It is not part of `required`.
- I ran the tests in a detached worktree at the head, using the head's own workspace packages: `a11y-ax5`, `review-critics` and `review-write` gave 68 of 68.
- Dynamic Type (`app/review.tsx:1212-1255`):
  - The switch is `useIsAccessibilitySize()`, AX1 and up (`lib/a11y.ts:29`; `ax1: 1.786` in `a11y.logic.ts`). It is the same switch Review's view control uses (`:1170`), so the screen changes at one size.
  - At accessibility sizes, the row is a column. The label (`flex-1`, so it wraps) and the chevron share the first line. The detail follows at full width with no line limit, so the parent's words wrap whole.
  - `footnote` and `labelSmall` are uncapped (`packages/design-tokens/src/tokens.ts:201, 206`; `maxScale` null). At AX5 the words are 50 pt and wrap, rather than shrinking or ending in an ellipsis. That meets D-027.
  - A struck detail keeps its line-through, and the row label still says what kind of fix it is, so the strike is not the only signal.
  - A `mark` row draws no empty line.
- Below accessibility sizes, nothing changes. Element by element against develop `:1219-1228`:
  - the Pressable's class string is the same;
  - the label `Text` is the same;
  - the detail is still `footnote`, `flex-1`, `numberOfLines={1}`, with the same strike;
  - the chevron is the same.
  The full detail is still in the row's label, as COMPONENTS 2.3 says.
- VoiceOver: one `Pressable` at every size. The role, label (`label, detail`), hint, `expanded` state and testID are unchanged lines (`:1228-1234`). The new inner `View` sits inside an accessible Pressable, so it is not a separate stop. VoiceOver hears the same words at every size.
- Voice Control: the name is the label. It begins with the visible label text at every size and has not changed.
- 44 pt: `min-h-12` (48 pt) is on both class branches, and the row is full width.
  - In the stacked branch that minimum does real work. A `mark` row at exactly AX1 is one `labelSmall` line (20 x 1.786 = 35.7 pt) plus `py-1` (8 pt), which is 43.7 pt without it.
- Tokens and the design system: no new colour, size or duration. The chevron's `size={16}` and `c.textMuted` were already there, and they match the count row's chevron (`:1093`). The classes come from the shared spacing scale. No shared component changes.
- The R4 scan:
  - It does what spec 5.2 asks: size-gated `numberOfLines` only; no `adjustsFontSizeToFit`, `ellipsizeMode` or `allowFontScaling={false}`; no cap on `letterBody` or `signature`.
  - The 44 pt guard does too.
  - No object-style `numberOfLines:` exists anywhere in `src` at the head, so the JSX-only regex misses nothing today.
- Cites held: 11 of 11.
  - Develop `review.tsx:1212-1217`, `:1219-1228` and `:1224`.
  - `review.tsx:1170`, `lib/a11y.ts:29` and the 1.786 threshold.
  - `button.tsx:61` (Button `sm` is `min-h-11`, 44 pt) and `:198` (IconButton `md` is 44 pt).
  - The two type tokens.
  - `pendingCopy.review.editA11yHint`.
  - `design-system-gaps.test.ts` as the Button minimum pin, per Review A.

### Findings
1. Note, answering the lead's question on Review A's test gaps. None of them is a must-fix in lens B. The code is right at the head. Spec 5.2's test design (the scan) is met. The phone walk X1 is the proof of R4. Ranked by what they protect:
   - **The stacked minimum height matters most.** It holds a `mark` row at AX1 above 44 pt (see above). Assert that the stacked class string carries `min-h-12`.
   - **The role and the hint** are unchanged lines, and they are unpinned on develop too. Pin them anyway, because the test comment promises them: `accessibilityRole="button"` and `accessibilityHint={pendingCopy.review.editA11yHint}`.
2. Note. The stacked layout itself is not pinned. On a copy of the head, each of these mutations passes all 68 tests:
   - the stacked Pressable keeps `flex-row`, so the unlimited words are squeezed beside the label and words split, which is truncation under spec section 2;
   - `accessible={stacked ? false : undefined}`, so VoiceOver hears the label and the words as separate stops at AX sizes;
   - the stacked label set to `shrink-0`;
   - `maxFontSizeMultiplier={1}` on the detail, which caps the parent's words.
   With Review A's note 2 (the words dropped from the stacked branch), the fix-row test checks less than its title says. Suggested lines for the next touch:
   - the stacked class has no `flex-row`;
   - the stacked branch renders `words`;
   - the Pressable sets no `accessible={false}`;
   - the detail `Text` sets no `maxFontSizeMultiplier`.
3. Note. The spec (5.1) and the PR body give the change detail as "gonna -> going to". The copy is `rowChange: "{a} to {b}"` (`packages/content/src/strings.en.ts:359`), so the row reads "gonna to going to". The two are about the same width, so the 369 pt finding stands. Fix the example on the spec's next touch.
4. Note, for TRACE and not for this PR. R4 stays open for the Book's inline bar (BL-928 (d), after #798) and for the toast (#877). The PR body says "Review's part". A green `[NS-33-R4]` scan is not R4 done. The device row `[NS-33-R4] AX5 on SE 3` (X1) is.

### Not verified
- X1 at AX5 on an SE 3, in light and dark: the words wrapping whole, the chevron beside the label, and one VoiceOver stop. These need a phone.
- Rendering. Every test here reads source text. Nothing loads React Native.

Reviewer: independent of the author (CR-44).
