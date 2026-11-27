// web: same (react-native-svg web) | android: same
/**
 * The Book's cover band (book-page.md 2 "Cover band", BL-675): the page's one lit object. The title in `display`,
 * the age in plain words ("18 months", or "Before You" while expecting), and Read together as a full-width 48 pt
 * button with its icon. With several books the switcher ("For Asha") sits above the title.
 *
 * The header bar in one fixed order (NS-22, BL-938; docs/design/specs/NS-22-BOOK-HEADER-DELTA-27nov.md): title, age,
 * switcher, Read together, the lens choice (passed in as `lens`, drawn under the band), Go to a month, More for this
 * book. There is no gear (NS-22-R3, R6): Settings is Me. The trailing controls are drawn over the title row, but they
 * come after the lens choice in the tree, so VoiceOver meets them in the fixed order. Find (BL-1558) goes before Go to
 * a month when it lands. At accessibility sizes the band stacks in that same order, and the trailing controls wrap
 * on one row under the lens choice; every control is 44 pt or more (NS-22-R2).
 *
 * The lamp's light moved here from build 1's lit month card: a radius.lg band with a 1 pt edge in the lamp's amber at
 * 40 percent and a still radial of gold inside at the scheme's peak times LIT_BAND_STRENGTH, 0.35 (the reading colours hold 4.5:1 at the
 * full peak, tokens.atmosphere; test/book-page.test.ts checks textMuted on it). Increase Contrast and Reduce
 * Transparency: a plain 1 pt `line` edge and no light. Nothing moves.
 *
 * Haptics: none (navigation is silent, MOTION 6).
 */
import { BookOpenTextIcon } from 'phosphor-react-native/src/icons/BookOpenText';
import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree';
import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { tokens } from '@scribe/design-tokens';
import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { LIT_BAND_STRENGTH, LIT_EDGE_ALPHA } from './book-page.logic';
import { CARD_TEXT_INSET } from './letter-card';

/** The band's edge, inside its box (RN draws the border inside, so the padding gives it back). */
const LIT_EDGE = 1;
/** The Book's gutter (BookRow, the month headings: px-5). */
const GUTTER = tokens.space[5];
/** The band's side padding: its words line up with a letter card's (20 + 1 + 15 = 36 pt from the screen edge). */
export const LIT_PAD_X = CARD_TEXT_INSET - GUTTER - LIT_EDGE;
const PAD_Y = tokens.space[4] - LIT_EDGE;

const hexAlpha = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()}`;

export interface CoverBandProps {
  title: string;
  /** "18 months", "1 month", "3 weeks" or "Before You". Null without a birthday or due date to say it from. */
  age: string | null;
  /** The book switcher, only when there are several books. */
  switcher?: ReactNode;
  /** Read together, only when the book has letters it can read. */
  readTogether?: { label: string; hint: string; onPress: () => void } | null;
  /** The lens choice, only while a lens other than Months exists. Drawn under the band, before the trailing controls in the tree. */
  lens?: ReactNode;
  /** Go to a month, only when there is more than one month to go to. */
  months?: { label: string; hint: string; onPress: () => void } | null;
  /** More for this book (NS-22-R3): Quiet and Hide. The hint only when the menu holds Hide. */
  more: { label: string; hint?: string; onPress: () => void };
}

export function CoverBand({ title, age, switcher, readTogether, lens, months, more }: CoverBandProps) {
  const { c, scheme, highContrast, reduceTransparency } = useTheme();
  const plain = highContrast || reduceTransparency;
  const stacked = useIsAccessibilitySize();
  const [switcherH, setSwitcherH] = useState(0);
  const [trailW, setTrailW] = useState(0);

  const titleText = (
    <Text variant="display" asHeading={1} style={stacked ? undefined : { marginRight: trailW }} testID="book.title">
      {title}
    </Text>
  );
  const ageText = age ? (
    <Text variant="callout" testID="book.age">
      {age}
    </Text>
  ) : null;
  const read = readTogether ? (
    <Button
      variant="secondary"
      size="md"
      fullWidth
      icon={BookOpenTextIcon}
      label={readTogether.label}
      accessibilityHint={readTogether.hint}
      onPress={readTogether.onPress}
      className="mt-3"
      testID="book.readTogether"
    />
  ) : null;
  const trailing = (
    <>
      {months ? <Button variant="quiet" size="sm" label={months.label} accessibilityHint={months.hint} onPress={months.onPress} testID="book.months" /> : null}
      <IconButton icon={DotsThreeIcon} label={more.label} accessibilityHint={more.hint} onPress={more.onPress} testID="book.more" />
    </>
  );

  return (
    <View testID="book.header">
      <View
        style={{
          borderRadius: tokens.radius.lg,
          borderWidth: LIT_EDGE,
          borderColor: plain ? c.line : hexAlpha(tokens.atmosphere.tone.amber, LIT_EDGE_ALPHA),
          paddingHorizontal: LIT_PAD_X,
          paddingVertical: PAD_Y,
          overflow: 'hidden',
        }}
        testID="book.cover">
        {plain ? null : <LitGlow strength={tokens.atmosphere.peak[scheme].gold * LIT_BAND_STRENGTH} />}
        {stacked ? (
          // AX sizes: one column, in VoiceOver's order; every label wraps and nothing truncates.
          <View className="gap-1">
            {titleText}
            {ageText}
            {switcher ? <View className="pt-2">{switcher}</View> : null}
            {read}
          </View>
        ) : (
          <>
            <View style={{ paddingTop: switcher ? switcherH : 0, minHeight: tokens.target.min }} className="justify-center gap-0.5">
              {titleText}
              {ageText}
            </View>
            {switcher ? (
              <View style={{ position: 'absolute', top: PAD_Y, left: LIT_PAD_X, right: LIT_PAD_X }} onLayout={(e) => setSwitcherH(e.nativeEvent.layout.height)}>
                {switcher}
              </View>
            ) : null}
            {read}
          </>
        )}
      </View>
      {lens}
      {stacked ? (
        <View className="flex-row flex-wrap items-center justify-end gap-2 pt-2" testID="book.trailing">
          {trailing}
        </View>
      ) : (
        // Over the band's title row, from outside the band (its edge and padding added back), so it follows the lens in the tree.
        <View
          style={{ position: 'absolute', top: LIT_EDGE + PAD_Y + (switcher ? switcherH : 0), right: LIT_EDGE + LIT_PAD_X - tokens.space[2] }}
          className="flex-row items-center"
          onLayout={(e) => setTrailW(e.nativeEvent.layout.width)}
          testID="book.trailing">
          {trailing}
        </View>
      )}
    </View>
  );
}

/** A still radial of gold inside the band: drawn once, never animated, decorative. */
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
