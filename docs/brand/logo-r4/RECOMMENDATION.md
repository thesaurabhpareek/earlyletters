# Logo R4 recommendation (27 Oct 2026)

Status: proposal for the founder. Nothing here changes D-071 or the registry.

## The pick
1. **Ship A, the approved mark (D-071).** One-colour mark, so it reads the same in colour, grayscale and one colour. Every mark-on-ground pairing is 4.78:1 or better. It is already in the app config, the website's favicon and share image, the email library and the registry.
2. **Keep B, two tones, as the alternate.** Parent blob in ink or paper, child blob in the sepia accent, on a dark tile. It has the highest contrast (13.65:1 for the large blob) and stays distinct on light home screens.

Rejected:
- **C** (the name in quotation marks): it only changes the header lockup, it reads as a literal quotation of the name, and a second quote shape raises the chance of a look-alike conflict.
- **D** (paper tile): the tile edge is 1.00 to 1.35:1 against light pages, so the icon loses its shape on a light home screen or white page.

## Why A over B
- A is already decided, wired and tuned. B would reopen a founder decision for a gain A does not need: A passes the 3:1 graphic floor everywhere that matters.
- B's second tone adds nothing for a person who sees only tone: the small blob turns mid-gray (175 against 248 for the large one) and the shape still reads. The parent and child meaning comes from size and lean, not colour.
- B's light and dark app icons are the same dark tile, so iOS light appearance gets a dark icon. That is a taste call, not a defect.
- Both share one weakness: a dark tile on a dark wallpaper (B 1.27:1, A dark 1.27:1, A sepia 2.68:1 against the night page). iOS draws the dark appearance on dark wallpapers, so the icon relies on its mark, not its edge.

## Measured contrast (WCAG 2.x, `options-r4/source/contrast.mjs`)
| Pairing | Contrast | Grayscale values (mark / ground) | 3:1 graphic floor |
|---|---|---|---|
| A icon light: paper mark on sepia tile (top) | 4.78:1 | 248 / 111 | pass |
| A icon light: paper mark on sepia tile (bottom) | 6.47:1 | 248 / 90 | pass |
| A icon dark: accentDark mark on dark tile (top) | 6.58:1 | 175 / 41 | pass |
| B icon: paper big mark on dark tile (top) | 13.65:1 | 248 / 41 | pass |
| B icon: accentDark small mark on dark tile (top) | 6.58:1 | 175 / 41 | pass |
| B icon: accentDark small mark on dark tile (bottom) | 7.79:1 | 175 / 28 | pass |
| B lockup light: ink big mark on paper | 14.00:1 | 40 / 248 | pass |
| B lockup light: accent small mark on paper | 5.50:1 | 101 / 248 | pass |
| B lockup dark: inkDark big mark on night | 15.66:1 | 237 / 20 | pass |
| B lockup dark: accentDark small mark on night | 8.37:1 | 175 / 20 | pass |
| A/C lockup light: ink on paper | 14.00:1 | 40 / 248 | pass |
| A/C lockup dark: inkDark on night | 15.66:1 | 237 / 20 | pass |
| D icon: accentDeep mark on paper tile (top) | 6.47:1 | 90 / 248 | pass |
| D icon: accentDeep mark on paper tile (bottom) | 5.09:1 | 90 / 222 | pass |
| D tile edge vs white page | 1.35:1 | 222 / 255 | FAIL |
| D tile edge vs paper page | 1.00:1 | 248 / 248 | FAIL |
| A tile edge vs paper page (bottom of tile) | 6.47:1 | 90 / 248 | pass |
| B tile edge vs paper page (dark tile) | 16.14:1 | 28 / 248 | pass |
| B tile edge vs night page | 1.27:1 | 41 / 20 | FAIL |
| A tile edge vs night page | 2.68:1 | 90 / 20 | FAIL |

The 3:1 floor is WCAG 1.4.11 for graphical objects. Tile edges are not required to meet it; they are listed because they decide whether the icon keeps its shape.

## What was and was not checked
- Checked: luminance contrast for every pairing above, and a grayscale and one-colour render (`accessibility-check.png`, made with browser filters).
- Not checked: colour-blindness simulation with a validated tool, testing with people, print proofs, or physical emboss. Colour carries no meaning in either option, and both keep the same shapes in grayscale, which is why I expect them to hold, but that is an expectation, not a test.
- The one-colour column in the proof drops pixels from the thin serifs of the wordmark. That comes from the crude browser threshold at 34 px, not from the logo files. Print and emboss use the single-ink vectors.
- Trademark clearance (BL-355) is still open for every option.

## Files
- A: `packages/brand/assets/logo/primary` plus the touchpoint folders already in the registry. New: Android adaptive layers and Play icon in `options-r4/A-approved/touchpoints/android-sizes`.
- B: `packages/brand/assets/logo/options-r4/B-two-tone`, complete set including `touchpoints/`.
