# Build 12 gap map: what build 11 leaves out, and the road to a public App Store release

Written Sun 8 Nov 2026 (UTC evening) by `ops`, read against `origin/develop` cda0ba83 (#662), the live GitHub REST state of 8 Nov, `npm run release:ready` run live at 21:44 UTC on 8 Nov, and Apple pages fetched on 8 Nov 2026. Research only: nothing here was built, applied, dispatched or changed. Founder-only facts that the repo cannot show are marked NOT VERIFIED.

Founder's route (his answers of 8 Nov, relayed by the coordinator): a **public App Store release**, not TestFlight-only and not unlisted; **build 12 runs against the production backend directly**, with no staging rehearsal first. This file plans exactly that. No decision entry records either answer yet (`docs/DECISIONS.md` is outside this file's fence).

Evidence tags: file path with line, PR number, or `release:ready` step id. "Open PR" means open on 8 Nov per `gh api repos/thesaurabhpareek/earlyletters/pulls?state=open`.

## 0. Four things to know before reading the tables

1. **The route reverses D-121 item 1.** D-121 (`docs/DECISIONS.md` line 644) made the first store build on-device only: server features, backup, status report and analytics off. `apps/mobile/eas.json` `production` still writes `EXPO_PUBLIC_SERVER_FEATURES` `off`. A servers-on public build needs a one-line profile flip, a founder decision entry, and the whole R-17 gate (D-100), which was defined against staging and has never been run (`docs/release/1.0.0.md` line 39, "no-go").
2. **No hosted server exists, as far as the repo can see.** `release:ready` on 8 Nov: S-50 (where staging lives), S-51 (create `scribe-staging`), S-52 (staging auth), S-53 (EAS `preview` variables) and S-54 (purge worker and function secrets) all FAIL as "open as of 2026-11-01". `docs/ops/DEPLOY.md` line 36 says `scribe-prod` "does not exist yet". NOT VERIFIED live: the founder may have acted since 1 Nov, and the setup record only learns from a tick.
3. **The live website cannot be the app's policy.** `https://earlyletters.com/privacy` (fetched 8 Nov) says "Last updated: November 1, 2026", "covers the Early Letters website... and its email list" and "The Early Letters app is not out yet." `/support` and `/delete-account` and `/subscription-terms` return 404. The app policy 0.9.0 is in draft PRs #616 (docs/legal) and #652 (web, "do not reach main yet").
4. **Build 11 is far from the app that route needs.** `testflight` profile: servers off, backup off, status report off, analytics off, English only (`apps/mobile/eas.json`, `testflight` block). Anything that needs an account is absent by design (`apps/mobile/src/lib/capabilities.ts` lines 1 to 25).

What build 11 does contain (from the coordinator's facts, checked against merged PRs): #640 app lock, #631 Privacy rebuild (carries #639), #517, #627, #510, #508 billing pieces (also #641), recording and Listen fixes (#651, #595, #626, #662), QE-01 (#643), QE-05 (#647), QE-06 (#651). Not in build 11 and open: #635, #520, #614, #521, #615.

## 1. Build 11 against the 1.0 scope in PRD V2

Scope sources: `docs/prd/v2/05-feature-map.md` section 2 (rank, P0/P1), `docs/prd/v2/08-delivery.md` section 6.3, D-100, D-101, D-121. "Where" says what exists. Status words: **absent** (not in build 11 by switch), **code merged** (on `develop`, never run on a phone or hosted server), **open PR**, **not built** (no code found), **founder** (needs his hands).

### 1.1 Account and sign-in (F02, rank 10, P0)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Sign in with Apple | Absent from build 11. Code merged; `usesAppleSignIn: true`. Device row S1-06 never run (no staging). Apple provider on a hosted project not set up | `apps/mobile/app.config.ts` line 216; `docs/release/1.0.0.md` line 38; `docs/qa/DEVICE_TEST_PLAN.md` line 97; `release:ready` S-52 FAIL |
| Email link and typed code | Absent. Code merged. Resend SMTP not configured on any hosted project (S-52). OTP length 6 vs 8 still a founder call | `docs/release/TESTFLIGHT.md` lines 80 to 88; S1-08 |
| Sign in with Google | Absent and not built into any profile: no `EXPO_PUBLIC_GOOGLE_*` IDs. `lib/auth/google.ts` exists. PRD calls Google P0 (B3), ROADMAP 2.1 cut 2 keeps "no Google" as a founder option | `docs/release/ENVIRONMENTS.md` line 39; `docs/prd/v2/05-feature-map.md` row 10; `docs/release/TESTFLIGHT.md` line 188 |
| Apple 4.8 rule | Met by shipping Sign in with Apple alongside any Google option, and email link is the app's own account system (guideline text read 8 Nov, section 3) | developer.apple.com/app-store/review/guidelines |
| Account screen and sign-out | Absent. Code merged (#310, S1-27, never run on a phone) | `docs/qa/DEVICE_TEST_PLAN.md` line 348 |
| Reviewer sign-in (demo account) | **Not designed.** Sign-in is passwordless (no passwords, D-054), but Apple 2.1(a) asks for demo account info. `store.en.ts` `reviewNotes` is "True for the on-device v1.0 only" and says there is no sign-in (BL-341). `store-config.ts --assert-shippable` refuses a servers-on production profile without `demoUsername` and `demoPassword` | `packages/content/src/store.en.ts` lines 100 to 104; `docs/release/1.0.0.md` line 102 |

### 1.2 Session and token security (R-17 and the build 1 audit, CR-47)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Edge Functions read the new Supabase keys, legacy as fallback (S0, BL-594) | Open PR #602 (not draft). Needs founder's own read or counted reviews (credentials code). Legacy keys must stay on until it merges and runs | #602 body |
| "Sign everyone out" switch honoured by the app (BL-597) | Draft PR #657 | #657 |
| Session Keychain accessibility class pinned (BL-599) | Draft PR #632 | #632 |
| Preview and production builds refuse http Supabase URLs (BL-600) | Draft PR #633 | #633 |
| Recovery runbook for lost sign-in access or suspected takeover (BL-598) | Draft PR #620 | #620 |
| What Supabase logs about families, who can read (BL-603) | Draft PR #658; the read-back needs a project to read | #658 |
| Global JS error handler, codes only (BL-568) | Draft PR #617 | #617 |
| Access token lifetime | Doc recommends 900 s; Supabase default one hour is UNVERIFIED for this project | `docs/release/TESTFLIGHT.md` line 171 |
| R-17 gate (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349): code merged 23 Oct; the checklist run and sign-off not done | no-go | `docs/release/1.0.0.md` lines 38 and 39 |

### 1.3 Consent and age gate (F01, rank 8; F17)

| Requirement | Where it stands | Evidence |
|---|---|---|
| "Before you begin": neutral 18+ question plus unticked agreement box | Open PR #635 (not draft); needs the founder's CCO line | #635 |
| Confirm a No on the age gate before the stop is stored | Open PR #521; held for counsel | #521 |
| Consent sheet links only to Terms and Privacy | Merged (#589); in build 11 | #589 |
| Agree line with versioned links directly above the sign-in buttons (BL-575, D-138 item 3) | No open or merged PR found by title. NOT VERIFIED whether merged under another title | `docs/DECISIONS.md` line 661; BACKLOG.md line 2673 |
| Consent record carries build, OS major, hash, language (BL-577) | Draft PR #634, migration, label `approve-migration`; founder-only apply | #634 |
| Deletion request finds pseudonymised consent rows (BL-578) | Draft PR #636, migration | #636 |
| Audit and consent tables refuse rewrites (BL-585) | Draft PR #637, migration | #637 |
| Age signal (Texas SB 2420 in force; California AB 1043 from 1 Jan 2027) | **Not built**: no Declared Age Range code found in `apps/mobile/src`. D-121 default is a 1.0.x that requests it | `docs/legal/compliance-register.md` CR-004, CR-005; D-121 |
| Country block at sign-up (D-131) and the IP country check (D-136) | **Not built**: no match for the block in `supabase/functions`, `supabase/migrations` or `apps/mobile/src` | D-131, D-136 |

### 1.4 Family invites and roles (F11, rank 12; F16)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Invite and join, co-parent, two-parent cap | Code merged (#139, #140, #184). Link-only invites (D-120). Device rows S1-22, S1-28 need two phones on two Apple Accounts; never run | `docs/release/1.0.0.md` lines 38, 48; D-120 |
| Family tab in build 11 | Hidden by the capability switch with "Family coming soon, not yet" (D-126, #607) | `docs/DECISIONS.md` line 649 |
| Co-parent push notifications | Moved to v1.1 (#605) | #605 |
| Roles beyond two parents, close family contributors | v1.1 (F32) | `docs/prd/v2/05-feature-map.md` section 3 |

### 1.5 Sync (F16, rank 11)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Letters sync to the server and to a second phone | Absent. Code merged (#146, #150, #151, #178). On-phone checks (B2-4, S1-22) never run. Needs a hosted project | `docs/release/1.0.0.md` line 48 |
| Kill harness, no data loss (B2-11, never waived) | In progress; the 500 of 500 run belongs to the freeze commit. DL-01, DL-02 "not run: needs the founder's iPhone SE 3" | `docs/release/1.0.0.md` line 45; `docs/qa/DEVICE_TEST_PLAN.md` lines 145 and 154 |
| Database access rules (RLS) | 32 test files in embedded Postgres in CI; not run against a hosted Supabase project | `CLAUDE.md` commands; `supabase/tests/` |

### 1.6 Backups (F08, rank 4)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Owner's recording backup with escrow | Off in every profile; D-121 puts it third in the order after sign-in and the status report. Server half exists (`supabase/functions/escrow`); phone half state NOT VERIFIED beyond the flag; restore drill DL-03 "not run: needs two phones" | `apps/mobile/eas.json`; `docs/qa/DEVICE_TEST_PLAN.md` line 160; `docs/ops/BACKUP_RUNBOOK.md` |
| Database backup of the hosted project | A free nightly encrypted dump is drafted for staging only (BL-566, draft #622). Nothing for production. Supabase plan (Pro with point-in-time recovery) is an open founder decision; its cost is UNVERIFIED | #622; `docs/ops/DEPLOY.md` lines 49 and 177 |

### 1.7 Deletion and export (F17, F15)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Delete account in the app, with Apple token revocation (Apple 5.1.1(v), BL-330) | `production` profile writes `ACCOUNT_DELETION` `on`, but the purge worker has no hosted deployment or secrets (S-54 FAIL) and the sole-parent drill S1-35 and S2-13 never ran. `apple-token` function exists | `apps/mobile/eas.json`; `docs/release/ENVIRONMENTS.md` line 14; `docs/release/TESTFLIGHT.md` lines 103 to 111 |
| Erase everything on this phone | Open PR #520; needs the CCO line. PRD keeps WP-F17-15 in v1.0 (DATA-REQ-024) | #520; `docs/prd/v2/05-feature-map.md` row 6 |
| Web deletion page | `/delete-account` returns 404 on 8 Nov; `packages/brand/index.ts` line 56 names the URL | curl 8 Nov |
| Export including waiting letters (format 1.6.0) | Merged (#627); in build 11 | #627 |
| Export reads over a real Supabase stack | Test merged (#476) in CI only | #476 |

### 1.8 Billing and Plus (F14, rank 14)

| Requirement | Where it stands | Evidence |
|---|---|---|
| Free letters, Plus gate, offline and renewal grace, kept notes counted | Merged and in build 11 (#510, #517, #508, #641). #552 removed the limit for alpha builds | PR list |
| Plus products on the production App Store Connect record | Founder; product ids are unique across the account, so only a build of the `production` profile can sandbox-test them | `docs/release/1.0.0.md` line 92; `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` |
| Billing grace period 16 days | ATTESTED 1 Nov (S-32) | `release:ready` |
| Small Business Program | Submitted, Apple approval pending (S-31 FAIL) | `release:ready` |
| Status report and renewal reminder emails (D-080) | Off (`STATUS_REPORT` off). Terms promise plan reminders, so this is a claims question (BL-342) | `docs/prd/v2/05-feature-map.md` section 5 |
| Purchase screen terms beside the buy button (3.1.2) | Founder and content; not verified | `docs/release/1.0.0.md` line 102 |
| Plus sandbox decision (S-35) | Open | `release:ready` |

### 1.9 Languages and regions

| Question | Answer | Evidence |
|---|---|---|
| What does build 11 ship? | **English only.** `EXPO_PUBLIC_ENGLISH_ONLY=on` in `testflight`, `preview` and `production`. The language picker shows English and a note; every other language is on hold in the transcription queue | `apps/mobile/eas.json`; `apps/mobile/src/components/language/language-picker.logic.ts`; `apps/mobile/src/lib/transcription-queue/language-hold.ts` |
| What has the repo built? | Seven spoken-language text-rule packs: `ar`, `en`, `es`, `fr`, `hi`, `pt`, `zh` | `packs/text-rules/` |
| What is published? | Pack release v1 is English only (D-115, #527). The manifest answers 200 on `packs.earlyletters.app` (S-11 PASS) | `release:ready` S-11; D-115 item 3 |
| When do the other six ship? | D-121 item 2(d): each when its native reviewers sign. Hindi and Arabic where the gate failed: v1.1 (F33). App interface localisation (Spanish first): later (F44) | `docs/prd/v2/05-feature-map.md` section 3 |
| What may the listing say? | It must stop promising seven languages and co-parent sharing (D-121 risks). The English-only claim is pinned by #498 (merged) against production capabilities | D-121; #498 |
| Storefront | Recommendation is US storefront only (compliance register section 0 "Launch geography"); D-137 lists "the US-only storefront" as a control. Whether availability is set in App Store Connect cannot be read: the production record is not set up for submission (S-12b FAIL, no `ascAppId` in `submit.production`). NOT VERIFIED | `docs/legal/compliance-register.md` line 28; D-137; `release:ready` S-12b |
| Region logic in the app | None found: no storefront or country code in `apps/mobile/src`. Blocked countries (D-131) rely on a sign-up check that is not built | grep, section 1.3 |

### 1.10 Notifications

| Requirement | Where it stands | Evidence |
|---|---|---|
| Local reminders on the phone | Built; Settings reminders merged (#624, #483) | PR list |
| Push notifications | Not in any build; EAS asked "No to Push Notifications" | `docs/release/TESTFLIGHT.md` line 124 |
| Reminder and status emails | Off (section 1.8) | |

### 1.11 Web pages

| Page | 8 Nov state (curl) |
|---|---|
| `/privacy`, `/terms` | 200, but website-only text dated 1 Nov that says the app is not out |
| `/support` | 404. The store config uses the home page as Support URL "for now" (`docs/store/app-store-connect-1.0.md` line 83) |
| `/delete-account`, `/subscription-terms` | 404 (`docs/legal/COUNSEL_PACKET.md` line 186 item 6 lists `/subscription-terms` as still to add) |
| `/.well-known/apple-app-site-association`, `/auth/confirm`, `/j` | 200. Apple's CDN copy lists `VX2Z7FGV23.com.earlyletters.scribe` (S-21 PASS) |
| Beta policy 0.9.0 | Draft PRs #616 and #652 |
| Launch flip kit | Open PR #623 (off by default) |

### 1.12 Store assets and listing (F21, rank 19)

| Item | Where it stands | Evidence |
|---|---|---|
| Listing copy, name "Early Letters: Baby Journal", subtitle (D-139) | Merged (#567, #594) | PR list |
| Production app record `ascAppId` in `submit.production` | Missing (S-12b FAIL). Record id expected 6829377245 per the setup registry. Edit to `eas.json` waits for after the go/no-go on Mon 9 Nov (D-134 effects, D-124 item 1) | `release:ready`; D-134 |
| Age rating questionnaire (18+) | Open (S-34) | `release:ready` |
| EU DSA trader answer | Open (S-33); an individual with US-only availability may make it moot, NOT VERIFIED | `release:ready` |
| Privacy labels | `docs/legal/app-store-privacy-labels.md` exists; "Data Not Collected" is no longer true once accounts exist (D-100); worksheet RA-17-01 and counsel Q54 | `docs/release/1.0.0.md` line 99 |
| Screenshots from a release build (BL-340) | Blocked on a first release build; Asha only | `docs/release/1.0.0.md` line 101 |
| Notes for Review | `docs/store/notes-for-review-1.0.txt` and `reviewNotes` describe the on-device app; rewrite for servers on, plus the dormant-feature sentence (2.5.19) | `store.en.ts`; D-121 |
| Export compliance | `usesNonExemptEncryption` false was set for an app with no encryption of its own; RA-17-02 decides before any build with backup on | `docs/release/1.0.0.md` line 98 |
| Download size, 40 MB budget | Unmeasured until an IPA exists. NOT VERIFIED | D-121 risks; `docs/ops/APP_SIZE.md` |
| Settings regroup | Held to 1 Dec (#614 draft) | #614 |
| Failed evidence review | #615 open | #615 |

## 2. "Servers on" readiness

Two targets. **Preview** means the `preview` profile (a TestFlight build against the staging Supabase project from the EAS `preview` environment; ids `com.earlyletters.scribe.preview`). **Production** means the `production` profile and `com.earlyletters.scribe`, the route the founder chose. Because the route skips staging, every "production" column is also the first time that thing runs anywhere hosted.

"Exists" is what the repo or a live probe shows on 8 Nov. NOT VERIFIED means only the founder's dashboards can tell.

| Needed | Preview needs | Production needs | Exists? | Who | Evidence |
|---|---|---|---|---|---|
| Supabase organisation and project | `scribe-staging` (S-50, S-51) | `scribe-prod`, US region, plan decision (Pro and point-in-time recovery or free), spend cap | Neither shown; both FAIL or "does not exist yet" | Founder only | `release:ready` S-50, S-51; `docs/ops/DEPLOY.md` lines 36, 49 |
| Migrations applied | CI from `develop` behind the `staging` reviewer (`deploy-db.yml`) | A `db-v*` tag on a commit on `main` plus approval in the `db-production` environment. 27 migration files at head `20261028010000_invite_redeem_by_code.sql`; drafts #634, #636, #637 add more and carry `approve-migration` | Workflow exists; applied state NOT VERIFIED. `main` was last merged from `develop` on 1 Nov (#549, #568); check the tag target holds the migrations | Founder approves and tags | `docs/ops/DEPLOY.md` lines 16 to 23, 98 to 106; `ls supabase/migrations` |
| GitHub environments and secrets | `staging`: `SUPABASE_DB_URL_STAGING` and three smoke secrets | `db-production`: `SUPABASE_DB_URL_PROD`; tag rule `db-v*` | Branch protection and rulesets PASS (GH-01, GH-02); environment secrets NOT VERIFIED | Founder | `release:ready` GH-01, GH-02; DEPLOY.md lines 67 to 81 |
| Edge Functions (10 folders: `analytics-forget`, `apple-token`, `config`, `content`, `escrow`, `invite-redeem`, `purge-worker`, `subscription-status`, `text-rules`, `_shared`) | `deploy-functions.yml` with `SUPABASE_ACCESS_TOKEN_STAGING` | No CI path in the docs read: the token is staging-only by design (DEPLOY.md lines 158 to 162), so a production deploy is a founder command from his computer. NOT VERIFIED | Not deployed anywhere shown | Founder | `supabase/functions`; DEPLOY.md lines 150 to 162 |
| Function keys | #602 (BL-594) merged before legacy keys are switched off | Same; production starts with the new key format | #602 open | Agents then founder | #602 |
| Secrets in Supabase | Consent pepper (APPLY.md step 6), purge cron (step 7), beta policy versions `terms` and `sensitive-data` published (step 8, otherwise every new account stops at "We couldn't finish setting up your account"), `RESEND_API_KEY` (separate from the SMTP key), purge worker | Same set, with production-only values; escrow key only if backup is ever turned on | NOT VERIFIED; S-54 FAIL | Founder only | `docs/release/TESTFLIGHT.md` lines 74 to 76, 129 |
| Auth providers | Apple provider with `com.earlyletters.scribe.preview`; email provider with OTP length matching the app (6 or 8) and expiry 900 s; anonymous off, sign-ups on | Apple provider with `com.earlyletters.scribe`; same email settings; Google only if its client IDs ship | S-52 FAIL | Founder only | TESTFLIGHT.md lines 80 to 94 |
| Email sender (Resend) | SMTP in Supabase Auth, click tracking off, about 100 an hour rate | Same, production key | Domain and DNS partly PASS; aliases and DMARC rua FAIL (S-39); strict DMARC FAIL (S-04b) | Founder | `release:ready` |
| Apple Sign in at Apple | Key (`.p8`, shown once), Key ID, Team ID VX2Z7FGV23, private relay email sender `hello@earlyletters.com` | Same, plus `apple-token` secrets for revocation on account deletion | NOT VERIFIED | Founder | TESTFLIGHT.md lines 90 to 94; D-134 |
| Redirect and universal links | AASA lists `.preview` id | AASA lists production id | **PASS**: Apple's CDN copy lists `VX2Z7FGV23.com.earlyletters.scribe` | Done | `release:ready` S-21 |
| Website auth routes | `/auth/confirm`, `/auth/callback`, `/j` | Same | 200 on 8 Nov | Done | curl 8 Nov |
| Packs host (Cloudflare R2) | Signed manifest | Same host | **PASS** (S-06, S-08, S-10, S-11, S-12). English only | Done | `release:ready` |
| EAS variables | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the `preview` environment (S-53) | The same two in the `production` environment, which `eas.json` names for the `production` profile. The preflight fails on a secret or service-role key | S-53 FAIL; `production` environment NOT VERIFIED | Founder | `docs/release/ENVIRONMENTS.md` lines 33 to 37 |
| Server switch in the profile | `preview`: on | `production`: **off today**; one change to `on`, and `config.test.ts` must be updated to match. Any `eas.json` edit waits for after the go/no-go (D-124 item 1) | Not done; no decision entry | Founder decides; agent edits | `apps/mobile/eas.json` |
| RLS and access tests | `npm run test:db` (32 files) in CI | Same files do not run against hosted. A hosted smoke exists for staging (`docs/ops/runbooks/staging-smoke.md`) and none is documented for production | Embedded only | Agents | `CLAUDE.md`; `docs/ops/runbooks/` |
| Per-project migrations record | BL-583 | Same | Draft PR #656 | Agents | #656 |
| Backup of the database | Free nightly dump (BL-566, draft #622) | Not designed beyond the Supabase plan choice | Open | Founder plus ops | #622; DEPLOY.md line 177 |
| Kill path | Build switch off, expire build, pause project (TESTFLIGHT.md lines 168 to 180) | Same, but a public App Store build cannot be recalled at once; see section 5 | Runbook exists for the alpha only | Ops | TESTFLIGHT.md |
| App Store Connect record | `.preview` record, `ascAppId` 6829163677 | `com.earlyletters.scribe`, Plus products, privacy answers, age rating | Preview PASS; production partial (S-12b FAIL) | Founder | `eas.json`; `release:ready` |
| TestFlight pipeline | `testflight.yml` active; Expo robot token in the `testflight` environment (ATTESTED) | Same workflow, profile `production`; a `production` build is a TestFlight build too | GH-03 PASS | Founder dispatches | `release:ready` |

## 3. The path: build 12 on TestFlight, then a public App Store release

### 3.1 Apple rules read on 8 Nov 2026

All fetched on 8 Nov 2026. The pages carry no "last updated" line in the text I received; the guidelines page was truncated before 5.1.4(b) at character 100000 of 121490, so 5.1.5 and section 5.2 onward are UNVERIFIED.

- **App Review Guidelines**, https://developer.apple.com/app-store/review/guidelines/ : 2.1(a) final version, working URLs, no placeholder text, "include demo account info (and turn on your back-end service!) if your app includes a login", or a built-in demo mode "with prior approval by Apple"; 2.1(b) in-app purchases complete and visible to the reviewer; 2.3.1(a) new features described with specificity in Notes for Review; 2.5.19 "Don't include any hidden, dormant, or undocumented features"; 3.1.1 subscriptions through in-app purchase; 3.1.2(a) at least seven days and across the user's devices; 4.8 an equivalent login service that limits data to name and email, allows a private email, and does not collect interactions for advertising, unless the app exclusively uses its own account system; 5.1.1(i) privacy policy link in the App Store Connect field and in the app, saying what is collected, retention and deletion, and how to revoke consent; 5.1.1(v) account creation requires in-app account deletion; 5.1.1(ix) apps in highly regulated fields "or that require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer"; 5.1.2(i) explicit permission before sharing personal data with third parties, including third-party AI; 1.3 and 5.1.4 Kids.
- **TestFlight overview**, https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/ : up to 100 internal testers who are App Store Connect users; up to 10,000 external testers by email or public link; external invitations may need Beta App Review, triggered when the first build is added to a group and "required only for the first build"; test information needs a beta app description, what to test, and a feedback email; builds last 90 days.
- **Invite external testers**, https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/ : an internal group must exist before an external one; roles Account Holder, Admin or App Manager; test information such as Feedback Email and Contact Information; up to six builds submitted to TestFlight App Review in 24 hours. The page I received was cut before any privacy policy URL or demo account line: **UNVERIFIED** whether Beta App Review wants a demo account or privacy policy URL (assume it does, and supply both).
- **App Privacy**, https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ : a privacy policy URL is required for all iOS apps; the answers are required for App Store distribution and must be kept accurate. Tracking and "linked to identity" follow-ups are on `https://developer.apple.com/app-store/app-privacy-details/`, **UNVERIFIED** (not fetched).
- **Age ratings**, https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/ : age rating is a required field generated from the questionnaire and "An Unrated app can't be published on the App Store." The page I received was cut before the value table, so the claim that the founder's 18+ choice is available and the date by which the questionnaire must be redone is **UNVERIFIED**.
- **UNVERIFIED, not fetched:** review turnaround times, phased release, support URL and marketing URL field rules, export compliance forms, Texas SB 2420 developer duties (compliance register cites a secondary source, [L15]), and storefront availability controls.

### 3.2 Gates this route triggers

Build 12 on the TestFlight internal group (Family) triggers no App Review. Everything below applies to the external group (Beta App Review) or the public release (App Review). The left column says which.

| Gate | Applies at | What Apple or the law requires | What is open | Evidence |
|---|---|---|---|---|
| 5.1.1(ix) individual publisher | Public release | Apps that "require sensitive user information" should come from a legal entity. The founder chose the individual account (D-134) and accepted the review risk | The app stores health-adjacent family text. Outcome is Apple's reading. Mitigations on record: Lifestyle category, no health features. Counsel Q47 confirmation open; app transfer to an entity is possible after one released version | D-134; `docs/legal/COUNSEL_PACKET.md` Q47 |
| Counsel text | External testers and public | Policy, Terms, Subscription Terms, in-app disclosures, consumer health data notice, matching the server product, live at permanent URLs before anyone signs in (D-100, D-138 item 1) | #616 and #652 drafts; `/subscription-terms` 404; Q44 (real families under draft texts) A-priority; Q43, Q48, Q41, Q53, Q54 A-priority; Q46, Q55, Q56 B | `docs/legal/COUNSEL_PACKET.md` lines 54 to 128 |
| COUNSEL_LOCKED strings | Public release | Ten registered strings (LNG-04, -09, -12, -15, -18) change only through counsel with a disclosures version bump and the pinning test in one PR. Includes `billingCopy.plan.*` (Plus review) and "family you invite" wording against the two-parent cap | Counsel acceptance of each proposed rewrite; a content PR afterwards | `docs/reviews/2026-10-31/COUNSEL_LOCKED.md` (BL-527) |
| Privacy labels | Public release | Answers required and accurate (section 3.1). Not "Data Not Collected" once accounts exist | Worksheet RA-17-01 for the production build; counsel Q54; founder enters them | `docs/release/1.0.0.md` line 99 |
| 18+ rating | Public release | Required questionnaire; Unrated apps cannot publish | S-34 open; 18+ value availability UNVERIFIED | `release:ready` S-34 |
| Sign in with Apple, 4.8 | Public release | Equivalent option next to any third-party login | Met if Google is left out or Apple is offered alongside; email link is the app's own system | guideline 4.8 |
| In-app purchase and Plus | Public release | 2.1(b) products visible and functional for the reviewer; 3.1.2 terms beside the buy button | Products on the production record are founder work; sandbox test needs a production-profile TestFlight build; S-35 open; Small Business pending | `docs/release/1.0.0.md` lines 92, 102 |
| Support and marketing URLs | Public release | Working URLs, no empty websites (2.1(a)) | Support URL is the home page; no `/support` page | `docs/store/app-store-connect-1.0.md` lines 83, 84 |
| Privacy policy URL | External testers (assume) and public | 5.1.1(i), plus in the app | Live page is site-only | section 0 item 3 |
| Account deletion | Public release | 5.1.1(v) in-app; `/delete-account` page is the app's own promise | Purge worker unrehearsed; page 404 | section 1.7 |
| US-only storefront | Public release | Founder-side availability setting | Not readable; D-137 relies on it; D-131 sign-up block not built | section 1.9 |
| App Review demo account | External testers (assume) and public | 2.1(a) | Not designed (section 1.1) | `store.en.ts` |
| Dormant features | Public release | 2.5.19 and 2.3.1(a): backup, status report and analytics code ships switched off | Notes for Review must list every flag (F19-REQ-024) | D-121 risks |
| Age assurance | Public release | Texas in force now (secondary source); California 1 Jan 2027 | Not built | CR-004, CR-005 |
| Export compliance | Public release | Answer must match the shipped encryption | RA-17-02 | `docs/release/1.0.0.md` line 98 |

### 3.3 Earliest honest dates

Dates are my estimates from the figures in the repo (founder hours from `docs/release/TESTFLIGHT.md` line 139, counsel and soak durations from D-121 context, which are themselves assumptions). They assume the founder starts his production steps on Mon 9 Nov and that counsel is engaged on Mon 9 Nov (whether counsel is engaged is NOT VERIFIED).

| Step | Earliest | Realistic | Depends on |
|---|---|---|---|
| Decision entry that records the route and reverses D-121 item 1 | Mon 9 Nov | Mon 9 Nov | Founder; `docs/DECISIONS.md` |
| Production Supabase, auth, Resend, Apple key, EAS variables, `db-v` tag and approvals | Wed 11 Nov | Fri 13 Nov | About 7 founder hours (TESTFLIGHT.md line 139) plus waits |
| Server-security PRs and the production flip PR merged | Wed 11 Nov | Fri 13 Nov | `eas.json` freeze ends after the go/no-go (D-124 item 1); #602 needs a founder read |
| **Build 12 in TestFlight, internal Family group, production backend** | **Fri 13 Nov** | Fri 20 Nov | The two lines above, a preflight pass, Apple processing. No App Review for internal testers (section 3.1) |
| Real-phone rows for sign-in, sync, invite, deletion, restore | Mon 16 Nov | Fri 27 Nov | Two phones on two Apple Accounts; the founder's iPhone SE 3 |
| External group "Friends" (Beta App Review) | Tue 17 Nov | Mon 30 Nov | App policy 0.9.0 and Terms live at permanent URLs (BL-565); R-17 checklist run and signed; Q44 answered; demo account path |
| Counsel comments | about Mon 30 Nov | mid-Dec | D-121 context assumes 3 weeks to comments |
| Counsel sign-off | about Mon 4 Jan 2027 | late Jan 2027 | D-121 context assumes up to 6 more weeks |
| 14-day soak of the servers-on build, 21-day first-families run | about Fri 4 Dec | late Dec | Starts when build 12 is in families' hands; D-121 context |
| **App Store submission, public** | **Mon 4 Jan 2027 (CTO figure of 10 to 15 percent, D-121)** | mid-Feb to Mar 2027 | Counsel sign-off, soak, age signal for AB 1043 (in force 1 Jan 2027), ASC items |
| Apple review and release | submission plus Apple's turnaround (UNVERIFIED) | | Rejection cycles; 5.1.1(ix) is the likeliest |

The only dates in the repo for a store submission before 2027 are for the on-device build (Tue 1 Dec 2026, 55 percent by Fri 11 Dec, D-121). That route does not hold real families' letters on a server and is no longer the founder's choice. The 16 Nov path in D-121 depends on a signed counsel deferral; I recommend against using it with letters on a production database (section 5).

For "family and friends", TestFlight external alone reaches up to 10,000 testers (Apple page above) with a 90-day build life; the founder chose the public store anyway, so this is a fact, not a proposal.

## 4. Proposed order for build 12 (critical first)

Rank 1 is first. Size is an estimate for an agent PR or for founder hands. "Row" is the device row or test that proves it. Dependencies name ranks.

### 4A. Can start now by agents

| Rank | Item | PR or id | Lane | Size | Depends | Gate | Test and device row |
|---|---|---|---|---|---|---|---|
| 1 | Edge Functions read the new keys | #602 (BL-594, S0) | functions | S | Founder reads diff | CR-47: legacy keys stay on until merged and run | `npm run test:functions`; first hosted run is the proof |
| 2 | Force sign-out honoured, Keychain class, https-only builds | #657, #632, #633 (BL-597, 599, 600) | auth, mobile | S each | none | production build refuses http | unit tests; S1-27 |
| 3 | Production profile flip plus equality test and doctor row | no PR yet | ops, mobile | S | 18, 19; after Mon 9 Nov | founder decision; R-17 | `config.test.ts`, `capabilities.test.ts`, `npm run preflight` |
| 4 | Account deletion proven end to end on a hosted project | no PR yet (rows exist) | qa, data | M | 19, 20 | Apple 5.1.1(v); D-129 | S1-35, S2-13, AL-07.6a |
| 5 | Reviewer sign-in path (demo account for passwordless) | no PR yet | auth, ops | M | 18 | Apple 2.1(a); `store-config.ts --assert-shippable` | S1-08 with a review mailbox |
| 6 | Notes for Review and listing rewritten for servers on, with every dormant flag named | no PR yet (BL-341) | content | S | 3 | Apple 2.3.1(a), 2.5.19 | `store-config.ts --assert-shippable`; #498 claims test |
| 7 | Age signal request (AB 1043 / Texas) | no PR yet | mobile, regulatory | M | Q46 | CR-004, CR-005 | new device row needed |
| 8 | Sign-up country check (D-131, D-136) | no PR yet | functions | M | Q57 | D-131 | function test; new row |
| 9 | Production hosted smoke and migrations record | #656 (BL-583, BL-584) draft; smoke: no PR yet | ops | M | 19 | rehearsal of section 5 | `docs/ops/runbooks/staging-smoke.md` adapted |
| 10 | Production kill, rollback and restore runbook and drill plan | no PR yet | ops | M | 19 | section 5 | restore drill `docs/ops/runbooks/restore-drill.md`; DL-03 |
| 11 | Database backup for production (dump workflow, or the Pro plan once decided) | #622 (staging only) | ops | S to M | 23 | D-138 item 2 | restore check |
| 12 | Web: `/support`, `/delete-account`, `/subscription-terms` pages | no PR yet | web | S | counsel text | Apple 5.1.1(i), 2.1(a) | web journeys (#534 open) |
| 13 | Privacy label worksheet for the production build | no PR yet (RA-17-01) | legal-ops | S | 3 | counsel Q54 | review by counsel |
| 14 | Screenshots from a release build | BL-340 | content | S | first build | Apple 2.3 | Asha only |
| 15 | Global error handler, queue pause, recording fixes already in flight | #617, #619, #618, #615 | mobile | S each | none | S0 data-loss rules | S1-13, DL-01, DL-02 |
| 16 | Failed-evidence review follow-up | #615 | red-team, mobile | S | none | review failed | row from the PR |
| 17 | Review gate on the consent migrations (labels, ordering) | #634, #636, #637, #655 | data | M | 19 | `approve-migration`; applied only by CI | `npm run test:db` |

### 4B. Needs a founder decision

| Rank | Item | PR or id | Lane | Size | Depends | Gate | Test and device row |
|---|---|---|---|---|---|---|---|
| 18 | Record the route and reverse D-121 item 1 | no entry yet | founder | S | none | D-121 says the founder may reverse | decision entry |
| 21 | CCO line for "Before you begin" | #635 | founder | S | none | F2 | S1-03 |
| 22 | CCO line for Erase everything | #520 | founder | S | none | DATA-REQ-024 | DL-05 |
| 23 | Supabase plan for production (Pro and point-in-time recovery or free) | S-50 | founder | S | none | cost UNVERIFIED | restore drill |
| 24 | Google sign-in in or out of build 12; OTP length 6 or 8 | PRD F02 | founder | S | none | Apple 4.8 | S1-07 if in |
| 25 | Co-parent sharing: ship in build 12 or keep hidden | D-126 | founder | S | none | R-17; Q53 | S1-22, S1-28 |
| 26 | #521 and #614 hold dates | #521, #614 | founder | S | counsel, 1 Dec | | |

### 4C. Needs counsel

| Rank | Item | Id | Depends | Gate |
|---|---|---|---|---|
| 27 | App Terms and Privacy 0.9.0 for family testers, then the 1.0.0 versions | #616, #652, Q44, Q31 | counsel | before anyone outside the founder signs in (D-138 item 1) |
| 28 | Consent design and sign-in wrap | Q48, BL-575 | counsel | LEGAL-REQ-001 |
| 29 | Billing notices and Subscription Terms | Q41 | counsel | Apple 3.1.2; California renewal law |
| 30 | COUNSEL_LOCKED ten strings | BL-527 | counsel | version bump of `in-app-disclosures.md` |
| 31 | App Privacy answers, two-parent cap, age assurance, export classification, sign-in codes, sanctions | Q54, Q53, Q46, Q55, Q56, Q57 | counsel | privacy labels, AB 1043 |
| 32 | Publisher confirmation and liability | Q47 | counsel | 5.1.1(ix) |
| 33 | The 14 new questions drafted for the account and Settings work | Q61 to Q74 (#598, open, not on `develop`) | counsel | 1 Dec obligations list |

### 4D. Needs founder hands (Apple, Supabase, Vercel, Google)

| Rank | Item | Id | Size | Depends |
|---|---|---|---|---|
| 19 | Production Supabase project, `db-production` environment, first `db-v` tag and approval | AF-42, DEPLOY.md | about 2 h | 18, 23 |
| 20 | Auth on production: Apple provider, Resend SMTP, OTP, URLs, templates; function secrets (pepper, purge, `RESEND_API_KEY`, `apple-token`); policy versions published | S-52, S-54, TESTFLIGHT steps 6 to 8, 12 | about 3 h | 19 |
| 34 | EAS `production` environment variables; `ascAppId` 6829377245 in `submit.production` after Mon 9 Nov | S-53, S-12b | 15 min | 19 |
| 35 | Production record in App Store Connect: Plus products, age rating, privacy answers, DSA trader, Small Business, availability US only, support and marketing URLs | S-31, S-33, S-34, S-35 | about 2 h | 13, 12 |
| 36 | Google Cloud project and client IDs (only if Google stays in) | FT-15 | about 1 h | 24 |
| 37 | TestFlight Friends group and tester invitations; Apple membership renewal card | S-42 | 30 min | 27 |
| 38 | Vercel: `APPLE_TEAM_ID`, `IOS_BUNDLE_ID`; pages deployed to `main` | S-21 PASS | done | none |
| 39 | Strict DMARC, Resend aliases, CAA on `earlyletters.com` | S-04b, S-38, S-39 | 30 min | none |
| 40 | Real-phone sessions on the iPhone SE 3 and a second phone | DEVICE_TEST_PLAN | about 4 h per session | 19 to 21 |

Note on rank order: ranks 18, 19, 20 and 34 are the critical path to a first server-backed build; ranks 1 to 3 and 5 are the agent work beside them; counsel items 27 to 33 are the critical path to the public release and start the same day.

## 5. Risks of real families' letters on a production database that has never been rehearsed

The repo plan for this was staging first, with real family letters on staging for the alpha (`docs/release/ENVIRONMENTS.md` lines 68 to 75), then production later. The route removes that rehearsal.

| Risk | What could go wrong | Evidence | Mitigation to build before build 12 |
|---|---|---|---|
| **Migrations** | 27 migrations plus three drafts go to a blank hosted project for the first time, in production, through a flow that has only ever been described. Migrations are forward-only; an applied file is never edited. A bad one on live data means a new migration, not a rollback. `main` lags `develop` (last merged 1 Nov), so the tag target may not hold the files | `ls supabase/migrations`; DEPLOY.md lines 98 to 106 | Rehearse the full set on a scratch hosted project (a free throwaway) before the tag; read the dry run; per-project record (#656); expand-then-contract for later changes |
| **Setup traps** | Policy versions `terms` and `sensitive-data` not published means every new account stops at "We couldn't finish setting up your account". A wrong consent pepper breaks invite codes. OTP length mismatch refuses every typed code | `docs/release/TESTFLIGHT.md` lines 76, 82 | A hosted smoke that signs in a synthetic Asha account and creates, syncs and deletes one letter, run after every deploy |
| **Backups** | Nothing documented backs up production data. The free dump is drafted for staging only. No restore has been run (DL-03 "not run"). Free-plan point-in-time recovery: none (UNVERIFIED for the current plan; pricing page not read). A lost project is lost letters of families who keep the phone copy only if sync is behind | #622; `docs/qa/DEVICE_TEST_PLAN.md` line 160; DEPLOY.md line 177 | Decide the plan (rank 23); nightly dump and a timed restore drill before any friend signs in; local-first design means each phone still holds its letters (TESTFLIGHT.md line 175) |
| **RLS tests** | The 32 test files run in embedded Postgres, not on hosted Supabase. A hosted-only difference (extensions, roles, grants, default privileges reset since `20261023060000`) would not show until live. R-17 was defined to be run against staging and was never run | `CLAUDE.md`; `docs/release/1.0.0.md` line 39 | Run the R-17 checklist (#140) on the scratch project, then once read-only on production; grants file `supabase/tests/grants.mjs` check |
| **Kill switch** | The server switch is read from the bundle only; a shipped build cannot be switched off remotely (`capabilities.ts` lines 15 to 20). Remote switches (`sync`, `invites`) can pause a feature in a build that has it, but the doc says none reached a phone before the signing keys shipped (TESTFLIGHT.md line 180). The keys now trust (S-08 PASS) and the manifest answers (S-11 PASS), so these should work; NOT VERIFIED on a device. A public App Store build cannot be expired like a TestFlight build; the only fast stops are pausing the Supabase project and rotating the publishable key, which also cuts off every installed copy | `apps/mobile/src/lib/capabilities.ts`; TESTFLIGHT.md lines 168 to 180 | Prove the signed `sync` switch on a TestFlight build before submission; write the production incident path (`docs/ops/runbooks/suspected-data-leak.md` and `incident-notification.md` exist) |
| **Rollback** | App rollback means a new build (build numbers come only from EAS) and a review; Apple phased release controls are UNVERIFIED (not read). Database rollback means a forward fix | ADR 0022; `docs/ops/RELEASE.md` | Keep the previous TestFlight build installable; expand-then-contract so the previous app works against a newer schema |
| **Account deletion and purge** | Purge worker and cron not deployed anywhere; sole-parent drill not run; the row is switched on in `production` | S-54; S1-35 | Do not ship the row until the drill passes on the scratch project, or Apple 5.1.1(v) fails the build |
| **Credentials** | Legacy keys must stay on until #602 runs (CR-47); service-role keys never in the app or EAS (the preflight fails on one) | #602; ENVIRONMENTS.md line 37 | Credentials code needs the founder's own read or a second counted review |
| **Legal exposure** | Real letters can hold health details; the policies for the server product are drafts; the live site says the app is not out. Counsel Q44 asks exactly whether real families may use the app under draft texts | `docs/legal/COUNSEL_PACKET.md` Q44; section 0 item 3 | Publish 0.9.0 and wait for Q44 before any non-founder signs in; this is the line I recommend not crossing with a deferral |
| **One reviewer** | CR-48 says the merge path runs while no second session can review. The riskiest code here (credentials, migrations) wants a counted second review | PR #592 | Founder's own read of #602 and the migrations |
| **Email delivery** | Auth email rides one Resend domain with a limit of about 100 an hour and unverified aliases; a launch spike locks people out | TESTFLIGHT.md line 81; S-39 | Raise limits or cap invitations per day |
| **Freeze overlap** | `eas.json` and `app.config.ts` stay unedited from Tue 3 Nov until the go/no-go on Mon 9 Nov except S0 or S1 fixes | D-124 item 1; `docs/release/1.0.0.md` line 17 | Land the profile flip on or after Tue 10 Nov |

## 6. The five questions only the founder can answer

1. **Do you record, in writing, that build 12 reverses D-121 item 1 (production servers on) and that you accept an unrehearsed production database?** Default: yes to servers on, but add one scratch hosted rehearsal (a throwaway Supabase project, a few hours of work) before the production `db-v` tag. It costs a day and removes the largest risk in section 5.
2. **Who may sign in to build 12, and when?** Default: Family only (internal TestFlight) until counsel answers Q44 and the 0.9.0 policy is live at a permanent URL; Friends after that; the public store after counsel sign-off.
3. **Which Supabase plan does production run on?** Default: Pro with point-in-time recovery from the day a friend signs in; take the monthly cost from Supabase's pricing page first (UNVERIFIED here).
4. **Sign in with Google in build 12, and what code length (6 or 8)?** Default: leave Google out of build 12 (Apple and email only, which also keeps guideline 4.8 simple) and keep the 6-digit code the app already uses.
5. **How does an Apple reviewer sign in, and is co-parent sharing part of the first public release?** Default: a dedicated review mailbox on your domain that you open for Apple, written into Notes for Review; keep the Family tab hidden for the first public release (D-126 behaviour) so the review covers one parent, and turn on co-parent in 1.0.1 behind the existing switch.

## 7. What this file did not check

Anything only the founder's dashboards show (Supabase, Apple Developer, App Store Connect, Resend, Cloudflare, Vercel, Google Cloud, EAS). Counsel's current state. Whether the priority-A question list in `COUNSEL_PACKET.md` has been sent. Review turnaround, phased release and support URL rules at Apple. Real download size. The content of draft PRs beyond their titles and bodies.
