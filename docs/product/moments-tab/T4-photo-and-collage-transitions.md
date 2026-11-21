# T4: Photo detail, collage expand and card stack transitions (Moments tab)

Status: PROPOSED. Docs only. Nothing here is decided, built, or recorded in `DECISIONS.md`. Author: transition lead T4, 21 Nov 2026. Branch `wip/moments-t4`. Fictional family: Asha only. Public name: `{app}`. Child: `{child}`. Words in quotes are intent for `content`, never final copy, and a PROPOSED word does not ship.

Ids: requirements are `MT-T4-Rn`. Test layers: U (unit, a `.logic.ts` timeline or reducer), C (component), D (device, a real iPhone), A (accessibility audit by hand), R (review by a person).

## 1. Purpose and scope

Moments is a tab of days built from the parent's own photos and words. This file says how the pictures and the cards move. It covers:

1. A collage tile growing into one full photo, and back.
2. Swiping between the photos of one day.
3. Pinch and double tap to zoom.
4. A video poster becoming a playing video.
5. A day expanding to show all its photos, and a month group collapsing and opening.
6. Pull to refresh, and how it feels without a spinner word or a count.
7. A placeholder becoming a thumbnail.
8. How a card is set aside ("Not now"), and Undo.
9. VoiceOver focus across every one of these.
10. Reduce Motion variants, memory, and 120 Hz.

Not here (other leads own them): the tab bar and tab switch, the permission ask, the nudge words, the card anatomy itself (design concept section 6), the card enter stagger on first load beyond what I cite, and Home's capture screens. Where I disagree with a ruling I say so and mark it.

Motion law that binds this file: `docs/design/MOTION.md` principles 1 to 6 (interruptible, controls never animate in, quiet joy), and the rule that nothing in a transition may suggest the machine is writing or choosing. The Moments tab adds no new motion for its own sake: every movement here answers a finger or a real change of state.

## 2. Inputs read

Read this session, from a plain clone of `develop` at `fb29507` (VERIFIED by file read):

| Input | Path | What I took |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` | Constitution, no machine title or guess, nothing leaves the phone, v2 design rules, reversal register |
| Motion system | `docs/design/MOTION.md` (v0.2) | Principles, `useMotion()`, section 4 Reduce Motion rule, 5f card to page (measured rect, veil, hand-off), 5i sheets, `tokens.motion` |
| Motion tokens | `packages/design-tokens/src/tokens.ts` lines 303 to 380 | `snappy`, `standard`, `gentle`, `fadeMs` 200, `exitMs` 160, `enter` 8 pt 280 ms, `staggerMs` 30 and `staggerMax` 6, `sequenceMaxMs` 900, `hardCeilingMs` 2000, `swapMs` 150, `press`, `cardToPage`, `lamp.leaveMs` 160 and `lamp.returnMs` 280 |
| Design language v2 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | Glass on controls only, at most three glass surfaces, `glassFallback`, iOS 17 minimum (D-098), the screen gate |
| Concept | `origin/docs/design-moments-tab-concept-21nov` (PR #1270, `docs/design/MOMENTS-TAB-CONCEPT-21nov.md`) | Card anatomy (section 6), hand-off (7), loading rule (9 table), VoiceOver (13.3), motion (13.4), reversals R-1 to R-12 |
| Feasibility | `origin/docs/mobile-moments-tab-feasibility-21nov` (PR #1269, `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md`) | Route A and B, native thumbnail view, no image bytes over the bridge, no per-asset retention, iCloud thumbnail with network off, spike D3 and D4 |
| Privacy read | PR #1267 (`docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md`) | I did not open it in full this run. I rely on NS-51 and the concept's quotes of it, and mark that where it matters |
| Photo moments PRD | `docs/product/prd/27-photo-moments-and-media.md` (NS-51, NS-52) | R5 dates and identifiers only, R6 at most 30 moments each with at most 6 identifiers in one excluded-from-backup file, R9 sheet, R21 iCloud plain box, R25 app-switcher box, R26 nothing leaves the phone; NS-52 video poster, tap to play, 60 s and 2 videos per letter defaults (ASSUMED) |
| Viewer spec for letters | `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` lines 276 to 300, 548 to 575, 502 to 527 | `MediaViewer`: black fixed surface, swipe between, Close, pinch and double tap, no share or save, play button 56 pt, previous and next buttons 44 pt, Reduce Motion no zoom animation, VoiceOver "Photo 2 of 8" adjustable, `colors.viewer` proposed |
| Card to page | `apps/mobile/src/components/motion/card-transition.tsx`, `apps/mobile/src/lib/transitions.logic.ts` | The one existing measured-rect transition I reuse as a pattern |
| Undo | `apps/mobile/src/components/book/undo-toast.tsx`, `docs/design/COMPONENTS.md` 2.14, the QuietDayRow line (234) | Undo toast never times out; long press or VoiceOver action with Undo is the house pattern |
| Haptics | `docs/design/COMPONENTS.md` 0.2 | Five intents only; none on scroll, tabs or sheets |
| App config | `apps/mobile/app.config.ts` line 244 | `CADisableMinimumFrameDurationOnPhone: true` is set |
| Package list | `apps/mobile/package.json` | `expo-image`, `expo-video` and any list library (FlashList) are NOT dependencies today (grep returned nothing) |
| Apple, ProMotion | https://developer.apple.com/documentation/quartzcore/optimizing-iphone-and-ipad-apps-to-support-promotion-displays.md (fetched) | See section 11 |
| Expo Image v57 | https://docs.expo.dev/versions/v57.0.0/sdk/image.md (fetched) | `placeholder`, `placeholderContentFit`, `transition`, `cachePolicy` default `disk`, `recyclingKey`, `allowDownscaling`, `alt` |
| Expo Video v57 | https://docs.expo.dev/versions/v57.0.0/sdk/video.md (fetched) | No poster prop; `onFirstFrameRender`; `useVideoPlayer` cleans up on unmount; `audioMixingMode` |

Not read: the founder's screenshots (I did not open them and nothing here copies them), Apple's picker pages, the open PR #1264, the privacy doc (above), Apple HIG pages on refresh controls, Photos-style zoom or accessibility. I make no claim about what any other app does.

## 3. The pattern in one page

Three pictures-in-motion, one rule each.

1. **A picture that opens is the same picture, closer.** The tapped tile is measured on touch-down (the `CardSource` pattern of MOTION 5f). The viewer is a route with `presentation: 'transparentModal'` and `animation: 'none'`, and it draws its own grow. The tile's thumbnail is already decoded, so the first frame of the viewer is that same thumbnail. The sharp picture arrives after it by a 200 ms cross-dissolve, never a swap.
2. **A card that goes away is put aside, not deleted.** It fades over `exitMs`, the cards under it close the gap on `standard`, and an Undo toast stays until the parent acts. No word says why, no count changes, nothing is learned.
3. **A group that opens pushes the page, not the eye.** The header stays where the finger was; only what is below it moves.

Everything else is the same three ideas at other sizes.

## 4. Requirements: the viewer

Common frame for R1 to R8. The viewer is the `MediaViewer` of `MEMORY-LIBRARY-FLOWS` (NEW, spec only, not built). This file adds the Moments sources (a day's photos from the phone) to it and does not replace its letter use. If the two files differ, the viewer spec in `MEMORY-LIBRARY-FLOWS` wins for letters and I mark each difference.

### MT-T4-R1. Tile to full photo (open)
- Given a day card whose tiles have loaded their thumbnails, when the parent taps a tile, then the viewer opens on that photo: the veil of black (`colors.viewer`, PROPOSED token, section 12) comes up over `fadeMs`, linear, while the photo grows from the tile rectangle to its fitted rectangle on `standard`, and no frame shows an empty viewer.
- The photo is fitted and never cropped in the viewer (the existing picture rule in `tokens.ts`), while the tile is a fixed centre crop. So the grow is a **reveal, not a stretch**: the picture is laid out once at its fitted final rectangle, scaled to cover the tile at the start, and an overflow mask the size of the tile grows to the fitted rectangle. The bitmap is never non-uniformly scaled. The mask frame animates in layout, which MOTION 5f allows only for a surface with no children; here the mask has one child, so this is a **new exception** for `design-systems` to rule on. If the mask cannot hold a frame budget on the oldest supported phone (D3 spike), the fallback is the 200 ms hand-off of R2.
- The tile keeps its press feedback (`press.cardScale` 0.98 on `snappy`) until the grow starts, the same hold as 5f, so nothing snaps at the release.
- While the grow runs, the tile it came from is hidden (not duplicated), so the parent never sees two copies.
- Then the chrome is already there: Close and the position text are opaque and hittable from frame 1 (principle 2). They do not fade in.
- Test layer: U (the timeline is data, like `CARD_TO_PAGE`, stepped ms by ms on three phone sizes), D (hitches, section 11).

### MT-T4-R2. Open without a measured tile (hand-off)
- Given the tile is not measured, is still a placeholder (not yet loaded), has scrolled off, the column or type size differs, a deep link opened the viewer, or Reduce Motion is on, when the viewer opens, then nothing moves: one `fadeMs` hand-off (the Moments screen under the black veil, then the photo fades in over its last 120 ms), the same shape as `CARD_TO_PAGE.handOff` in 5f. Straight lines, so nothing loses more than half its strength in 50 ms.
- Test layer: U, A (Reduce Motion on).

### MT-T4-R3. Full photo to tile (close)
- Given the viewer is open, when the parent taps Close, presses the system back or Escape key, performs the VoiceOver escape gesture, or drags down past the release point, then the photo is carried back to the tile it came from if that tile is still on screen, else to the nearest card edge, else the R2 hand-off. The black veil lifts last, on a straight line over `lamp.returnMs`.
- Drag down: the photo follows the finger one to one; the black veil weakens with distance; release past the point (PROPOSED: a downward travel of one third of the viewer height, or a downward velocity the system gesture handler reports as a flick; `mobile` tunes on device) closes; below it the photo springs home on `snappy`. The spring starts from the current value (interruptible, principle 4). A second finger down at any time cancels the drag and becomes a pinch.
- When the photo is zoomed in (R5), a drag pans; it never closes. Close works.
- Test layer: U (release rule as a pure function), D, A.

### MT-T4-R4. Swipe between photos of one day
- Given the viewer shows photo 2 of a day, when the parent swipes sideways, then the next photo follows the finger, the one-to-one drag settles on `standard`, and the neighbours are already decoded at screen size (R16). No page transition animation is added on top; the finger is the animation.
- The set is **exactly the photos the card shows** (up to four, in the card's order, which is capture time) and no others. So the viewer cannot reveal a number the card hides (concept section 6: no counts). If the day is expanded (R9), the set is the photos visible in the expanded grid. See open question OQ-T4-3 for the hand-off set.
- At either end the pager rubber-bands and stops; it never wraps.
- Chrome stays on screen on every page (no tap to hide chrome: a hidden Close is a hidden exit, and "controls never animate in").
- Previous and Next buttons (44 pt, `glass` over media per the v2 `material.overMedia`, solid `glassFallback` under Reduce Transparency, Increase Contrast and iOS before 26) are present when VoiceOver, Switch Control, Full Keyboard Access, Reduce Motion or an accessibility text size is on, and not otherwise. Glass count on this screen: Close, Previous, Next, which is three, the maximum.
- Test layer: C (pager logic), A, D.

### MT-T4-R5. Pinch, double tap and pan
- Given a photo in the viewer, when the parent pinches, then the photo scales under the fingers about the pinch centre, one to one, with a floor of fit size (it never shrinks below fitted) and a ceiling PROPOSED at four times the fitted size, a number for `mobile` to tune on device (not measured, not taken from any source).
- Double tap toggles between fitted and a mid zoom about the tap point on `snappy`. Under Reduce Motion the double tap jumps to the end state and cross-fades nothing: a zoom is a direct gesture, so pinch stays one to one; only the animated double-tap zoom is removed (it is movement the parent did not drive frame by frame).
- When zoomed past fit, a sideways drag pans the photo; at the photo's edge it hands the drag on to the pager only after the finger lifts and swipes again (no accidental page change while inspecting).
- Zoom resets to fit on page change and on close. No zoom level is remembered.
- At zoom above fit the viewer asks for a sharper decode of the current photo only (R16).
- No long press menu, no share, no save, no copy (hidden sharing, NX-33-R10 as read in `MEMORY-LIBRARY-FLOWS`).
- VoiceOver and Switch Control get "Zoom in" and "Zoom out" as custom actions on the photo (pinch is not reachable otherwise).
- Test layer: U (scale and pan clamp maths), D (feel), A (custom actions).

### MT-T4-R6. Video poster to play
- Given a video on a day (Route B) or an attached video (NS-52), when the viewer shows it, then it shows the poster frame with a 56 pt round play button (`scrim` ring), as in `MEMORY-LIBRARY-FLOWS`. Never autoplay, in any setting.
- Duration: the day card shows no duration or play glyph until the metadata read is approved (concept section 6; NS-51-R5 reads dates and identifiers only). The viewer for an attached video (NS-52) may show "0:14" because the letter's media is the parent's kept copy. This is an inconsistency the founder may notice, because the founder's screenshots show lengths on library clusters (UNVERIFIED from the brief's description; I did not open them). Recommended: hold the line until `security` and counsel clear a duration read (OQ-T4-6).
- Tap play: the play button fades out over `exitMs` as the player starts; the poster stays on top of the player until the player reports its first frame, then the poster fades out over `fadeMs`. Expo Video has no poster prop and exposes `onFirstFrameRender` for exactly this ("hide any cover images that conceal the initial loading of the player", VERIFIED at the Expo page above). The poster is the same image as the tile and the grown viewer photo, so there is no flash between them.
- Native controls are on while playing. Sound is on after the tap (the child's voice may be the point). Starting a video pauses the letter's recording playback, and the reverse (`MEMORY-LIBRARY-FLOWS`).
- `audioMixingMode` defaults to `auto`, under which other apps keep playing audio only when the player is muted (VERIFIED, Expo page). So a parent's music will stop when a video plays with sound. That is acceptable and expected for a deliberate tap, but `mobile` must decide the mode explicitly and `design-systems` records it (OQ-T4-7).
- Swiping to another page pauses and releases the player. At most one player is alive in the viewer. `useVideoPlayer` cleans up on unmount (VERIFIED); a player made with `createVideoPlayer` must be released by hand (VERIFIED, memory leak warning), so use the hook.
- Under Reduce Motion: same, because nothing here moves. The poster to video change is the 200 ms fade, which is the Reduce Motion form already.
- Error: the viewer shows the existing line "That video could not be played." and Close; the letter or day is untouched.
- Test layer: C (poster stays until first frame), D (no flash), A.

### MT-T4-R7. The photo is not on the phone
- Given a photo whose original is in iCloud only, when the tile or the viewer asks for it, then the app asks the system for a thumbnail with network access off and, if none comes, shows a plain `surface` box (NS-51-R21: it never downloads). The viewer for such a photo shows the box, Close, and one quiet line from `content` ("This photo is not on this phone."). No spinner, no "downloading", no button that downloads.
- UNVERIFIED: whether the system returns a small local thumbnail for an iCloud-only photo with network off (feasibility 2.2 says the same). Spike D4.
- Test layer: D.

### MT-T4-R8. The viewer under privacy and OS interruptions
- Given the viewer is open, when the app becomes inactive (app switcher, Control Centre, call), then an opaque box covers the photo before the system snapshot (NS-51-R25 rule, extended from the sheet to the viewer), and the photo views set `accessibilityIgnoresInvertColors`.
- Given the app is locked with the app lock on and returns, then the viewer is closed and the lock screen shows (it is a route, so it dies with the stack).
- Photos are never written to disk by the viewer. Route B thumbnails and full images come from the native library module and are drawn, not cached (feasibility 2.3). If `mobile` instead uses `expo-image` for any library photo, its `cachePolicy` default is `disk` (VERIFIED, Expo page), which would write derivatives of the parent's photos to the app's cache; it must be `none` (OQ-T4-5, top finding).
- Test layer: C (inactive box), D, R (code review of every image call).

## 5. Requirements: placeholder, thumbnail and refresh

### MT-T4-R9. Placeholder to thumbnail crossfade
- Given a tile whose thumbnail is not ready, when the tile first draws, then it shows a flat `surface` box of the final tile size (the layout never shifts; tiles are fixed crops, so no aspect read is needed), no shimmer, no spinner, no blur, no word (concept section 9 loading row; `MEMORY-LIBRARY-FLOWS` Loading row).
- When the thumbnail is ready, then it cross-dissolves over `fadeMs` (200 ms) with `ease-in-out` or the M3 standard easing from `tokens.motion.easing` (one choice, `mobile`); the fade is per tile, with **no stagger** (a stagger across tiles reads as a shimmer, which the concept forbids). The card itself still enters with `enter` and `staggerMs` once per appearance (concept 13.4).
- A thumbnail already in memory (scroll back, return from the viewer) shows with no fade. Fade only on the first arrival. Otherwise every scroll back would flicker.
- A recycled tile (a list reusing a view for another day) resets to the placeholder before loading the next one (Expo's `recyclingKey` does this for its own image view, VERIFIED; the native thumbnail view needs the same behaviour, `mobile`).
- **No blurhash or thumbhash.** A hash is a stored derivative of the parent's photo, per asset. NS-51-R6 allows identifiers and dates in one file and BL-877 says no per-asset row; a hash is a new per-asset record. This closes off Expo's built-in placeholder format (it supports blurhash and thumbhash, VERIFIED) for library photos. If a placeholder source is given, `placeholderContentFit` must equal `contentFit`, or a lower-resolution placeholder may flicker (VERIFIED, Expo page).
- Reduce Motion: the placeholder is already static; the thumbnail arrival stays the 200 ms fade (that is the Reduce Motion form). Nothing else animates.
- Increase Contrast and Bold Text: each tile has the 1 pt `line` edge (concept 13.2), so a pale photo never merges with paper.
- Test layer: U (arrival rule: fade only when not cached), C, D.

### MT-T4-R10. Viewer: thumbnail to sharp photo
- Given the viewer opened on a tile's thumbnail, when the larger photo is ready, then it cross-dissolves over `fadeMs` on top of the thumbnail. The thumbnail is never removed first. If the larger photo fails, the thumbnail stays, the photo is simply less sharp, and no error is shown (a quiet failure, since the picture is still there). Zoom beyond the thumbnail's resolution waits for the sharp version without any indicator, and the pinch stays responsive on the thumbnail meanwhile.
- Test layer: C, D.

### MT-T4-R11. Pull to refresh: the feel
- Given the Recent part (or For you), when the parent pulls down past the system threshold and releases, then the app re-reads its on-phone index of days (NS-51; local, cheap) and the list updates in place. The control is the system refresh control, with **no title text and no count**. No banner "3 new", no "Up to date", no "All caught up" (the concept bans any line that implies something is owed).
- New days appear with `enter` at the top and the parent's scroll position is kept (content inserted above the viewport must not shift what the parent is reading). A day that is gone fades over `exitMs`. A refresh that finds nothing new ends at once; nothing says so.
- No haptic (COMPONENTS 0.2: none on scroll; the five intents do not include a refresh).
- The pull never reshuffles prompt cards. "Another thought" is the only control that does (concept section 5), so a pull cannot make the deck feel like a slot machine.
- The index also re-reads on returning to the foreground and on returning from Settings after a permission change, so pulling is never required.
- Denied or no access: the pull still works for the cards that need no permission (typed days, month-age, a year ago), and is absent where there is nothing to refresh (the Recent part when absent).
- VoiceOver: a custom action "Refresh" on the screen heading, since the pull gesture is not reachable by every VoiceOver or Switch Control user (UNVERIFIED whether the system control exposes its own action; I did not test it).
- Reduce Motion: the system control follows the system (UNVERIFIED how; D). The inserted cards use `fadeMs` and no y travel.
- Test layer: C, D, A.

## 6. Requirements: expand and collapse

### MT-T4-R12. A day expands in place
- Given a day card whose collage shows up to four photos, when the day holds more photos than the collage shows (up to six identifiers, NS-51-R6), then the card has one quiet control "Show all" (no number, no "+2"). Tap: the card grows in place (Things 3 pattern, MOTION M13, already adopted in 5d): height by `LinearTransition` on `standard`, the added tiles `enter` after 80 ms with `staggerMs` and `staggerMax`, the whole sequence under `sequenceMaxMs` (900 ms). The photos from the collage do not move. The collage becomes a two-column grid.
- The tapped control is the shared anchor. It stays under the finger: the list scrolls so the control's screen position is unchanged (anchor the content, not the offset), then the control becomes "Show fewer".
- Collapse: the extra tiles fade over `exitMs`, the height closes on `standard`; if the card's top would leave the screen, the list scrolls up so the card's date stays visible.
- Rapid taps: a tap during the sequence reverses it from the current value (interruptible).
- Under Reduce Motion: height changes in one step, the added tiles fade over `fadeMs`, nothing travels.
- Test layer: U (anchor maths), C, D.

### MT-T4-R13. A month group collapses and opens
- Given the Recent list, when days older than the current month are grouped under a month heading, then the heading is a button with `expanded` state. Default: **all groups open**. A collapsed heading shows only the month name: no number of days, no number of photos, no "12 hidden".
- Collapse: the group's cards fade over `exitMs` and the list closes the gap on `standard`; the heading holds its screen position (anchor), so the finger's target does not move. Open: the cards `enter` with `staggerMs` and `staggerMax` (6), the first six only; the rest appear at once.
- The collapsed state is remembered for the cold launch only (like the segment, concept section 5.2); it is not a stored preference and it never syncs.
- Not a month list for the whole library: Recent is finite (NS-51-R7: at most 30 days in the index). No "Older" control and no group beyond what the index holds.
- Under Reduce Motion: one step, then a `fadeMs` fade on the content.
- Test layer: U, C, D, A.
- Note: the concept does not group Recent by month at all. This requirement is mine, from the scope given to me. If the concept keeps Recent as a flat list, R13 is dropped and R12 is the only expansion.

### MT-T4-R14. The card stack settles
- Given the For you deck (at most five cards, concept section 5.1) or Recent, when cards appear, change or leave, then:
  - first appearance: `enter` with `staggerMs`, `staggerMax` six, once per cold launch per tab appearance; not again on every tab switch;
  - a card that leaves (R15) fades over `exitMs`; the cards below close the gap on `standard`;
  - "Another thought" swaps only the prompt cards: old out over `swapMs` (150 ms), new in over `swapMs`, in place, no travel;
  - no parallax, no sticky stacking, no card flip, no deck "fan". Cards are paper (concept 13.5), so there is no stack depth to animate.
- Under Reduce Motion: every one of these is a `fadeMs` fade or nothing.
- Test layer: U, A.

## 7. Requirements: "Not now" and Undo

### MT-T4-R15. Setting a card aside
- Given a card in For you or Recent, when the parent swipes the card left (trailing action), or long presses it, or uses the VoiceOver action, then a single action "Not now" is offered (the word already exists in the strings as `notNowButton`). It does not ask why. It never says dismiss, hide, skip, remove, "don't show again", "we'll show you fewer like this", "you've set aside N" or "missed".
- Why these three doors: the card has one visible button, the capsule (concept section 6). A visible close mark on every card would be a second target and a second voice. The swipe, the long press (the house pattern, the QuietDayRow and letter long-press) and the VoiceOver and Switch Control custom action are all reachable without a new control. Sighted discovery is low on purpose: a parent who never sets a card aside loses nothing. Whether a visible control is needed is OQ-T4-2.
- Effect: the card leaves (R14). Haptic: `soft` when the long-press menu opens (the existing letter long-press intent); none on the swipe commit and none on the exit (a commit with no weight).
- What is remembered, on the phone only: a flag that this card stays out. For a library day that flag is derived from library dates, so it belongs inside the same on-device, excluded-from-backup index file as NS-51-R6 and carries the same classification (L4), not a new store (OQ-T4-4 for `privacy`). For a typed day, a ticked Day or a prompt, the flag is a local row about the parent's own data and the 111 prompts.
- How long it stays out (default, `product` decides): a photo day or occasion stays out until it leaves the deck by itself; a prompt does not return today. Nothing says "for now".
- **Nothing learns from it.** No analytics event, no log, no crash breadcrumb, no ranking change, no "because you set aside..." anywhere. The flag has no consumer except the filter that hides that one card. This is also what keeps the claim "the machine adds no meaning" intact.
- Not now is not a decline of the permission. The photo-access "Not now" (concept section 9) is a different control and a different word-use; both say the same two words and neither ever follows with a reminder.
- Test layer: U (the filter), C, A, R (privacy review of the flag).

### MT-T4-R16. Undo
- Given a card has been set aside, when the card leaves, then the Undo toast appears (existing `UndoToast` over `ui/Toast`): message PROPOSED "Set aside." with the action "Undo" (`copy.common.undoButton`). It never times out (the component's own rule), and closes by Undo, Close, a swipe, or the next toast (a new `show()` replaces the toast on screen, COMPONENTS 2.14, with a `swapMs` swap). A replaced toast makes the earlier set-aside final.
- Undo: the card returns to the slot it left (same order, same day), entering with `enter`; the flag is cleared; focus returns to it (R20).
- Leaving the tab: the toast closes with the screen. The set-aside stands. This takes away the Undo after a tab change, which is a time limit the parent did not choose, so WCAG 2.2.1 is relevant (UNVERIFIED: I did not read the success criterion this run; the repo's own comment cites it). Recommended: keep the toast host above the tabs so the toast survives a tab change (OQ-T4-8); if not, the card is recoverable by the parent from the foot of the list as a single quiet row "Bring back the cards I set aside", shown only when something is set aside, with no count. `design-systems` prefers the first; the second is a fallback because a row that appears and disappears is a small gap-shaped hint.
- Reduce Motion: the card returns by fade.
- Test layer: C, A.

## 8. Requirements: VoiceOver across transitions

### MT-T4-R17. Focus order
These are the rules. Order inside a screen follows concept 13.3 (tab, heading "Moments", job line, switch, cards top to bottom; a card is one element: kicker, date, the parent's label if any, then the action).

| Transition | Where focus goes | What is announced | What is hidden |
|---|---|---|---|
| Open viewer (R1, R2) | The current photo element, after the grow ends (or the hand-off ends), by a screen-changed notification | "Photo 2 of 4. Opens the photo." is replaced, in the viewer, by the photo's own accessible text only if the parent wrote one, else "Photo 2 of 4" with the day's date; never a generated description | The Moments screen is hidden from VoiceOver while the viewer is up (the viewer is modal: `accessibilityViewIsModal`; and the screen hides itself the way `useHiddenBehindCardPage()` does; that hook name is about the letter page, so `mobile` generalises it) |
| Change photo by swipe (R4) | Stays on the photo element; its label changes | "Photo 3 of 4" once, not twice (do not both change the label and post an announcement) | none |
| Change photo with VoiceOver | Adjustable: swipe up or down changes photo (`MEMORY-LIBRARY-FLOWS`); the three-finger scroll gesture also pages | as above | none |
| Zoom | Custom actions "Zoom in", "Zoom out" on the photo | "Zoomed" is not announced; the scale is not a fact worth speaking | none |
| Close viewer (R3) | The tile that opened it, or the card if the tile is gone | The element's own label | The viewer hides first, then the screen is visible again, so the two are never both readable |
| Play video (R6) | The system player's controls take focus; when the video ends or is closed, focus returns to the play button | none added | none |
| Expand a day (R12) | Stays on the control, which is now "Show fewer" | The label change is the announcement; nothing is added | none |
| Collapse a month (R13) | Stays on the month heading; its `expanded` state flips | The state is read by VoiceOver itself | cards inside leave the order |
| Set a card aside (R15) | The next card (the one that closed the gap); if it was last, the previous card; if none, the section heading | The toast "Set aside. Undo" is announced politely, without taking focus | the removed card is gone from the order |
| Undo (R16) | The restored card | none added | none |
| Pull to refresh (R11) | Stays where it was; if the list changed above it, focus is kept on the same card | none | none |
| Placeholder to thumbnail (R9) | No change | Nothing is announced when a tile loads (the concept says the loading state announces nothing) | none |

- Test layer: A for every row, by hand with VoiceOver on a device, and a component test for the element order.

### MT-T4-R18. Switch Control, Full Keyboard Access, Voice Control
- Given Switch Control or Full Keyboard Access, when the parent uses the viewer, then Close, Previous, Next, Zoom in, Zoom out and Play are all reachable and have names; Escape closes; arrow keys change photo; the pager does not depend on a swipe. Voice Control can say "Close" and "Next" (the visible labels match the accessible names).
- Test layer: A.

### MT-T4-R19. Text size and Bold Text
- Given AX5, when the viewer shows the date and position text under the photo (`onScrim` on `viewer`, at least 15 to 1 per the viewer spec), then the text wraps and is never truncated (D-027); the photo area shrinks and keeps its fitted rule; Close stays 44 pt top left; Previous and Next move beneath the text and keep 44 pt. A card's "Not now" action label and "Show all" never truncate. Bold Text only changes weights.
- Test layer: A, D (iPhone SE 3 at AX5).

## 9. Reduce Motion, Reduce Transparency, Increase Contrast

### MT-T4-R20. One table of variants
Reduce Motion follows MOTION section 4: movement is replaced by a paired 200 ms fade, never by a jump; direct manipulation stays.

| Moment | Normal | Reduce Motion |
|---|---|---|
| Tile to viewer open (R1) | Reveal grow on `standard`, veil `fadeMs` | One `fadeMs` hand-off, no grow, no mask |
| Viewer close (R3) | Carried back, veil lifts `lamp.returnMs` | One `fadeMs` hand-off |
| Drag down to close | Photo follows the finger | The same: it is the finger |
| Swipe between photos | Drag one to one, settle on `standard` | Drag one to one; settle is a short fade instead of a spring |
| Pinch | One to one | The same |
| Double tap zoom | `snappy` | Jumps to the end state |
| Video poster to video | Play button `exitMs`, poster `fadeMs` | The same (these are fades) |
| Day expands (R12) | Height `standard`, tiles `enter` | One step, tiles `fadeMs` |
| Month group (R13) | Height `standard`, cards `enter` | One step, `fadeMs` |
| Card set aside (R15) | `exitMs` fade, gap closes `standard` | `fadeMs` fade, gap closes at once |
| Undo return (R16) | `enter` | `fadeMs` |
| Prompt swap | `swapMs` cross-fade | The same |
| Pull to refresh (R11) | System control; new cards `enter` | System control; new cards `fadeMs` |
| Placeholder to thumbnail (R9) | `fadeMs` cross-dissolve | The same; the placeholder itself never animates |
| Card first appearance (R14) | `enter` with stagger | `fadeMs`, no stagger |

- Subscribe to `reduceMotionChanged` as well as reading at start (MOTION section 4: the hook reads the value once at start). The viewer re-reads on every open.
- Reduce Transparency: the viewer backdrop is solid already (`colors.viewer`); our own glass controls (Close, Previous, Next) become `glassFallback`. Nothing on the viewer is a blur.
- Increase Contrast: the chrome gets the `controlBorder` hairline; the scrim behind any text over a photo goes to the stronger value the spec names (0.75, `MEMORY-LIBRARY-FLOWS` section 9); the tile `line` edge strengthens.
- Light and dark: the viewer is the one fixed-dark surface in both themes. Everything else on Moments follows the theme.
- Test layer: A (each setting on, each moment), U (the variant is chosen by one function from `reduced`).

## 10. Edge and unhappy paths

| Case | What happens |
|---|---|
| Tapping a tile while its thumbnail is loading | R2 hand-off; the viewer shows the placeholder, then the photo arrives by R10 |
| The photo was deleted from the library while the viewer is open | The viewer shows the plain box and the quiet line of R7; Close works; the day card is re-read on return (R11) |
| Limited access changes while the viewer is open | The viewer is not rebuilt mid-view; the Moments list refreshes on return |
| Photo is huge (a panorama) | Fitted, never cropped; pinch reaches its detail; decode is downsampled (R21) |
| Photo is a Live Photo | Shown as a still. No motion, no "Live" glyph (NS-52 not in scope: Live Photo motion) |
| A day with exactly one photo | The viewer has no pager, no Previous or Next, and no position text |
| A day with no photos (an occasion or prompt card) | Nothing opens; there is no empty viewer |
| Rotation | The app is portrait-only on phone (UNVERIFIED for this build; `mobile` confirms). If landscape is ever on, the viewer re-fits without a cross-fade and keeps zoom centre |
| Two taps on a tile in quick succession | One viewer opens; the second tap is ignored until the route is mounted |
| Back swipe from the left edge while zoomed | Closes the viewer only at fit; at zoom it is the pan |
| Card set aside during pull to refresh | The refresh finishes without bringing it back (the flag is checked on insert) |
| Set aside card is the one the viewer opened from | Not possible: the viewer is modal; a card cannot be set aside underneath it |
| Memory warning | R21 |
| Low Power Mode or a hot phone | The system lowers the refresh rate (section 11); nothing in this file depends on the rate |
| Offline | Everything is local; no state differs |
| Timezone change | Day grouping is NS-51's; this file does not re-group on screen while a transition runs |
| App backgrounds during a transition | The animation ends in its final state on return; the viewer shows the opaque box (R8) while inactive |

## 11. Memory and 120 Hz notes

### MT-T4-R21. Memory budget behaviour
- Arithmetic, not measurement. A 12 megapixel photo decoded to 4 bytes a pixel is 4032 by 3024 by 4 = 48,771,072 bytes, about 46.5 MiB (the 4032 by 3024 size is the same figure the stored-photo rule in NS-01 uses, `27-photo-moments-and-media.md`: 4,032 px). A screen-size decode on the iPhone SE 3 (750 by 1334 pixels, from 375 by 667 pt at 2x) is 750 by 1334 by 4 = 4,002,000 bytes, about 3.8 MiB. So holding three full-size photos at once would be about 140 MiB and holding three screen-size ones about 11 MiB. I did not read any device memory limit; the limit that matters is a spike measurement (D3), not this arithmetic.
- Rule: the viewer holds **at most three decoded pages** (current plus one each side) at **screen size**; a sharper decode exists only for the current page and only once the zoom passes fit; it is released on page change, close or zoom back to fit. Expo documents `allowDownscaling` default on for this reason (VERIFIED); the native thumbnail view must ask the system for the size it needs and no more (feasibility 2.3 already says: ask the image manager for a small image).
- Prefetch: the next page one step ahead only after the current page's sharp version has landed, never while a pan or drag is active.
- Memory warning: drop the neighbours and every thumbnail not on screen, keep the current page, no visible change.
- Players: one at a time (R6).
- Lists: a day card's thumbnails are decoded at tile size. Cards that scroll far off screen release them. Recycling resets to the placeholder (R9).
- Test layer: D (the spike D3 of the feasibility doc, with a viewer opened on a 20,000 asset library on an iPhone SE 3: peak memory with three pages, with zoom, with a video; no threshold is set here because I have no measured figure).

### MT-T4-R22. 120 Hz and frame pacing
What I read (Apple, ProMotion article, fetched 21 Nov 2026, VERIFIED):
- ProMotion displays switch between 24 and 120 Hz on iPad Pro and 10 to 120 Hz on supported iPhones; iPhone 13 Pro and later, iPhone 17 and later, and iPhone Air are listed.
- "You can't force a ProMotion display to show your content at any specific rate"; Core Animation decides; your app "can't presume a specific refresh rate at any time"; the system disables faster rates in Low Power Mode or when the device is hot.
- On iPhone, `CADisableMinimumFrameDurationOnPhone` must be true for Core Animation to go above 60 Hz for hints. It is already set in `apps/mobile/app.config.ts` line 244 (VERIFIED by file read).
- Apple's own table lists "tapping an item in a grid to expand to fullscreen, such as in the Photos app" as a high-impact animation (80 to 120, preferred 120) to be used "sparingly", and alpha or colour changes and small movements as default range.
What I did not verify: whether Reanimated 4.5.1 (the app's version) requests high rates for its UI-thread animations or lets the system choose. UNVERIFIED. I did not read Reanimated's frame rate notes.

Rules:
1. Every movement is **time-based**, never frame-count based: the spring tokens and the `dt` approach in MOTION 5b already are. A drag-to-close release velocity is read in points per second, not points per frame, so a 30 Hz frame and a 120 Hz frame close the viewer the same way.
2. The tile to viewer grow (R1) is the one high-impact animation and may ask for a high rate if `mobile` finds a supported way; fades, the placeholder crossfade, the toast and the card set-aside stay at the default range (Apple's table says no higher rate is needed for the same visual effect).
3. Nothing may depend on 120 Hz: the same sequence must look right at 60 and at the rates the system picks when it lowers the rate.
4. No heavy work during a transition: the sharp decode, the next page prefetch and the player creation start after the grow has settled (R10, R21). The tile's thumbnail is already decoded, so the first frame costs nothing new.
5. One animation driver per screen, not one per tile (Apple: limit display links; "group animations with similar timings").
6. Test on a ProMotion iPhone and on an iPhone SE 3 (60 Hz) in the same build, in normal, Low Power Mode, and after a thermal soak. The frame-time budget for each transition is **not set here**: `mobile` captures an Instruments animation hitches trace on device first and the number is ruled after that, not invented before.
- Test layer: D.

## 12. Constitution, privacy and accessibility checks

| Check | Result |
|---|---|
| The machine adds no meaning | Pass. No caption, title, description, place or subject appears in the viewer, the expansion, the placeholder or the toast. A photo's accessible text is the parent's own words or none (NS-52; concept 13.3). "Photo 2 of 4" and the date are the only machine facts |
| No counts, gaps, streaks | One finding. The viewer's "2 of 4" is a position in a set the parent can see; it is not a count of what is missing. R4 limits the set to what the card shows, so it cannot reveal a hidden number. "Show all" and a collapsed month carry no number. The Undo toast says no number. Still, OQ-T4-1 asks whether the position text should be shown to sighted users |
| No place, person, scene guess | Pass. Nothing in a transition reads a location or a face. A card's date is the only label |
| Nothing leaves the phone | Pass for everything here. No event for a set-aside, an open, a zoom, a play, a pull or an expand. No photo, filename, date or day in analytics, logs or crash reports. Breadcrumbs must not carry route params that hold an asset id or a day |
| No derived per-asset data | R9 forbids blurhash and thumbhash; R8 forbids a disk cache. The set-aside flag for a library day is the one new derived datum and lives in the existing NS-51 index file (OQ-T4-4) |
| Hidden sharing | The viewer has no share, save, copy or long-press menu (R5) |
| App switcher and backup | R8 opaque box; nothing new in backup |
| WCAG 2.2 AA | Targets 44 pt (R4, R15, R19); focus order (R17); no motion-only signal (every state is also a word or a visible change); drag has non-drag alternatives: Previous and Next, Close, custom actions (2.5.7 dragging movements; UNVERIFIED: I did not read the criterion this run, it is the reason for these alternatives); text never truncated (R19) |
| Contrast | No new colour proposed. The viewer text pair is the existing 15 to 1 claim in `MEMORY-LIBRARY-FLOWS` (computed there, not re-run by me). `colors.viewer` does **not exist** in `tokens.ts` today (grep found only `scrim`, `#2B272252` light and `#0000008C` dark); the viewer spec proposes it as `#000000`. A token change belongs to `design-systems` with its contrast test (section 13) |
| Content rules | No em dash, en dash, curly quote, ellipsis or emoji in this file. No model name. Parent words: "Not now", "Undo", "Set aside", "Show all", "Show fewer", "Photo", "Close", "Previous", "Next". Words for `content` to clear: "Set aside." (toast), "This photo is not on this phone.", "Bring back the cards I set aside". None of them says memory, moment, entry, draft, pack or take |
| No guilt wording | R15 bans the list. The toast does not say "removed", "hidden" or "dismissed", and "Set aside" does not imply a loss; `content` may replace it |
| iPhone SE 3 and AX5 | Specified (R19); not run (nothing was run) |

## 13. Dependencies

- `mobile`: the viewer route, the measured-rect store reused from `CardSource`, the pager, the zoom maths, the player hook, the card swipe action, the toast host, the list anchoring, the native thumbnail view's fade and recycling behaviour. All new code.
- `design-systems` (me, as lead of the system): ruling on the mask-frame exception (R1), the `colors.viewer` token with its contrast pair test, a Moments row in `docs/design/COMPONENTS.md` for `MediaViewer`, a day card and a month heading, once built.
- Library choice (OQ-T4-5): `expo-image` and `expo-video` are not installed (VERIFIED). `MEMORY-LIBRARY-FLOWS` says the viewer builds on them. Adding either is a native dependency change and an EAS build; Route A (picker) photos arrive as files in the app's cache (feasibility), which `expo-image` can draw; Route B library photos come from the module, which `expo-image` cannot draw by identifier (UNVERIFIED: I found no statement either way; I would not assume it).
- Feasibility spike D3 and D4 (memory and iCloud thumbnail) before the numbers in section 11 mean anything.
- `privacy`: the set-aside flag (OQ-T4-4); the duration read (OQ-T4-6).
- `content`: the words in section 12.
- Concept PR #1270: R15 and R16 need a place in its card family; R12 and R13 amend its "no list past what the index holds" intent only if the index is longer than a single screen. T-leads for the tab switch, permission sheet and nudge deep link own those transitions; a deep link that opens the viewer is R2.
- Route A note: if Route A (Apple's picker) is the only route, there are no library collages on Moments to tap. The viewer then serves attached media only (NS-52 letters, Ready). R1 to R10 hold for the Ready and letter surfaces; R11 to R13 apply only to Route B.

## 14. Open questions, recommended default, deadline

Deadline for all: before any Moments build ticket is written; the proposed date is 28 Nov 2026 (my suggestion, not a ruled date).

| Id | Question | Recommended default | Who |
|---|---|---|---|
| OQ-T4-1 | Show a visible "2 of 4" in the viewer, or only to VoiceOver? | Show text "2 of 4" beneath the photo: it is orientation inside a set the parent is already looking at. Do not draw page dots | design-systems, product |
| OQ-T4-2 | Is a visible control for "Not now" needed beside the swipe, long press and VoiceOver action? | No. Test with five parents (as concept section 3.3 does for tab discovery); add a small overflow mark only if parents do not find the swipe | product |
| OQ-T4-3 | What set does the capture hand-off attach: what the card shows (up to four, concept section 7), or what the expanded day shows (up to six)? | What is visible at the moment of the tap; the capsule never attaches photos the parent has not seen on that card | product, mobile |
| OQ-T4-4 | Where does the "set aside" flag for a library day live? | Inside the NS-51 index file (excluded from backup, per account, never synced), same classification, no new store | privacy, security |
| OQ-T4-5 | Which library draws the photos, and is the disk cache off? | A native thumbnail view in the library module for Route B (feasibility 2.3); `expo-image` with `cachePolicy` `none` only for files in our own cache; `expo-video` for video | mobile |
| OQ-T4-6 | Duration and a play glyph on library videos | Not until `security` and counsel clear the metadata read (concept section 6). The founder owns the call, since the founder's screenshots show lengths | founder, security |
| OQ-T4-7 | `audioMixingMode` for the viewer's video | Explicitly `auto` (other apps' audio stops while the video has sound), recorded in COMPONENTS; no mixing | mobile, design-systems |
| OQ-T4-8 | Does the Undo toast survive a tab change? | Yes, a toast host above the tabs; otherwise the fallback row in R16 | mobile, design-systems |
| OQ-T4-9 | Is Recent grouped by month (R13) or flat? | Flat unless the index can exceed about one screen of days; R13 stays specified in case | design-systems, product |
| OQ-T4-10 | Ceiling for zoom and the release point of drag to close | Four times fitted and one third of the height, tuned on device | mobile |

## 15. Reversals and reconciliations the founder or another lead owns

| Id | Earlier text | This file | Owner |
|---|---|---|---|
| T4-V1 | Concept 13.4: "no zoom on a collage"; concept 13.3: the card is one element and the collage is not read tile by tile; concept section 7: tapping the card body opens the chooser | A tile tap opens the viewer. To keep the card one VoiceOver element: the card's default action stays "Choose photos"; a custom action "View photos" opens the viewer; sighted users tap a tile. "No zoom on a collage" is read as no zoom the parent did not ask for (no Ken Burns) | design-systems, concept author |
| T4-V2 | The `MediaViewer` spec is for a letter's own media | The same viewer opens on library days (Route B) | design-systems |
| T4-V3 | MOTION 5f: only a surface with no children changes its frame | One masked photo animates its frame (R1) | design-systems |
| T4-V4 | Concept 5.2: Recent is finite, no groups | R12 adds "Show all" and R13 optional month groups | product |
| T4-V5 | Concept: no per-card control other than the capsule | R15 adds a swipe, a long press and a custom action; no visible control | product, concept author |
| T4-V6 | Brief: ML-6 (cards show a date, never a place or thumbnail); BL-1305 (no usage string in 1.x) | Thumbnails in tiles and a viewer of library photos depend on the same reversal the concept already lists (R-3, R-6). Not new here | founder |

## 16. What is VERIFIED, UNVERIFIED, and a guess

**VERIFIED (source read this session):**
- Repo facts at `develop` `fb29507`: the motion tokens and values in section 2; the `CADisableMinimumFrameDurationOnPhone` key; `expo-image`, `expo-video` and any list library are not in `apps/mobile/package.json`; `colors.viewer` is not in `tokens.ts`; `notNowButton` exists in `packages/content/src/strings.en.ts`; the Undo toast's no-timeout rule and the `show()` replace rule; the five haptic intents; the viewer spec lines in `MEMORY-LIBRARY-FLOWS`; the 5f card to page behaviour; the concept's card anatomy, loading, VoiceOver and motion rules (read from the PR #1270 branch).
- Apple ProMotion article (URL in section 2): the refresh rates, the device list, "you can't force", the Low Power Mode and heat note, the Photos-style expand as a high-impact example, the plist key.
- Expo Image v57 and Expo Video v57 statements marked VERIFIED above (URLs in section 2).

**UNVERIFIED (no source read, do not rely):**
- That Apple's system shows a local thumbnail for an iCloud-only photo with network off.
- Whether Reanimated 4.5.1 requests high refresh rates on its own.
- How the system refresh control behaves under Reduce Motion, and whether it exposes its own VoiceOver action.
- The text of WCAG 2.2.1 and 2.5.7 as I use them (I used them as the reasons for the alternatives, from memory of the criteria).
- Whether `expo-image` can draw a PhotoKit identifier directly.
- That the app is portrait-only on phone.
- Any competing app's behaviour; I made no claim about any.
- Apple's own HIG pages on refresh controls and image viewing. I did not read them.
- The privacy PR #1267 text; I used NS-51 and the concept's quotes.

**A guess (design judgement, to be tuned on a device):** the zoom ceiling, the release point for drag to close, "set aside" as the toast word, the default "stays out" rule, hiding the Previous and Next buttons unless an assistive setting is on, the default that all month groups are open, that stagger is avoided on thumbnails, and the order of the VoiceOver focus targets after a set-aside.

**What I did not do:** nothing was built or run; no device, simulator, contrast, hitch or memory measurement exists; I opened none of the founder's screenshots; I did not edit CLAIMS.md, BACKLOG.md or any file other than this one; no PR was opened.
