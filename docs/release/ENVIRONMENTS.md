# Environments

Owner: S20 (release), founder for every dashboard. Updated 15 Oct 2026 for the alpha (D-106). Supersedes the 3 Oct draft on PR #35 (`docs/ops-runbooks`), which described an on-device v1.0. Decisions: D-041 (migrations reach hosted projects only through CI), D-097 (pack host), D-100 (server features on in v1.0, after the R-17 gate), D-106 (alpha against staging). Companion docs: [DEPLOY.md](../ops/DEPLOY.md), [AUTH_SETUP.md](../ops/AUTH_SETUP.md), [DOMAINS.md](../ops/DOMAINS.md), [SECURITY.md](../ops/SECURITY.md), [../release/TESTFLIGHT.md](TESTFLIGHT.md).

## Status on 15 Oct 2026

- Neither hosted project exists yet: `scribe-staging` and `scribe-prod` in the "Early Letters" organisation are founder steps (DEPLOY.md, TESTFLIGHT.md step 6). The old project `early-letters` is slated for retirement and nothing points at it.
- **The alpha runs against staging** (D-106): alpha build 2 (`preview` profile) signs the founder's family in on `scribe-staging`. Staging therefore holds **real family letters** for the length of the alpha. See "Staging during the alpha".
- Production stays unbuilt until the store submission is re-planned after the alpha (D-106). The `production` profile keeps server features off.
- Updated 23 Oct: migrations reach staging from `develop` only (`.github/workflows/deploy-db.yml`, since #205 on 18 Oct): a push to `develop` that changes migrations, or the manual catch-up run on `develop`, after the `staging` reviewer approves. A push to `main` deploys nothing to a database. Build 2 has a schema to talk to once the first such run is approved and has pushed (TESTFLIGHT.md step 6).

## Build profiles and switches

Every switch is written out in every profile of `apps/mobile/eas.json`; `apps/mobile/test/config.test.ts` and `capabilities.test.ts` hold them. Only `on` is on (`apps/mobile/src/lib/capabilities.ts`); a build flag also needs the server switch.

| Profile | Use | Distribution | `EXPO_PUBLIC_APP_ENV` | Bundle id | EAS environment | `SERVER_FEATURES` | `BACKUP` | `STATUS_REPORT` | `ANALYTICS` |
|---|---|---|---|---|---|---|---|---|---|
| `development` | dev client on the founder's desk | internal | `development` | `<id>.dev` | development | off | off | off | off |
| `testflight` | **alpha build 1**, store lane after the R-17 flip | store (TestFlight) | `preview` | `<id>.preview` | preview | **off** until the R-17 gate (one-line flip, TESTFLIGHT.md) | off | off | off |
| `preview` | **alpha build 2**, against staging | store (TestFlight) | `preview` | `<id>.preview` | preview | **on** | off | off | off |
| `production` | the App Store app, later | store | `production` | `<id>` | production | off | off | off | off |

Both alpha profiles share the update channel `preview`. Nothing uses it today (`expo-updates` is not installed); give each profile its own channel before adding over-the-air updates, or an update made for build 2 would reach build 1 with build 2's switches.

`<id>` is `bundleId()` from `packages/brand` (`com.earlyletters.scribe`). An unset `EXPO_PUBLIC_APP_ENV` means development and an unknown value fails the config (`src/lib/build-env.ts`), so no build gets the production id by accident. Local `expo start` reads `apps/mobile/.env.development` (development, every switch off); personal overrides go in the git-ignored `.env.development.local`.

## Where each value lives

Nothing secret is in the repository. The app's project values are public by design (row-level security is the authority) but are still never committed: they live in EAS environment variables, set by the founder.

| Value | Where | Who sets it | Notes |
|---|---|---|---|
| The five switches and `EXPO_PUBLIC_DOCS_BASE_URL` (`https://packs.earlyletters.app`, D-097) | `apps/mobile/eas.json`, per profile | PR (S20; flips are founder merges) | Not secret |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | EAS environment variables, environment `preview` (staging values), later `production` | Founder, TESTFLIGHT.md step 9 | Publishable (anon) key only. The `testflight` profile shares the `preview` environment; with its switch off it constructs no client, but the values are inlined in its bundle, so a secret key there would ship in build 1 too (the preflight fails on one in either profile) |
| `EXPO_PUBLIC_EMAIL_OTP_LENGTH` | EAS environment variable, only if not 6 | Founder | Must equal Supabase's Email OTP length |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | EAS environment variables | Founder, later (FT-15) | Not in the alpha: Apple and email only |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_SENTRY_DSN` | not set | none | Analytics is off in every profile; nothing reads them |
| `extra.eas.projectId`, `owner` | `apps/mobile/app.config.ts` | PR after `eas init` (BL-339) | Not secret |
| Supabase service role or secret key | Supabase only; CI through a protected GitHub Environment | Founder | Never in the app, EAS, a script or a chat |
| `SUPABASE_DB_URL_STAGING`, `SUPABASE_DB_URL_PROD` | GitHub Environment secrets `staging`, `db-production` (never `production`, which resolves to Vercel's `Production`, SR-2) | Founder, DEPLOY.md step 2 | Session pooler URLs |
| Auth SMTP key (`supabase-auth-smtp`), function key `RESEND_API_KEY` | Supabase Auth SMTP settings; staging function secrets | Founder, FT-12, FT-11, FT-13 | Two different sending-only Resend keys |
| Sign in with Apple `.p8`, Key ID, Team ID | Password manager; later the `apple-token` function's secrets | Founder, FT-07 | Downloadable once |
| `APPLE_TEAM_ID`, `IOS_BUNDLE_ID` | Vercel project, Production environment (website) | Founder, TESTFLIGHT.md step 10 | `IOS_BUNDLE_ID` is the production id; the site adds `.preview` |
| Pack signing keys (secret halves) | Password manager only | Founder, FT-16 | Public halves in `packages/api/src/keys.ts` |
| `EXPO_TOKEN` | GitHub Environment secret `testflight` (branch `develop` only; FT-20) | Founder, TESTFLIGHT.md step 3 | From an Expo robot user. Read only by the build step of `.github/workflows/testflight.yml`, whose build job runs in that environment (RA-20-06a). The interim repository secret of the same name is deleted after the first green run with this one (AF-22) |
| iOS distribution certificate and profile, App Store Connect API key | EAS credentials for the project | Founder, TESTFLIGHT.md steps 2.6 and 5 | Builds and submits run in GitHub Actions or on the founder's computer, never in an agent sandbox |
| `submit.<profile>.ios.ascAppId` | `apps/mobile/eas.json` | PR after step 2.4 | The app record's Apple ID; not secret |

## Matrix

| | Local | Staging | Production |
|---|---|---|---|
| Purpose | Developing on one machine | The alpha (D-106), integration, release rehearsal | Real families after the store release |
| Data | Fictional "Asha" fixtures only | **During the alpha: the founder's family's real letters.** Otherwise synthetic "Asha" families only | Real families |
| Supabase | `supabase start` or PGlite for `npm run test:db` | `scribe-staging` (not created yet) | `scribe-prod` (not created yet) |
| Schema changes | The developer | CI only (D-041), from `develop` only: a push to `develop` that changes migrations, or the manual catch-up run on `develop`, through the GitHub Environment `staging`; a push to `main` deploys nothing | CI on a `db-v*` tag on a commit on `main`, through the GitHub Environment `db-production` |
| App builds | `expo start`, `development` | `testflight` (build 1, switch off), `preview` (build 2, switch on) | `production` |
| Distribution | Simulator or dev client | TestFlight internal groups: "Family" (build 2), "Friends" (build 1 until the R-17 gate) | TestFlight external, then the App Store |
| Universal links | none | `https://earlyletters.com` serves the `.preview` id too | `https://earlyletters.com` |
| Email sender | the CLI's mail viewer | Resend through Supabase Auth SMTP, `hello@earlyletters.com` | Same, production key |
| Analytics and crash reporting | Off | Off | Off (the analytics switch returns with consent later) |
| Packs, models, signed documents | Local files | `https://packs.earlyletters.app` (one host, D-097) | Same host |
| Remote config and kill switches | Bundled defaults | Signed documents from the pack host once FT-16's keys ship; drills here first | Same |

## Staging during the alpha

While real letters are on `scribe-staging` (from the first build 2 sign-in until the alpha ends and the accounts are moved or deleted):
- Only the founder has dashboard and database access. No shared logins, no agent access to its data.
- No load tests, no fixture seeding, no `db reset`, no restore drills against it. Those wait for a second, synthetic staging or for production.
- Deletion works end to end (TESTFLIGHT.md step 12) before anyone can use Delete account.
- The spend cap is on, statement logging stays off (FT-10 step 9), and the access rules are the same as production's.
- When the alpha ends, the founder decides whether these accounts move to production or are deleted; record it in `docs/DECISIONS.md`.

## Universal links

The website serves `/.well-known/apple-app-site-association` from `apps/web/src/app/.well-known/apple-app-site-association/route.ts` on `main`, built from `APPLE_TEAM_ID` and `IOS_BUNDLE_ID`: the app ids `<TEAMID>.<id>` and `<TEAMID>.<id>.preview`, and only the paths `/auth/confirm`, `/auth/callback` (until the app and email templates move to `/auth/confirm`) and `/j` (invites, token in the fragment as `/j#t=<token>`; the older `/i/<token>` form is no longer written, accepted or listed). `docs/ops/well-known/apple-app-site-association` is a reference copy of what it serves. The `.dev` id and the `webcredentials` block (passkeys, AUTH_SETUP 7) are left out until something uses them. `earlyletters.app` only redirects and never serves the file.

## Promotion path

1. Pull request: CI runs the unit, database (PGlite) and typecheck jobs.
2. Merge to `develop`. Staging gets the migrations from that push, after the `staging` reviewer approves (`deploy-db.yml`), and the founder builds `preview` for the family.
3. After the R-17 gate: the one-line `testflight` flip, and friends get servers-on builds.
4. Production: re-planned after the alpha (D-106). A migration always reaches production before the app build that needs it, and stays compatible with the previous build (expand, then contract).
