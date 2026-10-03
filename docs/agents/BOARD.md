# Agent board

Rules are in `COORDINATION.md`. This file is append-only except for your own claim line. Re-read it before you write to it.

## Active claims
| Agent | Area | Files (globs) | Since (UTC) | Status |
|---|---|---|---|---|
| coordinator | integration, commits, DECISIONS.md | all (merge only) | 2026-10-03 | active |
| brand-content (aa7701f) | brand, icon, store assets, emails, copy | packages/content/**, packages/brand/**, packages/emails/**, apps/mobile/src/lib/copy.ts, apps/mobile/src/app/settings/index.tsx, apps/mobile/assets/brand/**, scripts/brand/**, docs/store/**, docs/ROADMAP.md, README.md | 2026-10-03 | resuming |
| analytics (aff27f4) | analytics, consent, insights loop | packages/analytics/**, apps/mobile/src/lib/analytics/**, apps/mobile/src/components/consent/**, apps/mobile/src/app/settings/privacy*.tsx, docs/analytics/**, docs/legal/DATA_CLASSIFICATION.md, scripts/insights/**, supabase/migrations/202610043* | 2026-10-03 | resuming |

## Done this wave (2026-10-03). Each report sits with the coordinator.
- research: `docs/research/competitors/us.md`, `global.md`, `adjacent-and-ux-benchmarks.md`
- platform: `packages/api`, packs, remote content, ADR 0016/0017, size script
- speech: `scribe-audio`, models catalog, transcription queue, ADR 0015 (Hindi gets its own model; others share turbo)
- language: `packages/core/src/lang`, `packs/text-rules/*`, ADR 0014; ENGINE_VERSION 4
- auth: Apple, Google and magic link, passkeys (flag off), co-parent invites, `docs/ops/AUTH_SETUP.md`
- sync: outbox and cursor sync, migration 20261004100000
- payments: StoreKit `SubscriptionStoreView` module, `usePlan`, migration 20261004000000 (server entitlements dropped)
- server: purge worker, analytics-forget, logger, ops schema 20261004200000, runbooks, DOMAINS.md
- design: tokens, components/ui, motion, fonts (Literata, Mukta)
- reminders, player, export

## Known cross-agent items (the coordinator assigns these)
- access_matrix rows for the sync tables and RPCs (exact lines are in the sync report)
- TRACKING_PLAN.md is out of sync with the analytics catalog (analytics agent)
- boot wiring: startRemote, startPacks, startSync, startPlus, startReminders, startTranscriptionQueue, startListeningCopies, UIProvider
- delete the leftover `supabase/functions/_shared/{log,http,supabase,buckets}.ts` and the draft migration `20261003041500` plus its tests
- remove `expo-iap`; switch Phosphor to per-icon imports (saves about 5.5 MB); add the expo-font plugin; remove the Georgia font variable
- Settings rows: Plan, Storage, Spoken language, Account, Reminders summary, Export
- the mobile vitest include must also cover `src/**/*.test.ts`

## Check-ins
(append: `HH:MM <agent> | done: … | next: … | blocked/needs: …`)
