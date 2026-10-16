/**
 * R-01 regression suite, Portuguese (F06-REQ-019). Latin script: D3, D4,
 * D6, D7, D10, D12, D13, D14. The alpha cleans Portuguese at level
 * verbatim; word table rules run with a vetted copy. Native reviewer
 * sign-off for this file: pending (R-08).
 *
 * Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import { faithfulClean, validatePack, type DictionaryTerm } from '../../src';
import { clean, edit, insertAfter, INVISIBLES, loadPack, PACK_MODES, packFor, rules, twoNames, verdict, vettedPack } from './harness';

const L = 'pt' as const;
const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];

describe.each(PACK_MODES)('[F06-REQ-019] Portuguese, pack %s: R-01 cases are refused', (mode) => {
  const pack = packFor(L, mode);
  const R = rules(L, pack);

  it('[F06-REQ-002] never genders a grandparent: R-01 D3 (avó, grandmother, to avô, grandfather)', () => {
    const raw = 'Asha abraçou a avó.';
    expect(verdict(raw, edit(raw, 'punctuation', 'avó', 'avô'), R)).toBe('punctuation_changed_letters');
    expect(verdict(raw, edit(raw, 'punctuation', 'avó', 'avô'), R)).toBe('punctuation_changed_letters');
  });

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a word)',
    (_n, ch) => {
      const raw = 'Asha riu com o pato.';
      expect(verdict(raw, insertAfter(raw, 'punctuation', 'riu', ch), R)).toBe('changes_invisible');
    },
  );

  it('[F06-REQ-010] Portuguese "um" (a, one) is never a filler: R-01 D12', () => {
    for (const level of ['clean', 'verbatim'] as const) {
      expect(clean('Te dou um beijo.', L, pack, { level }).text).toBe('Te dou um beijo.');
    }
  });

  it('[F06-REQ-008] a common word that matches a family term stays as said: R-01 D10 (Mamãe, kinship)', () => {
    const dict: DictionaryTerm[] = [...DICT, { term: 'Mamãe', kind: 'self', heardAs: [] }];
    expect(clean('Asha ama a mamãe.', L, pack, { level: 'verbatim', dictionary: dict }).text).toBe('Asha ama a mamãe.');
  });

  it('[F06-REQ-014] one family name never becomes another: R-01 D13', () => {
    expect(clean('Usha veio hoje.', L, pack, { level: 'verbatim', dictionary: twoNames('Asha', 'Usha') }).text).toBe('Usha veio hoje.');
  });

  it('[F06-REQ-019] control: a taught mishearing is still spelled the family way at verbatim', () => {
    expect(clean('Usher dormiu.', L, pack, { level: 'verbatim', dictionary: DICT }).text).toBe('Asha dormiu.');
  });
});

describe('[F06-REQ-019] Portuguese, word tables vetted: removals', () => {
  const pack = vettedPack(L);
  const run = (raw: string) => clean(raw, L, pack, { dictionary: DICT });

  it('[F06-REQ-005] never drops a spoken yes or no: R-01 D6 (hum-hum)', () => {
    expect(run('Quer mais? Hum-hum, disse Asha.').text).toContain('Hum-hum');
  });

  it("[F06-REQ-006] never edits the child's quoted words: R-01 D7 (« » and curly single quotes)", () => {
    expect(run('Asha disse «hum, não» e riu.').text).toContain('hum, não');
    expect(run('Asha disse ‘hum, não’ e riu.').text).toContain('hum, não');
  });

  it('[F06-REQ-019] control: a Portuguese hesitation is removed', () => {
    expect(run('Hã, Asha dormiu.').text).toBe('Asha dormiu.');
  });
});

describe('[F06-REQ-010] the language must be passed: R-01 D12 in core', () => {
  it('with no language core defaults to English and removes "um"; the app always passes it (cleanSpoken)', () => {
    // Documents the core default the app relies on passing past (apps/mobile transcription-queue/clean.ts).
    expect(faithfulClean('Te dou um beijo.', { level: 'clean', dictionary: [] }).text).toBe('Te dou beijo.');
    expect(faithfulClean('Te dou um beijo.', { level: 'clean', dictionary: [], language: 'pt' }).text).toBe('Te dou um beijo.');
  });
});

describe('[F06-REQ-008] Portuguese name words: R-01 D10 needs a commonWords table in the pt pack', () => {
  it('a pack with commonWords keeps "uma flor rosa" for a child named Rosa (mechanism, engine 6)', () => {
    const pack = vettedPack(L, (p) => {
      p.engine = 2;
      p.meaning.commonWords = ['rosa', 'luz', 'flor', 'vitória', 'graça'];
    });
    expect(validatePack(pack).ok).toBe(true);
    const dict: DictionaryTerm[] = [{ term: 'Rosa', kind: 'child', heardAs: [] }];
    expect(clean('Asha tem uma flor rosa.', L, pack, { level: 'verbatim', dictionary: dict }).text).toBe('Asha tem uma flor rosa.');
  });

  it.fails('OPEN R-01 D10 for pt: the shipped pack has no commonWords, so "rosa" still becomes "Rosa" (request to S08, native review)', () => {
    const dict: DictionaryTerm[] = [{ term: 'Rosa', kind: 'child', heardAs: [] }];
    expect(clean('Asha tem uma flor rosa.', L, loadPack(L), { level: 'verbatim', dictionary: dict }).text).toBe('Asha tem uma flor rosa.');
  });
});

describe('[F06-REQ-016] Portuguese characters after the edits', () => {
  it.fails('OPEN R-01 D14 for pt (WP-F06-05, founder Q1): curly quotes change with no stored edit', () => {
    expect(clean('Asha disse “sim”.', L, loadPack(L), { level: 'verbatim' }).text).toBe('Asha disse “sim”.');
  });
});
