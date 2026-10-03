import { copy } from '@/lib/copy';
import type { ReminderCadence } from '@/components/child/child-store';

const r = copy.settings.reminders;

export const CADENCE_OPTIONS: { value: ReminderCadence; label: string }[] = [
  { value: 'off', label: r.offLabel },
  { value: 'weekly', label: r.weeklyLabel },
  { value: 'fewTimes', label: r.fewTimesLabel },
  { value: 'everyEvening', label: r.everyEveningLabel },
];

export const cadenceLabel = (v: ReminderCadence) => CADENCE_OPTIONS.find((o) => o.value === v)?.label ?? r.fewTimesLabel;
