/**
 * One Find result (design 02 section 3, FindResultRow): the letter's date line, then the sentence that holds the match,
 * exactly as kept, with the matched word underlined and in medium weight (never colour alone). Tapping it opens the
 * letter. Read aloud as "{date}. {sentence}. Opens the letter." with no count (NS-02-R11).
 */
import { Text as RNText, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { isRtl } from '@/components/motion/excerpt-fade.logic';
import { copy } from '@/lib/copy';
import type { FindHit } from '@/lib/find/search';
import { segments, rowLabel } from './find.logic';

export function FindResultRow({ hit, dateline, datelineA11y, onPress }: { hit: FindHit; dateline: string; datelineA11y: string; onPress: (id: string) => void }) {
  const parts = segments(hit.excerpt.text, hit.excerpt.marks);
  const rtl = isRtl(hit.excerpt.text);
  return (
    <View className="px-5 pb-3">
      <Card
        radius="md"
        padding={4}
        onPress={() => onPress(hit.id)}
        accessibilityLabel={rowLabel(datelineA11y, hit.excerpt.text)}
        accessibilityHint={copy.reader.openHint}
        className="gap-2.5"
        testID="find.row">
        <Text variant="letterDateline" caps>
          {dateline}
        </Text>
        <Text variant="letterBody" style={rtl ? { writingDirection: 'rtl', textAlign: 'right' } : undefined}>
          {parts.map((p, i) =>
            p.marked ? (
              <RNText key={i} style={{ textDecorationLine: 'underline', fontWeight: '600' }}>
                {p.text}
              </RNText>
            ) : (
              p.text
            ),
          )}
        </Text>
      </Card>
    </View>
  );
}
