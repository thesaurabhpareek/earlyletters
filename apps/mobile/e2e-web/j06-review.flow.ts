import { billingCopy, en } from '@scribe/content';
import { btn, CHILD, firstRun, journey, noRemindersAfterFirstLetter, selectedTab, tab, typeLetter } from './support/app';
import { expect, onStore, seeded, test } from './support/journey';

const NOTE_SEED = 'Words come from the seeded fictional family Asha (the web build has no speech model, so a real recording never gets words).';

/** Plus on (the seeded cache), so Keep is not gated: these flows are about the words. The gate has its own flows, J06e and J06f, on the store build. */
async function openReview(app: import('@playwright/test').Page, kind: 'asha' | 'asha-plus' = 'asha-plus') {
  await seeded(app, kind);
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
}

/**
 * The store build, first run, then the two free letters typed and kept, ending on Home (J06e, J06f). The store build cannot
 * seed a family (see onStore), so the letter limit is reached through the screens, as J07d does.
 */
async function twoFreeLettersOnStore(app: import('@playwright/test').Page) {
  await onStore(app);
  await firstRun(app);
  await typeLetter(app, 'You held the spoon by yourself today.');
  await noRemindersAfterFirstLetter(app);
  await tab(app, 'Home').click();
  await typeLetter(app, 'You laughed at the rain.');
  await expect(app.getByText(/Added to/)).toBeVisible();
  await tab(app, 'Home').click();
}

test('[J06] review: the small fixes, put back, word for word, save to the book', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 1, 'J05-03');
  await openReview(app);
  await expect(app.getByTestId('review.sheet')).toBeVisible();
  await expect(app.getByText(/^To Asha · /i)).toBeVisible();
  await expect(app.getByText(/^From Mama$/i)).toBeVisible();
  await expect(app.getByTestId('review.trustLine')).toHaveCount(0);
  await step('happy', 'Review, with a first-time note', 'The letter on a sheet with its header, "TO ASHA · MONTH N" and "FROM MAMA", each small fix marked in the words, in the letter\'s own face (taken-out words struck through, a name spelled your way shown after the word heard), the fixes behind one row (open from the start while a screen reader is on, which the web build always reports), and the registered one-time note. No reassurance line under the title (S17). ' + NOTE_SEED);
  await btn(app, 'Got it').click();
  await step('happy', 'First note dismissed', '"Got it" collapses the note for good.');

  // The rows start open while a screen reader is on (P4 critics' pass S3), and the web build always reports one.
  const count = app.getByTestId('review.count');
  if (!(await app.getByTestId('review.fixRow').first().isVisible())) await count.click();
  await app.getByRole('button', { name: /Took out a sound/ }).first().click();
  await expect(btn(app, /Put it back/i)).toBeVisible();
  await step('happy', 'Why was this changed?', 'Tapping a mark in the letter, or its row behind "N small fixes", opens a card under the mark\'s own line: what kind of fix it was, the exact words said and how it reads now, and an offer to put it back.');
  await btn(app, /Put it back/i).click();
  await expect(app.getByText(/put back/i).first()).toBeVisible();
  await step('happy', 'Put back', 'The original words return, marked for a moment, with Undo beside them.');
  await app.getByRole('button', { name: 'Undo', exact: true }).click();
  await step('happy', 'Undo the put-back', 'Undo re-applies the small fix. Every edit is reversible both ways.');

  await app.getByRole('radio', { name: 'Exactly as said' }).click();
  await expect(app.getByText('Nothing was changed.')).toBeVisible();
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
  await step('happy', 'Saved: kept in its month', 'The save commits first, then the sheet files into its month: "Kept in Month N" under it and "Added to Asha\'s book." with a check, never ghosted words (S21).', undefined, { settle: 120, needs: [/^Kept in /, "Added to Asha's book."] });
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await expect(app.getByText('Read it back', { exact: true })).toHaveCount(0);
  await step('happy', 'On the Book, on the new letter', 'Review dissolves onto the Book, which is already on the new letter under its month, with the arrival wash. Tonight is never seen in between (5.8 row 5).', undefined, { settle: 400 });
});

test('[J06b] keep the letter private', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 11, 'J06-02');
  await openReview(app);
  await btn(app, 'Got it').click();
  await btn(app, 'Keep private').click();
  await expect(app.getByText(/Kept private/)).toBeVisible();
  await step('happy', 'Kept private', 'The letter is saved outside the book, with the lock chip "Kept private.", then lands on the Book with its Private chip, as a kept letter does (S21).', undefined, { settle: 120, needs: ['Kept private.'] });
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
  test.setTimeout(120_000);
  const step = journey(record, 'J06', 'review-and-edits', 14, 'J06-02');
  // The Plus gate is the store app's alone: the other builds are alpha (no letter limit, PL-1). The two free letters are typed
  // through first run (twoFreeLettersOnStore), and the third is the held one. J06f goes on from the held card to Review.
  await twoFreeLettersOnStore(app);
  await typeLetter(app, 'You waved at the dog on the corner.');
  await expect(app.getByText(billingCopy.keepGate.title.replace('{child}', CHILD))).toBeVisible();
  await expect(app.getByText(billingCopy.keepGate.heldNote)).toBeVisible();
  await expect(app.getByText(/\$\d|free trial|email you/i)).toHaveCount(0);
  await step('unhappy', 'Keep needs Plus', 'Pressing Keep after the first two letters opens one calm sheet: "Keep adding to Asha\'s book", that the first two letters are free, that this letter is safe on the phone, and a way to start Plus. No price, no trial length and no countdown (Apple\'s own sheet shows those). Nothing was saved yet. On web there is no StoreKit. This runs on the store build and reaches the sheet from the write page; J06f reaches it from Review, through the held letter. NEEDS A REAL IPHONE: See Plus, Redeem a code, Ask to Buy, offline.');
  await btn(app, billingCopy.keepGate.holdButton).click();
  // S22: the draft is marked held (store.holdDraft), so Tonight's card says so (S09), with its words as they were.
  await expect(app.getByText('Waiting to be kept.').first()).toBeVisible();
  await expect(app.getByText('You waved at the dog on the corner.')).toBeVisible();
  await expect(btn(app, /Keep it/).first()).toBeVisible();
  await step('happy', 'Kept here for now', 'The letter stays a draft, marked held: its card on Tonight says "Waiting to be kept." with the words exactly as they were and "Keep it". It can be played, read and exported from there, and kept once Plus is on (5.8 row 5c).');
});

test('[J06f] Review to Keep past the free letters: the held letter opens Review, and Keep there asks for Plus', async ({ app, record }) => {
  test.setTimeout(120_000);
  // BL-2162: the Plus gate reached from Review, on the store build (production app env, no seed, no seam: ruling B-9 keeps the
  // seam out of production). J06e reaches the gate from the write page. Here the third letter is held there first, so its card
  // on Home opens Review (draft-card.logic.ts: a held draft's "Keep it" goes to Review, then the gate), and Keep is pressed on
  // Review. Steps start at 16: J06e owns J06-14 and J06-15.
  const step = journey(record, 'J06', 'review-and-edits', 16, 'J06-15');
  const words = 'You pointed at the moon and said hello.';
  const gateTitle = billingCopy.keepGate.title.replace('{child}', CHILD);
  await twoFreeLettersOnStore(app);
  await typeLetter(app, words);
  await expect(app.getByText(gateTitle)).toBeVisible();
  await btn(app, billingCopy.keepGate.holdButton).click();
  await expect(app.getByText(en.tonight.draft.held).first()).toBeVisible();

  await btn(app, new RegExp(en.tonight.draft.keepButton)).first().click();
  // Review, not Write: the route is /review, and a typed letter's Review is titled with write.label (reviewHeading).
  await expect(app).toHaveURL(/\/review\?/);
  const sheet = app.getByTestId('review.sheet');
  await expect(sheet).toBeVisible();
  await expect(app.getByRole('heading', { name: en.write.label })).toBeVisible();
  // Scoped to the sheet: Home stays mounted behind Review with the same words on its held card.
  await expect(sheet.getByText(words)).toBeVisible();
  await expect(app.getByTestId('plusGate')).toHaveCount(0);
  await step('happy', 'Keep it opens Review', 'The held letter\'s "Keep it" on Home opens Review on that letter, titled "Your letter" as a typed letter is, its words exactly as typed. Nothing asks for Plus yet: the sheet comes only with Keep.');

  await btn(app, en.review.destination.addButton.replace('{child}', CHILD)).click();
  const gate = app.getByTestId('plusGate');
  await expect(gate.getByRole('heading', { name: gateTitle })).toBeVisible();
  await expect(gate.getByText(billingCopy.keepGate.heldNote)).toBeVisible();
  await expect(gate.getByRole('button', { name: en.common.closeButton })).toBeVisible();
  await expect(app.getByText(/\$\d|free trial|email you/i)).toHaveCount(0);
  await step('unhappy', 'Keep on Review needs Plus', 'Pressing "Add to Asha\'s book" on Review, past the two free letters, opens the same calm sheet as on the write page: "Keep adding to Asha\'s book", that the letter waits on Home, and Close in the header. No price, no trial length and no countdown. Nothing was saved. This runs on the store build with no seed and no seam. NEEDS A REAL IPHONE: See Plus, Redeem a code, Ask to Buy, offline.');

  await gate.getByRole('button', { name: en.common.closeButton }).click();
  await expect(app.getByTestId('plusGate')).toHaveCount(0);
  await expect(app).toHaveURL(/\/review\?/);
  await expect(app.getByRole('heading', { name: en.write.label })).toBeVisible();
  await expect(sheet.getByText(words)).toBeVisible();
  await expect(app.getByTestId('review.saved.chip')).toHaveCount(0);
  await step('happy', 'Closed: back on the letter', 'Close on the sheet returns to Review on the same letter, and nothing was kept. Closing Review leaves it waiting on Home, held, with its words as they were.');
  await btn(app, en.common.closeButton).first().click();
  await expect(app.getByText(en.tonight.draft.held).first()).toBeVisible();
  await expect(btn(app, new RegExp(en.tonight.draft.keepButton)).first()).toBeVisible();
});

test('[J06d] a Review link with no draft', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 13, 'J06-01');
  await seeded(app, 'asha', '/review');
  await expect(app.getByText('Nothing to read back here', { exact: true })).toBeVisible();
  await expect(app.getByText(/Something went wrong|try again/i)).toHaveCount(0);
  await step('unhappy', 'Review with no draft', 'Opened by a stale link with nothing to read back: the page drawing, "Nothing to read back here", one way on, "Go to the book", and Close. No error, nothing to try again (S23).');
  await btn(app, 'Go to the book').click();
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
});
