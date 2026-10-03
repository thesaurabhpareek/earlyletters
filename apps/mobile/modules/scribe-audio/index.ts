/**
 * Local Expo module `ScribeAudio` (iOS; Android is a stub until v1.1).
 * Optional: absent in Expo Go and on web, so every caller handles null.
 *
 * What it does (TDD 03 3.4, ADR 0015; LEGAL-REQ-018):
 * - `decodePcm16`: AAC M4A to 16 kHz mono PCM16 little-endian, in memory
 *   only, for the pieces of a chunk the planner chose (src/lib/transcribe-plan.ts).
 *   Returns an ArrayBuffer that wraps native memory (no copy, no temp file)
 *   and goes straight to whisper.rn `transcribeData` / `detectSpeechData`.
 *   Inserted silence (a long pause shortened) is zeros.
 * - `enhance`: writes a clearer listening copy (AAC M4A) next to the
 *   original with Apple's AUSoundIsolation voice isolation (iOS 16 and
 *   later, a system component: no binary cost). The original is only read.
 *   Progress arrives as `onEnhanceProgress`; `cancelEnhance` stops it and
 *   leaves nothing behind.
 * - `sha256File`: streamed natively in 1 MB blocks (a 574 MB model never
 *   enters JavaScript memory).
 */
import { NativeModule, requireOptionalNativeModule } from 'expo';

/** One contiguous range of the recording, with digital silence placed before it. Same shape as ChunkPiece. */
export interface DecodePiece {
  srcStartMs: number;
  srcEndMs: number;
  silenceBeforeMs: number;
}

export interface AudioInfo {
  durationMs: number;
  /** Sample rate of the file itself (the recording, before any decode). */
  sampleRate: number;
  channels: number;
}

export interface EnhanceOptions {
  /** Share of the isolated voice in the copy, 0 to 100. Below 100 keeps a little of the room (a baby's laugh). */
  mix: number;
}

export interface EnhanceProgressEvent {
  jobId: string;
  /** 0 to 1. */
  progress: number;
}

type ScribeAudioEvents = {
  onEnhanceProgress: (event: EnhanceProgressEvent) => void;
};

/** Expo's documented pattern: a declared class extending NativeModule gives typed events (`addListener`). */
export declare class ScribeAudioNative extends NativeModule<ScribeAudioEvents> {
  probe(uri: string): Promise<AudioInfo>;
  /** 16 kHz mono PCM16 LE; byte length = 2 x chunkSampleCount(pieces). */
  decodePcm16(uri: string, pieces: DecodePiece[]): Promise<ArrayBuffer>;
  sha256File(uri: string): Promise<string>;
  /** True when the system voice isolation component exists on this device. */
  isIsolationAvailable(): boolean;
  /** file:// URI of Application Support/listening/, created if missing, excluded from backup. */
  listeningDirectory(): string;
  enhance(jobId: string, inUri: string, outUri: string, options: EnhanceOptions): Promise<{ durationMs: number }>;
  cancelEnhance(jobId: string): void;
}

export const ScribeAudio = requireOptionalNativeModule<ScribeAudioNative>('ScribeAudio');

/** Error codes the native side throws (Expo `CodedException` codes). Never carries content. */
export type ScribeAudioErrorCode =
  | 'ERR_SCRIBE_AUDIO_FILE_MISSING'
  | 'ERR_SCRIBE_AUDIO_DECODE'
  | 'ERR_SCRIBE_AUDIO_ISOLATION_UNAVAILABLE'
  | 'ERR_SCRIBE_AUDIO_ENHANCE'
  | 'ERR_SCRIBE_AUDIO_CANCELLED'
  | 'ERR_SCRIBE_AUDIO_UNSUPPORTED';

export function scribeAudioErrorCode(e: unknown): ScribeAudioErrorCode | null {
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code.startsWith('ERR_SCRIBE_AUDIO_') ? (code as ScribeAudioErrorCode) : null;
}
