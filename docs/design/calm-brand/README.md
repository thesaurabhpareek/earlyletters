# Calm brand: before and after

Real-app screenshots (the Expo web export, iPhone 17 Pro viewport at 1x, the fictional family Asha) for the screens the lamp and the opening quotation pair touch: welcome, Tonight, Book (with letters) and the empty Book, in light and dark. `before/` is `origin/develop` at cfdca3f, `after/` is this branch. Lamp arrival (1.2 s) is allowed to finish before each capture.

These are a stand-in for a device, not a replacement (web renders the SVG gradient in Chromium, not on iOS). They are not the journey record: the journey harness (`apps/mobile/e2e-web`, branch `qa/journey-flows`) is not on `develop` yet, so J01-03 (welcome), J04 (Tonight) and J09 (Book) screenshots there still need a refresh when it lands.

Regenerate: `expo export --platform web` with `EXPO_PUBLIC_WEB_PREVIEW=1` for each commit, then drive it with Playwright (age gate Yes, Begin the book, `?seed=asha`).
