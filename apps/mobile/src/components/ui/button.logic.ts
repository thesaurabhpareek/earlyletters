/**
 * What Button hands to React Native's Pressable for its disabled and busy states (COMPONENTS 2.1). Pure, so
 * test/button-busy.test.ts runs it in Node.
 *
 * Pressable writes its own `disabled` prop over `accessibilityState.disabled` whenever the prop is set (RN 0.86.3
 * Pressable.js: `disabled != null ? {..._accessibilityState, disabled} : _accessibilityState`). A busy button (loading)
 * must reach VoiceOver as busy, not as dimmed, so only a real `disabled` goes to Pressable; a busy one ignores
 * presses through `pressable` instead.
 */
import type { AccessibilityState } from 'react-native';
import { tokens } from '@scribe/design-tokens';

export function pressableState(disabled: boolean | null | undefined, loading: boolean | null | undefined, accessibilityState?: AccessibilityState) {
  return {
    disabled: !!disabled,
    pressable: !disabled && !loading,
    accessibilityState: { ...accessibilityState, disabled: !!disabled, busy: !!loading },
  };
}

/**
 * A wrapped label keeps the pill up to two lines; from the third line the button takes `radius.xl` (34 pt) instead
 * (COMPONENTS 2.1; council ruling CDesO-14, BL-490). Without it, `rounded-full` on a full-width button that has grown
 * three or more lines tall at accessibility sizes draws a tall oval whose ends cut into the words.
 *
 * Why `xl`, named by design systems: it is the corner a two-line `lg` pill already has at the default text size (two
 * 22 pt `label` lines and 12 pt padding top and bottom: 68 pt tall, a 34 pt corner), so the third line keeps the
 * corner and only the straight sides grow; from the default size up it stays under half the height of the shortest
 * three-line button (three 20 pt `labelSmall` lines and `sm` padding: 76 pt, half 38), so it never re-forms an oval;
 * and no card uses it (cards are `md` and `lg`), so the button still reads as a control, not as a card. It is the
 * corner of the other large controls: custom sheets and the capture surface.
 */
export const PILL_MAX_LINES = 2;
export const WRAPPED_LABEL_RADIUS = tokens.radius.xl;

/** The corner for a label drawn on `lines` lines: undefined keeps the pill class; a number overrides it. */
export function wrappedLabelRadius(lines: number): number | undefined {
  return lines > PILL_MAX_LINES ? WRAPPED_LABEL_RADIUS : undefined;
}
