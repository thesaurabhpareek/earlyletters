/**
 * R-01 regression suite, French (F06-REQ-019). Latin script: D3, D4, D6,
 * D7, D10, D12, D13, D14. The alpha cleans French at level verbatim; word
 * table rules run with a vetted copy. Native reviewer sign-off for this
 * file: pending (R-08).
 *
 * Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import { validatePack, type DictionaryTerm } from '../../src';
import { clean, edit, insertAfter, INVISIBLES, loadPack, PACK_MODES, packFor, rules, twoNames, verdict, vettedPack } from './harness';

const L = 'fr' as const;
const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];

describe.each(PACK_MODES)('[F06-REQ-019] French, pack %s: R-01 cases are refused', (mode) => {
  const pack = packFor(L, mode);
  const R = rules(L, pack);

  it('[F06-REQ-002] never swaps one accent for another: R-01 D3 (decomposed e acute to e grave)', () => {
    const raw = 'Asha a été sage.';
    expect(verdict(raw, edit(raw, 'punctuation', 'été', 'èté'), R)).toBe('punctuation_changed_letters');
    expect(verdict(raw, edit(raw, 'punctuation', 'été', 'ete'), R)).toBe('punctuation_changed_letters');
  });

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a word)',
    (_n, ch) => {
      const raw = 'Asha a ri avec le canard.';
      expect(verdict(raw, insertAfter(raw, 'punctuation', 'ri', ch), R)).toBe('changes_invisible');
    },
  );

  it('[F06-REQ-008] a common word that matches a family term stays as said: R-01 D10 (Maman, kinship)', () => {
    const dict: DictionaryTerm[] = [...DICT, { term: 'Maman', kind: 'self', heardAs: [] }];
    for (const level of ['clean', 'verbatim'] as const) {
      expect(clean('Asha aime sa maman.', L, pack, { level, dictionary: dict }).text).toBe('Asha aime sa maman.');
    }
  });

  it('[F06-REQ-014] one family name never becomes another: R-01 D13', () => {
    expect(clean('Usha est venue.', L, pack, { level: 'verbatim', dictionary: twoNames('Asha', 'Usha') }).text).toBe('Usha est venue.');
  });

  it('[F06-REQ-016] the no-break space before ? and ! is kept with the French pack: R-01 D14 (French part)', () => {
    expect(clean('Tu viens\u00A0? Oui\u00A0!', L, loadPack(L), { level: 'verbatim' }).text).toBe('Tu viens\u00A0? Oui\u00A0!');
  });

  it('[F06-REQ-019] control: a taught mishearing is still spelled the family way at verbatim', () => {
    expect(clean('Usher dort.', L, pack, { level: 'verbatim', dictionary: DICT }).text).toBe('Asha dort.');
  });
});

describe('[F06-REQ-019] French, word tables vetted: removals', () => {
  const pack = vettedPack(L);
  const run = (raw: string) => clean(raw, L, pack, { dictionary: DICT });

  it('[F06-REQ-005] never drops a spoken yes or no: R-01 D6 (hum-hum)', () => {
    expect(run('Tu en veux encore ? Hum-hum, dit Asha.').text).toContain('Hum-hum');
  });

  it("[F06-REQ-006] never edits the child's quoted words: R-01 D7 (« » and curly single quotes)", () => {
    expect(run('Asha a dit « euh, non » et a ri.').text).toContain('euh, non');
    expect(run('Asha a dit ‘euh, non’ et a ri.').text).toContain('euh, non');
  });

  it('[F06-REQ-010] only French fillers are removed: R-01 D12 (English "um" kept)', () => {
    expect(run('Je t’aime, um, beaucoup.').text).toContain('um');
  });

  it('[F06-REQ-019] control: a French hesitation is removed', () => {
    expect(run('Euh, Asha dort.').text).toBe('Asha dort.');
  });
});

describe('[F06-REQ-008] French name words: R-01 D10 needs a commonWords table in the fr pack', () => {
  it('a pack with commonWords keeps "une robe rose" for a child named Rose (mechanism, engine 6)', () => {
    const pack = vettedPack(L, (p) => {
      p.engine = 2;
      p.meaning.commonWords = ['rose', 'violette', 'margaux', 'pierre', 'claire'];
    });
    expect(validatePack(pack).ok).toBe(true);
    const dict: DictionaryTerm[] = [{ term: 'Rose', kind: 'child', heardAs: [] }];
    expect(clean('Asha a une robe rose.', L, pack, { level: 'verbatim', dictionary: dict }).text).toBe('Asha a une robe rose.');
  });

  it.fails('OPEN R-01 D10 for fr: the shipped pack has no commonWords, so "rose" still becomes "Rose" (request to S08, native review)', () => {
    const dict: DictionaryTerm[] = [{ term: 'Rose', kind: 'child', heardAs: [] }];
    expect(clean('Asha a une robe rose.', L, loadPack(L), { level: 'verbatim', dictionary: dict }).text).toBe('Asha a une robe rose.');
  });
});

describe('[F06-REQ-016] French characters after the edits', () => {
  it.fails('OPEN R-01 D14 for fr (WP-F06-05, founder Q1): curly quotes change with no stored edit', () => {
    expect(clean('Asha a dit “oui”.', L, loadPack(L), { level: 'verbatim' }).text).toBe('Asha a dit “oui”.');
  });
});
