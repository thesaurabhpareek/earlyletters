# NS-22 Book header: the one-page delta for BL-938

Status: for the build of BL-938, 27 Nov 2026. Owner: `design-systems` (one Claude session, stream 9). Scope ruled by Karma in CR-231. The drawing of record is `docs/design/e2e/B-book-and-reading/DESIGN.md` B-S01 and B-S02, and its words are in `WORDS.md` sections 1 and 2. This page lists only what this build does differently from that drawing, and why. Nothing here was run on a phone.

## What the Book header is after this build

At the default size, in the cover band (built `CoverBand`):

- Row 1: the title. On the right, the trailing controls in this order: Go to a month (when there is more than one month to go to, as built; it is labelled "Months" while no lens is shown, and "Go to a month" with the lens, see item 6), then More for this book (`IconButton`, DotsThree glyph, 44 pt). The gear is gone (NS-22-R3, R6).
- Row 2: the age line.
- Row 3, two books only: the built `ChildSwitcher`. It still draws above the title, as built; only VoiceOver meets it third.
- Row 4: Read together, full width, as built.

Under the band: the lens choice (only while a lens other than Months exists), then the arrival and backup lines when present, then the first chapter.

The inline bar after scroll is the title, then Go to a month, then More for this book, then the compact month. The gear leaves the bar too.

At accessibility sizes the band stacks as built: title, age, switcher, Read together. Then the lens choice comes, then one trailing row that wraps, with Go to a month and More for this book. Every control is 44 pt or more: `Button` small is `tokens.target.min`, and `IconButton` is 44.

The VoiceOver order is meant to be the tree order at every size: title, age, switcher, Read together, lens choice, Go to a month, More for this book, the arrival line, then the list. This is not heard yet. At the default size the trailing controls are placed over the title row by absolute position, and iOS may sort VoiceOver by position on screen rather than by tree. If the device walk (row k) hears them before the age or the lens, the fallback is `experimental_accessibilityOrder` on the header view, which sets the order outright.

## Differences from B-S01 and B-S02, and why

1. **Find is not drawn.** On `develop` the Book has no Find control. BL-1558 mounts it behind `EXPO_PUBLIC_BOOK_SEARCH` and puts it before Go to a month. The order leaves that slot free, and no empty placeholder is drawn.
2. **The lens choice moves above the arrival and backup lines.** Before this build, the trailing controls sat in the band and the lens choice sat under the lines, so VoiceOver met Months and the gear before the lens. To keep the tree in the fixed order, the trailing controls are now placed over the title row from outside the band, and they come after the lens choice in the tree. The lines move under the lens choice, which matches B-S01's VoiceOver order (the new-phone line after More for this book).
3. **Go to a month does not fold into the menu at AX3.** NS-22 s5 says it "may" fold. The trailing row wraps instead, so it keeps its order and its 44 pt target (R2). Revisit only if R5 fails on the SE 3 at AX5.
4. **The menu is a sheet of rows** (built `Sheet` and `ListRow`, like the Months sheet), titled with the menu's own name. WORDS.md section 2 already draws it this way (gap G-03).
5. **The menu holds only built behaviour, in built words.**
   - Quiet this book, or Turn Quiet off on a quieted book (R7). It uses `setChildQuiet` and the built toasts, `children.quiet.quietedToast` and `offToast`. If the write throws, the book stays as it was and `children.quiet.saveFailed` shows once.
   - Hide this book, only when there are two or more books, the same as Me (`app/settings/children/[id].tsx`). It uses Me's confirm: title `children.settings.hideLabel`, body `hideBody`, then Cancel or Hide this book. After a hide, the Book opens the next shown book. No toast is added.
   - The rows are plain `ListRow`s with the built chevron and no glyph. B-S02 draws a Moon and an EyeSlash, which are left for later with the system menu (B G-03).
   - The rows take `ListRow`'s 44 pt minimum height; B-S02 draws them at 56 pt. They carry no hint, where B-S02 gives each a hint, because CR-231 adds no new words. Both are left for the next pass of B-S02.
   - With a co-parent, Me says hiding is only for you in the Hide section's footer (`children.settings.hideShared`, through `hideFooter`). The Book's confirm does not carry that line yet; DESIGN.md asks that nothing is shown to the other parent, and that holds, but this person is not told here that it is per person. Left for the founder's words pass.
   - If the hide throws, the Book shows the Quiet failure line, `children.quiet.saveFailed`, once. WORDS.md already gives this line for a failed Hide (B-S02.failed); Me has no failure line for Hide.
   - The Hide confirm is the system alert, so it stays up if the app goes to the background; only the sheet closes (item 10).
6. **Words not drawn here.** `children.quiet.help` stays held back (BL-985, `test/children-quiet-control.test.ts`). These are left for later: `book.menu.hideTitle`, `book.menu.hiddenToast`, `book.hiddenNote` and the hidden read-only route (B-S01.hiddenReadOnly, gap E-05), and the rename of "Months" to "Go to a month" without the lens.
7. **New words, PROPOSED for the founder.**
   - `book.menu.label` "More for this book": the button's name, and the sheet's title.
   - `book.menu.labelA11y` "Quiet or hide this book.": the hint, given only when Hide is offered. With one book there is no hint, because the menu then holds Quiet only.
8. **One PROPOSED line reworded.** `children.quiet.saveFailed` was "That did not save. {child}'s book is as it was." For a book with no name it read "your child's" at the start of a sentence (the NX-31-R3 test held it back for this). It now reads "That did not save, so {child}'s book is as it was." The meaning and the key are the same, and `WORDS.md` and `DESIGN.md` (B-S02.failed) are updated. It is still PROPOSED.
9. **Empty book (R4).** Title and age only, plus More for this book. Read together, the lens choice and Go to a month are absent, as built (B-S01.empty: Quiet and Hide apply to an empty book too).
10. **The menu closes when the app goes inactive.** Nothing changes without a tap (NS-22 s6, Interrupted).

## Settings after the gear (R6)

Me is one tap from any tab and is the Settings home (`app/(tabs)/you.tsx`). The `/settings` route stays, so a deep link still opens it. The Book has no control that pushes `/settings`.

## Device rows

- NS-22-R1: on the SE 3 at the default size, the first card's top edge is above the fold.
- NS-22-R5: at AX5 plus Bold Text, the first card is within one screen of scroll.
- The menu walk: 2 taps to Quiet, and 2 taps to the Hide confirm.

These stay on the device plan. The render test proves the order, the 44 pt targets and the empty-book header. It does not prove focus or scroll.
