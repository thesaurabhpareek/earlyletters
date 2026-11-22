// web: same | android: same
/**
 * MonthOpener (EXPERIENCE_PASS S26; book-page.md 2 "Months as chapters"): a chapter of the Book opens with a
 * typographic heading, not a box. Top to bottom: the kicker "THIS MONTH" for the current month only, the month in
 * words in `title1` ("18 months", "The first weeks", "Before You"), and its dates muted. A hairline sits above every
 * heading but the first.
 *
 * Build 1 boxed and lit the current month, so with one letter the frame outweighed the letter, and the current
 * month's numeral stood alone under "This month" (a bare "18"). The light now belongs to the cover band
 * (cover-band.tsx), the count line to the Months sheet, and nothing here is a numeral.
 *
 * One VoiceOver header per month, level 2, so the headings rotor moves by month: "This month, 18 months, October 12
 * to November 11". The parts inside are not reachable on their own. At AX5 every line wraps; nothing truncates.
 * Nothing moves.
 */
import { StyleSheet, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import type { Opener } from './chapters';

export function MonthOpener({ opener, first }: { opener: Opener; first: boolean }) {
  const { c } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="header"
      aria-level={2}
      accessibilityLabel={opener.a11yLabel}
      className="px-5 pb-3 pt-6"
      testID={opener.current ? 'book.opener.current' : 'book.opener'}>
      {first ? null : <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginBottom: tokens.space[6] }} />}
      <View className="gap-1">
        {opener.kicker ? (
          <Text variant="letterDateline" caps>
            {opener.kicker}
          </Text>
        ) : null}
        <Text variant="title1">{opener.heading}</Text>
        {opener.range ? (
          <Text variant="letterDateline" tone="muted">
            {opener.range}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
