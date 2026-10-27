/**
 * R-01 regression suite, Spanish (F06-REQ-019). Latin script: D3, D4, D6,
 * D7, D10, D12, D13, D14. The alpha cleans Spanish at level verbatim
 * (apps/mobile LANGUAGES_WITH_TIDY_RULES is English only), so each case runs
 * with the pack as shipped and, where the rule needs word tables, with a
 * vetted copy. Native reviewer sign-off for this file: pending (R-08).
 *
 * Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import { validatePack, type DictionaryTerm } from '../../src';
import { clean, edit, insertAfter, INVISIBLES, loadPack, PACK_MODES, packFor, rules, twoNames, verdict, vettedPack } from './harness';

const L = 'es' as const;
const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];

describe.each(PACK_MODES)('[F06-REQ-019] Spanish, pack %s: R-01 cases are refused', (mode) => {
  const pack = packFor(L, mode);
  const R = rules(L, pack);

  it('[F06-REQ-002] never changes a letter or its accent: R-01 D3 (si to sí, papá decomposed to papa)', () => {
    const raw = 'Lo hago si quieres, papá.';
    expect(verdict(raw, edit(raw, 'punctuation', 'si', 'sí'), R)).toBe('punctuation_changed_letters');
    expect(verdict(raw, edit(raw, 'punctuation', 'papá', 'papa'), R)).toBe('punctuation_changed_letters');
  });

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a word)',
    (_n, ch) => {
      const raw = 'Asha se rió con el pato.';
      expect(verdict(raw, insertAfter(raw, 'punctuation', 'rió', ch), R)).toBe('changes_invisible');
    },
  );

  it('[F06-REQ-008] a common word that matches a family term stays as said: R-01 D10 (Mamá, kinship)', () => {
    const dict: DictionaryTerm[] = [...DICT, { term: 'Mamá', kind: 'self', heardAs: [] }];
    for (const level of ['clean', 'verbatim'] as const) {
      expect(clean('Asha quiere a su mamá.', L, pack, { level, dictionary: dict }).text).toBe('Asha quiere a su mamá.');
    }
  });

  it('[F06-REQ-014] one family name never becomes another: R-01 D13', () => {
    for (const level of ['clean', 'verbatim'] as const) {
      expect(clean('Usha vino hoy.', L, pack, { level, dictionary: twoNames('Asha', 'Usha') }).text).toBe('Usha vino hoy.');
    }
  });

  it('[F06-REQ-019] control: a taught mishearing is still spelled the family way at verbatim', () => {
    expect(clean('Usher durmió.', L, pack, { level: 'verbatim', dictionary: DICT }).text).toBe('Asha durmió.');
  });
});

describe('[F06-REQ-019] Spanish, word tables vetted: removals', () => {
  const pack = vettedPack(L);
  const run = (raw: string) => clean(raw, L, pack, { dictionary: DICT });

  it('[F06-REQ-005] never drops a spoken yes or no: R-01 D6 (uh-uh, mmm mmm)', () => {
    expect(run('¿Quieres más? Uh-uh, dijo Asha.').text).toContain('Uh-uh');
    expect(run('Mmm mmm, no quiero.').text).toContain('Mmm mmm');
  });

  it("[F06-REQ-006] never edits the child's quoted words: R-01 D7 (« » and curly single quotes)", () => {
    expect(run('Asha dijo «em, no» y se rió.').text).toContain('em, no');
    expect(run('Asha dijo ‘em, no’ y se rió.').text).toContain('em, no');
  });

  it('[F06-REQ-010] only Spanish fillers are removed: R-01 D12 (English "er" kept)', () => {
    expect(run('Te quiero, er, mucho.').text).toContain('er');
  });

  it('[F06-REQ-019] control: a Spanish hesitation is removed', () => {
    expect(run('Em, Asha durmió.').text).toBe('Asha durmió.');
  });
});

describe('[F06-REQ-008] Spanish name words: R-01 D10 needs a commonWords table in the es pack', () => {
  it('a pack with commonWords keeps "la luz" for a child named Luz (mechanism, engine 6)', () => {
    const pack = vettedPack(L, (p) => {
      p.engine = 2;
      p.meaning.commonWords = ['luz', 'sol', 'paz', 'rosa', 'esperanza'];
    });
    expect(validatePack(pack).ok).toBe(true);
    const dict: DictionaryTerm[] = [{ term: 'Luz', kind: 'child', heardAs: [] }];
    expect(clean('Apaga la luz, por favor.', L, pack, { level: 'verbatim', dictionary: dict }).text).toBe('Apaga la luz, por favor.');
  });

  it.fails('OPEN R-01 D10 for es: the shipped pack has no commonWords, so "luz" still becomes "Luz" (request to S08, native review)', () => {
    const dict: DictionaryTerm[] = [{ term: 'Luz', kind: 'child', heardAs: [] }];
    expect(clean('Apaga la luz, por favor.', L, loadPack(L), { level: 'verbatim', dictionary: dict }).text).toBe('Apaga la luz, por favor.');
  });
});

describe('[F06-REQ-016] Spanish characters after the edits', () => {
  it('a dash between numbers stays a range (found 15 Oct)', () => {
    expect(clean('Durmió 2 – 3 horas.', L, loadPack(L), { level: 'verbatim' }).text).toBe('Durmió 2 - 3 horas.');
  });

  it.fails('OPEN R-01 D14 for es (WP-F06-05, founder Q1): curly quotes change with no stored edit', () => {
    const out = clean('Asha dijo “sí”.', L, loadPack(L), { level: 'verbatim' });
    expect(out.text).toBe('Asha dijo “sí”.');
  });
});
