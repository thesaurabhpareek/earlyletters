/** What a letter shows for its words: waiting, a calm "nobody spoke" note, or its words. */
import { describe, expect, it } from 'vitest';
import { letterWords } from './letter-words.logic';

describe('letterWords', () => {
  it('waiting while a kept recording waits for its words', () => {
    expect(letterWords({ captureMode: 'spoken', transcriptStatus: 'waiting', finalText: '' })).toBe('waiting');
  });

  it('nobodySpoke for a spoken letter whose words came back empty', () => {
    expect(letterWords({ captureMode: 'spoken', transcriptStatus: null, finalText: '' })).toBe('nobodySpoke');
    expect(letterWords({ captureMode: 'spoken', transcriptStatus: undefined, finalText: '  \n ' })).toBe('nobodySpoke');
    expect(letterWords({ captureMode: 'mixed', transcriptStatus: null, finalText: '' })).toBe('nobodySpoke');
  });

  it('words for any letter with text, and for typed letters always', () => {
    expect(letterWords({ captureMode: 'spoken', transcriptStatus: null, finalText: 'You laughed today.' })).toBe('words');
    expect(letterWords({ captureMode: 'typed', transcriptStatus: null, finalText: '' })).toBe('words');
  });
});
