// Runs every supabase/tests/*.test.mjs against all applied-or-pending migrations
// in supabase/migrations (filename order; drafts/ excluded).
// Usage: node supabase/tests/run.mjs [filter]   e.g. `npm run test:db -- perf`
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migDir = join(here, '..', 'migrations');
const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort().map((f) => join(migDir, f));
const filter = process.argv[2];
const tests = readdirSync(here).filter((f) => f.endsWith('.test.mjs') && (!filter || f.includes(filter))).sort();

let failed = [];
for (const t of tests) {
  console.log(`\n=== ${t} (${migrations.length} migrations) ===`);
  const r = spawnSync(process.execPath, [join(here, t), ...migrations], { stdio: 'inherit' });
  if (r.status !== 0) failed.push(t);
}
console.log(failed.length ? `\nFAILED: ${failed.join(', ')}` : `\nAll ${tests.length} database test files passed.`);
process.exit(failed.length ? 1 : 0);
