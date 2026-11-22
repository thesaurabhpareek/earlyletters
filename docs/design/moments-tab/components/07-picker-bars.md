# Picker bars (`PICKER_BARS`) and the `PickHostSheet` frame

Owner: `design-systems` (frame and rule); `mobile` builds `PickHostSheet`. Status: PROPOSED, not built. Sources: DC-2 (FOUNDER-DECIDED B), DC-3, G-01, EXP 4.1 to 4.11, R269, R279, R293, PRD 14.1. Shared rules: `README.md`.

## 1. Purpose
One route, `moments/pick`, serves every entry to choosing pictures: a card, the tab door, the day sheet's "Choose other pictures" row, and capture's Add. Two bodies (our day tiles; Apple's picker), one frame (our heading, tray, one Start, Not now). `PICKER_BARS` decides how much of Apple's own chrome we hide.

## 2. The constant
`PICKER_BARS` is one constant of three values, read in one place:

| Value | Layout | Meaning |
|---|---|---|
| `none` | C | Apple's picker is presented as its own sheet: Apple's Add and Cancel, a returned set. No inline host, no tray for Apple's picks. Buildable today with the picker already in the app and needs no device row |
| `bottom-hidden` | B | Apple's top bar kept inside the body, bottom bar hidden. Our Not now, tray and Start stay ours. The target per DC-2 |
| `both-hidden` | A | Both Apple bars hidden. Allowed only when DM-02 shows Albums, Options, the privacy badge, the first-show panel and continuous selection all reachable with both bars hidden. Never hide Options (the parent's own privacy control) |

Ship value: `none` until DM-02 and DM-11 pass on an iPhone SE 3 and the newest phone, iOS 17 and the newest OS, under None, Limited and Full access, light and dark, with Asha synthetic files; then `bottom-hidden` (C-3 in `README.md`). C is taken whenever DM-02 fails the B list, DM-11 (iPhone SE 3 memory) fails, or DM-09 shows the cover cannot hide Apple's view in the switcher and dismissal on background is not acceptable to a parent holding picks. C is the same route and the same frame with the inline host off.

If Apple's top bar carries an Add we cannot hide, Start stays the primary control and Add is a second route to one `AttachRequest` (EXP 4.8).

## 3. Layout C (buildable today)
- Route `moments/pick` shows the day body (our tiles) when opened from a day, or presents Apple's picker as its own sheet when opened from a door with no day.
- Our frame wraps only our body: title row (Not now, heading), tray with thumbnails 44 pt fixed (radius `sm`, `mediaFrame` outline), Start. When Apple's picker is its own sheet there is nothing of ours around it, and no tray for those picks; Apple's Add and Cancel are the controls and the returned set goes to capture as one `AttachRequest`.
- "Choose other pictures" on the day body presents Apple's picker as its own sheet; on return the picks join the tray (our thumbnails only if cheap; otherwise Start's label has no count).
- Hand-off: with no tray thumbnails of Apple's picks there is nothing to fly; the 200 ms cross-fade of DC-3 option (a) applies. Flight ONLY when the tray shows thumbnails and DM-11 and DM-12 pass, using `motion.carry` (320 ms, token not yet landed; `README.md`); Reduce Motion never flies.

## 4. Layout B (later; DM-02 and DM-11)
The frame of EXP 4.2:
- Title row (paper): Not now (44 pt minimum) and the heading. The heading is a content key and is not the tab name; with a day it is the day's date (`title2`, capped at 1.4 times: the proposed `sheetTitle` token) with the parent's label under it if one exists.
- Body: Apple's picker view inside a paper surround (`space[4]` margin each side), a `mediaFrame` hairline at `stroke.control` round it. A rounded clip (`radius.md`) only if the matrix shows it does not crop the privacy badge or the first-show panel. Never crop Apple's badge.
- Optional quiet text row "Choose other pictures" when opened from a day (swaps the body).
- Foot: `surface`, `line` hairline on top, no shadow; the tray (decorative, one group element, no count text) and Start (filled, `target.primary`, bottom third, disabled and said to be until something is chosen, no number in the label, never "Keep", no haptic).
- Fully opaque sheet: no fade, scrim or transform over Apple's view while it is mounted (the picker ignores touches otherwise; R269).
- No glass in this sheet (0 of the 3 allowed). No imitation of Apple's controls: no blue, no numbered badges, no round checkmarks of ours; our tiles use ring, check and spoken state.
- Limit line appears once, in our words, when the tray is full, with no digit; it contains no explanation of Apple's Options menu or badge.

### Apple's view: what we never do (EXP 4.7)
1. No ancestor has opacity below 1 or a transform other than identity while it is mounted; it mounts after the sheet stops moving.
2. Never preloaded, never kept mounted behind the day body, never started from a link or notification.
3. It starts under a still paper cover (the `PrivacyCover` of `04-privacy-cover-moments.md`, no spinner); the cover fades over `motion.fadeMs`, the view never does.
4. The cover goes on as a hard cut before anything moves on Not now, Start, inactive and gesture dismissal.
5. Inactive or background: the cover is mounted over the sheet, picks held in memory, restored on active. App lock engaging: the sheet closes and picks are discarded.
6. Set Apple's interface style from our theme on presentation and on change; whether an out-of-process view honours it is UNVERIFIED (DM-06); we paint no scrim to hide a mismatch.

## 5. States
| State | What shows |
|---|---|
| Opening from a card | Measured-rect expand (EM-01); from a door, the door's rise (EM-02) |
| Our body | Day tiles (96 pt minimum; ring, check, spoken state; one column at full width from AX1) |
| Apple's body (A or B) | Picker view under the paper cover, then revealed |
| Over the limit | The one limit line; the seventh tile of ours refused |
| Nothing chosen | Start disabled and said to be; swipe-down and VoiceOver escape work and equal Not now |
| Something chosen | Swipe-down, scrim tap and escape are off; the grabber hidden; Not now is the way out and drops picks and temporary copies with no dialog |
| Revoke, offline, unreadable file, duplicate, iCloud arrival, picker failure | EXP 8 rows 1 to 10; the sheet stays calm and Talk and Write stay available |

## 6. Tokens
`bg`, `surface`, `line`, `mediaFrame`, `controlBorder`, `text`, `textMuted`, `accentSoft` (selected ring wash), `accent`, `focus`; `space[2]`, `space[4]`; `radius.sm`, `radius.md`, `radius.xl` (sheet top corners); `stroke.control`, `stroke.selected`; `target.min`, `target.primary`; `motion.standard`, `motion.swapMs`, `motion.fadeMs`, `motion.exitMs`, `motion.carry` (to land); `Text` `title2` (`sheetTitle` to land), `subhead`. No raw value.

## 7. Dynamic Type (R293)
- From AX1: Not now on its own row (44 pt), the heading one line capped at 1.4 times; our tiles one column at full width; the body keeps at least as much of the screen as our frame (PROPOSED bar, tuned at DM-07); foot is one row of fixed-size tray and Start; the body-swap row, the limit line and the tray hint are capped at 1.4 times.
- If Apple's body cannot keep at least as much screen as our frame, the tray collapses into Start (no thumbnails).
- AX5 with Bold Text on an iPhone SE 3: no pinned bar over 25 percent of the screen.

## 8. VoiceOver and order
The sheet is modal; the heading takes focus on open. Order: Not now, heading, body (our tiles in time order, or Apple's own, which is Apple's), the "Choose other pictures" row, the tray as one decorative group named by a content key with no count text, Start. Not now is always reachable. Each of our tiles states selected or not in words (R90). Apple's body is Apple's accessibility.

## 9. Motion
Body swap: a cross-fade of OUR layer only, `motion.swapMs`, never Apple's view. Not now: the paper returns to the lead tile in 280 ms or leaves downward in `motion.exitMs`. Start: sheet closes then capture rises, the platform's modal rise; Reduce Motion a `motion.fadeMs` cross-fade. Haptics: `tap` on selecting or putting back one of our tiles; Start, Not now and the door silent.

## 10. Targets
Not now, Start (`target.primary`), each tile (at least 96 pt), the swap row at least `target.min`, 8 pt apart. The tray thumbnails are not interactive in v1.

## 11. Test list
- PB-T1 L0: `PICKER_BARS` accepts only the three values; default `none` is asserted and a change needs a test update.
- PB-T2 L0: layout decision function from the DM-02 and DM-11 inputs returns A, B or C by the 4-step rule of EXP 4.8.
- PB-T3 L2: in C, the host mounts no inline Apple view and no tray for Apple's picks; one `AttachRequest` results.
- PB-T4 L2: in B, no ancestor of Apple's view has opacity below 1 or a non-identity transform at any step of a stepped timeline.
- PB-T5 L2: swipe-down and escape are off while anything is chosen and equal Not now when nothing is; Not now drops picks without a dialog.
- PB-T6 L2: Start disabled until a pick; label has no digit; no haptic.
- PB-T7 L2: the sheet is opaque; no scrim or fade is applied while Apple's view is mounted.
- PB-T8 L3: default, AX1, AX5; tiles one column at AX1; the heading one line at the 1.4 cap; Reduce Transparency uses `glassFallback`.
- PB-T9 L4: order Not now, heading, body, swap row, tray, Start; tray is one group with no count.
- PB-T10 L2: tray limit of 6 pictures and 2 videos across both bodies; the limit line has no digit.
- PB-T11 L2: carry timeline stepped ms by ms on three phone sizes once `motion.carry` lands (as `transitions.test.ts`); Reduce Motion never flies; flag false gives the cross-fade.
- PB-T12 L5: DM-02, DM-03, DM-06, DM-07, DM-09, DM-10, DM-11, DM-12; task completion at AX5 with VoiceOver, Voice Control and Switch Control (R293b). If it fails, no Larger Text or VoiceOver claim for starting from a picture.

## 12. Android later
Apple's picker does not exist on Android; the Android picker is a separate spec. The frame, tray and Start are the same.
