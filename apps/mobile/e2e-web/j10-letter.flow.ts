import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

const open = async (app: import('@playwright/test').Page, text: RegExp) => {
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(text).first().click();
  await expect(app.getByText('Spoken', { exact: false }).or(app.getByText('Typed', { exact: false })).first()).toBeVisible();
};

/** Delete the open letter: the sheet asks first, then the Book is back with the card gone and Undo waiting. */
const deleteOpenLetter = async (app: import('@playwright/test').Page) => {
  await app.getByText(/^Delete$/).last().click();
  await expect(app.getByText('Delete this letter?')).toBeVisible();
  await app.getByRole('button', { name: 'Delete letter' }).click();
  await expect(app.getByText('Letter deleted.')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Undo' })).toBeVisible();
};

test('[J10] a letter: the page, the original words, reading size, make private, delete and undo', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 1, 'J09-03');
  await open(app, /rained all morning/);
  await expect(app.getByText('Exactly as said', { exact: true }).first()).toBeVisible();
  await expect(app.getByText('Spoken, with small fixes. Recording kept on this phone.')).toBeVisible();
  await step('happy', 'A letter, as a page', 'The page opens in the card\'s own column: the same dateline and words, then the rest of the letter, signed "From Mama" in italic. One pill player, one provenance line ("Spoken, with small fixes. Recording kept on this phone."), "Exactly as said", and the actions below. No lamp: a voice plays here. (Seeded fictional family Asha; the seeded audio files do not exist, so the player is the closest honest state.)');

  await app.getByText('Exactly as said', { exact: true }).click();
  await expect(app.getByText('Exactly what you said')).toBeVisible();
  await step('happy', 'Exactly as said', 'The raw words replace the fixed ones, under an "Exactly what you said" label, cross-fading over 150 ms.');
  await app.getByText('With small fixes', { exact: true }).click();

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
  await app.getByText(/^Delete$/).last().click();
  await expect(app.getByText('Delete this letter?')).toBeVisible();
  await expect(app.getByText('It waits in Recently deleted for 30 days.')).toBeVisible();
  await step('unhappy', 'Delete asks first', 'Delete opens a small sheet: "Delete this letter?", "It waits in Recently deleted for 30 days." The safe choice, "Keep it", is the large primary button and the default; "Delete letter" is the quiet red one with the Trash icon. No Close in its header: "Keep it" and a swipe down are the ways out. (D-085.)');
  await app.getByRole('button', { name: 'Keep it' }).click();
  await expect(app.getByText('Delete this letter?')).toBeHidden();
  await expect(app.getByText(/rained all morning/).last()).toBeVisible();
  await step('unhappy', 'Keep it', 'Choosing "Keep it" closes the sheet and changes nothing: the letter is still on its page.');
  await app.getByText(/^Delete$/).last().click();
  await app.getByRole('button', { name: 'Delete letter' }).click();
  await expect(app.getByText('Letter deleted.')).toBeVisible();
  await expect(app.getByText("Asha's book").first()).toBeVisible();
  await expect(app.getByText(/rained all morning/)).toHaveCount(0);
  await expect(app.getByText(/Undo it now, or close/)).toHaveCount(0);
  await step('unhappy', 'Deleted, with Undo', 'After the confirm, the Book is back at once: the card goes back into its row and leaves it, and one toast above the tab bar says "Letter deleted." with Undo and Close. It has no timer; leaving the Book takes it away. The letter waits in Recently deleted for 30 days.');
  await app.getByRole('button', { name: 'Undo' }).click();
  await expect(app.getByText(/rained all morning/).first()).toBeVisible();
  await step('happy', 'Undo restores the letter', 'The card is back in its place, exactly as it was, with a soft wash for a moment.');
});

/** From the Book: Settings, Recently deleted. */
const toShelf = async (app: import('@playwright/test').Page) => {
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Recently deleted', { exact: true }).first().click();
};

test('[J10f] Recently deleted: restore, and erase now', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 12, 'J10-01');
  await open(app, /rained all morning/);
  await deleteOpenLetter(app);
  await toShelf(app);
  await expect(app.getByText(/^Deleted \w+ \d+\. Kept here until \w+ \d+\.$|^Deleted \d+ \w+\. Kept here until \d+ \w+\.$/).first()).toBeVisible();
  await expect(app.getByText(/Erased on/)).toHaveCount(0);
  await expect(app.getByText('Letters you delete wait here for 30 days.').last()).toBeVisible();
  await step('happy', 'Recently deleted', 'Settings, Recently deleted lists the letter as a card: its first words in the letter face, ending in a fade, "From Mama", and one line: "Deleted October 13. Kept here until November 12." Then Restore and Erase now. No countdown and no count. (Seeded fictional family Asha.)');

  await app.getByRole('button', { name: 'Restore' }).first().click();
  await expect(app.getByText("Back in Asha's book.")).toBeVisible();
  await expect(app.getByRole('button', { name: 'Open' })).toBeVisible();
  await expect(app.getByText('No deleted letters.')).toBeVisible();
  await step('happy', 'Restored', 'Restore lifts the card out and puts the letter back in the book exactly as it was; the toast says "Back in Asha\'s book." with "Open". The shelf is empty: the page drawing and "No deleted letters.", with no repeated heading.');

  await app.goBack();
  await app.goBack();
  await app.getByText(/rained all morning/).last().click();
  await deleteOpenLetter(app);
  await toShelf(app);
  await app.getByRole('button', { name: 'Erase now' }).first().click();
  await expect(app.getByText('Erase this letter now?')).toBeVisible();
  await expect(app.getByText('The letter and its recording are erased for good.')).toBeVisible();
  await step('unhappy', 'Erase now asks first', 'Erase now ends the wait, after one question: "The letter and its recording are erased for good." "Keep it" is the default.');
  await app.getByRole('button', { name: 'Erase now' }).last().click();
  await expect(app.getByText('Letter erased.')).toBeVisible();
  await expect(app.getByText("Back in Asha's book.")).toHaveCount(0);
  await expect(app.getByText('No deleted letters.')).toBeVisible();
  await step('unhappy', 'Erased', 'The letter and its recording are gone for good, the shelf is empty, and the toast says "Letter erased." (it replaces any toast before it, so no "Back in Asha\'s book." is left showing). On a phone the recording file is removed first, then the row; the web preview has no recording files.');
});

test('[J10b] a typed letter has no player', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 8, 'J10-01');
  await open(app, /Bath time/);
  await expect(app.getByText(/Bath time/).last()).toBeVisible();
  await expect(app.getByTestId('player.pill')).toHaveCount(0);
  await step('happy', 'A typed letter', 'Typed letters have the words and the signature, with "Typed" provenance, and no player or recording line.');
});

test('[J10c] a letter waiting for words', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 9, 'J10-01');
  await seeded(app, 'asha-waiting');
  await app.getByText('Book', { exact: true }).last().click();
  // The Tonight screen stays in the page under the Book on the web, and its draft card carries the same words, so the
  // Book's own card is picked by its test id (as the other cards are).
  await app.getByTestId('book.card').filter({ hasText: /waiting for its words/i }).first().click();
  await expect(app.getByText(/waiting for its words/i).last()).toBeVisible();
  await expect(btn(app, 'Write the words')).toBeVisible();
  await step('unhappy', 'A letter waiting for its words', 'The page shows the app\'s own small, muted note instead of an empty page, with no signature under it, and "Write the words" opens the words sheet; the recording is there.');
});

test('[J10e] a recording with no words', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 10, 'J10-01');
  await seeded(app, 'asha-quiet');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(/No words in this one/).first().click();
  // The Book stays mounted behind the page, so look at the page's own (last) copy of the note.
  await expect(app.getByText('No words in this one. The recording is kept just as it is.').last()).toBeVisible();
  await expect(app.getByRole('button', { name: 'Record again' })).toHaveCount(0);
  // S28: the same words card as a waiting letter, with "Write the words" only (nothing to try again or fetch).
  await expect(btn(app, 'Write the words')).toBeVisible();
  await expect(btn(app, 'Try again')).toHaveCount(0);
  await expect(btn(app, 'Get words ready')).toHaveCount(0);
  await step('unhappy', 'A recording with no words', 'The page shows the app\'s own small note instead of words, and no "From Mama" signature under it (the signature is only under words a person said); the recording is still there and can be kept, and "Write the words" opens the words sheet so the person can put the words with it. "Record again" is gone from this page: it started a separate letter.');
  await btn(app, 'Write the words').click();
  await expect(app.getByText('Words for this recording').first()).toBeVisible();
  await expect(app.getByTestId('letter.writeWords.save')).toBeDisabled();
});

test('[J10d] a letter that does not exist', async ({ app, record }) => {
  const step = journey(record, 'J10', 'letter-detail', 11, 'J10-01');
  await seeded(app, 'asha', '/letter/does-not-exist');
  await expect(app.getByText('This letter is not in the book')).toBeVisible();
  await expect(btn(app, 'Back to the book')).toBeVisible();
  await expect(app.getByText(/does-not-exist/)).toHaveCount(0);
  await step('unhappy', 'Letter not found', 'A letter that is not on this phone (a stale link) shows "This letter is not in the book" and one way back. Never the id or the route. If it is on the Recently deleted shelf, the page says so and opens the shelf.');
});
