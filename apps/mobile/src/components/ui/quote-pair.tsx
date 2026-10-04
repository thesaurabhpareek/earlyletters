// web: same SVG | android: same
/**
 * QuotePair: the opening quotation pair, the brand device (BRAND_SYSTEM 1, registry context
 * `app.brand-device`). A grown-up voice and a small one, the moment before someone speaks.
 * Opening quotes only, never closing: the letters are still being written.
 *
 * Rules: above a heading on welcome and empty states, one per screen, 40 to 64 pt. Accent
 * on paper, reversed on dark (taken from the registry asset's own fill). It fades in once
 * and never moves, so it is calm under Reduce Motion too. Decorative, hidden from screen
 * readers; the heading beneath it carries the meaning.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { STANDARD_EASING } from '@/lib/motion';
import { SYMBOL_ASPECT, SYMBOL_PATH, SYMBOL_VIEWBOX, deviceAsset, deviceHeight, edgeOffset } from './quote-pair.logic';

/** The one entrance: a token-length fade. It is also the Reduce Motion form, so it always runs. */
const FADE = FadeIn.duration(tokens.motion.fadeMs).easing(STANDARD_EASING).reduceMotion(ReduceMotion.Never);

export function QuotePair({ height = 48, aligned = true, style }: { height?: number; aligned?: boolean; style?: StyleProp<ViewStyle> }) {
  const { scheme } = useTheme();
  const h = deviceHeight(scheme, height);
  const fill = deviceAsset(scheme).fill ?? '#000000';
  return (
    <Animated.View
      entering={FADE}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      style={[{ alignSelf: 'flex-start', marginLeft: aligned ? edgeOffset(h) : 0 }, style]}>
      <View>
        <Svg width={h * SYMBOL_ASPECT} height={h} viewBox={SYMBOL_VIEWBOX}>
          <Path d={SYMBOL_PATH} fill={fill} />
        </Svg>
      </View>
    </Animated.View>
  );
}
