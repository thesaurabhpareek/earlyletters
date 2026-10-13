import { btn, firstRun, journey } from './support/app';
import { expect, test } from './support/journey';

test('[J07] a typed letter: write, autosave, review, add to the book', async ({ app, record }) => {
  const step = journey(record, 'J07', 'typed-letter', 1, 'J01-14');
  await firstRun(app);
  await btn(app, /^Type/).click();
  await expect(btn(app, 'Save')).toBeDisabled();
  await step('happy', 'Write, empty', 'A page, not a form: the child\'s name and age, the prompt as a quiet line, and a blank letter. Save is off until something is typed.');
  await app.getByRole('textbox').first().fill('You put both hands on the window today and watched the rain.');
  await expect(app.getByText('Saved on this phone')).toBeVisible();
  await step('happy', 'Typing, autosaved', 'After a pause "Saved on this phone" appears. Every pause saves a local draft, so a closed sheet or a crash loses nothing.');
  await btn(app, 'Save').click();
  await expect(app.getByText(/Add to .*book/)).toBeVisible();
  await step('happy', 'Review a typed letter', 'Typed words are kept exactly as typed: no tidying, no list of changes, no "does this sound like you". The person chooses where it goes.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/added|in .*book/i).first()).toBeVisible();
  await step('happy', 'Saved to the book', 'The letter settles into a card with a confirmation, then Review closes on its own after a moment (or on tap).', undefined, { settle: 120 });
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible({ timeout: 8000 });
  await step('happy', 'Back on Tonight', 'The person lands back on Tonight.');
});

test('[J07d] the free letters: two are kept, the third is held', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J07', 'typed-letter', 8, 'J07-04');
  await firstRun(app);
  const write = async (text: string) => {
    await btn(app, /^Type/).click();
    await app.getByRole('textbox').first().fill(text);
    await btn(app, 'Save').click();
    await expect(app.getByText(/Add to .*book/)).toBeVisible();
  };
  await write('You held the spoon by yourself today.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/Added to/)).toBeVisible();
  await expect(app.getByText('That was your second free letter.')).toHaveCount(0);
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible({ timeout: 8000 });
  await write('You laughed at the rain.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText('That was your second free letter.')).toBeVisible();
  await step('happy', 'The second free letter', 'After the second letter is kept, the saved card carries one calm line, once: "That was your second free letter." (D-082). No counter, no "0 left".', undefined, { settle: 120 });
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible({ timeout: 8000 });
  await write('You waved at the dog.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await step('unhappy', 'The third letter is held', 'The third Keep opens the Plus sheet instead of saving. The typed words are still on the phone as a draft; nothing was lost. (Plus itself needs a real iPhone: Apple\'s store view does not exist on web.)');
  await btn(app, 'Keep it here for now').click();
  await expect(app.getByText('Read it back').first()).toBeVisible();
  await step('happy', 'The held letter waits on Tonight', 'Tonight shows the waiting letter. Tapping it opens Review with the words as typed.');
});

test('[J07b] close a half-written letter: the draft waits on Tonight', async ({ app, record }) => {
  const step = journey(record, 'J07', 'typed-letter', 5, 'J07-01');
  await firstRun(app);
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('You were so sleepy and then');
  await expect(app.getByText('Saved on this phone')).toBeVisible();
  await btn(app, 'Close').click();
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible();
  await step('unhappy', 'Closed before finishing', 'Closing keeps the words as a draft. Tonight now shows a quiet card to pick the letter back up.');
  await app.getByText(/Read it back|waiting/i).first().click();
  await expect(app.getByRole('textbox').first()).toHaveValue(/sleepy/);
  await step('happy', 'Picking the draft back up', 'Tapping the card reopens the page with the words exactly as left.');
});

test('[J07c] a typed letter kept private', async ({ app, record }) => {
  const step = journey(record, 'J07', 'typed-letter', 7, 'J07-03');
  await firstRun(app);
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('A private one, only for us.');
  await btn(app, 'Save').click();
  await btn(app, 'Keep private').click();
  await expect(app.getByText(/private|only you/i).first()).toBeVisible();
  await step('happy', 'Kept private', 'Keep private saves the letter outside the book. It stays on the phone and can be added later.', undefined, { settle: 120 });
});
