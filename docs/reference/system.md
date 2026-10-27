---
title: The whole system
owner: reference-docs
covers: [apps/mobile/src/app/_layout.tsx, apps/mobile/src/lib/capabilities.ts, apps/mobile/src/lib/remote/**, apps/mobile/src/lib/build-env.ts, .github/migrations-applied.txt]
verified_at: 1c6795b
verified_on: 2026-10-27
---

# The whole system on one page

Early Letters (codename `scribe`) is an iOS app, built with Expo, that lets a parent speak or type letters to a child and files them into a book by the child's month of age. This page says what runs where, how one letter travels from speaking to the book, where the data lives, and what leaves the phone. Each section links the page with the detail.

## Build switches: server features are on in one profile only

Sign-in, sync, co-parent sharing and account deletion exist as code on `develop` and are switched on or off at build time. D-100 (founder) ships server features in v1.0 after the R-17 security gate, and D-106 makes the alpha build 2 the first build with them on, against the staging project (see [the register](../decisions/INDEX.md); `docs/release/TESTFLIGHT.md`). In `apps/mobile/eas.json` only the `preview` profile sets the server switch to `on`; `development`, `testflight` and `production` set it `off`. Analytics stays off in v1.0 (D-095). This page describes both: the default build with nothing leaving the phone, and what `preview` adds.

| Switch | Read in | Value in `eas.json` | Off means |
|---|---|---|---|
| `EXPO_PUBLIC_SERVER_FEATURES` | `apps/mobile/src/lib/capabilities.ts` (`serverFeaturesEnabled`, `capabilities.signIn`, `.sync`, `.coParent`) | `on` in `preview`, `off` in the others | No Supabase client is constructed, sync never starts, sign-in, Account and Delete account are not offered, the Family tab shows "coming soon" |
| `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT` | same file (`capabilities.backup`, `.statusReport`, `mayRun`) | `off` in every profile | Each is on only when server features are also on and its own variable is `on`. Off: no recording backup (`startBackup` returns at once), no subscription status report |
| `EXPO_PUBLIC_ANALYTICS` | same file (`analyticsEnabled`, `capabilities.analytics`) | `off` in every profile | No consent sheet, no usage switch, no PostHog client, `startAnalytics()` does nothing |
| `EXPO_PUBLIC_ENGLISH_ONLY` | same file (`englishOnlyEnabled`) | `on` in `preview` and `testflight` (D-111) | On: the language picker offers English alone and a recording noted in another language waits for its language |
| `EXPO_PUBLIC_APP_ENV` | `apps/mobile/src/lib/build-env.ts` | `development`, `preview` or `production` per profile | Picks the bundle id suffix and whether dev shortcuts exist |

Only the value `on`, case-insensitive and with surrounding spaces ignored, turns a switch on. Remote config cannot turn any of these on. It can only pause a feature a build already has: the kill switches `sync`, `invites`, `photos`, `packDownloads`, `serverContent`, `backupUploads`, `escrow` and `statusReport` (`capabilities.ts`, `packages/api/src/kill-switches.ts`). Details: [mobile-app.md](mobile-app.md).

## What runs where

| Where | What | Used by a build from `develop` today? |
|---|---|---|
| The phone | The Expo app in `apps/mobile`: capture, on-device transcription, the faithful-edit engine, Review, the Book, Read together, Export, reminders, Plus through StoreKit | Yes |
| The phone | `packages/core` (engine and verifier), `packages/content` (every word), `packages/api` (contracts and signature checks), `packages/brand`, `packages/design-tokens`, bundled into the app | Yes |
| Apple | StoreKit 2 purchases and entitlements for Plus, through the local module `apps/mobile/modules/scribe-store` | Yes |
| A static host (CDN) | Signed remote config, pack manifest and content bundle, fetched from `EXPO_PUBLIC_DOCS_BASE_URL` | Every `eas.json` profile sets it to the packs host (D-097); nothing it serves is trusted until a signing key is pasted into `packages/api/src/keys.ts`; see below |
| Hugging Face and the self host | Speech model files, at the URLs the signed pack manifest lists (`apps/mobile/src/lib/models/catalog.ts`) | Only with a signed manifest |
| Supabase | Postgres schema in `supabase/migrations`, Edge Functions in `supabase/functions`, a purge cron | Only the `preview` profile calls it (staging). 25 migrations exist; only the 2 in `.github/migrations-applied.txt` are applied to the live project, and the repo does not record what staging has. `development`, `testflight` and `production` make no Supabase call |
| A separate Supabase project `scribe-escrow` | The `escrow` function for the recording-backup recovery key (ADR 0024) | No: backup is off in every profile |
| GitHub Actions | CI, database deploy pipeline, TestFlight build, the agent team | CI runs; others need founder setup |

Server detail: [backend.md](backend.md). CI and release: [operations.md](operations.md).

## How a letter travels

```
Tonight (Speak) -> Listening (recording) -> draft row + .m4a on disk
   -> transcription queue (whisper.rn on device, Silero VAD)
   -> raw transcript (set once)
   -> faithfulClean + verifyEdits (packages/core)
   -> Review (each fix shown, can be put back; "Exactly as said")
   -> Keep (Plus gate after 2 free letters) -> entries row in SQLite
   -> Book (by month of age) / letter page / Read together / Export
```

1. **Capture.** Tonight's Speak opens `listen.tsx`. A draft row is written before the microphone goes live, and the take is recorded as AAC M4A into the app's Documents directory (`apps/mobile/src/lib/capture/recorder.ts`). Finish, backgrounding, an interruption or leaving the screen all keep the take. Typing goes through `write.tsx` with an autosaved draft.
2. **Transcription.** The transcription queue (`apps/mobile/src/lib/transcription-queue/`) runs one job at a time, only in the foreground, and only once the language's speech packs are installed. Whisper runs on the phone through whisper.rn; nothing is sent anywhere. Silence gives an empty transcript, never invented words.
3. **The faithful-edit engine.** The raw transcript is cleaned only by the edit types in `packages/core/src/types.ts`, and every edit passes `verifyEdits` in `packages/core/src/verify.ts`. The raw transcript is never changed. Rules for the constitution: `CLAUDE.md`.
4. **Review.** `review.tsx` shows each machine edit, lets the person put any one back, or choose "Exactly as said". Saving is one transaction: the audio is hashed, the letter inserted and the draft removed together.
5. **Keep and the Plus gate.** The Keep step is the one place Plus is checked: the first 2 kept letters are free across every book, then Keep needs Plus ([plus-and-billing.md](plus-and-billing.md)).
6. **The book.** `(tabs)/book.tsx` groups letters into chapters by month of age; `letter/[id].tsx` is the reading page; `read-together.tsx` plays letters oldest first; Settings, Export makes one ZIP.

Speech and the engine: [speech-and-languages.md](speech-and-languages.md).

## Where data lives

| Data | Place | Backed up by the phone? |
|---|---|---|
| Letters, books, drafts, settings | SQLite file `scribe.db` through expo-sqlite (`apps/mobile/src/lib/store.ts`) | The app sets no backup exclusion on it; D-085 relies on the person's own iPhone or iCloud backup plus Export |
| Recordings | Documents directory (`recorder.ts`, `directory: 'document'`) | Yes, deliberately (`apps/mobile/src/lib/model-files.ts`, D-033, D-085) |
| Language packs and speech models | `Application Support/packs` | No, excluded (`apps/mobile/src/lib/packs/app-support.ts`) |
| Signed document cache | `Application Support/remote` | No, excluded |
| Free-letter count | Keychain item plus a database mirror (`apps/mobile/src/lib/billing/letter-ledger.ts`) | Keychain item is `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` |

All of it: [data-and-storage.md](data-and-storage.md).

## What leaves the phone

First for the builds with server features off (`development`, `testflight`, `production`), then what `preview` adds.

Checked by searching `apps/mobile/src` for `fetch(`, `openURL`, `openBrowserAsync` and download calls.

| What | When | Code |
|---|---|---|
| GET of signed documents (remote config, pack manifest, content bundle), with `credentials: 'omit'` | From `EXPO_PUBLIC_DOCS_BASE_URL`, which every profile sets; never Supabase while server features are off | `apps/mobile/src/lib/remote/base.logic.ts`, `remote/expo-adapter.ts` |
| Range downloads of language packs and speech models | After a language is chosen and, for speech, after the person says yes to the download; only for packs listed in a verified manifest | `apps/mobile/src/lib/packs/engine.ts`, `models/speech-consent.ts` |
| StoreKit 2 calls to Apple | Plan screen, purchase, restore, manage, refund, offer codes | `apps/mobile/modules/scribe-store`, `lib/billing/actions.ts` |
| Links the person taps | Terms and Privacy pages in the in-app browser, the Help email (`mailto:`), helpline phone numbers, Apple's subscription pages | `app/settings/index.tsx`, `app/settings/privacy.tsx`, `lib/billing/actions.ts` |
| Files the person shares | The export ZIP and the purchase "Save a copy" text, through the share sheet | `lib/export/`, `app/plus/confirmed.tsx` |

Nothing else: no analytics, no crash reporting, no Supabase, no audio upload. Reminders are local notifications (`lib/reminders/scheduler.ts`).

**What `preview` adds.** With server features on, all traffic to Supabase goes through the one client (`apps/mobile/src/lib/supabase/client.ts`): sign-in (Apple, Google or an email link using PKCE, ADR 0023), consent acts, letter sync (`sync_push` and `sync_pull`), invites, and account deletion; Sign in with Apple also sends one code to the `apple-token` function. Letter text, edits and held drafts upload through sync; audio does not, because backup is off. Analytics, crash reporting, backup and the status report still do not run. Server side: [backend.md](backend.md).

**Known gap.** `packages/api/src/keys.ts` (`TRUSTED_SIGNING_KEYS`) is empty. Every profile now sets `EXPO_PUBLIC_DOCS_BASE_URL`, so the app fetches the documents, but with no trusted key it verifies none of them: it installs no language pack and no speech model, so recordings are kept but wait for their words (stated in `docs/release/TESTFLIGHT.md`, "Without this, no words"). The founder's key ceremony and English-only pack release are D-115.

## Boot, in one paragraph

`apps/mobile/src/app/_layout.tsx` opens the database once (`useLaunch`); a failure shows the recovery screen instead of the app. Then the 18+ gate runs before any route. A phone with no book opens first run as the first route, so the tabs are not mounted behind it. After the gate passes and after the first frame, the launch sweep and the background services start once per process, each in its own try (remote documents, packs, transcription queue, sync, backup, Plus, free-letter ledger, reminders, analytics; the switches above decide which do anything). Order and detail: [mobile-app.md](mobile-app.md#boot-sequence).

## Where to go next

| Question | Page |
|---|---|
| Screens, boot, lib modules, native modules, build profiles | [mobile-app.md](mobile-app.md) |
| Transcription, language packs, the engine and verifier | [speech-and-languages.md](speech-and-languages.md) |
| Device storage, deletion, export, server schema | [data-and-storage.md](data-and-storage.md) |
| Supabase, Edge Functions, RPCs, deploys (off in every profile) | [backend.md](backend.md) |
| Workspaces and their dependency rules | [packages.md](packages.md) |
| Plus, StoreKit, the free-letter ledger | [plus-and-billing.md](plus-and-billing.md) |
| CI, release lanes, secrets by name, the agent team | [operations.md](operations.md) |
| What a word means in code and on screen | [glossary.md](glossary.md) |
| Why a decision was made | [../decisions/INDEX.md](../decisions/INDEX.md), [../DECISIONS.md](../DECISIONS.md), [../adr/](../adr/) |
