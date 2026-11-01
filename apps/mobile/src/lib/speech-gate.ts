/**
 * The one gate every app announcement passes (SR-C-02: F04-REQ-040, F04-REQ-041; B2-21 never waived). Pure: no React
 * Native import, so it is unit tested in Node (test/speech-gate.test.ts); lib/a11y.ts `announce()` is built from it.
 *
 * While the recorder is capturing, nothing the app says is spoken: a toast, a status line, any `announce()` call is
 * dropped, never queued, so it is not replayed into the take after a pause or a resume either. Without headphones,
 * VoiceOver's voice would otherwise be in the letter. app/listen.tsx sets the flag from the recorder's real state.
 *
 * While a recording is playing (TDD 09 rule S2) messages wait and are spoken when playback stops, as before; a waiting
 * message is dropped if a take is capturing when it comes due.
 */

let capturing = false;

/** Listen sets this from the native recorder (`recorder.isRecording`, or the polled status, or a start in progress). */
export function setRecorderCapturing(value: boolean): void {
  capturing = value;
}

export function isRecorderCapturing(): boolean {
  return capturing;
}

export type GateDeps = {
  /** Speak now (AccessibilityInfo on iOS and web). */
  speak: (message: string, queue: boolean) => void;
  /** The app's audio session: messages wait while it is `playback`. */
  audioMode: () => 'idle' | 'recording' | 'playback';
  /** setTimeout, injectable for tests. */
  later: (fn: () => void, ms: number) => unknown;
};

/** How long a message waits before checking again whether playback has stopped. */
export const PLAYBACK_RETRY_MS = 1000;

export function createGatedAnnounce(deps: GateDeps): (message: string, opts?: { queue?: boolean }) => void {
  let queued: string[] = [];
  let waiting = false;

  const flush = () => {
    waiting = false;
    if (capturing) {
      queued = []; // never spoken into a take, and never replayed after it
      return;
    }
    if (deps.audioMode() === 'playback') {
      waiting = true;
      deps.later(flush, PLAYBACK_RETRY_MS);
      return;
    }
    const all = queued;
    queued = [];
    for (const m of all) deps.speak(m, true);
  };

  return (message, opts = {}) => {
    if (!message) return;
    if (capturing) return; // dropped (B2-21)
    if (deps.audioMode() === 'playback') {
      queued.push(message);
      if (!waiting) {
        waiting = true;
        deps.later(flush, PLAYBACK_RETRY_MS);
      }
      return;
    }
    deps.speak(message, opts.queue ?? true);
  };
}
