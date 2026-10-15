import { btn, journey } from './support/app';
import { expect, test } from './support/journey';

test('[J02] under 18: the calm stop, the 24 hour wait, the way back', async ({ app, record }) => {
  const step = journey(record, 'J02', 'under-18', 1, 'J01-01');
  await app.getByRole('radio', { name: 'No' }).click();
  await step('unhappy', 'No is chosen', 'The person says they are under 18. Nothing else is asked.');
  await btn(app, 'Continue').click();
  await expect(app.getByRole('heading').first()).toBeVisible();
  await step('unhappy', 'The stop screen', 'A calm explanation with no way to continue or go back. No child, letter or recording exists, only the time of the No is stored.');

  // A restart changes nothing for 24 hours.
  await app.reload();
  await expect(btn(app, 'Continue')).toHaveCount(0);
  await step('unhappy', 'Reopening the app: still stopped', 'Relaunching shows the same stop screen. The answer cannot be retried by restarting.');

  // 25 hours later (the page clock moves; the stored time of the No does not).
  await app.clock.install();
  await app.reload();
  await expect(app.getByText(/adults 18 and over/).first()).toBeVisible();
  await app.waitForTimeout(1500);
  await app.clock.fastForward('25:00:00');
  await expect(btn(app, /by mistake/i)).toBeVisible();
  await step('unhappy', 'After 24 hours: "I answered by mistake"', 'Only once a day has passed does the stop screen offer a way back. (Browser clock moved forward 25 hours; the logic is the app\'s own.)');
  await btn(app, /by mistake/i).click();
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  await step('happy', 'The question again, nothing preselected', 'The age question returns, empty, and the person can answer again.');
});
