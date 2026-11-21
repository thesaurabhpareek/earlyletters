/**
 * The spoken languages this build hears (D-111 item 4, D-121 item 1, D-125 item 2). Pure: no React Native, tested in
 * Node (test/heard-languages.test.ts).
 *
 * Two build switches decide it, both inlined at build time (lib/capabilities.ts):
 *  - `EXPO_PUBLIC_ENGLISH_ONLY=on`: English alone, whatever else is set (the stricter switch wins);
 *  - `EXPO_PUBLIC_SPOKEN_LANGUAGES=en,es`: English plus the listed languages the app knows, in catalog order.
 *    Unset or blank: every language, as before the list existed (development and e2e).
 * English is always heard: it is the bundled pack and never waits (language-hold.ts). An unknown code is ignored, so
 * a misspelt list narrows the build, never widens it.
 *
 * The picker (components/language/language-picker.logic.ts), the Spoken language screen, first run's language row and
 * the queue's language hold all read this one answer. Nothing here reads or writes the stored choice.
 */
import { englishOnlyEnabled, spokenLanguagesListed } from '../capabilities';
import { SPEECH_LANGUAGES, type SpeechLanguage } from '../models/catalog';

const ENGLISH: readonly SpeechLanguage[] = Object.freeze(['en'] as SpeechLanguage[]);
const EVERY: readonly SpeechLanguage[] = SPEECH_LANGUAGES;
/** One frozen array per distinct answer, so screens can memo on it. */
const views = new Map<string, readonly SpeechLanguage[]>();

/** English alone, every language, or English plus the listed ones, from the two switches. */
export function heardLanguages(englishOnly: boolean, listed: readonly string[] | null): readonly SpeechLanguage[] {
  if (englishOnly) return ENGLISH;
  if (listed === null) return EVERY;
  const picked = SPEECH_LANGUAGES.filter((l) => l === 'en' || listed.includes(l));
  if (picked.length === 1) return ENGLISH;
  if (picked.length === SPEECH_LANGUAGES.length) return EVERY;
  const key = picked.join(',');
  let view = views.get(key);
  if (!view) {
    view = Object.freeze(picked);
    views.set(key, view);
  }
  return view;
}

/** What this build hears. */
export function heardLanguagesForBuild(): readonly SpeechLanguage[] {
  return heardLanguages(englishOnlyEnabled(), spokenLanguagesListed());
}

/** True when the build hears English alone (English is always in the list). */
export function hearsOnlyEnglish(heard: readonly SpeechLanguage[]): boolean {
  return heard.length === 1;
}
