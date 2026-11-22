// web: shadcn Switch (later) | android: this file until toggle.android.tsx (Compose Switch) ships
/**
 * Fallback switch (Android, web preview): React Native Switch coloured from tokens.
 * The off track uses controlBorder (3:1 on every surface), fixing the 1.33:1 `line`
 * track found in TDD 09 A11Y-F04.
 */
import { Platform, Switch } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import type { ToggleProps } from './toggle.types';

export type { ToggleProps } from './toggle.types';

/** The paper-white thumb. */
const THUMB = tokens.light.surfaceRaised;
/**
 * react-native-web draws the thumb of a switch that is on in its own Material teal (#009688) unless it is given
 * `activeThumbColor`, a web-only prop (EXPERIENCE_PASS S34: the teal thumb in the web journey). iOS and Android
 * use `thumbColor` for both states.
 */
const WEB_THUMB = Platform.OS === 'web' ? ({ activeThumbColor: THUMB } as object) : {};

export function Toggle({ label, description, value, onValueChange, disabled, testID }: ToggleProps) {
  const { c } = useTheme();
  return (
    <Switch
      {...WEB_THUMB}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={label}
      accessibilityHint={description}
      trackColor={{ false: c.controlBorder, true: c.accent }}
      // Paper-white thumb in both themes, as iOS draws it: a dark-mode surface thumb vanished on the track.
      thumbColor={THUMB}
      ios_backgroundColor={c.controlBorder}
    />
  );
}
