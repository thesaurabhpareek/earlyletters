import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J16] settings: home, privacy, appearance, help, licences, about', async ({ app, record }) => {
  const step = journey(record, 'J16', 'settings-and-help', 1, 'J15-02');
  await seeded(app, 'asha', '/settings');
  await expect(app.getByText('Version', { exact: true })).toBeVisible();
  await step('happy', 'Settings', 'Every destination one tap away: Plan, children, spoken language, reminders, appearance, privacy, export, Recently deleted, recordings, storage, help, legal, licences and version. No Account or Delete account rows in v1.0, since there are no accounts. An "early version" note stays at the top.');

  await app.getByText('Privacy', { exact: true }).first().click();
  await expect(app.getByText('What we never do', { exact: false })).toBeVisible();
  await step('happy', 'Privacy', 'The usage-and-crash-report switch (off until the person says yes), what is never done (ads, selling data, training models), and links to the full policies.');
  await app.goBack();

  await app.getByText('Appearance', { exact: true }).first().click();
  await expect(app.getByText('Reading size')).toBeVisible();
  await step('happy', 'Appearance', 'Theme (Match this phone, Light, Dark) and reading size with a live sample line.');
  await app.getByText('Large print', { exact: true }).click();
  await step('happy', 'Large print reading size', 'The sample line grows to the largest size.');
  await app.goBack();

  await app.getByText('If you are struggling', { exact: true }).click();
  await step('happy', 'If you are struggling', 'Always available, never behind a flag: free confidential lines with how to reach them. Opens in place.');
  await app.getByText('Licences', { exact: true }).click();
  await step('happy', 'Licences', 'Open-source and model licences listed in place.');
});
