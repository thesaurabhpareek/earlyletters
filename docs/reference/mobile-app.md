---
title: Mobile app
owner: reference-docs
covers: [apps/mobile/src/**, apps/mobile/app.config.ts, apps/mobile/eas.json, apps/mobile/modules/**, apps/mobile/package.json, apps/mobile/.env.development]
verified_at: f524ca1
verified_on: 2026-10-18
---

# Mobile app (`apps/mobile`)

The iOS app: Expo SDK 57, React Native 0.86, Expo Router with typed routes and the React Compiler on (`apps/mobile/app.config.ts`, `experiments`). Android is configured but ships later (D-059, comment in `app.config.ts`). Calm brand atmosphere (#99, then the experience pass P1, #192): Tonight and Book draw `Lamp` (`components/ui/lamp.tsx`), a decorative light pool whose scenes, tones and peaks are `tokens.atmosphere` in `packages/design-tokens`. `useUnlitRoom()` (for rooms where the lamp should fade out rather than cut) exists, but no screen calls it on `develop` yet. Contrast rules for the lamp: [D-110](../decisions/INDEX.md). The welcome step of onboarding shows `Lamp` and the `QuotePair` brand device (`components/ui/quote-pair.tsx`; registry context `app.brand-device` in `packages/brand/registry.ts`); the Book empty state uses the device instead of a line drawing (`components/ui/empty-state.tsx`). The whole system: [system.md](system.md).

## Screens

Expo Router reads `apps/mobile/src/app`. Groups in brackets do not appear in the URL. Generated from the folder:

<!-- facts:routes -->
| Route | Kind | File |
|---|---|---|
|  | layout | `apps/mobile/src/app/(auth)/_layout.tsx` |
| `/sign-in/code` | screen | `apps/mobile/src/app/(auth)/sign-in/code.tsx` |
| `/sign-in/consent` | screen | `apps/mobile/src/app/(auth)/sign-in/consent.tsx` |
| `/sign-in/email` | screen | `apps/mobile/src/app/(auth)/sign-in/email.tsx` |
| `/sign-in` | screen | `apps/mobile/src/app/(auth)/sign-in/index.tsx` |
| `/sign-in/verify` | screen | `apps/mobile/src/app/(auth)/sign-in/verify.tsx` |
|  | layout | `apps/mobile/src/app/(tabs)/_layout.tsx` |
| `/book` | screen | `apps/mobile/src/app/(tabs)/book.tsx` |
| `/family` | screen | `apps/mobile/src/app/(tabs)/family.tsx` |
| `/` | screen | `apps/mobile/src/app/(tabs)/index.tsx` |
|  | special | `apps/mobile/src/app/+native-intent.tsx` |
|  | special | `apps/mobile/src/app/+not-found.tsx` |
|  | layout | `apps/mobile/src/app/_layout.tsx` |
|  | layout | `apps/mobile/src/app/invite/_layout.tsx` |
| `/invite` | screen | `apps/mobile/src/app/invite/index.tsx` |
| `/invite/new` | screen | `apps/mobile/src/app/invite/new.tsx` |
| `/letter/[id]` | screen | `apps/mobile/src/app/letter/[id].tsx` |
| `/listen` | screen | `apps/mobile/src/app/listen.tsx` |
| `/onboarding` | screen | `apps/mobile/src/app/onboarding.tsx` |
| `/plus/confirmed` | screen | `apps/mobile/src/app/plus/confirmed.tsx` |
| `/read-together` | screen | `apps/mobile/src/app/read-together.tsx` |
| `/review` | screen | `apps/mobile/src/app/review.tsx` |
|  | layout | `apps/mobile/src/app/settings/_layout.tsx` |
| `/settings/account` | screen | `apps/mobile/src/app/settings/account.tsx` |
| `/settings/appearance` | screen | `apps/mobile/src/app/settings/appearance.tsx` |
| `/settings/children/[id]` | screen | `apps/mobile/src/app/settings/children/[id].tsx` |
| `/settings/children/new` | screen | `apps/mobile/src/app/settings/children/new.tsx` |
| `/settings/delete-account` | screen | `apps/mobile/src/app/settings/delete-account.tsx` |
| `/settings/export` | screen | `apps/mobile/src/app/settings/export.tsx` |
| `/settings` | screen | `apps/mobile/src/app/settings/index.tsx` |
| `/settings/language` | screen | `apps/mobile/src/app/settings/language.tsx` |
| `/settings/plus` | screen | `apps/mobile/src/app/settings/plus.tsx` |
| `/settings/privacy` | screen | `apps/mobile/src/app/settings/privacy.tsx` |
| `/settings/recently-deleted` | screen | `apps/mobile/src/app/settings/recently-deleted.tsx` |
| `/settings/recordings` | screen | `apps/mobile/src/app/settings/recordings.tsx` |
| `/settings/reminders` | screen | `apps/mobile/src/app/settings/reminders.tsx` |
| `/settings/storage` | screen | `apps/mobile/src/app/settings/storage.tsx` |
| `/write` | screen | `apps/mobile/src/app/write.tsx` |
<!-- /facts:routes -->

How they are presented. The root `Stack` in `src/app/_layout.tsx` types no presentation or duration itself: it spreads `useRouteTransitions()` (`lib/motion.ts`) into each screen's options, which reads one table, `ROUTES` in `lib/transitions.logic.ts` (tested in `apps/mobile/test/transitions.test.ts`). Each route has a move: `dissolve` (a cross-fade over `tokens.motion.route.dissolveMs`), `sheet` and `push` (the platform's own), `cardToPage`, or `none` (the tab root). Under Reduce Motion a dissolve shortens to `fadeMs` and native moves follow the system.

| Route | Presentation | What it is |
|---|---|---|
| `(tabs)`: `/`, `/book`, `/family` | Tabs | Tonight, Book, Family (`(tabs)/_layout.tsx`) |
| `/onboarding` | Card, no swipe back | First run: promise, child or children, birthday or due date, signature |
| `/write` | Modal | Typing a letter, autosaved to a draft |
| `/listen` | Full screen, no swipe, cross-dissolve | Recording; starts only from a tap (`lib/resilience/start-intent.ts`) |
| `/review` | Full screen, no swipe, cross-dissolve | Review fixes, choose "Exactly as said", Keep. Full screen (it was a page sheet) so Listen dissolves into Review with no change of shape |
| `/read-together` | Full screen, cross-dissolve | One letter at a time, oldest first, plain playback |
| `/letter/[id]` | Platform push, transparent header | The reading page. The card-to-page move (`components/motion/card-transition.tsx`) is built but the route keeps the push until the page mounts it (comment in `lib/transitions.logic.ts`) |
| `/plus/confirmed` | Modal | Purchase confirmation after a new Plus purchase |
| `(auth)`, `/invite` | Modal (sheet) | Server features. With `SERVER_FEATURES=off` (every profile on `develop`), nothing opens them and a stale link goes home (`(auth)/_layout.tsx`, `+native-intent.tsx`). D-100 turns server features on for v1.0; the profiles that do so are not on `develop` yet ([register](../decisions/INDEX.md)) |
| `/settings/*` | Platform push | Settings home and every row |

With server features off, Settings does not offer Account or Delete account (`settings/index.tsx`), and the Family tab shows the co-parent "coming soon" presentation (`components/family/coparent-soon.tsx`).

## Boot sequence

`src/app/_layout.tsx`, in order:

1. `SplashScreen.preventAutoHideAsync()` at import.
2. `RootLayout` calls `useLaunch(useStoreReady())` (`lib/resilience/use-launch.ts`): the database is opened and migrated once. A failure renders `LaunchRecovery` (Try again, Export what is readable) and nothing is deleted.
3. `Root` applies the appearance setting (Uniwind theme) and the navigation theme from `useTheme()`, hides the splash, and sets the native background colour.
4. The 18+ gate (`lib/age-gate.ts`): until it passes, only `AgeGateScreen` renders, so no route or deep link is reachable.
5. After the gate passes, on the first animation frame: `runLaunchSweep()` (`lib/capture/sweep.ts`), then `startServices()` once per process. Steps 1 to 10 each run inside `safely()`, so one failing never stops the others; step 0 is a plain call that only registers a function:

| Order | Call | Module | What it does |
|---|---|---|---|
| 0 | `setFreeLettersAllowanceSource` (not in `safely()`) | `lib/billing` | Registers the allowance source: free letters come from `effectiveFreeLetters(getRemoteConfig())` (`packages/api`); `gates.ts` catches a throw from it and falls back to the default |
| 1 | `startRemote` | `lib/remote` | Loads cached signed documents and refreshes them |
| 2 | `startPacks` | `lib/packs` | Installs pack updates when a newer manifest arrives |
| 3 | `startTranscriptionQueue` | `lib/transcription-queue` | Registers the speech plan as a pack language resolver and runs queued jobs |
| 4 | `startListeningCopies` | `lib/audio-enhance` | Registers the listening-copy lookup; sweeps stale copies |
| 5 | `startSync` | `lib/sync` | Returns at once with server features off |
| 6 | `startPlus` | `lib/billing` | StoreKit 2 listener and foreground re-read |
| 7 | `startLetterLedger` | `lib/billing` | Heals the free-letter count after a reinstall or restore |
| 8 | `startReminders` | `lib/reminders` | Local notification schedule |
| 9 | `cleanupExports` | `lib/export` | Removes export ZIPs left by a killed export |
| 10 | `startAnalytics`, `startAnalyticsObservers` | `lib/analytics` | Do nothing with analytics off |

Inside the gate, `SessionProvider` wraps the stack, then `PendingInviteWatcher`, `PlanNoticeHost` (plan reminders) and `AnalyticsConsentAsk` are mounted. A render error anywhere lands in `RootErrorBoundary` (`components/resilience/error-boundary.tsx`). Note: `apps/mobile/src/lib/README.md` lists the boot order without `startLetterLedger`; the code above is what runs.

## `src/lib` map

Screens call these; the API for the store is in `apps/mobile/src/lib/README.md`.

| Module | What it does |
|---|---|
| `store.ts` | The facade over the device database: one connection, defaults, change events. SQL lives in `db/repos/*` |
| `db/` | Migrator (`migrations.ts`), engine-neutral `SqlDb` (`sql.ts`), expo-sqlite adapter, repositories |
| `capture/` | Recorder (draft before mic), launch sweep, probe of killed takes, erase of deleted recordings, the recording container per platform (`recording-file.ts`) and ADTS frame counting (`adts.ts`, `adts-file.ts`). See [data-and-storage.md](data-and-storage.md) |
| `transcribe*.ts` | The `Transcriber` interface, whisper.rn adapter, chunk planner, the run's input checks (`transcribe-run.ts`), post-processing, prompt, loudness check, language codes, dev-only sample |
| `transcription-queue/` | One-at-a-time transcription jobs, retries, cleaning through `@scribe/core` |
| `models/` | Speech model catalog, tiers, speech packs, download consent, whisper runtime |
| `packs/` | Pack engine: resumable, verified, atomic installs into Application Support |
| `language/` | Spoken languages chosen on this phone, text-rules pack loading |
| `remote/` | Signed remote config, pack manifest and content bundle, with offline fallbacks |
| `billing/` | Plus: StoreKit plan state, Keep gate, letter ledger, plan reminders, Apple sheets |
| `export/` | Export ZIP builder, schema and verification |
| `player/`, `audio-enhance/` | Letter playback and the clearer listening copy |
| `reminders/` | Local notifications planner and scheduler |
| `resilience/` | Launch open and recovery, recovery export, keep awake, start intent, not-found |
| `age-gate.ts`, `age-gate.logic.ts` | The 18+ entry gate (a boolean, never an age) |
| `capabilities.ts` | The build-time server and analytics switches |
| `build-env.ts` | `APP_ENV` and `devShortcutsAllowed` |
| `read-it-back.ts`, `provenance.ts` | "Words are ready. Read it back." flag; how a letter's words came to be |
| `copy.ts`, `permission-copy.ts`, `dates.ts` | Strings from `@scribe/content`, OS purpose strings, the one date format |
| `a11y.ts`, `motion.ts`, `haptics.ts`, `audio-mode.ts` | Accessibility, Reduce Motion and entry and exit animations, haptics vocabulary, audio session |
| `transitions.logic.ts` | The screen-transition table and its rules (see Routes above) |
| `licences.ts` | Licence notices for every bundled library, read from `src/generated/licences.json`, which `npm run licences:generate -w @scribe/mobile` makes (`scripts/licences/generate.mjs`); a test fails when the file is stale. For the Licenses page, which is not on `develop` yet (experience pass P6) |
| `navigation.logic.ts`, `review-layout.logic.ts`, `shelf-days.ts`, `model-files.ts`, `utils.ts` | Back and close idioms, Review layout rules, the 30-day shelf, dev model folder, class name helper |
| `analytics/` | Opt-in analytics glue; inert while `ANALYTICS=off` |
| `auth/`, `supabase/`, `sync/`, `family/`, `account-deletion/` | Server features, off in every build profile on `develop`; D-100 ships them in v1.0 ([register](../decisions/INDEX.md)). Sign-in, the Supabase client, outbox and cursor sync, invites, account deletion. `lib/supabase/secure-storage.ts` is also used, with server features off, by the letter ledger |

Pure logic files end in `.logic.ts` and are tested in Node (`apps/mobile/test`, vitest). `npm run test:coverage -w @scribe/mobile` runs them with coverage (`vitest.coverage.config.ts`).

`src/dev/` holds code for test builds only: `e2e-seams.ts` loads the kill drill (`kill-drill.ts`, `kill-drill.logic.ts`) only in a build with `EXPO_PUBLIC_E2E=1` whose app environment is neither `preview` nor `production`, and the drill refuses to arm except on a simulator, in the development bundle. The host side is `apps/mobile/e2e/kill/`. On `develop` the root layout does not call `useE2eSeams()` yet (the file's own comment names the wiring as a request to S20).

## Shared components from the experience pass

Built in P1 (#192, #218); most are not used by a screen on `develop` yet, so later experience-pass packages wire them in.

| Component | Path | What it is | Used by a screen on `develop` |
|---|---|---|---|
| `Lamp`, `LampView`, `useUnlitRoom` | `components/ui/lamp.tsx`, `lamp.logic.ts` | The light pool behind a screen, by scene and time of day | `Lamp`: Tonight, Book, onboarding; `useUnlitRoom`: none |
| `BookCover` | `components/book/book-cover.tsx` | A paper book with the child's name; no images | None |
| `Toast` | `components/ui/toast.tsx`, `toast.logic.ts` | One quiet confirmation at a time, usually with Undo | The letter page, through `components/ui/provider.tsx` |
| `PageTurn` | `components/motion/page-turn.tsx` | A sideways page turn for Read together; a 200 ms cross-fade under Reduce Motion | None |
| `CardToPage` | `components/motion/card-transition.tsx` | A letter card grows into its page, its words staying in place | None |
| `ExcerptFade` | `components/motion/excerpt-fade.tsx` | A few lines of a person's words ending in a fade, never an ellipsis; the whole text stays readable to VoiceOver | None |
| `LineArt`, `DrawOn` | `components/ui/line-art.tsx`, `components/motion/draw-on.tsx` | Line drawings, drawn on | `LineArt`: onboarding, empty and state screens, content blocks, the co-parent card |

Specs: `docs/design/MOTION.md`, `docs/design/COMPONENTS.md` and `docs/design/EXPERIENCE_PASS_2026-10.md`.

## Device database

SQLite file `scribe.db` (`store.ts` `DB_FILE_NAME`), opened with `PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL` (`db/expo-adapter.ts`). Schema version lives in `PRAGMA user_version`; migrations 1 to 5 are in `db/migrations.ts`, each in its own transaction. Tables:

<!-- facts:device-tables -->
- `settings`
- `entries`
- `children`
- `drafts`
- `orphan_audio`
- `sync_outbox`
- `rejected_writes`
- `sync_books`
<!-- /facts:device-tables -->

| Table | Holds |
|---|---|
| `settings` | Key and value pairs: active child, appearance, reading size, reminders, age gate, ledger mirror, plan cache, pack and speech choices |
| `entries` | Letters: raw transcript, machine edits, final text, engine version, audio path, hash and size, kind, capture mode, edit level, in book, tombstone, transcript status, sync columns (unused while server features are off) |
| `children` | Books: name, birthday or due date, signature, reminders, hidden, server columns (unused while server features are off) |
| `drafts` | Takes and typed drafts before Keep: state `recording`, `ready` or `unrecoverable`, audio path and hash, raw transcript, typed text |
| `orphan_audio` | Recordings found with no row and no book to attach them to; listed in Settings, Recordings, never deleted |
| `sync_outbox`, `rejected_writes`, `sync_books` | Sync queue, refused writes, per-book cursors. Stay empty while `SERVER_FEATURES=off` |

Storage, deletion and export: [data-and-storage.md](data-and-storage.md).

## Native modules

Local Expo modules in `apps/mobile/modules`. Each is optional: absent in Expo Go and on web, so callers handle `null`.

| Module | iOS | What it does |
|---|---|---|
| `scribe-audio` | Swift (`ScribeAudioModule.swift`); Android stub | Decodes M4A to 16 kHz PCM in memory for whisper.rn, makes the listening copy with Apple voice isolation, streams SHA-256 of large files, gives the backup-excluded `listening` folder |
| `scribe-files` | Swift; no Android yet | Models folder and the iOS "exclude from backup" flag |
| `scribe-store` | Swift (`ScribeStoreModule.swift`, `PlusStoreSheet.swift`); Android stub | StoreKit 2 entitlements, Apple's subscription store view, manage, refund, offer codes, sync |

Third-party native code includes `whisper.rn`, `expo-sqlite`, `expo-audio`, `expo-secure-store`, `expo-notifications` and `expo-file-system` (`apps/mobile/package.json`).

## Build profiles and switches

<!-- facts:eas-profiles -->
| Profile | Channel | App environment | Extends | Other public switches |
|---|---|---|---|---|
| `development` | development | development |  | `SERVER_FEATURES=off`, `ANALYTICS=off` |
| `preview` | preview | preview |  | `SERVER_FEATURES=off`, `ANALYTICS=off` |
| `production` | production | production |  | `SERVER_FEATURES=off`, `ANALYTICS=off` |
| `testflight` | preview | preview |  | `SERVER_FEATURES=off`, `ANALYTICS=off` |
<!-- /facts:eas-profiles -->

Distribution, from `apps/mobile/eas.json`: `development` is an internal dev-client build, `preview` internal, `testflight` store distribution, and `production` sets none; `production` and `testflight` auto-increment the build number.

- **`APP_ENV`** (`lib/build-env.ts`): unset means development, never production. `app.config.ts` refuses an unknown value and adds a bundle id suffix: `.dev` for development, `.preview` for preview, none for production. The base id comes from `packages/brand` (`bundleId()`).
- **`devShortcutsAllowed`**: true only when the bundle is a dev bundle and `APP_ENV` is development. Every dev bypass checks it, never `__DEV__` alone.
- **Server features and analytics**: see [system.md](system.md#build-switches-server-features-and-analytics-are-off). `app.config.ts` records `extra.serverFeatures` and `extra.appEnv` so a build shows which it is.
- **Other `EXPO_PUBLIC_*` names read by the code**: `EXPO_PUBLIC_DOCS_BASE_URL` (signed documents host, `lib/remote`), `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (adds the Google sign-in plugin only when set, `app.config.ts`), `EXPO_PUBLIC_POSTHOG_KEY` (ignored while analytics is off), `EXPO_PUBLIC_SUPABASE_URL` (`lib/supabase`, server features). None is set in `eas.json`. Local runs read `apps/mobile/.env.development`.

`app.config.ts` also sets the iOS data-protection class to "complete until first user authentication", the privacy manifest with no collected data types, no background audio, and the universal-link domain from `packages/brand`.

## Where to look next

- Design system and components: `docs/design/` and `apps/mobile/src/components/ui`.
- Device test flows: `apps/mobile/e2e` (Maestro YAML) and `apps/mobile/e2e-web` (Playwright on the web preview).
- Release: [operations.md](operations.md).
