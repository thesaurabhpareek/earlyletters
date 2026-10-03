# Early Letters: Brand system

v1.0, 2026-10-03. The single source agents and people read before touching any brand surface.
Registry: `packages/brand/registry.ts` (typed) and `packages/brand/registry.json` (generated). Mark: `packages/brand/assets/logo/primary/`.
**(opinion)** marks judgement. Everything else is measured or decided.

One brand, every touchpoint: app, website, email, App Store, printed book, cards. Premium, calm, personal. If a surface needs a logo, it asks the registry which one. Nobody picks a file by name.

---

## 1. The idea of the mark

Two opening quotation marks, one large and one small, leaning together. A grown-up voice and a small one, and the moment before someone speaks. Opening quotes, never closing ones: the letters are still being written.

- **Quotation marks** say *these are your exact words*. That is our promise (constitution in `CLAUDE.md`): the machine may remove and repair, it never adds meaning.
- **The pair** is parent and child. The small mark leans toward the large one (14 degrees) at 0.62 of its size. It is not a speech bubble, a chat icon or a sparkle.
- **The wordmark** is EB Garamond, outlined, with its `tt` ligature and a word space opened 15 percent. It reads as a book, not an app.
- **The colour** is sepia: cognac leather, a book spine, ink on paper.

Approved by the founder on 2026-10-03 as r3 `final-a`. `primary/` is a byte-identical rebuild of it (`node packages/brand/assets/logo/primary/source/build.mjs`).

**Smart, never the author.** The product feels thoughtful and quick: it remembers the child's age, suggests a prompt, lists the right language. The brand never implies that software writes, improves or shapes a person's words. No sparkles, wands, robots, "AI" badges or "magic" anywhere near the mark or in any brand line.

---

## 2. The registry: how to use ids

Every asset has one stable dot-notation id with a path, format, dimensions, the colour and surface it is for, a minimum size, status (`primary` or `deprecated`), version and date. Every touchpoint is a **context** that lists the ids it uses, light first.

```ts
import { assetFor, asset, assetPath } from '@scribe/brand';

assetFor('email.header.light');           // [email.logo.light@2x, email.logo.light@1x]
asset('logo.lockup.horizontal.ink').minSize; // { px: 27, dimension: 'height', below: 'logo.lockup.horizontal.small.ink' }
assetPath('icon.app.default');            // packages/brand/assets/logo/primary/app-icon-1024.png
```

Plain Node and non-TS tools read `packages/brand/registry.json` (same data). Files with a `url` are served on earlyletters.com at that path; `apps/web/scripts/sync-brand-assets.mjs` copies them before every build.

**Rules**
1. Never hardcode a brand file path. Resolve the context, or the id if no context fits. Need a new touchpoint? Add a context.
2. Ids are permanent. Redraw = same id, new `version` and `date`. Retire = `status: 'deprecated'` plus `supersededBy`.
3. Contexts only reference `primary` assets. The test fails otherwise.
4. Anything under a `deprecated.*` path (logo rounds 1 to 3, the B3 interim email lockup, email directions a and b) is history. Do not use it, copy from it or link to it. `assetForPath(path)` tells you the status of any file.
5. After editing `registry.ts`, run `node packages/brand/scripts/build-registry.mjs`. `npm test` checks that every path exists, dimensions match the files, ids are unique, every context resolves, no context uses a deprecated asset, colours equal `packages/brand/index.ts`, and the JSON is current.

**Build order** (repo root): `primary/source/build.mjs` (mark, icons) then `packages/brand/scripts/build-touchpoints.mjs` (email, favicon, OG) then `build-registry.mjs`.

### Ids (80)
| Group | Ids |
|---|---|
| Symbol | `logo.symbol.ink`, `.reversed`, `.accent`, `logo.symbol.small.ink`, `.small.reversed` |
| Lockups | `logo.lockup.horizontal.ink`, `.reversed`, `logo.lockup.horizontal.small.ink`, `.small.reversed`, `logo.lockup.stacked.ink`, `.reversed` |
| App icon | `icon.app.default`, `icon.app.dark`, `icon.app.tinted` (1024 masters); `icon.app.{16,29,32,40,60,180,192,512}` and `.dark` (hand-tuned) |
| Web | `favicon.svg`, `favicon.png32`, `favicon.apple-touch`, `favicon.icon192`, `favicon.icon512`, `favicon.manifest`, `og.image` |
| Email | `email.logo.light@2x`, `@1x`, `email.logo.dark@2x`, `@1x`, `email.logo.light.svg`, `email.logo.dark.svg`, `email.avatar`, `email.bimi.template`, `email.manifest` |
| Colour | `color.ink`, `inkMuted`, `paper`, `paperRaised`, `accent`, `accentDeep`, `accentSoft`, `line`, and the `*Dark` set; `color.icon.tileTop`, `tileBottom`, `darkTileTop`, `darkTileBottom` |
| Type | `font.wordmark`, `font.reading`, `font.ui`, `font.devanagari` |
| Sources | `source.logo.build`, `source.logo.geometry`, `source.touchpoints.build`, `source.icon.bench` |
| Deprecated | `deprecated.logo.r1.a`, `.r1.b`, `.r2`, `.r3`, `deprecated.email.interim.source`, `.interim.bimi`, `deprecated.email.direction.a`, `.b` |

### Contexts (22)
| Context | Uses | Rule |
|---|---|---|
| `app.icon` | `icon.app.default`, `.dark`, `.tinted` | 1024 masters only. No text, border or baked corners. |
| `app.splash` | `logo.symbol.ink`, `.reversed`, `color.paper`, `color.paperDark` | Symbol alone, 96 pt, centred. |
| `app.header` | `logo.lockup.horizontal.small.*` | 20 to 26 pt. Navigation bars keep the system title. |
| `app.paywall` | `logo.lockup.stacked.*` | 88 to 120 pt, above Apple's subscription view. |
| `app.settings.about` | `icon.app.180`, `.180.dark`, small lockup | Icon at 60 pt, lockup at 22 pt. |
| `web.header` | `logo.lockup.horizontal.ink` | Inline SVG, `currentColor`, 28 px. |
| `web.footer` | `logo.lockup.horizontal.small.ink` | Inline SVG, `currentColor`, 22 px. |
| `web.og-image` | `og.image` | 1200 x 630 with width, height and alt. |
| `web.favicon` | `favicon.svg`, `.png32`, `.manifest`, `.icon192`, `.icon512` | SVG first. |
| `web.apple-touch` | `favicon.apple-touch` | 180 opaque square. |
| `email.header.light` / `.dark` | `email.logo.*` | 154 x 32, not a link. |
| `email.avatar` | `email.avatar`, `email.bimi.template` | See EMAIL_IDENTITY.md 6. |
| `email.footer` | `font.ui`, muted colours, line | Text only. |
| `appstore.icon` | `icon.app.default` | Opaque RGB, no alpha. |
| `appstore.screenshot-badge` | `logo.symbol.accent`, `.reversed` | Symbol only; the UI is the hero. |
| `book.cover.emboss` | `logo.symbol.ink` | One colour, 18 to 30 mm, blind or accentDeep foil. |
| `book.spine` | `logo.symbol.small.ink`, small lockup | Lockup only on spines 12 mm or wider. |
| `gift.card` | `logo.lockup.stacked.ink`, `color.accentSoft`, `font.reading` | |
| `invite.card` | `logo.lockup.horizontal.*`, `font.reading` | Never a child's name the parent did not type. |
| `social.avatar` | `icon.app.default` | Platforms crop to a circle; the mark stays inside. |
| `press.kit` | lockups, symbols, icons, OG | Plus sections 3 to 5 of this file. |

---

## 3. Clear space and minimum sizes

**Clear space.** Keep a margin of one cap height of the wordmark's E (call it **x**) on every side of a lockup, and half the symbol's height around the symbol alone. The SVGs already include a margin of 0.25x (horizontal) and 0.3x (stacked); that is the floor for tight placements such as the email header, never a target.

**Sizes**, measured as the height of the SVG as shipped (with its built-in margin):

| Asset | Use from | Below that, use |
|---|---|---|
| `logo.lockup.horizontal.*` | 27 px (wordmark em 20 px) | the small cut |
| `logo.lockup.horizontal.small.*` | 17 to 26 px | the symbol alone |
| `logo.lockup.stacked.*` | 66 px | the horizontal lockup |
| `logo.symbol.*` | 24 px | the small-cut symbol |
| `logo.symbol.small.*` | 12 to 23 px | nothing smaller; 16 px favicon is the floor |
| App icon | the 1024 masters; the system scales | hand-tuned PNGs only where a fixed raster is required |

Why: EB Garamond's x-height is 0.41 em (Literata's is 0.51), so the wordmark looks about 20 percent smaller than Literata at the same size. The small cut (weight 540, +2.5 percent tracking, wider word space) keeps the counters open at 13 to 19 px; below that the name stops being readable and the symbol carries the brand alone (r3 color-type study).

---

## 4. Colour

Values live in `packages/brand/index.ts` (UI roles in `@scribe/design-tokens`). Ratios are WCAG 2.x, computed in DESIGN_LANGUAGE.md section 2 and r3 `color-type/PROPOSED_TOKENS.md`.

| Id | Hex | Role | Contrast |
|---|---|---|---|
| `color.ink` | #2B2722 | Text, one-colour logo on light | 14.0:1 on paper |
| `color.inkMuted` | #6B645B | Secondary text | 5.5:1 on paper |
| `color.paper` | #FBF8F3 | Light background, icon mark | |
| `color.paperRaised` | #FFFFFF | Cards on light (never behind a logo in email) | |
| `color.accent` | #8A5A3B | Links, buttons, the accent symbol | 5.5:1 on paper; white on it 5.8:1 |
| `color.accentDeep` | #7F4F30 | Icon tile base, favicon on light, foil, single-colour fills | 6.47:1 on paper; white on it 6.85:1 |
| `color.accentSoft` | #F1E6DC | Washes, gift card ground | ink 12.1:1 |
| `color.line` | #E6DED3 | Hairlines only | decorative |
| `color.inkDark` | #F2ECE4 | Text and reversed logo on dark | 15.7:1 on paperDark |
| `color.inkMutedDark` | #B3AA9E | Secondary text on dark | 8.0:1 |
| `color.paperDark` | #161412 | Dark background | |
| `color.accentDark` | #D9A47E | Accent on dark, dark icon mark | 8.4:1 on paperDark |
| `color.icon.*` | #9A613C to #7F4F30; #2C2926 to #1F1B18 | App icon tiles only, never UI | mark 4.78 to 6.47; dark 6.58 to 7.79 |

**Never:** accentDark on paper (2.07:1), accent on ink (2.55:1), pure black behind the mark, a gradient anywhere except the app icon tile.

The logo is one colour: ink on light, inkDark on dark. The accent symbol (`logo.symbol.accent`) is the one warm brand moment allowed on paper. Never split the lockup into two colours.

---

## 5. Type roles

| Id | Family | Use for | Never for |
|---|---|---|---|
| `font.wordmark` | EB Garamond 1.003 (vendored woff2, OFL) | The wordmark (outlined, never retyped) and brand display: book covers and title pages, gift cards, the OG image, splash titles | UI, letters, buttons, body copy |
| `font.reading` | Literata | Letters, the reading view, printed pages, headings on the site and in email, the sign-off | Buttons, settings, form labels |
| `font.ui` | Mukta | All interface text (Latin and Devanagari), email body and footer | Letters |
| `font.devanagari` | Tiro Devanagari Hindi | Devanagari runs inside letters and the book | UI (Mukta covers it) |

Quiet UI, loud letters (DESIGN_LANGUAGE.md). Size EB Garamond at 1.2 times what you would give Literata, because of its smaller x-height.

---

## 6. Icon rules

- Masters: `icon.app.default` (paper mark on the dithered sepia gradient), `icon.app.dark` (accentDark on warm near-black), `icon.app.tinted` (white mark on black; the system tints). All opaque RGB 1024, no alpha.
- The mark sits at 56 percent of the canvas height with its mass centre slightly below centre; do not rescale or recentre it.
- 40 px and below use the small-cut mark (wider notch, heavier tails). Hand-tuned PNGs exist for 16 to 512; use them only where a fixed raster is required.
- No text, outline, shadow, badge, seasonal variant or baked corners.
- iOS 26 Liquid Glass: final sign-off is in Icon Composer on a device. The bench (`source.icon.bench`) approximates it: `node packages/brand/assets/logo/primary/source/bench.mjs` (usage in its header).

---

## 7. Email

Full rules: [EMAIL_IDENTITY.md](EMAIL_IDENTITY.md). In short: the From name is the brand name; the header is the ink lockup at 154 x 32, left aligned, not a link; the dark logo is swapped in by dark CSS; both PNGs carry a 0.7 px halo so the light logo survives Gmail's forced dark (it reads as outline lettering there, by design); the alt text is the brand name styled as a serif wordmark; the footer has no logo. Images load only from `https://earlyletters.com/email/`. Code resolves logos via `assetFor('email.header.light' | 'email.header.dark')` (`packages/emails/src/components/header.tsx`).

---

## 8. Voice, in one breath

Warm, calm, literary lightly. A kind friend, not a brand. Time and love, never endings. We never rewrite your words, and we never imply a machine wrote anything. No streaks, points, badges, guilt or fear. Never gender the child: `{child}`. Full guide: [packages/content/VOICE.md](../../packages/content/VOICE.md); naming: [packages/content/BRAND.md](../../packages/content/BRAND.md).

---

## 9. Do and don't

| Do | Don't |
|---|---|
| `assetFor('web.header')` and inline the SVG with `currentColor` | Import `assets/logo/r3/final/final-a/lockup-horizontal.svg` |
| Small cut below 27 px; symbol alone below 17 px | Shrink the master lockup to 18 px in a footer |
| Ink lockup on paper, inkDark lockup on dark | Ink lockup on a photo, or an accent-coloured wordmark |
| Accent symbol alone as the one warm moment on a page | Two-colour lockup (accent mark plus ink name) |
| One logo per screen or page section | Logo in the nav bar and the hero and the footer of one screen |
| "We never rewrite your words." next to the mark | Sparkles, wands, "AI-powered", "magic" near the mark or in a tagline |
| The tagline exactly: "Exactly as you said it." | Rewording it per surface |
| Stacked lockup centred on the paywall, once | The app icon tile used as a logo inside the app |
| The mark as a closing flourish on a printed page | Closing quotation marks, a speech bubble, or the mark rotated |
| Emboss or foil the symbol alone on the book cover | Print the gradient tile on paper products |

---

## 10. Open items

- Icon Composer `.icon` for iOS 26 (needs a Mac); then register it and point `apps/mobile/app.config.ts` at it.
- Android adaptive icon layers (Android is v1.1).
- Splash wiring in `app.config.ts` (expo-splash-screen needs a PNG symbol; context `app.splash` is defined).
- Trademark clearance of the name and the mark before BIMI VMC (EMAIL_IDENTITY.md 6).
