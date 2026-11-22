/**
 * Free plan keep-alive: one anonymous, content-free Data API read against production, so Supabase
 * does not pause the project for inactivity. Run daily by docs/ops/proposed/workflows/supabase-keepalive.yml.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=<publishable key> \
 *   node scripts/ops/keepalive.ts --project-ref <ref>
 *
 * Prints only the HTTP status and a row count. Exit 0 PASS, 1 FAIL, 2 usage or an unexpected stop.
 * Node 22, no npm packages. Runbook: docs/ops/runbooks/free-tier-ops.md.
 */
import { argv, env, exit, guardCrashes, print } from './lib/cli.ts';
import { runKeepalive, STOPPED_LINE } from './lib/keepalive.ts';

guardCrashes(STOPPED_LINE, 2);
const code = await runKeepalive(argv(), env, {
  fetch: (url, init) => fetch(url, init),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}, { print });
exit(code);
