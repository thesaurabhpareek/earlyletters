// android: same | web preview: same (the OS permission answer is the browser's; nothing is scheduled there)
/**
 * The reminder card after the first letter (C-REQ-001 Rev, F13 6.2 B rows 2 to 5', F13-REQ-023, DR-12 B).
 * Mounted once in the tabs layout, inside its ToastHost (the Book is a tab). Review asks for it through `requestReminderPrime()`
 * when `nextAsk` returns `reminder_prime`, after the Book is on screen; the card is then the first ask.
 *
 * - "Yes, evenings": the default ("A few times a week", 8:30 PM), then the iOS alert (F13 6.2 B row 4a). The card
 *   itself is the pre-alert screen, so the Settings priming sheet is not shown a second time in front of the alert.
 * - "Pick a time": a time picker from 7:00 AM to 9:30 PM in 15-minute steps, then "Set reminder" and the iOS alert (row 4b).
 * - "No reminders": no OS prompt; the card closes with `onboarding.reminder.noneHelp` (row 4c).
 * Every showing counts toward the cap of 2 primes ever (`noteReminderPrimeShown`, next-ask.logic MAX_REMINDER_PRIMES).
 * No close button and no swipe: one of the three answers ends it, and none of them asks anything of the server.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';
import { track } from '@/lib/analytics/track';
import { noteReminderPrimeShown, subscribeReminderPrime, takeReminderPrimeRequest } from '@/lib/asks';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { clampReminderTime, enableReminders, formatReminderTime, readPrefs, writePrefs, type ReminderTime } from '@/lib/reminders';

const at = (t: ReminderTime): Date => {
  const d = new Date();
  d.setHours(t.hour, t.minute, 0, 0);
  return d;
};

export function ReminderPrimeAsk() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const take = () => {
      if (!takeReminderPrimeRequest()) return;
      noteReminderPrimeShown();
      track('reminder_prime_shown', { source: 'first_letter' });
      setOpen(true);
    };
    take();
    return subscribeReminderPrime(take);
  }, []);
  return open ? <ReminderPrimeCard onClose={() => setOpen(false)} /> : null;
}

function ReminderPrimeCard({ onClose }: { onClose: () => void }) {
  const c = useTheme().c;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const r = copy.onboarding.reminder;
  const [picking, setPicking] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [time, setTime] = useState<ReminderTime>(() => readPrefs().time);

  const yes = (chosen?: ReminderTime) => {
    haptic('tap');
    if (chosen) writePrefs({ time: chosen });
    track('reminder_prime_result', { choice: 'yes' });
    onClose();
    void enableReminders().catch(() => {}); // the choice is saved either way; Settings shows a no from iOS
  };
  const none = () => {
    track('reminder_prime_result', { choice: 'not_now' });
    onClose();
    toast.show({ message: r.noneHelp });
  };

  return (
    // onRequestClose is required on Android; the card leaves only through one of its answers.
    <Modal visible transparent animationType="slide" onRequestClose={() => {}} accessibilityViewIsModal>
      <View className="flex-1 bg-black/30" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
      <View className="gap-5 rounded-t-[28px] bg-card px-6 pt-8" style={{ paddingBottom: insets.bottom + 20 }} testID="reminder-prime">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <BellSimpleIcon size={28} color={c.accent} weight="regular" />
        </View>
        <View className="gap-2">
          <Text role="heading" className="font-serif text-2xl leading-8 text-foreground">
            {r.title}
          </Text>
          <Text className="text-base leading-6 text-foreground">{r.body}</Text>
        </View>
        {picking ? (
          <View className="gap-3">
            <View className="min-h-12 flex-row items-center gap-3">
              <Text className="flex-1 text-base text-foreground">{r.timeLabel}</Text>
              {Platform.OS === 'ios' || pickerOpen ? (
                <DateTimePicker
                  value={at(time)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  minuteInterval={15}
                  minimumDate={at({ hour: 7, minute: 0 })}
                  maximumDate={at({ hour: 21, minute: 30 })}
                  accentColor={c.accent}
                  accessibilityLabel={`${r.timeLabel}, ${formatReminderTime(time)}`}
                  onChange={(_, d) => {
                    if (Platform.OS !== 'ios') setPickerOpen(false);
                    if (d) setTime(clampReminderTime({ hour: d.getHours(), minute: d.getMinutes() }).time);
                  }}
                />
              ) : (
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.timeLabel}, ${formatReminderTime(time)}`}
                  className="min-h-11 justify-center px-2">
                  <Text className="text-base text-primary">{formatReminderTime(time)}</Text>
                </Pressable>
              )}
            </View>
            <Button size="lg" label={r.cta} onPress={() => yes(time)} />
          </View>
        ) : (
          <View className="gap-3">
            <Button size="lg" label={r.yesEveningsButton} onPress={() => yes()} />
            <Button size="lg" variant="outline" label={r.pickTimeButton} onPress={() => setPicking(true)} />
          </View>
        )}
        <Button size="lg" variant="quiet" label={r.noneOption} onPress={none} />
      </View>
    </Modal>
  );
}
