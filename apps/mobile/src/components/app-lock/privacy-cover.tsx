/**
 * PrivacyCover (COMPONENTS 2.26, design.md 2.4; SETTINGS_AND_ACCOUNT.md section 4): an opaque page-colour cover with
 * the mark only. Drawn at once, with no entrance animation, so the app switcher snapshot taken as the app leaves the
 * front never catches a letter or a name. It never shows a child's name or any text of the book; VoiceOver reads only
 * the app name (`appLock.coverLabel`).
 *
 * Kept here until `design-systems` takes it into components/ui (hand-off): it draws the same symbol as QuotePair
 * (registry context app.brand-device) without QuotePair's fade, which a cover must not have.
 * Themes: `bg` with the symbol's own fill per scheme; Increase Contrast swaps the palette through useTheme.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { deviceAsset, deviceHeight, SYMBOL_ASPECT, SYMBOL_PATH, SYMBOL_VIEWBOX } from '@/components/ui/quote-pair.logic';
import { useTheme } from '@/lib/a11y';
import { appLockCopy } from '@/lib/app-lock/copy';

/** The mark's height on the cover: the splash symbol's size (96 pt), so leaving and coming back looks like launch. */
const MARK_HEIGHT = 96;

export function PrivacyCover({ children, testID = 'appLock.cover' }: { children?: ReactNode; testID?: string }) {
  const { c, scheme } = useTheme();
  const h = deviceHeight(scheme, MARK_HEIGHT);
  const fill = deviceAsset(scheme).fill ?? c.text;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]} testID={testID}>
      <View style={styles.center}>
        <View accessible accessibilityRole="image" accessibilityLabel={appLockCopy.coverLabel} testID="appLock.cover.mark">
          <Svg width={h * SYMBOL_ASPECT} height={h} viewBox={SYMBOL_VIEWBOX}>
            <Path d={SYMBOL_PATH} fill={fill} />
          </Svg>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
