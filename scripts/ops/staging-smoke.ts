/**
 * RA-07-06: the content-free staging smoke check, after every staging deploy
 * (database and Edge Functions). Runbook: docs/ops/runbooks/staging-smoke.md.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_PUBLISHABLE_KEY=<the publishable key the builds use, or the legacy anon key> \
 *   SUPABASE_DB_URL=<the project's Postgres URL, as in SUPABASE_DB_URL_STAGING> \
 *   node scripts/ops/staging-smoke.ts --project-ref <ref> [--summary "$GITHUB_STEP_SUMMARY"]
 *
 * Options: --functions a,b (default: AF-13's config, content, purge-worker,
 * apple-token), --providers email,apple, --signups open|closed (closed for the
 * staging stop rehearsal), --no-db (function deploys, which hold no database
 * URL), --attempts 1..5 (function health retries on 5xx, 2 s apart).
 *
 * Reads, anonymously, only policy_versions (document, version, effective_at),
 * the health routes and Auth's public settings; in Postgres, read only and
 * through psql, catalog and settings rows (the pepper reduced to a boolean
 * there). Prints check names, statuses and closed values; never a body, URL,
 * key, row or psql message. Exit 0 green, 1 red, 2 usage. Node 22, no npm
 * packages; needs psql unless --no-db.
 */
import { appendText, argv, env, exit, print } from './lib/cli.ts';
import { psqlRunner } from './lib/psql.ts';
import { smokeMain } from './lib/smoke.ts';

const result = await smokeMain(argv(), env, {
  fetch: (url, init) => fetch(url, init),
  sql: (db) => psqlRunner(db),
  now: () => new Date(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
});
for (const line of result.lines) print(line);
if (result.summaryPath && result.markdown) appendText(result.summaryPath, result.markdown);
exit(result.code);
