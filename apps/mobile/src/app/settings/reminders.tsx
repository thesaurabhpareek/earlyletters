import { useState } from 'react';
import { ScrollView } from 'react-native';
import { copy } from '@/lib/copy';
import { getReminderCadence, getRemindersPaused, setReminderCadence, setRemindersPaused } from '@/components/child/child-store';
import { CADENCE_OPTIONS } from '@/components/settings/labels';
import { Choices, Section, ToggleRow } from '@/components/settings/settings-ui';

/** Reminders (PRD C, C-REQ-002 and C-REQ-007). Saves the choice; scheduling is not built yet. */
export default function Reminders() {
  const [cadence, setCadence] = useState(getReminderCadence);
  const [paused, setPaused] = useState(getRemindersPaused);
  const r = copy.settings.reminders;
  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Section title={r.cadenceLabel} footer={`${r.help} ${copy.settingsMore.remindersNotYet}`}>
        <Choices
          options={CADENCE_OPTIONS}
          value={cadence}
          onChange={(v) => {
            setCadence(v);
            setReminderCadence(v);
          }}
        />
      </Section>
      <Section>
        <ToggleRow
          first
          title={r.pauseLabel}
          value={paused}
          onChange={(v) => {
            setPaused(v);
            setRemindersPaused(v);
          }}
        />
      </Section>
    </ScrollView>
  );
}
