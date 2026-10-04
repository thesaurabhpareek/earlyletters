import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J19] a route that does not exist', async ({ app, record }) => {
  const step = journey(record, 'J19', 'errors', 1, 'J00-open');
  await seeded(app, 'asha', '/this-page-does-not-exist');
  await expect(app.getByText(/could not be found/i)).toBeVisible();
  await step('unhappy', 'Unknown route (404)', 'The app has no designed not-found screen: this is Expo Router\'s default "Unmatched Route" page, with a developer-facing "Sitemap" link. Reached only by a malformed deep link. Worth a real screen before launch.');
});
