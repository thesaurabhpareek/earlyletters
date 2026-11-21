# EnlargeViewer and the enlarged Close

Owner: `design-systems`. Status: PROPOSED, not built. Sources: G-10, R276, D7, R208, R154, R150, EXP 5.2. Shared rules: `README.md`.

## 1. Purpose
In the day sheet a parent may need to choose the better of two almost identical pictures. One tap on a tile shows that picture large, with a Close. Nothing else: no swipe between pictures, no pinch, no pan, no video playback in the first release. If the five-parent test shows parents manage without it, it is cut later (R276).

## 2. Anatomy
- Full-screen surface in `bg` (paper). Not a second stacked sheet over the picker sheet: it is a state of the host route's body, so there is still one sheet (R269). Open for `mobile`: implement as a full-frame layer inside the day body, not a new route.
- A `Close` text control at the top, at least `target.min` by `target.min`, using `Button variant="quiet"` with `copy.moments.close` (PLACEHOLDER; the existing `strings.en.ts` `moments.dismissButton` is a milestone key and is not reused here without `content`). Trailing at default size; its own row from AX1.
- One picture at full width, fitted never cropped (R42), framed with `mediaFrame` at `stroke.control`, radius `md`. A video shows its poster.
- Nothing is drawn over the picture except the one allowed duration mark on a video (R208: pill-token scrim, 24 pt minimum, fixed size). From AX1 the duration is also given as text under the picture.
- No caption, place, scene or machine description.

## 3. States
| State | What shows |
|---|---|
| Opening | The door's rise (EXP 5.2); Reduce Motion a `motion.fadeMs` cross-fade |
| Ready | Picture shown |
| Thumbnail only | The grid thumbnail is shown at full width at once, then the full-quality picture cross-fades in place over `motion.fadeMs`; nothing moves (A2-R8 to R10) |
| Picture unreadable (not on the phone yet, or unreadable file) | The frame stays, one plain static line from `content` (the EXP 8 row; PLACEHOLDER key); Close still works; no spinner |
| Closing | Close, Escape gesture, Full Keyboard Access Escape, all equal |

Enlarging never selects or deselects a picture (G-10). Selection happens only on the tile in the day body.

## 4. Tokens
`bg`, `mediaFrame`, `text`, `textMuted`, `focus`, `scrim` (behind the duration mark only); `stroke.control`, `stroke.focus`; `radius.md`; `target.min`; `space[4]`; `motion.fadeMs`, `motion.standard`; `Text` variants `subhead`. The duration mark's size and fill come from the existing pill token of R208, not a new value.

## 5. Dynamic Type
- Default: Close top trailing; the picture is sized by width, height follows.
- AX1 and above: Close on its own row (leading or full width, still `target.min` tall), the picture below it at full width, the duration text under the picture wraps.
- AX5: the sheet scrolls; Close is the first stop and stays reachable by scrolling to the top; no pinned bar covers more than 25 percent of the screen (PRD 15).

## 6. VoiceOver and order
1. The picture's label (date and file kind only, e.g. "Video" or "Picture" from `content`; no machine description, no place: R154), role image.
2. Close.
Focus lands on the picture's label on open (it is the content); the Close is the next stop. Modal for VoiceOver: the day body behind it is hidden from the accessibility tree. The Escape gesture (two-finger Z) closes. On close, focus returns to the tile that opened it. Full Keyboard Access: Escape closes; Tab reaches Close.

## 7. Motion
Open: the door's rise on `motion.standard` clamped. Close: the reverse over `motion.exitMs`. Reduce Motion: `motion.fadeMs` cross-fade both ways, no translation. No haptic.

## 8. Targets
Close at least `target.min` square and 8 pt (`space[2]`) clear of the picture. The picture itself is not a button (no gesture on it in v1).

## 9. Test list
- EV-T1 L2: opening does not change selection state; closing returns focus to the opening tile.
- EV-T2 L2: Escape gesture and Close produce the same result; Full Keyboard Access Escape closes.
- EV-T3 L1: no pan, pinch, swipe or play handler in the file; no text drawn over the picture except the duration mark (scan of the layer tree in a render test).
- EV-T4 L3: default and AX5, light and dark; at AX1 Close is on its own row; the picture is fitted not cropped for portrait, landscape and a very wide aspect.
- EV-T5 L4: label contains only date and file kind (reuse the R154 label test); no digit count of pictures.
- EV-T6 L2: Reduce Motion gives a `motion.fadeMs` fade, no translation.
- EV-T7 L2: thumbnail-then-final cross-fade has no layout shift (frame size equal before and after).
- EV-T8 L2: an unreadable file keeps the frame and shows the one static line; Close works.
- EV-T9 L5: DM-07 walk at AX5 with Bold Text on an iPhone SE 3 with VoiceOver, Voice Control and Switch Control; G4 task "choose the better of two almost identical pictures" (R276).

## 10. Android later
Same code; check the Escape equivalent (back gesture) closes only the enlarge, not the whole sheet.
