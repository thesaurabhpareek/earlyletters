// web: apps/web/components/book/letter-card.tsx (not yet) | android: same
import { LockSimpleIcon, PlayIcon } from 'phosphor-react-native';
import { Pressable, View, useColorScheme } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import type { useMotion } from '@/lib/motion';
import type { Child, Entry } from '@/lib/store';
import { authorOf } from '@/components/child/child-store';
import { shortDateline } from './chapters';

interface Props {
  entry: Entry;
  child: Child;
  /** Entering animation from useMotion().enter(i); undefined after the first 6 cards. */
  entering?: ReturnType<ReturnType<typeof useMotion>['enter']>;
  reduced: boolean;
  onPress: (id: string) => void;
}

const S = tokens.motion.standard;
const LAYOUT = LinearTransition.springify().stiffness(S.stiffness).damping(S.damping).mass(S.mass);

/** COMPONENTS.md 2.5: dateline, two-line serif excerpt, signature, private label, play placeholder. */
export function LetterCard({ entry, child, entering, reduced, onPress }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const signsAs = authorOf(entry, child);
  const signature = fill(copy.book.signature, { signsAs });
  const date = shortDateline(child, entry.occurredOn);
  const spoken = entry.captureMode !== 'typed';
  const excerpt = entry.finalText.replace(/\s+/g, ' ').trim();

  const label = [signature, date.toLowerCase(), excerpt, entry.inBook ? null : copy.book.privateLabel, spoken ? copy.book.recordingOnPhone : null]
    .filter(Boolean)
    .join('. ');

  return (
    <Animated.View entering={entering} layout={reduced ? undefined : LAYOUT} className="px-5 pb-3">
      <Pressable
        onPress={() => onPress(entry.id)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={copy.reader.openHint}
        className="gap-3 rounded-[14px] border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90">
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text maxFontSizeMultiplier={1.5} className="flex-shrink text-xs font-medium tracking-[0.6px] text-muted-foreground">
            {date}
          </Text>
          {!entry.inBook && (
            <View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <LockSimpleIcon size={12} color={c.textMuted} weight="bold" />
              <Text maxFontSizeMultiplier={1.5} className="text-xs font-medium text-muted-foreground">
                {copy.book.privateLabel}
              </Text>
            </View>
          )}
        </View>

        <Text numberOfLines={2} maxFontSizeMultiplier={2} className="font-serif text-lg leading-7 text-foreground">
          {excerpt}
        </Text>

        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text maxFontSizeMultiplier={1.5} className="text-sm font-medium text-muted-foreground">
            {signature}
          </Text>
          {spoken && (
            // Placeholder until playback lands: a visual cue inside the card, not its own control.
            <View className="flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
              <PlayIcon size={14} color={c.accent} weight="fill" />
              <Text maxFontSizeMultiplier={1.5} className="text-sm font-medium text-primary">
                {fill(copy.book.hearShort, { signsAs })}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
