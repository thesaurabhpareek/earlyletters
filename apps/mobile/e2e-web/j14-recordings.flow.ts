import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J14] recordings and spoken language', async ({ app, record }) => {
  const step = journey(record, 'J14', 'recordings-and-language', 1, 'J13-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Recordings', { exact: true }).click();
  await expect(app.getByText('Kept on this phone').first()).toBeVisible();
  await step('happy', 'Recordings', 'Where the voice lives: on this phone and in the iPhone\'s own backup, and how transcription works (tidying, or word for word). The language row shows the speech model for English as not on this phone, 575 MB (it is downloaded natively; on web there is no model).');
});
