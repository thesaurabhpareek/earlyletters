/**
 * Spoken language for Whisper (B-REQ-003; pure, test/transcribe-language.test.ts).
 *
 * Callers pass an ISO 639-1 code (from the `SpokenLanguage` list in
 * @scribe/core) or 'auto'. Whisper takes its own codes, which are ISO 639-1
 * except for a few; anything Whisper does not know becomes 'auto' (detect
 * per chunk) rather than an error, so a new language in the picker can never
 * stop a letter from getting its words. Never translate: `translate` is
 * always false in the engine.
 */

/** Whisper's 100 language codes, from g_lang in whisper.cpp 1.9.3 (whisper.rn 0.7.4). */
export const WHISPER_LANGUAGES: readonly string[] = [
  'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja', 'pt', 'tr', 'pl', 'ca', 'nl', 'ar', 'sv', 'it', 'id', 'hi', 'fi', 'vi',
  'he', 'uk', 'el', 'ms', 'cs', 'ro', 'da', 'hu', 'ta', 'no', 'th', 'ur', 'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy', 'sk',
  'te', 'fa', 'lv', 'bn', 'sr', 'az', 'sl', 'kn', 'et', 'mk', 'br', 'eu', 'is', 'hy', 'ne', 'mn', 'bs', 'kk', 'sq', 'sw',
  'gl', 'mr', 'pa', 'si', 'km', 'sn', 'yo', 'so', 'af', 'oc', 'ka', 'be', 'tg', 'sd', 'gu', 'am', 'yi', 'lo', 'uz', 'fo',
  'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my', 'bo', 'tl', 'mg', 'as', 'tt', 'haw', 'ln', 'ha', 'ba', 'jw', 'su', 'yue',
];

const KNOWN = new Set(WHISPER_LANGUAGES);

/** ISO codes (and old or regional forms) that Whisper spells differently. */
const ALIASES: Record<string, string> = {
  jv: 'jw', // Javanese
  iw: 'he', // Hebrew, old code
  in: 'id', // Indonesian, old code
  ji: 'yi', // Yiddish, old code
  nb: 'no', // Norwegian Bokmal
  fil: 'tl', // Filipino
};

export type WhisperLanguage = string; // one of WHISPER_LANGUAGES, or 'auto'

/** 'hi', 'HI', 'hi-IN', 'hi_IN' -> 'hi'; unknown or empty -> 'auto'. */
export function toWhisperLanguage(code: string | null | undefined): WhisperLanguage {
  if (!code) return 'auto';
  const primary = code.trim().toLowerCase().split(/[-_]/)[0];
  if (!primary || primary === 'auto') return 'auto';
  const mapped = ALIASES[primary] ?? primary;
  return KNOWN.has(mapped) ? mapped : 'auto';
}
