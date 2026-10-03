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
import {
  AGREEMENT_GROUPS as AGREEMENT_LISTS,
  KINSHIP,
  MODALS,
  NEGATIONS,
  NUMBER_WORDS,
  PRONOUNS,
  TENSE_GROUPS as TENSE_LISTS,
} from './lang/english-tables';

/* The English tables live in lang/english-tables.ts; the English text-rules pack is built from the same sets. */
export { KINSHIP, MODALS, NEGATIONS, NUMBER_WORDS };

/** Normalise a word for comparison: lowercase, straight apostrophe. */
export function norm(word: string): string {
  return word.toLowerCase().replace(/[’‘′]/g, "'");
}

export function isNegation(word: string): boolean {
  const w = norm(word);
  return NEGATIONS.has(w) || w.endsWith("n't");
}

export function negationCount(text: string): number {
  return tokens(text).filter((t) => isNegation(t.word)).length;
}

/**
 * Every number in a text, in order: digit groups keep their separators
 * ("1,000" and "1.000" differ; "3:30" and "3.30" differ), number words are
 * lowercased.
 */
export function numbersOf(text: string): string[] {
  const out: string[] = [];
  // ٫ and ٬ are the Arabic decimal and thousands separators.
  for (const m of text.matchAll(/\p{N}+(?:[.,:/٫٬]\p{N}+)*/gu)) out.push(m[0]);
  for (const t of tokens(text)) if (NUMBER_WORDS.has(norm(t.word))) out.push(norm(t.word));
  return out;
}

/**
 * Every mark that sets a sentence's type, in any script, mapped to one
 * canonical form: a full-width ？ (Chinese) and an Arabic ؟ are questions
 * exactly like "?", so turning 。 into ？ is caught, and turning "?" into ？
 * is not a change. Inverted ¿ and ¡ stay distinct (see LanguageRules for
 * the Spanish pairing rule).
 */
export const MOOD_CANON: Readonly<Record<string, string>> = {
  '?': '?', '？': '?', '؟': '?', '⸮': '?', '¿': '¿',
  '!': '!', '！': '!', '¡': '¡',
  '‽': '?!', '⁇': '??', '⁈': '?!', '⁉': '!?', '‼': '!!',
};
const MOOD_RE = /[?？؟⸮¿!！¡‽⁇⁈⁉‼]/g;

/** Marks that set a sentence's type: question or exclamation, canonicalised. */
export function moodMarks(text: string): string {
  return (text.match(MOOD_RE) ?? []).map((c) => MOOD_CANON[c]).join('');
}

/** Quotation marks of any style, including CJK corner brackets. Adding or moving one changes who said what. */
const QUOTE_RE = /["“”«»„‟‹›「」『』]/g;

export function quoteMarkCount(text: string): number {
  return (text.match(QUOTE_RE) ?? []).length;
}

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
const AGREEMENT_GROUPS: ReadonlyArray<ReadonlySet<string>> = AGREEMENT_LISTS.map((g) => new Set(g));

/** Groups that span tenses. A move inside one of these is a tense change. */
const TENSE_GROUPS: ReadonlyArray<ReadonlySet<string>> = TENSE_LISTS.map((g) => new Set(g));

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
 * fewer. "Usher" ~ "Asha", "Mira" ~ "Meera", "ah shoe" ~ "Ashu"; "Ashok",
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
