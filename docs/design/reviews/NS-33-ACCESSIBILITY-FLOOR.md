# NS-33 accessibility floor: what BL-928 builds (R1, R2, R4)

Status: spec for `mobile`, 20 Nov 2026. Owner `design-systems` (BL-927); reviewers `qa` and `compliance-engineer`. Card: NS-33 in `docs/product/prd/11-foundations.md` on `docs/prd-lock-v1-20nov` at `450bcb4a`; the rows cite LEGAL-REQ-051. Plan: #847, section 2.3, rows BL-927 and BL-928. Code read on `develop` at `20553b18`. React Native 0.86.3 and expo-router 57.0.24 read in the installed `node_modules`. Widths at AX5 are advance widths measured with `opentype.js` on the bundled Mukta faces at React Native's AX5 font scale, 3.571 (`react-native/React/CoreModules/RCTAccessibilityManager.mm:271`). Nothing here was run on a phone or a simulator.

Paths under `apps/mobile/src/` drop that prefix. Tests live in `apps/mobile/test/` and read source as text, like `test/tab-bar.test.ts`, because the unit tests run in Node and load no React Native (`apps/mobile/vitest.config.ts`).

## 1. What mobile builds

| Slice | Row | Change | Files | Test title | Phone |
|---|---|---|---|---|---|
| BL-928 (a) | R1 | `asHeading={1}` on the letter page's dateline | `app/letter/[id].tsx:219`; new `test/a11y-headings.test.ts` | `[NS-33-R1] letter page heading` | V1 |
| BL-928 (b) | R2 | Delete `headerTitle: copy.settings.title` so the bar shows the tab's own `title` | `app/(tabs)/_layout.tsx:91`; `test/tab-bar.test.ts:61`; `test/a11y-headings.test.ts` | `[NS-33-R2] Me heading matches tab` | V2 |
| BL-928 (c) | R4 | Review's fix row stops cutting the parent's words at accessibility sizes; the truncation scan | `app/review.tsx:1207-1231`; new `test/a11y-ax5.test.ts` | `[NS-33-R4] no text on the four screens is cut at accessibility sizes` | X1 |
| BL-928 (d) | R4 | The Book's inline bar stacks at accessibility sizes | `app/(tabs)/book.tsx:385-410` | `[NS-33-R4] the Book bar stacks at accessibility sizes` | X1 |
| design-systems | R4 | The toast puts its words above Undo and Close at accessibility sizes | `components/ui/toast.tsx:113-131` | `[NS-33-R4] the toast stacks at accessibility sizes` | X1 |

(a) and (b) can ship as one PR (two headings, one new test file) or two. (c) is its own PR. (d) waits for #798 (section 5.3). The toast is a `design-systems` PR that touches no BL-928 file.

No slice needs a new word, token or shared component prop. The only word a parent reads that changes place is the existing tab label `tabs.you` ("Me"), which R2 puts in the bar. The #840 note in section 6 needs one PROPOSED content key.

## 2. Definitions every row uses

- **Largest text size:** AX5 (Settings, Accessibility, Display and Text Size, Larger Text, slider at its end). Font scale 3.571.
- **Accessibility sizes:** AX1 and up, `useIsAccessibilitySize()` (`lib/a11y.ts:29`; threshold 1.786 in `lib/a11y.logic.ts`). Every layout switch in this spec uses it, so the four screens change at the same size.
- **Control under 44 pt (R4):** a control whose touch area, its frame plus `hitSlop`, is under 44 by 44 pt. Primary actions at 56 pt and the capture controls at 64 pt are the card's section 8 budget and are checked in the same walk. The R16 audit reads the accessibility frame, which `hitSlop` does not grow, so a control that reaches 44 pt only through `hitSlop` is an expected R16 finding, not an R4 failure (section 7, F-4).
- **Truncated (R4):** text on screen that a parent cannot read whole: an ellipsis, a line or glyph cut by its box, text under another element or off the screen, or a word split across lines because its box is narrower than the word. Not truncated: a card excerpt that ends in a fade (`ExcerptFade`), because the whole text is in that card's accessibility element and the letter page shows it in full; chrome held at a token cap, as long as it wraps.
- **Heading level (R1):** on iOS, React Native maps `role="heading"` to the Header trait (`react-native/ReactCommon/react/renderer/components/view/accessibilityPropsConversions.h:84-86`) and reads no level: no file under `React/` or `ReactCommon/` reads `aria-level`. `Text asHeading={1}` also sets `aria-level="1"` (`components/ui/text.tsx:173`), which only the web build uses. So on iOS, "level 1" is checked as: the dateline is the page's first heading, and the only `asHeading={1}` on the page.

## 3. R1: the letter page's dateline is a level 1 heading

**Fact.** The dateline is `Text variant="letterDateline" caps` with `accessibilityLabel={spokenDateline}` and no heading role (`app/letter/[id].tsx:219-221`, in `OpeningBlock`). The route runs card to page (`lib/transitions.logic.ts:53`), so the page hides the native header (`app/letter/[id].tsx:392`). Its top bar holds Back and "Aa", and neither is a heading. `CardToPage` draws two carried copies of the opening, both hidden from VoiceOver (`components/motion/card-transition.tsx:492-499`). The page's own copy is hidden until the move settles (`:230-231`), and then focus moves to the dateline (`:300`). The letter page file has no other heading today.

**Change.** Add `asHeading={1}` to that `Text`. Keep the label, type and order as they are. The carried copies get the prop too (same component) and stay hidden, so VoiceOver finds one heading.

**Behaviour.**
- When the page settles, VoiceOver lands on the dateline and reads the spoken dateline, then "heading".
- With the rotor on Headings, the dateline is the first heading from the top of the page.
- With "Exactly as said" on, the caption above the dateline (`:398-400`) stays plain text, and the dateline is still the first heading.
- A letter dated to a month reads its month line as the heading (`:162-163`).
- Later rows add headings below it, never above. NS-21-R4's "This letter" list title is level 2 (BL-937).

**Test.** `[NS-33-R1] letter page heading` in `test/a11y-headings.test.ts`, on `app/letter/[id].tsx` with comments removed:
1. The `Text` with `testID` `letter.dateline` has `asHeading={1}`.
2. It is the only `asHeading={1}` in the file, and no `asHeading`, `role="heading"`, `accessibilityRole="header"` or `variant="h1"` comes before it.
3. `components/ui/text.tsx` still maps a numeric `asHeading` to role `heading` and to `aria-level`.

It fails on `develop` at step 1.

**Phone (V1, SE 3, VoiceOver).** Open a spoken letter from the Book and wait for the page to settle. Expect to hear the dateline, then "heading". Set the rotor to Headings and swipe up, then down: the dateline comes first, once. Repeat with "Exactly as said" on, then on a letter dated to a month. Only a phone shows where focus lands and the rotor order.

## 4. R2: Me's heading equals the tab label

**Fact.** The Me tab sets `title: t.you` (`app/(tabs)/_layout.tsx:87`; `tabs.you` is "Me", `packages/content/src/strings.en.ts:63`) and `headerTitle: copy.settings.title`, which is "Settings" (`:91`). The tab header uses a string `headerTitle` in place of `title` (`expo-router/build/react-navigation/elements/Header/getHeaderTitle.js:4-9`). It draws that title as `role="heading"`, `aria-level="1"`, `numberOfLines: 1` (`HeaderTitle.js:10`). Settings home draws no heading of its own (`app/settings/index.tsx`), so the bar title is the screen's only heading, and it says "Settings" under a tab called "Me".

**Change.** Delete line 91. The bar then shows `title`, the tab label, from one key, so the two cannot drift apart. No new words and no new key. This refines design 11 section 3.2, which wrote `headerTitle: t.you`: one source is safer than two copies of the same key.

**Behaviour.**
- On the Me tab, VoiceOver reads "Me, heading" on the bar title. The tab item still reads "Me", tab, 3 of 3.
- `/settings`, pushed from the Book's gear (`app/(tabs)/book.tsx:353`), keeps "Settings" (`app/settings/_layout.tsx:40`). R2 covers the tab only. The gear leaves the Book under NS-22-R3 (BL-938), which ends the second name.
- Back on a Settings page opened from the tab still says "Me" (`app/settings/_layout.tsx`, `you: copy.tabs.you`).

**Tests.**
- New `[NS-33-R2] Me heading matches tab` in `test/a11y-headings.test.ts`: the `name="you"` block in `app/(tabs)/_layout.tsx` has `title: t.you` and `tabBarButton: button(t.you)`, and no `headerTitle`.
- `test/tab-bar.test.ts:61` asserts the old line under `[NX-30a-R7]`. Change that one assertion to `expect(block).not.toMatch(/headerTitle/)`. This is NS-33-R2 replacing one line of NX-30a-R7. It does not loosen the test: R7's other checks (one title in the header, no Back, no lamp) stay. Say so in the PR body.

The new test fails on `develop` on `headerTitle`.

**Phone (V2, SE 3).** With VoiceOver on, tap Me, swipe to the bar title, and expect "Me, heading". At AX5, look at the bar too (section 7, F-3). That is not an R2 or R4 gate.

## 5. R4: Home, Review, the Book and the letter page at AX5 on an SE 3

### 5.1 Code scan

The scan covers each route file and the components it imports. Widths are measured as in the header. The SE 3 is 375 pt wide.

| Site | Where | At AX5 | Verdict | Fix |
|---|---|---|---|---|
| Review fix row detail | `app/review.tsx:1219-1228` | `numberOfLines={1}` at every size. The detail is the parent's words before and after a fix, in `footnote` (50 pt), beside the label and a chevron. "gonna -> going to" alone is 369 pt wide | Fails: ellipsis | BL-928 (c) |
| Review view control | `app/review.tsx:1170, 1196` | Line limit only below accessibility sizes; it stacks above them | Passes | none |
| Review header | `components/ui/screen-header.tsx:42-48`; `app/review.tsx:937-955` | "Hear it" button 224 pt and Close 162 pt, both `shrink-0`. The words end at x 212 and "Close" starts at x 225; only their paddings overlap. "Pause" is 143 pt, 21 pt narrower than "Hear it" | Passes by 13 pt | none, unless X1 shows overlap |
| Book inline bar | `app/(tabs)/book.tsx:393-401` | The title (`headline`, capped at 1.3, so 23.4 pt) sits in `flex-1` beside Months (217 pt) and the gear (36 pt): a 66 pt column. "Asha's" is 64 pt, so any title word over 66 pt (about seven letters) splits. #798 adds a 44 pt Find button to this row, which leaves the title about 14 pt | Fails on longer names; fails for every name with Find on | BL-928 (d), after #798 |
| Book cover band | `components/book/cover-band.tsx:104-113` | Stacks at accessibility sizes; the title wraps; the trailing row wraps | Passes | none |
| Toast on the Book ("Letter deleted." with Undo) | `components/ui/toast.tsx:113-131` | The words column is 101 pt beside Undo (162 pt) and Close (44 pt). "Letter" is 156 pt and "deleted." is 206 pt, so both words split | Fails | `design-systems` (5.4) |
| Letter page "Aa" | `app/letter/[id].tsx:331-344` | A fixed `h-11` holds `title2` capped at 1.3 (a 36 pt line), with the Large Content Viewer | Passes | none |
| Letter page dateline | `app/letter/[id].tsx:219` | `letterDateline` capped at 2.4 (33.6 pt) and wraps. "WEDNESDAY," is 192 pt | Passes | none |
| Letter page player | `components/player/audio-player.tsx:166-168, 204-222` | 44 pt Play; rows `min-h-11` | Passes | none |
| Home | `app/(tabs)/index.tsx:122, 248-251`; `components/tonight/draft-card.tsx:39-50` | Capture actions go inline at accessibility sizes (`footerPlacement`); `ButtonRow` stacks from xxxLarge; the dateline row shrinks | Passes in code | none |
| Card excerpts | `ExcerptFade` on Book letter cards and Home cards | A fade, with the whole text in the element | Not truncation (section 2) | none |

Controls under 44 pt (touch area): none on the four screens. Button `sm` is 44 pt (`components/ui/button.tsx:61`) and IconButton `md` is 44 pt (`:198`). No IconButton `sm` and no Chip is drawn on these screens. One control reaches 44 pt only through `hitSlop`: Review's removed-words mark, 32 by 24 pt (`components/capture/transcript.tsx:151-160`; section 7, F-4).

### 5.2 BL-928 (c): Review's fix row

**Behaviour.** Below accessibility sizes, nothing changes: one row with the label, the detail on one line (a preview: the full detail is in the row's label, COMPONENTS 2.3) and the chevron. At accessibility sizes the row becomes a column: the label and the chevron on the first line, then the detail in full with no line limit, still struck through where it was. It stays one button with the same label, hint and `expanded` state (`app/review.tsx:1212-1217`), at least 48 pt (`min-h-12`). VoiceOver hears the same thing at every size.

**Test.** `[NS-33-R4] no text on the four screens is cut at accessibility sizes` in `test/a11y-ax5.test.ts`. It reads the four route files (`app/(tabs)/index.tsx`, `app/review.tsx`, `app/(tabs)/book.tsx`, `app/letter/[id].tsx`) and every file each one imports from `@/components/`, one level deep, skipping `.logic` files, all with comments removed:
- Every `numberOfLines` is `numberOfLines={<name> ? undefined : <n>}`, where `<name>` is set from `useIsAccessibilitySize()` or `useIsLargeText()` in the same file.
- No `adjustsFontSizeToFit`, no `ellipsizeMode`, no `allowFontScaling={false}`.
- `letterBody` and `signature` text never sets `maxFontSizeMultiplier` (D-027).

It fails on `develop` at `app/review.tsx:1224`.

Add `[NS-33-R4] no control under 44 pt on the four screens` in the same file: no `IconButton` with `size="sm"` and no `Chip` in those files. It passes on `develop`, so it is a guard, not the proof of a fix. Button minimums are already pinned by `test/design-system-gaps.test.ts` section (4).

### 5.3 BL-928 (d): the Book's inline bar

**The plan's rule.** BL-928 stays off the Book header while Find (#798, head `7f36031a`) is in review. #798 adds a Find `IconButton` to this same row.

**Behaviour.** At accessibility sizes the inline bar has two rows. First the title alone, full width, wrapping, cap unchanged at 1.3. Then the controls in one wrapping row, aligned to the end, in this order: Find (when present), Months, the gear, each 44 pt. That matches the cover band's stacked trailing row (`components/book/cover-band.tsx:112`). VoiceOver order: title, Find, Months, gear, then the compact month heading. Below accessibility sizes, nothing changes. At AX5 the two rows fit: 217 + 44 + 44 pt of controls plus gaps is under the 335 pt inside the bar's padding. The bar's measured height (`barHeight`, `app/(tabs)/book.tsx:389-391`) feeds the scroll offset, so a taller bar should need nothing else (check on the phone).

**Where it lands.** The fastest path is inside #798 before it merges, because #798 adds the control that makes the row fail for every name. Otherwise it lands as BL-928 (d) the day #798 merges. The draft UX for the bar (B-S01 on `docs/e2e-ux-20nov`) moves Go to a month into a menu from AX3; that is BL-938's work, later, and does not change this.

**Test.** `[NS-33-R4] the Book bar stacks at accessibility sizes`, reading `app/(tabs)/book.tsx`: the bar's row layout depends on `useIsAccessibilitySize()`, and the title `Text` has no `numberOfLines`.

**For the cut.** If #798 has not merged when Build 13 is cut, the Book bar's part of R4 is open. The Book's other R4 sites pass in code. The choice belongs to Karma and the founder under Q1 (plan D9).

### 5.4 The toast at accessibility sizes (`design-systems`)

**Behaviour.** At accessibility sizes the toast stacks: the words on their own lines, full width, then one row aligned to the end with Undo (when there is an action), then Close, both 44 pt. Below accessibility sizes, nothing changes. Nothing else changes either: the announcement, no timer while there is an action, swipe, replace and `onDismiss` all stay (COMPONENTS 2.14). VoiceOver order stays words, Undo, Close.

**Owner.** `design-systems`, in its own PR. It touches no BL-928 file.

### 5.5 AX5 walk on the phone (X1)

SE 3, on iOS 17 and on the latest iOS, Asha install only, light and dark, AX5, Bold Text off (R7 repeats this walk with Bold Text on, under BL-984). Each state passes when it shows no ellipsis, no cut line, no text under another element and no split word, and every control is at least 44 pt.
- Home: the default state with a waiting card; the capture actions inline; Not much today and its Undo line.
- Review: a spoken take with fixes. Open the fixes list, then one fix row. Use the view control. Press Hear it, then Pause, in the header. Use Change words (Done moves to the header). Check the Keep footer inline.
- The Book: the top (cover band stacked). Scroll until the inline bar shows, with Find on once #798 is in. Delete a letter from its page and read the toast on the Book.
- The letter page: a spoken letter with the player; "Aa" set to Large print; the rows; the Change the date sheet; the Delete confirm sheet.

For each state, record a pass, or the site plus a screenshot from the Asha install.

## 6. #840, the Photos lens: one line for its authors

`LensRow` at `f811c9a6` (`components/photos/photos-lens.tsx`) is two Buttons marked `selected` inside a `tablist`. iOS gives `tablist` no trait (`accessibilityPropsConversions.h:100-108`), so VoiceOver hears two buttons and no single choice. Use `ChoiceGroup layout="segmented"` instead: one `radiogroup`, two `radio`s, exactly one `checked`, and iOS reads "radio button" and "checked" (`react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm:1523-1538`). Give it `label` from a new PROPOSED content key, `value={mode}` and `testID="book.lens"`, so `book.lens.months` and `book.lens.photos` stay.

That also replaces the solid accent fill on the selected lens with the shared selected look: fill, edge and check (COMPONENTS 0.1, never colour alone).

## 7. Found on the way (not BL-928 rows)

- **F-1.** COMPONENTS 2.3 said `asHeading` sets `role="header"` and listed caps the code does not use. Fixed in this PR.
- **F-2.** COMPONENTS 2.9 described a native segmented control that was never built. Marked in this PR.
- **F-3.** The Me bar title at AX5. The bar title scales with Dynamic Type (`HeaderTitle.js:10`; `headerTitleAllowFontScaling` is unset), and the bar has a fixed height (`Header.js:201`; 44 pt on iOS from `getDefaultHeaderHeight.js`). At AX5 a title of about 61 pt ("Me" is 81 pt wide) sits in a 44 pt bar. This is already true today with "Settings". Me is not one of R4's four screens, so it does not hold BL-928. Check it in V2. If the title spills out of the bar, `design-systems` specifies the fix for BL-984 under D-027: capped chrome shows the Large Content Viewer.
- **F-4.** R16's audit reads frames. Review's removed-words mark (32 by 24 pt, 44 pt through `hitSlop`) is the one control on the four screens that the audit may flag. For `qa` (33-6).
- **F-5.** The Book's gear opens this screen titled "Settings", while the tab calls it "Me". There are two names for one screen until BL-938 removes the gear (NS-22-R3).

## 8. Not verified

- That VoiceOver on iOS 17 and iOS 26 speaks no level for a React Native heading. This comes from reading React Native's source; nobody listened on a phone.
- Every width in 5.1. They are advance widths from the font files, without kerning, line breaking or Bold Text, so iOS may differ by a few points.
- That the Me bar title spills at AX5 (F-3).
- That the inline bar's measured height feeds the scroll offset with no other change (5.3).
- Whether `performAccessibilityAudit()`'s hit-region check counts `hitSlop`.

## 9. The way back

Each slice reverts on its own: (a) one prop, (b) one line plus one test assertion, (c) one row component, (d) one layout branch, and the toast one layout branch. No data, no flags and no words are involved.
