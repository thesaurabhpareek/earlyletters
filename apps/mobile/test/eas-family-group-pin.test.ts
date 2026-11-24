/// <reference types="node" />
/**
 * BL-2027, CR-184 (docs/agents/cto/RULINGS.md), CR-178 item 5: a TestFlight build goes to the internal group
 * "Family" and to no one else. The App Store Connect side is a read-back (FOUNDER_QUEUE row A0); this is the repo
 * half. A profile that drops Family, adds a second group, or a new profile that carries any other group would send
 * a build to people outside the family, with no sign of it in a build log.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type SubmitProfile = { ios?: { groups?: unknown } };
const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')) as {
  submit: Record<string, SubmitProfile>;
};

const WHY =
  'CR-184 and CR-178 item 5: the internal TestFlight group is exactly ["Family"]. Change the ruling first, not this list.';

describe('CR-184: TestFlight submit groups are exactly Family (BL-2027)', () => {
  for (const profile of ['testflight', 'preview'] as const) {
    it(`submit.${profile}.ios.groups equals ["Family"]`, () => {
      const groups = eas.submit[profile]?.ios?.groups;
      expect(groups, `${WHY} (submit.${profile}.ios.groups)`).toEqual(['Family']);
    });
  }

  it('no other submit profile names a group but Family, and production names none', () => {
    for (const [name, p] of Object.entries(eas.submit)) {
      const groups = p.ios?.groups;
      if (name === 'production') {
        expect(groups, `${WHY} (production submits to the store, not a group)`).toBeUndefined();
      } else if (groups !== undefined) {
        expect(groups, `${WHY} (submit.${name})`).toEqual(['Family']);
      }
    }
  });
});
