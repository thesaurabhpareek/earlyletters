# Secrets: where each one lives, who rotates it, what breaks if it leaks

Status: draft for the founder to read (SEC-R02, SEC-R03; BRIEF CI-SECRET). Names and places only: no value, host or project ref is written here, and none may be. The founder owns every row; the rotation steps are in `docs/ops/SECURITY.md` section 2 and `docs/ops/DEPLOY.md`. The repo's own scanner and the GitHub setting below are the two guards against a value reaching git.

## What the scan covers, and what it does not

| Guard | Covers | Does not cover |
|---|---|---|
| `node scripts/packs/secret-scan.mjs` (runs in `npm test -w apps/mobile` through `apps/mobile/test/secret-scan.test.ts`) | The tracked tree at HEAD: private key blocks (also an Apple `.p8`), `sb_secret_` keys, a JWT whose role is `service_role`, a service-role key variable with a value, an `EXPO_TOKEN` value, `sk-ant-` keys, GitHub tokens, Supabase `sbp_` tokens, Resend keys, AWS access key ids, the pack signing key, the R2 secret, PostHog `phx_` keys, OpenRouter `sk-or-` keys, a `*_SECRET` variable with a real-looking value, an Apple `.p8` body without its header. A bare environment reference (`process.env.NAME`) is not a value; `process.env.NAME || 'real value'` is. A placeholder counts only when the whole value is one. Output is file, line and rule name, never the value | Git history: a secret committed and later deleted is not found. Untracked and ignored files. A secret in an unknown format, split across a string concatenation or base64-wrapped |
| GitHub secret scanning with push protection (repository setting, founder only) | Known token formats at push time, and history | Anything GitHub does not know. Read back with `node scripts/founder/check.mjs` (needs his token) |

If either finds a real value: treat it as leaked, rotate it first, then follow `docs/ops/runbooks/suspected-data-leak.md`. Do not paste the value into an issue, a PR or a chat.

## The table

| Secret (name) | Lives in | Used by | Rotates | If it leaks |
|---|---|---|---|---|
| `EXPO_TOKEN` | GitHub Environments `app-store` and `testflight` | `release-ios.yml`, `testflight.yml` (EAS build and submit) | Founder: create a new robot token in the EAS account, set it, revoke the old | Someone can build and submit under the account. Revoke at once; check EAS build history |
| `ASC_REVIEW_CONTACT_JSON` | Environment `app-store` | `release-ios.yml` metadata job | Founder, when the review contact changes | A person's phone and email are exposed (personal data), no account access |
| `SUPABASE_DB_URL_PROD` | Environment `db-production` (reviewer approval) | `deploy-db.yml` production job | Founder: reset the database password in Supabase, set the new URL | Full read and write on production data. Rotate first, then review `ops.audit_log` |
| `SUPABASE_DB_URL_STAGING` | Environment `staging` | `deploy-db.yml`, `deploy-functions.yml` | Founder, as above | Full access to staging, which holds real alpha letters (`docs/release/ENVIRONMENTS.md`) |
| `SUPABASE_ACCESS_TOKEN_STAGING` | Environment `staging` | `deploy-functions.yml` | Founder: scoped token only, never a classic one (`docs/ops/DEPLOY.md`) | Can deploy Edge Functions to staging |
| `SUPABASE_STAGING_PROJECT_REF`, `SUPABASE_STAGING_URL`, `SUPABASE_STAGING_PUBLISHABLE_KEY` | Environment `staging` | Smoke steps | Not secret (public by design); stored as secrets so logs mask them | Nothing by itself |
| `SUPABASE_SECRET_KEYS` (`sb_secret_...`) and the legacy service role key | Injected into Edge Functions by Supabase; the founder's shell for `scripts/ops` | Edge Functions, `scripts/ops` | Founder: create a new key, update the scripts' environment, revoke the old (`SECURITY.md` 2.5) | Bypasses row security on that project. Never in the app or its build variables |
| `PURGE_WORKER_SECRET`, `TOKEN_KEK_V<n>`, `APPLE_SIGNIN_PRIVATE_KEY` (`.p8`), Resend and PostHog keys | Supabase function secrets (and `vault` for the first) | Purge worker, Apple token, email, analytics | Founder, yearly, per `SECURITY.md` 2.1 to 2.4 | Depends on the key: forged purge calls, or readable Apple refresh tokens |
| `NEW_DEVICE_SENDER_SECRET` (32+ chars), `DEVICE_HASH_KEY` (32+ chars), `DEVICE_HASH_KEY_NEXT` (only during an overlap rotation) | Supabase function secrets on the project that runs `new-device-email` | `new-device-email` only (cron bearer; device hash HMAC key) | Founder: set the next key, run one overlap, then promote it (the sender rekeys known devices, `docs/engineering/readiness-20nov/data-security/09-new-device-email-security-answers.md`) | A forged sender call, or device hashes that can be matched to a device id. A short or missing key makes the function answer unavailable before it takes any row |
| `EL_SIGNING_KEY` (primary and cold backup) | Founder's password manager and one offline copy | `scripts/packs/publish.ts` on the founder's machine only | Per `docs/ops/PACKS_HOSTING.md` (signing key custody and rotation) | An attacker could publish a pack the app trusts. The backup key lets publishing continue |
| `PACKS_S3_SECRET_ACCESS_KEY` (R2) | Founder's password manager and `~/.config/early-letters/` | `scripts/packs/publish.ts` | Founder: new R2 token, revoke the old | Can overwrite packs at the host; the signature still stops the app trusting a forged one |
| `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENROUTER_API_KEY`, `AGENTS_APP_PRIVATE_KEY` | Repository secrets | `claude.yml`, `agents.yml` | Founder, in each vendor's console | Spend on the account, and (for the app key) agent PRs under the app's identity |

Rules that hold for every row: environment secrets are released only to a job that names the environment; never create a repository-level secret with an environment secret's name; no secret in `apps/mobile` build variables (`docs/ops/PRODUCTION_VARIABLES.md`); no secret in a fixture, test or doc. Tests use the fictional family Asha and keys built at run time.

## Not verified here

Which of these exist today (the founder reads Settings > Environments and Secrets); whether secret scanning and push protection are on (needs his token); rotation dates (not recorded anywhere yet).
