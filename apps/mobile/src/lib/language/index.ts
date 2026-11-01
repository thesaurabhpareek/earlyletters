/**
 * Spoken languages on this phone (ADR 0014). Other screens import from here.
 *
 *   useSpokenLanguage()            primary plus up to two more, with Chinese script and Portuguese spelling
 *   getSpokenLanguages()           the same, outside React
 *   languageCleanOptions(lang)     spread into faithfulClean / cleanRulesOnly for a letter in that language
 *   rulesForLanguage(lang)         compiled LanguageRules (finalText, segments, describeEdit)
 *   ensureTextRules(code)          download a language's text-rules pack (English is built in)
 *   useTextRulesStatus(codes)      built in / on this phone / downloading / waiting, with sizes
 *   letterInputProps(code)         TextInput props for typed letter text
 */
export { deviceLocaleTag, getSpokenLanguages, useSpokenLanguage, type SpokenLanguageApi } from './spoken-language';
export {
  bcp47Of,
  formatBytes,
  letterInputProps,
  MAX_LANGUAGES,
  scriptOf,
  SPOKEN_LANGUAGE_KEY,
  type SpokenLanguage,
  type SpokenLanguages,
} from './spoken-language.logic';
export { installedTextRules, languageCleanOptions, rulesForLanguage } from './rules';
export { ensureTextRules, textRulesBytes, useTextRulesStatus, type TextRulesStatus } from './packs';
