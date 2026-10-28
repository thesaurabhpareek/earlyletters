import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

// "Hide this book" confirms with a native dialog that the web does not draw, so the flow starts from a book already
// hidden: `?seed=asha-hidden` adds Avi's book, hidden on this phone (src/dev/asha-seed.ts; the web preview only).
test('[J03] a hidden book comes back: Settings, Hidden books, Show this book again (P6d)', async ({ app, record }) => {
  const step = journey(record, 'J03', 'children-and-books', 40, 'J03-07');
  await seeded(app, 'asha-hidden', '/settings');
  // Under Children: Asha's book, Add a child, and, because a book is hidden, Hidden books. Avi's book is not listed.
  await expect(app.getByRole('button', { name: 'Asha', exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Avi', exact: true })).toHaveCount(0);
  await app.getByRole('button', { name: 'Hidden books' }).click();
  await expect(app.getByRole('heading', { name: 'Avi', exact: true })).toBeVisible();
  const show = app.getByRole('button', { name: 'Show this book again, Avi' });
  await expect(show).toBeVisible();
  // Nothing on the page deletes or removes anything.
  await expect(app.getByRole('button', { name: /delete|remove|erase/i })).toHaveCount(0);
  await step('happy', 'Hidden books', 'Each book hidden on this phone, with "Show this book again". Nothing is deleted by hiding, and nothing here deletes.');

  await show.click();
  await expect(app.getByText('No hidden books.')).toBeVisible();
  await expect(app.getByRole('button', { name: /Show this book again/ })).toHaveCount(0);
  await step('happy', 'The book is back', 'Avi\'s book is back on this phone, as it was. With no book hidden, the page says "No hidden books."');

  // Back on Settings, Avi's book is listed under Children again, and with nothing hidden the Hidden books row is gone.
  await app.goBack();
  await expect(app.getByRole('button', { name: 'Avi', exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Asha', exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Hidden books' })).toHaveCount(0);
});
