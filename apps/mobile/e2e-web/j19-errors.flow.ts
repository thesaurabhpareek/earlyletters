import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J19] a route that does not exist', async ({ app, record }) => {
  const step = journey(record, 'J19', 'errors', 1, 'J00-open');
  await seeded(app, 'asha', '/this-page-does-not-exist');
  await expect(app.getByText('We could not find that page')).toBeVisible();
  // The router's developer page is gone: no sitemap, no address, no route names.
  await expect(app.getByText(/Unmatched Route|Sitemap|this-page-does-not-exist/i)).toHaveCount(0);
  await step('unhappy', 'Unknown route (404)', 'A designed not-found screen in the product voice replaces Expo Router\'s "Unmatched Route" page. It never shows the address, and has one way back: Back to Tonight. Reached by a malformed or old link.');

  await app.getByRole('button', { name: 'Back to Tonight' }).click();
  await expect(app.getByRole('button', { name: 'Speak' })).toBeVisible();
});

// scribe://listen on a phone is sent to Tonight before routing (+native-intent). The web has no system links; opening the
// address directly is the same as a restored or stale screen, which Listen must also refuse to start by itself.
test('[J19] a link to Listen does not start recording by itself', async ({ app, record }) => {
  const step = journey(record, 'J19', 'errors', 2, 'J19-01');
  await seeded(app, 'asha', '/listen');
  await expect(app.getByText('Ready when you are')).toBeVisible();
  await app.waitForTimeout(2500);
  await expect(app.getByText('Listening.')).toHaveCount(0);
  await step('unhappy', 'Listen opened without a tap', 'Opened by a link, a restored screen or a stale route (not by Speak), Listen waits: "Nothing is recording yet. Tap Start when you want to speak." The microphone is not touched. On a phone the scribe://listen link goes to Tonight instead.');
  await app.getByRole('button', { name: 'Start' }).click();
  await expect(app.getByText('Listening.')).toBeVisible();
});
