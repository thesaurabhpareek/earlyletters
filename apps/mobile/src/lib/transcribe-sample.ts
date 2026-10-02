/**
 * DEVELOPMENT ONLY sample transcriber.
 *
 * Returns fixed words (fictional, with the active child's name filled in at
 * runtime) so the Review flow, underlines and "Put it back" can be exercised
 * in Expo Go, where whisper.rn cannot load. It never runs in a release build:
 * getTranscriber() only selects it when __DEV__ is true, and Review shows a
 * banner whenever `isSample` is set.
 */
import type { Transcriber } from './transcribe';

const SAMPLE =
  'Um, today {child} found the the rain on the window and, uh, laughed at every drop. ' +
  'We stood there for a long time. I want you to know that that was my favourite part of the day.';

export function createSampleTranscriber(): Transcriber {
  return {
    id: 'sample',
    isSample: true,
    availability: async () => (__DEV__ ? null : 'native-module-missing'),
    async transcribe(input, signal) {
      if (!__DEV__) throw new Error('Sample transcriber is development only');
      await new Promise((r) => setTimeout(r, 700));
      if (signal?.aborted) throw new Error('aborted');
      const child = input.dictionary.find((d) => d.kind === 'child')?.term ?? 'Asha';
      return { raw: SAMPLE.replace('{child}', child), words: [], language: 'en', transcriber: 'sample' };
    },
  };
}
