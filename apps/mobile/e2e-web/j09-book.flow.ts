import { btn, firstRun, journey, typeLetter } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J09] the Book: empty, one letter, many letters', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 1, 'J07-04');
  await firstRun(app);
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('The first page is waiting.')).toBeVisible();
  await step('happy', 'An empty book', 'One drawing, one plain sentence, one action: "Write a letter". No counts, no gaps, nothing to fill in.');
  await btn(app, 'Write a letter').click();
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();
  await typeLetter(app, 'You laughed at the dog today, a whole belly laugh.');
  await expect(app.getByText('A thought to start with', { exact: false }).first()).toBeVisible({ timeout: 8000 });
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/laughed at the dog/)).toBeVisible();
  await step('happy', 'One letter', 'The first letter sits under its month chapter. Read together appears once there is at least one letter in the book.');
});

test('[J09b] the Book with many letters, a private one, a waiting one', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 3, 'J09-02');
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('Month 6')).toBeVisible();
  await step('happy', 'Many letters, by month', 'Chapters by month of age, newest first. Each card shows the first words, the signature and a recording length. A private letter carries a "Private" mark. (Seeded fictional family Asha.) Full length capture shows every chapter.');
});

test('[J09c] a recording waiting for its words', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 4, 'J09-03');
  await seeded(app, 'asha-waiting');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/waiting for its words/i).first()).toBeVisible();
  await step('unhappy', 'A voice-only letter waiting for words', 'A kept recording whose words have not been written yet shows a calm note on its card instead of text. Nothing is lost; the recording is on the phone.');
});

test('[J09d] a recording in which nobody spoke', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 5, 'J09-03');
  await seeded(app, 'asha-quiet');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/nobody/i).first()).toBeVisible();
  await step('unhappy', 'A recording in which nobody spoke', 'A kept recording that came back with no words shows a gentle "nobody spoke" note instead of an empty card.');
});
