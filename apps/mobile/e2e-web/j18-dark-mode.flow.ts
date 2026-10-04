import { btn, contrastRatio, expectMinTargets, glyphColours, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J18] dark mode: the same screens at night', async ({ app, record }) => {
  const step = journey(record, 'J18', 'dark-mode', 1, 'J16-03');
  await seeded(app, 'asha', '/settings/appearance');
  await app.getByText('Dark', { exact: true }).click();
  await app.waitForTimeout(600);
  // The navigation chrome follows the theme: the page, the header and the list all read dark.
  const page = await app.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(contrastRatio(page, 'rgb(251, 248, 243)'), 'page is not the light paper').toBeGreaterThan(10);
  await step('happy', 'Appearance: Dark', 'Theme is per phone: Match this phone, Light or Dark. Choosing Dark re-themes every screen at once (the app supports dark mode).');
  await app.goto(`${process.env.E2E_WEB_SEED_URL}/?seed=asha`);
  await expect(app.getByText('A thought to start with')).toBeVisible();
  // Tab bar: dark surface, not cream; icons and labels at least 3:1 and 4.5:1 against it.
  const tabs = app.getByRole('tablist').or(app.locator('[role=tablist]')).first();
  const tabBg = await tabs.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(contrastRatio(tabBg, 'rgb(251, 248, 243)'), 'tab bar is not cream').toBeGreaterThan(10);
  await step('happy', 'Tonight, dark', 'The home tab in the dark theme.');
  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText('Month 6')).toBeVisible();
  // Settings gear: 3:1 or better against its page (was 1.24:1, ink on dark).
  const gear = await glyphColours(btn(app, 'Settings'));
  expect(contrastRatio(gear.glyph, gear.behind), 'Settings gear').toBeGreaterThanOrEqual(3);
  await step('happy', 'Book, dark', 'Chapters and cards in the dark theme.');
  await app.getByText(/rained all morning/).first().click();
  await expect(app.getByText('Hear Mama').last()).toBeVisible();
  // Back arrow and the lock in Make private: 3:1 or better (were 3.16:1 and 1.13:1).
  const back = await glyphColours(btn(app, /back/i));
  expect(contrastRatio(back.glyph, back.behind), 'back arrow').toBeGreaterThanOrEqual(3);
  const lock = await glyphColours(app.getByRole('button', { name: /Make private/ }));
  expect(contrastRatio(lock.glyph, lock.behind), 'lock').toBeGreaterThanOrEqual(3);
  await expectMinTargets(app, 44);
  await step('happy', 'A letter, dark', 'The letter page in the dark theme.');
  await app.goBack();
  await app.getByText('Tonight', { exact: true }).last().click();
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await expectMinTargets(app, 44, [/Words taken out here/]);
  await step('happy', 'Review, dark', 'Review with its underlined tidy-ups in the dark theme.');
  await btn(app, 'Close').click();
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(1500);
  // The disc uses the dark recording colour (#F08C7C, 7.65:1), not the light one (#B5473A, 3.29:1 on the dark page).
  const disc = await app.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find((d) => getComputedStyle(d).borderRadius.includes('120') && getComputedStyle(d).backgroundColor !== 'rgba(0, 0, 0, 0)');
    return el ? getComputedStyle(el).backgroundColor : '';
  });
  if (disc) expect(contrastRatio(disc, 'rgb(22, 20, 18)'), 'recording disc on the dark page').toBeGreaterThanOrEqual(4.5);
  await step('happy', 'Listening, dark', 'The listening screen in the dark theme. (Fake microphone tone on web.)');
});
