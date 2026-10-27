---
title: Mobile app
owner: reference-docs
covers: [apps/mobile/src/**, apps/mobile/app.config.ts, apps/mobile/eas.json, apps/mobile/modules/**, apps/mobile/package.json, apps/mobile/.env.development]
verified_at: 1c6795b
verified_on: 2026-10-27
---

# Mobile app (`apps/mobile`)

The iOS app: Expo SDK 57, React Native 0.86, Expo Router with typed routes and the React Compiler on (`apps/mobile/app.config.ts`, `experiments`). Android is configured but ships later (D-059, comment in `app.config.ts`). Calm brand atmosphere (#99, then the experience pass P1, #192): Tonight, Book, Write, Read together and first run draw `Lamp` (`components/ui/lamp.tsx`), a decorative light pool whose scenes, tones and peaks are `tokens.atmosphere` in `packages/design-tokens`. Listen, Review, Read together and the letter page call `useUnlitRoom()`, so the light under them fades out and comes back instead of cutting. Contrast rules for the lamp: [D-110](../decisions/INDEX.md). The `QuotePair` brand device (`components/ui/quote-pair.tsx`; registry context `app.brand-device` in `packages/brand/registry.ts`) sits on the 18+ gate (`components/gate/age-gate-screen.tsx`) and the Book empty state (`components/ui/empty-state.tsx`). Since the experience pass P2 (#220) the welcome step shows the stacked lockup instead (`components/onboarding/welcome-lockup.tsx`, registry context `app.welcome`, D-109 F3). The whole system: [system.md](system.md).

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
| `/invite/leave` | screen | `apps/mobile/src/app/invite/leave.tsx` |
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
| `/settings/backup` | screen | `apps/mobile/src/app/settings/backup.tsx` |
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

How they are presented. The root `Stack` in `src/app/_layout.tsx` types no presentation or duration itself: it spreads `useRouteTransitions()` (`lib/motion.ts`) into each screen's options, which reads one table, `ROUTES` in `lib/transitions.logic.ts` (tested in `apps/mobile/test/transitions.test.ts`). Each route has a move: `dissolve` (a cross-fade over `tokens.motion.route.dissolveMs`), `sheet` and `push` (the platform's own), `cardToPage`, `cut` (no animation at all, used by first run so it continues the age question's lit room) or `none` (the tab root). Under Reduce Motion a dissolve shortens to `fadeMs` and native moves follow the system.

| Route | Presentation | What it is |
|---|---|---|
| `(tabs)`: `/`, `/book`, `/family` | Tabs | Tonight, Book, Family (`(tabs)/_layout.tsx`). Tonight: the prompt, one `DraftCard` per unfinished letter (states read from the draft's own fields, `components/tonight/draft-card.logic.ts`, including a letter held at the Keep gate), "A month ago" (`ResurfacedCard`) when no draft waits, "Not much today" (`QuietDayInline`), Speak and Type pinned below. Book: chapters by month of age, newest first, each opened by a `MonthOpener`; a kept letter arrives with a one-time wash and a deleted one leaves with Undo |
| `/onboarding` | Card, no swipe back, `cut` | First run, one step per screen (`ORDER` in `onboarding.tsx`): `welcome`, `promise` (a cleaned sample sentence, `components/onboarding/promise-sample.tsx`), `child` (name or names, birthday or due date), `signsAs`, `finish` ("The book is open."). One `Lamp` with `persistKey` `firstRun` carries the light from the gate through every step; the `BookCover` takes the child's name as it is typed. The welcome also offers "I already have a book" (sign-in sheet) and "I was invited" (`/invite`), both hidden with server features off |
| `/write` | Modal | Typing a letter, autosaved to a draft. "Add to {child}'s book" and "Keep private" arm a keep for that draft (`lib/capture/keep-intent.ts`, valid for 5 seconds and only after a tap) and hand over to Review, which runs the one Keep step at once and plays the saved moment, or opens the Plus sheet and leaves the letter on Tonight as a draft |
| `/listen` | Full screen, no swipe, cross-dissolve | Recording; starts only from a tap (`lib/resilience/start-intent.ts`). Opened any other way it rests with the red circle as the start control and the microphone untouched. Before a take it checks free space (`lib/capture/free-space.ts`, below 50 MB it does not start) and shows one of three state screens for microphone off, in use, or phone full (`components/capture/mic-state.logic.ts`) |
| `/review` | Full screen, no swipe, cross-dissolve | The words on a letter sheet (`components/capture/letter-sheet.tsx`) with each fix marked and tappable; one control "With small fixes / Exactly as said" is both the view and the choice and stays reversible (D-086). Before the words exist it shows one card per state (writing, language to download, failed, empty take and others; `components/capture/words-state.logic.ts`). Keep runs the Keep step, then the saved moment (`components/capture/saved-moment.tsx`) files the letter into its month and lands on the Book. Full screen (it was a page sheet) so Listen dissolves into Review with no change of shape |
| `/read-together` | Full screen, cross-dissolve | One letter at a time, oldest first, plain playback |
| `/letter/[id]` | Platform push, transparent header | The reading page. The page now mounts `CardToPage`/`PageOpening` and Tonight's and the Book's cards are card sources, but `ROUTES` still says `push`, so the card-to-page move does not play yet (`CARD_MODE` in `letter/[id].tsx`, comment in `lib/transitions.logic.ts`) |
| `/plus/confirmed` | Modal | Purchase confirmation after a new Plus purchase |
| `(auth)`, `/invite` | Modal (sheet) | Server features. With `SERVER_FEATURES=off` (every profile except `preview`), nothing opens them and a stale link goes home (`(auth)/_layout.tsx`, `+native-intent.tsx`). D-100 turns server features on for v1.0 and D-106 makes the alpha build the `preview` profile ([register](../decisions/INDEX.md)). `/invite/leave` shows a coming-soon line in build 2 and no screen links to it (D-113, `LEAVE_BOOK_OFFERED` in `lib/family/entry.logic.ts`) |
| `/settings/*` | Platform push | Settings home and every row. "Back up my recordings" (`/settings/backup`) appears only in a build with the backup flag on |

With server features off, Settings does not offer Account or Delete account (`settings/index.tsx`), and the Family tab shows the co-parent "coming soon" presentation (`components/family/coparent-soon.tsx`). With them on, the Family tab lists who writes to the open book and the server's pending invites (`lib/family/invite-list.logic.ts`).

Tabs and first run (R1): `useTabsInStack()` in the root layout wraps the `(tabs)` screen in `Stack.Protected`. A phone with no book that opened at the front door shows first run as the stack's first route, so no tab bar or unlit page appears between the age question and the welcome; the tabs join as soon as a book exists and then stay for the session. A launch on a link keeps the tabs under it (`tabsInStack`, `openedAtRoot` in `lib/transitions.logic.ts`).

## Boot sequence

`src/app/_layout.tsx`, in order:

1. `SplashScreen.preventAutoHideAsync()` at import.
2. `RootLayout` calls `useLaunch(useStoreReady())` (`lib/resilience/use-launch.ts`): the database is opened and migrated once. A failure renders `LaunchRecovery` (Try again, Export what is readable) and nothing is deleted.
3. `Root` calls `useE2eSeams()` (a no-op unless the build is the `e2e` profile, see below), applies the appearance setting (Uniwind theme) and the navigation theme from `useTheme()`, hides the splash, and sets the native background colour.
4. The 18+ gate (`lib/age-gate.ts`): until it passes, only `AgeGateScreen` renders, so no route or deep link is reachable.
5. After the gate passes, on the first animation frame: `runLaunchSweep()` (`lib/capture/sweep.ts`), then `startServices()` once per process. Steps 1 to 11 each run inside `safely()`, so one failing never stops the others; step 0 is a plain call that only registers a function:

| Order | Call | Module | What it does |
|---|---|---|---|
| 0 | `setFreeLettersAllowanceSource` (not in `safely()`) | `lib/billing` | Registers the allowance source: free letters come from `effectiveFreeLetters(getRemoteConfig())` (`packages/api`); `gates.ts` catches a throw from it and falls back to the default |
| 1 | `startRemote` | `lib/remote` | Loads cached signed documents and refreshes them |
| 2 | `startPacks` | `lib/packs` | Installs pack updates when a newer manifest arrives |
| 3 | `startTranscriptionQueue` | `lib/transcription-queue` | Registers the speech plan as a pack language resolver and runs queued jobs |
| 4 | `startListeningCopies` | `lib/audio-enhance` | Registers the listening-copy lookup; sweeps stale copies |
| 5 | `startSync` | `lib/sync` | Returns at once with server features off. With them on, `killSwitches.sync` in the signed remote config pauses every push and pull (phase `paused_server`); if the switch cannot be read, sync stays paused (fails closed) |
| 6 | `startBackup` | `lib/backup/gate` | Returns at once and loads nothing unless the build has the backup flag; otherwise starts the backup runtime |
| 7 | `startPlus` | `lib/billing` | StoreKit 2 listener and foreground re-read; with the status-report flag on, also starts the report sender |
| 8 | `startLetterLedger` | `lib/billing` | Heals the free-letter count after a reinstall or restore |
| 9 | `startReminders` | `lib/reminders` | Local notification schedule |
| 10 | `cleanupExports` | `lib/export` | Removes export ZIPs left by a killed export |
| 11 | `startAnalytics`, `startAnalyticsObservers` | `lib/analytics` | Do nothing with analytics off |

Inside the gate, `SessionProvider` wraps the stack, then `PendingInviteWatcher`, `PlanNoticeHost` (plan reminders) and `AnalyticsConsentAsk` are mounted. A render error anywhere lands in `RootErrorBoundary` (`components/resilience/error-boundary.tsx`). Note: `apps/mobile/src/lib/README.md` lists the boot order without `startLetterLedger` and `startBackup`; the code above is what runs.

## `src/lib` map

Screens call these; the API for the store is in `apps/mobile/src/lib/README.md`.

| Module | What it does |
|---|---|
| `store.ts` | The facade over the device database: one connection, defaults, change events. SQL lives in `db/repos/*` |
| `db/` | Migrator (`migrations.ts`), engine-neutral `SqlDb` (`sql.ts`), expo-sqlite adapter, repositories |
| `capture/` | Recorder (draft before mic), launch sweep, probe of killed takes, erase of deleted recordings (including letters the server erased, `finishErasedLetters`), the recording container per platform (`recording-file.ts`) and ADTS frame counting (`adts.ts`, `adts-file.ts`), the free-space check before a take (`free-space.ts`) and the one-tap keep from Write (`keep-intent.ts`). See [data-and-storage.md](data-and-storage.md) |
| `transcribe*.ts` | The `Transcriber` interface, whisper.rn adapter, chunk planner, the run's input checks (`transcribe-run.ts`), post-processing, prompt, loudness check, language codes, dev-only sample |
| `transcription-queue/` | One-at-a-time transcription jobs, retries, cleaning through `@scribe/core`. With the English-only switch on, a recording noted in another language waits for its language and is never handed to the recogniser (`language-hold.ts`) |
| `models/` | Speech model catalog, tiers, speech packs, download consent, whisper runtime |
| `packs/` | Pack engine: resumable, verified, atomic installs into Application Support |
| `language/` | Spoken languages chosen on this phone, text-rules pack loading |
| `remote/` | Signed remote config, pack manifest and content bundle, with offline fallbacks. A stale copy cannot clear a kill switch that is already set (`withFreshKillSwitches`, F19-REQ-008) |
| `billing/` | Plus: StoreKit plan state, Keep gate (`keepGateFor`), the Keep step around one save in Review (`keep-step.ts`: no words on screen means no gate and no count, M17 / D-103), letter ledger, plan reminders, Apple sheets, and the subscription status report sender (`status-report*.ts`, only in a build with the status-report flag) |
| `export/` | Export ZIP builder, schema and verification |
| `player/`, `audio-enhance/` | Letter playback and the clearer listening copy |
| `reminders/` | Local notifications planner and scheduler |
| `resilience/` | Launch open and recovery, recovery export, keep awake, start intent, not-found |
| `age-gate.ts`, `age-gate.logic.ts` | The 18+ entry gate (a boolean, never an age) |
| `capabilities.ts` | The build-time switches: server features, backup, status report, analytics and English only; `mayRun()` adds the remote kill switch for backup and the status report |
| `build-env.ts` | `APP_ENV`, `devShortcutsAllowed` and `e2eRefusal` |
| `privacy-manifest.ts` | The iOS privacy manifest `app.config.ts` writes: required-reason APIs for every build, collected data types that follow the build switches |
| `backup/` | Encrypted recording backup: key manager, upload queue, restore, resumable upload, service per signed-in person (ADR 0024). Built, and off in every profile. Reached only through `backup/gate.ts`, which loads nothing without the flag |
| `read-it-back.ts`, `provenance.ts` | "Words are ready. Read it back." flag; how a letter's words came to be |
| `copy.ts`, `permission-copy.ts`, `dates.ts` | Strings from `@scribe/content`, OS purpose strings, the one date format |
| `a11y.ts`, `motion.ts`, `haptics.ts`, `audio-mode.ts` | Accessibility, Reduce Motion and entry and exit animations, haptics vocabulary, audio session |
| `transitions.logic.ts` | The screen-transition table and its rules (see Routes above) |
| `licences.ts` | Licence notices for every bundled library, read from `src/generated/licences.json`, which `npm run licences:generate -w @scribe/mobile` makes (`scripts/licences/generate.mjs`); a test fails when the file is stale. For the Licenses page, which is not on `develop` yet (experience pass P6) |
| `navigation.logic.ts`, `review-layout.logic.ts`, `shelf-days.ts`, `model-files.ts`, `utils.ts` | Back and close idioms, Review layout rules, the 30-day shelf, dev model folder, class name helper |
| `analytics/` | Opt-in analytics glue; inert while `ANALYTICS=off`. No PostHog SDK is bundled in v1.0: `createClient` in `index.ts` is `null` and `posthog-react-native` is not a dependency (#125, D-095) |
| `auth/`, `supabase/`, `sync/`, `family/`, `account-deletion/` | Server features, on only in the `preview` profile; D-100 ships them in v1.0 ([register](../decisions/INDEX.md)). Sign-in, the Supabase client, outbox and cursor sync (including held drafts and conflict copies, ADR 0025), invites and the remote pause on them (`family/invites-switch.ts`), account deletion. Email links use PKCE and are accepted only on the phone that asked for them, then a claim screen asks before any local letters join the account ([ADR 0023](../adr/0023-email-links-pkce.md), `auth/email-link.logic.ts`, `auth/account-claim.logic.ts`). After Apple sign-in the one-time code goes to the `apple-token` function (`auth/apple-token.logic.ts`). `lib/supabase/secure-storage.ts` is also used, with server features off, by the letter ledger |

Pure logic files end in `.logic.ts` and are tested in Node (`apps/mobile/test`, vitest). `npm run test:coverage -w @scribe/mobile` runs them with coverage (`vitest.coverage.config.ts`).

`src/dev/` holds code for test builds only: `e2e-seams.ts` loads the kill drill (`kill-drill.ts`, `kill-drill.logic.ts`) only in a build with `EXPO_PUBLIC_E2E=1` whose app environment is neither `preview` nor `production`, and the drill refuses to arm except on a simulator, in the development bundle. Its `decode` mode reads kept takes the way a transcription job would, up to the speech model (ADR 0027). The host side is `apps/mobile/e2e/kill/`. The root layout calls `useE2eSeams()` as the first line of `Root`. The file's header still says `e2eRefusal` is not on `develop`; it is (`build-env.ts`).

## Shared components from the experience pass

Built in P1 (#192, #218) and wired into screens by P2 to P4c.

| Component | Path | What it is | Used by a screen on `develop` |
|---|---|---|---|
| `Lamp`, `LampView`, `useUnlitRoom` | `components/ui/lamp.tsx`, `lamp.logic.ts` | The light pool behind a screen, by scene and time of day | `Lamp`: Tonight, Book, Write, Read together, onboarding; `useUnlitRoom`: Listen, Review, Read together, the letter page |
| `BookCover` | `components/book/book-cover.tsx` | A paper book with the child's name; no images | Onboarding (from P2, #220) |
| `Toast` | `components/ui/toast.tsx`, `toast.logic.ts` | One quiet confirmation at a time, usually with Undo | The letter page, the Book and Recently deleted, through `components/ui/provider.tsx` |
| `PageTurn` | `components/motion/page-turn.tsx` | A sideways page turn for Read together; a 200 ms cross-fade under Reduce Motion | Read together |
| `CardToPage` | `components/motion/card-transition.tsx` | A letter card grows into its page, its words staying in place | The letter page mounts it and Tonight and the Book are card sources, but the route is still a push (see Screens) |
| `ExcerptFade` | `components/motion/excerpt-fade.tsx` | A few lines of a person's words ending in a fade, never an ellipsis; the whole text stays readable to VoiceOver | Letter cards, Tonight's cards, the saved moment, Recently deleted |
| `WelcomeLockup`, `PromiseSample` | `components/onboarding/welcome-lockup.tsx`, `promise-sample.tsx` (and their `.logic.ts`) | The welcome's stacked lockup from the brand registry; the promise step's sample sentence the real engine cleaned, each fix struck through and tappable to put back | Onboarding |
| `LineArt`, `DrawOn` | `components/ui/line-art.tsx`, `components/motion/draw-on.tsx` | Line drawings, drawn on | `LineArt` (which draws with `DrawOnStrokes`): Read together, empty and state screens, content blocks, the co-parent card |
| `LetterSheet`, `SavedMoment` | `components/capture/letter-sheet.tsx`, `saved-moment.tsx` | Review's paper ("To Asha, Month 7" and "From Mama"), and the move that files it into its month | Review |
| `MonthOpener` | `components/book/month-opener.tsx` | A chapter opens like a printed page; the current month is lit | The Book |
| `DraftCard`, `ResurfacedCard`, `QuietDayInline` | `components/tonight/` | An unfinished letter, "A month ago", and "A quiet day, kept." with Undo | Tonight |

Specs: `docs/design/MOTION.md`, `docs/design/COMPONENTS.md` and `docs/design/EXPERIENCE_PASS_2026-10.md`.

## Device database

SQLite file `scribe.db` (`store.ts` `DB_FILE_NAME`), opened with `PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL` (`db/expo-adapter.ts`). Schema version lives in `PRAGMA user_version`; migrations 1 to 8 are in `db/migrations.ts`, each in its own transaction. Version 6 (#146, WP-F04-03) adds columns only: `drafts.kind` (`note` or `letter`), `occurred_on` and `occurred_precision`, `language` and `base_direction` on drafts and letters; `drafts.state` gains the value `discarding`. Version 7 (WP-F12-02) moves what one person chooses for a book (what the child calls them, reminders, hide, quiet) into the new table `child_member_prefs`, and adds `children.created_by` and `first_run_batch`; the old `children.signs_as` and `reminders_on` columns stay and are kept in step as a mirror for a build one version back. Version 8 (WP-F14-22) adds the held-draft columns (`drafts.held_kind`, `in_book_choice`, `held_v`, `held_typed`, and `entries.held_v`) for a letter left waiting at the Keep gate. Tables:

<!-- facts:device-tables -->
- `settings`
- `entries`
- `children`
- `drafts`
- `orphan_audio`
- `sync_outbox`
- `rejected_writes`
- `sync_books`
- `child_member_prefs`
<!-- /facts:device-tables -->

| Table | Holds |
|---|---|
| `settings` | Key and value pairs: active child, appearance, reading size, reminders, age gate, ledger mirror, plan cache, pack and speech choices |
| `entries` | Letters: raw transcript, machine edits, final text, engine version, audio path, hash and size, kind, capture mode, edit level, in book, tombstone, transcript status, occurred precision, language, base direction, sync columns (unused while server features are off) |
| `children` | Books: name, birthday or due date, creator, server columns (unused while server features are off). Signature, reminders and hidden now live in `child_member_prefs` (the first two are mirrored here) |
| `child_member_prefs` | One row per book for the person on this phone: what the child calls them, include in reminders, hidden, quiet |
| `drafts` | Takes and typed drafts before Keep: kind, state `recording`, `ready`, `unrecoverable` or `discarding`, audio path and hash, raw transcript, typed text, occurred date and precision, language, base direction, and whether it was held at the Keep gate and where the author chose to put it |
| `orphan_audio` | Recordings found with no row and no book to attach them to; listed in Settings, Recordings, never deleted |
| `sync_outbox`, `rejected_writes`, `sync_books` | Sync queue, refused writes (including words conflicts kept as conflict copies the author picks between, `store.ts` `listConflicts`, `resolveConflict`), per-book cursors. Stay empty while `SERVER_FEATURES=off`. The protocol: ADR 0025 (proposed) |

Storage, deletion and export: [data-and-storage.md](data-and-storage.md).

## Native modules

Local Expo modules in `apps/mobile/modules`. Each is optional: absent in Expo Go and on web, so callers handle `null`.

| Module | iOS | What it does |
|---|---|---|
| `scribe-audio` | Swift (`ScribeAudioModule.swift`); Android stub | Decodes M4A to 16 kHz PCM in memory for whisper.rn, makes the listening copy with Apple voice isolation, streams SHA-256 of large files, gives the backup-excluded `listening` folder |
| `scribe-files` | Swift; no Android yet | Models folder and the iOS "exclude from backup" flag |
| `scribe-store` | Swift (`ScribeStoreModule.swift`, `PlusStoreSheet.swift`); Android stub | StoreKit 2 entitlements (with the offer type and whether the period is free), Apple's subscription store view, manage, refund, offer codes, sync, and `statusReportRefs` for the status report (a hashed reference per own subscription; the transaction id never reaches JavaScript) |
| `scribe-keys` | Swift (`ScribeKeysModule.swift`); no Android | Backup keys: book keys and the device key stay in the Keychain, HPKE sealing, AES-GCM, wrapped file keys (ADR 0024). Not autolinked (`expo.autolinking.exclude` in `package.json`) and never compiled in a build yet, so `ScribeKeys` is `null` and backup reports itself unavailable. Loaded only by `lib/backup/runtime.ts` |

Third-party native code includes `whisper.rn`, `expo-sqlite`, `expo-audio`, `expo-secure-store`, `expo-notifications` and `expo-file-system` (`apps/mobile/package.json`).

## Build profiles and switches

<!-- facts:eas-profiles -->
| Profile | Channel | App environment | Extends | Other public switches |
|---|---|---|---|---|
| `development` | development | development |  | `DOCS_BASE_URL=https://packs.earlyletters.app`, `SERVER_FEATURES=off`, `BACKUP=off`, `STATUS_REPORT=off`, `ANALYTICS=off` |
| `e2e` |  | development |  | `DOCS_BASE_URL=https://packs.earlyletters.app`, `E2E=1`, `SERVER_FEATURES=off`, `BACKUP=off`, `STATUS_REPORT=off`, `ANALYTICS=off` |
| `preview` | preview | preview |  | `DOCS_BASE_URL=https://packs.earlyletters.app`, `SERVER_FEATURES=on`, `BACKUP=off`, `STATUS_REPORT=off`, `ANALYTICS=off`, `ENGLISH_ONLY=on` |
| `production` | production | production |  | `DOCS_BASE_URL=https://packs.earlyletters.app`, `SERVER_FEATURES=off`, `BACKUP=off`, `STATUS_REPORT=off`, `ANALYTICS=off` |
| `testflight` | preview | preview |  | `DOCS_BASE_URL=https://packs.earlyletters.app`, `SERVER_FEATURES=off`, `BACKUP=off`, `STATUS_REPORT=off`, `ANALYTICS=off`, `ENGLISH_ONLY=on` |
<!-- /facts:eas-profiles -->

Distribution, from `apps/mobile/eas.json`: `development` is an internal dev-client build, `e2e` an internal simulator build without credentials, `preview` and `testflight` store distribution, and `production` sets none; `preview`, `testflight` and `production` auto-increment the build number. `preview` is the only profile with server features on (the alpha against staging, D-100, D-106); `testflight` and `production` stay off until the security gate passes (comment in `lib/capabilities.ts`). `BACKUP` and `STATUS_REPORT` are off in every profile.

- **`APP_ENV`** (`lib/build-env.ts`): unset means development, never production. `app.config.ts` refuses an unknown value and adds a bundle id suffix: `.dev` for development, `.preview` for preview, none for production. The base id comes from `packages/brand` (`bundleId()`).
- **`devShortcutsAllowed`**: true only when the bundle is a dev bundle and `APP_ENV` is development. Every dev bypass checks it, never `__DEV__` alone.
- **`EXPO_PUBLIC_E2E=1`**: `app.config.ts` throws (`e2eRefusal`, `lib/build-env.ts`) unless the app environment is development and, on EAS, the profile is `e2e` (release check B-9).
- **Build switches**: server features, backup, status report, analytics and English only, all read in `lib/capabilities.ts`; only the value `on` turns one on. Backup and status report also need server features on. See [system.md](system.md#build-switches-server-features-and-analytics-are-off). `app.config.ts` records `extra.serverFeatures`, `extra.backup`, `extra.statusReport` and `extra.appEnv` so a build shows which it is.
- **English only** (`EXPO_PUBLIC_ENGLISH_ONLY=on`, D-111 item 4): on in `preview` and `testflight`. The language picker lists English alone with one line that other languages come later (`components/language/language-picker.logic.ts`), Settings, Spoken language shows no Add row and no "two more" line, and a recording noted in another language waits for its language (`lib/transcription-queue/language-hold.ts`). A language already stored on the phone is not changed. Production leaves it unset.
- **Other `EXPO_PUBLIC_*` names read by the code**: `EXPO_PUBLIC_DOCS_BASE_URL` (signed documents host, `lib/remote`; set to `https://packs.earlyletters.app` in every `eas.json` profile since #126, D-097), `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (adds the Google sign-in plugin only when set, `app.config.ts`), `EXPO_PUBLIC_POSTHOG_KEY` (ignored while analytics is off), `EXPO_PUBLIC_SUPABASE_URL` with `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`lib/supabase/env.ts`, server features; public by design), `EXPO_PUBLIC_EMAIL_OTP_LENGTH` (`lib/auth/email.ts`), and `EXPO_PUBLIC_ESCROW_URL` and `EXPO_PUBLIC_ESCROW_KEYS` (`lib/backup`). Of these, only the documents host is set in `eas.json`; the project values are EAS environment variables. Local runs read `apps/mobile/.env.development`.

`app.config.ts` sets the iOS deployment target to 17.0 (`IOS_DEPLOYMENT_TARGET`, through `expo-build-properties`; D-098) and the iOS data-protection class to "complete until first user authentication", the privacy manifest from `lib/privacy-manifest.ts` (no collected data types while server features are off; a server-on build declares what the privacy-label worksheet lists for its flags), no background audio, and the universal-link domain from `packages/brand` (sign-in callback and invite links `/j`). It also removes the `aps-environment` push entitlement that `expo-notifications` would add, because reminders are local notifications and nothing asks for a push token.

## Where to look next

- Design system and components: `docs/design/` and `apps/mobile/src/components/ui`.
- Device test flows: `apps/mobile/e2e` (Maestro YAML) and `apps/mobile/e2e-web` (Playwright on the web preview).
- Release: [operations.md](operations.md).
