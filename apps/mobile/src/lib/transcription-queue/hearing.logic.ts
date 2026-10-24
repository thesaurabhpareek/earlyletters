/**
 * The language a recording is heard in, and whether the person is told (D-111 item 4; review N2 on #247).
 * Pure: no React Native, tested in Node (test/english-only-hearing.test.ts). The queue reads it through
 * hearing.ts, which feeds it the recording's noted language and the build switch.
 *
 * Each recording notes the language chosen when it was made (models/author-language.ts). While the English-only
 * switch is on (`capabilities.englishOnly`, the two alpha profiles), a noted language other than English is heard
 * in English: the alpha's speech is English only (D-111 item 4, D-115), and a choice stored before the switch (a
 * `.preview` install made without it) must not reach the recogniser. The person is told, never silently: Review and
 * the letter page show `languageCopy.heardInEnglish`. Nothing here changes the stored choice, so with the switch
 * off the person's language is used again. Switch off: the noted language, as before. English noted: no notice.
 *
 * Words already heard in English this way stay English (`heardBefore`, noted with the words), so Review cleans them
 * in English whatever the switch says later. A letter whose words were set before this guard is left as it is: the
 * guard applies to new recognitions only, and such a letter has no note, so it shows no notice.
 */
import { languageCopy } from '@scribe/content';
import type { SpeechLanguage } from '../models/catalog';

export interface Hearing {
  /** The language the recogniser is given, and the one Review cleans in. */
  language: SpeechLanguage;
  /** True when the English-only switch moved another language to English: the person is told. */
  heardInEnglish: boolean;
}

const IN_ENGLISH_INSTEAD: Hearing = { language: 'en', heardInEnglish: true };

/**
 * `noted`: the recording's language (the author's choice when it was made). `englishOnly`: the build switch.
 * `heardBefore`: this recording's words were already heard in English this way.
 */
export function hearingFor(noted: SpeechLanguage, englishOnly: boolean, heardBefore = false): Hearing {
  if (heardBefore || (englishOnly && noted !== 'en')) return IN_ENGLISH_INSTEAD;
  return { language: noted, heardInEnglish: false };
}

/**
 * The notice under a recording's words, or null. Only for words heard in English instead of the chosen language,
 * and only while the switch is on: its second sentence says other languages come later, which a build with every
 * language would not need.
 */
export function heardInEnglishNote(heardInEnglish: boolean, englishOnly: boolean): string | null {
  return heardInEnglish && englishOnly ? languageCopy.heardInEnglish : null;
}
