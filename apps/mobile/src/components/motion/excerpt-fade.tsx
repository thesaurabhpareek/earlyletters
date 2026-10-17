// web: same (react-native-svg web) | android: same
/**
 * ExcerptFade (EXPERIENCE_PASS S26, S09, S22): a person's words in a few lines that end in a fade
 * instead of a cut-off glyph. The lines are clipped by height; when the words run past them, the
 * last 40 percent of the final line fades into the surface the text sits on (a react-native-svg
 * LinearGradient, no new dependency). No `numberOfLines`, so no ellipsis on any platform, and the
 * whole text stays in the element: VoiceOver reads every word, and the stored letter is never cut.
 *
 *   <ExcerptFade text={entry.text} lines={2} variant="letterBody" surface={c.surfaceRaised} />
 *
 * Static: nothing moves (Reduce Motion needs nothing). The fade's colour is the surface's own token
 * (dark `surfaceRaised` in dark mode, 5.6); under Increase Contrast it is the same.
 * FadeEdge is the gradient alone, for anything that draws its own lines (BookCover); FadeCorner joins two eased
 * edges at a corner (the card-to-page veil).
 */
import { useId, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { TypeToken } from '@scribe/design-tokens';
import { Text, type TextProps } from '@/components/ui/text';
import { useFontScale } from '@/lib/a11y';
import { EASED_STOPS, LINEAR_STOPS, fadeBox, isRtl, lineHeightFor, overflows } from './excerpt-fade.logic';

/**
 * A fade from clear to `color`, solid at `side`: toward the end of a line (right, or left for right-to-left text),
 * or along an edge (the card-to-page veil's soft edges, `eased`).
 */
export function FadeEdge({
  color,
  side = 'right',
  eased = false,
  style,
}: {
  color: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  eased?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const id = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [x1, y1, x2, y2] = { right: ['0', '0', '1', '0'], left: ['1', '0', '0', '0'], bottom: ['0', '0', '0', '1'], top: ['0', '1', '0', '0'] }[side];
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={style}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
            {(eased ? EASED_STOPS : LINEAR_STOPS).map((s) => (
              <Stop key={s.offset} offset={String(s.offset)} stopColor={color} stopOpacity={s.opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * The corner between two eased FadeEdges: solid at the corner `at` (where the two edges' solid sides meet), clear a
 * side's length from it, round between. Along its sides it matches the edges beside it exactly.
 */
export function FadeCorner({ color, at, style }: { color: string; at: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'; style?: StyleProp<ViewStyle> }) {
  const id = `corner${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [cx, cy] = { topLeft: ['0', '0'], topRight: ['1', '0'], bottomLeft: ['0', '1'], bottomRight: ['1', '1'] }[at];
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={style}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx={cx} cy={cy} fx={cx} fy={cy} r="1">
            {/* Solid at the centre: the eased curve read from the far end (smoothstep is symmetric). */}
            {EASED_STOPS.map((s) => (
              <Stop key={s.offset} offset={String(s.offset)} stopColor={color} stopOpacity={1 - s.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export type ExcerptFadeProps = Omit<TextProps, 'children' | 'variant' | 'numberOfLines'> & {
  text: string;
  /** Visible lines (2 on Book cards, Tonight's drafts and the held letter). */
  lines: number;
  variant: TypeToken;
  /** The colour behind the text, which the last line fades into (the card's own token). */
  surface: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function ExcerptFade({ text, lines, variant, surface, scale, containerStyle, ...textProps }: ExcerptFadeProps) {
  const fontScale = useFontScale();
  const lh = lineHeightFor(variant, fontScale, scale ?? 1);
  const [cut, setCut] = useState(false);
  const box = fadeBox(lines, lh, isRtl(text));
  return (
    <View style={[{ maxHeight: lines * lh, overflow: 'hidden' }, containerStyle]}>
      <Text variant={variant} scale={scale} {...textProps} onLayout={(e) => setCut(overflows(e.nativeEvent.layout.height, lines, lh))}>
        {text}
      </Text>
      {cut ? <FadeEdge color={surface} side={box.side} style={{ position: 'absolute', top: box.top, height: box.height, width: `${box.widthPct}%`, [box.side]: 0 }} /> : null}
    </View>
  );
}
