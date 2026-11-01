import { btn, journey } from './support/app';
import { expect, test } from './support/journey';

test('[J02] under 18: the calm stop, the 24 hour wait, the way back', async ({ app, record }) => {
  const step = journey(record, 'J02', 'under-18', 1, 'J01-01');
  await app.getByRole('radio', { name: 'No' }).click();
  await step('unhappy', 'No is chosen', 'The person says they are under 18. Nothing else is asked, and the room does not change: the same light, the same mark.');
  await btn(app, 'Continue').click();
  // F01-U01 (F01-REQ-002, SR-C-04): a No is confirmed first, and nothing is stored until then.
  await expect(app.getByTestId('gate.confirm')).toBeVisible();
  await expect(app.getByTestId('gate.stop')).toHaveCount(0);
  await step('unhappy', 'The confirm step', 'One question: you chose under 18, is that right? Two equal answers: Yes, I am under 18, and Go back. Nothing is stored yet.');
  await app.getByTestId('gate.confirm.back').click();
  await expect(app.getByTestId('gate.confirm')).toHaveCount(0);
  await expect(app.getByTestId('gate.yes')).not.toBeChecked();
  await expect(app.getByTestId('gate.no')).not.toBeChecked();
  await expect(app.getByTestId('gate.continue')).toBeDisabled();
  // Going back stored nothing: a reload shows the question, not the stop.
  await app.reload();
  await expect(app.getByTestId('gate.continue')).toBeDisabled();
  await expect(app.getByTestId('gate.stop')).toHaveCount(0);
  await step('unhappy', 'Go back: the question again, nothing selected', 'Going back returns to the question with nothing selected, and nothing was stored: reopening the app asks again.');
  await app.getByTestId('gate.no').click();
  await app.getByTestId('gate.continue').click();
  await app.getByTestId('gate.confirm.yes').click();
  await expect(app.getByTestId('gate.stop')).toBeVisible();
  // S02: one line, a title, where the question was. Nothing else: no thank-you, no note, no way forward yet.
  await expect(app.getByRole('heading', { name: /is currently for adults 18 and over$/ })).toBeVisible();
  await expect(app.getByText('Thank you for telling us.')).toHaveCount(0);
  await expect(app.getByText('Nothing you entered has been kept.')).toHaveCount(0);
  await expect(app.getByRole('button')).toHaveCount(0);
  await step('unhappy', 'The stop screen', 'One line in the same lit room: the app is currently for adults 18 and over. No way to continue or go back. No child, letter or recording exists; only the time of the No is stored.');

  // A restart changes nothing for 24 hours.
  await app.reload();
  await expect(btn(app, 'Continue')).toHaveCount(0);
  await expect(app.getByRole('heading', { name: /is currently for adults 18 and over$/ })).toBeVisible();
  await step('unhappy', 'Reopening the app: still stopped', 'Relaunching shows the same stop line. The answer cannot be retried by restarting.');

  // 25 hours later (the page clock moves; the stored time of the No does not).
  await app.clock.install();
  await app.reload();
  await expect(app.getByText(/adults 18 and over/).first()).toBeVisible();
  await app.waitForTimeout(1500);
  await app.clock.fastForward('25:00:00');
  await expect(btn(app, /by mistake/i)).toBeVisible();
  await step('unhappy', 'After 24 hours: "I answered by mistake"', 'Only once a day has passed does the stop screen offer a way back, one quiet pill under the line. (Browser clock moved forward 25 hours; the logic is the app\'s own.)');
  await btn(app, /by mistake/i).click();
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  await expect(app.getByRole('radio', { name: 'Yes' })).not.toBeChecked();
  await expect(app.getByRole('radio', { name: 'No' })).not.toBeChecked();
  await expect(btn(app, 'Continue')).toBeDisabled();
  await step('happy', 'The question again, nothing preselected', 'The age question returns, empty, and the person can answer again.');
});
