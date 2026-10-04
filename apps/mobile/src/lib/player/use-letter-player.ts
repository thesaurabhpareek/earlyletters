/**
 * One letter's recording, played on this phone (COMPONENTS 2.21; SOUND.md 5).
 * Wraps expo-audio and applies player.logic.ts: the person decides when a
 * voice plays; leaving the app stops it; calls and unplugged headphones
 * pause it; the app's audio session goes back to `idle` whenever playback
 * stops (lib/audio-mode.ts).
 *
 * Screens use the AudioPlayer component (src/components/player), not this
 * hook directly, unless they need their own controls.
 */
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isPreviewAudioPresent } from '../../dev/preview-audio';
import { setAudioMode } from '../audio-mode';
import type { Entry } from '../store';
import { clampPosition, INITIAL_INTENT, recordingAvailability, reducePlayIntent, type PlayerCommand, type PlayerEvent, type PlayIntent, type RecordingAvailability } from './player.logic';

export interface LetterPlayer {
  playing: boolean;
  loaded: boolean;
  /** Seconds. */
  position: number;
  /** Seconds; the file's own length once loaded, else the length saved with the letter. */
  duration: number;
  finished: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
}

/** Whether a letter's recording can play here (v1.0: your own, on this phone). */
export function availabilityOf(entry: Pick<Entry, 'captureMode' | 'audioUri'>, own: boolean): RecordingAvailability {
  let exists = false;
  if (entry.audioUri) {
    try {
      exists = new File(entry.audioUri).exists;
    } catch {
      exists = false;
    }
    // Web design preview only: the seeded family's recordings count as present (src/dev/preview-audio).
    if (!exists) exists = isPreviewAudioPresent(entry.audioUri);
  }
  return recordingAvailability({ captureMode: entry.captureMode, own, audioUri: entry.audioUri, fileExists: exists });
}

export function useLetterPlayer(
  uri: string | null,
  opts: { fallbackDurationMs?: number | null; autoPlay?: boolean; startAt?: number; onFinish?: () => void } = {},
): LetterPlayer {
  // The web design preview's seeded recordings have no file a browser may load: show the player at rest
  // with the saved length instead of an error. Always false on a phone (src/dev/preview-audio).
  const playable = uri && !isPreviewAudioPresent(uri) ? uri : null;
  const player = useAudioPlayer(playable ? { uri: playable } : null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const intent = useRef<PlayIntent>(INITIAL_INTENT);
  const [wantPlaying, setWantPlaying] = useState(false);
  const [scrubbedTo, setScrubbedTo] = useState<number | null>(null);
  const onFinish = useRef(opts.onFinish);
  onFinish.current = opts.onFinish;

  const run = useCallback(
    (commands: PlayerCommand[]) => {
      for (const c of commands) {
        try {
          if (c === 'play') player.play();
          else if (c === 'pause') player.pause();
          else if (c === 'rewind') void player.seekTo(0).catch(() => {});
          else if (c === 'sessionPlayback') void setAudioMode('playback').catch(() => {});
          else void setAudioMode('idle').catch(() => {});
        } catch {
          // A released player (screen closing) has nothing left to stop.
        }
      }
    },
    [player],
  );

  const dispatch = useCallback(
    (event: PlayerEvent) => {
      const next = reducePlayIntent(intent.current, event);
      intent.current = next.state;
      setWantPlaying(next.state.wantPlaying);
      run(next.commands);
    },
    [run],
  );

  // A new source is a new native player: start from a clean wish.
  useEffect(() => {
    intent.current = INITIAL_INTENT;
    setWantPlaying(false);
    setScrubbedTo(null);
    return () => {
      const wasPlaying = intent.current.wantPlaying;
      intent.current = INITIAL_INTENT;
      if (wasPlaying) void setAudioMode('idle').catch(() => {});
    };
  }, [player]);

  useEffect(() => {
    dispatch({ type: 'status', playing: status.playing, didJustFinish: status.didJustFinish });
    if (status.didJustFinish) onFinish.current?.();
  }, [status.playing, status.didJustFinish, dispatch]);

  // Background-safe stop: leaving the app stops the voice, and it stays stopped on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') dispatch({ type: 'background' });
    });
    return () => sub.remove();
  }, [dispatch]);

  // Once a new recording is ready: go to `startAt` (switching between the original and the
  // listening copy keeps the place), then start if asked (Read together's "Play the next one on
  // its own", or the switch happened mid-play). Never starts while the app is in the background.
  const started = useRef(false);
  const startAt = useRef(opts.startAt ?? 0);
  startAt.current = opts.startAt ?? 0;
  const autoPlay = useRef(opts.autoPlay ?? false);
  autoPlay.current = opts.autoPlay ?? false;
  useEffect(() => {
    started.current = false;
  }, [player]);
  useEffect(() => {
    if (!status.isLoaded || started.current) return;
    started.current = true;
    const at = startAt.current;
    void (async () => {
      if (at > 0) {
        setScrubbedTo(at);
        await player.seekTo(at).catch(() => setScrubbedTo(null));
      }
      if (autoPlay.current && AppState.currentState === 'active') dispatch({ type: 'userPlay' });
    })();
  }, [status.isLoaded, player, dispatch]);

  const duration = status.duration > 0 ? status.duration : (opts.fallbackDurationMs ?? 0) / 1000;
  // A seek takes a moment to show in status; keep the scrubbed position until it does.
  const position = scrubbedTo ?? (intent.current.finished ? duration : status.currentTime);
  useEffect(() => {
    if (scrubbedTo !== null && Math.abs(status.currentTime - scrubbedTo) < 0.75) setScrubbedTo(null);
  }, [status.currentTime, scrubbedTo]);

  return {
    playing: status.playing || (wantPlaying && status.isBuffering),
    loaded: status.isLoaded,
    position: clampPosition(position, duration),
    duration,
    finished: intent.current.finished,
    error: status.error ?? null,
    play: () => dispatch({ type: 'userPlay' }),
    pause: () => dispatch({ type: 'userPause' }),
    toggle: () => dispatch({ type: status.playing ? 'userPause' : 'userPlay' }),
    seek: (seconds: number) => {
      const to = clampPosition(seconds, duration);
      setScrubbedTo(to);
      if (intent.current.finished) intent.current = { ...intent.current, finished: false };
      void player.seekTo(to).catch(() => setScrubbedTo(null));
    },
  };
}
