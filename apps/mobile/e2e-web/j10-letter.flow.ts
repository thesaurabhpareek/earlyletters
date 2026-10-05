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
  await expect(app.getByText('Show exactly what I said').or(app.getByText(/original/i)).first()).toBeVisible();
  await step('happy', 'A letter, as a page', 'The words large in the letter face, signed "From Mama", with the recording player, how it was made, "Recording on this phone", and the actions below. (Seeded fictional family Asha; the seeded audio files do not exist, so the player is the closest honest state, see the note on the next step.)');

  await app.getByText('Show exactly what I said').click();
  await step('happy', 'Show exactly what I said', 'The raw words replace the tidied ones, under an "original" label.');
  await app.getByText(/Show (tidied|small fixes)/i).click();

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
  await expect(app.getByText('Delete this letter?')).toBeVisible();
  await step('unhappy', 'Delete asks first', 'Delete opens a small sheet: "Delete this letter?", "You can undo this for 30 days from Recently deleted." The safe choice, "Keep it", is the large primary button and the default; "Delete letter" is the quiet red one. (D-085.)');
  await app.getByRole('button', { name: 'Keep it' }).click();
  await expect(app.getByText('Delete this letter?')).toBeHidden();
  await expect(app.getByText(/rained all morning/).last()).toBeVisible();
  await step('unhappy', 'Keep it', 'Choosing "Keep it" closes the sheet and changes nothing: the letter is still on its page.');
  await app.getByText(/^Delete/).last().click();
  await app.getByRole('button', { name: 'Delete letter' }).click();
  await expect(app.getByText('Undo').first()).toBeVisible();
  await step('unhappy', 'Deleted, with Undo', 'After the confirm, the letter moves to Recently deleted for 30 days. The screen says so and Undo stays until the person taps Undo, Close or Back (no timer).');
  await app.getByText('Undo', { exact: true }).first().click();
  await expect(app.getByText(/rained all morning/).last()).toBeVisible();
  await step('happy', 'Undo restores the letter', 'The letter is back exactly as it was.');
});

/** From a just-deleted letter (Undo showing): back to the book, Settings, Recently deleted. */
const toShelf = async (app: import('@playwright/test').Page) => {
  await app.goBack();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Recently deleted', { exact: true }).first().click();
};

test('[J10f] Recently deleted: restore, and erase now', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 12, 'J10-01');
  await open(app, /rained all morning/);
  await app.getByText(/^Delete/).last().click();
  await app.getByRole('button', { name: 'Delete letter' }).click();
  await expect(app.getByText('Undo').first()).toBeVisible();
  await toShelf(app);
  await expect(app.getByText(/Erased on/).first()).toBeVisible();
  await expect(app.getByText('Letters you delete wait here for 30 days.').last()).toBeVisible();
  await step('happy', 'Recently deleted', 'Settings, Recently deleted lists the letter with its first words, its date, the day it was deleted and "Erased on" the day the purge removes it (30 days on), with Restore and Erase now. No countdown and no count. (Seeded fictional family Asha.)');

  await app.getByRole('button', { name: 'Restore' }).first().click();
  await expect(app.getByText('Letter restored.')).toBeVisible();
  await expect(app.getByText('Nothing here.', { exact: false })).toBeVisible();
  await step('happy', 'Restored', 'Restore puts the letter back in the book exactly as it was; a toast confirms and the shelf is empty again, with a calm note that deleted letters wait here for 30 days.');

  await app.goBack();
  await app.goBack();
  await app.getByText(/rained all morning/).last().click();
  await app.getByText(/^Delete/).last().click();
  await app.getByRole('button', { name: 'Delete letter' }).click();
  await expect(app.getByText('Undo').first()).toBeVisible();
  await toShelf(app);
  await app.getByRole('button', { name: 'Erase now' }).first().click();
  await expect(app.getByText('Erase this letter now?')).toBeVisible();
  await step('unhappy', 'Erase now asks first', 'Erase now ends the wait, after one question: "The letter and its recording will be erased from this phone, at once." "Keep it" is the default.');
  await app.getByRole('button', { name: 'Erase now' }).last().click();
  await expect(app.getByText('Nothing here.', { exact: false })).toBeVisible();
  await step('unhappy', 'Erased', 'The letter and its recording are gone from this phone at once, and the shelf is empty. (On a phone the recording file is removed first, then the row; the web preview has no recording files.)');
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
  await step('unhappy', 'A letter waiting for its words', 'The page shows the app\'s own small, muted note instead of an empty page, with no signature under it; the recording is there.');
});

test('[J10e] a recording with no words', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 10, 'J10-01');
  await seeded(app, 'asha-quiet');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(/No words in this one/).first().click();
  // The Book stays mounted behind the page, so look at the page's own (last) copy of the note.
  await expect(app.getByText('No words in this one. The recording is kept just as it is.').last()).toBeVisible();
  await step('unhappy', 'A recording with no words', 'The page shows the app\'s own small note instead of words, and no "From Mama" signature under it (the signature is only under words a person said); the recording is still there and can be kept.');
});

test('[J10d] a letter that does not exist', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 11, 'J10-01');
  await seeded(app, 'asha', '/letter/does-not-exist');
  await expect(btn(app, /./).first()).toBeVisible();
  await step('unhappy', 'Letter not found', 'A letter that is not on this phone (a stale link) shows a plain title and one button back.');
});
