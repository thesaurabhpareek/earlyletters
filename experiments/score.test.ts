import { describe, expect, it } from 'vitest';
import { dictionaryAccuracy, lowConfidenceWords, scorePhrase, transcriptText, wer } from './score';

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
