/// <reference types="node" />
/**
 * The screen stays awake only while a take is recording and while Read together audio plays (D-087, Q-015 3.5).
 * Never while paused, never while idle, never for downloads. The hook is a thin effect over expo-keep-awake;
 * what matters is where it is used and with which condition, so that is checked in the source.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { wordsCopy } from '@scribe/content';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

describe('keep awake', () => {
  it('Listening: only while recording, not while paused, finishing or asking', () => {
    const listen = src('app/listen.tsx');
    expect(listen).toMatch(/useKeepAwakeWhile\(phase === 'recording', KEEP_AWAKE_TAGS\.listen\)/);
    expect(listen).not.toMatch(/useKeepAwakeWhile\([^)]*paused/);
  });

  it('Read together: only while a recording is playing, from the player, not the whole screen', () => {
    expect(src('components/player/audio-player.tsx')).toMatch(/useKeepAwakeWhile\(context === 'readTogether' && p\.playing, KEEP_AWAKE_TAGS\.readTogether\)/);
    expect(src('app/read-together.tsx')).not.toMatch(/useKeepAwakeWhile/);
  });

  it('a letter played from the Book does not hold the screen (only Read together does)', () => {
    expect(src('components/player/audio-player.tsx')).toMatch(/context === 'readTogether' &&/);
  });

  it('no download, queue or pack code holds the screen awake', () => {
    for (const f of ['lib/transcription-queue/index.ts', 'lib/packs/engine.ts', 'lib/models/speech-packs.ts', 'components/speech/speech-consent-card.tsx']) {
      expect(src(f), f).not.toMatch(/keep-awake|KeepAwake/);
    }
  });

  it('the hook releases on unmount and on a change to inactive, and swallows OS failures', () => {
    const hook = src('lib/resilience/keep-awake.ts');
    expect(hook).toMatch(/if \(!active\) return;/);
    expect(hook).toMatch(/return \(\) => \{\s*void deactivateKeepAwake\(tag\)/);
    expect(hook).toMatch(/\.catch\(\(\) => \{\}\)/);
  });
});

describe('a take that ended by leaving the app says so', () => {
  // Since P4 (EXPERIENCE_PASS S14) a call or an alert, and the app closing, say so too; the rules are pure and tested
  // in test/listen.test.ts (reviewParams) and test/words-state.test.ts (stopLine). Here: the screens use them.
  it('Listening passes why the take stopped to Review (leaving the app, or a call or an alert)', () => {
    const listen = src('app/listen.tsx');
    expect(listen).toMatch(/router\.replace\(\{ pathname: '\/review', params: reviewParams\(draft\.id, reason\) \}\)/);
  });

  it('Review shows one plain line for it', () => {
    expect(src('app/review.tsx')).toMatch(/stopLine\(\{ stopped, recoveredAt: draft\.recoveredAt, spoken \}\)/);
    expect(wordsCopy.pack.stoppedInBackground).toBe('The recording stopped when you left the app. Everything before that is kept.');
  });
});
