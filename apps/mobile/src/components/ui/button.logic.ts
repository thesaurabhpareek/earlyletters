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

export function pressableState(disabled: boolean | null | undefined, loading: boolean | null | undefined, accessibilityState?: AccessibilityState) {
  return {
    disabled: !!disabled,
    pressable: !disabled && !loading,
    accessibilityState: { ...accessibilityState, disabled: !!disabled, busy: !!loading },
  };
}
