import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J13] reminders: off, on, how often', async ({ app, record }) => {
  const step = journey(record, 'J13', 'reminders', 1, 'J12-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Reminders', { exact: true }).click();
  await expect(app.getByRole('switch')).toBeVisible();
  await step('happy', 'Reminders, off', 'One switch and one plain line: a gentle nudge a few evenings a week, never late at night. Nothing is asked of the phone until the switch is turned on.');
  await app.getByRole('switch').first().click();
  await expect(app.getByText('Open Settings')).toBeVisible();
  await step('unhappy', 'On, but notifications are not allowed', 'With the switch on and the phone\'s notification permission not granted, the screen explains it and offers "Open Settings" (native; it does nothing on web). The choices below stay editable. On iOS, the first time, a priming sheet comes before the iOS alert; the web build has no notification permission, so it skips straight to this state.');
  await app.getByText('Every evening', { exact: true }).click();
  await step('happy', 'Every evening', 'Choosing a cadence updates the evenings and the time (7 AM to 9:30 PM; quiet on a day already written). The time picker is a native control and does not open on web.');
});
