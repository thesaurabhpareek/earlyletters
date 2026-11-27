/**
 * Agents hold no production power (BL-1330, FR-BKO-21; docs/ops/ACCESS.md). Reads every workflow under
 * .github/workflows and prints file, job and secret NAME for each breach; never a value (it reads no value).
 *
 *   node scripts/ops/agent-env-scan.ts        # exit 0 clean, 1 on a breach or a workflow that does not parse,
 *                                             # 2 if it could not read the workflows; a missing yaml package fails the import (exit 1)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exit, guardCrashes, print, printError } from './lib/cli.ts';
import { explain, scanWorkflow } from './lib/agent-env.ts';

const STOPPED = 'agent-env scan: stopped before it read every workflow; treat as a failure';
guardCrashes(STOPPED, 2);
try {
  const dir = join(import.meta.dirname ?? '.', '..', '..', '.github', 'workflows');
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f)).sort();
  if (!files.length) {
    printError(STOPPED);
    exit(2);
  }
  const findings = files.flatMap((f) => scanWorkflow(f, readFileSync(join(dir, f), 'utf8')));
  for (const f of findings) printError(`FAIL ${explain(f)}`);
  print(findings.length ? `agent-env scan: ${findings.length} breach(es) in ${files.length} workflows` : `agent-env scan: ok (${files.length} workflows)`);
  exit(findings.length ? 1 : 0);
} catch {
  printError(STOPPED);
  exit(2);
}
