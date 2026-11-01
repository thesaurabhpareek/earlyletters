# App size: budget, measurement and cuts

Owner: platform. Updated 3 Oct 2026. Founder decision 15: the App Store **download** stays **under 40 MB**, measured on every release build. Speech models and non-English language packs are never in the app (ADR 0016).

## 1. The budget

| What | Budget | Why |
|---|---|---|
| Download size, largest thinned variant (App Store Connect) | **under 40 MB** | decision 15 |
| Hermes bytecode bundle (`main.jsbundle`) | 12 MB | keeps the JS side honest between native measurements |
| JS assets (images, sounds, fonts loaded through Metro) | 3 MB | same |

The older 80 MB gate in TDD 01 5.3 and PRD 7.7 is superseded by decision 15.

## 2. How it is measured

Apple: the `.app`, the `.xcarchive` and the uploaded IPA are not size measurements; the App Thinning Size Report gives close estimates of download (compressed) and install (uncompressed) size per variant, and App Store Connect gives the authoritative figure for TestFlight and App Store builds (V: "Reducing your app's size", Apple Developer Documentation, opened 3 Oct 2026).

```bash
npx tsx scripts/size/measure.ts                                   # any machine: JS, assets, dependency report
npx tsx scripts/size/measure.ts --ipa path/to/app.ipa             # plus the EAS build's IPA (approximate)
npx tsx scripts/size/measure.ts --thinning-report "App Thinning Size Report.txt"   # close to the App Store number
```

The script runs `expo export --platform ios` with Hermes bytecode (what ships) and without (plain JS with a source map), attributes every byte of the bundle to an npm package or app folder, lists app dependencies that put nothing in the JS bundle, lists fonts and images over 100 KB, reads an IPA's central directory (main executable, frameworks, JS bundle, asset catalog) and parses the thinning report. It writes `dist/size/report.md` and `report.json` and exits 1 when over budget. To make the thinning report on a Mac: export the archive with `xcodebuild -exportArchive` and an export options plist whose `thinning` key is `<thin-for-all-variants>` (Apple, same page).

Release checklist line: run the script with `--thinning-report` (or read App Store Connect's size table for the TestFlight build) and paste the verdict into the release notes. A JS-only run belongs in CI on every pull request.

## 3. Today (develop at the 3 Oct wave snapshot, JS only)

| Item | Size |
|---|---|
| Hermes bytecode bundle | **11.6 MB** (just under its 12 MB sub-budget) |
| Bytecode gzip -9 (rough download contribution) | 3.5 MB |
| Minified JS (attribution base) | 10.4 MB |
| JS assets | 1.4 MB in 30 files |
| Native binary, frameworks, asset catalog | **not measured yet**: needs the first EAS build (founder action) |

Largest owners of the minified JS:

| Package | Share |
|---|---|
| `phosphor-react-native` | **5.6 MB, 54%** |
| `react-native-reanimated` | 0.76 MB, 7% |
| `react-native` | 0.57 MB, 6% |
| `expo-router` | 0.46 MB, 4% |
| Metro runtime and module wrappers (unmapped) | 0.45 MB, 4% |
| app `src/lib` | 0.22 MB |
| `@gorhom/bottom-sheet` | 0.16 MB |
| `@supabase/auth-js` | 0.12 MB |
| `culori` | 0.11 MB |
| `valibot` (contracts, ADR 0016) | 0.10 MB, 1% |

Metro does not tree-shake by default, so a package's whole entry file ships even when one export is used.

## 4. Cuts, largest first

| # | Cut | Saves (measured or E) | Owner |
|---|---|---|---|
| 1 | **Import Phosphor icons one by one.** 27 files import 29 icons from `phosphor-react-native`, whose index pulls in all 3,024 icons. The package exports per-icon paths (`phosphor-react-native/src/icons/<Name>`, V-code: its `exports` map). One wrapper file `src/components/ui/icons.ts` re-exporting the 29 icons from those paths, and a lint rule banning the root import | about 5.5 MB of minified JS (measured share), roughly half the bytecode bundle | design agent |
| 2 | **Remove unused native modules.** The script finds these app dependencies with nothing in the JS bundle: `expo-iap` (no JS import found; payments appear to use the local `scribe-store` module), `expo-image`, `expo-system-ui`, `expo-dev-client` (development builds only; check it is excluded from release, U), plus JS-only `@rn-primitives/portal`, `react-dom`, `react-native-web`, `tailwindcss`, `posthog-react-native` (not wired yet; keep if analytics wiring lands). Native ones are still compiled and linked by autolinking | native size per module U until the first IPA; each also drops a privacy-manifest entry | coordinator, per owner |
| 3 | **Subset fonts.** Bundled: Mukta Regular, Medium, SemiBold (about 0.3 MB each, Latin plus Devanagari), Literata Regular, Medium, Italic (about 0.1 MB each), Tiro Devanagari Hindi (0.2 MB). The interface is English in v1.0: subset Literata and Mukta to Latin-1 plus the punctuation in `packages/content` (`pyftsubset`, fontTools, MIT). Letter text in Hindi, Arabic and Chinese uses the system fonts (iOS ships Devanagari, Arabic and CJK fonts); never bundle a CJK font (tens of MB). Keep one Devanagari face only if design needs it for letters | about 0.6 to 0.9 MB uncompressed (E) | design agent |
| 4 | **Images.** `assets/images/icon.png` 0.8 MB (the 1024 px source; the app icon goes into the asset catalog), `logo-glow.png` 0.3 MB, and ten photos of 0.1 to 0.4 MB. Ship only the photos a screen uses, at the largest size shown at 3x, as WebP or AVIF (`expo-image` and iOS 16 decode both); delete `react-logo*` and `tutorial-web.png` scaffold files | most of the 1.4 MB of JS assets (E) | design agent |
| 5 | **Sounds as AAC, not WAV.** Seven WAV files, 10 to 62 KB each | about 0.15 MB (E) | design agent |
| 6 | **Only if still needed:** Expo's experimental tree shaking (`EXPO_UNSTABLE_TREE_SHAKING`), whose status in SDK 57 is U; or replacing `valibot` with hand-written validators (0.1 MB) | small | platform |

Not cuts: speech models and language packs are already outside the app (ADR 0016); English text rules stay in the app (decision 15).

## 5. What would break the budget

A bundled model or dictionary, a CJK font, an analytics or crash SDK with its own native frameworks (measure before adding), any new native module (each adds code to the binary and often a privacy-manifest entry). Every pull request that adds a dependency runs the JS-only measurement; every release runs the thinning report.
