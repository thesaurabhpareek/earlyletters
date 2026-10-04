/**
 * Consent to download the speech model, on this phone (rules: speech-consent.logic.ts).
 * Device setting only; never sent anywhere, never logged.
 */
import { Paths } from 'expo-file-system';
import { deleteSetting, getSetting, setSetting } from '../store';
import { hasChosenSpeechLanguage } from './author-language';
import { SPEECH_LANGUAGES, type SpeechLanguage } from './catalog';
import { askKind, autoStartAllowed, neededBytes, parseChoice, planConsentMigration, SPEECH_DOWNLOAD_KEY, SPEECH_DOWNLOAD_MIGRATED_KEY, type AskKind, type SpeechDownloadChoice } from './speech-consent.logic';
import { installedPathsFor, planFor } from './speech-packs';

export type { SpeechDownloadChoice } from './speech-consent.logic';

export function speechDownloadChoice(): SpeechDownloadChoice | null {
  return parseChoice(getSetting(SPEECH_DOWNLOAD_KEY));
}

export function setSpeechDownloadChoice(choice: SpeechDownloadChoice | null): void {
  if (choice === null) deleteSetting(SPEECH_DOWNLOAD_KEY);
  else setSetting(SPEECH_DOWNLOAD_KEY, choice);
}

/** True only after an explicit yes. */
export function speechAutoStartAllowed(): boolean {
  return autoStartAllowed(speechDownloadChoice());
}

/** Once per phone, at launch: a phone that already picked a language or holds a model keeps working as it did. */
export function migrateSpeechConsent(): void {
  try {
    const plan = planConsentMigration({
      stored: getSetting(SPEECH_DOWNLOAD_KEY),
      migrated: getSetting(SPEECH_DOWNLOAD_MIGRATED_KEY) === '1',
      languageChosen: hasChosenSpeechLanguage(),
      modelInstalled: SPEECH_LANGUAGES.some((l) => installedPathsFor(l) !== null),
    });
    if (!plan) return;
    if (plan.choice) setSpeechDownloadChoice(plan.choice);
    if (plan.markMigrated) setSetting(SPEECH_DOWNLOAD_MIGRATED_KEY, '1');
  } catch {
    // Never blocks launch. Unset means nothing downloads until the person taps.
  }
}

function freeBytes(): number | null {
  try {
    const n = Paths.availableDiskSpace;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** What this phone needs for a language: the size comes from this phone's tier plan, never a typed number. */
export function speechAskFor(language: SpeechLanguage): { bytes: number; neededBytes: number; kind: AskKind } {
  const bytes = planFor([language]).bytes;
  return { bytes, neededBytes: neededBytes(bytes), kind: askKind(bytes, freeBytes()) };
}
