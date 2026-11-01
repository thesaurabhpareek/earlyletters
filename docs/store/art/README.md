# Early Letters store art

Built by `node docs/store/art/build.mjs` (repo root; playwright-core + chromium for compositions, `icons.py` for icon sizes). Nothing here redraws or restyles the mark. Palette: night `#161412`, paper `#FBF8F3`, dusk `#3B302A`, ink `#2B2722`, lamp glow `#F3C98B` (atmosphere only). Type: Literata (tagline), Mukta (support). The name and wordmark are the approved lockup paths from `apps/web/src/components/brand/lockup.generated.ts` (registry `logo.lockup.horizontal.ink` 1.0.0), never retyped.

## Approved icon, and what is missing

The approved icon is the paper-coloured two-drop opening-quote mark on the brown vertical gradient, `apps/web/public/favicon/icon-512.png` (sha256 `77e8914d...fc17`, matches `apps/web/src/lib/brand/web-assets.json`). Vector mark: `favicon/favicon.svg`.

The registry masters (`packages/brand/registry.json`, `packages/brand/assets/`) are NOT in this checkout or on any local branch, so the 512 px web copy is the largest approved raster available. Every icon below is a Lanczos downscale of it, with a hash check that aborts if the source differs from the lock. Nothing was upscaled.

## Files

| File | Size | Purpose |
|---|---|---|
| `icon/play-icon-512.png` | 512x512 | Google Play hi-res icon (opaque, square; Play applies its mask). Unmodified approved 512. |
| `icon/ios-{180,167,152,120,87,80,76,60,58,40,29}.png` | as named | iOS and iPad icon sizes (opaque, no alpha, square). |
| `icon/android-{192,144,96,72,48}.png` | as named | Legacy launcher densities (xxxhdpi to mdpi). |
| `play/feature-graphic-1024x500.png` | 1024x500 | Play feature graphic, paper. Lockup + the brand tagline "It stays in your words." (read from `packages/brand` at build time). No price, ranking or promo text (Play rule). |
| `play/feature-graphic-1024x500-night.png` | 1024x500 | Same, night, for A/B or dark listing. |
| `social/link-preview-paper-1200x630.png` | 1200x630 | Open Graph / Twitter large card, default. Content sits inside the centre 1000x500. |
| `social/link-preview-night-1200x630.png` | 1200x630 | Night variant (campaign links). |
| `social/link-preview-category-1200x630.png` | 1200x630 | Adds the category line "The baby memory book you fill by talking." and "Your words. Your voice. Every change marked." for first contact (BRAND.md naming rule). |
| `promo/promo-square-1080x1080-paper.png` | 1080x1080 | App Store / social promotional art, "Said once. Heard for years." |
| `promo/promo-story-1080x1920-night.png` | 1080x1920 | 9:16 story / Apple promotional art, "It stays in your words." |

Copy uses only BRAND.md lines and the content rules (no em dashes, curly quotes, claims, price, or counts). App Store screenshots already exist in `docs/store/screenshots/` and were not touched.

## Blocked or missing (not done, on purpose)

1. **iOS 1024x1024 App Store icon (required).** Cannot come from the 512 source without upscaling. Needs the registry master (1024 or the master SVG with its gradient spec). Also blocks any 2x/3x sizes above 512.
2. **Android adaptive icon** (432x432 foreground, background layer, monochrome/themed layer, 108dp safe zone). Needs the approved layer decomposition from the registry; the repo's `apps/mobile/assets/images/android-icon-*.png` are not confirmed as the approved mark and were not used. I did not compose a foreground myself, as that would be a new placement of the mark.
3. **Dark and tinted iOS 18 icon variants.** Not in the approved set; need a brand decision plus master.
4. **Ink-on-paper app icon check at 29/40 px** was not visually reviewed on device; please eyeball the smallest sizes.
5. **Wordmark was not typeset anywhere**; the stacked lockup (symbol over name) in the live `og-image.png` is not in the approved set seen here (only horizontal), so previews use the horizontal lockup. Confirm with the registry whether a stacked lockup is approved.
6. **Video footage** (below) needs a native capture and a decision on the voice.

## Preview video: "A minute is plenty" (22 s)

Same cut serves App Store (15 to 30 s) and Play promo (YouTube, public or unlisted, ads off). Built only from real app UI, type, paper and light: no people, hands, children, stock, or AI imagery.

**Hard prerequisite.** Apple requires preview footage captured from the app itself. The screens in `docs/store/screenshots/` are web re-renders (`apps/web/src/components/app-ui`), fine for screenshots but not for the Apple preview. Capture from a TestFlight build on a real device or the simulator (iPhone 6.9", 886x1920 portrait, up to 30 fps, H.264/HEVC .mov or .mp4) and Android (1080x1920 or 1920x1080 for YouTube). Use the fictional family "Asha" and the sample letter already in the UI. No real family data.

**Audio.** Silent-first, since both stores autoplay muted. Every spoken word is on screen as the Read together highlight or a type card. Optional: an original, unprocessed real recording from a consenting parent (high-pass only), no music, no sting. Do not synthesise or imitate a voice. If no consenting real recording exists, ship silent with on-screen type only. Decision needed from the founder.

**Look.** Paper to dusk to night is one slow light change: paper `#FBF8F3` frames, dusk `#3B302A`, night `#161412`, lamp glow `#F3C98B` rising only on the night frames. Type cards in Literata 500, sentence case, at most 6 words, straight punctuation only. Motion per `docs/design/MOTION.md`: springs, 200 ms cross-fades, no zoom punches, no shake, no sparkle. Reduce-motion-safe by default (cuts are cross-fades).

| # | Time | Frame | Source | Caption / on-screen type | Light |
|---|---|---|---|---|---|
| 1 | 0.0 to 2.5 | Paper card, approved symbol fades in over lockup | Brand lockup SVG | "Early Letters" | Paper |
| 2 | 2.5 to 6.0 | Tonight screen, prompt card, thumb never shown; the Speak button pulses once (UI press state only) | Native capture, Tonight | Type card: "A minute is plenty." | Paper to dusk |
| 3 | 6.0 to 11.0 | Listening: breathing glow, transcript lines arriving ("Mama pretended not to notice...") | Native capture, Listening | Type card: "Just talk." The words arriving are the caption | Night |
| 4 | 11.0 to 14.5 | Review: the one small fix underlined, then Save. Show that every change is marked | Native capture, Review | Type card: "Every change is marked." | Paper |
| 5 | 14.5 to 17.5 | Book: the letter settles into its month chapter; chapters scroll back | Native capture, Book | Type card: "A book that grows by month." | Paper warm |
| 6 | 17.5 to 20.5 | Letter in night mode, Read together, highlight moving word by word | Native capture, Letter night | The highlight is the caption | Night + lamp |
| 7 | 20.5 to 22.0 | Night card, lockup, tagline | Brand lockup SVG | "Said once. Heard for years." then lockup | Night |

### Shot list

| Shot | Capture | Notes |
|---|---|---|
| S1 | Lockup on paper, 1 s hold + 1.5 s fade | Render from approved SVG, ink on paper. No redraw. |
| S2 | Tonight screen, 3.5 s, light mode | Device in light mode; status bar 9:41, full battery. |
| S3 | Listening, 5 s, dark mode | Record real in-app flow with the Asha script; capture the live transcript, not a scripted overlay. |
| S4 | Review, 3.5 s | Needs a letter with one allowed edit (EditType) so "every change is marked" and "nothing added" are visible truthfully. |
| S5 | Book/chapter, 3 s | Months with several signed letters; no counts of gaps, no streaks. |
| S6 | Letter night, 3 s, Read together | Highlight must be real playback of the Asha sample. |
| S7 | Closing card, 1.5 s | Render from approved lockup, night. |
| T1 to T4 | Type cards (Literata 500, paper/dusk/night) | Can reuse the `build.mjs` page template; export as 886x1920 stills, animate in editor. |

**Play variant.** Same sequence, 16:9 (1920x1080) or 9:16 on YouTube; the feature graphic must also work as the video thumbnail: `play/feature-graphic-1024x500.png`. Keep key content inside the centre 80%.

**Rules of the cut.** No people, hands or faces. No child name beyond the fictional Asha already in the UI. No rewrite or "AI" language anywhere (content rules). No price, ratings or award claims. No pressure or streak language. Final check: run captions through `packages/content` rules before export.
