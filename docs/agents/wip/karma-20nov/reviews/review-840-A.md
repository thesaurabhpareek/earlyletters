## Review A at 9a57d61395646d10a8853a3f560211a8e4cf3803: CHANGES
<!-- agent:design-systems -->

Lens A (design systems and accessibility): VoiceOver labels, traits, order and announcements; Dynamic Type to AX5; 44 pt targets; Reduce Motion; dark mode and contrast through tokens; Voice Control names; every word a content key; the picture never leading a person's words.
PR #840, photo slice 5 (BL-931, NS-01). Head 9a57d613 confirmed from the API, pushed 12:39 UTC. Base feat/mobile-photo-4c-letter-page at 2d3994e7.
Diff reviewed: `git diff 2d3994e7...9a57d613` (11 files, +288 -12).
Head movement (caption-ceiling round): my first pass was at f811c9a6. Since then bd45dc40 merges 4c (no combined diff, so no hand edits), and 9a57d613 is this slice's own change: `LensRow` (photos-lens.tsx:27-41) is now `ChoiceGroup layout="segmented"` with the group label `book.lens.label` ("Show letters by", PROPOSED, TODO(founder)), and photos-surfaces.test.ts gains `[NS-01-R10][NS-33-R3]`, which pins the radiogroup, the radios with `checked` and no tablist. I read it in full. It fixes the roles half of my first must-fix 1; book.tsx is unchanged, so the remount half and must-fix 2 stand.

The right pattern for the lens row, in one line (now built, except the last clause): one `ChoiceGroup layout="segmented"` from components/ui (role radiogroup with a content-key group label; Months and Photos as role radio with `accessibilityState.checked`; selection shown by fill, accent edge and check, never colour alone; stacks at large text), mounted once so VoiceOver keeps its place on the chosen option across the switch.

### What I read
- The PR body, and the whole diff: app/(tabs)/book.tsx, components/book/letter-card.tsx, components/photos/photos-lens.tsx, lib/photos/{hooks,lens}.ts, features/photos.en.ts and the four test files.
- The Book screen at the head around the change (book.tsx:250-520: the header, the cover band props, the SectionList, the inline bar and MonthsSheet), components/book/{cover-band,month-opener,chapters,letter-card.logic}.tsx/ts, book-page.logic.ts (`cardFooterStacks`), components/book/copy.ts (`monthsButton`), components/ui/choice-group.tsx, and the radio tests in leave-sheet.test.ts.
- CLAUDE.md content rules; packages/content VOICE.md and BRAND.md.
- Locked cards at 450bcb4a: 01-photo-with-a-letter.md (sections 3, 6, 8, 10, 15; rows R9a, R10a to R10c, R11, R12, R19, R20a to R20e, R21c, R23a, R23b, R41, R48, R53) and 11-foundations.md (NS-33 section 2 "The lens control in #840 must not announce itself as tabs", rows R3, R4, R9, R11; NS-34 section 3 scroll and memory budgets, R2). Pre-lock ids read through 17-engineering-project-plan.md section 1.1; that plan's row 9 records the tablist (M3).
- Design spec 01 sections 5, 7, 8; COMPONENTS.md ("SegmentedControl is served by ChoiceGroup layout segmented"; CoverBand, MonthsSheet and CardToPage rows).
- Read-only context: the product thread's drafts on docs/e2e-ux-20nov at 38a614ac (B-book-and-reading/DESIGN.md B-S03, B-J07; B-book-and-reading/WORDS.md sections 1 and 3). Not relied on as requirements.

### What I ran
In scratch worktrees: at f811c9a6 (first pass) apps/mobile photos-surfaces, photos-capture, navigation-one-entry and start-capture gave 68 of 69 (the one failure is the time limit of #838's AST scan, see #838 note N9); at this head with `--testTimeout=30000` the same four files give 72 of 72, including the new `[NS-33-R3]` test. packages/content photos-copy and rules: 140 of 140 at both. No device run.

### Findings

Must fix:

1. The lens switch throws away VoiceOver's place, so the new checked state is never spoken.
   - The roles are right at this head (photos-lens.tsx:29-40; ChoiceGroup gives radiogroup, radio and `checked`, and draws the choice by fill, accent edge and check). Good, and it retires the tablist that NS-33 section 2 ruled out.
   - But the switch still swaps the SectionList for a ScrollView (book.tsx:434-437 against book.tsx:460), and `header`, which holds the row (book.tsx:390), is rendered inside each. Each change unmounts the radio the parent just double-tapped and mounts a new one in another tree. VoiceOver loses its place (on iOS it usually jumps to the top of the screen) and never says "Photos, checked", so NS-33-R3 ("announces a single choice among options, with the selected one stated", P0 b) is not met in use, only in the source; the new test reads the source.
   - Fix: keep the row mounted. Draw the Photos lens through the same AnimatedSectionList with `photoChapters(chapters, lens.photos)` as its sections (this also virtualises the list for R53 and NS-34, and keeps the inline bar and MonthsSheet), or lift the row out of both lists. A source test can pin that `<LensRow` appears once and outside the branch that switches lists.

2. "Months" twice on one screen, and dead in Photos.
   - The cover band keeps its "Months" button (`bookCopy.monthsButton`, passed at book.tsx:375) in Photos, but `MonthsSheet` renders only in the list branch (book.tsx:499). In Photos a tap sets `monthsOpen` and nothing appears; switching back to Months then opens the sheet by itself, because `Sheet` presents when it mounts open (components/ui/sheet.tsx:106-112) (WCAG 2.2 SC 3.2.2).
   - With the lens on, two visible controls named "Months" with different jobs sit one above the other: the cover band's (go to a month) and the lens option (show every letter). "Tap Months" is ambiguous for Voice Control (NS-01-R20e, NS-33-R9) and the rotor reads two "Months" (SC 2.4.6).
   - Fix: hide the Months button while Photos shows (or make it work there), and give the two controls different names. `content` and the founder choose the words; the product thread's draft renames the button "Go to a month".

Notes:
- N1. R53 and NS-34 (not met, BL-932 and BL-956). The Photos page is a plain ScrollView (book.tsx:435) that draws every card at once, each decoding the stored copy (up to 4,032 px) into a 72 pt frame (photos-lens.tsx:58). With 300 pictures on an SE 3 this is the case NS-34 measures (no UI-thread frame over 16.7 ms while scrolling the Book) and NS-01 section 8 bounds (under 150 MB resident). The card holds the flag until R53. The SectionList route in must-fix 1 removes the eager render; list copies stay with BL-932.
- N2. `THUMB_PT = 72` (photos-lens.tsx:44) is a size typed into a component. Put it beside `THUMB_MAX_HEIGHT_PT` in lib/photos/surface.ts now; I will propose the three thumbnail sizes (160, 88, 72 pt) as tokens with their test.
- N3. The card's label is joined in code: `${label}. ${photo.label}` (letter-card.tsx:128). It matches spec 01 section 8's example and `cardLabel` already joins its parts with ". " (letter-card.logic.ts:32), so not blocking. It carries no count (R11).
- N4. `lensMode` stays 'photos' after the lens goes away (R12; book.tsx:340-343). When a new picture brings the lens back, the Book opens straight into Photos without the parent choosing it. Reset it to 'months' when `lensOn` turns false.
- N5. Lens cards are not inside `CardSource` (photos-lens.tsx:57-58), so opening one uses CardToPage's fade hand-off. That is fine, and right under Reduce Motion. Check that Back returns to the lens at the same place.
- N6. In Photos the inline bar (title, Months, the gear) never shows, because the ScrollView has no scroll handler; once scrolled, Settings is only at the top. The SectionList route fixes it.
- N7. Spec 01 section 7 asks a `swapMs` cross-fade for the lens switch; the switch is instant. R20d allows no motion, so not blocking.
- N8. Dark mode: the thumbnail's edge is the decorative `line` token (about 1.2:1 on surfaceRaised in dark); see #838 note N3, a token gap I own (R41, P2).
- N9. Good: the lens exists only while a kept, open letter has a picture, with no empty state, hint or count (lens.ts and its tests); a quiet day, a private letter, a deleted letter and a closed seal do not count; the month openers have no count line; each card is the Book's LetterCard, one VoiceOver element, with the thumbnail hidden (letter-card.tsx:137) and the photo label read after the card's own; at accessibility sizes the thumbnail moves above the words (`cardFooterStacks`, AX1 and up) and the date and From line stay whole; the words keep their ExcerptFade with the whole text in the element; no add or start control (R23b, tested); the lens options are 48 pt; colours come from the theme; `book.lens.label`, `book.lens.months` and `book.lens.photos` are PROPOSED with TODO(founder) and pass rules.test.ts and photos-copy.test.ts.
- N10. Tests: `[NS-33-R3]` now pins the roles. Nothing pins that the row stays mounted across the switch or the Months button in Photos; add with must-fix 1 and 2.
- N11. Words: "Show letters by" is heard before "Months" and "Photos" ("Show letters by, Months, radio button, checked"), which reads well. With must-fix 2, the lens option and the cover band button need different names; whichever one changes, the group label should still read naturally before it. For `content` and the founder.

### What only a phone can show (SE 3, Asha test install, D13)
- VoiceOver on the lens row: the group label, "radio button", "checked", "1 of 2"; and where focus lands after a switch (must-fix 1).
- Voice Control on the Book with the lens on: "Tap Months", "Tap Photos".
- The cover band's Months in Photos, then back in Months (must-fix 2).
- AX5 with Bold Text: the lens options wrapping or stacking; cards with the thumbnail above the words; the date and From line whole.
- The default size: the excerpt beside a 72 pt thumbnail, where its lines and fade end.
- Dark mode and Increase Contrast, and Differentiate Without Colour: the selected option by shape and check, not colour; the thumbnail edge.
- 300 pictures on an SE 3: scroll frames and memory (NS-34).
- Opening a card and coming Back.

CI at the head: PENDING_CI_LINE

Reviewer: independent of the author (CR-44).
