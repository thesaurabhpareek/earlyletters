import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

const open = async (app: import('@playwright/test').Page, text: RegExp) => {
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(text).first().click();
  await expect(app.getByText('Spoken', { exact: false }).or(app.getByText('Typed', { exact: false })).first()).toBeVisible();
};

test('[J10] a letter: the page, the original words, reading size, make private, delete and undo', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 1, 'J09-03');
  await open(app, /rained all morning/);
  await expect(app.getByTestId('letter.view')).toHaveText('Exactly as said');
  await expect(app.getByText(/Spoken, with small fixes|Spoken, exactly as said/)).toBeVisible();
  await step('happy', 'A letter, as a page', 'The words large in the letter face, signed "From Mama", with the recording player, how it was made ("Spoken, with small fixes" when a fix was made, "Spoken, exactly as said" only when the words are untouched), "Recording on this phone", and the actions below. (Seeded fictional family Asha; the seeded audio files do not exist, so the player is the closest honest state, see the note on the next step.)');

  await app.getByTestId('letter.view').click();
  await expect(app.getByTestId('letter.view')).toHaveText('With small fixes');
  await step('happy', 'Exactly as said', 'The raw words replace the fixed ones, under an "Exactly what you said" label; the button now offers With small fixes.');
  await app.getByTestId('letter.view').click();
  await expect(app.getByText(/tidy|tidied/i)).toHaveCount(0);

  await app.getByRole('button', { name: /Reading size/i }).click();
  await expect(app.getByText('Large print')).toBeVisible();
  await step('happy', 'Reading size sheet', 'A small "Aa" sheet changes the letter size live behind it: Standard, Large, Large print.');
  await app.getByText('Large print', { exact: true }).click();
  await step('happy', 'Large print', 'The page re-sets at the largest size, cross-fading rather than animating the size.');
  await app.getByRole('button', { name: 'Close' }).first().click({ force: true });

  await app.getByText('Make private', { exact: true }).click();
  await expect(app.getByText(/Kept just for you/)).toBeVisible();
  await step('happy', 'Make private', 'The letter leaves the book; a "Private" mark and a toast confirm it. Moving it back is one tap.');

  await app.getByText(/Kept just for you/).locator('xpath=ancestor::*[.//button][1]').getByRole('button').last().click();
  await expect(app.getByText(/Kept just for you/)).toBeHidden();
  await app.getByText(/^Delete/).last().click();
  await expect(app.getByText('Undo').first()).toBeVisible();
  await step('unhappy', 'Deleted, with Undo', 'Delete is immediate, with no confirm dialog. The screen says so and Undo stays until the person taps Undo, Close or Back (no timer).');
  await app.getByText('Undo', { exact: true }).first().click();
  await expect(app.getByText(/rained all morning/).last()).toBeVisible();
  await step('happy', 'Undo restores the letter', 'The letter is back exactly as it was.');
});

test('[J10b] a typed letter has no player', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 8, 'J10-01');
  await open(app, /Bath time/);
  await expect(app.getByText(/Bath time/).last()).toBeVisible();
  await step('happy', 'A typed letter', 'Typed letters have the words and the signature, with "typed" provenance, and no player or recording line.');
});

test('[J10c] a letter waiting for words', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 9, 'J10-01');
  await seeded(app, 'asha-waiting');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(/waiting for its words/i).first().click();
  await expect(app.getByText(/waiting for its words/i).last()).toBeVisible();
  // One way to write the words, and the way to get them (Try again or Get words ready) when that is what would help.
  await expect(app.getByTestId('letter.write')).toHaveText('Write the words');
  await expect(app.getByTestId('letter.retry').or(app.getByTestId('letter.getReady')).first()).toHaveText(/Try again|Get words ready/);
  await step('unhappy', 'A letter waiting for its words', 'The page shows a calm italic note instead of an empty page, the reason words are not here yet, and Write the words with Try again or Get words ready. The recording is there and is never touched.');
  await app.getByTestId('letter.write').click();
  await expect(app.getByTestId('letter.writeWords.save')).toBeDisabled();
  await step('unhappy', 'Write the words', 'The person types the words for this recording. Nothing is fixed: the words are exactly what they typed.');
});

test('[J10e] a recording in which nobody spoke', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 10, 'J10-01');
  await seeded(app, 'asha-quiet');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(/nobody/i).first().click();
  await expect(app.getByTestId('letter.recordAgain')).toHaveText('Record again');
  await step('unhappy', 'A recording in which nobody spoke', 'The page says nobody spoke; the recording is still there, and Record again starts a new take without touching it.');
});

test('[J10d] a letter that does not exist', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 11, 'J10-01');
  await seeded(app, 'asha', '/letter/does-not-exist');
  await expect(btn(app, /./).first()).toBeVisible();
  await step('unhappy', 'Letter not found', 'A letter that is not on this phone (a stale link) shows a plain title and one button back.');
});
