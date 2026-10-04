import { btn, journey, passAgeGate } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J17] co-parent sharing is coming soon (v1.0 is on this phone only)', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 1, 'J16-01');
  await seeded(app);
  await app.getByText('Family', { exact: true }).last().click();
  await expect(app.getByText('Write to Asha, together')).toBeVisible();
  await step('happy', 'Family tab: coming soon', 'The tab keeps its place and describes what is coming (one book, two voices; each from their own phone; private to the family) with a promise that every letter stays on this phone until then. There is no invite flow in v1.0.');
  await btn(app, /Tell me when it/).click();
  await expect(app.getByText(/Thank you/)).toBeVisible();
  await step('happy', 'Tell me when it\'s here', 'The one action stores a local "tell me" flag and thanks the person. Nothing is sent anywhere.');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await app.getByText(/Write this book together/).click();
  await expect(app.getByText('Write to Asha, together').last()).toBeVisible();
  await step('happy', 'From a child\'s settings', 'The "Write this book together: Soon" row opens the same coming-soon sheet, with Close.');
});

test('[J17b] "I was invited" on the welcome screen', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 4, 'J01-03');
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  await expect(app.getByText(/together/i).first()).toBeVisible();
  await step('unhappy', 'I was invited, but invites are not open yet', 'Someone who was invited sees the same coming-soon sheet instead of an invite screen: they can write their own book now and the shared book comes later.');
});
