import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J14] recordings and spoken language', async ({ app, record }) => {
  const step = journey(record, 'J14', 'recordings-and-language', 1, 'J13-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Recordings', { exact: true }).click();
  await expect(app.getByText('Kept on this phone').first()).toBeVisible();
  await expect(app.getByRole('switch', { name: 'Word for word' })).toBeChecked();
  await expect(app.getByText('Small fixes, marked', { exact: true })).toBeVisible();
  await step('happy', 'Recordings', 'Where the voice lives: on this phone and in the iPhone\'s own backup, and how transcription works, with the Word for word switch (small fixes marked, or Exactly as said, for new letters). The language row shows the speech model for English as not on this phone, 575 MB (it is downloaded natively; on web there is no model).');
});

test('[J14b] Word for word switch: new letters open as Exactly as said', async ({ app, record }) => {
  const step = journey(record, 'J14', 'recordings-and-language', 2, 'J14-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Recordings', { exact: true }).click();
  await app.getByRole('switch', { name: 'Word for word' }).click();
  await expect(app.getByText('Exactly as said', { exact: true })).toBeVisible();
  await step('happy', 'Exactly as said by default', 'Turning Word for word off makes new letters open as Exactly as said. A letter can still be switched to small fixes in Review.');
  await app.goBack();
  await app.goBack();
  await app.getByText('Read it back').first().click();
  await expect(app.getByTestId('review.count')).toHaveText('Exactly as you said it.');
  await expect(app.getByTestId('review.view.exact')).toBeVisible();
});
