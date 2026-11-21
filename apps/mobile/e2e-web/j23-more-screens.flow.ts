import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

// BL-410: the Settings screens the journey record did not hold yet. Selectors are the words the screens carry today
// (j14 and j16 use the same rows). Not run in the sandbox that wrote it: see the PR for what only a browser run proves.
test('[J23] spoken language and legal', async ({ app, record }) => {
  const step = journey(record, 'J23', 'more-screens', 1, 'J16-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Spoken language', { exact: true }).click();
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();
  await step('happy', 'Spoken language', 'The language the parent speaks in: the main one, others they also speak, and how it is written. The app itself stays in English (D-056).');
  await app.goBack();

  await app.getByText('Legal', { exact: true }).click();
  await expect(app.getByText('Terms of Service', { exact: true })).toBeVisible();
  await step('happy', 'Legal', 'Terms of Service and Privacy Policy rows (they open the website), and Licenses.');
});
