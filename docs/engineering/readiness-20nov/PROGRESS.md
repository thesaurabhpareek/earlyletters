# Progress: wave 1 execution (Karma, started 20 Nov 2026, 23:50 UTC)

Rule: this file is updated by Karma from merged PRs, at least every hour while work runs. One line per task. Status: QUEUED, BUILDING (branch or PR open), IN REVIEW, MERGED (sha), BLOCKED (on whom). The plan (`docs/product/prd/17-engineering-project-plan.md`, `17b-engineering-plan-new-scope.md`) holds the full task list and waves; this file only tracks what has moved. Freeze: develop 55574906c, errata E1 to E83, CL-001 to CL-158 (plans 17 and 17b are pinned one erratum behind, at dcbf70fc8 and E82; the E83 text is in 18-errata-after-lock.md). Started 20 Nov 2026, 23:50 UTC. Last refresh: 21 Nov 2026, 03:56 UTC, against develop `5b06b5eb8` (facts from the GitHub pulls API and `scripts/trace.mjs --no-write`; [U] means not verified).

## What changed since the 03:02 refresh (21 Nov 2026, 03:56 UTC)

Facts are from the GitHub pulls API (merged flag, merged_at, squash sha); [U] means not verified.
- MERGED, with squash sha: BL-922a #1126 `8464ebd74` (03:03Z); FP-9 #1125 `2584a89e0` (03:27Z); privacy read of the device table #1152 `6131c7959` (03:05Z); architecture and chapter 02 sync #1158 `8359f86b4` (03:09Z); CI-COV proposal and G9 floors test #1157 `a0092223c` (03:11Z); CI-SIZEGATE #1162 `5b63e1273` (03:16Z); the 02:53 refresh #1153 `497d707fa` (03:23Z); ADRs 0036 to 0038 #1165 `638227e2a` (03:26Z, PROPOSED, the founder decides); privacy file 08 follow-up #1164 `24095765d` (03:31Z); Find 6/8 with the bookSearch kill-switch key #894 `ae3c1682c` (03:30Z); PERF markers ring and content-free test (BL-929 PR 1) #1155 `5b06b5eb8` (03:45Z); C9 insights_reader grant drop #1144 `3eb50fcf7` (03:54Z); new-device sign-in tables, token hook and session lever #1176 `2c077e366` (03:55Z). #1144 and #1176 are in develop, not applied to hosted (the founder applies hosted migrations) [U whether applied].
- IN REVIEW (open, not merged; head 8 chars, GitHub mergeable_state): FP-2 #1159 `280d92a8` [blocked]; BL-922b #1167 `79712369` [unstable]; B5 PR 2 #1169 `d4708c98` [unstable]; BL-966c #1172 `de61aec8` [unstable]; BL-978a #1173 `208d626f` [unstable]; planPending re-plan hook #1174 `1b6bf8c6` [unstable]; days store file foundation #1175 `9e058de1` [unstable, 400 lines]; BL-961 #879 `6d22a523` [unstable]; photo stack #835 `76589e01` [blocked], #836 to #840 [unstable]; Find 7/8 #895 `1fb5391e` [clean] (labels from:agent, agent:mobile). Reviewer counts are [U].
- #895: held for the founder, because it touches `docs/legal/DATA_CLASSIFICATION.md` [U: the hold is from the brief, not read from the PR]. Do not merge it before his answer.
- Still open and unchanged: HO-911 #1087 [clean], FP-12 #1128, FP-16b #1124, HG-MQ #1149 [blocked], QA-TITLES #1151 [blocked], PostHog adapter #1086 [blocked], BL-960 #873, Find core #798 and #799.

## What changed in the hour before (21 Nov 2026, 03:02 UTC)

Since 23:45 UTC on 20 Nov, 68 PRs merged into develop [V pulls API, state closed, merged_at after 23:45Z, pages 1 to 3]. The ones that moved plan rows:
- Still open, not merged (the earlier table was right): photo stack #835 to #840 (BL-931 slices 3a to 5; #835 is `blocked`, #836 to #840 `unstable`; stacked on one another), #879 (BL-961, `unstable`), #894 and #895 (BL-952 6/8, 7/8, both `clean`), #873 (BL-960, `dirty`: a merge conflict with develop), #798 and #799 (Find, `dirty`). S1 (BL-870) is now MERGED as #1115, which removes one of the two F1 gates on the photo slices; the plain statement of what leaves the phone is [U].
- BL-966a #1088 and BL-966b #1089 `3c0b57235` (merged 03:00Z) are MERGED.
- Data and tests: T1 #1068 and T3 #1069 MERGED; test PRs #1060, #1061, #1064, #1065 MERGED; BL-959 parts #1070, #1074, #1083 MERGED; P-4b tests #1140, #1141 MERGED.
- First-run: FP-1 #1101, FP-17 #1121, FP-18 #1120 MERGED; FP-9 #1125, FP-12 #1128, FP-16b #1124 and BL-922a #1126 opened, IN REVIEW.
- CR-71: C3 #1147 `81d6dac15` MERGED 03:00Z (not applied to the hosted project; the founder applies hosted migrations); C9 #1144 IN REVIEW (also not applied). Merged since 02:33Z: G4 #1085 `52c7d0d4f`, B5 PR 1 #1112 `eab5edd35`, kill-switch PR #1113 `26e516e9b` (adds signIn and libraryDays; this carries the FP-5 key).
- CI and ops: #1093, #1094, #1095, #1096, #1148, #1150 MERGED; #1149 (HG-MQ patch) IN REVIEW.
- Measured, develop `d758baaa1` (`node scripts/trace.mjs --no-write`, report mode; it counts merged tests only, so a test in an open PR is untested here): NS cards, 1,032 acceptance rows in 16 cards, 537 P0: 70 tested, 0 partial, 0 journey, 17 device, 450 untested; 5 P0 with no backlog row. Old v2 trace: 773 P0, 552 with no test title, 232 ids in 930 test titles. No earlier reading is in this file, so there is no delta [U].

## Plan rows (status from GitHub, 21 Nov 2026, 03:02 UTC)

Status words: MERGED (PR, squash sha), IN REVIEW (PR, head sha; GitHub mergeable_state in brackets: clean = checks green and approvals in; unstable = a check not green; blocked = approvals outstanding), BUILDING (no PR yet), QUEUED, NOT STARTED, BLOCKED (on what). Lane owner as in the table below it; one builder per lane.

| Lane | Plan row | Owner | Status | PR and sha | Blocks or notes |
|---|---|---|---|---|---|
| reminders | BL-966a budget registry | mobile | MERGED | #1088 `952eac323` | test #1075 (NS-32-R4b) is a draft |
| reminders | BL-966b one a day | mobile | MERGED | #1089 `3c0b57235` (head `436f36f8`) | 134 lines |
| account | #871 cover | mobile | MERGED | #871 (22:37Z) | sha [U] |
| account | BL-961 store reads | mobile | IN REVIEW [unstable] | #879 `6d22a523` | 439 lines; [X4-R1] partial (3 of 3); #871 merged |
| account | HO-911 delete under a second account | mobile | IN REVIEW [clean] | #1087 `709bbe28` | see PR |
| photo | BL-931 slices 3a, 3b, 4a, 4b, 4c, 5 | mobile | IN REVIEW (stack) | #835 `76589e01` [blocked], #836 `e022a615`, #837 `6834adb9`, #838 `3604be26`, #839 `b6d30fd3`, #840 `d9ac2437` [unstable] | merge in order; per F1 only with S1 (now MERGED #1115) and the plain statement of what leaves the phone [U] |
| find | BL-952 6/8 MERGED, 7/8 IN REVIEW | mobile | 6/8 MERGED; 7/8 IN REVIEW [clean] | #894 `ae3c1682c` (head `cb721350`), #895 `1fb5391e` | 7/8 held for the founder (touches docs/legal/DATA_CLASSIFICATION.md) [U]; words PROPOSED; 8/8 NOT STARTED [U]; Find core #798 `7f36031a` and #799 `1fac1c6f` are `dirty` (conflict) |
| data | T1 synced-column guard | sync | MERGED | #1068 `8447a2589` | |
| data | BL-959 ADR 0028 A5 and keeping server tests | sync, data-architect | MERGED | #1070 `4aa487c0b`, #1074 `e27c73599`, #1083 `d2a54aa49` | |
| data | BL-960 data inventory | privacy | IN REVIEW [dirty] | #873 `e332fe64` | merge conflict; founder merges |
| data | S1 / BL-870 server refuses a picture | data-architect | MERGED in develop, NOT applied to hosted | #1115 `dca49553c` | the founder applies hosted migrations; applied state [U] |
| data | C3 audit writers, security_events store | data-architect | MERGED in develop, NOT applied to hosted | #1147 `81d6dac15` (head `d61b777b`) | 357 lines; the docs/legal classification block needed the founder's OK [U whether given]; founder applies the migration |
| data | C9 drop insights_reader grant | data-architect | MERGED in develop, NOT applied to hosted | #1144 `3eb50fcf7` (head `83d2cfd0`) | founder applies; applied state [U] |
| data | kill-switch PR (CR-69 A5) | sync | MERGED | #1113 `26e516e9b` (head `4b982dcb`) | signIn, libraryDays keys; this is the FP-5 key |
| quality | T3 phone-class label check | qa | MERGED | #1069 `b00c3b1c7` | |
| quality | test PRs G6, sync late pull, trace, Asha fixture | qa | MERGED | #1061 `80da04d08`, #1064 `d48b2a7fe`, #1060 `192452b41`, #1065 `d1d3e1843` | |
| quality | G4 module boundaries | qa | MERGED | #1085 `52c7d0d4f` (head `c549a3fa`) | G5 #1090 `67aee7f03` and #1127 `6bc26383d` MERGED |
| quality | P-4b NS-09 let-go rows | qa | MERGED | #1140 `674058229`, #1141 `3e342fa27` | |
| backup | B5 PR 1 exclude backup state file | mobile | MERGED | #1112 `eab5edd35` (head `58529820`) | 447 lines (over 400, size exception [U]); PR 2 (delete the state file on Erase and sign-out) IN REVIEW [unstable] #1169 `d4708c98`; PR 3 NOT STARTED |
| platform | CI: pins, label guard, secret scan, PR size, queue Q1, H3 | ops | MERGED (as proposals and scripts) | #1093 `0d1f55e6f`, #1095 `85b31b3a3`, #1094 `22fe9d7c2`, #1096 `3450db9fc`, #1150 `917a3d756`, #1148 `1a3fc85d1` | founder pastes workflow changes |
| platform | HG-MQ merge-queue patch | ops | IN REVIEW [blocked] | #1149 `a83d22cd` | |
| platform | CI coverage proposal and G9 floors test | ops | MERGED (as proposal and test) | #1157 `a0092223c` | founder pastes workflow changes; lint NOT STARTED [U] |
| platform | CI-SIZEGATE size gate | ops | MERGED (as script, tests, proposed job) | #1162 `5b63e1273` | founder pastes workflow changes |
| analytics | PostHog Cloud adapter | analytics | HELD (in review) | #1086 `07ba4a3a` | BLOCKED on the founder: words and the native plugin; 2,244 lines, split plan merged as #1091 |
| first-run | FP-1 (NS-38 listing test) | content | MERGED | #1101 `3a7e7c204` | words wait for the founder |
| first-run | FP-5 sign-in kill switch key | sync (not mobile) | MERGED | #1113 `26e516e9b` (head `4b982dcb`) | the key is built; the sign-in screen use of it is [U] |
| first-run | FP-2 consent builder | mobile | IN REVIEW [blocked] | #1159 `280d92a8` | 417 lines; lands before any other consent.ts change |
| quality | BL-929 PERF profile and markers (BL row owed from product) | qa | PR 1 MERGED | #1155 `5b06b5eb8` (head `0d284513`) | PR 2 BLOCKED on the founder approving a perf EAS profile |
| quality | QA-TITLES | qa | IN REVIEW [blocked] | #1151 `ac524eb9` | |
| comms | privacy read of the device table (NS-08-R21) | privacy | MERGED | #1152 `6131c7959`; follow-up #1164 `24095765d` | gates the sign-in email build; now met |
| comms | new-device sign-in tables, token hook, session lever (NS-08-R21) | data-architect | MERGED in develop, NOT applied to hosted | #1176 `2c077e366` (head `90e72116`) | founder applies; applied state [U] |
| comms | ADRs 0036 PostHog only, 0037 Writing Tools, 0038 one phone two accounts | [U] | MERGED as PROPOSED | #1165 `638227e2a` | the founder decides |
| comms | security answers PR (NS-08-R21) | security-architect | NOT STARTED | | no PR open yet [U] |
| first-run | FP-17 hosted auth register | ops | MERGED | #1121 `204b39f4f` | |
| first-run | FP-12 NS-39 lock offer removed | mobile | IN REVIEW [blocked] | #1128 `098b7494` | |
| first-run | FP-9 Apple email-only scope | mobile | MERGED | #1125 `2584a89e0` (head `f847f074`) | 03:27Z |
| first-run | FP-16b owner check before Erase everything | mobile | IN REVIEW [blocked] | #1124 `9bd131e9` | |
| first-run | FP-18 purge worker NS-45 titles | qa | MERGED | #1120 `2bb7504cd` | |
| first-run | BL-922a held screen | mobile | MERGED | #1126 `8464ebd74` (head `1da68e6e`) | 03:03Z |
| first-run | BL-922b, BL-978a, then FP-6 | mobile | BL-922b IN REVIEW [unstable] #1167 `79712369`; BL-978a IN REVIEW [unstable] #1173 `208d626f`; FP-6 QUEUED | | in this order; BL-978 also after BL-961 (#879, 3 of 3, still IN REVIEW; #871 and #869 are the merged parts) |
| comms | new-device sign-in email (NS-08-R21, E83) | sync, security-architect | QUEUED | | privacy read of the device table is MERGED (#1152); tables are MERGED (#1176); words fix #1077 MERGED `801390297` |
| days, media (NS-46 to NS-52) | days store file foundation | mobile | IN REVIEW [unstable] | #1175 `9e058de1` | 400 lines (NS-47-R6, R11, R15, R16, R28); other code PRs NOT STARTED [U]; test support #1082 `c978eafb4` MERGED |
| reminders | BL-966c, planPending hook | mobile | IN REVIEW [unstable] | #1172 `de61aec8`, #1174 `1b6bf8c6` | BL-966 payments half is #1174 |

## Dispatch and dependency map (Karma, 20 Nov 2026, 23:58 UTC; moves marked 21 Nov 03:56 UTC)

Moved at 03:56 UTC: BL-922a #1126, FP-9 #1125, C9 #1144 and Find 6/8 #894 are MERGED. First-run lib queue: BL-922b #1167 and BL-978a #1173 are IN REVIEW, FP-2 #1159 is IN REVIEW (consent.ts first), FP-6 is QUEUED. B5 PR 2 #1169 is IN REVIEW; PR 3 NOT STARTED. Reminders: BL-966c #1172 and the planPending hook #1174 are IN REVIEW. Days: store file foundation #1175 is IN REVIEW (first code PR in group days). Group B new-device sign-in email: the privacy read (#1152) and the device tables (#1176) are MERGED; the security answers PR is NOT STARTED [U] and the email function is QUEUED. Find 7/8 #895 waits on the founder. Nothing is in group C.

Moved at 03:02 UTC: every "A (next)" task now has a PR open or merged (kill-switch #1113 and B5 PR 1 #1112 MERGED, C3 #1147 (MERGED 03:00Z), C9 #1144, FP-9 #1125, FP-12 #1128, FP-16b #1124, HG-MQ #1149) except B5 PR 2, 3 (NOT STARTED); FP-5 key is in #1113 and FP-2 is BUILDING; S1 and FP-1, FP-17, FP-18 and the CI scripts are MERGED; T1 and T3 and the test PRs are MERGED. B group: BL-922a is IN REVIEW (#1126) and heads the first-run lib queue; BL-966b is IN REVIEW (#1089), so the planner UI row waits only on 966a, which is MERGED. Nothing is in group C.

Rule: one builder per lane. A lane owns the path globs in `docs/agents/CLAIMS.md`; nobody else edits them. A task starts when everything in its "after" column is MERGED. Group A tasks share no files and no ordering, so they run in parallel now. Questions go to Karma as `<!-- req-question:<row id> -->` PR comments; Karma routes them to the owning seat and records the answer.

| Group | Task | Owner | After | Globs it owns | Source |
|---|---|---|---|---|---|
| A (now) | reminders BL-966a (MERGED #1088), then 966b (MERGED #1089) | mobile | none | `apps/mobile/src/lib/reminders/**` | brief R1, CR-69 A1 |
| A (now) | store reads #879 (#871 merged) | mobile | none | `apps/mobile/src/components/account/**`, `apps/mobile/src/lib/account-deletion/**` | HO-911 |
| A (now) | photo stack #835 to #840 | mobile | F1: S1 (MERGED #1115) and the plain statement [U]; #835 now `blocked`, no conflict | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | BL-931 |
| A (now) | Find #894 (MERGED), #895 (IN REVIEW, held for the founder) | mobile | none | `apps/mobile/src/lib/find/**` | BL-952 |
| A (now) | T1 guard #1068, BL-959 | sync | none | exact files: the sync-t1 row in `docs/agents/CLAIMS.md` | plan T1 |
| A (now) | T3 #1069, test PRs #1060 #1061 #1064 #1065 | qa | none | exact files: the qa-tests row in `docs/agents/CLAIMS.md` | quality catalogues |
| A (next) | kill-switch PR (signIn, libraryDays), MERGED #1113 | sync | none | `packages/api/src/kill-switches.ts` | CR-69 A5 |
| A (next) | B5 backup file PRs 1 to 3 (PR 1 MERGED #1112; PR 2 IN REVIEW #1169) | mobile | none | `apps/mobile/src/lib/backup/**` | BRIEF-B5 |
| A (next) | S1 photo policy migration, C3 audit writers, C9 grant drop | data-architect | none | `supabase/migrations/**` (new files), `supabase/tests/grants.mjs` | CR-71 |
| A (next) | CI proposals | ops | none | `docs/ops/proposed/**` | CR-69 A5, F3 |
| A (next) | first-run FP-1, FP-5, FP-17, FP-12, FP-9, FP-16b, FP-18 | mobile | none | `apps/mobile/src/components/onboarding/**` | 12-first-run-5.md section 2 |
| B | reminders planner UI, notification settings | mobile | 966a merged | `apps/mobile/src/components/settings/**` | plan |
| B | first-run lib queue BL-922a (MERGED #1126), BL-922b (IN REVIEW #1167), BL-978a (IN REVIEW #1173), then FP-6 | mobile | in this order (17b line 25); BL-978 also after BL-961 (E27; #879 still IN REVIEW) | `apps/mobile/src/lib/first-run/**` | 17b, plan 17 rows BL-922, BL-978 |
| wave 2 | BL-943 (after BL-966 a to c); BL-953 to BL-955 (after BL-931) | mobile | their predecessors | tbd at dispatch | plan 17 |
| B | new-device sign-in email | sync, security-architect | privacy read of the device table | `supabase/functions/**` (own function) | NS-08-R21, E83 |
| C | store build, TestFlight | founder go | all P0 lanes merged and green | none | founder only |
