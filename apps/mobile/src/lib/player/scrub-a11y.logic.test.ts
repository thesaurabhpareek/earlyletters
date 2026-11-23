/**
 * [BL-1825] Review's recording exposes the same adjustable value and increment and decrement actions as the letter
 * page's player. Both take their props from scrubA11y; the source checks keep it so.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { playerCopy } from './copy';
import { scrubA11y } from './scrub-a11y.logic';

vi.mock('react-native', () => ({ View: 'View' }));
vi.mock('@/lib/a11y', () => ({ useTheme: () => ({ c: { line: '#ddd', accent: '#00f' } }) }));

import { ReviewScrub } from '@/components/capture/review-scrub';

const SRC = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

describe('[BL-1825] the recording position VoiceOver moves within', () => {
  it('reads as an adjustable with the position, and moves 5 seconds a step without leaving the recording', () => {
    const seek = vi.fn();
    const a = scrubA11y({ position: 12, shown: 12, duration: 42, onSeek: seek });
    expect(a.accessibilityRole).toBe('adjustable');
    expect(a.accessibilityLabel).toBe(playerCopy.scrubLabel);
    expect(a.accessibilityValue).toMatchObject({ min: 0, max: 42, now: 12 });
    expect(a.accessibilityValue.text).toContain('0:12');
    expect(a.accessibilityValue.text).toContain('0:42');
    expect(a.accessibilityActions.map((x) => x.name)).toEqual(['increment', 'decrement']);
    a.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    a.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
    expect(seek).toHaveBeenNthCalledWith(1, 17);
    expect(seek).toHaveBeenNthCalledWith(2, 7);
    // Never past either end.
    const end = scrubA11y({ position: 41, shown: 41, duration: 42, onSeek: seek });
    end.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    expect(seek).toHaveBeenLastCalledWith(42);
    const start = scrubA11y({ position: 2, shown: 2, duration: 42, onSeek: seek });
    start.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
    expect(seek).toHaveBeenLastCalledWith(0);
  });

  it("Review's scrub carries exactly the props the letter page's player gets", () => {
    const seek = vi.fn();
    const el = ReviewScrub({ position: 12, duration: 42, onSeek: seek }) as ReactElement<Record<string, unknown>>;
    const want = scrubA11y({ position: 12, shown: 12, duration: 42, onSeek: seek });
    const { onAccessibilityAction: _a, ...rest } = want;
    expect(el.props).toMatchObject(rest);
    expect(typeof el.props.onAccessibilityAction).toBe('function');
    (el.props.onAccessibilityAction as typeof want.onAccessibilityAction)({ nativeEvent: { actionName: 'increment' } });
    expect(seek).toHaveBeenCalledWith(17);
  });

  it('the letter page player and Review both use the shared props, and Review is not left on a bare expo-audio player', () => {
    expect(read('components/player/audio-player.tsx')).toContain('scrubA11y(');
    expect(read('components/capture/review-scrub.tsx')).toContain('scrubA11y(');
    const review = read('app/review.tsx');
    expect(review).toContain('<ReviewScrub');
    expect(review).toContain('useLetterPlayer(');
    expect(review).not.toContain('useAudioPlayer(');
  });
});
