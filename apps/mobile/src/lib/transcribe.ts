/**
 * Transcription behind one interface (ADR 0001, ADR 0015).
 *
 * The transcription queue (src/lib/transcription-queue) is the only caller;
 * screens subscribe to the queue and never run a transcriber themselves, so
 * one recording is never transcribed twice at once. Two transcribers:
 * - whisper (src/lib/transcribe-whisper.ts): on-device whisper.rn with the
 *   author's language model. Needs a development or store build and the
 *   language's speech packs.
 * - sample (src/lib/transcribe-sample.ts): DEVELOPMENT ONLY. Returns fixed
 *   words so Review can be exercised in Expo Go. Never selected in release.
 *
 * Output is the raw transcript only: what the recogniser heard in speech,
 * nothing else. Silence gives '' (never invented words). Cleaning happens
 * afterwards in @scribe/core faithfulClean, so every machine edit is
 * verified and reversible.
 */
import type { DictionaryTerm } from '@scribe/core';
import type { SpeechLanguage, SpeechModelId } from './models/catalog';

export interface TranscribeInput {
  /** file:// URI of the recording (AAC M4A, ADR 0005). Never leaves the device. */
  audioUri: string;
  durationMs: number | null;
  /** Names and words spelled the family's way; rendered into the prompt of every chunk. */
  dictionary: DictionaryTerm[];
  /** The author's spoken language (B-REQ-003). Never translated. */
  language: SpeechLanguage;
  /** Prompt text from the language pack, if it has one (transcribe-prompt.ts has defaults). */
  promptSeed?: string;
}

/** Honest progress: which step, and how many of the recording's chunks are done. Never a fake spinner. */
export interface TranscribeProgress {
  stage: 'preparing' | 'listening';
  done: number;
  total: number;
}

export interface Word {
  text: string;
  startMs: number;
  endMs: number;
}

/**
 * How the raw transcript was made: content-free (times, counts, ids, hashes).
 * For `stt_meta` (TDD 03 3.5.2) once the store keeps it.
 */
export interface SttMeta {
  engine: 'whisper-rn' | 'sample';
  model: SpeechModelId | null;
  bindingVersion: string | null;
  language: string;
  chunks: Array<{ startMs: number; endMs: number; units: number }>;
  dropped: Array<{ chunk: number; reason: 'non_speech_tag' | 'prompt_echo' | 'dictionary_echo' }>;
  flags: Array<{ chunk: number; reason: 'repetition_loop' }>;
}

export type TranscribeOutcome = 'ok' | 'no_speech';

export interface TranscribeResult {
  /** '' when nobody spoke (outcome 'no_speech'). */
  raw: string;
  /** Word times when the recogniser's tokens were sound; [] otherwise (v1.1 word highlight). */
  words: Word[];
  language: string | null;
  transcriber: TranscriberId;
  outcome: TranscribeOutcome;
  meta: SttMeta;
}

export type TranscriberId = 'whisper' | 'sample';

export type UnavailableReason =
  | 'native-module-missing' // Expo Go, or a build without whisper.rn or ScribeAudio
  | 'model-missing'; // this language's speech packs are not installed yet

export class TranscriberUnavailable extends Error {
  constructor(public reason: UnavailableReason) {
    super(`Transcriber unavailable: ${reason}`);
  }
}

export interface Transcriber {
  id: TranscriberId;
  /** True when this transcriber returns made-up text (dev only). */
  isSample: boolean;
  /** Resolves null when it can run for this language now, or why not. */
  availability(language: SpeechLanguage): Promise<UnavailableReason | null>;
  transcribe(input: TranscribeInput, hooks?: { signal?: AbortSignal; onProgress?: (p: TranscribeProgress) => void }): Promise<TranscribeResult>;
}

export class TranscriptionAborted extends Error {
  constructor() {
    super('transcription_aborted');
  }
}
