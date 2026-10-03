/**
 * Letter playback rules, pure and tested (COMPONENTS 2.21; SOUND.md 5).
 *
 * The person decides when a voice plays. expo-audio pauses on an incoming
 * call or a headphone unplug, resumes after a call when iOS says it should,
 * and on its own resumes a player when the app returns to the foreground.
 * This reducer keeps one fact, "the person wants this playing", and turns
 * native events into commands:
 * - Leaving the app stops playback and it stays stopped on return (no voice
 *   starting by surprise).
 * - An interruption (a call) leaves the wish in place, so iOS may resume.
 * - Anything that starts playing without the wish is paused again.
 * - The end of a recording clears the wish; the next Play starts over.
 */

export interface PlayIntent {
  wantPlaying: boolean;
  finished: boolean;
}

export type PlayerEvent =
  | { type: 'userPlay' }
  | { type: 'userPause' }
  | { type: 'status'; playing: boolean; didJustFinish: boolean }
  | { type: 'background' }
  | { type: 'release' };

export type PlayerCommand = 'play' | 'pause' | 'rewind' | 'sessionPlayback' | 'sessionIdle';

export const INITIAL_INTENT: PlayIntent = { wantPlaying: false, finished: false };

export function reducePlayIntent(state: PlayIntent, event: PlayerEvent): { state: PlayIntent; commands: PlayerCommand[] } {
  switch (event.type) {
    case 'userPlay':
      return {
        state: { wantPlaying: true, finished: false },
        commands: state.finished ? ['rewind', 'sessionPlayback', 'play'] : ['sessionPlayback', 'play'],
      };
    case 'userPause':
      return { state: { ...state, wantPlaying: false }, commands: ['pause', 'sessionIdle'] };
    case 'background':
    case 'release':
      return { state: { ...state, wantPlaying: false }, commands: state.wantPlaying ? ['pause', 'sessionIdle'] : ['pause'] };
    case 'status':
      if (event.didJustFinish) {
        return { state: { wantPlaying: false, finished: true }, commands: state.wantPlaying ? ['sessionIdle'] : [] };
      }
      if (event.playing && !state.wantPlaying) return { state, commands: ['pause'] };
      return { state, commands: [] };
  }
}

// ── Time, for the screen and VoiceOver ──────────────────────────────────

/** "0:07", "1:12", "1:02:03". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** "1 minute 12 seconds", "45 seconds", for VoiceOver labels. */
export function spokenDuration(seconds: number): string {
  const s = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (m === 0) return part(rest, 'second', 'seconds');
  return rest === 0 ? part(m, 'minute', 'minutes') : `${part(m, 'minute', 'minutes')} ${part(rest, 'second', 'seconds')}`;
}

/** Seconds of the step VoiceOver's swipe up and down moves the scrubber (COMPONENTS 2.21). */
export const SCRUB_STEP_SECONDS = 5;

export function clampPosition(seconds: number, duration: number): number {
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.min(Math.max(0, duration), seconds));
}

export function stepPosition(position: number, direction: 1 | -1, duration: number, step = SCRUB_STEP_SECONDS): number {
  return clampPosition(position + direction * step, duration);
}

/** Touch x on a track of `width` points to a position in seconds. */
export function positionAt(x: number, width: number, duration: number): number {
  if (width <= 0 || duration <= 0) return 0;
  return clampPosition((x / width) * duration, duration);
}

/** 0..1 for the progress fill. */
export function progressOf(position: number, duration: number): number {
  return duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
}

// ── Which letters can play (founder decision 3 Oct 2026) ─────────────────

/**
 * v1.0 plays only your own recordings, from this phone. Family hearing each
 * other's voices is v1.1 (DECISIONS D-032 pending), so another author's
 * letter says where its recording is kept instead of offering Play.
 */
export type RecordingAvailability = 'playable' | 'typed' | 'otherAuthor' | 'notOnPhone';

export function recordingAvailability(input: {
  captureMode: 'spoken' | 'typed' | 'mixed';
  own: boolean;
  audioUri: string | null | undefined;
  fileExists: boolean;
}): RecordingAvailability {
  if (input.captureMode === 'typed') return 'typed';
  if (!input.own) return 'otherAuthor';
  if (!input.audioUri || !input.fileExists) return 'notOnPhone';
  return 'playable';
}

// ── Original or listening copy (founder decision 8) ──────────────────────

/** A cleaner copy made for listening; the original is never altered. Contract: listening.ts. */
export interface ListeningCopy {
  /** Local file (AAC-LC M4A). */
  uri: string;
  /** SHA-256 of the original it was made from; must equal the letter's audioSha256. */
  sourceSha256: string;
  /** What made it ('apple-voice-processing', 'rnnoise', 'deepfilternet'). Never shown, never logged. */
  method: string;
  durationMs?: number | null;
}

/** The copy, if it may be played for this original. */
export function usableListeningCopy(input: {
  originalUri: string;
  recordedSha256: string | null;
  copy: ListeningCopy | null;
  copyExists: boolean;
}): ListeningCopy | null {
  const { copy } = input;
  if (!copy || !input.copyExists || !input.recordedSha256) return null;
  if (copy.uri === input.originalUri) return null;
  if (copy.sourceSha256.toLowerCase() !== input.recordedSha256.toLowerCase()) return null; // made from another take
  return copy;
}

export type ListenSource = 'original' | 'clearer';

/**
 * Which file plays. The listening copy by default when there is one; the
 * original when the person chose it, or when there is no usable copy.
 * `canChoose` is false when only the original exists (no switch shown).
 */
export function chooseSource(input: { originalUri: string; copy: ListeningCopy | null; preferOriginal: boolean }): {
  uri: string;
  source: ListenSource;
  canChoose: boolean;
} {
  if (!input.copy) return { uri: input.originalUri, source: 'original', canChoose: false };
  return input.preferOriginal
    ? { uri: input.originalUri, source: 'original', canChoose: true }
    : { uri: input.copy.uri, source: 'clearer', canChoose: true };
}

/** Switching files mid-letter keeps the place: the same second, inside the new file's length. */
export function handoffPosition(position: number, newDuration: number | null): number {
  if (!Number.isFinite(position) || position <= 0) return 0;
  return newDuration && newDuration > 0 ? clampPosition(position, newDuration) : position;
}
