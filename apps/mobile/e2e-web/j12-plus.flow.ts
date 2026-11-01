import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J12] Plus: the Plan screen on a Free book, restore, manage', async ({ app, record }) => {
  const step = journey(record, 'J12', 'plus', 1, 'J11-05');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Plan', { exact: true }).click();
  await expect(app.getByText('Restore purchases')).toBeVisible();
  // S41: no status card while Plus is off, and the promise is said once, as the section's footer.
  await expect(app.getByText('Your first two letters are free. Plus lets you keep adding.')).toHaveCount(0);
  // (Settings home stays in the web page under the stack, so its Plan row's line is not counted here.)
  const promise = app.getByText('Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus.', { exact: true });
  await expect(promise).toHaveCount(1);
  await expect(promise).toBeVisible();
  await expect(app.getByText(/Plus lets you keep adding letters\.$/).filter({ visible: true })).toHaveCount(0);
  // No StoreKit on the web: the line that says so in the first row; no Manage subscription without a subscription.
  await expect(app.getByText('Plus is not available on this device yet.')).toBeVisible();
  await expect(app.getByText('Manage subscription')).toHaveCount(0);
  await expect(app.getByText(/\$\d|free trial/i)).toHaveCount(0);
  await step('happy', 'Plan: Plus is off', 'An iOS Settings list. Section Plus: "See what Plus adds" (on web, where there is no StoreKit, the line "Plus is not available on this device yet." in its place), with the promise as the footer, once: every letter kept stays readable, playable and exportable. Then Restore purchases, and the payment line as the footer. No price, no trial length, no count of what is left; Apple\'s own sheet shows those. Manage subscription shows only once a subscription exists. NEEDS A REAL IPHONE: See what Plus adds, Redeem a code, Manage subscription, and the plan names "Plus Monthly" and "Plus Annual" (held for counsel; "Monthly" and "Yearly" until then).');
  await app.getByText('Restore purchases', { exact: true }).click();
  await expect(app.getByTestId('plan.restoreResult').getByText(/App Store could not be reached/)).toBeVisible();
  await step('unhappy', 'Restore purchases cannot reach the App Store', 'Restore asks StoreKit; while it checks, the row reads "Checking with the App Store". With no store (web) the answer shows under the row, with the warning mark: the App Store could not be reached, try again in a moment. On a phone with no Plus purchase it would say none was found.');
});
