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
 * older recording be heard in the wrong language. A draft keeps it in a
 * setting (one key per recording); when the letter is saved the language moves
 * onto the letter (`entries.language`, local v5, synced to the author's own
 * phones only) and the setting is removed (store.ts `writeEntry`).
 */
import { deleteSetting, getEntry, getSetting, letterLanguageKey, setSetting } from '../store';
import { isSpeechLanguage, type SpeechLanguage } from './catalog';

export const AUTHOR_LANGUAGE_KEY = 'speech.language';
const LETTER_KEY = letterLanguageKey;

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

/** The language a recording was spoken in (draft setting, then the saved letter); the author's current language if it was never noted. */
export function letterLanguage(id: string): SpeechLanguage {
  const v = getSetting(LETTER_KEY(id));
  if (isSpeechLanguage(v)) return v;
  const saved = getEntry(id)?.language;
  return isSpeechLanguage(saved) ? saved : authorSpeechLanguage();
}

/** First call wins: a recording's language never changes after it is noted (on the draft or on the saved letter). */
export function rememberLetterLanguage(id: string, lang: SpeechLanguage = authorSpeechLanguage()): SpeechLanguage {
  const v = getSetting(LETTER_KEY(id));
  if (isSpeechLanguage(v)) return v;
  const saved = getEntry(id)?.language;
  if (isSpeechLanguage(saved)) return saved;
  setSetting(LETTER_KEY(id), lang);
  return lang;
}

export function forgetLetterLanguage(id: string): void {
  deleteSetting(LETTER_KEY(id));
}
