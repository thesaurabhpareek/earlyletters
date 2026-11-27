/**
 * NS-19-R4 (card NS-19, docs/product/prd/09-capture.md): given two takes, each keeps its own immutable raw transcript
 * and its own `verifyEdits` pass; no machine edit spans two takes. The core half of BL-1174: the verifier is only ever
 * handed one take's raw, so an edit placed across the seam of two takes cannot be expressed against either take and is
 * refused. The store half (one draft row per take, raw set once) is in
 * apps/mobile/test/ns-19-ns-35-capture-doorways.test.ts. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { applyEdits, faithfulClean, verifyEdits, type DictionaryTerm, type Edit } from '../src';

const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usha'] }];
// The first take ends on "you" and the second begins on "you": joined, they read as a repeat the rules would remove.
const TAKE_A = 'Asha, today at the park you';
const TAKE_B = 'you laughed um at the ducks.';
const SEAM = TAKE_A.length;
const JOINED = `${TAKE_A} ${TAKE_B}`;

const ctx = (raw: string) => ({ raw, level: 'clean' as const, dictionary: DICT, protectedSpans: [] });

/** A repeat removal of " you" that starts in take A and ends in take B, written against the joined text. */
function seamRepeat(): Edit {
  const start = SEAM; // the space between the takes
  const end = SEAM + ' you'.length;
  return { type: 'repeat', start, end, original: JOINED.slice(start, end), replacement: '', source: 'rule' };
}

describe('[NS-19-R4] no edit spans two takes', () => {
  it('[NS-19-R4] each take gets its own verifyEdits pass, and every applied edit lies inside that take', () => {
    for (const raw of [TAKE_A, TAKE_B]) {
      const before = raw;
      const r = faithfulClean(raw, { level: 'clean', dictionary: DICT });
      for (const e of r.applied) {
        expect(e.start).toBeGreaterThanOrEqual(0);
        expect(e.end).toBeLessThanOrEqual(raw.length);
        expect(raw.slice(e.start, e.end)).toBe(e.original);
      }
      // The applied set is exactly what the verifier accepts against this take alone.
      expect(verifyEdits(r.applied, ctx(raw)).accepted).toEqual(r.applied);
      // The take's raw is read, never written: the applied edits rebuild the shown text from it.
      expect(applyEdits(raw, r.applied).length).toBeGreaterThan(0);
      expect(raw).toBe(before);
    }
    // Take B's filler is cleaned within take B; take A has nothing to clean.
    expect(faithfulClean(TAKE_B, { level: 'clean', dictionary: DICT }).applied.some((e) => e.type === 'filler')).toBe(true);
  });

  it('[NS-19-R4] an edit across the seam would pass against the joined text, which is why takes are never joined', () => {
    // The hazard is real: handed the two takes as one text, the verifier accepts the cross-take repeat.
    expect(verifyEdits([seamRepeat()], ctx(JOINED)).accepted).toHaveLength(1);
  });

  it('[NS-19-R4] the same edit is refused against each take on its own', () => {
    const e = seamRepeat();
    // Against take A it runs past the end of A's raw.
    const a = verifyEdits([e], ctx(TAKE_A));
    expect(a.accepted).toEqual([]);
    expect(a.rejected.map((r) => r.reason)).toEqual(['out_of_bounds']);
    // Re-based onto take B it starts before B's raw begins.
    const b = verifyEdits([{ ...e, start: e.start - (SEAM + 1), end: e.end - (SEAM + 1) }], ctx(TAKE_B));
    expect(b.accepted).toEqual([]);
    expect(b.rejected.map((r) => r.reason)).toEqual(['out_of_bounds']);
  });

  it('[NS-19-R4] an edit written for one take is refused against the other: each raw is its own text', () => {
    const filler = faithfulClean(TAKE_B, { level: 'clean', dictionary: DICT }).applied.find((x) => x.type === 'filler')!;
    const r = verifyEdits([filler], ctx(TAKE_A));
    expect(r.accepted).toEqual([]);
    expect(['out_of_bounds', 'original_mismatch']).toContain(r.rejected[0].reason);
  });
});
