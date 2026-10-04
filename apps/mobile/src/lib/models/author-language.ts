/**
 * The author's spoken language on this phone (B-REQ-003, founder decision 6).
 *
 * One author per phone in v1.0 (the co-parent has their own phone), so this
 * is a device setting. Choosing a language starts its speech download and
 * nothing else (founder decision 15): Portuguese fetches what Portuguese
 * needs. The language picker (language agent / onboarding) calls
 * `setAuthorSpeechLanguage`.
 *
 * Each recording remembers the language it was spoken in
 * (`rememberLetterLanguage`), so changing the setting later never makes an
 * older recording be heard in the wrong language. Until drafts and letters
 * carry a `language` column (requested from the store owner), this lives in
 * settings under one key per recording and is cleared when its words are set.
 */
import { deleteSetting, getSetting, setSetting } from '../store';
import { isSpeechLanguage, type SpeechLanguage } from './catalog';

export const AUTHOR_LANGUAGE_KEY = 'speech.language';
const LETTER_KEY = (id: string) => `speech.letterLanguage.${id}`;

const listeners = new Set<(lang: SpeechLanguage) => void>();

export function authorSpeechLanguage(): SpeechLanguage {
  const v = getSetting(AUTHOR_LANGUAGE_KEY);
  return isSpeechLanguage(v) ? v : 'en';
}

/** Whether the author has chosen a language yet (English is assumed until then; nothing downloads before a choice). */
export function hasChosenSpeechLanguage(): boolean {
  return isSpeechLanguage(getSetting(AUTHOR_LANGUAGE_KEY));
}

export function setAuthorSpeechLanguage(lang: SpeechLanguage): void {
  setSetting(AUTHOR_LANGUAGE_KEY, lang);
  listeners.forEach((l) => l(lang));
}

/** The queue listens so it can start the new language's download at once. */
export function onAuthorSpeechLanguage(listener: (lang: SpeechLanguage) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The language a recording was spoken in; the author's current language if it was never recorded. */
export function letterLanguage(id: string): SpeechLanguage {
  const v = getSetting(LETTER_KEY(id));
  return isSpeechLanguage(v) ? v : authorSpeechLanguage();
}

/** First call wins: a recording's language never changes after it is noted. */
export function rememberLetterLanguage(id: string, lang: SpeechLanguage = authorSpeechLanguage()): SpeechLanguage {
  const v = getSetting(LETTER_KEY(id));
  if (isSpeechLanguage(v)) return v;
  setSetting(LETTER_KEY(id), lang);
  return lang;
}

export function forgetLetterLanguage(id: string): void {
  deleteSetting(LETTER_KEY(id));
}
