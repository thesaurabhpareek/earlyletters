// Proves each task: grader FAILS on the untouched fixture, PASSES on fixture + reference overlay.
// Usage: node agents/evals/trust/prove.mjs [task-id ...]
import { cpSync, mkdtempSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(here).filter((d) => existsSync(join(here, d, "grader.mjs")));
let bad = 0;
for (const id of ids) {
  const { grade } = await import(pathToFileURL(join(here, id, "grader.mjs")).href);
  const base = mkdtempSync(join(tmpdir(), "eval-"));
  cpSync(join(here, id, "fixture"), join(base, "a"), { recursive: true });
  cpSync(join(here, id, "fixture"), join(base, "b"), { recursive: true });
  cpSync(join(here, id, "reference"), join(base, "b"), { recursive: true });
  const before = grade({ workdir: join(base, "a") });
  const after = grade({ workdir: join(base, "b") });
  const ok = before.pass === false && after.pass === true;
  if (!ok) bad++;
  console.log(`${ok ? "OK  " : "BAD "} ${id}\n  fixture:   pass=${before.pass} ${before.reason}\n  reference: pass=${after.pass} ${after.reason}`);
}
process.exit(bad ? 1 : 0);
