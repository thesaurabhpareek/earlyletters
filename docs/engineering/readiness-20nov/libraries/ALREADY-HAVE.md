# Already have: what the platform and our dependencies give for free

RD-F, mobile, 20 Nov 2026. Read this before you write a helper, a native call or a new component. If your need is in the left column, use the right column; if you think it is wrong, open a PR under `ADOPTION-RULES.md`, do not rebuild it quietly. Decisions with evidence: `LIBRARY-DECISIONS.md`. Tags: [V] checked (file:line or command), [E] estimate, [U] not checked.

Base: `origin/develop` at `16e61549`. `apps/mobile/package.json` has 62 dependencies and 5 devDependencies [V by script]. Expo SDK 57 (`expo ~57.0.26`), React Native 0.86.3, React 19.2.3, TypeScript ~6.0.3, vitest ^3.2.7. New Architecture. iOS 17 is the lowest iOS.

## 1. The 62 mobile dependencies, by job [V: `apps/mobile/package.json`]

| Job | Packages (version as written) |
|---|---|
| Framework | `expo ~57.0.26`, `react 19.2.3`, `react-dom 19.2.3`, `react-native 0.86.3`, `react-native-web ~0.21.0` (web preview only), `expo-router ~57.0.24`, `expo-linking`, `expo-constants`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-build-properties`, `expo-dev-client` (dev builds), `react-native-screens ~4.26.0`, `react-native-safe-area-context ~5.7.0`, `react-native-url-polyfill` |
| Motion and gesture | `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`, `react-native-gesture-handler ~2.32.0`, `@gorhom/bottom-sheet ^5.2.14`, `expo-haptics`, `expo-blur`, `expo-glass-effect` |
| Look | `uniwind ^1.12.1`, `tailwindcss ^4.3.3`, `tailwind-merge`, `clsx`, `class-variance-authority`, `@rn-primitives/portal`, `/separator`, `/slot`, `@expo/ui ~57.0.21` (SwiftUI controls), `phosphor-react-native ^3.0.6` (import one icon at a time from `.../src/icons/<Name>`), `react-native-svg 15.15.4`, `expo-font` |
| Storage and security | `expo-sqlite ~57.0.3`, `expo-file-system ~57.0.7`, `expo-secure-store ~57.0.4`, `expo-local-authentication ~57.0.3`, `expo-crypto ~57.0.3`, `buffer`, `fflate ^0.8.3` |
| Audio and speech | `expo-audio ~57.0.5`, `whisper.rn ~0.7.4`, `expo-keep-awake`, in-house `scribe-audio` |
| Account | `@supabase/supabase-js ^2.117.2`, `expo-apple-authentication`, `@react-native-google-signin/google-signin ^16.1.5`, `react-native-passkey ^3.6.2`, `expo-web-browser` |
| System | `expo-notifications ~57.0.21`, `expo-network`, `expo-device`, `expo-clipboard`, `expo-sharing`, `expo-print`, `@react-native-community/datetimepicker 9.1.0` |
| Ours | `@scribe/api`, `brand`, `content`, `core`, `design-tokens` |
| Not present [V] | `expo-image`, `expo-image-picker` (ruled out, CR-65), `expo-video`, `expo-media-library`, `expo-camera`, `expo-calendar`, `expo-localization`, any date library, `zod`, any state or form library, any analytics or crash SDK, FlashList |

devDependencies: `@playwright/test`, `@types/react`, `ajv`, `typescript`, `vitest`. Root: `@electric-sql/pglite`, `@vitest/coverage-v8`. Packages: `valibot` and `@noble/ed25519`, `@noble/hashes` in `packages/api`; React Email in `packages/emails`; `sharp`, `opentype.js`, fonts in `packages/brand` (build only) [V].

## 2. Our own native modules [V: `apps/mobile/modules/`]

`scribe-audio` (recording), `scribe-files` (file work), `scribe-keys` (keys), `scribe-photo` (system picker and upright re-encode), `scribe-store` (purchases). Each is `requireOptionalNativeModule` so Expo Go and web degrade (`modules/scribe-photo/index.ts`). New native work for pictures and video goes into `scribe-photo` (or a sibling module), not into a package.

## 3. Our own code you must reuse [V: directories listed under `apps/mobile/src/lib` and `packages/core/src`]

| Need | Use | Where |
|---|---|---|
| Faithful edits, verifier, age math, safety tiers, prompts, text rules | `@scribe/core` | `packages/core/src` (`verify.ts`, `age.ts`, `text.ts` with `splitsCluster`, `lang/`, `safety.ts`, `prompts.ts`) |
| Dates shown to a person | `lib/dates.ts` (never `toLocaleDateString` in a screen) | `apps/mobile/src/lib/dates.ts` |
| Wall-clock in a time zone, DST safe | `lib/reminders/tz.ts` | same folder as `planner.ts`, `scheduler.ts` |
| Reminder planning, 60 of 64 pending limit | `lib/reminders/planner.ts` | `planner.ts:95` |
| Find (FTS5 plus scan fallback) | `lib/find/*` | `query.ts`, `lifecycle.ts`, `scan-index.ts`, `snippet.ts`, `rebuild.ts` |
| Haptics (five named intents) | `lib/haptics.ts` | `haptic(intent)` |
| Reduced motion, easing, durations | `lib/motion.ts` | `useReducedMotion`, `FADE_MS`, `STANDARD_EASING` |
| Font scale, AX sizes, screen reader, contrast | `lib/a11y.ts` | `useFontScale`, `useIsAccessibilitySize`, `announce`, `useFocusOnMount`, `useScreenReader`, `useContrastPreference` |
| Photos (pick, bake, files) | `lib/photos/*` and `modules/scribe-photo` | `baker.ts`, `files.ts` |
| Capture, recorder, sweep, low space | `lib/capture/*` | `recorder.ts`, `free-space.ts`, `sweep.ts`, `erase.ts` |
| Speech models and downloads | `lib/models/*` | `catalog.ts`, `speech-download.logic.ts` |
| Export and backup | `lib/export/*`, `lib/backup/*` | `pack.ts`, `schema.ts` |
| Sync, family, auth, billing | `lib/sync`, `lib/family`, `lib/auth`, `lib/billing` | owned by other agents |
| Privacy manifest | `lib/privacy-manifest.ts` | read its header before any native dependency change |
| Licence notices | `scripts/licences/` and `src/generated/licences.json` | `components.mjs` lists every shipped package |
| Build size | `scripts/size/measure.ts` | `npx tsx scripts/size/measure.ts` |
| Label guard | `scripts/release/label-effect.mjs` | see `docs/ops/LABEL_GUARD.md` |
| UI parts | `src/components/ui/*` (design-systems owns), `src/components/motion/*` | button, card, sheet, toast, text-field, list-row, state-screen, page-turn, card-transition |

## 4. What the platform already gives (iOS 17 and later) [E unless marked: Apple documentation, not re-read this session]

| Need | Platform feature | Notes for us |
|---|---|---|
| Pick pictures and videos, no permission | `PHPickerViewController` | Out of process; no usage string; already used in `ScribePhotoModule.swift:139` [V]. `selectionLimit` is one number for all types |
| Read dates of the library (NS-51) | PhotoKit `PHAsset.creationDate`, `PHPhotoLibrary.authorizationStatus(for: .readWrite)` | Needs a usage string; limited library exists since iOS 14 (card 27 S2) |
| Thumbnails at target size | ImageIO `CGImageSourceCreateThumbnailAtIndex` | Decodes at size, not full |
| Re-encode, strip metadata, upright | ImageIO / `CGImageDestination` | Already in `reencodeUpright` [V] |
| Video duration, poster, re-encode | AVFoundation `AVURLAsset`, `AVAssetImageGenerator`, `AVAssetExportSession` | Metadata stripping API unverified (NS-52-R5) |
| Share sheet, files | `UIActivityViewController` via `expo-sharing` | Installed |
| Print and PDF | `UIPrintInteractionController`, WebKit via `expo-print` | Installed |
| Biometrics and passcode | LocalAuthentication via `expo-local-authentication` | Installed |
| Keychain | via `expo-secure-store`, `scribe-keys` | Installed |
| Local notifications | UserNotifications, 64 pending limit | `planner.ts:95` |
| Haptics | Core Haptics via `expo-haptics` | Installed |
| Dates, plurals, numbers | `Intl` on Hermes (DateTimeFormat with `timeZone` used in `tz.ts` [V]; PluralRules [U]) | `Intl.Segmenter` is missing on Hermes (eval B `B-mobile-client.md:20`, `text.ts:75` [V]) |
| Full text | SQLite FTS5 inside `expo-sqlite` | `unicode61 remove_diacritics 2` in use (`lifecycle.ts:180` [V]) |
| Dynamic Type, VoiceOver, Reduce Motion, Bold Text, Increase Contrast | `AccessibilityInfo` and `PixelRatio.getFontScale` | wrappers in `lib/a11y.ts` |
| Right to left | `I18nManager`, logical style props (`start`, `end`) | Not used anywhere yet [V: 0 files] |
| Data protection of files | `NSFileProtection` classes | Settings in `scribe-files` [U] |
| Backup exclusion | `isExcludedFromBackup` on a URL | Used for photo copies (11-foundations.md:242 [V]) |
| Speech on device | whisper.rn with downloaded model | `SFSpeechRecognizer` can use Apple servers: do not use (LD-25) |

## 5. Test and tooling you already have [V]

- Unit: vitest in each workspace; `npm test` at the repo root; 279 files in `apps/mobile/test`. `cd apps/mobile && npx tsc --noEmit` before every push.
- Database: PGlite (`npm run test:db`, 32 files per CLAUDE.md). Edge Functions: `npm run test:functions`.
- Phone journeys: Maestro, 20 files under `apps/mobile/e2e/flows`. Web journeys: Playwright (`e2e-web`).
- Guards: label guard, licence verify (`apps/mobile/test/licences.test.ts`), size script, content rules (`packages/content/test/rules.test.ts`), no-real-family-data test.
- CI install: `npm ci --no-audit --no-fund` (`.github/workflows/ci.yml:47`). Lockfile discipline: `docs/engineering/06-security-engineering.md:43` (SEC-R06).

## 6. Do not rebuild (checklist)

1. Animation, gesture, sheet, toast: Reanimated, Gesture Handler, gorhom, `components/ui`.
2. A picker, a thumbnailer, a metadata stripper: `scribe-photo`.
3. A search index: `lib/find`.
4. A tz helper or a date formatter: `tz.ts`, `dates.ts`, `Intl`.
5. A scheduler for local notifications: `planner.ts` and `scheduler.ts`.
6. A schema validator: valibot.
7. A haptics call: `haptic(intent)`.
8. A grapheme splitter: `packages/core/src/graphemes.ts` once BL-957 lands; until then `splitsCluster`.
9. A date library, state library, form library, i18n library: not needed today (LD-15, LD-18, LD-24).
10. A model or language-pack downloader: `lib/models`.

## 7. Cites sampled for this file

Checked and held: package.json count 62 and every named package; `modules/` listing; `scribe-photo/index.ts` header; `ScribePhotoModule.swift:139`; `planner.ts:95`; `lifecycle.ts:180`; `text.ts:75`; `lib/haptics.ts:6-16`; `ci.yml:47`; `06-security-engineering.md:43`; `e2e/flows` count 20; `licences.test.ts` exists; `scripts/size/measure.ts` exists; `label-effect.mjs` exists; `I18nManager` search 0 files. Not re-read: Apple documentation rows marked [E].
