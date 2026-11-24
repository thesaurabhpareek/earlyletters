/**
 * [BL-467 point 3] The library cannot change without the version going up. The fingerprint below is the library at
 * PROMPT_LIBRARY_VERSION; a changed, added, retired or removed prompt changes it, and the test then says to bump the
 * version (an entry keeps the version it was made under) and to move both numbers together. Fixtures: none, the library itself.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PROMPTS, PROMPT_LIBRARY_VERSION } from '../src/prompts';

const PINNED = { version: 5, fingerprint: '46a206f5604303b1' };

export function fingerprint(list: typeof PROMPTS): string {
  const rows = list.map((p) => [p.key, p.text, p.band, p.kind, p.retired ? 1 : 0].join('\u0001'));
  return createHash('sha256').update(rows.join('\n')).digest('hex').slice(0, 16);
}

describe('[BL-467] the prompt library is pinned to its version', () => {
  it('a changed prompt gives a different fingerprint', () => {
    const planted = PROMPTS.map((p, i) => (i === 0 ? { ...p, text: p.text + ' ' } : p));
    expect(fingerprint(planted)).not.toBe(fingerprint(PROMPTS));
  });

  it('the library matches the pinned fingerprint at the pinned version', () => {
    expect(
      { version: PROMPT_LIBRARY_VERSION, fingerprint: fingerprint(PROMPTS) },
      'the library changed: raise PROMPT_LIBRARY_VERSION in prompts.ts, add its note, then update PINNED here',
    ).toEqual(PINNED);
  });
});
