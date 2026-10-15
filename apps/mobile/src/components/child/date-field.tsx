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
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/a11y';
import { isoOf, longDate } from '@/lib/dates';

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

export function DateField({ label, value, onChange, startISO, min, max, chooseLabel }: DateFieldProps) {
  const { c } = useTheme();
  const [open, setOpen] = React.useState(false);

  if (Platform.OS === 'web') {
    // Web preview and the recorded flows: the community picker draws nothing on web.
    return React.createElement('input', {
      type: 'date',
      'aria-label': label,
      value: value ?? '',
      min,
      max,
      onChange: (e: { target: { value: string } }) => {
        if (e.target.value) onChange(e.target.value);
      },
      style: { minHeight: 44, padding: '8px 12px', borderRadius: 12, border: '1px solid transparent', background: c.surface, color: c.text, fontSize: 17, fontFamily: 'inherit' },
    });
  }

  const showPicker = Platform.OS === 'ios' ? value !== null || open : open;
  return (
    <View className="items-end">
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
}
