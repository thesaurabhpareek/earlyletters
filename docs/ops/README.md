# Operations: deletion pipeline, privacy operations and infrastructure

Owner: server and privacy-operations engineer. Written 3 Oct 2026 for the founder.
Labels: **Verified** means checked on an opened vendor page or in installed library source on 3 Oct 2026. **Assumption** means believed, not checked. Nothing here has been run against the live project, DNS or Resend.

## What is in this folder

| File | For |
|---|---|
| [SECURITY.md](SECURITY.md) | Every secret and who holds it, key rotation, least privilege, the Supabase settings checklist, the Sign in with Apple key for token revocation |
| [DOMAINS.md](DOMAINS.md) | earlyletters.com and earlyletters.app at Porkbun: account security, every DNS record, DMARC plan, CAA, Vercel, packs CDN, universal links, addresses, security.txt |
| [well-known/](well-known/) | Files the website must serve: `apple-app-site-association`, `security.txt` |
| [runbooks/stuck-deletion.md](runbooks/stuck-deletion.md) | An account deletion that has not finished |
| [runbooks/purge-failing.md](runbooks/purge-failing.md) | The purge or the worker is not running, or Storage deletes fail; installing the schedule |
| [runbooks/incident-notification.md](runbooks/incident-notification.md) | Who was affected, notification clocks and email templates (LEGAL-REQ-039) |
| [runbooks/restore-drill.md](runbooks/restore-drill.md) | Quarterly restore drill, and what to do after a real restore (DATA-REQ-030, -031) |
| [runbooks/suspected-data-leak.md](runbooks/suspected-data-leak.md) | First hour of a suspected exposure |
| AUTH_SETUP.md, APP_STORE_CONNECT_SUBSCRIPTIONS.md, APP_SIZE.md | Other owners (sign-in, subscriptions, app size) |

## The deletion pipeline in one picture

```
App: Settings > Delete account ──► request_account_deletion()  (letters tombstoned, sole-parent books tombstoned)
  │                                   │
  └─► analytics-forget/v1 ──► PostHog bulk delete of this phone's analytics ids (never stored on our side)
                                      │  day 0 to 30: Cancel deletion restores everything
pg_cron hourly: purge_due() ──────────┤  day 30: letters and books purged, request -> executing
pg_cron every 15 min: purge-worker ───┘
   1. purge_due() in batches of 500 while "more"
   2. Storage queue drained through the Storage API (every registered bucket)
   3. emails: request receipt, cancellation receipt, "save a copy" notices
   4. account steps, in order, each retried 1 min to 6 h for 7 days:
      prepare -> storage (incl. ownership sweep) -> Apple token revoke -> posthog (n/a) ->
      powersync (n/a) -> Resend contact -> completion receipt -> Auth user -> verify -> finalize
   5. SLA check -> at most one content-free alert email a day per condition to hello@
pg_cron daily 03:17 UTC: purge-worker {"task":"daily"} -> purge ledger copied to the ops-ledger bucket, ops retention
```

Code: `supabase/functions/purge-worker/`, `supabase/functions/analytics-forget/`, logger `supabase/functions/_shared/log/`, SQL `supabase/migrations/20261004200000_ops_deletion_worker.sql`, schedule `supabase/cron/purge-worker.sql`, scripts `scripts/ops/`, app screen `apps/mobile/src/app/settings/delete-account.tsx` with `apps/mobile/src/lib/account-deletion/`.

## Going live, in order

Do these on staging first, then production. Each step's checks are in the linked file.

1. **Apply the migrations** in order with `supabase/APPLY.md`, then `20261004200000_ops_deletion_worker.sql` the same way (`begin;`, paste, `commit;`, then record it in `supabase_migrations.schema_migrations`). Check: `select public.ops_schema_health();` (as the service role, in the SQL editor) returns all zeros.
2. **Never expose the `ops` schema**: Project Settings > Data API > Exposed schemas stays `public` (and `graphql_public` if listed). See SECURITY.md section 4.
3. **Set the function secrets** (SECURITY.md section 1): `PURGE_WORKER_SECRET`, `RESEND_API_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, and once Sign in with Apple ships, `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY`, `TOKEN_KEK_V1`.
   ```bash
   npx supabase secrets set --project-ref <ref> PURGE_WORKER_SECRET=<value> RESEND_API_KEY=<value> ...
   ```
4. **Deploy the functions** (Supabase CLI 2.13.3 or later; `--use-api` bundles files imported from `packages/`, **Verified**: Supabase changelog 33613):
   ```bash
   npx supabase functions deploy purge-worker --project-ref <ref> --no-verify-jwt --use-api
   npx supabase functions deploy analytics-forget --project-ref <ref> --use-api
   ```
   `--no-verify-jwt` on the worker only: its caller presents a shared secret, not a JWT. analytics-forget keeps the gateway check and also checks the session itself.
5. **Schedule the worker**: run `supabase/cron/purge-worker.sql` in the SQL editor with the three placeholders filled. Keep the hourly `scribe-purge-due` job from APPLY.md step 7 as a backstop.
6. **Check after 20 minutes** (runbooks/purge-failing.md "Healthy looks like").
7. **Staging only, before the first build to anyone outside the family (G2 gate, TDD 05 9.4):** delete a fixture account end to end and run `scripts/ops/verify-deletion.ts` (runbooks/stuck-deletion.md section 5).

## Tests

```bash
npm run test:db                                                              # SQL, incl. supabase/tests/ops_deletion_worker.test.mjs
npx -y deno@2.9.6 test --no-prompt --allow-read \
  supabase/functions/purge-worker supabase/functions/analytics-forget \
  supabase/functions/_shared/log scripts/ops                                 # functions, logger, log canary, ops scripts
(cd apps/mobile && npx vitest run --config src/lib/account-deletion/vitest.config.ts)   # delete-account logic
```

Deno comes from npm (`npx -y deno@2.9.6`, about 40 MB on first run); no global install. The Edge Functions use Deno's built-in `node:assert` and no remote imports, so tests run offline after the first download.

## Facts and assumptions this design rests on

| Item | Status |
|---|---|
| Storage list, remove, copy and download routes; Auth admin delete with `should_soft_delete` | Verified in installed `@supabase/storage-js` and `auth-js` 2.117.2 source |
| Supabase refuses to delete an Auth user who owns Storage objects | Verified in DELETION spec [D6]; handled by the ownership sweep |
| Apple revoke endpoint, form fields, 200 when revoked or already revoked | Verified (Apple, "Token revocation") |
| Apple client secret claims and ES256 | Verified on Apple's client-secret page for its sister API; same format for Sign in with Apple (Assumption that nothing differs) |
| PostHog `persons/bulk_delete/` with `distinct_ids`, `delete_events`, 1000 ids, `person:write`, 202 | Verified (posthog.com/docs/api/persons) |
| Resend send with `Idempotency-Key` (24 h), `DELETE /contacts/{email}`, 30-day data retention | Verified (resend.com docs); 404 for an unknown contact is an Assumption |
| pg_cron plus pg_net plus Vault pattern | Verified (Supabase "Scheduling Edge Functions"); `timeout_milliseconds` parameter name is an Assumption from pg_net docs |
| `EdgeRuntime.waitUntil` keeps work running after the 202 | Assumption (Supabase background tasks); if absent the handler simply waits for the run |
| Edge Function wall clock 150 s (Free) or 400 s (paid) | Assumption (TDD 02); the worker stops starting work at 110 s |
| R2 custom domains need the zone on Cloudflare | Verified (Cloudflare R2 docs); matters for packs.earlyletters.com (DOMAINS.md) |
