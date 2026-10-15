---
title: The whole system
owner: reference-docs
covers: [apps/mobile/src/app/_layout.tsx, apps/mobile/src/lib/capabilities.ts, apps/mobile/src/lib/remote/**, apps/mobile/src/lib/build-env.ts, .github/migrations-applied.txt]
verified_at: d74e860
verified_on: 2026-10-15
---

# The whole system on one page

Early Letters (codename `scribe`) is an iOS app, built with Expo, that lets a parent speak or type letters to a child and files them into a book by the child's month of age. This page says what runs where, how one letter travels from speaking to the book, where the data lives, and what leaves the phone. Each section links the page with the detail.

## Build switches: server features and analytics are off

Sign-in, sync, co-parent sharing and backup exist as code on `develop`, and every build profile switches them off at build time. Whether these ship in v1.0 is an open decision ([register](../decisions/INDEX.md)): issue #127 and `apps/mobile/src/lib/capabilities.ts` (founder decision of 3 Oct 2026) describe an on-device v1.0, while later open proposals record server features on in v1.0. This page describes what a build from `develop` does today.

| Switch | Read in | Value in every `eas.json` profile | Off means |
|---|---|---|---|
| `EXPO_PUBLIC_SERVER_FEATURES` | `apps/mobile/src/lib/capabilities.ts` (`serverFeaturesEnabled`, `capabilities.signIn`, `.sync`, `.coParent`) | `off` in every `apps/mobile/eas.json` profile | No Supabase client is constructed, sync never starts, sign-in, Account and Delete account are not offered, the Family tab shows "coming soon" |
| `EXPO_PUBLIC_ANALYTICS` | same file (`analyticsEnabled`, `capabilities.analytics`) | `off` in every profile | No consent sheet, no usage switch, no PostHog client, `startAnalytics()` does nothing |
| `EXPO_PUBLIC_APP_ENV` | `apps/mobile/src/lib/build-env.ts` | `development`, `preview` or `production` per profile | Picks the bundle id suffix and whether dev shortcuts exist |

Only the literal value `on` turns a switch on. Remote config has no key that can change either switch (`capabilities.ts`, `packages/api/src/remote-config.ts`). Details: [mobile-app.md](mobile-app.md).

## What runs where

| Where | What | Used by a build from `develop` today? |
|---|---|---|
| The phone | The Expo app in `apps/mobile`: capture, on-device transcription, the faithful-edit engine, Review, the Book, Read together, Export, reminders, Plus through StoreKit | Yes |
| The phone | `packages/core` (engine and verifier), `packages/content` (every word), `packages/api` (contracts and signature checks), `packages/brand`, `packages/design-tokens`, bundled into the app | Yes |
| Apple | StoreKit 2 purchases and entitlements for Plus, through the local module `apps/mobile/modules/scribe-store` | Yes |
| A static host (CDN) | Signed remote config, pack manifest and content bundle, fetched only if the build sets `EXPO_PUBLIC_DOCS_BASE_URL` | Not set in `eas.json`; see below |
| Hugging Face and the self host | Speech model files, at the URLs the signed pack manifest lists (`apps/mobile/src/lib/models/catalog.ts`) | Only with a signed manifest |
| Supabase | Postgres schema in `supabase/migrations`, Edge Functions in `supabase/functions`, a purge cron | Off in every build profile. 12 migrations exist; only the 2 in `.github/migrations-applied.txt` are applied live. A build from any current profile makes no Supabase call |
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

## What leaves the phone in a build from `develop`

Checked by searching `apps/mobile/src` for `fetch(`, `openURL`, `openBrowserAsync` and download calls.

| What | When | Code |
|---|---|---|
| GET of signed documents (remote config, pack manifest, content bundle), with `credentials: 'omit'` | Only if the build sets `EXPO_PUBLIC_DOCS_BASE_URL`; never Supabase while server features are off | `apps/mobile/src/lib/remote/base.logic.ts`, `remote/expo-adapter.ts` |
| Range downloads of language packs and speech models | After a language is chosen and, for speech, after the person says yes to the download; only for packs listed in a verified manifest | `apps/mobile/src/lib/packs/engine.ts`, `models/speech-consent.ts` |
| StoreKit 2 calls to Apple | Plan screen, purchase, restore, manage, refund, offer codes | `apps/mobile/modules/scribe-store`, `lib/billing/actions.ts` |
| Links the person taps | Terms and Privacy pages in the in-app browser, the Help email (`mailto:`), helpline phone numbers, Apple's subscription pages | `app/settings/index.tsx`, `app/settings/privacy.tsx`, `lib/billing/actions.ts` |
| Files the person shares | The export ZIP and the purchase "Save a copy" text, through the share sheet | `lib/export/`, `app/plus/confirmed.tsx` |

Nothing else: no analytics, no crash reporting, no Supabase, no audio upload. Reminders are local notifications (`lib/reminders/scheduler.ts`).

**Known gap.** `packages/api/src/keys.ts` (`TRUSTED_SIGNING_KEYS`) is empty and no `eas.json` profile sets `EXPO_PUBLIC_DOCS_BASE_URL`, so a build made today has no verified manifest. It installs no language pack and no speech model, so recordings are kept but wait for their words (stated in `docs/release/TESTFLIGHT.md`, "Without this, no words").

## Boot, in one paragraph

`apps/mobile/src/app/_layout.tsx` opens the database once (`useLaunch`); a failure shows the recovery screen instead of the app. Then the 18+ gate runs before any route. After it passes and after the first frame, the launch sweep and the background services start once per process, each in its own try. Order and detail: [mobile-app.md](mobile-app.md#boot-sequence).

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
