/**
 * What the language picker offers (D-111 item 4). Pure and tested (test/language-picker-english-only.test.ts).
 *
 * English only (`capabilities.englishOnly`, on in the two alpha profiles): the alpha transcribes English
 * only, and another language needs a native reviewer first. The sheet lists English alone, with no search
 * field (there is nothing to search), and one line from packages/content that other languages come in a
 * later update. Otherwise it offers every language, with search, as before.
 *
 * This decides only what the sheet shows. Nothing here reads or writes the stored choice: a language
 * already set on the phone (a `.preview` install made before the switch) stays as it is until the person
 * picks another, and the text rules, packs and speech catalog do not read this. While the switch is on, the
 * recogniser hears such a choice in English and says so (lib/transcription-queue/hearing.ts).
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

/**
 * Settings, Spoken language, "Also spoken". English only: no Add row and no "Add up to two more" line, since
 * nothing could be added (VOICE.md: promise only what the build does). Languages already listed there stay,
 * each with Remove; with none, the section is not shown.
 */
export function alsoSpokenView(englishOnly: boolean, listed: number): { section: boolean; add: boolean; footer: boolean } {
  return { section: !englishOnly || listed > 0, add: !englishOnly, footer: !englishOnly };
}
