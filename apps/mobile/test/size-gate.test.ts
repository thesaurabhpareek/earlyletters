/// <reference types="node" />
/** Size gate (BRIEF CI-SIZEGATE; Z-02, Z-05, Z-06). Pure: baselines are inline, no export is run. */
import { describe, expect, it } from 'vitest';
import { checkSize, hasSizeChangeLine, JS_ASSETS_BUDGET_BYTES, JS_BUNDLE_BUDGET_BYTES, LIMITS, type Baseline } from '../../../scripts/size/lib';

const base: Baseline = { commit: 'a'.repeat(40), hbcBytes: 10_000_000, hbcGzipBytes: 3_000_000, assetsBytes: 1_000_000, fontBytes: 500_000, dependencyCount: 60, owners: [{ owner: 'react-native', bytes: 4_000_000 }, { owner: 'expo-router', bytes: 300_000 }] };
const grow = (over: Partial<Baseline>): Baseline => ({ ...base, ...over });
const run = (current: Baseline, o: Partial<{ body: string; baselineUpdated: boolean; ownerApproved: boolean; reference: Baseline | null }> = {}) =>
  checkSize({ current, reference: base, body: '', baselineUpdated: false, ownerApproved: false, ...o });

describe('size gate', () => {
  it('[Z-02] bytecode growth over the limit fails, exactly at the limit passes', () => {
    expect(run(grow({ hbcBytes: base.hbcBytes + LIMITS.bytecodeBytes })).pass).toBe(true);
    const r = run(grow({ hbcBytes: base.hbcBytes + LIMITS.bytecodeBytes + 1 }));
    expect(r.pass).toBe(false);
    expect(r.lines.join('\n')).toMatch(/FAIL bytecode grew 100001 bytes/);
  });

  it('[Z-02] one percent of a small bytecode is the limit when it is under 100 KB', () => {
    const small = { ...base, hbcBytes: 5_000_000 };
    const r = checkSize({ current: { ...small, hbcBytes: 5_050_001 }, reference: small, body: '', baselineUpdated: false, ownerApproved: false });
    expect(r.pass).toBe(false);
    expect(checkSize({ current: { ...small, hbcBytes: 5_050_000 }, reference: small, body: '', baselineUpdated: false, ownerApproved: false }).pass).toBe(true);
  });

  it('[Z-02] bytecode over 12 MB fails whatever the PR body says', () => {
    const over = grow({ hbcBytes: JS_BUNDLE_BUDGET_BYTES + 1 });
    const r = checkSize({ current: over, reference: over, body: 'Size-change: needed, owner', baselineUpdated: true, ownerApproved: true });
    expect(r.pass).toBe(false);
    expect(r.lines.join('\n')).toMatch(/no waiver/);
    expect(run(grow({ assetsBytes: JS_ASSETS_BUDGET_BYTES + 1 }), { body: 'Size-change: x', baselineUpdated: true, ownerApproved: true }).pass).toBe(false);
  });

  it('[Z-05] a new app dependency fails, and a top-20 package growing over 50 KB fails', () => {
    expect(run(grow({ dependencyCount: 61 })).pass).toBe(false);
    const big = grow({ owners: [{ owner: 'react-native', bytes: 4_000_000 }, { owner: 'expo-router', bytes: 300_000 + LIMITS.ownerBytes + 1 }] });
    expect(run(big).lines.join('\n')).toMatch(/FAIL expo-router grew 50001 bytes/);
    expect(run(grow({ owners: [{ owner: 'brand-new-pkg', bytes: LIMITS.ownerBytes + 1 }] })).pass).toBe(false);
  });

  it('[Z-06] a Size-change line downgrades to a notice only when the baseline changed too and the owner approved', () => {
    const grown = grow({ dependencyCount: 61 });
    const body = 'Size-change: one picker library, mobile';
    expect(hasSizeChangeLine(body)).toBe(true);
    expect(hasSizeChangeLine('size-change: x\nSize-change:')).toBe(false);
    expect(run(grown, { body, baselineUpdated: false, ownerApproved: true }).pass).toBe(false);
    expect(run(grown, { body, baselineUpdated: true, ownerApproved: false }).pass).toBe(false);
    expect(run(grown, { body: '', baselineUpdated: true, ownerApproved: true }).pass).toBe(false);
    const ok = run(grown, { body, baselineUpdated: true, ownerApproved: true });
    expect(ok.pass).toBe(true);
    expect(ok.lines.join('\n')).toMatch(/notice: app dependencies 60 to 61, accepted/);
  });

  it('[Z-06] a PR that raises the baseline and the body line together still needs the owner', () => {
    const r = run(grow({ hbcBytes: base.hbcBytes + 500_000 }), { body: 'Size-change: images, mobile', baselineUpdated: true, ownerApproved: false });
    expect(r.pass).toBe(false);
    expect(r.lines.join('\n')).toMatch(/owner has not applied the baseline label/);
  });

  it('[Z-02] without a base baseline only the hard budgets are checked, and output carries no bundle content', () => {
    const r = run(grow({ hbcBytes: base.hbcBytes + 1_500_000 }), { reference: null });
    expect(r.pass).toBe(true);
    expect(r.lines[0]).toMatch(/no base baseline/);
  });
});
