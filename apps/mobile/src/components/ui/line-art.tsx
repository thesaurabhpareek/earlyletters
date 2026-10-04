// web: same SVG | android: same
/**
 * Line drawings (CREATIVE 3, DESIGN_LANGUAGE 9): original single-weight lines with round
 * caps in textMuted, one optional accentSoft wash behind the object. No faces, no mascot,
 * no sparkle. Drawn once (DrawOnPath); decorative for screen readers.
 *
 *   envelope       closed letter: onboarding, empty Family
 *   envelopeOpen   a letter with its page out: first run, first letter
 *   moon           night: Tonight empty, Read together end
 *   page           one written line and a signature: empty Book, empty month
 *   together       one open book, two pens, each writing on its own page: co-parent
 *                  sharing (Family tab, invite entry points)
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DrawOnPath } from '@/components/motion/draw-on';
import { useTheme } from '@/lib/a11y';

/** viewBox 0 0 160 120. Lengths from SVGGeometryElement.getTotalLength() (Chromium), rounded up. */
export const LINE_ART = {
  envelope: {
    d: 'M36 28 H124 Q130 28 130 34 V94 Q130 100 124 100 H36 Q30 100 30 94 V34 Q30 28 36 28 Z M34 32 L80 66 L126 32 M34 96 L67 70 M126 96 L93 70',
    length: 534,
    wash: { cx: 80, cy: 64, r: 46 },
  },
  envelopeOpen: {
    d: 'M42 59.7 V18 Q42 12 48 12 H112 Q118 12 118 18 V59.7 M56 30 Q63 26 70 30 T84 30 T98 30 M56 42 Q61 39 66 42 T76 42 M30 52 V98 Q30 104 36 104 H124 Q130 104 130 98 V52 M30 52 L80 84 L130 52',
    length: 551,
    wash: { cx: 80, cy: 62, r: 48 },
  },
  moon: {
    d: 'M90 22 A40 40 0 1 0 126 74 A32 32 0 0 1 90 22 Z M120 28 V36 M116 32 H124 M44 44 V50 M41 47 H47',
    length: 298,
    wash: { cx: 84, cy: 62, r: 46 },
  },
  page: {
    d: 'M52 14 H108 Q114 14 114 20 V100 Q114 106 108 106 H52 Q46 106 46 100 V20 Q46 14 52 14 Z M58 38 Q65 34 72 38 T86 38 T100 38 M84 86 Q89 82 94 86 T104 86',
    length: 378,
    wash: { cx: 80, cy: 60, r: 46 },
  },
  together: {
    d: 'M80 52 C70 46 54 44 34 48 V96 C54 92 70 94 80 100 C90 94 106 92 126 96 V48 C106 44 90 46 80 52 V100 M42 62 Q45.0 59.8 48 62 T54 62 T60 62 M42 72 Q45.5 69.8 49 72 T56 72 M42 85 Q45.0 82.8 48 85 T54 85 M60.0 86.0 L64.1 79.7 L70.5 50.6 Q68.7 46.9 65.5 49.4 L59.0 78.6 Z M59.0 78.6 L64.1 79.7 M96 62 Q99.0 59.8 102 62 T108 62 T114 62 M96 72 Q98.75 69.8 101.5 72 T107.0 72 M96 85 Q99.0 82.8 102 85 T108 85 M114.0 86.0 L118.1 79.7 L124.5 50.6 Q122.7 46.9 119.5 49.4 L113.0 78.6 Z M113.0 78.6 L118.1 79.7',
    length: 597,
    wash: { cx: 80, cy: 70, r: 46 },
  },
} as const;

export type LineArtName = keyof typeof LINE_ART;

export function LineArt({
  name,
  width = 160,
  wash = true,
  animate = true,
  style,
}: {
  name: LineArtName;
  width?: number;
  wash?: boolean;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const art = LINE_ART[name];
  const height = (width * 120) / 160;
  // A constant 1.75 pt pen line on screen at any drawing size (viewBox units scale with width).
  const stroke = 1.75 * (160 / width);
  return (
    <View style={style} accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={width} height={height} viewBox="0 0 160 120">
        {wash && <Circle cx={art.wash.cx} cy={art.wash.cy} r={art.wash.r} fill={c.accentSoft} />}
        <DrawOnPath
          d={art.d}
          length={art.length}
          animate={animate}
          fill="none"
          stroke={c.textMuted}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
