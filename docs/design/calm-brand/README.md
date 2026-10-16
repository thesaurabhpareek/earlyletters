# Calm brand: before and after

Real-app screenshots (the Expo web export, iPhone 17 Pro viewport at 1x, the fictional family Asha) for the screens the lamp and the opening quotation pair touch: welcome, Tonight, Book (with letters) and the empty Book, in light and dark. `before/` was captured on `origin/develop` at cfdca3f, before this branch was synced with later `develop` commits; those commits changed the same screens in other ways, but the only visible difference between `before/` and `after/` is the lamp pool and the quotation pair replacing the envelope. `after/` is this branch. Lamp arrival (1.2 s) is allowed to finish before each capture.

These are a stand-in for a device, not a replacement (web renders the SVG gradient in Chromium, not on iOS). They are not the journey record. The journey harness is on `develop` (`apps/mobile/e2e-web`), and its record (`docs/release/journey`) still shows the old welcome and empty Book art in J01-03 (welcome), J04 (Tonight) and J09 (Book). Refresh those steps after this merges: `npm run e2e:web:journey -w @scribe/mobile`, then `node apps/mobile/e2e-web/support/build-index.mjs`.

Regenerate these screenshots: `expo export --platform web` with `EXPO_PUBLIC_WEB_PREVIEW=1` for each commit, then drive it with Playwright (age gate Yes, Begin the book, `?seed=asha`).
