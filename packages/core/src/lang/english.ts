/**
 * The English text-rules pack, the only pack bundled in the app (founder
 * decision 15). Built from lang/english-tables.ts, the same sets the engine
 * used before packs existed, so English cleaning is unchanged.
 *
 * packs/text-rules/en.json is generated from this object for the platform
 * pipeline; test/lang.pack.test.ts fails if the two ever differ.
 */
import {
  AGREEMENT_GROUPS,
  CLEFT_OPENERS,
  DANGLING,
  DISCOURSE_AFTER_YOU,
  FILLERS,
  FUNCTION_WORDS,
  KINSHIP,
  MODALS,
  NEGATIONS,
  NUMBER_WORDS,
  OBJECT_VERBS,
  PRONOUNS,
  REPEAT_ALWAYS,
  REPEAT_SUGGEST_ONLY,
  SUBJECT_LEAD,
  TENSE_GROUPS,
} from './english-tables';
import type { Review, TextRulesPack } from './types';

const SHIPPED: Review = {
  status: 'native-reviewed',
  by: 'founding team, engine v3 (BL-064, TDD 03 7.1)',
  date: '2026-10-03',
  sources: ['packages/core/test/verify.test.ts', 'packages/core/test/verify.fuzz.test.ts'],
};

const list = (s: ReadonlySet<string>) => [...s];

export const ENGLISH_PACK: TextRulesPack = {
  kind: 'text-rules',
  schema: 1,
  language: 'en',
  version: '1.0.0',
  engine: 1,
  name: { english: 'English', native: 'English' },
  script: { primary: 'Latn', variants: [], direction: 'ltr', cased: true, segmentation: 'space' },
  attribution: [],
  normalization: {
    review: SHIPPED,
    form: 'NFC',
    dropFromFinal: [],
    ignoreForMatching: [],
    foldForMatching: {},
    house: { dashes: 'replace', dashTo: ', ', quotes: 'straight', ellipsis: 'dots', spaces: 'plain' },
  },
  punctuation: {
    review: SHIPPED,
    sentenceEnd: ['.', '!', '?'],
    terminal: '.',
    openers: [],
    pairOpeners: false,
    quotes: [],
    commas: [],
    localForms: {},
    localFormsSwallowSpace: false,
    spaceBefore: [],
    spaceInsideGuillemets: false,
  },
  fillers: { review: SHIPPED, auto: list(FILLERS), suggest: [] },
  meaning: {
    review: SHIPPED,
    negations: list(NEGATIONS),
    negationSuffixes: ["n't"],
    modals: list(MODALS),
    numberWords: list(NUMBER_WORDS),
    functionWords: list(FUNCTION_WORDS),
    pronouns: list(PRONOUNS),
    kinship: list(KINSHIP),
    alwaysCapitalized: ['i', "i'm", "i've", "i'll", "i'd"],
    agreementGroups: AGREEMENT_GROUPS.map((g) => [...g]),
    tenseGroups: TENSE_GROUPS.map((g) => [...g]),
    agreementInflections: [{ add: 's' }, { add: 'es' }, { strip: 'y', add: 'ies', afterConsonant: true }],
    vowels: 'aeiou',
    minStem: 3,
    tenseEndings: ['ies', 'es', 's', 'ied', 'ed', 'd', 'ing'],
    stemDropFinal: ['e'],
  },
  repeats: {
    review: SHIPPED,
    always: list(REPEAT_ALWAYS),
    suggest: list(REPEAT_SUGGEST_ONLY),
    dangling: list(DANGLING),
    verifierExtra: ['was'],
    cleft: { words: ['was'], openers: list(CLEFT_OPENERS) },
    subject: { words: ['you'], objectVerbs: list(OBJECT_VERBS), clauseLeads: list(SUBJECT_LEAD), discourseAfter: list(DISCOURSE_AFTER_YOU) },
    maxPhrase: 4,
  },
  phonetic: {
    review: SHIPPED,
    romanize: {},
    rewrite: [
      { from: 'sh', to: 'S' },
      { from: 'ch', to: 'C' },
      { from: 'ph', to: 'f' },
      { from: 'ck', to: 'k' },
      { from: 'q', to: 'k' },
      { from: 'x', to: 'ks' },
      { from: 'c', to: 's', before: 'eiy' },
      { from: 'c', to: 'k' },
      { from: 'z', to: 's' },
      { from: 'w', to: 'v' },
      { from: 'h', to: '' },
    ],
    vowels: 'aeiouy',
    collapseDoubles: true,
    dropFinalAfterVowel: ['r'],
    stripMarks: false,
    compareVowels: true,
  },
};
