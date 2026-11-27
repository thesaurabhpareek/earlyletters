import { btn, firstRun, journey, selectedTab, tab, typeLetter } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J13] reminders: off, on, how often', async ({ app, record }) => {
  const step = journey(record, 'J13', 'reminders', 1, 'J12-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Reminders', { exact: true }).click();
  await expect(app.getByRole('switch')).toBeVisible();
  // CCO-10 (LEGAL-REQ-007): the explanation is on screen before the switch is ever turned on; no sheet follows a tap.
  await expect(app.getByText(/^A nudge in the evening, as often as you choose\. Never late at night\. Only in the evenings you pick/)).toBeVisible();
  await step('happy', 'Reminders, off', 'One switch and, under it, the plain lines that explain it before it is turned on: a nudge in the evening, as often as you choose; only in the evenings you pick, never late at night; and notifications never show what you write. Nothing is asked of the phone until the switch is turned on.');
  await app.getByRole('switch').first().click();
  // BL-428: the web build has no notification permission, so after the tap the switch draws off (the intent is kept)
  // with "Not sending yet." on its row, once; the footer is the explanation again, not "Changes save as you go.".
  await expect(app.getByRole('switch').first()).toBeChecked({ checked: false });
  await expect(app.getByText('Not sending yet.')).toBeVisible();
  await expect(app.getByText('Not sending yet.')).toHaveCount(1);
  await expect(app.getByText('Notifications are off')).toBeVisible();
  await expect(app.getByText('Turn them on in Settings to get these reminders.')).toBeVisible();
  await expect(app.getByText('Open Settings')).toBeVisible();
  await expect(app.getByText('Changes save as you go.')).toHaveCount(0);
  // S34: one switch per decision. The master switch keeps every choice when off, so there is no Pause row.
  await expect(app.getByText('Pause all reminders')).toHaveCount(0);
  // The choices stay on screen and editable while waiting for permission.
  await expect(app.getByText('Month and birthday messages')).toBeVisible();
  await step('unhappy', 'Turned on, but notifications are not allowed', 'With the switch turned on and the phone\'s notification permission not granted, the switch draws off with "Not sending yet." under its title (BL-428): reminders are kept on and start by themselves once notifications are allowed. A card with the warning mark says "Notifications are off" and offers "Open Settings" (native; it does nothing on web). The footer under the switch is the explanation again, not "Changes save as you go.". The choices below stay on screen and editable, with no Next line or preview until notifications are allowed. When the person comes back from Settings with notifications allowed, the switch draws on, the card collapses and "Reminders are on." shows (a phone check). On iOS the switch goes straight to the iOS alert, with no sheet in front of it (CDesO-3), stays on behind it, and draws off if the answer is no. The web build has no notification permission, so it lands here. There is one switch for reminders: no separate Pause.');
  await app.getByText('Every evening', { exact: true }).click();
  await step('happy', 'Every evening', 'Choosing a cadence updates the evenings and the time (7 AM to 9:30 PM; quiet on a day already written), and is kept while notifications are not allowed. The time picker is a native control and does not open on web.');
});

test('[J13b] the reminder card after the first letter (C-REQ-001 Rev, DR-12 B): once, then never again by itself', async ({ app, record }) => {
  // SET-02 (docs/reviews/2026-10-31/setup.md). Server features off (build 1): there is no account ask at all.
  test.setTimeout(120_000);
  const step = journey(record, 'J13', 'reminders', 5, 'J07-03');
  await firstRun(app);
  await typeLetter(app, 'You held the spoon by yourself today.');
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toBeVisible({ timeout: 8000 });
  await expect(app.getByText(/A couple of evenings a week, at a time you pick, to add to .+'s book\. Never late at night\./)).toBeVisible();
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

  await tab(app, 'Home').click();
  await typeLetter(app, 'You laughed at the rain.');
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await app.waitForTimeout(2500);
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' }), 'the second letter does not bring it back').toHaveCount(0);
});

test('[J13c] the second reminder card, once, after the first month (C-REQ-001 Rev, BL-518, BL-1427): never a third', async ({ app, record }) => {
  // The page's clock is ours (Playwright), so the first month passes in a moment; the logic that decides is the app's own
  // (lib/asks/next-ask.logic.ts: firstLetterAt at least 30 days old, exactly one prime shown, cap of 2). A reload is a new session.
  test.setTimeout(150_000);
  const step = journey(record, 'J13', 'reminders', 8, 'J13-07');
  const card = app.getByRole('heading', { name: 'A gentle nudge, now and then?' });
  await firstRun(app);
  await typeLetter(app, 'You held the spoon by yourself today.');
  await expect(card).toBeVisible({ timeout: 8000 });
  await btn(app, 'No reminders').click();
  await expect(card).toHaveCount(0);

  // Day 10 (inside the first month): a new session and a new letter, and no second card yet.
  await app.clock.setFixedTime(new Date(Date.now() + 10 * 864e5));
  await app.reload();
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 15_000 });
  await tab(app, 'Home').click();
  await typeLetter(app, 'You laughed at the rain.');
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await app.waitForTimeout(2500);
  await expect(card, 'inside the first month there is no second card').toHaveCount(0);

  // Day 31: a new session and a new letter, and the second card shows.
  await app.clock.setFixedTime(new Date(Date.now() + 31 * 864e5));
  await app.reload();
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 15_000 });
  await tab(app, 'Home').click();
  await typeLetter(app, 'You waved at the moon.');
  await expect(card).toBeVisible({ timeout: 8000 });
  for (const b of ['Yes, evenings', 'Pick a time', 'No reminders']) await expect(btn(app, b)).toBeVisible();
  await step('happy', 'After the first month: the second card', 'Over the Book, once the first month is behind you: the same reminder card, shown a second time. The first one was answered with No reminders, and this is the last time it is offered. (Browser clock moved forward; the logic is the app\'s own.)');
  await btn(app, 'No reminders').click();
  await expect(card).toHaveCount(0);

  // Day 40: a new session and a new letter, and no third card, ever.
  await app.clock.setFixedTime(new Date(Date.now() + 40 * 864e5));
  await app.reload();
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 15_000 });
  await tab(app, 'Home').click();
  await typeLetter(app, 'You clapped for the dog.');
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await app.waitForTimeout(2500);
  await expect(card, 'a third card never shows').toHaveCount(0);
  await step('unhappy', 'No third card', 'Another letter in a new session, well past the first month: nothing is asked. The card is offered twice at most.');
});
