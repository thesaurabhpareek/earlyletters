/**
 * BL-894: every NX-40 happy path (H1 to H9) and edge case (U1 to U15) has a row in e2e/NX-40-ROWS.md that names its
 * proof, and a row only a person with a phone can prove names the device row and who runs it. This reads the
 * ledger; it does not run the flows (they run on a Mac, e2e/README.md).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..');
const ROOT = join(APP, '..', '..');
const ledger = readFileSync(join(APP, 'e2e', 'NX-40-ROWS.md'), 'utf8');
const plan = readFileSync(join(ROOT, 'docs', 'qa', 'DEVICE_TEST_PLAN.md'), 'utf8');
const STATES = ['covered', 'partial', 'device', 'parked'];

const rows = ledger
  .split('\n')
  .map((l) => l.split('|').map((c) => c.trim()))
  .filter((c) => /^[HU]\d+$/.test(c[1] ?? ''))
  .map((c) => ({ id: c[1]!, state: c[2]!, proofs: c[3]!.split(';').map((p) => p.trim()), owner: c[4]! }));

describe('[NX-40-R16] the NX-40 rows each name their proof', () => {
  it('[NX-40-R16] H1 to H9 and U1 to U15 each appear once, and nothing else', () => {
    const want = [...Array.from({ length: 9 }, (_, i) => `H${i + 1}`), ...Array.from({ length: 15 }, (_, i) => `U${i + 1}`)];
    expect(rows.map((r) => r.id)).toEqual(want);
  });

  it('[NX-40-R16] every row has a known state and an owner', () => {
    for (const r of rows) {
      expect(STATES, `${r.id} state`).toContain(r.state);
      expect(r.owner.length, `${r.id} owner`).toBeGreaterThan(0);
    }
  });

  it('[NX-40-R16] every named flow, test and device row exists', () => {
    for (const r of rows) {
      for (const p of r.proofs) {
        const [kind, ...rest] = p.split(':');
        const what = rest.join(':');
        if (kind === 'flow') expect(existsSync(join(APP, 'e2e', 'flows', what)), `${r.id} flow ${what}`).toBe(true);
        else if (kind === 'test') expect(existsSync(join(APP, 'test', what)), `${r.id} test ${what}`).toBe(true);
        else if (kind === 'device') expect(plan, `${r.id} device ${what}`).toMatch(new RegExp(`^#{3,4} ${what}[ \\n]`, 'm'));
        else if (kind === 'parked') expect(what.length, `${r.id} parked reason`).toBeGreaterThan(0);
        else throw new Error(`${r.id}: unknown proof kind "${p}"`);
      }
    }
  });

  it('[NX-40-R16] a device row names the person who runs it, and covered rows need no device row', () => {
    for (const r of rows) {
      const kinds = r.proofs.map((p) => p.split(':')[0]);
      if (r.state === 'device') {
        expect(kinds, `${r.id} device row`).toContain('device');
        expect(r.owner, `${r.id} owner`).toMatch(/founder/);
      }
      if (r.state === 'partial') expect(kinds, `${r.id} partial names its device row`).toContain('device');
      if (r.state === 'covered') expect(kinds.some((k) => k === 'flow' || k === 'test'), `${r.id} covered`).toBe(true);
    }
  });
});
