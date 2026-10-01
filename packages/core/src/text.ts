/**
 * Text helpers: tokenizing, the function-word list, and character
 * normalization. All deterministic.
 */

const WORD_RE = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;

export interface Token {
  word: string;
  start: number;
  end: number;
}

export function tokens(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(WORD_RE)) {
    out.push({ word: m[0], start: m.index!, end: m.index! + m[0].length });
  }
  return out;
}

export function words(text: string): string[] {
  return tokens(text).map((t) => t.word.toLowerCase());
}

/** Letters and digits only, lowercased. Used to prove punctuation edits change no words. */
export function lettersOnly(text: string): string {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).join('').toLowerCase();
}

/**
 * Words a grammar repair may insert without adding meaning.
 * Deliberately short. Anything not here (or in the dictionary) that a
 * replacement introduces is treated as a new content word and rejected.
 */
export const FUNCTION_WORDS = new Set([
  'a', 'an', 'the',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'has', 'have', 'had', 'having',
  'do', 'does', 'did',
  'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'into', 'onto', 'up',
  'and', 'or', 'but', 'so', 'if', 'that', 'than', 'then', 'as',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
  'this', 'these', 'those',
  "it's", "i'm", "she's", "he's", "we're", "they're", "you're",
  "don't", "doesn't", "didn't", "isn't", "wasn't", "aren't", "weren't",
]);

/**
 * Removed only as standalone disfluencies. "like" and "you know" are
 * excluded on purpose: they are often meaningful, and part of how people talk.
 */
export const FILLERS = new Set(['um', 'umm', 'ummm', 'uh', 'uhh', 'uhm', 'erm', 'er', 'hmm', 'hmmm', 'mm']);

/**
 * Immediate repeats are only collapsed for these words. "no no no",
 * "very very", "bye bye" are kept: repetition is often emphasis, dialect,
 * or a toddler's own speech.
 */
export const REPEAT_COLLAPSIBLE = new Set([
  'the', 'a', 'an', 'i', 'and', 'to', 'is', 'it', 'was', 'she', 'he', 'we', 'of', 'in', 'that', 'so', 'but',
]);

/**
 * Normalize characters per the founder's standing rule: no em dashes,
 * en dashes, curly quotes, or ellipsis characters anywhere in an entry.
 * Applied to the final text only; the raw transcript is never altered.
 */
export function normalizeChars(input: string): string {
  let s = input;
  s = s.replace(/\s*—\s*/g, ', '); // em dash
  s = s.replace(/(\d)–(\d)/g, '$1-$2'); // en dash in ranges
  s = s.replace(/\s*–\s*/g, ', '); // other en dashes
  s = s.replace(/[‘’′]/g, "'");
  s = s.replace(/[“”″]/g, '"');
  s = s.replace(/…/g, '...');
  s = s.replace(/[  ]/g, ' ');
  s = s.replace(/­/g, '');
  // Tidy artifacts the substitutions can leave behind.
  s = s.replace(/,\s*,/g, ',');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/,\s*([.!?])/g, '$1');
  s = s.replace(/^,\s*/gm, '');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s;
}

/** Characters that must never survive into an entry. */
export const FORBIDDEN_CHARS = /[—–‘’“”…]/;
