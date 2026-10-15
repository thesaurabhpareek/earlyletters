# Final cold read: X vs Y (B redraws)

## 1-second impressions (recorded before viewing anything else, unedited)

**X (left):** A chunky, soft "66" quotation mark. Bubbly, friendly, rounded. Its blob-like weight reads a little cartoonish/toddler; the big glyph alone could pass for a fat "6" or a bean/cashew. Small glyph sits lower and to the right like a child beside a parent. Warm. No tadpole read. Guess: quotes app, kids' story app, or a messaging app.

**Y (left/right: right):** A crisp, classic typographic opening quote. Sharper wedge terminals, more contrast, more editorial and grown-up. Reads instantly as a quotation mark, nothing else. Guess: reading, quotes, writing or journaling app. Feels premium, slightly cooler than X. No tadpole, sperm or cherry read.

Both: the tile now has a subtle vertical sepia gradient, which already looks richer than round 1's flat tile.

---

## Did the round-1 fixes land?

| Check | X | Y |
|---|---|---|
| No tadpole / sperm / cherry read | Yes. Gone. | Yes. Gone. |
| Reads as a true "66" opening quote | Mostly. The big glyph is tall and blobby, so it also reads as the numeral "6" (at 29pt in Settings it looks like "6c"). | Yes, instantly. The wedge terminals make it typography first. |
| Small = scaled parent | Yes. Measured on the 1024 master: small is about 0.62x the parent in bowl width and 0.63x in height, and the bottoms align. | Yes. About 0.63x in width and 0.64x in height, with matching tail angles and aligned bottoms. |
| Joins (tail into bowl) | Smooth and soft. | Mostly clean, but a small dimple or nub sits at the inner join of both glyphs (about x450, y465 on the big one). At 1024 and in the lockup it looks like a glitch, not a decision. |
| 16 / 29 px | Strong. The heaviest mass and the best 16px. Glyphs nearly touch at 29px. | Good. Thin tail terminals drop to about 1px at 16px, and the gap between glyphs (~18/1024) almost closes at 29px. The symbol-small cut fixes this, but only if the app ships an asset catalog with All Sizes. |

## Scores (1 to 10, same axes)

| | Simple | Elegant | Communicative | Expressive | Elite | Recall | Small size | Total /70 |
|---|---|---|---|---|---|---|---|---|
| X | 9 | 6 | 6 | 7 | 6 | 9 | 8 | 51 |
| Y | 9 | 9 | 6 | 6 | 8 | 8 | 7 | **53** |

## Which is better: Y

- Y reads as a real typographic quotation mark, the clearest link to "Exactly as you said it." It looks grown-up and editorial, not babyish.
- Its wedge terminals fit the oldstyle serif wordmark in the lockup. X's soft blobs clash with that serif and look rounder and more toddler-like than the brief allows ("grown-up, heirloom, never babyish").
- X is warmer and slightly more legible at 16px. Its risks are reading as the numeral "6" or "66", and looking cartoonish next to the elegant wordmark.

## Remaining must-fix issues (Y)

1. **Gap between the glyphs.** It is about 18/1024 and closes below 40px. Widen it to about 32 to 40/1024 in the master, or make sure the symbol-small cut actually ships (asset catalog with All Sizes, not a single Icon Composer master).
2. **Inner-join nub.** Smooth the small bump where each tail meets its bowl into one continuous curve. It is the one non-elite detail at large sizes and in the lockup.
3. **Thin terminals at small sizes.** In the small cut, thicken the tail tips about 15 to 20% so they don't drop to a single pixel at 16px.
4. **Optical size.** The mark fills less of the tile than neighbouring icons. Scale it up about 6 to 8%.
5. **Ownability (verify, not a redraw).** Quotation-mark icons are common in quotes, notes and testimonial apps. Check the App Store category. The parent/child scale difference and the sepia tile are the only distinctive features, so keep the 0.63 ratio clearly visible and don't drift toward an equal-size "66".
6. **Optional, for tenderness.** Move the small glyph a touch closer to the big one, or lean it slightly toward it, so "parent and child" is felt, not just "a typographic quote".

## Verdict

**Y: yes, with conditions.** It clearly meets simple, elegant and elite. Recall is strong. It is communicative and expressive only partly: on its own it says "someone's words" rather than "letters to my child". With the name and the tagline "Exactly as you said it" it clicks, and that is a fair standard for an app icon. It meets the founder's bar once must-fixes 1 to 3 are done and the ownability check (5) passes.

**X: no.** It is good and warm, but its digit-like, babyish softness misses "elegant" and "elite".
