/**
 * Consent to download the speech model (D-087, debate Q-015 section 3.3). Pure: no React Native, no store.
 *
 * A device setting `speech.download` is `yes`, `later` or unset.
 * - Only `yes` lets the app start a speech download on its own (a language picked after a yes, the first
 *   Review, a letter waiting for its words). Unset and `later` start nothing.
 * - Picking a language only stores it.
 * - A person's own tap (Download on Wi-Fi, Settings, Use mobile data) is consent and sets `yes`.
 * - Phones that already chose a language or installed a model before this rule existed become `yes` once,
 *   at the first launch of the build that has the rule. A fresh install has neither, so it stays unset
 *   until the person answers at the end of first run.
 */
import { LARGE_PACK_RESERVE_BYTES, SMALL_PACK_RESERVE_BYTES } from '../packs/engine';

export type SpeechDownloadChoice = 'yes' | 'later';

export const SPEECH_DOWNLOAD_KEY = 'speech.download';
/** Set after the one-time migration has run, so a later launch never reads a first-run language pick as old consent. */
export const SPEECH_DOWNLOAD_MIGRATED_KEY = 'speech.download.migrated';

export function parseChoice(v: string | null | undefined): SpeechDownloadChoice | null {
  return v === 'yes' || v === 'later' ? v : null;
}

/** Only an explicit yes lets the app start a speech download by itself. */
export function autoStartAllowed(choice: SpeechDownloadChoice | null): boolean {
  return choice === 'yes';
}

export interface MigrationInput {
  stored: string | null;
  migrated: boolean;
  languageChosen: boolean;
  modelInstalled: boolean;
}

/** What to write at launch, or null for nothing. Runs once per phone. */
export function planConsentMigration(i: MigrationInput): { choice: SpeechDownloadChoice | null; markMigrated: boolean } | null {
  if (i.migrated) return null;
  if (parseChoice(i.stored)) return { choice: null, markMigrated: true };
  return { choice: i.languageChosen || i.modelInstalled ? 'yes' : null, markMigrated: true };
}

/** Free space the pack engine insists on keeping after this download (engine.ts). */
export function reserveFor(bytes: number): number {
  return bytes > 50_000_000 ? LARGE_PACK_RESERVE_BYTES : SMALL_PACK_RESERVE_BYTES;
}

/** Free space the phone must have before the download starts: the model plus the reserve. */
export function neededBytes(bytes: number): number {
  return bytes + reserveFor(bytes);
}

/** Unknown free space is not a reason to refuse: the engine checks again before it writes anything. */
export function hasRoomFor(bytes: number, freeBytes: number | null): boolean {
  if (freeBytes === null) return true;
  return freeBytes >= neededBytes(bytes);
}

export type AskKind = 'ask' | 'low_space';

/** What the ask shows: the button, or only the space line when the phone cannot hold the model yet. */
export function askKind(bytes: number, freeBytes: number | null): AskKind {
  return hasRoomFor(bytes, freeBytes) ? 'ask' : 'low_space';
}

/** The ask card in Review appears when words wait, nothing is in flight, and the person has not said yes. */
export function showReviewAsk(i: { choice: SpeechDownloadChoice | null; progress: number | null; hold: 'waiting_for_wifi' | 'no_space' | 'offline' | null }): boolean {
  return !autoStartAllowed(i.choice) && i.progress === null && i.hold === null;
}
