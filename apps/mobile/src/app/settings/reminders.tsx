import DateTimePicker from '@react-native-community/datetimepicker';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { NotificationPreview } from '@/components/settings/notification-preview';
import {
  monthRowNote,
  namesRow,
  nextLine,
  previewOf,
  remindersSwitchOn,
  remindersTurnedOnInSettings,
  SAVED_ANNOUNCE_MS,
  savedAnnouncement,
  showNotificationsOff,
  switchFooter,
  turnOnOutcome,
} from '@/components/settings/reminders.logic';
import { Chip, ChipGroup, ChoiceGroup } from '@/components/ui/choice-group';
import { ListSection, ToggleRow } from '@/components/ui/list-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { noteAskShown } from '@/lib/analytics/ask';
import { track } from '@/lib/analytics/track';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import {
  clampReminderTime,
  disableReminders,
  formatReminderTime,
  getReminderPermissionDetail,
  lastScheduleResult,
  nextReminder,
  plannerChildren,
  readPrefs,
  reminderCopy,
  rescheduleReminders,
  subscribeScheduleResult,
  turnOnReminders,
  writePrefs,
  type Cadence,
  type ReminderPermission,
  type ReminderPrefs,
} from '@/lib/reminders';
import { subscribe } from '@/lib/store';
import { announce, useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { useMotion } from '@/lib/motion';

type OnCadence = Exclude<Cadence, 'off'>;

/** App lock is not on develop yet (account-security design 2.10). The lock lane replaces this with its state. */
const APP_LOCK_ON = false;

/**
 * Reminders (PRD C F1, C-REQ-001 to -003, -007, -009, -011; EXPERIENCE_PASS_2026-10 S34; reminders-settings.md as
 * ruled: CDesO-3, CCO-10, CPO-3). Local notifications only.
 *
 * No sheet in front of the iOS alert (CDesO-3): the footer under the switch explains first (CCO-10, LEGAL-REQ-007),
 * and turning the switch on writes `enabled` before iOS asks, so the switch stays on. The choices reveal inline
 * under it: How it will look (the real words of the first planned notification), Next (from the planner), How
 * often, Which evenings, Time, Month and birthday messages, Names in notifications. Changes save as they are made;
 * the page says so once, the Next line cross-fades on every change (none under Reduce Motion), and VoiceOver hears
 * "Saved. Next: ..." 600 ms after the last change. A scheduling failure shows with Try again.
 */
export default function Reminders() {
  const c = useTheme().c;
  const r = copy.settings.reminders;
  const s = reminderCopy.settings;
  const [prefs, setPrefs] = useState<ReminderPrefs>(readPrefs);
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [quiet, setQuiet] = useState(false);
  const [scheduleOk, setScheduleOk] = useState(() => lastScheduleResult().ok);
  const [busy, setBusy] = useState(false);
  const [lateNote, setLateNote] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const toast = useToast();
  const motion = useMotion();
  const ax = useIsAccessibilitySize();
  // The permission last seen, to tell "allowed in iOS Settings just now" from any other read.
  const seen = useRef<ReminderPermission | null>(null);
  // A change made on this page, waiting for its "Saved." announcement.
  const changed = useRef(false);

  useEffect(() => subscribe(() => setPrefs(readPrefs())), []);
  useEffect(() => subscribeScheduleResult((res) => setScheduleOk(res.ok)), []);

  const on = remindersSwitchOn(prefs);
  // Recomputed on every change: prefs, a book's birth date (the store listener renews prefs), the permission.
  const next = useMemo(() => (on ? nextReminder() : null), [prefs, permission, on]); // eslint-disable-line react-hooks/exhaustive-deps
  const line = nextLine({ on, permission, next, formatTime: formatReminderTime });
  const preview = previewOf(next);
  const lineRef = useRef(line);
  lineRef.current = line;

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void getReminderPermissionDetail().then(({ permission: p, quiet: q }) => {
        if (!alive) return;
        if (remindersTurnedOnInSettings(seen.current, p, readPrefs())) {
          // Back from iPhone Settings: the card collapses, the Next line appears, and the toast says both once.
          const nextNow = nextReminder();
          toast.show({ message: turnOnOutcome({ permission: p, scheduled: { ok: true } }, nextLine({ on: true, permission: p, next: nextNow, formatTime: formatReminderTime })).message });
        }
        seen.current = p;
        setPermission(p);
        setQuiet(q);
      });
    refresh();
    // Coming back from iOS Settings: show the new state at once.
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => {
      alive = false;
      sub.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // "Saved. Next: Tuesday at 8:30 PM." once the changes stop for 600 ms. Never a modal; never on arrival.
  useEffect(() => {
    if (!changed.current) return;
    const t = setTimeout(() => {
      changed.current = false;
      announce(savedAnnouncement(lineRef.current));
    }, SAVED_ANNOUNCE_MS);
    return () => clearTimeout(t);
  }, [prefs]);

  const update = (patch: Partial<ReminderPrefs>) => {
    changed.current = true;
    writePrefs(patch);
    setPrefs(readPrefs());
  };

  const toggle = async (v: boolean) => {
    setBusy(true);
    try {
      if (v) {
        // Straight to the iOS alert (CDesO-3). `enabled` is written first, so the switch is already on behind it.
        // VoiceOver focus stays on the switch, which never unmounts; the result is announced, and the denied card
        // is the next element in swipe order.
        const res = await turnOnReminders();
        if (res.asked) {
          noteAskShown();
          track('os_permission_result', { granted: res.permission === 'granted', platform: Platform.OS === 'android' ? 'android' : 'ios' });
        }
        seen.current = res.permission;
        setPermission(res.permission);
        setScheduleOk(res.scheduled.ok);
        const outcome = turnOnOutcome(res, nextLine({ on: true, permission: res.permission, next: nextReminder(), formatTime: formatReminderTime }));
        // "Reminders are on. Next: Tuesday at 8:30 PM.", or "Notifications are off", or the failure line.
        announce(outcome.message);
      } else {
        setScheduleOk((await disableReminders()).ok);
      }
    } finally {
      setPrefs(readPrefs());
      setBusy(false);
    }
  };

  const tryAgain = async () => {
    haptic('tap');
    const res = await rescheduleReminders();
    setScheduleOk(res.ok);
    announce(res.ok ? savedAnnouncement(lineRef.current) : s.scheduleFailed);
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
  const names = namesRow(prefs.namesOnLockScreen, APP_LOCK_ON);
  const monthNote = useMemo(() => monthRowNote(plannerChildren()), [prefs]); // eslint-disable-line react-hooks/exhaustive-deps
  const failed = on && permission === 'granted' && !scheduleOk;
  // The rows below the card move up as it collapses (S34); under Reduce Motion they jump, and the choices only fade in.
  const layout = motion.reduced ? undefined : LinearTransition.duration(tokens.motion.enter.durationMs);

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      {/* The explanation is the footer, on screen before the switch is ever turned on (CCO-10, LEGAL-REQ-007). */}
      <ListSection footer={switchFooter(on)}>
        <ToggleRow title={s.enabledLabel} value={on} disabled={busy} onValueChange={(v) => void toggle(v)} testID="reminders.switch" />
      </ListSection>

      {showNotificationsOff(prefs, permission) && (
        <Animated.View exiting={motion.reduced ? undefined : FadeOut.duration(tokens.motion.exitMs).reduceMotion(ReduceMotion.Never)} accessible={false} className="gap-3 rounded-[14px] bg-secondary p-4" testID="reminders.denied">
          <View className="flex-row items-center gap-2">
            <WarningCircleIcon size={20} color={c.caution} weight="bold" />
            <Text variant="headline" asHeading className="shrink">
              {s.deniedTitle}
            </Text>
          </View>
          <Text variant="subhead">{s.deniedBody}</Text>
          <Button variant="outline" size="sm" className="self-start" label={s.openSettingsButton} onPress={() => void Linking.openSettings()} />
        </Animated.View>
      )}

      {failed && (
        <View className="gap-3 rounded-[14px] bg-secondary p-4" testID="reminders.failed">
          <View className="flex-row items-center gap-2">
            <WarningCircleIcon size={20} color={c.caution} weight="bold" />
            <Text variant="subhead" className="shrink">
              {s.scheduleFailed}
            </Text>
          </View>
          <Button variant="outline" size="sm" className="self-start" label={copy.common.tryAgainButton} onPress={() => void tryAgain()} />
        </View>
      )}

      {on && (
        <Animated.View entering={motion.enter()} layout={layout} className="gap-7">
          <View className="gap-3">
            {preview && (
              <ListSection title={s.previewTitle}>
                <View className="p-3">
                  <NotificationPreview label={s.previewTitle} title={preview.title} body={preview.body} />
                </View>
              </ListSection>
            )}
            {line && (
              <Animated.View key={line} entering={motion.reduced ? undefined : FadeIn.duration(tokens.motion.swapMs)} className="px-4">
                <Text variant="subhead" testID="reminders.next">
                  {line}
                </Text>
              </Animated.View>
            )}
            {quiet && (
              <Text variant="footnote" className="px-4">
                {s.quietDelivery}
              </Text>
            )}
          </View>

          <ListSection title={s.howOftenTitle}>
            <ChoiceGroup label={s.howOftenTitle} layout="list" options={cadenceOptions} value={cadence} onChange={(v) => update({ cadence: v })} />
          </ListSection>

          {cadence !== 'everyEvening' && (
            <ListSection title={s.eveningsTitle}>
              {/* Chip is the one selection pattern: accentSoft + accent edge + check. Chips wrap at AX5. */}
              <ChipGroup label={s.eveningsTitle} className="px-4 py-3">
                {reminderCopy.weekdaysShort.map((label, day) => (
                  <Chip
                    key={label}
                    variant="filter"
                    role={cadence === 'weekly' ? 'radio' : 'checkbox'}
                    label={label}
                    accessibilityLabel={reminderCopy.weekdays[day]}
                    selected={selectedDays.includes(day)}
                    onPress={() => toggleDay(day)}
                  />
                ))}
              </ChipGroup>
            </ListSection>
          )}

          <ListSection title={s.timeTitle} footer={s.quietHelp}>
            {/* AX5: the label and the time stack, so neither truncates. */}
            <View className={ax ? 'min-h-12 gap-2 px-4 py-2' : 'min-h-12 flex-row items-center gap-3 px-4 py-2'}>
              <Text className={ax ? 'text-base text-foreground' : 'flex-1 text-base text-foreground'}>{r.timeLabel}</Text>
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
            <ToggleRow title={s.monthNotesLabel} description={monthNote} value={prefs.monthNotes} onValueChange={(v) => update({ monthNotes: v })} />
            <ToggleRow
              title={copy.settings.privacy.lockScreenLabel}
              description={names.help}
              value={names.value}
              disabled={names.disabled}
              onValueChange={(v) => {
                update({ namesOnLockScreen: v });
                track('settings_changed', { key: 'lock_screen_names' });
              }}
            />
          </ListSection>
        </Animated.View>
      )}
    </ScrollView>
  );
}
