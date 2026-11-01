// web: later | android: same code
/**
 * The date sheet (F04 6.2 E; F09 6.2 step 6, "Change the date"): "When was this?" with two tabs, A day and A month.
 * A day uses the installed date picker through DateField, from 3 years before the birthday to today. A month lists
 * Before You, The first weeks and Month 1 to this month, oldest first, and files the letter in that month with a
 * month-only dateline. The month tab is hidden for a child not born yet (F04-U37). The rules live in
 * date-change.logic.ts; this file only draws them.
 *
 * Standard parts only: Sheet (@gorhom/bottom-sheet), ChoiceGroup for the tabs and the month rows (radio semantics,
 * stacked at large text), DateField (@react-native-community/datetimepicker), Button. The month rows scroll inside the
 * sheet (BottomSheetScrollView), so at AX5 every row is reachable and no label truncates. Save stays off until the pick
 * differs from the letter's date. Never gated by a plan (F09-REQ-014). VoiceOver hears "When was this?" once, as the
 * sheet title; the tabs ("Day or month") and the picker ("Day") have their own labels.
 */
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { DateField } from '@/components/child/date-field';
import { Button } from '@/components/ui/button';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Sheet } from '@/components/ui/sheet';
import { copy } from '@/lib/copy';
import type { Child, Entry, OccurredPrecision } from '@/lib/store';
import { clampDay, dayBounds, hasMonthTab, initialPick, isUnchanged, monthChoices, resolvePick, type DatePick } from './date-change.logic';

type Tab = 'day' | 'month';

export function DateSheet({
  open,
  child,
  entry,
  todayISO,
  onClose,
  onSave,
}: {
  open: boolean;
  child: Child;
  entry: Pick<Entry, 'occurredOn' | 'occurredPrecision'>;
  todayISO: string;
  onClose: () => void;
  onSave: (next: { occurredOn: string; precision: OccurredPrecision }) => void;
}) {
  const { height } = useWindowDimensions();
  const bounds = dayBounds(child, todayISO);
  const months = monthChoices(child, todayISO);
  const start = initialPick(child, entry);
  const [tab, setTab] = React.useState<Tab>(start.precision);
  const [day, setDay] = React.useState(() => clampDay(start.precision === 'day' ? start.occurredOn : entry.occurredOn, bounds));
  const [monthKey, setMonthKey] = React.useState(() => (start.precision === 'month' ? start.key : (months[months.length - 1]?.key ?? '')));

  // Each opening starts from the letter's own date.
  React.useEffect(() => {
    if (!open) return;
    const p = initialPick(child, entry);
    setTab(p.precision);
    setDay(clampDay(p.precision === 'day' ? p.occurredOn : entry.occurredOn, dayBounds(child, todayISO)));
    const m = monthChoices(child, todayISO);
    setMonthKey(p.precision === 'month' ? p.key : (m[m.length - 1]?.key ?? ''));
    // Only on open: the person's picks stay while the sheet is up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick: DatePick = tab === 'day' ? { precision: 'day', occurredOn: day } : { precision: 'month', key: monthKey };
  const next = resolvePick(child, pick, todayISO);
  const d = copy.review.date;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={d.label}
      testID="letter.dateSheet"
      footer={
        <Button
          size="lg"
          label={copy.common.saveButton}
          disabled={isUnchanged(entry, next)}
          onPress={() => next && onSave(next)}
          testID="letter.dateSheet.save"
        />
      }>
      <View className="gap-4">
        {hasMonthTab(child) ? (
          <ChoiceGroup<Tab>
            label={d.tabsLabel}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'day', label: d.dayTab },
              { value: 'month', label: d.monthTab },
            ]}
            testID="letter.dateSheet.tab"
          />
        ) : null}
        {tab === 'day' ? (
          <View className="items-start">
            <DateField label={d.dayLabel} value={day} onChange={setDay} startISO={day} min={bounds.min} max={bounds.max} chooseLabel={d.dayTab} />
          </View>
        ) : (
          <BottomSheetScrollView style={{ maxHeight: Math.round(height * 0.45) }}>
            <ChoiceGroup
              label={d.monthTab}
              layout="list"
              className="-mx-4"
              value={monthKey}
              onChange={setMonthKey}
              options={months.map((m) => ({ value: m.key, label: m.label }))}
              testID="letter.dateSheet.month"
            />
          </BottomSheetScrollView>
        )}
      </View>
    </Sheet>
  );
}
