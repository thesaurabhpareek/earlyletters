# @scribe/design-tokens

Colours, type, spacing, radii, elevation, motion and tap targets, plus the bundled fonts. One source for iOS and web. No runtime dependencies.

## What is in it

| Path | What |
|---|---|
| `src/tokens.ts` | The tokens. This is the source |
| `src/build-css.ts` | Writes the CSS files in `dist/` |
| `dist/tokens.native.css`, `dist/tokens.web.css` | Generated CSS for native and web |
| `src/build-grain.ts` | Writes `textures/grain.png` from the grain token |
| `fonts/` | Bundled Literata and Mukta files, with their OFL licences |
| `textures/` | Texture files |
| `test/` | Token tests, including a check of the grain file |

## Commands

```bash
npm test -w @scribe/design-tokens
npm run typecheck -w @scribe/design-tokens
npm run build -w @scribe/design-tokens        # regenerate dist/*.css
npm run build:grain -w @scribe/design-tokens  # regenerate textures/grain.png
```

## Rules

Design language: `docs/design/DESIGN_LANGUAGE.md`. Components: `docs/design/COMPONENT_LIBRARY.md`.

## Do not

- Do not hand-edit `dist/` or `textures/grain.png`. Change `src/tokens.ts` and rebuild.
- Do not add runtime dependencies.
