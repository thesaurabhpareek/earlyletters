/**
 * English through the pack engine is English as before (ADR 0014).
 * The legacy functions in meaning.ts, punctuation.ts and protect.ts stay as
 * the reference; the bundled English pack, read by the generic engine, must
 * agree with them word for word and edit for edit.
 */
import { describe, expect, it } from 'vitest';
import {
  cleanRulesOnly,
  cleanWithProviders,
  classifyWordSwap,
  compileRules,
  ENGLISH_PACK,
  ENGLISH_RULES,
  faithfulClean,
  isAgreementPair,
  isNegation,
  isPronounI,
  isProtectedWord,
  languagePunctuationEdits,
  moodMarks,
  negationCount,
  numbersOf,
  punctuationEdits,
  quoteMarkCount,
  RulePunctuationProvider,
  soundKey,
  soundsLike,
  startsSentence,
  tokens,
  type DictionaryTerm,
} from '../src';

// Fictional family only.
const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'chalo', kind: 'word', heardAs: ['shallow'] },
];

const SENTENCES = [
  'Asha can walk now and she is so proud of it.',
  'I am not sad today, I am not.',
  "She doesn't like the bath but she loves the duck.",
  'Um, she was, she was so happy when Daddy came home.',
  'You did it! You crawled all the way to Mumma.',
  'Did you see the moon tonight? She pointed at it twice.',
  'She has two teeth and a third one is coming.',
  'Asia said "bau" to the cat and then she laughed.',
  "Its tail was wagging and it's the first time she saw it.",
  'She could not sleep, uh, so we walked for an hour.',
  'today you you held the spoon. it was like a like a little hiccup',
  'she walked today it was amazing',
  'She ate 1,000 peas, or it felt like it. We left at 3:30.',
  'chalo, time for bath, she is not wanting to go na.',
  'Hmm. She have a cold but she is still smiling.',
  'um so we went to the park',
  'iPad time again, said Ashu',
  'she said "the the" again,',
  'I told you you were brave. What it was was magic.',
  'No no no, very very tired; bye bye Mumma:',
];

const WORDS = [...new Set(SENTENCES.flatMap((s) => tokens(s).map((t) => t.word)))].concat([
  "can't", "won't", 'cannot', 'nobody', 'walks', 'walked', 'carries', 'carried', 'loved', 'loving', 'twice', 'Will', "I'm", "i'd",
]);

describe('the English pack reads exactly like the legacy tables', () => {
  it('word predicates agree on every word of the corpus', () => {
    for (const w of WORDS) {
      expect(ENGLISH_RULES.isNegation(w), w).toBe(isNegation(w));
      expect(ENGLISH_RULES.isProtectedWord(w), w).toBe(isProtectedWord(w));
      expect(ENGLISH_RULES.isPronounI(w), w).toBe(isPronounI(w));
      expect(ENGLISH_RULES.soundKey(w), w).toBe(soundKey(w));
    }
  });

  it('pairs agree: agreement, word-swap reasons, sound-alikes', () => {
    for (const a of WORDS) {
      for (const b of WORDS.slice(0, 60)) {
        expect(ENGLISH_RULES.isAgreementPair(a, b), `${a}/${b}`).toBe(isAgreementPair(a, b));
        expect(ENGLISH_RULES.classifyWordSwap(a, b), `${a}/${b}`).toBe(classifyWordSwap(a, b));
        expect(ENGLISH_RULES.soundsLike(a, b), `${a}/${b}`).toBe(soundsLike(a, b));
      }
    }
  });

  it('text measures agree: negations, numbers, mood marks, quotes, tokens, sentence starts', () => {
    for (const s of SENTENCES) {
      expect(ENGLISH_RULES.negationCount(s)).toBe(negationCount(s));
      expect(ENGLISH_RULES.numbersOf(s)).toEqual(numbersOf(s));
      expect(ENGLISH_RULES.moodMarks(s)).toBe(moodMarks(s));
      expect(ENGLISH_RULES.quoteMarkCount(s)).toBe(quoteMarkCount(s));
      expect(ENGLISH_RULES.tokens(s)).toEqual(tokens(s));
      for (let i = 0; i <= s.length; i += 3) {
        for (const level of ['clean', 'verbatim'] as const) expect(ENGLISH_RULES.startsSentence(s.slice(0, i), level)).toBe(startsSentence(s.slice(0, i), level));
      }
    }
  });

  it('the language punctuation provider proposes the same edits as RulePunctuationProvider for English', () => {
    for (const raw of SENTENCES) {
      for (const level of ['clean', 'verbatim'] as const) {
        const req = { raw, level, dictionary: DICT };
        expect(languagePunctuationEdits(req, ENGLISH_RULES), raw).toEqual(punctuationEdits(req));
      }
    }
  });

  it('cleanRulesOnly in English equals cleanWithProviders with RulePunctuationProvider', async () => {
    for (const raw of SENTENCES) {
      for (const level of ['clean', 'verbatim'] as const) {
        const req = { raw, level, dictionary: DICT };
        const a = await cleanRulesOnly(req, { language: 'en' });
        const b = await cleanWithProviders(req, [new RulePunctuationProvider()]);
        expect(a.text, raw).toBe(b.text);
        expect(a.applied).toEqual(b.applied);
        expect(a.suggestions).toEqual(b.suggestions);
      }
    }
  });

  it('faithfulClean with language "en", with the English pack, or with nothing is the same call', () => {
    for (const raw of SENTENCES) {
      const plain = faithfulClean(raw, { level: 'clean', dictionary: DICT });
      expect(faithfulClean(raw, { level: 'clean', dictionary: DICT, language: 'en' })).toEqual(plain);
      expect(faithfulClean(raw, { level: 'clean', dictionary: DICT, language: 'en', pack: ENGLISH_PACK })).toEqual(plain);
    }
    expect(compileRules('en')).toBe(ENGLISH_RULES);
    expect(compileRules('en', ENGLISH_PACK)).toBe(ENGLISH_RULES);
  });
});

describe('generic fixes that also protect English letters', () => {
  it('a decomposed accent belongs to its word, so it cannot be slipped in as punctuation', () => {
    expect(tokens('café au lait').map((t) => t.word)).toEqual(['café', 'au', 'lait']);
  });
});
