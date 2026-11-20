// web: same (react-native-svg web) | android: same
/**
 * ExcerptFade (EXPERIENCE_PASS S26, S09, S22; book-page.md 2, BL-659, BL-660): a person's words in a few lines that
 * end in a fade instead of a cut-off glyph. The lines are clipped by height; when the words run past them, the last
 * visible line fades into the surface the text sits on (a react-native-svg LinearGradient, no new dependency). No
 * `numberOfLines`, so no ellipsis on any platform, and the whole text stays in the element: VoiceOver reads every
 * word, and the stored letter is never cut.
 *
 *   <ExcerptFade text={entry.text} lines={3} variant="letterBody" surface={c.surfaceRaised} />
 *
 * Where the fade sits is EXCERPT_ENDING (excerpt-fade.logic.ts, BL-659). With 'word', the platform's own line breaks
 * (onTextLayout) say which words are on the last visible line, and a hidden copy of its last word measures how wide
 * that word is, so the fade covers that whole word and nothing before it. Until both are known (the first frame, or
 * the web build, which has no onTextLayout) it is build 1's fade over the last 40 percent. Inside a CardText the
 * span is reported up, so the card-to-page carry draws its fade in the same place.
 *
 * Static: nothing moves (Reduce Motion needs nothing). The fade's colour is the surface's own token
 * (dark `surfaceRaised` in dark mode, 5.6); under Increase Contrast it is the same.
 * FadeEdge is the gradient alone, for anything that draws its own lines (BookCover).
 */
import { createContext, useContext, useEffect, useId, useState } from 'react';
import { View, type StyleProp, type TextLayoutEvent, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { TypeToken } from '@scribe/design-tokens';
import { Text, type TextProps } from '@/components/ui/text';
import { useFontScale } from '@/lib/a11y';
import { EXCERPT_ENDING, fadeBox, fadeSpanFor, isRtl, lastWordTail, lineHeightFor, overflows, type ExcerptEnding, type FadeSpan, type TextLine } from './excerpt-fade.logic';

/**
 * Where an ExcerptFade's fade sits on its last line, for a CardText around it (card-transition.tsx), so the carried
 * words keep the card's fade in the same place. Null: not cut, or not measured.
 */
export const ExcerptFadeSpanContext = createContext<((span: FadeSpan | null) => void) | null>(null);

/** A horizontal fade from clear to `color`, toward the end of a line (right, or left for right-to-left text). */
export function FadeEdge({ color, side = 'right', style }: { color: string; side?: 'left' | 'right'; style?: StyleProp<ViewStyle> }) {
  const id = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [x1, x2] = side === 'right' ? ['0', '1'] : ['1', '0'];
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={style}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1={x1} y1="0" x2={x2} y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
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
  /** How the last line ends (BL-659); EXCERPT_ENDING unless a caller must differ. */
  ending?: ExcerptEnding;
};

export function ExcerptFade({ text, lines, variant, surface, scale, containerStyle, ending = EXCERPT_ENDING, ...textProps }: ExcerptFadeProps) {
  const fontScale = useFontScale();
  const lh = lineHeightFor(variant, fontScale, scale ?? 1);
  const rtl = isRtl(text);
  const [cut, setCut] = useState(false);
  const [boxWidth, setBoxWidth] = useState(0);
  const [laid, setLaid] = useState<TextLine[] | null>(null);
  const [tailWidth, setTailWidth] = useState<number | null>(null);
  const report = useContext(ExcerptFadeSpanContext);
  const box = fadeBox(lines, lh, rtl);
  const lastLine = laid && laid.length >= lines ? laid[lines - 1] : undefined;
  const tail = ending === 'word' && cut && lastLine ? lastWordTail(lastLine.text) : null;
  const span = fadeSpanFor({ ending, lines: laid, visible: lines, tailWidth: tail ? tailWidth : null, boxWidth, rtl });

  // A new tail is measured afresh (the words, the width or the text size changed).
  useEffect(() => setTailWidth(null), [tail, fontScale, scale]);
  const spanKey = cut && boxWidth > 0 ? `${span.left}:${span.width}` : '';
  useEffect(() => {
    report?.(spanKey ? span : null);
    // The span is reported when it changes, by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, spanKey]);
  useEffect(() => () => report?.(null), [report]);

  const onTextLayout = (e: TextLayoutEvent) => {
    const next = e.nativeEvent.lines.map((l) => ({ text: l.text, x: l.x, width: l.width }));
    setLaid((was) => (was && was.length === next.length && was.every((l, i) => l.text === next[i]!.text && l.x === next[i]!.x && l.width === next[i]!.width) ? was : next));
  };

  return (
    <View style={[{ maxHeight: lines * lh, overflow: 'hidden' }, containerStyle]} onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}>
      <Text variant={variant} scale={scale} {...textProps} onTextLayout={onTextLayout} onLayout={(e) => setCut(overflows(e.nativeEvent.layout.height, lines, lh))}>
        {text}
      </Text>
      {tail ? (
        // The last word alone, unseen, to measure it in the same type: never read, never touched.
        <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
          <Text variant={variant} scale={scale} style={textProps.style} onTextLayout={(e) => setTailWidth(e.nativeEvent.lines[0]?.width ?? null)}>
            {tail}
          </Text>
        </View>
      ) : null}
      {cut && boxWidth > 0 ? <FadeEdge color={surface} side={box.side} style={{ position: 'absolute', top: box.top, height: box.height, left: span.left, width: span.width }} /> : null}
    </View>
  );
}
