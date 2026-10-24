/// <reference types="node" />
/**
 * Keeping a letter while "Hear it" plays (#289 lens B, P4 critics' pass S6). Announcements wait while a recording
 * plays (lib/a11y `announce`, TDD 09 rule S2), so a Keep that only paused the player would leave the audio mode at
 * playback and hold the saved moment's sentence until the Book, with a VoiceOver user waiting 8 s in silence. Both
 * save paths set the mode back to idle first, as Hear it's own pause does. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spoken = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AccessibilityInfo: { announceForAccessibilityWithOptions: (m: string) => spoken.list.push(m) },
  useWindowDimensions: () => ({ fontScale: 1 }),
}));
vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: 'light' }) }));
vi.mock('expo-audio', () => ({ setAudioModeAsync: async () => {} }));

const { announce } = await import('../src/lib/a11y');
const { getAudioMode, setAudioMode } = await import('../src/lib/audio-mode');

const SAID = "Kept in Month 7. Added to Asha's book.";

describe('[S6] the saved moment is said at once after Keep, even when Hear it was playing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    spoken.list = [];
  });
  afterEach(async () => {
    await setAudioMode('idle');
    vi.useRealTimers();
  });

  it('while the mode is playback, the sentence waits (never over a letter)', async () => {
    await setAudioMode('playback');
    announce(SAID);
    expect(spoken.list).toEqual([]);
  });

  it('Keep pauses, sets the mode back to idle, then the sentence is spoken at once', async () => {
    await setAudioMode('playback');
    // save(): player.pause(); await setAudioMode('idle'); ... then the saved moment announces at the commit.
    await setAudioMode('idle');
    expect(getAudioMode()).toBe('idle');
    announce(SAID);
    expect(spoken.list).toEqual([SAID]);
  });

  it('review.tsx: both save paths set the mode to idle right after pausing, before anything is kept', () => {
    const review = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8').replace(/\/\/.*$/gm, '');
    for (const [from, to] of [
      ['const save = async', 'const keepRecordingOnly = async'],
      ['const keepRecordingOnly = async', 'useEffect(() => {\n    if (gate || saveFailed)'],
    ]) {
      const body = review.slice(review.indexOf(from), review.indexOf(to));
      expect(body, from).toMatch(/player\.pause\(\);\s*await setAudioMode\('idle'\)\.catch\(\(\) => \{\}\);\s*setSaveFailed\(false\);\s*try \{/);
    }
  });
});
