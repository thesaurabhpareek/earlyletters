import { describe, expect, it } from 'vitest';
import {
  acceptSuggestions,
  checkEdit,
  cleanWithProviders,
  RulePunctuationProvider,
  faithfulClean,
  findRepeats,
  protectedSpans,
  verifyEdits,
  type CleanOptions,
  type DictionaryTerm,
} from '../src';

// Fictional family only.
const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Asia'] }];
const OPTS: CleanOptions = { level: 'clean', dictionary: DICT };
const clean = (raw: string) => faithfulClean(raw, OPTS);

/** Every finding, auto or suggested, must pass the verifier on its own. */
function allVerify(raw: string) {
  const ctx = { raw, level: 'clean' as const, dictionary: DICT, protectedSpans: protectedSpans(raw, DICT) };
  for (const f of findRepeats(raw)) expect(checkEdit(f.edit, ctx), `${f.edit.original} in "${raw}"`).toBeNull();
  const all = findRepeats(raw).map((f) => f.edit);
  expect(verifyEdits(all, ctx).rejected).toEqual([]);
}

// faithfulClean alone does not add sentence case or a final period; that is
// RulePunctuationProvider's job (see providers.test.ts).
describe('repeats: removed automatically', () => {
  it.each([
    ['today you you held the spoon', 'today you held the spoon'],
    ['it was like a like a little hiccup', 'it was like a little hiccup'],
    ['it was like a, like a little hiccup', 'it was like a little hiccup'],
    ['and the and the dog barked', 'and the dog barked'],
    ['we went to the to the park', 'we went to the park'],
    ['I want you to I want you to know this', 'I want you to know this'],
    ['like a like a like a little hiccup', 'like a little hiccup'],
    ['You you did it!', 'You did it!'],
    ['Asha, you you crawled today.', 'Asha, you crawled today.'],
    ['and you you laughed', 'and you laughed'],
    ['she was was walking', 'she was walking'],
    ['they they wanted more', 'they wanted more'],
    ['And and then the the dog barked.', 'And then the dog barked.'],
  ])('%s', (raw, expected) => {
    allVerify(raw);
    const out = clean(raw);
    expect(out.text).toBe(expected);
    expect(out.applied.every((e) => e.replacement === '' || e.type !== 'repeat')).toBe(true);
    expect(out.rejected).toEqual([]);
  });

  it('repeat removals are listed as repeat edits and are each undoable', () => {
    const out = clean('today you you held the spoon like a like a pro');
    const repeats = out.applied.filter((e) => e.type === 'repeat');
    expect(repeats.map((e) => e.original)).toEqual([' you', ' like a']);
  });
});

describe('repeats: grammatical or meaningful doubles are kept', () => {
  it.each([
    'I told you you were brave.',
    'I promised you you would see the sea.',
    'What it was was magic.',
    'All it was was a sneeze.',
    'What it is is love.',
    'I want you to know that that was the best day.',
    'I gave her her bottle.',
    'By then he had had enough.',
    'I love you, I love you.',
    'Come on, come on, you can do it.',
    'Bye bye bye bye.',
    'No no no, very very tired.',
    'Well done, well done.',
    'You were tired. You you know it.',
  ])('%s', (raw) => {
    allVerify(raw);
    expect(clean(raw).text).toBe(raw);
  });

  it('does not collapse across a sentence break', () => {
    const raw = 'Look at you. You crawled! You you!';
    expect(clean(raw).text).toBe(raw);
    expect(clean(raw).suggestions.map((s) => s.original)).toEqual([' you']);
  });

  it('never touches a quoted repeat or a dictionary name', () => {
    expect(clean('she said "the the" again').text).toBe('she said "the the" again');
    expect(clean('Asha Asha came running').text).toBe('Asha Asha came running');
  });

  it('removes nothing in verbatim mode and suggests nothing', () => {
    const out = faithfulClean('today you you held like a like a spoon', { level: 'verbatim', dictionary: DICT });
    expect(out.text).toBe('today you you held like a like a spoon');
    expect(out.suggestions).toEqual([]);
  });
});

describe('repeats: suggested, never applied by the engine', () => {
  it.each([
    ['I am so so happy.', ' so'],
    ['bring it in in the morning', ' in'],
    ['my my, look at you', ' my'],
    ['she is she is', ' she is'],
    ['you, you are funny', ', you'],
  ])('%s', (raw, original) => {
    allVerify(raw);
    const out = clean(raw);
    expect(out.applied.some((e) => e.type === 'repeat')).toBe(false);
    expect(out.suggestions.map((s) => s.original)).toEqual([original]);
  });

  it('does not even suggest after an object verb or for "had had" and "that that"', () => {
    for (const raw of ['I told you you were brave.', 'He had had enough.', 'I know that that was it.', 'I gave her her bottle.']) {
      expect(clean(raw).suggestions).toEqual([]);
    }
  });

  it('accepting a suggestion goes through the verifier and then drops out of suggestions', () => {
    const raw = 'I am so so happy.';
    const first = clean(raw);
    const opts = acceptSuggestions(OPTS, first.suggestions);
    const second = faithfulClean(raw, opts);
    expect(second.text).toBe('I am so happy.');
    expect(second.suggestions).toEqual([]);
    expect(second.applied.filter((e) => e.type === 'repeat')).toHaveLength(1);
  });

  it('a tampered suggestion is still rejected by the verifier', () => {
    const raw = 'I am so so happy.';
    const [s] = clean(raw).suggestions;
    const tampered = { ...s, end: s.end + ' happy'.length, original: raw.slice(s.start, s.end + ' happy'.length) };
    const out = faithfulClean(raw, acceptSuggestions(OPTS, [tampered]));
    expect(out.text).toBe(raw);
    expect(out.rejected.map((r) => r.reason)).toEqual(['not_a_repeat']);
  });
});

describe('repeats: the web preview sentences, end to end with punctuation', () => {
  it('cleans both reported cases and capitalises the surviving words', async () => {
    const raw = 'today you you held the spoon. it was like a like a little hiccup';
    const out = await cleanWithProviders({ raw, level: 'clean', dictionary: DICT }, [new RulePunctuationProvider()]);
    expect(out.text).toBe('Today you held the spoon. It was like a little hiccup.');
    expect(out.rejected).toEqual([]);
  });
});
