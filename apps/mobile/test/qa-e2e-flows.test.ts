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

  it('[F14-REQ-029] no flow expects a Plus sheet from Read together or Add a child (D-082, D-083)', async () => {
    // Plus gates only keeping a new letter. A flow that taps one of these and then asserts the
    // Plus sheet is visible tests a gate D-082 and D-083 removed (the old E2E-06 and E2E-07).
    const NEVER_GATED = new Set(['book.readTogether', 'switcher.addChild', 'settings.addChild']);
    const YAML = await import('yaml');
    const found: string[] = [];
    const scan = (file: string, list: unknown) => {
      if (!Array.isArray(list)) return;
      let lastTap: string | null = null;
      for (const cmd of list as Record<string, unknown>[]) {
        if (!cmd || typeof cmd !== 'object') continue;
        const tap = cmd.tapOn as { id?: string } | undefined;
        const seen = cmd.assertVisible as { id?: string } | undefined;
        if (seen?.id?.startsWith('plusGate') && lastTap && NEVER_GATED.has(lastTap)) found.push(`${file}: ${lastTap} then ${seen.id}`);
        lastTap = typeof tap?.id === 'string' ? tap.id : null;
        const nested = (cmd.repeat as { commands?: unknown } | undefined)?.commands ?? (cmd.retry as { commands?: unknown } | undefined)?.commands;
        scan(file, nested);
      }
    };
    for (const dir of ['flows', 'subflows']) {
      for (const f of readdirSync(join(E2E, dir)).filter((n) => n.endsWith('.yaml'))) {
        const docs = YAML.parseAllDocuments(readFileSync(join(E2E, dir, f), 'utf8'));
        scan(`${dir}/${f}`, docs[1]?.toJS());
      }
    }
    expect(found).toEqual([]);
    // The rewritten flows say what they prove.
    const tagsOf = (f: string) => YAML.parseAllDocuments(readFileSync(join(E2E, 'flows', f), 'utf8'))[0].toJS().tags as string[];
    expect(tagsOf('E2E-06-read-together-no-gate.yaml')).toEqual(expect.arrayContaining(['E2E-06', 'F14-REQ-029', 'D-082']));
    expect(tagsOf('E2E-07-add-child-no-gate.yaml')).toEqual(expect.arrayContaining(['E2E-07', 'F14-REQ-029', 'D-083']));
  });

  it('the suite runner names only flow files that exist', () => {
    const suite = readFileSync(join(E2E, 'bin', 'run-suite.sh'), 'utf8');
    const block = /FLOWS=\(\n([\s\S]*?)\n\)/.exec(suite)?.[1] ?? '';
    const names = block.split('\n').map((l) => l.trim()).filter(Boolean);
    expect(names.length).toBeGreaterThan(10);
    const files = new Set(readdirSync(join(E2E, 'flows')));
    expect(names.filter((n) => !files.has(`${n}.yaml`))).toEqual([]);
  });

  it('E2E-17 runs in two parts and the suite runner inspects both exports for originals only', () => {
    const flows = readdirSync(join(E2E, 'flows')).filter((f) => f.startsWith('E2E-17'));
    expect(flows.sort()).toEqual(['E2E-17a-export-listening-copy.yaml', 'E2E-17b-export-original-only.yaml']);
    const suite = readFileSync(join(E2E, 'bin', 'run-suite.sh'), 'utf8');
    expect(suite).toMatch(/E2E-17a\*\) host_check [^\n]*REQUIRE_LISTENING=1 [^\n]*inspect-export\.sh" --originals/);
    expect(suite).toMatch(/E2E-17b\*\) host_check [^\n]*REQUIRE_LISTENING=1[\s\S]*?COMPARE_WITH=[^\n]*inspect-export\.sh" --originals/);
  });
});
