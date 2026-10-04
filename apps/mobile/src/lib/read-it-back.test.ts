import { describe, expect, it } from 'vitest';
import { lateArrivingWords } from './transcription-queue/clean';
import { parseIds, withId, withoutId } from './read-it-back.logic';

describe('words that arrive later (D-086)', () => {
  it('arrive exactly as said: no fix, no edit, the verbatim level', () => {
    const w = lateArrivingWords(' She um laughed at the the dog. ');
    expect(w.rawTranscript).toBe(' She um laughed at the the dog. ');
    expect(w.machineEdits).toEqual([]);
    expect(w.finalText).toBe('She um laughed at the the dog.');
    expect(w.editLevel).toBe('verbatim');
  });

  it('keeps the read-it-back list as plain ids', () => {
    expect(parseIds(null)).toEqual([]);
    expect(parseIds('not json')).toEqual([]);
    expect(parseIds('{"a":1}')).toEqual([]);
    expect(parseIds('["a",3,"b"]')).toEqual(['a', 'b']);
    expect(withId(['a'], 'b')).toEqual(['a', 'b']);
    expect(withId(['a'], 'a')).toEqual(['a']);
    expect(withoutId(['a', 'b'], 'a')).toEqual(['b']);
  });
});
