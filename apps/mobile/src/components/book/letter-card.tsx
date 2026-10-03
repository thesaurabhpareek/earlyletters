// web: apps/web/components/book/letter-card.tsx (not yet) | android: same
/**
 * LetterCard (COMPONENTS 2.5): dateline, two-line serif excerpt, signature, private tag,
 * and a quiet "has a recording" line. One VoiceOver element with a composed label; the
 * excerpt truncates visually only.
 * Look: Airbnb listing card (radius md 14, no hard border in light, whole card one tap
 * target, metadata muted below) on paper; press scale 0.98 (Things 3 "objects").
 * The recording line is information, not a control, until playback ships (TDD 09 A11Y-F25),
 * so it has no pill and no accent colour.
 */
import { LockSimpleIcon, MicrophoneIcon } from 'phosphor-react-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { layoutSpring, type Motion } from '@/lib/motion';
import type { Child, Entry } from '@/lib/store';
import { authorOf } from '@/components/child/child-store';
import { datelineA11y, shortDateline } from './chapters';

interface Props {
  entry: Entry;
  child: Child;
  /** Entering animation from useMotion().enter(i); undefined after the first 6 cards. */
  entering?: ReturnType<Motion['enter']>;
  reduced: boolean;
  onPress: (id: string) => void;
}

const LAYOUT = layoutSpring('standard');

function clock(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function LetterCard({ entry, child, entering, reduced, onPress }: Props) {
  const { c } = useTheme();
  const signsAs = authorOf(entry, child);
  const signature = fill(copy.book.signature, { signsAs });
  const date = shortDateline(child, entry.occurredOn);
  const spoken = entry.captureMode !== 'typed';
  const waiting = entry.transcriptStatus === 'waiting';
  const excerpt = waiting ? pendingCopy.book.waitingForWords : entry.finalText.replace(/\s+/g, ' ').trim();

  const label = [signature, datelineA11y(child, entry.occurredOn), excerpt, entry.inBook ? null : copy.book.privateLabel, spoken ? copy.book.recordingOnPhone : null]
    .filter(Boolean)
    .join('. ');

  return (
    <Animated.View entering={entering} layout={reduced ? undefined : LAYOUT} className="px-5 pb-3">
      <Card radius="md" padding={4} onPress={() => onPress(entry.id)} accessibilityLabel={label} accessibilityHint={copy.reader.openHint} className="gap-2.5">
        <Text variant="letterDateline" caps>
          {date}
        </Text>

        <Text numberOfLines={2} variant={waiting ? 'signature' : 'letterBody'} scale={0.9} tone={waiting ? 'muted' : 'default'}>
          {excerpt}
        </Text>

        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
          <Text variant="labelSmall" tone="muted">
            {signature}
          </Text>
          {!entry.inBook && <PrivateChip color={c.text} />}
          <View className="flex-1" />
          {spoken && entry.audioDurationMs ? (
            <View className="flex-row items-center gap-1" accessibilityElementsHidden>
              <MicrophoneIcon size={14} color={c.textMuted} weight="regular" />
              <Text variant="footnote" style={{ fontVariant: ['tabular-nums'] }}>
                {clock(entry.audioDurationMs)}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}

/** "Private" tag: accentSoft fill with full-strength text (12.07:1 light, 11.20:1 dark), lock + word. */
export function PrivateChip({ color }: { color: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5">
      <LockSimpleIcon size={12} color={color} weight="bold" />
      <Text variant="caption" tone="default">
        {copy.book.privateLabel}
      </Text>
    </View>
  );
}
