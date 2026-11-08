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
 * Type and rhythm (TestFlight build 1): the numeral's line is trimmed to its figures' ink (Text `trim`), so the
 * kicker, the numeral and the lines under it share one optical left edge, and the gaps between them come from the
 * spacing scale (space 1 above the numeral, space 2 under it) instead of the face's ascender. Inside the lit card the
 * words sit where a letter card's words sit (CARD_TEXT_INSET): the card's 1 pt edge plus its padding make space 4.
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
import { CARD_TEXT_INSET } from './letter-card';

/** The lit edge: the lamp's amber at 40 percent, as an 8-digit hex (5.6). */
const EDGE_ALPHA = 0.4;
/** The light inside the lit card: gold at the scheme's peak times this. */
export const LIT_CARD_STRENGTH = 0.5;
/** The lit card's edge, inside its box (RN draws the border inside, so the padding gives it back). */
const LIT_EDGE = 1;
/** The Book's gutter (BookRow, this opener: px-5). */
const GUTTER = tokens.space[5];
/** The lit card's side padding: its words line up with a letter card's (20 + 1 + 15 = 36 pt from the screen edge). */
export const LIT_PAD_X = CARD_TEXT_INSET - GUTTER - LIT_EDGE;

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
        <Text variant="numeral" trim="figures">
          {opener.numeral}
        </Text>
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
      {first ? null : <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginBottom: tokens.space[6] }} />}
      {opener.lit ? (
        <View
          style={{
            borderRadius: tokens.radius.lg,
            borderWidth: LIT_EDGE,
            borderColor: plain ? c.line : hexAlpha(tokens.atmosphere.tone.amber, EDGE_ALPHA),
            paddingHorizontal: LIT_PAD_X,
            paddingVertical: tokens.space[5] - LIT_EDGE,
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
