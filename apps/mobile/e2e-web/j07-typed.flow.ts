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
  await step('happy', 'Review a typed letter', 'Typed words are kept exactly as typed: no fixes, no list of changes, no "does this sound like you". The person chooses where it goes.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/added|in .*book/i).first()).toBeVisible();
  await step('happy', 'Saved to the book', 'The letter settles into a card with a confirmation, then Review closes on its own after a moment (or on tap).', undefined, { settle: 120 });
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible({ timeout: 8000 });
  await step('happy', 'Back on Tonight', 'The person lands back on Tonight.');
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
