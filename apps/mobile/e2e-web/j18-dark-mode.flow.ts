import type { Page } from '@playwright/test';
import { btn, journey, selectedTab, tab } from './support/app';
import { expect, seeded, test } from './support/journey';

/**
 * The theme really is dark: the colour behind the middle of the screen is the dark paper (#161412), not the light one
 * (#FBF8F3). The first background found walking up from the element there, so a card or a sheet counts as well as the page.
 * Polled, because a screen that has just arrived may still be fading in. No background found counts as not dark (1).
 */
async function expectDark(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          for (let el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * 0.6); el; el = el.parentElement) {
            const m = getComputedStyle(el).backgroundColor.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/);
            if (m && (m[4] === undefined || Number(m[4]) > 0.5)) return (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255;
          }
          return 1;
        }),
      { message: 'the screen is dark (luminance behind its middle, 0 to 1)', timeout: 5000 },
    )
    .toBeLessThan(0.25);
}

test('[J18] dark mode: the same screens at night', async ({ app, record }) => {
  const step = journey(record, 'J18', 'dark-mode', 1, 'J16-03');
  await seeded(app, 'asha', '/settings/appearance');
  await app.getByText('Dark', { exact: true }).click();
  await app.waitForTimeout(600);
  await expectDark(app);
  await step('happy', 'Appearance: Dark', 'Theme is per phone: Match this phone, Light or Dark. Choosing Dark re-themes every screen at once, and the reading-size sample under it, the person\'s own newest words, takes the dark page too.');

  // A reload keeps the choice: the seeded family is back, and the screens are still dark.
  await app.goto(`${process.env.E2E_WEB_SEED_URL}/?seed=asha`);
  await expect(btn(app, 'Speak')).toBeVisible();
  await expect(app.getByLabel(/^Asha, [67] months/)).toBeVisible();
  await expect(app.getByText('Read it back', { exact: true })).toBeVisible();
  await expectDark(app);
  await step('happy', 'Tonight, dark', 'Tonight at night: the dateline, the one question in the letter face, Speak and Type, and the card for the recording waiting on Review with "Read it back". (Seeded fictional family Asha.)');

  await tab(app, 'Book').click();
  await expect(selectedTab(app, 'Book')).toBeVisible();
  await expect(app.getByRole('heading', { name: /^Month 6\. 2 letters, from Mama\. / })).toBeVisible();
  await expectDark(app);
  await step('happy', 'Book, dark', 'The Book at night: each month opened by its kicker, numeral and dates, with the letters as cards under it, on the dark page. (Seeded fictional family Asha.)');

  await app.getByText(/rained all morning/).first().click();
  await expect(app.getByTestId('player.pill')).toBeVisible();
  await expect(app.getByText('Spoken, with small fixes. Recording kept on this phone.')).toBeVisible();
  await expectDark(app);
  await step('happy', 'A letter, dark', 'The letter page at night: the words in the letter face, signed "From Mama", the pill player ("Hear Mama" and its length), the provenance line and the actions.');

  await app.goBack();
  await tab(app, 'Tonight').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await app.getByText('Read it back', { exact: true }).click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await expect(app.getByTestId('review.sheet')).toBeVisible();
  await expectDark(app);
  await step('happy', 'Review, dark', 'Review at night: the first-time note, the letter on its sheet with each small fix marked in the words (taken-out words struck through), the two views, the row of small fixes, and "Add to Asha\'s book".');

  await btn(app, 'Close').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(1500);
  await expectDark(app);
  await step('happy', 'Listening, dark', 'The listening screen at night. (Fake microphone tone on web.)');
});
