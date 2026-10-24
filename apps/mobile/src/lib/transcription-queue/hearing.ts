/**
 * The one place a recording's language becomes the language it is heard in (D-111 item 4; N2 on #247). The rule
 * is pure and lives in hearing.logic.ts; this file feeds it the recording's noted language
 * (models/author-language.ts), the English-only build switch and the note left with words heard in English.
 *
 * Its callers, in transcription-queue/index.ts: requestWords (Review) and syncLetters (letters waiting for their
 * words) queue each recording in `hearing(id).language`; runJob hands that language to the recogniser and leaves
 * the note with the words; languageFor (Review, the Book, the letter page) names and cleans in it. Review and the
 * letter page show `heardInEnglishNoteFor(id)`. The stored choice is read here and never written.
 */
import { capabilities } from '../capabilities';
import { letterLanguage, wasHeardInEnglish } from '../models/author-language';
import { heardInEnglishNote, hearingFor, type Hearing } from './hearing.logic';

export type { Hearing } from './hearing.logic';

/** The language this recording is heard in, and whether the English-only switch moved it to English. */
export function hearing(id: string): Hearing {
  return hearingFor(letterLanguage(id), capabilities.englishOnly, wasHeardInEnglish(id));
}

/** Review and the letter page: `languageCopy.heardInEnglish` for words heard so, while the switch is on; else null. */
export function heardInEnglishNoteFor(id: string): string | null {
  return heardInEnglishNote(wasHeardInEnglish(id), capabilities.englishOnly);
}
