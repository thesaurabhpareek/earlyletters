/**
 * Languages this build does not hear yet, and what the person is told (D-111 item 4; N2 and round 2 on #260).
 * Pure: no React Native, tested in Node (test/english-only-language-hold.test.ts).
 *
 * The machine never hears a recording in a language the person did not choose: telling the recogniser "English"
 * for speech made in another language could put an English guess or a translation in raw_transcript, which can
 * never be changed (the constitution; VOICE.md, the multilingual rule). So while the English-only switch is on
 * (`capabilities.englishOnly`, the two alpha profiles), every language but English is on hold: a recording noted in
 * another language (a choice stored before the switch, on a `.preview` install made without it) waits for its
 * language in the queue (machine.ts `waiting_for_language`). It is never handed to the recogniser, never fails and
 * asks for no download. Every other job proceeds. Review and the letter page show `languageCopy.waitingForLanguage`,
 * and the person can keep the recording or write the words. In a build that hears the language, the recording
 * proceeds in its own language with nothing lost.
 *
 * The stored choice is never read or written here. Switch off: nothing is on hold, exactly as before. English: never
 * on hold. Words heard before the switch keep their own language (index.ts `languageFor`).
 */
import { languageCopy } from '@scribe/content';
import { SPEECH_LANGUAGES, type SpeechLanguage } from '../models/catalog';
import type { Job } from './machine';

const NONE: readonly SpeechLanguage[] = [];
const ALL_BUT_ENGLISH: readonly SpeechLanguage[] = SPEECH_LANGUAGES.filter((l) => l !== 'en');

/** The languages this build holds back from the recogniser: every one but English while the switch is on; none otherwise. */
export function languagesOnHold(englishOnly: boolean): readonly SpeechLanguage[] {
  return englishOnly ? ALL_BUT_ENGLISH : NONE;
}

/** The notice for a recording waiting for its language (Review, the letter page), or null for any other job. */
export function waitingForLanguageNote(job: Pick<Job, 'phase'> | null | undefined): string | null {
  return job?.phase === 'waiting_for_language' ? languageCopy.waitingForLanguage : null;
}
