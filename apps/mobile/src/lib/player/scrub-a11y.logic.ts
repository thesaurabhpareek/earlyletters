/**
 * The adjustable position of a recording, as VoiceOver and TalkBack read it (COMPONENTS 2.21): one role, one label,
 * "Position in the recording, 0:12 of 0:42", and swipe up or down to move 5 seconds. The letter page's player and
 * Review's both take their props from here, so the two cannot drift (BL-1825). The recording is never trimmed or
 * changed: a step only moves where playback is.
 */
import { fill } from '@/lib/copy';
import { playerCopy } from './copy';
import { formatClock, stepPosition } from './player.logic';

export type ScrubA11y = {
  accessible: true;
  accessibilityRole: 'adjustable';
  accessibilityLabel: string;
  accessibilityValue: { min: number; max: number; now: number; text: string };
  accessibilityActions: { name: 'increment' | 'decrement' }[];
  onAccessibilityAction: (ev: { nativeEvent: { actionName: string } }) => void;
};

/**
 * `shown` is the position on screen (a drag in progress, else the playback position); `position` is where playback
 * is, which a step moves from. Seconds throughout.
 */
export function scrubA11y(input: { position: number; shown: number; duration: number; onSeek: (seconds: number) => void }): ScrubA11y {
  return {
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: playerCopy.scrubLabel,
    accessibilityValue: {
      min: 0,
      max: Math.max(0, Math.round(input.duration)),
      now: Math.round(input.shown),
      text: fill(playerCopy.positionText, { elapsed: formatClock(input.shown), total: formatClock(input.duration) }),
    },
    accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }],
    onAccessibilityAction: (ev) => input.onSeek(stepPosition(input.position, ev.nativeEvent.actionName === 'increment' ? 1 : -1, input.duration)),
  };
}
