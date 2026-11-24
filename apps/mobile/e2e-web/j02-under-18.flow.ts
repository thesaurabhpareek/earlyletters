import type { Page } from '@playwright/test';
import { agreeBox, btn, journey } from './support/app';
import { expect, test } from './support/journey';

/** The way back is still waiting: the button or a parent of it is fully transparent or ignores touches. */
const waiting = (page: Page) =>
  page.getByTestId('gate.stop.mistake').evaluate((el) => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.pointerEvents === 'none' || Number(c.opacity) === 0) return true;
    }
    return false;
  });

test('[J02] under 18: the calm stop, the 24 hour wait, the way back', async ({ app, record }) => {
  const step = journey(record, 'J02', 'under-18', 1, 'J01-01');
  await app.getByRole('radio', { name: 'No' }).click();
  await step('unhappy', 'No is chosen', 'The person says they are under 18. The agreement box stays unticked: No goes to the stop whatever it says, and nothing about it is stored. The room does not change: the same light, the same mark.');
  await btn(app, 'Continue').click();
  // S02: one line, a title, where the question was. Nothing else: no thank-you, no note, no way forward yet.
  await expect(app.getByRole('heading', { name: /is currently for adults 18 and over$/ })).toBeVisible();
  await expect(app.getByText('Thank you for telling us.')).toHaveCount(0);
  await expect(app.getByText('Nothing you entered has been kept.')).toHaveCount(0);
  // BL-420: the way-back slot is always laid out so the heading never moves, so its button is in the page from the start. Until
  // the day has passed it is see-through and takes no touch (the slot's own styles), which is what a person meets.
  await expect.poll(() => waiting(app)).toBe(true);
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
  await expect.poll(() => waiting(app)).toBe(false);
  await expect(btn(app, /by mistake/i)).toBeVisible();
  await step('unhappy', 'After 24 hours: "I answered by mistake"', 'Only once a day has passed does the stop screen offer a way back, one quiet pill under the line. (Browser clock moved forward 25 hours; the logic is the app\'s own.)');
  await btn(app, /by mistake/i).click();
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  await expect(app.getByRole('radio', { name: 'Yes' })).not.toBeChecked();
  await expect(app.getByRole('radio', { name: 'No' })).not.toBeChecked();
  await expect(agreeBox(app)).not.toBeChecked();
  await step('happy', 'The question again, nothing preselected', 'The age question returns, empty, and the person can answer again.');
});
