#!/usr/bin/env node
/**
 * `npm run test:coverage` at the repo root: runs every workspace's coverage
 * config in turn, then prints one merged table (report.mjs). A workspace
 * that fails its thresholds (or a test) does not stop the others, so the
 * table is always complete; the exit code is 1 if any workspace failed.
 *
 *   node scripts/coverage/run.mjs                 every workspace
 *   node scripts/coverage/run.mjs core mobile     a subset (workspace short names)
 *   node scripts/coverage/run.mjs --files 25      also list the 25 least covered files
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKSPACES, report } from './report.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const args = process.argv.slice(2);
let files = 0;
const picked = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--files') files = Number(args[++i] ?? '25') || 25;
  else picked.push(args[i]);
}
const chosen = picked.length ? WORKSPACES.filter((w) => picked.includes(w.short)) : WORKSPACES;
if (picked.length && chosen.length !== picked.length) {
  console.error(`Unknown workspace. Known: ${WORKSPACES.map((w) => w.short).join(', ')}`);
  process.exit(2);
}

const failed = [];
for (const ws of chosen) {
  const dir = join(ROOT, ws.dir);
  if (!existsSync(join(dir, 'vitest.coverage.config.ts'))) {
    console.error(`${ws.short}: no vitest.coverage.config.ts, skipped`);
    continue;
  }
  console.log(`\n== ${ws.name} (${ws.dir})`);
  const r = spawnSync('npx', ['vitest', 'run', '--config', 'vitest.coverage.config.ts'], {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, CI: process.env.CI ?? 'true', FORCE_COLOR: '0' },
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) failed.push(ws.short);
}

console.log('\n== Coverage, every workspace\n');
console.log(report({ files }));
if (failed.length) {
  console.error(`\nCoverage or tests failed in: ${failed.join(', ')} (thresholds live in each workspace's vitest.coverage.config.ts; raise them when coverage rises, never lower them).`);
  process.exit(1);
}
