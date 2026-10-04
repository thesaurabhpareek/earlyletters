# Bundled fonts (not yet supplied)

The founder must add these TTF/OTF files (expo-font cannot load woff or woff2 on iOS), each family with its SIL OFL 1.1 text
beside it (`OFL-<Family>.txt`), then follow the steps in `src/lib/fonts.ts`:

| Token family | File to add | Source |
|---|---|---|
| `Literata` | `Literata-Regular.ttf` (static instance) | Google Fonts, TypeTogether |
| `Literata-Italic` | `Literata-Italic.ttf` | Google Fonts, TypeTogether |
| `Mukta` | `Mukta-Regular.ttf` | Google Fonts, Ek Type |
| `Mukta-Medium` | `Mukta-Medium.ttf` | Google Fonts, Ek Type |
| `Mukta-SemiBold` | `Mukta-SemiBold.ttf` | Google Fonts, Ek Type |
| `TiroDevanagariHindi` (optional, Hindi runs) | `TiroDevanagariHindi-Regular.ttf` | Google Fonts, Tiro Typeworks |

Why nothing is bundled yet: the repo only holds woff/woff2 web subsets (apps/web), which iOS cannot load, and no
Literata file with a licence beside it. Nothing was downloaded.
