/**
 * [BL-1510] E2E-01a: "I answered by mistake" is always mounted on the stop screen, at opacity 0 and out of the
 * accessibility tree until the 24 hours pass (BL-420). assertNotVisible alone leans on how Maestro reads an
 * opacity 0 node, so each check also proves the slot is not actionable: a tap on it changes nothing and the stop
 * screen stays. Source scan of the flow files only; the app source is not read or changed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const E2E = join(__dirname, '..', 'e2e');
const flow = readFileSync(join(E2E, 'flows', 'E2E-01a-age-gate-no.yaml'), 'utf8');
const sub = readFileSync(join(E2E, 'subflows', 'assert-stop-mistake-hidden.yaml'), 'utf8');

describe('[BL-1510] E2E-01a stop line is hidden, not just absent', () => {
  it('the subflow keeps the not-visible check and proves a tap does nothing', () => {
    expect(sub).toMatch(/assertNotVisible:\s*\n\s*id: "gate\.stop\.mistake"/);
    expect(sub).toMatch(/tapOn:\s*\n\s*id: "gate\.stop\.mistake"\s*\n\s*optional: true/);
    // After the tap the stop screen is still there and the question did not come back.
    const afterTap = sub.slice(sub.indexOf('tapOn'));
    expect(afterTap).toMatch(/assertVisible:\s*\n\s*id: "gate\.stop"/);
    expect(afterTap).toMatch(/assertNotVisible:\s*\n\s*id: "gate\.continue"/);
  });

  it('every stop-screen check in the flow goes through the subflow', () => {
    expect(flow).not.toMatch(/assertNotVisible:\s*\n\s*id: "gate\.stop\.mistake"/);
    const uses = flow.match(/file: \.\.\/subflows\/assert-stop-mistake-hidden\.yaml/g) ?? [];
    expect(uses.length).toBe(3);
  });
});
