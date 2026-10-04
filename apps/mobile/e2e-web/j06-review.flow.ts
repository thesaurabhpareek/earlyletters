import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

const NOTE_SEED = 'Words come from the seeded fictional family Asha (the web build has no speech model, so a real recording never gets words).';

async function openReview(app: import('@playwright/test').Page) {
  await seeded(app);
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
}

/** Every button, radio and link outside the letter's own marks is at least 44 pt tall (the marks are a bonus target; the fix rows meet 44). */
async function expectTouchTargets(app: import('@playwright/test').Page) {
  const small = await app.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[role=button],[role=radio],button,a[href]'))) {
      if (el.closest('[data-testid="review.transcript"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 43.5) out.push(`${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)} (${Math.round(r.height)}pt)`);
    }
    return out;
  });
  expect(small).toEqual([]);
}

const noTidy = async (app: import('@playwright/test').Page) => expect(app.locator('body')).not.toContainText(/\btid(y|ied|ying)\b|lightly/i);

test('[J06] review: small fixes marked, put back, exactly as said and back, save to the book', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 1, 'J05-03');
  await openReview(app);
  await expect(app.getByTestId('review.count')).toHaveText(/^\d+ small fixes$|^1 small fix$/);
  await noTidy(app);
  await step('happy', 'Review, with a first-time note', 'The words as spoken with each small fix marked (words taken out struck through), one plain count line, the "With small fixes | Exactly as said" control, and a one-time note saying what was and was not done. ' + NOTE_SEED);
  // The first note reads at 16 pt or more.
  const noteSize = await app.getByText(/^We take out small slips/).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(noteSize).toBeGreaterThanOrEqual(16);
  await expectTouchTargets(app);
  await btn(app, 'Got it').click();
  await step('happy', 'First note dismissed', '"Got it" collapses the note for good.');

  // One row per fix, named by what happened.
  const rows = app.getByTestId('review.fixRow');
  await expect(rows.first()).toBeVisible();
  await expect(rows.first()).toContainText(/Took out|Spelled your way|One word fixed|New paragraph|Punctuation|Your script/);
  const fixes = await rows.count();
  await rows.first().click();
  await expect(app.getByTestId('review.card')).toContainText('You said');
  await expect(btn(app, /Put it back/i)).toBeVisible();
  await step('happy', 'What happened here', 'Tapping a fix (the mark or its row) names what happened, shows "You said" and "Now it reads" (or "Taken out"), and offers to put it back.');
  await app.getByTestId('review.card.putBack').click();
  await expect(app.getByText(/put back/i).first()).toBeVisible();
  await expect(rows).toHaveCount(fixes - 1);
  await step('happy', 'Put back', 'The original words return, marked for a moment, with Undo beside them; the count drops by one.');
  await btn(app, 'Undo').click();
  await expect(rows).toHaveCount(fixes);
  await step('happy', 'Undo the put-back', 'Undo applies the fix again. Every fix is reversible both ways.');

  // Exactly as said is one tap and reversible: the fixes come back untouched.
  const view = app.getByTestId('review.view');
  await expect(view).toBeVisible();
  await app.getByTestId('review.view.exact').click();
  await expect(app.getByTestId('review.count')).toHaveText('Exactly as you said it.');
  await expect(rows).toHaveCount(0);
  await step('happy', 'Exactly as said', 'The raw words, untouched, with their um and repeats. The control says which view this letter is in, with a check; nothing is thrown away.');
  await app.getByTestId('review.view.fixes').click();
  await expect(rows).toHaveCount(fixes);
  await expect(app.getByTestId('review.count')).toHaveText(/small fix/);
  await step('happy', 'Back to small fixes', 'The same fixes return: choosing Exactly as said was never a one-way door.');
  await noTidy(app);

  await app.getByTestId('review.edit').click();
  await expect(app.getByTestId('review.edit.done')).toBeVisible();
  const field = app.getByRole('textbox');
  const fontFamily = await field.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily).toMatch(/serif|Newsreader|Lora|Source|Georgia|Literata|Fraunces/i);
  // The focused field sits in the design system's focus ring (2 pt, focus colour), not the browser's default outline.
  const ring = await field.evaluate((el) => {
    for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.borderTopWidth === '2px' && cs.borderTopStyle === 'solid') return { color: cs.borderTopColor, radius: cs.borderTopLeftRadius };
    }
    return null;
  });
  expect(ring).not.toBeNull();
  expect(ring!.color).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  expect(ring!.radius).toBe('8px');
  await step('happy', 'Change words', 'The person may change any word themselves, in the letter face. Done sits in the header where Close was; Save is off while editing.');
  await app.getByTestId('review.edit.done').click();

  // "Does this sound like you?" is gone in v1.0.
  await expect(app.getByText(/sound like you|Not quite|Sounds like me/i)).toHaveCount(0);

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

test('[J06d] a Review link with no draft', async ({ app, record }) => {
  const step = journey(record, 'J06', 'review-and-edits', 13, 'J06-01');
  await seeded(app, 'asha', '/review');
  await expect(app.getByText(/Please try again/)).toBeVisible();
  await step('unhappy', 'Review with no draft', 'If Review is opened with a draft that no longer exists (only reachable by a stale link) the app says the words are safe and offers Close. It is not reachable by tapping.');
});
