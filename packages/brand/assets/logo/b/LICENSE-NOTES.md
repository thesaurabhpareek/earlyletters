# License notes: logo direction B

## Fonts

| Font | Where it is used here | License | Copyright line (from the shipped LICENSE file) |
|---|---|---|---|
| Literata 500 (TypeTogether, Google Fonts) | Outlined into `wordmark*.svg` and `lockup-*.svg`; also loaded by `presentation.html` | SIL Open Font License 1.1 | Copyright 2017 The Literata Project Authors (https://github.com/googlefonts/literata) |
| Mukta 400/500/600 (Ek Type) | Only in `presentation.html` body text. Not part of any logo file | SIL Open Font License 1.1 | Copyright (c) 2014, Girish Dalvi, Ek Type |

Source files: `node_modules/@fontsource/literata` 5.3.0 and `node_modules/@fontsource/mukta` 5.3.0 (license field `OFL-1.1`; full text in each package's `LICENSE`). Checked on Oct 3 2026: neither LICENSE file declares a Reserved Font Name.

## Why the wordmark is fine under the OFL

- The wordmark SVGs contain **vector outlines**, not a font file. The OFL governs the Font Software itself; artwork made with the font (a logo, outlined lettering) is a use of the font, not a redistribution of it. The OFL FAQ says so directly (FAQ 1.1 to 1.2 and the section on logos: fonts may be used for logos and the resulting artwork is not covered by the license). UNVERIFIED in this session: the FAQ's exact numbering, since the FAQ was not re-opened here; the license text in `node_modules` was.
- The redrawn "tt" (shared crossbar) and the custom spacing are modifications of outlines inside our artwork. We do not ship a modified font, so the OFL's Reserved Font Name and "Modified Version" conditions (sections 3 and 4) do not apply.
- If a future version ships a **font file** (for example a subset of Literata for the website or the printed book), that file must carry the copyright notice and the OFL text (section 2), must not be sold by itself (section 1), and a modified version must be renamed if a Reserved Font Name is ever declared.

## Symbol

The symbol, its centreline and the pen model are original work drawn in `src/build.ts` and `src/geometry.mjs`. No third-party artwork, icon set or font glyph is used in it. The curve-fitting routine follows the published algorithm by Philip J. Schneider ("An Algorithm for Automatically Fitting Digitized Curves", Graphics Gems, 1990), reimplemented here; no code was copied.

## Tools (not shipped)

opentype.js and wawoff2 (both MIT, per their package.json) read the font; Playwright Chromium renders PNGs. None of them end up in the assets.

## Trademark

Not a license matter, but noted for the founder: the name is not yet trademark cleared (`packages/brand/index.ts`). A clearance search should include this mark (a cursive "e" with a lead-in wave and underline) in classes 9 and 16 before it is filed or printed.
