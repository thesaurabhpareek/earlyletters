/**
 * QuietDayRow (COMPONENTS 2.5c, D-084): a quiet day on the Book list. A small row, not a card:
 * the date and "A quiet day", muted sans, unsigned, no Private chip. It is not a button into a
 * letter page. Long-press (or the VoiceOver action) offers "Remove this mark"; the screen shows
 * the Undo toast. Minimum height 44 pt; type scales with Dynamic Type.
 */
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { layoutSpring, type Motion } from '@/lib/motion';
import type { Child, Entry } from '@/lib/store';
import { shortDateline } from './chapters';

interface Props {
  entry: Entry;
  child: Child;
  entering?: ReturnType<Motion['enter']>;
  reduced: boolean;
  onRemove: (id: string) => void;
}

const LAYOUT = layoutSpring('standard');

export function QuietDayRow({ entry, child, entering, reduced, onRemove }: Props) {
  const { c } = useTheme();
  const q = copy.book.quietDay;
  const date = shortDateline(child, entry.occurredOn);
  return (
    <Animated.View entering={entering} layout={reduced ? undefined : LAYOUT} className="px-5 pb-1">
      <Pressable
        onLongPress={() => onRemove(entry.id)}
        delayLongPress={450}
        accessible
        accessibilityRole="text"
        accessibilityLabel={fill(q.a11y, { date })}
        accessibilityActions={[{ name: 'remove', label: q.remove }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'remove') onRemove(entry.id);
        }}
        className="min-h-11 flex-row items-center gap-2.5 rounded-md px-4 py-2 active:bg-secondary">
        <MoonIcon size={16} color={c.textMuted} weight="regular" />
        <View className="flex-1 flex-row flex-wrap items-center gap-x-2">
          <Text variant="footnote" tone="muted" caps>
            {date}
          </Text>
          <Text variant="footnote" tone="muted">
            {q.label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
