import { expect, test } from './support/journey';

test('[A1] the app opens on the age question, calmly, with no console errors', async ({ app, record }) => {
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  await expect(app.getByText('We ask everyone the same question.')).toBeVisible();
  await record({ id: 'J00-open', journey: 'first-run', kind: 'happy', title: 'The first thing anyone sees: one plain question', note: 'The same question for everyone (A-REQ-030).' });
});
