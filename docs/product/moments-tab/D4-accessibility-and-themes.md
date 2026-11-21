# Moments tab D4: accessibility, themes and device settings for the whole tab

Status: PROPOSED, 21 Nov 2026 (UTC). Author: design lead D4 of 5 (accessibility and themes), working under `docs/agents/` rules for `design-systems`. Docs only: this file changes no token, component or screen. Everything here is a requirement or a script, not a pass. Nothing was run on a phone or a simulator, and VoiceOver was not run. Evidence tags used below: READ (read in the repo this session, path given), MEASURED (computed from a file this session), ASSUMED (my number, said so), UNVERIFIED (not checked; needs a phone or an Apple page I did not read). The Moments name, the two parts and every parent-facing word here are PROPOSED; `content` clears words and a PROPOSED word does not ship.

## 1. Purpose and scope

The Moments tab is the default landing tab (founder, 20 Nov 2026, item 2). It shows our own value first, asks plainly for photo access, and then shows real things: For you and Recent. This file says how the whole tab works for every person: VoiceOver, the largest text, Bold Text, Reduce Motion, Reduce Transparency, Increase Contrast, light and dark, one hand on a small phone, and 44 pt targets.

It covers all states of the tab: the value state before permission (S0), the plain ask (S1), Not now (S2), limited access (S3), denied (S4), full access with For you (S5) and Recent (S6), a day opened (S7), loading and empty (S8), and the hand-off to the picker and to capture (S9). It does not decide the route (Apple's picker or our own PhotoKit read), the words, the layout or the motion design; those are other leads' files. Where those files are not on `develop` yet, I state an assumption (section 9) and say where I would reconcile.

The bar I hold to is the repo's: WCAG 2.2 AA, Apple HIG, Dynamic Type to AX5 with letter text never truncated (D-027), VoiceOver label and order, 44 pt targets, Reduce Motion and Reduce Transparency honoured, both themes, colour never the only signal (A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051). The release gate device is the iPhone SE 3 (375 by 667 pt).

## 2. Inputs read

| Input | Path or id | What I took from it |
|---|---|---|
| The brief of record | `/home/claude/moments-brief.md` | Decisions, constitution, privacy lines, what the screenshots are (not copied; I did not open them and no real name, place or business appears here) |
| Design language v2 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` (ADOPTED 21 Nov) | Content stays paper; glass only on navigation and controls, at most three; `glassFallback`; the screen gate; paper tab bar ships now; system tab bar and sheets wait for SDK 58 and device spikes; minimum iOS 17.0 (D-098); iPhone SE 3 is a release gate |
| Accessibility floor spec | `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` | Definitions of AX5 (font scale 3.571), accessibility sizes (AX1 and up, threshold 1.786, `useIsAccessibilitySize`), "control under 44 pt" counts frame plus `hitSlop`, "truncated" definition, one level 1 heading per screen |
| A11y and type audit | `docs/design/A11Y-AND-TYPE-AUDIT-20nov.md` | VoiceOver table form, AX5 layout rules 1 to 10 (everything scrolls, pairs stack, no `numberOfLines` at AX1 and up, a pinned primary only under a quarter of the viewport), evidence tags |
| TDD 09 | `docs/tdd/09-accessibility-design-system.md` section 8.3 | Test layers L0 tokens, L1 lint, L2 component, L3 visual regression, L4 `performAccessibilityAudit()`, L5 manual on D1 (iPhone SE 3); gates G0 to G4 |
| Tokens | `packages/design-tokens/src/tokens.ts` | `target` min 44, primary 56, capture 64, web 48; `highContrast` sets; `mediaFrame`; `motion.reduceMotion` fade 200 ms, `enter` dy 8 and 280 ms; contrast numbers in the comments |
| Shared components | `apps/mobile/src/components/ui/` (card, list-row, empty-state, state-screen, sheet, toast, choice-group, button, text) | What exists to reuse before building (section 4.9) |
| Home wheel and the other Moments docs | PR #1264 (`docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md`); privacy, feasibility and concept docs named in the brief | At write time `docs/product/moments-tab/` was empty on `develop`; open PRs on photo work are #836 to #840 (photo with a letter) and #754 (Memory Library engine). I did not find the privacy, feasibility or concept PRs. See section 9 |

## 3. Facts I rely on, and what I did not check

READ in the repo this session: AX5 font scale 3.571 and body 18 pt becoming 64.3 pt (audit section 2); iPhone SE 3 is 375 by 667 pt; the visible area at AX5 is about 560 pt (audit section 2, ASSUMED there); targets 44, 56, 64 (tokens); the dark layer step is 1.10:1 and v2 adds a `highlight` and a `glassFallback` that do not exist yet in `packages/design-tokens` (design language v2 section on tokens, A3); `mediaFrame` is `line` in light (1.26:1) and 8.01:1 in dark under Increase Contrast (tokens); the tab bar today is three items, Home, Book, Me, paper with a hairline (IA-FINAL section on tabs; ruling 32).

UNVERIFIED (I did not read an Apple page this session, so treat each as a thing to confirm on a device): the exact Settings paths for Bold Text, Increase Contrast and Reduce Transparency; whether the React Native version we ship reads Bold Text on iOS through `AccessibilityInfo.isBoldTextEnabled`; how VoiceOver reads a `radio`-like role in React Native; how Apple's journaling suggestions picker behaves for VoiceOver (it is Apple's UI, not ours; if Route A is chosen we can only test it, not change it); thumb reach figures for the SE 3 (I give a rule, not a measured zone).

## 4. Requirements

Test layers follow TDD 09: **L0** unit or token test in Node; **L1** lint or source-reading test; **L2** component render at default and AX5, light and dark; **L3** visual capture on the SE 3 and the largest iPhone; **L4** `performAccessibilityAudit()`; **L5** manual script on a real iPhone SE 3 (section 7). "Device" means L5 on hardware; simulator evidence is not device evidence and the evidence file must say which.

State names used: S0 value before permission, S1 ask, S2 Not now, S3 limited, S4 denied or restricted, S5 For you, S6 Recent, S7 day opened, S8 loading and empty, S9 picker and capture hand-off.

### 4.1 Reading order and structure (VoiceOver)

**MT-D4-R1. One heading, first.**
Given any state S0 to S8, when VoiceOver lands on the screen or I open the rotor on Headings, then the first heading in reading order is the screen title, there is exactly one level 1 heading, and every part title ("For you", "Recent", a day group) after it is level 2. On iOS the level is not read (React Native maps `role="heading"` to the Header trait and reads no level; NS-33 section 2, READ), so the test asserts the trait and the order, and the level is recorded from a rotor read on a device.
Layers: L1 (source asserts `asHeading`), L2, L5.

**MT-D4-R2. Reading order is visual order.**
Given the tab at default size, when I swipe right from the top, then the order is: title, the For you and Recent switch, the first card or day, each next one, then the tab bar last. In S1 to S4 the order is: heading, the reason in one or two sentences, the primary button, then the quiet button. Nothing is read twice and nothing visual is skipped. At AX5 when two controls stack, the order is the visual top to bottom.
Layers: L2, L4, L5.

**MT-D4-R3. The tab selected state.**
Given Moments is the default tab on cold start, when the app opens, then VoiceOver focus lands on the screen heading (not on the tab bar), and the tab is announced as selected with its position ("Moments, tab, 1 of 4" is read by the system for native tab items; for our paper bar it is a `tab` role with `selected` state and the position text is PROPOSED to match). The tab label is one word.
Layers: L2, L5.

**MT-D4-R4. Focus after every change.**
Given I act, when the result appears, then focus goes to a named place: after the system permission dialog closes, to the heading of the new state (S3 to S6); after Not now, to the heading of S2; after I switch For you or Recent, focus stays on the switch (its value change is announced by its selected state) and the list below is replaced; after the picker closes, to the control that opened it; after capture closes, to the control that started it; after a card is set aside ("Not for now"), to the next card, or to the heading if none is left. Focus is never lost to the top of the screen or to nothing.
Layers: L2, L5.

**MT-D4-R5. Switch for For you and Recent.**
Given the two parts, when VoiceOver reads them, then each is one element with a visible name, role button or radio (see open question Q4), `selected` state true or false, and a hint that says the result ("Shows moments that matter to you"; PROPOSED, `content` clears). The selected one is shown by weight and a check mark glyph as well as fill, so colour is never the only signal. Each has a 44 pt high target and the pair is one group.
Layers: L2, L3, L5.

### 4.2 Photo collages with no machine description

The constitution says the machine may not add meaning: no scene, place or person guess, no machine-written title or caption, and a title from Apple's picker is never stored or shown by us. So a collage of photos has no description we may write. The accessible name is built only from facts the person or the file already holds, in a fixed pattern, and from words the parent typed or chose.

**MT-D4-R6. The collage is one element in a list.**
Given a day in Recent or a cluster in For you shows a collage of several thumbnails, when VoiceOver reads the list, then the collage and its row are one element (a button), the thumbnails inside are hidden from VoiceOver in the list (not one stop per tile), and swiping through a long list costs one swipe per day, not four or six.
Layers: L1, L2, L5.

**MT-D4-R7. The name pattern.**
Given a day with photos, when VoiceOver reads it, then the name is the date in words, then what the parent gave it if anything, then the kind of media, in this order and nothing else:
- Date: "Tuesday 12 March" with the year only when it is not this year. A date is a fact from the photo's own metadata, shown on the phone only (ML-6 allows a date; it never allows a place or a thumbnail guess).
- Parent label: only text the parent typed or chose (a typed occasion, a Day they named, the child's name as they set it). If none, nothing is read. We never fill a gap with a guess.
- Media: "Photos" or "Photos and a video" (kind only, from the file type). No count of photos, so the list never reads as a tally (no counts, no gaps). A video length is allowed as a fact from the file ("video, 12 seconds"); content to clear (open question Q6).
- Never read: a place, a person other than a typed name, a scene, a time of day word like "evening outing" (that is a machine-made title), the filename, the album, the file size.
Example: "Tuesday 12 March, Photos and a video." With a parent label: "Tuesday 12 March, Asha's first swim, Photos." (The family in tests and fixtures is the fictional Asha.)
Layers: L0 (pure function `momentLabel()` in a `.logic.ts`, tested with Asha fixtures and a ban-list test: no place, no person, no scene word), L2, L5.

**MT-D4-R8. The hint says the result.**
Given a day, when the person rests on it, then the hint says what happens and not what the thing is: "Opens this day. You can start a letter from it." (PROPOSED; one verb per J1 to J10; `content` clears). The hint never repeats the name and never says "photo", "suggestion" or "recommended" in a way that implies we chose it for meaning.
Layers: L2, L5.

**MT-D4-R9. Custom actions, because swipe and long press are not the only way.**
Given a day or a card, when VoiceOver opens the Actions rotor, then it offers: "Start a letter" (default activate does the same only if the whole card is one primary action; see R24), "Choose photos" (to pick which ones go with a letter), and "Not for now" (set this one aside). Every action in the rotor is also a visible 44 pt button on the card or in its overflow menu, so a sighted person with Switch Control or Voice Control gets the same thing. No action exists only as a swipe or a long press.
Layers: L1 (custom action list equals visible actions), L2, L5.

**MT-D4-R10. Opened day (S7): each photo is named and ordered.**
Given I open a day, when VoiceOver reads the photos, then each photo is an image element in time order, named "Photo from Tuesday 12 March, 3:40 pm" or "Video from Tuesday 12 March, 3:40 pm, 12 seconds" (the time is a file fact; PROPOSED words), plus the parent's own label if they typed one on that photo. There is no "1 of 6". A photo the parent has chosen for a letter carries "Chosen" in words and a check glyph, not only a ring. Photos do not autoplay.
Layers: L0, L2, L5.

**MT-D4-R11. Do not read what you cannot know.**
Given a photo has no label and no machine description, when VoiceOver reads it, then it reads only the pattern in R7 and R10. We do not call an image-description service, and we do not use the system's own automatic image descriptions to write anything into our UI (VoiceOver can describe a photo to a person on its own; that is the system speaking to the person and we do not capture or store it). The only words read are ours (the fixed pattern) and the parent's. The parent can add their own words to a photo (a typed note) and then that note is read first. A copy line explains this in the product only if `content` asks for one; it is not required (open question Q7).
Layers: L1 (no network call in label code), L5.

**MT-D4-R12. Photos are content: never inverted, never described by colour.**
Given Smart Invert is on, when the tab shows photos, then photos are not inverted (React Native `accessibilityIgnoresInvertColors` on each image; UNVERIFIED on our RN version). Given a person who cannot see the photo, then no information is carried only by what is in the picture: every action and state around it is in text.
Layers: L1, L5.

### 4.3 Permission states

**MT-D4-R13. S0 value state: examples are named as examples.**
Given the person has not been asked, when the value state shows illustrated Asha examples, then each example carries the word "Example" in visible text (not colour, not a badge shape only) and in its accessible name ("Example: a day with photos and a letter"; PROPOSED), so a VoiceOver user never mistakes it for their own photos. Illustrations are either hidden from VoiceOver with the words carrying the meaning, or have a short label. The ask below is reachable without crossing more than the heading, one short value line per example and the buttons (the examples are at most three).
Layers: L2, L5.

**MT-D4-R14. S1 the plain ask, and S2 a comfortable Not now.**
Given the ask, when it shows, then there are two buttons of the same size, weight and tap area (both at least 56 pt high, same type size, Not now not dimmed); both are reachable by VoiceOver in order, Continue first then Not now; "Not now" has no hint of a penalty and no guilt language. The page says what is read, where it stays (on the phone), and that they can change this in Settings. It has the Shown, Records, Never and Decline lines for anything a person agrees to (COORDINATION section 10, PRIV-R21); those words are `content`'s and compliance's, and this file only requires they sit in reading order before the buttons and are plain text, not a link-only disclosure.
Layers: L2, L3, L5.

**MT-D4-R15. S3 limited, S4 denied: it still shows real things.**
Given limited, denied or restricted access, when the tab shows, then the tab is never empty and never a dead end: it shows For you (typed occasions, Days, month and age days, a year ago from our own letters, our written prompts) with a quiet line and a button: in S3 "Choose more photos" (opens the system picker); in S4 "Open Settings" (the system Settings app, then back). A status is never colour only: a glyph and words. The line is read as part of the page and announced once when it appears, polite. Never "you are missing out" or any count of what is not shown.
Layers: L2, L5.

**MT-D4-R16. The system permission dialog is Apple's.**
Given the system asks, when the dialog shows, then we do not try to restyle it, we do not read over it, and VoiceOver reads the system's own text; after it closes focus moves per R4. We do not ask twice in a row if the person chose Not now; a second ask is only from a button the person presses.
Layers: L5.

### 4.4 Dynamic Type to AX5 and Bold Text on an iPhone SE 3

Facts: at AX5 body is 64.3 pt and the visible area is about 560 pt, so about six lines of body (audit section 2, MEASURED there, not re-measured here). At 335 pt wide, about 10 characters fit on a line.

**MT-D4-R17. Everything scrolls, nothing is pinned that takes over.**
Given AX1 or larger on the SE 3, when any state shows, then the whole tab is one scroll; no fixed-height region holds text; a pinned control is allowed only if it takes under a quarter of the viewport (audit rule 3), so in S1 the two buttons scroll with the page from AX1 and sit last, stacked, Continue first. The tab bar is not part of this rule (it is the bar's own height; see R19).
Layers: L2, L3, L5.

**MT-D4-R18. Parent words are never truncated.**
Given a day carries a parent's typed label or a Day name, when it shows at AX5, then it wraps on as many lines as it needs, never `numberOfLines`, never an ellipsis, and no word is split mid-word because its box is narrower than the word (NS-33 R4 definition). A label word wider than the box (more than about 10 letters at AX5 on 303 pt of row width, audit rows) takes the full line width; `content` keeps typed occasion names short where it can (hand-off). The date line, the kind line and the buttons wrap too.
Layers: L1 (scan: no `numberOfLines` and no `ellipsizeMode` in Moments files), L2, L3, L5.

**MT-D4-R19. Layout switches at AX1, not AX5.**
Given `useIsAccessibilitySize()` is true, when a card or row has a control beside text, then the control moves under the text, trailing; two controls stack; the For you and Recent pair becomes two full-width rows (two segments at 167 pt wide each would split "Recent" at 64 pt type; ASSUMED width, MEASURED type from the audit); a day's compose button stays 44 pt and sits on its own line. Icons beside text scale to a cap of 1.5 times and drop to their own line (audit rule 7). Spacing between stacked controls is the same `space` token (audit rule 8).
Layers: L2, L3.

**MT-D4-R20. The tab bar at large sizes.**
Given AX5 or Bold Text, when the tab bar shows with four items (Moments, Home, Book, Me; order is a product decision, see Q1), then labels are single words, each tab is at least 44 pt wide and 49 pt or more tall (ASSUMED bar height; confirm against the built bar), label scale is capped by the bar's own cap (TDD 09 says chrome labels cap at 1.3 to 1.5), and a long press on a tab shows the system's large content viewer if the bar is the system bar (it is not for the paper bar; UNVERIFIED which we have on the day). A label never truncates: if "Moments" at the cap and Bold would not fit in about 93 pt (375 divided by four, ASSUMED), the label is allowed a second line or the word changes (hand-off to `content`).
Layers: L2, L3, L5.

**MT-D4-R21. Bold Text.**
Given Bold Text is on, when the tab shows, then every style that reads a weight follows it, no line breaks mid-word that did not at normal weight on the SE 3 at the same size, and the segmented selected state is still visible by glyph and weight. A part's heading in bold at AX5 still wraps whole.
Layers: L2, L3, L5.

### 4.5 Motion (Reduce Motion)

**MT-D4-R22. Reduce Motion replaces movement with a fade.**
Given Reduce Motion is on, when anything moves, then it cross-fades in 200 ms (`motion.reduceMotion`) instead: the content entrance in S0 (the v2 `heroEnter` of 12 pt and 420 ms becomes a 200 ms fade), a day's collage settling, switching For you and Recent, the prompt card refresh, the tab change, the hand-off to capture and back. No parallax, no stagger past a fade, no spring, no bounce on pull. Loading shows still, not shimmer (R30). Videos and Live Photos do not play on their own in any setting; with Reduce Motion they show the still, and playing is a button the person presses (also true with it off: no autoplay in the tab).
Layers: L1 (every Moments animation reads the Reduce Motion hook), L2, L3 (static capture), L5.

**MT-D4-R23. Refresh is a button, and it does not spin.**
Given the prompt card has a refresh control, when I press it, then it has a 44 pt target, a name that says the result ("Show another prompt"; PROPOSED), a cross-fade not a spin or a flip, and VoiceOver announces the new prompt once, polite. There is no pull-to-refresh on the list as the only way to refresh. We do not rate-limit it in a way that reads as a count or a penalty.
Layers: L2, L5.

### 4.6 Touch targets and one-handed reach

Rule: a person holds an iPhone SE 3 in one hand and reaches the lower two thirds with the thumb (a reach figure I did not measure; ASSUMED, check with the walk in W11). Left and right hands both count.

**MT-D4-R24. Targets, and the whole card is the action.**
Given any control in the tab, when I measure its accessibility frame (frame plus `hitSlop` counts for touch but the L4 audit reads the frame, NS-33 definition), then it is at least 44 by 44 pt; primary buttons are 56 pt (`target.primary`); the day's compose action is not a small corner button but the whole day row is the one primary action ("start a letter from this day") with an overflow for the secondary actions, so a thumb anywhere on the row does the main thing. Targets are at least 8 pt apart (`space[2]`), with no two small controls touching.
Layers: L1 (no touchable under 44 without `hitSlop` that reaches it), L2, L4, L5.

**MT-D4-R25. Reach.**
Given one hand on the SE 3, when I use the tab, then the primary action in S1 to S4 sits in the lower half of the page when the page fits and last in the scroll when it does not; the For you and Recent switch is at the top (it is used rarely) and has a second way to reach it; the sheet close and Done are where the thumb falls on a sheet; nothing needs a two-handed gesture, a long press, a drag or a pinch; the scroll can reach the end with a flick. The tab bar is at the bottom already.
Layers: L5 (hand test), L3.

**MT-D4-R26. No gesture without a button.**
Given swipe actions, drag to reorder, or long press are proposed, when they exist, then each has a visible control doing the same. Ban for this tab: swipe-only dismiss, long-press-only menus, pinch to zoom as the only zoom (a photo has a Larger button or the system zoom).
Layers: L1, L5.

### 4.7 Reduce Transparency

**MT-D4-R27. Glass is rare here, and has a solid form.**
Given Reduce Transparency, Increase Contrast, or iOS before 26, when any glass surface of ours shows in the tab, then it uses the solid `glassFallback` (v2 token, not in `packages/design-tokens` yet; it is added by the tokens work, T1, with its contrast pair tests; until then this requirement has no token to point at). The tab shows at most three glass surfaces and I recommend zero of our own: the Moments tab uses the paper bar now (v2: the paper tab bar ships now), content is paper, and the compose actions are inline paper buttons, so there is nothing for Reduce Transparency to change except a system sheet or bar that adapts itself and that we never paint. Text is never placed over a photo (R32), so there is no scrim to lose.
Layers: L0 (token pairs when `glassFallback` lands), L1 (count of glass components in the tab is at most three), L3, L5.

### 4.8 Contrast, Increase Contrast and the two themes

Numbers READ from `packages/design-tokens/src/tokens.ts` (the file's comments; the token test suite computes them): light text 14.00:1 on bg, textMuted 5.51:1, accent 5.50:1, success 5.29:1, caution 5.37:1; dark text 15.66:1, accent 8.37:1; `controlBorder` dark 4.47:1 on bg, light 3.62:1 on bg; Increase Contrast sets muted text to 8.10:1 light and 11.79:1 dark and accent to 7.79:1 and 10.58:1; the dark layer step `surfaceRaised` on `bg` is 1.10:1 today (v2 moves it to 1.18 and adds `highlight`).

**MT-D4-R28. Text is on paper in both themes.**
Given any text in the tab, when I measure it, then it is at least 4.5:1 on its own paper surface (body and label) and non-text parts that carry meaning (switch edge, selected state, check glyph, focus ring, an outline of a tile) are at least 3:1, in light and dark. The tab uses only existing text and surface pairs, so the L0 token suite covers it; any new pair (for example a parent label chip) is added to the tokens test before it ships.
Layers: L0, L2, L3.

**MT-D4-R29. Increase Contrast.**
Given Increase Contrast, when the tab shows, then it reads the `highContrast` set through `useTheme()`: muted text and accent get stronger, hairlines become control strength, and each photo and collage tile gets the `mediaFrame` outline (which becomes `line` strength under Increase Contrast: 8.01:1 on dark bg). A card's edge, the selected switch part and the focus ring are visible without relying on shadow. Disabled-looking states do not exist for Not now. Verify both themes.
Layers: L0, L2, L3, L5.

**MT-D4-R30. Dark mode: layers separate, photos do not glare.**
Given dark mode, when the tab shows, then cards separate from the page by the v2 surface step plus the `highlight` top edge and a hairline (today's 1.10:1 step alone merges them; v2 finding A3), photos are not dimmed or tinted by us (they are the person's), a white-background photo gets the `mediaFrame` hairline so its edge is seen. A very bright photo next to dark paper is a check in the walk (W6), not something we alter. No glass tint colours the content layer.
Layers: L3, L5.

**MT-D4-R31. Colour is never the only signal.**
Given selected, chosen, set aside, permission status and recording, when I look in greyscale (the Color Filters setting), then each state has a glyph or words as well. Terracotta keeps meaning recording only (v2); the Moments tab does not use it for a chosen photo or an alert.
Layers: L3, L5.

**MT-D4-R32. No text over photos.**
Given a collage or a photo, when it shows, then no text, no date chip, no duration badge and no button is drawn over the image: the date, the kind and the video length sit below on paper. (This removes every photo-contrast and Reduce Transparency problem at the source, and it is why a photo needs no scrim.) The one exception is the system's own controls in the system picker, which we do not draw.
Layers: L1 (no absolutely positioned child over an image in Moments files), L3.

### 4.9 States that move or wait

**MT-D4-R33. Loading, empty and error are spoken once and never nag.**
Given photos are still loading, when the tab shows S8, then a still placeholder block (no shimmer under Reduce Motion, and I recommend no shimmer at all) with the words "Looking through your photos" (PROPOSED), announced once, polite, and the completion is announced only if the content changed ("Moments ready" is not required; the list appearing is enough). A load error is a line with a button "Try again" (an existing common string), not a red banner. An empty Recent is warm words and never a count of missing days or a gap ("Celebrate what exists; never count gaps"). Loading never blocks the tab bar.
Layers: L2, L5.

**MT-D4-R34. Reuse before building.**
Given the shared components, when Moments is built, then it uses `Card`, `ListRow`, `EmptyState`, `StateScreen`, `Sheet`, `Toast`, `ChoiceGroup` and `Button` from `apps/mobile/src/components/ui/` (READ: they exist and `ListRow` already turns into a column at accessibility sizes), and adds only: a `MomentRow` (one element, the R7 label, the R9 actions), a `Collage` (decorative tiles, hidden in lists), and a `PartSwitch` (R5, R19). Each new piece gets an entry in `docs/design/COMPONENTS.md` and its tests. No colour, size or duration is hard-coded; tokens only.
Layers: L1 (raw colour ban), L2.

## 5. Edge and unhappy paths

- A day has one photo, or six, or a hundred: the label is the same (no count), the collage shows at most the tiles the layout allows, and the opened day (S7) is a scrolling list.
- A photo cannot be loaded (iCloud original not on the phone, a deleted photo): the tile shows a plain paper block with the kind in words; the label is unchanged; no error banner per tile. UNVERIFIED how Route B surfaces this.
- Access is changed in Settings while the app is open: on return the tab re-reads the status and moves focus to the heading of the new state (R4). It never shows the old state.
- A parent label is very long or is a single long word: wraps, full-line width, never truncated (R18).
- Two people in the house with different settings: nothing is stored about a setting; the tab asks the system each time.
- Voice Control: every visible control has a visible name that is also its accessible name (WCAG 2.5.3), so "Tap Not now" works; the whole-day row is named by its date, so "Tap Tuesday 12 March" works. Photos with no visible label are reachable by "show numbers" (system feature; UNVERIFIED on our build).
- Switch Control and Full Keyboard Access: all targets are reachable in visual order; no focus trap in a sheet; Escape or Close dismisses (L5).
- Landscape is not an accessibility fix and no state relies on it.
- Route A (Apple's picker): the picker is Apple's UI; VoiceOver in it is Apple's behaviour and is not ours to fix, only to test (W9). Our responsibilities stop at the control that opens it and the focus on return. If Route A is chosen, S3 and S4 are replaced by "the app only sees what you pick" and the permission-state requirements R13 to R16 collapse (no library permission); R1 to R12 and R17 to R34 still hold for what we show.
- If a machine-made title from the system's picker is ever handed to our code, we do not show it, do not store it and do not read it (brief; constitution). The label pattern in R7 is the only source.
- Time and date: the date words use the person's own language and calendar setting; right-to-left and Hindi are P2 and not designed here.

## 6. Constitution, privacy and accessibility checks

- Constitution: no machine title, caption, summary or story; no scene, place or person guess; no face matching (R7, R11). The label is built from dates and file kind, which are facts, and from the parent's own words. No counts, gaps, streaks, points or badges (R7, R33). Nothing implies AI writes anything. Never gender the child: use `{child}`.
- Privacy: no photo, filename, album, place or date in analytics, logs or crash reports. This applies to accessibility too: do not log the VoiceOver label, do not send "VoiceOver on" or any setting as an analytics property (a setting is a personal fact). Label code lives in a pure function and is never logged (L1 test: no logging call in `momentLabel`). Nothing leaves the phone from the library.
- Accessibility floor: 44 pt, AX5 with no truncation (D-027), Reduce Motion, Reduce Transparency, Increase Contrast, light and dark, colour not alone: R17 to R32.
- Agreement lines (PRIV-R21, COORDINATION section 10): the plain ask in R14 needs Shown, Records, Never and Decline lines in the product's words. Shown: the photos on this phone that you can see now, on this screen. Records: that you chose Continue or Not now, on this phone (the permission state itself is the system's). Never: sent off the phone, read by a person at the company, used to write words for you. Decline: Not now; you can still use everything else and change this in Settings. These are a design-side draft for `content` and compliance to replace, PROPOSED.
- Written content rules (enforced): this file has no em dashes, en dashes, curly quotes, ellipsis characters or emoji, and no model names.

## 7. Walk script: a tester runs this on a real iPhone SE 3

Run on a release candidate on hardware, not a simulator. Use the fictional family Asha only: a test Apple ID with a library of stock pictures and no real faces or places. Log "device" or "simulator" on every line of the evidence file. Time: about 40 minutes. Start each walk from a fresh install, with the permission state the line says (Settings, Privacy and Security, Photos, to reset). Evidence: a screen recording with VoiceOver speech on, plus a pass or fail per step.

Setup once: Settings, Accessibility, Display and Text Size, Larger Text on, slider to the end (AX5); Bold Text on for W3; Increase Contrast and Reduce Transparency on for W5; Reduce Motion on for W4; VoiceOver on for W1 and W2; appearance light then dark (Control Centre). Paths are UNVERIFIED: use Settings search if one is not found.

| Id | Settings | Steps | Pass when |
|---|---|---|---|
| W1 | VoiceOver, default size, light, never asked | Cold start. Wait 3 seconds. Swipe right through every element to the tab bar. Then rotor to Headings and flick down. | Focus starts on the heading. One heading first. Examples are read starting with "Example". The two buttons come last before the tab bar, in order, Continue then Not now. Nothing is read twice. No silent element. |
| W2 | VoiceOver, S1 to S6 | Double tap Continue. Hear the system dialog. Choose "Select Photos" (limited), choose three. Come back. Then Settings, change to Full, return. Then Settings, change to None, return. | After each change focus lands on the new heading, the page is not empty, the quiet line is read once, the Settings button works and returns. A day row is read as date, then the label if any, then kind: for example "Tuesday 12 March, Photos." No place, no person, no count. Rotor Actions shows Start a letter, Choose photos, Not for now. |
| W3 | AX5 and Bold Text, light | Visit S0, S1, S3, S4, S5, S6, S7. Scroll each to the end. Switch For you and Recent. Type a long label word, for example a 14-letter word, on one Day and view it. | Nothing is cut, no ellipsis, no word split mid-word, no overlapping. Buttons are stacked and reachable. The switch pair is stacked and the selected one shows a check. The tab bar labels read whole. Count the scroll distance to Continue and write it down. |
| W4 | Reduce Motion on, default size | Open the tab, switch parts, press refresh on the prompt card, open a day, start a letter and go back, change tabs, rotate through Home and Book. Try to start a video. | No slide, bounce, spring, spin or parallax anywhere; changes cross-fade; refresh does not spin; no video or Live Photo plays by itself; a play button does. |
| W5 | Reduce Transparency and Increase Contrast on, light and dark | Visit every state. Look at every card edge, every photo, the switch, the tab bar. | Any glass of ours is solid. Edges and photo frames are visible. Muted text is darker (light) or lighter (dark) than before. Focus ring visible when using a keyboard if attached. Nothing is placed over a photo. |
| W6 | Dark mode, default size | Visit S0, S5, S6, S7 with a bright photo and a dark photo. | Cards separate from the page. A bright photo has an edge. The pages do not glow or flash on switching theme. |
| W7 | Greyscale (Color Filters) and default | Visit each state, look for the selected part, the chosen photo, the status. | Each state is still told apart. |
| W8 | Default, one hand | Hold the SE 3 in the right hand and then the left, only the thumb, no support hand. Do: reach Continue and Not now, switch parts, open a day, start a letter, set one aside, go back, change tab. | All possible without moving the grip or using the other hand. Note any control the thumb cannot reach. |
| W9 | VoiceOver, picker | Press Choose photos (or the Route A control). Pick two, press Done. Cancel once. | Opening is announced, focus returns to the control that opened it, the pick is acknowledged in words ("Chosen"), cancel loses nothing. If it is Apple's UI, record how VoiceOver behaved and that it is Apple's. |
| W10 | VoiceOver, Voice Control | Say "Tap Not now", say "Tap" plus a day's date, say "Show numbers". | Visible names work as commands. |
| W11 | Switch Control or Full Keyboard Access | Move through every control with a switch or keyboard, in S1, S5, S7. | Order is visual. No trap. Close works. |
| W12 | Touch accessibility | Open Accessibility Inspector on a Mac with the phone, or the XCUITest audit (L4), on S0 to S7 at default and AX5. | The audit shows no missing label, no hit region under 44, no clipped text, no contrast issue. |

Failing a step on the SE 3 blocks the build; a pass on a simulator is not a pass for W1, W2, W5, W8, W9, W10 or W11 (these need hardware).

## 8. Requirements table

| Id | Short rule | Layers | Gate |
|---|---|---|---|
| MT-D4-R1 | One heading, first; level 2 for parts | L1, L2, L5 | G0, G3 |
| MT-D4-R2 | Reading order equals visual order | L2, L4, L5 | G0, G3 |
| MT-D4-R3 | Default tab focus and selected state | L2, L5 | G3 |
| MT-D4-R4 | Focus goes to a named place after every change | L2, L5 | G3 |
| MT-D4-R5 | For you and Recent: state not colour, 44 pt | L2, L3, L5 | G0, G3 |
| MT-D4-R6 | A collage is one element in a list | L1, L2, L5 | G0 |
| MT-D4-R7 | Label from date, parent words and file kind only; no count, place, person or scene | L0, L2, L5 | G0 |
| MT-D4-R8 | Hint says the result | L2, L5 | G3 |
| MT-D4-R9 | Custom actions each also a visible button | L1, L2, L5 | G0 |
| MT-D4-R10 | Opened day: each photo named, in time order, no "n of m" | L0, L2, L5 | G0 |
| MT-D4-R11 | No machine description; no network call in label code | L1, L5 | G0 |
| MT-D4-R12 | Smart Invert ignores photos; nothing only in the picture | L1, L5 | G0 |
| MT-D4-R13 | Examples named "Example" in text and accessible name | L2, L5 | G0 |
| MT-D4-R14 | Ask and Not now equal, plain, agreement lines before buttons | L2, L3, L5 | G3 |
| MT-D4-R15 | Limited and denied still show real things | L2, L5 | G3 |
| MT-D4-R16 | System dialog untouched; no second automatic ask | L5 | G3 |
| MT-D4-R17 | Whole tab scrolls; pinned control under a quarter | L2, L3, L5 | G0, G3 |
| MT-D4-R18 | Parent words never truncated at AX5 | L1, L2, L3, L5 | G0, G3 |
| MT-D4-R19 | Layout switches at AX1; pair stacks | L2, L3 | G0 |
| MT-D4-R20 | Tab bar fits at AX5 and Bold; labels whole | L2, L3, L5 | G3 |
| MT-D4-R21 | Bold Text honoured, no mid-word break | L2, L3, L5 | G3 |
| MT-D4-R22 | Reduce Motion fade 200 ms; no autoplay | L1, L2, L3, L5 | G0, G3 |
| MT-D4-R23 | Refresh is a 44 pt button, no spin | L2, L5 | G3 |
| MT-D4-R24 | 44 pt targets; whole row is the action; 8 pt apart | L1, L2, L4, L5 | G0, G3 |
| MT-D4-R25 | One-handed reach | L3, L5 | G3 |
| MT-D4-R26 | No gesture without a button | L1, L5 | G0, G3 |
| MT-D4-R27 | Solid `glassFallback`; zero own glass recommended; at most three | L0, L1, L3, L5 | G0, G3 |
| MT-D4-R28 | 4.5:1 text, 3:1 non-text, both themes | L0, L2, L3 | G0 |
| MT-D4-R29 | Increase Contrast set and `mediaFrame` outline | L0, L2, L3, L5 | G0, G3 |
| MT-D4-R30 | Dark: layer step plus `highlight`; photos untouched | L3, L5 | G3 |
| MT-D4-R31 | Colour never the only signal | L3, L5 | G3 |
| MT-D4-R32 | No text, chip or button over a photo | L1, L3 | G0 |
| MT-D4-R33 | Loading, empty and error: one polite line, no shimmer, no counts | L2, L5 | G3 |
| MT-D4-R34 | Reuse shared components; new ones documented and tested | L1, L2 | G0 |

Gates are TDD 09: G0 PR, G2 internal TestFlight, G3 external TestFlight, G4 submission. Rows that need hardware run at G3 and G4.

## 9. Assumptions, and where I would reconcile

- The concept doc (`docs/design/MOMENTS-TAB-CONCEPT-21nov.md`) was not found at write time (I looked on `develop` and in the open PR list for #836 to #840, #754 and #1264 only; I did not find the three docs named in the brief). I assumed: collage rows in Recent, a segmented switch, prompt cards with a refresh control in For you, inline compose, no map tile, no floating control. If the concept uses a floating glass compose button or a place line, reconcile R9, R24, R27 and R7 (the place line would break the constitution check, not just access).
- The privacy and constitution doc: if it allows a time-of-day word or a place, R7 changes; my default is no (machine-made titles are banned by the brief).
- The feasibility doc: route A or B decides R13 to R16 and the picker behaviour in W9.
- Reconcile in the integrator pass; I will not edit the other leads' files.

## 10. Open questions, with my recommended default and a deadline

| Id | Question | Recommended default | Owner and deadline |
|---|---|---|---|
| Q1 | Four tabs on the paper bar change the three-tab ruling and make each tab about 93 pt wide at 375 pt; where does Moments sit in the order? | First, because it is the default tab; Home second. Check label fit at AX5 and Bold in W3 | Founder (reversal list); before the concept is frozen, 24 Nov |
| Q2 | Does the day row use the whole row as one action, or a visible compose button? | Whole row plus overflow (R24), because a small corner compose button is hard to hit with a thumb and is easy to miss under 44 pt (I did not open the screenshots; the brief describes a small compose button) | D1 or D3 with me; 25 Nov |
| Q3 | Do we add a date, or only a date and the kind, to the label? | Date and kind only (R7) | CPO and `content`; 25 Nov |
| Q4 | Radio or button role for For you and Recent? | Button with `selected` state, named group; confirm how VoiceOver reads it in W2 | Me with `mobile`, at the first device build |
| Q5 | Should the tab bar be the system bar on this tab? | No; paper bar ships now, system bar after SDK 58 and its spike (v2) | Settled by v2 |
| Q6 | May a video length be read ("12 seconds")? | Yes, as a file fact, with no count of photos | `content`; 25 Nov |
| Q7 | Do we tell VoiceOver users, in one line, that we do not describe photos? | Not on the screen; a line in the help only if `content` wants it | `content`; 28 Nov |
| Q8 | Which first-run behaviours change if the tab is the default? (K-02 reversal) | Out of my scope; the ask in S1 must not appear during first run | Founder; 24 Nov |

## 11. Dependencies

- Tokens: `glassFallback`, `highlight` (v2 T1) and the dark surface step. Without them R27 and R30 cannot be tested.
- Components: `MomentRow`, `Collage`, `PartSwitch` (mobile, D2 or D3 specs).
- Words: `content` for every PROPOSED string and the label pattern in R7 and the agreement lines in R14.
- Compliance and privacy: the agreement lines, and a check that no label, setting or date reaches logs.
- QE: a new manual script `docs/qa/manual/V-moments.md` from section 7 (I did not create it; it is a file outside my assignment); the L4 audit routes to cover S0 to S7.
- Mobile: a pure `momentLabel()` function and its fixtures; the Reduce Motion, Bold Text and accessibility size hooks (`lib/a11y.ts`).
- The tab bar: the paper bar's height and its label cap (confirm in W3).

## 12. VERIFIED, UNVERIFIED, guesses

VERIFIED (read this session, in the cloned repo at `develop`): the brief; `docs/design/DESIGN-LANGUAGE-V2-21nov.md` (rules, tokens table, tab bar and sheet spike criteria, minimum iOS 17.0); `docs/design/A11Y-AND-TYPE-AUDIT-20nov.md` sections 0 to 3 (scale, layout rules, row widths); `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` section 2 (definitions); `docs/tdd/09-accessibility-design-system.md` section 8.3 (test layers); `packages/design-tokens/src/tokens.ts` (targets, motion, high contrast and the contrast numbers in its comments); the list of files in `apps/mobile/src/components/ui/`; `docs/design/IA-FINAL-20nov.md` (three tabs). I did not run the token tests.

UNVERIFIED: every Apple behaviour (Settings paths, VoiceOver reading of roles, the system picker's accessibility, the large content viewer, `accessibilityIgnoresInvertColors` on our React Native, Voice Control "show numbers"); whether `ListRow` and the paper tab bar behave as I describe at AX5 on a phone; the thumb reach on an SE 3.

Guesses (marked ASSUMED above): a four-tab width of about 93 pt; a tab bar height of 49 pt; two segments of 167 pt; the visible area about 560 pt (from the audit's own assumption); that Moments needs no floating control.
