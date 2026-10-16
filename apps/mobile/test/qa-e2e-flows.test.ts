/**
 * S19 (QA): the Maestro flows stay well formed on every `npm test`, on any
 * machine, without a simulator. Runs apps/mobile/e2e/bin/lint-flows.mjs, which
 * checks the YAML, the subflow and script references, that every id a flow
 * selects is requested in TESTID_REQUESTS.md, and that each of the five P0
 * nightly flows (E2E-01, -03, -12, -13, -17; PRD V2 08 section 3.3 S19) keeps a
 * flow tagged `p0-nightly`. The flows themselves run on a Mac
 * (apps/mobile/e2e/bin/run-p0-nightly.sh).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const E2E = join(__dirname, '..', 'e2e');

// Spawning Node and parsing every flow takes about 1.5 s on a quiet machine; a loaded CI
// runner can take several times that, so this one test gets its own limit.
const SPAWN_TIMEOUT_MS = 60_000;

describe('[BL-275] Maestro flows', () => {
  it('pass the flow lint', () => {
    const run = spawnSync(process.execPath, [join(E2E, 'bin', 'lint-flows.mjs')], { encoding: 'utf8' });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/^lint-flows: \d+ flows and \d+ subflows OK/m);
  }, SPAWN_TIMEOUT_MS);

  it('E2E-17 runs in two parts and the suite runner inspects both exports for originals only', () => {
    const flows = readdirSync(join(E2E, 'flows')).filter((f) => f.startsWith('E2E-17'));
    expect(flows.sort()).toEqual(['E2E-17a-export-listening-copy.yaml', 'E2E-17b-export-original-only.yaml']);
    const suite = readFileSync(join(E2E, 'bin', 'run-suite.sh'), 'utf8');
    expect(suite).toMatch(/E2E-17a\*\) host_check [^\n]*REQUIRE_LISTENING=1 [^\n]*inspect-export\.sh" --originals/);
    expect(suite).toMatch(/E2E-17b\*\) host_check [^\n]*REQUIRE_LISTENING=1[\s\S]*?COMPARE_WITH=[^\n]*inspect-export\.sh" --originals/);
  });
});
