/**
 * One date control for a birthday or a due date (first run, Add a child, child settings).
 *
 * It never invents a value: `value` null shows "Choose a date" until the person picks one,
 * so a baby who is seven months old is never saved as "0 days" by a default nobody saw.
 * Values are ISO calendar days (YYYY-MM-DD); the range check itself lives in
 * packages/core (checkBirthday, checkDueDate), so the hint under the control and the
 * save button agree. `min` and `max` only steer the picker.
 *
 * ios: before a day is chosen, "Choose a date" opens one sheet with the inline calendar and Done (one tap to the
 * calendar, and Done saves the day shown, today included: a tap on the day that is already selected sends no change).
 * After that, the compact picker shows the day and opens Apple's own calendar in one tap. Calendar taps in the sheet
 * stay in this control until Done, so the screen behind does not re-render on every tap. The sheet takes no pan
 * gesture (dismissible={false}), so swiping between months never drags the sheet. The keyboard is put away before
 * either calendar opens, so the screen does not shift under it. themeVariant follows the app's own Light or Dark
 * choice, not only the phone's. android: system dialog; web preview: a native date input.
 *
 * `ref.focus()` moves focus to the control (EXPERIENCE_PASS S05: when someone taps a Continue that is waiting for
 * the date, focus goes to the empty field): VoiceOver focus on a phone, keyboard focus on the web preview's input.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import * as React from 'react';
import { AccessibilityInfo, Keyboard, Platform, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { isoOf, longDate } from '@/lib/dates';
import { clampISO, dateOf } from './date-field.logic';

/** What a screen can ask of the date control. */
export type DateFieldHandle = { focus: () => void };

export type DateFieldProps = {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  /** Where the picker opens when nothing is chosen yet. */
  startISO: string;
  min?: string;
  max?: string;
  chooseLabel: string;
};

export const DateField = React.forwardRef<DateFieldHandle, DateFieldProps>(function DateField({ label, value, onChange, startISO, min, max, chooseLabel }, ref) {
  const { c, scheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  // The day the open sheet shows; it reaches the screen only on Done.
  const [pending, setPending] = React.useState(startISO);
  const control = React.useRef<View>(null);
  const input = React.useRef<{ focus?: () => void } | null>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (Platform.OS === 'web') {
          input.current?.focus?.();
          return;
        }
        const node = control.current;
        if (!node) return;
        try {
          AccessibilityInfo.sendAccessibilityEvent(node as unknown as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0], 'focus');
        } catch {}
      },
    }),
    [],
  );

  if (Platform.OS === 'web') {
    // Web preview and the recorded flows: the community picker draws nothing on web.
    return React.createElement('input', {
      ref: input,
      type: 'date',
      'aria-label': label,
      value: value ?? '',
      min,
      max,
      onChange: (e: { target: { value: string } }) => {
        if (e.target.value) onChange(e.target.value);
      },
      // A 1 pt controlBorder edge (3:1, WCAG 1.4.11), as every other field: on lit paper a bare surface box disappears.
      style: { minHeight: 44, padding: '8px 12px', borderRadius: 12, border: `1px solid ${c.controlBorder}`, background: c.surface, color: c.text, fontSize: 17, fontFamily: 'inherit' },
    });
  }

  const start = clampISO(value ?? startISO, min, max);
  const minimumDate = min ? dateOf(min) : undefined;
  const maximumDate = max ? dateOf(max) : undefined;

  if (Platform.OS === 'ios') {
    const openSheet = () => {
      Keyboard.dismiss();
      setPending(start);
      setOpen(true);
    };
    return (
      <View ref={control} className="items-end">
        {value === null ? (
          <Button variant="secondary" size="sm" label={chooseLabel} accessibilityLabel={`${label}. ${chooseLabel}`} onPress={openSheet} />
        ) : (
          // onTouchStart: the compact picker opens natively, so the keyboard is put away on the touch itself.
          <View onTouchStart={() => Keyboard.dismiss()}>
            <DateTimePicker
              value={dateOf(start)}
              mode="date"
              display="compact"
              themeVariant={scheme}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={c.accent}
              accessibilityLabel={label}
              onChange={(e, d) => {
                if (e.type === 'dismissed' || !d) return;
                onChange(isoOf(d));
              }}
            />
          </View>
        )}
        <Sheet open={open} onClose={() => setOpen(false)} title={label} dismissible={false} hideClose>
          <View className="gap-4 pb-2">
            <DateTimePicker
              value={dateOf(pending)}
              mode="date"
              display="inline"
              themeVariant={scheme}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={c.accent}
              accessibilityLabel={label}
              onChange={(e, d) => {
                if (e.type === 'dismissed' || !d) return;
                setPending(isoOf(d));
              }}
            />
            <Button
              size="lg"
              label={copy.common.doneButton}
              onPress={() => {
                onChange(pending);
                setOpen(false);
              }}
            />
            <Button variant="quiet" size="lg" label={copy.common.cancelButton} onPress={() => setOpen(false)} />
          </View>
        </Sheet>
      </View>
    );
  }

  // Android: the system dialog, opened from a button.
  return (
    <View ref={control} className="items-end">
      <Button variant="secondary" size="sm" label={value ? longDate(value) : chooseLabel} accessibilityLabel={`${label}. ${value ? longDate(value) : chooseLabel}`} onPress={() => setOpen(true)} />
      {open ? (
        <DateTimePicker
          value={dateOf(start)}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={c.accent}
          accessibilityLabel={label}
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'dismissed' || !d) return;
            onChange(isoOf(d));
          }}
        />
      ) : null}
    </View>
  );
});
