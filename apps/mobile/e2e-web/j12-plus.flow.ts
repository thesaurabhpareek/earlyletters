import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J12] Plus: the Plan screen on a Free book, restore, manage', async ({ app, record }) => {
  const step = journey(record, 'J12', 'plus', 1, 'J11-05');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Plan', { exact: true }).click();
  await expect(app.getByText('Restore purchases')).toBeVisible();
  await step('happy', 'Plan: Plus is off', 'The Plan screen says plainly what is free forever (writing, reading, playing recordings, export, writing with a co-parent) and what Plus adds (Read together after 3 free tries per book, books for more children). Apple handles payment; no card details are seen. There is no Buy button on web: the page says Plus is not available on this device (StoreKit exists only in the iOS app).');
  await app.getByText('Restore purchases', { exact: true }).click();
  await expect(app.getByText(/App Store could not be reached/)).toBeVisible();
  await step('unhappy', 'Restore purchases cannot reach the App Store', 'Restore asks StoreKit. With no store (web) the app answers calmly that the App Store could not be reached and to try again. On a phone with no Plus purchase it would say none was found.');
});
