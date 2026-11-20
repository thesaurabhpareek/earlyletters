# Accessibility and type audit for the spec sync: VoiceOver, Dynamic Type to AX5, contrast, targets, motion, and every font error found

Status: DRAFT for Karma, 20 Nov 2026 (UTC). Author: `design-systems`. Docs only: this file changes no token, component or screen. Stacks on #1033. Standing duty 1 (one audit per run) and standing duty 2 (token gaps from TDD 09), done together for the screens that `SPEC-SYNC-20nov.md` adds or changes. It builds on `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` and does not repeat what it already settles.

Targets this file holds to: WCAG 2.2 AA, Apple HIG, Dynamic Type to AX5 with letter text never truncated (D-027), VoiceOver labels and order, 44 pt targets, Reduce Motion and Reduce Transparency honoured, contrast in both themes, colour never the only signal (A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051).

## 0. How each claim here was checked

| Tag | Meaning |
|---|---|
| RAN | A test or script ran this session and its output is quoted |
| MEASURED | A number I computed from the bundled font files or the token file this session (scripts kept outside the repo; method in section 9). Not a render. |
| READ | I read it in a file on `develop` at `55574906` (path and line given) |
| ASSUMED | A width, a size or a behaviour I assumed and say so |
| UNVERIFIED | Not checked. Needs a phone or a file I did not have |

The reference device is an iPhone SE 3 (375 by 667 pt). The AX5 font scale is 3.571 and the accessibility threshold is 1.786 (`NS-33` section 1, from React Native's `RCTAccessibilityManager`; I did not re-read the React Native source). Text widths assume a 20 pt gutter each side, so 335 pt of text width, as `NS-33` does. Where a control takes room beside the text I subtract 70 pt (a switch or chevron plus its gap): that 70 is ASSUMED, not read from `ListRow`.

No screen was seen on a phone and VoiceOver was not run. Everything below is a design requirement with the evidence stated, not a pass.

## 1. VoiceOver: order and labels for every new or changed screen

General rules (all hold on every screen below): one level-1 heading per screen, the first heading in reading order (ruling 29: the trait is asserted in a unit test; the level is recorded from a rotor read on a device). A control's accessible name is its visible label (WCAG 2.5.3, Voice Control). Hints say the result and never repeat the label. Icons next to words are hidden from VoiceOver. A status is never colour alone: each notice carries a glyph and words.

| Screen | Reading order | Labels and traits | Announcements |
|---|---|---|---|
| Welcome footer (E-S02) and Terms step (E-S07) | heading, sign-in buttons, agree line, device-access line, Terms link, Privacy link | Each link: name = visible text, trait link, 44 pt row. The agree line is one text element; the two lines are separate elements so each can be re-read. | none on load |
| Microphone primer (A-S04.primer) | heading ("Your phone will ask about the microphone"), body, Continue, Type instead | Continue: `listen.primer.continueButton`; Type instead: `errors.micDenied.typeButton`. Focus lands on the heading. | none (never speak into a take, SR-C-02) |
| Mic problem screens (denied, busy, full) | heading, body, primary, quiet option | Primary is "Type instead" for denied and full, `common.tryAgainButton` for busy | the title once, polite |
| Reminders page (D-S06) | heading, Reminders switch (state: on or off), footer lines, time, names switch, preview, notice if denied | The switch announces its state; the denied notice is read when it appears, polite. Preview is one element: "Example", the neutral title and body. | after return from Settings with permission: `reminderCopy.settings.onToast` |
| App lock (E-S22) | heading, Face ID line, switch, names note | switch: "App lock", on or off | none |
| Analytics sheet (E-S33) | sheet title, body, detail, "Don't share", "Share usage", footer line, Close | Title is `asHeading`; the two buttons have the same role (button) and no "selected" state; both names = visible text. Close comes last in the sheet (the app's `Sheet` owns it). Order is the same as the visual order left to right, top to bottom, including when stacked. | the sheet title on open |
| Privacy row (C-S23.analytics) | section title, switch "Share usage and crash reports" with its help as the description, footer | switch: on or off; help is read as part of the row; footer is its own element | "Off" is announced on change; no extra sentence |
| Sign-in code (E-S06) | heading, email line, code field, Continue, "Send a new email", notice | Field label visible and named; the notice is a live region, polite, and sits right after the field in reading order so a swipe from the field reaches it | the notice text on appear |
| New-device confirm page (E-S34, web) | h1, what happened, primary button, "This was me" | Real buttons; the result is in a polite live region; focus is not moved to the primary on load | the result text |
| Browse days (C-S25) | sheet title, group headings (rotor), rows, Done | Each row one element "{name}, {date or around date}, ticked or not ticked", role checkbox, chevron hidden, no count anywhere (NS-46-R26, R41). Group titles are headings. | none per tick except the value change |
| Days page (C-S24) | heading, "Days you added", rows, "Days you chose", rows, Add a day, Browse days | Same row name rule; a row's no-date line is part of its label | none |
| Photo picker entry (A-S03) | "Start from a photo" is a button; Apple's picker is its own accessible UI | nothing of ours inside the picker | none |

Order of focus after a dismiss: the sheet returns focus to the control that opened it.

## 2. Dynamic Type through AX5: the layout that holds on an iPhone SE 3

What AX5 does to the SE 3: body and label text become 64.3 pt (18 times 3.571, MEASURED from `tokens.type`), about 10 characters to a line in the Mukta faces at 335 pt. The visible area under the status bar and above the tab bar is about 560 pt, roughly six lines of body text. So at AX5 every screen scrolls, and a bottom-pinned button is a big part of the screen.

Layout rules (new and changed screens follow all of them):

1. Everything scrolls at accessibility sizes. No screen has a fixed-height region that holds text.
2. At AX1 and up (`useIsAccessibilitySize`), two controls side by side stack, first the one a person is more likely to want. At xxxLarge and up (`useIsLargeText`) button pairs already stack, as built in the analytics sheet. The sheet's own pair therefore stacks earlier than rows do; that is intended.
3. A pinned primary (56 pt, `target.primary`) is allowed only while it takes less than a quarter of the viewport. At AX1 and up a two-line label button is about 170 pt tall (2 lines of 64 pt text with 85 pt line height, MEASURED line height 24 times 3.571 is 85.7) which is 25 percent of 667 pt. From AX1 the primary scrolls with the content and is last. This changes `StateScreen`'s "pinned at the bottom" rule at accessibility sizes and needs `mobile` to confirm what the built component does (UNVERIFIED).
4. A row with a control (switch, chevron) puts its title on the full width at AX1 and up: title first, control on the next line, trailing end. So a title word that is 300 pt wide still fits 335 pt. UNVERIFIED whether `ListRow` does this today; section 6 lists the rows that need it.
5. A paragraph never sits in a fixed-width column or a fixed-height card. Cards grow.
6. Titles wrap, never truncate; no title has `numberOfLines`. No label has `numberOfLines` anywhere at AX1 and up.
7. Icons beside text scale up to a cap of 1.5 times, and drop to their own line when the line would need them smaller than the text.
8. Spacing between stacked controls is the same token as side by side (`space`), not reduced at large sizes.
9. Bold Text on: widths grow; the same layout rules hold. `NS-33` R7 repeats the SE 3 walk with Bold Text under BL-984.
10. Landscape is not an accessibility fix; no screen relies on it.

Per screen at AX5 (what the person sees; MEASURED line counts are with the real built strings, at 335 pt unless said):

| Screen | At AX5 on SE 3 | Holds? |
|---|---|---|
| Analytics sheet | Title on 2 lines (44 pt, capped at 2.0). Body is 15 lines at 64 pt, so the sheet scrolls; buttons stack, each label on 2 lines ("Share usage", "Don't share"). | Holds if the buttons are below the body in the scroll, not pinned (rule 3). Not verified on a phone. |
| Mic primer | Title 4 lines; "microphone" at body size is 326 of 335 pt, a 9 pt margin | Holds with 9 pt to spare; one narrower gutter or one Bold Text would split it (FE-8). |
| Denied notice and mic denied | Titles 2 and 3 lines | Holds |
| Terms step | Title 2 lines; agree line and device-access line each many lines | Holds as scrolling text. Length of the device-access line is the founder's; each added sentence adds about 6 lines at AX5 (MEASURED average 10 chars a line). Keep it to one sentence. |
| Sign-in code | 10 digits at title1 cap 1.8 is 318 pt against about 303 pt | Does not hold for a 10-digit code (FE-9); 6 and 8 digits fit |
| Browse row | "{name}, {date}" two elements stack | Holds if the checkbox column stays 44 pt and the name takes the rest; a name word over about 225 pt breaks (FE-8) |

## 3. Contrast

RAN: `packages/design-tokens` `vitest run`: 5 files, 98 tests, all passed (after adding `packages/brand` and `packages/emails/src` to the sparse checkout; without them 2 tests in `brand-parity.test.ts` fail only because `packages/emails/src/tokens.ts` was not checked out). It covers: every text pair 4.5:1, every non-text pair 3:1, every glyph pair 3:1 with the glyphs that replace words at 4.5:1, the Increase Contrast overrides at 7:1 for muted text and accent, and the generated CSS in sync with `tokens.ts`.

What the tests do not cover (MEASURED this session with the WCAG formula on `tokens.light` and `tokens.dark`):

| Pair, light | Ratio | AA text 4.5 |
|---|---|---|
| caution on surface | 4.40 | fails |
| success on surface | 4.46 | fails |
| caution on accentSoft | 4.09 | fails |
| success on accentSoft | 4.14 | fails |
| recording and destructive on accentSoft | 4.35 | fails |
| focus on accentSoft | 4.51 | passes by 0.01 |
| caution, success on surfaceRaised | 5.03, 5.09 | passes |
| caution, success on bg | 4.75, 4.80 | passes (tested) |
| every dark pair above | 5.48 to 9.90 | passes |

`TEXT_PAIRS` in `test/tokens.test.ts` tests the status colours (`recording`, `success`, `caution`, `focus`) only on `bg`. A banner on `surface` or a selected row on `accentSoft` that sets its words in `caution` or `success` would fail AA in the light theme, and no test would say so. This is a real gap. It is not an existing bug in a shipped screen that I found: I did not scan screens for the combination.

Rule until a test closes the gap: status colours are for glyphs and borders (3:1, which they pass on every surface), and the words of a notice are `text` or `textMuted`. The proposed `Notice` component follows it (`DESIGN-SYSTEM-DELTA-20nov.md`). Adding the pairs to `TEXT_PAIRS` for every surface they can sit on is the fix for `design-systems` (token PR, not in this docs PR): then `caution` and `success` text on `surface` fail and the tokens must change or the pairs be named not allowed.

Other contrast rules for the new screens: both buttons in the analytics sheet use `controlBorder` for their edge (3.62 on bg in light, 4.47 in dark, tested); the recording red is never used for an error (DESIGN_LANGUAGE 2), so a denied microphone is not red; focus ring 2 pt, `focus`, tested at 5.23 and 9.68 on bg; Increase Contrast overrides apply (`tokens.highContrast`); the glass surface falls back to `glassFallback` under Reduce Transparency (ruling 30).

## 4. Touch targets

`tokens.target`: min 44, primary 56, capture 64, web 48 (READ `tokens.ts:382`, and a test: "targets meet HIG 44 pt and the primary 56 pt rule", RAN). New and changed controls:

| Control | Size | Note |
|---|---|---|
| Analytics sheet buttons | 44 pt minimum, equal | Same size and component, as built |
| Privacy switch row | whole row at least 48 pt | |
| Primer Continue | 56 pt primary | Type instead is a 44 pt quiet button |
| Notice action ("Send a new email", "Open Settings") | 44 pt quiet button, never a link inside a sentence | |
| Terms and Privacy links | 44 pt tall rows | A link inside body text is never the only way: the same documents are in Me > Legal |
| Browse rows, Days rows | 48 pt tall, whole row | |
| Close on a sheet | 44 pt | |
| Web confirm page buttons | 48 pt (`target.web`) | |

A control that reaches 44 pt only through `hitSlop` passes the touch but not the R16 audit (`NS-33` F-4); new controls are drawn at 44 pt, not slopped.

## 5. Reduce Motion, Reduce Transparency, Increase Contrast, Bold Text

- Reduce Motion: the sheet and notice use the existing 200 ms cross-fade (`motion.reduceMotion`). The notice enters with `m.enter` (opacity and 8 pt) only when motion is allowed. Nothing breathes in a state screen under Reduce Motion (ruling 31). No parallax, no spring on a consent control.
- Reduce Transparency: sheets use `surfaceRaised` (glass falls back to `glassFallback`).
- Increase Contrast: control edges to the high-contrast value; hairlines thicken.
- Bold Text: widths grow; section 2.
- Haptics: `tap` on a choice; no success haptic on consent.
- Sound: none for any of these screens.

## 6. One-handed and 2 a.m. capture

One-handed: the capture cluster is at the bottom (64 pt, `target.capture`); the primary of every state screen is at the bottom of the content; sheets have the primary within thumb reach; "Close" is top right on a sheet and is reachable by swipe down and by the VoiceOver escape gesture, so nothing needs a stretch. At AX1 and up the primary scrolls, not pinned (rule 3 above), so a big text size costs a scroll, not a lost control.

2 a.m.: one tap from Home to Listen, no confirmation sheet before Start; the primer shows only once, on the very first Speak, not at night on a later one; dark theme colours never flash white on open (the bg is `#161412`; the first frame colour is a launch-screen concern, UNVERIFIED); haptics are `tap`; no sound; the screen does not ask a consent at night in the middle of capture (the analytics ask only on a calm tab root, never over Listen, Review, Write). The reminder's earliest time is 07:00 and the latest 21:30 (`reminderCopy.settings.quietHelp`), so no reminder lights the phone at 2 a.m.

## 7. Font errors: every place text can clip, truncate, overlap or break

A "font error" here means: the words are cut (ellipsis, clipped line, box too small), covered, a word split mid-word, or the text refuses to follow Dynamic Type. Found by reading `apps/mobile/src` on `develop` `55574906` for `numberOfLines`, `maxFontSizeMultiplier`, `allowFontScaling`, `fontSize` and `lineHeight` (48 hits; the hits are in the table or marked checked), and by measuring words against widths.

| Id | Where | What goes wrong | Evidence | Fix | Owner | Status |
|---|---|---|---|---|---|---|
| FE-1 | Tab bar labels, `(tabs)/_layout.tsx:66,71-75` | `tabBarAllowFontScaling: false`, `fontSize: tokens.minFontSize` (13), `lineHeight: 18`. The three labels stay 13 pt at AX5 while everything else is 3.571 times larger. It breaks `COMPONENTS.md` 0.1 ("never set `allowFontScaling={false}`"). Ruling 32 says the bar is unchanged and a T-MIN device spike decides. | READ | Add a `tabLabel` token with a cap (suggest 1.3, so 17 pt) and a line height from the token, not 18; give each tab the Large Content Viewer so a long-press shows it large (the iOS pattern for fixed chrome). Raise the exception with the CDesO against ruling 32. | `design-systems`, `mobile` | Needs a ruling. Large Content Viewer support in the RN tab bar: UNVERIFIED (my search was cut short for time). |
| FE-2 | Me tab bar title at AX5 | 44 pt bar, title about 61 pt: spills (NS-33 F-3). Present today with "Settings". | READ in `NS-33` | Cap the header title with a token (`barTitle`, 1.3) and wrap; show the Large Content Viewer | `design-systems` (spec), `mobile` | Known, unverified on a phone |
| FE-3 | `(tabs)/book.tsx:396` and `letter/[id].tsx:341` | `maxFontSizeMultiplier={1.3}` typed in the screen. The Book bar title is `headline` (token cap none) and the letter page `title2` (token cap 2.0). The caps are not in tokens, against "caps come only from tokens" (`text.tsx` header). | READ | One token `barTitle` with cap 1.3; the two screens read it. The title must wrap (`NS-33` 5.3: already holds the "no `numberOfLines`" rule). | `design-systems` | Not clipping today if it wraps; a cap with no home |
| FE-4 | `components/player/audio-player.tsx:211` | The time readout is `footnote` with `maxFontSizeMultiplier={2}`: at AX5 it stops at 28 pt while all else is 50 pt or more; "00:00 / 00:00" is a fixed string. | READ | Drop the cap; let it wrap onto two lines at AX1 and up ("0:12" over "of 3:25"); tabular figures stay | `design-systems`, `mobile` | Read, not measured |
| FE-5 | `app/listen.tsx:540` | The prompt is `numberOfLines={large ? undefined : 3}`. Below xxxLarge it is cut with an ellipsis after 3 lines. | MEASURED over the 115 library prompts, in Literata 24 pt, at 335 pt: at XXL (1.235) 3 prompts run past 3 lines; at XXXL 20 do (there the limit is off, so no cut); the longest prompt is 69 characters. So the cut happens at XXL only, for 3 prompts, and a parent sees "..." in the one line meant to be read in full. | Remove the limit at every size; let the prompt block grow and the lamp area scroll (the prompt is a question, never decoration). If the screen needs the room, use `adjustsFontSizeToFit`-free layout: scroll. | `mobile` | Measured with RN's non-AX scale table from memory (XXL 1.235, XXXL 1.353): ASSUMED, check on a phone |
| FE-6 | `components/book/book-cover.tsx:204`, `book-cover.logic.ts` | `maxFontSizeMultiplier={1}` and a fitted size down to a minimum; the logic returns `truncated` and `broken` flags. A long child name can be cut on the cover. The cover is a picture of a book, but the name is the parent's word. | READ | The accessible name carries the full name; the Book title ("{child}'s book") wraps in full at any size, so no letter text is lost. Check that the `truncated` case still shows the full name somewhere at scale. | `mobile` | UNVERIFIED on a phone |
| FE-7 | `review.tsx:1196` (view toggle) and `:1222` (fix row) | `numberOfLines` 2 and 1 below accessibility sizes. The fix row detail is a one-line preview, the whole text is in the row's label (`NS-33` R4, accepted there). The toggle label allows 2 lines. | READ | No change: checked, within `NS-33`'s rule (a preview whose whole text is in the accessible label). Keep the scan test. | | pass as documented, not run |
| FE-8 | Words longer than the line at AX5 | iOS does not hyphenate; a word wider than its box splits mid-word. MEASURED against the real strings: "Notifications" at body size is 348 pt (box 335), so any body-sized line that begins or holds that word breaks; at footnote (50 pt) it is 271 pt and fits. `reminders.priming.privacyLine` and `namesHelpOff` start with it. "everything" in the row "Erase everything on this phone" is 297 pt in a 265 pt row box (ASSUMED 70 pt reserved), and "messages" in "Month and birthday messages" is 266 pt: borderline. "microphone" at body size is 326 of 335 pt. | MEASURED (script, section 9). Box widths ASSUMED. | (a) Row titles go full width at AX1 and up, control below (rule 4); (b) help and footer lines stay at `footnote`, never body; (c) a content rule for `content`: avoid a word longer than 12 characters as the first word of a line in a title or button; (d) add a test that measures every string in `strings.en.ts` against 335 pt at AX5 and fails on a word over the box. | `design-systems`, `content`, `mobile` | Measured; (d) is a proposal |
| FE-9 | `app/(auth)/sign-in/code.tsx:53,288-298` | The code field is a single-line `TextInput` in `title1` size at its cap 1.8 (50.4 pt), Mukta SemiBold, tabular figures, letter spacing 6 hard-coded, `minHeight` 64, `paddingHorizontal` 16. A single-line input does not wrap: it scrolls sideways and the first digits slide out of view. | MEASURED: 6 digits 189 pt, 8 digits 253 pt, 10 digits 318 pt (digits plus 6 pt spacing each) against an inner width of 303 pt (335 less 2 times 16 padding, ASSUMED full width). So a 10-digit code does not fit at the cap, and the field cannot show what was typed. The longest code the field draws is 6 to 10 digits (`IDX E-S06`); the length the server sends is not checked here. | Reduce `letterSpacing` to 0 at AX1 and up (10 digits then 258 pt, fits), or drop the field to the `title2` ramp at AX1 and up; keep VoiceOver reading digit by digit. | `mobile` | Measured width; clipping on a phone UNVERIFIED |
| FE-10 | `components/child/date-field.tsx:92` (web) | A fixed `fontSize: 17` and `minHeight: 44` in an inline style: does not follow the browser's text size setting. | READ | Use `rem` from the token CSS vars | `design-systems` (web) | Read, not run |
| FE-11 | `plain-screen.tsx` and `plain-screen.styles.ts` | The crash and launch screens use the ramp tokens as plain styles and pass `maxFontSizeMultiplier` from the token (`0` means uncapped). | READ | No fault found: the crash title is `title2` at its token cap, the body uncapped. Checked. | | pass as read |
| FE-12 | Heading hierarchy at AX5 | Capped titles end up smaller than the body beneath them. MEASURED from `tokens.type` at 3.571: `title2` 22 pt times cap 2.0 is 44 pt; `title1` 28 times 1.8 is 50 pt; `display` 34 times 1.6 is 54 pt; `promptHero` 50 pt; body, headline and label 64 pt; callout 61 pt; subhead 57 pt; footnote 50 pt. A sheet title is smaller than its first paragraph. No clipping, but the title no longer reads as the title by size. | MEASURED | Needs a decision, not a bug fix: (a) raise caps so a title is at least body size at AX5 (title2 needs 2.92, which wraps long titles to 4 or 5 lines), or (b) keep the caps and hold the hierarchy by the serif face, weight, position and a heading trait. I recommend (b) with Bold Text kept, and a "title is at least as large as the largest text below it" rule is not adopted. The CDesO decides. | CDesO, `design-systems` | Decision open |
| FE-13 | Leading below the face's own height | Mukta's natural line is 1.662 em; `body` is 24/18 (1.33), `callout` 1.29, `subhead` 1.31, `footnote` 1.36, `caption` 1.31, `label` 22/18 (1.22), `labelSmall` 1.25, `headline` 1.28. Literata's is 1.485; `title2` 1.27, `title1` 1.21, `display` 1.21, `hero` 1.14. Latin text sets well at these; Devanagari with stacked marks (Tiro Devanagari Hindi is bundled, natural line 1.33, win 1.59) can touch the line above at 1.22 to 1.36. The UI is English only; parent-typed Hindi could appear in styles other than `letterBody` (1.6). | MEASURED (font tables). Rendering not seen. | Give `label`, `labelSmall` and `body` a minimum of 1.4 when the string contains Devanagari, or set a `lineHeightNonLatin` token; test with 20 real Hindi letters. | `design-systems`, QA | Risk, UNVERIFIED |
| FE-14 | Character budgets in copy | `children.add.ctaShort` is used "when the filled `cta` would pass 22 characters"; the outage button uses a "22-character form". A copy rule is doing the work of a layout that wraps. Long translations (German and Finnish run about a third longer than English: ASSUMED, not measured) will pass 22 and fall back to the short form, or clip if the short form is also long. | READ | Buttons wrap to 2 lines at every size (they do at AX5, MEASURED 2 lines for the new buttons); drop the 22-character rule when the second language ships; `content` keeps keys short anyway. UI is English only in the store profile (`eas.json`, `IA-FINAL` 2.1), so this is a plan, not a live bug. | `content`, `design-systems` | Plan |

## 8. Type scale gaps in `packages/design-tokens/src/tokens.ts` (TDD 09)

| Gap | Where | Effect | Proposal |
|---|---|---|---|
| No chrome style | tab bar label (13 pt, 18 pt line, no scale), header titles | Hard-coded in `(tabs)/_layout.tsx`; against "never hard-code a size" | add `tabLabel` and `barTitle` to `type`, each with `maxScale` and a line height (FE-1, FE-3) |
| `maxScale: null` on `headline`, `body`, `callout`, `subhead`, `footnote`, `caption`, `label`, `labelSmall`, `letterBody`, `signature`, `prompt`, `nameField` | `type` | Intended (D-027). A test proves reading and body text is never capped. No gap. | none |
| Capped titles smaller than body at AX5 | `hero` 1.6, `display` 1.6, `title1` 1.8, `title2` 2.0, `promptHero` 1.8, `numeral` 1.4 | FE-12 | a decision, not a patch |
| `letterDateline` cap 2.4 on a 14 pt style | 33.6 pt at AX5 | fine; smaller than body at AX5 by design (a date line) | none |
| No test for the AX5 size | `test/tokens.test.ts` has no AX5 case; the mobile test `a11y-ax5.test.ts` is the one named by `NS-33` and lives in `apps/mobile` (not run: not checked out) | A cap change would pass tokens tests and break AX5 | add a token test that computes every style's AX5 size and line height and fails if a capped style would have fewer than N chars per line at a minimum width, or at least records the table in FE-12 as a snapshot |
| Line heights are fixed numbers, not ratios | `ts(...)` | Right while RN scales `lineHeight` with the font. `scale` (Reading Size) in `text.tsx` multiplies both (READ). A custom style that sets `fontSize` but not `lineHeight` loses leading. | none now; add a lint for `fontSize:` without `lineHeight:` |
| Hard-coded sizes outside tokens | `code.tsx` (letter spacing 6), `date-field.tsx` (17, 44), tab bar (18) | FE-1, FE-9, FE-10 | read tokens |
| Status text pairs not tested | `TEXT_PAIRS` | section 3 | add `caution`, `success`, `recording`, `destructive`, `focus` on every surface in both modes, then decide pairs that fail |
| Contrast table for new role pairs | none needed for the proposed components | `Notice` and `PermissionPrimer` use existing roles | none |

## 9. What ran, and how the numbers were made

RAN (this session, sparse checkout of the #1033 head plus `packages/brand` and `packages/emails/src`; `vitest` 3 installed in a scratch folder outside the repo and linked in, removed at the end):

- `packages/design-tokens`: `vitest run`: 5 test files, 98 tests, 98 passed (`tokens.test.ts` 37, `atmosphere.test.ts` 32, `brand-parity.test.ts`, `fonts.test.ts` 6, `grain.test.ts` 3). First run, with `packages/emails` absent: 96 of 98, the 2 failures were missing files, not a token fault.

NOT run: `npm test` for the other workspaces (no install: the disk had about 700 MB free), `apps/mobile/test/a11y-ax5.test.ts` and every other mobile test, `packages/content/test/rules.test.ts` (this PR changes no content key), any device or simulator check, VoiceOver, Accessibility Inspector, Xcode, a contrast tool on a rendered screen.

MEASURED means: `opentype.js` read the bundled Mukta, Literata and Tiro files in `packages/design-tokens/fonts` and I summed advance widths at the AX5 size (base size from `tokens.type` times the cap or 3.571). Greedy line wrap, no kerning beyond the font's, no hyphenation. Contrast: the WCAG relative-luminance formula applied to the hex values in `tokens.ts`. Prompt lengths: all 115 `text:` strings in `packages/content/src/prompts.ts`, `{child}` replaced by "Asha". The scripts live outside the repo and are not part of the PR; any reader can redo it with `opentype.js`.

Limits of those numbers: box widths are ASSUMED (335 pt text, 265 pt beside a control); RN's non-AX scale values used for FE-5 (XL 1.118, XXL 1.235, XXXL 1.353) are from memory and need a phone check; the system font used by iOS headers (SF) was not measured, only the bundled faces.

Signed: `design-systems`, 20 Nov 2026.
