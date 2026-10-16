/**
 * Golden corpus for the faithful-clean engine (CORE-08).
 *
 * Every case is a raw transcript about the fictional family "Asha", plus the
 * edits a model might propose. The engine's output for each case is recorded
 * in `engine-v<ENGINE_VERSION>.json`. If any output changes while
 * ENGINE_VERSION stays the same, golden.test.ts fails: a stored entry must be
 * re-derivable with the exact engine that produced it.
 *
 * Fictional family only. Never put real names, real phrases or real dates here.
 */
import type { DictionaryTerm, EditLevel, EditType } from '../../src';

export const GOLDEN_DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'chalo', kind: 'word', heardAs: ['shallow'] },
  { term: 'आशा', kind: 'child', heardAs: ['आसा'] },
  { term: 'आशु', kind: 'nickname', heardAs: [] },
];

/** A proposed model edit, located by text: the `nth` (0-based) occurrence of `original`. */
export interface GoldenEdit {
  type: EditType;
  original: string;
  replacement: string;
  nth?: number;
}

export interface GoldenCase {
  id: string;
  lang: 'en' | 'hinglish' | 'hi' | 'nfd';
  raw: string;
  level?: EditLevel;
  locked?: string[];
  model?: GoldenEdit[];
  /** A dictionary for this case only (R-01 D10, D13 need names GOLDEN_DICT does not have). Default GOLDEN_DICT. */
  dictionary?: DictionaryTerm[];
}

/** R-01 D10: names that are everyday words. Fictional family only. */
const NAME_WORD_DICT: DictionaryTerm[] = [
  { term: 'Hope', kind: 'child', heardAs: [] },
  { term: 'Will', kind: 'nickname', heardAs: [] },
];
/** R-01 D13: a heard-as that is another family member's name. */
const TWO_NAMES_DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Usha'] },
  { term: 'Usha', kind: 'family', heardAs: [] },
];
/** Found 15 Oct: a taught heard-as that is a negation. */
const NEGATION_HEARD_DICT: DictionaryTerm[] = [{ term: 'Noa', kind: 'child', heardAs: ['no'] }];

const NFD_CAFE = 'café';
const NFD_ZOE = 'Zoë';
const NFD_NAIVE = 'naïve';
const NFD_SENOR = 'señor';

export const GOLDEN_CASES: GoldenCase[] = [
  // English
  { id: 'en-filler', lang: 'en', raw: 'Um, she was so happy when Asha saw the duck.' },
  { id: 'en-false-start', lang: 'en', raw: 'she was, um, she was so proud of herself' },
  { id: 'en-repeat-article', lang: 'en', raw: 'I will always remember the way you laughed at the the dog.' },
  { id: 'en-phrase-restart', lang: 'en', raw: 'it was like a like a little hiccup and then she slept' },
  { id: 'en-you-you', lang: 'en', raw: 'Today you you held the spoon by yourself.' },
  { id: 'en-emphasis-kept', lang: 'en', raw: 'I love you, I love you so much.' },
  { id: 'en-cleft-kept', lang: 'en', raw: 'What it was was magic.' },
  { id: 'en-dictionary', lang: 'en', raw: 'Usha ate peas and mama laughed.' },
  { id: 'en-quote-protected', lang: 'en', raw: 'Asia said "bau bau" to the cat.' },
  { id: 'en-verbatim', lang: 'en', raw: 'um she, uh, walked to Mumma', level: 'verbatim' },
  { id: 'en-locked', lang: 'en', raw: 'she said the the moon is hers', locked: ['the the moon'] },
  {
    id: 'en-model-honest',
    lang: 'en',
    raw: 'she have a cold but she is still smiling',
    model: [
      { type: 'agreement', original: 'have', replacement: 'has' },
      { type: 'punctuation', original: 'she', replacement: 'She' },
    ],
  },
  {
    id: 'en-model-hostile',
    lang: 'en',
    raw: 'I can come and she is happy.',
    model: [
      { type: 'agreement', original: 'can', replacement: 'cannot' },
      { type: 'agreement', original: 'is', replacement: 'was' },
      { type: 'punctuation', original: 'happy.', replacement: 'happy?' },
    ],
  },

  // Hinglish (Roman script)
  { id: 'hinglish-filler', lang: 'hinglish', raw: 'Um, Asha ne aaj pehli baar Mumma bola!' },
  { id: 'hinglish-negation', lang: 'hinglish', raw: 'woh nahi soyi, bilkul nahi.' },
  { id: 'hinglish-na-tag', lang: 'hinglish', raw: 'chalo, Nani ke ghar chalein na' },
  { id: 'hinglish-heard-as', lang: 'hinglish', raw: 'shallow beta, bath time' },
  { id: 'hinglish-repeat', lang: 'hinglish', raw: 'Ashu and and Nani played all day' },
  { id: 'hinglish-kinship', lang: 'hinglish', raw: 'Dadi ne kaha ki Asha bahut cute hai' },
  { id: 'hinglish-nahin', lang: 'hinglish', raw: 'she is nahin sleeping, nahin.' },
  {
    id: 'hinglish-model-negation',
    lang: 'hinglish',
    raw: 'woh nahi soyi aaj.',
    model: [{ type: 'filler', original: 'nahi ', replacement: '' }],
  },
  {
    id: 'hinglish-model-name-swap',
    lang: 'hinglish',
    raw: 'then Dada came home.',
    model: [{ type: 'stt_fix', original: 'Dada', replacement: 'Asha' }],
  },
  { id: 'hinglish-numbers', lang: 'hinglish', raw: 'Asha ne 2 roti khayi at 3:30' },

  // Devanagari
  { id: 'hi-plain', lang: 'hi', raw: 'वह खुश है।' },
  { id: 'hi-negation', lang: 'hi', raw: 'मैं नहीं जाऊंगा।' },
  { id: 'hi-dictionary', lang: 'hi', raw: 'आसा आज बहुत हँसी।' },
  { id: 'hi-dictionary-boundary', lang: 'hi', raw: 'आशाएँ बड़ी हैं, आसा सो गई।' },
  { id: 'hi-repeat-kept', lang: 'hi', raw: 'नहीं नहीं, वह सो रही है।' },
  { id: 'hi-um-and-double-kept', lang: 'hi', raw: 'उम, वह वह खेल रही थी' },
  { id: 'hi-mat', lang: 'hi', raw: 'उसे मत उठाओ, वह सो रही है।' },
  { id: 'hi-nukta', lang: 'hi', raw: 'ज़रा रुको, आशा आ रही है।' },
  { id: 'hi-question', lang: 'hi', raw: 'क्या तुमने चाँद देखा?' },
  { id: 'hi-double-danda', lang: 'hi', raw: 'आशु सो गया॥ फिर उठा' },
  {
    id: 'hi-model-hai-to-ho',
    lang: 'hi',
    raw: 'वह खुश है।',
    model: [{ type: 'punctuation', original: 'है', replacement: 'हो' }],
  },
  {
    id: 'hi-model-nahin-to-nah',
    lang: 'hi',
    raw: 'मैं नहीं जाऊंगा।',
    model: [{ type: 'punctuation', original: 'नहीं', replacement: 'नह' }],
  },
  {
    id: 'hi-model-anusvara',
    lang: 'hi',
    raw: 'मैं नहीं जाऊंगा।',
    model: [{ type: 'punctuation', original: 'नहीं', replacement: 'नही' }],
  },
  {
    id: 'hi-model-virama',
    lang: 'hi',
    raw: 'थोड़ा नमक डालो।',
    model: [{ type: 'punctuation', original: 'नमक', replacement: 'नम्क' }],
  },
  {
    id: 'hi-model-honest-period',
    lang: 'hi',
    raw: 'आशा आज बहुत हँसी',
    model: [{ type: 'punctuation', original: 'हँसी', replacement: 'हँसी।' }],
  },
  {
    id: 'hi-model-wedge',
    lang: 'hi',
    raw: 'वह खुश है',
    model: [{ type: 'punctuation', original: 'ह', replacement: 'ह.', nth: 1 }],
  },

  // Decomposed (NFD) Latin
  { id: 'nfd-plain', lang: 'nfd', raw: `We went to the ${NFD_CAFE} and Asha laughed.` },
  { id: 'nfd-repeat', lang: 'nfd', raw: `the the ${NFD_CAFE} was busy but she was not.` },
  { id: 'nfd-quoted', lang: 'nfd', raw: `Mumma said "${NFD_CAFE}" twice.` },
  { id: 'nfd-name', lang: 'nfd', raw: `Asha met ${NFD_ZOE} at the park today` },
  { id: 'nfd-filler', lang: 'nfd', raw: `um, it was a ${NFD_NAIVE} little song` },
  {
    id: 'nfd-model-drop-accent',
    lang: 'nfd',
    raw: `We went to the ${NFD_CAFE} today.`,
    model: [{ type: 'punctuation', original: NFD_CAFE, replacement: 'cafe' }],
  },
  {
    id: 'nfd-model-to-nfc',
    lang: 'nfd',
    raw: `We went to the ${NFD_CAFE} today.`,
    model: [{ type: 'punctuation', original: NFD_CAFE, replacement: 'café' }],
  },
  {
    id: 'nfd-model-capital',
    lang: 'nfd',
    raw: `${NFD_SENOR.toLowerCase()} Ashu waved`,
    model: [{ type: 'punctuation', original: 's', replacement: 'S' }],
  },

  // R-01 launch gate, engine 6 (F06 section 7.1). Added with engine 6; every case above is unchanged from engine 5.
  { id: 'r01-d6-uh-uh', lang: 'en', raw: 'Did you want more? Uh-uh, she said.' },
  { id: 'r01-d6-mm-hmm', lang: 'en', raw: 'Mm-hmm, Asha nodded and um smiled.' },
  { id: 'r01-d6-uh-uh-spaced', lang: 'en', raw: 'Uh uh, not now, Asha.' },
  { id: 'r01-d7-single-quotes', lang: 'en', raw: 'Asha said ‘um, up’ twice.' },
  {
    id: 'r01-d10-name-words',
    lang: 'en',
    raw: 'I hope you sleep well and we will see Hope tomorrow.',
    dictionary: NAME_WORD_DICT,
  },
  { id: 'r01-d13-name-swap', lang: 'en', raw: 'Usha came over today and asha laughed.', dictionary: TWO_NAMES_DICT },
  { id: 'r01-d13-heard-as-negation', lang: 'en', raw: 'No, she did not cry. I said no.', dictionary: NEGATION_HEARD_DICT },
  { id: 'r01-number-range', lang: 'en', raw: 'Asha slept 2 – 3 hours.' },
  {
    id: 'r01-d4-model-direction-mark',
    lang: 'en',
    raw: 'Asha laughed at the duck.',
    model: [{ type: 'punctuation', original: 'laughed', replacement: 'laughed‏' }],
  },
  {
    id: 'r01-d9-model-noun-plural',
    lang: 'en',
    raw: 'We saw the dogs with Asha.',
    model: [{ type: 'agreement', original: 'dogs', replacement: 'dog' }],
  },
];
