# Area E. Foundations and system states: design

Status: SKELETON (design lead, 20 Nov 2026). Screen ids below are stable; motion and content leads may key to them now. Full content follows.

## Screen inventory (ids are stable)

| Id | Screen or surface | Built file today |
|---|---|---|
| E-S01 | Launch and boot (splash to first frame, launch recovery) | `app/_layout.tsx`, `components/resilience/launch-recovery.tsx` |
| E-S02 | Welcome (first run step 1, sign-in doorway) | `app/onboarding.tsx`, `components/onboarding/welcome-*.tsx` |
| E-S03 | Age gate | `components/gate/age-gate-screen.tsx` |
| E-S04 | Sign in: choose a way (Apple, email) | `app/(auth)/sign-in/index.tsx` |
| E-S05 | Sign in: email | `app/(auth)/sign-in/email.tsx` |
| E-S06 | Sign in: code and verify | `app/(auth)/sign-in/code.tsx`, `verify.tsx` |
| E-S07 | Agreements and consent at sign-in | `app/(auth)/sign-in/consent.tsx` |
| E-S08 | First book: who is this book for (child step, languages) | `app/onboarding.tsx` child step |
| E-S09 | Opening your book (held screen, returning account, new phone arrival) | `components/onboarding/new-phone-screens.tsx` |
| E-S10 | Plus gate at Keep (the one gate) | `lib/billing/keep-step.ts`, gate sheet |
| E-S11 | Plus in Me (plan, allowance, restore, plan date) | `app/settings/plus.tsx` |
| E-S12 | Plus confirmed | `app/plus/confirmed.tsx` |
| E-S13 | Global fault screen (unhandled error, error boundary) | `components/resilience/global-fault-screen.tsx` |
| E-S14 | Server outage and kill switch screen and line | `components/onboarding/outage-screen.tsx` |
| E-S15 | System line (offline, remote pause, low storage, update) shown in place | new component `SystemLine` |
| E-S16 | App update (available, required) | none (gap) |
| E-S17 | Low storage (under 1 GB line, under 50 MB stop) | partial (`settings/storage.tsx`) |
| E-S18 | Second account on one phone (account mismatch) | `lib/first-run/account-books*.ts` |
| E-S19 | Interruption and recovery (call, background, kill; back to Home with the waiting card) | `lib/resilience/recover-to-tonight.ts` |
| E-S20 | Not found (bad link) | `app/+not-found.tsx` |
| E-S21 | Appearance (light, dark, system) | `app/settings/appearance.tsx` |
| E-S22 | App lock (locked cover) | `app/settings/app-lock.tsx`, `components/app-lock` |
| E-S23 | Accessibility walk sheet (NS-33) and speed run sheet (NS-34): not screens, matrices | n/a |

State suffixes: `.default`, `.loading`, `.empty`, `.offline`, `.error-<code>`, `.killswitch`, `.paused-<switch>`, `.lapsed`, `.second-account`, `.ax5`, `.vo` (VoiceOver order), `.dark`.

Cross-area state catalogue ids: `E-ST01` onward (section 5).
