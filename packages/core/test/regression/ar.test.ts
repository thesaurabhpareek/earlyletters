/**
 * R-01 regression suite, Arabic (F06-REQ-019): D2, D3, D4, D5, D8. The
 * alpha keeps Arabic recordings and the author types (DR-01); any spoken
 * Arabic letter is cleaned at level verbatim. Native reviewer sign-off for
 * this file: pending (R-08).
 *
 * Fictional family only (آشا is Asha).
 */
import { describe, expect, it } from 'vitest';
import type { DictionaryTerm } from '../../src';
import { clean, edit, insertAfter, INVISIBLES, PACK_MODES, packFor, rules, verdict } from './harness';

const L = 'ar' as const;
const DICT: DictionaryTerm[] = [{ term: 'آشا', kind: 'child', heardAs: ['اوشا'] }];

describe.each([...PACK_MODES, 'none'] as const)('[F06-REQ-019] Arabic, pack %s: R-01 cases are refused', (mode) => {
  const pack = mode === 'none' ? null : packFor(L, mode);
  const R = rules(L, pack);

  it('[F06-REQ-002] never genders the person spoken to: R-01 D2 (أنتِ to أنتَ)', () => {
    const raw = 'أنتِ جميلة جدا.';
    expect(verdict(raw, edit(raw, 'punctuation', 'أنتِ', 'أنتَ'), R)).toBe('punctuation_changed_letters');
  });

  it('[F06-REQ-002] never swaps harakat: R-01 D3 (كَتَبَ he wrote to كُتِبَ it was written)', () => {
    const raw = 'كَتَبَ الولد رسالة.';
    expect(verdict(raw, edit(raw, 'punctuation', 'كَتَبَ', 'كُتِبَ'), R)).toBe('punctuation_changed_letters');
  });

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a word)',
    (_n, ch) => {
      const raw = 'آشا نامت مبكرا.';
      expect(verdict(raw, insertAfter(raw, 'punctuation', 'نامت', ch), R)).toBe('changes_invisible');
    },
  );

  it('[F06-REQ-004] never turns a statement into a question: R-01 D5 (. to ؟, ؟ removed)', () => {
    const raw = 'هل أنت بخير.';
    expect(verdict(raw, edit(raw, 'punctuation', '.', '؟'), R)).toBe('changes_sentence_type');
    const q = 'هل نامت آشا؟';
    expect(verdict(q, edit(q, 'punctuation', '؟', '.'), R)).toBe('changes_sentence_type');
  });

  it('[F06-REQ-002] never changes a verb for gender: R-01 D8 (ذهبت she went to ذهب he went)', () => {
    const raw = 'ذهبت إلى البيت.';
    expect(verdict(raw, edit(raw, 'agreement', 'ذهبت', 'ذهب'), R)).toBe('not_vetted_for_language');
    expect(verdict(raw, edit(raw, 'punctuation', 'ذهبت', 'ذهب'), R)).toBe('punctuation_changed_letters');
  });

  it('[F06-REQ-019] control: a taught mishearing is spelled the family way at verbatim', () => {
    expect(clean('اوشا نامت مبكرا.', L, pack, { level: 'verbatim', dictionary: DICT }).text).toBe('آشا نامت مبكرا.');
  });
});
