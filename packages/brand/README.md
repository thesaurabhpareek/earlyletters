# @scribe/brand

The product's public identity: name, domain, support address, bundle ID, and the logo and asset registry. Rename the product here and nowhere else.

## What is in it

| Path | What |
|---|---|
| `index.ts` | Public name, store name, publisher, domain, bundle ID. The only place the name lives |
| `registry.ts` | Typed brand asset registry: one stable id per asset, and the contexts that use them |
| `registry.json` | Generated from `registry.ts`. A test fails if it is out of date |
| `assets/` | Logos, email logos, favicons, OG image, notification glyphs, social and video plates, fonts |
| `scripts/` | `build-registry.mjs` writes `registry.json`. `build-touchpoints.mjs` builds the touchpoint files from the primary mark |
| `test/` | `brand.test.ts`, `registry.test.ts` |

## Commands

```bash
npm test -w @scribe/brand                        # vitest run
npm run test:coverage -w @scribe/brand
node packages/brand/scripts/build-registry.mjs   # after editing registry.ts
```

## Rules

- The brand system is `docs/brand/BRAND_SYSTEM.md`. Words and voice are in `../content/BRAND.md` and `../content/VOICE.md`.
- Code, the repo, the database and the bundle ID use the codename `scribe`. That never changes.

## Do not

- Do not hardcode "Early Letters" anywhere else. Import it from `index.ts`.
- Do not hardcode a logo path. Ask the registry for the asset id.
- Do not change `publisher.domain` after the first build is uploaded to App Store Connect. The bundle ID comes from it.
- Do not put a real legal name in code. Legal documents carry it.
