import { btn } from './support/app';
import { expect, test } from './support/journey';

test('[A1] the app opens on the age question, calmly, with no console errors', async ({ app, record }) => {
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  // S01 (LEGAL-REQ-002 AC1): the question, Yes, No and Continue, nothing selected and nothing else.
  await expect(app.getByText('We ask everyone the same question.')).toHaveCount(0);
  await expect(app.getByRole('radio')).toHaveCount(2);
  await expect(btn(app, 'Continue')).toBeDisabled();
  await record({ id: 'J00-open', journey: 'first-run', kind: 'happy', title: 'The first thing anyone sees: one plain question', note: 'The same neutral question for everyone, in the launch screen\'s lit room, with nothing preselected (LEGAL-REQ-002, PRD-REQ-019).' });
});
