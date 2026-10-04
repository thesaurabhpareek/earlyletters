// android: same (RN Modal renders as a bottom panel on both platforms; no 3-button limit)
import { CheckIcon } from 'phosphor-react-native';
import { Modal, Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { SheetScrim } from '@/components/ui/sheet-scrim';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/motion';
import type { Child } from '@/lib/store';

interface Props {
  visible: boolean;
  books: Child[];
  selectedId: string;
  onSelect: (childId: string) => void;
  onClose: () => void;
}

/**
 * "Whose book?" for Review's "To {child}" (PRD-REQ-012, TDD 01 3.12, TDD 09
 * A11Y-F12). Replaces the Alert.alert picker, which Android caps at three
 * buttons. Any number of books; changing it only moves the draft.
 */
export function WhoseBookSheet({ visible, books, selectedId, onSelect, onClose }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'fade' : 'slide'} onRequestClose={onClose} accessibilityViewIsModal>
      <SheetScrim onPress={onClose} label={copy.common.closeButton} />
      <View className="max-h-[70%] rounded-t-[28px] bg-card px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
        <Text role="heading" className="mb-2 font-serif text-2xl text-foreground">
          {copy.children.switcher.title}
        </Text>
        <ScrollView accessibilityRole="radiogroup">
          {books.map((ch) => {
            const selected = ch.id === selectedId;
            return (
              <Pressable
                key={ch.id}
                onPress={() => {
                  haptic('tap');
                  onSelect(ch.id);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                className="min-h-14 flex-row items-center justify-between border-b border-border py-3">
                <Text className="flex-1 text-lg text-foreground">{fill(copy.book.title, { child: ch.name })}</Text>
                {selected && <CheckIcon size={20} color={c.accent} weight="bold" />}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable onPress={onClose} accessibilityRole="button" className="mt-2 min-h-12 items-center justify-center">
          <Text className="text-lg text-primary">{copy.common.cancelButton}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
