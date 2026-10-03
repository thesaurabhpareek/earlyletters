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

/**
 * A set that cannot change after it is built (CORE-10). `add`, `delete` and
 * `clear` throw, and the object is frozen, so a caller cannot widen an
 * allowlist the verifier depends on.
 */
const SEALED = new WeakSet<object>();
class FrozenSet<T> extends Set<T> {
  constructor(items: Iterable<T>) {
    super(items);
    SEALED.add(this);
    Object.freeze(this);
  }
  override add(value: T): this {
    if (SEALED.has(this)) throw new TypeError('This set is read-only.');
    return super.add(value);
  }
  override delete(): boolean {
    throw new TypeError('This set is read-only.');
  }
  override clear(): void {
    throw new TypeError('This set is read-only.');
  }
}

export function frozenSet<T>(items: Iterable<T>): ReadonlySet<T> {
  return new FrozenSet(items);
}

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

/**
 * Words a grammar repair may insert without adding meaning.
 * Deliberately short. Anything not here (or in the dictionary) that a
 * replacement introduces is treated as a new content word and rejected.
 */
export const FUNCTION_WORDS: ReadonlySet<string> = frozenSet([
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
export const FILLERS: ReadonlySet<string> = frozenSet(['um', 'umm', 'ummm', 'uh', 'uhh', 'uhm', 'erm', 'er', 'hmm', 'hmmm', 'mm']);

/* Which repeats are collapsed, suggested or kept lives in repeats.ts. */

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
