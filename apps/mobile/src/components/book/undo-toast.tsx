import { AccessibilityInfo, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { useMotion } from '@/lib/motion';

interface Props {
  message: string;
  onUndo: () => void;
}

/** COMPONENTS.md 2.14: quiet confirmation with a 44pt Undo, announced to VoiceOver. */
export function UndoToast({ message, onUndo }: Props) {
  const insets = useSafeAreaInsets();
  const { enter } = useMotion();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${message} ${copy.common.undoButton}.`);
  }, [message]);
  return (
    <Animated.View entering={enter(0)} className="absolute inset-x-4" style={{ bottom: insets.bottom + 16 }} accessibilityLiveRegion="polite">
      <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-foreground py-2 pl-5 pr-2">
        <Text className="flex-1 text-base text-background">{message}</Text>
        <Button size="sm" variant="secondary" onPress={onUndo} accessibilityLabel={copy.common.undoButton}>
          <Text>{copy.common.undoButton}</Text>
        </Button>
      </View>
    </Animated.View>
  );
}
