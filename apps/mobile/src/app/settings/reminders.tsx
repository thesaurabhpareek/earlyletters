import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { ListSection, ToggleRow } from '@/components/ui/list-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { noteAskShown } from '@/lib/analytics/ask';
import { track } from '@/lib/analytics/track';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import {
  clampReminderTime,
  disableReminders,
  enableReminders,
  formatReminderTime,
  getReminderPermission,
  needsPriming,
  readPrefs,
  reminderCopy,
  ReminderPrimingSheet,
  writePrefs,
  type Cadence,
  type ReminderPermission,
  type ReminderPrefs,
} from '@/lib/reminders';
import { subscribe } from '@/lib/store';
import { cn } from '@/lib/utils';

type OnCadence = Exclude<Cadence, 'off'>;

/**
 * Reminders (PRD C F1, C-REQ-001 to -003, -007, -009, -011). Local
 * notifications only. The OS permission is asked only when the switch is
 * turned on here (or from the priming card after the first letter), and the
 * first time only after the priming sheet; if the OS says no, the choice is
 * kept and this screen offers Open Settings.
 */
export default function Reminders() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const r = copy.settings.reminders;
  const s = reminderCopy.settings;
  const [prefs, setPrefs] = useState<ReminderPrefs>(readPrefs);
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [busy, setBusy] = useState(false);
  const [lateNote, setLateNote] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [priming, setPriming] = useState(false);

  useEffect(() => subscribe(() => setPrefs(readPrefs())), []);
  useEffect(() => {
    let alive = true;
    const refresh = () => void getReminderPermission().then((p) => alive && setPermission(p));
    refresh();
    // Coming back from iOS Settings: show the new state at once.
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const update = (patch: Partial<ReminderPrefs>) => {
    writePrefs(patch);
    setPrefs(readPrefs());
  };

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (on && (await needsPriming())) {
        // iOS has never asked: the priming sheet comes first, and its one button opens the alert.
        setPriming(true);
        track('reminder_prime_shown', { source: 'settings' });
        noteAskShown();
        return;
      }
      if (on) setPermission(await enableReminders());
      else await disableReminders();
    } finally {
      setPrefs(readPrefs());
      setBusy(false);
    }
  };

  const continueFromPriming = async () => {
    setPriming(false);
    setBusy(true);
    track('reminder_prime_result', { choice: 'yes' });
    try {
      // The priming sheet shows only while iOS has never asked, so this is the OS alert's answer.
      const answer = await enableReminders();
      track('os_permission_result', { granted: answer === 'granted', platform: Platform.OS === 'android' ? 'android' : 'ios' });
      setPermission(answer);
    } finally {
      setPrefs(readPrefs());
      setBusy(false);
    }
  };

  const cadenceOptions: { value: OnCadence; label: string }[] = [
    { value: 'weekly', label: r.weeklyLabel },
    { value: 'fewTimes', label: r.fewTimesLabel },
    { value: 'everyEvening', label: r.everyEveningLabel },
  ];
  const cadence: OnCadence = prefs.cadence === 'off' ? 'fewTimes' : prefs.cadence;

  const pickTime = (d: Date) => {
    const { time, clamped } = clampReminderTime({ hour: d.getHours(), minute: d.getMinutes() });
    setLateNote(clamped);
    update({ time });
  };
  const today = (hour: number, minute: number) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const toggleDay = (day: number) => {
    haptic('tap');
    if (cadence === 'weekly') return update({ weeklyDay: day });
    const has = prefs.days.includes(day);
    if (has && prefs.days.length === 1) return; // at least one evening
    update({ days: has ? prefs.days.filter((d) => d !== day) : [...prefs.days, day] });
  };
  const selectedDays = cadence === 'weekly' ? [prefs.weeklyDay] : cadence === 'everyEvening' ? [0, 1, 2, 3, 4, 5, 6] : prefs.days;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection footer={r.help}>
        <ToggleRow title={s.enabledLabel} value={prefs.enabled} disabled={busy} onValueChange={(v) => void toggle(v)} />
      </ListSection>

      {prefs.enabled && permission === 'denied' && (
        <View accessible={false} className="gap-3 rounded-[14px] bg-secondary p-4">
          <Text role="heading" className="text-base font-medium text-foreground">
            {s.deniedTitle}
          </Text>
          <Text className="text-sm leading-5 text-foreground">{s.deniedBody}</Text>
          <Button variant="outline" size="sm" className="self-start" onPress={() => void Linking.openSettings()}>
            <Text>{s.openSettingsButton}</Text>
          </Button>
        </View>
      )}

      {prefs.enabled && (
        <>
          <ListSection title={s.howOftenTitle}>
            <ChoiceGroup label={s.howOftenTitle} layout="list" options={cadenceOptions} value={cadence} onChange={(v) => update({ cadence: v })} />
          </ListSection>

          {cadence !== 'everyEvening' && (
            <ListSection title={s.eveningsTitle} footer={cadence === 'weekly' ? s.eveningHelp : s.eveningsHelp}>
              <View
                accessibilityRole={cadence === 'weekly' ? 'radiogroup' : undefined}
                className="flex-row flex-wrap gap-2 px-3 py-3">
                {reminderCopy.weekdaysShort.map((label, day) => {
                  const on = selectedDays.includes(day);
                  return (
                    <Pressable
                      key={label}
                      onPress={() => toggleDay(day)}
                      accessibilityRole={cadence === 'weekly' ? 'radio' : 'checkbox'}
                      accessibilityState={cadence === 'weekly' ? { selected: on } : { checked: on }}
                      accessibilityLabel={reminderCopy.weekdays[day]}
                      className={cn(
                        'min-h-11 min-w-11 items-center justify-center rounded-full border px-3',
                        on ? 'border-primary bg-primary' : 'border-border bg-background active:bg-secondary',
                      )}>
                      <Text maxFontSizeMultiplier={1.6} className={cn('text-base', on ? 'font-medium text-primary-foreground' : 'text-foreground')}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ListSection>
          )}

          <ListSection title={s.timeTitle} footer={s.quietHelp}>
            <View className="min-h-12 flex-row items-center gap-3 px-4 py-2">
              <Text className="flex-1 text-base text-foreground">{r.timeLabel}</Text>
              {Platform.OS === 'ios' || pickerOpen ? (
                <DateTimePicker
                  value={today(prefs.time.hour, prefs.time.minute)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  minuteInterval={15}
                  minimumDate={today(7, 0)}
                  maximumDate={today(21, 30)}
                  accentColor={c.accent}
                  accessibilityLabel={`${r.timeLabel}, ${formatReminderTime(prefs.time)}`}
                  onChange={(_, d) => {
                    if (Platform.OS !== 'ios') setPickerOpen(false);
                    if (d) pickTime(d);
                  }}
                />
              ) : (
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.timeLabel}, ${formatReminderTime(prefs.time)}`}
                  className="min-h-11 justify-center px-2">
                  <Text className="text-base text-primary">{formatReminderTime(prefs.time)}</Text>
                </Pressable>
              )}
            </View>
            {lateNote && (
              <Text variant="footnote" accessibilityLiveRegion="polite" className="px-4 py-3">
                {s.lateNightClamp}
              </Text>
            )}
          </ListSection>

          <ListSection>
            <ToggleRow title={s.monthNotesLabel} description={s.monthNotesHelp} value={prefs.monthNotes} onValueChange={(v) => update({ monthNotes: v })} />
            <ToggleRow
              title={copy.settings.privacy.lockScreenLabel}
              description={prefs.namesOnLockScreen ? s.namesHelpOn : s.namesHelpOff}
              value={prefs.namesOnLockScreen}
              onValueChange={(v) => {
                update({ namesOnLockScreen: v });
                track('settings_changed', { key: 'lock_screen_names' });
              }}
            />
          </ListSection>

          <ListSection footer={prefs.paused ? s.pausedHelp : undefined}>
            <ToggleRow title={r.pauseLabel} value={prefs.paused} onValueChange={(v) => update({ paused: v })} />
          </ListSection>
        </>
      )}

      <ReminderPrimingSheet visible={priming} onContinue={() => void continueFromPriming()} />
    </ScrollView>
  );
}
