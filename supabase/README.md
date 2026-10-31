# supabase

The database schema and access rules, the Edge Functions, and the Auth email templates.

## What is in it

| Path | What |
|---|---|
| `migrations/` | Schema and row-level security, one file per change, in filename order |
| `tests/` | Access-rule and behaviour tests, run in embedded Postgres. `run.mjs` is the runner |
| `functions/` | Edge Functions: config, content, escrow, invite-redeem, subscription-status, purge-worker, analytics-forget, apple-token. `_shared` holds common code |
| `templates/` | Generated Supabase Auth email templates. See `templates/README.md` |
| `cron/purge-worker.sql` | Schedule for the purge worker. Not a migration. Run by hand once per project |
| `APPLY.md` | Founder runbook: which migrations are applied, which are pending, and the steps |
| `auth-email.md` | Runbook for Supabase Auth email through Resend |
| `config.toml` | Supabase CLI config |

## Commands

```bash
npm run test:db                 # every supabase/tests/*.test.mjs
npm run test:db -- perf         # only files whose name contains "perf"
npm run test:functions          # Edge Function and ops script tests (Deno via npx)
```

## Rules

Contracts and endpoint standards: `../packages/api/README.md` and `../docs/adr/0017-api-standards.md`. Sync: `../docs/adr/0025-sync-protocol-v1.md`.

## Do not

- Do not edit a migration that has been applied. Add a new migration file.
- Do not edit `templates/*.html` by hand. Change the copy or components and regenerate.
- Do not put entry text, transcripts, audio or child names in logs. Use `functions/_shared/log`.
- Do not add a server table for safety tiers. They stay on the device.
- Do not touch `supabase/` or Auth settings from an unattended agent run. A person applies it.
