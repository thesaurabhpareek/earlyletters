/**
 * R-01 regression suite, Mandarin in Simplified Chinese (F06-REQ-019): D4,
 * D5, D7, plus the 3 Oct punctuation finding. The alpha cleans Chinese at
 * level verbatim; filler removal runs with a vetted copy. Native reviewer
 * sign-off for this file: pending (R-08).
 *
 * Fictional family only (阿莎 is Asha).
 */
import { describe, expect, it } from 'vitest';
import { punctuationEdits, type DictionaryTerm } from '../../src';
import { clean, edit, insertAfter, INVISIBLES, loadPack, PACK_MODES, packFor, rules, verdict, vettedPack } from './harness';

const L = 'zh' as const;
const DICT: DictionaryTerm[] = [{ term: '阿莎', kind: 'child', heardAs: ['阿沙'] }];

describe.each([...PACK_MODES, 'none'] as const)('[F06-REQ-019] Chinese, pack %s: R-01 cases are refused', (mode) => {
  const pack = mode === 'none' ? null : packFor(L, mode);
  const R = rules(L, pack, 'Hans');

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a character)',
    (_n, ch) => {
      const raw = '阿莎今天笑了。';
      expect(verdict(raw, insertAfter(raw, 'punctuation', '笑', ch), R)).toBe('changes_invisible');
    },
  );

  it('[F06-REQ-004] never turns a statement into a question: R-01 D5 (。 to ？, ！ removed)', () => {
    const raw = '她睡了。';
    expect(verdict(raw, edit(raw, 'punctuation', '。', '？'), R)).toBe('changes_sentence_type');
    const bang = '你做到了！';
    expect(verdict(bang, edit(bang, 'punctuation', '！', '。'), R)).toBe('changes_sentence_type');
  });

  it('[F06-REQ-019] control: a taught two-character mishearing is spelled the family way at verbatim', () => {
    expect(clean('阿沙今天笑了。', L, pack, { level: 'verbatim', dictionary: DICT, script: 'Hans' }).text).toBe('阿莎今天笑了。');
  });
});

describe('[F06-REQ-019] Chinese, word tables vetted: removals', () => {
  const pack = vettedPack(L);

  it("[F06-REQ-006] never edits the child's quoted words: R-01 D7 (「 」 and “ ”)", () => {
    expect(clean('阿莎说「呃，不要」。', L, pack, { script: 'Hans' }).text).toContain('呃，不要');
    expect(clean('阿莎说“呃，不要”。', L, pack, { script: 'Hans' }).text).toContain('呃，不要');
  });

  it('[F06-REQ-019] control: a hesitation outside quotes is removed, a word that contains the sound is not (呃逆 hiccup)', () => {
    expect(clean('呃，阿莎睡了。', L, pack, { script: 'Hans' }).text).toBe('阿莎睡了。');
    expect(clean('阿莎呃逆了。', L, pack, { script: 'Hans' }).text).toBe('阿莎呃逆了。');
  });
});

describe('[F06-REQ-015] Chinese end marks', () => {
  it('the punctuation provider adds no "." after 。 or ？ (3 Oct finding)', () => {
    for (const raw of ['她睡了。', '她睡了吗？', '你做到了！']) {
      expect(punctuationEdits({ raw, level: 'clean', dictionary: [] }).filter((e) => e.replacement === '.')).toEqual([]);
    }
  });

  it('[F06-REQ-016] curly quotes and the ellipsis are kept with the Chinese pack: R-01 D14 (Chinese part)', () => {
    expect(clean('阿莎说“好”……', L, loadPack(L), { level: 'verbatim', script: 'Hans' }).text).toBe('阿莎说“好”……');
  });
});
