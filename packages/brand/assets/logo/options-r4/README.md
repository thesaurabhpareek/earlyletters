# Logo options R4 (27 Oct 2026)

Recommendation: ship A, keep B as the alternate (docs/brand/logo-r4/RECOMMENDATION.md).

Status: candidates. Nothing here is registered in `packages/brand/registry.ts` and nothing replaces `assets/logo/primary` (D-071). Adopting an option means a new decision and a registry change.

## What these are
Rounds 1 to 3 already tried and rejected the letter "e", an envelope, a moon, rings, a book and a split heart (`docs/brand/logo-r3/BRIEF.md`). So R4 does not start another concept. It offers four treatments of the approved mark, checked against the live site (paper `#FBF8F3`, night `#161412`, EB Garamond wordmark, sepia accent).

| Option | Idea | Changes from the approved mark |
|---|---|---|
| A | Approved mark (D-071) | Baseline, shown for comparison. Files stay in `assets/logo/primary` |
| B | Two tones | Parent blob in ink or paper, child blob in sepia accent. Dark icon tile |
| C | The name in quotation marks | Lockup only: the mark before the wordmark and turned half a turn after it. App icon stays as A |
| D | Paper tile, one colour | Single deep sepia mark on a paper tile |

Open the review page: `presentation.html`.

## Copyright and trademark: what is and is not established
- Shapes: all marks come from the custom drawing behind D-071 (`primary/geometry.json`, `primary/source`). No font glyph, stock icon or third-party artwork is traced or used as a mark.
- Wordmark: outlined EB Garamond, SIL Open Font License 1.1 (`assets/fonts/eb-garamond/OFL.txt`). The OFL permits embedding outlines in a logo.
- Distinctiveness: a quotation mark is a common symbol. A web search for quotation-mark logos returns many stock icons and brand logos. That is not a copyright problem for an original drawing, but it makes the mark weak as a trademark, and option C adds a second quote shape, which makes a look-alike conflict slightly more likely, not less.
- Not done: no trademark clearance search (BL-366 is still open) and no legal review. Nothing here is cleared.

## Sizes shipped (options B and D; C ships lockups only)
| Use | Files |
|---|---|
| App Store master | `app/app-icon-1024.png`, `app-icon-dark-1024.png`, `app-icon-tinted-1024.png` (opaque RGB, no alpha, no rounded corners) |
| iOS asset catalog | `app/png/icon-{40,58,60,80,87,120,152,167,180}.png` plus `-dark` twins. 40 px and smaller use the small cut |
| Small UI and Spotlight | `app/png/icon-{16,29,32,48}.png` plus `-dark` |
| Web favicon | `web/favicon.svg` (follows colour scheme), `favicon-{16,32,48}.png`, `apple-touch-icon.png` (180) |
| Web manifest | `web/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (mark inside the 80 percent safe zone) |
| Website header | `lockup-horizontal.svg` and `-reversed.svg`; PNG at 32, 48, 64, 96 px tall in `web/header-*` |
| Email header | `email/logo-light.png` and `logo-dark.png` (56 px tall, 2x) and `@1x` (28 px tall), transparent |
| Profile image | `../profile/earlyletters-profile-<option>-{1024,512,250}.png`: full-bleed square, mark inside the central 46 percent so a circle crop keeps it whole. 250 is Google's minimum |
| Vectors | `symbol.svg`, `symbol-reversed.svg`, `symbol-small.svg` |

## Touchpoint assets (`<option>/touchpoints/`, built by `source/touchpoints.mjs`)
Same recipes and proportions as `packages/brand/scripts/build-touchpoints.mjs`, so adopting an option means swapping files. Option C ships the lockup-based files only; its icon, notification glyph and Android layers are the approved mark's.

| Use | Files |
|---|---|
| Share previews (Open Graph, X, iMessage, Slack, Facebook) | `og/og-image-1200x630.png` |
| Square previews (WhatsApp, LinkedIn, Instagram) | `og/og-image-square-1200x1200.png` |
| Video end cards | `video/end-card-1920x1080.png`, `end-card-1080x1920.png` |
| Social post plate 4:5 | `social/post-template-1080x1350.png` |
| Profile covers | `social/x-header-1500x500.png`, `linkedin-banner-1584x396.png`, `facebook-cover-1640x624.png`, `youtube-banner-2560x1440.png` (lockup inside the safe area) |
| Avatars | `email/avatar-1024.png` (sender avatar, app icon), `social/avatar-circle-safe-1024.png` |
| Notification glyph | `notification/glyph.svg` and `glyph-{24,36,48,72,96}.png` (white on transparent) |
| Android adaptive launcher (v1.1) | `android-sizes/ic_launcher_foreground-432.png`, `ic_launcher_background-432.png`, `ic_launcher_monochrome-432.png`, `play-store-512.png` |

Not done: wiring any option into the app, website or registry (that waits for a choice), the hand-tuned sub-pixel offsets of the approved icon set, and the BIMI SVG (blocked on DMARC anyway). `touchpoints-sheet.html` is a contact sheet of these files.

## Rebuild
`node packages/brand/assets/logo/options-r4/source/build.mjs` (needs `sharp`, a devDependency of `@scribe/brand`).

## Profile images for the brand Google account and email
The registry says the social profile picture is the app icon (context `social.avatar`, asset `icon.app.default`), and the email sender avatar is the same icon (`email.avatar`). The files in `profile/` are circle-safe alternatives with the mark smaller inside the square, in case a platform crops tightly. Which one to upload is the founder's choice. For the Google account, upload at Google Account > Personal info > Profile picture while signed in as that account.
