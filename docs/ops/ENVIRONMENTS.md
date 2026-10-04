# Environments

Owner: founder. Written 3 Oct 2026. Decision: D-041 (two Supabase projects; migrations only from CI on a tag). Companion docs: [SECRETS.md](SECRETS.md), [RUNBOOKS.md](RUNBOOKS.md), `supabase/APPLY.md`, `docs/tdd/02-sync-backend.md` section 6.

## Status today

- The target layout below **does not exist yet.** The "Early Letters" Supabase organisation and the `scribe-staging` and `scribe-prod` projects have not been created. RB-0 in [RUNBOOKS.md](RUNBOOKS.md) creates them.
- Until then, the existing single project is a development project only, changed by hand through `supabase/APPLY.md`. It is not promoted to production; production is built clean from the migration folder (TDD 02 section 6.1).
- The bundle ID is derived from `publisher.domain` in `packages/brand/index.ts`, which is `earlyletters.com` on `develop` (checked 4 Oct 2026), so the production id is `com.earlyletters.scribe`. It can never change after the first App Store Connect upload.
- **v1.0 is on-device only** (founder decision recorded in `docs/agents/BRIEF-2026-10-03.md`): no sign-in, no sync, no server copy of letters, and the build switch is off for every v1.0 profile. The Supabase rows in this document describe the server that v1.1 turns on; none of it is needed to ship v1.0. Secrets and settings for the deletion pipeline are also covered in `docs/ops/SECURITY.md`, `docs/ops/DOMAINS.md` and `docs/ops/runbooks/`.

## Matrix

| | Local | Staging | Production |
|---|---|---|---|
| Purpose | Developing and testing on one machine | Integration, TestFlight internal builds, release rehearsal, restore drills | Real families |
| Data | Fictional "Asha" fixtures only | Synthetic "Asha" families and load data only. Never real family data. | Real families |
| Supabase | `supabase start` (CLI, Docker) or PGlite for `npm run test:db` | `scribe-staging` in the "Early Letters" org (not created yet) | `scribe-prod` in the "Early Letters" org (not created yet) |
| Region | n/a | Same as production | One region near US users (brief decision 17). TDD 02 recommends `us-west-1`. |
| Supabase plan | n/a | Founder decision | Pro recommended (daily backups; PITR available as an add-on). Founder decision. |
| Who changes the schema | The developer (`supabase db reset`) | CI on push to `main` (planned deploy workflow) | CI on a release tag, behind the GitHub Environment `production` approval (D-041). Never the SQL Editor except break-glass ([INCIDENT.md](INCIDENT.md)). |
| EAS build profile | `development` (dev client) or `expo start` | `development`, `preview` | `production` |
| EAS environment | `development` | `development`, `preview` | `production` |
| `EXPO_PUBLIC_APP_ENV` | `development` (`apps/mobile/.env.development`) | `development` or `preview` (set in `eas.json`) | `production` (set in `eas.json`) |
| Bundle ID | `<id>.dev` | `<id>.dev` or `<id>.preview` | `<id>` |
| Distribution | Simulator or dev client | EAS internal distribution; TestFlight internal | TestFlight external (beta cohorts), App Store |
| Universal links | None | Proposed: none until a staging host is decided | `https://earlyletters.com` (brief decision 13) |
| URL scheme | `scribe` (from `brand.scheme`) | `scribe` | `scribe` (whether to change it before the first build is an open founder question) |
| Email sender | None, or Supabase local inbox | Resend, staging API key | Resend, production API key, from the `earlyletters.com` domain |
| Analytics and crashes | Off | Separate PostHog and Sentry projects, or off (proposed) | PostHog and Sentry, opt-in only (brief decision 12, D-003) |
| Speech models and packs | Local files | Staging manifest and staging pack path | Production manifest ([MODEL_HOSTING.md](MODEL_HOSTING.md)) |
| Remote config and kill switches | Bundled defaults | Staging config; switches drilled here first | Production config (D-035) |

### Bundle ID

Read from `apps/mobile/app.config.ts` and `packages/brand/index.ts` on 3 Oct 2026:

- `<id>` is `bundleId()`: the reversed `brand.publisher.domain` plus `.scribe`.
- Suffixes by `EXPO_PUBLIC_APP_ENV`: `development` adds `.dev`, `preview` adds `.preview`, `production` adds nothing.
- With the current `publisher.domain = 'earlyletters.com'`, `<id>` is `com.earlyletters.scribe`. The production value is the permanent App Store identity; do not change the domain after the first upload.
- Today an unset or unknown `EXPO_PUBLIC_APP_ENV` falls back to `production` in `app.config.ts`. Always set it explicitly per profile (it is, in `eas.json`).

### Environment variables

Public build values are set per EAS environment as `plaintext`. None is a secret ([SECRETS.md](SECRETS.md) rule 2).

| Variable | Local | Staging | Production | Status |
|---|---|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | `development` | `development` / `preview` | `production` | Exists |
| `EXPO_PUBLIC_SUPABASE_URL` | local CLI URL | `scribe-staging` URL | `scribe-prod` URL | Proposed |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | local key | staging publishable key | production publishable key | Proposed |
| `EXPO_PUBLIC_POSTHOG_KEY` | unset | staging project key or unset | production project key | Proposed |
| `EXPO_PUBLIC_SENTRY_DSN` | unset | staging DSN or unset | production DSN | Proposed |
| `SENTRY_AUTH_TOKEN` (build only, `secret`) | unset | optional | set | Proposed |

Server-side values (Edge Function secrets, Auth settings, database settings) are listed in [SECRETS.md](SECRETS.md). Database settings from `supabase/APPLY.md` steps 6 and 11 apply per project as written there.

## Domains

| Domain | Role | Registrar | Notes |
|---|---|---|---|
| `earlyletters.com` | Primary: website (Vercel), legal pages (`/terms`, `/privacy`, `/health-privacy`, `/subprocessors`), `/delete-account` (D-042), universal links, email | Porkbun | `hello@earlyletters.com` is the only verified live mailbox (Resend). |
| `earlyletters.app` | Redirects to `earlyletters.com` | Porkbun | Sends no mail. |
| Proposed `packs.earlyletters.com` | CDN host for manifests and packs | Porkbun DNS | Only if a custom domain is used for the pack host. |

DNS and mail hygiene checklist (founder, at Porkbun and Resend; tick each when done):

- [ ] `earlyletters.com`: SPF, DKIM (Resend records) and DMARC; move DMARC from monitoring to `quarantine`, then `reject`, once reports are clean (TDD 04 3.1).
- [ ] `earlyletters.app`: a null SPF (`v=spf1 -all`), a DMARC `reject` record and no MX, so nobody can send mail as it.
- [ ] No wildcard or parking records on either domain; only the records that are needed.
- [ ] CAA records naming only the certificate authorities in use (Vercel's, and the CDN's if any).
- [ ] DNSSEC on both domains if Porkbun and the DNS host support it (**Unverified**).
- [ ] Registrar lock and MFA on the Porkbun account.
- [ ] `apple-app-site-association` served from `https://earlyletters.com/.well-known/` for universal links.

## Promotion path

1. Pull request: CI runs unit tests, database tests (PGlite) and typecheck.
2. Merge to `develop`, then `develop` into `main`.
3. Staging: the deploy workflow applies new migrations to `scribe-staging`; the founder installs a `preview` build and runs the release checks.
4. Production: tag, approve the `production` environment, CI applies migrations to `scribe-prod` (RB-1); the app ships through RB-8.

A migration always reaches production before the app build that needs it, and stays compatible with the previous app build (expand, then contract; TDD 02 section 6.2).
