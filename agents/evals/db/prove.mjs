// Proves each task: grade() FAILS on the unfixed fixture and PASSES with reference/ overlaid.
// Usage: node agents/evals/db/prove.mjs [task-id ...]
import { cpSync, mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2);
const tasks = readdirSync(here, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(here, d.name, 'grader.mjs')))
  .map((d) => d.name).filter((t) => !only.length || only.includes(t));
let bad = 0;
for (const t of tasks) {
  const { grade } = await import(pathToFileURL(join(here, t, 'grader.mjs')).href);
  const w = mkdtempSync(join(tmpdir(), `eval-${t}-`));
  cpSync(join(here, t, 'fixture'), w, { recursive: true });
  const before = await grade({ workdir: w });
  cpSync(join(here, t, 'reference'), w, { recursive: true });
  const after = await grade({ workdir: w });
  rmSync(w, { recursive: true, force: true });
  const ok = before.pass === false && !before.unknown && after.pass === true;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'BAD '} ${t}\n  fixture:   pass=${before.pass} ${before.reason}\n  reference: pass=${after.pass} ${after.reason}`);
}
process.exit(bad ? 1 : 0);
