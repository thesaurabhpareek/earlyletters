import { btn, firstRun, journey, tab } from './support/app';
import { expect, test } from './support/journey';

test('[J07] a typed letter: write, autosave, one tap to the book', async ({ app, record }) => {
  const step = journey(record, 'J07', 'typed-letter', 1, 'J01-14');
  await firstRun(app);
  await btn(app, /^Type/).click();
  await expect(btn(app, /^Add to .*book/)).toBeDisabled();
  await expect(btn(app, 'Keep private')).toBeDisabled();
  await expect(btn(app, 'Save')).toHaveCount(0);
  await step('happy', 'Write, empty', 'A page under the still write lamp, not a form: the child\'s name and age, the prompt as the literary line, and a blank letter. "Add to Asha\'s book" and "Keep private" wait above the keyboard, off until something is typed (S19).');
  await app.getByRole('textbox').first().fill('You put both hands on the window today and watched the rain.');
  await expect(app.getByText('Saved on this phone')).toBeVisible();
  await step('happy', 'Typing, autosaved', 'After a pause "Saved on this phone" appears and stays. Every pause saves a local draft, so a closed sheet or a crash loses nothing.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Added to Asha's book.")).toBeVisible();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toHaveCount(0);
  await step('happy', 'Saved to the book, no Review', 'One tap keeps a typed letter: no "Read it back" screen. The Keep step runs exactly as for a spoken letter, then the letter files into its month (S20, S21).', undefined, { settle: 120 });
  await expect(tab(app, 'Book')).toBeVisible({ timeout: 4000 });
  await expect(app.getByText('You put both hands on the window today and watched the rain.')).toBeVisible();
  await step('happy', 'On the Book', 'The person lands on the Book, on the new letter in its month (5.8 row 5a).', undefined, { settle: 400 });
});

test('[J07d] the free letters: two are kept, the third is held', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J07', 'typed-letter', 8, 'J07-04');
  await firstRun(app);
  const write = async (text: string) => {
    await tab(app, 'Tonight').click();
    await btn(app, /^Type/).click();
    await app.getByRole('textbox').first().fill(text);
    await expect(btn(app, /^Add to .*book/)).toBeEnabled();
  };
  await write('You held the spoon by yourself today.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/Added to/)).toBeVisible();
  await expect(app.getByText('That was your second free letter.')).toHaveCount(0);
  await expect(tab(app, 'Book')).toBeVisible({ timeout: 4000 });
  await write('You laughed at the rain.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/Added to/)).toBeVisible();
  // The second-free line is the Book's own toast after the landing (S21), not under the chip.
  await expect(tab(app, 'Book')).toBeVisible({ timeout: 4000 });
  await expect(app.getByText('That was your second free letter.')).toBeVisible({ timeout: 4000 });
  await step('happy', 'The second free letter', 'The second letter is kept like the first. "That was your second free letter." shows once, as the Book\'s toast after the landing, with no count of what is left (D-082, S21).', undefined, { settle: 120 });
  await write('You waved at the dog.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await step('unhappy', 'The third letter is held', 'The third Keep, from Write, opens the Plus sheet instead of saving. The typed words are still on the phone as a draft; nothing was lost. (Plus itself needs a real iPhone: Apple\'s store view does not exist on web.)');
  await btn(app, 'Keep it here for now').click();
  await expect(app.getByText('You waved at the dog.')).toBeVisible();
  await step('happy', 'The held letter waits on Tonight', 'Tonight shows the waiting letter with its words as typed (5.8 row 5c).');
});

test('[J07b] close a half-written letter: the draft waits on Tonight', async ({ app, record }) => {
  const step = journey(record, 'J07', 'typed-letter', 5, 'J07-01');
  await firstRun(app);
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('You were so sleepy and then');
  await expect(app.getByText('Saved on this phone')).toBeVisible();
  await btn(app, 'Close').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await step('unhappy', 'Closed before finishing', 'Closing keeps the words as a draft. Tonight now shows its card with the first words and "Pick it up".');
  await app.getByText('Pick it up').first().click();
  await expect(app.getByRole('textbox').first()).toHaveValue(/sleepy/);
  await step('happy', 'Picking the draft back up', 'Tapping the card reopens the page with the words exactly as left.');
});

test('[J07c] a typed letter kept private', async ({ app, record }) => {
  const step = journey(record, 'J07', 'typed-letter', 7, 'J07-03');
  await firstRun(app);
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('A private one, only for us.');
  await btn(app, 'Keep private').click();
  await expect(app.getByText(/Kept just for you/)).toBeVisible();
  await step('happy', 'Kept private', 'Keep private, from Write, keeps the letter outside the book with the lock chip, then lands on the Book with its Private chip. It can be added to the book later.', undefined, { settle: 120 });
});
