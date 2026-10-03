/**
 * Meaning guards: the closed word tables the verifier uses to prove an edit
 * did not change what a person said (BL-064, TDD 03 section 7.1).
 *
 * Everything here is a small, explicit list or a pure function of letters.
 * When in doubt the tables say "this carries meaning", so the verifier
 * refuses. A refused edit costs a parent one untidy word; an accepted wrong
 * edit puts words in their mouth.
 */
import { FUNCTION_WORDS, tokens } from './text';

/** Normalise a word for comparison: lowercase, straight apostrophe. */
export function norm(word: string): string {
  return word.toLowerCase().replace(/[’‘′]/g, "'");
}

/** Words that negate on their own. Hindi/Hinglish forms included; "na" is excluded (also a tag particle). */
export const NEGATIONS: ReadonlySet<string> = new Set([
  'not', 'no', 'never', 'cannot', 'nobody', 'nothing', 'none', 'nowhere', 'neither', 'nor', 'nope', 'nah',
  'nahi', 'nahin',
]);

export function isNegation(word: string): boolean {
  const w = norm(word);
  return NEGATIONS.has(w) || w.endsWith("n't");
}

export function negationCount(text: string): number {
  return tokens(text).filter((t) => isNegation(t.word)).length;
}

/** Modal verbs and their contracted forms. Swapping one for another changes meaning. */
export const MODALS: ReadonlySet<string> = new Set([
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'ought',
  "can't", "couldn't", "won't", "wouldn't", "shan't", "shouldn't", "mightn't", "mustn't",
]);

/** Number words. Digits are handled by `numbersOf` directly. */
export const NUMBER_WORDS: ReadonlySet<string> = new Set([
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty',
  'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand', 'million', 'half', 'once', 'twice',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'dozen',
]);

/**
 * Every number in a text, in order: digit groups keep their separators
 * ("1,000" and "1.000" differ; "3:30" and "3.30" differ), number words are
 * lowercased.
 */
export function numbersOf(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\p{N}+(?:[.,:/]\p{N}+)*/gu)) out.push(m[0]);
  for (const t of tokens(text)) if (NUMBER_WORDS.has(norm(t.word))) out.push(norm(t.word));
  return out;
}

/** Marks that set a sentence's type: question or exclamation. */
export function moodMarks(text: string): string {
  return (text.match(/[?!¿¡]/g) ?? []).join('');
}

/** Quotation marks of any style. Adding or moving one changes who said what. */
export function quoteMarkCount(text: string): number {
  return (text.match(/["“”«»]/g) ?? []).length;
}

/**
 * Kinship and relationship words. A model may never turn one of these into a
 * dictionary name by similarity ("Daddy" -> "Asha"); a parent can still teach
 * the mapping explicitly through `heardAs` ("mama" -> "Mumma").
 */
export const KINSHIP: ReadonlySet<string> = new Set([
  'mom', 'mommy', 'mum', 'mummy', 'mumma', 'mama', 'mamma', 'ma', 'mother', 'amma', 'ammi', 'maa',
  'dad', 'daddy', 'papa', 'pappa', 'pa', 'father', 'baba', 'abba', 'appa',
  'nani', 'nana', 'dadi', 'dada', 'nanu', 'grandma', 'grandpa', 'granny', 'gran', 'grandad', 'granddad', 'grandmother',
  'grandfather', 'nanima', 'dadima', 'ajji', 'ajja', 'thatha', 'paati',
  'bua', 'chacha', 'chachi', 'mausi', 'masi', 'mausa', 'mami', 'mamu', 'tau', 'tai', 'taiji', 'fufa', 'phupho',
  'bhaiya', 'bhai', 'didi', 'dida', 'behen', 'aunty', 'auntie', 'aunt', 'uncle', 'sister', 'brother', 'sis', 'bro',
  'baby', 'son', 'daughter', 'husband', 'wife', 'cousin', 'nanny', 'teacher',
]);

/** Pronouns beyond the function-word list. */
const PRONOUNS: ReadonlySet<string> = new Set([
  'hers', 'mine', 'yours', 'theirs', 'ours', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
  'themselves', 'yourselves', "i'll", "i've", "i'd", "you'll", "she'll", "he'll", "we'll", "they'll",
  'who', 'whom', 'whose', 'someone', 'somebody', 'everyone', 'everybody', 'anyone', 'anybody',
]);

/** Words a similarity-based stt_fix may never replace. */
export function isProtectedWord(word: string): boolean {
  const w = norm(word);
  return (
    FUNCTION_WORDS.has(w) || PRONOUNS.has(w) || KINSHIP.has(w) || isNegation(w) || MODALS.has(w) || NUMBER_WORDS.has(w) ||
    /\p{N}/u.test(w)
  );
}

/** "I" and its contractions, which are always capitalised wherever they stand. */
export function isPronounI(word: string): boolean {
  return /^i(?:'(?:m|ve|ll|d))?$/.test(norm(word));
}

/* ---------- agreement: number and person only ---------- */

/** Same verb (or article), different number or person. Tense never changes inside a group. */
const AGREEMENT_GROUPS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['is', 'are', 'am']),
  new Set(['was', 'were']),
  new Set(['has', 'have']),
  new Set(['do', 'does']),
  new Set(['go', 'goes']),
  new Set(["isn't", "aren't"]),
  new Set(["wasn't", "weren't"]),
  new Set(["hasn't", "haven't"]),
  new Set(["doesn't", "don't"]),
  new Set(['a', 'an']),
];

/** Groups that span tenses. A move inside one of these is a tense change. */
const TENSE_GROUPS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['is', 'are', 'am', 'was', 'were', 'be', 'been', 'being']),
  new Set(['has', 'have', 'had', 'having']),
  new Set(['do', 'does', 'did', 'done', 'doing']),
  new Set(['go', 'goes', 'went', 'gone', 'going']),
  new Set(["isn't", "aren't", "wasn't", "weren't"]),
  new Set(["hasn't", "haven't", "hadn't"]),
  new Set(["doesn't", "don't", "didn't"]),
];

/** walk/walks, watch/watches, carry/carries: the same word with a number or person ending. */
function sameWordWithS(a: string, b: string): boolean {
  const [base, inflected] = a.length <= b.length ? [a, b] : [b, a];
  if (base.length < 3 || /['\p{N}]/u.test(base + inflected)) return false;
  if (FUNCTION_WORDS.has(base) || MODALS.has(base) || isNegation(base) || NUMBER_WORDS.has(base)) return false;
  if (inflected === `${base}s` || inflected === `${base}es`) return true;
  return /[^aeiou]y$/.test(base) && inflected === `${base.slice(0, -1)}ies`;
}

/** True when `a` -> `b` changes number or person only (case-insensitive). */
export function isAgreementPair(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (x === y) return false;
  if (AGREEMENT_GROUPS.some((g) => g.has(x) && g.has(y))) return true;
  return sameWordWithS(x, y);
}

/** Why a single-word swap is not agreement, for a precise reject reason. */
export function classifyWordSwap(a: string, b: string): 'changes_negation' | 'changes_modal' | 'changes_tense' | 'changes_word' | 'agreement_stem_mismatch' {
  const x = norm(a);
  const y = norm(b);
  if (isNegation(x) !== isNegation(y)) return 'changes_negation';
  if ((MODALS.has(x) || MODALS.has(y)) && x !== y) return 'changes_modal';
  if (TENSE_GROUPS.some((g) => g.has(x) && g.has(y))) return 'changes_tense';
  if (x.replace(/'/g, '') === y.replace(/'/g, '')) return 'changes_word'; // were -> we're
  // Same stem with a tense or aspect ending: love/loved, walk/walking, loves/loved.
  const stem = (w: string) => w.replace(/(ies|es|s|ied|ed|d|ing)$/, '').replace(/e$/, '');
  if (stem(x).length >= 3 && stem(x) === stem(y)) return 'changes_tense';
  return 'agreement_stem_mismatch';
}

/* ---------- stt_fix: is the original plausibly a mishearing of the term? ---------- */

/**
 * A rough sound key for names: "sh" and "ch" become single sounds (S, C),
 * vowels merge into "a", common spelling pairs merge, doubled letters
 * collapse, and a final "r" after a vowel drops (Usher ~ Usha). Built for
 * English spellings of English and Indian names; it is a filter against
 * swaps, not a phonetic algorithm.
 */
export function soundKey(text: string): string {
  let s = norm(text).replace(/[^\p{L}]/gu, '');
  s = s
    .replace(/sh/g, 'S')
    .replace(/ch/g, 'C')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/w/g, 'v')
    .replace(/h/g, '')
    .replace(/[aeiouy]+/g, 'a')
    .replace(/(.)\1+/g, '$1');
  if (/ar$/.test(s) && s.length > 2) s = s.slice(0, -1);
  return s;
}

/**
 * True when `original` plausibly is the term misheard: exactly the same
 * consonant sounds in the same order, and at most one vowel group more or
 * fewer. "Usher" ~ "Asha", "Nila" ~ "Neela", "ah shoe" ~ "Ashu"; "Ashok",
 * "Arya" and "moon" are not. Limitation: a real, different name with the
 * same sounds ("Aisha", "Isha") passes; the verifier only takes this path
 * for words the recogniser itself capitalised mid-sentence, and the review
 * screen underlines every stt_fix so the parent can undo it.
 */
export function soundsLike(original: string, term: string): boolean {
  const a = soundKey(original);
  const b = soundKey(term);
  if (!a || !b) return false;
  const consonants = (k: string) => k.replace(/a/g, '');
  const vowels = (k: string) => (k.match(/a/g) ?? []).length;
  if (Math.abs(vowels(a) - vowels(b)) > 1) return false;
  return consonants(a).length > 0 && consonants(a) === consonants(b);
}
