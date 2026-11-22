/**
 * J17 Co-parent sharing in a build with no co-parent flow (server features off, or a store build): there is nothing to
 * show (founder, 11 Nov 2026). Three tabs, Home, Book and Me; no Family tab; no "coming soon" page, sheet or row; "I was
 * invited" is hidden; an invite link keeps nothing and opens Home. The same app with the switch on, the v1.0 alpha
 * (D-100, D-106), is J21.
 */
import { btn, journey, passAgeGate, tab } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J17] no co-parent flow: three tabs, no Family tab and no coming soon anywhere', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 1, 'J16-01');
  await seeded(app);
  await expect(app.getByRole('tab')).toHaveCount(3);
  await expect(tab(app, 'Home')).toBeVisible();
  await expect(tab(app, 'Book')).toBeVisible();
  await expect(tab(app, 'Me')).toBeVisible();
  await expect(app.getByRole('tab', { name: 'Family' })).toHaveCount(0);
  await step('happy', 'Three tabs: Home, Book, Me', 'The bar is the same in every build. There is no Family tab and no gap where it was.');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await expect(app.getByText(/Write this book together/)).toHaveCount(0);
  await expect(app.getByText(/Coming soon|coming in a later update|For now, this book is yours/)).toHaveCount(0);
  await step('happy', 'A child\'s settings', 'No "Write this book together" row, no "Coming soon" value, no caption and no empty section where the row would sit.');
});

test('[J17b] no co-parent flow: "I was invited" is not on the welcome screen', async ({ app, record }) => {
  const step = journey(record, 'J17', 'family-coming-soon', 4, 'J01-03');
  await passAgeGate(app);
  await expect(btn(app, 'Begin the book')).toBeVisible();
  await expect(btn(app, 'I was invited')).toHaveCount(0);
  await step('happy', 'No "I was invited" door', 'No invite can exist without a server, so the button is gone. It is back when server features are on (J21). An invite link that is opened lands on Home and keeps nothing.');
});

test('[J17c] no co-parent flow: a child\'s settings have no co-parent row and no switch that cannot be turned on', async ({ app }) => {
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Asha', { exact: true }).first().click();
  await expect(app.getByText(/Write this book together/)).toHaveCount(0);
  await expect(app.getByText(/Family can read/)).toHaveCount(0);
});

test('[J17d] no co-parent flow: /family and /invite send the person to Home', async ({ app }) => {
  await seeded(app, 'asha', '/family');
  await expect(app.getByText(/Who writes to/)).toHaveCount(0);
  await expect(app).toHaveURL(/:\d+\/(\?[^/]*)?$/);
  await seeded(app, 'asha', '/invite');
  await expect(app.getByText(/For now, this book is yours/)).toHaveCount(0);
  await expect(app).toHaveURL(/:\d+\/(\?[^/]*)?$/);
});
