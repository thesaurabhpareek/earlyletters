# Coverage

Owner: quality engineering. Numbers measured 16 Oct 2026 on `develop` d1b23ce. Follow-ups with owners: BL-441 (a plan engine bug), BL-442 (ten tests that assert too little), BL-443 (slow tests that flake under load), in `docs/BACKLOG.md`.

## How to run

```bash
npm run test:coverage                       # every workspace, floors enforced, merged table
npm run test:coverage -- core mobile        # a subset
npm run test:coverage -- --files 25         # plus the 25 least covered files
npm run test:coverage -w @scribe/core       # one workspace
node scripts/coverage/report.mjs --files 25 # re-print the last run's table
```

- v8 provider (`@vitest/coverage-v8`, same version as vitest), `all: true` (a file no test loads counts at 0%), AST-aware remapping. Each workspace's `vitest.coverage.config.ts` builds on `scripts/coverage/preset.ts`; reports go to `<workspace>/coverage/` (gitignored). The CI job is proposed in `docs/ops/proposed/coverage-ci.md`.
- Never in a denominator: tests, `.d.ts`, goldens, `e2e/` and `e2e-web/`, vitest configs, command-line scripts. Mobile also leaves out `.tsx` screens and components, `src/app`, `src/dev` and the native adapters, so its number is the Node-testable part of the app.
- Coverage runs differ from `npm test` on purpose: 30 s per-test timeout; verifier and language fuzz at 2000 cases (same seed); the plan-reminders "holds every invariant" test left out (BL-443 removes the need for both).

## Numbers and floors

A floor is a whole number one point below the measurement (two for mobile and content). `verify.ts` and `plan.ts` carry their own floors: the constitution and the Plus gate live there.

| Workspace | Statements | Branches | Functions | Lines | Floors (S / B / F / L) |
|---|---|---|---|---|---|
| @scribe/core | 94.26% | 88.92% | 96.90% | 97.28% | 93 / 87 / 95 / 96 |
| core `src/verify.ts` | 97.83% | 96.51% | 100% | 100% | 97 / 95 / - / - |
| core `src/plan.ts` | 100% | 100% | 100% | 100% | - / 98 / - / - |
| @scribe/mobile | 55.52% | 55.91% | 49.03% | 56.24% | 53 / 53 / 47 / 54 |
| @scribe/content | 100% | 100% | 100% | 100% | 98 / 98 / 98 / 98 |
| @scribe/api | 94.69% | 91.70% | 94.74% | 95.74% | 93 / 90 / 93 / 94 |
| @scribe/analytics | 94.10% | 81.75% | 93.55% | 96.23% | 93 / 80 / 92 / 95 |
| @scribe/design-tokens | 90.74% | 88.89% | 100% | 89.80% | 89 / 87 / 99 / 88 |
| @scribe/emails | 95.92% | 81.44% | 97.48% | 98.08% | 94 / 80 / 96 / 97 |
| @scribe/brand | 90.20% | 67.86% | 81.82% | 90.91% | 89 / 66 / 80 / 89 |
| @scribe/experiments | 98.62% | 91.57% | 98.04% | 98.20% | 97 / 90 / 97 / 97 |
| **All, merged** | 71.35% | 69.06% | 66.26% | 72.43% | n/a |

`verify.ts` keeps a few branches uncovered on purpose: `inserted_content_word` (line 466) and the negation, mood and quote re-checks (452, 456, 457) cannot be reached with today's edit types, because each type's own check refuses first. They are defence in depth.

## The 25 least covered files that matter

All in `apps/mobile/src` and all at 0%: device glue that imports Expo or native modules and has never been loaded in Node. Nothing outside mobile is below 81% lines. **Cover first:** 2, 9 and 17 (durability and privacy promises), by mocking the one native module with a recording fake, as `test/store.shelf.test.ts` does.

| # | File (`lib/` unless noted) | Lines | What is untested | Risk |
|---|---|---|---|---|
| 1 | transcription-queue/index.ts | 241 | Runtime around the tested `machine.ts`: one job at a time, where finished words land, resume after a kill, consent gates | High: a waiting letter never gets words, or they land on the wrong letter |
| 2 | export/device.ts | 100 | Snapshot, temp ZIP, verify then share, temp file removed on close, stop and failure | High: an unencrypted export left in the cache (DATA-REQ-056) |
| 3 | reminders/scheduler.ts | 88 | Re-plan triggers, replacing only our notifications | Medium: duplicate or stale reminders (C-REQ-002) |
| 4 | audio-enhance/index.ts | 84 | Listening copy path, original only read | Medium: "the original is never altered" rests on untested code |
| 5 | a11y.ts | 78 | Announcements, focus on mount, AX size categories | Medium: AX5 layout regressions |
| 6 | models/speech-packs.ts | 71 | Which speech packs a phone asks for | Medium: wrong model for the memory tier |
| 7 | player/use-letter-player.ts | 71 | expo-audio events into the tested reducer | Low-medium: a voice starting by surprise |
| 8 | billing/plan-reminders.ts | 70 | Planner list into notifications, re-plan on plan change | Medium: LEGAL-REQ-047 notice timing |
| 9 | capture/recorder.ts | 65 | Draft row before the microphone, idempotent finalize, hash on stop | High: "the take is never lost" (LEGAL-REQ-011, DATA-REQ-048) |
| 10 | analytics/index.ts | 62 | SDK not loaded before consent, the `EXPO_PUBLIC_ANALYTICS` switch | High: LEGAL-REQ-003, nothing before consent |
| 11 | billing/plan-store.ts | 59 | Cached snapshot offline, refresh from StoreKit | Medium: C-NFR-004 fail-open for payers |
| 12 | remote/index.ts | 59 | Last good copy offline, never awaited at launch | Medium: A-REQ-002 |
| 13 | analytics/observers.ts | 55 | Module events into catalogue events | Low-medium: a wrong property after consent |
| 14 | models/whisper-runtime.ts | 55 | Lazy context, release on idle, background and memory warning | Medium: a resident 1 GB model, killed mid-take |
| 15 | billing/actions.ts | 54 | Re-reading StoreKit after purchase, restore, refund | Low-medium: Plus shown off until relaunch |
| 16 | transcribe-whisper.ts | 49 | Windowing, silence skip, no-speech path | Medium-high: an empty or cut raw becomes immutable |
| 17 | capture/sweep.ts | 46 | Applying the tested plan to files; the purge never during a take | High: the step that touches recordings |
| 18 | motion.ts | 43 | Reduce Motion subscription | Low |
| 19 | auth/passkey.ts | 38 | Passkey ceremony | Low until sign-in ships |
| 20 | reminders/prefs.ts | 36 | Reading and defaulting reminder settings | Medium: a damaged value turning reminders on |
| 21 | resilience/recovery-export.ts | 36 | "Export what is readable" after a launch failure | Medium: the last way out of a broken database |
| 22 | packs/index.ts | 35 | Public pack API over the tested engine | Low |
| 23 | `components/ui/fonts.ts` | 34 | Font family map | Low |
| 24 | auth/consent.ts | 34 | Which consent sheets show after sign-in | High once sign-in ships (LEGAL-REQ-001, -006) |
| 25 | auth/apple.ts | 31 | Nonce, name kept until Terms, revocation check | Low until sign-in ships |

## Content rules

Every string the 4 Oct pull requests added sits under `en`, `features` or an app `copy.ts`, which `packages/content/test/rules.test.ts` scans. `pricing.ts` is not scanned itself: its two price lines reach the rules through the website and pages copy that quotes them (`pricing.test.ts` pins that), and its third string, `plusPriceLine.line`, is used nowhere. **R** (rules test owner): add `leaves({ PLUS_PRICE, PLUS_TRIAL, plusPriceLine }, 'pricing')` to `ALL`, or delete `plusPriceLine.line`.
