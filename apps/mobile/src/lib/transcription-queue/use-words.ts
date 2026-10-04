/**
 * React bindings for the transcription queue (Review, Settings).
 */
import { useSyncExternalStore } from 'react';
import type { SpeechLanguage } from '../models/catalog';
import { speechDownloadHold, speechDownloadProgress, subscribeWords, wordsJob, wordsTick, type Job } from './index';

/** Re-renders on every queue or download update. */
export function useWordsTick(): number {
  return useSyncExternalStore(subscribeWords, wordsTick, wordsTick);
}

export function useWordsJob(id: string | null | undefined): Job | null {
  useWordsTick();
  return id ? wordsJob(id) : null;
}

export function useSpeechDownload(language: SpeechLanguage | null): { progress: number | null; hold: ReturnType<typeof speechDownloadHold> } {
  useWordsTick();
  return language ? { progress: speechDownloadProgress(language), hold: speechDownloadHold(language) } : { progress: null, hold: null };
}
