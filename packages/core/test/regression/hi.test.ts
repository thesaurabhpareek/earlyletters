/**
 * R-01 regression suite, Hindi in Devanagari (F06-REQ-019): D1, D2, D4, D8,
 * D9, D13. The alpha cleans Hindi at level verbatim. Native reviewer
 * sign-off for this file: pending (R-08).
 *
 * Fictional family only (आशा is Asha).
 */
import { describe, expect, it } from 'vitest';
import type { DictionaryTerm } from '../../src';
import { clean, edit, insertAfter, INVISIBLES, PACK_MODES, packFor, rules, twoNames, verdict } from './harness';

const L = 'hi' as const;
const DICT: DictionaryTerm[] = [{ term: 'आशा', kind: 'child', heardAs: ['आसा'] }];

describe.each([...PACK_MODES, 'none'] as const)('[F06-REQ-019] Hindi, pack %s: R-01 cases are refused', (mode) => {
  const pack = mode === 'none' ? null : packFor(L, mode);
  const R = rules(L, pack);

  it('[F06-REQ-001] a word keeps its vowel signs and viramas: R-01 D1 (tokenizer)', () => {
    expect(R.tokens('मेरी प्यारी बेटी हिंदी').map((t) => t.word)).toEqual(['मेरी', 'प्यारी', 'बेटी', 'हिंदी']);
    expect(R.tokens('क्\u200Dष').length).toBe(1);
  });

  it('[F06-REQ-002] never genders the child: R-01 D2 (बेटी, daughter, to बेटा, son)', () => {
    const raw = 'मेरी प्यारी बेटी सो गई।';
    expect(verdict(raw, edit(raw, 'punctuation', 'बेटी', 'बेटा'), R)).toBe('punctuation_changed_letters');
    // Named reason (tests-lens review, 23 Oct): in every pack mode the Hindi pack has no agreement table, so
    // agreement is not enabled for the language and the edit is refused before any word check.
    expect(verdict(raw, edit(raw, 'agreement', 'बेटी', 'बेटा'), R)).toBe('not_vetted_for_language');
  });

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a word)',
    (_n, ch) => {
      const raw = 'आशा आज बहुत हँसी।';
      expect(verdict(raw, insertAfter(raw, 'punctuation', 'बहुत', ch), R)).toBe('changes_invisible');
    },
  );

  it('[F06-REQ-002] never changes a verb for gender: R-01 D8 (गई to गया, as agreement or punctuation)', () => {
    const raw = 'वह घर गई।';
    expect(verdict(raw, edit(raw, 'agreement', 'गई', 'गया'), R)).toBe('not_vetted_for_language');
    expect(verdict(raw, edit(raw, 'punctuation', 'गई', 'गया'), R)).toBe('punctuation_changed_letters');
  });

  it("[F06-REQ-007] never changes a noun's number: R-01 D9 (बेटियाँ, daughters, to बेटी)", () => {
    const raw = 'मेरी दो बेटियाँ हैं।';
    expect(verdict(raw, edit(raw, 'agreement', 'बेटियाँ', 'बेटी'), R)).toBe('not_vetted_for_language');
  });

  it('[F06-REQ-014] one family name never becomes another: R-01 D13 (उषा stays उषा)', () => {
    const dict = twoNames('आशा', 'उषा');
    for (const level of ['clean', 'verbatim'] as const) expect(clean('उषा आज आई।', L, pack, { level, dictionary: dict }).text).toBe('उषा आज आई।');
    const raw = 'उषा आज आई।';
    expect(verdict(raw, edit(raw, 'stt_fix', 'उषा', 'आशा', 0, 'rule'), R, dict)).toBe('stt_fix_protected_word');
  });

  it('[F06-REQ-019] control: a taught mishearing is spelled the family way, and a longer word is left alone (D11)', () => {
    expect(clean('आसा आज बहुत हँसी।', L, pack, { level: 'verbatim', dictionary: DICT }).text).toBe('आशा आज बहुत हँसी।');
    expect(clean('आशाएँ बड़ी हैं, आसा सो गई।', L, pack, { level: 'verbatim', dictionary: DICT }).text).toBe('आशाएँ बड़ी हैं, आशा सो गई।');
  });
});
