/**
 * Weekly Supabase Free plan usage check (database size across all databases, accounts as an upper bound of MAU) against
 * scribe-prod, as the read-only backup role. Run by docs/ops/proposed/workflows/supabase-free-limits.yml.
 *
 *   LIMITS_DB_URL='postgresql://scribe_backup.<ref>:<password>@<session pooler host>:5432/postgres?sslmode=require' \
 *   node scripts/ops/free-limits.ts --project-ref <ref> [--alert-percent 80] [--summary <file>]
 *
 * Numbers only. Exit 0 under the alert line, 1 at or above it, 2 usage, no connection, unreadable or
 * an unexpected stop. Node 22, no npm packages; needs psql on PATH. Runbook: docs/ops/runbooks/free-tier-ops.md.
 */
import { appendText, argv, env, exit, guardCrashes, print } from './lib/cli.ts';
import { runFreeLimits, STOPPED_LINE } from './lib/free-limits.ts';
import { psqlRunner } from './lib/psql.ts';

guardCrashes(STOPPED_LINE, 2);
const code = await runFreeLimits(argv(), env, {
  sql: (db) => psqlRunner(db, { appName: 'scribe-free-limits', statementTimeout: '60s', timeoutMs: 90_000 }),
  appendSummary: appendText,
}, { print });
exit(code);
