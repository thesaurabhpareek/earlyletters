// web: same (react-native-svg web) | android: same
/**
 * MonthOpener (EXPERIENCE_PASS S26): a chapter of the Book opens like a page in a printed book, not a feed's section
 * header. Top to bottom: the kicker ("MONTH", or "THIS MONTH"), the numeral in the numeral face (or "The first
 * weeks" / "Before You" in title1), "2 letters · From Mama" and the month's dates. A hairline sits above every opener
 * but the first.
 *
 * The current month is lit: its opener sits in a radius.lg card on paper with a 1 pt edge in the lamp's amber at 40
 * percent and a still radial of gold inside, at the scheme's peak times 0.5 (the reading colours hold 4.5:1 at the
 * full peak, tokens.atmosphere). Nothing moves. Increase Contrast and Reduce Transparency: a plain 1 pt `line` edge,
 * no light (5.6). A current month with no letters yet stands alone, like an open page, with no sentence.
 *
 * One VoiceOver header per opener, read without the "·" ("This month, Month 7. 2 letters, from Mama. September 13
 * to October 12"); the parts inside are not reachable on their own.
 */
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import type { Opener } from './chapters';

/** The lit edge: the lamp's amber at 40 percent, as an 8-digit hex (5.6). */
const EDGE_ALPHA = 0.4;
/** The light inside the lit card: gold at the scheme's peak times this. */
export const LIT_CARD_STRENGTH = 0.5;

const hexAlpha = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()}`;

export function MonthOpener({ opener, first }: { opener: Opener; first: boolean }) {
  const { c, scheme, highContrast, reduceTransparency } = useTheme();
  const plain = highContrast || reduceTransparency;
  const body = (
    <View className="gap-1">
      {opener.kicker ? (
        <Text variant="letterDateline" caps>
          {opener.kicker}
        </Text>
      ) : null}
      {opener.numeral !== null ? (
        <Text variant="numeral">{opener.numeral}</Text>
      ) : (
        <Text variant="title1">{opener.name}</Text>
      )}
      {opener.line ? (
        <Text variant="footnote" className="pt-1">
          {opener.line}
        </Text>
      ) : null}
      {opener.range ? <Text variant="letterDateline">{opener.range}</Text> : null}
    </View>
  );

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={opener.a11yLabel} className="px-5 pb-3 pt-6" testID={opener.lit ? 'book.opener.current' : 'book.opener'}>
      {first ? null : <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginBottom: 24 }} />}
      {opener.lit ? (
        <View
          style={{
            borderRadius: tokens.radius.lg,
            borderWidth: 1,
            borderColor: plain ? c.line : hexAlpha(tokens.atmosphere.tone.amber, EDGE_ALPHA),
            padding: 20,
            overflow: 'hidden',
          }}>
          {plain ? null : <LitGlow strength={tokens.atmosphere.peak[scheme].gold * LIT_CARD_STRENGTH} />}
          {body}
        </View>
      ) : (
        body
      )}
    </View>
  );
}

/** A still radial of gold inside the lit card: drawn once, never animated, decorative. */
function LitGlow({ strength }: { strength: number }) {
  const id = `lit${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx="0.3" cy="0.2" r="0.95" fx="0.3" fy="0.2">
            <Stop offset="0" stopColor={tokens.atmosphere.tone.gold} stopOpacity={strength} />
            <Stop offset="0.55" stopColor={tokens.atmosphere.tone.gold} stopOpacity={strength * 0.4} />
            <Stop offset="1" stopColor={tokens.atmosphere.tone.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
