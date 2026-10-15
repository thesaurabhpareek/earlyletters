/**
 * Unicode safety of the verifier (CORE-01, PMOB-01) and read-only allowlists
 * (CORE-10). The constitution: the machine may remove and repair, and may
 * never add meaning. In Devanagari and in decomposed (NFD) Latin, meaning
 * lives in combining marks, so a mark is a letter and never punctuation.
 *
 * The first block is the panel's reproduction of CORE-01, kept as fixed
 * regressions. Fictional family only ("Asha").
 */
import { describe, expect, it } from 'vitest';
import {
  checkEdit,
  faithfulClean,
  FILLERS,
  FUNCTION_WORDS,
  isNegation,
  KINSHIP,
  lettersOnly,
  MODALS,
  NEGATIONS,
  negationCount,
  NUMBER_WORDS,
  REPEAT_ALWAYS,
  REPEAT_SUGGEST_ONLY,
  termSpans,
  tokens,
  verifyEdits,
  words,
  type DictionaryTerm,
  type Edit,
  type EditType,
} from '../src';
import { splitsCluster } from '../src/text';

const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'आशा', kind: 'child', heardAs: ['आसा'] },
];

const ctx = (raw: string) => ({ raw, level: 'clean' as const, dictionary: DICT, protectedSpans: [] });

function edit(raw: string, original: string, replacement: string, type: EditType = 'punctuation', nth = 0): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`not found: ${original}`);
  return { type, start, end: start + original.length, original, replacement, source: 'model' };
}

/** null when the verifier applies the edit, else its reject reason. */
function verdict(raw: string, e: Edit): string | null {
  const r = verifyEdits([e], ctx(raw));
  return r.accepted.length ? null : r.rejected[0].reason;
}

/** A raw edit at explicit offsets, for boundaries `indexOf` cannot express. */
function at(raw: string, start: number, end: number, replacement: string, type: EditType = 'punctuation'): Edit {
  return { type, start, end, original: raw.slice(start, end), replacement, source: 'model' };
}

// NFD "café": e + U+0301 COMBINING ACUTE ACCENT.
const CAFE_NFD = 'café';
const CAFE_NFC = 'café';

describe('CORE-01 regressions: a combining mark is a letter, never punctuation', () => {
  it('tokenises Devanagari words whole: "वह खुश है" is three words, not four fragments', () => {
    expect(tokens('वह खुश है').map((t) => t.word)).toEqual(['वह', 'खुश', 'है']);
  });

  it('keeps vowel signs in lettersOnly: है and हो differ', () => {
    expect(lettersOnly('है')).not.toBe(lettersOnly('हो'));
  });

  it('refuses है -> हो as "punctuation" (a different verb form)', () => {
    expect(verdict('वह खुश है।', edit('वह खुश है।', 'है', 'हो'))).toBe('punctuation_changed_letters');
  });

  it('refuses नहीं -> नह as "punctuation" (drops the negation)', () => {
    expect(verdict('मैं नहीं जाऊंगा।', edit('मैं नहीं जाऊंगा।', 'नहीं', 'नह'))).toBe('punctuation_changed_letters');
  });

  it('refuses नहीं -> नही as "punctuation" (drops the anusvara)', () => {
    expect(verdict('मैं नहीं जाऊंगा।', edit('मैं नहीं जाऊंगा।', 'नहीं', 'नही'))).toBe('punctuation_changed_letters');
  });

  it('refuses adding a virama as "punctuation": नमक -> नम्क', () => {
    expect(verdict('थोड़ा नमक डालो।', edit('थोड़ा नमक डालो।', 'नमक', 'नम्क'))).toBe('punctuation_changed_letters');
  });

  it('refuses inserting a bare virama between two letters', () => {
    const raw = 'थोड़ा नमक डालो।';
    const i = raw.indexOf('नमक') + 2; // between म and क
    expect(verdict(raw, at(raw, i, i, '्'))).toBe('punctuation_changed_letters');
  });

  it('refuses removing a nukta as "punctuation": ज़रा -> जरा', () => {
    expect(verdict('ज़रा रुको।', edit('ज़रा रुको।', 'ज़रा', 'जरा'))).toBe('punctuation_changed_letters');
  });

  it('treats an NFD accent as a letter: "café" -> "cafe" is refused', () => {
    const raw = `We went to the ${CAFE_NFD} today.`;
    expect(verdict(raw, edit(raw, CAFE_NFD, 'cafe'))).toBe('punctuation_changed_letters');
  });

  it('refuses dropping the NFD accent on its own as "punctuation"', () => {
    const raw = `We went to the ${CAFE_NFD} today.`;
    const i = raw.indexOf('́');
    expect(verdict(raw, at(raw, i, i + 1, ''))).not.toBeNull();
  });

  it('keeps the Latin control: "is" -> "us" is still refused', () => {
    expect(verdict('he is here.', edit('he is here.', 'is', 'us'))).toBe('punctuation_changed_letters');
  });
});

describe('NFC comparison: one word, two spellings', () => {
  it('tokenises an NFD word as one token that compares equal to its NFC form', () => {
    expect(tokens(`the ${CAFE_NFD}`).map((t) => t.word)).toEqual(['the', CAFE_NFD]);
    expect(words(CAFE_NFD)).toEqual(words(CAFE_NFC));
    expect(lettersOnly(CAFE_NFD)).toBe(lettersOnly(CAFE_NFC));
  });

  it('accepts NFD -> NFC of the same word as "punctuation" (no letter changes)', () => {
    const raw = `We went to the ${CAFE_NFD} today.`;
    expect(verdict(raw, edit(raw, CAFE_NFD, CAFE_NFC))).toBeNull();
  });

  it('still adds a final period after an NFD word', () => {
    const raw = `we went to the ${CAFE_NFD}`;
    expect(verdict(raw, at(raw, raw.length, raw.length, '.'))).toBeNull();
  });

  it('collapses an accidental repeat whose copies differ only in normal form', () => {
    const out = faithfulClean(`the the ${CAFE_NFD} was busy`, { level: 'clean', dictionary: [] });
    expect(out.text).toBe(`the ${CAFE_NFD} was busy`);
  });
});

describe('edit boundaries never cut a letter from its marks', () => {
  it.each([
    ['before a vowel sign', 'वह खुश है', 'है', 1],
    ['after a virama, before the bound letter', 'नम्क', 'नम्क', 3],
    ['before an NFD accent', CAFE_NFD, CAFE_NFD, 4],
  ])('splitsCluster: %s', (_label, text, word, offset) => {
    expect(splitsCluster(text, text.indexOf(word) + offset)).toBe(true);
  });

  it('a boundary between words or after a final virama is not inside a cluster', () => {
    expect(splitsCluster('वह खुश', 2)).toBe(false);
    expect(splitsCluster('वाक्', 4)).toBe(false);
    expect(splitsCluster('वाक् ', 4)).toBe(false);
  });

  it('refuses a "punctuation" period wedged between a letter and its vowel sign', () => {
    const raw = 'वह खुश है';
    const i = raw.indexOf('है') + 1;
    expect(verdict(raw, at(raw, i, i, '.'))).toBe('splits_word');
  });

  it('refuses a removal that leaves an orphan vowel sign behind', () => {
    const raw = 'उम, वह खुश है';
    const i = raw.indexOf('है');
    expect(checkEdit(at(raw, i, i + 1, '', 'filler'), ctx(raw))).toBe('splits_word');
  });

  it('refuses joining a Hindi word across a space ("खुश है" -> "खुशहै")', () => {
    const raw = 'वह खुश है।';
    const i = raw.indexOf(' है');
    expect(verdict(raw, at(raw, i, i + 1, ''))).toBe('changes_word');
  });
});

describe('Devanagari negations are guarded', () => {
  it.each(['नहीं', 'नही', 'मत', 'ना', 'न'])('%s is a negation', (w) => {
    expect(isNegation(w)).toBe(true);
  });

  it('counts a decomposed नहीं (NFD-shaped input) the same as the composed one', () => {
    expect(isNegation('नहीं'.normalize('NFD'))).toBe(true);
  });

  it('Roman "na" stays a tag particle, not a negation', () => {
    expect(isNegation('na')).toBe(false);
  });

  it('refuses removing मत as a filler', () => {
    const raw = 'उसे मत उठाओ।';
    expect(verdict(raw, edit(raw, 'मत ', '', 'filler'))).toBe('not_a_filler');
  });

  it('refuses a "repeat" that removes the only नहीं', () => {
    const raw = 'नहीं नहीं, वह सो रही है।';
    expect(verdict(raw, edit(raw, ' नहीं', '', 'repeat'))).toBe('removes_negation');
  });

  it('refuses a punctuation edit that would change the negation count', () => {
    const raw = 'मैं नहीं जाऊंगा।';
    expect(negationCount(raw)).toBe(1);
    expect(verdict(raw, edit(raw, 'नहीं', 'न हीं'))).not.toBeNull();
  });

  it('refuses a word swap that turns नहीं into है, under any label', () => {
    const raw = 'वह खुश नहीं है।';
    for (const type of ['punctuation', 'agreement', 'filler', 'repeat', 'false_start'] as EditType[]) {
      expect(verdict(raw, edit(raw, 'नहीं', 'है', type)), type).not.toBeNull();
    }
  });
});

describe('dictionary terms respect Indic word boundaries', () => {
  it('a term does not match the start of a longer word whose next character is a vowel sign', () => {
    expect(termSpans('आशा आई', ['आश'])).toEqual([]);
    expect(termSpans('आशा आई', ['आशा'])).toEqual([{ start: 0, end: 3 }]);
  });

  it('corrects a learned Devanagari mishearing to the term', () => {
    const out = faithfulClean('आसा आज हँसी', { level: 'clean', dictionary: DICT });
    expect(out.text).toBe('आशा आज हँसी');
  });
});

describe('CORE-10: verifier allowlists are read-only at runtime', () => {
  const sets: Array<[string, ReadonlySet<string>]> = [
    ['FUNCTION_WORDS', FUNCTION_WORDS],
    ['FILLERS', FILLERS],
    ['NEGATIONS', NEGATIONS],
    ['MODALS', MODALS],
    ['NUMBER_WORDS', NUMBER_WORDS],
    ['KINSHIP', KINSHIP],
    ['REPEAT_ALWAYS', REPEAT_ALWAYS],
    ['REPEAT_SUGGEST_ONLY', REPEAT_SUGGEST_ONLY],
  ];

  it.each(sets)('%s cannot be widened, narrowed or cleared', (_name, set) => {
    const mutable = set as Set<string>;
    const size = set.size;
    expect(Object.isFrozen(set)).toBe(true);
    expect(() => mutable.add('asha-was-here')).toThrow(TypeError);
    expect(() => mutable.delete([...set][0])).toThrow(TypeError);
    expect(() => mutable.clear()).toThrow(TypeError);
    expect(set.size).toBe(size);
    expect(set.has('asha-was-here')).toBe(false);
  });

  it('a caller cannot make "basically" a filler and get it removed', () => {
    expect(() => (FILLERS as Set<string>).add('basically')).toThrow(TypeError);
    const raw = 'She basically ran.';
    expect(verdict(raw, edit(raw, 'basically ', '', 'filler'))).toBe('not_a_filler');
  });
});
