/**
 * One date control for a birthday or a due date (first run, Add a child, child settings).
 *
 * It never invents a value: `value` null shows "Choose a date" until the person picks one,
 * so a baby who is seven months old is never saved as "0 days" by a default nobody saw.
 * Values are ISO calendar days (YYYY-MM-DD); the range check itself lives in
 * packages/core (checkBirthday, checkDueDate), so the hint under the control and the
 * save button agree. `min` and `max` only steer the picker.
 *
 * ios: compact picker; android: system dialog; web preview: a native date input.
 *
 * `ref.focus()` moves focus to the control (EXPERIENCE_PASS S05: when someone taps a Continue that is waiting for
 * the date, focus goes to the empty field): VoiceOver focus on a phone, keyboard focus on the web preview's input.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import * as React from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/a11y';
import { isoOf, longDate } from '@/lib/dates';

/** What a screen can ask of the date control. */
export type DateFieldHandle = { focus: () => void };

function dateOf(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

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
  const { c } = useTheme();
  const [open, setOpen] = React.useState(false);
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

  const showPicker = Platform.OS === 'ios' ? value !== null || open : open;
  return (
    <View ref={control} className="items-end">
      {value === null && !open ? (
        <Button variant="secondary" size="sm" label={chooseLabel} accessibilityLabel={`${label}. ${chooseLabel}`} onPress={() => setOpen(true)} />
      ) : Platform.OS !== 'ios' ? (
        <Button variant="secondary" size="sm" label={value ? longDate(value) : chooseLabel} accessibilityLabel={`${label}. ${value ? longDate(value) : chooseLabel}`} onPress={() => setOpen(true)} />
      ) : null}
      {showPicker ? (
        <DateTimePicker
          value={dateOf(value ?? startISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          minimumDate={min ? dateOf(min) : undefined}
          maximumDate={max ? dateOf(max) : undefined}
          accentColor={c.accent}
          accessibilityLabel={label}
          onChange={(e, d) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (e.type === 'dismissed' || !d) return;
            onChange(isoOf(d));
          }}
        />
      ) : null}
    </View>
  );
});
