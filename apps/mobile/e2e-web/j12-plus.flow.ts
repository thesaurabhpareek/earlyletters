import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J12] Plus: the Plan screen on a Free book, restore, manage', async ({ app, record }) => {
  const step = journey(record, 'J12', 'plus', 1, 'J11-05');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Plan', { exact: true }).click();
  await expect(app.getByText('Restore purchases')).toBeVisible();
  await expect(app.getByText('Your first two letters are free. Plus lets you keep adding.').last()).toBeVisible();
  await step('happy', 'Plan: Plus is off', 'The Plan screen says plainly: "Your first two letters are free. Plus lets you keep adding." (no price, no trial length and no count of what is left; Apple\'s own sheet shows those). Every letter kept stays readable, playable and exportable. Apple handles payment; no card details are seen. There is no Buy button and no "Redeem a code" row on web: both need StoreKit, which exists only in the iOS app. NEEDS A REAL IPHONE: See what Plus adds, Redeem a code, Manage subscription.');
  await app.getByText('Restore purchases', { exact: true }).click();
  await expect(app.getByText(/App Store could not be reached/)).toBeVisible();
  await step('unhappy', 'Restore purchases cannot reach the App Store', 'Restore asks StoreKit. With no store (web) the app answers calmly that the App Store could not be reached and to try again. On a phone with no Plus purchase it would say none was found.');
});
