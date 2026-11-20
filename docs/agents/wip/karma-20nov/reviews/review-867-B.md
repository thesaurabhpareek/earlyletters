## Review B at 922aa8a8564be19bd674b3f288ba6bd711a3f9f9: PASS WITH NOTES
<!-- agent:design-systems -->

Lens B (accessibility and design system). Two files: `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` (168 lines) and a 3-line check-in. Head pushed 11:28 UTC, more than 10 minutes before this review. CI on the head: every job finished green (`required`, tests and content rules, typecheck, database rules, Deno, migrations unchanged, agent team, compliance-fence). Merges clean with develop `21e0341a`; none of the cited files changed between `20553b18` and `21e0341a`.

Must fix: none.

What I checked:
- Against the locked card NS-33 (`11-foundations.md` at `450bcb4a`, rows R1, R2, R4, R9, R10; section 8 budgets) and design 11 on develop (`docs/tdd/new-scope/11-foundations.md` 3.1, 3.2, the 33-1 row, 8.2).
- Facts: 38 cites sampled, 37 hold, 1 partly false (finding 1). Held, read on `20553b18`: `app/letter/[id].tsx:162-163, 219-221, 331-344, 392, 398-400` and no heading in that file; `lib/transitions.logic.ts:53`; `card-transition.tsx:230-231, 300, 492-499`; `(tabs)/_layout.tsx:87, 91`; `strings.en.ts:63`; `settings/_layout.tsx:12, 40`; `book.tsx:353, 389-391, 393-401`; `test/tab-bar.test.ts:61`; `review.tsx:1170, 1196, 1212-1217, 1224, 937-955`; `screen-header.tsx:42-48`; `cover-band.tsx:104-113`; `toast.tsx:113-131`; `audio-player.tsx:166-168, 204`; `(tabs)/index.tsx:122, 248-251`; `draft-card.tsx:39-50`; `button.tsx:48 (shrink-0), 61, 198`; `transcript.tsx:151-160`; `lib/a11y.ts:29`; `text.tsx:95-108, 173`; `tokens.ts:218-255` caps; `components/platform/` holds blur-surface and toggle only; COMPONENTS 2.3 and 2.9 as F-1 and F-2 say. In node_modules: RN 0.86.3 `RCTAccessibilityManager.mm:271` (3.571), `accessibilityPropsConversions.h:84-86` (heading to Header) and `:100-108` (no tablist trait), `RCTViewComponentView.mm:1523-1538`; expo-router 57.0.24 `getHeaderTitle.js:4-9`, `HeaderTitle.js:10`, `Header.js:201`. #840 at `f811c9a6`: `photos-lens.tsx:25-27` is a `tablist` of Buttons with `selected`, selected drawn as the primary fill.
- Widths: I re-measured with opentype.js on `packages/design-tokens/fonts/Mukta-*.ttf` at 3.571. "Letter" 156 pt, "deleted." 206 pt, Undo label 130 pt plus `px-4` = 162 pt. They match.
- The R4 scan in 5.2, run by hand over the four routes and their one-level `@/components/` imports with comments removed: the only unguarded `numberOfLines` is `review.tsx:1224`, so "fails on develop at 1224" holds. `review.tsx:1196` is already guarded.
- Boundaries: no new word approved (one PROPOSED key, named as proposed); "Me" in the bar is the existing `tabs.you`; the cut choice is left to Karma and the founder. No constitution, privacy or review-gate change. P0 rows R1, R2, R4 each have a test design and a phone step.

Findings (most serious first):
1. Partly false fact (section 4, line 53): "Settings home draws no heading of its own, so the bar title is the screen's only heading." `ListSection` titles are headings (`list-row.tsx:35`, `Text ... asHeading`), and Settings home draws three of them (`app/settings/index.tsx:138, 152, 159`). The R2 fix is unaffected: the bar title is still the first heading. Reword to "the first heading". It does not send a builder the wrong way, so a note.
2. Lens (section 6) is the right pattern, with one thing to say plainly. On iOS the `radiogroup` and its `label` are silent: `radiogroup` maps to no trait, and the label sits on a View that is not an accessibility element (`choice-group.tsx:76-80`). What VoiceOver hears is each option: "Months, radio button, checked" and "Photos, radio button, unchecked" (`RCTViewComponentView.mm:1523-1538`). That meets R3's "single choice, selected stated" through the per-option "radio button", not through a group. Say so, so #840's test and V-walk do not claim the group label is heard. Also name the key as design 11 8.2 does (`photos.book.lens.groupA11y`, PROPOSED).
3. Voice Control and Switch Control (R9, R10). The spec's walks (V1, V2, X1) never turn either on, yet every R4 change here is a new layout for controls: Review's stacked fix row, the Book's stacked bar, the stacked toast, and the lens. `radio` also carries no Button trait on iOS (`accessibilityPropsConversions.h` has no radio trait; it falls to None). Add to X1, or hand to BL-984 (c) by name: with Voice Control "Show names", "Tap Photos", "Tap Months", "Tap Undo" and "Tap Close" work; with Switch Control item scanning, each changed control is reached once, in VoiceOver order. The fix row's label starts with its visible text (`review.tsx:1215`), so WCAG 2.5.3 holds.
4. Card test title. R4's title is `[NS-33-R4] AX5 on SE 3`. The spec's three R4 code tests are good guards, but none carries that title, and X1 has no title. Name the X1 record `[NS-33-R4] AX5 on SE 3` so the trace finds the device row.
5. Hard-coded caps (token gap, mine). The Book bar title's 1.3 (`book.tsx:396`) and "Aa" (`[id].tsx:340`) are `maxFontSizeMultiplier` literals in screens, not token caps (`headline` and `title2` tokens say null and 2.0). Section 2 calls this "chrome held at a token cap", and 5.3 keeps "cap unchanged at 1.3". Either propose a chrome cap token in section 8 (`packages/design-tokens/src/tokens.ts`, with its test) or say these two are exceptions. I take the token as a follow-up.
6. Section 8, 2.14 proposal is too narrow. COMPONENTS 2.14 today says `durationMs` "8000 if action", "10s with VoiceOver", and a `tone` prop. The code has none of these (`toast.tsx:10-12, 37-44, 70-77`: an action toast never times out, no timer while a screen reader runs, no `tone`). These are code facts, not Conflict E1 questions, so the 2.14 proposal should replace them too.
7. Review header (5.1, "passes by 13 pt"): by the spec's own numbers the two buttons' frames overlap at AX5 (only the words clear). That rests on advance widths without kerning. Make X1 tap Close at its leading edge and confirm it does not press Hear it.
8. Small: in section 3, `:230-231` and `:300` follow a `card-transition.tsx` cite but sit in a paragraph about the letter page file. Name the file.

On the questions asked:
- VoiceOver: R1 (first and only `asHeading={1}`, given RN sends no level) and R2 (delete line 91; the bar reads `title`) are right, and the R2 change is safer than design 11's `headerTitle: t.you`. The `tab-bar.test.ts:61` flip is correctly scoped.
- Dynamic Type to AX5: definitions, scan and verdicts hold in code. Letter text stays uncapped (D-027 scan line). The Book bar plan (two rows, controls 305 pt plus gaps inside 335 pt) is sound.
- Component proposals: consistent with `tokens.ts` caps, `Text` props, `Button` and `IconButton` sizes, and `ChoiceGroup` (48 pt, stacks from xxxLarge, fill, edge and check).

Format: ASCII only, 168 lines, card rows cited by id, no card text copied.

Not verified:
- Anything on a phone: V1, V2, X1, F-3, and whether VoiceOver speaks a heading level.
- Whether Voice Control and Switch Control act on a `radio` with no Button trait (finding 3).
- Widths beyond the four words I re-measured.

Reviewer: independent of the author (CR-44).
