/**
 * Transcription behind one interface (ADR 0001).
 *
 * The capture screens only ever see `Transcriber`. Today there are two:
 * - whisper (src/lib/transcribe-whisper.ts): on-device whisper.rn. Needs a
 *   development build (native module) and a downloaded model file.
 * - sample (src/lib/transcribe-sample.ts): DEVELOPMENT ONLY. Returns fixed
 *   words so Review can be exercised in Expo Go. Never selected in release.
 *
 * Output is the raw transcript only. Cleaning happens afterwards in
 * @scribe/core faithfulClean, so every machine edit is verified and reversible.
 */
import type { DictionaryTerm } from '@scribe/core';
import { devShortcutsAllowed } from './build-env';
import { createSampleTranscriber } from './transcribe-sample';
import { createWhisperTranscriber } from './transcribe-whisper';

export interface TranscribeInput {
  /** file:// URI of the recording (AAC M4A, ADR 0005). Never leaves the device. */
  audioUri: string;
  durationMs: number | null;
  /** Names and words spelled the family's way; rendered into the model prompt. */
  dictionary: DictionaryTerm[];
  /** 'auto' unless the author set a language hint (PRD B F1.4). */
  language?: 'auto' | 'en' | 'hi';
}

export interface Word {
  text: string;
  startMs: number;
  endMs: number;
}

export interface TranscribeResult {
  raw: string;
  words: Word[];
  language: string | null;
  transcriber: TranscriberId;
}

export type TranscriberId = 'whisper' | 'sample';

export type UnavailableReason =
  | 'native-module-missing' // Expo Go, or a build without whisper.rn
  | 'model-missing' // model not downloaded yet (first-run download, ADR 0001)
  | 'decoder-missing'; // M4A to 16 kHz PCM decoding not built yet (ADR 0005)

export class TranscriberUnavailable extends Error {
  constructor(public reason: UnavailableReason) {
    super(`Transcriber unavailable: ${reason}`);
  }
}

export interface Transcriber {
  id: TranscriberId;
  /** True when this transcriber returns made-up text (dev only). */
  isSample: boolean;
  /** Resolves null when ready, or why it cannot run on this device now. */
  availability(): Promise<UnavailableReason | null>;
  transcribe(input: TranscribeInput, signal?: AbortSignal): Promise<TranscribeResult>;
}

/**
 * Picks the transcriber for this device: whisper when it can run, otherwise
 * the sample transcriber in the development profile only (build-env.ts). In
 * preview and store builds with no usable model this returns null, and
 * Review offers to keep the recording until its words can be made.
 */
export async function getTranscriber(): Promise<Transcriber | null> {
  const whisper = createWhisperTranscriber();
  if ((await whisper.availability()) === null) return whisper;
  if (devShortcutsAllowed) return createSampleTranscriber();
  return null;
}

/** Initial prompt for Whisper: the family's spellings, nothing else. */
export function dictionaryPrompt(dictionary: DictionaryTerm[]): string {
  const terms = Array.from(new Set(dictionary.map((d) => d.term.trim()).filter(Boolean)));
  return terms.length ? `${terms.join(', ')}.` : '';
}
