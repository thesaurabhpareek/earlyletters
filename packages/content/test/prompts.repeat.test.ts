/**
 * Prompts do not come round twice running, over the real library and a long stretch of nights (backlog 08 rank 22,
 * "prompts v3, repeat suppression across seasons"; feasibility item 6). Nights are fed back the way Tonight does: the
 * keys of the prompts already used, newest first. The same rule over a small fictional library is in
 * packages/core/test/prompts.selection.test.ts. Fixtures use the fictional family Asha only.
 */
import { AVOID_RECENT, selectPrompt, type SelectInput } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { PROMPTS } from '../src';

const LIVE = PROMPTS.filter((p) => !p.retired);
const START = Date.UTC(2026, 9, 1);
const night = (d: number) => new Date(START + d * 86_400_000).toISOString().slice(0, 10);

type Kind = Pick<SelectInput, 'hardStretch' | 'role' | 'together' | 'daysSinceLastEntry'>;
const KINDS: [string, Kind][] = [
  ['opening', { hardStretch: false, role: 'parent', together: false, daysSinceLastEntry: 1 }],
  ['gap', { hardStretch: false, role: 'parent', together: false, daysSinceLastEntry: 9 }],
  ['hard', { hardStretch: true, role: 'parent', together: false, daysSinceLastEntry: 1 }],
  ['family', { hardStretch: false, role: 'contributor', together: false, daysSinceLastEntry: 1 }],
  ['together', { hardStretch: false, role: 'parent', together: true, daysSinceLastEntry: 1 }],
];

function run(kind: Kind, ageMonths: number, nights: number): string[] {
  const recent: string[] = [];
  const served: string[] = [];
  for (let d = 0; d < nights; d++) {
    const p = selectPrompt({ ...kind, ageMonths, recentKeys: recent, seed: night(d) }, PROMPTS);
    served.push(p.key);
    recent.unshift(p.key);
  }
  return served;
}

describe('prompt repeat suppression, real library', () => {
  for (const [name, kind] of KINDS) {
    it(`${name} nights: the same prompt never comes two nights running, at every age band`, () => {
      for (const age of [2, 5, 8, 11, 15, 22, 30, 50]) {
        const served = run(kind, age, 200);
        // A night with one prompt to give (together, at an age with no band of its own) can only give it again.
        if (new Set(served).size < 2) continue;
        for (let i = 1; i < served.length; i++) expect(served[i], `${name} age ${age} night ${i}`).not.toBe(served[i - 1]);
      }
    });

    it(`${name} nights: no prompt returns before every prompt of that night has been used, or ${AVOID_RECENT} others have passed`, () => {
      for (const age of [2, 8, 15, 30, 50]) {
        const served = run(kind, age, 200);
        const pool = new Set(served).size;
        const gap = Math.min(pool, AVOID_RECENT + 1);
        for (let i = 0; i + gap <= served.length; i++) {
          expect(new Set(served.slice(i, i + gap)).size, `${name} age ${age} window ${i}`).toBe(gap);
        }
      }
    });
  }

  it('no two live prompts say the same thing under two keys, so key-based suppression cannot be sidestepped', () => {
    const norm = (t: string) => t.toLowerCase().replace(/\{child\}/g, 'child').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    const seen = new Map<string, string>();
    for (const p of LIVE) {
      const k = norm(p.text);
      expect(seen.get(k), `${p.key} repeats ${seen.get(k)}`).toBeUndefined();
      seen.set(k, p.key);
    }
  });

  it('a retired prompt is never served, in any kind of night', () => {
    const retired = new Set(PROMPTS.filter((p) => p.retired).map((p) => p.key));
    for (const [, kind] of KINDS) for (const key of run(kind, 15, 120)) expect(retired.has(key)).toBe(false);
  });
});
