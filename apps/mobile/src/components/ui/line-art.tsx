// web: same SVG | android: same
/**
 * Line drawings (CREATIVE 3, DESIGN_LANGUAGE 9, EXPERIENCE_PASS 5.4): original single-weight lines with
 * round caps in textMuted, one optional accentSoft wash behind the object. No faces, no mascot, no
 * sparkle. Drawn once, stroke by stroke, the way the website draws its drawings (DrawOnStrokes,
 * tokens.motion.drawMs); complete at once under Reduce Motion. Decorative for screen readers.
 *
 * The drawings and their stroke tables are data in line-art.data.ts: the app's envelope, open
 * envelope, page and "together", and the website's moon, lamp, window and reading lamp.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DrawOnStrokes } from '@/components/motion/draw-on';
import { useTheme } from '@/lib/a11y';
import { LINE_ART, artHeight, penWidth, type LineArtName } from './line-art.data';

export { LINE_ART, LINE_ART_NAMES, type LineArtName } from './line-art.data';

export function LineArt({
  name,
  width = 160,
  wash = true,
  animate = true,
  delayMs,
  style,
}: {
  name: LineArtName;
  width?: number;
  wash?: boolean;
  /** false: complete at once (repeat views, lists, error screens). */
  animate?: boolean;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const art = LINE_ART[name];
  return (
    <View style={style} accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={width} height={artHeight(name, width)} viewBox={art.viewBox.join(' ')}>
        {wash && <Circle cx={art.wash.cx} cy={art.wash.cy} r={art.wash.r} fill={c.accentSoft} />}
        <DrawOnStrokes
          strokes={art.strokes}
          animate={animate}
          delayMs={delayMs}
          fill="none"
          stroke={c.textMuted}
          strokeWidth={penWidth(name, width)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
