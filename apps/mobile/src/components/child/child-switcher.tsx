// android: same (RN Modal renders as a bottom panel on both platforms)
import { router } from 'expo-router';
import { CaretDownIcon, CheckIcon, PlusIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { SheetScrim } from '@/components/ui/sheet-scrim';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useChildren } from './use-children';

/** "For Asha" with a chevron atop the Book (PRD B F2.2). A second child's book is 3 taps away or fewer. */
export function ChildSwitcher() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { children, active, select } = useChildren();
  const [open, setOpen] = useState(false);
  const s = copy.children.switcher;
  if (!active) return null;

  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={fill(s.label, { child: active.name })}
        accessibilityHint={s.hint}
        hitSlop={8}
        className="min-h-11 flex-row items-center gap-1 self-start">
        <Text maxFontSizeMultiplier={1.5} className="text-xs font-medium tracking-[1.5px] text-muted-foreground">
          {fill(s.label, { child: active.name }).toUpperCase()}
        </Text>
        <CaretDownIcon size={14} color={c.textMuted} weight="bold" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close} accessibilityViewIsModal>
        <SheetScrim onPress={close} label={copy.common.closeButton} />
        <View className="max-h-[70%] rounded-t-[28px] bg-card px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
          <Text role="heading" className="mb-2 font-serif text-2xl text-foreground">
            {s.title}
          </Text>
          <ScrollView>
            {children.map((ch) => {
              const selected = ch.id === active.id;
              return (
                <Pressable
                  key={ch.id}
                  onPress={() => {
                    haptic('tap');
                    select(ch.id);
                    close();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="min-h-14 flex-row items-center justify-between border-b border-border py-3">
                  <Text className="flex-1 text-lg text-foreground">{fill(copy.book.title, { child: ch.name })}</Text>
                  {selected && <CheckIcon size={20} color={c.accent} weight="bold" />}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                close();
                router.push('/settings/children/new');
              }}
              accessibilityRole="button"
              className="min-h-14 flex-row items-center gap-2 py-3">
              <PlusIcon size={20} color={c.accent} weight="bold" />
              <Text className="text-lg font-medium text-primary">{s.addButton}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
