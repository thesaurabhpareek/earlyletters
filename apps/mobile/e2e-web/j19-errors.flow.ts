import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J19] a route that does not exist', async ({ app, record }) => {
  const step = journey(record, 'J19', 'errors', 1, 'J00-open');
  await seeded(app, 'asha', '/this-page-does-not-exist');
  // S49: the shared state screen, the window drawing, "Nothing at this link" and one way back.
  await expect(app.getByRole('heading', { name: 'Nothing at this link' })).toBeVisible();
  await expect(app.getByText('Your book is right where you left it.')).toBeVisible();
  // The router's developer page is gone: no sitemap, no address, no route names.
  await expect(app.getByText(/Unmatched Route|Sitemap|this-page-does-not-exist/i)).toHaveCount(0);
  // 20 pt gutters on both sides; the button is full width at the bottom.
  const back = app.getByRole('button', { name: 'Back to Tonight' });
  const box = await back.boundingBox();
  const width = app.viewportSize()!.width;
  expect(box).not.toBeNull();
  expect(Math.round(box!.x)).toBe(20);
  expect(Math.round(width - (box!.x + box!.width))).toBe(20);
  const title = await app.getByRole('heading', { name: 'Nothing at this link' }).boundingBox();
  expect(box!.y).toBeGreaterThan(title!.y + title!.height);
  await step('unhappy', 'Unknown route (404)', 'A designed not-found screen replaces Expo Router\'s "Unmatched Route" page: the shared state screen with the window drawing, "Nothing at this link" and "Your book is right where you left it.", inside 20 pt gutters, with Back to Tonight full width at the bottom. It never shows or logs the address. Reached by a malformed or old link.');

  await app.getByRole('button', { name: 'Back to Tonight' }).click();
  await expect(app.getByRole('button', { name: 'Speak' })).toBeVisible();
});

// scribe://listen on a phone is sent to Tonight before routing (+native-intent): outside links are an allowlist (home, the invite
// landing, sign-in links), so any other path, including /review and /settings/delete-account, also goes to Tonight (unit tests in
// test/coparent-soon.test.ts; a real iPhone check is in the device test plan). The web has no system links; opening the
// address directly is the same as a restored or stale screen, which Listen must also refuse to start by itself.
test('[J19] a link to Listen does not start recording by itself', async ({ app, record }) => {
  const step = journey(record, 'J19', 'errors', 2, 'J19-01');
  await seeded(app, 'asha', '/listen');
  await expect(app.getByText('Tap the red circle and talk.')).toBeVisible();
  await app.waitForTimeout(2500);
  await expect(app.getByText('Listening.')).toHaveCount(0);
  await step('unhappy', 'Listen opened without a tap', 'Opened by a link, a restored screen or a stale route (not by Speak), Listen waits at rest: the red circle and "Tap the red circle and talk." (S12). The microphone is not touched until the circle is tapped. On a phone the scribe://listen link goes to Tonight instead.');
  await app.getByRole('button', { name: 'Start recording' }).click();
  await expect(app.getByText('Listening.')).toBeVisible();
});
