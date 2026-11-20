## Review A at f811c9a61def4bdabb136ee3a7b9279ec030fb27: CHANGES
<!-- agent:design-systems -->

Lens A (design systems and accessibility): VoiceOver labels, traits, order and announcements; Dynamic Type to AX5; 44 pt targets; Reduce Motion; dark mode and contrast through tokens; Voice Control names; every word a content key; the picture never leading a person's words.
PR #840, photo slice 5 (BL-931, NS-01). Head f811c9a6 confirmed from the API, pushed 05:26 UTC. Base feat/mobile-photo-4c-letter-page at 279ba898.
Diff reviewed: `git diff 279ba898...f811c9a6` (11 files, +257 -12).
Head movement: the last commits (f811c9a6, cc94d0d3, b5eb5b8a) are merges of 4c. Against the previous head cc94d0d3 this PR's own delta is unchanged apart from hunk offsets. Merges only.

The right pattern for the lens row, in one line: one `ChoiceGroup layout="segmented"` from components/ui (role radiogroup with a content-key group label; Months and Photos as role radio with `accessibilityState.checked`; selection shown by fill, accent edge and check, never colour alone; stacks at large text), mounted once so VoiceOver keeps its place on the chosen option across the switch.

### What I read
- The PR body, and the whole diff: app/(tabs)/book.tsx, components/book/letter-card.tsx, components/photos/photos-lens.tsx, lib/photos/{hooks,lens}.ts, features/photos.en.ts and the four test files.
- The Book screen at the head around the change (book.tsx:250-520: the header, the cover band props, the SectionList, the inline bar and MonthsSheet), components/book/{cover-band,month-opener,chapters,letter-card.logic}.tsx/ts, book-page.logic.ts (`cardFooterStacks`), components/book/copy.ts (`monthsButton`), components/ui/choice-group.tsx, and the radio tests in leave-sheet.test.ts.
- CLAUDE.md content rules; packages/content VOICE.md and BRAND.md.
- Locked cards at 450bcb4a: 01-photo-with-a-letter.md (sections 3, 6, 8, 10, 15; rows R9a, R10a to R10c, R11, R12, R19, R20a to R20e, R21c, R23a, R23b, R41, R48, R53) and 11-foundations.md (NS-33 section 2 "The lens control in #840 must not announce itself as tabs", rows R3, R4, R9, R11; NS-34 section 3 scroll and memory budgets, R2). Pre-lock ids read through 17-engineering-project-plan.md section 1.1; that plan's row 9 records the tablist (M3).
- Design spec 01 sections 5, 7, 8; COMPONENTS.md ("SegmentedControl is served by ChoiceGroup layout segmented"; CoverBand, MonthsSheet and CardToPage rows).
- Read-only context: the product thread's drafts on docs/e2e-ux-20nov at 38a614ac (B-book-and-reading/DESIGN.md B-S03, B-J07; B-book-and-reading/WORDS.md sections 1 and 3). Not relied on as requirements.

### What I ran
In a scratch worktree at this head: apps/mobile photos-surfaces, photos-capture, navigation-one-entry and start-capture (68 of 69 pass; the one failure is the time limit of #838's AST scan, see #838 note N9; with a 30 s limit photos-surfaces passes 19 of 19) and packages/content photos-copy and rules (140 of 140). No device run.

### Findings

Must fix:

1. The lens row is a tab list of Buttons, and the switch throws away VoiceOver's place.
   - photos-lens.tsx:25-27: the container is `accessibilityRole="tablist"`, the options are `Button`s (role button) with `accessibilityState.selected`, and the chosen one is drawn as a primary accent fill against a quiet one.
   - NS-33-R3 (P0 b) asks VoiceOver to announce a single choice among options with the selected one stated; NS-33 section 2 says this control "must not announce itself as tabs"; NS-01-R48 asks radio semantics through `ChoiceGroup` or `ChipGroup`. The primary fill also makes the switch the loudest thing under the cover band, which the Book keeps as its one lit object (COMPONENTS CoverBand row).
   - The switch swaps the SectionList for a ScrollView (book.tsx:434-437 against book.tsx:460), and `header`, which holds the row, is rendered inside each. Every change destroys the focused option and makes a new one, so VoiceOver loses its place and never speaks the new checked state: R3 cannot pass even with radio roles.
   - Fix: the pattern above, with a group label as a new key (PROPOSED; the product thread's draft has `en.book.lens.groupA11y`, "Show letters by"); `testID="book.lens"` keeps `book.lens.months` and `book.lens.photos`. Keep the row mounted: draw the Photos lens through the same AnimatedSectionList with `photoChapters(chapters, lens.photos)` as its sections (this also virtualises the list for R53 and NS-34, and keeps the inline bar), or lift the row out of both lists. Add a `[NS-33-R3][NS-01-R48]` test in the style of leave-sheet.test.ts: a radiogroup with a label, radios with `checked`, no `tablist`.

2. "Months" twice on one screen, and dead in Photos.
   - The cover band keeps its "Months" button (`bookCopy.monthsButton`, passed at book.tsx:375) in Photos, but `MonthsSheet` renders only in the list branch (book.tsx:499). In Photos a tap sets `monthsOpen` and nothing appears; switching back to Months then opens the sheet by itself, because `Sheet` presents when it mounts open (components/ui/sheet.tsx:106-112) (WCAG 2.2 SC 3.2.2).
   - With the lens on, two visible controls named "Months" with different jobs sit one above the other: the cover band's (go to a month) and the lens option (show every letter). "Tap Months" is ambiguous for Voice Control (NS-01-R20e, NS-33-R9) and the rotor reads two "Months" (SC 2.4.6).
   - Fix: hide the Months button while Photos shows (or make it work there), and give the two controls different names. `content` and the founder choose the words; the product thread's draft renames the button "Go to a month".

Notes:
- N1. R53 and NS-34 (not met, BL-932 and BL-956). The Photos page is a plain ScrollView (book.tsx:435) that draws every card at once, each decoding the stored copy (up to 4,032 px) into a 72 pt frame (photos-lens.tsx:47). With 300 pictures on an SE 3 this is the case NS-34 measures (no UI-thread frame over 16.7 ms while scrolling the Book) and NS-01 section 8 bounds (under 150 MB resident). The card holds the flag until R53. The SectionList route in must-fix 1 removes the eager render; list copies stay with BL-932.
- N2. `THUMB_PT = 72` (photos-lens.tsx:33) is a size typed into a component. Put it beside `THUMB_MAX_HEIGHT_PT` in lib/photos/surface.ts now; I will propose the three thumbnail sizes (160, 88, 72 pt) as tokens with their test.
- N3. The card's label is joined in code: `${label}. ${photo.label}` (letter-card.tsx:128). It matches spec 01 section 8's example and `cardLabel` already joins its parts with ". " (letter-card.logic.ts:32), so not blocking. It carries no count (R11).
- N4. `lensMode` stays 'photos' after the lens goes away (R12; book.tsx:340-343). When a new picture brings the lens back, the Book opens straight into Photos without the parent choosing it. Reset it to 'months' when `lensOn` turns false.
- N5. Lens cards are not inside `CardSource` (photos-lens.tsx:46-47), so opening one uses CardToPage's fade hand-off. That is fine, and right under Reduce Motion. Check that Back returns to the lens at the same place.
- N6. In Photos the inline bar (title, Months, the gear) never shows, because the ScrollView has no scroll handler; once scrolled, Settings is only at the top. The SectionList route fixes it.
- N7. Spec 01 section 7 asks a `swapMs` cross-fade for the lens switch; the switch is instant. R20d allows no motion, so not blocking.
- N8. Dark mode: the thumbnail's edge is the decorative `line` token (about 1.2:1 on surfaceRaised in dark); see #838 note N3, a token gap I own (R41, P2).
- N9. Good: the lens exists only while a kept, open letter has a picture, with no empty state, hint or count (lens.ts and its tests); a quiet day, a private letter, a deleted letter and a closed seal do not count; the month openers have no count line; each card is the Book's LetterCard, one VoiceOver element, with the thumbnail hidden (letter-card.tsx:137) and the photo label read after the card's own; at accessibility sizes the thumbnail moves above the words (`cardFooterStacks`, AX1 and up) and the date and From line stay whole; the words keep their ExcerptFade with the whole text in the element; no add or start control (R23b, tested); the lens options are 48 pt; colours come from the theme; `book.lens.months` and `book.lens.photos` are PROPOSED with TODO(founder) and pass rules.test.ts and photos-copy.test.ts.
- N10. Tests: nothing pins the lens row's roles or the Months button in Photos. Add with must-fix 1 and 2.

### What only a phone can show (SE 3, Asha test install, D13)
- VoiceOver on the lens row, before and after the fix: what it announces (at this head likely a tab bar and "button, selected"), and where focus lands after a switch.
- Voice Control on the Book with the lens on: "Tap Months", "Tap Photos".
- The cover band's Months in Photos, then back in Months (must-fix 2).
- AX5 with Bold Text: the lens options wrapping or stacking; cards with the thumbnail above the words; the date and From line whole.
- The default size: the excerpt beside a 72 pt thumbnail, where its lines and fade end.
- Dark mode and Increase Contrast, and Differentiate Without Colour: the selected option by shape and check, not colour; the thumbnail edge.
- 300 pictures on an SE 3: scroll frames and memory (NS-34).
- Opening a card and coming Back.

CI at the head: PENDING_CI_LINE

Reviewer: independent of the author (CR-44).
