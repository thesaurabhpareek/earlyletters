# Logo direction A: license notes

## Fonts used

| Font | Use in this folder | Source | License |
| --- | --- | --- | --- |
| Literata (SemiBold 600, Bold 700) | The symbol: a Literata lowercase e, opened along its crossbar | `@fontsource/literata` 5.3.0, file `literata-latin-{600,700}-normal.woff` | SIL Open Font License 1.1. Copyright 2017 The Literata Project Authors (https://github.com/googlefonts/literata) |
| Literata (Medium 500) | The wordmark "Early Letters", hand-kerned, with a joined tt | `@fontsource/literata` 5.3.0, file `literata-latin-500-normal.woff` | Same as above |
| Mukta | Not in any logo file. Used only as live UI text inside `presentation.html` | `@fontsource/mukta` 5.3.0 | SIL Open Font License 1.1. Copyright (c) 2014, Girish Dalvi, Ek Type |

The license text ships in `node_modules/@fontsource/literata/LICENSE` and `node_modules/@fontsource/mukta/LICENSE`. Neither license declares a Reserved Font Name.

## Why outlining is permitted

The SIL Open Font License restricts how the **Font Software** is modified and redistributed. It does not restrict artwork made with the font. The OFL FAQ says that a document or image created with an OFL font, including a logo, is not a derivative of the Font Software and does not have to be released under the OFL (OFL FAQ, questions 1.1 and 1.2: https://openfontlicense.org/ofl-faq/).

Every SVG in this folder contains filled paths only. There is no live text, no embedded font, and no font file is redistributed. The outlines were then edited by hand (the symbol's crease opening, the tt join, the spacing), which makes them logo artwork rather than a copy of the typeface.

## Things to keep true

- Do not ship the Literata or Mukta font files under the name "Early Letters", and do not describe the logo as a font.
- Trademark: the OFL gives no trademark rights, and none are needed for a mark drawn from it. Clearing "Early Letters" and this mark as a trademark is a separate task. `packages/brand/index.ts` notes the name is not yet trademark-cleared.
- If the symbol is ever redrawn from scratch rather than from Literata outlines, update this file.

## Rebuild

```bash
node packages/brand/assets/logo/a/source/build.mjs          # SVGs, favicon, app icons, PNG renders
node packages/brand/assets/logo/a/source/build.mjs --no-png # SVGs only
node packages/brand/assets/logo/a/source/shoot.mjs <dir>    # screenshots of presentation.html
```

Requires `opentype.js` (repo dependency) and Playwright with Chromium (used from `/opt/npm-tools` in the build environment).
