import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { Modal, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '../copy';
import { reminderCopy } from './copy';

interface Props {
  visible: boolean;
  /** The one action: open the iOS permission alert (call `enableReminders()`). */
  onContinue: () => void;
}

/**
 * Before the iOS notification alert (C-REQ-001; Apple HIG, Privacy,
 * "pre-alert screens", read 3 Oct 2026): one button, titled Continue, that
 * opens the system alert. No close, no Not now, no "Allow" wording, and no
 * picture of the alert. It appears only after the person has turned
 * reminders on, and only while iOS has never asked (`needsPriming()`).
 */
export function ReminderPrimingSheet({ visible, onContinue }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const r = copy.onboarding.reminder;
  const p = reminderCopy.priming;
  return (
    // onRequestClose is required on Android; the sheet only leaves through its button.
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {}} accessibilityViewIsModal>
      <View className="flex-1 bg-black/30" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
      <View className="gap-5 rounded-t-[28px] bg-card px-6 pt-8" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <BellSimpleIcon size={28} color={c.accent} weight="regular" />
        </View>
        <View className="gap-2">
          <Text role="heading" className="font-serif text-2xl leading-8 text-foreground">
            {r.permissionTitle}
          </Text>
          <Text className="text-base leading-6 text-foreground">{r.permissionBody}</Text>
        </View>
        <View className="gap-3">
          <View className="flex-row gap-3">
            <MoonIcon size={20} color={c.textMuted} />
            <Text className="flex-1 text-sm leading-5 text-muted-foreground">{p.quietLine}</Text>
          </View>
          <View className="flex-row gap-3">
            <LockSimpleIcon size={20} color={c.textMuted} />
            <Text className="flex-1 text-sm leading-5 text-muted-foreground">{p.privacyLine}</Text>
          </View>
        </View>
        <Button size="lg" onPress={onContinue}>
          <Text>{copy.common.continueButton}</Text>
        </Button>
      </View>
    </Modal>
  );
}
