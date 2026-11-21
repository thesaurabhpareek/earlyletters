/// <reference types="node" />
/**
 * Gate G9 (BRIEF CI-COV): every workspace's coverage floor is a whole number and never above the measured value. The
 * measured numbers live in docs/ops/coverage-measured.json (one number per workspace and the Actions run id that produced
 * it). That file is added by a later PR, after the founder-approved coverage job has run once; until then this test says
 * so and checks only that each floor is a whole number. Coverage output itself is gitignored and is never read.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { baseCopy } from '../../../scripts/guards/ratchet-base.mjs';
import { flattenFloors, measuredProblems, notWhole } from '../../../scripts/coverage/floors.mjs';

const REPO = join(__dirname, '..', '..', '..');
const MEASURED = 'docs/ops/coverage-measured.json';
const WORKSPACES = ['apps/mobile', 'experiments', 'packages/analytics', 'packages/api', 'packages/brand', 'packages/content', 'packages/core', 'packages/design-tokens', 'packages/emails'];

async function allFloors() {
  const out: Array<{ key: string; metric: string; floor: number }> = [];
  for (const ws of WORKSPACES) {
    const mod = await import(join(REPO, ws, 'vitest.coverage.config.ts'));
    out.push(...flattenFloors(ws, mod.default.test.coverage.thresholds));
  }
  return out;
}

describe('coverage floors', () => {
  it('[G9] every workspace floor is a whole number and no floor is above its measured value', async () => {
    const floors = await allFloors();
    expect(floors.length).toBeGreaterThan(30);
    expect(notWhole(floors)).toEqual([]);
    const path = join(REPO, MEASURED);
    if (!existsSync(path)) return void console.log('coverage floors: no measured file yet, not checked');
    const measured = JSON.parse(readFileSync(path, 'utf8'));
    const base = baseCopy(MEASURED);
    if (base.kind === 'absent' && base.required) throw new Error(`base copy of ${MEASURED} is absent and RATCHET_BASE_REQUIRED=1`);
    const baseMeasured = base.kind === 'base' ? JSON.parse((base as { text: string }).text) : null;
    expect(measuredProblems(floors, measured, baseMeasured)).toEqual([]);
  });

  it('[G9] mutants: a floor above the measure, a fractional floor, a missing run id and a raise without a new run all fail', () => {
    const floors = flattenFloors('w', { statements: 90, branches: 80, functions: 90, lines: 90, 'src/verify.ts': { branches: 95 } });
    const numbers = { w: { statements: 92, branches: 82, functions: 91, lines: 93 }, 'w:src/verify.ts': { branches: 96 } };
    expect(measuredProblems(floors, { run: 1, numbers })).toEqual([]);
    expect(measuredProblems(floors, { run: 1, numbers: { ...numbers, w: { ...numbers.w, statements: 89 } } })).toHaveLength(1);
    expect(measuredProblems(floors, { numbers })).toEqual(['the measured file has no run id']);
    expect(measuredProblems(floors, { run: 1, numbers: { w: numbers.w } })).toHaveLength(1);
    expect(notWhole(flattenFloors('w', { statements: 90.5, branches: 80, functions: 90, lines: 90 }))).toHaveLength(1);
    const raised = { run: 1, numbers: { ...numbers, w: { ...numbers.w, lines: 95 } } };
    expect(measuredProblems(floors, raised, { run: 1, numbers })).toEqual(['lines for w rose without a new run id']);
    expect(measuredProblems(floors, { ...raised, run: 2 }, { run: 1, numbers })).toEqual([]);
  });
});
