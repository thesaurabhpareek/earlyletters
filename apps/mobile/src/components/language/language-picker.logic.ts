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
 * picks another, and the text rules, packs and speech catalog do not read this. While the switch is on, a
 * recording in such a language waits for its language and says so (lib/transcription-queue/language-hold.ts).
 */
import { languageCopy } from '@scribe/content';
import { LANGUAGES, type LanguageCode, type LanguageInfo } from '@scribe/core';

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

const SOME: Map<string, LanguagePickerView> = new Map();

/**
 * The sheet's contents for this build. Referentially stable, so the picker can memo on it.
 * `heard` is what the build hears (lib/language/heard-languages.ts), or the English-only switch alone as a boolean.
 * English alone: as above. Every language: as before. Some (D-125 item 2): those, in the usual order, with search
 * and the same line under the list, since the others are still to come.
 */
export function languagePickerView(heard: boolean | readonly LanguageCode[]): LanguagePickerView {
  if (typeof heard === 'boolean') return heard ? ENGLISH_ONLY : EVERY_LANGUAGE;
  const languages = LANGUAGES.filter((l) => l.code === 'en' || heard.includes(l.code));
  if (languages.length === 1) return ENGLISH_ONLY;
  if (languages.length === LANGUAGES.length) return EVERY_LANGUAGE;
  const key = languages.map((l) => l.code).join(',');
  let view = SOME.get(key);
  if (!view) {
    view = { languages, search: true, note: languageCopy.picker.englishOnly };
    SOME.set(key, view);
  }
  return view;
}

const onlyEnglish = (heard: boolean | readonly LanguageCode[]): boolean =>
  typeof heard === 'boolean' ? heard : !heard.some((c) => c !== 'en');

/**
 * Settings, Spoken language, "Also spoken". English only: no Add row and no "Add up to two more" line, since
 * nothing could be added (VOICE.md: promise only what the build does). Languages already listed there stay,
 * each with Remove; with none, the section is not shown.
 */
export function alsoSpokenView(heard: boolean | readonly LanguageCode[], listed: number): { section: boolean; add: boolean; footer: boolean } {
  const englishOnly = onlyEnglish(heard);
  return { section: !englishOnly || listed > 0, add: !englishOnly, footer: !englishOnly };
}
