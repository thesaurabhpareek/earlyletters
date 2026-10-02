import { CheckIcon } from 'phosphor-react-native';
import { Modal, Pressable, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import type { ReadingSize } from '@/components/child/child-store';

export const READING_SIZES: ReadingSize[] = ['standard', 'large', 'largePrint'];

interface Props {
  visible: boolean;
  value: ReadingSize;
  onChange: (v: ReadingSize) => void;
  onClose: () => void;
}

/** Reading Size (DESIGN_LANGUAGE 12, Letter reading view): Standard, Large, Large print. */
export function ReadingSizeSheet({ visible, value, onChange, onClose }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose} accessibilityRole="button" accessibilityLabel={copy.common.closeButton} />
      <View className="rounded-t-[28px] bg-card px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
        <Text role="heading" className="mb-2 text-lg font-semibold text-foreground">
          {copy.reader.readingSizeTitle}
        </Text>
        <View accessibilityRole="radiogroup">
          {READING_SIZES.map((size) => {
            const selected = size === value;
            return (
              <Pressable
                key={size}
                onPress={() => {
                  haptic('tap');
                  onChange(size);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className="min-h-14 flex-row items-center justify-between border-b border-border py-3">
                <Text className="font-serif text-foreground" style={{ fontSize: 18 * tokens.readingScale[size] }}>
                  {copy.reader.sizes[size]}
                </Text>
                {selected && <CheckIcon size={20} color={c.accent} weight="bold" />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
