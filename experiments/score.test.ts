import { describe, expect, it } from 'vitest';
import { align, cer, dictionaryAccuracy, errorCounts, lowConfidenceWords, metricFor, normChars, normWords, scorePhrase, transcriptText, wer } from './score';

const DICT = [
  { term: 'Asha', kind: 'child' as const, heardAs: [] },
  { term: 'Mumma', kind: 'family' as const, heardAs: [] },
];

describe('scoring', () => {
  it('computes word error rate', () => {
    expect(wer('she walked to me', 'she walked to me')).toBe(0);
    expect(wer('she walked to me', 'she walk to me')).toBe(0.25);
    expect(wer('she walked', 'um she walked')).toBe(0.5);
    expect(wer('', '')).toBe(0);
  });

  it('ignores case and punctuation', () => {
    expect(wer('Asha, walked.', 'asha walked')).toBe(0);
  });

  it('counts names spelled exactly your way', () => {
    expect(dictionaryAccuracy('Asha ran to Mumma, Asha laughed', 'Asha ran to mama, Asha laughed', DICT)).toEqual({ hits: 2, total: 3 });
  });

  it('treats every word heard in a silent clip as invented', () => {
    expect(scorePhrase('', 'Thank you for watching.', 'Thank you for watching.', DICT).phantomWords).toBe(4);
    expect(scorePhrase('', '', '', DICT).phantomWords).toBe(0);
  });

  it('reads whisper JSON, dropping non-speech tags', () => {
    const json = {
      transcription: [
        { text: ' [BLANK_AUDIO]', tokens: [] },
        { text: ' Asha walked.', tokens: [{ text: '[_BEG_]', p: 0.1 }, { text: ' Asha', p: 0.3 }, { text: ' walked', p: 0.9 }, { text: '.', p: 0.2 }] },
      ],
    };
    expect(transcriptText(json)).toBe('Asha walked.');
    expect(lowConfidenceWords(json)).toEqual(['Asha']);
  });
});

describe('scoring in every launch script (R5 4.4 E8, WP-F05-02)', () => {
  it('keeps Devanagari vowel signs inside the word: three words, not seven letters', () => {
    expect(normWords('मेरी प्यारी बेटी।')).toEqual(['मेरी', 'प्यारी', 'बेटी']);
    // daughter -> son is one word wrong, not a fragment of a letter
    expect(wer('मेरी प्यारी बेटी', 'मेरी प्यारी बेटा')).toBeCloseTo(1 / 3);
  });

  it('scores Mandarin by character, punctuation and spaces ignored', () => {
    expect(metricFor('zh')).toBe('cer');
    expect(metricFor('hi')).toBe('wer');
    expect(normChars('我今天很想你，宝贝。')).toEqual(['我', '今', '天', '很', '想', '你', '宝', '贝']);
    expect(cer('我今天很想你，宝贝。', '我今天很想你宝贝')).toBe(0);
    expect(cer('我今天很想你', '我明天很想你')).toBeCloseTo(1 / 6);
    expect(errorCounts('我今天很想你', '我明天很想你', 'zh')).toEqual({ errors: 1, refUnits: 6, hypUnits: 6 });
  });

  it('compares Arabic without harakat or tatweel (Whisper writes none), and nothing else', () => {
    expect(normWords('أنتِ حبيبتي', 'ar')).toEqual(normWords('أنت حبيبتي', 'ar'));
    expect(normWords('جمـيل', 'ar')).toEqual(['جميل']);
    expect(errorCounts('أنتِ نمتِ', 'أنت نمت', 'ar').errors).toBe(0);
    // Without the Arabic fold a haraka is part of the word (the engine check needs that).
    expect(normWords('أنتِ')).not.toEqual(normWords('أنت'));
  });

  it("keeps accents and apostrophes: aujourd'hui is one word, si and sí are different", () => {
    expect(normWords("Aujourd'hui, tu as ri.")).toEqual(["aujourd'hui", 'tu', 'as', 'ri']);
    expect(wer('si vienes', 'sí vienes')).toBe(0.5);
  });

  it('aligns units so script checks can follow each reference word', () => {
    expect(align(['a', 'b', 'c'], ['a', 'x', 'c', 'd'])).toEqual([
      { op: 'match', ref: 'a', hyp: 'a' },
      { op: 'sub', ref: 'b', hyp: 'x' },
      { op: 'match', ref: 'c', hyp: 'c' },
      { op: 'ins', hyp: 'd' },
    ]);
  });

  it('counts invented Mandarin characters on a silent clip', () => {
    expect(scorePhrase('', '谢谢观看', '谢谢观看', [], 'zh').phantomWords).toBe(4);
  });
});

