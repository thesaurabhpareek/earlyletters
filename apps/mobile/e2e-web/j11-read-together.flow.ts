import { btn, firstRun, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

const openRT = async (app: import('@playwright/test').Page) => {
  await app.getByText('Read together', { exact: true }).first().click();
};
/** Where Read together is: the hairline's spoken label ("Letter 1 of 5"); the screen shows no counter. */
const at = (app: import('@playwright/test').Page, n: number, count = 5) => app.getByLabel(`Letter ${n} of ${count}`);
const opener = (app: import('@playwright/test').Page) => app.getByRole('heading', { name: /^Month 6\. / });
/** The header's Close, not "Close the book" on the end page (which may still be leaving after "Read it again"). */
const close = (app: import('@playwright/test').Page) => app.getByRole('button', { name: 'Close', exact: true });

test('[J11] Read together: pages turn, no limit, every time it opens', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J11', 'read-together', 1, 'J09-03');
  await seeded(app);
  await app.getByText('Book', { exact: true }).last().click();
  await expect(opener(app)).toBeVisible();
  await openRT(app);
  await expect(at(app, 1)).toBeAttached();
  await expect(app.getByText(/\d+ \/ \d+/)).toHaveCount(0);
  await expect(app.getByText('The first weeks · From Mama')).toBeVisible();
  await step('happy', 'Read together, first letter', 'Chrome-free, Large print by default: one letter at a time, oldest first. The dateline reads "The first weeks · From Mama" (VoiceOver: "The first weeks, from Mama"); a 2 pt hairline under the top bar shows how far along, never "1 / 5". A "Hear Mama" pill plays the recording on the phone. Read together is free for every letter that exists, with no session limit (D-082, D-083). (Seeded family Asha. Playback itself is native audio and is not exercised on web.)');
  // The button path of the page turn: Next letter moves the page left, the next arrives from the right.
  await btn(app, 'Next letter').click();
  await expect(at(app, 2)).toBeAttached();
  await expect(app.getByText(/^Month \d+ · From Mama$/).last()).toBeVisible();
  await step('happy', 'Next letter', 'Next letter turns the page sideways (24 pt, a fade, no curl); Back one turns it back, and a swipe does the same. The dateline names the month first, then who wrote it: "Month 2 · From Mama".');
  await btn(app, 'Back one').click();
  await expect(at(app, 1)).toBeAttached();
  await btn(app, 'Next letter').click();
  // The page that turned away leaves the screen after its fade; then only the current page's chip is there.
  await expect(app.getByRole('switch', { name: 'Keep playing' })).toHaveCount(1);
  await app.getByRole('switch', { name: 'Keep playing' }).click();
  await expect(app.getByRole('switch', { name: 'Keep playing' })).toBeChecked();
  await step('happy', 'Keep playing', 'A quiet chip under the player, a switch to VoiceOver: when a recording ends the page turns and the next voice starts. It is remembered next time.');
  for (let i = 0; i < 3; i++) await btn(app, 'Next letter').click();
  await btn(app, 'Next letter').click();
  await expect(app.getByText(/Next letter/)).toHaveCount(0);
  await expect(app.getByText('That is every letter so far. More are still being written.')).toBeVisible();
  await step('happy', 'The end of the book', 'After the last letter: the moon draws on once above the line, then nothing moves; "Close the book" and "Read it again".');
  await btn(app, /Read it again/).first().click();
  await expect(at(app, 1)).toBeAttached();
  await close(app).click();
  // A fourth, fifth and sixth opening are still free: this phone is Free (no Plus) and past the free letters.
  for (let i = 0; i < 4; i++) {
    await openRT(app);
    await expect(at(app, 1)).toBeAttached();
    await expect(app.getByText(/Plus/)).toHaveCount(0);
    await close(app).click();
  }
  await expect(opener(app)).toBeVisible();
  await step('happy', 'Opened again and again', 'The fourth opening and every one after it are the same as the first: no Plus gate, nothing counted. Letters that exist are always readable and playable; membership only decides whether a new letter can be kept.');
});

test('[J11b] Read together with nothing in the book yet', async ({ app, record }) => {
  const step = journey(record, 'J11', 'read-together', 7, 'J11-01');
  await firstRun(app);
  await app.goto('/read-together');
  await expect(app.getByText(/Letters you add to the book will be here/)).toBeVisible();
  await expect(btn(app, 'Write a letter')).toBeVisible();
  await step('unhappy', 'Read together with no letters', 'With no letters in the book, Read together says so, shows the moon, and offers "Write a letter" (to Tonight) as well as Close. The Book hides the button until a letter is in the book, so this is reached only by a stale link.');
});

test('[J11c] quiet days are never read together', async ({ app, record }) => {
  const step = journey(record, 'J11', 'read-together', 8, 'J11-01');
  await seeded(app, 'asha-marks');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(opener(app)).toBeVisible();
  await openRT(app);
  // The same five letters as without marks; the two older "Not much today" rows are not pages.
  await expect(at(app, 1)).toBeAttached();
  await expect(app.getByText(/ordinary day|Just Asha, and us/i)).toHaveCount(0);
  await step('happy', 'Read together skips quiet days', 'A quiet-day mark is not a letter: it is never a page, never played and never read aloud, even a row an older build moved into the book. Only letters are pages. (Seeded fictional family Asha, with older-build rows.)');
});
