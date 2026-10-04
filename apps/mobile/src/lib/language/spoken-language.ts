/**
 * useSpokenLanguage(): the author's languages, stored through the store's
 * device settings (getSetting / setSetting, key `language.spoken`), and kept
 * in step with the speech engine's own primary (`speech.language`, owned by
 * lib/models/author-language.ts) so there is one primary language on the
 * phone. Choosing a primary here calls setAuthorSpeechLanguage, which starts
 * that language's speech download (founder decision 15).
 */
import { useSyncExternalStore } from 'react';
import type { LanguageCode } from '@scribe/core';
import { getSetting, setSetting, subscribe } from '../store';
import { authorSpeechLanguage, hasChosenSpeechLanguage, setAuthorSpeechLanguage } from '../models/author-language';
import {
  addLanguage,
  parseSpoken,
  primaryOf,
  reconcilePrimary,
  removeLanguage,
  serializeSpoken,
  setPrimary,
  SPOKEN_LANGUAGE_KEY,
  updateLanguage,
  type SpokenLanguage,
  type SpokenLanguages,
} from './spoken-language.logic';

/**
 * The device locale ("en-TW", "pt-PT"), used only for defaults. Read through
 * Intl (Hermes implements DateTimeFormat.resolvedOptions on iOS and
 * Android), so no extra native module is needed.
 */
export function deviceLocaleTag(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? null;
  } catch {
    return null;
  }
}

let cachedRaw: string | null | undefined;
let cachedSpeech: string | null | undefined;
let cached: SpokenLanguages | null = null;

/** The current value. Referentially stable between changes (useSyncExternalStore needs that). */
export function getSpokenLanguages(): SpokenLanguages {
  const raw = getSetting(SPOKEN_LANGUAGE_KEY);
  const speech = hasChosenSpeechLanguage() ? authorSpeechLanguage() : null;
  if (cached && raw === cachedRaw && speech === cachedSpeech) return cached;
  cachedRaw = raw;
  cachedSpeech = speech;
  cached = reconcilePrimary(parseSpoken(raw), speech as LanguageCode | null, deviceLocaleTag());
  return cached;
}

function save(next: SpokenLanguages): void {
  setSetting(SPOKEN_LANGUAGE_KEY, serializeSpoken(next));
  const primary = primaryOf(next).code;
  if (!hasChosenSpeechLanguage() || authorSpeechLanguage() !== primary) setAuthorSpeechLanguage(primary);
}

export interface SpokenLanguageApi {
  languages: SpokenLanguage[];
  primary: SpokenLanguage;
  others: SpokenLanguage[];
  setPrimary(code: LanguageCode): void;
  add(code: LanguageCode): void;
  remove(code: LanguageCode): void;
  update(code: LanguageCode, patch: Pick<SpokenLanguage, 'script' | 'region'>): void;
}

export function useSpokenLanguage(): SpokenLanguageApi {
  const value = useSyncExternalStore(subscribe, getSpokenLanguages, getSpokenLanguages);
  const locale = deviceLocaleTag();
  return {
    languages: value.languages,
    primary: value.languages[0],
    others: value.languages.slice(1),
    setPrimary: (code) => save(setPrimary(getSpokenLanguages(), code, locale)),
    add: (code) => save(addLanguage(getSpokenLanguages(), code, locale)),
    remove: (code) => save(removeLanguage(getSpokenLanguages(), code)),
    update: (code, patch) => save(updateLanguage(getSpokenLanguages(), code, patch)),
  };
}
