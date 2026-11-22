// web: same SVG | android: same
/**
 * WelcomeLockup: the stacked lockup on the welcome (EXPERIENCE_PASS S03; registry context `app.welcome`, D-109 F3).
 * The one logo on the screen: the name is never typed in a font beside it (BRAND_SYSTEM 2a), and its accessible
 * name is the brand name. Ink on paper, reversed on dark, from the registry asset's own fill. It fades in once over
 * tokens.motion.fadeMs and never moves, so it is calm under Reduce Motion too. The lamp may light the paper around
 * it, never as a glow inside, behind or around the mark (BRAND_SYSTEM 4, F2).
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { STANDARD_EASING } from '@/lib/motion';
import { LOCKUP_ASPECT, LOCKUP_PATHS, LOCKUP_VIEWBOX, lockupAsset, lockupHeight } from './welcome-lockup.logic';

/** The one entrance: a token-length fade. It is also the Reduce Motion form, so it always runs. */
const FADE = FadeIn.duration(tokens.motion.fadeMs).easing(STANDARD_EASING).reduceMotion(ReduceMotion.Never);

export function WelcomeLockup({ label, height, style }: { label: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const { scheme, c } = useTheme();
  const h = lockupHeight(scheme, height);
  // The registry asset carries its own fill; the theme's text colour is only the fallback (no colour literal here).
  const fill = lockupAsset(scheme).fill ?? c.text;
  return (
    <Animated.View entering={FADE} accessible role="img" accessibilityLabel={label} style={[{ alignSelf: 'center' }, style]}>
      <View pointerEvents="none">
        <Svg width={h * LOCKUP_ASPECT} height={h} viewBox={LOCKUP_VIEWBOX}>
          {LOCKUP_PATHS.map((p, i) =>
            p.transform ? (
              <G key={i} transform={p.transform}>
                <Path d={p.d} fill={fill} />
              </G>
            ) : (
              <Path key={i} d={p.d} fill={fill} />
            ),
          )}
        </Svg>
      </View>
    </Animated.View>
  );
}
