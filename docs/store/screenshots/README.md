# Store screenshots

Six screens, ordered as a story, rendered from the real web app-ui components
(`apps/web/src/components/app-ui`: Tonight, Listening, Review, Book, Letter) inside the generic PhoneFrame.
Demo family is the fictional Asha. All RGB PNG, no alpha.

Rebuild from the repo root: `node docs/store/screenshots/build.mjs` (esbuild + playwright-core + chromium).
Captions live in `captions.json`; layout in `src/entry.tsx`.

| # | File name | Screen | Headline | Subline |
|---|---|---|---|---|
| 1 | 01-tonight.png | Tonight | A minute is plenty. | Open it, say one thing about today, put the phone down. |
| 2 | 02-listening.png | Listening | Just talk. | Pause, laugh, lose your thread. It is listening. |
| 3 | 03-review.png | Review | Exactly as you said it. | Small slips are marked for fixing. Nothing is added. |
| 4 | 04-book.png | Book | A book that grows by month. | Every letter is filed by your child's age. |
| 5 | 05-letter.png | Letter (paper) | Said once. Heard for years. | Read it, and hear the voice that said it. |
| 6 | 06-letter-night.png | Letter (night) | Bedtime, in your voice. | Night mode for late reading. |

| Folder | Size | Use |
|---|---|---|
| ios-6.9in/ | 1320x2868 | App Store iPhone 6.9 inch |
| ios-6.5in/ | 1284x2778 | App Store iPhone 6.5 inch |
| play-1080x1920/ | 1080x1920 (9:16) | Google Play phone |
| play-1440x2560/ | 1440x2560 (9:16) | Google Play phone, high res |

Each folder holds all six files above (24 PNGs).

## Not done, or to know
- iPad 13 inch skipped: `supportsTablet` is false in `apps/mobile/app.config.ts`, and iPad shots must show the app on iPad.
- Screens are the website's web renders of the app UI, not captures of the Expo app on a device or simulator. Real-device rendering is unverified.
- The Review screen is shown with fixes unresolved (dotted underlines). Resolved, the component leaves blank gaps where fillers were removed.
- The listening screen shows words arriving mid-take (a fixed point, not live).
- Play screenshots are prepared only; the site copy says no Android in v1.0.
- Fonts are Literata and Mukta from the repo's fontsource packages.
