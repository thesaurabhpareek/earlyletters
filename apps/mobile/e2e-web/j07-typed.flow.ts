import { btn, firstRun, journey, selectedTab, tab } from './support/app';
import { expect, test } from './support/journey';

/**
 * A frame sampler for the arrival wash (5.8 row 5, S26; P5 critics' pass S1). The wash is an absolutely placed,
 * touch-free layer filling the arrived card, from `accentSoft` at full strength to nothing over 1.6 s. This records, once
 * per animation frame, when a Book card first exists and when such a layer first rises above 0.01, so the test can say how
 * long the new card waited for its receipt. The layer has no test id of its own; it is found by what it is.
 */
const watchArrivalWash = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const w: { bookAt: number | null; washAt: number | null } = { bookAt: null, washAt: null };
    (window as unknown as { __wash: typeof w }).__wash = w;
    const t0 = performance.now();
    const tick = () => {
      const now = performance.now();
      const cards = Array.from(document.querySelectorAll('[data-testid="book.card"]'));
      if (cards.length > 0 && w.bookAt === null) w.bookAt = now;
      if (w.washAt === null) {
        for (const card of cards) {
          const box = card.getBoundingClientRect();
          for (const d of Array.from(card.querySelectorAll('div'))) {
            const cs = getComputedStyle(d);
            const r = d.getBoundingClientRect();
            const fills = Math.abs(r.width - box.width) < 2 && Math.abs(r.height - box.height) < 2;
            if (fills && cs.pointerEvents === 'none' && cs.position === 'absolute' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && Number(cs.opacity) > 0.01) w.washAt = now;
          }
        }
      }
      if (now - t0 < 12_000 && w.washAt === null) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

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
  await watchArrivalWash(app);
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Added to Asha's book.")).toBeVisible();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toHaveCount(0);
  await step('happy', 'Saved to the book, no Review', 'One tap keeps a typed letter: no "Read it back" screen. The Keep step runs exactly as for a spoken letter, then the letter files into its month (S20, S21).', undefined, { settle: 120 });
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await expect(app.getByText('You put both hands on the window today and watched the rain.')).toBeVisible();
  await step('happy', 'On the Book', 'The person lands on the Book, on the new letter in its month (5.8 row 5a).', undefined, { settle: 400 });
  // The receipt of the save (5.8 row 5, S26): the Book mounts with the new letter and the card washes within 1.5 s of
  // appearing. This Book was never opened before the keep, so it mounts with `arrived`: the case the wash used to lose.
  await expect.poll(() => app.evaluate(() => (window as unknown as { __wash: { washAt: number | null } }).__wash.washAt), { timeout: 4000, message: 'the new card washes' }).not.toBeNull();
  const wash = await app.evaluate(() => (window as unknown as { __wash: { bookAt: number; washAt: number } }).__wash);
  expect(wash.washAt - wash.bookAt).toBeLessThan(1500);
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
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await write('You laughed at the rain.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText(/Added to/)).toBeVisible();
  // The second-free line is the Book's own toast after the landing (S21), not under the chip.
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
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
