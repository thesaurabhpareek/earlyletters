/**
 * J17 Co-parent sharing in a build with server features off: the kill path (lib/capabilities.ts).
 * Every co-parent door shows "coming soon", "I was invited" is hidden, and an invite link keeps
 * nothing. The same app with the switch on, the v1.0 alpha (D-100, D-106), is J21.
 */
import { btn, journey, passAgeGate } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J17] switch off: co-parent sharing is coming soon (the kill path)', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 1, 'J16-01');
  await seeded(app);
  await app.getByText('Family', { exact: true }).last().click();
  await expect(app.getByText('Write to Asha, together')).toBeVisible();
  await step('happy', 'Family tab: coming soon', 'The tab keeps its place and describes what is coming (one book, two voices; each from their own phone; private to the family) with a promise that every letter stays on this phone until then. With server features off there is no invite flow (J21 is the same app with them on).');
  // SET-08: no "Tell me when it's here" until the arrival card that keeps its promise ships with sharing.
  await expect(btn(app, /Tell me when it/)).toHaveCount(0);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await app.getByText(/Write this book together/).click();
  await expect(app.getByText('Write to Asha, together').last()).toBeVisible();
  await step('happy', 'From a child\'s settings', 'The "Write this book together: Soon" row opens the same coming-soon sheet, with Close.');
});

test('[J17b] switch off: "I was invited" is not on the welcome screen', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 4, 'J01-03');
  await passAgeGate(app);
  await expect(btn(app, 'Begin the book')).toBeVisible();
  await expect(btn(app, 'I was invited')).toHaveCount(0);
  await step('happy', 'No "I was invited" door', 'No invite can exist without a server, so the button that could only open a coming-soon sheet is gone. It is back when server features are on (J21). An invite link that is opened still lands on the coming-soon sheet.');
});

test('[J17c] switch off: a child\'s settings have no switch that cannot be turned on', async ({ app }) => {
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await expect(app.getByText(/Write this book together/)).toBeVisible();
  await expect(app.getByText(/Family can read/)).toHaveCount(0);
});
