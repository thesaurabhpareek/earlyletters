/**
 * Loudness pre-check on decoded 16 kHz PCM16 (pure; test/transcribe-energy.test.ts).
 *
 * Voice activity detection is Silero VAD inside whisper.rn
 * (`initWhisperVad`, `detectSpeechData`); it is the gate that decides what
 * is speech. This is only a cheap first look: a window whose loudest 30 ms
 * frame is below -60 dBFS (a phone in a pocket, a muted microphone) holds
 * nothing to hear, so it skips VAD and Whisper entirely. The threshold is
 * well below a whisper at arm's length (about -45 dBFS, E), so it never
 * decides that quiet speech is silence. It is not a VAD replacement: if the
 * Silero model cannot load, the job fails and the letter keeps waiting; it
 * is never transcribed without VAD.
 */

export const SILENCE_DBFS = -60;
const FRAME = 480; // 30 ms at 16 kHz

/** RMS of one frame in dBFS (full scale = 32768). Empty frames are -Infinity. */
export function frameDbfs(pcm: Int16Array, start: number, end: number): number {
  const n = end - start;
  if (n <= 0) return -Infinity;
  let sum = 0;
  for (let i = start; i < end; i++) sum += pcm[i] * pcm[i];
  const rms = Math.sqrt(sum / n);
  return rms === 0 ? -Infinity : 20 * Math.log10(rms / 32768);
}

/** Loudest 30 ms frame in the buffer, in dBFS. */
export function peakFrameDbfs(pcm: Int16Array, frame = FRAME): number {
  let peak = -Infinity;
  for (let s = 0; s < pcm.length; s += frame) peak = Math.max(peak, frameDbfs(pcm, s, Math.min(pcm.length, s + frame)));
  return peak;
}

/** True when nothing in the buffer is loud enough to be anyone talking. */
export function isNearSilent(pcm: Int16Array, thresholdDbfs = SILENCE_DBFS): boolean {
  return pcm.length === 0 || peakFrameDbfs(pcm) < thresholdDbfs;
}
