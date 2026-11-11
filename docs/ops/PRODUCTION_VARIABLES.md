# Production build variables (names only)

Owner: ops. Written 9 Nov 2026 for build 12, the first public App Store build. **Names only: no secret value, key, URL or token is ever written in this file.** (The public pack host and the on/off literals are listed because they are not secret.) Values are typed by the founder into the EAS `production` environment.

Status: **draft with PR `feat/ops-production-servers-on`; not in force until the founder names that PR for merge.** Build 12 runs with server features on against the production backend (`scribe-prod`) by founder decision on 8 Nov 2026. That decision, automatic release and the Free plan still need a recorded D-### entry in `docs/DECISIONS.md`, which this PR does not write. It reverses D-121 item 1 and the "`production` keeps server features off" line of `docs/release/ENVIRONMENTS.md`, which this PR edits (the profile table row and the "Production stays unbuilt" bullet).

Sources: `apps/mobile/eas.json` (profile `production`), `apps/mobile/scripts/preflight-production.mjs`, `apps/mobile/src/lib/capabilities.ts`, `docs/ops/AUTH_SETUP.md`, `proposals/privacy-label-servers-on.md`.

## 1. Written in the repository (`apps/mobile/eas.json`, profile `production`)

Not secret. Changed only by PR; `npm run preflight:production -w @scribe/mobile` checks each line.

| Name | Value | Why |
|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | `production` | The store build: the free-letter limit and Plus, the permanent bundle id |
| `EXPO_PUBLIC_DOCS_BASE_URL` | the pack host, `https://packs.earlyletters.app` | Signed packs and models (D-097) |
| `EXPO_PUBLIC_SERVER_FEATURES` | `on` | Sign-in, sync and co-parent against `scribe-prod`. **Changed from `off` by this PR.** The privacy manifest then declares Name, Email Address, Sensitive Info, Other User Content and User ID (linked, App Functionality, no tracking) |
| `EXPO_PUBLIC_BACKUP` | `off` | Recording backup stays off: it would add Audio Data and Device ID to the label, and fill the Free plan's 1 GB of Storage |
| `EXPO_PUBLIC_STATUS_REPORT` | `off` | Would add Purchase History to the label |
| `EXPO_PUBLIC_ANALYTICS` | `off` | No analytics SDK in the build; no PostHog key |
| `EXPO_PUBLIC_ACCOUNT_DELETION` | `on` | Apple 5.1.1(v): in-app account deletion once accounts exist. The purge worker must be proven running on production first |
| `EXPO_PUBLIC_ENGLISH_ONLY` | `on` | English only in the first store build (D-121 item 1) |

## 2. Set by the founder in the EAS `production` environment (expo.dev, `env:list --environment production`)

| Name | Required | Notes |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | The `scribe-prod` project URL. Without it a servers-on build signs nobody in |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | The publishable key only. `EXPO_PUBLIC_SUPABASE_ANON_KEY` is also read, but use one name |
| `EXPO_PUBLIC_EMAIL_OTP_LENGTH` | only if not 6 | Must equal the Email OTP length in scribe-prod Auth |

## 3. Must not exist in the production build or its EAS environment

| Name | Why |
|---|---|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google sign-in stays out of v1.0. With both set the Google button shows and the label would name a third party. The preflight FAILs (`google-signin`) if either is in the profile or the shell; the EAS environment is checked by hand |
| `EXPO_PUBLIC_PASSKEYS` | Passkeys are off unless this is `1` (`src/lib/auth/passkey.ts`); they are not described in the store text. Not checked by the preflight; check by hand |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_SENTRY_DSN` | Analytics and crash reporting are off |
| `EXPO_PUBLIC_ESCROW_URL`, `EXPO_PUBLIC_ESCROW_KEYS` | Recording backup is off |
| `EXPO_PUBLIC_E2E`, `EXPO_PUBLIC_WEB_PREVIEW` | Test seams never reach a store build (B-9); the preflight FAILs on them |
| Any secret, `service_role` or private key, under any name | Never in the app or its build variables; the preflight FAILs on one |

## 4. Check before `eas build --profile production`

```bash
npm run preflight:production -w @scribe/mobile    # 0 FAIL, then read every UNVERIFIED line
cd apps/mobile && npx eas-cli@24.10.0 env:list --environment production   # names only: section 2 present, section 3 absent
```

## 5. Must be true before this profile is built (not checked by code)

`scribe-prod` exists and holds the full schema (#602, #634, #636, #637 and #700 merged and applied; see the table below); session security (#657, #632, #633) and #617 merged; the purge worker runs on production; the legal pages are live; the privacy label is answered as the worksheet says; and the D-### entry and the D-124 go/no-go are recorded. The runbook is `proposals/prod-bringup-runbook.md`.

Schema prerequisites, merge state checked with the GitHub API on 11 Nov 2026 (all merged to `develop`; whether each migration is applied on the hosted database is not checked by code and the founder must confirm it):

| PR | Merged to `develop` | Apply requirement |
|---|---|---|
| #602 | Yes, 10 Nov 2026 | Apply to `scribe-prod` and confirm |
| #634 | Yes, 10 Nov 2026 | Apply to `scribe-prod` and confirm |
| #636 | Yes, 10 Nov 2026 | Apply to `scribe-prod` and confirm |
| #637 | Yes, 10 Nov 2026 | Apply to `scribe-prod` and confirm |
| #700 | Yes, 10 Nov 2026 | `supabase/migrations/20261109000000_child_name_optional.sql` is **not applied** on the hosted database. Apply it before the servers-on build (supabase/APPLY.md; CI on a tag only, D-041; needs red-team review and the `approve-migration` label). Without it the server still requires a non-empty child name, which the app now treats as optional |
| #657, #632, #633, #617 (session security) | Yes, 11 Nov 2026 | Code only, no migration step here |
