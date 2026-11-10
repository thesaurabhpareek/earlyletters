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
| `social/link-preview-category-1200x630.png` | 1200x630 | Adds the descriptor line "Letters to your child, in your own words and voice." (D-139) and "Your words. Your voice. Every change marked." for first contact (BRAND.md naming rule). |
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

## App preview storyboard: "A minute is plenty" (rewritten for build 1)

24.2 s, 886x1920 portrait, 30 fps, silent. One preview for iPhone 6.9" (Apple scales it to the smaller iPhone sizes; the app is iPhone only, `supportsTablet: false` in `apps/mobile/app.config.ts`).

This replaces the earlier 22 s storyboard that was here. Every frame below is something build 1 does today, checked in `apps/mobile` on `develop` (d6e83f9e, 1 Nov 2026). The draft cut `preview-draft.mp4` follows this board exactly.

### What changed from the old board, and why

| Old frame | Problem in build 1 | Fix |
|---|---|---|
| 1. Lockup fades in on paper, 2.5 s | Spends the autoplay hook on a logo. Muted viewers in search results see 2.5 s of title art and nothing about what the app does. Guideline 2.3.3 / 2.3.4 want the app in use. | Open on the app at frame 0, with the job in one line: "Tell your child about today." The lockup moves to the end card. |
| 3. Listening with "transcript lines arriving" | Not true. Listening shows the prompt, a glow that follows the voice, a clock, Pause, Finish and Let it go. The words are written down after Finish, on Review ("Writing down what you said."). `listen.tsx` has no live transcript; the e2e note in `e2e-web/j05-voice-capture.flow.ts` says the same. MOTION.md 5c ("Speech becoming words") is a design, not build 1. | Listening shows only what it shows. A short beat of the real "Writing down what you said." screen follows Finish, so no dissolve implies instant words (Apple: transitions must not "imply functionality that your app doesn't include"). |
| 6. Read together "highlight moving word by word" | Not in build 1. `read-together.tsx` header: "v1.0 is plain playback ... no word highlight (D-059)". | Read together shows the real page: the letter, "From Mama", the Hear Mama player, and a page turn (Back one). No highlight anywhere. |
| "Every spoken word is on screen as the Read together highlight" (audio note) | Same as above. | The cut is silent; every word a viewer needs is in the type cards or the app's own text. |
| Frame 6 "Letter in night mode" | There is no app "night mode". Read together follows the phone's appearance (Dark Mode). | Called "phone in Dark Mode" here and never named on screen. |
| No subscription line | Apple's App Previews page: "If you display features that are only available through in-app purchase, or if your app uses a subscription model ... you must disclose this. Disclaimer copy can be included within the footage or in the end frame." Build 1 gates keeping a third letter behind Plus (`review.tsx`, Keep gate, D-082, D-083). | End card carries "Your first two letters are free. To keep adding letters, subscribe to Plus." No price (Apple: "Don't include specific prices"). |
| Captions up to 6 words, free text | Not aligned with the copy lane. | Headlines and support lines come from `copy/captions.json` where a screen matches; two lines are taken from approved listing copy (see the table). |

Also kept out on the coordinator's instruction (each checked in `apps/mobile`): the Family tab (hidden in the store build by D-126; build 1 on `develop` still shows it, see "Known gaps"), a second parent (no co-parent in build 1, D-121), live words while talking, the name "Maria", "night mode", and any demo letter that genders the child. The seeded letters that name Nani (letter 1) and Papa (letter 3) never appear: the listing rules in `packages/content/test/rules.test.ts` keep grandparents and family listening out of store surfaces.

### The board

Times are output seconds. "Card" is the caption band above the footage (Literata 500 headline, Mukta 400 support line; brand palette from `docs/store/art/README.md`). Footage is the app at its own UI resolution, scaled down to 700x1517 inside the frame, never zoomed in (Apple recommends native UI, not zooming). Cuts are dissolves of 280 ms (`tokens.motion.route.dissolveMs`); caption changes are 200 ms fades (`tokens.motion.fadeMs`). No zoom punches, shake or sparkle (MOTION.md).

| # | Time | App footage (true of build 1) | Card headline / support | Card colour | Source of the words |
|---|---|---|---|---|---|
| 1 | 0.00 to 2.55 | **Hook.** Tonight in the evening: "ASHA · 7 MONTHS", "Good evening, Mama.", the question "What food did Asha try this week? What was the face?", Speak and Type. Speak is tapped at 2.40. | Tell your child about today. / A minute is plenty. It becomes a letter. | Dusk `#3B302A` | captions.json 01-tonight |
| 2 | 2.55 to 7.05 | Listening: "To Asha", "Only you, until you add it to the book.", the prompt, the glow moving with the voice, the clock counting, Pause, Finish. Finish tapped at 7.0. | Pause, laugh, start again. / Take your time. Say it however it comes. | Night `#161412` | captions.json 08-listening |
| 3 | 7.05 to 8.40 | Review opens and says "Writing down what you said." with the moon and the recording's length. | Written down on your phone. / Your recording is kept unchanged. | Night | New line, true of build 1 (on-device speech model, ADR 0015; D-133 promise wording for the second line) |
| 4 | 8.40 to 12.55 | "Read it back": "TO ASHA · MONTH 7", "FROM MAMA", the letter with two marks (a struck "um," and a struck repeated "you"). The "um" mark is tapped at 10.0: "Took out a sound. An um or an uh, taken out. You said "um,"", Put it back. "Add to Asha's book" tapped at 12.4. | Every change is marked. / We only fix small slips. Tap one to put it back. | Paper `#FBF8F3` | captions.json 02-review |
| 5 | 12.55 to 16.80 | The saved moment: the letter files down, "Kept in Month 7", "Added to Asha's book." Then the Book: "Asha's book", Read together, THIS MONTH 7 with the new letter, Month 6 below. | A book that grows by month. / Each letter goes into your child's month of age. | Warm paper (paper with lamp glow `#F3C98B`) | captions.json 04-book |
| 6 | 16.80 to 21.20 | Read together, phone in Dark Mode: the bath letter ("This one was typed. Read it aloud together."), Back one at 18.4, the page turns to the rain letter (Month 5, "From Mama", Hear Mama 0:42). | Read together at bedtime. / The letters you spoke, in your own voice. | Night | captions.json 05-letter-night headline; support line is the approved screenshot subline in `packages/content/src/store.en.ts`. On the device the book has only spoken letters, so the take is the laugh letter, Next letter, the rain letter (CAPTURE_GUIDE take3) |
| 7 | 21.20 to 24.20 | End card (0.4 s dissolve in): approved horizontal lockup, "It stays in your words." (read from `packages/brand`), and the disclosure line. | Your first two letters are free. To keep adding letters, subscribe to Plus. | Night | Tagline: `packages/brand` (D-133). Disclosure: coordinator wording, 1 Nov ("optional" dropped as misleading: after two letters, adding one needs Plus, D-082) |

**Poster frame:** 11.0 s (Review with the "um" card open under "Every change is marked."), exported as `poster.png`. Apple's default poster is 5 s, which in this cut lands on Listening; set it by hand in App Store Connect (Edit Poster Frame). The poster is a frame of the video, as Apple requires.

**Sound off first 3 seconds:** frame 0 already shows the card line and a real question to a child by name, with Speak under it. Nothing fades in at the start, so the autoplay thumbnail and the first frame are the same strong frame.

### Words on screen, checked

All card text passes the house rules: no em or en dashes, curly quotes, ellipsis or emoji (checked in `cards.mjs` before rendering); no fear, guilt or loss words; nothing implies AI writes or rewrites ("We only fix small slips" is the copy lane's line and matches the constitution); the child is never gendered; no counts of gaps, streaks or badges; no "beta"; no price; no seasonal or dated reference (Apple's guidance). The app's own text visible in the footage includes real dates on cards ("SUNDAY, NOVEMBER 1, 2026" on the Book): see "Known gaps".

### Known gaps in the draft (fixed by the device capture)

1. **Family tab.** Build 1 on `develop` shows three tabs. The draft hides the Family tab with one style rule (`capture.mjs`), the only change made to the app's screens, because the store build hides it (D-126, code change after the 9 Nov go/no-go). The final capture must come from a build where D-126 has landed. If it has not landed, do not ship this preview with the tab hidden by any trick: capture whatever the submitted build shows, and settle the Family tab question first (D-126 fallback).
2. **"Exactly as said".** The Review toggle "With small fixes | Exactly as said" and the letter page's "Exactly as said" link are visible. They are true UI labels (that view shows the raw words), but D-125 item 9 and D-133 hold "exactly as you said it" out of the listing. Review lane or counsel to confirm the in-app label is fine in footage. See REPORT.md question 2.
3. **Dates on the Book cards** ("SUNDAY, NOVEMBER 1, 2026") will age the video slightly; Apple advises against dates. They are the app's own UI and are small; acceptable, but the capture guide sets the letters up so the newest card is not the focus.
4. The draft's Listening glow is driven by Chromium's fake microphone tone, so it pulses evenly. On a phone it follows a real voice.
5. The draft's "Writing down what you said." never finishes on the web (no speech model there), so the draft dissolves from it to a seeded Review. On the phone the same take gets its words; the final cut is one continuous take.

**Capturing the final cut:** follow [`docs/store/preview/CAPTURE_GUIDE.md`](../preview/CAPTURE_GUIDE.md). Apple requires preview footage captured from the app on a device (guideline 2.3.4), so the web draft only sets the cut and timing. The draft video, its cards and compose scripts (`preview-draft.mp4`, `cards.mjs`, `capture.mjs`, the `work/` folder) and the video lane's REPORT.md stay with the store 1.0 working folder and are not in this repo.

Note: the support line on board row 6, "The letters you spoke, in your own voice.", was the screenshot subline in `store.en.ts` when the board was written. Store listing 1.0 changes that subline to "One letter at a time, oldest first." (Read together goes through the whole book). The video lane should confirm which line the card keeps.
