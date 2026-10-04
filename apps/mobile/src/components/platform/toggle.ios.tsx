// web: toggle.tsx | android: toggle.tsx (RN Switch; Compose Switch when Android ships)
/**
 * iOS: the real SwiftUI Toggle through Expo UI (people trust the system switch; it
 * brings the system off-state edge, haptic and VoiceOver "switch button, on").
 * Tinted with our accent. The row's visible label is hidden from VoiceOver by ListRow,
 * so the switch carries the label and description: one announcement, not two.
 * APIs verified against @expo/ui 57.0.21 (build/swift-ui/Toggle, Host, modifiers).
 */
import { Host, Toggle as SwiftToggle } from '@expo/ui/swift-ui';
import { accessibilityHint, accessibilityLabel, disabled as disabledMod, labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/lib/a11y';
import type { ToggleProps } from './toggle.types';

export type { ToggleProps } from './toggle.types';

export function Toggle({ label, description, value, onValueChange, disabled, testID }: ToggleProps) {
  const { c, scheme } = useTheme();
  const modifiers = [labelsHidden(), tint(c.accent), accessibilityLabel(label), ...(description ? [accessibilityHint(description)] : []), ...(disabled ? [disabledMod(true)] : [])];
  return (
    <Host matchContents colorScheme={scheme} testID={testID}>
      <SwiftToggle isOn={value} onIsOnChange={onValueChange} label={label} modifiers={modifiers} />
    </Host>
  );
}
