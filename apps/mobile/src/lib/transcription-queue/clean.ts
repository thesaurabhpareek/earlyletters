/**
 * Cleaning a spoken transcript in its language (CLAUDE.md constitution;
 * pure, test/transcription-queue.test.ts).
 *
 * Every machine edit goes through @scribe/core `faithfulClean` and its
 * verifier. The language code is passed so language packs (packages/core
 * lang, language agent) can apply that language's filler, repeat and
 * punctuation tables. Until `CleanOptions` has a `language` field and a
 * language has its own tidy rules, that language is cleaned at `verbatim`
 * (dictionary spellings only): the English filler and repeat rules are never
 * run on Hindi, Mandarin or Arabic text, where they could remove real words.
 */
import { faithfulClean, type CleanOptions, type CleanResult, type DictionaryTerm, type EditLevel } from '@scribe/core';
import type { SpeechLanguage } from '../models/catalog';

/** Languages whose tidy rules (fillers, repeats) exist in @scribe/core today. Extend as language packs land. */
export const LANGUAGES_WITH_TIDY_RULES: ReadonlySet<SpeechLanguage> = new Set<SpeechLanguage>(['en']);

export function spokenEditLevel(language: SpeechLanguage): EditLevel {
  return LANGUAGES_WITH_TIDY_RULES.has(language) ? 'clean' : 'verbatim';
}

export function cleanSpoken(raw: string, dictionary: DictionaryTerm[], language: SpeechLanguage, level: EditLevel = spokenEditLevel(language)): CleanResult {
  const opts: CleanOptions & { language: SpeechLanguage } = { level, dictionary, language };
  return faithfulClean(raw, opts);
}
