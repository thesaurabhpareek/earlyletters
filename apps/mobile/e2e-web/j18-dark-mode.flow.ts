import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J18] dark mode: the same screens at night', async ({ app, record }) => {
  const step = journey(record, 'J18', 'dark-mode', 1, 'J16-03');
  await seeded(app, 'asha', '/settings/appearance');
  await app.getByText('Dark', { exact: true }).click();
  await app.waitForTimeout(600);
  await step('happy', 'Appearance: Dark', 'Theme is per phone: Match this phone, Light or Dark. Choosing Dark re-themes every screen at once (the app supports dark mode).');
  await app.goto(`${process.env.E2E_WEB_SEED_URL}/?seed=asha`);
  await expect(app.getByText('A thought to start with')).toBeVisible();
  await step('happy', 'Tonight, dark', 'The home tab in the dark theme.');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('Month 6')).toBeVisible();
  await step('happy', 'Book, dark', 'Chapters and cards in the dark theme.');
  await app.getByText(/rained all morning/).first().click();
  await expect(app.getByText('Hear Mama').last()).toBeVisible();
  await step('happy', 'A letter, dark', 'The letter page in the dark theme.');
  await app.goBack();
  await app.getByText('Tonight', { exact: true }).last().click();
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await step('happy', 'Review, dark', 'Review with its underlined tidy-ups in the dark theme.');
  await btn(app, 'Close').click();
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(1500);
  await step('happy', 'Listening, dark', 'The listening screen in the dark theme. (Fake microphone tone on web.)');
});
