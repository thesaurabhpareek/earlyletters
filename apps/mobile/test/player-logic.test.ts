/**
 * Letter playback rules (COMPONENTS 2.21; SOUND.md 5; founder decision 8):
 * who decides when a voice plays, interruptions, time labels for VoiceOver,
 * scrubbing, which letters can play in v1.0, and the original versus the
 * listening copy.
 */
import { describe, expect, it } from 'vitest';
import {
  chooseSource,
  clampPosition,
  formatClock,
  handoffPosition,
  INITIAL_INTENT,
  positionAt,
  progressOf,
  recordingAvailability,
  reducePlayIntent,
  spokenDuration,
  stepPosition,
  usableListeningCopy,
  type PlayerEvent,
  type PlayIntent,
} from '../src/lib/player/player.logic';

function run(events: PlayerEvent[], from: PlayIntent = INITIAL_INTENT) {
  let state = from;
  const commands: string[][] = [];
  for (const e of events) {
    const next = reducePlayIntent(state, e);
    state = next.state;
    commands.push(next.commands);
  }
  return { state, commands };
}

const status = (playing: boolean, didJustFinish = false): PlayerEvent => ({ type: 'status', playing, didJustFinish });

describe('who decides when a voice plays', () => {
  it('Play opens the playback session and plays; Pause pauses and returns the session to idle', () => {
    const { state, commands } = run([{ type: 'userPlay' }, status(true), { type: 'userPause' }, status(false)]);
    expect(commands).toEqual([['sessionPlayback', 'play'], [], ['pause', 'sessionIdle'], []]);
    expect(state).toEqual({ wantPlaying: false, finished: false });
  });

  it('a call pauses the voice and iOS may resume it afterwards (the wish stays)', () => {
    const { state, commands } = run([{ type: 'userPlay' }, status(true), status(false), status(true)]);
    expect(commands.slice(2)).toEqual([[], []]);
    expect(state.wantPlaying).toBe(true);
  });

  it('leaving the app stops the voice, and it stays stopped on return', () => {
    const { state, commands } = run([{ type: 'userPlay' }, status(true), { type: 'background' }, status(true)]);
    expect(commands[2]).toEqual(['pause', 'sessionIdle']);
    // expo-audio may resume a player on foreground; without the wish it is paused again.
    expect(commands[3]).toEqual(['pause']);
    expect(state.wantPlaying).toBe(false);
  });

  it('a voice never starts by itself', () => {
    expect(run([status(true)]).commands).toEqual([['pause']]);
  });

  it('the end clears the wish and returns the session to idle; Play then starts from the beginning', () => {
    const { state, commands } = run([{ type: 'userPlay' }, status(true), status(false, true), { type: 'userPlay' }]);
    expect(commands[2]).toEqual(['sessionIdle']);
    expect(commands[3]).toEqual(['rewind', 'sessionPlayback', 'play']);
    expect(state).toEqual({ wantPlaying: true, finished: false });
  });

  it('closing the screen while playing pauses and restores idle', () => {
    expect(run([{ type: 'userPlay' }, { type: 'release' }]).commands[1]).toEqual(['pause', 'sessionIdle']);
    expect(run([{ type: 'release' }]).commands[0]).toEqual(['pause']);
  });
});

describe('time for the screen and VoiceOver', () => {
  it('formats clock time', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(7.9)).toBe('0:07');
    expect(formatClock(72)).toBe('1:12');
    expect(formatClock(3723)).toBe('1:02:03');
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('speaks durations in words', () => {
    expect(spokenDuration(1)).toBe('1 second');
    expect(spokenDuration(45)).toBe('45 seconds');
    expect(spokenDuration(60)).toBe('1 minute');
    expect(spokenDuration(72)).toBe('1 minute 12 seconds');
    expect(spokenDuration(121)).toBe('2 minutes 1 second');
  });
});

describe('scrubbing', () => {
  it('maps a touch on the track to a time, inside the recording', () => {
    expect(positionAt(150, 300, 60)).toBe(30);
    expect(positionAt(-10, 300, 60)).toBe(0);
    expect(positionAt(400, 300, 60)).toBe(60);
    expect(positionAt(10, 0, 60)).toBe(0);
  });

  it('VoiceOver swipes move 5 seconds, never past either end', () => {
    expect(stepPosition(10, 1, 60)).toBe(15);
    expect(stepPosition(2, -1, 60)).toBe(0);
    expect(stepPosition(58, 1, 60)).toBe(60);
  });

  it('progress stays between 0 and 1', () => {
    expect(progressOf(30, 60)).toBe(0.5);
    expect(progressOf(90, 60)).toBe(1);
    expect(progressOf(5, 0)).toBe(0);
    expect(clampPosition(Number.POSITIVE_INFINITY, 10)).toBe(0);
  });
});

describe('which letters can play in v1.0', () => {
  it('only your own recordings that are on this phone', () => {
    expect(recordingAvailability({ captureMode: 'spoken', own: true, audioUri: 'file:///a.m4a', fileExists: true })).toBe('playable');
    expect(recordingAvailability({ captureMode: 'mixed', own: true, audioUri: 'file:///a.m4a', fileExists: true })).toBe('playable');
    expect(recordingAvailability({ captureMode: 'spoken', own: false, audioUri: 'file:///a.m4a', fileExists: true })).toBe('otherAuthor');
    expect(recordingAvailability({ captureMode: 'spoken', own: true, audioUri: 'file:///a.m4a', fileExists: false })).toBe('notOnPhone');
    expect(recordingAvailability({ captureMode: 'spoken', own: true, audioUri: null, fileExists: false })).toBe('notOnPhone');
    expect(recordingAvailability({ captureMode: 'typed', own: true, audioUri: null, fileExists: false })).toBe('typed');
  });
});

describe('the original and the listening copy (founder decision 8)', () => {
  const original = 'file:///doc/audio/e2.m4a';
  const copy = { uri: 'file:///support/listen/e2.m4a', sourceSha256: 'ab'.repeat(32), method: 'rnnoise' };

  it('uses a copy only when it was made from this exact recording and the file is there', () => {
    expect(usableListeningCopy({ originalUri: original, recordedSha256: 'ab'.repeat(32), copy, copyExists: true })).toBe(copy);
    expect(usableListeningCopy({ originalUri: original, recordedSha256: 'AB'.repeat(32), copy, copyExists: true })).toBe(copy);
    expect(usableListeningCopy({ originalUri: original, recordedSha256: 'cd'.repeat(32), copy, copyExists: true })).toBeNull();
    expect(usableListeningCopy({ originalUri: original, recordedSha256: null, copy, copyExists: true })).toBeNull();
    expect(usableListeningCopy({ originalUri: original, recordedSha256: 'ab'.repeat(32), copy, copyExists: false })).toBeNull();
    expect(usableListeningCopy({ originalUri: original, recordedSha256: 'ab'.repeat(32), copy: { ...copy, uri: original }, copyExists: true })).toBeNull();
    expect(usableListeningCopy({ originalUri: original, recordedSha256: 'ab'.repeat(32), copy: null, copyExists: false })).toBeNull();
  });

  it('plays the listening copy by default, and the original whenever the person chooses it', () => {
    expect(chooseSource({ originalUri: original, copy, preferOriginal: false })).toEqual({ uri: copy.uri, source: 'clearer', canChoose: true });
    expect(chooseSource({ originalUri: original, copy, preferOriginal: true })).toEqual({ uri: original, source: 'original', canChoose: true });
  });

  it('with no copy, plays the original and offers no switch', () => {
    expect(chooseSource({ originalUri: original, copy: null, preferOriginal: false })).toEqual({ uri: original, source: 'original', canChoose: false });
  });

  it('switching keeps the place in the letter', () => {
    expect(handoffPosition(12.5, 60)).toBe(12.5);
    expect(handoffPosition(61, 60)).toBe(60);
    expect(handoffPosition(12.5, null)).toBe(12.5);
    expect(handoffPosition(-1, 60)).toBe(0);
    expect(handoffPosition(Number.NaN, 60)).toBe(0);
  });
});
