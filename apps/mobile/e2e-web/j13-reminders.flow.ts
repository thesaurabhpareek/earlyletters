import { btn, firstRun, journey, selectedTab, tab, typeLetter } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J13] reminders: off, on, how often', async ({ app, record }) => {
  const step = journey(record, 'J13', 'reminders', 1, 'J12-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Reminders', { exact: true }).click();
  await expect(app.getByRole('switch')).toBeVisible();
  await step('happy', 'Reminders, off', 'One switch and one plain line: a gentle nudge a few evenings a week, never late at night. Nothing is asked of the phone until the switch is turned on.');
  await app.getByRole('switch').first().click();
  await expect(app.getByText('Notifications are off')).toBeVisible();
  await expect(app.getByText('Turn them on in Settings to get these reminders.')).toBeVisible();
  await expect(app.getByText('Open Settings')).toBeVisible();
  // S34: one switch per decision. The master switch keeps every choice when off, so there is no Pause row.
  await expect(app.getByText('Pause all reminders')).toHaveCount(0);
  await expect(app.getByText('Month and birthday messages')).toBeVisible();
  await step('unhappy', 'On, but notifications are not allowed', 'With the switch on and the phone\'s notification permission not granted, a card with the warning mark says "Notifications are off" and offers "Open Settings" (native; it does nothing on web). The choices below stay editable. When the person comes back from Settings with notifications allowed, the card collapses and "Reminders are on." shows (a phone check). On iOS, the first time, a priming sheet comes before the iOS alert; the web build has no notification permission, so it skips straight to this state. There is one switch for reminders: no separate Pause.');
  await app.getByText('Every evening', { exact: true }).click();
  await step('happy', 'Every evening', 'Choosing a cadence updates the evenings and the time (7 AM to 9:30 PM; quiet on a day already written). The time picker is a native control and does not open on web.');
});

test('[J13b] the reminder card after the first letter (C-REQ-001 Rev, DR-12 B): once, then never again by itself', async ({ app, record }) => {
  // SET-02 (docs/reviews/2026-10-31/setup.md). Server features off (build 1): there is no account ask at all.
  test.setTimeout(120_000);
  const step = journey(record, 'J13', 'reminders', 5, 'J07-03');
  await firstRun(app);
  await typeLetter(app, 'You held the spoon by yourself today.');
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toBeVisible({ timeout: 8000 });
  await expect(app.getByText('A couple of evenings a week, at a time you pick. Never late at night.')).toBeVisible();
  for (const b of ['Yes, evenings', 'Pick a time', 'No reminders']) await expect(btn(app, b)).toBeVisible();
  await step('happy', 'After the first letter', 'Over the Book, once the letter is in its place: the reminder card, the first ask after the first letter. Nothing was asked before it, and no OS prompt has appeared anywhere.');

  await btn(app, 'Pick a time').click();
  await expect(app.getByText('Remind me at')).toBeVisible();
  await expect(btn(app, 'Set reminder')).toBeVisible();
  await step('happy', 'Pick a time', 'A time from 7:00 AM to 9:30 PM, in 15-minute steps, then Set reminder (which asks iOS).');

  await btn(app, 'No reminders').click();
  await expect(app.getByText('You can write whenever you like.')).toBeVisible();
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toHaveCount(0);
  await step('unhappy', 'No reminders', 'No OS prompt; one calm line. Settings, Reminders still offers them.');

  await tab(app, 'Tonight').click();
  await typeLetter(app, 'You laughed at the rain.');
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await app.waitForTimeout(2500);
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' }), 'the second letter does not bring it back').toHaveCount(0);
});
