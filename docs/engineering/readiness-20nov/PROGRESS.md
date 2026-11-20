# Progress: wave 1 execution (Karma, started 20 Nov 2026, 23:50 UTC)

Rule: this file is updated by Karma from merged PRs, at least every hour while work runs. One line per task. Status: QUEUED, BUILDING (branch or PR open), IN REVIEW, MERGED (sha), BLOCKED (on whom). The plan (`docs/product/prd/17-engineering-project-plan.md`, `17b-engineering-plan-new-scope.md`) holds the full task list and waves; this file only tracks what has moved. Freeze: develop 55574906c, errata E1 to E83, CL-001 to CL-158.

| Lane | Task | Owner | Status | PR | Blocks or notes |
|---|---|---|---|---|---|
| reminders | BL-966a notification budget registry (60 in total) | mobile | BUILDING | | brief R1; CR-69 A1 |
| reminders | BL-966b planner one a day | mobile | QUEUED | | after 966a |
| account | #871 account cover | mobile | BUILDING | #871 | held-screen words PROPOSED |
| account | #879 store reads | mobile | BUILDING | #879 | after #871 |
| photo | #835 to #840 stack (BL-931) | mobile | BUILDING | #835-#840 | #854 legal merge (founder) gates #835; #839 rework (C-01) |
| find | #894, #895 | mobile | BUILDING | #894, #895 | words PROPOSED |
| data | T1 synced-column drift guard | sync | BUILDING | | |
| data | BL-959 ADR 0028 amendment and keeping server tests | sync | BUILDING | | |
| quality | T3 phone-class label check | qa | BUILDING | | |
| quality | #1060, #1061, #1064, #1065 test PRs | qa | IN REVIEW (check) | #1060 #1061 #1064 #1065 | |
| platform | CI proposals (pins, label guard, secret scan, PR size, coverage, lint) | ops | QUEUED | | founder pastes workflow changes |
| first-run | FP stack (NS-38 to NS-45) | mobile, sync | QUEUED | | after wave 1 lanes above |
| comms | new-device sign-in email (NS-08-R21, E83) | sync, security-architect | QUEUED | | privacy read of the device table first; before the first outside family |

## Dispatch and dependency map (Karma, 20 Nov 2026, 23:58 UTC)

Rule: one builder per lane. A lane owns the path globs in `docs/agents/CLAIMS.md`; nobody else edits them. A task starts when everything in its "after" column is MERGED. Group A tasks share no files and no ordering, so they run in parallel now. Questions go to Karma as `<!-- req-question:<row id> -->` PR comments; Karma routes them to the owning seat and records the answer.

| Group | Task | Owner | After | Globs it owns | Source |
|---|---|---|---|---|---|
| A (now) | reminders BL-966a, then 966b | mobile | none | `apps/mobile/src/lib/reminders/**` | brief R1, CR-69 A1 |
| A (now) | account cover #871, store reads #879 | mobile | none | `apps/mobile/src/components/account/**`, `apps/mobile/src/lib/account-deletion/**` | HO-911 |
| A (now) | photo stack #835 to #840 | mobile | #854 (founder, legal) for #835 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | BL-931 |
| A (now) | Find #894, #895 | mobile | none | `apps/mobile/src/lib/find/**` | BL-952 |
| A (now) | T1 column drift guard, BL-959 | sync | none | `packages/api/**`, `supabase/tests/**` (own files) | plan T1 |
| A (now) | T3 label check, test PRs #1060 #1061 #1064 #1065 | qa | none | `**/test/**` (own files only) | quality catalogues |
| A (next) | kill-switch PR (signIn, libraryDays) | sync | none | `packages/api/src/kill-switches.ts` | CR-69 A5 |
| A (next) | B5 backup file PRs 1 to 3 | mobile | none | `apps/mobile/src/lib/backup/**` | BRIEF-B5 |
| A (next) | S1 photo policy migration, C3 audit writers, C9 grant drop | data-architect | none | `supabase/migrations/**` (new files), `supabase/tests/grants.mjs` | CR-71 |
| A (next) | CI proposals | ops | none | `docs/ops/proposed/**` | CR-69 A5, F3 |
| A (next) | first-run FP-1, FP-5, FP-17, FP-12, FP-9, FP-16b, FP-18 | mobile | none | `apps/mobile/src/components/onboarding/**` | 12-first-run-5.md section 2 |
| B | reminders planner UI, notification settings | mobile | 966a merged | `apps/mobile/src/components/settings/**` | plan |
| B | first-run lib queue BL-922a, BL-922b, BL-978a, then FP-6 | mobile | FP-1 merged | `apps/mobile/src/lib/first-run/**` | FP table |
| B | new-device sign-in email | sync, security-architect | privacy read of the device table | `supabase/functions/**` (own function) | NS-08-R21, E83 |
| C | store build, TestFlight | founder go | all P0 lanes merged and green | none | founder only |
