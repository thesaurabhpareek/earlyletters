---
title: Mobile app
owner: reference-docs
covers: [apps/mobile/src/**, apps/mobile/app.config.ts, apps/mobile/eas.json, apps/mobile/modules/**, apps/mobile/package.json, apps/mobile/.env.development]
verified_at: 56ec5b5
verified_on: 2026-10-15
---

# Mobile app (`apps/mobile`)

The iOS app: Expo SDK 57, React Native 0.86, Expo Router with typed routes and the React Compiler on (`apps/mobile/app.config.ts`, `experiments`). Android is configured but ships later (D-059, comment in `app.config.ts`). The whole system: [system.md](system.md).

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

How they are presented (from the `Stack` in `src/app/_layout.tsx`):

| Route | Presentation | What it is |
|---|---|---|
| `(tabs)`: `/`, `/book`, `/family` | Tabs | Tonight, Book, Family (`(tabs)/_layout.tsx`) |
| `/onboarding` | Card, no swipe back | First run: promise, child or children, birthday or due date, signature |
| `/write` | Modal | Typing a letter, autosaved to a draft |
| `/listen` | Full screen, no swipe | Recording; starts only from a tap (`lib/resilience/start-intent.ts`) |
| `/review` | Modal, no swipe | Review fixes, choose "Exactly as said", Keep |
| `/read-together` | Full screen | One letter at a time, oldest first, plain playback |
| `/letter/[id]` | Card with transparent header | The reading page |
| `/plus/confirmed` | Modal | Purchase confirmation after a new Plus purchase |
| `(auth)`, `/invite` | Modal | **Parked for v1.1.** With server features off, nothing opens them and a stale link goes home (`(auth)/_layout.tsx`, `+native-intent.tsx`) |
| `/settings/*` | Stack | Settings home and every row |

With server features off, Settings does not offer Account or Delete account (`settings/index.tsx`), and the Family tab shows the co-parent "coming soon" presentation (`components/family/coparent-soon.tsx`).

## Boot sequence

`src/app/_layout.tsx`, in order:

1. `SplashScreen.preventAutoHideAsync()` at import.
2. `RootLayout` calls `useLaunch(useStoreReady())` (`lib/resilience/use-launch.ts`): the database is opened and migrated once. A failure renders `LaunchRecovery` (Try again, Export what is readable) and nothing is deleted.
3. `Root` applies the appearance setting (Uniwind theme) and the navigation theme from `useTheme()`, hides the splash, and sets the native background colour.
4. The 18+ gate (`lib/age-gate.ts`): until it passes, only `AgeGateScreen` renders, so no route or deep link is reachable.
5. After the gate passes, on the first animation frame: `runLaunchSweep()` (`lib/capture/sweep.ts`), then `startServices()` once per process. Each service runs inside `safely()`, so one failing never stops the others:

| Order | Call | Module | What it does |
|---|---|---|---|
| 0 | `setFreeLettersAllowanceSource` | `lib/billing` | Free letters come from `effectiveFreeLetters(getRemoteConfig())` (`packages/api`) |
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
| `capture/` | Recorder (draft before mic), launch sweep, probe of killed takes, erase of deleted recordings |
| `transcribe*.ts` | The `Transcriber` interface, whisper.rn adapter, chunk planner, post-processing, prompt, loudness check, language codes, dev-only sample |
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
| `a11y.ts`, `motion.ts`, `haptics.ts`, `audio-mode.ts` | Accessibility, Reduce Motion, haptics vocabulary, audio session |
| `navigation.logic.ts`, `review-layout.logic.ts`, `shelf-days.ts`, `model-files.ts`, `utils.ts` | Back and close idioms, Review layout rules, the 30-day shelf, dev model folder, class name helper |
| `analytics/` | Opt-in analytics glue; inert in v1.0 |
| `auth/`, `supabase/`, `sync/`, `family/`, `account-deletion/` | **Parked for v1.1.** Sign-in, the Supabase client, outbox and cursor sync, invites, account deletion. `lib/supabase/secure-storage.ts` is also used in v1.0 by the letter ledger |

Pure logic files end in `.logic.ts` and are tested in Node (`apps/mobile/test`, vitest).

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
| `entries` | Letters: raw transcript, machine edits, final text, engine version, audio path, hash and size, kind, capture mode, edit level, in book, tombstone, transcript status, sync columns (unused in v1.0) |
| `children` | Books: name, birthday or due date, signature, reminders, hidden, server columns (unused in v1.0) |
| `drafts` | Takes and typed drafts before Keep: state `recording`, `ready` or `unrecoverable`, audio path and hash, raw transcript, typed text |
| `orphan_audio` | Recordings found with no row and no book to attach them to; listed in Settings, Recordings, never deleted |
| `sync_outbox`, `rejected_writes`, `sync_books` | Sync queue, refused writes, per-book cursors. **Parked**; stay empty with sync off |

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
| Profile | Channel | APP_ENV | Extends |
|---|---|---|---|
| `development` | development |  |  |
| `preview` | preview |  |  |
| `production` | production |  |  |
| `testflight` | preview |  |  |
<!-- /facts:eas-profiles -->

The facts block above leaves `APP_ENV` empty because `eas.json` sets `EXPO_PUBLIC_APP_ENV`, not `APP_ENV` (reported to the script owner). Read from `apps/mobile/eas.json`:

| Profile | `EXPO_PUBLIC_APP_ENV` | `EXPO_PUBLIC_SERVER_FEATURES` | `EXPO_PUBLIC_ANALYTICS` | Distribution |
|---|---|---|---|---|
| `development` | development | off | off | internal, dev client |
| `preview` | preview | off | off | internal |
| `production` | production | off | off | not set in the file, auto increment |
| `testflight` | preview | off | off | store, auto increment |

- **`APP_ENV`** (`lib/build-env.ts`): unset means development, never production. `app.config.ts` refuses an unknown value and adds a bundle id suffix: `.dev` for development, `.preview` for preview, none for production. The base id comes from `packages/brand` (`bundleId()`).
- **`devShortcutsAllowed`**: true only when the bundle is a dev bundle and `APP_ENV` is development. Every dev bypass checks it, never `__DEV__` alone.
- **Server features and analytics**: see [system.md](system.md#v10-runs-on-the-phone-only). `app.config.ts` records `extra.serverFeatures` and `extra.appEnv` so a build shows which it is.
- **Other `EXPO_PUBLIC_*` names read by the code**: `EXPO_PUBLIC_DOCS_BASE_URL` (signed documents host, `lib/remote`), `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (adds the Google sign-in plugin only when set, `app.config.ts`), `EXPO_PUBLIC_POSTHOG_KEY` (ignored while analytics is off), `EXPO_PUBLIC_SUPABASE_URL` (`lib/supabase`, parked). None is set in `eas.json`. Local runs read `apps/mobile/.env.development`.

`app.config.ts` also sets the iOS data-protection class to "complete until first user authentication", the privacy manifest with no collected data types, no background audio, and the universal-link domain from `packages/brand`.

## Where to look next

- Design system and components: `docs/design/` and `apps/mobile/src/components/ui`.
- Device test flows: `apps/mobile/e2e` (Maestro YAML) and `apps/mobile/e2e-web` (Playwright on the web preview).
- Release: [operations.md](operations.md).
