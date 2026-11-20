/**
 * Whether a take is being recorded now (BL-572, APP-07). Pure: no React Native, no native modules.
 *
 * A take is open from the moment the audio session switches to recording (before the recorder is prepared) until
 * the take is kept or discarded and the session is idle again. Two capture-layer facts make it up, each set by its
 * own module, so no screen has to report it:
 * - audio-mode.ts: the session is in `recording` (set before `beginTake`, back to idle when the take ends);
 * - recorder.ts: a draft owns a live take (`activeTakeId`, set by `beginTake`, cleared when `finalizeTake` has
 *   saved it or `abandonTake` ends it).
 * A paused take is still open: the parent may carry on at any moment.
 *
 * The transcription queue listens here: a large model must not run while the microphone and the encoder do on a
 * 3 to 4 GB phone. Nothing here is stored or sent.
 */

let micSession = false;
let liveTake: string | null = null;
const listeners = new Set<(busy: boolean) => void>();

export function captureBusy(): boolean {
  return micSession || liveTake !== null;
}

/** Called with the new value each time a take opens or closes. Returns an unsubscribe function. */
export function onCaptureBusy(listener: (busy: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(change: () => void): void {
  const before = captureBusy();
  change();
  const after = captureBusy();
  if (after !== before) listeners.forEach((l) => l(after));
}

/** audio-mode.ts: the session switched (true only for `recording`). */
export function noteRecordingSession(on: boolean): void {
  update(() => {
    micSession = on;
  });
}

/** recorder.ts: the draft that owns the live take, or null when none does. */
export function noteLiveTake(draftId: string | null): void {
  update(() => {
    liveTake = draftId;
  });
}
