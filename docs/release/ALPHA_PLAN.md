# Alpha plan: option B on TestFlight by Thu 29 Oct 2026

Status: proposed, Thu 15 Oct 2026. Owner: coordinator (delivery). Decision: D-106 (founder, 15 Oct: "I want to ship option B in the next 2 weeks: a proper app worthy of an alpha launch").

**The alpha** is a TestFlight build with server features on, against the staging Supabase project, for the founder's family and invited friends, target **Thu 29 Oct 2026**. App Store submission is re-planned after the alpha (D-106). Tokens are not a constraint; the founder's time is, so section 4 orders every founder step with a time and what it unblocks, and section 5 batches founder merges into one window a day.

How this file relates to the others:
- PRD V2 `docs/prd/v2/08-delivery.md` (on `origin/docs/prd-v2`, PR #124) stays the plan of record for the full v1.0 (submission in the week of Mon 3 May 2027, about 40% confidence). This file pulls forward only what the alpha needs. The biggest pull: the R-17 gate (08 T16, Fri 13 Nov) moves to **Mon 26 Oct** for the alpha.
- `docs/release/TESTFLIGHT.md` on `develop` is still the 4 Oct on-device page. PR #145 rewrites it for the two alpha builds with 12 numbered founder steps; this plan uses #145's step text and names its steps where they match.
- `docs/release/1.0.0.md` exists only on PR #108's branch (`docs/release-engineering-v2`). It still shows the on-device plan (C0 Wed 14 Oct, submit Mon 2 Nov). For dates, this file supersedes it until the post-alpha re-plan.
- `docs/FOUNDER_TASKS.md` (3 Oct, same on `develop` and `chore/agents-operating-system`) keeps the detailed clicks. No FT box is ticked, so nothing there is recorded as done.

Checked against origin on Thu 15 Oct at about 15:05 UTC: `develop` 56ec5b5 (#39 and #130 merged at 14:52 and 14:54 UTC, after 4183844), `main` 69299f8 (#133), `docs/prd-v2` dfdf3e7, `chore/alpha-release-config` b64d3ed, `chore/agents-operating-system` 0de8502, `docs/decisions-d089-d094` f59569b, `docs/release-engineering-v2` 06c0508; open pull requests read from the GitHub API at the same time. Labels: **[F]** fact checked on origin, **[A]** assumption with how we check it, **[E]** estimate, **[R]** recommendation.

Decision ids. The founder decisions of 13 to 15 Oct were drafted as D-089 to D-094 in PR #128 and renumbered D-100 to D-105, plus D-106 (the alpha), because #108 already uses D-089 to D-092 and #122 uses D-093 to D-099. This file uses the new numbers: **D-100** (server features on in v1.0, after the R-17 gate; #128's D-089), D-101 (full scope, date moves; D-090), D-102 (recoverable backup keys, honest copy; D-091), D-103 (free-letter counting; D-092), D-104 (three delivery defaults, proposed; D-093), D-106 (the alpha). [F] #128 was closed unmerged at 13:05 UTC on 15 Oct, and D-100 to D-106 exist only on branch `docs/decisions-d089-d094`, with no open PR; `develop` ends at D-088. The coordinator opens that PR today (section 3.4).

## 0. The short version

- **Today, Thu 15 Oct (1.25 hours):** F01 Apple Developer enrolment, F02 Expo account and `eas init`, F03 four one-word answers (section 4).
- **Your total:** about 34 hours over the 11 working days from Thu 15 to Thu 29 Oct, about 3 a day, including one merge window each weekday (45 to 60 minutes).
- **The dates that matter:** Apple Active by Mon 19 Oct (latest Fri 23 Oct); build 1 (servers off) Tue 20 Oct; R-17 batch merged Wed 21 Oct; first two-phone drill Fri 23 Oct; R-17 signed off Mon 26 Oct; backup drill and build 2 (servers on) Tue 27 Oct; features frozen Tue 27 Oct 12:00 UTC; go/no-go Thu 29 Oct.
- **If a gate fails on Thu 29 Oct:** the family keeps build 2, friends get build 1 (servers off), and the failed item gets a new date (section 6.2).

## 1. The alpha bar

### 1.1 What must be true on Thu 29 Oct

Each line is a go/no-go item in section 6. "Build 2" is the servers-on build against staging.

| # | Must be true | Proof | Streams |
|---|---|---|---|
| 1 | **Sign-in works**: Sign in with Apple, and email by link and by typed code, on build 2 against staging. Local letters join an account only after the claim screen with the masked email (BL-347) | `docs/ops/AUTH_SETUP.md` section 11 items 1, 3, 4, 5, 6 recorded on build 2 | S01, S20 |
| 2 | **Two-phone sync**: letters, edits, deletes and restores reach the other phone; an offline edit syncs on reconnect; a words conflict keeps both versions and loses neither (F16-REQ-010, F16-REQ-023) | Device row S1-22 on two iPhones; `apps/mobile/test/sync-two-phone.test.ts` green (#146) | S03, S02 |
| 3 | **Invite and join**: the second parent joins by link and by code; the join screen asks first with nothing preselected; a third parent sees "This book already has two parents"; leave and remove work (BL-322, D-069) | Device row S1-09 with a family member's iPhone as the second parent | S04, S02 |
| 4 | **Encrypted backup and the restore drill passed**: B6-01 to B6-04 of `docs/qa/BACKUP_RESTORE_DRILL.md` (#150): zero plaintext in any upload, a kill mid-upload resumes, restore on the second phone with equal hashes. The escrow function is deployed to its own project and answers its two checks; B6-06 shows the request email | Drill evidence file | S05, S07 |
| 5 | **Plus in the sandbox**: `plus.monthly` and `plus.annual` load on the `.preview` record; buy, restore and manage work; the Keep gate counts only your own letters with words (D-103) | StoreKit checks D-1 to D-12 (`docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11) on build 2 | S06 |
| 6 | **Speech packs hosted and words arriving**: a signed manifest is served from `packs.earlyletters.app`; a spoken English letter gets its words on the SE 3 and on the current iPhone, in both builds; the download asks first (#104) | Device row with time to words on each phone | S08, S07 |
| 7 | **Legal pages live, in holding or final form**: `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/delete-account` on earlyletters.com, matching the policy versions published on staging; nothing claims more than build 2 does | `curl` of each URL; the versions on staging | S17, legal gate, S20 |
| 8 | **The experience pass is in for the core journey**: every P0 line of the experience spec for J1 to J8 below is merged and seen on build 2 | Spec checklist at 100% for P0 lines; critics' sign-off on build 2 screens | Experience critics, S10 to S16 |
| 9 | **No data loss in the 500-kill test**: DL-01 (kill mid-record) and DL-02 (kill during save), 500 of 500 kept each on the iOS Simulator from the freeze commit, and 50 of 50 each on the SE 3 with build 2 (F04-REQ-024; `docs/qa/DEVICE_TEST_PLAN.md`) | Harness report and SE 3 evidence | S19, S10 |
| 10 | **R-17 passed before anyone outside the family signs in** (D-100, drafted as D-089): BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merged; one shared security review signed; `npm run test:db` green against staging; every migration on staging through the `develop` workflow | The signed checklist (`docs/security/REVIEW_R17_CHECKLIST.md`, on #140) and a decision entry | S01, S02, S04, S20 |

The core journey for item 8: **J1** first run (18+, the promise, a child, signature, language, the speech download ask); **J2** Tonight, speak, finish; **J3** Review and Keep (with the Keep sheet at the third own letter); **J4** type a letter; **J5** the Book, a letter page, playback; **J6** sign in at Welcome and at Keep; **J7** Family: invite, join on the second phone; **J8** Settings: Back up my recordings, Delete account, Export.

### 1.2 Should have, not a go/no-go item

- The status report and reminder emails (D-080) on staging behind `EXPO_PUBLIC_STATUS_REPORT`, if S06 lands them by Mon 26 Oct. Otherwise the flag stays off in build 2.
- Escrow restore after the hold (B6-06 to B6-08), if the approval path lands. The alpha needs only the request and its email.
- Spanish, French, Arabic and Portuguese words (they use the same hosted model as English; their packs publish in F13). Hindi and Chinese need models we host ourselves (`hosted: false` in `apps/mobile/src/lib/models/catalog.ts` on #126) [F].

### 1.3 Not in the alpha

- Push notifications (WP-F11-09: APNs key, `push-send`). Co-parent invites travel by link and code.
- Android, iPad layouts, print.
- Anything PRD V2 marks P1 (`05-feature-map.md` section 2, `08-delivery.md` section 6.4): the widget, search, offered fillers, "say the name three times", QR invites, app lock, the insights run, Sentry, forget-without-account, picking reminder evenings, Apple's rating request. Read together (F10, P1) stays in the build as it is, with no alpha work, and is no go/no-go item.
- Also later than the alpha, though P0 for v1.0: Google sign-in (FT-15), analytics of any kind (`EXPO_PUBLIC_ANALYTICS=off`, #118 and #125), the AB 1043 age signal (in force Fri 1 Jan 2027), the production project, an external TestFlight link, and App Store submission.

## 2. Day by day, Thu 15 to Thu 29 Oct

### 2.1 The builds

| Build | Profile (#145) | Servers | Backup | Who | Target |
|---|---|---|---|---|---|
| **Build 1** | `testflight` | off | off | Family and Friends | Tue 20 Oct, as soon as Apple and Expo exist (F01, F02, F08) |
| Rehearsal R1 | `preview` | on (staging) | off | Founder's own two phones only (internal group "Founder") | Fri 23 Oct, for drill 1 |
| Rehearsal R2 | `preview` | on | on (flag PR Mon 26) | Founder's own two phones | Mon 26 Oct evening, for the backup drill on Tue 27 |
| **Build 2** | `preview` | on | on | Family on Tue 27 Oct; Friends on Thu 29 Oct after go/no-go | Tue 27 Oct, from the freeze commit |
| Build 2.1 | `preview` | on | on | as build 2 | Only for an S0 or S1 fix; cut-off Wed 28 Oct 18:00 UTC |

Rehearsal builds go to the founder only, so D-100's rule (nobody outside the family signs in before R-17) holds. Friends never get a servers-on build before the R-17 sign-off. The EAS Free plan allows 15 iOS builds a month (D-092 on #108) [F]; the alpha uses 5 to 7 [E].

### 2.2 The calendar

"Window" is the founder's daily merge window (section 5.3). Founder steps F01 to F27 are in section 4.

| Day | What lands (agents, coordinator) | Founder | Founder hours [E] |
|---|---|---|---|
| **Thu 15 Oct** | This plan. Coordinator opens the D-100 to D-106 decisions PR and dispatches S06 and S19 (section 3.2). S20 opens the project-id PR (after F02), the "staging from `develop`" workflow PR and the BL-349 privacy manifest PR. S01 and S02 take #139 and #140 out of draft. The experience critics finish spec v1 | F01, F02, F03 | 1.25 |
| **Fri 16 Oct** | Experience spec v1 merged (coordinator, docs). S08, S09, S16 dispatched, and S10 to S15 from the spec. S07 takes #138 out of draft. S16 starts the server-on copy delta | F04, F05, F06, F07. Window 1: #125, #126, #145 (in that order; #145 carries both), the project-id PR, #136, the decisions PR | 3.4 |
| Sat 17, Sun 18 Oct | S02 writes WP-F16-14 (sync v1 server) and WP-F16-17 (held drafts). S05 and S07 settle one wire contract across #150, #151 and #138. S19 builds the kill harness. A security review agent starts the shared R-17 review on a scratch merge of #139, #140, #148 and the BL-349 PR. Screen packages start | none (optional: F09 now to gain a day for words) | 0 |
| **Mon 19 Oct** | R-17 review findings back to S01, S02, S04 and S20. First screen-package PRs and the licences PR (coordinator merges) | F08 (if Apple is Active), F09. Window 2: #108, #122 (decision logs), #135 (verifier; CODEOWNERS), #134 and the web brand mark (`main`) | 4.0 |
| **Tue 20 Oct** | S07 keys PR (the two public lines in `packages/api/src/keys.ts`). The shared R-17 review signed on the scratch merge. **Build 1** | F10, F11, F12. Window 3: keys PR, #138 | 3.75 |
| **Wed 21 Oct** | **R-17 batch merges as one**: #140, #139, #148, the BL-349 PR, with the S20 staging workflow. S19 kill harness merged | F13, F14. Window 4 (60 min): staging workflow, #140, #139, #148, BL-349 | 3.25 |
| **Thu 22 Oct** | #146 sync merged (coordinator). S03's v7 PR. S02 WP-F16-14. S16's server-on copy delta. Nightly 500-kill runs start on `develop` | F15, F16 (after the window), F17. Window 5: S02 WP-F16-14 and held drafts, #144 (`main`), S16 claim lines | 3.0 |
| **Fri 23 Oct** | Backup: #151 and #150. S06 Keep gate. Rehearsal R1 | F18, F19 (drill 1). Window 6: #151, #150, S06 Keep gate | 4.0 |
| Sat 24, Sun 25 Oct | Fixes from drill 1. Screen packages. Nightly kill runs | none (optional: the SE 3 50-kill subset with a helper) | 0 |
| **Mon 26 Oct** | **R-17 sign-off.** S20 backup flag on in `preview` with the escrow URL; S07 drill escrow public key; legal gate on `main`; fixes. Rehearsal R2 in the evening | F20, F21, F22. Window 7 (60 min): fixes, backup flag PR, escrow key PR, legal gate PR | 3.5 |
| **Tue 27 Oct** | **Features frozen at 12:00 UTC.** 500-kill gate run on the freeze commit overnight. Critics review build 2 screens. **Build 2** to Family | F23 (backup drill), F24. Window 8: last fixes | 3.75 |
| **Wed 28 Oct** | Fixes only; build 2.1 only for an S0 or S1 fix (cut-off 18:00 UTC) | F25, F26. Window 9 | 3.5 |
| **Thu 29 Oct** | **Go/no-go**, then Friends get build 2 | F27. Window 10 (fixes only) | 1.0 |

### 2.3 If Apple is late

F08, F11, F12, F14 and F15 need Apple directly, and every build and drill after them waits on F08; F02 to F07, F09, F10, F13, F16 and F18 run without it.
- **Apple Active by Wed 21 Oct:** do F08 and F11 the same day, and build 1 the next day. The plan holds; Plus in the sandbox (F14) gets tight because of Apple's bank and tax checks.
- **Active Thu 22 or Fri 23 Oct:** build 1 on Mon 26 Oct. Rehearsal R1 moves to Mon 26 and R2 to Tue 27, build 2 to Wed 28. Plus in the sandbox becomes likely to fail item 5.
- **Not Active by Fri 23 Oct:** the alpha moves day for day. There is no substitute for a phone build.

## 3. Streams

Every stream edits only its globs. Globs follow `08-delivery.md` section 3.3 unless a row says otherwise. Files one stream owns for everyone (08 section 4) change by request in the PR body. "Coordinator" in the merge column means the D-106 delegation in section 5.1, once the founder says yes; until then it means founder.

### 3.1 Running now

| Stream | Branch and PR on origin [F] | Owns (globs) | Alpha deliverable | Due | Merge |
|---|---|---|---|---|---|
| Harness landing (coordinator agent) | `chore/agents-operating-system` 0de8502 (no PR); #39 merged 15 Oct; #42, #112, #137 open | `.claude/**`, `agents/**`, `scripts/agents/**`, `docs/agents/**`, `docs/engineering/**`, `docs/release/HARNESS_SETUP.md`, `.github/workflows/{agents,agents-check,claude}.yml` (BOARD claim); `.github/CODEOWNERS` and `CLAUDE.md` by proposal only | Harness landed or parked; it takes no slot in a founder window | Fri 16 Oct | Coordinator; CODEOWNERS and CLAUDE.md founder |
| Merge train (coordinator) | none (merges only) | No files. Renames migration files to the next free timestamp at merge (08 section 4) | Other sessions' PRs merged in the order of section 3.3; #129 and #131 held (section 3.4) | daily | as the PR's class |
| Packs hosting | #126 `chore/pack-host-ios17` cc224f2; pipeline branch `feat/packs-hosting-pipeline` not on origin | `apps/mobile/src/lib/models/catalog.ts`, `scripts/packs/**`, `docs/ops/{DOMAINS,README}.md` section 6 and fact row, `apps/mobile/test/hosting-ios17.test.ts`; its `eas.json`, `app.config.ts`, `package.json` lines once | `packs.earlyletters.app` in every profile; iOS 17 target; publish pipeline for F13 | Fri 16 Oct | Founder (release config) |
| Coverage | `test/port-wave-coverage` 2da998d (no PR); `qa/coverage-baseline` not on origin | New test files only under `packages/*/test/**` and `apps/mobile/test/**`, `*/vitest.coverage.config.ts`, `scripts/coverage/**`, `docs/qa/COVERAGE.md` | Baseline; not an alpha gate | Fri 23 Oct | Coordinator (test-only) |
| Legal gate on `main` | `fix/web-legal-live-gate` not on origin | `apps/web/src/app/(legal)/**`, `apps/web/src/components/site/Legal*.tsx`, `apps/web/src/lib/legal/**`, `apps/web/test/legal.test.ts`, `docs/ops/WEBSITE_RUNBOOK.md` | A legal page shows a version only when it is marked publishable, else a holding page (item 7) | Mon 26 Oct | Founder (legal text goes public) |
| Website rework for option B | #105 `feat/web-home-restructure` (conflicts with `main`) | `apps/web/src/components/landing/**`, `apps/web/src/scenes/**`, `apps/web/src/app/page.tsx`, `apps/web/src/app/signup/**`, `docs/web/**` | Home page copy true for option B and the alpha; not an alpha gate | after Thu 29 Oct | Founder (public site) |
| Legal set (S17) | #136 `docs/legal-counsel-delta-m14` f0e8f69 | `docs/legal/**` | COUNSEL_PACKET 1.1.0 for F07; the texts the legal pages show | Fri 16 Oct | Founder |
| S01 auth gate | #139 `feat/auth-v1-gate` (draft) | 08 S01 row: `apps/mobile/src/lib/{auth,supabase}/**`, `apps/mobile/src/app/(auth)/**`, `+native-intent.tsx`, `supabase/functions/apple-token/**`, `supabase/templates/**`, `docs/ops/AUTH_SETUP.md`, `docs/security/**` except `REVIEW_R17_CHECKLIST.md` | BL-347, BL-330; the J6 screens from the experience spec | Wed 21 Oct | Founder |
| S02 database gate | #140 `feat/db-v1-gate` (draft) | `supabase/migrations/**` (S02 files), `supabase/tests/**` except `audio_backup*` and `subscription_status*`, `supabase/APPLY.md`, `supabase/cron/**`, `supabase/config.toml`, `docs/security/REVIEW_R17_CHECKLIST.md` | BL-331 with BL-332, `peek_invite` with BL-334, WP-F11-01, wire-contract columns; then WP-F16-14, WP-F16-17, WP-F04-14 | Wed 21 Oct; Thu 22 for the sync server | Founder |
| S07 contracts | #138 `feat/platform-v1-contracts` (draft) | 08 S07 row: `packages/api/**`, `supabase/functions/{_shared,config,content,purge-worker,analytics-forget,invite-redeem}/**`, `apps/mobile/src/lib/remote/**`, `scripts/packs/**` after #126, `scripts/ops/**`, `docs/ops/**` except the files another row in this table names | Contracts for sync v1, family, recovery key; the keys PR (Tue 20); the drill escrow key (Mon 26); kill-switch keys | Tue 20 Oct | Founder |
| S05 backup | #151 `feat/backup-server`, #150 `feat/backup-client` | 08 S05 row: `apps/mobile/modules/scribe-keys/**`, `apps/mobile/src/lib/backup/**`, `apps/mobile/src/app/settings/{backup,recordings}.tsx`, `supabase/functions/escrow/**`, its migration file, `supabase/tests/audio_backup*`, `packages/content/src/features/backup.en.ts`, `docs/ops/BACKUP_RUNBOOK.md`, `docs/qa/BACKUP_RESTORE_DRILL.md` | Server, escrow function, client behind `capabilities.backup`; the drill run sheet | Fri 23 Oct | Founder |
| S20 release config and web auth wiring | #145 `chore/alpha-release-config`, #144 `chore/web-auth-wiring` (`main`) | 08 S20 row: `.github/**` except the harness workflows, `apps/mobile/{eas.json,app.config.ts,package.json}`, root `package.json` and lockfile, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/lib/{capabilities,build-env}.ts`, `apps/mobile/scripts/**`, `docs/release/**` except `journey/**` and this file, `docs/ops/{DEPLOY,APP_SIZE,RELEASE,ENVIRONMENTS}.md`; on `main`: `apps/web/src/app/{auth,.well-known}/**` | Two profiles; project id; staging from `develop`; BL-349; the backup flag in `preview` | Fri 16 Oct, then Wed 21 and Mon 26 | Founder |
| S03 sync | #146 `feat/sync-v1-alpha`; v7 branch `feat/sync-v7-child-prefs` not on origin | 08 S03 row: `apps/mobile/src/lib/{db,sync}/**`, `apps/mobile/src/lib/store.ts`, `apps/mobile/test/{migrations,store.*,sync-*}.test.ts`, `apps/mobile/test/helpers/{node-db,store-fixture,sync-v1-standin}.*` | Local v6 and v7, protocol v1 on the phone, the two-phone test | Thu 22 Oct | Coordinator, with a durability reviewer (section 5.1) |
| S04 co-parent | #148 `fix/family-bl-322-invite-consent`; `feat/coparent-alpha` not on origin | 08 S04 row: `apps/mobile/src/lib/family/**`, `apps/mobile/src/components/family/**`, `apps/mobile/src/app/{invite,join}/**`, `apps/mobile/src/app/(tabs)/{family,_layout}.tsx`, `packages/core/src/{invite,family-rules}.ts` and tests, `packages/content/src/features/family.en.ts` | BL-322 (R-17), WP-F11-03; the J7 screens | Wed 21 Oct | In the R-17 batch (founder signs the batch) |
| Experience pass: critics and spec | none on origin yet | `docs/design/experience/**` (new; S15 keeps the rest of `docs/design/**`) | Spec v1 with a P0 checklist per screen for J1 to J8; review of build 2 screens | Fri 16 Oct; review Tue 27 Oct | Coordinator (docs) |
| App icon | #130 merged to `develop` 15 Oct 14:54 UTC [F] | done | The approved r3 mark ships in build 1 | done | done |
| Licences | `fix/licence-notices` not on origin | `apps/mobile/src/generated/licences.json`, `apps/mobile/src/lib/licences.ts`, `apps/mobile/test/licences.test.ts`, `scripts/licences/**` | Every bundled library's notice in Settings, Licences | Mon 19 Oct | Coordinator |
| Hygiene | #132 `chore/repo-hygiene-oct15` | `.gitignore`, `docs/release/journey/**`, `docs/brand/archive/**`, stale notes it names; its `CLAUDE.md` lines by proposal | Repo hygiene; not an alpha gate | after Thu 29 Oct | Founder for `CLAUDE.md`, else coordinator |
| Price hotfix | #133 merged to `main` 15 Oct (69299f8) [F]; the claims follow-up #134 conflicts with `main` | `apps/web/src/content/**`, `apps/web/test/public-claims.test.ts` | Done for prices; #134 removes the remaining untrue claims | #134 Mon 19 Oct | Founder (public site) |
| Web brand mark | `fix/web-brand-mark` not on origin | The site header mark under `apps/web/src/components/site/` (not `Legal*`) and its assets | The approved mark on the site | Mon 19 Oct | Founder (public site) |

### 3.2 To dispatch

Each brief uses the common header in `08-delivery.md` section 9, with base `origin/develop` and this file as the alpha scope.

| Stream | Dispatch | Owns (globs) | Alpha scope | Due | Merge |
|---|---|---|---|---|---|
| **S06 Plus and status report** | Thu 15 Oct | 08 S06 row: `apps/mobile/src/lib/billing/**`, `apps/mobile/modules/scribe-store/**`, `apps/mobile/storekit/**`, `apps/mobile/src/components/plus/**`, `apps/mobile/src/components/child/plus-gate.tsx`, `apps/mobile/src/app/settings/plus.tsx`, `packages/core/src/plan-notices.ts`, `packages/core/test/plan*.test.ts`, `packages/content/src/{pricing.ts,features/billing.en.ts,emails/billing.en.ts}`, `supabase/functions/{subscription-status,plan-reminders}/**` after #138 merges | WP-F14-20 Keep gate in the app (from branch `feat/plus-bl-342-m17-ledger`, #149 closed), on #146's ledger query; StoreKit on the `.preview` record; then the status report behind its flag (section 1.2) | Fri 23 Oct (Keep gate), Mon 26 Oct (status report, if at all) | Founder (payments) |
| **S19 QA and device evidence** | Thu 15 Oct | 08 S19 row: `apps/mobile/e2e/**` (new `e2e/kill/**`), `apps/mobile/e2e-web/**`, `apps/mobile/src/dev/**`, `docs/qa/**` except other streams' evidence files, `scripts/{trace,leak-surfaces}.mjs`, `scripts/load/**`, `docs/TRACE.md`; #143 is S19's BL-002 | The DL-01 and DL-02 kill harness on a macOS runner (workflow file by request to S20); run sheets for F19, F23, F25; one evidence file per session; the go/no-go evidence index | Harness Wed 21 Oct; 500 runs Tue 27 Oct | Coordinator (tests, docs) |
| **S08 speech gate tooling** | Fri 16 Oct | 08 S08 row: `apps/mobile/src/app/settings/{storage,language}.tsx`, `apps/mobile/src/lib/{transcribe*,model-files}.ts`, `apps/mobile/src/lib/{transcription-queue,models,packs,language,audio-enhance}/**` (catalog after #126), `apps/mobile/modules/scribe-audio/**`, `apps/mobile/src/components/{speech,language}/**`, `experiments/**`, `packs/**`, `packages/content/src/features/{speech,language,packs}.en.ts` | WP-F05-02 gate tooling, WP-F05-01 clamp; check the signed manifest path end to end; time to words on the SE 3 and the current iPhone (item 6) | Thu 22 Oct | Coordinator; `modules/**` founder |
| **S09 engine gates** | Fri 16 Oct | 08 S09 row: `packages/core/src/{verify,meaning,protect,types,pipeline,rules,punctuation,text,repeats,model-edits,edit-provider,frozen,domain,index}.ts`, `packages/core/src/lang/**`, `packages/core/test/**` except other streams' files | #135 (WP-F06-02) merged; the R-01 English gate on the freeze commit; the Hermes Unicode check on R1 (WP-F06-01 device part). No engine change after Wed 21 Oct except fixes | Fri 23 Oct | Founder for the five CODEOWNERS files |
| **S10 Capture and Tonight** | Fri 16 Oct, from the spec | 08 S10 row: `apps/mobile/src/app/{listen,write}.tsx`, `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/src/lib/capture/**`, `apps/mobile/src/components/capture/**` except `transcript.tsx`, `apps/mobile/src/{lib,components}/resilience/**`, `packages/core/src/{capture,backdate}.ts` | J2, J4; with S19, any fix DL-01 or DL-02 finds | Tue 27 Oct 12:00 UTC | Coordinator |
| **S11 Review and names** | Fri 16 Oct | 08 S11 row: `apps/mobile/src/app/review.tsx`, `apps/mobile/src/components/{review,dictionary}/**`, `apps/mobile/src/components/capture/transcript.tsx`, `apps/mobile/src/lib/review/**` | J3; the gate call change in `review.tsx` for D-103 on S06's request (#146 asks) | Tue 27 Oct 12:00 UTC | Coordinator |
| **S12 First run and entry** | Fri 16 Oct | 08 S12 row: `apps/mobile/src/app/{onboarding,welcome,+not-found}.tsx`, `apps/mobile/src/lib/age-gate*.ts`, `apps/mobile/src/components/{gate,first-run}/**` | J1, and the Welcome side of J6 (sign-in screens stay S01's) | Tue 27 Oct 12:00 UTC | Coordinator |
| **S13 Book and letter** | Fri 16 Oct | 08 S13 row: `apps/mobile/src/app/(tabs)/book.tsx`, `apps/mobile/src/app/letter/**`, `apps/mobile/src/components/{book,player,export,child}/**` except `plus-gate.tsx`, `apps/mobile/src/lib/{player,export}/**` | J5; the conflict note on the letter page (#146 request) | Tue 27 Oct 12:00 UTC | Coordinator |
| **S14 Settings and deletion** | Fri 16 Oct | 08 S14 row: `apps/mobile/src/app/settings/{index,_layout,privacy,appearance,reminders,delete-account,recently-deleted}.tsx`, `apps/mobile/src/components/settings/**`, `apps/mobile/src/lib/{reminders,account-deletion}/**` | J8 except the backup row (S05) and Plus (S06); Delete account works on build 2 | Tue 27 Oct 12:00 UTC | Coordinator |
| **S15 Design system** | Fri 16 Oct | 08 S15 row: `packages/design-tokens/**`, `apps/mobile/src/components/{ui,motion,platform}/**`, `apps/mobile/src/lib/{motion,a11y}*.ts`, `docs/design/**` except `experience/**` | Shared components the spec names, first, so S10 to S14 adopt them in their own PRs; AX5 and VoiceOver review of every UI PR | Tue 20 Oct for components | Coordinator |
| **S16 Copy** | Fri 16 Oct | 08 S16 row: `packages/content/**` except the feature files above, `packages/brand/**`, `packages/emails/**`, `docs/store/**`, `docs/support/**` | The server-on copy delta (no "stays only on this phone" in build 2; backup lines per D-102); the sync conflict strings (#146); review of the backup emails (#151); the two "What to test" texts | Thu 22 Oct for the server-on delta; Mon 26 Oct for the rest | Claim lines founder; other copy coordinator |

### 3.3 Overlaps and merge order

Open PRs that touch the same files today [F]. The later PR rebases; the owner reviews the hunk in its area.

| Path | PRs | Order and rule |
|---|---|---|
| `apps/mobile/{eas.json,app.config.ts}`, `scripts/packs/**` | #125, #126, #145, #138 | #125, #126, #145 (it carries both), then #138 rebases |
| `apps/mobile/src/lib/capabilities.ts` | #145 (S20 adds `backup`, `statusReport`), #150 (S05 adds `backup`) | #145 first; #150 uses #145's flag and drops its own |
| `supabase/functions/purge-worker/**` | #138 (S07), #151 (S05) | #138 first; S07 reviews #151's purge-worker hunks |
| `supabase/functions/subscription-status/**` | #138 | S06 owns it after #138 merges |
| Root `package.json` (`test:functions` and test lines) | #138, #139, #143, #151 | S20 takes the union at merge |
| `docs/adr/0023-*` | #139 (email links), #146 (sync v1), #150 (owner backup) | The coordinator numbers ADRs at merge with `scripts/agents/next-id.mjs` (#137) |
| Wire contract for backup (`backup_register_device`, `backup_store_key`, escrow routes) | #138, #150, #151 disagree on names and shapes | S05 (both halves) and S07 settle one contract by Mon 19 Oct, before either merges |
| `apps/web/src/content/site.ts`, `components/landing/**`, `scenes/**` (`main`) | #134, #144, #105 | #134, then #144, then #105 rebased for option B |
| `apps/mobile/e2e-web/support/**` | #132 | S19 reviews |
| `packages/emails/**`, `packages/content/src/emails/**` | #151 | S16 reviews (requested in #151) |

### 3.4 Repo facts that change the plan

- **Decisions are not on `develop`.** D-100 to D-106 live only on `docs/decisions-d089-d094` (#128 closed unmerged). D-089 to D-092 are on #108 and D-093 to D-099 on #122, both open. The coordinator opens a PR for D-100 to D-106 today; the founder merges all three in windows 1 and 2.
- **Copy PRs written for an on-device v1.0** contradict D-100: #129 (store listing) and #131 (website copy source) say "no account" and "no sharing"; #105 says "Your letters stay on your phone". The merge train holds #129 and #131; S16 and the website rework redo them for option B after the alpha.
- **Staging gets no migrations from `develop` today**: `.github/workflows/deploy-db.yml` runs on a push to `main` or a `db-v*` tag only [F]. The S20 workflow PR (fenced) must merge in window 4 before F16.
- **Nothing has run on a phone**, and the Swift module `scribe-keys` has never been compiled (#150). Build 1 on Tue 20 Oct is the first native build; R1 on Fri 23 Oct is the first servers-on one.
- **Signing keys are empty** (`TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts`) and `app.config.ts` has no `extra.eas.projectId` [F]. Both need founder steps (F09, F02).
- **`develop` has no branch protection** (API: "Branch not protected") and the repo is public [F]. The fence in section 5.2 is therefore a rule the coordinator keeps, not a GitHub setting, until FT-20.

## 4. Founder steps, in order

Times are your hands-on time [E], from `docs/release/TESTFLIGHT.md` on #145, `docs/FOUNDER_TASKS.md` and `docs/ops/BACKUP_RUNBOOK.md` on #151. Waits are not yours. Never paste a secret into a chat, an issue, the repo or an email; secrets go to the vendor's secret store and your password manager only.

| # | Day | Step | Yours | Wait | Needs | Unblocks |
|---|---|---|---|---|---|---|
| F01 | Thu 15 Oct | **Apple Developer Program enrolment** as an individual, with your two-factor Apple Account; when it says Active, accept the agreements (FT-01; TESTFLIGHT step 1) | 45 min | Apple's identity check, often 1 to 2 days [A] | none | F08, F11, F12, F14, F15: every Apple step and both builds |
| F02 | Thu 15 Oct | **Expo account** with two-factor; `npx eas-cli@latest login`, `npx eas-cli@latest init` in `apps/mobile`; send the project id it prints; optional `EXPO_TOKEN` GitHub secret (FT-17, BL-339; step 3) | 20 min | none | none | S20's project-id PR (window 1), then every EAS build |
| F03 | Thu 15 Oct | **Four one-word answers**: (1) D-106 delegation of app code (section 5.1): yes or no; (2) D-104 item 2, backup free for everyone; (3) D-104 item 3, voice-only letters count only once kept with words; (4) Q3, may agents push their own branches and open PRs | 10 min | none | none | The merge policy; dispatch of section 3.2 |
| F04 | Fri 16 Oct | **Supabase staging**: organisation with two-factor; project `scribe-staging` in us-west-1 (Pro recommended, risk 7); spend cap on; the session pooler URL as the GitHub Environment `staging` secret `SUPABASE_DB_URL_STAGING`; make the consent pepper (`openssl rand -hex 32`) and keep it in the password manager (FT-10; `docs/ops/DEPLOY.md` founder steps 1 and 2; step 6) | 1.5 h | none | none | F06, F10, F16; staging receives migrations |
| F05 | Fri 16 Oct | **Resend**: `earlyletters.com` Verified; click and open tracking off; key 1 `supabase-auth-smtp`, sending only (FT-13; AUTH_SETUP 4.1) | 30 min | none | none | F10 (sign-in email) |
| F06 | Fri 16 Oct | **EAS environment variables**, environment `preview`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable key only, never `service_role`), `EXPO_PUBLIC_EMAIL_OTP_LENGTH` only if not 6 (step 9). F20 adds `EXPO_PUBLIC_ESCROW_URL` | 10 min | none | F02, F04 | Builds R1, R2 and 2 reach staging |
| F07 | Fri 16 Oct | **Send counsel COUNSEL_PACKET 1.1.0** (#136, merged in window 1) with one ask: comments on the alpha subset (Privacy Policy, Terms 6.2 and 12.4, Consumer Health Data notice, in-app disclosures, the backup lines) by Tue 27 Oct (FT-18) | 30 min | Counsel | #136 merged | Legal pages in final form (item 7); risk 4 |
| F08 | Mon 19 Oct, or the day Apple is Active | **App Store Connect**: register `com.earlyletters.scribe.preview` with Sign in with Apple and Associated Domains; note the Team ID; app record "Early Letters Preview"; add the family as users; groups "Founder", "Family", "Friends", automatic distribution off (FT-07, FT-08; step 2.1 to 2.3) | 45 min, plus 5 min a tester | Testers accept an email | F01 | F11, F12, F14, F15 |
| F09 | Mon 19 Oct (or Sat 17) | **Cloudflare and the pack host**: `earlyletters.app` zone (Free plan), its records recreated, nameservers switched at Porkbun, DNSSEC on; R2 bucket with custom domain `packs.earlyletters.app`; `npx tsx scripts/packs/keygen.ts` twice; the secret halves only in the password manager; send the two public lines (FT-16, D-097; step 4; #126 founder steps) | 2.5 h | DNS, up to a day [A] | #126 merged | S07 keys PR (Tue 20), F13, item 6, signed config and kill switches |
| F10 | Tue 20 Oct | **Supabase Auth on staging** with Resend SMTP: AUTH_SETUP sections 1, 4, 5.1, 6 with #145's alpha notes (OTP length equal to the app's, expiry 900 seconds, redirect URLs including `/auth/confirm`, both templates) (FT-12; step 7) | 1.5 h | none | F04, F05 | Email sign-in (item 1) |
| F11 | Tue 20 Oct | **Sign in with Apple**: the key (`.p8`, downloadable once) with its Key ID and your Team ID in the password manager; email relay for `earlyletters.com`; Supabase Apple provider with `com.earlyletters.scribe.preview` in Client IDs (FT-07 2.4 and 2.5, FT-12 2.6; step 8) | 45 min | none | F04, F08 | Apple sign-in (item 1); F17 |
| F12 | Tue 20 Oct | **Build 1**: `npm run preflight:testflight -w @scribe/mobile`, build `testflight`, submit; add it to "Family" and "Friends" (FT-25; step 5) | 45 min | EAS queue and Apple processing, an hour or more [A] | F01, F02's PR, F08; the keys PR for words | Testers on build 1 |
| F13 | Wed 21 Oct | **Publish the signed documents**: `npx tsx scripts/packs/publish.ts all` and the upload commands it prints (FT-16 step 5) | 30 min | none | Keys PR merged, F09 DNS live | Words in both builds (item 6) |
| F14 | Wed 21 Oct | **Plus in the sandbox**: Paid Apps agreement, tax and bank (Account Holder); `plus.monthly` and `plus.annual` on the `.preview` record; three sandbox testers (FT-06, FT-09; step 2.4) | 1 h 45 min | Apple's bank and tax checks, a day or more [A] | F08 | Item 5 |
| F15 | Thu 22 Oct | **Website links**: Vercel Production `APPLE_TEAM_ID` and `IOS_BUNDLE_ID=com.earlyletters.scribe`; #144 merged to `main` in window 5; the two `curl` checks (step 10) | 15 min | Apple's CDN, up to a day [A] | F08 (Team ID) | Sign-in and invite links open the app |
| F16 | Thu 22 Oct, right after window 5 | **Staging migrations**: allow `develop` on the `staging` Environment; run the staging workflow with the `approve-migration` label for everything merged on Wed 21 and Thu 22; then set the pepper (APPLY step 6), the purge cron (7), publish the beta policy versions `terms` and `sensitive-data` (8), settings with statement logging off (15); tell the coordinator which files ran (FT-10; step 6) | 1 h | Workflow run, minutes | F04; S20 workflow and the R-17 batch merged Wed 21; window 5 | Sign-in completes; R1; the R-17 "test:db green against staging" |
| F17 | Thu 22 Oct | **Staging function secrets and deploys**: `PURGE_WORKER_SECRET`, `RESEND_API_KEY` (key 2, sending only: the purge worker now, the status emails later), `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY`, `TOKEN_KEK_V1`; deploy `apple-token`, `purge-worker`, `config`, `content`; schedule the purge worker (FT-11; step 12) | 1 h | 20 min for the purge check | F11, F16; #138 and #139 merged | Delete account; Apple token capture (BL-330); status emails later |
| F18 | Fri 23 Oct | **Escrow, part 1**: main project asymmetric JWT keys (runbook B2); the separate escrow project for staging (B4; name it `scribe-escrow-staging` so `scribe-escrow` stays free for production [R]); the drill-key ceremony K1 to K7 on an offline computer, drill key only; send the drill public key | 1.25 h | none | F04 | F20; restore through escrow |
| F19 | Fri 23 Oct | **Drill 1 on R1**: build `preview` for your two phones ("Founder" group); then AUTH_SETUP section 11 items 1, 3 to 6; two-phone sync S1-22; invite and join S1-09 with a family member's iPhone as the second parent, from S19's run sheet | 2 h | EAS queue | F06, F10, F11, F16, F17 | Fixes before the gate; evidence for items 1 to 3 |
| F20 | Mon 26 Oct | **Staging batch 2 and escrow, part 2**: the staging workflow for #151 and anything else merged since F16; runbook B3 (`escrow_svc` login), B5 (secrets, including Resend key 3 for the escrow project alone), B6 (deploy `escrow` to the escrow project only, and its two checks), B7 (switches); `EXPO_PUBLIC_ESCROW_URL` in EAS `preview`; start the R2 build after window 7 | 1.25 h | none | F18; #151 and #150 merged Fri 23 | F23 |
| F21 | Mon 26 Oct | **R-17 sign-off**: read the signed shared review (`docs/security/REVIEW_R17_CHECKLIST.md`) and the `test:db`-against-staging evidence; record the decision entry "R-17 passed" | 30 min (merges inside window 7) | none | R-17 batch merged Wed 21; F16 | Friends may sign in (D-100); item 10 |
| F22 | Mon 26 Oct | **Legal pages live**: approve the text going public in holding or final form; the legal gate PR merged to `main` in window 7; check the five URLs (FT-31). Update on Wed 28 if counsel's comments arrive | 45 min | Vercel deploy | #136; the legal gate PR | Item 7; friends signing in |
| F23 | Tue 27 Oct | **Backup drill on R2**: B6-01 to B6-04 on your two iPhones on one Apple Account (iCloud Keychain on), with S19's alpha run sheet (6 recordings instead of 20 [R]); then B6-06 for the request email | 2.5 h | none | F20; backup flag PR merged Mon 26 | Item 4 |
| F24 | Tue 27 Oct | **Build 2**: `npm run preflight:alpha -w @scribe/mobile`, build `preview` from the freeze commit, submit, add to "Family" (step 11) | 30 min | EAS queue | Freeze at 12:00 UTC; F21, F23 | The family on build 2 |
| F25 | Wed 28 Oct | **Build 2 checks**: StoreKit D-1 to D-12; a two-phone smoke (sync, invite, backup state); the SE 3 50-kill subset of DL-01 and DL-02 from S19's run sheet (a family helper can run it) | 2.5 h | none | F14 Active, F24 | Items 2 to 6 and 9 |
| F26 | Wed 28 Oct | **Friends as testers**: each one as an App Store Connect user and in "Friends", with no build added yet | 30 min | Testers accept | F08 | F27 |
| F27 | Thu 29 Oct | **Go/no-go** with the coordinator (section 6); if go, add build 2 to "Friends" and post the "What to test" text | 30 min | none | everything above | The alpha |
| W | Fri 16 to Thu 29 Oct, each weekday | **The merge window** (section 5.3) | 45 min, 60 on Wed 21 and Mon 26 | none | the coordinator's digest | Every founder merge |

Hours by day [E] (steps plus the window): Thu 15 Oct 1.25; Fri 16 Oct 3.4; Mon 19 Oct 4.0; Tue 20 Oct 3.75; Wed 21 Oct 3.25; Thu 22 Oct 3.0; Fri 23 Oct 4.0; Mon 26 Oct 3.5; Tue 27 Oct 3.75; Wed 28 Oct 3.5; Thu 29 Oct 1.0. **Total about 34 hours**, about 17 a week, at the top of ROADMAP 2.1's 15 to 20. Weekends hold nothing; F09 on Sat 17 Oct gains a day for words.

Your two phones: the SE 3 (phone A) and your current iPhone (phone B) on your Apple Account cover the backup drill (`docs/qa/BACKUP_RESTORE_DRILL.md` B6-P1). The co-parent drill needs a second Apple Account: a family member's iPhone as the second parent.

## 5. Merge policy for the alpha

### 5.1 Coordinator merges (proposed in D-106; waits for your one word in F03)

The coordinator merges app code after **two independent review agents** pass it. A PR qualifies when all of these hold:
1. It touches only app code and its tests: `apps/mobile/src/**` (except the founder paths in 5.2), `packages/core/src/**` except the five CODEOWNERS files, `packages/design-tokens/**`, screen copy in `packages/content/src/features/**` and `strings.en.ts` that changes no claim, tests anywhere, `experiments/**`, and docs outside `docs/legal/**`, `docs/prd/**`, `docs/agents/**` and `docs/DECISIONS.md`.
2. Two `review/ready` verdicts from agents outside the author's stream. For `apps/mobile/src/lib/{db,sync,capture}/**` one of the two is the data-durability reviewer, and the migrator and two-phone tests pass.
3. `required` is green on a scratch merge with current `develop`, not only at the PR's head.
4. It works with the switch off and on, stays inside the stream's globs, and names its WP or BL id.

The coordinator merges these at any time, not in your window, and lists them in the next digest. You may revert any of them.

### 5.2 Founder merges, batched daily with the evidence attached

Never delegated, as in `08-delivery.md` section 6.2, plus `main`. One difference from 6.2: the local store and sync (`apps/mobile/src/lib/{db,sync}/**`) count as app code under D-106, with the durability reviewer in 5.1.
- **Database and migrations**: `supabase/**`.
- **Auth**: `apps/mobile/src/lib/{auth,supabase}/**`, `apps/mobile/src/app/(auth)/**`, `+native-intent.tsx`, `apps/web/src/app/auth/**`.
- **Payments**: `apps/mobile/src/lib/billing/**`, `apps/mobile/modules/scribe-store/**`, `packages/core/src/plan.ts`.
- **Keys and native code**: `apps/mobile/src/lib/backup/**`, `apps/mobile/modules/**`, `packages/api/**`.
- **Release configuration**: `apps/mobile/{app.config.ts,eas.json}`, every `package.json` and lockfile, `.github/**`, the AASA file.
- **Engine**: `packages/core/src/{verify,meaning,types,pipeline}.ts` (CODEOWNERS).
- **Words that make a promise**: `docs/legal/**`, `docs/DECISIONS.md`, claim lines (privacy, security, durability, price, "free") anywhere in `packages/content`, and everything on `main` (website, legal pages).

Evidence attached to each, in the digest: both review verdicts (one security-focused for database, auth, payments and keys), `npm test`, `npm run typecheck`, `npm run test:db` and `npm run test:functions` results, the staging dry run for a migration, the preflight output for release configuration, data classes touched, and the rollback in one line.

### 5.3 The daily window

- One window each weekday from Fri 16 to Thu 29 Oct, at an hour you pick and keep: 45 minutes, 60 on Wed 21 Oct (the R-17 batch) and Mon 26 Oct (the sign-off).
- The coordinator posts the digest 2 hours before it: PRs in merge order, each with three lines (what, tests, risk) and the evidence links. A PR not in the digest waits for the next window.
- At most 6 founder PRs a window, of which at most 3 touch the database or auth [R]. Right after a window with migrations you run the staging workflow (inside F16 and F20).
- Requests to S03, S16 and S20 arrive by 15:00 UTC and land as one requests PR in the next window (08 section 4).
- In the window you do only merges and one-word answers. Decisions that need thought go to the Friday review instead.

### 5.4 If the answer to F03 (1) is no

Every PR is a founder merge. About 30 more PRs [E] reach your windows, mostly screen packages, so each window grows to about 90 minutes from Mon 19 Oct, about 7 more hours in all. The experience pass then shrinks to J1 to J3 and J6, and item 8 is judged on those.

## 6. Go/no-go on Thu 29 Oct

### 6.1 The checklist

Each item links its evidence file in `docs/qa/evidence/` (S19 keeps the index).

| # | Check | Evidence | Who signs |
|---|---|---|---|
| 1 | Build 2 (or 2.1) is the build Friends will get, made from the freeze commit, installed from TestFlight on two iPhones | Build number and commit | S20 |
| 2 | Items 1 to 10 of section 1.1 each pass | One evidence file per item | S19, then the founder |
| 3 | No open S0 or S1 issue; no crash seen on build 2 in the two-phone smoke | Issue list with labels | Coordinator |
| 4 | The kill path works: you know where "Allow new users to sign up" is on staging; build 1 is still in TestFlight as the servers-off fallback (#145's kill path) | Checked by the founder | Founder |
| 5 | Staging is run as production: only you have dashboard access, spend cap on, backups present, statement logging off, no fixture resets (`docs/ops/ENVIRONMENTS.md` on #145) | Settings screenshot kept outside the repo | Founder |
| 6 | Nothing in build 2 says more than it does: no "stays only on this phone", backup copy per D-102, "What to test" text as on #145 | S16's claim list | S16, founder |
| 7 | Friends were told it is an early test, that letters sync to our test server, and never to paste a child's name or a letter's words into feedback | The invitation text | Founder |

### 6.2 The decision rule

- **All pass:** go. Friends get build 2.
- **R-17 (item 10) or the legal pages (item 7) fail:** friends get build 1 (servers off); the family keeps build 2. This is the D-100 rule, and it has no exception.
- **Any other item fails:** the family keeps build 2; friends get build 1 or wait, as you choose. The coordinator gives the failed item a new date in the next window.
- **Counsel has not commented by Thu 29 Oct:** PRD V2's rule (R4 PT-31) is that no outside family signs in on policies counsel has not commented on. Either friends stay on build 1 until counsel comments, or you decide in writing to go with holding pages; the coordinator records that as a decision entry.

## 7. Top ten risks

| # | Risk | Signal and date | Mitigation |
|---|---|---|---|
| 1 | **Apple enrolment is slow.** FT-01 is not recorded as done, and Apple's identity check time is not ours to set | Not Active by Mon 19 Oct | Enrol today (F01). F02 to F07, F09, F10, F13, F16 and F18 need no Apple. Section 2.3 gives the shifted dates; past Fri 23 Oct the alpha moves day for day |
| 2 | **The backup chain** is the longest: #151 (48 files) and #150 (36 files) unmerged; a three-way contract difference with #138; the Swift module never compiled; CryptoKit HPKE and Keychain sync never run on iOS 17; a separate escrow project and a drill key ceremony | No settled contract by Mon 19 Oct; #150 or #151 not merged Fri 23 Oct; R2 not built Mon 26 Oct | Contract settled first (section 3.3). R1 on Fri 23 Oct is the first build that compiles `scribe-keys`; to learn sooner, S05 lands the module alone (no callers, flag off) before Tue 20 Oct so build 1 compiles it [R]. The backup flag stays off until the drill passes. If the drill fails on Tue 27 Oct, build 2 ships with backup off and item 4 fails (section 6.2) |
| 3 | **The security gate is compressed** from Fri 13 Nov (08 T16) to Mon 26 Oct; #139 and #140 are still drafts and BL-349 has no PR | No shared review signed by Tue 20 Oct; batch not merged Wed 21 Oct | One security review agent on a scratch merge from Sat 17 Oct; the six merge as one batch in window 4; sign-off is a reading task on Mon 26 Oct. If it slips, friends stay on build 1 (6.2) |
| 4 | **Counsel timing**: the packet goes out Fri 16 Oct with a seven working day ask; counsel's turnaround is unknown, and the PRD's own estimate is about 3 weeks [A] | No reply by Fri 23 Oct | Ask only for the alpha subset (F07). Holding pages and draft versions marked as drafts are allowed (item 7). If counsel is silent, 6.2's last rule applies |
| 5 | **Speech model download sizes**: 574 MB for the English model, 190 MB for the small one (`catalog.ts`) [F]; words wait for the download, and no signed manifest exists until F09 and F13 | Words not arriving on R1 on Fri 23 Oct | The download asks first and stays on Wi-Fi (#104). S08 measures time to words on both phones by Thu 22 Oct. "What to test" tells testers words come after the download. Item 6 needs English only |
| 6 | **Your review time**: about 34 hours over 11 working days, with about 30 founder-class PRs in 10 windows, several large (#151 has 48 files) | A window running past 60 minutes, or the digest carrying PRs over two days running | Digest with evidence; delegation of app code (5.1); at most 6 founder PRs a window; non-alpha PRs (#105, #132, #137, harness) kept out of the windows until after Thu 29 Oct |
| 7 | **Staging holds real family letters** from Thu 22 Oct (#145's ENVIRONMENTS.md), on a plan not yet chosen. Supabase's Free plan may cap free projects per organisation and pause idle ones [A: check the pricing page in F04]; `early-letters` already exists | A paused project or a refused new project in F04 or F18 | Pro for staging and the escrow project for the alpha [R] (about US $25 a month each [A]); spend cap on; no load tests, resets or restore drills against staging; the pepper made once and kept |
| 8 | **Merge collisions** across sessions: ADR 0023 claimed three times, root `package.json` four times, `purge-worker` twice, `scripts/packs/**` three times, web content three times | A PR red after a scratch merge | Section 3.3 order; ADR numbers at merge; S20 takes the union in root `package.json`; the merge train rebases in that order daily |
| 9 | **First native builds and the 500-kill run**: nothing has run on a phone; the kill harness needs macOS, and CI has only Ubuntu runners [F] | Build 1 fails on Tue 20 Oct; no harness run by Thu 22 Oct | Build 1 early as a compile check. S19's harness runs on GitHub-hosted macOS runners, free for public repositories [A: S19 confirms on GitHub's billing page], or on your Mac overnight as the fallback. EAS Free queue times may add hours [A]: start builds right after each window |
| 10 | **Plus in the sandbox waits on Apple's money checks**: the Paid Apps agreement, bank and tax (FT-06) take a day or more after Apple Active, and products must exist on the `.preview` record | Paid Apps not Active by Mon 26 Oct | F14 the day after F08; S06's Keep gate is tested in Node meanwhile; if still waiting on Wed 28 Oct, item 5 fails and 6.2 applies |

## 8. Sources

- Decisions: `docs/DECISIONS.md` on `docs/decisions-d089-d094` (D-100 to D-106, #128 closed), on #108 (D-089 to D-092), on #122 (D-093 to D-099), on `develop` (D-041, D-069, D-082, D-083, D-085 to D-088).
- Plans: `docs/prd/v2/08-delivery.md` sections 1.1, 2.1, 3.3, 4, 5, 6.2, 6.3, 7, 9, 10; `05-feature-map.md` sections 2 and 5; `09-decisions-and-risks.md` R-17 (all on `docs/prd-v2`, #124). `docs/FOUNDER_TASKS.md` FT-01 to FT-31; `docs/BACKLOG.md` lines 47 to 70 and BL-135, BL-349 (on `develop`).
- Release: `docs/release/TESTFLIGHT.md` (on `develop`, and the alpha rewrite on #145), `docs/release/1.0.0.md` (#108), `docs/ops/ENVIRONMENTS.md` (#145), `apps/mobile/eas.json` (on `develop` and #145), `.github/workflows/deploy-db.yml` (on `develop`).
- Backup: `docs/ops/BACKUP_RUNBOOK.md` (#151), `docs/qa/BACKUP_RESTORE_DRILL.md` (#150).
- Agents: `docs/agents/COORDINATION.md` and `BOARD.md` (on `chore/agents-operating-system`; claims of 15 Oct).
- Pull request bodies and file lists: #105, #124 to #126, #129 to #140, #143 to #146, #148, #150, #151, read from the GitHub API on 15 Oct.
