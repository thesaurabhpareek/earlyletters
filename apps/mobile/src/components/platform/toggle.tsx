// web: shadcn Switch (later) | android: this file until toggle.android.tsx (Compose Switch) ships
/**
 * Fallback switch (Android, web preview): React Native Switch coloured from tokens.
 * The off track uses controlBorder (3:1 on every surface), fixing the 1.33:1 `line`
 * track found in TDD 09 A11Y-F04.
 */
import { Switch } from 'react-native';
import { useTheme } from '@/lib/a11y';
import type { ToggleProps } from './toggle.types';

export type { ToggleProps } from './toggle.types';

export function Toggle({ label, description, value, onValueChange, disabled, testID }: ToggleProps) {
  const { c } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={label}
      accessibilityHint={description}
      trackColor={{ false: c.controlBorder, true: c.accent }}
      thumbColor={c.surfaceRaised}
      ios_backgroundColor={c.controlBorder}
    />
  );
}
