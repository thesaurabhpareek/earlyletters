import { btn, firstRun, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

const openRT = async (app: import('@playwright/test').Page) => {
  await app.getByText('Read together', { exact: true }).first().click();
};

test('[J11] Read together: a few free tries, then the Plus gate', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J11', 'read-together', 1, 'J09-03');
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('Month 6')).toBeVisible();
  await openRT(app);
  await expect(app.getByText('1 / 5')).toBeVisible();
  await step('happy', 'Read together, first letter', 'Chrome-free, Large Print by default: one letter at a time, oldest first, with a "Hear Mama" player for the recording on the phone. This opening is free try 1 of 3 for this book. (Seeded family Asha. Playback itself is native audio and is not exercised on web.)');
  await btn(app, 'Next letter').click();
  await expect(app.getByText('2 / 5')).toBeVisible();
  await step('happy', 'Next letter', 'Next and Back one move through the book. The date line names who wrote it and the month of age.');
  await app.getByRole('switch').click();
  await step('happy', 'Play the next one on its own', 'A switch turns on autoplay: when a recording ends the page turns and the next voice starts.');
  for (let i = 0; i < 3; i++) await btn(app, 'Next letter').click();
  await btn(app, 'Next letter').click();
  await expect(app.getByText(/Next letter/)).toHaveCount(0);
  await step('happy', 'The end of the book', 'After the last letter: an end line, a finish button and "again".');
  await btn(app, /^Read again|again/i).first().click();
  await expect(app.getByText('1 / 5')).toBeVisible();
  await btn(app, 'Close').click();
  // Second and third openings are still free.
  for (let i = 0; i < 2; i++) {
    await openRT(app);
    await expect(app.getByText('1 / 5')).toBeVisible();
    await btn(app, 'Close').click();
  }
  await openRT(app);
  await expect(app.getByText(/Plus/).first()).toBeVisible();
  await step('unhappy', 'The fourth opening: the Plus gate', 'After the free tries in this book, Read together shows the Plus gate with a plain note that every letter stays readable and playable in the Book. Buying needs StoreKit and Apple\'s store view, which do not exist on web, so the gate says Plus is not available on this device.');
  await btn(app, 'Not now').click();
  await expect(app.getByText('Month 6')).toBeVisible();
  await step('happy', 'Not now returns to the Book', 'Declining closes the gate; nothing is lost or locked.');
});

test('[J11b] Read together with nothing in the book yet', async ({ app, record }) => {
  const step = journey(record, 'J11', 'read-together', 7, 'J11-01');
  await firstRun(app);
  await app.goto('/read-together');
  await expect(app.getByText(/Letters you add to the book will be here/)).toBeVisible();
  await step('unhappy', 'Read together with no letters', 'With no letters in the book, Read together says so and offers Close. The Book hides the button until a letter is in the book, so this is reached only by a stale link.');
});
