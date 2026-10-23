/**
 * What the language picker offers (D-111 item 4). Pure and tested (test/language-picker-english-only.test.ts).
 *
 * English only (`capabilities.englishOnly`, on in the two alpha profiles): the alpha transcribes English
 * only, and another language needs a native reviewer first. The sheet lists English alone, with no search
 * field (there is nothing to search), and one line from packages/content that other languages come in a
 * later update. Otherwise it offers every language, with search, as before.
 *
 * This decides only what the sheet shows. Nothing here reads or writes the stored choice: a language
 * already set on the phone (a development build) stays as it is until the person picks another, and the
 * text rules, packs and speech catalog do not read this.
 */
import { languageCopy } from '@scribe/content';
import { LANGUAGES, type LanguageInfo } from '@scribe/core';

export interface LanguagePickerView {
  /** The languages the sheet lists; search filters within these. */
  languages: readonly LanguageInfo[];
  /** Whether the search field is shown. */
  search: boolean;
  /** One line under the list, or null for none. */
  note: string | null;
}

/** Every language, with search: the picker as it was before the flag. */
const EVERY_LANGUAGE: LanguagePickerView = { languages: LANGUAGES, search: true, note: null };

const ENGLISH_ONLY: LanguagePickerView = {
  languages: LANGUAGES.filter((l) => l.code === 'en'),
  search: false,
  note: languageCopy.picker.englishOnly,
};

/** The sheet's contents for this build. Referentially stable, so the picker can memo on it. */
export function languagePickerView(englishOnly: boolean): LanguagePickerView {
  return englishOnly ? ENGLISH_ONLY : EVERY_LANGUAGE;
}
