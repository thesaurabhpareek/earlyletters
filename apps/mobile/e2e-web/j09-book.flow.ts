import { btn, firstRun, journey, typeLetter } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J09] the Book: empty, one letter, many letters', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 1, 'J07-04');
  await firstRun(app);
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('The first page is waiting.')).toBeVisible();
  await expect(app.getByText('Tell Asha one thing about today.')).toBeVisible();
  await step('happy', 'An empty book', 'One mark, one plain sentence, one action: "Write a letter". No counts, no gaps, nothing to fill in. With one book there is no "For Asha" row: "Asha\'s book" already says the name.');
  await btn(app, 'Write a letter').click();
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();
  await typeLetter(app, 'You laughed at the dog today, a whole belly laugh.');
  await expect(app.getByText('A thought to start with', { exact: false }).first()).toBeVisible({ timeout: 8000 });
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/laughed at the dog/)).toBeVisible();
  // The letter sits under the current month's opener, which is lit and says no sentence about filing.
  await expect(app.getByRole('heading', { name: /^This month, / })).toBeVisible();
  await expect(app.getByText(/Whatever you add this month/)).toHaveCount(0);
  await step('happy', 'One letter', 'The first letter sits under its month, whose opener is lit: "THIS MONTH", the month, "1 letter · From Mama" and its dates. Read together appears once there is at least one letter in the book.');
});

test('[J09b] the Book with many letters, a private one, a waiting one', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 3, 'J09-02');
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  // Openers are one heading each, heard without the "·" separator.
  await expect(app.getByRole('heading', { name: /^Month 6\. 2 letters, from Mama\. / })).toBeVisible();
  await expect(app.getByRole('heading', { name: /^This month, Month \d+\. / })).toBeVisible();
  await expect(app.getByText(/\w+ \d+ to \w+ \d+/).first()).toBeVisible();
  // Excerpts end in a fade, never an ellipsis glyph.
  await expect(app.getByText(/…/)).toHaveCount(0);
  await step('happy', 'Many letters, by month', 'Chapters by month of age, newest first, each opened by a kicker, a large numeral, "2 letters · From Mama" and the month\'s dates, with a hairline between chapters. The current month is lit and stands alone until a letter is kept in it. Each card shows the first words ending in a fade, the signature and a recording length; a private letter carries a "Private" mark. (Seeded fictional family Asha.) Full length capture shows every chapter.');
});

test('[J09c] a recording waiting for its words', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 4, 'J09-03');
  await seeded(app, 'asha-waiting');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/waiting for its words/i).first()).toBeVisible();
  await step('unhappy', 'A voice-only letter waiting for words', 'A kept recording whose words have not been written yet shows the app\'s own small note, with a microphone, instead of words; the card says why it waits beside its length while that is known. Nothing is lost; the recording is on the phone.');
});

test('[J09d] a recording with no words', async ({ app, record }) => {
  const step = journey(record, 'J09', 'the-book', 5, 'J09-03');
  await seeded(app, 'asha-quiet');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('No words in this one. The recording is kept just as it is.').first()).toBeVisible();
  await expect(app.getByText(/Nobody spoke/i)).toHaveCount(0);
  await step('unhappy', 'A recording with no words', 'A kept recording that came back with no words shows the app\'s own small note, "No words in this one. The recording is kept just as it is.", muted sans with a microphone: not in the letter\'s type and with no "From ..." signature under it. The recording may hold laughing or babble, so the note never says nobody spoke. It counts as a letter once kept.');
});
