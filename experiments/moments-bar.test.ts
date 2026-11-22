import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JUNK_BAR as CORE_JUNK_BAR } from '../packages/core/src/moments/rules';
import { DECISION_RULE, GRID, JUNK_BAR, MAX_WRONG_REASONS, MIN_QUALIFYING_PER_14_DAYS } from './moments-bar';

const spec = readFileSync(join(__dirname, '..', 'docs/product/prd/28-moments-tab.md'), 'utf8');

describe('the Moments harness bar is written before the run', () => {
  it('[NS-53-R281] the junk bar is 3 in 10 before "Not this one" and 2 in 10 after, as in core and the spec', () => {
    expect(JUNK_BAR).toEqual({ beforeNotThisOne: 0.3, afterNotThisOne: 0.2 });
    expect(JUNK_BAR).toEqual(CORE_JUNK_BAR);
    expect(spec).toContain('at most 3 days in 10 marked junk by the parent before any use of "Not this one"; at most 2 in 10 after one use');
  });

  it('[NS-53-R205] the grid and the decision rule are the ones in spec 7.2a', () => {
    expect(GRID.minSpanHours).toEqual([1, 2, 3]);
    expect(GRID.nearSeconds).toEqual([5, 10, 20]);
    expect(GRID.nearGroupMax).toEqual([30, 60, 120]);
    expect(GRID.placeRareShare).toEqual([0.1, 0.15, 0.25]);
    expect(MIN_QUALIFYING_PER_14_DAYS).toBe(3);
    expect(MAX_WRONG_REASONS).toBe(0);
    expect(spec).toContain('choose the cell with the lowest junk share among those where at least 3 of 14 days qualify and the wrong-reason count is 0; ties go to the larger `MIN_SPAN`');
    expect(DECISION_RULE).toContain('ties to the larger MIN_SPAN');
  });
});
