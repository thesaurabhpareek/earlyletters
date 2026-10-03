# Secrets inventory

Owner: founder. Written 3 Oct 2026. Companion docs: [ENVIRONMENTS.md](ENVIRONMENTS.md), [RUNBOOKS.md](RUNBOOKS.md) (RB-4 rotates a leaked secret), [INCIDENT.md](INCIDENT.md), `docs/tdd/04-security-identity.md` section 3.9 (the design this inventory implements).

This file lists secret **names**, where each one lives, who owns it and how to rotate it. It never holds a value. If you are about to paste a value into this file, a commit, an issue, a pull request, a chat with an agent or a log, stop.

## Rules

1. **No service keys ship in the app** (brief decision 17). The app holds only public identifiers. It talks to Supabase with the publishable key and the signed-in user's JWT, and Row Level Security decides what it can read. A Supabase secret key (`sb_secret_...`) or legacy `service_role` key bypasses every RLS policy (Supabase API keys docs, read 3 Oct 2026), so it lives only in Edge Function secrets and, for runbooks, in a protected CI environment.
2. **Nothing secret goes in a variable whose name starts with `EXPO_PUBLIC_`.** Expo embeds those in the app bundle, and anything in client code is readable by anyone who runs the app (Expo environment variables docs, read 3 Oct 2026).
3. **One home per secret per environment.** Staging and production never share a value. A secret is copied only from its source console into its one home, never through a file in the repo.
4. **Project-scoped over account-wide.** CI gets a database connection string for one project, not a personal access token that can reach every project in the account.
5. **Every console has MFA** (GitHub, Supabase, Expo, Apple, Resend, Porkbun, Vercel, Cloudflare, Hugging Face, PostHog, Sentry). Passkeys or security keys where offered. Recovery codes live in the founder's password manager.
6. **The founder's password manager is the system of record** for anything that has no platform store (signing keys, recovery codes, the consent pepper). Status of a sealed offline backup copy and a named backup person: not set up yet (founder decision).
7. **Agents never hold production write credentials.** Agent sessions work on branches and pull requests; anything that changes a live system is done by the founder or by CI behind an approval.

## Where secrets can live

| Store | What it is for | Notes |
|---|---|---|
| GitHub Environments `staging`, `production` | CI deploy jobs (database migrations, later EAS builds) | `production` gets a required reviewer (the founder) and is limited to protected branches and tags. Whether required reviewers are available for this repository's visibility and plan: **Unverified**, check before relying on it. |
| EAS environment variables (`development`, `preview`, `production`) | Build-time values for the app | Visibility levels `plaintext`, `sensitive` (obfuscated in logs) and `secret` (not readable outside EAS servers). Set with `eas env:set --name ... --environment ... --visibility ...` (eas-cli README, read 3 Oct 2026). |
| EAS credentials | iOS distribution certificate, provisioning profiles, App Store Connect API key | Managed by `eas credentials`. |
| Supabase Edge Function secrets (per project) | Server-side keys used by functions | `supabase secrets set NAME=...`, `supabase secrets list`. Functions read a new value without a redeploy (Supabase docs, read 3 Oct 2026). Defaults injected by the platform: `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS`, and legacy `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. |
| Supabase dashboard settings (per project) | Auth provider secrets, SMTP credentials, database password, JWT signing keys | Not exportable to the repo. |
| Founder password manager | Signing keys, recovery codes, pepper, console logins | Never synced to a shared vault without a decision. |

## Inventory

"Proposed" means the name is the convention this repo will use; the code or workflow that reads it does not exist yet. When the workflow lands, it is the source of truth for the exact name; update this table in the same pull request.

### Public identifiers (not secrets)

Listed so secret scanners can allowlist them and nobody treats them as sensitive by mistake. They still differ per environment.

| Name | Home | Status |
|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | `apps/mobile/eas.json` per profile; `apps/mobile/.env.development` locally | Exists |
| `EXPO_PUBLIC_SUPABASE_URL` | EAS env, `plaintext` | Proposed |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) | EAS env, `plaintext` | Proposed |
| `EXPO_PUBLIC_POSTHOG_KEY` (project key, ingestion only) | EAS env, `plaintext` | Proposed |
| `EXPO_PUBLIC_SENTRY_DSN` | EAS env, `plaintext` | Proposed |
| Pack and config manifest public keys (`MANIFEST_PUBKEY_<keyid>`) | Bundled in the app source | Proposed ([MODEL_HOSTING.md](MODEL_HOSTING.md)) |
| Google OAuth client ids | Supabase Auth settings, app config | Proposed (Google sign-in timing: brief decision 4 versus D-044) |

### Secrets

| Name | What it unlocks | Home | Owner | Rotation | How to rotate |
|---|---|---|---|---|---|
| Supabase secret key (`sb_secret_...`), per project | Bypasses RLS: all data | Edge Functions (injected as `SUPABASE_SECRET_KEYS`); GitHub Environment secret `SUPABASE_SECRET_KEY` only if a runbook job needs it (proposed) | Founder | 180 days; on staff change; immediately on suspicion | Dashboard > Project Settings > API keys: create a new secret key, replace it in every home, confirm nothing uses the old one, delete the old one (deletion is irreversible). Supabase API keys docs, read 3 Oct 2026. |
| Legacy `service_role` JWT, per project | Same as above | Injected into Edge Functions | Founder | Prefer not to use; disable once nothing reads it | Moving to `sb_secret_` keys is the rotation path. Exact steps to disable legacy keys: **Unverified**, read the current Supabase docs first. |
| Database password, per project | Direct Postgres access as owner | Founder password manager | Founder | 180 days; on suspicion | Dashboard > Database settings > reset password, then update `SUPABASE_DB_URL` below. |
| `SUPABASE_DB_URL` (CI), per environment | Applies migrations to one project | GitHub Environment secret in `staging` and `production` (proposed name; the deploy workflow decides) | Founder | With the database password | Rebuild the connection string from the new password; `gh secret set SUPABASE_DB_URL --env production`. |
| Supabase personal access token | Every project in the account | Not stored anywhere persistent. Create short-lived for a one-off task, then delete. | Founder | Single use | Dashboard > Account > Access tokens: delete. |
| JWT signing keys, per project | Mints valid user sessions | Supabase managed | Founder | Yearly; kill switch for "sign everyone out" | Create a standby key, Rotate (new tokens use it; existing unexpired tokens stay valid, so nobody is signed out), then Revoke the previous key after token expiry plus a margin. To force everyone out, revoke without waiting. Supabase signing keys docs, read 3 Oct 2026. |
| `app.consent_pepper` (database setting today; Vault or function secret later per TDD 04) | Re-identifies pseudonymised consent records | Database setting per project; copy in the founder password manager | Founder | **Never.** Old and new hashes would stop matching (supabase/APPLY.md step 6) | Not rotated. If exposed, treat as an incident and ask counsel what the exposure means. |
| `CODE_PEPPER` (invite codes) | Offline guessing of invite codes from a database copy | Edge Function secret | Founder | On suspicion | New value; outstanding invites must be reissued. Proposed (TDD 04). |
| Resend API key(s), per environment | Sends mail as the domain | Supabase Auth custom SMTP settings (as the SMTP password) and Edge Function secret `RESEND_API_KEY` (proposed) | Founder | 180 days | Resend dashboard: create a new key with sending access for the one domain only, replace in Supabase, send a test magic link, delete the old key. |
| Sign in with Apple key (`.p8`), Services ID, Key ID, Team ID | Apple client secret for web or server token exchange | Supabase Auth Apple provider settings or Edge Function secrets | Founder | Client secret JWT expires in at most 6 months (TDD 04, A-NFR-009); key yearly | Apple Developer > Keys: create a new key, update Supabase, revoke the old key. Whether native-only sign-in needs the `.p8` at all: **Unverified** until the auth work lands. |
| Google OAuth client secret (web client) | Google sign-in through Supabase | Supabase Auth Google provider settings | Founder | Yearly; on suspicion | Google Cloud console: add a new secret, update Supabase, delete the old one. Only once Google sign-in ships. |
| APNs key (`.p8`) | Push notifications to the app | EAS credentials (if Expo push) or Edge Function secret (if direct) | Founder | Yearly; on suspicion | Apple Developer > Keys. Push design not final; **Unverified** which home. |
| App Store Connect API key (`.p8`, Key ID, Issuer ID) | Uploads builds, edits app metadata | EAS credentials (for `eas submit`) | Founder | Yearly | App Store Connect > Users and Access > Integrations: create, update EAS, revoke old. |
| iOS distribution certificate and profiles | Signs release builds | EAS credentials | Founder | When Apple expires them | `eas credentials`. |
| `EXPO_TOKEN` (robot user) | Starts EAS builds from CI | GitHub Environment secret, only when CI builds the app | Founder | 180 days | Expo dashboard > Access tokens: create for a robot user with the least role, replace, revoke old. |
| `SENTRY_AUTH_TOKEN` | Uploads source maps at build time | EAS env, `secret` | Founder | 180 days | Sentry: create an org token scoped to releases, replace, revoke old. |
| `POSTHOG_PERSONAL_API_KEY` | Deletes a person's events (deletion requests) | Edge Function secret (proposed) | Founder | 180 days | PostHog: create a key scoped to the one project, replace, revoke old. |
| Manifest signing private key (`MANIFEST_SIGNING_KEY_<keyid>`) | Makes the app trust a pack, model or content manifest | Founder password manager; never CI until a decision says otherwise | Founder | Yearly; on suspicion | Generate a new key pair, ship the new public key in an app release, sign with both during overlap, retire the old key id. See [MODEL_HOSTING.md](MODEL_HOSTING.md). |
| Cloudflare R2 access key (write) | Uploads packs to the bucket | Founder machine or a GitHub Environment secret for a publish job | Founder | 180 days | Cloudflare: create a token scoped to the one bucket, replace, revoke old. Only if R2 is chosen. |
| Hugging Face token (write) | Publishes public model mirrors | Founder machine | Founder | 180 days | Hugging Face settings > Access tokens. Read-only downloads need no token. |
| Porkbun API key | DNS changes for both domains | Not created. Make DNS changes in the dashboard. | Founder | n/a | If one is ever created: delete it after use. |
| AI provider keys (`GROQ_API_KEY`, `DEEPINFRA_API_KEY`) | Server transcription and edit pass | Edge Function secrets | Founder | 90 days | Provider console. v1.1 or later; not in v1.0 (brief decision 9, ARCHITECTURE status box). |
| Backup key-encryption key (`ESCROW_KEK_V<n>`) | Unwraps backed-up audio keys | Edge Function secrets plus a sealed offline copy | Founder | Yearly; on suspicion, with a re-wrap job | TDD 04 section 3.6. Not in v1.0: no audio upload in v1.0 (brief decision 9). |

### Removed by founder decision

Do not create these. If one exists in any console, delete it.

- App Store Server Notifications endpoint secrets and App Store Server API keys for entitlement checks: no server of ours sees purchases (brief decision 3). The entitlement check is on the device.
- RevenueCat keys: no RevenueCat (brief decision 3).

## Console accounts

| Console | Used for | MFA | Notes |
|---|---|---|---|
| GitHub (`thesaurabhpareek`) | Code, CI, environments | Required | Secret scanning and push protection on. |
| Supabase | Database, auth, functions | Required | Projects move to a new "Early Letters" organisation (not created yet). |
| Expo / EAS | Builds, credentials, env vars | Required | |
| Apple Developer and App Store Connect | Signing, TestFlight, release | Required (Apple ID two-factor) | Individual account (brief decision 14). |
| Resend | Email for both environments | Required | `hello@earlyletters.com` is the only verified live address. |
| Porkbun | `earlyletters.com`, `earlyletters.app` | Required | Registrar lock on both domains. |
| Vercel | Website | Required | |
| Cloudflare, Hugging Face | Pack hosting (if chosen) | Required | |
| PostHog, Sentry | Analytics, crashes (opt-in) | Required | |

## Review

Once a quarter: walk this table, confirm each secret still has exactly one home per environment, delete anything unused, and check the rotation dates. Record the review date here.

| Date | Reviewer | Notes |
|---|---|---|
| | | |
