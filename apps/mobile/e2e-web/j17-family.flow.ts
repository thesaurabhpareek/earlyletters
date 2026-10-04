import { btn, journey, passAgeGate } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J17] co-parent sharing is coming soon (v1.0 is on this phone only)', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 1, 'J16-01');
  await seeded(app);
  await app.getByText('Family', { exact: true }).last().click();
  await expect(app.getByText('Write to Asha, together')).toBeVisible();
  await step('happy', 'Family tab: coming soon', 'The tab keeps its place and describes what is coming (one book, two voices; each from their own phone; private to the family) with a promise that every letter stays on this phone until then. There is no invite flow in v1.0.');
  await btn(app, /Tell me when it/).click();
  await expect(app.getByText('Noted on this phone. When the update arrives, you will see it here.')).toBeVisible();
  await step('happy', 'Tell me when it\'s here', 'The one action stores a local "tell me" flag and says only what is true: "Noted on this phone. When the update arrives, you will see it here." Nothing is sent to us except a count of the tap. (The card on Tonight that fulfils the second sentence ships with co-parent sharing in v1.1.)');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await app.getByText(/Write this book together/).click();
  await expect(app.getByText('Write to Asha, together').last()).toBeVisible();
  await step('happy', 'From a child\'s settings', 'The "Write this book together: Soon" row opens the same coming-soon sheet, with Close.');
});

test('[J17b] "I was invited" is not on the welcome screen in v1.0', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 4, 'J01-03');
  await passAgeGate(app);
  await expect(btn(app, 'Begin the book')).toBeVisible();
  await expect(btn(app, 'I was invited')).toHaveCount(0);
  await step('happy', 'No "I was invited" door', 'No invite can exist without a server, so the button that could only open a coming-soon sheet is gone. It returns with co-parent sharing. An invite link that is opened still lands on the coming-soon sheet.');
});

test('[J17c] a child\'s settings have no switch that cannot be turned on', async ({ app }) => {
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await expect(app.getByText(/Write this book together/)).toBeVisible();
  await expect(app.getByText(/Family can read/)).toHaveCount(0);
});
