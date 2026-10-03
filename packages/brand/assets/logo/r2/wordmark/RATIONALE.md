# Wordmark round 2: rationale (T1, wordmark)

## Recommendation
**Route A, Signature.** Literata, drawn at a display optical size, optically spaced, with one custom detail: the two t's in "Letters" share a single crossbar, and the first t stands a little taller than the second. A tall letter and a small letter, holding the same line. Nobody needs to notice it; the people who do will not forget it.

Route A ships as two cuts, which is how a type foundry would deliver a logotype:
- **Master** (above 32 px): Literata opsz 36, weight 480.
- **Small** (32 px and below, including the 28 px email header and 14 px): Literata opsz 12, weight 520, spacing opened 8 percent beyond the font's own rhythm, tt joined at equal height (the height difference is below one pixel there). The reversed small cut is drawn 20 weight units lighter, because light type on a dark ground spreads.

## Why round 1 was a font set, not a logotype
Round 1 is Literata 500 from `@fontsource`, which is the opsz 12 text instance: wedge serifs, low contrast, a typewriter stockiness meant for 10 pt body text. It used the font's text kerning plus a few pair tweaks, and bridged the tt with a separate rectangle. It is solid and legible, and that is all.

## What changed, and why (route A)
1. **Optical size 36 instead of 12.** Same family as the app's reading face (Literata is `letterBody`, `display`, `title1`), so the brand and the book still speak one voice, but the serifs get finer, the contrast rises, the apertures tighten. It now looks drawn for a title, not for a paragraph.
2. **Weight 480.** Heavy enough to sit next to a filled symbol at 29 to 60 px without looking like a caption; light enough to stay "a letter", not "a sign". At 28 px and below the small cut takes over.
3. **Optical spacing, the font's kerning discarded.** Each pair is spaced to the same white area between baseline and x-height (the Letterspacer method, depth-clamped at 90 units), set to 90 percent of Literata's own "nn" rhythm for display tightness. Hand corrections on top: `Le` -32 (the L's open foot), `rl` +10 (the r's ball terminal crowds the l), `Ea` -6, word space -10 after the y's diagonal.
4. **The tt.** One continuous contour (no overlapping shapes): the first t keeps its arm, the bar runs straight to the second t and flows into its ascender through a re-drawn bracket tangent to the bar. The first t's ascender is raised 48 units (about 7 percent of its height), tapering to zero at the bar. Studies at 0, 48 and 95 units are in `sketches/`: 95 reads as an "l", 0 is just a ligature.
5. **Kept untouched on purpose.** The "a" and "r" already end in Literata's ball terminals, the warmest detail in the face; enlarging them turned the word childish. The "y" descender was studied as a longer tapering tail: it read as an underline under "Early" (round 1's lesson about horizontals), and its taper vanished at 28 px. The Literata y with its ball stays.

## The other routes, honestly
- **B, Fine** (Literata opsz 72, weight 420). The most elegant at 64 px and above, closest to Penguin Classics and Apple Books jackets. Its hairlines break up below 40 px (see the 4x pixel strips), so it can never stand alone; it would need route A's small cut, and two different-looking wordmarks is one too many. Possible later use: the printed book's cover title, nowhere else.
- **C, Spaced small caps** (capitals with Literata's true small caps, tracked +90 units). Calm, bookish, reads beautifully on a spine and an emboss. But capitals are formal and announce rather than speak; it loses the lowercase warmth that matches a voice talking to a baby. It is also about 40 percent wider at the same cap height, which hurts every lockup and the 28 px email header.
- **D, EB Garamond** (alternative OFL serif, weight 500, with its own historical t_t ligature). The warmest, most heirloom voice of all four. Not clearly better: Garamond is one of the most used faces in publishing and luxury, so it is less ownable; its small x-height makes it the smallest at 28 px; and it breaks the family with the app's Literata. Kept as a route so the director can see the alternative, not as a recommendation.
- **Other serifs checked and dropped** (specimen in `sketches/`): Newsreader (sharper, colder), Source Serif 4 (neutral), Fraunces (warm, but the default startup serif of recent years). All OFL; none clearly better than Literata.

## Pairing with a symbol (notes for phase 4)
- At 29 to 60 px a symbol is usually drawn heavier than text. The master weight 480 can move to 500 in a lockup if the chosen symbol is solid; the build makes that a one-number change (`routes.mjs`).
- In a horizontal lockup the symbol should be sized to the wordmark's cap height plus descender, not to the x-height; the baseline position is in `source/metrics.json`.

## Weaknesses
- Literata is a free Google font, so the base letterforms are not unique; the ownable parts are the tt, the spacing and the cut. A paid custom drawing would go further.
- The tall t is subtle by design. If the director wants it legible as a story, it can rise to about 65 units before it starts to read as an error.
- Two cuts means two files to manage. The rule is simple (32 px or below: small), but it must be documented in the brand guide.

## Files
Per route folder (`a-signature/`, `b-fine/`, `c-small-caps/`, `d-garamond/`): `wordmark.svg`, `wordmark-reversed.svg`, `wordmark-accent.svg`, `wordmark-small.svg`, `wordmark-small-reversed.svg`, `wordmark-small-accent.svg`. `presentation.html` compares all routes at 14, 28, 64 and 160 px on paper and night, with real-pixel renders magnified. Rebuild: `node packages/brand/assets/logo/r2/wordmark/source/build.mjs` (needs python3 with fontTools for the instancer, opentype.js, and Playwright Chromium for PNGs).
