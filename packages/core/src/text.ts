/**
 * Text helpers: tokenizing, the function-word list, and character
 * normalization. All deterministic.
 */
import { FILLERS, FUNCTION_WORDS } from './lang/english-tables';

export { FILLERS, FUNCTION_WORDS };

/**
 * A word: letters and digits plus the combining marks that belong to them
 * (Devanagari vowel signs and virama, Arabic harakat, a decomposed accent),
 * joined by internal apostrophes. Marks never start a word. Without \p{M},
 * "हिंदी" fell apart into "ह" and "द", and an accent could be added or
 * removed without changing any "letter" (si -> sí). ASCII text tokenizes
 * exactly as before.
 */
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*/gu;

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

/**
 * Letters, combining marks and digits only, lowercased. Used to prove
 * punctuation edits change no words. Marks count: a vowel sign, nukta,
 * harakah or accent is part of how a word is spelled ("मैं" and "में" are
 * different words; so are "si" and "sí").
 */
export function lettersOnly(text: string): string {
  return (text.match(/[\p{L}\p{M}\p{N}]/gu) ?? []).join('').toLowerCase();
}

/* FUNCTION_WORDS and FILLERS live in lang/english-tables.ts (re-exported above). */

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
