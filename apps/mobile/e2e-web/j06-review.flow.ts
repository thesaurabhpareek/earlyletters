import { btn, journey, tab } from './support/app';
import { expect, seeded, test } from './support/journey';

const NOTE_SEED = 'Words come from the seeded fictional family Asha (the web build has no speech model, so a real recording never gets words).';

/** Plus on (the seeded cache), so Keep is not gated: these flows are about the words. The gate has its own flow, J06e. */
async function openReview(app: import('@playwright/test').Page, kind: 'asha' | 'asha-plus' = 'asha-plus') {
  await seeded(app, kind);
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
}

test('[J06] review: what the machine tidied, put back, word for word, save to the book', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 1, 'J05-03');
  await openReview(app);
  await expect(app.getByTestId('review.sheet')).toBeVisible();
  await expect(app.getByText(/^To Asha · /i)).toBeVisible();
  await expect(app.getByText(/^From Mama$/i)).toBeVisible();
  await expect(app.getByTestId('review.trustLine')).toHaveCount(0);
  await step('happy', 'Review, with a first-time note', 'The letter on a sheet with its header, "TO ASHA · MONTH N" and "FROM MAMA", each small fix marked in the words (taken-out words struck through, a name spelled your way shown after the word heard), the fixes folded behind one row, and the registered one-time note. No reassurance line under the title (S17). ' + NOTE_SEED);
  await btn(app, 'Got it').click();
  await step('happy', 'First note dismissed', '"Got it" collapses the note for good.');

  await app.getByTestId('review.count').click();
  await app.getByRole('button', { name: /Took out a sound/ }).first().click();
  await expect(btn(app, /Put it back/i)).toBeVisible();
  await step('happy', 'Why was this changed?', 'Tapping a mark in the letter, or its row behind "N small fixes", says what kind of fix it was, shows the exact words said and how it reads now, and offers to put it back.');
  await btn(app, /Put it back/i).click();
  await expect(app.getByText(/put back/i).first()).toBeVisible();
  await step('happy', 'Put back', 'The original words return, marked for a moment, with Undo beside them.');
  await app.getByRole('button', { name: 'Undo', exact: true }).click();
  await step('happy', 'Undo the put-back', 'Undo re-applies the tidy-up. Every edit is reversible both ways.');

  await app.getByRole('radio', { name: 'Exactly as said' }).click();
  await expect(app.getByText('Exactly as you said it.')).toBeVisible();
  await step('happy', 'Exactly as said', 'One tap shows the words exactly as spoken, with their "um" and repeats; the screen says so. This is the view and the choice for this letter, until it is saved.');
  await app.getByRole('radio', { name: 'With small fixes' }).click();
  await expect(app.getByText(/small fixes/i).first()).toBeVisible();
  await step('happy', 'Back to small fixes', 'The same control returns to the words with each small fix marked. Every choice is reversible both ways.');

  await app.getByText('Change words', { exact: true }).click();
  await step('happy', 'Change words', 'The person may change any word themselves, in place on the same sheet: no box inside the letter, the sheet\'s edge turns to the accent line, and Done sits in the header (S18).');
  await btn(app, 'Done').first().click();

  await btn(app, /^Add to .*book/).click();
  await expect(app.getByTestId('review.saved.chip')).toHaveText(/^Kept in /);
  await expect(app.getByText("Added to Asha's book.")).toBeVisible();
  await step('happy', 'Saved: kept in its month', 'The save commits first, then the sheet files into its month: "Kept in Month N" under it and "Added to Asha\'s book." with a check, never ghosted words (S21).', undefined, { settle: 120 });
  await expect(tab(app, 'Book')).toBeVisible({ timeout: 4000 });
  await expect(app.getByText('Read it back', { exact: true })).toHaveCount(0);
  await step('happy', 'On the Book, on the new letter', 'Review dissolves onto the Book, which is already on the new letter under its month, with the arrival wash. Tonight is never seen in between (5.8 row 5).', undefined, { settle: 400 });
});

test('[J06b] keep the letter private', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 11, 'J06-02');
  await openReview(app);
  await btn(app, 'Got it').click();
  await btn(app, 'Keep private').click();
  await expect(app.getByText(/Kept just for you/)).toBeVisible();
  await step('happy', 'Kept private', 'The letter is saved outside the book, with the lock chip "Kept just for you.", then lands on the Book with its Private chip, as a kept letter does (S21).', undefined, { settle: 120 });
});

test('[J06c] close Review without saving: the recording is kept as a draft', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 12, 'J06-02');
  await openReview(app);
  await btn(app, 'Close').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await expect(app.getByText('Read it back').first()).toBeVisible();
  await step('unhappy', 'Close without saving', 'Closing leaves the draft where it was: its card is still on Tonight with "Read it back". Nothing is deleted. ("Let it go", the only delete, is a native confirm dialog that does not appear on web.)');
});

test('[J06e] Keep needs Plus past the free letters: the letter is held, never lost', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 14, 'J06-02');
  // Free phone with five letters already: past the first two.
  await openReview(app, 'asha');
  await btn(app, 'Got it').click();
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await expect(app.getByText('This one waits on this phone, on Tonight, exactly as it is, for as long as you like.')).toBeVisible();
  await expect(app.getByText(/\$\d|free trial|email you/i)).toHaveCount(0);
  await step('unhappy', 'Keep needs Plus', 'Pressing Keep after the first two letters opens one calm sheet: "Keep adding to Asha\'s book", that the first two letters are kept and always will be, that this letter is safe on the phone, and a way to start Plus. No price, no trial length and no countdown (Apple\'s own sheet shows those). Nothing was saved yet. On web there is no StoreKit, so the sheet says Plus is not available on this device and has no "See Plus" or "Redeem a code" button. NEEDS A REAL IPHONE: See Plus, Redeem a code, Ask to Buy, offline.');
  await btn(app, 'Keep it here for now').click();
  await expect(app.getByText('Read it back').first()).toBeVisible();
  await step('happy', 'Kept here for now', 'The letter stays a draft: its card is still on Tonight with the words exactly as they were. It can be played, read and exported from there, and kept once Plus is on (5.8 row 5c).');
});

test('[J06d] a Review link with no draft', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 13, 'J06-01');
  await seeded(app, 'asha', '/review');
  await expect(app.getByRole('heading', { name: 'Nothing to read back here' })).toBeVisible();
  await expect(app.getByText(/Something went wrong|try again/i)).toHaveCount(0);
  await step('unhappy', 'Review with no draft', 'Opened by a stale link with nothing to read back: the page drawing, "Nothing to read back here", one way on, "Go to the book", and Close. No error, nothing to try again (S23).');
  await btn(app, 'Go to the book').click();
  await expect(tab(app, 'Book')).toBeVisible();
});
