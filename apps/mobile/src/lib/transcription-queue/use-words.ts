/**
 * React bindings for the transcription queue (Review, Settings).
 */
import { useSyncExternalStore } from 'react';
import type { SpeechLanguage } from '../models/catalog';
import type { DownloadStage } from '../models/speech-download.logic';
import { speechDownloadFailure, speechDownloadHold, speechDownloadProgress, speechDownloadStage, subscribeWords, wordsJob, wordsTick, type Job } from './index';

/** Re-renders on every queue or download update. */
export function useWordsTick(): number {
  return useSyncExternalStore(subscribeWords, wordsTick, wordsTick);
}

export function useWordsJob(id: string | null | undefined): Job | null {
  useWordsTick();
  return id ? wordsJob(id) : null;
}

export interface SpeechDownloadState {
  /** 0..1 only while bytes move; null when queued, waiting, checking or idle. */
  progress: number | null;
  /** A pack that is not moving yet or any more: waiting its turn, being checked, finishing. */
  stage: DownloadStage | null;
  hold: ReturnType<typeof speechDownloadHold>;
  /** The last failure's pack engine code when nothing is in flight (packsCopy.failures), else null. */
  failure: string | null;
}

export function useSpeechDownload(language: SpeechLanguage | null): SpeechDownloadState {
  useWordsTick();
  if (!language) return { progress: null, stage: null, hold: null, failure: null };
  try {
    return {
      progress: speechDownloadProgress(language),
      stage: speechDownloadStage(language),
      hold: speechDownloadHold(language),
      failure: speechDownloadFailure(language),
    };
  } catch {
    // Where speech files cannot be read at all (the web design preview), there is nothing to show; never a crash.
    return { progress: null, stage: null, hold: null, failure: null };
  }
}
