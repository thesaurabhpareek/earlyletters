/**
 * Text helpers: tokenizing, the function-word list, and character
 * normalization. All deterministic.
 *
 * Unicode (CORE-01): a word is letters, combining marks and digits. Marks
 * (\p{M}) carry meaning in Indic scripts (है vs हो, नहीं vs नह) and in
 * decomposed (NFD) Latin (cafe + U+0301 is "café"), so they are never
 * treated as punctuation. Comparisons run on NFC; offsets always index the
 * text as given, which is never rewritten.
 */
import { FILLERS, FUNCTION_WORDS } from './lang/english-tables';

export { FILLERS, FUNCTION_WORDS };
export { frozenSet } from './frozen';

/** One word character: a letter, a combining mark or a digit. */
export const WORD_CHAR_CLASS = '\\p{L}\\p{M}\\p{N}';
/** Zero-width joiner and non-joiner: shape a conjunct inside a word, never split it. */
const JOINERS = '\\u200C\\u200D';

// A word starts with a letter or digit, so a stray mark (an emoji variation
// selector, an orphan vowel sign) is never a word of its own.
const WORD_RE = new RegExp(
  `[\\p{L}\\p{N}][${WORD_CHAR_CLASS}]*(?:[${JOINERS}]+[${WORD_CHAR_CLASS}]+|['’][${WORD_CHAR_CLASS}]+)*`,
  'gu',
);

/** NFC, so a precomposed and a decomposed spelling of the same word compare equal. */
export function nfc(text: string): string {
  // ASCII is already NFC; skip the normaliser on the hot path.
  return /^[\x00-\x7f]*$/.test(text) ? text : text.normalize('NFC');
}

const NOT_LETTER_MARK_DIGIT = new RegExp(`[^${WORD_CHAR_CLASS}]+`, 'gu');

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
  return tokens(text).map((t) => nfc(t.word).toLowerCase());
}

/**
 * Letters, marks and digits only, NFC, lowercased. Used to prove punctuation
 * edits change no words: a vowel sign, virama, nukta or accent is part of the
 * word, so adding, dropping or swapping one is a letter change.
 */
export function lettersOnly(text: string): string {
  return nfc(text).replace(NOT_LETTER_MARK_DIGIT, '').toLowerCase();
}

/** Viramas of the Indic scripts: the letter after one belongs to the same cluster (a conjunct). */
const VIRAMA = /[\u094D\u09CD\u0A4D\u0ACD\u0B4D\u0BCD\u0C4D\u0CCD\u0D4D]/u;
const CLUSTER_CONTINUES = /^[\p{M}\u200C\u200D]/u;

const LETTER_AT = /^\p{L}/u;

/**
 * True when offset `pos` falls inside one user-perceived character of
 * `text`: before a combining mark or joiner, between a virama (or joiner)
 * and the letter it binds, or between the two halves of a surrogate pair.
 * An edit boundary there would cut a letter from its marks.
 *
 * Hand-rolled on purpose instead of Intl.Segmenter, which the app's JS
 * engine may not provide; this package must run unchanged on the device.
 */
export function splitsCluster(text: string, pos: number): boolean {
  if (pos <= 0 || pos >= text.length) return false;
  const before = text[pos - 1];
  const after = text.slice(pos);
  if (CLUSTER_CONTINUES.test(after)) return true;
  if ((VIRAMA.test(before) || before === '\u200D' || before === '\u200C') && LETTER_AT.test(after)) return true;
  const hi = before.charCodeAt(0);
  const lo = text.charCodeAt(pos);
  return hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff;
}

/** Hyphens that join two words into one ("uh-uh", "mm-hmm", "so-so"). En and em dashes are not joiners. */
const HYPHEN = /^[-\u2010\u2011]$/;
const WORDISH = /^[\p{L}\p{M}\p{N}]$/u;

/** The code point that ends just before index `i`, or ''. */
function codePointBefore(text: string, i: number): string {
  if (i <= 0) return '';
  const lo = text.charCodeAt(i - 1);
  return lo >= 0xdc00 && lo <= 0xdfff && i >= 2 ? text.slice(i - 2, i) : text[i - 1];
}

/** The code point that starts at index `i`, or ''. */
function codePointAt(text: string, i: number): string {
  return i < text.length ? String.fromCodePoint(text.codePointAt(i)!) : '';
}

/**
 * True when the word at [start, end) of `text` is joined to a neighbouring
 * word by a hyphen, so it is one part of a hyphenated word: "uh-uh" (no),
 * "mm-hmm" (yes), "uh-oh", "so-so", "bye-bye". Removing a part changes the
 * word (F06-REQ-005, R-01 D6).
 */
export function hyphenJoined(text: string, start: number, end: number): boolean {
  const left = HYPHEN.test(text[start - 1] ?? '') && WORDISH.test(codePointBefore(text, start - 1));
  const right = HYPHEN.test(text[end] ?? '') && WORDISH.test(codePointAt(text, end + 1));
  return left || right;
}

const HYPHEN_COMPOUND = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:[-\u2010\u2011][\p{L}\p{M}\p{N}]+)+/gu;

/** The hyphenated words of `text`, NFC and lowercased, in order ("uh-uh", "so-so"). */
export function hyphenCompounds(text: string): string[] {
  return [...text.matchAll(HYPHEN_COMPOUND)].map((m) => nfc(m[0]).toLowerCase());
}

/* FUNCTION_WORDS and FILLERS live in lang/english-tables.ts (re-exported above). */

/* Which repeats are collapsed, suggested or kept lives in repeats.ts. */

/** An en or em dash between two digits, with any spaces or tabs around it (the second digit is not consumed: "1–2–3"). */
const NUMBER_DASH = /(\d)([ \t]*)[–—]([ \t]*)(?=\d)/g;

/**
 * A dash between two numbers is a range ("2 – 3 hours"): it becomes a hyphen
 * with its spacing kept. Run before the house rule turns other dashes into
 * commas, which would make the range a list ("2, 3 hours"). Engine 6.
 */
export function numberDashToHyphen(s: string): string {
  return s.replace(NUMBER_DASH, '$1$2-$3');
}

const DIGIT_GROUPS = /\p{N}+(?:[.,:/٫٬]\p{N}+)*/gu;
const digitGroups = (s: string) => (s.match(DIGIT_GROUPS) ?? []).join('|');

/**
 * `s.replace(re, rep)`, except that a match is kept as it was when replacing
 * it would join, split or change a number with the characters on either
 * side: "2 ,3" must never become "2,3" (found by the F06-REQ-021 property
 * test, 15 Oct; engine 6). Every tidy step of the house rule goes through it.
 */
export function replaceKeepingNumbers(s: string, re: RegExp, rep: string): string {
  return s.replace(re, (...args: unknown[]) => {
    const m = args[0] as string;
    const offset = args[args.length - 2] as number;
    const groups = args.slice(1, -2) as string[];
    const r = rep.replace(/\$(\d)/g, (_x, n: string) => groups[Number(n) - 1] ?? '');
    const b = s[offset - 1] ?? '';
    const a = s[offset + m.length] ?? '';
    return digitGroups(b + r + a) === digitGroups(b + m + a) ? r : m;
  });
}

/**
 * Normalize characters per the founder's standing rule: no em dashes,
 * en dashes, curly quotes, or ellipsis characters anywhere in an entry.
 * Applied to the final text only; the raw transcript is never altered.
 */
export function normalizeChars(input: string): string {
  // Whitespace here is [^\S\uFEFF]: JavaScript's \s also matches U+FEFF, an
  // invisible character this pass must never drop (found by the F06-REQ-021
  // property test, 15 Oct; engine 6).
  let s = numberDashToHyphen(input); // a range stays a range, never a list
  s = replaceKeepingNumbers(s, /[^\S\uFEFF]*—[^\S\uFEFF]*/g, ', '); // em dash
  s = s.replace(/(\d)–(\d)/g, '$1-$2'); // en dash in ranges
  s = replaceKeepingNumbers(s, /[^\S\uFEFF]*–[^\S\uFEFF]*/g, ', '); // other en dashes
  s = s.replace(/[‘’′]/g, "'");
  s = s.replace(/[“”″]/g, '"');
  s = s.replace(/…/g, '...');
  s = s.replace(/[  ]/g, ' ');
  // A soft hyphen (U+00AD) stays, like U+FEFF: this pass drops no invisible
  // character (R-01 D4; the #179 review's N3, 23 Oct 2026, once the property
  // test put U+00AD into its letters). Dropping it was an engine 5 rule.
  // Tidy artifacts the substitutions can leave behind.
  // None of them may join, split or change a number ("2 ,3" stays, never "2,3").
  s = replaceKeepingNumbers(s, /,[^\S\uFEFF]*,/g, ',');
  s = replaceKeepingNumbers(s, /[^\S\uFEFF]+,/g, ',');
  s = replaceKeepingNumbers(s, /,[^\S\uFEFF]*([.!?])/g, '$1');
  s = replaceKeepingNumbers(s, /^,[^\S\uFEFF]*/gm, '');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s;
}

/** Characters that must never survive into an entry. */
export const FORBIDDEN_CHARS = /[—–‘’“”…]/;

/**
 * Speech recognisers annotate sounds that are not speech: [BLANK_AUDIO],
 * (waves crashing), *music*, music notes. None of that is something a person
 * said, so it never enters the transcript. Observed Oct 1 2026: whisper base
 * turned 30 s of white noise into "(waves crashing)" with voice detection off.
 * Keep the original recogniser output in stt_meta if needed for debugging.
 *
 * Conservative by design: bracket tags, asterisk tags and music notes are
 * never speech, so they always go. Parenthetical text is removed only when
 * it is ALL the recogniser produced (the noise case); otherwise it may be
 * words someone said, and it stays. Apply to recogniser output only, never
 * to typed text.
 */
export function stripNonSpeech(input: string): string {
  const tidy = (s: string) =>
    s.replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  const withoutTags = tidy(
    input
      .replace(/\[[^\]\n]{1,40}\]/g, ' ')
      .replace(/\*[^*\n]{1,40}\*/g, ' ')
      .replace(/[♪♫♬♩]+/g, ' '),
  );
  const onlyParentheticals = /^(\s*\([^()\n]{1,40}\)[\s.,]*)+$/.test(withoutTags);
  return onlyParentheticals ? '' : withoutTags;
}
