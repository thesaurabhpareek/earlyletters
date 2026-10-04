import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J08] a quiet day: "Not much today" keeps a note, not a letter', async ({ app, record }) => {
  const step = journey(record, 'J08', 'quiet-day', 1, 'J04-01');
  await seeded(app);
  await expect(btn(app, 'Not much today')).toBeVisible();
  await step('happy', 'A day with little to say', 'Under Speak and Type sits a quiet link: "Not much today".');
  await btn(app, 'Not much today').click();
  await expect(app.locator('body')).toContainText(/kept|noted|that.s fine|saved/i);
  await step('happy', 'Kept, with no guilt', 'One line of warmth replaces the link. A one-line note is stored for the day (it never appears in the book and is not counted as a letter).');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/'s book/).first()).toBeVisible();
  await step('happy', 'The Book is unchanged', 'The note is not in the Book and no streak or gap is shown.');
});
