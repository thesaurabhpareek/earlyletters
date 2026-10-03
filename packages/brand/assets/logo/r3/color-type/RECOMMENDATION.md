# color-type: tile colour and wordmark (logo round 3)

Slug `color-type`. Stand-in symbol: r2 `two-voices/symbol.svg` (B). Renders are in `png/<symbol>/`. I looked at every PNG named here.

## 1. App icon tile

### Recommendation
| Appearance | Tile | Mark | Contrast |
|---|---|---|---|
| **Default** | vertical gradient **#9A613C to #7F4F30** ("Leather T") | paper #FBF8F3 | 4.78 top, 5.53 middle, 6.47 bottom |
| **Dark** | #2C2926 to #1F1B18 (unchanged from r2) | accentDark #D9A47E | 6.58 to 7.79 |
| **Tinted** | none. Ship the mark as one solid grayscale layer and let the system tint it | n/a | simulated 3.7 to 6.8 (system-controlled) |

Token change: add `accentDeep: '#7F4F30'` and an `icon` block. Proposed diff in `PROPOSED_TOKENS.md`. `index.ts` is not edited.

### Why this one (seen in `lineup-*.png`, with all candidates on one home screen)
- **Current flat #8A5A3B** is the muddy one. In OKLCH it sits at L 0.51 and C 0.078, a mid-light brown with little colour. Next to saturated system icons it goes grey, like milk chocolate. The critics were right about this.
- **Flat deep #7F4F30** is richer, because the same chroma at lower lightness reads as more colour. But it is still one flat slab and looks dense next to glossy neighbours.
- **Gradient A (#94603F to #7C4F33, the critic's proposal)**: the lighter top looks dusty and greyish. It is the muddiest of the gradients.
- **Leather (#9A613C to #7D4A2C)** and **Leather T (#9A613C to #7F4F30)**: the warm copper top and deep base make the cleanest, most alive tile in the set (chroma 0.085 to 0.087). It reads as cognac leather or a book spine, not coffee and not a parcel. The two are indistinguishable on screen, so I picked **Leather T** because its base is exactly the new `accentDeep` token. That gives one fewer magic number.
- **Paper tile** is beautiful in print, but on a phone it merges with the white neighbours (Calendar, Photos, Health; the tile is 1.03:1 against white). It loses its tile edge on pale wallpapers, and the mark's contrast drops to 4.97 at the bottom. Use it for web and print, not as the app icon. This matches the identity critic.
- **Ink tile** is elegant, but on a light home screen it reads as a dark-mode icon or a utility app (Clock, Wallet). It gives away the warmth that is our point of difference. It is already used, correctly, as the dark appearance.
- At 29 and 16 px (`compare-small-sizes.png`) all the sepia tiles hold the same. The gradient is invisible at 16 px, so nothing is lost.

### Honesty notes
- The bench only approximates Liquid Glass. Final sign-off on the gradient must happen in Icon Composer (set the gradient there, do not bake it) and on a device.
- The bench log line `contrast default fg/bg 19.82:1` is wrong for gradient tiles, because the bench parses only hex. Use the numbers above.
- **Bench bug:** `r2/icon-craft/bench.mjs` does not parse. `writeIndex` has unescaped backticks around `bench/COMPARE_V1.png`, which causes a SyntaxError, so `node bench.mjs` fails for everyone. I used a patched copy, `source/bench-fixed.mjs`, with only three changes (escape, paths, an export line). The owner of icon-craft should apply the one-character fix.

## 2. Wordmark: W4 (EB Garamond) vs W1 (Literata)

### Critic fixes applied to W4 (`wordmark/`)
- Word space opened 15 percent: mean clamped white went from 266.9 to 306.9 font units (wordSpace 120 to 160). Word-to-letter ratio went from 1.82 to 2.09. "EarlyLetters" no longer runs together at 14 to 28 px (`wordmark-w4-before-after-14-28.png`).
- Small cut for under 20 px: weight 540, +2.5 percent tracking (25 units), word white 375. The 560 weight was indistinguishable at 14 px, so I used the lighter one to keep the counters of e and a open.
- Licence: EB Garamond Version 1.003, name table ID 13 is "SIL Open Font License, Version 1.1", copyright "2017 The EB Garamond Project Authors", with no Reserved Font Name. I checked this in the pinned font file. The outlined logo is artwork, not Font Software (OFL FAQ). There are no trademark rights either way.

### Verdict: **W4 revised**, with two rules
1. **Size by x-height, not by em.** Garamond's x-height is 0.41 em and Literata's is 0.51 em. At the same em, W4 looks about 20 percent smaller, which is most of why it looked weaker at 14 px. Set W4 at 1.2 times the size you would give W1.
2. **Floor:** use the master from 20 px, the small cut from 13 to 19 px, and the symbol alone below 13 px. W1 small is still the more legible face at 14 px. That is the cost of W4, and I am saying so plainly.

Why W4 still wins: at 28 px and up, on the splash and in the email header, it is the only one of the two that looks like a book rather than an app. Its humanist stress and the tt ligature echo the quote mark's calligraphy. W1 is sturdier and matches the in-app Literata headings, but next to the mark it reads as "well-set UI". The brand promise (heirloom, literary, loud letters) favours W4. W1 stays the fallback, and it is the right choice if the founder ranks small-size legibility above voice.

Pairing note: the quote mark is heavier than Garamond's stems. In the lockup I set the symbol to an optical size of 1.45 cap heights. The symbol redesigns in r3 should not get heavier, or the lockup will tip.

## 3. Rerun on the r3 symbols (quote and quote-letter, both DONE at 14:53 and 14:56 UTC)
The full study was rerun on each final `symbol.svg` (with its `symbol-small.svg`) into `png/r3-quote/` and `png/r3-quote-letter/`. I looked at the light lineups, the small-size sheets, the recommended appearances, the W4/W1 matrix and the splash.
- **Tile: same verdict.** Leather T is still the cleanest and the current flat tile still the dullest. The new marks are heavier and more typographic, which helps every tile at 16 to 29 px. The paper tile looks better with the bolder mark, but it still merges with white neighbours.
- **Wordmark: same verdict, and stronger.** The redrawn 66 is a book-face quote, so it rhymes with EB Garamond much better than B's curled tails did. W4 revised plus r3-quote is the most coherent pairing in the study.

## Files
- `presentation.html`: the whole study
- `PROPOSED_TOKENS.md`: the token diff and WCAG table
- `colors.json`: every ratio and OKLCH value
- `wordmark/`: W4 revised SVGs (ink, reversed, accent, small) and `lockups/<symbol>/`
- `png/<symbol>/`: `lineup-*`, `compare-*`, `recommended-*`, `wordmark-*`
- `source/`: `colors.mjs`, `tiles.mjs`, `lineup.mjs`, `wordmark.mjs`, `wordtype.mjs`, `bench-fixed.mjs`
