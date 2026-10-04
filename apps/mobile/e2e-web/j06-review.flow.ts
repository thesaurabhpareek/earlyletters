import { btn, journey } from './support/app';
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
  await step('happy', 'Review, with a first-time note', 'The words as spoken, with each tidy-up quietly underlined, a count of small fixes, and a one-time note saying what was and was not done. ' + NOTE_SEED);
  await btn(app, 'Got it').click();
  await step('happy', 'First note dismissed', '"Got it" collapses the note for good.');

  await app.getByRole('button', { name: /Filler/ }).first().click();
  await expect(btn(app, /Put it back/i)).toBeVisible();
  await step('happy', 'Why was this changed?', 'Tapping a tidy-up (the underline or its row) says what kind of fix it was, shows the exact words said and the tidied version, and offers to put it back.');
  await btn(app, /Put it back/i).click();
  await expect(app.getByText(/put back/i).first()).toBeVisible();
  await step('happy', 'Put back', 'The original words return, marked for a moment, with Undo beside them.');
  await btn(app, 'Undo').click();
  await step('happy', 'Undo the put-back', 'Undo re-applies the tidy-up. Every edit is reversible both ways.');

  await app.getByText('Show exactly what I said', { exact: true }).click();
  await step('happy', 'Exactly what was said', 'The raw words, untouched, with their "um" and repeats, labelled as the original.');
  await app.getByText(/Show the tidied|Show tidied/i).first().click().catch(() => undefined);

  await app.getByText('Keep it word for word', { exact: true }).click();
  await expect(app.getByText(/No changes|Nothing was changed|word for word/i).first()).toBeVisible();
  await step('happy', 'Word for word', 'One tap undoes every tidy-up at once; the screen says nothing was changed.');

  await app.getByText('Change words', { exact: true }).click();
  await step('happy', 'Change words', 'The person may edit any word themselves. Save is off while editing; Done returns.');
  await app.getByText('Done', { exact: true }).click();

  await app.getByRole('button', { name: /Not quite/ }).click();
  await step('happy', 'Does this sound like you? Not quite', 'A private two-button check on how faithful the words sound. "Not quite" shows a kind follow-up line; nothing is stored about the words.');

  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/Added to/)).toBeVisible();
  await step('happy', 'Saved to the book', 'The letter settles into a card with "Added to Asha\'s book". Review closes by itself or on tap.', undefined, { settle: 120 });
});

test('[J06b] keep the letter private', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 11, 'J06-02');
  await openReview(app);
  await btn(app, 'Got it').click();
  await btn(app, 'Keep private').click();
  await expect(app.getByText(/Kept just for you/)).toBeVisible();
  await step('happy', 'Kept private', 'The letter is saved outside the book. It is only on this phone and can be added later from the letter page.', undefined, { settle: 120 });
});

test('[J06c] close Review without saving: the recording is kept as a draft', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 12, 'J06-02');
  await openReview(app);
  await btn(app, 'Close').click();
  await expect(app.getByText('A thought to start with', { exact: false }).first()).toBeVisible();
  await expect(app.getByText('Read it back').first()).toBeVisible();
  await step('unhappy', 'Close without saving', 'Closing leaves the draft where it was: the "A letter is waiting to be read back" card is still on Tonight. Nothing is deleted. ("Let it go", the only delete, is a native confirm dialog that does not appear on web.)');
});

test('[J06e] Keep needs Plus past the free letters: the letter is held, never lost', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 14, 'J06-02');
  // Free phone with five letters already: past the first two.
  await openReview(app, 'asha');
  await btn(app, 'Got it').click();
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await expect(app.getByText('This letter is safe on your phone. Come back to it once Plus is on.')).toBeVisible();
  await expect(app.getByText(/\$\d|free trial|email you/i)).toHaveCount(0);
  await step('unhappy', 'Keep needs Plus', 'Pressing Keep after the first two letters opens one calm sheet: "Keep adding to Asha\'s book", that the first two letters are kept and always will be, that this letter is safe on the phone, and a way to start Plus. No price, no trial length and no countdown (Apple\'s own sheet shows those). Nothing was saved yet. On web there is no StoreKit, so the sheet says Plus is not available on this device and has no "See Plus" or "Redeem a code" button. NEEDS A REAL IPHONE: See Plus, Redeem a code, Ask to Buy, offline.');
  await btn(app, 'Keep it here for now').click();
  await expect(app.getByText('Read it back').first()).toBeVisible();
  await step('happy', 'Kept here for now', 'The letter stays a draft: Tonight still shows "A letter is waiting to be read back" with the words exactly as they were. It can be played, read and exported from there, and kept once Plus is on.');
});

test('[J06d] a Review link with no draft', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 13, 'J06-01');
  await seeded(app, 'asha', '/review');
  await expect(app.getByText(/Please try again/)).toBeVisible();
  await step('unhappy', 'Review with no draft', 'If Review is opened with a draft that no longer exists (only reachable by a stale link) the app says the words are safe and offers Close. It is not reachable by tapping.');
});
