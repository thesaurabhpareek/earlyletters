# The Book page: screen spec

Owner: `design-systems`. Status: written 9 Nov 2026 from the code at develop `6cd2223b` (the redesign is PR #674: BL-659 option b, BL-660, BL-675, BL-676). Not run on a device. What only a phone can show is marked **Device** and has a row in S1-151 or S1-153 (`docs/qa/DEVICE_TEST_PLAN.md`).

How to read this file:
- **Built** is what the code does. **Spec** is what the screen should do; every place the build differs is in section 11 with file and line.
- **PROPOSED** is a proposal waiting for the person named. **OPEN (owner)** is a design decision nobody has made yet. Words marked PROPOSED WORDING are the founder's to approve.
- File and line numbers are at `6cd2223b`. Paths start at `apps/mobile/src/` unless they start with `packages/` or `docs/`.

Sources: EXPERIENCE_PASS S24 to S26 and S36, 5.8 rows 5 and 7 (`docs/design/EXPERIENCE_PASS_2026-10.md`); the design-systems audit of 9 Nov (rows 7 to 10, 12, 18); the Chief Design Officer's note of 9 Nov (defect 4). The code also cites `proposals/book-page.md`, which is not in the repo; this file replaces it as the reference.

Strings are keys: `copy.book.*` in `packages/content/src/strings.en.ts`, and `bookCopy` in `components/book/copy.ts` (feature-local words that `content` has not moved yet).

## 1. Purpose

The Book is where a parent reads what the family has kept, the way they would read a printed book. Months are chapters, newest first. One warm light, the cover band, is the only lit object. Read together is the way in for listening. Nothing counts what is missing: no streak, no gap, no count of months (CLAUDE.md content rules).

## 2. Layout

At the top of the list (`app/(tabs)/book.tsx:338-355`, `components/book/cover-band.tsx`):

```
  [For Asha v]                       only when there are several books
  +------------------------------------------+
  | Asha's book                 [Months] [gear] |   display, heading level 1
  | 17 months                                |   callout
  | [ (book) Read together                 ] |   secondary, 48 pt, full width
  +------------------------------------------+   radius lg, lit edge and glow
   THIS MONTH                                    letterDateline, caps
   17 months                                     title1, heading level 2
   October 12 to November 11                     letterDateline, muted
  +------------------------------------------+
  | SUNDAY, NOVEMBER 1, 2026                 |   letter card (LetterCard)
  | The first three lines of the words, the  |
  | last whole word fading out               |
  | From Papa                 (wave) Voice 1:06 |
  +------------------------------------------+
  ---------------------------------------------   hairline above every month but the first
   16 months ...
                  (quotation pair)                end of the book
```

The inline bar fades in over the top of the list once the person scrolls past the band (`book.tsx:361-386`):

```
  +------------------------------------------+
  | Asha's book                 [Months] [gear] |   headline
  | 16 months   July 12 to August 11         |   the month at the top of the list
  +------------------------------------------+
```

Where a person gets to the other parts: the gear opens Settings (a push); Months opens the sheet; a card opens its letter page (card to page, MOTION 5f); Read together opens its player.

## 3. Parts, library components and tokens

| Part | Component | Tokens and notes |
|---|---|---|
| Cover band | `CoverBand` (`components/book/cover-band.tsx`) | `radius.lg`; 1 pt edge in `atmosphere.tone.amber` at `LIT_EDGE_ALPHA` 0.4; a still radial of `atmosphere.tone.gold` at the scheme's peak times `LIT_BAND_STRENGTH` 0.35; side padding `LIT_PAD_X` 15 so its words start 36 pt from the screen edge, where a card's words start. Title `Text` `display` (cap 1.6x) `asHeading={1}`; age `callout`. |
| Read together | `Button` secondary `md`, full width, Phosphor BookOpenText | Only when the book has a letter with words it can read (`readableInBook`). Label `readTogether.title`; hint is `readTogether.subtitle` filled with the name. |
| Months, gear | `Button` quiet `sm` (label "Months"); `IconButton` (Phosphor GearSix) | Months shows from two months with letters (`MONTHS_BUTTON_MIN_ROWS`). |
| Switcher | `ChildSwitcher` | Only with more than one book. |
| Month heading | `MonthOpener` | `title1` heading with the kicker "This month" on the current month only, and the dates in `letterDateline` `textMuted`. A `line` hairline (`StyleSheet.hairlineWidth`) above every one but the first, then `space[6]`. No numeral, no count, no box. |
| Letter card | `LetterCard` (inside a `CardSource`) | `Card` raised, radius `md`, padding 4. Dateline `letterDateline` caps; words in `ExcerptFade` `letterBody`; signature `signature`; Private chip; voice marker. |
| Months sheet | `MonthsSheet` over `Sheet` | Section 4. |
| Inline bar | `BlurSurface` `chrome`, `edge="bottom"` | `space[2]` under, `space[5]` at the sides, title row at least 44 pt (`BAR_HEIGHT`). |
| Empty book | `BookCover` `lg` plus `EmptyState` plus `Button` primary `lg` | Section 5. |
| End of book | `EndOfBook` with `QuotePair` 40 | Decorative. The last thing VoiceOver reads is the oldest letter. |
| Light | `Lamp` scene `book`, persist `tabs` | Still. Shared with the tabs. |

### The cover band

- **Title row.** Placed over the space kept for it. The trailing buttons (Months, gear) and the switcher are `position: absolute` (`cover-band.tsx:121`, `:126-131`); the title carries a `marginRight` equal to the width of the trailing buttons, so it wraps before them.
- **Age.** `coverAge`: "17 months", "1 month", "3 weeks" in the first month, "Before You" before the birthday or without one. Months only, never "and 2 weeks" (`components/book/book-page.logic.ts:18-23`). With no birthday and no due date the band still says "Before You".
- **Plain.** Under Increase Contrast or Reduce Transparency the band has a plain 1 pt `line` edge and no glow (`cover-band.tsx:58`, `:98`, `:104`).
- **At AX sizes** the band stacks in the same order as VoiceOver: title, age, switcher, Read together grown to fit its label, then Months and the gear in a wrapping row, right-aligned (`cover-band.tsx:105-113`).
- **Nothing moves.** Haptics: none (MOTION 6). The first view per session settles the header once (`Settle`, MOTION 5a): opacity 0.6 to 1 and up 6 pt on `gentle`; under Reduce Motion a `fadeMs` fade.

### The letter card

- **Excerpt.** Three lines at standard sizes, two from AX1 up (`BOOK_EXCERPT_LINES`, `book-page.logic.ts:34-39`). Built, `EXCERPT_ENDING = 'word'`: the platform's own line breaks (`onTextLayout`) say which words are on the last visible line, a hidden copy of the last word measures it, and only that word fades. The fade never starts inside a word, so the excerpt never seems to stop in the middle of one. Until both are measured (the first frame, and on web) the fade covers the last 40 percent of the line (`FADE_FRACTION`). No `numberOfLines`, no ellipsis glyph, the stored letter never cut. The whole text stays in the element.
- **Voice marker.** On a spoken letter with a recording length: a 14 pt Phosphor Waveform in `textMuted` and the word "Voice 1:06" in `footnote` with tabular figures (`letter-card.tsx:137-141`). A glyph and a word, so colour is never the signal. Never a play button: the card is the one target. Hidden from VoiceOver and said once in the card's label as "Voice recording, 1 minute 6 seconds".
- **Footer.** Signature, Private chip and marker share a wrapping row; from AX1 up they stack (`cardFooterStacks`).
- **Arrival.** A kept letter, an Undo, or the other parent's letter seen here for the first time carries the 1.6 s `accentSoft` wash once (`newMarkMs`), hidden from VoiceOver. A card that leaves collapses over `exitMs` while the rows close up on `standard`.

## 4. The Months sheet

`Sheet` titled "Go to a month" (`bookCopy.monthsTitle`). One `ListRow` per month that has letters, newest first, like the Book: the month in words as the title ("17 months", "The first weeks", "Before You") and, under it, what exists in it as the subtitle ("3 letters, from Mama and Papa"), with a chevron. A month of only quiet days, or the current month before its first letter, is not listed (`monthRows`, `book-page.logic.ts:74-83`). No count of months, no empty months.

- Choosing a month closes the sheet and the list fades out over half of `fadeMs`, moves at once, and fades back in over the other half. Never an animated scroll. It finds the month again by its key, tries up to 5 times if the list has not measured it yet, and always fades back in, even when the month has gone (`runJump`, `book-page.logic.ts:146-161`). The month's heading lands under the bar: the offset is the bar's measured height, or the top inset plus 44 before it is measured (`book.tsx:301`).
- The rows scroll inside the sheet in a `BottomSheetScrollView` at most 60 percent of the window high (`months-sheet.tsx:22`). At AX5 rows wrap and scroll.
- `Sheet` gives VoiceOver focus to its title, is modal, closes on the escape gesture and has a visible Close.
- No haptic. Navigation is silent.

## 5. States

| State | What shows |
|---|---|
| Loading | None. The letters are read when the screen mounts, so the first frame is the book (`book.tsx:92`). No skeleton and no spinner. |
| Empty (no letters) | The band (title and age; no Read together, no Months), the closed `BookCover` at 160 x 214 centred and still, `EmptyState` `empty.bookTitle` and `empty.bookBody`, and a primary `Button` `empty.bookCta` that goes to Tonight (`book.tsx:392-405`). The cover is decorative to VoiceOver so the name is not heard twice. No count of what is missing. |
| One letter | The band, the current month's heading ("This month"), the card, the quotation pair. |
| Many months | As in section 2. The inline bar and the Months button appear. |
| Waiting for words | The card shows the app's own note, small and unsigned, and a live reason ("Getting ready, 40%", "Waits for Wi-Fi, 575 MB"). Only waiting cards follow the queue. |
| Private letter | The Private chip with a lock and the word. |
| Quiet day | A small row (`QuietDayRow`), never counted. |
| Other parent's letter, first sight | The wash, once. |
| Letter deleted from its page | The card collapses out; one toast with Undo above the tab bar until Undo, Close or leaving the Book (`book.tsx:207-236`). |
| Error | None built. The screen has no error state; a read that fails is not handled here. |
| No book | The tab redirects to first run (`book.tsx:318`). See `screens/DELETE_THIS_BOOK.md` section 4 for how that can follow a deleted sole book. |

## 6. Dynamic Type, to AX5

- **Band.** Stacks from AX1 (section 3). The title stops at 1.6x (`display`); every other line is uncapped and wraps. Read together grows with its label.
- **Month heading.** Kicker and dates stop at 2.4x, the month at 1.8x (`title1`). Every line wraps.
- **Cards.** Two lines of excerpt from AX1 up; the footer stacks. The marker's glyph does not scale (14 pt) while its word does. **Device**: how it looks beside 50 pt text at AX5.
- **Months sheet.** Rows wrap and scroll (section 4).
- **Inline bar.** Built: the same at every size. Its title row is at least 44 pt and its title carries `maxFontSizeMultiplier={1.3}` (`book.tsx:372`); the Months label and the compact month scale fully. The compact month's two lines wrap and never truncate. The CDesO's arithmetic puts the bar at nearly half an SE 3 screen at AX5 (note of 9 Nov, defect 4). A rough count of lines from the type ramp (`footnote` 14/19, `subhead` 16/21, `labelSmall` 16/20, all at 3.571x) gives about 330 of the SE 3's 667 pt. Neither figure is measured: **Device** (S1-153 row (d)).
  - **PROPOSED (CDesO, 9 Nov): from AX1 up the bar shows the title row only.** The compact month goes (the heading it names is still in the list).
  - **OPEN (CDesO):** or no bar at all from AX1 up. Then the band's Months and gear scroll away with it and the person scrolls back up to reach them, as on any long page.
  - Removing the 1.3 cap before this is decided would make the bar taller (section 11, item 2).

## 7. Dark mode and contrast

| Part | Pair | Light / dark |
|---|---|---|
| Card words | `text` on `surfaceRaised` | 14.83 / 14.29 |
| Dateline, voice word, month dates | `textMuted` on `surfaceRaised` | 5.83 / 7.32 |
| Month heading and dates on the page | `text`, `textMuted` on `bg` | 14.00 and 5.51 / 15.66 and 8.01 |
| Muted text on the lit band, over the lamp at its peak | `textMuted` on the lit mix | at least 4.5, asserted in both schemes and under Increase Contrast (`test/book-page.test.ts:207-231`); dark is 4.56 at strength 0.35 (`book-page.logic.ts:27-32`) |
| Read together label | `accent` on `accentSoft` | 4.74 / 5.99 |
| Read together fill against the band | `accentSoft` on the lit band | not measured; the fill is a tint with no edge. See section 11, item 8 |
| Private chip | `text` on `accentSoft` | 12.07 / 11.20 |

Dark mode draws a raised card with a 1 pt `line` edge, and the padding gives that point back so the words sit in the same column in both schemes (`letter-card.tsx:113`). The band's amber edge and glow are decoration; the words carry the meaning. Increase Contrast swaps to `tokens.highContrast`. The lamp's status-colour limits (DESIGN_LANGUAGE 2b) do not apply: the Book shows no status colour.

## 8. Reduce Motion, Reduce Transparency, Increase Contrast

- **Reduce Motion.** The first-view settle is one `fadeMs` fade. The inline bar switches at scroll offset 96 instead of fading between 56 and 96 (`book.tsx:259`). The jump to a month is a fade either way, so it is kept. Cards and rows follow the stagger rules (MOTION 5f, 5.8 rule 2): only the first six enter, only on the first view.
- **Reduce Transparency.** The inline bar is solid `surfaceRaised` (`blur-surface.ios.tsx:17`); the band loses its glow for a `line` edge.
- **Increase Contrast.** Spec: the same as Reduce Transparency, for the bar as well as the band. Built: only the band does (section 11, item 3).

## 9. VoiceOver

Order of the band (the views are in this order in the tree): "Asha's book" (heading, level 1), "17 months", then with several books "For Asha", "Read together" (hint: the long line), "Months" (hint: "Shows the months that have letters."), "Settings". The switcher and the trailing buttons are placed over the space kept for them, and iOS may order by screen position instead, so **Device** (S1-151 row (e), S1-153 row (d)). If it differs, group the title block or stack the band always.

- Month headings are headers, one per month: "This month, 17 months, October 12 to November 11". The rotor's Headings moves by month. The parts inside are not reachable on their own. The title is set as level 1 and the months as level 2 (`aria-level`), which only the web build uses: React Native 0.86.3 passes no heading level to iOS, so VoiceOver on an iPhone sees headers without levels (see `screens/STRUGGLING.md` section 8).
- A card is one element: "From Papa. Sunday, November 1, 2026, 17 months. Voice recording, 1 minute 6 seconds." then every word of the letter, then "Private" when it is, then the live reason, then "Recording kept on this phone" for the reader's own spoken letters (`letter-card.logic.ts`). Hint: `reader.openHint`, "Opens the letter."
- The inline bar is hidden from VoiceOver and takes no touch while the band is in view (`accessibilityElementsHidden`, `pointerEvents`, `book.tsx:363-369`). Once the bar is up its compact month is a header with the label "16 months, July 12 to August 11" (no level).
- Months sheet: focus lands on the title "Go to a month"; each row reads "17 months, 3 letters, from Mama and Papa". Built: every row also carries the hint "Goes to this month in the book." (section 11, item 7).
- After a jump, built: no focus is set (`book.tsx:289-316`). **PROPOSED:** focus the chosen month's heading, since the list moved under the person's finger. **Device** first.
- When a card opens into its page, focus lands on the page and the list behind cannot be reached (CardToPage, MOTION 5f).
- Not read: the lit glow, the quotation pair, the wash, the cover on the empty Book.

## 10. Copy keys

`book`: `title`, `thisMonthLabel`, `monthRange`, `chapterNewborn`, `beforeYouChapter`, `signature`, `fromTwo`, `privateLabel`, `recordingOnPhone`, `waitingReady`, `empty.bookTitle`, `empty.bookBody`, `empty.bookCta`, `quietDay.*`. `readTogether.title`, `readTogether.subtitle`. `settings.title`. `reader.openHint`. `settings.delete.entryToast`, `common.undoButton`.

`bookCopy` (working copy, `content` moves it): `chapterAge` "{n} months", `chapterAgeOne`, `monthsButton`, `monthsTitle`, `cardVoice`, `cardVoiceA11y`, `monthsHint`, `monthRowHint`.

## 11. Where the build departs from this spec

Line numbers at `6cd2223b`. The first three can fail a person at a large text size or with Increase Contrast.

1. **The inline bar has no large-text form** (`book.tsx:361-386`). Spec: title row only from AX1 (PROPOSED), or no bar (OPEN). Owner `mobile` once the CDesO chooses.
2. **The bar's title is capped at 1.3x** (`book.tsx:372`; also `app/letter/[id].tsx:340`). COMPONENTS 0.1 says caps come from tokens only, and `headline` has none. Remove the cap, after item 1 is decided. Pin: the cap allowlist test.
3. **Increase Contrast alone leaves the bar translucent** (`components/platform/blur-surface.ios.tsx:15-17` reads `reduceTransparency` only), against the file's own claim (`book.tsx:8-9`). `CoverBand` does both (`cover-band.tsx:58`). Fix (design-systems): solid when `highContrast || reduceTransparency`. **Device** (S1-151 row (g)).
4. **Under Reduce Motion the bar's buttons go live before it is visible.** The bar is invisible until offset 96 (`book.tsx:259`) but takes touches and is read from offset 76 (`book.tsx:263-268`). Between 76 and 96 an invisible bar is reachable. Fix for `mobile`: use one threshold under Reduce Motion. **Device**.
5. **The band's VoiceOver order rests on JSX order.** Absolute placement at `cover-band.tsx:116-133` may make iOS order by position. The test at `test/book-page.test.ts:234` checks the source order only. **Device.**
6. **A scroll view inside `BottomSheetView`** (`months-sheet.tsx:22`, `components/ui/sheet.tsx:186`) with content panning on: a long month list may drag the sheet instead of scrolling. **Device** at 60 months (S1-151 row (h)).
7. **The same hint on every month row** (`months-sheet.tsx:24`). VoiceOver repeats it 60 times. Spec: drop it; the title says where it goes.
8. **Read together's fill is a tint with no edge** on the band (`cover-band.tsx:75`). The label passes (4.74 / 5.99). See `screens/STRUGGLING.md` section 7 for the one rule proposed for `secondary` on a host.
9. **Numbers that have a token or should:** `BAR_HEIGHT = 44` (`book.tsx:80`), `insets.top + 4` (`book.tsx:340`), `paddingBottom: 40` (`book.tsx:417`), the glyph `size={14}` (`letter-card.tsx:138`). Use `space` and `target.min`. Owner design-systems.
10. **No focus after a jump** (PROPOSED, section 9).
11. **Two words for one thing.** The Book now says "17 months". Other screens still say "Month 7": Read together (`readTogether.nowReading`, `endOfMonth`, `nextMonthButton`), the letter dateline for a month-only date (`book.dateline.monthOnly`), the saved moment's chip (`review.destination.filedChip`) and the switcher's rows (`components/child/child-switcher.tsx:28-30`). The code names this as `content`'s call (`components/book/copy.ts:14-17`). OPEN (`content`).

## 12. Device steps

S1-151 is the Book page's step: (a) one letter, (b) excerpt, (c) footer and marker, (d) card to page, (e) VoiceOver order, (f) AX5, (g) scroll and the bar, (h) Months sheet, (i) haptics, (j) regression. S1-153 row (d) records the inline bar at AX5 and the band's VoiceOver walk on the build as it is today.

The old step S1-38 checked the month numeral and the lit month card, which #674 removed; it is marked superseded.

## 13. OPEN decisions

| # | Question | Owner |
|---|---|---|
| 1 | The bar at AX sizes: title row only, or no bar | CDesO |
| 2 | Whether "Month 7" in Read together, the month-only dateline, the saved moment's chip and the switcher becomes "7 months" | `content` |
| 3 | One rule for `secondary` buttons on a tinted or lit host | design-systems |
