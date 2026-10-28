// Runs ONE grader in its own process: node grade-host.mjs <grader.mjs> <workdir>
// A separate process per grade means a grader cannot keep module state between
// trials, cannot crash the runner, and can be killed on timeout.
import { pathToFileURL } from "node:url";

import { MARK } from "./mark.mjs";
try {
  const [graderPath, workdir] = process.argv.slice(2);
  const mod = await import(pathToFileURL(graderPath).href);
  if (typeof mod.grade !== "function") throw new Error("grader.mjs does not export function grade");
  const r = await mod.grade({ workdir });
  process.stdout.write(`\n${MARK}${JSON.stringify({ ok: true, result: r ?? null })}\n`);
} catch (e) {
  process.stdout.write(`\n${MARK}${JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) })}\n`);
}
