import { reminderCopy } from '@scribe/content';
import { remindersSwitchShown, switchFooter, switchStatus } from '@/components/settings/reminders.logic';
import { ListSection, ToggleRow } from '@/components/ui/list-row';
import type { ReminderPermission, ReminderPrefs } from '@/lib/reminders';

/**
 * The Reminders master switch and its footer, the first element of app/settings/reminders.tsx. BL-428: the switch is
 * never ON while the OS permission is missing. It draws off with a status line under its title, and the
 * notifications-off card below it says how to allow them. A press while waiting asks again where the OS still can.
 */
export function RemindersSwitch({
  prefs,
  permission,
  busy,
  onValueChange,
}: {
  prefs: Pick<ReminderPrefs, 'enabled' | 'paused'>;
  permission: ReminderPermission | null;
  busy: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const s = reminderCopy.settings;
  const on = remindersSwitchShown(prefs, permission, busy);
  // The explanation is the footer, on screen before the switch is ever turned on (CCO-10, LEGAL-REQ-007).
  return (
    <ListSection footer={switchFooter(on)}>
      <ToggleRow title={s.enabledLabel} value={on} description={switchStatus(prefs, permission, busy)} disabled={busy} onValueChange={onValueChange} testID="reminders.switch" />
    </ListSection>
  );
}
