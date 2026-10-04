# Final identity critique, round 2: finalists X and Y (refined quotation-mark symbol)

Reviewer stance: senior identity designer, no stake. Only the blind2 packet was viewed: overview, both 1024 masters, symbol-and-lockup, sizes (including 8x magnified), appearances, home light/dark/tinted, the small cuts at 16 and 29 px, notification, settings/spotlight. Measurements were taken on the 1024 masters.

## Verdict up front

- **Pick: Y.** It is the more grown-up, more typographic and more ownable drawing, and it belongs to the same family as the W4 wordmark.
- **Merge: yes, selectively.** Keep Y's drawing and give it X's presence in the tile. Also test restoring a modest version of the round-1 gesture (the large mark reaching over the small one). Both finalists dropped it, and it was the most ownable part of the idea.
- **Founder's bar: not yet (no).** Y meets "simple" and "elegant", and comes close on "elite". It falls short on ownability and recall: as drawn, both finalists are a well-made but standard opening quote with a smaller second mark. The must-fixes below are a short, specific job, not a restart.

## Measurements (1024 masters)

| | Glyph box | Box centre | Mass centre | Ink | Small/large mark (linear) | Min gap between marks |
|---|---|---|---|---|---|---|
| X | 59% x 56% (219-828, 208-785) | 523, 496 | **487, 559** | 18.5% | 0.62 | 26 px |
| Y | **49% x 49%** (256-755, 262-761) | 505, 511 | **487, 569** | 12.7% | 0.62 | 25 px |

- Both now use the same parent drawing scaled for the child (area ratio 0.38, linear 0.62). That is the round-1 fix, done correctly.
- Gradient tile: #94603F at the top to #7C4F33 at the bottom (identical in both). It is clean, with no hue shift, but it only has **59 discrete 8-bit steps across 1024 px**, so each band is about 17 px tall. On some displays and in screenshots and compression this can show faint banding.
- Both glyphs have their mass 25 px left of centre and 47 to 57 px below it. The heavy bowls sit low, which makes both icons look slightly dropped in the tile.

---

## X: soft, ball-terminal pair

**Form.** Confident, bold, very legible.
- **Terminals:** rounded "ball" caps. They are friendly but read as soft and bubbly, closer to a rounded display face (Cooper or VAG-type warmth) than a book face.
- **Inner join:** the tail-to-bowl join is now smooth, but the inner contour runs as an S-curve. The concave hook under the tail at about (415-440, 380-430) bulges, so the inside reads as "pinched dough" rather than a drawn stroke.
- **Outer contour:** the left outer contour of the large bowl has a long, almost straight run from about (230, 600) up to (330, 330). It is stiff next to the full round bowl.
- **Silhouette:** reads first as "66". The marks are heavy (18.5% ink), and on the home screen it is the boldest tile in the row.
- **Tile position:** good scale (59%). The mass sits low and left.

**Small sizes.** Excellent. It is the most robust at 16, 29 and 40 px, and the small cut separates the marks cleanly.

**Pairing with W4.** Weak. The ball terminals and soft mass fight W4's wedge serifs and old-style stress. In the lockup the symbol looks like it came from a different typeface.

**Premium signal.** Medium. Warm and approachable, with a slight lean toward babyish and toy-like, which the brief explicitly rules out.

| simple | elegant | communicative | expressive | elite | craft | recall | small-size |
|---|---|---|---|---|---|---|---|
| 8 | 6 | 7 | 7 | 6 | 7 | 7 | 9 |

---

## Y: typographic wedge-terminal pair

**Form.** The better drawing.
- **Terminals:** angled wedge, the classic old-style quotation-mark construction. Its stroke tapers consistently from the bowl to the cut.
- **Inner join:** the inner join is resolved with a small round "button" at the tail root (about 445-460, 440-475). That is correct typographic detailing. It is slightly fussy at 1024, but disappears at icon sizes.
- **Bowls:** clean, near-circular, with good curve quality.

**Must-look-at details.**
1. The wedge cap's leading corner at about (548, 262) on the large mark (and the equivalent on the small mark) has a very small radius, about 6 to 8 px, against generous curves everywhere else. It reads as almost sharp, and it is the only near-point in the mark.
2. Slight dog-leg at the outer bowl: where the outer tail contour meets the bowl at about (262-270, 560-600) there is a short flattened segment, a visible change of curvature. It needs G2 continuity.
3. **Undersized in the tile:** at 49% it looks small and light next to Clock and Weather (12.7% ink), and at 29 and 40 px the small mark's tail thins to a wisp.

**Small sizes.** Good at 40 px and above. Acceptable at 29 px with the small cut. At 16 px the small mark's tail fragments (see the 8x row), though it still reads as a quote.

**Pairing with W4.** Strong. The wedge terminals and stroke modulation echo W4's Garamond-type serifs and the "tt" ligature. It looks like the opening quote of the wordmark's own typeface: one voice.

**Premium signal.** High. It sits comfortably beside Penguin- and Aesop-level restraint. In dark and tinted modes it looks especially refined.

| simple | elegant | communicative | expressive | elite | craft | recall | small-size |
|---|---|---|---|---|---|---|---|
| 8 | 8 | 7 | 7 | 8 | 8 | 7 | 7 |

---

## The honest concern (both finalists)

Round 1's B was ownable because the large mark's tail *reached over and sheltered* the small one: parent and child in a single gesture. Both redraws fixed the craft by removing that gesture. What is left is an opening quotation mark in two sizes. It is clean and legible and carries the tagline, but quotation marks are a crowded motif (quote apps, review sites, publishing). Recall is now about a 7, not a 9. The scale difference alone carries "parent and child" only faintly.

## Merge recommendation

Yes. Take:
- **From Y:** the whole drawing (wedge terminals, button join, stroke taper, W4 kinship).
- **From X:** tile occupancy (about 56 to 58% box) and small-size robustness (heavier small cut, wider gap).
- **New:** make one exploratory variant where the large mark's tail extends about 12 to 15% further and curls over the small mark's terminal. It should end above the small mark's stem axis, not past the tile's optical edge. Test it against plain Y at 60 px and 29 px. If it reads as "sheltering" without hurting legibility, it wins on ownability. If it looks contrived, ship plain Y.

## Must-fix list (apply to Y)

1. **Scale up by 15%.** Glyph box from 49% to about 56% of the tile, which is still well inside the iOS safe area.
2. **Re-centre optically:** move the glyph **right 18 px and up 40 px** (at 1024), so the mass centre lands at about (505, 525). That is slightly above geometric centre, where a bottom-heavy mark looks centred.
3. **Wedge corners:** raise the leading-corner radius on both wedge caps from about 7 px to about 14 px (at 1024 master scale; scale proportionally for the child). It then matches the softness of the button join.
4. **Outer join:** remove the flat segment where the outer tail contour meets the bowl (large mark about 262-270, 560-600; same place on the small mark). Make it one continuous G2 curve.
5. **Gap:** widen the minimum gap between the marks from 25 px to about 34 px at 1024. This preserves at least 1 device px at 29 px from the master.
6. **Small cut (16 to 40 px):** thicken the small mark's tail by 20% and shorten it by 10%, so it doesn't fragment at 16 px. Keep the child an exact scale of the parent in the master; only the small cut deviates.
7. **Gradient:** export with dithering or noise (or build it in Icon Composer as a native gradient) to remove the about-17 px 8-bit steps. Keep the endpoints #94603F to #7C4F33.
8. **Lockup:**
   - Set the symbol's height so the bowl bottoms sit on the baseline with a 2% round overshoot, and its top aligns with W4's ascender (the "l" and "tt"). It currently overshoots the ascender by about 15 px at lockup scale.
   - Set the symbol-to-wordmark space to 0.7x the cap height of "E" (currently about 0.5x, which is tight).
   - Provide a stacked lockup (symbol centred above the wordmark) for the App Store and print.
9. **Check readings:**
   - "66": rotating the pair 3 to 5 degrees counter-clockwise can make it read more as a quote and less as digits. Test it.
   - RTL and Arabic contexts: the mark reads as a shape, which is acceptable.
10. **Paper-ground version** (sepia glyph on #FBF8F3) for web and print, so the symbol never only exists on a tile.

## Final position

Y is the right foundation and is within a day of focused work of being good enough to ship. It does **not** yet meet "very high quality bar, with brand recall", because it is currently a beautifully set punctuation mark, not yet a distinctive mark. Apply fixes 1 to 7. Then run the "sheltering tail" variant as a single A/B test against plain Y. Whichever survives a 60 px and 29 px blind recall test with five or more parents is the logo.
