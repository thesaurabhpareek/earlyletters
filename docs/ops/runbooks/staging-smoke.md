# Runbook: the staging smoke check (RA-07-06)

`scripts/ops/staging-smoke.ts` runs after every staging deploy (docs/release/AUTOMATION.md 2.2) and by hand after AF-13's seeding. It answers one question: is staging set up the way the alpha needs, without reading anyone's data? Exit 0 is green, 1 is red, 2 is a usage mistake (nothing was sent) or an unexpected stop, which prints one fixed line and never the error (an error message could quote a decoded credential).

## What it checks, and what to do when a line is red

| Check | How (all content-free) | When it fails |
|---|---|---|
| `policy version terms`, `policy version sensitive-data` | Anonymous Data API read of `policy_versions`, columns `document, version, effective_at` only (anon may read it: policy `policy_versions_read`) | Publish the versions the consent gate reads (supabase/APPLY.md step 8). "No version in effect" means `effective_at` is in the future. A refused read (401 or 403) on a project created without Supabase's automatic grants (every project made since 30 May 2026) means the explicit grants are missing: supabase/APPLY.md "Hosted checks before the first apply" a), and file 25 (`20261023060000`) |
| `consent pepper` | Postgres compares the length of `app.consent_pepper` with 32 and answers true or false; the value never leaves the database | supabase/APPLY.md step 6 |
| `statement logging` | `log_statement` (none or ddl), `log_min_duration_statement` (-1), `pgaudit.log` (none, ddl or role) and any per-role or per-database override of the three | Turn it off (docs/ops/SECURITY.md section 4; ask Supabase support if the dashboard does not show it). Otherwise letter text sent to `sync_push` can reach Postgres logs |
| `cron <job>` | `cron.job` names, schedules and active flags of the `scribe-*` jobs only (never `command`) | `scribe-purge-due`: APPLY.md step 7. `scribe-sync-housekeeping`: step 15. `scribe-purge-worker`, `-daily`: supabase/cron/purge-worker.sql. "No USAGE on schema cron": the database role cannot read the jobs (the pepper and logging lines are still reported) |
| `function <name>` | `GET /functions/v1/<name>/health` must answer 200 with `{ok: true, data: {status: "ready"}}` (supabase/functions/_shared/health) | 404: not deployed, or an old deploy without the route. 503 with the envelope: deployed but a required secret is missing (SECURITY.md). Other 5xx: it did not start; read the function's logs. 401 from a function develop deploys with `--no-verify-jwt` (`config`, `content`, `purge-worker`): it was deployed with JWT verification by mistake. 401 from a function that keeps the gateway check: red, unless you named it in `--expect-unchecked` (see below) |
| `auth health`, `sign-up`, `sign-in providers` | `GET /auth/v1/health` and the public `GET /auth/v1/settings`: `disable_signup` and the provider flags. No account is created, no email is sent | Authentication > Sign In / Providers |

`NOT CHECKED` lines are listed, never hidden, and are not evidence. Only the caller can ask for one: `--no-db`, `--db-only`, or `--expect-unchecked <names>` for a function whose route this run cannot read, because it keeps the gateway's JWT check (`apple-token`, `analytics-forget`, `invite-redeem`, `subscription-status`) or has no health route yet. A gateway may answer 401 before it looks a function up, so an unreadable route proves nothing about whether the function exists: **an unreadable function not named in `--expect-unchecked` is red**, and a named one says plainly where its presence was confirmed: "presence confirmed only by the deploy job's function list (--deployed)" when `--deployed` lists it, otherwise "presence not confirmed by this run or anywhere else". `--deployed <names>` takes the deploy job's own `supabase functions list`; a checked function missing from it is red. A named function that is plainly missing (404) or failing (5xx) is still red.

What it never does: read a table holding people's data, print a response body, URL, key, row or psql message, follow a redirect, send an Authorization header, or write anything. It refuses a secret or service-role key (the reads must be anonymous), a database URL that belongs to another project, holds a control character, or does not require TLS (`sslmode` may only be `require`, the default, `verify-ca` or `verify-full`). Postgres statements run inside `begin transaction read only` with a 5 second timeout; psql errors are reduced to their SQLSTATE. It reads no person's data, so it writes no `ops.audit_log` row.

## Run it by hand

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_PUBLISHABLE_KEY=<the publishable key the builds use> \
SUPABASE_DB_URL='<the staging Postgres URL, as in SUPABASE_DB_URL_STAGING>' \
node scripts/ops/staging-smoke.ts --project-ref <ref> --expect-unchecked apple-token
```

`--expect-unchecked apple-token` because it keeps the gateway check and has no health route yet; drop it once its route is readable. Without it the run is red on `apple-token` by design.

Node 22 and `psql` (PostgreSQL client), no `npm install`. Options: `--functions config,content,purge-worker` (default adds `apple-token`), `--expect-unchecked` and `--deployed` (above), `--providers email,apple`, `--signups closed` (the staging stop rehearsal, AUTOMATION.md 2.10: green only while sign-ups are off), `--no-db` (function deploys, which hold no database URL), `--db-only` (database deploys: policy versions, pepper, logging and cron, no function or Auth request), `--attempts 1..5` (function health retries on no answer, that is a timeout or network error, and on 502, 503, 504 and 546; each attempt waits up to 10 seconds, 2 seconds apart, so one hung function takes up to about 34 seconds at the default 3), `--summary "$GITHUB_STEP_SUMMARY"` (a Markdown table with the same lines). The output is safe to paste into a ticket or PR.

## The planted failure (QA re-review; record it under RA-19-03)

Every pull request runs it: `scripts/ops/test/smoke.test.ts`, test "planted failure", runs the smoke against a stand-in scratch project with no policy versions and a stopped `purge-worker` and expects exit 1 with exactly those three lines red, then green once seeded.

The live plant is for the founder or S19 (agents do not create projects, deploy or hold keys):

1. Create a scratch Supabase project. Never staging or production.
2. Apply the migrations (`supabase db push --db-url '<scratch URL>'`). Set the pepper (APPLY.md step 6) and schedule the cron jobs (steps 7 and 15, supabase/cron/purge-worker.sql), but do **not** do step 8: no policy versions.
3. Deploy `config`, `content` and `purge-worker` with their secrets (docs/ops/README.md "Going live"), then stop one: `supabase functions delete purge-worker --project-ref <scratch>`.
4. Run the smoke against the scratch project (`--functions config,content,purge-worker`). Expected: exit 1; red lines for `policy version terms`, `policy version sensitive-data` (none published) and `function purge-worker` (404).
5. Insert the two policy versions (step 8) and redeploy `purge-worker`; run again. Expected: exit 0.
6. Paste both outputs into the RA-19-03 evidence and delete the scratch project.

## Known limits

- Functions that keep gateway JWT verification on develop (`apple-token`, `analytics-forget`, `invite-redeem`, `subscription-status`) cannot show their health route without a session: name them in `--expect-unchecked` (NOT CHECKED) or the run is red. The smoke never asks to change that posture: whether any function moves to `--no-verify-jwt` is S01's call, per function, and until S01 decides each stays as on develop. Supabase documents that `verify_jwt` works only with the legacy JWT keys; what that means for a staging that turns the legacy keys off is also S01's question (Unverified on staging).
- The database reads use the deploy job's credential (`SUPABASE_DB_URL_STAGING`, the `postgres` owner): both statements are fixed and read only. Once S02's catalog-only lint role exists (AUTOMATION.md 2.8), move to it; if that role cannot read `cron.job`, the cron line says so and the pepper and logging lines still report.
- Unverified until the first staging run: whether the gateway answers 404 or 401 for a function that does not exist when no Authorization header is sent (either way a missing function cannot pass: a 401 is red unless named in `--expect-unchecked`, and a named one is reported as unconfirmed), and that the pooler accepts psql's read-only transaction (it uses no startup options).
