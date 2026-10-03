/**
 * Text-rules packs: per-language rules as DATA (ADR 0014).
 *
 * A pack is versioned JSON. It holds word tables, a punctuation profile,
 * normalisation steps, script information and phonetic tables. It never
 * holds code: no regular expressions, no functions, no templates that get
 * evaluated. The generic engine in lang/engine.ts interprets it; that
 * engine ships in the app and covers every language, so downloading a
 * pack never downloads executable code (App Store guideline 2.5.2).
 *
 * Only English is bundled (lang/english.ts). The other packs are JSON in
 * packs/text-rules/, built and signed by the platform pipeline, fetched
 * when an author picks that language, and checked by validatePack before
 * the engine sees them.
 *
 * Every table carries a review status. The engine applies a table only
 * when its status is good enough for what the table does (see
 * MIN_STATUS): a filler list removes words, so it needs a native
 * speaker's sign-off; a punctuation profile only moves marks the verifier
 * already guards, so a cited standard is enough.
 */

/** v1.0 spoken-letter languages (founder decision 6, 3 Oct 2026). */
export const LANGUAGE_CODES = ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

/** ISO 15924 script codes the engine knows. Hans and Hant are both Han. */
export const SCRIPT_CODES = ['Latn', 'Deva', 'Hans', 'Hant', 'Arab'] as const;
export type ScriptCode = (typeof SCRIPT_CODES)[number];

/** Pack schema version this engine reads. */
export const TEXT_RULES_SCHEMA = 1;

/**
 * Interpreter version. A pack names the lowest interpreter it needs in
 * `engine`; an older app refuses the pack (validatePack: engine_too_new)
 * and keeps working in safe mode instead of misreading new fields.
 */
export const LANG_ENGINE_VERSION = 1;

/**
 * draft            researched, not signed off: the engine ignores it.
 * cited            backed by a published standard (RAE, GB/T 15834, Unicode): enough for punctuation, normalisation and script tables.
 * native-reviewed  a native speaker signed it off for this product's rules: needed for anything that removes or matches words.
 */
export const REVIEW_STATUSES = ['draft', 'cited', 'native-reviewed'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface Review {
  status: ReviewStatus;
  /** A role, never a private person's details: "native speaker, hi-IN, founding team". */
  by?: string;
  /** YYYY-MM-DD */
  date?: string;
  /** Citations: URLs or bibliographic references. */
  sources?: string[];
}

export type Segmentation = 'space' | 'char';

export interface PackScript {
  /** The script the language is written in by default. */
  primary: ScriptCode;
  /** Other scripts an author may choose (zh: Hant). */
  variants: ScriptCode[];
  direction: 'ltr' | 'rtl';
  /** Has upper and lower case (Latin). Sentence case and the name-capital heuristic need it. */
  cased: boolean;
  /**
   * 'space': words are separated by spaces. 'char': every Han character is
   * its own token (Hermes has no Intl.Segmenter; see ADR 0014), so an edit
   * can remove one character without "splitting a word".
   */
  segmentation: Segmentation;
}

export interface HousePolicy {
  /** em and en dashes: replaced by `dashTo`, or kept. */
  dashes: 'replace' | 'keep';
  /** What a dash becomes: ", " in Latin text, "，" in Chinese. */
  dashTo: string;
  /** Curly quotes to straight, or kept (Chinese uses “ ” as its standard quotes). */
  quotes: 'straight' | 'keep';
  /** The ellipsis character to three dots, or kept (Chinese …… is standard). */
  ellipsis: 'dots' | 'keep';
  /** No-break spaces to plain spaces, or kept (French puts them before ; : ! ?). */
  spaces: 'plain' | 'keep';
}

export interface NormalizationTable {
  review: Review;
  /** Only NFC in schema 1. Raw transcripts should already be NFC (see toNFC). */
  form: 'NFC';
  /** Characters dropped from the final text only, never from raw. Allowed: U+0640 Arabic tatweel. */
  dropFromFinal: string[];
  /** Marks ignored when a word is compared with the tables (Arabic harakat). Output keeps them. */
  ignoreForMatching: string[];
  /** Letter variants folded for table comparison only (أ -> ا). Output keeps them. */
  foldForMatching: Record<string, string>;
  house: HousePolicy;
}

export interface SpaceBeforeRule {
  /** A punctuation mark, e.g. "?" or ":". */
  mark: string;
  /** narrow: U+202F; nbsp: U+00A0. */
  space: 'narrow' | 'nbsp';
  /** Insert the space when there is none (French ":"), or only convert an existing plain space (French "?"). */
  insert: boolean;
}

export interface PunctuationTable {
  review: Review;
  /** Marks that end a sentence, in this language's forms ("।", "。"). ASCII . ! ? are always included. */
  sentenceEnd: string[];
  /** The mark added at the end of a letter that has none, after a word in the primary script. */
  terminal: string;
  /** Opening marks that belong to the next word: ¿ ¡ (Spanish). */
  openers: string[];
  /** Spanish: every ¿ pairs with a ? that ends its clause, every ¡ with a !. */
  pairOpeners: boolean;
  /** Extra quotation marks used by this language (« » „ “ 「 」 『 』). */
  quotes: string[];
  /** Commas this language uses besides ",": "，" "،". */
  commas: string[];
  /**
   * ASCII mark -> this language's form, applied only right after a letter of
   * the primary script: zh "," -> "，", ar "?" -> "؟", hi "." -> "।". Keys
   * must be one of , . ? ! ; : and the value must keep the mark's meaning.
   */
  localForms: Record<string, string>;
  /** Drop the plain space after a converted full-width mark (Chinese marks carry their own spacing). */
  localFormsSwallowSpace: boolean;
  /** French: the no-break space before high punctuation. */
  spaceBefore: SpaceBeforeRule[];
  /** French: no-break spaces just inside « ». */
  spaceInsideGuillemets: boolean;
}

export interface FillerTable {
  review: Review;
  /** Hesitation sounds with no lexical meaning, removed by the rules at the clean level. */
  auto: string[];
  /** Sounds that can also mean something ("mm" for yes): offered to the parent, never removed by the engine. */
  suggest: string[];
}

export interface AgreementInflection {
  /** Removed from the base form first ("y" in carry -> carries). */
  strip?: string;
  add: string;
  /** Only when the character before `strip` is not one of `vowels`. */
  afterConsonant?: boolean;
}

export interface MeaningTable {
  review: Review;
  negations: string[];
  /** Word endings that negate ("n't"). */
  negationSuffixes: string[];
  modals: string[];
  numberWords: string[];
  functionWords: string[];
  pronouns: string[];
  kinship: string[];
  /** Words always written with a capital wherever they stand (English "I"). */
  alwaysCapitalized: string[];
  /** Same word, different number or person: the only swaps "agreement" may make. Empty = agreement off. */
  agreementGroups: string[][];
  /** Same word, different tense: a swap inside one of these is refused as a tense change. */
  tenseGroups: string[][];
  /** Regular number/person endings (English walk -> walks). Empty = none. */
  agreementInflections: AgreementInflection[];
  /** Vowel letters, for afterConsonant. */
  vowels: string;
  /** Shortest base form an inflection may apply to. */
  minStem: number;
  /** Tense and aspect endings, for spotting love -> loved as a tense change. */
  tenseEndings: string[];
  /** Letters dropped from the end of a stem after an ending is removed (English "e"). */
  stemDropFinal: string[];
}

export interface RepeatTable {
  review: Review;
  /** Doubles that are never grammatical: removed by the rules. */
  always: string[];
  /** Doubles that may be meant: offered, never removed by the engine. */
  suggest: string[];
  /** A phrase ending in one of these is unfinished, so saying it again is a restart. */
  dangling: string[];
  /** Words the verifier also accepts as a single-word repeat (English "was", see cleft). */
  verifierExtra: string[];
  /** Pseudo-clefts: "what it was was magic". A doubled `word` after an `opener` in the same sentence is kept. */
  cleft: { words: string[]; openers: string[] };
  /**
   * Subject doubles ("today you you held"): auto when the first copy starts a
   * clause, kept after an object verb ("told you you were"), suggested otherwise.
   */
  subject: { words: string[]; objectVerbs: string[]; clauseLeads: string[]; discourseAfter: string[] };
  /** Longest phrase checked for a restart. */
  maxPhrase: number;
}

export interface RewriteRule {
  from: string;
  to: string;
  /** Only when the next character is one of these. */
  before?: string;
}

export interface AbugidaTable {
  /** Consonant letters (with nukta sequences as two code points after NFC) -> Latin. */
  consonants: Record<string, string>;
  /** Dependent vowel signs (matras) -> Latin; they replace the inherent vowel. */
  vowelSigns: Record<string, string>;
  /** The virama: no vowel after the consonant. */
  virama: string;
  /** The inherent vowel written after a bare consonant. */
  inherent: string;
  /** Hindi schwa deletion at the end of a word. */
  dropFinalInherent: boolean;
}

export interface PhoneticTable {
  review: Review;
  /** Script characters or sequences -> lowercase Latin (independent vowels, Arabic letters, signs). Longest match wins. */
  romanize: Record<string, string>;
  /** Devanagari-style consonant + vowel-sign handling. */
  abugida?: AbugidaTable;
  /** Chinese: toneless pinyin syllable -> the characters read that way (most common reading, Unihan kMandarin). */
  syllables?: Record<string, string>;
  /** Ordered spelling rewrites on the lowercase Latin form (sh -> S, c before e/i/y -> s). */
  rewrite: RewriteRule[];
  /** Vowel letters; each run becomes one "a". */
  vowels: string;
  collapseDoubles: boolean;
  /** Letters dropped at the end of a key after a vowel ("r": Usher ~ Usha). */
  dropFinalAfterVowel: string[];
  /** Strip accents before matching (é -> e). */
  stripMarks: boolean;
  /** Compare the number of vowel groups too (off for abjads, which do not write short vowels). */
  compareVowels: boolean;
}

export interface VariantMap {
  /** Characters in the other script... */
  from: string;
  /** ...and, at the same position, the form in this target script. Same length in code points. */
  to: string;
}

export interface ScriptVariantTable {
  review: Review;
  /** Per target script: one-to-one character conversions. Ambiguous characters are left out. */
  targets: Partial<Record<ScriptCode, VariantMap>>;
}

export interface AsrHints {
  /** Text a recogniser may be primed with, per script (Whisper initial prompt). Never shown, never stored in a letter. */
  initialPrompt: Partial<Record<ScriptCode, string>>;
}

export interface TextRulesPack {
  kind: 'text-rules';
  schema: typeof TEXT_RULES_SCHEMA;
  language: LanguageCode;
  /** Semantic version of this pack's data, "1.0.0". */
  version: string;
  /** Lowest LANG_ENGINE_VERSION that can read it. */
  engine: number;
  name: { english: string; native: string };
  script: PackScript;
  /** Licence notices for third-party data in this pack. Shown in Settings, Licences. */
  attribution: string[];
  normalization: NormalizationTable;
  punctuation: PunctuationTable;
  fillers: FillerTable;
  meaning: MeaningTable;
  repeats: RepeatTable;
  phonetic: PhoneticTable;
  scriptVariants?: ScriptVariantTable;
  asr?: AsrHints;
}

/** The status a table needs before the engine uses it. */
export const MIN_STATUS = {
  normalization: 'cited',
  punctuation: 'cited',
  scriptVariants: 'cited',
  fillers: 'native-reviewed',
  meaning: 'native-reviewed',
  repeats: 'native-reviewed',
  phonetic: 'native-reviewed',
} as const satisfies Record<string, ReviewStatus>;

export function statusAtLeast(have: ReviewStatus, need: ReviewStatus): boolean {
  return REVIEW_STATUSES.indexOf(have) >= REVIEW_STATUSES.indexOf(need);
}
